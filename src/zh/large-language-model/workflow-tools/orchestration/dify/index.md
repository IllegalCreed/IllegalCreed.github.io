---
layout: doc
---

# Dify

Dify 是开源的 **AI 应用编排 / LLMOps 平台**（Apache 2.0），由 Langgenius 团队维护，用「可视化 Workflow / Chatflow + RAG 知识库 + Agent + 多 Provider 模型管理」把「Prompt 调用模型」这件事从一次性脚本升级成可运营、可观测、可发布的产品形态。它有四种核心应用类型——**Workflow**（一次性执行，Output 节点结束，支持 Trigger 触发）、**Chatflow**（每轮对话触发，必需 Answer 节点，支持 Memory 与对话变量）、**Agent**（含 v1.16.0 发布的新版 Beta Agent，运行在 Linux 沙箱，Capability / Task 分离）、以及 legacy 的 Chatbot / Text Generator；通过 Start / LLM / Knowledge Retrieval / Agent / Code / Template / IF-ELSE / Iteration / Parameter Extractor / Question Classifier / HTTP Request / Tool / Doc Extractor / Answer / Output / Human Input(v1.13.0+) 等节点编排，输出形态覆盖 Web App、REST API、MCP Server（v1.16.0 升级到 MCP 2025-06-18 协议）、Marketplace 与 difyctl CLI。RAG 引擎内置分段（General / Parent-child）、索引（High Quality 向量化 vs Economical 倒排索引，**二者创建后不可互换**）、检索（Vector / Full-Text / Hybrid / Inverted）、Rerank 与 Top K / Score Threshold 完整链路；模型层支持 System Reasoning / Embedding / Rerank / Speech-to-Text / Text-to-Speech 五类，AI Credits 与自带 API Key 双轨（Usage Priority 优先级可配），Professional / Team 还支持多 Key 负载均衡与限流回退。所有应用可导出为 **DSL（YAML）** 跨实例迁移，自托管首选 Docker Compose 一键部署，社区版（≥2 核 / ≥4 GiB），高合规需求选 Cloud 或 Enterprise（社区版沙箱非硬化安全边界）。当前稳定版 **v1.16.0（2026-07-17）**。

## 评价

**优点**

- **可视化 + 代码双重表达**：Workflow 节点拖拽即可编排，LLM / Code / Template / HTTP Request 节点又支持 Jinja2、Python、JS、cURL 全套表达力，从「无代码」到「低代码」平滑过渡
- **RAG 全栈开箱**：分段、索引、检索、Rerank、引用追踪一条龙；High Quality + Hybrid Search + Rerank 三件套生产可用，省去自建 LangChain + Weaviate + Reranker 的拼装成本
- **多 Provider 模型中立**：OpenAI / Anthropic / Google / 通义 / DeepSeek / 本地 Ollama 等几十家统一抽象，AI Credits 与自带 Key 双轨切换不重写应用
- **多形态输出**：Web App、REST API、MCP Server、Marketplace、difyctl CLI 全覆盖；Workflow 可被 Schedule / Webhook / Integration Trigger 自动触发，能当后端服务用
- **DSL / 迁移友好**：所有应用导出 YAML，跨实例 / 跨环境迁移、版本控制、团队协作都可落地
- **企业级能力**：Environment Variables 与 DSL 解耦存密钥、Conversation Variables 跨轮持久化、Human Input(v1.13.0+) 支持 Human-in-the-Loop 审批、新版 Beta Agent Linux 沙箱执行

**缺点**

- **RAG 索引不可逆**：High Quality 与 Economical 创建后**不可互相切换**，选错 Economical 上线后语义召回差就只能重建
- **Agent 不可控性高**：Function Calling / ReAct 策略对模型与工具描述高度敏感，不设 Maximum Iterations 易死循环；新版 Beta Agent 仍为单沙箱，未来版本才完全隔离
- **社区版安全边界有限**：沙箱非硬化，自托管需手动加固 SECRET_KEY、SSRF 代理、sandbox 隔离；高合规场景必须上 Cloud / Enterprise
- **Chatflow 中新版 Agent 不保留对话记忆**：官方明确「each message from scratch」，需要记忆要自行用 Conversation Variables 或外接记忆机制
- **跨版本升级需对比 .env.example**：跨版本常有新增 / 改名的环境变量，直接覆盖 .env 会启动异常；v1.14.x 还有 SECRET_KEY、内部指标端点等加固需手动启用
- **Hybrid 配置冲突陷阱**：Weight Settings 与 Rerank Model 文档明确「二选一」，同时配置不是增强而是冲突；Semantic=1 / Keyword=1 等于退化成单路检索

## 文档地址

- [Dify 官方文档总入口](https://docs.dify.ai/en)
- [Core Concepts（App / Workflow / Chatflow / Variables / DSL）](https://docs.dify.ai/en/learn/key-concepts)
- [Workflow Nodes（LLM / Agent / Knowledge Retrieval）](https://docs.dify.ai/en/self-host/use-dify/nodes)
- [Knowledge Base（分段 / 索引 / 检索）](https://docs.dify.ai/en/self-host/use-dify/knowledge/create-knowledge/setting-indexing-methods)
- [API Reference](https://docs.dify.ai/en/api-reference/guides/get-started)
- [Docker Compose 部署](https://docs.dify.ai/en/self-host/deploy/quick-start/docker-compose)

## GitHub地址

[langgenius/dify](https://github.com/langgenius/dify) · [Releases](https://github.com/langgenius/dify/releases)

## 幻灯片地址

<a href="/SlideStack/dify-slide/" target="_blank">Dify</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Dify 测试题</a>
