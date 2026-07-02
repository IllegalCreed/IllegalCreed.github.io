---
layout: doc
outline: [2, 3]
---

# import maps 工作流

> 基于 single-spa v6 · 核于 2026-07

## 速查

- single-spa 官方推荐架构：**浏览器内 ESM + import maps** 加载子应用与共享依赖——**import map** 把裸说明符（bare specifier，如 `import "react"`）在**运行时**解析成一个具体 URL
- 分层原则（官方原话）：**每个子应用是浏览器内模块、每个大的共享依赖也是浏览器内模块、其余一切是构建时模块**——大库运行时共享、小库照常打进各自 bundle
- **原生 import maps** 已 **Baseline Widely available（2023-03 起）**，现代首选 `<script type="importmap">`；**SystemJS 退居历史 polyfill**，只在需要兼容老浏览器/scopes 高级用法时用 `<script type="systemjs-importmap">`
- SystemJS 为何是「polyfill-**like**」：JS 语言层无法真正 polyfill「裸说明符 → URL」的解析，只能用 `System.register` 模块格式模拟——所以它**不是**标准 ESM，需构建产物改格式
- SystemJS 路线的构建改动：webpack **`output.libraryTarget: "system"`**、rollup **`output.format: "system"`**；SystemJS **不能直接吃标准 ESM 包**，靠 esm-bundle / JSPM CDN 取 `System.register` 版
- **共享依赖 = externals + import map**：构建时把大库标为 `externals`（不打进 bundle），运行时 import map 把它指到**唯一 URL**——n 个子应用共下一份 React
- **import-map-overrides**：浏览器里覆盖 import map 的本地开发工具——**只在本地起当前这一个子应用**，其余全用线上部署版，「本地环境 = 线上环境」零差异
- **import-map-deployer**：**并发安全**地更新线上 import map 的服务——CI 用 `curl -X PATCH` 只改自己那个键，多团队同时部署不打架
- 部署两步：① 把带 hash 的新 bundle 传 CDN；② 用 import-map-deployer 把该应用的 import map 键指向新 URL——**改一个键 = 发布一个子应用**，无需重新构建整站
- 共享依赖 URL 来源：**esm-bundle**（热门库的 `System.register` 版）、**JSPM CDN**（`system-cdn.jspm.io/npm:react@17.0.0/...`）、**generator.jspm.io**（在线生成 map）、自建 self-hosted 目录
- 与 Module Federation 的关系：官方立场 MF 是**性能技术**、与 single-spa **互补可共用**（依赖共享三路线的横向对比见[微前端核心机制](../../mfe-mechanisms/guide-line/dependency-sharing)）

## 一、import map 解决什么：运行时把裸说明符指到 URL

子应用代码里写的是 `import { thing } from "@org/api"`——这个 `@org/api` 叫**裸说明符（bare specifier）**，浏览器原生并不知道它对应哪个 URL。传统做法是构建工具在打包时把它解析掉（打进 bundle）；single-spa 的做法是**把解析推迟到运行时**，交给 **import map**：

```html
<!-- import map：告诉浏览器每个裸说明符对应哪个 URL -->
<script type="importmap">
{
  "imports": {
    "@org/root-config": "//localhost:9000/org-root-config.js",
    "@org/orders": "//cdn.example.com/orders/a1b2c3/org-orders.js",
    "@org/api": "//cdn.example.com/api/d4e5f6/org-api.js",
    "react": "//cdn.example.com/react@18/index.js"
  }
}
</script>
```

这样一来，**改一个 URL 就等于换一份代码**——不用重新构建整站、不用改任何子应用的源码。这正是 single-spa「独立部署」落地的关键机制：每个子应用是一个**浏览器内模块**，import map 是它们之间的「电话簿」。

官方给了一条清晰的分层原则：**每个 single-spa 子应用应是浏览器内模块，每个大的共享依赖也应是浏览器内模块，其余一切应是构建时模块**。翻译成实操——React/Vue 这种大库进 import map 运行时共享，lodash 里你只用到的两个函数照常打进自己的 bundle。

## 二、原生 ESM + import maps：现代推荐

`import maps` 已经是浏览器标准，**Baseline Widely available 自 2023-03 起**（主流浏览器都支持）。所以 2026 年的现代 single-spa 架构可以直接用**原生 ESM**：子应用产物是标准 ES 模块，用 `<script type="importmap">` 声明电话簿、`<script type="module">` 启动，全程无需任何加载器：

```html
<script type="importmap">
{ "imports": { "@org/root-config": "//localhost:9000/org-root-config.js" } }
</script>
<script type="module">
  import "@org/root-config"; // 原生 ESM 加载，浏览器自己按 import map 解析
</script>
```

原生路线的好处是**没有运行时加载器开销、无需改构建产物格式**，也天然兼容 Vite/ESM 子应用——这恰恰是 qiankun 的 HTML entry 路线搞不定的地方（见[微前端核心机制·HTML entry](../../mfe-mechanisms/guide-line/html-entry-loading)）。

## 三、SystemJS：历史 polyfill，为什么当年需要它

import maps 是近几年才 Baseline 的。在它普及之前，浏览器不认 `<script type="importmap">`，也不认裸说明符——于是 single-spa 早期（也是大量存量项目至今）用 **SystemJS** 来「模拟」这套能力：

```html
<!-- SystemJS 路线：用 systemjs-importmap 而非原生 importmap -->
<script type="systemjs-importmap">
{ "imports": { "@org/orders": "//cdn.example.com/orders/a1b2c3/org-orders.js" } }
</script>
<script src="//cdn.example.com/systemjs/system.min.js"></script>
<script>
  System.import("@org/root-config"); // 用 System.import 而非原生 import
</script>
```

关键要理解 SystemJS 只是**「polyfill-like（类 polyfill）」而非真 polyfill**——官方原话：受 JS 语言本身限制，**「裸说明符 → URL 的解析无法被真正 polyfill」**。它的办法是让代码编译成一种叫 **`System.register`** 的模块格式（不是标准 ESM），再由 SystemJS 运行时解析。这带来两个构建约束：

```js
// SystemJS 路线：构建产物必须改成 system 格式
// webpack
module.exports = { output: { libraryTarget: "system" } };
// rollup
export default { output: { format: "system" } };
```

而且 SystemJS **不能直接加载标准 ESM 包**——`react` 的官方 npm 产物是 ESM，SystemJS 吃不下。解决办法是取它的 `System.register` 版本：**esm-bundle**（GitHub 上预编译好的热门库）、**JSPM CDN**（形如 `https://system-cdn.jspm.io/npm:react@17.0.0/index.js`）、**generator.jspm.io**（在线生成整张 map）、或自建 self-hosted 目录。

**结论**：新项目上原生 ESM + import maps；SystemJS 是历史包袱/兼容层，只在要支持老浏览器、或要用 `scopes` 等原生 import map 尚不方便的高级能力时才保留。两者的 import map **JSON 结构基本一致**，迁移主要是换 `<script>` 的 `type` 和构建格式。

## 四、externals + import map：共享依赖只下一份

「五个子应用 = 用户下载五份 React」是微前端最常见的性能坑。single-spa 的解法是**构建时 externals + 运行时 import map** 的组合拳：

```js
// 构建时：把共享依赖标为 externals，不打进自己的 bundle
// webpack —— 用正则匹配整个 scope
module.exports = { externals: [/^@org\/.+/, "react", "react-dom"] };
// rollup
export default { external: ["@org/api", "react", "react-dom"] };
```

```json
// 运行时：import map 把这些外部依赖指到唯一 URL —— 全站共下一份
{
  "imports": {
    "react": "//cdn.example.com/react@18/index.js",
    "react-dom": "//cdn.example.com/react-dom@18/index.js"
  }
}
```

`externals` 让构建工具**不把大库打进 bundle**（否则每个子应用各带一份），import map 则保证运行时所有子应用的 `import "react"` 都指向**同一个 URL**——浏览器只下载、只缓存一份。共享依赖通常单独放一个 `shared-dependencies` 仓库维护那张「公共 import map 片段」，升级 React 就是给这个仓库提一个 PR、改一个 URL。这条路线与 Module Federation 的 `shared` 是「集中裁定 vs 运行时协商」的两种哲学，横向对比见[依赖共享三路线](../../mfe-mechanisms/guide-line/dependency-sharing)。

## 五、import-map-overrides：本地只起一个应用

微前端开发最烦的是「要调一个子应用，得把全套都在本地跑起来」。**import-map-overrides** 解决这个：它是一个浏览器端小工具，能在**你自己的浏览器里临时覆盖 import map 的某个键**——把某个子应用指到你本地的 `localhost`，其余全部继续用线上部署版：

```json
// 开发时（import-map-overrides 注入）：只有 navbar 指向本地，其余走线上
{
  "imports": {
    "@org/navbar": "https://localhost:8080/org-navbar.js",
    "@org/orders": "https://cdn.example.com/orders/a1b2c3/org-orders.js"
  }
}
```

于是你**只需在本地起当前正在开发的那一个子应用**，其余的用线上真实版本。官方强调它的价值：**「本地环境与完整集成的线上环境之间没有差异」**——你在一个和生产几乎一致的环境里调试单个应用。覆盖信息存在浏览器本地（localStorage），只影响你自己，不动线上 import map。

## 六、import-map-deployer：并发安全地发布

部署一个子应用是**两步**：① 把带 hash 的新 bundle 传到 CDN（S3 + CloudFront / GCS 等）；② 更新线上 import map，把该应用的键指向新 URL。第二步的难点是**并发**——多个团队同时部署、同时改同一份 import map，会互相覆盖。**import-map-deployer** 就是为此而生的服务，CI 用一个 HTTP PATCH 只改自己那一个键：

```bash
# CI 里：只 PATCH 自己这个应用的键，deployer 保证并发安全
curl -X PATCH https://import-map.example.com/import-map.json \
  -H "Content-Type: application/json" \
  -d '{"imports": {"@org/orders": "https://cdn.example.com/orders/x9y8z7/org-orders.js"}}'
```

这样**发布一个子应用 = 改 import map 的一个键**——不重新构建整站、不惊动其他应用，真正的独立部署。（不想引入 deployer 的团队也可以让 CI 自己「拉取-修改-回传」import map，或用 302 重定向把不带 hash 的 URL 指到带 hash 的文件。）

## 小结

import maps 是 single-spa 现代架构的加载中枢：它把「裸说明符 → URL」的解析推迟到运行时，让「改一个 URL = 换一份代码」成为可能，从而支撑独立部署。原生 ESM + import maps（Baseline 2023-03）是现代首选，SystemJS 退居历史 polyfill——它用 `System.register` 格式模拟这套能力，代价是改构建产物格式、且吃不下标准 ESM。共享依赖走 externals + import map 只下一份；本地开发用 import-map-overrides 只起一个应用；部署用 import-map-deployer 并发安全地改键。加载解决了，子应用内部怎么把 Vue/React/Angular 组件包成 single-spa 生命周期——那是适配器的活：见[框架适配器](./framework-adapters)。
