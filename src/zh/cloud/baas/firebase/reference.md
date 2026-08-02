---
layout: doc
outline: [2, 3]
---

# 参考：Firebase 产品矩阵、数据库对比与计费速查

> 基于 Firebase · 核于 2026-08

## 速查

- **定位**：Google 全栈移动/Web BaaS，一套 SDK 打通数据库/认证/托管/函数/存储/推送/分析，主心智"实时、离线优先、按操作计费"。
- **核心数据库**：**Firestore**（文档型 NoSQL，主推，强一致多区域）与 **Realtime DB**（JSON 树，低延迟实时，更便宜但查询弱）。
- **控权**：**Security Rules**（声明式，数据层强制），前端直连数据库无需自写后端鉴权。
- **运行时**：Cloud Functions（二代基于 Cloud Run，并发 1000，Node/Python/Go）；Hosting（全球 CDN + 多 rewrite）。
- **AI**：Genkit（开源 LLM 框架，厂商无关）+ AI Logic（控制台一键 Gemini 集成）。
- **计费**：按操作计次（Firestore 读 5 万/天免费，写 2 万/天免费），易爆账单——务必分页 + 预算告警 + 函数维护聚合字段。
- **vs Supabase**：NoSQL 文档 vs 关系型 Postgres；闭源锁定 vs 全开源可自托管；按操作计费 vs 免费层无限 API 调用；移动生态成熟 vs SQL 顺手。

## 一、Firebase 产品矩阵

| 类别 | 产品 | 作用 | 计费要点 |
| --- | --- | --- | --- |
| 数据库 | **Firestore** | 文档型 NoSQL，强一致实时 | 按读写次数 |
| 数据库 | **Realtime Database** | JSON 树，低延迟实时 | 按存储/带宽 |
| 认证 | **Authentication** | 邮箱/社交/企业登录 | 免费层 5 万 MAU |
| 托管 | **Hosting** | 全球 CDN + 多 rewrite | 按 GB 存储/带宽 |
| 函数 | **Cloud Functions** | 事件驱动无服务器 | 按调用次数 + 时长 |
| 存储 | **Cloud Storage** | 图片/视频/PDF 对象存储 | 按 GB 存储/带宽/操作 |
| 推送 | **Cloud Messaging（FCM）** | 跨平台消息推送 | **免费** |
| 分析 | **Google Analytics（GA4）** | 用户行为/漏斗/留存 | 免费 |
| 崩溃 | **Crashlytics** | 实时崩溃报告 | 免费 |
| 实验 | **Remote Config / A/B Testing** | 远程开关与灰度 | 免费 |
| AI | **AI Logic / Genkit** | LLM 编排与部署 | 按模型 token + 函数 |
| ML | **Vertex AI in Firebase** | 端侧/云 ML（图像/翻译） | 按调用 |

## 二、Firestore vs Realtime Database

| 维度 | **Firestore**（主推） | **Realtime Database**（起家） |
| --- | --- | --- |
| 数据模型 | **文档型**（集合/文档/字段） | **JSON 树**（路径即表） |
| 一致性 | **强一致** | 最终一致 |
| 查询 | 单字段 + 复合索引，范围/等值 | 需预建索引，排序/过滤受限 |
| 多区域 | ✅ 自动多区域复制 | ❌ 区域级 |
| 文档上限 | 1 MB | 单节点 256 MB（树） |
| 离线优先 | ✅ Web/iOS/Android | ✅ Web/iOS/Android |
| 实时延迟 | 秒级 | **亚秒级**（更快） |
| 计费 | **按读写次数**（小数据高频写贵） | 按存储/带宽（高频写便宜） |
| 适合 | 业务数据、复杂查询、新项目 | 棋盘/多端聊天、低延迟实时 |

**口诀**：新项目默认 Firestore；极致实时且数据简单才用 Realtime DB；可混用（Realtime 做聊天，Firestore 做业务）。

## 三、Firebase vs Supabase vs AWS Amplify（BaaS 对比）

| 维度 | **Firebase** | **Supabase** | **AWS Amplify** |
| --- | --- | --- | --- |
| 数据库 | NoSQL 文档（Firestore） | 关系型 Postgres | DynamoDB（NoSQL）/ 接 RDS |
| 开源 | 闭源 | 全开源可自托管 | 部分开源（Gen2） |
| 实时 | 默认实时 | Realtime（订阅） | AppSync 订阅 |
| 控权 | Security Rules | RLS（Postgres） | IAM + GraphQL 鉴权 |
| 函数 | Cloud Functions（Gen2） | Edge Functions（Deno） | Lambda |
| 托管 | Hosting（CDN） | 需另接（Vercel 等） | Amplify Hosting |
| 计费 | **按操作计次**（易爆） | 免费层无限 API | 按 AWS 资源用量 |
| 生态 | Google 全家桶（GA4/FCM/Crashlytics） | 纯 BaaS | AWS 全家桶（Cognito/IAM） |
| 适合 | 移动端/实时/快速原型 | 中后台/SaaS/需 SQL | 企业级/AWS 深度集成 |

## 四、计费速查（Spark 免费层 / Blaze 付费）

| 资源 | Spark 免费 | Blaze 单价 |
| --- | --- | --- |
| Firestore 读 | 5 万/天 | $0.036/10 万 |
| Firestore 写 | 2 万/天 | $0.108/10 万 |
| Firestore 删除 | 2 万/天 | $0.012/10 万 |
| Firestore 存储 | 1 GB | $0.108/GB/月 |
| Cloud Functions 调用 | 200 万/月 | $0.0000004/调用 |
| Cloud Functions 时长 | 40 万 GB-秒/月 | $0.0000025/GB-秒 |
| Hosting 存储 | 10 GB | $0.026/GB/月 |
| Hosting 带宽 | 360 MB/天 | $0.15/GB |
| Cloud Storage | 5 GB | $0.026/GB/月 |
| Authentication | 5 万 MAU | $0.01/MAU（超量） |

## 五、易错点清单

- **"Firestore 能 JOIN"**：错。Firestore 是文档型 NoSQL，不能 JOIN。多对多关系要靠子集合 + Cloud Function 维护冗余字段，或导出到 BigQuery。
- **"Firestore 有事务"**：部分对。只有**批量写**（500 操作/批，全成功或全失败）和**Transaction**（读-改-写原子），**不是**跨多表的 SQL 事务。
- **"列表查询是 1 次读"**：错。拉 N 条文档 = N 次读（不是 1 次）。这是 Firebase 计费最常见的爆账单原因，务必**分页 + limit**。
- **"Security Rules 在客户端执行，能被绕过"**：错。规则在**服务端 Firestore 服务**强制执行，客户端无法绕过。但规则配错会导致泄露/爆账单，必须用 Emulator Suite 测。
- **"默认拒绝 = 安全"**：对，但反过来——**未写 allow 的路径一律拒绝**，配漏等于拒访，调试时要先确认是否漏配。
- **"Realtime DB 比 Firestore 新"**：错。Realtime DB 是 2011 起家产品，Firestore 是 2017 后推的新一代主推，新项目应选 Firestore。
- **"Cloud Functions 冷启动不影响生产"**：错。Node 函数首次调用 1-3 秒延迟，对延迟敏感接口要配 **min-instances**（保活，计费增加）。
- **"Hosting 只能托管静态"**：错。Hosting 通过 **rewrite** 能转发到 Cloud Functions/Cloud Run，做全栈动态应用，单域名同源免 CORS。
- **"Genkit 只支持 Gemini"**：错。Genkit 厂商无关，支持 Gemini/OpenAI/Anthropic/本地模型。
- **"Firebase 能自托管"**：错。核心数据库/认证闭源，无自托管（区别于 Supabase）。Firebase 仿真器（Emulator Suite）只是本地开发用，不是生产自托管。

## 六、进阶方向（链接其他叶）

- [入门](./getting-started) —— Firebase 定位、Firestore 文档模型、实时同步与离线优先、按操作计费
- [Firestore 与 Auth/Security Rules](./guide-line/firestore-and-auth) —— 文档模型、查询与索引、Authentication、Security Rules 声明式控权
- [Hosting、Cloud Functions 与 AI Logic](./guide-line/hosting-and-functions) —— CDN 托管、事件驱动函数、Realtime DB、Genkit/AI Logic
- [Supabase](../supabase/) —— 开源 Postgres BaaS 路线，与 Firebase 互补选型

## 权威链接

- [Firebase 官方文档](https://firebase.google.com/docs)
- [Firestore 数据模型](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Genkit（Google AI 框架）](https://firebase.google.com/docs/genkit)
- [Firebase 定价](https://firebase.google.com/pricing)
- [Firebase vs Supabase（官方对比）](https://supabase.com/alternatives/supabase-vs-firebase)
- 本站幻灯片：<a href="/SlideStack/firebase-slide/" target="_blank">Firebase</a>
