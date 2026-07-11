---
layout: doc
outline: [2, 3]
---

# Manifest 与安装

> 基于 W3C Service Workers 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **Web App Manifest**：一个 JSON 文件，告诉浏览器"这个网站作为应用叫什么、什么图标、怎么启动、怎么显示"——是把网站变成**可安装 PWA** 的身份证。
- **挂载**：`<link rel="manifest" href="/app.webmanifest" />` 放进 `<head>`；MIME 类型 `application/manifest+json`（`.json` 后缀通常也认）。
- **带凭据的 manifest**：`<link rel="manifest" href="/app.webmanifest" crossorigin="use-credentials" />`。
- **核心字段**：`name`（全名）/ `short_name`（主屏短名）/ `icons`（图标数组）/ `start_url`（启动地址）/ `display`（显示模式）/ `theme_color`（主题色）/ `background_color`（启动屏背景）/ `scope`（导航范围）。
- **`icons`**：数组，每项 `{ src, sizes, type, purpose }`；**安装要求至少含 192×192 与 512×512**；`purpose: "maskable"` 提供适配各平台形状的自适应图标，`"any"` 为普通图标。
- **`display` 四值**：`standalone`（独立窗口、无浏览器 UI，最常用）/ `fullscreen`（全屏，游戏类）/ `minimal-ui`（留最小导航控件）/ `browser`（就是普通标签页，等于不装）。
- **`display_override`**：数组，按序覆盖 `display` 的回退链（可含 `window-controls-overlay` 等新模式）；不被识别就落回 `display`。
- **安装条件（Chromium）**：**HTTPS**（或 localhost）+ 有效 manifest（`name` 或 `short_name`、`icons` 含 192 与 512、`start_url`、`display` 为 standalone/fullscreen/minimal-ui、`prefer_related_applications` 非 true）。
- **Service Worker 与安装条件**：**曾是硬性要求**（需注册带 `fetch` 处理器的 SW）；**较新 Chromium 已放宽——SW 不再是"能弹安装"的强制项**，但没有 SW 装完就无法离线，实践上仍应配 SW。
- **`beforeinstallprompt`**：**Chromium 私有事件**（Firefox/Safari 不支持），满足安装条件时在 `window` 触发；`preventDefault()` 拦掉默认安装小横幅，存下事件做自定义安装按钮。
- **自定义安装 UI**：存下事件 → 显示自己的"安装"按钮 → 用户点击时 `event.prompt()` → `await event.userChoice` 读 `{ outcome: "accepted"|"dismissed", platform }`。
- **`prompt()` 只能调一次**：一个 `beforeinstallprompt` 事件对象的 `prompt()` 用过即废，用完置空、隐藏按钮。
- **`appinstalled` 事件**：PWA 安装成功后在 `window` 触发——用来埋点、隐藏安装入口。
- **iOS Safari 差异**：**无 `beforeinstallprompt`**；通过分享菜单"添加到主屏幕"安装；只认部分 manifest 字段 + `apple-touch-icon`、`apple-mobile-web-app-*` 系列 meta。
- **iOS 版本线**：iOS 16.3 及更早仅 Safari 能装；**iOS 16.4+** 起 Safari/Chrome/Edge/Firefox/Orion 都能从分享菜单安装 PWA。
- **一个源建议一个 `id`**：`id` 字段给 PWA 稳定身份，避免改 `start_url` 被当成"另一个应用"重复安装。
- **`theme_color` 双端**：影响地址栏/任务切换器配色；可配 `<meta name="theme-color">` 并用 `media` 区分深浅色。

## 一、Web App Manifest：PWA 的身份证

Manifest 是一个 JSON 文件，回答浏览器四个问题：这个网站**作为应用**叫什么、长什么图标、从哪启动、以什么外观显示。它是"把网站安装成 PWA"的前提。用一个 `<link>` 挂进页面 `<head>`：

```html
<link rel="manifest" href="/app.webmanifest" />
```

一个覆盖常用字段的完整示例：

```json
{
  "id": "/?source=pwa",
  "name": "IllegalCreed 技术笔记",
  "short_name": "笔记",
  "description": "开发者技术笔记与速查",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui"],
  "orientation": "portrait",
  "theme_color": "#1e293b",
  "background_color": "#ffffff",
  "lang": "zh-CN",
  "dir": "ltr",
  "categories": ["education", "productivity"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "搜索",
      "url": "/search",
      "icons": [{ "src": "/icons/search.png", "sizes": "96x96" }]
    }
  ]
}
```

### 1.1 字段清单

| 字段 | 作用 |
| --- | --- |
| `name` / `short_name` | 全名 / 主屏图标下的短名（空间不足时用 short_name） |
| `icons` | 图标数组，每项 `{ src, sizes, type, purpose }`；安装需 192 与 512 |
| `start_url` | 从图标启动时加载的 URL（可带来源参数做埋点） |
| `scope` | 应用的导航范围；跳出 scope 的链接会退回浏览器标签 |
| `display` | 显示模式（见下节四值） |
| `display_override` | 显示模式的有序回退链，优先于 `display` |
| `theme_color` | 主题色，影响地址栏/状态栏/任务切换器配色 |
| `background_color` | 启动屏（splash）背景色，配合 `name` + `icons` 生成启动画面 |
| `orientation` | 首选屏幕方向（`portrait`/`landscape`…） |
| `id` | PWA 稳定唯一标识；不设则用 `start_url` 兜底 |
| `description` / `categories` | 描述 / 分类，供安装 UI 与应用目录展示 |
| `shortcuts` | 长按图标弹出的快捷入口 |
| `screenshots` | 富安装弹窗展示的应用截图（Android 上让安装弹窗更"像应用商店"） |

> MDN 提示：`dir`、`lang`、`iarc_rating_id` 在浏览器中**尚未实现**（写了也可能不生效），使用时留意。

## 二、display 显示模式

`display` 决定 PWA 启动后的"外壳"长什么样，四个标准值：

| 值 | 外观 | 适用 |
| --- | --- | --- |
| `standalone` | **独立应用窗口**，无浏览器地址栏/前进后退——最像原生 | 绝大多数 PWA |
| `fullscreen` | 全屏，连状态栏都尽量隐藏 | 游戏、沉浸式媒体 |
| `minimal-ui` | 独立窗口但保留最小导航控件（刷新/前进后退） | 需要基本导航的工具类 |
| `browser` | 就是普通浏览器标签页 | 等于"不作为应用运行" |

`display_override` 是更细的控制：给一个**有序数组**，浏览器从头挑第一个它认识的模式，都不认识才落回 `display`。它能启用一些 `display` 枚举里没有的新模式，例如 `window-controls-overlay`（把内容延伸到标题栏区域，桌面 PWA 用）：

```json
{
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone", "minimal-ui"]
}
```

## 三、安装条件

一个网站要能被浏览器**提示安装**（弹出安装入口），得同时满足一组条件。以 Chromium 系（Chrome/Edge/Samsung Internet）为准：

- **HTTPS**：整站安全上下文（`localhost` / `127.0.0.1` 本地开发例外）。
- **有效的 Web App Manifest**，且满足：
  - 有 `name` 或 `short_name`；
  - `icons` **至少包含一个 192×192 和一个 512×512** 的图标；
  - 有 `start_url`；
  - `display` 是 `standalone` / `fullscreen` / `minimal-ui` 之一（`browser` 不算可安装）；
  - `prefer_related_applications` 为 `false` 或不写（否则表示"更推荐原生应用"，不弹 Web 安装）。

关于 **Service Worker 与安装条件**（一个容易过时的点）：

> **历史上**，Chromium 要求网站**注册一个带 `fetch` 事件处理器的 Service Worker** 才算可安装——这曾是硬性门槛。**较新的 Chromium 已放宽**：SW / fetch 处理器**不再是"能弹安装提示"的强制条件**，仅凭 HTTPS + 合规 manifest 即可触发安装。但请注意：**没有 SW 的 PWA 装完就无法离线**（断网白屏），体验残缺。所以工程实践上——**"能装"和"该配 SW"是两件事，可安装门槛放宽了，但你仍应为离线配 SW**。

## 四、beforeinstallprompt：自定义安装体验

默认情况下，满足安装条件后 Chromium 会自己弹一个不起眼的安装提示（地址栏图标/小横幅）。想**自己掌控"何时、以什么样式"引导安装**，就拦截 `beforeinstallprompt` 事件：

```js
let deferredPrompt = null;
const installButton = document.querySelector("#install-btn");

// 1) 满足安装条件时，Chromium 在 window 上触发该事件
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault(); // 阻止浏览器默认的安装小横幅
  deferredPrompt = event; // 存下事件，等用户点我们自己的按钮
  installButton.hidden = false; // 显示自定义"安装"按钮
});

// 2) 用户点击自定义按钮时，才真正弹系统安装框
installButton.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); // 弹出系统安装提示（一个事件只能调一次）
  const { outcome, platform } = await deferredPrompt.userChoice;
  console.log(`用户选择：${outcome}，平台：${platform}`); // accepted / dismissed
  deferredPrompt = null; // 用过即废，置空
  installButton.hidden = true; // 隐藏按钮
});

// 3) 安装成功后 window 触发 appinstalled，收尾埋点
window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  installButton.hidden = true;
  console.log("PWA 已安装");
});
```

四个必须记住的点：

- **`beforeinstallprompt` 是 Chromium 私有事件**——**Firefox 与 Safari 完全不支持**。做自定义安装 UI 一定要能力探测，别在不支持的浏览器上依赖它。
- **`preventDefault()` + 存事件**：不拦就是浏览器默认 UI；拦下来存事件，才能延后到你想要的时机 `prompt()`。
- **`prompt()` 一次性**：一个事件对象的 `prompt()` 调用一次后失效，`userChoice` 拿到 `{ outcome, platform }`（`outcome` 为 `accepted` 或 `dismissed`）。
- **`appinstalled`**：安装成功后在 `window` 触发，用于埋点、隐藏安装入口。

## 五、iOS Safari 的差异

iOS/iPadOS 上 PWA 安装是**另一套逻辑**，做跨端 PWA 必须单独处理：

- **没有 `beforeinstallprompt`**：Safari 不支持这个事件，**你无法用 JS 触发安装、也无法自定义安装按钮**。只能引导用户手动操作：点分享菜单 → "添加到主屏幕"。
- **版本线**：iOS 16.3 及更早**只有 Safari** 能"添加到主屏幕"；**iOS 16.4+** 起，Safari/Chrome/Edge/Firefox/Orion 都能从分享菜单安装 PWA。
- **只认部分 manifest 字段**，很多能力靠 Apple 私有的 `meta`/`link` 补：

```html
<!-- iOS 上的主屏图标（manifest 的 icons 支持有限，用这个更稳） -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
<!-- 以独立模式启动（类似 display: standalone） -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<!-- 状态栏样式 -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<!-- 主屏图标下的应用名（类似 short_name） -->
<meta name="apple-mobile-web-app-title" content="笔记" />
```

- **推送前提**：如前一页所述，iOS 上 **Web Push 必须在"已添加到主屏幕"的 PWA 里**才可用——安装是推送的前提。

## 六、坑位清单

- **图标缺 192/512**：Chromium 不判定为可安装——两个尺寸都要有。
- **`display: browser`**：等于没装，不会弹安装——用 `standalone`。
- **在 Firefox/Safari 上等 `beforeinstallprompt`**：永远等不到——能力探测，iOS 走"添加到主屏幕"引导。
- **`prompt()` 调了多次**：第二次无效——一个事件只 `prompt()` 一次，用完置空。
- **以为"能安装"就"能离线"**：安装条件放宽后没 SW 也能装，但装完断网白屏——离线要另配 SW。
- **改了 `start_url` 没设 `id`**：可能被当成新应用重复安装——用稳定的 `id`。
- **iOS 图标只靠 manifest**：`apple-touch-icon` 更可靠——补上 Apple 系 meta/link。
- **manifest 路径/MIME 错**：`<link rel="manifest">` 404 或 MIME 不对，安装条件不满足——确认返回 `application/manifest+json`。

回到全局视角，用一页把生命周期状态机、事件、能力支持矩阵、安装条件、易错点一次性摊平——[参考](../reference)。
