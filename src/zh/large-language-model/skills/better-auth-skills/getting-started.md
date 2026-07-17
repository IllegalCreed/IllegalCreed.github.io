---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 better-auth/skills 官方 skills 仓（★203，2026-07 克隆）的 6 份 SKILL.md 与 marketplace.json 编写；代码 API 以 [better-auth.com/docs](https://www.better-auth.com/docs) 为准。

## 速查

- **是什么**：Better Auth 官方 org 的专用 skills 仓（`better-auth/skills`），给 TS/JS 项目加认证层的 agent 指令集
- **6 skills**：`best-practices`（集成总纲）·`create-auth`（脚手架）·`emailAndPassword`（邮箱密码）·`organization`（多租户/RBAC）·`twoFactor`（多因素）·`security`（安全加固）
- **2 命令**：`/providers`（认证提供方参考）·`/explain-error`（错误码解释）
- **装框架**：`npm install better-auth`
- **两个 env**：`BETTER_AUTH_SECRET`（≥ 32 字符，`openssl rand -base64 32` 生成）+ `BETTER_AUTH_URL`
- **接入五步**：装 → 配 env → 写 `auth.ts` → 建路由处理器 → 跑迁移 → 验 `GET /api/auth/ok` 返回 `{ status: "ok" }`
- **迁移 CLI**：内置 Kysely `npx @better-auth/cli@latest migrate`；Prisma/Drizzle 用 `generate` 出 schema 再迁移；**加插件后必重跑**
- **触发**：遵 Agent Skills 开放格式，装进 Claude Code / Cursor，靠 SKILL.md frontmatter 的「Use when…」自动激活

## Better Auth 是什么

Better Auth 是一个 **TypeScript 全栈认证框架**——server 端一个 `betterAuth({...})` 配置，client 端一个 `createAuthClient({...})`，中间通过一条 `/api/auth/*` 路由打通。它内建邮箱密码、社交 OAuth、会话管理，用插件扩展 2FA、组织、Passkey、Magic Link 等能力；数据层通过适配器接 Kysely（内置）、Prisma、Drizzle、MongoDB 或直连驱动。

**Better Auth Skills** 则是把「怎么正确地用这个框架」沉淀成 agent 可执行的指令：配置约定、CLI 命令、迁移路径、安全清单、常见坑，都写进 `SKILL.md`，让 Claude Code / Cursor 这类工具能直接照做。

## 安装与接入五步

```bash
# 1. 装框架
npm install better-auth

# 2. 生成密钥并写入 env
#    BETTER_AUTH_SECRET=<openssl rand -base64 32 的输出>
#    BETTER_AUTH_URL=http://localhost:3000
```

```ts
// 3. lib/auth.ts —— server 配置
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: /* pg.Pool / mysql2 / Prisma / Drizzle 适配器 */,
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! },
  },
});
```

```ts
// 4. 路由处理器（Next.js App Router 示例）
// app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

第 5 步跑迁移建表，然后验证：

```bash
# 内置 Kysely 适配器：直接建表
npx @better-auth/cli@latest migrate
# 验证：GET /api/auth/ok 应返回 { status: "ok" }
```

> **要点**：`BETTER_AUTH_SECRET` 与 `BETTER_AUTH_URL` 若已在 env 里，就不必再在配置里写 `secret`/`baseURL`。CLI 会在 `./`、`./lib`、`./utils` 或 `./src` 下找 `auth.ts`。

## 6 个 skills 总览

| 技能 | 何时用 | 一句话 |
| --- | --- | --- |
| `best-practices` | 配 server/client、DB、会话、插件 | 集成总纲：配置项、适配器、会话策略、插件 tree-shaking、类型推断、常见坑 |
| `create-auth` | 给项目从零加认证/迁移 | 脚手架：先规划（扫项目 + 提问）后实现（新建/迁移/增量决策树） |
| `emailAndPassword` | 邮箱密码登录/注册 | 邮箱验证、密码重置、密码策略、哈希（scrypt 默认，可换 Argon2id） |
| `organization` | 多租户 SaaS、团队 | 组织、成员、邀请、角色权限、团队、RBAC、动态访问控制 |
| `twoFactor` | 加 MFA | TOTP 验证器、邮件/短信 OTP、备份码、受信设备、2FA 登录流 |
| `security` | 上线前加固 | 限流、密钥、CSRF、受信来源、Cookie、OAuth 令牌加密、IP、审计 |

## 两个斜杠命令

除 6 份 SKILL.md 外，仓库还带两个 `/command`：

- **`/providers [provider_name]`** —— 认证提供方参考。给出提供方名（如 `google`/`github`/`email`）显示该方的配置要求与代码示例；不给名则按类别（OAuth / 邮箱密码 / Magic Link / 无密码 / 社交）总览全部提供方
- **`/explain-error [error_code]`** —— Better Auth 错误码解释器。用大白话讲错误含义、常见成因、解决方案，并按项目语言生成「捕获该错误 + 友好提示 + 是否可重试」的处理代码

## 下一步

- [指南](./guide-line) —— 6 skills 逐个深入、认证能力全景（OAuth/2FA/Passkeys/Magic Links/RBAC/多租户）、框架集成、反模式
- [参考](./reference) —— 6 skills 清单表、CLI、DB 适配器、认证特性速览、框架路由、版本与许可
- 上游：[Better Auth 文档](https://www.better-auth.com/docs)
