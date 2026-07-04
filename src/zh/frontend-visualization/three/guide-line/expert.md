---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 性能优化（draw call / InstancedMesh）、内存释放、z-fighting 与视锥剔除、WebGPURenderer 与 TSL、与 Babylon.js 对比。版本基线 **three r184**（2026-04）。

## 速查

**性能：降 draw call 是第一抓手**

- 海量同物体：`new THREE.InstancedMesh(geometry, material, count)`，循环 `setMatrixAt(i, m)` 后置 `instanceMatrix.needsUpdate = true`——万级副本 1 次 draw call
- 其他手段：`BufferGeometryUtils.mergeGeometries` 合并静态几何、共用材质、纹理图集（减少纹理切换）、`LOD` 按距离换低模
- 度量：`renderer.info.render.calls`（每帧 draw call 数）、`renderer.info.render.triangles`（三角形数）

**内存释放：WebGL 无自动 GC**

- `scene.remove(mesh)` 只断场景图引用，GPU 资源必须显式释放：`geometry.dispose()` + 每个材质 `dispose()` + 材质上每张贴图 `dispose()`（`mesh.material` 可能是数组）
- 泄漏监控：`renderer.info.memory.geometries` / `textures` 只增不减 = 泄漏；SPA 路由切换频繁装卸场景尤其注意

**z-fighting 与视锥剔除**

- z-fighting 根因：深度精度在 `near`~`far` 间非线性分布（近精远疏）→ 对策 `near` 尽量大、`far` 尽量小；顽固时建渲染器加 `logarithmicDepthBuffer: true`（移动端支持有限、略慢）
- 视锥剔除按 `boundingSphere`/`boundingBox` 判定；手改 `BufferGeometry` 顶点后必须 `geometry.computeBoundingSphere()`（和 `computeBoundingBox()`），否则误剔除；临时绕过 `mesh.frustumCulled = false`

**WebGPURenderer 与 TSL（新一代路径）**

- 入口：`import * as THREE from "three/webgpu"`；TSL 节点：`import { color, texture, uv, positionLocal } from "three/tsl"`
- `new THREE.WebGPURenderer()` 必须 `await renderer.init()` 异步初始化；不支持 WebGPU 时可回退 WebGL
- 节点材质自定义着色：`MeshStandardNodeMaterial` + `material.colorNode = texture(t).mul(color(0xff8800))`
- TSL 价值：同一份节点代码可编译到 WGSL（WebGPU）与 GLSL（WebGL）双后端，免 GLSL 字符串拼接与 `onBeforeCompile` hack
- r184 现状：`WebGLRenderer` 仍是默认、最成熟主力；WebGPU/TSL 适合 compute shader / 节点材质 / 前沿效果

**选型：Three.js vs Babylon.js**

- Three.js：轻量灵活的通用 3D 库，渲染/场景图为主、其余靠 addons，生态最大（react-three-fiber、drei）
- Babylon.js：开箱即用的全功能引擎，内建物理/碰撞/Inspector/GUI；完整游戏、要内建工具选它

**易错点速览**

- ⚠️ 只 `remove` 不 `dispose` → 显存泄漏；颜色贴图忘设 `SRGBColorSpace` → 偏暗发灰
- ⚠️ `near` 极小 + `far` 极大 → z-fighting；海量独立 Mesh → draw call 爆炸
- ⚠️ 手改顶点不重算包围体 → 误剔除；改相机参数忘 `updateProjectionMatrix()` → 画面变形
- ⚠️ `WebGPURenderer` 忘 `await renderer.init()`

## 一、性能：draw call 与合批

每次渲染一个 Mesh 大致对应一次 **draw call**（CPU 向 GPU 提交绘制）。上千次 draw call 时，瓶颈往往在 CPU 提交而非 GPU 算力。降 draw call 是 Three.js 性能优化的第一抓手。

**海量同物体用 `InstancedMesh`**：一份几何 + 一份材质，一次绘制大量副本。

```js
const count = 10000;
const mesh = new THREE.InstancedMesh(geometry, material, count);
const m = new THREE.Matrix4();
for (let i = 0; i < count; i++) {
  m.setPosition(Math.random() * 100, 0, Math.random() * 100);
  mesh.setMatrixAt(i, m);
}
mesh.instanceMatrix.needsUpdate = true;
scene.add(mesh); // 一万个方块 → 1 次 draw call
```

其他手段：合并静态几何（`BufferGeometryUtils.mergeGeometries`）、共用材质、**纹理图集**（多图合一减少纹理切换）、`LOD`（按距离换低模）。

> 用 `renderer.info.render.calls` 看每帧 draw call、`renderer.info.render.triangles` 看三角形数。

## 二、内存释放：dispose

WebGL **没有自动垃圾回收**——`scene.remove(mesh)` 只断开场景图引用，几何/材质/纹理的 GPU 资源不会被回收，必须显式释放：

```js
function disposeMesh(mesh) {
  mesh.geometry.dispose();
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const mat of mats) {
    for (const v of Object.values(mat)) {
      if (v && v.isTexture) v.dispose(); // 材质上的所有贴图
    }
    mat.dispose();
  }
}
scene.remove(mesh);
disposeMesh(mesh);
```

> 用 `renderer.info.memory.geometries`/`textures` 监控持有量；数字只增不减就是泄漏。频繁加载/卸载场景（如 SPA 路由切换）尤其要注意。

## 三、z-fighting 与视锥剔除

**z-fighting（深度闪烁）**：深度缓冲精度有限且在 `near`~`far` 间非线性分布（近处精、远处疏）。把 `near` 设极小 + `far` 极大会严重稀释精度，远处共面物体争夺深度而闪烁。

- 对策：`near` 尽量大、`far` 尽量小（够用即可）；必要时建渲染器时开 `logarithmicDepthBuffer: true`（移动端支持有限、略慢）。

**视锥剔除（frustum culling）**：Three.js 用每个对象的 `boundingSphere`/`boundingBox` 判断是否在视锥内、跳过不可见对象。

::: warning 手改顶点后要重算包围体
手动改写 `BufferGeometry` 顶点后，旧包围体未更新，可能把视野内的物体误剔除/闪烁。改完调用 `geometry.computeBoundingSphere()`（和 `computeBoundingBox()`）；临时可对该 mesh 设 `frustumCulled = false`。
:::

## 四、WebGPURenderer 与 TSL（2026 新一代）

Three.js 正在向 WebGPU 演进。`WebGPURenderer` 从 `three/webgpu` 引入，**需异步初始化**，底层走 WebGPU、不支持时**可回退 WebGL**：

```js
import * as THREE from "three/webgpu";
import { color, texture, uv, positionLocal } from "three/tsl";

const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init(); // 异步初始化（或直接用 setAnimationLoop）

// 节点材质 + TSL 自定义着色
const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = texture(myTexture).mul(color(0xff8800));
```

**TSL（Three.js Shading Language）**用可组合的 JS **节点**描述着色逻辑，由 Three.js 编译期生成后端代码。优势：

- **同一份 TSL 可编译到 WebGPU(WGSL) 与 WebGL(GLSL) 两种后端**；
- 类型安全、可复用、可组合，免去 GLSL 字符串拼接与 `onBeforeCompile` hack。

> 现状（r184）：`WebGLRenderer` 仍是**默认、最成熟、教程最多**的路径；WebGPU/TSL 在持续成熟，适合需要 compute shader、节点材质、前沿效果的场景。新项目可评估，生产主力仍多在 WebGL。

## 五、与 Babylon.js 对比

| 维度 | Three.js | Babylon.js |
|---|---|---|
| 定位 | 轻量灵活的**通用 3D 库** | 开箱即用的**全功能引擎** |
| 内建能力 | 渲染/场景图为主，其余靠 addons/第三方 | 物理、碰撞、Inspector、节点材质编辑器、GUI、动画 |
| 心智 | 像积木，自由组合 | 像游戏引擎，约定更多 |
| 生态 | **最大**（react-three-fiber、drei…） | 完整但相对小，官方工具链强 |
| 底层 | WebGL（默认）/ WebGPU | WebGL / WebGPU |
| 选型 | 要灵活、轻量、大生态、Web 集成 | 要开箱全功能、游戏向、内建工具 |

> 二者都支持 glTF、都基于 WebGL/WebGPU。简单可视化/创意网页/与前端框架深度集成倾向 Three.js；完整游戏/需要内建编辑器与物理倾向 Babylon.js。

## 六、专家级易错点

- **只 `remove` 不 `dispose`**：显存泄漏——几何/材质/纹理都要释放。
- **颜色贴图忘设 `colorSpace`**：画面偏暗发灰——`map`/`emissiveMap` 设 `SRGBColorSpace`，数据贴图保持默认。
- **`near` 极小 + `far` 极大**：z-fighting——收紧深度范围。
- **海量独立 Mesh**：draw call 爆炸——改 `InstancedMesh`/合批。
- **手改顶点不重算包围体**：误剔除——`computeBoundingSphere()`。
- **改相机参数忘 `updateProjectionMatrix()`**：画面变形。
- **以为 `WebGPURenderer` 无需初始化**：它需 `await renderer.init()`。

---

回到 [参考](../reference) 查核心类、材质/光照/加载器与版本现状速查表。
