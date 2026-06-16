---
layout: doc
outline: [2, 3]
---

# lint 与 format

> 基于 Biome v2.5.0 编写

## 速查

- 格式化：`biome format --write ./src`；与 Prettier 约 **97% 兼容**
- 检查：`biome lint --write ./src`；一把梭：`biome check --write ./src`
- 修复分级：`--write` 应用**安全**修复；追加 `--unsafe` 应用**不安全**修复（可能改变语义）
- 单规则改修复行为：`{ "level": "warn", "fix": "safe" }`（`fix`: `none`/`safe`/`unsafe`）
- 规则组：`accessibility`/`complexity`/`correctness`/`nursery`/`performance`/`security`/`style`/`suspicious`
- 严重级：`off`/`info`/`warn`/`error`（`on` = 默认级）；`recommended: false` 关全部推荐
- 抑制诊断：`// biome-ignore lint/<组>/<规则>: 理由`（**理由必填**），文件级 `biome-ignore-all`，范围 `biome-ignore-start`/`-end`
- 禁用格式化：`// biome-ignore format: 理由`

## 格式化

```bash
biome format ./src           # 仅检查（不改文件）
biome format --write ./src   # 写回
```

Biome formatter 与 Prettier 约 **97% 兼容**——绝大多数文件结果一致，迁移视觉差异极小。支持 JS / TS / JSX / TSX / JSON / JSONC / CSS / GraphQL（HTML 仍为实验性）。

::: warning 与 Prettier 的主要差异
- 缩进默认 `tab`（Prettier 默认空格）
- 少数边缘排版有差异，官方有专门的「Differences with Prettier」文档
:::

禁用格式化用注释（见下文「抑制」）。

## 代码检查

```bash
biome lint ./src           # 仅报告
biome lint --write ./src   # 应用安全修复
```

::: tip 不支持命令行 glob
Biome 命令行只接受文件/目录路径，**不支持** glob（如 `src/**/*.ts`）。要按 glob 选文件请用配置里的 `files.includes`。
:::

### 规则组与严重级

Biome 内置 500+ 规则（来自 ESLint、typescript-eslint 等来源），按 8 个组划分：

| 组              | 含义                          |
| --------------- | ----------------------------- |
| `accessibility` | 无障碍（a11y）问题            |
| `complexity`    | 可简化的复杂代码              |
| `correctness`   | 几乎确定是 bug / 无用代码     |
| `nursery`       | 实验性规则（不受语义化版本约束）|
| `performance`   | 运行时性能                    |
| `security`      | 潜在安全隐患                  |
| `style`         | 一致、地道的写法              |
| `suspicious`    | 很可能有问题的代码            |

严重级：`off` / `info` / `warn` / `error`，外加 `on`（按规则默认级开启）。Biome 比 ESLint 多了 `info` 级，可用于“提示但不阻断”。

```json
{
  "linter": {
    "rules": {
      "recommended": true,
      "suspicious": { "noDebugger": "error" },
      "style": { "noNonNullAssertion": "warn" }
    }
  }
}
```

### 命名约定

- `use*`：强制/建议某种写法（`useImportType`、`useConst`）
- `no*`：禁止某种写法（`noDebugger`、`noUnusedVariables`）

## 安全修复 vs 不安全修复

Biome 把自动修复分两档：

- **安全（safe）**：保证不改变语义，`--write` 即应用，无需复核
- **不安全（unsafe）**：可能改变语义，需 `--write --unsafe` 才应用，建议人工复核

```bash
biome check --write ./src            # 仅安全修复
biome check --write --unsafe ./src   # 含不安全修复
```

可对单条规则用 `fix` 字段微调其修复行为（`none` / `safe` / `unsafe`）：

```json
{
  "linter": {
    "rules": {
      "style": {
        "useTemplate": { "level": "warn", "fix": "safe" }
      }
    }
  }
}
```

## 抑制（suppress）诊断

Biome 用 `biome-ignore` 系列注释，格式为 `// biome-ignore <category>: <explanation>`，`category` 可为 `lint` / `assist` / `syntax`，并可细化到组与规则名。**解释（explanation）是必填的**，省略会使抑制无效。

```js
// 抑制下一行的某条规则（理由必填）
// biome-ignore lint/suspicious/noDebugger: 临时调试
debugger;

// 抑制下一行某个组
// biome-ignore lint/suspicious: 这一处确需如此
foo();
```

文件级与范围抑制：

```js
// 整文件跳过 lint（放文件顶部）
// biome-ignore-all lint: 自动生成的文件

// 区间抑制
// biome-ignore-start lint/suspicious/noDoubleEquals: 兼容旧逻辑
a == b;
c == d;
// biome-ignore-end lint/suspicious/noDoubleEquals: 兼容旧逻辑
```

禁用格式化：

```js
// 跳过下一段代码的格式化
// biome-ignore format: 保留手动对齐
const matrix = [1, 0, 0,
                0, 1, 0,
                0, 0, 1];

// 整文件禁用格式化（放文件顶部）
// biome-ignore-all format: 生成文件
```

v2 的类型感知规则、Assist 与 GritQL 插件见 [类型感知与 Assist](./type-aware-and-assist.md)；从既有工具迁移见 [从 ESLint / Prettier 迁移](./migration.md)。
