---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Next.js 16.x**（Turbopack 已是默认打包器）。涉及版本里程碑均显式标注。

## 速查

- Turbopack 随 **Next.js** 分发，没有独立 npm 包；**Next 16 起是默认打包器**
- 启用：`next dev` / `next build` / `next start` **无需任何 flag**（默认即 Turbopack）
- 强制开启：`next dev --turbopack`（`--turbo` 是别名）；**退回 webpack**：`next dev --webpack`
- 底层：JS/TS → **SWC**，CSS → **Lightning CSS**；**不做类型检查**（需 `tsc`）
- 配置键：`next.config.js` 的顶层 **`turbopack`**（不是 `webpack`）
- 判断当前打包器：启动日志 `▲ Next.js 16 (Turbopack)`
- ⚠️ 不支持 **webpack plugins**（只支持 loaders）；`webpack()` 配置在 Turbopack 下不生效

## 一、默认即用

Next.js 16 起 Turbopack 是默认打包器，标准脚本无需任何改动：

```jsonc
// package.json
{
  "scripts": {
    "dev": "next dev",     // 默认走 Turbopack
    "build": "next build", // 默认走 Turbopack
    "start": "next start"
  }
}
```

**稳定性演进**（重要里程碑，别混淆）：

| 版本 | 里程碑 |
|---|---|
| v13.0 | 以 alpha 引入 Turbopack |
| v15.0 | **`dev` 进入 stable** |
| v15.3 | `build` experimental |
| v15.5 | `build` beta |
| **v16.0** | **成为默认打包器，dev + build 均 stable** |

> ⚠️ 「dev stable（15.0）」与「build 默认（16.0）」是**两个不同里程碑**——v15.x 的 `build` 仍是 experimental/beta，别当成已稳定。

## 二、CLI 标志

```bash
next dev --turbopack    # 强制启用（默认已开），--turbo 是别名
next dev --webpack      # 开发时退回 webpack
next build --webpack    # 用 webpack 构建
```

- `next` 不带命令 = `next dev`。
- **npm run 透传需加 `--`**：`npm run dev -- --webpack`（pnpm / yarn / bun 不需要）。
- Next 16 中 `--turbopack` 是「force enable」（默认已开），真正改变行为的是 **`--webpack`（退回）**。
- dev 构建输出到 **`.next/dev`**（不是 `.next`），可与 `next build` 同时跑互不冲突。
- 性能追踪：`NEXT_TURBOPACK_TRACING=1 next dev` 生成 `.next/dev/trace-turbopack`；`next experimental-analyze` 分析 bundle 体积。

> ⚠️ **平台限制**：FreeBSD / OpenBSD 等无 native binding 的平台回退 WASM，**不支持 Turbopack**，必须显式 `--webpack`。

## 三、零配置支持清单

无需任何配置即可使用：

- **语言**：JavaScript / TypeScript（SWC，不做类型检查）、ESM 静态 + 动态 import、CommonJS
- **React**：JSX / TSX、Fast Refresh、React Server Components（RSC）
- **CSS**：Global CSS、CSS Modules（`.module.css`）、CSS Nesting、`@import`、**PostCSS**（自动读 `postcss.config.*`，适配 Tailwind）、**Sass / SCSS**（开箱即用）
- **资源**：图片 / 字体 import（返回供 `<Image />` 用的对象）、JSON
- **路径**：读 `tsconfig.json` 的 `paths` 和 `baseUrl`

## 四、配置：`turbopack` 顶层键

自定义配置写在 `next.config.js` 的 **`turbopack`** 键下（**不是** `webpack`）：

```js
// next.config.js
module.exports = {
  turbopack: {
    // 给 .svg 配 loader（webpack loader 规则，file glob → loaders）
    rules: {
      "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" },
    },
    // 别名（支持 browser 条件；~* → * 兼容 Sass 波浪号）
    resolveAlias: { "@": "./src" },
    // 解析扩展名——注意是「覆盖」，必须含默认项
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
};
```

::: warning 三个配置陷阱
- **`resolveExtensions` 是覆盖（overwrite）不是合并**：漏掉默认项（`.tsx`/`.ts`/`.js`…）会导致解析失败。
- **`root`**：绝对路径，**root 之外的文件不被解析**；`pnpm/npm link` 的项目外依赖默认解析不到，需把 `root` 设为共同父目录（默认靠 lockfile 自动检测）。
- **键名历史**：v13.0~15.2 叫 `experimental.turbo`，v15.3+ 改名 `turbopack`，**Next 16 移除** `experimental.turbo`。迁移用 codemod：`npx @next/codemod@latest next-experimental-turbo-to-turbopack .`
:::

`rules` 进阶：Next 16.0 起支持 `condition`（`{ not: 'foreign' }` 排除 node_modules 提性能）、16.2 起支持 `type`（`'asset'` 处理静态资源）和行内 import attributes（`with { turbopackLoader: 'raw-loader' }`，必须用 `with` 不能用 `assert`）。

## 五、从 webpack 迁移要点

1. **把 `webpack()` 改写成 `turbopack` 配置**（`rules` / `resolveAlias` / `resolveExtensions`）——`webpack()` 在 Turbopack 下完全不生效。
2. **webpack plugins 不支持**（只支持 loaders）——依赖插件的工具需找替代或继续用 webpack。
3. **Sass `~` 波浪号失效**：`@import '~bootstrap/...'` 改成 `@import 'bootstrap/...'`，或配 `resolveAlias: { '~*': '*' }`。
4. **CSS Module 排序**：Turbopack 按 JS import 顺序排序，可能导致迁移后渲染微变（build 不报错，难排查），用 `@import` 强制顺序。
5. **必须留在 webpack 的场景**：`sassOptions.functions`、Yarn PnP、`urlImports`、`esmExternals`、WASM 平台、依赖 webpack 插件的工具。

> ⚠️ Next 16 中有**自定义 webpack 配置**的项目会构建失败（被 block），必须改造迁移或加 `--webpack` 退回。
