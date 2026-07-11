---
layout: doc
outline: [2, 3]
---

# 入门：事件驱动心智模型与第一个库

> 基于 IndexedDB 3.0（W3C 现行草案）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：IndexedDB 是浏览器内建的**异步、事务型对象数据库**——对象存储 + 索引 + 游标 + 版本化 schema；本叶讲 **API 编程**，定位选型与配额驱逐见[浏览器存储章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)。
- **一切皆请求**：每个操作返回 `IDBRequest`，结果经 `success`/`error` **事件**异步送达；`request.result` 装结果、`request.error` 装错误、`readyState` 标记 pending/done。
- **入口**：`indexedDB.open(name, version)` 返回 `IDBOpenDBRequest`；window/Worker/Service Worker 全可用（`WorkerGlobalScope.indexedDB`）。
- **打开的四个事件**：`upgradeneeded`（建库/升版本时）→ `success`（拿到 `IDBDatabase` 连接）；另有 `error` 与 `blocked`（老标签页占用，见[版本与多标签页](./guide-line/versioning-multitab)）。
- **`onupgradeneeded` 是唯一能建/删 objectStore 与索引的地方**——它运行在独占的 versionchange 事务里；平时的事务改不了 schema。
- **版本号**：从 1 起的无符号整数，传小数会被取整（2.1 与 2.4 都是 2）；用**低于**库当前版本的号去 open 直接报 `VersionError`。
- **三步用库**：`db.transaction(stores, mode)` 开事务 → `tx.objectStore(name)` 拿存储 → `add/put/get/getAll/...` 发请求。
- **写入成败以事务为准**：单个请求 `success` 只代表"该请求被接受"，**`tx.oncomplete` 才代表整笔事务落库**；失败走 `tx.onerror`/`onabort`。
- **`add` vs `put`**：add 遇已存在键抛 `ConstraintError`；put 是 upsert（存在则覆盖），详见 [CRUD 页](./guide-line/crud-index-cursor)。
- **错误三级冒泡**：request → transaction → database；`db.onerror` 可做全库兜底；**未处理的错误默认中止整个事务**，在请求错误回调里 `event.preventDefault()` 才能保住事务。
- **多标签页礼仪**：拿到连接就注册 `db.onversionchange = () => db.close()`，别的标签页升级时主动让路，否则对方永远 `blocked`。
- **能存什么**：由结构化克隆算法决定（对象/`Date`/`Map`/`Blob`/`ArrayBuffer` 可，**函数与 DOM 节点不可**）——完整边界表在[浏览器章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)，工程注意点在[包装库页](./guide-line/wrappers-ecosystem)。
- **可以手写 Promise 化**：逐请求包装 `new Promise` 完全可行（success 回调所在任务里事务仍活跃）；但 **await 任何非 IDB 的异步会让事务失活**——头号深坑，先读[事务模型](./guide-line/transactions)再上 async/await。
- **别裸写生产代码**：原生 API 样板极多，实践配 [idb](https://github.com/jakearchibald/idb)（最薄 Promise 壳）或 [Dexie](https://dexie.org/)（查询链 + 响应式），见[包装库与生态](./guide-line/wrappers-ecosystem)。
- **与 Web Storage 叶分工**：同步 KV（localStorage/sessionStorage）的 API 细节在 [Web Storage API 叶](/zh/web-advanced/web-api/web-storage/)；结构化大数据、需要索引与事务的场景才进本叶。
- **进阶顺序**：本页 → [事务模型](./guide-line/transactions) → [CRUD、索引与游标](./guide-line/crud-index-cursor) → [版本与多标签页](./guide-line/versioning-multitab) → [包装库与生态](./guide-line/wrappers-ecosystem) → [参考](./reference)。

## 一、本叶与相邻内容的分工

IndexedDB 相关内容在本站分两处，各管一段：

| 问题 | 去哪读 |
| --- | --- |
| 它是什么、和 Web Storage/OPFS 怎么选 | [浏览器章：IndexedDB 定位与 OPFS](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs) |
| 能存多大、什么时候会被清 | [浏览器章：配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction) |
| 同步键值存储（localStorage）的 API | [Web Storage API 叶](/zh/web-advanced/web-api/web-storage/) |
| **怎么编程：打开/事务/CRUD/索引/游标/多标签页/包装库** | **本叶** |

一句话回顾定位就够了：IndexedDB 是按键索引的**对象**数据库（不是 SQL 表），全异步、严格同源、容量走 GB 级源配额。下面直接进 API。

## 二、心智模型：一切皆请求，结果走事件

IndexedDB 诞生于 Promise 之前，整套 API 是**事件驱动的请求-回调**风格。理解三个对象的关系，后面所有 API 都是同一个模式的重复：

1. **请求（`IDBRequest`）**：每次调用 `open()`、`add()`、`get()`……都**立即**返回一个请求对象，此刻操作尚未发生。
2. **事件送结果**：操作在后台完成后，请求上触发 `success` 或 `error` 事件；结果放在 `request.result`，错误放在 `request.error`。
3. **事务（`IDBTransaction`）**：除打开/删库外，所有请求都隶属于某个事务；事务负责原子性——整笔一起成，或整笔回滚。

```js
// 同一个模式贯穿全 API：调用 → 拿请求 → 等事件
const request = store.get(1); // 立即返回 IDBRequest，此时还没有结果

request.onsuccess = () => {
  console.log("查到记录：", request.result); // 结果挂在 request.result 上
};
request.onerror = () => {
  console.error("查询失败：", request.error);
};
```

和 Promise 对齐着记：`onsuccess` ≈ `then`、`onerror` ≈ `catch`、`request.result` ≈ resolve 值。区别在于：**请求活在事务的生命周期里**，这带来了 IndexedDB 最特殊的约束（事务自动提交与失活），是下一页的主题。

## 三、open 与 onupgradeneeded：带版本号的打开

`indexedDB.open(name, version)` 同时承担"打开"和"建库/升级"两件事，靠版本号分流：

- **库不存在**：创建之，先触发 `upgradeneeded`（此时 `oldVersion` 为 0），再触发 `success`。
- **version 高于现存版本**：先 `upgradeneeded`（升级 schema 的唯一机会），再 `success`。
- **version 等于现存版本**：直接 `success`。
- **version 低于现存版本**：`error`，`request.error` 为 `VersionError`。

版本号是**从 1 起的无符号整数**：传小数会被取整（MDN 明确：2.1 和 2.4 都取整为 2，取整后相同的"升级"不会触发 `upgradeneeded`）；用大数时注意 JavaScript 可安全表示的整数范围。

`upgradeneeded` 回调运行在一个独占的 **versionchange 事务**里——`createObjectStore()`/`deleteObjectStore()`/`createIndex()`/`deleteIndex()` 只在这里合法，其他任何时机调用都抛 `InvalidStateError`。版本规划、数据迁移、多版本天梯写法详见[版本与多标签页](./guide-line/versioning-multitab)。

## 四、第一个库：完整流程

一个可直接运行的最小闭环——建库、建索引、写入、读回（保存为 HTML 或贴进控制台均可）：

```js
// 1. 打开（不存在则创建），版本号 1
const request = indexedDB.open("todo-db", 1);

// 2. 建库或升版本时触发：唯一能定义 schema 的地方
request.onupgradeneeded = () => {
  const db = request.result;
  // 对象存储：主键取记录的 id 属性（keyPath），并启用自增
  const store = db.createObjectStore("todos", {
    keyPath: "id",
    autoIncrement: true,
  });
  // 二级索引：之后可按完成状态查询
  store.createIndex("by_done", "done");
};

request.onerror = () => {
  // 打开失败：用户禁用存储、版本低于现存库（VersionError）等
  console.error("打开数据库失败：", request.error);
};

request.onsuccess = () => {
  const db = request.result;

  // 多标签页礼仪：别的标签页要升级时主动让路（详见版本与多标签页页）
  db.onversionchange = () => db.close();

  // 3. 开读写事务：作用域只列用得到的 store
  const tx = db.transaction("todos", "readwrite");
  const store = tx.objectStore("todos");

  // 同一事务内连发多个请求：整笔原子提交
  store.add({ title: "学习 IndexedDB", done: false });
  store.add({ title: "写周报", done: true });

  // 4. 以事务的 complete 为"写成功"的判据
  tx.oncomplete = () => {
    const readTx = db.transaction("todos", "readonly");
    const getAllReq = readTx.objectStore("todos").getAll();
    getAllReq.onsuccess = () => {
      console.log("全部待办：", getAllReq.result);
      // [{ id: 1, title: "学习 IndexedDB", done: false }, { id: 2, ... }]
    };
  };
  tx.onerror = () => console.error("写入失败：", tx.error);
};
```

第一次接触就该记住的三件事：

- **schema 只能在升级里改**：想加 store/索引，就得升版本号让 `upgradeneeded` 再跑一次。
- **写成功看事务不看请求**：`add` 的 `success` 只说明请求被接受；`tx.oncomplete` 才代表数据真正落库（且在默认 relaxed 落盘语义下，"落库"指交给操作系统，见[事务模型](./guide-line/transactions)的 durability 一节）。
- **事务是自动提交的**：不需要（多数场景也不该操心）手动 commit——所有请求完成且没有新请求时自动提交；副作用是**不能在事务中途 await 别的异步**，这是整个 API 最大的坑，下一页专门拆。

## 五、错误处理：三级冒泡与默认中止

IndexedDB 的错误事件沿 **request → transaction → database** 冒泡，可以按粒度接：

```js
// 粒度一：单个请求
const addReq = store.add(item);
addReq.onerror = (event) => {
  if (addReq.error?.name === "ConstraintError") {
    // 主键冲突：本请求失败，但我不想让整笔事务陪葬
    event.preventDefault(); // 取消"默认中止事务"行为
    event.stopPropagation(); // 不再向 tx/db 冒泡（可选）
  }
};

// 粒度二：整个事务（该事务内所有请求的错误都会冒到这）
tx.onerror = () => console.error("事务内有请求失败：", tx.error);

// 粒度三：整个连接——兜底日志的好位置
db.onerror = (event) => {
  console.error("数据库错误：", event.target.error);
};
```

两个关键语义：

- **未处理的错误默认中止整个事务**（事务内已成功的请求一并回滚）。想"单个请求失败、事务继续"，必须在错误回调里 `event.preventDefault()`；`stopPropagation()` 只拦冒泡、拦不住中止。
- 事务被中止后触发 `tx.onabort`——**配额超限（`QuotaExceededError`）就是从这里收到的**，与浏览器章[配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction)所述一致。

## 六、可以手写 Promise 化，但要知道边界

事件范式写多了自然想包一层 Promise，这是可行的，也是 idb 库的原理：

```js
/** 把单个 IDBRequest 包成 Promise（idb 库的最小原理版） */
function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const tx = db.transaction("todos", "readwrite");
const store = tx.objectStore("todos");

// 连续 await IDB 请求是安全的：success 回调所在的任务里事务仍然活跃
const key = await promisify(store.add({ title: "新任务", done: false }));
const saved = await promisify(store.get(key));
```

但边界必须先立住：**只能连续 await IDB 自己的请求**。中间插一个 `await fetch(...)`、`await new Promise(r => setTimeout(r))`，事务就会在等待期间自动提交/失活，后续请求抛 `TransactionInactiveError`——机制与对策见下一页[事务模型](./guide-line/transactions)；生产代码直接用现成包装库，见[包装库与生态](./guide-line/wrappers-ecosystem)。
