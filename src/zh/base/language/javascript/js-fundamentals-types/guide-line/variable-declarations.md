---
layout: doc
outline: [2, 3]
---

# 变量声明：var / let / const

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 三种声明：`var`（函数作用域，旧）/ `let`（块作用域，可改）/ `const`（块作用域，不可重新赋值）
- 默认 `const`，需重新赋值才 `let`，**新代码不用 `var`**
- `const` 必须初始化（`const x;` 是 `SyntaxError`）；锁的是**绑定**，对象 / 数组内容仍可变
- 提升：三者声明都提升，但 `var` 提升后初始化为 `undefined`，`let` / `const` 提升后处于 **TDZ**
- TDZ（暂时性死区）：从块开始到声明语句之间访问 `let` / `const` 抛 `ReferenceError`
- 重复声明：同作用域 `var` 可重复，`let` / `const` 报 `SyntaxError`
- 命名：以字母 / `_` / `$` 开头，区分大小写，允许 Unicode 字母
- 不声明直接赋值（`x = 1`）会创建全局变量——严格模式下直接报错，永远别这么写
- 经典坑：循环里用 `var` 共享同一个变量；用 `let` 每轮迭代各有独立绑定

## 三种声明一览

| 特性 | `var` | `let` | `const` |
| --- | --- | --- | --- |
| 作用域 | 函数 / 全局 | 块 `{}` | 块 `{}` |
| 提升后初值 | `undefined` | TDZ（不可访问） | TDZ（不可访问） |
| 可重复声明 | ✅ | ❌ `SyntaxError` | ❌ `SyntaxError` |
| 可重新赋值 | ✅ | ✅ | ❌ `TypeError` |
| 必须初始化 | ❌ | ❌（可选） | ✅ 必填 |
| 建议 | 不用 | 需重新赋值时 | 默认 |

## const：默认选择

`const` 声明一个**不可重新赋值**的绑定，必须在声明时初始化：

```js
const PI = 3.14159;
PI = 3; // ❌ TypeError: Assignment to constant variable.

const x; // ❌ SyntaxError: Missing initializer in const declaration
```

关键是要理解：`const` 锁的是**「变量名到值的绑定」**，不是值本身。如果值是对象或数组，其内容照样能改：

```js
const user = { name: "Ada" };
user.name = "Grace"; // ✅ 允许：改的是对象内容，不是 user 的绑定
user.age = 36; // ✅ 允许：新增属性

const list = ["HTML", "CSS"];
list.push("JS"); // ✅ 允许：list 仍指向同一个数组
console.log(list); // ['HTML', 'CSS', 'JS']

user = {}; // ❌ TypeError：这才是重新赋值绑定
```

如果想连内容都冻结，需要 `Object.freeze()`（浅冻结），那是另一回事，与 `const` 无关。

## let：需要重新赋值时

`let` 块作用域、可重新赋值，初始化可选（不初始化则为 `undefined`）：

```js
let count = 0;
count += 1; // ✅ 可重新赋值
count = "done"; // ✅ 弱类型，类型也能变（但不推荐这样混用）

let pending; // 未初始化 → undefined
console.log(pending); // undefined
```

`const` 与 `let` 都不能在同一块里重复声明：

```js
let a = 1;
let a = 2; // ❌ SyntaxError: Identifier 'a' has already been declared
```

## var：理解它，但别用它

`var` 是 ES5 及更早的唯一声明方式，有两个让人头疼的特性。

### 1. 函数作用域，无视块

`var` 只认函数边界，`if` / `for` 这些块对它无效：

```js
function f() {
  if (true) {
    var x = 10; // 看似在 if 块里
  }
  console.log(x); // 10 —— 居然能访问到！var 泄漏到整个函数
}

// 换成 let 就符合直觉：
function g() {
  if (true) {
    let y = 10;
  }
  console.log(y); // ❌ ReferenceError: y is not defined
}
```

### 2. 可重复声明，容易覆盖

```js
var n = 1;
var n = 2; // ✅ 不报错，悄悄覆盖——大型文件里极易误伤
console.log(n); // 2
```

正因这两点，现代代码统一用 `let` / `const`。

## 提升（Hoisting）与暂时性死区（TDZ）

「提升」指声明在编译阶段被「提到」其作用域顶部。三种声明都会提升，但**行为不同**。

### var 的提升：初始化为 undefined

```js
console.log(x); // undefined —— 不报错，因为 var 提升后已初始化为 undefined
var x = 3;
console.log(x); // 3

// 上面等价于引擎看到的：
// var x;          // 提升到顶部，值 undefined
// console.log(x); // undefined
// x = 3;
```

这种「能访问但是 `undefined`」常让人误以为变量没问题，实则是逻辑漏洞。

### let / const 的提升：进入 TDZ

`let` / `const` 也提升，但**提升后不会初始化**——从块开始到声明语句之间，变量处于**暂时性死区（Temporal Dead Zone, TDZ）**，访问会直接抛错：

```js
console.log(y); // ❌ ReferenceError: Cannot access 'y' before initialization
let y = 3;
```

::: tip TDZ 的意义
TDZ 把「声明前访问」从 `var` 时代的「悄悄拿到 `undefined`」变成「立即报错」，逼你养成**先声明、后使用**的习惯。这是 `let` / `const` 比 `var` 更安全的核心原因之一。注意报错信息是 `Cannot access ... before initialization`，与「变量根本不存在」的 `is not defined` 不同。
:::

一个微妙的 TDZ 例子——`typeof` 对 TDZ 中的变量也会抛错：

```js
console.log(typeof undeclared); // "undefined"（变量根本不存在，安全）
console.log(typeof inTDZ); // ❌ ReferenceError（在 TDZ 里）
let inTDZ = 1;
```

## 经典坑：循环里的 var vs let

这是面试与实战都高频的陷阱。用 `var` 时，整个循环**共享同一个变量**，回调里读到的都是最终值：

```js
// ❌ 全部输出 3：i 是同一个 var，循环结束时已是 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
// 输出：3 3 3

// ✅ 输出 0 1 2：let 在每轮迭代创建独立绑定
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j));
}
// 输出：0 1 2
```

`let` 在 `for` 循环中每次迭代都会**新建一个绑定**并把上轮的值拷过来，所以每个闭包捕获的是各自那一轮的 `j`。仅凭这一点，循环计数器就该用 `let`。

## 命名规则

- 首字符：字母、`_` 或 `$`；其余：字母、数字、`_`、`$`
- 区分大小写：`name` 与 `Name` 是两个变量
- 允许 Unicode 字母：`const 名字 = "Ada"` 合法（但工程上仍建议英文）
- 不能用保留字：`let`、`class`、`return` 等不能作变量名

```js
let _private = 1; // ✅
let $element = 2; // ✅
let temp99 = 3; // ✅
let 99temp = 4; // ❌ SyntaxError：不能数字开头
```

## 永远不要隐式创建全局变量

不带任何关键字直接赋值，会在**非严格模式**下创建一个全局变量——这是事故源头，严格模式会直接报错：

```js
function bad() {
  leaked = 10; // 非严格模式：创建了全局 leaked！严格模式：ReferenceError
}
```

养成「任何变量都先 `const` / `let` 声明」的习惯即可彻底避免。

## 小结

默认 `const`、需改才 `let`、不用 `var`——这条规则背后是块作用域与 TDZ 带来的可预测性。理解了「声明都会提升、但 `var` 给 `undefined` 而 `let` / `const` 进 TDZ」，你就能解释绝大多数「变量怎么会是这个值」的疑惑。下一页进入 JavaScript 的值本身：[原始类型与包装对象](./primitive-types)。
