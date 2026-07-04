---
layout: doc
outline: [2, 3]
---

# 指南 · 材质、光照与纹理

> 基于 Babylon.js v9.15。材质是必考重点：StandardMaterial 四通道、PBR 两种工作流、NodeMaterial 可视化节点编辑器；四种光源与阴影质量选项；纹理与环境贴图。

## 速查

**StandardMaterial**

- 四通道：`diffuseColor`（基础色）/`specularColor`（高光）/`emissiveColor`（自发光，不受光照影响）/`diffuseTexture`（贴图）
- `alpha`（0 全透明~1 不透明）、`wireframe`（线框模式）、`backFaceCulling`（背面剔除，透明物体常需关闭）

**PBRMaterial**

- 推荐工作流：`PBRMetallicRoughnessMaterial`——`baseColor`/`metallic`（越大越像金属）/`roughness`（越大越粗糙）/`environmentTexture`（环境反射）
- 另一路 `PBRSpecularGlossinessMaterial`（diffuse+specular+glossiness），**二选一，不混用**
- 本质差异：点/聚光光源以**坎德拉（candela）**为单位、方向光/半球光以 **nit** 为单位——真实物理光强单位，是 PBR 与 Standard 材质的核心区别之一

**NodeMaterial（必考特色）**

- 通过连接 `NodeMaterialBlock` 节点搭 shader，免写 GLSL/WGSL；配套图形化编辑器 **NME**（Node Material Editor）
- 三种使用路径：代码手连节点 / NME 可视化编辑 / 从已保存文件加载；同时支持 WebGL 与 WebGPU 后端
- 官方示例用约 12 个节点块完整复刻 StandardMaterial 的全部光照分量（ambient/diffuse/specular/reflection/emissive 等）

**MultiMaterial**：一个 mesh 按子网格（`subMeshes`）分区使用不同材质，常用于"一物体多面不同贴图"

**光照 Light**

- 四种基础光源，构造函数签名统一 `(name, 方向/位置, scene)`：`HemisphericLight`/`DirectionalLight`/`PointLight`/`SpotLight`（多两个参数 `angle` 锥角、`exponent` 衰减指数）
- 常用属性：`intensity`（默认 1）、`diffuse`/`specular`（Color3）、`range`（point/spot 有效距离）、`light.setEnabled()`、`excludedMeshes`/`includedOnlyMeshes`
- ⚠️ **材质默认最多同时响应 4 盏光**（`maxSimultaneousLights` 可调），超出的光源会被忽略

**阴影 ShadowGenerator**

- 只有 point/directional/spot 光支持投影，point 光用 cubemap 渲染代价最高
- 流程：`renderList.push(castingMesh)` + `ground.receiveShadows = true` **缺一不可**
- 质量选项（互斥、逐档更贵）：`usePoissonSampling`（柔化边缘）/`useBlurExponentialShadowMap`（默认 ESM 模糊版，质量最佳最慢）/`usePercentageCloserFiltering`（WebGL2 硬件优化）/`useContactHardeningShadow`（基于距离的真实软阴影）
- `bias` 修正阴影失真（shadow acne）；`refreshRate = REFRESHRATE_RENDER_ONCE` 冻结静态阴影省性能

**纹理 Texture**

- `Texture(url, scene)`：基础图片纹理，`hasAlpha`/`uScale`/`vScale`/`wrapU`/`wrapV`
- `CubeTexture`：环境贴图/天空盒，PBR 反射主要来源；`CreateFromPrefilteredData` 用于预过滤 IBL 环境贴图
- `DynamicTexture`：可用 2D Canvas API 实时绘制的纹理（GUI 底层机制之一）
- `ProceduralTexture`：着色器程序化生成纹理，无需美术贴图文件

## 一、StandardMaterial：四种光照反应通道

```javascript
const mat = new BABYLON.StandardMaterial("mat", scene);
mat.diffuseColor = new BABYLON.Color3(1, 0, 1);          // 基础色（受光后的表现色）
mat.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);  // 高光
mat.emissiveColor = new BABYLON.Color3(1, 1, 1);         // 自发光（不受光照影响）
mat.diffuseTexture = new BABYLON.Texture("path/to.png", scene);
mat.alpha = 0.5;             // 0 全透明 ~ 1 不透明
mat.wireframe = true;        // 线框模式
mat.backFaceCulling = false; // 背面剔除开关（透明物体常需关闭）
mesh.material = mat;
```

## 二、PBRMaterial：基于物理的渲染

PBR 不追求单一"正确"算法，而是尽量模拟真实光照：

```javascript
// 推荐：Metallic-Roughness 工作流
const pbr = new BABYLON.PBRMetallicRoughnessMaterial("pbr", scene);
pbr.baseColor = new BABYLON.Color3(1, 1, 1);
pbr.metallic = 0.8;   // 0~1：越大越像金属
pbr.roughness = 0.3;  // 0~1：越大越粗糙（漫反射越强）
pbr.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("env.env", scene); // 环境反射
// 另一路：PBRSpecularGlossinessMaterial（diffuse + specular + glossiness），二选一，不混用
```

::: tip candela 与 nit：PBR 与 Standard 的本质差异之一
点光源/聚光灯以**坎德拉（candela）**为单位、方向光/半球光以 **nit** 为单位——这是真实物理光强单位，与 Standard 材质里"拍脑袋调整"的 `intensity` 数值不是一回事。调 PBR 场景亮度时，理解这套物理单位比死调数字更有效。
:::

## 三、NodeMaterial：节点式 shader（必考特色）

通过连接 `NodeMaterialBlock` 节点搭建 shader，免写 GLSL/WGSL；配套图形化编辑器 **NME**（Node Material Editor）。三种使用路径：

1. **代码手连节点**——精细控制，适合工程化集成
2. **NME 可视化编辑**——拖拽节点即时预览，适合美术/设计师
3. **从已保存文件加载**——团队协作、版本管理已搭好的节点图

NodeMaterial 同时支持 WebGL 与 WebGPU 后端；官方示例用约 12 个节点块完整复刻了 StandardMaterial 的全部光照分量（ambient/diffuse/specular/reflection/emissive 等），并支持着色器自动提升优化（片段→顶点）与循环，是 NodeMaterial 相比手写 shader 的额外优势。

## 四、MultiMaterial：一物体多材质

`MultiMaterial` 让一个 mesh 按子网格（`subMeshes`）分区使用不同材质，常用于"一个物体不同面不同贴图"场景（如一个盒子六个面贴不同图案）。

## 五、光照 Light 与四种基础光源

四种基础光源，构造函数签名统一为 `(name, 方向/位置, scene)`：

```javascript
new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene); // 模拟环境光：direction 方向为主色，反方向为 groundColor
new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(0, -1, 0), scene); // 平行光，模拟太阳，无限范围
new BABYLON.PointLight("point", new BABYLON.Vector3(1, 10, 1), scene);     // 点光源，向四周发射，类比灯泡
new BABYLON.SpotLight("spot", position, direction, Math.PI / 3, 2, scene); // 聚光灯：多两个参数 angle 锥角、exponent 衰减指数
```

常用属性：`intensity`（默认 1）、`diffuse`/`specular`（Color3）、`range`（point/spot 光有效距离）、`light.setEnabled()`、`excludedMeshes`/`includedOnlyMeshes` 控制受光网格白/黑名单。

::: warning 材质默认光源数量上限
StandardMaterial/PBRMaterial **默认最多同时响应 4 盏光**（`maxSimultaneousLights` 可调）。场景光源多于 4 盏时如果没调这个参数，多余光源会被材质忽略，表现为"加了灯但没变亮"——排查"灯不亮"问题时先看这里。
:::

## 六、阴影 ShadowGenerator

只有 point/directional/spot 光支持投影，point 光用 cubemap 渲染代价最高：

```javascript
const shadowGenerator = new BABYLON.ShadowGenerator(1024, light); // 1024 = shadow map 尺寸
shadowGenerator.getShadowMap().renderList.push(castingMesh);
ground.receiveShadows = true;

// 质量/性能选项（互斥、逐档更贵）
shadowGenerator.usePoissonSampling = true;           // 柔化边缘，性能一般
shadowGenerator.useBlurExponentialShadowMap = true;  // 默认 ESM 的模糊版，质量最佳但最慢
shadowGenerator.blurScale = 2;
shadowGenerator.usePercentageCloserFiltering = true; // WebGL2 硬件优化过滤
shadowGenerator.useContactHardeningShadow = true;    // 基于距离的真实软阴影
shadowGenerator.bias = 0.01; // 修正阴影失真（shadow acne）
shadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE; // 静态阴影冻结，省性能
```

::: warning renderList.push 与 receiveShadows 缺一不可
新建 `ShadowGenerator` 后，忘记把投影网格 `push` 进 `renderList`，或忘记给接收面设 `receiveShadows = true`，都会导致"阴影生成器建好了但看不到阴影"。这两步是最容易漏的配置项。
:::

## 七、纹理 Texture

- **`Texture(url, scene)`**：基础图片纹理，`hasAlpha`、`uScale`/`vScale`、`wrapU`/`wrapV` 等。
- **`CubeTexture`**：环境贴图/天空盒，PBR 反射主要来源；`CreateFromPrefilteredData` 用于预过滤的 IBL 环境贴图。
- **`DynamicTexture`**：可用 2D Canvas API 实时绘制的纹理（GUI 底层机制之一，见 [GUI 篇](./gui-assets-postfx)）。
- **`ProceduralTexture`**：着色器程序化生成纹理，无需美术贴图文件。

---

材质、光照与纹理搭好后，进入[指南 · 动画与物理](./animation-physics)：Animation/AnimationGroup、骨骼动画，以及 Physics V2 + Havok 的现代物理接入方式。
