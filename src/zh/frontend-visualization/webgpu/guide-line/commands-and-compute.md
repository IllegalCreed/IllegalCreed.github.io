---
layout: doc
outline: [2, 3]
---

# 命令编码与计算管线：Compute Shader 深入

> 基于 WebGPU（2026 浏览器现状）· 核于 2026-07

## 速查

- **命令是"记录后提交"模型**：几乎所有"发命令"的方法只是往 **command buffer** 里追加记录，**并不会立即执行**。
- **提交三步**：`encoder.finish()` 打包成 `GPUCommandBuffer` → `queue.submit([...])` → 真正交给 GPU 执行。
- **`GPUCommandBuffer` 只能提交一次**：`finish()` 后即密封，`submit()` 之后的 encoder 不能再继续编码；`submit()` 可以一次传入多个 command buffer。
- **渲染通道**：`beginRenderPass({ colorAttachments })`，`view` 每帧都要重新拿（`context.getCurrentTexture().createView()`）。
- **`loadOp`**：`"clear"` 用 `clearValue` 清屏，`"load"` 保留上一帧内容。
- **`storeOp`**：`"store"` 保存渲染结果供后续读取/显示，`"discard"` 直接丢弃（省带宽，用于不需要保留的中间附件）。
- **其它编码方法**：`copyBufferToBuffer` / `copyBufferToTexture` / `copyTextureToBuffer` / `copyTextureToTexture` / `clearBuffer`，调试用 `pushDebugGroup` / `popDebugGroup` / `insertDebugMarker`。
- **`GPUComputePipeline`**：`device.createComputePipeline({ layout, compute: { module, entryPoint } })`，只有单一计算阶段，无顶点/片元。
- **计算通道范式**：`beginComputePass()` → `setPipeline` → `setBindGroup` → `dispatchWorkgroups(x, y, z)` → `end()`。
- **`@workgroup_size(x,y,z)`**：着色器里静态声明 workgroup 的 3 维大小；`dispatchWorkgroups(x,y,z)` 是 CPU 侧决定"发多少个 workgroup"。
- **反面案例**：`@workgroup_size(1,1,1)` 只用单线程跑全部数据，实测比纯 JS 版本还**慢 30 倍**——workgroup 划分不合理等于没用上 GPU 并行。
- **正面案例**：`workgroup_size` 提到 256 + `var<workgroup>` 共享内存做局部归约，可把一次直方图统计从 11ms 优化到 1ms 以下（100+ 倍提升）。
- **竞态条件**：多个 invocation 并行写同一目标会"丢失更新"，必须用 `atomic<u32>` + `atomicAdd`/`atomicLoad` 保证操作不可分割。
- **`workgroupBarrier()`**：跨 invocation 同步一个 workgroup 内的共享内存时必须调用。
- **`dispatchWorkgroupsIndirect()`**：`dispatchWorkgroups` 的间接调用版本，参数来自 GPU buffer 而非 CPU 侧字面量。
- **典型应用**：GPGPU 通用计算、粒子系统、物理模拟（约束求解/碰撞检测）、图像并行滤波、机器学习推理（Chrome 官方数据：部分模型推理速度提升 3 倍以上）。
- **`constants` 选项**：`compute: { constants: {...} }` 可覆盖 WGSL 里用 `override` 声明的编译期常量。
- **进阶顺序**：本页 → [性能与 WebGL 选型](./performance-and-webgl)；渲染管线/WGSL 类型回看[渲染管线与 WGSL](./pipeline-and-wgsl)；资源与绑定回看[绑定模型与资源](./binding-and-resources)。

## 一、命令录制与提交：记录后统一执行

WebGPU 里几乎所有"发命令"的方法，实际只是往 **command buffer** 里追加记录，**并不会立即执行**——必须 `encoder.finish()` 打包成 `GPUCommandBuffer`，再交给 `queue.submit()` 才真正提交给 GPU。这是理解 WebGPU 命令模型的第一原则：**录制与执行是两个独立阶段**。

```javascript
const commandEncoder = device.createCommandEncoder();

const renderPassDescriptor = {
  colorAttachments: [
    {
      view: context.getCurrentTexture().createView(), // 每帧都要重新拿当前纹理
      clearValue: { r: 0.2, g: 0.3, b: 0.4, a: 1.0 },
      loadOp: "clear", // "clear" | "load"
      storeOp: "store", // "store" | "discard"
    },
  ],
};

const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
passEncoder.setPipeline(renderPipeline);
passEncoder.setBindGroup(0, bindGroup);
passEncoder.setVertexBuffer(0, vertexBuffer);
passEncoder.setIndexBuffer(indexBuffer, "uint16");
passEncoder.drawIndexed(indexCount); // 或 passEncoder.draw(vertexCount)
passEncoder.end();

device.queue.submit([commandEncoder.finish()]); // 命令缓冲一次性提交，finish() 后不可再编码
```

- `loadOp: "clear"` 用 `clearValue` 清屏，`loadOp: "load"` 保留上一帧内容；`storeOp: "store"` 保存渲染结果供后续读取/显示，`"discard"` 直接丢弃（多用于不需要保留的中间附件，省带宽）。
- `GPUCommandEncoder` 还提供 `copyBufferToBuffer` / `copyBufferToTexture` / `copyTextureToBuffer` / `copyTextureToTexture` / `clearBuffer`，以及调试用的 `pushDebugGroup` / `popDebugGroup` / `insertDebugMarker`。
- 一个 `GPUCommandBuffer` **只能提交一次**（`finish()` 之后即密封，`submit()` 可以一次传入多个 command buffer 数组）。

## 二、计算管线与 Compute Shader（WebGPU 独有能力）

WebGL 时代没有原生通用计算，只能拿渲染管线"曲线救国"（把数据编码进纹理、用片元着色器计算再解码）。WebGPU 原生提供 `GPUComputePipeline`，是它相对 WebGL 最大的差异化能力：

```javascript
const computePipeline = device.createComputePipeline({
  label: "double compute pipeline",
  layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
  compute: {
    module: shaderModule,
    entryPoint: "main",
    // constants: {...} 可选，覆盖 WGSL 里用 override 声明的编译期常量
  },
});
```

对应 WGSL（注意 `array<f32>` 这个泛型写法——存储缓冲区里的元素类型）：

```wgsl
@group(0) @binding(0) var<storage, read_write> data: array<f32>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  data[i] = data[i] * 2.0;
}
```

录制与派发：

```javascript
const commandEncoder = device.createCommandEncoder();
const passEncoder = commandEncoder.beginComputePass();
passEncoder.setPipeline(computePipeline);
passEncoder.setBindGroup(0, bindGroup);
passEncoder.dispatchWorkgroups(Math.ceil(BUFFER_SIZE / 64)); // 也支持 dispatchWorkgroupsIndirect()
passEncoder.end();
commandEncoder.copyBufferToBuffer(output, 0, stagingBuffer, 0, BUFFER_SIZE);
device.queue.submit([commandEncoder.finish()]);
```

## 三、workgroup 与并行设计（webgpufundamentals.org 直方图案例的关键结论）

- **workgroup 是 GPU 能调度的最小工作单元**：`@workgroup_size(x,y,z)` 在着色器里静态声明其 3 维大小；`dispatchWorkgroups(x,y,z)` 在 CPU 侧决定"发多少个 workgroup"。
- **反面案例**：`@workgroup_size(1,1,1)` 只用单线程跑全部数据，实测比纯 JS 版本还**慢 30 倍**——GPU 单核算力不如 CPU，其优势完全来自大规模并行，workgroup 划分不合理等于没用上 GPU。
- **正面案例**：把 `workgroup_size` 提到 256，配合 `var<workgroup>` 声明的**工作组共享内存**做局部归约（reduction），再用树形归约跨多个 workgroup 二次汇总，最终把一个直方图统计从 11ms 优化到 1ms 以下（100+ 倍提升）。

::: warning 竞态条件：并行写入需要原子操作
多个 invocation 并行写同一个 bin 会发生"读 3 写 4，读 3 写 4"的丢失更新，必须用原子类型 `atomic<u32>` + `atomicAdd(&bins[bin], 1u)` / `atomicLoad()` 保证操作不可分割；跨 invocation 同步一个 workgroup 内的共享内存要调用 `workgroupBarrier()`。
:::

GPU 并行安全的根本原理回顾：着色器函数的每次调用（invocation）**完全独立**，可任意顺序执行，因此可被上万个处理器核心并行调度。三条设计约束保障了这一点：①着色器函数只能引用自己的输入；②着色器不能动态分配内存；③"读写同一目标"的场景（如上面的直方图 bin）需要原子操作显式声明。

**典型应用场景**：GPGPU 通用计算、粒子系统、物理模拟（约束求解/碰撞检测）、图像并行滤波、机器学习推理（Chrome 官方数据：某些模型推理速度提升 3 倍以上）。

## 四、命令模型与计算管线的易错点

- **把命令编码当"即时执行"来用**：所有 `pass.xxx()`/`encoder.xxx()` 调用只是往命令缓冲里追加记录，必须 `finish()` + `queue.submit()` 才会真正执行；`finish()` 之后的 encoder 不能再继续编码。
- **`workgroup_size` 选得过小**：如 `@workgroup_size(1)` 完全没利用 GPU 并行能力，实测比同等 JS 实现还慢，是 compute 新手最典型的性能坑。
- **并行写入未加原子操作**：多个 invocation 同时写同一内存地址（如直方图统计）会产生竞态丢失更新，必须用 `atomic<u32>`/`atomicAdd`/`atomicLoad`。
- **忘记 `workgroupBarrier()`**：用了 `var<workgroup>` 共享内存却不同步，读到的可能是其它 invocation 还没写完的中间状态。

---

命令编码与 compute shader 打通之后，最后一站是[性能与 WebGL 选型](./performance-and-webgl)：WebGPU 相对 WebGL 的性能优势原理、错误处理与设备丢失、以及完整的选型对比表。
