---
layout: doc
outline: [2, 3]
---

# 治理与许可：为什么「谁掌舵、用什么许可」是核心

> 基于 OpenTofu 1.12 · 核于 2026-07

## 速查

- **许可**：OpenTofu 用 **MPL 2.0**（Terraform 2023-08 之前的许可）；Terraform 1.6+ 用 **BUSL 1.1**。
- **MPL 2.0**：**OSI 认证的开源许可**，file-level copyleft——改了 MPL 文件要开源该文件，但可与专有代码共存、可商用、无「竞争」限制。
- **BUSL 1.1**：**source-available 但非开源**——源码可读，但**禁止竞品用途**，通常 **4 年后转为开源许可**（Terraform 承诺转回 MPL 2.0）。
- **托管方**：**Linux 基金会**（「OpenTofu, a Series of LF Projects, LLC」），与 Kubernetes、Linux 同类的中立托管模式。
- **治理结构**：**技术指导委员会（TSC）** 决策重大方向 + **core team / 技术负责人**定优先级；**所有重大变更走公开 RFC**。
- **厂商中立**：由 Gruntwork、Spacelift、Harness、Env0、Scalr 等多方发起，**不受任一公司单独控制**——与「HashiCorp 一家说了算」的根本区别。
- **贡献路径**：GitHub issue / PR / RFC 讨论，社区按 merit（技术价值）决定特性去留，而非商业考量。
- **provider 许可未变**：OpenTofu 复用的 Terraform provider **仍是各自的开源许可**，分叉不影响 provider 生态。
- **供应链意义**：许可确定性 = 不会某天突然「改规则」；开源 = 可自建、可审计、可长期维护，降低单一厂商锁定风险。
- **商标**：从 OpenTF 更名 OpenTofu 正是**商标**原因；命令名用 `tofu`、避免使用 “Terraform” 商标。
- **合规提醒**：企业若在**做与 Terraform/HashiCorp 竞争的产品**，用 BUSL 版 Terraform 有法律风险；OpenTofu（MPL）无此顾虑。

## 一、许可：MPL 2.0 vs BUSL 1.1

OpenTofu 存在的**全部理由**都落在「许可」两个字上。搞清楚这两种许可的实质差异，才理解这场分叉。

### MPL 2.0（OpenTofu / 旧 Terraform）

**Mozilla Public License 2.0** 是 **OSI（Open Source Initiative）认证的开源许可**，属于「弱 copyleft / file-level copyleft」：

- **可自由使用、修改、分发、商用**，没有「不能与谁竞争」这类限制。
- copyleft 作用在**文件级**：你**修改了某个 MPL 文件**，就要把**那个文件**以 MPL 开源；但你可以把 MPL 代码与自己的**专有代码**放在同一个更大的项目里，专有部分不被「传染」。
- 对使用者的心智负担极低：拿来用就是了，不用担心哪天规则变。

### BUSL 1.1（Terraform 1.6+）

**Business Source License 1.1** 是一种 **source-available（源码可见）但不是开源**的许可：

- 源码**公开可读**，日常使用（自己管基础设施）通常不受影响。
- 但**禁止把它用于与授权方（HashiCorp）相竞争的用途**——这条「竞争」限制正是它**不算开源**的原因（OSI 开源定义不允许对使用领域设限）。
- 通常带 **Change Date**：发布 **4 年后**该版本自动转为一个开源许可（Terraform 承诺转回 MPL 2.0）。

::: warning 「source-available」≠「开源」
能看到源码不等于开源。开源（OSI 定义）要求**不得限制使用领域、不得限制「谁能用、用来干嘛」**。BUSL 的「禁止竞品用途」直接违反这一条，所以它是 source-available 而非 open source。宣言的核心焦虑就在这：「竞争」边界模糊，让每个用户都得自我审查。
:::

## 二、Linux 基金会开放治理

许可解决「用什么规则」，**治理**解决「谁来定规则」。OpenTofu 把自己交给 **Linux 基金会**，正是为了回答后者。

- **中立托管**：项目全称是 **「OpenTofu, a Series of LF Projects, LLC」**。Linux 基金会是托管 Linux、Kubernetes 等关键开源项目的中立机构；由它托管，意味着 OpenTofu **不归任何单一公司所有**。
- **技术指导委员会（TSC）**：由来自多家不同组织的成员组成，**对重大变更做决策**。这与「一家公司的产品经理拍板」形成鲜明对比。
- **core team / 技术负责人**：识别优先级、承担日常维护。
- **公开 RFC 流程**：**所有重大变更都要经过公开的 RFC（Request for Comments）评审**——设计写成文档、社区公开讨论、达成共识才落地。你能在 GitHub 上看到每个大特性的来龙去脉。
- **merit 决定特性**：FAQ 明说「**社区决定 OpenTofu 拥有哪些特性**」。取舍依据是技术价值与社区需求，而非某公司的商业化路线。

宣言把这套治理浓缩成「真正开源」的五条原则：**genuine open licensing（许可不会突变）、community governance（凭价值而非商业接纳特性）、vendor neutrality（不依附任一公司）、modular architecture（模块化、利于生态）、backward compatibility（保护存量代码的价值）**。

## 三、社区贡献路径

OpenTofu 是「社区拥有」的项目，贡献路径公开透明：

- **issue / discussion**：报 bug、提需求，在 GitHub 上公开进行。
- **RFC**：较大的设计（新特性、行为变更）先写 RFC，社区评审。这是 OpenTofu 特性诞生的主渠道——state 加密、`enabled` 元参数等都走过 RFC。
- **PR**：代码贡献；因为是 MPL 开源，任何人都能 fork、改、提。
- **provider 生态**：OpenTofu **不自造 provider**，而是复用现有 Terraform provider（其许可未随 Terraform 主体改变），并维护独立的 **registry.opentofu.org**。这意味着分叉**没有撕裂 provider 生态**（详见[兼容与 CLI](./compatibility-cli)）。

## 四、对供应链与许可合规的意义

对企业而言，「选 OpenTofu 还是 Terraform」往往首先是一道**风险题**，而不是特性题。

### 许可确定性

BUSL 最大的问题不是「现在不能用」，而是**「规则可能再变」**带来的长期不确定性。OpenTofu 用 Linux 基金会 + MPL 2.0 给出的承诺是：**许可不会因某家公司的商业决策而突变**。对要把 IaC 作为长期基础设施底座的组织，这种确定性本身就是价值。

### 竞品合规风险

如果你的公司**在做与 Terraform/HashiCorp 相竞争的产品**（比如 IaC 平台、在 CI/CD 中集成 IaC 执行、托管 state 的 SaaS……），继续用 **BUSL 版 Terraform 有实打实的法律风险**——「竞争」边界模糊，可能被认定违反许可。**OpenTofu（MPL 2.0）没有这层顾虑**，这也是众多 IaC 平台厂商（Spacelift、Env0、Scalr 等）率先支持并推动 OpenTofu 的直接动因。

### 供应链与可持续性

- **可自建、可审计**：开源意味着你能自己编译、审计、打补丁，不被「官方二进制」绑架。
- **降低单点依赖**：项目不系于一家公司的存续与商业选择；即便某个赞助方退出，社区与基金会仍能维系。
- **上下游放心**：把 OpenTofu 嵌进自己的产品/平台再分发，许可上是清晰的。

::: tip 一句话决策
**在意「许可会不会变、能不能商用、是否被单一厂商锁定」→ 天平偏 OpenTofu**；如果你已深度绑定 HashiCorp 商业产品（HCP Terraform / Terraform Enterprise）、且不涉及竞品用途，留在 Terraform 也合理。特性层面的取舍见[差异化特性与迁移选型](./features-migration)。
:::
