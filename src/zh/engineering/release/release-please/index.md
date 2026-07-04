---
layout: doc
---

# release-please

**release-please 是 Google（googleapis 组织）开源的一款 GitHub-native 版本发布自动化工具**：它不追求「每次合并就立即发版」，而是解析主干上的 **Conventional Commits** 提交历史，自动维护一个长期存在的「**Release PR**」——把待发布的版本号、CHANGELOG 预览、清单文件更新都攒在这个 PR 里，并随后续提交持续刷新。**这个 Release PR 就是发布闸门：你不合它，就永远不发版；一旦合并，release-please 才真正打 tag、建 GitHub Release、写回版本号与 changelog。** 版本号从提交类型「推断」而来（`fix`→patch、`feat`→minor、破坏性变更→major），无需人工决定；配合 **manifest 模式**（`release-please-config.json` + `.release-please-manifest.json`）可管理 monorepo 多包、多语言（Node/Python/Go/Rust/Java/PHP/Ruby 等 20+ release type）。它与 GitHub 平台深度绑定，官方推荐通过 `release-please-action` 接入 GitHub Actions。（Apache-2.0，非 Google 官方产品。）

## 概述

- **Google 出品、GitHub-native**：由 googleapis 组织维护，围绕 GitHub 的 PR / Release / Label / Actions 生态设计，不支持 GitLab、Bitbucket 等其它平台。
- **Release PR 作闸门**：与 semantic-release「CI 上自动发版」不同，release-please 把「是否发版、发什么版本」收敛成「要不要合并这个 Release PR」这一个人工动作，发布节奏完全可控。
- **版本从 commit 推断**：遵循 Conventional Commits，`fix:`→patch、`feat:`→minor、`feat!:` / `BREAKING CHANGE`→major，无需手写 changelog 或版本号。
- **合并即发布**：合并 Release PR 后，工具自动更新版本文件与 CHANGELOG、打 Git tag、创建 GitHub Release，并翻转 `autorelease:*` 标签标记发布状态。
- **多语言 + monorepo**：单包用简单版本号；monorepo 用 manifest 两文件，一次 PR 覆盖多包（或每包独立 PR），每个包可指定不同 release type。
- **两种接入方式**：官方推荐 `googleapis/release-please-action@v4`（GitHub Actions），也可用 `release-please` CLI（`npm i release-please -g`）在本地或自建流水线调用与调试。

## 本叶地图

- [入门](./getting-started) —— release-please 的定位、Release PR 机制、合并即发布的完整闭环、Conventional Commits 如何驱动版本
- [Release PR 机制](./guide-line/release-pr) —— Release PR 如何持续累积版本与 changelog、合并才打 tag/建 Release、随新提交刷新、无相关提交则不推进、版本策略与覆盖
- [monorepo 与 manifest 模式](./guide-line/monorepo-manifest) —— `release-please-config.json` + `.release-please-manifest.json`、组合 PR vs 每包独立 PR、多语言 release type、workspace 插件
- [CI 接入与选型](./guide-line/ci-selection) —— `release-please-action`、`release_created` 输出触发 npm publish、GitHub 平台绑定、与 semantic-release / Changesets 的对比
- [参考](./reference) —— 配置字段 / CLI / Action 输入输出 / 标签 / 常见坑速查表 + 权威链接

## 文档地址

- [release-please（GitHub 仓库）](https://github.com/googleapis/release-please) —— README + `docs/` 全量文档
- [release-please-action（GitHub Action）](https://github.com/googleapis/release-please-action) —— Action 的 inputs / outputs / 工作流示例
- [manifest-releaser.md](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md) —— manifest 模式与 monorepo 配置详解
- [customizing.md](https://github.com/googleapis/release-please/blob/main/docs/customizing.md) —— changelog、版本策略、extra-files 等定制
- [cli.md](https://github.com/googleapis/release-please/blob/main/docs/cli.md) —— CLI 命令与 bootstrap
- [Conventional Commits 规范](https://www.conventionalcommits.org/) —— 版本推断所依据的提交约定

## 幻灯片地址

- <a href="/SlideStack/release-please-slide/" target="_blank">release-please</a>
