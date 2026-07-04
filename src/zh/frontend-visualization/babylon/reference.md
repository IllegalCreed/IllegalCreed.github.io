---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Babylon.js v9.15。核心类、相机、材质/光照/阴影、动画/物理、GUI/资产/粒子/后处理速查表，以及与 Three.js 的选型对比、易错点清单、权威链接。

## 速查

- **Engine 二选一**：`Engine`（WebGL2，默认）/ `WebGPUEngine`（需 `await engine.initAsync()`），业务层 API 基本一致
- **相机**：`ArcRotateCamera`（轨道，产品展示首选）/ `UniversalCamera`（FPS，替代 `FreeCamera`）/ `FollowCamera`/`DeviceOrientationCamera`/`WebXRCamera`，全部需 `attachControl`
- **Mesh 创建**：`MeshBuilder.CreateXxx` 现代统一入口；批量优化 Clone → Instance → Thin Instance → SPS **性能递增、灵活性递减**；LOD 用 `addLODLevel`/`useLODScreenCoverage`
- **材质**：`StandardMaterial`（diffuse/specular/emissive）/ `PBRMetallicRoughnessMaterial`（metallic/roughness，推荐）/ `PBRSpecularGlossinessMaterial`（二选一不混用）/ `NodeMaterial`（节点式，配 NME 编辑器）
- **光照**：`Hemispheric`/`Directional`/`Point`/`Spot` 四种，构造签名统一 `(name, 方向/位置, scene)`，材质默认最多响应 **4 盏光**
- **阴影**：`ShadowGenerator` + `renderList.push` + `receiveShadows = true` 缺一不可；质量选项 Poisson/BlurESM/PCF/ContactHardening 逐档更贵
- **动画**：`Animation` + `setKeys` + `scene.beginAnimation`；`AnimationGroup` 打包多动画统一控制；`Skeleton`/`Bone`/`MorphTarget` 覆盖骨骼与变形
- **物理**：V1（`PhysicsImpostor` + Cannon/Oimo/Ammo，legacy）vs **V2**（`PhysicsBody`/`PhysicsShape` + Havok，官方强烈推荐）；`PhysicsAggregate` 简化封装
- **GUI**：2D `AdvancedDynamicTexture`（`CreateFullscreenUI` 每场景限 1 个 / `CreateForMesh`）+ 3D `GUI3DManager` + `Control3D` 体系，两套独立系统
- **资产**：`registerBuiltInLoaders()` + `LoadAssetContainerAsync`/`AppendSceneAsync`/`ImportMeshAsync`；glTF 首选，Draco/Meshopt/KTX2 三种压缩扩展
- **粒子**：`ParticleSystem`（CPU）/ `GPUParticleSystem`（百万级，有能力边界限制）
- **后处理**：`DefaultRenderingPipeline` 一站式（bloom/DOF/FXAA-MSAA/色差/晕影/颗粒）
- **调试**：`scene.debugLayer.show()` 打开 Inspector；`playground.babylonjs.com` 在线 IDE 是文档/论坛答疑通用载体
- **坐标系**：默认**左手系**，`scene.useRightHandedSystem = true` 整体切换（有连带影响）
- **包**：`@babylonjs/core`（ES6，推荐，tree-shaking，需留意副作用导入）vs `babylonjs`（UMD，仅兼容/学习）
- **选型**：开箱即用全功能引擎选 Babylon.js；精简渲染核心 + 自由拼装选 [Three.js](../three/)

## 一、Engine 与 Scene 速查

```javascript
const engine = new BABYLON.Engine(canvas, true);       // WebGL2 默认后端
// 或异步初始化 WebGPU：
const engine2 = new BABYLON.WebGPUEngine(canvas);
await engine2.initAsync();

const scene = new BABYLON.Scene(engine);
engine.runRenderLoop(() => scene.render());            // 每帧渲染
window.addEventListener("resize", () => engine.resize());
```

## 二、相机速查表

| 相机 | 定位 | 关键参数 |
|---|---|---|
| `ArcRotateCamera` | 轨道相机（环绕目标旋转） | `alpha`/`beta`/`radius`/`target` |
| `UniversalCamera` | FPS 第一人称（推荐替代 `FreeCamera`） | `position` |
| `FreeCamera` | `UniversalCamera` 前身 | `position` |
| `FollowCamera` | 跟随指定 mesh | `target` mesh |
| `DeviceOrientationCamera` | 响应设备陀螺仪 | - |
| `WebXRCamera` | VR/AR 专用 | 由 WebXR 会话管理 |

多相机：`scene.activeCamera = camera2`；多视口：`camera.viewport` + `scene.activeCameras`。

## 三、Mesh 创建与批量渲染速查

```javascript
BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, scene);
BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
```

| 技术 | API | 性能/灵活性 |
|---|---|---|
| Clone | `mesh.clone("name")` | 最贵，最灵活 |
| Instance | `mesh.createInstance("name")` | 共享几何体+材质，仍可独立拾取 |
| Thin Instance | `mesh.thinInstanceAdd(matrix)` | 最轻量，牺牲独立拾取 |
| SPS | `new BABYLON.SolidParticleSystem(...)` | 焊成一个 mesh，极限数量 |

LOD：`mesh.addLODLevel(distance, meshOrNull)`（距离模式）/ `mesh.useLODScreenCoverage = true`（屏幕占比模式，数值方向相反）。

## 四、材质速查表

| 材质 | 关键属性 | 备注 |
|---|---|---|
| `StandardMaterial` | `diffuseColor`/`specularColor`/`emissiveColor`/`alpha`/`wireframe`/`backFaceCulling` | 经验光照模型 |
| `PBRMetallicRoughnessMaterial` | `baseColor`/`metallic`/`roughness`/`environmentTexture` | 推荐 PBR 工作流 |
| `PBRSpecularGlossinessMaterial` | `diffuse`/`specular`/`glossiness` | 另一路 PBR，二选一 |
| `NodeMaterial` | 连接 `NodeMaterialBlock` 节点 | 配 NME 可视化编辑器，支持 WebGL+WebGPU |
| `MultiMaterial` | 按 `subMeshes` 分区 | 一物体多面不同贴图 |

> 点/聚光光源以 candela 为单位、方向光/半球光以 nit 为单位——PBR 与 Standard 材质的本质差异之一。

## 五、光照与阴影速查

```javascript
new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(0, -1, 0), scene);
new BABYLON.PointLight("point", new BABYLON.Vector3(1, 10, 1), scene);
new BABYLON.SpotLight("spot", position, direction, Math.PI / 3, 2, scene);
```

常用属性：`intensity`/`diffuse`/`specular`/`range`/`setEnabled()`/`excludedMeshes`/`includedOnlyMeshes`；材质默认响应上限 **4 盏光**（`maxSimultaneousLights` 可调）。

| 阴影质量选项 | 特点 |
|---|---|
| `usePoissonSampling` | 柔化边缘，性能一般 |
| `useBlurExponentialShadowMap` | 默认 ESM 模糊版，质量最佳最慢 |
| `usePercentageCloserFiltering` | WebGL2 硬件优化过滤 |
| `useContactHardeningShadow` | 基于距离的真实软阴影 |

`ShadowGenerator(size, light)` → `getShadowMap().renderList.push(mesh)` → `receiveMesh.receiveShadows = true`；`bias` 修正 shadow acne；`refreshRate = REFRESHRATE_RENDER_ONCE` 冻结静态阴影。

## 六、纹理速查

| 类 | 用途 |
|---|---|
| `Texture(url, scene)` | 基础图片纹理，`hasAlpha`/`uScale`/`vScale`/`wrapU`/`wrapV` |
| `CubeTexture` | 环境贴图/天空盒，PBR 反射来源；`CreateFromPrefilteredData` 用于 IBL |
| `DynamicTexture` | 2D Canvas API 实时绘制（GUI 底层机制） |
| `ProceduralTexture` | 着色器程序化生成，无需贴图文件 |

## 七、动画速查

```javascript
const anim = new BABYLON.Animation("myAnim", "position.x", 30,
  BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
anim.setKeys([{ frame: 0, value: 0 }, { frame: 30, value: 5 }]);
mesh.animations.push(anim);
scene.beginAnimation(mesh, 0, 30, true); // 返回 Animatable：pause/restart/stop/reset

const group = new BABYLON.AnimationGroup("walk");
group.addTargetedAnimation(anim, mesh);
group.normalize(0, 100);
group.play(true);
```

属性类型：`FLOAT`/`VECTOR3`/`QUATERNION`/`COLOR3`/`MATRIX`；循环模式：`CYCLE`/`CONSTANT`/`RELATIVE`/`YOYO`；缓动：`EasingFunction`（如 `CubicEase`）+ `setEasingFunction()`；骨骼动画 `Skeleton`+`Bone`；表情/口型 `MorphTarget`；精细遮罩 `AnimationGroupMask`。

## 八、物理速查

| | V1（legacy） | V2（推荐） |
|---|---|---|
| 核心概念 | `PhysicsImpostor` | `PhysicsBody` + `PhysicsShape` 分离，可复用 Shape |
| 插件 | CannonJSPlugin/OimoJSPlugin/AmmoJSPlugin | **HavokPlugin**（WASM，MIT） |
| 简化封装 | - | `PhysicsAggregate` |

```javascript
const havokInstance = await HavokPhysics();
const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), havokPlugin);

const aggregate = new BABYLON.PhysicsAggregate(
  mesh, BABYLON.PhysicsShapeType.BOX, { mass: 1, restitution: 0.75 }, scene
);
```

调试：`new BABYLON.PhysicsViewer()` 或 Inspector Debug 面板。碰撞检测轻量替代方案：`mesh.intersectsMesh`/`ActionManager` 的 `OnIntersectionEnterTrigger`（非真实物理）。

## 九、GUI 速查

**2D**（`AdvancedDynamicTexture`）：`CreateFullscreenUI(name)`（限 1 个/场景）/ `CreateForMesh(mesh, w, h)`；控件 `TextBlock`/`Button`/`StackPanel`/`Rectangle`/`Image`；非 Button 控件需手动 `isPointerBlocker = true`。

**3D**（`GUI3DManager` + `Control3D`）：容器 `StackPanel3D`/`SpherePanel`/`CylinderPanel`/`PlanePanel`/`ScatterPanel`；控件 `Button3D`/`HolographicButton`/`TouchHolographicButton`/`HolographicSlate`/`NearMenu`/`HandMenu`；自定义控件实现 `_createNode()`/`_affectMaterial()`。

## 十、资产加载速查

```typescript
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
registerBuiltInLoaders();
import { LoadAssetContainerAsync, AppendSceneAsync, ImportMeshAsync } from "@babylonjs/core";
```

| 格式 | 说明 |
|---|---|
| `.gltf`/`.glb` | 首选，2.0 版本（1.0 已弃用） |
| `.obj`/`.stl` | 通用几何格式 |
| `.ply`/`.splat`/`.spz` | Gaussian Splatting |

压缩扩展：`KHR_draco_mesh_compression`（`DracoDecoder`）/ `EXT_meshopt_compression`（`MeshoptCompression`）/ `KHR_texture_basisu`（`KhronosTextureContainer2`）。`AssetsManager` 7 种 Task：`MeshAssetTask`/`TextFileAssetTask`/`BinaryFileAssetTask`/`ImageAssetTask`/`TextureAssetTask`/`CubeTextureAssetTask`/HDR 变体。

## 十一、粒子与后处理速查

```javascript
const ps = new BABYLON.ParticleSystem("particles", 2000, scene);
ps.emitter = mesh; ps.emitRate = 100; ps.start();

const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
pipeline.bloomEnabled = true;
pipeline.depthOfFieldEnabled = true;
pipeline.fxaaEnabled = true;
```

`GPUParticleSystem`：百万级，不支持 mesh 发射器/子发射器/手动发射数。独立管线：`SSAORenderingPipeline`/`ssrRenderingPipeline`。

## 十二、调试工具速查

| 工具 | 入口 |
|---|---|
| Inspector | `scene.debugLayer.show()` / `Inspector.Show(scene, {})` |
| Playground | `playground.babylonjs.com`，`createScene`/`delayCreateScene`/`createEngine` |
| NME | Node Material Editor（材质节点） |
| NGE | Node Geometry Editor（几何体节点） |
| NPE | Node Particle Editor（粒子节点） |

## 十三、版本现状（2026-07）

| 项 | 现状 |
|---|---|
| 当前版本 | **v9.15.0**（`@babylonjs/core` 与 `babylonjs` 同步发布） |
| 发布节奏 | 高频，近 6 周 6 个 minor 版本 |
| License | Apache-2.0（核心库）；Havok 插件本体 MIT |
| 默认渲染后端 | `Engine`（WebGL2） |
| 新一代后端 | `WebGPUEngine`（需 `await initAsync()`），核心着色器已重写为原生 WGSL |
| 坐标系 | 默认**左手系**（`scene.useRightHandedSystem` 可切换） |
| 物理推荐路径 | V2（`PhysicsBody`/`PhysicsShape` + Havok），官方明确不再推荐 V1 |

## 十四、选型对比：Babylon.js vs Three.js

| 维度 | Babylon.js | Three.js |
|---|---|---|
| 定位 | **全功能引擎**：物理、GUI、粒子、资产管线、调试器/编辑器官方一体化提供 | **轻量渲染库**：核心只管渲染，其余靠第三方拼装 |
| 坐标系 | 默认**左手系** | 默认**右手系**（与 glTF 一致，导入摩擦更小） |
| 语言与类型 | TypeScript 编写、TypeScript 优先 | 核心 JS + 官方 `@types/three` |
| 物理引擎 | 内置官方集成（Havok 一等公民） | 不内置，需自行接入 Cannon-es/Rapier/Ammo |
| GUI | 内置 2D + 3D 两套完整体系 | 无内置，DOM 覆盖层或三方方案 |
| 调试工具 | 官方 Inspector + Playground，开箱即用 | 依赖社区方案 |
| 材质体系 | Standard + 两种 PBR 工作流 + NodeMaterial 可视化节点编辑器 | Standard/Physical（PBR）+ 需自写 `ShaderMaterial`，无官方可视化节点编辑器 |
| 生态定位 | 微软支持，"游戏引擎"心智，教育/展示/工业数字孪生友好 | 社区驱动，"渲染库拼积木"心智，配合 React Three Fiber 生态更丰富 |
| 学习曲线 | 概念面更广，但子系统内聚、文档统一 | 核心渲染概念更精简，选型/集成第三方的决策成本转嫁给开发者 |
| 包体积/tree-shaking | `@babylonjs/core` 按需引入+副作用导入机制；`babylonjs` UMD 更大 | 核心库较小，按需 `import` 摩擦更低 |

**怎么选**：需要开箱即用的物理交互、复杂 3D/2D 混合 UI、正式的可视化调试/编辑器工具链，选 **Babylon.js**；追求最小依赖的渲染核心、与 React 生态（R3F）深度集成、社区素材海量，选 **Three.js**。两者渲染性能量级相近，矛盾核心是"引擎全家桶的便利与体积/心智开销" vs "库的精简与自由拼装的灵活性"。反向视角见 [Three.js 专家篇](../three/guide-line/expert)的"与 Babylon.js 对比"一节。

## 十五、易错点速查

- 坐标系混用：Babylon 左手系 vs Three.js/glTF/DCC 工具右手系，旋转/法线方向最容易踩坑
- ES6 按需引入漏副作用导入：只 `import { MeshBuilder }` 有时不够，需额外 `import "@babylonjs/core/Meshes/Builders/boxBuilder.js"` 之类
- `WebGPUEngine` 忘记 `await engine.initAsync()`
- 物理 V1（`PhysicsImpostor`）与 V2（`PhysicsBody`/`Shape`/`PhysicsAggregate`）API 不通用，混抄踩坑
- `AdvancedDynamicTexture.CreateFullscreenUI` 每场景限 1 个，重复创建会互相覆盖
- GUI 非 Button 控件默认不拦截指针事件，需手动 `isPointerBlocker = true`
- 材质默认最多响应 4 盏光，超出被忽略（`maxSimultaneousLights` 未调）
- `GPUParticleSystem` 能力缺口（不支持 mesh 发射器/子发射器/手动发射数）是设计限制非 bug
- Thin instances 默认不支持像普通 mesh 那样的独立拾取
- `ParticleSystem.stop()` 不清空已存在粒子，立即清空需 `reset()`
- Draco/KTX2 解码器是额外依赖，未配置会导致加载失败误判为"文件损坏"
- UMD 包 `babylonjs` 生产慎用，新项目应选 `@babylonjs/core` 走 ES6 tree-shaking

## 十六、权威链接

- [Babylon.js 官方文档](https://doc.babylonjs.com/) ｜ [Features 总览](https://doc.babylonjs.com/features)
- [第一个场景](https://doc.babylonjs.com/features/introductionToFeatures/chap1/first_scene/) ｜ [相机介绍](https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction)
- [材质介绍](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction) ｜ [PBR 介绍](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/introToPBR) ｜ [NodeMaterial](https://doc.babylonjs.com/features/featuresDeepDive/materials/node_material/nodeMaterial)
- [Physics 总览](https://doc.babylonjs.com/features/featuresDeepDive/physics) ｜ [Havok 用法](https://doc.babylonjs.com/features/featuresDeepDive/physics/v2/usingHavok)
- [2D GUI](https://doc.babylonjs.com/features/featuresDeepDive/gui/gui) ｜ [3D GUI](https://doc.babylonjs.com/features/featuresDeepDive/gui/gui3D)
- [glTF 加载](https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF) ｜ [粒子系统入门](https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro)
- [默认渲染管线](https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/defaultRenderingPipeline) ｜ [Inspector](https://doc.babylonjs.com/toolsAndResources/inspector) ｜ [Playground](https://doc.babylonjs.com/toolsAndResources/thePlayground/)
- [WebGPU 支持](https://doc.babylonjs.com/setup/support/webGPU)
- [GitHub · BabylonJS/Babylon.js](https://github.com/BabylonJS/Babylon.js)
