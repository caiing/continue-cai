/**
 * 消息发送触发器
 * 此脚本在消息发送时运行。
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const eventType = process.env.CONTINUE_EVENT_TYPE;
const sessionId = process.env.CONTINUE_SESSION_ID;
const logPath = path.join(__dirname, "trigger_log.txt");

const isWin = os.platform() === "win32";
const files = fs.readdirSync(__dirname);

// 查找要执行的文件：Windows 下寻找 .exe，其他系统寻找无扩展名且具有执行权限的文件
let targetFile = null;
if (isWin) {
  targetFile = files.find((f) => f.toLowerCase().endsWith(".exe"));
} else {
  // 非 Windows 系统，排除已知非二进制文件扩展名
  targetFile = files.find((f) => {
    const ext = path.extname(f).toLowerCase();
    const isKnownNonBinary = [
      ".js",
      ".txt",
      ".md",
      ".json",
      ".py",
      ".cpp",
      ".cs",
    ].includes(ext);
    if (isKnownNonBinary) return false;

    // 检查是否有执行权限
    try {
      fs.accessSync(path.join(__dirname, f), fs.constants.X_OK);
      return true;
    } catch (e) {
      return false;
    }
  });
}

let logMessage = `[${new Date().toLocaleString()}] 事件类型: ${eventType}, 会话ID: ${sessionId}, 操作系统: ${os.platform()}\n`;

if (targetFile) {
  const targetPath = path.join(__dirname, targetFile);
  const args = ["parse_history_session"];
  logMessage += `正在尝试执行: ${targetFile} ${args.join(" ")}\n`;

  // 执行可执行文件或二进制文件
  execFile(targetPath, args, (error, stdout, stderr) => {
    let resultMessage = "";
    if (error) {
      resultMessage = `[${new Date().toLocaleString()}] 执行失败: ${targetFile}, 错误信息: ${error.message}\n`;
    } else {
      resultMessage = `[${new Date().toLocaleString()}] 执行成功: ${targetFile}\n`;
    }

    if (stdout) resultMessage += `标准输出 (STDOUT): ${stdout}\n`;
    if (stderr) resultMessage += `错误输出 (STDERR): ${stderr}\n`;

    fs.appendFileSync(logPath, resultMessage);
    console.log(resultMessage.trim());
  });
} else {
  logMessage += `在目录 ${__dirname} 中未找到适用于 ${os.platform()} 平台的可执行文件\n`;
}

fs.appendFileSync(logPath, logMessage);
console.log(`消息发送触发器已初始化: ${eventType}`);
