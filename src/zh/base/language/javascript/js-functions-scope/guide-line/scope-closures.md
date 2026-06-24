---
layout: doc
outline: [2, 3]
---

# 作用域链与闭包

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **词法作用域**：变量在哪里可见，由它在**源码中的书写位置**决定（不是调用位置）——内层函数能读外层变量，外层读不到内层
- **作用域链**：查变量时沿「当前 → 外层 → … → 全局」逐级向上找，找到即止，到顶仍无则 `ReferenceError`
- **词法环境（Lexical Environment）**：内部规范对象，含「环境记录」（存本层变量）+「外层引用」（指向父环境）
- `[[Environment]]`：每个函数都有的隐藏属性，记住它**被创建时**所处的词法环境——这是闭包的实现根基
- **闭包**：函数 + 它创建时的词法环境；函数即便被返回到外部，仍能访问外层变量。**JS 里所有函数天生都是闭包**
- 每次调用外层函数，都生成一份**独立**的词法环境与闭包（多个计数器互不干扰）
- **循环陷阱**：`var` 在循环里只有一个绑定，所有闭包共享它 → 全部拿到最后的值；用 `let`/`const`（每轮一个新绑定）或 IIFE / 函数工厂解决
- **模块模式**：用 IIFE / 工厂函数把变量藏进闭包，只暴露方法 → 实现私有状态
- **垃圾回收**：闭包引用的外层环境不会被回收；不再需要时解除引用，避免内存占用

## 词法作用域：位置决定可见性

「词法」（lexical）指的是「按源码书写位置」。一个变量对哪些代码可见，在**写代码时**就定了，与运行时怎么调用无关：

```js
function init() {
  const name = "Mozilla"; // init 的局部变量
  function displayName() {
    console.log(name); // 内层函数读到了外层的 name
  }
  displayName();
}
init(); // "Mozilla"
```

内层 `displayName` 能读外层 `name`，但反过来不行——外层访问不到内层声明的变量。这种「内能看外、外不能看内」就是词法作用域的核心规则。

### 作用域链：逐级向上查找

函数可以多层嵌套，变量查找沿「作用域链」一级级向外：

```js
function A(x) {
  function B(y) {
    function C(z) {
      console.log(x + y + z); // C 同时读到 x（来自 A）、y（来自 B）、z（自己）
    }
    C(3);
  }
  B(2);
}
A(1); // 6 —— 链路：C → B → A → 全局
```

若内外层有同名变量，**内层优先**（就近原则），查到就停止：

```js
function outside() {
  const x = 5;
  function inside(x) {
    return x * 2; // 用 inside 自己的参数 x，不是外层的 5
  }
  return inside;
}
outside()(10); // 20
```

## 词法环境与 `[[Environment]]`

要理解闭包「怎么记住变量」，需要两个底层概念：

- **词法环境（Lexical Environment）** 是一个内部规范对象，由两部分组成：**环境记录**（Environment Record，把本层的局部变量当属性存着）+ **对外层环境的引用**。所谓「读 / 写一个变量」，本质就是「读 / 写环境记录这个对象的某个属性」。
- 每个函数都带一个隐藏属性 **`[[Environment]]`**，记录它**被创建时**所处的那个词法环境。函数运行时要查外层变量，就顺着自己的 `[[Environment]]` 往上找。

正因为函数「随身携带」创建时的环境引用，即便外层函数早已执行完毕，只要内层函数还活着，外层的变量就不会消失。

## 闭包：函数 + 它的词法环境

**闭包**就是「一个函数」与「它被创建时的词法环境」捆绑在一起。它让函数即使被搬到别处执行，也仍然能访问当初定义处的外层变量：

```js
function makeFunc() {
  const name = "Mozilla";
  return function displayName() {
    console.log(name);
  };
}

const myFunc = makeFunc(); // makeFunc 已执行完
myFunc(); // "Mozilla" —— name 仍可访问
```

`makeFunc` 返回后理论上其局部变量该被回收，但返回的 `displayName` 通过 `[[Environment]]` 仍引用着那个环境，于是 `name` 被「闭住」、继续存活。

::: tip 一句话定义
闭包 = **一个能记住并访问其外层变量的函数**。在 JavaScript 里，函数在创建时自动成为闭包——所以「所有函数都是闭包」并不夸张。
:::

### 计数器：闭包保存私有状态

```js
function makeCounter() {
  let count = 0; // 私有变量
  return function () {
    return count++; // 每次调用读改同一个 count
  };
}

const counter = makeCounter();
counter(); // 0
counter(); // 1
counter(); // 2
```

`count` 对外部完全不可见，只能通过返回的函数间接操作——这就是闭包做「数据封装」的基础。

### 每次调用生成独立闭包

每调用一次外层函数，就新建一份词法环境，于是多个闭包**互不干扰**：

```js
const counter1 = makeCounter();
const counter2 = makeCounter();
counter1(); // 0
counter1(); // 1
counter2(); // 0 —— 与 counter1 完全独立
```

### 函数工厂

闭包能「记住」工厂函数传入的参数，批量生产定制函数：

```js
function makeAdder(x) {
  return function (y) {
    return x + y; // 记住了各自的 x
  };
}

const add5 = makeAdder(5);
const add10 = makeAdder(10);
add5(2); // 7
add10(2); // 12
```

## 循环里的闭包陷阱

这是闭包最著名的坑。用 `var` 时，整个循环只有**一个** `i`/`item` 绑定，所有回调闭住的是同一个变量；等回调真正执行时，循环早已结束，它们读到的都是**最后一次**的值：

```js
// ❌ var：三个回调共享同一个 item，最终都指向最后一条
for (var i = 0; i < helpText.length; i++) {
  var item = helpText[i];
  document.getElementById(item.id).onfocus = function () {
    showHelp(item.help); // 全部显示最后一条的 help
  };
}
```

### 解法一：用 `let` / `const`（首选）

`let`/`const` 是**块级作用域**，循环每一轮都会创建一个**新的绑定**，每个闭包各自捕获当轮的值：

```js
for (let i = 0; i < helpText.length; i++) {
  const item = helpText[i];
  document.getElementById(item.id).onfocus = () => {
    showHelp(item.help); // 正确：各自捕获本轮 item
  };
}
```

### 解法二：函数工厂

```js
function makeHelpCallback(help) {
  return function () {
    showHelp(help);
  };
}
for (var i = 0; i < helpText.length; i++) {
  const item = helpText[i];
  document.getElementById(item.id).onfocus = makeHelpCallback(item.help);
}
```

### 解法三：IIFE 当场冻结值

```js
for (var i = 0; i < helpText.length; i++) {
  (function () {
    var item = helpText[i];
    document.getElementById(item.id).onfocus = function () {
      showHelp(item.help);
    };
  })(); // 立即执行，为每轮单独建一层作用域
}
```

::: tip 现代首选 let
解法一最简洁、最直观，是现代代码的默认做法；`var` 时代才需要工厂或 IIFE。理解后两者主要为读懂老代码。
:::

## 模块模式：闭包实现私有

把变量藏进闭包、只暴露方法，就得到「带私有状态」的模块：

```js
const counter = (function () {
  let privateCounter = 0; // 外部无法直接访问
  function changeBy(val) {
    // 私有方法
    privateCounter += val;
  }
  return {
    increment() {
      changeBy(1);
    },
    decrement() {
      changeBy(-1);
    },
    value() {
      return privateCounter;
    },
  };
})();

counter.value(); // 0
counter.increment();
counter.increment();
counter.value(); // 2
counter.decrement();
counter.value(); // 1
```

三个返回的方法共享同一份词法环境（`privateCounter` 与 `changeBy`），外界只能通过它们间接读写，无法直接触碰私有变量。

## 性能与垃圾回收

闭包引用的外层环境只要可达就**不会被回收**——这是特性，但用不好会浪费内存。两点实践：

- **别在构造函数里给实例方法**：每 `new` 一个实例就重新创建一遍方法（和对应闭包）。共享方法应挂到 `prototype` 上，只定义一次：

```js
// ❌ 每个实例都新建 getName 闭包
function Obj(name) {
  this.name = name;
  this.getName = function () {
    return this.name;
  };
}
// ✅ 方法挂原型，所有实例共享
function Obj(name) {
  this.name = name;
}
Obj.prototype.getName = function () {
  return this.name;
};
```

- **不再需要时解除引用**：长期持有的闭包（如挂在全局的回调）会让其外层变量一直存活；及时置空引用，让 GC 回收。

::: warning V8 调试器的「优化」坑
Chrome 的 V8 引擎在调试时会优化掉「代码中未被引用」的外层变量——于是断点处可能看不到某个理论上应可访问的外层变量。这是已知的调试怪象，不代表闭包没捕获它。
:::

## 下一步

闭包解释了「变量怎么被记住」，而函数运行时的另一条主线是「`this` 指向谁」。下一页系统讲解 [`this` 的四条规则](./this-rules)——默认、隐式、显式、`new`，以及最常见的 `this` 丢失场景。
