---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与 v8 异步初始化

> 基于 PixiJS v8.19（npm 实测 `dist-tags.latest`）· 核于 2026-07

## 速查

- **定位**：PixiJS 是 2D **渲染引擎**（不是图表库/UI 框架），双后端 WebGL（默认）/ WebGPU（可选），专为游戏、交互应用、海量图形对象 + 高帧率场景设计。
- **vs Canvas 2D**：Canvas 2D 是浏览器原生**立即模式**绘图 API，无场景图、无 GPU 批处理；PixiJS 在 WebGL 之上构建了完整场景图 + 批处理，图元一多（几百+复杂图形）PixiJS 明显更快更稳。
- **vs Konva / Fabric.js**：二者都封装 Canvas 2D，走「图形应用/编辑器」心智（Konva 偏白板/流程图，Fabric 偏可编辑对象 + 选择缩放手柄），量级和 Canvas 2D 接近；PixiJS 走 GPU 渲染，量大更快，但需要自己补交互层（拖拽/选中）。
- **vs Three.js**：都能画 2D，但 Three.js 面向 3D、心智负担重；纯 2D 场景 PixiJS 的批处理/纹理图集更贴合需求，两者也可"混用"分层（Three.js 管 3D、PixiJS 管 2D UI 叠加）。
- **选型速记**：静态图表/少量图形 → 原生 Canvas 2D 足够；图形编辑器/白板要开箱即用交互 → Konva（简单场景）或 Fabric（要选择手柄）；60fps 动画 + 成百上千交互对象 + 滤镜特效 + 游戏级性能 → PixiJS；要做真三维 → Three.js。
- **安装（脚手架）**：`npm create pixi.js@latest` —— 新项目起步，自带模板。
- **安装（接入现有项目）**：`npm install pixi.js` —— 单包，纯 ESM 优先，同时提供 CJS/`.d.ts`。
- **导入方式**：`import { Application, Sprite } from 'pixi.js'`；子功能按需 `import 'pixi.js/xxx'`（如 `accessibility`、`advanced-blend-modes`），漏 import 不报错但功能不生效。
- **v8 最小可运行代码**：`new Application()` → `await app.init(options)` → `document.body.appendChild(app.canvas)`。
- ⚠️ **忘记 `await app.init()`**：`new Application()` 后立即访问 `app.stage`/`app.canvas` 会拿到 `undefined`——v7→v8 迁移最常见的坑。
- **为什么要异步**：WebGPU 获取渲染上下文本身是异步操作，v8 统一走异步 init（即便最终选中的是 WebGL 也一样）。
- ⚠️ **`app.view` 已改名 `app.canvas`**：v7 教程代码直接复制会报错/拿不到画布元素。
- **`preference` 默认值是 `'webgl'`**：不要以为 v8 会默认吃到 WebGPU 性能红利，不显式传 `preference: 'webgpu'` 就是走 WebGL——"自动选择"指的是环境探测/降级兜底，不是"默认优先 WebGPU"。
- **关键属性**：`app.stage`（场景图根 `Container`）/ `app.canvas`（画布元素）/ `app.ticker`（渲染循环）/ `app.renderer` / `app.screen`。
- **第一个精灵**：`await Assets.load(url)` 拿纹理 → `new Sprite(texture)` → 设 `anchor`/`position`/`scale`/`rotation` → `app.stage.addChild(sprite)`。
- **`anchor`**：精灵的旋转/缩放中心点，`sprite.anchor.set(0.5)` 即以中心为基准（默认是左上角 `0,0`）。
- ⚠️ **`Texture.from(url)` 在 v8 不再直接联网加载**：必须先 `await Assets.load(url)` 让资源进入缓存，`Texture.from(url)`（同步方法）才能拿到，找不到会报错而非发请求。
- **进阶顺序**：本页 → [Application 与场景图](./guide-line/app-and-scene) → [Graphics·文本与资源](./guide-line/graphics-text-assets) → [事件·Ticker·滤镜](./guide-line/events-ticker-filters) → [性能与迁移](./guide-line/performance-and-migration) → [参考](./reference)。

## 一、PixiJS 是什么：定位与选型

PixiJS 是一个 **2D 渲染引擎**：它不提供图表组件、不提供按钮/布局系统，只负责把大量图形对象以尽可能高的帧率画到屏幕上。默认渲染后端是 **WebGL**（稳定成熟），也支持 **WebGPU**（功能完整但浏览器实现有差异，官方仍建议生产环境优先 WebGL），二者由 `Application.init()` 的 `preference` 选项 + 环境探测决定，还有一个仍在完善中的 `CanvasRenderer` 兜底。

放进整个「2D 图形技术栈」里对比，选型口径大致是：

| 维度 | PixiJS | Canvas 2D（原生） | Konva | Fabric.js |
| --- | --- | --- | --- | --- |
| 渲染后端 | WebGL（默认）/ WebGPU（可选） | CPU 光栅化 2D Context | 封装 Canvas 2D | 封装 Canvas 2D |
| 场景图 | 完整（`Container` 树 + Transform 继承） | 无，需自行管理绘制状态 | 有（Stage/Layer/Group/Shape） | 有对象模型 + 内建选择/缩放手柄 |
| 交互 | Federated Events，`eventMode` 精细控制，拖拽/选中需自己实现 | 需手写命中检测 | 内建拖拽（`draggable`），事件绑定简单 | 内建选择框、旋转缩放手柄，编辑器体验开箱即用 |
| 性能定位 | 大量对象/高帧率首选，批处理 + 图集 + `ParticleContainer` | 对象一多（几百+复杂图形）掉帧明显 | 基于 Canvas 2D，量大会慢于 PixiJS | 对象模型开销更重，量大更容易卡 |
| 学习曲线 | 中等（`Container`/`Texture`/`Assets`/事件模式） | 低（API 简单但要自建场景图/循环） | 低-中（API 友好） | 低-中（编辑器场景开箱即用，定制渲染管线难） |
| 典型场景 | 2D 游戏、大规模数据点可视化、复杂交互动效、滤镜/混合模式 | 简单图表、少量图形、体积敏感的小工具 | 白板/流程图/图形编辑器 | 设计工具、海报编辑器、白板 |

完整对比（含 Three.js）见[参考页](./reference)。一句话选型：只是画个静态图表 → Canvas 2D 原生足够；做「图形编辑器/白板」想少写交互代码 → Konva/Fabric；要 60fps 动画、成百上千交互对象、游戏级性能 → PixiJS。

## 二、安装

两种起步方式：

```bash
# 方式一：脚手架起步（新项目，自带模板）
npm create pixi.js@latest

# 方式二：接入现有项目
npm install pixi.js
```

```js
// v8 是单包 pixi.js，纯 ESM 优先设计，同时提供 CJS/.d.ts
import { Application, Sprite, Assets } from 'pixi.js';

// 子功能默认不打进主包，需要时按需 import（不 import 不报错，只是功能不生效）
import 'pixi.js/accessibility'; // 无障碍支持
import 'pixi.js/advanced-blend-modes'; // 高级混合模式滤镜
```

v8 移除了 v7 时代 `@pixi/app`、`@pixi/sprite` 等一堆子包各自引入的模式，改为从统一入口 `pixi.js` 解构导入。

## 三、v8 异步 Application.init（重点）

v8 中 `Application` 构造函数**不再接受参数**，必须先 `new` 再 `await app.init(options)`——因为 WebGPU 获取上下文本身是异步操作，v8 把这套异步流程统一成标准姿势（即便最终选中的是 WebGL 也要走异步 init）：

```js
import { Application } from 'pixi.js';

const app = new Application();
await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb,
  backgroundAlpha: 1,
  resizeTo: window,          // 自动跟随 window/元素尺寸
  preference: 'webgl',       // 'webgl' | 'webgpu'，默认就是 'webgl'
  antialias: true,
  resolution: window.devicePixelRatio || 1, // 适配高清屏
  autoDensity: true,
});

// v7 是 app.view，v8 改名 app.canvas
document.body.appendChild(app.canvas);
```

也可以分别为 WebGL/WebGPU 传专属配置：

```js
await app.init({
  webgl: { antialias: true },
  webgpu: { antialias: false },
});
```

初始化完成后的关键属性：

- `app.stage`：场景图**根节点**（一个 `Container`），所有要渲染的对象最终都要挂在它下面。
- `app.canvas`：真正插入 DOM 的画布元素（原 `app.view`）。
- `app.ticker`：驱动渲染循环的 `Ticker`。
- `app.renderer`：底层渲染器实例（`WebGLRenderer`/`WebGPURenderer`）。
- `app.screen`：当前渲染区域尺寸（`Rectangle`）。

`Application` 内置了几个插件：**Ticker Plugin**（渲染循环）、**Resize Plugin**（响应式尺寸，配合 `resizeTo`）、**Culler Plugin**（可选，需手动注册才会启用）；也支持自定义 `ApplicationPlugin` 扩展应用生命周期（如统一接入分析/监控逻辑）。

## 四、第一个精灵

有了 `app.stage` 之后，加一张图只需要三步：加载纹理 → 创建 `Sprite` → 挂到场景图：

```js
import { Assets, Sprite } from 'pixi.js';

// 1. 异步加载纹理（v8 的 Assets 是现代资源管理单例）
const texture = await Assets.load('path/to/bunny.png');

// 2. 用纹理创建精灵
const sprite = new Sprite(texture);

// 3. 设置基础变换属性
sprite.anchor.set(0.5);       // 锚点设为中心：旋转/缩放都以中心为基准
sprite.position.set(400, 300); // 位置
sprite.scale.set(2);           // 缩放两倍
sprite.rotation = Math.PI / 4; // 旋转 45 度（弧度制）
sprite.tint = 0xff0000;        // 着色（乘色，可用于换色而不用多张贴图）

// 4. 挂到场景图才会被渲染
app.stage.addChild(sprite);
```

`sprite.width = 100` 这类直接设尺寸的写法也可用，PixiJS 内部会自动换算成对应的 `scale`。换纹理时（`sprite.texture = newTexture`）PixiJS 会自动重新绑定纹理更新监听、按需重算宽高以保持视觉尺寸、并触发视觉更新，不需要手动处理。

---

有了 Application 与第一个精灵，下一步进入 [Application 与场景图](./guide-line/app-and-scene)：深入 `Application` 的完整配置项、`Container` 场景图 API 全家桶，以及 `Sprite` 的进阶用法。
