---
layout: doc
outline: [2, 3]
---

# DndContext 与核心 Hooks：useDraggable / useDroppable / DragOverlay

> 基于 @dnd-kit/core 6.3.1（npm 实测最新版）· 核于 2026-07

## 速查

- **`DndContext`**：拖拽应用的根组件，通过 React Context 让 `useDraggable`/`useDroppable`/`DragOverlay` 共享内部状态；支持嵌套多个相互独立的 `DndContext`。
- **无障碍相关 props 已收拢**：当前类型定义把 `announcements`/`screenReaderInstructions` 收纳进嵌套的 `accessibility` 对象（还新增了 `container`/`restoreFocus`），区别于早期教程的顶层写法。
- **6.3.x 新增两个过渡态事件**：`onDragPending`（满足 `activationConstraint` 前反复触发）、`onDragAbort`（等待期内提前松手，drag 未真正开始就被中止）。
- **事件对象核心字段**：`active`（被拖拽项，含 `id`/`data`/`rect`）、`over`（当前悬停的可放置项，可能为 `null`）、`delta`（累计位移）、`collisions`（碰撞数组）、`activatorEvent`（原始触发事件）。
- **`useDraggable` 返回值**：`attributes`、`listeners`、`setNodeRef`、`setActivatorNodeRef`、`node`、`transform`、`isDragging`、`active`、`activatorEvent`、`activeNodeRect`、`over`。
- **`useDroppable` 返回值**：`active`、`rect`、`isOver`、`node`、`over`、`setNodeRef`。
- **`transform` 形状**：`{x, y, scaleX, scaleY}`，代表自拖拽开始以来的位移与缩放增量。
- **`CSS.Translate` vs `CSS.Transform`**：`Translate` 只应用位移、忽略缩放；`Transform` 位移 + 缩放都应用；draggable 场景通常用前者。
- **拖拽把手模式**：`setActivatorNodeRef` + `listeners` 绑定到独立节点（如一个图标按钮），而非整个可拖拽元素。
- **`useDraggable`/`useDroppable` 的 `id`**：只需在同类型内唯一，draggable 与 droppable 可以共享同一个 `id`（各自独立存储）。
- **`disabled` 而非条件调用**：Hook 不能放进 `if` 里按需调用，必须始终无条件调用，用 `disabled` 参数控制启停。
- **为什么需要 `DragOverlay`**：直接给拖拽源加 `transform` 会受滚动容器 `overflow` 裁剪、层叠上下文限制；跨容器/虚拟列表场景源节点可能挂载/卸载导致拖拽中断。`DragOverlay` 脱离文档流、相对 viewport 定位，天然规避以上问题。
- **`DragOverlay` 必须始终挂载**：只对内部 `children` 做条件渲染，否则卸载瞬间直接跳变，`dropAnimation` 不生效。
- **`wrapperElement`**：`DragOverlay` 默认包裹元素是 `div`，列表项场景应改成 `ul`，避免无效 DOM 嵌套。
- **`useDndContext()`**：读取当前 `DndContext` 内部状态，用于构建自定义组件，必须在 `DndContext` 内部使用。
- **`useDndMonitor()`**：让子树内任意组件监听全局拖拽事件，无需自己持有/透传 state。

## 一、DndContext：拖拽的根组件

`DndContext` 是整个拖拽应用的根组件，凡是用到 `useDraggable`/`useDroppable`/`DragOverlay` 这些 API 的组件都必须嵌套在它内部。它通过 React Context 让这些 Hook 之间共享内部状态（谁正在被拖拽、悬停在哪个目标上等），也支持在同一棵组件树里嵌套多个**相互独立**的 `DndContext`（各自管理各自的拖拽范围）。

对照 6.3.1 实测的 `.d.ts` 类型定义，`DndContext` 完整 Props 如下：

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 可选，自定义标识 |
| `accessibility` | `{ announcements?, container?, restoreFocus?, screenReaderInstructions? }` | 无障碍相关配置，见下方说明 |
| `autoScroll` | `boolean \| AutoScrollOptions` | 拖到边缘时是否自动滚动容器 |
| `cancelDrop` | `(args: DragEndEvent) => boolean \| Promise<boolean>` | drop 前一票否决，可返回 `Promise` 做异步校验 |
| `collisionDetection` | `CollisionDetection` | 自定义碰撞检测算法 |
| `measuring` | `MeasuringConfiguration` | 自定义 draggable/droppable/dragOverlay 各自的测量函数 |
| `modifiers` | `Modifiers` | 坐标修饰符数组 |
| `sensors` | `SensorDescriptor<any>[]` | 传感器数组 |
| `onDragStart` | `(event: DragStartEvent) => void` | 拖拽开始 |
| `onDragMove` | `(event: DragMoveEvent) => void` | 拖拽移动中 |
| `onDragOver` | `(event: DragOverEvent) => void` | 悬停目标变化 |
| `onDragEnd` | `(event: DragEndEvent) => void` | 拖拽结束（放下） |
| `onDragCancel` | `(event: DragCancelEvent) => void` | 拖拽取消 |
| `onDragPending` | `(event: DragPendingEvent) => void` | 6.3.x 新增，满足 `activationConstraint` 前的等待期内反复触发 |
| `onDragAbort` | `(event: DragAbortEvent) => void` | 6.3.x 新增，等待期内提前松手、drag 未真正开始就被中止 |

> **易错点**：早期教程/部分文档示例把 `announcements`/`screenReaderInstructions` 写成 `DndContext` 的**顶层 prop**，但当前发布的类型定义已将其收纳进嵌套的 `accessibility` 对象（并新增了 `container`/`restoreFocus`）。照抄旧教程的顶层写法会被 TypeScript 类型检查拒绝，写代码前以当前类型定义报错信息为准，这部分的完整用法见[无障碍与实战模式](./accessibility-and-patterns)。

事件对象的核心字段：`active`（当前被拖拽项，含 `id`/`data`/`rect`）、`over`（当前悬停的可放置项，可能为 `null`）、`delta`（自拖拽开始以来的累计位移 `{x, y}`）、`collisions`（当前碰撞数组）、`activatorEvent`（原始触发事件，如真实的 `PointerEvent`）。

```jsx
import { useState } from "react";
import { DndContext } from "@dnd-kit/core";

function App() {
  const [isDropped, setIsDropped] = useState(false);

  function handleDragEnd(event) {
    // event.over 为 null 表示没有落在任何 droppable 上，必须先判空
    if (event.over && event.over.id === "droppable") {
      setIsDropped(true);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {!isDropped ? <Draggable>拖我</Draggable> : null}
      <Droppable>{isDropped ? <Draggable>拖我</Draggable> : "放这里"}</Droppable>
    </DndContext>
  );
}
```

## 二、useDraggable：让元素可以被拖拽

```typescript
interface UseDraggableArguments {
  id: UniqueIdentifier; // 必填，DndContext 内唯一（同类型内）
  data?: Record<string, any>; // 供 modifier / 事件回调 / 自定义 sensor 读取的业务数据
  disabled?: boolean;
  attributes?: { role?: string; roleDescription?: string; tabIndex?: number };
}
// 返回值（6.3.1 实测）：
// { attributes, listeners, setNodeRef, setActivatorNodeRef,
//   node, transform, isDragging, active, activatorEvent, activeNodeRect, over }
```

`id` 只需在**同类型**内唯一——draggable 与 droppable 可以共享同一个 `id`（各自独立存储）。`transform` 形状为 `{x, y, scaleX, scaleY}`，代表自拖拽开始以来的位移与缩放增量。

```jsx
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "draggable",
  });
  const style = {
    // Translate 只应用位移、忽略 scaleX/scaleY；Transform 会同时应用缩放
    transform: CSS.Translate.toString(transform),
  };
  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}
```

> **易错点：`CSS.Translate` 与 `CSS.Transform` 选错**。`Translate` 只应用位移、忽略缩放；`Transform` 位移 + 缩放都应用。draggable 场景通常用 `Translate`，涉及缩放动画的场景才需要 `Transform`，混用会带来意外的缩放效果。

**拖拽把手模式**：把 `listeners` 绑到独立节点（而非整个 draggable），常用于"只有某个图标才能拖动，其余区域可正常点击"的场景：

```jsx
function SortableItem() {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes } = useDraggable({ id: "item" });
  return (
    <div ref={setNodeRef}>
      内容
      <button ref={setActivatorNodeRef} {...listeners} {...attributes}>
        ⠿ 拖动把手
      </button>
    </div>
  );
}
```

> **易错点：用条件语句包裹 `useDraggable`/`useDroppable`**。这两个是 Hook，不能放进 `if` 里按需调用，必须始终无条件调用、用 `disabled` 参数控制启停，否则会违反 React Hooks 规则导致运行时报错。

## 三、useDroppable：定义可放置区域

```typescript
interface UseDroppableArguments {
  id: UniqueIdentifier;
  disabled?: boolean;
  data?: Record<string, any>;
  resizeObserverConfig?: {
    // 实测新增，官方 legacy 页面文字未展开
    disabled?: boolean;
    updateMeasurementsFor?: UniqueIdentifier[]; // 本容器 resize 时需连带重新测量的其它容器
    timeout?: number; // resize 到重新测量之间的防抖
  };
}
// 返回值：{ active, rect, isOver, node, over, setNodeRef }
```

```jsx
import { useDroppable } from "@dnd-kit/core";

function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({ id: props.id });
  const style = { color: isOver ? "green" : undefined };
  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
```

`resizeObserverConfig` 用于控制容器尺寸变化时哪些其它容器需要连带重新测量（多容器场景常用），以及 resize 到重新测量之间的防抖 `timeout`，避免频繁 resize 触发大量重新计算。

## 四、DragOverlay：为什么需要，怎么用

**为什么需要**：直接对被拖拽源应用 `transform` 会受滚动容器 `overflow` 裁剪、层叠上下文限制；拖拽跨容器时源节点可能挂载/卸载；虚拟列表滚动时源节点可能被卸载导致拖拽中断。`DragOverlay` 渲染的覆盖层脱离正常文档流、相对 viewport 定位，天然规避以上问题，并提供内置的放下动画（drop animation）。

```typescript
interface Props {
  dropAnimation?: DropAnimation | null; // 默认 250ms ease，传 null 关闭
  modifiers?: Modifiers;
  wrapperElement?: keyof JSX.IntrinsicElements; // 默认 div；列表项场景应改成 ul，避免无效 DOM 嵌套
  zIndex?: number; // 默认 999
  className?: string;
  style?: CSSProperties;
  transition?: string;
}
```

```jsx
import { useState } from "react";
import { DndContext, DragOverlay, useDraggable } from "@dnd-kit/core";

function App() {
  const [activeId, setActiveId] = useState(null);
  return (
    <DndContext onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={() => setActiveId(null)}>
      <Draggable id="item-1" />
      <DragOverlay>{activeId ? <ItemPreview id={activeId} /> : null}</DragOverlay>
    </DndContext>
  );
}
```

**关键建议**：`DragOverlay` 组件本身应**始终挂载**，只对内部 `children` 做条件渲染——否则 `dropAnimation` 会失效（卸载瞬间直接跳变，没有过渡）。官方推荐把渲染内容拆成"展示型组件"，同一份 UI 既用于源节点也用于覆盖层预览，避免在 `DragOverlay` 内部重复调用 `useDraggable`。

> **易错点：该用 `DragOverlay` 时直接拖元素本体**。在有 `overflow: hidden` 的滚动容器、或跨容器/虚拟列表场景下，直接给源节点加 `transform` 会被裁剪或在容器切换时因挂载卸载而拖拽中断，应改用 `DragOverlay`。
>
> **易错点：`DragOverlay` 本身被条件渲染**（而不是只对其 `children` 条件渲染）。这会导致卸载瞬间直接跳变，`dropAnimation` 完全不生效——正确做法是 `DragOverlay` 永远渲染，内部 `children` 才做 `activeId ? <Preview /> : null` 式的条件判断。

## 五、其它辅助 API

- **`useDndContext()`**：读取当前 `DndContext` 内部状态（`active`/`over` 等），用于构建自定义组件或预设，必须在 `DndContext` 内部使用。
- **`useDndMonitor({onDragStart, onDragMove, onDragOver, onDragEnd, onDragCancel})`**：让 `DndContext` 子树内的任意组件监听全局拖拽事件，无需自己持有/透传 state，适合做全局的拖拽状态指示器。
- **CSS 助手**（`@dnd-kit/utilities` 的 `CSS` 对象，实测签名）：
  - `CSS.Translate.toString(transform)` —— 只应用位移，忽略 `scaleX`/`scaleY`；
  - `CSS.Transform.toString(transform)` —— 位移 + 缩放都应用；
  - `CSS.Scale.toString(transform)` —— 只应用缩放；
  - `CSS.Transition.toString({property, duration, easing})` —— 生成过渡字符串。

理解了 `DndContext`、`useDraggable`/`useDroppable`、`DragOverlay` 这套单容器拖拽的核心组合，下一页进入更常见的实战场景——列表/网格/看板排序：[Sortable 预设](./sortable-preset)。
