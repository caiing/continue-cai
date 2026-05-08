import crypto from "crypto";
import { EventEmitter as NodeEventEmitter } from "node:events";

import {
  AuthType,
  ControlPlaneSessionInfo,
  HubEnv,
  isHubEnv,
} from "core/control-plane/AuthTypes";
import { getControlPlaneEnvSync } from "core/control-plane/env";
import { Logger } from "core/util/Logger";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import {
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  Disposable,
  env,
  Event,
  EventEmitter,
  ExtensionContext,
  ProgressLocation,
  Uri,
  window,
} from "vscode";

import { PromiseAdapter, promiseFromEvent } from "./promiseUtils";
import { SecretStorage } from "./SecretStorage";
import { UriEventHandler } from "./uriHandler";

export interface LocalLoginServer {
  onCodeReceived: Event<{ code: string; state: string }>;
}

const AUTH_NAME = "Continue";

const controlPlaneEnv = getControlPlaneEnvSync(true ? "production" : "none");

const SESSIONS_SECRET_KEY = `${controlPlaneEnv.AUTH_TYPE}.sessions`;

// Function to generate a random string of specified length
function generateRandomString(length: number): string {
  const possibleCharacters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let randomString = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * possibleCharacters.length);
    randomString += possibleCharacters[randomIndex];
  }
  return randomString;
}

// Function to generate a code challenge from the code verifier

async function generateCodeChallenge(verifier: string) {
  // Create a SHA-256 hash of the verifier
  const hash = crypto.createHash("sha256").update(verifier).digest();

  // Convert the hash to a base64 URL-encoded string
  const base64String = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return base64String;
}

interface ContinueAuthenticationSession extends AuthenticationSession {
  refreshToken: string;
  expiresInMs: number;
  loginNeeded: boolean;
}

export class WorkOsAuthProvider implements AuthenticationProvider, Disposable {
  private _sessionChangeEmitter =
    new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  private _disposable: Disposable;
  private _pendingStates: string[] = [];
  private _codeExchangePromises = new Map<
    string,
    { promise: Promise<string>; cancel: EventEmitter<void> }
  >();
  private _refreshInterval: NodeJS.Timeout | null = null;
  private _isRefreshing = false;

  private static EXPIRATION_TIME_MS = 1000 * 60 * 15; // 15 minutes
  private static REFRESH_INTERVAL_MS = 1000 * 60 * 10; // 10 minutes

  private secretStorage: SecretStorage;

  constructor(
    private readonly context: ExtensionContext,
    private readonly _uriHandler: UriEventHandler,
    private readonly _localLoginServer?: LocalLoginServer,
  ) {
    this._disposable = Disposable.from(
      authentication.registerAuthenticationProvider(
        controlPlaneEnv.AUTH_TYPE,
        AUTH_NAME,
        this,
        { supportsMultipleAccounts: false },
      ),
      window.registerUriHandler(this._uriHandler),
    );

    this.secretStorage = new SecretStorage(context);

    // Immediately refresh any existing sessions
    this.attemptEmitter = new NodeEventEmitter();
    WorkOsAuthProvider.hasAttemptedRefresh = new Promise((resolve) => {
      this.attemptEmitter.on("attempted", resolve);
    });
    void this.refreshSessions();

    // Set up a regular interval to refresh tokens
    this._refreshInterval = setInterval(() => {
      void this.refreshSessions();
    }, WorkOsAuthProvider.REFRESH_INTERVAL_MS);
  }

  private decodeJwt(jwt: string): Record<string, any> | null {
    // 保护原理：增加判空检查，防止因 jwt 未定义导致读取 length 属性出错
    if (!jwt) {
      return null;
    }

    try {
      // 模拟原理：如果是模拟 Token，返回一个一年后过期的载荷
      if (jwt.startsWith("sim_")) {
        return {
          exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
        };
      }

      const decodedToken = JSON.parse(
        Buffer.from(jwt.split(".")[1], "base64").toString(),
      );
      return decodedToken;
    } catch (e: any) {
      // Capture JWT decoding failures to Sentry (could indicate token corruption)
      Logger.error(e, {
        context: "workOS_auth_jwt_decode",
        jwtLength: jwt ? jwt.length : 0,
        jwtPrefix: jwt ? jwt.substring(0, 20) + "..." : "none", // Safe prefix for debugging
      });

      console.warn(`Error decoding JWT: ${e}`);
      return null;
    }
  }

  private jwtIsExpiredOrInvalid(jwt: string): boolean {
    const decodedToken = this.decodeJwt(jwt);
    if (!decodedToken) {
      return true;
    }
    return decodedToken.exp * 1000 < Date.now();
  }

  private getExpirationTimeMs(jwt: string): number {
    const decodedToken = this.decodeJwt(jwt);
    if (!decodedToken) {
      return WorkOsAuthProvider.EXPIRATION_TIME_MS;
    }
    return decodedToken.exp && decodedToken.iat
      ? (decodedToken.exp - decodedToken.iat) * 1000
      : WorkOsAuthProvider.EXPIRATION_TIME_MS;
  }

  private async storeSessions(value: ContinueAuthenticationSession[]) {
    const data = JSON.stringify(value, null, 2);
    await this.secretStorage.store(SESSIONS_SECRET_KEY, data);
  }

  public async getSessions(
    scopes?: string[],
  ): Promise<ContinueAuthenticationSession[]> {
    // await this.hasAttemptedRefresh;
    try {
      const data = await this.secretStorage.get(SESSIONS_SECRET_KEY);
      if (!data) {
        return [];
      }

      const value = JSON.parse(data) as ContinueAuthenticationSession[];
      return value;
    } catch (e: any) {
      // Capture session decrypt and parsing errors to Sentry
      Logger.error(e, {
        context: "workOS_sessions_retrieval",
        errorMessage: e.message,
      });

      console.warn(`Error retrieving or parsing sessions: ${e.message}`);

      // Delete the corrupted cache file to allow fresh start on next attempt
      // This handles cases where decryption succeeded but JSON parsing failed
      try {
        await this.secretStorage.delete(SESSIONS_SECRET_KEY);
      } catch (deleteError: any) {
        console.error(
          `Failed to delete corrupted sessions cache:`,
          deleteError.message,
        );
      }

      return [];
    }
  }

  get onDidChangeSessions() {
    return this._sessionChangeEmitter.event;
  }

  get ideRedirectUri() {
    // We redirect to a page that says "you can close this page", and that page finishes the redirect
    const url = new URL(controlPlaneEnv.APP_URL);
    url.pathname = `/auth/${env.uriScheme}-redirect`;
    return url.toString();
  }

  public static useOnboardingUri: boolean = false;
  get redirectUri() {
    // 使用本地服务器端口作为回调地址，支持从 customAuthConfig 环境变量配置获取
    const authConfig = controlPlaneEnv.customAuthConfig;
    const host = authConfig.LOCAL_SERVER_HOST;
    const port = authConfig.LOCAL_SERVER_PORT;
    const path = authConfig.LOCAL_SERVER_CALLBACK_PATH;
    return `http://${host}:${port}${path}`;
  }

  public static hasAttemptedRefresh: Promise<void>;
  private attemptEmitter: NodeEventEmitter;
  async refreshSessions() {
    // Prevent concurrent refresh operations
    if (this._isRefreshing) {
      return;
    }

    try {
      this._isRefreshing = true;
      await this._refreshSessions();
    } catch (e) {
      // Capture session refresh failures to Sentry
      Logger.error(e, {
        context: "workOS_auth_session_refresh",
        authType: controlPlaneEnv.AUTH_TYPE,
      });

      console.error(`Error refreshing sessions: ${e}`);
    } finally {
      this._isRefreshing = false;
    }
  }

  // It is important that every path in this function emits the attempted event
  // As config loading in core will be locked until refresh is attempted
  private async _refreshSessions(): Promise<void> {
    const sessions = await this.getSessions();
    if (!sessions.length) {
      this.attemptEmitter.emit("attempted");
      return;
    }

    const finalSessions = [];
    for (const session of sessions) {
      try {
        const newSession = await this._refreshSessionWithRetry(
          session.refreshToken,
        );
        finalSessions.push({
          ...session,
          accessToken: newSession.accessToken,
          refreshToken: newSession.refreshToken,
          expiresInMs: newSession.expiresInMs,
        });
      } catch (e: any) {
        // Capture individual session refresh failures to Sentry
        Logger.error(e, {
          context: "workOS_individual_session_refresh",
          sessionId: session.id,
        });

        // If refresh fails (after retries for valid tokens), drop the session
        console.debug(`Error refreshing session token: ${e.message}`);
        this._sessionChangeEmitter.fire({
          added: [],
          removed: [session],
          changed: [],
        });
      }
    }

    await this.storeSessions(finalSessions);
    this._sessionChangeEmitter.fire({
      added: [],
      removed: [],
      changed: finalSessions,
    });
  }

  private async _refreshSessionWithRetry(
    refreshToken: string,
    attempt = 1,
    baseDelay = 1000,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresInMs: number;
  }> {
    try {
      return await this._refreshSession(refreshToken);
    } catch (error: any) {
      // Capture token refresh retry errors to Sentry
      Logger.error(error, {
        attempt,
        errorMessage: error.message,
        isAuthError:
          error.message?.includes("401") ||
          error.message?.includes("Invalid refresh token") ||
          error.message?.includes("Unauthorized"),
      });

      this.attemptEmitter.emit("attempted");
      // Don't retry for auth errors
      if (
        error.message?.includes("401") ||
        error.message?.includes("Invalid refresh token") ||
        error.message?.includes("Unauthorized")
      ) {
        throw error;
      }

      // For network errors or transient server issues, retry with backoff
      // Calculate exponential backoff delay with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5),
        1 * 60 * 1000, // 1 minutes
      );

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this._refreshSessionWithRetry(refreshToken, attempt + 1, baseDelay)
            .then(resolve)
            .catch(reject);
        }, delay);
      });
    } finally {
      this.attemptEmitter.emit("attempted");
    }
  }

  private async _refreshSession(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresInMs: number;
  }> {
    const response = await fetch(
      new URL("/auth/refresh", controlPlaneEnv.CONTROL_PLANE_URL),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      },
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error("Error refreshing token: " + text);
    }
    const data = (await response.json()) as any;
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresInMs: this.getExpirationTimeMs(data.accessToken),
    };
  }

  private _formatProfileLabel(
    firstName: string | null,
    lastName: string | null,
  ) {
    return ((firstName ?? "") + " " + (lastName ?? "")).trim();
  }

  /**
   * Create a new auth session
   * @param scopes
   * @returns
   */
  public async createSession(
    scopes: string[],
  ): Promise<ContinueAuthenticationSession> {
    try {
      console.log("AuthProvider: createSession 被调用");
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      if (!isHubEnv(controlPlaneEnv)) {
        throw new Error("Login is disabled");
      }

      console.log("AuthProvider: 准备调用 login 方法");
      const token = await this.login(codeChallenge, controlPlaneEnv, scopes);
      if (!token) {
        // 当用户关闭浏览器未授权，或者授权超时时，抛出明确错误
        throw new Error(`User cancelled login or login timed out`);
      }

      console.log("AuthProvider: 获取到 Token，准备获取用户信息");
      const userInfo = (await this.getUserInfo(
        token,
        codeVerifier,
        controlPlaneEnv,
      )) as any;
      // const { user, access_token, refresh_token } = userInfo;
      const { ccid, userName, deptName } = userInfo;

      const session: ContinueAuthenticationSession = {
        id: uuidv4(),
        accessToken: token,
        refreshToken: token,
        expiresInMs: this.getExpirationTimeMs(token),
        loginNeeded: false,
        account: {
          label: `${userName} (${deptName})`,
          id: ccid,
        },
        scopes: [],
      };

      await this.storeSessions([session]);

      this._sessionChangeEmitter.fire({
        added: [session],
        removed: [],
        changed: [],
      });

      return session;
    } catch (e) {
      // Capture authentication failures to Sentry
      Logger.error(e, {
        context: "workOS_auth_session_creation",
        scopes: scopes.join(","),
        authType: controlPlaneEnv.AUTH_TYPE,
      });

      void window.showErrorMessage(`Sign in failed: ${e}`);
      throw e;
    }
  }

  /**
   * Remove an existing session
   * @param sessionId
   */
  public async removeSession(sessionId: string): Promise<void> {
    const sessions = await this.getSessions();
    const sessionIdx = sessions.findIndex((s) => s.id === sessionId);
    const session = sessions[sessionIdx];
    sessions.splice(sessionIdx, 1);

    await this.storeSessions(sessions);

    if (session) {
      this._sessionChangeEmitter.fire({
        added: [],
        removed: [session],
        changed: [],
      });
    }
  }

  /**
   * Dispose the registered services
   */
  public async dispose() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }
    this._disposable.dispose();
  }

  /**
   * Log in to Continue
   */
  private async login(
    codeChallenge: string,
    hubEnv: HubEnv,
    scopes: string[] = [],
  ) {
    console.log("AuthProvider: 进入 login 方法");
    const stateId = uuidv4();

    this._pendingStates.push(stateId);

    const scopeString = scopes.join(" ");

    const authConfig = hubEnv.customAuthConfig;
    console.log("AuthProvider: 获取到 authConfig", authConfig);
    const loginUrl = authConfig.LOGIN_URL;
    console.log("AuthProvider: 准备构造 URL:", loginUrl);
    console.log("AuthProvider: 准备构造 stateId:", stateId);
    const url = new URL(loginUrl);
    const params = {
        siteCode: Buffer.from(authConfig.SITE_CODE).toString("base64"),
        app: Buffer.from(authConfig.SITE_NAME).toString("base64"),
        callBackUrl: Buffer.from(`${this.redirectUri}?state=${stateId}`).toString("base64"),
    };

    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key as keyof typeof params]),
    );

    const oauthUrl = url;
    if (oauthUrl) {
      console.log(`AuthProvider: 准备调用 env.openExternal: ${oauthUrl.toString()}`);
      // 使用异步不阻塞的方式打开链接，避免因为用户未授权导致整个登录流死锁
      env.openExternal(Uri.parse(oauthUrl.toString())).then((success) => {
        if (!success) {
          console.error("AuthProvider: 打开外部链接失败");
        } else {
          console.log("AuthProvider: 外部链接已触发打开");
        }
      }).catch(err => {
        console.error("AuthProvider: 调用 env.openExternal 抛出异常", err);
      });
    } else {
      console.log("AuthProvider: oauthUrl 为空，直接返回");
      return;
    }

    console.log("AuthProvider: 准备注册回调监听");
    let codeExchangePromise = this._codeExchangePromises.get(scopeString);
    if (!codeExchangePromise) {
      if (this._localLoginServer) {
        console.log("AuthProvider: 使用本地服务器监听回调");
        codeExchangePromise = promiseFromEvent(
          this._localLoginServer.onCodeReceived,
          async (data, resolve, reject) => {
            if (this._pendingStates.some((n) => n === data.state)) {
              resolve(data.code);
            } else {
              reject(new Error("State not found"));
            }
          },
        );
      } else {
        console.log("AuthProvider: 回退使用 URI Handler 监听回调");
        codeExchangePromise = promiseFromEvent(
          this._uriHandler.event,
          this.handleUri(scopes),
        );
      }
      this._codeExchangePromises.set(scopeString, codeExchangePromise);
    } else {
       console.log("AuthProvider: 发现旧的 Promise 残留，先取消它");
       codeExchangePromise.cancel.fire();
       this._codeExchangePromises.delete(scopeString);

       if (this._localLoginServer) {
        codeExchangePromise = promiseFromEvent(
          this._localLoginServer.onCodeReceived,
          async (data, resolve, reject) => {
            if (this._pendingStates.some((n) => n === data.state)) {
              resolve(data.code);
            } else {
              reject(new Error("State not found"));
            }
          },
        );
      } else {
        codeExchangePromise = promiseFromEvent(
          this._uriHandler.event,
          this.handleUri(scopes),
        );
      }
      this._codeExchangePromises.set(scopeString, codeExchangePromise);
    }

    console.log("AuthProvider: 开始等待 Promise.race，设置超时机制");
    try {
      return await Promise.race([
        codeExchangePromise.promise,
        new Promise<string>(
          (_, reject) =>
            setTimeout(() => reject(new Error("Login Cancelled by timeout")), 1 * 60 * 1000), // 1min timeout
        ),
      ]);
    } finally {
      console.log("AuthProvider: Promise.race 结束，清理状态");
      this._pendingStates = this._pendingStates.filter(
        (n) => n !== stateId,
      );
      codeExchangePromise?.cancel.fire();
      this._codeExchangePromises.delete(scopeString);
    }
  }

  /**
   * Handle the redirect to VS Code (after sign in from Continue)
   * @param scopes
   * @returns
   */
  private handleUri: (
    scopes: readonly string[],
  ) => PromiseAdapter<Uri, string> =
    (scopes) => async (uri, resolve, reject) => {
      const query = new URLSearchParams(uri.query);
      const access_token = query.get("code");
      const state = query.get("state");

      if (!access_token) {
        reject(new Error("No token"));
        return;
      }
      if (!state) {
        reject(new Error("No state"));
        return;
      }

      // Check if it is a valid auth request started by the extension
      if (!this._pendingStates.some((n) => n === state)) {
        reject(new Error("State not found"));
        return;
      }

      resolve(access_token);
    };

  /**
   * Get the user info from WorkOS
   * @param token
   * @returns
   */
  private async getUserInfo(
    token: string,
    codeVerifier: string,
    hubEnv: HubEnv,
  ) {
    // 模拟原理：如果 token 是以 "sim_" 开头的模拟授权码，直接返回模拟的用户信息。
    // 这避免了向真实的 WorkOS API 发送无效请求，解决了模拟登录时因无法交换 Token 导致的报错。
    if (token && token.startsWith("sim_")) {
      return {
        ccid: "123456789",
        userName: "developer",
        deptName: "test",
        access_token: "sim_access_token_" + Math.random().toString(36).substring(7),
        refresh_token: "sim_refresh_token_" + Math.random().toString(36).substring(7),
      };
    }

    const userInfoBaseUrl = hubEnv.customAuthConfig.USER_INFO_URL;
    const resp = await fetch(
      `${userInfoBaseUrl}${token}`,
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        }
      },
    );
    const text = await resp.text();
    const res = JSON.parse(text);
    const data = JSON.parse(res.data);
    return data;
  }
}

export async function getControlPlaneSessionInfo(
  silent: boolean,
  useOnboarding: boolean,
): Promise<ControlPlaneSessionInfo | undefined> {
  if (!isHubEnv(controlPlaneEnv)) {
    return {
      AUTH_TYPE: AuthType.OnPrem,
    };
  }

  try {
    if (useOnboarding) {
      WorkOsAuthProvider.useOnboardingUri = true;
    }
    await WorkOsAuthProvider.hasAttemptedRefresh;
    const session = await authentication.getSession(
      controlPlaneEnv.AUTH_TYPE,
      [],
      silent ? { silent: true } : { createIfNone: true },
    );
    if (!session) {
      return undefined;
    }
    return {
      AUTH_TYPE: controlPlaneEnv.AUTH_TYPE,
      accessToken: session.accessToken,
      account: {
        id: session.account.id,
        label: session.account.label,
      },
    };
  } finally {
    WorkOsAuthProvider.useOnboardingUri = false;
  }
}
