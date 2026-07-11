---
layout: doc
outline: [2, 3]
---

# 工具链与互操作：Emscripten、Rust、AssemblyScript 与跨边界成本

> 基于 WebAssembly 3.0（2025-09 定稿）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **三大主线定性**：**Emscripten**（C/C++，历史最久、最成熟，POSIX/OpenGL 模拟层无可替代）、**Rust wasm-bindgen + wasm-pack**（类型安全封送、npm 产物，**与前端生态融合最好**）、**AssemblyScript**（TS 语法子集，前端上手门槛最低，性能与生态弱于前两者）。
- **GC 语言阵营**：Kotlin/Wasm、Dart（Flutter Web 的 Wasm 渲染模式）、Java/Scala/OCaml/Scheme——全部踩着 **WasmGC**（2024 末跨浏览器 Baseline）落地，不再自带 GC 实现。
- **Emscripten 一条命令**：`emcc hello.c -o hello.html`——产出 `.wasm` + **JS 胶水** + 可选 HTML 骨架；胶水负责加载、封送与 POSIX 模拟（文件系统/主循环）。
- **Emscripten 导出控制**：函数加 `EMSCRIPTEN_KEEPALIVE` 防 DCE 裁剪；JS 侧用 `Module.ccall("fn", 返回类型, 参数类型数组, 参数)` / `cwrap`（返回可复用函数）调用，字符串封送自动完成。
- **Rust 环境两件套**：`rustup`（装 rustc + cargo）+ `cargo install wasm-pack`；项目 `cargo new --lib`，**Cargo.toml 必须 `crate-type = ["cdylib"]`** + 依赖 `wasm-bindgen = "0.2"`。
- **`#[wasm_bindgen]` 双向**：标在 `extern "C"` 块上=导入 JS 函数给 Rust 调；标在 `pub fn` 上=导出 Rust 函数给 JS 调——字符串等类型的封送代码自动生成（MDN 原话：让 JS 能用 string 调 Rust API）。
- **wasm-pack 构建目标**：`wasm-pack build --target web`（浏览器原生 ESM，`import init` 后须 `await init()`）/ `--target bundler`（配 webpack/Vite 等打包器，默认值）——**target 选错是产物用不了的头号原因**。
- **pkg 产物五件**：`*_bg.wasm`（二进制）、`*.js`（胶水）、`*.d.ts`（类型声明）、`package.json`、README——直接 `npm i ../pkg` 当包用，用户无需装 Rust。
- **AssemblyScript**：`npm i assemblyscript` + `asc` 编译；写的是**带 `i32`/`f64` 显式类型标注的 TS 语法子集**，不是完整 TS——没有闭包上普通对象受限、无 JS 动态特性，别拿存量 TS 代码直接编。
- **字符串跨边界三重成本**：编码（TextEncoder）→ 复制进线性内存 → 解码（TextDecoder）——胶水工具只是**替你写**这段代码，成本本身不消失。
- **复杂类型两条路**：**序列化传值**（JSON/二进制编码进内存，双向复制）或 **句柄传引用**（对象留在一侧，对面只拿 id/externref 回调操作）——wasm-bindgen 导出的 Rust struct 走句柄路线，JS 侧长期持有需注意 `free()` 释放。
- **数值直通例外**：`i32`/`f32`/`f64` 零成本穿边界，`i64` ↔ BigInt（有装箱成本）；批量数据永远走"写内存 + 传指针"，不要循环传标量。
- **何时不值得用 WASM**：DOM 密集 UI（每次操作都要跨回 JS）、高频小函数调用（边界开销 &gt; 计算收益）、瓶颈在网络/渲染而非 CPU、纯胶水逻辑；GPU 并行归 [WebGPU](/zh/frontend-visualization/webgpu/)（本站已有整叶，此处不展开）。
- **决策一句话**：**"复用存量原生库" 与 "大块数据 + 长计算 + 少交互"是两大正当理由**；"觉得 JS 慢"不是——先 profile 确认瓶颈在 CPU 计算再动手。
- **产物体积意识**：Emscripten 默认胶水 + 运行时有固定开销（`-Os`/`MINIMAL_RUNTIME` 可压）；Rust 侧 `wasm-opt`、`wee_alloc`、LTO 是常规瘦身手段；AssemblyScript 产物天然小。
- **Go/.NET 一句话**：Go 官方支持 `GOOS=js GOARCH=wasm`（产物含完整运行时偏大，TinyGo 可瘦身）；.NET Blazor WebAssembly 走"运行时 + IL"路线——两者均偏"整框架上 Web"，与前端逐函数互操作的贴合度不如三大主线。

## 一、工具链格局：一张地图

手写 WAT 只是教学姿势，生产中 `.wasm` 全部来自编译器。选型地图按"你手里是什么代码/团队会什么语言"展开：

| 工具链 | 源语言 | 成熟度 | 前端生态融合 | 典型场景 |
| --- | --- | --- | --- | --- |
| **Emscripten** | C/C++ | 最高（十年+，Wasm 前身 asm.js 时代就存在） | 中（胶水风格自成一派） | 移植存量 C/C++ 库：FFmpeg、OpenCV、SQLite、游戏引擎 |
| **wasm-bindgen + wasm-pack** | Rust | 高（Rust 官方生态一等公民） | **最好**（npm 包产物、TS 类型声明、ESM） | 新写高性能模块、解析器、加密、图像处理 |
| **AssemblyScript** | TS 语法子集 | 中（社区驱动） | 好（npm 工作流原生） | 前端团队小步试水、中等强度计算 |
| **Kotlin/Wasm、Dart(Flutter)** | Kotlin / Dart | 快速成熟中 | 框架自带 | 整应用/整框架上 Web，依赖 WasmGC |

三条主线的详细拆解见下文；Go（`GOOS=js GOARCH=wasm`，产物含完整运行时偏大，TinyGo 是瘦身选项）与 .NET Blazor（运行时 + IL 解释/AOT）更偏"整个框架搬上 Web"，与"给前端补一块高性能模块"的贴合度较低，本页点到为止。

## 二、Emscripten：C/C++ 的最成熟路线

Emscripten 是 MDN 官方教程钦点的 C/C++ 路线，比 WebAssembly 标准本身还老（asm.js 时代就在）。它远不止一个编译器，而是**一整套 POSIX 环境模拟层**：虚拟文件系统、OpenGL→WebGL 转译、pthread→Worker 映射、主循环适配——这正是 FFmpeg、SQLite 这类重度依赖操作系统接口的库能"原样"上 Web 的原因。

```c
#include <emscripten.h>
#include <stdio.h>

// EMSCRIPTEN_KEEPALIVE：防止未被 main 引用的函数被死代码消除裁掉
EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
  return a + b;
}

int main() {
  printf("模块已加载\n"); // printf 经胶水映射到 console.log
  return 0;
}
```

```bash
# 产出 hello.wasm + hello.js（胶水）+ hello.html（可选骨架页）
emcc hello.c -o hello.html

# 常用瘦身/导出开关：优化体积 + 显式导出运行时辅助函数
emcc hello.c -Os -s EXPORTED_RUNTIME_METHODS=ccall,cwrap -o hello.js
```

JS 侧不直接碰 `instance.exports`，而是走胶水暴露的 `Module` 对象：

```javascript
// ccall：一次性调用——(函数名, 返回类型, 参数类型数组, 参数数组)
const result = Module.ccall("add", "number", ["number", "number"], [1, 2]);

// cwrap：包装成可复用的 JS 函数，签名只声明一次
const add = Module.cwrap("add", "number", ["number", "number"]);
add(3, 4); // 7
```

`ccall`/`cwrap` 对 `"string"`/`"array"` 类型会自动完成"编码 → 写线性内存 → 传指针 → 释放"的整套封送——方便，但别忘了封送成本仍在（见第六节）。

## 三、Rust：wasm-bindgen + wasm-pack，前端生态融合最好

Rust 路线的独特优势：无 GC 无重运行时（产物干净）、类型系统与所有权带来的封送安全、以及**产物直接是规范的 npm 包**。MDN 官方教程的完整流程：

```bash
# 环境两件套：rustup 装编译器与 cargo，再装 wasm-pack
cargo install wasm-pack

# 建库项目（注意是 --lib）
cargo new --lib hello-wasm
```

```toml
# Cargo.toml —— 两处必配
[lib]
crate-type = ["cdylib"]   # 编译为 C 风格动态库，Wasm 目标必需

[dependencies]
wasm-bindgen = "0.2"      # JS↔Rust 桥：类型封送代码生成器
```

```rust
use wasm_bindgen::prelude::*;

// 标在 extern 块上：声明"这些函数由 JS 提供"——导入方向
#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}

// 标在 pub fn 上：导出给 JS 调用——&str 参数的封送代码自动生成
#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name)); // Rust 调 JS 的 alert
}
```

`wasm-bindgen` 的职责就是 MDN 说的那句话：**"在 JS 与 Rust 的类型之间架桥——让 JS 能拿着 string 调 Rust API，让 Rust 函数能捕获 JS 异常"**。没有它，你只能收发裸数字。

```bash
# 浏览器原生 ESM 目标（无打包器直接用）
wasm-pack build --target web

# 打包器目标（webpack/Vite 等，默认值）
wasm-pack build --target bundler
```

构建做五件事（MDN 清单）：编译 Rust → 跑 wasm-bindgen 生成 JS 包装 → 建 `pkg/` 目录归置产物 → 由 Cargo.toml 生成 `package.json` → 复制 README。产物结构：

```
pkg/
├── hello_wasm_bg.wasm   # Wasm 二进制
├── hello_wasm.js        # JS 胶水（加载 + 封送）
├── hello_wasm.d.ts      # TypeScript 类型声明
└── package.json         # 直接可 npm 发布/安装
```

`--target web` 产物的使用方式（注意 **`init()` 必须先 await**——它内部才做 fetch + 实例化）：

```html
<script type="module">
  import init, { greet } from "./pkg/hello_wasm.js";

  init().then(() => {
    greet("WebAssembly"); // 弹出 "Hello, WebAssembly!"
  });
</script>
```

打包器场景则 `npm i ../pkg` 后直接 `import * as wasm from "hello-wasm"`（webpack 5 需开 `experiments.asyncWebAssembly: true`）。**使用方完全无感知 Rust 的存在**——这正是"前端生态融合最好"的含义：产物是标准 npm 包 + TS 类型 + ESM。

## 四、AssemblyScript：TS 语法子集的低门槛路线

AssemblyScript 让前端工程师用**熟悉的 TypeScript 语法**写 Wasm：`npm install assemblyscript` 起步，`asc` 编译，无需引入新语言。

```typescript
// assembly/index.ts —— 语法是 TS，但类型是 Wasm 的：i32/f64 显式标注
export function fib(n: i32): i32 {
  let a: i32 = 0,
    b: i32 = 1;
  for (let i: i32 = 0; i < n; i++) {
    const t = a + b;
    a = b;
    b = t;
  }
  return a;
}
```

必须建立的预期管理：

- **它是 TS 的语法子集，不是 TS**：静态类型收紧（`i32`/`u8`/`f64` 代替 number）、无 `any`/union 的动态花样、闭包与 JS 内建对象支持受限——**存量 TS 业务代码不能直接拿来编**。
- **性能与生态弱于 C++/Rust 路线**：自带轻量 GC 与运行时，优化器成熟度、可复用的库存量都有差距。
- **优势就是门槛与产物体积**：不用学新语言、npm 原生工作流、产物干净小巧——"前端团队想小步试水 Wasm 计算模块"的第一站。

## 五、WasmGC 阵营：Kotlin、Dart 与 Flutter Web

WasmGC（2024 末达跨浏览器 Baseline，详见 [Wasm 3.0 与前沿](./wasm3-and-frontier)）改变的是**语言级格局**：此前 GC 语言上 Wasm 要么自带一整个 GC 实现（体积灾难），要么绕道 JS；现在结构体/数组直接分配在**引擎托管堆**上，浏览器的 GC 替你收垃圾。官方公告点名的受益语言：**Java、OCaml、Scala、Kotlin、Scheme、Dart**。

前端视角最值得关注的两个落地：

- **Kotlin/Wasm**：Compose Multiplatform 的 Web 目标，KMP 共享业务逻辑直达浏览器。
- **Dart / Flutter Web**：Flutter 的 Wasm 渲染模式用 WasmGC 编译 Dart，替代此前"编译成 JS"的路线，性能与一致性显著改善。

这条路线的用户通常不直接操作 WebAssembly API——框架把加载、封送全包了；但判断"Flutter Web/Kotlin 上 Wasm 靠不靠谱"时，你现在知道底层支柱是 WasmGC 的 Baseline 状态。

## 六、跨边界成本：字符串与复杂类型的真实价格

工具链把封送代码自动生成了，但**成本不会因为代码是生成的就消失**。跨 JS↔Wasm 边界的价格分三档：

| 数据 | 传递方式 | 成本 |
| --- | --- | --- |
| `i32`/`f32`/`f64` | 直通 | ≈0（一次装箱都没有） |
| `i64` | ↔ BigInt | 低（BigInt 装箱） |
| **字符串** | 编码 → 复制进线性内存 → 解码 | **三重成本**，与长度线性相关 |
| **对象/结构体** | 序列化传值 或 句柄传引用 | 最高（序列化）或 每次操作一次跨界（句柄） |
| **大块二进制** | TypedArray 视图直写线性内存 | 一次复制（最优批量路径） |

两条工程结论：

- **接口设计决定成败**：同样的功能，"传一个 10MB 的 Uint8Array 进去、算完传回来"（两次复制）与"循环十万次、每次传一小段字符串"（十万次编解码）性能差几个数量级。**把边界调用设计成粗粒度、批量化**，是 Wasm 应用架构的第一原则。
- **句柄模式的生命周期责任**：wasm-bindgen 把导出的 Rust struct 表现为 JS 侧的句柄对象（数据留在线性内存），JS 长期持有时要注意调用生成的 `free()` 释放（新版 wasm-bindgen 借 FinalizationRegistry 兜底，但显式释放仍是确定性的做法）；反方向 `externref` 让 Wasm 持 JS 对象引用，同样只是"句柄"——每次实际操作都要回跨边界。

## 七、何时不值得用 WASM

反着列一张"别用"清单，比"能用"清单更防翻车：

- **DOM 密集的常规 UI**：Wasm 碰不到 DOM，每次更新都要跨回 JS——框架渲染逻辑放 Wasm 是负优化（Figma 也只把渲染引擎放 Wasm，UI 层是 TS）。
- **高频细粒度调用**：每帧几千次"传短字符串、算 1 微秒、返回"的模式，边界成本远超计算收益，纯 JS 更快。
- **瓶颈不在 CPU**：网络 IO、等待后端、首屏资源——Wasm 一个都救不了；GPU 并行渲染/通用计算是 [WebGPU](/zh/frontend-visualization/webgpu/) 的地盘（与 [WebGL](/zh/frontend-visualization/webgl/) 的性能对比本站有整叶，不在此展开）。
- **JS 引擎已经够快的热点**：现代 JIT 对单态、数值密集循环的优化非常强，几十行的热点函数先试 profile + 算法改进，收益常高于引入整条 Wasm 工具链。
- **团队没有对应语言储备**：为 20% 的性能引入 Rust/C++ 的招聘、评审、CI 成本，多数业务不划算——AssemblyScript 是这个矛盾下的折中项。

**正当理由始终是两个**：手里有**存量原生库**要上 Web（不用 Wasm 就是重写），或 profile 实证瓶颈在**大块数据的长计算**且交互可以粗粒度化。判断成立后，回头选一条工具链：C/C++ 库 → Emscripten；新写模块 → Rust；试水 → AssemblyScript。

工具链解决"怎么产出"，规范演进决定"能做到什么"——下一页盘点 2025-09 定稿的 Wasm 3.0 与更前沿的提案：[Wasm 3.0 与前沿](./wasm3-and-frontier)。
