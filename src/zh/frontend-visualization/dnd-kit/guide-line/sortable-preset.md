---
layout: doc
outline: [2, 3]
---

# Sortable 预设：SortableContext / useSortable / arrayMove

> 基于 @dnd-kit/core 6.3.1（npm 实测最新版）· 核于 2026-07

## 速查

- **两层架构**：`SortableContext`（通过 Context 提供当前容器的排序信息）→ `useSortable`（`useDraggable` + `useDroppable` 的组合封装）。
- **嵌套约束**：`SortableContext` 必须是 `DndContext` 的后代，可在同一个 `DndContext` 下嵌套多个 `SortableContext`（多容器/看板场景的基础）。
- **`SortableContext.items`**：必填，已排序的唯一 id 数组，**必须与实际渲染顺序一致**，否则动画/位置计算会错乱。
- **4 种排序策略**：`rectSortingStrategy`（默认，通用网格/不规则布局）/ `verticalListSortingStrategy`（垂直列表）/ `horizontalListSortingStrategy`（水平列表）/ `rectSwappingStrategy`（交换式，需配合 `arraySwap`）。
- **"支持虚拟化"的真实含义**：`verticalListSortingStrategy`/`horizontalListSortingStrategy` 只是计算上兼容虚拟化，**并不会**替你接入虚拟滚动，长列表仍需自行搭配 `react-window`/`@tanstack/react-virtual`（性能延伸讨论见[无障碍与实战模式](./accessibility-and-patterns)）。
- **`useSortable` 额外返回字段**：在 `useDraggable`/`useDroppable` 基础上新增 `index`/`newIndex`/`overIndex`/`activeIndex`/`items`/`isSorting`/`setDraggableNodeRef`/`setDroppableNodeRef`/`transition`。
- **`arrayMove`**：插入式，把 `array[from]` 移动到 `to` 位置，中间项顺移，返回新数组（纯函数）。
- **`arraySwap`**：交换式，把 `array[from]` 与 `array[to]` 直接互换位置，返回新数组，需配合 `rectSwappingStrategy` 使用。
- **`animateLayoutChanges`**：控制哪些布局变化需要触发过渡动画；`transition` 默认 250ms，传 `null` 关闭过渡。
- **`getNewIndex`**：自定义"拖到某位置后应插入的新下标"计算逻辑。
- **`sortableKeyboardCoordinates`**：`@dnd-kit/sortable` 提供的、针对排序列表优化过的键盘坐标获取器，比 core 默认的 `defaultKeyboardCoordinateGetter` 更适合列表场景。
- **易错点**：`SortableContext.items` 顺序与渲染 DOM 顺序不一致会导致动画错乱；`rectSwappingStrategy` 配 `arrayMove` 而非 `arraySwap` 会导致排序结果与视觉反馈不符；用数组下标当 `id`/`key` 会在增删后错乱内部维护的 transition/动画状态。

## 一、架构：SortableContext + useSortable

Sortable 预设不是另起炉灶的新体系，而是在 `useDraggable`/`useDroppable` 基础上叠加了一层"排序信息"：`SortableContext` 通过 Context 把当前容器的排序数据（`items` 数组、排序策略）提供给子树，`useSortable` 消费这份信息，内部实际上是 `useDraggable` + `useDroppable` 的组合封装，再加上排序特有的下标计算。

`SortableContext` 必须是 `DndContext` 的后代，且可以在同一个 `DndContext` 下嵌套多个 `SortableContext`——这是实现多容器/看板场景的架构基础，具体范式见[无障碍与实战模式](./accessibility-and-patterns)。

```typescript
// SortableContext props
{
  items: UniqueIdentifier[]; // 必填：已排序的唯一 id 数组，必须与实际渲染顺序一致！
  strategy?: SortingStrategy; // 默认 rectSortingStrategy
  id?: string; // 可选，高级用法/自定义 sensor 用
}
```

> **易错点：`SortableContext.items` 顺序与实际渲染 DOM 顺序不一致**。官方文档明确强调二者必须一致，否则动画与位置计算会错乱——常见错误是数据源排序变了，但传给 `items` 的数组没有同步更新。

## 二、四种排序策略

| 策略 | 适用场景 |
| --- | --- |
| `rectSortingStrategy` | 默认值，适合大多数通用场景（网格/不规则布局） |
| `verticalListSortingStrategy` | 垂直列表优化，支持虚拟化列表 |
| `horizontalListSortingStrategy` | 水平列表优化，支持虚拟化列表 |
| `rectSwappingStrategy` | 交换式（而非插入式）排序，需配合 `arraySwap` 使用 |

需要特别澄清的一点：`verticalListSortingStrategy`/`horizontalListSortingStrategy` 所说的"支持虚拟化"，指的是这两个策略的**位置计算方式**兼容虚拟滚动场景（不会因为可见区域外的项目未渲染而计算错乱），但策略本身**不会替你接入虚拟滚动**——真正的虚拟滚动（只渲染可见区域内的 DOM 节点）仍需自行搭配 `react-window`/`@tanstack/react-virtual` 等库。这是一个常被误解的细节，详见[无障碍与实战模式](./accessibility-and-patterns)的性能小节。

## 三、useSortable：组合 draggable + droppable

`useSortable` 的 `Arguments` 接口实测等价于"去掉 `disabled: boolean` 类型的 `UseDraggableArguments`" + "`UseDroppableArguments` 的 `resizeObserverConfig`"，外加排序专属参数：

```typescript
{
  animateLayoutChanges?: AnimateLayoutChanges; // 控制哪些布局变化需要触发过渡动画
  disabled?: boolean | Disabled;
  getNewIndex?: NewIndexGetter;   // 自定义"拖到某位置后应插入的新下标"计算逻辑
  strategy?: SortingStrategy;     // 局部覆盖 SortableContext 的全局策略
  transition?: { easing, duration } | null; // 默认 250ms，null 关闭过渡
}
// 返回值：在 useDraggable/useDroppable 基础上新增
{
  index, newIndex, overIndex, activeIndex, items, isSorting,
  setDraggableNodeRef, setDroppableNodeRef, // 高级用法：分离拖拽节点与放置节点
  transform, transition,
}
```

`strategy` 可以在单个 `useSortable` 调用里局部覆盖 `SortableContext` 的全局策略，适合"同一个容器内大部分项目按列表排序、个别项目按自定义规则排序"这类特殊场景。`setDraggableNodeRef`/`setDroppableNodeRef` 是高级用法，允许把拖拽节点与放置节点分离绑定到不同 DOM 元素。

## 四、arrayMove 与 arraySwap：插入式 vs 交换式

两个工具函数语义不同，务必按排序策略正确配对使用（实测精确签名，来自已发布的 `.d.ts`）：

```typescript
// 插入式：把 array[from] 移动到 to 位置，中间项顺移，返回新数组
function arrayMove<T>(array: T[], from: number, to: number): T[];
// 交换式：把 array[from] 与 array[to] 直接互换位置，返回新数组（配合 rectSwappingStrategy）
function arraySwap<T>(array: T[], from: number, to: number): T[];
```

`arrayMove` 对应默认的插入式排序体验——拖到某个位置，中间的项目会依次顺移一格；`arraySwap` 对应交换式体验——两个项目直接互换位置，中间项目不受影响。两者都是纯函数，调用后返回新数组，不修改传入的原数组。

> **易错点：`rectSwappingStrategy` 配 `arrayMove` 而非 `arraySwap`**。插入式与交换式语义不同，配错会导致排序结果和拖拽视觉反馈不符——视觉上表现为"交换策略"的动画效果，但业务数据却按"插入式"的逻辑更新，两者对不上。

## 五、完整示例：可排序列表

```jsx
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableList({ items, setItems }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex); // 纯函数，返回新数组
      });
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((id) => (
          <SortableItem key={id} id={id} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {id}
    </li>
  );
}
```

`sortableKeyboardCoordinates` 是 `@dnd-kit/sortable` 提供的、针对排序列表优化过的键盘坐标获取器，比 core 默认的 `defaultKeyboardCoordinateGetter` 更适合列表场景（详见[Sensors、Modifiers 与碰撞检测](./sensors-modifiers-collision)）。

这个例子里 `key={id}` 用的是稳定的业务 id 而非数组下标，这一点很关键：

> **易错点：用数组下标当 `id`/`key`**。列表增删项目后下标会漂移，导致 dnd-kit 内部维护的 transition/动画状态错乱（明明拖的是 A 项，动画却套在了 B 项上）——必须使用稳定唯一的业务 `id`，不能用 `index`。

理解了单容器排序的完整链路，下一页进入传感器体系、坐标修饰符与碰撞检测算法：[Sensors、Modifiers 与碰撞检测](./sensors-modifiers-collision)。
