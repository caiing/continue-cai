import crypto from "crypto";
import { EventEmitter as NodeEventEmitter } from "node:events";

import {
  AuthType,
  ControlPlaneEnv,
  ControlPlaneSessionInfo,
  isHubEnv
} from "core/control-plane/AuthTypes";
import { getControlPlaneEnvSync } from "core/control-plane/env";
import { Logger } from "core/util/Logger";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import * as vscode from "vscode";
import {
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  Disposable,
  env,
  EventEmitter,
  ExtensionContext,
  Uri,
  window
} from "vscode";

import { LocalLoginServer } from "../activation/localServer";
import { PromiseAdapter, promiseFromEvent } from "./promiseUtils";
import { SecretStorage } from "./SecretStorage";
import { UriEventHandler } from "./uriHandler";

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

    // Initialize refresh-attempt gate for downstream flows
    this.attemptEmitter = new NodeEventEmitter();
    WorkOsAuthProvider.hasAttemptedRefresh = new Promise((resolve) => {
      this.attemptEmitter.on("attempted", resolve);
    });

    // Disable session auto-refresh: immediately unblock dependent flows
    this.attemptEmitter.emit("attempted");
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

      // 检查登录状态并通知 VS Code
      void vscode.commands.executeCommand(
        "setContext",
        "continue.isSignedInToControlPlane",
        value.length > 0,
      );

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
    // 使用本地服务器端口作为回调地址
    const url = new URL(
      `http://${LocalLoginServer.HOST}:${LocalLoginServer.PORT}`,
    );
    url.pathname = LocalLoginServer.CALLBACK_PATH;
    return url.toString();
  }

  public static hasAttemptedRefresh: Promise<void>;
  private attemptEmitter: NodeEventEmitter;
  async refreshSessions() {
    // Disable session refresh, only signal that refresh has been attempted.
    this.attemptEmitter.emit("attempted");
    return;
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

      // 如果不是 HubEnv，则要求必须配置了 APP_URL 才能登录
      if (!isHubEnv(controlPlaneEnv) && !controlPlaneEnv.APP_URL) {
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
    controlPlaneEnv: ControlPlaneEnv,
    scopes: string[] = [],
  ) {
    console.log("AuthProvider: 进入 login 方法");
    const stateId = uuidv4();

    this._pendingStates.push(stateId);

    const scopeString = scopes.join(" ");

    console.log("AuthProvider: 获取到环境配置", controlPlaneEnv);
    const appUrl = controlPlaneEnv.APP_URL;
    if (!appUrl) {
      console.log("AuthProvider: appUrl 为空，直接返回");
      return;
    }

    console.log("AuthProvider: 准备构造 URL:", appUrl);
    console.log("AuthProvider: 准备构造 stateId:", stateId);
    let loginUrl = appUrl;
    if (!loginUrl.endsWith(".html")) {
      if (!loginUrl.endsWith("/")) {
        loginUrl += "/";
      }
      loginUrl += "authmanager/continue_login"
    }
    console.log("loginUrl!!!!:", loginUrl);
    const url = new URL(loginUrl);
    const params = {
      siteCode: Buffer.from(appUrl).toString("base64"),
      app: Buffer.from("f-taas").toString("base64"),
      callBackUrl: Buffer.from(`${this.redirectUri}?state=${stateId}`).toString(
        "base64",
      ),
    };

    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key as keyof typeof params]),
    );

    const oauthUrl = url;
    if (oauthUrl) {
      console.log(
        `AuthProvider: 准备调用 env.openExternal: ${oauthUrl.toString()}`,
      );
      // 使用 Promise.resolve 包装 Thenable，以便使用 .catch 方法
      Promise.resolve(env.openExternal(Uri.parse(oauthUrl.toString())))
        .then((success) => {
          if (!success) {
            console.error("AuthProvider: 打开外部链接失败");
          } else {
            console.log("AuthProvider: 外部链接已触发打开");
          }
        })
        .catch((err) => {
          console.error("AuthProvider: 调用 env.openExternal 抛出异常", err);
        });
    } else {
      console.log("AuthProvider: oauthUrl 为空，直接返回");
      return;
    }

    console.log("AuthProvider: 准备注册回调监听");
    const oldPromise = this._codeExchangePromises.get(scopeString);
    if (oldPromise) {
      console.log("AuthProvider: 发现旧的 Promise 残留，先取消它");
      oldPromise.cancel.fire();
    }

    const uriPromise = promiseFromEvent(
      this._uriHandler.event,
      this.handleUri(scopes),
    );

    let codeExchangePromise: { promise: Promise<string>; cancel: EventEmitter<void> };

    if (this._localLoginServer) {
      console.log("AuthProvider: 同时开启本地服务器和 URI Handler 监听回调");
      const localPromise = promiseFromEvent<{ code: string; state: string }, string>(
        this._localLoginServer.onCodeReceived,
        async (data, resolve, reject) => {
          if (this._pendingStates.some((n) => n === data.state)) {
            resolve(data.code);
          } else {
            reject(new Error("State not found"));
          }
        },
      );

      const combinedCancel = new EventEmitter<void>();
      codeExchangePromise = {
        promise: Promise.race([uriPromise.promise, localPromise.promise]),
        cancel: combinedCancel,
      };

      combinedCancel.event(() => {
        uriPromise.cancel.fire();
        localPromise.cancel.fire();
      });
    } else {
      console.log("AuthProvider: 使用 URI Handler 监听回调");
      codeExchangePromise = uriPromise;
    }
    this._codeExchangePromises.set(scopeString, codeExchangePromise);

    console.log("AuthProvider: 开始等待 Promise.race，设置超时机制");
    try {
      return await Promise.race([
        codeExchangePromise.promise,
        new Promise<string>(
          (_, reject) =>
            setTimeout(
              () => reject(new Error("Login Cancelled by timeout")),
              0.5 * 60 * 1000,
            ), // 0.5min timeout
        ),
      ]);
    } finally {
      console.log("AuthProvider: Promise.race 结束，清理状态");
      this._pendingStates = this._pendingStates.filter((n) => n !== stateId);
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
    controlPlaneEnv: ControlPlaneEnv,
  ) {
    // 模拟原理：如果 token 是以 "sim_" 开头的模拟授权码，直接返回模拟的用户信息。
    // 这避免了向真实的 WorkOS API 发送无效请求，解决了模拟登录时因无法交换 Token 导致的报错。
    if (token && token.startsWith("sim_")) {
      return {
        ccid: "123456789",
        userName: "developer",
        deptName: "test",
        access_token:
          "sim_access_token_" + Math.random().toString(36).substring(7),
        refresh_token:
          "sim_refresh_token_" + Math.random().toString(36).substring(7),
      };
    }

    const appUrl = controlPlaneEnv.APP_URL;
    console.log("getUserInfo appUrl:" + appUrl);
    if (!appUrl) {
      throw new Error("APP_URL is not configured");
    }
    let userInfoUrl = appUrl;
    if (!userInfoUrl.endsWith("/")) {
      userInfoUrl += "/";
    }
    const resp = await fetch(`${userInfoUrl}authmanager/token/v1/${token}`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    });
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
  // 如果既不是 HubEnv，也没有配置 APP_URL，则视为 OnPrem 模式
  if (!isHubEnv(controlPlaneEnv) && !controlPlaneEnv.APP_URL) {
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
