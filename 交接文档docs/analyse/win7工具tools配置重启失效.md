# win7工具tools配置重启失效

## 背景

在 Win7 环境中，`Tools` 配置设置为 `Automatic` 后，重启 VSCode 会恢复默认值。  
问题根因是：工具策略之前主要依赖 WebView `localStorage` 持久化，重启后在部分环境可能丢失或未正确恢复。

## 本次改动

### 1. 工具策略持久化迁移到扩展侧 `globalState`

- 新增协议消息：
  - `tools/getPolicySettings`
  - `tools/savePolicySettings`
- 扩展端新增 `globalState` 存储键：`continue.toolPolicySettings.v1`
- 对写入数据做白名单校验，避免非法值污染持久化数据：
  - `toolSettings` 仅允许：`allowedWithPermission` / `allowedWithoutPermission` / `disabled`
  - `toolGroupSettings` 仅允许：`include` / `exclude`

主要文件：

- `core/protocol/ide.ts`
- `extensions/vscode/src/extension/VsCodeMessenger.ts`

### 2. GUI 启动时优先从 `globalState` 回填策略

- 在 GUI 启动监听流程中新增加载逻辑：
  - 启动时请求 `tools/getPolicySettings`
  - 若扩展侧已有数据，则直接回填到 Redux
  - 若扩展侧为空，则尝试从旧 `persist:root` 读取并迁移，再调用 `tools/savePolicySettings` 回写
- 工具策略变化后自动同步回扩展侧 `globalState`

主要文件：

- `gui/src/hooks/ParallelListeners.tsx`
- `gui/src/redux/slices/uiSlice.ts`

### 3. 停止将工具策略继续写入 WebView 持久化

- 从 `redux-persist` 的 `ui` 白名单中移除：
  - `toolSettings`
  - `toolGroupSettings`
- 保留其他 `ui` 持久化字段（如 `ruleSettings`、`reasoningSettings`）

主要文件：

- `gui/src/redux/store.ts`

## 打包与版本

- 打包发现问题：打包流程不会自动执行 `gui` 构建，仅复制现有 `gui/dist`，导致可能打入旧前端资源
- 修正打包流程（先 `gui` build 再 package）并重新打包：

## 验证结果

- TypeScript 检查通过：
  - `gui`: `npm run tsc:check`
  - `extensions/vscode`: `npm run tsc:check`
- `GetDiagnostics` 无新增错误。

## 建议验证步骤

1. 安装 vsix 扩展包
2. 在 `Tools` 页面将某个工具设为 `Automatic`
3. 完全重启 VSCode
4. 确认策略未恢复默认值

如仍异常，建议下一步在 `tools/getPolicySettings` 与 `tools/savePolicySettings` 两端补充日志，定位是“未保存”还是“未加载”。
