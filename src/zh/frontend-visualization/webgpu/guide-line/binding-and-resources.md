---
layout: doc
outline: [2, 3]
---

# 绑定模型与资源：BindGroup / Buffer / Texture

> 基于 WebGPU（2026 浏览器现状）· 核于 2026-07

## 速查

- **`GPUDevice`** 是 WebGPU 里"一切资源的工厂"，通过 `adapter.requestDevice()` 获取，几乎所有 `create*` 方法都挂在它上面。
- **实例属性**：`queue`（主队列）、`features`、`limits`、`lost`（`Promise<GPUDeviceLostInfo>`）、`adapterInfo`、`label`。
- **`GPUBuffer`**：`device.createBuffer({ size, usage })` 创建；`usage` 是位标志，可按位或组合。
- **`mappedAtCreation: true`**：创建时直接映射写初始数据，配 `getMappedRange()` + `unmap()`。
- **映射读取（GPU → JS 回读）**：`mapAsync(GPUMapMode.READ, ...)` → `getMappedRange()` → **必须先 `slice(0)` 拷贝**再 `unmap()`（`unmap()` 后原 `ArrayBuffer` 失效）。
- **映射与 STORAGE 互斥**：不能建一个既能被 compute shader 写又能直接 CPU 映射读的 buffer，必须额外建 **staging buffer**，靠 `copyBufferToBuffer` 搬运。
- **`GPUTexture`**：`device.createTexture({ size, format, usage, dimension })` 创建；着色器绑定用的是 `texture.createView()`，不是纹理本身。
- **无自动 mipmap**：WebGPU 没有 `gl.generateMipmap()` 的对应物，需手写 compute/render pass 逐级生成。
- **`GPUSampler` 必须显式创建**：WebGL 里采样参数是纹理对象自带的隐式状态，WebGPU **强制要求显式 sampler 对象**。
- **绑定三层关系**：`BindGroupLayout` 定义"槽位类型" → `BindGroup` 填入"具体资源实例" → `PipelineLayout` 打包多个 `BindGroupLayout` 给管线用。
- **编号对应**：`entries[].binding` 对应 WGSL `@binding(n)`；`bindGroupLayouts` 数组下标对应 WGSL `@group(n)`。
- **`buffer.type`** 可选 `"uniform"` / `"storage"` / `"read-only-storage"`。
- **`layout: "auto"` vs 显式 `PipelineLayout`**：前者省事但每个管线各自生成一套布局、不能跨管线复用；后者需手动保证与着色器匹配，换来**可跨多个 pipeline 复用同一套绑定**。
- **内存对齐第一坑**：`vec3f` 在 `uniform`/`storage` 布局中会被填充到 **16 字节**对齐（逻辑上只需 12 字节）。
- **struct 对齐规则**：整体对齐 = 所有成员中最大对齐值；数组元素按元素类型自身对齐，哪怕数组只有一个元素。
- **偏移量别手算**：官方推荐用 `webgpu-utils` 等库通过 `makeShaderDataDefinitions` + `makeStructuredView` 自动生成布局。
- **写 buffer 两条路径**：`device.queue.writeBuffer()` 一步写入（高频小块数据）；`mappedAtCreation` 只适合一次性初始化的静态数据。
- **进阶顺序**：本页 → [命令编码与计算](./commands-and-compute) → [性能与 WebGL 选型](./performance-and-webgl)；WGSL 类型/入口点回看[渲染管线与 WGSL](./pipeline-and-wgsl)。

## 一、GPUDevice：资源工厂

`GPUDevice` 通过 `adapter.requestDevice()` 获取，核心方法一览：

| 分类 | 方法 |
| --- | --- |
| 资源创建 | `createBuffer` / `createTexture` / `createSampler` / `createShaderModule` / `createQuerySet` / `importExternalTexture` |
| 管线创建 | `createRenderPipeline` / `createRenderPipelineAsync`（推荐）/ `createComputePipeline` / `createComputePipelineAsync`（推荐） |
| 绑定相关 | `createBindGroupLayout` / `createBindGroup` / `createPipelineLayout` |
| 编码 | `createCommandEncoder` / `createRenderBundleEncoder` |
| 错误 | `pushErrorScope` / `popErrorScope` |
| 生命周期 | `destroy()` |

实例属性：`queue`（主队列，`GPUQueue`）、`features`、`limits`、`lost`（`Promise<GPUDeviceLostInfo>`）、`adapterInfo`、`label`。错误处理与 `device.lost` 的用法详见[性能与 WebGL 选型](./performance-and-webgl)。

**为什么优先用 `*Async` 版本**：`createRenderPipeline`/`createComputePipeline` 的同步版本会阻塞直到着色器编译完成；`createRenderPipelineAsync`/`createComputePipelineAsync` 不阻塞主线程，MDN 与官方样例均推荐生产代码使用异步版本。

## 二、核心资源对象：Buffer / Texture / Sampler

**GPUBuffer**（`device.createBuffer(descriptor)`）：

```javascript
const vertexBuffer = device.createBuffer({
  label: "Cell vertices", // 几乎所有 WebGPU 对象都能加 label，调试报错时会带上
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  mappedAtCreation: true, // 创建时直接映射写入初始数据
});
new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
vertexBuffer.unmap();
```

`usage` 是位标志（可按位或组合）：`VERTEX` `INDEX` `UNIFORM` `STORAGE` `COPY_SRC` `COPY_DST` `MAP_READ` `MAP_WRITE`（还有较少考的 `INDIRECT` `QUERY_RESOLVE`）。实例属性：`size`（只读）、`usage`（只读）、`mapState`（`"mapped"`/`"unmapped"`/`"pending"`）、`label`。

映射读取流程（GPU 计算结果 → JS 回读的典型写法）：

```javascript
await stagingBuffer.mapAsync(GPUMapMode.READ, 0, BUFFER_SIZE);
const copyArrayBuffer = stagingBuffer.getMappedRange(0, BUFFER_SIZE);
const data = copyArrayBuffer.slice(0); // 必须先拷贝出来，unmap 后原 ArrayBuffer 会失效
stagingBuffer.unmap();
console.log(new Float32Array(data));
```

::: warning 可映射与 STORAGE 用途互斥
不能创建一个既能被 compute shader 写又能直接 CPU 映射读的 buffer，必须额外建一个 **staging buffer**，通过 `copyBufferToBuffer` 搬运后再 `mapAsync` 读取——这是"资源与同步"部分最容易踩的坑。
:::

**GPUTexture**（`device.createTexture(descriptor)`）：

```javascript
const texture = device.createTexture({
  size: [width, height, 1], // [width, height, depthOrArrayLayers]
  format: "rgba8unorm",
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  mipLevelCount: 1,
  sampleCount: 1,
  dimension: "2d", // "1d" | "2d" | "3d"
});
const view = texture.createView(); // 着色器绑定用的是 view，不是 texture 本身
```

usage 位标志：`TEXTURE_BINDING`（着色器采样）、`RENDER_ATTACHMENT`（渲染目标）、`COPY_SRC`、`COPY_DST`、`STORAGE_BINDING`。外部图片写入纹理走 `device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, [w, h])`，而不是 CPU 端逐像素写 buffer。

**GPUSampler**（`device.createSampler(descriptor)`）：控制着色器如何过滤/寻址纹理。

```javascript
const sampler = device.createSampler({
  addressModeU: "repeat",
  addressModeV: "repeat",
  magFilter: "linear",
  minFilter: "linear",
  mipmapFilter: "linear",
});
```

WebGPU **强制要求显式 sampler 对象**（WebGL 里采样参数是纹理对象自带的隐式状态），且**没有自动生成 mipmap 的 API**（`gl.generateMipmap()` 在 WebGPU 里没有对应物，需手写 compute/render pass 逐级生成）。

## 三、绑定模型：BindGroupLayout / BindGroup / PipelineLayout

三者关系：**BindGroupLayout 定义"槽位结构"（类型和可见性）→ BindGroup 把具体资源实例填进槽位 → PipelineLayout 把多个 BindGroupLayout 打包成管线可用的完整绑定方案**。

```javascript
// 1. 布局：只声明"这个 binding 是什么类型、哪个阶段可见"
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
  ],
});

// 2. 管线布局：可以有多个 group（对应 WGSL 里的多个 @group(n)）
const pipelineLayout = device.createPipelineLayout({
  bindGroupLayouts: [bindGroupLayout],
});

// 3. 绑定组：真正塞资源实例
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    { binding: 0, resource: { buffer: storageBuffer } },
    { binding: 1, resource: sampler },
    { binding: 2, resource: textureView },
  ],
});
```

`entries[].binding` 必须与 WGSL 中 `@binding(n)` 一致；`bindGroupLayouts` 数组下标对应 WGSL 中的 `@group(n)`。`buffer.type` 可选 `"uniform"` / `"storage"` / `"read-only-storage"`。

::: tip `layout: "auto"` vs 显式 PipelineLayout
`"auto"` 让 WebGPU 根据着色器代码自动推导绑定布局（写起来快，适合原型），显式 `createPipelineLayout` 则需要手动保证与着色器完全匹配，但换来的是**跨多个 pipeline 复用同一套 BindGroupLayout / BindGroup**（自动模式下每个 pipeline 各自生成一套布局对象，即使内容相同也不能直接互换）。
:::

## 四、Buffer 内存布局与对齐（易错高发区）

WGSL 的 `uniform`/`storage` 变量内存布局遵循严格对齐规则：

- 标量：`f32`/`i32`/`u32` 各 4 字节，`f16` 2 字节（需开启扩展）。
- **`vec3f` 对齐到 16 字节**——这是最经典的坑：逻辑上 `vec3f` 只需 12 字节，但在 `uniform`/`storage` 布局中会被填充（padding）到 16 字节对齐边界。
- struct 整体对齐 = 其所有成员中最大对齐值；数组每个元素按元素类型自身对齐规则对齐，哪怕数组只有一个元素。

手动计算 struct 内偏移量极易出错（一个字节算错就会导致 shader 读到错误数据且难以调试），官方教程推荐使用 `webgpu-utils` 等库通过 `makeShaderDataDefinitions` + `makeStructuredView` 自动生成布局，而非手写偏移量。

写入 buffer 的两条路径：

| 方式 | 用法 | 场景 |
| --- | --- | --- |
| `device.queue.writeBuffer(buffer, offset, data, dataOffset, size)` | 一步写入，内部隐式做拷贝 | 高频更新的小块数据（如每帧 uniform） |
| `mappedAtCreation: true` + `getMappedRange()` + `unmap()` | 创建时直接映射写初始值 | 一次性初始化的静态数据（顶点/索引） |
| `mapAsync(GPUMapMode.READ/WRITE)` + `getMappedRange()` + `unmap()` | 异步映射，多用于回读 | GPU 计算结果读回 CPU（需搭配 staging buffer） |

---

资源与绑定就位后，下一步是 [命令编码与计算](./commands-and-compute)：如何把这些资源真正塞进一次渲染/计算通道，以及 WebGPU 最具差异化的 compute shader 与 workgroup 并行设计。
