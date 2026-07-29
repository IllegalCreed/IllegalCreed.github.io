---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Dify 官方文档（docs.dify.ai）编写，对照 v1.16.0 稳定版（2026-07-17 发布）行为

## 速查

- **应用类型 4 种**：Workflow（一次性、Output 结束、支持 Trigger）/ Chatflow（每轮触发、必需 Answer 节点、Memory + 对话变量）/ Agent（v1.16.0 Beta，Linux 沙箱，Capability/Task 分离）/ legacy Chatbot · Text Generator
- **Start 节点两种**：User Input（可发布为 webapp / MCP server / backend API / Tool）与 Trigger（Schedule / Webhook / Integration）
- **RAG 索引**：High Quality（Embedding 向量化）vs Economical（倒排索引），**创建后不可互换**；Economical 只支持倒排检索
- **RAG 检索 4 种**：Vector / Full-Text / Hybrid / Inverted；**Top K 默认 3**、**Score Threshold 默认 0.5（仅 Rerank 阶段生效）**
- **Hybrid 二选一**：Weight Settings 与 Rerank Model **不可同时启用**；Semantic=1 或 Keyword=1 退化为单路
- **LLM 节点**：Temperature 0-1，Prompt 支持 `{{var}}` 与 Jinja2，Context 关联 Knowledge Retrieval 实现 RAG，Structured Output 支持 JSON Schema，Memory 仅 Chatflow 节点级
- **变量系统 4 种**：Inputs / Outputs / Environment Variables（与 DSL 解耦存密钥）/ Conversation Variables（仅 Chatflow 跨轮持久化）
- **系统变量**：`sys.user_id` / `sys.app_id` / `sys.workflow_id` / `sys.workflow_run_id` / `sys.timestamp`；Chatflow 额外 `sys.conversation_id` / `sys.dialogue_count`
- **DSL**：所有应用可导出 YAML 跨实例迁移 / 版本控制；密钥应放 Environment Variables
- **REST API**：Base URL 云端 `https://api.dify.ai/v1`，Bearer Token 认证；App Key 单应用范围、Knowledge Base Key 全知识库范围；用 `user` 字段标识终端用户
- **Agent 策略**：Function Calling（须模型原生 FC 支持）vs ReAct（Thought→Action→Observation 提示工程，适用无 FC 模型）
- **部署**：Docker Compose（≥2 核 / ≥4 GiB、Docker Compose 2.24.0+），生产改 SECRET_KEY、配 SSRF 代理与 sandbox 隔离
- **关键端点**：`/info`、`/chat-messages`、`/workflows/run`、`/completion-messages`、`/agents/chat`、knowledge documents / chunks / metadata 系列、`/workflow-runs`

## Dify 是什么

Dify 是开源 AI 应用编排 / LLMOps 平台（Apache 2.0），把「调用 LLM、做 RAG、跑 Agent、连工具、对外发 API」封装成可视化 Workflow + 多租户运营 + 多 Provider 模型管理。它的核心定位有三：

- **应用编排器**：Workflow / Chatflow / Agent 可视化节点编排，从「Prompt 脚本」升级为「可运营产品」
- **LLMOps 平台**：模型管理、知识库、调用监控、版本控制、密钥管理、可观测性（Langfuse / LangSmith / Arize / Phoenix 等）
- **多形态发布**：Web App、REST API、MCP Server、Marketplace、difyctl CLI，从本地调试到对外服务全链路

> Dify ≠ 底层 LLM。它编排模型调用、RAG、Agent、工具，但本身不训练模型；向量库依赖 Weaviate / 外接、关系库依赖 PostgreSQL、缓存依赖 Redis（自托管默认 docker-compose 全家桶）。

## 应用类型与差异

| 类型 | 触发模式 | 结束节点 | Memory | 对话变量 | 典型场景 |
| --- | --- | --- | --- | --- | --- |
| **Workflow** | 一次性 / Trigger 自动触发 | Output | 无 | 无 | 批处理、定时、Webhook、文档解析 |
| **Chatflow** | 每轮对话触发 | Answer（必需） | 有（节点级） | 有 | 多轮对话、客服、Agent 对话 |
| **Agent（Beta v1.16.0）** | Workflow Agent 节点 / 独立 chat | 默认 text/files/json | 无（each message from scratch） | 通过 Capability 配 | 复杂研究、工具编排 |
| **Chatbot（legacy）** | chat 模式 | — | 有 | — | 旧版多轮对话 |
| **Text Generator（legacy）** | completion 模式 | — | 无 | — | 旧版一次性生成 |

> **选错会导致**：Chatflow 无对话上下文、Workflow 无法被定时触发、Chatflow 中期待新版 Agent 自动保留记忆却「每条消息从零开始」。选型第一问：是否多轮？多轮 → Chatflow；批处理 / 触发 → Workflow。

## Start 节点两种模式

| 模式 | 用途 | 可发布形态 |
| --- | --- | --- |
| **User Input** | 用户主动发起 | webapp / MCP server / backend API / Tool |
| **Trigger** | 自动触发 | Schedule Trigger（定时）/ Webhook Trigger / Integration Trigger |

> 只有 User Input 模式才能发布为 webapp / MCP server / backend API / Tool；要定时跑数据清洗 / Webhook 接 GitHub PR / Integration 接外部系统，必须用 Workflow + Trigger。

## 节点速览

| 节点 | 作用 |
| --- | --- |
| **Start** | 入口，定义 Inputs / 触发方式 |
| **LLM** | 调模型，Prompt 支持 `{{var}}` / Jinja2，Context 关联 RAG，Structured Output |
| **Knowledge Retrieval** | RAG 检索，关联知识库与查询变量 |
| **Agent** | Function Calling / ReAct，配工具与 Maximum Iterations |
| **Code** | Python / JS 沙箱执行 |
| **Template（Jinja2）** | 模板渲染 |
| **IF/ELSE** | 条件路由 |
| **Iteration** | 数组遍历，支持 Parallel Mode（最大并行度 10） |
| **Loop** | 循环 |
| **Parameter Extractor** | 抽结构化参数 |
| **Question Classifier** | 问题分类 |
| **Variable Aggregator / Assigner** | 变量合并 / 赋值 |
| **HTTP Request** | 调外部 API |
| **Tool** | 调内置 / 自定义工具 |
| **Doc Extractor** | 文档解析 |
| **List Operator** | 列表操作 |
| **Answer（Chatflow 必需）** | 对话回复 |
| **Output（Workflow 必需）** | 输出结果 |
| **Human Input（v1.13.0+）** | Human-in-the-Loop，工作流暂停 / 恢复 / 审批 |
| **Trigger** | Schedule / Webhook / Integration 自动触发 |

## 变量系统

| 类型 | 范围 | 典型用途 |
| --- | --- | --- |
| **Inputs** | Start 节点设定 | 用户输入参数 |
| **Outputs** | 节点产出供下游引用 | 节点间数据传递 |
| **Environment Variables** | 应用级常量、与 DSL 解耦 | 存 API Key / Secret |
| **Conversation Variables** | 仅 Chatflow，跨轮持久化 | todo 列表、token 计数、上下文累计 |

> **系统变量**：Workflow 提供 `sys.user_id` / `sys.app_id` / `sys.workflow_id` / `sys.workflow_run_id` / `sys.timestamp`；Chatflow 额外含 `sys.conversation_id` / `sys.dialogue_count`。引用方式：dropdown 选择或输入 `/` 触发选择器。

## 模型管理

**模型类型 5 种**：

| 类型 | 用途 |
| --- | --- |
| **System Reasoning Model（LLM）** | 主推理 |
| **Embedding Model** | 向量化（RAG High Quality） |
| **Rerank Model** | 重排序（RAG 提精度） |
| **Speech-to-Text** | 语音转文字 |
| **Text-to-Speech** | 文字转语音 |

**接入方式**：Integrations > Model Provider 或 Marketplace；支持 **AI Credits** 与**自带 API Key** 双轨（Usage Priority 配置优先级），Professional / Team 支持多 Key 负载均衡与限流回退。

> 注意：**GPT-5.6 兼容性**需将 API 类型从 Chat Completions 切到 Responses。

## 发布渠道

| 渠道 | 用途 |
| --- | --- |
| **Web App** | chatflow-webapp / workflow-webapp，可嵌入网站 |
| **REST API** | Bearer Token 认证，App Key / Knowledge Base Key |
| **MCP Server** | v1.16.0 升级到 MCP 2025-06-18 协议（版本协商 + 结构化工具输出） |
| **Marketplace** | 发布到应用市场 |
| **difyctl CLI** | 命令行调用（v1.15.0 推出） |

## 自托管速跑（Docker Compose）

```bash
# 克隆仓库
git clone https://github.com/langgenius/dify.git
cd dify/docker

# 复制环境变量
cp .env.example .env

# 启动全家桶（含 Weaviate / PostgreSQL / Redis / sandbox 等）
docker compose up -d

# 访问 http://localhost/apps
```

**最低配置**：≥2 核 CPU、≥4 GiB 内存、Docker Compose 2.24.0+。生产场景务必改 `SECRET_KEY`（v1.14.1 已加固，不再依赖默认值）、配置 SSRF 代理与 sandbox 隔离。

> 社区版沙箱**非硬化安全边界**，高合规需求选 Cloud 或 Enterprise。

## REST API 速跑

```bash
# Workflow 执行（streaming 模式）
curl -X POST 'https://api.dify.ai/v1/workflows/run' \
  -H 'Authorization: Bearer {api_key}' \
  -H 'Content-Type: application/json' \
  -d '{
    "inputs": {"query": "Dify 是什么"},
    "response_mode": "streaming",
    "user": "user-123"
  }'

# Chatflow 对话
curl -X POST 'https://api.dify.ai/v1/chat-messages' \
  -H 'Authorization: Bearer {api_key}' \
  -H 'Content-Type: application/json' \
  -d '{
    "inputs": {},
    "query": "你好",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "user-123"
  }'

# 应用元信息
curl 'https://api.dify.ai/v1/info' \
  -H 'Authorization: Bearer {api_key}'
```

> `user` 字段标识终端用户（不为每用户发 Key）；自托管把 `https://api.dify.ai/v1` 换成本机 URL。

## 下一步

- [核心概念与 Workflow 编排](./guide-line.md)：应用类型差异、节点深度、Agent 策略、变量系统、API 端点、反模式
- [参考](./reference.md)：节点速查表、API 端点清单、版本演进、官方资源
