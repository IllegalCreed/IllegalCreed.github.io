---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 lint-staged v17.0.4 编写 — 函数式任务、复杂 glob、monorepo、CI、TS 陷阱

## 速查

- 函数式任务：`(files) => string | string[]`，**自己拼文件名**（不自动追加）
- 任务对象：`{ title, task: (files) => ... }`，自定义任务显示名
- Monorepo：每个 package 放独立 `.lintstagedrc.*`，lint-staged **不回溯父级**
- 修改文件后自动 staged，配置里**不要写 `git add`**（v17 会告警）
- `tsc --noEmit` 必须用函数包装阻止文件参数传递，否则会忽略 `tsconfig.json`
- CI 用 `--diff="origin/main...HEAD"` 替代默认的 `--staged`

## 函数式任务

字符串 / 数组形态会自动把匹配文件追加到命令末尾；函数形态不会，要自己拼。

### 简单函数

```js
// .lintstagedrc.js
export default {
  '**/*.js?(x)': (filenames) =>
    filenames.map((filename) => `prettier --write '${filename}'`),
};
```

**适用场景**：需要逐文件运行命令（每个文件一条独立命令），而不是一次性传所有文件。

### 阻止文件参数传递

某些命令（如 `tsc --noEmit`）**接收文件参数会导致行为变化**——比如忽略 `tsconfig.json`。用 `() => string` 形态可以阻止 lint-staged 追加文件：

```js
// 错误：会传暂存文件给 tsc，可能引发问题
export default {
  '**/*.{ts,tsx}': 'tsc --noEmit',  // ❌ tsc 收到文件参数，忽略 tsconfig
};

// 正确：函数形态，不接收 files 直接返回字符串
export default {
  '**/*.{ts,tsx}': () => 'tsc -p tsconfig.json --noEmit',  // ✅
};
```

### 根据文件规模切换全局指令

```js
export default {
  '**/*.js?(x)': (filenames) =>
    filenames.length > 10 ? 'eslint .' : `eslint ${filenames.join(' ')}`,
};
```

**适用场景**：大量文件变更时全量检查更快（避开命令行参数过长 + 调度开销）。

### 自定义 glob 过滤

```js
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

**适用场景**：默认 glob 模式表达不了的复杂筛选逻辑。

### 排除匹配项中的文件

```js
import picomatch from 'picomatch';

export default {
  '*.js': (files) => {
    const matched = picomatch.not(files, '*test.js');
    return `eslint ${matched.join(' ')}`;
  },
};
```

### 改用相对路径

```js
import path from 'node:path';

export default {
  '*.ts': (absolutePaths) => {
    const cwd = process.cwd();
    const relative = absolutePaths.map((file) => path.relative(cwd, file));
    return `ng lint myProject --files ${relative.join(' ')}`;
  },
};
```

**适用场景**：工具（如 Angular CLI）要求相对路径输入。或者直接 `--relative` CLI 参数。

## 任务对象（v16+）

带自定义标题的任务：

```js
export default {
  '*.js': {
    title: '🔍 Checking JS files',
    task: async (files) => {
      console.log('Checking:', files);
      return `eslint ${files.join(' ')}`;
    },
  },
};
```

**适用场景**：lint-staged 输出里希望显示更友好的任务名（而不是 raw 命令）。

## 重新格式化（auto-fix）

主流 fixer 命令：`prettier --write` / `eslint --fix` / `stylelint --fix`。

**lint-staged 会自动把修复后的文件加入暂存**——v17 起，**不要在配置里写 `git add`**，否则触发 warning。

```js
// ❌ v17 会告警
export default {
  '*.js': ['eslint --fix', 'git add'],
};

// ✅ 自动追加，无需手写
export default {
  '*.js': 'eslint --fix',
};
```

## 最佳实践集

### ESLint 基础

```json
{
  "*.{js,jsx,ts,tsx}": "eslint --fix --no-warn-ignored"
}
```

`--no-warn-ignored` 是 ESLint 8.51+ flat config 的能力，让 ESLint 自己处理 `.gitignore` / `ignores` 配置，不需要 lint-staged 层做过滤。

### Prettier 兜底

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

`--ignore-unknown` 让 Prettier 跳过它不支持的格式（图片、二进制等），配 `*` 做兜底很方便。

### Stylelint

```json
{
  "*.{css,scss}": "stylelint --fix"
}
```

### PostCSS + Stylelint 顺序

```json
{
  "*.scss": ["postcss --config path/to/config --replace", "stylelint"]
}
```

数组按顺序执行，先 PostCSS 处理再 Stylelint 检查。

### 压缩图片

```bash
pnpm add -D imagemin-lint-staged
```

```json
{
  "*.{png,jpeg,jpg,gif,svg}": "imagemin-lint-staged"
}
```

### 环境变量

```json
{
  "*.js": ["cross-env NODE_ENV=test jest --bail --findRelatedTests"]
}
```

### 重用 npm script

```json
{
  "*.js": "pnpm run my-custom-script --"
}
```

拼接后形如 `pnpm run my-custom-script -- file1.js file2.js`。

### Next.js 集成

Next.js 自己有个 `next lint --file <path>` 的 API，要逐个传文件：

```js
import path from 'node:path';

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`;

export default {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
};
```

::: tip Next.js 15+ 已弃用 `next lint`

Next.js 15 起官方推荐直接用 ESLint CLI，不再用 `next lint`。新项目直接 `eslint --fix --no-warn-ignored` 即可。

:::

## Monorepo 用法

### 配置就近原则

根目录装一份 lint-staged，**每个 package 放自己的 `.lintstagedrc.*`**：

```
monorepo/
├── packages/
│   ├── frontend/
│   │   └── .lintstagedrc.json
│   └── backend/
│       └── .lintstagedrc.json
├── .lintstagedrc.json
└── package.json
```

提交 `packages/frontend/index.js` 时，**只使用 `packages/frontend/.lintstagedrc.json`**。

::: warning Monorepo 关键细节

1. **不会回溯父级配置**：lint-staged 用离文件最近的那份。如果该配置里没有匹配的 glob，**对应命令直接跳过**，不会回到根目录配置找
2. **空匹配 = 静默跳过**：文件不匹配任何 glob 时，命令不会执行，**不报错也不告警**

举例：根目录配 `"*.md": "prettier --write"`，但 `packages/frontend/.lintstagedrc.json` 没匹配 `.md` 的 glob，提交 `packages/frontend/README.md` 时 **prettier 不会跑**。

:::

### 匹配项目外文件

```js
export default {
  '../**/*.js': 'eslint --fix', // 项目目录外的 JS
  '*.js': 'eslint --fix', // 项目内的 JS
};
```

适合 monorepo 共享配置 / 工具脚本写在外层目录的场景。

## TypeScript `tsc` 的坑

::: warning 经典问题

通过 lint-staged 运行 `tsc --noEmit` 时，lint-staged 会把暂存文件作为参数传给 `tsc`。但只要 `tsc` 收到了文件参数，它就会**忽略 `tsconfig.json`**——这是 TypeScript 的设计，不是 bug。

表现：

- `TS17004: Cannot use JSX unless the '--jsx' flag is provided`
- `TS1056: Accessors are only available when targeting ECMAScript 5 and higher`
- `paths` / `baseUrl` 等失效

:::

### 解决：用函数形态阻止文件参数

```js
// ❌ tsc 收到文件，忽略 tsconfig
export default {
  '**/*.ts?(x)': ['tsc --noEmit', 'prettier --write'],
};

// ✅ 函数返回字符串，文件不被追加
export default {
  '**/*.ts?(x)': [() => 'tsc --noEmit', 'prettier --write'],
};
```

完整一份 `.ts` 配置：

```js
export default {
  '**/*.{ts,tsx}': [
    () => 'tsc -p tsconfig.json --noEmit',
    'eslint --fix --no-warn-ignored',
    'prettier --write',
  ],
};
```

## CI 中的高级用法

### `--diff` 检查特定 commit 范围

CI 里通常不是「提交时刻」，没暂存文件。改用 `--diff` 检查任意范围：

```bash
# PR 检查：相对 main 分支的所有改动
npx lint-staged --diff="origin/main...HEAD"

# 或用 merge-base 拿到分叉点
npx lint-staged --diff="$(git merge-base origin/main HEAD)"
```

`--diff` 会自动隐含 `--no-stash`（CI 里不需要 stash 备份）。

### `--diff-filter` 自定义变更类型

默认只检查 `ACMR`（添加 / 复制 / 修改 / 重命名）。可改：

```bash
# 只检查新增 + 修改
npx lint-staged --diff-filter="AM"

# 含删除（D），用于 prettier --check 之类只读检查
npx lint-staged --diff-filter="ACDMR"
```

字母含义：A=Added / C=Copied / D=Deleted / M=Modified / R=Renamed / T=Type-changed / U=Unmerged / X=Unknown / B=Broken。

### `--fail-on-changes` —— 严格模式

修改了任何文件就退出 1，常用在 CI 检查"代码是否需要格式化"：

```bash
npx lint-staged --fail-on-changes
```

配 `--no-revert` 保留修改（默认会回滚）：

```bash
npx lint-staged --fail-on-changes --no-revert
```

### `--continue-on-error` —— 跑完所有

默认任一 task 失败就停止；这个让所有 task 跑完再统一报：

```bash
npx lint-staged --continue-on-error
```

### `--hide-all`（v17 新增）

跑任务前隐藏**未暂存改动 + 未跟踪文件**。专门给 Knip / depcheck 这类"扫全仓"工具用：

```bash
npx lint-staged --hide-all
```

vs `--hide-unstaged`（v16 已有，只隐藏未暂存改动；不动未跟踪文件）。

## 常见陷阱

### 1. CRLF 行尾警告

Windows + git autocrlf 时，lint-staged 偶尔报 CRLF 转换告警。处理：

```bash
# 项目级关闭
git config --local core.autocrlf input

# 或加 .gitattributes
echo "* text=auto eol=lf" >> .gitattributes
```

### 2. `husky install` v9 已弃用

v9 起 husky 用 `husky init` 而不是 `husky install`：

```bash
# v8 写法（已弃用）
pnpm exec husky install

# v9+ 写法
pnpm exec husky init
```

`pre-commit` 文件内容也变了，不再需要 `#!/bin/sh` + source 一段——直接写命令即可。

### 3. 函数返回 `[]` 让任务整体跳过

如果你过滤后没有文件需要处理，**返回空数组**让任务跳过：

```js
export default {
  '*.js': (files) => {
    const filtered = files.filter(/* ... */);
    return filtered.length > 0 ? `eslint ${filtered.join(' ')}` : [];
  },
};
```

返回空字符串 `''` 会让 lint-staged 尝试执行空命令——别这么写。

### 4. 提交时报 「Some of your tasks use git add command」

v17 起 `git add` 会触发 warning（v16 是 error 已经禁用）。lint-staged 自动入暂存，配置里手动写 `git add` 是多余的，删掉就行。

### 5. Bun 跑 lint-staged

v17 全部测试通过 Bun runtime。如果用 Bun：

```bash
bun add -d lint-staged
bunx lint-staged
```

Bun ≥ 1.1.0 即可。

### 6. 子模块 / 部分 worktree

v17 改用 `git update-index --again` 替代 `git add <files>`，对自定义 index、worktree 兼容性更好。如果之前用 `git worktree add` 创建的工作树跑 lint-staged 报错，升 v17 八成能修。
