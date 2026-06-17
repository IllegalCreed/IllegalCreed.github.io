---
layout: doc
outline: [2, 3]
---

# 编辑器与预处理器

> 基于 blog.codepen.io/documentation 2025–2026 现状编写

## 速查

- **HTML 预处理器**：`markdown`、`pug`（旧名 Jade）—— ⚠️ Haml / Slim 在 2.0 已废弃
- **CSS 预处理器**：`scss` / `sass`、`less`、`stylus`、`postcss`、`autoprefixer`
- **JS 预处理器 / 编译器**：`babel`（含 JSX → 写 React）、`typescript` —— ⚠️ CoffeeScript / LiveScript 在 2.0 已废弃
- **选预处理器**：每个面板右上**齿轮（gear）→ Settings**，可在 Editor Settings 设默认值；版本以 [`codepen.io/versions`](https://codepen.io/versions) 为准
- **引外部资源**：面板齿轮 → Pen Settings 填 CSS/JS 的 URL；或用内置搜索框搜 **CDNjs**（quick-add）选版本注入
- **把别的 Pen 当资源**：用带后缀的 Pen URL（`.css` 取编译后 CSS、`.scss` 取源），**只能嵌套一层**
- **执行顺序**：CSS 资源先加载；JS 外部资源在所选库之后、你自己代码之前；多个按上到下
- **多文件**：CodePen 2.0 **多文件 Pen** 取代了 Classic 的旧 **Projects**；按文件扩展名自动触发对应「Block」处理
- ⚠️ **已废弃 / 被取代**：Haml、Slim、CoffeeScript、LiveScript、Flutter、Professor Mode、旧 **Projects**（写代码时别当现行特性）
- **文档**：<https://blog.codepen.io/documentation/using-css-preprocessors/>

## 预处理器总览

CodePen 在每个代码面板都能挂一个**预处理器**：你用更精简 / 更现代的语法写，CodePen 在编译期把它转成浏览器能直接跑的 HTML/CSS/JS。

选法统一：**点面板右上的齿轮（gear）图标 → 在 Settings 里选预处理器**；也能在 Editor Settings 里设默认值，让新建的 Pen 自动用你常用的那套。各预处理器的具体版本以 [`codepen.io/versions`](https://codepen.io/versions) 为准。

::: tip 看编译结果
选了预处理器后，可以「View Compiled HTML/CSS/JS」查看编译后的真实输出——调试「为什么编译后不对」时很有用。
:::

### HTML 预处理器

| 预处理器     | `data-lang` | 说明                              |
| ------------ | ----------- | --------------------------------- |
| **Markdown** | `markdown`  | 用 Markdown 写内容                |
| **Pug**      | `pug`       | 缩进式 HTML 模板（旧名 Jade）     |

::: danger Haml / Slim 已在 2.0 废弃
Classic 时代 HTML 面板还支持 **Haml、Slim**，但因使用率太低，**CodePen 2.0 已废弃这两者**。新内容只用 Markdown、Pug。
:::

### CSS 预处理器

| 预处理器          | `data-lang` | 说明                                       |
| ----------------- | ----------- | ------------------------------------------ |
| **Sass / SCSS**   | `scss` / `sass` | 最常用；`scss` 是花括号语法，`sass` 是缩进语法 |
| **Less**          | `less`      | 经典 CSS 预处理器（2.0 升级到 4+）         |
| **Stylus**        | `stylus`    | 极简语法                                   |
| **PostCSS**       | `postcss`   | 插件化转换                                 |
| **Autoprefixer**  | —           | 自动补浏览器前缀（默认开启）               |

- **Autoprefixer** 默认开启但自定义有限。要精细控制浏览器目标，可关掉默认 Autoprefixer、改用 PostCSS 的 `@use autoprefixer()`；CSS Grid 的兼容前缀可用代码注释开启。
- **CSS 处理器 Add-Ons**（**仅 Pen 编辑器可用**）：Bourbon、Sass Modular Scale、Neat、Susy 等 Sass 库，点 Add 即注入对应 `@import`，省去手动引入。

### JS 预处理器 / 编译器

| 编译器          | `data-lang`  | 说明                                       |
| --------------- | ------------ | ------------------------------------------ |
| **Babel**       | `babel`      | 转译新语法，**含 JSX**——在 CodePen 写 React 就选它 |
| **TypeScript**  | `typescript` | 写 TS，编译期转 JS                         |

- 选法同上：JS 面板齿轮里选。
- **ES Modules / `import`** 单独支持，可用 `import` 语法（常配合 Skypack / esm 这类 CDN 引入 ESM 包）。

::: danger CoffeeScript / LiveScript 已在 2.0 废弃
Classic 的 JS 面板还支持 **CoffeeScript、LiveScript**，但 **CodePen 2.0 已废弃这两者**。在 2.0 里 Babel（JSX）、TypeScript 以「Block」形式保留（见下文）。
:::

::: warning JS 预处理器细节以官方专页为准
本页 JS 预处理器信息综合自官方库文档页与 Prefill 的 `data-lang` 列表。CodePen 的「JavaScript 预处理器」独立专页一度返回 404，落地前如需更细的版本 / 行为，请以官方实时文档为准，不要凭记忆补充。
:::

## 引入外部资源与库

要在 Pen 里用第三方库 / 样式，有几种方式：

1. **库搜索（quick-add，推荐）**：点面板齿轮进 **Pen Settings**，用内置搜索框直接搜 **CDNjs** 上数千个 JS/CSS 库，选好版本即注入，**无需手填 URL**。
2. **填外部资源 URL**：在 Pen Settings 的 External CSS / External JS 里粘贴完整 URL（如 jsDelivr / unpkg / Skypack 的链接）。
3. **直接在 HTML 写 `<link>` / `<script>`**：可以，但这种方式**不参与预处理器依赖解析**。
4. **把别的 Pen 当资源**：用带后缀的 Pen URL（`<pen-url>.css` 取编译后的 CSS、`.scss` 取 SCSS 源），把对方面板内容拉进来。

::: warning 引用别的 Pen 只能嵌套一层
把另一个 Pen 当外部资源时，**只解析一层**——被引用 Pen 自己的外部资源**不会**一并带进来。需要那些依赖就得自己再显式引一遍。
:::

**执行 / 加载顺序**（排查「库没加载上」时很关键）：

- **CSS 资源先加载**，方便你的样式覆盖它；
- **JS 外部资源在所选库之后、你自己的代码之前**执行；多个外部资源按列表**从上到下**顺序执行。

> 官方文档**未明确**外部资源的数量上限。常用 CDN 生态：CDNjs（内置搜索）、jsDelivr / unpkg / Skypack（手填 URL，常配合 ES Modules `import`）。

## 多文件 Pen（2.0 取代旧 Projects）

单个 Classic Pen 只有 HTML/CSS/JS 三块、约 1MB 上限。需要真正的多文件结构时：

### 旧 Projects（Classic，已被取代）

Classic 时代有一个独立的 **Project 编辑器**——可建多个文件、用文件夹组织，规模远大于单个 Pen。

::: danger 旧 Projects 已被 2.0 多文件 Pen 取代
**CodePen 2.0 已把 Projects 转换为 2.0 Pens**，Project 这条独立产品线被「多文件 Pen」取代。迁移差异要点：用 **PostCSS Block** 取代旧的 Autoprefixer 设置；用 **Babel Block** 处理 JSX（原「Bundle with Babel & JSX」）；**不再需要指定入口文件**（编译器自动判定）；**移除了 Minification**；**Less 升级到 4+**。教学中应说明「Project 是 Classic 概念，2.0 已并入多文件 Pen」，不要当现行独立特性介绍。
:::

### CodePen 2.0 多文件 Pen（Files）

在 CodePen 2.0 里，**一个 Pen 就是一个根文件夹**，里面可以有文件和子文件夹：

- **组织方式**：文件可重命名、拖拽、用文件夹归类；编辑器最多同时打开 **3 个 Tab**。
- **文件类型**：白名单制——支持所有 Block 支持的扩展名（如 `.scss`、`.ts`）+ 常见二进制（如 `.jpg`）；屏蔽 `.exe` 等无 Web 用途的危险类型。
- **受保护文件**：`.codepen` 文件夹、`pen.config.json`（带锁图标，不可删）；`prettier.config.json` / `sass.config.json` 等配置文件**不计入文件数限额**。
- **相对路径可用**（与 Classic Pen 不同！）：`/mountains.jpg`、`./mountains.jpg`、`mountains.jpg` 都行，由「Link Block」解析；文件也有公开 URL（`?file=/rainbow.jpg`）。
- **创建 / 上传**：拖拽、按钮、Omnibar（⌘K）、快捷键（⌘⇧F），支持多文件同时上传。

> 文件数 / 媒体大小按 PRO 等级递增（免费 3 文件，Starter/Developer/Super 分别 50/150/300）。完整限额口径见「参考」页。

::: tip Block：2.0 的处理器抽象
2.0 把「预处理器 / 功能」统一抽象为 **Block**。CodePen Compiler 按**文件扩展名自动判定**需要哪些 Block——`.scss` 触发 Sass Block、`.ts` 触发 TypeScript Block，连配置文件（如 `prettier.config.json`）也能触发对应 Block。你不用手动选预处理器，放对扩展名即可。详见「嵌入与 CodePen 2.0」。
:::
