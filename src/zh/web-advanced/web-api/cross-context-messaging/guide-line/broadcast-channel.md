---
layout: doc
outline: [2, 3]
---

# BroadcastChannel：同源多上下文一对多广播

> 基于 WHATWG HTML（跨文档消息 / 通道消息 / 广播频道）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **定位**：`BroadcastChannel` 是**同源**下多个浏览上下文（标签页 / `<iframe>` / Worker）之间的**一对多广播**总线——一处 `postMessage`，同源所有连到同名频道的上下文都收到。
- **创建**：`const bc = new BroadcastChannel("频道名");`——同名即同频道，构造参数只有一个频道名。
- **发送**：`bc.postMessage(data)`——**无 `targetOrigin`、无收方地址**，广播给频道上所有其他订阅者；走结构化克隆。
- **接收**：`bc.onmessage = (e) => e.data` 或 `bc.addEventListener("message", ...)`；数据在 `event.data`。
- **不回发给自己（本页核心）**：WHATWG 算法明确「Remove source from destinations」——**发送者自己的 `BroadcastChannel` 收不到这条消息**，天然省掉回声判重。
- **无 sender 标识（本页核心）**：消息不带任何发送者信息、不定义语义——要区分谁发的 / 什么类型，**自带 `senderId` / `type` 字段**。
- **同源约束**：仅**同源且同存储分区**互通；顶级站点不同则被存储分区隔开，即便技术上同源也不通（如 `a.com` 里嵌的 `b.com` `<iframe>` 与独立打开的 `b.com` 页不通）。
- **`close()`**：`bc.close()` 断开与频道的连接、允许回收；关闭后不能再收发。
- **`messageerror`**：收到无法反序列化的消息时触发，与 `message` 分开。
- **能传什么**：结构化克隆——对象 / `Date` / `Map` / `ArrayBuffer` / `Blob` 可，函数 / DOM 节点不可；**不支持 transfer 移交**（广播语义下无单一接收者）。
- **vs storage 事件**：`BroadcastChannel` 是专为广播设计的消息总线（任意结构化数据、不落盘）；storage 事件是 `localStorage` 变更的副产物（只有字符串、且**不在写入页自身触发**）——见 [Web Storage 叶](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events)。
- **vs SharedWorker**：广播是**去中心化**总线、无共享状态；`SharedWorker` 是**中心化**单实例、可持共享状态与单一长连接——见 [Web Workers 叶](/zh/web-advanced/web-api/web-workers/guide-line/shared-worker)。
- **典型场景**：登出 / 登录态同步、主题 / 语言切换、购物车 / 草稿同步、缓存 / 数据失效通知、「已在其他标签页打开」提示。
- **不保证送达离线页**：只广播给**当前存活**的上下文；没开着的标签页收不到（要持久化用存储 + 打开时读）。
- **Baseline**：自 2022-03 起 Baseline Widely available，全主流浏览器 + Worker 可用。

## 一、它解决什么：同源「一处改、处处变」

很多状态需要在同源的多个标签页间保持一致：一个页登出，其他页也该登出；一个页切了暗色主题，其他页跟着变；购物车加了一件，别的页也更新。`BroadcastChannel` 就是为此而生的**广播总线**——不必两两建立连接，所有上下文连到同一个「频道」，谁发都广播给其余所有人：

```js
// 任意标签页 / <iframe> / Worker 里，连到同名频道即入网
const bc = new BroadcastChannel("app-sync");

// 收：同源其他上下文广播的消息都到这
bc.onmessage = (event) => {
  console.log("收到广播：", event.data);
};

// 发：广播给频道上所有【其他】订阅者
bc.postMessage({ type: "theme-change", theme: "dark" });
```

三行就把「多标签页同步」搭好了。它和点对点的 `postMessage` / `MessageChannel` 是互补关系：那两个是**定向**通信，`BroadcastChannel` 是**扩散**通信。

## 二、两个定义性特征：不回发给自己、无发送者标识

### 2.1 发送者收不到自己的消息

这是 `BroadcastChannel` 最省心的设计。WHATWG HTML 的 `postMessage` 算法在收集接收者时有一步明确的「**Remove source from destinations**」——把发送者自己的 `BroadcastChannel` 对象从投递列表里移除。所以：

```js
const bc = new BroadcastChannel("app-sync");
bc.onmessage = (e) => console.log("收到：", e.data);

bc.postMessage("hello");
// 本上下文的 bc.onmessage 【不会】因为这次 postMessage 触发——不回声
```

意义：你不用像用 storage 或自造事件总线那样，费心「区分是别人发的还是自己刚发的」。**广播出去的，只有别人收到**。（注意：是「同一个 `BroadcastChannel` 实例不收自己发的」；若同一页里开了两个连到同名频道的实例，另一个实例会收到——正常需求下一个上下文用一个实例即可。）

### 2.2 消息不带发送者身份，也不带语义

WHATWG / MDN 原义：API 不给消息附加任何语义（「doesn't associate any semantics to messages」），协议由使用方自行实现（「the different browsing contexts need to implement it themselves」）。也就是说——**消息里没有「谁发的」「是什么类型」这些信息，全靠你自己往 payload 里塞**：

```js
// 自带 senderId 区分来源、type 区分种类——广播总线的标准约定
const SELF_ID = crypto.randomUUID(); // 本标签页唯一 id
const bc = new BroadcastChannel("app-sync");

function broadcast(type, payload) {
  bc.postMessage({ senderId: SELF_ID, type, payload, at: Date.now() });
}

bc.onmessage = (event) => {
  const { senderId, type, payload } = event.data;
  // 虽然不会收到自己发的，但多实例 / 调试时 senderId 仍是有用的溯源信息
  switch (type) {
    case "logout":
      forceLogout();
      break;
    case "theme-change":
      applyTheme(payload.theme);
      break;
  }
};
```

约定俗成的 payload 三件套：**`type`**（消息种类，用来 switch 分发）、**`senderId`**（发送者标识，溯源 / 去重 / 选择性忽略）、**业务字段**。

## 三、同源与存储分区

`BroadcastChannel` **只在同源上下文间互通**，且更精确地说是**同一存储分区**（storage partition）内。现代浏览器按顶级站点对存储分区：

> 如果你在 `a.com` 打开的页面里嵌了一个来自 `b.com` 的 `<iframe>`，同时又单独打开了一个 `b.com` 的页面——尽管那个 `<iframe>` 和独立的 `b.com` 页技术上同源，它们仍**不能**通过 `BroadcastChannel` 互通，因为分属不同的存储分区。

日常直觉够用：**同一个站点的多个标签页 / 窗口之间能广播**；跨站点、跨源一律不通（要跨源用 `postMessage`）。

## 四、close 与 messageerror

```js
const bc = new BroadcastChannel("app-sync");

bc.addEventListener("message", (e) => handle(e.data));
bc.addEventListener("messageerror", (e) => {
  // 收到无法反序列化（结构化克隆失败）的消息
  console.error("坏消息", e);
});

// 组件卸载 / 页面不再需要同步时断开，利于回收
function dispose() {
  bc.close(); // 关闭后不能再 postMessage / 收消息
}
```

`close()` 断开该对象与底层频道的连接、允许垃圾回收；页面关闭时浏览器也会自动断开。SPA 里在组件 `onUnmounted` / `beforeDestroy` 主动 `close`，避免泄漏与重复处理。

## 五、典型场景

```js
// 场景一：登出同步——一个页登出，同源所有页立即登出
function logout() {
  clearSession();
  bc.postMessage({ type: "logout", senderId: SELF_ID });
  location.href = "/login";
}
bc.onmessage = (e) => {
  if (e.data.type === "logout") {
    clearSession();
    location.href = "/login"; // 别的标签页跟着登出
  }
};
```

```js
// 场景二：主题切换——广播新主题，所有页实时换肤
function setTheme(theme) {
  localStorage.setItem("theme", theme); // 持久化：新开的页读得到
  applyTheme(theme); // 本页立即生效（自己收不到广播，得手动应用）
  bc.postMessage({ type: "theme-change", theme, senderId: SELF_ID }); // 通知其他页
};
```

注意场景二的关键细节：**因为发送者收不到自己的广播，本页必须自己 `applyTheme`**，再广播给别人——这正是「不回发给自己」特性在实践中的直接后果。

其他常见场景：购物车 / 收藏 / 草稿同步、后台数据更新后的「缓存失效」通知、「此内容已在另一个标签页打开」的抢占提示、WebSocket 只在主标签页连、其余标签页经广播共享推送（更彻底的单连接方案见[多标签页方案页](./multi-tab-patterns)的 Web Locks 选主与 `SharedWorker`）。

## 六、与相邻方案的边界（只对比，不展开）

| 方案 | 本质 | 数据 | 关键差异 | 详见 |
| --- | --- | --- | --- | --- |
| **`BroadcastChannel`** | 去中心化广播总线 | 任意结构化克隆 | 不回发给自己、无 sender、不落盘 | 本页 |
| **storage 事件** | `localStorage` 变更副产物 | **仅字符串** | **写入页自身不触发**、需读回值、老浏览器兜底 | [Web Storage 叶](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events) |
| **`SharedWorker`** | 中心化单实例后台 | postMessage | 可持**共享状态** / 单一长连接、集中调度 | [Web Workers 叶](/zh/web-advanced/web-api/web-workers/guide-line/shared-worker) |

一句话取舍：**纯广播、无共享状态、代码最短 → `BroadcastChannel`**（2022 起 Baseline，新项目首选）；要在多标签页间**共享一份状态或一条长连接** → `SharedWorker`；只为兼容很老的浏览器 → storage 事件兜底。完整的多标签页选型（含 Web Locks 选主）在下一页。

## 七、易错点

- **以为会收到自己发的**：不会——「Remove source from destinations」；本页要立即生效的状态得**自己手动应用**再广播。
- **不带 `type` / `senderId`**：消息无语义无身份——payload 自带 `type` 分发、`senderId` 溯源。
- **指望跨源 / 跨站广播**：只同源同分区互通——跨源用 `postMessage`。
- **指望广播到没开的标签页**：只触达当前存活上下文——要持久化用存储，页面打开时读。
- **想 transfer 移交 `ArrayBuffer`**：广播无单一接收者、**不支持 transfer**——大对象要么克隆（有成本）要么改用点对点 `MessageChannel`。
- **传字符串却又想要类型**：别退回 storage 心智——`BroadcastChannel` 直接传对象，无需 `JSON.stringify`。
- **用完不 `close`**：SPA 里累积多个悬挂频道、重复处理——组件卸载时 `close`。
- **拿它当持久层**：它只广播不存储——状态该落 `localStorage` / IndexedDB 的仍要落。

下一页：把多标签页的所有方案摆到一起对比，并讲 Web Locks 选主——[多标签页方案与选主](./multi-tab-patterns)。
