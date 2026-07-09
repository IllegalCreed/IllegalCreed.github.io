---
layout: doc
---

# OpenTofu

OpenTofu 是 **Terraform 的开源分叉（fork）**，也是当下「基础设施即代码（IaC）」领域里与 Terraform 同源的另一极。它的由来是一场许可风波：**2023 年 8 月 HashiCorp 把 Terraform 的许可从开源的 MPL 2.0 改成非开源的 BUSL 1.1（Business Source License）**，社区在数周内发起分叉、9 月被 **Linux 基金会（Linux Foundation）**接纳为正式项目，坚持沿用 Terraform 改版前的 **MPL 2.0** 开源许可，命令行工具从 `terraform` 改名为 **`tofu`**。它的定位一句话说清——**「把一个被全行业依赖的基础设施工具，留在真正开源、厂商中立的轨道上」**：因此分叉初期它是 Terraform 的 **drop-in 替代（drop-in replacement）**，同一套 HCL、同一种 state 文件格式、同一批 CLI 命令、同一批 provider，把 `terraform` 换成 `tofu` 几乎原样就能跑。**2024 年 1 月 `tofu` 1.6.0 首个稳定版发布**、宣布可用于生产；此后两边在各自的治理下独立演进，OpenTofu 长出了 Terraform 开源版本没有的能力——最具代表性的是**客户端 state/plan 加密**，以及 `-exclude`、provider 的 `for_each` 迭代、`enabled` 元参数、OCI 制品仓库支持等。到 2026 年，OpenTofu 稳定在 **1.12.x**，「选 Terraform 还是 OpenTofu」已成为每个团队引入 IaC 时都要正面回答的问题。

## 概述

- **定位**：**Terraform 的开源分叉**，不是全新工具——继承 Terraform 的声明式模型、HCL、工作流与 provider 生态，只在**许可、治理与部分特性**上分道。
- **因何而生**：**MPL 2.0 → BUSL 1.1** 的许可变更（2023-08-10）让「用 Terraform 是否构成与 HashiCorp 竞争」变得含糊，社区为消除这种不确定性而分叉。**Terraform 1.5.x 是最后的 MPL 版本**，OpenTofu 从这里接棒。
- **治理与许可**：由 **Linux 基金会**托管（「a Series of LF Projects, LLC」），**MPL 2.0** 开源、**厂商中立**、技术指导委员会（TSC）+ 公开 RFC 决策；对标「Linux 由基金会而非单一公司掌舵」的模式。
- **命令行**：CLI 名为 **`tofu`**（对应 `terraform`）；配置文件用 `.tofurc` / `tofu.rc`，但**环境变量前缀 `TF_`、`terraform {}` 块名、`.terraform.lock.hcl` 锁文件等大量保留**以维持兼容。
- **drop-in 兼容（分叉初期）**：同 HCL、同 state 格式（兼容至 Terraform 1.5.x/1.6）、同命令、同 provider；迁移常常只是「装 `tofu`、`tofu init` 一下」。
- **差异化特性**：**客户端 state/plan 加密（1.7）**是招牌；此外有 provider-defined functions、`.tofu` 文件、early variable evaluation（1.8）、provider `for_each`、`-exclude`（1.9）、OCI registry（1.10）、`enabled` 元参数与 ephemeral（1.11）等。
- **Registry**：OpenTofu 有独立的 **registry.opentofu.org / search.opentofu.org**，但**不自造 provider**——复用现有 Terraform provider（其许可未变）。
- **各自演进 → 特性分叉**：两边都在动，OpenTofu-first 的特性未必进 Terraform，反之亦然；跨工具迁移与长期选型都要把「未来会越差越远」计入。

## 本叶地图

- [入门](./getting-started) —— OpenTofu 是什么、因 BUSL 许可变更而分叉的来龙去脉、`tofu` CLI、与 Terraform 的 drop-in 兼容、一致的 `init/plan/apply` 工作流与第一个配置
- [治理与许可](./guide-line/governance-license) —— Linux 基金会开放治理（TSC / RFC）、MPL 2.0 vs BUSL 1.1 的实质差异、社区贡献路径、对供应链与许可合规风险的意义
- [兼容与 CLI](./guide-line/compatibility-cli) —— drop-in 兼容的**边界**（HCL/state/命令/provider 一致，`.tofu` 文件、`.tofurc`、保留的 `TF_` 与 `terraform` 块）、`tofu` 命令面、OpenTofu Registry 与 provider 复用
- [差异化特性与迁移选型](./guide-line/features-migration) —— **客户端 state/plan 加密**、`-exclude`、provider `for_each`、`enabled`、OCI registry 等 OpenTofu-only 能力；迁移四步与回退成本；「各自演进后特性分叉」与 OpenTofu vs Terraform 选型
- [参考](./reference) —— `tofu` 命令速查、OpenTofu-only 特性 × 版本对照、许可/分叉时间线、兼容项、迁移检查清单、坑与权威链接

## 文档地址

- [OpenTofu 官方文档](https://opentofu.org/docs/) —— Intro / Language / CLI / Internals 全部一手来源，按 v1.6~v1.12 分版本
- [OpenTofu 官网](https://opentofu.org/) · [分叉公告](https://opentofu.org/blog/opentofu-announces-fork-of-terraform/) · [宣言 Manifesto](https://opentofu.org/manifesto/) —— 分叉背景与「真正开源」五原则
- [迁移指南](https://opentofu.org/docs/intro/migration/) · [What's new](https://opentofu.org/docs/intro/whats-new/) —— 从 Terraform 迁移步骤、各版本新特性
- [state/plan 加密文档](https://opentofu.org/docs/language/state/encryption/) —— 招牌差异化特性的配置与 key provider
- [OpenTofu Registry](https://registry.opentofu.org/) · [search.opentofu.org](https://search.opentofu.org/) —— provider 与 module 检索
- [GitHub: opentofu/opentofu](https://github.com/opentofu/opentofu) —— 源码、Release、CHANGELOG、RFC、LICENSE（MPL 2.0）核对源
- [FAQ](https://opentofu.org/faq/) —— 兼容性、治理、provider 复用等常见问题一手答复

## 幻灯片地址

- <a href="/SlideStack/opentofu-slide/" target="_blank">OpenTofu</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=opentofu" target="_blank" rel="noopener noreferrer">OpenTofu 测试题</a>
