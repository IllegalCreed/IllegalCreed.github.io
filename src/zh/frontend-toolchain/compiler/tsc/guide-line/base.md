---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 基于 **TypeScript 6.0.x**。本篇把「能编译」用到「会配置」：`target` / `module` / `lib` / `strict` / `jsx` 与产物形态。

## 一、target：降级到哪个 ES 版本

`target` 决定 tsc 把新语法降级到哪一代 ECMAScript，并隐式决定默认的 `lib`。

```jsonc
{ "compilerOptions": { "target": "es2022" } }
```

- 取值：`es2015` … `es2022` / `es2023` / `esnext`。
- **TS 6.0 起 `es5` 已弃用、最低 `es2015`**：例如 `target: es2015` 时，箭头函数保留、但 `??` / `?.`（ES2020）会被降级。
- 仍需 ES5 产物（兼容 IE 等）→ 交给 Babel/SWC，tsc 已不再覆盖这一档。

::: warning target 只降「语法」，不补「API」
`target: es2015` 会把 `async/await` 转掉，但**不会**给旧环境补 `Promise`、`Array.prototype.includes`、`Object.fromEntries` 这些**运行时 API**——tsc 不注入 polyfill。缺的内置 API 要靠 core-js 等 polyfill，或用更高的 `target` + 限定运行环境。
:::

## 二、module：输出哪种模块格式

`module` 决定 `import` / `export` 编译成什么模块系统：

| 值 | 产物 | 适用 |
|---|---|---|
| `nodenext` | 按文件扩展名 / `package.json` 的 `type` 在 ESM、CJS 间自动选 | Node 项目（推荐） |
| `esnext` | 保留原生 ESM（`import`/`export` 不动） | 交给打包器 |
| `commonjs` | `require` / `module.exports` | 传统 Node/CJS |
| ~~`amd`/`umd`/`systemjs`~~ | — | **TS 6.0 已移除** |

```jsonc
{ "compilerOptions": { "module": "nodenext" } }
```

> `nodenext` 会一并要求 `moduleResolution: nodenext`，并严格按 Node 的 ESM 规则：相对导入要带扩展名（`./a.js`）、靠 `package.json` 的 `type` 判定 `.ts` 文件是 ESM 还是 CJS。

## 三、lib：内置类型环境

`lib` 声明运行环境提供了哪些全局类型（不影响产物，只影响类型检查）：

```jsonc
{ "compilerOptions": { "lib": ["es2022", "dom", "dom.iterable"] } }
```

- 不写 `lib` 时，按 `target` 取默认（如 `target: es2022` → `lib: ["es2022", "dom", ...]`）。
- 写 Node 服务、不碰浏览器：去掉 `"dom"`，只留 `["es2022"]`，避免误用 `window`/`document`。
- 想用 ES2025 的 `Temporal` 等新 API 类型：把对应 `lib`（如 `"es2025"` 或细分 `"esnext.*"`）加进来。

## 四、strict：一组严格检查（6.0 默认）

`strict: true` 是「全家桶开关」，等价于一次性打开：

`strictNullChecks` · `strictFunctionTypes` · `strictBindCallApply` · `strictPropertyInitialization` · `noImplicitAny` · `noImplicitThis` · `useUnknownInCatchVariables` · `alwaysStrict`。

```jsonc
{ "compilerOptions": { "strict": true } }
```

::: tip TS 6.0 把 strict 设为默认
没显式写 `strict` 的旧项目，升级 6.0 后等于一次性继承了全套严格检查，最常见的是 `strictNullChecks` 带来的「对象可能为 null」报错。要平滑过渡，可临时显式 `"strict": false` 或逐项关闭，再分批修复。
:::

最常单独叠加的非 strict 检查：`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`。

## 五、产出控制：outDir / rootDir / declaration / sourceMap

```jsonc
{
  "compilerOptions": {
    "outDir": "./dist",      // 产物根目录
    "rootDir": "./src",      // 源码根（决定 dist 内的目录结构）
    "declaration": true,     // 产出 .d.ts（库必备）
    "declarationMap": true,  // .d.ts.map，支持跨包「跳转到源码」
    "sourceMap": true,       // 调试用 source map
    "removeComments": false
  }
}
```

- `rootDir` 不设时会按所有输入文件的最长公共目录推断，常导致 `dist` 里多出一层 `src/`——显式设它最稳。
- **只想类型检查、不要产物**：`"noEmit": true`（或命令行 `tsc --noEmit`）。
- 检查不通过仍想拿到产物：`"noEmitOnError": false`（默认）；想「报错就不产出」则设 `true`。

## 六、jsx：处理 React/JSX

```jsonc
{ "compilerOptions": { "jsx": "react-jsx" } }
```

| 值 | 行为 |
|---|---|
| `react-jsx` | 新 JSX 运行时（React 17+），无需 `import React` |
| `react-jsxdev` | 同上，开发模式带调试信息 |
| `preserve` | 保留 `<div/>` 原样，交给 Babel/打包器处理 |
| `react` | 经典运行时，转成 `React.createElement`（需手动 import React） |

## 七、esModuleInterop：CJS/ESM 互操作

```jsonc
{ "compilerOptions": { "esModuleInterop": true } }
```

开启后，`import express from "express"`（CommonJS 包的默认导入）能正常工作，并自动连带 `allowSyntheticDefaultImports`。**新项目一律建议开**——否则要被迫写 `import * as express from "express"`。

---

进入 [指南 · 进阶](./advanced)：模块解析、`isolatedModules`、`verbatimModuleSyntax`、工程引用与增量构建。
