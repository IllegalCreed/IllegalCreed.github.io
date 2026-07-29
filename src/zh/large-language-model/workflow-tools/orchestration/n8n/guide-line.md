---
layout: doc
outline: [2, 3]
---

# 核心概念与 AI 节点编排

> 基于 n8n 官方文档（docs.n8n.io）+ GitHub Release Notes 编写，对照 2024-2026 AI 能力爆发期版本行为

## 速查

- **AI Root 节点 2 个**：**AI Agent**（决策型，循环执行，必接 Chat Model，可选 Memory/Tools/Vector Store，支持 Tools Agent / Conversational Agent / ReAct Agent 等多类型）vs **Basic LLM Chain**（预定义序列，单次执行，**不支持 Memory/Tools**，每次请求独立）
- **Agent vs Chain 选型**：动态决策 / 多工具 / 多轮对话 → Agent；提示词 → 响应的固定流程 → Chain（更快更省）
- **Memory 仅 Agent 可用**：Chain 接了也不生效；Window Buffer 简单适合开发，生产用 Postgres / Redis / Zep / Motorhead / Xata；Chat Memory Manager 用于检查 / 裁剪 / 注入伪用户消息
- **Tools 子节点 6 类**：Wikipedia / SerpAPI（搜索）/ Calculator / HTTP Request Tool / Custom Code Tool / **Call n8n Workflow Tool**（把任意 n8n 工作流当工具暴露，最大复用）
- **Tool Calling 关键**：`$fromAI()` 让 Agent 在运行时根据用户输入动态填参数；静态参数无法处理多变自然语言输入
- **RAG 五步**：Document Loaders → Text Splitters → Embeddings（**仅支持文本，不支持图像 / 音频**）→ Vector Store 存储 → Retriever 检索相似上下文
- **Vector Store 选型**：In-Memory（原型）/ pgvector（已用 Postgres）/ Pinecone（云托管）/ Qdrant / Milvus / Supabase / Zep 等
- **Chat Model 供应商**：OpenAI / Anthropic / Google Gemini / Mistral / Alibaba Qwen / MiniMax 等全覆盖；通过 LangChain.js 抽象，切模型只换节点不改结构
- **MCP Client / Trigger**：把外部 Model Context Protocol 工具 / 资源接入工作流；MCP 是 2024-2025 涌现的「LLM 工具 / 资源标准化协议」
- **Evaluation 节点 + Trigger**：跑测试集评估 AI 工作流质量（why test → run quick evaluations → use metrics）；改 prompt 必须跑 Evaluation 防回归
- **Guardrails 节点**：为 AI 输入 / 输出加结构化校验与过滤，防 prompt 注入与不可控输出；HTTP Request Tool 直接暴露给用户尤其需要
- **部署**：Docker 优先（npm 可能 sunset）；Cloud 适合不想运维；Self-hosted（Docker / Docker Compose / K8s）控制版本 / 安全 / 扩缩容 / 数据库结构；生产用独立 Postgres + `N8N_ENCRYPTION_KEY`
- **Human-in-the-loop + Human Fallback**：关键步骤用 `human-in-the-loop-for-tools` 暂停等人审；低置信度时 `set-a-human-fallback` 转人工，避免错误放大
- **AI Workflow Builder / AI Assistant**：自然语言生成 / 修改工作流；AI Assistant Preview 还能为代码节点提供编码帮助
- **AI Starter Kit**：一键起一个含向量库 + AI 工作流环境的 Docker Compose 模板
- **许可**：fair-code / Sustainable Use License，自由内部使用，**与 n8n 竞争的商业产品 / 托管服务有限制**，商用前看 LICENSE

## AI Agent vs Basic LLM Chain

这是 n8n AI 编排的核心选型。两者都是 root 节点，但抽象层次完全不同。

| 维度 | AI Agent | Basic LLM Chain |
| --- | --- | --- |
| **执行模型** | 决策型，循环执行 | 预定义序列，单次执行 |
| **核心机制** | LLM 决定调用哪个工具 + 参数 + 何时停 | 固定 LLM 调用顺序，无自主决策 |
| **必接** | Chat Model | Chat Model |
| **可选** | Memory、Tools（多个）、Vector Store | 仅 System Message 配置提示词 |
| **Memory 支持** | ✓ | ✗（架构性限制，接了也不生效） |
| **Tools 支持** | ✓ | ✗ |
| **执行成本** | 慢、贵（多次 LLM 循环） | 快、省（单次调用） |
| **典型场景** | 多轮对话 / 多工具编排 / 动态决策 / RAG + 工具 | 提示词 → 响应的固定流程、批量分类、批量翻译 |

> **选型口诀**：需要『动态决策 / 多工具 / 多轮对话』用 Agent；只需『提示词 → 响应』的固定流程用 Chain，更快更省。把 Agent 当 Chain 用（单轮无工具）是常见反模式。

### AI Agent 节点支持的 Agent 类型

通过 settings 切换，包括但不限于：

- **Tools Agent**：通用工具调用型（推荐默认）
- **Conversational Agent**：对话型，强调 Memory 上下文
- **ReAct Agent**：Thought → Action → Observation 显式推理循环
- **SQL Agent**：聚焦数据库查询
- **OpenAI Functions Agent**：依赖 OpenAI 原生函数调用

> Agent 内部基于 LangChain.js Agent 框架，复杂自定义 Agent 仍需回到代码（LangChain Code 节点）。

## Memory 子节点选型

Memory 仅 Agent 节点能用，Chain 接了不生效。

| Memory 类型 | 持久化范围 | 适用场景 |
| --- | --- | --- |
| **Window Buffer Memory** | 会话级滚动窗口 | 开发 / 原型，最易上手 |
| **Postgres Chat Memory** | 跨会话（Postgres 表） | 生产、已有 Postgres |
| **Redis Chat Memory** | 跨会话（Redis） | 高吞吐、低延迟 |
| **Zep** | 跨会话 + 长期记忆 | 复杂记忆管理、用户画像 |
| **Motorhead (Metal)** | 跨会话 | Metal 平台用户 |
| **Xata** | 跨会话 + 向量化 | Xata 用户 |
| **Chat Memory Manager** | — | 用于检查 / 裁剪 / 注入伪用户消息，精细控制上下文 |

**反模式**：对话型 Agent 不接 Memory——每次请求都是独立的，Agent 无法回忆上文；生产用 Window Buffer 跨实例丢数据（应换 Postgres / Redis / Zep）。

## Tools 子节点与 Tool Calling

Agent 调用工具的能力来源；Agent 用 LLM 决定调用哪个 Tool + 参数，工具执行后返回 Observation 喂回 LLM。

### 内置 Tools

| Tool | 用途 |
| --- | --- |
| **Wikipedia** | 查维基百科 |
| **SerpAPI** | 搜索引擎结果（Google / Bing） |
| **Calculator** | 数学计算（避免 LLM 算错） |
| **HTTP Request Tool** | 万能兜底，调任意 API / 抓网页 |
| **Custom Code Tool** | 自定义 JS / Python 代码工具 |
| **Call n8n Workflow Tool** | **把任意 n8n 工作流当工具暴露给 Agent**（最大复用） |

> **Call n8n Workflow Tool 是核心复用模式**：把稳定子流程做成 Workflow，再用此 Tool 暴露给 Agent 调用，避免把所有逻辑塞进一个 Agent，提升可测试性与复用度。

### $fromAI() 动态参数

Tool Calling 关键函数：让 Agent 在运行时根据用户输入动态生成参数，而非写死静态入参。

- 静态参数：固定值，无法处理多变的自然语言输入
- `$fromAI(description, type)`：运行时由 LLM 决定值（基于用户输入 + 工具 description）

> 这是 Tool Calling 的关键模式，让 Agent 真正「理解」用户输入并填到工具入参。

### Tool 的安全风险

- 用户输入可能 prompt 注入或越权调用工具
- HTTP Request Tool 可被诱导拉内网资源（SSRF）
- 必须用 **Guardrails 节点** + 限定工具入参范围

## Vector Store 与 RAG 管道

让 LLM 基于私有数据回答的标准模式。

### RAG 五步

```text
[Document Loaders]   ← 拉数据：PDF / Web / Text / Notion 等
        ↓
[Text Splitters]     ← 分块：Token / Character / Recursive / Markdown
        ↓
[Embeddings]         ← 向量化（仅支持文本，不支持图像 / 音频）
        ↓
[Vector Store]       ← 存储：Pinecone / Qdrant / Supabase / Milvus / pgvector / In-Memory
        ↓
[Retriever]          ← 检索相似上下文，喂回 Agent / Chain
```

### Vector Store 选型

| 后端 | 适用 |
| --- | --- |
| **In-Memory Vector Store** | 原型 / 单实例开发，重启丢数据 |
| **Postgres pgvector** | 已有 Postgres，复用同一数据库 |
| **Pinecone** | 云托管向量库，免运维 |
| **Qdrant** | 开源高性能，自托管或云 |
| **Milvus** | 大规模向量场景 |
| **Supabase** | 用 Supabase pgvector 的云方案 |
| **Zep** | 跨会话记忆 + 向量化 |

### n8n Embeddings 能力边界

- **仅支持文本**：图像 / 音频 embedding 不在内置节点
- 多模态 RAG 需要外接（HTTP Request 调外部 embedding 服务，或 Custom Code Tool）

**反模式**：把全部私有数据塞 prompt 上下文——上下文窗口有限、token 成本爆炸、长上下文还会触发模型注意力衰减；应走 RAG 只取相关片段。

## Chat Trigger / Chat 节点

- **Chat Trigger**：面向 AI 的对话入口（接收用户消息触发工作流），是 n8n AI 工作流的标准触发器
- **Chat 节点**：用于会话交互，配合 ChatHub / AI Assistant 使用
- 调试时可用 Chat Trigger 模拟用户输入，配 AI Agent / Chain 即可形成对话循环

## MCP Client / Trigger

Model Context Protocol 是 2024-2025 涌现的「LLM 工具 / 资源标准化协议」，n8n 内置节点：

- **MCP Client**：运行时调用外部 MCP 服务器的工具 / 资源
- **MCP Trigger**：把 n8n 工作流本身作为 MCP 服务器，接收外部 MCP 客户端请求

> MCP 让 n8n 与外部 Agent / IDE / 工具共享工具与资源，是 2024-2026 的关键集成趋势。

## Guardrails 与 AI 治理

为 AI 输入 / 输出加结构化校验与过滤：

- 防 prompt 注入（用户输入包含恶意指令）
- 防不可控输出（LLM 生成违规 / 越权内容）
- 限定工具入参范围（如 HTTP Request Tool 不允许内网 IP）

**反模式**：Tool 不加 Guardrails 直接暴露给用户——HTTP Request Tool 可被诱导拉内网资源、Custom Code Tool 可执行危险代码。

## Evaluation 节点（AI 测试体系）

AI 输出有随机性，凭肉眼调 prompt 容易回归。官方建议四步：

1. **Why test AI workflows**：理解为什么必须测
2. **Run quick evaluations**：用 Evaluation 节点 + Evaluation Trigger 跑测试集
3. **Use metrics**：用指标量化质量（accuracy / latency / token cost / faithfulness 等）
4. **Fix common issues**：基于评估结果修常见问题

| 节点 | 用途 |
| --- | --- |
| **Evaluation Trigger** | 触发测试集执行 |
| **Evaluation** | 跑评估、对比预期 vs 实际输出 |

> 改 prompt 必须跑 Evaluation 防回归——这是 AI 工程化的标配。

## 部署深度

### Docker 优先（推荐）

```bash
# 轻量（原型）
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n

# 生产（Docker Compose + Postgres）
docker compose up -d
```

### npm（仅原型）

```bash
# 全局装
npm install -g n8n
n8n start

# 或直接跑（不需要装）
npx n8n
```

> 社区与官方在推 Docker 优先、讨论 sunset npm-native。npm 长期支撑生产自托管有依赖漂移、手动管依赖风险，**生产请用 Docker + 独立 Postgres**。

### Cloud（不想运维）

- 起步 €20/月（Starter），按执行计
- 自动升级、托管数据库、内置监控
- 深度定制（数据库结构、自定义安全、特殊 scaling）受限，需切 Self-hosted

### 关键环境变量

| 变量 | 用途 |
| --- | --- |
| `N8N_ENCRYPTION_KEY` | 凭据 AES-256 加密密钥（**生产必须自定**） |
| `N8N_HOST` / `N8N_PORT=5678` / `N8N_PROTOCOL` | 实例地址 |
| `WEBHOOK_URL` | Webhook / OAuth 回调根 URL |
| `N8N_USER_FOLDER` | 用户数据目录 |
| `DB_TYPE` / `DB_POSTGRESDB_*` | 切到 PostgreSQL（生产推荐） |
| `EXECUTIONS_DATA_PRUNE` / `EXECUTIONS_DATA_MAX_AGE` | 清理历史执行数据 |
| `N8N_METRICS` | Prometheus 指标暴露 |
| `N8N_LOG_LEVEL` / `N8N_LOG_OUTPUT` | 日志级别 / 输出 |

### 后端元数据库

| 数据库 | 适用 |
| --- | --- |
| **SQLite**（默认） | 原型 / 单实例开发，文件持久化 |
| **PostgreSQL** | **生产推荐**，多 worker、并发安全 |
| **MySQL / MariaDB** | 已有 MySQL 栈 |
| **MS SQL** | 微软生态 |

> 后端元数据库**与 Vector Store 是两件事**：前者存执行历史 / 凭据 / 用户；后者存 RAG 向量（如 pgvector 可兼任两者）。

## Human-in-the-loop 与 Human Fallback

Agent 不可避免会出错，关键步骤必须有兜底：

- **human-in-the-loop-for-tools**：工具执行前暂停等人审批（如发邮件、转账、删数据）
- **set-a-human-fallback**：低置信度时（Agent 不确定 / 工具失败 / 用户情绪）转人工接管，避免错误放大

> 生产 AI 工作流的标准兜底模式：高价值操作必接 HITL，关键对话场景必接 Human Fallback。

## AI Workflow Builder / AI Assistant

- **AI Workflow Builder**：自然语言生成 / 修改 n8n 工作流（如「帮我建一个每周一抓 GitHub PR 发到 Slack 的工作流」）
- **AI Assistant Preview**：在 Code 节点提供编码帮助（生成 JS / Python 代码）

## 与同类工具的边界

| 工具 | 与 n8n 边界 |
| --- | --- |
| **Dify** | Dify 强在「LLM 应用 / RAG 应用快速搭」，自动化弱；n8n 强在「深度自动化引擎 + 1000+ 非 AI 集成」。要把 LLM 嵌进既有 SaaS / DB / 通知链路用 n8n；要做纯 AI 问答应用用 Dify |
| **Zapier** | Zapier 闭源 SaaS、集成最多、最易上手、规模化最贵；n8n 开源可自托管、便宜、灵活，AI 节点更深 |
| **Make** | Make 视觉逻辑强、价格中档；n8n 自托管 + 代码节点对开发者更友好、可深度扩展 |
| **LangChain** | LangChain 是代码 SDK；n8n AI 节点族底层就是 LangChain.js，把 LangChain 抽象成可视化节点；复杂自定义 Agent 仍要回到代码 |
| **Flowise** | Flowise 是 LangChain 的可视化壳；n8n 是自动化平台 + LangChain 节点族，集成面更广 |

## 反模式（避坑）

- **给 Chain 节点接 Memory / Tools**：Chain 在 n8n 设计上不支持持久 Memory、不支持 Tools；接了也不生效，反而误导维护者。需要对话 / 工具就换 Agent
- **把全部私有数据塞 prompt 上下文**：上下文窗口有限、token 成本爆炸、长上下文还会触发模型注意力衰减。应走 RAG 只取相关片段
- **用 npm 长期支撑生产自托管**：官方与社区在推 Docker 优先、讨论 sunset npm-native。npm 还要求手动管依赖、易漂移。生产请用 Docker + 独立 Postgres
- **改 prompt 不跑 Evaluation**：AI 输出随机，凭肉眼「看起来对」会掩盖回归。必须用 Evaluation 节点 + 指标量化质量
- **把 Agent 当 Chain 用（单轮无工具）**：Agent 的循环执行比 Chain 慢且更贵。不需要决策 / 工具 / 记忆时，应直接用 Basic LLM Chain
- **Tool 不加 Guardrails 直接暴露给用户**：用户输入可能 prompt 注入或越权调用工具（如 HTTP Request Tool 拉内网）。需要 Guardrails 节点 + 限定工具入参范围
- **在 Cloud 上做深度定制 / 自定义环境变量**：Cloud 只暴露有限环境变量与功能，深度定制（数据库结构、自定义安全配置、特殊 scaling）应走 Self-hosted
- **对话型 Agent 不接 Memory**：没有 Memory，每次请求都是独立的，Agent 无法回忆上文；生产用 Window Buffer 跨实例丢数据，应换 Postgres / Redis / Zep
- **把 LLM 应用构建器（Dify / Flowise）当自动化引擎用**：定位错位，会把简单 AI 问答应用塞进自动化平台，或把复杂业务流程自动化塞进 LLM 应用构建器
- **License 边界忽视**：fair-code 的 Sustainable Use License 自由内部使用，但与 n8n 竞争的商业产品 / 托管有限制，商用前必须看 LICENSE
- **把「文档摘要未提及某特性」当「已废弃」**：n8n 节点持续增长，命名变更、新节点替代很常见，要查官方最新 release notes 与节点目录确认

## 下一步

- [参考](./reference.md)：节点速查表、环境变量清单、版本演进、官方资源
