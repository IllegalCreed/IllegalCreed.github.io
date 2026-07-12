---
layout: doc
outline: [2, 3]
---

# 权限模型与工程模式

> 基于各 Web API 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **入口**：`navigator.permissions`（[Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)），主线程与 **Worker 均可用**。
- **查询**：`navigator.permissions.query({ name })` → `Promise<PermissionStatus>`。
- **三态**：`PermissionStatus.state` = `"granted"`（已允许）/ `"denied"`（已拒绝或被策略挡）/ `"prompt"`（未决定，用时会弹）。
- **只读不请求**：`query()` **不弹窗、不申请**，只报现状；真正授权仍靠调用对应 API（`getCurrentPosition`/`requestPermission`/`getUserMedia`…）。
- **监听变化**：`status.onchange` / `status.addEventListener("change", …)`——用户在设置里改权限时触发。
- **常见可查名**：`geolocation`、`notifications`、`push`、`camera`、`microphone`、`persistent-storage`、`screen-wake-lock`、`midi`…
- **名单各家不一**：`clipboard-read`/`clipboard-write` **基本仅 Chromium**；查不支持的名字会 **抛 `TypeError`**——`query()` 必须包 `try/catch`。
- **哪些走 Permissions**：定位/通知/推送/摄像头/麦克风/唤醒锁/持久存储走；**Web Share、Clipboard 写、Vibration 主要靠「用户激活」而非可查权限**。
- **权限 ≠ 激活 ≠ 策略**：三道门叠加——[Permissions](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)（用户授权）、[用户激活](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation)（手势）、[Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)（站点/iframe 层允不允许）。
- **denied 别再弹**：`denied` 时停止一切弹窗尝试，改为引导去浏览器设置或走降级。
- **特性检测优先**：`in` 运算符（`"geolocation" in navigator`）+ 能力探针（`canShare`/`ClipboardItem.supports`）先探再用。
- **渐进增强**：核心功能不依赖这些 API，把它们当「有则更好」的增强层。
- **最小权限**：**用时才申请**（just-in-time），别一进页面就连弹一串授权。
- **给理由再申请**：弹系统授权前，先用页面 UI 说清「为什么要」，避免用户下意识拒绝。
- **优雅失败**：拒绝/不支持都要有等价替代与友好提示，**绝不把异常甩给用户**。
- **无法程序化撤销**：没有 `revoke()`；用户只能去浏览器设置里手动改。

## 一、Permissions API：权限状态的只读总线

前面几页反复出现「先查权限、按状态分流」。统一它们的是 [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)——一条**只读的权限状态总线**。它不负责「申请」，只负责「告诉你现在什么状态」。

```js
// 查询某项权限的当前状态
const status = await navigator.permissions.query({ name: "geolocation" });
console.log(status.state); // "granted" | "denied" | "prompt"
console.log(status.name); // "geolocation"
```

[`PermissionStatus`](https://developer.mozilla.org/en-US/docs/Web/API/PermissionStatus) 的核心是 `state` 三态：

| 状态 | 含义 | 该怎么做 |
| --- | --- | --- |
| `"granted"` | 用户已明确允许 | 直接用 |
| `"prompt"` | 尚未决定——调用对应 API 时会弹授权窗 | 触发对应 API（顺带弹窗） |
| `"denied"` | 已明确拒绝，或被 Permissions Policy 挡 | **别再弹**，引导设置或走降级 |

### 1.1 只读不请求——最关键的边界

`query()` **不会弹授权窗**。它只是「查现状」。真正触发授权提示，仍要调用**对应 API 本身**：

```js
// ❌ 误解：以为 query 会申请权限
await navigator.permissions.query({ name: "camera" }); // 不弹窗！只查状态

// ✅ 正解：query 先探路，真正申请靠对应 API
const s = await navigator.permissions.query({ name: "camera" });
if (s.state !== "denied") {
  // prompt/granted 才尝试；调用 getUserMedia 才真正弹授权
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
}
```

### 1.2 监听权限变化

用户可能在使用中途去浏览器设置里改权限。`PermissionStatus` 是活的，能监听 `change`：

```js
const status = await navigator.permissions.query({ name: "notifications" });

// 用户在设置里改动 → 实时反映到 UI
status.addEventListener("change", () => {
  updateNotifyToggle(status.state === "granted");
});
```

### 1.3 可查询名单因浏览器而异——必须 try/catch

不同浏览器认的**权限名字**不一样。较通用的：`geolocation`、`notifications`、`push`、`camera`、`microphone`、`persistent-storage`、`screen-wake-lock`、`midi`。差异大的重灾区是**剪贴板**：`clipboard-read` / `clipboard-write` **基本只有 Chromium 支持**，Firefox/Safari 查它们会**抛 `TypeError`**。

所以生产代码里 `query()` **必须包 `try/catch`**，把「查不了」当成「未知、直接尝试调用」处理：

```js
/** 安全查询：不支持该权限名的浏览器不能让整段逻辑崩掉 */
async function safeQuery(name) {
  try {
    const s = await navigator.permissions.query({ name });
    return s.state; // "granted" | "denied" | "prompt"
  } catch {
    return "unknown"; // 该浏览器不认这个名字——按「未知」处理，靠调用时看结果
  }
}

const clip = await safeQuery("clipboard-read"); // Firefox/Safari 返回 "unknown"
```

## 二、三道门：权限、激活、策略

这批 API 的「能不能用」由**三道叠加的门**共同决定，缺一不可——混淆它们是踩坑的根源：

| 门 | 是什么 | 管什么 | 典型 API |
| --- | --- | --- | --- |
| **用户授权**（Permissions） | 用户点「允许/拒绝」 | 敏感资源的访问许可 | 定位、通知、摄像头、麦克风、唤醒锁 |
| **用户激活**（transient activation） | 一次真实手势（点击/触摸） | 防止脚本静默调用打扰性能力 | Web Share、Clipboard 写/读、Vibration、请求通知权限 |
| **权限策略**（Permissions Policy） | 站点/iframe 层面的允许清单 | 页面或嵌入的 iframe 允不允许某能力 | 几乎所有，尤以 iframe 嵌入时 |

三者是**与**关系：即便用户授权了定位（门一过），若调用不在安全上下文、或 iframe 没有 `allow="geolocation"`（门三没过），仍然拿不到。区分它们的实操意义：

- **走 Permissions 的**（定位/通知/摄像头…）→ 可 `query` 先查三态、按 `denied` 短路。
- **主要靠激活的**（Web Share / Clipboard 写 / Vibration）→ **没有可查的权限名**，只能保证「在手势回调里、激活未过期时调用」，失败就 `catch` 降级。
- **iframe 里用**→ 记得给 `<iframe allow="...">` 或响应头 `Permissions-Policy`，否则 `query` 直接返回 `denied`。

```html
<!-- iframe 内要用定位/摄像头/唤醒锁，必须显式 allow -->
<iframe
  src="https://embed.example.com"
  allow="geolocation; camera; screen-wake-lock"
></iframe>
```

## 三、工程模式：把「拿权限」做对

### 3.1 特性检测优先（先探再用）

永远先确认 API 存在，再谈权限：

```js
// in 运算符查「有没有」
const canGeo = "geolocation" in navigator;
const canShare = "share" in navigator;
const canWakeLock = "wakeLock" in navigator;

// 能力探针查「支不支持这种具体用法」
const canShareFiles = navigator.canShare?.({ files: [f] }) ?? false;
const canWritePng = globalThis.ClipboardItem?.supports?.("image/png") ?? false;
```

### 3.2 渐进增强（核心功能不绑这些 API）

把这批 API 当**增强层**：有了更好，没有也能用。分享按钮不支持 Web Share 就退回「复制链接」；定位拿不到就让用户手动选城市；通知没授权就用站内红点提示。核心流程**永远不应该**因为某个杂项 API 缺失而卡死。

### 3.3 最小权限 + 恰时申请（just-in-time）

**别一进页面就连弹一串授权**——用户会本能地全部拒绝。正确姿势是**用到某能力的那一刻、由用户操作触发时才申请**：

```js
// ❌ 反例：页面加载就抢权限，转化率极低、体验差
window.addEventListener("load", () => {
  Notification.requestPermission(); // 用户一脸懵，多半拒绝
  navigator.geolocation.getCurrentPosition(ok, err);
});

// ✅ 正解：点「订阅提醒」时才申请通知；点「查附近」时才申请定位
subscribeBtn.addEventListener("click", async () => {
  const ok = await Notification.requestPermission();
  if (ok === "granted") subscribe();
});
```

### 3.4 先给理由，再弹系统窗（pre-prompt）

系统授权窗只弹得起一次「印象」，被拒后再想要就难了。**在触发系统窗之前，先用页面自己的 UI 解释「为什么需要」**，用户点了「好的」再触发真正的系统授权——既提高通过率，也避免浪费掉唯一的 `prompt` 机会：

```js
/** 二段式授权：先自解释，用户同意后再触发系统窗 */
async function requestLocationWithReason() {
  // 若已拒绝，别再弹系统窗（弹也没用），直接引导设置
  const state = await safeQuery("geolocation");
  if (state === "denied") return showEnableInSettingsHint();

  // 先用页面弹层解释用途，用户点「允许」才继续
  const userAgreed = await showPrePrompt("需要你的位置来查找附近的门店");
  if (!userAgreed) return;

  navigator.geolocation.getCurrentPosition(onOk, onErr); // 这一步才弹系统窗
}
```

### 3.5 优雅失败（始终给用户一条出路）

拒绝、超时、不支持——每条失败路径都要有**等价替代 + 友好提示**，绝不让异常冒到用户面前：

```js
async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    toast("已复制");
  } catch {
    // 降级到可选中的文本，让用户手动复制——而不是报一个红错误
    showSelectableText(url);
  }
}
```

### 3.6 无法程序化撤销

Permissions API **没有 `revoke()`**（早期提案已移除）。网页**不能**替用户取消已授予的权限；用户只能自己去浏览器设置里改。因此「关闭通知」这类功能，页面能做的是**停止使用**（不再 `showNotification`）+ **提示用户如何在设置里彻底关闭**，而不是假装能程序化收回权限。

## 四、一段「把范式收进一个函数」的封装

把前面的模式浓缩成一个可复用的「请求某能力」助手，体现检测 → 查询 → 恰时申请 → 降级：

```js
/**
 * 通用能力请求助手
 * @param {object} opts
 * @param {string} opts.feature   navigator 上的特性名（如 "geolocation"）
 * @param {string} [opts.permission] Permissions 可查名（如 "geolocation"）
 * @param {Function} opts.use     真正调用 API 的函数（触发授权）
 * @param {Function} opts.fallback 不支持/被拒时的降级
 */
async function requestCapability({ feature, permission, use, fallback }) {
  // 1) 特性检测
  if (!(feature in navigator)) return fallback("unsupported");

  // 2) 若可查权限，先查，denied 直接短路
  if (permission) {
    const state = await safeQuery(permission);
    if (state === "denied") return fallback("denied");
  }

  // 3) 调用对应 API（prompt 会在此弹窗），失败降级
  try {
    return await use();
  } catch (err) {
    if (err?.name === "AbortError") return; // 用户主动取消，不算失败
    return fallback(err?.name ?? "error");
  }
}

// 用法：请求定位
requestCapability({
  feature: "geolocation",
  permission: "geolocation",
  use: () =>
    new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }),
    ),
  fallback: (reason) => showManualCityInput(reason),
});
```

这套骨架适配本叶几乎所有 API：把 `feature`/`permission`/`use`/`fallback` 换成对应 API 即可，权限、激活、降级都收敛在一处。
