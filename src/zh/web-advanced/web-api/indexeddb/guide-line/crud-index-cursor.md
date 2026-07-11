---
layout: doc
outline: [2, 3]
---

# CRUD、索引与游标

> 基于 IndexedDB 3.0（W3C 现行草案）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **合法键类型**：数字（`NaN` 除外）、`Date`（有效日期）、字符串、二进制（`ArrayBuffer`/TypedArray）、以及由它们组成的**数组**；`boolean`/`null`/`undefined`/普通对象**不能当键**（抛 `DataError`）。
- **跨类型排序**：`number < Date < string < binary < array`（同类型内再比值；数组逐元素比较）。
- **键的两种来源**：in-line（`keyPath` 指向记录属性）vs out-of-line（`add/put` 第二参数显式传）；**设了 keyPath 就不许再传显式 key**（`DataError`）。
- **`autoIncrement` 键生成器**：从 1 起、只增不减，**删除记录/清空 store 都不会重置计数器**；显式写入更大的键会把计数器推上去；计数器上限 2^53，再 add 抛 `ConstraintError`。
- **`add` vs `put`**：add 是"只插入"，键已存在抛 `ConstraintError`；**put 是 upsert**（存在即整体覆盖）。没有"部分更新"原语——改一个字段也要读出、改、put 回去。
- **同步抛的两类错**：键不合法/keyPath 冲突抛 `DataError`；值不可结构化克隆（函数、DOM 节点）抛 `DataCloneError`——都在**调用当下**同步抛，不走事件。
- **读家族**：`get`（首个匹配值）/ `getKey`（只取键）/ `getAll(query?, count?)` / `getAllKeys(query?, count?)` / `count(query?)`；查不到时 `get` 结果是 `undefined`，**不报错**。
- **索引只能在升级事务里建**：`store.createIndex(name, keyPath, { unique, multiEntry })`，其余时机抛 `InvalidStateError`；用时 `store.index(name)` 再发查询。
- **`unique: true`**：写入重复索引值抛 `ConstraintError`；**给已有数据建 unique 索引**时若存量已冲突，升级事务直接失败——上线前先清洗数据。
- **`multiEntry: true`**：keyPath 指向数组属性时，**每个元素单独建一条索引项**——"按标签查文章"的标准解法；multiEntry 不能与数组 keyPath（复合索引）同用。
- **复合索引**：`keyPath: ["a", "b"]`，键是数组、按元素序比较；查询传数组键/数组键范围；**记录缺任一字段则不进该索引**（普通索引缺字段同理）。
- **`IDBKeyRange` 四工厂**：`only(v)` / `lowerBound(x, open?)` / `upperBound(y, open?)` / `bound(x, y, lowerOpen?, upperOpen?)`；`open=true` 表示**不含**端点；实例方法 `includes(key)` 判断命中。
- **游标两口**：`openCursor(query?, direction?)` 带值（`IDBCursorWithValue`）；`openKeyCursor` 只有键（更快，**不能** `update`/`delete`）。
- **方向四值**：`next`（升序，默认）/ `prev`（降序）/ `nextunique` / `prevunique`（跳过重复索引键；对象存储主键本就唯一，unique 变体只对索引有意义）。
- **游标推进**：`continue(key?)`（下一条/跳到指定键）/ `advance(n)`（跳过 n 条）/ `continuePrimaryKey(key, primaryKey)`（**仅索引游标 + next/prev 方向**，断点续扫神器）；每推进一次触发一次 `success`，`result` 为 `null` 表示扫完。
- **游标写**：`cursor.update(value)` 原位改（**不能改主键**，否则 `DataError`）、`cursor.delete()` 原位删；迭代中把被索引字段改到游标前方会导致该记录**被再次访问**——防重复处理。
- **getAll vs 游标**：getAll 一次性物化全部结果（大数据集内存峰值）；游标惰性逐条但**每条一次事件循环往返**（慢在往返不在读）。折中：`getAll(range, count)` 分块。
- **`getAllRecords()`**（3.0 草案新提案，实验性、非 Baseline）：一把返回 `{ key, primaryKey, value }` 数组，支持 `direction`——补齐"getAll 不能倒序"的短板，生产暂勿依赖。

## 一、键：IndexedDB 数据设计的地基

### 1.1 什么能当键、怎么排序

IndexedDB 的一切查询（get/范围/游标/索引）都建立在**键有全序**之上。合法键与排序规则：

| 类型 | 说明 | 跨类型顺序 |
| --- | --- | --- |
| 数字 | `NaN` 非法；`-Infinity`/`Infinity` 合法 | 最小 |
| `Date` | 取时间戳比较；无效日期非法 | 第 2 |
| 字符串 | 按 UTF-16 码元序 | 第 3 |
| 二进制 | `ArrayBuffer`/TypedArray，按字节序 | 第 4 |
| 数组 | 元素本身须是合法键；**逐元素**比较，前缀更短者小 | 最大 |

`boolean`、`null`、`undefined`、普通对象都不是合法键，用了抛 `DataError`。数组键是复合索引与"前缀范围查询"的基础（见第四节）。

### 1.2 keyPath 与 autoIncrement 的四种组合

建 store 时的两个选项决定键从哪来（MDN 官方组合表）：

| `keyPath` | `autoIncrement` | 行为 |
| --- | --- | --- |
| 无 | 无 | 存任意值，但 `add/put` 必须**显式传 key**（out-of-line） |
| 有 | 无 | 只能存对象，键取自 `keyPath` 指向的属性（in-line） |
| 无 | 有 | 存任意值；不传 key 时自动生成 |
| 有 | 有 | 只能存对象；对象带该属性则用之，缺失则**生成键并写回该属性** |

```js
// 升级事务内建 store 的三种典型形态
db.createObjectStore("settings"); // out-of-line：add(value, "theme")
db.createObjectStore("users", { keyPath: "id" }); // in-line：记录自带 id
db.createObjectStore("logs", { keyPath: "id", autoIncrement: true }); // 自增
```

**键生成器的脾气**（都来自规范）：从 1 开始；**只增不减**——删记录、清空 store 都不会让号码回收复用；显式写入一个更大的数字键会把计数器**推**到它之后；计数器封顶 2^53，之后不传 key 的 `add` 抛 `ConstraintError`（仍可显式传更大的非整数/其他类型键）。

## 二、写入：add、put、delete、clear

```js
const tx = db.transaction("users", "readwrite");
const store = tx.objectStore("users");

store.add({ id: 1, name: "张三" }); // 只插入：id=1 已存在则请求报 ConstraintError
store.put({ id: 1, name: "张三改" }); // upsert：存在即整条覆盖
store.delete(1); // 按键删；键不存在也算成功（幂等）
store.delete(IDBKeyRange.bound(100, 200)); // 也接受键范围：区间删除
store.clear(); // 清空整个 store
```

四个工程要点：

- **put 是"整条替换"不是"合并补丁"**：想改一个字段，标准流程是 `get` → 改对象 → `put`（同一事务内完成保证原子）；Dexie 的 `update()` 帮你封装的正是这套。
- **add 的价值是"防覆盖"**：导入数据、消息去重等"存在即跳过"的场景用 add + 捕获 `ConstraintError`（记得 `event.preventDefault()` 保事务，见[事务模型](./transactions)）。
- **两类错误是同步抛的**：传了非法键（`DataError`）、值含函数/DOM 节点（`DataCloneError`）在**调用瞬间**就 throw，而不是走请求的 `error` 事件——try/catch 与 onerror 要两手都有。
- **值在调用当下即被克隆**：`put(obj)` 之后再改 `obj` 不影响入库内容；取出来的也是深拷贝副本——克隆边界的工程细节见[包装库与生态](./wrappers-ecosystem)第五节。

## 三、读取：get 家族

```js
const store = db.transaction("users").objectStore("users");

store.get(1); // 值；不存在 → result 为 undefined（不报错）
store.getKey(IDBKeyRange.lowerBound(100)); // 首个匹配的【键】
store.getAll(); // 全部值（小心内存，见第六节）
store.getAll(IDBKeyRange.bound(1, 50), 20); // 范围 + 最多 20 条
store.getAllKeys(null, 100); // 只要键：轻量得多
store.count(IDBKeyRange.upperBound(50)); // 计数：不物化任何值
```

- `get` 系列**分不清"值是 undefined"和"记录不存在"**——需要区分时用 `count(key)` 或 `getKey(key)` 判存在性。
- `count`/`getAllKeys`/`getKey` 不载入值，能用轻量版就别 `getAll`。
- 所有读方法都接受**键或键范围**作为 query 参数——`IDBKeyRange` 是贯穿全 API 的查询语言（第五节）。

## 四、索引：给对象另开检索维度

对象存储只按主键有序；要按其他字段查，就建**索引**——一个"以该字段值为键、指回主键"的影子有序结构。

### 4.1 创建与使用

```js
// ⚠️ 只能在 onupgradeneeded 的升级事务里建
request.onupgradeneeded = () => {
  const db = request.result;
  const store = db.createObjectStore("articles", { keyPath: "id" });

  store.createIndex("by_author", "author"); // 普通索引（可重复）
  store.createIndex("by_slug", "slug", { unique: true }); // 唯一索引
  store.createIndex("by_tag", "tags", { multiEntry: true }); // 数组展开索引
  store.createIndex("by_author_date", ["author", "publishedAt"]); // 复合索引
};

// 查询时：先 index() 再用与 store 同款的读 API
const idx = db.transaction("articles").objectStore("articles").index("by_author");
idx.get("鲁迅"); // 该作者的【第一条】记录（按主键序）
idx.getAll("鲁迅"); // 该作者全部文章
idx.getAllKeys("鲁迅"); // 只要这些文章的主键
idx.count("鲁迅"); // 计数
```

### 4.2 三种索引选项的行为细节

- **`unique: true`**：事务内写入重复索引值 → 该请求 `ConstraintError`（未 preventDefault 则整笔中止）。**最大的坑在升级期**：对已有数据建 unique 索引，存量一旦有重复，`createIndex` 会让**整个升级事务失败**——版本升不上去。先游标清洗、再建索引。
- **`multiEntry: true`**：keyPath 指向数组属性时，数组**每个元素**各建一条索引项——`idx.getAll("前端")` 直接命中所有含该标签的记录。限制：multiEntry 索引的 keyPath 不能是数组（不能同时复合）。
- **复合索引 `["a", "b"]`**：索引键是 `[a值, b值]` 数组，按元素序排序，于是支持"先按 a 后按 b"的排序遍历与前缀范围查询：

```js
// 查"某作者 2024 年的文章"：数组键范围 = 复合索引的查询方式
const range = IDBKeyRange.bound(
  ["鲁迅", new Date("2024-01-01")],
  ["鲁迅", new Date("2025-01-01")],
  false,
  true, // 上界开区间：不含 2025-01-01
);
idx.getAll(range);
```

**共同暗坑**：记录缺失索引 keyPath 指向的字段（或值不是合法键）时，该记录**不会进入索引**——`idx.getAll()` 拿到的可能比 `store.getAll()` 少，这不是 bug 是语义。另外索引有**写放大**：每多一个索引，每次写入就多一份维护开销——按真实查询需求建，别"先都建上再说"。

## 五、IDBKeyRange：四个工厂读懂所有范围

| 工厂 | 含义 | 数学写法 |
| --- | --- | --- |
| `IDBKeyRange.only(v)` | 恰好等于 v | `key = v` |
| `IDBKeyRange.lowerBound(x)` | 从 x 起（含） | `key >= x` |
| `IDBKeyRange.lowerBound(x, true)` | x 之后（不含） | `key > x` |
| `IDBKeyRange.upperBound(y)` | 到 y 止（含） | `key <= y` |
| `IDBKeyRange.upperBound(y, true)` | y 之前（不含） | `key < y` |
| `IDBKeyRange.bound(x, y)` | 闭区间 | `x <= key <= y` |
| `IDBKeyRange.bound(x, y, true, true)` | 开区间 | `x < key < y` |

- 记忆锚点：**open 参数 = "开区间" = 不含端点**，默认 `false`（含）。
- 实例属性 `lower`/`upper`/`lowerOpen`/`upperOpen` 只读回显；`range.includes(key)` 判断任意键是否落在范围内。
- 字符串前缀查询的惯用法：`IDBKeyRange.bound("abc", "abc￿")` 近似"以 abc 开头"（`￿` 作哨兵上界，取排序最大的字符封顶）。

## 六、游标：逐条扫描与原位改写

`getAll` 解决"整段取回"，游标解决三类它做不了的事：**边扫边改/删**、**只取部分后提前停**、**低内存遍历超大集合**。

### 6.1 基本迭代

```js
const store = db.transaction("articles", "readwrite").objectStore("articles");

store.openCursor(IDBKeyRange.lowerBound(100), "prev").onsuccess = (event) => {
  const cursor = event.target.result;
  if (!cursor) {
    console.log("扫完了"); // result 为 null = 迭代结束
    return;
  }
  console.log(cursor.key, cursor.value); // 当前键 / 当前值（深拷贝）

  if (cursor.value.draft) cursor.delete(); // 原位删除，游标位置不变
  cursor.continue(); // 推进：会再次触发本 onsuccess
};
```

游标对象上随时可读：`key`（当前位置的键；索引游标里是**索引键**）、`primaryKey`（主键）、`value`（仅 `openCursor`）、`direction`、`source`、`request`。

### 6.2 方向与两种游标

| | `openCursor` | `openKeyCursor` |
| --- | --- | --- |
| 返回 | `IDBCursorWithValue`（有 `value`） | `IDBCursor`（只有键） |
| 开销 | 每条物化值 | **不读值，更快** |
| `update()`/`delete()` | 可用 | **不可用**（`InvalidStateError`） |

方向四值：`next`（默认，升序）/`prev`（降序）/`nextunique`/`prevunique`。unique 变体在**索引**上跳过重复索引键（每个键只给一条）；对象存储主键本就唯一，unique 变体与普通方向无差别。

### 6.3 推进的三个动词

- `cursor.continue()`：下一条。
- `cursor.continue(key)`：直接跳到不小于 key 的位置（方向为 prev 时为不大于）——跳段扫描。
- `cursor.advance(n)`：无脑跳过 n 条——**偏移分页**的实现件。
- `cursor.continuePrimaryKey(indexKey, primaryKey)`：**仅索引游标、仅 next/prev 方向**（对象存储游标或 unique 方向调用抛 `InvalidAccessError`）。用途是**断点续扫**：记住上次的 `(索引键, 主键)` 二元组，下个事务从这继续，重复索引值再多也不怕。

### 6.4 原位写与它的坑

- `cursor.update(newValue)`：改当前记录；**改出来的主键必须与当前主键一致**，否则 `DataError`——想"改主键"只能 delete + add。
- 在**索引游标**迭代中 `update()` 修改了被索引字段：记录在索引里的位置随之移动，若移到游标行进方向的前方，**同一趟迭代会再次撞见它**——处理逻辑要幂等，否则可能反复处理甚至死循环。
- 游标请求也受事务生命周期管辖：每次 `continue()` 的 success 回调都是新的活跃窗口，但中途 `await fetch()` 一样让事务失活（见[事务模型](./transactions)）。

### 6.5 分页两式

```js
// 式一：偏移分页（简单，但 advance 仍要线性走过被跳过的条目）
let advanced = false;
store.openCursor().onsuccess = (e) => {
  const cursor = e.target.result;
  if (!cursor) return;
  if (!advanced && pageOffset > 0) {
    advanced = true;
    cursor.advance(pageOffset); // 跳过前 N 条，下次 success 直达页首
    return;
  }
  page.push(cursor.value);
  if (page.length < pageSize) cursor.continue();
};

// 式二：键集分页（keyset，推荐）——记住上页末键，range 直达，深页无惩罚
const range = lastKey == null ? null : IDBKeyRange.lowerBound(lastKey, true);
store.getAll(range, pageSize).onsuccess = (e) => {
  const rows = e.target.result;
  lastKey = rows.at(-1)?.id; // 供下一页使用
};
```

## 七、getAll vs 游标：取舍口径

| 维度 | `getAll(query, count)` | 游标 |
| --- | --- | --- |
| 内存 | **一次物化全部命中**——大集合内存峰值 | 每次只在手一条 |
| 速度 | 一次请求一次往返，引擎内部批量取，**通常更快** | **每条一次事件循环往返**，条数大时显著变慢 |
| 中途停止/跳跃 | 只能靠 count 截断 | `continue(key)`/`advance` 自由跳 |
| 边扫边写 | 不能 | `update`/`delete` 原位操作 |
| 倒序 | **不支持方向**（见下 getAllRecords） | `prev` 即可 |

MDN 的口径可以直接当结论用：**要"全部对象的数组"就 getAll；只看键或要逐条控制就游标**（键场景配 `getAllKeys`/`openKeyCursor` 更省——游标 `value` 是惰性物化的，不碰 value 就不产生克隆开销）。工程折中是**分块 getAll**：`getAll(range, 500)` 循环搬运，内存与往返次数各让一步。

**3.0 新提案 `getAllRecords()`**（对象存储与索引都有）：一次返回 `{ key, primaryKey, value }` 记录数组，且支持 `{ query, count, direction }` 选项——同时补上"getAll 拿不到主键"（索引场景）与"getAll 不能倒序"两块短板，"取最新 N 条"从此一行。**当前为实验性、非 Baseline**（部分浏览器未实现），生产使用前查兼容表，通用代码保留游标回退路径。

下一页解决"库怎么长大"：版本号、升级事务、以及多标签页同时开库的协调——[版本与多标签页](./versioning-multitab)。
