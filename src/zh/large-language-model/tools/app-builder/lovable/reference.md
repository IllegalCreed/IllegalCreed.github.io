---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 docs.lovable.dev 2025–2026 现状编写。金额 / 额度 / 模型清单变动频繁，**采集于 2026-06-18，一切以官方页面实时为准**。完整文档见 [docs.lovable.dev](https://docs.lovable.dev/)。

## 默认技术栈

| 层级 | 默认技术 | 来源 |
| --- | --- | --- |
| 前端框架 | React | 官方核心技术 |
| 构建工具 | Vite | 生成产物（业界一致） |
| 语言 | TypeScript | 生成产物 |
| 样式 | Tailwind CSS | 官方核心技术 |
| 组件库 | shadcn/ui | 生成产物 |
| 后端 | Lovable Cloud / Supabase | 官方核心后端 |

## 工作模式

| 模式 | 作用 | 计费 |
| --- | --- | --- |
| Build Mode | 直接构建 / 迭代应用 | 按复杂度 0.5 ~ 2 credit / 条 |
| Plan Mode | 先规划再动手 | 固定 1 credit / 条 |
| Code Mode | 面向代码的精细操作 | 按消息计 |

## 可视化编辑（Preview Toolbar）

| 交互 | 作用 | 计费 |
| --- | --- | --- |
| Edit Text Inline | 行内原地改文字 | 免费，每用户每天 ≤100 次 |
| Select Elements | 点选元素 + 自然语言改样式 | 按 chat 计 credit |
| Draw Annotation | 预览上手绘标注 | 计 credit |

## Lovable Cloud 五件套

| 能力 | 说明 |
| --- | --- |
| 数据库 | 自动生成 schema，UI 直接增删改，无需写 SQL |
| 认证 | 邮箱 / 手机 / Google 登录，自动生成登录注册页 |
| 存储 | 文件上传 / 管理，存项目 bucket |
| Edge Functions | Serverless 自定义逻辑 / API |
| AI | 内建模型（见下表） |

发布日期：2025-09-29。基座：Supabase 开源。默认状态：workspace 默认开启。

## Lovable AI 模型速查

> 采集于 2026-06-18，清单 / 默认 / 价格随时变，以官方为准。

| 系列 | 代表模型 | 备注 |
| --- | --- | --- |
| Google Gemini（默认） | Gemini 3 Flash (preview)、3.5 Flash、3.1 Pro Preview、2.5 Pro/Flash | 发布之初仅 Gemini |
| OpenAI GPT（后扩） | GPT-5.5 Pro / 5.4 Pro、GPT-5 Mini/Nano、GPT Image 2 | 后续扩充 |
| Embedding | 语义搜索 / RAG | — |

计费：按 Run credits（按 token 量扣）；免费工作区每月有 AI grant。安全：AI 调用强制走 server-side Edge Function，凭据留服务端。

## 计划与价格（四档）

| 计划 | 价格（约，月付） | 年付（约） | 关键点 |
| --- | --- | --- | --- |
| Free | $0 | — | 每天 5 credit、每月封顶 30；Cloud grant 20 / 月、AI grant 4 / 月 |
| Pro | ~$25 / 月 | ~$21 / 月（~$250/年） | 100 credit 档；每日 5 credit 可累积；top-up $0.30 / credit |
| Business（原 Teams） | ~$50 / 月 | ~$42 / 月 | SSO、data opt-out；top-up $0.60 / credit |
| Enterprise | 定制报价 | — | SCIM、审计日志、发布控制、SSO、专属支持 |

## credit 计费示例

| 示例消息 | 约耗 credit |
| --- | --- |
| Make the button gray | 0.50 |
| Remove the footer | 0.90 |
| Add authentication | 1.20 |
| Build a landing page with images | 2.00 |
| Plan Mode 任意一条 | 1.00 |

## credit 过期规则

| 类型 | 过期时间 |
| --- | --- |
| 月付方案 credit | 发放后 2 个月 |
| 年付方案 credit | 年度结束后 1 个月 |
| top-up credit | 自购买起 12 个月 |
| 每日 build credit | 当天清零 |
| 专项 grant（Cloud / AI） | 不滚存 |

## 集成核对

| 集成 | 状态 | 说明 |
| --- | --- | --- |
| Supabase | 官方专页 | 后端 / Cloud 底座 |
| Stripe | 官方专页 | 支付 / 计费 |
| GitHub | 官方专页 | 版本控制（双向同步） |
| GitLab | 官方专页 | 版本控制（双向同步） |
| Resend | 官方专页 | 邮件 |
| Figma | 非连接器 | 支持「导入设计 / 资产」，并非连接器 |
| Clerk | 非内置 | 认证默认走 Cloud / Supabase Auth；Clerk 仅可选第三方 |

## 集成类型

| 类型 | 范围 | 进部署产物 |
| --- | --- | --- |
| App Connectors（生产） | workspace 级，部署后 app 可调用 | 是 |
| Chat Connectors / MCP（开发期） | 构建时给上下文，仅本人可见 | 否 |
| 自定义 API | 密钥存 Cloud secret，只经 Edge Functions 访问 | 是 |

## 安全要点

| 风险 | 正确做法 |
| --- | --- |
| 前端硬编码密钥（`const API_KEY = "sk-..."`） | 密钥存后端，只经 Edge Functions 访问，绝不进浏览器代码 |
| RLS 未开 → 越权读数据 | 发布前所有敏感表必须开 RLS；有真实数据前改更省事 |
| 平台侧防护 | 发布前自动安全扫描、Sensitive Data Scanning、Security Center、Aikido / Wiz 集成 |

## 与 Bolt.new / v0 对比

| 维度 | Lovable | Bolt.new | v0 (Vercel) |
| --- | --- | --- | --- |
| 范围 | 全栈 | 全栈（WebContainer） | 仅前端 UI 组件 |
| 默认栈 | React + Supabase | Node + Bolt Database | React 组件 |
| 后端 / DB | 自动供给 | 自动供给 | 需自带 |
| 可视化编辑 | 点选 + 行内（部分免费） | 改代码 / prompt | 改代码 / prompt |
| GitHub | 双向同步 + 代码所有权 | 有 | 手动并入 |
| 安全 | 发布前扫描 + RLS 清单 | — | — |

## 资源链接

| 资源 | 链接 |
| --- | --- |
| 官方文档 | [docs.lovable.dev](https://docs.lovable.dev/) |
| 定价页 | [lovable.dev/pricing](https://lovable.dev/pricing) |
| 计划与额度 | [plans-and-credits](https://docs.lovable.dev/introduction/plans-and-credits) |
| Lovable Cloud | [integrations/cloud](https://docs.lovable.dev/integrations/cloud) |
| Lovable AI | [integrations/ai](https://docs.lovable.dev/integrations/ai) |
| GitHub 集成 | [integrations/github](https://docs.lovable.dev/integrations/github) |
| Preview Toolbar | [features/preview-toolbar](https://docs.lovable.dev/features/preview-toolbar) |
| 安全实践 | [security-best-practices](https://docs.lovable.dev/tips-tricks/security-best-practices) |
| 与 Bolt / v0 对比 | [lovable-vs-bolt-vs-v0](https://lovable.dev/guides/lovable-vs-bolt-vs-v0) |
