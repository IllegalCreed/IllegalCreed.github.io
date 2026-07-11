---
layout: doc
outline: [2, 3]
---

# 入门：五方法一属性与两种生命周期

> 基于 WHATWG HTML 现行标准（Web storage 章）· 核于 2026-07

## 速查

- **一句话定位**：Web Storage API = **Storage 接口 + 两个实例 + 一个事件**，浏览器最简单的键值存储；定义在 **WHATWG HTML 标准** Web storage 章，2015-07 起 Baseline Widely available，全绿十几年。
- **两个实例**：`window.localStorage`（按源共享、持久）与 `window.sessionStorage`（按"页签 + 源"隔离、关页即清），同一套 Storage 接口。
- **五方法一属性**：`setItem(key, value)` / `getItem(key)` / `removeItem(key)` / `clear()` / `key(index)` + 只读属性 `length`——整个 API 就这六个成员。
- **读的三条边界**：`getItem` 对不存在的键返回 **`null`（不是 `undefined`）**；`key(index)` 越界返回 `null`；`removeItem` 删不存在的键**静默无事**——读侧永远不抛错。
- **只存字符串**：键与值写入时都被强制 `String()` 转换——对象存进去是 `"[object Object]"`，数字/布尔读回来是字符串。
- **写必须 try-catch**：`setItem` 超限会**同步抛 `QuotaExceededError`**（约 5 MiB/源，口径链接浏览器章），这是本 API 唯一常态异常。
- **生命周期对比**：localStorage 浏览器重启仍在；sessionStorage 关页签即清，但**刷新与"恢复标签页"不清**。
- **sessionStorage 快照**：新开页签默认是空副本；经 opener 打开或"复制标签页"会带一份初始快照，之后各自独立（模型细节见[浏览器章](/zh/base/browser/browser-storage/guide-line/web-storage-model)）。
- **storage 事件**：修改会通知**同源的"其他"文档**——**发起修改的页面自己收不到**（头号考点），这是原生跨页签同步机制。
- **属性式访问能用但别用**：`localStorage.foo = 1` 合法，但键名撞上 `length`/`setItem` 等原型成员时读写不对称——规范与 MDN 都推荐**一律方法式**。
- **同步 API**：每次读写都阻塞主线程，大值/高频写有实打实的性能代价（量化口径见[浏览器章](/zh/base/browser/browser-storage/guide-line/storage-overview)）。
- **无痕模式**：API 完全可用，但 localStorage 退化为"关窗即焚"（见[浏览器章](/zh/base/browser/browser-storage/guide-line/web-storage-model)）。
- **Worker 不可达**：Worker / Service Worker 里没有 `localStorage`；敏感凭证禁入（XSS 一行读光）。
- **本叶分工**：这里只讲 **API 编程面**（方法/事件/序列化/封装）；隔离模型、选型矩阵、配额驱逐、存储分区四个机制话题全部链接[浏览器章存储叶](/zh/base/browser/browser-storage/guide-line/web-storage-model)，不重复展开。
- **何时不用**：结构化、大体量、要保形（`Date`/`Map`/二进制）、要进 Worker 的数据 → [IndexedDB](/zh/web-advanced/web-api/indexeddb/)。
- **进阶顺序**：本页 → [API 与事件全解](./guide-line/api-and-events) → [序列化与异常](./guide-line/serialization-exceptions) → [封装模式](./guide-line/patterns) → [参考](./reference)。

## 一、定位：最简单的浏览器键值存储

Web Storage API 解决的问题极其朴素：**给同源页面一小块随手可用的键值存储**。它比 Cookie 直观（不用手动解析字符串、不随请求上行），比 IndexedDB 轻量（无数据库、无事务、无异步），代价是只存字符串、容量约 5 MiB、同步阻塞。

整个 API 的构成一张表说完：

| 组成 | 是什么 |
| --- | --- |
| **Storage 接口** | 五方法一属性的键值容器，两个实例共用这一个接口 |
| **`window.localStorage`** | 按**源**（scheme + host + port）隔离的持久存储，同源所有页签共享 |
| **`window.sessionStorage`** | 按**"页签 + 源"**隔离的会话存储，关页签即清 |
| **storage 事件** | 存储被修改时，广播给**同源其他文档**的通知（`StorageEvent`） |

它定义在 [WHATWG HTML 标准的 Web storage 章](https://html.spec.whatwg.org/multipage/webstorage.html)（不是独立规范），2015-07 起 Baseline Widely available——**没有兼容性问题，也没有新特性要追**，要学的全部是语义细节与工程陷阱。

## 二、一分钟上手：五方法一属性

下面这段代码覆盖了全部 API 成员，可直接粘进浏览器控制台运行：

```js
// 写入：键、值都会被强制转成字符串
localStorage.setItem("app:theme", "dark");

// 读取：返回字符串；键不存在返回 null（不是 undefined）
localStorage.getItem("app:theme");   // "dark"
localStorage.getItem("no-such-key"); // null

// 删除单个键：键不存在时静默无事，不抛错
localStorage.removeItem("app:theme");

// 枚举：length 数键的个数，key(i) 按索引取键名（越界返回 null）
localStorage.setItem("a", "1");
localStorage.setItem("b", "2");
for (let i = 0; i < localStorage.length; i++) {
  const k = localStorage.key(i); // 注意：键的顺序由实现决定，别依赖
  console.log(k, "=", localStorage.getItem(k));
}

// 清空：删除当前源在这个存储区的全部键值对
localStorage.clear();

// sessionStorage 是同一套方法，只是生命周期不同
sessionStorage.setItem("wizard:step", "2"); // 关掉这个页签即消失
```

就这么多——Web Storage 没有第七个方法。所有的深度都藏在边界语义（[API 页](./guide-line/api-and-events)）、字符串序列化（[序列化页](./guide-line/serialization-exceptions)）和工程封装（[模式页](./guide-line/patterns)）里。

## 三、localStorage vs sessionStorage：一套接口，两种生命周期

两个实例的方法完全相同，差异全在"数据活多久、谁能看见"：

| | `localStorage` | `sessionStorage` |
| --- | --- | --- |
| **隔离粒度** | 源 | **页签 + 源** |
| **同源两个页签** | 共享同一份 | 各一份，互不可见 |
| **刷新 / 恢复页签** | 在 | **在**（页面会话跨刷新存活） |
| **关页签 / 关浏览器** | 在 / 在 | **清 / 清** |
| **storage 事件传给谁** | 同源**其他页签/窗口** | 仅**同页签内**其他同源文档（如 iframe） |
| **典型用途** | 主题、语言等跨页签偏好 | 表单草稿、向导步骤等单页签临时态 |

三条容易考到的行为边界（结论版，机制解释见[浏览器章存储模型](/zh/base/browser/browser-storage/guide-line/web-storage-model)）：

- sessionStorage 的"页面会话"比直觉顽强：**刷新不清、崩溃后"恢复标签页"不清**，只有真正关闭页签才清——所以它是"防误刷新丢数据"的天然容器。
- 新开页签的 sessionStorage 默认是**空的独立副本**；但经 `window.open` 等**有 opener** 的方式打开、或用浏览器"复制标签页"功能，会得到一份**初始快照**（复制页签属浏览器实现行为）——拷贝完成后两份各改各的。
- 无痕/隐私模式下 API 全部可用，但 **localStorage 表现得像 sessionStorage**：关掉无痕窗口即全清。

## 四、第一天就要建立的四个条件反射

**反射一：读出来的要么是字符串、要么是 `null`。** 存进去 `42` 读回来是 `"42"`，存布尔读回来是 `"true"`；对象必须 `JSON.stringify` / `JSON.parse` 手动往返，而 JSON 会丢 `undefined`、把 `Date` 变字符串——丢形清单见[序列化页](./guide-line/serialization-exceptions)。

**反射二：`setItem` 永远裹 try-catch。** 这是整个 API 唯一会常态抛错的入口——存储满时同步抛 `QuotaExceededError`：

```js
try {
  localStorage.setItem("cache:list", bigString);
} catch (e) {
  // 满了：清理可再生数据，或把这类数据迁去 IndexedDB
}
```

**反射三：自己改自己收不到 storage 事件。** storage 事件只发给**同源的其他文档**——在发起修改的页面上监听，永远等不到。想跨页签同步，改动方写、其他页签听；想同页也收到通知，要自己补广播（[API 页](./guide-line/api-and-events)给模式）。

**反射四：别用属性式访问。** `localStorage.theme = "dark"` 能跑，但键名一旦撞上 `length`、`setItem`、`key` 这些原型成员，读写就开始"各走各路"——规范推荐的姿势永远是 `setItem` / `getItem`（坑的实测细节见 [API 页](./guide-line/api-and-events)）。

## 五、本叶与浏览器章的分工地图

浏览器章的存储叶已经把**机制**讲透，本叶不重复——遇到下面这些问题请直接跳转：

| 你想查 | 去哪 |
| --- | --- |
| 隔离模型、opener 拷贝规则、无痕退化、`file:` 与不透明源 | 浏览器章 [Web Storage 存储模型](/zh/base/browser/browser-storage/guide-line/web-storage-model) |
| 与 Cookie / IndexedDB / Cache API / OPFS 怎么选 | 浏览器章 [存储全景与选型矩阵](/zh/base/browser/browser-storage/guide-line/storage-overview) |
| 5 MiB 怎么算、两套配额账本、驱逐、`persist()` | 浏览器章 [配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction) |
| 第三方 iframe 里读不到数据（按顶级站点分区） | 浏览器章 [存储分区与 Storage Buckets](/zh/base/browser/browser-storage/guide-line/partitioning-buckets) |
| 每个方法的精确边界、storage 事件、跨页签通信 | 本叶 [API 与事件全解](./guide-line/api-and-events) |
| JSON 丢形、`QuotaExceededError`、隐私模式历史坑 | 本叶 [序列化与异常处理](./guide-line/serialization-exceptions) |
| TTL / 前缀 / TS 泛型 / 版本迁移 / SSR 守卫 | 本叶 [封装模式与工程实践](./guide-line/patterns) |

下一页把六个成员逐个说透，再进入本 API 最大的考点——storage 事件：[API 与事件全解](./guide-line/api-and-events)。
