---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Dify 官方文档（docs.dify.ai）+ GitHub Release Notes 编写，对照 v1.16.0 稳定版（2026-07-17 发布）

## 速查

- 应用类型：**Workflow**（一次性 / Trigger / Output）/ **Chatflow**（每轮 / Answer / Memory）/ **Agent**（v1.16.0 Beta，沙箱）/ legacy Chatbot · Text Generator
- Start 节点：**User Input**（可发布 webapp / MCP / API / Tool）vs **Trigger**（Schedule / Webhook / Integration）
- RAG 索引：**High Quality（向量化）vs Economical（倒排）**——创建后**不可互换**
- RAG 检索：Vector / Full-Text / Hybrid / Inverted；**Top K 默认 3**、**Score Threshold 默认 0.5（仅 Rerank 生效）**
- Hybrid：Weight Settings 与 Rerank **二选一**
- LLM 节点：Temperature 0-1、Prompt 支持 `{{var}}` + Jinja2、Context 关联 RAG、Structured Output、Memory 仅 Chatflow
- 变量 4 种：Inputs / Outputs / Environment Variables（存密钥、与 DSL 解耦）/ Conversation Variables（仅 Chatflow）
- DSL：所有应用导出 YAML，跨实例迁移 / 版本控制
- REST API：云端 `https://api.dify.ai/v1`、Bearer Token；**App Key 单应用、Knowledge Base Key 全知识库**；用 `user` 标识终端用户
- 模型 5 类：System Reasoning / Embedding / Rerank / Speech-to-Text / Text-to-Speech；AI Credits + 自带 Key 双轨
- Agent 策略：Function Calling（须模型原生 FC）vs ReAct（提示工程）
- 部署：Docker Compose（≥2C / ≥4G、Compose 2.24.0+）
- 当前稳定版：**v1.16.0（2026-07-17）**

## 应用类型与差异

| 类型 | 触发 | 结束节点 | Memory | 对话变量 |
| --- | --- | --- | --- | --- |
| **Workflow** | 一次性 / Trigger | Output | 无 | 无 |
| **Chatflow** | 每轮对话 | Answer（必需） | 节点级 | 有 |
| **Agent（Beta v1.16.0）** | Workflow Agent 节点 / 独立 chat | text/files/json | 无（每条消息从零） | Capability 配 |
| **Chatbot（legacy）** | chat 模式 | — | 有 | — |
| **Text Generator（legacy）** | completion 模式 | — | 无 | — |

## 节点速查表

| 节点 | 作用 | 关键配置 |
| --- | --- | --- |
| **Start** | 入口 | User Input / Trigger |
| **LLM** | 调模型 | Temperature / Prompt `{{var}}` / Context / Structured Output |
| **Knowledge Retrieval** | RAG 检索 | 关联知识库 + 查询变量 |
| **Agent** | 工具编排 | FC / ReAct + Maximum Iterations |
| **Code** | 沙箱执行 | Python / JS |
| **Template** | 模板渲染 | Jinja2 |
| **IF/ELSE** | 条件路由 | — |
| **Iteration** | 数组遍历 | Parallel Mode（并行度 ≤10） |
| **Loop** | 循环 | — |
| **Parameter Extractor** | 抽结构化参数 | — |
| **Question Classifier** | 问题分类 | — |
| **Variable Aggregator** | 变量合并 | — |
| **Variable Assigner** | 变量赋值 | — |
| **HTTP Request** | 外部 API | 环境变量凭据 |
| **Tool** | 调工具 | 内置 / 自定义 |
| **Doc Extractor** | 文档解析 | — |
| **List Operator** | 列表操作 | — |
| **Answer** | 对话回复（Chatflow 必需） | — |
| **Output** | 输出结果（Workflow 必需） | — |
| **Human Input** | HITL（v1.13.0+） | 暂停 / 恢复 / 审批 |
| **Trigger** | 自动触发 | Schedule / Webhook / Integration |

## RAG 检索参数默认值

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| **Top K** | 3 | 召回片段数 |
| **Score Threshold** | 0.5 | **仅 Rerank 阶段生效** |
| **Rerank Model** | 禁用 | 启用后阈值才生效 |
| **Hybrid Weight Settings** | — | 与 Rerank **二选一** |
| Semantic 权重 | — | 1 = 退化为纯向量 |
| Keyword 权重 | — | 1 = 退化为纯关键词 |

## 索引与检索组合

| 索引 | 支持检索模式 |
| --- | --- |
| **High Quality** | Vector / Full-Text / Hybrid |
| **Economical** | Inverted Index |

> High Quality ↔ Economical **创建后不可互换**。

## 变量系统

| 类型 | 范围 | DSL 解耦 | 用途 |
| --- | --- | --- | --- |
| **Inputs** | Start 节点 | 否 | 用户输入 |
| **Outputs** | 节点产出 | 否 | 节点间传递 |
| **Environment Variables** | 应用级常量 | **是** | 密钥 / API Key |
| **Conversation Variables** | 仅 Chatflow | 否 | 跨轮持久化 |

**系统变量**：

| 变量 | Workflow | Chatflow |
| --- | --- | --- |
| `sys.user_id` | ✓ | ✓ |
| `sys.app_id` | ✓ | ✓ |
| `sys.workflow_id` | ✓ | ✓ |
| `sys.workflow_run_id` | ✓ | ✓ |
| `sys.timestamp` | ✓ | ✓ |
| `sys.conversation_id` | — | ✓ |
| `sys.dialogue_count` | — | ✓ |

## LLM 节点配置

| 配置 | 取值 / 说明 |
| --- | --- |
| Temperature | 0-1（0 最确定） |
| Top P | 核采样 |
| Frequency Penalty / Presence Penalty | 抑制重复 |
| Presets | Precise / Balanced / Creative |
| Prompt | `{{var}}` + Jinja2 |
| Context | 关联 Knowledge Retrieval（RAG） |
| VISION | High / Low detail |
| Structured Output | 可视化 / JSON Schema / AI 生成 |
| Memory | **仅 Chatflow**，节点级 |
| reasoning tag | `<think>` → `reasoning_content` |

## Agent 节点输出字段

| 字段 | 含义 |
| --- | --- |
| **Final Answer** | 最终答案 |
| **Tool Outputs** | 各工具输出 |
| **Reasoning Trace** | 推理链（ReAct 尤为明显） |
| **Iteration Count** | 迭代次数 |
| **Success Status** | 成功 / 失败状态 |
| **Agent Logs** | 完整日志 |

## REST API 端点

| 端点 | 方法 | 用途 |
| --- | --- | --- |
| `/info` | GET | 应用元信息 |
| `/chat-messages` | POST | Chatflow 对话 |
| `/workflows/run` | POST | Workflow 执行 |
| `/completion-messages` | POST | Text Generator 补全 |
| `/agents/chat` | POST | Agent 对话（新版 Beta） |
| `/messages/{message_id}/feedbacks` | POST | 消息反馈 |
| `/messages/{message_id}/suggested` | GET | 推荐问题 |
| `/conversations` | GET | 会话列表 |
| `/conversations/{conversation_id}` | DELETE | 删除会话 |
| `/conversations/{conversation_id}/name` | POST | 重命名会话 |
| `/audio-to-text` | POST | 语音转文字 |
| `/text-to-audio` | POST | 文字转语音 |
| `/metadata` | GET | 元数据 |
| `/workflow-runs` | GET | Workflow 执行历史 |
| `/workflow-runs/{run_id}` | GET | 单次执行详情 |
| `knowledgebases` | — | 知识库管理（Knowledge Base Key） |
| `knowledge/documents` | — | 文档管理 |
| `knowledge/chunks` | — | 分片管理 |
| `knowledge/metadata` | — | 元数据 |

### 认证与 Key 范围

| Key | 范围 |
| --- | --- |
| **App Key** | 单应用 |
| **Knowledge Base Key** | 账户下所有知识库 |

- 认证：`Authorization: Bearer {api_key}`
- 用 `user` 字段标识终端用户
- Key 仅后端使用，不要嵌入前端

## 模型类型

| 类型 | 用途 |
| --- | --- |
| System Reasoning Model（LLM） | 主推理 |
| Embedding Model | 向量化 |
| Rerank Model | 重排序 |
| Speech-to-Text | 语音转文字 |
| Text-to-Speech | 文字转语音 |

**接入**：Integrations > Model Provider 或 Marketplace；AI Credits + 自带 Key 双轨；Professional / Team 多 Key 负载均衡。

## 发布渠道

| 渠道 | 说明 |
| --- | --- |
| **Web App** | chatflow-webapp / workflow-webapp |
| **REST API** | Bearer Token |
| **MCP Server** | v1.16.0 升级到 MCP 2025-06-18 |
| **Marketplace** | 应用市场 |
| **difyctl CLI** | v1.15.0 推出 |

## 部署要求

| 项 | 要求 |
| --- | --- |
| CPU | ≥ 2 核 |
| 内存 | ≥ 4 GiB |
| Docker Compose | ≥ 2.24.0 |
| 服务 | 7 核心 + 7 依赖 |

## 版本演进里程碑

| 版本 | 发布 | 关键特性 |
| --- | --- | --- |
| **v1.13.0** | — | Human Input 节点（HITL） |
| **v1.14.x** | 2026-05 | 安全加固（租户隔离 / SECRET_KEY / LiteLLM CVE / 工具凭证） |
| **v1.15.0** | 2026-06-25 | difyctl CLI / Chain-of-Thought 可视化 / HITL 表单增强 / 慢模型轮询 |
| **v1.16.0** | 2026-07-17 | Dify Agent Beta（Linux 沙箱、Capability/Task 分离）/ MCP 协议升级 2025-06-18 / 安全修复（SQL 注入 / SSRF / 开放重定向） |

## 反模式速查

- Economical 索引上线后想要语义检索精度（不可互换）
- Hybrid Search 同时配 Weight Settings 与 Rerank（二选一）
- Hybrid 把 Semantic 或 Keyword 设为 1（退化为单路）
- 盲目缩小 chunk 求基准测试高分（生产上下文拼不上）
- Chatflow 中期待新版 Agent Beta 自动保留记忆（每条消息从零）
- Function Calling 配在不支持原生 FC 的模型上（必须切 ReAct）
- Agent 不设 Maximum Iterations（死循环）
- API Key 嵌入前端（Knowledge Base Key 泄露后果严重）
- 自托管升级直接覆盖 .env（必须对比 .env.example）
- 把「文档摘要未提及某特性」当「已废弃」

## 官方资源

- 文档总入口：[https://docs.dify.ai/en](https://docs.dify.ai/en)
- Core Concepts：[https://docs.dify.ai/en/learn/key-concepts](https://docs.dify.ai/en/learn/key-concepts)
- Workflow Nodes：[https://docs.dify.ai/en/self-host/use-dify/nodes](https://docs.dify.ai/en/self-host/use-dify/nodes)
  - LLM 节点：[/nodes/llm.md](https://docs.dify.ai/en/self-host/use-dify/nodes/llm.md)
  - Agent 节点：[/nodes/agent.md](https://docs.dify.ai/en/self-host/use-dify/nodes/agent.md)
- Knowledge Base：[https://docs.dify.ai/en/self-host/use-dify/knowledge/create-knowledge/setting-indexing-methods.md](https://docs.dify.ai/en/self-host/use-dify/knowledge/create-knowledge/setting-indexing-methods.md)
- API Reference：[https://docs.dify.ai/en/api-reference/guides/get-started.md](https://docs.dify.ai/en/api-reference/guides/get-started.md)
- Docker Compose 部署：[https://docs.dify.ai/en/self-host/deploy/quick-start/docker-compose.md](https://docs.dify.ai/en/self-host/deploy/quick-start/docker-compose.md)
- GitHub：[https://github.com/langgenius/dify](https://github.com/langgenius/dify)
- Releases：[https://github.com/langgenius/dify/releases](https://github.com/langgenius/dify/releases)
