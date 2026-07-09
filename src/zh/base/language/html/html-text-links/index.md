---
layout: doc
---

# HTML 文本内容与超链接

页面里绝大多数字符，最终都落在一小撮「行内文本元素」与一个 `<a>` 上。挑战不在于「能不能显示出来」——用 `<span>` 加 CSS 几乎能伪装出任何样式——而在于**选对那个能把「意义」写进标签的元素**：这是「强调」还是「重要」？这是「代码」还是「键盘输入」？这个链接是「站内跳转」还是「打开新标签的外站」、它安全吗？同样一段加粗文字，`<strong>` 与 `<b>` 在屏幕阅读器、搜索引擎、未来维护者眼里完全是两回事。本叶讲透「按语义而非样式选行内元素」，以及超链接背后那套容易被忽略的机制与安全规则。

## 概述

- **它管什么**：用合适的行内元素表达文本的**语义**（强调 / 重要 / 代码 / 引用 / 缩写 / 时间 / 国际化标注…），以及用 `<a>` 把当前文档连到任何 URL 能寻址的东西。
- **为什么值得认真学**：行内语义的收益几乎都是隐性的——屏幕阅读器据 `<em>` 改变语调、据 `<strong>` 提示重要、搜索引擎据 `<time>` / `<cite>` 理解结构化信息；而「全用 `<span>` + class」一切照常渲染，错了你也不报错。超链接更是重灾区：`target="_blank"` 不配 `rel` 在老浏览器是真实的钓鱼漏洞（反向标签劫持）。
- **现代化关注点**：`target="_blank"` 在现代浏览器**自动隐含 `rel="noopener"`**（但老浏览器仍需显式写）；`<bdi>`（2020 起 Baseline）让用户生成的阿拉伯语 / 希伯来语名字不再撑乱排版；`download` 仅对同源 / `blob:` / `data:` 生效；`referrerpolicy` 默认已是较安全的 `strict-origin-when-cross-origin`。

## 本叶地图

- [入门](./getting-started) —— 一段「语义正确」的图文段落 + 一组典型链接，逐块讲清每个元素为什么在那
- [强调与重要性](./guide-line/emphasis-importance) —— `strong` / `em` / `b` / `i` 四件套：语义（强调 · 重要）vs 样式（关注 · 异声）的辨析
- [行内文本语义全谱](./guide-line/inline-semantics) —— `mark` · `code` · `kbd` · `samp` · `var` · `abbr` · `cite` · `q` · `time` · `data` · `sub` · `sup` · `small` · `s`
- [超链接机制与 rel 安全](./guide-line/links-and-rel) —— `href` 各类协议 · 锚点 · `mailto` / `tel` · `download` · `target` · `rel=noopener/noreferrer` 与反向标签劫持
- [列表三型](./guide-line/lists) —— `ul` · `ol`（`start` / `type` / `reversed` / `value`）· `dl`（`dt` / `dd`）· `menu`
- [国际化与编辑标注](./guide-line/i18n-text) —— `ruby` / `rt` / `rp` · `bdi` / `bdo` / `dir` · 局部 `lang` · `ins` / `del`
- [`wbr`/`br` 与空白折叠](./guide-line/wbr-whitespace) —— 软换行 `wbr` · 强制换行 `br` · `&shy;` · 空白折叠规则与 `white-space`
- [参考](./reference) —— 行内元素速查表 + `rel` 取值表 + 标准 / Baseline / 权威链接

## 文档地址

- [web.dev: Learn HTML — Text basics](https://web.dev/learn/html/text-basics)
- [web.dev: Learn HTML — Links](https://web.dev/learn/html/links)
- [MDN: 行内文本语义（Inline text semantics）](https://developer.mozilla.org/en-US/docs/Web/HTML/Element#inline_text_semantics)
- [WHATWG HTML Standard — Text-level semantics](https://html.spec.whatwg.org/multipage/text-level-semantics.html)

## 幻灯片地址

<a href="/SlideStack/html-text-links-slide/" target="_blank">HTML 文本内容与超链接</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=html-%E6%96%87%E6%9C%AC%E5%86%85%E5%AE%B9%E4%B8%8E%E8%B6%85%E9%93%BE%E6%8E%A5" target="_blank" rel="noopener noreferrer">HTML 文本内容与超链接 测试题</a>
