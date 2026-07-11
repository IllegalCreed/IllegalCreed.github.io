---
layout: doc
outline: [2, 3]
---

# 模块模型与线性内存：五大对象与 TypedArray 交互

> 基于 WebAssembly 3.0（2025-09 定稿）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **五大对象**：`Module`（无状态已编译代码）/ `Instance`（有状态可执行实例）/ `Memory`（线性内存）/ `Table`（引用数组）/ `Global`（跨边界全局变量）——全部挂在 `WebAssembly` 命名空间下。
- **Module 三特性**（MDN 原话）：stateless（无状态）、可经 `postMessage()` **高效共享给 Worker**、可**多次实例化**——"一次编译、多份隔离状态"的基础。
- **Instance = Module + 导入绑定 + 自有状态**：持有 `exports` 对象（导出函数/memory/table/global 都从这里取），多个 Instance 之间内存互相隔离。
- **Memory 本质**：`buffer` 属性是一个 ArrayBuffer（shared 模式下是 SharedArrayBuffer），Wasm 侧按字节地址读写，JS 侧套 TypedArray/DataView 视图读写——**同一块内存，两个世界的视图**。
- **页 = 64KiB**：`new WebAssembly.Memory({ initial: 10, maximum: 100 })` 单位是页；`memory.grow(页数)` 增长，返回旧页数。
- **grow 后旧 buffer 失效**：非 shared 内存 `grow()` 会 detach 旧 ArrayBuffer——**增长后必须重新获取 `memory.buffer` 并重建 TypedArray 视图**，缓存旧视图是高频崩溃源。
- **内存来源两种**：Wasm 内部声明（`(memory 1)`）后 `(export "memory" …)` 导出，或 JS `new WebAssembly.Memory()` 后经 importObject 导入（`(import "js" "mem" (memory 1))`）。
- **字符串传递**：TextEncoder 编码 → 写入线性内存 → 把指针+长度传给 Wasm；反向 TextDecoder 解码——数值以外的数据都走这条路。
- **Table 本质**：存**不透明引用**（`funcref` 函数引用为主，也可 `externref`）的可增长数组；存在意义是安全地实现"函数指针"——间接调用。
- **Table API**：`table.get(i)` / `table.set(i, ref)` / `table.grow(n)` / `length`；Wasm 侧配 `elem` 段初始化 + `call_indirect` 按索引调用（调用处校验类型签名，不符即 trap）。
- **Global 结构**：`new WebAssembly.Global({ value: "i32", mutable: true }, 0)`，JS 经 `.value` 读写；可被多个 Module 导入导出——**动态链接多模块**的共享枢纽。
- **值类型全家福**：数值 `i32`/`i64`/`f32`/`f64`、向量 `v128`、引用 `funcref`/`externref`/`exnref`；`i64` 在 JS 边界对应 **BigInt**（传 Number 抛 TypeError）。
- **externref**：可持有任意 JS 值、对 Wasm 不透明（只能存取传递，不能解构）——JS 对象进 Wasm 世界的"句柄"形态。
- **多内存（Wasm 3.0）**：单模块可声明/导入多块内存，`data`/`load`/`store` 指令带内存索引；用途：安全分区、模块静态链接、插桩。
- **memory64（Wasm 3.0）**：地址类型从 `i32` 扩到 `i64`，理论寻址 16EB；**Web 端实现上限 16GB**，突破了此前 4GB 的天花板。
- **shared memory**：`new WebAssembly.Memory({ initial, maximum, shared: true })` 的 buffer 是 SharedArrayBuffer，配原子指令实现多线程（需跨域隔离环境，本页不展开）。
- **初始化段**：`data` 段预填线性内存（如字符串常量），`elem` 段预填 Table——都在实例化时写入。

## 一、五大对象总览

WebAssembly JS API 的对象模型可以用一张关系图记住：

```
                     WebAssembly.compile / instantiate
     .wasm 字节码  ────────────────────────────────►  Module（无状态，可共享/缓存）
                                                        │
                              importObject 注入          │  实例化（可多次）
     { js 函数, Memory, Table, Global } ────────────►   ▼
                                                      Instance（有状态）
                                                        │
                                                        ▼
                                          exports: { 函数, memory, table, global }
```

| 对象 | 一句话定位 | 关键成员 |
| --- | --- | --- |
| `WebAssembly.Module` | 已编译的**无状态**代码 | 静态方法 `Module.exports(m)` / `Module.imports(m)` 可反射查询声明 |
| `WebAssembly.Instance` | Module 的**有状态**执行实例 | `exports`（冻结对象，出口全在这） |
| `WebAssembly.Memory` | 可增长的线性内存 | `buffer` / `grow(pages)` |
| `WebAssembly.Table` | 存引用的可增长数组 | `get` / `set` / `grow` / `length` |
| `WebAssembly.Global` | 跨 JS/Wasm、跨模块的全局变量 | `value` / `valueOf()` |

## 二、Module 与 Instance：一次编译、多份隔离状态

MDN 对 Module 的定义强调三点：**stateless**、**可与 Worker 高效共享**（`postMessage()` 结构化克隆传编译结果，不传源字节）、**可多次实例化**。这套"类与实例"的拆分有两个直接的工程价值：

```javascript
// 编译一次（重活：解码 + 验证 + 生成机器码）
const module = await WebAssembly.compileStreaming(fetch("/engine.wasm"));

// 实例化多次（轻活：绑定导入 + 分配状态），各实例的内存/全局互相隔离
const a = await WebAssembly.instantiate(module, importObject);
const b = await WebAssembly.instantiate(module, importObject);

// a、b 拥有各自独立的线性内存——天然的"多租户"隔离
a.exports.reset();
b.exports.reset(); // 互不影响

// 把编译结果整体交给 Worker，Worker 侧免去重复编译
worker.postMessage(module);
```

- **场景一：多实例隔离**。同一个引擎模块服务多份互不干扰的状态（多文档、多沙箱任务），只付一次编译成本。
- **场景二：跨线程复用**。主线程编译、Worker 实例化运行，把重计算挪出主线程的同时不重复编译。

`Instance.exports` 是一个**冻结（frozen）对象**，模块导出什么它就有什么：函数、`memory`、`table`、`global` 都可能出现在这里——名字由 Wasm 侧的 `(export "name" …)` 决定。

## 三、Memory：线性内存与 TypedArray 视图

### 1. 一块内存，两个世界的视图

Wasm 没有对象、没有 GC 堆（WasmGC 类型除外，见 [Wasm 3.0 与前沿](./wasm3-and-frontier)），它的数据世界就是一条**线性内存**：从地址 0 开始的连续字节数组。MDN 定义："`WebAssembly.Memory` 对象的 `buffer` 属性是一个可增长的 ArrayBuffer，保存着 Instance 访问的原始内存字节"。

- **Wasm 侧**：用 `i32.load` / `i32.store` 等指令按字节地址读写。
- **JS 侧**：对 `memory.buffer` 套 TypedArray 或 DataView 视图读写。

内存以**页（page）为单位，一页固定 64KiB**。声明与增长：

```javascript
// JS 侧创建：初始 10 页（640KiB），上限 100 页；经 importObject 传给模块
const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

const { instance } = await WebAssembly.instantiateStreaming(
  fetch("/mod.wasm"),
  { js: { mem: memory } }, // 对应 Wasm 侧 (import "js" "mem" (memory 1))
);

// 增长 2 页，返回增长前的页数
const prevPages = memory.grow(2);
```

内存也可以反过来由 Wasm 侧声明并导出（WAT：`(memory 1)` + `(export "memory" (memory 0))`），JS 从 `instance.exports.memory` 拿到同一个对象。Emscripten、wasm-pack 的产物默认都走"模块导出内存"这条路。

### 2. 字符串与大块数据的标准传法

数值以外的数据不能直接过边界，标准流程是"写内存 + 传指针"：

```javascript
// —— JS 把字符串传给 Wasm ——
const encoder = new TextEncoder(); // UTF-8 编码器
const bytes = encoder.encode("你好，Wasm");

// 假设 Wasm 导出了 malloc 风格的分配函数，先在线性内存里要一块地
const ptr = instance.exports.alloc(bytes.length);

// 套 Uint8Array 视图，把编码结果复制进线性内存
new Uint8Array(instance.exports.memory.buffer, ptr, bytes.length).set(bytes);

// 把"指针 + 长度"这两个数字传过边界
instance.exports.process(ptr, bytes.length);

// —— JS 从 Wasm 读回字符串 ——
const outPtr = instance.exports.result_ptr();
const outLen = instance.exports.result_len();
const view = new Uint8Array(instance.exports.memory.buffer, outPtr, outLen);
console.log(new TextDecoder().decode(view)); // UTF-8 解码
```

每一次这样的传递都包含**编码 + 复制 + 解码**三重成本——这正是[入门页](../getting-started)成本模型的微观来源。手写这套封送很繁琐，实际项目多交给 wasm-bindgen / Emscripten 胶水自动生成（见[工具链与互操作](./toolchains-interop)）。

### 3. grow 之后旧视图必失效（头号坑）

非 shared 的 Memory 调用 `grow()` 时，引擎可能整体搬迁内存，**旧的 ArrayBuffer 会被 detach（长度归零不可用），基于它创建的所有 TypedArray 视图随之作废**：

```javascript
const u8 = new Uint8Array(memory.buffer);
memory.grow(1); // 旧 buffer 被 detach
u8[0]; // ❌ 旧视图已失效，读写抛错

const fresh = new Uint8Array(memory.buffer); // ✅ 增长后必须重取 buffer 重建视图
```

工程守则：**不要长期缓存 TypedArray 视图**——要么每次用时从 `memory.buffer` 现建（视图创建本身很廉价），要么在每个可能触发增长的调用之后统一刷新。Wasm 侧代码内部的 `memory.grow` 指令同样会触发这个失效，坑更隐蔽。

另外一提：`{ shared: true }` 的共享内存 buffer 是 SharedArrayBuffer，配合原子指令支撑多线程 Wasm（需要跨域隔离环境与 Worker，本叶不展开线程话题）。

## 四、Table 与 call_indirect：把"函数指针"关进笼子

C/C++ 里满地都是函数指针，但 Wasm 不能把裸的代码地址暴露进线性内存（安全模型不允许）。解法就是 **Table**：一个存放**不透明引用**（主要是 `funcref`）的可增长数组，Wasm 代码只能"按索引取引用来调用"，既实现了函数指针语义，又碰不到真实地址。

WAT 侧的完整配套：

```wasm
(module
  (table 2 funcref)                 ;; 声明一张 2 个槽位的函数引用表
  (func $f1 (result i32) i32.const 42)
  (func $f2 (result i32) i32.const 13)
  (elem (i32.const 0) $f1 $f2)      ;; elem 段：从索引 0 起填入 f1、f2

  (type $ret_i32 (func (result i32)))
  (func (export "callByIndex") (param $i i32) (result i32)
    local.get $i
    call_indirect (type $ret_i32))) ;; 按栈顶索引间接调用，调用处校验签名
```

`call_indirect` 在调用时**校验目标函数的类型签名**，不符即抛 RuntimeError（trap）——这是"笼子"的另一半。JS 侧对应的操作接口：

```javascript
const table = instance.exports.table;
table.get(0)(); // 取索引 0 的函数引用并调用 → 42
table.set(1, someFuncRef); // 替换表项（引用类型提案后 Wasm 侧也能 table.set）
table.grow(4); // 扩容
```

C/C++ 编译产物里的虚函数表、回调注册，底层全靠这张表；动态链接场景下多个模块共享同一张 Table 实现互相调用。

## 五、Global：跨模块共享的全局变量

`WebAssembly.Global` 表示一个**可同时被 JS 访问、被一个或多个 Module 导入/导出**的全局变量实例——MDN 明确点出它的核心用途：**多模块动态链接**（多个模块共享同一个全局状态，如栈指针）。

```javascript
// 创建一个可变的 i32 全局变量，初值 0
const g = new WebAssembly.Global({ value: "i32", mutable: true }, 0);

// 注入给模块：对应 WAT 侧 (global $g (import "js" "global") (mut i32))
const { instance } = await WebAssembly.instantiate(module, {
  js: { global: g },
});

g.value = 42; // JS 侧写
instance.exports.readGlobal(); // Wasm 侧读到 42
instance.exports.bumpGlobal(); // Wasm 侧改，JS 侧 g.value 同步可见
```

要点：构造时 `mutable: false`（默认）的全局量两侧都只读；`i64` 类型的 Global 在 JS 侧以 BigInt 读写。

## 六、Wasm 3.0 的内存扩容：多内存与 memory64

两个 2025-09 随 Wasm 3.0 定稿的内存能力，彻底改变了"一个模块一块 32 位内存"的旧世界：

- **多内存（multiple memories）**：单个模块可以声明/导入**多块内存**并同时访问，`load`/`store`/`data` 都带内存索引。官方公告点名的用途：**安全分区**（敏感数据与常规数据物理隔离）、**静态链接**（把多个模块合并成一个时各保留自己的内存）、**插桩与检测**。此前想"两块内存"只能拆成两个模块绕行。

```wasm
(module
  (import "js" "mem0" (memory 1))       ;; 第 0 块：导入
  (memory $mem1 1)                      ;; 第 1 块：自声明
  (data (memory 1) (i32.const 0) "私有数据")) ;; data 段指定写入第 1 块
```

- **memory64**：内存与表的地址类型从 `i32` 扩展到 `i64`，理论地址空间从 4GB 跃升至 16EB；**Web 端实现把 64 位内存上限定在 16GB**——对浏览器场景，真正的意义是打破 4GB 天花板（大型 CAD/科学计算数据集），非 Web 生态则能吃到完整的大地址空间红利。

两者的浏览器落地节奏与其余 3.0 特性（GC、异常处理、尾调用）一并整理在 [Wasm 3.0 与前沿](./wasm3-and-frontier)。搞清"代码怎么组织、数据怎么进出"之后，下一页把加载与实例化的 JS API 家族一网打尽：[JS API 全解](./js-api)。
