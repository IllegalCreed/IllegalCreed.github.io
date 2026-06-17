---
layout: doc
outline: [2, 3]
---

# 嵌入与 CodePen 2.0

> 基于 blog.codepen.io/documentation 2025–2026 现状编写

## 速查

- **嵌入机制**：放一个 `class="codepen"` 占位元素 + 异步脚本，脚本把它**换成 iframe**
- **嵌入已有 Pen**：关键 `data-*` —— `data-slug-hash`（必填）、`data-user`、`data-default-tab`（如 `js,result`）、`data-height`、`data-theme-id`、`data-editable`(PRO)
- ⭐ **Prefill Embed API**：代码留在你自己站点（SEO 友好），外层 `<div class="codepen" data-prefill='{...}'>` + 多个 `<pre data-lang>`（**内容必须 HTML 转义**）
- **两套嵌入脚本域名别混用**：经典 `https://cpwebassets.codepen.io/assets/embed/ei.js`；Prefill / 新嵌入 `https://public.codepenassets.com/embed/index.js`
- **直接 iframe**：把 Pen URL 里 `/pen/` 改成 `/embed/`
- **延迟加载**：用非 `codepen` 的自定义 class，手动 `window.__CPEmbed(".codepen-later")` 触发
- **CodePen 2.0**：Rails → **Next.js + SSR** 重写，公开 Beta（入口 `codepen.io/beta`）；多文件 / 文件夹、**原生 Collab**、**Omnibar（⌘K）**、**一键部署成网站**
- **2.0 三大新概念**：**Files**（多文件系统）、**Blocks**（按扩展名自动触发的处理器）、**Omnibar**（命令面板）
- **Pro（功能向）**：私有 Pen、Asset Hosting、可编辑嵌入 + 无限自定义嵌入主题、Collab、一键部署；金额以 [`codepen.io/pricing`](https://codepen.io/pricing) 为准
- **文档**：<https://blog.codepen.io/documentation/prefill-embeds/> ; <https://blog.codepen.io/docs/>

## 嵌入机制总览

CodePen 嵌入的原理很简单：你在页面上放一个**带 `class="codepen"` 的占位元素** + 一段**异步嵌入脚本**，脚本加载后把占位元素**替换成一个 iframe**，里面就是可运行的预览。

::: danger 两套嵌入脚本域名，千万别混用
- **经典嵌入**（嵌入已存在的 Pen）：`https://cpwebassets.codepen.io/assets/embed/ei.js`
- **Prefill / 新嵌入**：`https://public.codepenassets.com/embed/index.js`

写教程时容易抄到老文档里的过时域名。**用哪套占位写法就配哪套脚本**，混用会导致嵌入不渲染。
:::

## 嵌入已有的 Pen

如果 Pen 已经在 CodePen 上存在，用占位元素 + 经典脚本即可：

```html
<p
  class="codepen"
  data-height="265"
  data-theme-id="light"
  data-default-tab="js,result"
  data-user="username"
  data-slug-hash="abc123"
  data-pen-title="Pen Name"
>
  <span>See the Pen...</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>
```

关键 `data-*` 属性：

| 属性               | 作用                                                       |
| ------------------ | ---------------------------------------------------------- |
| `data-slug-hash`   | Pen 标识（**必填**）                                       |
| `data-user`        | 作者用户名                                                 |
| `data-default-tab` | 初始展示哪些 Tab：`html` / `css` / `js` / `result`，可组合如 `js,result` |
| `data-height`      | iframe 高度（px 或 `100%`）                                |
| `data-theme-id`    | 主题：`light` / `dark` / 自定义数字 ID                     |
| `data-pen-title`   | Pen 名                                                     |
| `data-editable`    | 是否可编辑（**PRO**）                                      |

- **直接 iframe**：不想用脚本时，把 Pen URL 里的 `/pen/` 改成 `/embed/`（`https://codepen.io/user/embed/hash`）即可当 iframe `src`。
- **主题**：免费档有 1 个可定制 Default 主题 + Light/Dark 预设；**PRO** 解锁**无限自定义嵌入主题**，改主题会同步更新所有关联嵌入。

## ⭐ Prefill Embed API（代码留在你自己站点）

这是写文档 / 教程「可运行示例」**最推荐**的方式。

**核心理念**：代码放在**你自己的网站 / 仓库源码里**（对 SEO 友好、也是文章的真实源码），CodePen 只负责把它**渲染成可运行的交互嵌入**——无需事先在 CodePen 创建 Pen。

**结构**：外层 `<div class="codepen" data-prefill='{...}'>` + 内嵌多个 `<pre data-lang="...">`（每个装一种语言的代码）+ Prefill 脚本：

```html
<div
  class="codepen"
  data-prefill='{"title":"Example","stylesheets":"https://.../normalize.css","scripts":["https://.../react.production.min.js"]}'
  data-height="400"
  data-theme-id="light"
  data-default-tab="js,result"
  data-editable="true"
>
  <pre data-lang="html">&lt;div id="root"&gt;&lt;/div&gt;</pre>
  <pre data-lang="scss">body { background: #ccc; }</pre>
  <pre data-lang="babel">ReactDOM.render(&lt;App /&gt;, document.getElementById('root'));</pre>
</div>
<script async src="https://public.codepenassets.com/embed/index.js"></script>
```

::: danger `<pre>` 里的代码必须 HTML 转义
每个 `<pre data-lang>` 的内容会被当作 HTML 解析，所以代码里的 `<`、`>` **必须转义**（`<` → `&lt;`，`>` → `&gt;`），否则浏览器会把它当标签解析、嵌入内容错乱。上例里 `<div id="root">` 写成了 `&lt;div id="root"&gt;` 就是这个原因。
:::

`data-prefill` 是一个**合法 JSON 对象**，可选字段：

| 字段          | 说明                                       |
| ------------- | ------------------------------------------ |
| `title`       | Pen 标题                                   |
| `description` | 描述（支持 Markdown）                      |
| `tags`        | 标签                                       |
| `html_classes`| `<html>` 上的 class                        |
| `head`        | 注入 `<head>` 的内容（转义 HTML，放 meta 等）|
| `stylesheets` | 外部 CSS，URL 字符串或数组                 |
| `scripts`     | 外部 JS，URL 字符串或数组                  |

- 整个对象必须是合法 JSON；属性值里的特殊字符要 HTML 编码（如单引号用 `&#x27;`）。
- 每个 `<pre>` 还能带处理选项，例如 `data-options-autoprefixer="true"`。

::: tip 延迟加载 / 按需创建
默认脚本会把页面上所有 `class="codepen"` 的元素转换成嵌入。想**滚动到 / 点击时再渲染**，可以给元素用**自定义 class**（不叫 `codepen`），然后在合适时机手动调用 `window.__CPEmbed(".codepen-later")` 触发转换——避免一进页面就加载一堆 iframe。
:::

::: tip 教学价值最高
Prefill Embed 让「代码 = 文章源码」：读者看到的示例就是页面里那段被转义的代码，点开嵌入就能跑、能改、能 Fork。写笔记 / 幻灯片里的「可运行示例」，这是标准做法。
:::

> 其他嵌入相关 API 还有 **oEmbed**、**URL Extensions**（给 Pen URL 加 `.css` / `.js` / `.html` 等后缀直取对应面板内容），按需查官方文档。

## CodePen 2.0（Next.js 重写，公开 Beta）

CodePen 正在从 Classic（1.0）整体重写为 **CodePen 2.0**，目前是**公开 Beta**——入口 `codepen.io/beta`，新文档在 `blog.codepen.io/docs/`，两套编辑器**目前并存**。

### 为什么重写 / 技术栈

- Classic（1.0）基于 **Ruby on Rails**，十多年逐步演进。
- 2.0 **完全重写**，前端选 **Next.js + SSR**。目标：浏览器拿到的是「充满有用、可渲染 HTML」的页面（而非空 `<div id="root">`），改善加载可见性 + 社交分享 `<meta>` 预览。
- 实施分两阶段：Page Router（改 Apollo Cache 支持 SSR）→ App Router；最难的是把「全站最复杂的页面——2.0 编辑器」完整 SSR 化。

### 三大新概念

| 概念         | 是什么                                                       |
| ------------ | ----------------------------------------------------------- |
| **Files**    | 多文件 / 文件夹系统，Pen 即根文件夹，支持相对路径（见上一章）|
| **Blocks**   | 「功能 / 处理器」的抽象；Compiler 按**文件扩展名自动判定**需要哪些 Block（`.scss`→Sass、`.ts`→TypeScript），自动生成配置、走构建管线 |
| **Omnibar**  | 编辑器顶部中央的**命令面板**，模糊搜索一键访问几乎所有功能   |

::: tip Omnibar（命令面板，⌘K）
打开：**⌘K / Ctrl-K**（也支持 ⌘O、⌘P 等 VS Code 习惯键）。能做：执行命令（"Save Pen as Private"、"New File"）、按字母跳文件（输 "i" 跳 index.html）、改设置（"Edit Pen Title"）、切换 minimal UI。用过的命令会显示其直达快捷键，帮你边用边学。
:::

### 原生 Collaboration

2.0 把**协作内建进编辑器**：用邮箱或 CodePen 用户名邀请任何人，接受后即拥有该 Pen 的编辑权，可实时共编也可异步改——**不再需要 Classic 那种特殊的 Collab Mode URL**。

### ⭐ 一键部署成网站（Deployment / Hosting，PRO）

2.0 的重磅能力：**任何 2.0 Pen 都能一键变成线上网站**。

- 开 **Deploy** 面板点 Deploy，立即获得一个随机子域名。
- 更新：默认新保存**不自动部署**，用 **"Save & Deploy"** 手动推；可开 "Deploy on Save" 自动更新。
- **自定义域名**：子域名用 CNAME；裸域用 A 记录指向 CodePen 给的 IP（或 CNAME flattening）。CodePen 不卖域名。
- 部署版与预览版的区别：部署版**不注入** CodePen 的 console / Live View，且公开可访问。

::: warning 部署的限制（PRO）
**需 PRO**（免费档不能部署）；**每站 1TB/月带宽**（超量可能被下线）；Undeploy 后访客见 404，且**重新部署会换新子域名、旧子域名不可找回**；**降级 PRO 会删除所有部署**。
:::

## Pro 套餐（功能向）

CodePen 免费档能写、能 Fork、能公开分享，但一批关键能力是 **PRO** 专属。下面只讲**功能差异**，金额见提示框。

| 能力                       | 免费 | PRO  | 说明                                       |
| -------------------------- | ---- | ---- | ------------------------------------------ |
| **私有 Pen / Collection**  | ❌   | ✅   | 免费档 Pen 全公开；PRO 才能私有            |
| **Asset Hosting**          | ❌   | ✅   | 把图片 / CSS / JS / SVG 等直接传到 CodePen（分层存储）|
| **可编辑嵌入**             | ❌   | ✅   | 访客在嵌入里直接改代码、实时看预览（文档 / 教程利器）|
| **无限自定义嵌入主题**     | ❌   | ✅   | 改主题同步更新所有关联嵌入                 |
| **Collab Mode / Live View / Presentation Mode** | ❌ | ✅ | Classic 的多人共编 / 跨设备实时预览 / 演示视图 |
| **一键部署成网站**         | ❌   | ✅   | 2.0 专属，每站 1TB/月                      |
| **多文件数 / 媒体大小**    | 基础 | 递增 | 2.0 文件数随等级 50/150/300（见「参考」）  |

::: warning 价格以官方实时为准
CodePen PRO 分 **Starter / Developer / Super** 三档。各档年付金额（搜索摘要约为 Starter $96、Developer $144、Super $312 每年）**仅供参考，必须以官方 [`codepen.io/pricing`](https://codepen.io/pricing) 实时核对**——主站价格页对自动抓取常返回 403，本系列未能实时核到准确金额。Collab 并发人数也按档递增（Starter 2 / Developer 6 / Super 10）。
:::

::: tip Asset Hosting 速记
PRO 用户可把文件直接传到 CodePen 服务器供 Pen 使用（省去外部图床），支持几乎任意类型（图片 / CSS / JS / JSON / 音视频 / PDF / SVG），**仅禁 `.exe`** 及违反 ToS 的内容；上传后得 HTTPS 托管 URL，图片还能带参数做处理（宽 / 高 / 旋转 / 质量 / 格式转换）。存储限额按档：Starter 5MB/文件·2GB 总、Developer 10MB·10GB、Super 15MB·20GB。
:::
