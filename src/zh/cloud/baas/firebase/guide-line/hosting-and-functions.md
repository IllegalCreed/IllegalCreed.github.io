---
layout: doc
outline: [2, 3]
---

# Hosting、Cloud Functions 与 AI Logic：交付层与运行时

> 基于 Firebase · 核于 2026-08

## 速查

- **Hosting**：全球 CDN 静态托管 + 自动 HTTPS + 自动构建（CLI 一键部署）。支持**多 rewrite**——把 `/api/**` 转发到 Cloud Functions/Cloud Run、把 SPA 未命中路由回退到 `index.html`，单域名搞定前后端。
- **多站点**：一个 Firebase 项目可托管**多个站点**（主站/预览/营销页），各自独立域名与 CDN 配置，共享后端。
- **预览频道**：每次部署可生成**预览 URL**（带随机子域），供 QA/PM 验收，验收通过再提升为正式频道。
- **Cloud Functions**：**事件驱动无服务器函数**。触发源：Firestore 写入、Auth 用户增删、Hosting 请求、Storage 变更、Pub/Sub 计划任务、HTTP 直连。**二代（Gen 2）** 基于 Cloud Run，并发 1000，启动更快。
- **运行时**：Node.js（主力）/ Python / Go。冷启动是函数最大痛点（Node 约 1-3 秒首次），二代与 min-instances（保活实例）能缓解。
- **函数与数据库联动**：典型用法——Firestore 写入触发函数做副作用（发邮件、维护聚合字段、调用第三方 API），把"业务后端逻辑"挂在数据流上。
- **Realtime Database**：Firebase 起家的**低延迟 JSON 树**数据库，仍是实时棋盘/多端聊天的首选。比 Firestore 更快、更便宜（按存储/带宽而非操作计费），但查询/扩展性弱，新项目官方推荐 Firestore。
- **Genkit**：Google 开源的**LLM 应用框架**（与厂商无关，支持 Gemini/OpenAI/Anthropic/本地模型）。把"提示词/检索/工具调用/评估"组织成**可部署流程**，部署到 Cloud Functions 或 Cloud Run。
- **AI Logic**：Firebase 控制台内置的 Genkit 集成，让 Firebase 项目**一键接入 Gemini** + RAG（向量检索用 Firestore + pgvector-style 或 Vertex AI Matching Engine）。
- **典型架构**：Hosting（前端）+ rewrite /api → Cloud Functions（后端）+ Firestore（数据）+ Cloud Storage（文件）+ FCM（推送）+ GA4/Crashlytics（监控），全套在一个 Firebase 项目。

## 一、Hosting：全球 CDN 与多站点回退

Firebase Hosting 把静态站点的部署/CDN/HTTPS/路由全托管：

```bash
firebase deploy --only hosting   # 一行命令部署到全球 CDN
```

- **全球 CDN + 自动 HTTPS**：托管后自动签 SSL（Let's Encrypt/Google 管理），CDN 节点全球分布，静态资源就近返回。
- **多 rewrite（关键能力）**：在 `firebase.json` 配置路由，把**不同路径**分发到不同后端：

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      { "source": "/api/**", "function": "apiHandler" },
      { "source": "/api/v2/**", "run": { "serviceId": "api-v2" } },
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      { "source": "**/*.@(js|css)", "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }] }
    ]
  }
}
```

  - `/api/**` → Cloud Function（动态后端）
  - `/api/v2/**` → Cloud Run 容器（长连接/重负载）
  - 其他 → `index.html`（SPA 路由回退）

  **单域名搞定前后端**——前端无需配 CORS（同源），用户体验与 SEO 都受益。

- **多站点**：一个项目挂多个 Hosting 站点（`firebase target:apply hosting main <id>` / `preview <id>`），主站、预览站、营销页分离部署。
- **预览频道**：`firebase hosting:channel:deploy preview-x` 生成临时预览 URL，PM 验收后 `firebase hosting:clone preview-x live` 提升为正式，发布流程闭环。

Hosting 是 SPA/PWA/静态站部署到 Firebase 的标准入口，配合 Functions rewrite 替代传统"前端 + Node 后端 + Nginx"。

## 二、Cloud Functions：事件驱动无服务器

Cloud Functions 是 Firebase 的**无服务器后端**，由事件触发执行：

| 触发类型 | 何时执行 | 典型用法 |
| --- | --- | --- |
| **HTTP** | 收到 HTTP 请求（Webhook/REST） | 自建 API、第三方回调 |
| **Callable** | 客户端 SDK 调用（带 Token） | 需鉴权的业务接口 |
| **Firestore 触发** | 文档 onCreate/onUpdate/onDelete | 维护聚合字段、发通知 |
| **Auth 触发** | 用户 onCreate/onDelete | 注册发欢迎邮件、清理数据 |
| **Storage 触发** | 文件上传/删除 | 图片压缩、视频转码 |
| **Pub/Sub** | 定时（cron）/消息 | 周报、清理过期数据 |
| **Analytics 触发** | 用户事件转换 | 自动埋点后做营销 |

```js
// 二代函数：Firestore 文档创建触发，发欢迎邮件
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const onUserCreated = onDocumentCreated(
  "users/{uid}",
  (event) => {
    const user = event.data?.data();
    return sendWelcomeEmail(user.email);
  },
);
```

- **一代 vs 二代（Gen 2）**：二代基于 **Cloud Run**，单实例并发 1000（一代 1）、支持 min-instances（保活零冷启动）、更长超时（60 分钟）、更细流量控制。**新项目应一律用二代**。
- **冷启动**：无服务器最大痛点。Node 函数首次调用约 1-3 秒（Python/Go 更慢）。缓解：用 **min-instances** 保留最低实例数（计费增加）、减少依赖（懒加载）、选 Node（启动最快）。
- **运行时**：Node.js（主力，最新 LTS）/ Python / Go。前端栈团队最熟悉 Node，是 Firebase 函数的事实首选。
- **超时与限制**：HTTP 函数默认 60 秒（最大 60 分钟二代），内存 128MB-32GB，单函数可配并发与实例上限（防雪崩）。

**典型联动**：Firestore 写入 → 触发函数 → 维护冗余字段（如帖子评论数）+ 发推送（FCM）+ 调用第三方 API（支付/邮件）。这是"前端直连数据库 + 函数兜底业务逻辑"的标准模式。

## 三、Realtime Database：JSON 树实时

Realtime Database 是 Firebase 的**起家产品**（2011），仍是低延迟实时场景的首选：

- **JSON 树**：数据是一棵大 JSON 树（不是文档集合），节点路径即"表"。如 `/rooms/room1/messages/msg1`。
- **更低延迟**：比 Firestore 更快（同区域亚秒级同步），适合棋盘、多端聊天、协作画板等强实时。
- **更便宜**：按**存储 + 带宽**计费（不是按操作），高频小写场景成本远低于 Firestore。
- **查询/扩展性弱**：查询需预先建索引且能力有限（排序/过滤受限）；单数据库 1GB（Spark）/ 区域级（不像 Firestore 多区域复制）；新项目官方推荐 Firestore。

**选型**：要复杂查询/多区域/扩展 → **Firestore**；要极致低延迟实时 + 简单数据 → **Realtime DB**（也可两者混用：Realtime 做聊天、Firestore 做业务数据）。

## 四、AI Logic / Genkit：把 LLM 编进应用

Firebase 走向 AI 应用的官方路径是 **Genkit**——Google 开源的 LLM 应用框架：

- **厂商无关**：支持 **Gemini**（Google 官方）/ OpenAI / Anthropic / 本地模型（Ollama），不锁 Google。
- **流程（Flow）**：把"提示词 + 检索 + 工具调用 + 输出"组织成**可部署流程**。一个 Flow 是 `defineFlow("summarize", async (input) => { ... })`，可本地调试 + 部署到 Cloud Functions。
- **检索（Dotprompt + RAG）**：Dotprompt 用模板描述提示词与模型参数；检索支持 Firestore + 向量（用 Firestore 的 vector 字段）或 Vertex AI Matching Engine。
- **工具调用（Tools）**：函数让 LLM 调用外部 API（查订单、发邮件），实现 Agent 行为。
- **评估（Evaluation）**：内置评估框架，跑一批测试用例看 LLM 输出质量，CI 友好。
- **部署**：Genkit Flow 编译成 Cloud Functions（HTTP/Callable），前端 SDK 调用，监控走 Firebase 控制台。

**AI Logic** 是 Firebase 控制台内置的 Genkit 一键集成——给 Firebase 项目加 Gemini key、配 RAG 数据源、生成可调用函数。这让 Firebase 项目从"传统 BaaS"扩展到"AI 应用后端"，是 Firebase 应对 Vercel AI SDK / Supabase + LangChain 的回答。

## 五、典型全栈架构

一个标准 Firebase 全栈应用的组件协作：

```
                用户浏览器 / 移动端
                       │  (Firebase SDK)
        ┌──────────────┼──────────────┐
        │              │              │
   Hosting (CDN)   Firestore     Cloud Storage
   静态前端 +      NoSQL 数据 +    文件上传 +
   /api rewrite    Security Rules  RLS-style 策略
   → Functions     (数据层控权)
        │              │
        ▼              ▼
   Cloud Functions (事件触发：写库/登录/Webhook)
        │
        ├── FCM (推送) ──► 移动端通知
        ├── GA4 / Crashlytics (分析/监控)
        └── Genkit Flow (LLM 调用) ──► Gemini / 第三方模型
```

**部署流**：`firebase deploy` 一行命令同时部署 Hosting/Functions/Rules/Indexes/Storage Rules——所有产物在一个项目里版本对齐，这是 Firebase 区别于拼装式云（AWS 三件套）的核心优势。

## 下一步

Firebase 全栈讲完后，可对照阅读本站 [Supabase](../../supabase/) 叶（关系型 Postgres 路线、开源可自托管）与[参考](./../reference)（产品矩阵大表、Firestore vs Realtime DB、与 Supabase 取舍、定价、易错点）。
