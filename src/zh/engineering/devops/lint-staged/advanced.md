---
layout: doc
outline: [2, 3]
---

# 进阶

## 配置文件

### 以函数方式导出配置

```javascript
// lint-staged.config.js
import picomatch from 'picomatch'

export default (allStagedFiles) => {
  const shFiles = picomatch(allStagedFiles, ['**/src/**/*.sh'])
  if (shFiles.length) {
    return `printf '%s\n' "Script files aren't allowed in src directory" >&2`
  }
  const codeFiles = picomatch(allStagedFiles, ['**/*.js', '**/*.ts'])
  const docFiles = picomatch(allStagedFiles, ['**/*.md'])
  return [`eslint ${codeFiles.join(' ')}`, `mdl ${docFiles.join(' ')}`]
}
```

**适用场景**：

- 需要对特定文件类型执行不同任务。
- 禁止某些文件类型提交（如脚本文件）。

### 针对文件名运行脚本

```javascript
// .lintstagedrc.js
export default {
  '**/*.js?(x)': (filenames) =>
    filenames.map((filename) => `prettier --write '${filename}'`),
};
```

**适用场景**：需要逐文件运行命令，而不是一次性处理所有文件

### 对暂存的 TypeScript 文件运行类型检查（tsc）

```javascript
// lint-staged.config.js
export default {
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
};
```

**适用场景**：需要全局检查（如类型依赖跨越多个文件）

### 如果暂存文件超过指定规模，执行全局指令

```javascript
// .lintstagedrc.js
export default {
  '**/*.js?(x)': (filenames) =>
    filenames.length > 10 ? 'eslint .' : `eslint ${filenames.join(' ')}`,
};
```

**适用场景**：大量文件变更时，全面检查更高效。

### 使用您自己的 Glob

```javascript
// lint-staged.config.js
import picomatch from 'picomatch';

export default {
  '': (allFiles) => {
    const codeFiles = picomatch(allFiles, ['**/*.js', '**/*.ts']);
    const docFiles = picomatch(allFiles, ['**/*.md']);
    return [`eslint ${codeFiles.join(' ')}`, `mdl ${docFiles.join(' ')}`];
  },
};
```

**适用场景：**

- 需要完全控制文件匹配逻辑。
- 默认 Glob 模式不满足需求。

### 忽略匹配项中的文件

```javascript
// lint-staged.config.js
import picomatch from 'picomatch';

export default {
  '*.js': (files) => {
    const match = picomatch.not(files, '*test.js');
    return `eslint ${match.join(' ')}`;
  },
};
```

**适用场景**：工具本身无法忽略文件时，使用动态过滤。

### 使用相对路径文件名

```javascript
// lint-staged.config.js
import path from 'path';

export default {
  '*.ts': (absolutePaths) => {
    const cwd = process.cwd();
    const relativePaths = absolutePaths.map((file) => path.relative(cwd, file));
    return `ng lint myProjectName --files ${relativePaths.join(' ')}`;
  },
};
```

**适用场景**：工具要求相对路径输入。

## **重新格式化代码**

主流工具相关指令：`prettier --write`/`eslint --fix`/`tslint --fix`/`stylelint --fix`

执行此指令后，`lint-staged` 会自动执行 `git add` ，您无需将修复后的文件重新加入暂存。

## 最佳实践

以下例子均假设您安装了`husky`，并编写了 `hook`

```shell
# .husky/pre-commit

npx lint-staged
```

### 带有 *.js 和 *.jsx 的默认参数的 ESLint 作为预提交钩子运行

```json
{
  "*.{js,jsx}": "eslint"
}
```

### 使用 --fix 自动修复代码样式并添加到提交

```json
{
  "*.js": "eslint --fix"
}
```

### 重用 npm 脚本

```json
{
  "*.js": "npm run my-custom-script --"
}
```

拼接完文件名后形如 `npm run my-custom-script -- app.js`

### 将环境变量与任务命令一起使用

```json
{
  "*.js": ["cross-env NODE_ENV=test jest --bail --findRelatedTests"]
}
```

### 使用 Prettier 自动修复任何支持的格式

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

### 使用 Stylelint 检查 CSS 和 SCSS

```json
{
  "*.css": "stylelint",
  "*.scss": "stylelint"
}
```

### 先运行 PostCSS 再运行 Stylelint 检查

```json
{
  "*.scss": ["postcss --config path/to/your/config --replace", "stylelint"]
}
```

### 压缩图片

```json
{
  "*.{png,jpeg,jpg,gif,svg}": "imagemin-lint-staged"
}
```

需安装 `imagemin-lint-staged`：`pnpm add -D imagemin-lint-staged`

### 使用 Flow 对 JS 进行类型检查

```json
{
  "*.{js,jsx}": "flow focus-check"
}
```

### 与 Next.js 集成

```javascript
// .lintstagedrc.js
const path = require('path');

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`;

module.exports = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
};
```

### 如何在多包 Monorepo 中使用 lint-staged

在 `monorepo` 根目录安装 `lint-staged`，但在每个包中添加单独的配置文件。`lint-staged` 会使用离暂存文件最近的配置文件，避免任务“泄漏”到其他包。

假设 `monorepo` 结构如下：

```shell
monorepo/
├── packages/
│   ├── frontend/
│   │   └── .lintstagedrc.json
│   └── backend/
│       └── .lintstagedrc.json
├── .lintstagedrc.json
└── package.json
```

当提交 `packages/frontend/index.js` 时，只使用 `packages/frontend/.lintstagedrc.json`

**适用场景**：多包 `monorepo`（如 `pnpm workspace`），每个包有独立 `linting` 需求。
::: warning Monorepo 关键细节

1. **不会回退到父级配置**：lint-staged 会使用离文件最近的配置文件。如果该配置文件中没有匹配的 glob，命令不会执行
2. **空匹配 = 跳过执行**：如果文件不匹配任何 glob 模式，对应命令会被跳过

示例：如果根目录有 `.lintstagedrc.json` 但 `packages/frontend/.lintstagedrc.json` 更近，提交 `packages/frontend/README.md` 时：
- 即使根配置有 `"*.md": "prettier --write"`
- frontend 配置没有匹配 md 的 glob
- **prettier 不会执行**

:::


### 匹配项目文件夹外的文件

```javascript
export default {
  '../**/*.js': 'eslint --fix',  // 匹配项目外的 JS 文件
  '*.js': 'eslint --fix'         // 匹配项目内的 JS 文件
};
```

## JavaScript 函数式任务（对象格式）

v16+ 支持对象格式的任务配置，可自定义显示标题：

```javascript
export default {
  '*.js': {
    title: '🔍 Checking JS files',
    task: async (files) => {
      console.log('Checking files:', files);
      return `eslint ${files.join(' ')}`;
    },
  },
};
```

**适用场景**：需要在 lint-staged 输出中显示更友好的任务名称

## CI 中的高级用法

### `--fail-on-changes`

修改文件后以退出码 1 失败（常用于 `--no-verify` 场景）：

```bash
npx lint-staged --fail-on-changes
```

配合 `--no-revert` 可以保留修改：

```bash
npx lint-staged --fail-on-changes --no-revert
```

### `--continue-on-error`

即使有任务失败也继续执行所有任务：

```bash
npx lint-staged --continue-on-error
```

### `--diff` 用于 CI

在 CI 中检查特定范围的变更：

```bash
# 检查 main 分支和当前 PR 的差异
npx lint-staged --diff="origin/main...HEAD"

# 或使用 merge-base
npx lint-staged --diff="$(git merge-base origin/main HEAD)"
```

### `--diff-filter` 自定义变更类型

默认只检查 `ACMR`（添加、复制、修改、重命名），可以自定义：

```bash
# 只检查新增和修改的文件
npx lint-staged --diff-filter="AM"
```

## TypeScript tsconfig 忽略问题

::: warning 常见问题

通过 Husky 运行 `tsc --noEmit` 时，如果 lint-staged 传递文件参数，TypeScript 可能会忽略 `tsconfig.json`，导致：

- `TS17004: Cannot use JSX unless the '--jsx' flag is provided`
- `TS1056: Accessors are only available when targeting ECMAScript 5 and higher`

:::

**根本原因**：lint-staged 自动传递暂存文件作为参数给 tsc，某些输入文件会导致 TypeScript 忽略 tsconfig.json。

**解决方案**：使用函数签名阻止 lint-staged 传递文件参数：

```javascript
// Before（有问题）
{
  "**/*.ts?(x)": ["tsc --noEmit", "prettier --write"]
}

// After（修复）
{
  "**/*.ts?(x)": [() => "tsc --noEmit", "prettier --write"]
}
```

或者更完整的 TypeScript 配置示例：

```javascript
// lint-staged.config.js
export default {
  "**/*.{ts,tsx}": [
    () => "tsc -p tsconfig.json --noEmit",  // 函数阻止传递文件参数
    "eslint --fix",
    "prettier --write",
  ],
};
```
