#!/bin/bash

baseDir=$(cd `dirname $0`;pwd)
cd $baseDir
execStartTime=`date +%Y%m%d-%H:%M:%S`

echo "${execStartTime} Exe Dir: $baseDir"
xsed='sed -i'
system=`uname`
if [ "$system" == "Darwin" ]; then
  echo "This is macOS"
  xsed="sed -i .bak"
else
  echo "This is Linux"
  xsed='sed -i'
fi  
echo "########## custom llmserv llm provider ########## "
cp ${baseDir}/../core/llm/llms/Ollama.ts ${baseDir}/../core/llm/llms/Llmserv.ts
$sed 's#providerName = "ollama"#providerName = "llmserv"#g' ${baseDir}/../core/llm/llms/llmserv.ts
$sed 's#LlamaStack#Llmserv#g' ${baseDir}/../core/llm/llms/index.ts

echo "########## custom replace begin ########## "
echo ".continue custom"
$xsed 's#"AI",#"人工智能",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"Chat",#"语言模型",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"Programming Languages",#"智能研发",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"Education",#"智能体",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"Machine Learning",#"规格编程",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"Snippets"#"编码辅助"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#Error handling model response#模型响应错误#g' ${baseDir}/../gui/src/pages/gui/StreamError.tsx
$xsed 's#There was an error handling the response from#响应时发生错误来自#g' ${baseDir}/../gui/src/pages/gui/StreamError.tsx
$xsed 's#Please try to submit your message again.#请稍后重试#g' ${baseDir}/../gui/src/pages/gui/StreamError.tsx
$xsed 's#Resubmit last message#重新提交最后一条消息#g' ${baseDir}/../gui/src/pages/gui/StreamError.tsx
$xsed 's#"View error output"#"查看错误输出"#g' ${baseDir}/../gui/src/pages/gui/StreamError.tsx
$xsed 's#Copy output#复制输出#g' ${baseDir}/../gui/src/pages/gui/StreamError.tsx
$xsed 's#View Logs#查看日志#g' ${baseDir}/../gui/src/pages/gui/StreamError.tsx

$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/env.ts
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../core/util/paths.ts
$xsed 's#".continue/"#".cowork/"#g' ${baseDir}/../core/config/workspace/workspaceBlocks.ts
$xsed 's#.continue/#.cowork/#g' ${baseDir}/../core/config/workspace/workspaceBlocks.ts
$xsed 's#".continue"#".cowork"#g' ${baseDir}/../extensions/cli/src/hooks/hookConfig.ts
find ../ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.mdx" \)  -exec ${xsed} 's/".continue")/".cowork")/g' {} +
find ../ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.mdx" \)  -exec ${xsed} 's/".continue"/".cowork"/g' {} +

$xsed 's#selectedProfile\?.profileType === "local"#false#g'  ${baseDir}/../gui/src/components/modelSelection/ModelSelect.tsx
$xsed 's#<CliInstallBanner permanentDismissal={true} />#{/* <CliInstallBanner permanentDismissal={true} /> */}#g'  ${baseDir}/../gui/src/pages/config/index.tsx
awk '/permanentDismissal={true}/ {p=1; print; next} p {print $0 " */}"; p=0; next} 1' ${baseDir}/../gui/src/pages/gui/Chat.tsx > /tmp/Chat.tsx.tmp && mv /tmp/Chat.tsx.tmp ${baseDir}/../gui/src/pages/gui/Chat.tsx
$xsed 's#<CliInstallBanner#\{/* <CliInstallBanner#g'  ${baseDir}/../gui/src/pages/gui/Chat.tsx


# awk '/permanentDismissal={true}/ {p=1; print; next} p {print $0 " */}"; p=0; next} 1' ../gui/src/pages/gui/Chat.tsx > /tmp/Chat.tsx.tmp && mv /tmp/Chat.tsx.tmp ../gui/src/pages/gui/Chat.tsx

echo "readme custom"
cp ${baseDir}/../extensions/vscode/README.zh.md ${baseDir}/../extensions/vscode/README.md
echo "ui custom"

# 目标文件路径（请替换为你的实际文件路径，如 ./src/components/Login.jsx）
TARGET_FILE=${baseDir}/../gui/src/components/OnboardingCard/components/OnboardingCardLanding.tsx

# $xsed 's#<p className="mb-5 mt-0 w-full text-sm">#\{/*<p className="mb-5 mt-0 w-full text-sm">#g' ${TARGET_FILE}
# $xsed 's#<ContinueLogo height={75} />#{/* <ContinueLogo height={75} /> */}#g' ${TARGET_FILE}
# $xsed '/Log in to Continue Hub/ { n; s#$#*/\}#; }'  ${TARGET_FILE}
# $xsed 's#Or, configure your own models#Configure your own models#g'  ${TARGET_FILE}

echo "########## custom logo ##########"
cp -pv ${baseDir}/../extensions/vscode/media/icon-custom.png ${baseDir}/../extensions/vscode/media/icon.png
cp -pv ${baseDir}/../extensions/vscode/media/sidebar-icon-custom.png ${baseDir}/../extensions/vscode/media/sidebar-icon.png


echo "########## custom plugin ########## "
find ../ -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.mdx" | xargs -I@ bash -c "${xsed} -i.bak 's#Continue.continue#Roweb.aicoder#g' @"
$xsed 's#"name": "continue",#"name": "aicoder",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"publisher": "Continue",#"publisher": "Roweb",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#Continue Dev#Roweb Dev#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"homepage": "https://continue.dev"#"homepage": "https://roweb.cn"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#https://hub.continue.dev/#https://hub.roweb.cn/#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#https://github.com/continuedev/continue#https://github.com/blockai/aicoder#g' ${baseDir}/../extensions/vscode/package.json
# $xsed 's#"publisher":.*#"publisher": "roweb",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"label": "Continue"#"label": "分布式编码助手"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"name": "Continue#"name": "分布式编码助手#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#Continue Console#分布式编码助手#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#          "title": "Continue",#          "title": "分布式编码助手",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#      "title": "Continue",#      "title": "分布式编码助手",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"displayName":.*#"displayName": "分布式编码助手",#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#  "description": "The leading open-source AI code agent",#  "description": "研发智能体，助效能提升",#g' ${baseDir}/../extensions/vscode/package.json

# Translate configuration descriptions
$xsed 's#Continue collects anonymous usage data, cleaned of PII, to help us improve the product for our users.#Continue 收集匿名使用数据（已清除个人身份信息），以帮助我们为用户改进产品。#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#This setting is deprecated and will be removed in a later version.#此设置已弃用，将在后续版本中移除。#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#Please use the _Telemetry > Allow Anonymous Telemetry_ setting in the extension#请使用扩展用户设置页面中的 _遥测 > 允许匿名遥测_ 设置。#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#Show inline suggestion to use the Continue keyboard shortcuts#显示使用 Continue 键盘快捷键的内联建议#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#Disable the quick fix feature.#禁用快速修复功能。#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#Enable the experimental Quick Actions feature.#启用实验性快速操作功能。#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#Enable Continue#启用 Continue#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#Pause Continue#暂停 Continue#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#If your team is set up to use shared configuration#如果您的团队设置了使用共享配置#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#The period of time in minutes between automatic syncs.#自动同步之间的时间间隔（分钟）。#g' ${baseDir}/../extensions/vscode/package.json

# Translate commands titles
$xsed 's#"title": "Apply code from chat"#"title": "应用聊天中的代码"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Accept Diff"#"title": "接受差异"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Reject Diff"#"title": "拒绝差异"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Accept Vertical Diff Block"#"title": "接受垂直差异块"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Reject Vertical Diff Block"#"title": "拒绝垂直差异块"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Add to Edit"#"title": "添加到编辑"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Add Highlighted Code to Context and Clear Chat"#"title": "将高亮代码添加到上下文并清空聊天"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Add to Chat"#"title": "添加到聊天"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Debug Terminal"#"title": "调试终端"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Exit Edit Mode"#"title": "退出编辑模式"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Open Settings"#"title": "打开设置"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Toggle Autocomplete Enabled"#"title": "切换自动补全"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Continue: Force Autocomplete"#"title": "Continue: 强制自动补全"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Select Files as Context"#"title": "选择文件作为上下文"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "New Session"#"title": "新建会话"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Share Current Chat Session as Markdown"#"title": "分享当前聊天会话为 Markdown"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "View History"#"title": "查看历史"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "View Logs"#"title": "查看日志"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Clear Console"#"title": "清空控制台"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Navigate to a path"#"title": "导航到路径"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Write Comments for this Code"#"title": "为此代码编写注释"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Write a Docstring for this Code"#"title": "为此代码编写文档字符串"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Fix this Code"#"title": "修复此代码"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Optimize this Code"#"title": "优化此代码"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Fix Grammar / Spelling"#"title": "修复语法/拼写"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Codebase Force Re-Index"#"title": "代码库强制重新索引"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Rebuild codebase index"#"title": "重建代码库索引"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Docs Index"#"title": "文档索引"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Docs Force Re-Index"#"title": "文档强制重新索引"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Focus Continue Chat"#"title": "聚焦 Continue 聊天"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Enter Enterprise License Key"#"title": "输入企业许可证密钥"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Continue: Toggle Next Edit"#"title": "Continue: 切换下一个编辑"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Hide Next Edit Suggestion"#"title": "隐藏下一个编辑建议"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Accept Next Edit Suggestion"#"title": "接受下一个编辑建议"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Continue: Force Next Edit"#"title": "Continue: 强制下一个编辑"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Continue: Accept Jump Suggestion"#"title": "Continue: 接受跳转建议"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Continue: Reject Jump Suggestion"#"title": "Continue: 拒绝跳转建议"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Generate Rule"#"title": "生成规则"#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#"title": "Open in new window"#"title": "在新窗口中打开"#g' ${baseDir}/../extensions/vscode/package.json

# Translate keybindings titles
$xsed 's#"title": "Edit code with natural language"#"title": "使用自然语言编辑代码"#g' ${baseDir}/../extensions/vscode/package.json

# $xsed 's#"category": "Continue"#"category": "AiCoder"#g' ${baseDir}/../extensions/vscode/package.json
# $xsed 's#"group": "Continue"#"group": "AiCoder"#g' ${baseDir}/../extensions/vscode/package.json

# $xsed 's#continue#aicoder#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#aicoderdev/config-types":#continuedev/config-types":#g' ${baseDir}/../extensions/vscode/package.json
$xsed 's#aicoderdev/fetch":#continuedev/fetch":#g' ${baseDir}/../extensions/vscode/package.json

echo "########## custom gui ########## "

$xsed 's#return <OnboardingProvidersTab />;#return <OnboardingLocalTab />;#g' ${baseDir}/../gui/src/components/OnboardingCard/OnboardingCard.tsx
$xsed 's#return <OnboardingModelsAddOnTab />;#return <OnboardingLocalTab />;#g' ${baseDir}/../gui/src/components/OnboardingCard/OnboardingCard.tsx


$xsed 's#to toggle config#切换配置#g' ${baseDir}/../gui/src/components/AssistantAndOrgListbox/index.tsx
$xsed 's#Screen width too small#屏幕宽度太小#g' ${baseDir}/../gui/src/pages/config/index.tsx
$xsed 's#To view settings, please expand the sidebar by dragging the#为查看设置, 请通过拖动侧边栏的#g' ${baseDir}/../gui/src/pages/config/index.tsx
$xsed 's# left/right border#左/右边界#g' ${baseDir}/../gui/src/pages/config/index.tsx

# 简化 session 按钮的文本
$xsed 's#<span className="text-2xs">Log out</span>#<span className="text-2xs"></span>#g' ${baseDir}/../gui/src/components/AssistantAndOrgListbox/index.tsx
$xsed 's#<span className="text-2xs">Log in</span>#<span className="text-2xs"></span>#g' ${baseDir}/../gui/src/components/AssistantAndOrgListbox/index.tsx
$xsed 's#<ArrowRightStartOnRectangleIcon className="ml-1.5 mr-2 h-3.5 w-3.5 flex-shrink-0" />##g' ${baseDir}/../gui/src/components/AssistantAndOrgListbox/index.tsx
$xsed 's#<ArrowRightStartOnRectangleIcon className="ml-1.5 mr-2 h-3.5 w-3.5 flex-shrink-0 rotate-180" />##g' ${baseDir}/../gui/src/components/AssistantAndOrgListbox/index.tsx
$xsed 's#<span className="text-2xs">Reload</span>#<span className="text-2xs">重新加载</span>#g' ${baseDir}/../gui/src/components/AssistantAndOrgListbox/index.tsx

$xsed 's#View errors#查看错误#g' ${baseDir}/../gui/src/components/AssistantAndOrgListbox/AssistantOption.tsx
$xsed 's#"Ask anything, #"询问任何事情，#g' ${baseDir}/../gui/src/components/mainInput/TipTapEditor/utils/editorConfig.ts
$xsed 's# to add context"# 添加上下文"#g' ${baseDir}/../gui/src/components/mainInput/TipTapEditor/utils/editorConfig.ts
$xsed 's#"Ask a follow-up"#"继续提问"#g' ${baseDir}/../gui/src/components/mainInput/TipTapEditor/utils/editorConfig.ts

$xsed 's#content="Select Config"#content="选择配置"#g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/BlockSettingsTopToolbar.tsx
$xsed 's#View configuration errors#查看配置错误#g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/BlockSettingsTopToolbar.tsx
$xsed 's#Configure rules#配置规则#g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/BlockSettingsTopToolbar.tsx
$xsed 's#Configure tools#配置工具#g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/BlockSettingsTopToolbar.tsx
$xsed 's#Configure models#配置模型#g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/BlockSettingsTopToolbar.tsx
$xsed 's#: "Local Config",#: "本地配置",#g' ${baseDir}/../core/config/profile/LocalProfileLoader.ts
$xsed 's#: "Local Config",#: "本地配置",#g' ${baseDir}/../core/config/default.ts
$xsed 's#: "Local Config",#: "本地配置",#g' ${baseDir}/../core/config/yaml/default.ts
$xsed 's# Configs# 配置#g' ${baseDir}/../gui/src/components/AssistantAndOrgListbox/index.tsx

$xsed 's#? "Chat"#? "对话"#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#: "Plan"#: "规划"#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#? "Agent"#? "智能体"#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#<span className="">Chat</span>#<span className="">对话</span>#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#All tools disabled#所有工具不可用#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#<span className="">Plan</span>#<span className="">规划</span>#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#Read-only/MCP tools available#只读模式/MCP工具可用#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#<span className="">Agent</span>#<span className="">智能体</span>#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#All tools available#所有工具可用#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#. for next mode#. 选择模式#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#<span className="">Background</span>#<span className="">后台模式</span>#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx
$xsed 's#Background mode cannot be used with local agents.#后台模式不能用于本地智能体#g' ${baseDir}/../gui/src/components/ModeSelect/ModeSelect.tsx

$xsed 's#content="Select Mode"#content="选择模式"#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#content="Select Model"#content="选择模型"#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#content="Attach Image"#content="添加图片"#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#content="Attach Context"#content="添加上下文"#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#Disable model reasoning#关闭推理模式#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#Enable model reasoning#开启推理模式#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#content="Send (⏎)"#content="发送 (⏎)"#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#?? "Enter""#?? "发送"#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#"Send With Active File"#"发送当前文件"#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#"Send Without Active File"#"不发送当前文件"#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx
$xsed 's#"Active file"#"当前文件"#g' ${baseDir}/../gui/src/components/mainInput/InputToolbar.tsx


$xsed 's#to toggle model#切换模型#g' ${baseDir}/../gui/src/components/modelSelection/ModelSelect.tsx 
$xsed 's#Add Chat model#添加聊天模型#g' ${baseDir}/../gui/src/components/modelSelection/ModelSelect.tsx
$xsed 's#No models configured#暂无模型配置#g' ${baseDir}/../gui/src/components/modelSelection/ModelSelect.tsx
$xsed 's#"Select model"#"选择模型"#g' ${baseDir}/../gui/src/components/modelSelection/ModelSelect.tsx
$xsed 's#<span className="text-description text-xs font-medium">Models</span>#<span className="text-description text-xs font-medium">模型</span>#g' ${baseDir}/../gui/src/components/modelSelection/ModelSelect.tsx
$xsed 's#Last Session#最近会话#g' ${baseDir}/../gui/src/pages/gui/Chat.tsx

# Translate ConfigTabs
$xsed 's#label: "Back",#label: "返回",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed 's#label: "Models",#label: "模型",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed 's#label: "Rules",#label: "规则",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed 's#label: "Tools",#label: "工具",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed 's#label: "Configs",#label: "配置",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed '/id: "organizations\"/,/^[[:space:]]*},[[:space:]]*$/d' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed -e ':a' -e 'N' -e '$!ba' -e 's/},\n[[:space:]]*{\n[[:space:]]*\],/},\n    ],/g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
# $xsed 's#label: "Organizations",#label: "组织",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
# awk '
# /id: "organizations"/ {
#     # 删除前一行（即对象开始的 {）
#     if (NR > 1) {
#         lines[NR-1] = ""
#     }
#     skip = 1
#     next
# }
# skip {
#     if (/^[[:space:]]*},[[:space:]]*$/) {
#         skip = 0
#     }
#     next
# }
# { lines[NR] = $0 }
# END {
#     for (i=1; i<=NR; i++) {
#         if (lines[i] != "") {
#             print lines[i]
#         }
#     }
# }
# ' /Users/block/code/continue/gui/src/pages/config/configTabs.tsx > /tmp/configTabs.tmp && mv /tmp/configTabs.tmp /Users/block/code/continue/gui/src/pages/config/configTabs.tsx

$xsed 's#label: "Indexing",#label: "索引",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed 's#label: "Settings",#label: "设置",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed 's#label: "Help",#label: "帮助",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed 's#label: "Settings",#label: "设置",#g' ${baseDir}/../gui/src/pages/config/configTabs.tsx
$xsed 's#Log in#登录#g' ${baseDir}/../gui/src/pages/config/features/account/AccountDropdown.tsx
$xsed 's#<span>Log out</span>#<span>退出</span>#g' ${baseDir}/../gui/src/pages/config/features/account/AccountDropdown.tsx
# $xsed '/if (!session) {/,/^  }/d' ${baseDir}/../gui/src/pages/config/features/account/AccountDropdown.tsx
# $xsed '/const ideMessenger = useContext(IdeMessengerContext);/a\
#   // Force hide all elements\
#   return null;' ${baseDir}/../gui/src/pages/config/features/account/AccountDropdown.tsx
# Translate 用户设置

$xsed 's#User Settings#用户设置#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Models"#title="模型"#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#addButtonTooltip="Add model"#addButtonTooltip="添加模型"#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#displayName="Chat"#displayName="对话"#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#Used in Chat, Plan, Agent mode#在对话、规划、智能体模式下使用#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#Learn more#更多#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#displayName="Autocomplete"#displayName="自动补全"#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#Used in inline code completions as you type#在你输入时，用于行内代码自动补全#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#https://docs.continue.dev#https://roweb.cn#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx

$xsed 's#displayName="Edit"#displayName="编辑"#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#displayName="Apply"#displayName="应用"#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#displayName="Embed"#displayName="嵌入"#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#displayName="Rerank"#displayName="重排序"#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#Used to transform a selected section of code#用于转换选定的代码段#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#Additional model roles#附加模型角色#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#Apply, Embed, Rerank#应用、嵌入、重新排序#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#Used to apply generated codeblocks to files#用于将生成的代码块应用到文件#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#Used to generate and query embeddings for the @codebase and @docs context providers#用于为@codebase和@docs上下文提供程序生成和查询嵌入#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx
$xsed 's#Used for reranking results from the @codebase and @docs context providers#用于重新排序来自@codebase和@docs上下文提供程序的结果#g' ${baseDir}/../gui/src/pages/config/sections/ModelsSection.tsx

$xsed 's#title="User Settings"#title="用户设置"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Chat"#title="对话"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Show Session Tabs"#title="显示会话标签"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Displays tabs above the chat as an alternative way to organize and access your sessions.#在对话上方显示标签，作为组织和访问会话的替代方式。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Wrap Codeblocks"#title="换行代码块"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Wraps long lines in code blocks instead of showing horizontal scroll.#在代码块中换行长行，而不是显示水平滚动。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Show Chat Scrollbar"#title="显示对话滚动条"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Enables a scrollbar in the chat window.#在对话窗口中启用滚动条。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Text-to-Speech Output"#title="文本到语音输出"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Reads LLM responses aloud with TTS.#使用 TTS 大声朗读 LLM 响应。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Enable Session Titles"#title="启用会话标题"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Generates summary titles for each chat session after the first message, using the current Chat model.#在第一条消息后为每个聊天会话生成摘要标题，使用当前对话模型。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Format Markdown"#title="格式化 Markdown"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#If off, shows responses as raw text.#如果关闭，显示响应为原始文本。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Telemetry"#title="遥测"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Allow Anonymous Telemetry"#title="允许匿名遥测"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Allows Continue to send anonymous telemetry.#允许发送匿名遥测。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Appearance"#title="外观"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Font Size"#title="字体大小"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Specifies base font size for UI elements.#指定 UI 元素的基准字体大小。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Autocomplete"#title="自动补全"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Multiline Autocompletions"#title="多行自动补全"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Controls multiline completions for autocomplete.#控制自动补全的多行补全。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#{ label: "Auto", value: "auto" }#{ label: "自动", value: "auto" }#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#{ label: "Always", value: "always" }#{ label: "总是", value: "always" }#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#{ label: "Never", value: "never" }#{ label: "从不", value: "never" }#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Autocomplete Timeout (ms)"#title="自动补全超时 (ms)"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Maximum time in milliseconds for autocomplete request/retrieval.#自动补全请求/检索的最大时间（毫秒）。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Autocomplete Debounce (ms)"#title="自动补全防抖 (ms)"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#Minimum time in milliseconds to trigger an autocomplete request after a change.#更改后触发自动补全请求的最小时间（毫秒）。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Disable autocomplete in files"#title="在文件中禁用自动补全"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#List of comma-separated glob pattern to disable autocomplete in matching files.#以逗号分隔的 glob 模式列表，用于在匹配文件中禁用自动补全。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#placeholder="\*\*/\*\.\(txt,md\)"#placeholder="**/*.(txt,md)"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Experimental"#title="实验性"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Show Experimental Settings"#title="显示实验性设置"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Add Current File by Default"#title="默认添加当前文件"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's# the currently open file is added as context in every new conversation.#当前打开的文件在每个新对话中作为上下文添加。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Enable experimental tools"#title="启用实验性工具"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's# enables access to experimental tools that are still in development.#启用对仍在开发中的实验性工具的访问。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Only use system message tools"#title="仅使用系统消息工具"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's# Continue will not attempt to use native tool calling and will only use system message tools.#将不会尝试使用原生工具调用，而只会使用系统消息工具。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="@Codebase: use tool calling only"#title="@代码库：仅使用工具调用"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's# @codebase context provider will only use tool calling for code retrieval.#@代码库上下文提供程序将仅使用工具调用进行代码检索。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's#title="Stream after tool rejection"#title="工具拒绝后流式传输"#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx
$xsed 's# streaming will continue after the tool call is rejected.#工具调用被拒绝后流式传输将继续。#g' ${baseDir}/../gui/src/pages/config/sections/UserSettingsSection.tsx

# Rules section translations
$xsed 's#title="Rules"#title="规则"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#addButtonTooltip="Add rules"#addButtonTooltip="添加规则"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#Reloading rules from your config...#正在从配置重新加载规则...#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#message="No rules configured. Click the + button to add your first rule."#message="未配置规则。点击 + 按钮添加您的第一个规则。"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#title="Prompts"#title="提示"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#addButtonTooltip="Add prompt"#addButtonTooltip="添加提示"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#message="No prompts configured. Click the + button to add your first prompt."#message="未配置提示。点击 + 按钮添加您的第一个提示。"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#Delete Rule#删除规则#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#Are you sure you want to delete this rule file?#您确定要删除此规则文件吗？#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#Applies to files#适用于文件#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#text="Expand"#text="展开"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#text="View"#text="查看"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#text="Edit"#text="编辑"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#text="Delete"#text="删除"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx

# Translate dropdown labels in RulesSection
$xsed 's#label: "Current workspace"#label: "当前工作区"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx
$xsed 's#label: "Global"#label: "全局"#g' ${baseDir}/../gui/src/pages/config/sections/RulesSection.tsx

# Tools section translations
$xsed 's#title="Tools"#title="工具"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#subtext="Manage MCP servers and tool policies"#subtext="管理 MCP 服务器和工具策略"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#All tools disabled in Chat, switch to Plan or Agent mode to use tools#在对话模式下所有工具被禁用，切换到规划或智能体模式以使用工具#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Read-only tools available in Plan mode#在规划模式下只读工具可用#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#displayName="Built-in Tools"#displayName="内置工具"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#title="MCP Servers"#title="MCP 服务器"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#addButtonTooltip="Add MCP server"#addButtonTooltip="添加 MCP 服务器"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#message="MCP servers are disabled in your organization"#message="MCP 服务器在您的组织中被禁用"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#All MCPs are disabled in Chat, switch to Plan or Agent mode to use MCPs#在对话模式下所有 MCP 被禁用，切换到规划或智能体模式以使用 MCP#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#message="No MCP servers configured. Click the + button to add your first server."#message="未配置 MCP 服务器。点击 + 按钮添加您的第一个服务器。"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#title="Prompts"#title="提示"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#title="Resources"#title="资源"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#No .* available#无 .* 可用#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Logout#登出#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
# $xsed 's#Edit#编辑#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
# $xsed 's#Disconnect#断开连接#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Reload#重新加载#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx

# More Tools translations: server status tooltips and auth text
$xsed 's#Active#已连接#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Connecting#连接中#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Inactive#未连接#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
# $xsed 's#Off#已禁用#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Authenticating#正在验证#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Error#错误#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Authenticate#验证#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Remove authentication#移除验证#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#Authenticating\.\.\.#正在验证...#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#displayName={"Tools"}#displayName={"工具"}#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx

# Configs section translations
$xsed 's#title="Configs"#title="配置"#g' ${baseDir}/../gui/src/pages/config/sections/ConfigsSection.tsx
$xsed 's#addButtonTooltip="Add config"#addButtonTooltip="添加配置"#g' ${baseDir}/../gui/src/pages/config/sections/ConfigsSection.tsx
$xsed 's#content="Open configuration"#content="打开配置"#g' ${baseDir}/../gui/src/pages/config/sections/ConfigsSection.tsx
$xsed 's#message="No agents configured. Click the + button to add your first agent."#message="未配置智能体。点击 + 按钮添加您的第一个智能体。"#g' ${baseDir}/../gui/src/pages/config/sections/ConfigsSection.tsx

# Indexing settings translations
$xsed 's#title="Indexing"#title="索引"#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx
$xsed 's#@codebase index#@代码库索引#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx
$xsed 's#Indexing is disabled#索引已禁用#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx
$xsed 's#title="Enable indexing"#title="启用索引"#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx
$xsed 's#Allows indexing of your codebase for search and context#允许索引您的代码库以进行搜索和上下文#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx
$xsed 's#    understanding.#    理解。#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx
$xsed 's#Note that indexing can consume significant system resources,#请注意，索引可能会消耗大量系统资源，#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx
$xsed 's#especially on larger codebases.#尤其是在较大的代码库中。#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx
$xsed 's#Indexing has been deprecated#索引已被弃用#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx

$xsed 's#make your agent aware of your codebase and documentation#让您的智能体了解您的代码库和文档#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx
$xsed 's#https://docs.continue.dev/#https://roweb.cn//#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx


$xsed 's#"Built-in Tools"#"内置工具"#g' ${baseDir}/../gui/src/pages/config/sections/ToolsSection.tsx
$xsed 's#"Add documentation#"添加文档"#g' ${baseDir}/../gui/src/pages/config/sections/docs/DocsSection.tsx
$xsed 's#No documentation sources configured.#未配置文档源。#g' ${baseDir}/../gui/src/pages/config/sections/docs/DocsSection.tsx
$xsed 's#Click the + button to add your first docs.#点击 + 按钮添加你的第一个文档。#g' ${baseDir}/../gui/src/pages/config/sections/docs/DocsSection.tsx
$xsed 's#Common documentation sites are cached for faster loading#常用文档站点已缓存以供更快加载时间。#g' ${baseDir}/../gui/src/components/dialogs/AddDocsDialog.tsx

$xsed 's#<span>Title</span>#<span>文档标题</span>#g' ${baseDir}/../gui/src/components/dialogs/AddDocsDialog.tsx
$xsed 's#Add documentation#添加文档#g' ${baseDir}/../gui/src/components/dialogs/AddDocsDialog.tsx
$xsed 's#"Title"#"文档标题"#g' ${baseDir}/../gui/src/components/dialogs/AddDocsDialog.tsx
$xsed 's#The title that will be displayed to users in the `@docs` submenu#在 `@docs` 子菜单中显示的文档标题#g' ${baseDir}/../gui/src/components/dialogs/AddDocsDialog.tsx
$xsed 's#Start URL#开始 URL#g' ${baseDir}/../gui/src/components/dialogs/AddDocsDialog.tsx
$xsed 's#The starting location to begin crawling the documentation site#开始爬取文档站点的起始位置#g' ${baseDir}/../gui/src/components/dialogs/AddDocsDialog.tsx
$xsed 's#  Add#  添加#g' ${baseDir}/../gui/src/components/dialogs/AddDocsDialog.tsx

# Fix remaining English phrase in indexing section
$xsed 's#Learn how to#了解如何#g' ${baseDir}/../gui/src/pages/config/sections/IndexingSettingsSection.tsx

# Organizations translations
$xsed 's#title="Organizations"#title="组织"#g' ${baseDir}/../gui/src/pages/config/sections/OrganizationsSection.tsx
$xsed 's#addButtonTooltip="Add organization"#addButtonTooltip="添加组织"#g' ${baseDir}/../gui/src/pages/config/sections/OrganizationsSection.tsx
$xsed 's#Organizations are only available with cloud accounts. Sign in to manage organizations.#组织仅适用于云账户。登录以管理组织。#g' ${baseDir}/../gui/src/pages/config/sections/OrganizationsSection.tsx

# Replace literal header text for Organizations page
$xsed 's#<h2 className="mb-0 text-xl font-semibold">Organizations</h2>#<h2 className="mb-0 text-xl font-semibold">组织</h2>#g' ${baseDir}/../gui/src/pages/config/sections/OrganizationsSection.tsx

# HelpSection translations (将 HelpSection 页面英文替换为中文)
$xsed 's#title="Help Center"#title="帮助中心"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx

# HelpSection shortcut descriptions translations
$xsed 's#description: "Toggle Selected Model"#description: "切换所选模型"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Edit highlighted code"#description: "编辑选中代码"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
# $xsed 's#description: "New Chat / New Chat With Selected Code / Close Continue Sidebar If Chat Already In Focus"#description: "新建聊天 / 使用所选代码新建聊天 / 若聊天已聚焦则关闭 Continue 侧边栏"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#"New Chat / New Chat With Selected Code / Close Continue Sidebar If Chat Already In Focus"#"新建对话 / 使用所选代码新建对话 / 若聊天已聚焦则关闭 插件 侧边栏"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Cancel response"#description: "取消响应"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Toggle inline edit focus"#description: "切换内联编辑焦点"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
# $xsed 's#description: "Focus Current Chat / Add Selected Code To Current Chat / Close Continue Sidebar If Chat Already In Focus"#description: "聚焦当前聊天 / 将选中代码添加到当前聊天 / 若聊天已聚焦则关闭 Continue 侧边栏"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#"Focus Current Chat / Add Selected Code To Current Chat / Close Continue Sidebar If Chat Already In Focus"#"聚焦当前对话 / 将选中代码添加到当前对话 / 若聊天已聚焦则关闭 插件 侧边栏"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Debug Terminal"#description: "调试终端"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Reject Diff"#description: "拒绝差异"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Accept Diff"#description: "接受差异"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Reject Top Change in Diff"#description: "拒绝差异中顶部更改"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Accept Top Change in Diff"#description: "接受差异中顶部更改"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Toggle Autocomplete Enabled"#description: "切换自动补全"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Force an Autocomplete Trigger"#description: "强制触发自动补全"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Toggle Full Screen"#description: "切换全屏"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Quick Input"#description: "快速输入"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description: "Toggle Sidebar"#description: "切换侧边栏"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
# 注释掉 Resources 部分的删除命令，改为仅翻译文本
# $xsed '/^[[:space:]]*\{\/\* Resources \*\/\}/,/^[[:space:]]*<\/div>[[:space:]]*$/d' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed  '177,216d' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#title="Token usage"#title="词元(Token)使用情况"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description="Daily token usage across models"#description="各模型的每日令牌用量统计"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description="Open the current chat session file for troubleshooting"#description="打开当前聊天会话文件以进行故障排查"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#description="Reopen the quickstart and tutorial file"#description="重新打开快速入门与教程文件"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx


$xsed 's#<h3 className="mb-3 text-base font-medium">Resources</h3>#<h3 className="mb-3 text-base font-medium">资源</h3>#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#<h3 className="mb-3 text-base font-medium">Tools</h3>#<h3 className="mb-3 text-base font-medium">工具</h3>#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#<h3 className="mb-3 text-base font-medium">Keyboard Shortcuts</h3>#<h3 className="mb-3 text-base font-medium">键盘快捷键</h3>#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#title="Documentation"#title="文档"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#title="Documentation"#title="文档"#g' ${baseDir}/../gui/src/pages/config/sections/DocsSection.tsx
$xsed 's#title="Have an issue\?"#title="遇到问题？"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#title="Join the community!"#title="加入社区！"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#title="Token usage"#title="令牌使用"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#title="View current session history"#title="查看当前会话历史"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#title="Quickstart"#title="快速上手"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#title="Theme Test Page"#title="主题测试页"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx
$xsed 's#title="Help Center"#title="帮助中心"#g' ${baseDir}/../gui/src/pages/config/sections/HelpSection.tsx


$xsed 's#title="More"#title="更多"#g' ${baseDir}/../gui/src/pages/stats.tsx
$xsed 's#Tokens per Day#每日Token用量#g' ${baseDir}/../gui/src/pages/stats.tsx
$xsed 's#<Th>Day</Th>#<Th>日期</Th>#g' ${baseDir}/../gui/src/pages/stats.tsx
$xsed 's#<Th>Generated Tokens</Th>#<Th>生成的Token数量</Th>#g' ${baseDir}/../gui/src/pages/stats.tsx
$xsed 's#<Th>Prompt Tokens</Th>#<Th>输入Token数量</Th>#g' ${baseDir}/../gui/src/pages/stats.tsx

$xsed 's#Tokens per Model#各模型Token用量#g' ${baseDir}/../gui/src/pages/stats.tsx
$xsed 's#<Th>Model</Th>#<Th>模型</Th>#g' ${baseDir}/../gui/src/pages/stats.tsx
$xsed 's#<Th>Generated Tokens</Th>#<Th>生成的Token数量</Th>#g' ${baseDir}/../gui/src/pages/stats.tsx
$xsed 's#<Th>Prompt Tokens</Th>#<Th>输入Token数量</Th>#g' ${baseDir}/../gui/src/pages/stats.tsx

## 状态栏
$xsed 's#Continue";#分布式编码助手";#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Use Next Edit over FIM autocomplete#优先使用 NextEdit 而非 FIM 补全#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Use FIM autocomplete over Next Edit#优先使用 FIM 补全而非 NextEdit#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Tab autocomplete is paused#Tab 自动补全已暂停#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Tab autocomplete is enabled#Tab 自动补全已启用#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Next Edit is enabled#NextEdit 已启用#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Enable autocomplete#启用自动补全#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Disable autocomplete#禁用自动补全#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Pause autocomplete#暂停自动补全#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Click to enable tab autocomplete#点击启用Tab自动补全#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Continue (config error)#分布式编码助手 (配置错误)#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Current autocomplete model#当前自动补全模型#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#(Missing API key)#(缺少API密钥)#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts
$xsed 's#Unnamed Model#未命名模型#g' ${baseDir}/vscode/src/autocomplete/statusBar.ts

$xsed 's# Open settings# 打开设置#g' ${baseDir}/vscode/src/commands.ts
$xsed 's# Open chat# 打开对话#g' ${baseDir}/vscode/src/commands.ts
$xsed 's# Open full screen chat# 打开全屏对话#g' ${baseDir}/vscode/src/commands.ts
$xsed 's#"Switch model"#"切换模型"#g' ${baseDir}/vscode/src/commands.ts


### history page
# 搜索历史会话相关汉化
$xsed 's#"Search past sessions"#"搜索历史会话"#g' ${baseDir}/../gui/src/components/History/index.tsx
$xsed 's#No past sessions found. To start a new session, either click the#"未找到历史会话。要开始新会话，请点击"#g' ${baseDir}/../gui/src/components/History/index.tsx
$xsed 's#button or use the keyboard shortcut#"按钮或使用快捷键"#g' ${baseDir}/../gui/src/components/History/index.tsx
$xsed 's#Clear chats#"清空聊天记录"#g' ${baseDir}/../gui/src/components/History/index.tsx
$xsed 's#Chat history is saved to#"聊天记录已保存至"#g' ${baseDir}/../gui/src/components/History/index.tsx
$xsed 's#/.continue#/.cowork#g'  ${baseDir}/../gui/src/components/History/index.tsx
$xsed 's#Clear sessions#清理会话#g'  ${baseDir}/../gui/src/components/History/index.tsx
$xsed 's#Are you sure you want to permanently delete all chat sessions, including the current chat session?#你确定要永久删除所有聊天会话，包括当前这个会话吗？#g'  ${baseDir}/../gui/src/components/History/index.tsx

# 时间分组汉化
$xsed 's#label: "Today"#label: "今日"#g' ${baseDir}/../gui/src/components/History/util.ts
$xsed 's#label: "This Week"#label: "本周"#g' ${baseDir}/../gui/src/components/History/util.ts
$xsed 's#label: "This Month"#label: "本月"#g' ${baseDir}/../gui/src/components/History/util.ts
$xsed 's#label: "Older"#label: "更早"#g' ${baseDir}/../gui/src/components/History/util.ts

# $xsed 's#"title": "Continue Console",#"title": "编码助手控制台",#g' ../extensions/vscode/package.json
# $xsed 's#"Enable Continue#"Enable AiCoder#g' ../extensions/vscode/package.json
# $xsed 's#"Pause Continue#"Pause AiCoder#g' ../extensions/vscode/package.json
# $xsed 's#"name": "Continue#"name": "AiCoder#g' ../extensions/vscode/package.json

# Comment out CliInstallBanner in Chat.tsx
# awk '/<CliInstallBanner/ { print "        {/* <CliInstallBanner"; getline; while ($0 !~ /^[ \t]*\/>$/) { print; getline; } print $0 " */}"; next } { print }' ${baseDir}/../gui/src/pages/gui/Chat.tsx > /tmp/Chat.tsx.tmp && mv /tmp/Chat.tsx.tmp ${baseDir}/../gui/src/pages/gui/Chat.tsx

echo "########## spec code replace ########## "
# $xsed 's#EXTENSION_NAME = "continue"#EXTENSION_NAME = "aicoder"#g' ${baseDir}/../core/control-plane/env.ts
# $xsed 's#"Continue.continue"#"Roweb.aicoder"#g' ${baseDir}/../extensions/vscode/src/util/vscode.ts
$xsed 's#Continue#分布式编码助手#g' ${baseDir}/../*.md

echo "########## spec code batch replace ########## "

find ${baseDir}/../ -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mdx" | grep -v node_modules | grep -v ".bak" | grep -v Start | xargs $xsed 's#https://hub.continue.dev/#https://hub.roweb.cn/#g'
find ${baseDir}/../ -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mdx" | grep -v node_modules | grep -v ".bak" | grep -v Start | xargs $xsed 's#continue.dev/#roweb.cn/#g'
find ${baseDir}/../ -type f -name "*.json" -o -name "*.xml" -o -name "*.ts" | grep -v node_modules | grep -v ".bak" | grep -v Start | grep -v run | xargs $xsed 's#"continue-#"aicoder-#g'
# find ${baseDir}/../ -type f -name "*.json" -o -name "*.xml" -o -name "*.ts" | grep -v node_modules | grep -v ".bak" |  grep -v Start | grep -v run | xargs $xsed 's#"continue\.#"aicoder.#g'
# find ${baseDir}/../ -type f -name "*.md" -o -name "*.json" -o -name "*.mdx" -o -name "*.ts" -o -name "oneper" | grep -v node_modules |grep -v ".bak" |  grep -v Start | grep -v run | xargs $xsed 's#Continue.continue#Roweb.aicoder#g'
# find ${baseDir}/../ -type f -name "*.md" -o -name "*.json" -o -name "*.mdx"  -o -name "*.ts" | grep -v node_modules | grep -v ".bak" | grep -v Start | grep -v run | xargs $xsed 's#"aicoder.continue#"aicoder.aicoder#g'
# find ${baseDir}/../ -type f -name "*.md" -o -name "*.mdx" | grep -v node_modules | grep -v ".bak" | grep -v Start | grep -v run  | xargs $xsed 's#Continue#AICODER#g'
# find ${baseDir}/../ -type f -name "*.md" -o -name "*.json" -o -name "*.mdx" -o -name "*.ts" | grep -v node_modules |grep -v ".bak" |  grep -v Start | grep -v run | xargs $xsed 's#"aicoder.aicoder#"roweb.aicoder#g'

# find ${baseDir}/../extensions -type f -name "*.md" -o -name "*.mdx" | grep -v node_modules | grep -v ".bak" | grep -v Start | grep -v run  | xargs $xsed 's#AICODER.continue#Continue.continue#g'
# find ../web -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" | grep -v node_modules | xargs $xsed "s#logo-monochrome-white.svg#logo-monochrome-white-llmapp.svg#g"
# find ../web -type f -name "*.ts" -o -name "*.tsx" | xargs grep -E "[ '>\"]Dify[ '<\"\$\`]" | grep -vE "default as Dify |Dify.json|embedded-chatbot/index.tsx"
# find ../web -type f -name "*.ts" -o -name "*.tsx" | xargs grep -E "[ '>\"]Dify[ '<\"\$\`]" | grep -vE "default as Dify |Dify.json|embedded-chatbot/index.tsx" | awk -F ':' '{print $1}' | xargs -I@ sh -c "sed -i.bak 's#Dify#LLMAI#g' '@'"
# find ../web -type f -name "*.ts" -o -name "*.tsx" | xargs grep -E "https://github.com/langgenius/dify" | grep -vE " default as Dify |Dify.json|embedded-chatbot/index.tsx" | awk -F ':' '{print $1}' | xargs -I@ sh -c "sed -i.bak 's#https://github.com/langgenius/dify#https://github.com/blockmap/llmai#g' '@'"

# custom api:
# $xsed "s#Dify OpenAPI#BlockAI OpenAPI#g" ../api/controllers/service_api/index.py

echo "########## custom gui translation ########## "

# 翻译 InputScreen.tsx 文件
$xsed 's/Generate Rule/生成规则/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/InputScreen.tsx
$xsed 's/This will generate a new rule using the content of your chat history/这将使用您的聊天历史内容生成新规则/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/InputScreen.tsx
$xsed 's/"Describe your rule..."/"描述您的规则..."/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/InputScreen.tsx
$xsed 's/  Cancel/  取消/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/InputScreen.tsx
$xsed 's/  Generate/  生成/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/InputScreen.tsx
$xsed 's/Or, write a rule from scratch/或者，从头编写规则/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/InputScreen.tsx

# 翻译 ruleTemplates.ts 文件
$xsed 's/"Always Applied"/"始终应用"/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/ruleTemplates.ts
$xsed 's/"Create an always applied rule where for all files..."/"创建一个始终应用的规则，适用于所有文件..."/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/ruleTemplates.ts
$xsed 's/"Auto attached"/"自动附加"/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/ruleTemplates.ts
$xsed 's/"Create an auto-attached rule where for all {FILE_EXTENSIONS} files..."/"创建一个自动附加的规则，适用于所有 {FILE_EXTENSIONS} 文件..."/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/ruleTemplates.ts
$xsed 's/"Agent Requested"/"代理请求"/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/ruleTemplates.ts
$xsed 's/"Create an agent requested rule where..."/"创建一个代理请求的规则，其中..."/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/ruleTemplates.ts

# 翻译 AddModelForm.tsx 文件
$xsed 's#Add Chat model#添加聊天模型#g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's#Provider</label>#提供商</label>#g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/"Search providers..."/"搜索提供商..."/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/Don'\''t see your provider?/没找到您的提供商？/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/Click here/点击此处/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/to view the full list/查看完整列表/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/Install provider/安装提供商/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's#Model</label>#模型</label>#g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/Use entered API key to fetch available models/使用输入的API密钥获取可用模型/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/Additional models/其他模型/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/Codestral API key/Codestral API密钥/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/Note that codestral requires a different API key from other Mistral models/请注意，codestral需要与其他Mistral模型不同的API密钥/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/Enter your /输入您的/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/  API key/  API密钥/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/API key usually starts with sk-/API密钥通常以sk-开头/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/to create a /创建/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/Connect/连接/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/This will update your/这将更新您的/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/config file/配置文件/g' ${baseDir}/../gui/src/forms/AddModelForm.tsx
$xsed 's/"Manual"/"手动"/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/ruleTemplates.ts
$xsed 's/"Create a manually requested rule where..."/"创建一个手动请求的规则，其中..."/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/ruleTemplates.ts

# 翻译 ResponseActions.tsx 文件
$xsed 's/"Summarize conversation to reduce context length"/"总结对话以减少上下文长度"/g' ${baseDir}/../gui/src/components/StepContainer/ResponseActions.tsx
$xsed 's/"Compact conversation"/"压缩对话"/g' ${baseDir}/../gui/src/components/StepContainer/ResponseActions.tsx
$xsed 's/  Compact conversation/  压缩对话/g' ${baseDir}/../gui/src/components/StepContainer/ResponseActions.tsx
$xsed 's/"Generate rule"/"生成规则"/g' ${baseDir}/../gui/src/components/StepContainer/ResponseActions.tsx
$xsed 's/"Continue generation"/"继续生成"/g' ${baseDir}/../gui/src/components/StepContainer/ResponseActions.tsx
$xsed 's/"Delete"/"删除"/g' ${baseDir}/../gui/src/components/StepContainer/ResponseActions.tsx

# 翻译 StepContainer.tsx 文件
$xsed 's/"Continue your response exactly where you left off:"/"继续生成您的回复，从您停止的地方继续："/g' ${baseDir}/../gui/src/components/StepContainer/StepContainer.tsx
$xsed 's/Previous Conversation Compacted/之前的对话已压缩/g' ${baseDir}/../gui/src/components/StepContainer/StepContainer.tsx

# 翻译 FeedbackButtons.tsx 文件
$xsed 's/text="Helpful"/text="有帮助"/g' ${baseDir}/../gui/src/components/FeedbackButtons.tsx
$xsed 's/text="Unhelpful"/text="无帮助"/g' ${baseDir}/../gui/src/components/FeedbackButtons.tsx
$xsed 's/"Copy"/"复制"/g' ${baseDir}/../gui/src/components/gui/CopyIconButton.tsx
$xsed 's/"Copied"/"已复制"/g' ${baseDir}/../gui/src/components/gui/CopyIconButton.tsx

# 翻译 IndexingProgressTitleText.tsx 文件
$xsed 's/"Indexing complete"/"索引完成"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressTitleText.tsx
$xsed 's/"Initializing"/"初始化中"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressTitleText.tsx
$xsed 's/"Indexing other workspace"/"正在索引其他工作区"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressTitleText.tsx
$xsed 's/"Indexing in-progress"/"索引进行中"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressTitleText.tsx
$xsed 's/"Indexing paused"/"索引已暂停"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressTitleText.tsx
$xsed 's/"Indexing failed"/"索引失败"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressTitleText.tsx
$xsed 's/"Indexing disabled"/"索引已禁用"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressTitleText.tsx
$xsed 's/"Indexing cancelled"/"索引已取消"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressTitleText.tsx

$xsed 's/Review and edit your generated rule below/查看并编辑生成的规则/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/Enter rule name.../输入规则名称.../g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/Description of the task this rule is helpful for.../此规则的任务描述.../g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/Your rule content.../您的规则内容.../g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/Your rule/您的规则/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/Rule Name/规则名称/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/Rule Type/规则类型/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/File pattern matches/文件模式匹配/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/Rule Content/规则内容/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/  Back/  返回/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/  Continue/  继续/g' ${baseDir}/../gui/src/components/GenerateRuleDialog/GenerationScreen.tsx
$xsed 's/Always included in model context/始终包含在模型上下文中的/g' ${baseDir}/../packages/config-yaml/src/markdown/getRuleType.ts
$xsed 's/Included when files matching a glob pattern are referenced/当文件匹配 glob 模式时包含/g' ${baseDir}/../packages/config-yaml/src/markdown/getRuleType.ts
$xsed 's/Available to AI, which decides whether to include it. Must provide a description/仅当 AI 决定是否包含时提供描述/g' ${baseDir}/../packages/config-yaml/src/markdown/getRuleType.ts
$xsed 's/Only included when explicitly mentioned using @ruleName/仅当明确提及时包含/g' ${baseDir}/../packages/config-yaml/src/markdown/getRuleType.ts
$xsed 's/Add global rule/添加全局规则/g' ${baseDir}/../gui/src/components/dialogs/AddRuleDialog.tsx
$xsed 's/Add workspace rule/添加工作区规则/g' ${baseDir}/../gui/src/components/dialogs/AddRuleDialog.tsx
$xsed 's#Choose a name for the new rule file.#为新规则文件选择一个名称#g' ${baseDir}/../gui/src/components/dialogs/AddRuleDialog.tsx
$xsed 's#<span>Rule name</span>#<span>规则名称</span>#g' ${baseDir}/../gui/src/components/dialogs/AddRuleDialog.tsx
$xsed 's#.continue/rules#.cowork/rules#g' ${baseDir}/../core/promptFiles/index.ts
$xsed 's#.continue/prompts#.cowork/prompts#g' ${baseDir}/../core/promptFiles/index.ts
$xsed 's#/.continue#/.cowork#g' ${baseDir}/../core/config/loadLocalAssistants.ts
# $xsed 's#/.continue#/.cowork#g' ${baseDir}/../core/config/loadLocalAssistants.ts
$xsed 's#/.continue#/.cowork#g' ${baseDir}/../core/config/createNewAssistantFile.ts

# 翻译 ToolPolicyItem.tsx 文件
$xsed 's/Duplicate tool name/重复的工具名称/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/detected. Permissions will conflict and usage may be unpredictable/检测到。权限将冲突，使用可能不可预测/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/"Excluded"/"排除"/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/"Automatic"/"自动"/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/"Ask First"/"先询问"/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/>Excluded</>排除</g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/  Automatic/  自动/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/  Ask First/  先询问/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/"Ask First"/"先询问"/g' ${baseDir}/../extensions/vscode/e2e/actions/GUI.actions.ts
$xsed 's/"Automatic"/"自动"/g' ${baseDir}/../extensions/vscode/e2e/actions/GUI.actions.ts
$xsed 's/"Excluded"/"排除"/g' ${baseDir}/../extensions/vscode/e2e/actions/GUI.actions.ts
$xsed 's/ for /了/g' ${baseDir}/../gui/src/components/mainInput/belowMainInput/ThinkingBlockPeek.tsx
$xsed 's/"Thought"/"思考"/g' ${baseDir}/../gui/src/components/mainInput/belowMainInput/ThinkingBlockPeek.tsx
$xsed 's/"Redacted Thinking" : "Thinking"/"脱敏推理过程" : "思考中"/g' ${baseDir}/../gui/src/components/mainInput/belowMainInput/ThinkingBlockPeek.tsx
$xsed 's/"Generating"/"生成中"/g' ${baseDir}/../gui/src/pages/gui/ToolCallDiv/utils.tsx
$xsed 's/"Generating"/"生成中"/g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/GeneratingIndicator.tsx
$xsed 's/"Trim chat to this message"/"截断聊天记录到此消息"/g' ${baseDir}/../gui/src/pages/gui/ToolCallDiv/ToolTruncateHistoryIcon.tsx
$xsed 's/⌫ Cancel/⌫ 取消/g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/IsApplyingToolbar.tsx
$xsed 's#<span>Accept</span>#<span>接受</span>#g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/PendingToolCallToolbar.tsx
$xsed 's#<span>Reject</span>#<span>拒绝</span>#g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/PendingToolCallToolbar.tsx
$xsed 's#displayText = "Stop"#displayText = "停止"#g' ${baseDir}/../gui/src/components/mainInput/Lump/LumpToolbar/StreamingToolbar.tsx

$xsed 's/Tool disabled in chat mode/工具在聊天模式下禁用/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/Group is turned off/组已关闭/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/Tool disabled in plan mode/工具在规划模式下禁用/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/Description:/描述：/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/Arguments:/参数：/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's/No description/无描述/g' ${baseDir}/../gui/src/pages/config/components/ToolPolicyItem.tsx
$xsed 's#  Create#  创建#g' ${baseDir}/../gui/src/components/dialogs/AddRuleDialog.tsx
$xsed 's#  Cancel#  取消#g' ${baseDir}/../gui/src/components/dialogs/AddRuleDialog.tsx



# 翻译 IndexingProgressSubtext.tsx 文件
$xsed 's/"Click to re-index"/"点击重新索引"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressSubtext.tsx
$xsed 's/"Click to pause"/"点击暂停"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressSubtext.tsx
$xsed 's/"Click to resume"/"点击恢复"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressSubtext.tsx
$xsed 's/"Click to retry"/"点击重试"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressSubtext.tsx
$xsed 's/"Click to open configuration"/"点击打开配置"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressSubtext.tsx
$xsed 's/"Click to restart"/"点击重启"/g' ${baseDir}/../gui/src/pages/config/features/indexing/IndexingProgressSubtext.tsx

# 翻译 ToolCallStatusMessage.tsx 文件
$xsed 's/"Agent tool use"/"代理工具使用"/g' ${baseDir}/../gui/src/pages/gui/ToolCallDiv/ToolCallStatusMessage.tsx
$xsed 's/`use the \${defaultToolDescription}`/`使用 \${defaultToolDescription}`/g' ${baseDir}/../gui/src/pages/gui/ToolCallDiv/ToolCallStatusMessage.tsx
$xsed 's/`used the \${defaultToolDescription}`/`已使用 \${defaultToolDescription}`/g' ${baseDir}/../gui/src/pages/gui/ToolCallDiv/ToolCallStatusMessage.tsx
$xsed 's/`calling the \${defaultToolDescription}`/`正在调用 \${defaultToolDescription}`/g' ${baseDir}/../gui/src/pages/gui/ToolCallDiv/ToolCallStatusMessage.tsx
$xsed 's/`Continue \${intro} \${message}`/`继续 \${intro} \${message}`/g' ${baseDir}/../gui/src/pages/gui/ToolCallDiv/ToolCallStatusMessage.tsx

# 翻译 InsertButton.tsx 文件
$xsed 's/content="Insert Code"/content="插入代码"/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/InsertButton.tsx

# 翻译 CopyButton.tsx 文件
$xsed 's/content="Copy Code"/content="复制代码"/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/CopyButton.tsx

# 翻译 ApplyActions.tsx 文件
$xsed 's/Applying/应用中/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/ApplyActions.tsx
$xsed 's/"1 diff"/"1 个差异"/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/ApplyActions.tsx
$xsed 's/\`diffs\`/个差异/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/ApplyActions.tsx
$xsed 's/Reject all/拒绝全部/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/ApplyActions.tsx
$xsed 's/Accept all/接受全部/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/ApplyActions.tsx
$xsed 's/content="Apply Code"/content="应用代码"/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/ApplyActions.tsx
$xsed 's/>Apply</>应用</g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/ApplyActions.tsx

# 翻译 CreateFileButton.tsx 文件
$xsed 's/content="Create File with Code"/content="使用代码创建文件"/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/CreateFileButton.tsx
$xsed 's/Create file/创建文件/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/CreateFileButton.tsx

# 翻译 RunInTerminalButton.tsx 文件
$xsed 's/>Run</>运行</g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/RunInTerminalButton.tsx

# 翻译 CollapsibleContainer.tsx 文件
$xsed 's/Expand to show full content/展开显示完整内容/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/CollapsibleContainer.tsx
$xsed 's/Collapse to compact view/收起为紧凑视图/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/CollapsibleContainer.tsx

# 翻译 index.tsx 文件
$xsed 's/Could not resolve filepath to apply changes/无法解析文件路径以应用更改/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/index.tsx
$xsed 's/line pending/行待处理/g' ${baseDir}/../gui/src/components/StyledMarkdownPreview/StepContainerPreToolbar/index.tsx

# 翻译 ConversationSummary.tsx 文件
$xsed 's/Generating conversation summary/正在生成对话摘要/g' ${baseDir}/../gui/src/components/StepContainer/ConversationSummary.tsx
$xsed 's/>Conversation Summary</>对话摘要</g' ${baseDir}/../gui/src/components/StepContainer/ConversationSummary.tsx
$xsed 's/Delete summary/删除摘要/g' ${baseDir}/../gui/src/components/StepContainer/ConversationSummary.tsx

# 翻译 Context Providers 文件
# FolderContextProvider
$xsed 's/displayTitle: "Folder"/displayTitle: "文件夹"/g' ${baseDir}/../core/context/providers/FolderContextProvider.ts
$xsed 's/description: "Type to search"/description: "输入以搜索"/g' ${baseDir}/../core/context/providers/FolderContextProvider.ts

# CodeContextProvider
$xsed 's/displayTitle: "Code"/displayTitle: "代码"/g' ${baseDir}/../core/context/providers/CodeContextProvider.ts
$xsed 's/description: "Type to search"/description: "输入以搜索"/g' ${baseDir}/../core/context/providers/CodeContextProvider.ts

# FileContextProvider
$xsed 's/displayTitle: "Files"/displayTitle: "文件"/g' ${baseDir}/../core/context/providers/FileContextProvider.ts
$xsed 's/description: "Type to search"/description: "输入以搜索"/g' ${baseDir}/../core/context/providers/FileContextProvider.ts

# FileTreeContextProvider
$xsed 's/displayTitle: "File Tree"/displayTitle: "文件树"/g' ${baseDir}/../core/context/providers/FileTreeContextProvider.ts
$xsed 's/description: "Attach a representation of the file tree"/description: "附加文件树的表示"/g' ${baseDir}/../core/context/providers/FileTreeContextProvider.ts
$xsed 's/description: "File Tree"/description: "文件树"/g' ${baseDir}/../core/context/providers/FileTreeContextProvider.ts

# DebugLocalsProvider
$xsed 's/displayTitle: "Debugger"/displayTitle: "调试器"/g' ${baseDir}/../core/context/providers/DebugLocalsProvider.ts
$xsed 's/description: "Local variables"/description: "本地变量"/g' ${baseDir}/../core/context/providers/DebugLocalsProvider.ts
$xsed 's/description: "The value, name and possibly type of the local variables"/description: "本地变量的值、名称和可能的类型"/g' ${baseDir}/../core/context/providers/DebugLocalsProvider.ts

# DiffContextProvider
$xsed 's/displayTitle: "Git Diff"/displayTitle: "Git 差异"/g' ${baseDir}/../core/context/providers/DiffContextProvider.ts
$xsed 's/description: "Reference the current git diff"/description: "引用当前 git 差异"/g' ${baseDir}/../core/context/providers/DiffContextProvider.ts
$xsed 's/description: "The current git diff"/description: "当前 git 差异"/g' ${baseDir}/../core/context/providers/DiffContextProvider.ts
$xsed 's/Add more context providers/添加更多上下文提供程序/g'  ${baseDir}/../gui/src/components/mainInput/TipTapEditor/utils/getSuggestion.ts
# SearchContextProvider
$xsed 's/displayTitle: "Search"/displayTitle: "搜索"/g' ${baseDir}/../core/context/providers/SearchContextProvider.ts
$xsed 's/description: "Use ripgrep to exact search the workspace"/description: "使用 ripgrep 精确搜索工作区"/g' ${baseDir}/../core/context/providers/SearchContextProvider.ts
$xsed 's/description: "Search results"/description: "搜索结果"/g' ${baseDir}/../core/context/providers/SearchContextProvider.ts

# HttpContextProvider
$xsed 's/description: "Retrieve a context item from a custom server"/description: "从自定义服务器检索上下文项"/g' ${baseDir}/../core/context/providers/HttpContextProvider.ts
$xsed 's/description: item.description ?? "HTTP Context Item"/description: item.description ?? "HTTP 上下文项"/g' ${baseDir}/../core/context/providers/HttpContextProvider.ts

# DatabaseContextProvider
$xsed 's/displayTitle: "Database"/displayTitle: "数据库"/g' ${baseDir}/../core/context/providers/DatabaseContextProvider.ts
$xsed 's/description: "Table schemas"/description: "表结构"/g' ${baseDir}/../core/context/providers/DatabaseContextProvider.ts
$xsed 's/description: "Schema for all tables."/description: "所有表的结构"/g' ${baseDir}/../core/context/providers/DatabaseContextProvider.ts

# CurrentFileContextProvider
$xsed 's/displayTitle: "Current File"/displayTitle: "当前文件"/g' ${baseDir}/../core/context/providers/CurrentFileContextProvider.ts
$xsed 's/description: "Reference the currently open file"/description: "引用当前打开的文件"/g' ${baseDir}/../core/context/providers/CurrentFileContextProvider.ts

# RulesContextProvider
$xsed 's/displayTitle: "Rules"/displayTitle: "规则"/g' ${baseDir}/../core/context/providers/RulesContextProvider.ts
$xsed 's/description: "Mention rules files"/description: "提及规则文件"/g' ${baseDir}/../core/context/providers/RulesContextProvider.ts

# WebContextProvider
$xsed 's/displayTitle: "Web"/displayTitle: "网络"/g' ${baseDir}/../core/context/providers/WebContextProvider.ts
$xsed 's/description: "Search the web"/description: "搜索网络"/g' ${baseDir}/../core/context/providers/WebContextProvider.ts

# ClipboardContextProvider
$xsed 's/displayTitle: "Clipboard"/displayTitle: "剪贴板"/g' ${baseDir}/../core/context/providers/ClipboardContextProvider.ts
$xsed 's/description: "Recent copies"/description: "最近的复制"/g' ${baseDir}/../core/context/providers/ClipboardContextProvider.ts

# CodebaseContextProvider
$xsed 's/displayTitle: "Codebase"/displayTitle: "代码库"/g' ${baseDir}/../core/context/providers/CodebaseContextProvider.ts
$xsed 's/description: "Automatically find relevant files"/description: "自动查找相关文件"/g' ${baseDir}/../core/context/providers/CodebaseContextProvider.ts

# RepoMapContextProvider
$xsed 's/displayTitle: "Repository Map"/displayTitle: "代码库地图"/g' ${baseDir}/../core/context/providers/RepoMapContextProvider.ts
$xsed 's/description: "Search the entire codebase"/description: "搜索整个代码库"/g' ${baseDir}/../core/context/providers/RepoMapContextProvider.ts
$xsed 's/description: "Select a folder"/description: "选择一个文件夹"/g' ${baseDir}/../core/context/providers/RepoMapContextProvider.ts
$xsed 's/description: "Overview of the repository structure"/description: "仓库结构概览"/g' ${baseDir}/../core/context/providers/RepoMapContextProvider.ts

# PostgresContextProvider
$xsed 's/description: "Retrieve PostgreSQL table schema and sample rows"/description: "检索 PostgreSQL 表结构和示例行"/g' ${baseDir}/../core/context/providers/PostgresContextProvider.ts
$xsed 's/description: `Schema and sample rows for table ${tableName}`/description: `表 ${tableName} 的结构和示例行`/g' ${baseDir}/../core/context/providers/PostgresContextProvider.ts
$xsed 's/description: `Schema from ${tableName} and ${this.options.sampleRows} sample rows.`/description: `表 ${tableName} 的结构及 ${this.options.sampleRows} 行示例`/g' ${baseDir}/../core/context/providers/PostgresContextProvider.ts
$xsed 's/description: `Schema from all tables and ${this.options.sampleRows} sample rows each.`/description: `所有表的结构，每个表 ${this.options.sampleRows} 行示例`/g' ${baseDir}/../core/context/providers/PostgresContextProvider.ts

# MCPContextProvider
$xsed 's/description: "MCP Resources"/description: "MCP 资源"/g' ${baseDir}/../core/context/providers/MCPContextProvider.ts

# OSContextProvider
$xsed 's/displayTitle: "Operating System"/displayTitle: "操作系统"/g' ${baseDir}/../core/context/providers/OSContextProvider.ts
$xsed 's/description: "Operating system and CPU Information."/description: "操作系统和 CPU 信息"/g' ${baseDir}/../core/context/providers/OSContextProvider.ts
$xsed 's/description: "Your operating system and CPU"/description: "您的操作系统和 CPU"/g' ${baseDir}/../core/context/providers/OSContextProvider.ts

# GoogleContextProvider
$xsed 's/displayTitle: "Google"/displayTitle: "谷歌"/g' ${baseDir}/../core/context/providers/GoogleContextProvider.ts
$xsed 's/description: "Attach the results of a Google search"/description: "附加 Google 搜索结果"/g' ${baseDir}/../core/context/providers/GoogleContextProvider.ts
$xsed 's/description: "Google Search"/description: "Google 搜索"/g' ${baseDir}/../core/context/providers/GoogleContextProvider.ts

# GitLabMergeRequestContextProvider
$xsed 's/displayTitle: "GitLab Merge Request"/displayTitle: "GitLab 合并请求"/g' ${baseDir}/../core/context/providers/GitLabMergeRequestContextProvider.ts
$xsed 's/description: "Reference comments in a GitLab Merge Request"/description: "引用 GitLab 合并请求中的评论"/g' ${baseDir}/../core/context/providers/GitLabMergeRequestContextProvider.ts
$xsed 's/description: "Comments from the Merge Request for this branch."/description: "来自此分支合并请求的评论"/g' ${baseDir}/../core/context/providers/GitLabMergeRequestContextProvider.ts
$xsed 's/description: "Error getting the Merge Request for this branch."/description: "获取此分支的合并请求时出错"/g' ${baseDir}/../core/context/providers/GitLabMergeRequestContextProvider.ts

# URLContextProvider
$xsed 's/displayTitle: "URL"/displayTitle: "网址"/g' ${baseDir}/../core/context/providers/URLContextProvider.ts
$xsed 's/description: "Reference a webpage at a given URL"/description: "引用给定 URL 的网页"/g' ${baseDir}/../core/context/providers/URLContextProvider.ts

# GreptileContextProvider
$xsed 's/description: "Insert query to Greptile"/description: "插入 Greptile 查询"/g' ${baseDir}/../core/context/providers/GreptileContextProvider.ts

# JiraIssuesContextProvider
$xsed 's/displayTitle: "Jira Issues"/displayTitle: "Jira 问题"/g' ${baseDir}/../core/context/providers/JiraIssuesContextProvider/index.ts
$xsed 's/description: "Reference Jira issues"/description: "引用 Jira 问题"/g' ${baseDir}/../core/context/providers/JiraIssuesContextProvider/index.ts

# ContinueProxyContextProvider
$xsed 's/displayTitle: "Continue Proxy"/displayTitle: "Continue 代理"/g' ${baseDir}/../core/context/providers/ContinueProxyContextProvider.ts
$xsed 's/description: "Retrieve a context item from a Continue for Teams add-on"/description: "从 Continue for Teams 附加组件检索上下文项"/g' ${baseDir}/../core/context/providers/ContinueProxyContextProvider.ts

# OpenFilesContextProvider
$xsed 's/displayTitle: "Open Files"/displayTitle: "打开的文件"/g' ${baseDir}/../core/context/providers/OpenFilesContextProvider.ts
$xsed 's/description: "Reference the current open files"/description: "引用当前打开的文件"/g' ${baseDir}/../core/context/providers/OpenFilesContextProvider.ts

# GitHubIssuesContextProvider
$xsed 's/displayTitle: "GitHub Issues"/displayTitle: "GitHub 问题"/g' ${baseDir}/../core/context/providers/GitHubIssuesContextProvider.ts
$xsed 's/description: "Reference GitHub issues"/description: "引用 GitHub 问题"/g' ${baseDir}/../core/context/providers/GitHubIssuesContextProvider.ts

# GitCommitContextProvider
$xsed 's/displayTitle: "Commits"/displayTitle: "提交"/g' ${baseDir}/../core/context/providers/GitCommitContextProvider.ts
$xsed 's/description: "Type to search"/description: "输入以搜索"/g' ${baseDir}/../core/context/providers/GitCommitContextProvider.ts
$xsed 's/description: "recent commits"/description: "最近的提交"/g' ${baseDir}/../core/context/providers/GitCommitContextProvider.ts

# ProblemsContextProvider
$xsed 's/displayTitle: "Problems"/displayTitle: "问题"/g' ${baseDir}/../core/context/providers/ProblemsContextProvider.ts
$xsed 's/description: "Reference problems in the current file"/description: "引用当前文件中的问题"/g' ${baseDir}/../core/context/providers/ProblemsContextProvider.ts
$xsed 's/description: "Problems in current file"/description: "当前文件中的问题"/g' ${baseDir}/../core/context/providers/ProblemsContextProvider.ts

# TerminalContextProvider
$xsed 's/displayTitle: "Terminal"/displayTitle: "终端"/g' ${baseDir}/../core/context/providers/TerminalContextProvider.ts
$xsed 's/description: "Reference the last terminal command"/description: "引用上一个终端命令"/g' ${baseDir}/../core/context/providers/TerminalContextProvider.ts
$xsed 's/description: "The contents of the terminal"/description: "终端内容"/g' ${baseDir}/../core/context/providers/TerminalContextProvider.ts

# DiscordContextProvider
$xsed 's/description: "Select a channel"/description: "选择频道"/g' ${baseDir}/../core/context/providers/DiscordContextProvider.ts
$xsed 's/description: "Latest messages from the channel"/description: "频道最新消息"/g' ${baseDir}/../core/context/providers/DiscordContextProvider.ts

# DocsContextProvider
$xsed 's/displayTitle: "Docs"/displayTitle: "文档"/g' ${baseDir}/../core/context/providers/DocsContextProvider.ts
$xsed 's/description: "Type to search docs"/description: "输入以搜索文档"/g' ${baseDir}/../core/context/providers/DocsContextProvider.ts

# utils.ts
$xsed 's/description: "Instructions"/description: "说明"/g' ${baseDir}/../core/context/providers/utils.ts

execEndTime=`date +%Y%m%d-%H:%M:%S`

echo "${execEndTime} custom replace finished ########## "

exit 0