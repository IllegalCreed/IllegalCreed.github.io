---
layout: doc
outline: [2, 3]
---

# 序列化、react-konva 与性能优化

> 基于 Konva v10.3（npm latest 10.3.0）· 核于 2026-07

## 速查

- **序列化 API**：`stage.toJSON()` 序列化整棵场景树；`Konva.Node.create(json, containerId)` 反序列化重建；`stage.toDataURL({ pixelRatio })` 导出图片（可提升导出分辨率）；`stage.toImage({ callback })` 拿 `HTMLImageElement`。
- **官方明确不推荐**大型应用直接依赖 `toJSON`/`Node.create` 做存档方案（视觉细节与业务数据强耦合，难做版本迁移），推荐"业务状态驱动"：只持久化业务数据，写 `create(state)`（全量重建）与 `update(state)`（增量更新属性）两个函数分层处理。
- **react-konva**：`npm install react-konva konva`；所有内置形状映射为同名 React 组件，props 即 Konva 属性；`useRef` 拿真实 Konva 节点实例；仅支持浏览器（不支持 React Native）。
- **react-konva 坑**：`draggable` 节点若受控 `x`/`y` props 却没绑 `onDragEnd`/`onDragMove`，拖拽结束后下次渲染会把节点"弹回"旧坐标，官方会在控制台报警告。
- **useStrictMode**：`useStrictMode(true)` 开启后节点属性总被强制同步为渲染函数给出的值，用于排查"改了 props 但节点没变"。
- **vue-konva**：`npm install vue-konva konva`（仅 Vue 3）；组件前缀统一 `v-`（`v-stage`/`v-layer`/`v-rect`…）；配置通过单一 `:config` 对象传入（不像 React 拆成独立 prop）；事件用 Vue 原生 `@事件名` 语法。
- **性能两条总纲**：尽量少计算（Compute as little as possible）、尽量少绘制（Draw as little as possible）。
- **Stage 级**：控制尺寸不过大；Retina 屏 `Konva.pixelRatio = 1` 换性能。
- **Layer 级**：**尽量减少 Layer 数量**（每个都是独立 canvas DOM）；不需要交互的 Layer 设 `listening(false)`；拖拽中把节点临时移到专用 Layer，结束再移回。
- **Shape 级**：复杂/多次绘制的形状用 `cache()`；不可见对象 `visible(false)`；不需要交互设 `listening(false)`；`perfectDrawEnabled(false)` 换性能；`hitStrokeWidth` 单独控制命中检测描边宽度。
- **缓存四原则**：① 简单无滤镜形状不缓存；② 缓存吃内存（每节点多开一块 canvas 缓冲区）；③ 优先缓存一整个 Group 而非逐个缓存子节点；④ 一定要实测帧率差异，别凭感觉优化。
- **批量绘制**：多次修改属性后统一 `layer.batchDraw()`；react-konva 内部非 `autoDrawEnabled` 场景也是靠 `batchDraw()` 合批。
- **内存管理**：主动 `destroy()` 不再使用的节点/Tween，避免长期运行页面内存泄漏。
- **本页收尾**：读到这里已覆盖 Konva 全部核心主题，回[参考页](../reference)查速查表与选型对比。

## 一、数据与序列化

```javascript
const json = stage.toJSON(); // 序列化整棵场景树
const stage2 = Konva.Node.create(json, "container-id"); // 反序列化重建

const dataURL = stage.toDataURL({ pixelRatio: 2 }); // 导出图片（可提升导出分辨率）
stage.toImage({
  callback(img) {
    /* 拿到 HTMLImageElement */
  },
});
```

**官方 Best Practices 页明确不推荐**大型应用直接依赖 `toJSON`/`Node.create` 做存档方案，理由：容易把视觉细节和业务数据耦合在一起，难以做版本迁移。推荐模式是"应用状态驱动"：只持久化必要的业务数据（如 `[{x:10,y:10}, {x:160,y:1041}]`），再写 `create(state)`（从状态重建整棵树、加载图片、绑定事件）与 `update(state)`（只更新属性，数量变化才重建节点）两个函数分层处理。这个思路与 React/Vue 的声明式渲染理念相通——**Konva 场景树应该是业务状态的渲染投影，而不是唯一真相源**。

`toDataURL`/`toImage` 则是"导出图片"场景的正规方法，与存档场景是两回事，不要混为一谈。

## 二、React 集成：react-konva

```bash
npm install react-konva konva --save
```

```jsx
import { Stage, Layer, Rect, Transformer } from "react-konva";
import { useRef, useEffect, useState } from "react";

function App() {
  const rectRef = useRef();
  const trRef = useRef();
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    trRef.current.nodes([rectRef.current]); // 命令式绑定 Transformer
  }, []);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect
          ref={rectRef}
          x={pos.x}
          y={pos.y}
          width={100}
          height={100}
          fill="yellow"
          draggable
          onDragEnd={(e) => setPos({ x: e.target.x(), y: e.target.y() })} // 必须同步回 state
        />
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => (newBox.width > 200 ? oldBox : newBox)}
        />
      </Layer>
    </Stage>
  );
}
```

- 定位：官方称其为"最流行的 React canvas 图形库"，所有内置形状都映射为同名 React 组件（`Rect`/`Circle`/`Line`/`Text`/`Image`/`Star`…），props 即 Konva 属性，完整支持事件 props（`onClick`/`onDragEnd`…）。
- **仅浏览器环境**：react-konva 官方声明不支持 React Native。
- `useRef` 拿到真实 Konva 节点实例（`rectRef.current` 就是 `Konva.Rect` 对象），可直接调用原生方法。
- **Strict Mode**：`import { useStrictMode } from 'react-konva'; useStrictMode(true);` 开启后节点属性总是被强制同步为渲染函数给出的值（用于排查"我改了 props 但节点没变"的问题）。
- 内部性能优化：非 `autoDrawEnabled` 场景下用 `batchDraw()` 合并多次属性更新为一次重绘，减少 Layer/Stage 重复绘制。
- peerDependencies 显示当前 `react-konva@19.2.5` 同时兼容 Konva 7/8/9/10 大版本，但强绑定 React 19（要求 `react`/`react-dom` `^19.2.0`）。

**常见坑**：上面示例里的 `onDragEnd` 不是可选项——如果 `<Rect>` 同时设置 `draggable` 和受控 `x`/`y` props，却没有绑定 `onDragEnd`/`onDragMove`，官方会在控制台报警告，因为拖拽只改了 Konva 内部节点的实际位置，React state 并不知情，下次渲染会把节点强行"拉回" props 里的旧坐标。

## 三、Vue 集成：vue-konva（本仓库技术栈对应方案）

```bash
npm install vue-konva konva --save
```

```vue
<template>
  <v-stage :config="stageSize">
    <v-layer>
      <v-rect :config="rectConfig" @dragend="onDragEnd" />
      <v-circle :config="circleConfig" />
    </v-layer>
  </v-stage>
</template>

<script setup>
import { ref } from "vue";
const stageSize = { width: window.innerWidth, height: window.innerHeight };
const rectConfig = ref({ x: 50, y: 50, width: 100, height: 100, fill: "red", draggable: true });
function onDragEnd(e) {
  rectConfig.value.x = e.target.x();
  rectConfig.value.y = e.target.y();
}
</script>
```

- 组件前缀统一为 `v-`：`v-stage`/`v-layer`/`v-rect`/`v-circle`/`v-ellipse`/`v-line`/`v-image`/`v-text`/`v-star`/`v-label`/`v-path`/`v-transformer` 等，仅支持 **Vue 3**（不支持 Vue 2）。
- 两种注册方式：全局注册（插件形式，`app.use(VueKonva)`，上手快）或按需引入单个组件（减小包体积）。
- 配置通过单一 `:config` 对象传入（而非像 React 版本把每个属性拆成独立 prop），事件用 Vue 原生 `@事件名` 语法（如 `@click`/`@dragend`）绑定，事件回调参数即原生 Konva 事件对象。
- 文档覆盖 Cache、Custom Shapes、Drag & Drop、Events、Filters、Images、Animations、Transformers、Undo/Redo 等与 React 版本对等的主题页。
- `vue-konva@3.4.0` 的 peerDependencies 为 `konva: >7`、`vue: ^3`——本仓库前端技术栈是 Vue 3，若在管理后台或图形编辑类需求里选型 Konva，`vue-konva` 是直接对应的集成方案。

## 四、性能优化全景（官方两条总纲）

官方性能页两条总纲：**尽量少计算（Compute as little as possible）、尽量少绘制（Draw as little as possible）**。

- **Stage 级**：控制 Stage 尺寸不过大；移动端设置 viewport meta 防止意外缩放；Retina 屏可设 `Konva.pixelRatio = 1` 换取性能（牺牲清晰度）。
- **Layer 级**：**尽量减少 Layer 数量**（每个 Layer 都是独立 canvas DOM 元素，本身有创建/内存开销）；不需要交互的 Layer 调用 `layer.listening(false)`；拖拽时可以把当前拖拽的节点临时移到专用 Layer，拖拽结束再移回，避免拖拽期间重绘整个复杂场景。
- **Shape 级**：复杂形状/多次绘制操作的形状用 `shape.cache()` 缓存为位图，避免每帧重新走绘制指令；视口外或不可见对象直接 `visible(false)` 或移除；不需要交互的形状 `listening(false)`；有 fill+stroke+opacity 组合时可 `perfectDrawEnabled(false)` 关闭"完美绘制"模式换性能；`hitStrokeWidth` 可单独设置命中检测用的描边宽度（默认 `'auto'` 与 `strokeWidth` 一致），配合 `shadowForStrokeEnabled(false)` 减少描边阴影的额外计算。
- **缓存的取舍**：官方四原则——① 没有滤镜的简单形状不要缓存（直接画可能更快）；② 缓存会为每个节点多开辟 canvas 缓冲区，滥用吃内存；③ 优先对"一组形状"整体 cache（cache 一个 Group）而不是逐个 cache；④ 一定要实测启用/禁用缓存的帧率差异，避免凭感觉优化。
- **动画级**：避免不必要的重绘，动画帧间只做必要的属性更新。
- **批量绘制**：多次修改属性后统一 `layer.batchDraw()`，避免每次 setAttr 都触发一次重绘；react-konva 内部在 `autoDrawEnabled=false` 时也是靠 `batchDraw()` 合批。
- **内存管理**：主动 `destroy()` 不再使用的节点/Tween，避免长期运行页面内存泄漏。

## 五、性能相关常见坑

- **Layer 数量误区**："分层能提升性能"不等于"越多 Layer 越好"——每个 Layer 都是一个真实 canvas DOM 元素，Layer 本身有创建和内存成本，官方原话是"最小化 Layer 数量"，只在真正需要独立更新节奏的场景才拆 Layer。
- **`hit` 区域与视觉区域不一致**：细线条（`strokeWidth` 很小）默认很难点中，`hitStrokeWidth` 默认是 `'auto'`（等于 strokeWidth），交互场景常需要手动调大 `hitStrokeWidth`（如设为 20）让"细线也容易点中"，这在图表/连线类交互里是常见需求但容易被忽略。
- **批量修改属性后忘记 `batchDraw()`**：直接连续 `shape.x(1); shape.y(2); shape.fill('red');` 在非自动重绘场景下可能不会立刻反映到画面，或者触发多次不必要的重绘；应在一组修改后统一调用 `layer.batchDraw()`。
- **拖拽时的性能技巧**：把正在拖拽的节点临时移到专用 Layer，`dragend` 后再移回原 Layer，避免拖拽过程中重绘整个复杂场景。

序列化、框架集成、性能优化是把 Konva 用进真实项目的最后一块拼图。完整的类/属性/API 速查表与 vs Fabric/PixiJS/原生 Canvas 的选型对比表，见[参考页](../reference)。
