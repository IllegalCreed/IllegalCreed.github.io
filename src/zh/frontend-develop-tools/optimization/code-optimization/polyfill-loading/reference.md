---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Babel 官方文档（babeljs.io/docs/babel-preset-env）+ core-js 官方说明（zloirock/core-js）+ Vite 官方浏览器兼容指南编写，对照 @babel/preset-env 7.x 与 core-js 3.x 稳定版

## 速查

- **应用配方**：`useBuiltIns: 'usage'` + `corejs: '3.33'`（写实际装的 minor）+ `.browserslistrc` 作为 targets 单一事实源
- **库配方**：`useBuiltIns: false` + `@babel/plugin-transform-runtime` 的 `corejs: 3` + `@babel/runtime-corejs3`
- **`useBuiltIns` 三模式**：`'usage'`（每文件按使用，最精细）/ `'entry'`（替换入口 import）/ `false`（不注入）
- **`corejs` 必填**：写 minor 版本（如 `'3.33'`），写 `'3'` 或漏写按默认 core-js@2 处理并告警
- **`core-js@3` vs `core-js@2`**：2 自 2018 进入 feature freeze；3 新增 URL / queueMicrotask / Array.flat / flatMap / Object.fromEntries；模块前缀 3 用 `es.` / `esnext.`，2 用 `es6.` / `es7.`
- **`core-js` vs `core-js-pure`**：前者修改全局（polyfill，应用）；后者不污染（ponyfill，库）
- **`@babel/polyfill` 弃用**（Babel 7.4 起）：替代为 `import "core-js/stable"` + `import "regenerator-runtime/runtime"`
- **`@vitejs/plugin-legacy`**：modern + legacy 双产物，浏览器自选
- **`polyfill.io` 不再用**（2024-02 供应链事件）：自托管 core-js 或 cdn.cloudflare.com / polyfill-fastly.io 镜像
- **`debug: true`**：核对实际注入清单与触发它的 target
- 完整说明见 [入门](./getting-started.md) / [核心配置与方案](./guide-line.md)

## useBuiltIns 三模式完整对比

| 维度 | `'usage'` | `'entry'` | `false` |
| --- | --- | --- | --- |
| 注入位置 | 每个文件顶部 | 入口处的 `import "core-js/stable"` 整行替换 | 不注入 |
| 粒度 | 单文件单 API（最精细） | 整项目按 targets 拆解（入口级） | 无 |
| 触发条件 | Babel 静态扫描到文件中使用了某 API | 入口显式 `import "core-js/stable"` / `import "core-js"` | 不触发 |
| 是否需要 `corejs` | **必填** | **必填** | 不需要 |
| 是否需要入口 import | 不需要 | **需要** | 不需要 |
| 是否依赖静态分析 | 是（有边界） | 否（按 targets 一刀切） | 不适用 |
| 体积 | 通常最小（15–30 KB gzipped） | 中等（30–50 KB gzipped） | 取决于手动控制 |
| 适用 | **应用项目默认** | 整项目一次性补 | **库默认** / 自己手动控制 |
| 第三方依赖 polyfill 需求 | 可能漏注入（需 `include` 兜底） | 自动覆盖（按 targets） | 不适用 |
| 典型陷阱 | 静态分析遗漏 | 入口只能一处；漏配 `corejs` 则按 core-js@2 处理 | 库构建若误用 `usage` 会污染消费者 |

## corejs 选项配置清单

```json
// 字符串形式（最常见）
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": "3.33"
      }
    ]
  ]
}

// 对象形式（启用提案）
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": { "version": "3.33", "proposals": true }
      }
    ]
  ]
}
```

| 取值 | 含义 | 适用 |
| --- | --- | --- |
| `'3'` | 仅 major（**陷阱**：Babel 不知道该版本已可用的 polyfill，可能漏注入新 feature） | 不推荐 |
| `'3.33'` | 精确到 minor（推荐） | 应用默认 |
| `{ version: '3.33', proposals: false }` | 显式对象 | 需要后续动态开启 proposals 时 |
| `{ version: '3.33', proposals: true }` | 启用 core-js 支持的全部提案 polyfill（含未广泛落地，体积大） | 确实需要未稳定提案时 |
| 不写 / `undefined` | 按默认 core-js@2 处理并告警 | 永远不要这样 |
| `'2'` | 老项目兼容遗留 core-js@2 | 仅维护老项目时 |

## core-js 入口清单

```ts
// 全量（不要直接用，除非配 useBuiltIns:'entry' 让 Babel 拆解）
import "core-js";

// 稳定 ES + Web（最常用，配 useBuiltIns:'entry'）
import "core-js/stable";

// 仅稳定 ES（不含 Web 平台 polyfill 如 URL/fetch）
import "core-js/es";

// 按命名空间（更精细）
import "core-js/es/array";
import "core-js/es/promise";
import "core-js/es/object";

// 单个 feature
import "core-js/modules/es.array.includes";

// pure（不污染全局，库用）
import includes from "core-js-pure/features/array/includes";
import Set from "core-js-pure/features/set";
```

## core-js-pure vs core-js

| 维度 | core-js | core-js-pure |
| --- | --- | --- |
| 是否修改全局 / 原型 | 是（polyfill） | 否（ponyfill） |
| 使用方式 | `arr.includes(x)`（原型补上后直接调） | `includes(arr, x)`（显式传 receiver） |
| 是否需要 import | `import "core-js/modules/es.array.includes"` 一次 | 每个使用点都要 import |
| 适用 | 应用（消费者隔离环境） | 库（不污染消费者全局） |
| 典型用法 | 配 `useBuiltIns: 'usage'` / `'entry'` | 配 `@babel/plugin-transform-runtime` + `@babel/runtime-corejs3` |

## core-js 2 vs 3 对比

| 维度 | core-js@2 | core-js@3 |
| --- | --- | --- |
| 状态 | feature freeze（2018 起） | 唯一活跃主版本 |
| 主要新增 API | — | `URL` / `URLSearchParams` / `queueMicrotask` / `Array.flat` / `flatMap` / `Object.fromEntries` / `Promise.allSettled` / `globalThis` |
| 模块前缀 | `es6.` / `es7.`（如 `es6.promise`） | `es.` / `esnext.`（如 `es.promise`、`esnext.array.group`） |
| 入口点数量 | ~200 | ~500+ |
| 与 Babel 集成 | `@babel/polyfill`（已弃用） | `useBuiltIns` + `corejs: 3` 或 `@babel/runtime-corejs3` |
| 提案支持 | 不再更新 | 通过 `proposals: true` 与 `core-js-pure/features` |
| 数据源 | compat-table | core-js-compat（更准确） |
| 维护状态 | 仅安全修复 | 持续新增 |

## browserslist 速查

**配置文件优先级**：`.browserslistrc` > `package.json.browserslist` > 默认值（`> 0.5%, last 2 versions, Firefox ESR, not dead`）。

**最常用查询**：

```text
# 默认值（官方推荐）
defaults
# 等价于
> 0.5%, last 2 versions, Firefox ESR, not dead

# 全球使用率 > 1%
> 1%

# 最近 2 个版本
last 2 versions

# 最近 2 个 Chrome 版本
last 2 chrome versions

# 排除 IE 11
not ie 11

# 排除已停止支持的（最近 24 个月无官方支持或更新）
not dead

# Firefox ESR（扩展支持版）
Firefox ESR

# iOS Safari 12+
ios >= 12

# Node 18+
node >= 18
```

**常用组合**：

```text
# 现代 Web 应用
defaults and fully supports es6-module
maintained node versions

# 兼容较旧浏览器（含 IE 11）
> 0.5%
last 2 versions
ie >= 11
not dead

# 仅现代浏览器（小体积）
last 2 versions
not dead
not ie 11
```

**preset-env 覆盖选项**：

| 选项 | 作用 |
| --- | --- |
| `targets` | 直接指定 targets 对象（如 `{ chrome: "80" }`），覆盖 browserslist |
| `ignoreBrowserslistConfig` | `true` 时忽略外部 browserslist 配置 |
| `configPath` | 指定 browserslist 配置文件路径 |
| `browserslistEnv` | 指定 browserslist 的 env 名（多环境配置） |

**调试**：

```bash
# 列出当前 browserslist 解析出的浏览器清单
npx browserslist

# 指定查询
npx browserslist "> 1%, last 2 versions"

# 在浏览器使用率网站查询
# https://browserl.ist/
```

## @vitejs/plugin-legacy 配置

```ts
// vite.config.ts
import legacy from "@vitejs/plugin-legacy";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    legacy({
      // legacy 浏览器目标（默认 ['defaults', 'not IE 11']）
      targets: ["defaults", "not ie 11"],

      // modern 包目标（默认现代浏览器）
      // modernTargets: [],

      // 显式指定 modern 包 polyfill 清单（默认按 usage 自动）
      // modernPolyfills: ["es.array.includes", "es.promise"],

      // 显式指定 legacy 包 polyfill 清单（默认按 targets 自动）
      // polyfills: [],

      // 额外 legacy polyfill（不被 core-js 覆盖的，如 whatwg-fetch）
      // additionalLegacyPolyfills: ["whatwg-fetch"],

      // 是否产出 legacy chunk（默认 true）
      renderLegacyChunks: true,

      // modern chunk 的 polyfill 注入方式
      // modernPolyfill: true,
    }),
  ],
});
```

**机制**：

- modern chunk：基于 modern targets，用 esbuild 语法降级，polyfill 极少
- legacy chunk：基于 legacy targets，走 Babel preset-env + core-js 注入按 targets 裁剪的 polyfill
- HTML 同时注入 `<script type="module">`（modern）与 `<script nomodule>`（legacy），浏览器自选
- Safari 10.1 / iOS Safari 10.3 之前的 module/nomodule bug 已内置 Safarinomodule fix

## @babel/plugin-transform-runtime 配置

```json
{
  "presets": [["@babel/preset-env", { "useBuiltIns": false }]],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3,
        "version": "^7.0.0"
      }
    ]
  ]
}
```

```bash
# 需要安装的依赖
npm i -D @babel/plugin-transform-runtime @babel/runtime-corejs3
npm i @babel/runtime-corejs3   # 运行时依赖
```

**作用**

- 把 polyfill 从「修改全局」变成「从 `@babel/runtime-corejs3` 引入」
- 底层走 `core-js-pure`，不污染消费者全局
- 支持实例方法：`arr.includes(x)` → `_includesInstanceProperty(arr).call(arr, x)`
- 也注入 helper函数避免重复（旧 `@babel/runtime` 的功能）

## shippedProposals vs proposals

| 选项 | 含义 | 体积 | 风险 |
| --- | --- | --- | --- |
| `shippedProposals: true`（preset-env 顶层） | 引入已 shipped 到浏览器的 Stage-3 提案 polyfill | 中等 | 低（已落地） |
| `corejs: { version, proposals: true }` | 引入 core-js 支持的全部提案（含未广泛落地） | 大 | 高（spec 变更） |
| 都不开 | 只引入稳定 ES 标准 polyfill | 最小 | 无 |

**优先级**：需要已落地提案时优先用 `shippedProposals: true`，仅在确实需要未广泛落地提案时才用 `proposals: true`。

## include / exclude 速查

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": "3.33",
        "include": ["es.math.sign", "es.array.includes", "es.regexp.flags"],
        "exclude": ["es.array.flat", "es.string.pad-start"]
      }
    ]
  ]
}
```

| 用途 | include | exclude |
| --- | --- | --- |
| 静态分析遗漏（第三方依赖隐式用） | ✓ 强制包含 | — |
| 动态属性访问 / eval | ✓ | — |
| 原生实现有 bug 需强制覆盖 | ✓ | — |
| targets 下原生已稳定不需要 | — | ✓ 强制排除 |
| 某 polyfill 与环境冲突 | — | ✓ |
| 格式 | 字符串（`es.math.sign`）或 RegExp（`/^es.math\./`） | 同 |

## 版本状态（2026-07）

| 项 | 状态 |
| --- | --- |
| @babel/preset-env | 7.x 主流稳定，Babel 8 处于 beta |
| Babel 8 关键变化 | 移除 `bugfixes` 选项（默认按「最近非破损现代语法」），`useBuiltIns` / `corejs` / `shippedProposals` 语义不变 |
| core-js | 3.x 唯一活跃主版本；2 进入 feature freeze（2018） |
| @babel/polyfill | 自 Babel 7.4（2019）弃用 |
| @babel/runtime-corejs3 | 库项目注入非污染 polyfill 的标准包 |
| polyfill.io | 2024-02 被 Funnull 收购后供应链攻击，**不再引用该域名** |
| 替代镜像 | cdnjs.cloudflare.com/polyfill、polyfill-fastly.io |
| 长期方案 | 自托管 core-js（可用 `core-js-builder` 按 targets 构建定制 bundle） |

## 常见告警与含义

| 告警 | 含义 | 处理 |
| --- | --- | --- |
| `@babel/preset-env: corejs is not specified` | 设置了 `useBuiltIns` 但没配 `corejs` | 显式写 `corejs: '3.x'` |
| `WARN @babel/preset-env: assuming you are using core-js 2` | `corejs` 写 `'2'` 或漏写，按默认处理 | 升到 `'3.x'` |
| `core-js@2 and core-js@3 are both installed` | 同时装了 2 和 3 | 卸载 core-js@2，统一升到 3 |
| `@babel/polyfill is deprecated` | 仍在用 `@babel/polyfill` | 改用 `import "core-js/stable"` + `import "regenerator-runtime/runtime"` |
| `[BABEL] Note: The code generator has deoptimised the styling of ...` | 单文件过大，Babel 跳过优化 | 拆分文件，不影响功能 |

## 官方资源

- Babel preset-env 文档：[https://babeljs.io/docs/babel-preset-env](https://babeljs.io/docs/babel-preset-env)
- core-js 3 与 Babel 集成说明：[https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md](https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md)
- core-js GitHub：[https://github.com/zloirock/core-js](https://github.com/zloirock/core-js)
- Babel GitHub：[https://github.com/babel/babel](https://github.com/babel/babel)
- @babel/plugin-transform-runtime：[https://babeljs.io/docs/babel-plugin-transform-runtime](https://babeljs.io/docs/babel-plugin-transform-runtime)
- Vite 浏览器兼容：[https://vite.dev/guide/build.html#browser-compatibility](https://vite.dev/guide/build.html#browser-compatibility)
- @vitejs/plugin-legacy：[https://github.com/vitejs/vite/tree/main/packages/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy)
- Vue CLI @vue/babel-preset-app：[https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/babel-preset-app/README.md](https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/babel-preset-app/README.md)
- browserslist：[https://github.com/browserslist/browserslist](https://github.com/browserslist/browserslist)
- Cloudflare polyfill.io 替代公告：[https://blog.cloudflare.com/automatically-replacing-polyfill-io-links-with-cloudflares-mirror-for-a-safer-internet/](https://blog.cloudflare.com/automatically-replacing-polyfill-io-links-with-cloudflares-mirror-for-a-safer-internet/)
- polyfill-fastly 镜像：[https://polyfill-fastly.io](https://polyfill-fastly.io)
- core-js-builder：[https://github.com/zloirock/core-js/tree/master/packages/core-js-builder](https://github.com/zloirock/core-js/tree/master/packages/core-js-builder)
