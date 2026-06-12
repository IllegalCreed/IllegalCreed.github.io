---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **rollup 4.61.x**（npm `latest`，Node ≥ 18）。Rollup 4 的解析器已是基于 SWC 的 Rust 原生实现；生态背景（Rolldown / Vite 8）见[专家篇](./guide-line/expert)。

## 速查

- 安装：`npm i -D rollup`（本地安装 + npm scripts，保证团队同版本）
- 最小命令：`npx rollup main.js --file bundle.js --format iife`（浏览器）｜ `--format cjs`（Node）
- 配置文件：`rollup.config.mjs`（默认按 **ESM** 解析），**必须 `rollup -c` 显式加载**
- 核心认知：Rollup 做**模块合并 + tree-shaking**，**不降级语法、不做类型检查**
- ESM 优先：原生只认 `import/export` 输入，CommonJS 依赖要 `@rollup/plugin-commonjs`
- ⚠️ 裸导入（`import x from 'pkg'`）默认被当 external → 要打进产物装 `@rollup/plugin-node-resolve`
- ⚠️ `output.file` 只能单 chunk；动态 `import()`/多入口必须改 `output.dir`
- ⚠️ umd/iife + external → 必须配 `output.globals` 与 `output.name`

## 一、Rollup 是什么

官方定义：「**Rollup is a module bundler for JavaScript** which compiles small pieces of code into something larger and more complex, such as a library or an application.」它做的事：

1. **模块合并**：按依赖图把分散的 ES 模块组装成目标格式的产物（库或应用）。
2. **tree-shaking**：静态分析 import/export，「排除实际未被使用的代码」，官方也叫 **live code inclusion**。

> 关键边界：Rollup **不做语法降级**（那是 Babel/SWC 的事）、**不做类型检查**（那是 tsc 的事）、**不内置 dev server/HMR**。它专注「把模块图变成最优产物」这一件事。

## 二、为什么 ESM 优先

Rollup 围绕 ES 模块标准构建。官方 FAQ 的判断很直接：ESM 是「official standard and the clear path forward」，CommonJS 是「idiosyncratic legacy format」。技术原因：

- `import/export` 是**静态结构**，构建期就能确定依赖关系与使用情况——这是 tree-shaking 的根基；
- Rollup 能把所有模块当作「**一棵共享绑定的大 AST**」做整体分析（scope hoisting），而 CJS 的动态 `require` 做不到；
- ESM 还有 **live bindings**（导出的是绑定不是值）等被 Rollup 完整支持的规范语义。

因此 **CommonJS 输入不被原生支持**——需要 `@rollup/plugin-commonjs` 先转成 ESM。

## 三、安装与第一次打包

```bash
mkdir my-rollup && cd my-rollup
npm init -y
npm i -D rollup
```

写两个模块，`src/main.js` 与 `src/foo.js`：

```js
// src/foo.js
export const used = () => "I am used";
export const unused = () => "I will be tree-shaken";

// src/main.js
import { used } from "./foo.js";
console.log(used());
```

官网给的三条快速命令，按目标环境选格式：

```bash
npx rollup src/main.js --file bundle.js --format iife   # 浏览器 <script>
npx rollup src/main.js --file bundle.js --format cjs    # Node.js
npx rollup src/main.js --file bundle.js --format umd --name "myBundle"  # 两者通吃
```

打开 `bundle.js` 能看到：`unused` 函数**没有出现在产物里**——这就是 tree-shaking；产物也没有任何模块包装函数——这就是 scope hoisting。

## 四、配置文件

CLI 参数复杂后改用配置文件 `rollup.config.mjs`（**默认按 ES 模块解析**，CommonJS 写法需 `.cjs` 扩展名）：

```js
// rollup.config.mjs
import { defineConfig } from "rollup"; // 可选，仅为类型提示

export default defineConfig({
  input: "src/main.js",
  output: {
    file: "dist/bundle.js",
    format: "esm", // es 的别名
    sourcemap: true,
  },
});
```

```bash
npx rollup -c                  # 必须显式 -c/--config 才会读配置
npx rollup -c -o dist/b2.js    # 命令行参数覆盖配置同名项
```

配置还能导出**数组**（多份构建）、**函数**（接收命令行参数做条件配置）、甚至 Promise。工程化推荐写进 npm scripts：

```json
{ "scripts": { "build": "rollup -c", "dev": "rollup -c -w" } }
```

## 五、打包第三方依赖

直接 `import _ from 'lodash-es'` 会得到警告：**「Treating 'lodash-es' as external dependency」**——Rollup 默认只解析相对路径，不知道如何定位 node_modules。两条路：

```js
// ① 想打进产物：装定位与转换插件
import resolve from "@rollup/plugin-node-resolve"; // 按 Node 算法定位第三方包
import commonjs from "@rollup/plugin-commonjs"; // 把 CJS 依赖转成 ESM
import json from "@rollup/plugin-json"; // 让 .json 可 import

export default {
  input: "src/main.js",
  output: { dir: "dist", format: "esm" },
  plugins: [resolve(), commonjs(), json()],
};
```

```js
// ② 有意外置（库打包的常态）：显式声明 external，警告即消除
export default {
  input: "src/index.js",
  external: ["vue", /^lodash-es/],
  output: { dir: "dist", format: "esm" },
};
```

> 这是 Rollup 哲学的体现：官方 FAQ 解释 node-resolve 不内置，是因为 Rollup 本质上「是原生模块加载器的 polyfill」，浏览器并不使用 Node 的解析算法，核心保持精简、能力交给插件。

## 六、输出格式怎么选

| format | 别名 | 适用场景 |
|---|---|---|
| `es` | `esm`/`module` | 现代浏览器 `<script type="module">`、给其他打包器消费（**库的 `module` 入口**） |
| `cjs` | `commonjs` | Node.js（库的 `main` 入口） |
| `iife` | — | `<script>` 直接引入的自执行产物（需 `output.name`） |
| `umd` | — | amd + cjs + iife 三合一，浏览器与 Node 通吃（需 `output.name`） |
| `amd` / `system` | `systemjs` | RequireJS / SystemJS 加载器 |

库发布的经典策略：`main` 指向 CJS/UMD 产物保证兼容，`module` 字段指向 ESM 产物供打包工具 tree-shake（现代项目再叠加 `exports` 条件导出）。

---

跑通第一次打包后，进入[指南 · 基础](./guide-line/base)：input/output 细节、external 与 globals、tree-shaking 行为与 watch 工作流。
