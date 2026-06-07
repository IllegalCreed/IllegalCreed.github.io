---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **@babel/core 7.29.x**。`preset-env` + browserslist/targets、polyfill 三策略、`preset-typescript`/`preset-react`、`overrides`、配置合并优先级与 `api.cache`——把 Babel 用进真实项目。

## 一、preset-env + targets / browserslist

`@babel/preset-env` 是「智能预设」：「a smart preset that allows you to use the latest JavaScript without needing to micromanage which syntax transforms (and optionally, browser polyfills) are needed by your target environment(s).」核心是告诉它**目标环境**，它自己算要转什么。

声明目标有两种方式（**任选其一，不要重复**）：

```json
// 方式 A：preset-env 的 targets
{ "presets": [["@babel/preset-env", { "targets": "defaults" }]] }
```

```text
# 方式 B：项目根 .browserslistrc（Babel/postcss/autoprefixer 共享）
> 0.5%
last 2 versions
not dead
```

- `targets` 支持浏览器 query、`{ "node": "22" }`、`"esmodules": true` 等。
- 用 browserslist 的好处：**与 PostCSS/Autoprefixer 等共用一份目标**，避免多处不一致。
- 不写任何 targets → preset-env 会**全量降级**（7.x 默认相当于把所有特性都转掉），产物臃肿。**生产项目务必显式声明 targets。**

## 二、polyfill 三策略

preset-env 只转**语法**；运行时 **API**（`Promise`、`Array.prototype.includes`、`Object.fromEntries`）要靠 polyfill。用 `useBuiltIns` + `corejs` 控制：

| `useBuiltIns` | 行为 | 适用 |
|---|---|---|
| `"usage"` | 按代码**实际用到**的 API 自动注入（按文件） | **应用**（最省体积、首选） |
| `"entry"` | 按 `targets` 全量注入，需在入口手写 `import "core-js/stable"` | 应用（要覆盖第三方依赖用到的 API 时） |
| `false`（默认） | 不处理 polyfill | 自行管理 / 库 |

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": "defaults",
      "useBuiltIns": "usage",
      "corejs": "3.36"
    }]
  ]
}
```

::: warning corejs 要带次版本号
`corejs` 写成 `"3"` 会被当作 `3.0`，**漏掉 3.x 后续版本新增的 polyfill**。务必写到次版本（如 `"3.36"`），并把 `core-js` 装进 `dependencies`。
:::

### 库作者：用 transform-runtime，别污染全局

应用可以用 `useBuiltIns: usage` 往全局塞 polyfill；但**库（library）这么做会污染使用方的全局环境**。库应改用 `@babel/plugin-transform-runtime` + `@babel/runtime`：

```json
{
  "plugins": [
    ["@babel/plugin-transform-runtime", { "corejs": 3 }]
  ]
}
```

它做两件事：① **helpers 去重**——把 Babel 注入的内联 helper 抽成对 `@babel/runtime` 的引用，避免每个文件重复；② 用 `corejs` 选项做**沙箱化 polyfill**——以局部别名引用 core-js，不往全局原型挂方法，不污染宿主。

> 历史提醒：`@babel/polyfill` 自 **7.4 起已废弃**，不要再用；改为 `import "core-js/stable"`（entry 策略）或交给 `useBuiltIns`/transform-runtime。

## 三、preset-typescript：剥类型，不检查

`@babel/preset-typescript` 让 Babel 直接吃 `.ts`/`.tsx`，但官方明确：「**This plugin does not add the ability to type-check the JavaScript passed to it.**」而且：「Since Babel does not type-check, code which is syntactically correct, but would fail the TypeScript type-checking may successfully get transformed, and often in unexpected or invalid ways.」

```json
{ "presets": ["@babel/preset-env", "@babel/preset-typescript"] }
```

要点：

- 它**逐文件剥类型**，行为类似 TS 的 `isolatedModules`——依赖跨文件类型信息的写法（如 `const enum`、类型重导出）会出问题。
- **类型安全要另跑 `tsc --noEmit`**：典型分工是「Babel 负责快速产出 JS + `tsc --noEmit` 负责把关类型」，二者并行。
- 某些 TS 特性（如带 emit 行为的 `enum`、参数属性、legacy 装饰器）需对应选项或插件，且语义可能与 tsc 有细微差异。

## 四、preset-react：runtime automatic

`@babel/preset-react` 转 JSX。React 17+ 的新 JSX 运行时用 `runtime: "automatic"`，写 JSX **不再需要手动 `import React`**：

```json
{
  "presets": [
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

- `"automatic"`：自动从 `react/jsx-runtime` 引入工厂函数（现代项目首选）。
- `"classic"`（旧默认）：转成 `React.createElement`，需手动 `import React`。
- 开发期可配 `development: true` 注入调试信息（或用 `react/jsx-dev-runtime`）。

> ⚠️ Babel 8 会把 preset-react 的 `runtime` 默认值从 `classic` 改为 `automatic`（见[专家篇](./expert)）。

## 五、overrides：按文件做差异化配置

`overrides` 让一份配置内对**不同文件子集**应用不同选项（用 `test`/`include`/`exclude` 匹配）：

```json
{
  "presets": ["@babel/preset-env"],
  "overrides": [
    {
      "test": ["./src/legacy/**/*.js"],
      "presets": [["@babel/preset-env", { "targets": "ie 11" }]]
    }
  ]
}
```

适合「主代码用现代 targets、个别遗留目录用更低 targets」这类需求，比拆多份配置更集中。

## 六、配置合并优先级

当多份配置同时命中一个文件时，Babel 按**优先级从低到高**合并（高的覆盖低的）：

1. `babel.config.json`（项目级，最低）
2. `.babelrc.json`（文件相对）
3. 直接传给 `babel.transform` 的**编程选项**（programmatic options，最高）
4. 同一份配置内，`overrides` / `env` 命中的块会再叠加到对应基础项之上

理解这条链，能解释「为什么 root 配了却被某个 `.babelrc` 覆盖」「为什么构建工具传的选项最终说了算」。

## 七、api.cache：JS 配置文件的缓存

用 `babel.config.js`（JS 而非 JSON）时，函数式配置默认**每次都重新执行**。必须显式声明缓存策略，否则 Babel 报错提醒你：

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true); // 永久缓存（配置不随环境变化时）
  // 或：api.cache.using(() => process.env.NODE_ENV); // 按 NODE_ENV 变化失效
  return {
    presets: ["@babel/preset-env"],
  };
};
```

- `api.cache(true)`：结果永久缓存。
- `api.cache(false)`：永不缓存（每次重算）。
- `api.cache.using(() => process.env.NODE_ENV)`：按依赖值变化决定是否失效（最常用）。

> 用 `.json` 配置不涉及此问题；只有**可执行的 `.js`/`.cjs` 配置**才需要 `api.cache`。

---

进入 [指南 · 专家](./expert)：插件编写（visitor/AST）、`@babel/types`、`loadPartialConfig`、`caller`、为什么比 SWC/Oxc 慢、Babel 8 破坏性变更与迁移。
