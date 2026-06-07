---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 基于 **@swc/core 1.15.x**。本篇把「能编译」用到「会配置」：`.swcrc` 结构、`jsc.parser` / `jsc.target` / `module.type` 与 `minify`。

## 一、.swcrc 的整体结构

`.swcrc` 是一份 JSON，顶层主要分四块：**`jsc`（编译器核心）/ `module`（模块输出）/ `env`（按目标环境）/ `minify`（压缩开关）**，外加 `sourceMaps`、`isModule`、`$schema` 等。

```jsonc
{
  "$schema": "https://swc.rs/schema.json",
  "jsc": {
    "parser": { "syntax": "typescript", "tsx": true },
    "target": "es2022",
    "transform": { "react": { "runtime": "automatic" } },
    "externalHelpers": true
  },
  "module": { "type": "es6" },
  "minify": false,
  "sourceMaps": true
}
```

- `jsc`：解析与转译的核心（语法、目标、transform、插件……）。
- `module`：把 `import`/`export` 输出成哪种模块系统。
- `env`：以「目标环境」反推降级（与 `jsc.target` **二选一**，见进阶篇）。
- `minify`：顶层布尔，开总压缩；细粒度在 `jsc.minify`。

> 官方：「Compilation works out of the box with SWC and does not require customization.」——大多数项目从最小配置起步即可。

## 二、jsc.parser：先告诉 SWC 这是什么语法

SWC 必须先知道按 JS 还是 TS 解析，`syntax` 二选一，且 **JSX 开关随 syntax 不同而不同**：

```jsonc
// TypeScript / TSX
{ "jsc": { "parser": { "syntax": "typescript", "tsx": true, "decorators": true } } }

// 普通 JavaScript / JSX
{ "jsc": { "parser": { "syntax": "ecmascript", "jsx": true, "decorators": true } } }
```

| 字段 | 属于哪种 syntax | 说明 |
|---|---|---|
| `syntax` | — | `"ecmascript"`（默认）/ `"typescript"` |
| `jsx` | `ecmascript` | 解析 `.jsx`（默认 `false`） |
| `tsx` | `typescript` | 解析 `.tsx`（默认 `false`） |
| `decorators` | 两者 | 解析装饰器语法（默认 `false`） |
| `dynamicImport` | `ecmascript` | 解析 `import()`（默认 `false`） |

> ⚠️ **`jsx` 和 `tsx` 不通用**：TS 文件想支持 JSX 要写 `tsx: true`（不是 `jsx`）。写错 parser 字段会导致 JSX 直接解析失败。

## 三、jsc.target：降级到哪代 ES

`target` 决定 SWC 把新语法降级到哪一代 ECMAScript：

```jsonc
{ "jsc": { "target": "es2022" } }
```

- 取值：`es3` / `es5` / `es2015` … `es2022` / `esnext`。
- **默认是 `es5`**：不显式写，SWC 会把代码一路降到 ES5（多打不必要的降级代码）。按运行环境显式设 `es2020`/`es2022` 更合适。
- `target` 只管**语法降级**，与 `env` **互斥**（要按 browserslist 反推降级用 `env`，见进阶篇）。

::: warning target 只降「语法」，不补「API」
和 tsc 一样，`target` 只把 `async/await`、可选链等**语法**降级，**不会**给旧环境补 `Promise`、`Array.prototype.includes` 等**运行时 API**。要补 polyfill 得用 `env`（配 `coreJs`）或在打包器侧引入 core-js。
:::

## 四、module.type：输出哪种模块格式

`module.type` 决定 `import`/`export` 编译成什么模块系统：

| 值 | 产物 | 适用 |
|---|---|---|
| `es6` | 保留原生 ESM（`import`/`export`） | 交给打包器（**默认**） |
| `commonjs` | `require` / `exports` | 传统 Node / CJS |
| `amd` | AMD 定义 | 旧浏览器加载器 |
| `umd` | 通用模块定义 | 同时兼容多环境 |
| `systemjs` | SystemJS 格式 | SystemJS 运行时 |

```jsonc
{ "module": { "type": "commonjs", "strict": false, "lazy": false } }
```

常配的子项：

- `strict`：在 CJS 产物里更严格地模拟 ESM 的 `__esModule` 语义。
- `strictMode`：是否输出 `"use strict"`（默认 `true`）。
- `lazy`：惰性加载 require 的依赖。
- `importInterop`：`"swc"`（默认）/ `"node"` / `"none"`，控制 CJS/ESM 互操作的 helper 行为——配错会影响默认导入能否正常工作。

## 五、minify：压缩

两个层级：

```jsonc
// 顶层布尔：开关总压缩
{ "minify": true }

// jsc.minify：细粒度（Terser 兼容）
{
  "jsc": {
    "minify": {
      "compress": true,
      "mangle": true,
      "format": { "comments": false }
    }
  }
}
```

- SWC 的压缩器**与 Terser 兼容**：`compress`（去死代码/折叠）、`mangle`（混淆变量名）、`format`（输出格式）。
- 构建期通常**不在 SWC 里开 minify**，而把压缩交给打包器统一做（避免重复压缩、便于整体优化）；写库或单独用 SWC 产出最终产物时才开。

## 六、externalHelpers：把助手函数外置

降级会产生重复的 helper（如 `_extends`、`_class_call_check`）。开 `externalHelpers` 后，SWC **从 `@swc/helpers` 引入**这些 helper，而非在每个文件内联：

```jsonc
{ "jsc": { "externalHelpers": true } }
```

```bash
npm i @swc/helpers   # externalHelpers 必须装这个运行时依赖
```

> 官方：开启后「injects imports from `@swc/helpers` rather than inlining」「you must add `@swc/helpers` as a dependency」。多文件项目能显著减小总体积。

---

进入 [指南 · 进阶](./advanced)：`env` 与 preset-env 对位、polyfill、装饰器、`baseUrl`/`paths`、`swc-loader` 与 `@swc/jest`。
