---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 better-auth/skills 官方 skills 仓的 6 份 SKILL.md 逐份精读；代码 API 以 [better-auth.com/docs](https://www.better-auth.com/docs) 为准。

## 速查

- **6 skills 分工**：`best-practices`（配置总纲）/`create-auth`（脚手架）/`emailAndPassword`（凭据流）/`organization`（多租户）/`twoFactor`（MFA）/`security`（加固）
- **create-auth 铁律**：Phase 1 先规划（扫项目 + `AskQuestion` 结构化提问 + 出计划待确认）→ Phase 2 才实现（新建/迁移/增量决策树）
- **插件导入**：走专用路径 tree-shaking，`better-auth/plugins/two-factor` 优于 `better-auth/plugins`；**改插件后必重跑 CLI**
- **模型名 ≠ 表名**：配置用 ORM 的 model 名（`user`），不是底层表名（`users`）
- **密码哈希**：默认 scrypt（Node 原生）；换 Argon2id 需自定义 `hash`/`verify`，且要考虑存量用户迁移
- **组织默认角色**：`owner`（全权）/`admin`（管成员/邀请/设置）/`member`（基础）；末位 owner 不可移除/离开
- **2FA 只对凭据账户**：TOTP 密钥用 auth secret 加密存储、恒定时间比对；`twoFactorEnabled` 首次验证成功才置 true
- **安全默认**：限流生产默认开、CSRF 默认开（`disableCSRFCheck: false`）、账号枚举防护内建、OAuth 自动 PKCE

## best-practices：集成配置总纲

「Better Auth Integration Guide」——配 server/client、DB、会话、插件、env 时的总纲。

**接入工作流**：装 → 配 `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` → 写 `auth.ts` → 建框架路由处理器 → 跑迁移 → 验 `GET /api/auth/ok` 返回 `{ status: "ok" }`。

**核心配置项**：`appName`、`baseURL`、`basePath`（默认 `/api/auth`）、`secret`、`database`、`secondaryStorage`（Redis/KV）、`emailAndPassword`、`socialProviders`、`plugins`、`trustedOrigins`。env 里有 `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` 时就别在配置里重复写 `secret`/`baseURL`。

**数据库**：直连传 `pg.Pool` / `mysql2` pool / `better-sqlite3` / `bun:sqlite` 实例；ORM 从 `better-auth/adapters/{prisma,drizzle,mongodb}` 导入。Drizzle 的 `provider` 取 `"pg"`/`"mysql"`/`"sqlite"`，须与驱动一致。**关键坑**：配置用适配器的 model 名，不是底层表名。

**会话管理**：定义了 `secondaryStorage` 则会话默认存那里（非 DB），要再落库须 `session.storeSessionInDatabase: true`；无 DB + `cookieCache` = 全无状态模式。Cookie 缓存策略：`compact`（默认，Base64url+HMAC，最小）/ `jwt`（标准签名）/ `jwe`（加密，最安全）。`session.expiresIn` 默认 7 天。

**插件 tree-shaking**：从专用路径导入（`better-auth/plugins/two-factor`）而非 `better-auth/plugins`；client 插件放进 `createAuthClient({ plugins: [...] })`。

**类型安全**：`typeof auth.$Infer.Session`、`typeof auth.$Infer.Session.user`；前后端分仓时 `createAuthClient<typeof auth>()`。

## create-auth：两阶段脚手架

给新/旧项目加认证的脚手架，**强制先规划后实现**。

**Phase 1 规划（实现前必做）**：

1. **扫项目**——探测框架（`next.config`/`svelte.config`/`nuxt.config`/`astro.config`/`vite.config` 或 Express/Hono 入口）、DB/ORM（`prisma/schema.prisma`/`drizzle.config.ts`/依赖里的 `pg`/`mysql2`/`mongoose` 等）、已有认证（`next-auth`/`lucia`/`clerk`/`supabase`）、包管理器（看 lockfile）
2. **`AskQuestion` 结构化提问**——项目类型、框架、DB&ORM、认证方式（可多选）、社交提供方、是否要邮箱验证、发信方式、附加功能&插件、需要哪些认证页、UI 风格；能从扫描确定的就跳过
3. **出计划待确认**——用 markdown 清单列出框架/DB/认证方式/插件/UI 与实现步骤，让用户确认后才动手

**Phase 2 实现**：按决策树走——**新建**（装 → auth.ts → auth-client.ts → 路由 → env → 迁移 → 插件 → UI）/ **迁移**（审计现状 → 增量迁移 → 装 Better Auth 并存 → 迁路由/会话/UI → 移除旧库）/ **增量**（分析结构 → 装 → 配 → 路由 → 迁移 → 融入现有页 → 加插件）。

## emailAndPassword：邮箱密码流

**开启**：`emailAndPassword: { enabled: true }`。

**邮箱验证**：配 `emailVerification.sendVerificationEmail`（拿到 `url`/`token` 自行发信）；严格模式加 `emailAndPassword.requireEmailVerification: true`，未验证不给登录、每次登录重发验证信。

**密码重置**：配 `sendResetPassword` 发信 + 可选 `onPasswordReset` 钩子；`requestPasswordReset({ email, redirectTo })` 触发。令牌默认 1 小时过期（`resetPasswordTokenExpiresIn` 可调）、**单次使用**（成功后立即删除）；`revokeSessionsOnPasswordReset: true` 可在重置时踢掉所有会话。密码长度用 `minPasswordLength`/`maxPasswordLength`。

**密码哈希**：默认 **scrypt**（Node 原生，无外部依赖）；换 Argon2id 等需自定义 `password.hash`/`password.verify`。**注意**：中途换算法会导致旧哈希用户登不上，需迁移策略。

**内建安全**：后台发信（防时序攻击）、无效请求做哑操作、无论用户是否存在都返回恒定响应（防账号枚举）；serverless 上配 `advanced.backgroundTasks.handler`（如 Vercel 的 `waitUntil`）。回调 URL **始终用含 origin 的绝对地址**。

## organization：多租户与 RBAC

**装**：server 加 `organization()`、client 加 `organizationClient()`，跑迁移建 organization/member/invitation 表。

**建组织**：创建者自动获 `owner` 角色；`allowUserToCreateOrganization`（可传函数按用户属性判定）、`organizationLimit`、`membershipLimit`。**活跃组织**存在会话里、给后续 API 划定作用域（`setActive({ organizationId })`），`getFullOrganization()` 取活跃组织的全部成员/邀请/团队。

**成员**：server 端 `addMember`（支持多角色数组），client 端走邀请系统；`removeMember`（**末位 owner 不可移除**，须先转让）、`updateMemberRole`。

**邀请**：`sendInvitationEmail` 发信 + `inviteMember({ email, role })`；`getInvitationURL` 生成可分享链接（不触发 `sendInvitationEmail`，自行投递）。`invitationExpiresIn` 默认 48 小时、`invitationLimit`、`cancelPendingInvitationsOnReInvite`。**只有被邀邮箱能接受邀请**。

**角色权限**：默认 `owner`/`admin`/`member`；`hasPermission({ permission })` 做动态鉴权、`checkRolePermission` 仅供 UI 静态渲染。**动态访问控制**（`dynamicAccessControl: { enabled: true }` + `@better-auth/organization/addons`）可 `createRole`/`updateRole`/`deleteRole` 自定义角色（预定义角色不可删、已分配角色须先重指派）。

**团队**：`teams: { enabled: true }`，`createTeam`/`addTeamMember`/`removeTeamMember`/`setActiveTeam`，`maximumTeams`/`maximumMembersPerTeam` 限量。

**安全**：末位 owner 不可移除/离开、owner 角色不可从末位 owner 摘除；`disableOrganizationDeletion` 或 `beforeDelete` 钩子做软删除（删组织会连带删成员/邀请/团队）。

## twoFactor：多因素认证

**装**：server 加 `twoFactor({ issuer })`、client 加 `twoFactorClient({ onTwoFactorRedirect })`。

**开启 2FA**：`twoFactor.enable({ password })`（需密码），返回 `totpURI`（生成 QR 码）+ `backupCodes`（展示给用户）。`twoFactorEnabled` **首次 TOTP 验证成功后才置 true**（`skipVerificationOnEnable: true` 可跳过，不推荐）。

**TOTP（验证器 App）**：`verifyTotp({ code, trustDevice })`，接受当前时段前后一个周期的码；`totpOptions.digits`（6/8）、`period`（默认 30 秒）。

**OTP（邮件/短信）**：`otpOptions.sendOTP` 投递、`sendOtp`/`verifyOtp`；`period`（默认 3 分钟）、`digits`、`allowedAttempts`（默认 5）；`storeOTP` 取 `"plain"`/`"encrypted"`/`"hashed"`。

**备份码**：开启 2FA 时自动生成、**单次使用**；`generateBackupCodes({ password })` 重生成（作废旧码）、`verifyBackupCode` 恢复登录；`backupCodeOptions.amount`（默认 10）/`length`/`storeBackupCodes`。

**登录流**：`signIn.email` 返回 `twoFactorRedirect: true` 时跳 `/2fa`，经 TOTP/OTP/备份码验证后才建会话。**受信设备**：验证时传 `trustDevice: true`，`trustDeviceMaxAge` 默认 30 天、每次登录刷新。

**安全**：凭据 → 移除会话 → 临时 2FA cookie（默认 10 分钟）→ 验证 → 建会话；内建限流 3 请求/10 秒；TOTP 密钥用 auth secret 加密、恒定时间比对；**2FA 只能给凭据（邮箱密码）账户开**。

## security：安全加固

**密钥**：查找顺序 `options.secret` → `BETTER_AUTH_SECRET` → `AUTH_SECRET`；生产拒绝占位密钥、短于 32 字符或熵低于 120 位会告警；`openssl rand -base64 32` 生成，**绝不进版本库**。

**限流**：生产默认开，窗口 10 秒/上限 100；`storage` 取 `"memory"`（重启清空，serverless 慎用）/`"database"`/`"secondary-storage"`（有 Redis 时默认）。敏感端点（`/sign-in`、`/sign-up`、`/change-password`、`/change-email`）默认 3 请求/10 秒，`customRules` 可逐端点覆盖。

**CSRF**：多层防护（origin 头校验 + Fetch Metadata + 首登保护），`disableCSRFCheck` 默认 `false`——**别关**。

**受信来源**：`baseURL` 自动受信，`trustedOrigins` 支持通配（`*.example.com`）与动态函数；校验 `callbackURL`/`redirectTo`/`errorCallbackURL`/`origin` 等，非法 URL 返回 403。

**会话与 Cookie**：`session.expiresIn`/`updateAge`/`freshAge`（敏感操作要求新鲜会话）；Cookie 默认 `secure`（HTTPS）/`sameSite: "lax"`/`httpOnly`/`__Secure-` 前缀。跨子域用 `crossSubDomainCookies`。

**OAuth**：所有 OAuth 流**自动 PKCE**，state 令牌 32 字符/10 分钟过期；`account.encryptOAuthTokens: true`（AES-256-GCM）在需代用户调 API 存令牌时开。

**其它**：IP 追踪（`ipAddressHeaders`/`ipv6Subnet`）、`databaseHooks` 做审计日志（`before` 钩子返回 `false` 可阻止操作）、账号枚举防护（恒定响应 + 哑操作 + 后台发信，报「凭据无效」而非「用户不存在」）。

## 认证能力全景

Better Auth Skills 覆盖的认证能力，均由框架核心 + 插件提供：

| 能力 | 提供方 | 要点 |
| --- | --- | --- |
| 邮箱密码 | `emailAndPassword` | 验证、重置、哈希（scrypt/Argon2id） |
| 社交 OAuth | `socialProviders` | Google/GitHub/Apple/Microsoft/Discord/Twitter，自动 PKCE |
| 2FA / MFA | `twoFactor` 插件 | TOTP、邮件/短信 OTP、备份码、受信设备 |
| Passkeys | `@better-auth/passkey` | WebAuthn，`passkeyClient` |
| Magic Links | `magicLink` 插件 | 无密码邮件登录 |
| 多租户组织 | `organization` 插件 | 组织/成员/邀请/团队 |
| RBAC | `organization` + 动态访问控制 | owner/admin/member + 自定义角色 |
| 无状态会话 | 核心 + cookieCache | compact/jwt/jwe 策略 |

## 框架集成

| 框架 | 路由文件 | 处理器 |
| --- | --- | --- |
| Next.js App Router | `app/api/auth/[...all]/route.ts` | `toNextJsHandler(auth)` 导出 `{ GET, POST }` |
| Next.js Pages | `pages/api/auth/[...all].ts` | `toNextJsHandler(auth)` 默认导出 |
| Express | 任意文件 | `app.all("/api/auth/*", toNodeHandler(auth))` |
| SvelteKit | `src/hooks.server.ts` | `svelteKitHandler(auth)` |
| SolidStart | 路由文件 | `solidStartHandler(auth)` |
| Hono | 路由文件 | `auth.handler(c.req.raw)` |

client 端按框架导入：`better-auth/react`、`/vue`、`/svelte`、`/solid`、`/client`（vanilla）。Next.js 服务端组件里用 `nextCookies()` 插件。

## 反模式（安全坑）

- **关 CSRF / origin 校验**：`disableCSRFCheck`、`disableOriginCheck` 标注为安全风险，仅测试或有替代机制时用
- **用弱/占位密钥**：短于 32 字符会告警，生产拒绝默认密钥；密钥进版本库是重大失误
- **serverless 用 memory 限流**：重启即清空，应改 `"database"` 或 `"secondary-storage"`
- **配置写表名而非 model 名**：Better Auth 用 ORM model 名，写成底层表名会找不到
- **加插件不重跑 CLI**：插件带 schema，不重跑 `generate`/`migrate` 会类型报错、缺表
- **中途换密码哈希算法**：旧哈希用户会登不上，必须先规划迁移
- **回调 URL 用相对路径**：前后端不同域时会推断 origin 出错，始终用含 origin 的绝对 URL
- **报「用户不存在」这类具体错误**：泄露账号是否存在，应统一返回「凭据无效」

## 下一步

- [参考](./reference) —— 6 skills 清单表、CLI、DB 适配器、认证特性速览、框架路由、版本与许可
- 上游：[Better Auth 文档](https://www.better-auth.com/docs) · [配置项参考](https://www.better-auth.com/docs/reference/options)
