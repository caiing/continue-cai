# Continue VS Code 扩展 package.json 技术说明文档

`package.json` 是 VS Code 扩展的 **清单文件（Manifest）**。它不仅定义了 Node.js 项目的依赖，还描述了扩展的各种元数据、激活方式、UI 贡献点以及与 IDE 的交互逻辑。

## 1. 基础元数据字段

这些字段定义了扩展的身份和在市场上的展示信息。

- **`name`**: 扩展的唯一标识符（`continue`）。
- **`displayName`**: 在 VS Code 市场和扩展视图中显示的友好名称。
- **`version`**: 扩展版本号，遵循语义化版本控制（Semantic Versioning）。
- **`publisher`**: 发布者 ID。
- **`engines`**:
  - **`vscode`**: 声明该扩展兼容的最低 VS Code API 版本（这里是 `^1.70.0`）。
- **`categories`**: 用于在市场上分类（如 `AI`, `Chat`, `Programming Languages`）。
- **`keywords`**: 搜索关键词，增加曝光度。
- **`extensionKind`**: 指定扩展运行的位置。`["ui", "workspace"]` 表示既可以运行在本地 UI 端，也可以运行在远程开发环境（如 SSH, Codespaces）中。

## 2. VS Code 核心生命周期字段

这些字段直接影响扩展的加载和运行。

- **`main`**: 扩展的入口文件（编译后的代码，路径为 `./out/extension.js`）。VS Code 启动时会从这里加载代码。
- **`activationEvents`**: **激活事件**。决定了扩展何时被唤醒（加载到内存中）。
  - `onUri`: 当通过自定义 URI（如 `vscode://...`）唤醒时。
  - `onStartupFinished`: 当 VS Code 启动完成且不影响首屏性能时自动激活。
  - `onView:continueGUIView`: 当用户打开 Continue 的视图时激活。
  - *注：Continue 采用按需激活策略，以保证 IDE 启动性能。*

## 3. `contributes` 字段：扩展的功能声明

这是最重要的部分，定义了扩展如何“侵入” VS Code 的界面和功能。

### 3.1 界面与导航 (UI)
- **`viewsContainers`**: 在侧边栏（Activity Bar）或底部面板添加容器。
  - 定义了 `continue` 侧边栏图标和 `continueConsole` 底部面板。
- **`views`**: 在容器中定义的具体 Webview 视图。
  - `continue.continueGUIView`: 主聊天界面。
  - `continue.continueConsoleView`: 日志控制台界面。
- **`menus`**: 定义命令在哪些右键菜单或工具栏中显示。
  - `editor/context`: 编辑器右键菜单中的 "Continue" 子菜单。
  - `view/title`: 侧边栏顶部的按钮（如 "New Session", "History"）。

### 3.2 命令与快捷键
- **`commands`**: 注册扩展提供的所有命令（Command ID, 标题, 图标）。
  - 例如 `continue.focusContinueInput`。
- **`keybindings`**: 为命令绑定默认快捷键（支持 Windows/Linux 和 macOS 差异）。
  - 重点：`cmd+l` / `ctrl+l` 绑定到聚焦输入框。

### 3.3 配置项 (Configuration)
- **`configuration`**: 定义用户在 `settings.json` 中可以修改的设置项。
  - 例如 `continue.telemetryEnabled`, `continue.enableTabAutocomplete`。
  - 包含描述、默认值以及（如果是弃用的）迁移提示。

### 3.4 语言与语法支持
- **`languages`**: 注册新的语言 ID（如 `.prompt` 文件的 `promptLanguage`）。
- **`grammars`**: 为新语言关联 TextMate 语法文件，实现代码高亮。
- **`jsonValidation`**: 为 `config.json` 等配置文件提供 JSON Schema 校验。

## 4. 脚本与构建流 (Scripts)

- **`vscode:prepublish`**: 发布前的关键步骤。运行 `esbuild` 进行代码压缩混淆（minify）。
- **`esbuild` 系列**: 使用 `esbuild` 快速构建代码。
- **`rebuild`**: 用于处理原生模块（如 `node-pty`），针对 Electron 环境重新编译。
- **`package`**: 调用 `scripts/package.js` 将项目打包成 `.vsix` 文件。
- **`e2e` 系列**: 极其复杂的端到端测试流程，包含下载特定版本的 VS Code、安装扩展并运行自动化测试。

## 5. 依赖管理

- **`dependencies`**:
  - **核心内部库**: `core: "file:../../core"` 指向本地目录，实现多包协作。
  - **第三方库**: 包含 `axios`, `express`, `socket.io-client` 等，用于处理网络请求、后端服务和实时通信。
  - **VS Code 特有**: `@vscode/ripgrep` 提供高性能文本搜索。
- **`devDependencies`**: 包含构建工具（`esbuild`, `typescript`）、测试框架（`vitest`, `mocha`）和 VS Code 类型定义（`@types/vscode`）。
- **`overrides`**: 强制指定某些深层依赖的版本，以解决安全性漏洞或版本冲突。

---

## 后续开发维护重点关注

阅读该文件后，开发者在进行功能迭代时应重点关注：

1. **入口点 (Entry Point)**: 所有的初始化逻辑始于 [extension.ts](file:///d:/cai/vscode插件/continue-cai/extensions/vscode/src/extension.ts)（编译后对应 `main` 字段）。
2. **激活时机 (Activation)**: 如果新增的功能无法自动运行，请检查 `activationEvents` 是否包含了触发该功能的事件。
3. **权限声明**: 虽然 VS Code 扩展权限相对开放，但涉及 URI 唤醒或特定 UI 容器时，必须在 `contributes` 中准确声明。
4. **命令注册循环**: 在 `contributes.commands` 中声明的每个命令，必须在 [extension.ts](file:///d:/cai/vscode插件/continue-cai/extensions/vscode/src/extension.ts) 的 `activate` 函数中通过 `vscode.commands.registerCommand` 进行具体实现绑定，否则会报 "command not found" 错误。
5. **依赖约束**: `engines.vscode` 的版本决定了你能调用哪些最新的 VS Code API。如果你使用了较新的 API，记得提升此处的版本号。
