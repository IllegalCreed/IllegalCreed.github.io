---
layout: doc
outline: [2, 3]
---

# 参考：WebGPU API 速查

> 基于 WebGPU（2026 浏览器现状）· 核于 2026-07

## 速查

- **定位**：W3C 标准 API，非第三方库；对标 Vulkan/Metal/Direct3D 12；WebGL 继任者非升级版；两大能力：渲染 + 计算。
- **初始化四步**：`navigator.gpu` → `requestAdapter()`（失败返回 `null`，不抛异常）→ `requestDevice()`（同一 adapter 只能成功一次）→ `canvas.getContext('webgpu')` + `configure({ device, format, alphaMode })`。
- **canvas 格式**：始终用 `navigator.gpu.getPreferredCanvasFormat()`，别手写死值。
- **`GPUDevice`** 是资源工厂：`create*` 系列方法 + `queue`/`limits`/`features`/`lost`/`adapterInfo` 属性。
- **WGSL 标量**：`bool`/`i32`/`u32`/`f32`（`f16` 需扩展）；向量矩阵简写 `vec2f`/`vec3i`/`vec4u`/`mat4x4f` ≡ 完整泛型形式 `vec2<f32>` 等。
- **入口点三选一**：`@vertex`/`@fragment`/`@compute`；关键属性 `@location(n)`/`@builtin(name)`/`@group(n) @binding(m)`/`@workgroup_size(x,y,z)`。
- **`GPURenderPipeline`**：五大块 `vertex`/`primitive`/`depthStencil`/`multisample`/`fragment`；创建后不可变，编译期校验。
- **`GPUComputePipeline`**：单一 `compute: { module, entryPoint }` 阶段；`dispatchWorkgroups(x,y,z)` 决定发多少个 workgroup。
- **绑定三层**：`BindGroupLayout`（槽位类型）→ `BindGroup`（塞资源实例）→ `PipelineLayout`（打包给管线）；编号对应 WGSL `@group`/`@binding`。
- **命令模型**：`createCommandEncoder()` → 若干编码调用（只是记录）→ `finish()` → `queue.submit([...])` 才真正执行；`GPUCommandBuffer` 只能提交一次。
- **渲染通道**：`loadOp` `"clear"`/`"load"`；`storeOp` `"store"`/`"discard"`；`view` 每帧重新 `context.getCurrentTexture().createView()`。
- **内存对齐坑**：`vec3f` 在 `uniform`/`storage` 中占 **16 字节**（非 12 字节）；偏移量别手算，用 `webgpu-utils`。
- **映射与 STORAGE 互斥**：CPU 回读 compute 结果需额外建 staging buffer + `copyBufferToBuffer`；`getMappedRange()` 内容 `unmap()` 后失效，需先 `slice(0)`。
- **workgroup 性能**：`@workgroup_size(1)` 可能比纯 JS 慢 30 倍；合理划分 + 共享内存归约可提速 100+ 倍；并行写同一地址需 `atomic<u32>` + `atomicAdd`/`atomicLoad` + `workgroupBarrier()`。
- **`*Async` 优先**：`createRenderPipelineAsync`/`createComputePipelineAsync` 不阻塞主线程。
- **错误体系**：`GPUValidationError`/`GPUOutOfMemoryError`/`GPUInternalError`/`GPUPipelineError`；`pushErrorScope`/`popErrorScope` 主动包裹，`uncapturederror` 全局兜底；`device.lost` 是 `Promise`。
- **坐标系（迁移必查）**：WebGPU 裁剪空间 Z `0~1`、视口 Y 轴向下；WebGL 裁剪空间 Z `-1~1`、视口 Y 轴向上。
- **2026 浏览器现状**：Chrome/Edge 113+、Firefox 141+（Windows）、Safari 26+ 桌面默认开启；规范仍 W3C Editor's Draft；全球可用率约 82%；不宜断言"已 widely available"。
- **vs WebGL 一句话选型**：现代桌面 + 需要 compute → WebGPU；需覆盖全平台/旧设备 → WebGL(2)；折中用 Three.js `WebGPURenderer`/Babylon.js `WebGPUEngine` 自动 fallback。

## 一、API 速查表

### 初始化与设备

| API | 说明 |
| --- | --- |
| `navigator.gpu` | `GPU` 接口实例，入口对象；不支持时为 `undefined` |
| `navigator.gpu.requestAdapter(options?)` | 返回 `Promise<GPUAdapter \| null>`；失败为 `null`，不抛异常 |
| `navigator.gpu.getPreferredCanvasFormat()` | 拿平台最优 canvas 格式，配置 context 必用 |
| `adapter.requestDevice(descriptor?)` | 返回 `Promise<GPUDevice>`；同一 adapter 只能成功一次 |
| `adapter.requestAdapterInfo()` / `device.adapterInfo` | 拿 `GPUAdapterInfo`（含 `isFallbackAdapter`），替代已弃用的 `adapter.isFallbackAdapter` |
| `canvas.getContext("webgpu")` | 拿 `GPUCanvasContext` |
| `context.configure({ device, format, alphaMode })` | 配置画布上下文 |

### GPUDevice 方法分类

| 分类 | 方法 |
| --- | --- |
| 资源创建 | `createBuffer` / `createTexture` / `createSampler` / `createShaderModule` / `createQuerySet` / `importExternalTexture` |
| 管线创建 | `createRenderPipeline` / `createRenderPipelineAsync`（推荐）/ `createComputePipeline` / `createComputePipelineAsync`（推荐） |
| 绑定相关 | `createBindGroupLayout` / `createBindGroup` / `createPipelineLayout` |
| 编码 | `createCommandEncoder` / `createRenderBundleEncoder` |
| 错误 | `pushErrorScope` / `popErrorScope` |
| 生命周期 | `destroy()` |
| 实例属性 | `queue` / `features` / `limits` / `lost`（`Promise<GPUDeviceLostInfo>`）/ `adapterInfo` / `label` |

### 资源对象

| 对象 | 创建 | 关键点 |
| --- | --- | --- |
| `GPUBuffer` | `device.createBuffer({ size, usage })` | `usage` 位标志；`mappedAtCreation`/`mapAsync` 两条映射路径 |
| `GPUTexture` | `device.createTexture({ size, format, usage, dimension })` | 绑定用 `texture.createView()`，非 texture 本身 |
| `GPUSampler` | `device.createSampler({ addressModeU, magFilter, ... })` | 必须显式创建，无自动 mipmap API |
| `GPUShaderModule` | `device.createShaderModule({ code })` | 装载 WGSL 源码；`getCompilationInfo()` 拿编译期诊断信息 |

### 命令编码

| API | 说明 |
| --- | --- |
| `device.createCommandEncoder()` | 开始录制命令 |
| `encoder.beginRenderPass(descriptor)` / `beginComputePass()` | 开始一个渲染/计算通道 |
| `pass.setPipeline` / `setBindGroup` / `setVertexBuffer` / `setIndexBuffer` | 通道内配置 |
| `pass.draw(n)` / `drawIndexed(n)` / `dispatchWorkgroups(x,y,z)` | 渲染/计算触发调用 |
| `pass.end()` | 结束通道 |
| `encoder.copyBufferToBuffer/copyBufferToTexture/copyTextureToBuffer/copyTextureToTexture/clearBuffer` | 拷贝与清空 |
| `encoder.finish()` | 密封为 `GPUCommandBuffer`（只能一次） |
| `device.queue.submit([...])` | 真正提交执行 |
| `device.queue.writeBuffer(buffer, offset, data, ...)` | 一步写入 buffer，常用于每帧 uniform |

## 二、WGSL 类型与属性速查

### 标量与向量矩阵

| 类别 | 类型 |
| --- | --- |
| 标量 | `bool` `i32` `u32` `f32`（`f16` 需显式开启扩展） |
| 向量简写 ≡ 完整形式 | `vec2f` ≡ `vec2<f32>`；`vec3i` ≡ `vec3<i32>`；`vec4u` ≡ `vec4<u32>` |
| 矩阵简写 ≡ 完整形式 | `mat4x4f` ≡ `mat4x4<f32>`（命名规则"列数 x 行数"） |
| 存储类型 | `array<f32>`（运行时长度数组，常见于 `storage` 缓冲）、`atomic<u32>`（原子类型） |

### 入口点属性

| 属性 | 阶段 | 说明 |
| --- | --- | --- |
| `@vertex` | 顶点着色器 | 返回值须含 `@builtin(position)` |
| `@fragment` | 片元着色器 | 返回值对应 `@location(n)` 颜色目标 |
| `@compute @workgroup_size(x,y,z)` | 计算着色器 | 声明 workgroup 内并行线程网格大小 |

### 关键修饰属性

| 属性 | 作用 |
| --- | --- |
| `@location(n)` | 跨阶段变量（顶点→片元）位置，或顶点输入槽位 |
| `@builtin(name)` | 内置值，如 `position`/`vertex_index`/`global_invocation_id` |
| `@group(n) @binding(m)` | 资源绑定坐标，须与 JS 侧 `GPUBindGroupLayout`/`GPUBindGroup` 一致 |
| `var<storage, read_write>` | 存储缓冲变量声明，可读写；也有 `read`-only 变体 |
| `var<workgroup>` | workgroup 内共享内存，需配 `workgroupBarrier()` 同步 |

## 三、usage 标志速查

| 分类 | 标志 |
| --- | --- |
| `GPUBufferUsage` | `VERTEX` `INDEX` `UNIFORM` `STORAGE` `COPY_SRC` `COPY_DST` `MAP_READ` `MAP_WRITE`（少考 `INDIRECT` `QUERY_RESOLVE`） |
| `GPUTextureUsage` | `TEXTURE_BINDING`（采样）`RENDER_ATTACHMENT`（渲染目标）`COPY_SRC` `COPY_DST` `STORAGE_BINDING` |
| `GPUShaderStage` | `VERTEX` `FRAGMENT` `COMPUTE`（`BindGroupLayout` entry 的 `visibility`） |
| `buffer.type`（BindGroupLayout） | `"uniform"` `"storage"` `"read-only-storage"` |
| `GPUMapMode` | `READ` `WRITE` |

## 四、浏览器支持现状（2026-07）

| 浏览器 | 支持版本 | 平台 | 备注 |
| --- | --- | --- | --- |
| Chrome / Edge | **113+**（2023-04 起） | Windows（D3D12）/ macOS / ChromeOS（Vulkan） | 默认开启，实现基于 Dawn（C++） |
| Chrome / Edge（Android） | 121+ | Android 12+，高通/ARM GPU | 139+ 起支持 Imagination GPU（Android 16+） |
| Chrome / Edge（Linux） | 144+ / 147+ | Intel Gen12+ / NVIDIA（driver 535.183.01+，Wayland） | 覆盖仍在扩展 |
| Chrome / Edge（Windows ARM64） | 需 flag | `--enable-unsafe-webgpu` | 尚未默认开启 |
| Firefox | **141+**（Windows，默认开启） | Windows | 实现基于 wgpu（Rust） |
| Firefox | 145+ / 147+ | macOS（Apple Silicon / 其他） | |
| Firefox（Linux/Android） | 仅 Nightly / flag 后 | — | Mozilla 计划 2026 年内跟进 |
| Safari | **26+**（默认开启） | macOS Tahoe / iOS / iPadOS / visionOS | Safari 26.2 起支持 WebXR + WebGPU 整合（Vision Pro） |

**全球可用率**：约 82%（caniuse 口径，桌面为主）。**规范状态**：WebGPU 规范与 WGSL 规范当前均为 W3C **Editor's Draft**，尚未成为正式 Recommendation。

## 五、vs WebGL(2) 选型对比（精简版）

| 维度 | WebGL(2) | WebGPU |
| --- | --- | --- |
| 状态管理 | 全局可变状态机，运行时生效 | 不可变管线对象，编译期校验 |
| 通用计算 | 无原生支持 | 原生 `GPUComputePipeline` |
| 着色语言 | GLSL | WGSL（静态类型） |
| CPU 开销 | 单线程提交，易成瓶颈 | 支持多线程录制命令 |
| 裁剪空间 Z / 视口 Y | `-1~1` / 向上 | `0~1` / 向下 |
| 覆盖率（2026） | 96%+ 全平台 | 约 82%，现代桌面为主 |

完整对比与何时选型见[性能与 WebGL 选型](./guide-line/performance-and-webgl)。

## 六、易错点清单

- **初始化异步链漏判空/漏 catch**：`requestAdapter()` 返回 `null` 不抛异常，`adapter`/`device` 都需要显式判断；忘记 `await` 或漏处理 rejection 是最基础的翻车点。
- **canvas format 不用 `getPreferredCanvasFormat()`**：手写死 `"rgba8unorm"` 在部分平台上不是最优格式，会引入隐式额外拷贝。
- **bind group 与 layout 不匹配**：`@group`/`@binding` 编号错位、`buffer.type` 与 WGSL 声明不一致都会在创建/绘制时报验证错误。
- **buffer usage 标志漏加**：忘了给 staging buffer 加 `COPY_DST`、忘了给源 buffer 加 `COPY_SRC`，`copyBufferToBuffer` 会失败；`MAP_READ`/`MAP_WRITE` 与 `STORAGE`/`UNIFORM` 不能随意混用。
- **命令缓冲当"即时执行"来用**：必须 `finish()` + `queue.submit()` 才会真正执行；`finish()` 之后的 encoder 不能再继续编码。
- **`mapAsync` 忘记 `await` 或忘记 `unmap()`**：`getMappedRange()` 返回的 `ArrayBuffer` 在 `unmap()` 后立即失效，必须先 `slice(0)` 拷贝出来。
- **`workgroup_size` 选得过小**：如 `@workgroup_size(1)` 完全没利用 GPU 并行能力，实测比同等 JS 实现还慢。
- **并行写入未加原子操作**：多个 invocation 同时写同一内存地址会产生竞态丢失更新，必须用 `atomic<u32>`/`atomicAdd`/`atomicLoad`。
- **`vec3f` 内存对齐踩坑**：`uniform`/`storage` 中 `vec3f` 实际占 16 字节（不是 12 字节），手动计算 struct 偏移量时极易漏算这个 padding。
- **`requestDevice()` 重复调用**：同一个 adapter 只能成功 `requestDevice()` 一次，第二次会 reject（`OperationError`），需要重新 `requestAdapter()` 才能再次拿设备。
- **`adapter.isFallbackAdapter` 用法过时**：该属性已弃用，应改用 `GPUAdapterInfo.isFallbackAdapter`。
- **坐标系从 WebGL 迁移直接照搬**：Z 裁剪范围与视口 Y 轴方向都相反，投影矩阵、深度比较函数、纹理坐标翻转都要跟着调整。
- **同步 `createRenderPipeline`/`createComputePipeline` 用于生产环境**：会阻塞主线程直到着色器编译完成，生产代码应优先用 `*Async` 版本。
- **误信 caniuse.com 的 WebGPU 兼容表**：本次调研发现其 Firefox 数据与 GitHub 官方 wiki/Chrome 官方文档明显冲突（疑似滞后或误读），涉及浏览器支持结论应以 gpuweb 官方 Implementation Status wiki 与浏览器厂商自己的开发者文档为准，MDN 页面"非 Baseline"的标注也应结合这些信源交叉解读，不宜单独断言"WebGPU 已过时/未落地"或"已 Baseline"。

## 七、权威链接

- [MDN WebGPU_API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) —— 总览，含全部子接口列表、Baseline 状态说明
- [MDN GPUDevice](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice) —— 资源工厂核心接口
- [MDN GPURenderPipeline](https://developer.mozilla.org/en-US/docs/Web/API/GPURenderPipeline) / [GPUComputePipeline](https://developer.mozilla.org/en-US/docs/Web/API/GPUComputePipeline)
- [MDN GPUBindGroup](https://developer.mozilla.org/en-US/docs/Web/API/GPUBindGroup) / [GPUBindGroupLayout](https://developer.mozilla.org/en-US/docs/Web/API/GPUBindGroupLayout)
- [WebGPU Fundamentals](https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html) —— 权威教程主站
- [WebGPU Fundamentals：How it works](https://webgpufundamentals.org/webgpu/lessons/webgpu-how-it-works.html) —— GPU 并行原理
- [WebGPU Fundamentals：Memory Layout](https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html) —— 内存对齐专题
- [WebGPU Fundamentals：Compute Shaders Histogram](https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders-histogram.html) —— workgroup 性能案例出处
- [WebGPU Fundamentals：From WebGL](https://webgpufundamentals.org/webgpu/lessons/webgpu-from-webgl.html) —— 迁移对照
- [WebGPU W3C 规范](https://gpuweb.github.io/gpuweb/)（Editor's Draft）/ [WGSL W3C 规范](https://gpuweb.github.io/gpuweb/wgsl/)（Editor's Draft）
- [gpuweb 官方 Implementation Status wiki](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) —— 浏览器版本号权威依据
- [web.dev：WebGPU supported major browsers](https://web.dev/blog/webgpu-supported-major-browsers)
- [Chrome for Developers：WebGPU overview](https://developer.chrome.com/docs/web-platform/webgpu/overview) / [From WebGL to WebGPU](https://developer.chrome.com/docs/web-platform/webgpu/from-webgl-to-webgpu)
