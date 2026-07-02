---
layout: doc
outline: [2, 3]
---

# Web Storage 存储模型

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- 两兄弟一套 API（`getItem`/`setItem`/`removeItem`/`clear`），差别全在**隔离与生命周期**
- **localStorage 按源（origin）隔离**：同源所有标签页/iframe 共享同一份，浏览器重启仍在
- **sessionStorage 按「标签页 + 源」隔离**：每个标签页一份独立的**页面会话（page session）**，关标签页即清；**刷新与「恢复标签页」不清**
- 新标签页有 `opener` 时，其 sessionStorage **初始是 opener 那份的拷贝**（拷贝后各自独立）；用 `rel="noopener"` 等断开 opener 的手段可**阻止这次拷贝**
- **同步 API，阻塞主线程**：MDN 明示大数据/性能敏感场景改用异步的 IndexedDB
- **只能存字符串**：对象要 `JSON.stringify`/`parse`，`Date`/`Map`/`Blob` 都会在序列化里丢形
- 容量 **~5 MiB/源**（localStorage 与 sessionStorage 各自独立计），超限 `setItem` 抛 **`QuotaExceededError`**——写必须 try/catch
- **storage 事件只发给同源的「其他」文档**：改动发起者自己收不到；这是 localStorage 跨标签页同步的原生机制
- **无痕/隐私模式退化**：localStorage 表现如 sessionStorage——API 全可用，但关掉无痕窗口即全清
- `data:` 等**不透明源**访问必抛 `SecurityError`；`file:` 主流浏览器实测可读写（MDN 措辞为「可能」抛）；用户禁站点数据时同抛
- 第三方 iframe 里访问 Web Storage：用户若**禁用第三方 Cookie 则被拒**；且现代浏览器已按顶级站点**分区**（见[存储分区](./partitioning-buckets)）
- `<script>` 引入的三方代码写的是**宿主页面**的 storage；`<iframe>` 里的代码写的是 **iframe 自己源**的 storage
- 性能姿势：启动时一次读入内存、改动再写回；多个键按需读写，别塞成单个巨型 JSON 键

## 一、一套 API，两种隔离模型

localStorage 与 sessionStorage 的方法完全一致，真正要背的是这张隔离对照：

| | localStorage | sessionStorage |
| --- | --- | --- |
| **隔离键** | 源（scheme + host + port） | **标签页 + 源** |
| **同源两个标签页** | 共享同一份 | **各一份，互不可见** |
| **生命周期** | 持久（手动清除/驱逐前一直在） | 页面会话：关标签页/窗口即清 |
| **刷新 / 恢复标签页** | 在 | **在**（页面会话跨刷新与恢复存活） |
| **浏览器重启** | 在 | 不在 |

sessionStorage 的隔离单位叫**页面会话（page session）**：MDN 的定义是「文档加载进某个标签页时创建、只对该标签页可见」。它比直觉更顽强——**刷新不清、崩溃恢复不清**（所以适合存「防误刷新丢失」的表单草稿），但关标签页必清。

### 1.1 sessionStorage 的复制规则（与 noopener 的纠缠）

从页面 A 点开新标签页 B 时，B 的 sessionStorage 并非必然空白——MDN 的规则：**若新页面拥有 `opener`，其 sessionStorage 初始是 opener 那份的拷贝**；拷贝完成后两份完全独立，互改不影响。想阻止这次拷贝，用任何断开 opener 的手段（`rel="noopener"`、`window.open(url, "_blank", "noopener")` 等）。

工程含义：如果你把敏感的临时态放在 sessionStorage、又允许页面开新窗，要意识到**数据会被带进新标签页**；反过来，指望「新标签页自动继承会话态」的设计在 noopener 链接下会失灵——这也是它与会话 Cookie 行为的差异点。

## 二、同步 + 仅字符串：两条先天限制

**同步阻塞**。每次 `getItem`/`setItem` 都在主线程上同步执行。小键值无感；一旦拿它存接口缓存、大 JSON，读写 + `JSON.parse` 的耗时全算进主线程卡顿。MDN 的原话方向很明确：大数据量、性能敏感，改用**异步的 IndexedDB**。

**仅字符串**。键与值都只能是字符串，于是所有人都在写这两行：

```js
// 写：对象必须手动序列化
localStorage.setItem("prefs", JSON.stringify({ theme: "dark", fontSize: 14 }));

// 读：手动反序列化 + 防御空值
const prefs = JSON.parse(localStorage.getItem("prefs") ?? "{}");
```

代价藏在 JSON 的语义损耗里：`Date` 变字符串、`Map`/`Set` 变空对象、`undefined` 丢失、`Blob`/`ArrayBuffer` 根本存不了。需要保形存储的数据，属于 IndexedDB 的结构化克隆管辖区（见[下一页](./indexeddb-opfs)）。

留在 Web Storage 里的小键值也有省钱姿势：热路径别反复 `getItem` + `JSON.parse`——启动时读一次进内存、改动时再写回，把同步开销压到每会话常数次；也别把整个池子塞成一个巨型 JSON 键——每次小改动都要整串重序列化、重解析，拆成多个键按需读写更划算。

## 三、容量 ~5 MiB 与 QuotaExceededError

MDN 配额页给出的现状：主流浏览器给 **localStorage 与 sessionStorage 各 ~5 MiB/源**——两个池子独立计，与 IndexedDB 等共享的源级大配额**无关**。超限时 `setItem` **同步抛出 `QuotaExceededError`**，所以严谨的写法永远带 try/catch：

```js
try {
  localStorage.setItem("cache", bigString);
} catch (e) {
  if (e.name === "QuotaExceededError") {
    // 池子满了：清理旧键，或把这类数据迁去 IndexedDB
  }
}
```

顺带划清边界：**Web Storage 的 5 MiB 与 `navigator.storage.estimate()` 报告的配额是两套体系**——后者管的是 IndexedDB/Cache API/OPFS 的共享大池子（详见[配额与驱逐](./quota-eviction)）。

## 四、storage 事件：免费的跨标签页同步

改动 Web Storage 会在**同源的其他文档**上触发 `storage` 事件——**发起改动的那个页面自己收不到**。由于 localStorage 是同源所有标签页共享的，这就成了浏览器原生的跨标签页广播：

```js
// 标签页 A：改主题
localStorage.setItem("theme", "dark");

// 标签页 B：收到通知（A 自己不会触发）
window.addEventListener("storage", (e) => {
  // e.key / e.oldValue / e.newValue / e.url / e.storageArea
  if (e.key === "theme") applyTheme(e.newValue);
});
```

事件对象把改动的上下文带得很全：

| 属性 | 含义 |
| --- | --- |
| `key` | 变动的键；`clear()` 触发时为 `null` |
| `oldValue` / `newValue` | 变动前后的值：新增时 `oldValue` 为 `null`，删除时 `newValue` 为 `null` |
| `url` | 发起改动的文档地址 |
| `storageArea` | 变动发生在哪个 Storage 对象（localStorage / sessionStorage） |

典型用法：多标签页登出同步（一处 `removeItem("token")`，处处跳登录页）、主题/偏好即时生效。两个细节：sessionStorage 因为按标签页隔离，它的 storage 事件只可能来自**同一标签页内的其他文档**（如同源 iframe），跨标签页同步是 localStorage 的专利；另外事件挂在改动的「副作用」上——若只想广播消息而不想真存数据，`BroadcastChannel` 是语义更对的工具（不用编造键值、不占存储）。

## 五、退化与拒绝：那些「API 在、数据不在」的场景

- **无痕/隐私模式**：API 完全可用，但 **localStorage 被当作 sessionStorage 对待**——无痕窗口关闭，全部清空。别在无痕模式下承诺任何持久化。
- **不透明源与 `file:` 的区别**：`data:` URL 等**不透明源（opaque origin）**下访问 `localStorage` **必抛 `SecurityError`**（Chromium 报错原文 `Storage is disabled inside 'data:' URLs`）；而 `file:` 页面在 Chromium/Firefox 的**实测行为是可正常读写**（数据落在浏览器 profile，隔离粒度各家实现不同）——MDN 对无效源的措辞是「**可能（can）**抛」而非必然。用户在浏览器设置里禁掉站点数据时，任何源都会抛。本地调试 localStorage 必炸的场景是 `data:`/沙箱 iframe，不是 `file:`。
- **第三方 iframe**：iframe 里的代码访问的是 **iframe 自己源**的 storage；但用户禁用第三方 Cookie 时，浏览器连带拒绝三方 iframe 的 Web Storage 访问。且即使可访问，现代浏览器也已按**顶级站点分区**——同一 iframe 嵌在不同站点，看到的是不同的数据（详见[存储分区与 Storage Buckets](./partitioning-buckets)）。
- **`<script>` 引入的第三方代码**：它运行在宿主页面的浏览上下文里，读写的就是**宿主源**的 storage——从浏览器视角看根本没有「第三方」可言。这也是审计三方脚本时要看它碰不碰 storage 的原因。

## 小结

- 一套 API 两种隔离：localStorage 按源共享且持久；sessionStorage 按「标签页+源」独立，关页即清、刷新与恢复不清。
- 新标签页的 sessionStorage 会从 opener 拷贝一份初值，noopener 断开即不拷贝——两份拷贝后互不影响。
- 同步阻塞 + 仅字符串是先天限制：大数据、保形数据都该去 IndexedDB。
- 容量 ~5 MiB/源、超限同步抛 `QuotaExceededError`；这 5 MiB 与源级大配额是两套账。
- storage 事件是原生跨标签页广播（发起者自己收不到）；无痕模式下 localStorage 退化为「关窗即焚」。
- 下一页进入异步大容量阵营：[IndexedDB 定位与 OPFS](./indexeddb-opfs)。
