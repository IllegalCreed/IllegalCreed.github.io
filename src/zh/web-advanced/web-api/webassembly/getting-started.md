---
layout: doc
outline: [2, 3]
---

# 入门：定位、第一次加载运行与心智模型

> 基于 WebAssembly 3.0（2025-09 定稿）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：WebAssembly（Wasm）是**在浏览器中以接近原生性能运行的低层类汇编语言**——紧凑二进制格式，为 C/C++、Rust 等语言提供 Web 编译目标（MDN 原话定义）。
- **不是 JS 替代品**：官方设计目标是 **complement and run alongside JavaScript**——JS 管表达力/DOM/胶水，Wasm 管计算密集重活，二者经 JS API 双向调用。
- **四大核心概念**：**Module**（已编译的无状态代码，可共享可多次实例化）、**Instance**（有状态的可执行实例，持有 `exports`）、**Memory**（线性内存，`buffer` 属性是 ArrayBuffer）、**Table**（存函数引用等不透明值的可增长数组）。
- **标准加载姿势**：`WebAssembly.instantiateStreaming(fetch("x.wasm"), importObject)`——抓取、编译、实例化一步到位，边下载边编译。
- **MIME 门槛**：流式 API 要求响应头 `Content-Type: application/wasm`，不满足直接抛 TypeError；老服务器不配 MIME 时回退 `arrayBuffer()` + `instantiate()` 路线。
- **importObject 两级命名空间**：模块声明 `(import "console" "log" …)`，JS 侧就要提供 `{ console: { log } }`；缺失或类型不匹配抛 LinkError。
- **exports 出口**：`instance.exports.fn()` 调函数、`instance.exports.memory.buffer` 读内存、`instance.exports.table.get(i)` 取表项。
- **线性内存**：以**页（64KiB）**为单位分配与增长，对 JS 暴露为 ArrayBuffer，用 TypedArray/DataView 视图读写——这是 JS↔Wasm 传大块数据的唯一正道。
- **数字直通、字符串不通**：`i32`/`f64` 等数值参数可直接传；字符串/对象必须经编解码（TextEncoder/TextDecoder）+ 线性内存复制，或靠 wasm-bindgen 等胶水自动封送——**跨边界成本是 WASM 收益的天花板**。
- **适用场景**：音视频编解码（FFmpeg.wasm）、图像处理（Photoshop Web）、设计工具引擎（Figma）、3D 地理数据（Google Earth）、物理仿真、加密压缩、**复用存量 C/C++/Rust 库**。
- **不适用场景**：DOM 操作密集的常规 UI、高频小函数调用（边界开销吃掉收益）、瓶颈在网络 IO 的应用；GPU 并行渲染归 [WebGPU](/zh/frontend-visualization/webgpu/)。
- **文本格式 WAT**：`.wat` 是 S-表达式写法的人类可读形式，与二进制 `.wasm` 一一对应，wabt 工具集的 `wat2wasm` 负责互转；Wasm 是**栈机模型**（指令压栈/出栈）。
- **工具链三主线**：Emscripten（C/C++，最成熟）、Rust wasm-bindgen + wasm-pack（前端生态融合最好）、AssemblyScript（TS 语法子集，门槛最低）；Kotlin/Dart 等 GC 语言靠 WasmGC 落地。
- **支持现状**：核心 JS API 自 **2017-10 达 Baseline Widely available**；**Wasm 3.0 于 2025-09-17 定稿**，主流浏览器已 shipping（详见 [Wasm 3.0 与前沿](./guide-line/wasm3-and-frontier)）。
- **Worker 一句话**：`.wasm` 同样能在 Web Worker 中编译运行，编译好的 Module 还可经 `postMessage()` 共享给 Worker，把重计算整体挪出主线程。
- **ESM 集成未落地**：MDN 原话 "not yet integrated with `<script type="module">` or `import` statements"——目前不能 `import` 直接加载 wasm，须手动 fetch。
- **进阶顺序**：本页 → [模块模型与线性内存](./guide-line/module-and-memory) → [JS API 全解](./guide-line/js-api) → [工具链与互操作](./guide-line/toolchains-interop) → [Wasm 3.0 与前沿](./guide-line/wasm3-and-frontier) → [参考](./reference)。

## 一、定位：JS 的配套加速器，不是替代品

MDN 给 WebAssembly 的定义是三个关键词的组合：**低层类汇编语言**（low-level assembly-like language）、**紧凑二进制格式**（compact binary format）、**接近原生的性能**（near-native performance）。它让 C/C++、Rust、C# 这样的语言拥有了一个 Web 编译目标——过去只能跑在桌面端的重型代码（视频编解码器、物理引擎、CAD 内核），编译成 `.wasm` 后就能直接在浏览器里运行。

但要建立的第一个正确认知是：**WebAssembly 从设计之初就不打算取代 JavaScript**。官方设计文档的原话是 "designed to complement and run alongside JavaScript"——互补、并肩运行。具体分工：

- **JS 擅长的**：DOM 操作、事件处理、网络请求、灵活的动态逻辑、生态胶水——这些 Wasm 一概做不了（它没有任何直接访问浏览器 API 的能力）。
- **Wasm 擅长的**：CPU 密集的纯计算——编解码、图像卷积、物理求解、加密哈希。这类代码在 JS 引擎里会遭遇"解析成本 + JIT 预热 + 随时可能去优化"的性能不确定性，而 Wasm 二进制在下载时就能流式编译成机器码，性能曲线平直可预期。

两者通过 WebAssembly JS API 双向打通：JS 加载并实例化 Wasm 模块、调用其导出函数；Wasm 通过导入调用 JS 提供的函数。MDN 总结这种协作是"在同一个应用里同时享受 Wasm 的性能与 JS 的表达力——即使你根本不会手写 WebAssembly"。

真实世界的落地实证都遵循这个分工：**FFmpeg.wasm**（在浏览器里转码音视频）、**Photoshop Web**（C++ 图像内核编译上 Web）、**Figma**（C++ 渲染与文档引擎，UI 仍是 JS/TS）、**Google Earth**（C++ 地球渲染引擎）——无一例外都是"JS 做壳、Wasm 做核"。

## 二、第一次加载运行：从 WAT 到浏览器

### 1. 最小 Wasm 模块（WAT 文本格式）

`.wasm` 是二进制，人类可读的对应形式是 **WAT 文本格式**（`.wat`），用 S-表达式描述模块结构。一个"导入 JS 的 log、导出 add 函数"的最小模块长这样：

```wasm
(module
  ;; 导入：两级命名空间 "console" "log"，JS 侧必须提供同名结构
  (import "console" "log" (func $log (param i32)))

  ;; 导出：add 函数，两个 i32 入参，一个 i32 返回值
  (func (export "add") (param $a i32) (param $b i32) (result i32)
    local.get $a   ;; 把参数 $a 压入栈
    local.get $b   ;; 把参数 $b 压入栈
    i32.add)       ;; 弹出两个值，压入它们的和——Wasm 是栈机模型

  ;; 导出一个调用 JS log 的函数
  (func (export "logIt")
    i32.const 42   ;; 压入常量 42
    call $log))    ;; 调用导入的 JS 函数
```

用 [wabt 工具集](https://github.com/WebAssembly/wabt) 的 `wat2wasm` 把它编译成二进制：

```bash
# wabt（WebAssembly Binary Toolkit）提供 wat2wasm / wasm2wat 互转工具
wat2wasm add.wat -o add.wasm
```

日常开发中你几乎不会手写 WAT——它由 Emscripten/wasm-pack 等工具链生成（见[工具链与互操作](./guide-line/toolchains-interop)），但读懂 WAT 是理解模块结构、调试产物的基础技能，DevTools 反汇编视图展示的就是这种格式。

### 2. 加载运行（JS 侧，完整可跑）

```html
<script type="module">
  // importObject：为模块声明的 import 提供实现，结构必须对齐两级命名空间
  const importObject = {
    console: {
      log: (n) => console.log("Wasm 说：", n),
    },
  };

  // 首选加载方式：流式编译 + 实例化一步到位（边下载边编译，不落 ArrayBuffer）
  // 注意：响应的 Content-Type 必须是 application/wasm
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch("./add.wasm"),
    importObject,
  );

  // 通过 exports 调用 Wasm 导出的函数——数值参数直接传，无需任何转换
  console.log(instance.exports.add(1, 2)); // 3
  instance.exports.logIt(); // 控制台输出 "Wasm 说： 42"
</script>
```

两个第一次就该记住的细节：

- **`instantiateStreaming` 要求响应 MIME 为 `application/wasm`**，不满足会直接抛 TypeError。现代静态服务器（Vite、nginx 新版）默认已配好；遇到老服务器报错时，回退到 `fetch → response.arrayBuffer() → WebAssembly.instantiate(bytes, importObject)` 的非流式路线（详见 [JS API 全解](./guide-line/js-api)）。
- **目前不能用 `import` 语句直接加载 wasm**。MDN 原话："WebAssembly is not yet integrated with `<script type="module">` or `import` statements"——ESM 集成提案还在推进（见 [Wasm 3.0 与前沿](./guide-line/wasm3-and-frontier)），当下必须手动 fetch。

## 三、心智模型：双向边界、线性内存与成本模型

### 1. 四个对象的关系

第一次接触最容易混淆的是 Module 和 Instance 的分工，MDN 的定义值得逐字理解：

- **`WebAssembly.Module`**：**无状态**的已编译代码——"可以高效地与 Worker 共享（`postMessage()`），并被多次实例化"。类比：类 / 可执行文件。
- **`WebAssembly.Instance`**：Module 的**有状态**可执行实例，"包含所有导出的 WebAssembly 函数"。类比：进程 / 类的实例。
- **`WebAssembly.Memory`**：一块可增长的线性内存，`buffer` 属性就是 ArrayBuffer——**这是 Wasm 唯一能读写的数据世界**。
- **`WebAssembly.Table`**：存放函数引用等"不透明值"的可增长数组，支撑函数指针式的间接调用。

一次 `instantiateStreaming` 同时产出 `{ module, instance }`：日常只用 instance；module 留着可以缓存、发给 Worker、或再实例化出隔离的第二份状态。五大对象的完整拆解见[模块模型与线性内存](./guide-line/module-and-memory)。

### 2. 边界是双向的，也是有价的

Wasm 与 JS 之间存在一条清晰的**边界**，穿越它的方式只有两种：

1. **JS → Wasm**：调用 `instance.exports` 上的导出函数。
2. **Wasm → JS**：调用经 `importObject` 注入的导入函数。

数值类型（`i32`/`f32`/`f64`，`i64` 对应 JS BigInt）可以直接穿越边界；**其他一切——字符串、数组、对象——都不能直接传**。大块数据的正道是写进线性内存（JS 侧用 TypedArray 视图 + TextEncoder 编码写入，Wasm 侧按指针+长度读取），或者交给 wasm-bindgen 这类胶水工具自动封送。每次穿越边界都有调用开销，每次传字符串都有"编码 → 复制 → 解码"三重成本。

由此得出 WASM 的**收益公式**：

> 收益 = 计算加速赚到的时间 − 跨边界调用与数据复制花掉的时间

**计算密集 + 边界交互少**（一次传入大块数据、内部算很久、一次传回结果）才是正收益场景；"每帧调用几千次小函数"这种高频细粒度交互，边界成本会把加速收益吃光甚至倒亏——这也是"用了 WASM 反而更慢"的头号原因（成本细节与决策清单见[工具链与互操作](./guide-line/toolchains-interop)）。

### 3. 沙箱与能力模型

Wasm 代码没有任何默认能力：不能碰 DOM、发请求、读时间——**一切外部能力都必须由 JS 经 importObject 显式授予**，它自己只能读写自己的线性内存。这个"最小权限 + 内存隔离"的沙箱模型是 Wasm 能安全运行不可信编译产物的根基，也解释了为什么"纯 Wasm 网页应用"目前不成立：没有 JS 胶水，它连 `console.log` 都做不到。

建立了"配套加速器、双向有价边界、线性内存、能力沙箱"这四个心智支点后，下一页深入五大对象与内存交互的全部细节：[模块模型与线性内存](./guide-line/module-and-memory)。
