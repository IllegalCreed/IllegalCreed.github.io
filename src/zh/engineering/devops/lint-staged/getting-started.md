---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 lint-staged v16.4.0 编写

## 速查

- 配置文件：`lint-staged.config.ts` / `package.json`
- 配置函数签名：`(filenames: string[]) => string | string[] | Promise<string | string[]>;`
- 匹配方式：`glob`
- 并发：`--concurrent <number>` / `--concurrent false`

## 安装

```shell
pnpm add -D lint-staged
```

## 配置

`Lint-staged` 包含多种配置方式

### 通过 package.json

```json
{
  "lint-staged": {
    "*": "your-cmd"
  }
}
```

### 通过 **.lintstagedrc**

```json
{
  "*": "your-cmd"
}
```

文件后缀可以是：

- `.lintstagedrc.json`
- `.lintstagedrc.yaml`
- `.lintstagedrc.yml`

### 使用 ESM 或 CommonJS

**ESM 格式文件：**

- `.lintstagedrc.mjs`
- `lint-staged.config.mjs`

```javascript
export default { ... }
```

**CommonJS 格式文件：**

- `.lintstagedrc.cjs`
- `lint-staged.config.cjs`

```javascript
module.exports = { ... }
```

::: tip

如果后缀是 `.js` 则会根据 `package.json` 中的 `"type": "module"` 选项自动判断为 ESM 或 CommonJS

:::

### TypeScript 支持

当你的 Node.js 版本小于 `22.6.0` 时，只能使用 JSDoc 添加类型信息

```javascript
/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*': 'prettier --write',
}
```

当你的 Node.js 版本支持原生执行 TS 时，可以直接运行 `lint-staged.config.ts`

举个例子：

```typescript
// lint-staged.config.ts
import type { Configuration } from 'lint-staged';

// 定义配置对象
const config: Configuration = {
  // 匹配所有文件，运行 prettier 格式化
  '*': 'prettier --write --ignore-unknown',

  // 针对 TypeScript 和 JavaScript 文件，先运行 ESLint 修复，再运行 Prettier
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],

  // 针对 CSS 文件，运行 stylelint 修复和 prettier 格式化
  '*.css': [
    'stylelint --fix',
    'prettier --write',
  ],

  // 针对 Markdown 文件，只运行 prettier
  '*.md': 'prettier --write',

  // 示例：动态生成命令（使用函数）
  '*.ts': (filenames: string[]) => {
    // 仅对修改的文件运行类型检查
    return `tsc --noEmit --files ${filenames.join(' ')}`;
  },
};

// 默认导出配置
export default config;
```

使用函数时的函数签名：

```typescript
(filenames: string[]) => string | string[] | Promise<string | string[]>
```

当你的 Node.js 版本介于 `22.6.0` 和 `23.6.0` 之间时，你需要添加参数用来执行 `.ts` 文件

```shell
export NODE_OPTIONS="--experimental-strip-types"
npx lint-staged --config lint-staged.config.ts
```

### 任务并发性

默认情况下，`lint-staged` 会**并发运行**配置的任务。这意味着对于每个 `Glob` 模式，所有命令会同时启动

```json
{
  "*.ts": "eslint",
  "*.md": "prettier --list-different"
}
```

假如你想按顺序执行，你可以把指令放入一个数组中

```json
{
  "*.ts": ["prettier --list-different", "eslint"],
  "*.md": "prettier --list-different"
}
```

::: warning **规避规则重叠导致文件竞争**

当配置的 `Glob` 模式重叠，且任务会修改文件时，可能出现**竞争条件**，比如：

```json
{
  "*": "prettier --write",
  "*.ts": "eslint --fix"
}
```

该问题只能手动规避，有两种规避手段：

1. 使用否定模式
    
    ```json
    {
      "!(*.ts)": "prettier --write",
      "*.ts": ["eslint --fix", "prettier --write"]
    }
    ```
    
2. `--concurrent` 限制并发
    - `--concurrent <number>` 限制并发任务数量
    - `--concurrent false` 完全禁用并发

:::

## **筛选文件**

使用 [**picomatch**](https://github.com/micromatch/picomatch) 来进行 `glob` 文件匹配

### 不含斜杠（/）的 Glob 模式

用 `picomatch` 的 `matchBase` 选项，仅匹配文件名（忽略目录路径）

**示例：**

- `"*.js"`：匹配所有 JS 文件，例如 `/test.js` 和 `/foo/bar/test.js`。
- `"!(*test).js"`：匹配除以 `test.js` 结尾的 JS 文件，例如 `foo.js`，但不匹配 `foo.test.js`。
- `"!(*.css|*.js)"`：匹配除 CSS 和 JS 文件外的所有文件。

### 含斜杠（/）的 Glob 模式

会同时匹配路径和文件名

**示例：**

- `"./*.js"`：仅匹配 Git 仓库根目录下的 JS 文件，例如 `/test.js`，但不匹配 `/foo/bar/test.js`。
- `"foo/**/*.js"`：匹配 `/foo` 目录及其子目录下的所有 JS 文件，例如 `/foo/bar/test.js`，但不匹配 `/test.js`。

### 文件过滤流程

- **自动解析 Git 根目录**：无需手动配置。
- **获取暂存文件**：从项目的暂存区（staged files）中提取文件。
- **应用 Glob 过滤**：使用指定的 Glob 模式筛选文件。
- **传递绝对路径**：将匹配文件的**绝对路径**作为参数传递给任务。

::: warning
`lint-staged` 总是传递文件的**绝对路径**给任务，避免因工作目录不同（例如 `.git` 目录和 `package.json` 目录不一致）导致的混淆。
:::

### 忽略文件

::: warning 核心原则

**lint-staged 不负责忽略文件**。它只是获取暂存文件并传递给任务命令。

忽略逻辑应该由工具本身处理：
- ESLint → `.eslintignore` 或 `ignores` 配置
- Prettier → `.prettierignore`

以下内容仅供参考，详细配置请查看各工具的官方文档。

:::

**工具本身的忽略配置示例**

**使用 Prettier 忽略文件**

`.prettierignore`

```shell
# 忽略构建输出目录
dist/
build/

# 忽略第三方库目录
vendor/
node_modules/

# 忽略特定文件类型
*.min.js
*.log

# 忽略特定文件
package-lock.json
```

**使用 ESLint v9 忽略文件**

`eslint.config.js`

```javascript
// ESLint v9 使用 ignores 的方式
export default [
  // 全局忽略配置
  {
    ignores: ['dist/**', 'vendor/**', '**/*.test.js'],
  },
  // 规则配置
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
    },
  },
];
```

```javascript
// ESLint v9 使用 globalIgnores() 的方式
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // 全局忽略配置
  globalIgnores(['dist/**', 'vendor/**', '**/*.test.js'], 'Custom Global Ignores'),
  // 规则配置
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
    },
  },
]);
```

**lint-staged 官方推荐方案**

### ESLint >= 8.51.0 + Flat Config

使用 `--no-warn-ignored` CLI 标志，无需手动过滤：

```json
{
  "*.{js,ts}": "eslint --max-warnings=0 --no-warn-ignored"
}
```

::: tip

- `--no-warn-ignored` 仅在使用 Flat Config（`eslint.config.js`）时有效
- 这比用函数过滤 `isPathIgnored` 更简洁高效

:::

### ESLint >= 7（传统配置）

使用 `ESLint.isPathIgnored()` 异步过滤：

```javascript
import { ESLint } from 'eslint';

const removeIgnoredFiles = async (files) => {
  const eslint = new ESLint();
  const isIgnored = await Promise.all(
    files.map((file) => eslint.isPathIgnored(file))
  );
  return files.filter((_, i) => !isIgnored[i]).join(' ');
};

export default {
  '**/*.{js,ts}': async (files) => {
    const filesToLint = await removeIgnoredFiles(files);
    return filesToLint ? [`eslint --max-warnings=0 ${filesToLint}`] : [];
  },
};
```

**仅当工具本身的忽略机制无法满足时**

在极少数情况下，当工具本身的忽略机制不生效或无法使用时，可以在 lint-staged 层面动态过滤：

`lint-staged.config.ts`

```typescript
import type { Configuration } from 'lint-staged';

const config: Configuration = {
  '*.{js,ts}': (filenames: string[]) => {
    const filteredFiles = filenames.filter(
      (file) => !file.includes('node_modules/') && !file.includes('dist/')
    );
    return filteredFiles.length > 0 ? [`eslint --fix ${filteredFiles.join(' ')}`] : [];
  },
};

export default config;
```

## CLI 参数

```bash
npx lint-staged --help
```

**常用参数：**

| 参数 | 说明 |
|------|------|
| `--allow-empty` | 允许空提交（当任务回退所有暂存更改时） |
| `--concurrent <number>` | 限制并发任务数量，`false` 完全禁用并发 |
| `--config <path>` | 指定配置文件路径 |
| `--cwd <path>` | 在指定目录运行任务 |
| `--debug` | 打印调试信息 |
| `--diff <string>` | 覆盖默认的 `--staged`，用于 CI 场景 |
| `--diff-filter <string>` | 覆盖默认的 `ACMR` 过滤器 |
| `--fail-on-changes` | 任务修改文件后以退出码 1 失败 |
| `--hide-all` | 隐藏所有未暂存更改和未跟踪文件 |
| `--hide-unstaged` | 隐藏所有未暂存更改 |
| `--no-revert` | 错误时不回退修改 |
| `--no-stash` | 禁用备份 stash |
| `--quiet` | 禁用 lint-staged 自身输出 |
| `--relative` | 传递相对路径给任务 |
| `--verbose` | 显示成功任务的输出 |
| `--stash` | 启用备份 stash（默认启用） |

## Node.js API

可以在代码中直接调用 lint-staged：

```typescript
import lintStaged from 'lint-staged';

try {
  const success = await lintStaged({
    allowEmpty: false,
    concurrent: true,
    configPath: './lint-staged.config.ts',
    cwd: process.cwd(),
    debug: false,
    maxArgLength: null,
    quiet: false,
    relative: false,
    stash: true,
    verbose: false,
  });
  
  console.log(success ? 'Linting passed!' : 'Linting failed!');
} catch (e) {
  console.error('Failed to load configuration:', e);
}
```

也可以直接传递配置对象：

```typescript
const success = await lintStaged({
  config: {
    '*.js': 'eslint --fix',
  },
});
```

## CI 使用场景

在 CI 中检查特定 commit 范围的变更：

```bash
# 检查 main 分支和当前分支之间的差异
git diff --diff-filter=ACMR --name-only main...HEAD

# 使用 lint-staged 检查这些文件
npx lint-staged --diff="main...HEAD"
```

或使用 merge-base 检查当前分支相对于 main 的变更：

```bash
npx lint-staged --diff="$(git merge-base main HEAD)"
```

## CLI 参数

```bash
npx lint-staged --help
```

**常用参数：**

| 参数 | 说明 |
|------|------|
| `--allow-empty` | 允许空提交（当任务回退所有暂存更改时） |
| `--concurrent <number>` | 限制并发任务数量，`false` 完全禁用并发 |
| `--config <path>` | 指定配置文件路径 |
| `--cwd <path>` | 在指定目录运行任务 |
| `--debug` | 打印调试信息 |
| `--diff <string>` | 覆盖默认的 `--staged`，用于 CI 场景 |
| `--diff-filter <string>` | 覆盖默认的 `ACMR` 过滤器 |
| `--fail-on-changes` | 任务修改文件后以退出码 1 失败 |
| `--hide-all` | 隐藏所有未暂存更改和未跟踪文件 |
| `--hide-unstaged` | 隐藏所有未暂存更改 |
| `--no-revert` | 错误时不回退修改 |
| `--no-stash` | 禁用备份 stash |
| `--quiet` | 禁用 lint-staged 自身输出 |
| `--relative` | 传递相对路径给任务 |
| `--verbose` | 显示成功任务的输出 |
| `--stash` | 启用备份 stash（默认启用） |

## Node.js API

可以在代码中直接调用 lint-staged：

```typescript
import lintStaged from 'lint-staged';

try {
  const success = await lintStaged({
    allowEmpty: false,
    concurrent: true,
    configPath: './lint-staged.config.ts',
    cwd: process.cwd(),
    debug: false,
    maxArgLength: null,
    quiet: false,
    relative: false,
    stash: true,
    verbose: false,
  });
  
  console.log(success ? 'Linting passed!' : 'Linting failed!');
} catch (e) {
  console.error('Failed to load configuration:', e);
}
```

也可以直接传递配置对象：

```typescript
const success = await lintStaged({
  config: {
    '*.js': 'eslint --fix',
  },
});
```

## CI 使用场景

在 CI 中检查特定 commit 范围的变更：

```bash
# 检查 main 分支和当前分支之间的差异
git diff --diff-filter=ACMR --name-only main...HEAD

# 使用 lint-staged 检查这些文件
npx lint-staged --diff="main...HEAD"
```

或使用 merge-base 检查当前分支相对于 main 的变更：

```bash
npx lint-staged --diff="$(git merge-base main HEAD)"
```

