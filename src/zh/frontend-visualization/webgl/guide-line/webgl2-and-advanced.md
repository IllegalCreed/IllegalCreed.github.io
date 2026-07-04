---
layout: doc
outline: [2, 3]
---

# WebGL2 新特性与进阶：FBO、性能与 vs WebGPU

> 基于 WebGL 1.0 / 2.0（2026 浏览器基线）· 核于 2026-07

## 速查

- **获取方式**：`canvas.getContext("webgl2")`；能力向后兼容，WebGL1 的 API/常量在 WebGL2 上下文里原样可用。
- **WebGL2 新特性一览**（详见下方总览表）：
  - GLSL ES 3.00（`in`/`out`）、VAO 原生、实例化绘制原生、多渲染目标原生（`drawBuffers`）
  - `texImage3D`/纹理数组、UBO（Uniform 缓冲对象）、变换反馈（Transform Feedback）
  - 采样器对象、查询对象、同步对象（`fenceSync`/`clientWaitSync`）
  - 非 2 次幂纹理无限制、`UNSIGNED_INT` 索引原生、深度纹理标准化、多重采样渲染缓冲
  - `texelFetch()`/`textureSize()` 纹理直读查询、内置矩阵函数 `inverse()`/`transpose()`、着色器循环边界更自由
- **FBO 渲染到纹理四步**：`createFramebuffer` → `bindFramebuffer` → 挂一张纹理当颜色附件（`framebufferTexture2D`）→ 之后 `drawArrays`/`drawElements` 的结果写入该纹理而非屏幕 → 用完 `bindFramebuffer(FRAMEBUFFER, null)` 切回默认帧缓冲。
- **FBO 用途**：渲染到纹理（阴影贴图、镜面反射）、后处理（先渲染到 FBO 纹理，再用铺满屏幕的四边形 + 后处理片元着色器二次采样实现全屏滤镜）、多渲染目标 MRT（`drawBuffers()` 一次绘制同时输出多张纹理，延迟渲染管线的基础）。
- **UBO 减少调用开销**：Uniform 缓冲对象一次性打包上传一组 uniform，减少多次 `uniform*fv` 调用开销，且多个 program 可共享同一个 UBO。
- **采样器对象解耦**：Sampler Object 把纹理数据与采样参数（wrap/filter）解耦，同一张纹理可配不同 sampler 用不同方式采样，无需为每种采样方式复制纹理。
- **查询对象做遮挡剔除**：Query Object 可做遮挡查询（occlusion query），GPU 异步返回"某组绘制是否有像素实际通过深度测试"，用于遮挡剔除优化。
- **变换反馈 vs 计算着色器**：Transform Feedback（WebGL2）仍是"顶点着色器 + 光栅化管线"的旁路复用；compute shader（WebGPU 独有）是完全独立于渲染管线的通用计算模型——这是 WebGL2 的 GPGPU 能力"有限逼近"而非"原生支持"的根本原因。
- **性能核心目标三条**：
  - 减少 draw call：合批、退化三角形拼接、实例化替代循环调用
  - 减少状态切换：按材质/纹理排序绘制顺序，多图打包进纹理图集（texture atlas）
  - 顶点着色器算的东西不要放片元着色器：片元执行次数远高于顶点，通常数十到数百倍
- **避免 CPU-GPU 同步点**：`getError()`/`readPixels()`/`finish()` 会强制 CPU 等待 GPU 完成当前所有排队命令，渲染循环里高频调用会让本该并行的流水线变成串行，帧率断崖式下跌。
- **location 缓存**：`getUniformLocation()`/`getParameter()` 应在初始化阶段缓存，不要放渲染循环里重复查询。
- **调试工具**：`gl.getShaderInfoLog()`/`gl.getProgramInfoLog()` 看编译/链接错误是第一步；`gl.getError()` 离线排查用（不放热路径）；Spector.js（浏览器扩展）可逐帧抓取 WebGL 调用记录并可视化每一步渲染状态，是排查"画面不对但代码看起来没错"问题的关键工具。
- **GPU 资源释放**：不再使用的 buffer/texture/program/framebuffer 要显式 `deleteBuffer`/`deleteTexture`/`deleteProgram`/`deleteFramebuffer`——WebGL 没有自动垃圾回收 GPU 资源，长时间运行的 SPA 反复创建/销毁场景会显存泄漏直至上下文丢失。
- **上下文丢失**：`webglcontextlost` 事件需 `preventDefault()` 声明"我要处理恢复"，`webglcontextrestored` 里重建全部资源；真实设备上并非罕见（GPU 驱动崩溃、多标签页显存竞争、移动端切后台被系统回收显存）。
- **扩展机制**：`getExtension(name)`（不支持返回 `null`）/ `getSupportedExtensions()` 查询全部支持列表；WebGL1 常用扩展多数在 WebGL2 里转正为核心 API。
- **上下文丢失测试**：`gl.getExtension("WEBGL_lose_context").loseContext()`/`.restoreContext()` 可在开发环境模拟丢失/恢复，验证恢复逻辑是否正确。
- **WebGL vs WebGPU**：MDN 定性 WebGPU 为 WebGL 的"继任者"——WebGL 基于已停止演进的 OpenGL ES 2.0、不支持通用 GPU 计算；WebGPU 原生对接 Direct3D 12/Metal/Vulkan，提供计算着色器；三大引擎已 2025 年内全部完成首发，但截至 2026 仍处 Baseline "Newly" 阶段（预计 2028 年前后到 Widely），是过渡期共存关系而非替代当天生效。
- **Three.js 佐证**：自 r171 起支持 `WebGPURenderer` 且自动回退 WebGL2，反映的正是"选型不是二选一，而是渐进增强"的行业现状。
- **WebGPU 现状数据**：caniuse 显示 WebGPU 全球约 82% 可用（三引擎均已首发，但仍受平台/渠道差异影响）；对比之下 WebGL2 已是 94.44% 可用。
- **进阶顺序**：本页 → [参考](../reference) 查完整 API/GLSL/常量速查表。

## 一、WebGL2 新特性总览

WebGL2 基于 OpenGL ES 3.0，获取方式是 `canvas.getContext("webgl2")`；能力上完全向后兼容 WebGL1（WebGL1 的 API、常量在 WebGL2 上下文里原样可用）。下表是两代能力/语法的全景对照：

| 特性 | WebGL1 | WebGL2 |
| --- | --- | --- |
| GLSL 版本 | ES 1.00（`attribute`/`varying`/`gl_FragColor`） | ES 3.00（`in`/`out`，需 `#version 300 es`） |
| VAO | 扩展 `OES_vertex_array_object` | 原生 `createVertexArray` |
| 实例化绘制 | 扩展 `ANGLE_instanced_arrays` | 原生 `drawArraysInstanced` |
| 多渲染目标 | 扩展 `WEBGL_draw_buffers` | 原生 `drawBuffers` |
| 3D 纹理/纹理数组 | 不支持 | `texImage3D`/`TEXTURE_2D_ARRAY` |
| Uniform 缓冲对象 UBO | 无 | `bindBufferBase(UNIFORM_BUFFER, …)`，一次上传多个 uniform |
| 变换反馈 Transform Feedback | 无 | 顶点着色器输出可写回 buffer，跳过光栅化 |
| 采样器对象 Sampler | 无 | 采样参数与纹理数据解耦，一张纹理配多种采样方式 |
| 查询对象 Query | 无 | 遮挡查询等 GPU 异步查询 |
| 同步对象 Sync | 无 | `fenceSync`/`clientWaitSync` |
| 非 2 次幂纹理 | 受限（禁 mipmap/REPEAT） | 完全支持 |
| 索引类型上限 | `UNSIGNED_SHORT`（超限需扩展） | 原生 `UNSIGNED_INT` |
| 纹理直读/查询 | 无 | `texelFetch()` 按整数坐标直读，`textureSize()` 查询尺寸 |
| 内置矩阵函数 | 无（需 uniform 传入） | GLSL 内置 `inverse()`/`transpose()` |
| 着色器循环 | 需常量表达式边界 | 循环边界更自由 |
| 深度纹理 | 扩展 `WEBGL_depth_texture` | 标准化 |
| 多重采样渲染缓冲 | 无 | `renderbufferStorageMultisample()` |

## 二、帧缓冲 FBO 与离屏渲染

默认情况下绘制结果直接进屏幕，但很多效果需要先"画到一张纹理上"：

```javascript
const framebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

const targetTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, targetTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);

// 之后 drawArrays/drawElements 的结果画进 targetTexture 而非屏幕
gl.bindFramebuffer(gl.FRAMEBUFFER, null); // 用完切回默认帧缓冲(屏幕)
```

典型用途三类：

- **渲染到纹理**：阴影贴图、镜面反射——先把场景从另一个视角渲染进一张纹理，再在正式渲染时采样这张纹理。
- **后处理**：先渲染到 FBO 纹理，再画一个铺满屏幕的四边形，配一个后处理片元着色器对这张纹理做二次采样，实现模糊、色调映射等全屏滤镜。
- **多渲染目标 MRT**：WebGL2 的 `drawBuffers()` 支持一次绘制同时输出多张纹理（比如同时输出颜色、法线、深度），是延迟渲染（deferred shading）管线的基础设施——WebGL1 需要 `WEBGL_draw_buffers` 扩展。

## 三、性能与调试

**减少 draw call** 是首要优化目标：合批（单次 `drawArrays`/`drawElements` 画多个对象）、用退化三角形拼接不连续图形、实例化替代循环调用。其次是**减少状态切换**（纹理绑定、着色器切换代价不低），按材质/纹理排序绘制顺序，多张小图打包进图集（texture atlas）减少纹理绑定次数。

一条贯穿全程的性能铁律：**顶点着色器算的东西不要放片元着色器**，因为片元着色器的执行次数远高于顶点着色器（通常数十到数百倍）。

三类容易被忽视的性能坑：

- **CPU-GPU 同步点**：`getError()`/`readPixels()`/`finish()` 会强制 CPU 等待 GPU 完成当前所有排队命令，渲染循环里高频调用会让本该并行的 CPU/GPU 流水线变成串行，帧率断崖式下跌——`getError()` 应该离线排查时用，不要放进热路径。
- **重复查询 location**：`getUniformLocation()`/`getAttribLocation()`/`getParameter()` 都有查表开销，应该在初始化阶段缓存，不要放渲染循环里重复查询。
- **GPU 资源不释放**：buffer/texture/program/framebuffer 不再使用时若不显式 `deleteBuffer`/`deleteTexture`/`deleteProgram`/`deleteFramebuffer`，显存不会自动垃圾回收——长时间运行的 SPA（反复创建/销毁 WebGL 场景，比如路由切换）会显存泄漏直至上下文丢失。

调试的第一步永远是 `gl.getShaderInfoLog()`/`gl.getProgramInfoLog()` 看编译/链接错误；更深层的"画面不对但代码看起来没错"问题，Spector.js（浏览器扩展）能逐帧抓取全部 WebGL 调用记录并可视化每一步的渲染状态，是排查这类问题的关键工具。

## 四、上下文丢失与扩展机制

GPU 驱动崩溃、多标签页显存竞争、移动端切后台被系统回收显存，都可能导致 WebGL 上下文丢失——这在真实设备上并不罕见，生产级引擎必须处理：

```javascript
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault(); // 阻止默认行为，声明"我要处理恢复"
  // 停止渲染循环
});
canvas.addEventListener("webglcontextrestored", () => {
  // 重新创建全部 buffer/texture/program/framebuffer，再恢复渲染循环
});
// 测试用：模拟丢失/恢复
gl.getExtension("WEBGL_lose_context").loseContext();
gl.getExtension("WEBGL_lose_context").restoreContext();
gl.isContextLost(); // 随时检测当前上下文是否已丢失
```

**不处理的后果**：若未监听 `webglcontextlost` 并 `preventDefault()`、未在 `webglcontextrestored` 里重建所有资源，页面会永久黑屏且没有任何报错提示。

扩展机制：`getExtension(name)` 返回扩展对象（不支持返回 `null`），`getSupportedExtensions()` 查询当前环境支持的全部扩展列表。WebGL1 时代的常用扩展，多数在 WebGL2 里转正为核心 API（`OES_vertex_array_object` → 原生 VAO，`ANGLE_instanced_arrays` → 原生实例化绘制，`WEBGL_depth_texture` → 标准深度纹理）。检测扩展时应该写容错分支（规范名 + 历史前缀名兜底），不能假设某个扩展一定存在。

## 五、WebGL vs WebGPU：现状与选型

MDN 等官方信源把 WebGPU 定性为 WebGL 的**"继任者"（successor）**：WebGL 基于已经停止演进的 OpenGL ES 2.0，且不支持通用 GPU 计算（GPGPU）；WebGPU 原生对接 Direct3D 12/Metal/Vulkan，提供计算着色器（compute shader）与更现代的绘制命令模型。

**时间线**（web.dev 官方博客与 Wikipedia 独立互证一致）：Chrome/Edge 113（2023-04）最早支持 WebGPU；Safari 26（2025-06）、Firefox 141/145（2025 年中）相继补齐——三大浏览器引擎已在 **2025 年内全部完成首发**。但按 Baseline 规则，"三引擎最新稳定版均支持"只是到达"Newly available"，离"Widely available"（需要约 2.5 年的窗口期）预计还要到 **2028 年前后**；caniuse 数据显示全球约 82% 可用，但存在平台差异（如部分渠道/Linux 滞后）。

**这不是"WebGL 已废弃"**：web.dev 与 Khronos 都强调这是演进/共存关系，而非立即替代。最有力的行业佐证是 Three.js 自 r171 起支持 `WebGPURenderer`，且**自动回退 WebGL2**——生产项目现阶段普遍是双轨并存，而不是二选一。

选型口径：

- **计算密集型**（点云处理、AI 推理、物理模拟）、追求最新能力且能接受兜底 WebGL 的项目，可以关注 WebGPU。
- **现阶段生产项目的主力仍是 WebGL**（或更上层的 Three.js/Babylon.js），WebGPU 更多是"渐进增强"的第二选项，而不是默认起点。
- 变换反馈（transform feedback，WebGL2）与计算着色器（compute shader，WebGPU 独有）的本质区别：前者仍是"顶点着色器 + 光栅化管线"的旁路复用，后者是完全独立于渲染管线的通用计算模型——这正是 WebGL2 的 GPGPU 能力"有限逼近"而非"原生支持"的根本原因。

---

至此 WebGL 的核心地图走完了：管线与着色器、缓冲区与绘制、纹理与变换、WebGL2 与进阶。完整的 API、GLSL 关键字、常量速查表在[参考](../reference)。
