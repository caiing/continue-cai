const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8443;

// 启用 CORS，允许所有来源，方便开发调试
app.use(cors());
app.use(express.json());

// 模拟大模型对话接口 (OpenAI 兼容)
app.post('/v1/chat/completions', (req, res) => {
  const { messages, stream } = req.body;
  console.log(`Received chat completion request. Stream: ${!!stream}`);

  const content = "这是一个模拟的大模型回复内容，用于验证自签名证书和接口连通性。";

  if (stream) {
    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const words = content.split("");
    let i = 0;

    const interval = setInterval(() => {
      if (i < words.length) {
        const chunk = {
          id: "chatcmpl-mock",
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model: "mock-model",
          choices: [{
            index: 0,
            delta: { content: words[i] },
            finish_reason: null
          }]
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        i++;
      } else {
        res.write('data: [DONE]\n\n');
        clearInterval(interval);
        res.end();
      }
    }, 50);
  } else {
    // 普通 JSON 响应
    res.json({
      id: "chatcmpl-mock",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "mock-model",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: content
        },
        finish_reason: "stop"
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    });
  }
});

// 用户信息请求接口
app.get('/authmanager/token/v1/:token', (req, res) => {
  const token = req.params.token;
  console.log(`Received request for token: ${token}`);
  
  const userData = {
    ccid: "123456789",
    userName: "我是谁",
    deptName: "小卖部",
    sysRoleList: [
      { id: 2, roleName: "普通用户" }
    ]
  };

  res.json({
    code: 0,
    msg: "操作成功",
    data: JSON.stringify(userData)
  });
});

// 根路由，重定向到登录页面
app.get('/', (req, res) => {
  res.redirect('/authmanager/continue_login');
});

// 登录接口/页面
app.get('/authmanager/continue_login', (req, res) => {
  const htmlPath = path.join(__dirname, 'continue_login.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.send('<h1>Continue Local Auth Service</h1><p>continue_login.html not found. Please ensure it exists in the authmanager directory.</p>');
  }
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.send('OK');
});

// HTTPS 配置
const certPath = path.join(__dirname, 'certs', 'cert.pem');
const keyPath = path.join(__dirname, 'certs', 'key.pem');

let server;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  server = https.createServer(options, app);
  console.log(`Starting HTTPS server on port ${PORT}...`);
} else {
  server = http.createServer(app);
  console.log(`Certs not found (certs/cert.pem or certs/key.pem). Falling back to HTTP on port ${PORT}.`);
  console.log(`To use HTTPS, generate certificates and place them in: ${path.join(__dirname, 'certs')}`);
}

server.listen(PORT, () => {
  const protocol = fs.existsSync(certPath) ? 'https' : 'http';
  console.log(`Server is running at ${protocol}://localhost:${PORT}`);
  console.log(`- User Info: ${protocol}://localhost:${PORT}/authmanager/token/v1/:token`);
  console.log(`- Login Page: ${protocol}://localhost:${PORT}/authmanager/continue_login`);
});
