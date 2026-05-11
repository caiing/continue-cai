import * as vscode from "vscode";

import { getControlPlaneEnv } from "core/control-plane/env";
import { getTheme } from "./util/getTheme";
import { getExtensionVersion, getvsCodeUriScheme } from "./util/util";
import { getExtensionUri, getNonce, getUniqueId } from "./util/vscode";
import { VsCodeIde } from "./VsCodeIde";
import { VsCodeWebviewProtocol } from "./webviewProtocol";

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
      const command = data.command || data.messageType;
      const payload = data.data || data;

      if (command === "login") {
        try {
          const controlPlaneEnv = await getControlPlaneEnv(
            this.ide.getIdeSettings(),
          );
          console.log(
            "ContinueGUIWebviewViewProvider: 开始登录流程，AuthType:",
            controlPlaneEnv.AUTH_TYPE,
          );

          // 核心原理：调用 VS Code 的身份验证 API，触发 OAuth 流程
          // 强制触发新的 Session，无视可能挂起的缓存
          const session = await vscode.authentication.getSession(
            controlPlaneEnv.AUTH_TYPE,
            [],
            { forceNewSession: true },
          );

          if (session) {
            console.log("登录成功:", session.account.label);
            void vscode.window.showInformationMessage(
              "登录成功: " + session.account.label,
            );
            // 登录成功后同步 Session 状态
            this.syncSession();
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

    // 初始化时直接加载 React 应用
    this._webviewView.webview.html = this.getSidebarContent(
      this.extensionContext,
      this._webviewView,
    );

    // 监听登录状态变化
    const authSubscription = vscode.authentication.onDidChangeSessions(
      async (e) => {
        const controlPlaneEnv = await getControlPlaneEnv(
          this.ide.getIdeSettings(),
        );
        if (e.provider.id === controlPlaneEnv.AUTH_TYPE) {
          // 状态变化时同步 Session，而不是重新加载 HTML
          this.syncSession();
        }
      },
    );
    this.extensionContext.subscriptions.push(authSubscription);

    // 当 Webview 变得可见时，尝试同步 Session
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.syncSession();
      }
    });

    // 初始化时也同步一次
    if (webviewView.visible) {
      setTimeout(() => this.syncSession(), 1000);
    }
  }

  /**
   * 同步当前 VS Code 的登录 Session 到 Webview
   */
  private async syncSession() {
    if (!this._webviewView) {
      return;
    }

    try {
      const controlPlaneEnv = await getControlPlaneEnv(
        this.ide.getIdeSettings(),
      );
      const session = await vscode.authentication.getSession(
        controlPlaneEnv.AUTH_TYPE,
        [],
        { silent: true },
      );

      if (session) {
        // 通过协议或直接 postMessage 发送 Session 信息
        this._webviewView.webview.postMessage({
          messageType: "sessionUpdate",
          data: {
            sessionInfo: {
              accessToken: session.accessToken,
              account: {
                label: session.account.label,
                id: session.account.id,
              },
            },
          },
        });
      } else {
        // 如果没有 Session，也发送通知以便前端清除状态
        this._webviewView.webview.postMessage({
          messageType: "sessionUpdate",
          data: {
            sessionInfo: undefined,
          },
        });
      }
    } catch (err) {
      console.error("同步 Session 失败:", err);
    }
  }

  /**
   * 更新 Webview 的 HTML 内容（始终显示 React 应用）
   */
  private async updateWebviewHtml(force = false) {
    if (!this._webviewView) {
      return;
    }
    this._webviewView.webview.html = this.getSidebarContent(
      this.extensionContext,
      this._webviewView,
    );
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
    const vscIconUrl: string = panel.webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "icon.png"))
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
        <script>window.vscIconUrl = "${vscIconUrl}"</script>
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
