---
layout: doc
outline: [2, 3]
---

# 核心概念与 Workflow 编排

> 基于 Dify 官方文档（docs.dify.ai）+ GitHub Release Notes 编写，对照 v1.16.0 稳定版（2026-07-17 发布）

## 速查

- **应用类型**：Workflow（一次性 / Trigger / Output）/ Chatflow（每轮 / Answer / Memory + 对话变量）/ Agent（v1.16.0 Beta，沙箱，Capability/Task 分离）/ legacy Chatbot · Text Generator
- **节点全景**：Start / LLM / Knowledge Retrieval / Agent / Code / Template(Jinja2) / IF-ELSE / Iteration(并行 ≤10) / Loop / Parameter Extractor / Question Classifier / Variable Aggregator / Variable Assigner / HTTP Request / Tool / Doc Extractor / List Operator / Answer / Output / Human Input(v1.13.0+) / Trigger
- **RAG 三件套**：High Quality 索引 + Hybrid Search + Rerank Model；Economical 索引创建后不可切换；Hybrid 中 Weight Settings 与 Rerank **二选一**
- **Top K 默认 3**；**Score Threshold 默认 0.5**（仅 Rerank 阶段生效，盲调阈值不开 Rerank 等于无效）
- **Agent 两种策略**：Function Calling（须模型原生 FC）vs ReAct（Thought→Action→Observation）；务必设 Maximum Iterations（简单 3-5，复杂 10-15）
- **LLM 节点**：Temperature 0-1 / Top P / Frequency Penalty / Presence Penalty；Prompt 支持 `{{var}}` 与 Jinja2；Context 关联 RAG；VISION(High/Low detail)；Structured Output(JSON Schema)；Memory 仅 Chatflow 节点级
- **变量 4 种**：Inputs / Outputs / Environment Variables（与 DSL 解耦、存密钥）/ Conversation Variables（仅 Chatflow 跨轮持久化）；系统变量 `sys.user_id` / `sys.workflow_id` / `sys.conversation_id` 等
- **DSL**：所有应用可导出 YAML 跨实例迁移 / 版本控制；密钥应放 Environment Variables
- **REST API**：Base URL 云端 `https://api.dify.ai/v1`、Bearer Token；**App Key 单应用范围**、**Knowledge Base Key 全知识库范围**；用 `user` 字段标识终端用户
- **模型类型 5 种**：System Reasoning / Embedding / Rerank / Speech-to-Text / Text-to-Speech；AI Credits + 自带 Key 双轨（Usage Priority）；Professional/Team 多 Key 负载均衡
- **新版 Agent Beta**：v1.16.0，Linux 沙箱、Capability(身份/能力) 与 Task(任务) 分离、Chatflow 中不保留对话记忆、MCP 协议升级 2025-06-18
- **部署**：Docker Compose（≥2C / ≥4G、Compose 2.24.0+、7 核心 + 7 依赖服务）；社区版沙箱非硬化（需 Cloud / Enterprise 满足合规）

## 应用类型深度

### Workflow（一次性执行）

- **触发**：User Input（手动）或 Trigger（Schedule / Webhook / Integration 自动）
- **结束**：Output 节点
- **无 Memory / 无对话变量**：每次执行独立，适合批处理、定时任务、Webhook 接入
- **典型节点链**：Start → Knowledge Retrieval → LLM(Context 关联) → Output

```text
[Start: User Input / Trigger]
        ↓
[Knowledge Retrieval] ← 知识库
        ↓
   [LLM 节点]
   Context 关联 RAG
        ↓
   [Output 节点]
```

### Chatflow（对话型）

- **触发**：每轮对话
- **结束**：Answer 节点（**必需**，否则报错）
- **Memory**：节点级，仅 Chatflow 支持，不跨会话
- **Conversation Variables**：跨轮持久化（todo、token 计数、用户画像）
- **典型节点链**：Start → Question Classifier → Knowledge Retrieval → LLM(Context + Memory) → Answer

> **反模式**：在 Chatflow 中期待新版 Agent Beta 自动保留对话记忆——官方明确「each message from scratch」，需要记忆必须自行用 Conversation Variables 或外接记忆机制。

### Agent（v1.16.0 Beta）

- **执行环境**：Linux 沙箱（当前单沙箱，未来版本完全隔离）
- **架构**：Capability（角色 / prompt / 模型 / 知识 / 技能 / 工具 / 文件）与 Task（任务）分离
- **接入**：可独立 chat，或作为 Workflow 中的 Agent 节点
- **输出**：默认 text / files / json，可声明扩展
- **记忆**：不保留对话记忆，需要时显式外接

> 经典 Agent 节点仍可用，但新版 Beta 才是未来主线。

## 节点深度

### LLM 节点

| 配置项 | 取值 / 说明 |
| --- | --- |
| **Temperature** | 0-1，0 最确定 / 1 最发散 |
| **Top P** | 核采样 |
| **Frequency Penalty / Presence Penalty** | 抑制重复 |
| **Presets** | Precise / Balanced / Creative |
| **Prompt** | 支持 `{{var}}` 与 Jinja2 模板 |
| **Context** | 关联 Knowledge Retrieval 实现 RAG（关键） |
| **VISION** | 多模态，High / Low detail |
| **Structured Output** | 可视化 / JSON Schema / AI 生成 |
| **Memory** | **仅 Chatflow**，节点级不跨会话 |
| **reasoning tag** | 推理分离 `<think>` → `reasoning_content` |

> Structured Output 优先用 JSON Schema 锁字段，下游节点（Code / IF-ELSE / HTTP Request）才能稳定解析。

### Knowledge Retrieval 节点

- 关联一个或多个知识库
- 输入查询变量（通常是 `sys.query` 或上游 LLM 改写）
- 输出 `result`（召回片段数组）与 `metadata`（命中知识库、分数等）
- 下游 LLM 节点用 Context 关联此输出，开启 citation 引用追踪

### Agent 节点

| 配置项 | 说明 |
| --- | --- |
| **Agent Strategy** | Function Calling / ReAct |
| **Model** | FC 策略要求模型原生支持 FC；ReAct 适用任意模型 |
| **Tools** | 工具集，Description 决定 Agent 何时调用 |
| **Instructions** | 角色 / 任务说明 |
| **Maximum Iterations** | 简单 3-5，复杂研究 10-15，**必设防死循环** |
| **Knowledge** | 可关联知识库 |
| **输出字段** | Final Answer / Tool Outputs / Reasoning Trace / Iteration Count / Success Status / Agent Logs |

> **核心约束**：FC 策略配在不支持原生函数调用的模型上会调用失败或退化为无效输出；这类模型必须切 ReAct。Instructions / Description 模糊会导致 Agent 选错工具。

### Iteration 节点

- 输入数组，按元素迭代
- **Parallel Mode**：最大并行度 **10**，加速批处理
- 配合 LLM / Code / HTTP Request 节点处理数组（如批翻译、批分类、批检索）

### Code / Template / HTTP Request

- **Code**：Python / JS 沙箱执行（沙箱隔离，限制文件 / 网络访问）
- **Template（Jinja2）**：模板渲染，组装复杂 Prompt 或 JSON
- **HTTP Request**：调外部 API，支持环境变量凭据

### Human Input（v1.13.0+）

- Human-in-the-Loop：工作流暂停 / 恢复 / 审批
- 适合人工审核、签字、补充信息后继续执行

## RAG 引擎

### 分段（Chunking）

| 模式 | 说明 |
| --- | --- |
| **General Mode** | 按分段长度 +  overlap 切 |
| **Parent-child Mode** | 父分段召回、子分段喂 LLM，保留上下文 |

**反模式**：按固定 token 长度盲切，会切断文档层级语义；技术文档应保留 AST / 标题 / 章节。

### 索引（Indexing）

| 方式 | 说明 | 检索模式 |
| --- | --- | --- |
| **High Quality** | Embedding 向量化 | Vector / Full-Text / Hybrid |
| **Economical** | 关键词 / 倒排索引 | Inverted Index |

> **不可逆约束**：High Quality 与 Economical **创建后不可互换**。Economical 只有关键词匹配，跨语言 / 语义场景召回差。

### 检索（Retrieval）

| 模式 | 适用索引 | 原理 |
| --- | --- | --- |
| **Vector Search** | High Quality | 语义相似度，跨语言强 |
| **Full-Text Search** | High Quality | 关键词匹配 |
| **Hybrid Search** | High Quality | 同时跑 Vector + Full-Text，再合并 |
| **Inverted Index** | Economical | 倒排关键词 |

### 检索参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| **Top K** | 3 | 召回片段数；过小漏召回、过大占 LLM context |
| **Score Threshold** | 0.5 | **仅 Rerank 阶段生效**，盲调阈值不开 Rerank 无效 |
| **Rerank Model** | 禁用 | 重排序提精度，需启用 Rerank 模型 |
| **Weight Settings** | — | Hybrid 中 Semantic / Keyword 权重；与 Rerank **二选一** |

> **三件套最佳实践**：High Quality + Hybrid Search + Rerank。纯向量检索生产中常因术语错配掉分。

### Hybrid Search 权重陷阱

- **Weight Settings vs Rerank Model**：文档明确「二选一」，同时配置不是增强而是冲突
- **Semantic=1**：等于退化成纯向量检索，丢失混合价值
- **Keyword=1**：等于退化成纯关键词检索
- 自定义权重：在两路召回之间找平衡

## Agent 策略

### Function Calling

- **原理**：依赖模型原生函数调用 API（OpenAI / Anthropic / 部分 Google 模型）
- **优点**：单轮直出 tool call，效率高、稳定
- **约束**：模型必须原生支持 FC，否则调用失败

### ReAct

- **原理**：Thought → Action → Observation 显式推理循环（提示工程）
- **优点**：适用任意模型，包括无原生 FC 的开源模型
- **缺点**：迭代次数多、token 消耗高、对 prompt 敏感

> 选型先看模型：原生 FC 支持 → FC；否则 → ReAct。再设 Maximum Iterations 防死循环。

## 变量系统深度

### 四种类型

| 类型 | 范围 | 解耦 DSL | 典型用途 |
| --- | --- | --- | --- |
| **Inputs** | Start 节点 | 否 | 用户输入参数 |
| **Outputs** | 节点产出 | 否 | 节点间传递 |
| **Environment Variables** | 应用级常量 | **是** | API Key / Secret |
| **Conversation Variables** | 仅 Chatflow | 否 | 跨轮持久化（todo / token / 画像） |

### 系统变量

| 变量 | Workflow | Chatflow |
| --- | --- | --- |
| `sys.user_id` | ✓ | ✓ |
| `sys.app_id` | ✓ | ✓ |
| `sys.workflow_id` | ✓ | ✓ |
| `sys.workflow_run_id` | ✓ | ✓ |
| `sys.timestamp` | ✓ | ✓ |
| `sys.conversation_id` | — | ✓ |
| `sys.dialogue_count` | — | ✓ |

> 密钥写进 Prompt / DSL 会随导出泄露——**必须放 Environment Variables**。

## DSL 与迁移

- 所有 Dify 应用可**导出为 YAML**（Domain-Specific Language）
- 跨实例迁移 / 版本控制 / 团队分享均通过 DSL
- 自托管可纳入 Git 版本管理
- Environment Variables 与 DSL 解耦，密钥不会随 DSL 泄露

## REST API 深度

### Base URL

| 部署 | URL |
| --- | --- |
| 云端 SaaS | `https://api.dify.ai/v1` |
| 自托管 | 本机 URL，如 `http://your-host/v1` |

### 认证与 Key 范围

| Key 类型 | 范围 | 注意 |
| --- | --- | --- |
| **App Key** | 单应用 | 默认推荐 |
| **Knowledge Base Key** | 账户下所有知识库 | **权限大，更要严格保管** |

- 认证：`Authorization: Bearer {api_key}`
- **用 `user` 字段标识终端用户**，不为每用户发 Key
- Key 仅在后端使用，不要嵌入前端

### 关键端点

| 端点 | 用途 |
| --- | --- |
| `/info` | 应用元信息 |
| `/chat-messages` | Chatflow 对话 |
| `/workflows/run` | Workflow 执行 |
| `/completion-messages` | Text Generator 补全 |
| `/agents/chat` | Agent 对话（新版 Beta） |
| `knowledge/documents` | 知识库文档管理 |
| `knowledge/chunks` | 分片管理 |
| `knowledge/metadata` | 元数据 |
| `/workflow-runs` | 执行历史 |

> 知识库 Key 权限大、能跨知识库操作，泄露后果严重，更要严格保管。

## 模型管理与多 Provider

### 五类模型

| 类型 | 用途 |
| --- | --- |
| System Reasoning Model（LLM） | 主推理 |
| Embedding Model | 向量化（RAG High Quality） |
| Rerank Model | 重排序 |
| Speech-to-Text | 语音转文字 |
| Text-to-Speech | 文字转语音 |

### Provider 接入

- **入口**：Integrations > Model Provider 或 Marketplace
- **双轨**：AI Credits（Dify 代付）vs 自带 API Key；Usage Priority 配置优先级
- **多 Key 负载均衡**：Professional / Team 计划，多 Key + 限流回退
- **GPT-5.6 兼容**：API 类型从 Chat Completions 切到 Responses

## 自托管与版本演进

### Docker Compose 部署

| 项 | 要求 |
| --- | --- |
| CPU | ≥ 2 核 |
| 内存 | ≥ 4 GiB |
| Docker Compose | ≥ 2.24.0 |
| 服务 | 7 核心 + 7 依赖（含 Weaviate / PostgreSQL / Redis / sandbox 等） |

### 安全加固（v1.14.x+）

- **SECRET_KEY**：v1.14.1 起不再依赖默认值，生产必须自定
- **SSRF 代理**：HTTP Request 节点强制走代理
- **Sandbox 隔离**：Code 节点沙箱
- **租户隔离**：跨租户严格隔离
- **工具凭证安全管理**：与 DSL 解耦

### 版本里程碑

| 版本 | 发布 | 关键特性 |
| --- | --- | --- |
| **v1.13.0** | — | Human Input 节点（HITL） |
| **v1.14.x** | 2026-05 | 安全加固（租户隔离 / SECRET_KEY / LiteLLM CVE / 工具凭证） |
| **v1.15.0** | 2026-06-25 | difyctl CLI / Chain-of-Thought 可视化 / HITL 表单增强 / 慢模型轮询 |
| **v1.16.0** | 2026-07-17 | Dify Agent Beta（Linux 沙箱、Capability/Task 分离）/ MCP 协议升级 2025-06-18 / 安全修复（SQL 注入 / SSRF / 开放重定向） |

> 社区版沙箱**非硬化安全边界**；高合规需求选 Cloud 或 Enterprise。

## 反模式（避坑）

- **用 Economical 索引上线 RAG 后又想要语义检索精度**：High Quality 与 Economical 创建后不可互换，Economical 只有关键词 / 倒排，跨语言 / 语义场景必然召回不足
- **Hybrid Search 同时配置 Weight Settings 与 Rerank Model**：文档明确「二选一」，同时配置不是增强而是冲突
- **把 Hybrid 的 Semantic 设为 1（或 Keyword 设为 1）当「同时启用两路召回」**：实际等于退化成单路向量 / 单路关键词，丢失混合价值
- **盲目缩小 chunk 求基准测试高分**：benchmark 上小 chunk 表现好，但生产中上下文拼不上反而掉链子；技术文档应保留 AST / 层级结构
- **在 Chatflow 中期待新版 Agent Beta 自动保留对话记忆**：官方明确「each message from scratch」，需要记忆要自行用 Conversation Variables 或外接记忆机制
- **Function Calling 策略配在不支持原生 FC 的模型上**：会调用失败或退化；这类模型必须切 ReAct
- **Agent 节点不设 Maximum Iterations 或设过大**：token 失控甚至死循环；Instructions / Description 模糊导致选错工具
- **API Key 嵌入前端代码或前端直连 Dify API**：Key 暴露，尤其 Knowledge Base Key 可达所有知识库
- **自托管升级直接覆盖 .env 不对比 .env.example**：跨版本常有新增 / 改名环境变量；v1.14.x 还有 SECRET_KEY 等加固需手动启用
- **把「文档摘要未提及某特性」当成「已废弃」**：检索改写、多路召回等命名差异，要查官方最新 release notes 与 API reference 确认

## 下一步

- [参考](./reference.md)：节点速查表、API 端点清单、版本演进、官方资源
