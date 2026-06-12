---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 本篇拆开 CJS 的执行模型：模块包装函数、exports 别名机制的底层成因、require 解析算法与 node_modules 逐级向上。版本基线 **Node.js 22/24 LTS**（2026-06）。

## 一、模块包装函数：一切的起点

Node 执行每个 CJS 模块前，会把源码包进一个函数再求值：

```js
(function (exports, require, module, __filename, __dirname) {
  // 你的模块代码实际活在这里
});
```

这一层包装解释了 CJS 的两件「理所当然」：

1. **顶层变量不污染全局**：模块里的 `var`/`let`/`const` 都是这个函数的**局部变量**，作用域天然封闭（注意：靠的是函数作用域，**不是**严格模式——CJS 默认非严格模式，这点与 ESM 不同）；
2. **五个「模块级全局」从哪来**：`exports`、`require`、`module`、`__filename`、`__dirname` 看似全局却各模块各不同——因为它们只是**参数**。

## 二、module.exports 与 exports：一根指针两个名字

包装函数调用时，`exports` 参数被传入的就是 `module.exports` 的初始值（空对象），所以两者起初指向同一对象：

```js
exports.a = 1;            // ✅ 等价 module.exports.a = 1，追加属性两者皆可
exports = { a: 2 };       // ❌ 局部变量改指向，module.exports 纹丝不动
module.exports = fn;      // ✅ 整体替换的唯一通道
module.exports = exports = fn; // ✅ 替换后让两个名字继续同指（老派写法）
```

`require` 返回的**永远是 `module.exports`**——这就是「别名坑」的全部真相。两条工程纪律：

- 整体替换（导出类/函数本体）一律写 `module.exports =`；
- **赋值必须同步完成**：官方明确不能放在回调里，`setTimeout(() => { module.exports = ... })` 时 require 方早已拿走旧对象。

## 三、require 解析：四类说明符

`require(X)` 按 X 的形态走不同分支：

| 说明符形态            | 解析策略                                       |
| --------------------- | ---------------------------------------------- |
| 核心模块（`node:fs`/`fs`） | 直接返回内置模块，优先级最高              |
| `/` 开头              | 绝对路径，直接走文件/目录加载                  |
| `./` `../` 开头       | **相对当前模块文件所在目录**（与 process.cwd() 无关） |
| 裸名（`lodash`）      | node_modules 逐级向上查找（见下节）            |

文件加载（LOAD_AS_FILE）的扩展名自动补全**只试三个、按序命中即停**：

```text
require('./data') → data → data.js → data.json → data.node
```

⚠️ `.cjs` **不在补全列表**：`require('./mod')` 找不到 `mod.cjs`，必须写全 `require('./mod.cjs')`。

目录加载（LOAD_AS_DIRECTORY）：

```text
require('./lib')（lib 是目录）
→ 读 lib/package.json 的 "main"，按其指向走文件加载
→ 无 package.json 或 main 失效 → lib/index.js → lib/index.json → lib/index.node
```

> ESM 的 `import` 没有这些宽容：不补扩展名、不解析目录。这是 CJS 独有的便利（也是静态分析的负担）。

## 四、node_modules：逐级向上的查找链

裸名说明符从**当前文件所在目录**开始，每层目录拼 `node_modules` 尝试，逐级向上直到文件系统根：

```text
/home/ry/projects/foo.js 中 require('bar')：
/home/ry/projects/node_modules/bar
/home/ry/node_modules/bar
/home/node_modules/bar
/node_modules/bar
```

- 已是 `node_modules` 的路径段会被跳过（不产生 node_modules/node_modules）；
- 每层先试包的 exports（LOAD_PACKAGE_EXPORTS），再按文件、目录尝试；
- 想亲眼看查找链：打印 **`module.paths`**；
- 最后还有遗留的 GLOBAL_FOLDERS（`$HOME/.node_modules`、`$HOME/.node_libraries`、`$PREFIX/lib/node`）兜底——**强烈不建议依赖**，历史包袱而已。

这条「逐级向上」正是 npm 嵌套依赖与 monorepo 依赖提升能工作的基础：子包找不到就用父层的，天然形成查找回退。

## 五、require.resolve 与 require.main

```js
// 只问路、不进门：跑完整解析算法但不执行模块
require.resolve("./circle.js"); // → /abs/path/circle.js（找不到照样抛错）
require.resolve.paths("lodash"); // → 查找目录数组；核心模块返回 null

// 双重身份惯用法：被直接运行才执行入口逻辑
if (require.main === module) {
  main(); // node cli.js 直接运行时进入；被 require 时跳过
}
```

`require.resolve` 的典型用途：定位依赖真实安装位置、生成 `require.cache` 的删除键、给工具链传绝对路径。`require.main === module` 则让一个文件**既当库又当脚本**（类比 Python 的 `__main__`）。

---

执行模型清楚了，进入[指南 · 进阶](./advanced)：模块缓存的全部坑、循环依赖的「未完成副本」，以及 require(esm) 互操作的转正始末。
