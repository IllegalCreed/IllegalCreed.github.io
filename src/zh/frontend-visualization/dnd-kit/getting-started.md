---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个拖拽

> 基于 @dnd-kit/core 6.3.1（npm 实测最新版）· 核于 2026-07

## 速查

- **一句话定位**：dnd-kit 是 React 专用、Hook 驱动的拖拽工具集，**不是**对原生 HTML5 Drag and Drop API 的封装，而是自建了一套基于指针事件的传感器体系。
- **版本基线**：`@dnd-kit/core` 6.3.1 / `@dnd-kit/sortable` 10.0.0 / `@dnd-kit/modifiers` 9.0.0 / `@dnd-kit/utilities` 3.2.2，均 MIT 协议。
- **生态地位**：`@dnd-kit/core` 周下载量 1838 万，远超 `react-dnd`（507 万）、`sortablejs`（398 万），是 React 拖拽方案事实标准。
- **三包职责划分**：`core`（必装，Context/Hooks/Sensors）/ `sortable`（可选，排序预设）/ `modifiers`（可选，坐标修饰符）；`utilities` 会作为依赖自动装入，一般无需单独安装。
- **核心约束**：用到 `useDraggable`/`useDroppable`/`DragOverlay` 的组件都必须嵌套在 `DndContext` 内部；支持嵌套多个相互独立的 `DndContext`。
- **`useDraggable` 最小用法**：`setNodeRef` + `listeners` + `attributes` + `transform` 四件套。
- **`useDroppable` 最小用法**：`setNodeRef` + `isOver` 两件套。
- **`id` 规则**：只需在同类型（draggable 或 droppable）内唯一，draggable 与 droppable 可以共享同一个 `id`。
- **`onDragEnd` 语义**：回调参数 `event.active` 是被拖拽项，`event.over` 是当前悬停的可放置项，**`over` 可能为 `null`**（没有落在任何 droppable 上）。
- **`transform` 应用**：配合 `@dnd-kit/utilities` 的 `CSS.Translate.toString(transform)` 生成 CSS `transform` 字符串，无需手写 `translate3d`。
- **新旧架构**：作者正在开发框架无关的重写版（`@dnd-kit/react`/`@dnd-kit/dom`/`@dnd-kit/abstract`，当前 0.5.0，pre-1.0），官方站点首页默认展示这套新文档，**经典 API 文档在 `/legacy/` 路径下**。
- **本系列笔记覆盖范围**：经典 `@dnd-kit/core` 6.x + `@dnd-kit/sortable` 10.x 技术栈（`DndContext`/`useDraggable`/`useDroppable`/`DragOverlay`/`SortableContext`/`useSortable`/`PointerSensor` 等），新架构仅在本页末尾作背景介绍。
- **进阶顺序**：本页 → [DndContext 与核心 Hooks](../guide-line/context-and-hooks) → [Sortable 预设](../guide-line/sortable-preset) → [Sensors、Modifiers 与碰撞检测](../guide-line/sensors-modifiers-collision) → [无障碍与实战模式](../guide-line/accessibility-and-patterns) → [参考](../reference)。

## 一、定位：dnd-kit 是什么，为什么是主流选择

**一句话定位**：dnd-kit 是面向 React 的拖拽工具集，以 `useDraggable`/`useDroppable`/`useSortable` 等 Hook 作为核心交互单元，无外部运行时依赖，默认支持指针/鼠标/触摸/键盘多种输入方式，把无障碍访问作为一等公民。它区别于早期方案的关键设计是：**不依赖浏览器原生 HTML5 Drag and Drop API**，而是自建了一套基于指针事件（Pointer Events）的传感器（Sensor）系统来统一处理各种输入设备。

面对同类方案时的选型口径（详细对比表见[参考页](../reference)）：

- **vs Sortable.js**（框架无关、直接操作真实 DOM）：Sortable.js 零依赖、上手快，天然支持嵌套/多列表拖拽（内置 `group` 概念），但 React 封装是社区包而非官方一等公民，键盘/读屏支持薄弱。dnd-kit 状态完全由 React 管理，不直接操作真实 DOM 顺序，无障碍是核心设计目标。纯 React 项目、看重无障碍 → dnd-kit；需要跨框架复用、或要开箱即用的嵌套多列表分组 → Sortable.js。
- **vs react-dnd**（更早期方案，约 2015 年起）：react-dnd 采用 Flux/Redux 风格的 monitor + connector 模式，依赖 `HTML5Backend`/`TouchBackend`，需要按输入设备切换 backend，API 偏底层、样板代码较多。dnd-kit 用单一 Sensor 体系统一处理鼠标/触摸/键盘，Hook API 更现代，`transform` 走 CSS 硬件加速性能更好。新项目基本没有理由再选 react-dnd，除非已有大量存量代码。
- **vs 原生 HTML5 Drag and Drop API**：原生 API 是唯一能接住"从操作系统拖文件到浏览器""跨浏览器窗口拖拽"这类原生能力的方案（dnd-kit 完全做不到），但移动端触摸支持长期残缺、完全没有键盘/读屏支持。只有"接收操作系统文件拖入浏览器"是硬需求时才必须用原生 API（甚至可与 dnd-kit 混用）；纯 Web 应用内的部件拖拽排序场景，dnd-kit 全面胜出。

## 二、安装与模块划分

dnd-kit 按功能拆成多个独立 npm 包，按需安装：

```bash
npm install @dnd-kit/core       # 必装：Context Provider、useDraggable/useDroppable、DragOverlay、Sensors
npm install @dnd-kit/sortable   # 可选：排序预设（SortableContext/useSortable/arrayMove）
npm install @dnd-kit/modifiers  # 可选：坐标修饰符（restrictToVerticalAxis 等）
```

`@dnd-kit/utilities` 会作为 `core`/`sortable`/`modifiers` 的依赖被自动安装，提供 `CSS` 助手等通用工具，一般无需单独 `install`。只做基础的单容器拖拽只需要 `core`；需要"列表/网格/看板排序"再加 `sortable`；需要"限制拖拽范围/网格吸附"再加 `modifiers`。开发预览版可用 `@next` 标签追踪最新特性。

## 三、第一个 draggable + droppable

准备好一个可拖拽组件、一个可放置组件，再用 `DndContext` 把它们包起来，就是最小可用的拖拽应用：

```jsx
import { useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// 可拖拽组件：setNodeRef 绑定 DOM 节点，listeners/attributes 负责事件与无障碍属性
function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "draggable",
  });
  const style = {
    // CSS.Translate 只应用位移、忽略缩放，是最常见的拖拽样式写法
    transform: CSS.Translate.toString(transform),
  };
  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}

// 可放置组件：isOver 用于悬停时变更视觉反馈
function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({ id: props.id });
  const style = { color: isOver ? "green" : undefined };
  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}

function App() {
  const [isDropped, setIsDropped] = useState(false);

  // event.over 为 null 表示没有落在任何 droppable 上，必须判空
  function handleDragEnd(event) {
    if (event.over && event.over.id === "droppable") {
      setIsDropped(true);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {!isDropped ? <Draggable>拖我</Draggable> : null}
      <Droppable id="droppable">
        {isDropped ? <Draggable>拖我</Draggable> : "放这里"}
      </Droppable>
    </DndContext>
  );
}
```

几个第一次接触就该记住的事实：

- `DndContext` 是拖拽应用的根组件，通过 React Context 让 `useDraggable`/`useDroppable`/`DragOverlay` 之间共享内部状态；不嵌套在其内部使用会直接报错或不生效。
- `id` 只需在**同类型**内唯一——上面例子里 draggable 与 droppable 各自独立存储 id，允许同名。
- 这里只做了最基础的"拖到目标里变个状态"，真实项目里通常还需要 `DragOverlay`（下一页详解）、`Sensors` 精细控制激活条件、`SortableContext` 排序等能力，这些都在后续几页展开。

## 四、新旧架构：不要被官网首页搞混（重要背景）

调研中发现一个容易踩坑的现状，务必知晓：dnd-kit 作者正在开发一套**全新的、框架无关**的重写版本，包名为 `@dnd-kit/abstract` + `@dnd-kit/dom` + `@dnd-kit/react`（还有 `@dnd-kit/vue`/`@dnd-kit/svelte`/`@dnd-kit/solid`），当前均为 **0.5.0**（pre-1.0，早期阶段）。

新架构的核心概念与经典版**完全不同**：

- 核心是 `DragDropManager`/`Draggable`/`Droppable`/`Sortable` 等类，React 侧提供 `DragDropProvider` 作为上下文组件。
- 新架构也导出名为 `useDraggable`/`useDroppable`/`useSortable` 的 Hook——**名字和经典版相同，但来自 `@dnd-kit/react` 包、API 完全不同**，照抄经典版用法在新架构下会直接报错或行为不符预期。
- Sensor 也从 `core` 里搬到了 `@dnd-kit/dom`。
- `@dnd-kit/react` 周下载量仅 84.9 万（约为 `@dnd-kit/core` 的 4.6%），仍处于早期采用阶段，远未达到经典版的生态规模。

更容易踩坑的是官方文档站的现状：`docs.dndkit.com` 整站 301 重定向到 `dndkit.com`，且**首页默认展示的就是这套新重写版文档**（导航为 Concepts: DragDropManager/Draggable/Droppable/Sortable + Extend: Plugins/Sensors/Modifiers）。经典 API 文档被移到了 **`/legacy/` 路径下**，页面顶部虽有 "Latest" / "Legacy" 切换，但直接搜索引擎跳转、AI 摘要引用大概率落在新架构页面上，容易让初学者装错包（`@dnd-kit/react` vs `@dnd-kit/core`）、学错 API。

**本系列笔记覆盖的是当前 npm `latest` 标签、仍承接绝大多数下载量、"dnd-kit" 在实际项目里通常所指的经典技术栈**：`@dnd-kit/core@6.x` + `@dnd-kit/sortable@10.x` + `@dnd-kit/modifiers@9.x` + `@dnd-kit/utilities@3.x`。查阅官方资料时认准 `/legacy/` 路径下的内容；新重写版目前仅作为背景知识了解即可，不必急于跟进。

理解了 dnd-kit 的定位、安装方式与第一个最小示例，下一页从核心的 [DndContext 与 Hooks](../guide-line/context-and-hooks) 讲起，深入 `DndContext` 的完整 Props、`useDraggable`/`useDroppable` 的返回值细节，以及 `DragOverlay` 的正确用法。
