---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 TanStack Virtual v3 / react-window v2 / vue-virtual-scroller v3 官方文档编写

## 速查

- **何时虚拟化**：列表 DOM 节点 > 500~1000、首屏或滚动明显卡顿才上；小列表直接 `v-for` / `map`
- **三库定位**：TanStack Virtual（headless / 跨框架）｜ react-window（React 组件式）｜ vue-virtual-scroller（Vue 组件式）
- **核心套路**：父容器 `overflow:auto` + 固定高度 + `position:relative` → 内部用 `getTotalSize()` 撑总高 → 子项 `position:absolute` + `transform:translateY()`
- **等高优先**：能用固定 `itemSize` / `rowHeight` 就别用动态测量，O(1) 计算 vs 维护测量缓存
- **TanStack 必填三件套**：`count` + `getScrollElement` + `estimateSize(() => px)`，实例取 `getVirtualItems()`
- **react-window v2 必填**：`rowComponent` + `rowCount` + `rowHeight` + `rowProps`（v1 用 `FixedSizeList`）
- **vue-virtual-scroller**：等高 `RecycleScroller`，变高 `DynamicScroller` + `DynamicScrollerItem`，**必须 import CSS**
- **键值复用坑**：`getItemKey` / `keyField` 用稳定 `id` 而非 `index`，尤其动态测量与增删场景
- **动态测量**：estimateSize 取接近**最大值**，避免首屏批量修正跳动

## 什么是虚拟化

虚拟化（虚拟滚动 / virtual scrolling / windowing）的本质是：**只把当前视口能看到的 + 上下少量 overscan 缓冲区的列表项渲染成 DOM**，其他项完全不进 DOM 树。滚动时通过几何计算（基于 `itemSize` 与 `scrollTop`）即时换出可见项。

```text
┌──────────────── 滚动容器（视口高度 H）────────────────┐
│  ↑ overscan 上缓冲（如 1~3 行）                       │
│  ─────────── 可见区（H / itemSize 行）───────────    │  ← 只这部分真实渲染
│  ↓ overscan 下缓冲（如 1~3 行）                       │
└──────────────────────────────────────────────────────┘
                       ↑ getTotalSize() 撑出总高
```

> 用 N=10 万条数据举例：传统 `v-for` 会创建 10 万个 DOM 节点，虚拟化后真实节点往往只有 10~30 个——两个数量级的差距。

## 为何需要虚拟化：DOM 数量瓶颈

浏览器渲染开销与 DOM 节点数强相关。当节点数过千，会出现：

- **首屏渲染慢**：解析 HTML / 创建 DOM / 计算布局 / 绘制，每一步都随节点数线性甚至超线性增长
- **滚动掉帧**：每次滚动触发重排，节点越多越卡，FPS 跌破 60 / 30
- **内存吃紧**：每个 DOM 节点都是堆内存对象，10 万节点轻松占用数百 MB，移动端直接 OOM
- **样式匹配变慢**：CSS 选择器匹配复杂度随节点数上升

> 经验阈值：复杂列表项（含图片 / 嵌套元素）> 500 行、简单列表项 > 2000 行，就要警惕 DOM 数量瓶颈。

虚拟化把节点数从 `O(N)` 降到 `O(可见 + overscan)`，让 10 万条数据的滚动表现逼近 100 条。

## 三库速览

| 维度 | TanStack Virtual | react-window | vue-virtual-scroller |
| --- | --- | --- | --- |
| **当前版本** | v3（3.14.x） | v2（2.2.x） | v3（3.0.x） |
| **形态** | headless（hooks / 类） | React 组件式 | Vue 组件式 |
| **跨框架** | ✅ React/Vue/Svelte/Solid… | ❌ 仅 React | ❌ 仅 Vue 3.3+ |
| **核心 API** | `useVirtualizer` | `List` / `Grid` | `RecycleScroller` / `DynamicScroller` |
| **动态测量** | `measureElement` + 缓存 | `useDynamicRowHeight` | `DynamicScroller` + `size-dependencies` |
| **反转流（聊天）** | `anchorTo:'end'` + `followOnAppend` | 需自行扩展 | 需自行扩展 |
| **心智成本** | 中（要手写定位 / 键值） | 低（开箱即用） | 低（开箱即用） |
| **样式灵活度** | 高（headless） | 中（受组件结构约束） | 中 |

**怎么选？**

- 想要**最大控制力 / 跨框架 / 自定义渲染**：选 **TanStack Virtual**
- React 项目想要**开箱即用、最少样板**：选 **react-window**
- Vue 3 项目想要**组件式 + 自动测量**：选 **vue-virtual-scroller**
- 老项目（Vue 2 / react-window v1）按既有方案继续，必要时再迁移

## 安装

```bash
# TanStack Virtual（按框架挑一个）
pnpm add @tanstack/react-virtual
pnpm add @tanstack/vue-virtual
pnpm add @tanstack/svelte-virtual

# react-window v2
pnpm add react-window

# vue-virtual-scroller v3（Vue 3.3+）
pnpm add vue-virtual-scroller
```

> vue-virtual-scroller 是 **ESM only**，需在入口或组件内 `import 'vue-virtual-scroller/index.css'`，否则定位错乱。

## 最小可运行示例（TanStack Virtual）

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

// 等高长列表的最小虚拟化示例
export function MyList({ items }: { items: { id: string; text: string }[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  // 创建虚拟器：count、getScrollElement、estimateSize 必填
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // 等高 40px
    overscan: 4, // 上下各预渲染 4 行
  });

  return (
    <div
      ref={parentRef}
      style={{ height: 480, overflow: "auto", position: "relative" }}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(), // 撑出总高度
          position: "relative",
          width: "100%",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((vi) => (
          <div
            key={items[vi.index].id} // 稳定 id，绝不用 index
            data-index={vi.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vi.start}px)`,
            }}
          >
            {items[vi.index].text}
          </div>
        ))}
      </div>
    </div>
  );
}
```

> 关键四步：①父容器固定高度 + `overflow:auto`；②内容器用 `getTotalSize()` 撑高；③子项 `position:absolute` + `transform:translateY(start)`；④`getItemKey` 隐式通过 `key={item.id}` 提供稳定键。

## 下一步

- [虚拟化原理与三库用法](./guide-line/principle.md)：原理深入 + TanStack / react-window / vue-virtual-scroller 各自用法 + 动态测量 + 反向滚动 + 反模式
- [参考](./reference.md)：三库核心 API 速查表、版本现状、官方资源链接
