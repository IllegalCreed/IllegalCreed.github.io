---
layout: doc
outline: [2, 3]
---

# 入门：合集定位与四条共性地基

> 基于各 Web API 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：本叶是一批**贴设备、贴系统的小 API 合集**——剪贴板 / 分享 / 通知 / 页面可见性 / 唤醒锁 / 定位 / URLPattern / 权限查询，外加 Battery/NetInfo/Vibration；共享同一套「安全上下文 + 用户激活 + 权限 + 特性检测」地基。
- **地基一 · 安全上下文**：几乎全部要求 [Secure Context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)——线上 **HTTPS**、本地 `localhost` / `127.0.0.1` 放行，普通 `http://` 页面上这些 API 要么 `undefined` 要么调用即抛。
- **地基二 · 用户激活**：Clipboard 写/读、Web Share、Vibration、（多数浏览器的）`Notification.requestPermission` 都要求**由真实用户手势触发**（[transient activation](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation)）——写在 `click` 回调里，别在定时器/纯脚本里裸调。
- **激活会过期**：手势激活是**瞬时**的，`await` 一个耗时异步之后再调受激活约束的 API，往往因激活已消耗而 `NotAllowedError`——先拿激活、把异步准备提前。
- **地基三 · 权限模型**：部分 API 走 [Permissions API](./guide-line/permissions-patterns) 三态（`granted`/`denied`/`prompt`），可 `navigator.permissions.query({ name })` **先查后用**，还能 `onchange` 监听用户在设置里改权限。
- **Permissions 只读不请求**：`query()` 只告诉你现状，**不弹窗、不申请**；真正触发授权仍靠调用对应 API（如 `getCurrentPosition`）本身。
- **可查询名单各家不一**：`geolocation`/`notifications`/`push`/`camera`/`microphone`/`screen-wake-lock` 较通用；`clipboard-read`/`clipboard-write` **基本只有 Chromium 认**，Firefox/Safari 查不到会抛 `TypeError`。
- **地基四 · 特性检测**：`in` 运算符（`"share" in navigator`、`"wakeLock" in navigator`）+ 能力探针（`navigator.canShare({files})`、`ClipboardItem.supports(type)`）——**先探再用**是这批 API 的默认姿势。
- **降级优雅**：拿不到能力就退回（复制退 `execCommand`、分享退「复制链接」、通知退站内提示），**失败也别抛脸给用户**。
- **失败常常静默**：桌面 `vibrate()`、无 GPS 时的 `getCurrentPosition` 可能「什么都不发生」——要主动校验结果/超时，别假设「调了就成」。
- **Web Worker 可达性不一**：Permissions、Notifications、URLPattern 在 Worker 里可用；Clipboard、Web Share、Geolocation、Wake Lock 基本仅主线程。
- **平台割裂要记**：Web Share / Vibration / 页面级 Notification 是**移动主场**，桌面残缺；**iOS 的 Web 通知要求先把 PWA 装到主屏**。
- **推送 ≠ 本地通知**：本叶只讲**本地弹通知**（`new Notification` / `showNotification`）；**服务端主动推**（Push API + 订阅 + 后台唤醒）在 [Service Worker & PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)。
- **剪贴板是敏感面**：读写系统剪贴板涉及 paste-jacking、窃取敏感内容等风险，安全考量见[浏览器安全章](/zh/base/browser/browser-security/)。
- **隐私收缩**：Battery Status（Firefox 已移除、Safari 从未实现）、Network Information（Chromium 独占非标准）——「读设备状态」类 API 因指纹风险整体收缩，别依赖。
- **进阶顺序**：本页 → [剪贴板与分享](./guide-line/clipboard-share) → [通知、页面状态与唤醒锁](./guide-line/notification-visibility-wake) → [定位、URL 与其他](./guide-line/geolocation-url-others) → [权限模型与工程模式](./guide-line/permissions-patterns) → [参考](./reference)。

## 一、这是一个「合集叶」

Web API 章前面的叶子（IndexedDB、Fetch、Streams、WebRTC……）都是**单一大主题**，各有成体系的模型与深坑。到本叶收尾时，还剩一批**单独拎出来撑不起一叶、但日常又高频**的平台能力：复制一段文字、唤起系统分享、弹条通知、知道页面是不是在前台、别让屏幕熄掉、拿一次经纬度、匹配一条路由、查一下某个权限给没给。

把它们收在一起，不是因为凑数，而是因为它们**共享同一套底层契约**。与其在八个地方各讲一遍「要 HTTPS、要用户点一下、先查权限、先探测再用」，不如在入门页把这四条**共性地基**讲透一次，后面每个 API 只讲它**独有**的部分。

**和相邻内容的分工：**

| 你想做的事 | 去哪读 |
| --- | --- |
| 复制/粘贴、唤起系统分享面板 | 本叶 [剪贴板与分享](./guide-line/clipboard-share) |
| 本地弹一条系统通知、页面前后台省电、防熄屏 | 本叶 [通知、页面状态与唤醒锁](./guide-line/notification-visibility-wake) |
| 取地理位置、前端路由 URL 匹配、电量/网络/振动 | 本叶 [定位、URL 与其他](./guide-line/geolocation-url-others) |
| **服务端主动推送**通知（订阅 + 后台唤醒） | [Service Worker & PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/) |
| 剪贴板/权限背后的**安全威胁模型** | [浏览器安全章](/zh/base/browser/browser-security/) |
| 权限的三态查询与工程范式 | 本叶 [权限模型与工程模式](./guide-line/permissions-patterns) |

## 二、地基一：安全上下文（HTTPS）

这批 API 几乎清一色只在**安全上下文**里可用。安全上下文的判定很简单：

- **线上必须 HTTPS**：`https://` 页面是安全上下文。
- **本地开发放行**：`http://localhost`、`http://127.0.0.1`、`file://` 被当作安全上下文，方便本地调试。
- **普通 HTTP 不行**：`http://example.com` 这样的线上明文页面**不是**安全上下文。

在非安全上下文里，`navigator.clipboard`、`navigator.share`、`navigator.geolocation`（现代浏览器）、`navigator.wakeLock` 等要么直接是 `undefined`，要么调用时抛 `NotAllowedError` / `SecurityError`。所以第一条工程纪律是：

```js
/** 统一的安全上下文守卫：非安全上下文直接走降级分支 */
if (!window.isSecureContext) {
  // 例如：提示用户「该功能需在 HTTPS 下使用」，或退回不依赖这些 API 的方案
  console.warn("当前非安全上下文，剪贴板/分享/定位等能力不可用");
}
```

> `window.isSecureContext` 是最直接的判据，比逐个 `try/catch` 优雅。

## 三、地基二：用户激活（transient activation）

浏览器不允许页面在**没有用户参与**的情况下静默调用某些「打扰用户」的能力——弹分享面板、写剪贴板、让手机震动、申请通知权限，都要求由一次**真实用户手势**（点击、按键、触摸）触发。这套机制叫**瞬时用户激活（transient activation）**。

关键在于「**瞬时**」两个字：手势带来的激活窗口很短（秒级），而且**会被消耗**。最常见的翻车是「先 `await` 再调用」：

```js
button.addEventListener("click", async () => {
  // ❌ 反例：先 await 一个耗时请求，激活窗口在等待中过期
  const data = await fetch("/api/report").then((r) => r.json());
  await navigator.share(data); // 很可能抛 NotAllowedError：激活已失效

  // ✅ 正解：把异步准备提前，手势一到就立刻调用受激活约束的 API
});

button.addEventListener("click", async () => {
  // 若必须用异步数据，先在点击前/更早备好，回调里直接用
  await navigator.share(preparedData); // 手势仍新鲜，激活有效
});
```

工程口诀：**受用户激活约束的调用，要么放在手势回调的「第一时间」，要么确保调用前没有会消耗激活的 `await`。** 哪些 API 吃这一套，见[参考页的「用户激活要求表」](./reference)。

## 四、地基三：权限模型（Permissions 作为「权限总线」）

一部分 API（定位、通知、摄像头、麦克风、唤醒锁、剪贴板读……）访问的是**敏感资源**，需要用户显式授权。授权状态由浏览器统一管理，[Permissions API](./guide-line/permissions-patterns) 是查询这套状态的**只读总线**：

```js
// 先查后用：不弹窗，只问「现在给没给」
const status = await navigator.permissions.query({ name: "geolocation" });

switch (status.state) {
  case "granted": // 已授权，可直接用
    locate();
    break;
  case "prompt": // 尚未决定，调用对应 API 时会弹窗
    locate(); // getCurrentPosition 触发授权弹窗
    break;
  case "denied": // 已拒绝，别再弹了——引导去设置或走降级
    showManualHint();
    break;
}

// 还能监听用户之后在浏览器设置里的改动
status.onchange = () => console.log("权限变为：", status.state);
```

两条必须先立住的边界：

- **`query()` 只读不请求**：它**不会**弹授权窗，只告诉你现状。真正触发授权，仍要调用对应 API 本身（`getCurrentPosition`、`requestPermission`、`getUserMedia`……）。
- **可查询名单因浏览器而异**：`geolocation`/`notifications`/`push`/`camera`/`microphone`/`screen-wake-lock` 较通用；`clipboard-read`/`clipboard-write` **基本只有 Chromium 支持**，在 Firefox/Safari 里查会抛 `TypeError`——所以 `query()` 本身也要 `try/catch`。

完整三态语义、`onchange`、哪些 API 走 Permissions、以及「查询失败也要能跑」的工程写法，见[权限模型与工程模式](./guide-line/permissions-patterns)。

## 五、地基四：特性检测与渐进增强

平台割裂是这批 API 的常态：URLPattern 到 2025 年才补齐所有浏览器、Web Share 桌面支持稀薄、Battery 被移除、`clipboard.read` 在 Firefox 落地晚。**因此「先探测、后使用、拿不到就降级」不是可选项，而是默认姿势。**

三种探测手段，从粗到细：

```js
// 1) in 运算符：查「有没有这个 API」
if ("share" in navigator) {
  /* 支持 Web Share */
}
if ("wakeLock" in navigator) {
  /* 支持屏幕唤醒锁 */
}

// 2) 能力探针：查「这个 API 支不支持这种具体用法」
if (navigator.canShare?.({ files: [someFile] })) {
  /* 支持分享文件（不止是支持分享） */
}
if (typeof ClipboardItem !== "undefined" && ClipboardItem.supports?.("image/png")) {
  /* 支持写 PNG 到剪贴板 */
}

// 3) 优雅降级：探测失败给出等价替代，别把错误甩给用户
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text); // 首选
  } else {
    legacyCopy(text); // 退回 execCommand('copy')（已废弃但仍可用作兜底）
  }
}
```

> `?.`（可选链）在这里很关键：`navigator.canShare?.(...)` 能同时处理「`canShare` 不存在」和「存在但返回 false」两种情况，一行写完探测。

## 六、把四条地基串成一个范式

几乎每个「贴系统的小 API」都能套进同一个骨架——**检测 → 激活内调用 → 查权限/处理拒绝 → 降级**：

```js
/**
 * 通用范式示例：一个「分享或复制」按钮
 * 体现四条地基：安全上下文（隐含 HTTPS）、用户激活（click 内）、
 * 特性检测（canShare/in）、优雅降级（退回复制）
 */
shareBtn.addEventListener("click", async () => {
  const data = { title: "标题", text: "一段介绍", url: location.href };

  // 特性检测：既支持 share、又能分享这份 data
  if (navigator.canShare?.(data)) {
    try {
      await navigator.share(data); // 用户激活仍有效：click 第一时间调用
    } catch (err) {
      if (err.name !== "AbortError") console.error(err); // 用户取消不算错误
    }
    return;
  }

  // 降级：不支持分享就退回「复制链接」
  try {
    await navigator.clipboard.writeText(data.url);
    toast("链接已复制");
  } catch {
    toast("请手动复制：" + data.url); // 再降一级，始终给用户一条出路
  }
});
```

记住这个骨架，后面每个 API 的「独有部分」就是往里填空。下一页从最高频的**剪贴板与分享**开始。
