---
layout: doc
outline: [2, 3]
---

# 参考：JS API 速查、特性矩阵与易错点

> 基于 WebAssembly 3.0（2025-09 定稿）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **定位**：低层类汇编语言 + 紧凑二进制 + 接近原生性能；**与 JS 互补而非替代**——JS 管 DOM/胶水，Wasm 管计算。
- **加载首选**：`WebAssembly.instantiateStreaming(fetch(url), importObject)`；MIME 必须 `application/wasm`，不符抛 TypeError，回退 ArrayBuffer 路线。
- **四入口**：`compile`/`compileStreaming`（→ Module）、`instantiate`/`instantiateStreaming`（→ 实例）；`instantiate` 双重载返回结构不同（字节 → `{module, instance}`；Module → 裸 Instance）。
- **五大对象**：Module（无状态可克隆）/ Instance（有状态持 exports）/ Memory（`buffer` = ArrayBuffer，页 64KiB）/ Table（引用数组）/ Global（跨界变量 `.value`）。
- **三大错误**：CompileError（解码/验证）→ LinkError（导入不匹配）→ RuntimeError（trap）；start 函数 trap 是 RuntimeError（唯一例外）；MIME 错是 TypeError。
- **内存铁律**：`grow()` 后旧 ArrayBuffer detach，**TypedArray 视图必须重建**；字符串走"TextEncoder → 写内存 → 传指针"，数值直通（`i64` ↔ BigInt）。
- **Wasm 3.0（2025-09-17 定稿）**：GC / memory64（Web 上限 16GB）/ 多内存 / 尾调用 / 异常处理 / 类型化引用 / relaxed SIMD / 确定性 profile / 自定义注解 / JS String Builtins——主流浏览器已 shipping。
- **关键 Baseline 三档**：核心 API 2017-10；WasmGC + 尾调用约 2024 末（Chrome 119/112、Firefox 120/121、Safari 18.2）；JSPI 未齐（Chrome 137+/Firefox 139+，**Safari 无**，Interop 2026 项）。
- **工具链三主线**：Emscripten（C/C++ 存量库）、wasm-pack + wasm-bindgen（Rust，npm 产物，前端融合最好）、AssemblyScript（TS 语法子集，低门槛）；GC 语言（Kotlin/Dart）踩 WasmGC。
- **决策一句话**：**存量原生库上 Web** 或 **大块数据长计算少交互** → 用；DOM 密集 / 高频小调用 / 瓶颈非 CPU → 不用；GPU 并行 → [WebGPU](/zh/frontend-visualization/webgpu/)。
- **ESM 集成未落地**：不能 `import` 直接加载 `.wasm`（提案进行中），生产仍用 fetch + streaming。
- **反射两把刀**：`WebAssembly.Module.imports(m)` / `exports(m)` 不实例化看清模块声明；`validate(bytes)` 同步验合法性。
- **跨线程**：Module 可 `postMessage()`（结构化克隆），Instance 不可；非 shared Memory 不可传，shared Memory 底层是 SharedArrayBuffer。
- **JSPI 三件套**：`Suspending`（异步 JS 包成可挂起导入）/ `promising()`（导出包成返 Promise）/ `JSTag`（Wasm 内识别 JS 异常）。
- **文本格式**：`.wat`（S-表达式）↔ `.wasm` 由 wabt 的 `wat2wasm`/`wasm2wat` 互转；栈机模型，两级命名空间导入。
- **支持检测**：运行时 [wasm-feature-detect](https://github.com/GoogleChromeLabs/wasm-feature-detect)；查表 [webassembly.org/features](https://webassembly.org/features/)。

## 一、JS API 速查表

### 静态方法

| 方法 | 签名要点 | 返回 | 备注 |
| --- | --- | --- | --- |
| `WebAssembly.compile(bytes)` | BufferSource | `Promise<Module>` | 只编译不实例化 |
| `WebAssembly.compileStreaming(source)` | Response 或其 Promise | `Promise<Module>` | 流式；MIME 须 `application/wasm` |
| `WebAssembly.instantiate(bytes, imports)` | 重载一：BufferSource | `Promise<ResultObject>` | ResultObject = `{ module, instance }` |
| `WebAssembly.instantiate(module, imports)` | 重载二：Module | `Promise<Instance>` | **返回结构与重载一不同** |
| `WebAssembly.instantiateStreaming(source, imports)` | Response 或其 Promise | `Promise<ResultObject>` | **首选加载 API**；MIME 同上 |
| `WebAssembly.validate(bytes)` | BufferSource | `boolean`（同步） | 只验证不编译 |
| `WebAssembly.promising(fn)` | Wasm 导出函数 | 返 Promise 的 JS 函数 | JSPI；Safari 未支持 |

### 对象与构造器

| 对象 | 关键成员 | 一句话 |
| --- | --- | --- |
| `WebAssembly.Module` | 静态 `Module.exports(m)` / `Module.imports(m)` / `Module.customSections(m, name)` | 无状态已编译代码；可结构化克隆给 Worker |
| `WebAssembly.Instance` | `exports`（冻结对象） | 有状态执行实例；一切出口所在 |
| `WebAssembly.Memory` | `buffer` / `grow(pages)` | 线性内存；页 = 64KiB；`{ initial, maximum, shared? }` |
| `WebAssembly.Table` | `get(i)` / `set(i, ref)` / `grow(n)` / `length` | 引用数组（`anyfunc`/`externref`）；支撑间接调用 |
| `WebAssembly.Global` | `value` / `valueOf()` | 跨界全局量；`{ value: 类型, mutable: 布尔 }` |
| `WebAssembly.Tag` | `new Tag({ parameters: [...] })` | 异常标签（声明异常"类型"） |
| `WebAssembly.Exception` | `is(tag)` / `getArg(tag, i)` | 跨界可抛接的结构化异常 |
| `WebAssembly.Suspending` | `new Suspending(asyncFn)` | JSPI：可挂起导入的包装 |
| `WebAssembly.JSTag` | （内建 Tag 实例） | 在 Wasm 内捕获识别 JS 异常 |

### 错误类型

| 错误 | 阶段 | 典型诱因 |
| --- | --- | --- |
| `WebAssembly.CompileError` | 解码/验证 | 字节损坏、不支持的指令、验证失败 |
| `WebAssembly.LinkError` | 实例化/链接 | importObject 缺项/种类不符/签名不合（start 函数 trap 除外） |
| `WebAssembly.RuntimeError` | 运行期 trap | 内存越界、除零、`unreachable`、`call_indirect` 签名不符 |
| `TypeError`（普通） | 流式加载 | MIME 非 `application/wasm`；`i64` 参数传了 Number |

## 二、特性支持矩阵

版本号为本站核实口径；标 ✓ 处表示主流引擎已 shipping 但精确版本以 [webassembly.org/features](https://webassembly.org/features/)（JS 渲染活表）与 MDN BCD 为准。

| 特性 | Chrome | Firefox | Safari | 状态（2026-07） |
| --- | --- | --- | --- | --- |
| 核心 MVP + JS API | 57 | 52 | 11 | **Baseline 2017-10 起 Widely available** |
| 固定宽度 SIMD（v128） | 91 | 89 | 16.4 | Baseline |
| 线程与原子（shared memory） | 74 | 79 | 14.1 | 可用（需跨域隔离环境） |
| 异常处理（旧版 catch） | 95 | 100 | 15.2 | 广泛可用 |
| 尾调用 | 112 | 121 | 18.2 | **Baseline（约 2024 末）** |
| **WasmGC** | **119**（2023-10） | **120** | **18.2** | **Baseline（约 2024 末）** |
| memory64 | ✓（2025 起） | ✓（2025 起） | ✓ | 3.0 定稿，主流已 shipping |
| 多内存 | ✓ | ✓ | ✓ | 3.0 定稿，主流已 shipping |
| 异常处理（`exnref`/`try_table` 新版） | ✓ | ✓ | ✓ | 3.0 定稿，主流已 shipping |
| relaxed SIMD | ✓ | ✓ | ✓ | 3.0 定稿，主流已 shipping |
| JS String Builtins | ✓ | ✓ | ✓ | 3.0 配套 JS API 扩展 |
| **JSPI** | **137+** | **139+** | **✗ 未支持** | **Interop 2026 重点，预期 2026 内补齐** |
| Branch Hinting | ✓ | ✓ | ✓ | 2026 进入 Baseline |
| ESM 集成 / source phase imports | 原型 | 原型 | ✗ | **提案进行中，生产勿依赖** |

## 三、适用场景决策

| 场景 | 判定 | 理由 |
| --- | --- | --- |
| 移植存量 C/C++/Rust 库（编解码、SQLite、物理引擎） | ✅ 首要正当理由 | 不用 Wasm 的替代方案是整库重写 |
| 音视频转码/图像处理/压缩加密（FFmpeg.wasm、Squoosh 类） | ✅ | 大块数据 + 长计算 + 粗粒度边界 |
| 重型应用内核上 Web（Photoshop Web、Figma、Google Earth） | ✅ | "JS 做壳、Wasm 做核"的实证路径 |
| GC 语言整栈上 Web（Flutter Web、Kotlin Multiplatform） | ✅（经 WasmGC） | 引擎托管堆，无需自带 GC |
| DOM 密集的常规 UI / 前端框架渲染层 | ❌ | Wasm 碰不到 DOM，每次都要跨回 JS |
| 高频细粒度小函数调用 | ❌ | 边界调用 + 字符串编解码成本吃掉收益 |
| 瓶颈在网络/后端/首屏资源 | ❌ | 提速的不是你的瓶颈 |
| 大规模并行图形渲染 / GPGPU | ❌ 转向 [WebGPU](/zh/frontend-visualization/webgpu/) | CPU 加速器解决不了 GPU 问题（对比见 [WebGL](/zh/frontend-visualization/webgl/) / WebGPU 两叶） |
| 几十行 JS 热点函数"感觉慢" | ⚠️ 先 profile | 现代 JIT 对数值循环很强，算法优化常更划算 |

## 四、易错点清单

- **MIME 不对流式必炸**：`instantiateStreaming` 遇到非 `application/wasm` 响应直接 TypeError——老版静态服务器/CDN 配置是重灾区；健壮代码 try/catch 回退 `arrayBuffer()` + `instantiate()`。
- **`instantiate` 双重载返回结构混淆**：传字节拿 `{ module, instance }`，传 Module 拿裸 Instance——对后者解构 `.instance` 得 undefined。
- **`memory.grow()` 后继续用旧视图**：非 shared 内存增长会 detach 旧 ArrayBuffer，缓存的 TypedArray 全部作废——用时现建视图，或每次增长后统一刷新；Wasm 侧代码内部触发的 grow 同样生效，坑更隐蔽。
- **`i64` 传 Number**：跨边界 `i64` 一律 BigInt，传 Number 抛 TypeError——`fn(42n)` 不是 `fn(42)`。
- **给字符串/对象走"直接传参"**：数值以外没有直通车——不经"编码 → 写内存 → 传指针"或胶水封送，字符串根本过不了边界。
- **高频小调用负优化**：每帧上千次"短字符串进出"的接口设计，Wasm 比纯 JS 慢——边界要粗粒度、批量化。
- **importObject 路径/种类不对齐**：模块声明 `(import "env" "log" …)` 就必须有 `importObject.env.log` 且种类匹配，缺失即 LinkError；先用 `Module.imports()` 反射查清单再写。
- **把 start 函数的 trap 当 LinkError 排查**：实例化时抛 RuntimeError 大概率是 start 函数内部 trap，不是链接问题——MDN 对 LinkError 的定义明确排除这一项。
- **指望 Wasm 的 catch 捕获 trap**：越界/除零/`unreachable` 是 trap 不是异常，异常处理提案的 `try_table` 不捕获 trap，它必然浮到 JS 成 RuntimeError。
- **期待 `import` 直接加载 wasm**：ESM 集成仍是提案 + 原型，打包器的 wasm import 是**打包器私有能力**（webpack `asyncWebAssembly` 等），别当成平台标准。
- **wasm-pack 构建目标选错**：`--target web` 的产物要 `await init()` 后才能调用；给打包器项目用了 web 目标（或反之）是"函数是 undefined"的高发原因。
- **拿存量 TS 直接喂 AssemblyScript**：它是带 `i32`/`f64` 标注的 TS 语法**子集**——闭包、union、JS 内建对象大量不可用，需按其类型系统重写。
- **wasm-bindgen 句柄忘释放**：导出的 Rust struct 在 JS 侧是句柄，长期持有场景应显式 `free()`（FinalizationRegistry 兜底不保证及时）。
- **在 Safari 生产依赖 JSPI**：Chrome/Firefox 已发但 Safari 未支持（Interop 2026 项）——跨浏览器产品需保留 Asyncify 退路或特性检测降级。
- **Worker 间传 Instance/Memory**：只有 Module 可结构化克隆；Instance 不可传，非 shared Memory 不可传——正确姿势是传 Module 各自实例化，或用 shared memory。
- **忘了 Wasm 没有任何默认能力**：连当前时间都要经导入注入——"模块里怎么拿不到 console/fetch"不是 bug，是沙箱模型本身。

## 五、工具链速查

| 维度 | Emscripten | wasm-pack + wasm-bindgen | AssemblyScript |
| --- | --- | --- | --- |
| 源语言 | C/C++ | Rust | TS 语法子集 |
| 安装 | emsdk | `cargo install wasm-pack` | `npm i assemblyscript` |
| 关键配置 | `EMSCRIPTEN_KEEPALIVE` 防裁剪、`-s EXPORTED_RUNTIME_METHODS` | `crate-type = ["cdylib"]` + `wasm-bindgen = "0.2"` | `asconfig.json` |
| 构建命令 | `emcc x.c -o x.html` | `wasm-pack build --target web/bundler` | `asc assembly/index.ts` |
| JS 调用面 | 胶水 `Module.ccall`/`cwrap` | pkg 包 `import init, { fn }`，先 `await init()` | ESM 导出 + loader |
| 封送 | ccall/cwrap 自动处理 string/array | `#[wasm_bindgen]` 生成，双向类型安全 | 基础类型 + loader 辅助 |
| 强项 | POSIX/OpenGL 模拟层，存量库移植 | npm 产物 + `.d.ts`，前端融合最好 | 零新语言门槛，产物小 |
| 弱项 | 胶水体积与风格自成一派 | 需 Rust 团队储备 | 性能与生态弱于前两者 |

## 六、权威链接

- [MDN WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly) —— 概念、指南与 JS API 参考的主文档信源
- [MDN：Loading and running](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Loading_and_running) ｜ [JS interface 参考](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface) ｜ [理解文本格式](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Understanding_the_text_format) ｜ [Rust → Wasm](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Rust_to_Wasm)
- [Wasm 3.0 正式公告（2025-09-17）](https://webassembly.org/news/2025-09-17-wasm-3.0/) —— 十大特性一手描述
- [webassembly.org](https://webassembly.org/) ｜ [特性支持活表](https://webassembly.org/features/) ｜ [规范文档](https://webassembly.github.io/spec/)
- [GitHub: WebAssembly/spec](https://github.com/WebAssembly/spec) ｜ [WebAssembly/proposals](https://github.com/WebAssembly/proposals)（提案阶段跟踪） ｜ [WebAssembly/design](https://github.com/WebAssembly/design)（早期设计存档）
- [wabt（wat2wasm/wasm2wat）](https://github.com/WebAssembly/wabt) ｜ [wasm-feature-detect](https://github.com/GoogleChromeLabs/wasm-feature-detect) ｜ [Binaryen/wasm-opt](https://github.com/WebAssembly/binaryen)
- [Emscripten 官方文档](https://emscripten.org/) ｜ [wasm-bindgen Book](https://rustwasm.github.io/docs/wasm-bindgen/) ｜ [wasm-pack 文档](https://rustwasm.github.io/docs/wasm-pack/) ｜ [AssemblyScript 官网](https://www.assemblyscript.org/)
- [WASI](https://wasi.dev/) ｜ [组件模型仓库](https://github.com/WebAssembly/component-model) —— 浏览器外生态两块地基
