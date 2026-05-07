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
$xsed 's#"Authenticate with Continue"#"登录 Continue"#g' ${baseDir}/cli/src/index.ts
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
$xsed 's#"Interrupted by user - Press enter to continue"#"用户已中断 - 按 Enter 继续"#g' ${baseDir}/cli/src/ui/UserInput.tsx

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
$xsed 's#"↑/↓ to navigate, Enter to select, Tab to complete, Ctrl+r to refresh list"#"↑/↓ 导航，Enter 选择，Tab 补全，Ctrl+r 刷新列表"#g' ${baseDir}/cli/src/ui/FileSearchUI.tsx
$xsed 's#"Ctrl+r to refresh list (this may take several seconds)"#"Ctrl+r 刷新列表（可能需要几秒钟）"#g' ${baseDir}/cli/src/ui/FileSearchUI.tsx
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
$xsed 's#"↑/↓ to navigate, Enter to select, Tab to complete"#"↑/↓ 导航，Enter 选择，Tab 补全"#g' ${baseDir}/cli/src/ui/SlashCommandUI.tsx

# 翻译 ActionStatus.tsx 文件
echo "Translating ActionStatus.tsx..."

# 操作状态提示
$xsed 's#esc to interrupt#esc中断#g' ${baseDir}/cli/src/ui/components/ActionStatus.tsx

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

# 翻译 commands.ts 文件
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
$xsed 's#Note: Dangerous commands will be blocked regardless of your preference.#注意：危险命令将被阻止，与您的偏好无关。#g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx
$xsed 's# preference.##g' ${baseDir}/cli/src/ui/components/ToolPermissionSelector.tsx

echo "########## CLI UI Translation Complete ##########"

echo ".continue directory and logo custom"
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/env.ts
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/auth/workos.ts
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/session.ts
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/hooks/hookConfig.ts
find ../ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.mdx" \)  -exec ${xsed} 's/Continue CLI/AICoder CLI/g' {} +
find ../ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.mdx" \)  -exec ${xsed} 's/".continue"/".cowork"/g' {} +
find ../ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.mdx" \)  -exec ${xsed} 's#.continue/#.cowork/#g' {} +

