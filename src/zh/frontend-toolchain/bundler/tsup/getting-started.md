---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **tsup 8.5.1**（npm `latest`，2025-11 发布；运行需 Node.js 18+）。⚠️ **2026-06 维护现状**：README 官宣「This project is not actively maintained anymore. Please consider using tsdown instead.」——存量项目继续用没问题（周下载仍约 600 万），**新库建议先看 [tsdown](../tsdown/index)**。

## 速查

- 定位：「**Bundle your TypeScript library with no config, powered by esbuild**」——零配置 TS 库打包器
- 安装：`npm i -D tsup typescript`｜构建：`npx tsup src/index.ts`｜监听：加 `--watch`
- 库发布三件套一条命令：`tsup src/index.ts --format esm,cjs --dts`
- 配置：`tsup.config.ts` + `defineConfig`（亦可 `.js`/`.cjs`/`.json` 或 package.json `tsup` 字段；`--no-config` 禁用）
- 默认值：format **`cjs`**、outDir **`dist/`**、platform **`node`**、target **tsconfig → `node14`**、clean **`false`**
- 依赖：`dependencies` / `peerDependencies` **始终外部化**；devDependencies 被 import 会打入产物
- ⚠️ **无入口推断**：不传入口直接报错（tsdown 会自动找 `src/index.ts`，tsup 不会）
- ⚠️ **不做类型检查**：日常靠 IDE；构建期把关开 `--dts`（跑真 TS 编译器）或另跑 `tsc --noEmit`

## 一、tsup 是什么

官方一句话：「Bundle your TypeScript library with no config」。两条边界先划清：

1. **库打包器，不是应用打包器**：面向发布到 npm 的 TS 库（工具包、SDK、组件库逻辑层）——一条命令产出 esm/cjs 产物与 `.d.ts`。没有 dev server、没有 HMR、不处理 HTML；写应用请用 Vite/Rsbuild。
2. **esbuild 驱动，但不止 esbuild**：JS 转译打包靠 esbuild（快的来源）；声明文件靠**真 TypeScript 编译器 + rollup-plugin-dts**；`--treeshake` 借 **Rollup** 兜底摇树；装饰器元数据场景按需切 **SWC**。tsup 本质是**多引擎指挥家**（全景见[专家篇](./guide-line/expert)）。

> 能打包什么：Node 原生支持的 `.js/.json/.mjs` + TypeScript 的 `.ts/.tsx`；**CSS 是实验性支持**（可叠 PostCSS，需自装 postcss）；图片等资源要用 `--loader` 显式指定（如 `--loader ".jpg=base64"`）。

## 二、安装与第一次构建

```bash
mkdir my-lib && cd my-lib && npm init -y
npm i -D tsup typescript
```

新建 `src/index.ts`：

```ts
/** 对外导出的主函数 */
export function hello(name: string): string {
  return `Hello, ${name}!`;
}
```

构建——**入口必须显式传**：

```bash
npx tsup src/index.ts
# ✓ dist/index.js  （默认输出 dist/，默认格式 cjs）
```

> ⚠️ 只跑 `npx tsup`（不传入口、配置里也没写 `entry`）会直接报错 `No input files, try "tsup <your-file>" instead`——tsup **没有入口推断**，这是从 tsdown 回看时最先撞上的差异。

日常写进 scripts：

```json
{
  "scripts": { "build": "tsup src/index.ts", "dev": "tsup src/index.ts --watch" }
}
```

## 三、库发布三件套：多格式 + 声明文件

```bash
npx tsup src/index.ts --format esm,cjs --dts
```

产物（package.json **无** `type: "module"` 时）：

```text
dist/index.js     # cjs（占用裸 .js）
dist/index.mjs    # esm
dist/index.d.ts   # cjs 对应的声明
dist/index.d.mts  # esm 对应的声明——多格式时每种格式各一份
```

- format 支持 **esm / cjs / iife** 三种（默认 cjs），**不支持 umd**——esbuild 本身就不支持；
- 设了 `"type": "module"` 后扩展名规则翻转：esm → `.js`、cjs → `.cjs`（两套规则见[基础篇](./guide-line/base)）；
- `--dts` 每格式各产一份声明，是为了 Node16/NodeNext 解析下 import/require 两分支类型都准确（机制见[进阶篇](./guide-line/advanced)）。

## 四、配置文件

```ts
// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true, // 默认 false，发布构建建议显式打开
});
```

- 载体五选一：`tsup.config.ts/.js/.cjs/.json` 或 package.json 的 `tsup` 字段；导出名可为 `default`/`tsup`/`module.exports =`；
- **函数式条件配置**是官方处理 dev/prod 差异的方式——入参就是 CLI 标志的解析结果：

```ts
export default defineConfig((options) => ({
  minify: !options.watch, // tsup --watch 时不压缩，正式构建才压缩
}));
```

- `--config ./path` 指定自定义文件，`--no-config` 禁用；大多数配置项可被 CLI 参数覆盖。

## 五、必须记住的默认值

| 选项       | tsup 默认                                    | 对照 tsdown        |
| ---------- | -------------------------------------------- | ------------------ |
| `entry`    | **无推断**，必须显式传                       | `src/index.ts`     |
| `format`   | **`cjs`**                                    | `esm`              |
| `outDir`   | `dist/`                                      | `dist/`            |
| `clean`    | **`false`**（不清空旧产物）                  | `true`             |
| `dts`      | `false`，需显式开                            | `types` 字段自动开 |
| `target`   | tsconfig `compilerOptions.target` → `node14` | 读 `engines.node`  |
| `platform` | `node`                                       | `node`             |

依赖处理：**`dependencies` 与 `peerDependencies` 始终外部化**（库语义：运行时依赖交使用方装）；**devDependencies 没有豁免**——被 import 就会打进产物。

## 六、watch 与 onSuccess：开发工作流

```bash
tsup src/index.ts --watch --onSuccess "node dist/index.js"
```

- watch 默认忽略 `dist`、`node_modules`、`.git`（忽略 dist 是为防产物写入触发重建循环）；`--ignore-watch` 追加忽略且可重复传；
- `onSuccess` 在**每次构建成功后**执行；配置文件里还能写成异步函数，**返回的函数会在下一次重建前作为清理逻辑执行**（如 `server.close()`），见[进阶篇](./guide-line/advanced)。

---

跑通第一次构建后，进入[指南 · 基础](./guide-line/base)：entry 写法、format 与扩展名两套规则、依赖外部化策略与 target/platform/env。
