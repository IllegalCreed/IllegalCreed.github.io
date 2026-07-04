---
layout: doc
outline: [2, 3]
---

# 交互与插件：Selection/History/Stencil/MiniMap

> 基于 **AntV X6 v3.1**（npm latest 3.1.7）· 核于 2026-07

## 速查

- **v3 核心变更**：本页涉及的 Selection/Snapline/Transform/Keyboard/Clipboard/History/Stencil/MiniMap/Scroller **全部是 3.x 起从主包 `@antv/x6` 统一导出**的插件，2.x 时代它们是 11 个独立的 `@antv/x6-plugin-*` 包
- **统一用法**：`graph.use(new Xxx({ ... }))` 注册插件，导入路径改了但调用方式不变
- **Selection**：`enabled`/`multiple`/`rubberband`（框选）/`rubberNode`/`rubberEdge`/`strict`（严格模式需完全包裹）/`movable`/`filter`
- **Selection API**：`select`/`unselect`/`resetSelection`/`getSelectedCells`/`cleanSelection`/`isSelected`/`isSelectionEmpty`
- **Snapline**：`enabled`/`tolerance`（默认 10px 触发距离）/`sharp`（短线 vs 通栏线）/`resizing`（缩放时是否生效）/`clean`（默认 3 秒自动清除）
- **Transform**：`resizing`（`minWidth`/`maxWidth`/`orthogonal`/`preserveAspectRatio`）/`rotating`（`grid` 旋转角度步进）
- **Keyboard**：`enabled`/`global`（`true` = 绑定到 document 而非仅容器），`graph.bindKey()`/`unbindKey()`/`triggerKey()`
- **Clipboard**：`copy(cells, { deep })`/`cut(cells)`/`paste({ offset, nodeProps, edgeProps, useLocalStorage })`，事件 `clipboard:changed`
- **History**：`enabled`/`stackSize`（0 = 不限栈深）/`beforeAddCommand`，API `undo()`/`redo()`/`canUndo()`/`canRedo()`/`cleanHistory()`
- **History 批量合并**：`graph.startBatch(name)` … `graph.stopBatch(name)`，或函数式 `graph.batchUpdate(() => {...})`，把多次变更合并为一条撤销记录
- **Stencil 是在 Dnd 基础上封装的模具/组件面板**（侧边栏拖拽创建节点的完整 UI），`stencil.load(nodes, groupName)` 加载可拖拽节点
- **Dnd** 是更底层的手动拖拽能力，适合自定义拖拽源而非用现成模具面板
- **MiniMap**：需要独立 `container`，`width`/`height`/`padding`/`scalable`/`minScale`/`maxScale` 控制小地图自身缩放
- **Scroller**：滚动画布，适合超大画布分页浏览场景，`enabled`/`pannable`/`pageVisible`/`autoResize`
- **⚠️ Scroller 与 panning 冲突**：官方明确"使用 Scroller 插件会默认禁用画布原生 `panning` 拖拽以避免冲突"，需要拖拽平移改为 Scroller 自身的 `pannable: true`
- **动态管理各插件**：多数插件提供 `enableXxx()`/`disableXxx()` 成对方法（如 `enableSnapline()`/`disableSnapline()`），也支持运行时改配置（如 `setSnaplineTolerance()`）
- **事件**：History 有 `history:undo`/`history:redo`/`history:add`/`history:change`；Clipboard 有 `clipboard:changed`
- **进阶顺序**：本页承接[连接桩与连接交互](./ports-and-connecting)，下一步是[自定义节点与数据](./customization-and-data)

## 一、交互能力：Selection / Snapline / Transform

```javascript
import { Graph, Selection, Snapline, Transform } from '@antv/x6' // 3.x 起均从主包导出

graph.use(new Selection({
  enabled: true, multiple: true, rubberband: true,   // rubberband 开启框选
  rubberNode: true, rubberEdge: false,                // 框选是否圈中节点/边
  strict: false,       // true = 选框须完全包裹节点才选中
  movable: true, showNodeSelectionBox: false,
  filter: (cell) => cell.shape !== 'circle',          // 排除某些形状参与选择
}))
// select/unselect/resetSelection/getSelectedCells/cleanSelection/isSelected/isSelectionEmpty

graph.use(new Snapline({
  enabled: true, tolerance: 10,   // 触发对齐的像素距离，默认 10
  sharp: false,                   // true = 短线段代替通栏对齐线
  resizing: false,                // resize 时是否也计算对齐线
  clean: true,                    // 3 秒后自动清除，可传 number 自定义毫秒
}))
// enableSnapline/disableSnapline/setSnaplineTolerance/enableSharpSnapline/setSnaplineFilter

graph.use(new Transform({
  resizing: { enabled: true, minWidth: 0, maxWidth: Infinity, orthogonal: true, preserveAspectRatio: false },
  rotating: { enabled: true, grid: 15 },  // grid：每次旋转的角度步进
}))
```

## 二、快捷键与剪贴板：Keyboard / Clipboard

```javascript
import { Graph, Keyboard, Clipboard } from '@antv/x6'

graph.use(new Keyboard({ enabled: true, global: true })) // global=true 绑定到 document 而非仅容器
graph.bindKey('ctrl+c', () => { graph.copy(graph.getSelectedCells()) })
graph.bindKey('ctrl+v', () => { graph.paste({ offset: 20 }) })
graph.bindKey('ctrl+z', () => graph.undo())
// unbindKey/clearKeys/triggerKey/enableKeyboard/disableKeyboard

graph.use(new Clipboard({ enabled: true }))
// copy(cells, {deep})/cut(cells)/paste({offset, nodeProps, edgeProps, useLocalStorage})
// getCellsInClipboard()/isClipboardEmpty()/isClipboardEnabled()
// 事件：graph.on('clipboard:changed', ({ cells }) => {})
```

## 三、撤销重做 History

```javascript
import { Graph, History } from '@antv/x6'

graph.use(new History({
  enabled: true,
  stackSize: 0,             // 0 = 不限栈深
  beforeAddCommand(event, args) { return true }, // 返回 false 则该操作不计入撤销栈
}))
// undo()/redo()/canUndo()/canRedo()/cleanHistory()/isHistoryEnabled()

// 多个变更合并为一条历史记录（一次 undo 撤销全部）：
graph.startBatch('my-batch'); /* ...多次增删改... */ graph.stopBatch('my-batch')
// 或函数式：graph.batchUpdate(() => { /* ... */ })
```

事件：`history:undo`/`history:redo`/`history:add`/`history:change`。

## 四、模具面板与拖拽：Stencil / Dnd

**Dnd** 是底层拖拽能力，**Stencil 是在 Dnd 基础上封装的模具/组件面板**（侧边栏拖拽创建节点的完整 UI）：

```javascript
import { Graph, Stencil, Dnd } from '@antv/x6'

const stencil = new Stencil({
  target: graph,
  groups: [{ name: 'group1', title: '基础图形', collapsable: true }],
  search: (cell, keyword) => !keyword || cell.shape === 'rect',
  stencilGraphWidth: 200, stencilGraphHeight: 800,
  layoutOptions: { columns: 2, columnWidth: 'auto', rowHeight: 'auto' },
})
stencil.load([graph.createNode({ shape: 'rect', width: 100, height: 40 })], 'group1')
document.getElementById('stencilContainer').appendChild(stencil.container)

// Dnd：更底层的手动拖拽（适合自定义拖拽源，而非用现成模具面板）
const dnd = new Dnd({ target: graph })
function startDrag(e) {
  const node = graph.createNode({ shape: 'rect', width: 100, height: 40 })
  dnd.start(node, e.nativeEvent) // getDragNode/getDropNode 回调可对拖拽中/落地节点做变换
}
```

## 五、小地图与画布滚动：MiniMap / Scroller

```javascript
import { Graph, MiniMap } from '@antv/x6'

graph.use(new MiniMap({
  container: document.getElementById('minimap'),
  width: 300, height: 200, padding: 10,
  scalable: true, minScale: 0.01, maxScale: 16,
}))
```

**Scroller**（滚动画布，适合超大画布分页浏览场景）：

```javascript
graph.use(new Scroller({ enabled: true, pannable: false, pageVisible: false, autoResize: true }))
```

**⚠️ 坑**：官方明确"使用 Scroller 插件会默认禁用画布原生 `panning` 拖拽以避免冲突"，需要拖拽平移改为 Scroller 自己的 `pannable: true`。节点/边的导出能力（`Export` 插件）放在[自定义节点与数据](./customization-and-data)一并讲解，因为导出常与序列化数据一起使用。

## 六、易错点

- **History 与批量操作**：连续多次 `addNode`/`updateData` 若不包在 `startBatch`/`stopBatch`（或 `batchUpdate`）里，`undo()` 一次只撤销最后一步，不是"撤销整批操作"，容易被误认为是 bug。
- **`Scroller` 与 `panning` 隐性冲突**：同时配置画布 `panning: true` 和 `Scroller` 插件，实际生效的是 Scroller 覆盖后的行为（默认禁用原生 panning），不了解这条规则容易误判"配置不生效"。
- **误以为插件包还要单独装**：3.x 里 `Selection`/`Snapline`/`Transform`/`Keyboard`/`Clipboard`/`History`/`Stencil`/`Dnd`/`MiniMap`/`Scroller` 全部从主包 `@antv/x6` 导出，不需要再装对应的 `@antv/x6-plugin-*` 独立包。

---

交互与插件解决了"用户怎么选、怎么拖、怎么撤销"；节点内部怎么塞进 Vue/React 组件、图数据怎么持久化，是下一章的内容：[自定义节点与数据](./customization-and-data)。
