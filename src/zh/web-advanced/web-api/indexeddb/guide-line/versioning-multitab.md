---
layout: doc
outline: [2, 3]
---

# 版本与多标签页

> 基于 IndexedDB 3.0（W3C 现行草案）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **版本号规则**：从 1 起的无符号整数；`open(name, version)` 传小数被取整（2.1、2.4 都是 2）；取整后与现存相同不触发升级；用**低于**现存版本的号 open 抛 `VersionError`。
- **升级是唯一改 schema 的时机**：`open` 的 version 高于现存（或库不存在）→ 触发 `upgradeneeded`，回调运行在独占的 **versionchange 事务**里，`createObjectStore`/`deleteObjectStore`/`createIndex`/`deleteIndex` 只在此合法。
- **拿升级事务**：`request.transaction` 就是那笔 versionchange 事务；可用它读写既有数据做迁移，它 `complete` 后 `open` 才 `success`。
- **`oldVersion`/`newVersion`**：`upgradeneeded` 事件带这两个值（`event.oldVersion`/`event.newVersion`）；`oldVersion === 0` 表示全新建库。
- **迁移天梯**：用 `switch (oldVersion) { case 0: …; case 1: …; }` **不带 break** 顺序跌落，让任意旧版本用户逐级升到最新——升级逻辑要幂等、可从任意中间态续。
- **versionchange 事务独占全库**：升级期间不能有其他事务并发，也不能手动创建 versionchange 事务（只能由 `open` 触发）。
- **`blocked` 事件**：新版本 `open` 时，若**别的连接仍开着旧版本**，升级被阻塞——`openRequest.onblocked` 触发，升级挂起直到旧连接全部关闭。
- **`versionchange` 事件**：旧连接侧的信号——别的标签页要升级时，你持有的 `db` 收到 `versionchange`，**应主动 `db.close()`** 让路，否则对方一直 `blocked`。
- **黄金搭档**：每个连接拿到手就 `db.onversionchange = () => { db.close(); 提示用户刷新; }`；升级侧配 `onblocked` 提示"请关闭其他标签页"——两边都写才闭环。
- **`close()` 是异步收尾**：调用后连接进入"关闭中"，等所有在途事务结束才真正断开；此后该 `db` 不能再开新事务。
- **删除数据库**：`indexedDB.deleteDatabase(name)` 返回 `IDBOpenDBRequest`，同样会被其他连接 `blocked`；删不存在的库也算 `success`。
- **枚举数据库**：`await indexedDB.databases()` 返回 `[{ name, version }]`（3.0，已广泛支持，Firefox 曾缺席需查兼容）。
- **`connectedTabs` 协调**：跨标签页"谁在用"用 [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)（`navigator.locks`）或 `BroadcastChannel` 协商，IndexedDB 本身不提供锁。
- **升级期不可逆**：versionchange 事务一旦 `abort`（迁移代码抛错、unique 索引撞存量数据），版本**升不上去**，回到旧版本——迁移代码务必防御性写。
- **强制单连接模式**：把 `onversionchange → close` 当默认礼仪，能保证"新标签页永远升得动"，代价是旧标签页需提示用户刷新——SPA 常用模式。

## 一、版本号：库结构演进的唯一旋钮

IndexedDB 用一个单调的**版本号**管理 schema 演进。它是从 1 起的无符号整数，`open` 的第二参数就是"我期望的版本"：

| `open` 的 version 相对现存 | 结果 |
| --- | --- |
| 库不存在 | 建库，`upgradeneeded`（`oldVersion=0`）→ `success` |
| 更高 | `upgradeneeded`（升级 schema）→ `success` |
| 相等 | 直接 `success`，不升级 |
| 更低 | `error`，`request.error` 为 `VersionError` |

两个易错点：传小数会被静默取整（2.1 与 2.4 都当 2 处理，取整后没变化就不升级）；用大版本号时留意 JavaScript 安全整数范围。**版本号只增不减**是纪律——一旦线上到了版本 5，就不能再发布用版本 4 open 的代码，否则老用户全部 `VersionError`。

## 二、升级事务：改结构 + 迁数据的唯一场所

`upgradeneeded` 回调运行在浏览器创建的一笔 **versionchange 事务**里。它有两个特权，也是全 API 里唯一拥有它们的地方：

1. **改 schema**：`createObjectStore`/`deleteObjectStore`/`createIndex`/`deleteIndex` 只在这笔事务里合法，其他任何时机调用抛 `InvalidStateError`。
2. **独占全库**：versionchange 事务不与任何其他事务并发，所以迁移期间数据视图是稳定的。

关键是——**它也能读写既有数据**，通过 `request.transaction` 拿到这笔事务即可边改结构边迁数据：

```js
const request = indexedDB.open("app-db", 3);

request.onupgradeneeded = (event) => {
  const db = request.result;
  const tx = request.transaction; // ⭐ 这就是那笔 versionchange 事务

  // 迁移天梯：从任意旧版本逐级升到最新，case 不写 break 顺序跌落
  switch (event.oldVersion) {
    case 0: {
      // 全新库：从零建 v1 结构
      const users = db.createObjectStore("users", { keyPath: "id" });
      users.createIndex("by_email", "email", { unique: true });
    }
    // falls through —— 让 v0 用户继续执行 v1→v2 的逻辑
    case 1: {
      // v1 → v2：加一个索引
      tx.objectStore("users").createIndex("by_name", "name");
    }
    // falls through
    case 2: {
      // v2 → v3：数据迁移——给存量记录补默认字段
      tx.objectStore("users").openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) return;
        const user = cursor.value;
        if (user.role === undefined) {
          user.role = "member";
          cursor.update(user); // 原位改写（同一升级事务内，原子）
        }
        cursor.continue();
      };
    }
  }
};

request.onsuccess = () => {
  // 升级事务 complete 之后才走到这——此时结构与数据都已就绪
  const db = request.result;
  db.onversionchange = () => db.close(); // 见第四节
};
```

迁移天梯的要义：**用 `oldVersion` 决定从哪一级开始、不写 `break` 顺序跌落到最新**，这样"一年没打开的老用户"和"新装用户"都能到达同一状态。迁移代码必须幂等（可能因崩溃/中止重跑）、且不假设中间版本一定存在过。

**升级会失败并回滚**：迁移代码抛未捕获异常、或对已有冲突数据建 `unique` 索引，都会让 versionchange 事务 `abort`——版本升不上去，库停在旧版本。所以迁移逻辑要防御性写，建 unique 索引前先游标清洗存量重复（见 [CRUD、索引与游标](./crud-index-cursor)）。

## 三、多标签页的根本矛盾

IndexedDB 是**同源共享**的：同一个站点开三个标签页，它们连的是**同一个库**。矛盾就此产生——升级 schema 需要独占，而其他标签页可能正开着旧版本连接：

- 新标签页加载了 v3 代码，`open("app-db", 3)`，想升级；
- 旧标签页还开着 v2 连接没关。

versionchange 事务不能与其他连接并发，于是新标签页的升级被**阻塞**。IndexedDB 用一对事件让双方协调这件事。

## 四、blocked 与 versionchange：协调二重奏

### 4.1 升级侧：`onblocked`

发起升级的 `open` 请求，若被其他连接挡住，触发 `blocked`（不是 error——升级只是挂起，等旧连接关闭后会自动继续）：

```js
const request = indexedDB.open("app-db", 3);

request.onblocked = () => {
  // 有别的标签页开着旧版本，升级排队中
  alert("请关闭本站的其他标签页以完成升级");
};

request.onupgradeneeded = () => {
  /* 旧连接全关后才会走到这 */
};
```

### 4.2 旧连接侧：`onversionchange`

对称地，**持有旧连接的标签页**会收到 `versionchange` 事件——这是"有人要升级，你挡道了"的通知。正确响应是**主动关闭连接让路**：

```js
request.onsuccess = () => {
  const db = request.result;

  db.onversionchange = () => {
    db.close(); // ⭐ 让路：不关的话，升级侧会一直卡在 blocked
    // 连接已失效，提示用户刷新拿新版本
    location.reload(); // 或弹条"新版本就绪，请刷新"
  };
};
```

**两侧都写才闭环**：只写 `onblocked` 提示，旧标签页不 `close` 就永远阻塞；只写 `onversionchange` 关连接、不给用户提示，用户会莫名其妙功能失效。工程上的黄金搭档 = 旧连接 `onversionchange` 里 `close` + 提示刷新，升级侧 `onblocked` 里提示关闭其他标签页兜底（正常情况下旧标签页乖乖 close，`blocked` 根本不会触发）。

### 4.3 `close()` 的语义

`db.close()` 不是立即断开：连接进入"关闭中（closePending）"，浏览器等它上面**所有在途事务结束**才真正断开。调用后不能再 `db.transaction()` 开新事务。理解这点才能解释"为什么 close 了升级还没马上开始"——要等对方在途事务收尾。

## 五、删除与枚举数据库

```js
// 删除整库：同样会被其他连接 blocked
const delReq = indexedDB.deleteDatabase("app-db");
delReq.onsuccess = () => console.log("已删除");
delReq.onblocked = () => console.warn("有连接未关，删除挂起");
delReq.onerror = () => console.error("删除失败", delReq.error);

// 枚举当前源下的库（3.0，已广泛支持；Firefox 早期缺席，用前查兼容）
const dbs = await indexedDB.databases(); // [{ name, version }, ...]
```

`deleteDatabase` 与升级共享同一套阻塞机制——删库前若有别的标签页开着连接，同样触发 `blocked`，需要那些连接监听 `versionchange` 并 close。删一个不存在的库不报错，走 `success`。

## 六、多标签页协调模式

IndexedDB 本身**不提供跨标签页锁**，"谁在用、谁负责写"这类协调要借助别的原语：

- **[Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)**（`navigator.locks.request(name, cb)`）：跨同源标签页/Worker 的命名锁——想让"同一时刻只有一个标签页执行某段写入/同步"时用它包一层，是官方推荐的跨上下文互斥手段（一句带过，细节归 Web Locks 专题）。
- **`BroadcastChannel`**：升级完成、数据变更后向其他标签页广播"请刷新视图/重读数据"，配合 `onversionchange` 做优雅的多页联动。
- **单连接礼仪 = 默认最优解**：把"拿到连接就 `onversionchange → close + 提示刷新"当所有页面的标配。它保证**新标签页永远升得动**，代价仅是旧标签页需要用户刷一下——绝大多数 SPA 采用这个模式，简单且无死锁。

下一页收束到工程实践：原生 API 的痛点清单，以及 idb 与 Dexie 两大包装库怎么把上面这些机制封装成好用的 async/await——[包装库与生态](./wrappers-ecosystem)。
