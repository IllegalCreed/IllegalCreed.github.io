---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Babylon.js v9.15（`@babylonjs/core` / `babylonjs` 双包同步发布，2026-07 核实）。默认**左手坐标系**；物理当前推荐 V2（Havok），详见[动画与物理篇](./guide-line/animation-physics)。

## 速查

- 定位：Babylon.js 是**全功能引擎**（内置物理/GUI/粒子/资产管线/调试器），[Three.js](../three/) 是**轻量渲染库**（核心只管渲染，其余靠拼装）——本质区别是"引擎全家桶"还是"库的自由拼装"
- 安装二选一：`@babylonjs/core`（ES6 模块化包，**官方推荐新项目**，支持 tree-shaking）vs `babylonjs`（UMD 全量包，仅兼容/学习/CDN 原型用，**不建议生产**）
- 最小场景四要素：**Engine → Scene → Camera / Light → Mesh**，且存在构造顺序依赖（Scene 依赖 Engine，Camera/Light/Mesh 依赖 Scene）
- `new BABYLON.Engine(canvas, true)`：第二参数 `antialias`，开启抗锯齿
- `engine.runRenderLoop(() => scene.render())`：注册每帧回调，`scene.render()` 是真正触发渲染的调用
- `camera.attachControl(canvas, true)`：**必须调用**才能接收鼠标/触摸输入，否则相机无法交互
- `HemisphericLight` 模拟环境光（direction 方向为主色、反方向为 groundColor），与 Directional/Point/Spot 等"单点/方向"光源的直觉区别是"无处不在的柔光" vs "有明确来源的光"
- `window.addEventListener("resize", () => engine.resize())`：画布尺寸变化后必须调用 `engine.resize()` 同步绘制缓冲
- ⚠️ **左手坐标系**：Babylon.js 默认左手系，Three.js/glTF/多数 DCC 工具（3ds Max、Blender 导出等）默认右手系；`scene.useRightHandedSystem = true` 可整体切换，但会影响所有默认假设左手系的内置逻辑
- `MeshBuilder.CreateBox/CreateSphere/CreateGround` 等是创建网格的现代统一入口，`options` 对象可传 `{}`，`scene` 参数可省略（默认当前场景）
- Playground（`playground.babylonjs.com`）约定函数签名 `createScene`/`delayCreateScene`/`createEngine`，是官方文档、论坛答疑、bug 复现的通用在线 IDE
- `scene.debugLayer.show()` 一行打开 **Inspector** 可视化调试器，是排查场景问题的第一手段
- CDN 引入 `babylonjs` UMD 包适合学习/原型，npm 包描述原话明确"不建议生产使用"
- ES6 引入有个坑：只 `import { MeshBuilder }` 有时不够，某些静态工厂方法要靠额外的**副作用导入**才会挂载（见[参考](./reference)）

## 一、定位：全功能引擎 vs 渲染库

Babylon.js 官方一句话定位：内置物理、GUI、粒子、资产管线、可视化调试器（Inspector）、在线 IDE（Playground）、节点式可视化编辑器（材质/几何体/粒子）等一整套"游戏引擎级"配套，目标是让开发者"少拼装、多创作"。

| 维度 | Babylon.js | Three.js |
|---|---|---|
| 定位 | 全功能引擎 | 轻量渲染库 |
| 物理 | 内置官方集成（Havok 一等公民） | 不内置，自行接入 Cannon-es/Rapier 等 |
| GUI | 内置 2D + 3D 两套完整体系 | 无内置，DOM 覆盖层或三方方案 |
| 调试工具 | 官方 Inspector + Playground，开箱即用 | 依赖社区方案 |
| 坐标系 | 默认左手系 | 默认右手系（与 glTF 一致） |
| 生态规模 | 完整但相对小，官方工具链强 | 最大（react-three-fiber、drei 等） |

> 更完整的选型对比表见[参考](./reference)的"选型对比"一节。两者渲染性能量级相近，核心矛盾是"引擎全家桶的便利与体积/心智开销" vs "库的精简与自由拼装的灵活性"。

## 二、安装：两个发行包

**`@babylonjs/core`（ES6，官方推荐新项目）**——按需引入 + tree-shaking，生产包体积可控：

```bash
npm install @babylonjs/core
```

```javascript
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3 } from "@babylonjs/core";
// 部分静态工厂方法需要额外的副作用导入才会"挂载"到类上：
import "@babylonjs/core/Meshes/meshBuilder.js";
```

**`babylonjs`（UMD 全量包）**——单文件全塞，CDN `<script>` 一把梭，适合学习/原型，npm 包描述原话明确**不建议生产使用**：

```html
<!-- 仅学习/原型：生产环境应固定版本号、并按 CDN 提供方发布的哈希值补充 integrity/crossorigin 做子资源完整性校验 -->
<script src="https://cdn.babylonjs.com/babylon.js"></script>
<script>
  const engine = new BABYLON.Engine(canvas, true);
</script>
```

两包版本号严格同步发布（同一 monorepo 出包），当前均为 **v9.15.0**。

## 三、Engine + Scene：第一个场景

Engine 负责对接底层图形 API（WebGL/WebGPU）与音频；Scene 是承载网格、相机、灯光的"舞台"（官方原话：场景就像一个舞台，所有要被看到的网格都放在上面）：

```javascript
// 最小可运行场景（WebGL，默认后端）
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true); // 第二参数 antialias=true

const createScene = function () {
  const scene = new BABYLON.Scene(engine);

  // 相机：轨道相机，四参数 alpha(经度角)/beta(纬度角)/radius(距离)/target
  const camera = new BABYLON.ArcRotateCamera(
    "camera", -Math.PI / 2, Math.PI / 2.5, 15, BABYLON.Vector3.Zero()
  );
  camera.attachControl(canvas, true); // 必须调用才能接收输入

  // 光照：半球光模拟环境光
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

  // 网格：现代统一入口 MeshBuilder
  BABYLON.MeshBuilder.CreateBox("box", {});

  return scene;
};

const scene = createScene();
engine.runRenderLoop(() => scene.render()); // 每帧调用 scene.render() 触发渲染
window.addEventListener("resize", () => engine.resize()); // 窗口变化同步绘制缓冲
```

::: tip Playground 环境的简化写法
在 `playground.babylonjs.com` 里，新建对象会自动挂到"当前场景"，构造函数末尾的 `scene` 参数可以省略。上面这段代码去掉参数末尾的场景引用也能直接跑。
:::

## 四、坐标系提醒：默认左手系

**Babylon.js 默认左手坐标系**，这与 Three.js、glTF、大多数 DCC 工具（3ds Max、Blender 导出等）默认的**右手系**相反——是入门到进阶都容易反复踩的坑，混用/导入导出模型时最容易在旋转方向、法线方向上出错。

```javascript
scene.useRightHandedSystem = true; // 整体切到右手系
```

::: warning 切换坐标系不是无副作用的
`scene.useRightHandedSystem` 会影响所有默认假设左手系的内置逻辑（例如 WebXR 骨骼数据转换等会因此跳过坐标翻转）。是否切换要想清楚，而不是遇到方向不对就随手切一下。glTF 导入/导出时的坐标系差异，官方导出器已通过给根节点加旋转 + 缩放翻转来自动处理，通常不需要手动介入。
:::

---

跑通第一个场景后，进入[指南 · 场景相机网格](./guide-line/scene-camera-mesh)：深入 Engine/WebGPUEngine、三种常用相机、Mesh 创建与批量渲染优化。
