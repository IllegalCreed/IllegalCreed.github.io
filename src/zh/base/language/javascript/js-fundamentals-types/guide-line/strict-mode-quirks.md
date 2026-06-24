---
layout: doc
outline: [2, 3]
---

# strict mode 与历史怪癖

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 开启：脚本 / 函数体首行 `"use strict";`；**ES module 与 `class` 体默认严格**，无需声明
- 严格模式把一批「悄悄失败」变「立即报错」：给未声明变量赋值 → `ReferenceError`
- 给只读 / getter-only / 不可扩展对象的属性赋值 → `TypeError`（非严格下静默失败）
- 删除不可删除属性 → `TypeError`；函数重复形参名 → `SyntaxError`
- 旧式八进制 `0644` 被禁，须写 `0o644`；`with` 语句被禁
- `this` 在普通函数调用里是 `undefined`（非严格下是全局对象 / `window`）
- `eval` 有独立作用域，不再向外泄漏变量；`arguments` 不再与具名参数联动
- `implements`/`interface`/`let`/`package`/`private`/`protected`/`public`/`static`/`yield` 保留，不能作标识符
- 必背怪癖：`typeof null === "object"`、`NaN !== NaN`、ASI（自动分号插入）可能改变语义
- ASI 雷区：`return` 后换行会被插分号致返回 `undefined`；行首 `(` / `[` / `` ` `` 易与上一行连成一句

## 如何开启严格模式

### 显式声明 "use strict"

放在**脚本最顶部**（作用于整个脚本）或**函数体首行**（仅作用于该函数）：

```js
"use strict"; // 整个脚本严格
const v = 1;
```

```js
function strictFn() {
  "use strict"; // 仅此函数严格
  // ...
}
```

注意：带剩余 / 默认 / 解构参数的函数**不能**再写函数级 `"use strict"`（语法错误），此时应在模块或外层开启。

### module 与 class 默认严格

现代代码大多自动处于严格模式，无需手写指令：

- **ES module**（`<script type="module">` 或 `.mjs` / 打包产物）：整个模块默认严格；
- **`class` 体**：类声明与类表达式内部的所有代码默认严格。

```js
// 一个 ES module 文件里
undeclared = 1; // 直接 ReferenceError —— 因为 module 默认严格

class C {
  m() {
    undeclared = 1; // 同样 ReferenceError —— class 体默认严格
  }
}
```

这正是「现代 JavaScript 天然更安全」的原因：你写 module / class 时，严格模式已经替你兜底。

## 严格模式收紧了什么

### 1. 禁止隐式全局变量

给未声明的变量赋值，非严格模式会**悄悄创建全局变量**（事故源头），严格模式直接报错：

```js
"use strict";
mistyped = 17; // ❌ ReferenceError: mistyped is not defined
```

### 2. 静默的属性赋值失败变成抛错

非严格模式下，给只读属性、getter-only 属性、不可扩展对象的新属性赋值都**静默失败**；严格模式抛 `TypeError`，让 Bug 暴露：

```js
"use strict";
const obj = {};
Object.defineProperty(obj, "x", { value: 1, writable: false });
obj.x = 2; // ❌ TypeError（非严格：静默失败，x 仍是 1）

undefined = 5; // ❌ TypeError
NaN = 5; // ❌ TypeError（这些全局只读值不可写）

const frozen = Object.freeze({ a: 1 });
frozen.a = 9; // ❌ TypeError（非严格：静默失败）
```

### 3. 删除不可删除属性抛错

```js
"use strict";
delete Object.prototype; // ❌ TypeError
delete window.someGlobal; // 视情况 TypeError
```

### 4. 重复形参名是语法错误

```js
function sum(a, a, c) {
  // ❌ SyntaxError（严格模式）
  "use strict";
  return a + a + c;
}
```

### 5. 禁旧式八进制、禁 with

```js
"use strict";
const n = 0644; // ❌ SyntaxError，须写 0o644
const m = 0o644; // ✅ 现代八进制写法

with (obj) {
  // ❌ SyntaxError：with 在严格模式被禁
}
```

### 6. this 在普通调用里是 undefined

非严格模式下，普通调用（非方法、非 `new`）的函数里 `this` 指向全局对象（浏览器是 `window`）；严格模式下是 `undefined`——避免意外污染全局：

```js
"use strict";
function fn() {
  return this;
}
console.log(fn()); // undefined（非严格：window / globalThis）
console.log(fn.call(42)); // 42（显式指定的 this 不会被包装成对象）
```

### 7. eval 与 arguments 行为收紧

```js
"use strict";
eval("var leaked = 1;");
console.log(typeof leaked); // "undefined"（eval 不再向外泄漏变量）

function f(a) {
  "use strict";
  a = 99;
  return arguments[0]; // 严格模式返回原始实参，不随 a 变（非严格会变 99）
}
console.log(f(1)); // 1
```

### 8. 额外保留字

严格模式额外保留这些字，不能用作变量 / 函数名（为将来语言特性预留）：`implements`、`interface`、`let`、`package`、`private`、`protected`、`public`、`static`、`yield`。

```js
"use strict";
let public = 1; // ❌ SyntaxError: Unexpected strict mode reserved word
```

## 必背历史怪癖

即便在严格模式，下面这些**语言层面的历史包袱**依旧存在，必须记住。

### typeof null === "object"

JavaScript 第一版的实现遗留，因兼容性无法修复。判断 `null` 用 `=== null`：

```js
typeof null; // "object" ← 不是 "null"
const v = null;
v === null; // true ← 正确判断方式
```

### NaN 不等于自身

`NaN` 是唯一 `x !== x` 成立的值，检测要用 `Number.isNaN`（详见 [转换与相等页](./type-conversion-equality)）：

```js
NaN === NaN; // false
Number.isNaN(NaN); // true ← 正确检测
```

### 自动分号插入（ASI）

JavaScript 允许省略行尾分号，引擎会在解析出错时「自动补分号」。绝大多数时候它如你所愿，但**少数情况会改变语义**，这是不写分号风格最大的风险点。

::: warning ASI 三大雷区
**雷区 1：`return` 后换行。** 引擎会在 `return` 后补分号，导致返回 `undefined`：

```js
function bad() {
  return; // ← ASI 在此补了分号！
  {
    ok: 1;
  } // 这段永远不会被返回
}
console.log(bad()); // undefined

function good() {
  return {
    // ← 左花括号紧跟 return 同一行才对
    ok: 1,
  };
}
```

`throw`、`break`、`continue`、`++` / `--`（后缀）后换行也有类似问题。

**雷区 2：下一行以 `(` 开头。** 会被当作上一行结果的「函数调用」：

```js
const a = 1
const b = a
(function () {})() // ← 实为 a(function(){})()，TypeError: a is not a function
```

**雷区 3：下一行以 `[` 或 `` ` `` 开头。** `[` 被当成属性访问 / 索引，`` ` `` 被当成标签模板：

```js
const x = obj
[key].doSomething() // ← 实为 obj[key]，可能不是你想要的
```

:::

::: tip ASI 的实用结论
两种风格都能写出正确代码，但要二选一并贯彻：

1. **全程写分号**（多数团队 / Prettier 默认）——彻底规避 ASI 歧义；
2. **无分号风格**——则必须给以 `(` / `[` / `` ` `` 开头的行**前置分号**（`;(function(){})()`），并牢记 `return` 不能换行。

无论哪种，都交给 **Prettier / ESLint** 自动处理，别靠手动记忆。

:::

## 小结

严格模式（module / class 默认开启）把隐式全局、静默赋值失败、`this` 指向全局等一批坑变成显式报错，是现代代码的安全基线。同时记牢三个绕不开的历史怪癖：`typeof null === "object"`、`NaN !== NaN`、以及 ASI 在 `return` 换行等场景下会改变语义。至此本叶的语言基础全部讲完，更系统的速查与权威链接见 [参考](../reference)。
