---
layout: doc
outline: [2, 3]
---

# 插件与发布生命周期

> 基于 semantic-release v25 · 核于 2026-07

## 速查

- **一次发布 = 九个有序 step**：`verifyConditions → analyzeCommits → verifyRelease → generateNotes → prepare → publish → addChannel → success → fail`。
- **semantic-release 内核只做编排**：具体每一步的活儿全由**插件**实现；没有插件实现某 step，该 step 就被跳过。
- **`analyzeCommits` 是唯一「必需」step**：没有插件实现它就无法算版本；其余 step 可选。
- **多插件实现同一 step 时**：`analyzeCommits` 取**最高**发布等级；`generateNotes` 把各家输出**拼接**；其余按声明顺序**依次**执行。
- **插件执行顺序 = 你在 `plugins` 里声明的顺序**：顺序影响 `prepare`（谁先改文件、谁后提交）等有副作用的步骤。
- **默认四件套**：`commit-analyzer`（analyzeCommits）→ `release-notes-generator`（generateNotes）→ `npm`（verifyConditions/prepare/publish）→ `github`（verifyConditions/publish/success/fail）。
- **「覆盖非追加」坑**：一旦自定义 `plugins`，默认四件套**全部失效**，必须自己把要用的插件列全。
- **无相关提交 = 到 `analyzeCommits` 就停**：不进入后续 step，正常退出、不发版。
- **`prepare` 常见组合**：`@semantic-release/changelog`（写 CHANGELOG）+ `@semantic-release/npm`（改 `package.json` 版本）+ `@semantic-release/git`（把这些改动回提交）。
- **`addChannel`**：把已发布的版本追加到新的 dist-tag/channel（分支合并时用），不重新构建。
- **`success`/`fail`**：发布成功/失败后的通知——`github` 插件会在关联 issue/PR 评论、失败时开 issue 告警。

## 一、生命周期的九个 step

semantic-release 本身是一个**编排器**：它定义了一条固定顺序的生命周期，每个阶段（step）向插件「广播」，由实现了该 step 的插件接力干活。完整顺序与职责：

| 顺序 | Step | 必需 | 职责 | 典型实现插件 |
| --- | --- | --- | --- | --- |
| 1 | `verifyConditions` | 否 | 校验发布前置条件（凭据、权限、配置） | `npm`、`github`、`git`、`changelog` |
| 2 | `analyzeCommits` | **是** | 解析提交，判定发布类型（major/minor/patch/无） | `commit-analyzer` |
| 3 | `verifyRelease` | 否 | 在确定要发布后、发布前做额外校验 | `exec` 等 |
| 4 | `generateNotes` | 否 | 生成本次发布说明文本 | `release-notes-generator` |
| 5 | `prepare` | 否 | 准备发布物：改版本号、写 CHANGELOG、回提交 | `npm`、`changelog`、`git` |
| 6 | `publish` | 否 | 真正发布：`npm publish`、建 GitHub/GitLab Release | `npm`、`github`、`gitlab` |
| 7 | `addChannel` | 否 | 把已有版本加到新 channel/dist-tag（分支合并场景） | `npm`、`github` |
| 8 | `success` | 否 | 发布成功后的通知 | `github` |
| 9 | `fail` | 否 | 发布失败后的通知/告警 | `github` |

只有 `analyzeCommits` 是「必需」的——它是版本推断的核心，没有它整个流程无从谈起。其余 step 都是可选的：你装了实现该 step 的插件，它才发生。

## 二、内核 vs 插件：谁在指挥、谁在干活

理解 semantic-release 的关键，是分清「内核」与「插件」的边界：

- **内核**负责：读 Git 历史、找上次发布的 tag、按顺序驱动九个 step、把上一步的产出（如版本号、发布说明）传给下一步、打 Git tag、汇总日志。
- **插件**负责：每个 step 的具体行为。「发到哪个 registry」「写不写 CHANGELOG」「建不建 GitHub Release」全是插件的事。

所以**配置 semantic-release 的本质，就是「在合适的 step 上编排合适的插件」**。想加一种发布目标（比如同时发 GitLab Release），就加一个实现 `publish` 的插件；想在发布前跑自定义脚本，就用 `@semantic-release/exec` 挂到相应 step。

## 三、多个插件实现同一 step 时的合并规则

同一个 step 可以被多个插件实现，此时的合并语义各不相同，必须记牢：

- **`analyzeCommits`**：若多个插件都给出发布类型，取**最高等级**（major > minor > patch）。
- **`generateNotes`**：多个插件的输出会**按顺序拼接**成最终发布说明。
- **其余有副作用的 step（`verifyConditions`/`prepare`/`publish`/`success`/`fail` 等）**：所有实现该 step 的插件**按 `plugins` 声明顺序依次执行**。

这就是为什么 **`plugins` 数组的顺序很重要**——尤其在 `prepare` 阶段：

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git"
  ]
}
```

上面这个顺序在 `prepare` 阶段的效果是：先 `changelog` 生成/更新 `CHANGELOG.md` → 再 `npm` 改 `package.json` 版本 → 最后 `git` 把这两处改动**一起回提交**。若把 `git` 放到 `changelog`/`npm` 前面，回提交时改动还没产生，就会漏掉文件。

## 四、默认四件套逐个看

不配置 `plugins` 时，semantic-release 用这四个默认插件（按顺序）：

| 插件 | 实现的 step | 干什么 |
| --- | --- | --- |
| `@semantic-release/commit-analyzer` | `analyzeCommits` | 用 conventional-changelog 解析提交，判定发布类型 |
| `@semantic-release/release-notes-generator` | `generateNotes` | 用 conventional-changelog 把提交汇成发布说明 |
| `@semantic-release/npm` | `verifyConditions`/`prepare`/`publish` | 校验 npm 凭据、改 `package.json` 版本、`npm publish` |
| `@semantic-release/github` | `verifyConditions`/`publish`/`success`/`fail` | 校验 GitHub 凭据、建 Release、在关联 issue/PR 评论、失败开 issue |

常按需增补的插件：

- **`@semantic-release/changelog`**（`verifyConditions`/`prepare`）：在仓库里生成/更新 `CHANGELOG.md`。
- **`@semantic-release/git`**（`verifyConditions`/`prepare`）：把 `CHANGELOG.md`、`package.json` 等改动**回提交**到仓库（注意 `[skip ci]` 死循环坑，见 [分支与预发布](./branches-prerelease)）。
- **`@semantic-release/gitlab`**（`verifyConditions`/`publish`）：建 GitLab Release。
- **`@semantic-release/exec`**（几乎所有 step）：在任意 step 执行自定义 shell 命令，是「扩展点中的万金油」，常用于 monorepo 或非 JS 项目。

## 五、「覆盖非追加」——最容易翻车的一点

`plugins` 选项是**覆盖**语义，不是追加。一旦你写了自己的 `plugins`，默认四件套就**全部不生效**。常见事故：

```json
{
  "plugins": ["@semantic-release/changelog", "@semantic-release/git"]
}
```

这份配置漏掉了 `commit-analyzer` 和 `release-notes-generator`——结果是**永远算不出版本**（没有插件实现 `analyzeCommits`）、也没有发布说明。正确写法是把需要的插件**列全**：

```json
{
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

## 六、无相关提交时会怎样

如果自上次发布以来的提交里**没有任何一条**触发发布（例如全是 `chore`/`docs`），流程走到 `analyzeCommits` 得出「无发布」后就**正常结束**——不进入 `generateNotes`/`prepare`/`publish`，不打 tag，日志打印类似：

```text
There are no relevant changes, so no new version is released.
```

这是**正常行为而非错误**，退出码为 0。它保证了「只改注释也触发一次 CI 发布」时不会产出空版本——这正是全自动发布的自我保护。理解这一点，就不会在看到「没发版」时误以为配置坏了。
