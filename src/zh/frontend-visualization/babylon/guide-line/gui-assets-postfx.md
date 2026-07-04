---
layout: doc
outline: [2, 3]
---

# 指南 · GUI、资产与后处理

> 基于 Babylon.js v9.15。2D/3D GUI 两套体系；glTF 优先的资产加载与压缩扩展；CPU/GPU 粒子系统；DefaultRenderingPipeline 一站式后处理；Inspector/Playground 调试工具链。

## 速查

**2D GUI（`AdvancedDynamicTexture`，基于 `DynamicTexture` 渲染）**

- `CreateFullscreenUI("myUI")`：全屏 UI，**每场景仅允许 1 个**；`CreateForMesh(planeMesh, w, h)`：贴到某个 mesh 表面，常用于 VR 面板
- 常用控件：`TextBlock`/`Button`（`ImageButton`/`SimpleButton`）/`StackPanel`（水平/垂直堆叠）/`Rectangle`（`cornerRadius` 圆角）/`Image`（`FILL`/`UNIFORM`/`EXTEND`/`NINE_PATCH` 拉伸模式）
- 布局属性 `left`/`top`/`width`/`height` 支持像素或百分比；容器 `adaptWidthToChildren`/`adaptHeightToChildren` 自适应子内容
- ⚠️ 非 Button 控件默认**不拦截指针事件**，需手动 `control.isPointerBlocker = true`

**3D GUI（挂物理网格的空间交互 UI，与 2D GUI 是两套独立体系）**

- 容器：`GUI3DManager` + `StackPanel3D`、`VolumeBasedPanel` 系（`SpherePanel`/`CylinderPanel`/`PlanePanel`/`ScatterPanel`）
- 控件：`Button3D`、`HolographicButton`/`TouchHolographicButton`（支持手部追踪，MRTK 风格）、`HolographicSlate`（可拖拽/旋转面板）、`NearMenu`/`HandMenu`（XR 专用菜单）
- 全部继承 `Control3D`，自定义控件需实现 `_createNode()`/`_affectMaterial()`

**资产加载**

- 现代推荐：`registerBuiltInLoaders()`（`@babylonjs/loaders/dynamic`，首次遇到某类型才按需加载对应 loader）+ `LoadAssetContainerAsync`/`AppendSceneAsync`/`ImportMeshAsync` 模块函数
- 旧版 `SceneLoader.ImportMesh/Append/LoadAssetContainer`（回调风格）仍可用，新代码建议用 Async 函数（更利于 tree-shaking）
- 支持格式：`.gltf`/`.glb`（首选，2.0 版本；1.0 已弃用）、`.obj`、`.stl`、`.ply`/`.splat`/`.spz`（Gaussian Splatting）
- glTF 压缩扩展：`KHR_draco_mesh_compression`（Draco）/`EXT_meshopt_compression`（Meshopt）/`KHR_texture_basisu`（KTX2/Basis）——需额外配置解码器
- `AssetsManager`：多资产批量加载 + 进度管理，7 种 Task（`MeshAssetTask`/`TextFileAssetTask`/`BinaryFileAssetTask`/`ImageAssetTask`/`TextureAssetTask`/`CubeTextureAssetTask`/HDR 等）

**粒子系统**

- `ParticleSystem`（CPU）：`capacity`/`emitter`/`minSize`/`maxSize`/`minLifeTime`/`maxLifeTime`/`emitRate`/`direction1-2`/`color1-2`；`start()`/`stop()`（停发不停渲染现有粒子）/`reset()`
- `GPUParticleSystem`：动画渲染都在 GPU，单系统可达百万级，需 WebGL2；**限制**：不支持手动指定发射数量、mesh 发射器、部分渐变类型、子发射器
- 其他：`SolidParticleSystem`（把网格焊成一个大 mesh）、`point_cloud_system`（点云）、Node Particle Editor（NPE，节点式无代码配置）

**后处理 Post-Process**

- `DefaultRenderingPipeline`：一站式集合，`samples`（MSAA）/`fxaaEnabled`/`bloomEnabled`/`depthOfFieldEnabled`/`imageProcessingEnabled`/`chromaticAberrationEnabled`/`grainEnabled`/`sharpenEnabled`；用前查 `pipeline.isSupported`
- 独立可插拔管线：`SSAORenderingPipeline`（屏幕空间环境光遮蔽）、`ssrRenderingPipeline`（屏幕空间反射）

**调试与开发工具**

- `scene.debugLayer.show()`（或 ES Module `Inspector.Show(scene, {})`）打开 **Inspector**：Scene Explorer（层级大纲）+ Inspector Pane（属性/Debug/统计/工具）
- **Playground**（`playground.babylonjs.com`）：`createScene`/`delayCreateScene`/`createEngine` 三种模板函数，Save 生成带版本号 URL，Download 导出项目 zip
- 其他节点编辑器：**NME**（材质）、**NGE**（Node Geometry Editor）、**NPE**（粒子）

## 一、2D GUI：AdvancedDynamicTexture

```javascript
// 模式一：全屏 UI（每场景仅允许 1 个）
const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");

// 模式二：贴到某个 mesh 表面（常用于 VR 面板）
const ui2 = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(planeMesh, 1024, 1024);

const button = BABYLON.GUI.Button.CreateSimpleButton("btn", "Click Me");
button.width = "150px"; button.height = "40px";
button.onPointerClickObservable.add(() => console.log("clicked"));
ui.addControl(button);
```

常用控件：`TextBlock`、`Button`（`ImageButton`/`SimpleButton`）、`StackPanel`（水平/垂直堆叠子控件）、`Rectangle`（`cornerRadius` 圆角）、`Image`（`FILL`/`UNIFORM`/`EXTEND`/`NINE_PATCH` 拉伸模式）。布局属性 `left`/`top`/`width`/`height` 支持像素或百分比；容器 `adaptWidthToChildren`/`adaptHeightToChildren` 自适应子内容。

::: warning 全屏 UI 唯一性 + 控件默认不拦截指针
`CreateFullscreenUI` 每个 scene 只能有一个，重复创建会互相覆盖/冲突。另外非 Button 控件（如用 `Rectangle` 当点击热区）默认**不拦截指针事件**，需要显式设置 `control.isPointerBlocker = true`，否则点击会穿透到下层。
:::

## 二、3D GUI：空间交互面板

3D GUI 挂物理网格实现空间交互，与 2D GUI 是**两套独立体系**：

```javascript
const manager = new BABYLON.GUI.GUI3DManager(scene);
const panel = new BABYLON.GUI.StackPanel3D();
manager.addControl(panel);
const btn3D = new BABYLON.GUI.HolographicButton("btn3D");
panel.addControl(btn3D);
```

容器：`StackPanel3D`、`VolumeBasedPanel` 系（`SpherePanel`/`CylinderPanel`/`PlanePanel`/`ScatterPanel`）；控件：`Button3D`、`HolographicButton`/`TouchHolographicButton`（支持手部追踪，MRTK 风格）、`HolographicSlate`（可拖拽/旋转的内容面板）、`NearMenu`/`HandMenu`（XR 专用菜单）；全部继承 `Control3D`，自定义控件需实现 `_createNode()`/`_affectMaterial()` 两个扩展点。

## 三、资产加载：glTF 优先

现代推荐用法（`@babylonjs/loaders/dynamic`，模块级函数，tree-shaking 友好）：

```typescript
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
registerBuiltInLoaders(); // 动态导入，首次遇到某类型模型才按需加载对应 loader

import { LoadAssetContainerAsync, AppendSceneAsync, ImportMeshAsync } from "@babylonjs/core";
const container = await LoadAssetContainerAsync("model.glb", scene); // 不直接加入场景
await AppendSceneAsync("model.glb", scene);                          // 直接并入现有场景
const result = await ImportMeshAsync("model.glb", scene);            // 只导入网格
```

旧版 `SceneLoader.ImportMesh`/`Append`/`LoadAssetContainer`（回调风格）仍可用，但新代码建议用上述 Async 模块函数，更利于 tree-shaking、配置更简单。

**支持格式**：`.gltf`/`.glb`（首选，2.0 版本；1.0 已弃用）、`.obj`、`.stl`、`.ply`/`.splat`/`.spz`（Gaussian Splatting）。

**glTF 压缩扩展**：`KHR_draco_mesh_compression`（Draco 几何压缩）、`EXT_meshopt_compression`（Meshopt）、`KHR_texture_basisu`（KTX2/Basis 纹理压缩）——需要额外配置解码器（`DracoDecoder`/`MeshoptCompression`/`KhronosTextureContainer2`），可从 CDN 拉取或自托管。

```javascript
// AssetsManager：多资产批量加载 + 进度管理
const assetsManager = new BABYLON.AssetsManager(scene);
const meshTask = assetsManager.addMeshTask("skullTask", "", "scenes/", "skull.babylon");
meshTask.onSuccess = (task) => console.log(task.loadedMeshes);
assetsManager.onProgress = (remaining) => {};
assetsManager.load();
```

7 种 Task：`MeshAssetTask`/`TextFileAssetTask`/`BinaryFileAssetTask`/`ImageAssetTask`/`TextureAssetTask`/`CubeTextureAssetTask`/HDR 等变体。

::: warning 压缩扩展的解码器是额外依赖
glTF 文件用了压缩扩展但项目没引入/托管对应解码器，会导致加载失败或报错，容易被误判为"文件损坏"——排查前先确认解码器是否配置。
:::

## 四、粒子系统：CPU 与 GPU

**`ParticleSystem`（CPU）**：

```javascript
const ps = new BABYLON.ParticleSystem("particles", 2000, scene); // capacity 上限
ps.particleTexture = new BABYLON.Texture("flare.png", scene);
ps.emitter = mesh; // mesh / AbstractMesh / Vector3 均可作发射源
ps.minSize = 0.1; ps.maxSize = 0.5;
ps.minLifeTime = 0.3; ps.maxLifeTime = 1.5;
ps.emitRate = 100;
ps.direction1 = new BABYLON.Vector3(-1, 1, -1);
ps.direction2 = new BABYLON.Vector3(1, 1, 1);
ps.color1 = new BABYLON.Color4(1, 0, 0, 1);
ps.color2 = new BABYLON.Color4(0, 0, 1, 1);
ps.start(); // ps.start(3000) 可延时启动；ps.stop()：停发不停渲染现有粒子；ps.reset()
```

**`GPUParticleSystem`**——动画和渲染都放到 GPU，单系统可达百万级粒子（官方示例 100 万），需 WebGL2（`BABYLON.GPUParticleSystem.IsSupported` 检测），用 `activeParticleCount` 控制并发数量。**限制**：不支持手动指定发射数量、mesh 发射器、部分渐变类型、子发射器（sub-emitters）；GPU 上无内建随机数，内部用纹理存随机值（默认 16K 精度）代替。

::: warning stop() 不等于立即清空粒子
`ParticleSystem.stop()` 只是停止新粒子发射，已存在的粒子仍会渲染完生命周期；需要立刻清空要配合或改用 `reset()`。GPU 版本的能力缺口（不支持 mesh 发射器/部分渐变/子发射器）是设计限制而非 bug，选型前先看清单。
:::

其他：`SolidParticleSystem`（SPS，把网格"焊"成一个大 mesh）、`point_cloud_system`（点云）、Node Particle Editor（NPE，节点式无代码配置粒子行为）。

## 五、后处理 Post-Process

**`DefaultRenderingPipeline`**——一站式常用后处理集合：

```javascript
const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]); // 第二参数=启用 HDR 纹理
pipeline.samples = 4;                 // MSAA（WebGL2）
pipeline.fxaaEnabled = true;          // 或 FXAA
pipeline.bloomEnabled = true;
pipeline.depthOfFieldEnabled = true;  // 控制 focalLength/fStop/focusDistance
pipeline.imageProcessingEnabled = true; // 色彩曲线/分级/对比度/曝光/色调映射/晕影
pipeline.chromaticAberrationEnabled = true;
pipeline.grainEnabled = true;
pipeline.sharpenEnabled = true;
if (!pipeline.isSupported) { /* 降级处理 */ }
```

还有独立可插拔的 `PostProcess`/`PostProcessRenderPipeline`、`SSAORenderingPipeline`（屏幕空间环境光遮蔽）、`ssrRenderingPipeline`（屏幕空间反射）等专用管线。

## 六、调试与开发工具：Inspector 与 Playground

**Inspector**——场景可视化调试器：

```javascript
scene.debugLayer.show(); // 最简用法
// ES Module 按需引入：
import { Inspector } from "@babylonjs/inspector";
Inspector.Show(scene, {});
```

两大面板：Scene Explorer（层级大纲，支持按名过滤、gizmo/可见性快捷操作）+ Inspector Pane（属性网格/Debug/统计/工具 4 个 tab）；支持 default/embedded/popup 三种显示模式；内建骨骼、物理、法线、纹理等专项可视化工具。

**Playground**（`playground.babylonjs.com`）——浏览器端在线 IDE，支持 JS/TS，`createScene`/`delayCreateScene`（异步加载场景用）/`createEngine`（自定义引擎配置）三种模板函数；Save 生成带版本号的唯一 URL（如 `#6F0LKI#1`），Download 导出完整项目 zip，可 iframe 嵌入论坛帖子；是官方文档、论坛答疑、bug 复现的通用载体。

其他节点编辑器：**NME**（Node Material Editor）、**NGE**（Node Geometry Editor）、**NPE**（Node Particle Editor）——三者都是"可视化搭节点→生成对应资源"的图形化工具，覆盖材质/几何体/粒子三大可编程系统。

---

回到[参考](../reference)查核心类、`MeshBuilder`、材质与全部 API 速查表；也可回顾[入门](../getting-started)里 Babylon.js 与 Three.js 的引擎/库选型对比。
