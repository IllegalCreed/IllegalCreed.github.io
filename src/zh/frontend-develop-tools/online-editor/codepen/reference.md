---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 blog.codepen.io/documentation 2025–2026 现状编写

## 预处理器对照（`data-lang`）

Prefill Embed 的 `<pre data-lang>` 与各面板预处理器一一对应：

| 类别     | 现行 `data-lang`                                | 说明 / 备注                          |
| -------- | ----------------------------------------------- | ------------------------------------ |
| **HTML** | `html`、`markdown`、`pug`                        | `pug` 旧名 Jade                      |
| **CSS**  | `css`、`scss`、`sass`、`less`、`stylus`、`postcss` | `scss` 花括号 / `sass` 缩进          |
| **JS**   | `js`、`babel`、`typescript`                       | `babel` 含 JSX（写 React）           |

::: warning 已废弃的 `data-lang`
Classic 还接受 `slim`、`haml`（HTML）与 `coffeescript`、`livescript`（JS），但这些预处理器在 **CodePen 2.0 已废弃**（低使用率）。新内容只用上表中的现行标识。
:::

## Prefill `data-prefill` 字段

外层 `<div class="codepen" data-prefill='{...}'>` 的 JSON 可选字段：

| 字段          | 类型             | 说明                                       |
| ------------- | ---------------- | ------------------------------------------ |
| `title`       | string           | Pen 标题                                   |
| `description` | string（Markdown）| 描述                                       |
| `tags`        | string[] / string | 标签                                       |
| `html_classes`| string           | 加到 `<html>` 上的 class                    |
| `head`        | string（转义 HTML）| 注入 `<head>`，放 `<meta>` 等              |
| `stylesheets` | string / string[] | 外部 CSS 的 URL                            |
| `scripts`     | string / string[] | 外部 JS 的 URL                             |

> 整个 `data-prefill` 必须是合法 JSON；值里的特殊字符要 HTML 编码（单引号 `&#x27;`）。每个 `<pre>` 可带处理选项，如 `data-options-autoprefixer="true"`。

## 嵌入 `data-*` 属性（嵌入已有 Pen）

| 属性               | 取值                                       | 说明                  |
| ------------------ | ------------------------------------------ | --------------------- |
| `data-slug-hash`   | Pen hash                                   | **必填**              |
| `data-user`        | 用户名                                     | 作者                  |
| `data-default-tab` | `html` / `css` / `js` / `result`（可组合） | 初始展示的 Tab        |
| `data-height`      | px / `100%`                                | iframe 高度           |
| `data-theme-id`    | `light` / `dark` / 数字 ID                 | 主题                  |
| `data-pen-title`   | string                                     | Pen 名                |
| `data-editable`    | `true` / `false`                           | 可编辑嵌入（**PRO**） |

## 嵌入脚本域名

| 用途                   | 脚本 URL                                                |
| ---------------------- | ------------------------------------------------------- |
| 经典嵌入（已有 Pen）   | `https://cpwebassets.codepen.io/assets/embed/ei.js`     |
| Prefill / 新嵌入       | `https://public.codepenassets.com/embed/index.js`       |

> **两套别混用**：用哪套占位写法就配哪套脚本。延迟加载用非 `codepen` 的自定义 class + `window.__CPEmbed(".your-class")` 手动触发。

## URL 速查

| 操作              | URL                                       |
| ----------------- | ----------------------------------------- |
| 新建 Pen          | `codepen.io/pen`                          |
| Pen 页面          | `codepen.io/<user>/pen/<hash>`            |
| 直接 iframe 嵌入  | `codepen.io/<user>/embed/<hash>`          |
| URL Extensions    | `<pen-url>.css` / `.js` / `.html`（取对应面板）|
| 2.0 多文件取文件  | `<pen-url>?file=/<path>`                   |
| 预处理器版本表    | `codepen.io/versions`                     |
| CodePen 2.0 入口  | `codepen.io/beta`                         |
| 价格页            | `codepen.io/pricing`（**金额以此为准**）  |

## 文件大小口径（Classic Pen vs 2.0 多文件，别混）

CodePen 有**两套截然不同**的大小限制，取决于你用的是 Classic Pen 还是 2.0 多文件 Pen：

| 维度           | **Classic Pen**                          | **CodePen 2.0 多文件 Pen**                 |
| -------------- | ---------------------------------------- | ------------------------------------------ |
| 大小上限       | 约 **1MB / 100 万字符**，超出**禁用保存** | 单个**文本文件 ≤ 1MB**；**媒体文件**按 PRO 等级 |
| 相对路径       | ❌ **不可用**（资源须用完整 URL）         | ✅ **可用**（`/x.jpg`、`./x.jpg`、`x.jpg`） |
| 多文件         | ❌（仅 HTML/CSS/JS 三块）                 | ✅（文件 + 子文件夹，Pen 即根文件夹）       |

::: danger 两套口径别张冠李戴
- **Classic Pen**：整个 Pen 约 1MB / 100 万字符就禁存，且相对路径不可用。
- **2.0 多文件 Pen**：限的是**单个文件**——文本文件 ≤ 1MB、媒体文件按等级 5–15MB；相对路径可用。

「Classic 的 1MB」是整 Pen 总量，「2.0 的 1MB」是单文本文件，二者含义不同。
:::

## 2.0 多文件数 / 媒体限额（按 PRO 等级）

| 等级           | 文件数上限 | 文本文件 | 媒体文件 |
| -------------- | ---------- | -------- | -------- |
| Free（免费）   | **3**      | ≤ 1MB    | —        |
| Starter PRO    | **50**     | ≤ 1MB    | 5MB      |
| Developer PRO  | **150**    | ≤ 1MB    | 10MB     |
| Super PRO      | **300**    | ≤ 1MB    | 15MB     |

> 受保护文件（`.codepen` 文件夹、`pen.config.json`）与配置文件（`prettier.config.json`、`sass.config.json` 等）**不计入文件数**。

## Asset Hosting 存储限额（PRO）

| 等级          | 单文件 | 总容量 |
| ------------- | ------ | ------ |
| Starter PRO   | 5MB    | 2GB    |
| Developer PRO | 10MB   | 10GB   |
| Super PRO     | 15MB   | 20GB   |

> 支持几乎任意类型（图片 / CSS / JS / JSON / 音视频 / PDF / SVG），**仅禁 `.exe`** 及违反 ToS / 版权内容；上传后得**默认 HTTPS** 的托管 URL，图片可带参数做处理。

## 已废弃 / 被取代清单（2.0）

| 项目                                  | 状态                              |
| ------------------------------------- | --------------------------------- |
| Haml、Slim（HTML 预处理器）           | **2.0 废弃**                      |
| CoffeeScript、LiveScript（JS 编译器） | **2.0 废弃**                      |
| Flutter、Professor Mode               | **2.0 废弃**                      |
| 旧 **Projects**（Classic 多文件编辑器）| **被 2.0 多文件 Pen 取代**        |

> 写内容时把以上项目写成「已废弃 / 被取代」，**不要当现行特性**介绍。

## 易错点速记

- **嵌入脚本两套域名别混用**（见上）。
- **Prefill `<pre>` 内容必须 HTML 转义**（`<` → `&lt;`）。
- **Classic Pen 相对路径不可用**；2.0 多文件 Pen 可用。
- **Things We Strip**：CodePen 出于安全会剥离某些标签 / 属性，写 demo 发现某段 HTML「消失」时查官方「Things We Strip」。
- **价格 / Beta 状态会变**：金额以 `codepen.io/pricing` 为准；2.0 仍是 Beta，弃用项可能随 Beta 推进调整。
