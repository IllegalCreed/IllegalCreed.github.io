---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Lerna（9.x，由 Nx 团队维护）· 核于 2026-07

## 速查

- **latest 约 9.0.7**；命令入口 `npx lerna <command>`；配置 `lerna.json`（版本/发布）+ `nx.json`（任务流水线/缓存）。
- **仍在的命令**：`init` / `version` / `publish` / `run` / `exec` / `list` / `changed` / `diff` / `import` / `add-caching` / `repair` / `watch` / `clean` / `create` / `info`。
- **已删命令（v9）**：`bootstrap` / `add` / `link`——改用包管理器 workspaces。
- **版本**：`lerna version [bump]`（不发 npm）；fixed tag `v1.0.0`，independent tag `pkg@1.0.0`。
- **发布**：`lerna publish [from-git|from-package]`；**永远用 npm**；scoped 公开需 `publishConfig.access: "public"`。
- **过滤**：`--scope` / `--since` / `--ignore` / `--include-dependents` / `--no-private`。
- **并发**：`--concurrency` 默认 3；`--stream` / `--parallel` / `--no-bail`。
- **缓存**：`nx.json` 的 `targetDefaults.<t>.cache/inputs/outputs`；`nx reset` 清、`--skip-nx-cache` 跳。
- **流水线**：`dependsOn: ["^build"]`（`^` = 上游依赖们）；`npx lerna add-caching` 生成。
- **`useNx` 默认 `true`**；`false` 回退 legacy（丢缓存/智能并行）。
- **坑速记**：bootstrap 已删 / 发布永远用 npm / private 默认不发 / pnpm 别在 lerna.json 写 packages / GitHub 网页 tag 不识别 / canary 不能配 --build-metadata / schema 有节点 ≠ 命令可用。

## 命令总览（v9 现存）

| 命令 | 作用 |
| --- | --- |
| `lerna init` | 初始化工作区（`--independent` / `--exact` / `--packages`） |
| `lerna version` | 升版本 + changelog + git tag/commit/push（**不发 npm**） |
| `lerna publish` | 发布到 npm（`from-git` / `from-package` / `--canary`） |
| `lerna run <script>` | 在含该脚本的包里跑 npm 脚本（走 Nx） |
| `lerna exec -- <cmd>` | 在每个包里跑任意命令 |
| `lerna list`（别名 `ls`） | 列出工作区的包（`--graph` / `--json`） |
| `lerna changed` | 列出自上次 tag 以来变更的包 |
| `lerna diff` | 显示包的文件差异 |
| `lerna import <path>` | 并入外部仓库并**保留提交历史**（`--flatten` / `--max-buffer`） |
| `lerna add-caching` | 生成/配置 `nx.json` 缓存与流水线 |
| `lerna repair` | 运行迁移，修复常见工作区配置问题 |
| `lerna watch` | 监听文件变化触发任务 |
| `lerna clean` | 删除各包 `node_modules` 等 |
| `lerna create <name>` | 在 monorepo 内新建包骨架 |
| `lerna info` | 打印环境诊断信息（提 issue 用） |
| ~~`bootstrap`~~ / ~~`add`~~ / ~~`link`~~ | **v9 已移除**——改用包管理器 workspaces |

## lerna.json 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `$schema` | string | — | 指向 schema，编辑器补全/校验 |
| `version` | string | `"0.0.0"` | fixed 全仓统一版本；或 `"independent"` 进独立模式 |
| `packages` | string[] | `["packages/*"]` | 包位置 glob；默认复用 workspaces |
| `useNx` | boolean | **`true`** | `false` 回退 legacy runner |
| `npmClient` | `npm`\|`yarn`\|`pnpm` | npm | 声明包管理器；pnpm 会读 `pnpm-workspace.yaml` |
| `command` | object | — | 各命令专属选项（`command.version` / `.publish` / `.run` …） |
| `npmClientArgs` / `concurrency` / `loglevel` / `ignoreChanges` / `changelogPreset` / `tagVersionPrefix` / `private` / `rejectCycles` / `maxBuffer` / `yes` | — | — | 常见根级选项 |
| `scope` / `ignore` / `since` / `includeDependents` / `includeDependencies` / `excludeDependents` | — | — | 过滤类根级选项 |

> **`useWorkspaces` 已废弃/移除**：默认自动识别 workspaces。
> **schema 仍留 `command.bootstrap` / `add` / `link` 节点**，但命令 v9 已删——配置存在 ≠ 命令可用。

## lerna version / publish flags 速查

| Flag | 命令 | 作用 |
| --- | --- | --- |
| `--conventional-commits` | version | 自动定 bump + 生成 CHANGELOG |
| `--changelog-preset` | version | changelog 预设，默认 `angular` |
| `--create-release github\|gitlab` | version | 建 Release（**须配 `--conventional-commits`**） |
| `--force-publish` | version | 强制升号（无视 changed 检测） |
| `--exact` | version | 内部依赖写精确版本 |
| `--allow-branch <glob>` | version | 限定运行分支 |
| `--amend` | version | 改到当前 commit（隐含 `--no-push`） |
| `from-git` | publish | 发已被 tag 的包（不再升号） |
| `from-package` | publish | 发 registry 里缺失版本的包（补发） |
| `--canary` | publish | 发预览版 `1.1.0-alpha.0+<sha>`（不能配 `--build-metadata`） |
| `--dist-tag <tag>` | publish | dist-tag，默认 `latest` |
| `--include-private <pkg\|"*">` | publish | 强制发 private 包 |
| `--otp <code>` | publish | npm 2FA |
| `--yes` | 两者 | 跳过确认（CI 必备） |

## 常见坑速查

1. **`lerna bootstrap` v7 默认移除、v9 彻底删除**——现在用包管理器 `install` + workspaces。
2. **Lerna 发布永远用 npm**：即便 `npmClient: pnpm`，认证仍写 `.npmrc` / `publishConfig`。
3. **scoped 包发公开必须 `publishConfig.access: "public"`**。
4. **`private: true` 默认不发**；`--include-private` 才发。
5. **pnpm 下别在 `lerna.json` 写 `packages`**——只认 `pnpm-workspace.yaml`。
6. **拆分 version/publish 时 `--tag-version-prefix` 两处都要传**，否则 `from-git` 找不到 tag。
7. **GitHub 网页 UI 打的 lightweight tag 不被识别**——手动 tag 用 `git tag -a -m`。
8. **`--canary` 不能与 `--build-metadata` 同用**。
9. **`--create-release` 必须配 `--conventional-commits`**，不可同时 `--no-changelog`。
10. **`useNx: false` 会退回 legacy runner**，丢缓存/智能并行——通常不该关。
11. **只有无副作用、可缓存的任务能被缓存/分布式执行**；打外部 API 的 E2E 不可缓存。
12. **`--parallel` 无视拓扑与并发上限**，适合 watch，但子进程过多可能爆文件描述符——配合 `--scope` 收窄。
13. **fixed 模式 `%s` / `%v` 占位符生效；independent 不替换**。
14. **`lerna.json` schema 有 `command.bootstrap` 等节点但命令已删**——能写 ≠ 能跑。
15. **`lerna import` 遇大量提交/冲突**：用 `--max-buffer`（默认 10MB）/ `--flatten`；工作区有未提交改动会报 `ambiguous argument 'HEAD'`，先 commit。
16. **发布中途失败**：清理重跑（跳过已发）/ `from-git`（复用 tag）/ `from-package`（补缺失版本）。

## 权威链接

- [Lerna 官方文档](https://lerna.js.org/docs/introduction) —— 总入口
- [Lerna 与 Nx](https://lerna.js.org/docs/lerna-and-nx) · [版本矩阵](https://lerna.js.org/docs/lerna-and-nx-version-matrix) —— 维护归属/职责/版本对应
- [版本与发布](https://lerna.js.org/docs/features/version-and-publish) · [运行任务](https://lerna.js.org/docs/features/run-tasks) · [缓存任务](https://lerna.js.org/docs/features/cache-tasks) · [分布式执行](https://lerna.js.org/docs/features/distribute-tasks) —— 四大特性
- [Project Graph](https://lerna.js.org/docs/features/project-graph) · [任务流水线配置](https://lerna.js.org/docs/concepts/task-pipeline-configuration) —— 图与 `dependsOn`
- [lerna.json 配置参考](https://lerna.js.org/docs/api-reference/configuration) · [命令参考](https://lerna.js.org/docs/api-reference/commands) —— 字段/命令全表
- [旧包管理（bootstrap 移除）](https://lerna.js.org/docs/legacy-package-management) · [Lerna 6 过时选项](https://lerna.js.org/docs/lerna6-obsolete-options) —— 迁移/行为变更
- [pnpm 用法](https://lerna.js.org/docs/recipes/using-pnpm-with-lerna) · [FAQ](https://lerna.js.org/docs/faq) · [Troubleshooting](https://lerna.js.org/docs/troubleshooting) —— recipe 与排障
- [GitHub: lerna/lerna](https://github.com/lerna/lerna) · [npm: lerna](https://www.npmjs.com/package/lerna) —— 源码/schema/命令 README 与版本·依赖·维护者佐证
