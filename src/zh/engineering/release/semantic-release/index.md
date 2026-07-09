---
layout: doc
---

# semantic-release

**semantic-release 是一套「全自动」的版本发布工具：它把「下一个版本号该是多少」从人的主观判断，变成对 Git 提交历史的一次确定性计算。** 只要团队按 [Conventional Commits](https://www.conventionalcommits.org/) 规范写提交，semantic-release 就能在 CI 里自动完成整条发布链路——分析自上次发布以来的提交、按 `fix→patch / feat→minor / BREAKING CHANGE→major` 推断出语义化版本号、生成发布说明与 CHANGELOG、打 Git tag、发布到 npm、创建 GitHub/GitLab Release，全程**无人工敲定版本号、无人工点发布按钮**。它刻意「切断人的情绪与版本号之间的连接」：发布不再是一场需要有人拍板、易错又难复现的手工仪式，而是流水线里一个幂等、可审计的普通步骤。

## 概述

- **全自动、零人工定版本**：版本号不是人「定」的，而是从提交历史「算」出来的；开发者只管按规范写提交，发布这件事完全交给 CI。
- **版本从 Conventional Commits 推断**：`fix:`→补丁号（patch）、`feat:`→次版本号（minor）、脚注 `BREAKING CHANGE:` 或类型后加 `!`→主版本号（major）；**没有可发布的提交就不发布**（no release）。
- **只在 CI 里跑**：本地默认进入 dry-run（只演练不发布），发布只在 CI、测试全过、目标分支上进行——保证发布环境干净、可复现、可审计。
- **插件化生命周期**：一次发布是九个有序步骤（`verifyConditions→analyzeCommits→verifyRelease→generateNotes→prepare→publish→addChannel→success→fail`），每步由插件实现；默认四件套 `commit-analyzer / release-notes-generator / npm / github`。
- **branches 驱动多轨发布**：一套配置同时管正式分支、维护分支（`1.x`）、预发布分支（`beta`/`next`），分别发到对应的 npm **dist-tag**。
- **幂等、可重跑**：靠 Git tag 记录「已发布到哪」，重复运行不会重复发版——无新提交就跳过。
- **偏单包设计**：开箱即用面向单包仓库；monorepo 需要额外插件/包，属于已知短板（与 Changesets 定位相反）。
- **当前 v25 · Node ≥ 22.14**：推荐在 CI 里用 `npx semantic-release@25` 运行（至少锁主版本号）。

## 本叶地图

- [入门](./getting-started) —— 全自动发布解决什么问题、Conventional Commits→版本推断的心智模型、为何必须在 CI 跑、最小上手三步
- [配置与 CI 集成](./guide-line/configuration) —— 配置文件格式与优先级、全局选项（branches/tagFormat/plugins/extends/dryRun/ci）、shareable config、本地 dry-run 调试、GitHub Actions/GitLab 工作流实战与 `fetch-depth: 0`/权限坑
- [插件与发布生命周期](./guide-line/plugins-lifecycle) —— 九步生命周期逐步拆解、每个插件负责哪些 step、默认插件与「覆盖非追加」坑、无相关提交则不发布
- [分支与预发布](./guide-line/branches-prerelease) —— branches 三类分支（正式/维护/预发布）、dist-tag 与 channel、`@semantic-release/git` 回提交与 `[skip ci]` 死循环坑
- [选型与工程落地](./guide-line/selection) —— monorepo 局限、与 Changesets/release-please 的架构对比、凭据体系（NPM_TOKEN/GITHUB_TOKEN）、幂等重跑、用 commitlint + Husky 守住提交规范
- [参考](./reference) —— 配置项 / 插件 / 生命周期 / 常见坑速查表 + 权威链接

## 文档地址

- [semantic-release GitHub 仓库](https://github.com/semantic-release/semantic-release) —— 源码、`docs/` 目录、Release Notes（一手信息）
- [semantic-release 文档（GitBook）](https://semantic-release.gitbook.io/semantic-release) —— usage / configuration / plugins / workflow-configuration
- [Conventional Commits 规范](https://www.conventionalcommits.org/zh-hans/) —— 版本推断的输入契约
- [Semantic Versioning（SemVer）](https://semver.org/lang/zh-CN/) —— 版本号语义
- [插件列表 plugins-list](https://github.com/semantic-release/semantic-release/blob/master/docs/extending/plugins-list.md) —— 官方与社区插件

## 幻灯片地址

- <a href="/SlideStack/semantic-release-slide/" target="_blank">semantic-release</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=semantic-release" target="_blank" rel="noopener noreferrer">semantic-release 测试题</a>
