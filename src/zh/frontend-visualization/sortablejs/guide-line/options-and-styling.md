---
layout: doc
outline: [2, 3]
---

# Options 全解与样式：三态样式类、handle / filter

> 基于 Sortable.js v1.15.7（npm 实测最新版）· 核于 2026-07

## 速查

- **Options 六大分组**：基础行为（`group`/`sort`/`delay`/`disabled`/`store`）、动画（`animation`/`easing`）、选择器（`handle`/`filter`/`draggable`/`dataIdAttr`）、三态样式（`ghostClass`/`chosenClass`/`dragClass`）、交换与方向（`swapThreshold`/`invertSwap`/`direction`）、Fallback（`forceFallback`/`fallbackOnBody`/`fallbackTolerance`）。
- **`handle`**：拖拽必须从匹配该选择器的子元素发起，如 `handle: ".my-handle"`；**必须是元素内部的选择器**，若误配成整个 item 或容器本身，会导致"整个区域都能拖但手柄逻辑形同虚设"。
- **`filter`**：排除不可拖拽的元素（字符串选择器或函数）；`preventOnFilter` 默认 `true`，会对 filter 命中的元素调用 `event.preventDefault()`——如果被排除的元素上有 checkbox/input 等需要正常交互的控件，必须显式设 `preventOnFilter: false`，否则点击会被拦截。
- **`draggable`**：限定容器内哪些子元素可被拖拽（选择器），与 `handle` 语义不同——`draggable` 决定"谁能被拖"，`handle` 决定"从哪里发起拖拽这个动作"。
- **三态样式类**：`ghostClass`（占位符，即拖拽目标位置的视觉提示）/ `chosenClass`（被选中项）/ `dragClass`（正在拖拽中的项），三者可以同时生效，分别对应拖拽生命周期的不同视觉状态。
- **`sort`**：是否允许列表内重新排序，默认 `true`；设为 `false` 仍可能作为跨列表拖入/拖出的目标，取决于 `group` 配置。
- **`animation`/`easing`**：过渡动画时长（ms，默认 `150`，`0` 为无动画）与缓动函数（默认 `"cubic-bezier(1, 0, 0, 1)"`，可查 easings.net）。
- **`delay`/`delayOnTouchOnly`/`touchStartThreshold`**：拖拽开始前的延迟（ms）、是否仅触摸设备生效延迟、延迟期间允许的指针移动容差（px，超出则取消本次拖拽判定）。
- **`swapThreshold`/`invertSwap`/`invertedSwapThreshold`/`direction`**：交换区域阈值（0~1 浮点数）、是否反转交换区域（营造"插入到两项之间"的手感）、反转阈值、排序方向（`'vertical'`/`'horizontal'`/函数，未指定则自动探测）。
- **Fallback 四件套**：`forceFallback`（强制启用模拟拖拽，忽略原生 HTML5 DnD）、`fallbackClass`（Fallback 模式下克隆元素的类名）、`fallbackOnBody`（克隆元素是否挂到 `document.body`）、`fallbackTolerance`（px，判定"开始拖拽"所需的最小鼠标移动量）。
- **`store`**：排序持久化的读写接口（`get`/`set`），初始化时调用 `get` 还原顺序，拖拽结束时调用 `set` 保存顺序；本页给出最小示例，`sortable.save()` 方法的触发关系见[方法、插件与框架集成](./methods-plugins-framework)。
- **嵌套 Sortable**：多层嵌套容器场景建议 `fallbackOnBody: true` + 把 `swapThreshold` 调低至约 `0.65`，否则内外层容器的拖拽判定会互相干扰。
- **`dataIdAttr`**：`toArray()` 序列化时读取的 HTML 属性名，默认 `data-id`。
- **`dragoverBubble`/`removeCloneOnHide`/`emptyInsertThreshold`**：`dragover` 事件是否向父级 sortable 冒泡（1.8.0 后一般无需设 `true`）、隐藏克隆元素时是否直接移除 DOM（而非仅 `display:none`）、鼠标离空列表多近（px）会被判定为"插入到此空列表"。
- **`setData`**：自定义原生 `DataTransfer` 内容，用于拖拽跨窗口/跨应用传递数据的场景。
- **IE/Edge 已知限制**：官方 README 原文警告，"due to browser restrictions, delaying is not possible on IE or Edge with native drag & drop"——`delay` 在这两个浏览器的原生 DnD 模式下不生效，需 `forceFallback` 规避。
- **大列表性能**：几百项级别的列表，`animation` 设置过高会有明显卡顿，需要结合虚拟滚动或降低/关闭动画。

## 一、Options 全览

Sortable.js 的所有配置项都是创建实例时传入的**同一个扁平对象**，按用途可以分成六组来记忆，而不是死记硬背整张表：

### 1. 基础行为类

```javascript
var sortable = new Sortable(el, {
  group: "name", // 或 { name, pull, put } 对象，见下一页详解
  sort: true, // 是否允许列表内排序
  delay: 0, // 拖拽开始前的延迟（毫秒）
  delayOnTouchOnly: false, // 仅触摸设备生效延迟
  touchStartThreshold: 0, // px，延迟拖拽被取消前允许的指针移动距离
  disabled: false, // 禁用整个 sortable 实例
  store: null, // 持久化排序状态的读写接口，见本页第六节
});
```

### 2. 动画类

```javascript
{
  animation: 150, // ms，排序动画速度，0 = 无动画
  easing: "cubic-bezier(1, 0, 0, 1)", // 动画缓动函数，见 easings.net
}
```

### 3. 选择器类

```javascript
{
  handle: ".my-handle", // 拖拽手柄选择器
  filter: ".ignore-elements", // 不可拖拽元素选择器（字符串或函数）
  preventOnFilter: true, // filter 触发时是否调用 event.preventDefault()
  draggable: ".item", // 指定容器内哪些子元素可拖拽
  dataIdAttr: "data-id", // toArray() 读取的 HTML 属性名
}
```

### 4. 三态样式类

```javascript
{
  ghostClass: "sortable-ghost", // 占位符（拖拽目标位置）的 CSS 类
  chosenClass: "sortable-chosen", // 被选中项的 CSS 类
  dragClass: "sortable-drag", // 正在拖拽项的 CSS 类
}
```

### 5. 交换与方向类

```javascript
{
  swapThreshold: 1, // 交换区域阈值（0~1 浮点数）
  invertSwap: false, // 是否反转交换区域（用于"插入到两项之间"的手感）
  invertedSwapThreshold: 1, // 反转交换区阈值，默认等于 swapThreshold
  direction: "vertical", // 'vertical' | 'horizontal' | 函数（未指定则自动探测）
}
```

### 6. Fallback 与其他

```javascript
{
  forceFallback: false, // 强制启用 Fallback 模式（忽略原生 HTML5 DnD）
  fallbackClass: "sortable-fallback", // Fallback 模式下克隆元素的类名
  fallbackOnBody: false, // 克隆元素是否挂载到 document.body
  fallbackTolerance: 0, // px，鼠标移动多少像素才判定为"开始拖拽"

  dragoverBubble: false, // dragover 事件是否向父级 sortable 冒泡
  removeCloneOnHide: true, // 隐藏克隆元素时是否直接移除 DOM
  emptyInsertThreshold: 5, // px，鼠标离空列表多近才会被插入

  setData: function (dataTransfer, dragEl) {
    dataTransfer.setData("Text", dragEl.textContent); // 原生 DataTransfer 对象
  },
}
```

## 二、handle 与 filter：谁能拖、从哪拖、谁被排除

`handle` 和 `draggable` 是最容易混淆的一对选项：**`draggable` 决定"哪些子元素整体可参与拖拽"，`handle` 决定"必须从元素内的哪个局部区域按下才能发起拖拽"**。

```javascript
new Sortable(document.getElementById("list"), {
  draggable: ".item", // 只有 .item 子元素参与排序（排除分隔线等其他子元素）
  handle: ".drag-handle", // 但必须从 .item 内部的 .drag-handle 区域按下才能拖动
});
```

```html
<ul id="list">
  <li class="item">
    <span class="drag-handle">⠿</span>
    这一整行都是拖拽对象，但只能从左边的手柄图标发起拖拽
  </li>
</ul>
```

如果不慎把 `handle` 配置成整个 `.item` 或容器本身，效果会退化成"整个区域随便哪里都能拖"，手柄限制形同虚设——这是官方 README 与社区教程反复提醒的一个基础坑。

`filter` 用于排除不希望被拖拽的元素，支持字符串选择器或函数：

```javascript
new Sortable(list, {
  filter: ".ignore-elements, .no-drag", // 逗号分隔多个选择器
  preventOnFilter: true, // 默认 true：命中 filter 时自动 event.preventDefault()
});
```

**`preventOnFilter` 默认 `true`是一个高频踩坑点**：如果被 `filter` 排除的元素里放了 `<input>`/`<button>`/checkbox 等需要正常响应点击的交互控件，默认行为会连带拦截它们的点击事件。解决方式是显式设置 `preventOnFilter: false`，让 filter 只排除"拖拽"这一个行为，不影响该元素本身的其他交互。

## 三、三态样式类：ghostClass / chosenClass / dragClass

Sortable.js 不内置任何视觉样式，只负责在拖拽生命周期的不同阶段给对应元素挂上/摘掉 CSS 类，视觉效果完全由业务自己写 CSS：

```javascript
new Sortable(list, {
  ghostClass: "sortable-ghost",
  chosenClass: "sortable-chosen",
  dragClass: "sortable-drag",
});
```

```css
/* 占位符：当前拖拽目标会落位的位置提示 */
.sortable-ghost {
  opacity: 0.4;
  background: #c8ebfb;
}

/* 被选中项：鼠标按下但尚未开始移动的瞬间 */
.sortable-chosen {
  box-shadow: 0 0 0 2px #4096ff;
}

/* 正在拖拽中的项（桌面原生 DnD 下浏览器会生成一份拖拽镜像，此类作用于原位置的元素） */
.sortable-drag {
  opacity: 0.8;
}
```

三者的语义边界：`chosenClass` 从鼠标/触摸按下的一刻就生效（不一定真的开始移动了）；`dragClass` 从真正判定为"开始拖拽"起生效；`ghostClass` 则贴在跟随鼠标移动的占位符元素上，标示"松手后会落在这里"。三个类可以同时定义、互不冲突。

## 四、swapThreshold、invertSwap 与 direction：拖拽手感调节

`direction` 一般不需要手动设置——Sortable.js 会自动探测容器是纵向排列（`'vertical'`）还是横向排列（`'horizontal'`）；只有布局比较特殊（如 CSS Grid 混排）时才需要显式指定或传函数自定义判断逻辑。

`swapThreshold`（默认 `1`，即整个目标元素范围）和 `invertSwap` 共同决定"鼠标移到目标元素的多大比例范围内才会触发插入位置切换"。把 `swapThreshold` 调小、`invertSwap` 设为 `true`，可以做出"必须移到两项之间的窄缝里才插入，而不是碰到目标项一半就插入"的更精细手感，常见于卡片网格类布局。

**嵌套 Sortable 容器**（比如可拖拽的看板列，列本身也可拖拽排序）默认不能正常工作，需要组合两个配置：`fallbackOnBody: true`（让拖拽克隆元素跳出原容器的层叠上下文）+ 把 `swapThreshold` 调低至约 `0.65`。否则内外层容器会对同一次拖拽手势产生冲突判定，出现"明明想拖内层项，却触发了外层列的重排"这类问题。

## 五、Fallback 模式与移动端

`forceFallback: true` 会让 Sortable.js **完全忽略原生 HTML5 DnD API**，改用统一的指针事件模拟拖拽——即使在支持原生 DnD 的桌面浏览器上也是如此。这样做的好处是拖拽视觉在所有平台上完全一致（不受各浏览器原生 DnD 渲染差异影响），常见于需要精细控制拖拽镜像样式的设计类应用。

```javascript
new Sortable(list, {
  forceFallback: true,
  fallbackClass: "sortable-fallback", // 强制模式下克隆元素的类名
  fallbackOnBody: true, // 克隆元素挂到 body，避免被父级 overflow:hidden 裁剪
  fallbackTolerance: 3, // 移动超过 3px 才判定为拖拽，避免误触
});
```

移动端触摸设备**不需要任何额外配置**就能拖拽——不支持原生 DnD 时 Sortable.js 会自动走 Fallback。真正需要调的是触摸场景下"何时开始拖拽"的判定：`delay`（拖拽前的延迟毫秒数，用于和"点击"手势区分）、`delayOnTouchOnly`（只在触摸设备生效这个延迟，桌面鼠标不受影响）、`touchStartThreshold`（延迟期间允许的手指抖动容差，超出则取消本次拖拽判定，避免和滚动手势冲突）。

**IE/Edge 的原生 DnD 有一个已知限制**：官方 README 原文警告"due to browser restrictions, delaying is not possible on IE or Edge with native drag & drop"——也就是说这两个浏览器在使用原生 DnD（非 Fallback）时，`delay` 配置不会生效。如果业务必须支持这两个浏览器且依赖 `delay` 做交互区分，唯一规避方式是配合 `forceFallback: true` 强制走模拟拖拽。

## 六、Store：排序持久化

`store` 选项接受一个带 `get`/`set` 方法的对象，把当前排序持久化到任意存储介质（最常见是 `localStorage`，也可以是远端接口）：

```javascript
Sortable.create(el, {
  group: "localStorage-example",
  store: {
    // 初始化时调用一次，返回顺序数组，用于还原上次的排序结果
    get: function (sortable) {
      var order = localStorage.getItem(sortable.options.group.name);
      return order ? order.split("|") : [];
    },
    // 拖拽结束（onEnd）时调用，负责把当前顺序写回存储
    set: function (sortable) {
      var order = sortable.toArray();
      localStorage.setItem(sortable.options.group.name, order.join("|"));
    },
  },
});
```

`get` 依赖 `dataIdAttr`（默认 `data-id`）标注的顺序数组来还原 DOM，`set` 内部调用的 `toArray()` 同样读取这个属性——这也是为什么使用 `store` 时通常需要给每个可排序子元素显式加上 `data-id` 属性。`store.set()` 具体在什么时机被自动触发、以及如何通过 `sortable.save()` 手动调用，见[方法、插件与框架集成](./methods-plugins-framework)。

配置项与样式类讲完之后，下一页进入 Sortable.js 另一个核心能力——跨列表拖放的 `group` 机制与完整事件系统：[group 跨列表与事件](./group-and-events)。
