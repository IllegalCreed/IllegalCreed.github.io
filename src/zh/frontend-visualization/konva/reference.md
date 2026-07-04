---
layout: doc
outline: [2, 3]
---

# 参考：类 / 形状 / 事件 / API 速查

> 基于 Konva v10.3（npm latest 10.3.0）· 核于 2026-07

## 速查

- **架构**：`Stage`（DOM 容器）→ `Layer`（独立 `<canvas>`，含可见 + hit 两张画布）→ `Group`（纯容器）→ `Shape`；保留模式（retained mode），节点持续存在可反复查改。
- **内置形状**：共 19 种，`Rect`/`Circle`/`Ellipse`/`Line`/`Text`/`TextPath`/`Image`/`Sprite`/`Path`/`RegularPolygon`/`Star`/`Ring`/`Arc`/`Wedge`/`Arrow`/`Label`/`Group` 等。
- **通用属性**：`x/y/width/height/fill/stroke/strokeWidth/rotation/scaleX/scaleY/offsetX/offsetY/opacity/draggable/visible/listening/name/id`。
- **事件五族**：鼠标/触摸/指针/拖拽（`dragstart/dragmove/dragend`）/变换（`transformstart/transform/transformend`）；`node.on('a b', fn)` 空格分绑多个；冒泡用 `evt.cancelBubble` 阻止。
- **拖拽约束**：`dragmove` 事件改坐标（教学写法）或 `dragBoundFunc(pos)`（API 写法，收发绝对坐标）。
- **Transformer**：`new Konva.Transformer({ nodes })`；**缩放改的是 `scaleX`/`scaleY` 不是 `width`/`height`**（必考）；`boundBoxFunc` 限边界框、`anchorDragBoundFunc` 锚点吸附、`rotationSnaps` 旋转吸附、`centeredScaling` 居中缩放。
- **动画**：`Konva.Animation(frameFn, layer)` 帧循环（`frame.time/timeDiff/frameRate`）；`Konva.Tween`/`node.to()` 补间（`play/pause/reverse/seek/finish/reset`）；`Konva.Easings` 缓动族。
- **滤镜**：先 `cache()` 后 `filters([...])` 两步法，15 种内置滤镜 + Custom/Mask，像素级操作开销大。
- **序列化**：`toJSON`/`Node.create` 可还原场景树，但官方不建议用作存档方案，推荐业务状态驱动的 `create`/`update` 模式；`toDataURL`/`toImage` 才是导出图片的正规方法。
- **性能两条总纲**：尽量少计算、尽量少绘制；Layer 数量是核心变量（越少越好）；缓存四原则见下文。
- **Node.js**：v10 起需显式导入 `konva/canvas-backend` 或 `konva/skia-backend`，另装 `canvas`/`skia-canvas`，Stage 不需要 `container`（v9 及更早无需此步骤）。
- **框架绑定**：`react-konva@19.2.5`（强绑定 React 19，peerDeps 兼容 Konva 7~10）、`vue-konva@3.4.0`（仅 Vue 3，peerDeps `konva > 7`）。
- **选型口径**：UI 交互（点选/拖拽/缩放）→ Konva；图像合成/对象级编辑 → Fabric.js；海量精灵/高帧率/游戏 → PixiJS（WebGL）；一次性静态绘制 → 原生 Canvas。

## 一、核心类速查表

| 类 | 作用 |
| --- | --- |
| `Konva.Stage` | 舞台，绑定 DOM 容器，可含多个 Layer |
| `Konva.Layer` | 图层，独立 `<canvas>` 元素（含隐藏 hit canvas） |
| `Konva.Group` | 分组容器，不渲染像素，用于批量管理/统一变换 |
| `Konva.Shape` | 所有具体图形的基类，也用于通过 `sceneFunc` 自定义形状 |
| `Konva.Node` | 所有节点（Stage/Layer/Group/Shape）的公共基类，`getAttrs`/`setAttrs`/`clone`/`destroy` 等方法均来自它 |
| `Konva.Transformer` | 变换器：选中节点后提供缩放/旋转交互控制点 |
| `Konva.Animation` | 帧循环动画引擎 |
| `Konva.Tween` | 补间动画引擎 |
| `Konva.Easings` | 缓动函数集合，配合 Tween/`.to()` 使用 |
| `Konva.Filters` | 内置滤镜函数集合，配合 `cache()` + `filters()` 使用 |

## 二、内置形状与通用属性速查

### 内置形状（共 19 种）

| 分类 | 形状 |
| --- | --- |
| 基础几何 | `Rect`（`cornerRadius` 支持数字或 `[左上,右上,右下,左下]` 数组）、`Circle`、`Ellipse`、`Ring`、`Arc`、`Wedge` |
| 线与路径 | `Line`（Blob/Polygon/Simple Line/Spline 变体）、`Arrow`、`Path`（SVG path data） |
| 文本 | `Text`、`TextPath`、`Label`（带背景的文本标签） |
| 图像 | `Image`、`Sprite` |
| 多边形/星形 | `RegularPolygon`、`Star` |
| 容器 | `Group` |

### 通用属性

| 属性 | 说明 |
| --- | --- |
| `x` / `y` | 位置 |
| `width` / `height` | 尺寸（部分形状用 `radius` 等专属属性代替） |
| `fill` / `stroke` / `strokeWidth` | 填充 / 描边 |
| `rotation` | 旋转角度（度数） |
| `scaleX` / `scaleY` | 缩放 |
| `offsetX` / `offsetY` | 变换原点偏移，影响旋转/缩放中心，也连带影响视觉位置 |
| `opacity` | 透明度 |
| `draggable` | 是否可拖拽（桌面 + 移动端自动支持） |
| `visible` / `listening` | 显隐 / 是否参与事件与命中检测 |
| `name` / `id` | 供 `find`/`findOne` 选择器查找 |

### Text 扩展属性

`fontSize`/`fontFamily`/`fontStyle`/`align`（left/center/right）/`wrap`/`ellipsis`/`lineHeight`/`padding`，通用 `shadowColor`/`shadowBlur`/`shadowOffsetX·Y`/`shadowOpacity`。

### 节点操作 API

| API | 说明 |
| --- | --- |
| `layer.findOne('#id')` | 按 id 查找，返回单个节点 |
| `layer.find('.name')` | 按 name 查找，返回节点数组 |
| `layer.find('TypeName')` | 按类型名查找（如 `find('Circle')`） |
| `node.clone(overrideAttrs)` | 克隆节点并覆盖部分属性 |
| `node.destroy()` | 销毁节点，从父容器移除并释放 |
| `node.getAttrs()` / `node.setAttrs({...})` | 读取 / 批量设置全部配置属性 |
| `node.zIndex()` / `moveToTop()` / `moveToBottom()` / `moveUp()` / `moveDown()` | 同容器内绘制层级控制 |
| `node.moveTo(container)` | 跨 Stage/Layer/Group 转移节点 |

## 三、事件与拖拽 / Transformer 速查

### 事件类型

| 事件族 | 事件 |
| --- | --- |
| 鼠标 | `mouseover`/`mouseout`/`mouseenter`/`mouseleave`/`mousemove`/`mousedown`/`mouseup`/`wheel`/`click`/`dblclick` |
| 触摸（移动端自动支持） | `tap`/`dbltap`/`touchstart`/`touchmove`/`touchend` |
| 指针 | `pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`pointerover`/`pointerenter`/`pointerout`/`pointerleave`/`pointerclick`/`pointerdblclick` |
| 拖拽 | `dragstart`/`dragmove`/`dragend` |
| 变换 | `transformstart`/`transform`/`transformend` |

`node.on('click', fn)` 绑定，空格分隔同时绑定多类型；`node.off('click')` 解绑；`evt.cancelBubble = true` 阻止冒泡；`stage.getPointerPosition()` 取相对 Stage 的指针坐标。

### 拖拽约束两种写法

| 写法 | 特点 |
| --- | --- |
| `node.on('dragmove', function () { this.y(50) })` | 教程式：事件回调里直接改坐标锁定单方向 |
| `node.dragBoundFunc((pos) => ({ x: ..., y: ... }))` | API 式：接收/返回**绝对坐标**，声明式约束，专为拖拽设计 |

### Transformer API

| API / 配置项 | 说明 |
| --- | --- |
| `new Konva.Transformer({ nodes })` / `tr.nodes([...])` | 绑定要变换的节点，可动态切换 |
| `boundBoxFunc(oldBox, newBox)` | 限制缩放/旋转后的边界框，返回 `oldBox` 即拒绝本次变换（可做最大/最小尺寸限制） |
| `rotateEnabled` | 是否允许旋转 |
| `enabledAnchors` | 只显示指定的控制点（如四角） |
| `anchorSize` | 控制点大小 |
| `centeredScaling` | 居中缩放（双侧同时变化），或按住 ALT 临时启用 |
| `anchorDragBoundFunc(oldAbsPos, newAbsPos, event)` | 锚点吸附对齐（设计器辅助线） |
| `rotationSnaps` | 旋转吸附角度数组，如 `[0, 90, 180, 270]` |

**关键机制**：Transformer 缩放改变的是 `scaleX`/`scaleY`，不是 `width`/`height`；需要真实像素尺寸时在 `transformend` 里换算 `width * scaleX` 并把 scale 重置为 1。**选中/多选官方范式**：`e.target === stage` 时 `tr.nodes([])` 清空选中；`evt.shiftKey`/`ctrlKey` 判断是否累加/移除选中集合。

## 四、动画与滤镜速查

| API | 说明 |
| --- | --- |
| `new Konva.Animation(frameFn, layer)` | 帧循环；`frame.time`/`timeDiff`/`frameRate`；`start()`/`stop()`；回调只改属性，不手动 `layer.draw()` |
| `new Konva.Tween({ node, duration, 属性, easing })` | 补间；`duration` 单位秒；`play/pause/reverse/seek/finish/reset` |
| `node.to({ ...attrs, duration, easing })` | 单属性快捷动画，内部基于 Tween |
| `Konva.Easings` | `Linear`/`EaseIn·Out·InOut`/`BackEaseIn·Out`/`ElasticEaseIn·Out`/`BounceEaseIn·Out` |
| `shape.cache()` → `shape.filters([...])` | 滤镜两步法，不 cache 不生效 |

**内置滤镜清单**：`Blur`、`Brighten`、`Contrast`、`Grayscale`、`Invert`、`HSL`、`HSV`、`RGB`、`Emboss`、`Sepia`、`Solarize`、`Kaleidoscope`、`Pixelate`、`Noise`、`Threshold`，以及 Custom Filter、Mask，支持数组内多滤镜叠加。Filter Tweening 可对滤镜参数（如 `blurRadius`）做补间过渡。

## 五、性能优化速查表

| 层级 | 优化手段 |
| --- | --- |
| Stage 级 | 控制尺寸不过大；Retina 屏 `Konva.pixelRatio = 1` 换性能 |
| Layer 级 | **最小化 Layer 数量**；非交互 Layer 设 `listening(false)`；拖拽节点临时移到专用 Layer |
| Shape 级 | 复杂/带滤镜形状 `cache()`；不可见对象 `visible(false)`；非交互 `listening(false)`；`perfectDrawEnabled(false)`；`hitStrokeWidth` 单独设命中检测描边宽度 |
| 动画级 | 帧间只做必要属性更新，避免不必要重绘 |
| 批量绘制 | 多次修改属性后统一 `layer.batchDraw()` |
| 内存管理 | 主动 `destroy()` 不再使用的节点/Tween |

**缓存四原则**：① 简单无滤镜形状不缓存；② 缓存吃内存（每节点多开一块 canvas 缓冲区）；③ 优先缓存整个 Group 而非逐个缓存子节点；④ 必须实测帧率差异，不凭感觉优化。

## 六、Node.js 服务端渲染速查

```javascript
import Konva from "konva";
import "konva/canvas-backend"; // 或 import "konva/skia-backend";（渲染质量更好）
import fs from "fs";

const stage = new Konva.Stage({ width: 800, height: 600 }); // Node.js 下不需要 container
const layer = new Konva.Layer();
stage.add(layer);
layer.add(new Konva.Rect({ x: 50, y: 50, width: 300, height: 200, fill: "cornflowerblue" }));

const dataURL = stage.toDataURL({ pixelRatio: 2 });
fs.writeFileSync("out.png", Buffer.from(dataURL.replace(/^data:image\/\w+;base64,/, ""), "base64"));
```

| 版本 | Node.js 后端行为 |
| --- | --- |
| v9 及更早 | `npm install konva` 后直接可用，自动探测后端 |
| v10 起 | **需显式** `import 'konva/canvas-backend'` 或 `'konva/skia-backend'`；自动后端探测已移除；另需安装 `canvas`（node-canvas，生态成熟）或 `skia-canvas`（渲染质量更优，`layer.getNativeCanvasElement().toBuffer()` 可直接拿 Buffer）之一 |

典型场景：邮件/报告里的动态图、服务端图表生成、批量图片处理、无 DOM 环境生成可分享的图片。Next.js 等 SSR 框架中，浏览器端 Canvas 交互仍应只在客户端渲染。

## 七、react-konva / vue-konva 速查对照

| 维度 | react-konva | vue-konva |
| --- | --- | --- |
| 最新版本 | `19.2.5` | `3.4.0` |
| 支持的框架版本 | 强绑定 React `^19.2.0` | 仅 **Vue 3**（不支持 Vue 2） |
| 兼容的 Konva 版本 | `^8.0.1 \|\| ^7.2.5 \|\| ^9.0.0 \|\| ^10.0.0` | `> 7` |
| 组件命名 | 同名组件（`Rect`/`Circle`/`Text`…） | `v-` 前缀（`v-rect`/`v-circle`/`v-text`…） |
| 属性传递 | 拆成独立 props | 单一 `:config` 对象 |
| 事件绑定 | `onClick`/`onDragEnd` 等 props | Vue 原生 `@click`/`@dragend` 语法 |
| 拿原生节点实例 | `useRef()` | 组件 ref |
| 平台限制 | 仅浏览器，不支持 React Native | 仅浏览器 |
| 特色开关 | `useStrictMode(true)` 强制属性同步 | 全局注册（`app.use`）或按需引入 |

## 八、易错点清单

- **Transformer 改的是 scale 不是 size**：`width()`/`height()` 值不变，变的是 `scaleX()`/`scaleY()`，直接读 `width` 计算布局会拿到错误的"视觉尺寸"。
- **react-konva 拖拽状态不同步**：`draggable` + 受控 `x`/`y` props 若不写 `onDragEnd`/`onDragMove`，拖拽结束后下次渲染会把节点"拉回"旧坐标。
- **滤镜必须先 `cache()`**：不调用不会生效或报错；改了影响视觉的属性后需 `clearCache()` 再重新 `cache()`。
- **Layer 数量误区**："越多 Layer 越好"是误解，每个 Layer 都是真实 canvas DOM 元素，官方建议最小化数量。
- **Offset 影响的是旋转/缩放原点，不是位置**：改 `offsetX/offsetY` 后视觉位置也会跟着变，常需连带调整 `x`/`y`。
- **`getPointerPosition()` 坐标系**：Stage 本身做过 `scale()`（视口缩放）时，需要 `stage.getRelativePointerPosition()` 做逆变换，否则会错位。
- **v9 → v10 Node.js 用法不兼容**：v9 项目代码原样升级到 v10 在 Node.js 环境会报错/静默失效，必须显式导入后端。
- **批量修改属性后忘记 `batchDraw()`**：非自动重绘场景下可能不会立刻反映到画面，或触发多次不必要重绘。
- **Transformer 未解绑就销毁节点**：`node.destroy()` 前若节点还绑定在某个 `Transformer.nodes()` 里需先清空，否则可能引用到已销毁节点报错。
- **`toJSON` 当存档方案**：短期能跑，但难做数据迁移/版本兼容，官方建议改用"业务状态 + create/update"模式。
- **自定义 Shape 里手动 `context.fill()`**：应改用 `context.fillStrokeShape(shape)`，手动调用会绕过 Konva 属性系统，导致后续改 `fill` 不生效。
- **hit 区域与视觉区域不一致**：细线条默认很难点中，交互场景常需手动调大 `hitStrokeWidth`（如设为 20）。

## 九、选型对比：Konva vs Fabric.js vs PixiJS vs 原生 Canvas

以下对比综合官方 FAQ 页原文观点与交叉验证的架构事实：

| 维度 | **Konva** | Fabric.js | PixiJS | 原生 Canvas API |
| --- | --- | --- | --- | --- |
| 底层渲染 | 2D Canvas API | 2D Canvas API | WebGL（可回退 Canvas） | 2D Canvas API |
| 架构模型 | 多 Layer（每 Layer 一个 canvas）+ 场景树 | 单一 canvas + 对象模型 | 场景图 + GPU 渲染管线 | 无场景图，命令式立即模式 |
| 渲染模式 | 保留模式（节点持久存在，可反复查改） | 保留模式 | 保留模式 | 立即模式（画完即忘） |
| 框架官方绑定 | React/Vue/Svelte/Angular 均有官方包 | 无官方框架绑定 | 有 React 绑定（`@pixi/react`），生态定位偏游戏 | 无 |
| 变换交互 | `Transformer` 开箱即用（缩放/旋转/多选） | 内置对象自带控制点，交互模型类似但定制性不同 | 无内置，需自行实现或用第三方插件 | 需完全手写 |
| 典型定位（官方原话） | "交互式应用、UI 元素、设计编辑器" | 图像处理/对象操作更强 | "2D 游戏、高帧率动画" | 最大自由度但零封装 |
| 性能上限 | 中；数千形状级别，靠分层+缓存优化 | 中，与 Konva 量级接近 | 高；GPU 加速，适合海量精灵/粒子 | 取决于手写实现质量 |
| TypeScript | 内置类型，无需 `@types` | 需要 `@types/fabric` 或社区维护类型 | 内置类型 | 浏览器内置 lib.dom 类型 |
| 选型建议（官方口径） | UI 交互（点击/拖拽/调整大小）优先选 Konva | 更偏图像编辑/对象操作场景 | 多精灵/高帧率动画选 PixiJS | 只需一次性绘制、无需交互与状态管理时可用原生 API |

**决策速览**：

- 需要"设计器/白板/标注工具"这类**用户要点选、拖拽、缩放旋转已有图形**的场景 → Konva（`Transformer` 是这条路上省心的关键差异化能力）。
- 需要**做图像合成/滤镜/对象级图片编辑**（更偏 Photoshop 式操作）→ Fabric.js 也是同量级候选，图像处理场景 Fabric 生态更专精。
- 需要**成百上千高频动画精灵、游戏渲染、GPU 特效** → PixiJS（WebGL），Konva 的 CPU 2D 光栅化在这个量级会遇到性能天花板。
- 只是**画一次性静态图表/不需要后续交互查改** → 原生 Canvas 2D API 足够，引入 Konva 反而是不必要的抽象开销。
- 本仓库技术栈是 Vue 3 + NestJS，若选型 Konva，`vue-konva` 是对应集成方案；若之前调研过的图表类库（Chart.js/ECharts/D3）已覆盖"数据可视化"需求，Konva 的差异化价值主要体现在"用户可交互编辑图形"这类场景，选型时应明确是否真的需要 Transformer/拖拽这类编辑器级交互，避免为了画图表而引入过重的场景图框架。

## 十、权威链接

- [Konva 官方文档首页](https://konvajs.org/docs/index.html) —— 安装/快速开始导航
- [架构总览 Overview](https://konvajs.org/docs/overview.html) —— Stage/Layer/Group/Shape
- [About](https://konvajs.org/docs/about.html) —— 历史、维护者、生产使用者
- [FAQ](https://konvajs.org/docs/faq.html) —— 官方 vs Fabric/PixiJS 对比原文
- [Demos / Sandbox 索引](https://konvajs.org/docs/sandbox.html)
- [Shapes：Rect](https://konvajs.org/docs/shapes/Rect.html) —— 全部 19 种形状导航入口
- [自定义 Shape](https://konvajs.org/docs/shapes/Custom.html) —— sceneFunc
- [样式 Fill](https://konvajs.org/docs/styling/Fill.html) —— Fill/Stroke/Shadow/Opacity
- [事件绑定](https://konvajs.org/docs/events/Binding_Events.html)
- [拖拽基础](https://konvajs.org/docs/drag_and_drop/Drag_and_Drop.html)
- [Transformer 基础](https://konvajs.org/docs/select_and_transform/Basic_demo.html)
- [Konva.Animation](https://konvajs.org/docs/animations/Create_an_Animation.html)
- [Konva.Tween 与 Easings](https://konvajs.org/docs/tweens/All_Controls.html)
- [滤镜 Blur](https://konvajs.org/docs/filters/Blur.html) —— 含全部滤镜列表
- [选择器 find/findOne](https://konvajs.org/docs/selectors/Select_by_Name.html)
- [序列化最佳实践](https://konvajs.org/docs/data_and_serialization/Best_Practices.html)
- [性能优化汇总](https://konvajs.org/docs/performance/All_Performance_Tips.html)
- [shape.cache() 详解](https://konvajs.org/docs/performance/Shape_Caching.html)
- [Position vs Offset](https://konvajs.org/docs/posts/Position_vs_Offset.html)
- [Node.js 服务端渲染](https://konvajs.org/docs/nodejs/nodejs-setup.html)
- [react-konva 总览](https://konvajs.org/docs/react/index.html)
- [vue-konva 总览](https://konvajs.org/docs/vue/index.html)
- [npm: konva](https://www.npmjs.com/package/konva) ｜ [npm: react-konva](https://www.npmjs.com/package/react-konva) ｜ [npm: vue-konva](https://www.npmjs.com/package/vue-konva)
- [GitHub: konvajs/konva](https://github.com/konvajs/konva)
