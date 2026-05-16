---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Turborepo v2.9.x 编写。完整 schema 见 [turbo.build/schema.json](https://turbo.build/schema.json)。

## CLI 全命令

### `turbo run <task>` / `turbo <task>`

```bash
turbo run build [task...] [flags]
```

| Flag                       | 类型       | 默认       | 说明                                                          |
| -------------------------- | ---------- | ---------- | ------------------------------------------------------------- |
| `--filter`                 | `string[]` | -          | 包过滤（多次可叠加）                                          |
| `--affected`               | -          | -          | 仅跑相对 main 改动过的包                                      |
| `--cache`                  | `string`   | `'local,remote'` | 缓存策略：`'local'` / `'remote'` / `'local,remote'`     |
| `--no-cache`               | -          | -          | 禁用所有缓存                                                  |
| `--no-daemon`              | -          | -          | 禁用 daemon 模式                                              |
| `--no-update-notifier`     | -          | -          | 禁用更新提示                                                  |
| `--cache-dir`              | `string`   | `node_modules/.cache/turbo` | 本地缓存目录                                  |
| `--concurrency`            | `string`   | `'10'`     | 并发数（数字或百分比）                                        |
| `--continue`               | -          | -          | 某任务失败后继续跑其它                                        |
| `--cwd`                    | `string`   | -          | 指定工作目录                                                  |
| `--dry-run`                | `'json'?`  | -          | 干跑：列出会跑的任务但不执行                                  |
| `--env-mode`               | `'strict'/'loose'` | `'strict'` | env 模式                                                |
| `--force`                  | -          | -          | 强制 MISS（忽略缓存）                                         |
| `--framework-inference`    | `boolean`  | `true`     | 自动识别框架（Next.js/Vite 等）补全 env / outputs            |
| `--global-deps`            | `string[]` | -          | 临时追加全局依赖                                              |
| `--graph`                  | `string?`  | -          | 输出任务图（HTML/PNG/DOT）                                   |
| `--ignore`                 | `string[]` | -          | (已废弃) 改用 `--filter=!pkg`                                |
| `--include-dependencies`   | -          | -          | (已废弃) 等价 `...pkg`                                       |
| `--log-prefix`             | `string`   | `'auto'`   | 日志前缀：`'auto'`/`'none'`/`'task'`                         |
| `--log-order`              | `'stream'/'grouped'` | `'auto'` | 日志输出顺序                                          |
| `--no-deps`                | -          | -          | (已废弃) 等价 `--filter=pkg`（仅本包）                       |
| `--only`                   | -          | -          | 仅本任务（不跑依赖任务）                                      |
| `--output-logs`            | `string`   | `'full'`   | `'full'`/`'hash-only'`/`'new-only'`/`'errors-only'`/`'none'` |
| `--parallel`               | -          | -          | 全并行（无视 dependsOn，慎用）                               |
| `--profile`                | `string`   | -          | 输出 Chrome trace 性能分析文件                               |
| `--remote-cache-timeout`   | `number`   | `30`       | 远程缓存超时秒数                                              |
| `--single-package`         | -          | -          | 单包仓库（非 monorepo）                                       |
| `--summarize`              | `string?`  | -          | 输出运行摘要 JSON                                            |
| `--telemetry`              | -          | -          | 显示遥测开关状态                                              |
| `--token`                  | `string`   | -          | 远程缓存 token                                               |
| `--team`                   | `string`   | -          | Vercel 团队 slug                                             |
| `--ui`                     | `'tui'/'stream'` | `'tui'` | 终端 UI                                                  |
| `--verbosity`              | `0-2`      | `0`        | 详细日志级别                                                  |

### `turbo prune <package>`

```bash
turbo prune @acme/web [flags]
```

| Flag        | 说明                                                    |
| ----------- | ------------------------------------------------------- |
| `--docker`  | Docker 友好输出（拆分 json/full 目录）                 |
| `--out-dir` | 输出目录，默认 `./out`                                  |

### `turbo watch <task>`

```bash
turbo watch dev
```

监听文件变化，按依赖图重跑任务。`persistent + interruptible` 任务才会重启。

### `turbo login` / `turbo logout` / `turbo link` / `turbo unlink`

```bash
turbo login                  # 浏览器登录 Vercel
turbo login --manual         # 手动指定 token
turbo link                   # 关联当前 monorepo 到 team
turbo unlink                 # 解除关联
```

### `turbo telemetry`

```bash
turbo telemetry status
turbo telemetry enable
turbo telemetry disable
```

### `turbo bin`

```bash
turbo bin   # 输出 turbo 可执行文件路径
```

### `turbo --version`

输出版本号。

## `turbo.json` Schema

### 顶层字段

```ts
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui" | "stream",
  "globalDependencies": string[],
  "globalEnv": string[],
  "globalPassThroughEnv": string[],
  "tasks": Record<string, TaskConfig>,
  "remoteCache": {
    "signature": boolean,
    "enabled": boolean,
    "preflight": boolean,
    "apiUrl": string,
    "loginUrl": string,
    "teamId": string,
    "teamSlug": string,
  },
  "experimentalSpaces": { ... },  // 已废弃
  "futureFlags": Record<string, boolean>
}
```

### `tasks.<name>` 字段

```ts
{
  "dependsOn": string[],          // "^build" / "build" / "@pkg#task"
  "env": string[],                 // 进 hash 且任务可见
  "passThroughEnv": string[],      // 任务可见但不进 hash
  "inputs": string[],              // 影响 hash 的输入 glob
  "outputs": string[],             // 产物路径 glob
  "cache": boolean,                // 是否缓存（默认 true）
  "persistent": boolean,           // 长跑任务（dev server）
  "interruptible": boolean,        // watch 模式可重启
  "outputLogs": "full" | "hash-only" | "new-only" | "errors-only" | "none",
  "with": string[]                 // sibling tasks（v2.5+）
}
```

### Package Configurations

```json
// packages/web/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "env": ["$TURBO_EXTENDS$", "EXTRA_VAR"],
      "outputs": [".next/**"]
    }
  }
}
```

- `extends` 必须是 `["//"]`（继承根）
- 字符串字段被替换
- 数组字段默认替换，首元素 `$TURBO_EXTENDS$` 时追加
- 不能覆盖 `globalEnv` / `globalDependencies`

### 路径占位符

| 占位符               | 替换为                                                  |
| -------------------- | ------------------------------------------------------- |
| `$TURBO_DEFAULT$`    | 默认 `inputs`（Git 跟踪的包内所有文件）               |
| `$TURBO_ROOT$`       | repo 根目录                                            |
| `$TURBO_EXTENDS$`    | 继承字段时的"追加"占位（仅 Package Configurations）  |

## 环境变量

### Turborepo 自身

| 变量                                  | 作用                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| `TURBO_TOKEN`                         | 远程缓存 token                                          |
| `TURBO_TEAM`                          | Vercel 团队 slug                                        |
| `TURBO_API`                           | 远程缓存 API URL                                        |
| `TURBO_REMOTE_CACHE_TIMEOUT`          | 远程缓存超时（秒）                                      |
| `TURBO_REMOTE_CACHE_SIGNATURE_KEY`    | HMAC-SHA256 签名密钥                                    |
| `TURBO_FORCE`                         | `1` 强制 MISS                                          |
| `TURBO_NO_UPDATE_NOTIFIER`            | 禁用版本更新提示                                        |
| `TURBO_CACHE_DIR`                     | 本地缓存目录                                            |
| `TURBO_RUN_SUMMARY`                   | `1` 输出摘要                                            |
| `TURBO_TELEMETRY_DISABLED`            | `1` 禁用遥测                                           |
| `TURBO_SCM_BASE`                      | `--affected` 的基准 git ref（默认 `main`）            |
| `TURBO_SCM_HEAD`                      | `--affected` 的 HEAD ref（默认 `HEAD`）               |
| `TURBO_HASH_LOGS`                     | `1` 输出每个任务的详细 hash 来源                       |
| `TURBO_LOG_VERBOSITY`                 | `0` / `1` / `2`                                        |
| `TURBO_PRINT_VERSION_DISABLED`        | 禁用启动时版本打印                                      |

### 任务可见的环境变量

由配置决定：

| 来源                  | 影响 hash | 任务可见 |
| --------------------- | --------- | -------- |
| `env: [...]`          | ✓         | ✓        |
| `globalEnv: [...]`    | ✓ 全任务   | ✓ 全任务 |
| `passThroughEnv`      | ✗         | ✓        |
| `globalPassThroughEnv`| ✗         | ✓ 全任务 |
| 未声明（strict 模式） | ✗         | ✗        |

framework inference 自动加入的前缀（无需手写）：

| 框架       | 自动包含的 env 前缀                       |
| ---------- | ----------------------------------------- |
| Next.js    | `NEXT_PUBLIC_*` / `NEXT_RUNTIME` 等       |
| Vite       | `VITE_*`                                  |
| Astro      | `PUBLIC_*`                                |
| Remix      | `REMIX_*`                                 |
| Gatsby     | `GATSBY_*`                                |
| Create React App | `REACT_APP_*`                       |
| Vue CLI    | `VUE_APP_*`                               |
| SvelteKit  | `PUBLIC_*` / `VITE_*`                     |

关闭推断：`--framework-inference=false`。

## 过滤语法表

| 语法                              | 含义                                                  |
| --------------------------------- | ----------------------------------------------------- |
| `--filter=@acme/web`              | 仅这个包                                              |
| `--filter='@acme/*'`              | 名字匹配前缀                                          |
| `--filter='!@acme/internal'`      | 排除该包                                              |
| `--filter='...@acme/web'`         | 该包 + 上游依赖                                       |
| `--filter='@acme/web...'`         | 该包 + 下游依赖                                       |
| `--filter='@acme/web...^'`        | 仅下游（不含本包）                                    |
| `--filter='./apps/*'`             | 路径匹配                                              |
| `--filter='[origin/main]'`        | 相对 main 变更的包                                    |
| `--filter='[HEAD~1...HEAD]'`      | 范围 git ref 之间变更的包                            |
| `--filter='[origin/main]...'`     | 变更包 + 它们的下游                                  |
| `--filter='...{[main]}'`          | (v2.5+) 上游 + 变更                                  |

多个 `--filter` 累加（OR 关系）：

```bash
turbo run build --filter=@acme/web --filter=@acme/admin
```

## 任务运行行为

### Persistent / Interruptible 决策

| 任务类型              | persistent | interruptible | 用途                                |
| --------------------- | ---------- | ------------- | ----------------------------------- |
| `build` / `lint` / `test` | false  | -             | 一次性                              |
| `dev`（dev server）   | true       | true          | watch 时改 dependency 重启 server |
| `tsc --watch`         | true       | false         | watch 时不希望重启                  |
| `storybook dev`       | true       | true          | -                                   |
| 单次 `tsc`            | false      | -             | -                                   |

### Cache 默认 vs `cache: false`

| 任务类型              | cache 默认 | 备注                              |
| --------------------- | ---------- | --------------------------------- |
| `build`               | true       | -                                 |
| `test`                | true       | 输出 coverage 时声明 outputs    |
| `lint`                | true       | 无 outputs（只缓存 log）         |
| `dev`                 | -          | 必须 `cache: false`              |
| `deploy`              | -          | 通常 `cache: false`（每次必跑） |
| `start`               | -          | `cache: false` + `persistent: true` |

## 缓存命中率诊断

### `--dry-run`

```bash
turbo run build --dry-run=json | jq '.tasks[] | {task, cacheStatus, inputs}'
```

输出：

```json
{
  "task": "web#build",
  "cacheStatus": "HIT" | "MISS",
  "inputs": {
    "apps/web/src/page.tsx": "a1b2c3...",
    "apps/web/package.json": "d4e5f6..."
  }
}
```

### `--summarize`

```bash
turbo run build --summarize=summary.json
cat summary.json | jq '.execution.attempted, .execution.cached'
```

### `--graph`

```bash
turbo run build --graph=graph.html
open graph.html
```

可视化任务依赖图，定位「为何 X 任务等了好久」。

## 与流行框架集成

### Next.js

`turbo.json`:

```json
{
  "tasks": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "interruptible": true
    },
    "start": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["build"]
    }
  }
}
```

Next.js 14+ Standalone 模式时 outputs 加 `".next/standalone/**"`。

### Vite

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"]
    },
    "preview": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["build"]
    }
  }
}
```

### Nuxt 3

```json
{
  "tasks": {
    "build": {
      "outputs": [".output/**", ".nuxt/**"],
      "env": ["NUXT_*"]
    }
  }
}
```

### Vitest

```json
{
  "tasks": {
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": ["build"]
    }
  }
}
```

### Playwright

```json
{
  "tasks": {
    "test:e2e": {
      "outputs": ["playwright-report/**", "test-results/**"],
      "dependsOn": ["build"]
    }
  }
}
```

### tsc

```json
{
  "tasks": {
    "typecheck": {
      "outputs": [".tsbuildinfo"],
      "dependsOn": ["^typecheck"]
    }
  }
}
```

注意把 `.tsbuildinfo` 加入 outputs，否则 incremental 编译无法缓存。

## 调试 `turbo.json`

```bash
# JSON Schema 校验（VS Code 装 vscode-json 自动校验）
{
  "$schema": "https://turbo.build/schema.json"
}

# 命令行校验（无内置 lint，借 jq）
cat turbo.json | jq '.'
```

VS Code 加 schema 校验：

```jsonc
// settings.json
{
  "json.schemas": [
    {
      "fileMatch": ["turbo.json"],
      "url": "https://turbo.build/schema.json"
    }
  ]
}
```

## Codemod 工具

```bash
# 显示所有可用 codemod
pnpm dlx @turbo/codemod list

# 跑某个 codemod
pnpm dlx @turbo/codemod <name>

# 升级到目标版本（包含多个 codemod）
pnpm dlx @turbo/codemod migrate [version]
```

| codemod                              | 作用                                                  |
| ------------------------------------ | ----------------------------------------------------- |
| `migrate`                            | 自动跑当前 → 目标版本之间所有 codemod                |
| `rename-pipeline`                    | v1 `pipeline` → v2 `tasks`                           |
| `set-default-outputs`                | 根据任务名补默认 outputs                              |
| `transform-env-literals-to-wildcards`| `["FOO_BAR_BAZ_API_URL"]` → `["FOO_BAR_BAZ_*"]`     |
| `clean-globs`                        | 修正反斜杠等 glob 错误                                |
| `add-package-manager`                | 给根 package.json 加 `packageManager` 字段           |
| `stabilize-env-mode`                 | `--env-mode=infer/loose` 改为 strict                  |
| `add-package-names`                  | 把 anonymous 包加上 `name` 字段                       |

## 性能基线

参考数字（M2 MacBook Pro，10 包 monorepo）：

| 操作                              | 耗时              |
| --------------------------------- | ----------------- |
| `turbo run build` 全 MISS         | ~30s（看 build 自身） |
| `turbo run build` 全 HIT          | 0.5-2s            |
| `turbo run build --filter=@acme/web --dry-run` | <100ms |
| `turbo run build --graph`         | 1-3s              |
| Remote cache download             | 网络 + 解压（~5s for 100MB） |
| `turbo prune --docker`            | 2-5s              |

## ESLint Config (`eslint-config-turbo`)

```bash
pnpm add -D eslint-config-turbo
```

flat config:

```ts
import turboConfig from "eslint-config-turbo/flat";

export default [
  ...turboConfig,
  // 项目自定义规则
];
```

包含的规则：

| 规则                                  | 作用                                          |
| ------------------------------------- | --------------------------------------------- |
| `turbo/no-undeclared-env-vars`        | 用了 `process.env.X` 但 `X` 未在 turbo.json 声明 → error |

## 与其它工具对比速查

| 工具          | 定位                       | 是否本仓库适配           |
| ------------- | -------------------------- | ------------------------ |
| **Turborepo** | Monorepo 任务调度 + 缓存   | -（本主题）              |
| Nx            | 同上 + 项目生成 + 插件     | 配置更复杂              |
| Lerna         | 包管理（已不活跃）         | 建议迁 Turbo 或 Nx       |
| Rush          | Microsoft 的 monorepo 方案 | 适合超大 monorepo        |
| Bazel         | Google 通用构建系统        | 学习曲线极陡             |
| Moon          | 较新的 monorepo 工具       | Rust 实现，配置 YAML     |
| Bit           | 组件级 monorepo            | 强调组件复用             |

## 参考链接

- [Turborepo 官方文档](https://turborepo.com/)
- [Schema](https://turbo.build/schema.json)
- [GitHub](https://github.com/vercel/turborepo)
- [Templates](https://github.com/vercel/turborepo/tree/main/examples)
- [Discord 社区](https://vercel.com/discord)
- [`@turbo/codemod`](https://www.npmjs.com/package/@turbo/codemod)
- [`eslint-config-turbo`](https://www.npmjs.com/package/eslint-config-turbo)
