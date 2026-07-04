---
layout: doc
outline: [2, 3]
---

# 任务运行与 Nx 流水线

> 基于 Lerna（9.x，由 Nx 团队维护）· 核于 2026-07

## 速查

- **`useNx` 默认 `true`**：v6 起 Lerna 默认把任务调度交给 **Nx 的 task runner**；`false` 回退 legacy `p-map` / `p-queue`（丢缓存与智能并行）。
- **`lerna run <script>`**：在每个含该脚本的包里跑 `npm run <script>`，**自动按拓扑序执行 + 并行 + 缓存**。
- **`lerna exec -- <cmd>`**：在每个包里跑任意命令（非 npm 脚本），如 `lerna exec -- rm -rf node_modules`。
- **三术语**：**Command**（你敲的整条命令）／**Target**（npm 脚本名如 `build`）／**Task**（一次具体调用如 `header:build`）。
- **过滤**：`--scope <glob>`（按包名）、`--since <ref>`（受影响包）、`--ignore`、`--include-dependents` / `--include-dependencies`、`--no-private`。
- **多 target**：`lerna run test,build,lint`（逗号分隔，依赖由 Task Pipeline 协调）。
- **并发**：`--concurrency` **默认 3**；`--stream`（前缀化交错输出）、`--parallel`（无视拓扑与并发上限、立即全跑，适合 watch 长跑）。
- **任务流水线写在 `nx.json`** 的 `targetDefaults.<target>.dependsOn`；没有该文件用 `npx lerna add-caching` 生成。
- **`^` 前缀 = 本项目的依赖们**：`"build": {"dependsOn": ["^build"]}` = 先构建所有上游依赖再构建自己；无 `^` 指同一项目内。
- **环境变量**：`lerna exec` 提供 `LERNA_PACKAGE_NAME`、`LERNA_ROOT_PATH`；Nx runner 默认自动加载 `.env`（`--load-env-files=false` 关闭）。
- **v6 起失效**：启用 Nx runner 时 `--sort` / `--no-sort` 失效、`--parallel` 语义变、`--include-dependencies` 多冗余、`--ignore` 不能排除「必需」任务。

## lerna run 与 lerna exec

Lerna 有两条跑任务的命令，都支持同一套过滤 flags：

```bash
# run：跑各包 package.json 里声明的 npm 脚本（不存在则跳过该包）
npx lerna run build
npx lerna run test,build,lint          # 逗号分隔多个 target

# exec：跑任意 shell 命令
npx lerna exec -- rm -rf ./node_modules
npx lerna exec -- npx tsc --noEmit
```

- **run 传参**：给脚本传参用 `--`（注意 yarn 会吞掉一层 `--`，需绕过）。
- **exec 环境变量**：`LERNA_PACKAGE_NAME`（当前包名）、`LERNA_ROOT_PATH`（仓库根路径）。
- **默认走 Nx**：*"Lerna (powered by Nx)"* 会**自动按拓扑序执行、自动并行、缓存结果**；`useNx: false` 时才回退 legacy runner。

## Command / Target / Task 术语

官方定义（原文）：

- **Command**：*"anything the developer types into the terminal"*，如 `lerna run build --scope=header --concurrency=5`。
- **Target**：*"the name of an npm script"*，如 `build`。
- **Task**：*"an invocation of an npm script"*，如 `header:build`（在 `header` 包里跑 `build`）。

理解这三层，才能读懂流水线里「谁依赖谁」——`dependsOn` 描述的是 **target 之间**的关系，调度器据此为具体 **task** 排序。

## 过滤与并发

过滤选项（来自 `@lerna/filter-options`）：

| Flag | 作用 |
| --- | --- |
| `--scope <glob>` | 只跑名字匹配的包（`--scope "toolbar-*"`，可多次） |
| `--since <ref>` | 只跑相对某 git ref **受影响**的包（`--since origin/main`）——CI 提速核心 |
| `--ignore <glob>` | 排除匹配的包 |
| `--include-dependents` / `--exclude-dependents` | 连带 / 排除下游依赖者 |
| `--include-dependencies` | 连带上游依赖 |
| `--no-private` | 跳过 `private: true` 的包 |
| `--continue-if-no-match` | 无匹配包时不报错 |

并发与输出：

| Flag | 作用 |
| --- | --- |
| `--concurrency <n>` | 并发上限，**默认 3** |
| `--stream` | **前缀化交错输出**（实时看到各包日志，带包名前缀） |
| `--parallel` | **无视并发上限与拓扑排序**，立即在所有匹配包上跑——**适合 watch 等长跑进程** |
| `--no-bail` | 某包失败不整体退出 |
| `--no-prefix` | 不加包名前缀 |
| `--profile` | 生成可在 Chromium DevTools 分析的性能图（仅拓扑排序开启时有效） |
| `--npm-client <client>` | 指定包管理器（默认 npm） |

> `--stream` vs `--parallel`：前者管**输出形态**（交错带前缀），后者管**调度策略**（不排序、不限并发）。watch / dev server 这类长跑任务用 `--parallel`，但大量子进程可能爆文件描述符，建议配合 `--scope` 收窄。

## 任务流水线配置（nx.json）

任务之间的依赖关系写在 `nx.json` 的 `targetDefaults`；没有该文件时用 `npx lerna add-caching` 生成：

```json
{
  "targetDefaults": {
    "build": { "dependsOn": ["^build", "prebuild"] },
    "test":  { "dependsOn": ["build"] }
  }
}
```

- **`^` 前缀 = 「本项目的依赖们」**：`"build": {"dependsOn": ["^build"]}` 表示**先构建所有上游依赖，再构建自己**。
- **无 `^` = 同一项目内**：`"test": {"dependsOn": ["build"]}` 表示先跑**同一个包**的 `build` 再跑 `test`。
- 调度器在满足这些约束前提下**尽量并行**（不必等所有包 build 完才开始 test）。
- **单项目覆盖**：在某个包 `package.json` 的 `nx.targets` 字段里写自己的 `dependsOn`。
- **提并发**：`lerna run build --concurrency=5`。

## v6 起失效 / 语义变化的选项

启用 Nx runner（存在带 `targetDefaults` 的 `nx.json`，或包 `package.json` 有 `nx` 字段）时，一批 legacy 选项**失效或改变语义**：

| 选项 | 变化 |
| --- | --- |
| `--sort` / `--no-sort` | **失效**——Lerna 总按任务图判断的正确顺序执行 |
| `--parallel` | 不再是「强制全并行」语义——Lerna 用任务图自动决定可并行项；控上限改用 `--concurrency` |
| `--include-dependencies` | 大多**冗余**——需要时会自动先跑依赖任务 |
| `--ignore` | **不能排除**任务图认定为「必需」的任务 |

> 仅当 `useNx: false`（回退 legacy runner）时才保留旧行为。这也是升级到 v6+ 后 CI 脚本行为「变了」的常见根因。
