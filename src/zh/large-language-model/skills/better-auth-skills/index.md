---
layout: doc
---

# Better Auth Skills

Better Auth Skills（`better-auth/skills`）是 Better Auth 官方 org 维护的**专用 skills 仓库**（★203，独立于主库 `better-auth/better-auth`），把「给 TypeScript/JavaScript 项目加认证层」这件事拆成一组可按需调用的 Agent Skills。仓库以 `marketplace.json` 声明 `better-auth-agent-skills` 插件市场，包含 6 份 `SKILL.md`：`best-practices`（集成总纲）、`create-auth`（脚手架）、`emailAndPassword`（邮箱密码流）、`organization`（多租户/RBAC）、`twoFactor`（多因素）、`security`（安全加固），外加 `/providers`、`/explain-error` 两个斜杠命令。它不是通用 prompt，而是 Better Auth 团队把框架的配置约定、迁移命令、安全清单沉淀成 agent 可直接执行的指令——覆盖邮箱密码、社交 OAuth、2FA、Passkeys、Magic Links、多租户组织、RBAC 与安全最佳实践，集成 Next.js / SvelteKit / Express 等框架。Better Auth 本身是一个 TypeScript 全栈认证框架。

## 评价

**优点**

- **官方沉淀**：规则来自 Better Auth 团队，配置项、CLI 命令、迁移路径、安全清单都对齐官方文档（每份 SKILL.md 顶部都要求「先查 better-auth.com/docs」）
- **脚手架有章法**：`create-auth` 强制「先规划后实现」——先扫项目（框架/ORM/已有认证/包管理器）再用 `AskQuestion` 结构化提问，最后按「新建 / 迁移 / 增量」决策树落地，避免瞎生成
- **能力全覆盖**：邮箱密码（验证/重置/哈希）、社交 OAuth、2FA（TOTP/OTP/备份码/受信设备）、多租户组织（成员/邀请/团队/动态角色）、安全（限流/CSRF/受信来源/Cookie/审计）一应俱全
- **安全默认到位**：限流生产默认开、CSRF 多层防护、账号枚举防护（恒定响应 + 后台发信 + 哑操作）、密码哈希默认 scrypt、TOTP 密钥加密存储、OAuth 自动 PKCE
- **框架无关**：Next.js / SvelteKit / Nuxt / Astro / Express / Hono / SolidStart 各有路由处理器；DB 支持 Kysely 内置 / Prisma / Drizzle / MongoDB / 直连
- **Agent 原生**：遵循 Agent Skills 开放格式（`SKILL.md` + frontmatter description 的「Use when…」触发），装进 Claude Code / Cursor 即用；org 另有 better-icons（Skill+MCP）、agent-auth 等重度 agent 投入

**缺点 / 边界**

- **强绑 Better Auth 框架**：技能是框架专属规范，不迁移到 NextAuth/Lucia/Clerk 等其它方案
- **`SKILL.md` 是指令不是完整文档**：多处明确要求「代码示例与最新 API 以 better-auth.com/docs 为准」，agent 仍需联网查文档
- **打包插件只声明 2 个**：`marketplace.json` 的 `auth-skills` 插件目前显式声明 `create-auth` + `best-practices`；另外 4 份 SKILL.md（emailAndPassword/organization/twoFactor/security）也在仓库内，作为专项最佳实践存在
- **仍需人工配 OAuth / 部署 env**：技能会引导，但注册 OAuth 应用、部署环境变量、真机测流程仍要开发者自己做

## 适用场景

- 给 TS/JS 项目从零加认证，或从其它方案迁移到 Better Auth（`create-auth`）
- 已在用 Better Auth，想按官方约定配 server/client、DB 适配器、会话、插件（`best-practices`）
- 实现邮箱密码注册/登录、邮箱验证、密码重置、自定义哈希（`emailAndPassword`）
- 做多租户 SaaS：组织、成员、邀请、团队、RBAC、动态角色（`organization`）
- 加多因素认证：TOTP 验证器、邮件/短信 OTP、备份码、受信设备（`twoFactor`）
- 上线前安全加固：限流、密钥、CSRF、受信来源、Cookie、OAuth 令牌加密、审计日志（`security`）

## 边界

- **不是认证框架本身**：技能是「怎么用 Better Auth」的 agent 指令，框架代码在 `better-auth/better-auth`
- **不是通用认证教程**：只覆盖 Better Auth 的 API 与约定，不讲 OAuth/OIDC 协议本身
- **打包范围与仓库内容有别**：`marketplace.json` 声明 2 个技能，仓库实含 6 份 SKILL.md
- **最新 API 以官网为准**：技能刻意精简，细节让 agent 查 better-auth.com/docs

## 官方文档

[Better Auth 文档](https://www.better-auth.com/docs) ｜ [配置项参考](https://www.better-auth.com/docs/reference/options) ｜ [插件](https://www.better-auth.com/docs/concepts/plugins) ｜ [LLMs.txt](https://www.better-auth.com/llms.txt)

## GitHub 地址

[better-auth/skills](https://github.com/better-auth/skills)（专用 skills 仓）｜ [better-auth/better-auth](https://github.com/better-auth/better-auth)（框架主库）

## 内容地图

- [入门](./getting-started) —— Better Auth 是什么、安装接入五步、6 skills 总览、两个斜杠命令
- [指南](./guide-line) —— 6 skills 逐个深入、认证能力全景（OAuth/2FA/Passkeys/Magic Links/RBAC/多租户）、框架集成、反模式
- [参考](./reference) —— 6 skills 清单表、CLI、DB 适配器、认证特性速览、框架路由、版本与许可

## 幻灯片地址

<a href="/SlideStack/better-auth-skills-slide/" target="_blank">Better Auth Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=612" target="_blank" rel="noopener noreferrer">Better Auth Skills 测试题</a>
