---
layout: doc
outline: [2, 3]
---

# 生命周期：状态机、skipWaiting 与更新模型

> 基于 W3C Service Workers 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **状态机**：一个 SW 走 `installing → installed(waiting) → activating → activated → redundant`；对应 `registration.installing` / `.waiting` / `.active` 三个槽位。
- **五个词**：**download**（浏览器抓取 SW 脚本）→ **install**（触发 `install` 事件）→ **waiting**（有旧 SW 控制页面时新 SW 排队）→ **activate**（触发 `activate` 事件、开始接管）→ **redundant**（被替换/安装失败，作废）。
- **`install` 事件**：SW 首次注册或更新后触发一次；典型用途是 `event.waitUntil(预缓存)`——**promise 不 resolve 就不算装成功**，失败下次注册可重试。
- **`event.waitUntil(promise)`**：延长 `install`/`activate` 生命周期，保证异步工作（预缓存、清理）做完前 SW 不进入下一状态；也让 `fetch`/`push` 等功能事件等它。
- **waiting 阶段的坑**：若已有旧 SW 在控制页面，新 SW 装好后进入 **waiting**，**默认要等所有受控标签页全部关闭**才激活——**普通刷新（reload）不够**，因为刷新期间旧页面从未真正关闭。
- **`skipWaiting()`**：在 `install` 里调 `self.skipWaiting()`，让新 SW **跳过 waiting 立即进入 activate**，不等旧标签页关闭。
- **`clients.claim()`**：在 `activate` 里 `event.waitUntil(self.clients.claim())`，让激活的 SW **立即接管当前已打开的受控页面**（否则默认要等下次导航）。
- **`skipWaiting` + `clients.claim` 常配对**：一个跳过等待、一个立刻接管——但要求代码能容忍"页面中途换 SW"（旧页面拿到新 SW 的响应）。
- **`activate` 事件**：新 SW 接管后触发；典型用途是**收尸旧版本缓存**（`caches.keys()` 过滤删除，见[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)）与开启 navigation preload。
- **更新触发**：浏览器对 SW 脚本做**逐字节比对**（含 `importScripts()` 拉取的脚本），**只要有 1 字节不同就触发更新**、装新 SW。
- **更新检查时机**：每次**导航到作用域内页面**时检查；对长期不导航的场景，浏览器**至少每 24 小时**检查一次（防陈旧 SW）。
- **别把 SW 脚本设长缓存**：若 `sw.js` 被 HTTP 缓存缓存很久，更新会延迟；浏览器对 SW 脚本本身有特殊处理，但仍建议 `Cache-Control: max-age=0`（或很短）。
- **`navigator.serviceWorker.controller`**：指向**当前控制本页的 SW**；页面首次加载（还没被接管）时为 `null`，接管后指向 active SW。
- **`registration.update()`**：手动触发一次更新检查（不改版本号也能强制查 `sw.js` 是否变化）。
- **`updatefound` + `installing.statechange`**：监听"发现新版本→新 SW 状态变化"，是自建"有新版本，点击刷新"提示条的标准姿势。
- **`controllerchange` 事件**：`navigator.serviceWorker` 上触发，表示控制本页的 SW 变了——配合 `skipWaiting` 常用来 `location.reload()` 一次性切到新版。
- **默认新 SW 不控制老页**：MDN 原话——激活的 SW 在**下次导航前**不会管注册它的那个页面；要立刻接管用 `clients.claim()`。
- **别在 SW 顶层放状态**：SW 随时被终止再唤醒，模块级变量不保证存活——状态放 Cache/IndexedDB。

## 一、状态机全景

一个 Service Worker 从注册到作废，走的是一条**单向状态机**。规范用三个"当前 SW 槽位"记录它：`registration.installing`、`registration.waiting`、`registration.active`——同一时刻一个 registration 里最多各有一个。

```text
       register()/发现字节变化
              │
              ▼
        ┌──────────┐   install 事件
        │ installing│──────────────┐
        └──────────┘   waitUntil   │ 成功
              │ 失败                ▼
              ▼              ┌──────────────┐
        ┌──────────┐         │  installed   │  ← 有旧 SW 控制页面时
        │ redundant│◀────────│  (waiting)   │    在此排队等待
        └──────────┘         └──────────────┘
              ▲                     │ 旧页面全关 / skipWaiting()
              │ 被新版本替换          ▼
              │              ┌──────────────┐  activate 事件
              └──────────────│  activating  │  waitUntil(清理/claim)
                             └──────────────┘
                                    │
                                    ▼
                             ┌──────────────┐
                             │  activated   │  ← 正式接管，处理 fetch/push
                             └──────────────┘
```

五个关键节点：

1. **download / installing**：浏览器抓取 `sw.js`、解析、触发 `install` 事件，`registration.installing` 指向它。
2. **installed / waiting**：`install` 成功。若**没有**旧 SW 在控制页面 → 直接去激活；若**有**旧 SW → 进入 **waiting**，`registration.waiting` 指向它。
3. **activating**：轮到它接管，触发 `activate` 事件（此时可收尸旧缓存、`clients.claim()`）。
4. **activated**：正式生效，开始处理 `fetch`/`push`/`sync`，`registration.active` 指向它。
5. **redundant**：被更新的 SW 替换、或 `install`/`activate` 失败——作废回收。

## 二、install：预缓存与 waitUntil

`install` 事件在 SW 首次注册或检测到更新后触发**一次**，是**预缓存离线资源**的标准场所。关键是用 `event.waitUntil()` 把异步工作"圈"进安装生命周期：

```js
// sw.js
const CACHE = "app-shell-v1"; // 版本化缓存名，发新版时递增

self.addEventListener("install", (event) => {
  // waitUntil：预缓存没做完，就不算"装成功"；抓取失败则本次 install 失败
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // 预缓存 App Shell（HTML/CSS/JS/离线页）——Cache API 用法见浏览器章
      cache.addAll(["/", "/index.html", "/app.css", "/app.js", "/offline.html"]),
    ),
  );
});
```

要点：

- **`waitUntil(promise)` 延长事件寿命**：MDN 原文——一旦在 `install`/`activate` 上用 promise 调了它，`fetch`/`push` 等功能事件就会等这个 promise resolve 才派发。这保证"资源没缓存好之前不开始服务"。
- **install 失败可重试**：`waitUntil` 的 promise 若 reject（比如某个资源 404 让 `addAll` 整批失败），本次 install 失败、SW 变 redundant，下次注册/刷新会再试。
- **install 不需要用户许可、静默发生**（web.dev 原话）——它是脚本装进浏览器，和"用户安装 PWA"是两回事。
- **缓存的"怎么存、存什么策略"在[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)**，这里只演示 install 阶段调用它。

## 三、waiting 阶段与"关闭所有标签才更新"的坑

这是 SW 生命周期**最反直觉、最常被吐槽**的一点。默认行为是：

> 当已经有一个旧 SW 在控制页面时，新装好的 SW 会进入 **waiting** 状态排队，**直到所有受它旧版本控制的标签页全部关闭**，新 SW 才会激活接管。

致命细节：**普通刷新（`Ctrl/Cmd + R`）不算"关闭标签页"**。刷新时旧页面卸载、新页面加载，但那个标签页从未真正关闭，旧 SW 的控制权在刷新前后是连续的——所以**你改了 `sw.js`、刷新了页面，拿到的还是旧 SW**。要让新 SW 生效，用户得**关掉所有相关标签页再重新打开**，或者你在代码里显式 `skipWaiting()`（下一节）。

```js
// 页面侧：探测到有 SW 在 waiting，就提示用户"有新版本"
navigator.serviceWorker.register("/sw.js").then((reg) => {
  // 发现新版本正在安装
  reg.addEventListener("updatefound", () => {
    const newWorker = reg.installing;
    newWorker?.addEventListener("statechange", () => {
      // 新 SW 装好且已有 controller（说明是"更新"而非首装）→ 进入了 waiting
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        showUpdateBanner(); // 自建 UI：出一条"发现新版本，点击刷新"
      }
    });
  });
});
```

为什么规范要这么设计？为了**一致性**：同一时刻你打开的多个标签页应该跑同一个 SW 版本，避免"A 标签用新 SW、B 标签用旧 SW"导致缓存与逻辑错乱。代价就是更新默认"温吞"——想快就得主动 `skipWaiting`。

## 四、skipWaiting：跳过等待，立即接管

`ServiceWorkerGlobalScope.skipWaiting()` 让新 SW **不排队、装完直接进入 activate**，绕过"等所有旧标签页关闭"：

```js
// sw.js
self.addEventListener("install", (event) => {
  self.skipWaiting(); // 装好即请求跳过 waiting，立即去激活
  event.waitUntil(precache()); // 预缓存照常
});
```

但 `skipWaiting` 只解决了"新 SW 立即激活"，**没解决"立即控制已打开的页面"**——那是 `clients.claim` 的事（下一节）。而且它有**代价**：跳过等待意味着页面可能**在运行到一半时被换成新 SW**，如果新旧 SW 的缓存版本、消息协议不兼容，正在打开的页面可能拿到"半新半旧"的响应。所以：

- **纯静态、无状态的站点**：`skipWaiting` + `clients.claim` 一把梭，无脑拿最新。
- **有复杂运行时状态的应用**：更稳的做法是**不自动 skipWaiting**，而是探测到 waiting 后弹提示，用户点"刷新"时再通过 `postMessage` 通知 SW 执行 `skipWaiting()`，然后 `controllerchange` 里 `reload`：

```js
// sw.js —— 收到页面指令再跳过等待（把"何时换版本"交给用户）
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
```

```js
// 页面侧 —— 用户点"刷新"按钮
updateButton.addEventListener("click", () => {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
});
// 控制权切换到新 SW 后，重载一次页面切到新版本
let reloaded = false;
navigator.serviceWorker.addEventListener("controllerchange", () => {
  if (reloaded) return; // 防重复
  reloaded = true;
  window.location.reload();
});
```

## 五、clients.claim：接管已打开的页面

默认行为（MDN 原话）：**激活的 SW 在下次导航前不会控制注册它的那个页面**。也就是说，用户第一次访问你的站点时，SW 完成了 install + activate，但**当前这个页面本次生命周期内仍然没有被 SW 控制**（`navigator.serviceWorker.controller` 是 `null`），得等下次刷新/导航。

`Clients.claim()` 打破这个默认，让刚激活的 SW **立刻接管当前所有在其作用域内、尚无 controller 的页面**：

```js
// sw.js
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await deleteOldCaches(); // 先收尸旧缓存（实现见浏览器章）
      await self.clients.claim(); // 立即接管现有页面，首访即可离线
    })(),
  );
});
```

典型价值：**首次访问就让 SW 生效**——否则用户第一次来、SW 装好了，但这次会话还走不到缓存，得等第二次访问。配合 `skipWaiting`，就实现了"装好即全面接管"。

> 注意 `clients.claim()` 触发被接管页面的 `controllerchange` 事件；`self.clients` 是 `Clients` 对象，还能 `matchAll()` 枚举受控页面、`openWindow()` 开新窗口（推送点击场景常用，见[推送与同步](./push-notification-sync)）。

## 六、更新模型：字节比对与 24 小时检查

浏览器**如何知道 SW 有新版本**？靠**逐字节比对**：

- 每当满足"检查时机"，浏览器重新抓取 `sw.js`，**与当前已安装的版本做逐字节对比**。**只要有一个字节不同**（哪怕是改了个注释），就认定是新版本，触发 `install`。
- 比对**包含 `importScripts()` 拉取的脚本**——现代浏览器会把 importScripts 的内容也纳入更新判定（旧版曾有不纳入的坑，现已改善）。
- 反过来：**如果 `sw.js` 一字节没变，浏览器不会重新安装**。这也意味着"改了缓存里的资源、但没改 `sw.js`"时，SW 不会更新——所以版本化的做法通常是**在 `sw.js` 里维护一个版本常量或资源清单**，让发版时 `sw.js` 内容必然变化。

**检查时机**（何时会去抓 `sw.js` 比对）：

- **每次导航到作用域内的页面**时，浏览器会检查更新。
- 对功能事件（如 `push`）触发且**距上次抓取超过 24 小时**时也会检查。
- 综合起来 MDN 的规则：**浏览器至少每 24 小时检查一次更新**，防止陈旧 SW 长期驻留。
- 想手动催一次：`registration.update()`。

一个部署坑：**别给 `sw.js` 设长时间 HTTP 缓存**。如果 CDN/服务器给 `sw.js` 配了 `Cache-Control: max-age=86400`，浏览器抓到的可能是缓存里的旧脚本，更新被推迟。现代浏览器对 SW 脚本的 HTTP 缓存有特殊限制（超过 24h 的会被忽略），但稳妥做法仍是给 `sw.js` 配 `Cache-Control: max-age=0` 或很短的值。

## 七、controller 与页面-SW 关系

`navigator.serviceWorker.controller` 是理解"这个页面到底被谁控制"的钥匙：

- 它指向**当前控制本页面的 active SW**；如果本页面**尚未被任何 SW 控制**（比如首次访问、SW 刚装还没 claim），它是 `null`。
- 用它做特性判断：`if (navigator.serviceWorker.controller)` 为真，说明本页正被 SW 接管，缓存/拦截生效中。
- `controllerchange` 事件（在 `navigator.serviceWorker` 上）表示控制本页的 SW 变了——`clients.claim()` 或新 SW 接管时触发，是"切到新版后 reload"的标准挂点（见第四节）。

```js
// 判断当前页是否已被 SW 接管
if (navigator.serviceWorker.controller) {
  console.log("本页由 SW 控制，来源脚本：", navigator.serviceWorker.controller.scriptURL);
} else {
  console.log("本页尚未被 SW 控制（可能是首访、等下次导航或 claim）");
}
```

## 八、生命周期陷阱清单

- **改了 `sw.js`、刷新却没生效**：新 SW 在 waiting，普通刷新不换版——要么关掉所有标签重开，要么 `skipWaiting`，开发时用 DevTools 的 **Update on reload**。
- **`skipWaiting` 但页面还是旧的**：`skipWaiting` 只让新 SW 激活，接管现页要 `clients.claim()`——两者常配对。
- **首访不走缓存**：默认 SW 不控制注册它的当前页——要首访即生效加 `clients.claim()`。
- **`sw.js` 被长缓存导致更新延迟**：给 SW 脚本设 `Cache-Control: max-age=0`。
- **只改了资源没改 `sw.js`**：字节没变不触发更新——版本号/清单写进 `sw.js` 保证内容变化。
- **在 SW 模块顶层存运行状态**：SW 会被终止再唤醒，顶层变量丢失——状态放 Cache/IndexedDB。
- **`waitUntil` 里 promise 忘了 return/链好**：install 提前"完成"，预缓存没做完就开始服务——异步一定包进 `waitUntil`。
- **自动 `skipWaiting` 撞上不兼容**：页面中途被换新 SW，缓存/协议不兼容出错——有复杂状态时改用"提示用户刷新"模式。

下一页进入 SW 的核心超能力——**用 `fetch` 事件拦截网络、做离线兜底**（缓存策略与 Cache API 用法链接[浏览器章](/zh/base/browser/browser-cache/guide-line/sw-cache-api)，不重复）：[fetch 拦截与离线](./fetch-offline)。
