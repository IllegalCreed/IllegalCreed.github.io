---
layout: doc
outline: [2, 3]
---

# 参考：PixiJS API 速查

> 基于 PixiJS v8.19 · 核于 2026-07

## 速查

- **定位**：2D 渲染引擎，双后端 WebGL（默认，`preference: 'webgl'`）/ WebGPU（可选）；不是图表库/UI 框架。
- **核心链路**：`new Application()` → `await app.init(options)` → `app.stage.addChild(...)` → `app.canvas` 插入 DOM。
- **场景图**：`Container` 树，`worldTransform`/`worldAlpha` 父子累积；v8 起叶子节点（Sprite/Graphics/Mesh）不可再 `addChild`。
- **Graphics v8**：先画形状再 `fill()`/`stroke()`；`GraphicsContext` 跨实例复用几何；挖洞用 `.cut()`。
- **文本三选一**：`Text`（精细样式）/ `BitmapText`（海量动态文本）/ `HTMLText`（富文本标签，异步渲染）。
- **`Assets`**：Promise 化加载器，`load`/`get`/`unload`；Manifest + Bundle 分组懒加载；Resolver 处理多分辨率。
- **`eventMode` 默认 `'passive'`**：五取值 `none`/`passive`/`auto`/`static`/`dynamic`。
- **Ticker 回调参数是 `Ticker` 实例**：取 `ticker.deltaTime`，非裸数字。
- **Filters**：数组 = 链式叠加；自定义需 `GlProgram`（+ 可选 WebGPU 程序）。
- **性能三招**：Render Groups（子树独立场景图）、`cacheAsTexture`（整体缓存成纹理）、手动 Culling（v8 不再自动裁剪）。
- **`ParticleContainer`**：`addParticle()` 而非 `addChild()`，`Particle` 无子节点/事件/滤镜。
- **v7→v8 三大改名**：`app.view`→`app.canvas`、`container.name`→`container.label`、枚举全部改字符串（`'nearest'`/`'repeat'`）。
- **选型速记**：静态图表/少量图形 → Canvas 2D；图形编辑器/白板 → Konva/Fabric；60fps+海量交互对象+游戏级性能 → PixiJS；真三维 → Three.js。
- **官方资源**：[pixijs.com](https://pixijs.com) ｜ [GitHub](https://github.com/pixijs/pixijs) ｜ DevTools 浏览器插件可视化调试场景图。

## 一、核心类速查表

| 类 | 职责 |
| --- | --- |
| `Application` | 应用外壳：`new Application()` + `await init(options)`，持有 `stage`/`canvas`/`ticker`/`renderer`/`screen` |
| `Container` | 场景图节点基类：`addChild`/`removeChild`/`addChildAt`/`swapChildren`/`reparentChild`，`position`/`scale`/`rotation`/`pivot`/`skew`/`visible`/`alpha` |
| `Sprite` | 最基础的可视元素（一张纹理），`anchor`/`tint`/`width`/`height` |
| `Graphics` | v8 链式绘图 API：`.rect()`/`.circle()`/`.fill()`/`.stroke()`/`.cut()` |
| `GraphicsContext` | 跨 `Graphics` 实例复用的几何数据（替代 v7 `GraphicsGeometry`） |
| `Text` | Canvas 光栅化文本，`TextStyle` 配置字体/描边/阴影 |
| `BitmapText` | 预烘焙位图字形集，大量动态文本首选 |
| `HTMLText` | `foreignObject` 内嵌真实 HTML，支持富文本标签 |
| `TilingSprite` | 高效平铺纹理，`tilePosition`/`tileScale` 控制滚动与瓷砖缩放 |
| `NineSliceSprite` | 九宫格拉伸（原 `NineSlicePlane`），`leftWidth`/`topHeight` 等定义不变形边距 |
| `Mesh` / `MeshSimple` / `MeshRope` / `MeshPlane` | 自定义几何渲染原语（Geometry + Shader + State） |
| `ParticleContainer` / `Particle` | 海量精灵专用容器，`addParticle()` 而非 `addChild()` |
| `Assets` | 资源管理单例：`load`/`get`/`unload`/`init`/`loadBundle`/`addBundle` |
| `Ticker` | 渲染循环驱动器：`add`/`addOnce`/`remove`，`deltaTime`/`elapsedMS` |
| `Color` | 统一颜色抽象，接受 CSS 命名色/十六进制/`{r,g,b,a}`/HSL 等格式 |
| `Matrix` / `Point` / `ObservablePoint` | 数学工具，`ObservablePoint` 值变化时触发回调 |
| `Rectangle` / `Circle` / `Ellipse` / `Polygon` / `RoundedRectangle` / `Triangle` | 形状类，命中测试/裁剪区域常用 |
| `Filter` / `GlProgram` | 自定义滤镜：着色器程序 + `resources` 传 uniform |
| `extensions` / `ExtensionType` | 扩展系统：LoadParser/ResolveParser/CacheParser/DetectionParser 等类型可注册替换 |

## 二、事件 eventMode 速查

| 取值 | 行为 |
| --- | --- |
| `none` | 完全忽略交互事件，子元素也不响应，性能最优 |
| `passive`（**默认**） | 自身不响应点击，但可交互子元素仍正常工作 |
| `auto` | 仅当父级可交互时才参与命中测试，自身不主动触发 |
| `static` | 标准交互：接收 pointer/mouse/touch 事件，适合按钮等静止元素 |
| `dynamic` | 同 `static`，额外在指针静止时每帧做合成命中检测，适合会动的对象 |

事件类型三类：指针事件（推荐，`pointerdown`/`pointerup`/`pointermove`/`pointertap`）、鼠标事件（`click`/`rightclick`/`wheel`）、触摸事件（`touchstart`/`tap`）。`sprite.interactive = true` 仍可用，是 `eventMode = 'static'` 的别名。

## 三、Ticker / UPDATE_PRIORITY 速查

```js
app.ticker.add((ticker) => { /* ticker.deltaTime 是缩放后帧时差 */ });
app.ticker.addOnce(fn);
app.ticker.remove(fn);
```

| 优先级 | 数值 |
| --- | --- |
| `UPDATE_PRIORITY.HIGH` | 50 |
| `UPDATE_PRIORITY.NORMAL` | 0（默认） |
| `UPDATE_PRIORITY.LOW` | -50 |

`ticker.minFPS`/`ticker.maxFPS`（0 = 不限制）钳制帧率；`app.stop()`/`app.start()` 手动暂停/恢复循环；`sharedTicker: false` 可创建独立 `Ticker` 实例。

## 四、Filters 内置滤镜速查

| 滤镜 | 用途 |
| --- | --- |
| `AlphaFilter` | 整体透明度 |
| `BlurFilter` | 高斯模糊，`strength` 控制强度 |
| `ColorMatrixFilter` | 颜色矩阵变换（灰度/反色/饱和度等） |
| `DisplacementFilter` | 位移贴图扭曲效果 |
| `NoiseFilter` | 噪点效果，`noise` 控制强度 |

高级混合模式（如 `HardMixBlend`）需 `import 'pixi.js/advanced-blend-modes'` 才生效。自定义滤镜需提供 `GlProgram`（WebGL 必需）与可选 WebGPU 程序，通过 `resources` 传 uniform。社区滤镜包 `pixi-filters` v8 起按子路径导入（如 `pixi-filters/adjustment`），替代 v7 `@pixi/filter-adjustment`。

## 五、性能优化速查

| 手段 | 要点 |
| --- | --- |
| Render Groups | `new Container({ isRenderGroup: true })`，子树独立场景图，变换计算下放 GPU；不要滥用 |
| Render Layers | `layer.attach(obj)`/`detach(obj)`，视觉顺序与逻辑父子关系解耦 |
| `cacheAsTexture` | 容器整体渲染进纹理复用；限制 >4096×4096px 可能失败 |
| Culling | v8 默认关闭且不自动，需手动 `Culler.shared.cull()` 或注册 `CullerPlugin` |
| `ParticleContainer` | `addParticle()`，区分动态/静态属性，`boundsArea` 需手动设置 |
| 纹理 GC | 默认 3600 帧未用自动回收，`textureGCMaxIdle` 可调 |
| 遮罩层级 | 轴对齐矩形遮罩最快 > 图形遮罩 > 精灵遮罩（走滤镜）最慢 |
| 释放资源 | `destroy()` 彻底释放；`texture.source.unload()` 只卸 GPU 显存保留引用 |

## 六、v7 → v8 变化速查表

| 分类 | v7 | v8 |
| --- | --- | --- |
| 初始化 | `new PIXI.Application(options)` | `new Application()` + `await app.init(options)` |
| 画布属性 | `app.view` | `app.canvas` |
| Graphics 绘制 | `beginFill().drawRect().endFill()` | `.rect().fill()` |
| Graphics 线型 | `lineStyle({ width, color })` | `.stroke({ width, color })` |
| Graphics 挖洞 | `beginHole()`/`endHole()` | `.cut()` |
| 几何复用 | `GraphicsGeometry` | `GraphicsContext` |
| 容器命名 | `container.name` | `container.label` |
| 场景图限制 | 叶子节点可 `addChild` | 叶子节点不可再 `addChild` |
| 交互开关 | `interactive = true`（默认近似 `'auto'`） | `eventMode = 'static'`（默认 `'passive'`） |
| 粒子容器 | `addChild(sprite)` | `addParticle(particle)`，需手动设 `boundsArea` |
| Ticker 回调 | 裸 `delta` 数字 | `Ticker` 实例，取 `.deltaTime` |
| 裁剪 | `cullable = true` 自动生效 | 需手动 `Culler.shared.cull()` 或 `CullerPlugin` |
| 缓存 | `cacheAsBitmap = true` | `cacheAsTexture({...})` |
| 包围盒 | `getBounds()` 返回 `Rectangle` | 返回 `Bounds`，需 `.rectangle` |
| 纹理加载 | `Texture.from(url)` 可联网 | 须先 `await Assets.load(url)` |
| 全局配置 | `settings.RESOLUTION`/`settings.ADAPTER` | `AbstractRenderer.defaultOptions.resolution`/`DOMAdapter.set()` |
| 枚举常量 | `SCALE_MODES.NEAREST`/`WRAP_MODES.REPEAT`/`DRAW_MODES.TRIANGLES` | 字符串 `'nearest'`/`'repeat'`/`'triangle-list'` |
| 类改名 | `NineSlicePlane`/`SimpleMesh`/`SimplePlane`/`SimpleRope` | `NineSliceSprite`/`MeshSimple`/`MeshPlane`/`MeshRope` |
| 社区滤镜 | `@pixi/filter-adjustment` | `pixi-filters/adjustment` |
| Uniform 定义 | 普通值 | 每个 uniform 需 `{ value, type: 'f32' }` 显式类型（供 WebGPU 生成 layout） |

## 七、选型对比：PixiJS vs Canvas 2D vs Konva vs Fabric.js vs Three.js

| 维度 | PixiJS v8 | Canvas 2D（原生 API） | Konva | Fabric.js | Three.js |
| --- | --- | --- | --- | --- | --- |
| 渲染后端 | WebGL（默认）/ WebGPU（可选）| CPU 光栅化 2D Context | 封装 Canvas 2D | 封装 Canvas 2D | WebGL/WebGPU，面向 3D |
| 定位 | 高性能 2D 渲染引擎（游戏/交互/可视化底层） | 浏览器原生绘图 API，无场景图 | 易用的 2D 场景图库（图形编辑/舞台类应用） | 面向"可编辑对象"的画布库（设计工具/白板） | 3D 渲染引擎，2D 只是特例用法 |
| 场景图/对象模型 | 完整场景图（Container 树 + Transform 继承） | 无场景图，需自行管理绘制状态 | 有场景图（Stage/Layer/Group/Shape） | 有对象模型，内建选择/缩放/旋转控制手柄 | 有场景图（Scene/Object3D 树），但是 3D 空间 |
| 交互能力 | Federated Events，`eventMode` 精细控制，需要自己实现拖拽/选中逻辑 | 需手写命中检测（如 `isPointInPath`） | 内建拖拽（`draggable`）、事件绑定简单 | 内建选择框、旋转缩放手柄，编辑器体验开箱即用 | 需第三方库辅助拾取，2D 交互非强项 |
| 性能定位 | 大量对象/高帧率首选，批处理+纹理图集+ParticleContainer 专为海量精灵优化 | 对象一多（几百+复杂图形）掉帧明显，无 GPU 批处理 | 基于 Canvas2D，量级和 Canvas2D 接近，量大会慢于 PixiJS | 同样基于 Canvas2D，且对象模型开销更重，量大更容易卡 | GPU 渲染强，但用来做纯 2D 是"杀鸡用牛刀"，心智成本高 |
| 学习曲线 | 中等（需理解 Container/Texture/Assets 异步加载/事件模式） | 低（API 简单但要自己搭场景图/动画循环） | 低-中（API 友好，文档面向"图形应用"） | 低-中（编辑器场景开箱即用，定制渲染管线难） | 高（3D 数学、相机、光照等概念负担重） |
| 典型场景 | 2D 游戏、大规模数据点可视化、复杂交互动效、需要滤镜/混合模式的视觉效果 | 简单图表、少量图形、一次性绘制、体积敏感的小工具 | 白板/流程图/图形编辑器类应用 | 设计工具、海报编辑器、白板（强调"可编辑对象" UX） | 3D 场景、WebXR、需要透视/光照的可视化 |

**选型速记**：只是画个静态图表/少量图形 → Canvas 2D 原生足够；要做"图形编辑器/白板"且想少写交互代码 → Konva（简单场景）或 Fabric（要选择/变换手柄）；要 60fps 动画、成百上千交互对象、滤镜特效、游戏级性能 → PixiJS；要做真三维 → Three.js（2D UI 叠加可与 PixiJS 混用）。

## 八、生态 Ecosystem

| 项目 | 说明 |
| --- | --- |
| `@pixi/react` | 以 React 声明式方式管理 PixiJS 对象，要求 React 19+ |
| DevTools | 浏览器扩展，实时查看渲染性能/场景图层级/纹理管理 |
| Layout | 基于 Facebook Yoga 引擎的 CSS 风格 flexbox 布局 |
| pixi-spine | Spine 骨骼动画集成 |
| pixi-filters | 高性能滤镜合集（模糊、发光等），v8 起按子路径导入 |
| pixi-sound | 基于 WebAudio 的音频播放（含音频滤镜） |
| UI | 预制按钮/滑块/进度条/复选框等交互组件库 |
| AssetPack | 资源打包/清单自动生成工具，配合 Assets/Manifest/Resolver 使用 |
| pixi-viewport | 社区生态，相机/视口缩放平移控件，常用于地图类/无限画布场景 |

## 九、权威链接

- [PixiJS 官网](https://pixijs.com) —— 首页与生态入口
- [8.x 指南首页](https://pixijs.com/8.x/guides/getting-started/intro) —— 官方文档站导航
- [快速开始](https://pixijs.com/8.x/guides/getting-started/quick-start) —— 脚手架与最小示例
- [架构总览](https://pixijs.com/8.x/guides/concepts/architecture) —— 双后端 + 扩展系统
- [场景图](https://pixijs.com/8.x/guides/concepts/scene-graph) —— Container 树与世界变换
- [Render Groups](https://pixijs.com/8.x/guides/concepts/render-groups) ｜ [Render Layers](https://pixijs.com/8.x/guides/concepts/render-layers)
- [性能建议](https://pixijs.com/8.x/guides/concepts/performance-tips) ｜ [垃圾回收](https://pixijs.com/8.x/guides/concepts/garbage-collection)
- [Application 组件](https://pixijs.com/8.x/guides/components/application) —— 完整 init 选项表
- [Graphics](https://pixijs.com/8.x/guides/components/scene-objects/graphics) —— v8 链式绘图 API
- [Assets](https://pixijs.com/8.x/guides/components/assets) ｜ [Manifest](https://pixijs.com/8.x/guides/components/assets/manifest) ｜ [Resolver](https://pixijs.com/8.x/guides/components/assets/resolver)
- [Events](https://pixijs.com/8.x/guides/components/events) —— Federated Events 与 eventMode
- [Filters](https://pixijs.com/8.x/guides/components/filters) —— 内置滤镜与自定义 Filter
- [v7→v8 迁移指南](https://pixijs.com/8.x/guides/migrations/v8) —— 权威破坏性变更清单
- [GitHub · pixijs/pixijs](https://github.com/pixijs/pixijs) —— 源码与 Issue
- [npm · pixi.js](https://registry.npmjs.org/pixi.js/latest) —— 版本实测：`8.19.0`
