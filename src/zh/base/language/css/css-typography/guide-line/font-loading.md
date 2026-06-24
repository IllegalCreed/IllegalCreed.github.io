---
layout: doc
outline: [2, 3]
---

# 字体加载与性能

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 字体加载分两段：**block period（阻塞期）** 字看不见（FOIT）/ **swap period（交换期）** 先用回退字体（FOUT）
- `font-display` 五值：`auto`（≈block）/ `block`（白字等约 3s）/ `swap`（立刻回退、永久可换）/ `fallback`（约 100ms 白 + 3s 窗）/ `optional`（约 100ms 内不到就放弃换）
- **FOIT**=Flash of Invisible Text（白字闪烁，`block` 造成）；**FOUT**=Flash of Unstyled Text（字体跳变，`swap` 造成）
- 稳妥默认 `font-display: swap`；追求零布局抖动用 `optional`；几乎不用 `block`
- 关键字体**预加载**：`<link rel="preload" href="x.woff2" as="font" type="font/woff2" crossorigin>`（`crossorigin` 必填）
- 第三方字体源先 **`preconnect`**：`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- 压 CLS：用 `size-adjust` + `ascent-override` / `descent-override` / `line-gap-override` 把回退字体度量对齐到 Web 字体
- 只发 **WOFF2**（比 WOFF 小约 30%）；用 `unicode-range` 子集化按语言分片，按需下载
- 自托管字体通常优于第三方 CDN（少一次跨域连接、可控缓存、隐私更好）

## 字体加载的两段时间线

浏览器遇到一段用了 Web 字体的文字、而该字体还没下载完时，会经历两个阶段：

1. **block period（阻塞期）**：这段时间内，如果字体没就绪，文字以**不可见**方式渲染（占位但看不见）——这就是 **FOIT（Flash of Invisible Text，不可见文字闪烁）**；
2. **swap period（交换期）**：阻塞期结束后字体仍没到，就先用**回退字体**显示；字体在交换期内到达，则替换过来——这个替换动作就是 **FOUT（Flash of Unstyled Text，无样式文字闪烁）**。

`font-display` 决定这两段各持续多久，从而决定用户看到的是「白字」还是「字体跳变」。

## `font-display` 五个取值

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.woff2") format("woff2");
  font-display: swap; /* 在这里设置 */
}
```

| 值 | 阻塞期 | 交换期 | 效果 | 适用 |
| --- | --- | --- | --- | --- |
| `auto` | 浏览器决定 | 浏览器决定 | 通常≈`block` | 不想操心时的默认 |
| `block` | 约 3s（白字） | 无限 | 先白字（FOIT），到了再显示 | 图标字体等「错字体不如不显示」 |
| `swap` | 0ms | 无限 | 立刻回退字体（FOUT），到了就换 | **内容站点稳妥默认** |
| `fallback` | 约 100ms | 约 3s | 极短白字→回退字体；超 3s 不再换 | FOUT 与 FOIT 的折中 |
| `optional` | 约 100ms | 无 | 100ms 内不到就**整页用回退**、本次不换 | **追求零 CLS**、字体可有可无 |

::: tip 怎么选
- **`swap`**——最常见的「内容优先」选择：用户立刻能读，代价是字体到位时跳变一下。配合预加载，跳变窗口很短。
- **`optional`**——最友好 Core Web Vitals 的选择：要么 100ms 内用上 Web 字体、要么这次就用回退字体且**不再切换**，因此**几乎不产生布局偏移（CLS）**。适合「有最好、没有也不影响」的正文字体。
- **`block`**——只建议用在「错字体比没字体更糟」的场景，比如图标字体（用回退字体会显示一堆豆腐块）。普通文字别用，FOIT 白屏伤体验。
:::

## 预加载关键字体

字体在 CSS 里被引用，意味着浏览器要**先下载并解析 CSS、再发现字体、再下载字体**——发现得晚，FOUT/FOIT 就长。对首屏关键字体用 `preload` 让下载**提前到解析 HTML 时**就开始：

```html
<!-- 关键字体预加载；字体请求按匿名 CORS 发出，crossorigin 必填，否则会重复下载 -->
<link
  rel="preload"
  href="/fonts/Inter.var.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

::: warning 预加载的两个坑
1. **`crossorigin` 不能漏**——字体请求一律是 CORS 匿名模式，preload 不带 `crossorigin` 会被当成另一个请求，导致**下载两次**；
2. **别滥用**——`preload` 是「插队」，预加载太多字体会挤占首屏关键资源（CSS、首图）的带宽。只预加载**首屏真正用到**的 1～2 款字重。
:::

用第三方字体（如 Google Fonts）时，先 `preconnect` 提前完成 DNS + TLS 握手：

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

## 用度量覆盖压低 CLS

FOUT 的副作用是布局偏移：回退字体和 Web 字体的**字高、行高、字宽不同**，换字体时文字会「跳动」，推动下方内容位移（累积布局偏移 CLS）。在 `@font-face` 上用一组**度量覆盖描述符**，把回退字体「调整成」和 Web 字体占一样的空间，就能让交换近乎无感：

```css
/* 给回退字体（这里是本机 Arial）建一个度量对齐过的别名 */
@font-face {
  font-family: "Inter-fallback";
  src: local("Arial");
  size-adjust: 107%; /* 整体缩放，让 x-height / 字宽贴近 Web 字体 */
  ascent-override: 90%; /* 上升部高度（影响行内顶部空间） */
  descent-override: 22%; /* 下降部高度 */
  line-gap-override: 0%; /* 行间隙 */
}

body {
  /* Web 字体优先，回退到「已对齐度量」的别名而非裸 Arial */
  font-family: "Inter", "Inter-fallback", sans-serif;
}
```

| 描述符 | 作用 |
| --- | --- |
| `size-adjust` | 给字形整体乘一个缩放系数，对齐 x-height 与字宽 |
| `ascent-override` | 覆盖上升部度量（基线以上） |
| `descent-override` | 覆盖下降部度量（基线以下） |
| `line-gap-override` | 覆盖行间隙度量 |

> 这些描述符是当前压 CLS 的现代手段，工具（如 Fontaine、Next.js 的字体优化）会自动算出这组百分比。手动调时，目标是让回退字体和 Web 字体在同一字号下占据**尽量一致的盒子**。

## 格式、子集与托管

### 只发 WOFF2

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.woff2") format("woff2"); /* 一种格式足矣 */
}
```

WOFF2 压缩率比 WOFF 高约 30%，现代浏览器全面支持。2026 年的建议是「只用 WOFF2，别的都别管」——CSS 更干净，下载更小。

### `unicode-range` 子集化

把一款大字体（尤其含 CJK 的）按语言/字符范围拆成多片，浏览器**只下载页面实际用到字符所在的片**：

```css
/* 拉丁字符片 */
@font-face {
  font-family: "Noto";
  src: url("/fonts/noto-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF; /* 仅当页面出现这些码位才下载本片 */
}
/* 中文片（按需另存一片） */
@font-face {
  font-family: "Noto";
  src: url("/fonts/noto-cjk.woff2") format("woff2");
  unicode-range: U+4E00-9FFF; /* CJK 统一表意文字 */
}
```

中文字体动辄数 MB，子集化（按页面用字裁剪、或按 `unicode-range` 分片）几乎是必做的优化。

### 自托管 vs 第三方

自托管字体（放在自己域名/CDN）通常优于直接引第三方：少一次跨域连接、缓存策略自己说了算、不向第三方泄露用户访问、还能配合 `preload`。引第三方时务必 `preconnect` 抵消跨域连接成本。

## 小结

字体加载在「白字（FOIT）」与「跳变（FOUT）」之间权衡，`font-display` 是这把调节旋钮：内容站点默认 `swap`、追求零 CLS 用 `optional`、图标字体才用 `block`。配合 `preload`（带 `crossorigin`）缩短发现时延、度量覆盖描述符消除布局抖动、WOFF2 + 子集化减小体积。字体显示稳了，下一步进入逐行的排版细节——[行距·字距·对齐与装饰](./line-spacing-align)。
