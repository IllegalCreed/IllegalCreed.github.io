---
layout: doc
outline: [2, 3]
---

# 参考：API 表 / 事件 / 序列化边界 / 易错点

> 基于 WHATWG HTML 现行标准（Web storage 章）· 核于 2026-07

## 速查

- **入口**：`window.localStorage` / `window.sessionStorage`，同一 **Storage 接口**；访问属性本身即可能抛 `SecurityError`。
- **六成员**：`setItem(k, v)` / `getItem(k)` / `removeItem(k)` / `clear()` / `key(i)` / 只读 `length`——就这些。
- **读侧不抛错**：`getItem` 缺键 → `null`（非 `undefined`）；`key(i)` 越界 → `null`；`removeItem` 删缺键 → 静默。
- **setItem 三态**：新增 / 更新 / **值相同即无操作（不广播事件）**；`removeItem` 删缺键同为无操作。
- **只存字符串**：键值写入前强制 `String()`；对象 → `"[object Object]"`，数字/布尔读回是字符串。
- **写必 try-catch**：满时 `setItem` **同步抛 `QuotaExceededError`**；判错用 `e instanceof DOMException && e.name === "QuotaExceededError"`。
- **storage 事件头号考点**：只发**同源其他文档**，**发起页自己不触发**；监听挂 `window`。
- **事件五字段**：`key` / `oldValue` / `newValue` / `url` / `storageArea`。
- **null 矩阵**：新增 `oldValue=null`；删除 `newValue=null`；**`clear()` 三者全 `null`**。
- **sessionStorage 事件仅同页签内**（同源 iframe）——跨页签同步是 **localStorage 专利**。
- **JSON 丢形**：对象里 `undefined`/函数/`Symbol` 键被跳过、数组里变 `null`；`Date`→字符串；`Map`/`Set`/`RegExp`/`Blob`→`"{}"`；`NaN`/`Infinity`→`null`；`BigInt`/循环引用**抛 `TypeError`**。
- **属性式访问别用**：`localStorage.setItem = "x"` 会写库但读回仍是方法（原型遮蔽 + 枚举盲区 + 原型污染式风险）。
- **local vs session**：源共享持久 / 「页签+源」隔离关页即清；刷新与恢复页签**都不清** session。
- **历史坑**：旧 Safari 隐私模式配额 0、`setItem` 必抛；**现代统一为可写但关窗即清**。
- **工程封装**：TTL 信封 + 命名空间前缀 + TS 泛型 + 版本迁移 + SSR 守卫（详见 [模式页](./guide-line/patterns)）。
- **机制外链**：隔离/选型/配额/分区全在[浏览器章存储叶](/zh/base/browser/browser-storage/guide-line/web-storage-model)；保形/大容量/Worker → [IndexedDB](/zh/web-advanced/web-api/indexeddb/)。

## 一、Storage 接口 API 表

`localStorage` 与 `sessionStorage` 都是 Storage 接口实例，方法完全一致。

| 成员 | 签名 | 返回 | 关键语义 / 边界 |
| --- | --- | --- | --- |
| `length` | 只读属性 | `number` | 当前源在该存储区的键值对个数；含与原型成员同名的键 |
| `key(index)` | `index: number` | `string \| null` | 第 `index` 个键名；**越界返回 `null`**；**顺序由实现决定** |
| `getItem(key)` | `key: string` | `string \| null` | 值字符串；**缺键返回 `null`（非 `undefined`）**；不抛错 |
| `setItem(key, value)` | `key, value`（都强制转字符串） | `undefined` | 新增/更新；**值相同则无操作**；满时**同步抛 `QuotaExceededError`** |
| `removeItem(key)` | `key: string` | `undefined` | 删除键；**键不存在则静默无操作**，不抛错 |
| `clear()` | 无参 | `undefined` | 清空**当前源整个存储区**——会波及同源第三方脚本的键 |

补充语义：

- **访问入口本身可能抛 `SecurityError`**：用户禁站点数据、代码运行在 `data:` 等不透明源时，读 `window.localStorage` 属性即抛（与配额无关）。
- **强制字符串化**：`setItem(42, 99)` 实际存 `"42" → "99"`；键 `getItem` 时也要用字符串 `"42"`。
- **遍历原语**只有 `length` + `key(i)`；批量删除**先收集键名快照再删**（边遍历边删因索引前移漏项）；`Object.keys` 数不到与原型成员同名的键。
- **属性式访问**（`localStorage.foo`、`localStorage["foo"]`）三种写法可用但**不推荐**——原型遮蔽致读写不对称、枚举盲区、不可信键名的原型污染式风险。

## 二、storage 事件字段表

`window` 上监听 `storage` 事件；`StorageEvent` 继承 `Event`，加以下五个只读字段。

| 字段 | 类型 | 含义 | 何时为 `null` |
| --- | --- | --- | --- |
| `key` | `string \| null` | 变动的键名 | **`clear()` 时为 `null`** |
| `oldValue` | `string \| null` | 变动前的值 | **新增键时**、`clear()` 时为 `null` |
| `newValue` | `string \| null` | 变动后的值 | **删除键时**、`clear()` 时为 `null` |
| `url` | `string` | 发起修改的**文档地址** | —— |
| `storageArea` | `Storage` | 被修改的 Storage 对象（用于区分 local/session） | —— |

### 触发规则

- 只发给**同源的"其他"文档**——**发起修改的页面自己不触发**（头号考点）。
- 仅**真正发生修改**时触发：写相同值、删不存在的键因"无变化"而**不触发**。
- **localStorage**：同源**其他页签/窗口**收到 → 原生跨页签同步机制。
- **sessionStorage**：仅**同页签内**其他同源文档（如 iframe）收到；不同页签各持独立副本，**跨页签收不到**。

### 操作 → 字段取值矩阵

| 操作 | `key` | `oldValue` | `newValue` |
| --- | --- | --- | --- |
| `setItem`（新增键） | 键名 | `null` | 新值 |
| `setItem`（更新值） | 键名 | 旧值 | 新值 |
| `setItem`（值相同） | 不触发事件 | | |
| `removeItem`（键存在） | 键名 | 旧值 | `null` |
| `removeItem`（键不存在） | 不触发事件 | | |
| `clear()` | `null` | `null` | `null` |

工程推论：`e.newValue === null` = 该键被删；`e.key === null` = 整区被清空。

## 三、序列化边界表

Web Storage 只存字符串，结构化数据靠 `JSON.stringify` / `JSON.parse` 往返，边界如下（均实测）。

| 输入 | `JSON.stringify` 结果 | `JSON.parse` 回来 | 定性 |
| --- | --- | --- | --- |
| 对象（直接 `setItem` 不经 JSON） | `String(obj)` = `"[object Object]"` | —— | 数据实质丢失 |
| `undefined`（直接 `setItem`） | `String(undefined)` = `"undefined"` | `JSON.parse` 抛 `SyntaxError` | 读侧爆炸 |
| 数字 / 布尔 | `"1"` / `"true"` | 字符串 | 需 `Number()` / 显式比较 |
| 对象属性值 `undefined`/函数/`Symbol` | **键被跳过** | 键不存在 | 静默丢 |
| 数组元素 `undefined`/函数/`Symbol` | `null` | `null` | 静默变形 |
| `Date` | ISO 8601 字符串 | **字符串**（非 `Date`） | 丢类型（reviver 恢复） |
| `Map` / `Set` | `"{}"` | 空对象 | 全丢 |
| `RegExp` / `Error` | `"{}"` | 空对象 | 全丢 |
| `Blob` / `ArrayBuffer` | `"{}"` | 空对象 | 全丢 |
| `TypedArray`（如 `Uint8Array`） | `{"0":..,"1":..}` | 索引键对象 | 变形 |
| `NaN` / `Infinity` | `null` | `null` | 静默变形 |
| `BigInt` | **抛 `TypeError`** | —— | 显式炸 |
| 循环引用 | **抛 `TypeError`** | —— | 显式炸 |

- `JSON.parse(null)` **不抛错**（返回 `null`）——`getItem` 缺键喂给 `parse` 侥幸不炸，但脏数据照炸，**`parse` 仍须 try-catch**。
- JSON 往返产出**深拷贝**，与原对象无引用关系。
- 保形需求（`Date`/`Map`/二进制原样存取）→ [IndexedDB](/zh/web-advanced/web-api/indexeddb/) 结构化克隆。

## 四、localStorage vs sessionStorage 对比

| 维度 | `localStorage` | `sessionStorage` |
| --- | --- | --- |
| **隔离粒度** | 源（scheme + host + port） | **页签 + 源** |
| **同源两页签** | 共享同一份 | 各一份，互不可见 |
| **生命周期** | 持久（手动清除/驱逐前一直在） | 页面会话：关页签即清 |
| **刷新 / 恢复页签** | 在 | **在**（页面会话跨刷新与恢复存活） |
| **关浏览器重启** | 在 | 不在 |
| **新页签初值** | 直接读到同源已有数据 | 空副本；opener 打开/复制页签带初始快照后各自独立 |
| **storage 事件受众** | 同源**其他页签/窗口** | 仅**同页签内**其他同源文档 |
| **跨页签同步** | ✅ 原生支持 | ❌ 各页签独立副本 |
| **无痕模式** | 退化为"关窗即焚" | 本就关页即清 |
| **典型用途** | 主题、语言等跨页签偏好 | 表单草稿、向导步骤等单页签临时态 |
| **容量 / 同步 / Worker** | 约 5 MiB·源｜同步阻塞｜Worker 不可达 | 同左 |

> 隔离模型、opener 拷贝规则、无痕退化、`file:`/不透明源等机制细节，见[浏览器章 Web Storage 存储模型](/zh/base/browser/browser-storage/guide-line/web-storage-model)。

## 五、易错点清单

- **`getItem` 缺键返回 `null` 当 `undefined` 用**：判断存在性要 `=== null`；用 falsy 判断会把存过 `""`/`"0"` 的键误判为不存在。
- **`setItem(k, undefined)`**：存进字符串 `"undefined"`，日后 `JSON.parse` 抛 `SyntaxError`——写侧变量可能缺失时先拦截。
- **`setItem` 不裹 try-catch**：满时同步抛 `QuotaExceededError`，是本 API 唯一常态异常口。
- **误判异常类型**：`SecurityError`（拿不到对象）与 `QuotaExceededError`（满）是两回事——判错要 `e.name` 精确匹配。
- **在发起页监听 storage 事件等自己的变更**：永远等不到，设计如此；同页要收通知得自派发自定义事件。
- **拿 sessionStorage 做跨页签同步**：各页签独立副本，改这份通知不到那份——跨页签同步只能用 localStorage。
- **写相同值/删缺键后等 storage 事件**：无修改即无事件，不是 bug。
- **`e.newValue`/`e.key` 的 `null` 没当信号**：`newValue===null` 是删除、`key===null` 是 `clear()`——登出同步靠它们。
- **属性式访问 + 变量键名**：撞上 `length`/`key`/`setItem` 等原型成员则读写不对称，甚至变原型污染式风险面——一律方法式。
- **`Object.keys(localStorage)` 做批量清理**：数不到与原型成员同名的键——用 `length` + `key(i)`。
- **边遍历边 `removeItem`**：索引前移致漏删——先收集键名快照再删。
- **裸调 `clear()`**：清掉同源第三方脚本/其他子应用的键——只删自己命名空间前缀下的键。
- **依赖 `key(i)` 的枚举顺序**：顺序由实现决定，跨浏览器不一致。
- **`JSON.parse(getItem(...))` 不裹 try-catch**：用户手改、旧版本残留会喂进脏 JSON。
- **对象里塞 `Date`/`Map`/`Blob` 指望原样取回**：JSON 丢形——保形去 IndexedDB。
- **把巨型 JSON 塞单键**：小改动整串重序列化/重解析——拆多键按需读写。
- **模块顶层直接 `localStorage.getItem`**：SSR 服务端没有 `window`，import 即炸——`typeof window` 守卫 + 挂载后再读。
- **客户端首帧直接按 storage 渲染**：与服务端 HTML 对不上导致水合错位——首帧用默认值，`onMounted`/`useEffect` 里再恢复。
- **把 token 存 localStorage**：同源 XSS 一行读光——敏感凭证进 HttpOnly Cookie（见[浏览器章选型](/zh/base/browser/browser-storage/guide-line/storage-overview)）。
- **信旧文说"隐私模式写不进"**：那是旧 Safari 配额 0 的历史行为，现代浏览器可写但关窗即清。

## 六、资源链接

### 官方文档与规范

- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) —— 总览与两种机制
- [MDN: Using the Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API) —— 特性检测、storage 事件、示例
- [MDN: Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage) ｜ [Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) ｜ [Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [MDN: StorageEvent](https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent) ｜ [Window: storage 事件](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)
- [WHATWG HTML Standard: Web storage](https://html.spec.whatwg.org/multipage/webstorage.html) —— 规范原文（Web Storage 无独立仓库，定义于 HTML 标准）
- [MDN 演示：Web Storage Demo](https://mdn.github.io/dom-examples/web-storage/) ｜ [事件输出页](https://mdn.github.io/dom-examples/web-storage/event.html) ｜ [源码](https://github.com/mdn/dom-examples/tree/main/web-storage)

### 本站关联

- [浏览器章 · Web Storage 存储模型](/zh/base/browser/browser-storage/guide-line/web-storage-model) —— 隔离模型、opener 拷贝、无痕退化
- [浏览器章 · 存储全景与选型矩阵](/zh/base/browser/browser-storage/guide-line/storage-overview) —— 六机制五维对比与选型
- [浏览器章 · 配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction) —— 5 MiB 口径、两套账本、驱逐
- [浏览器章 · 存储分区与 Storage Buckets](/zh/base/browser/browser-storage/guide-line/partitioning-buckets) —— 第三方 iframe 按顶级站点分区
- [IndexedDB](/zh/web-advanced/web-api/indexeddb/) —— 结构化、大容量、Worker 可用的异步存储
