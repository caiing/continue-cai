import * as vscode from "vscode";

import { getControlPlaneEnv } from "core/control-plane/env";
import { getTheme } from "./util/getTheme";
import { getExtensionVersion, getvsCodeUriScheme } from "./util/util";
import { getExtensionUri, getNonce, getUniqueId } from "./util/vscode";
import { VsCodeWebviewProtocol } from "./webviewProtocol";
import { VsCodeIde } from "./VsCodeIde";

import type { FileEdit } from "core";

export class ContinueGUIWebviewViewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = "continue.continueGUIView";
  public webviewProtocol: VsCodeWebviewProtocol;

  constructor(
    private readonly windowId: string,
    private readonly extensionContext: vscode.ExtensionContext,
    private readonly ide: VsCodeIde,
  ) {
    this.webviewProtocol = new VsCodeWebviewProtocol();
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void | Thenable<void> {
    // 允许执行脚本，否则登录按钮点击没反应
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionContext.extensionUri],
    };

    this.webviewProtocol.webview = webviewView.webview;
    this._webviewView = webviewView;
    this._webview = webviewView.webview;

    // 处理来自登录引导页的消息
    // 原理：监听 Webview 发送的简单 command 消息。当用户点击自定义 HTML 中的登录按钮时，
    // 发送 { command: "login" }，由扩展后台捕获并启动标准的 VS Code 身份验证流程。
    webviewView.webview.onDidReceiveMessage(async (data) => {
      console.log("ContinueGUIWebviewViewProvider: 收到 Webview 消息:", data);
      if (data.command === "login") {
        try {
          const controlPlaneEnv = await getControlPlaneEnv(this.ide.getIdeSettings());
          console.log("ContinueGUIWebviewViewProvider: 开始登录流程，AuthType:", controlPlaneEnv.AUTH_TYPE);
          
          // 核心原理：调用 VS Code 的身份验证 API，触发 OAuth 流程
          // 强制触发新的 Session，无视可能挂起的缓存
          const session = await vscode.authentication.getSession(
            controlPlaneEnv.AUTH_TYPE,
            [],
            { forceNewSession: true }
          );
          
          if (session) {
            console.log("登录成功:", session.account.label);
            void vscode.window.showInformationMessage("登录成功: " + session.account.label);
            // 登录成功后立即刷新 HTML 内容切换到 React 应用
            this.updateWebviewHtml();
          } else {
            console.warn("未获取到 Session，可能用户取消了登录");
            // 通知前端登录失败，重置按钮状态
            webviewView.webview.postMessage({ command: "loginFailed" });
          }
        } catch (err: any) {
          console.error("登录出错:", err);
          // 通知前端登录失败，重置按钮状态
          webviewView.webview.postMessage({ command: "loginFailed" });
        }
      }
    });

    // 初始化时根据登录状态设置 HTML
    this.updateWebviewHtml();

    // 监听登录状态变化
    // 原理：当用户完成登录或退出登录时，VS Code 会触发此事件。
    // 我们在此处更新 Webview 的内容，实现登录前后的无缝界面切换。
    const authSubscription = vscode.authentication.onDidChangeSessions(async (e) => {
      const controlPlaneEnv = await getControlPlaneEnv(this.ide.getIdeSettings());
      if (e.provider.id === controlPlaneEnv.AUTH_TYPE) {
        this.updateWebviewHtml();
      }
    });
    this.extensionContext.subscriptions.push(authSubscription);

    // 当 Webview 变得可见时，检查登录状态
    // 原理：确保每次用户点击侧边栏图标打开插件时，界面都能准确反映最新的登录状态。
    // 如果未登录，自动通过消息触发 Webview 内部的登录逻辑。
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.updateWebviewHtml();
        // 使用 promise 而不是 async/await
        getControlPlaneEnv(this.ide.getIdeSettings()).then((controlPlaneEnv) => {
          vscode.authentication.getSession(
            controlPlaneEnv.AUTH_TYPE,
            [],
            { silent: true },
          ).then((session) => {
            if (!session) {
              console.log("切换到插件且未登录，自动触发登录...");
              // 添加一点延迟以确保 HTML 加载完毕
              setTimeout(() => {
                webviewView.webview.postMessage({ command: "triggerLogin" });
              }, 500);
            }
          });
        });
      }
    });

    if (webviewView.visible) {
      this.updateWebviewHtml();
      setTimeout(() => {
        getControlPlaneEnv(this.ide.getIdeSettings()).then((controlPlaneEnv) => {
          vscode.authentication.getSession(
            controlPlaneEnv.AUTH_TYPE,
            [],
            { silent: true },
          ).then((session) => {
            if (!session) {
              console.log("初始化时未登录，自动触发登录...");
              webviewView.webview.postMessage({ command: "triggerLogin" });
            }
          });
        });
      }, 1000);
    }


  }

  /**
   * 根据登录状态更新 Webview 的 HTML 内容
   */
  private async updateWebviewHtml() {
    if (!this._webviewView) {
      return;
    }

    const controlPlaneEnv = await getControlPlaneEnv(this.ide.getIdeSettings());
    const session = await vscode.authentication.getSession(
      controlPlaneEnv.AUTH_TYPE,
      [],
      { silent: true },
    );

    if (session) {
      // 已登录：显示主页面（React 应用）
      this._webviewView.webview.html = this.getSidebarContent(
        this.extensionContext,
        this._webviewView,
      );
    } else {
      // 未登录：显示登录引导页
      this._webviewView.webview.html = this.getLoginRequiredContent(this._webviewView.webview);
    }
  }

  /**
   * 获取未登录时的 HTML 内容
   * 原理：生成一个高度自定义的 HTML 引导页。
   * 1. 动态生成 Logo 的 Webview URI。
   * 2. 使用 VS Code 的 CSS 变量（如 --vscode-button-background）保证 UI 风格一致。
   * 3. 包含按钮点击后的状态切换逻辑和超时重试逻辑。
   */
  private getLoginRequiredContent(webview: vscode.Webview): string {
    const extensionUri = this.extensionContext.extensionUri;
    const logoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "media", "icon.png")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';">
        <style>
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-sideBar-background);
            color: var(--vscode-sideBar-foreground);
            overflow: hidden; /* 禁用滚动条 */
          }
          .container {
            margin-top: 30px; /* 离顶部约 30 像素 */
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-grow: 1;
            width: 100%;
            overflow: hidden; /* 确保容器内也没有滚动条 */
          }
          .logo {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
          }
          .intro {
            max-width: 100%;
            line-height: 1.6;
            margin-bottom: 40px;
          }
          .intro h2 {
            font-size: 1.2rem;
            margin-bottom: 10px;
          }
          .intro p {
            font-size: 0.9rem;
            color: var(--vscode-descriptionForeground);
          }
          .login-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            margin-top: auto; /* 底部对齐 */
            margin-bottom: 40px;
            min-width: 100px;
          }
          .login-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .progress {
            display: none;
            margin-top: 10px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="logo" src="${logoUri}" alt="Logo">
          <div class="intro">
            <h2>欢迎使用 Continue</h2>
            <p>Continue 是您的开源 AI 编程助手。登录以开始使用聊天、补全和代码编辑功能。</p>
          </div>
          <button id="login-btn" class="login-btn">登录</button>
          <div id="progress" class="progress">登录中...</div>
        </div>
        <script nonce="${nonce}">
          (function() {
            const vscode = acquireVsCodeApi();
            const btn = document.getElementById('login-btn');
            const progress = document.getElementById('progress');
            let loginTimeout;

            console.log("登录页面脚本已加载");

            function performLogin() {
              if (btn.disabled) return;
              try {
                console.log("登录流程启动");
                btn.innerText = '正在登录...';
                btn.disabled = true;
                progress.style.display = 'block';
                progress.innerText = '正在尝试打开登录页面... ';

                // 触发 VS Code 登录指令
                vscode.postMessage({ command: 'login' });
                console.log("已发送 login 消息到扩展");

                // 设置超时检查
                clearTimeout(loginTimeout);
                loginTimeout = setTimeout(() => {
                  if (btn.innerText === '正在登录...') {
                    btn.innerText = '重新登录';
                    btn.disabled = false;
                    progress.innerText = '如果浏览器未打开，请点击重新登录';
                  }
                }, 60000); // 缩短超时提示 1分钟
              } catch (err) {
                console.error("处理出错:", err);
              }
            }

            btn.addEventListener('click', performLogin);

            // 监听来自扩展的消息，用于自动触发登录
            window.addEventListener('message', event => {
              const message = event.data;
              if (message.command === 'triggerLogin') {
                console.log("收到 triggerLogin 消息，准备自动触发登录");
                performLogin();
              } else if (message.command === 'loginFailed') {
                console.log("收到 loginFailed 消息，重置按钮状态");
                clearTimeout(loginTimeout);
                btn.innerText = '重新登录';
                btn.disabled = false;
                progress.innerText = '登录未完成，请重试';
              }
            });
          })();
        </script>
      </body>
    </html>`;
  }

  private _webview?: vscode.Webview;
  private _webviewView?: vscode.WebviewView;

  get isVisible() {
    return this._webviewView?.visible;
  }

  get webview() {
    return this._webview;
  }

  public resetWebviewProtocolWebview(): void {
    if (!this._webview) {
      console.warn("no webview found during reset");
      return;
    }
    this.webviewProtocol.webview = this._webview;
  }

  sendMainUserInput(input: string) {
    this.webview?.postMessage({
      type: "userInput",
      input,
    });
  }

  getSidebarContent(
    context: vscode.ExtensionContext | undefined,
    panel: vscode.WebviewPanel | vscode.WebviewView,
    page: string | undefined = undefined,
    edits: FileEdit[] | undefined = undefined,
    isFullScreen = false,
  ): string {
    const extensionUri = getExtensionUri();
    let scriptUri: string;
    let styleMainUri: string;
    const vscMediaUrl: string = panel.webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui"))
      .toString();

    const inDevelopmentMode =
      context?.extensionMode === vscode.ExtensionMode.Development;
    if (inDevelopmentMode) {
      scriptUri = "http://localhost:5173/src/main.tsx";
      styleMainUri = "http://localhost:5173/src/index.css";
    } else {
      scriptUri = panel.webview
        .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui/assets/index.js"))
        .toString();
      styleMainUri = panel.webview
        .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui/assets/index.css"))
        .toString();
    }

    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extensionUri, "gui"),
        vscode.Uri.joinPath(extensionUri, "assets"),
        extensionUri,
      ],
      enableCommandUris: true,
      portMapping: [
        {
          webviewPort: 65433,
          extensionHostPort: 65433,
        },
      ],
    };

    const nonce = getNonce();

    const currentTheme = getTheme();
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("workbench.colorTheme") ||
        e.affectsConfiguration("window.autoDetectColorScheme") ||
        e.affectsConfiguration("window.autoDetectHighContrast") ||
        e.affectsConfiguration("workbench.preferredDarkColorTheme") ||
        e.affectsConfiguration("workbench.preferredLightColorTheme") ||
        e.affectsConfiguration("workbench.preferredHighContrastColorTheme") ||
        e.affectsConfiguration("workbench.preferredHighContrastLightColorTheme")
      ) {
        // Send new theme to GUI to update embedded Monaco themes
        void this.webviewProtocol?.request("setTheme", { theme: getTheme() });
      }
    });

    this.webviewProtocol.webview = panel.webview;

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>const vscode = acquireVsCodeApi();</script>
        <link href="${styleMainUri}" rel="stylesheet">

        <title>Continue</title>
      </head>
      <body>
        <div id="root"></div>

        ${
          inDevelopmentMode
            ? `<script type="module">
          import RefreshRuntime from "http://localhost:5173/@react-refresh"
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => {}
          window.$RefreshReg$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
          </script>`
            : ""
        }

        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>

        <script>localStorage.setItem("ide", '"vscode"')</script>
        <script>localStorage.setItem("vsCodeUriScheme", '"${getvsCodeUriScheme()}"')</script>
        <script>localStorage.setItem("extensionVersion", '"${getExtensionVersion()}"')</script>
        <script>window.windowId = "${this.windowId}"</script>
        <script>window.vscMachineId = "${getUniqueId()}"</script>
        <script>window.vscMediaUrl = "${vscMediaUrl}"</script>
        <script>window.ide = "vscode"</script>
        <script>window.fullColorTheme = ${JSON.stringify(currentTheme)}</script>
        <script>window.colorThemeName = "dark-plus"</script>
        <script>window.workspacePaths = ${JSON.stringify(
          vscode.workspace.workspaceFolders?.map((folder) =>
            folder.uri.toString(),
          ) || [],
        )}</script>
        <script>window.isFullScreen = ${isFullScreen}</script>

        ${
          edits
            ? `<script>window.edits = ${JSON.stringify(edits)}</script>`
            : ""
        }
        ${page ? `<script>window.location.pathname = "${page}"</script>` : ""}
      </body>
    </html>`;
  }
}
