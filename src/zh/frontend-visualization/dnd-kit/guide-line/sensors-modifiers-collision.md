---
layout: doc
outline: [2, 3]
---

# Sensors、Modifiers 与碰撞检测

> 基于 @dnd-kit/core 6.3.1（npm 实测最新版）· 核于 2026-07

## 速查

- **Sensor 定义**：一组检测不同输入方式的类，负责识别激活、响应移动、结束或取消拖拽；`DndContext` 默认使用 `PointerSensor` + `KeyboardSensor`。
- **为何用 class 而非 Hook**：Sensor 需要同步实例化以立即响应用户交互，且必须能被条件性地调用，这两点决定了它采用基于类而非 Hook 的实现。
- **4 种 Sensor**：`PointerSensor`（`onPointerDown`，官方推荐现代浏览器首选）/ `MouseSensor`（仅鼠标）/ `TouchSensor`（仅单指触摸）/ `KeyboardSensor`（聚焦后按键，无障碍关键）。
- **`activationConstraint` 两种形式**：`{ distance: number }`（移动指定像素才激活）或 `{ delay: number; tolerance: number }`（按住 `delay` 毫秒后激活，期间容许 `tolerance` 像素抖动），用于区分"点击"与"拖拽意图"。
- **`KeyboardSensor` 默认映射**：Space/Enter 拾取与放下，方向键移动（默认每次 25px），Escape 取消；可通过 `coordinateGetter` 自定义移动逻辑，`keyboardCodes` 自定义按键映射。
- **Sensor 生命周期**：检测到激活事件 → 满足 `activationConstraint` 则触发 `onDragStart`（未满足前重复触发 `onDragPending`）→ 响应输入派发 move → 派发 end 或 cancel → 传感器卸载清理监听器。
- **Modifiers 作用**：在拖拽过程中对 Sensor 检测到的坐标做二次加工（限制范围、吸附网格等）。
- **两个挂载点语义不同**：`DndContext.modifiers` 影响所有被拖拽节点的**实际计算坐标**（进而影响 `over`/碰撞判定）；`DragOverlay.modifiers` 只影响**覆盖层的视觉呈现位置**，不影响真实碰撞判定。
- **8 个内置 Modifier**：`restrictToHorizontalAxis`/`restrictToVerticalAxis`（单轴）、`restrictToWindowEdges`（窗口边界）、`restrictToParentElement`（父元素范围）、`restrictToFirstScrollableAncestor`（可滚动祖先）、`restrictToBoundingRect`（任意矩形）、`snapCenterToCursor`（中心吸附光标）、`createSnapModifier(gridSize)`（网格吸附工厂函数）。
- **自定义 Modifier**：函数签名接收 `{transform, active, activatorEvent, over, ...}`，必须返回**新的** `Transform`，不可变更新。
- **4 种碰撞检测算法**：`rectIntersection`（默认，矩形几何相交）/ `closestCenter`（中心点距离，适合可排序列表）/ `closestCorners`（四角距离，看板等堆叠容器推荐）/ `pointerWithin`（仅指针坐标落入容器才判定，仅对指针类 sensor 有效）。
- **自定义碰撞检测**：可组合/降级，如 `pointerWithin` 优先、无结果时 fallback 到 `rectIntersection`。
- **易错点**：忘记设置 `activationConstraint` 会让按钮/复选框的点击被拖拽手势吞掉；移动端忘记 `touch-action` 会导致拖拽与页面滚动手势冲突；`MouseSensor`/`TouchSensor` 与 `PointerSensor` 重复注册容易触发两套事件；自定义 modifier/sensor 里直接访问 `window`/`document` 未做 SSR 判断会在服务端渲染阶段报错。

## 一、Sensors：识别不同输入方式

Sensor 是一组检测不同输入方式的类，负责识别激活、响应移动、结束或取消拖拽。`DndContext` 默认使用 `PointerSensor` + `KeyboardSensor`。Sensor 采用**基于类而非 Hook** 的实现——因为需要同步实例化以立即响应用户交互，且必须能被条件性地调用，这与 React Hooks 的调用规则（不可条件调用）恰好相反，所以官方选择了 class 而非 Hook 的形式。

| Sensor | 激活事件 | 说明 |
| --- | --- | --- |
| `PointerSensor` | `onPointerDown`（仅主指针） | 基于原生 Pointer Events，统一处理鼠标/触摸/触控笔，官方推荐现代浏览器首选 |
| `MouseSensor` | `onMouseDown` | 仅响应鼠标事件 |
| `TouchSensor` | `onTouchStart`（仅单指触摸时） | 仅响应触摸事件，建议设置 `touch-action: manipulation` |
| `KeyboardSensor` | 聚焦后按键 | 键盘事件，是无障碍支持的关键，见[无障碍与实战模式](./accessibility-and-patterns) |

```jsx
import { DndContext, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";

function App() {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );
  return <DndContext sensors={sensors}>{/* ... */}</DndContext>;
}
```

> **易错点：`MouseSensor`/`TouchSensor` 与 `PointerSensor` 重复注册**。容易在同一次交互里触发两套事件、导致重复处理；现代浏览器场景官方建议直接用 `PointerSensor` 统一处理，无需再叠加注册 Mouse + Touch。上面这段代码是需要精细区分鼠标/触摸行为时的写法，常规场景一个 `PointerSensor` 通常就够。

## 二、activationConstraint：区分点击与拖拽意图

`activationConstraint`（Pointer/Mouse/Touch 共用，实测类型 `PointerActivationConstraint = DelayConstraint | DistanceConstraint | (两者交叉)`）有两种互斥的配置形式：

- **`{ distance: number }`**——需要移动的像素数才激活拖拽；
- **`{ delay: number; tolerance: number }`**——按住 `delay` 毫秒后激活，期间允许 `tolerance` 像素内的抖动。

作用是区分"点击"与"拖拽意图"，防止可交互元素（按钮/复选框）的点击被拖拽手势吞掉。

> **易错点：忘记设置 `activationConstraint`**。不设置时任何点击都会触发 `dragStart`，导致按钮、复选框等交互元素的点击事件被拖拽手势"吞掉"；应设置 `distance` 或 `delay` + `tolerance`。
>
> **易错点：移动端忘记设置 `touch-action`**。不设置 `touch-action: none`（或 `manipulation`）会导致触摸拖拽与页面滚动手势冲突，出现"拖不动"或页面跟着乱跳。

## 三、KeyboardSensor：键盘无障碍的关键

**默认按键映射**：Space/Enter 拾取与放下，方向键移动（默认每次 25px），Escape 取消。可通过 `coordinateGetter`（类型 `KeyboardCoordinateGetter`）自定义移动逻辑，通过 `keyboardCodes`（`{start, cancel, end}` 三组按键数组）自定义按键映射；`KeyboardCode` 枚举里还定义了 `Tab` 等常量供自定义时使用。

**Sensor 完整生命周期**：检测到激活事件 → 若满足 `activationConstraint` 则真正触发 `onDragStart`（未满足前会重复触发 `onDragPending`）→ 响应输入派发 move → 派发 end 或 cancel → 传感器卸载清理监听器。这套生命周期也支持实现自定义 Sensor 类以响应其它输入设备（如游戏手柄）。

## 四、Modifiers：坐标二次加工

**作用**：在拖拽过程中对 sensor 检测到的坐标做二次加工（限制范围、吸附网格等）。可分别应用在 `DndContext.modifiers`（影响所有被拖拽节点的实际计算坐标，进而影响 `over`/碰撞判定）和/或 `DragOverlay.modifiers`（只影响覆盖层的视觉呈现位置，不影响真实碰撞判定）——**两者语义不同，容易混淆**。

内置 modifier（实测已发布包内文件清单，比官方页面摘要文字更全，多出 `restrictToBoundingRect` 与 `snapCenterToCursor` 两个）：

| Modifier | 作用 |
| --- | --- |
| `restrictToHorizontalAxis` / `restrictToVerticalAxis` | 限制仅沿单一轴运动 |
| `restrictToWindowEdges` | 限制在浏览器窗口边界内 |
| `restrictToParentElement` | 限制在父元素范围内 |
| `restrictToFirstScrollableAncestor` | 限制在第一个可滚动祖先元素内 |
| `restrictToBoundingRect` | 限制在指定的任意矩形范围内 |
| `snapCenterToCursor` | 让元素中心点吸附到光标位置 |
| `createSnapModifier(gridSize)` | 工厂函数，返回按指定网格尺寸吸附的 modifier |

自定义 modifier 函数签名（实测 `Modifier` 类型，必须返回新的 `Transform`，不可变更新）：

```typescript
type Modifier = (args: {
  transform: Transform; active, activatorEvent, over,
  draggingNodeRect, containerNodeRect, overlayNodeRect,
  scrollableAncestors, scrollableAncestorRects, windowRect,
}) => Transform;
```

```jsx
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";

<DndContext modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>{/* ... */}</DndContext>;
```

> **易错点：自定义 modifier/sensor 里直接访问 `window`/`document` 未做 SSR 判断**。dnd-kit 内部已用 `canUseDOM` 等工具函数处理执行环境，但用户自定义扩展逻辑仍需自行判断，否则在服务端渲染阶段报错——SSR 场景的更多注意事项见[无障碍与实战模式](./accessibility-and-patterns)。

## 五、Collision detection：碰撞检测

**作用**：判定被拖拽项与哪些可放置区域相交，决定 `event.over`。内置算法均基于 AABB（轴对齐包围盒），假设元素为矩形。

| 算法 | 原理 | 适用场景 |
| --- | --- | --- |
| `rectIntersection`（默认） | 判定两矩形是否几何相交 | 大多数常规拖放场景 |
| `closestCenter` | 比较各容器中心点与拖拽项中心点的距离 | 可排序列表（比 `rectIntersection` 更宽容） |
| `closestCorners` | 比较四角距离 | 看板等堆叠容器场景，官方明确建议多容器优先用它而非 `closestCenter` |
| `pointerWithin` | 仅当指针坐标落入容器范围内才判定 | 高精度拖放界面，仅对指针类 sensor 有效 |

支持组合/降级策略（自定义碰撞检测函数）：

```jsx
import { pointerWithin, rectIntersection } from "@dnd-kit/core";

function customCollisionDetection(args) {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
}
```

自定义碰撞检测函数接收 `{collisionRect, droppableRects, droppableContainers, ...}`，需返回碰撞数组（按最优匹配排序，第一项作为 `over`）。看板类多容器场景推荐 `closestCorners` 而非 `closestCenter` 的原因，会在下一页的多容器实战里进一步展开。

传感器决定"怎么触发拖拽"，Modifiers 决定"坐标怎么加工"，碰撞检测决定"落在了哪里"——三者组合起来才是完整的拖拽判定链路。下一页把这套机制用到无障碍场景与多容器看板的实战模式中：[无障碍与实战模式](./accessibility-and-patterns)。
