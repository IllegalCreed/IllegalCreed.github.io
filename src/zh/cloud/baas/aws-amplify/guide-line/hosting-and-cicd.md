---
layout: doc
outline: [2, 3]
---

# Hosting、CI/CD 与 Cognito：交付与认证

> 基于 AWS Amplify · 核于 2026-08

## 速查

- **Amplify Hosting**：AWS 的**全托管前端部署 + CI/CD**。连 Git 仓库即自动构建部署到 S3 + CloudFront 全球 CDN，自带 HTTPS、自定义域名、预览环境、一键回滚。
- **Git 触发 CI/CD**：连接 GitHub/GitLab/Bitbucket/CodeCommit，每次 `git push` 自动触发构建流水线（install → build → deploy）；支持分环境（main→生产、dev→测试）。
- **预览环境（每 PR 一个 URL）**：每个 Pull Request 自动生成临时预览 URL（如 `pr-42.d-xxxx.amplifyapp.com`），PM/QA 在线验收，合入即销毁——闭环发布流程。
- **SSR 支持**：除静态站点（SPA/SSG），还支持 Next.js/Nuxt 的**服务端渲染**（经 Lambda + CloudFront 路由），不只是静态托管。
- **自定义域名 + SSL**：一键绑定自有域名，AWS 自动签发与管理 SSL 证书（ACM）。
- **回滚**：控制台一键回滚到任意历史构建版本，故障快速恢复。
- **Cognito 用户池（User Pool）**：管注册/登录/JWT——目录服务。支持邮箱/手机/用户名、社交登录、**SAML/OIDC 企业 SSO**、MFA、自定义属性。登录后签发 JWT（ID/Access/Refresh Token）。
- **Cognito 身份池（Identity Pool）**：管 **AWS 资源临时凭证**（STS）——让前端用 Cognito 凭证直连 S3/DynamoDB/AppSync，按 IAM 角色控权（基于角色的访问控制 RBAC）。
- **用户池 vs 身份池**：用户池回答"你是谁"（身份认证）；身份池回答"你能做什么 AWS 资源"（授权）。两者常配合用。
- **企业 SSO**：Cognito 用户池原生支持 **SAML 2.0 / OIDC**，对接 Okta/Azure AD/Google Workspace，企业/B2B 场景的认证首选（Firebase 难以匹敌）。
- **MFA**：支持短信/时间一次性密码（TOTP，如 Google Authenticator）；可强制所有用户或仅高风险时。
- **Amplify SDK Auth**：前端用 `signIn/signUp/signOut/fetchAuthSession`，自动管理 Token 刷新与 Cognito 凭证注入。

## 一、Amplify Hosting：Git 即上线

Amplify Hosting 把前端部署的"构建 + CDN + 域名 + CI/CD"全托管，开发者只需推 Git：

```
开发者 git push → Amplify 监听 → install → build → deploy
                                          → S3（静态资源）
                                          → CloudFront（全球 CDN + HTTPS）
                                          → 预览 URL（每 PR）
```

- **连 Git 即用**：控制台连 GitHub/GitLab/Bitbucket，选仓库与分支，Amplify 自动识别框架（React/Vue/Next.js/Angular/Svelte/Nuxt）与构建命令（package.json 的 build script）。
- **自动 CI/CD**：每次 `git push` 触发流水线——`install`（pnpm/npm install）→ `build`（框架 build）→ `deploy`（上传 S3 + 刷新 CloudFront）。可在控制台查看实时构建日志。
- **分环境**：不同分支对应不同环境——`main`→生产（自定义域名）、`dev`→测试（amplifyapp.com 子域）、`feature-x`→预览。
- **SSR 支持**：Next.js/Nuxt 的 SSR 页面经 Amplify Hosting 的 **Lambda 路由**支持（不只是静态 SSG），含 API Routes、ISR、Image Optimization。这是相比 Vercel 的关键能力（Vercel SSR 同样基于 Lambda 架构）。
- **预览环境**：每个 PR 自动生成 `pr-{n}.d-{id}.amplifyapp.com`，PM/QA 验收后合入即销毁，发布流程闭环。
- **自定义域名 + SSL**：一键绑定自有域名（如 `app.example.com`），AWS Certificate Manager（ACM）自动签发与管理 SSL 证书，自动 HTTPS。
- **回滚**：控制台选历史构建一键回滚，故障 30 秒内恢复。
- **构建配置**：默认按框架识别，特殊需求写 `amplify.yml` 自定义（install/build/post-build commands、环境变量、缓存）。

这让团队**无需自建 GitHub Actions + S3 同步 + CloudFront 刷新 + 域名管理**，推送即上线，运维成本极低。

## 二、Cognito 用户池：身份认证

Cognito 用户池（User Pool）是 AWS 的**目录与认证服务**，类似 Firebase Auth 但企业能力更强：

- **登录方式**：邮箱/手机/用户名密码、邮箱链接（魔法链接）、短信 OTP、**社交登录**（Google/Apple/Facebook/Amazon/Sign in with Apple）、自定义（外部 OIDC/SAML 提供商）。
- **企业 SSO**：原生支持 **SAML 2.0 与 OIDC**，对接 Okta/Azure AD/Google Workspace/Ping Identity——企业 B2B 场景的认证首选。Firebase Auth 的 SAML 支持较新且生态弱。
- **MFA**：短信 OTP、TOTP（Google Authenticator/Authy）、可选/强制；可按风险（如新设备）触发。
- **JWT 签发**：登录成功后签发 **ID Token**（用户身份）、**Access Token**（API 鉴权）、**Refresh Token**（续期，默认 30 天可配）。Token 是标准 JWT，可被任何后端验签。
- **用户目录**：内置用户属性（email/phone/name）与自定义属性、用户组（groups，用于 RBAC）、用户迁移（从现有 LDAP/DB 批量导入）。
- **生命周期**：注册 → 邮箱/手机验证 → 登录 → 忘记密码 → 改密 → 禁用/删除。Cognito 托管所有 UI（可定制 hosted UI）或用 Amplify SDK 自建。

```ts
// 前端用 Amplify SDK 调 Cognito
import { signIn, signOut, fetchAuthSession } from "aws-amplify/auth";

await signIn({ username: "alice@x.com", password: "pwd" });
const session = await fetchAuthSession();
const idToken = session.tokens.idToken; // JWT，含 sub/email/groups
```

## 三、Cognito 身份池：AWS 资源授权

身份池（Identity Pool，原 Federated Identities）解决的是**"前端如何安全访问 AWS 资源"**：

- **签发 STS 凭证**：身份池接受来自用户池的 JWT（或社交登录的 Token），换得 **AWS 临时凭证**（AccessKey/SecretKey/SessionToken），有效期 1 小时。
- **基于角色（RBAC）**：身份池关联 IAM 角色——登录用户映射到"AuthenticatedRole"（可读 S3 某前缀），未登录映射到"UnauthenticatedRole"（只读公开资源）。按用户组/属性可映射不同角色（细粒度 RBAC）。
- **前端直连 AWS**：拿到 STS 凭证后，前端 SDK 直接调 S3（上传文件）、AppSync（GraphQL）、DynamoDB（若开放），按 IAM 策略控权——不必经自建后端中转。

**用户池 vs 身份池配合**：用户池认证"你是谁"（签 JWT），身份池授权"你能做什么 AWS 资源"（签 STS）。Amplify 默认把两者配好，前端 `fetchAuthSession()` 同时拿到 JWT 与 STS 凭证。

## 四、权限：authorization 与 IAM

Amplify 的权限有两层：

1. **应用层（authorization）**：在 `defineData` 的 schema 用 `.authorization((allow) => [...])` 声明——`allow.owner()`（每用户隔离）、`allow.group()`（角色组）、`allow.authenticated()`、`allow.public()`。规则在 AppSync 层强制（解析 JWT 的 sub/groups）。
2. **AWS 资源层（IAM）**：身份池角色 + IAM 策略控前端对 AWS 服务的访问——如"AuthenticatedRole 可读写 S3 的 `private/${cognito-identity.amazonaws.com:sub}/*`"。

两层配合：应用层管业务数据权限（哪些 Todo 能看），IAM 管底层资源权限（哪些 S3 对象能访问）。这是企业级场景（合规、最小权限）比 Firebase/Supabase 更细的地方。

## 五、典型认证 + 托管全栈流

```
开发者 git push → Amplify Hosting → 构建 → CloudFront CDN（前端）
                                          ↓
用户访问 → CloudFront → 前端加载
            ↓
        Amplify SDK → Cognito 用户池（登录，签 JWT）
                          ↓ JWT
                    身份池（换 STS 凭证）
                          ↓ STS
                    AppSync（GraphQL，按 authorization + IAM 控权）
                          ↓
                    DynamoDB（数据）/ S3（文件）
```

**部署流**：后端 `npx ampx push`（建 Cognito 用户池/身份池 + AppSync + DynamoDB）→ 前端 `git push`（Hosting CDN）→ 用户登录后 JWT + STS 自动注入所有请求。前后端 + 认证 + 托管一站完成，是 Amplify 对企业全栈的承诺。

## 下一步

Amplify 全栈讲完后，可对照阅读本站 [Firebase](../../firebase/) 叶（移动优先 BaaS）与 [Supabase](../../supabase/) 叶（开源 Postgres BaaS），以及[参考](./../reference)（Gen1 vs Gen2、产品矩阵、与 Firebase/Supabase 取舍、计费、易错点、权威链接）。
