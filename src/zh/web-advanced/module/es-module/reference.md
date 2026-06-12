---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **2026-06**。语法形态、import.meta、exports 字段与互操作速查。

## 导出 / 导入语法速查

```js
// ---- 导出 ----
export const a = 1;                    // 命名导出（声明式）
export { b, c as publicC };            // 命名导出（列表式 + 重命名）
export default function () {}          // 默认导出（可匿名，至多一个）
export { x } from "./m.js";            // 重导出：转发，不进当前作用域
export { default as Foo } from "./m.js"; // 转发别人的 default
export * from "./m.js";                // 转发全部命名导出（不含 default）
export * as ns from "./m.js";          // 整体转发为命名空间

// ---- 导入 ----
import def from "./m.js";              // default
import { a, b as alias } from "./m.js"; // 命名 + 重命名
import def, { a } from "./m.js";       // 混合
import * as ns from "./m.js";          // 命名空间（只读、default 在 ns.default）
import "./side-effect.js";             // 仅执行副作用
const mod = await import("./m.js");    // 动态导入：Promise<namespace>
import data from "./a.json" with { type: "json" }; // import attributes（ES2025）
```

硬规则：静态 import/export **只能在模块顶层**、说明符必须**字符串字面量**；导入绑定**只读**（赋值 TypeError）；import 声明**提升**。

## import.meta 速查（Node）

| 属性 | 含义 | 版本 |
| --- | --- | --- |
| `import.meta.url` | 当前模块 `file:` URL | v8.5+（起步即有） |
| `import.meta.dirname` | 模块所在目录（替代 `__dirname`） | v21.2 / **v20.11** 加入，v22.16/v24.0 稳定 |
| `import.meta.filename` | 模块绝对路径（替代 `__filename`） | 同上 |
| `import.meta.resolve(spec)` | 同步解析说明符 → URL 字符串（不加载） | v20.6 / v18.19 稳定 |
| `import.meta.main` | 是否为入口模块（替代 `require.main === module`） | v24.2+ |

老版本兜底：`path.dirname(fileURLToPath(import.meta.url))`；定位资源用 `new URL("./data.json", import.meta.url)`。

## CJS 能力替代表

| CommonJS | ESM 替代 |
| --- | --- |
| `require()` | `import` / `import()`；同步逃生舱 `createRequire(import.meta.url)` |
| `require.resolve()` | `import.meta.resolve()` |
| `__dirname` / `__filename` | `import.meta.dirname` / `import.meta.filename` |
| `module.exports =` | `export default` / `export { x as "module.exports" }`（后者定制 require(esm) 返回值） |
| `require.cache` | 无对应（ESM 缓存不可手动失效） |

## package.json exports 速查

```jsonc
{
  "name": "pkg",
  "type": "module",
  "main": "./dist/index.cjs",        // 仅喂老 Node/老工具；新环境被 exports 覆盖
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",  // ① types 必须最前
      "import": "./dist/index.js",   // ② 按键顺序匹配
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"   // ③ default 必须殿后
    },
    "./utils": "./dist/utils.js",    // 子路径：没列出的一律不可达
    "./features/*.js": "./src/features/*.js", // 通配：* 是字符串替换
    "./internal/*": null             // null：显式封禁
  },
  "imports": { "#dep": "./src/dep.js" } // # 私有内部映射
}
```

口诀：**types 最前、default 殿后、键顺序即匹配顺序**；exports 一旦定义即**封装**（`ERR_PACKAGE_PATH_NOT_EXPORTED`）且**优先于 main**；target 必须 `./` 开头、禁 `..` 逃逸。

## 互操作速查

| 方向 | 行为 |
| --- | --- |
| ESM `import` CJS | `default` = `module.exports`；命名导入靠 cjs-module-lexer 静态猜（动态导出猜不到） |
| ESM 里要同步 require | `import { createRequire } from "node:module"` + `createRequire(import.meta.url)` |
| CJS `require` ESM | v22.12/v20.19 默认可用、**v25.4 stable**；模块图须全同步，含 TLA 抛 `ERR_REQUIRE_ASYNC_MODULE` |
| CJS 加载异步 ESM | 只能动态 `import()` |

## 关键版本线（Node）

| 事件 | 版本 |
| --- | --- |
| ESM 实验起步 | v8.5（2017，`--experimental-modules`） |
| `"type": "module"` | v12 起 |
| ESM 正式稳定 | v12.22 / v14.17 / v15.3 |
| Top-level await 免 flag | v14.8 |
| import assertions 实验 → attributes（with） | v16.14 实验 → v18.20/v20.10/v21 切 with → **v22.0 移除 assert** → v22.12/v23.1 稳定 |
| `require(esm)` | v22.0/v20.17 flag → v22.12/v20.19/v23.0 默认开 → **v25.4 stable** |

## 浏览器支持基线

| 特性 | 支持 |
| --- | --- |
| `<script type="module">` | 2017-2018 起全主流（Chrome 61 / Firefox 60 / Safari 11） |
| import maps | Chrome/Edge 89+、Firefox 108+、Safari 16.4+，全球约 **94.5%**；老浏览器用 es-module-shims |
| `<link rel="modulepreload">` | 全主流可用 |
| import attributes（JSON） | 三引擎已支持（ES2025） |
