---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 lint-staged v17.0.4 编写

## 速查

- 安装：`pnpm add -D lint-staged`（需 Node.js **22.22.1+** / Git **2.32.0+**）
- 配置文件：`package.json` 的 `lint-staged` 字段 / `.lintstagedrc.*` / `lint-staged.config.{js,mjs,cjs,ts}`
- Schema：`{ "<glob>": "command" | ["cmd1", "cmd2"] | (files) => string }`
- Glob 引擎：[picomatch](https://github.com/micromatch/picomatch)
- 触发：通常作为 husky `pre-commit` hook 的一条命令
- 并发：默认所有 glob 并发，数组形式串行执行
- 修改文件后自动 `git add`，不需要手动入暂存

## 安装

```bash
pnpm add -D lint-staged
```

::: warning v17 起对环境的硬性要求

- **Node.js ≥ 22.22.1**（active LTS）
- **Git ≥ 2.32.0**（2021 年发布的版本）

如果 CI / 同事机器还卡在 Node 20，先把 Node 升上来再谈 lint-staged 升级。
:::

## 配置文件

lint-staged 按以下顺序查找配置（命中即用）：

1. `package.json` 的 `"lint-staged"` 字段
2. `.lintstagedrc`（JSON 或 YAML）
3. `.lintstagedrc.json` / `.lintstagedrc.yaml` / `.lintstagedrc.yml`
4. `.lintstagedrc.mjs` / `lint-staged.config.mjs`（ESM）
5. `.lintstagedrc.cjs` / `lint-staged.config.cjs`（CommonJS）
6. `.lintstagedrc.js` / `lint-staged.config.js`（按 `package.json` 的 `type` 字段判定模块系统）
7. `lint-staged.config.ts`（需要 Node 原生 TS 执行，见下文）
8. CLI 显式 `--config <path>`

### 通过 package.json

```json
{
  "lint-staged": {
    "*": "your-cmd"
  }
}
```

### 通过 .lintstagedrc.*

```json
{
  "*": "your-cmd"
}
```

支持后缀：`.lintstagedrc.json` / `.yaml` / `.yml`。

::: warning v17 起 yaml 依赖改为可选

用 `.lintstagedrc.yaml` / `.yml` 的项目要额外 `pnpm add yaml`——v17 把它从核心依赖移到可选依赖。多数项目用 JSON / JS / TS，没影响。
:::

### ESM 或 CommonJS

**ESM**（`.mjs` 或 `package.json` 是 `type: module` 时的 `.js`）：

```js
export default {
  '*': 'prettier --write',
};
```

**CommonJS**（`.cjs` 或 `type: commonjs` 时的 `.js`）：

```js
module.exports = {
  '*': 'prettier --write',
};
```

### TypeScript 支持

#### 方案 A：JSDoc（兼容性最好）

```js
/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*': 'prettier --write',
};
```

#### 方案 B：原生 TS 执行（Node 22.6+）

Node 22.6.0+ 可以原生执行 `.ts` 文件。22.6 到 23.5 之间需要环境变量：

```bash
export NODE_OPTIONS="--experimental-strip-types"
npx lint-staged --config lint-staged.config.ts
```

Node 23.6+ 起 `--experimental-strip-types` 默认开启，可省略。

```ts
// lint-staged.config.ts
import type { Configuration } from 'lint-staged';

const config: Configuration = {
  '*': 'prettier --write --ignore-unknown',
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  '*.css': ['stylelint --fix', 'prettier --write'],
  '*.md': 'prettier --write',
  '*.ts': (filenames: string[]) =>
    `tsc --noEmit --files ${filenames.join(' ')}`,
};

export default config;
```

## 配置 Schema

```
{
  "<glob>": "command"                  // 字符串：单命令
        |   ["cmd1", "cmd2", ...]      // 数组：按顺序串行执行
        |   (files: string[]) => ...   // 函数：动态生成命令
}
```

字符串和数组形态会**自动把匹配文件追加到命令末尾**：

```json
{
  "*.js": "eslint --fix"
}
```

实际执行：`eslint --fix file1.js file2.js ...`

函数形态**不会自动追加**，要在返回值里自己拼：

```js
{
  '*.js': (files) => `eslint --fix ${files.join(' ')}`,
}
```

## 任务并发

默认所有 glob 是并发的：

```json
{
  "*.ts": "eslint",
  "*.md": "prettier --list-different"
}
```

两条同时跑。要串行就把命令放数组：

```json
{
  "*.ts": ["prettier --list-different", "eslint"],
  "*.md": "prettier --list-different"
}
```

`*.ts` 的 prettier 跑完再跑 eslint，但 `*.ts` 整体与 `*.md` 还是并发。

::: warning 规避 glob 重叠的竞争条件

当不同 glob 都匹配同一文件，且命令都会修改文件时，会出现竞争条件：

```json
{
  "*": "prettier --write",
  "*.ts": "eslint --fix"
}
```

`foo.ts` 被两条命令同时改，结果不可预测。两种规避方式：

1. **否定模式**让 glob 不重叠：

   ```json
   {
     "!(*.ts)": "prettier --write",
     "*.ts": ["eslint --fix", "prettier --write"]
   }
   ```

2. **限制并发**：
   - `--concurrent 1` 串行（最简单粗暴）
   - `--concurrent false` 完全禁用并发
   - `--concurrent <n>` 限制并发数

:::

## Glob 匹配规则

底层是 [picomatch](https://github.com/micromatch/picomatch)。规则因 glob 中是否有 `/` 而不同。

### 不含 `/` —— matchBase

只看文件名，不看路径：

| Glob | 匹配 | 不匹配 |
|---|---|---|
| `*.js` | `/test.js`、`/foo/bar/test.js` | - |
| `!(*test).js` | `foo.js` | `foo.test.js` |
| `!(*.css\|*.js)` | 除 CSS 和 JS 外的文件 | `.css` / `.js` 文件 |

### 含 `/` —— 路径 + 文件名

会一起匹配：

| Glob | 匹配 | 不匹配 |
|---|---|---|
| `./*.js` | 仅根目录 `/test.js` | `/foo/bar/test.js` |
| `foo/**/*.js` | `/foo/bar/test.js` | `/test.js` |

### 文件过滤流程

1. **解析 Git 根目录**（自动，无需配置）
2. **拿暂存文件**（`--diff` 覆盖时拿对应 diff）
3. **应用 Glob 过滤**（picomatch）
4. **传绝对路径给命令**（除非 `--relative`）

::: tip 为什么传绝对路径

避免 `.git` 和 `package.json` 不在同一目录时混淆。要相对路径用 `--relative`。
:::

## 忽略文件

::: warning 核心原则

**lint-staged 不负责忽略文件**。它只把暂存文件交给命令，忽略逻辑由命令本身处理：

- ESLint → `.eslintignore` 或 flat config 里的 `ignores`
- Prettier → `.prettierignore`
- Stylelint → `.stylelintignore`

:::

### ESLint Flat Config + `--no-warn-ignored`（推荐）

ESLint 8.51+ 的 flat config 模式下，`eslint --no-warn-ignored` 让 ESLint 自己处理忽略文件：

```json
{
  "*.{js,ts}": "eslint --max-warnings=0 --no-warn-ignored"
}
```

::: tip
仅在使用 `eslint.config.js`（flat config）时有效；比手动调 `ESLint.isPathIgnored()` 简洁得多。
:::

### ESLint 传统配置 + 异步过滤

ESLint 7+ 的旧配置下用 `ESLint.isPathIgnored()`：

```js
import { ESLint } from 'eslint';

const removeIgnoredFiles = async (files) => {
  const eslint = new ESLint();
  const isIgnored = await Promise.all(
    files.map((file) => eslint.isPathIgnored(file)),
  );
  return files.filter((_, i) => !isIgnored[i]).join(' ');
};

export default {
  '**/*.{js,ts}': async (files) => {
    const toLint = await removeIgnoredFiles(files);
    return toLint ? [`eslint --max-warnings=0 ${toLint}`] : [];
  },
};
```

### 在 lint-staged 层手动过滤（不建议）

只有当工具本身没有忽略机制、又非过滤不可时，才考虑：

```ts
import type { Configuration } from 'lint-staged';

const config: Configuration = {
  '*.{js,ts}': (filenames: string[]) => {
    const filtered = filenames.filter(
      (f) => !f.includes('node_modules/') && !f.includes('dist/'),
    );
    return filtered.length > 0 ? [`eslint --fix ${filtered.join(' ')}`] : [];
  },
};

export default config;
```

## 一份能跑的最小示例

配合 husky：

```bash
# 1. 装依赖
pnpm add -D husky lint-staged prettier eslint

# 2. 初始化 husky
pnpm exec husky init
```

```js
// lint-staged.config.js
export default {
  '*.{ts,tsx,js,jsx}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{json,md,css,scss}': 'prettier --write',
};
```

```bash
# .husky/pre-commit
pnpm exec lint-staged
```

提交时自动跑 ESLint + Prettier，仅作用于本次暂存的文件。

## 下一步

- 函数式任务、复杂 glob、monorepo、CI 集成、TypeScript tsconfig 陷阱见 [指南](./guide-line.md)
- CLI 全参数表、Node.js API、`--diff` / `--hide-all` 等高级 flag 见 [参考](./reference.md)
