---
layout: doc
outline: [2, 3]
---

# 对象基础

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 对象字面量 `{}`：键可写成标识符 `a`、字符串 `"property n"`、数字字面量 `2`；值任意，可嵌套对象
- 键的本质是**字符串或 Symbol**——非字符串键（如数字、对象）都会被 `String()` 转成字符串
- 点号 `o.a`：键是合法标识符时用；方括号 `o["a"]` / `o[expr]`：键含空格 / 数字开头 / 来自变量 / 动态计算时用
- 不存在的属性返回 `undefined`（不是 `null`）；别拿它判断键是否存在
- `key in o`：判断属性是否存在（**含原型链**），返回布尔；`delete o.key`：删除自有属性（删不掉继承的）
- 计算属性名：`{ [expr]: v }`，`expr` 求值后转字符串作键；可与模板字符串组合 `{ [`k-${i}`]: v }`
- 简写属性：`{ x, y }` ≡ `{ x: x, y: y }`；方法简写：`{ greet() {} }` ≡ `{ greet: function () {} }`
- `this` 指向「点号前的对象」，由调用方式决定，不由定义位置决定
- 别用外部输入直接拼方括号键名（对象注入风险）；遍历自有键用 `Object.keys` 或 `Object.hasOwn` 过滤

## 对象字面量与键

创建对象最常用的是**对象字面量**——一对花括号，里面列出键值对：

```js
const car = {
  make: "Ford", // 键是标识符
  "model name": "Mustang", // 键含空格，必须加引号
  2: "two", // 数字字面量键
  engine: { cylinders: 4, size: 2.2 }, // 值可以是嵌套对象
};
```

每写一次字面量就**新建一个不同的对象**。键看起来可以是标识符、字符串、数字，但底层规则只有一条：**键只能是字符串或 Symbol**。任何非 Symbol 的键最终都会被转成字符串——所以 `2` 这个键实际是 `"2"`，数组下标也只是键为 `"0"` / `"1"` 的普通属性。

```js
const obj = {};
const anotherObj = {};
obj[anotherObj] = "v"; // 键是对象？会被转成字符串 "[object Object]"
console.log(Object.keys(obj)); // ["[object Object]"]
```

## 点号 vs 方括号

读写属性有两种语法：

```js
// 点号：键是合法标识符时
car.make = "Ford";
const model = car.make;

// 方括号：键含空格 / 数字开头 / 来自变量 / 动态计算
car["model name"] = "Mustang";
const key = "make";
console.log(car[key]); // "Ford"（动态键只能用方括号）
```

点号的限制：**不能**用于含空格或连字符的键、数字开头的键，以及「键存在变量里」的情形。这些场景一律用方括号。

::: warning 用变量当键时别想当然
```js
const str = "myString";
const o = {};
o[str] = "存进去了";
console.log(o.myString); // undefined —— o.myString 找的是字面键 "myString"
console.log(o.str); // undefined —— o.str 找的是字面键 "str"
console.log(o[str]); // "存进去了" —— 正确：用变量 str 的值 "myString" 当键
```
:::

访问**不存在的属性**返回 `undefined`，不是报错、也不是 `null`：

```js
console.log(car.color); // undefined
```

正因如此，不能用「值是不是 `undefined`」来判断键存不存在（键存在但值就是 `undefined` 的情况无法区分）——这正是 `in` 运算符的用武之地。

## `in` 运算符：属性是否存在

`in` 检测某个键是否存在于对象**或其原型链**上，返回布尔值：

```js
const o = { a: 5, b: 12 };
console.log("a" in o); // true
console.log("c" in o); // false
console.log("toString" in o); // true —— 继承自 Object.prototype
```

注意最后一行：`in` 会顺着原型链查，所以连 `toString` 这种继承来的方法也算「存在」。若只想知道是不是**自有属性**，用 `Object.hasOwn(o, "a")`（详见 [Object 静态方法](./object-static-methods)）。

## `delete` 运算符：删除属性

`delete` 删除对象的**自有属性**：

```js
const o = { a: 5, b: 12 };
delete o.a;
console.log("a" in o); // false
console.log(o.a); // undefined
```

两个要点：

- `delete` **只能删自有属性**，删不掉从原型链继承来的属性（要改变继承行为得操作原型本身）；
- 删除是真正移除键，而非把值设为 `undefined`——删除后 `"a" in o` 为 `false`，而设 `undefined` 仍为 `true`。

## 计算属性名

键名需要在运行时算出来时，用方括号把表达式包在字面量里——这叫**计算属性名**（ES2015）：

```js
const prefix = "user";
const id = 42;
const record = {
  [prefix]: "Ada", // 键为 "user"
  [`${prefix}-${id}`]: true, // 键为 "user-42"（配合模板字符串）
  [Symbol.iterator]: function* () {}, // 键也可以是 Symbol
};
console.log(record.user); // "Ada"
```

表达式求值后会转成字符串（Symbol 除外）作为键。这在「根据数据动态生成键」时非常有用，省去了「先建空对象再 `obj[key] = v`」的两步写法。

## 简写属性与方法

当属性值来自同名变量时，可用**简写属性**：

```js
const x = 1;
const y = 2;
const point = { x, y }; // 等价于 { x: x, y: y }
console.log(point); // { x: 1, y: 2 }
```

定义方法时可用**方法简写**，省去 `: function`：

```js
const counter = {
  count: 0,
  // 方法简写
  increment() {
    this.count += 1;
  },
  // 等价于：increment: function () { this.count += 1; }
};
counter.increment();
console.log(counter.count); // 1
```

## `this`：指向「点号前的对象」

方法里的 `this` 指向**调用时点号前的那个对象**——由调用方式决定，而非定义位置。把同一个函数赋给不同对象，`this` 就指向不同对象：

```js
function sayHi() {
  console.log(`Hi, I'm ${this.name}`);
}
const a = { name: "Ada" };
const b = { name: "Bob" };
a.sayHi = sayHi;
b.sayHi = sayHi;
a.sayHi(); // Hi, I'm Ada
b.sayHi(); // Hi, I'm Bob
```

可以把 `this` 理解成一个「隐藏参数」，谁在它前面点它，它就是谁。需要显式指定时用 `call` / `apply` / `bind`（`this` 的完整规则属于函数主题，这里只需记住「方法里的 `this` 跟着调用对象走」）。

## 对象注入风险

用**外部不可信输入**直接拼方括号键名是危险的：

```js
// ⚠️ 危险：userInput 若为 "__proto__" 等可能造成原型污染
obj[userInput] = value;
```

攻击者可借此写入 `__proto__`、`constructor` 等特殊键，污染原型。处理外部输入时应校验键名白名单，或改用 `Map`（`Map` 的键与原型链无关，天然免疫这类问题）。

## 小结

对象字面量、点号 / 方括号、`in`、`delete`、计算属性名、简写——这些是与对象打交道的最小语法集。它们共同的底层事实是：**属性键是字符串或 Symbol，访问不存在的键得到 `undefined`，而 `in` 与读取都会触及原型链**。下一页深入属性那三个常被忽略的开关：[属性描述符](./property-descriptors)。
