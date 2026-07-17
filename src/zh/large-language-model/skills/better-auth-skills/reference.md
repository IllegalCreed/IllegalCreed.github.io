---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 better-auth/skills 官方 skills 仓的 6 份 SKILL.md 与 marketplace.json；代码 API 以 [better-auth.com/docs](https://www.better-auth.com/docs) 为准。

## 速查

- **仓库**：`better-auth/skills`（★203），`marketplace.json` 声明 `better-auth-agent-skills` 插件市场
- **6 skills**：best-practices / create-auth / emailAndPassword / organization / twoFactor / security
- **2 命令**：`/providers`、`/explain-error`
- **装框架**：`npm install better-auth`；env `BETTER_AUTH_SECRET`（≥ 32 字符）+ `BETTER_AUTH_URL`
- **CLI**：`npx @better-auth/cli@latest migrate`（内置）/ `generate`（Prisma/Drizzle）/ `mcp --cursor`
- **验证**：`GET /api/auth/ok` → `{ status: "ok" }`

## 6 skills 清单表

| 技能 | SKILL name | 触发场景 | 覆盖 |
| --- | --- | --- | --- |
| `best-practices` | better-auth-best-practices | 配 server/client、DB、会话、插件、env | 接入工作流、核心配置、适配器、会话策略、插件、类型、钩子、常见坑 |
| `create-auth` | create-auth | 从零加认证 / 迁移 | 两阶段（规划 + 实现）、决策树、路由处理器、安全清单 |
| `emailAndPassword` | email-and-password-best-practices | 邮箱密码登录/注册 | 邮箱验证、密码重置、密码策略、哈希、账号枚举防护 |
| `organization` | organization-best-practices | 多租户、团队、RBAC | 组织、成员、邀请、角色权限、团队、动态访问控制、钩子 |
| `twoFactor` | two-factor-authentication-best-practices | MFA | TOTP、OTP、备份码、受信设备、登录流、加密存储 |
| `security` | better-auth-security-best-practices | 上线前加固 | 限流、密钥、CSRF、受信来源、Cookie、OAuth 令牌、IP、审计 |

## 斜杠命令

| 命令 | 参数 | 作用 |
| --- | --- | --- |
| `/providers` | `[provider_name]` | 给名显示该提供方配置+示例；不给名按类别总览全部提供方 |
| `/explain-error` | `[error_code]` | 讲错误含义/成因/解决方案，生成本项目语言的错误处理代码 |

## 安装与 CLI

```bash
# 框架核心
npm install better-auth

# 迁移（内置 Kysely 适配器，直接建表）
npx @better-auth/cli@latest migrate

# 生成 schema（Prisma / Drizzle）
npx @better-auth/cli@latest generate --output prisma/schema.prisma   # Prisma，随后 prisma migrate dev
npx @better-auth/cli@latest generate --output src/db/auth-schema.ts  # Drizzle，随后 drizzle-kit push/generate+migrate

# 把 MCP 接进 AI 工具
npx @better-auth/cli mcp --cursor
```

> 加/改插件后**必重跑** `migrate` 或 `generate`。Drizzle 的 `push` 只适合开发，生产用 `generate` + `migrate`。

**按需 scoped 包**：`@better-auth/passkey`（WebAuthn）、`@better-auth/sso`（SAML/OIDC 企业 SSO）、`@better-auth/stripe`（支付）、`@better-auth/scim`（用户供给）、`@better-auth/expo`（React Native）。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `BETTER_AUTH_SECRET` | 加密密钥，≥ 32 字符高熵；`openssl rand -base64 32` 生成 |
| `BETTER_AUTH_URL` | 基础 URL（如 `https://example.com`） |
| `BETTER_AUTH_TRUSTED_ORIGINS` | 逗号分隔的受信来源 |
| `DATABASE_URL` | 数据库连接串 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` … | 各 OAuth 提供方凭据 |

## 数据库适配器

| 数据库 | 接法 |
| --- | --- |
| SQLite | 直接传 `better-sqlite3` / `bun:sqlite` 实例 |
| PostgreSQL | 直接传 `pg.Pool` 实例 |
| MySQL | 直接传 `mysql2` pool |
| Prisma | `prismaAdapter(prisma, { provider: "postgresql" })`（`better-auth/adapters/prisma`） |
| Drizzle | `drizzleAdapter(db, { provider: "pg" \| "mysql" \| "sqlite" })`（`better-auth/adapters/drizzle`） |
| MongoDB | `mongodbAdapter(db)`（`better-auth/adapters/mongodb`） |

## 认证特性速览

| 特性 | 配置 / 插件 | 关键参数 |
| --- | --- | --- |
| 邮箱密码 | `emailAndPassword: { enabled }` | `requireEmailVerification`、`minPasswordLength` |
| 邮箱验证 | `emailVerification.sendVerificationEmail` | `sendOnSignUp`/`sendOnSignIn` |
| 密码重置 | `sendResetPassword` | `resetPasswordTokenExpiresIn`（默认 1h，单次） |
| 社交 OAuth | `socialProviders` | 自动 PKCE、state 32 字符/10 分钟 |
| 2FA | `twoFactor({ issuer })` | `totpOptions`、`otpOptions`、`backupCodeOptions` |
| 组织 | `organization()` | `organizationLimit`、`membershipLimit`、`teams` |
| 会话 | `session` | `expiresIn`（7d）、`cookieCache.strategy`（compact/jwt/jwe） |
| 限流 | `rateLimit` | `window`（10s）、`max`（100）、`storage` |

## 框架路由处理器

| 框架 | 处理器 |
| --- | --- |
| Next.js（App/Pages） | `toNextJsHandler(auth)` |
| Express | `toNodeHandler(auth)`（`app.all("/api/auth/*", ...)`） |
| SvelteKit | `svelteKitHandler(auth)`（`src/hooks.server.ts`） |
| SolidStart | `solidStartHandler(auth)` |
| Hono | `auth.handler(c.req.raw)` |

client 导入：`better-auth/react` · `/vue` · `/svelte` · `/solid` · `/client`（vanilla）。

## 常用插件

`twoFactor`、`organization`、`passkey`、`magicLink`、`emailOtp`、`username`、`phoneNumber`、`admin`、`apiKey`、`bearer`、`jwt`、`multiSession`、`sso`、`oauthProvider`、`oidcProvider`、`openAPI`、`genericOAuth`。

> server 插件从专用路径导入做 tree-shaking；对应 client 插件放进 `createAuthClient({ plugins: [...] })`；改插件后重跑 CLI。

## 版本与许可

- **仓库**：`better-auth/skills`（★203），owner Alex Yang（alex@better-auth.com），`marketplace.json` version 1.0.0
- **框架主库**：`better-auth/better-auth`
- **打包插件**：`auth-skills`（「Create and update auth layer for JavaScript/TypeScript projects」），显式声明 `create-auth` + `best-practices`；仓库另含 emailAndPassword/organization/twoFactor/security 四份 SKILL.md
- **格式**：Agent Skills 开放格式（`SKILL.md` + frontmatter description 的「Use when…」触发）
- **org 其它 agent 投入**：better-icons（Skill + MCP）、agent-auth、better-hub

## 资源链接

- 技能仓：[better-auth/skills](https://github.com/better-auth/skills)
- 框架主库：[better-auth/better-auth](https://github.com/better-auth/better-auth)
- 文档：[better-auth.com/docs](https://www.better-auth.com/docs)
- 配置项参考：[reference/options](https://www.better-auth.com/docs/reference/options)
- 插件：[concepts/plugins](https://www.better-auth.com/docs/concepts/plugins)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Antfu Skills](../antfu-skills/)
