---
layout: doc
outline: [2, 3]
---

# 方法、插件与框架集成：Vue / React / Angular

> 基于 Sortable.js v1.15.7（npm 实测最新版）· 核于 2026-07

## 速查

- **实例方法**：`option(name[, value])` 读写单个配置项；`toArray()` 按 `dataIdAttr` 序列化当前顺序为字符串数组；`sort(order, useAnimation)` 编程式重排；`save()` 触发 `store.set()` 持久化；`destroy()` 彻底移除功能、解绑监听器。
- **`destroy()` 必调**：SPA 路由切换、组件卸载时不调用会导致监听器和内部引用残留，是常见内存泄漏点。
- **静态方法**：`Sortable.create(el, options)` 等价 `new Sortable`；`Sortable.get(element)` 获取元素上绑定的实例；`Sortable.mount(plugin1, plugin2)` 挂载插件（也接受数组）。
- **静态属性**：`Sortable.active`（当前活跃实例）/ `Sortable.dragged`（正在拖拽的元素）/ `Sortable.ghost`（占位元素）/ `Sortable.clone`（克隆元素），多用于自定义插件或深度调试。
- **`Sortable.utils`**：底层工具集（`detectDirection`/`closest`/`toggleClass`/`index` 等），自定义插件/深度定制时才会用到，日常业务基本用不上。
- **插件两类**：Default 插件（`AutoScroll`/`OnSpill`，默认版内置）与 Extra 插件（`MultiDrag`/`Swap`，仅完整版内置，其他版本需手动 `mount`）。
- **插件必须先 `Sortable.mount()`**：忘记 mount **不会报错**，只是相关 option（如 `multiDrag: true`）静默不生效，是最容易误判为"配置写错"的坑之一。
- **`MultiDrag`**：`multiDrag: true` + `selectedClass` + `multiDragKey`（默认 `Ctrl`）实现多选拖拽，`onSelect`/`onDeselect` 回调，`onEnd` 里的 `oldIndicies`/`newIndicies`/`items`/`clones`。
- **`Swap`**：`swap: true` + `swapClass`（目标项高亮类），拖到目标上时是"交换位置"而非"插入"，`onEnd.swapItem` 是与之交换的元素。
- **Vue**：`vuedraggable` 同一个 npm 包靠 dist-tag 区分——`vuedraggable`（Vue2，2.24.3，纯维护状态）vs `vuedraggable@next`（Vue3，4.1.0，**必须显式指定 `@next`**，直接 `npm i vuedraggable` 会装成 Vue2 版本）。
- **Vue3 三个破坏性变更**：① 具名 `item` slot 替代默认 slot + `v-for`；② 必须提供 `item-key`；③ 用 `tag` + `componentData` 替代包裹 `transition-group`。
- **`vuedraggable` 属性/事件透传**：所有 Sortable 原生 options 可作为 kebab-case props 直传（如 `ghost-class`）；组件事件即 Sortable 事件转发（`start`/`add`/`remove`/`update`/`end`/`sort`/`filter`/`clone`），外加综合性 `change` 事件（携带 `added`/`removed`/`moved` 三种子形态）。
- **React**：官方 `react-sortablejs`（v6.1.4），`ReactSortable` 组件走 `list`/`setList` 受控模式；每个 item **必须有 `id` 字段**，**绝不能用数组下标当 key**（官方原文警告）。
- **`react-sortablejs` 生产就绪度**：官方 README 明确声明"this is not considered ready for production, as there are still a number of bugs being sent through"，选型前需评估此风险。
- **Angular**：`ngx-sortablejs`（v11.1.0，原名 `angular-sortablejs`）支持标准数组和 `FormArray`；`angular-legacy-sortablejs`（v0.4.1）是 Angular 1.x 遗留封装。
- **虚拟 DOM 冲突根源**：Sortable 拖拽时直接移动真实 DOM 节点，React/Vue 基于虚拟 DOM diff 渲染；不用官方封装、自己手写 `onEnd` 直接改数组容易出现"DOM 顺序"与"数据顺序"不一致，需理解封装库"先放行 DOM 操作，事件触发后框架接管重渲染纠正 DOM"的协调策略。
- **`vuedraggable`(Vue2) 版本对齐坑**：内部锁定依赖 `sortablejs@1.10.2`，与项目独立安装的新版 `sortablejs`（如 1.15.7）可能有 API 细微差异。

## 一、实例方法

创建实例后，`sortable` 对象暴露一组方法用于编程式读写状态：

```javascript
var sortable = new Sortable(el, { animation: 150 });

sortable.option("disabled", true); // 设置配置项——动态禁用拖拽
sortable.option("disabled"); // 读取配置项——返回当前值

sortable.toArray(); // 按 dataIdAttr（默认 data-id）序列化当前顺序为字符串数组
sortable.sort(order, true); // 按给定顺序重排，第二参数控制是否用动画

sortable.save(); // 触发 store.set()（若配置了 store）持久化当前顺序
sortable.destroy(); // 彻底移除 sortable 功能，解绑监听器
```

`toArray()` 依赖每个子元素上的 `data-id`（或 `dataIdAttr` 指定的属性）来生成顺序数组，这也是[上一页](./options-and-styling)介绍的 `store.get`/`store.set` 机制的基础——`save()` 内部就是先 `toArray()` 拿到当前顺序，再交给 `store.set(sortable)` 写入存储介质。

**`destroy()` 是最容易被遗漏的一步**：Vue/React 组件卸载、SPA 路由切换离开当前页面时，如果没有在生命周期钩子里调用 `destroy()`，Sortable 内部绑定的事件监听器和对 DOM 元素的引用不会被自动释放，日积月累会成为内存泄漏点。手写集成时建议固定模式：

```javascript
// Vue 3 Composition API 示例
import { onMounted, onBeforeUnmount, ref } from "vue";
import Sortable from "sortablejs";

const listRef = ref(null);
let sortableInstance = null;

onMounted(() => {
  sortableInstance = new Sortable(listRef.value, { animation: 150 });
});

onBeforeUnmount(() => {
  sortableInstance?.destroy(); // 组件卸载前务必销毁，防止监听器残留
});
```

## 二、静态方法与工具集

```javascript
Sortable.create(el, options); // 创建实例（等价 new Sortable）
Sortable.active; // 当前活跃的 Sortable 实例
Sortable.dragged; // 正在被拖拽的 HTMLElement
Sortable.ghost; // 幽灵（占位）元素
Sortable.clone; // 克隆元素
Sortable.get(element); // 获取某元素上绑定的 Sortable 实例
Sortable.mount(plugin1, plugin2); // 挂载插件（也接受数组）
```

`Sortable.utils` 是内部工具集，日常业务代码基本不会直接用到，只有编写自定义插件或做非常底层的定制时才有意义：

```javascript
Sortable.utils.on(el, event, fn);
Sortable.utils.off(el, event, fn);
Sortable.utils.css(el, prop, value);
Sortable.utils.find(ctx, tagName, iterator);
Sortable.utils.is(el, selector);
Sortable.utils.closest(el, selector, ctx);
Sortable.utils.clone(el);
Sortable.utils.toggleClass(el, name, state);
Sortable.utils.detectDirection(el); // 自动判断 'vertical' | 'horizontal'
Sortable.utils.index(el, selector);
Sortable.utils.getChild(el, childNum, options, includeDragEl);
```

## 三、插件系统：MultiDrag 与 Swap

Sortable.js 的插件分两类：**Default 插件**（`AutoScroll` 自动滚动容器/页面、`OnSpill` 拖出有效区域后的处理策略）默认版本已经内置；**Extra 插件**（`MultiDrag` 多选拖拽、`Swap` 交换而非插入）只有完整版内置，其他版本需要手动 `mount`。

```javascript
import Sortable, { MultiDrag } from "sortablejs";
Sortable.mount(new MultiDrag());

const sortable = Sortable.create(list, {
  multiDrag: true,
  selectedClass: "sortable-selected",
  multiDragKey: "Control", // 需按住的修饰键（默认 Ctrl）才能多选
  avoidImplicitDeselect: false, // true = 点击列表外不自动取消选择
  animation: 150,
  onSelect(evt) {
    evt.item;
    evt.items;
  }, // 选中一项
  onDeselect(evt) {
    evt.item;
  }, // 取消选中
  onEnd(evt) {
    evt.oldIndicies; // [{ multiDragElement, index }, ...]
    evt.newIndicies;
    evt.items; // 本次拖拽的所有元素
    evt.clones; // 对应克隆元素
  },
});

// 编程式选中/取消选中
Sortable.utils.select(item1);
Sortable.utils.deselect(item1);
```

`Swap` 插件把默认的"插入"行为改成"交换"——拖到目标项上松手，两者互换位置而不是插入到目标前后：

```javascript
import Sortable, { Swap } from "sortablejs/modular/sortable.core.esm";
Sortable.mount(new Swap());

Sortable.create(list, {
  swap: true,
  swapClass: "sortable-swap-highlight", // 目标项高亮类
  animation: 150,
  onEnd(evt) {
    evt.swapItem; // 与之交换位置的元素，HTMLElement 或 undefined
  },
});
```

**这两个插件有一个共同的隐蔽坑**：如果忘记 `Sortable.mount()`，相关 option（如 `multiDrag: true`、`swap: true`）**不会抛出任何错误**，只是完全不生效——拖拽表现和没配置这个选项一样。这非常容易被误判成"我的配置写错了"，实际根因往往是漏掉了 `mount()` 这一步。

## 四、框架集成：Vue（vuedraggable）

`vuedraggable` 是官方维护的 Vue 封装，**Vue2 与 Vue3 版本是同一个 npm 包名，靠 dist-tag 区分**——这是安装时最容易踩的坑：直接 `npm install vuedraggable` 装到的是 Vue2 版本（`2.24.3`，末次发布于 2020-10，处于纯维护状态），Vue3 项目必须显式加 `@next` 后缀：

```bash
npm i -S vuedraggable       # Vue2 版本（2.24.3）
npm i -S vuedraggable@next  # Vue3 版本（4.1.0）—— 注意包名不变，靠 @next tag 区分
```

Vue2 写法（默认 slot + `v-for`）：

```vue
<template>
  <draggable v-model="myArray" group="people" @start="drag = true" @end="drag = false">
    <div v-for="element in myArray" :key="element.id">
      <!-- 注意：这里的 {{ }} 是 Vue 模板插值语法，围栏代码块内书写安全 -->
      {{ element.name }}
    </div>
  </draggable>
</template>
<script>
import draggable from "vuedraggable";
export default { components: { draggable } };
</script>
```

Vue3 写法有三处破坏性变更：**① 用具名 `item` slot 替代默认 slot + `v-for`；② 必须提供 `item-key`；③ 用 `tag` + `componentData` 替代包裹 `transition-group`**：

```vue
<template>
  <draggable v-model="myArray" group="people" item-key="id" @start="drag = true" @end="drag = false">
    <template #item="{ element }">
      <div>{{ element.name }}</div>
    </template>
  </draggable>
</template>
```

所有 Sortable 原生 options 都可以作为 kebab-case props 直接透传给 `<draggable>`（如 `ghost-class`/`animation`/`handle`），不需要额外映射；组件事件是 Sortable 事件的直接转发（`start`/`add`/`remove`/`update`/`end`/`choose`/`unchoose`/`sort`/`filter`/`clone`），另外提供一个综合性的 `change` 事件，携带 `added`/`removed`/`moved` 三种子形态，方便只监听一个事件就能识别所有类型的变化。

社区还有一个小众替代方案 `vue3-sortablejs`（`1.0.7`），走指令式 `v-sortable` 路线，非组件式、非 `v-model` 双向绑定，用法更底层，下载量远低于 `vuedraggable`，不是主流选择。本仓库技术栈是 Vue 3，`vuedraggable@next` 是对应的官方集成方案。

## 五、框架集成：React（react-sortablejs）与 Angular

React 生态的官方封装是 `react-sortablejs`（v6.1.4），核心组件 `ReactSortable` 走 `list`/`setList` 受控模式：

```jsx
import { ReactSortable } from "react-sortablejs";
import { useState } from "react";

function BasicList() {
  const [state, setState] = useState([
    { id: 1, name: "shrek" },
    { id: 2, name: "fiona" },
  ]);
  return (
    <ReactSortable list={state} setList={setState}>
      {state.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </ReactSortable>
  );
}
```

**每个 item 必须带唯一的 `id` 字段，绝不能用数组下标当 `key`**——这是官方原文明确警告的一条：用下标做 key 会导致拖拽后组件复用错乱、动画/状态错位，是 React 列表渲染的通用陷阱在拖拽场景下的放大版。Sortable 原生 options（`group`/`animation`/`delay` 等）可以直接作为 props 传给 `ReactSortable`；插件用法与 vanilla 版本一致：

```javascript
import { ReactSortable, Sortable, MultiDrag, Swap } from "react-sortablejs";
Sortable.mount(new MultiDrag(), new Swap());
```

item 对象在 React 封装里还额外支持 `selected`（`MultiDrag` 选中态）、`chosen`、`filtered` 字段，用于把插件状态映射回受控数据。

**`react-sortablejs` 有一条必须评估的风险声明**：官方 README 原文明确写"this is not considered ready for production, as there are still a number of bugs being sent through"——团队选型时不能想当然地认为"有官方封装就等于生产级可用"，需要结合自身项目对稳定性的容忍度做判断。

Angular 生态由 `ngx-sortablejs`（v11.1.0，原名 `angular-sortablejs`，Angular 2+）提供支持，通过模块注册启用：

```typescript
imports: [SortablejsModule.forRoot({ animation: 150 })];
```

```html
<div [sortablejs]="items">
  <div *ngFor="let item of items">{{ item }}</div>
</div>
```

支持标准数组和 Angular `FormArray`，通过 `sortablejsOptions` 绑定原生 options。仍在维护 Angular 1.x 老项目的场景可以用遗留封装 `angular-legacy-sortablejs`（v0.4.1），但明显已是遗留方案，新项目不应选用。其他框架还有 Knockout（`knockout-sortablejs`）、Polymer（`polymer-sortablejs`）、Ember（`ember-sortablejs`）、Meteor（`meteor-sortablejs`）、jQuery 桥接（`jquery-sortablejs`，兼容层而非依赖）；TypeScript 类型定义统一在 `@types/sortablejs`。

## 六、虚拟 DOM 冲突：框架集成层真正解决的问题

回到[入门页](../getting-started)心智模型一节埋下的问题：**Sortable.js 直接移动真实 DOM 节点，React/Vue 却基于虚拟 DOM diff 来决定"该渲染成什么样"**。如果不使用官方框架封装、自己手写 `onEnd` 直接修改数据数组，很容易出现"DOM 里看到的顺序"和"数据数组里的顺序"短暂不一致，甚至互相打架的问题——因为 Sortable 已经把 DOM 移动到位了，而框架接下来基于（尚未同步的）旧数据重新 diff，可能会把 DOM 硬拉回旧位置，出现拖拽"抖动"或"弹回"的观感。

`vuedraggable`/`react-sortablejs` 这类官方封装的核心价值，就是处理好了这套协调逻辑：**先允许 Sortable 操作真实 DOM，拖拽事件触发后，封装层把这次变化翻译成数据层面的操作（增删/移动数组项），再交还给框架重新渲染——框架的虚拟 DOM diff 这时候拿到的已经是与当前真实 DOM 一致的新数据，不会产生冲突**。这也是为什么官方封装的组件 API 总是"受控"风格（Vue 的 `v-model`、React 的 `list`/`setList`）——它们需要在拖拽发生的瞬间就掌握新数据，而不是等业务代码自己去读 DOM 反推顺序。

几个与框架集成强相关的易错点汇总：

- **`vuedraggable`(Vue2) 内部锁定 `sortablejs@1.10.2`**：与项目独立安装的新版 `sortablejs`（如 1.15.7）并存时，实际生效的是 `vuedraggable` 内部锁定的旧版本，若期待新版 Sortable 的某个 API/行为，可能对不上，需要留意版本对齐问题。
- **`vuedraggable@next` 安装漏加 `@next`**：Vue3 项目里很容易习惯性地直接 `npm i vuedraggable`，实际装成了 Vue2 版本，运行时会因为 API 不匹配（默认 slot vs 具名 `item` slot）而报错或渲染异常。
- **大列表的动画与性能**：几百项级别的列表，`animation` 设置过高会有明显卡顿，需要结合虚拟滚动或降低/关闭动画，与[上一页](./options-and-styling)提到的动画配置是同一个权衡。

方法、插件、框架集成讲完之后，[参考页](../reference)提供一份浓缩的 options/事件/方法速查表、完整易错点清单与选型对比，方便日常直接查阅。
