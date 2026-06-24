---
layout: doc
outline: [2, 3]
---

# 参考

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 函数四形态：声明（提升）、表达式（不提升）、箭头（无自己的 `this`/`arguments`/不可 `new`）、IIFE（即定义即执行）
- 参数：默认参数（仅 `undefined` 触发）、剩余参数 `...args`（真数组）、`arguments`（类数组，箭头函数没有）
- 作用域：`let`/`const` 块级、`var` 函数级；词法作用域=书写位置决定可见性
- 闭包：函数 + 创建时的词法环境，每次调用外层生成独立闭包；循环陷阱用 `let` 解
- `this` 四规则优先级：`new` > 显式（`bind`/`call`/`apply`）> 隐式（`obj.f()`）> 默认（严格 `undefined`）
- `call`(逗号) / `apply`(数组) 立即调用；`bind` 返回永久绑定的新函数
- 高阶函数：函数作参数 / 返回值；柯里化（单参链）、偏函数（预填参数）、组合（流水线）
- 红线：别拿箭头函数当对象方法 / 构造器；方法当回调先 `bind` 防 `this` 丢失

## 函数四形态对比

| 特性 | 函数声明 | 函数表达式 | 箭头函数 |
| --- | --- | --- | --- |
| 语法 | `function f(){}` | `const f = function(){}` | `const f = () => {}` |
| 提升 | 是（整体） | 否 | 否 |
| 自己的 `this` | 有（调用时定） | 有（调用时定） | 无（继承外层） |
| `arguments` | 有 | 有 | 无 |
| 能否 `new` | 能 | 能 | 不能 |
| `prototype` | 有 | 有 | 无 |
| 可否命名 | 必须 | 可选 | 永远匿名 |

## 参数机制速查

| 机制 | 语法 | 要点 |
| --- | --- | --- |
| 默认参数 | `function f(a, b = 1){}` | 仅实参为 `undefined` 时生效；可引用前面的参数 |
| 剩余参数 | `function f(...args){}` | 收集多余实参为**真数组**；必须是最后一个形参 |
| `arguments` | 函数内直接用 | 类数组（有 `length`、可索引，无数组方法）；箭头函数无 |
| 展开传参 | `f(...arr)` | 把数组「摊开」为独立实参（常替代 `apply`） |

## `this` 四规则速查

| 优先级 | 规则 | 形式 | `this` 指向 |
| --- | --- | --- | --- |
| 1 | `new` 绑定 | `new F()` | 新创建的对象 |
| 2 | 显式绑定 | `f.call(o)` / `f.apply(o)` / `f.bind(o)` | 手动指定的 `o` |
| 3 | 隐式绑定 | `obj.f()` | 点号前的 `obj` |
| 4 | 默认绑定 | `f()` | 严格 `undefined` / 非严格全局对象 |

> 箭头函数不参与本表：`this` 取自定义处外层，`call`/`apply`/`bind`/`new` 均改不动。

## `call` / `apply` / `bind` 速查

| 方法 | 立即调用 | 参数形式 | 返回 |
| --- | --- | --- | --- |
| `call(thisArg, a, b)` | 是 | 逗号分隔 | 函数执行结果 |
| `apply(thisArg, [a, b])` | 是 | 数组 | 函数执行结果 |
| `bind(thisArg, a)` | 否 | 逗号分隔（可预填） | `this` 永久绑定的新函数 |

记忆法：**c**all=**c**omma、**a**pply=**a**rray、**b**ind=**b**ound later。

## 闭包要点

| 概念 | 说明 |
| --- | --- |
| 词法环境 | 内部对象 = 环境记录（存本层变量）+ 外层引用 |
| `[[Environment]]` | 函数隐藏属性，记住创建时所处环境（闭包实现根基） |
| 闭包 | 函数 + 创建时的词法环境；外层执行完仍能访问其变量 |
| 独立性 | 每次调用外层函数生成独立闭包（多计数器互不干扰） |
| 循环陷阱 | `var` 全闭住最后一个值；用 `let`/`const`（每轮新绑定）或工厂 / IIFE |
| 模块模式 | IIFE/工厂把变量藏进闭包、只暴露方法 → 私有状态 |
| 内存 | 闭包引用的环境不回收；不用时解除引用 |

## 函数式范式速查

| 范式 | 定义 | 示例 |
| --- | --- | --- |
| 高阶函数 | 接收函数作参数 / 返回函数 | `map`、`filter`、`reduce` |
| 柯里化 | `f(a, b, c)` → `f(a)(b)(c)`，每次收一个 | `(a) => (b) => (c) => …` |
| 偏函数 | 预填部分参数，降低元数 | `multiply.bind(null, 2)` |
| 组合 | 多个单参函数串成流水线 | `compose`（右→左）/ `pipe`（左→右） |

## 常见坑与对策

| 坑 | 现象 | 对策 |
| --- | --- | --- |
| `this` 丢失 | 方法当回调 / 取出单独调用 → `undefined` | `bind` / 箭头包一层 / 传 `thisArg` |
| 箭头当方法 | 对象方法里 `this` 指外层而非对象 | 对象方法用普通函数 / 方法简写 |
| 箭头当构造器 | `new arrow()` 抛 `TypeError` | 构造函数用普通函数 |
| 循环闭包 | `var` 让回调全拿最后一个值 | 用 `let`/`const` |
| 误用 `arguments` | 箭头函数里 `arguments` 不是自己的 | 用剩余参数 `...args` |
| 非严格 `this` | 独立调用 `this` 悄悄变全局对象 | 用严格模式 / ES 模块 |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 说明 |
| --- | --- | --- |
| 箭头函数 | ✅ Baseline 广泛可用 | ES2015，放心用 |
| 默认参数 / 剩余参数 | ✅ Baseline 广泛可用 | ES2015，放心用 |
| 展开运算符（调用 / 数组） | ✅ Baseline 广泛可用 | 常替代 `apply` |
| `let` / `const` 块级作用域 | ✅ Baseline 广泛可用 | 现代默认 |
| 类字段（含箭头方法） | ✅ Baseline（2022 起广泛） | 绑定实例方法的常用写法 |

## 权威链接

**标准 / 规范**

- [ECMAScript 语言规范（TC39）](https://tc39.es/ecma262/)
- [MDN: `this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) · [`Function.prototype.call`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) · [`bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- [MDN: 箭头函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

**指南 / 教程**

- [MDN: Functions（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) · [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [javascript.info: 变量作用域与闭包](https://javascript.info/closure) · [对象方法与 `this`](https://javascript.info/object-methods)

**兼容性**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)

## 相关页

- [入门](./getting-started) · [函数的多种形态](./guide-line/function-forms) · [箭头函数 vs 普通函数](./guide-line/arrow-vs-regular)
- [作用域链与闭包](./guide-line/scope-closures) · [`this` 的四条规则](./guide-line/this-rules)
- [`call` / `apply` / `bind`](./guide-line/call-apply-bind) · [高阶函数](./guide-line/higher-order-functions)
