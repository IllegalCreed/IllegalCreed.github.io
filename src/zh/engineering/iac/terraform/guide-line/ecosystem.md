---
layout: doc
outline: [2, 3]
---

# 生态与工程化：许可、协作与 CI/CD

> 基于 Terraform（1.x）· 核于 2026-07

## 速查

- **2023-08-10**：HashiCorp 宣布把 Terraform 等产品许可从 **MPL 2.0** 改为 **BUSL 1.1（Business Source License）**——**source-available 但非开源**。
- **版本分界**：**Terraform 1.5.x 是最后的 MPL 版本，1.6.0 起为 BUSL**。
- **BUSL 是什么**：源码可见可改可自用，但**禁止把它做成与 HashiCorp 竞争的商业产品**；每个版本发布 **4 年后自动转为 MPL 2.0**（Change License）。
- **OpenTofu**：社区对 BUSL 的回应——**2023-08-25 分叉**（初名 OpenTF），**2023-09-20 进入 Linux Foundation**；MPL 2.0、命令 `tofu`、作为 Terraform 1.6 的 **drop-in 替代**、向后兼容更早版本。
- **选型第一问**：新项目先定「**Terraform（BUSL）还是 OpenTofu（MPL）**」——绝大多数用法二者通用，纯开源诉求/规避许可风险选 OpenTofu。
- **HCP Terraform**：`Terraform Cloud` 于 **2024-04 更名**——远程 state/plan/apply、私有 Registry、策略即代码（Sentinel/OPA）、VCS 集成；自托管版为 Terraform Enterprise。
- **IBM 收购**：2024-04 宣布、**2025-02-27 以约 64 亿美元完成**对 HashiCorp 的收购。
- **workspace**：CLI workspace 用**一份配置切多份 state**（`terraform workspace`）；HCP 的 workspace 是另一套更重的概念，别混。
- **多环境**：小场景用目录 + `-var-file` 分 env，大场景用 workspace 或每环境独立 state；**dev/stg/prod 各自独立 state** 更安全。
- **CI/CD**：PR 阶段 `plan`（评论差异做 review 门禁）、合并后 `apply`；用 `plan -out` 固化、`apply` 执行同一份。
- **OIDC**：CI 里用 **OIDC 联邦**换云的临时凭据，取代长期 access key 塞 secrets。
- **provisioners 是最后手段**：`local-exec`/`remote-exec`/`file` 官方明确「不到万不得已别用」；配置管理交给 Ansible。
- **与 Ansible 互补**：Terraform 管**资源供给**（声明式、建/改/删基础设施），Ansible 管**配置/编排**（过程式、装软件/改配置）。

## 一、2023 许可变更：MPL → BUSL（必须弄清的背景）

Terraform 自 2014 年开源以来一直用 **MPL 2.0（Mozilla Public License）**这一 OSI 认证的开源许可。2023 年 8 月 10 日，HashiCorp 宣布将旗下 Terraform、Vault、Consul、Nomad、Packer、Boundary、Waypoint、Vagrant 等**核心产品的源码许可改为 BUSL 1.1（Business Source License，常写作 BSL/BUSL）**，自各产品的下一个版本起生效。对 Terraform 而言，**1.5.x 是最后一个 MPL 版本，1.6.0（2023 年 10 月）成为第一个 BUSL 版本**。

BUSL 1.1 **不是开源许可**，而是「source-available（源码可见）」许可，核心条款：

- **可自由查看、修改、内部使用**：绝大多数使用者（企业内部用它管自己的基础设施、学习、二开自用）**几乎不受影响**。
- **限制「竞争性使用」**：**不得**把 Terraform 做成与 HashiCorp 商业产品竞争的**托管/商业产品**去卖。这一条精准指向那些把 Terraform 包装成 SaaS 卖的第三方平台。
- **4 年后自动开源**：每个受 BUSL 覆盖的版本，在发布 **4 年后**其许可自动转为指定的 **Change License（即 MPL 2.0）**。

HashiCorp 的官方理由是保护其商业模式免受「搭便车」的竞品侵蚀；但对社区而言，一个曾经的开源基石变成「非开源」，触发了强烈反弹。

## 二、OpenTofu 分叉

社区的回应迅速而有组织：

- **2023-08-25**：一批公司与个人发起 **OpenTF Manifesto**，呼吁 HashiCorp 撤回许可变更；短期内获数万 star、上百家公司与数百名个人联署。HashiCorp 未响应后，社区**正式分叉** Terraform，项目公开（初名 OpenTF，后改名 **OpenTofu**）。
- **2023-09-20**：项目被 **Linux Foundation** 接纳，成为中立、社区治理的开源项目，由跨多家组织的技术指导委员会（TSC）管理。

OpenTofu 的关键事实：

- **许可**：回归 **MPL 2.0**，真正的开源。
- **命令名**：`tofu`（`tofu init` / `tofu plan` / `tofu apply`……）。
- **兼容性**：作为 **Terraform 1.6 的 drop-in（直接替换）**，并**向后兼容更早版本**——HCL、state 格式、Provider/模块 Registry 生态大体通用，多数项目可平滑迁移。
- **演进**：此后 OpenTofu 独立发布自己的版本，逐步引入自有特性（如早期的 state 加密、`for_each` 增强等），与 Terraform 走向**同源但各自演进**。

::: warning 选型第一问：Terraform 还是 OpenTofu
新项目动手前先定这件事：
- **要纯开源 / 规避 BUSL 竞争条款风险 / 认同社区治理** → **OpenTofu**（`tofu`，MPL）。
- **深度用 HCP Terraform、依赖 HashiCorp 商业支持与生态** → **Terraform**（BUSL）。
日常 HCL 写法、工作流、Provider 用法二者高度一致，本叶大部分内容对两者都适用；差异集中在个别新特性与许可。
:::

补充时间线：**2024-04** `Terraform Cloud` 更名 **HCP Terraform**；同月 **IBM 宣布收购 HashiCorp**，交易于 **2025-02-27 以约 64 亿美元完成**——这也是「Terraform 归属」这一常被问及问题的现状答案。

## 三、HCP Terraform 与 Terraform Enterprise

纯 CLI + 远程 backend 能满足很多团队，但协作到一定规模会想要一个「控制面」。HashiCorp 的商业协作产品：

- **HCP Terraform**（原 Terraform Cloud，2024-04 更名）：托管的远程 **state 存储 + 远程 plan/apply（在其 runner 上执行）**、VCS 集成（PR 触发 plan）、**私有模块 Registry**、**策略即代码**（Sentinel / OPA 做合规门禁）、团队与权限、成本预估等。有免费档。
- **Terraform Enterprise**：上述能力的**自托管**版本，供有数据驻留/隔离要求的企业私有部署。

用 CLI 接入 HCP Terraform 通过 `cloud` 块（取代传统 backend 块）：

```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "prod-network"
    }
  }
}
```

开源栈里，Spacelift、env0、Atlantis 等第三方编排平台提供类似的协作/门禁能力，可与 Terraform 或 OpenTofu 搭配。

## 四、workspace 与多环境

「一套配置，多个环境（dev/staging/prod）」是普遍需求，几种做法层次分明：

**CLI workspace**——用**同一份配置**维护**多份独立 state**：

```bash
terraform workspace new prod
terraform workspace select prod
terraform workspace list
# 配置里可用 terraform.workspace 取当前名做条件
```

```hcl
locals {
  instance_type = terraform.workspace == "prod" ? "m5.large" : "t3.micro"
}
```

它轻量，但所有环境共用一份代码、一个 backend 前缀，**容易误操作到错误环境**，也不适合环境间差异很大的情况。

::: tip 别把两种 workspace 搞混
**CLI workspace**（上面这个）和 **HCP Terraform 的 workspace** 是**两个不同概念**：前者是「一份配置的多份 state」，后者是 HCP 里一个更重的、带自己 state/变量/运行历史的管理单元。文档和讨论里都叫 workspace，务必分清语境。
:::

**更稳妥的多环境**：为每个环境用**独立目录 + 独立 backend/state**（`environments/prod/`、`environments/dev/`），共享逻辑抽成模块。这样 prod 的 state 物理隔离，`apply` 时不可能误伤别的环境——生产项目更推荐这种。差异化参数用 `-var-file=prod.tfvars` 注入。

## 五、CI/CD 中的 plan 与 apply

把 Terraform 搬进流水线的标准姿势，是把 **`plan` 当「代码 review」、`apply` 当「合并部署」**：

1. **PR 阶段跑 `plan`**：CI 执行 `terraform plan -out=tfplan`，把**变更差异贴到 PR 评论**里，让人审「这次会动哪些资源」。这是 IaC 最强的安全阀——**基础设施变更像代码一样被 review**。
2. **合并后跑 `apply`**：主干合并触发 `terraform apply tfplan`，**严格执行 PR 里审过的那份计划**（用 `-out` 固化，避免「审的和执行的不是同一份」）。
3. **门禁**：`plan` 失败、有非预期销毁、或策略检查（Sentinel/OPA/tflint/checkov）不过，则卡住合并。

```yaml
# 概念示意（GitHub Actions），配置语法见 devops 章
jobs:
  plan:
    steps:
      - run: terraform init
      - run: terraform plan -out=tfplan       # PR 上生成计划并评论
  apply:
    needs: plan
    if: github.ref == 'refs/heads/main'
    steps:
      - run: terraform apply -auto-approve tfplan  # 合并后执行同一份计划
```

## 六、OIDC：告别长期密钥

CI 里最忌讳把云的长期 access key 塞进 secrets——一旦泄露就是灾难。现代做法是 **OIDC 联邦**：CI 平台（GitHub Actions / GitLab 等）作为 OIDC Provider 签发短期身份令牌，云侧（AWS IAM / GCP / Azure）配置**信任关系**，用该令牌换取**有效期几分钟的临时凭据**。

好处：**没有任何长期密钥落在 secrets 里**，凭据用完即弃、权限可按 workflow 精确约束。这套机制与 Terraform 无关、属于 CI 与云的联邦认证，但它是「Terraform 在 CI 里安全跑」的前提配置（OIDC 细节见 devops 章的 GitHub Actions 篇）。

## 七、provisioners：最后手段

`resource` 里可以挂 **provisioner** 在资源创建/销毁时执行命令：

```hcl
resource "aws_instance" "web" {
  # ...

  provisioner "remote-exec" {          # 在远程机器上跑命令
    inline = ["sudo apt-get update"]
    connection {
      type = "ssh"
      host = self.public_ip
      user = "ubuntu"
    }
  }

  provisioner "local-exec" {           # 在跑 terraform 的本机跑命令
    command = "echo ${self.public_ip} >> hosts.txt"
  }
}
```

三种：`file`（传文件）、`local-exec`（本机执行）、`remote-exec`（远程执行）。但**官方明确建议把 provisioner 当最后手段**（a last resort）——它们**破坏声明式与幂等**（命令未必幂等）、**不进 plan**（Terraform 看不到它会做什么、无法预演）、失败处理麻烦。能用云原生方式（user_data / cloud-init / 镜像烘焙）或配置管理工具（Ansible）解决的，就别用 provisioner。需要一个「无副作用占位资源」挂逻辑时，用内置 `terraform_data`（替代旧 `null_resource`）。

## 八、与 Ansible 互补：供给 vs 配置

Terraform 常被拿来和 Ansible 比，但二者更多是**互补**而非替代，分工清晰：

| 维度 | Terraform | Ansible |
| --- | --- | --- |
| **定位** | 资源供给（provisioning） | 配置管理 / 编排（config management） |
| **范式** | **声明式**（描述期望状态） | 主要**过程式**（描述步骤，playbook） |
| **擅长** | 建/改/删**基础设施本身**（VM、网络、DNS、云服务） | 在**已有机器上**装软件、改配置、部署应用 |
| **状态** | 有 **state** 跟踪真实世界 | 无持久 state，靠模块的幂等实现收敛 |
| **典型协作** | 先 Terraform 把机器和网络建出来 | 再 Ansible 上去把软件配好 |

经典组合就是：**Terraform 供给基础设施 → Ansible 做机器内配置**。理解这条边界，能避免用错工具（比如硬用 provisioner 在 Terraform 里干 Ansible 的活）。

至此，Terraform 的语言、状态、模块、生态四块都讲透了。命令、关键字、函数、环境变量与坑的速查，见[参考篇](../reference)。
