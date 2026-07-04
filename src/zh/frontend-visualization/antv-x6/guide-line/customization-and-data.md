---
layout: doc
outline: [2, 3]
---

# 自定义节点与数据：HTML/Vue/React、序列化与事件

> 基于 **AntV X6 v3.1**（npm latest 3.1.7）· 核于 2026-07

## 速查

- **三种自定义节点方式**：HTML 节点（主包内置，`Shape.HTML.register`）/ React 节点（独立包 `@antv/x6-react-shape`）/ Vue 节点（独立包 `@antv/x6-vue-shape`）
- **HTML 节点最轻量**：原生 DOM，无框架依赖；React/Vue shape 可直接复用业务组件库，但要装配套包、对齐大版本
- **React shape 要点**：`effect: ['data']` 声明式指定组件随哪些属性变化重渲染；2.0.8+ 起仅支持 React 18+
- **Vue shape 要点**：需要在应用根部渲染 `getTeleport()` 返回的 `TeleportContainer` 组件，因为节点内容通过 Vue3 Teleport 机制挂载；组件内用 `inject('getNode')` 拿到节点实例
- **⚠️ 事件穿透坑**：自定义节点内部按钮点击默认会被节点拖拽/选中逻辑捕获，通常需要在组件内部按钮上阻止事件冒泡，官方教程未展开此点
- **`graph.toJSON()`/`graph.fromJSON()`**：整图导出/导入，结构为 `{ cells: [...] }`，节点/边分别含 `id`/`shape`/`position`/`size`/`attrs`/`zIndex` 等
- **业务数据 vs 视觉属性**：`cell.setData()`/`getData()` 管业务数据（区别于 `attrs` 视觉属性）
- **`setData()` 默认深度合并**，传 `{ overwrite: true }` 才是整体替换
- **`toJSON({ diff: true })`**：只导出与默认值的差异字段，用于精简持久化数据
- **父子（群组/嵌套）关系**：`child.setParent(parent)`/`parent.addChild(child)`/`parent.getChildren()`/`child.getParent()`/`child.hasParent()`
- **群组树形查询**：`node.getAncestors()`/`node.getDescendants({ breadthFirst })`/`node.isDescendantOf(root)`/`node.getCommonAncestor(...)`
- **`embedding: { enabled, findParent }`**：节点移动时通过 `findParent` 返回值自动建立父子关系，是群组嵌套的核心配置
- **事件命名统一为"目标:动作"**：`cell:click`/`node:click`/`blank:click`/`edge:connected`/`node:change:position` 等
- **`edge:connected`**：连接生命周期的终点事件，参数含 `isNew`/`previousCell`/`currentCell`/`previousPort`/`currentPort`，常用于持久化连线结果
- **`change:xxx` 系列**：细粒度属性变更事件，可在 `graph` 或 `cell` 实例上分别监听
- **v3 全新动画系统 `animate()`**：基于 Web Animations API，完全替代 v2.x 的 `transition`，属性路径用 `'/'` 分隔（如 `'position/x'`）
- **animate 两种用法**：命令式 `node.animate(keyframes, options)` / 声明式 `animation: [[keyframes, options]]`（随节点添加自动触发）
- **animate 播放控制**：`pause()`/`play()`/`cancel()`/`finish()`/`reverse()`/`updatePlaybackRate()`
- **`Export` 插件**：`toPNG`/`toJPEG`/`toSVG` 回调返回 dataURI（不直接下载）；`exportPNG`/`exportJPEG`/`exportSVG` 直接触发浏览器下载，二者用途不同
- **进阶顺序**：本页承接[交互与插件](./interaction-and-plugins)，完整速查见[参考](../reference)

## 一、自定义节点：HTML / React / Vue shape

**HTML 节点**（主包内置，无需额外安装）：

```javascript
import { Shape } from '@antv/x6'

// 注册一个 HTML 节点：html() 返回一个真实 DOM 元素
Shape.HTML.register({
  shape: 'custom-html',
  width: 160,
  height: 80,
  html() {
    const div = document.createElement('div')
    div.className = 'custom-html' // 纯原生 DOM，无框架依赖
    div.innerText = '原生 HTML 节点'
    return div
  },
})

graph.addNode({ shape: 'custom-html', x: 40, y: 40 })
```

**React 节点**（独立包 `@antv/x6-react-shape`，需与主包 `@antv/x6` 版本对齐）：

```jsx
import { register } from '@antv/x6-react-shape'

// 一个简单的 React 组件，node 由 X6 通过 props 注入
const NodeComponent = ({ node }) => {
  const data = node.getData() // 通过 node 实例读取业务数据
  return <div className="custom-react-node">{data?.label ?? '未命名'}</div>
}

register({
  shape: 'custom-react',
  width: 100,
  height: 100,
  component: NodeComponent,
  effect: ['data'], // 声明组件随 node.setData() 触发的属性变化而重渲染
})
```

**Vue 节点**（独立包 `@antv/x6-vue-shape`）：

```javascript
import { register, getTeleport } from '@antv/x6-vue-shape'
import ProgressVueComponent from './ProgressVueComponent.vue'

register({ shape: 'custom-vue', width: 100, height: 100, component: ProgressVueComponent })
// 需要在应用根部渲染 getTeleport() 返回的 TeleportContainer 组件，
// 因为 Vue3 用 Teleport 机制把节点内容挂载到画布对应位置
```

组件内部（Options API 风格，官方示例）通过 `inject` 拿到节点实例：

```javascript
export default {
  inject: ['getNode'],
  mounted() {
    const node = this.getNode()
    node.on('change:data', (cb) => {
      // 响应节点数据变化，更新组件内部状态
    })
  },
}
```

`<script setup>` 写法等价（`inject` 是 Vue3 标准 API，非 X6 专有）：

```javascript
import { inject } from 'vue'
const getNode = inject('getNode')
const node = getNode()
node.on('change:data', () => { /* 响应节点数据变化 */ })
```

三者对比：HTML 节点最轻量（原生 DOM，无框架依赖）；React/Vue shape 可直接复用业务组件库，但要装配套包、对齐大版本、留意事件穿透（组件内部点击默认会被节点拖拽/选中逻辑捕获，通常需要在组件内部按钮上阻止事件冒泡，官方教程未展开此点，需自行验证）。Angular 同理有 `@antv/x6-angular-shape`。

## 二、数据与序列化

```javascript
// 整图导出/导入
const json = graph.toJSON() // { cells: [...] }，节点/边分别含 id/shape/position/size/attrs/zIndex 等
graph.fromJSON({ nodes: [...], edges: [...] }) // 或直接传 cells 数组

// 单元格自定义业务数据（区别于 attrs 视觉属性）
const rect = new Shape.Rect({ x: 40, y: 40, width: 100, height: 40, data: { bizID: 125 } })
cell.setData({ price: 99 })                    // 默认深度合并
cell.setData(newData, { overwrite: true })     // 整体替换
cell.getData()
cell.toJSON({ diff: true })                    // 只导出与默认值的差异字段
```

**群组/嵌套（embedding）**：需开启 `embedding: { enabled: true, findParent({ node }) {...} }`，节点移动时通过 `findParent` 返回的节点自动建立父子关系：

```javascript
// 父子关系操作
child.setParent(parent)
parent.addChild(child)
parent.getChildren()
child.getParent()
child.hasParent()

// 树形关系查询
node.getAncestors()
node.getDescendants({ breadthFirst: true })
node.isDescendantOf(root)
node.getCommonAncestor(node2, node3)
```

折叠展开需自定义节点类结合 `getDescendants()` 控制 `hide()`/`show()`。

## 三、事件系统

```javascript
graph.on('cell:click', ({ e, x, y, cell, view }) => {})
graph.on('node:click', ({ e, x, y, node, view }) => {})
graph.on('blank:click', ({ e, x, y }) => {})
graph.on('edge:connected', ({ isNew, edge, previousCell, currentCell, previousPort, currentPort }) => {})
graph.on('node:change:position', ({ current, previous }) => {})  // change:xxx 系列细粒度变更事件
cell.on('change:zIndex', ({ current, previous }) => {})           // 也可直接在 cell 实例上监听
graph.off('node:click', handler) // 取消监听
```

**分类速记**：交互类（`click`/`dblclick`/`contextmenu`/`mouseenter`/`mouseleave`，均有 `cell:`/`node:`/`edge:`/`blank:` 前缀变体）、画布类（`scale`/`resize`/`translate`）、生命周期类（`node:added`/`removed`/`changed`/`embedded`）、连接类（`edge:connected` 是校验/连接生命周期终点事件，常用于持久化连线结果）。

## 四、动画系统 animate（v3 全新特性）

```javascript
// 命令式：animate(keyframes, options)，属性路径用 '/' 分隔
node.animate({ 'position/x': 300 }, { duration: 1000, direction: 'alternate', iterations: Infinity })
node.animate({ 'data/ratio': 3 / 5 }, { duration: 1000 }) // 自定义 data 字段也可动画

// 声明式：随节点添加自动触发
graph.addNode({
  shape: 'rect', x: 100, y: 140, width: 100, height: 50,
  animation: [[{ 'position/x': 300 }, { duration: 1000, iterations: Infinity }]],
})
```

基于 **Web Animations API** 标准实现，播放控制方法：`pause()`/`play()`/`cancel()`/`finish()`/`reverse()`/`updatePlaybackRate()`。**这是 v3 对 v2.x `transition` 用法的完全替代**（官方原文"移除 2.x 中的 transition 使用方式"），API 层面不兼容，v2→v3 升级必须重写动画代码。

## 五、导出 Export

```javascript
import { Graph, Export } from '@antv/x6'

graph.use(new Export())
graph.exportPNG('file-name', { quality: 0.92, backgroundColor: '#fff', ratio: 1 })
graph.exportJPEG('file-name')
graph.exportSVG('file-name', { copyStyles: true, preserveDimensions: true })
// toPNG/toJPEG/toSVG 系列返回 dataURI（回调形式）而非直接触发下载
```

`exportPNG`/`exportJPEG`/`exportSVG` 直接触发浏览器下载；`toPNG`/`toJPEG`/`toSVG` 系列只是拿到 dataURI，交给回调自行处理（比如上传服务器），二者用途不同，选错会出现"该下载的时候没反应"或"只想拿数据却触发了下载"的困惑。

## 六、易错点

- **`setData()` 默认深度合并 vs 整体替换**：不传 `{ overwrite: true }` 时是合并旧数据，容易在"清空某字段"场景下出现旧值残留的错觉 bug。
- **自定义 HTML/React/Vue 节点内部点击事件冒泡**：节点内部按钮点击默认可能同时触发节点选中/拖拽，需要显式阻止事件冒泡，官方文档未系统提及此坑，纯靠经验排查。
- **Vue2 节点组件的功能限制**：官方教程明确提示 Vue2 环境下节点组件"无法使用 Vuex、i18n、Element UI 等"，是历史遗留限制，Vue3 + Teleport 方案下已不受此限。
- **`animate` 与 `transition` 不能混用**：v3 项目里网上搜到的 `transition` 相关示例已失效，必须改用基于 Web Animations API 的 `animate`，属性路径写法（`'position/x'`）也是新概念。
- **`toPNG`/`exportPNG` 混淆**：前者只返回 dataURI 交回调处理，后者直接触发浏览器下载，用错会出现"以为在导出却没反应"。

---

自定义节点与数据序列化是业务开发最常打交道的部分；把全部节点/边/连接桩/插件/事件放进一张表方便随查，见[参考](../reference)。
