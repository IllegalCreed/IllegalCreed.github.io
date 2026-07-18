---
layout: doc
outline: [2, 3]
---

# 虚拟化原理与三库用法

> 基于 TanStack Virtual v3 / react-window v2 / vue-virtual-scroller v3 官方文档编写

## 速查

- **原理**：只渲染 `可见区 + overscan` 的 DOM，用绝对定位 + `transform`/`top` 还原滚动位置
- **必备 CSS**：父 `overflow:auto` + 固定高度 + `position:relative`；子 `position:absolute` + `translateY(start)`
- **TanStack 三件套**：`count` + `getScrollElement` + `estimateSize`；实例取 `getVirtualItems()` / `getTotalSize()` / `scrollToIndex()`
- **estimateSize 取最大值**：动态测量时估大不估小，避免首屏批量修正跳动
- **getItemKey 用稳定 id**：动态测量 / 增删 / 反转流场景绝不能用 `index` 当 key
- **measureElement + data-index**：动态测量靠这个 ref 回调挂载 `ResizeObserver`
- **react-window v2**：`List` + `rowComponent` + `rowCount` + `rowHeight` + `rowProps`；动态用 `useDynamicRowHeight`
- **vue-virtual-scroller**：等高 `RecycleScroller`，变高 `DynamicScroller` + `DynamicScrollerItem`（必传 `size-dependencies`），**必须 import CSS**
- **反转流 / 聊天**：TanStack v3 用 `anchorTo:'end'` + `followOnAppend` + `scrollEndThreshold`
- **何时不该虚拟化**：小列表、表格内搜索、需要全文可访问（屏幕阅读器读不到隐藏项）等

## 虚拟化核心原理

虚拟化的几何模型只有三步：

1. **计算可见窗口**：根据 `scrollTop`、视口高度 `H`、`itemSize`（或测量缓存），算出 `[startIndex, endIndex]`
2. **加上 overscan 缓冲**：上下各扩展 `overscan` 行（默认 1~3 行或 ~200px），消除快速滚动时的白屏闪烁
3. **绝对定位渲染**：父容器 `position:relative` + 用 `getTotalSize()` 撑总高；子项 `position:absolute` + `transform:translateY(vi.start)` 落位

```text
scrollTop: 1200    itemSize: 40    viewport H: 480    overscan: 4
可见窗口：[scrollTop/itemSize, (scrollTop+H)/itemSize] = [30, 42]
加上 overscan：渲染 [26, 46] 共 21 个 DOM 节点（而非全量 10 万）
```

### 等高 vs 动态

| 维度 | 等高（FixedSize / RecycleScroller） | 动态（Variable / DynamicScroller） |
| --- | --- | --- |
| **index → offset** | O(1)：`i * itemSize` | O(n) 或 O(log n)：依赖测量缓存前缀和 |
| **首屏** | 一次到位 | 测量后才精确，可能有跳动 |
| **向上滚动** | 平滑 | 可能因新测量结果触发尺寸修正，产生跳动 |
| **API 复杂度** | 一个数字 `itemSize` | `measureElement` / `size-dependencies` + 缓存 |
| **推荐场景** | 已知等高（通讯录行、表格行） | 内容高低不齐（评论、富文本） |

> **能等高就等高**。动态测量不只是「多算一个 offset」，还涉及 `ResizeObserver` 回调时序、向上滚动时的位置纠正（TanStack 的 `shouldAdjustScrollPositionOnItemSizeChange`）等边缘问题。

## TanStack Virtual：useVirtualizer

### 必填选项

| 选项 | 说明 |
| --- | --- |
| `count` | 列表总条数 |
| `getScrollElement` | 返回滚动父元素的函数（ref.current） |
| `estimateSize` | `() => number`，返回初始预估行高（动态测量时取接近最大值） |

### 常用可选

| 选项 | 默认 | 用途 |
| --- | --- | --- |
| `overscan` | 1 | 上下各预渲染的行数（快速滚动白屏时调大） |
| `horizontal` | false | 横向滚动列表 |
| `getItemKey` | `index` | 返回稳定唯一 key（动态测量 / 增删必填） |
| `gap` | 0 | 行间距 |
| `lanes` | 1 | 多列 / 瀑布流（横向并排 lanes 列） |
| `paddingStart` / `paddingEnd` | 0 | 内边距参与计算 |
| `initialRect` | — | SSR 或首次测量前给一个初始尺寸 |

### 实例方法

| 方法 | 用途 |
| --- | --- |
| `getVirtualItems()` | 当前应渲染的虚拟项数组（含 `index`、`start`、`size`、`key`） |
| `getTotalSize()` | 列表总尺寸（撑滚动条 / 占位高度） |
| `scrollToIndex(i, { align })` | 跳到第 i 项，`align` 支持 `'start' \| 'center' \| 'end' \| 'auto'` |
| `scrollToOffset(px, { align })` | 按像素跳 |
| `scrollToEnd()` | 跳到底部（聊天初始定位常用） |
| `measure()` | 手动触发整体重测 |
| `resizeItem(i, size)` | 手动指定某项尺寸（不能与同 index 的 measureElement 同时用） |

### 完整等高示例

参考 [入门](../getting-started.md#最小可运行示例-tanstack-virtual)。

### 动态测量：measureElement + estimateSize 取最大值

```tsx
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 120, // 取「接近最大值」而非 0，避免首屏批量修正
  overscan: 4,
  getItemKey: (i) => items[i].id, // 稳定 id
});

return (
  <div ref={parentRef} style={{ height: 480, overflow: "auto", position: "relative" }}>
    <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
      {rowVirtualizer.getVirtualItems().map((vi) => (
        <div
          key={vi.key}
          data-index={vi.index} // measureElement 靠这个属性识别
          ref={rowVirtualizer.measureElement} // 自动挂 ResizeObserver
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${vi.start}px)`,
          }}
        >
          {items[vi.index].content}
        </div>
      ))}
    </div>
  </div>
);
```

> **为什么 estimateSize 取接近最大值？** 估小时，首屏渲染的几十个项位置都偏小，`ResizeObserver` 实测后批量向上修正位置，整列跳动明显。估大时虽然初始间隙偏大，但修正方向一致，肉眼不易察觉。

### 隐藏列表防测量归零：useCachedMeasurements

当虚拟化列表被 `display:none`（如切 Tab、Modal 关闭）时，`ResizeObserver` 会把所有项测成 0，还原后整列重测 + 布局抖动。TanStack 提供 `useCachedMeasurements`：

```tsx
const rowVirtualizer = useVirtualizer({
  // ... 其他选项
  useCachedMeasurements: true, // 防止隐藏时测量归零
});
```

### 反向滚动 / 聊天流：anchorTo + followOnAppend

聊天与日志场景的特点：新消息从底部追加，用户可能正在看历史。默认 `anchorTo:'start'` 会让新消息把当前可见项顶出视口。TanStack v3 的反转流组合：

```tsx
const rowVirtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60,
  getItemKey: (i) => messages[i].id,
  anchorTo: "end", // 锚定视口底端
  followOnAppend: true, // 追加新消息时自动滚到底（用户滚到历史时则不抢）
  scrollEndThreshold: 30, // 距底 30px 内才算「在底端」
});
```

> 配合 `getDistanceFromEnd()` / `isAtEnd()` 可做「下拉加载更多」与「新消息提示」。

## react-window：v1 vs v2

react-window 在 v2 做了「最小破坏性变更」的大版本升级：**ResizeObserver 成为基线、API 围绕 List/Grid 重构、自动 memo 与自动 sizing、双向 overscan**。v1 的 `FixedSizeList` / `VariableSizeList` / `FixedSizeGrid` / `VariableSizeGrid` 在旧项目广泛存在，官方维护 v1 兼容文档（`react-window-v1.vercel.app`），但新项目应直接上 v2。

### v1 与 v2 对比

| 维度 | v1（FixedSizeList / VariableSizeList） | v2（List / Grid） |
| --- | --- | --- |
| **核心组件** | `FixedSizeList` / `VariableSizeList` / Grid | `List` / `Grid` |
| **行尺寸** | `itemSize: number \| (i) => number` | `rowHeight: number \| pct \| fn \| 动态缓存` |
| **行渲染** | `children` render-prop | `rowComponent` + `rowProps` |
| **动态测量** | 手动调 `resetAfterIndex` | `useDynamicRowHeight` hook |
| **自动 memo** | 需手动 `React.memo` | 内置自动 memo（禁手写） |
| **ResizeObserver** | 可选 | **基线**（默认开启） |

### v2 必填 props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `rowComponent` | `React.ComponentType<{ index, style, data }>` | 渲染单行的组件 |
| `rowCount` | `number` | 总行数 |
| `rowHeight` | `number \| string \| (i) => number \| DynamicCache` | 行高 |
| `rowProps` | `object` | 透传给 `rowComponent` 的额外数据（必填，可为空对象 `{}`） |

### v2 动态行高：useDynamicRowHeight

```tsx
import { List, useDynamicRowHeight } from "react-window";

function Row({ index, style, data }) {
  const item = data[index];
  return (
    <div style={style}>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </div>
  );
}

export function MyList({ items }: { items: Item[] }) {
  const rowHeight = useDynamicRowHeight(); // 测量缓存

  return (
    <List
      rowCount={items.length}
      rowHeight={rowHeight}
      rowComponent={Row}
      rowProps={items} // 即便空对象也必填
      height={480}
      width="100%"
    />
  );
}
```

### v1（旧项目）简表

| 组件 | 用途 |
| --- | --- |
| `FixedSizeList` | 等高一维列表（性能最好） |
| `VariableSizeList` | 变高一维列表（`itemSize` 是函数，需手动 `resetAfterIndex`） |
| `FixedSizeGrid` / `VariableSizeGrid` | 等高 / 变高的二维网格 |

> **v1 → v2 迁移要点**：`FixedSizeList` 不再是主推；新项目直接 `List` + `useDynamicRowHeight`。v1 仅维持兼容，不会拿到 v2 的新特性（自动 memo、双向 overscan、ResizeObserver 基线）。

## vue-virtual-scroller

Vue 3.3+ 的虚拟化首选。组件式 API，开箱即用，但**必须 `import 'vue-virtual-scroller/index.css'`**，否则定位全乱。

### 两大组件：RecycleScroller vs DynamicScroller

| 维度 | RecycleScroller | DynamicScroller |
| --- | --- | --- |
| **场景** | 已知等高 / 接近等高 | 动态高度 |
| **DOM 复用** | recycle（复用 DOM 节点） | 测量 + 缓存 |
| **必填** | `items`、`itemSize` | `items`、`minItemSize` + `DynamicScrollerItem` 包装 |
| **键值** | `keyField` 默认 `'id'` | 同上 |
| **性能** | 最优（O(1) 计算） | 略低（需测量） |

### RecycleScroller 关键 props

| Prop | 默认 | 说明 |
| --- | --- | --- |
| `items` | — | 列表数据 |
| `itemSize` | — | 等高模式行高 |
| `keyField` | `'id'` | 稳定键字段（也支持 `(item, index) => key`） |
| `minItemSize` | — | 最小行高（动态测量基准） |
| `buffer` | `200` | 上下缓冲像素（对应 overscan） |
| `prerender` | `0` | 首屏预渲染条数（SSR 友好） |
| `pageMode` | `false` | 用 window 作滚动元素 |
| `listClass` / `itemClass` | — | 自定义样式钩子 |

### RecycleScroller 示例

```vue
<template>
  <RecycleScroller
    class="scroller"
    :items="items"
    :item-size="40"
    key-field="id"
    :buffer="200"
    v-slot="{ item }"
  >
    <div class="row">{{ item.text }}</div>
  </RecycleScroller>
</template>

<script setup lang="ts">
import "vue-virtual-scroller/index.css"; // 必须！
import { RecycleScroller } from "vue-virtual-scroller";
import { ref } from "vue";

const items = ref(
  Array.from({ length: 100000 }, (_, i) => ({ id: i, text: `行 ${i}` }))
);
</script>

<style scoped>
.scroller {
  height: 480px;
}
.row {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}
</style>
```

### DynamicScroller + DynamicScrollerItem

```vue
<template>
  <DynamicScroller
    :items="items"
    :min-item-size="60"
    key-field="id"
    v-slot="{ item, active }"
  >
    <DynamicScrollerItem
      :item="item"
      :active="active"
      :data-index="item.id"
      :size-dependencies="[item.title, item.body]"
    >
      <div class="row">
        <h3>{{ item.title }}</h3>
        <p>{{ item.body }}</p>
      </div>
    </DynamicScrollerItem>
  </DynamicScroller>
</template>
```

> **`size-dependencies` 必须列出真正影响尺寸的字段**。把无关字段塞进去会过度触发重排；漏写则在内容变化时不重测、导致错位。常见错误是直接传整个 `item` 对象，应该只列字段（如 `[item.title, item.body]`）。

### Headless Composables（Vue 3.3+ 泛型）

`useRecycleScroller<T>` / `useDynamicScroller<T>` / `useWindowScroller<T>` / `useTableColumnWidths`（用于 `<table>` 自定义布局）。组件式不满足时降级到 headless，与 TanStack 思路一致。

## 反模式与陷阱

### 共同反模式

| 反模式 | 后果 | 正确做法 |
| --- | --- | --- |
| **漏设 `overflow:auto` / 固定高度** | 子项 absolute 定位后无滚动容器，直接溢出不可滚 | 父容器必有 `height` + `overflow:auto` |
| **把 key 设成 `index`** | 增删 / 反转流后状态错配、输入框值乱跳 | 用稳定唯一 `id`（`getItemKey` / `keyField`） |
| **小列表强行虚拟化** | 引入样板代码与测量开销，得不偿失 | DOM < 500 直接 `v-for` / `map` |
| **动态高度用错组件** | 尺寸错算、滚动位置错乱 | 变高用 `DynamicScroller` / `VariableSizeList` / `measureElement` |

### TanStack 专属

| 反模式 | 后果 | 正确做法 |
| --- | --- | --- |
| **`estimateSize` 返回 0** | 首屏位置全 0，渲染后批量跳动 | 取接近最大值 |
| **动态测量场景漏 `getItemKey`** | 增删后状态错配 | 必返回稳定 id |
| **同时 `measureElement` 与 `resizeItem` 改同一 index** | 官方明确警告：不可预测行为 | 二者只用于不同 index |
| **`directDomUpdates` 开启后又手写 `transform`** | 位置被覆盖产生冲突 | 开启后子项只设 `position:absolute` + `top:0`，主轴定位交给虚拟器 |
| **`useCachedMeasurements` 没开** | 列表被 `display:none` 后还原时整列重测 + 抖动 | 切 Tab / Modal 场景开启 |

### react-window 专属

| 反模式 | 后果 | 正确做法 |
| --- | --- | --- |
| **v1 写法直接当 v2 用** | API 不匹配，编译报错或行为异常 | v2 用 `List` + `rowComponent`，v1 用 `FixedSizeList` |
| **`rowProps` 漏写（即便空对象）** | 必填 prop 缺失告警 | 显式传 `{}` |
| **v2 又手写 `React.memo`** | 与自动 memo 冲突或失效 | v2 内置，别手动 memo |

### vue-virtual-scroller 专属

| 反模式 | 后果 | 正确做法 |
| --- | --- | --- |
| **漏 `import 'vue-virtual-scroller/index.css'`** | 列表定位全乱、肉眼可见错位 | 入口或组件内必 import |
| **Vue 2 项目装 v3 包** | 不兼容，运行时报错 | Vue 2 用 v1 分支 |
| **`DynamicScrollerItem` 漏 `size-dependencies`** | 内容变化时不重测，错位 | 列出影响尺寸的字段 |
| **`size-dependencies` 传整对象** | 过度触发重排 | 只列字段 |

## 何时不该虚拟化

虚拟化不是银弹。下列场景应优先考虑替代方案：

- **列表很小（< 200~500 行）**：直接 `v-for` / `map`，更简单也更快
- **必须全文可访问**：屏幕阅读器可能只读到当前可见项；如果业务要求「Ctrl+F 浏览器搜索能搜到」，虚拟化会让隐藏项搜不到
- **`<select>` / 下拉树很小**：直接用原生或 Element Plus / Naive UI 即可，虚拟化版反而样式受限
- **列表项高度差异巨大**：测量开销可能抵消虚拟化收益
- **打印 / 全文检索**：隐藏项不进 DOM，PDF 导出与全文搜索会缺内容

> 替代思路：分页（避免一次性大数据）、按需展开（手风琴）、懒加载图片 / 组件（`IntersectionObserver`）。这些可与虚拟化叠加，但单看场景很多不需要虚拟化。

## 下一步

- [参考](../reference.md)：三库核心 API 速查表、版本现状、官方资源链接
