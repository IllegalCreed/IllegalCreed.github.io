---
layout: doc
---

# Pulumi

Pulumi 是当今 **IaC（Infrastructure as Code，基础设施即代码）**领域里「用真实编程语言写基础设施」这一流派的代表：它**不发明新的配置 DSL**，而是让你直接用 **TypeScript / JavaScript / Python / Go / C#（.NET）/ Java** 这些通用编程语言（也支持 **YAML** 这种标记语言）来描述云资源——于是你手里的 `for` 循环、`if` 条件、函数、类、包管理器、IDE 自动补全与类型检查、以及本语言现成的单元测试框架，**全都能直接用在基础设施代码上**。但请记住关键的一层：**这些语言只是「前端」，Pulumi 底层依然是声明式的期望状态（desired state）引擎**——你的程序运行时不会真的去调云 API，而是把「我想要哪些资源、它们长什么样」**声明**给 Pulumi 的**部署引擎（deployment engine）**；引擎再对比「上一次部署的状态」算出差异（`+` 建 / `~` 改 / `+-` 替换 / `-` 删），最后交给**资源提供者（provider）**去调各家云的 API 落地。心智一句话：**你用命令式语言「搭出」一张声明式的资源图，Pulumi 负责把现状收敛到这张图。**它的部署单元叫 **stack（栈）**——同一套程序的一个**隔离的、可独立配置**的实例（`dev` / `staging` / `production` 各一个 stack，各有独立的 config 与 state）。state 默认托管在 **Pulumi Cloud**，也可以自管到 **S3 / Azure Blob / GCS / 本地文件 / PostgreSQL**；secrets 默认**加密**存进 state。Pulumi 的引擎、SDK、CLI 都是 **Apache 2.0 开源**，商业化主要在 Pulumi Cloud（协作、策略、Deployments、ESC）。

## 概述

- **定位**：**「通用编程语言 + 声明式引擎」的 IaC**。用 TS/Python/Go/C#/Java/YAML 写「要什么」，Pulumi 用期望状态引擎算差异并落地——**语言是命令式的，模型是声明式的**，这是理解 Pulumi 的第一把钥匙。
- **与 Terraform 的分野**：同为声明式 IaC，最大差异是**「真实语言 vs HCL DSL」**。Pulumi 天然拥有循环/条件/类/包/测试框架/IDE 能力；代价是**必须自律地保证程序的确定性**（同一程序每次跑出同一张资源图）。
- **核心工作流**：`pulumi new`（起项目）→ 写程序 → `pulumi preview`（看 diff，只算不做）→ `pulumi up`（执行）→ `pulumi refresh`（同步真实态）→ `pulumi destroy`（拆除）。
- **stack（栈）**：程序的一个隔离实例 = 一个环境。`Pulumi.yaml` 定义项目，`Pulumi.<stack>.yaml` 存该 stack 的 config 与加密后的 secrets。
- **Output&lt;T&gt; 是灵魂**：资源属性是**创建后才知道**的异步值（类似 promise），不能直接当普通值用；要用 `.apply()` / `pulumi.all()` / `pulumi.interpolate` 变换，Pulumi 借此**自动追踪资源依赖**并传播 secret 标记。
- **Component Resource**：把一组资源封装成**单个可复用、可跨语言分发**的高阶抽象（如 `SecureS3Bucket`）——是 Pulumi 复用与治理的核心单元。
- **provider 生态**：既有**原生 provider**（按云 API 规范生成，如 Azure Native、Kubernetes），也能**桥接任意 Terraform provider**（Pulumi Terraform Bridge，AWS/GCP 等大量 Registry 包如此而来），生态几乎无死角。
- **state 与 secrets**：state 默认在 **Pulumi Cloud**，可自管到 S3/Azure/GCS/本地/PostgreSQL；secrets **默认加密**进 state（每 stack 独立密钥，可换 KMS/Key Vault/GCP KMS/Vault/passphrase）——这点相对 Terraform「state 明文」是重要优势。
- **Automation API**：不经 CLI，用 SDK **在自己的程序里驱动 Pulumi 引擎**（up/preview/destroy），用于自助平台、CI/CD、集成测试、自定义 CLI。
- **策略即代码（Policies / CrossGuard）**：用 TS/Python/OPA Rego 写策略包，在 `preview`/`up` 时**拦截违规**（如公有桶），也能对 Terraform/CloudFormation 资源生效。

## 本叶地图

- [入门](./getting-started) —— Pulumi 定位与「命令式语言 → 声明式引擎」的心智、语言宿主/引擎/provider 三层、`pulumi new`→`preview`→`up`→`destroy` 全流程、第一个程序与 stack output
- [编程模型](./guide-line/programming-model) —— `Input<T>`/`Output<T>` 与 `apply`/`all`/`interpolate`、资源与逻辑名/自动命名、13 个 resource options、用循环/条件/函数/类消除重复、`setMocks` 单元测试
- [组件与复用](./guide-line/components-and-reuse) —— Component Resource 编写（type token / `parent` / `registerOutputs`）、多语言 Package 与 `pulumi package add`、Stack Reference 跨栈组合、显式 provider 与多区域
- [栈·配置·密钥·状态](./guide-line/state-config-secrets) —— stack 与多环境、`Pulumi.<stack>.yaml` 配置（`config.require`/结构化）、secrets 加密与 secret provider、state 后端 Cloud vs 自管（S3/Azure/GCS/本地/PG）、`login`/迁移/`refresh`、ESC
- [生态与选型](./guide-line/ecosystem-selection) —— provider 原生 vs 桥接 TF、Automation API、Policies/CrossGuard 策略即代码、**通用语言的非确定性风险**、Pulumi Cloud vs 自托管、与 Terraform 全面对比与选型
- [参考](./reference) —— CLI 全命令 + 核心概念 + resource options + Output 操作 + 后端 login + secret provider + 常见坑 + 与 Terraform 术语对照，多张速查表与权威链接

## 文档地址

- [Pulumi 官方文档总入口](https://www.pulumi.com/docs/) —— IaC / ESC / Deployments / Insights / Reference 全部一手来源
- [IaC 概念](https://www.pulumi.com/docs/iac/concepts/) · [How Pulumi works](https://www.pulumi.com/docs/iac/guides/basics/how-pulumi-works/) —— 语言宿主/引擎/provider 三层与期望状态模型
- [Pulumi Registry](https://www.pulumi.com/registry/) —— provider 与 Package 的官方检索平台（原生 + 桥接）
- [Pulumi vs Terraform](https://www.pulumi.com/docs/iac/comparisons/terraform/) —— 官方逐项对比（语言、state、secrets、策略、许可、provider 桥接）
- [CLI 参考](https://www.pulumi.com/docs/iac/cli/) · [Automation API](https://www.pulumi.com/docs/iac/packages-and-automation/automation-api/) —— 命令行与可编程接口
- [GitHub: pulumi/pulumi](https://github.com/pulumi/pulumi) —— 引擎/CLI/SDK 源码（Apache 2.0）与 Release 核对源

## 幻灯片地址

- <a href="/SlideStack/pulumi-slide/" target="_blank">Pulumi</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=pulumi" target="_blank" rel="noopener noreferrer">Pulumi 测试题</a>
