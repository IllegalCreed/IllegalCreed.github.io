---
layout: doc
---

# Markdown

一种**轻量级标记语言（lightweight markup language）**，由 John Gruber 于 2004 年提出（Aaron Swartz 参与早期设计），核心理念是「源码即便不渲染，也应像纯文本一样自然易读」，再机械地转换成结构化的 HTML。它不是要替代 HTML，而是给写作者一种读写都轻松、对版本控制友好的纯文本格式。由于 Gruber 的原始语法描述留有大量歧义、早期唯一「事实标准」`Markdown.pl` 又有不少 bug，同一文档在 GitHub、Pandoc 等系统上常渲染不一致——**CommonMark**（当前 `0.31.2`，2024-01）用一份无歧义规范 + 参考实现（`cmark`）+ 测试套件终结了这种乱象，而 **GitHub Flavored Markdown（GFM）** 则是它最流行的严格超集，补齐了表格、任务列表、删除线等协作刚需。核心心智是**块级元素（block）与行内元素（inline）两层结构**：先切分段落/标题/列表/代码块等块级结构，再在其中解析强调/链接/代码跨度等行内标记。

## 评价

**优点**

- **极简、纯文本可读**：语法轻量，源码不渲染也一目了然；纯文本天然对 Git diff、`grep`、版本控制友好，是「文档即代码」的理想载体
- **生态无处不在**：GitHub/GitLab 的 README、Issue、PR，聊天工具，静态站点（VitePress/Hugo/Jekyll/Astro），笔记应用（Obsidian 等）几乎都以 Markdown 为默认书写格式
- **有了权威规范**：CommonMark 用「规范 + 参考实现 + 测试套件」三件套消除歧义，让跨平台渲染一致；GFM 在其上补齐表格/任务列表/删除线等
- **可平滑内嵌 HTML**：遇到 Markdown 表达不了的排版，直接写原始 HTML 透传，进可攻退可守
- **转换目标丰富**：借 Pandoc 等工具可在 HTML、PDF、docx、LaTeX 等几十种格式间互转，一份源码多处产出

**缺点**

- **方言碎片化**：原始 Markdown / CommonMark / GFM / MultiMarkdown / Markdown Extra / Pandoc 各有扩展，脚注、上下标、定义列表等「扩展语法」在不同平台支持不一，可移植性差
- **表达力有限**：多列布局、精确对齐、合并单元格等复杂排版力不从心，往往要退回裸 HTML
- **一批「隐形坑」**：行尾两空格硬换行不可见、列表松紧导致 `<p>` 间距、`#` 后缺空格不成标题、`_` 在单词内部不强调等，新手极易踩
- **非规范约定多**：front matter 等元数据块由各静态站点生成器自定义，不属 Markdown 规范本身，跨工具行为不一致
- **安全需另加防护**：原始 HTML 透传意味着用户内容必须做 sanitize（GFM tagfilter 只是其中一层），不能裸信

## 文档地址

[CommonMark 规范 0.31.2](https://spec.commonmark.org/0.31.2/) ｜ [GFM 规范](https://github.github.com/gfm/) ｜ [Markdown Guide](https://www.markdownguide.org/)

## GitHub 地址

[commonmark/commonmark-spec](https://github.com/commonmark/commonmark-spec) ｜ [github/cmark-gfm](https://github.com/github/cmark-gfm)

## 幻灯片地址

<a href="/SlideStack/markdown-slide/" target="_blank">Markdown</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=markdown" target="_blank" rel="noopener noreferrer">Markdown 测试题</a>
