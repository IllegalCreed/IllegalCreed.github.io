---
layout: doc
---

# Dependabot

**Dependabot 是 GitHub 原生、开箱即用的依赖维护机器人。** 把一份 `.github/dependabot.yml` 提交进仓库，它就定期扫描依赖清单、自动开升级 PR（version updates）；同时基于 GitHub Advisory Database 盯着已知漏洞，一旦命中就自动开「最小必要升级」的修复 PR（security updates）。整条链路跑在 GitHub 里——无需自建服务、无需第三方 App，与 PR、Actions、Security 告警面板天然联动。

## 概述

Dependabot 源自 GitHub 2019 年的收购，如今是平台内置能力，更新引擎开源在 `github/dependabot-core`。它有三块能力、两条主线：

- **Dependabot alerts（告警）**：只读检测。基于 **GitHub Advisory Database（GHSA）** 比对仓库的依赖图，发现引入了已知漏洞的依赖就在 Security 面板报警，不改一行代码。
- **Dependabot security updates（安全更新）**：针对告警自动开 PR，把有漏洞的依赖抬到「**含补丁的最低版本**」——即最小必要升级。
- **Dependabot version updates（版本更新）**：与漏洞无关，按你配置的节奏把依赖升到新版，保持「不落后」。

开箱程度是它最大的卖点：**alerts 与 security updates 是仓库设置里的开关**（对多数仓库近乎默认开启），几乎零配置；只有 **version updates 必须写 `dependabot.yml`** 才会生效。

定位上，Dependabot 胜在聚焦、简单、与 GitHub 深绑；跨平台（GitLab / Bitbucket…）、高度定制、开箱 automerge 等诉求则是 Renovate 的强项——二者取舍见对比页。

## 本叶地图

- [入门](./getting-started) —— 「GitHub 原生」到底意味着什么、三块能力的关系、安全能力近零配置、`dependabot.yml` 最小示例、PR 如何 review 与合并
- [配置详解 dependabot.yml](./guide-line/config) —— `version: 2` 骨架、`package-ecosystem` 取值、`directory`/`directories`、`schedule.interval`、`open-pull-requests-limit`、`allow`/`ignore`、`versioning-strategy`、`target-branch`、`commit-message` 前缀
- [告警·安全更新·分组·命令](./guide-line/security-groups) —— alerts 基于 GHSA 的检测机制、security update 的最小必要升级、`groups` 分组降噪、`@dependabot` 评论命令、私有 registry 凭据
- [与 Renovate 取舍](./guide-line/vs-renovate) —— 两者定位与能力对比、automerge 为何要额外配（GitHub 自动合并 + Actions workflow）、如何二选一避免重复 PR
- [参考](./reference) —— 配置项 / 生态取值 / `versioning-strategy` / 评论命令 / 常见坑五张速查表 + 权威链接

## 文档地址

[Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

## 幻灯片地址

- <a href="/SlideStack/dependabot-slide/" target="_blank">Dependabot</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=dependabot" target="_blank" rel="noopener noreferrer">Dependabot 测试题</a>
