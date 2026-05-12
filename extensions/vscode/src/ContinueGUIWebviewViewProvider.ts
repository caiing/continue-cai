// 导入 VS Code 核心 API
import * as vscode from "vscode";

// 导入控制面环境配置工具
import { getControlPlaneEnv } from "core/control-plane/env";
// 导入获取主题的工具函数
import { getTheme } from "./util/getTheme";
// 导入获取版本和 URI 协议方案的工具函数
import { getExtensionVersion, getvsCodeUriScheme } from "./util/util";
// 导入 VS Code 相关的基础工具函数
import { getExtensionUri, getNonce, getUniqueId } from "./util/vscode";
// 导入 VS Code IDE 实现类
import { VsCodeIde } from "./VsCodeIde";
// 导入 Webview 通讯协议类
import { VsCodeWebviewProtocol } from "./webviewProtocol";

// 导入核心逻辑中的文件编辑类型定义
import type { FileEdit } from "core";

/**
 * Continue 主界面的 Webview 视图提供者
 * 负责在侧边栏渲染 React 应用，并处理与插件后端的通讯
 */
export class ContinueGUIWebviewViewProvider
  implements vscode.WebviewViewProvider
{
  // 视图 ID，需与 package.json 中的一致
  public static readonly viewType = "continue.continueGUIView";
  // 专门用于 Webview 通讯的协议实例
  public webviewProtocol: VsCodeWebviewProtocol;

  /**
   * 构造函数
   * @param windowId 窗口唯一 ID
   * @param extensionContext 扩展上下文
   * @param ide IDE 接口实例
   */
  constructor(
    private readonly windowId: string,
    private readonly extensionContext: vscode.ExtensionContext,
    private readonly ide: VsCodeIde,
  ) {
    this.webviewProtocol = new VsCodeWebviewProtocol();
  }

  /**
   * VS Code 激活 Webview 时的回调方法
   */
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void | Thenable<void> {
    // 配置 Webview 选项：允许脚本执行，限制资源访问范围
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionContext.extensionUri],
    };

    // 绑定协议实例到当前的 Webview
    this.webviewProtocol.webview = webviewView.webview;
    this._webviewView = webviewView;
    this._webview = webviewView.webview;

    /**
     * 处理来自 Webview 的原生消息
     * 主要用于处理登录逻辑，因为登录按钮可能在 React 挂载前的 HTML 中
     */
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
          // 使用 forceNewSession: true 确保每次点击都重新发起授权
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
            // 登录成功后，主动通知前端同步 Session 状态
            this.syncSession();
          } else {
            console.warn("未获取到 Session，可能用户取消了登录");
            // 通知前端登录失败，以便重置 UI 状态
            // webviewView.webview.postMessage({ command: "loginFailed" });
          }
        } catch (err: any) {
          console.error("登录出错:", err);
          // 通知前端登录失败
          webviewView.webview.postMessage({ command: "loginFailed" });
        }
      }
    });

    // 生成并设置 Webview 的初始 HTML（即加载 React 的容器）
    this._webviewView.webview.html = this.getSidebarContent(
      this.extensionContext,
      this._webviewView,
    );

    /**
     * 监听 VS Code 全局登录状态变化
     * 当用户在外部（如浏览器）完成登录后，此处会被触发
     */
    const authSubscription = vscode.authentication.onDidChangeSessions(
      async (e) => {
        const controlPlaneEnv = await getControlPlaneEnv(
          this.ide.getIdeSettings(),
        );
        if (e.provider.id === controlPlaneEnv.AUTH_TYPE) {
          // 状态变化时同步 Session，确保前端 UI 及时更新
          this.syncSession();
        }
      },
    );
    this.extensionContext.subscriptions.push(authSubscription);

    // 当用户切回侧边栏，视图重新可见时，自动检查并同步登录状态
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.syncSession();
      }
    });

    // 初始化延迟同步，确保 Webview 已经准备好接收消息
    if (webviewView.visible) {
      setTimeout(() => this.syncSession(), 1000);
    }
  }

  /**
   * 将 VS Code 的登录 Session 状态推送给前端 React 应用
   */
  private async syncSession() {
    if (!this._webviewView) {
      return;
    }

    try {
      const controlPlaneEnv = await getControlPlaneEnv(
        this.ide.getIdeSettings(),
      );
      // 获取当前 Session（silent: true 表示静默获取，不弹出登录框）
      const session = await vscode.authentication.getSession(
        controlPlaneEnv.AUTH_TYPE,
        [],
        { silent: true },
      );

      if (session) {
        // 向前端发送最新的用户信息
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
        // 如果没有有效 Session，通知前端清除登录状态
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
   * 刷新 Webview 内容
   * @param force 是否强制重载
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

  /**
   * 视图是否已准备就绪
   */
  get isReady() {
    return !!this._webview;
  }

  /**
   * 视图是否可见
   */
  get isVisible() {
    return this._webviewView?.visible;
  }

  /**
   * 获取当前的 Webview 实例
   */
  get webview() {
    return this._webview;
  }

  /**
   * 重置通讯协议中的 Webview 引用（通常在 Webview 重建后调用）
   */
  public resetWebviewProtocolWebview(): void {
    if (!this._webview) {
      console.warn("no webview found during reset");
      return;
    }
    this.webviewProtocol.webview = this._webview;
  }

  /**
   * 向前端发送用户输入（用于命令行触发等场景）
   */
  sendMainUserInput(input: string) {
    this.webview?.postMessage({
      type: "userInput",
      input,
    });
  }

  /**
   * 生成 Webview 的 HTML 模板内容
   * 包含 React 的入口 JS、CSS，以及注入到 window 全局变量中的各种初始状态
   */
  getSidebarContent(
    context: vscode.ExtensionContext | undefined,
    panel: vscode.WebviewPanel | vscode.WebviewView,
    page: string | undefined = undefined, // 初始路由路径
    edits: FileEdit[] | undefined = undefined, // 初始编辑数据
    isFullScreen = false, // 是否全屏模式
  ): string {
    const extensionUri = getExtensionUri();
    let scriptUri: string;
    let styleMainUri: string;
    // 基础路径
    const vscMediaUrl: string = panel.webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui"))
      .toString();
    const vscIconUrl: string = panel.webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "icon.png"))
      .toString();

    // 判断开发模式还是生产模式，加载不同的静态资源
    const inDevelopmentMode =
      context?.extensionMode === vscode.ExtensionMode.Development;
    if (inDevelopmentMode) {
      // 开发模式连接 Vite 热更新服务器
      scriptUri = "http://localhost:5173/src/main.tsx";
      styleMainUri = "http://localhost:5173/src/index.css";
    } else {
      // 生产模式加载本地 assets
      scriptUri = panel.webview
        .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui/assets/index.js"))
        .toString();
      styleMainUri = panel.webview
        .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui/assets/index.css"))
        .toString();
    }

    // 配置 Webview 的本地资源映射
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

    // 获取并监听主题颜色变化
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
        // 主题变化时通知前端，以便更新内嵌的 Monaco 编辑器等
        void this.webviewProtocol?.request("setTheme", { theme: getTheme() });
      }
    });

    this.webviewProtocol.webview = panel.webview;

    // 返回完整的 HTML 字符串，通过 script 标签将变量注入到前端 window 对象
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
          // Vite 热更新相关的运行时脚本
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
