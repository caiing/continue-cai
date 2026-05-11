# 信创系统 read_file auto 仍需手工确认问题分析报告

## 1. 问题现象
在信创系统（如统信 UOS、麒麟 OS 等 Linux 内核系统）中，用户已在配置中设置 `read_file` 为 `auto`（对应策略 `allowedWithoutPermission`），但在触发读取文件操作时，IDE 仍然弹出确认框要求手工点击。

## 2. 核心原因分析

经过对代码逻辑的深度追踪，该现象是由 **安全边界保护机制（Security Boundary Protection）** 触发的降级行为导致的。

### 2.1 自动降级逻辑
在 [readFile.ts](file:///d%3A/cai/vscode%E6%8F%92%E4%BB%B6/continue-cai/core/tools/definitions/readFile.ts) 中，`readFile` 工具定义了动态策略评估：
- **逻辑位置**：`evaluateToolCallPolicy` -> `evaluateFileAccessPolicy`
- **判定规则**：如果待读取的文件路径被判定为 **“不在当前工作区（Workspace）内”** 且 **“不在 Continue 全局配置目录内”**，系统会出于安全考虑，将 `auto` 策略强制降级为 `allowedWithPermission`（即需要手工确认）。

### 2.2 信创系统（Linux）下的触发诱因
在信创系统上，由于 Linux 的特性，以下情况会导致路径匹配失效，从而触发上述降级：

#### A. 路径解析差异（软链接/挂载点）
信创系统常用 `/data/home/user` 这种挂载方式。
- 如果 VS Code 打开的项目路径是 `/home/user/project`。
- 实际文件物理路径是 `/data/home/user/project/file.ts`。
- 代码中的 `findUriInDirs` 仅进行字符串前缀匹配，无法识别这两者指向同一位置，导致判定为“越界访问”。

#### B. 严格的大小写敏感
- **代码参考**：[uri.ts](file:///d%3A/cai/vscode%E6%8F%92%E4%BB%B6/continue-cai/core/util/uri.ts#L61-L75) 中的 `findUriInDirs` 函数。
- **现象**：在 Windows 下路径匹配忽略大小写，但在 Linux/信创系统下，`isWindows` 为 `false`，进入严格匹配模式。若配置或工作区路径中存在任何微小的大小写不一致，均会导致匹配失败。

#### C. URI 协议头处理
Linux 下 `file://` 协议的解析路径（如 `file:///home/...`）在与系统绝对路径对比时，可能因多余的斜杠或编码问题导致前缀匹配失败。

## 3. 解决方案与建议

### 3.1 用户侧临时规避
1. **物理路径一致性**：确保在 VS Code 中打开的文件夹路径是物理真实路径，避免通过软链接路径打开。
2. **检查路径大小写**：核对工作区路径与配置文件中引用的路径，确保大小写完全一致。

### 3.2 插件侧修复建议
1. **统一路径解析**：在进行边界判定前，对所有路径执行 `fs.realpathSync()`（或对应的 IDE 异步方法），消除软链接干扰。
2. **增强路径匹配算法**：在 [uri.ts](file:///d%3A/cai/vscode%E6%8F%92%E4%BB%B6/continue-cai/core/util/uri.ts) 中，针对 Linux 系统优化 URI 到物理路径的转换逻辑，确保判定准确。

---
**日期**：2026-05-11
**归档**：AuthManager Docs
