---
layout: doc
outline: [2, 3]
---

# CSSOM 与 render tree

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **CSS 是 render-blocking**：收齐并处理完全部 CSS 前，浏览器阻塞页面渲染
- 根因：**后面的规则可以覆盖前面的**——不能拿「解析到一半的 CSSOM」去渲染，否则会画出注定被覆盖的样式
- **CSSOM 非增量**（对比 DOM 增量）；但构建**极快**——总耗时通常小于一次 DNS 查询
- **级联（cascade）**：从最一般的规则开始，递归应用更具体的规则细化出 computed style；UA 默认样式表打底
- **render tree = DOM ∩ 可见 + CSSOM**：从 DOM 根遍历每个可见节点并附上计算样式
- `display: none`：**自己和全部子孙**都不进 render tree；`visibility: hidden`：**保留**（占布局空间）
- `<head>` 及其子节点不进 render tree；`::before`/`::after` 有 `content` 时**进**（虽不在 DOM 中）
- 选择器匹配**从最右侧关键选择器开始向左**：`.bar .foo` 先找 `.foo` 再向上找祖先 `.bar`
- 选择器性能差异在**微秒级**，不值得围绕它做优化（MDN 原话）
- 让 CSS 不阻塞：拆分 + `media` 查询标注（如 `media="print"` 不阻塞屏幕渲染）

## 一、CSS 为什么是 render-blocking

MDN CRP 原文一句话讲透：

> 「CSS is render blocking: the browser blocks page rendering until it receives and processes all the CSS. **CSS is render blocking because rules can be overwritten**, so the content can't be rendered until the CSSOM is complete.」

拆开这句话：

1. **CSS 规则是级联的，后来者可以覆盖前者。** 同一元素，样式表第 500 行完全可能推翻第 3 行的声明。
2. 如果浏览器用「解析到一半的 CSSOM」渲染，就会先画出一版**注定要被后续规则覆盖**的样式，随后闪变（FOUC）。所以规范选择：**CSSOM 完整之前不渲染**。
3. 这也解释了为什么 **CSSOM 构建不是增量的**——「DOM 构建是增量的，CSSOM 不是」（MDN），增量特性对 CSS 不适用，因为后续规则可能覆盖前面的。

注意精确边界（三个「阻塞」别混淆）：

| 谁阻塞谁 | 结论 |
| --- | --- |
| CSS 阻塞 HTML **解析**？ | **不**。解析器遇到 `<link rel="stylesheet">` 继续往下解析 |
| CSS 阻塞**渲染**？ | **是**。CSSOM 没齐就不进 render tree/layout/paint |
| CSS 阻塞 **JS 执行**？ | **是**。JS 常查询样式（如 `getComputedStyle`），同步脚本要等前面的 CSS 就绪——而 JS 又阻塞解析，形成连坐（见[上一页](./dom-construction)） |

对写代码的影响：CSS 要**早、小、拆**。关键 CSS 尽早给（甚至内联首屏部分）；非本媒体的样式用 `media` 属性标注——`<link rel="stylesheet" media="print">` 照常下载但**不阻塞**屏幕渲染。

让 CSS 退出关键路径的具体手段（MDN CRP 优化建议的落地）：

```html
<!-- ① 默认：阻塞渲染（screen 全量样式） -->
<link rel="stylesheet" href="app.css" />

<!-- ② media 标注不匹配当前环境：照常下载，但不阻塞渲染 -->
<link rel="stylesheet" href="print.css" media="print" />
<link rel="stylesheet" href="wide.css" media="(min-width: 1200px)" />

<!-- ③ 反例：@import 让浏览器解析完外层 CSS 才发现内层请求，
     串行加载 + preload scanner 不可见，加深关键路径 -->
<style>
  @import url("more.css"); /* 避免 */
</style>
```

### 1.1 但别妖魔化 CSSOM 的构建成本

MDN 特意泼了盆冷水：**CSSOM 构建非常非常快**，快到 DevTools 不单独列它——「Recalculate Style」显示的是解析 CSS + 构建 CSSOM + 递归计算 computed styles 的总时间，而**创建 CSSOM 的总时间通常小于一次 DNS 查询**。真正贵的是「等 CSS 下载」的网络时间，不是解析本身。优化火力应对准：减少关键 CSS 字节数、减少请求往返。

## 二、级联与计算样式（computed style）

CSSOM 与 DOM 一样是树，但二者**相互独立**。浏览器把 CSS 规则转成可操作的样式映射，基于选择器建立父子/兄弟关系的节点树，然后**级联**：

> 「浏览器从适用于节点的**最一般规则**开始，**递归地应用更具体的规则**来细化计算样式」——即属性值层层下压（cascade down）。

两个常被忽略的事实（Chrome part3）：

- **没写 CSS 也有 computed style**：UA 默认样式表（user agent stylesheet）打底——`<h1>` 比 `<h2>` 大、段落有默认 margin，都来自它。级联的起点永远不是空白。
- computed style = **选择器匹配 + 级联**后每个 DOM 节点的最终样式集，DevTools 的 Computed 面板看到的就是它。

### 2.1 选择器匹配：从右向左

匹配 `.bar .foo` 时浏览器怎么干？MDN CRP 描述：**先找到 `.foo`，再沿 DOM 向上遍历，检查是否有祖先 `.bar`**——也就是从最右侧的**关键选择器（key selector）**开始向左验证。所以：

- `.foo {}` 比 `.bar .foo {}` 快：后者多一步向上遍历。
- 右端越具体，候选集越小；`div * {}` 这种右端全匹配的写法最费。

但 MDN 紧接着的定调更重要：**这点代价「不太值得围绕它优化」，选择器性能优化的收益只在微秒级**（microseconds）。把它当理解引擎的知识，别当性能军规——真正的大头在减少节点数与避免重排。

## 三、render tree：只装「可见」的树

DOM 和 CSSOM 齐了，第三步把二者结合成 **render tree**（MDN 也称 computed style tree；Chromium 语境下对应 **layout tree** 的输入侧）：

> 「浏览器从 DOM 树的**根**开始检查每个节点，判定附着哪些 CSS 规则」，「render tree 持有**所有可见节点**的内容与计算样式」。

关键在「可见」的判定规则：

| 情形 | 进 render tree？ | 理由 |
| --- | --- | --- |
| `<head>` 及其子节点 | **否** | 不产生渲染输出 |
| `display: none` | **否，连同全部子孙** | 不显示、不占空间（UA 样式表里 `script { display: none; }` 就是这么被排除的） |
| `visibility: hidden` | **是** | 不可见但**占布局空间**，几何计算需要它 |
| `opacity: 0` | 是 | 参与布局与绘制管线（还能收事件） |
| `::before / ::after`（有 `content`） | **是** | 虽不在 DOM 中，但有渲染输出（Chrome part3 以 `p::before { content: "Hi!" }` 为例） |

对写代码的影响：

- **`display: none` vs `visibility: hidden` 不只是「看不看得见」**：前者把整棵子树从 render tree 摘除，切换时代价是整段布局重算；后者保留几何，切换只涉及绘制。频繁闪烁切换的元素用 `visibility`（或 `opacity`）更省。
- render tree 是 layout 的输入——**不在 render tree 里的节点没有布局信息**。这就是对 `display: none` 的元素读 `offsetWidth` 恒为 0 的原理。

```
DOM（全部节点）              CSSOM（全部规则）
   │  排除 head / display:none   │  选择器匹配 + 级联
   └────────────┬────────────────┘
                ▼
        render tree（可见节点 + computed style）
                ▼
             layout（下一页）
```

## 小结

- CSS render-blocking 的根因是**级联可覆盖**：半成品 CSSOM 不可用，故非增量、须完整。
- 三个阻塞分清楚：CSS 不挡 HTML 解析，挡渲染、挡 JS 执行（进而间接挡解析）。
- CSSOM 构建本身极快（< 一次 DNS 查询），贵的是下载——优化方向是早、小、拆 + `media` 标注。
- 级联从 UA 样式表打底、由一般到具体递归细化；选择器从右向左匹配，但性能差异微秒级。
- render tree 只收可见节点：`display:none` 整枝摘除、`visibility:hidden` 留位、伪元素凭 `content` 上车。
- 有了「可见节点 + 样式」，下一步算几何：[布局与重排](./layout-reflow)。
