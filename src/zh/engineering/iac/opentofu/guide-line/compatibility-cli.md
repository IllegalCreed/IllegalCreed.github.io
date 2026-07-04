---
layout: doc
outline: [2, 3]
---

# 兼容与 CLI：drop-in 的边界与 `tofu` 命令面

> 基于 OpenTofu 1.12 · 核于 2026-07

## 速查

- **兼容基线**：分叉初期对齐 **Terraform 1.6**，state 兼容至 **1.5.x**；多数 `.tf` 无需改动。
- **命令同名**：`tofu init/plan/apply/destroy/fmt/validate/import/state/output/show/console/providers/test/login/version` 与 Terraform 一一对应。
- **保留 `terraform {}` 块**：`required_version` / `required_providers` / `backend` / `encryption` 都写在 `terraform {}` 里——**块名没改**。
- **保留 `TF_` 环境变量**：`TF_VAR_*`、`TF_LOG`、`TF_CLI_ARGS`、`TF_DATA_DIR`、`TF_WORKSPACE` 等沿用；新增 `TF_ENCRYPTION` 配 state 加密。
- **保留锁文件名**：依赖锁仍是 **`.terraform.lock.hcl`**（非 `.tofu.lock.hcl`）。
- **改了的**：CLI 配置文件 `.terraformrc` → **`.tofurc` / `tofu.rc`**（格式一致）。
- **`.tofu` 文件**：可用 **`.tofu`** 扩展名替代 `.tf`；**同名时 `.tofu` 覆盖 `.tf`**（`main.tofu` 存在则忽略 `main.tf`），用于「只给 OpenTofu 看」的差异化配置。
- **Registry**：默认从 **registry.opentofu.org** 解析 provider/module；检索用 **search.opentofu.org**。
- **provider 复用**：**OpenTofu 不自造 provider**——用现有 Terraform provider，`source = "hashicorp/aws"` 写法不变。
- **backend**：S3 / GCS / azurerm / http / Consul 等常见 backend 一致可用。
- **`terraform_remote_state`**：跨配置传值的场景迁移时要**额外当心**（两边混用、加密开启时）。
- **迁移感知**：日志、错误信息、`plan` 输出格式高度一致，CI 里替换命令名即可，脚本改动极小。

## 一、drop-in 兼容到底「兼容」什么

OpenTofu 的兼容承诺是**具体而有边界**的。拆开看：

| 维度 | 是否兼容 | 说明 |
| --- | --- | --- |
| **HCL 语言** | 完全一致 | `resource`/`data`/`variable`/`module`/`locals`/`output`/表达式/函数一致 |
| **state 格式** | 兼容至 TF 1.5.x | `tofu init` 可直接接管现有 `terraform.tfstate` |
| **CLI 命令** | 同名同义 | `terraform X` → `tofu X` |
| **provider** | 复用 | 同一批 provider，`source` 写法不变，改从 OpenTofu registry 拉 |
| **backend** | 一致 | S3/GCS/azurerm/http… 配置照搬 |
| **module** | 一致 | Registry / Git / 本地来源都支持 |
| **CLI 配置文件** | 改名 | `.terraformrc` → `.tofurc`（内容格式一致） |
| **独有新特性** | 不互通 | state 加密、`-exclude`、`enabled` 等用了就无法回跑 Terraform |

一句话：**语言、state、命令、provider 这四大件保持一致**，让「从 Terraform 切过来」成本极低；**分歧集中在 CLI 周边命名与各自的独有特性**上。

## 二、被刻意保留的 `TF_` 与 `terraform {}`

为了兼容，OpenTofu **没有**把一切 `terraform` 都改成 `tofu`。这点常让新人意外：

```hcl
# 注意：块名仍然是 terraform，不是 tofu
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "my-tofu-state"
    key    = "prod/terraform.tfstate" # 连 state 文件默认名都常沿用 terraform.tfstate
    region = "ap-northeast-1"
  }
}
```

保留清单：

- **配置块**：`terraform {}`（连同其中的 `required_providers`、`backend`、`cloud`、`encryption`）。
- **环境变量**：`TF_VAR_<名>`（传变量）、`TF_LOG`（日志级别）、`TF_CLI_ARGS`、`TF_DATA_DIR`、`TF_WORKSPACE` 等；state 加密新增 `TF_ENCRYPTION`。
- **锁文件**：`.terraform.lock.hcl`（provider 依赖锁）。
- **工作目录**：`.terraform/`（provider/module 缓存）。

被改掉的主要就一处：

- **CLI 配置文件**：Terraform 的 `~/.terraformrc`（Windows `terraform.rc`）→ OpenTofu 的 **`.tofurc`**（或 `tofu.rc`）。内容格式（`provider_installation`、`credentials` 等块）一致。

::: tip 为什么不全改成 tofu
把 `terraform {}` 改名会让每一份存量配置都要改，直接破坏 drop-in 承诺。OpenTofu 的取舍是「**能不改就不改**」，把破坏性变更压到最小。这也是它能被称为 drop-in replacement 的前提。
:::

## 三、`.tofu` 文件扩展名

OpenTofu 额外支持一种 Terraform 没有的文件扩展名 **`.tofu`**（1.8 引入），用于「这段配置只想让 OpenTofu 处理」的场景：

- `.tofu` 文件与 `.tf` **处理方式完全相同**，只是扩展名不同。
- **同名时 `.tofu` 覆盖 `.tf`**：若同目录同时存在 `main.tofu` 和 `main.tf`，OpenTofu **只加载 `main.tofu`，忽略 `main.tf`**。
- override 文件同理：`foo_override.tofu` 存在则忽略 `foo_override.tf`；JSON 变体（`.tofu.json` vs `.tf.json`）同规则。

典型用法：一份代码库想**同时兼容 Terraform 和 OpenTofu**，公共部分放 `.tf`，OpenTofu 专属差异（比如用了 state 加密或某个 OpenTofu-only 写法）放同名 `.tofu` 覆盖——Terraform 看不见 `.tofu`，OpenTofu 优先用 `.tofu`。

```bash
# 目录里同时有 main.tf 与 main.tofu：
#   - terraform 只看 main.tf
#   - tofu 只看 main.tofu（忽略 main.tf）
```

## 四、`tofu` 命令面

与 `terraform` 逐条对应，日常高频：

```bash
tofu init                 # 装 provider、初始化 backend、拉 module
tofu init -upgrade        # 升级 provider 到约束允许的最新
tofu fmt                  # 规范化 HCL 格式
tofu validate             # 校验语法与内部一致性（不连云）
tofu plan -out=tfplan     # 生成并固化执行计划
tofu apply tfplan         # 严格执行审过的计划
tofu apply -auto-approve  # 跳过交互确认（CI）
tofu destroy              # 销毁本配置管理的资源
tofu state list           # 列出 state 中的资源
tofu import <addr> <id>   # 纳管已有资源
tofu output -json         # 输出结果（机器可读）
tofu providers            # 查看 provider 依赖树
tofu test                 # 运行 .tftest.hcl 测试
tofu version              # 版本
```

OpenTofu 独有或先行的命令行能力（详见[差异化特性与迁移选型](./features-migration)）：

- **`-exclude`**：`plan/apply` 的排除选择器，是 `-target` 的「反选」（1.9）。
- **state 加密**：无独立子命令，通过 `terraform {}` 里的 `encryption` 块或 `TF_ENCRYPTION` 环境变量配置（1.7）。

## 五、Registry 与 provider 复用

分叉最容易被误解的一点：**OpenTofu 会不会把 provider 生态也一起分裂？答案是不会。**

- **不自造 provider**：FAQ 明确「**OpenTofu 不会有自己的 provider**」。它复用现有 **Terraform provider**——这些 provider 由各厂商/社区维护，**许可并未随 Terraform 主体的 BUSL 变更而改变**（多数仍是 MPL / Apache 等开源许可）。
- **独立 Registry**：OpenTofu 维护自己的 **registry.opentofu.org**（provider/module 解析）与 **search.opentofu.org**（检索界面）。你的 `source = "hashicorp/aws"` 写法**完全不用改**，只是解析端点换成了 OpenTofu 的 registry。
- **OCI 支持（1.10）**：OpenTofu 支持从 **OCI 制品仓库**（如容器镜像仓库）分发 provider 与 module，这是 Terraform 开源版没有的分发通道，利于内网 / 私有化场景。

```hcl
terraform {
  required_providers {
    # 写法与 Terraform 一致；OpenTofu 从 registry.opentofu.org 解析
    aws        = { source = "hashicorp/aws", version = "~> 5.0" }
    cloudflare = { source = "cloudflare/cloudflare", version = "~> 4.0" }
  }
}
```

::: warning 跨配置传值：`terraform_remote_state`
用 `terraform_remote_state` 让多份配置互相读 state 的系统，在迁移或「两边混用」时要**额外当心**：确保被读的一端与读的一端在 state 版本、（若开启的）加密配置上一致。官方迁移指南专门点名了这一场景。
:::
