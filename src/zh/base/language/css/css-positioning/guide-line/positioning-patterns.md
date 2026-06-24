---
layout: doc
outline: [2, 3]
---

# 定位实战模式

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **角标 / 关闭按钮**：父 `position: relative` + 子 `position: absolute` + `top`/`right`，最高频组合
- **吸顶导航（钉死）**：`position: fixed; top: 0; inset-inline: 0`，记得给 `<body>` 留 `padding-top` 补回被遮高度
- **吸顶表头 / 分组标题（滚到才吸）**：`position: sticky; top: 0` + 背景色；当心父级 `overflow` 与父级高度
- **绝对居中**：现代用 Flex/Grid（`display: grid; place-items: center`）；脱流居中用 `position: absolute; inset: 0; margin: auto`（需定宽高）或 `top/left: 50% + translate(-50%, -50%)`
- **tooltip / 下拉**：传统 `absolute` + `top: 100%`；现代用[锚点定位](./anchor-positioning) `position-area` 自动避让；更稳用 `popover`（进顶层免 `z-index`）
- **全屏遮罩 overlay**：`position: fixed; inset: 0` 铺满视口 + 半透明背景；当心被祖先 `transform` 夺走包含块
- **角标徽点不撑大父级**：`absolute` 脱流，天然不影响父级尺寸；用 `inset` 微调出血位置
- 通用坑：`absolute`/`fixed` 元素勿遮挡内容（缩放放大文字时尤甚）；遮罩层注意焦点管理与无障碍

## 模式一：角标与关闭按钮（父 relative + 子 absolute）

最经典的定位配方：把一个小元素精确钉在容器的某个角。父级 `position: relative` 把坐标系收回到自己，子级 `position: absolute` 脱流后相对父级摆放：

```css
.card {
  position: relative; /* 不偏移，只作参照系 */
}
.card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
}
.card__close {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%); /* 半出血到角外，做「悬浮删除」效果 */
}
```

因为 `absolute` 脱流，角标**不会撑大父级、不影响内容布局**——这正是它适合做徽点、关闭按钮、「NEW」标签的原因。

## 模式二：吸顶导航——fixed 还是 sticky

两种「顶部导航」常被混淆，选错就是 bug：

**`fixed`（始终钉在屏幕顶）**——导航从一开始就脱离文档、悬在视口顶部，页面在它下面滚动：

```css
.navbar {
  position: fixed;
  top: 0;
  inset-inline: 0; /* 左右铺满（= left:0; right:0） */
}
body {
  padding-top: 64px; /* 关键：fixed 脱流后会盖住开头内容，用 padding 补回 */
}
```

**`sticky`（先随页面、滚到顶才吸住）**——导航初始跟着文档流，滚动到顶端才「黏」住：

```css
.navbar {
  position: sticky;
  top: 0;
}
```

::: tip 怎么选
要「永远悬浮」（如全站工具栏）用 `fixed`，但**务必给 body 补 `padding-top`**，否则首屏内容被盖。要「滚到才吸、且不脱流不遮内容」用 `sticky`，更省心——但记得 [position 五取值](./position-values) 里那三大失效：写阈值、避开父级 `overflow`、父级要够高。
:::

## 模式三：吸顶表头与分组标题

长表格滚动时表头吸顶、长列表里分组标题吸附，都是 `sticky` 的主场：

```css
/* 表头吸顶：给 th 设 sticky 比给 thead/tr 更稳 */
thead th {
  position: sticky;
  top: 0;
  background: var(--bg); /* 必须给背景，否则吸住时下方行透上来 */
  z-index: 1;            /* 压住滚动到下面的单元格 */
}

/* 通讯录分组标题 */
.contact-group__title {
  position: sticky;
  top: 0;
  background: var(--bg);
}
```

两个反复踩的点：①**一定要给背景色**，否则吸附时内容会透叠；②表格里把 `sticky` 加在 `th`/`td` 上而非 `tr` 上（部分浏览器对 `tr` 的 `sticky` 支持受表格布局限制）。

## 模式四：绝对居中

「让一个盒子在容器里水平垂直居中」有几种写法，优先级从高到低：

**首选——Flex / Grid（不必脱流，最简单）**：

```css
.center-box {
  display: grid;
  place-items: center; /* 一行搞定水平 + 垂直居中 */
}
```

**脱流居中（当被居中元素必须 `absolute`/`fixed` 时）**：

```css
/* 写法 A：inset:0 + margin:auto（需要定宽高） */
.modal {
  position: fixed;
  inset: 0;
  width: 320px;
  height: 200px;
  margin: auto; /* 四向 auto 把定尺寸盒子推到正中 */
}

/* 写法 B：50% + translate（无需定宽高，最通用） */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 用自身一半尺寸回拉，精确居中 */
}
```

::: warning translate 居中的副作用
`transform` 会让该元素**创建层叠上下文**（见 [z-index 与层叠上下文](./stacking-context)），并**夺走内部 `fixed` 子元素的包含块**。在弹窗这种本就在顶层的场景一般无碍，但若弹窗内部还有 `position: fixed` 的子元素要相对视口，就会失灵——此时改用「写法 A」或用 `<dialog>`/`popover` 进顶层。
:::

## 模式五：tooltip 与下拉浮层

让浮层贴着触发元素，三个时代三种做法：

**传统（兼容性最好）**——父 `relative` + 浮层 `absolute; top: 100%`：

```css
.has-tip { position: relative; }
.tip {
  position: absolute;
  top: 100%;   /* 紧贴触发元素底部 */
  left: 0;
  z-index: 10;
}
```

缺点：浮层被祖先 `overflow: hidden` 裁掉；贴近屏幕边缘不会自动翻面；`z-index` 容易与别处打架。

**现代之一——[锚点定位](./anchor-positioning)**（自动避让，Baseline 2026 需降级）：

```css
.has-tip { anchor-name: --tip-anchor; }
.tip {
  position: fixed;
  position-anchor: --tip-anchor;
  position-area: bottom;
  position-try-fallbacks: flip-block; /* 下方放不下自动翻上面 */
}
```

**现代之二——`popover`**（进顶层，彻底免疫 `overflow` 裁剪与 `z-index` 战争），详见 [popover & dialog 与定位](./popover-dialog-positioning)。

## 模式六：全屏遮罩 overlay

模态背后的半透明遮罩，用 `fixed; inset: 0` 一句铺满视口：

```css
.overlay {
  position: fixed;
  inset: 0;                       /* 铺满整个视口 */
  background: rgb(0 0 0 / 50%);
  z-index: 1000;
}
```

::: warning 两个高频翻车点
①**包含块被夺**：若任一祖先有 `transform`/`filter`/`perspective`，`fixed; inset: 0` 只会铺满那个祖先而非整屏（见 [position 五取值](./position-values)）。遮罩务必挂在尽量靠近 `<body>` 的层级，或干脆改用 `<dialog>` 的 `::backdrop`（自动进顶层、自动铺满，零踩坑）。
②**无障碍**：手写遮罩需自己处理焦点陷阱、`Esc` 关闭、背景 `inert`——这些 `<dialog>` 的 `showModal()` 全自动包办，能用就别手搓。
:::

## 通用注意：别遮住内容、别忘无障碍

MDN 反复提醒：用 `absolute` / `fixed` 定位的元素，要确保**页面放大文字时不会遮挡其他内容**。固定的工具栏、悬浮按钮在小屏 + 大字号下尤其容易压住正文——多用相对单位、给主内容留安全间距。遮罩 / 弹层则要管好键盘焦点与 `Esc`。

## 小结

「父 relative + 子 absolute」搞定角标，`fixed` 与 `sticky` 各管一种吸顶（别忘补位与三大失效），居中优先 Flex/Grid、脱流才用 `inset:auto` 或 `translate`，浮层从 `absolute` 一路演进到锚点定位与顶层。最后这条「顶层」最值得专门说——下一页讲 [popover & dialog 与定位](./popover-dialog-positioning)。
