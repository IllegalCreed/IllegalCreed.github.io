---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **@babel/core 7.29.x**（`latest`）。CLI、核心包、配置文件、顺序规则与版本现状速查。

## CLI 速查

```bash
npx babel src --out-dir dist        # 编译目录到 dist/
npx babel src --out-file bundle.js  # 合并输出到单文件
npx babel src/x.js                  # 输出到 stdout
npx babel src --watch               # 监听增量编译
npx babel src -d dist --source-maps # 产出 source map
npx babel src -d dist --ignore "src/**/*.test.js"   # 忽略匹配文件
npx babel src -d dist --copy-files  # 一并复制非 JS 文件
npx babel --config-file ./babel.config.json src -d dist   # 指定配置文件
```

> `@babel/cli` 提供 `babel` 命令；打包器集成通常用 `babel-loader`（webpack）/对应插件，而非直接用 CLI。

## 核心包速查

| 包 | 职责 |
|---|---|
| `@babel/core` | 编排者：读配置、跑 parse/transform/generate |
| `@babel/cli` | 命令行工具（`babel` 命令） |
| `@babel/parser` | parse：源码 → Babel AST（fork 自 acorn） |
| `@babel/traverse` | transform：visitor 遍历/改写 AST |
| `@babel/generator` | generate：AST → 代码 + source map |
| `@babel/types` | 构建/校验 AST 节点（写插件用） |
| `@babel/preset-env` | 智能预设：按 targets 降级 + 注入 polyfill |
| `@babel/preset-typescript` | 剥 TS 类型（**不检查**） |
| `@babel/preset-react` | 转 JSX（`runtime: automatic`） |
| `@babel/plugin-transform-runtime` | helpers 去重 + 沙箱化 polyfill（库用） |
| `@babel/runtime` | transform-runtime 的运行时依赖 |
| `core-js` | 实际的 polyfill 实现（应用注入） |

## 配置文件类型

| 文件 | 类型 | 作用范围 |
|---|---|---|
| `babel.config.json` / `.js` / `.cjs` | **项目级** | 整个项目，**含 `node_modules`**（推荐，尤其 monorepo） |
| `.babelrc.json` / `.js` | **文件相对** | 沿目录上找、遇含 `package.json` 即停，**管不到 `node_modules`** |
| `package.json` 的 `"babel"` 字段 | 文件相对 | 同 `.babelrc`，内联在 package.json |
| 编程选项（传给 `babel.transform`） | — | 合并优先级**最高** |

> JS/CJS 配置（可执行）需用 `api.cache(...)` 声明缓存策略，JSON 配置不需要。

## preset / plugin 顺序规则

- **Plugins run before Presets.**（plugin 整体先于 preset）
- **Plugin ordering is first to last.**（plugin 正序）
- **Preset ordering is reversed (last to first).**（preset 逆序）
- Transform plugins 会自动启用对应的 syntax plugin。

```json
{
  "plugins": ["a", "b"],                          // a → b
  "presets": ["@babel/preset-env", "@babel/preset-react"]  // react 先，env 后
}
```

## polyfill 策略速记

| 方式 | 谁用 | 要点 |
|---|---|---|
| `useBuiltIns: "usage"` + `corejs` | **应用** | 按用到的 API 注入，最省体积；`corejs` 带次版本 |
| `useBuiltIns: "entry"` + `import "core-js/stable"` | 应用 | 按 targets 全量注入入口 |
| `plugin-transform-runtime` + `corejs` | **库** | 沙箱化、不污染全局 + helpers 去重 |
| ~~`@babel/polyfill`~~ | — | **7.4 起已废弃**，改用 `core-js/stable` |

## 与各工具的分工速记

| 任务 | 谁来做 |
|---|---|
| 语法转换 / 降级 | **Babel** / SWC / esbuild / Oxc（都做，Babel 最慢） |
| polyfill 注入 | **Babel + core-js**（preset-env / transform-runtime） |
| 类型检查 | **只有 tsc**（`tsc --noEmit`）——Babel/SWC/esbuild 都不检查 |
| 极速转换 | SWC（Rust，~18×/60×+）/ Oxc（Rust，20~50×）/ esbuild（Go） |
| 打包 | 打包器（webpack/Vite/Rolldown），Babel 不打包 |
| 自定义转换 / codemod / 提案语法 | **Babel**（visitor + 最大插件生态） |

## 版本现状（2026-06）

| 包 | dist-tag | 版本 |
|---|---|---|
| `@babel/core` | `latest` | **7.29.x**（当前稳定） |
| `@babel/core` | `next` | **8.0.0-rc.x**（**RC，未 GA**） |

> Babel 8 破坏性要点：ESM-only、Node 最低 `^22.18.0 \|\| >=24.11.0`、`loose`/`spec`→`assumptions`、preset-react 默认 `automatic`、`corejs` 选项移除→`babel-plugin-polyfill-corejs3`、preset-env 默认 targets→`"defaults"`、`proposal-*`→`transform-*`、bugfixes 恒开。详见[专家篇](./guide-line/expert)。
