---
layout: doc
outline: [2, 3]
---

# 入门：Google 全栈 BaaS 与 Firestore 文档模型

> 基于 Firebase · 核于 2026-08

## 速查

- **定位**：Firebase 是 **Google 旗下的全栈移动/Web BaaS**——把数据库、认证、托管、函数、存储、推送、分析打包成一个 SDK + 控制台，前端/移动端跳过后端直接用，主心智是"实时、离线优先、按操作计费"。
- **Firestore（NoSQL 文档库）**：当前主推数据库。数据组织成**集合 → 文档 → 字段**（JSON），无固定 schema，强一致实时查询，自动多区域复制。文档上限 1MB，查询限制单字段范围 + 复合索引。
- **Realtime Database**：Firebase 起家的**低延迟 JSON 树**数据库，仍是实时棋盘/多端聊天的首选，但新项目官方推荐 Firestore（更强的查询与扩展性）。
- **实时同步**：客户端订阅文档/查询，服务端变更**秒级推送**到所有连接端（基于 WebSocket 长连接）——多人协作/聊天/仪表盘天然可用。
- **离线优先**：移动/Web SDK 内置**本地缓存 + 写队列**，断网时读写照常（写暂存本地），联网后自动同步合并，冲突按时间戳/自定义规则解决。
- **Authentication**：邮箱密码/魔法链接/手机 OTP/匿名/社交（Google/Apple/Facebook/X 等）/企业 SAML/OIDC，登录后拿到 ID Token。
- **Security Rules**：**声明式规则**（数据层控权）——用类 JS 语法写"谁能读/写哪些文档"，前端拿 Token 直连数据库无需自写后端鉴权。
- **Hosting**：全球 CDN 静态托管 + 自动 HTTPS，可配置**多 rewrite**把 `/api/**` 转发到 Cloud Functions / Cloud Run，单域名搞定前后端。
- **Cloud Functions**：**事件驱动无服务器函数**——Firestore 写入/Auth 用户注册/HTTP 请求/计划任务触发，二代基于 Cloud Run（并发 1000），Node/Python/Go。
- **AI Logic / Genkit**：Google 开源的 LLM 应用框架，把 Gemini/第三方模型、检索（RAG）、工具调用编排成可部署流程，是 Firebase 走向 AI 应用的官方路径。
- **按操作计费**：账单按**读写次数/存储/带宽/函数调用**结算。Spark 免费层每日 5 万读/2 万写/1GB 存储；Blaze 按量计费，超量即扣费。
- **vs Supabase 关键差异**：**文档型 NoSQL vs 关系型 Postgres**；闭源锁定 Google vs 全开源可自托管；按操作计费（易爆账单）vs 免费层无限 API 调用；移动生态成熟 vs 关系建模/SQL 顺手。
- **进阶顺序**：[Firestore 与 Auth/Security Rules](./guide-line/firestore-and-auth) → [Hosting、Cloud Functions 与 AI Logic](./guide-line/hosting-and-functions) → [参考](./reference)。

## 一、Firebase 是什么：Google 的全栈 BaaS

传统做法是前端 + 后端 + 数据库三件套，后端要写路由、鉴权、CRUD、推送、文件、实时。**BaaS（后端即服务）** 把这些**通用后端能力**打包成平台，让前端/移动端开发者**直接对接**，跳过后端。Firebase 是这个赛道的**开创者与标杆**：2011 年以实时数据库（Envolve）起家，2014 年被 Google 收购后扩展为全家桶，至今服务超 300 万应用，移动开发（尤其 iOS/Android）事实标准之一。

它的产品矩阵覆盖应用全生命周期：

| 类别 | 产品 | 作用 |
| --- | --- | --- |
| 数据库 | **Firestore** / Realtime DB | NoSQL 文档/JSON 树存储 + 实时同步 |
| 认证 | **Authentication** | 邮箱/社交/企业登录，签发 ID Token |
| 托管 | **Hosting** | 全球 CDN 静态站点 + 自动 HTTPS + rewrite |
| 函数 | **Cloud Functions** | 事件驱动无服务器后端 |
| 存储 | **Cloud Storage** | 图片/视频/PDF 对象存储 |
| 推送 | **Cloud Messaging（FCM）** | 跨平台消息推送（免费、海量） |
| 分析 | **Google Analytics（GA4）** | 用户行为/漏斗/留存 |
| 崩溃 | **Crashlytics** | 实时崩溃报告与堆栈聚合 |
| 实验 | **Remote Config / A/B Testing** | 远程开关与灰度实验 |
| AI | **AI Logic / Genkit** | LLM 编排与部署 |

一句话：**Firebase = 一套 SDK 打通应用开发全链路，主战场是移动与实时应用。**

## 二、Firestore：文档型 NoSQL

Firestore 是 Firebase 当前的**主推数据库**，是文档型 NoSQL：

```
集合（collection）        文档（document）         字段（fields）
/users  ───────────►  { uid: "abc", name: "张三", age: 28 }
                     { uid: "def", name: "李四", age: 32 }
/posts  ───────────►  /posts/post1 ──► { title, content, authorId }
                       └ /comments  ──► { text, uid, ts }   ← 子集合
```

- **无 schema**：每个文档是自由 JSON，不同文档可有不同字段，灵活但靠**约定与校验**保证一致性。
- **文档上限 1MB**：单文档不能太大，超大内容（长文/列表）应拆成**子集合**（如 `posts/{id}/comments`），而非塞进一个数组字段。
- **查询能力**：支持**等值 + 范围**（`==`/`<`/`<=`/`>`/`>=`/`in`/`array-contains`），多字段需建**复合索引**（控制台或规则文件声明，自动管理大部分）。**不能 JOIN，不能聚合**（count/sum 需读取全部文档或用 Cloud Function 维护计数）。
- **强一致**：文档读写**强一致**（读到刚写的），跨区域复制不引入最终一致延迟。Realtime DB 是最终一致。

代价：**没有 JOIN/事务/SQL 聚合**。复杂关系数据（订单-商品-用户-优惠券多对多）要在 NoSQL 里靠**冗余字段 + 子集合 + Cloud Function 维护**，比关系型 SQL 难。中后台/财务这类强关系场景，Supabase（Postgres）更顺手。

## 三、实时同步与离线优先

Firebase 区别于普通数据库（Supabase 也有 Realtime，但 Firebase 是**默认实时**）的核心心智是**所有数据访问天然是实时订阅**：

```js
// Web SDK：订阅一个查询，数据变更自动推送
const q = query(collection(db, "messages"), orderBy("ts"));
onSnapshot(q, (snap) => {
  render(snap.docs.map((d) => d.data())); // 服务端任何写入都触发回调
});
```

- **实时同步**：客户端 `onSnapshot`/`onValue` 订阅后，**任何客户端写入（或服务端触发）都秒级推到所有订阅者**。聊天、协作编辑、实时仪表盘、多人游戏——不用自己搭 WebSocket。
- **离线优先（移动/Web）**：SDK **默认开启磁盘缓存**——断网时读从本地缓存返回、写暂存本地队列，联网后自动重试合并到服务端。这是 Firebase 在移动端的杀手锏，弱网/飞行模式照常工作。
- **冲突解决**：多端同时写同一文档，默认**最后写入胜**（Last-Write-Wins，按服务端时间戳）；需要复杂合并逻辑时用**Transactions**（原子读写）或 Cloud Function 在服务端裁决。

代价：**实时是有成本**的——每个活跃监听器占用一条长连接，并发连接数与带宽是计费项；列表太大不限制会拖死客户端与账单。

## 四、按操作计费：要小心的账单陷阱

Firebase 的计费模型是**按操作计次**（不是按实例/时长），这是它最大的灵活性也是最大的运维风险：

| 资源 | 计费方式 | Spark 免费 | Blaze 付费 |
| --- | --- | --- | --- |
| Firestore 读 | 按文档计次 | 5 万/天 | $0.036/10 万 |
| Firestore 写 | 按文档计次 | 2 万/天 | $0.108/10 万 |
| Firestore 删除 | 按文档计次 | 2 万/天 | $0.012/10 万 |
| 存储 | GB/月 | 1 GB | $0.108/GB |
| 带宽（出站） | GB/月 | 10 GB/天 | $0.12/GB |
| Cloud Functions | 调用次数 + 时长 | 200 万/月 | $0.0000004/调用 |

**爆账单的典型坑**：

1. **列表页拉 N 条 = N 次读**：一个列表 50 条 = 50 次读（不是 1 次）。10 万用户日活、每次刷新列表 = 500 万读/天，免费层瞬间爆。
2. **Security Rules 配错导致循环触发**：客户端读触发函数写、写又触发监听……函数调用与读写次数指数增长。
3. **复合查询缺索引**：未建复合索引会报错，但有人误用客户端遍历多个单字段查询模拟 JOIN，账单爆炸。

防御：**列表分页 + 限制查询 + 在 Cloud Function 维护聚合字段（如 count）+ 设预算告警（Budget Alert）**。

## 五、Firebase vs Supabase：怎么选

| 维度 | Firebase | Supabase |
| --- | --- | --- |
| 数据库 | **NoSQL 文档**（Firestore）/ JSON 树（Realtime DB） | **关系型 Postgres**（SQL/JOIN/事务） |
| 开源 | 闭源，锁定 Google Cloud | **全开源，可自托管** |
| 实时 | **默认实时**（onSnapshot） | Realtime（Postgres Changes/Presence） |
| 控权 | **Security Rules**（声明式） | **RLS**（Postgres 行级安全） |
| 函数 | Cloud Functions（Node/Python/Go，区域） | Edge Functions（Deno，全球边缘） |
| 计费 | **按操作计次**（易爆账单） | 免费层**无限 API 调用** |
| 推送/分析 | FCM/GA4/Crashlytics 全家桶 | 仅核心 BaaS，需自配 |
| 适合 | **移动端/实时/快速原型/Google 生态** | 中后台/SaaS/复杂关系/需 SQL |

**选型口诀**：要实时/移动/极快原型/Google 全家桶 → **Firebase**；要关系型/事务/JOIN/能自托管 → **Supabase**。

## 下一步

理解了 Firebase 的整体定位与计费模型后，下一步拆解两大核心——[Firestore 与 Auth/Security Rules](./guide-line/firestore-and-auth)（文档模型、查询索引、认证与声明式控权）与 [Hosting、Cloud Functions 与 AI Logic](./guide-line/hosting-and-functions)（CDN 托管、事件驱动函数、Realtime DB、LLM 编排）。
