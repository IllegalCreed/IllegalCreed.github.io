---
layout: doc
outline: [2, 3]
---

# 包装库与生态

> 基于 IndexedDB 3.0（W3C 现行草案）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **为什么几乎必配包装库**：原生 API 是事件驱动请求-回调、与 async/await 天生打架、事务/升级/游标全样板、无查询语言——web.dev/MDN 都建议上包装层。
- **两条主流路线**：[**idb**](https://github.com/jakearchibald/idb)（jakearchibald，最薄 Promise 镜像，约 1~2 KB）；[**Dexie**](https://dexie.org/)（全功能，带查询引擎 + 响应式 + 迁移，约几十 KB）。
- **idb 是什么**：把 IndexedDB 每个 API 一对一 Promise 化，**几乎不改变心智模型**——你仍在想 store/index/事务，只是不写事件回调。
- **idb 打开**：`openDB(name, version, { upgrade(db, oldV, newV, tx, event), blocked, blocking, terminated })`——`upgrade` 对应 `onupgradeneeded`，`blocking` 对应旧连接侧 `versionchange`，`blocked` 对应升级侧阻塞。
- **idb 单请求快捷法**：`db.get/getAll/getAllKeys/count/put/add/delete/clear(store, ...)` 与 `db.getFromIndex(store, index, key)`——**每次调用各自开一笔事务**，图省事的读写用它。
- **idb 事务**：`const tx = db.transaction(store, "readwrite"); await Promise.all([tx.store.put(...), tx.done])`——**`tx.done` 是事务完成的 Promise**，比听 `oncomplete` 顺手。
- **idb 的 await 边界不变**：README 原话——"不要在事务开始与结束之间 await 其他东西，否则事务会在你完成前关闭"；失活规则是规范级的，包装库改不了（见[事务模型](./transactions)）。
- **idb 游标 = async 迭代器**：`for await (const cursor of tx.store) { cursor.value; }`，可 `cursor.advance(n)`——把游标事件循环折叠成循环体。
- **idb TypeScript**：`interface MyDB extends DBSchema { … }` + `openDB<MyDB>(...)`，store/index/键值全程类型安全。
- **Dexie 是什么**：类"前端 ORM"——链式查询（`where().equals().and()`）、声明式 schema、自动迁移、响应式 `liveQuery`、`bulkAdd/bulkPut`、Dexie Cloud 同步。
- **Dexie schema**：`db.version(1).stores({ friends: "++id, name, age, *tags" })`——`++` 自增主键、`&` 唯一、`*` multiEntry、`[a+b]` 复合索引；**只声明要索引的字段**，不像 SQL 列全列。
- **Dexie 迁移**：`db.version(2).stores({...}).upgrade(tx => tx.table("x").toCollection().modify(...))`；表设为 `null` 即删表——把版本天梯声明式化。
- **Dexie 查询链**：`db.friends.where("age").between(20,25).and(f=>f.active).sortBy("name")`——把索引 + 游标封装成可读的查询表达式。
- **Dexie liveQuery**：`liveQuery(() => db.friends.toArray())` 返回 Observable，数据一变自动重发；配 `dexie-react-hooks` 的 `useLiveQuery` / Vue 的 `from()` 做响应式 UI——**IndexedDB 原生没有的能力**。
- **Dexie 逃生舱**：事务内需 await 外部 Promise 用 `Dexie.waitFor(promise)`（原理是发保活请求撑住事务）——救急可用，会拉长持锁。
- **能存什么由结构化克隆定**：`Date`/`Map`/`Set`/`RegExp`/`Blob`/`File`/`ArrayBuffer`/TypedArray 原样存取；**函数、DOM 节点、Error、类的方法与原型链不可**（抛 `DataCloneError` 或丢失）——完整边界表见[浏览器章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)。
- **存取都是深拷贝**：`put(obj)` 存的是当下快照、`get` 返回全新副本——引用语义不保留，类实例取出变普通对象。
- **性能三条**：批量写**合进单事务**（别每条一笔）；只读大集合优先 `getAll`/分块，只要键用 `getAllKeys`；非关键数据用默认 **relaxed durability**（见[事务模型](./transactions)）。
- **选型口径**：最薄壳 + 保留原生心智 → idb；要查询链/响应式/迁移/云同步 → Dexie；只是缓存三五个值 → localStorage（别开数据库）。

## 一、原生痛点清单：为什么要包一层

前四页把原生 API 讲透了，痛点也随之清晰。它们不是 bug，是"生于 Promise 之前"的时代烙印：

| 痛点 | 具体表现 |
| --- | --- |
| **回调地狱** | 每个操作一对 `onsuccess`/`onerror`，嵌套读写迅速金字塔化 |
| **与 async/await 打架** | 请求不是 Promise；手动包 Promise 又踩事务失活坑（见[事务模型](./transactions)） |
| **样板繁重** | 打开/升级/迁移/游标遍历全要手写事件骨架 |
| **无查询语言** | 没有 SQL、无聚合无 join，复杂查询靠索引 + 游标手拼 |
| **多标签页要自理** | `blocked`/`versionchange` 协调礼仪得自己实现（见[版本与多标签页](./versioning-multitab)） |
| **无响应式** | 数据变了 UI 不会自动更新，要自己发通知 |

web.dev 与 MDN 的一致建议：**别裸写生产代码，配包装库**。生态里两个层级的答案——想要最小改动、保留原生心智，用 idb；想要查询链与响应式、把 IndexedDB 当"前端数据库"用，上 Dexie。

## 二、idb：最薄的 Promise 镜像

[idb](https://github.com/jakearchibald/idb)（Jake Archibald 作，约 1~2 KB）的设计哲学是**一对一镜像**——它不发明新概念，只把原生 API 的每个方法 Promise 化。你的 IndexedDB 知识全部平移，只是不再写事件回调。

### 2.1 打开与升级

```js
import { openDB } from "idb";

const db = await openDB("app-db", 3, {
  // 对应原生 onupgradeneeded：迁移天梯照第四页的写法，只是拿到的是 Promise 化 API
  upgrade(db, oldVersion, newVersion, tx, event) {
    if (oldVersion < 1) {
      const store = db.createObjectStore("users", { keyPath: "id" });
      store.createIndex("by_email", "email", { unique: true });
    }
    if (oldVersion < 2) {
      tx.objectStore("users").createIndex("by_name", "name");
    }
  },
  blocked(currentVersion, blockedVersion, event) {
    // 升级侧：别的旧连接挡道（对应原生 onblocked）
  },
  blocking(currentVersion, blockedVersion, event) {
    // 旧连接侧：有人要升级、该让路了（对应原生 onversionchange）
    db.close();
  },
  terminated() {
    // 连接被浏览器异常关闭
  },
});
```

四个回调正好对上前两页讲的机制：`upgrade` = `onupgradeneeded`（含迁移事务 `tx`）、`blocking` = 旧连接的 `onversionchange`（该 `db.close()`）、`blocked` = 升级侧的 `onblocked`、`terminated` = 意外关闭。

### 2.2 两种用法：单请求快捷 vs 显式事务

```js
// 快捷法：每次调用【各自开一笔事务】——图省事的零散读写
await db.put("users", { id: 1, name: "张三" });
const user = await db.get("users", 1);
const all = await db.getAll("users");
const byEmail = await db.getFromIndex("users", "by_email", "a@b.com");

// 显式事务：多个操作要原子性时——一笔事务里做完
const tx = db.transaction("users", "readwrite");
await Promise.all([
  tx.store.put({ id: 2, name: "李四" }),
  tx.store.put({ id: 3, name: "王五" }),
  tx.done, // ⭐ 事务完成的 Promise（提交成功 resolve，中止 reject）
]);
```

`tx.done` 是 idb 的点睛之笔——把"事务是否落库"变成一个可 await 的 Promise，替代原生的 `oncomplete`/`onabort` 监听。`tx.store` 是作用域内单个 store 的快捷访问（多 store 用 `tx.objectStore(name)`）。

### 2.3 游标变 async 迭代器

idb 把"游标 + `continue()` + `onsuccess`"这套事件循环折叠成 `for await`：

```js
const tx = db.transaction("users", "readwrite");
for await (const cursor of tx.store) {
  console.log(cursor.key, cursor.value);
  if (cursor.value.stale) await cursor.delete(); // 原位删
  // 需要跳跃仍可 cursor.advance(2) / cursor.continue(key)
}
await tx.done;
```

### 2.4 TypeScript：DBSchema 全程类型安全

```ts
import { openDB, type DBSchema } from "idb";

interface MyDB extends DBSchema {
  users: {
    key: number;
    value: { id: number; name: string; email: string };
    indexes: { by_email: string };
  };
}

const db = await openDB<MyDB>("app-db", 3, {
  upgrade(db) {
    const store = db.createObjectStore("users", { keyPath: "id" });
    store.createIndex("by_email", "email", { unique: true });
  },
});

const user = await db.get("users", 1); // 类型推断为上面的 value | undefined
```

**idb 不改变的东西**：README 里那条警告和原生完全一样——**"不要在事务开始与结束之间 await 其他东西，否则事务会在你完成前关闭"**。事务失活是规范级行为（见[事务模型](./transactions)第四节），换任何包装库都在。idb 的价值是消灭回调样板，不是消灭这个坑。

## 三、Dexie：带查询引擎的全功能库

如果说 idb 是"Promise 版原生"，[Dexie](https://dexie.org/) 就是"前端的轻量 ORM"——它有自己的**声明式 schema、链式查询、自动迁移、响应式**，把 IndexedDB 藏在身后。官网称被 10 万+ 开发者使用。

### 3.1 声明式 schema 与自动迁移

```js
import Dexie from "dexie";

const db = new Dexie("app-db");

// 只声明【要索引的字段】，不像 SQL 列全列出
db.version(1).stores({
  // ++ 自增主键；& 唯一；* multiEntry；[a+b] 复合索引
  friends: "++id, name, age, &email, *tags, [age+name]",
});

// 升级 = 再声明一个 version；迁移写在 .upgrade()
db.version(2)
  .stores({
    friends: "++id, name, age, &email, *tags, [age+name], city", // 加 city 索引
    logs: null, // 设为 null = 删除该表
  })
  .upgrade((tx) =>
    tx
      .table("friends")
      .toCollection()
      .modify((f) => {
        f.city = f.city ?? "未知"; // 给存量补默认值
      }),
  );
```

`stores()` 的符号表：`++` 自增主键、`&` 唯一约束、`*` multiEntry（数组展开）、`[a+b]` 复合索引——正好对应 [CRUD 页](./crud-index-cursor)讲的原生索引选项，只是声明式表达。Dexie 把"版本天梯 + 迁移事务"变成链式声明，比手写 `switch (oldVersion)` 清爽得多。

### 3.2 链式查询：把索引 + 游标封成表达式

```js
// 原生要"index + KeyRange + 游标"手拼的查询，Dexie 一行链式
const young = await db.friends.where("age").between(18, 30).sortBy("name");
const byTag = await db.friends.where("tags").equals("前端").toArray(); // 命中 multiEntry
const combo = await db.friends
  .where("age")
  .above(25)
  .and((f) => f.city === "北京") // 索引之外的字段用谓词过滤
  .offset(20)
  .limit(10)
  .toArray();

// CRUD 与批量
await db.friends.add({ name: "张三", age: 21, email: "z@s.com", tags: ["前端"] });
await db.friends.update(1, { age: 22 }); // 部分更新（内部 get+put）
await db.friends.bulkAdd(list); // 批量：单事务，远快于逐条
await db.friends.bulkDelete([1, 2, 3]);

// 显式事务
await db.transaction("rw", db.friends, async () => {
  const f = await db.friends.get(1);
  await db.friends.put({ ...f, age: f.age + 1 });
}); // 出错自动回滚
```

注意 `where(...)` 走的字段**必须建了索引**才高效（否则 Dexie 退化为全表扫描）；`.and(谓词)` 里的字段则是内存过滤——设计索引时对着高频查询走查一遍。

### 3.3 liveQuery：IndexedDB 原生没有的响应式

Dexie 最大的差异化能力是**响应式查询**——数据一变，查询结果自动重新推送：

```js
import { liveQuery } from "dexie";

// 返回一个 Observable；friends 表任何写入都会让它重新求值并发射
const friends$ = liveQuery(() => db.friends.where("age").above(18).toArray());
const sub = friends$.subscribe({
  next: (result) => renderList(result), // 数据变就自动刷新 UI
  error: (err) => console.error(err),
});
```

框架集成开箱即用：React 用 `dexie-react-hooks` 的 `useLiveQuery(() => db.friends.toArray())`，Vue 用 `from()` 把 Observable 接进响应式系统——**"数据库即状态源"**，省掉手写"写入后通知刷新"的胶水（原生 IndexedDB 得靠 `BroadcastChannel` 自己搭）。此外 Dexie Cloud 提供开箱的多端同步与协作能力，需要离线优先 + 云同步时可评估。

### 3.4 Dexie 的 await 逃生舱

Dexie 事务内同样受失活规则约束——事务回调里 await 一个**非 Dexie** 的 Promise（如 `fetch`）会让事务失活。Dexie 给了一个官方逃生舱：

```js
await db.transaction("rw", db.friends, async () => {
  const local = await db.friends.get(1); // Dexie 操作：安全
  // 必须在事务内等外部异步时，用 Dexie.waitFor 包住
  const remote = await Dexie.waitFor(fetch("/api/1").then((r) => r.json()));
  await db.friends.put({ ...local, ...remote });
});
```

`Dexie.waitFor(promise)` 的原理是在等待期间**不停向事务发保活空请求**，撑住它不失活。这是救急手段不是常规姿势：它让事务持锁时间变长，阻塞作用域重叠的其他写事务——能把网络请求挪到事务外，就别用它。

## 四、结构化克隆：能存什么、存进去变成什么

IndexedDB 存值走**结构化克隆算法**，这决定了"能存什么"和"存取的引用语义"。定位层面的完整类型边界表在[浏览器章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)，这里补工程注意点：

| 能原样存取 | 存不了 / 会变形 |
| --- | --- |
| 原始值、普通对象、数组 | **函数**（抛 `DataCloneError`） |
| `Date`、`RegExp` | **DOM 节点**（抛 `DataCloneError`） |
| `Map`、`Set` | `Error`（跨浏览器不一致，别依赖） |
| `Blob`、`File` | getter/setter、属性描述符（丢失） |
| `ArrayBuffer`、TypedArray | 原型链与类的方法（类实例取出变**普通对象**） |

三个工程直觉：

- **存取都是深拷贝**：`put(obj)` 存的是调用当下的**快照**，之后改 `obj` 不影响库；`get` 返回的是**全新副本**，改它也不影响库——没有引用共享。
- **类实例会"降级"**：`put(new User(...))` 取回来是 `{ ...字段 }` 的普通对象，方法和 `instanceof` 都没了。要保留行为，存纯数据、取出后再 `new User(data)` 重建。
- **二进制是一等公民**：`Blob`/`File`/`ArrayBuffer` 直接存，不必 base64——存用户上传的图片/文件、离线资源缓存，直接丢整个 `Blob` 进去，取出来还是 `Blob`（大二进制、需字节级随机读写则考虑 OPFS，对比见浏览器章）。

## 五、性能模式

把前几页的机制落到可执行的调优清单：

- **批量写合进单事务**：一次 `db.transaction("rw")` 里连发 N 个 `add`/`put`，别开 N 笔事务——事务开销远大于单条写。Dexie 的 `bulkAdd`/`bulkPut`、idb 的 `Promise.all([...puts, tx.done])` 都是这个道理。
- **读大集合：getAll 优先、分块兜底、只要键用 getAllKeys**：`getAll` 引擎内批量取通常快于逐条游标；超大集合用 `getAll(range, count)` 分块防内存峰值；只需键就 `getAllKeys`/`openKeyCursor` 免值物化（取舍详见 [CRUD 页](./crud-index-cursor)第七节）。
- **索引按需建**：每个索引都有写放大——写入时同步维护。对高频查询建索引，别"先都建上"。
- **非关键数据享 relaxed durability**：Chromium 默认已是 relaxed（Chrome 121 起）、Firefox 亦然，`complete` 即"交给 OS"而非"已刷盘"，快 3~30 倍；只有不可重算的关键数据才 `{ durability: "strict" }`（见[事务模型](./transactions)第五节）。
- **重活挪进 Worker**：`indexedDB` 在 Web/Service Worker 全可用，批量导入导出、大查询整体搬进 Worker，主线程只收结果——这条也是[浏览器章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)强调的工程姿势。

## 六、选型口径

| 你的处境 | 选择 |
| --- | --- |
| 想保留原生心智、只求消灭回调样板、极致小体积 | **idb**——1~2 KB，API 一对一 Promise 化 |
| 要查询链、响应式 UI、声明式迁移、批量操作、云同步 | **Dexie**——前端 ORM，`liveQuery` 是杀手锏 |
| 只是缓存三五个偏好字段 | **别开数据库**，用 localStorage（见 [Web Storage 叶](/zh/web-advanced/web-api/web-storage/)） |
| 大二进制、需字节级随机读写、wasm 数据库文件 | **OPFS**（对比见[浏览器章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)） |

一句话收束：**前端要"真数据库"就是 IndexedDB，但几乎不该裸写**——idb 保守、Dexie 全能，按"要不要查询引擎与响应式"二选一即可。API 与选型速查见[参考页](../reference)。
