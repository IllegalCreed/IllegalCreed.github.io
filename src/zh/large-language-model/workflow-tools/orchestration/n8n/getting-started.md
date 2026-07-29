---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 n8n 官方文档（docs.n8n.io）+ GitHub Release Notes 编写，对照 2024-2026 AI 能力爆发期版本行为

## 速查

- **本质定位**：开源工作流自动化平台（fair-code / Sustainable Use License），节点式可视化编排 + 内置 70+ LangChain.js AI 节点；不是 LLM 应用构建器、不是 AI Agent SDK、不是 ESB
- **核心抽象**：节点（Node）/ 触发器（Trigger）/ 连接（Connection）/ 项目（Item，含 json 与 binary）/ 执行（Execution，含 manual / production 模式）
- **AI 节点族 2 个 root**：**AI Agent**（决策型、循环执行、必接 Chat Model + 可选 Memory/Tools/Vector Store）vs **Basic LLM Chain**（预定义序列、单次执行、不支持 Memory/Tools）
- **AI 子节点 4 类**：Chat Model（OpenAI / Anthropic / Gemini / Mistral / Alibaba Qwen / MiniMax）/ Memory（Window Buffer / Postgres / Redis / Zep / Motorhead / Xata）/ Tools（Wikipedia / SerpAPI / Calculator / HTTP Request Tool / Custom Code Tool / Call n8n Workflow Tool）/ Vector Store（Pinecone / Qdrant / Supabase / Milvus / pgvector / In-Memory）
- **$fromAI()**：Tool Calling 关键函数，让 Agent 在运行时根据用户输入动态生成参数；静态参数无法处理多变的自然语言输入
- **RAG 管道**：Document Loaders → Text Splitters → Embeddings（**仅支持文本**）→ Vector Store 存储 → Retriever 检索相似上下文
- **Chat Trigger**：面向 AI 的对话入口（接收用户消息触发工作流），配合 ChatHub / AI Assistant 使用
- **MCP Client / Trigger**：对接 Model Context Protocol 服务器，把外部 MCP 工具 / 资源接入 n8n 工作流
- **Evaluation 节点 + Trigger**：跑测试集评估 AI 工作流质量（why test → run quick evaluations → use metrics）
- **部署双轨**：Cloud（托管、自动升级、低运维）vs Self-hosted（Docker / npm / Docker Compose / K8s、完全控制升级节奏 / 环境变量 / 安全 / 扩缩容 / 数据库结构）
- **官方趋势**：Docker 优先（npm-native 可能 sunset）；AI Workflow Builder / AI Assistant 用自然语言生成工作流
- **关键环境变量**：`N8N_HOST` / `N8N_PORT=5678` / `N8N_PROTOCOL` / `WEBHOOK_URL` / `N8N_USER_FOLDER` / `N8N_ENCRYPTION_KEY`（生产必须自定，否则凭据密钥可被破解）
- **数据库**：默认 SQLite（适合原型）、生产用 PostgreSQL / MySQL / MariaDB / MS SQL；与 n8n 自身的元数据（执行历史、凭据、用户）对应
- **AI Starter Kit**：一键起一个含向量库 + AI 工作流环境的 Docker Compose 模板
- **许可边界**：Sustainable Use License 自由内部使用，**与 n8n 竞争的商业产品 / 托管服务有限制**，商用前看 LICENSE

## n8n 是什么

n8n 是开源的工作流自动化平台（fair-code / Sustainable Use License），用「可视化节点 + 触发器 + 连接」把 SaaS / 数据库 / 消息系统 / AI 模型按业务流程串成自动化工作流。它的核心定位有三：

- **工作流自动化引擎**：节点 / 触发器 / 连接 / 执行抽象，1000+ 内置集成覆盖 IM、邮件、数据库、文件、SaaS、HTTP 等场景
- **AI 嵌入式编排器**：基于 LangChain.js 的 70+ AI 节点族，把 AI Agent / Chain / Memory / Tools / Vector Store 节点化嵌入既有业务流程
- **可自托管 + 可扩展**：Cloud 一键托管，Self-hosted 用 Docker / npm / Docker Compose / K8s 完全控制；Code 节点（JS / Python）+ HTTP Request 节点兜底任意「未内置」的能力

> n8n ≠ LLM 应用构建器（那是 Dify / Flowise）、≠ AI Agent SDK（LangChain / LlamaIndex 才是）、≠ 消息总线 ESB。它做的是「把 AI 嵌进既有 SaaS / DB / 通知链路」这件事。

## 核心抽象

| 抽象 | 含义 |
| --- | --- |
| **Node（节点）** | 工作流执行单元；分 Trigger 节点（Webhook / Schedule / Chat / Manual / Polling）与 Regular 节点（动作 / AI） |
| **Trigger（触发器）** | 工作流入口，决定何时启动；常用 Manual / Webhook / Schedule / Chat Trigger |
| **Connection（连接）** | 节点间的数据流；支持扇出（多个下游）、循环、错误分支 |
| **Item（项目）** | 节点间传递的数据单元，含 `json`（结构化）与 `binary`（文件 / 媒体） |
| **Execution（执行）** | 一次完整工作流运行的实例；分 manual（手动 / 调试）与 production（Trigger 触发）模式 |
| **Credential（凭据）** | 节点对接外部服务的认证信息，AES-256 加密存储（密钥 = `N8N_ENCRYPTION_KEY`） |

## 节点全景

### Trigger 节点

| 触发器 | 用途 |
| --- | --- |
| **Manual Trigger** | 手动点 Execute Trigger，调试用 |
| **Webhook** | 接收 HTTP 请求触发 |
| **Schedule Trigger** | Cron / 间隔定时触发 |
| **Chat Trigger** | 面向 AI 的对话入口，接收用户消息 |
| **Polling Trigger** | 周期查询外部系统（如新邮件、新 IM 消息） |
| **MCP Trigger** | 接收 Model Context Protocol 请求 |
| **Evaluation Trigger** | 触发 AI 工作流测试集评估 |

### Regular 节点（动作）

| 类别 | 代表节点 |
| --- | --- |
| **HTTP / 网络** | HTTP Request（万能兜底） |
| **数据库** | Postgres / MySQL / MongoDB / Redis / Snowflake / MS SQL |
| **SaaS 集成** | Slack / Gmail / Notion / Airtable / GitHub / Google Sheets 等 1000+ |
| **数据变换** | Set / Code（JS+Python）/ Filter / Item Lists / Merge / Split In Batches |
| **文件 / 媒体** | Read/Write Files、Convert to File、Extract from File |
| **消息 / 通知** | Email / IM / Webhook |
| **流程控制** | IF / Switch / Loop / Sub-workflow Execution / Error Trigger |

### AI 节点族

| 类别 | 节点 | 角色 |
| --- | --- | --- |
| **Root** | AI Agent | 决策型，用 LLM 决定调用哪个工具；可配 Tools / Conversational / ReAct 等多种 Agent 类型；必接 Chat Model |
| **Root** | Basic LLM Chain | 预定义序列链，单次执行，**不支持 Memory / Tools** |
| **Sub-node** | Chat Model | 对接 LLM 供应商：OpenAI / Anthropic / Gemini / Mistral / Alibaba Qwen / MiniMax 等 |
| **Sub-node** | Memory | 持久化对话上下文：Window Buffer / Postgres / Redis / Zep / Motorhead / Xata / Chat Memory Manager |
| **Sub-node** | Tools | 工具调用：Wikipedia / SerpAPI / Calculator / HTTP Request Tool / Custom Code Tool / Call n8n Workflow Tool |
| **Sub-node** | Vector Store | RAG 存储：Pinecone / Qdrant / Supabase / Milvus / pgvector / In-Memory 等 |
| **Sub-node** | Document Loaders | 数据加载：PDF / Web / Text / Notion 等 |
| **Sub-node** | Text Splitters | 文档分块：Token / Character / Recursive / Markdown 等 |
| **Sub-node** | Embeddings | 向量化（**仅支持文本**，不支持图像 / 音频） |
| **集成** | MCP Client | 对接 Model Context Protocol 服务器，把外部 MCP 工具 / 资源接入工作流 |
| **治理** | Guardrails | 为 AI 输入 / 输出加结构化校验与过滤，降低 prompt 注入与不可控输出风险 |
| **工程化** | AI Transform | 用 LLM 做批量数据变换 |
| **工程化** | Evaluation + Trigger | 跑测试集评估 AI 工作流质量 |
| **辅助** | AI Workflow Builder / AI Assistant | 自然语言生成工作流、为代码节点提供编码帮助 |

## 部署：Cloud vs Self-hosted

| 维度 | n8n Cloud | Self-hosted（Docker / npm / Compose / K8s） |
| --- | --- | --- |
| **运维** | 托管、自动升级、零运维 | 自己管版本 / 升级 / 备份 / 监控 |
| **控制** | 有限环境变量、功能 | 完全控制升级节奏 / 环境变量 / 安全 / 扩缩容 / 数据库结构 |
| **成本** | 起步 €20/月，按执行计 | 自有服务器成本（VPS / ECS），大规模更便宜 |
| **集成深度** | 受 Cloud 限制（数据库结构、自定义安全、特殊 scaling） | 可定制数据库结构、SECRET、scaling、独立 Postgres |
| **AI 能力** | 全部 AI 节点可用 | 全部 AI 节点可用，可对接自有向量库 / 内网 LLM |
| **适用** | 不想运维 / 团队上手 / 小规模 | 生产 / 大规模 / 高合规 / 内网部署 |

> 选型口诀：不想运维 → Cloud；要控制版本 / 安全 / 扩缩容 / 数据库结构 → Self-hosted。

## 自托管速跑（Docker）

```bash
# 轻量版（仅测试用，SQLite + 单容器）
docker run -it --rm \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n

# 访问 http://localhost:5678 完成初始化向导
```

**生产推荐 Docker Compose + Postgres**：

```yaml
# docker-compose.yml 节选
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: n8n
    volumes:
      - pg_data:/var/lib/postgresql/data
  n8n:
    image: docker.n8n.io/n8nio/n8n
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: n8n
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}  # 生产必须自定
      WEBHOOK_URL: https://n8n.example.com/
      N8N_HOST: n8n.example.com
      N8N_PROTOCOL: https
    ports: ["5678:5678"]
    depends_on: [postgres]
volumes:
  pg_data:
```

**生产关键环境变量**：

- `N8N_ENCRYPTION_KEY`：凭据 AES-256 加密密钥（**生产必须自定**，否则容器重启后凭据解密失败或被破解）
- `WEBHOOK_URL` / `N8N_HOST` / `N8N_PROTOCOL`：决定 Webhook / OAuth 回调 URL
- `DB_TYPE` / `DB_POSTGRESDB_*`：切到 PostgreSQL（生产推荐，SQLite 仅原型）
- `N8N_USER_FOLDER`：自定义用户数据目录
- `EXECUTIONS_DATA_PRUNE` / `EXECUTIONS_DATA_MAX_AGE`：清理历史执行数据

> npm 启动仅用于原型：`npx n8n`。社区在推 Docker 优先、讨论 sunset npm-native，生产请用 Docker + 独立 Postgres。

## 起一张 AI Agent 工作流

最快上手路径：

1. 新建工作流 → 加 **Chat Trigger** 作为对话入口
2. 加 **AI Agent** 节点（root）作为决策核心
3. 给 AI Agent 接子节点：**OpenAI Chat Model**（必接）+ **Window Buffer Memory**（对话记忆）+ **Wikipedia Tool**（工具）
4. 点 Test workflow，在 Chat 面板里输入「帮我查一下巴黎的历史」
5. Agent 内部循环：解析输入 → 选 Wikipedia Tool → 调用 → 收 Observation → LLM 总结 → 回复
6. 满意后点 Active 启用，Chat Trigger 即对外提供对话服务

**反模式**：把 LLM Chain 当 Agent 用（接 Memory / Tools 也不生效）；把全部私有数据塞 prompt 上下文（应走 RAG）。

## 与同类工具的边界

| 工具 | 定位 | 与 n8n 边界 |
| --- | --- | --- |
| **Dify** | LLM 应用编排 / LLMOps 平台 | Dify 强在「LLM 应用 / RAG 应用快速搭」，自动化弱；n8n 强在「深度自动化引擎 + 1000+ 非 AI 集成」，AI 是后加能力。要把 LLM 嵌进既有 SaaS / DB / 通知链路用 n8n，要做纯 AI 问答应用用 Dify |
| **Zapier** | 闭源 SaaS 集成器 | Zapier 闭源 SaaS、集成最多、最易上手、规模化最贵；n8n 开源可自托管、便宜、灵活，AI 节点更深 |
| **Make** | 视觉化自动化 SaaS | Make 视觉逻辑强、价格中档；n8n 自托管 + 代码节点对开发者更友好、可深度扩展 |
| **LangChain** | AI Agent SDK / 框架 | LangChain 是代码层 SDK；n8n 的 AI 节点族底层就是 LangChain.js，把 LangChain 抽象成可视化节点；复杂自定义 Agent 仍要回到代码 |
| **Flowise** | LLM 应用构建器 | Flowise 是 LangChain 的可视化壳；n8n 是自动化平台 + LangChain 节点族，集成面更广 |

> 选型口诀：纯 AI 应用 → Dify / Flowise；纯代码 Agent → LangChain / LlamaIndex；**LLM + 业务流程自动化 → n8n**；闭源 SaaS 集成 → Zapier / Make。

## 下一步

- [核心概念与 AI 节点编排](./guide-line.md)：AI Agent vs Chain 决策、Memory 选型、Tools 与 Tool Calling、RAG 五步、Evaluation、部署深度、反模式
- [参考](./reference.md)：节点速查表、环境变量清单、版本演进、官方资源
