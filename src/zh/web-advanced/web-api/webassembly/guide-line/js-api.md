---
layout: doc
outline: [2, 3]
---

# JS API 全解：四个加载入口、导入导出与错误类型

> 基于 WebAssembly 3.0（2025-09 定稿）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **四个加载入口**：按"流式与否 × 是否顺带实例化"二维展开——`compile`（字节 → Module）、`compileStreaming`（Response → Module）、`instantiate`（字节/Module → 实例）、`instantiateStreaming`（Response → 实例）。**首选 `instantiateStreaming`**（MDN 称其为 primary API）。
- **流式的优势**：直接对**下载中的字节流**边收边编译，不必先攒出完整 ArrayBuffer——首字节到可执行的延迟最短、内存峰值更低。
- **MIME 硬门槛**：两个 Streaming API 都要求响应 `Content-Type: application/wasm`，不符**抛 TypeError**；本地老服务器/错误 CDN 配置是高发原因，回退方案是 ArrayBuffer 路线。
- **`instantiate` 双重载**：传 **BufferSource** → resolve 为 `{ module, instance }`（ResultObject）；传**已编译的 Module** → 直接 resolve 为 Instance——两个重载返回结构不同，混淆是常见 bug。
- **ResultObject 的价值**：`module` 用于缓存、`postMessage()` 给 Worker、再实例化；`instance` 用于当下调用——MDN 原话"通常只关心 instance，但 module 值得留着"。
- **`validate(bytes)`**：同步返回 boolean，校验字节是否为合法 Wasm——只验不编译，适合前置检查不可信来源。
- **importObject 结构**：两级命名空间的普通对象——模块声明 `(import "mod" "name" kind)`，JS 侧就要有 `importObject.mod.name` 且**种类/签名匹配**（函数/Memory/Table/Global 皆可注入）。
- **导入缺失或不匹配 → LinkError**：实例化阶段抛出；MDN 定义 LinkError 为"模块实例化期间的错误（start 函数的 trap 除外）"。
- **三大错误类型**：`CompileError`（解码/验证阶段非法字节）、`LinkError`（实例化/链接阶段导入不匹配）、`RuntimeError`（运行期 trap：越界访问、除零、`unreachable`、间接调用签名不符）。
- **start 函数例外**：模块的 start 函数在实例化时自动执行，它 trap 抛的是 **RuntimeError 而非 LinkError**——按阶段判错时的唯一例外。
- **exports 访问三件套**：`instance.exports.fn()` 调函数、`new DataView(instance.exports.memory.buffer)` 读内存、`instance.exports.table.get(0)()` 调表项——exports 是冻结对象。
- **`i64` ↔ BigInt**：跨边界的 `i64` 参数/返回值在 JS 侧一律是 BigInt；传 Number 抛 TypeError（BigInt 集成自 2021 起 Baseline）。
- **Module 反射**：静态方法 `WebAssembly.Module.exports(module)` / `imports(module)` 返回导出/导入的声明清单（name/kind），不实例化就能"看清"一个模块。
- **缓存与共享**：Module 支持**结构化克隆**——可 `postMessage()` 给 Worker 复用编译结果；Instance 不可克隆，非 shared 的 Memory 不可跨线程传。
- **Worker 一句话**：Worker 内可正常使用全套 WebAssembly API，重计算模块放 Worker + 主线程传 Module 是标准架构。
- **JSPI 三件套**：`WebAssembly.promising()`（把导出函数包成返回 Promise）、`WebAssembly.Suspending`（把异步 JS 函数包成可挂起导入）、`WebAssembly.JSTag`（在 Wasm 内识别 JS 异常）——属前沿能力，Safari 未支持，详见 [Wasm 3.0 与前沿](./wasm3-and-frontier)。
- **老浏览器兜底顺序**：`instantiateStreaming` → 特性检测失败 → `fetch + arrayBuffer + instantiate` → 极端场景 XHR。

## 一、API 全景：一张二维表

`WebAssembly` 命名空间下的加载 API 本质是一张 2×2 的表：

| | **产出 Module（只编译）** | **产出 Instance（编译+实例化）** |
| --- | --- | --- |
| **输入字节（BufferSource）** | `compile(bytes)` → `Promise<Module>` | `instantiate(bytes, imports)` → `Promise<ResultObject>` |
| **输入响应流（Response）** | `compileStreaming(source)` → `Promise<Module>` | `instantiateStreaming(source, imports)` → `Promise<ResultObject>` |

再加两个辅助入口：

- `WebAssembly.validate(bytes)`：**同步**校验字节合法性，返回 boolean。
- `WebAssembly.instantiate(module, imports)`：第二重载，对**已编译**的 Module 做纯实例化，resolve 为 `Instance`（注意与第一重载返回结构不同）。

选择逻辑很简单：**能流式就流式，不需要分离编译就直接 instantiate**——绝大多数场景一行 `instantiateStreaming` 解决；只有"编译一次、多次/跨线程实例化"的场景才值得单独 `compileStreaming`。

## 二、instantiateStreaming：首选路径与 MIME 门槛

MDN 把 `instantiateStreaming` 称为 **"the primary API for compiling and instantiating WebAssembly code"**。它接受一个 Response（或 resolve 为 Response 的 Promise——所以 `fetch()` 调用可以不加 await 直接塞进去），对下载中的字节流**边收边编译**：

```javascript
const importObject = {
  my_namespace: {
    imported_func: (arg) => console.log(arg), // 供 Wasm 调用的 JS 函数
  },
};

// fetch 的 Promise 直接传入，下载与编译流水线并行
const { module, instance } = await WebAssembly.instantiateStreaming(
  fetch("simple.wasm"),
  importObject,
);

instance.exports.exported_func(); // 调用导出函数
```

相比"下载完 → 攒成 ArrayBuffer → 再编译"的旧路线，流式路径**首字节到可执行的延迟更短、无需在内存里同时持有完整字节副本**，对大模块（动辄几 MB 到几十 MB）差异显著。

**唯一的门槛是 MIME**：响应头必须是 `Content-Type: application/wasm`，否则直接抛 TypeError（编译根本不开始）。现代工具链与静态服务器默认配好，但老版 `python -m http.server`、配置缺失的 nginx/CDN 仍是高发翻车点。健壮的加载函数通常带兜底：

```javascript
/**
 * 加载 Wasm 模块：优先流式，MIME 不符时回退 ArrayBuffer 路线
 */
async function loadWasm(url, importObject) {
  try {
    // 首选：流式编译 + 实例化（要求 application/wasm）
    return await WebAssembly.instantiateStreaming(fetch(url), importObject);
  } catch {
    // 兜底：先取完整字节再编译——不挑 MIME，但失去流式优势
    const bytes = await (await fetch(url)).arrayBuffer();
    return await WebAssembly.instantiate(bytes, importObject);
  }
}
```

## 三、ArrayBuffer 路线与 instantiate 双重载

非流式路线仍有两个不可替代的用途：字节来源不是网络响应（IndexedDB 缓存、内联 base64、`File`），以及 MIME 兜底。

```javascript
// 路线一：bytes → 一步到位拿 {module, instance}
fetch("module.wasm")
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.instantiate(bytes, importObject))
  .then((results) => {
    results.instance.exports.exported_func();
  });

// 路线二：bytes → 只编译拿 Module，稍后再实例化
const module = await WebAssembly.compile(bytes);
const instance = await WebAssembly.instantiate(module, importObject); // 第二重载
```

**`instantiate` 的双重载是本页最容易踩的 API 设计坑**：

| 入参 | resolve 结果 |
| --- | --- |
| BufferSource（原始字节） | `{ module, instance }` —— ResultObject |
| `WebAssembly.Module`（已编译） | `Instance` —— 裸实例，**没有外层包装** |

对已编译 Module 调 `instantiate` 后再去解构 `.instance` 会拿到 undefined——判断依据永远是"入参是字节还是 Module"。

MDN 对 ResultObject 里 module 的建议值得记住：**"通常只关心 instance，但 module 留着可以缓存、经 `postMessage()` 分享给另一个 Worker/窗口、或创建更多实例"**。

## 四、importObject：两级命名空间与匹配规则

Wasm 模块的每条导入声明都是两级名字 `(import "模块名" "成员名" 种类)`，importObject 就是按这两级组织的普通 JS 对象。四种可注入的实体：

```javascript
const importObject = {
  env: {
    // 1. 函数：Wasm 内 call 时同步调入 JS
    log: (n) => console.log(n),
    // 2. 内存：JS 预分配，与模块共享
    memory: new WebAssembly.Memory({ initial: 10 }),
    // 3. 表：共享函数引用
    table: new WebAssembly.Table({ initial: 2, element: "anyfunc" }),
    // 4. 全局量：跨边界变量
    counter: new WebAssembly.Global({ value: "i32", mutable: true }, 0),
  },
};
```

匹配规则是**逐条严格核对**：模块声明的每条导入，importObject 里必须存在同路径、同种类、签名兼容的实体——多给不报错（忽略），**缺给或给错立刻 LinkError**。实际工程中 importObject 几乎都由工具链胶水生成（Emscripten 的 `env`、wasm-bindgen 的 `__wbindgen_*` 族），手写场景主要在裸 WAT 教学与自定义嵌入。

不确定一个陌生模块要什么导入时，用 Module 反射先"看"再动手：

```javascript
const module = await WebAssembly.compileStreaming(fetch("unknown.wasm"));
console.log(WebAssembly.Module.imports(module)); // [{ module: "env", name: "log", kind: "function" }, …]
console.log(WebAssembly.Module.exports(module)); // [{ name: "add", kind: "function" }, …]
```

## 五、exports：出口的三种形态

实例的一切出口都收在 `instance.exports`（冻结对象）上，按导出种类三种用法：

```javascript
const { instance } = await WebAssembly.instantiateStreaming(
  fetch("myModule.wasm"),
  importObject,
);

// 1. 导出函数：直接调用——"Exported WebAssembly functions" 就是普通可调用 JS 函数
instance.exports.exported_func();

// 2. 导出内存：套 DataView / TypedArray 视图读写
const dv = new DataView(instance.exports.memory.buffer);

// 3. 导出表：按索引取函数引用再调用
const table = instance.exports.table;
console.log(table.get(0)());
```

导出函数在 JS 侧是真正的函数对象（`typeof === "function"`），可以存变量、传回调；参数与返回值按 Wasm 类型映射：`i32`/`f32`/`f64` ↔ Number，**`i64` ↔ BigInt**（传 Number 抛 TypeError），`externref` ↔ 任意 JS 值。

## 六、错误类型三兄弟：按阶段判错

WebAssembly 定义了三个错误构造器，各自绑定生命周期的一个阶段——**看到错误类型就能定位问题出在哪一环**：

| 错误 | 阶段 | 典型诱因 |
| --- | --- | --- |
| `WebAssembly.CompileError` | **解码/验证**（编译期） | 字节损坏、魔数不对、用了引擎不支持的指令、类型验证不通过 |
| `WebAssembly.LinkError` | **实例化/链接** | importObject 缺项、种类不符、函数签名对不上、Memory/Table 尺寸不满足声明 |
| `WebAssembly.RuntimeError` | **运行期（trap）** | 线性内存越界、整数除零、`unreachable` 指令、`call_indirect` 签名不符、栈溢出 |

三条实务提醒：

- MDN 对 LinkError 的定义带一个精确的括号——"during module instantiation **(besides traps from the start function)**"：模块的 start 函数在实例化时自动执行，它内部 trap 抛的是 **RuntimeError**，虽然时间点在实例化期。
- trap 的语义是"违反 Wasm 安全模型的操作立即终止执行"——它**不可能被 Wasm 内部吞掉**（异常处理提案的 catch 也不捕获 trap），只会浮到 JS 侧成为 RuntimeError。
- 流式 API 的 MIME 不符抛的是普通 **TypeError**，不属于三兄弟——错误家族之外的第四种高频失败。

此外还有异常处理相关的 `WebAssembly.Tag` / `WebAssembly.Exception`（Wasm 与 JS 之间双向抛接的结构化异常）与 JSPI 的 `WebAssembly.promising()` / `WebAssembly.Suspending` / `WebAssembly.JSTag`——这些 3.0 时代的新面孔集中在[Wasm 3.0 与前沿](./wasm3-and-frontier)拆解。

## 七、缓存、Worker 与运行环境

- **结构化克隆**：`Module` 可被结构化克隆——`postMessage()` 给 Worker/其他窗口，等于免费分发编译结果（各线程各自实例化，状态天然隔离）。`Instance` 不可克隆；非 shared 的 `Memory` 也不可跨线程传递（shared 内存底层是 SharedArrayBuffer，属线程话题）。
- **Worker 中运行**：Worker 里可用全套 WebAssembly API；"主线程 UI + Worker 跑 Wasm 重计算"是标准架构（Web Workers 本身在本章独立叶展开，此处不赘述）。
- **HTTP 缓存即模块缓存**：`.wasm` 走正常 HTTP 缓存策略（Cache-Control/ETag），现代引擎还会对大模块做**编译产物的隐式缓存**（同 URL 二次加载跳过编译）；早年规范中的 `IndexedDB` 显式存 Module 方案已被移除，不要再找这个 API。
- **运行环境不限浏览器**：Node.js 同样暴露 `WebAssembly` 全局对象（无 DOM 依赖），Deno/Bun/边缘运行时一致——本页全部 API 在服务端同样成立。

API 家族理清后，剩下的问题是"`.wasm` 从哪来"——下一页进入三大工具链与跨语言互操作：[工具链与互操作](./toolchains-interop)。
