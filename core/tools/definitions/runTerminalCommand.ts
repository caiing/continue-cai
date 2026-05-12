import {
  evaluateTerminalCommandSecurity,
  ToolPolicy,
} from "@continuedev/terminal-security"; // 导入终端命令安全评估工具和策略类型
import os from "os"; // 导入 Node.js 的 os 模块，用于获取操作系统信息
import { Tool } from "../.."; // 导入 Tool 类型定义，用于定义工具接口
import { BUILT_IN_GROUP_NAME, BuiltInToolNames } from "../builtIn"; // 导入内置工具组名称和内置工具枚举名

/**
 * 获取当前平台的首选 Shell
 * @returns 首选的 Shell 命令或路径
 */
function getPreferredShell(): string {
  const platform = os.platform(); // 获取当前操作系统平台

  if (platform === "win32") {
    return "powershell.exe"; // Windows 平台使用 powershell
  } else if (platform === "darwin") {
    return process.env.SHELL || "/bin/zsh"; // macOS 优先使用环境变量 SHELL，默认为 zsh
  } else {
    // Linux 及其他类 Unix 系统
    return process.env.SHELL || "/bin/bash"; // 优先使用环境变量 SHELL，默认为 bash
  }
}

/**
 * 平台信息字符串：根据操作系统、架构和 Shell 提供优化的建议
 */
const PLATFORM_INFO = `Choose terminal commands and scripts optimized for ${os.platform()} and ${os.arch()} and shell ${getPreferredShell()}.`;

/**
 * 运行命令的注意事项：
 * 1. Shell 是无状态的，不会记忆之前的命令。
 * 2. 运行后台命令时，务必建议使用 Shell 命令停止；严禁建议使用 Ctrl+C。
 * 3. 建议后续 Shell 命令时，务必使用 Shell 代码块格式。
 * 4. 不要执行需要特殊或管理员权限的操作。
 * 5. 重要：修改文件时，请使用 Edit/MultiEdit 工具，不要使用 bash 命令（如 sed, awk 等）。
 */
const RUN_COMMAND_NOTES = `The shell is not stateful and will not remember any previous commands.\
      When a command is run in the background ALWAYS suggest using shell commands to stop it; NEVER suggest using Ctrl+C.\
      When suggesting subsequent shell commands ALWAYS format them in shell command blocks.\
      Do NOT perform actions requiring special/admin privileges.\
      IMPORTANT: To edit files, use Edit/MultiEdit tools instead of bash commands (sed, awk, etc).\
      ${PLATFORM_INFO}`;

/**
 * 终端命令执行工具定义
 */
export const runTerminalCommandTool: Tool = {
  type: "function",
  displayTitle: "Run Terminal Command", // IDE 中显示的标题
  wouldLikeTo: "run the following terminal command:", // 意图引导语
  isCurrently: "running the following terminal command:", // 正在执行时的状态语
  hasAlready: "ran the following terminal command:", // 执行完成后的状态语
  readonly: false, // 标识该工具是否为只读
  group: BUILT_IN_GROUP_NAME, // 工具所属的分组
  function: {
    name: BuiltInToolNames.RunTerminalCommand, // 工具函数的名称
    description: `Run a terminal command in the current directory.\n${RUN_COMMAND_NOTES}`, // 工具函数的描述
    parameters: {
      type: "object",
      required: ["command"], // 必填参数列表
      properties: {
        command: {
          type: "string",
          description:
            "The command to run. This will be passed directly into the IDE shell.", // 参数描述：要执行的命令字符串
        },
        waitForCompletion: {
          type: "boolean",
          description:
            "Whether to wait for the command to complete before returning. Default is true. Set to false to run the command in the background. Set to true to run the command in the foreground and wait to collect the output.", // 参数描述：是否等待命令执行完成。默认 true（前台执行并获取输出），false 则为后台执行。
        },
      },
    },
  },
  defaultToolPolicy: "allowedWithPermission", // 默认工具策略：需要权限才能执行
  /**
   * 评估工具调用的安全性策略
   * @param basePolicy 基础策略
   * @param parsedArgs 解析后的参数对象
   * @returns 经过安全评估后的最终策略
   */
  evaluateToolCallPolicy: (
    basePolicy: ToolPolicy,
    parsedArgs: Record<string, unknown>,
  ): ToolPolicy => {
    const securityResult = evaluateTerminalCommandSecurity(
      basePolicy,
      parsedArgs.command as string,
    );

    // 如果安全评估为禁用，则改为需要人工确认
    if (securityResult === "disabled") {
      return "allowedWithPermission";
    }

    // 其他情况（包括高风险命令被提升的情况）一律遵循用户设置的基础策略
    return basePolicy;
  },
  /**
   * 系统消息描述，用于指导模型如何使用该工具
   */
  systemMessageDescription: {
    prefix: `To run a terminal command, use the ${BuiltInToolNames.RunTerminalCommand} tool
${RUN_COMMAND_NOTES}
You can also optionally include the waitForCompletion argument set to false to run the command in the background.      
For example, to see the git log, you could respond with:`, // 指导语前缀
    exampleArgs: [["command", "git log"]], // 使用示例
  },
};
