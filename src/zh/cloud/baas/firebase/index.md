---
layout: doc
---

# Firebase

**Firebase** 是 Google 旗下的**全栈移动/Web 后端即服务（Backend-as-a-Service，BaaS）平台**——它把应用开发所需的一整套后端能力（文档型 NoSQL 数据库、身份认证、静态托管、无服务器函数、实时数据同步、云存储、消息推送、崩溃监控、A/B 实验）打包成一个统一 SDK + 控制台，让前端/移动端开发者**跳过后端，直接对接平台**。它诞生于 2011 年（实时数据库 Envolve 起家），2014 年被 Google 收购，成为 Google Cloud 移动开发的事实旗舰，至今服务超 **300 万应用**。它的核心心智是**"实时、离线优先、按操作计费"**——数据写入即刻同步到所有连接的客户端，弱网下 SDK 自动缓存重试，账单按读写次数/存储量结算。

Firebase 的全部考点围绕**「以 Firestore 为中心的 BaaS 能力栈」**展开：①**Firestore（NoSQL）**——文档型数据库，集合 → 文档 → 字段，强一致实时查询，是当前 Firebase 数据库主推方案；②**Authentication**——邮箱/手机/匿名/社交（Google/Apple/Facebook 等）/企业 SAML 集成，与 Security Rules 联动控权；③**Hosting**——全球 CDN 静态托管 + 自动 HTTPS + 回退到 Cloud Functions/Cloud Run；④**Cloud Functions**——事件驱动无服务器后端（Firestore 写入/Auth 触发/HTTP 请求），Node/Python/Go 多运行时；⑤**Realtime Database**——Firebase 起家的低延迟 JSON 树数据库，仍是实时棋盘/聊天的首选；⑥**AI Logic / Genkit**——把 Gemini/第三方 LLM 编排进应用的工作流框架。本叶是 Firebase 的**总览与地基**，讲清定位、产品矩阵、与 Supabase 的取舍（NoSQL vs 关系型、闭源 vs 开源、按操作计费 vs 免费层）——Auth 原理归安全章，本叶聚焦平台整体与各产品的工程取舍。

## 评价

**优点**

- **全栈一站式**：数据库/认证/托管/函数/存储/推送/分析一个 SDK 全覆盖，不必拼装多个云服务，新人周末就能上线 MVP
- **实时 + 离线优先**：Firestore/Realtime DB 写入自动同步全连接客户端；移动 SDK 内置磁盘缓存与冲突解决，弱网/离线照常工作，联网自动重试合并
- **Security Rules 一处定义**：用声明式规则在数据层控权（谁能读写哪些文档），前端直连数据库无需自写鉴权后端
- **生态成熟**：背靠 Google，SDK 覆盖 iOS/Android/Web/Unity/C++/Flutter，分析（GA4）、推送（FCM）、崩溃（Crashlytics）、A/B 测试（Remote Config）形成闭环
- **按操作计费灵活**：免费层每日 5 万读 / 2 万写 / 100 万函数调用，小流量应用基本零成本

**缺点**

- **NoSQL 建模门槛**：Firestore 文档模型没有 JOIN/事务（仅批量写原子）、无聚合（count 需计费读取），复杂关系数据要靠子集合与冗余，迁移成本高
- **闭源厂商锁定**：核心数据库无开源、无自托管，离开 Google Cloud 即数据搬走（只能导出 JSON）
- **按操作计费易爆账单**：读写按文档计次，列表页一次拉 N 条 = N 次读；规则配错导致客户端循环触发，账单瞬间失控，是 Firebase 最大运维风险
- **查询能力受限**：仅支持单字段范围查询与复合索引（需手动建），无法做 SQL 那样的多表 JOIN/分组/窗口

## 本叶地图

- [入门](./getting-started) —— 定位（Google 全栈 BaaS）、Firestore 文档模型、实时同步与离线优先、按操作计费、与 Supabase 对比
- [Firestore 与 Auth/Security Rules](./guide-line/firestore-and-auth) —— Firestore NoSQL 数据模型（集合/文档/子集合）、查询与索引、Authentication（邮箱/社交/OAuth）、Security Rules 声明式控权
- [Hosting、Cloud Functions 与 AI Logic](./guide-line/hosting-and-functions) —— Hosting（全球 CDN/多站点回退）、Cloud Functions（一/二代事件驱动）、Realtime DB、Genkit/AI Logic 编排 LLM
- [参考](./reference) —— Firebase 产品矩阵、Firestore vs Realtime DB 对比、与 Supabase 取舍、定价表、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/firebase-slide/" target="_blank">Firebase</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Firebase" target="_blank" rel="noopener noreferrer">Firebase 测试题</a>
