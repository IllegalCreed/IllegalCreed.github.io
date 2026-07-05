---
layout: doc
outline: [2, 3]
---

# 参考：dnd-kit Hooks / Props / Sensors / 策略速查

> 基于 @dnd-kit/core 6.3.1（npm 实测最新版）· 核于 2026-07

## 速查

- **版本基线**：`@dnd-kit/core` 6.3.1 / `@dnd-kit/sortable` 10.0.0 / `@dnd-kit/modifiers` 9.0.0 / `@dnd-kit/utilities` 3.2.2，均 MIT 协议，仅依赖 `tslib`。
- **核心 Hooks**：`useDraggable`（可拖拽）/ `useDroppable`（可放置）/ `useSortable`（排序预设，二者组合）/ `useDndContext`（读内部状态）/ `useDndMonitor`（监听全局事件）。
- **核心组件**：`DndContext`（根上下文）/ `DragOverlay`（覆盖层）/ `SortableContext`（排序信息提供者）。
- **`id` 规则**：draggable 与 droppable 的 `id` 各自独立存储，只需同类型内唯一，允许同名。
- **`transform` 形状**：`{x, y, scaleX, scaleY}`；`CSS.Translate` 只应用位移，`CSS.Transform` 位移+缩放都应用。
- **Sensors**：`PointerSensor`（推荐）/ `MouseSensor` / `TouchSensor` / `KeyboardSensor`；`activationConstraint` 为 `{distance}` 或 `{delay, tolerance}` 二选一。
- **排序策略**：`rectSortingStrategy`（默认）/ `verticalListSortingStrategy` / `horizontalListSortingStrategy` / `rectSwappingStrategy`。
- **碰撞检测**：`rectIntersection`（默认）/ `closestCenter` / `closestCorners`（看板推荐）/ `pointerWithin`。
- **Modifiers**：8 个内置（轴向限制×2、边界限制×3、网格/居中吸附×2、吸附工厂×1）；`DndContext.modifiers` 影响真实碰撞，`DragOverlay.modifiers` 只影响视觉。
- **`arrayMove`（插入式）vs `arraySwap`（交换式）**：分别配 `rectSortingStrategy`/`verticalListSortingStrategy`/`horizontalListSortingStrategy` 与 `rectSwappingStrategy`。
- **无障碍三层**：默认 ARIA 属性 + `screenReaderInstructions`（静态说明）+ `announcements`（动态播报，四回调）。
- **多容器**：无官方开箱组件，`onDragOver` 搬运数组 + `onDragEnd` 定序 + `closestCorners` + 空容器兜底 `useDroppable`。
- **新旧架构**：经典 `@dnd-kit/core` 6.x（本笔记覆盖）vs 框架无关重写版 `@dnd-kit/react`/`@dnd-kit/dom`/`@dnd-kit/abstract`（0.5.0，pre-1.0，`DragDropManager`/`DragDropProvider` 架构，官方站首页默认展示，经典 API 在 `/legacy/`）。
- **选型**：纯 React + 无障碍/精细定制 → dnd-kit；跨框架/开箱即用嵌套多列表 → Sortable.js；系统级文件拖拽/跨窗口 → 只能原生 HTML5 DnD。

## 一、Hooks 与组件速查表

| API | 类型 | 一句话作用 |
| --- | --- | --- |
| `DndContext` | 组件 | 拖拽应用根组件，提供共享上下文，支持嵌套多个独立实例 |
| `useDraggable` | Hook | 让元素可被拖拽，返回 `attributes`/`listeners`/`setNodeRef`/`transform` 等 |
| `useDroppable` | Hook | 定义可放置区域，返回 `isOver`/`setNodeRef` 等 |
| `DragOverlay` | 组件 | 脱离文档流的拖拽预览层，规避 overflow 裁剪与跨容器挂载卸载问题 |
| `SortableContext` | 组件 | 为子树提供当前容器的排序信息（`items`/`strategy`） |
| `useSortable` | Hook | `useDraggable` + `useDroppable` 的排序组合封装 |
| `useDndContext` | Hook | 读取当前 `DndContext` 内部状态，构建自定义组件用 |
| `useDndMonitor` | Hook | 子树内任意组件监听全局拖拽事件，无需透传 state |
| `useSensor` / `useSensors` | Hook | 创建单个/组合多个 Sensor 实例，传给 `DndContext.sensors` |
| `arrayMove` | 函数 | 插入式移动数组元素，纯函数返回新数组 |
| `arraySwap` | 函数 | 交换式互换数组元素，纯函数返回新数组，配 `rectSwappingStrategy` |

## 二、DndContext Props 速查表

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 可选标识 |
| `accessibility` | `{announcements?, container?, restoreFocus?, screenReaderInstructions?}` | 无障碍配置（新旧写法见易错点） |
| `autoScroll` | `boolean \| AutoScrollOptions` | 拖到边缘自动滚动 |
| `cancelDrop` | `(args: DragEndEvent) => boolean \| Promise<boolean>` | drop 前一票否决，支持异步校验 |
| `collisionDetection` | `CollisionDetection` | 碰撞检测算法 |
| `measuring` | `MeasuringConfiguration` | 自定义测量函数 |
| `modifiers` | `Modifiers` | 坐标修饰符数组（影响真实碰撞判定） |
| `sensors` | `SensorDescriptor<any>[]` | 传感器数组 |
| `onDragStart` / `onDragMove` / `onDragOver` / `onDragEnd` / `onDragCancel` | 事件回调 | 拖拽生命周期各阶段 |
| `onDragPending` / `onDragAbort` | 事件回调 | 6.3.x 新增，`activationConstraint` 等待期内的过渡态事件 |

事件对象核心字段：`active`（含 `id`/`data`/`rect`）、`over`（可能为 `null`）、`delta`（`{x, y}`）、`collisions`、`activatorEvent`。

## 三、Sensors 与 activationConstraint 速查

| Sensor | 激活事件 | 适用 |
| --- | --- | --- |
| `PointerSensor` | `onPointerDown` | 现代浏览器统一处理鼠标/触摸/触控笔（推荐） |
| `MouseSensor` | `onMouseDown` | 仅鼠标 |
| `TouchSensor` | `onTouchStart` | 仅单指触摸，需配 `touch-action` |
| `KeyboardSensor` | 聚焦后按键 | 无障碍支持关键 |

| activationConstraint 形式 | 字段 | 语义 |
| --- | --- | --- |
| distance 型 | `{ distance: number }` | 移动指定像素数才激活 |
| delay 型 | `{ delay: number; tolerance: number }` | 按住 `delay` 毫秒激活，期间容许 `tolerance` 像素抖动 |

KeyboardSensor 默认映射：Space/Enter 拾取放下、方向键移动（25px/次）、Escape 取消；`coordinateGetter` 自定义移动逻辑（排序场景用 `sortableKeyboardCoordinates`），`keyboardCodes` 自定义按键映射。

## 四、排序策略、碰撞检测与 Modifiers 速查

| 排序策略 | 适用场景 |
| --- | --- |
| `rectSortingStrategy`（默认） | 网格/不规则布局通用场景 |
| `verticalListSortingStrategy` | 垂直列表，计算兼容虚拟化 |
| `horizontalListSortingStrategy` | 水平列表，计算兼容虚拟化 |
| `rectSwappingStrategy` | 交换式排序，配 `arraySwap` |

| 碰撞检测算法 | 原理 | 适用场景 |
| --- | --- | --- |
| `rectIntersection`（默认） | 矩形几何相交 | 常规拖放 |
| `closestCenter` | 中心点距离 | 可排序列表 |
| `closestCorners` | 四角距离 | 看板等堆叠容器（多容器推荐） |
| `pointerWithin` | 指针坐标是否落入容器 | 高精度拖放，仅指针类 sensor 有效 |

| Modifier | 作用 |
| --- | --- |
| `restrictToHorizontalAxis` / `restrictToVerticalAxis` | 限制单轴运动 |
| `restrictToWindowEdges` | 限制窗口边界内 |
| `restrictToParentElement` | 限制父元素范围内 |
| `restrictToFirstScrollableAncestor` | 限制第一个可滚动祖先内 |
| `restrictToBoundingRect` | 限制任意矩形范围内 |
| `snapCenterToCursor` | 中心点吸附光标 |
| `createSnapModifier(gridSize)` | 网格吸附工厂函数 |

## 五、选型对比（vs Sortable.js / react-dnd / 原生 HTML5 DnD）

| 维度 | **dnd-kit** | Sortable.js | react-dnd | 原生 HTML5 DnD |
| --- | --- | --- | --- | --- |
| 适用框架 | React 专属 | 框架无关（vanilla + 各框架封装层） | React 专属 | 任意（浏览器原生） |
| 底层机制 | 自建指针事件传感器系统 | 原生 HTML5 DnD + 触摸 Fallback 模拟 | `HTML5Backend`/`TouchBackend`，需按设备切换 | 浏览器原生事件 |
| 无障碍 | 键盘拖拽 + 读屏播报，行业领先 | 无内置支持 | 无内置支持 | 完全不支持 |
| 状态管理模型 | React 状态驱动，CSS transform 视觉过渡 | 直接操作真实 DOM 顺序，与虚拟 DOM 有张力 | Redux 风格 monitor + connector | 手写 dragstart/dragover/drop 全套 |
| 周下载量（npm） | 1838 万 | 398 万 | 507 万 | 不适用（浏览器内置） |
| 系统级文件拖拽 | 不支持 | 不支持 | 不支持 | 唯一支持 |
| 多容器/看板 | 无开箱组件，需手动搬运数组 | 内置 `group` 概念开箱支持 | 需自行编排 | 需自行编排 |

**选型结论**：纯 React 项目、看重无障碍与精细定制、可接受多写样板代码 → dnd-kit；需要跨框架复用、或要开箱即用的嵌套多列表分组能力 → Sortable.js；已有大量 react-dnd 存量代码或需要其生态专属组件 → 保留 react-dnd，新项目基本没有理由再选它；"接收操作系统文件拖入浏览器"是硬需求 → 只能原生 HTML5 DnD（可与 dnd-kit 混用：文件拖入区用原生事件，页面内部件排序用 dnd-kit）。

## 六、资源链接

- [dnd-kit 官方文档](https://dndkit.com) —— 注意首页默认展示新架构文档
- [经典 API 文档（Legacy）](https://dndkit.com/legacy/introduction/getting-started/) —— 本笔记覆盖对象
- [DndContext API 文档](https://dndkit.com/legacy/api-documentation/context-provider/dnd-context/)
- [useDraggable API 文档](https://dndkit.com/legacy/api-documentation/draggable/use-draggable/)
- [useDroppable API 文档](https://dndkit.com/legacy/api-documentation/droppable/use-droppable/)
- [DragOverlay API 文档](https://dndkit.com/legacy/api-documentation/draggable/drag-overlay/)
- [Sortable 预设总览](https://dndkit.com/legacy/presets/sortable/overview/)
- [碰撞检测算法](https://dndkit.com/legacy/api-documentation/context-provider/collision-detection-algorithms/)
- [Accessibility 指南](https://dndkit.com/legacy/guides/accessibility/)
- [GitHub 仓库](https://github.com/clauderic/dnd-kit)
- npm 包：[`@dnd-kit/core`](https://www.npmjs.com/package/@dnd-kit/core) / [`@dnd-kit/sortable`](https://www.npmjs.com/package/@dnd-kit/sortable) / [`@dnd-kit/modifiers`](https://www.npmjs.com/package/@dnd-kit/modifiers) / [`@dnd-kit/utilities`](https://www.npmjs.com/package/@dnd-kit/utilities)
- 新架构背景参考：[`@dnd-kit/react`](https://www.npmjs.com/package/@dnd-kit/react)（0.5.0，框架无关重写版，pre-1.0）

---

回到[本叶概览](./index)，或从[入门](./getting-started)重新过一遍主线。
