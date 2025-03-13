---
layout: doc
outline: [2, 3]
---

# 进阶

## 配置文件

### 以函数方式导出配置

```javascript
// lint-staged.config.js
import micromatch from 'micromatch'

export default (allStagedFiles) => {
  const shFiles = micromatch(allStagedFiles, ['**/src/**/*.sh'])
  if (shFiles.length) {
    return `printf '%s\n' "Script files aren't allowed in src directory" >&2`
  }
  const codeFiles = micromatch(allStagedFiles, ['**/*.js', '**/*.ts'])
  const docFiles = micromatch(allStagedFiles, ['**/*.md'])
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
import micromatch from 'micromatch';

export default {
  '': (allFiles) => {
    const codeFiles = micromatch(allFiles, ['**/*.js', '**/*.ts']);
    const docFiles = micromatch(allFiles, ['**/*.md']);
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
import micromatch from 'micromatch';

export default {
  '*.js': (files) => {
    const match = micromatch.not(files, '*test.js');
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
  "*.scss": "stylelint --syntax=scss"
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

### 匹配项目文件夹外的文件

```javascript
export default {
  '../**/*.js': 'eslint --fix',  // 匹配项目外的 JS 文件
  '*.js': 'eslint --fix'         // 匹配项目内的 JS 文件
};
```