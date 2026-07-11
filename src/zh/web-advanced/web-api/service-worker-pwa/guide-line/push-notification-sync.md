---
layout: doc
outline: [2, 3]
---

# 推送与后台同步

> 基于 W3C Service Workers 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **共同前提**：Push、Background Sync、Periodic Sync 都是**在 SW 里被唤醒执行**的后台能力——页面关了也能跑，靠的正是 SW"脱离页面存活、可被事件唤醒"的特性。
- **Push API 全景**：`ServiceWorkerRegistration.pushManager.subscribe(options)` 订阅 → 拿 `PushSubscription`（含 `endpoint` + 加密公钥）→ 发给你的服务器 → 服务器经推送服务发消息 → SW 的 **`push` 事件**被唤醒。
- **VAPID**：`subscribe` 的 `applicationServerKey` 传你的 **VAPID 公钥**（ECDSA P-256）；私钥留服务器签名，让推送服务确认"消息确实来自你的应用服务器"。
- **`userVisibleOnly: true`**：Chrome/Edge 要求订阅时必须传——承诺每条推送都对用户可见（即必弹通知），杜绝"静默推送"追踪。
- **`push` 事件**：`self.addEventListener("push", …)`，用 `event.data`（`PushMessageData`：`.json()`/`.text()`）读载荷，`event.waitUntil(showNotification(...))` 保证通知弹出前 SW 不被杀。
- **弹通知靠 `showNotification`**：`self.registration.showNotification(title, options)`——**SW 里没有 `new Notification()`**，只能走 registration 这个方法。
- **Notification 权限**：`Notification.requestPermission()` 必须由**用户手势**触发；未授权不能弹通知，因此 `userVisibleOnly` 推送也发不出。
- **`notificationclick` 事件**：用户点通知 → SW 收到 → 用 `clients.matchAll()` 聚焦已开窗口或 `clients.openWindow(url)` 开新窗口。
- **Push 支持面**：**Baseline 广泛可用（2023-03 起）**，含 **Safari 16.4+**；但 **iOS/iPadOS 上必须先"添加到主屏幕"（安装为 PWA）** 才能订阅推送。
- **Background Sync（一次性）**：`registration.sync.register(tag)` 登记 → 设备恢复网络时 SW 触发一次 **`sync` 事件** → `event.waitUntil` 里补发离线期间攒下的请求。
- **`sync` 事件重试**：失败（`waitUntil` 的 promise reject）浏览器会择机重试；`event.lastChance` 为 `true` 表示这是最后一次尝试。
- **Background Sync 支持面**：**仅 Chromium（Chrome/Edge/Opera/Samsung），Firefox 与 Safari 不支持**——必须能力探测 + 降级为"页面在线时立即发"。
- **Periodic Background Sync**：`registration.periodicSync.register(tag, { minInterval })` → SW 周期性收 **`periodicsync` 事件**（如每天拉新闻）；`minInterval` 只是下限，实际由浏览器定。
- **Periodic Sync 三重限制**：**仅 Chromium** + **仅已安装的 PWA** + 受 **site engagement（站点参与度）门槛**限制——冷门站点根本不触发。
- **通用姿势**：所有后台能力都要 `event.waitUntil(异步任务)` 保活；订阅/注册要 `try/catch` + 特性探测（`"sync" in registration`、`"periodicSync" in registration`、`"PushManager" in window`）。
- **别把它当定时器**：`sync`/`periodicsync` 触发时机由浏览器裁量（网络、参与度、省电策略），**不保证准时、不保证一定触发**——设计成"尽力而为"。

## 一、Push API：服务器把消息推进 SW

Push API 让服务器**在页面未打开、甚至浏览器未运行**时把消息推给用户。它必须和 SW 搭档：消息到达时唤醒 SW 的 `push` 事件。整条链路四步：

```text
①页面订阅 → PushSubscription     ②把订阅发给你的服务器
   (pushManager.subscribe)            (fetch POST /subscribe)
        │                                    │
        ▼                                    ▼
④SW 被 push 事件唤醒 ← 推送服务 ← ③服务器用 web-push 库 + VAPID 私钥发消息
   showNotification()      (FCM/Mozilla/Apple)
```

### 1.1 订阅：subscribe + VAPID

```js
// 页面侧：先要通知权限，再订阅推送
async function subscribePush() {
  // 1) 通知权限必须由用户手势触发（如点击"开启通知"按钮）
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return; // 用户拒绝：不能推送

  const registration = await navigator.serviceWorker.ready;

  // 2) 订阅：applicationServerKey 是你的 VAPID 公钥
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true, // Chrome/Edge 强制：承诺每条推送都弹通知
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // 3) 把订阅（含 endpoint 与加密公钥）发给自己的服务器保存
  await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription), // 序列化含 endpoint / keys.p256dh / keys.auth
  });
}
```

要点：

- **`PushSubscription`** 含 `endpoint`（推送服务给这个订阅分配的唯一 URL，**要保密**——拿到它就能给用户发推送）和加密密钥 `keys.p256dh` / `keys.auth`（服务器用来端到端加密载荷）。
- **`applicationServerKey`（VAPID 公钥）**：接受 base64url 字符串或 `Uint8Array`/`ArrayBuffer`。VAPID（自愿应用服务器标识）让推送服务确认消息来自你——**私钥留在服务器**，用 `web-push` 一类库签名。
- **`userVisibleOnly: true`**：Chrome 强制。承诺每条推送都对用户可见（即必调 `showNotification`），换取订阅许可——防止"静默推送"变成后台追踪。
- **`pushsubscriptionchange` 事件**：订阅失效/即将过期时在 SW 触发，需重新订阅并更新服务器。

### 1.2 接收：push 事件 + showNotification

```js
// sw.js：服务器推来消息，SW 被唤醒
self.addEventListener("push", (event) => {
  // event.data 是 PushMessageData：.json() / .text() / .arrayBuffer()
  const payload = event.data?.json() ?? { title: "新消息", body: "" };

  // waitUntil 保证通知弹出前 SW 不被终止
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge.png",
      data: { url: payload.url }, // 存点击后要跳转的地址
    }),
  );
});

// 用户点击通知：聚焦已有窗口或开新窗口
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window" });
      // 已有同源窗口就聚焦，避免重复开
      for (const client of allClients) {
        if (client.url === targetUrl && "focus" in client) return client.focus();
      }
      // 否则开新窗口
      return self.clients.openWindow(targetUrl);
    })(),
  );
});
```

**关键约束**：SW 里**没有 `new Notification()`**（那是页面 API），只能用 `self.registration.showNotification(title, options)` 弹通知；且必须先有 `Notification` 权限。

### 1.3 支持面与 iOS 特例

- **Baseline：2023-03 起广泛可用**，含 **Safari 16.4+**——Web Push 终于跨全平台桌面浏览器可用。
- **iOS/iPadOS 硬门槛**：Safari 在 iOS 上，**必须先把网站"添加到主屏幕"（安装为 PWA）**，用户在这个已安装的 PWA 里才能订阅并接收推送——普通 Safari 标签页里订阅不了。这是做 iOS Web 推送时最容易忽略的前提。

## 二、Background Sync：断网重连后补发请求

一次性 Background Sync 解决的问题很具体：**用户离线时点了"发送"，怎么保证恢复网络后请求一定被补发**——哪怕用户已经关掉了页面。做法是把"待办"登记给 SW，由浏览器在**网络恢复时**唤醒 SW 的 `sync` 事件执行。

```js
// 页面侧：发消息失败时，登记一个后台同步兜底
async function sendMessage(msg) {
  await saveToOutbox(msg); // 先把消息存进 IndexedDB 发件箱
  try {
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration) {
      // 登记后台同步；恢复网络时 SW 会收到 sync 事件
      await registration.sync.register("sync-outbox");
    } else {
      await flushOutbox(); // 不支持 Background Sync：能连就直接发（降级）
    }
  } catch {
    await flushOutbox();
  }
}
```

```js
// sw.js：设备恢复网络，SW 被唤醒
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-outbox") {
    // waitUntil 的 promise 成功 → 本次同步完成；reject → 浏览器择机重试
    event.waitUntil(
      flushOutbox().catch((err) => {
        if (event.lastChance) {
          // 最后一次机会仍失败：记录/告知用户，别无限吞
          console.error("后台同步最终失败：", err);
        }
        throw err; // 抛出让浏览器安排重试（非 lastChance 时）
      }),
    );
  }
});
```

要点：

- **`registration.sync`** 是 `SyncManager`；`register(tag)` 用一个字符串标签登记，同名标签合并（不会重复排队）。`getTags()` 可查已登记的标签。
- **触发时机由浏览器裁量**：设备有稳定网络时触发，不保证即时；失败会重试，`event.lastChance === true` 表示这是浏览器安排的**最后一次**尝试。
- **支持面窄**：**仅 Chromium 系（Chrome/Edge/Opera/Samsung Internet），Firefox 与 Safari 均不支持**。所以**必须特性探测 + 降级**：不支持时退回"页面在线就立即发 + `online` 事件补发"。

## 三、Periodic Background Sync：周期性后台刷新

Periodic Background Sync 面向"**定期在后台更新内容**"的场景——比如新闻/邮件类 PWA 想每天早上预取最新内容，用户打开时即是新的。它比一次性 sync 限制严得多。

```js
// 页面侧：注册周期同步（需已安装 PWA + 已授权）
async function registerPeriodicSync() {
  const registration = await navigator.serviceWorker.ready;
  if (!("periodicSync" in registration)) return; // 仅 Chromium

  // 需要 periodic-background-sync 权限（通常已安装 PWA 才会授予）
  const status = await navigator.permissions.query({
    name: "periodic-background-sync",
  });
  if (status.state !== "granted") return;

  try {
    await registration.periodicSync.register("refresh-content", {
      minInterval: 24 * 60 * 60 * 1000, // 最短 24h；实际间隔浏览器说了算
    });
  } catch (err) {
    console.warn("周期同步注册失败：", err);
  }
}
```

```js
// sw.js：浏览器按裁量周期性唤醒
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-content") {
    event.waitUntil(fetchAndCacheLatest()); // 预取并写入缓存
  }
});
```

**三重硬限制**（务必记住，否则做了不生效还查不出原因）：

- **仅 Chromium**：Firefox/Safari 完全不支持。
- **仅已安装的 PWA**：网站没被用户安装到设备，`periodicSync` 不可用。
- **受 site engagement 门槛限制**：浏览器根据**站点参与度**决定是否触发、多久触发一次——用户很少用的 PWA 可能几乎不触发；`minInterval` 只是你给的**下限**，真实频率由浏览器结合参与度、网络、电量裁定。

## 四、三种后台能力对比

| 能力 | 触发时机 | SW 事件 | 支持面 | 典型场景 |
| --- | --- | --- | --- | --- |
| **Push** | 服务器主动推 | `push` | Baseline（含 Safari 16.4+；iOS 需装 PWA） | 即时消息、突发通知 |
| **Background Sync（一次性）** | 恢复网络时 | `sync` | **仅 Chromium** | 离线发件箱、失败请求补发 |
| **Periodic Background Sync** | 周期性（浏览器裁量） | `periodicsync` | **仅 Chromium + 仅已装 PWA + 参与度门槛** | 定期预取新闻/邮件 |

共同心法：

- **都要 `event.waitUntil(异步任务)`**——不然 SW 处理到一半就被终止。
- **都要特性探测 + 降级**——`"PushManager" in window`、`"sync" in registration`、`"periodicSync" in registration`。
- **都是"尽力而为"**——触发时机受网络/电量/参与度影响，别当准时定时器用。

下一页从"后台能力"回到"用户可见的门面"——**Web App Manifest 与 PWA 安装**：[Manifest 与安装](./manifest-install)。
