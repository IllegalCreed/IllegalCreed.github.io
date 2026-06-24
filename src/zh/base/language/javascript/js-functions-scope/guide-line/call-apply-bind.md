---
layout: doc
outline: [2, 3]
---

# `call` / `apply` / `bind`

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 三者都用来**显式指定 `this`**（即 [`this` 的四条规则](./this-rules) 里的「显式绑定」）
- `func.call(thisArg, a, b, c)`：**立即调用**，参数**逐个**列出
- `func.apply(thisArg, [a, b, c])`：**立即调用**，参数放在**数组**里
- `func.bind(thisArg, a, b)`：**不调用**，返回一个 `this` 永久锁定的**新函数**（可预填部分参数 = 偏函数）
- 记忆：**c**all = **c**omma（逗号分隔）、**a**pply = **a**rray（数组）、**b**ind = **b**ound later（稍后再调）
- `thisArg` 传 `null`/`undefined`：严格模式下 `this` 就是它，非严格模式回退全局对象
- **函数借用**：把一个对象的方法借给另一个对象 / 类数组用（如让 `arguments` 用 `Array` 方法）
- 对**箭头函数**这三者改不动 `this`（已在定义时锁定），只能传参
- 现代替代：展开运算符 `f(...arr)` 常可替代 `apply`；剩余参数 / 默认参数常可替代 `bind` 预填参数

## 三者总览

`call`、`apply`、`bind` 是每个函数都有的方法，作用都是**手动把 `this` 指给某个对象**。区别在于「立即还是延后调用」「参数怎么传」：

```js
function introduce(greeting, punctuation) {
  return `${greeting}, 我是 ${this.name}${punctuation}`;
}
const user = { name: "小明" };

introduce.call(user, "你好", "！"); // 立即调用，参数逗号分隔
introduce.apply(user, ["你好", "！"]); // 立即调用，参数装数组
const bound = introduce.bind(user); // 返回新函数，this 锁定 user
bound("你好", "！"); // 之后再调用
```

三者首参都是 `thisArg`——函数体里 `this` 要指向的对象。

## `call`：立即调用，参数逐个列

```js
function greet() {
  return `Hi, ${this.name}`;
}
greet.call({ name: "Ann" }); // "Hi, Ann"
greet.call({ name: "Bob" }, "extra1", "extra2"); // 额外参数依次跟在 thisArg 后
```

## `apply`：立即调用，参数用数组

`apply` 与 `call` 唯一区别是**参数以数组形式**传入。当参数本来就在数组里时特别顺手：

```js
const numbers = [5, 6, 2, 3, 7];

// 经典用法：借 Math.max 求数组最大值（Math.max 不接受数组）
Math.max.apply(null, numbers); // 7
Math.min.apply(null, numbers); // 2
```

::: tip 现代用展开运算符替代 apply
ES6 的展开运算符常能更清晰地替代 `apply`：

```js
Math.max(...numbers); // 7 —— 比 apply(null, numbers) 更直观
```

仅当还需要同时指定 `this` 时，`apply` 才不可替代。
:::

## `bind`：返回永久绑定的新函数

`bind` **不立即调用**，而是返回一个 `this` 被永久固定的新函数——之后无论怎么调用（哪怕当回调、被 `obj.x()` 形式调用），`this` 都不变：

```js
const user = {
  name: "Ann",
  greet() {
    return `Hi, ${this.name}`;
  },
};

const boundGreet = user.greet.bind(user);
boundGreet(); // "Hi, Ann"
setTimeout(boundGreet, 1000); // 1 秒后仍是 "Hi, Ann"，this 不丢
```

这正是解决「[`this` 丢失](./this-rules)」的主力手段——把方法当回调传出去前，先 `bind` 住。

::: warning bind 一次即定，不可再改
`bind` 出来的函数，`this` 已锁死，再 `call`/`apply`/`bind` 都改不了它的 `this`（只能继续传参）。唯一能「盖过」`bind` 的是 `new`（`new` 绑定优先级最高）。
:::

## 函数借用

`call`/`apply` 让一个对象「借用」另一个对象上的方法，无需继承或复制。最经典的是让**类数组对象**（如 `arguments`、旧式 DOM 集合）用上真正的 `Array` 方法：

```js
function listArgs() {
  // arguments 是类数组，本身没有 slice；借 Array.prototype.slice
  const args = Array.prototype.slice.call(arguments);
  return args.map((x) => x * 2); // 转成真数组后就能 map 了
}
listArgs(1, 2, 3); // [2, 4, 6]
```

也可在对象之间借方法：

```js
const dog = {
  name: "旺财",
  speak() {
    return `${this.name} 汪汪`;
  },
};
const cat = { name: "咪咪" };
dog.speak.call(cat); // "咪咪 汪汪" —— cat 借用了 dog 的 speak
```

::: tip 现代借用类数组的更优写法
`Array.from(arguments)` 或 `[...arguments]` 比 `Array.prototype.slice.call(arguments)` 更易读；而剩余参数 `...args` 从一开始就给真数组，往往连「借用」都不需要。
:::

## 偏函数：`bind` 预填参数

`bind` 除了固定 `this`，还能**预先填入前几个参数**，得到一个「参数更少」的新函数——这就是偏函数（partial application）：

```js
function multiply(a, b) {
  return a * b;
}

// 固定第一个参数 a = 2（this 用不到，传 null）
const double = multiply.bind(null, 2);
double(5); // 10  —— 等价于 multiply(2, 5)
double(8); // 16

// 再如：固定前缀
function prefix(pre, str) {
  return `${pre}${str}`;
}
const withDollar = prefix.bind(null, "$");
withDollar("100"); // "$100"
```

预填的参数排在最前，调用时新传的参数依次接在后面。关于偏函数与柯里化的系统讲法，见 [高阶函数](./higher-order-functions)。

## 三者对比速查

| 方法 | 是否立即调用 | 参数形式 | 返回值 | 典型场景 |
| --- | --- | --- | --- | --- |
| `call` | 是 | 逗号分隔 `(this, a, b)` | 函数执行结果 | 借用方法、显式指定 `this` |
| `apply` | 是 | 数组 `(this, [a, b])` | 函数执行结果 | 参数已在数组里（或求数组极值） |
| `bind` | 否 | 逗号分隔（可预填） | 新函数 | 防 `this` 丢失、偏函数 |

## 小结

`call`/`apply` 是「现在就调用、顺便指定 `this`」，区别只在参数装不装数组；`bind` 是「先做一个 `this` 固定好的函数，以后再调」。三者合称「显式绑定」，是手动掌控 `this` 的核心工具。

## 下一步

`bind` 的偏函数本质上是把「函数当数据来加工」。下一页进入更广阔的 [高阶函数](./higher-order-functions)——函数作参数 / 返回值、柯里化、偏函数与函数组合。
