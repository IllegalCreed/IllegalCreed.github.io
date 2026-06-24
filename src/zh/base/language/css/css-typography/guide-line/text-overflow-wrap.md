---
layout: doc
outline: [2, 3]
---

# 截断·折行·断词

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `white-space`：控制空白与折行——`normal`（合并空白、自动折行）/ `nowrap`（不折行）/ `pre`（保留空白与换行）/ `pre-wrap`（保留且折行）/ `pre-line`（合并空白但保留换行）
- 单行省略号三件套：`white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`（三者缺一不可）
- 多行省略号：`display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;`（或标准 `line-clamp`）
- `overflow-wrap: break-word`：**常规折点放不下时**才从单词内部断开——防长 URL/长 token 撑破容器，最常用
- `word-break: break-all`：**任意字符**都可断（更激进，CJK 慎用）；`keep-all`：CJK 不在字间断行
- `hyphens: auto`：按 `lang` 自动加连字符断词（西文有效，需正确 `<html lang>`）
- `text-wrap: balance`：多行**标题**每行字数均衡（**Baseline 2024**，≤6 行才生效，性能开销可忽略）
- `text-wrap: pretty`：**正文**消除末行孤字（孤行）（**Baseline 新近可用 2024**，算法较慢，宜用于正文）
- `text-wrap: nowrap` 等价 `white-space: nowrap`；`text-wrap` 是 `text-wrap-mode` + `text-wrap-style` 的简写

## `white-space`：空白与折行的总开关

`white-space` 同时控制两件事：**如何处理源码里的空白/换行**、**是否自动折行**：

```css
.nowrap {
  white-space: nowrap;
} /* 强制一行，超出溢出 */
.code {
  white-space: pre;
} /* 原样保留空格和换行（像 <pre>） */
.chat {
  white-space: pre-wrap;
} /* 保留空白与换行，且仍自动折行 */
```

| 值 | 合并连续空白 | 保留换行符 | 自动折行 |
| --- | --- | --- | --- |
| `normal`（默认） | 是 | 否 | 是 |
| `nowrap` | 是 | 否 | **否** |
| `pre` | **否** | **是** | 否 |
| `pre-wrap` | **否** | **是** | 是 |
| `pre-line` | 是 | **是** | 是 |

> `pre-wrap` 是聊天气泡、用户输入回显的常用值：既尊重用户敲的换行与空格，又不会因为一行太长而横向溢出。

## 单行与多行省略号截断

### 单行省略号（三件套）

```css
.truncate {
  white-space: nowrap; /* ① 不折行 */
  overflow: hidden; /* ② 溢出隐藏 */
  text-overflow: ellipsis; /* ③ 末尾显示 … */
}
```

三个属性**缺一不可**：`text-overflow: ellipsis` 只在「不折行 + 溢出隐藏」的前提下才会显示省略号。它本身不会触发截断，只决定「被裁掉时末尾画什么」。

### 多行省略号（行数夹断）

```css
.clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3; /* 最多显示 3 行，其余 … */
  line-clamp: 3; /* 标准属性，逐步落地 */
  overflow: hidden;
}
```

多行截断目前仍主要靠 `-webkit-line-clamp`（虽带前缀但跨浏览器支持良好），标准 `line-clamp` 正在落地，写上以备前向兼容。

## `overflow-wrap` 与 `word-break`：长串怎么断

默认情况下，浏览器只在「合法折点」（空格、连字符等）换行。一个**超长且无空格的串**（长 URL、哈希、`supercalifragilistic...`）放不下时，不会自己断，而是**直接溢出容器**。两个属性解决它：

```css
/* 最常用：常规折点排不下时，才从单词内部断开 */
.content {
  overflow-wrap: break-word;
}

/* 更激进：任意字符间都能断（西文也会从单词中间硬断） */
.aggressive {
  word-break: break-all;
}
```

| 属性 | 值 | 行为 |
| --- | --- | --- |
| `overflow-wrap` | `normal` / `break-word` / `anywhere` | `break-word`：先尽量用正常折点，实在不行才断词（**首选**） |
| `word-break` | `normal` / `break-all` / `keep-all` | `break-all`：任意字符可断（激进）；`keep-all`：CJK 不在字间断 |

::: tip `overflow-wrap: break-word` vs `word-break: break-all`
- **`overflow-wrap: break-word`**（首选）：只有当一个词**单独成行都放不下**时才断它，正常文字仍按词折行——既防溢出又尽量自然；
- **`word-break: break-all`**（激进）：不管放不放得下，**每个字符**都是潜在折点，西文会被切得支离破碎，一般只在特定场景（如展示哈希）用；
- **`word-break: keep-all`**：让 CJK 文本**不在字与字之间**断行（按词/标点断），用于不希望中文被随意拆行的场景。

防「长 URL 撑破布局」记 `overflow-wrap: break-word` 即可。
:::

## `hyphens`：自动连字符

```css
.article {
  hyphens: auto; /* 按语言规则在词内插入连字符断行 */
}
```

`hyphens: auto` 让浏览器按 `lang` 指定的语言规则，在合适处插入连字符（hyphen）断词——这能让**西文两端对齐**（`text-align: justify`）的空隙更均匀。它**依赖正确的 `<html lang>`**（不同语言断词规则不同），且对中文无意义（中文不用连字符断词）。

| 值 | 含义 |
| --- | --- |
| `none` | 从不加连字符 |
| `manual`（默认） | 仅在源码里有「软连字符」`&shy;` 或连字符处断 |
| `auto` | 按语言规则自动断词加连字符 |

## `text-wrap`：现代折行美化

`text-wrap` 控制折行的**整体策略**，是 `text-wrap-mode`（折不折）+ `text-wrap-style`（怎么折）的简写。它带来两个让排版「专业一档」的现代值：

### `text-wrap: balance`（标题均衡折行 · Baseline 2024）

```css
h1,
h2,
.card__title,
blockquote {
  text-wrap: balance;
}
```

`balance` 让多行文本**每行的字数尽量均衡**，避免「最后一行只剩孤零零一两个字」的难看排版，特别适合**标题、副标题、引用、图说**这类短文本块。

- **Baseline 状态**：`text-wrap` 简写与 `balance` 自 **Baseline 2024（2024 年 3 月起新近可用）**；
- **行数上限**：只对**少行**文本生效（Chromium 约 ≤6 行、Firefox 约 ≤10 行），超过就退回普通折行——也正因如此**性能开销可忽略**；
- 老浏览器不支持时自动退回普通折行，是**纯渐进增强**，可放心加。

### `text-wrap: pretty`（正文消孤行 · Baseline 新近可用）

```css
p,
li {
  text-wrap: pretty;
}
```

`pretty` 折行结果和普通 `wrap` 类似，但用**更慢、更讲究的算法**优化「末行不要只剩一个词（孤行 orphan）」等细节，适合**正文长段落**。

- **Baseline 状态**：`text-wrap-style` 与 `pretty` 自 **Baseline 2024（2024 年 10 月起新近可用）**；其中 `pretty` 各浏览器实现深浅不一，把它当**渐进增强**用即可，老浏览器忽略不影响阅读；
- **性能**：算法比 `balance` 重，官方建议用于**正文级**文本块（追求观感），而非给所有文字无脑加。

::: tip balance 给标题、pretty 给正文
经验法则：

- **短文本（标题/图说/引用）→ `text-wrap: balance`**：每行字数均衡；
- **长文本（正文段落）→ `text-wrap: pretty`**：消除末行孤字。

两者都是纯渐进增强，不支持的浏览器自动退回普通折行，加了只赚不亏。
:::

`text-wrap` 还有 `nowrap`（等价 `white-space: nowrap`）与 `stable`（`contenteditable` 编辑时保持已排好的行不跳动）两个值。

## 小结

`white-space` 是空白与折行的总开关（`pre-wrap` 适合用户输入回显）；单行省略号靠 `nowrap + overflow:hidden + text-overflow:ellipsis` 三件套、多行靠 `-webkit-line-clamp`；防长串撑破容器首选 `overflow-wrap: break-word`，`word-break` 更激进、`hyphens: auto` 给西文断词；现代的 `text-wrap: balance`（标题，Baseline 2024）与 `text-wrap: pretty`（正文，Baseline 新近可用）是零成本的折行美化。文字本体讲完了，下一页转向「文字前面的标记」——[列表样式与 `::marker`](./list-marker)。
