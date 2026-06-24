---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 盒模型四层（由内向外）：内容 → `padding` → `border` → `margin`；`outline` / `box-shadow` 不占布局
- `box-sizing`：默认 `content-box`（`width` 只算内容）；推荐全局 `border-box`（`width` 含内边距 + 边框）
- 全局重置：`*, *::before, *::after { box-sizing: border-box; }`
- `display` = 外显示类型（`block`/`inline`）+ 内显示类型（`flow`/`flow-root`/`flex`/`grid`/`table`）
- 开 BFC 用 `display: flow-root`（清浮动 / 止合并，零副作用）；别再用 `overflow: hidden` 黑魔法
- 外边距合并：相邻**块向**外边距取较大值；水平向不合并；加 `padding`/`border`/BFC 可阻止
- 内在尺寸：`min-content`（最长单词宽）/ `max-content`（一行不换）/ `fit-content`（折中，最常用）
- `aspect-ratio: 16/9`：至少一边 auto 才生效；配 `<img>` 的 `width`/`height` 属性防 CLS
- `overflow`：`auto`（按需滚，最常用）/ `scroll`（恒滚条）/ `hidden`（裁切可程序滚）/ `clip`（裁切禁一切滚）
- 现代：`scrollbar-gutter: stable`（防滚动条抖动）、`overscroll-behavior: contain`（阻滚动链）

## 盒模型图

```
┌─────────────── margin（外边距 · 透明 · 盒子之间间隔）───────────────┐
│  ┌──────────── border（边框 · 可见框）──────────────────────────┐  │
│  │  ┌───────── padding（内边距 · 背景延伸至此）────────────────┐  │  │
│  │  │  ┌────── content（内容 · width/height 默认量这层）─────┐  │  │  │
│  │  │  │                                                    │  │  │  │
│  │  │  └────────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## `box-sizing` 速查

| 值 | `width` 量哪层 | 加内边距 / 边框时 | 写 `width:350px` 实际宽 |
| --- | --- | --- | --- |
| `content-box`（默认） | 内容盒 | 往外加，盒子变大 | 350 + 内边距 + 边框 |
| `border-box`（推荐） | 边框盒 | 往里挤，盒子不变 | 恰好 350 |

## `display` 速查（单值 = 双值）

| 单值 | = 双值 | 含义 |
| --- | --- | --- |
| `block` | `block flow` | 块盒 + 普通流 |
| `inline` | `inline flow` | 行内盒 + 普通流 |
| `inline-block` | `inline flow-root` | 行内盒 + 开 BFC，尊重宽高 / 上下 margin |
| `flow-root` | `block flow-root` | 块盒 + 开 BFC（清浮动 / 止合并） |
| `flex` / `inline-flex` | `block/inline flex` | Flex 容器 |
| `grid` / `inline-grid` | `block/inline grid` | Grid 容器 |
| `list-item` | `block flow list-item` | 块盒 + 项目符号 |
| `none` | — | 从盒树彻底移除，不占空间，移出无障碍树 |
| `contents` | — | 移除自身盒子，子元素上浮为父级直接子元素 |
| `table` / `table-cell` …… | — | 模拟 `<table>` 各部分（`table-cell`/`table-caption` 开 BFC） |

## 尺寸关键字速查

| 关键字 | 文字怎么排 | 盒子宽度 | 典型用途 |
| --- | --- | --- | --- |
| `min-content` | 每处都折，挤到最窄 | = 最长单词宽 | 极窄列、避免任何溢出 |
| `max-content` | 完全不折行 | = 一整行宽（可溢出） | 不希望折行的标签 |
| `fit-content` | 够空间不折、不够才折 | 贴内容但 ≤ 可用空间 | 贴文字的按钮 / 标签（最常用） |
| `fit-content(20em)` | 同上但封顶 | ≤ 20em | Grid 轨道、带上限的自适应 |

> 公式：`fit-content = min(max-content, max(min-content, 可用空间))`
> 优先逻辑属性 `inline-size` / `block-size` / `max-inline-size`（按书写方向，国际化更稳）。

## `aspect-ratio` 速查

| 写法 | 含义 |
| --- | --- |
| `aspect-ratio: 16 / 9` | 宽高比 16:9（省略 `/高` 时高默认为 `1`） |
| `aspect-ratio: 1` | = `1 / 1`，正方形 |
| `aspect-ratio: auto` | 默认；替换元素用固有比例，否则无首选比例 |
| `aspect-ratio: 3 / 2 auto` | 替换元素：加载前用 3/2 占位，加载后用固有比例 |

> 生效前提：**宽高至少一边为 auto**；都写死则忽略。`<ratio>` 作用于 `box-sizing` 指定的盒；`auto` 始终基于内容盒。

## `overflow` 速查

| 值 | 溢出处理 | 滚动条 | 程序化滚动 |
| --- | --- | --- | --- |
| `visible`（默认） | 显示在盒外 | 无 | — |
| `hidden` | 裁切 | 无 | **可** |
| `scroll` | 滚动 | **恒**显示 | 可 |
| `auto` | 滚动 | **按需**显示 | 可 |
| `clip` | 裁切 | 无 | **禁止** |

> 简写 `overflow: x y`（第一值给 x、第二值给 y）。某轴设非 `visible` 时，另一轴的 `visible` 计算为 `auto`。
> 取非 `visible` 值 → 创建**滚动容器** + 开 BFC；内部滚动需容器有**确定高度**。

## 滚动相关现代属性

| 属性 | 关键值 | 作用 |
| --- | --- | --- |
| `scrollbar-gutter` | `stable` / `stable both-edges` | 预留滚动条槽位，防内容横向抖动 |
| `overscroll-behavior` | `contain` / `none` | 阻断滚动链（模态框 / 侧栏滚到底不带动背景） |

## 外边距合并速查

- **三场景**：① 相邻兄弟 ② 父与首/末子元素（中间无隔离）③ 空块自身上下
- **取值**：取较大者；有正有负 = 最大正 − 最大负绝对值；全负 = 最负的那个
- **只合并块向**（垂直）；水平向永不合并；Flex / Grid 子项间不合并
- **阻止**：开 BFC / 加 `border` 或 `padding` / Flex / Grid / 浮动 / 绝对定位 / 父设 `height`·`min-height`

## 创建 BFC 的方式

根元素 `<html>` · 浮动 · 绝对/固定定位 · `display: inline-block` · `display: table-cell`/`table-caption` · **`display: flow-root`**（推荐）· `overflow` 非 `visible`/`clip` · `contain: layout`/`content`/`paint` · Flex / Grid 子项 · 多列容器（`column-count`/`column-width` 非 `auto`）

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `box-sizing`（含 `border-box`） | ✅ Baseline 广泛可用（2015） | 放心用，建议全局重置 |
| `display`（含双值语法） | ✅ Baseline 广泛可用 | 放心用 |
| `display: flow-root` | ✅ Baseline 广泛可用（2019） | 开 BFC 首选 |
| `display: contents` | 🟡 已广泛支持，旧版有无障碍 bug | 纯包装层放心用；带语义元素上实测读屏 |
| `min/max/fit-content` | ✅ Baseline 广泛可用（2020–2021） | 放心用 |
| `aspect-ratio` | ✅ Baseline 广泛可用（2021） | 放心用，防 CLS 首选 |
| 逻辑属性（`inline-size` 等） | ✅ Baseline 广泛可用 | 优先于物理属性 |
| `scrollbar-gutter` | 🟡 Baseline 新近可用（2024） | 渐进增强，老浏览器忽略 |
| `overscroll-behavior` | 🟠 **尚非 Baseline** | 纯渐进增强，不依赖它做关键交互 |

## 权威链接

**标准 / 规范**

- [CSS Box Model Module Level 4](https://drafts.csswg.org/css-box-4/) · [CSS Display Module Level 3](https://drafts.csswg.org/css-display/)
- [CSS Box Sizing Module Level 4](https://drafts.csswg.org/css-sizing-4/) · [CSS Overflow Module Level 3](https://drafts.csswg.org/css-overflow-3/)

**参考 / 文档**

- [MDN: CSS box model（模块）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model) · [`box-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing) · [`display`](https://developer.mozilla.org/en-US/docs/Web/CSS/display)
- [MDN: 块格式化上下文（BFC）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Block_formatting_context) · [掌握外边距合并](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing)
- [MDN: `aspect-ratio`](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) · [`overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) · [`scrollbar-gutter`](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter) · [`overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior)

**课程 / 指南**

- [web.dev: Learn CSS — Box Model](https://web.dev/learn/css/box-model) · [Sizing](https://web.dev/learn/css/sizing) · [Overflow](https://web.dev/learn/css/overflow)

**兼容性查询**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)

## 相关页

- [入门](./getting-started) · [盒模型与 box-sizing](./guide-line/box-model) · [display 全谱](./guide-line/display-values)
- [外边距合并与 BFC](./guide-line/margin-collapse-bfc) · [尺寸与内在尺寸关键字](./guide-line/sizing-keywords)
- [`aspect-ratio` 与现代尺寸](./guide-line/aspect-ratio) · [overflow 与滚动容器](./guide-line/overflow-scroll)
