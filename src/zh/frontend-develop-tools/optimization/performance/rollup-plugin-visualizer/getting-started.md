---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 btd/rollup-plugin-visualizer 官方 README + plugin/index.ts 源码（npm v7.x）编写

## 速查

- 安装：`pnpm add -D rollup-plugin-visualizer`（要求 **Node.js >= 22**）
- 引入：`import { visualizer } from "rollup-plugin-visualizer"`（具名导出，也支持 default）
- 最简：`visualizer()` 即可，默认输出 `stats.html`（treemap 模板）
- 模板 8 种：`treemap`(默认) / `sunburst` / `treemap-3d` / `network` / `flamegraph` / `raw-data`(JSON) / `list`(YAML) / `markdown`
- Vite 集成：放在 `plugins` 数组**最后**，类型断言 `as PluginOption`
- 路径：默认 `process.cwd()/stats.html`，用 `filename` 改路径，用 `projectRoot` 裁剪绝对路径
- CI/PR：`template: 'list'` 产 YAML 可 diff，或 `template: 'raw-data'` 产 JSON
- 看压缩体积：`gzipSize: true` / `brotliSize: true`（`sourcemap: true` 时强制关闭）
- 已废弃：`json: true` → 改 `template: 'raw-data'`
- 反模式：插件不放在最后、`emitFile:true` 时 filename 带路径、CI 中 `open:true`

## 它解决什么问题

打包工具（Rollup/Vite）默认只告诉你「build complete，dist 大小 N KB」，但**为什么这么大 / 哪个依赖吃掉了体积 / 是否重复打包**完全黑盒。rollup-plugin-visualizer 通过 `generateBundle` 钩子拿到最终 bundle 的每个 chunk 模块元数据（路径、renderedLength、gzipLength），按体积渲染成交互图，让以下场景变得可视化：

- 「lodash 全量引入了吗？」→ treemap 里一眼看到 lodash 出现在多个 chunk
- 「moment 占了多少？」→ 矩形面积就是它的体积占比
- 「这个 1MB 的依赖为什么被打进包？」→ network 图追引用链
- 「PR 让 bundle 大了 30KB」→ `template: 'list'` 产 YAML 提交仓库，PR diff 直接显示

## 安装

```bash
# Node.js >= 22 是 v7 的硬性要求（v5 支持 14、v6 支持 18）
pnpm add -D rollup-plugin-visualizer
# 或 npm / yarn
npm i -D rollup-plugin-visualizer
yarn add -D rollup-plugin-visualizer
```

> 老项目升级前先升 Node。Node 14 项目停在 v5、Node 18 项目停在 v6，升 Node 22 后再装 v7。

## Rollup 集成

```js
// rollup.config.js
import { visualizer } from "rollup-plugin-visualizer";

export default {
  input: "src/main.js",
  output: { dir: "dist", format: "es" },
  plugins: [
    // ...其他插件...
    visualizer(), // 必须放在 plugins 数组最后
  ],
};
```

**为什么必须最后**：visualizer 需要看到**最终 bundle 产物**，前置会被后续插件（如 Terser）变换导致数据失真。README 明确写着 `Keep it last.`

## Vite 集成

Vite 底层是 Rollup，可直接调用 Rollup 插件：

```ts
// vite.config.ts
import { defineConfig, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    // ...其他 Vite 插件...
    visualizer({
      template: "treemap", // 默认
      open: true, // 构建后自动打开浏览器（CI 必须关）
      gzipSize: true, // 显示 gzip 压缩体积
      brotliSize: true, // 显示 Brotli 压缩体积
    }) as PluginOption, // Vite PluginOption 与 Rollup Plugin 不完全等价，断言避免类型冲突
  ],
});
```

> `as PluginOption` 类型断言是 Vite + TS 项目的标配写法。

## 第一次构建

```bash
pnpm build
```

构建结束会在项目根目录生成 `stats.html`，自动打开浏览器（`open:true` 时）即可看到 treemap：每个矩形面积代表模块体积，**蓝色 = 项目源码、绿色 = 依赖（按路径是否以 `node_modules` 开头判定）**。

- 鼠标悬停：显示模块路径、rendered/gzip/brotli 体积
- 点击矩形：下钻进入子模块
- 顶部面包屑：返回上层

## SvelteKit / 多次构建场景

SvelteKit 一次构建会跑 2~3 次 Vite，默认配置会在 `.svelte-kit/output` 产生多份文件且路径不可控。这种情况必须用 `emitFile: true` + 纯文件名 `filename`：

```ts
visualizer({
  emitFile: true, // 用 Rollup emitFile API 输出
  filename: "stats.html", // 必须是纯文件名，不能含路径
}) as PluginOption,
```

> `emitFile:true` 时 `filename` 含 `./` / `../` / 绝对路径会直接抛 `ERR_FILENAME_EMIT`。`open` 在 `emitFile:true` 时会被忽略。

## 想长期跟踪体积变化

HTML 报告不适合 git 跟踪（每次都变），换成 YAML 提交到仓库，PR diff 即体积回归：

```ts
visualizer({
  template: "list", // 输出 stats.yml
  filename: "bundle-stats.yml",
}) as PluginOption,
```

CI/CD 程序化分析则用 `template: 'raw-data'`（输出 `stats.json`），再用插件自带的 CLI 合并多份 JSON：

```bash
# 多 entry / 多配置场景：分别产 raw-data JSON，再用 CLI 合并
npx rollup-plugin-visualizer --template treemap stats-server.json stats-client.json
```

## 下一步

- [模板与选项](./guide-line.md)：8 种模板细节、`filename`/`template`/`open`/`gzipSize`/`brotliSize`/`excludeChunks`/`emitFile` 全选项、`json` 废弃、与 Webpack Bundle Analyzer 对比、反模式
- [参考](./reference.md)：选项/API 表、模板速查、版本约束、官方资源
