---
layout: doc
---

# AWS Amplify

**AWS Amplify** 是 **Amazon Web Services 旗下的全栈应用开发平台**——它不是单一服务，而是把 AWS 海量基础设施（Cognito 认证、AppSync/DynamoDB 数据、S3 存储、Lambda 函数、CloudFront 托管）**用一套统一 SDK + CLI + Studio 编排成"开发者友好"的 BaaS 体验**，让前端/移动端开发者不必直接啃 AWS 控制台也能用上企业级后端。它的核心心智是**"Gen2 TypeScript-first、CI/CD 托管、企业级 AWS 深度集成"**——后端用 TypeScript 声明式定义（`defineBackend`），`npx ampx push` 一行部署；前端推送 Git 仓库即自动构建分发到全球 CDN；认证走 Cognito（企业 SSO/SAML/OIDC），数据走 DataStore（离线优先 + 自动同步到 DynamoDB）。它是**企业级 BaaS**——能力天花板比 Firebase/Supabase 高（背后是整个 AWS），但学习曲线与配置复杂度也更高。

AWS Amplify 的全部考点围绕**「以 AWS 为底座的全栈编排能力」**展开：①**Gen2 TypeScript 后端**——`amplify/configuration.ts` 声明式定义后端（Auth/Data/Storage/Functions），全 TypeScript，类型贯穿前后端，2024 年发布是当前主推；②**Amplify Studio**——可视化控制台，拖拽设计 UI、连接数据模型、生成 React/Vue/Flutter 代码；③**CI/CD 托管**——连接 Git 仓库（GitHub/GitLab/Bitbucket），每次 push 自动构建 + 部署到 CloudFront，自带预览环境与自定义域名；④**Cognito Auth 集成**——AWS 的企业级身份服务（用户池/身份池），支持社交登录、SAML/OIDC 企业 SSO、MFA、基于角色的 RBAC；⑤**DataStore**——离线优先的数据同步层，前端用 TypeScript 模型（GraphQL schema），SDK 自动同步到 DynamoDB（经 AppSync），断网照常工作。本叶是 Amplify 的**总览与地基**，讲清 Gen2 路线、与 Firebase/Supabase 的取舍（企业级 AWS vs 移动优先 vs 开源）——Cognito/AppSync 原理归安全/后端章，本叶聚焦平台整体。

## 评价

**优点**

- **AWS 全家桶背书**：底层是 Cognito/AppSync/DynamoDB/S3/Lambda/CloudFront，企业级 SLA、合规认证（HIPAA/SOC2/PCI）、全球基础设施（30+ 区域），天花板远高于纯 BaaS
- **Gen2 TypeScript-first**：后端用 TS 声明式定义，类型贯穿前后端，`npx ampx push` 部署，告别一代的 CLI 引导与 CloudFormation 模板手写
- **CI/CD 全托管**：连 Git 即自动构建部署，自带预览环境、自定义域名、回滚，省去自建 GitHub Actions + CDN 的运维
- **DataStore 离线优先**：类似 Firebase 的离线缓存 + 自动同步，但走 GraphQL/AppSync，数据模型更结构化
- **Cognito 企业认证**：原生 SAML/OIDC 企业 SSO、MFA、RBAC，企业/B2B 场景 Firebase 难以匹敌

**缺点**

- **学习曲线陡**：Amplify 抽象的是 AWS，背后仍是 Cognito/AppSync/CloudFormation；出问题要懂 AWS 才能调试，门槛高于 Firebase
- **配置复杂、文档碎**：Gen1 与 Gen2 路线并存（CLI 引导 vs TS 声明），文档混杂易踩坑；CloudFormation 堆栈难排查
- **锁定 AWS**：与 AWS 深度绑定，迁移成本极高（Cognito 用户池、DynamoDB 数据都难搬走）；不像 Supabase 可自托管
- **冷启动与延迟**：DataStore 经 AppSync → Lambda → DynamoDB 链路，冷启动与查询延迟高于直连数据库的 Firebase/Supabase

## 本叶地图

- [入门](./getting-started) —— 定位（AWS 全栈编排）、Gen2 TypeScript-first、CI/CD 托管、Cognito、与 Firebase/Supabase 对比
- [Gen2 后端与 DataStore](./guide-line/gen2-backend) —— Gen2 `defineBackend` 声明式后端、DataStore 离线优先同步、GraphQL/AppSync/DynamoDB
- [Hosting、CI/CD 与 Cognito](./guide-line/hosting-and-cicd) —— Amplify Hosting（Git 触发 CI/CD）、预览环境、Cognito Auth（用户池/身份池/SAML/RBAC）
- [参考](./reference) —— Amplify Gen1 vs Gen2 对比、与 Firebase/Supabase 取舍、产品矩阵、计费、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/aws-amplify-slide/" target="_blank">AWS Amplify</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=AWS%20Amplify" target="_blank" rel="noopener noreferrer">AWS Amplify 测试题</a>
