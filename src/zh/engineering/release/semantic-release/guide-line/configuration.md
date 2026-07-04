---
layout: doc
outline: [2, 3]
---

# 配置与 CI 集成

> 基于 semantic-release v25 · 核于 2026-07

## 速查

- **配置文件多格式**：`.releaserc`（YAML/JSON）、`.releaserc.{yaml,yml,json,js,cjs,mjs}`、`release.config.{js,cjs,mjs}`、或 `package.json` 的 `"release"` 键——任选其一放仓库根。
- **全局选项就八个**：`extends` / `branches` / `repositoryUrl` / `tagFormat` / `plugins` / `dryRun` / `ci` / `debug`；其余细节都在各插件的选项里。
- **优先级**：CLI 参数 > 本地配置文件 > `extends` 继承的 shareable config（就近覆盖）。**注意**：插件的选项**不能**用 CLI 传，只能写在配置文件里。
- **`branches` 默认值**：`['+([0-9])?(.{+([0-9]),x}).x', 'master', 'main', 'next', 'next-major', {name: 'beta', prerelease: true}, {name: 'alpha', prerelease: true}]`。
- **`tagFormat` 默认 `v${version}`**：monorepo 里常改成 `pkg-a-v${version}` 给每个包独立 tag 命名空间。
- **`plugins` 是「覆盖」不是「追加」**：一旦自定义 `plugins`，默认四件套全部失效，要自己列全。
- **`dryRun`**：CI 里默认 `false`（真发），本地默认 `true`（只演练）；`npx semantic-release --dry-run` 本地调试首选。
- **`extends` = shareable config**：把插件/分支/规则打包成一个 npm 包复用，本地配置可就近覆盖其中的项。
- **CI 三件套**：① `fetch-depth: 0` 拉全量历史与 tag；② 写权限（GitHub `permissions: contents: write`）；③ 注入 `GITHUB_TOKEN`/`NPM_TOKEN`。
- **多 Job 构建**：semantic-release 只应在**所有测试 Job 成功后**的最后一个发布 Job 里跑一次，别在矩阵里跑多份。
- **环境变量**：Git 提交人默认 `semantic-release-bot`，可用 `GIT_AUTHOR_NAME/EMAIL`、`GIT_COMMITTER_NAME/EMAIL` 覆盖。

## 一、配置文件放哪、写成什么

semantic-release 用 [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) 从仓库根查找配置，支持多种格式，任选其一即可：

| 文件 | 格式 |
| --- | --- |
| `.releaserc` | YAML 或 JSON（无扩展名） |
| `.releaserc.yaml` / `.releaserc.yml` / `.releaserc.json` | YAML / JSON |
| `.releaserc.js` / `.releaserc.cjs` / `.releaserc.mjs` | JavaScript（可写逻辑/注释） |
| `release.config.js` / `.cjs` / `.mjs` | JavaScript |
| `package.json` 里的 `"release"` 键 | JSON |

JSON 适合静态配置；`.js`/`.cjs`/`.mjs` 适合需要条件逻辑（如按环境变量切换分支）的场景。一个典型 `.releaserc.json`：

```json
{
  "branches": ["main", "next", { "name": "beta", "prerelease": true }],
  "tagFormat": "v${version}",
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
```

## 二、八个全局选项

除了插件各自的选项，semantic-release 的**全局**配置只有这几项：

| 选项 | 类型 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `extends` | String/Array | — | 继承一个或多个 shareable config（npm 包） |
| `branches` | String/Array/Object | 见速查 | 定义哪些分支发布、怎么发（正式/维护/预发布） |
| `repositoryUrl` | String | 由 `package.json` 或 git origin 推断 | 仓库地址 |
| `tagFormat` | String | `v${version}` | Git tag 命名模板 |
| `plugins` | Array | `commit-analyzer`+`release-notes-generator`+`npm`+`github` | 参与生命周期的插件列表 |
| `dryRun` | Boolean | CI 中 `false`，本地 `true` | 只演练、不真正发布 |
| `ci` | Boolean | `true` | 是否要求 CI 环境；`--no-ci` 关闭 |
| `debug` | Boolean | `false` | 打印详细调试日志 |

关于 `tagFormat`：模板变量是 `${version}`（JS 模板字面量风格，非 Handlebars）。它同时影响「打出的 tag」和「查找上次发布时匹配哪些 tag」——所以**中途改 `tagFormat` 会让它找不到历史 tag**，需谨慎。

## 三、配置来源的优先级

同一个选项可能在多处出现，semantic-release 的合并优先级（高 → 低）：

1. **CLI 参数**（如 `--branches`、`--tag-format`、`--dry-run`）——最高。
2. **本地配置文件**（`.releaserc*` / `release.config.*` / `package.json`）。
3. **`extends` 继承的 shareable config**——最低，作为默认被本地覆盖。

一个关键限制：**插件的选项无法通过 CLI 传入**（CLI 只能设全局选项），涉及插件参数的必须写进配置文件。因此实践中 CLI 参数主要用于临时覆盖分支或触发 dry-run。

## 四、extends：用 shareable config 复用配置

当多个仓库需要同一套发布规则时，把配置抽成一个 npm 包，用 `extends` 引入：

```json
{
  "extends": "my-shareable-config",
  "branches": ["main", "release/**"]
}
```

- shareable config 本质是导出一份配置对象的包（可包含 `plugins`、`branches`、各插件选项等）。
- 本地配置**就近覆盖**继承来的项——上例中本地的 `branches` 会覆盖 shareable config 里的 `branches`，而未覆盖的 `plugins` 等沿用继承值。
- `extends` 可传数组，按顺序合并多个 config。
- 社区有现成的 shareable config（如面向「只发 GitHub + 写 CHANGELOG」的组合），团队内自建更常见，用于统一多个库的发布策略。

## 五、本地 dry-run：安全地调试配置

改完配置想验证「这次会发什么版本、生成什么说明」，又不想真发？用 dry-run：

```bash
# 本地默认就是 dry-run（非 CI 环境），也可显式指定
npx semantic-release --dry-run

# 需要看详细过程时叠加 debug
npx semantic-release --dry-run --debug
```

dry-run 会执行到 `analyzeCommits` + `generateNotes`，打印**将要发布的版本号和发布说明**，但**跳过** `prepare`/`publish` 等有副作用的步骤。它是验证「提交是否被正确识别、版本是否符合预期」的首选手段。注意：dry-run 仍需要能读到 Git 历史（本地仓库天然满足）。

## 六、CI 集成实战（GitHub Actions / GitLab）

semantic-release 的「跑起来」有三个绕不开的前置条件，任何 CI 平台都一样：

**① 拉全量历史与 tag。** semantic-release 靠历史 tag 判断「上次发到哪」，浅克隆会导致误判。

- GitHub Actions：`actions/checkout` 设 `fetch-depth: 0`。
- GitLab CI：`GIT_DEPTH: 0`（或在 UI 里关闭浅克隆）。

**② 给足写权限。** 打 tag、（用 `@semantic-release/git` 时）回提交、建 Release 都要写仓库。

**③ 注入凭据。** 详见 [选型与工程落地 · 凭据体系](./selection)，此处给最小可用示例。

GitHub Actions 完整示例：

```yaml
name: release
on:
  push:
    branches: [main]
permissions:
  contents: write        # 打 tag / 建 Release / 回提交
  issues: write          # 在关联 issue 上评论
  pull-requests: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm test          # 测试全过才继续
      - run: npx semantic-release@25
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

GitLab CI 示例：

```yaml
release:
  image: node:22
  variables:
    GIT_DEPTH: 0           # 拉全量历史
  script:
    - npm ci
    - npm test
    - npx semantic-release@25
  # GITLAB_TOKEN / NPM_TOKEN 配为 CI/CD Variables（Masked）
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

## 七、常见坑

- **忘了 `fetch-depth: 0`**：最高频问题。表现为把每次都当「首次发布」发成 `1.0.0`，或算错基线。
- **在多 Job/矩阵里跑了多份**：semantic-release 只应在**测试全过后**的单个发布 Job 里跑一次；矩阵里并发跑多份会互相打架。
- **权限不足**：GitHub Actions 默认 `GITHUB_TOKEN` 权限收紧，需显式 `permissions: contents: write`，否则打 tag/建 Release 报 403。
- **分支保护挡推送**：目标分支若要求 PR 合并，semantic-release 直接 push tag/commit 会被拒——需允许发布身份绕过保护规则。
- **改了 `tagFormat` 却没迁移历史**：新格式匹配不到旧 tag，会误判为首发。
- **`plugins` 只列了一半**：自定义 `plugins` 会覆盖默认四件套，漏列 `commit-analyzer` 就永远算不出版本（详见 [插件与发布生命周期](./plugins-lifecycle)）。
