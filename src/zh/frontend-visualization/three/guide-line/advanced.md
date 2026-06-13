---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **three r184**。加载器与压缩、动画系统、Raycaster 交互、响应式与按需渲染、自定义 BufferGeometry、环境贴图与后处理——把 Three.js 用进真实项目。

## 一、加载 glTF 与压缩资源

官方推荐 **glTF（.glb/.gltf）+ `GLTFLoader`**：为实时渲染优化的二进制顶点数据可直接上 GPU，自带 PBR 材质、场景层级与动画。

```js
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
loader.load("/scene.glb", (gltf) => {
  scene.add(gltf.scene); // 模型根 Object3D
  gltf.scene.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
});
```

`gltf` 对象常用字段：`scene`（根）、`scenes`、`animations`（动画剪辑）、`cameras`、`asset`（元信息）。

### 压缩资源需挂解码器

```js
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const draco = new DRACOLoader();
draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
loader.setDRACOLoader(draco); // DRACO 压缩的几何体才能解
```

> KTX2/Basis 压缩纹理同理用 `KTX2Loader` + `loader.setKTX2Loader(ktx2.detectSupport(renderer))`。压缩能大幅减小下载体积与显存。

## 二、动画系统

骨骼/关键帧动画由三件套驱动：`AnimationMixer`（混合器）、`AnimationClip`（剪辑）、`AnimationAction`（动作）。

```js
const mixer = new THREE.AnimationMixer(gltf.scene);
const action = mixer.clipAction(gltf.animations[0]);
action.play();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  mixer.update(clock.getDelta()); // 关键：每帧用真实 delta 推进
  renderer.render(scene, camera);
});
```

- **必须每帧 `mixer.update(delta)`**，`delta` 来自 `clock.getDelta()`，保证动画帧率无关、按真实时间推进。
- `action` 可设 `loop`（`LoopOnce`/`LoopRepeat`/`LoopPingPong`）、`clampWhenFinished`、`timeScale`，多动作间可 `crossFadeTo` 做混合过渡。

## 三、Raycaster 交互拾取

鼠标点击拾取依赖射线投射：把鼠标像素坐标换算成**归一化设备坐标（NDC，-1~+1）**，再投射射线。

```js
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

canvas.addEventListener("pointerdown", (e) => {
  const r = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1; // 注意 y 翻转

  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  if (hits.length) {
    // hits 按距离从近到远排序，hits[0] 最靠前
    const { object, point, distance, face, uv } = hits[0];
    object.material.color.set(0xff0000);
  }
});
```

> 局限：CPU 逐三角检测，高面数对象较慢；不考虑着色器形变与贴图透明孔。海量/透明拾取可改用 GPU 拾取（离屏唯一色渲染读像素）。

## 四、响应式与按需渲染

官方推荐的按需 resize 模式——仅在尺寸真变时更新，避免每帧重置：

```js
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const need = canvas.width !== w || canvas.height !== h;
  if (need) renderer.setSize(w, h, false); // false = 只改绘制缓冲
  return need;
}
```

静态场景（如产品查看器）不必每帧渲染，改用**按需渲染**省电：

```js
let requested = false;
function render() {
  requested = false;
  if (resizeRendererToDisplaySize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  controls.update();
  renderer.render(scene, camera);
}
function requestRender() {
  if (!requested) {
    requested = true;
    requestAnimationFrame(render);
  }
}
controls.addEventListener("change", requestRender); // 拖动相机才渲染
window.addEventListener("resize", requestRender);
render(); // 首帧
```

> `requestRender` 用标志合并同帧多次请求，避免 OrbitControls 阻尼造成的重复循环。

## 五、自定义 BufferGeometry

内置几何体不够用时，手写顶点数据：

```js
const geometry = new THREE.BufferGeometry();

// 一个三角形：3 个顶点 × xyz
const positions = new Float32Array([
  0, 1, 0,
  -1, -1, 0,
  1, -1, 0,
]);
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
// 索引几何体：复用顶点（前提是该顶点各属性一致）
geometry.setIndex([0, 1, 2]);
geometry.computeVertexNormals(); // 自动算法线（光照需要）
```

- 属性名须用约定名：`position`（itemSize 3）、`normal`（3）、`uv`（2）、`color`（3）。
- 频繁改顶点时给属性设 `setUsage(THREE.DynamicDrawUsage)`，改完置 `attribute.needsUpdate = true`。

## 六、环境贴图与后处理

让 PBR 材质反射环境、做基于图像的照明（IBL）：

```js
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

new RGBELoader().load("/venice.hdr", (hdr) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(hdr).texture;
  scene.environment = env; // PBR 材质反射 + 环境光
  scene.background = env;  // 当天空盒
});
```

屏幕空间后处理（辉光等）用 `EffectComposer` 串联多个 Pass：

```js
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85));
composer.addPass(new OutputPass());

// 循环里用 composer.render() 取代 renderer.render()；resize 时 composer.setSize(w, h)
```

---

进入 [指南 · 专家](./guide-line/expert)：性能优化（draw call/InstancedMesh）、内存释放、z-fighting/视锥剔除、WebGPURenderer 与 TSL、与 Babylon.js 对比。
