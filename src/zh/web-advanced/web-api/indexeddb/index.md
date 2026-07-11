---
layout: doc
---

# IndexedDB

IndexedDB 是**浏览器内建的事务型对象数据库**的完整 API：以对象存储（object store）+ 二级索引组织数据、以事务保证一致性、以版本化 schema 管理结构演进，配备键范围（`IDBKeyRange`）与游标（`IDBCursor`）两套查询原语，在 window、Web Worker、Service Worker 中全量可用。规范上 **IndexedDB 2.0 是 W3C Recommendation（2018）**，**3.0 为现行 Editor's Draft**——`commit()`、`databases()`、`durability` 提示已广泛落地，`getAllRecords()` 等最新提案仍在铺开。它的定位、与 OPFS 的对比、配额与驱逐规则已在[浏览器存储章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)讲透，本叶专注 **API 编程深度**：打开与升级、事务模型与自动提交深坑、CRUD/索引/游标、多标签页版本协调、以及 idb/Dexie 包装库生态。

## 评价

**优点**

- **浏览器里唯一的"真数据库"标准**：事务、索引、键范围、游标、版本化 schema 俱全，容量走 GB 级源配额，是离线优先应用与 Service Worker 数据层的事实标配
- **结构化克隆直接存对象**：`Date`/`Map`/`Set`/`Blob`/`ArrayBuffer` 原样进出、免 JSON 序列化，二进制与文件存取是一等公民
- **全环境可用**：window / Web Worker / Service Worker 共享同一套 API，重 I/O 可整体挪出主线程
- **结构演进有章法**：版本号 + 升级事务（versionchange）把"建表改表"约束在唯一入口，配合 `oldVersion` 迁移天梯可控地演进 schema
- **标准仍在活跃演进**：3.0 草案的显式 `commit()`、`databases()` 枚举、`durability` 落盘提示已广泛支持，`getAllRecords()`（键值一把取 + 方向控制）在路上

**局限**

- **API 人体工学出了名的差**：事件驱动的请求-回调范式与 async/await 天生打架，事务、升级、游标全是样板代码——实践中几乎必配包装库
- **事务自动提交是头号深坑**：事务在"控制权回到事件循环且无未决请求"时自动提交，`await fetch()` 等非 IDB 异步操作会让它失活，续用抛 `TransactionInactiveError`——用 idb/Dexie 也躲不开
- **没有查询语言**：无 SQL、无聚合、无 join，复杂查询要自己用索引 + 游标拼；全文检索、模糊匹配都得上层自建
- **多标签页要自己协调**：新版本升级会被老标签页的连接阻塞（blocked），`versionchange` 监听、主动 close、提示刷新这套礼仪缺一不可
- **性能特性要懂行**：逐条写各开事务、索引写放大、`getAll` 全量物化这些坑不踩过很难注意到；数据还受源配额与驱逐管辖（见[配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction)）

一句话选型：**前端需要"真数据库"（离线优先、大量结构化记录、索引查询）时就是 IndexedDB，且不要裸写**——要最薄的 Promise 壳选 [idb](https://github.com/jakearchibald/idb)，要查询链与响应式选 [Dexie](https://dexie.org/)；三五个偏好字段仍然是 localStorage 的活，文件语义的大二进制考虑 OPFS。

## 本叶地图

- [入门](./getting-started) —— 事件驱动心智模型（request-success-error）、open 与 onupgradeneeded、第一个库的完整流程、错误冒泡、与浏览器章/Web Storage 叶的分工
- [事务模型](./guide-line/transactions) —— 三模式与并发规则、作用域、生命周期与自动提交、**await 失活大坑（TransactionInactiveError）**、durability 三档、错误冒泡与 abort
- [CRUD、索引与游标](./guide-line/crud-index-cursor) —— 键类型与 keyPath/自增、add vs put、getAll 家族、unique/multiEntry/复合索引、IDBKeyRange 四工厂、游标方向与 continue/advance、getAll vs 游标取舍
- [版本与多标签页](./guide-line/versioning-multitab) —— 版本号规则、升级事务独占、迁移天梯、**blocked 与 versionchange 协调礼仪**、删除数据库、多标签页协调模式
- [包装库与生态](./guide-line/wrappers-ecosystem) —— 原生痛点清单、idb（Promise 镜像 + tx.done）、Dexie（查询链 + liveQuery + 迁移）、选型口径、Blob/二进制与克隆边界、性能模式
- [参考](./reference) —— 接口与方法速查表、事务模式/durability/KeyRange/游标方向表、错误类型表、原生 vs idb vs Dexie 对比、易错点清单、资源链接

## 文档地址

[MDN IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## GitHub 地址

[w3c/IndexedDB](https://github.com/w3c/IndexedDB)（规范仓库，Indexed Database API 3.0 Editor's Draft）

## 幻灯片地址

<a href="/SlideStack/indexeddb-slide/" target="_blank">IndexedDB</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=indexeddb" target="_blank" rel="noopener noreferrer">IndexedDB 测试题</a>
