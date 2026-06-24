---
layout: doc
outline: [2, 3]
---

# 元编程进阶与资源管理

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **well-known symbols**：语言内置协议的「钩子插孔」，挂上即可定制内置行为——见下表
- `Symbol.iterator` / `Symbol.asyncIterator`：使对象可被 `for...of` / `for await...of`
- `Symbol.toPrimitive(hint)`：对象 → 原始值的转换（`hint` 为 `"number"` / `"string"` / `"default"`）
- `Symbol.toStringTag`：定制 `Object.prototype.toString.call(x)` 的 `[object Xxx]` 标签
- `Symbol.hasInstance`：定制 `x instanceof C` 的判定
- `Symbol()` 唯一不可重得；`Symbol.for(key)` 走**全局注册表**、同 key 返回同一 symbol，`Symbol.keyFor` 反查
- **资源管理（ES2026，Stage 4）**：`using x = res`（块尾自动 `res[Symbol.dispose]()`）、`await using x = res`（自动 `await res[Symbol.asyncDispose]()`）
- 释放顺序**后声明先释放**（栈式）；释放期异常聚合进 `SuppressedError`
- 手动版：`DisposableStack` / `AsyncDisposableStack`，方法 `use` / `adopt` / `defer` / `dispose()` / `disposeAsync()` / `move()`
- 资源管理**尚未 Baseline**：V8（Chrome 134+）/ Node 24+ / TypeScript 5.2+ 已落地，Safari / Firefox 跟进中，旧环境需 polyfill（`core-js`）
- **`WeakRef` / `FinalizationRegistry`（ES2021）**：弱引用 + GC 回调，**非确定性、不保证执行**，仅作「尽力而为」的辅助，**不可**用于关键逻辑

## well-known symbols：语言留好的钩子

[Proxy](./proxy-reflect) 拦截的是「操作」，而 **well-known symbols** 挂接的是「协议」——它们是 `Symbol` 上的一批静态属性，作为内置行为的扩展点。把对应方法挂到对象上，就能定制 `for...of`、类型转换、`toString` 标签、`instanceof` 等语言级动作，且因为键是 symbol，这些定制对普通字符串属性枚举**不可见**，不会与业务字段冲突。

| symbol | 定制的内置操作 |
| --- | --- |
| `Symbol.iterator` | `for...of` / 扩展 / 解构（同步可迭代） |
| `Symbol.asyncIterator` | `for await...of`（异步可迭代） |
| `Symbol.toPrimitive` | 对象转原始值（`+obj`、模板字符串、比较等） |
| `Symbol.toStringTag` | `Object.prototype.toString` 的 `[object Xxx]` 标签 |
| `Symbol.hasInstance` | `instanceof` 的判定逻辑 |
| `Symbol.isConcatSpreadable` | `Array.prototype.concat` 是否展开该对象 |
| `Symbol.match` / `replace` / `search` / `split` | 对应 `String.prototype` 方法的行为 |
| `Symbol.matchAll` | `String.prototype.matchAll` 返回的迭代器 |
| `Symbol.species` | 派生对象（如 `map` 结果）用哪个构造器 |
| `Symbol.unscopables` | `with` 语句中要排除的属性 |
| `Symbol.dispose` / `Symbol.asyncDispose` | `using` / `await using` 的释放钩子（ES2026） |

### `Symbol.toPrimitive`：定制类型转换

当对象出现在需要原始值的场景（算术、模板字符串、`==` 比较），引擎按 `hint` 调用它：

```js
const money = {
  amount: 42,
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.amount; // +money、money * 2
    if (hint === "string") return `¥${this.amount}`; // `${money}`
    return `Money(${this.amount})`; // default：== 比较、字符串拼接
  },
};

+money; // 42
`${money}`; // "¥42"
money + ""; // "Money(42)"（default hint）
```

### `Symbol.toStringTag` 与 `Symbol.hasInstance`

```js
// 定制 Object.prototype.toString 的标签
class Temperature {
  get [Symbol.toStringTag]() {
    return "Temperature";
  }
}
Object.prototype.toString.call(new Temperature()); // "[object Temperature]"

// 定制 instanceof（无需真的在原型链上）
const Even = {
  [Symbol.hasInstance](n) {
    return Number.isInteger(n) && n % 2 === 0;
  },
};
4 instanceof Even; // true
5 instanceof Even; // false
```

### `Symbol()` vs `Symbol.for()`

`Symbol("x")` 每次都产生**全新且不可再得**的值（适合做私有键、避免冲突）；`Symbol.for("x")` 走**全局注册表**，同一个 key 在任何地方都返回**同一个** symbol（适合跨模块 / 跨 realm 共享协议键）：

```js
Symbol("id") === Symbol("id"); // false（各自唯一）
Symbol.for("id") === Symbol.for("id"); // true（注册表里同一个）
Symbol.keyFor(Symbol.for("id")); // "id"（反查 key）
Symbol.keyFor(Symbol("id")); // undefined（非注册 symbol）
```

## 资源管理：`using` 与 `await using`（ES2026）

JavaScript 长期缺一个「确定性释放资源」的语法——文件句柄、锁、数据库连接、订阅，过去只能靠手写 `try...finally` 收尾，嵌套多了极易遗漏。**显式资源管理**（TC39 Explicit Resource Management，**Stage 4，进入 ES2026**）补上了这块，对标 C# 的 `using`、Java 的 try-with-resources、Python 的 `with`。

`using x = res` 声明一个块作用域绑定；当执行**离开该块**（正常结束、`return`、`break`、抛错皆然），引擎自动调用 `res[Symbol.dispose]()`：

```js
// 任意带 [Symbol.dispose]() 的对象都可被 using 管理
class FileHandle {
  constructor(name) {
    this.name = name;
    console.log(`打开 ${name}`);
  }
  [Symbol.dispose]() {
    console.log(`关闭 ${this.name}`); // 块尾自动调用
  }
}

function readConfig() {
  using f = new FileHandle("config.json");
  console.log("读取中…");
  return "data";
} // ← 离开函数体时自动「关闭 config.json」，即便中途 return / 抛错

readConfig();
// 打开 config.json
// 读取中…
// 关闭 config.json
```

多个 `using` 按**后声明先释放**（栈式）顺序清理，符合「依赖反序拆除」的直觉：

```js
function setup() {
  using a = new FileHandle("a");
  using b = new FileHandle("b");
  using c = new FileHandle("c");
} // 释放顺序：c → b → a
```

### `await using`：异步释放

当释放本身是异步的（关连接、刷缓冲），用 `await using`——它在块尾调用 `res[Symbol.asyncDispose]()` 并 `await` 之（若对象只有 `Symbol.dispose` 则回退到它）。只能用在 `async` 函数 / 模块顶层等可 `await` 处：

```js
class DbConnection {
  async [Symbol.asyncDispose]() {
    await this.close(); // 异步关闭，块尾会被 await
  }
  async close() {
    /* … */
  }
}

async function query() {
  await using conn = await openConnection(); // 第一个 await 获取，块尾第二个 await 释放
  return conn.run("SELECT 1");
} // ← 离开时自动 await conn[Symbol.asyncDispose]()
```

::: warning 释放期的错误：`SuppressedError`
若块内已经抛了错、释放时又抛错，两者会被聚合进一个 **`SuppressedError`**：`.error` 是释放阶段的新错误，`.suppressed` 是原始错误。这样两条信息都不会丢。
:::

### 手动版：`DisposableStack` / `AsyncDisposableStack`

`using` 是声明式的、绑定到块作用域。当你需要**编程式**地聚合一组资源（数量动态、需转移所有权），用 `DisposableStack`（同步）/ `AsyncDisposableStack`（异步）：

```js
function openAll(names) {
  const stack = new DisposableStack();
  for (const name of names) {
    stack.use(new FileHandle(name)); // use：登记一个带 [Symbol.dispose] 的资源
  }
  stack.defer(() => console.log("全部收尾")); // defer：登记一个收尾回调
  // stack.adopt(rawHandle, (h) => h.close()) // adopt：为「没有 dispose 方法的」资源附加释放逻辑
  return stack;
}

const s = openAll(["x", "y"]);
// … 用 s 里的资源 …
s.dispose(); // 手动一次性释放（仍是后进先出）：收尾 → 关闭 y → 关闭 x
```

常用方法：

| 方法 | 作用 |
| --- | --- |
| `use(res)` | 登记一个带 `[Symbol.dispose]` 的资源并返回它 |
| `adopt(value, onDispose)` | 为无 dispose 方法的值附加自定义释放函数 |
| `defer(onDispose)` | 登记一个纯收尾回调（无关联资源） |
| `dispose()` / `disposeAsync()` | 手动释放全部（后进先出） |
| `move()` | 把已登记资源**转移**到一个新栈，原栈清空（防重复释放，用于把所有权交出去） |

`DisposableStack` 自身也实现了 `[Symbol.dispose]`，所以它本身也能交给 `using`：`using stack = new DisposableStack()`。

::: warning 现状（2026-06 核）：尚未 Baseline
显式资源管理已达 **Stage 4、并入 ES2026**，但**还不是 Baseline**：

- **已支持**：V8（Chrome / Edge 134+）、Node.js 24+、TypeScript 5.2+（`Symbol.dispose` 类型与降级编译）；
- **跟进中**：Safari、Firefox 尚未稳定发布；
- **降级**：旧环境用 `core-js` 提供的 polyfill，或退回手写 `try...finally`。

特性检测可看 `typeof Symbol.dispose !== "undefined"`。面向浏览器投产前请确认目标环境，或经由构建工具降级。
:::

## `WeakRef` 与 `FinalizationRegistry`：尽力而为，别依赖

ES2021 引入了两个**和垃圾回收打交道**的低层 API。它们威力大、坑也大，核心警告先行：**回收时机非确定，回调不保证执行，绝不可用于关键逻辑**。

- **`WeakRef`**：持有对一个对象的**弱引用**，不阻止它被回收。`ref.deref()` 返回对象，若已被回收则返回 `undefined`：

```js
let big = { data: new Array(1_000_000) };
const ref = new WeakRef(big);

ref.deref(); // → 那个对象（只要还活着）
big = null; // 去掉唯一强引用
// 某次 GC 之后：
ref.deref(); // 可能是 undefined（已被回收）——但何时发生不可预测
```

- **`FinalizationRegistry`**：注册对象，待其被回收后**尽力**调用清理回调（传入注册时给的 `heldValue`）：

```js
const registry = new FinalizationRegistry((held) => {
  console.log(`对象已被回收，关联值：${held}`); // 何时调用、是否调用，都无保证
});

let cache = { id: "sess-1" };
registry.register(cache, "sess-1", cache); // 第三参是「注销令牌」
// registry.unregister(cache) // 不再需要时可注销
cache = null; // 之后某个时刻，回调「可能」触发
```

::: danger 为什么不能依赖它
GC 是非确定的：回调**可能延迟很久、可能在程序退出前都不触发、不同引擎行为不同**，且永不在当前同步任务中执行。规范明确告诫：若程序逻辑依赖「定时、可预测」的 finalizer，「多半会失望」。

- ✅ 合理用途：内存调试 / 分析、缓存的**辅助**失效（配 `WeakRef`）、资源使用统计——这些「漏掉也无大碍」的场景；
- ❌ 禁用场景：关闭文件 / 释放锁 / 提交事务等**必须发生**的清理——请用 `using`（确定性）或显式 `try...finally`。
:::

## Baseline 与版本一览

| 特性 | 版本 | 状态（2026-06 核） |
| --- | --- | --- |
| well-known symbols（`iterator` / `toPrimitive` / `toStringTag` / `hasInstance` …） | ES2015 起 | ✅ Baseline 广泛可用 |
| `Symbol.asyncIterator` | ES2018 | ✅ Baseline 广泛可用 |
| `WeakRef` / `FinalizationRegistry` | ES2021 | ✅ 广泛可用（但语义上「尽力而为」） |
| `using` / `await using` / `Symbol.dispose` / `DisposableStack` | ES2026（Stage 4） | 🟠 **非 Baseline**：V8 / Node 24+ / TS 5.2+ 已落地，Safari / Firefox 跟进中 |

## 小结

well-known symbols 是语言留给你的协议插孔——`Symbol.toPrimitive` 定制类型转换、`Symbol.toStringTag` 定制标签、`Symbol.hasInstance` 定制 `instanceof`，配 `Symbol.for` 的全局注册表共享协议键。ES2026 的 `using` / `await using` 终于给 JS 带来确定性资源释放（块尾自动调 `Symbol.dispose` / `Symbol.asyncDispose`，手动版是 `DisposableStack`），但**尚未 Baseline**，投产需确认环境或降级。`WeakRef` / `FinalizationRegistry` 则是「尽力而为」的弱引用与回收回调，只能做辅助、绝不可托付关键清理。完整的陷阱表、symbols 表与版本状态见 [参考](../reference)。
