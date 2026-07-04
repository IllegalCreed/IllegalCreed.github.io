---
layout: doc
outline: [2, 3]
---

# 分支与预发布

> 基于 semantic-release v25 · 核于 2026-07

## 速查

- **`branches` 决定「哪些分支发布、怎么发」**：一份配置同时管正式、维护、预发布三类分支。
- **三类分支**：**正式**（发正式版到默认 channel）、**维护**（`1.x`/`1.1.x` 在老版本线上继续发补丁）、**预发布**（`beta`/`next`/`alpha` 发带标识的预览版）。
- **正式分支 1~3 个**：后面的分支版本必须高于前面的，避免版本冲突。
- **channel = npm 的 dist-tag**：预发布/维护版发到独立 dist-tag（如 `beta`/`next`），用户 `npm i pkg@beta` 才装到，不污染 `latest`。
- **分支对象四属性**：`name`（必填）、`channel`（发布渠道）、`range`（维护分支专用，如 `1.x`）、`prerelease`（预发布专用标识，如 `beta`）。
- **维护分支命名 `N.x`/`N.N.x`** 时 `range` 可省略（自动推断）；否则须显式写 `range`。
- **预发布版本号形如 `2.0.0-beta.1`**：同一 base 版本靠标识递增区分（`beta.1`、`beta.2`…）。
- **`@semantic-release/git` 回提交坑**：把 CHANGELOG/版本号提交回仓库时，默认提交信息带 **`[skip ci]`**，否则这条提交会再次触发 CI → 再次发布 → **死循环**。
- **`git` 插件默认提交信息**：`chore(release): ${nextRelease.version} [skip ci]`；默认 assets：`['CHANGELOG.md', 'package.json', 'package-lock.json', 'npm-shrinkwrap.json']`。
- **能不回提交就别回**：官方明确提示「你多半不需要 `@semantic-release/git`」——它增加复杂度且是死循环的根源。

## 一、branches：一份配置管多条发布线

`branches` 是 semantic-release 里除插件外最有分量的配置。它是一个数组，每一项可以是：

- **字符串**（分支名或 glob）：如 `"main"`、`"release/**"`；
- **对象**：带 `name`/`channel`/`range`/`prerelease` 属性，用于精细控制。

四个属性的含义：

| 属性 | 适用 | 含义 |
| --- | --- | --- |
| `name` | 全部（必填） | 要分析提交的 Git 分支名或匹配的 glob |
| `channel` | 全部 | 发布到的分发渠道（npm dist-tag）。首个正式分支默认 `undefined`（即 `latest`），其余默认取 `name` |
| `range` | 维护分支 | 语义版本范围（如 `1.x`）；`name` 形如 `N.x`/`N.N.x` 时可省略 |
| `prerelease` | 预发布分支 | 预发布标识（如 `beta`）；版本形如 `2.0.0-beta.1` |

默认 `branches` 值（不配置时）：

```json
[
  "+([0-9])?(.{+([0-9]),x}).x",
  "master",
  "main",
  "next",
  "next-major",
  { "name": "beta", "prerelease": true },
  { "name": "alpha", "prerelease": true }
]
```

其中第一项是匹配 `1.x`/`1.2.x` 这类维护分支的 glob。

## 二、三类分支各自解决什么

**① 正式分支（release branch）** —— 发正式版。

发布 SemVer 正式版本到（可选的）分发渠道。一个项目**至少 1 个、最多 3 个**正式分支。多个正式分支时，靠后分支的版本必须**高于**靠前分支，以免版本冲突；分支间合并时，版本会流转到目标分支的 channel。最常见就是单个 `main`。

**② 维护分支（maintenance branch）** —— 在老版本线上继续发补丁。

当 `2.x` 已发布，但仍需给还在用 `1.x` 的用户发补丁时，用维护分支。它的特征是有**独立的 version range**（如 `1.0.x`、`1.x`），发布到与该 range 对应的 dist-tag。只有落在分支 range 内的版本才能在维护分支间合并，超出范围合并会触发 `EINVALIDMAINTENANCEMERGE` 错误。

```json
{ "branches": ["main", "1.x", "1.2.x"] }
```

上例中 `1.x`/`1.2.x` 是维护分支，`name` 已含范围，故 `range` 可省。

**③ 预发布分支（pre-release branch）** —— 发带标识的预览版。

发布带**静态标识**的预发布版本，多个发布共享同一 base 版本、靠标识区分（`beta.1`、`beta.2`…）。发布到该标识对应的 dist-tag。

```json
{
  "branches": [
    "main",
    { "name": "next", "prerelease": true },
    { "name": "beta", "prerelease": true }
  ]
}
```

推 `beta` 分支会产出 `2.0.0-beta.1`、`2.0.0-beta.2`……，发到 npm 的 `beta` dist-tag。

## 三、channel 与 npm dist-tag：为什么预发布不会污染 latest

npm 的 **dist-tag** 是给版本贴的「渠道标签」，默认标签是 `latest`——用户 `npm install pkg` 装的就是 `latest` 指向的版本。semantic-release 的 `channel` 直接对应 dist-tag：

- 正式分支通常不设 channel（发到 `latest`）；
- 预发布分支 `beta` 发到 `beta` dist-tag，用户需 `npm install pkg@beta` 才装到；
- 维护分支发到其 range 对应的 dist-tag。

这样**预览版和正式版井水不犯河水**：默认安装永远拿正式版，想尝鲜的人主动指定 `@beta`/`@next`。当预发布分支合并回正式分支时，semantic-release 用 `addChannel` step 把该版本「提级」到 `latest`，无需重新构建。

## 四、@semantic-release/git 回提交与 [skip ci] 死循环坑

默认发布流程**不会**把改动提交回仓库——`package.json` 的版本号变更只存在于发布那一刻的工作区，tag 才是真相来源。但有些团队希望把生成的 `CHANGELOG.md`、更新后的 `package.json` **回提交**到仓库，这就要用 `@semantic-release/git`（实现 `verifyConditions`/`prepare`）。

它的默认配置：

- **默认提交信息**：`chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}`
- **默认 assets（要提交的文件）**：`['CHANGELOG.md', 'package.json', 'package-lock.json', 'npm-shrinkwrap.json']`

**关键在提交信息里的 `[skip ci]`**：

发布流程本身通常由「push 到 main」触发。如果 `@semantic-release/git` 又往 main **push 一条发布提交**，而这条提交**没有** `[skip ci]`，就会**再次触发 CI → 再跑一次 semantic-release**。虽然第二次因为「无相关提交」多半不会真发版，但这仍是一次无谓的构建，配置不当（比如 `git` 提交本身被算作可发布）时甚至会**无限循环发版**。默认提交信息里的 `[skip ci]` 正是为切断这个环——它让 CI 平台跳过这条提交触发的构建。

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }],
    "@semantic-release/github"
  ]
}
```

自定义 `message` 时**务必保留 `[skip ci]`**（或对应 CI 平台的等价跳过标记，如 GitLab 的 `[ci skip]`）。

## 五、要不要用 @semantic-release/git

官方文档明确提示：**「你多半不需要这个插件」**。原因：

- semantic-release 的核心真相是 **Git tag**，而非 `package.json` 里的版本号——不回提交完全不影响发布正确性。
- 回提交引入额外复杂度：`[skip ci]` 处理、分支保护冲突、用哪个身份 push、并发发布竞态。
- 很多人用它只是为了「让仓库里的 `CHANGELOG.md` 常新」——但 CHANGELOG 也可以从 GitHub Release（`@semantic-release/github` 自动生成）获取，不一定要落到仓库文件。

**建议**：除非有强需求（如需要仓库里的 `CHANGELOG.md` 供文档站消费），否则不装 `@semantic-release/git`，让发布保持无副作用、无死循环风险。
