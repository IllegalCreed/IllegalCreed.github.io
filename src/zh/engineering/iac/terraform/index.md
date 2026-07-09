---
layout: doc
---

# Terraform

Terraform 是 HashiCorp 出品、当今**基础设施即代码（Infrastructure as Code, IaC）**领域事实标准的工具：用一套**声明式**配置语言（**HCL**）描述你想要的云资源与本地资源的**期望状态（desired state）**，Terraform 负责算出「现状 → 期望」的差异并驱动各家 API 把它变成现实。它的心智一句话说清——**你写「要什么」，不写「怎么做」**：声明一个 `aws_instance`、一个 `google_sql_database`、一个 `cloudflare_record`，`terraform apply` 就把它们建出来；改配置再 `apply`，Terraform 只做**增量差异**；删掉配置再 `apply`，对应资源被销毁。它不绑定任何一家云——靠 **Provider** 插件对接 AWS/Azure/GCP/Kubernetes/GitHub/Cloudflare 等**几千个平台**，所有 Provider 集中在 **Terraform Registry** 发布。核心工作流固定为 **write（写 HCL）→ `init`（装 Provider、连 backend）→ `plan`（生成执行计划）→ `apply`（执行）→ `destroy`（销毁）**，其中 **state（状态文件）**记录「配置里的资源」与「真实世界里的对象」的一一映射，是 Terraform 的「真相之源」。2023 年 Terraform 经历了历史性转折：**8 月 HashiCorp 把开源许可从 MPL 2.0 改成 BUSL 1.1（Business Source License，非开源的 source-available 许可）**，社区随即在 8 月 25 日发起分叉、9 月被 Linux Foundation 接纳为 **OpenTofu**（保持 MPL 2.0、命令名 `tofu`、作为 Terraform 1.6 的 drop-in 替代）；2025 年 2 月 **IBM 以约 64 亿美元完成对 HashiCorp 的收购**。因此今天谈「Terraform」，本质上是在谈「Terraform（BUSL）+ OpenTofu（MPL）」这对同源双生。

## 概述

- **定位**：**声明式 IaC** 工具——用 HCL 描述期望状态，Terraform 通过 Provider 调各家 API 把基础设施收敛到该状态；**多云 / 平台无关**是它相对 CloudFormation（仅 AWS）等厂商专属方案的最大差异化。
- **核心工作流**：`write → init → plan → apply → destroy`。**`plan` 是灵魂**——它把「将新增/修改/销毁哪些资源」以 diff 形式先给你审，再决定是否 `apply`；这套「先看后做」的安全感是 Terraform 的核心价值。
- **期望状态 + 幂等**：配置描述目标而非步骤，反复 `apply` 会**收敛**到同一状态（幂等）；Terraform 靠 **state + 依赖图（DAG）**决定创建/更新/销毁顺序与并发。
- **语言与复用**：HCL 提供 `resource`/`data`/`variable`/`output`/`locals`/`module` 等块；**Module（模块）**是复用单元，公共 **Registry** 上有海量现成模块（VPC、EKS 等）可直接引用。
- **许可与分叉（关键背景）**：2023-08 **MPL 2.0 → BUSL 1.1**；**1.5.x 是最后的 MPL 版本，1.6.0 起为 BUSL**。社区分叉出 **OpenTofu**（Linux Foundation 治理、MPL 2.0、命令 `tofu`、drop-in 兼容），2026 年二者并行演进，选型时必须先想清楚「Terraform 还是 OpenTofu」。
- **协作与商业**：`Terraform Cloud` 于 2024-04 更名 **HCP Terraform**（远程 state/plan/apply、策略、私有 Registry）；企业自托管版为 Terraform Enterprise。
- **横向选型**：与 **Ansible** 互补（Terraform 管**资源供给 provisioning**、声明式；Ansible 管**配置/编排 configuration management**、过程式）；与 **Pulumi** 分野在「HCL DSL vs 通用编程语言」。

## 本叶地图

- [入门](./getting-started) —— IaC 与声明式是什么、Provider 与 `required_providers`、`init`/`plan`/`apply`/`destroy` 全流程、第一个 `resource`、期望状态与幂等的心智
- [配置语言](./guide-line/language) —— HCL 语法、`resource` vs `data`、`variable`/`output`/`locals`、`count` vs `for_each`、隐式/显式依赖图与 `depends_on`、`lifecycle` 五件套
- [状态管理](./guide-line/state) —— state 是什么与为什么、本地 state 之痛 → 远程 `backend`（S3/GCS/azurerm）、**state locking**、drift 与 `refresh`、`import` 已有资源、**敏感值明文进 state 的风险**、`state mv/rm` 手术
- [模块化](./guide-line/modules) —— `module` 块与 `source`/`version`、输入变量与输出、Registry 与 Git/本地来源、版本约束、组合优于继承、目录结构约定
- [生态与工程化](./guide-line/ecosystem) —— **BUSL 许可与 OpenTofu 分叉**（时间线/兼容性/选型）、HCP Terraform、workspace 多环境、CI/CD 中的 plan/apply 门禁、OIDC 免长期密钥、provisioners 是最后手段、与 Ansible 互补
- [参考](./reference) —— CLI 全命令 + 顶层块 + meta-arguments + 常用函数 + 环境变量 + 坑 + 许可/版本时间线，共九张速查表与权威链接

## 文档地址

- [Terraform 官方文档总入口](https://developer.hashicorp.com/terraform) —— Intro / CLI / Language / Registry 全部一手来源
- [CLI 命令参考](https://developer.hashicorp.com/terraform/cli/commands) · [配置语言](https://developer.hashicorp.com/terraform/language) —— 命令行与 HCL 块/表达式/函数
- [Terraform Registry](https://registry.terraform.io/) —— Provider 与 Module 的官方发布与检索平台
- [HashiCorp 许可 FAQ](https://www.hashicorp.com/en/license-faq) —— MPL → BUSL 变更、竞品条款、4 年转 MPL 的一手说明
- [OpenTofu 官网](https://opentofu.org/) · [分叉公告](https://opentofu.org/blog/opentofu-announces-fork-of-terraform/) —— 分叉背景、Linux Foundation 治理、迁移指南
- [GitHub: hashicorp/terraform](https://github.com/hashicorp/terraform) · [opentofu/opentofu](https://github.com/opentofu/opentofu) —— 源码、Release 与许可文件核对源

## 幻灯片地址

- <a href="/SlideStack/terraform-slide/" target="_blank">Terraform</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=terraform" target="_blank" rel="noopener noreferrer">Terraform 测试题</a>
