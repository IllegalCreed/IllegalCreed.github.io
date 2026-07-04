---
layout: doc
outline: [2, 3]
---

# 指南 · 场景、相机与网格

> 基于 Babylon.js v9.15。把"能跑第一个场景"用到"会搭场景"：Engine/WebGPUEngine、Scene 子专题、三种常用相机、Mesh 创建与四种批量渲染优化、LOD。

## 速查

**Engine 与 Scene**

- `new BABYLON.Engine(canvas, true)`：默认走 **WebGL2**（自动降级 WebGL1 的情况极少见）
- `WebGPUEngine`：可选后端，需 `await BABYLON.WebGPUEngine.IsSupportedAsync` 探测 + `await engine.initAsync()` **异步初始化**——这是与 WebGL Engine **唯一的接口差异**，其余 API 基本一致（backward compatible）
- Scene 子专题（用到再查）：场景优化（`sceneOptimizer`/octree）、多场景 `multiScenes`、多 canvas `multiCanvas`、离屏渲染 `offscreenCanvas`、自定义加载界面、渲染到 PNG/视频
- `engine.runRenderLoop(() => scene.render())` 注册渲染循环；`window.addEventListener("resize", () => engine.resize())` 响应尺寸变化

**相机（全部需 `camera.attachControl(canvas, true)` 才能接收输入）**

- `ArcRotateCamera`：轨道相机，`alpha`(经度角)/`beta`(纬度角)/`radius`(距目标距离)/`target`，产品展示/看模型首选
- `UniversalCamera`：FPS 第一人称，v2.3 引入，自动识别键盘/鼠标/触摸/手柄，**官方推荐替代 `FreeCamera`**
- `FreeCamera`：`UniversalCamera` 前身，仍可用但官方建议迁移
- `FollowCamera`：跟随指定 mesh 移动；`DeviceOrientationCamera`：响应移动设备陀螺仪；`WebXRCamera`：VR/AR 场景专用，由 WebXR 会话管理
- 多相机切换：`scene.activeCamera = camera2` 直接赋值；多视口用 `camera.viewport` + `scene.activeCameras`（同屏分屏渲染）
- `camera.zoomToMouseLocation`/`wheelDeltaPercentage`/`minZ`/`maxZ` 是常用体验调优属性

**网格创建**

- `MeshBuilder` 是现代统一入口，替代旧版 `BABYLON.Mesh.CreateXxx`；`options` 对象可为空 `{}`，`scene` 参数可省略
- 四类创建方式：预制形状（Box/Sphere/…）、参数化形状（Ribbon/Extrude 等不规则体）、多面体（`CreatePolyhedron`/`CreateIcoSphere`）、自定义网格（手写 `VertexData` 顶点数组）

**批量渲染优化（性能/灵活性递减、数量级递增）**

- Clone（`mesh.clone()`）：完全独立副本，最贵最灵活
- Instance（`mesh.createInstance()`）：共享几何体+材质，GPU instancing 降 draw call，仍可独立变换/拾取
- Thin Instance（`mesh.thinInstanceAdd()`）：矩阵缓冲驱动，最轻量，牺牲部分独立拾取/灵活性
- SPS（`SolidParticleSystem`）：把大量小网格"焊"成一个 mesh，适合极限数量

**LOD 与其他**

- `mesh.addLODLevel(distance, mesh)`：按距离切换细节层次，`addLODLevel(55, null)` 表示超过 55 单位不渲染
- `mesh.useLODScreenCoverage = true`：切换为"屏幕占比"模式，语义与距离模式**相反**（数值越大越精细）
- `mergeMeshes()` 合并减少 draw call；`mesh.dispose()` 释放资源

## 一、Engine 深入：WebGL2 默认 + WebGPUEngine 可选

默认 `Engine` 走 **WebGL2**；`WebGPUEngine` 需要显式创建并 `await` 异步初始化：

```javascript
async function createEngine() {
  const webGPUSupported = await BABYLON.WebGPUEngine.IsSupportedAsync;
  if (webGPUSupported) {
    const engine = new BABYLON.WebGPUEngine(canvas);
    await engine.initAsync(); // 必须 await，与 WebGL Engine 唯一的接口差异
    return engine;
  }
  return new BABYLON.Engine(canvas, true); // 回退 WebGL
}
```

Babylon.js 自 v5.0（2022-05）起支持 WebGPU；核心着色器已在 2024 年重写为原生 WGSL；除 `initAsync` 异步初始化外，其余 API 与 WebGL Engine 保持一致——业务代码基本不用改。WebGPU 的优势在于 compute shader、更低层的 GPU 资源访问、更高的性能上限，光线追踪等能力仍在推进中。

::: tip Scene 的其他子专题
`Scene` 分类下还覆盖场景优化（`optimize_your_scene`/`sceneOptimizer`/octree）、多场景 `multiScenes`、多 canvas `multiCanvas`、离屏渲染 `offscreenCanvas`、自定义加载界面 `customLoadingScreen`、渲染到 PNG/视频等子专题，用到时按需查阅官方文档对应页面。
:::

## 二、相机 Camera

三大常用相机 + 若干专用相机：

| 相机 | 定位 | 关键参数 |
|---|---|---|
| `ArcRotateCamera` | 轨道相机（环绕目标旋转，产品展示/看模型首选） | `alpha`（经度角）、`beta`（纬度角）、`radius`（距目标距离）、`target` |
| `UniversalCamera` | FPS 第一人称，v2.3 引入，自动识别键盘/鼠标/触摸/手柄，**官方推荐替代 `FreeCamera`** | `position` |
| `FreeCamera` | `UniversalCamera` 前身，仍可用但官方建议迁移 | `position` |
| `FollowCamera` | 跟随指定 mesh 移动 | `target` mesh |
| `DeviceOrientationCamera` | 响应移动设备陀螺仪倾斜 | - |
| `WebXRCamera` | VR/AR 场景专用 | 由 WebXR 会话管理 |

```javascript
const camera = new BABYLON.ArcRotateCamera(
  "camera", -Math.PI / 2, Math.PI / 2.5, 3, BABYLON.Vector3.Zero(), scene
);
camera.attachControl(canvas, true); // 不调用则无法交互，必须显式开启
camera.zoomToMouseLocation = true;      // 以鼠标位置为中心缩放
camera.wheelDeltaPercentage = 0.01;     // 缩放速度按当前距离比例缩放
camera.minZ = 0.1; camera.maxZ = 1000;  // 近远裁剪面
```

多相机切换直接赋值 `scene.activeCamera = camera2` 即可；多视口用 `camera.viewport` + `scene.activeCameras`（多相机同屏分屏渲染）。

## 三、网格 Mesh：创建

**`MeshBuilder`** 是现代统一入口，替代旧版 `BABYLON.Mesh.CreateXxx`：

```javascript
const box = BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, scene);
const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
// options 对象可为空 {}；scene 参数可省略（默认当前场景）
```

四类创建方式：**预制形状**（Box/Sphere/… 常规几何体）、**参数化形状**（Ribbon/Extrude 等不规则体）、**多面体**（`CreatePolyhedron`/`CreateIcoSphere`）、**自定义网格**（手写 `VertexData` 顶点数组，最大灵活度）。

## 四、批量渲染优化：四种技术怎么选

同一个模型要渲染成千上万个副本时，按"性能优先级从高到低、灵活性从高到低"排列：

| 技术 | API | 特点 |
|---|---|---|
| Clone | `mesh.clone("name")` | 完全独立副本（自己的顶点缓冲），最贵，最灵活 |
| Instance | `mesh.createInstance("name")` | 共享几何体+材质，GPU instancing 降 draw call，仍可独立变换/拾取 |
| Thin Instance | `mesh.thinInstanceAdd(matrix)` | 矩阵缓冲驱动，最轻量，牺牲部分独立拾取/灵活性，适合成千上万重复物体 |
| Solid Particle System（SPS） | `new BABYLON.SolidParticleSystem(...)` | 把大量小网格"焊"成一个 mesh，配合逐粒子行为，适合极限数量 |

```javascript
// Instance：共享几何体+材质，仍可独立拾取/变换
const instance = mainMesh.createInstance("instance1");
instance.position.x = 5;

// Thin Instance：矩阵缓冲驱动，追求极致性能
const matrix = BABYLON.Matrix.Translation(5, 0, 0);
mainMesh.thinInstanceAdd(matrix);
```

::: warning Thin instances 的拾取限制
`thinInstanceAdd` 追求极致性能，默认不支持像普通 mesh/Instance 那样的单个拾取与独立属性精细控制。选型前想清楚是否需要逐实例交互——需要就用 Instance，只要海量铺开就用 Thin Instance。
:::

## 五、LOD：细节层次

```javascript
mainMesh.addLODLevel(15, mediumDetailMesh);
mainMesh.addLODLevel(30, lowDetailMesh);
mainMesh.addLODLevel(55, null); // 超过 55 单位距离不渲染

// 也可切换为"屏幕占比"模式（数值语义相反：越大越精细）
mainMesh.useLODScreenCoverage = true;
mainMesh.addLODLevel(0.7, mediumDetailMesh); // 占屏 70% 时切中模型
```

::: warning 两种 LOD 模式数值方向相反
默认按**距离**触发：数值越大代表越远，越远换越低模型。切到 `useLODScreenCoverage` 后按**屏幕占比**触发：数值越大代表模型在屏幕上占比越大（越近/越精细）。混用两种心智容易配反阈值。
:::

其他常用操作：`mergeMeshes()` 合并多个网格以减少 draw call；`mesh.dispose()` 释放不再使用的网格资源。骨骼/蒙皮动画留到下一篇详解。

---

搭好场景骨架后，进入[指南 · 材质光照与纹理](./materials-lights-textures)：StandardMaterial/PBR/NodeMaterial 三套材质体系、四种光源与阴影、纹理与环境贴图。
