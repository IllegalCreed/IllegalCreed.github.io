---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 强调四件套：`<em>` 强调（改句意）/ `<strong>` 重要 / `<b>` 醒目 / `<i>` 异声——纯样式归 CSS
- 代码四件套：`<code>` 代码 / `<kbd>` 输入 / `<samp>` 输出 / `<var>` 变量
- 引用：`<q>`（自动加引号）/ `<cite>`（作品名，**非人名**）/ `<blockquote>`（`cite` 是属性）
- 链接安全铁律：`target="_blank"` 配 `rel="noopener"`（现代隐含、老浏览器仍写），外链加 `noreferrer`
- `href` 协议：`https:` / `mailto:` / `tel:` / `sms:` / `#锚点`；`download` 仅同源 / `blob:` / `data:`
- 列表：`<ul>` 无序 / `<ol>` 有序（`start`·`type`·`reversed`·`value`）/ `<dl>`（`dt`+`dd`）
- 换行：`<br>` 强制（诗 / 址 / 签）、`<wbr>` 建议断点、段落永远 `<p>`；空白默认折叠
- 国际化：局部 `lang`、`<bdi>` 隔离方向未知内容、`<ruby>` 注音、`<ins>`/`<del>` 修订
- 无障碍红线：链接文字别「点这里」；`<cite>` 别标人名；`<dl>` 别当缩进；`<em>`/`<strong>` 别当样式

## 行内文本语义速查表

| 元素 | 语义 | 默认样式 | 关键属性 / 备注 |
| --- | --- | --- | --- |
| `<a>` | 超链接 | 下划线 + 链接色 | `href` / `target` / `rel` / `download` |
| `<em>` | 强调（改句意） | 斜体 | 可嵌套加深 |
| `<strong>` | 重要 / 严肃 / 紧急 | 加粗 | 可嵌套加深 |
| `<b>` | 引人注意（无重要性） | 加粗 | 关键词 / 产品名 |
| `<i>` | 异声 / 异质 | 斜体 | 外文加 `lang` |
| `<u>` | 非文本注释（如拼写错误） | 下划线 | 慎用（易与链接混淆） |
| `<mark>` | 相关性高亮 | 黄底 | 搜索命中 / 引文标重点 |
| `<small>` | 小字附注 | 缩小 | 版权 / 免责，**勿用于大段** |
| `<s>` | 不再准确 / 相关 | 删除线 | ≠ `<del>`（编辑删除） |
| `<code>` | 代码片段 | 等宽 | `class="language-*"` |
| `<kbd>` | 键盘 / 用户输入 | 等宽 | 可嵌套表组合键 |
| `<samp>` | 程序输出 | 等宽 | —— |
| `<var>` | 变量 / 占位符 | 斜体 | —— |
| `<q>` | 行内引语 | 自动加引号 | `cite`（来源 URL），**别手敲引号** |
| `<cite>` | 作品标题 | 斜体 | **不能标人名** |
| `<abbr>` | 缩写 / 缩略词 | 视浏览器 | `title` 存全称（屏幕阅读器默认不读） |
| `<dfn>` | 术语的定义实例 | 斜体 | 定义须在所在段落 |
| `<time>` | 日期 / 时间 | 无 | `datetime` 机器可读 |
| `<data>` | 机器可读数据 | 无 | `value`（非时间类编码） |
| `<sub>` / `<sup>` | 下标 / 上标 | 下沉 / 上抬 | 化学式 / 幂 / 脚注 |
| `<ruby>` `<rt>` `<rp>` | 注音 | 注音浮于上方 | `<rt>` 注音、`<rp>` 降级括号 |
| `<bdi>` | 隔离未知方向文字 | 无 | `dir` 默认 `auto` |
| `<bdo>` | 强制覆盖方向 | 无 | 需配 `dir` |
| `<ins>` / `<del>` | 文档增 / 删修订 | 下划线 / 删除线 | `cite` + `datetime` |
| `<br>` | 强制换行 | 换行 | 限诗 / 址 / 签 |
| `<wbr>` | 可选断点 | 无 | 不加连字符 |
| `<span>` | 无语义容器 | 无 | 仅挂样式 / 钩子 |

## `<a>` 的 `href` 取值速查

| 形态 | 示例 | 说明 |
| --- | --- | --- |
| 绝对 URL | `https://example.com/p` | 完整地址 |
| 协议相对 | `//example.com/p` | 沿用当前页协议（今多直接写 https） |
| 根相对 | `/docs/html` | 从站点根开始 |
| 目录相对 | `./x`、`../x` | 相对当前路径 |
| 页内锚点 | `#install`、`#top`、`#` | 跳到 `id` / 回页顶 |
| 邮件 | `mailto:a@b.com?subject=…` | 可带 `subject`/`body`/`cc`/`bcc` |
| 电话 | `tel:+8675512345678` | 手机直拨 |
| 短信 | `sms:+8613800000000` | 唤起短信 |
| 数据 / 二进制 | `data:…`、`blob:…` | 内联 / 对象 URL（可配 `download`） |

## `<a>` 的 `rel` 取值速查

| `rel` 值 | 用途 | 安全 / SEO 相关 |
| --- | --- | --- |
| `noopener` | 切断新页 `window.opener` | **防反向标签劫持** |
| `noreferrer` | 隐含 noopener + 不发 `Referer` | 安全 + 隐私 |
| `nofollow` | 别让搜索引擎追踪 | 用户内容 / 广告 / 付费链接 |
| `external` | 外部资源 | —— |
| `alternate` | 替代版本（多语言 / RSS / PDF） | 配 `hreflang` / `type` |
| `author` | 作者信息 | —— |
| `me` | 「我」的另一身份页 | IndieAuth / Mastodon 验证 |
| `bookmark` | 区块永久链接 | —— |
| `license` | 许可信息 | —— |
| `help` / `search` | 帮助 / 搜索 | —— |
| `prev` / `next` | 序列上一 / 下一篇 | 索引价值已低 |
| `tag` | 标签 / 分类 | —— |

> **外链稳妥写法**：`<a href="…" target="_blank" rel="noopener noreferrer">`。

## `<ol>` 属性速查

| 属性 | 取值 | 作用 |
| --- | --- | --- |
| `type` | `1` / `a` / `A` / `i` / `I` | 编号样式（默认 `1`） |
| `start` | 整数（**始终阿拉伯数字**） | 起始编号 |
| `reversed` | 布尔 | 倒序编号 |
| `value`（在 `<li>` 上） | 整数 | 覆盖单项编号，后续续接 |

## `<time datetime>` 格式速查

| 含义 | 格式 | 示例 |
| --- | --- | --- |
| 年 | `YYYY` | `2026` |
| 年月 | `YYYY-MM` | `2026-06` |
| 日期 | `YYYY-MM-DD` | `2026-06-24` |
| 时间 | `HH:MM[:SS[.mmm]]` | `20:00` |
| 本地日期时间 | `YYYY-MM-DDTHH:MM` | `2026-06-24T14:30` |
| 全球日期时间 | `…±HH:MM` / `…Z` | `2026-06-24T14:30+08:00` |
| 周 | `YYYY-Www` | `2026-W26` |
| 时长 | `PnDTnHnMnS` | `PT2H30M` |

## `white-space` 速查

| 值 | 折叠空白 | 折叠换行 | 自动换行 |
| --- | --- | --- | --- |
| `normal`（默认） | 是 | 是 | 是 |
| `nowrap` | 是 | 是 | 否 |
| `pre`（`<pre>` 默认） | 否 | 否 | 否 |
| `pre-wrap` | 否 | 否 | 是 |
| `pre-line` | 是 | 否 | 是 |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `<ruby>` / `<rt>` / `<rp>` | ✅ Baseline（2015 起广泛） | 放心用 |
| `<time>` | ✅ Baseline（2017 起广泛） | 放心用 |
| `<bdi>` | ✅ Baseline（2020 起广泛） | 用户生成内容首选 |
| `target="_blank"` 隐含 `noopener` | ✅ 现代浏览器默认 | 仍建议显式写 `rel="noopener"` 兼容老浏览器 |
| `<wbr>` | ✅ Baseline（2015 起广泛） | 放心用 |
| `download`（跨域） | 🟡 受限 | 跨域多被拦，需服务端 `Content-Disposition` |
| `referrerpolicy` | ✅ 广泛可用 | 默认 `strict-origin-when-cross-origin` 已较安全 |

## 常见误用速查

| 误用 | 正解 |
| --- | --- |
| 用 `<strong>`/`<em>` 只为加粗 / 斜体 | 纯样式用 CSS `font-weight`/`font-style` |
| 用 `<b>` 标警告（其实很重要） | 重要内容用 `<strong>` |
| 用 `<i>` 标需要重读的强调 | 强调用 `<em>` |
| 用 `<cite>` 标人名 | 人名用 `<b>`/`<span>`；`<cite>` 只标作品 |
| 在 `<q>` 里手敲引号 | 让浏览器自动加（配 `lang`） |
| 用 `<br><br>` 分段 | 用两个 `<p>` |
| 用 `<dl>` 做缩进 | 缩进用 CSS `margin` |
| `target="_blank"` 不写 `rel` | 加 `rel="noopener noreferrer"` |
| 链接文字写「点这里」 | 写自解释文字（如「我们的产品线」） |
| 用 `<del>` 标「过期 / 不再准确」 | 那用 `<s>`；`<del>` 是编辑删除 |

## 权威链接

**标准 / 规范**

- [WHATWG HTML Standard — Text-level semantics](https://html.spec.whatwg.org/multipage/text-level-semantics.html)
- [MDN: `<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) · [`<strong>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong) · [`<em>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em) · [`<time>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time) · [`<ruby>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby) · [`<bdi>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi)
- [MDN: HTML 日期与时间格式](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Date_and_time_formats)

**课程 / 指南**

- [web.dev: Learn HTML — Text basics](https://web.dev/learn/html/text-basics) · [Links](https://web.dev/learn/html/links)
- [MDN: 行内文本语义概览](https://developer.mozilla.org/en-US/docs/Web/HTML/Element#inline_text_semantics)

**兼容性 / 工具**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)

## 相关页

- [入门](./getting-started) · [强调与重要性](./guide-line/emphasis-importance) · [行内文本语义全谱](./guide-line/inline-semantics)
- [超链接机制与 rel 安全](./guide-line/links-and-rel) · [列表三型](./guide-line/lists)
- [国际化与编辑标注](./guide-line/i18n-text) · [`wbr`/`br` 与空白折叠](./guide-line/wbr-whitespace)
