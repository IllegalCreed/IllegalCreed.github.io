---
layout: doc
outline: [2, 3]
---

# 参考：Markdown 语法速查

> 基于 CommonMark 0.31.2 / GFM · 核于 2026-07

## 速查

- **两层结构**：块级元素（段落/标题/引用/列表/代码块/分隔线/HTML 块）先切分，行内元素（强调/链接/图片/代码/转义）后解析。CommonMark 把块分**叶子块**与**容器块**（仅引用/列表/列表项）。
- **规范链**：传统 Markdown（Gruber 2004，有歧义）→ CommonMark `0.31.2`（消歧规范 + `cmark` + 测试套件）→ GFM（严格超集 + 5 扩展）。
- **GFM 五扩展**：表格、任务列表、删除线 `~~`、扩展自动链接（裸 URL）、tagfilter（禁用 9 个风险 HTML 标签）。
- **非规范但常用**：front matter（SSG 约定）；脚注/标题 ID/定义列表/`==高亮==`/上下标/emoji（各处理器扩展，跨平台不一致）。
- **十大坑**：两空格硬换行不可见 · 列表松紧 `<p>` 间距 · `#` 后要空格 · `_` 词内不强调用 `*` · `---` 紧贴文字变 Setext · 表格 `\|` 转义 + 换行 `<br>` · 裸 URL 仅 GFM 成链 · 删除线统一 `~~` · 缩进码不能中断段落 · 块级 HTML 内不解析 Markdown。

## 一、块级元素速查表

| 元素 | 语法 | 要点 |
| --- | --- | --- |
| 段落 | 文本，空行分段 | 段内单换行是软换行（当空格） |
| 硬换行 | 行尾两空格，或行尾 `\` | 渲染为 `<br>`，两空格不可见 |
| ATX 标题 | `#` ~ `######` | 井号后**必须有空格**，1-6 级 |
| Setext 标题 | 文字下一行 `===` / `---` | **仅一、二级** |
| 块引用 | 行首 `>` | 容器块，可嵌套、含其它块 |
| 无序列表 | `-` / `*` / `+` | 同一列表别混用标记 |
| 有序列表 | `1.` 或 `1)` | 起始编号看首项，后续自增 |
| 围栏代码块 | 3+ 反引号 或 `~~~` | info string 首词标语言 |
| 缩进代码块 | 每行 4 空格 / 1 Tab | **不能中断段落** |
| 分隔线 | `---` / `***` / `___` | 3+ 个相同字符 |

## 二、行内元素速查表

| 元素 | 语法 | 要点 |
| --- | --- | --- |
| 斜体 | `*文字*` / `_文字_` | `_` 单词内部不生效 |
| 加粗 | `**文字**` / `__文字__` | 词内强调优先 `*` |
| 粗斜体 | `***文字***` | 三个符号叠加 |
| 行内代码 | 反引号包裹 | 含反引号用**更多反引号**定界 |
| 行内链接 | `[文字](url "标题")` | 标题可选，悬停提示 |
| 引用式链接 | `[文字][标签]` + `[标签]: url` | URL 可复用 |
| 自动链接 | `<https://…>` / `<a@b.com>` | CommonMark 需尖括号 |
| 图片 | `![alt](路径 "标题")` | 比链接多前导 `!` |
| 转义 | `\` + ASCII 标点 | 代码/自动链接内无效 |
| 字符引用 | `&amp;` / `&#123;` | 识别为对应字符 |

## 三、GFM 扩展速查表

| 扩展 | 语法 | 要点 |
| --- | --- | --- |
| 表格 | 表头 + 分隔行 + 数据行 | 分隔行必需，与表头列数一致 |
| 表格对齐 | `:---` / `:---:` / `---:` | 左 / 中 / 右 |
| 表格转义 | `\|` 或 `&#124;` | 单元格内换行用 `<br>` |
| 任务列表 | `- [ ]` / `- [x]` | 可交互复选框 |
| 删除线 | `~~文字~~` | 规范要求两个波浪号 |
| 扩展自动链接 | 裸 `http`/`www`/邮箱 | 自动成链 + 修剪末尾标点 |
| tagfilter | 转义起始 `<` 为 `&lt;` | 见下方 9 标签名单 |

**tagfilter 禁用的 9 个标签**：`title`、`textarea`、`style`、`xmp`、`iframe`、`noembed`、`noframes`、`script`、`plaintext`（仅一层，GitHub 另有后处理清洗）。

## 四、方言对照表

| 方言 | 主导者 | 定位一句话 |
| --- | --- | --- |
| 传统 Markdown | John Gruber | 2004 原版，基线、有歧义 |
| CommonMark | John MacFarlane 等 | 消歧规范 `0.31.2` + 参考实现 + 测试 |
| GFM | GitHub | CommonMark 严格超集 + 表格等 5 扩展 |
| MultiMarkdown | Fletcher Penney | 表格/脚注/引文/元数据/数学 |
| Markdown Extra | Michel Fortin | 表格/定义列表/脚注/属性（PHP） |
| Pandoc Markdown | John MacFarlane | 特性最全超集，多格式互转 |
| kramdown | gettalong | Ruby，Jekyll 默认，属性/定义列表 |

## 五、扩展语法归属速查（**不在** CommonMark/GFM 规范）

| 语法 | 示例 | 归属 |
| --- | --- | --- |
| front matter | 顶部 `---` YAML 块 | 静态站点生成器约定 |
| 脚注 | `[^1]` + `[^1]: 定义` | Pandoc/MMD/Markdown Extra |
| 标题自定义 ID | `## 标题 {#id}` | kramdown/Pandoc/Markdown Extra |
| 定义列表 | 术语 + `: 定义` | Markdown Extra/Pandoc/kramdown |
| 高亮 | `==文字==` | 部分处理器/插件 |
| 上下标 | `X^2^` / `H~2~O` | Pandoc/MultiMarkdown |
| Emoji 短码 | `:joy:` | GitHub 平台特性/插件 |

> 用这些扩展前务必确认目标平台是否支持，否则会原样露出字面文本。

## 六、易错点速查

- **两空格硬换行不可见**：改用行尾 `\` 或空行分段。
- **列表松紧**：项间空行 → loose → 每项被 `<p>` 包裹、间距变大。
- **`#` 后缺空格**：不成标题，永远「井号 + 空格」。
- **`_` 词内不强调**：侧翼规则护住 `snake_case`，词内用 `*`。
- **`---` 紧贴文字**：被当 Setext 二级标题，分隔线前后留空行。
- **表格**：单元格 `\|` 转义、换行 `<br>`、表头与分隔行列数一致。
- **裸 URL**：标准 CommonMark 不自动成链，靠尖括号或 GFM 扩展。
- **删除线**：统一 `~~`，别赖单 `~`（Pandoc 里可能是下标）。
- **缩进码**：不能中断段落，前置空行；围栏码无此限制。
- **块级 HTML**：内部默认不再解析 Markdown。

## 七、权威链接

- [CommonMark 规范 0.31.2](https://spec.commonmark.org/0.31.2/) —— 无歧义规范正文（2024-01-28）
- [CommonMark 官网](https://commonmark.org/) —— 项目主页与参考实现入口
- [Learn CommonMark（Dingus 在线试解析）](https://spec.commonmark.org/dingus/) —— 输入 Markdown 看解析结果
- [GFM 规范](https://github.github.com/gfm/) —— GitHub Flavored Markdown 扩展定义
- [Markdown Guide · 基础语法](https://www.markdownguide.org/basic-syntax/) ｜ [扩展语法](https://www.markdownguide.org/extended-syntax/)
- [Daring Fireball · 原始 Markdown 语法](https://daringfireball.net/projects/markdown/syntax) —— Gruber 2004 原版说明
- [Pandoc Markdown 手册](https://pandoc.org/MANUAL.html#pandocs-markdown) —— 特性最全方言参考
- [commonmark/commonmark-spec](https://github.com/commonmark/commonmark-spec) ｜ [github/cmark-gfm](https://github.com/github/cmark-gfm) —— 规范与参考实现源码
- 幻灯片：<a href="/SlideStack/markdown-slide/" target="_blank">Markdown 幻灯片</a>
