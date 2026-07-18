---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Webpack / Rollup / Vite / Tailwind CSS 官方文档编写，对照 Webpack 5.108、Rollup 4、Vite 8（Rolldown）、Tailwind v4 行为

## 速查

- **本质**：构建期死代码消除；ESM 静态分析 + 标记 + 压缩期删除三步
- **sideEffects 三态**：`false` / `Array<string>` 白名单 / 缺省（保守保留）
- **Webpack 五开关**：`usedExports` / `sideEffects` / `innerGraph` / `concatenateModules` / `minimize`，`mode=production` 全开
- **Rollup treeshake**：`smallest` / `safest` / `recommended`（默认 `true`=recommended）
- **注解**：`/*#__PURE__*/`（单次调用、通用）/ `/*@__NO_SIDE_EFFECTS__*/`（整函数声明、Rollup 专属）
- **Vite 8**：Rolldown 替代 Rollup；`build.rolldownOptions` 替代 `build.rollupOptions`；`output.codeSplitting` 替代 `output.manualChunks`
- **Tailwind v4**：默认 tree-shaking + `@source` / v3 `content` 数组 / PurgeCSS 独立工具
- **核心原则**：ESM 前提 + 库声明 `sideEffects` + 生产模式 + `minimize` 开 + 注解精确
- 完整说明见 [入门](./getting-started.md) / [核心机制与配置](./guide-line.md)

## sideEffects 三态语义

| 取值 | 含义 | 典型用法 |
| --- | --- | --- |
| `false` | 整包可 shake | 纯 ESM 工具库 / 组件库的 JS 部分 |
| `Array<string>` | 白名单 glob | 含 CSS / polyfill / 全局补丁的包 |
| 缺省 | 保守保留整模块 | 不推荐——等于放弃优化 |

**典型白名单**

```json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js",
    "./src/global-patch.js"
  ]
}
```

## Webpack optimization 完整开关

| 选项 | 默认（production） | 默认（development） | 作用 |
| --- | --- | --- | --- |
| `usedExports` | `true` | `true`（Webpack 5+） | 标记每个模块的导出哪些被使用 |
| `sideEffects` | `true` | `true`（Webpack 5+） | 按 `package.json sideEffects` 跳过整模块 |
| `innerGraph` | `true` | `true`（Webpack 5+） | 未使用导出的内部依赖图分析 |
| `providedExports` | `true` | `true`（Webpack 5+） | 收集模块提供了哪些导出 |
| `mangleExports` | `'deterministic'` | `false` | 短名压缩导出标识符 |
| `concatenateModules` | `true` | `false` | Scope Hoisting：合并模块作用域 |
| `minimize` | `true` | `false` | 真正执行删除（Terser / esbuild） |
| `minimizer` | `[new TerserPlugin()]` | `[]` | 压缩器插件列表 |

**关键关系**

- `mode: 'production'` 一键启用上述全部
- `usedExports` 标记 + `minimize: true` 删除 = 死代码真正消失
- 只标 `usedExports` 不开 `minimize`：死代码仍在 bundle
- `sideEffects` 比 `usedExports` 更彻底（跳过整模块 vs 标记单导出）

**Webpack Rule 级覆盖**

```ts
module: {
  rules: [
    {
      test: /\.js$/,
      sideEffects: false,        // 按模块规则覆盖 sideEffects
    },
  ],
}
```

## Rollup treeshake 完整子选项

| 选项 | 默认 | 含义 |
| --- | --- | --- |
| `annotations` | `true` | 尊重 `/*#__PURE__*/` / `/*@__NO_SIDE_EFFECTS__*/` 注解 |
| `moduleSideEffects` | `true` | 模块副作用假设；可设 `false` / `'no-external'` / `string[]` / `(id, external) => boolean` |
| `manualPureFunctions` | `[]` | 始终视为无副作用的函数名数组，如 `['clsx', 'css']` |
| `propertyReadSideEffects` | `true` | 属性读 `obj.x` 可能副作用（getter） |
| `tryCatchDeoptimization` | `true` | try/catch 内代码不被 shake（polyfill 检测易卡这里） |
| `unknownGlobalSideEffects` | `true` | 未知全局变量访问视为副作用 |
| `correctVarValueBeforeDeclaration` | `false` | 严格 var 初始化前值 |

**三预设差异**

| 预设 | 关键差异 |
| --- | --- |
| `'smallest'` | 最激进：`moduleSideEffects: false`、`tryCatchDeoptimization: false`，体积最小但有正确性风险 |
| `'safest'` | 最保守：保留更多代码 |
| `'recommended'`（默认） | 平衡：`annotations: true`、`propertyReadSideEffects: true`、`tryCatchDeoptimization: true` |

## Vite 8 Rolldown 迁移对照

| Vite 7（Rollup） | Vite 8（Rolldown） | 状态 |
| --- | --- | --- |
| `build.rollupOptions` | `build.rolldownOptions` | 入口改名 |
| `output.manualChunks`（对象） | **已移除** | 静默不生效 |
| `output.manualChunks`（函数） | `output.codeSplitting`（弃用警告） | 函数形式已弃用 |
| Rollup treeshake 全部子选项 | Rolldown 对应选项 | 选项名兼容，行为对齐 |

**编译期常量**

| 表达式 | prod build 替换 |
| --- | --- |
| `import.meta.env.DEV` | `false` |
| `import.meta.env.PROD` | `true` |
| `import.meta.env.MODE` | `'production'` |
| `import.meta.env.SSR` | `false`（或 `true`） |
| `import.meta.env.BASE_URL` | `string` 字面量 |

## CSS 按需配置位置对照

| 方案 | 配置文件 | 关键字段 | 状态 |
| --- | --- | --- | --- |
| Tailwind v4 | 入口 CSS（如 `main.css`） | `@import "tailwindcss"` + `@source "..."` | 默认开启 tree-shaking |
| Tailwind v3 | `tailwind.config.js` | `content: [...]` | 当前主流稳定 |
| Tailwind v2 | `tailwind.config.js` | `purge: [...]` | 已废弃 |
| PurgeCSS | `purgecss.config.js` 或插件配置 | `content` / `defaultExtractor` | 独立工具 |
| UnoCSS | `uno.config.ts` | 自动扫描 | 默认按需 |

## 注解 API 速查

| 注解 | 适用打包器 | 标记对象 | 行为 |
| --- | --- | --- | --- |
| `/*#__PURE__*/` | Rollup / Webpack / Terser / esbuild（通用） | 单次函数调用 / 构造 / IIFE | 该调用未引用返回值时整段可删 |
| `/*@__NO_SIDE_EFFECTS__*/` | Rollup 专属 | 整个函数 / 箭头函数声明 | 一次注解覆盖所有调用点 |
| `@__PURE__`（无 #） | 旧形式，部分工具兼容 | 同 `#__PURE__` | 推荐用 `#__PURE__` |

**典型用法**

```ts
const result = /*#__PURE__*/ compute();              // IIFE / 工厂调用
class A extends /*#__PURE__*/ mixin(Base) {}          // class extends 表达式

/*@__NO_SIDE_EFFECTS__*/
function makeStyle(opts) { return compute(opts); }    // 整函数声明（Rollup）
```

## 版本与生态状态

| 工具 | 当前版本 | Tree Shaking 状态 |
| --- | --- | --- |
| **Webpack** | 5.108 | `usedExports` / `sideEffects` / `innerGraph` 自 5 起所有 mode 默认开；`mode=production` 全开 |
| **Rollup** | 4 | `treeshake` 选项完备；事实标准的 ESM 库打包器 |
| **Rolldown** | （Rust 重写 Rollup） | Vite 8 起成为唯一打包器；10–30× 更快 |
| **Vite** | 8（2026） | Rolldown 替代 Rollup；`build.rolldownOptions` |
| **esbuild** | 当前 | 内建 tree shaking，极快但选项少 |
| **Tailwind** | v4 | 默认 tree-shaking + CSS-first（`@theme` / `@source`） |
| **Tailwind** | v3 | `content` 数组扫描类名 |
| **PurgeCSS** | 当前 | 跨方案独立工具 |
| **package.json `sideEffects`** | 自 Webpack 4 引入 | Webpack / Rollup / Vite / esbuild 跨工具行业标准 |

## 验证 Tree Shaking 是否生效

**Webpack stats 看 usedExports**

```bash
webpack --json --mode=production > stats.json
```

在 `stats.json` 里搜模块的 `usedExports` 字段：`true` = 该导出被使用、`false` = unused（应被删）。

**Bundle 体积对比**

```bash
# 关闭 sideEffects（基线）
SIDE_EFFECTS=false webpack --mode=production
ls -lh dist/main.js

# 开启 sideEffects
webpack --mode=production
ls -lh dist/main.js
```

**webpack-bundle-analyzer 可视化**

```bash
webpack --mode=production --analyze
```

> dev 模式验证 tree shaking **无效**——开发模式默认 `minimize: false`、`concatenateModules: false`，shaking 标记存在但不删除。必须 production build 后比较。

## 失效场景速查

| 场景 | 为何失效 | 解法 |
| --- | --- | --- |
| CJS 库（lodash / moment） | `require()` 动态 | 改 ESM 等价物（lodash-es / date-fns） |
| barrel + 缺 `sideEffects` | 保守保留整张图 | 标 `sideEffects: false` 或深路径 import |
| `sideEffects: false` + polyfill | 误删 polyfill、运行时崩 | 白名单 `["*.css", "./src/polyfills.js"]` |
| try-catch polyfill 检测 | Rollup `tryCatchDeoptimization: true` | 重写为显式 if 或 `manualPureFunctions` |
| `const isDev = ...` 运行期判断 | 失去静态可分析性 | 直接用 `import.meta.env.DEV` |
| 只标 `usedExports` 不开 `minimize` | 标了不删 | `minimize: true` |
| dev 模式验证 | dev 不删代码 | `production` build |
| 动态拼接 Tailwind 类名 | 扫不到类名 | 完整类名 + safelist |
| Vite 8 仍写 `manualChunks` | 对象移除 / 函数弃用 | 改 `output.codeSplitting` |

## 官方资源

- Webpack Tree Shaking 指南：[https://webpack.js.org/guides/tree-shaking/](https://webpack.js.org/guides/tree-shaking/)
- Webpack optimization 全选项：[https://webpack.js.org/configuration/optimization/](https://webpack.js.org/configuration/optimization/)
- Rollup 配置选项：[https://rollupjs.org/configuration-options/](https://rollupjs.org/configuration-options/)
- Vite 8 发布公告：[https://vite.dev/blog/announcing-vite8](https://vite.dev/blog/announcing-vite8)
- Vite 构建指南：[https://vite.dev/guide/build](https://vite.dev/guide/build)
- Tailwind v4 优化与按需：[https://tailwindcss.com/docs/optimizing-for-production](https://tailwindcss.com/docs/optimizing-for-production)
- Tailwind v4 公告：[https://tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4)
- Rolldown GitHub：[https://github.com/rolldown/rolldown](https://github.com/rolldown/rolldown)
- PurgeCSS：[https://purgecss.com/](https://purgecss.com/)
- MDN Tree Shaking 概念：[https://developer.mozilla.org/docs/Glossary/Tree_shaking](https://developer.mozilla.org/docs/Glossary/Tree_shaking)
