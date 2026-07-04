---
layout: doc
outline: [2, 3]
---

# 性能、错误处理与 WebGL 选型

> 基于 WebGPU（2026 浏览器现状）· 核于 2026-07

## 速查

- **性能优势三来源**：管线预创建 + 编译期校验（减少运行时状态错误）、原生多线程命令录制（降低 CPU 提交开销）、WGSL 静态类型（更清晰的编译错误信息）。
- **错误体系**：`GPUError` 基类，派生 `GPUValidationError`（API 参数非法）、`GPUOutOfMemoryError`（显存不足）、`GPUInternalError`（实现内部错误）、`GPUPipelineError`（管线编译/创建失败）。
- **错误作用域**：`device.pushErrorScope(filter)` / `await device.popErrorScope()`，`filter` 可选 `"validation"`/`"out-of-memory"`/`"internal"`。
- **全局兜底**：`device.addEventListener("uncapturederror", handler)` 捕获未被任何 scope 捕获的错误。
- **使用建议**：加载用户提供的着色器/资源等"不可信输入"场景建议包 `pushErrorScope`；已充分测试的生产路径不必每次都包裹。
- **设备丢失**：`device.lost` 是一个 `Promise`，在驱动崩溃/标签页休眠回收等情况下 resolve，`reason` 区分 `"destroyed"`/`"unknown"`。
- **原生实现**：Chromium 系用 **Dawn**（C++）；Firefox 用 **wgpu**（Rust）；Safari 为自研实现。
- **Three.js**：自 r171 起 `WebGPURenderer` 标榜"生产可用"，换 import 即可切换，自动 fallback WebGL2；配套 **TSL** 一份代码同时编译到 WGSL 和 GLSL。
- **Babylon.js**：`WebGPUEngine`，同样是"渐进增强、自动降级 WebGL"路线。
- **坐标系差异（从 WebGL 迁移必查）**：WebGPU 裁剪空间 Z 范围 `0~1`（对齐 Metal/D3D），WebGL 是 `-1~1`（OpenGL 惯例）；WebGPU 帧缓冲/视口 **Y 轴向下**，WebGL **Y 轴向上**（但两者裁剪空间 Y 轴都向上，容易混淆）。
- **覆盖率对比（2026）**：WebGL(2) 96%+ 几乎全平台；WebGPU 约 82%，以现代桌面为主。
- **何时选 WebGPU**：现代桌面为主、需要 GPU 通用计算、追求更低 CPU 开销、能接受更陡学习曲线。
- **何时仍选 WebGL(2)**：需覆盖全平台/旧设备/旧浏览器、没有 compute 硬需求、团队没有余力应对更底层的资源管理。
- **折中方案（当前生态主流）**：Three.js（`WebGPURenderer` + TSL）/ Babylon.js（`WebGPUEngine`）等"WebGPU 优先、自动 fallback WebGL2"的封装库。
- **本页是本叶最后一站**：回到[参考](../reference)查完整 API/usage/浏览器支持速查表。

## 一、性能优势从哪里来

WebGPU 相对 WebGL 的性能优势不是单一改动，而是三处架构差异叠加的结果：

1. **管线预创建 + 编译期校验**：`GPURenderPipeline`/`GPUComputePipeline` 创建后不可变，驱动可以在创建时就把顶点布局、光栅化状态、着色器一次性编译优化好，不必像 WebGL 那样在每次 draw call 前重新校验一堆分散的全局状态。
2. **原生支持多线程命令录制**：多个 `GPUCommandEncoder` 可以在不同线程分别录制，最后统一 `submit()`——WebGL 的单线程状态机模型做不到这一点，CPU 提交命令容易成为瓶颈。
3. **WGSL 静态类型系统**：编译期就能发现类型不匹配等错误，错误信息比 GLSL 更清晰一致，减少"运行时才发现 shader 写错"的调试成本。

这三点也解释了[渲染管线与 WGSL](./pipeline-and-wgsl)里"管线创建后不可变"与[命令编码与计算](./commands-and-compute)里"录制与提交分离"这两条设计，本质上都是为了给驱动更大的提前优化空间。

## 二、错误处理与设备丢失

WebGPU 错误体系：`GPUError` 基类，派生 `GPUValidationError`（API 调用参数非法，行为在所有设备上一致可预测）、`GPUOutOfMemoryError`（显存不足）、`GPUInternalError`（实现内部错误）、`GPUPipelineError`（管线编译/创建失败）。

```javascript
// 方式一：错误作用域，主动包裹一段可能出错的调用
device.pushErrorScope("validation"); // 也支持 "out-of-memory" / "internal"
const sampler = device.createSampler({ maxAnisotropy: 0 }); // 非法值示例
const error = await device.popErrorScope();
if (error) {
  console.error(`验证错误: ${error.message}`);
}

// 方式二：全局兜底，监听未被任何 scope 捕获的错误
device.addEventListener("uncapturederror", (event) => {
  if (event.error instanceof GPUValidationError) {
    console.error("未捕获的验证错误:", event.error.message);
  }
});

// 设备丢失（如显卡驱动崩溃/标签页休眠回收）
device.lost.then((info) => {
  console.log(`设备丢失，原因: ${info.reason}`); // "destroyed" | "unknown"
});
```

使用建议：加载用户提供的着色器代码、处理用户上传的资源/配置等"不可信输入"场景建议包 `pushErrorScope`；格式良好、已充分测试的生产路径不需要每次都包裹，成本换收益不划算。

## 三、生态与实现：谁在用、怎么落地

- **原生实现**：Chromium 系用 **Dawn**（C++）；Firefox 用 **wgpu**（Rust，也是很多 Rust 生态 native/embedded 图形项目复用的库）；Safari 为自研实现。
- **Three.js**：自 r171 起 `WebGPURenderer` 标榜"生产可用"，切换只需换一个 import，且会自动 fallback 到 WebGL2；但社区与官方文档也承认该渲染器仍会有 breaking changes，谨慎团队会做充分验证后再上生产。配套的 **TSL（Three Shading Language）** 让开发者只写一份着色器逻辑，编译期分别产出 WGSL 和 GLSL 两份产物，是 Three.js 后续着色器开发的主推方式。
- **Babylon.js**：提供 `WebGPUEngine`，同样是"渐进增强、自动降级 WebGL"的产品化路线。
- **应用定位**：官方与教程都强调 WebGPU 是"低级 API"，直接手写等价于写图形引擎的地基层；实际产品开发中更常见的是"选一个封装好 WebGPU 的库"而不是从零手搓。

::: warning 从 WebGL 迁移最容易漏改的坐标系差异
WebGPU 裁剪空间（clip space）Z 范围是 `0~1`（对齐 Metal/D3D 惯例），WebGL 是 `-1~1`（OpenGL 惯例）；WebGPU 帧缓冲/视口 **Y 轴向下**（左上角为原点），WebGL **Y 轴向上**——但两者裁剪空间 Y 轴都是向上，容易和上一条混淆。投影矩阵、深度比较函数、纹理坐标翻转都要跟着调整，不能直接照搬 WebGL 项目里的矩阵计算代码。
:::

## 四、选型对比：vs WebGL；何时用 WebGPU

| 维度 | WebGL(2) | WebGPU |
| --- | --- | --- |
| 状态管理模型 | 全局可变状态机（`gl.bindBuffer`/`gl.enable`/`gl.blendFunc`），运行时生效、易漏设置 | 显式、不可变管线对象（创建时一次性打包），编译期校验 |
| 通用计算（GPGPU） | 无原生支持，只能用渲染管线"曲线救国"模拟计算 | 原生 `GPUComputePipeline` + compute shader，专为并行计算设计 |
| 着色语言 | GLSL（OpenGL ES Shading Language） | WGSL（静态类型，错误信息更清晰） |
| CPU 开销/多线程 | 单线程执行模型，所有 draw call/状态切换/资源上传顺序执行，CPU 容易成为瓶颈 | 支持多线程并行录制渲染命令，显著降低 CPU 开销 |
| 坐标系 | 裁剪空间 Z: `-1~1`；视口/帧缓冲 Y 轴向上 | 裁剪空间 Z: `0~1`；视口/帧缓冲 Y 轴向下（裁剪空间 Y 仍向上） |
| Mipmap/Sampler | `gl.generateMipmap()` 自动生成；采样参数隐式挂在纹理对象上 | 无自动 mipmap 生成 API，需手写；Sampler 必须显式创建 |
| 浏览器覆盖率（2026） | 96%+，几乎全平台全设备（含移动端、老旧设备） | 约 82%，以现代桌面 Chrome/Edge/Firefox/Safari 为主，移动端与 Linux 仍在补齐 |
| 生态成熟度 | 十余年积累，工具链/教程/兼容处理都非常成熟 | Three.js/Babylon.js 等已产品化支持，但官方仍提示可能有 breaking changes |
| 典型定位 | 兼容性优先、2D/轻量 3D、需要覆盖老旧设备与全平台的场景 | 现代桌面重度 3D 渲染、大规模粒子/物理模拟、GPU 通用计算（ML 推理/图像处理）、需要极致榨干多核 CPU+GPU 协同性能的场景 |

**何时选 WebGPU**：目标用户以现代桌面浏览器为主（不强依赖 Linux/老旧 Android）、需要 GPU 通用计算能力（compute shader 是刚需）、追求更低 CPU 开销与更大规模渲染物体数、愿意接受更陡的学习曲线和更多样板代码。

**何时仍选 WebGL(2)**：需要覆盖全平台（含旧设备、旧浏览器、覆盖长尾移动端）、项目对 GPU 通用计算没有硬需求、团队没有余力应对 WebGPU 更底层的资源管理心智负担。

**折中方案（当前生态主流实践）**：使用 Three.js（`WebGPURenderer` + TSL）/ Babylon.js（`WebGPUEngine`）等"WebGPU 优先、自动 fallback WebGL2"的封装库，兼顾未来性能上限与当下兼容性。

---

四篇指南到此完结。回到[参考](../reference)查 API/WGSL/usage 标志速查表与权威链接；对浏览器支持现状与信源交叉核实的完整细节感兴趣，也可以在参考页的易错点清单里找到。
