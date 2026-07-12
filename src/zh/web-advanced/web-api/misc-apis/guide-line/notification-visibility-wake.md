---
layout: doc
outline: [2, 3]
---

# 通知、页面状态与唤醒锁

> 基于各 Web API 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **通知权限**：`Notification.requestPermission()` → `Promise<"granted"｜"denied"｜"default">`（旧式回调形亦存在）；**应在用户手势内**申请。
- **当前权限**：静态属性 `Notification.permission`（`granted`/`denied`/`default`），申请前先读它避免重复弹窗。
- **页面级通知**：`new Notification(title, options)`——生命周期绑页面，**很多移动浏览器直接抛 `TypeError`**，桌面为主。
- **持久通知**：`registration.showNotification(title, options)`（Service Worker）——**脱离页面存活、可点，移动端唯一可行**；`registration.getNotifications()` 取回。
- **通知选项**：`body`/`icon`/`badge`/`tag`（同 tag 覆盖旧通知）/`data`/`requireInteraction`/`silent`；**`actions`（按钮）仅 SW 通知支持**。
- **通知事件**：页面级在实例上 `click`/`close`/`error`/`show`；SW 内在全局 `notificationclick`/`notificationclose`。
- **iOS 限制**：iOS 的 Web 通知**只对「已装到主屏的 PWA」生效**（iOS 16.4+），普通 Safari 标签页不行。
- **推送另说**：服务端主动推 = Push API + 订阅 + SW 后台唤醒，见 [Service Worker & PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)；本页只讲**本地弹通知**。
- **页面可见性**：`document.visibilityState`（`"visible"`/`"hidden"`）+ `visibilitychange` 事件；`document.hidden`（布尔）**已不推荐**，用 `visibilityState`。
- **可见性用途**：页面转后台就**暂停视频/动画/轮询**，省电省流量省 CPU；转前台再恢复。
- **优先可见性**：保存状态/清理用 `visibilitychange`（转 hidden 时），**别依赖 `unload`/`beforeunload`**（不可靠、破坏 bfcache）。
- **唤醒锁**：`navigator.wakeLock.request("screen")` → `Promise<WakeLockSentinel>`；**`"screen"` 是唯一类型**，用途是防屏幕变暗/熄屏/锁屏。
- **Sentinel**：`sentinel.release()`（→`Promise`）主动释放、`sentinel.released`（布尔）、`sentinel.type`、`release` 事件。
- **隐藏自动释放**：页面转 hidden 时唤醒锁**被系统自动释放**，回到 visible **必须重新 `request` 重获**——配合 `visibilitychange` 重申。
- **唤醒锁门槛**：安全上下文 + 文档需可见/活动 + `screen-wake-lock` 权限策略；支持 **Chromium 与 Safari 16.4+**，Firefox 暂未支持。
- **特性检测**：`"Notification" in window`、`"wakeLock" in navigator`、`"onvisibilitychange" in document`——先探再用。

## 一、Notifications：本地弹系统通知

[Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) 让网页弹出**系统级通知**（显示在通知中心，切到别的标签/应用也在）。本页只讲**本地触发**的通知；**服务端主动推送**（关掉页面也能收到）属于 Push API + Service Worker 的范畴，见 [Service Worker & PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)。

### 1.1 权限：先查后请求，且在手势内

通知会打扰用户，必须先拿授权。用**静态属性** `Notification.permission` 读现状，用 `requestPermission()` 申请：

```js
/** 申请通知权限——先读现状，避免重复弹窗；在用户手势内调用 */
async function ensureNotifyPermission() {
  if (!("Notification" in window)) return false; // 特性检测

  if (Notification.permission === "granted") return true; // 已授权
  if (Notification.permission === "denied") return false; // 已拒绝，别再弹

  // "default"：尚未决定，此刻申请（现代形式返回 Promise）
  const result = await Notification.requestPermission();
  return result === "granted";
}

// 应由用户点击触发（很多浏览器要求手势，否则申请被忽略/拒绝）
enableBtn.addEventListener("click", async () => {
  if (await ensureNotifyPermission()) new Notification("已开启通知");
});
```

> 三态：`"granted"`（允许）、`"denied"`（拒绝）、`"default"`（未决定）。旧式 `Notification.requestPermission(cb)` 回调形仍被支持，但现代代码用 Promise 形。

### 1.2 页面级通知 vs Service Worker 持久通知

这是本节最关键的分叉——**两种通知，能力与适用面完全不同**：

| 维度 | 页面级 `new Notification()` | 持久 `registration.showNotification()` |
| --- | --- | --- |
| 触发方 | 页面脚本 | Service Worker（或页面拿到 registration） |
| 生命周期 | 绑当前页面 | **脱离页面存活**、可后台点击 |
| 移动端 | **多数移动浏览器抛 `TypeError`** | ✅ 移动端唯一可行 |
| 动作按钮 `actions` | ❌ 不支持 | ✅ 支持 |
| 事件 | 实例上 `click`/`close`/`error`/`show` | 全局 `notificationclick`/`notificationclose` |
| 取回已弹 | 无 | `registration.getNotifications()` |

**页面级**（桌面小场景够用）：

```js
// 生命周期绑页面；移动端多不支持
const n = new Notification("新消息", {
  body: "你有一条来自 Alice 的消息",
  icon: "/icon.png",
  tag: "msg-alice", // 相同 tag 会覆盖旧的同类通知，避免刷屏
  data: { chatId: 42 }, // 携带自定义数据，供事件回调用
});
n.addEventListener("click", () => {
  window.focus();
  location.href = `/chat/${n.data.chatId}`;
});
```

**持久通知**（移动端 / 需按钮 / 需后台可点，**唯一可靠选择**）：

```js
// 页面里拿到 SW 注册，弹一条带动作按钮的持久通知
const reg = await navigator.serviceWorker.ready;
await reg.showNotification("下载完成", {
  body: "报表已生成",
  icon: "/icon.png",
  badge: "/badge.png", // 状态栏小图标（单色）
  requireInteraction: true, // 用户不点就不自动消失
  actions: [
    // actions 仅在 SW 通知里生效
    { action: "open", title: "打开" },
    { action: "dismiss", title: "忽略" },
  ],
});
```

在 Service Worker 里响应点击（含动作按钮）：

```js
// sw.js —— 通知交互在 SW 全局作用域处理
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open") {
    // waitUntil 保证异步完成前 SW 不被杀
    event.waitUntil(clients.openWindow("/reports"));
  }
});
```

### 1.3 平台现实：iOS 必须先装 PWA

- **iOS / iPadOS**：Web 通知**只对已「添加到主屏幕」的 PWA 生效**（iOS 16.4+ 起支持），普通 Safari 标签页里既弹不出也拿不到权限。这几乎是移动 Web 通知最大的现实约束。
- **桌面**：页面级与持久通知都可用，但用户可能在系统层面全局关闭了浏览器通知。
- **移动 Android**：用持久通知（SW），别用 `new Notification()`。

## 二、Page Visibility：知道页面在不在前台

[Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) 让页面知道自己**是否对用户可见**（前台标签、非最小化、屏幕未熄），从而在**转入后台时暂停无谓的工作**，省电、省流量、省 CPU。它早已 Baseline，几乎零门槛。

### 2.1 visibilityState 与 visibilitychange

```js
// document.visibilityState: "visible" | "hidden"
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    pauseWork(); // 转后台：停轮询/停动画/暂停视频
  } else {
    resumeWork(); // 回前台：恢复
  }
});
```

> `document.hidden`（布尔）是早期属性，**已不推荐**，一律用语义更清晰的 `document.visibilityState`。

### 2.2 典型省电场景

```js
/** 仪表盘：仅在页面可见时轮询后端，隐藏就停，回来立刻拉一次并续上 */
let timer = null;

function startPolling() {
  if (timer) return;
  fetchUpdates(); // 立即来一发
  timer = setInterval(fetchUpdates, 5000);
}
function stopPolling() {
  clearInterval(timer);
  timer = null;
}

document.addEventListener("visibilitychange", () => {
  document.visibilityState === "hidden" ? stopPolling() : startPolling();
});
startPolling(); // 首次进入
```

同理可用于：转后台暂停 `<video>`/`<audio>`、停轮播动画、停 `requestAnimationFrame` 循环、停 WebSocket 心跳降频等。

### 2.3 为什么用它、而非 unload/beforeunload

保存草稿、上报「用户离开」这类清理动作，**要挂在 `visibilitychange`（转 `hidden` 时）而不是 `unload`/`beforeunload`**：

- `unload`/`beforeunload` **执行不可靠**：移动端切走进程可能直接杀，回调根本不跑。
- 它们**破坏 [bfcache](https://developer.mozilla.org/en-US/docs/Glossary/bfcache)**：注册 `unload` 会让页面无法进往返缓存，前进/后退变慢。
- `visibilitychange` 转 `hidden` 是**最可靠的「即将离开」信号**，配合 `navigator.sendBeacon()` 上报最稳妥。

```js
// 可靠地在「页面转后台」时保存/上报（替代 beforeunload）
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    navigator.sendBeacon("/save", JSON.stringify(getDraft())); // 不阻塞、可靠
  }
});
```

## 三、Screen Wake Lock：别让屏幕熄掉

[Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) 让网页**阻止屏幕自动变暗/熄灭/锁屏**——扫码页、导航、菜谱、演示、跟练视频这类「用户在看但不摸屏幕」的场景刚需。

### 3.1 request 与 WakeLockSentinel

```js
let wakeLock = null;

/** 申请屏幕唤醒锁 */
async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return; // 特性检测
  try {
    // "screen" 是唯一支持的唤醒锁类型
    wakeLock = await navigator.wakeLock.request("screen");

    // 监听释放（可能是主动、也可能是系统/隐藏自动释放）
    wakeLock.addEventListener("release", () => {
      console.log("唤醒锁已释放，released =", wakeLock.released); // true
    });
  } catch (err) {
    // 低电量、省电模式、文档不可见等都可能拒绝
    console.error(`${err.name}: ${err.message}`);
  }
}

/** 主动释放（用完就放，别占着不放） */
async function releaseWakeLock() {
  await wakeLock?.release();
  wakeLock = null;
}
```

[`WakeLockSentinel`](https://developer.mozilla.org/en-US/docs/Web/API/WakeLockSentinel) 是「持有凭证」：`type`（`"screen"`）、`released`（是否已释放）、`release()`（主动释放，返回 `Promise`）、`release` 事件（任何原因释放都触发）。

### 3.2 隐藏自动释放 → 回前台必须重获

这是唤醒锁**最容易踩的坑**：**页面一旦转为 hidden（切标签、最小化、锁屏），唤醒锁会被系统自动释放**；回到 visible 时**不会自动恢复**，必须重新 `request`。所以标准配方是把它和 [Page Visibility](#二、page-visibility：知道页面在不在前台) 绑在一起：

```js
let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch (err) {
    console.error(err);
  }
}

// 关键配方：页面重新可见时，若之前持有过锁，就重新申请
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    await requestWakeLock(); // 重获，否则切走再回来屏幕又会熄
  }
});

// 首次在用户手势内申请
startBtn.addEventListener("click", requestWakeLock);
```

### 3.3 门槛与支持面

- **安全上下文** + **文档需可见/活动**（隐藏文档申请会被拒）。
- **权限策略** `screen-wake-lock`；Permissions API 名字也叫 `"screen-wake-lock"`，可 `query` 查状态。
- **支持面**：**Chromium 系全支持、Safari 16.4+ 支持**；**Firefox 目前尚未支持**——务必 `"wakeLock" in navigator` 探测，不支持就退回（如提示用户手动调长熄屏时间）。
- **用完即放**：唤醒锁耗电，场景结束（离开扫码页、演示结束）立刻 `release()`，别长期霸占。
