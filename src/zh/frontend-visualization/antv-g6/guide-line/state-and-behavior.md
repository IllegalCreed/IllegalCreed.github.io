---
layout: doc
outline: [2, 3]
---

# 状态与交互：State / Behavior / 事件系统

> 基于 **AntV G6 v5.1**（npm latest 5.1.1）· 核于 2026-07

## 速查

- **内置状态 5 种**：`selected`（选中）/`active`（激活）/`highlight`（高亮）/`inactive`（非活跃，淡化非关注元素）/`disabled`（禁用）
- **状态样式配置**：实例化时在 `node.state`/`edge.state` 里写各状态对应的样式覆盖
- **状态编程 API**：`graph.setElementState(id, state)` 设置（可传数组叠加多状态）、`graph.getElementState(id)` 查询、`graph.getElementDataByState('node', 'selected')` 查找处于某状态的所有元素、`graph.setElementState(id, [])` 清除所有状态
- **样式最终优先级（低到高）**：`主题默认样式 < 调色板样式 < 数据样式 < 图的默认样式 < 主题状态样式 < 图的状态样式`
- **Behavior 是 G6 的交互体系**：内置多种开箱即用交互，`behaviors` 数组直接配置，无需注册
- **画布导航类**：`drag-canvas`（拖动画布）/`zoom-canvas`（缩放）/`scroll-canvas`（滚轮滚动）/`optimize-viewport-transform`（大图场景优化视图变换性能）
- **选择类**：`click-select`（点击选择）/`brush-select`（框选）/`lasso-select`（套索选择，自由绘制区域）
- **编辑类**：`create-edge`（交互式连线）/`drag-element`（拖动节点 / Combo）/`drag-element-force`（力导向布局中拖动并联动模拟）
- **数据探索类**：`collapse-expand`（展开 / 收起子树或 Combo）/`focus-element`（聚焦元素并调整视图）/`hover-activate`（悬停高亮）
- **视觉优化类**：`fix-element-size`（缩放画布时固定元素大小不变）/`auto-adapt-label`（按节点重要性自动调整标签显隐 / 位置，避免大图标签重叠）
- **behaviors 两种写法**：字符串（默认参数）或 `{ type, key, ... }` 对象（自定义参数，`key` 用于后续动态更新定位）
- **动态管理**：`graph.setBehaviors([...])` 整体替换、`graph.updateBehavior({ key, ... })` 改单个交互参数、`graph.setBehaviors([])` 卸载全部
- **`brush-select` 关键参数**：`mode`（`union`/`intersect`/`diff`/`default`，多次框选叠加逻辑）、`trigger`（触发快捷键，默认 `['shift']`，空数组表示无需按键）、`enableElements`（可框选的元素类型）
- **`create-edge` 关键参数**：`trigger`（`drag` 默认 / `click`）、`onCreate`/`onFinish` 回调
- **`collapse-expand` 关键参数**：`trigger`（默认 `dblclick`）、`onCollapse`/`onExpand` 回调；对应程序化 API 是 `graph.collapseElement(id)`/`graph.expandElement(id)`
- **自定义 Behavior**：内置交互不满足需求时可继承内置交互扩展，或从零实现，都需先 `register()` 注册后才能在 `behaviors` 里引用
- **事件系统统一为 pointer**：v5 移除了 v4 的 `mouse`/`touch` 分离，统一用 pointer 事件
- **事件命名规范**：`目标类型:动作`
- **节点事件 NodeEvent**：`node:click`/`dblclick`/`pointerenter`/`pointerleave`/`pointerover`/`pointerout`/`pointermove`/`pointerdown`/`pointerup`/`contextmenu`/`dragstart`/`drag`/`dragend`/`dragenter`/`dragover`/`dragleave`/`drop`
- **边 / Combo 事件**：`EdgeEvent`/`ComboEvent`，同构命名（`edge:click`、`combo:click` 等）
- **画布事件 CanvasEvent**：同构命名 + `canvas:wheel`
- **生命周期事件 GraphEvent**：成对出现的 before/after 事件，如 `beforerender`/`afterrender`、`beforedraw`/`afterdraw`、`beforelayout`/`afterlayout`、`beforetransform`/`aftertransform`（对应 v4 的 `viewportchange`）、`beforeelementstatechange`/`afterelementstatechange`（对应 v4 的 `graphstatechange`）、`beforedestroy`/`afterdestroy`、`batchstart`/`batchend`
- **容器事件 ContainerEvent**：`keydown`/`keyup`
- **监听 API**：`graph.on(eventName, cb)`/`graph.once(eventName, cb)`；也可用常量 `GraphEvent.AFTER_RENDER` 代替字符串
- **事件对象字段**：`target`（触发元素）/`targetType`（`node`/`edge`/`combo`/`canvas`）/`originalTarget`/`currentTarget`/`originalEvent`（原始浏览器事件）

## 一、状态 State

内置 5 种状态，均自带默认样式覆盖规则：

| 状态名 | 说明 |
| --- | --- |
| `selected` | 选中状态（用户点击选择） |
| `active` | 激活状态（当前正在交互） |
| `highlight` | 高亮状态（强调显示） |
| `inactive` | 非活跃状态（淡化非关注元素） |
| `disabled` | 禁用状态（不可交互） |

```javascript
new Graph({
  node: {
    style: { fill: '#C6E5FF', stroke: '#5B8FF9' },
    state: {
      selected: { fill: '#95D6FB', stroke: '#1890FF', lineWidth: 2 },
      highlight: { stroke: '#FF6A00', lineWidth: 2 },
      disabled: { fill: '#ECECEC', opacity: 0.5 },
    },
  },
});

// 动态设置/查询/清除
graph.setElementState('node1', 'selected');
graph.setElementState('node1', ['selected', 'highlight']); // 多状态叠加
graph.getElementState('node1');
graph.getElementDataByState('node', 'selected');           // 查找处于某状态的所有元素
graph.setElementState('node1', []);                        // 清除所有状态
```

样式最终优先级（低到高）：`主题默认样式 < 调色板样式 < 数据样式 < 图的默认样式 < 主题状态样式 < 图的状态样式`——图的状态样式（即上面 `node.state` 里写的配置）优先级最高，这也是为什么点击选中的样式总能盖过其它样式来源。

## 二、交互 Behavior

Behavior 是 G6 的交互体系，内置多种开箱即用交互，无需注册直接在 `behaviors` 数组配置：

| 分类 | Behavior | 作用 |
| --- | --- | --- |
| 画布导航 | `drag-canvas` | 拖动整个画布视图 |
| | `zoom-canvas` | 缩放画布 |
| | `scroll-canvas` | 滚轮滚动画布 |
| | `optimize-viewport-transform` | 优化视图变换性能（大图场景） |
| 选择 | `click-select` | 点击选择元素 |
| | `brush-select` | 框选（拖出矩形区域批量选中） |
| | `lasso-select` | 套索选择（自由绘制区域） |
| 编辑 | `create-edge` | 交互式创建边（连线） |
| | `drag-element` | 拖动节点 / Combo |
| | `drag-element-force` | 力导向布局中拖动节点并联动模拟 |
| 数据探索 | `collapse-expand` | 展开 / 收起子树或 Combo |
| | `focus-element` | 聚焦某元素并自动调整视图 |
| | `hover-activate` | 悬停高亮 |
| 视觉优化 | `fix-element-size` | 缩放画布时固定元素大小不变 |
| | `auto-adapt-label` | 根据节点重要性（中心性）自动调整标签显隐 / 位置，避免大图标签重叠 |

```javascript
const graph = new Graph({
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    { type: 'click-select', key: 'select-1', state: 'selected' }, // 对象写法带 key，便于后续动态更新
  ],
});

// 动态管理
graph.setBehaviors(['drag-canvas']);              // 整体替换
graph.updateBehavior({ key: 'select-1', state: 'active' }); // 改单个交互参数
graph.setBehaviors([]);                            // 卸载全部交互
```

几个高频配置的 Behavior 值得单独记住关键参数：

- **`brush-select`**：`mode`（`union`/`intersect`/`diff`/`default`，控制多次框选的叠加逻辑）、`trigger`（触发快捷键，默认 `['shift']`，空数组表示无需按键）、`enableElements`（可框选的元素类型）。
- **`create-edge`**：`trigger`（`drag` 默认 / `click`）、`onCreate`/`onFinish` 回调。
- **`collapse-expand`**：`trigger`（默认 `dblclick`）、`onCollapse`/`onExpand` 回调；对应的程序化 API 是 `graph.collapseElement(id)`/`graph.expandElement(id)`。

**自定义 Behavior**：内置交互不满足需求时，可继承内置交互扩展，或从零实现，都需先 `register()` 注册后才能在 `behaviors` 里引用——这与自定义元素 / 布局 / 插件共用同一套统一注册机制。

## 三、事件系统 Event

v5 统一了鼠标 / 触摸事件为 **pointer** 事件（移除了 v4 的 `mouse`/`touch` 分离）。事件命名规范是「`目标类型:动作`」：

- **节点** `NodeEvent`：`node:click`/`dblclick`/`pointerenter`/`pointerleave`/`pointerover`/`pointerout`/`pointermove`/`pointerdown`/`pointerup`/`contextmenu`/`dragstart`/`drag`/`dragend`/`dragenter`/`dragover`/`dragleave`/`drop`
- **边** `EdgeEvent`、**Combo** `ComboEvent`：同构命名（`edge:click`、`combo:click` 等）
- **画布** `CanvasEvent`：同构命名 + `canvas:wheel`
- **生命周期** `GraphEvent`：成对出现的 `before`/`after` 事件，如 `beforerender`/`afterrender`、`beforedraw`/`afterdraw`、`beforelayout`/`afterlayout`、`beforetransform`/`aftertransform`（对应 v4 的 `viewportchange`）、`beforeelementstatechange`/`afterelementstatechange`（对应 v4 的 `graphstatechange`）、`beforedestroy`/`afterdestroy`、`batchstart`/`batchend`
- **容器** `ContainerEvent`：`keydown`/`keyup`

```javascript
import { GraphEvent } from '@antv/g6';

graph.on('node:click', (e) => console.log(e.target.id, e.targetType));
graph.once('node:click', callback);                 // 一次性监听
graph.on(GraphEvent.AFTER_RENDER, () => console.log('渲染完成'));
```

事件对象字段：`target`（触发元素）、`targetType`（`node`/`edge`/`combo`/`canvas`）、`originalTarget`、`currentTarget`、`originalEvent`（原始浏览器事件）。生命周期事件的 before/after 成对设计，非常适合用来做埋点或全局 loading 状态管理——比如在 `beforelayout` 时显示加载态、`afterlayout` 时隐藏。

## 四、易错点

- **键盘快捷键行为不生效**：官方 FAQ 提示需使用标准按键名（`Control`/`Shift`/`Alt`/`Meta`），大小写或别名写错会导致 `trigger` 配置的快捷键不触发。
- **自定义 Behavior 忘记注册**：v5 所有可扩展点统一走 `register()`，直接在 `behaviors` 里写未注册的自定义 `type` 字符串会报错或静默失败。
- **状态样式优先级记反**：图的状态样式（`graph.setElementState` 触发后生效的样式）优先级最高，若发现「设置了 `selected` 却看不出变化」，通常是被更高优先级的图默认样式或数据样式覆盖，需要检查样式来源的层级。
- **多状态叠加是合并非替换**：`setElementState(id, ['selected', 'highlight'])` 会让元素同时具有两个状态，两者的样式定义会合并生效；官方文档未明确给出同一属性被多个状态同时覆盖时的具体优先级顺序，设计状态样式时尽量让不同状态覆盖的属性不重叠，避免依赖未文档化的合并顺序。

---

状态与交互解决了「用户怎么点、怎么拖、怎么探索」，但节点最终摆在哪个位置，是另一套独立的机制决定的：[布局](./layout)。
