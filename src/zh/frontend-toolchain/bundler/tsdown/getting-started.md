---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **tsdown 0.22.x**（npm `latest`，2026-06）。**未到 1.0**——0.x 阶段 minor 升级也可能含破坏性变更，锁版本、升级前读 [Releases](https://github.com/rolldown/tsdown/releases)。运行 tsdown 需 **Node.js 22.18.0+**（产物可面向更低版本）。

## 速查

- 定位：**Rolldown 官方库打包器**，「the spiritual successor to tsup, powered by Rolldown instead of esbuild」
- 安装：`npm i -D tsdown`｜构建：`npx tsdown`｜监听：`tsdown -w`
- 配置：`tsdown.config.ts` + `defineConfig`（也可写 package.json `tsdown` 字段；`--no-config` 禁用）
- 默认值：entry **`src/index.ts`**（存在时）、format **`esm`**、outDir **`dist/`**、platform **`node`**、**clean 开**、**treeshake 开**
- dts：package.json 有 `types`/`typings` 字段时**自动开启**；显式 `--dts` / `dts: true`
- 迁移：`npx tsdown-migrate`（支持 glob 与 `--dry-run`）
- ⚠️ 与 tsup 默认值不同：format `cjs`→**`esm`**、clean `false`→**`true`**
- ⚠️ esbuild 插件不可用 → 换 Rolldown/unplugin 插件（`unplugin-x/esbuild` → `unplugin-x/rolldown`）

## 一、tsdown 是什么

官方定位：「**The Elegant Bundler for Libraries**」。两层关系要分清：

1. **与 Rolldown**：Rolldown 是 Rust 实现的**通用打包器**；tsdown 是其**官方项目**，在引擎之上叠加**库场景的完整开箱方案**——合理默认值、自动 `.d.ts`、`exports` 生成、发布校验。官方还明确它将作为 **Rolldown-Vite Library Mode 的基础**。
2. **与 tsup**：官方 FAQ 原话——tsdown 是「the spiritual successor to tsup」，引擎从 esbuild 换成 Rolldown，**兼容 tsup 主要选项**，迁移近零成本；hooks 体系受 **unbuild** 启发。

> 一句话：写**库**（npm 包、组件库、SDK），默认就该考虑 tsdown；写**应用**，用 Vite/Rolldown 本体。

## 二、安装与第一次构建

```bash
mkdir my-lib && cd my-lib && npm init -y
npm i -D tsdown typescript
```

新建 `src/index.ts`（约定默认入口）：

```ts
/** 对外导出的主函数 */
export function hello(name: string): string {
  return `Hello, ${name}!`;
}
```

直接构建——**零配置**：

```bash
npx tsdown
# ✓ dist/index.mjs  （默认 ESM、默认 dist/、Node 平台固定 .mjs 扩展名）
```

日常用法写进 scripts：

```json
{
  "scripts": { "build": "tsdown", "dev": "tsdown --watch" }
}
```

## 三、配置文件

复杂项目用 `tsdown.config.ts`（支持 `.ts/.mts/.cts/.js/.mjs/.cjs/.json`，亦可写在 package.json 的 `tsdown` 字段）：

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"], // 双格式：产出 index.mjs + index.cjs
  dts: true, // 生成并打包 .d.ts
});
```

- `defineConfig` 提供完整类型提示；返回**数组**可一次定义多份构建。
- CLI：`--config ./path` 指定路径，`--no-config` 完全禁用。
- 实验性 `--from-vite`：复用 Vite 配置的 `resolve`/`plugins` 等部分选项。

## 四、必须记住的默认值

tsdown 的「优雅」一半来自默认值，**与 tsup 的差异**尤其要背：

| 选项        | tsdown 默认                                | tsup 默认  |
| ----------- | ------------------------------------------ | ---------- |
| `format`    | **`esm`**                                  | `cjs`      |
| `clean`     | **`true`**（构建前清空 outDir）            | `false`    |
| `dts`       | package.json 有 `types`/`typings` 时**自动开** | `false`    |
| `target`    | **自动读 `engines.node`**                  | 无         |
| `entry`     | `src/index.ts`（存在时）                   | 需指定     |
| `platform`  | `node`（CJS 格式下恒为 node）              | `node`     |
| `treeshake` | 开（`--no-treeshake` 关）                  | 需显式开启 |

依赖处理默认策略（库发布友好）：**dependencies / peerDependencies / optionalDependencies 一律外部化**；devDependencies 与幻影依赖**被 import 才打入产物**。

## 五、dts：第一次接触

```bash
npx tsdown --dts
# ✓ dist/index.mjs + dist/index.d.mts
```

两条生成路径（详见[进阶篇](./guide-line/advanced)）：

- tsconfig 开 **`isolatedDeclarations`** → 用 **oxc-transform** 逐文件产声明，官方称「extremely fast」；
- 未开启 → 回退 **TypeScript 编译器**，可靠但相对慢。

> 实际项目中通常**不用手开**：发包必写 `types` 字段，而该字段存在时 dts 自动启用。

## 六、从 tsup 迁移一瞥

```bash
npx tsdown-migrate --dry-run   # 先预览
npx tsdown-migrate             # 自动改配置、改 import、装依赖
npx tsdown-migrate packages/*  # monorepo 按 glob 批量迁移
```

迁移后重点核对三件事：① 默认值变化（`esm`/`clean: true`）；② 选项重命名（`cjsInterop`→`cjsDefault` 等）；③ esbuild 插件替换。完整对照表见[进阶篇](./guide-line/advanced)。

---

跑通第一次构建后，进入[指南 · 基础](./guide-line/base)：构建管线、entry 的四种写法、format/platform/target 与依赖外部化策略。
