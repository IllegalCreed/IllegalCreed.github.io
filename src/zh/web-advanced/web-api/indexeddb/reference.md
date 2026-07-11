---
layout: doc
outline: [2, 3]
---

# 参考：API 速查 / 选型 / 易错点

> 基于 IndexedDB 3.0（W3C 现行草案）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **接口全景**：`IDBFactory`（`indexedDB` 入口）/ `IDBOpenDBRequest` / `IDBDatabase`（连接）/ `IDBTransaction` / `IDBRequest` / `IDBObjectStore` / `IDBIndex` / `IDBCursor`(+`WithValue`) / `IDBKeyRange` / `IDBVersionChangeEvent`。
- **打开**：`indexedDB.open(name, version?)` → `upgradeneeded`（建/改 schema 唯一场所）→ `success`；`deleteDatabase(name)`；`databases()`（3.0）；window/Worker/SW 全可用。
- **版本号**：从 1 起无符号整数、小数取整、只增不减；低于现存版本 open 抛 `VersionError`。
- **事务三模式**：`readonly`（可并发）/ `readwrite`（作用域重叠串行）/ `versionchange`（独占、仅升级触发）；`transaction(stores, mode, { durability })`，**创建即启动、自动提交**。
- **失活铁律**：事务只在"创建任务 + 各请求 success/error 回调任务"活跃；**中途 await 非 IDB 异步 → 自动提交 → 续用抛 `TransactionInactiveError`**（换 idb/Dexie 不换命）。
- **durability**：`default`/`strict`（刷盘确认）/`relaxed`（交 OS 即算）；**Chromium 默认 relaxed（Chrome 121 起）**、Firefox 亦宽松；`complete` ≠ 已刷盘。
- **写**：`add`（键存在抛 `ConstraintError`）/ `put`（upsert）/ `delete(key|range)` / `clear`；非法键 `DataError`、不可克隆值 `DataCloneError` **同步抛**。
- **读**：`get` / `getKey` / `getAll(query?, count?)` / `getAllKeys` / `count`；查不到 `get` 返回 `undefined` 不报错。
- **键类型序**：`number < Date < string < binary < array`；`boolean/null/undefined/对象`非法。
- **keyPath × autoIncrement** 四组合；自增只增不减、删记录不回收、封顶 2^53。
- **索引**：`createIndex(name, keyPath, { unique, multiEntry })` 仅升级期；`unique` 撞存量致升级失败；`multiEntry` 展开数组元素；复合 `["a","b"]` 按数组序、缺字段不入索引。
- **IDBKeyRange**：`only` / `lowerBound(x, open?)` / `upperBound(y, open?)` / `bound(x, y, lOpen?, uOpen?)`；`open=true` 不含端点；`includes(key)`。
- **游标**：`openCursor`（带值、可改删）/ `openKeyCursor`（只键、更快、不可改删）；方向 `next`/`prev`/`nextunique`/`prevunique`；推进 `continue(key?)`/`advance(n)`/`continuePrimaryKey`（仅索引游标）。
- **getAll vs 游标**：getAll 一次物化全部（内存峰值）；游标逐条低内存但每条一往返；`getAllRecords()`（3.0、实验性）补主键 + 倒序。
- **多标签页**：升级被旧连接挡 → 升级侧 `blocked`；旧连接侧收 `versionchange` → 应 `db.close()`；黄金搭档 = `onversionchange→close+提示刷新`。
- **错误**：request→transaction→database 三级冒泡；**未 `preventDefault()` 的错误默认中止事务**；`stopPropagation` 只拦冒泡拦不住中止；配额超限走 `onabort`。
- **生态**：[idb](https://github.com/jakearchibald/idb)（最薄 Promise 镜像 + `tx.done` + async 迭代游标）/ [Dexie](https://dexie.org/)（查询链 + `liveQuery` 响应式 + 声明式迁移）；缓存三五值仍用 localStorage。
- **定位/配额只链接**：它是什么、和 OPFS/Web Storage 怎么选、能存多大何时被清 → [浏览器存储章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)（本叶不重复）。

## 一、接口全景

| 接口 | 职责 |
| --- | --- |
| `IDBFactory` | 顶层入口，即 `window.indexedDB` / `WorkerGlobalScope.indexedDB`；`open`/`deleteDatabase`/`databases`/`cmp` |
| `IDBOpenDBRequest` | `open`/`deleteDatabase` 返回的请求；额外有 `upgradeneeded`/`blocked` 事件 |
| `IDBDatabase` | 一个数据库连接；`transaction()`/`createObjectStore()`/`close()`；`versionchange`/`close`/`abort` 事件 |
| `IDBTransaction` | 事务；`objectStore()`/`commit()`/`abort()`；`complete`/`error`/`abort` 事件 |
| `IDBRequest` | 通用请求；`result`/`error`/`readyState`/`transaction`/`source`；`success`/`error` 事件 |
| `IDBObjectStore` | 对象存储；CRUD + 索引管理 + 游标 |
| `IDBIndex` | 二级索引；与 store 同款读 API，键为索引键 |
| `IDBCursor` / `IDBCursorWithValue` | 游标（后者带 `value`）；遍历与原位改删 |
| `IDBKeyRange` | 键范围；四工厂 + `includes` |
| `IDBVersionChangeEvent` | `upgradeneeded`/`versionchange` 事件对象，带 `oldVersion`/`newVersion` |

## 二、IDBFactory 与打开/删除

| API | 说明 |
| --- | --- |
| `indexedDB.open(name, version?)` | 打开/建库/升级；返回 `IDBOpenDBRequest`；不传 version 则打开现存最高版本（新库为 1） |
| `indexedDB.deleteDatabase(name)` | 删库；返回 `IDBOpenDBRequest`；被其他连接 `blocked` |
| `indexedDB.databases()` | 列出当前源的库 `[{ name, version }]`（3.0，用前查 Firefox 兼容） |
| `indexedDB.cmp(a, b)` | 比较两个键的顺序，返回 `-1`/`0`/`1` |

`open` 事件流：`upgradeneeded`（仅建库/升版本时）→ `success`；异常时 `error`；被旧连接挡时 `blocked`。

## 三、事务

### 3.1 模式

| 模式 | 能力 | 并发 |
| --- | --- | --- |
| `readonly` | 只读 | 多个可同时跑（含作用域重叠） |
| `readwrite` | 读 + 写既有 store | 作用域重叠者按创建序串行；不重叠可并行 |
| `versionchange` | 一切（含建/删 store 与索引） | 独占全库；**仅 `open` 升级触发**，不可手动创建 |

### 3.2 durability

| 取值 | `complete` 含义 | 备注 |
| --- | --- | --- |
| `"default"` | 交给浏览器桶默认策略 | 不指定时的默认 |
| `"strict"` | 已验证写入持久介质（刷盘确认） | 关键不可重算数据 |
| `"relaxed"` | 改动交到 OS 写缓冲即算成功 | **Chrome 121 起为默认**、Firefox 40 起亦宽松；快 3~30 倍 |

### 3.3 成员与生命周期

| 成员 | 说明 |
| --- | --- |
| `db`/`mode`/`durability`/`objectStoreNames` | 只读属性 |
| `error` | 失败时的 `DOMException`；未完成/成功提交/手动 `abort` 时为 `null` |
| `objectStore(name)` | 取作用域内 store；越界 `NotFoundError` |
| `commit()` | 加速收尾（3.0）；通常无需——自动提交才是常态 |
| `abort()` | 手动回滚全部改动 |
| `complete`/`error`/`abort` 事件 | 整笔成功 / 内部请求出错冒泡 / 中止；error 与 abort 续冒泡至 `IDBDatabase` |

**活跃窗口**：创建任务 + 各请求 `success`/`error` 回调任务；其余任务失活，失活期发请求抛 `TransactionInactiveError`。**自动提交**：活跃期无新请求且无未决请求即提交。

## 四、IDBObjectStore

| 成员 | 签名 / 说明 |
| --- | --- |
| `keyPath` / `autoIncrement` / `indexNames` / `name` / `transaction` | 属性（`name` 可写） |
| `add(value, key?)` | 只插入；键存在抛 `ConstraintError` |
| `put(value, key?)` | upsert；存在即整条覆盖 |
| `delete(key\|range)` | 删；幂等 |
| `clear()` | 清空 store |
| `get(query)` / `getKey(query)` | 首个匹配值 / 键；不存在返回 `undefined` |
| `getAll(query?, count?)` / `getAllKeys(query?, count?)` | 批量值 / 键数组 |
| `getAllRecords(options?)` | `{ key, primaryKey, value }` 数组，支持 `{ query, count, direction }`（**3.0、实验性、非 Baseline**） |
| `count(query?)` | 计数，不物化值 |
| `openCursor(query?, dir?)` / `openKeyCursor(query?, dir?)` | 值游标 / 键游标 |
| `createIndex(name, keyPath, options?)` | 建索引；**仅升级事务**，否则 `InvalidStateError` |
| `index(name)` / `deleteIndex(name)` | 取索引 / 删索引（删仅升级期） |

**keyPath × autoIncrement 组合**：无/无=显式传键；有/无=键取自属性；无/有=自动生成；有/有=有属性则用、无则生成并写回。

## 五、键与 IDBKeyRange

**合法键**：数字（非 `NaN`）、`Date`、字符串、二进制、及其数组；跨类型序 `number < Date < string < binary < array`。

| 工厂 | 含义 |
| --- | --- |
| `IDBKeyRange.only(v)` | `key = v` |
| `IDBKeyRange.lowerBound(x, open?)` | `key >= x`；`open=true` → `> x` |
| `IDBKeyRange.upperBound(y, open?)` | `key <= y`；`open=true` → `< y` |
| `IDBKeyRange.bound(x, y, lOpen?, uOpen?)` | `x ~ y` 区间，open 各控端点开闭 |
| 实例 `lower`/`upper`/`lowerOpen`/`upperOpen` / `includes(key)` | 只读回显 / 命中判断 |

## 六、游标

| | `openCursor` | `openKeyCursor` |
| --- | --- | --- |
| 返回 | `IDBCursorWithValue`（有 `value`） | `IDBCursor`（无 `value`） |
| `update`/`delete` | 可 | **不可**（`InvalidStateError`） |
| 开销 | 物化值 | 更快（不读值） |

| 方向 | 含义 |
| --- | --- |
| `next` | 升序（默认），含重复 |
| `prev` | 降序，含重复 |
| `nextunique` | 升序、跳过重复索引键（仅索引有意义） |
| `prevunique` | 降序、跳过重复索引键 |

| 成员 | 说明 |
| --- | --- |
| `key`/`primaryKey`/`value`/`direction`/`source`/`request` | 当前键 / 主键 / 值（仅 WithValue）/ 方向 / 来源 / 请求 |
| `continue(key?)` | 下一条 / 跳到不小于 key |
| `advance(n)` | 跳过 n 条 |
| `continuePrimaryKey(key, primaryKey)` | **仅索引游标、仅 next/prev**；断点续扫 |
| `update(value)` | 原位改（不能改主键，否则 `DataError`） |
| `delete()` | 原位删 |

迭代：每次推进触发一次 `success`，`result` 为 `null` 表示扫完。

## 七、结构化克隆类型边界

| 能原样存取 | 存不了 / 变形 |
| --- | --- |
| 原始值、普通对象、数组 | **函数**（`DataCloneError`） |
| `Date`、`RegExp` | **DOM 节点**（`DataCloneError`） |
| `Map`、`Set` | `Error`（跨浏览器不一致） |
| `Blob`、`File` | getter/setter、属性描述符（丢失） |
| `ArrayBuffer`、TypedArray | 原型链、类方法（类实例取出变普通对象） |

存取皆深拷贝——无引用共享；类实例降级为普通对象。完整定位说明见[浏览器存储章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)。

## 八、错误类型速查

| 错误 | 触发场景 |
| --- | --- |
| `VersionError` | `open` 的 version 低于现存版本 |
| `TransactionInactiveError` | 对失活事务发请求（**await 非 IDB 异步后的头号错**） |
| `ConstraintError` | `add` 键已存在；写入违反 `unique` 索引；自增超 2^53 |
| `DataError` | 非法键类型；游标 `update` 改动了主键；keyPath 冲突 |
| `DataCloneError` | 值含函数 / DOM 节点等不可克隆内容 |
| `NotFoundError` | 访问不存在的 store / 作用域外 store |
| `InvalidStateError` | 非升级期 `createIndex`/`deleteIndex`；连接已关闭 |
| `InvalidAccessError` | 空作用域开事务；对象存储游标调 `continuePrimaryKey` |
| `QuotaExceededError` | 超配额——经 `tx.onabort` 收到（见[配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction)） |
| `AbortError` | 事务被中止（含浏览器关闭时的在途事务） |

## 九、原生 vs idb vs Dexie 对比

| 维度 | 裸写原生 | [idb](https://github.com/jakearchibald/idb) | [Dexie](https://dexie.org/) |
| --- | --- | --- | --- |
| 体积 | 0 | ~1~2 KB | 几十 KB |
| 范式 | 事件回调 | Promise 镜像（心智不变） | 前端 ORM（自有抽象） |
| 事务完成 | 听 `oncomplete` | `tx.done` Promise | async 事务 + 自动回滚 |
| 游标 | 事件 + `continue` | `for await` 异步迭代 | 查询链隐藏游标 |
| 查询 | index + KeyRange 手拼 | 同原生（Promise 版） | `where().equals().and()` 链式 |
| 迁移 | 手写 `switch(oldVersion)` | `upgrade` 回调（同原生） | `version().stores().upgrade()` 声明式 |
| 响应式 | 无（自搭 `BroadcastChannel`） | 无 | **`liveQuery` + 框架 hooks** |
| await 失活坑 | 有 | **有**（规范级） | 有（`Dexie.waitFor` 逃生舱） |
| 适用 | 学标准、极致零依赖 | 保留原生心智、消灭样板 | 查询链 / 响应式 / 迁移 / 云同步 |

选型：最薄壳 → idb；要查询引擎与响应式 → Dexie；缓存三五值 → localStorage；大二进制字节级读写 → OPFS。

## 十、易错点清单

- **事务内 await 非 IDB 异步**：`await fetch()` 后续用抛 `TransactionInactiveError`——异步准备放事务外，或 `Dexie.waitFor`（见[事务模型](./guide-line/transactions)）。
- **把 `add` 当 `put` 用**：重复键抛 `ConstraintError`——需 upsert 用 `put`。
- **想"部分更新"直接 put 半个对象**：put 是整条覆盖——先 `get` 改再 `put`。
- **非升级期建索引**：`createIndex` 抛 `InvalidStateError`——只能在 `upgradeneeded` 里建。
- **给已有重复数据建 unique 索引**：升级事务直接失败、版本升不上去——先清洗再建。
- **误信 `complete` = 已刷盘**：默认 relaxed 只保证交给 OS——关键数据显式 `{ durability: "strict" }`。
- **版本号发布倒退**：线上到 v5 又发 v4 代码 → 老用户 `VersionError`——版本只增不减。
- **`open` 传小数**：`2.5` 被取整为 2，可能不触发升级——用整数。
- **不写 `onversionchange`**：别的标签页永远 `blocked` 升不了级——拿到连接就 `db.onversionchange = () => db.close()`。
- **忘了错误默认中止事务**：一个请求错就整笔回滚——想继续要在错误回调 `event.preventDefault()`。
- **`getAll` 拉超大集合**：一次物化内存峰值——分块 `getAll(range, count)` 或游标。
- **只要键却 `getAll` 载值**：浪费——用 `getAllKeys` / `openKeyCursor`。
- **key 游标上调 `update`/`delete`**：`InvalidStateError`——要改删用 `openCursor`。
- **游标 `update` 改主键**：`DataError`——改主键只能 delete + add。
- **索引游标里改被索引字段致重复遍历**：记录在索引中移位可能被再次撞见——处理逻辑要幂等。
- **拿类实例当值存**：取回是普通对象、方法与 `instanceof` 尽失——存纯数据、取出重建。
- **存函数 / DOM 节点**：`DataCloneError`——序列化或改存可克隆表示。
- **把写入绑 `beforeunload`**：unload 事务不保证完成——正常运行期就写。
- **闲置持有事务等用户操作**：事务早自动提交了——事务只在活跃窗口内一气呵成。
- **依赖 `getAllRecords()` 做生产**：实验性、非 Baseline——留游标回退。

## 十一、权威链接

- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) —— 接口总览与指南入口
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) —— 官方完整教程（事务失活警告原文）
- [MDN: IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction) ｜ [durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability) —— 事务与落盘语义
- [MDN: IDBObjectStore](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore) ｜ [IDBCursor](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor) ｜ [IDBKeyRange](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange) —— 数据面 API
- [Chrome for Developers: IndexedDB durability mode now defaults to relaxed](https://developer.chrome.com/blog/indexeddb-durability-mode-now-defaults-to-relaxed) —— Chrome 121 默认改 relaxed 公告
- [Indexed Database API 3.0 (W3C Editor's Draft)](https://w3c.github.io/IndexedDB/) —— 规范原文（`getAllRecords` 等新提案）
- [w3c/IndexedDB](https://github.com/w3c/IndexedDB) —— 规范仓库与 issue
- [jakearchibald/idb](https://github.com/jakearchibald/idb) —— 最薄 Promise 包装库
- [Dexie.js](https://dexie.org/) ｜ [API Reference](https://dexie.org/docs/API-Reference) —— 全功能库文档
- 本站相邻内容：[浏览器章 · IndexedDB 定位与 OPFS](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs) ｜ [配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction) ｜ [Web Storage API 叶](/zh/web-advanced/web-api/web-storage/)
