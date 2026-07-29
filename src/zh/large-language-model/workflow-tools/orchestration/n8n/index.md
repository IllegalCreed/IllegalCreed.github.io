---
layout: doc
---

# n8n

n8n 是开源的**工作流自动化平台**（fair-code，Sustainable Use License），由 n8n GmbH 维护，用「可视化节点 + 触发器 + 连接」把 SaaS、数据库、消息系统、AI 模型按业务流程串成自动化工作流。它把核心抽象定在**节点 / 连接 / 触发器 / 执行**：每张工作流由若干**节点**（Node）组成——Trigger 节点负责触发（Webhook / Schedule / Chat / Manual / Polling），Regular 节点负责动作（HTTP、数据库、文件、邮件、IM、AI 等），节点之间用**连接**（Connection）传递项目（Item，包含 json/binary），按数据分流（Main / AI 子节点接口）实现扇出、循环、错误分支。2024 年起官方持续补强 **AI 能力**：基于 LangChain.js 的 **Advanced AI** 节点族（**AI Agent** root 节点 + Chat Model / Memory / Tools / Vector Store 子节点）、**Basic LLM Chain** root 节点、**Chat Trigger**、**MCP Client / Trigger**、**Guardrails**、**AI Transform**、**Evaluation 节点 + Evaluation Trigger**、**AI Workflow Builder / AI Assistant**（自然语言生成工作流），70+ AI 节点覆盖 OpenAI / Anthropic / Google Gemini / Mistral / Alibaba Qwen / MiniMax 等主流模型供应商，并支持 Pinecone / Supabase / Qdrant / Milvus / pgvector / In-Memory 等向量库构建 RAG 管道。部署上 n8n 提供 **Cloud**（托管、自动升级、低运维）与 **Self-hosted**（Docker / npm / Docker Compose、社区在推 Docker 优先，npm-native 可能 sunset）双轨；自托管可对接内置 SQLite（默认）/ PostgreSQL / MySQL / MariaDB / MS SQL 作为后端元数据库。当前处于 **AI 能力爆发期**（2024-2026），AI Agent 节点 + LangChain 工具 + RAG + Memory 已成主线。

## 评价

**优点**

- **可视化 + 代码节点并存**：拖拽编排 1000+ 内置集成节点，又有 **Code 节点**（JS / Python）与 **HTTP Request** 节点兜底任意「未内置」的能力，从无代码到低代码平滑过渡
- **AI 能力成体系**：70+ LangChain.js AI 节点——AI Agent（Tools / Conversational / ReAct 等多类型）+ Chat Model + Memory + Tools + Vector Store + RAG 五步（Load→Split→Embed→Store→Retrieve），不必重新学 LangChain 也能搭 Agent
- **工具调用闭环**：内置 Wikipedia / SerpAPI / Calculator / HTTP Request Tool / Custom Code Tool / **Call n8n Workflow Tool**（把任意工作流当 Agent 工具暴露）；`$fromAI()` 让运行时根据用户输入动态填参数
- **部署灵活**：Cloud 开箱即用，Self-hosted 用 Docker / Docker Compose / npm / Kubernetes 自由控制版本、环境变量、安全与扩缩容；AI Starter Kit 一键起向量库 + AI 工作流环境
- **可观测 + 工程化**：执行历史、Manual / Chat Trigger 调试、**Evaluation 节点 + Trigger** 跑测试集评估 AI 工作流质量、Guardrails 节点防 prompt 注入与不可控输出
- **MCP 集成**：MCP Client / Trigger 把外部 Model Context Protocol 工具 / 资源接入工作流，跟上 2024-2025 MCP 生态浪潮

**缺点**

- **Chain 不支持 Memory 与 Tools**：Basic LLM Chain 是预定义序列链，每次独立，需要对话 / 工具能力必须切到 AI Agent，是架构性限制而非配置问题
- **Embeddings 仅支持文本**：n8n 向量化只覆盖文本，不支持图像 / 音频 embedding，多模态 RAG 需要外接
- **AI Agent 节点性能与成本**：Agent 内部循环执行（输入→选工具→执行→评估→回复）比 Chain 慢且更贵，把它当单轮 Chain 用是常见反模式
- **Cloud 深度定制受限**：Cloud 只暴露有限环境变量与功能，数据库结构、自定义安全、特殊 scaling 必须走 Self-hosted
- **fair-code 许可边界**：Sustainable Use License 自由内部使用，但**与 n8n 竞争的商业产品 / 托管服务有限制**，商用前必须看 LICENSE
- **npm 长期支撑不确定**：官方社区在推 Docker 优先、讨论 sunset npm-native，npm 还要求手动管依赖、易漂移，生产请用 Docker + 独立 Postgres
- **AI 输出随机性**：不跑 Evaluation 凭肉眼调 prompt 容易回归，需要补 Evaluation 节点 + metrics 流程

## 文档地址

- [n8n 官方文档总入口](https://docs.n8n.io/)
- [Integrate AI（构建 AI 工作流枢纽页）](https://docs.n8n.io/build/integrate-ai)
- [Understand AI Components（AI 组件概念详解）](https://docs.n8n.io/build/integrate-ai/understand-ai-components/)
- [Try Ai-Powered Workflow Templates](https://n8n.io/workflows/?q=ai)
- [Self-hosting 部署指南](https://docs.n8n.io/hosting)
- [n8n Cloud 官方主页](https://n8n.io/cloud/)

## GitHub地址

[n8n-io/n8n](https://github.com/n8n-io/n8n) · [Releases](https://github.com/n8n-io/n8n/releases)

## 幻灯片地址

<a href="/SlideStack/n8n-slide/" target="_blank">n8n</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">n8n 测试题</a>
