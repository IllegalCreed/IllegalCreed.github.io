---
layout: doc
outline: [2, 3]
---

# 参考：Options / 事件 / 方法速查

> 基于 Sortable.js v1.15.7（npm 实测最新版）· 核于 2026-07

## 速查

- **创建**：`new Sortable(el, options)` 等价 `Sortable.create(el, options)`；作用对象是容器**直接子元素**，容器标签任意。
- **Options 六组**：基础行为（`group`/`sort`/`delay`/`disabled`/`store`）、动画（`animation`/`easing`）、选择器（`handle`/`filter`/`draggable`/`dataIdAttr`）、三态样式（`ghostClass`/`chosenClass`/`dragClass`）、交换方向（`swapThreshold`/`invertSwap`/`direction`）、Fallback（`forceFallback`/`fallbackOnBody`/`fallbackTolerance`）。
- **group**：字符串简写（值相同即互拖）或对象 `{name, pull, put}`；`pull`/`put` 支持 `true`/`false`/数组白名单/`'clone'`/函数式。
- **事件**：结果性事件 `onAdd`/`onUpdate`/`onRemove`（互斥）+ `onSort`（三者任一都触发的总闸）；`onEnd` 字段最全；`onMove` 返回值 `false`/`-1`/`1`/`true` 控制插入行为。
- **方法**：`option`/`toArray`/`sort`/`save`/`destroy`；`destroy()` 组件卸载必调，防内存泄漏。
- **插件**：`MultiDrag`（多选拖拽）、`Swap`（交换而非插入），均需 `Sortable.mount()` 显式挂载，否则静默不生效。
- **框架**：Vue 用 `vuedraggable`（Vue2/Vue3 同包不同 dist-tag）；React 用 `react-sortablejs`（官方自曝未达生产就绪）；Angular 用 `ngx-sortablejs`。
- **模块化引入**：默认版（含 Default 插件）/ `sortable.core.esm.js`（无插件，最小体积）/ `sortable.complete.esm.js`（全插件）。
- **选型口径**：多框架并存/常规列表排序 → Sortable.js；纯 React + 强可访问性/精细碰撞检测 → dnd-kit。
- **头号坑**：`handle` 指向容器自身、忘记对齐两个列表的 `group`、插件忘记 `mount()`、React key 用数组下标、IE/Edge 下 `delay` 失效、`vuedraggable@next` 漏加 `@next`。

## 一、Options 速查表

### 基础行为类

| Option | 默认值 | 说明 |
| --- | --- | --- |
| `group` | `undefined` | 字符串或 `{name, pull, put}` 对象，控制跨列表拖放 |
| `sort` | `true` | 是否允许列表内排序 |
| `delay` | `0` | 拖拽开始前的延迟（ms） |
| `delayOnTouchOnly` | `false` | 仅触摸设备生效延迟 |
| `touchStartThreshold` | `0` | px，延迟拖拽被取消前允许的指针移动距离 |
| `disabled` | `false` | 禁用整个 sortable 实例 |
| `store` | `null` | 持久化排序状态的读写接口（`get`/`set`） |

### 动画类

| Option | 默认值 | 说明 |
| --- | --- | --- |
| `animation` | `150` | ms，排序动画速度，`0` = 无动画 |
| `easing` | `"cubic-bezier(1, 0, 0, 1)"` | 动画缓动函数 |

### 选择器类

| Option | 默认值 | 说明 |
| --- | --- | --- |
| `handle` | `undefined` | 拖拽手柄选择器 |
| `filter` | `undefined` | 不可拖拽元素选择器（字符串或函数） |
| `preventOnFilter` | `true` | filter 触发时是否 `event.preventDefault()` |
| `draggable` | `undefined` | 指定容器内哪些子元素可拖拽 |
| `dataIdAttr` | `"data-id"` | `toArray()` 读取的 HTML 属性名 |

### 三态样式类

| Option | 默认值 | 说明 |
| --- | --- | --- |
| `ghostClass` | `"sortable-ghost"` | 占位符（拖拽目标位置）的 CSS 类 |
| `chosenClass` | `"sortable-chosen"` | 被选中项的 CSS 类 |
| `dragClass` | `"sortable-drag"` | 正在拖拽项的 CSS 类 |

### 交换与方向类

| Option | 默认值 | 说明 |
| --- | --- | --- |
| `swapThreshold` | `1` | 交换区域阈值（0~1 浮点数） |
| `invertSwap` | `false` | 是否反转交换区域 |
| `invertedSwapThreshold` | 等于 `swapThreshold` | 反转交换区阈值 |
| `direction` | 自动探测 | `'vertical'` \| `'horizontal'` \| 函数 |

### Fallback 与其他

| Option | 默认值 | 说明 |
| --- | --- | --- |
| `forceFallback` | `false` | 强制启用 Fallback 模式 |
| `fallbackClass` | `"sortable-fallback"` | Fallback 模式下克隆元素的类名 |
| `fallbackOnBody` | `false` | 克隆元素是否挂载到 `document.body` |
| `fallbackTolerance` | `0` | px，判定"开始拖拽"所需的最小移动量 |
| `dragoverBubble` | `false` | `dragover` 事件是否向父级 sortable 冒泡 |
| `removeCloneOnHide` | `true` | 隐藏克隆元素时是否直接移除 DOM |
| `emptyInsertThreshold` | `5` | px，鼠标离空列表多近才会被插入 |
| `setData` | 内置默认实现 | 自定义 `DataTransfer` 内容 |

## 二、事件速查表

| 事件 | 触发时机 | 事件对象关键字段 |
| --- | --- | --- |
| `onChoose` | 元素被选中（mousedown/tapstart） | `oldIndex` |
| `onUnchoose` | 取消选中 | 同 `onEnd` |
| `onStart` | 开始拖拽 | `oldIndex` |
| `onEnd` | 拖拽结束（字段最全） | `item`/`to`/`from`/`oldIndex`/`newIndex`/`oldDraggableIndex`/`newDraggableIndex`/`clone`/`pullMode` |
| `onAdd` | 元素从其他列表拖入本列表 | 同 `onEnd` |
| `onUpdate` | 同列表内排序改变 | 同 `onEnd` |
| `onRemove` | 元素被拖到其他列表 | 同 `onEnd` |
| `onSort` | add/update/remove 任一种变化（总闸） | 同 `onEnd` |
| `onFilter` | 尝试拖拽了被 filter 排除的元素 | `item` |
| `onMove` | 拖拽移动过程中持续触发 | `dragged`/`draggedRect`/`related`/`relatedRect`/`willInsertAfter`；返回值 `false`/`-1`/`1`/`true` |
| `onClone` | 元素被克隆时 | `item`（原元素）/`clone`（克隆） |
| `onChange` | 拖拽过程中位置变化（未松手） | `newIndex` |

## 三、方法、静态属性与工具集速查

### 实例方法

| 方法 | 说明 |
| --- | --- |
| `option(name[, value])` | 读写单个配置项 |
| `toArray()` | 按 `dataIdAttr` 序列化当前顺序为字符串数组 |
| `sort(order, useAnimation)` | 按给定顺序编程式重排 |
| `save()` | 触发 `store.set()` 持久化当前顺序 |
| `destroy()` | 彻底移除功能、解绑监听器（组件卸载必调） |

### 静态方法与属性

| API | 说明 |
| --- | --- |
| `Sortable.create(el, options)` | 创建实例，等价 `new Sortable` |
| `Sortable.get(element)` | 获取元素上绑定的 Sortable 实例 |
| `Sortable.mount(plugin1, plugin2)` | 挂载插件（也接受数组） |
| `Sortable.active` | 当前活跃的 Sortable 实例 |
| `Sortable.dragged` | 正在被拖拽的 HTMLElement |
| `Sortable.ghost` | 幽灵（占位）元素 |
| `Sortable.clone` | 克隆元素 |

### `Sortable.utils`（自定义插件/深度定制）

`on`/`off`/`css`/`find`/`is`/`closest`/`clone`/`toggleClass`/`detectDirection`/`index`/`getChild`。

## 四、插件速查表

| 插件 | 类别 | 关键 Option | 关键事件字段 |
| --- | --- | --- | --- |
| `AutoScroll` | Default（默认版内置） | 自动滚动容器/页面，一般无需额外配置 | — |
| `OnSpill` | Default（默认版内置） | 拖出有效区域后的处理策略 | — |
| `MultiDrag` | Extra（需 `mount`） | `multiDrag`/`selectedClass`/`multiDragKey`/`avoidImplicitDeselect` | `onSelect`/`onDeselect`；`onEnd` 的 `oldIndicies`/`newIndicies`/`items`/`clones` |
| `Swap` | Extra（需 `mount`） | `swap`/`swapClass` | `onEnd.swapItem` |

**必记**：`MultiDrag`/`Swap` 忘记 `Sortable.mount()`，相关 option 不报错但静默不生效。

## 五、框架集成速查对照

| 维度 | vuedraggable（Vue2） | vuedraggable@next（Vue3） | react-sortablejs | ngx-sortablejs |
| --- | --- | --- | --- | --- |
| 最新版本 | `2.24.3` | `4.1.0` | `6.1.4` | `11.1.0` |
| 支持框架版本 | Vue 2 | Vue 3（**安装须显式加 `@next`**） | React（配套 `Sortable`/`MultiDrag`/`Swap` 导出） | Angular `^11.0.0` |
| 安装包名 | `vuedraggable`（同包不同 dist-tag） | `vuedraggable@next` | `react-sortablejs` | `ngx-sortablejs`（原名 `angular-sortablejs`） |
| 列表渲染写法 | 默认 slot + `v-for` | 具名 `item` slot + `item-key` 必填 | `list`/`setList` 受控 + `.map()` | `*ngFor` |
| 数据绑定 | `v-model` | `v-model` | `list` / `setList`（受控） | 标准数组或 `FormArray` |
| item 唯一标识 | `:key="element.id"` | `item-key="id"` | **必须 `id` 字段，禁用数组下标** | 无强制要求 |
| 综合事件 | 无 | `change`（`added`/`removed`/`moved`） | 无对应综合事件 | 无 |
| 生产就绪度声明 | 稳定维护 | 稳定维护 | **官方自曝"not ready for production"** | 稳定维护 |
| 维护状态 | 纯维护（末次发布 2020-10） | 活跃 | 活跃 | 活跃 |

## 六、易错点清单

- **虚拟 DOM 冲突**：不用官方框架封装、自己手写 `onEnd` 直接改数组，容易出现"DOM 顺序"与"数据顺序"不一致；封装库的解法是先放行 DOM 操作，事件触发后框架接管重渲染纠正 DOM。
- **React key 用数组下标**：`react-sortablejs` 官方明确警告"Never use array index as key"，会导致拖拽后组件复用错乱、动画/状态错位。
- **`handle` 选择器指向容器自身**：必须是子元素内部的选择器，配置成整个 item 或容器会让手柄限制形同虚设。
- **忘记设置或对齐 `group`**：两个列表要互拖，`name` 必须完全一致，漏配表现为"能拖起来但放不进去"。
- **忘记调用 `destroy()`**：SPA 路由切换、组件卸载时不销毁实例，是常见内存泄漏点。
- **嵌套 sortable 默认不工作**：需要 `fallbackOnBody: true` + 调低 `swapThreshold`（约 `0.65`），否则内外层容器拖拽判定互相干扰。
- **IE/Edge 下 `delay` 不生效**：官方 README 原文警告，需用 `forceFallback` 规避。
- **`vuedraggable`(Vue2) 内部锁定 `sortablejs@1.10.2`**：与项目独立安装的新版 `sortablejs` 混用时要留意 API 细微差异。
- **`preventOnFilter` 默认 `true`**：filter 排除的元素上有 checkbox/input 等控件时，默认行为会拦截其点击事件，需显式设 `false`。
- **插件未 `mount` 静默失效**：`MultiDrag`/`Swap` 忘记 `Sortable.mount()`，相关 option 不报错但完全不生效。
- **`vuedraggable@next` 安装漏加 `@next`**：Vue3 场景直接 `npm i vuedraggable` 会装成 Vue2 版本。
- **动画与性能**：大列表（几百项）`animation` 设置过高会有明显卡顿，需虚拟滚动或降低/关闭动画。
- **`react-sortablejs` 生产可用性**：官方自曝"not considered ready for production"，选型前应评估此风险声明，而非想当然认为"有官方封装就等于生产级"。

## 七、选型对比

### vs 原生 HTML5 Drag & Drop API

原生 API 需要手动处理 `dragstart`/`dragover`/`dragenter`/`drop` 等一整套事件、自行维护占位符与索引计算逻辑，且**移动端触摸完全不支持**原生 HTML5 DnD。Sortable.js 把这套底层事件封装为语义化的 `options` + `events`，并内置触摸设备的 Fallback 模拟拖拽，开箱即用，显著降低实现列表重排序的门槛。

### vs dnd-kit（`@dnd-kit/core`，React 专属）

| 维度 | Sortable.js | dnd-kit |
| --- | --- | --- |
| 适用框架 | 框架无关（vanilla 核心 + 各框架封装层） | 仅 React |
| 底层机制 | 原生 HTML5 Drag & Drop API（+ Fallback 模拟触摸） | 自建指针事件系统（不依赖原生 HTML5 DnD） |
| 可访问性 | 无内置键盘拖拽支持 | 内置键盘导航等可访问性支持，官方主打差异化卖点 |
| 定制粒度 | Options + Events 声明式配置，够用但较"整体" | Hooks 化 API（`useDraggable`/`useDroppable`），可自定义碰撞检测算法 |
| 生态体量（周下载量） | 约 398 万（`sortablejs` 本体） | 约 1838 万（`@dnd-kit/core`，仅 React 场景可比，量级差异部分源于 React 生态基数） |
| 版本节奏 | 低频维护（近 14 个月才出新版），API 长期稳定 | 相对更活跃 |
| 官方自身定位 | 对比页仅列出 jQuery-UI、Dragula 为"竞品"，未提及 dnd-kit | 定位为"现代 React 拖拽工具包" |

**结论**：纯 React 技术栈、需要强可访问性（键盘拖拽）、要自定义碰撞检测算法或做复杂拖拽交互（看板/多层嵌套+虚拟化），优先 dnd-kit；多框架并存（Vue/Angular/vanilla）或只是要"给列表加个拖拽排序"的常规需求，Sortable.js 更简单省心、生态封装更成熟（尤其 Vue 生态的 `vuedraggable`）。

### vs 框架方案（Vue.Draggable 系）

`vuedraggable`（Vue2，`2.24.3`）已 4 年多未发大版本（末次发布 2020-10），处于纯维护状态，胜在稳定成熟；`vuedraggable@next`（Vue3，`4.1.0`）是同一 npm 包的不同 dist-tag，而非独立包名，安装时容易漏掉 `@next` 后缀装错版本。小众方案 `vue3-sortablejs`（`1.0.7`）走指令式路线（`v-sortable`），非 `v-model` 组件式，下载量远低于 `vuedraggable`，非主流首选。Angular 生态的 `ngx-sortablejs`（`11.1.0`）延续原生 options 透传模式，还额外支持 Angular `FormArray`，是 Angular 项目的稳妥选择。本仓库技术栈是 Vue 3，`vuedraggable@next` 是对应的官方集成方案。

## 八、权威链接

- [Sortable.js 官方示例站](https://sortablejs.github.io/Sortable/) —— Features/Examples/Plugins/Comparisons/Framework Support 导航
- [GitHub: SortableJS/Sortable](https://github.com/SortableJS/Sortable) —— 源码与 README（主文档信源）
- [GitHub: SortableJS/vue.draggable.next](https://github.com/SortableJS/vue.draggable.next) —— Vue3 封装 README
- [GitHub: SortableJS/Vue.Draggable](https://github.com/SortableJS/Vue.Draggable) —— Vue2 封装 README
- [GitHub: SortableJS/react-sortablejs](https://github.com/SortableJS/react-sortablejs) —— React 封装 README（含生产就绪度自我声明）
- [GitHub: SortableJS/angular-sortablejs](https://github.com/SortableJS/angular-sortablejs) —— 即 `ngx-sortablejs`，Angular 封装 README
- [npm: sortablejs](https://www.npmjs.com/package/sortablejs) ｜ [npm: vuedraggable](https://www.npmjs.com/package/vuedraggable) ｜ [npm: react-sortablejs](https://www.npmjs.com/package/react-sortablejs) ｜ [npm: ngx-sortablejs](https://www.npmjs.com/package/ngx-sortablejs)
- [npm: @dnd-kit/core](https://www.npmjs.com/package/@dnd-kit/core) —— 选型对比对象
