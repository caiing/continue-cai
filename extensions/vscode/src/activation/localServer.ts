import { ControlPlaneEnv } from "core/control-plane/AuthTypes";
import * as http from "http";
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

    this.server = http.createServer(async (req, res) => {
      // 解析请求的 URL，包括路径和查询参数
      const url = new URL(req.url || "/", `http://${this.host}:${this.port}`);

      if (url.pathname === "/") {
        // 根路径逻辑：根据当前登录状态显示不同的引导或欢迎页面
        this.handleRoot(res);
      } else if (url.pathname === this.callbackPath) {
        // 回调路径逻辑：处理从 OAuth 服务重定向回来的包含授权码的请求
        this.handleCallback(url, res);
      } else {
        // 其他路径返回 404
        res.writeHead(404);
        res.end("Not Found");
      }
    });

    // 启动服务监听
    this.server.listen(this.port, () => {
      console.log(`本地登录服务已启动: http://${this.host}:${this.port}`);
    });
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
          <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background-color: #1e1e1e; color: #ccc;">
            <h1>${session.account.label}</h1>
            <p>您已成功登录</p>
          </body>
        </html>
      `);
      return;
    }

    // 未登录状态页面：包含 Logo、介绍和“立即登录”按钮
    res.end(`
      <html>
        <head>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #1e1e1e;
              color: #cccccc;
            }
            .container {
              margin-top: 30px; /* 距离顶部约 30 像素 */
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              flex-grow: 1;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin-bottom: 20px;
            }
            .intro {
              max-width: 400px;
              line-height: 1.6;
              margin-bottom: 40px;
            }
            .login-btn {
              background-color: #007acc;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin-top: auto; /* 使用 flex 布局将按钮推到底部区域 */
              margin-bottom: 80px;
              text-decoration: none;
              transition: background-color 0.2s;
            }
            .login-btn:hover {
              background-color: #0062a3;
            }
            .progress {
              display: none;
              margin-top: -60px;
              margin-bottom: 40px;
              font-size: 14px;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="intro">
              <h2>欢迎使用 Continue</h2>
              <p>Continue 是一个领先的开源 AI 代码助手，可以帮助你加速开发流程、自动生成代码并回答技术问题。</p>
            </div>
           </div>
          <script>
            function showProgress() {
              document.getElementById('progress').style.display = 'block';
              // 原理：通过 URI Scheme (vscode://...) 唤起 VS Code 内部已注册的命令或逻辑，
              // 这会触发 WorkOsAuthProvider 的 createSession 方法。
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
   * 3. 通过 _onCodeReceived.fire 广播该数据。
   * 4. 向用户返回一个友好的“登录成功”确认页面，并尝试自动关闭浏览器标签页。
   * @param url 包含 code 和 state 的请求 URL 对象
   * @param res HTTP 响应对象
   */
  private handleCallback(url: URL, res: http.ServerResponse) {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    // 基础校验
    if (!code || !state) {
      res.writeHead(400);
      res.end("Missing code or state");
      return;
    }

    // 核心操作：通过 EventEmitter 将捕获到的授权数据直接分发给插件内部监听者
    this._onCodeReceived.fire({ code, state });

    const scheme = getvsCodeUriScheme();
    const extensionId = this.context.extension.id;
    const vscodeRedirectUrl = `${scheme}://${extensionId}/auth?code=${code}&state=${state}`;

    // 向浏览器返回响应界面
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html>
        <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background-color: #1e1e1e; color: #ccc;">
          <h1>登录成功！</h1>
          <p>正在为您跳转回编辑器...</p>
          <p style="font-size: 0.8em; color: #888;">如果浏览器没有自动跳转，请手动返回。</p>
          <script>
            // 原理：通过 URI Scheme 唤起 VS Code，这会强制操作系统将焦点切换回编辑器
            window.location.href = "${vscodeRedirectUrl}";
          </script>
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
  }
}
