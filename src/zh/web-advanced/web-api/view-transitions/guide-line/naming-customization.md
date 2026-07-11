---
layout: doc
outline: [2, 3]
---

# 命名与定制：name、class 与自定义动画

> 基于 W3C CSS View Transitions（Level 1/2）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **`view-transition-name` 是「配对钥匙」**：给旧态与新态的对应元素同一个名，浏览器就把它们当同一物、在 `::view-transition-group(name)` 上做形变补间。
- **唯一性是硬约束**：**同一时刻**页面上不能有两个渲染中的元素带**相同** `view-transition-name`——撞名 → `ready` reject、整个过渡被**跳过**（不是凑合，是彻底不 animate）。
- **`view-transition-name: none`**：该元素不单独成组（并入父级快照）——**默认值**，也是「用完即清、避免撞名」时手动复位的值。
- **`view-transition-name: match-element`**（Firefox 144 已含）：为选中的**每个**元素**自动生成唯一名**，省去手工编号，适合列表 / 网格等重复元素。
- **`view-transition-class`**（Firefox 144 已含，Baseline）：给一批元素**共享的类**，**不要求唯一**、**不**让元素单独成组，纯粹作「一条 CSS 规则批量样式化多个快照」的样式钩子；**每个元素仍需各自的 `view-transition-name`**。
- **`class` 的选择器写法**：`::view-transition-group(.card)`——用 `.类名` 命中所有带该 class 的快照；可空格分隔多个类做「原子化」组合。
- **默认动画**：`old` 淡出 + `new` 淡入（交叉淡入淡出）；`group` 对位置尺寸做**形变补间**（`transform` + `width`/`height`）。
- **形变自动补间**：同名元素在新旧两态**位置 / 尺寸不同**时，无需你算坐标，`group` 自动把它平滑「飞 + 缩放」过去——这是本 API 最省事的杀手锏。
- **覆盖默认动画**：给 `::view-transition-old(name)` / `::view-transition-new(name)` 写 `animation` 即可覆盖 UA 的淡入淡出；给 `::view-transition-group(name)` 写 `animation-duration`/`animation-timing-function` 调整体节奏。
- **多元素独立过渡**：给不同元素起不同 `name`，各自成组、各自定制动画，互不干扰（如 header 滑动、卡片形变、标题淡入并行）。
- **`::view-transition-group(*)`**：`*` 通配一次命中所有组（含默认 `root`），批量调时长 / 缓动。
- **禁用某段默认动画**：`::view-transition-old(root), ::view-transition-new(root) { animation: none }`——常在用 WAAPI 完全接管前清场。
- **`old`/`new` 是被替换内容**：可用 `object-fit`、`object-position` 控制两张图的填充（宽高比变化时防拉伸）。
- **动态命名**：`element.style.viewTransitionName = "hero"`（JS 里 `viewTransitionName`）可在过渡前临时打标、`finished`/`ready` 后复位为 `"none"`——跨文档尤其常用（见[SPA/MPA 页](./spa-mpa-types)）。
- **命名要「稳定且唯一」**：同一逻辑实体在新旧两态用**同一个名**才配对得上；不同实体必须**不同名**——列表项常见做法是用 id 拼进名字。

## 一、`view-transition-name`：配对与唯一性

`view-transition-name` 做两件事：**① 让元素从整页快照里「独立」出来、单独成一组**；**② 作为新旧两态之间的配对钥匙**。

```css
/* 详情页大图与列表缩略图用同一个 name → 浏览器把它俩当「同一张图」补间 */
.hero-image {
  view-transition-name: hero;
}
```

只要「更新前的某元素」和「更新后的某元素」带**相同**的 `view-transition-name`，浏览器就为这对创建一个 `::view-transition-group(hero)`，把旧快照放进 `::view-transition-old(hero)`、新快照放进 `::view-transition-new(hero)`，并**自动补间它们的位置与尺寸差异**。你不写一行坐标计算，缩略图就「飞」成了大图。

### 1.1 唯一性：撞名即跳过

**同一时刻，页面上不能有两个正在渲染的元素带相同的 `view-transition-name`。** 违反的后果很硬：

- `ViewTransition.ready` **reject**；
- 整个过渡**被跳过**——DOM 照常更新，但**没有任何动画**。

```js
// 撞名时从 ready 的 catch 能观测到（finished 仍会 resolve，因为 DOM 更新成功）
transition.ready.catch((err) => {
  console.warn("过渡被跳过，常见原因：view-transition-name 撞名", err);
});
```

所以给**列表 / 重复元素**命名时，绝不能所有卡片都叫 `card`——必须每张唯一。两条常规解法：

```css
/* 解法 A：手动把唯一标识拼进 name（配合模板引擎输出 id） */
.card[data-id="42"] {
  view-transition-name: card-42;
}
```

```css
/* 解法 B（更省事）：match-element 自动为每个元素生成唯一名 */
.card {
  view-transition-name: match-element; /* Firefox 144 已含 */
}
```

`match-element` 让浏览器**按元素身份自动派发唯一名**，你不用操心编号，特别适合动态列表、网格。它已随 Firefox 144 进入同文档 Baseline。

### 1.2 `none` 与动态命名

`view-transition-name: none` 是**默认值**，表示「不单独成组」（并入父级快照）。它还有个实战用途：**用完即清**。跨文档场景常在过渡前用 JS 临时给元素打标、快照抓完后复位成 `none`，避免残留标记在下次过渡里撞名：

```js
// 过渡前打标
el.style.viewTransitionName = "hero"; // JS 属性名是驼峰 viewTransitionName
// 快照抓完后复位，避免 bfcache 恢复时撞名（详见 SPA/MPA 页）
await transition.finished;
el.style.viewTransitionName = "none";
```

## 二、`view-transition-class`：批量样式化多个快照

命名解决「配对」，但如果你有一堆快照要**共享同一段动画样式**，逐个写 `::view-transition-group(card-1)`、`::view-transition-group(card-2)`…… 会很啰嗦。`view-transition-class`（Firefox 144 已含，Baseline）就是为此而生的**样式钩子**：

```css
/* 每张卡片仍需各自唯一的 name（这里用 match-element），再共享一个 class */
.card {
  view-transition-name: match-element;
  view-transition-class: card; /* 共享类，不要求唯一、不额外成组 */
}

/* 一条规则批量样式化所有带 card 类的快照组 —— 用 .类名 选择 */
::view-transition-group(.card) {
  animation-duration: 0.3s;
  animation-timing-function: ease-out;
}
```

三个关键区别（与 `view-transition-name` 对照记）：

- **不要求唯一**：多个元素可共享同一个 class（这正是它的意义）。
- **不让元素单独成组**：class 只是样式钩子，**元素能否成组仍取决于它有没有自己的 `view-transition-name`**——所以上例里 `match-element` 不能省。
- **选择器用 `.` 前缀**：`::view-transition-group(.card)` 命中所有带该 class 的组；`::view-transition-group(card)`（无点）则是命中**名叫 card** 的那一个组，二者不同。

class 可空格分隔多个做「原子化」组合：`view-transition-class: card fade-slow;`，然后分别写 `::view-transition-group(.card)` 与 `::view-transition-group(.fade-slow)`。

## 三、自定义 old/new 动画：覆盖默认

默认的交叉淡入淡出通过覆盖 `::view-transition-old/new` 的 `animation` 即可替换。经典的「上滑进 / 上滑出」：

```css
/* 自定义关键帧 */
@keyframes slide-out-up {
  to { transform: translateY(-100%); }
}
@keyframes slide-in-up {
  from { transform: translateY(100%); }
}

/* 覆盖 root 组的默认淡入淡出：旧图上滑离场、新图从下滑入 */
::view-transition-old(root) {
  animation: 0.4s ease-in both slide-out-up;
}
::view-transition-new(root) {
  animation: 0.4s ease-in both slide-in-up;
}
```

要点：

- **写在 `old`/`new` 上**覆盖「出场/入场」外观；**写在 `group` 上**调「整组节奏」（时长、缓动、延迟）与形变。
- **`both` 填充模式**几乎必带，避免动画首尾帧样式回弹。
- 想**完全接管**（如用 WAAPI 做 clip-path 揭示）时，先把 UA 动画清掉再在 JS 里 animate：

```css
/* 清场：关掉默认动画与混合，交给 JS 完全控制 */
::view-transition-image-pair(root) { isolation: auto; }
::view-transition-old(root),
::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
```

## 四、形变补间：位置尺寸自动动

本 API 最省事的能力：**同名元素在新旧两态的位置 / 尺寸差异，`group` 会自动补间**，你一行坐标都不用算。

```css
/* 缩略图 → 详情大图：只需两处用同名，浏览器自动把「小图位置尺寸」补到「大图位置尺寸」 */
.thumb,
.detail-hero {
  view-transition-name: hero;
}
```

列表里点第 3 张缩略图进详情：旧态是缩略图的小矩形、新态是详情页的大图，`::view-transition-group(hero)` 自动把 `transform` 与 `width`/`height` 从「小」平滑补到「大」——观感是缩略图「飞出来放大」。响应式布局下也不会算错，因为浏览器读的是真实的布局盒。

若某组你只想要形变、不要内容交叉淡入淡出（内容其实是同一张图，淡入淡出反而发虚），可让 old/new 不淡出：

```css
/* 内容一致时：保留形变、去掉交叉淡入淡出，观感更干净 */
::view-transition-old(hero),
::view-transition-new(hero) {
  animation: none; /* 去掉 UA 的 opacity 补间，只留 group 的形变 */
  mix-blend-mode: normal;
}
```

## 五、多元素独立过渡

给不同元素起**不同的名**，它们各自成组、各自定制、**并行**播放，互不干扰。一个「header 横向压缩 + 标题淡入 + 主图形变」三线并行的例子：

```css
/* 三个独立命名 → 三个独立的 group，动画同时跑 */
header { view-transition-name: site-header; }
h1.title { view-transition-name: page-title; }
.detail-hero { view-transition-name: hero; }

/* header：横向收放 */
@keyframes shrink-x { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@keyframes grow-x   { from { transform: scaleX(0); } to { transform: scaleX(1); } }
::view-transition-group(site-header) { transform-origin: left center; }
::view-transition-old(site-header) { animation: 0.2s linear both shrink-x; }
::view-transition-new(site-header) { animation: 0.2s 0.2s linear both grow-x; }

/* page-title：延迟淡入（用默认 opacity 即可，这里只调时长与延迟） */
::view-transition-group(page-title) { animation-duration: 0.3s; animation-delay: 0.15s; }

/* hero：只要形变、不要淡入淡出（内容一致） */
::view-transition-old(hero),
::view-transition-new(hero) { animation: none; }
```

批量兜底用通配 `*`：

```css
/* 给所有组（含默认 root）一个统一基调，个别组再单独覆盖 */
::view-transition-group(*) {
  animation-duration: 0.35s;
  animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
```

## 六、`old`/`new` 的填充控制

`::view-transition-old/new` 以**被替换内容**渲染，当元素新旧两态**宽高比不同**时，默认可能出现拉伸。用 `object-fit`/`object-position` 校正（和处理 `<img>` 同理）：

```css
/* 宽高比变化时避免快照被拉伸变形 */
::view-transition-old(hero),
::view-transition-new(hero) {
  object-fit: cover;
  object-position: center;
}
```

命名与样式讲完了。下一页处理「作用范围」：同文档 SPA 的实战、跨文档 MPA 的 `@view-transition` 与 `pageswap`/`pagereveal`、以及 view transition types 的分场景样式化——注意跨文档与 types 都还缺 Firefox，[SPA / MPA 与类型](./spa-mpa-types)。
