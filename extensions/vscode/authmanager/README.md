# 本地 HTTPS 认证服务启动指南

本文档介绍如何在 `authmanager` 目录下启动并验证本地 HTTPS 服务，用于开发和测试 Continue 插件的登录与用户信息获取功能。

## 1. 准备工作

确保你已经安装了以下工具：
- **Node.js**: 用于运行服务器。
- **OpenSSL**: 用于生成 SSL 证书（如果尚未安装，可使用 `winget install ShiningLight.OpenSSL.Light`）。

## 2. 生成 SSL 证书

在 `extensions/vscode/authmanager/certs` 目录下运行以下 OpenSSL 命令生成自签名证书（或运行 `generate-certs.ps1`）：

```bash
# 进入 certs 目录
cd certs

# 生成私钥 (key.pem) 和证书 (cert.pem)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

生成后，确保 `cert.pem` 和 `key.pem` 位于 `authmanager/certs` 文件夹内。

## 3. 安装依赖

如果尚未安装 `express` 和 `cors`，请在当前目录或插件根目录运行：

```bash
npm install express cors
```

## 4. 启动服务

你可以通过以下两种方式之一启动服务：

### 方法 A：双击脚本启动（推荐）
在 Windows 资源管理器中，直接双击 `start-server.bat` 文件即可启动。

### 方法 B：命令行启动
在当前目录运行以下命令：

```bash
node server.js
```

**启动成功标志：**
控制台应输出：
```text
Starting HTTPS server on port 8443...
Server is running at https://localhost:8443
- User Info: https://localhost:8443/authmanager/token/v1/:token
- Login Page: https://localhost:8443/authmanager/continue_login
```

## 5. 验证服务

### 5.1 验证登录接口
在浏览器中打开：
[https://localhost:8443/authmanager/continue_login](https://localhost:8443/authmanager/continue_login)

### 5.2 验证用户信息接口
使用 `curl` 或浏览器访问：
```bash
curl -k https://localhost:8443/authmanager/token/v1/test-token-123
```

**预期返回：**
```json
{
  "code": 0,
  "msg": "操作成功",
  "data": "{\"ccid\":\"123456789\",\"userName\":\"我是谁\",\"deptName\":\"小卖部\",\"sysRoleList\":[{\"id\":2,\"roleName\":\"普通用户\"}]}"
}
```

## 6. 在插件中使用

在 Continue 插件的配置文件中，将认证相关的 `apiBase` 指向 `https://localhost:8443`。

**注意：** 由于是自签名证书，如果插件请求失败，请在配置中添加：
```json
"requestOptions": {
  "caBundlePath": "D:\\cai\\vscode插件\\continue-cai\\extensions\\vscode\\authmanager\\certs\\cert.pem"
}
```
