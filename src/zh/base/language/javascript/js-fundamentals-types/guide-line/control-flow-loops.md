---
layout: doc
outline: [2, 3]
---

# 控制流与循环

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 分支：`if / else if / else`、三元 `? :`、`switch`（用 `===` 匹配，需 `break` 防穿透）
- 三种基础循环：`for`（已知次数）、`while`（先判断）、`do...while`（至少执行一次）
- `for...of`：遍历**可迭代对象的值**（数组 / 字符串 / Set / Map / arguments）——遍历数组首选
- `for...in`：遍历**对象的可枚举键名**（含继承属性）——用于对象，**不要用来遍历数组**
- `break` 跳出整个循环；`continue` 跳过本轮进入下一轮
- 标签 `label:` + `break label` / `continue label`：精准跳出 / 继续**外层**循环
- `switch` 的 `case` 严格相等匹配；漏写 `break` 会「穿透」到下一个 `case`
- 数组遍历优先 `for...of` 或 `forEach` / `map`；需要索引用 `entries()` 或 `for...of` 配 `entries`
- `Object.keys/values/entries` + `for...of` 是遍历对象更安全的现代写法

## 条件分支

### if / else

条件按 [truthy / falsy 规则](./type-conversion-equality)判定：

```js
const score = 75;
if (score >= 90) {
  console.log("优秀");
} else if (score >= 60) {
  console.log("及格");
} else {
  console.log("不及格");
}
```

::: tip 小心隐式 falsy 判断
`if (value)` 会把 `0` / `""` / `null` / `undefined` / `NaN` 全判为假。若只想判断「是否为空」，写明确条件更安全：`if (value != null)`（同时排除 `null` 和 `undefined`）或 `if (arr.length > 0)`。

:::

### 三元运算符

适合在表达式位置做简单二选一，别拿它写复杂逻辑（可读性差）：

```js
const label = isVip ? "尊享会员" : "普通用户";
// 可嵌套但不推荐：a ? x : b ? y : z
```

### switch

`switch` 用**严格相等（`===`）**匹配 `case`，因此 `case "1"` 不会匹配数字 `1`：

```js
switch (fruit) {
  case "apple":
    console.log("苹果");
    break; // ← 必须 break，否则穿透到下一个 case
  case "banana":
    console.log("香蕉");
    break;
  default:
    console.log("未知水果");
}
```

::: warning case 穿透（fall-through）
漏写 `break`，执行会「掉落」到下一个 `case` 继续跑，直到遇到 `break` 或结束。多数时候这是 Bug，但也能**有意利用**做多值合并：

```js
switch (day) {
  case "六":
  case "日":
    console.log("周末"); // 六、日都进这里
    break;
  default:
    console.log("工作日");
}
```

:::

## 三种基础循环

### for —— 次数已知

```js
for (let i = 0; i < 5; i++) {
  console.log(i); // 0 1 2 3 4
}
```

三段：初始化、条件、迭代后表达式，均可省略（`for (;;)` 是无限循环）。计数器**务必用 `let`**（见 [变量声明页](./variable-declarations) 的闭包陷阱）。

### while —— 先判断再执行

```js
let n = 0;
while (n < 3) {
  console.log(n);
  n++;
}
```

### do...while —— 至少执行一次

先执行循环体再判断，因此**无论条件如何都跑一遍**：

```js
let i = 10;
do {
  console.log(i); // 即便 i 已不满足条件，也会输出一次 10
} while (i < 5);
```

## for...of vs for...in（核心区分）

这是初学者最容易混淆、也最该讲清的一对。

### for...of —— 遍历「值」（可迭代对象）

遍历**可迭代对象**（数组、字符串、`Set`、`Map`、`arguments`、`NodeList` 等）的**元素值**。**遍历数组首选它**：

```js
const arr = ["a", "b", "c"];
for (const item of arr) {
  console.log(item); // "a" "b" "c"（拿到的是值）
}

for (const ch of "Hi") {
  console.log(ch); // "H" "i"
}

// 需要索引时配 entries()
for (const [i, val] of arr.entries()) {
  console.log(i, val); // 0 "a" / 1 "b" / 2 "c"
}
```

### for...in —— 遍历「键名」（对象属性）

遍历对象的**可枚举属性名（字符串键）**，**包含原型链上继承的可枚举属性**。它是为**对象**设计的：

```js
const obj = { x: 1, y: 2 };
for (const key in obj) {
  console.log(key, obj[key]); // "x" 1 / "y" 2（拿到的是键名）
}
```

::: warning 不要用 for...in 遍历数组
`for...in` 用于数组有三个隐患，所以数组遍历**永远别用它**：

1. 拿到的是**字符串下标**（`"0"` / `"1"`）而非数字，也非元素值；
2. **不保证顺序**（规范允许引擎自由排列整数键之外的顺序）；
3. 会**遍历到自定义 / 继承的可枚举属性**，把不该出现的键也带进来。

```js
const arr = ["a", "b"];
arr.extra = "X"; // 给数组加了个属性
for (const i in arr) {
  console.log(i); // "0" "1" "extra" ← extra 也被遍历到了！
}
```

数组用 `for...of`、`forEach`、`map` 等；遍历对象自身属性用 `Object.keys(obj)` / `Object.entries(obj)` 配 `for...of` 更可控。

:::

### 三者速记

| 写法 | 遍历对象 | 拿到什么 | 典型用途 |
| --- | --- | --- | --- |
| `for...of` | 可迭代对象 | **值** | 数组 / 字符串 / Set / Map |
| `for...in` | 对象 | **键名（含继承）** | 普通对象（慎用于数组） |
| `Object.entries + for...of` | 对象自身 | **[键, 值]** | 安全遍历对象自有属性 |

```js
// 现代遍历对象的推荐写法
const user = { name: "Ada", age: 36 };
for (const [key, value] of Object.entries(user)) {
  console.log(`${key}: ${value}`);
}
```

## break 与 continue

```js
for (let i = 0; i < 10; i++) {
  if (i === 3) continue; // 跳过本轮，进入下一轮
  if (i === 6) break; // 立即跳出整个循环
  console.log(i); // 0 1 2 4 5
}
```

## 标签语句（label）

给循环命名后，可用 `break label` / `continue label` 操作**指定的外层循环**——这是嵌套循环里跳出多层的标准手段：

```js
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) {
      break outer; // 直接跳出最外层 outer，而非仅内层
    }
    console.log(i, j);
  }
}
// 输出：0 0 / 0 1 / 0 2 / 1 0，然后整个退出

// continue 标签：跳到外层下一轮
loop: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (j === 1) continue loop; // 跳过 i 这一轮剩余，进 i+1
    console.log(i, j); // 每个 i 只打印 j=0
  }
}
```

::: tip 标签别滥用
标签能让多层跳出更直接，但过度使用会让控制流难读。很多场景可改用「提取成函数后 `return`」或引入 flag 变量来替代，逻辑更清晰。

:::

## 小结

分支用 `if` / `switch`（`switch` 严格相等且要防穿透），循环按场景选 `for` / `while` / `do...while`。最关键的是分清 **`for...of` 遍历值（数组首选）、`for...in` 遍历键名（对象专用、勿用于数组）**，并掌握 `break` / `continue` 与标签的精准控制。下一页收尾，讲讲让代码更安全的 [strict mode 与那些历史怪癖](./strict-mode-quirks)。
