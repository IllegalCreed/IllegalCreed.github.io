---
layout: doc
outline: [2, 3]
---

# 参考：Fabric.js API 速查

> 基于 Fabric.js v7.4.0 · 核于 2026-07

## 速查

- **定位**：Canvas 之上的交互式对象模型库，而非单纯绘图 API；给 Canvas 补上 DOM 式对象树 + 事件系统。
- **版本**：npm 最新 **v7.4.0**（2026-05-18）；v6 止步 **6.9.1**（2025-12-15）；**v7.0.0**（2025-12-22）起连续迭代；v6 的 ESM + TS + 命名导出语法在 v7 完全延续。
- **安装引入**：`npm i --save fabric`；浏览器/打包器 `import { Canvas, Rect } from 'fabric'`；Node 端 `fabric/node`（依赖 `node-canvas`，v7 起锁 `canvas@3.2.x`）；`fabric/es` 官方标注「谨慎使用」。
- **三个特殊改名（v5→v6，延续至今）**：`fabric.Object`→`FabricObject`、`fabric.Text`→`FabricText`、`fabric.Image`→`FabricImage`；其余类名不变，只是从命名空间属性变具名导出。
- **Canvas 继承三层**：`Canvas extends SelectableCanvas extends StaticCanvas`。
- **渲染方法**：`renderAll()` 立即同步；`requestRenderAll()` 合并到下一帧，日常业务优先用后者。
- **FabricObject 通用属性**：`left`/`top`/`width`/`height`/`fill`/`stroke`/`strokeWidth`/`angle`/`opacity`/`originX`/`originY`。
- **内置形状 8 种**：`Rect`/`Circle`/`Ellipse`/`Triangle`/`Line`/`Polygon`/`Polyline`/`Path`。
- **文本三层**：`FabricText`（静态）→ `IText`（可编辑）→ `Textbox`（自动换行，仅宽度可缩放）。
- **图片加载**：`FabricImage.fromURL()` 是 Promise，跨域须 `crossOrigin: 'anonymous'`；滤镜 `filters.push()` + `applyFilters()`。
- **群组**：`Group` 通用容器；`ActiveSelection extends Group` 是框选/多选的临时态，业务代码一般不手动创建。
- **序列化四件套**：`toObject()`/`toJSON()`/`toSVG()`/`toDataURL()` 同步导出；`loadFromJSON()` 异步导入（Promise）。
- **自定义属性**：不注册 `FabricObject.customProperties` 或不覆写 `toObject()`，`toJSON()` 会静默丢弃该字段。
- **子类化**：标准 `class extends FabricObject` + `classRegistry.setClass()` 注册。
- **性能**：`objectCaching`/`noScaleCache`/`dirty` + `config.perfLimitSizeTotal`/`config.maxCacheSideLimit`；viewport 缩放使全部缓存失效。
- **事件**：对象级 `on()`/`off()`，画布级 `canvas.on()`；坐标属性 v7 起为 `scenePoint`/`viewportPoint`（`pointer`/`absolutePointer` 已删除）。
- **v7 breaking change 速记**：origin 默认值 `left/top`→`center`；鼠标右键/中键事件默认值 `false`→`true`；`getCenter`/`getPointer`/`setWidth`/`setHeight` 等方法移除；Gradient `ColorStop.opacity` 移除；Node 最低版本提至 20。
- **安全**：`toSVG()` 曾修复两次 CVE——7.2.0 的 CVE-2026-27013（stored XSS）、7.4.0 的 CVE-2026-44311（CSS 注入）。
- **选型**：少量精细可编辑对象 → Fabric.js / Konva；海量对象/渲染优先 → PixiJS；只需要画出来看 → 原生 Canvas。

## 一、类与 API 速查表

### 核心类

| 类 | 说明 |
| --- | --- |
| `StaticCanvas` | 纯渲染画布，无交互 |
| `Canvas` | 交互式画布（`extends SelectableCanvas extends StaticCanvas`） |
| `FabricObject` | 所有可视对象的基类（v6 前称 `fabric.Object`） |
| `Rect`/`Circle`/`Ellipse`/`Triangle`/`Line`/`Polygon`/`Polyline`/`Path` | 内置基础形状 |
| `FabricText`/`IText`/`Textbox` | 静态文本 / 可编辑文本 / 自动换行文本（v6 前 `FabricText` 称 `fabric.Text`） |
| `FabricImage` | 图片对象（v6 前称 `fabric.Image`） |
| `Group`/`ActiveSelection` | 通用容器 / 框选临时态（`ActiveSelection extends Group`） |
| `PencilBrush`/`CircleBrush`/`SprayBrush`/`PatternBrush` | 自由绘制内置笔刷 |
| `Point` | 二维坐标点，用于 `zoomToPoint` 等 API |
| `classRegistry` | 类注册表，子类化后需注册才能正确序列化/还原 |
| `config` | 全局配置对象（缓存上限等） |

### Canvas / StaticCanvas 常用方法与属性

| 成员 | 说明 |
| --- | --- |
| `add(...objects)` / `remove(...objects)` | 添加/移除对象，可一次传多个 |
| `renderAll()` | 立即同步渲染整棵对象树 |
| `requestRenderAll()` | 合并多次修改到下一帧渲染（日常优先用） |
| `toObject()` / `toJSON()` / `toSVG()` / `toDataURL(opts)` | 四种同步导出 |
| `loadFromJSON(json)` | 异步导入，返回 Promise |
| `zoomToPoint(point, zoom)` | 以指定点为中心缩放视口 |
| `viewportTransform` | 当前视口矩阵 `[a,b,c,d,e,f]` |
| `isDrawingMode` / `freeDrawingBrush` | 自由绘制开关 / 当前画笔实例 |
| `selection` | 是否允许框选 |
| `enableRetinaScaling` | 高分屏适配 |

### FabricObject 常用属性

| 属性 | 说明 |
| --- | --- |
| `left` / `top` | 定位坐标（相对 `originX`/`originY` 基准点） |
| `width` / `height` | 原始尺寸（未经缩放） |
| `scaleX` / `scaleY` | 缩放比例 |
| `angle` | 旋转角度（度） |
| `fill` / `stroke` / `strokeWidth` | 填充 / 描边色 / 描边宽度 |
| `opacity` | 不透明度 |
| `originX` / `originY` | 变换原点（**v6 默认 `left`/`top`，v7 默认 `center`**） |
| `selectable` / `evented` / `hasControls` | 是否可选中 / 是否响应事件 / 是否显示控制点 |
| `lockMovementX` / `lockRotation` / `lockScalingFlip` | 锁定类交互开关 |
| `objectCaching` / `noScaleCache` / `dirty` | 缓存相关 |
| `clipPath` | 裁剪区域（本身也是一个 `FabricObject`，坐标计算方式与 Group 内子对象类似） |

### FabricObject 常用方法

| 方法 | 说明 |
| --- | --- |
| `set(props)` / `get(key)` | 读写属性（**优先用 `set()`** 以正确触发 `dirty` 标记） |
| `scale(v)` / `rotate(angle)` | 缩放 / 旋转 |
| `scaleToWidth(px)` / `scaleToHeight(px)` | 按目标像素反推缩放比 |
| `clone()` | 克隆对象 |
| `setCoords()` | 刷新包围盒与控制点坐标 |
| `calcOwnTransform()` | 只计算对象自身矩阵，不含父级 |
| `calcTransformMatrix()` | 计算含父级（Group/clipPath）的完整矩阵 |
| `setCenterPoint(point)` / `setRelativeCenterPoint(point)` | 按画布坐标系 / 父平面坐标系设置中心 |
| `animate(props, options)` | 高层动画 API |
| `toObject(propertiesToInclude?)` | 序列化（子类化常覆写此方法带出自定义字段） |

### 事件速查

| 事件 | 级别 | 说明 |
| --- | --- | --- |
| `mousedown`/`mouseup`/`mouseover`/`mouseout` | 对象级 | `obj.on()`/`obj.off()` 绑定解绑 |
| `mouse:down`/`mouse:up`/`mouse:move` | 画布级 | `opt.target` 为命中对象，可能为 `null` |
| `object:modified` | 画布级 | 用户完成一次变换操作后触发 |
| `selection:created`/`selection:updated`/`selection:cleared` | 画布级 | `opt.selected` 为选中对象数组 |
| `path:created` | 画布级 | 自由绘制生成一条新路径后触发 |
| `before:render`/`after:render` | 画布级 | 渲染前后钩子 |

事件对象坐标属性：`scenePoint`（画布坐标系）、`viewportPoint`（视口坐标系）——**v7 删除了 `pointer`/`absolutePointer`**，纯改名不改语义。官方文档明确声明事件清单未系统整理，完整事件名请用 `/demos/events-inspector/` 演示页或 TS 类型提示交叉核实。

### 内置滤镜与笔刷

| 类别 | 成员 |
| --- | --- |
| 滤镜 | `Grayscale`/`Brightness`/`Blur`/`Contrast`/`Saturation`/`Vibrance`/`Invert`/`Pixelate`/`ColorMatrix` |
| 笔刷 | `PencilBrush`/`CircleBrush`/`SprayBrush`/`PatternBrush` |
| 缓动函数 | `easeInQuad`/`easeOutQuad`/`easeInOutQuad`/`easeInCubic`/……/`easeOutBounce`/`easeInElastic` 等 20 余种 |

## 二、v6 → v7 关键差异

| 项目 | v6 | v7 |
| --- | --- | --- |
| `originX`/`originY` 默认值 | `'left'`/`'top'` | `'center'`（升级重灾区） |
| 鼠标右键/中键事件 | `fireMiddleClick`/`fireRightClick`/`stopContextMenu` 默认 `false` | 默认改为 `true` |
| `Canvas.getCenter()` | 存在 | 移除，改用 `getCenterPoint()` |
| `Canvas.getPointer()` | 存在 | 移除，拆为 `getScenePoint()`/`getViewportPoint()` |
| `Canvas.setWidth()`/`setHeight()` | 存在 | 移除，改用 `setDimensions({ width, height })` |
| Gradient `ColorStop.opacity` | 存在 | 移除，改用颜色自身 alpha 通道（`rgba()`） |
| 事件坐标属性 | `pointer`/`absolutePointer` | 改名为 `viewportPoint`/`scenePoint` |
| `preserveObjectStacking` | 默认值另有约定 | 默认改为 `true` |
| Node 最低版本 | 无此要求 | `engines.node >= 20.0.0` |
| `Blur` 滤镜 Canvas2D 兜底 | 存在 | 移除，统一走 WebGL |
| 构建工具 | Rollup | Rolldown（7.3.0 起） |

v7 相对 v6 是「装修级」调整而非架构重写——v6.0.0 的 ESM + TypeScript 原生重写 + 命名导出才是历史上最大的一次架构变化，这套语法基座在 v7 完全延续。升级到 v7 时，`originX`/`originY` 默认值变化是影响面最广的一项：沿用旧代码把对象放在 `(0,0)` 会导致对象四分之三跑到画布外，需显式设置 `originX: 'left', originY: 'top'` 或调用官方提供的 `positionByLeftTop()` 迁移辅助。

## 三、选型对比：Fabric.js vs 原生 Canvas / Konva / PixiJS

| 维度 | Fabric.js | 原生 Canvas API | Konva | PixiJS |
| --- | --- | --- | --- | --- |
| 定位 | Canvas 之上的交互式对象模型 | 底层绘图指令集，无对象概念 | 与 Fabric 高度相似的交互对象模型 | WebGL 优先的高性能渲染引擎 |
| 选中/拖拽/缩放/旋转 | 内置 `controls` 系统，开箱即用 | 需自己实现命中检测与变换矩阵 | 内置，`Transformer` 组件对标 Fabric controls | 无内置交互层，需自建或接 `pixi-viewport` |
| 渲染后端 | Canvas2D（滤镜可选 WebGL） | Canvas2D | Canvas2D | WebGL 优先，兼容 WebGPU 演进方向 |
| 序列化 | `toObject`/`toJSON`/`loadFromJSON` 官方一等公民 | 无，需自建方案 | `toJSON`/`Node.create` 内置 | 无内置场景序列化，需自建 |
| SVG 双向互操作 | `loadSVGFromString`/`toSVG` 官方支持 | 无 | 支持有限 | 无（需第三方插件） |
| React 生态 | 无官方绑定，需手动同步生命周期 | 手动 | `react-konva` 官方绑定成熟 | `@pixi/react` 官方绑定成熟 |
| TypeScript/ESM | v6 起原生 TS 重写 + ESM 命名导出 | 语言内置，无额外类型层 | 原生 TS | 原生 TS |
| 性能定位 | 中等对象数量（几十到几千）、属性丰富 | 取决于手写实现质量 | 与 Fabric 接近的中等规模场景 | 万级以上对象/粒子/大规模可视化有明显优势 |
| 典型场景 | 设计工具、白板、海报/证件照编辑器、签名板 | 游戏原型、自绘图表控件、高度定制 UI | 白板、图表编辑器（React 技术栈更顺滑） | 2D 游戏、数据可视化大规模渲染、特效 |

选型建议：需要「图形编辑器/白板/设计工具」且看重序列化存档、SVG 互通、成熟度 → **Fabric.js**（生态更老资历、API 面更广）或 **Konva**（与 React 结合更顺滑，`react-konva` 是官方一线绑定）二选一，两者定位几乎重叠，团队技术栈是 React 时 Konva 略有优势；只需要「画出来看」、不要求对象级选中拖拽交互 → 原生 [Canvas](../canvas/) API 足够；面对「上万对象/粒子特效/游戏级帧率」场景 → **PixiJS**，但要自己搭一层交互/拾取逻辑。核心区分口诀：**Fabric/Konva 是「每个对象都有属性面板」的编辑器思路，PixiJS 是「渲染吞吐量优先」的引擎思路。**

## 四、易错点清单

- **v5 语法照抄报错**：`import { fabric } from 'fabric'` + `fabric.Canvas` 命名空间写法 v6 起彻底失效，必须改具名导出 `import { Canvas } from 'fabric'`。
- **类名改名漏改**：`fabric.Object`→`FabricObject`、`fabric.Text`→`FabricText`、`fabric.Image`→`FabricImage`，批量替换脚本容易漏掉这三个特殊改名。
- **异步 API 当同步用**：`loadFromJSON`/`loadSVGFromString`/`FabricImage.fromURL`/滤镜的 `fromObject` 等大量返回 Promise，必须 `await`/`.then()`。
- **v7 origin 默认值坑**：升级到 v7 后对象默认以中心对齐坐标，旧代码把对象放在 `(0,0)` 会跑出画布外。
- **`objectCaching` 与实时视觉不同步**：直接改属性不走 `set()` 可能不会正确标记 `dirty`，画面没更新；viewport 整体缩放会让所有对象缓存同时失效。
- **忘记 `setCoords()`**：手动改 `left`/`top`/`scaleX` 等且没有触发内部同步逻辑，包围盒与控制点可能跟视觉外观不同步。
- **跨域图片「画布污染」**：`FabricImage.fromURL()` 加载跨域图片不设 `crossOrigin: 'anonymous'`，后续 `toDataURL()`/滤镜触发 canvas tainted 异常。
- **Group 内坐标系陷阱**：对象加入 `Group` 后 `left`/`top` 变为相对父 Group 的坐标而非画布绝对坐标。
- **v7 鼠标事件默认反转埋雷**：`fireRightClick`/`fireMiddleClick` 默认改 `true`，旧处理器没按 `event.button` 过滤可能被意外触发。
- **Node 环境依赖坑**：`fabric/node` 依赖 `node-canvas` 原生编译（需系统级 Cairo 等依赖），CI/Docker 镜像没装工具链会导致 `npm install` 失败；v7 起 `engines.node` 要求 `>=20`（官方安装文档一度仍写「支持 Node >= 18」，与 changelog「BREAKING: Update min node version to 20」有文档滞后，以 changelog / `package.json` `engines` 字段为准）。
- **自定义属性静默丢失**：直接 `obj.myProp = xxx` 赋值但不注册 `customProperties` 或不覆写 `toObject()`，`toJSON()` 导出时字段被悄悄丢弃、不报错。
- **事件清单没有官方权威版本**：不要凭记忆「默写」一份完整事件列表，务必用 TS 类型提示或 `events-inspector` demo 交叉核实。
- **方法链风格已不推荐**：v5 时代链式写法在 v6+ 仍可能可用，但官方不再推荐，新代码应拆成独立语句。

## 五、安全须知：SVG 导出 CVE

`toSVG()`/`loadSVGFromString` 对不可信内容的处理，近两个大版本各修复一次安全问题：

| CVE | 修复版本 | 类型 |
| --- | --- | --- |
| CVE-2026-27013 | 7.2.0 | Stored XSS |
| CVE-2026-44311 | 7.4.0 | CSS 注入 |

涉及用户可控 SVG 内容导入/导出的场景（如允许用户上传 SVG 素材、把 `toSVG()` 输出直接嵌入页面），应确认所用版本已包含上述修复，不假设旧版本的 SVG 双向转换对不可信输入天然安全。

## 六、权威链接

- [Fabric.js 官方文档](http://fabricjs.com/) —— 官网首页
- [文档首页导航](http://fabricjs.com/docs/) —— 核心概念、安装、迁移指南入口
- [v5→v6 迁移指南](http://fabricjs.com/docs/upgrading/upgrading-to-fabric-60/)
- [v6→v7 迁移指南](http://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/)
- [核心概念总览](http://fabricjs.com/docs/core-concepts/)
- [安装指南](http://fabricjs.com/docs/getting-started/installing/)
- [第一个应用教程](http://fabricjs.com/docs/getting-started/helloworld/)
- [事件系统文档](http://fabricjs.com/docs/events/)
- [变换与坐标系文档](http://fabricjs.com/docs/transformations/)
- [对象缓存文档](http://fabricjs.com/docs/fabric-object-caching/)
- [控件配置文档](http://fabricjs.com/docs/configuring-controls/)
- [自定义属性文档](http://fabricjs.com/docs/using-custom-properties/)
- [演示总览页](http://fabricjs.com/demos/)
- [自由绘制演示](http://fabricjs.com/demos/free-drawing/)
- [动画缓动演示](http://fabricjs.com/demos/animation-easing/)
- [Canvas API](http://fabricjs.com/api/classes/canvas/)
- [FabricObject API](http://fabricjs.com/api/classes/fabricobject/)
- [FabricImage API](http://fabricjs.com/api/classes/fabricimage/)
- [Group API](http://fabricjs.com/api/classes/group/)
- [IText API](http://fabricjs.com/api/classes/itext/)
- [Textbox API](http://fabricjs.com/api/classes/textbox/)
- [ActiveSelection API](http://fabricjs.com/api/classes/activeselection/)
- [Path API](http://fabricjs.com/api/classes/path/)
- [资源页](http://fabricjs.com/resources/)
- [GitHub Releases](https://github.com/fabricjs/fabric.js/releases) —— v6.6.x ~ v7.4.0
- [GitHub CHANGELOG](https://raw.githubusercontent.com/fabricjs/fabric.js/master/CHANGELOG.md)
