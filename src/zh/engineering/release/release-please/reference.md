---
layout: doc
outline: [2, 3]
---

# 参考：配置 / CLI / Action / 坑速查

> 基于 release-please · 核于 2026-07

## 速查

- **两文件**：`release-please-config.json`（配置）+ `.release-please-manifest.json`（各包当前版本）。
- **接入**：`googleapis/release-please-action@v4`（Actions）或 `release-please` CLI（`npm i release-please -g`）。
- **权限**：`contents: write` + `pull-requests: write`（+ 需要标签时 `issues: write`）。
- **版本推断**：`fix`→patch、`feat`→minor、`feat!:`/`BREAKING CHANGE`→major；`Release-As: x.y.z` 覆盖。
- **发布闸门**：合并 Release PR 才打 tag/建 Release；输出 `release_created` 门控后续发包。
- **monorepo**：`packages` 映射路径→配置；`separate-pull-requests` 切换组合/独立 PR；tag 默认 `<component>-vX.Y.Z`。
- **标签**：`autorelease: pending` → `tagged` → `published`；卡住加 `release-please: force-run`。
- **默认可见 changelog 类型**：`feat`/`fix`/`perf`/`deps`/`revert`；其余默认 `hidden`。
- **默认 `GITHUB_TOKEN` 不触发下游工作流** → 需要时换 PAT / GitHub App token。
- **调试**：CLI `--dry-run` + `--debug`；只支持 GitHub 平台。

## 一、release-please-config.json 顶层字段

| 字段 | 含义 |
| --- | --- |
| `packages` | **必填**。路径 → 包配置 的映射；`"."` 表示仓库根 |
| `release-type` | 默认 release type（默认 `node`），各包可覆盖 |
| `plugins` | 插件数组：`node-workspace` / `cargo-workspace` / `maven-workspace` / `linked-versions` / `sentence-case` / `group-priority` |
| `separate-pull-requests` | `true` = 每包独立 Release PR；默认 `false` = 组合成一个 |
| `include-component-in-tag` | `false` 时 tag 从 `<component>-vX.Y.Z` 变为 `vX.Y.Z` |
| `group-pull-request-title-pattern` | 组合 PR 的标题模板 |
| `bump-minor-pre-major` | <1.0.0 时破坏性变更只升 minor |
| `bump-patch-for-minor-pre-major` | <1.0.0 时 feat 只升 patch |
| `versioning-strategy` | `default`/`always-bump-patch`/`always-bump-minor`/`always-bump-major`/`service-pack`/`prerelease` |
| `release-as` | 手动锁定版本（合并后应删除） |
| `prerelease-type` | 预发布标识（如 `beta`） |
| `changelog-sections` | 提交类型 → changelog 分区 的映射（含 `hidden`） |
| `changelog-host` | changelog 链接的 GitHub 域名（默认 `https://github.com`） |
| `include-commit-authors` | changelog 条目附作者名 |
| `draft` / `prerelease` | 建草稿 / 预发布 Release |
| `skip-github-release` / `skip-changelog` | 跳过建 Release / 跳过 changelog |
| `bootstrap-sha` / `last-release-sha` | 限定初始 changelog 起点 / 覆盖上次发布标记 |
| `always-update` | release notes 未变也强制刷新 PR |
| `extra-files` | 额外需要写回版本号的文件（支持 JSON/XML/YAML/TOML/generic） |

## 二、packages 内的每包配置

| 字段 | 含义 |
| --- | --- |
| `release-type` | 覆盖默认 release type（该包用哪种语言策略） |
| `package-name` | 包名；对无源码可查名字的类型（如 python）必填 |
| `changelog-path` | changelog 路径（相对包目录，默认 `CHANGELOG.md`） |
| `changelog-host` | 该包 changelog 的 GitHub 域名覆盖 |
| `exclude-paths` | 从该包变更判定中排除的子目录 |
| `release-as` | 该包版本覆盖；设为 `""` 则显式恢复用 Conventional Commits |
| `draft` / `prerelease` | 该包的 Release 设置 |

## 三、内置 release type（多语言）

`bazel`、`dart`、`elixir`、`go`、`helm`、`java`（及 `maven`）、`krm-blueprint`、`node`、`expo`、`ocaml`、`php`、`python`、`r`、`ruby`、`rust`、`sfdx`、`terraform-module`、`simple` 等（20+）。`simple` 只维护版本文件与 changelog、不绑定特定语言的清单格式。

## 四、CLI 命令

安装：`npm i release-please -g`。全局必填 `--token`（repo 写权限）与 `--repo-url`（`<owner>/<repo>`）。

| 命令 | 作用 |
| --- | --- |
| `release-please bootstrap` | 生成 config + manifest 两文件并开初始化 PR |
| `release-please release-pr` | 创建/更新 Release PR |
| `release-please github-release` | 从已合并的 Release PR 创建 tag / GitHub Release |
| `release-please manifest-pr` | **已废弃**，功能并入 `release-pr` |
| `release-please manifest-release` | **已废弃**，功能并入 `github-release` |

常用 flag：`--release-type`、`--target-branch`、`--config-file`（默认 `release-please-config.json`）、`--manifest-file`（默认 `.release-please-manifest.json`）、`--path`（默认 `.`）、`--initial-version`（默认 `0.0.0`）、`--dry-run`、`--debug` / `--trace`、`--draft-pull-request`。

```bash
# 初始化 manifest（node monorepo）
release-please bootstrap \
  --token=$GITHUB_TOKEN \
  --repo-url=owner/repo \
  --release-type=node

# 干跑：看它打算创建/更新什么，不落地
release-please release-pr \
  --token=$GITHUB_TOKEN \
  --repo-url=owner/repo \
  --release-type=node \
  --dry-run --debug
```

## 五、release-please-action 输入/输出

**常用 inputs**（`googleapis/release-please-action@v4`）：

| input | 含义 |
| --- | --- |
| `token` | GitHub token，默认 `secrets.GITHUB_TOKEN`；需触发下游工作流时换 PAT/App token |
| `release-type` | 语言策略（node/python/go/rust…）；用 manifest 时可省 |
| `config-file` | 配置文件路径，默认 `release-please-config.json` |
| `manifest-file` | manifest 文件路径，默认 `.release-please-manifest.json` |
| `target-branch` | Release PR 针对的分支，默认自动识别 |
| `path` | 从仓库子目录发布 |
| `skip-github-release` / `skip-github-pull-request` | 跳过建 Release / 跳过建 PR |
| `include-component-in-tag` | monorepo tag 前缀开关 |

**常用 outputs**：`release_created`、`releases_created`、`prs_created`、`tag_name`、`version` / `major` / `minor` / `patch`、`sha`、`body`、`upload_url`、`html_url`、`paths_released`、`pr` / `prs`。monorepo 下还有按路径前缀的输出（如 <code v-pre>packages/foo--release_created</code>）。

## 六、autorelease 标签生命周期

| 标签 | 含义 |
| --- | --- |
| `autorelease: pending` | Release PR 待发布（默认「pending」标签，可用 `--label` 改） |
| `autorelease: tagged` | 已打 tag（默认「release」标签，可用 `--release-label` 改） |
| `autorelease: published` | GitHub Release 已发布 |
| `autorelease: snapshot` | 快照发布状态 |
| `autorelease: closed` | PR 被关闭；reopen 不会自动重跑 |
| `release-please: force-run` | 手动强制 release-please 重新处理 |

## 七、默认 changelog 分区

默认展示 `feat`(Features)、`fix`(Bug Fixes)、`perf`(Performance Improvements)、`deps`(Dependencies)、`revert`(Reverts)；默认 `hidden` 的有 `docs`、`style`、`chore`、`refactor`、`test`、`build`、`ci`。改 `changelog-sections` 里对应类型的 `hidden` 即可增删。注意：**默认可见的类型 ≈ 会推进版本的类型**——只提交 `docs`/`chore` 不会产生 Release PR。

## 八、常见坑速查

| 现象 | 原因 / 解法 |
| --- | --- |
| 一直没有 Release PR | 自上次发布起只有 `docs`/`chore` 等非发版提交；或提交信息不符合 Conventional Commits |
| Release PR 上没有 CI 检查 | 默认 `GITHUB_TOKEN` 不触发下游工作流 → 换 PAT / GitHub App token |
| tag 事件没触发别的工作流 | 同上，默认 token 的循环防护 → 换 PAT / App token |
| 合并 PR 后没发布 | 合并后需再有一次运行来打 tag/建 Release；检查工作流是否被合并 push 触发 |
| 版本号不对 / 想指定版本 | 提交 body 写 `Release-As: x.y.z`，或配置 `release-as`（合并后删） |
| 0.x 项目破坏性变更直接跳 1.0 | 设 `bump-minor-pre-major: true`（+ `bump-patch-for-minor-pre-major`） |
| monorepo tag 撞车 | 保留 `include-component-in-tag: true`（默认），让 tag 带包前缀 |
| PR 被误关无法恢复 | 移除 `autorelease: closed`，加 `autorelease: pending` + `release-please: force-run` |
| 想本地验证配置 | CLI `--dry-run --debug`（用真实分支而非 fork，fork 不复制 tag/release） |
| 非 GitHub 平台想用 | 不支持；GitLab/Bitbucket 请选 semantic-release 等 |

## 九、权威链接

- [release-please 仓库](https://github.com/googleapis/release-please) · [docs/ 目录](https://github.com/googleapis/release-please/tree/main/docs)
- [release-please-action](https://github.com/googleapis/release-please-action) —— inputs / outputs / 工作流示例
- [manifest-releaser.md](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md) —— manifest 与 monorepo
- [customizing.md](https://github.com/googleapis/release-please/blob/main/docs/customizing.md) —— changelog / 版本策略 / extra-files
- [cli.md](https://github.com/googleapis/release-please/blob/main/docs/cli.md) —— CLI 命令与 bootstrap
- [troubleshooting.md](https://github.com/googleapis/release-please/blob/main/docs/troubleshooting.md) —— 排错
- [Conventional Commits](https://www.conventionalcommits.org/) · [Semantic Versioning](https://semver.org/)
