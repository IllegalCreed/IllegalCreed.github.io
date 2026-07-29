---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 n8n 官方文档（docs.n8n.io）+ GitHub Release Notes 编写，对照 2024-2026 AI 能力爆发期版本行为

## 速查

- **本质**：开源工作流自动化平台（fair-code / Sustainable Use License），节点式可视化编排 + 70+ LangChain.js AI 节点
- **核心抽象**：Node / Trigger / Connection / Item（json + binary）/ Execution（manual / production）/ Credential
- **AI Root 节点**：AI Agent（决策型、循环、必接 Chat Model + 可选 Memory/Tools/Vector Store）vs Basic LLM Chain（预定义序列、单次、**不支持 Memory/Tools**）
- **AI 子节点**：Chat Model / Memory / Tools / Vector Store / Document Loaders / Text Splitters / Embeddings
- **Memory 仅 Agent 可用**：Chain 接了不生效
- **Tool Calling 关键**：`$fromAI()` 运行时根据用户输入动态填参数
- **RAG 五步**：Load → Split → Embed（**仅文本**）→ Store → Retrieve
- **Vector Store**：In-Memory / pgvector / Pinecone / Qdrant / Milvus / Supabase / Zep
- **Chat Model 供应商**：OpenAI / Anthropic / Gemini / Mistral / Alibaba Qwen / MiniMax
- **MCP**：MCP Client（运行时调用外部 MCP）+ MCP Trigger（n8n 作为 MCP 服务器）
- **AI 工程化**：Evaluation + Evaluation Trigger（跑测试集）/ Guardrails（治理）/ AI Transform（批量变换）
- **辅助**：AI Workflow Builder / AI Assistant（自然语言生成工作流 / 编码帮助）
- **部署双轨**：Cloud（托管）vs Self-hosted（Docker / npm / Compose / K8s）；**官方推 Docker 优先，npm 可能 sunset**
- **数据库**：默认 SQLite（原型）/ PostgreSQL（**生产推荐**）/ MySQL / MariaDB / MS SQL
- **关键环境变量**：`N8N_ENCRYPTION_KEY`（生产必自定）/ `WEBHOOK_URL` / `N8N_HOST` / `N8N_PORT=5678` / `DB_TYPE` / `DB_POSTGRESDB_*`
- **许可**：fair-code / Sustainable Use License；**与 n8n 竞争的商业产品 / 托管有限制**，商用前看 LICENSE

## 核心抽象

| 抽象 | 含义 |
| --- | --- |
| **Node** | 工作流执行单元；Trigger（触发）+ Regular（动作） |
| **Trigger** | 工作流入口：Manual / Webhook / Schedule / Chat / Polling / MCP / Evaluation |
| **Connection** | 节点间数据流；扇出 / 循环 / 错误分支 |
| **Item** | 节点间传递数据：`json`（结构化）+ `binary`（文件 / 媒体） |
| **Execution** | 一次完整运行；manual（调试）vs production（Trigger 触发） |
| **Credential** | 外部服务认证，AES-256 加密（密钥 = `N8N_ENCRYPTION_KEY`） |

## 节点速查表

### Trigger 节点

| 节点 | 用途 |
| --- | --- |
| **Manual Trigger** | 手动调试 |
| **Webhook** | HTTP 请求触发 |
| **Schedule Trigger** | Cron / 间隔 |
| **Chat Trigger** | 面向 AI 的对话入口 |
| **Polling Trigger** | 周期查询外部系统 |
| **MCP Trigger** | 接收 MCP 请求 |
| **Evaluation Trigger** | 触发 AI 测试评估 |

### Regular 节点（动作）

| 类别 | 代表节点 |
| --- | --- |
| **HTTP** | HTTP Request（万能兜底） |
| **数据库** | Postgres / MySQL / MongoDB / Redis / Snowflake / MS SQL |
| **SaaS** | Slack / Gmail / Notion / Airtable / GitHub / Google Sheets 等 1000+ |
| **数据变换** | Set / Code（JS+Python）/ Filter / Item Lists / Merge / Split In Batches |
| **文件** | Read/Write Files / Convert to File / Extract from File |
| **流程控制** | IF / Switch / Loop / Sub-workflow Execution / Error Trigger |

### AI 节点族

| 类别 | 节点 | 角色 |
| --- | --- | --- |
| **Root** | AI Agent | 决策型，必接 Chat Model |
| **Root** | Basic LLM Chain | 预定义序列，**不支持 Memory/Tools** |
| **Sub-node** | Chat Model | OpenAI / Anthropic / Gemini / Mistral / Qwen / MiniMax |
| **Sub-node** | Memory | Window Buffer / Postgres / Redis / Zep / Motorhead / Xata / Manager |
| **Sub-node** | Tools | Wikipedia / SerpAPI / Calculator / HTTP Request / Custom Code / Call n8n Workflow |
| **Sub-node** | Vector Store | In-Memory / pgvector / Pinecone / Qdrant / Milvus / Supabase |
| **Sub-node** | Document Loaders | PDF / Web / Text / Notion |
| **Sub-node** | Text Splitters | Token / Character / Recursive / Markdown |
| **Sub-node** | Embeddings | 仅支持文本 |
| **集成** | MCP Client | 调用外部 MCP 服务器 |
| **治理** | Guardrails | 输入 / 输出校验，防 prompt 注入 |
| **工程化** | AI Transform | 用 LLM 做批量数据变换 |
| **工程化** | Evaluation | 跑测试集评估 AI 工作流 |
| **辅助** | AI Workflow Builder / AI Assistant | 自然语言生成工作流 / 编码帮助 |

## AI Agent vs Basic LLM Chain

| 维度 | AI Agent | Basic LLM Chain |
| --- | --- | --- |
| 执行模型 | 决策型、循环 | 预定义序列、单次 |
| 必接 | Chat Model | Chat Model |
| 可选 | Memory / Tools / Vector Store | — |
| Memory 支持 | ✓ | ✗ |
| Tools 支持 | ✓ | ✗ |
| 成本 | 慢、贵 | 快、省 |
| 场景 | 多轮对话 / 多工具 / 动态决策 | 提示词 → 响应固定流程 |

## Memory 类型

| 类型 | 持久化 | 适用 |
| --- | --- | --- |
| **Window Buffer** | 会话级滚动窗口 | 开发 / 原型 |
| **Postgres Chat Memory** | 跨会话 | 生产 |
| **Redis Chat Memory** | 跨会话 | 高吞吐 |
| **Zep** | 跨会话 + 长期 | 用户画像 |
| **Motorhead (Metal)** | 跨会话 | Metal 用户 |
| **Xata** | 跨会话 + 向量化 | Xata 用户 |
| **Chat Memory Manager** | — | 检查 / 裁剪 / 注入伪用户消息 |

## Tools 一览

| Tool | 用途 |
| --- | --- |
| **Wikipedia** | 查维基百科 |
| **SerpAPI** | 搜索引擎结果 |
| **Calculator** | 数学计算 |
| **HTTP Request Tool** | 调任意 API / 抓网页 |
| **Custom Code Tool** | JS / Python 自定义代码 |
| **Call n8n Workflow Tool** | **把任意 n8n 工作流当工具暴露**（最大复用） |

> `$fromAI(description, type)` 让 Agent 在运行时根据用户输入动态填参数；静态参数无法处理多变自然语言输入。

## Vector Store 与 RAG

### 五步管道

```text
[Document Loaders] → [Text Splitters] → [Embeddings] → [Vector Store] → [Retriever]
```

### Vector Store 选型

| 后端 | 适用 |
| --- | --- |
| **In-Memory** | 原型 |
| **Postgres pgvector** | 已用 Postgres，复用 |
| **Pinecone** | 云托管向量库 |
| **Qdrant** | 开源高性能 |
| **Milvus** | 大规模向量 |
| **Supabase** | Supabase pgvector |
| **Zep** | 跨会话记忆 + 向量化 |

### Embeddings 能力边界

- **仅支持文本**：不支持图像 / 音频 embedding
- 多模态 RAG 需要外接（HTTP Request 调外部 embedding 服务，或 Custom Code Tool）

## 关键环境变量

| 变量 | 用途 |
| --- | --- |
| `N8N_ENCRYPTION_KEY` | 凭据 AES-256 加密密钥（**生产必自定**） |
| `N8N_HOST` / `N8N_PORT=5678` / `N8N_PROTOCOL` | 实例地址 |
| `WEBHOOK_URL` | Webhook / OAuth 回调根 URL |
| `N8N_USER_FOLDER` | 用户数据目录 |
| `DB_TYPE` / `DB_POSTGRESDB_*` | 切到 PostgreSQL（生产推荐） |
| `EXECUTIONS_DATA_PRUNE` / `EXECUTIONS_DATA_MAX_AGE` | 清理历史执行 |
| `N8N_METRICS` | Prometheus 指标暴露 |
| `N8N_LOG_LEVEL` / `N8N_LOG_OUTPUT` | 日志级别 / 输出 |
| `GENAI_TIME_TO_RUN_ENABLED` | AI 工作流相关实验性开关 |

## 后端元数据库

| 数据库 | 适用 |
| --- | --- |
| **SQLite**（默认） | 原型 / 单实例开发 |
| **PostgreSQL** | **生产推荐**，多 worker、并发安全 |
| **MySQL / MariaDB** | 已有 MySQL 栈 |
| **MS SQL** | 微软生态 |

## 部署模式

| 模式 | 命令 | 适用 |
| --- | --- | --- |
| **Docker 轻量** | `docker run -p 5678:5678 docker.n8n.io/n8nio/n8n` | 原型 |
| **Docker Compose + Postgres** | `docker compose up -d` | **生产推荐** |
| **npm** | `npx n8n` / `npm i -g n8n && n8n start` | 仅原型（社区讨论 sunset） |
| **Kubernetes** | Helm / manifest | 大规模、多副本 |
| **Cloud** | 注册 n8n.io/cloud | 不想运维 |

## 版本里程碑

| 时期 | 关键特性 |
| --- | --- |
| **早期（2019-2022）** | 开源工作流自动化平台，fair-code 许可，1000+ 非 AI 集成 |
| **Advanced AI / LangChain 节点** | AI Agent / Chain / Memory / Tools / Vector Store / Document Loaders 节点族 |
| **ChatHub / Chat Trigger** | 面向 AI 的对话入口体系 |
| **MCP Client / Trigger** | 接入 Model Context Protocol |
| **Evaluation + Evaluation Trigger** | AI 工作流测试体系（why test → run quick evaluations → use metrics） |
| **Guardrails 节点** | 输出治理、防 prompt 注入 |
| **AI Transform 节点** | 用 LLM 做批量数据变换 |
| **AI Workflow Builder / AI Assistant** | 自然语言生成 / 修改工作流 |
| **LangChain Code 节点** | 代码内用 LangChain 短码 |
| **AI Starter Kit** | 一键起含向量库的 AI 工作流环境 |
| **2024-2026 现状** | 70+ AI 节点，覆盖 OpenAI / Anthropic / Gemini / Mistral / Alibaba / MiniMax；推 Docker 优先 |

> 部署趋势：Cloud + Self-hosted 双轨；社区推动 Docker 优先（npm-native 可能 sunset）。

## 反模式速查

- 给 Chain 节点接 Memory / Tools（不生效，需换 Agent）
- 把全部私有数据塞 prompt 上下文（应走 RAG）
- 用 npm 长期支撑生产自托管（请用 Docker + 独立 Postgres）
- 改 prompt 不跑 Evaluation（凭肉眼会掩盖回归）
- 把 Agent 当 Chain 用（单轮无工具，浪费循环成本）
- Tool 不加 Guardrails 直接暴露（SSRF / prompt 注入）
- 在 Cloud 上做深度定制（应切 Self-hosted）
- 对话型 Agent 不接 Memory（生产换 Postgres / Redis / Zep）
- 把 LLM 应用构建器（Dify / Flowise）当自动化引擎用
- License 边界忽视（fair-code 与 n8n 竞争的商业产品 / 托管有限制）
- 把「文档摘要未提及某特性」当「已废弃」

## 官方资源

- 文档总入口：[https://docs.n8n.io/](https://docs.n8n.io/)
- Integrate AI：[https://docs.n8n.io/build/integrate-ai](https://docs.n8n.io/build/integrate-ai)
- Understand AI Components：[https://docs.n8n.io/build/integrate-ai/understand-ai-components/](https://docs.n8n.io/build/integrate-ai/understand-ai-components/)
  - agents-vs-chains：[agents-vs-chains](https://docs.n8n.io/build/integrate-ai/understand-ai-components/agents-vs-chains/)
  - how-memory-works：[how-memory-works](https://docs.n8n.io/build/integrate-ai/understand-ai-components/how-memory-works/)
  - how-tools-work：[how-tools-work](https://docs.n8n.io/build/integrate-ai/understand-ai-components/how-tools-work/)
  - store-and-search-data-with-vectors：[store-and-search-data-with-vectors](https://docs.n8n.io/build/integrate-ai/understand-ai-components/store-and-search-data-with-vectors/)
  - retrieve-relevant-context：[retrieve-relevant-context](https://docs.n8n.io/build/integrate-ai/understand-ai-components/retrieve-relevant-context/)
- Test and improve AI workflows：[https://docs.n8n.io/build/integrate-ai/test-and-improve-ai-workflows/](https://docs.n8n.io/build/integrate-ai/test-and-improve-ai-workflows/)
- Self-hosting：[https://docs.n8n.io/hosting](https://docs.n8n.io/hosting)
- AI Templates：[https://n8n.io/workflows/?q=ai](https://n8n.io/workflows/?q=ai)
- n8n Cloud：[https://n8n.io/cloud/](https://n8n.io/cloud/)
- GitHub：[https://github.com/n8n-io/n8n](https://github.com/n8n-io/n8n)
- Releases：[https://github.com/n8n-io/n8n/releases](https://github.com/n8n-io/n8n/releases)
