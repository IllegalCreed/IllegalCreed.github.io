---
layout: doc
outline: [2, 3]
---

# 入门：AWS 全栈编排与 Gen2 TypeScript 后端

> 基于 AWS Amplify · 核于 2026-08

## 速查

- **定位**：AWS Amplify 是 **AWS 的全栈应用开发平台**——把 Cognito/AppSync/DynamoDB/S3/Lambda/CloudFront 用统一 SDK + CLI + Studio 编排成"开发者友好"的 BaaS，让前端不必直接啃 AWS 控制台。主心智是"Gen2 TS-first、CI/CD 托管、企业级 AWS 集成"。
- **Gen2（2024 主推）**：**TypeScript-first 后端**。用 `defineBackend()` 在 `amplify/configuration.ts` 声明式定义 Auth/Data/Storage/Functions，全 TS，类型贯穿前后端，`npx ampx push` 一行部署到 AWS。告别一代的 CLI 引导。
- **Gen1（遗留）**：CLI 引导式（`amplify init` + 交互式问答）生成 CloudFormation 模板。已被 Gen2 取代，但旧项目仍常见，文档混杂易混淆。
- **Amplify Studio**：可视化控制台——拖拽设计 UI、连接数据模型、生成 React/Vue/Flutter 代码，配合 Figma 插件把设计稿直转组件。
- **CI/CD 托管**：连接 Git 仓库（GitHub/GitLab/Bitbucket），每次 `git push` 自动构建 + 部署到 CloudFront CDN，自带**预览环境**（每 PR 一个 URL）、自定义域名、一键回滚。
- **DataStore**：**离线优先数据同步层**。前端用 TypeScript 模型（GraphQL schema 定义），SDK 自动同步到 DynamoDB（经 AppSync），断网照常读写，联网自动合并——类似 Firebase 的离线优先，但走 GraphQL。
- **Cognito Auth**：AWS 的**企业级身份服务**。用户池（User Pool，管注册/登录/JWT）+ 身份池（Identity Pool，管 AWS 资源临时凭证）；支持社交登录、**SAML/OIDC 企业 SSO**、MFA、基于角色的 RBAC。
- **底层是 AWS 全家桶**：Cognito（认证）/ AppSync（GraphQL）/ DynamoDB（数据）/ S3（存储）/ Lambda（函数）/ CloudFront（CDN）——企业级 SLA + 合规认证（HIPAA/SOC2/PCI）。
- **vs Firebase**：企业级 AWS（Cognito 企业 SSO）vs 移动优先（GA4/FCM）；TS 声明式后端 vs NoSQL SDK；学习曲线陡 vs 上手快。
- **vs Supabase**：闭源锁定 AWS vs 全开源可自托管；AWS 全家桶（30+ 区域/合规）vs 单一 Postgres；配置复杂 vs 简洁。
- **进阶顺序**：[Gen2 后端与 DataStore](./guide-line/gen2-backend) → [Hosting、CI/CD 与 Cognito](./guide-line/hosting-and-cicd) → [参考](./reference)。

## 一、AWS Amplify 是什么：AWS 的全栈编排层

传统用 AWS 做应用要直接操作控制台：建 Cognito 用户池、写 AppSync schema、配 DynamoDB 表、设 IAM 权限、部署 Lambda、连 CloudFront——每一步都要懂 AWS 且配置繁琐。**AWS Amplify** 的价值是在这些之上加一层**开发者友好的抽象与编排**：

```
            应用代码（前端 SDK / 后端 TS）
                    │
            ┌───────┴───────┐
            │  Amplify 抽象层  │  ← SDK + CLI + Studio + Gen2 TS
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    Cognito      AppSync      Lambda       ← AWS 底层服务
    (认证)      (GraphQL)     (函数)
        │           │           │
        └─────┬─────┴─────┬─────┘
          DynamoDB       S3                ← 存储
              │
          CloudFront                       ← CDN 托管
```

- **统一 SDK**：`aws-amplify` 包提供 Auth/DataStore/Storage/API/PubSub 等模块，前端一行 import 即用。
- **CLI / ampx**：`npx ampx init` 初始化后端，`npx ampx push` 部署到 AWS（Gen2）；一代用 `amplify` CLI 交互式引导。
- **Studio**：可视化拖拽设计 UI + 数据模型，生成可运行代码。
- **Hosting**：连 Git 即自动 CI/CD 到 CloudFront。

一句话：**Amplify = AWS 全家桶的开发者友好封装，让前端也能用上企业级 AWS 后端。**

## 二、Gen2：TypeScript-first 后端

Gen2（2024 发布，当前主推）的最大改变是**后端用 TypeScript 声明式定义**，告别一代的 CLI 交互问答：

```ts
// amplify/configuration.ts —— 声明式后端定义
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

export const backend = defineBackend({
  auth,   // Cognito 用户池
  data,   // AppSync + DynamoDB（GraphQL）
});
```

```ts
// amplify/data/resource.ts —— 数据模型（GraphQL schema，TS 写）
import { a, defineData } from "@aws-amplify/backend";

export const data = defineData({
  schema: a.schema({
    Todo: a.model({
      title: a.string().required(),
      done: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]), // 每用户隔离
  }),
});
```

- **类型贯穿**：后端 schema 自动生成前端 TS 类型，IDE 自动补全，编译期查错。
- **一行部署**：`npx ampx push` 把后端定义编译成 CloudFormation，部署到 AWS（建 Cognito/AppSync/DynamoDB）。
- **沙箱与分支**：每个开发者可独立 sandbox（独立后端实例），不影响他人；分支即环境（main→生产、dev→测试）。
- **与一代区别**：一代是 `amplify add api` 交互问答生成 CloudFormation 模板（难版本管理、难审阅）；Gen2 是纯 TS 代码，可 Git 管理、Code Review、CI 自动化。

代价：Gen2 仍较新，部分高级配置（自定义 CloudFormation、复杂 IAM）需 escape hatch 写额外代码；生态文档仍在完善。

## 三、CI/CD 托管与 Hosting

Amplify Hosting 把**前端部署 + CI/CD 全托管**：

- **连 Git 即用**：在 Amplify 控制台连 GitHub/GitLab/Bitbucket 仓库，选框架（React/Vue/Next.js/Angular/Svelte），Amplify 自动识别构建命令。
- **自动 CI/CD**：每次 `git push` 触发构建 → 部署到 S3 + CloudFront 全球 CDN，自带 HTTPS。
- **预览环境**：每个 PR 自动生成**临时预览 URL**（如 `pr-42.d-xxxx.amplifyapp.com`），PM/QA 在线验收，合入即销毁。
- **自定义域名**：一键绑定自有域名，自动签 SSL。
- **回滚**：控制台一键回滚到任意历史构建。
- **SSR 支持**：Next.js/Nuxt 的 SSR 通过 Amplify Hosting 的 Lambda 路由支持（不只是静态）。

这让团队无需自建 GitHub Actions + CDN + 域名管理，**推送即上线**。

## 四、Cognito Auth 与 DataStore

- **Cognito Auth**：AWS 的企业级身份服务。**用户池（User Pool）**管注册/登录/JWT（类似 Firebase Auth，但企业能力更强）；**身份池（Identity Pool）**签发 AWS 资源临时凭证（STS），让前端直连 S3/DynamoDB。支持社交登录（Google/Apple/Facebook/Amazon）、**SAML/OIDC 企业 SSO**、MFA、基于角色的 RBAC。企业/B2B 场景的认证首选。
- **DataStore**：离线优先的数据同步层。前端用 TS 模型（GraphQL schema），SDK 自动把读写同步到 DynamoDB（经 AppSync GraphQL），断网时读写本地 SQLite，联网自动合并（Last-Write-Wins 或自定义冲突解决）。与 Firebase 离线优先类似，但数据模型是 GraphQL/结构化，查询更类型安全。

```ts
// 前端用 DataStore：类型安全的 CRUD + 自动同步
import { DataStore } from "aws-amplify/datastore";
import { Todo } from "./models";

await DataStore.save(new Todo({ title: "学 Amplify", done: false })); // 写本地+自动同步
const todos = await DataStore.query(Todo); // 读（本地优先，自动同步）
```

代价：DataStore 经 AppSync → Lambda → DynamoDB 多跳，**冷启动与延迟高于直连数据库**（Firebase/Supabase）；复杂查询受 GraphQL schema 限制。

## 五、Amplify vs Firebase vs Supabase

| 维度 | **AWS Amplify** | **Firebase** | **Supabase** |
| --- | --- | --- | --- |
| 底座 | **AWS 全家桶**（30+ 区域/合规） | Google Cloud | 开源 Postgres（可自托管） |
| 数据 | DynamoDB（NoSQL）/ AppSync GraphQL | Firestore（文档 NoSQL） | Postgres（关系型） |
| 后端定义 | **Gen2 TypeScript 声明式** | SDK + Rules | SQL + SDK |
| 认证 | **Cognito（企业 SSO/SAML）** | Authentication | GoTrue（社交/OAuth） |
| 离线 | DataStore（GraphQL） | 默认离线优先 | 需配合 Realtime |
| CI/CD | **Git 触发全托管** | Hosting（CDN） | 需另接 |
| 计费 | 按 AWS 资源用量 | 按操作计次 | 免费层无限 API |
| 学习曲线 | **陡**（要懂 AWS） | 平缓 | 平缓 |
| 适合 | **企业级/B2B/AWS 深度** | 移动/实时/原型 | 中后台/SaaS/SQL |

**选型口诀**：要企业级/AWS 全家桶/B2B SSO → **Amplify**；要移动/实时/极快原型 → **Firebase**；要关系型/SQL/自托管 → **Supabase**。

## 下一步

理解了 Amplify 的整体定位后，下一步拆解两大核心——[Gen2 后端与 DataStore](./guide-line/gen2-backend)（TS 声明式后端、DataStore 离线同步、GraphQL/AppSync/DynamoDB）与 [Hosting、CI/CD 与 Cognito](./guide-line/hosting-and-cicd)（Git 触发 CI/CD、预览环境、Cognito 企业认证）。
