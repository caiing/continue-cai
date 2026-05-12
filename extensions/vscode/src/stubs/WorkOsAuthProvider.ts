// 导入 Node.js 加密模块
import crypto from "crypto";
// 导入 Node.js HTTPS 模块
import https from "https";
// 导入 Node.js 事件触发器模块
import { EventEmitter as NodeEventEmitter } from "node:events";

// 导入核心逻辑中的身份验证相关类型和工具
import {
  AuthType,
  ControlPlaneEnv,
  ControlPlaneSessionInfo,
  isHubEnv
} from "core/control-plane/AuthTypes";
// 导入获取控制面环境配置的工具函数
import { getControlPlaneEnvSync } from "core/control-plane/env";
// 导入日志记录工具
import { Logger } from "core/util/Logger";
// 导入用于网络请求的 node-fetch 库
import fetch from "node-fetch";
// 导入 UUID 生成工具
import { v4 as uuidv4 } from "uuid";
// 导入 VS Code API 及其常用类定义
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

// 导入本地登录服务器类
import { LocalLoginServer } from "../activation/localServer";
// 导入 Promise 适配器和事件转 Promise 的工具
import { PromiseAdapter, promiseFromEvent } from "./promiseUtils";
// 导入私密存储封装类
import { SecretStorage } from "./SecretStorage";
// 导入 URI 事件处理器类
import { UriEventHandler } from "./uriHandler";

// 身份验证提供者的名称
const AUTH_NAME = "Continue";

// 同步获取当前的控制面环境配置
const controlPlaneEnv = getControlPlaneEnvSync(true ? "production" : "none");

// 存储会话信息的 SecretStorage 键名
const SESSIONS_SECRET_KEY = `${controlPlaneEnv.AUTH_TYPE}.sessions`;

/**
 * 生成指定长度的随机字符串，通常用于 OAuth 的 state 或 code_verifier
 * @param length 字符串长度
 */
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

/**
 * 根据 code_verifier 生成 code_challenge（用于 PKCE 流程）
 * @param verifier 验证字符串
 */
async function generateCodeChallenge(verifier: string) {
  // 对验证字符串进行 SHA-256 哈希
  const hash = crypto.createHash("sha256").update(verifier).digest();

  // 将哈希值转换为 Base64 URL 编码格式
  const base64String = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return base64String;
}

/**
 * 扩展 VS Code 的标准身份验证会话，添加刷新令牌和过期时间
 */
interface ContinueAuthenticationSession extends AuthenticationSession {
  refreshToken: string; // 刷新令牌
  expiresInMs: number; // 过期时间（毫秒）
  loginNeeded: boolean; // 是否需要重新登录
}

/**
 * 基于 WorkOS 或自定义 OAuth 流程的身份验证提供者实现
 */
export class WorkOsAuthProvider implements AuthenticationProvider, Disposable {
  // 会话变更事件触发器
  private _sessionChangeEmitter =
    new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  // 资源释放列表
  private _disposable: Disposable;
  // 等待回调的 state 列表
  private _pendingStates: string[] = [];
  // 存储正在进行的授权码交换 Promise
  private _codeExchangePromises = new Map<
    string,
    { promise: Promise<string>; cancel: EventEmitter<void> }
  >();
  // 刷新定时器
  private _refreshInterval: NodeJS.Timeout | null = null;
  // 是否正在刷新中
  private _isRefreshing = false;

  // 默认过期时间（15分钟）和刷新间隔（10分钟）
  private static EXPIRATION_TIME_MS = 1000 * 60 * 15;
  private static REFRESH_INTERVAL_MS = 1000 * 60 * 10;

  // 私密存储实例
  private secretStorage: SecretStorage;

  /**
   * 构造函数
   * @param context 扩展上下文
   * @param _uriHandler 处理 vscode:// 回调的处理器
   * @param _localLoginServer 处理 http://127.0.0.1 回调的本地服务器
   */
  constructor(
    private readonly context: ExtensionContext,
    private readonly _uriHandler: UriEventHandler,
    private readonly _localLoginServer?: LocalLoginServer,
  ) {
    // 注册自身为 VS Code 的身份验证提供者，并注册 URI 处理器
    this._disposable = Disposable.from(
      authentication.registerAuthenticationProvider(
        controlPlaneEnv.AUTH_TYPE,
        AUTH_NAME,
        this,
        { supportsMultipleAccounts: false },
      ),
      window.registerUriHandler(this._uriHandler),
    );

    // 初始化私密存储工具，传入扩展上下文 context 以访问 VS Code 安全存储 API
    this.secretStorage = new SecretStorage(context);

    // 初始化刷新尝试机制
    // 初始化刷新尝试的事件触发器
    this.attemptEmitter = new NodeEventEmitter();
    // 创建一个静态 Promise，用于协调下游流程：当监听到 "attempted" 事件时 resolve
    // 这样其他组件可以等待 WorkOsAuthProvider 完成初次的会话刷新尝试
    WorkOsAuthProvider.hasAttemptedRefresh = new Promise((resolve) => {
      this.attemptEmitter.on("attempted", resolve);
    });

    // 禁用自动刷新，立即解开下游流程
    this.attemptEmitter.emit("attempted");
  }

  /**
   * 解码 JWT 令牌
   * @param jwt JWT 字符串
   */
  private decodeJwt(jwt: string): Record<string, any> | null {
    if (!jwt) {
      return null;
    }

    try {
      // 如果是模拟令牌，返回长期不过期的载荷
      if (jwt.startsWith("sim_")) {
        return {
          exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
        };
      }

      // 解码 Base64 格式的载荷部分
      const decodedToken = JSON.parse(
        Buffer.from(jwt.split(".")[1], "base64").toString(),
      );
      return decodedToken;
    } catch (e: any) {
      // 记录解码失败到日志
      Logger.error(e, {
        context: "workOS_auth_jwt_decode",
        jwtLength: jwt ? jwt.length : 0,
        jwtPrefix: jwt ? jwt.substring(0, 20) + "..." : "none",
      });

      console.warn(`解码 JWT 出错: ${e}`);
      return null;
    }
  }

  /**
   * 检查 JWT 是否已过期或无效
   */
  private jwtIsExpiredOrInvalid(jwt: string): boolean {
    const decodedToken = this.decodeJwt(jwt);
    if (!decodedToken) {
      return true;
    }
    return decodedToken.exp * 1000 < Date.now();
  }

  /**
   * 获取令牌的有效时长（毫秒）
   */
  private getExpirationTimeMs(jwt: string): number {
    const decodedToken = this.decodeJwt(jwt);
    if (!decodedToken) {
      return WorkOsAuthProvider.EXPIRATION_TIME_MS;
    }
    return decodedToken.exp && decodedToken.iat
      ? (decodedToken.exp - decodedToken.iat) * 1000
      : WorkOsAuthProvider.EXPIRATION_TIME_MS;
  }

  /**
   * 将会话列表持久化存储到 SecretStorage
   */
  private async storeSessions(value: ContinueAuthenticationSession[]) {
    const data = JSON.stringify(value, null, 2);
    await this.secretStorage.store(SESSIONS_SECRET_KEY, data);
  }

  /**
   * 获取当前存储的所有会话
   * @param scopes 权限范围（可选）
   */
  public async getSessions(
    scopes?: string[],
  ): Promise<ContinueAuthenticationSession[]> {
    try {
      // 从私密存储中获取加密存储的会话 JSON 字符串
      const data = await this.secretStorage.get(SESSIONS_SECRET_KEY);
      // 如果存储中没有数据，说明用户未登录，返回空数组
      if (!data) {
        return [];
      }

      // 将 JSON 字符串解析为会话对象数组
      const value = JSON.parse(data) as ContinueAuthenticationSession[];

      // 同步登录状态到 VS Code 上下文，以便控制 UI 显示
      const env = getControlPlaneEnvSync("production");
      void vscode.commands.executeCommand(
        "setContext",
        "continue.isSignedInToControlPlane",
        value.length > 0 || !env.LOGIN_REQUIRED,
      );

      return value;
    } catch (e: any) {
      // 处理解密或解析失败，防止插件崩溃
      Logger.error(e, {
        context: "workOS_sessions_retrieval",
        errorMessage: e.message,
      });

      console.warn(`检索或解析会话出错: ${e.message}`);

      // 如果数据损坏，删除缓存以便下次重试
      try {
        await this.secretStorage.delete(SESSIONS_SECRET_KEY);
      } catch (deleteError: any) {
        console.error(
          `删除损坏的会话缓存失败:`,
          deleteError.message,
        );
      }

      return [];
    }
  }

  /**
   * 监听会话变更事件
   */
  get onDidChangeSessions() {
    return this._sessionChangeEmitter.event;
  }

  /**
   * 获取 IDE 端的重定向 URI
   */
  get ideRedirectUri() {
    const url = new URL(controlPlaneEnv.APP_URL);
    url.pathname = `/auth/${env.uriScheme}-redirect`;
    return url.toString();
  }

  // 静态标记，控制是否使用 onboarding URI
  public static useOnboardingUri: boolean = false;
  /**
   * 获取 OAuth 流程的重定向回调 URI
   */
  get redirectUri() {
    // 优先使用本地服务器端口作为回调地址，提升成功率
    const url = new URL(
      `http://${LocalLoginServer.HOST}:${LocalLoginServer.PORT}`,
    );
    url.pathname = LocalLoginServer.CALLBACK_PATH;
    return url.toString();
  }

  // 静态 Promise，用于标识是否已经尝试过刷新会话，供外部（如 getControlPlaneSessionInfo）同步等待
  public static hasAttemptedRefresh: Promise<void>;
  // 内部事件触发器，用于控制 hasAttemptedRefresh 的状态切换
  private attemptEmitter: NodeEventEmitter;
  /**
   * 刷新会话（目前已禁用自动刷新逻辑）
   */
  async refreshSessions() {
    this.attemptEmitter.emit("attempted");
    return;
  }

  /**
   * 格式化用户姓名显示
   */
  private _formatProfileLabel(
    firstName: string | null,
    lastName: string | null,
  ) {
    return ((firstName ?? "") + " " + (lastName ?? "")).trim();
  }

  /**
   * 创建新的身份验证会话（核心登录流程）
   * @param scopes 权限范围
   */
  public async createSession(
    scopes: string[],
  ): Promise<ContinueAuthenticationSession> {
    try {
      console.log("AuthProvider: createSession 被调用");
      // 生成 PKCE 验证码
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // 检查环境配置
      if (!isHubEnv(controlPlaneEnv) && !controlPlaneEnv.APP_URL) {
        throw new Error("登录功能已禁用");
      }

      console.log("AuthProvider: 准备调用 login 方法");
      // 调用登录逻辑，打开浏览器并等待授权码回调
      const loginResult = await this.login(codeChallenge, controlPlaneEnv, scopes);
      if (!loginResult) {
        throw new Error(`用户取消登录或授权超时`);
      }
      const { token, stateId } = loginResult;

      console.log("AuthProvider: 获取到 Token，准备获取用户信息");
      // 使用授权码交换用户信息
      let userInfo;
      try {
        userInfo = (await this.getUserInfo(
          token,
          codeVerifier,
          controlPlaneEnv,
        )) as any;

        // 如果获取用户信息成功，通知本地服务器返回成功页面
        this._localLoginServer?.finishResponse(stateId, true);
      } catch (err) {
        // 如果获取用户信息失败，通知本地服务器返回失败页面
        this._localLoginServer?.finishResponse(stateId, false, `用户信息: ${err}`);
        throw err;
      }

      const { ccid, userName, deptName } = userInfo;

      // 构造 VS Code 会话对象
      // 构造符合 VS Code 标准且包含扩展信息的会话对象
      const session: ContinueAuthenticationSession = {
        id: uuidv4(), // 生成会话的唯一标识符
        accessToken: token, // 存储获取到的访问令牌
        refreshToken: token, // 存储刷新令牌（在此流程中与访问令牌一致）
        expiresInMs: this.getExpirationTimeMs(token), // 计算并设置令牌的有效期（毫秒）
        loginNeeded: false, // 标记当前不需要重新登录
        account: {
          label: `${userName} (${deptName})`, // 在 VS Code 账户列表中显示的标签，格式为“姓名 (部门)”
          id: ccid, // 用户的唯一 ID（如员工工号或系统 ID）
        },
        scopes: [], // 权限范围，目前为空
      };

      // 存储会话并通知 VS Code
      await this.storeSessions([session]);

      // 触发会话变更事件，通知 VS Code 身份验证系统有一个新会话已添加
      // 这会同步触发 VS Code UI 更新，并通知其他监听该身份验证提供者的组件
      this._sessionChangeEmitter.fire({
        added: [session], // 新增的会话对象数组
        removed: [],      // 被移除的会话对象数组
        changed: [],      // 已修改的会话对象数组
      });

      return session;
    } catch (e) {
      // 记录登录失败到日志并弹出错误提示
      Logger.error(e, {
        context: "workOS_auth_session_creation",
        scopes: scopes.join(","),
        authType: controlPlaneEnv.AUTH_TYPE,
      });

      void window.showErrorMessage(`登录失败: ${e}`);
      throw e;
    }
  }

  /**
   * 删除指定的会话（退出登录）
   * @param sessionId 会话 ID
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
   * 释放资源
   */
  public async dispose() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }
    this._disposable.dispose();
  }

  /**
   * 登录核心逻辑：打开浏览器并监听授权码回调
   * @param codeChallenge PKCE 质询码
   * @param controlPlaneEnv 环境配置
   * @param scopes 权限范围
   */
  private async login(
    codeChallenge: string,
    controlPlaneEnv: ControlPlaneEnv,
    scopes: string[] = [],
  ): Promise<{ token: string; stateId: string } | undefined> {
    console.log("AuthProvider: 进入 login 方法");
    // 生成一个唯一的会话状态 ID (stateId)，用于 OAuth 安全校验，防止 CSRF 攻击
    const stateId = uuidv4();

    // 将生成的 stateId 存入挂起状态列表，以便在回调时进行校验
    this._pendingStates.push(stateId);

    // 将权限范围数组转换为以空格分隔的字符串，用于标识不同的权限请求
    const scopeString = scopes.join(" ");

    // 从环境配置中获取控制面（Control Plane）的应用基础 URL
    const appUrl = controlPlaneEnv.APP_URL;
    if (!appUrl) {
      console.log("AuthProvider: appUrl 为空，直接返回");
      return;
    }

    // 构造登录页面的 URL
    let loginUrl = appUrl;
    if (!loginUrl.endsWith(".html")) {
      if (!loginUrl.endsWith("/")) {
        loginUrl += "/";
      }
      loginUrl += "authmanager/continue_login"
    }
    const url = new URL(loginUrl);
    const params = {
      siteCode: Buffer.from(`${appUrl}#/`).toString("base64"),
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
      // 调用系统浏览器打开授权页
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
      return;
    }

    // 处理旧的 Promise 残留，确保单一登录流程
    const oldPromise = this._codeExchangePromises.get(scopeString);
    if (oldPromise) {
      oldPromise.cancel.fire();
    }

    // 注册 URI Handler 监听 (vscode:// 回调)
    const uriPromise = promiseFromEvent(
      this._uriHandler.event,
      this.handleUri(scopes),
    );

    // 定义用于存储授权码交换逻辑的对象，包含一个 Promise 和一个用于取消监听的触发器
    let codeExchangePromise: { promise: Promise<string>; cancel: EventEmitter<void> };

    // 如果启用了本地服务器，则同时通过 Race 竞争两个回调来源（本地服务器 vs 协议唤起）
    if (this._localLoginServer) {
      // 创建一个基于本地服务器事件的 Promise
      const localPromise = promiseFromEvent<{ code: string; state: string }, string>(
        this._localLoginServer.onCodeReceived, // 监听本地服务器接收到的授权码事件
        async (data, resolve, reject) => {
          // 校验回调中的 state 是否在挂起列表中，防止伪造请求
          if (this._pendingStates.some((n) => n === data.state)) {
            resolve(data.code); // 校验成功，返回授权码
          } else {
            reject(new Error("State 校验失败")); // 校验失败
          }
        },
      );

      // 创建一个组合取消触发器，用于同时取消两个监听源
      const combinedCancel = new EventEmitter<void>();
      codeExchangePromise = {
        // 使用 Promise.race，谁先返回授权码就用谁的结果（协议唤起 vs 本地服务器）
        promise: Promise.race([uriPromise.promise, localPromise.promise]),
        cancel: combinedCancel,
      };

      // 当执行取消操作时，同时触发两个监听源的取消逻辑
      combinedCancel.event(() => {
        uriPromise.cancel.fire();
        localPromise.cancel.fire();
      });
    } else {
      // 如果没有本地服务器，则仅使用 URI 协议唤起作为唯一来源
      codeExchangePromise = uriPromise;
    }
    // 将构造好的 Promise 对象存入映射表，以便后续管理
    this._codeExchangePromises.set(scopeString, codeExchangePromise);

    // 等待授权结果，设置 30 秒超时
    try {
      const token = await Promise.race([
        codeExchangePromise.promise,
        new Promise<string>(
          (_, reject) =>
            setTimeout(
              () => reject(new Error("登录因超时已取消")),
              0.5 * 60 * 1000,
            ),
        ),
      ]);
      return { token, stateId };
    } finally {
      // 清理状态
      this._pendingStates = this._pendingStates.filter((n) => n !== stateId);
      codeExchangePromise?.cancel.fire();
      this._codeExchangePromises.delete(scopeString);
    }
  }

  /**
   * 处理从 vscode:// 协议传回的 URI 回调
   * @param scopes 权限范围
   */
  private handleUri: (
    scopes: readonly string[],
  ) => PromiseAdapter<Uri, string> =
    (scopes) => async (uri, resolve, reject) => {
      const query = new URLSearchParams(uri.query);
      const access_token = query.get("code");
      const state = query.get("state");

      if (!access_token) {
        reject(new Error("未获取到令牌"));
        return;
      }
      if (!state) {
        reject(new Error("未获取到 State"));
        return;
      }

      // 校验 State 防止 CSRF 攻击
      if (!this._pendingStates.some((n) => n === state)) {
        reject(new Error("State 匹配失败"));
        return;
      }

      resolve(access_token);
    };

  /**
   * 使用授权码获取详细的用户信息
   * @param token 授权码
   * @param codeVerifier PKCE 验证字符串
   * @param controlPlaneEnv 环境配置
   */
  private async getUserInfo(
    token: string,
    codeVerifier: string,
    controlPlaneEnv: ControlPlaneEnv,
  ) {
    // 模拟逻辑：如果授权码以 sim_ 开头，直接返回假数据，方便离线开发测试
    if (token && token.startsWith("sim_")) {
      return {
        ccid: "123456789",
        userName: "开发人员",
        deptName: "测试部",
        access_token:
          "sim_access_token_" + Math.random().toString(36).substring(7),
        refresh_token:
          "sim_refresh_token_" + Math.random().toString(36).substring(7),
      };
    }
    try {
      const appUrl = controlPlaneEnv.APP_URL;
      if (!appUrl) {
        throw new Error("未配置 APP_URL");
      }
      let userInfoUrl = appUrl;
      if (!userInfoUrl.endsWith("/")) {
        userInfoUrl += "/";
      }
      // 向后端请求详细的用户元数据
      // 禁用证书校验以支持自签名证书
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      const resp = await fetch(`${userInfoUrl}authmanager/token/v1/${token}`, {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
        agent: agent as any,
      });
      const text = await resp.text();
      const res = JSON.parse(text);
      const data = JSON.parse(res.data);
      return data;
    } catch (err: any) {
      console.error("获取用户信息出错:", err);
      // 使用jwt获取用户信息，兜底方案
      const decodedToken = this.decodeJwt(token);
      if (!decodedToken) {
        throw "用户信息获取异常，请稍后再试";
      }
      const userId = decodedToken.userId;
      const userName = decodedToken.userName;
      const dept = decodedToken.dept;
      return {
        ccid: userId,
        userName,
        deptName:dept,
      }
      // throw err;
    }
  }
}

/**
 * 获取控制面会话信息的辅助函数
 * @param silent 是否静默获取（不弹窗提示登录）
 * @param useOnboarding 是否使用新手引导 URI
 */
export async function getControlPlaneSessionInfo(
  silent: boolean,
  useOnboarding: boolean,
): Promise<ControlPlaneSessionInfo | undefined> {
  // 如果是私有化部署环境且未配置 URL，则返回默认类型
  if (!isHubEnv(controlPlaneEnv) && !controlPlaneEnv.APP_URL) {
    return {
      AUTH_TYPE: AuthType.OnPrem,
    };
  }

  try {
    // 如果指定了使用新手引导流程，则临时设置静态标记
    if (useOnboarding) {
      WorkOsAuthProvider.useOnboardingUri = true;
    }
    // 等待身份验证提供者完成初次的刷新尝试（避免并发冲突）
    await WorkOsAuthProvider.hasAttemptedRefresh;
    // 调用 VS Code 核心 API 获取身份验证会话
    // silent: true 表示不弹窗；createIfNone: true 表示如果没有会话则触发登录流程
    const session = await authentication.getSession(
      controlPlaneEnv.AUTH_TYPE,
      [],
      silent ? { silent: true } : { createIfNone: true },
    );

    // 如果未获取到会话（如用户取消登录），返回 undefined
    if (!session) {
      return undefined;
    }

    // 封装并返回标准化的控制面会话信息
    return {
      AUTH_TYPE: controlPlaneEnv.AUTH_TYPE,
      accessToken: session.accessToken, // 访问令牌
      account: {
        id: session.account.id, // 账户 ID
        label: session.account.label, // 账户显示标签
      },
    };
  } finally {
    // 无论成功还是失败，最后都重置新手引导标记，确保不影响后续请求
    WorkOsAuthProvider.useOnboardingUri = false;
  }
}
