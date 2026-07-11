---
layout: doc
outline: [2, 3]
---

# Wasm 3.0 与前沿：GC、memory64、JSPI 与组件模型

> 基于 WebAssembly 3.0（2025-09 定稿）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **Wasm 3.0 于 2025-09-17 正式定稿**（webassembly.org 官方公告，Andreas Rossberg 执笔）：十年来最大规模的版本，官方原话"已在多数主流浏览器 shipping"；上一版 Wasm 2.0（SIMD、批量内存、多返回值、简单引用类型）2025-03 才走完标准流程。
- **3.0 十大特性**：**GC**（引擎托管堆）、**memory64**（64 位寻址）、**多内存**（单模块多块内存）、**类型化引用**（`call_ref` 免检间接调用）、**尾调用**（栈不增长）、**异常处理**（`try_table` + `exnref`）、**relaxed SIMD**（放宽确定性的向量指令）、**确定性 profile**（可复现执行档）、**自定义注解语法**（文本格式注解）、**JS String Builtins**（Wasm 直接操作 JS 字符串）。
- **WasmGC 落地节奏**：Chrome 119（2023-10）→ Firefox 120 → Safari 18.2，**约 2024 末达跨浏览器 Baseline**——3.0 定稿前浏览器就已抢跑发货。
- **WasmGC 的意义**：Java/Kotlin/Dart/Scala/OCaml/Scheme 等 GC 语言**复用浏览器引擎的 GC**，不必自带 GC 实现——体积与性能双解；设计刻意低层（struct/array + 未装箱标量），高级语义留给编译器。
- **memory64**：地址从 `i32` 扩到 `i64`，理论 16EB；**Web 端上限 16GB**——浏览器场景的真实价值是打破 4GB 天花板。
- **多内存**：单模块多块内存 + 跨内存直接复制；用途：安全分区、多模块静态合并、插桩。
- **尾调用**：`return_call` 系指令让调用不长栈——函数式语言编译、状态机/解释器 dispatch 的刚需；Chrome 112 / Firefox 121 / Safari 18.2 已齐。
- **异常处理**：模块内声明**异常标签（tag）** 带载荷抛出、按 tag 选择性捕获，替代旧日"绕道 JS 异常"的高成本 workaround；JS 侧对应 `WebAssembly.Tag` / `WebAssembly.Exception`，**跨 JS↔Wasm 双向抛接**。
- **`WebAssembly.JSTag`**：内建 Tag，让 **JS 抛的异常能在 Wasm 内被识别捕获**——异常互操作的最后一块拼图。
- **JSPI 三件套**：`WebAssembly.Suspending`（把返回 Promise 的 JS 函数包成"可挂起导入"）+ `WebAssembly.promising()`（把 Wasm 导出包成返回 Promise 的 JS 函数）——**同步风格的 Wasm 代码可以挂起等待异步 JS**，C/C++/Rust 存量同步代码不必重写成回调。
- **JSPI 支持现状**：**Chrome 137+ / Firefox 139+ 已发；Safari 尚未支持**——Interop 2026 重点项，预期 2026 年内补齐；跨浏览器产品暂需 Asyncify（Emscripten 的代码变换方案）兜底。
- **JS String Builtins**：Wasm 经导入直接操作 `externref` 形态的 JS 字符串（比较/拼接/取长等内建），省去"复制进线性内存再编解码"——WasmGC 语言处理字符串的性能补丁。
- **ESM 集成（进行中）**：目标 `import` / `<script type="module">` 直接加载 `.wasm`（含 source phase imports 提案）；Chrome/Firefox 有原型，**当前主流仍是 fetch + `instantiateStreaming`**——别在生产依赖。
- **Branch Hinting**：给引擎标注分支冷热的编译提示，**2026 进入 Baseline**——少数"3.0 之后"完成收敛的提案之一。
- **确定性 profile**：为浮点 NaN、relaxed SIMD 等非确定性点位规定统一行为，服务区块链/可复现计算等场景——浏览器默认不启用该档。
- **组件模型 + WASI（浏览器外展望）**：WASI 提供系统接口（文件/网络/时钟）标准，组件模型定义跨语言组件的接口类型与组合——服务端/边缘 Wasm 的地基，**均不属于浏览器 3.0 范畴**。
- **SpecTec**：3.0 是首个用 SpecTec 工具链（机器可检查的形式化规范）产出的版本——规范本身的正确性也工程化了。
- **逐特性支持检测**：运行时用 [wasm-feature-detect](https://github.com/GoogleChromeLabs/wasm-feature-detect)，人肉查表用 [webassembly.org/features](https://webassembly.org/features/)（JS 渲染的活表）。

## 一、Wasm 3.0：十年来最大的一次版本

2025-09-17，WebAssembly W3C Community Group 与 Working Group 正式宣布 **Wasm 3.0 完成**。这不是"预览"或"草案"——公告原话是它"已在多数主流浏览器 shipping，Wasmtime 等独立引擎的支持也接近完成"。理解 3.0 的正确姿势是把它看作**对过去数年已陆续发货的提案的一次"定稿收编"**：GC 早在 2023-10 就上了 Chrome，尾调用、异常处理也都先于定稿发货——规范追认实现，是 Wasm 社区一贯的节奏（2.0 同样如此，2025-03 才走完流程）。

十大特性按主题分三组记忆：

| 主题 | 特性 | 一句话 |
| --- | --- | --- |
| **内存与数据** | GC、memory64、多内存 | 托管堆入场；4GB 天花板打破；单模块多地址空间 |
| **控制流与类型** | 尾调用、异常处理、类型化引用 | 栈不增长的调用；原生 throw/catch；`call_ref` 免运行时检查 |
| **数值与工程** | relaxed SIMD、确定性 profile、自定义注解、JS String Builtins | 性能换确定性的向量档；可复现执行档；文本格式注解；JS 字符串直操作 |

另一个里程碑藏在脚注里：3.0 是第一个用 **SpecTec** 工具链产出的标准——规范文本本身经过机器检查，"规范里有 bug"的概率被工程手段压低。

## 二、WasmGC：GC 语言上 Web 的转折点

3.0 里对语言格局影响最大的就是 **GC（garbage collection）提案**。它给 Wasm 增加了第二种存储：与线性内存并列的**引擎托管堆**——编译器声明 struct/array 类型（含未装箱的小整数），分配与回收全部交给宿主引擎的垃圾回收器。

**它解决的痛点**：此前 Java/Kotlin/Dart 这类语言上 Wasm，要么把整个 GC 运行时编译进产物（几 MB 起步、且与 JS 堆互不知情，跨堆循环引用可能泄漏），要么退而编译成 JS。WasmGC 之后，这些语言复用浏览器久经调优的 GC——**体积、性能、内存正确性三重收益**。官方公告点名的新阵营：**Java、OCaml、Scala、Kotlin、Scheme、Dart**；前端能直接感知的落地是 **Flutter Web 的 Wasm 渲染模式**与 **Kotlin/Wasm（Compose Multiplatform Web）**。

**它刻意不做的事**：WasmGC 保持低层——只有 struct/array 与子类型/递归类型这些"形状"，没有类、接口、虚表这些语言语义；MDN 与公告都强调"高层构造留给编译器实现"。所以它不是"Wasm 里写 Java"，而是"Java 编译器多了一个高质量后端"。

落地节奏（本站核实口径）：**Chrome 119（2023-10）→ Firefox 120（2023-11 前后）→ Safari 18.2（2024-12）**，即约 **2024 年末达成跨浏览器 Baseline**——今天面向现代浏览器可以直接按"可用"设计。

配套的**类型化引用**（typed function references）值得连带记住：引用类型不再只有笼统的 `funcref`/`externref`，而能精确描述"指向某签名函数"的引用，`call_ref` 指令据此做**无运行时签名检查的间接调用**——比 `call_indirect` 的查表+校验更快，也是 GC 语言虚调用的性能底座。

## 三、memory64 与多内存：地址空间的两次扩容

**memory64** 把内存与表的地址类型从 `i32` 升级为 `i64`：理论地址空间 16EB。注意公告里的关键限定——**Web 实现把 64 位内存的上限定在 16GB**（工程与安全权衡），所以浏览器场景的真实叙事是"4GB → 16GB"，让视频编辑、CAD、科学数据集这类大内存应用有了余量；完整的大地址红利属于服务端/独立运行时。使用侧注意 64 位内存的地址在 JS 边界以 BigInt 表达。

**多内存（multiple memories）**允许单个模块声明/导入多块内存并**直接跨内存复制数据**。公告点名三类用途：**安全分区**（把不可信数据/敏感数据与主内存物理隔离）、**工具链静态链接**（多个模块合成一个时各自保留内存）、**插桩检测**（观测数据放独立内存不污染被测对象）。此前"一个模块恰好一块内存"是刻在 MVP 里的限制，绕行方案（拆多模块）成本高昂。

## 四、异常处理与尾调用：控制流补课

**异常处理**：C++/Java/Kotlin 都有异常，此前编译到 Wasm 只能绕道 JS（抛接一次跨两次边界）或整段代码变换，公告称之为"既慢又难维护"的 workaround。3.0 原生方案：模块内声明**异常标签（exception tag）**，`throw` 携带载荷抛出，`try_table` 按 tag **选择性捕获**（新引用类型 `exnref` 承载异常）。JS 侧完全对称：

- `WebAssembly.Tag`：定义/引用异常标签；
- `WebAssembly.Exception`：可跨边界抛、接、再抛的异常对象——**Wasm 抛的异常 JS 能 catch 并读载荷，JS 构造的 Exception 也能扔回 Wasm**；
- `WebAssembly.JSTag`：内建标签，代表"JS 世界抛出的异常"——Wasm 侧据此捕获识别 JS 异常，补上互操作的最后一角。

注意与 trap 的边界：**trap（越界、除零、`unreachable`）不是异常，不可被 Wasm 的 catch 捕获**，只会浮到 JS 成 RuntimeError（见 [JS API 全解](./js-api)）。

**尾调用**：`return_call` / `return_call_indirect` 让处于尾位置的调用**复用当前栈帧**——递归深度不再受栈限制。受益者是函数式语言编译（Scheme/OCaml 的尾递归语义）、解释器与状态机的 dispatch 循环（互相尾跳转）。支持已齐：**Chrome 112 / Firefox 121 / Safari 18.2**，与 GC 同期完成 Baseline 收敛。

## 五、JSPI：同步风格代码等待异步 JS

**JSPI（JavaScript Promise Integration）**解决的是一个工具链级的老大难：C/C++/Rust 的存量代码是**同步风格**（`read() → 阻塞 → 返回`），而 Web 的 IO 全是 **Promise 异步**。过去的桥接方案 Asyncify 靠 Emscripten 做全量代码变换（体积 +50% 起、运行时开销可观）。JSPI 把这件事交给引擎：

```javascript
// 1. 把返回 Promise 的 JS 函数包成"可挂起导入"
const suspendingFetch = new WebAssembly.Suspending(async (ptr, len) => {
  const url = readString(ptr, len); // 从线性内存读出 URL
  const resp = await fetch(url); // 真异步
  return resp.status;
});

// 2. 注入后，Wasm 内部以"同步调用"的姿势调它——引擎在此处挂起整个 Wasm 栈
const { instance } = await WebAssembly.instantiateStreaming(fetch("app.wasm"), {
  env: { http_get: suspendingFetch },
});

// 3. 把导出函数包成 promising：JS 侧拿到的是返回 Promise 的普通异步函数
const main = WebAssembly.promising(instance.exports.main);
await main(); // Wasm 挂起期间主线程不被阻塞
```

心智模型：**Wasm 代码写起来是同步的，跑起来是异步的**——挂起/恢复由引擎在边界完成，源语言零改造。这对"把 sqlite、语言解释器、游戏引擎搬上 Web 且要做网络/文件 IO"是质变级能力。

支持现状（本站核实口径）：**Chrome 137+、Firefox 139+ 已正式发货；Safari 尚未支持**——它是 **Interop 2026 的重点项**，预期 2026 年内补齐。在此之前，需要覆盖 Safari 的产品仍得保留 Asyncify 退路或做双构建。

## 六、ESM 集成与 Branch Hinting：进行中的平台缝合

**ESM 集成**的目标是让 `.wasm` 成为模块图的一等公民：`import { fn } from "./mod.wasm"` 或 `<script type="module" src="mod.wasm">`，浏览器接管 fetch/编译/链接；配套的 **source phase imports** 提案则允许 `import source` 拿到编译好的 Module（不实例化，留给你自己注入 importObject）。现状：**Chrome/Firefox 有原型实现，规范仍在推进**——MDN 的加载指南至今写着"尚未与 `import` 集成"，**生产路径仍是 fetch + `instantiateStreaming`**。它落地后，Wasm 模块将吃到 ESM 的静态分析、打包器原生支持与预加载全家桶。

**Branch Hinting** 是个小而美的收尾：给引擎标注"这个分支大概率不走"（如错误路径），帮 AOT 编译器摆布热路径代码布局。按本站核实口径，它于 **2026 年进入 Baseline**——3.0 定稿后第一批完成跨浏览器收敛的提案。

## 七、组件模型与 WASI：浏览器之外的展望

浏览器内的故事之外，Wasm 的另一半野心在服务端与边缘——两块地基都不属于 3.0，但值得建立坐标：

- **WASI（WebAssembly System Interface）**：标准化的系统接口（文件、网络、时钟、随机数），让 `.wasm` 在 Wasmtime 等独立运行时里以能力安全（capability-based）的方式访问系统资源——"没有浏览器也能跑"的官方答案。
- **组件模型（Component Model）**：在核心 Wasm 之上定义**跨语言组件**的接口类型（字符串、record、variant 等高级类型）与组合方式——Rust 组件调 Go 组件不再需要手工对齐线性内存布局。它是 WASI 0.2+ 的地基，也是"Wasm 成为通用软件组件格式"愿景的承载体。

对前端工程师的现实意义：这两者短期不改变浏览器端的写法，但**边缘函数（Cloudflare Workers 一系）、插件系统（Envoy、Figma 插件式架构）、Serverless 冷启动**等场景里，你部署的很可能已经是 Wasm——浏览器学到的对象模型与边界思维原样适用。

规范全景到此收束。最后一页把全叶的 API、支持矩阵、决策与坑位压成一张速查大表：[参考](../reference)。
