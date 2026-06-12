---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **unbuild 3.6.1**。两种构建模式（rollup vs mkdist）的对比与实战、stub mode 的原理（jiti / mlly / symlink）与开发工作流、declaration 三种取值的选择、hooks 体系。

## 一、rollup 模式 vs mkdist 模式

| 维度     | rollup（默认）                     | mkdist                                         |
| -------- | ---------------------------------- | ----------------------------------------------- |
| 产物形态 | bundle：模块图合并 + tree-shaking  | bundleless：逐文件转译（file-to-file）          |
| 目录结构 | 入口对应单产物                     | **保留源码目录结构**                            |
| 转译     | esbuild 插件                       | esbuild（最小化转译）                           |
| 额外能力 | dts bundle、依赖内联控制           | 资源复制、**Vue SFC**、内置 postcss、逐文件 d.ts |
| 触发方式 | string 入口                        | 目录型入口（`/` 结尾）或显式 `builder: 'mkdist'` |
| 典型场景 | 工具库、SDK                        | **组件库**、希望按文件路径精确引入的包          |

mkdist 官方点名 bundle 的四个代价：丢失原始文件结构、转译丢失现代语法、CSS 被抽成全局、依赖总从 bundle 引入。组件库要的恰恰是「`dist/components/Button.vue.mjs` 可以单独 import」，所以 bundleless。

### 实战：核心入口 bundle + 组件目录 bundleless

```ts
export default defineBuildConfig({
  declaration: true,
  entries: [
    "./src/index", // rollup：核心入口打成 bundle
    { builder: "mkdist", input: "./src/components/", outDir: "./dist/components" },
  ],
  rollup: { emitCJS: true },
});
```

mkdist 入口的对象形态还支持 `format`（esm/cjs）、`ext`（产物后缀）等选项；`.vue` 文件保留模板与样式、只转译 `<script lang="ts">`，并生成对应声明。

## 二、stub mode：原理讲透

### 1. 它解决什么

monorepo 里包 A 被包 B link 引用，传统两难：每改一行 A 都要重建一次，或者常驻一排 watch 进程。`unbuild --stub` 给出第三条路：**桩化一次，之后改 src 零动作即时生效**（README 称之为 *passive watcher*）。

### 2. rollup 入口的桩：jiti 加载器

stub 后 `dist/index.mjs` 里没有构建产物，而是一段加载器：

```js
import { createJiti } from "/…/node_modules/jiti/lib/jiti.mjs";
const jiti = createJiti(import.meta.url, { interopDefault: true /* … */ });
const _module = await jiti.import("/…/src/index.ts"); // 运行时现场转译源码
export const log = _module.log; // 具名导出逐个转发
export default _module?.default ?? _module;
```

两个关键机制：

- **执行**靠 jiti：import 这个桩时，jiti 即时转译并执行 **src 源文件**——所以源码任何改动即时生效，dist 里根本没有「产物」；
- **具名导出**靠 mlly：ESM 具名导出必须静态声明，无法运行时伪造。stub 用 mlly 的 `resolveModuleExportNames` 静态分析源码的全部导出名，逐个生成 `export const x = _module.x`（分析失败则警告并退化为空具名导出）。

推论：**新增/删除导出后要重新跑一次 `--stub`**——导出列表是 stub 时静态「烤」进桩文件的（这也是 tsdown 拒绝 stub 方案时点名的缺点之一）。

### 3. mkdist 入口的桩：symlink

目录型入口不逐文件写加载器：**删除输出目录，直接创建指向源目录的 symlink**——dist 路径「变成」src 路径，一步到位。

### 4. 类型不丢：声明桩

每个 rollup 入口同时生成声明桩：内容为 `export * from '<源文件路径>'`（有 default 再补一行转发），固定写出 `.d.cts` 与 `.d.mts`，declaration 为 compatible/true 时再补 `.d.ts`。TS 顺着 re-export 直接解析到 **src 源码本身**的类型——IDE 类型与实现永远同步，全程没有 tsc 参与。

### 5. 开发工作流

```jsonc
{ "scripts": { "dev": "unbuild --stub", "build": "unbuild", "prepack": "unbuild" } }
```

- stub 行为可经 `stubOptions.jiti` 透传 jiti 选项；
- `--watch`（主动重建）官方标注 **experimental and incomplete**，且 **mkdist builder 不支持 watch**；`--stub` 与 `--watch` 同传时 watch 优先。UnJS 系日常开发就是 stub 一把梭；
- 再强调一次：stub 产物依赖 jiti 与本机绝对路径，**绝不可发布**——`prepack: unbuild` 是最后防线。

## 三、declaration 三种取值怎么选

| 取值                    | 产物                          | 适用                                                    |
| ----------------------- | ----------------------------- | -------------------------------------------------------- |
| `'compatible'`（≡ `true`） | `.d.ts` + `.d.mts` + `.d.cts` | 默认推荐：老式 node 解析与 Node16 双轨通吃            |
| `'node16'`              | 仅 `.d.mts` + `.d.cts`        | 消费方都在 `moduleResolution: node16/nodenext` 的现代项目 |
| 不写（`undefined`）     | 自动探测                      | package.json 有 `types` → compatible，否则不生成         |

配套 exports 条件（compatible 下的完整形态）：

```jsonc
{
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "types": "./dist/index.d.ts" // 兜底：老式 moduleResolution 读这里
}
```

声明由 rollup-plugin-dts 打包（mkdist 模式则逐文件生成），**不调用项目的 tsc 命令**——所以 unbuild 不做类型检查，CI 里另配一条 `tsc --noEmit` 把关。

## 四、hooks 体系

unbuild 基于 **unjs/hookable**（tsdown 的 hooks 明言受它启发），顶层生命周期三件：

| 钩子            | 时机                               | 典型用途                                     |
| --------------- | ---------------------------------- | -------------------------------------------- |
| `build:prepare` | 上下文就绪、entries 归一化之前     | 动态改配置（autoPreset 的推断就挂在这里）    |
| `build:before`  | 所有 builder 开始之前              | 清理、生成版本文件                           |
| `build:done`    | 全部 builder 完成后                | 往 dist 追加文件、产物校验、通知             |

```ts
export default defineBuildConfig({
  hooks: {
    "build:done"(ctx) {
      // ctx.options / ctx.buildEntries / ctx.warnings 都在这里
    },
    "rollup:options"(ctx, options) {
      // 最后时刻修改即将传给 Rollup 的配置（如塞一个插件）
    },
  },
});
```

更细粒度的钩子按 builder 分族：`rollup:options/build/dts:options/dts:build/done`、`mkdist:entries/entry:options/entry:build/done`、`copy:entries/done`、`untyped:entries/…/done`。

值得品的设计：**entries 自动推断本身就是一个内置 preset（autoPreset）+ 一个 `build:prepare` hook**——unbuild 连自家核心行为都走公开扩展机制；`preset` 字段（可复用配置）+ hooks 足以支撑团队级深度定制。

---

进入[指南 · 专家](./expert)：Nuxt/Nitro 生态角色、与 tsup/tsdown 选型、monorepo 实践与常见坑清单。
