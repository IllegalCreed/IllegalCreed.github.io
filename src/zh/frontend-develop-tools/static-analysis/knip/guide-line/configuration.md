---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 Knip v6.17.1 编写

## 速查

- 配置文件：`knip.json` / `knip.jsonc` / `knip.ts` / `knip.config.ts` / `package.json#knip`
- `$schema`：`https://unpkg.com/knip@6/schema.json`（jsonc 用 `schema-jsonc.json`）
- 两个核心字段：`entry`（分析起点）+ `project`（分析范围），glob 用 `!` 前缀排除
- TS 配置：`import type { KnipConfig } from "knip"` 或 `satisfies KnipConfig`
- 别名：`paths`（TypeScript 语义，无 `*` 为精确匹配）
- 排除：`ignore`（慎用）/ `ignoreDependencies` / `ignoreBinaries`（均支持正则）
- 内部导出：`ignoreExportsUsedInFile`；入口导出：`includeEntryExports`（默认 false）
- monorepo：`workspaces` 下按目录配置，详见 [Monorepo](./monorepo.md)

## 配置文件

Knip 支持多种格式，按需选用：

| 文件                 | 说明                                  |
| -------------------- | ------------------------------------- |
| `knip.json`          | 最常用，配 `$schema` 获得补全         |
| `knip.jsonc`         | 支持注释                              |
| `knip.ts` / `knip.config.ts` | 动态/带类型配置（可用 `compilers`） |
| `package.json` 的 `knip` 键 | 不想新增文件时                  |

JSON 配置建议声明 schema：

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json"
}
```

TypeScript 配置享受类型提示：

```ts
import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/index.ts"],
  project: ["src/**/*.ts"],
};

export default config;
```

## entry 与 project：两个核心字段

理解这两个字段是用好 Knip 的关键：

- **`entry`**：分析的**起点**。Knip 从这些文件出发，顺着 `import`/`require` 遍历，**可达的**视为"在用"。默认已包含 `index`、`main`、`bin`、各框架约定入口等。
- **`project`**：纳入分析的**全部文件**范围。`project` 里存在、但从任一 `entry` 都走不到的文件，就是"未使用的文件"。

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["src/index.ts", "scripts/*.ts"],
  "project": ["src/**/*.ts", "scripts/**/*.ts"]
}
```

glob 支持 `!` 前缀做排除，例如 `"entry": ["src/**/*.ts", "!src/**/*.stories.ts"]`。

::: tip 多数项目不必手写 entry
插件会按 `package.json` 的依赖自动补充入口（如 Vitest 把测试文件加为入口）。先零配置跑一遍，**只在出现误报时**再补 `entry`。
:::

## paths：路径别名

与 `tsconfig.json` 的 `paths` 同语义；不含 `*` 的键是精确匹配：

```json
{
  "paths": {
    "@lib": ["./lib/index.ts"],
    "@lib/*": ["./lib/*"]
  }
}
```

若项目已在 `tsconfig.json` 配了 `paths`，Knip 一般会自动读取，无需重复。

## 排除选项（最后手段）

官方强调：**意外的结果多半是真问题或配置缺口，而非要消音的误报**。优先用 `entry` 把项目结构教给 Knip，`ignore*` 是最后手段。

```json
{
  "ignore": ["**/fixtures/**"],
  "ignoreDependencies": ["@types/.*", "some-implicit-dep"],
  "ignoreBinaries": ["docker", "pm2"],
  "ignoreExportsUsedInFile": true,
  "includeEntryExports": false
}
```

- `ignore`：从分析中整体排除文件（慎用，会连带影响多类检查）
- `ignoreFiles`：只从"未使用文件"检测中排除
- `ignoreDependencies` / `ignoreBinaries`：排除依赖/命令，**支持正则**
- `ignoreExportsUsedInFile`：仅在本文件内被用到的导出不报告
- `includeEntryExports`：是否也报告**入口文件**里的未用导出（默认 `false`）

## 编译器 compilers

处理 `.vue` / `.svelte` / `.astro` / `.mdx` 等非标准文件，从中抽取出 import 供分析（**仅 TS 配置可用**）：

```ts
import type { KnipConfig } from "knip";

export default {
  compilers: {
    // 简单开启内置处理
    mdx: true,
    // 或自定义：把源码转成可分析的 JS/import
    svelte: (source: string) => require("svelte/compiler").compile(source, {}).js.code,
  },
} satisfies KnipConfig;
```

## tags：按标记筛选导出

配合 JSDoc/TSDoc 标记，对导出做包含/排除，避免误报又不必硬 `ignore`：

```ts
/** @public 故意对外暴露的 API */
export const publicApi = () => {};

/** @internal 仅内部使用 */
export const internalHelper = () => {};
```

CLI 侧用 `knip --tags=-internal`（排除带 `@internal` 的导出）等组合。完整字段见 [参考](../reference.md)；处理误报的系统方法见 [处理误报](./usage-and-fixing.md#处理误报)。
