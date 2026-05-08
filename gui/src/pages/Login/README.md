# Continue 全屏登录页组件

这是一个为 Continue VS Code 插件开发的全屏登录页面组件。

## 目录结构

- `index.tsx`: 登录页面 React 组件。
- `Login.module.css`: 组件样式文件，采用 CSS Modules 避免全局污染。
- `__tests__/Login.test.tsx`: 单元测试文件。

## 功能特性

- **全屏布局**: 100vh 固定高度，禁止滚动。
- **响应式设计**: 适配桌面端（≥1366px）与移动端（≤768px）。
- **交互状态**: 按钮点击后进入加载状态，显示旋转 loading 图标并禁用。
- **登录逻辑**: 封装为独立模块，支持 `onLogin` 回调。

## 运行与测试

### 运行单元测试

在 `gui` 目录下运行：

```bash
npm run test src/pages/Login/__tests__/Login.test.tsx
```

### 运行 E2E 测试

在 `extensions/vscode` 目录下运行：

```bash
npm run e2e:test -- e2e/tests/Login.test.ts
```

### 打包插件

在 `extensions/vscode` 目录下运行：

```bash
npm run package
```

## 设计规范

- **Logo**: 顶部 30px，宽度 120px/80px。
- **文案**: 间距 24-32px，字号 18px/16px，行高 1.5。
- **按钮**: 距底 40px，宽度 80% (max 400px)，高度 48px，圆角 6px。
- **颜色**: 背景 #f5f5f5，文字 #333，按钮 #2563eb。
