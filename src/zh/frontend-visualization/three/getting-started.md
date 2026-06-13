---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **three r184**（2026-04）。包已 ESM 化，附加组件在 `three/addons`（≡ `three/examples/jsm`）；默认开启色彩管理。涉及 WebGPU/TSL 等新路径处会显式标注，详见[专家篇](./guide-line/expert)。

## 速查

- 安装：`npm i three`（核心）；类型 `three` 已自带 `.d.ts`
- 三大件：**Scene（装内容）→ Camera（定视角）→ Renderer（出画面）**，每帧 `renderer.render(scene, camera)`
- 可见物体：`new THREE.Mesh(geometry, material)`——几何体定形状、材质定外观
- 渲染循环：`renderer.setAnimationLoop(fn)` 或 `requestAnimationFrame`（与刷新同步、后台暂停）
- ⚠️ 改了 `camera.aspect`/`fov` 等 → 必须 `camera.updateProjectionMatrix()`
- ⚠️ 颜色贴图要 `texture.colorSpace = THREE.SRGBColorSpace`；法线/粗糙度等数据贴图保持默认
- ⚠️ 不用的 Mesh：`remove` 之外还要 `geometry.dispose()`/`material.dispose()`/`texture.dispose()`

## 一、Three.js 是什么

官方一句话：「**a cross-browser JavaScript library and API used to create and display animated 3D computer graphics in a web browser**」。它是对 WebGL（及新一代 WebGPU）的高层封装，用「场景图」组织三维世界：

1. **Scene（场景）**：所有要渲染的对象的根容器（网格、光源、相机、组）。
2. **Camera（相机）**：定义「从哪看、看多大范围」（视锥）。
3. **Renderer（渲染器）**：把相机视锥内的场景内容光栅化到 `<canvas>`。

> 核心边界：Three.js 只负责**渲染与场景组织**，不内建物理引擎、碰撞、关卡编辑器（那是 Babylon.js 这类「全功能引擎」的领域）。需要这些能力时自行集成。

## 二、第一个场景：旋转的立方体

```js
import * as THREE from "three";

// 1. 渲染器：绑定 canvas，开抗锯齿
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // 高分屏清晰
document.body.appendChild(renderer.domElement);

// 2. 场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202124);

// 3. 透视相机：fov, aspect, near, far
const camera = new THREE.PerspectiveCamera(
  75, // 垂直视野角度（度）
  window.innerWidth / window.innerHeight, // 宽高比
  0.1, // 近裁剪面
  100, // 远裁剪面
);
camera.position.set(0, 0, 4);

// 4. 网格 = 几何体 + 材质
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 5. 光照（Standard 是 PBR 材质，必须有光）
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(2, 3, 4);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.4)); // 补暗部

// 6. 渲染循环（与刷新同步、帧率无关）
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  cube.rotation.x += dt;
  cube.rotation.y += dt;
  renderer.render(scene, camera);
});
```

> 把材质换成 `MeshBasicMaterial` 则**不受光照**——无光也显色，但没有立体明暗。

## 三、响应式：窗口尺寸变化

Canvas 有「CSS 显示尺寸」与「内部绘制缓冲尺寸」两套尺寸，resize 时都要更新，否则画面拉伸或发虚：

```js
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix(); // 改了相机参数必须重算投影矩阵
  renderer.setSize(w, h);
});
```

::: tip 官方推荐的按需 resize 模式
在循环里比较 `canvas.clientWidth/Height` 与 `canvas.width/height`，仅在不一致时 `renderer.setSize(w, h, false)`（第三参 `false` = 只改绘制缓冲、不动 CSS 尺寸），避免每帧无谓重置。详见[基础篇](./guide-line/base)。
:::

## 四、加进交互：OrbitControls

控制器属于**附加组件（addons）**，从 `three/addons` 引入，不在主包：

```js
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 惯性阻尼

// 开了 damping 后，循环里需要 controls.update()
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
```

## 五、加载一个 glTF 模型

官方推荐 **glTF（.glb/.gltf）+ `GLTFLoader`**——为实时渲染优化、自带 PBR 材质/层级/动画：

```js
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
loader.load(
  "/models/robot.glb",
  (gltf) => {
    scene.add(gltf.scene); // gltf.scene 是模型根 Object3D
    // 若带动画：
    if (gltf.animations.length) {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      mixer.clipAction(gltf.animations[0]).play();
      // 别忘了在循环里 mixer.update(clock.getDelta())
    }
  },
  (e) => console.log((e.loaded / e.total) * 100 + "%"), // onProgress
  (err) => console.error(err), // onError
);
```

> 体积压缩过的模型（DRACO/KTX2）需额外挂 `DRACOLoader`/`KTX2Loader`，见[进阶篇](./guide-line/advanced)。

## 六、释放资源（重要）

WebGL **不会自动回收**显存。移除对象时除了 `scene.remove(mesh)`，还要释放 GPU 资源：

```js
scene.remove(cube);
cube.geometry.dispose();
cube.material.dispose();
// 材质上的贴图也要 texture.dispose()
```

> 用 `renderer.info` 可监控 `memory.geometries`/`memory.textures` 与每帧 `render.calls`，排查泄漏与性能。

---

掌握第一个场景后，进入 [指南 · 基础](./guide-line/base)：场景图与变换、相机两种投影、几何体与材质体系、纹理与色彩管理。
