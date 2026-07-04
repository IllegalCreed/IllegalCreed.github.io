---
layout: doc
outline: [2, 3]
---

# 入门：从许可分叉到 `tofu` 工作流

> 基于 OpenTofu 1.12 · 核于 2026-07

## 速查

- **一句话**：OpenTofu = **Terraform 的开源分叉**，同源、同 HCL、同 state、同命令、同 provider，命令名改叫 **`tofu`**。
- **因何而生**：**2023-08-10 HashiCorp 把 Terraform 许可 MPL 2.0 → BUSL 1.1（非开源）**，社区为保留真正开源的 IaC 工具而分叉。
- **谁在托管**：**Linux 基金会**（LF Projects）；**MPL 2.0** 许可；厂商中立、TSC + 公开 RFC 治理。
- **关键日期**：2023-08-25 分叉公开 → 2023-09-20 入 Linux 基金会并更名 OpenTofu → **2024-01-10 `tofu` 1.6.0 首个稳定版** → 2026 稳定在 **1.12.x**。
- **drop-in 替代**：分叉初期与 Terraform **1.6 对齐**，state 兼容至 **1.5.x**；多数 `.tf` 代码**无需改动**即可用 `tofu` 跑。
- **命令一致**：`tofu init / plan / apply / destroy / fmt / validate / state / import / output` 与 Terraform 同名同义。
- **保留 `TF_`**：`terraform {}` 块名、`TF_VAR_*` 等环境变量、`.terraform.lock.hcl` 锁文件**全部沿用**，兼容优先。
- **安装**：官方脚本 / Homebrew（`brew install opentofu`）/ 包管理器 / `tenv` 多版本管理 / 直接下二进制；`tofu version` 验证。
- **provider 复用**：**不自造 provider**——直接用现有 Terraform provider；OpenTofu 有独立 **registry.opentofu.org**。
- **工作流不变**：`write → init → plan → apply → destroy`，`plan` 先看后做、state 是真相之源、幂等收敛，与 Terraform 心智完全一致。
- **迁移最小化**：`备份 → 装 tofu → tofu init → 小步验证` 四步；`terraform_remote_state` 跨配置场景要额外当心。
- **何时选它**：在意**许可确定性 / 开源 / 厂商中立**，或想用 **state 加密、`-exclude`、provider `for_each`、`enabled`** 等 OpenTofu-only 特性时。

## 一、OpenTofu 是什么

OpenTofu 是 **Terraform 的开源分叉**。如果你已经了解 Terraform，那么理解 OpenTofu 只需记住一件事：**它就是 Terraform，只是换了许可、换了掌舵人、换了命令名**。

- 同一套**声明式**心智：写「要什么」（期望状态），不写「怎么做」；`plan` 算差异、`apply` 收敛、幂等。
- 同一门语言 **HCL**：`resource` / `data` / `variable` / `output` / `locals` / `module` 一模一样。
- 同一种 **state** 文件格式，同一批 **provider**，同一套 **Registry** 协议。
- 命令行从 `terraform` 变成 **`tofu`**，其余工作流原样保留。

换句话说，OpenTofu 不是「另一个 IaC 工具」，而是 Terraform 生命线的一条**开源分支**。它与 Terraform 的关系，类似「某个开源项目改用非开源许可后，社区拉出、继续用旧开源许可维护的分叉」——技术同源，分歧在治理与许可。

## 二、因何而生：BUSL → 分叉

要理解 OpenTofu 存在的意义，必须回到 2023 年那场许可地震。

- **2023-08-10**：HashiCorp 宣布把 Terraform（及旗下多个产品）的许可从 **MPL 2.0（开源）** 改为 **BUSL 1.1（Business Source License）**。BUSL 是一种 **source-available（源码可见）但非开源**的许可：源码公开可读，但**禁止用它做与 HashiCorp 相竞争的商业用途**。
- **问题**：BUSL 的「竞争」边界含糊。宣言（Manifesto）直言——**「每一家用 Terraform 的公司、厂商、开发者，都得担心自己在做的事会不会被解读为与 HashiCorp 竞争」**。这种不确定性对整个生态是慢性毒药。
- **2023-08-25**：在请求 HashiCorp 恢复开源许可未获回应后，社区（由 Gruntwork、Spacelift、Harness、Env0、Scalr 等发起）公开发起分叉，最初叫 **OpenTF**。
- **2023-09-20**：**Linux 基金会**接纳该项目；因商标问题从 OpenTF 更名为 **OpenTofu**。
- **2024-01-10**：**OpenTofu 1.6.0** 首个稳定版发布，宣布可用于生产，作为 Terraform 1.6 的 drop-in 替代。

> Terraform **1.5.x 是最后一个 MPL 2.0 版本**，1.6.0 起转 BUSL。OpenTofu 正是从「最后的开源 Terraform」接棒，沿用 MPL 2.0 继续走。

许可与治理的完整含义（BUSL vs MPL 到底差在哪、为什么 Linux 基金会托管重要）见[治理与许可](./guide-line/governance-license)。

## 三、`tofu` CLI 与安装

OpenTofu 的命令行工具叫 **`tofu`**。它对应 Terraform 的 `terraform`，子命令与语义几乎一一对应。

安装（任选其一）：

```bash
# macOS: Homebrew
brew install opentofu

# 官方安装脚本（Linux/macOS）
curl -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh
chmod +x install-opentofu.sh
./install-opentofu.sh --install-method standalone

# 多版本管理：tenv（tfenv 的 OpenTofu/Terraform 通用替代）
tenv tofu install 1.12.2
```

验证：

```bash
tofu version
# OpenTofu v1.12.x
# on darwin_arm64
```

::: tip 命令名之外，尽量「保持 Terraform 原样」
为了让迁移无痛，OpenTofu 刻意保留了大量 `TF_` 前缀的东西：配置块仍叫 `terraform {}`、环境变量仍是 `TF_VAR_*` / `TF_LOG` / `TF_CLI_ARGS`、依赖锁文件仍是 `.terraform.lock.hcl`。只有 CLI 配置文件从 `.terraformrc` 变成了 `.tofurc`（或 `tofu.rc`）。这些兼容细节见[兼容与 CLI](./guide-line/compatibility-cli)。
:::

## 四、与 Terraform 的 drop-in 兼容

分叉初期，OpenTofu 的核心承诺是 **drop-in replacement（原地替换）**：把 `terraform` 命令换成 `tofu`，你的配置、state、provider 基本原样工作。

- **HCL 配置**：`.tf` 文件**无需改动**。OpenTofu 也支持 `.tofu` 扩展名（见下一篇），但不强制。
- **state 格式**：OpenTofu 兼容 Terraform **1.5.x** 及更早的 state；`tofu init` 能直接接管现有 `terraform.tfstate`。
- **命令**：`init` / `plan` / `apply` / `destroy` / `fmt` / `validate` / `import` / `state` / `output` / `show` / `console` / `providers` 全部同名同义。
- **provider**：**复用现有 Terraform provider**——OpenTofu 不自己造 provider，provider 作者也没改许可，只是默认从 **registry.opentofu.org** 拉取。

一个最小示例（与 Terraform 写法完全一致）：

```hcl
# main.tf —— 这份配置在 terraform 和 tofu 下都能跑
terraform {
  required_version = ">= 1.6"

  required_providers {
    # 地址写法不变；OpenTofu 从 registry.opentofu.org 解析
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

resource "aws_s3_bucket" "assets" {
  bucket = "my-opentofu-demo-assets"
}
```

```bash
tofu init      # 装 provider、初始化 backend
tofu plan      # 看将要发生什么
tofu apply     # 确认并执行
```

::: warning 「drop-in」有时间前提
「几乎原样就能跑」描述的是**分叉初期**。随着两边各自演进，OpenTofu 长出了 Terraform 没有的特性（state 加密、`-exclude`、provider `for_each`、`enabled`……），Terraform 也有自己的新东西。**用了某一边的独有特性，就不再能无缝跑到另一边**——这就是「各自演进后的特性分叉」，选型与迁移时必须计入（见[差异化特性与迁移选型](./guide-line/features-migration)）。
:::

## 五、工作流与心智：与 Terraform 一致

OpenTofu 的世界观与 Terraform 完全相同，这里快速过一遍：

- **`write → init → plan → apply → destroy`**：编辑 HCL → `tofu init` 装 provider / 连 backend → `tofu plan` 生成执行计划 → `tofu apply` 执行 → 不需要时 `tofu destroy`。
- **`plan` 是灵魂**：先把 `+` 新建 / `~` 修改 / `-` 销毁 / `-/+` 替换 以 diff 形式给你审，再决定是否执行。
- **state 是真相之源**：`tofu` 靠 state 记录「配置资源 ↔ 真实对象」的映射；别手改。
- **期望状态 + 幂等**：反复 `apply` 收敛到同一状态；无变更时显示 `No changes`。
- **依赖图（DAG）**：靠引用自动建依赖、决定顺序与并发，`depends_on` 是兜底。

```bash
# 与 Terraform 逐字对应，只是把 terraform 换成 tofu
tofu init
tofu fmt
tofu validate
tofu plan -out=tofu.tfplan
tofu apply tofu.tfplan
tofu destroy
```

如果你想系统学声明式 IaC 的底层概念（IaC 是什么、声明式 vs 命令式、state、依赖图、模块化），可直接看本站 **Terraform** 叶——那套语言与工作流在 OpenTofu 上**一字不差地成立**。本叶接下来聚焦 OpenTofu **独有**的三件事：**治理与许可**、**兼容边界与 CLI**、**差异化特性与迁移选型**。
