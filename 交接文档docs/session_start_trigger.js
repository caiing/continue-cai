/**
 * 会话开始触发器
 * 此脚本在会话开始时运行。
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const eventType = process.env.CONTINUE_EVENT_TYPE;
const sessionId = process.env.CONTINUE_SESSION_ID;
// todo 会话开始时，传入工作区路径给执行脚本参数，需插件补充工作区路径变量 CONTINUE_PROJECT_PATH
const workspacePath = process.env.CONTINUE_PROJECT_PATH;

const logPath = path.join(__dirname, "trigger_log.txt");

const isWin = os.platform() === "win32";
const scriptPath = path.join(__dirname, "sync_rules.sh");
function quoteForShell(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

let logMessage = `[${new Date().toLocaleString()}] 事件类型: ${eventType}, 会话ID: ${sessionId}, 操作系统: ${os.platform()}, 工作区: ${workspacePath}\n`;

if (fs.existsSync(scriptPath)) {
  // 寻找 bash 路径
  let bashPath = "bash";
  if (isWin) {
    const gitBashPath = "C:\\Program Files\\Git\\bin\\bash.exe";
    if (fs.existsSync(gitBashPath)) {
      bashPath = gitBashPath;
    }
  }

  // Windows 7 下异步回调可能不执行，改用同步 spawnSync
  // chcp 65001 确保输出编码为 UTF-8
  const quotedBashPath = quoteForShell(bashPath);
  const quotedScriptPath = quoteForShell(scriptPath);
  const quotedWorkspacePath = quoteForShell(workspacePath);
  const shellCommand = isWin
    ? `chcp 65001 > nul && ${quotedBashPath} ${quotedScriptPath} ${quotedWorkspacePath}`
    : `${quotedBashPath} ${quotedScriptPath} ${quotedWorkspacePath}`;

  logMessage += `正在同步执行: ${shellCommand}\n`;
  console.log(`正在执行脚本...`);

  const result = spawnSync(shellCommand, {
    shell: true,
    encoding: "utf8",
    env: process.env,
  });

  let resultMessage = "";
  if (result.error) {
    resultMessage = `[${new Date().toLocaleString()}] 执行出错: ${result.error.message}\n`;
  } else if (result.status !== 0) {
    resultMessage = `[${new Date().toLocaleString()}] 执行失败，退出码: ${result.status}\n`;
  } else {
    resultMessage = `[${new Date().toLocaleString()}] 执行成功\n`;
  }

  if (result.stdout) resultMessage += `标准输出 (STDOUT): ${result.stdout}\n`;
  if (result.stderr) resultMessage += `错误输出 (STDERR): ${result.stderr}\n`;

  logMessage += resultMessage;
  console.log(resultMessage.trim());
} else {
  logMessage += `在目录 ${__dirname} 中未找到 sync_rules.sh 文件\n`;
}

fs.appendFileSync(logPath, logMessage);

if (eventType === "session_start") {
  // 清理超过 3 天的日志
  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, "utf8");
      const lines = content.split("\n");
      const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const filteredLines = [];
      let isCurrentEntryRecent = true;

      for (const line of lines) {
        // 匹配行首的 [时间戳]
        const match = line.match(/^\[([^\]]+)\]/);
        if (match) {
          const timestamp = new Date(match[1]);
          if (!isNaN(timestamp.getTime())) {
            isCurrentEntryRecent = timestamp.getTime() > cutoff;
          }
        }
        if (isCurrentEntryRecent) {
          filteredLines.push(line);
        }
      }
      // 只有在确实需要清理时才重写文件
      if (filteredLines.length < lines.length) {
        fs.writeFileSync(logPath, filteredLines.join("\n"));
      }
    }
  } catch (err) {
    console.error(`日志清理失败: ${err.message}`);
  }
}

console.log(`会话开始触发器已初始化: ${eventType}`);
