---
layout: doc
outline: [2, 3]
---

# 指南 - 预发布与 CI

> 基于 Changesets（@changesets/cli）· 核于 2026-07

## 速查

- **两类「非正式发布」**：`pre`（连续版本线，如 `1.0.0-beta.0/.1/.2`）与 `snapshot`（一次性快照，如 `0.0.0-pr123-2026...`）
- **进入预发布**：`changeset pre enter <tag>`（tag 如 `next` / `beta`）→ 生成 `.changeset/pre.json` 记录状态
- **预发布中 version**：`changeset version` 给版本追加 `-<tag>.N`，再跑一次计数器 `+1`（`-beta.0` → `-beta.1`）
- **退出预发布**：`changeset pre exit` → 下次 `version` 回到正常版本号
- **预发布连锁 bump**：`1.0.0-next.0` **不满足** `^1.0.0`，故依赖方会被强制一起 bump——官方警告「pre 很复杂」
- **预发布建议在非默认分支跑**：在默认分支进入 pre 且无稳定分支，会**阻塞其他改动**直到 exit
- **snapshot 发布**：`changeset version --snapshot [tag]` → 版本变 `0.0.0[-tag]-<时间戳>`；`changeset publish --tag <tag>` 发到非 latest dist-tag
- **snapshot 不回主干**：snapshot 版本只供安装测试，**改动不要合并回主干**
- **CI 自动化**：`changesets/action@v1` 检测到 changeset 就建 / 更新「Version Packages」PR，**合并该 PR 即触发 `publish`**
- **action 关键凭据**：`GITHUB_TOKEN`（自动注入，建 PR / Release 用）+ `NPM_TOKEN`（发 npm 用，存 secret）
- **对比**：changesets = 显式文件 + Release PR；semantic-release = commit 推断 + push 即发；release-please = commit 推断 + Release PR

## 预发布模式（pre）

预发布用来在正式发版前，先发一串 `1.0.0-beta.0`、`1.0.0-beta.1`……让用户提前试用。它是一个**有状态的模式**，靠一对 enter / exit 命令切换。

### 进入与退出

```bash
# 进入预发布，tag 会用在版本串和 npm dist-tag 上
pnpm changeset pre enter next     # 或 beta / rc / alpha ...

# ……正常 add changeset、version、publish……

# 退出预发布，回到正常发版
pnpm changeset pre exit
```

`pre enter` 会在 `.changeset/` 下生成一个 **`pre.json`** 文件记录预发布状态（当前 tag、已消费的 changeset 等）。**这个文件要提交进仓库**，它是「当前处于预发布模式」的唯一凭据。

### 预发布中的 version 行为

进入 pre 模式后，`changeset version`：

- 照常消费 changeset，但给算出的版本**追加 `-<tag>.N`** 后缀（如 `1.0.0-next.0`）；
- 再次运行时，**计数器递增**：`-next.0` → `-next.1` → `-next.2`……
- 会把依赖方一并 bump，以维持依赖解析有效。

### 为什么 pre「很复杂」

官方文档反复强调预发布很复杂，核心原因是 **prerelease 版本不满足普通 semver range**：

```
^5.0.0  不被  5.1.0-next.0  满足
```

于是当一个包进入预发布，**所有依赖它的包都会被强制一起 bump**（哪怕它们本来不需要发），产生连锁反应。此外：

::: warning 两个必须知道的坑

- **在默认分支跑预发布会阻塞别人**：如果你在默认分支（且没有单独的稳定发布分支）进入 pre 模式，那么在 `pre exit` 之前，其他人的正常改动都发不出去。**官方建议：预发布只在非默认分支上做。**
- **首发包拿到的是 `latest` tag**：预发布期间，一个**从未发布过**的新包首次 publish 时，npm 会给它 `latest` dist-tag（而非你的预发布 tag），需留意。

:::

## snapshot：临时快照发布

snapshot 用于「让别人立刻装上这个 PR / 这个 commit 的构建产物来试」，而**完全不动正式版本线**。它生成形如 `0.0.0-<时间戳>` 的一次性版本。

```bash
# 1. 生成 snapshot 版本（不写死到主干）
pnpm changeset version --snapshot          # → 0.0.0-20260704120000
pnpm changeset version --snapshot canary   # → 0.0.0-canary-20260704120000

# 2. 发布到一个非 latest 的 dist-tag（关键！）
pnpm changeset publish --tag canary
```

- **`--tag` 必不可少**：它让 snapshot 发到 `canary` 这类 dist-tag，而**不**占用 `latest`。否则用户 `npm install pkg` 会装到你的快照版而非稳定版——这是灾难。
- 常配合 `--no-git-tag` 避免给这些临时版本打 git tag。

用户安装快照：

```bash
pnpm add my-pkg@canary                         # 按 dist-tag 装最新快照
pnpm add my-pkg@0.0.0-canary-20260704120000    # 装某个确定的快照
```

::: warning snapshot 的改动不要合并回主干
snapshot 版本号只是「给人临时安装用的」，**不代表正式的已发布状态**。请在专用分支跑 snapshot，`version --snapshot` 产生的 `package.json` 改动**不要**合并回 main。
:::

`snapshot` 的版本号形态还能用 `config.json` 微调：

```json
{
  "snapshot": {
    "useCalculatedVersion": true,
    "prereleaseTemplate": "{tag}-{datetime}"
  }
}
```

- `useCalculatedVersion`：以「本应升到的真实版本」为基（而非固定 `0.0.0`）。
- `prereleaseTemplate`：自定义版本串模板，可用 <code v-pre>{tag}</code> / <code v-pre>{datetime}</code> / <code v-pre>{commit}</code> 等占位符拼装。

## changesets/action：合并即发布

手工 `version` → review → `publish` 的流程，在 CI 里通常交给官方的 **`changesets/action@v1`**。它的核心行为是**维护一个「Version Packages」PR**：

1. 有新 changeset 合进主干后，action 自动跑 `changeset version`，把结果做成一个 PR（默认标题 `Version Packages`），并持续保持它最新；
2. 你 review 这个 PR（版本号 + changelog）；
3. **合并这个 PR** → action 再次触发，检测到没有待处理 changeset、但有可发布的新版本 → 执行你的 `publish` 脚本发到 npm，并（默认）创建 GitHub Release。

一句话：**平时改动照常 add changeset；发版 = 点一下 merge。**

### 官方推荐工作流

```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v6

      - name: Setup pnpm
        uses: pnpm/action-setup@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 26

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Create Release Pull Request or Publish to npm
        id: changesets
        uses: changesets/action@v1
        with:
          # release 脚本：build + changeset publish
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- **`publish` 输入**：给了它，action 就在「无待处理 changeset」时执行该脚本发布；不给则只维护 Release PR、不发布。
- **`version` 输入**：默认 `changeset version`，需自定义时可传（如 `pnpm version:script`，内部须调用 `changeset version`）。
- **`GITHUB_TOKEN`**：GitHub 自动提供，用于建 PR / 建 Release；也可用 `github-token` 输入显式传。
- **`NPM_TOKEN`**：发布到 npm 的凭据，存成仓库 secret；action 会据此写 `.npmrc`（若尚不存在）。

### 常用输出

在后续 step 里读 action 的输出做条件逻辑（都在 `steps.changesets.outputs.*`）：

| 输出 | 含义 |
| --- | --- |
| `published` | 本次是否真的发布了（`'true'` / `'false'`） |
| `publishedPackages` | 已发布包的 JSON 数组：`[{"name":"@org/pkg","version":"1.0.0"}]` |
| `hasChangesets` | 当前是否存在未消费的 changeset |
| `pullRequestNumber` | 创建 / 更新的 Version PR 编号 |

```yaml
      - name: 发布后通知
        if: steps.changesets.outputs.published == 'true'
        run: echo "已发布：${{ steps.changesets.outputs.publishedPackages }}"
```

::: tip npm provenance / OIDC
若要发布带 provenance 溯源信息的包，在 job 上加 `permissions: { id-token: write }`，并在 `publish` 脚本里用 `npm publish --provenance`（或 changeset publish 配合 npm 的 provenance 支持）。锁 action 版本时，安全敏感场景建议把 `@v1` 进一步锁到具体 commit SHA。
:::

## 与 semantic-release / release-please 对比

三者都做「自动化版本 + changelog + 发布」，但**意图来源**和**发布触发方式**不同：

| 维度 | Changesets | semantic-release | release-please |
| --- | --- | --- | --- |
| 变更意图来源 | **显式 changeset 文件**（人工选 bump） | Conventional **Commit message** 推断 | Conventional **Commit message** 推断 |
| 发布触发 | **合并 Version PR** 即发 | **push 到主干即发**（无中间 PR） | **合并 Release PR** 即发 |
| monorepo | **原生**（依赖联动 / fixed / linked） | 弱（需 `multi-semantic-release` 等外挂） | 支持（manifest 模式，多包） |
| 语言 | JS / npm 生态为主（也可管非 npm 版本） | JS 为主 | **语言无关**（Google 出品，支持多语言） |
| 心智 | 决策前移到写码时、可评审 | 全自动、约束提交信息规范 | 全自动、约束提交信息规范 |
| 出品方 | 社区（Atlassian 起源） | 社区 | Google |

选型直觉：

- **monorepo 多包库、希望发版决策可评审** → Changesets（当前开源多包库主流）。
- **单包、团队严格遵守 Conventional Commits、要「提交即发布」全自动** → semantic-release。
- **多语言 / 非 JS 仓库、想要 Release PR 模式又不想手写 changeset** → release-please。

Changesets 和 release-please 都是「Release PR」模式（合并才发、可 review）；区别在 Changesets 让**人显式写意图文件**，release-please 从 **commit 自动推断**。semantic-release 则彻底无 PR、push 即发。
