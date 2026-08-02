---
layout: doc
outline: [2, 3]
---

# Firestore 与 Auth/Security Rules：文档模型、查询与声明式控权

> 基于 Firebase · 核于 2026-08

## 速查

- **Firestore 数据模型**：**集合 → 文档 → 字段**。集合是文档的容器，文档是 JSON（无固定 schema），文档下可挂**子集合**形成层级。文档上限 1MB，超大内容拆子集合而非塞数组。
- **三种数据引用**：`collection`（一组文档）、`doc`（单个文档）、`collectionGroup`（跨所有同名的子集合查询，如所有 `comments`）。引用是路径，本身不发请求。
- **查询限制**：仅支持**单字段等值/范围**与**复合索引查询**（需手动/自动建索引）；**不能 JOIN、不能聚合**（count/sum 要读取全部或用函数维护）。
- **复合索引**：多字段排序/过滤需建索引，控制台首次查询会提示缺失并提供直链创建；大量索引会增加写入成本。
- **批量写原子**：一次批量写最多 500 个操作（增删改），全部成功或全部失败——这是 Firestore 唯一的"事务"（不像 SQL 跨多表事务）。
- **Authentication**：邮箱密码/魔法链接/手机 OTP/匿名/社交（Google/Apple/Facebook/X/GitHub 等）/企业 SAML-OIDC。登录后签发 **ID Token（JWT）**，含 `uid`/`email`/`email_verified` 等声明。
- **ID Token 与 SDK 联动**：客户端 SDK 自动带 Token，请求被 Firestore 后端解析注入 `request.auth.uid`，规则据此判断身份。
- **Security Rules**：**声明式数据层控权**。用类 JS 语法写"谁能读/写哪些文档"——前端直连数据库无需自写鉴权后端，规则在服务端强制执行，无法被客户端绕过。
- **规则核心三要素**：`request.auth`（用户身份）、`request.resource.data`（待写数据）、`resource.data`（现有数据）。`allow read/write: if ...` 是放行条件。
- **规则 ≠ 校验库**：规则只做粗粒度权限（谁能访问），细粒度业务校验（金额合法、状态机）仍应在 Cloud Function 或客户端做。
- **测试套件**：Rules 提供**本地模拟器（Emulator Suite）**，可在 CI 跑规则单测，避免线上规则配错导致数据泄露或账单爆炸。

## 一、Firestore 文档模型与查询

Firestore 是**文档型 NoSQL**，核心是"集合 → 文档 → 字段"三级：

```
/users  (collection)
   ├── uid_alice  (document)  →  { name:"Alice", age:28, role:"admin" }
   └── uid_bob                →  { name:"Bob",   age:32, role:"user" }

/posts  (collection)
   └── post_1
         ├── 字段 { title, content, authorId }
         └── /comments  (subcollection)
               ├── c_1 → { text, uid, ts }
               └── c_2 → { text, uid, ts }
```

- **引用即路径**：`collection(db, "users")`、`doc(db, "users", uid)`、`collection(db, "posts", "post_1", "comments")`。引用本身**不发请求**，只是构造路径，配合 `get/add/onSnapshot` 才真正执行。
- **collectionGroup**：跨所有同名子集合查询，如 `collectionGroup(db, "comments")` 一次拿到所有帖子的评论，无需先知道 post id。
- **查询构造器**：`query(collection(db,"users"), where("age",">=",18), orderBy("age"), limit(20))`——链式拼条件，服务端执行。
- **复合索引**：`where("role","==","admin") + orderBy("age")` 这种多字段需要**复合索引**，首次跑会报错并给控制台直链创建。**单字段**索引默认自动建（升序/降序/数组各一），不必手动管。

**查询的硬限制**：

| 能力 | Firestore | 关系型 SQL |
| --- | --- | --- |
| 等值 / 范围 | ✅ | ✅ |
| 复合条件 | ✅（需索引） | ✅ |
| JOIN 多表 | ❌ | ✅ |
| 聚合（count/sum/avg） | ❌（需读全部） | ✅ |
| 跨表事务 | ❌ | ✅ |
| 全文检索 | ❌（接 Algolia/Elastic） | ✅（LIKE/全文索引） |

这意味着：**列表分页、按字段过滤是 Firestore 的甜点区；复杂关系分析是它的雷区**。要做"用户本月订单总额 TOP10"这类，必须用 Cloud Function 维护冗余字段（如 `users/{uid}/monthlyTotal`），或导出到 BigQuery 用 SQL 分析。

## 二、批量写与原子性

Firestore 没有 SQL 那样的跨表事务，但提供**批量写（Batched Writes）**保证一组写操作原子：

```js
import { writeBatch, doc } from "firebase/firestore";

const batch = writeBatch(db);
batch.set(doc(db, "users", "u1"), { name: "Alice" });
batch.update(doc(db, "users", "u2"), { age: 29 });
batch.delete(doc(db, "users", "u3"));
await batch.commit(); // 全部成功 或 全部失败，原子
```

- **上限 500 操作/批**：超过要拆批，但拆批就不原子了。
- **必须是写（不能含读）**：批量写里不能混 `get`。需要"读-改-写"原子（如转账、库存扣减）用 **Transaction**：`runTransaction(db, async (tx) => { const snap = await tx.get(...); tx.update(...); })`，内部自动重试冲突。
- **跨文档原子 ≠ 跨表事务**：批量写只原子于"一次提交的多文档"，不是数据库级跨表事务。强一致金融场景仍建议 Postgres。

## 三、Authentication：身份与 ID Token

Firebase Authentication 把"注册/登录/会话"全托管：

- **支持方式**：邮箱密码、邮箱链接（魔法链接）、手机 OTP、匿名、社交（Google/Apple/Facebook/X/GitHub/Microsoft/Yahoo 等）、企业 SAML/OIDC、自定义 Token（自建签名服务签 JWT 给 SDK 登录）。
- **登录产物**：成功后 SDK 拿到 **ID Token（JWT）** 与 **Refresh Token**。ID Token 含 `uid`、`email`、`email_verified`、`sign_in_provider` 等声明，有效期 1 小时，过期由 Refresh Token 自动续。
- **多端会话**：登录态默认存 localStorage（Web）/ Keychain（iOS）/ Keystore（Android），跨标签/重启保持。
- **Admin SDK**：服务端用 `admin.auth().verifyIdToken(idToken)` 验证 Token 拿到 `uid`，用于 Cloud Function 自定义鉴权。

ID Token 是 Firebase 安全模型的**核心载体**——它把"用户身份"压进一个签名令牌，下游所有服务（Firestore/Functions/Storage）都靠它认人。

## 四、Security Rules：数据层声明式控权

Security Rules 是 Firebase 最具特色的设计：**把权限下放到数据层，前端直连数据库无需自写鉴权后端**。规则用类 JS 语法写在 `firestore.rules` 文件：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 用户只能读写自己的 profile
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid
                   && request.resource.data.name is string;
    }

    // posts：登录可读，作者才能写
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.authorId;
      allow update, delete: if request.auth.uid == resource.data.authorId;

      // 嵌套 comments 同样适用
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == request.resource.data.uid;
      }
    }
  }
}
```

- **核心对象**：`request.auth`（登录用户，含 `uid`/`token.email` 等；未登录为 `null`）、`request.resource.data`（待写文档）、`resource.data`（现有文档，更新时才可用）。
- **默认拒绝**：未写 `allow` 的路径**一律拒绝**——这是安全基线，配漏等于拒访，比"默认允许"安全。
- **服务端强制**：规则在后端 Firestore 服务执行，客户端无法绕过——即使有人改前端代码，没 Token 或 Token 不匹配，请求就被拒。
- **数据校验**：规则能做字段类型/范围校验（如 `age is int && age > 0`），但不应承担复杂业务校验（金额合法、状态机迁移），那是 Cloud Function 的活。
- **collectionGroup**：跨子集合匹配用 `match /{path=**}/comments/{commentId}`，对全局同名子集合统一控权。

**规则的运维风险**：规则配错 = 数据泄露或账单爆炸（客户端循环触发被放行）。所以 Firebase 提供 **Emulator Suite** 本地模拟规则，可在 CI 跑规则单测（`firebase emulators:exec`），上线前必须验证。

## 五、Auth + Rules 联动：前端零后端鉴权

把 Auth 与 Rules 组合，能实现"前端直连数据库，权限自动按用户隔离"：

```js
// 前端登录后，直接读写，无需自写后端
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, "alice@x.com", "pwd");
// ID Token 自动注入请求，规则用 request.auth.uid 校验
await setDoc(doc(db, "users", auth.currentUser.uid), { name: "Alice" });
// 若规则要求 uid 匹配，这里非本人 uid 会被拒
```

这种"前端直连 + 数据层规则"的模型让 CRUD 类应用几乎不用写后端——但代价是**业务逻辑分散在前端与规则**，复杂校验/聚合仍要 Cloud Function 兜底。

## 下一步

数据与认证讲完后，下一站看 Firebase 的"运行时与交付层"——[Hosting、Cloud Functions 与 AI Logic](./hosting-and-functions)：全球 CDN 静态托管 + 多站点 rewrite、事件驱动无服务器函数、Realtime DB 的 JSON 树实时，以及 Genkit/AI Logic 如何把 LLM 编排进应用。
