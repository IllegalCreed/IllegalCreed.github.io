---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 lint-staged v17.0.4 编写 — CLI 全参数 + Node.js API + 兼容性矩阵

## CLI 全参数表

```bash
npx lint-staged [options]
```

| 参数 | 说明 |
|---|---|
| `-h, --help` | 显示帮助 |
| `-V, --version` | 显示版本号 |
| `--allow-empty` | 允许空提交（任务回退了所有暂存改动时） |
| `-p, --concurrent <n\|bool>` | 任务并发：`false` 串行 / `true` 不限 / 数字限制 |
| `-c, --config [path]` | 指定配置文件路径，或 `-` 从 stdin 读 |
| `--continue-on-error` | 即使有任务失败也继续；结束统一退出 1 |
| `--cwd [path]` | 在指定目录执行 |
| `-d, --debug` | 打印调试信息，使用 verbose 渲染器 |
| `--diff [string]` | 覆盖默认的 `--staged`（如 `--diff="branch1...branch2"`），自动隐含 `--no-stash` |
| `--diff-filter [string]` | 覆盖默认 `ACMR` 过滤器（A/C/D/M/R/T/U/X/B） |
| `--fail-on-changes` | 任务修改文件后以退出码 1 失败，自动隐含 `--no-revert` |
| `--hide-unstaged` | 跑任务前隐藏未暂存改动（v16 已有） |
| `--hide-all` | 跑任务前隐藏未暂存改动 **+ 未跟踪文件**（v17 新增） |
| `--no-hide-partially-staged` | 部分暂存文件保留未暂存部分 |
| `--max-arg-length [n]` | 单条命令参数最大长度，`0` 不限 |
| `-q, --quiet` | 不打印 lint-staged 自己的输出 |
| `-r, --relative` | 传相对路径给任务（默认绝对路径） |
| `--no-revert` | 错误时不回退修改 |
| `--no-stash` | 不创建 stash 备份 |
| `-v, --verbose` | 显示所有任务输出（成功 + 失败） |

### 隐藏机制对比

| flag | 未暂存改动 | 未跟踪文件 | 适用场景 |
|---|---|---|---|
| 默认 | 保留 | 保留 | 普通 lint / format |
| `--hide-unstaged` | 隐藏 | 保留 | 类型检查（避免被未保存改动干扰） |
| `--hide-all` | 隐藏 | 隐藏 | Knip / depcheck 扫死代码 |

## Node.js API

### 基础用法

```ts
import lintStaged from 'lint-staged';

try {
  const success = await lintStaged();
  console.log(success ? 'Linting passed!' : 'Linting failed!');
} catch (e) {
  console.error('Config error:', e);
}
```

### 完整 options

```ts
const success = await lintStaged({
  allowEmpty: false,           // 对应 --allow-empty
  concurrent: true,            // true / false / number
  config: { '*.js': 'eslint --fix' },   // 直接传配置对象
  configPath: './lint-staged.config.ts', // 或指定文件路径（与 config 二选一）
  cwd: process.cwd(),
  debug: false,
  maxArgLength: null,          // Windows 上建议设 8192 避免参数过长
  quiet: false,
  relative: false,
  stash: true,
  verbose: false,
});
```

::: tip Windows 路径长度

Node.js API 不自动配置 `maxArgLength`。Windows 命令行有 8192 字符限制，大型 monorepo 暂存文件多时建议显式设：

```ts
maxArgLength: 8192,
```

避免 `ENAMETOOLONG` 错误。

:::

## 配置 Schema

### Configuration type

```ts
import type { Configuration } from 'lint-staged';

type Configuration = Record<
  string,                       // glob 模式
  | string                      // 单命令
  | string[]                    // 多命令（按顺序串行）
  | TaskFn                      // 函数
  | TaskObject                  // 任务对象
>;

type TaskFn = (
  stagedFiles: string[],
) => string | string[] | Promise<string | string[]>;

interface TaskObject {
  title?: string;
  task: TaskFn;
}
```

### 函数任务参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `stagedFiles` | `string[]` | 匹配 glob 的暂存文件绝对路径数组（除非 `--relative`） |

返回值类型：
- `string` —— 单条命令
- `string[]` —— 多条命令（按顺序串行执行）
- `Promise<...>` —— 异步生成命令
- `[]`（空数组）—— 跳过本任务（推荐当过滤后没文件时使用）

## 配置文件查找顺序

```
1. package.json 的 "lint-staged" 字段
2. .lintstagedrc                           （JSON 或 YAML）
3. .lintstagedrc.json
4. .lintstagedrc.yaml / .lintstagedrc.yml  （v17 起需单独装 yaml 依赖）
5. .lintstagedrc.mjs / lint-staged.config.mjs                （ESM）
6. .lintstagedrc.cjs / lint-staged.config.cjs                （CommonJS）
7. .lintstagedrc.js  / lint-staged.config.js                 （按 package.json type 判定）
8. lint-staged.config.ts                                     （需 Node 22.6+ TS strip）
9. CLI 显式 --config <path>
```

命中即停止往下找。

## Glob 模式速查（picomatch）

| 模式 | 含义 | 示例匹配 |
|---|---|---|
| `*` | 任意字符（不含 `/`） | `foo`, `bar.js` |
| `**` | 任意路径段（含 `/`） | `a/b/c/d.js` |
| `?` | 单字符 | `a.js` 但不匹配 `ab.js` |
| `[abc]` | 字符集 | `a.js`, `b.js`, `c.js` |
| `{a,b}` | 任一选项 | `a.js`, `b.js` |
| `?(pattern)` | 0 或 1 次匹配 | `*.js?(x)` 匹配 `.js` / `.jsx` |
| `*(pattern)` | 0 或多次 | - |
| `+(pattern)` | 1 或多次 | - |
| `!(pattern)` | 不匹配 | `!(*.test).js` 排除 test 文件 |
| `@(pattern)` | 恰好 1 次 | - |

`/` 的有无决定 matchBase：

- **无 `/`** → matchBase，只看文件名（`*.js` 匹配任意层级）
- **有 `/`** → 路径敏感（`./*.js` 仅匹配根目录）

## 版本兼容性矩阵

| lint-staged | Node.js | Git | YAML 依赖 | 备注 |
|---|---|---|---|---|
| **17.0.x** | **≥ 22.22.1** | **≥ 2.32.0** | optional | 新增 `--hide-all`，原生 parseArgs |
| 16.4.x | ≥ 20 | ≥ 2.13.2 | bundled | picomatch 替代 micromatch |
| 16.0.x | ≥ 20 | ≥ 2.13.2 | bundled | 对象任务（title + task）正式化 |
| 15.x | ≥ 18 | ≥ 2.13.2 | bundled | flat config 适配 |

升级 v16 → v17 检查清单：

- [ ] Node.js 升级到 22.22.1+
- [ ] Git 升级到 2.32.0+（一般无需操作，2021 年版本）
- [ ] 用 YAML 配置的话 `pnpm add yaml`
- [ ] 配置里删掉手动 `git add`（v17 会告警）
- [ ] CI 镜像如果是固定 Node 20，需要升级

## 预定义辅助类型

```ts
import type {
  Configuration,
  Logger,
  PreviousTaskError,
  TaskFn,
  TaskOptions,
} from 'lint-staged';
```

## 与 husky 的连接

```bash
# .husky/pre-commit （v9+ 语法）
pnpm exec lint-staged
```

或加 flag：

```bash
# 调试时
pnpm exec lint-staged --debug

# 严格模式（CI 用）
pnpm exec lint-staged --fail-on-changes --no-revert
```

## 常用片段拷贝即用

### 完整 TS 项目配置

```ts
// lint-staged.config.ts
import type { Configuration } from 'lint-staged';

const config: Configuration = {
  '*.{ts,tsx,js,jsx}': [
    () => 'tsc -p tsconfig.json --noEmit',
    'eslint --fix --no-warn-ignored',
    'prettier --write',
  ],
  '*.{json,md,yaml,yml,css,scss}': 'prettier --write',
  '*.{png,jpg,gif,svg}': 'imagemin-lint-staged',
};

export default config;
```

### Monorepo 根配置

```json
{
  "*": "prettier --write --ignore-unknown"
}
```

子包配置：

```json
{
  "*.{ts,tsx}": ["eslint --fix --no-warn-ignored", "prettier --write"]
}
```

### CI 跑 PR 差异

```yaml
# GitHub Actions
- name: Lint changed files
  run: pnpm exec lint-staged --diff="origin/${{ github.base_ref }}...HEAD"
```

### GitLab CI 跑 MR 差异

```yaml
lint:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  script:
    - pnpm exec lint-staged --diff="origin/$CI_MERGE_REQUEST_TARGET_BRANCH_NAME...HEAD"
```
