---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 TanStack Virtual v3 / react-window v2 / vue-virtual-scroller v3 官方文档编写

## 速查

- **三库版本**（2026-07）：TanStack Virtual v3.14.x ｜ react-window v2.2.x ｜ vue-virtual-scroller v3.0.x
- **TanStack 核心**：`useVirtualizer({ count, getScrollElement, estimateSize, overscan?, getItemKey? })` → `getVirtualItems()` / `getTotalSize()` / `scrollToIndex()`
- **react-window v2 核心**：`<List rowCount rowHeight rowComponent rowProps height width />` + `useDynamicRowHeight`
- **vue-virtual-scroller 核心**：`<RecycleScroller items itemSize keyField buffer />` ｜ `<DynamicScroller items minItemSize>` + `<DynamicScrollerItem size-dependencies />`
- **共同 CSS 套路**：父 `overflow:auto` + 固定高 + `position:relative`；子 `position:absolute` + `transform:translateY(start)`
- **键值复用**：`getItemKey` / `keyField` 必用稳定 id，**不要用 index**
- **动态测量**：TanStack `measureElement` + estimateSize 取大；react-window `useDynamicRowHeight`；vue-virtual-scroller `DynamicScrollerItem` + `size-dependencies`
- **反转流**：TanStack v3 `anchorTo:'end'` + `followOnAppend` + `scrollEndThreshold`

## TanStack Virtual API 速查

### useVirtualizer 选项

| 选项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `count` | `number` | — | 总条数（必填） |
| `getScrollElement` | `() => HTMLElement \| null` | — | 滚动父元素（必填） |
| `estimateSize` | `() => number` | — | 预估行高（必填，动态取最大值） |
| `overscan` | `number` | 1 | 上下缓冲行数 |
| `horizontal` | `boolean` | false | 横向滚动 |
| `getItemKey` | `(i) => Key` | `index` | 稳定键（动态 / 增删必填） |
| `gap` | `number` | 0 | 行间距 |
| `lanes` | `number` | 1 | 多列 / 瀑布 |
| `paddingStart` / `paddingEnd` | `number` | 0 | 内边距 |
| `scrollMargin` | `number` | 0 | 滚动容器内嵌套时的偏移 |
| `initialRect` | `{ width, height }` | — | SSR / 首测前初始尺寸 |
| `initialOffset` | `{ top, left }` | — | 初始滚动位置 |
| `isRtl` | `boolean` | false | RTL 布局 |
| `rangeExtractor` | `(range) => number[]` | — | 自定义渲染范围（粘性 header 等） |
| `useCachedMeasurements` | `boolean` | false | 防 `display:none` 测量归零 |
| `isScrollingResetDelay` | `number` | 150 | `isScrolling` 复位延迟（ms） |
| `useScrollendEvent` | `boolean` | — | 用原生 `scrollend` 事件 |

### TanStack v3 反转流 / 聊天相关

| 选项 | 说明 |
| --- | --- |
| `anchorTo` | `'start' \| 'end'`，聊天 / 日志反转流用 `'end'` |
| `followOnAppend` | 追加新项时是否自动跟随到底 |
| `scrollEndThreshold` | 距底多少 px 内才算「在底端」 |
| `shouldAdjustScrollPositionOnItemSizeChange` | 控制向上滚动时是否纠正位移 |

### TanStack React 特有

| 选项 / 方法 | 说明 |
| --- | --- |
| `useWindowVirtualizer(options)` | 用浏览器 `window` 作滚动元素 |
| `useFlushSync`（默认 true） | React 19 滚动告警时可关 |
| `directDomUpdates` | 跳过 React 重渲染，直接写 DOM（高频更新） |
| `directDomUpdatesMode` | `'transform' \| 'position'`，定位策略 |

### Virtualizer 实例方法

| 方法 | 用途 |
| --- | --- |
| `getVirtualItems()` | 当前应渲染的虚拟项数组 |
| `getTotalSize()` | 列表总尺寸 |
| `scrollToIndex(i, { align, behavior })` | 跳到第 i 项 |
| `scrollToOffset(px, { align, behavior })` | 按像素跳 |
| `scrollToEnd()` | 跳到底部 |
| `getDistanceFromEnd()` / `isAtEnd()` | 距底距离 / 是否到底（下拉加载用） |
| `measure()` | 整体重测 |
| `measureElement(node)` | ref 回调，挂 `ResizeObserver` |
| `resizeItem(i, size)` | 手动指定尺寸 |
| `takeSnapshot()` | 拍测量快照（恢复滚动位置） |

### 框架适配器包

| 包 | 框架 |
| --- | --- |
| `@tanstack/react-virtual` | React |
| `@tanstack/vue-virtual` | Vue 3 |
| `@tanstack/svelte-virtual` | Svelte |
| `@tanstack/solid-virtual` | Solid |
| `@tanstack/lit-virtual` | Lit |
| `@tanstack/angular-virtual` | Angular |
| `@tanstack/marko-virtual` | Marko |

## react-window API 速查

### v2：List 与 Grid 必填 props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `rowComponent` / `cellComponent` | `ComponentType` | 渲染单行 / 单元格的组件 |
| `rowCount` / `columnCount` | `number` | 行 / 列数 |
| `rowHeight` / `columnWidth` | `number \| pct \| fn \| DynamicCache` | 行高 / 列宽 |
| `rowProps` / `cellProps` | `object` | 透传给 rowComponent 的额外数据（**必填**，可为 `{}`） |

### v2 可选 props

| Prop | 默认 | 说明 |
| --- | --- | --- |
| `overscanCount` | — | 双向预渲染行数 |
| `defaultHeight` / `defaultWidth` | — | SSR 初始尺寸 |
| `tagName` | `div` | 容器标签 |
| `onRowsRendered` / `onCellsRendered` | — | 渲染回调 |
| `onResize` | — | 容器尺寸变化回调 |

### v2 hooks

| Hook | 用途 |
| --- | --- |
| `useDynamicRowHeight()` | 动态行高测量缓存，传给 `rowHeight` |
| `useListRef()` / `useGridRef()` | TS 友好的 ref，拿到 imperative API |
| `useListCallbackRef()` | 回调式 ref |

### v1：FixedSize / Variable 系列（旧项目）

| 组件 | 用途 |
| --- | --- |
| `FixedSizeList` | 等高一维列表 |
| `VariableSizeList` | 变高一维（`itemSize` 函数 + 手动 `resetAfterIndex`） |
| `FixedSizeGrid` / `VariableSizeGrid` | 等高 / 变高二维 |

> v1 仍维护但不再拿新特性；v1 文档在 `react-window-v1.vercel.app`，与 v2 共存。

## vue-virtual-scroller API 速查

### RecycleScroller（等高 / 复用 DOM）

| Prop | 默认 | 说明 |
| --- | --- | --- |
| `items` | — | 列表数据 |
| `itemSize` | — | 等高行高 |
| `keyField` | `'id'` | 稳定键字段（或 `(item, index) => key`） |
| `minItemSize` | — | 最小行高 |
| `sizeField` | `'size'` | 从 item 字段读尺寸 |
| `buffer` | 200 | 上下缓冲像素（对应 overscan） |
| `prerender` | 0 | 首屏预渲染条数（SSR 友好） |
| `pageMode` | false | 用 window 作滚动元素 |
| `listClass` / `listTag` | — | 容器样式 / 标签 |
| `itemClass` / `itemTag` | — | 项样式 / 标签 |

### DynamicScroller（动态测量）

| Prop | 默认 | 说明 |
| --- | --- | --- |
| `items` | — | 列表数据 |
| `minItemSize` | — | 最小行高（测量基准，必填） |
| `keyField` | `'id'` | 稳定键字段 |
| `buffer` | 200 | 上下缓冲像素 |

### DynamicScrollerItem（必须包装在 DynamicScroller 内）

| Prop | 说明 |
| --- | --- |
| `item` | 当前数据项 |
| `active` | 来自作用域插槽（是否在可见区） |
| `data-index` | 序号 |
| `size-dependencies` | 影响尺寸的字段数组（如 `[item.title, item.body]`） |

### Headless Composables（Vue 3.3+ 泛型）

| Composable | 用途 |
| --- | --- |
| `useRecycleScroller<T>()` | RecycleScroller 的 headless 版本 |
| `useDynamicScroller<T>()` | DynamicScroller 的 headless 版本 |
| `useWindowScroller<T>()` | 页面级滚动的 headless 版本 |
| `useTableColumnWidths()` | `<table>` 自定义布局的列宽测量 |

### 安装注意事项

- 仅支持 **Vue 3.3+**（Vue 2 用 v1 分支）
- **ESM only**，没有 CommonJS 入口
- **必须** `import 'vue-virtual-scroller/index.css'`，否则定位错乱

## 共同必备 CSS 套路

```css
/* 父容器：必须固定高度 + overflow:auto + position:relative */
.scroll-parent {
  height: 480px;
  overflow: auto;
  position: relative;
}

/* 内部占位：getTotalSize() 撑出总高 */
.scroll-inner {
  position: relative;
  width: 100%;
}

/* 子项：绝对定位 + transform 落位 */
.scroll-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  /* transform: translateY(...) 由 JS 内联写入 */
}
```

> TanStack 默认推荐 `transform: translateY()`；react-window 通过 `style` prop 透传；vue-virtual-scroller 内部已处理。无论哪种实现，几何模型一致。

## 版本现状（2026-07）

| 库 | 当前主版本 | 重要变化 |
| --- | --- | --- |
| **TanStack Virtual** | v3（3.14.x） | 跨框架统一核心；新增 `anchorTo` / `followOnAppend` / `directDomUpdates` / `takeSnapshot`，面向聊天 / 反转流与高频更新 |
| **react-window** | v2（2.2.x） | ResizeObserver 基线、API 围绕 `List` / `Grid` 重构、自动 memo 与自动 sizing、双向 overscan；v1 仍维护兼容 |
| **vue-virtual-scroller** | v3（3.0.x，2026-05 发布 3.0.4） | 仅 Vue 3.3+、ESM only、提供组件式与 headless composables 双 API；Vue 2 用 v1 分支 |

> 三者均处于**活跃维护**状态。新项目按框架选其一即可。

## 选型决策树

```text
列表 DOM 节点数 > 500~1000 且首屏 / 滚动卡顿？
├── 否 → 直接 v-for / map，不虚拟化
└── 是
    ├── React 项目
    │   ├── 需要最大控制力 / 跨框架迁移 → TanStack Virtual
    │   └── 想要最少样板、开箱即用 → react-window v2
    ├── Vue 3.3+ 项目
    │   ├── 需要最大控制力 / 跨框架迁移 → TanStack Virtual
    │   └── 想要组件式、自动测量 → vue-virtual-scroller
    └── 其他框架（Svelte/Solid/Lit/Angular…） → TanStack Virtual（唯一广覆盖选项）
```

## 官方资源

- TanStack Virtual 文档：[https://tanstack.com/virtual/latest/docs/introduction](https://tanstack.com/virtual/latest/docs/introduction)
- TanStack Virtual Virtualizer API：[https://tanstack.com/virtual/latest/docs/api/virtualizer](https://tanstack.com/virtual/latest/docs/api/virtualizer)
- TanStack Virtual GitHub：[https://github.com/TanStack/virtual](https://github.com/TanStack/virtual)
- react-window v2 文档：[https://react-window.vercel.app/](https://react-window.vercel.app/)
- react-window v1 文档（兼容）：[https://react-window-v1.vercel.app/](https://react-window-v1.vercel.app/)
- react-window GitHub：[https://github.com/bvaughn/react-window](https://github.com/bvaughn/react-window)
- vue-virtual-scroller 指南：[https://vue-virtual-scroller.netlify.app/guide/](https://vue-virtual-scroller.netlify.app/guide/)
- vue-virtual-scroller GitHub：[https://github.com/Akryum/vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller)
