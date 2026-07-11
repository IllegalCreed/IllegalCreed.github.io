---
layout: doc
---

# Web Assembly

WebAssembly（Wasm）是一种**可在现代浏览器中运行的低层类汇编语言**：紧凑的二进制格式、接近原生的执行性能，为 C/C++、Rust、C# 等语言提供了 Web 编译目标。它的设计定位是**与 JavaScript 并肩运行、双向调用的"配套加速器"，而不是 JS 的替代品**——JS 负责表达力、DOM 与胶水逻辑，Wasm 负责计算密集的重活（FFmpeg.wasm、Photoshop Web、Figma、Google Earth 都是实证）。平台成熟度上，核心 JS API 自 **2017-10 起即达 Baseline Widely available**（四大浏览器全支持）；规范侧 **Wasm 3.0 已于 2025-09-17 正式定稿**——GC、memory64、多内存、尾调用、异常处理、relaxed SIMD 等一揽子特性，官方公告原话"已在多数主流浏览器 shipping"。其中 **WasmGC** 让 Java/Kotlin/Dart/Scala 等自带垃圾回收的语言可以复用浏览器引擎的 GC 直接上 Web，是 Wasm 诞生十年来最大的一次能力扩容。

## 评价

**优点**

- **接近原生的性能**：紧凑二进制 + 提前可优化的编译流水线，没有 JS 那种"解析—优化—去优化"的性能不确定性；SIMD、多线程（配合 SharedArrayBuffer）、尾调用等底层能力齐备
- **多语言编译目标**：C/C++（Emscripten）、Rust（wasm-bindgen/wasm-pack）、AssemblyScript（TS 语法子集）各有成熟工具链；WasmGC 定稿后 Java/Kotlin/Dart/Scala/OCaml/Scheme 等 GC 语言也能落地
- **安全沙箱模型**：代码只能访问自己的线性内存，一切外部能力（DOM、网络、时间）都必须经 `importObject` 显式注入，天然最小权限
- **与 JS 双向互操作**：JS 经 `instance.exports` 调 Wasm 函数，Wasm 经导入调 JS 函数，`WebAssembly.Memory` 直接以 ArrayBuffer 形态暴露给 JS 读写
- **可移植性**：同一份 `.wasm` 可跑在浏览器、Node.js、边缘计算与独立运行时（Wasmtime 等，配合 WASI），"编译一次，到处运行"在服务端生态同样成立
- **复用存量代码**：把久经考验的 C/C++/Rust 库（编解码器、物理引擎、加密库）搬上 Web，是 WASM 最高频、最划算的使用理由

**局限**

- **不能直接操作 DOM 与 Web API**：一切浏览器能力都要经 JS 胶水中转，"纯 Wasm 应用"目前不成立
- **跨边界成本是收益的天花板**：JS↔Wasm 调用本身有开销，数字之外的数据（字符串、对象）需要编解码与复制——计算密集 + 少交互才划算，高频小调用可能比纯 JS 更慢
- **产物体积与工具链心智成本**：Emscripten 会附带运行时胶水，GC 语言曾需自带 GC 实现（WasmGC 后好转）；团队需要掌握另一门语言与另一套构建链
- **调试体验弱于 JS**：DevTools 的 DWARF 源码级调试在进步，但断点、性能剖析的顺滑度仍不及原生 JS
- **平台整合尚有未竟事项**：ESM 集成（`import` 直接加载 wasm）仍在提案阶段，主流加载方式还是 `fetch` + `instantiateStreaming`；JSPI 在 Safari 尚未落地（Interop 2026 重点项）

一句话选型：**瓶颈在 CPU 计算、或手里有现成 C/C++/Rust 库要上 Web 时用 WASM**；瓶颈在 DOM/网络/渲染时它帮不上忙——大规模并行图形渲染归 [WebGPU](/zh/frontend-visualization/webgpu/)，常规 UI 逻辑继续交给 JS。

## 本叶地图

- [入门](./getting-started) —— 定位与适用边界（配套加速器而非替代品）、第一次加载运行（WAT → `instantiateStreaming`）、心智模型（双向边界与成本模型）
- [模块模型与线性内存](./guide-line/module-and-memory) —— Module/Instance/Memory/Table/Global 五大对象、TypedArray 视图读写、`grow` 增长与 buffer 失效、多内存与 memory64
- [JS API 全解](./guide-line/js-api) —— compile/instantiate 四个入口对比、流式编译与 MIME 门槛、importObject 与导入导出、三大错误类型、Module 缓存与共享
- [工具链与互操作](./guide-line/toolchains-interop) —— Emscripten、Rust wasm-bindgen/wasm-pack、AssemblyScript、WasmGC 语言阵营、字符串/复杂类型跨边界成本、何时不值得用 WASM
- [Wasm 3.0 与前沿](./guide-line/wasm3-and-frontier) —— 3.0 十大特性逐一拆解、WasmGC/memory64/异常处理/尾调用、JSPI、ESM 集成、组件模型与 WASI 展望
- [参考](./reference) —— JS API 速查表 + 特性支持矩阵 + 适用场景决策 + 易错点清单 + 资源链接

## 文档地址

[MDN WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly)

## GitHub 地址

[WebAssembly/spec](https://github.com/WebAssembly/spec)（规范仓库；早期设计讨论存档见 [WebAssembly/design](https://github.com/WebAssembly/design)）

## 幻灯片地址

<a href="/SlideStack/webassembly-slide/" target="_blank">Web Assembly</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=web-assembly" target="_blank" rel="noopener noreferrer">Web Assembly 测试题</a>
