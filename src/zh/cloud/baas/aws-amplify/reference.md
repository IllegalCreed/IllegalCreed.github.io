---
layout: doc
outline: [2, 3]
---

# 参考：Amplify 产品矩阵、Gen1/Gen2 对比与计费速查

> 基于 AWS Amplify · 核于 2026-08

## 速查

- **定位**：AWS 的全栈应用开发平台，把 Cognito/AppSync/DynamoDB/S3/Lambda/CloudFront 用 SDK + CLI + Studio + Gen2 TS 编排成开发者友好 BaaS。主心智"Gen2 TS-first、CI/CD 托管、企业级 AWS 集成"。
- **Gen2（主推）**：TypeScript-first 后端，`defineBackend/defineAuth/defineData/defineStorage` 声明式，`npx ampx push` 部署，类型贯穿前后端。
- **Hosting**：连 Git 即自动 CI/CD 到 CloudFront CDN，自带预览环境/自定义域名/SSR/回滚。
- **Cognito**：用户池（认证/JWT/企业 SSO）+ 身份池（STS/AWS 资源授权/RBAC）。
- **DataStore**：离线优先同步层，TS 模型 + 自动同步 DynamoDB，冲突 Last-Write-Wins。
- **底层 AWS 全家桶**：Cognito/AppSync/DynamoDB/S3/Lambda/CloudFront，企业级 SLA + 合规（HIPAA/SOC2/PCI）。
- **vs Firebase**：企业级 AWS vs 移动优先；Cognito 企业 SSO vs Authentication。
- **vs Supabase**：闭源锁定 AWS vs 全开源可自托管；AWS 全家桶 vs 单一 Postgres。

## 一、Amplify 产品矩阵

| 类别 | 产品 / AWS 底层 | 作用 |
| --- | --- | --- |
| 后端定义 | **Gen2（`ampx` + TS）** | `defineBackend` 声明式后端，类型贯穿 |
| 数据 | **DataStore / AppSync + DynamoDB** | 离线优先同步，GraphQL API |
| 认证 | **Cognito 用户池 / 身份池** | 注册登录/JWT/企业 SSO/RBAC |
| 托管 | **Amplify Hosting + CloudFront** | Git 触发 CI/CD + CDN |
| 存储 | **S3** | 图片/视频/PDF 对象存储 |
| 函数 | **Lambda** | 事件驱动无服务器 |
| 推送 | **Amazon Pinpoint** | 推送/邮件/短信/分析 |
| 可视化 | **Amplify Studio** | 拖拽设计 UI + 数据模型 |
| AI | **Amplify AI（Gen2 Kit）** | 接 Bedrock/Anthropic 走 LLM |

## 二、Gen1 vs Gen2 对比

| 维度 | **Gen1（遗留）** | **Gen2（2024 主推）** |
| --- | --- | --- |
| 后端定义 | CLI 交互问答（`amplify add api`） | **TypeScript 代码**（`defineBackend`） |
| 部署 | `amplify push`（CloudFormation 模板） | `npx ampx push`（TS 编译 CloudFormation） |
| 版本管理 | 模板难审阅（`#current-cloud-backend`） | 纯 TS 进 Git，可 Code Review |
| 类型 | 前端需手动同步 | **类型贯穿**（`ampx generate` 自动生成） |
| 沙箱 | 共享环境，易冲突 | **独立 sandbox**（开发者互不影响） |
| 学习曲线 | 引导式（上手快但难定制） | TS 代码（需懂声明式 + AWS） |
| 文档状态 | 大量但与 Gen2 混杂 | 新且增长中 |
| 推荐 | 仅旧项目维护 | **新项目一律用 Gen2** |

## 三、Amplify vs Firebase vs Supabase

| 维度 | **AWS Amplify** | **Firebase** | **Supabase** |
| --- | --- | --- | --- |
| 底座 | **AWS 全家桶**（30+ 区域/合规） | Google Cloud | 开源 Postgres（可自托管） |
| 数据 | DynamoDB（NoSQL）/ GraphQL | Firestore（文档 NoSQL） | Postgres（关系型 SQL） |
| 后端定义 | **Gen2 TypeScript** | SDK + Rules | SQL + SDK |
| 认证 | **Cognito（SAML/OIDC 企业 SSO）** | Authentication | GoTrue（社交/OAuth） |
| 离线 | DataStore（GraphQL） | 默认离线优先 | 需配合 Realtime |
| CI/CD | **Git 触发全托管** | Hosting（CDN） | 需另接 |
| 推送/分析 | Amazon Pinpoint | GA4/FCM/Crashlytics 全家桶 | 需自配 |
| 计费 | 按 AWS 资源用量 | 按操作计次（易爆账单） | 免费层无限 API |
| 学习曲线 | **陡**（要懂 AWS） | 平缓 | 平缓 |
| 锁定 | 锁 AWS（极难迁移） | 锁 Google | 开源可自托管 |
| 适合 | **企业级/B2B/AWS 深度** | 移动/实时/快速原型 | 中后台/SaaS/SQL |

## 四、计费速查（按 AWS 资源用量）

| 资源 | 免费层（新账户 12 月） | 付费 |
| --- | --- | --- |
| Cognito 用户池 | 5 万 MAU | $0.0055/活跃用户（>5 万） |
| AppSync | 25 万次/月查询 | $4/百万查询 |
| DynamoDB（按需） | 25 GB + 2 亿请求/月 | $1.25/百万写 / $0.25/百万读 |
| S3 | 5 GB + 2 万 GET/月 | $0.023/GB/月 |
| Lambda | 100 万请求 + 40 万 GB-秒/月 | $0.20/百万请求 |
| CloudFront | 1 GB/月出站 | $0.085-0.25/GB（按区域） |
| Amplify Hosting 构建 | 5 GB 存储 + 15 GB 带宽/月 | $0.01/构建分钟 + $0.15/GB |

注：AWS 免费层是新账户首 12 个月；之后按用量付费。企业级 SLA 与合规认证是额外价值。

## 五、易错点清单

- **"Amplify 是单一服务"**：错。Amplify 是编排层，底层是 Cognito/AppSync/DynamoDB/S3/Lambda/CloudFront 等 AWS 服务；出问题要懂 AWS 才能调试。
- **"Gen1 和 Gen2 可混用"**：不推荐。两者架构不同（CLI 引导 vs TS 声明），同一项目混用会冲突；新项目应一律用 Gen2。
- **"Amplify 完全开源可自托管"**：错。Amplify SDK 与 ampx CLI 部分开源，但底层服务（Cognito/AppSync/DynamoDB）是 AWS 专有，无法自托管（区别于 Supabase）。
- **"DataStore 与 Firestore 一样快"**：错。DataStore 经 AppSync→Lambda→DynamoDB 多跳，冷启动与延迟高于 Firestore 直连；DataStore 优势是结构化 GraphQL + 类型安全。
- **"Cognito 用户池就是身份池"**：错。用户池管认证（签 JWT），身份池管 AWS 资源授权（签 STS）。两者常配合但职责不同。
- **"Amplify 只能托管静态站点"**：错。Hosting 支持 Next.js/Nuxt 的 SSR（经 Lambda 路由），不只是 SSG/SPA。
- **"authorization 规则在前端执行可绕过"**：错。规则在 AppSync 层强制（解析 JWT），客户端无法绕过，类似 Firebase Security Rules。
- **"Amplify 学习曲线和 Firebase 一样平缓"**：错。Amplify 抽象的是 AWS，背后仍是 CloudFormation/IAM/AppSync；出问题门槛高于 Firebase。
- **"Cognito 不支持企业 SSO"**：错。Cognito 用户池原生支持 SAML 2.0/OIDC，是 B2B 场景的认证首选。
- **"Gen2 已完全替代 Gen1，Gen1 已废弃"**：部分对。Gen2 是主推，但 Gen1 仍受支持（旧项目大量在用），文档混杂易踩坑。

## 六、进阶方向（链接其他叶）

- [入门](./getting-started) —— AWS 全栈编排定位、Gen2 TS-first、CI/CD 托管、Cognito、与 Firebase/Supabase 对比
- [Gen2 后端与 DataStore](./guide-line/gen2-backend) —— `defineBackend/defineData` 声明式后端、类型贯穿、DataStore 离线同步、GraphQL/AppSync/DynamoDB
- [Hosting、CI/CD 与 Cognito](./guide-line/hosting-and-cicd) —— Git 触发 CI/CD、预览环境、Cognito 用户池/身份池、企业 SSO、RBAC
- [Firebase](../../firebase/) —— 移动优先 BaaS，与本叶互补选型
- [Supabase](../../supabase/) —— 开源 Postgres BaaS，与本叶互补选型

## 权威链接

- [AWS Amplify 官方文档](https://docs.amplify.aws/)
- [Amplify Gen2 文档](https://docs.amplify.aws/gen2/)
- [Amplify Hosting](https://docs.amplify.aws/gen2/deploy-and-host/)
- [Amazon Cognito 开发者指南](https://docs.aws.amazon.com/cognito/latest/developerguide/)
- [AWS AppSync](https://aws.amazon.com/appsync/)
- [Amplify Studio](https://docs.amplify.aws/console/)
- [AWS Amplify 定价](https://aws.amazon.com/amplify/pricing/)
- 本站幻灯片：<a href="/SlideStack/aws-amplify-slide/" target="_blank">AWS Amplify</a>
