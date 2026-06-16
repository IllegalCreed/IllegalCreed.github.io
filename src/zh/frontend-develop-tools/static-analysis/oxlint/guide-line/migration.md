---
layout: doc
outline: [2, 3]
---

# 从 ESLint 迁移

> 基于 oxlint / @oxlint/migrate v1.70.0 编写

## 速查

- 一键迁移：`npx @oxlint/migrate [eslint-flat-config-path]` → 生成 `.oxlintrc.json`
- 含类型规则：`npx @oxlint/migrate --type-aware`（需 `oxlint-tsgolint`）
- 增量共存：`pnpm add -D eslint-plugin-oxlint`，在 `eslint.config.js` 末尾展开其 recommended 预设，关掉与 oxlint 重叠的规则
- oxlint 覆盖：ESLint 核心 + typescript-eslint + 多数热门插件（React/Unicorn/Import/jsx-a11y…）
- 仍需 ESLint 的场景：本地自定义插件、少量尚未实现的边缘规则
- 策略：新项目直接 oxlint；存量大项目先"共存"再逐步替换

## 为什么迁移

ESLint 的瓶颈是速度——大型仓库全量 lint 动辄几十秒到几分钟。oxlint 用 Rust 重写，比 ESLint 快 50–100 倍，且把常用插件规则内置，省掉一堆依赖与配置。

## 路线一：一键替换

```bash
# 自动读取 eslint.config.js（v9/v10 flat config）并转换
npx @oxlint/migrate
```

转换会尽量保留：规则的开关与严重级、规则选项、`overrides`、`globals` 等，产出一份等价的 `.oxlintrc.json`。转换后用 oxlint 跑，确认无误即可卸载 ESLint 及相关插件。

::: tip 只支持 flat config
`@oxlint/migrate` 针对 ESLint v9/v10 的 flat config（`eslint.config.js`）。老的 `.eslintrc` 需要先迁移到 flat config。
:::

## 路线二：增量共存（推荐给大项目）

让 oxlint 跑它擅长且已覆盖的规则（快），ESLint 只保留 oxlint 还不支持的部分：

```bash
pnpm add -D eslint-plugin-oxlint
```

```js
// eslint.config.js
import oxlint from "eslint-plugin-oxlint";

export default [
  // ……你原有的 ESLint 配置……
  // 放在最后：关闭所有 oxlint 已经覆盖的规则，避免重复检查
  ...oxlint.configs["flat/recommended"],
];
```

然后流水线里两个都跑：先 `oxlint`（快、覆盖大头），再 `eslint`（只剩少量规则）。等信心足够，再切到路线一彻底替换。

## 类型感知规则迁移

typescript-eslint 里依赖类型信息的规则（如 `no-floating-promises`），需要 oxlint 的 type-aware 能力：

```bash
npx @oxlint/migrate --type-aware
```

这会在生成的配置中纳入类型规则，底层依赖 `oxlint-tsgolint`（基于 TypeScript 的原生重写）。详见 [类型感知与插件](./type-aware-and-plugins.md)。

## 迁移后清理

替换完成后，卸载被 oxlint 取代的依赖：`eslint`、`@typescript-eslint/*`、各 `eslint-plugin-*`、以及 `eslint-config-prettier`（格式化交给 Prettier / oxfmt 单独跑）。`package.json` 的 lint 脚本改为 `oxlint`。
