---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **three r184**。核心类、常用 API、材质/光照/加载器与版本现状速查。

## 三大件速查

```js
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(w, h);            // 设绘制缓冲尺寸（第三参 false = 不改 CSS）
renderer.setPixelRatio(dpr);       // 高分屏清晰度
renderer.setAnimationLoop(fn);     // 渲染循环（WebGPU 必用；WebGL 也推荐）
renderer.render(scene, camera);    // 渲染一帧

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // 颜色 / 纹理 / 立方体贴图
scene.environment = envTexture;    // 基于图像的环境照明（IBL）

const cam = new THREE.PerspectiveCamera(fov, aspect, near, far);
cam.updateProjectionMatrix();      // 改了 fov/aspect/near/far 后必调
```

## 核心类速查

| 类 | 职责 |
|---|---|
| `Object3D` | 所有场景对象基类：`position`/`rotation`/`scale`/`add`/`traverse`/`matrixWorld` |
| `Scene` | 场景图根（继承 Object3D）；`background`/`environment`/`fog` |
| `Group` | 不可见容器，整体变换其子节点 |
| `Mesh` | 几何体 + 材质的可渲染对象 |
| `Points` / `Line` | 点精灵（粒子/点云）/ 线段渲染 |
| `InstancedMesh` | 一次 draw call 渲染海量实例（`setMatrixAt`/`setColorAt`） |
| `BufferGeometry` | 几何体基类：`setAttribute`/`setIndex`/`computeVertexNormals` |
| `Raycaster` | 射线拾取：`setFromCamera(ndc, cam)` → `intersectObjects()` |
| `Clock` | 计时：`getDelta()`/`getElapsedTime()` 驱动帧率无关动画 |
| `Vector3`/`Quaternion`/`Euler`/`Matrix4` | 向量/四元数/欧拉角/矩阵 |

## 相机

| 相机 | 构造 | 用途 |
|---|---|---|
| `PerspectiveCamera` | `(fov, aspect, near, far)` | 透视、近大远小（3D 主用） |
| `OrthographicCamera` | `(left, right, top, bottom, near, far)` | 正交、无透视（2D/等距/CAD） |

> `near` 尽量大、`far` 尽量小（够用即可），范围过宽 + `near` 极小会导致 **z-fighting**（深度闪烁）。

## 材质体系（按性能/真实感）

| 材质 | 受光 | 关键属性 | 备注 |
|---|---|---|---|
| `MeshBasicMaterial` | ✗ | `color`/`map` | 无光也显色，UI/线框/调试 |
| `MeshLambertMaterial` | ✓ | `color`/`emissive` | 逐顶点光照，廉价 |
| `MeshPhongMaterial` | ✓ | `shininess`/`specular` | 逐像素 + 高光（经验模型） |
| `MeshToonMaterial` | ✓ | `gradientMap` | 卡通分层着色 |
| `MeshStandardMaterial` | ✓ | `roughness`/`metalness`/`envMap` | **PBR 主力** |
| `MeshPhysicalMaterial` | ✓ | + `clearcoat`/`transmission`/`ior` | PBR 扩展，最真实最慢 |
| `MeshNormalMaterial` | ✗ | — | 法线可视化，调试用 |
| `MeshDepthMaterial` | ✗ | — | 深度可视化 |

通用属性：`side`（`FrontSide`/`BackSide`/`DoubleSide`）、`transparent` + `opacity`、`wireframe`、`flatShading`、`map`/`normalMap`/`roughnessMap`/`aoMap`/`emissiveMap`。

## 纹理速查

```js
const tex = new THREE.TextureLoader().load("/wall.jpg", (t) => {
  t.colorSpace = THREE.SRGBColorSpace;      // 颜色贴图必设（数据贴图保持默认）
});
tex.wrapS = tex.wrapT = THREE.RepeatWrapping; // 允许平铺
tex.repeat.set(4, 2);                          // 平铺次数
tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); // 掠射角清晰
tex.minFilter = THREE.LinearMipmapLinearFilter; // 缩小用三线性 + mipmap
```

> 显存 ≈ `宽×高×4×1.33`，由**像素尺寸**决定，与压缩文件大小无关——控制纹理尺寸。

## 光照

| 光源 | 构造 | 特点 |
|---|---|---|
| `AmbientLight` | `(color, intensity)` | 均匀补光，无方向无阴影 |
| `HemisphereLight` | `(sky, ground, intensity)` | 天空/地面双色，按法线朝向 |
| `DirectionalLight` | `(color, intensity)` | 平行光（太阳），方向性阴影 |
| `PointLight` | `(color, intensity, distance, decay)` | 点光源，向四周衰减 |
| `SpotLight` | `(color, intensity, …, angle, penumbra, decay)` | 聚光锥，`penumbra` 控边缘柔化 |
| `RectAreaLight` | `(color, intensity, width, height)` | 矩形面光（仅 Standard/Physical，无阴影） |

> 阴影四步：`renderer.shadowMap.enabled = true` + `light.castShadow` + `mesh.castShadow` + `mesh.receiveShadow`。

## 加载器（addons）

| 加载器 | 路径 | 用途 |
|---|---|---|
| `GLTFLoader` | `three/addons/loaders/GLTFLoader.js` | glTF/glb（首选） |
| `DRACOLoader` | …/DRACOLoader.js | DRACO 压缩几何（`setDRACOLoader`） |
| `KTX2Loader` | …/KTX2Loader.js | KTX2/Basis 压缩纹理 |
| `TextureLoader` | 核心包 | 普通图片纹理 |
| `RGBELoader` | …/loaders/RGBELoader.js | HDR 环境贴图（配 `PMREMGenerator`） |

## 版本现状（2026-06）

| 项 | 现状 |
|---|---|
| 当前版本 | **r184**（2026-04 发布），版本号用 `r<revision>` 滚动 |
| 模块 | 全面 **ESM**；addons 在 `three/addons` ≡ `three/examples/jsm` |
| 默认渲染器 | `WebGLRenderer`（主流、最成熟） |
| 新一代 | `WebGPURenderer`（`three/webgpu`，需 `await renderer.init()`）+ **TSL**（`three/tsl`） |
| 色彩管理 | r152 起默认开启：内部 Linear-sRGB，输出 sRGB |

> WebGPU/TSL 详见[专家篇](./guide-line/expert)。
