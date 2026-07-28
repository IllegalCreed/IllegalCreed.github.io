---
layout: doc
---

# 代码生成（Copilot-like）

AI 代码生成工具通过大语言模型在编辑器、终端与 PR 流程中辅助编写、补全、重构代码，代表是 **GitHub Copilot**、**Continue** 与 **Tabby**。三种核心交互模式：**补全（Completion）**——边打字边以灰色「幽灵文本（ghost text）」预测下一段代码，GitHub Copilot 在 VS Code 中用 Tab 接受、并扩展出 NES（Next Edit Suggestions）跨位置预测下一处编辑；**Chat（聊天）**——在侧边栏 / 内联聊天用自然语言问答、解释代码、生成片段，可挂 @workspace 等上下文；**Agent（智能体）**——自主规划并跨多文件改动、运行命令、迭代修复，如 GitHub Copilot 的 coding agent（把 Issue 指派给 Copilot 即自动开分支、改码、开 PR）。三者在私有化与商业模式上各有取舍：**GitHub Copilot**（copilot.github.com）是闭源 SaaS，订阅制（Free / Pro $10 / Pro+ $39 / Max $100 / Business $19 / Enterprise $39 每人每月），模型可选 GPT、Claude、Gemini 等，支持 Copilot CLI（`gh copilot suggest|explain`）、扩展与 coding agent；**Continue**（continue.dev）是开源 AI 编程助手，用单一 `config.yaml` 自定义模型来源（OpenAI / Anthropic / Ollama 本地等），适合想自由选模型、自托管或不绑定厂商的团队；**Tabby**（tabbyml.com）是自托管开源方案（Apache 2.0），用 `tabby.yml` 配置、Docker / Helm 部署，支持 StarCoder、Qwen2.5-Coder 等开源模型，跑在消费级 GPU 上，代码不出内网——金融 / 医疗等强合规场景的 Copilot 替代。

> 注意：**Sourcegraph Cody 已于 2025-07-23 sunset（Free/Pro 新注册于 2025-06-25 关闭），被 Amp 取代，本叶不含 Cody**。

## 评价

**优点**

- **显著提速样板代码**：补全模式对 getter/setter、SQL、JSON 处理、测试骨架等重复代码可秒级生成，开发者专注逻辑而非语法
- **三模式覆盖不同粒度**：补全（打字时）+ Chat（问答时）+ Agent（多文件任务时），从「补一个函数」到「改一个模块」都有对应工具
- **Chat 降低上手门槛**：自然语言问「这段在做什么 / 帮我加错误处理」即可，新人读陌生代码库不再卡壳
- **Continue/Tabby 解锁私有化与选型自由**：Continue 让你用任意模型（含本地 Ollama），Tabby 完全自托管，规避代码出域与厂商锁定
- **Agent 自动化重复流程**：Copilot coding agent 把「指派 Issue → 自动开 PR」链路打通，适合 bug 修复、依赖升级等任务化场景
- **IDE 与生态集成深**：Copilot 覆盖 VS Code / JetBrains / Vim/Neovim，CLI 与 GitHub 网页、PR 评审打通

**缺点**

- **幻觉与错误代码**：模型会编造不存在的 API / 库签名，不读文档直接用易踩坑，必须人工复核与测试
- **代码出域与合规风险**：Copilot 把代码片段发到云端推理，金融 / 医疗 / 涉密项目需 Continue/Tabby 自托管才能合规
- **订阅成本随人头累加**：Business $19 / Enterprise $39 每人每月，百人团队年费不低；Tabby 自托管则转嫁到 GPU 硬件与运维成本
- **补全打断心流**：频繁幽灵文本可能干扰思考，需手动调接受阈值或关闭，长上下文补全有时反而拖慢
- **Agent 失控与不可预测**：coding agent 自主改多文件可能引入隐蔽回归，需强约束（沙箱、测试门禁、人工评审），不能盲信
- **Tabby 自建质量不及托管**：开源模型（StarCoder/Qwen2.5-Coder）在复杂推理上弱于 GPT/Claude 旗舰，需硬件投入才有可用体验

## 文档地址

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Continue Documentation](https://docs.continue.dev)
- [Tabby Documentation](https://tabbyml.com/docs)

## GitHub 地址

- [github/gh-copilot](https://github.com/github/gh-copilot)（Copilot CLI）
- [continuedev/continue](https://github.com/continuedev/continue)
- [TabbyML/tabby](https://github.com/TabbyML/tabby)

## 幻灯片地址

<a href="/SlideStack/code-generation-slide/" target="_blank">代码生成（Copilot-like）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90%EF%BC%88Copilot-like%EF%BC%89" target="_blank" rel="noopener noreferrer">代码生成（Copilot-like）测试题</a>
