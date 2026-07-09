---
layout: doc
---

# Renovate

**Renovate 是 Mend 维护的开源依赖更新机器人：** 它扫描仓库里的各类清单文件（`package.json`、`Dockerfile`、`*.tf`、`go.mod`、GitHub Actions 工作流等），发现过期依赖后自动提 Pull Request / Merge Request 升级版本并刷新 lock 文件。它的两大特征是**高度可配**（`renovate.json` + `extends` 预设 + `packageRules` 分层规则，从「一行 extends」到「上百条精细规则」皆可）与**多生态多平台**（90+ 包管理器 × 9 个 Git 平台）。既能用 Mend 托管的 App 一键接入，也能自托管进任意 CI。

## 概述

Renovate 把「跟进依赖版本」这件重复、易拖延的事自动化：定时扫描 → 发现新版本 → 按你的策略分组 / 限流 / 排期 → 提 PR（附 changelog 与兼容性徽章）→ 测试通过后可自动合并。相比 GitHub 原生的 Dependabot，它的差异化在于**极强的可配置性**与**成熟的 monorepo / 多生态支持**。

**优点**

- **覆盖面最广**：npm / pnpm / yarn、Docker、GitHub Actions、Terraform、Helm、Gradle / Maven、pip / poetry / uv、Go modules、Cargo、Composer、NuGet、Bazel、pre-commit 等 90+ 生态开箱即用
- **多平台**：GitHub、GitLab、Bitbucket、Azure DevOps、Gitea / Forgejo、Gerrit、AWS CodeCommit 等 9 个平台，不绑定 GitHub
- **预设体系强**：`extends` 复用官方 / 组织 / 本地预设，`config:recommended` 一行起步；组织可维护一份中心配置，全仓库继承
- **规则精细**：`packageRules` 按包名 / 生态 / 更新类型 / 数据源任意组合，实现分组、排期、自动合并、忽略、稳定期等策略
- **降噪能力**：分组、`schedule` 排期、限流、自动合并、Dependency Dashboard 面板，把「PR 洪水」收敛成可控节奏
- **托管即用**：Mend Renovate App 免费托管，无需自建 cron；也可自托管获得完全掌控

**缺点**

- **配置项极多**：数百个选项 + 上百个预设，深度定制有学习曲线（好在 `config:recommended` 已覆盖大多数场景）
- **自托管有运维成本**：需自备 token、cron、基础设施，并自行升级 Renovate 本身
- **AGPL-3.0 许可**：自托管 CLI 采用 AGPL-3.0，对许可证敏感的组织需评估（用 Mend 托管 App 则不受影响）
- **默认较激进**：不加限流 / 排期时首次接入可能一次性提出大量 PR，需要用预设主动收敛

## 本叶地图

- [入门](./getting-started.md)：Renovate 定位、接入方式（App vs 自托管）、onboarding PR、`renovate.json` 与 `extends: config:recommended`
- [指南 · 配置](./guide-line/config.md)：`packageRules` 匹配与策略、分组、`schedule`、`rangeStrategy`、忽略依赖、Dependency Dashboard、限流
- [指南 · 进阶](./guide-line/advanced.md)：自动合并安全策略、lock 文件维护、`minimumReleaseAge` 稳定期、自定义 manager、组织共享预设、monorepo、Merge Confidence
- [指南 · 安全与 Dependabot](./guide-line/security-vs-dependabot.md)：漏洞 / 安全更新、与 Dependabot 逐项对比、二选一避免重复
- [指南 · 自托管](./guide-line/self-hosting.md)：CLI / Docker / GitHub Action / GitLab Runner、token 与全局配置、`autodiscover`、私有源 `hostRules`、CE/EE
- [参考](./reference.md)：配置文件、常用选项与预设、`rangeStrategy` 速查、踩坑清单与链接

## 文档地址

[Renovate](https://docs.renovatebot.com/)

## GitHub地址

[renovatebot/renovate](https://github.com/renovatebot/renovate)

## 幻灯片地址

- <a href="/SlideStack/renovate-slide/" target="_blank">Renovate</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=renovate" target="_blank" rel="noopener noreferrer">Renovate 测试题</a>
