---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **Node.js 22 LTS / 24 LTS**（2026-06）。本篇讲 CommonJS 的来历、第一个模块与判定规则；与 ES Module 的语法对照与迁移见 [ES Module](../es-module/) 篇，本系列不展开。

## 速查

- 定位：**Node.js 默认模块系统**；2009 年社区规范（初名 ServerJS），Node 实现其变体
- 导出：`module.exports = x`（整体替换）/ `exports.foo = x`（追加属性）；导入：`const x = require('./mod')`，**同步**
- 五个模块级变量：`exports` / `require` / `module` / `__filename` / `__dirname` —— 全是**模块包装函数的参数**
- 判定：`.cjs` 恒 CJS、`.mjs` 恒 ESM；`.js` 看最近 package.json 的 `type`，**缺省默认 CJS**
- 自动扩展名补全：`.js` → `.json` → `.node`；**`.cjs` 不补全，必须写全名**
- ⚠️ `exports = {...}` **不导出**（别名坑）；整体替换只能赋给 `module.exports`
- require(esm)：**Node 22.12+ 默认**可 require 无顶层 await 的 ESM（详见[进阶篇](./guide-line/advanced)）

## 一、模块化前史：CJS 从哪来

早期浏览器 JS 靠 `<script>` 顺序共享全局变量，互相覆盖是日常。社区的演化路线一笔带过：

1. **IIFE（立即执行函数）**：用函数作用域隔离变量，解决全局污染——但**没有依赖声明与加载机制**，顺序仍靠人肉维护；
2. **CommonJS（2009）**：服务端社区给出完整方案——`require` 同步加载 + `module.exports` 导出，Node.js 采用其变体并发扬光大；
3. **AMD / UMD**：CJS 的同步加载不适合浏览器网络环境，AMD（RequireJS 的 `define`）改为**异步声明依赖**；UMD 则是「AMD + CJS + 全局变量」三合一的兼容包装，常见于老牌库的分发产物；
4. **ES Module（2015 进标准）**：语言层官方答案，浏览器与 Node 双端原生支持——这是另一叶的故事，见 [ES Module](../es-module/) 篇。

> 一句话：CJS 是「标准缺位时代」的服务端胜出者，至今仍是 Node 的默认模块系统。

## 二、第一个模块

```js
// circle.js —— 导出方
const { PI } = Math;

/** 计算圆面积 */
exports.area = (r) => PI * r ** 2;

/** 计算圆周长 */
exports.circumference = (r) => 2 * PI * r;
```

```js
// main.js —— 导入方
const circle = require("./circle.js"); // 同步加载，返回对方的 module.exports
console.log(`半径 4 的圆面积：${circle.area(4)}`);
```

要导出**一个整体**（类/函数），整体替换 `module.exports`：

```js
// square.js
module.exports = class Square {
  constructor(width) {
    this.width = width;
  }
  area() {
    return this.width ** 2;
  }
};
// 用法：const Square = require('./square.js');
```

## 三、exports 只是别名（第一坑）

`exports` 初始时与 `module.exports` 指向**同一个对象**，但 `require` 返回的**永远是 `module.exports`**：

```js
exports.hello = true;        // ✅ 等价 module.exports.hello = true
exports = { hello: false };  // ❌ 只是局部变量改指向，导不出去
module.exports = { ok: 1 };  // ✅ 整体替换的唯一正确方式
```

记三条：**追加属性两者皆可；整体替换只认 `module.exports`；对 `module.exports` 的赋值必须同步完成**（放进 setTimeout 回调里就晚了）。机制成因见[基础篇](./guide-line/base)。

## 四、模块自带的便利

```js
// 1. 原生 require JSON：直接拿到解析后的对象
const config = require("./config.json");

// 2. __dirname / __filename：跟着文件走的绝对路径
console.log(__dirname);  // 当前模块所在目录，如 /Users/me/app/src
console.log(__filename); // 当前模块文件路径，如 /Users/me/app/src/util.js
// 注意区分 process.cwd()：那是进程工作目录，随启动位置变化
```

两点提醒：require 进来的 JSON 对象**走缓存、全局共享同一份**，别随手改它；`__dirname`/`__filename` 是 CJS 专属注入，ESM 里没有（替代方案见 [ES Module](../es-module/) 篇）。

## 五、谁说了算：.cjs / .mjs 与 type 字段

Node 判定一个文件按哪种模块系统执行，优先级从高到低：

| 依据                            | 结果                              |
| ------------------------------- | --------------------------------- |
| 扩展名 `.cjs`                   | **恒为 CommonJS**（无视 type）    |
| 扩展名 `.mjs`                   | 恒为 ESM                          |
| `.js` + 最近 type: `"commonjs"` | CommonJS                          |
| `.js` + 最近 type: `"module"`   | ESM                               |
| `.js` + **type 缺省**           | **默认 CommonJS**（CJS 的默认地位）|

两个补充：

- **语法检测**（v22.7.0 / v20.19.0 起默认启用）：type 缺省的「模糊」`.js` 文件若**只含 ESM 语法**（import/export、顶层 await 等），会被自动按 ESM 运行——默认地位的唯一让步；
- **最佳实践**：package.json 里**显式写 `"type"`**（`"commonjs"` 或 `"module"`），省检测开销、绝歧义。

---

跑通第一个模块后，进入[指南 · 基础](./guide-line/base)：模块包装函数、exports 别名机制的底层成因、require 解析算法与 node_modules 逐级向上查找。
