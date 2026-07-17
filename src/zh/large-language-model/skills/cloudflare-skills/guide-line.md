---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 cloudflare/skills 官方仓库的 README 与各 skills/SKILL.md 编写。

## 速查

- **总技能 `cloudflare`**：决策树选产品（跑代码 / 存数据 / AI / 网络 / 安全 / IaC），检索优先
- **`workers-best-practices`**：反模式清单（悬空 Promise、全局请求态、`Math.random()` 做密钥、`ctx` 解构、手写 `Env`、`await response.text()` 无界数据）
- **`agents-sdk`**：`Agent` 类 + `setState` + `@callable` RPC + `schedule` + `AIChatAgent` + `McpAgent`；别开 `experimentalDecorators`
- **`durable-objects`**：一个协调原子一个 DO、`getByName()` 确定性路由、SQLite 存储、`blockConcurrencyWhile` 只用于初始化、一 DO 一 alarm
- **`sandbox-sdk`**：`getSandbox()` + `exec()` / `runCode()`；容器懒启动、必须 `export { Sandbox }`
- **`web-perf`**：用 Chrome DevTools MCP 测 LCP/INP/CLS + 渲染阻塞 + 网络链
- **`cloudflare-one`**：Zero Trust/SASE 评估先行（Access 授权 vs Gateway 流量）、默认拒绝、分屏隧道模式
- **`turnstile-spin`**：端到端接 Turnstile，服务端 siteverify，绝不在浏览器验
- **覆盖**：Workers/Pages · KV/D1/R2 · Workers AI/Vectorize/Agents SDK · WAF/DDoS/Turnstile · Terraform/Pulumi
- **命令**：`/cloudflare:build-agent`、`/cloudflare:build-mcp`

## cloudflare：总平台技能 + 决策树

`cloudflare` 是综合技能，先用**决策树**帮你从需求定位到正确产品，再加载详细 reference。核心几棵树：

- **要跑代码**：边缘无状态函数 → Workers；全栈 Git 部署 → Pages；有状态协调/实时 → Durable Objects；长时多步任务 → Workflows；跑容器 → Containers；定时任务 → Cron Triggers
- **要存数据**：键值（配置/会话/缓存）→ KV；关系型 SQL → D1（SQLite）或 Hyperdrive（既有 Postgres/MySQL）；对象/文件（S3 兼容）→ R2；消息队列 → Queues；向量嵌入 → Vectorize
- **要 AI**：跑推理 → Workers AI；RAG/搜索向量库 → Vectorize；建有状态 agent → Agents SDK；任意 AI 供应商网关 → AI Gateway
- **要安全**：Web 应用防火墙 → WAF；DDoS 防护 → DDoS；Bot 管理 → Bot Management；CAPTCHA 替代 → Turnstile
- **要 IaC**：Pulumi / Terraform / REST API

它也反复强调：引用限额、API 签名、配置项前先取**最新**信息（`cloudflare-docs` 搜索、`developers.cloudflare.com`、`@cloudflare/workers-types`、`wrangler/config-schema.json`、changelog），**docs 与 reference 冲突时信 docs**。

## workers-best-practices：把反模式清单化

这是「Workers 代码评审器」。它把生产最佳实践和常见反模式列成表，评审时逐条对照：

| 反模式 | 为什么危险 |
| --- | --- |
| 对无界数据 `await response.text()` | 内存耗尽——Worker 有 128 MB 限制，大流量要流式处理 |
| 源码 / 配置里硬编码密钥 | 随版本库泄露；应 `wrangler secret put` |
| 用 `Math.random()` 生成 token/ID | 可预测、非密码学安全；应 `crypto.randomUUID()` / `getRandomValues()` |
| 裸 `fetch()` 不 `await` 也不 `waitUntil` | 悬空 Promise——结果丢失、错误被吞 |
| 模块级可变变量存请求态 | 跨请求数据泄露、状态陈旧、I/O 错误 |
| Worker 内调 Cloudflare REST API | 多余网络跳、鉴权开销、增延迟；应用 in-process 绑定 |
| 解构 `ctx`（`const { waitUntil } = ctx`） | 丢 `this` 绑定，运行时抛 Illegal invocation |
| 手写 `Env` 接口 | 与真实 wrangler 绑定漂移；应 `wrangler types` 生成 |
| 平台基类用 `implements` 而非 `extends` | 遗留写法，丢 `this.ctx` / `this.env` |

配置侧的硬规则：`compatibility_date` 设成今天、开 `nodejs_compat`、`wrangler types` 生成绑定类型、开 `observability` 结构化日志、密钥用 `wrangler secret put`。

## agents-sdk：有状态 AI agent

`agents-sdk` 教你用 Agents SDK 在 Workers 上建 agent。核心是 `Agent` 类——SQLite 持久化状态、`setState` 自动同步到客户端、`@callable()` RPC、`schedule()`/`scheduleEvery()` 调度、`AgentWorkflow` 持久多步任务：

```typescript
import { Agent, routeAgentRequest, callable } from "agents";

export class Counter extends Agent<Env, { count: number }> {
  initialState = { count: 0 };

  @callable()
  increment() {
    this.setState({ count: this.state.count + 1 });
    return this.state.count;
  }
}

export default {
  fetch: (req, env) => routeAgentRequest(req, env) ?? new Response("Not found", { status: 404 }),
};
```

聊天类用 `AIChatAgent`（流式、工具、消息持久化 + 可恢复流），MCP server 用 `McpAgent`，React 侧用 `useAgent` / `useAgentChat` hooks。关键坑：**不要在 tsconfig 开 `experimentalDecorators`**（会破坏 `@callable`）；每个 agent 类需要独立的 DO 绑定 + migration；**永远不改旧 migration，只加新 tag**。命令 `/cloudflare:build-agent` 走完整脚手架。

## durable-objects：有状态协调

`durable-objects` 用于聊天室、多人游戏、预订系统这类需要**协调**和**强一致**的场景。关键规则：

- **围绕协调原子建模**：一个聊天室 / 游戏 / 用户一个 DO，别用一个全局 DO 扛所有请求
- **`getByName()` 确定性路由**：同一输入永远命中同一 DO 实例
- **用 SQLite 存储**：migration 配 `new_sqlite_classes`；`this.ctx.storage.sql.exec(...)` 同步查询
- **`blockConcurrencyWhile()` 只用于构造器里的初始化**（建表），别在每个请求里用（杀吞吐）
- **先持久化再更新内存**：崩溃/驱逐后内存态会丢
- **一个 DO 一个 alarm**：`setAlarm()` 会替换已有 alarm

反模式：单个全局 DO 扛全部请求（瓶颈）、只把关键态存内存、在相关写之间插 `await` 破坏原子性、`blockConcurrencyWhile()` 里跨 `fetch()` 或外部 I/O。命令 `/cloudflare:build-mcp` 也依赖 DO（`McpAgent` 底层是 DO）。

## sandbox-sdk：安全代码执行

`sandbox-sdk` 用于让 AI 安全执行代码、代码解释器、CI/CD、交互式开发环境。用 `getSandbox(env.Sandbox, 'user-123')` 拿沙箱，`exec()` 跑 shell 命令、`runCode()` 跑 LLM 生成的代码（富输出 + 状态持久）：

```typescript
const sandbox = getSandbox(env.Sandbox, "user-123");
const result = await sandbox.exec("python --version");
// { stdout, stderr, exitCode, success }
```

配置要点：`wrangler.jsonc` 里 `containers` + `durable_objects` + `migrations` 三段配齐，Worker 入口**必须** `export { Sandbox } from '@cloudflare/sandbox'`（不导出就部署不了）。容器懒启动（首次操作才起）、10 分钟无活动休眠、`destroy()` 立即释放。多用户别硬编码 sandbox ID，用用户/会话标识。

## web-perf：Core Web Vitals 审计

`web-perf` 用 **Chrome DevTools MCP** 测页面性能：`navigate_page` 打开页面、`performance_start_trace` 录制、`performance_analyze_insight` 提取 LCP/CLS/渲染阻塞/网络依赖等 insight。它给出 good/needs-improvement/poor 阈值（LCP < 2.5s、INP < 200ms、CLS < 0.1 等），并要求**量化影响**（「把 hero.png 450KB 转 WebP」而非「优化图片」）、**先验证再建议**（确认某资源确实未用再建议删）。前提是先确认 chrome-devtools MCP 已配置。

## cloudflare-one：Zero Trust 与 SASE

`cloudflare-one` 面向企业 Zero Trust/SASE 运维，覆盖 Access、Gateway、WARP、Tunnel、Magic WAN、DLP、CASB、设备 posture、身份。它是**评估先行**的：先分类需求（架构 / 配置 / 排障 / 迁移 / 评审），收集上下文（站点、用户、IdP、流量路径、合规约束、爆炸半径），再只检索涉及产品的当前 docs。核心护栏：

- **Access 管应用授权，Gateway 管流量检查/过滤**——跨身份感知的应用访问 + 网络安全时两者都用
- **Access 策略默认拒绝**：私有应用有路由但没 Allow 策略，仍然拒绝
- **分屏隧道（split tunnel）模式**是影响最大的客户端设置：VPN 替代用 Include，SWG 用 Exclude
- 群组策略依赖 IdP 群组声明或 SCIM，没同步就别编群组选择器

配套的 `cloudflare-one-migrations` 专做从 Zscaler、Palo Alto、传统 VPN/SWG、SASE 迁移到 Cloudflare One 的评估、策略映射、上线计划与差距分析。

## turnstile-spin：端到端接入 CAPTCHA

`turnstile-spin` 把「给表单加 Turnstile」变成端到端流程：扫代码库 → 建 widget（`wrangler turnstile widget create` 或 API）→ 嵌到表单 → 在既有后端接**规范的服务端 siteverify** → 真实验证一遍再报成功。铁律：**绝不在浏览器调 siteverify**，永远是 浏览器 → 你的后端 → siteverify；密钥只写进用户自己的 env/secret store，绝不硬编码；只做「gate（拦截），不替换」——既有提交逻辑不动，只在前面加一步 `success === true` 校验。

## 平台覆盖面

Cloudflare Skills 横跨整个开发者平台：

- **计算/运行时**：Workers、Pages、Durable Objects、Workflows、Containers、Cron Triggers
- **存储**：KV（键值）、D1（SQLite）、R2（对象存储，S3 兼容）、Queues（队列）、Hyperdrive（加速既有 DB）、Vectorize（向量）
- **AI**：Workers AI（推理）、Vectorize（RAG）、Agents SDK（有状态 agent）、AI Gateway（多供应商网关）
- **安全**：WAF、DDoS、Bot Management、API Shield、Turnstile
- **IaC**：Terraform、Pulumi、REST API
- **Zero Trust**：Access、Gateway、WARP、Tunnel、Magic WAN、DLP、CASB

## 反模式（各技能共性）

- **凭预训练知识写 API/限额**：Cloudflare 演进快，必须检索最新 docs（这是全系列的第一原则）
- **Workers**：悬空 Promise、全局请求态、`Math.random()` 做密钥、解构 `ctx`、手写 `Env`、无界数据 `await response.text()`
- **Durable Objects**：单个全局 DO 扛所有请求、每请求 `blockConcurrencyWhile`、关键态只存内存
- **Agents SDK**：开 `experimentalDecorators`、改旧 migration
- **Sandbox**：漏掉 `export { Sandbox }`、多用户硬编码 sandbox ID
- **Turnstile**：在浏览器端调 siteverify、硬编码密钥

## 下一步

- [参考](./reference) —— 技能清单 + 命令 + MCP server + 平台覆盖 + 安装 + 许可 + 链接
- 上游：[Cloudflare Agents 文档](https://developers.cloudflare.com/agents/)
