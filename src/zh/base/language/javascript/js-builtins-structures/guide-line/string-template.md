---
layout: doc
outline: [2, 3]
---

# 字符串与模板字面量

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 三种字面量：单引号 `'a'`、双引号 `"a"`、反引号模板 `` `a` ``；前两者等价，反引号支持插值与多行
- 模板字面量：`` `你好 ${name}，${1 + 1} 岁` `` —— `${}` 内可放任意表达式，**反引号本身可跨多行**
- 字符串不可变：所有方法都**返回新串**，不修改原串
- `length` 数的是 **UTF-16 码元**，不是「人眼字符」——emoji 等占 2 个码元
- 按码点正确遍历：`for...of` 或 `[...str]`（不会把 emoji 拆成两半）；`String.fromCodePoint` / `codePointAt`
- 查找：`includes` / `startsWith` / `endsWith` / `indexOf` / `at`（支持负索引）
- 截取：`slice(start, end)`（支持负数，最常用）/ `substring` / `split`
- 增补：`padStart` / `padEnd`（补齐）、`repeat`、`trim` / `trimStart` / `trimEnd`、`replaceAll`
- 大小写：`toUpperCase` / `toLowerCase`；`normalize()` 做 Unicode 规范化（比较带重音字符前必做）
- 标签模板：`` tag`...` `` —— 函数接收 `(strings, ...values)`，用于转义 / i18n / 高亮 / SQL 安全

## 三种字符串字面量

```js
const a = "单引号";
const b = "双引号"; // 与单引号完全等价，选一种风格统一即可
const c = `反引号`; // 模板字面量，能力最强
```

单双引号唯一区别是「内部不用转义另一种引号」。反引号则解锁了两项关键能力：**插值**和**多行**。

## 模板字面量：插值与多行

反引号包裹的字符串里，`${}` 中可以放**任意表达式**，运行时求值后拼进字符串：

```js
const name = "Ada";
const age = 36;

// 插值：${} 内可放变量、运算、函数调用、三元表达式……
const msg = `${name} 今年 ${age} 岁，明年 ${age + 1} 岁`;

// 多行：反引号内的换行会原样保留（不用 \n 拼接）
const html = `
  <ul>
    <li>${name}</li>
  </ul>
`;
```

这几乎完全取代了老式的 `"..." + x + "..."` 字符串拼接——更易读、不易漏空格。

::: warning VitePress / Vue 里的双花括号陷阱
本站基于 VitePress，正文里裸写两个连续花括号会被 Vue 当成插值语法解析而报错。本页所有含 `${}` 的模板字面量都写在**代码围栏内**（围栏内是安全的）；若你在自己的 Markdown 正文里需要展示形如 <code v-pre>{{ x }}</code> 的字面文本，请用 `<code v-pre>` 包裹或放进代码块。
:::

## 字符串不可变

JavaScript 字符串是**原始值、不可变**。所有「修改」方法实际都返回一个**新字符串**，原串纹丝不动：

```js
const s = "hello";
s.toUpperCase(); // "HELLO"（返回新串）
console.log(s); // "hello"（原串没变）

// 想「改」必须重新赋值
let t = "hello";
t = t.toUpperCase(); // 现在 t 是 "HELLO"

// 下标赋值无效（静默失败，非严格模式下）
s[0] = "H"; // 无任何效果
```

## `length` 的真相：UTF-16 码元

`length` 返回的是字符串占用的 **UTF-16 码元（code unit）数量**，而不是肉眼看到的字符数。基本平面（BMP）内的字符占 1 个码元，但 emoji、部分汉字等**增补字符**占 2 个码元（代理对，surrogate pair）：

```js
"abc".length; // 3
"中文".length; // 2
"😀".length; // 2（一个 emoji，却数出 2！）
"👨‍👩‍👧".length; // 8（带零宽连接符的组合 emoji 更夸张）
```

这导致按下标遍历会**把 emoji 拆成两个无效的半码元**。正确做法是按**码点（code point）**遍历——`for...of` 和展开运算符都遵循码点：

```js
const s = "a😀b";
s.length; // 4（错误的"字符数"）

[...s]; // ["a", "😀", "b"]（正确：展开按码点）
[...s].length; // 3（正确的字符数）

for (const ch of s) {
  console.log(ch); // "a" → "😀" → "b"（不会拆开 emoji）
}
```

## 码点相关 API

```js
// 取码点（codePointAt 正确处理代理对，charCodeAt 只取单个码元）
"😀".codePointAt(0); // 128512（完整码点）
"😀".charCodeAt(0); // 55357（只是代理对的前半，几乎没用）

// 由码点造字符
String.fromCodePoint(128512); // "😀"
String.fromCharCode(65); // "A"（仅适合 BMP 内字符）

// at 支持负索引（ES2022），比 charAt 更顺手
"hello".at(-1); // "o"（最后一个字符）
"hello".charAt(0); // "h"
```

## 查找、截取与增补

```js
// 查找（返回布尔，最常用）
"hello world".includes("world"); // true
"hello".startsWith("he"); // true
"hello".endsWith("lo"); // true
"hello".indexOf("l"); // 2（找不到返回 -1）

// 截取：slice 最常用，支持负数
"hello".slice(1, 3); // "el"
"hello".slice(-3); // "llo"（从倒数第 3 个到末尾）
"a,b,c".split(","); // ["a", "b", "c"]

// 补齐（ES2017）：常用于补零、对齐
"5".padStart(3, "0"); // "005"
"5".padEnd(3, "*"); // "5**"

// 其他增补
"ab".repeat(3); // "ababab"
"  hi  ".trim(); // "hi"（去两端空白）
"a-b-c".replaceAll("-", "_"); // "a_b_c"（ES2021，替换全部）
```

::: tip `replace` vs `replaceAll`
`replace("a", "b")` 只替换**第一个**匹配；要替换全部，传带 `g` 标志的正则，或直接用 `replaceAll`（ES2021，更直观）。`replaceAll` 若传正则则该正则**必须带 `g` 标志**，否则抛错。
:::

## Unicode 规范化

「同一个字符」在 Unicode 里可能有多种字节表示。例如带重音的 `é` 既可以是单个码点 `U+00E9`，也可以是「`e` + 组合重音符」两个码点。它们**看起来一样但 `===` 不相等**：

```js
const a = "café"; // é = 单码点（NFC）
const b = "café"; // e + 组合重音（NFD）
a === b; // false（字节不同！）
a.length; // 4
b.length; // 5

// normalize 统一规范形式后即可正确比较
a.normalize() === b.normalize(); // true
```

处理用户输入、文件名、需要比较的文本时，比较前调用 `normalize()`（默认 NFC）能避免「看着一样却不相等」的诡异 Bug。

## 标签模板（Tagged Templates）

模板字面量前面跟一个函数名，就是**标签模板**——函数接管字符串的拼装过程，能在插值前对值做处理。函数签名是 `(strings, ...values)`：`strings` 是被 `${}` 切开的静态片段数组，`values` 是各插值结果。

```js
function highlight(strings, ...values) {
  // strings: 静态片段；values: 各 ${} 的求值结果
  return strings.reduce((acc, str, i) => {
    const val = values[i] !== undefined ? `【${values[i]}】` : "";
    return acc + str + val;
  }, "");
}

const name = "Ada";
const role = "管理员";
highlight`用户 ${name} 的角色是 ${role}`;
// "用户 【Ada】 的角色是 【管理员】"
```

标签模板的真实用途很多：HTML 转义防 XSS、国际化（i18n）取词、SQL/Shell 安全拼接、CSS-in-JS（如 styled-components 的 <code>styled.div\`...\`</code>）、语法高亮等。`String.raw` 是内建的标签函数，返回**不处理转义**的原始串：

```js
String.raw`C:\new\test`; // "C:\new\test"（\n \t 不被转义）
`C:\new\test`; // "C:" + 换行 + "ew" + 制表符 + "est"（被转义了）
```

## 小结

字符串是不可变的原始值，反引号模板字面量（插值 + 多行 + 标签模板）是现代 JS 处理文本的主力。最容易踩的坑是 `length` 与下标按 UTF-16 码元而非码点工作——涉及 emoji 与国际化文本时，用 `for...of` / 展开按码点处理、比较前先 `normalize()`。下一页进入模式匹配：[正则表达式](./regexp)。
