---
layout: doc
outline: [2, 3]
---

# 类型感知与 Assist

> 基于 Biome v2.5.0 编写

## 速查

- **类型感知 lint**（v2）：首个**不依赖 tsc** 的类型感知 linter，自研类型推断引擎，无需装 `typescript` 包
- 代表规则 `noFloatingPromises`：约覆盖 typescript-eslint 同名规则 75% 场景，性能开销小得多
- **多文件分析**：靠文件扫描器（file scanner），**按需**启用；默认不全量扫描，仅 `project` 域规则才全扫
- **domains（域）**：按框架/技术分组规则（`react`/`test`/`next`/`solid`），依 `package.json` 自动启用
- **Assist**：无诊断的代码操作——`organizeImports`、`useSortedKeys`、`useSortedAttributes`
- 整理 import：v2 归入 `assist.actions.source.organizeImports`（v1 是独立顶层字段）
- **插件**：用 **GritQL** 写自定义规则（`.grit` 文件，在 `plugins` 声明）

## 类型感知 lint（不依赖 tsc）

typescript-eslint 的类型规则必须启动 TypeScript 编译器（开销大）。Biome v2（代号 Biotype）是**首个不依赖 tsc 就能做类型感知 lint 的 JS/TS linter**——它内置自研类型推断引擎，无需安装 `typescript` 包、无需 tsconfig 项目服务。

代表规则是 `noFloatingPromises`（检测未被 `await` 或处理的悬空 Promise）：

```ts
async function run() {
  doAsync(); // ⚠️ noFloatingPromises：Promise 未被处理
  await doAsync(); // ✅
}
```

::: tip 取舍：快，但覆盖尚不完整
官方称 `noFloatingPromises` 约能覆盖 typescript-eslint 同名规则 **75%** 的场景，但性能开销只是其一小部分。以速度换一定的覆盖度，是 v2 类型感知的核心取舍。
:::

## 多文件分析

v2 引入**文件扫描器**，像 IDE 语言服务那样索引项目文件，使跨文件规则（如 `noImportCycles` 检测循环依赖）成为可能。

它是**按需（opt-in）**的：默认只用于发现配置文件（开销极小），仅当启用 `project` 域规则时才会全量扫描项目与 `node_modules`，以保留 v1 的速度。可用 `files.includes` 控制扫描范围。

## domains（域）

Domains 按**技术/框架**对规则分组，当前有 `react`、`test`、`next`、`solid` 等。Biome 会依 `package.json` 依赖**自动判断**该启用哪些域，让推荐规则与项目技术栈匹配；域还能向 `javascript.globals` 注入相应全局变量。

也可手动控制：

```json
{
  "linter": {
    "domains": {
      "test": "recommended",
      "react": "all",
      "next": "off"
    }
  }
}
```

取值：`"recommended"`（推荐子集）/ `"all"`（全开）/ `"off"`（关闭）。

## Assist（代码助手）

Assist 与 Linter 的本质区别：Linter 产出**诊断（警告/错误）**，Assist 提供**无诊断的代码操作（actions）**——只做整理/重排，不“报错”。常见 action：

- `organizeImports`：整理导入
- `useSortedKeys`：排序对象键
- `useSortedAttributes`：排序 JSX 属性

```json
{
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

::: warning v1 → v2 变化
v2 把“整理 import”归入 Assist 的 `source` action（`assist.actions.source.organizeImports`）。v1 时它是独立的顶层 `organizeImports` 字段——迁移配置时需注意这一结构变化。
:::

可配合编辑器“保存时执行 action”实现保存即整理 import / 排序键。

## 插件 GritQL

v2 支持用 **GritQL** 编写插件来匹配代码片段并报告诊断，作为自定义 lint 规则的方式——填补了 Biome 此前缺少自定义规则机制的空白。

```json
{
  "plugins": [
    { "path": "./rules/no-foo.grit", "includes": ["src/**"] }
  ]
}
```

GritQL 是一种代码结构匹配查询语言；插件以 `.grit` 文件声明，可用 `includes` 限定作用文件。相较 ESLint 的 JS 插件，GritQL 上手快但表达力与生态仍有限。

配置语法见 [配置 - plugins](./configuration.md#plugins-gritql-插件)；命令与字段速查见 [参考](../reference.md)。
