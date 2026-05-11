#!/bin/bash

baseDir=$(cd `dirname $0`;pwd)
cd $baseDir

echo "########## CLI UI Translation to Chinese ##########"

xsed='sed -i'
system=`uname`
if [ "$system" == "Darwin" ]; then
  echo "This is macOS"
  xsed="sed -i .bak"
else
  echo "This is Linux"
  xsed='sed -i'
fi

# 翻译 index.ts 文件
echo "Translating index.ts..."

# 命令描述
$xsed 's#"Continue CLI - AI-powered development assistant. Starts an interactive session by default, use -p/--print for non-interactive output."#"Continue CLI - AI 驱动的开发助手。默认启动交互式会话，使用 -p/--print 进行非交互式输出。"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Display version number"#"显示版本号"#g' ${baseDir}/cli/src/index.ts

# 根命令选项描述
$xsed 's#"Optional prompt to send to the assistant"#"发送给助手的可选提示"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Print response and exit (useful for pipes)"#"打印响应并退出（适用于管道）"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Output format for headless mode (json). Only works with -p/--print flag."#"无头模式的输出格式（json）。仅在使用 -p/--print 标志时生效。"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Strip <think></think> tags and excess whitespace from output. Only works with -p/--print flag."#"从输出中去除 <think></think> 标签和多余空白。仅在使用 -p/--print 标志时生效。"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Resume from last session"#"从上次会话继续"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Fork from an existing session ID"#"从现有会话 ID 分叉"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Enable beta Subagent tool for invoking subagents"#"启用测试版子代理工具以调用子代理"#g' ${baseDir}/cli/src/index.ts

# 错误消息
$xsed 's#"Error: A prompt is required when using the -p/--print flag, unless --prompt, --agent, or --resume is provided."#"错误：使用 -p/--print 标志时需要提供提示，除非提供了 --prompt、--agent 或 --resume。"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Usage examples:"#"使用示例："#g' ${baseDir}/cli/src/index.ts

# 子命令描述
$xsed 's#"Authenticate with Continue"#"登录"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Log out from Continue"#"退出 Continue"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"List recent chat sessions and select one to resume"#"列出最近的聊天会话并选择一个继续"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Output in JSON format"#"以 JSON 格式输出"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Launch a remote instance of the cn agent"#"启动 cn 代理的远程实例"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Connect directly to the specified URL instead of creating a new remote environment"#"直接连接到指定的 URL，而不是创建新的远程环境"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Connect to an existing remote agent by id and establish a tunnel"#"通过 ID 连接到现有的远程代理并建立隧道"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Idempotency key for session management - allows resuming existing sessions"#"会话管理的幂等键 - 允许恢复现有会话"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Create remote environment and print connection details without starting TUI"#"创建远程环境并打印连接详情，不启动 TUI"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Specify the git branch name to use in the remote environment"#"指定在远程环境中使用的 git 分支名称"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Specify the repository URL to use in the remote environment"#"指定在远程环境中使用的仓库 URL"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Start an HTTP server with /state and /message endpoints"#"启动带有 /state 和 /message 端点的 HTTP 服务器"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Inactivity timeout in seconds (default: 300)"#"非活动超时时间（秒）（默认：300）"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Port to run the server on (default: 8000)"#"服务器运行端口（默认：8000）"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Upload session snapshots to Continue-managed storage using the provided identifier"#"使用提供的标识符将会话快照上传到 Continue 管理的存储"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Enable beta UploadArtifact tool for uploading screenshots, videos, and logs"#"启用测试版 UploadArtifact 工具以上传截图、视频和日志"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Test remote TUI mode with a local server"#"使用本地服务器测试远程 TUI 模式"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Server URL (default: http://localhost:8000)"#"服务器 URL（默认：http://localhost:8000）"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Show CI check statuses for a PR"#"显示 PR 的 CI 检查状态"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Run AI-powered reviews on your changes"#"对您的更改运行 AI 驱动的审查"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Base git ref to diff against (default: auto-detect)"#"对比的基准 git ref（默认：自动检测）"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Output format"#"输出格式"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Automatically apply suggested fixes"#"自动应用建议的修复"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Show patches"#"显示补丁"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Stop on first failure"#"首次失败时停止"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Specific review agents to run"#"要运行的特定审查代理"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Enable verbose logging"#"启用详细日志"#g' ${baseDir}/cli/src/index.ts
$xsed 's#"Error: Unknown command#"错误：未知命令#g' ${baseDir}/cli/src/index.ts

# 翻译 UserInput.tsx 文件
echo "Translating UserInput.tsx..."

# 中断提示
$xsed 's#Interrupted by user - Press enter to continue#用户已中断 - 按 Enter 继续#g' ${baseDir}/cli/src/ui/UserInput.tsx

# 斜杠命令描述
$xsed 's#"Show help message"#"显示帮助信息"#g' ${baseDir}/cli/src/ui/UserInput.tsx
$xsed 's#"Clear the chat history"#"清除聊天历史"#g' ${baseDir}/cli/src/ui/UserInput.tsx
$xsed 's#"Exit the chat"#"退出聊天"#g' ${baseDir}/cli/src/ui/UserInput.tsx

# 占位符文本
$xsed 's#"Ask anything, / for slash commands, ! for shell mode"#"输入任意内容，使用 / 调用斜杠命令，使用 ! 进入 shell 模式"#g' ${baseDir}/cli/src/ui/UserInput.tsx
$xsed 's#"Ask anything, @ for context, / for slash commands, ! for shell mode"#"输入任意内容，使用 @ 添加上下文，使用 / 调用斜杠命令，使用 ! 进入 shell 模式"#g' ${baseDir}/cli/src/ui/UserInput.tsx

# 翻译 FileSearchUI.tsx 文件
echo "Translating FileSearchUI.tsx..."

# 键盘快捷键提示
$xsed 's#↑/↓ to navigate, Enter to select, Tab to complete, Ctrl+r to refresh list#↑/↓ 导航，Enter 选择，Tab 补全，Ctrl+r 刷新列表#g' ${baseDir}/cli/src/ui/FileSearchUI.tsx
$xsed 's#Ctrl+r to refresh list (this may take several seconds)#Ctrl+r 刷新列表（可能需要几秒钟）#g' ${baseDir}/cli/src/ui/FileSearchUI.tsx
$xsed 's#"Error indexing files: "#"文件索引错误："#g' ${baseDir}/cli/src/ui/FileSearchUI.tsx
$xsed 's#"No matching files found"#"未找到匹配的文件"#g' ${baseDir}/cli/src/ui/FileSearchUI.tsx

# 翻译 SlashCommandUI.tsx 文件
echo "Translating SlashCommandUI.tsx..."

# 斜杠命令描述
$xsed 's#"Show help message"#"显示帮助信息"#g' ${baseDir}/cli/src/ui/SlashCommandUI.tsx
$xsed 's#"Clear the chat history"#"清除聊天历史"#g' ${baseDir}/cli/src/ui/SlashCommandUI.tsx
$xsed 's#"Exit the chat"#"退出聊天"#g' ${baseDir}/cli/src/ui/SlashCommandUI.tsx

# 无匹配命令提示
$xsed 's#"No matching commands found"#"未找到匹配的命令"#g' ${baseDir}/cli/src/ui/SlashCommandUI.tsx

# 键盘快捷键提示
$xsed 's#↑/↓ to navigate, Enter to select, Tab to complete#↑/↓ 导航，Enter 选择，Tab 补全#g' ${baseDir}/cli/src/ui/SlashCommandUI.tsx

# 翻译 ActionStatus.tsx 文件
echo "Translating ActionStatus.tsx..."

# 操作状态提示
$xsed 's#esc to interrupt#esc中断#g' ${baseDir}/cli/src/ui/components/ActionStatus.tsx

# 翻译 TipsDisplay.tsx 文件
echo "Translating TipsDisplay.tsx..."

# 提示消息
$xsed 's#"Use `/help` to learn keyboard shortcuts"#"使用 `/help` 学习键盘快捷键"#g' ${baseDir}/cli/src/ui/TipsDisplay.tsx
$xsed 's#"Press escape to pause cn, and press enter to continue"#"按 Esc 暂停 cn，按 Enter 继续"#g' ${baseDir}/cli/src/ui/TipsDisplay.tsx
$xsed 's#"Use arrow keys (↑/↓) to navigate through your input history"#"使用方向键 (↑/↓) 浏览输入历史"#g' ${baseDir}/cli/src/ui/TipsDisplay.tsx
$xsed "s#Multi-line input is supported by typing \"\\\\\" and pressing enter#支持多行输入，输入 \"\\\\\" 后按 Enter#g" ${baseDir}/cli/src/ui/TipsDisplay.tsx
$xsed 's#"Use `cn ls` or `/resume` to resume a previous conversation"#"使用 `cn ls` 或 `/resume` 恢复之前的对话"#g' ${baseDir}/cli/src/ui/TipsDisplay.tsx
$xsed 's#Run `cn` with the `-p` flag for headless mode. For example: `cn -p "Generate a commit message for the current changes. Output _only_ the commit message and nothing else."`#使用 `-p` 标志以无头模式运行 `cn`，例如：`cn -p "为当前更改生成提交消息，只输出提交消息"`#g' ${baseDir}/cli/src/ui/TipsDisplay.tsx
$xsed 's#"Use the /init slash command to generate an AGENTS.md file. This will help `cn` understand your codebase and generate better responses."#"使用 /init 斜杠命令生成 AGENTS.md 文件，这将帮助 `cn` 理解您的代码库并生成更好的响应。"#g' ${baseDir}/cli/src/ui/TipsDisplay.tsx

# 翻译 IntroMessage.tsx 文件
echo "Translating IntroMessage.tsx..."

# 标题和标签
$xsed 's#"Unknown"#"未知"#g' ${baseDir}/cli/src/ui/IntroMessage.tsx
$xsed 's#        Rules:#        规则：#g' ${baseDir}/cli/src/ui/IntroMessage.tsx
$xsed 's#          MCP Servers:#          MCP 服务器：#g' ${baseDir}/cli/src/ui/IntroMessage.tsx
$xsed 's#<Text bold>Org:</Text>#<Text bold>组织：</Text>#g' ${baseDir}/cli/src/ui/IntroMessage.tsx
$xsed 's#<Text bold>Config:</Text>#<Text bold>配置：</Text>#g' ${baseDir}/cli/src/ui/IntroMessage.tsx
$xsed 's#<Text bold>Model:</Text>#<Text bold>模型：</Text>#g' ${baseDir}/cli/src/ui/IntroMessage.tsx
$xsed 's#<Text color="dim">Loading...</Text>#<Text color="dim">加载中...</Text>#g' ${baseDir}/cli/src/ui/IntroMessage.tsx
$xsed 's#Switched to model:#切换到模型：#g' ${baseDir}/cli/src/ui/hooks/useModelSelector.ts
$xsed 's#to navigate, Enter to select, Esc to cancel# 导航，Enter 选择，Esc 取消#g' ${baseDir}/cli/src/ui/Selector.tsx
$xsed 's#Signing in with Continue#登录 账户#g' ${baseDir}/cli/src/auth/workos.ts
# 翻译 commands.ts 文件
$xsed 's#"Compacting history"#"压缩聊天历史"#g' ${baseDir}/cli/src/ui/TUIChat.tsx
echo "Translating commands.ts..."

# 系统斜杠命令描述
$xsed 's#"Show help message"#"显示帮助信息"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Clear the chat history"#"清除聊天历史"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Authenticate with your account"#"登录您的账户"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Sign out of your current session"#"退出当前会话"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Update the Continue CLI"#"更新 Continue CLI"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed "s#\"Check who you're currently logged in as\"#\"查看当前登录用户\"#g" ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Show session information"#"显示会话信息"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Switch between available chat models"#"切换可用的聊天模型"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Switch configuration or organization"#"切换配置或组织"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Manage MCP server connections"#"管理 MCP 服务器连接"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Create an AGENTS.md file"#"创建 AGENTS.md 文件"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Summarize chat history into a compact form"#"将聊天历史汇总为紧凑形式"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Resume a previous chat session"#"恢复之前的聊天会话"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Start a forked chat session from the current history"#"从当前历史启动分叉聊天会话"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Set the title for the current session"#"设置当前会话的标题"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Rename the current session"#"重命名当前会话"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Exit the chat"#"退出聊天"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"List background jobs"#"列出后台任务"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Show all chat sessions"#"显示所有聊天会话"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"List all available skills"#"列出所有可用技能"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Import a skill from a URL or name into ~/.continue/skills"#"从 URL 或名称导入技能到 ~/.continue/skills"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Export a session to JSON file"#"将会话导出到 JSON 文件"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Import a session from JSON file"#"从 JSON 文件导入会话"#g' ${baseDir}/cli/src/commands/commands.ts

# 远程模式命令描述
$xsed 's#"Exit the remote environment"#"退出远程环境"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Show the current diff from the remote environment"#"显示远程环境的当前差异"#g' ${baseDir}/cli/src/commands/commands.ts
$xsed 's#"Apply the current diff to the local working tree"#"将当前差异应用到本地工作树"#g' ${baseDir}/cli/src/commands/commands.ts

# 翻译 ToolPermissionSelector.tsx 文件
echo "Translating ToolPermissionSelector.tsx..."

# 权限选项名称
$xsed 's#name: "Continue",#name: "继续",#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
$xsed "s#name: \"Continue + don't ask again\",#name: \"继续 + 不再询问\",#g" ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
$xsed 's#name: "No, and tell Continue what to do differently",#name: "拒绝，并告知如何改进",#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx

# 提示文本
$xsed 's#"Would you like to continue?"#"是否继续？"#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx

# 警告文本
# $xsed 's#"Note: Dangerous commands will be blocked regardless of your preference."#"注意：危险命令将被阻止，与您的偏好无关。"#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
$xsed 's#Note: Dangerous commands will be blocked regardless of your#注意：危险命令将被阻止，与您的偏好无关。#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
$xsed 's# preference.##g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
# 翻译 useChat.compaction.ts 文件
echo "Translating useChat.compaction.ts..."

# 压缩相关消息
$xsed 's#"Chat history compacted successfully."#"聊天历史压缩成功。"#g' ${baseDir}/cli/src/ui/hooks/useChat.compaction.ts
$xsed 's#"Compaction cancelled."#"压缩已取消。"#g' ${baseDir}/cli/src/ui/hooks/useChat.compaction.ts
$xsed 's#"Compaction failed: #"压缩失败：#g' ${baseDir}/cli/src/ui/hooks/useChat.compaction.ts

# 翻译 chat.ts 文件
echo "Translating chat.ts..."

# JSON 输出消息
$xsed 's#"Response was not valid JSON, so it was wrapped in a JSON object"#"响应不是有效的 JSON，已将其包装在 JSON 对象中"#g' ${baseDir}/cli/src/commands/chat.ts

# 日志消息
$xsed 's#"Forking from existing session..."#"从现有会话分叉..."#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Session with ID "#"会话 ID "#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#" not found."#" 未找到。"#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Resuming previous session..."#"恢复之前的会话..."#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"No previous session found, starting fresh..."#"未找到之前的会话，开始新会话..."#g' ${baseDir}/cli/src/commands/chat.ts

# 压缩相关消息
$xsed 's#"Compacting chat history..."#"正在压缩聊天历史..."#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Chat history compacted"#"聊天历史已压缩"#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Compaction error: #"压缩错误：#g' ${baseDir}/cli/src/commands/chat.ts

# 自动压缩相关消息
$xsed 's#"Auto-compacting triggered"#"自动压缩已触发"#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Auto-compacted successfully"#"自动压缩成功"#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Auto-compaction failed, continuing without compaction"#"自动压缩失败，继续不压缩"#g' ${baseDir}/cli/src/commands/chat.ts

# 错误消息
$xsed 's#"No models were found."#"未找到模型。"#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"No LLM API instance found."#"未找到 LLM API 实例。"#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Headless mode requires a prompt. Use: cn -p "your prompt"\n"#"无头模式需要提示。使用：cn -p "your prompt"\n"#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Or pipe input: echo "prompt" | cn -p\n"#"或管道输入：echo "prompt" | cn -p\n"#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Or use agent files: cn -p --agent my-org/my-agent\n"#"或使用代理文件：cn -p --agent my-org/my-agent\n"#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Note: Agent files must contain a prompt field."#"注意：代理文件必须包含 prompt 字段。"#g' ${baseDir}/cli/src/commands/chat.ts

# 命令行提示
$xsed 's#"You:"#"你："#g' ${baseDir}/cli/src/commands/chat.ts
$xsed 's#"Assistant:"#"助手："#g' ${baseDir}/cli/src/commands/chat.ts

# 致命错误消息
$xsed 's#"Fatal error: #"致命错误：#g' ${baseDir}/cli/src/commands/chat.ts

# 翻译 slashCommands.ts 文件
echo "Translating slashCommands.ts..."

# 帮助消息标题
$xsed 's#"Keyboard Shortcuts:"#"键盘快捷键："#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Navigation:"#"导航："#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Controls:"#"控制："#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Special Characters:"#"特殊字符："#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Available Commands:"#"可用命令："#g' ${baseDir}/cli/src/slashCommands.ts

# 键盘快捷键描述
$xsed 's#Navigate command/file suggestions or history#导航命令/文件建议或历史#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Complete command or file selection#完成命令或文件选择#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Submit message#提交消息#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#New line#新行#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Line continuation (at end of line)#行继续（在行末）#' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Shell mode - run shell commands#Shell 模式 - 运行 shell 命令#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Clear input#清除输入#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Exit application#退出应用#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Clear screen#清屏#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Cycle permission modes (normal/plan/auto)#循环权限模式（正常/计划/自动）#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Cancel streaming or close suggestions#取消流式传输或关闭建议#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Search and attach files for context#搜索并附加文件作为上下文#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Access slash commands#访问斜杠命令#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Execute bash commands directly#直接执行 bash 命令#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Type ${chalk.cyan("/")} to see available slash commands#输入 ${chalk.cyan("/")} 查看可用的斜杠命令#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#Type ${chalk.cyan("!")} followed by a command to execute bash directly#输入 ${chalk.cyan("!")} 后跟命令直接执行 bash#g' ${baseDir}/cli/src/slashCommands.ts

# 登录/登出消息
$xsed 's#"Login successful! All services updated automatically."#"登录成功！所有服务已自动更新。"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Login failed: #"登录失败：#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Logged out successfully"#"成功退出登录"#g' ${baseDir}/cli/src/slashCommands.ts

# whoami 消息
$xsed 's#"Logged in as #"登录用户：#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Authenticated via environment variable"#"通过环境变量认证"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Not logged in. Use /login to authenticate."#"未登录。使用 /login 进行认证。"#g' ${baseDir}/cli/src/slashCommands.ts

# fork 命令消息
$xsed 's#"(copied to clipboard)"#"（已复制到剪贴板）"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Failed to create fork command: #"创建分叉命令失败：#g' ${baseDir}/cli/src/slashCommands.ts

# title 命令消息
$xsed 's#"Please provide a title. Usage: /title <your title>"#"请提供标题。用法：/title <您的标题>"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Session title updated to: "#"会话标题已更新为："#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Failed to update title: #"更新标题失败：#g' ${baseDir}/cli/src/slashCommands.ts

# skills 命令消息
$xsed 's#"No skills found. Add skills under .continue/skills or .claude/skills."#"未找到技能。请在 .continue/skills 或 .claude/skills 下添加技能。"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Available skills:"#"可用技能："#g' ${baseDir}/cli/src/slashCommands.ts

# import-skill 命令消息
$xsed 's#"Please provide a skill URL or name. Usage: /import-skill <url-or-name>"#"请提供技能 URL 或名称。用法：/import-skill <url-or-name>"#g' ${baseDir}/cli/src/slashCommands.ts

# import 命令消息
$xsed 's#"Please provide a file path. Usage: /import <file-path>"#"请提供文件路径。用法：/import <file-path>"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"File not found: #"文件未找到：#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Invalid session file: expected a valid Continue exported session (version 1)."#"无效的会话文件：期望有效的 Continue 导出会话（版本 1）。"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Session imported with new ID: #"会话已导入，新 ID：#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"(original ID: #"（原始 ID：#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#" already existed)"#" 已存在）"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Session imported: #"会话已导入：#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Failed to import session: #"导入会话失败：#g' ${baseDir}/cli/src/slashCommands.ts

# 其他命令消息
$xsed 's#"Chat history cleared"#"聊天历史已清除"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Goodbye!"#"再见！"#g' ${baseDir}/cli/src/slashCommands.ts
$xsed 's#"Unknown command: #"未知命令：#g' ${baseDir}/cli/src/slashCommands.ts

# 翻译 onboarding.ts 文件
echo "Translating onboarding.ts..."

# 环境检测消息
$xsed 's#"✓ Using AWS Bedrock (CONTINUE_USE_BEDROCK detected)"#"✓ 使用 AWS Bedrock（已检测到 CONTINUE_USE_BEDROCK）"#g' ${baseDir}/cli/src/onboarding.ts
$xsed 's#"✓ Using ANTHROPIC_API_KEY from environment"#"✓ 使用环境变量中的 ANTHROPIC_API_KEY"#g' ${baseDir}/cli/src/onboarding.ts
$xsed 's#"  Config saved to: #"  配置已保存到：#g' ${baseDir}/cli/src/onboarding.ts

# 引导消息
$xsed 's#"How do you want to get started?"#"您想如何开始？"#g' ${baseDir}/cli/src/onboarding.ts
$xsed 's#"1. ⏩ Log in with Continue"#"1. ⏩ 使用 Continue 登录"#g' ${baseDir}/cli/src/onboarding.ts
$xsed 's#"2. 🔑 Enter your Anthropic API key"#"2. 🔑 输入您的 Anthropic API 密钥"#g' ${baseDir}/cli/src/onboarding.ts

# 提示消息
$xsed 's#"\nEnter choice (1): "#"\n请输入选择 (1)："#g' ${baseDir}/cli/src/onboarding.ts
$xsed 's#"Please enter 1 or 2"#"请输入 1 或 2"#g' ${baseDir}/cli/src/onboarding.ts
$xsed 's#"\nEnter your Anthropic API key: "#"\n请输入您的 Anthropic API 密钥："#g' ${baseDir}/cli/src/onboarding.ts

# 成功消息
$xsed 's#"✓ Config file updated successfully at #"✓ 配置文件已成功更新到：#g' ${baseDir}/cli/src/onboarding.ts

# 错误消息
$xsed 's#"Invalid choice. Please select \"1\" or \"2\""#"无效选择。请选择 \"1\" 或 \"2\""#g' ${baseDir}/cli/src/onboarding.ts
$xsed 's#"Failed to load config from \"#"加载配置失败，来自 \"#g' ${baseDir}/cli/src/onboarding.ts

# 翻译 ModelCapabilityWarning.tsx 文件
echo "Translating ModelCapabilityWarning.tsx..."

$xsed 's#Model Capability Warning#模型能力警告#g' ${baseDir}/cli/src/ui/ModelCapabilityWarning.tsx
$xsed 's#The model "{modelName}" is not recommended for use with cn due to limited reasoning and tool calling capabilities#模型 "{modelName}" 由于推理和工具调用能力有限，不建议与分布式编码助手一起使用#g' ${baseDir}/cli/src/ui/ModelCapabilityWarning.tsx

# 翻译 UpdateNotification.tsx 文件
echo "Translating UpdateNotification.tsx..."

$xsed 's#"Continue CLI"#"分布式编码助手 CLI"#g' ${baseDir}/cli/src/ui/UpdateNotification.tsx
$xsed 's#Remote Mode#远程模式#g' ${baseDir}/cli/src/ui/UpdateNotification.tsx

# 翻译 UpdateSelector.tsx 文件
echo "Translating UpdateSelector.tsx..."

$xsed 's#"Update Continue CLI"#"更新分布式编码助手 CLI"#g' ${baseDir}/cli/src/ui/UpdateSelector.tsx
$xsed 's#"Run update"#"运行更新"#g' ${baseDir}/cli/src/ui/UpdateSelector.tsx
$xsed 's#"Turn off auto-updates"#"关闭自动更新"#g' ${baseDir}/cli/src/ui/UpdateSelector.tsx
$xsed 's#"Turn on auto-updates"#"开启自动更新"#g' ${baseDir}/cli/src/ui/UpdateSelector.tsx
$xsed 's#"Back"#"返回"#g' ${baseDir}/cli/src/ui/UpdateSelector.tsx
$xsed 's#"Update service error"#"更新服务错误"#g' ${baseDir}/cli/src/ui/UpdateSelector.tsx
$xsed 's#"Update failed"#"更新失败"#g' ${baseDir}/cli/src/ui/UpdateSelector.tsx
$xsed 's#"Preparing update..."#"准备更新..."#g' ${baseDir}/cli/src/ui/UpdateSelector.tsx
$xsed 's#"Working..."#"处理中..."#g' ${baseDir}/cli/src/ui/UpdateSelector.tsx

# 翻译 ModelSelector.tsx 文件
echo "Translating ModelSelector.tsx..."

$xsed 's#"Select Model"#"选择模型"#g' ${baseDir}/cli/src/ui/ModelSelector.tsx
$xsed 's#"No chat models available in the configuration"#"配置中没有可用的聊天模型"#g' ${baseDir}/cli/src/ui/ModelSelector.tsx
$xsed 's#"Failed to load models"#"加载模型失败"#g' ${baseDir}/cli/src/ui/ModelSelector.tsx
$xsed 's#"Loading available models..."#"正在加载可用模型..."#g' ${baseDir}/cli/src/ui/ModelSelector.tsx

# 翻译 ConfigSelector.tsx 文件
echo "Translating ConfigSelector.tsx..."

$xsed 's#"Select Configuration"#"选择配置"#g' ${baseDir}/cli/src/ui/ConfigSelector.tsx
$xsed 's#"\[Personal\] Local config.yaml"#"[个人] 本地配置文件"#g' ${baseDir}/cli/src/ui/ConfigSelector.tsx
$xsed 's#"Create new assistant"#"创建新助手"#g' ${baseDir}/cli/src/ui/ConfigSelector.tsx
$xsed 's#" (opens web)"#"（打开网页）"#g' ${baseDir}/cli/src/ui/ConfigSelector.tsx
$xsed 's#"Failed to load configurations"#"加载配置失败"#g' ${baseDir}/cli/src/ui/ConfigSelector.tsx
$xsed 's#"Loading configurations..."#"正在加载配置..."#g' ${baseDir}/cli/src/ui/ConfigSelector.tsx

# 翻译 ToolPermissionSelector.tsx 文件
echo "Translating ToolPermissionSelector.tsx..."

$xsed 's#name: "Continue",#name: "继续",#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
$xsed 's#name: "Continue \\+ don'"'"'t ask again",#name: "继续 + 不再询问",#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
$xsed 's#name: "No, and tell Continue what to do differently",#name: "拒绝，并告知如何改进",#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
$xsed 's#"Would you like to continue?"#"是否继续？"#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
$xsed 's#Note: Dangerous commands will be blocked regardless of your preference.#注意：危险命令将被阻止，与您的偏好无关。#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx

# 翻译 ActionStatus.tsx 文件
echo "Translating ActionStatus.tsx..."

$xsed 's#esc to interrupt#按 esc 中断#g' ${baseDir}/cli/src/ui/components/ActionStatus.tsx

# 翻译 BottomStatusBar.tsx 文件
echo "Translating BottomStatusBar.tsx..."

$xsed 's#"Press Ctrl+V to paste image"#"按 Ctrl+V 粘贴图片"#g' ${baseDir}/cli/src/ui/components/BottomStatusBar.tsx
$xsed 's#"ctrl+c to exit"#"按 ctrl+c 退出"#g' ${baseDir}/cli/src/ui/components/BottomStatusBar.tsx

# 翻译 SessionSelector.tsx 文件
echo "Translating SessionSelector.tsx..."

$xsed 's#"No previous sessions found."#"未找到之前的会话。"#g' ${baseDir}/cli/src/ui/SessionSelector.tsx
$xsed 's#"Start a new conversation with: cn"#"使用 cn 启动新对话"#g' ${baseDir}/cli/src/ui/SessionSelector.tsx
$xsed 's#"Press Esc to exit"#"按 Esc 退出"#g' ${baseDir}/cli/src/ui/SessionSelector.tsx
$xsed 's#"Recent Sessions"#"最近会话"#g' ${baseDir}/cli/src/ui/SessionSelector.tsx
$xsed 's#"Preview"#"预览"#g' ${baseDir}/cli/src/ui/SessionSelector.tsx
$xsed 's#"(remote session preview not available)"#"（远程会话预览不可用）"#g' ${baseDir}/cli/src/ui/SessionSelector.tsx
$xsed 's#"(loading...)"#"（加载中...）"#g' ${baseDir}/cli/src/ui/SessionSelector.tsx
$xsed 's#"more sessions above..."#"更多会话在上方..."#g' ${baseDir}/cli/src/ui/SessionSelector.tsx
$xsed 's#"more sessions below..."#"更多会话在下方..."#g' ${baseDir}/cli/src/ui/SessionSelector.tsx

# 翻译 workos.ts 文件
echo "Translating workos.ts..."

$xsed 's#"Error loading auth config:"#"加载认证配置错误："#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Error saving auth config:"#"保存认证配置错误："#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Failed to refresh auto token"#"自动令牌刷新失败"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Device authorization error:"#"设备授权错误："#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Oops! We had trouble authenticating. Please try again and reach out if the error persists."#"认证时遇到问题，请重试。如果问题持续存在，请联系我们。"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"authorization_pending"#"authorization_pending"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"slow_down"#"slow_down"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"access_denied"#"access_denied"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"expired_token"#"expired_token"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"User denied access"#"用户拒绝访问"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Device code has expired"#"设备代码已过期"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Token polling error:"#"令牌轮询错误："#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Device authorization timeout"#"设备授权超时"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Token refresh error:"#"令牌刷新错误："#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"✅ Success!"#"✅ 成功！"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Using CONTINUE_API_KEY from environment variables, nothing to log out"#"使用环境变量中的 CONTINUE_API_KEY，无需退出登录"#g' ${baseDir}/cli/src/auth/workos.ts
$xsed 's#"Successfully logged out"#"成功退出登录"#g' ${baseDir}/cli/src/auth/workos.ts

echo "########## CLI UI Translation Complete ##########"

echo ".continue directory and logo custom"
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/env.ts
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/auth/workos.ts
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/session.ts
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/hooks/hookConfig.ts
find ../ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.mdx" \)  -exec ${xsed} 's/Continue CLI/AICoder CLI/g' {} +
find ../ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.mdx" \)  -exec ${xsed} 's/".continue"/".cowork"/g' {} +
find ../ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.mdx" \)  -exec ${xsed} 's#.continue/#.cowork/#g' {} +

