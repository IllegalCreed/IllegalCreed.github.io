---
layout: doc
outline: [2, 3]
---

# 剪贴板与分享

> 基于各 Web API 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **入口**：`navigator.clipboard`（[Clipboard](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard) 接口，异步剪贴板），仅**安全上下文**、**不在 Web Worker**。
- **写文本**：`navigator.clipboard.writeText(str)` → `Promise<void>`；最常用、支持面最广的一个。
- **读文本**：`navigator.clipboard.readText()` → `Promise<string>`；比写更敏感，权限/提示更严。
- **写富内容**：`navigator.clipboard.write(items)` → `Promise<void>`，`items` 是 `ClipboardItem[]`。
- **读富内容**：`navigator.clipboard.read()` → `Promise<ClipboardItem[]>`；遍历 `item.types` + `item.getType(mime)` 取 `Blob`。
- **ClipboardItem**：`new ClipboardItem({ "text/plain": blobOrString, "text/html": blob })`，值可为 `Blob` 或 `Promise<Blob｜string>`；一个 item 可挂多种表示。
- **富内容 MIME**：`text/plain`、`text/html`、`image/png` 是较稳的三种；`ClipboardItem.supports(mime)`（静态）探能不能写某类型。
- **需焦点**：读剪贴板要求文档**处于焦点**，否则 `NotAllowedError`（`document.hasFocus()` 可自查）。
- **需用户激活**：写/读一般都要**用户手势**触发（Chromium 授权后写可免手势，读仍要）。
- **权限差异**：Chromium 走 Permissions 的 `clipboard-read` / `clipboard-write`；**Firefox/Safari 不认这俩名**，改用「粘贴菜单」等临时提示放行。
- **Firefox read 落地晚**：`readText`/`read` 面向网页的支持明显晚于 Chromium（长期仅扩展可用，网页读到 2024 年 Firefox 125 起才逐步开放），生产上对 read 要备降级。
- **execCommand 已废弃**：`document.execCommand("copy"｜"cut"｜"paste")` 是老同步 API，**仅作降级兜底**，别用于新代码。
- **Web Share 入口**：`navigator.share(data)` → `Promise<void>`，唤起**系统原生分享面板**。
- **ShareData**：`{ title?, text?, url?, files? }`，至少给一个有效字段；`url` 最常用。
- **canShare 探测**：`navigator.canShare(data)` → `boolean`，尤其用 `canShare({ files })` **探测能不能分享文件**（各平台差异大）。
- **Share 硬门槛**：仅**安全上下文** + **必须用户激活** + `web-share` 权限策略；**移动主力**，桌面支持稀薄。
- **用户取消**：`share()` 被用户关掉面板 → 拒绝为 `AbortError`，**当正常流程处理、别报错**。
- **安全提示**：剪贴板是敏感面（paste-jacking、窃取/篡改），威胁模型见[浏览器安全章](/zh/base/browser/browser-security/)。

## 一、异步剪贴板：四个方法

`navigator.clipboard`（[Clipboard](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard) 接口）是现代的**异步剪贴板 API**，取代了 `document.execCommand`。四个方法两两成对——文本一对、富内容一对：

| 方法 | 签名 | 用途 |
| --- | --- | --- |
| `writeText(str)` | `Promise<void>` | 写纯文本（最常用） |
| `readText()` | `Promise<string>` | 读纯文本 |
| `write(items)` | `Promise<void>` | 写富内容（`ClipboardItem[]`） |
| `read()` | `Promise<ClipboardItem[]>` | 读富内容 |

它只在**安全上下文**存在，且**不暴露给 Web Worker**（剪贴板绑定用户交互与文档焦点）。

### 1.1 写纯文本：最高频的用法

```js
/** 复制一段文本到剪贴板，带完整降级与结果反馈 */
async function copyText(text) {
  // 首选：现代异步剪贴板
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true; // 成功
    } catch (err) {
      // 权限被拒 / 非焦点 / 非安全上下文等，落到降级
      console.warn("clipboard.writeText 失败，尝试降级：", err);
    }
  }
  // 降级：已废弃但兼容性兜底仍有效的 execCommand
  return legacyCopy(text);
}

// 用户手势内调用，激活才有效
copyBtn.addEventListener("click", () => copyText("要复制的内容"));
```

### 1.2 读纯文本：更敏感，门槛更高

读比写危险得多（网页能窥探你从别处复制的密码、验证码），所以浏览器把门设得更严：**必须文档有焦点**，且通常要**用户手势** + 授权：

```js
/** 从剪贴板读文本；注意读比写更容易被拒 */
async function pasteText() {
  // 读要求文档处于焦点，否则直接 NotAllowedError
  if (!document.hasFocus()) {
    console.warn("文档未获焦点，无法读取剪贴板");
    return "";
  }
  try {
    return await navigator.clipboard.readText();
  } catch (err) {
    console.error("读取剪贴板失败：", err); // 用户拒绝 / 浏览器不支持网页读
    return "";
  }
}

pasteBtn.addEventListener("click", async () => {
  const text = await pasteText();
  if (text) input.value = text;
});
```

> **Firefox 的 `read`/`readText` 面向网页落地晚**：长期只有浏览器扩展能读，普通网页读到 2024 年 Firefox 125 起才逐步开放（配合一次性「粘贴」提示）。生产代码里对**读**要格外做好「不支持 / 被拒」的降级，别把它当默认可用。

## 二、ClipboardItem：写富内容与多表示

`write` / `read` 处理的是 [`ClipboardItem`](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem)——一个剪贴板项可以**同时携带多种表示**（同一份内容的纯文本版 + HTML 版 + 图片版），粘贴目标按自己能力挑一种。

### 2.1 写 HTML + 纯文本双表示

```js
/** 复制富文本：同时提供 HTML 与纯文本兜底表示 */
async function copyRich(html, plain) {
  // 值可以是 Blob，也可以是 Promise<Blob|string>
  const item = new ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([plain], { type: "text/plain" }),
  });
  await navigator.clipboard.write([item]);
}

await copyRich("<b>加粗</b>的文本", "加粗的文本");
// 粘进富文本编辑器 → 带格式；粘进纯文本框 → 退回纯文本
```

### 2.2 写图片（PNG）

图片是富剪贴板的典型场景。写图片前用**静态方法 `ClipboardItem.supports()`** 探测类型支持：

```js
/** 把一个 canvas 的内容作为 PNG 复制到剪贴板 */
async function copyCanvasAsPng(canvas) {
  // 静态探针：先问能不能写这种 MIME
  if (!ClipboardItem.supports?.("image/png")) {
    throw new Error("当前浏览器不支持写入 image/png");
  }
  // canvas → Blob（异步）
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
```

> `text/plain`、`text/html`、`image/png` 是跨浏览器较稳的三种表示；其他类型（`image/svg+xml` 等）支持不一，写前务必 `supports()` 探测。

### 2.3 读富内容：遍历 types 取 Blob

```js
/** 读剪贴板里的图片（若有） */
async function readImage() {
  const items = await navigator.clipboard.read(); // ClipboardItem[]
  for (const item of items) {
    // item.types 是该项携带的所有 MIME 字符串
    const imageType = item.types.find((t) => t.startsWith("image/"));
    if (imageType) {
      const blob = await item.getType(imageType); // 取指定表示的 Blob
      return URL.createObjectURL(blob); // 可直接喂给 <img>.src
    }
  }
  return null;
}
```

## 三、权限与焦点：Chromium vs Firefox/Safari

剪贴板的「能不能用」在各家浏览器上判定不同，这是本节最需要记的差异：

| 维度 | Chromium | Firefox / Safari |
| --- | --- | --- |
| 写（`writeText`/`write`） | 需用户激活 **或** 已授予 `clipboard-write`；**授权后可免激活** | 需用户激活（不认 `clipboard-write` 权限名） |
| 读（`readText`/`read`） | 文档需焦点；触发 `clipboard-read` 权限提示，授权后读 | 需用户激活 + 一次性「粘贴」菜单提示；网页读支持落地晚 |
| Permissions 查询 | `query({ name: "clipboard-read"｜"clipboard-write" })` 可用 | **抛 `TypeError`**（不认这俩名） |
| iframe 内使用 | 需 `Permissions-Policy: clipboard-read/clipboard-write` | 依激活与提示 |

因此，**跨浏览器查剪贴板权限必须包 `try/catch`**：

```js
/** 安全地查询剪贴板读权限——不支持该名字的浏览器不能崩 */
async function queryClipboardRead() {
  try {
    const s = await navigator.permissions.query({ name: "clipboard-read" });
    return s.state; // "granted" | "denied" | "prompt"（仅 Chromium 类）
  } catch {
    // Firefox/Safari 抛 TypeError：无法预知，只能调用时再看结果
    return "unknown";
  }
}
```

两条焦点相关的坑：

- **读要求文档焦点**：从 DevTools Console 里直接 `readText()` 常失败，就是因为焦点在 DevTools 上；页面代码里由按钮点击触发才有焦点。
- **激活是瞬时的**：写之前如果 `await` 了别的耗时异步，激活可能已过期——把要写的内容提前备好，手势回调里第一时间 `writeText`。

## 四、execCommand('copy')：已废弃的降级

在异步剪贴板普及前，复制靠同步的 `document.execCommand("copy")`：先把文本塞进一个选中的 `textarea`，再执行命令。它**已被废弃**，但作为超老浏览器的**兜底**仍可用：

```js
/** execCommand 降级：仅当 navigator.clipboard 不可用时兜底 */
function legacyCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed"; // 避免滚动跳动
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy"); // 返回布尔值表示成败（同步）
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}
```

新代码一律以 `navigator.clipboard` 为主、`execCommand` 仅作 `catch` 分支的最后兜底。

## 五、Web Share：唤起系统分享面板

[Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) 让网页调起**操作系统的原生分享面板**（微信、邮件、AirDrop、蓝牙……），把「分享到哪」交给系统，网页无需自己列一排分享按钮。

### 5.1 share 与 ShareData

```js
/** 分享当前页面 */
shareBtn.addEventListener("click", async () => {
  const data = {
    title: "文章标题", // 可选
    text: "一句话摘要", // 可选
    url: location.href, // 可选，最常用
  };
  try {
    await navigator.share(data); // 必须在用户手势内、安全上下文
  } catch (err) {
    // 用户在面板上点了「取消」→ AbortError，这是正常操作，不是错误
    if (err.name !== "AbortError") console.error("分享失败：", err);
  }
});
```

`ShareData` 字段：`title` / `text` / `url` / `files`，**至少要有一个有效字段**，否则抛 `TypeError`。

### 5.2 canShare：分享前的能力探测（尤其文件）

`navigator.canShare(data)` 返回布尔值，判断这份 `data` **当前环境能不能分享**。它最重要的用途是**探测文件分享**——文件分享支持在各平台差异极大，`share` 支持不代表 `files` 支持：

```js
/** 分享一张图片文件，先用 canShare({files}) 探测 */
async function shareImageFile(file) {
  const data = { files: [file], title: "一张图" };

  // 关键：canShare({ files }) 专门探测「能不能分享文件」
  if (!navigator.canShare?.(data)) {
    // 不支持分享文件 → 降级（如提供下载链接）
    fallbackDownload(file);
    return;
  }
  try {
    await navigator.share(data);
  } catch (err) {
    if (err.name !== "AbortError") console.error(err);
  }
}
```

### 5.3 硬门槛与平台现实

- **安全上下文**：仅 HTTPS / localhost。
- **必须用户激活**：不能脚本静默调用，只能在点击/触摸回调里调。
- **权限策略**：受 `web-share` [Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy) 约束（iframe 内需 `allow="web-share"`）。
- **移动主力、桌面稀薄**：Android/iOS 支持良好且体验原生；桌面浏览器支持有限，务必 `"share" in navigator` 探测后再决定是否显示分享按钮，不支持就退回「复制链接」。
- **不在 Web Worker**：`share` 不暴露给 `WorkerNavigator`。

一个「有则分享、无则复制」的完整降级，见[入门页第六节的通用范式](../getting-started)。
