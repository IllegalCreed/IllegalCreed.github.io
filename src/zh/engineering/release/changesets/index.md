---
layout: doc
---

# Changesets

Changesets 是一个**以 monorepo 为核心**的版本管理与 changelog 生成工具。它的核心理念是把「发布」拆成前后两段：开发者在改代码的同时，用一个 **changeset 文件**（`.changeset/*.md`）**显式声明变更意图**——这次动了哪些包、每个包按 `major` / `minor` / `patch` 哪一级升、以及一句写给用户看的变更说明；等到真正要发版时，再由维护者一次性「消费」掉所有累积的 changeset，自动算出每个包的新版本号、联动升级仓库内部依赖、写入 CHANGELOG，最后发布到 npm。

和把版本语义藏在 commit message 里的 `semantic-release` 那套不同，Changesets 把「意图」落成**可评审、可编辑、可累积**的 Markdown 文件，跟着 PR 一起走 review。它**原生为多包仓库设计**，天然理解包间依赖联动，配合 **pnpm / yarn / npm workspaces** 开箱即用，是当下开源 monorepo（Vue、Astro、Turborepo、Emotion 等生态）发布流程的事实标准之一。

## 概述

**优点**

- **意图显式、可评审**：changeset 就是 PR 里的一个文件，reviewer 能直接看到「这次改动打算怎么发版 + changelog 写什么」，比让工具从 commit message 里猜语义化级别可靠得多
- **monorepo 原生**：自动处理包间依赖联动（改了 `core`，依赖它的 `cli` 自动补一个 patch bump），`fixed` / `linked` 两套机制管控「齐发」与「版本同步」
- **发布与开发解耦**：`add`（随时、贴着改动写）与 `version` / `publish`（发版时统一消费）分成两个阶段，多个 PR 的 changeset 自然累积成一次 release
- **工具链中立、命令幂等**：只认 `package.json`，pnpm / yarn / npm workspaces 通吃；`publish` 只发「版本比 npm 上新」的包，可安全重跑
- **生态成熟**：`changesets/action` 维护一个「Version Packages」PR，合并即发布；`@changesets/changelog-github` 能生成带 PR / 作者链接的 changelog

**缺点**

- **需要人手写 changeset**：不像 `semantic-release` 全自动从 commit 推断，忘写就会漏掉 release（好在能用 `changeset status` / CI 卡点兜底）
- **预发布（pre）心智负担重**：`pre.json` 状态机 + 「prerelease 版本不满足 semver range 导致连锁 bump」，官方文档自己都反复警告「很复杂」
- **单包仓库红利打折**：核心价值在 monorepo 的依赖联动与批量发布，单包项目用它略显「重」
- **默认 changelog 朴素**：想要好看、带链接的 changelog 得换 `@changesets/changelog-github` 并配好 `repo`

**个人评价**：对 monorepo（尤其是开源多包库）几乎是首选——发布心智清晰、评审友好、社区标杆项目清一色在用。个人单包项目则可用可不用，追求「提交即发布」的全自动流水线时，`semantic-release` 反而更省事。

## 本叶地图

| 页面 | 内容 |
| --- | --- |
| [入门](./getting-started.md) | Changesets 定位、`.changeset/*.md` 文件结构、`add → version → publish` 三步工作流 |
| [指南 - 工作流](./guide-line/workflow.md) | `version` 到底做了什么、`publish` 幂等发布、空 changeset、`status` 卡点 |
| [指南 - 配置](./guide-line/config.md) | `config.json` 逐字段：`access` / `changelog` / `updateInternalDependencies` / `fixed` vs `linked` / `ignore` |
| [指南 - Monorepo](./guide-line/monorepo.md) | 内部依赖联动、`workspace:` 协议、给应用 / 私有包 / 非 npm 包做版本 |
| [指南 - 预发布与 CI](./guide-line/prerelease-ci.md) | `pre enter/exit`、snapshot 发布、`changesets/action` 维护 Release PR、与 semantic-release / release-please 对比 |
| [参考](./reference.md) | 命令 / 配置 / 常见坑速查 + 官方链接 |

## 文档地址

[Changesets Documentation（GitHub docs/）](https://github.com/changesets/changesets/tree/main/docs)

## 幻灯片地址

- <a href="/SlideStack/changesets-slide/" target="_blank">Changesets</a>
