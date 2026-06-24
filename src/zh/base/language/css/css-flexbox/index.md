---
layout: doc
---

# CSS Flexbox 弹性布局

Flexbox（弹性盒布局）是一套**一维**布局模型——它专注于把一组项目沿着「一条轴」排开，再灵活地分配剩余空间、对齐参差不齐的元素。给父元素加上 `display: flex`，子元素就成了「弹性项目」，按主轴一字排开；剩下要做的，就是用 `justify-content` 在主轴上分布它们、用 `align-items` 在交叉轴上对齐它们，再用 `flex` 三值决定每个项目「能不能伸、能不能缩、从多大开始」。垂直居中、等高列、自适应导航这些过去要靠各种 hack 的需求，在 Flexbox 里都成了一两行声明。

## 概述

- **它管什么**：把一行（或一列）里的若干项目排好——谁在前谁在后、它们之间的空隙怎么分、参差不齐的高度怎么对齐、空间不够时谁先缩、空间富余时谁去填。
- **一维 vs 二维**：Flexbox 是**一维**的（一次只管一条轴：要么一行、要么一列）；要同时控制行与列的二维网格，那是 Grid 的领域。两者互补，不是替代。
- **核心心智模型**：先分清**主轴**（main axis，由 `flex-direction` 决定）与**交叉轴**（cross axis，垂直于主轴）——几乎所有 Flexbox 属性都是在回答「这是在主轴上做，还是在交叉轴上做」。
- **现代化关注点**：用 `gap` 取代外边距做间距、`flex: 1` 一行写出等分列、`min-width: 0` 破解「子项不肯缩」、逻辑轴（start/end 而非 left/right）天然适配 RTL 与书写模式。

## 本叶地图

- [入门](./getting-started) —— 五分钟跑通一个 Flex 容器，认全「容器属性」与「项目属性」两张清单
- [Flex 容器与轴向模型](./guide-line/flex-container-axes) —— `display: flex`、主轴 / 交叉轴、`flex-direction` 四个方向
- [主轴对齐与分布](./guide-line/main-axis-alignment) —— `justify-content` 全取值、`space-between/around/evenly` 的精确区别、`gap`
- [交叉轴对齐](./guide-line/cross-axis-alignment) —— `align-items`、`align-self`、`align-content`，以及单行容器为何对 `align-content` 无感
- [flex 三值与计算](./guide-line/flex-grow-shrink-basis) —— `flex-grow` / `flex-shrink` / `flex-basis`、`flex` 简写、`flex: 1` 等常见配方
- [换行、排序与间距](./guide-line/wrap-order-gap) —— `flex-wrap`、`order` 的取舍与无障碍代价、`gap` 系列
- [Flexbox 实战模式](./guide-line/flexbox-patterns) —— 圣杯布局、等高列、自适应导航栏、媒体对象
- [参考](./reference) —— 速查表 + 容器 / 项目属性表 + 实战配方 + 权威链接

## 文档地址

- [web.dev: Learn CSS — Flexbox](https://web.dev/learn/css/flexbox)
- [MDN: Basic concepts of flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox)
- [MDN: CSS Flexible Box Layout（模块首页）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout)
- [W3C: CSS Flexible Box Layout Module Level 1](https://www.w3.org/TR/css-flexbox-1/)

## 幻灯片地址

<a href="/SlideStack/css-flexbox-slide/" target="_blank">CSS Flexbox 弹性布局</a>
