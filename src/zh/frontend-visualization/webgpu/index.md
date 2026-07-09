---
layout: doc
---

# WebGPU

WebGPU 是**浏览器原生的 W3C 标准 API**（不是第三方库），面向 Vulkan / Metal / Direct3D 12 等现代 GPU 设计，提供显式、可预测的图形渲染与通用计算（compute）能力。它是 WebGL 的**继任者**而非"WebGL 3.0"式升级——两者架构哲学完全不同：WebGL 是运行时可变的全局状态机，WebGPU 是创建后不可变、编译期校验的显式管线对象。核心能力只有两件事：「画三角形/点/线到纹理」和「在 GPU 上跑计算」。**2026 年现状**：Chrome/Edge（113+）、Firefox（141+，Windows）、Safari（26+）三大浏览器引擎桌面版均已默认开启，达到「newly available」量级，但 WebGPU/WGSL 规范本身仍是 W3C **Editor's Draft**、MDN 编辑口径也尚未标注 Baseline，移动端与 Linux 覆盖仍在补齐，不宜断言「已 widely available」。

## 评价

**优点**

- **管线预创建 + 编译期校验**：管线对象创建后不可变，错误在创建时就暴露，比 WebGL 运行时状态机更可预测
- **原生多线程命令录制**：降低 CPU 提交开销，大规模渲染物体数更从容
- **原生通用计算（compute shader）**：WebGL 时代只能拿渲染管线"曲线救国"模拟计算，WebGPU 原生支持，是最大差异化能力
- **WGSL 静态类型**：编译期报错信息比 GLSL 更清晰，语法风格更接近 Rust（`let`/`var`/`fn`/`struct`）
- **显式内存/资源管理**：性能上限更高、更可预测，代价是样板代码更多

**缺点**

- **心智负担陡增**：bind group、pipeline layout、内存对齐等大量样板代码，官方教程原话「如果只是想在屏幕上画点东西，用库更好」
- **生态仍处早期**：Three.js 官方也承认 `WebGPURenderer` 仍有 breaking changes，不建议无保留地直接上生产
- **移动端/Linux 覆盖不全**：跨端项目仍需 WebGL2 兜底

**2026 阶段性定位**：现代桌面重度图形/ML 推理/物理模拟等场景优先选型；跨端项目仍需 WebGL2 兜底；纯 2D UI 场景大多用不上。

## 本叶地图

- [入门](./getting-started) —— 定位（现代显式 GPU API vs WebGL）、2026 浏览器支持现状、初始化链 adapter → device → canvas configure、第一个三角形
- [渲染管线与 WGSL](./guide-line/pipeline-and-wgsl) —— WGSL 标量/向量/矩阵与入口点属性、GPURenderPipeline 完整描述符、与 WebGL 状态机的本质区别
- [绑定模型与资源](./guide-line/binding-and-resources) —— GPUDevice 资源工厂、Buffer/Texture/Sampler、BindGroupLayout/BindGroup/PipelineLayout、内存布局对齐
- [命令编码与计算](./guide-line/commands-and-compute) —— 命令录制提交范式、GPUComputePipeline、workgroup 并行设计、原子操作与竞态
- [性能与 WebGL 选型](./guide-line/performance-and-webgl) —— 性能优势原理、错误处理与设备丢失、vs WebGL(2) 完整选型对比
- [参考](./reference) —— API/WGSL/usage 标志速查表 + 权威链接

## 文档地址

- [MDN WebGPU_API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) —— 官方参考总览，含全部子接口
- [WebGPU Fundamentals](https://webgpufundamentals.org) —— 权威教程，从原理到实战

## 幻灯片地址

- <a href="/SlideStack/webgpu-slide/" target="_blank">WebGPU</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=webgpu" target="_blank" rel="noopener noreferrer">WebGPU 测试题</a>
