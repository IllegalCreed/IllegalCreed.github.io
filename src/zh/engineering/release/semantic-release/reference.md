---
layout: doc
outline: [2, 3]
---

# 参考：semantic-release 速查

> 基于 semantic-release v25 · 核于 2026-07

## 速查

- **心智模型**：`下一版本 = f(上次 tag, 之后的提交)`；全自动、只在 CI 跑、无相关提交则不发。
- **版本映射**：`fix`/`perf`→patch、`feat`→minor、`BREAKING CHANGE`(或 `!`)→major、其余类型不发。
- **生命周期九步**：`verifyConditions→analyzeCommits→verifyRelease→generateNotes→prepare→publish→addChannel→success→fail`；仅 `analyzeCommits` 必需。
- **默认插件**：`commit-analyzer`+`release-notes-generator`+`npm`+`github`；自定义 `plugins` 是**覆盖**非追加。
- **全局选项八个**：`extends`/`branches`/`repositoryUrl`/`tagFormat`/`plugins`/`dryRun`/`ci`/`debug`。
- **CI 三前提**：`fetch-depth: 0`、写权限、注入 token。
- **凭据**：`GITHUB_TOKEN`/`NPM_TOKEN`；`GITHUB_TOKEN` 兼 Git 推送 + API。
- **分支三类**：正式 / 维护(`1.x`) / 预发布(`beta`)；`channel` = npm dist-tag。
- **`@semantic-release/git` 回提交**：默认信息带 `[skip ci]` 防死循环；多半不需要它。
- **规范守门**：commitlint + Husky 拦不合规提交（semantic-release 自己不校验）。
- **运行**：`npx semantic-release@25`；本地默认 dry-run；Node ≥ 22.14。

## 一、全局配置项

| 选项 | 默认值 | CLI | 说明 |
| --- | --- | --- | --- |
| `extends` | — | `-e`/`--extends` | 继承 shareable config |
| `branches` | `['+([0-9])?(.{+([0-9]),x}).x','master','main','next','next-major',{name:'beta',prerelease:true},{name:'alpha',prerelease:true}]` | `--branches` | 发布分支定义 |
| `repositoryUrl` | 由 pkg/git 推断 | `-r`/`--repository-url` | 仓库地址 |
| `tagFormat` | `v${version}` | `-t`/`--tag-format` | tag 命名模板 |
| `plugins` | `commit-analyzer`,`release-notes-generator`,`npm`,`github` | `-p`/`--plugins` | 插件列表（覆盖非追加） |
| `dryRun` | CI:`false` 本地:`true` | `-d`/`--dry-run` | 只演练不发布 |
| `ci` | `true` | `--ci`/`--no-ci` | 是否要求 CI 环境 |
| `debug` | `false` | `--debug` | 详细日志 |

> 插件选项**不能**用 CLI 传，只能写配置文件。优先级：CLI > 配置文件 > `extends`。

## 二、配置文件格式

`.releaserc`（YAML/JSON）· `.releaserc.{yaml,yml,json,js,cjs,mjs}` · `release.config.{js,cjs,mjs}` · `package.json` 的 `"release"` 键。任选其一放仓库根。

## 三、提交类型 → 版本跳变（angular 预设）

| 提交 | 跳变 |
| --- | --- |
| `fix:` / `perf:` | patch |
| `feat:` | minor |
| `feat!:` / 脚注 `BREAKING CHANGE:` | major |
| `docs`/`style`/`chore`/`refactor`/`test`/`ci`/`build` | 不发布 |

> 一次发布取区间内**最高**等级；可用 `commit-analyzer` 的 `preset`/`releaseRules` 定制。

## 四、生命周期与插件对照

| Step | 必需 | 典型插件 |
| --- | --- | --- |
| `verifyConditions` | 否 | npm / github / git / changelog |
| `analyzeCommits` | **是** | commit-analyzer |
| `verifyRelease` | 否 | exec |
| `generateNotes` | 否 | release-notes-generator |
| `prepare` | 否 | changelog / npm / git |
| `publish` | 否 | npm / github / gitlab |
| `addChannel` | 否 | npm / github |
| `success` | 否 | github |
| `fail` | 否 | github |

**多插件同 step 合并**：`analyzeCommits` 取最高；`generateNotes` 拼接；其余按 `plugins` 顺序依次执行。

## 五、常用插件

| 插件 | step | 用途 |
| --- | --- | --- |
| `@semantic-release/commit-analyzer` | analyzeCommits | 判定发布类型 |
| `@semantic-release/release-notes-generator` | generateNotes | 生成发布说明 |
| `@semantic-release/changelog` | verifyConditions/prepare | 写 `CHANGELOG.md` |
| `@semantic-release/npm` | verifyConditions/prepare/publish | 改版本 + 发 npm |
| `@semantic-release/git` | verifyConditions/prepare | 回提交（默认带 `[skip ci]`） |
| `@semantic-release/github` | verifyConditions/publish/success/fail | 建 GitHub Release + 通知 |
| `@semantic-release/gitlab` | verifyConditions/publish | 建 GitLab Release |
| `@semantic-release/exec` | 几乎所有 step | 执行自定义命令（monorepo/非 JS） |

## 六、分支属性

| 属性 | 适用 | 含义 |
| --- | --- | --- |
| `name` | 全部（必填） | 分支名 / glob |
| `channel` | 全部 | npm dist-tag（首个正式分支默认 latest） |
| `range` | 维护 | 版本范围（`1.x`，`N.x`/`N.N.x` 可省） |
| `prerelease` | 预发布 | 标识（`beta` → `2.0.0-beta.1`） |

## 七、凭据速查

| 变量 | 用途 |
| --- | --- |
| `GITHUB_TOKEN` / `GH_TOKEN` | Git 推送 + GitHub API（打 tag/建 Release/评论） |
| `GITLAB_TOKEN` / `GL_TOKEN` | Git 推送 + GitLab API |
| `BB_TOKEN` / `GIT_CREDENTIALS` | Bitbucket / 通用 Git 凭据 |
| `NPM_TOKEN` | `npm publish`（仅支持 auth-only 2FA；CI 用 automation token 或 OIDC） |

## 八、常见坑清单

- **`fetch-depth: 0` 忘配** → 浅克隆算不出历史 tag，误判首发 / 版本错乱。
- **`plugins` 覆盖非追加** → 自定义后漏列 `commit-analyzer`，永远不发版。
- **GitHub Actions 权限不足** → 未设 `permissions: contents: write`，打 tag/建 Release 报 403。
- **分支保护挡推送** → 目标分支要求 PR，直接 push tag/commit 被拒；需允许发布身份绕过。
- **`@semantic-release/git` 少了 `[skip ci]`** → 回提交再触发 CI，无谓构建甚至死循环。
- **中途改 `tagFormat`** → 匹配不到旧 tag，误判首发。
- **在矩阵/多 Job 里跑多份** → 应仅在测试全过后的单个发布 Job 跑一次。
- **提交不规范却没守门** → 该发的没发 / 版本乱跳；配 commitlint + Husky。
- **npm `publish` 级 2FA** → CI 无法自动发布；改 automation token 或 OIDC Trusted Publishing。
- **误以为「没发版」是 bug** → 无相关提交时不发布是设计，退出码 0。

## 九、权威链接

- [semantic-release GitHub 仓库](https://github.com/semantic-release/semantic-release) —— 源码 / `docs/` / Release Notes
- [semantic-release 文档（GitBook）](https://semantic-release.gitbook.io/semantic-release) —— usage / configuration / plugins / workflow-configuration
- [插件列表 plugins-list](https://github.com/semantic-release/semantic-release/blob/master/docs/extending/plugins-list.md)
- [`@semantic-release/git`](https://github.com/semantic-release/git) · [`@semantic-release/npm`](https://github.com/semantic-release/npm) · [`@semantic-release/github`](https://github.com/semantic-release/github)
- [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) · [SemVer](https://semver.org/lang/zh-CN/)
- [commitlint](https://commitlint.js.org/) —— 提交规范校验
- [Changesets](https://github.com/changesets/changesets) · [release-please](https://github.com/googleapis/release-please) —— 选型对比对象
