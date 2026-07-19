---
layout: doc
outline: [2, 3]
---

# 核心配置与方案

> 基于 Babel 官方文档（babeljs.io/docs/babel-preset-env）+ core-js 官方说明（zloirock/core-js）+ Vite 官方浏览器兼容指南编写，对照 @babel/preset-env 7.x 与 core-js 3.x 稳定版

## 速查

- **`useBuiltIns: 'usage'`**：Babel 扫描每个文件，按实际使用的 API 在文件顶部注入 `import "core-js/modules/es.xxx"`；最精细，**应用默认**
- **`useBuiltIns: 'entry'`**：把入口处的 `import "core-js/stable"` 一行替换成按 targets 拆解的具体模块清单；入口级粒度
- **`useBuiltIns: false`**：不注入也不转换 `core-js` 入口；**库默认**
- **`corejs` 选项**：与 `usage`/`entry` 必须同时设置，**写实际装的 minor 版本**（如 `'3.33'`）；写 `'3'` 或漏写会按默认 core-js@2 处理并告警
- **`core-js` vs `core-js-pure`**：前者修改全局与原生原型（polyfill，应用用）；后者不污染全局（ponyfill，库用）
- **库的去污染方案**：`@babel/plugin-transform-runtime` 的 `corejs: 3` 配合 `@babel/runtime-corejs3`，把 `arr.includes(x)` 转成 `_includesInstanceProperty(arr).call(arr, x)`
- **`browserslist` 集成**：preset-env 默认读 `.browserslistrc` / `package.json.browserslist`；可用 `targets` / `ignoreBrowserslistConfig` / `configPath` / `browserslistEnv` 覆盖
- **`shippedProposals`**：仅引入已 shipped 浏览器的 Stage-3 提案；`corejs: { version, proposals: true }` 引入 core-js 支持的全部提案（含未落地，体积更大）
- **`@vitejs/plugin-legacy`**：modern（`type="module"`）+ legacy（`nomodule`）双产物，浏览器自选
- **`polyfill.io` 不再用**：2024-02 被 Funnull 收购后供应链攻击，改自托管或 cdn.cloudflare.com / polyfill-fastly.io 镜像
- **`@babel/polyfill` 已弃用**（Babel 7.4 起），替代为 `import "core-js/stable"` + `import "regenerator-runtime/runtime"`
- **`include` / `exclude`**：强制包含/排除特定 polyfill，处理静态分析遗漏或原生实现有 bug 的场景

## useBuiltIns 三模式深度

### `'usage'` —— 应用默认

Babel 静态扫描每个文件，找出文件中实际用到的现代 API（`Promise`、`Array.includes`、`Object.fromEntries` 等），在该文件顶部注入对应的 `core-js/modules/es.xxx` import。

**触发示例**：

```ts
// 源码 src/foo.ts
const arr = [1, 2, 3];
arr.includes(2);
Object.fromEntries([["a", 1]]);
```

Babel 编译后（伪代码）：

```ts
// 编译后 src/foo.js
import "core-js/modules/es.array.includes.js";
import "core-js/modules/es.object.from-entries.js";

const arr = [1, 2, 3];
arr.includes(2);
Object.fromEntries([["a", 1]]);
```

**优点**

- 粒度最精细——只注入你实际用到的 API
- 不需要手动维护入口 import
- bundler 能 tree-shake 掉没用的 polyfill 模块

**陷阱**

- 静态分析有边界：第三方依赖内部的 API 使用可能没被静态扫到（要看依赖的 polyfill 声明）
- 字符串动态属性访问（如 `obj[methodName]`）和 `eval` 场景无法静态判断
- 需要用 `debug: true` 核对实际清单 + `include` 兜底

### `'entry'` —— 入口替换

把入口文件中显式写的 `import "core-js/stable"`（或 `import "core-js";`）**整行替换**为按 targets 拆解的具体模块清单。

**触发示例**：

```ts
// 入口 src/main.ts
import "core-js/stable";
```

编译后（伪代码，实际按 targets 决定）：

```ts
// 入口 src/main.js（targets = ie 11）
import "core-js/modules/es.array.includes.js";
import "core-js/modules/es.array.from.js";
import "core-js/modules/es.object.assign.js";
import "core-js/modules/es.promise.js";
// ... 还有几十个，全部按 targets 算出
```

**优点**

- 简单——一次在入口声明，整个项目所有用到的 API 都被覆盖
- 不依赖静态扫描，能覆盖到第三方依赖的隐式需求

**陷阱**

- 粒度比 `'usage'` 粗——只要 targets 里有浏览器缺某个 API，就补，不管你的代码用不用
- **必须配合 `useBuiltIns: 'entry'`** 才会拆解；直接写 `import "core-js"` 而不配置 preset-env 会变成全量加载
- 入口只能写一次；多入口或多文件各自 `import "core-js"` 会全局碰撞

### `false` —— 不注入

不自动注入任何 polyfill，也不转换入口处的 `core-js` import。**库（npm 包）默认**用这个。

**为什么库要用 `false`**：

- 库被各种消费者引用，消费者应用自己有一套 polyfill 策略
- 库如果在构建时把 polyfill 打进产物并修改原生原型，会**污染消费者的全局环境**，可能造成版本冲突或意外行为
- 库只负责语法降级，polyfill 留给应用层决定

> `@vue/babel-preset-app` 在构建库 / Web Component 时也建议 `useBuiltIns: false`。

## corejs 选项：必填且要写对版本

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": { "version": "3.33", "proposals": false }
      }
    ]
  ]
}
```

**关键点**

- **必填**：`useBuiltIns` 是 `'usage'` 或 `'entry'` 时必须同时设置 `corejs`，不写则按默认 core-js@2 处理并告警
- **写 minor 版本**：装 `core-js@3.33` 就写 `'3.33'`，写 `'3'` 会让 Babel 不知道该版本已可用的 polyfill，导致漏注入新 feature 的 polyfill 或重复注入已可用的
- **`proposals` 选项**：`true` 时引入 core-js 支持的全部提案 polyfill（含未广泛落地者），体积更大、spec 变更风险更大；仅在确实需要未稳定提案时开
- **`shippedProposals` 选项**（preset-env 顶层）：仅引入已 shipped 到浏览器的 Stage-3 提案 polyfill，比 `proposals: true` 更保守

## core-js 2 vs core-js 3

core-js@2 自 2018 年起进入 **feature freeze**（仅维护、不新增 feature）；core-js@3 是唯一活跃主版本，新项目必须用 3。

| 维度 | core-js@2 | core-js@3 |
| --- | --- | --- |
| 状态 | feature freeze（2018 起） | 唯一活跃主版本 |
| 新增 API | 无 | `URL` / `URLSearchParams` / `queueMicrotask` / `Array.flat` / `flatMap` / `Object.fromEntries` 等 |
| 模块前缀 | `es6.` / `es7.`（如 `es6.promise`） | `es.` / `esnext.`（如 `es.promise`、`esnext.array.group`） |
| 入口点数量 | ~200 | ~500+ |
| 与 Babel 集成 | 通过 `@babel/polyfill`（已弃用） | 通过 `useBuiltIns` + `corejs: 3` 或 `@babel/runtime-corejs3` |
| 提案支持 | 不再更新 | 通过 `core-js-pure/features` 与 `proposals` 选项 |

**混装陷阱**：core-js@2 与 core-js@3 混装会让 preset-env 注入重复或错误版本，应统一升到 core-js@3。

## core-js vs core-js-pure

```ts
// core-js —— 修改全局与原生原型（polyfill），用于应用
import "core-js/modules/es.array.includes";
[1, 2, 3].includes(2); // 即使原生没有，已被原型方法补上

// core-js-pure —— 不污染全局（ponyfill），用于库
import includes from "core-js-pure/features/array/includes";
includes([1, 2, 3], 2); // 显式传入 receiver，不动原型
```

| 维度 | core-js | core-js-pure |
| --- | --- | --- |
| 是否修改全局 / 原型 | 是（polyfill） | 否（ponyfill） |
| 使用方式 | `arr.includes(x)` | `includes(arr, x)` |
| 适用 | 应用（消费者隔离） | 库（不污染消费者） |
| 入口 | `import "core-js/stable"` | `import "core-js-pure/features/xxx"` |

> 库用 `core-js-pure` 配合 `@babel/plugin-transform-runtime + corejs: 3`，由 Babel 自动把 `arr.includes(x)` 转成 `_includesInstanceProperty(arr).call(arr, x)`。

## @babel/plugin-transform-runtime：库的去污染方案

`@babel/plugin-transform-runtime` 把 polyfill 从「修改全局」变成「从 `@babel/runtime-corejs3` 引入」——后者底层是 `core-js-pure`。

**配置**：

```json
{
  "presets": [["@babel/preset-env", { "useBuiltIns": false }]],
  "plugins": [["@babel/plugin-transform-runtime", { "corejs": 3 }]]
}
```

**作用**：

```ts
// 源码
const arr = [1, 2, 3];
arr.includes(2);

// 编译后
import _includesInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/includes";
const arr = [1, 2, 3];
_includesInstanceProperty(arr).call(arr, 2);
```

**关键点**

- polyfill 来自 `@babel/runtime-corejs3`（需 `npm i -D @babel/plugin-transform-runtime @babel/runtime-corejs3` 并 `npm i @babel/runtime-corejs3` 入运行时依赖）
- 不修改全局、不修改原生原型——消费者应用感知不到库注入了什么
- 解决了旧 `@babel/runtime` 不支持实例方法（如 `arr.includes`）的问题
- 每个使用点单独 import，**不能用 tree-shake 优化掉跨文件重复的 polyfill**（这是 trade-off）

## browserslist 与 targets

`browserslist` 是 targets 的**单一事实源**——`.browserslistrc` 或 `package.json.browserslist` 同时被 Babel preset-env、Autoprefixer、eslint-plugin-compat 等多工具共享。

**配置示例**：

```text
# .browserslistrc
> 0.5%
last 2 versions
not dead
Firefox ESR
not op_mini all
```

**preset-env 与 browserslist 的关系**

- 默认读取 `.browserslistrc` / `package.json.browserslist`
- 可用 preset-env 的 `targets` 选项**直接覆盖**：`{ targets: { chrome: "80", firefox: "78" } }`
- 可用 `ignoreBrowserslistConfig: true` 忽略外部配置
- 可用 `configPath` / `browserslistEnv` 指定配置文件路径与 env 名

**调试 targets**

```bash
# 直接列出当前 browserslist 解析出的浏览器清单
npx browserslist

# 指定查询
npx browserslist "last 2 versions, > 1%"
```

> 详细查询语法（`> 0.25%` / `last 2 versions` / `not dead` / `extends` / `defaults` / `envs`）属 browserslist 独立章节，本章只消费。

## @vitejs/plugin-legacy：差异化打包

`@vitejs/plugin-legacy` 是 Vite 官方的双产物方案——同时产出 modern（`<script type="module">`）+ legacy（`<script nomodule>`）两套 bundle，浏览器自选。现代浏览器只下载最少的现代 polyfill，老浏览器才下载完整 legacy polyfill。

**最小配置**：

```ts
// vite.config.ts
import legacy from "@vitejs/plugin-legacy";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    legacy({
      targets: ["defaults", "not ie 11"], // legacy 浏览器目标
      // modernPolyfills: ["es.array.includes"], // 显式指定 modern 包 polyfill（默认按 usage 自动）
      // additionalLegacyPolyfills: ["whatwg-fetch"], // 额外 legacy polyfill
      renderLegacyChunks: true, // 是否产出 legacy chunk（默认 true）
    }),
  ],
});
```

**机制**

- modern chunk：基于 modern targets（默认现代浏览器），用 esbuild 语法降级，polyfill 极少
- legacy chunk：基于 legacy targets（默认 Safari 11+ 等），走 Babel preset-env + core-js 注入按 targets 裁剪的 polyfill
- HTML 同时注入 `<script type="module" src="modern.js">` 与 `<script nomodule src="legacy.js">`

> module/nomodule 的浏览器支持在 Safari 10.1 / iOS Safari 10.3 之前有 bug（同时执行两套），`@vitejs/plugin-legacy` 内置了 Safarinomodule fix，不用手写。

## 避免全量 polyfill 污染

**反模式 1**：在入口直接 `import "core-js"`（全量）但没配 `useBuiltIns: 'entry'`——等于加载全量 polyfill，没有按 targets 裁剪。

**反模式 2**：在多个 entry 各自 `import "core-js"`——全局碰撞和难以追踪的问题。

**反模式 3**：库构建用 `core-js`（非 pure）或 `preset-env` `useBuiltIns: 'entry'/'usage'`——修改消费者全局。

**正确做法**

```ts
// 应用：preset-env usage + corejs minor 版本
{ "presets": [["@babel/preset-env", { "useBuiltIns": "usage", "corejs": "3.33" }]] }

// 库：preset-env false + transform-runtime + corejs 3
{ "presets": [["@babel/preset-env", { "useBuiltIns": false }]],
  "plugins": [["@babel/plugin-transform-runtime", { "corejs": 3 }]] }

// 应用入口（如果用 entry 模式）
import "core-js/stable";
import "regenerator-runtime/runtime";
```

## @babel/polyfill 弃用与替代

`@babel/polyfill` 自 Babel 7.4（2019）起**弃用**——它内部一次性引入了 core-js@2 全量 + regenerator-runtime，无法按需。

**替代方案**：

```bash
# 卸载旧包
npm uninstall @babel/polyfill

# 安装新包
npm i core-js regenerator-runtime
```

```ts
// 入口 src/main.ts
import "core-js/stable";
import "regenerator-runtime/runtime";
```

配合 `useBuiltIns: 'entry'`，`import "core-js/stable"` 会被替换成按 targets 拆解的具体模块；用 `useBuiltIns: 'usage'` 时这两行都可以删（Babel 会按需自动注入）。

## 动态 polyfill 服务（polyfill.io 的现状）

历史上 `polyfill.io` 提供「按浏览器 UA 动态返回所需 polyfill」的服务，思路优雅——服务端识别 UA、按需返回。**但 2024-02 该域名被中国公司 Funnull 收购后发生供应链攻击事件**（注入恶意代码）：

- Cloudflare 已在其网络层自动重写该域名的链接
- 社区共识是**不再引用该域名**
- 替代镜像：`cdnjs.cloudflare.com/polyfill`、`polyfill-fastly.io`
- **长期建议自托管 core-js**——可用 `core-js-builder` 在 Node 端按 targets 构建定制 bundle（polyfill.io 思路的本地实现）

**自托管示例**：

```ts
// build-polyfill.ts（用 core-js-builder 生成定制 bundle）
import builder from "core-js-builder";

await builder({
  targets: "> 0.5%, last 2 versions, not dead", // browserslist
  output: "./public/polyfill.js",
});
```

## include/exclude：兜底静态分析遗漏

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": "3.33",
        "include": ["es.math.sign", "es.array.includes"],
        "exclude": ["es.array.flat"]
      }
    ]
  ]
}
```

**用途**

- **`include`**：强制包含——处理静态分析遗漏（第三方依赖内部用、动态属性访问）、原生实现有 bug 需要强制覆盖
- **`exclude`**：强制排除——某 targets 下原生实现已稳定且你确认不需要、某 polyfill 与你环境冲突
- 支持字符串（精确匹配 `es.math.sign`）和 RegExp（`/^es.math\./`）

## debug：核对实际注入清单

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": "3.33",
        "debug": true
      }
    ]
  ]
}
```

`debug: true` 让 Babel 在每次构建时 `console.log` 输出：

- 实际启用的 polyfill 清单（按 plugin 列出）
- 触发每个 polyfill 的 target 浏览器
- 最终的 targets 解析结果

**用法**：

```bash
# 跑一次构建，看 console 输出
npx babel src --out-dir lib

# 重点核对：
# 1. targets 是否符合预期（有没有意外的旧浏览器导致 polyfill 暴增）
# 2. 实际注入的 polyfill 清单是否合理（有没有意料之外的大头）
# 3. 第三方依赖的隐式需求有没有被遗漏
```

> 上线前用 `debug: true` 跑一次核对，能立即发现「targets 设太宽导致 polyfill 暴增」或「某依赖需要的 polyfill 被静态分析漏掉」。

## 反模式（避坑）

- **继续用 `@babel/polyfill`**（Babel 7.4 起弃用）：改用 `import "core-js/stable"` + `import "regenerator-runtime/runtime"`
- **多入口各自 `import "core-js"`**：全局碰撞，整个 app 只应在一处入口 import
- **core-js@2 与 core-js@3 混装**：preset-env 会告警且注入重复或错误版本，统一升到 3
- **入口直接 `import "core-js"`（全量）但没配 `useBuiltIns: 'entry'`**：等于加载全量 polyfill，体积爆炸
- **库构建用 `core-js` 或 `useBuiltIns: 'entry'/'usage'`**：污染消费者全局，改用 transform-runtime + corejs:3
- **生产环境仍引用 `polyfill.io` 域名 CDN**：2024-02 供应链事件后不再可信，改自托管或 cdn.cloudflare.com / polyfill-fastly.io 镜像
- **同时设置 `useBuiltIns: 'usage'` 与 `'entry'`**：互斥，只能取其一
- **设置了 `useBuiltIns` 却漏配 `corejs`**：按默认 core-js@2 处理并告警，结果与实际装的 core-js@3 不一致
- **现代浏览器也加载 IE11 的 polyfill（单 bundle）**：未做差异化打包，用 `@vitejs/plugin-legacy` 或 module/nomodule 双产物分流
- **无脑开 `proposals: true`**：引入 core-js 支持的全部未稳定提案，体积与 spec 变更风险增大，仅在确实需要时开
- **依赖 `useBuiltIns: 'usage'` 静态分析却不验证**：dynamic import、字符串动态属性、第三方依赖内部 API 使用可能漏注入，用 `debug: true` 核对 + `include` 兜底
- **`corejs` 版本写错（装 3.33 却写 `'3'`）**：按默认 core-js@2 处理并告警，且漏掉 3.33 后续 minor 新增的 polyfill

## 下一步

- [参考](./reference.md)：`useBuiltIns` 三模式完整对比表、`core-js` 配置清单、`browserslist` 速查、版本状态、官方资源
