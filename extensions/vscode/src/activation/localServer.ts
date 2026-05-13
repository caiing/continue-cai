import * as http from "http";

import { ControlPlaneEnv } from "core/control-plane/AuthTypes";
import * as vscode from "vscode";

import { getvsCodeUriScheme } from "../util/util";

/**
 * 本地登录服务器类 (LocalLoginServer)
 * 原理：在插件启动时在本地开启一个轻量级的 HTTP 服务。
 * 该服务有两个核心作用：
 * 1. 作为一个本地的 Web 容器，向用户展示登录前后的状态页面。
 * 2. 作为一个 OAuth 回调的中转站，捕获浏览器返回的授权码 (code) 并通过事件机制直接传递给插件内部，避免复杂的协议跳转。
 */
export class LocalLoginServer {
  public static readonly HOST = "127.0.0.1";
  public static readonly PORT = 34567;
  public static readonly CALLBACK_PATH = "/callback";

  /**
   * HTTP 服务器实例
   */
  private server: http.Server | null = null;

  // 监听本机回环地址
  private readonly host: string;
  // 本地回调服务端口：浏览器登录后会重定向到该端口。
  private readonly port: number;
  // 登录回调路径，最终完整地址为 http://127.0.0.1:34567/callback
  private readonly callbackPath: string;

  /**
   * 内部事件发射器
   * 原理：用于在接收到 HTTP 回调请求时，将提取到的 code 和 state 通知给订阅了该事件的插件模块（如 WorkOsAuthProvider）。
   */
  private _onCodeReceived = new vscode.EventEmitter<{
    code: string;
    state: string;
  }>();

  /**
   * 存储挂起的 HTTP 响应对象及浏览器信息，键为 stateId
   */
  private _pendingResponses = new Map<
    string,
    { res: http.ServerResponse; isSimpleBrowser: boolean }
  >();

  /**
   * 暴露给外部的只读事件
   * 其他模块通过订阅此事件来获取登录授权码。
   */
  public readonly onCodeReceived = this._onCodeReceived.event;

  /**
   * 构造函数
   * @param context 扩展上下文，用于访问 VS Code 的全局 API 和订阅管理。
   * @param env 当前的控制面环境配置。
   */
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly env: ControlPlaneEnv,
  ) {
    this.host = LocalLoginServer.HOST;
    this.port = LocalLoginServer.PORT;
    this.callbackPath = LocalLoginServer.CALLBACK_PATH;
  }

  /**
   * 启动 HTTP 服务器
   * 原理：创建并运行一个异步监听 34567 端口的服务，根据请求路径分发逻辑。
   */
  public async start() {
    if (this.server) {
      return;
    }

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res).catch((err) => {
        console.error("LocalLoginServer error:", err);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end("Internal Server Error");
        }
      });
    });

    // 启动服务监听
    this.server.listen(this.port, () => {
      console.log(`本地登录服务已启动: http://${this.host}:${this.port}`);
    });
  }

  /**
   * 获取通用的页面样式
   */
  private getCommonStyles() {
    const themeKind = vscode.window.activeColorTheme.kind;
    const isLight =
      themeKind === vscode.ColorThemeKind.Light ||
      themeKind === vscode.ColorThemeKind.HighContrastLight;

    const defaults = isLight
      ? {
          bg: "#ffffff",
          fg: "#333333",
          secondary: "#666666",
          btnBg: "#007acc",
          btnHover: "#0062a3",
          btnFg: "#ffffff",
          border: "#cecece",
        }
      : {
          bg: "#1e1e1e",
          fg: "#cccccc",
          secondary: "#888888",
          btnBg: "#007acc",
          btnHover: "#0062a3",
          btnFg: "#ffffff",
          border: "#454545",
        };

    return `
      :root {
        --bg-color: var(--vscode-editor-background, ${defaults.bg});
        --text-color: var(--vscode-editor-foreground, ${defaults.fg});
        --secondary-text: var(--vscode-descriptionForeground, ${defaults.secondary});
        --button-bg: var(--vscode-button-background, ${defaults.btnBg});
        --button-hover: var(--vscode-button-hoverBackground, ${defaults.btnHover});
        --button-text: var(--vscode-button-foreground, ${defaults.btnFg});
        --container-bg: var(--vscode-editor-background, ${defaults.bg});
        --border-color: var(--vscode-panel-border, ${defaults.border});
      }

      body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
        background-color: var(--bg-color);
        color: var(--text-color);
      }

      .card {
        background-color: var(--container-bg);
        padding: 40px;
        text-align: center;
        max-width: 400px;
        width: 90%;
      }

      h1, h2 {
        margin-top: 0;
        color: var(--text-color);
      }

      p {
        line-height: 1.6;
        color: var(--text-color);
      }

      .secondary {
        color: var(--secondary-text);
        font-size: 0.9em;
        margin-top: 20px;
      }

      .login-btn {
        display: inline-block;
        background-color: var(--button-bg);
        color: var(--button-text) !important;
        border: none;
        padding: 12px 32px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        text-decoration: none;
        transition: background-color 0.2s, transform 0.1s;
        margin-top: 20px;
      }

      .login-btn:hover {
        background-color: var(--button-hover);
      }

      .login-btn:active {
        transform: translateY(1px);
      }

      .logo-placeholder {
        width: 64px;
        height: 64px;
        background: var(--button-bg);
        border-radius: 12px;
        margin-bottom: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 32px;
      }
    `;
  }

  /**
   * 统一处理所有 HTTP 请求
   * @param req HTTP 请求对象
   * @param res HTTP 响应对象
   */
  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    // 解析请求的 URL，包括路径和查询参数
    const url = new URL(req.url || "/", `http://${this.host}:${this.port}`);

    if (url.pathname === "/") {
      // 根路径逻辑：根据当前登录状态显示不同的引导或欢迎页面
      await this.handleRoot(res);
    } else if (url.pathname === this.callbackPath) {
      // 回调路径逻辑：处理从 OAuth 服务重定向回来的包含授权码的请求
      this.handleCallback(req, url, res);
    } else {
      // 其他路径返回 404
      res.writeHead(404);
      res.end("Not Found");
    }
  }

  /**
   * 处理根路径访问 (/)
   * 原理：实时查询 VS Code 的身份验证系统。
   * - 如果已存在会话，则渲染“已登录”状态，显示当前账号。
   * - 如果不存在会话，则渲染“登录引导页”，引导用户点击登录。
   * @param res HTTP 响应对象
   */
  private async handleRoot(res: http.ServerResponse) {
    const controlPlaneEnv = this.env;
    const scheme = getvsCodeUriScheme();
    const extensionId = this.context.extension.id;
    // 尝试静默获取当前会话，不弹出 UI
    const session = await vscode.authentication.getSession(
      controlPlaneEnv.AUTH_TYPE,
      [],
      { silent: true },
    );

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

    if (session) {
      // 已登录状态页面
      res.end(`
        <html>
          <head>
            <style>${this.getCommonStyles()}</style>
          </head>
          <body>
            <div class="card">
              <div class="logo-placeholder">Continue</div>
              <h1>已登录</h1>
              <p>当前账号: <strong>${session.account.label}</strong></p>
              <p class="secondary">您现在可以关闭此页面，回到编辑器继续使用。</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    // 未登录状态页面：包含 Logo、介绍和“立即登录”按钮
    res.end(`
      <html>
        <head>
          <title>Continue</title>
          <style>
            ${this.getCommonStyles()}
            .intro {
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo-placeholder">C</div>
            <div class="intro">
              <h2>欢迎使用 Continue</h2>
              <p>领先的开源 AI 代码助手，开启您的智能编程之旅。</p>
            </div>
            <a href="javascript:void(0)" onclick="showProgress()" class="login-btn">立即登录</a>
            <p id="progress" class="secondary" style="display: none;">正在请求授权...</p>
          </div>
          <script>
            function showProgress() {
              document.getElementById('progress').style.display = 'block';
              window.location.href = '${scheme}://${extensionId}/login';
            }
          </script>
        </body>
      </html>
    `);
  }

  /**
   * 处理回调请求 (/callback)
   * 原理：当用户在浏览器完成 OAuth 授权后，浏览器会被重定向到这个本地 URL。
   * 1. 从 URL 查询参数中提取 code（授权码）和 state（安全验证标识）。
   * 2. 校验参数有效性。
   * 3. 通过 _onCodeReceived.fire广播该数据。
   * 4. 向用户返回一个友好的“登录成功”确认页面，并尝试自动关闭浏览器标签页。
   * @param req HTTP 请求对象
   * @param url 包含 code 和 state 的请求 URL 对象
   * @param res HTTP 响应对象
   */
  private handleCallback(
    req: http.IncomingMessage,
    url: URL,
    res: http.ServerResponse,
  ) {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    // 基础校验
    if (!code || !state) {
      res.writeHead(400);
      res.end("Missing code or state");
      return;
    }

    // 检测是否为 VS Code 环境 (Simple Browser 或 Webview)
    // VS Code 内置浏览器的 User-Agent 通常包含 "Code" 或 "VSCode"
    const ua = req.headers["user-agent"] || "";
    const isInsideVSCode = ua.includes("Code") || ua.includes("VSCode");

    // 将响应对象暂存，等待插件完成用户信息获取后再返回结果
    this._pendingResponses.set(state, { res, isSimpleBrowser: isInsideVSCode });

    // 核心操作：通过 EventEmitter 将捕获到的授权数据直接分发给插件内部监听者
    this._onCodeReceived.fire({ code, state });

    // 设置超时清理，防止内存泄漏（30秒后如果还没调用 finishResponse，则自动返回错误）
    setTimeout(() => {
      const pendingData = this._pendingResponses.get(state);
      if (pendingData && pendingData.res === res) {
        this.finishResponse(state, false, "登录请求超时，请重试。");
      }
    }, 30000);
  }

  /**
   * 结束挂起的 HTTP 响应
   * @param state 校验标识
   * @param success 是否成功
   * @param message 显示的消息内容
   */
  public finishResponse(state: string, success: boolean, message?: string) {
    const pendingData = this._pendingResponses.get(state);
    if (!pendingData) {
      return;
    }

    const { res, isSimpleBrowser } = pendingData;
    this._pendingResponses.delete(state);

    const scheme = getvsCodeUriScheme();
    const extensionId = this.context.extension.id;

    // 如果是成功状态，依然尝试通过 URI Scheme 唤起编辑器
    let redirectScript = "";
    if (success) {
      // 这里的 code 已经在 handleCallback 中通过事件发出了，这里只需要一个占位的 redirectUrl
      const vscodeRedirectUrl = `${scheme}://${extensionId}/auth?state=${state}`;
      redirectScript = `
        <script>
          window.location.href = "${vscodeRedirectUrl}";
        </script>
      `;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

    // 根据是否为内置浏览器定制提示文案
    const successTitle = success ? "登录成功！" : "登录失败";
    let successMessage = message;
    if (!successMessage && success) {
      successMessage = isSimpleBrowser
        ? "您可以关闭此标签页并开始使用 Continue。"
        : "正在为您跳转回编辑器...";
    }
    const subMessage =
      success && !isSimpleBrowser
        ? "如果浏览器没有自动跳转，请手动返回。"
        : "";

    res.end(`
      <html>
        <head>
          <title>Continue</title>
          <style>${this.getCommonStyles()}</style>
        </head>
        <body>
          <div class="card">
            <div class="logo-placeholder">${success ? "✓" : "!"}</div>
            <h1>${successTitle}</h1>
            <p>${successMessage || "请检查配置或重试。"}</p>
            ${subMessage ? `<p class="secondary">${subMessage}</p>` : ""}
            ${redirectScript}
          </div>
        </body>
      </html>
    `);
  }

  /**
   * 停止 HTTP 服务器
   * 原理：在插件卸载或停用时，释放占用的 34567 端口资源，确保不留下残留进程。
   */
  public stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this._pendingResponses.clear();
  }
}
