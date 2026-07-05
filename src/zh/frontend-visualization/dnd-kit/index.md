---
layout: doc
---

# dnd-kit

dnd-kit 是面向 React 的现代化拖拽工具集：以 `useDraggable`/`useDroppable`/`useSortable` 等 Hook 作为核心交互单元，不对原生 HTML5 Drag and Drop API 做封装，而是自建一套基于指针事件的传感器（Sensor）体系，默认支持鼠标/触摸/键盘多种输入方式，并把无障碍访问（键盘拖拽、读屏播报）作为一等公民。当前版本基线：`@dnd-kit/core` **6.3.1**（2024-12-05 发布）+ `@dnd-kit/sortable` **10.0.0** + `@dnd-kit/modifiers` **9.0.0** + `@dnd-kit/utilities` **3.2.2**，均为 MIT 协议。npm 周下载量 `@dnd-kit/core` 1838 万、`@dnd-kit/sortable` 1818 万，远超同类的 `react-dnd`（507 万）与 `sortablejs`（398 万）——是当前 React 生态拖拽方案事实上的主流选择。

## 评价

**优点**

- **Hook 驱动、TypeScript 类型完善**：`useDraggable`/`useDroppable`/`useSortable` 与 React 组件模型天然契合，仅依赖 `tslib`，无其它外部运行时依赖
- **`DragOverlay` 架构级解题**：从根本上规避 `overflow` 裁剪、层叠上下文限制、跨容器/虚拟列表挂载卸载导致拖拽中断等经典难题，并自带放下动画
- **无障碍能力行业领先**：`KeyboardSensor` + `screenReaderInstructions` + `announcements` 三层定制，键盘拖拽与读屏播报开箱支持，是同类库里做得最完整的
- **Sortable 预设覆盖面广**：列表、网格、看板排序场景均有对应策略；`modifiers`/`collisionDetection` 都是可插拔函数，扩展成本低
- **性能友好**：`transform` 走 CSS（`translate3d`）而非重排，硬件加速

**局限**

- **官方文档站现状容易误导**：`dndkit.com` 首页默认展示的是尚在 0.x 阶段的框架无关重写版文档，经典 API 文档被"降级"到 `/legacy/` 路径，初学者/搜索引擎/AI 摘要很容易找错文档、装错包（详见[入门页](./getting-started)的新旧架构说明）
- **多容器（看板）没有开箱即用组件**：`onDragOver` 里手动搬运数组这类状态管理仍要业务代码自己写
- **"支持虚拟化"≠自动接入虚拟滚动**：排序策略只是计算上兼容虚拟化，长列表仍需自行搭配 `react-window`/`@tanstack/react-virtual`
- **不支持系统级/跨窗口拖拽**：跨浏览器窗口、跨 iframe、从操作系统拖文件到浏览器这类原生能力，dnd-kit 完全做不到，仍需原生 HTML5 DnD

纯 React 项目、看重无障碍与精细定制、可以接受多写一些样板代码 → dnd-kit 是默认首选；需要跨框架复用、或需要开箱即用的嵌套多列表分组能力 → 更适合 Sortable.js 系；只有"接收操作系统文件拖入浏览器"是硬需求时才必须用原生 HTML5 DnD。完整选型对比见[参考页](./reference)。

## 本叶地图

- [入门](./getting-started) —— 定位（React 现代拖拽/无障碍优先 vs Sortable.js/react-dnd）、安装与模块划分、第一个 draggable + droppable、新旧架构说明
- [DndContext 与核心 Hooks](./guide-line/context-and-hooks) —— `DndContext` 上下文与生命周期事件、`useDraggable`/`useDroppable`、`DragOverlay`
- [Sortable 预设](./guide-line/sortable-preset) —— `SortableContext` + `useSortable`、`arrayMove`/`arraySwap`、四种排序策略
- [Sensors、Modifiers 与碰撞检测](./guide-line/sensors-modifiers-collision) —— 传感器体系与 `activationConstraint`、坐标修饰符、碰撞检测算法
- [无障碍与实战模式](./guide-line/accessibility-and-patterns) —— 键盘拖拽无障碍全链路、多容器看板、性能与虚拟化、易错点清单
- [参考](./reference) —— Hooks/Props/Sensors/策略速查表 + 选型对比 + 资源链接

## 文档地址

[dnd-kit 官方文档](https://dndkit.com)（注：首页默认展示的是新架构文档，本笔记覆盖的经典 `@dnd-kit/core` 6.x API 文档在 `/legacy/` 路径下）

## GitHub 地址

[clauderic/dnd-kit](https://github.com/clauderic/dnd-kit)

## 幻灯片地址

<a href="/SlideStack/dnd-kit-slide/" target="_blank">dnd-kit</a>
