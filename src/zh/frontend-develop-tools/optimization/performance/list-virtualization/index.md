---
layout: doc
---

# 虚拟化

虚拟化（List Virtualization）是前端长列表性能优化的**核心手段**：当列表数据进入千、万级时，浏览器为每个数据项创建的 DOM 节点会成为渲染瓶颈——绘制、布局、内存全面吃紧。虚拟化的核心思想是「**只渲染可视区 + 一段 overscan 缓冲区的 DOM 节点**」，用绝对定位 + `transform`/`top` 还原滚动位置，从而把 DOM 数量从「数据总量」降到「可见行数」这一常量级别（往往几十个）。2026 年前端主流方案有三：**TanStack Virtual**（headless、跨框架、控制力最强）、**react-window**（React 组件式、开箱即用，已发布 v2 大版本）、**vue-virtual-scroller**（Vue 组件式，RecycleScroller / DynamicScroller 双形态）。三者均处于活跃维护状态，是中文开发者绕不开的工具集。

## 简介

长列表场景——通讯录、聊天记录、日志面板、商品流、表格、Tree/Select 下拉——天然容易堆出成千上万个 DOM 节点。浏览器一次排版与重绘的开销与 DOM 节点数强相关，超过数百个复杂节点后滚动 FPS 会肉眼可见地掉。**虚拟化通过几何计算（index ↔ offset）+ 绝对定位把可见窗口外的节点全部不渲染或回收**，让 10 万条数据的滚动表现与 100 条几乎一致。理解虚拟化 = 理解「为什么 DOM 多了会卡」+「虚拟化如何用 O(可见) 替代 O(总数)」。

## 评价

**优点**

- **降 DOM 数量级**：从 O(N) 降到 O(可见行数 + overscan)，常量级开销
- **首屏与滚动双优**：首屏渲染少、滚动时只更新少量节点
- **内存友好**：少建 DOM = 少占堆内存，移动端收益尤其明显
- **生态成熟**：三库覆盖 React / Vue / Svelte / Solid 等主流框架，方案稳定
- **跨框架可选**：TanStack Virtual headless，react-window 偏 React，vue-virtual-scroller 偏 Vue

**缺点**

- **不是银弹**：小列表用 v-for / map 反而更简单，强行虚拟化徒增样板代码
- **动态高度复杂**：变高列表需要测量 + 缓存，向上滚动易出现尺寸修正跳动
- **样式受限**：子项多采用绝对定位，需要内部布局适配，部分 CSS（如 sticky）需特殊处理
- **辅助技术兼容**：屏幕阅读器可能只读到当前可见项，需要正确设置 `aria-setsize` / `aria-posinset`
- **调试心智负担**：DOM 节点动态创建销毁，断点与 DOM 检查需要适配

## 核心能力

- **只渲染可见 + overscan**：根据滚动容器视口大小与 `itemSize` 估算窗口，仅渲染命中区间的项
- **绝对定位还原位置**：父容器用 `position:relative` + `getTotalSize()` 撑总高，子项 `position:absolute` + `transform:translateY()` 落位
- **等高 / 动态双模**：等高列表用 `itemSize` 数字即可（O(1) 计算），变高列表通过 `ResizeObserver` 测量并缓存
- **滚动到指定项**：`scrollToIndex(i, { align })` / 命令式 ref，支持表格「跳到第 N 行」交互
- **跨框架适配**：TanStack Virtual 一套核心 + 各框架适配器，思路可迁移
- **聊天 / 反转流支持**：v3 引入 `anchorTo:'end'` + `followOnAppend`，专为聊天与日志场景设计

## 适用场景

- 通讯录、城市选择器、长聊天记录、日志面板、表格虚拟化（>500 行）
- 商品 / 信息流：无限滚动 + 数据持续追加
- 大型 Select / Tree / Cascader 下拉
- 股票行情、监控大盘：高频更新 + 长列表
- 时间轴、播放列表、待办归档

> 经验阈值：列表 DOM 节点超过 **500~1000**、首屏渲染或滚动明显卡顿时再考虑虚拟化；几十、上百项直接 `v-for` / `map` 即可。

## 文档地址

- [TanStack Virtual 官方文档](https://tanstack.com/virtual/latest/docs/introduction)
- [react-window 官方文档](https://react-window.vercel.app/)
- [vue-virtual-scroller 官方指南](https://vue-virtual-scroller.netlify.app/guide/)

## GitHub地址

- [TanStack Virtual](https://github.com/TanStack/virtual)
- [react-window](https://github.com/bvaughn/react-window)
- [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller)

## 幻灯片地址

<a href="/SlideStack/list-virtualization-slide/" target="_blank">虚拟化</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=668" target="_blank" rel="noopener noreferrer">虚拟化测试题</a>

