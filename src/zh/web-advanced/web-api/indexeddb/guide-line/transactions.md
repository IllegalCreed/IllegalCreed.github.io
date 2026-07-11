---
layout: doc
outline: [2, 3]
---

# 事务模型：三模式、自动提交与 await 失活

> 基于 IndexedDB 3.0（W3C 现行草案）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **事务三要素**：`db.transaction(storeNames, mode, options)` —— 作用域（store 列表）+ 模式（readonly/readwrite）+ 选项（`durability`）；**创建即启动**，不是发第一个请求才启动。
- **三模式**：`readonly`（可并发）/ `readwrite`（作用域重叠则串行、按创建顺序跑）/ `versionchange`（独占全库，**只能由 `open()` 升级触发**，是建/删 store 与索引的唯一场所）。
- **作用域最小化**：只列真正要碰的 store——readonly 随便并发，readwrite 之间只有作用域**不重叠**才能并行；访问作用域外的 store 抛 `NotFoundError`。
- **自动提交**：事务在"**活跃期没有新请求 && 没有未决请求**"时自动提交——没有"开着不用、留到以后"的事务。
- **活跃（active）窗口**：创建它的那个事件循环任务 + 它每个请求 `success`/`error` 回调所在的任务（含各自的微任务）；**其他任务里一律失活**，失活后发请求抛 `TransactionInactiveError`。
- **头号深坑**：事务中途 `await fetch(...)` / `setTimeout` / 任何非 IDB 异步 → 等待期间控制权回到事件循环 → 事务自动提交 → 续用抛 `TransactionInactiveError`。**idb/Dexie 也逃不掉**（Dexie 有 `Dexie.waitFor()` 逃生舱）。
- **为什么 await IDB 请求没事**：Promise 化的 IDB 请求在其 `success` 事件任务的微任务里恢复执行，彼时事务仍活跃——这正是 idb 库能用 async/await 的原理。
- **正确姿势**：数据准备（网络请求、计算）放事务**外**；事务内一气呵成只发 IDB 请求。
- **`commit()`**（3.0 新增，已广泛支持）：不等未决请求的事件派发完就启动提交，**加速收尾**用；正常情况根本不必调——自动提交才是常态。
- **durability 三档**：`"default"`（交给浏览器桶策略）/ `"strict"`（确认写入持久介质才算 complete）/ `"relaxed"`（交给操作系统缓冲即算 complete）。
- **Chromium 默认已是 relaxed**：Chrome 121 起默认从 strict 改为 relaxed（官方实测快 3~30 倍）；Firefox 自 40 起也是宽松落盘语义。**`complete` ≠ 已刷盘**（relaxed 下），关键不可重算数据用 `{ durability: "strict" }` 换保证。
- **三个事务级事件**：`complete`（整笔成功）/ `error`（内部请求出错，冒泡中）/ `abort`（事务中止）；abort 与 error 会继续冒泡到 `IDBDatabase`。
- **错误默认中止事务**：某请求出错且未 `event.preventDefault()` → 整笔回滚（已成功的请求也回滚）；`stopPropagation()` 只拦冒泡拦不住中止。
- **`abort()` 手动回滚**：撤销本事务全部改动；对已完成/已中止的事务再调会报错。
- **中止的常见来源**：未处理的请求错误（如 `ConstraintError`）、显式 `abort()`、请求回调里抛出未捕获异常、I/O 失败、**配额超限（`QuotaExceededError` 走 `onabort`）**、页面/浏览器崩溃。
- **别把事务绑 unload**：`beforeunload` 里开的事务不保证完成——持久化要在正常运行期做。
- **读 `tx.error`**：事务失败后拿具体 `DOMException`；成功提交或手动 `abort()` 后它是 `null`。

## 一、事务是什么：作用域 + 模式 + 生命周期

IndexedDB 里除"打开/删除数据库"外的一切读写都发生在事务里。创建只有一个入口：

```js
// 完整签名：storeNames 可以是字符串或数组；mode 默认 "readonly"
const tx = db.transaction(["todos", "tags"], "readwrite", {
  durability: "default", // 可选：落盘语义提示，见第五节
});

const todoStore = tx.objectStore("todos"); // 只能拿作用域内的 store
```

三个立刻要建立的事实：

- **创建即启动**：事务从 `transaction()` 返回那一刻就开始计生命周期，而不是发第一个请求时。
- **作用域定死**：构造时传的 store 列表就是它能触达的全部；`tx.objectStore("其他store")` 抛 `NotFoundError`。传空数组抛 `InvalidAccessError`，store 名不存在抛 `NotFoundError`，连接已关闭抛 `InvalidStateError`。
- **请求属于事务**：`store.add()` 等返回的每个 `IDBRequest` 都挂在这个事务上，一荣俱荣——事务中止时，**已经报过 success 的请求也会被回滚**。

## 二、三种模式与并发规则

| 模式 | 能做什么 | 并发规则 |
| --- | --- | --- |
| `readonly` | 只读 | 任意多个 readonly 事务**可同时跑**，即使作用域重叠 |
| `readwrite` | 读 + 写既有 store | 作用域**重叠**的 readwrite 互斥、**按创建顺序**依次执行；不重叠可并行 |
| `versionchange` | 一切操作，含建/删 objectStore 与索引 | **独占**：不能与任何其他事务并发 |

工程含义：

- **模式往小里选**：能 readonly 就别 readwrite——读事务不排队，写事务会把作用域重叠的后来者全部串行化。
- **作用域往小里列**：`db.transaction(db.objectStoreNames, "readwrite")`（全库大锁）是吞吐杀手；只列本次要碰的 store。
- **versionchange 不能手动开**：`db.transaction()` 传 `"versionchange"` 是非法的，它只在 `open()` 触发升级时由浏览器创建，通过 `request.transaction` 拿到——这保证了 schema 变更天然独占，详见[版本与多标签页](./versioning-multitab)。

## 三、生命周期与自动提交

IndexedDB 事务**没有 `begin`/`commit` 的显式括号**（3.0 的 `commit()` 只是加速收尾，见下）。规范用两个状态描述它的一生：

1. **活跃（active）**：可以发新请求。事务在这些任务里活跃——**创建它的那个任务**，以及**它每个请求的 `success`/`error` 事件回调所在的任务**（包括各自任务收尾前的微任务）。
2. **失活（inactive）**：除上述任务之外的任何时刻。失活期发请求，同步抛 `TransactionInactiveError`。

提交时机由一条规则决定（MDN 原话直译）：**"如果事务活跃期内没有再发新请求，且没有未决请求，事务就自动提交。"** 展开成时间线：

```js
const tx = db.transaction("todos", "readwrite");
const store = tx.objectStore("todos");

store.add(a); // 请求 1：事务有未决请求，保持存活
store.add(b); // 请求 2：同上
// —— 本任务结束，控制权回到事件循环，事务暂时失活 ——
// 请求 1 success 回调任务：事务重新活跃，此时还可以链式发新请求
// 请求 2 success 回调任务：同上；若此后无新请求且无未决请求 → 自动提交
// → tx.oncomplete
```

由此推出两条铁律：

- **想让事务多活一会儿，唯一手段是在活跃窗口里继续发请求**（在 success 回调里链式发起下一个）；
- **事务不能闲置持有**——"先开个事务放着，用户点按钮再写"这种设计在 IndexedDB 里不存在，事务会在你等待用户时就提交掉。

### 3.1 `commit()`：加速收尾，不是必需品

3.0 草案新增、现已广泛支持的 `IDBTransaction.commit()` 常被误解为"必须手动提交"。MDN 原话说得很清楚：**通常不需要调用它**——自动提交始终存在。`commit()` 的作用是：不再等未决请求的 `success` 事件逐个派发回来，立刻进入提交流程。适用于"最后一批写请求发完、结果无需逐个查看"的场景，能省几轮事件往返：

```js
const tx = db.transaction("logs", "readwrite");
const store = tx.objectStore("logs");
for (const entry of batch) store.add(entry); // 批量写入，无需逐条确认
tx.commit(); // 提前进入提交流程；调用后不能再发新请求
tx.oncomplete = () => console.log("批量日志已提交");
```

## 四、await 失活：整个 API 的头号深坑

把第三节的规则放进 async/await 世界，就得到了 IndexedDB 最著名的陷阱：

```js
const tx = db.transaction("todos", "readwrite");
const store = tx.objectStore("todos");

store.put(localDraft); // OK：创建任务内，事务活跃

// 灾难在这里：fetch 完成回调在【另一个任务】里恢复执行——
// 等待期间控制权回到事件循环，事务无新请求 → 自动提交
const remote = await fetch("/api/todo/1").then((r) => r.json());

store.put(remote); // 💥 TransactionInactiveError：事务早已提交/失活
```

### 4.1 为什么 await IDB 请求安全、await fetch 必死

失活边界是**事件循环任务（task）**，不是"任何一次 await"：

- `await` 一个**包装了 IDB 请求**的 Promise：该 Promise 在请求 `success` 事件的任务里 resolve，你的续行代码作为**同一任务的微任务**执行——彼时事务正处于活跃窗口。所以 idb 库里连续 `await tx.store.put(...)` 没有问题。
- `await fetch()` / `setTimeout` / `caches.match()` / 跨 Worker 消息……续行代码在**别的任务**里执行——事务在你等待时已经提交。
- 边角知识：`await Promise.resolve()` 这类**同任务微任务**理论上不越界（事务在任务收尾的微任务检查点前仍活跃），但依赖这一点写代码是走钢丝——心智规则就记成"**事务内只 await IDB 自己的请求**"。

### 4.2 正确姿势

```js
// ✅ 姿势一：异步准备在事务外，事务内一气呵成
const remote = await fetch("/api/todo/1").then((r) => r.json()); // 先取数

const tx = db.transaction("todos", "readwrite");
const store = tx.objectStore("todos");
store.put(localDraft);
store.put(remote); // 全程只发 IDB 请求，不跨任务
await new Promise((resolve, reject) => {
  tx.oncomplete = resolve;
  tx.onerror = () => reject(tx.error);
});
```

- **姿势二（读-算-写分两笔）**：先用 readonly 事务读出数据，事务提交；在外面做网络/重计算；再开一笔 readwrite 写回。代价是两笔事务之间不原子——需要原子性时用"版本字段/校验再写"这类乐观并发手段兜底。
- **姿势三（Dexie 专属）**：`Dexie.waitFor(promise)` 能在事务内等外部 Promise——原理是不停向事务发"保活"空请求。这是逃生舱不是常规姿势：它让事务持锁时间变长，阻塞其他写事务，见[包装库与生态](./wrappers-ecosystem)。

这个坑**换库不换命**：idb 的 README 原话警告"不要在事务开始与结束之间 await 其他东西，否则事务会在你完成前关闭"；Dexie 事务内 await 非 Dexie Promise 同样会失活。包装库改善的是语法，改不了规范级的事务生命周期。

## 五、durability：complete 到底承诺了什么

`transaction()` 第三参数的 `durability` 是**落盘语义提示**（hint），三个取值（MDN 定义直译）：

| 取值 | `complete` 事件的含义 | 适用 |
| --- | --- | --- |
| `"strict"` | **已验证写入持久存储介质**（刷盘确认）后才算提交成功 | 不可重算的关键数据：用户创作内容、迁移落点、账本 |
| `"relaxed"` | 改动**交到操作系统写缓冲**即算提交成功，不等物理刷盘 | 缓存、可重建数据、频繁小事务——绝大多数场景 |
| `"default"` | 交给浏览器对该存储桶的默认策略（**不指定时的默认值**） | 无特殊要求时 |

现状（核于 2026-07）：

- **Chromium：Chrome 121 起默认策略就是 relaxed**（此前为 strict）。官方博客给出的动机是性能——实测提速**3 到 30 倍**，并明确建议绝大多数开发者**无需任何行动**。
- **Firefox 自版本 40 起**就采用宽松落盘语义（`complete` 在数据交给 OS 后、物理刷盘前触发）。
- 推论：**`tx.oncomplete` ≠ 数据已在磁盘上**。操作系统通常几秒内刷盘，但"提交成功后设备立刻断电"窗口里 relaxed 事务可能丢——接受不了就显式声明：

```js
// 关键数据显式换刷盘确认：更慢，但 complete 后数据确定已持久化
const tx = db.transaction("ledger", "readwrite", { durability: "strict" });
```

注意 durability 是**提示**：规范允许浏览器按自身策略处理，跨浏览器不要把它当硬合同，但 Chromium 系对 strict/relaxed 有明确实现。

## 六、错误冒泡、默认中止与 abort()

事务级的三个事件、以及错误如何传播，决定了你的错误处理架构：

```js
const tx = db.transaction("todos", "readwrite");
const store = tx.objectStore("todos");

const req = store.add({ id: 1, title: "重复主键测试" });
req.onerror = (event) => {
  // 请求级：最先收到错误（如 ConstraintError）
  if (req.error?.name === "ConstraintError") {
    event.preventDefault(); // ⭐ 取消默认行为=中止事务，让事务继续
    event.stopPropagation(); // 可选：不再冒泡到 tx.onerror / db.onerror
    console.warn("该条已存在，跳过");
  }
};

tx.onerror = () => console.error("事务内有请求失败：", tx.error);
tx.onabort = () => console.error("事务被中止：", tx.error); // 配额超限也走这里
tx.oncomplete = () => console.log("整笔落库");
```

必须刻进肌肉记忆的语义：

- **错误路径**：`error` 事件从 request 冒泡到 transaction 再到 database。**未被 `preventDefault()` 的错误，其默认行为就是中止事务**——`stopPropagation()` 只是不让上层监听到，救不了事务。
- **回调里抛异常同样中止事务**：请求的 `success`/`error` 回调里未捕获的 throw 会 abort 整笔事务——事件回调不是安全沙箱。
- **中止即全量回滚**：包括事务内**已经触发过 `success` 的请求**。所以"逐请求乐观更新 UI、事务失败再回滚 UI"需要你自己实现补偿。
- **`tx.abort()`**：业务层主动放弃（例如校验中途发现不一致）；中止后 `tx.error` 为 `null`（不是错误导致的）。
- **失败来源清单**（触发 `abort`）：未处理的请求错误、显式 `abort()`、回调抛异常、磁盘 I/O 失败、**配额超限**（`QuotaExceededError`，处置策略见浏览器章[配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction)）、进程崩溃（这种连 `abort` 事件都没有）。

## 七、两个生命周期陷阱

- **别把写入绑在 `beforeunload`/`unload` 上**：MDN 明确警告——浏览器随时可能被用户退出，unload 阶段开的事务不保证完成。正确做法是**数据一变就写**（正常运行期持久化），unload 时最多提示"有未保存内容"。
- **连接意外关闭**：磁盘错误、用户在设置里清站点数据等场景下，所有在途事务以 `AbortError` 中止，连接随后收到 `close` 事件——需要善后（提示用户/重开连接）就监听 `db.onclose`，多标签页场景的正常关闭协调见[版本与多标签页](./versioning-multitab)。

下一页进入数据面：键与 keyPath 的设计、add/put/getAll 家族、索引与游标的完整用法——[CRUD、索引与游标](./crud-index-cursor)。
