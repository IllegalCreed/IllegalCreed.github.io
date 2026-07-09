---
layout: doc
---

# Babylon.js

微软支持的开箱即用**全功能 Web 3D/游戏引擎**——内置物理、GUI、粒子、资产管线、可视化调试器（Inspector）、在线 IDE（Playground）、节点式可视化编辑器（材质/几何体/粒子）等一整套"游戏引擎级"配套。核心用 TypeScript 编写、TypeScript 优先，类型定义完善且与实现同步演进，设计目标是让开发者"少拼装、多创作"：`Engine` 对接底层图形 API（WebGL/WebGPU）与音频，`Scene` 是承载网格、相机、灯光的"舞台"，相机、光照、材质、动画、物理、GUI、粒子、后处理等子系统由官方统一提供、体系高度内聚。**2026 年现状**：`@babylonjs/core`（ES6，推荐）与 `babylonjs`（UMD，兼容包）双包同步发布，当前版本 **v9.15.0**，近几周几乎每周一个 minor 版本，是 Babylon.js 一贯的高频迭代节奏；核心着色器已重写为原生 WGSL，`WebGPUEngine` 与默认 `Engine`（WebGL2）业务层 API 基本一致；物理侧强烈推荐 V2（`PhysicsBody`/`PhysicsShape` + Havok 插件）取代 legacy V1（`PhysicsImpostor`）。**默认左手坐标系**，与 Three.js、glTF、多数 DCC 工具默认的右手系相反，是最容易踩的入门坑。

## 评价

**优点**

- **全功能"游戏引擎"心智**：物理（Havok）、2D/3D GUI、粒子、资产管线、Inspector、Playground、节点编辑器（材质/几何体/粒子）官方一体化提供，业务开发少拼第三方
- **TypeScript 优先**：核心库本身用 TypeScript 编写，类型定义随实现同步演进，覆盖完整
- **调试与开发工具重量级**：Inspector 场景可视化调试器 + Playground 浏览器在线 IDE，官方维护、开箱即用，也是文档/论坛答疑的通用载体
- **物理引擎一等公民**：`scene.enablePhysics()` 一行接入 Havok（WASM，MIT 免费），V2 的 Body/Shape 分离架构比 V1 Impostor 更利于复用与精细控制
- **NodeMaterial 可视化节点编辑器**：免写 GLSL/WGSL 即可搭建自定义 shader，同时支持 WebGL/WebGPU 双后端，能完整复刻 Standard/PBR 材质的光照分量
- **发布节奏快**：6 周内 6 个 minor 版本，功能与修复迭代活跃

**缺点**

- **概念面更广、包体积天然更大**：要理解引擎提供的一整套子系统，学习曲线覆盖范围比"精简渲染库"更宽
- **左手坐标系是入门反直觉点**：与 glTF/Three.js/多数 DCC 工具的右手系相反，混用导入导出时旋转方向、法线方向容易踩坑
- **ES6 按需引入有额外心智负担**：不少静态工厂方法（如 `MeshBuilder.CreateBox`）依赖"副作用导入"才会挂载到类上，漏引入会直接报错
- **生态规模不及 Three.js**：社区扩展、教程资源、与 React 生态的深度集成不如 Three.js（对比 react-three-fiber）丰富
- **物理 V1→V2 API 断层**：老教程/老代码大量停留在 V1（Cannon/Oimo/Ammo 插件），混着抄容易踩版本不对口的坑

与 [Three.js](../three/) 的关系是前端可视化选型的必考对比项：Three.js 是「精简渲染库，自由拼生态」，Babylon.js 是「全功能引擎，开箱即用」——需要开箱即用的物理交互、复杂 3D/2D 混合 UI、正式的可视化调试工具链，选 Babylon.js；追求最小依赖的渲染核心、与 React 生态深度集成，选 Three.js。

## 文档地址

[Babylon.js 官方文档](https://doc.babylonjs.com/) ｜ [Playground 在线 IDE](https://playground.babylonjs.com/)

## GitHub 地址

[BabylonJS/Babylon.js](https://github.com/BabylonJS/Babylon.js)

## 幻灯片地址

<a href="/SlideStack/babylon-slide/" target="_blank">Babylon.js</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=babylon-js" target="_blank" rel="noopener noreferrer">Babylon.js 测试题</a>
