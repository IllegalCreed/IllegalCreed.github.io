---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Webpack 5.x**（npm `latest` = 5.x，webpack-cli 7、webpack-dev-server 5）。涉及 Webpack 4→5 的差异均显式标注。

## 速查

- 安装：`npm install -D webpack webpack-cli`（**两个独立包**，缺 cli 无法用命令行）
- 零配置默认值：入口 `./src/index.js` → 输出 `./dist/main.js`，**默认 mode 为 `production`**
- 配置文件：`webpack.config.js`（根目录，`module.exports = { ... }`）
- 开发构建：`npx webpack --mode development`（生产省略 `--mode` 即默认压缩）
- 开发服务器：`npx webpack serve`（webpack-dev-server，默认 `http://localhost:8080`）
- 六大核心概念：**Entry / Output / Loaders / Plugins / Mode / 浏览器兼容**
- Webpack 只懂 **JS 和 JSON**，其它类型（CSS、图片、TS）需 **loader** 转换
- `output.path` 必须**绝对路径**：`path.resolve(__dirname, 'dist')`
- Node 要求：webpack-cli 7 需 Node ≥ 20.9；webpack-dev-server 5 需 Node ≥ 18.12

## 一、Webpack 是什么

Webpack 是**静态模块打包器**：从入口出发，递归解析模块间的 `import` / `require`，构建出一张**依赖图**，再把图中所有模块打包成少量 bundle 交给浏览器。

它默认只理解 **JavaScript 和 JSON**；其它类型的文件（CSS、图片、字体、TypeScript……）要靠 **loader** 预处理成「有效模块」后才能进入依赖图。而 **plugin** 则在打包的各个生命周期节点上做更宏观的事——优化、注入变量、生成 HTML、抽取 CSS。

## 二、为什么需要 Webpack

在模块化方案出现前，浏览器跑 JS 只有两条路，都不好：

- 每个功能一个 `<script>` —— 请求数爆炸、全局变量互相污染、加载顺序脆弱
- 全塞进一个大 `.js` —— 作用域冲突、体积失控、无法按需

社区先用 IIFE、再用 CommonJS / AMD / Browserify 缓解，但都要**手工声明依赖**、无法 tree-shaking、懒加载得自己写。Webpack 的突破在于：**根据 `import` / `export` 自动推断依赖图**，并在此基础上提供统一模块格式、资源处理、代码分割、tree-shaking 与 HMR。

## 三、安装与第一个构建

```bash
mkdir my-app && cd my-app
npm init -y
npm install -D webpack webpack-cli
```

新建 `src/index.js`（默认入口）。**零配置**即可构建：

```bash
npx webpack --mode development
# 默认从 ./src/index.js 打包到 ./dist/main.js
```

要自定义就写 `webpack.config.js`：

```js
const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"), // 必须绝对路径
    clean: true, // Webpack 5 内置，构建前清空 dist（取代 clean-webpack-plugin）
  },
};
```

> 💡 **ESM 配置**：若 `package.json` 设了 `"type": "module"`，配置文件里没有 `__dirname`，需用 `import.meta.url` 还原（Node 20.11+ 可直接用 `import.meta.dirname`）。

## 四、核心概念六件套

| 概念 | 作用 | 默认值 |
|---|---|---|
| **Entry** | 依赖图起点 | `./src/index.js` |
| **Output** | 产物位置与命名 | `./dist/main.js` |
| **Loaders** | 转换非 JS/JSON 文件 | 无（需自配） |
| **Plugins** | 接入编译生命周期做优化/产物管理 | 无 |
| **Mode** | 启用对应环境的内置优化 | `production` |
| **浏览器兼容** | 支持所有 ES5 浏览器（不支持 IE8） | — |

> ⚠️ **mode 默认是 `production`**：不显式设 `--mode development` 会得到**压缩 + 无可读名**的产物，调试时看不清，还会触发一条 warning。

## 五、CLI 与 npm scripts

```jsonc
// package.json
{
  "private": true, // 防止意外发布
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack serve --mode development --open"
  }
}
```

```bash
npm run build
# 给底层命令透传参数要加 --
npm run build -- --color
```

常用 CLI：`--config <file>` 指定配置、`--mode <mode>`、`--env <key>`（注意 `--env` 传入的是**配置函数的参数**，不是 `process.env`，详见[进阶篇](./guide-line/advanced)）。

## 六、Webpack 5 关键能力速览

Webpack 5 相比 4 的几项重要内置能力（详见各篇）：

- **Asset Modules**：内置 `type: 'asset/resource'` 等四种类型，**取代** `file-loader` / `url-loader` / `raw-loader`
- **持久化缓存**：`cache: { type: 'filesystem' }` 取代 `cache-loader` / `hard-source-webpack-plugin`，是最大的构建提速点
- **`output.clean: true`**：取代 `clean-webpack-plugin`
- **`moduleIds: 'deterministic'`**：生产默认，长效缓存 ID 稳定，取代 `HashedModuleIdsPlugin`
- **Module Federation**：跨构建共享模块的微前端方案
- **⚠️ 升级最大坑**：Node 核心模块（`crypto` / `stream` / `buffer`…）**不再自动 polyfill**，升级后常报 `Module not found: can't resolve crypto`，需配 `resolve.fallback`

---

掌握基本构建后，进入 [指南 · 基础](./guide-line/base)：入口出口、Asset Modules、常用 loaders 与 plugins。
