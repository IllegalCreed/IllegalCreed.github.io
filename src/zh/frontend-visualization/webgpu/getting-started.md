---
layout: doc
outline: [2, 3]
---

# 入门：现代显式 GPU API 与初始化

> 基于 WebGPU（2026 浏览器现状）· 核于 2026-07

## 速查

- **定位**：WebGPU 是浏览器原生 **W3C 标准 API**（非第三方库），面向 Vulkan / Metal / Direct3D 12 设计；是 WebGL 的**继任者**而非升级版——两者架构哲学不同（有状态机 vs 无状态显式管线）。
- **两大能力**：渲染（画三角形/点/线到纹理）+ 通用计算（compute shader，WebGL 时代的痛点）。
- **不取代 WebGL**：长期并存，主流库走「WebGPU 优先、WebGL2 自动兜底」策略（如 Three.js `WebGPURenderer`）。
- **2026 浏览器现状**：Chrome/Edge 113+、Firefox 141+（Windows）、Safari 26+ 桌面版均默认开启；全球可用率约 82%；规范仍是 W3C **Editor's Draft**，尚未 Baseline，移动端/Linux 覆盖仍在补齐。
- **安全上下文**：要求 HTTPS（本地 `localhost` 例外）。
- **入口对象**：`navigator.gpu` 是 `GPU` 接口实例，不支持时为 `undefined`。
- **初始化四步**：`navigator.gpu` → `requestAdapter()` → `requestDevice()` → `canvas.getContext('webgpu')` + `configure()`，每一步都是异步 Promise。
- **`requestAdapter()` 判空**：失败返回 `null`，**不抛异常**，必须显式判断。
- **`requestDevice()` 只能成功一次**：同一个 adapter 第二次调用会 reject（adapter 在创建 device 时已被消费）。
- **canvas 格式**：必须用 `navigator.gpu.getPreferredCanvasFormat()` 拿平台最优格式，手写死值可能引入额外拷贝开销。
- **`GPUDevice` 是资源工厂**：几乎所有 `create*` 方法（buffer/texture/pipeline/bindGroup…）都挂在 device 上，细节见[绑定模型与资源](./guide-line/binding-and-resources)。
- **WGSL** 是 WebGPU 专属着色语言，三种入口点属性 `@vertex`/`@fragment`/`@compute` 一一对应三种着色器阶段，细节见[渲染管线与 WGSL](./guide-line/pipeline-and-wgsl)。
- **命令是"记录后提交"模型**：所有编码调用只是往 command buffer 里追加记录，必须 `encoder.finish()` + `queue.submit()` 才真正执行，细节见[命令编码与计算](./guide-line/commands-and-compute)。
- **`*Async` 优先**：`createRenderPipelineAsync`/`createComputePipelineAsync` 不阻塞主线程，生产代码应优先于同步版本。
- **实际业务少手写底层**：Three.js/Babylon.js 等库已封装好 WebGPU，业务开发更常见"选一个库"而非从零手搓。
- **进阶顺序**：本页 → [渲染管线与 WGSL](./guide-line/pipeline-and-wgsl) → [绑定模型与资源](./guide-line/binding-and-resources) → [命令编码与计算](./guide-line/commands-and-compute) → [性能与 WebGL 选型](./guide-line/performance-and-webgl)。

## 一、WebGPU 是什么：现代显式 GPU API

WebGPU 本质只做两件事——「画三角形/点/线到纹理」和「在 GPU 上跑计算」（webgpufundamentals.org 原话）。架构自下而上分四层：

```
Web 应用（WebGPU JS API）
        ↓
浏览器 WebGPU 实现（Chromium: Dawn(C++) / Firefox: wgpu(Rust) / Safari: 自研）
        ↓
原生 GPU API（Direct3D 12 / Metal / Vulkan）
        ↓
物理 GPU 设备
```

核心概念对照：

| 概念 | 说明 |
| --- | --- |
| **GPU Adapter** | 代表物理 GPU + 驱动，`GPUAdapter` |
| **Logical Device** | 单个 Web 应用隔离访问 GPU 的逻辑句柄，`GPUDevice`，一切资源的工厂 |
| **Pipeline** | 预编译、不可变的渲染/计算配置对象，替代 WebGL 的运行时状态机 |
| **Command Buffer** | 一次性提交的命令集合，录制后不可修改 |
| **WGSL** | WebGPU 专属着色语言，静态类型，替代 GLSL |

GPU 并行的根本来源：着色器函数的每次调用（invocation）**完全独立**，可任意顺序被上万个处理器核心并行调度。三条设计约束保障了这种并行安全：①着色器函数只能引用自己的输入；②着色器不能动态分配内存；③"读写同一目标"的场景需要原子操作。这条原理是理解后面 [compute shader](./guide-line/commands-and-compute) 的地基。

## 二、2026 年浏览器支持现状

| 浏览器 | 支持版本 | 备注 |
| --- | --- | --- |
| Chrome / Edge | **113+**（2023-04 起，桌面默认开启） | Windows(D3D12) / macOS / ChromeOS(Vulkan)，实现基于 Dawn（C++） |
| Firefox | **141+**（Windows，默认开启） | macOS 145+/147+ 陆续跟进；实现基于 wgpu（Rust） |
| Safari | **26+**（默认开启） | macOS Tahoe / iOS / iPadOS / visionOS |
| 移动端 / Linux | 覆盖仍在扩展 | Android 需 121+ 且看 GPU 型号；Linux 需较新驱动；Windows ARM64 需开发者 flag |

全球可用率约 82%（caniuse 口径，桌面为主）。**WebGPU 规范**与 **WGSL 规范**当前均为 W3C **Editor's Draft**（编辑草案），尚未成为正式 Recommendation。本次调研中，MDN 总览页仍标注"非 Baseline"，但 GitHub 官方 gpuweb Implementation Status wiki、Chrome for Developers、web.dev 三个独立信源均确认三大浏览器桌面版已默认开启——两种口径并不矛盾，只是"标准文本状态"与"浏览器实现现状"的统计口径不同。稳妥表述：**2026 年三大浏览器桌面端已默认支持，处于 Baseline 边缘，移动端与非主流平台仍在补齐**。完整的信源交叉核实细节见[参考页易错点](./reference)。

WebGPU **不取代 WebGL**，而是长期并存：WebGL 覆盖率 96%+（含全部移动端与老旧设备），WebGPU 现阶段以现代桌面为主战场。完整选型对比见[性能与 WebGL 选型](./guide-line/performance-and-webgl)。

## 三、初始化链：从 `navigator.gpu` 到 canvas 配置

标准四步，**每一步都是异步 Promise 链**：

```javascript
// 1. 检测支持 + 拿到 GPU 入口对象
if (!navigator.gpu) {
  throw new Error("当前浏览器不支持 WebGPU");
}

// 2. 请求适配器（代表物理 GPU），可能返回 null
const adapter = await navigator.gpu.requestAdapter({
  powerPreference: "high-performance", // 或 "low-power"，undefined 表示不提示
});
if (!adapter) {
  throw new Error("未找到可用的 WebGPU 适配器");
}

// 3. 请求逻辑设备（消费掉 adapter，一个 adapter 只能成功 requestDevice 一次）
const device = await adapter.requestDevice({
  requiredFeatures: [], // 需要的可选特性，如 "texture-compression-astc"
  requiredLimits: {}, // 需要的限制值，超出 adapter.limits 会失败
});

// 4. 拿到 canvas 上下文并配置
const canvas = document.querySelector("canvas");
const context = canvas.getContext("webgpu");
const format = navigator.gpu.getPreferredCanvasFormat(); // "bgra8unorm" 或 "rgba8unorm"
context.configure({
  device,
  format,
  alphaMode: "premultiplied", // 或 "opaque"
});
```

四个关键细节：

1. `requestAdapter()` **不抛异常**，用 `null` 表示失败；`options.featureLevel` 可传 `"compatibility"` 请求兼容模式适配器（对齐 OpenGL ES 3.1 / Direct3D 11 的受限功能子集）。
2. **fallback adapter**（软件实现，兼容性更好但性能受限）应通过 `(await adapter.requestAdapterInfo()).isFallbackAdapter` 或 `device.adapterInfo.isFallbackAdapter` 获取——旧的 `adapter.isFallbackAdapter` 已弃用。
3. `requestDevice()` 对同一个 adapter **只能成功调用一次**：第二次调用会 reject 抛 `OperationError`（adapter 已被消费）；`requiredLimits` 超出适配器支持也会 `OperationError`；`requiredFeatures` 不受支持则抛 `TypeError`。
4. `getPreferredCanvasFormat()` 必须用来配置 canvas，否则可能因格式不匹配产生额外的纹理拷贝开销。

## 四、第一个三角形

有了 device 和已配置的 context，最小可见画面还需要三步：写 WGSL 着色器、建一个渲染管线、录制并提交一次渲染通道。

```javascript
// 1. WGSL 着色器：顶点位置硬编码在数组里，不需要顶点缓冲
const shaderModule = device.createShaderModule({
  code: `
    @vertex
    fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
      let pos = array(vec2f(0.0, 0.5), vec2f(-0.5, -0.5), vec2f(0.5, -0.5));
      return vec4f(pos[vertexIndex], 0.0, 1.0);
    }

    @fragment
    fn fs() -> @location(0) vec4f {
      return vec4f(1.0, 0.0, 0.0, 1.0); // 红色
    }
  `,
});

// 2. 渲染管线：layout "auto" 让 WebGPU 按着色器代码自动推导绑定布局
const pipeline = await device.createRenderPipelineAsync({
  label: "triangle pipeline",
  layout: "auto",
  vertex: { module: shaderModule, entryPoint: "vs" },
  fragment: {
    module: shaderModule,
    entryPoint: "fs",
    targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }], // 与 context.configure 用同一格式
  },
});

// 3. 每帧：录制一个渲染通道并提交
function frame() {
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(), // 每帧都要重新拿当前纹理
        clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });
  passEncoder.setPipeline(pipeline);
  passEncoder.draw(3); // 3 个顶点，对应着色器里硬编码的三角形
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);
}
frame();
```

这段代码故意省略了顶点缓冲、绑定组等内容——顶点坐标直接写死在 WGSL 的 `array(...)` 字面量里，靠 `@builtin(vertex_index)` 逐次取值，是官方教程里最小化认知负担的起手式。看到红色三角形，就说明初始化链、着色器、管线、命令提交这条主线全部打通了。接下来 [渲染管线与 WGSL](./guide-line/pipeline-and-wgsl) 会展开完整的 `GPURenderPipeline` 描述符（顶点缓冲布局、光栅化、深度模板、混合）与 WGSL 类型系统。
