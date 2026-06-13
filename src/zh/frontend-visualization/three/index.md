---
layout: doc
---

# Three.js

跨浏览器的通用 3D 库（官方定位为「a cross-browser JavaScript library and API used to create and display animated 3D computer graphics in a web browser」）。它把底层的 **WebGL**（及 r184 起逐步成熟的 **WebGPU**）封装成一套以「场景图 + 网格 + 材质 + 光照 + 相机」为核心的高层 API，让你不必直接写 GLSL/WGSL 就能搭出可交互的三维世界。核心心智模型是「三大件」：**Scene（装内容）→ Camera（定视角）→ Renderer（出画面）**，每帧 `renderer.render(scene, camera)` 把相机视锥内的内容光栅化到 `<canvas>`。**2026 年的现状**：版本号用 `r<revision>` 滚动迭代（当前 **r184**，2026-04 发布），包已全面 **ESM 化**（附加组件在 `three/addons` ≡ `three/examples/jsm`），默认开启**色彩管理**（r152 起，内部线性、输出 sRGB），并以 `WebGLRenderer` 为默认主流、`WebGPURenderer` + **TSL（Three.js Shading Language）** 为新一代渲染/着色路径。生态极其庞大——`react-three-fiber`、`@react-three/drei`、各类加载器与后处理让它成为 Web 3D 事实标准。

## 评价

**优点**

- **轻量灵活的通用库**：API 像积木，渲染循环、控制器、加载、后处理自由组合，不绑定某种引擎范式
- **生态最大**：海量 addons（OrbitControls、GLTFLoader、EffectComposer…）+ 声明式封装（react-three-fiber）+ 教程资源
- **glTF 一等公民**：`GLTFLoader` 直读为实时优化的「3D 界 JPEG」，自带 PBR 材质/层级/动画
- **PBR 材质开箱即用**：`MeshStandardMaterial`/`MeshPhysicalMaterial` 配环境贴图即得物理级真实感
- **跨端**：同一套代码在桌面/移动浏览器运行，`WebGPURenderer` 不支持时可回退 WebGL
- **持续演进**：TSL 让自定义着色既可组合又能同时编译到 WebGL/WebGPU 两种后端

**缺点**

- **底层、要自己搭脚手架**：物理、碰撞、检视器、关卡等需自行集成或引第三方（对比 Babylon.js 的「全家桶」）
- **资源需手动释放**：WebGL 无自动 GC，几何/材质/纹理要显式 `dispose()`，否则显存泄漏
- **性能坑要懂原理**：draw call、合批、`InstancedMesh`、纹理显存、视锥剔除等需要主动优化
- **版本滚动快**：`r<revision>` 频繁迭代，偶有破坏性变更，升级需查 Migration Guide
- **WebGPU/TSL 仍在成熟**：新路径资料较少、API 仍在动，生产主力仍是 WebGL 路径

## 文档地址

[Three.js](https://threejs.org/) ｜ [Manual](https://threejs.org/manual/) ｜ [Docs](https://threejs.org/docs/)

## GitHub 地址

[mrdoob/three.js](https://github.com/mrdoob/three.js)

## 幻灯片地址

<a href="/SlideStack/threejs-slide/" target="_blank">Three.js</a>
