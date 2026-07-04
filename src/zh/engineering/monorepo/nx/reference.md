---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Nx（20/21.x）· 核于 2026-07。`nx.json`/`project.json` 的完整机读 schema 见 [nrwl/nx 仓库](https://github.com/nrwl/nx)。

## 速查

- **建仓/接入**：`create-nx-workspace@latest`、`nx init`、`nx add <plugin>`
- **跑任务**：`nx <target> <project>`、`nx run-many -t <t...> -p <p...>`、`nx affected -t <t...>`
- **看图/查配置**：`nx graph`、`nx show project <p> --web`、`nx show projects`
- **升级/发布**：`nx migrate latest` → `nx migrate --run-migrations`；`nx release --dry-run`
- **缓存运维**：`nx reset`（清本地缓存/守护进程）、`--skip-nx-cache`（临时跳过）
- **两层配置**：`nx.json`（工作区）+ `project.json`/`package.json#nx`（项目）
- **优先级**：插件推断 < `targetDefaults` < 项目级配置
- **targetDefaults 键**：`${executor}` 优先于 `${targetName}`，只取 1 条；支持 glob 键
- **inputs 类型**：文件集、`{env}`、`{runtime}`、`{externalDependencies}`、`{dependentTasksOutputFiles}`
- **本地缓存**：默认 `.nx/cache`；`maxCacheSize` 默认「磁盘 10%，≤10GB」，7 天未访问即清
- **远程能力**：Nx Replay（远程缓存）+ Nx Agents（分布式），经 `nx connect` 接入 Nx Cloud

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npx create-nx-workspace@latest` | 脚手架新工作区（选 preset） |
| `nx init` | 把 Nx 加入已有仓库 |
| `nx add <plugin>` | 安装插件并对齐版本（如 `nx add @nx/vite`） |
| `nx <target> <project>` | 跑单项目单 target（如 `nx build app`） |
| `nx run <project>:<target>[:<config>]` | `run` 的完整形式（可带 configuration） |
| `nx run-many -t <t...> [-p <p...>]` | 跑多项目多 target，`-p` 限定项目 |
| `nx affected -t <t...>` | 只跑受影响项目；`--base` / `--head` / `--files` 控制范围 |
| `nx graph [--focus=<p>] [--file=out.html]` | 交互式项目依赖图 |
| `nx show project <p> --web` | 查看项目最终生效配置与来源 |
| `nx show projects` | 列出全部项目（支持过滤） |
| `nx watch --all -- <cmd>` | 监听变更触发命令 |
| `nx release [--dry-run] [--first-release]` | 版本 + changelog + 发布 |
| `nx migrate latest` | 更新依赖并生成 `migrations.json` |
| `nx migrate --run-migrations` | 执行 `migrations.json` 中的代码/配置迁移 |
| `nx sync` / `nx sync:check` | 运行/校验 sync generators |
| `nx reset` | 清空本地缓存与守护进程状态 |
| `nx report` | 打印 Nx 与插件版本（提 issue 用） |
| `nx list [plugin]` | 列出已装/可用插件及其能力 |
| `nx connect` | 连接 Nx Cloud（远程缓存/分布式） |
| `nx-cloud start-ci-run --distribute-on="..."` | CI 中开启 Nx Agents 分布式执行 |

## `nx.json` 关键字段

| 字段 | 说明 |
| --- | --- |
| `plugins` | 注册插件（字符串或 `{ plugin, options, include, exclude }`），驱动任务推断 |
| `targetDefaults` | 跨项目的 target 默认（`dependsOn`/`inputs`/`outputs`/`cache`/`options`…）；键按 executor 优先、支持 glob |
| `namedInputs` | 命名输入集（约定 `default`/`production`/`sharedGlobals`）；与项目配置**合并** |
| `parallel` | 最大并行 target 数（CLI `--parallel=N` 可覆盖，默认 3） |
| `cacheDirectory` | 本地缓存目录（默认 `.nx/cache`） |
| `maxCacheSize` | 本地缓存上限（默认「磁盘 10%，≤10GB」；`"0"` 不限；`NX_MAX_CACHE_SIZE` 可覆盖） |
| `defaultBase` | `affected` 的默认比较基线（默认 `main`） |
| `release` | 配置 `nx release`（`projects`/`projectsRelationship`/`releaseTagPattern`/`version`/`changelog`/`git`/`docker`） |
| `sync` | `nx sync` 全局配置（`applyChanges`/`globalGenerators`/`disabledTaskSyncGenerators`…） |
| `generators` | 生成器默认选项（如 `@nx/js:library` 的 `buildable: true`） |
| `tui` | 交互式 Terminal UI（`enabled`/`autoExit`），Nx 21 默认开启 |
| `nxCloudId` | 连接 Nx Cloud 的工作区标识 |
| `extends` | 继承预设（如 `nx/presets/npm.json`） |
| `useInferencePlugins` | 设 `false` 关闭任务推断 |

## `project.json` / `package.json`（`nx`）关键字段

**target 级**（写在 `targets.<name>` 下）：

| 字段 | 说明 |
| --- | --- |
| `executor` + `options` + `configurations` | 显式指定执行器与选项/配置切换（如 `@nx/js:tsc`） |
| `command` | 简写：用 `nx:run-commands` 跑一条命令 |
| `cache` | `true` 开启缓存（Nx 17+） |
| `inputs` / `outputs` | 缓存输入/输出（`inputs` 会**替换** nx.json 同名） |
| `dependsOn` | 任务依赖（`^build`/`build`/对象语法/通配符） |
| `parallelism` | `false` 表示该 target 不与他人并行（仅限单机，19.5+） |
| `continuous` | `true` 标记常驻任务，下游不等其退出（21+） |
| `syncGenerators` | 运行前触发的 sync 生成器（19.8+） |
| `metadata` | 附加描述等元信息 |

**项目级**：

| 字段 | 说明 |
| --- | --- |
| `tags` | 项目标签，供 module boundaries 约束 |
| `implicitDependencies` | 手动增删依赖（minimatch，`!` 移除、支持 glob） |
| `namedInputs` | 项目级命名输入（覆盖同名工作区定义） |
| `release` | 项目级 release 覆盖（如 Docker `repositoryName`，实验性） |
| `includedScripts` | 限定哪些 `package.json` scripts 被当作 Nx target |
| `metadata` | 项目描述等元信息 |

## `inputs` 类型速查

| 写法 | 含义 |
| --- | --- |
| `"{projectRoot}/**/*"` | 本项目文件集（`{workspaceRoot}` 只能开头；`{projectName}` 可插值） |
| `"!{projectRoot}/**/*.spec.ts"` | `!` 排除匹配文件 |
| `"^production"` | `^` 作用于**依赖项目**的输入集 |
| `{ "env": "API_KEY" }` | 纳入环境变量的值 |
| `{ "runtime": "node --version" }` | 纳入某命令输出（工具版本等；须跨平台） |
| `{ "externalDependencies": ["jest"] }` | 纳入指定外部依赖版本（不写则默认纳入全部） |
| `{ "dependentTasksOutputFiles": "**/*.d.ts", "transitive": true }` | 纳入依赖任务产出的文件（可含传递依赖） |

## 坑速查

- **targetDefaults 只取 1 条**：executor 键优先于名称键；想两种键都生效，`inputs`/`outputs` 需在两处都写。
- **namedInputs 合并，inputs 替换**：项目里重定义某 target 的 `inputs` 会整体覆盖 nx.json 同名，别期望「叠加」。
- **outputs 漏声明 = 假命中**：产物落在非默认目录却没声明，命中时不会被恢复。
- **推断看不见配置**：`inferred tasks` 无显式文件，排查一律 `nx show project <p> --web`。
- **禁用缓存会禁用分布式**：关了某 target 的缓存，它及其下游无法用 Nx Agents。
- **Nx 21 release 破坏性变更**：`generatorOptions` 上提顶层、`packageRoot`→`manifestRootsToUpdate`；过渡期可 `useLegacyVersioning: true`（v22 移除）。
- **版本务必同步**：`nx` 与 `@nx/*` 必须同版本；升级走 `nx migrate`、加插件走 `nx add`，勿手改版本号。
- **单花括号 token 不是 mustache**：`{projectRoot}`、`{version}` 等是 Nx 插值，与 Vue 的双花括号插值 <code v-pre>{{ }}</code> 无关，勿混淆。
- **prebuild 反模式**：用脚本手动触发上游构建 → 应把上游加入依赖、让 `dependsOn: ["^build"]` 接管编排。

## 参考链接

- [Nx 官方文档](https://nx.dev)
- [nrwl/nx（GitHub）](https://github.com/nrwl/nx)
- [`nx.json` 参考](https://nx.dev/reference/nx-json)
- [项目配置参考](https://nx.dev/reference/project-configuration)
- [Inputs 与 Named Inputs](https://nx.dev/reference/inputs)
- [命令参考](https://nx.dev/reference/commands)
- [Mental Model（心智模型）](https://nx.dev/concepts/mental-model)
- [Project Crystal（任务推断）](https://nx.dev/concepts/inferred-tasks)
- [插件 registry](https://nx.dev/plugin-registry)
- [Nx Cloud](https://nx.dev/nx-cloud)
