---
layout: doc
outline: [2, 3]
---

# 方言差异、front matter 与常见坑

> 基于 CommonMark 0.31.2 / GFM · 核于 2026-07

## 速查

- **方言地图**：传统 Markdown（Markdown.pl，基线、有歧义）→ **CommonMark**（消歧规范 `0.31.2`）→ **GFM**（CommonMark 超集 + 表格等）；**MultiMarkdown / Markdown Extra**（早期补表格/脚注/定义列表）；**Pandoc Markdown**（特性最全、多格式互转）；**kramdown**（Ruby，Jekyll 默认）。
- **front matter**：文件**顶部** `---` 包裹的 YAML 元数据（标题/日期/标签/布局等），**不属 Markdown 规范**，是静态站点生成器约定，**渲染前先被工具剥离**。也有 TOML（Hugo `+++`）、JSON 变体。
- **「像 Markdown 其实不通用」的扩展**（**不在** CommonMark/GFM 规范）：脚注 `[^1]`、标题 ID `{#id}`、定义列表、`==高亮==`、`~下标~`/`^上标^`、`:emoji:`——支持与否取决于处理器。
- **可移植性铁律**：跨平台文档只用 CommonMark 核心 + GFM 五扩展；用扩展语法前先确认目标平台是否支持。
- **常见坑 Top**：行尾两空格不可见；列表松紧致 `<p>` 间距；`#` 后缺空格不成标题；`_` 词内不强调用 `*`；`---` 紧贴文字变 Setext 标题；表格单元格 `\|` 转义 + 换行用 `<br>`；裸 URL 仅 GFM 成链；删除线统一 `~~`；缩进码不能中断段落；块级 HTML 内默认不解析 Markdown。

## 一、主流方言地图

Markdown 没有唯一「官方」实现，而是一族方言。理解它们的谱系有助于判断某个语法「能不能用」：

| 方言 | 主导者 | 一句话定位 |
| --- | --- | --- |
| 传统 Markdown（`Markdown.pl`） | John Gruber | 2004 原版，功能最基础、边界有歧义，是一切方言的**基线** |
| **CommonMark** | John MacFarlane 等 | 把原版精确化的**消歧规范** `0.31.2`，配参考实现 `cmark` + 测试套件；不含表格等扩展 |
| **GFM** | GitHub | CommonMark 的**严格超集**，加表格/任务列表/删除线/扩展自动链接/tagfilter |
| MultiMarkdown（MMD） | Fletcher Penney | 早期补齐表格、脚注、引文、元数据、数学、交叉引用 |
| Markdown Extra | Michel Fortin | PHP 生态，补表格、定义列表、脚注、围栏码、属性 |
| **Pandoc Markdown** | John MacFarlane | **特性最全的超集之一**（脚注、多种表格、数学、引文、属性、Div/Span），并支持几十种格式互转 |
| kramdown | gettalong | Ruby 实现，Jekyll 默认，支持属性、定义列表等 |

选择原则：**面向 GitHub/多平台协作**，坚持 CommonMark 核心 + GFM 五扩展最稳；**做重度文档/学术出版**（脚注、公式、引文），Pandoc/MMD 方言更强，但要接受产物依赖特定工具链。

## 二、front matter（前置元数据）

几乎所有静态站点生成器都约定：Markdown 文件**顶部**可以放一段用 `---` 包裹的元数据块，最常见是 **YAML**，用来写标题、日期、标签、布局、是否草稿等：

```yaml
---
title: 我的文章
date: 2026-07-05
tags: [markdown, note]
layout: doc
---
```

关键认知：

- **它不是 CommonMark/GFM 规范的一部分**，而是各工具（Jekyll、Hugo、VitePress、Astro、Gatsby、11ty 等）自定义的约定。
- **必须位于文件最顶部**，由生成器在把正文交给 Markdown 解析器**之前**先解析剥离。
- 除 YAML 外还有变体：**TOML front matter**（Hugo 用 `+++` 包裹）、**JSON front matter**。
- 这也解释了一个「巧合」——为什么正文里裸写的 `---` 会被当成分隔线（或紧贴文字时被当 Setext 二级标题），而顶部这段 `---...---` 却被特殊对待：因为处理它的根本不是 Markdown 解析器，而是上游的 SSG。

## 三、「看着像 Markdown 其实不通用」的扩展语法

下面这些语法很常见，但**既不在 CommonMark 核心、也不在 GFM 规范**里，能否使用取决于你的解析器是否启用了对应扩展（它们分散在 Markdown Extra、MultiMarkdown、Pandoc、kramdown 等处理器，或是 GitHub 的平台特性）：

| 语法 | 示例 | 归属 |
| --- | --- | --- |
| 脚注 | `[^1]` + 别处 `[^1]: 定义` | Pandoc / MMD / Markdown Extra（GitHub 后来单独支持渲染，但不在 GFM 规范条目里） |
| 标题自定义 ID | `## 标题 {#custom-id}` | kramdown / Pandoc / Markdown Extra |
| 定义列表 | 术语行 + 下一行 `: 定义` | Markdown Extra / Pandoc / kramdown |
| 高亮 | `==高亮==` | 部分处理器（如 kramdown、部分 markdown-it 插件） |
| 上/下标 | `X^2^` / `H~2~O` | Pandoc、MultiMarkdown 等 |
| Emoji 短码 | `:joy:` | GitHub 平台特性 / 插件，非规范 |

用它们之前，请先确认目标平台支持；否则会被原样输出成难看的字面文本。

## 四、常见坑清单

- **行尾两空格硬换行不可见**：段内换行靠行尾两空格，肉眼看不见、还常被编辑器裁掉——改用行尾 `\` 或空行分段更稳。
- **列表松紧致 `<p>` 间距**：项与项之间多一个空行，整列表变松散、每项被 `<p>` 包裹、行距变大。「列表莫名变稀疏」先查项间空行。
- **`#` 后缺空格不成标题**：CommonMark 要求 `#` 后有空格，`#标题` 会变普通段落。永远「井号 + 空格」。
- **`_` 单词内部不强调**：侧翼规则让 `snake_case` 里的 `_` 不触发斜体；**词内强调用 `*`**。
- **`---` 紧贴文字变 Setext 标题**：分隔线前后要留空行，否则紧接上一行文字时被当二级标题。
- **表格三连坑**：单元格内字面竖线要 `\|` 转义；单元格内不能真换行、要用 `<br>`；表头与分隔行列数必须一致。
- **裸 URL 仅 GFM 成链**：标准 CommonMark 下裸 URL 不自动成链，要么套尖括号 `<...>`，要么依赖 GFM 扩展自动链接。
- **删除线可移植性**：规范是 `~~`，别依赖单个 `~`（可能不生效或在 Pandoc 里被当下标）。
- **缩进码不能中断段落**：紧贴段落文字的 4 空格缩进行会被当段落延续，要空行隔开；围栏码无此限制。
- **块级 HTML 内不解析 Markdown**：`<div>` 里默认不再走 Markdown 语法，需解析器额外支持或特定空行写法。
- **扩展语法跨平台不一致**：脚注、上下标、`==高亮==` 等在 A 平台好好的，到 B 平台可能原样露出——见上一节。

---

方言、元数据与坑位过完，去 [参考页](../reference) 看全量语法速查表、GFM 对照、方言对照与权威链接汇总。
