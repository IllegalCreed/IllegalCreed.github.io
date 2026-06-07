---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 插件编写（visitor / AST）、`@babel/types`、`loadPartialConfig`、`caller`、为什么比 SWC/Oxc 慢、Babel 8 破坏性变更与迁移。截至 2026-06：`@babel/core` `latest` = **7.29.x**；**Babel 8 仍是 RC（8.0.0-rc.x，未 GA）**。

## 一、写一个插件：visitor 与 AST

Babel 插件本质是**一组作用于 AST 节点类型的 visitor**。插件是个返回 `{ visitor }` 的函数，`visitor` 的键是节点类型，值是进入该节点时的回调：

```js
// 把所有标识符 foo 改名为 bar
export default function myPlugin() {
  return {
    name: "rename-foo-to-bar",
    visitor: {
      Identifier(path) {
        if (path.node.name === "foo") {
          path.node.name = "bar";
        }
      },
    },
  };
}
```

- `path` 是节点的**包装器**，提供上下文与改写能力：`path.node`（当前节点）、`path.parent`、`path.scope`（作用域/绑定）、`path.replaceWith()`/`remove()`/`insertBefore()` 等。
- visitor 在 **transform 阶段**由 `@babel/traverse` 驱动；进入/退出节点可分别用 `enter`/`exit`。
- 这套机制就是 codemod 与社区插件的底座——**理解 path + visitor 等于理解 Babel 的可扩展性**。

## 二、@babel/types：构建与校验节点

改写 AST 时不要手搓对象字面量，用 `@babel/types`（惯例命名 `t`）来**构建**和**校验**节点，保证结构合法：

```js
import * as t from "@babel/types";

// 构建：const answer = 42;
const decl = t.variableDeclaration("const", [
  t.variableDeclarator(t.identifier("answer"), t.numericLiteral(42)),
]);

// 校验：判断节点类型
if (t.isIdentifier(path.node, { name: "foo" })) {
  /* ... */
}
```

`@babel/types` 提供每种节点的**构造器**（`t.identifier`、`t.callExpression` …）与**断言/判定器**（`t.isXxx`、`t.assertXxx`），是写插件的标准工具。

## 三、loadPartialConfig 与 caller

构建工具集成 Babel 时常用这两个 API：

```js
import { loadPartialConfig, transformAsync } from "@babel/core";

// 解析「最终会用到哪些配置 / 文件」，但不真正编译——loader 用它做缓存键、判断要不要处理某文件
const partial = loadPartialConfig({ filename, cwd });

// transform 时通过 caller 表明「是谁在调用 Babel」，preset/plugin 可据此调整行为
await transformAsync(code, {
  filename,
  caller: { name: "my-loader", supportsStaticESM: true, supportsDynamicImport: true },
});
```

- **`loadPartialConfig`**：在不实际转换的前提下解析配置链（含 `overrides`/`env` 合并结果），`babel-loader` 等用它生成稳定缓存键、决定是否跳过文件。
- **`caller`**：让调用方（loader/打包器）把自身能力（如是否支持原生 ESM）告诉 Babel，preset-env 等会据此**少做无谓转换**（例如调用方支持 ESM 时就不把 `import` 转成 CJS）。

## 四、为什么 Babel 比 SWC / Oxc 慢

根因是**实现语言 + 管线设计**，不是某个配置没调好：

- **纯 JavaScript 实现**：受 JS 单线程与 GC 影响；SWC 用 **Rust**、Oxc 用 **Rust**，可多核并行、无 GC 开销。
- **通用 visitor 管线**：每个插件各自遍历/改写 AST，节点反复进出 visitor，抽象灵活但开销大；原生工具把多趟合并、用更紧凑的数据结构。
- 量级参考：SWC 官方称单线程约 **18×**、多核约 **60×+** 于 Babel；Oxc 宣称 **20~50×**。

> 取舍：Babel 慢，但换来**最大的插件/codemod 生态**与 **TC39 提案试验场**地位。需要极致速度且无需自定义转换时，用 SWC/Oxc/esbuild；需要丰富插件、codemod、跑提案语法时，Babel 仍不可替代。

## 五、Babel 8：破坏性变更与迁移

截至 2026-06，Babel 8 是 **`8.0.0-rc.x`（RC，尚未 GA）**，`latest` 仍是 7.29.x。迁移哲学（官方）：「updating to Babel 8 should be easy: most of them have been already introduced in Babel 7 behind an option.」主要破坏性变更：

| 变更 | Babel 7 | Babel 8 |
|---|---|---|
| 模块格式 | CJS + ESM | **ESM-only**（原生 ESM，不再发 CJS） |
| 最低 Node | 较低 | **`^22.18.0 \|\| >=24.11.0`** |
| `loose` / `spec` | 各插件单独选项 | **移除** → 顶层 `assumptions` |
| preset-react `runtime` | 默认 `classic` | **默认 `automatic`** |
| polyfill 的 `corejs` | `useBuiltIns`/transform-runtime 带 `corejs` | **移除** → 改用 `babel-plugin-polyfill-corejs3` |
| preset-env 默认 targets | `">=0%"`（约等于全量降级） | **`"defaults"`** |
| 插件命名 | `proposal-*` | **统一为 `transform-*`**（提案落地后重命名） |
| bugfixes | 可选项 | **恒开并移除该选项** |

迁移建议：

- **先在 Babel 7 把能提前做的做掉**：用顶层 `assumptions` 替代 `loose`/`spec`、preset-react 显式写 `runtime: "automatic"`、preset-env 显式写 `targets`。
- **polyfill** 提前迁到 `babel-plugin-polyfill-corejs3`。
- **确认运行环境 Node 版本**满足 8 的最低要求，并检查工具链对 **ESM-only** 包的兼容性。
- 这样等 8 正式 GA 时，多数项目只需小幅调整即可切换。

## 六、专家级易错点

- **库用了 `useBuiltIns: usage`**：污染使用方全局——库应改 `transform-runtime` + `corejs` 沙箱化。
- **`corejs: "3"`**：被当 3.0，漏新 polyfill——务必带次版本。
- **以为 preset-typescript 会查类型**：它只剥类型，类型错照样产出——必须配 `tsc --noEmit`。
- **不配 targets**：preset-env 全量降级，产物臃肿——生产必须声明 targets/browserslist。
- **`.babelrc` 想编 `node_modules`**：管不到——跨包/编依赖用 `babel.config.json`。
- **JS 配置忘了 `api.cache`**：函数式 `babel.config.js` 不声明缓存会报错——按 `NODE_ENV` 用 `api.cache.using`。

---

回到 [参考](../reference) 查 CLI、核心包、配置文件类型与版本现状速查表。
