---
layout: doc
outline: [2, 3]
---

# 解构赋值

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 数组解构**按位置**：`const [a, b] = [1, 2]`；用逗号跳过：`const [, , c] = arr`
- 对象解构**按属性名**：`const { x, y } = obj`；顺序无关
- 默认值：`const [a = 1] = []`、`const { x = 0 } = {}`——仅当值为 `undefined` 时生效，`null` **不**触发
- 重命名：`const { x: foo } = obj`（把 `obj.x` 存进 `foo`）；可与默认值合用 `{ x: foo = 1 }`
- 剩余 `...`：`const [first, ...rest] = arr`、`const { a, ...others } = obj`，**必须放最后**且不能带尾逗号
- 交换变量：`[a, b] = [b, a]`，无需临时变量
- 嵌套：`const { user: { name } } = data`、`const [, { id }] = list`，按结构层层解
- 函数参数解构 + 默认：`function f({ size = "big" } = {}) {}`，末尾 `= {}` 让「不传参」也安全
- 计算属性名：`const { [key]: val } = obj`，用变量当键
- 给已有变量解构对象要加括号：`;({ a, b } = obj)`，否则 `{}` 被当代码块
- 数组解构走**可迭代协议**：字符串、`Map`、`Set` 都能解构；普通对象不可迭代会抛错

## 数组解构：按位置取值

```js
const [a, b, c] = [1, 2, 3];
console.log(a, b, c); // 1 2 3

// 跳过元素：用「空逗号」占位
const [first, , third] = ["甲", "乙", "丙"];
console.log(first, third); // "甲" "丙"

// 经典用途：交换变量，不需要临时变量
let x = 1,
  y = 2;
[x, y] = [y, x];
console.log(x, y); // 2 1
```

### 默认值

当对应位置是 `undefined`（缺失或显式 `undefined`）时，默认值生效；注意 `null` **不会**触发默认值：

```js
const [a = 10, b = 20] = [1]; // a=1, b=20（b 缺失，用默认）
const [c = 5] = [undefined]; // c=5（undefined 触发默认）
const [d = 5] = [null]; // d=null（null 是有效值，不触发默认）
```

### 剩余元素 `...`

把「剩下的」收进一个新数组，**必须是最后一项**：

```js
const [head, ...tail] = [1, 2, 3, 4];
console.log(head); // 1
console.log(tail); // [2, 3, 4]
```

```js
// ❌ 剩余元素后不能再有元素，也不能带尾逗号
// const [a, ...rest, b] = arr;  // SyntaxError
// const [a, ...rest,] = arr;    // SyntaxError
```

## 对象解构：按属性名取值

数组按位置，对象则**按属性名**匹配，顺序无关：

```js
const user = { name: "张三", age: 18, city: "北京" };

const { name, age } = user;
console.log(name, age); // "张三" 18（city 没解构，忽略即可）
```

### 重命名（别名）

`属性名: 新变量名`——把属性值存进一个不同名字的变量：

```js
const obj = { p: 42, q: true };
const { p: foo, q: bar } = obj;
console.log(foo, bar); // 42 true
// 注意：这里 p、q 不再是变量，foo、bar 才是
```

### 默认值与「重命名 + 默认值」

```js
const { a = 1, b = 2 } = { a: 10 };
console.log(a, b); // 10 2

// 重命名同时给默认值：obj.x → 变量 foo，缺失则默认 99
const { x: foo = 99 } = {};
console.log(foo); // 99
```

### 剩余属性 `...`

收集「未被解构的其余属性」成一个新对象（常用于「去掉某个字段」）：

```js
const { password, ...safe } = { id: 1, name: "A", password: "secret" };
console.log(safe); // { id: 1, name: "A" }（剥离了 password）
```

## 嵌套解构

按照数据的**结构形状**层层书写即可：

```js
const data = {
  id: 42,
  user: {
    name: "Jane",
    roles: ["admin", "editor"],
  },
};

// 取嵌套对象里的属性，并重命名
const {
  user: { name: userName, roles: [firstRole] },
} = data;
console.log(userName, firstRole); // "Jane" "admin"
```

```js
// 数组里嵌对象：跳过前两个，取第三个的 name
const props = [
  { id: 1, name: "Fizz" },
  { id: 2, name: "Buzz" },
  { id: 3, name: "FizzBuzz" },
];
const [, , { name }] = props;
console.log(name); // "FizzBuzz"
```

::: tip 嵌套解构只「取」不「建」
`const { user: { name } } = data` 解构出的是 `name`，**`user` 并不会成为变量**。它只是「路径」。若两者都要，得分别写：`const { user, user: { name } } = data`。
:::

## 函数参数解构

把「接收一个配置对象」的函数写得既清晰又带默认值，是解构最高频的实战场景：

```js
// 直接在参数位解构，命名清晰
function greet({ name, greeting = "你好" }) {
  return `${greeting}，${name}`;
}
greet({ name: "张三" }); // "你好，张三"

// 配置对象 + 整体默认值：让「完全不传参」也能跑
function drawChart({ size = "big", coords = { x: 0, y: 0 }, radius = 25 } = {}) {
  return { size, coords, radius };
}
drawChart(); // 全用默认值（靠末尾的 = {}）
drawChart({ radius: 30 }); // 只覆盖 radius
```

::: warning 参数解构一定要补 `= {}`
若写成 `function f({ size } = ...)` 却漏了整体默认 `= {}`，调用 `f()` 不传参时会对 `undefined` 解构而**抛错**（`Cannot destructure property ... of undefined`）。给参数一个 `= {}` 兜底即可。
:::

数组参数解构同理，常用于返回「元组」的 API（如 React 的 `useState`）：

```js
// 形如 useState 的返回值：返回 [值, 更新函数]
const [count, setCount] = useState(0);
```

## 两个进阶点

### 计算属性名

用变量（或表达式）当解构的键：

```js
const key = "name";
const { [key]: value } = { name: "张三" };
console.log(value); // "张三"
```

### 给「已存在的变量」解构对象要加括号

声明时解构不需要括号；但若变量已声明、想直接赋值，整条语句必须用 `()` 包起来——否则开头的 `{` 会被解析成「代码块」而非「对象模式」：

```js
let a, b;

// ❌ { a, b } = ... 会被当成代码块 → 语法错误
// ✅ 用圆括号包住整个赋值表达式
({ a, b } = { a: 1, b: 2 });
console.log(a, b); // 1 2
```

## 解构走的是可迭代协议

数组解构本质上调用对象的**迭代器**，所以任何「可迭代对象」都能用数组解构——不限于真数组：

```js
// 字符串可迭代
const [c1, c2] = "hi"; // c1="h", c2="i"

// Map 可迭代（每次产出 [键, 值]）
const [entry1] = new Map([
  ["a", 1],
  ["b", 2],
]);
console.log(entry1); // ["a", 1]

// 但「类数组」普通对象不可迭代，数组解构会抛错
const obj = { 0: "a", 1: "b", length: 2 };
// const [x, y] = obj; // ❌ TypeError: obj is not iterable
```

这条「解构依赖可迭代协议」的事实，正是把你引向本叶最后一页 [可迭代协议与 Iterator Helpers](./iterables-iterator-helpers) 的线索。

## 小结

数组解构按位置、对象解构按名字，默认值（仅对 `undefined`）、重命名、剩余 `...`、嵌套、函数参数解构组合起来，能把繁琐的取值代码压成一行。下一页讲与解构同形、却方向相反的伙伴——[扩展与剩余 `...`](./spread-rest)：同一个 `...`，在不同位置分别承担「展开」与「收集」。
