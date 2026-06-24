---
layout: doc
outline: [2, 3]
---

# 函数的多种形态

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 函数声明 `function f(){}`：**整体提升**到作用域顶部，可在定义前调用
- 函数表达式 `const f = function(){}`：赋值语句，**不提升**（`const`/`let` 有暂时性死区，调用前会报错）
- 命名函数表达式 `const f = function fac(){…}`：函数名 `fac` 只在函数内部可见，便于自引用与调试栈
- 箭头函数 `const f = (a) => a * 2`：单表达式可省 `return` 与花括号；只有一个参数可省括号（但**对象字面量**返回值要加括号 `() => ({a: 1})`）
- IIFE `(function(){…})()`：定义后立即执行一次，开辟私有作用域；现代多被块级作用域 / 模块取代
- 默认参数 `function f(a, b = a + 1){}`：仅在实参为 `undefined` 时生效；后面的默认值可引用前面的参数
- 剩余参数 `function f(...args){}`：把多余实参收成**真数组**，必须是最后一个形参
- `arguments`：类数组对象（有 `length`、可索引，但无数组方法），只存在于**非箭头**函数中；现代优先用剩余参数
- `Function` 构造器 `new Function('a','b','return a+b')`：从字符串造函数，作用域只到全局，安全与性能差，几乎不用

## 函数声明

```js
function square(n) {
  return n * n;
}
```

由 `function` 关键字、函数名、圆括号里的参数列表、花括号里的语句体组成。它最大的特点是**提升**——整个函数在代码执行前就被搬到所在作用域顶部，所以可以「先调用、后定义」：

```js
console.log(square(5)); // 25 —— 正常运行

function square(n) {
  return n * n;
}
```

## 函数表达式

把一个函数赋值给变量，就是函数表达式。它**不提升**（变量声明本身受 `let`/`const` 的暂时性死区约束）：

```js
console.log(square(5)); // ReferenceError：初始化前无法访问 square

const square = function (n) {
  return n * n;
};
```

函数可以匿名，也可以命名。**命名函数表达式**的名字只在函数体内部可见，主要用于自引用与让调试栈更清晰：

```js
const factorial = function fac(n) {
  return n < 2 ? 1 : n * fac(n - 1); // fac 在内部可见，外部不可见
};
console.log(factorial(5)); // 120
```

函数表达式还能按条件赋值，这是声明做不到的：

```js
let handler;
if (isMobile) {
  handler = function () {
    /* 移动端逻辑 */
  };
} else {
  handler = function () {
    /* 桌面端逻辑 */
  };
}
```

## 箭头函数

箭头函数是函数表达式的精简语法，写法随参数与函数体而变：

```js
const add = (a, b) => a + b; // 单表达式：隐式返回
const square = (x) => x * x; // 单参数也可省括号
const greet = () => "Hello"; // 无参数：空括号必写
const sum = (a, b) => {
  // 多语句：要花括号 + 显式 return
  const s = a + b;
  return s;
};
```

::: warning 返回对象字面量要加括号
箭头函数体里的 `{` 会被当成「函数体起始」，直接写对象会语法出错。返回对象字面量必须用圆括号包住：

```js
const makeUser = (name) => ({ name, role: "user" }); // 正确
// const bad = (name) => { name }; // 错：{ name } 被当成函数体，返回 undefined
```
:::

箭头函数最关键的语义差异——**没有自己的 `this`/`arguments`、不能 `new`、无 `prototype`**——单独成页详述，见 [箭头函数 vs 普通函数](./arrow-vs-regular)。

## IIFE（立即调用函数表达式）

把函数定义用括号包成「表达式」，紧跟一对 `()` 立即执行：

```js
(function () {
  // 这里的变量被封在自己的作用域里
  const secret = "0]Eal(eh&2";
  console.log(secret);
})();
```

它的经典用途是**开辟私有作用域**、在初始化时做一段复杂计算并只暴露结果：

```js
const config = (function () {
  const raw = readEnv(); // 私有
  return Object.freeze({ port: raw.PORT ?? 3000 });
})();
```

::: tip 现代还需要 IIFE 吗
在 `var` 时代，IIFE 是隔离变量、避免污染全局的主力。如今 `let`/`const` 的块级作用域和 ES 模块（每个模块自带独立作用域）已能覆盖绝大多数场景，IIFE 用得越来越少——但理解它对读老代码、读打包产物仍然必要。
:::

## 参数机制

### 默认参数

形参可以带默认值，仅在该实参为 `undefined`（含完全不传）时生效：

```js
function multiply(a, b = 1) {
  return a * b;
}
multiply(5); // 5  （b 取默认 1）
multiply(5, 2); // 10
multiply(5, undefined); // 5  （显式 undefined 也触发默认）
multiply(5, null); // 0  （null 不触发默认，0 * null = 0）
```

默认值在调用时求值，且可引用前面已声明的参数：

```js
function range(start, end = start + 10) {
  return [start, end];
}
range(5); // [5, 15]
```

### 剩余参数

`...args` 把多余实参收集成一个**真正的数组**，必须作为最后一个形参：

```js
function multiplyAll(factor, ...nums) {
  return nums.map((n) => factor * n); // nums 是真数组，可直接 map
}
multiplyAll(2, 1, 2, 3); // [2, 4, 6]
```

### arguments 对象

每个**非箭头**函数内部都有一个 `arguments`，按顺序保存所有实参。它是「类数组」——有 `length`、可用下标，但**没有** `map`/`forEach` 等数组方法：

```js
function concatAll(separator) {
  let result = "";
  // 从下标 1 开始，跳过 separator
  for (let i = 1; i < arguments.length; i++) {
    result += arguments[i] + separator;
  }
  return result;
}
concatAll(", ", "red", "orange", "blue"); // "red, orange, blue, "
```

::: warning 优先用剩余参数
`arguments` 有三个明显短板：不是真数组（要转换才能用数组方法）、不反映默认参数、**箭头函数里根本不存在**。现代代码一律用剩余参数 `...args` 取代它，可读性与功能都更好。
:::

## Function 构造器

可以从字符串动态构造函数，类似 `eval`：

```js
const sum = new Function("a", "b", "return a + b");
sum(2, 6); // 8
```

它创建的函数作用域**只能到全局**（拿不到定义处的局部变量），且涉及字符串解析，存在安全与性能问题。除非确有运行时动态生成代码的需求，**日常不要使用**。

## 形态选择速查

| 需求 | 推荐形态 |
| --- | --- |
| 顶层工具函数、需在定义前调用 | 函数声明 |
| 按条件 / 运行时决定函数体 | 函数表达式 |
| 回调、不需要自己的 `this` | 箭头函数 |
| 收集不定数量参数 | 剩余参数 `...args` |
| 一次性初始化 + 私有作用域 | IIFE（或直接用块 / 模块） |

## 下一步

四种形态里，箭头函数的语义差异最大、坑也最多。下一页专门对比 [箭头函数 vs 普通函数](./arrow-vs-regular)，讲清 `this`、`arguments`、`new` 这三处关键区别。
