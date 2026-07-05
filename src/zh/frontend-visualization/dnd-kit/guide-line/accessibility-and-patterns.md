---
layout: doc
outline: [2, 3]
---

# 无障碍、多容器看板与实战模式

> 基于 @dnd-kit/core 6.3.1（npm 实测最新版）· 核于 2026-07

## 速查

- **键盘拖拽完整流程**：Tab 聚焦可拖拽元素 → Space/Enter 拾取 → 方向键移动（默认 25px/次）→ Space/Enter 再次按下确认放置，或 Esc 取消。
- **默认 ARIA**（`useDraggable` 自动写入 `attributes`）：`role="button"`、`aria-roledescription="draggable"`、`aria-describedby` 指向自动生成的说明文本节点、`tabIndex=0`、`aria-disabled`，拖拽中会切换的 `aria-pressed`。
- **`screenReaderInstructions`**：通过 `accessibility.screenReaderInstructions` 自定义"如何操作"的静态说明文本，读屏软件聚焦时朗读。
- **`announcements`**：`onDragStart`/`onDragOver`/`onDragEnd`/`onDragCancel` 四个回调各返回一段动态播报文本（Live Region 实时播报）。
- **最佳实践**：播报"当前处于第几项，共几项"这种位置语义，而非数组下标（0 起始容易误导用户）。
- **多容器官方立场**：dnd-kit 未提供开箱即用的多容器组件，通用模式需要业务代码自己搭。
- **多容器范式 5 要点**：①同一 `DndContext` 下嵌套多个 `SortableContext` ②`onDragOver` 里检测跨容器移动、手动搬运数组（视觉过渡在这一步完成）③`onDragEnd` 里用 `arrayMove`/`arraySwap` 处理容器内最终排序 ④碰撞检测建议 `closestCorners` 而非 `closestCenter` ⑤空容器额外包一层 `useDroppable` 兜底。
- **虚拟化真实含义回顾**：排序策略只是计算上兼容虚拟化，长列表仍需自行接入 `react-window`/`@tanstack/react-virtual`。
- **`transform` 走 CSS**：视觉过渡靠 CSS `transform`（硬件加速）而非重排，这是 dnd-kit 相对手写重排方案的性能优势来源。
- **SSR**：内部通过 `useIsomorphicLayoutEffect` 兼容服务端渲染；初始 `transform` 为 `null`，样式计算需处理无 `transform` 时的回退。
- **`onDragPending`/`onDragAbort`**：围绕 `activationConstraint` 等待态新增的过渡事件，SSR/首屏水合场景也需留意这类"拖拽未真正开始"的中间状态不应影响服务端渲染的初始 HTML。
- **本页汇总易错点清单**：覆盖全系列 15 个高频坑，逐条标注详解所在页，便于查漏补缺（见第五节）。
- **进阶顺序**：本页承接[Sensors、Modifiers 与碰撞检测](./sensors-modifiers-collision)，收尾页是[参考](../reference)。

## 一、Accessibility：dnd-kit 的核心卖点

无障碍支持是 dnd-kit 区别于原生 HTML5 DnD API（完全不支持键盘操作与读屏）和多数同类库的最大差异化卖点，体现在三层递进的能力上。

**1. 键盘拖拽完整流程**：Tab 聚焦可拖拽元素 → Space/Enter 拾取 → 方向键移动（默认 25px/次）→ Space/Enter 再次按下确认放置，或 Esc 取消。整套流程不需要额外配置，`KeyboardSensor` 默认就支持（见[Sensors、Modifiers 与碰撞检测](./sensors-modifiers-collision)）。

**2. 默认 ARIA 属性**：`useDraggable` 自动写入 `attributes`，包含 `role="button"`、`aria-roledescription="draggable"`、`aria-describedby`（指向自动生成的说明文本节点）、`tabIndex=0`、`aria-disabled`，以及拖拽中会切换的 `aria-pressed`。

**3. `screenReaderInstructions`**：通过 `DndContext` 的 `accessibility.screenReaderInstructions` 自定义"如何操作"的静态说明文本，读屏软件在聚焦可拖拽元素时朗读。默认文案：

```text
To pick up a draggable item, press space or enter. While dragging, use the arrow keys
to move the item in any given direction. Press space or enter again to drop the item
in its new position, or press escape to cancel.
```

**4. `announcements`**（实时播报 / Live Region）：`onDragStart`/`onDragOver`/`onDragEnd`/`onDragCancel` 四个回调各返回一段动态播报文本：

```jsx
const announcements = {
  onDragStart({ active }) {
    return `Picked up sortable item ${active.id}. Position ${getPosition(active.id)} of ${itemCount}.`;
  },
  onDragOver({ active, over }) {
    if (over) return `Sortable item ${active.id} moved into position ${getPosition(over.id)} of ${itemCount}.`;
  },
  onDragEnd({ active, over }) {
    if (over) return `Sortable item ${active.id} dropped at position ${getPosition(over.id)} of ${itemCount}.`;
  },
  onDragCancel({ active }) {
    return `Dragging cancelled. Sortable item ${active.id} dropped.`;
  },
};
```

官方明确建议播报**"当前处于第几项，共几项"这种位置语义**，而非数组下标（0 起始容易误导用户）。这三层定制（ARIA + 静态说明 + 动态播报）组合起来，让 dnd-kit 的拖拽交互对键盘用户和读屏用户都是完整可用的，而不是"视觉可用、辅助功能残缺"。

## 二、多容器（看板 Kanban）实战模式

官方**未提供开箱即用的多容器组件**——这是 dnd-kit 现实的一个局限，看板类应用的跨列表拖放需要业务代码自己组合底层 API。通用模式包含 5 个要点：

1. **架构**：同一个 `DndContext` 下嵌套多个 `SortableContext`（每个容器一个）。
2. **跨容器搬运**：在 **`onDragOver`** 中检测 `active` 是否跨容器移动到了新的 `over` 容器，手动把 item 从旧数组 `splice` 到新数组（业务态维护，视觉过渡在这一步完成）。
3. **容器内最终排序**：`onDragEnd` 里再用 `arrayMove`/`arraySwap` 处理容器内的最终排序。
4. **碰撞检测**：建议用 `closestCorners` 而非 `closestCenter`——看板的列与卡片是堆叠布局，`closestCorners` 比较四角距离，对这种场景的判定更准确。
5. **空容器兜底**：空容器需要额外包一层 `useDroppable`，因为容器为空时 `SortableContext` 内没有可测量的 `useSortable` 节点提供碰撞目标，否则"接不住"拖入项。

```jsx
// 简化示意：跨容器搬运的核心逻辑发生在 onDragOver，而非 onDragEnd
function handleDragOver(event) {
  const { active, over } = event;
  if (!over) return;
  const activeContainer = findContainer(active.id);
  const overContainer = findContainer(over.id);
  if (!activeContainer || !overContainer || activeContainer === overContainer) return;

  setContainers((prev) => {
    const activeItems = prev[activeContainer];
    const overItems = prev[overContainer];
    const activeIndex = activeItems.indexOf(active.id);
    const overIndex = overItems.indexOf(over.id);

    return {
      ...prev,
      [activeContainer]: activeItems.filter((id) => id !== active.id),
      [overContainer]: [
        ...overItems.slice(0, overIndex),
        active.id,
        ...overItems.slice(overIndex),
      ],
    };
  });
}

function handleDragEnd(event) {
  // 到这一步只需处理"同容器内"的最终排序，跨容器搬运已在 onDragOver 完成
  const { active, over } = event;
  if (!over) return;
  const container = findContainer(active.id);
  const activeIndex = containers[container].indexOf(active.id);
  const overIndex = containers[container].indexOf(over.id);
  if (activeIndex !== overIndex) {
    setContainers((prev) => ({
      ...prev,
      [container]: arrayMove(prev[container], activeIndex, overIndex),
    }));
  }
}
```

> **易错点：多容器状态搬运逻辑写反位置**。跨容器移动的视觉过渡（数组搬运）应发生在 `onDragOver`，`onDragEnd` 只做最终定序；写反会导致拖拽过程中没有实时预览效果，用户拖到新容器时看不到卡片跟随移动，只有松手瞬间才突然跳变。
>
> **易错点：空容器没有兜底 `useDroppable`**。容器为空时 `SortableContext` 内没有可测量节点，导致该容器"接不住"拖入的新项——需要额外包一层 `useDroppable`，让空容器本身也是一个有效的放置目标。

## 三、性能与虚拟化

`transform` 走 CSS（`translate3d`）而非重排（reflow），是 dnd-kit 相对手写方案的核心性能优势——拖拽过程中的视觉移动完全交给浏览器合成层处理，不会触发布局重新计算。

**长列表虚拟化的真实含义**（容易被误解的一点）：`verticalListSortingStrategy`/`horizontalListSortingStrategy` 所谓"支持虚拟化"，指的是这两个策略在计算排序位置时，**不会因为可见区域外的节点未渲染而算错**——但这只是"计算上兼容"，策略本身**不会**帮你把长列表从"全量渲染"变成"只渲染可见区域"。如果列表有几千项，仍然需要自行搭配 `react-window`/`@tanstack/react-virtual` 这类虚拟滚动库来控制实际 DOM 节点数量，dnd-kit 负责的只是"虚拟滚动之上的排序坐标计算不出错"。

## 四、SSR 注意事项

dnd-kit 内部通过 `useIsomorphicLayoutEffect` 兼容服务端渲染，这意味着组件本身可以安全地在 Next.js 等 SSR 框架中使用。但仍有两处需要业务代码自行注意：

- **初始 `transform` 为 `null`**：服务端渲染阶段和客户端水合（hydrate）之前，`useDraggable`/`useSortable` 返回的 `transform` 是 `null`，样式计算需要处理"没有 `transform`"时的回退（例如 `CSS.Translate.toString(transform)` 传入 `null` 时的表现，一般会安全地返回空字符串，但自定义计算逻辑需要自行判空）。
- **自定义扩展逻辑的 SSR 判断**：dnd-kit 内部已用 `canUseDOM` 等工具函数处理执行环境，但用户自己编写的自定义 modifier、自定义 Sensor 如果直接访问 `window`/`document`，仍需自行判断是否在浏览器环境，否则会在服务端渲染阶段报错（详见[Sensors、Modifiers 与碰撞检测](./sensors-modifiers-collision)）。

## 五、易错点清单（全系列汇总）

结合前几页的具体讲解，这里给出覆盖全系列的 15 项易错点汇总，方便复习查漏：

1. **`CSS.Translate` 与 `CSS.Transform` 选错**——`Translate` 只应用位移，`Transform` 位移+缩放都应用，混用带来意外缩放效果（详见[DndContext 与核心 Hooks](./context-and-hooks)）。
2. **该用 `DragOverlay` 时直接拖元素本体**——`overflow: hidden` 容器或跨容器场景下会被裁剪/中断（详见[DndContext 与核心 Hooks](./context-and-hooks)）。
3. **忘记设置 `activationConstraint`**——按钮/复选框的点击会被拖拽手势吞掉（详见[Sensors、Modifiers 与碰撞检测](./sensors-modifiers-collision)）。
4. **移动端忘记设置 `touch-action`**——触摸拖拽与页面滚动手势冲突（详见[Sensors、Modifiers 与碰撞检测](./sensors-modifiers-collision)）。
5. **`SortableContext.items` 顺序与实际渲染 DOM 顺序不一致**——动画与位置计算错乱（详见[Sortable 预设](./sortable-preset)）。
6. **`rectSwappingStrategy` 配 `arrayMove` 而非 `arraySwap`**——排序结果与视觉反馈不符（详见[Sortable 预设](./sortable-preset)）。
7. **用条件语句包裹 `useDraggable`/`useDroppable`**——违反 Hooks 规则，必须用 `disabled` 控制启停（详见[DndContext 与核心 Hooks](./context-and-hooks)）。
8. **用数组下标当 `id`/`key`**——列表增删后下标漂移，内部 transition/动画状态错乱（详见[Sortable 预设](./sortable-preset)）。
9. **多容器状态搬运逻辑写反位置**——应在 `onDragOver` 搬运、`onDragEnd` 只定序，写反则拖拽过程无实时预览（本页第二节）。
10. **空容器没有兜底 `useDroppable`**——容器"接不住"拖入的新项（本页第二节）。
11. **`DragOverlay` 本身被条件渲染**——应始终挂载 `DragOverlay`、只对 `children` 条件渲染，否则 `dropAnimation` 不生效（详见[DndContext 与核心 Hooks](./context-and-hooks)）。
12. **`MouseSensor`/`TouchSensor` 与 `PointerSensor` 重复注册**——容易触发两套事件重复处理，现代浏览器直接用 `PointerSensor` 即可（详见[Sensors、Modifiers 与碰撞检测](./sensors-modifiers-collision)）。
13. **官方文档站新旧版本混淆**——`dndkit.com` 首页默认展示的是 0.x 阶段的框架无关重写版文档，经典 API 在 `/legacy/` 路径下（详见[入门](../getting-started)）。
14. **`accessibility` 相关 prop 新旧写法混用**——早期教程的顶层 `announcements`/`screenReaderInstructions` 写法，当前类型定义已收拢进嵌套的 `accessibility` 对象（详见[DndContext 与核心 Hooks](./context-and-hooks)）。
15. **自定义 modifier/sensor 里直接访问 `window`/`document` 未做 SSR 判断**——服务端渲染阶段会报错，需自行判断执行环境（本页第四节 + [Sensors、Modifiers 与碰撞检测](./sensors-modifiers-collision)）。

至此，从单容器拖拽、Sortable 排序、Sensors/Modifiers/碰撞检测，到无障碍与多容器实战模式，dnd-kit 的核心用法已经完整覆盖。查阅速查表、Props 全表与选型对比，请转到[参考](../reference)。
