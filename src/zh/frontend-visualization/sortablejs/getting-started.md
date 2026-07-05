---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个排序列表

> 基于 Sortable.js v1.15.7（npm 实测最新版）· 核于 2026-07

## 速查

- **一句话定位**：Sortable.js 是**轻量、零第三方依赖**的可拖拽重排序库，基于原生 **HTML5 Drag & Drop API** 实现桌面拖拽，移动端等不支持该 API 的场景自动降级为 **Fallback 模拟拖拽**。
- **选型速览**：
  - vs **原生 HTML5 DnD API**：原生 API 要手写 `dragstart`/`dragover`/`dragenter`/`drop` 一整套事件、自行维护占位符与索引计算，且**移动端触摸完全不支持**；Sortable.js 把这些封装成 `options` + `events`，开箱即用。
  - vs **dnd-kit**（React 专属现代方案）：dnd-kit 基于自建指针事件系统（不依赖原生 DnD）、内置键盘可访问性、Hooks 化 API 定制粒度更细，但仅服务 React 生态；Sortable.js 框架无关（vanilla 核心 + 各框架封装层），无内置键盘拖拽。纯 React 栈要极致定制/可访问性优先 dnd-kit，多框架并存或常规列表排序需求优先 Sortable.js（详见[参考页](./reference)选型对比表）。
- **安装**：`npm install sortablejs --save`；也支持 `bower install --save sortablejs`；原型验证可用 CDN（jsDelivr）。
- **模块化引入（1.15+ 支持）**：默认版（含 `AutoScroll`/`OnSpill` 默认插件）/ 核心版 `sortable.core.esm.js`（无任何插件，体积最小）/ 完整版 `sortable.complete.esm.js`（含 `MultiDrag`/`Swap` 等全部插件）三选一，也可在核心版基础上按需 `Sortable.mount()` 挂载额外插件（cherry-pick）。
- **创建方式**：`new Sortable(el, options)` 与 `Sortable.create(el, options)` 完全等价，后者是静态方法语法糖。
- **作用对象**：容器的**直接子元素**，容器标签任意（`div`/`ul` 皆可，不限 `<ul>`/`<li>`），可用 `draggable` 选项收窄参与拖拽的子元素范围。
- **最小心智模型**：Sortable 直接操作真实 DOM 节点顺序，不经过任何虚拟 DOM。配置分两条轨道——**Options**（声明式，创建时设定行为）与 **Events**（命令式回调，行为发生时通知业务代码），二者配合才是完整用法。
- **`sort` 选项**：控制列表内是否允许重新排序，默认 `true`；设 `false` 时列表内不可重排（但仍可能是拖入/拖出的目标，视 `group` 配置而定）。
- **`animation` 选项**：排序过渡动画时长（单位 ms），`0` 为无动画，默认 `150`。
- **三态样式类**：`ghostClass`（占位符所在位置）/ `chosenClass`（被选中项）/ `dragClass`（正在拖拽中的项），下一页详解配套 CSS 写法。
- **`handle`/`draggable` 两个选择器选项**：`handle` 限定拖拽必须从指定手柄元素发起；`draggable` 限定容器内哪些子元素可被拖拽——二者语义不同，容易混淆，下一页详解。
- **跨列表最简用法**：两个列表 `group` 配置为相同字符串即可互拖，更精细的 `pull`/`put`/克隆控制见[group 与事件](./guide-line/group-and-events)。
- **`destroy()` 的必要性**：SPA 路由切换、组件卸载时必须调用，否则内部监听器与引用残留会造成内存泄漏。
- **移动端**：不支持原生 HTML5 DnD 的触摸设备自动走 Fallback 模拟拖拽，**无需任何额外代码**；`delay`/`delayOnTouchOnly`/`touchStartThreshold` 用于精细控制触摸拖拽的启动时机，详见[Options 与样式](./guide-line/options-and-styling)。
- **框架集成一句话**：Vue 用 `vuedraggable`（Vue2/Vue3 是同一个 npm 包，靠 `@next` dist-tag 区分）；React 用官方 `react-sortablejs`（README 原文自曝"尚不适合生产环境使用"）；Angular 用 `ngx-sortablejs`；详见[方法、插件与框架集成](./guide-line/methods-plugins-framework)。
- **进阶顺序**：本页 → [Options 与样式](./guide-line/options-and-styling) → [group 跨列表与事件](./guide-line/group-and-events) → [方法、插件与框架集成](./guide-line/methods-plugins-framework) → [参考](./reference)。

## 一、定位：轻量拖拽库 vs 原生 HTML5 DnD vs dnd-kit

浏览器原生就带一套 **HTML5 Drag and Drop API**（`draggable` 属性 + `dragstart`/`dragover`/`dragenter`/`dragleave`/`drop`/`dragend` 一系列事件），理论上不需要任何库就能做拖拽排序。但实际写过一遍就会发现代价不小：要自己算"拖到了哪两个元素之间"、自己维护占位符 DOM、自己在 `drop` 时更新数据顺序，而且这套 API 在**移动端触摸设备上完全不支持**，意味着还得为触摸场景另写一套手势逻辑。

Sortable.js 的核心价值就是把这套底层事件封装成两类声明式接口：

- **Options**：`group`/`sort`/`animation`/`handle`/`draggable` 等配置项，描述"允许什么、长什么样"。
- **Events**：`onAdd`/`onUpdate`/`onRemove`/`onSort`/`onEnd` 等回调，描述"发生了什么、该怎么响应"。

同时内置了触摸设备的 **Fallback 模拟拖拽**——检测到浏览器/设备不支持原生 DnD（或显式 `forceFallback: true`）时，用 `mousedown`/`touchstart` 等指针事件模拟出一致的拖拽体验，业务代码不需要区分桌面/移动端分别处理。

面对同类方案时的选型口径：

- **vs 原生 HTML5 DnD API**：只有在完全不想引入任何依赖、且能接受自己填移动端兼容坑的场景才考虑手写原生 API；一旦需要跨列表拖放、动画过渡、移动端支持，自己实现的成本很快会超过引入一个几十 KB 的库。
- **vs dnd-kit**（`@dnd-kit/core`，React 专属）：dnd-kit 不依赖原生 HTML5 DnD，而是自建了一套基于指针事件的传感器系统，天生支持键盘拖拽等可访问性能力，`useDraggable`/`useDroppable` 等 Hooks 化 API 也更方便自定义碰撞检测算法；但它只服务 React 一个框架。Sortable.js 框架无关（vanilla 核心 + Vue/React/Angular 等封装层），API 是"配置 + 事件"的声明式风格，够用但整体性更强、精细定制空间不如 dnd-kit。**纯 React 技术栈、需要强键盘可访问性或复杂碰撞检测时优先 dnd-kit；多框架并存或只是要给列表加拖拽排序的常规需求，Sortable.js 更省心**。

本仓库技术栈是 Vue 3，对应的官方集成方案是 `vuedraggable@next`，会在[方法、插件与框架集成](./guide-line/methods-plugins-framework)详细展开。

## 二、安装与引入

最基础的安装只需要一个包：

```bash
npm install sortablejs --save
# 或使用 Bower
bower install --save sortablejs
```

原型验证、无构建工具的页面可以直接用 CDN：

```html
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
```

生产环境建议把 `@latest` 换成锁定的具体版本号（如 `@1.15.7`），并自行生成 `integrity="sha384-…"` + `crossorigin="anonymous"` 两个属性，避免上游发新版时不可预期地影响线上行为，也防止 CDN 被劫持后静默篡改脚本内容。

**1.15+ 起支持按需的模块化引入**，根据是否需要 `MultiDrag`/`Swap` 等 Extra 插件，可以选择不同的入口文件来控制体积：

```javascript
// 默认版：含 AutoScroll、OnSpill 两个 Default 插件（开箱可用，体积适中）
import Sortable from "sortablejs";

// 核心版：不含任何默认插件，体积最小，适合对包体积极度敏感的场景
import Sortable from "sortablejs/modular/sortable.core.esm.js";

// 完整版：含 MultiDrag、Swap 等全部 Extra 插件，功能最全
import Sortable from "sortablejs/modular/sortable.complete.esm.js";

// 按需挂载额外插件（cherry-pick）：只用得到什么就装什么
import Sortable, { MultiDrag, Swap } from "sortablejs";
Sortable.mount(new MultiDrag(), new Swap());

// 核心版 + 按需挂载 Default 插件（想要最小体积又想手动开启自动滚动）
import Sortable, { AutoScroll } from "sortablejs/modular/sortable.core.esm.js";
Sortable.mount(new AutoScroll());
```

日常业务直接用默认版即可；只有确实要用 `MultiDrag`（多选拖拽）或 `Swap`（交换而非插入）这类 Extra 插件时，才需要考虑走完整版或手动 `mount()`——这两类插件的具体用法在[方法、插件与框架集成](./guide-line/methods-plugins-framework)详细介绍。

## 三、第一个排序列表

Sortable.js 的最小可用代码只需要两步：准备好一个容器 + 直接子元素的 HTML 结构，然后 `new Sortable(el, options)`。

```html
<ul id="items">
  <li>item 1</li>
  <li>item 2</li>
  <li>item 3</li>
</ul>
```

```javascript
// 方式一：构造函数（最常见写法）
var el = document.getElementById("items");
var sortable = new Sortable(el, {
  animation: 150, // 排序过渡动画 150ms
  ghostClass: "sortable-ghost", // 占位符（拖拽目标位置）的 CSS 类
});

// 方式二：静态方法，与方式一完全等价，属于语法糖
var sortable2 = Sortable.create(el, { animation: 150 });
```

到这里，`#items` 下的三个 `<li>` 就已经可以互相拖拽重排序了，不需要手写任何 `dragstart`/`drop` 事件。几个第一次接触就该记住的事实：

- 作用元素**不限于 `<ul>`/`<li>`**，任意容器 + 直接子元素皆可，`<div>` 也完全可以。
- 默认操作对象是容器的**直接子元素**；如果容器里混杂了不该参与排序的元素（如分隔线、标题），可以用 `draggable` 选项传入选择器收窄范围，例如 `draggable: ".item"`。
- 上面例子里没有写任何"顺序变化后怎么办"的逻辑——真实项目里几乎总要在 `onEnd`/`onSort` 回调里同步这份新顺序到业务数据（数组/后端），这一点在下一节展开。

## 四、心智模型：Options + Events 双轨、直接操作真实 DOM

理解 Sortable.js 最关键的一点是：**它直接移动真实 DOM 节点，本身不维护、也不关心任何"数据模型"**。拖拽结束后，浏览器里 `<li>` 的顺序确实变了，但如果业务代码背后还有一份 JS 数组或 Vue/React 的响应式状态在描述"应该是什么顺序"，这份数据不会自动跟着变——除非在事件回调里显式同步。

因此使用 Sortable.js 的完整心智模型总是两条轨道叠加：

1. **Options 轨道（声明式）**：创建实例时通过配置项描述"允许拖到哪里、长什么样、快慢如何"——例如 `group`（能不能跨列表）、`sort`（能不能列表内重排）、`animation`（动画时长）、`handle`/`draggable`（谁能拖、从哪拖）。这条轨道决定的是"规则"。
2. **Events 轨道（命令式回调）**：`onStart`/`onEnd`/`onAdd`/`onUpdate`/`onRemove`/`onSort` 等回调在拖拽的不同阶段被触发，携带 `item`/`from`/`to`/`oldIndex`/`newIndex` 等信息。这条轨道是业务代码"感知变化、同步数据"的唯一入口。

一个只配置 Options 不监听任何 Events 的 Sortable 实例，视觉上完全能拖能排，但业务数据永远不知道发生了什么——这是初学者最容易忽略的一点。规范的用法是：**Options 定义规则，Events 里读取 `oldIndex`/`newIndex`（或调用 `toArray()`）把新顺序写回数据源**。这也是为什么框架封装层（`vuedraggable`/`react-sortablejs`）存在的意义——它们把"监听事件 → 同步数据 → 触发重新渲染 → 修正 DOM"这一整套协调工作封装好了，业务代码只需要绑定 `v-model`/`list`/`setList`，不必手写回调。这部分协调机制的细节，以及 Sortable 直接操作 DOM 与框架虚拟 DOM 之间的具体张力，会在[方法、插件与框架集成](./guide-line/methods-plugins-framework)的易错点小节展开。

理解了这套"容器 + 直接子元素"的作用对象、"Options + Events"的双轨配置模型，下一页就从完整的 options 清单、三态样式类、拖拽手柄与过滤讲起：[Options 与样式](./guide-line/options-and-styling)。
