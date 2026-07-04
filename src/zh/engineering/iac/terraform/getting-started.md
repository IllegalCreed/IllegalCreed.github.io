---
layout: doc
outline: [2, 3]
---

# 入门：IaC、声明式与第一个资源

> 基于 Terraform（1.x）· 核于 2026-07

## 速查

- **IaC（Infrastructure as Code）**：把基础设施（服务器、网络、DNS、数据库、权限……）当代码写、进版本库、可 review、可回滚，取代「点控制台点出来」。
- **声明式 vs 命令式**：Terraform 是**声明式**——你写「最终要什么」，它算差异；不像 shell/Ansible 那样写「一步步怎么做」。
- **HCL**：HashiCorp Configuration Language，`.tf` 文件；一个目录下所有 `.tf` 自动合并，顺序无关（Terraform 靠依赖图排序）。
- **Provider**：对接某平台 API 的插件（`aws`/`google`/`azurerm`/`kubernetes`/…），在 `required_providers` 声明、`provider` 块配置，来自 **Registry**。
- **`terraform init`**：初始化工作目录——下载 Provider、初始化 **backend**、装模块；换 Provider/backend 后要重跑。
- **`terraform plan`**：生成**执行计划**（`+` 创建 / `~` 修改 / `-` 销毁 / `-/+` 替换）；`-out=plan.tfplan` 可存盘供 `apply` 精确执行。
- **`terraform apply`**：执行变更，默认交互式确认；`-auto-approve` 跳过确认（CI 用，慎用）。
- **`terraform destroy`**：销毁本配置管理的全部资源，等价 `apply -destroy`。
- **state**：`terraform.tfstate` 记录「配置资源 ↔ 真实对象」映射，是**真相之源**，别手改。
- **期望状态 + 幂等**：反复 `apply` 收敛到同一状态；没变更时 plan 显示 `No changes`。
- **`fmt` / `validate`**：`terraform fmt` 规范化缩进、`terraform validate` 校验语法与内部一致性（不连云）。
- **变量注入**：`-var`、`-var-file`、`terraform.tfvars`、`*.auto.tfvars`、`TF_VAR_*` 环境变量。
- **许可提醒**：Terraform 1.6+ 为 **BUSL**（非开源）；要纯开源用 **OpenTofu**（命令 `tofu`，其余几乎一致）——详见[生态与工程化](./guide-line/ecosystem)。

## 一、什么是 IaC，为什么要声明式

「基础设施即代码」的核心主张：**基础设施的每一次变更都应该像应用代码一样，被写进文件、进版本控制、经过 review、可复现、可回滚**。它取代的是「登录控制台手点」这种不可追溯、不可复现、环境漂移严重的做法。

Terraform 属于其中的**声明式**流派，这是理解它的第一把钥匙：

- **命令式（imperative）**：你写下**一步步的操作**——「创建 VPC，然后创建子网，然后创建实例……」。典型代表是 shell 脚本、部分 Ansible playbook。问题是脚本要自己处理「已经存在了怎么办」「上次跑到一半挂了怎么办」。
- **声明式（declarative）**：你只描述**最终要什么**——「我要一个 VPC + 三个子网 + 一台实例」。Terraform 读取当前 **state**、对比配置，自己算出「要新建谁、改谁、删谁」，并按**依赖顺序**执行。你不关心过程，只关心结果。

声明式带来两个关键性质：

1. **期望状态收敛**：无论当前是什么状态，`apply` 后都会收敛到配置描述的目标。
2. **幂等**：同一份配置反复 `apply`，第二次开始都是 `No changes`——因为现状已等于期望。

## 二、安装与第一个 Provider

安装方式很多（Homebrew、官方 apt/yum 源、`tfenv` 版本管理器、直接下二进制），装完验证：

```bash
terraform version
# Terraform v1.x.x on darwin_arm64
```

Terraform 本体只是个「引擎」，真正会调 API 的是 **Provider**。你必须声明要用哪些 Provider，Terraform 才会在 `init` 时从 Registry 下载。约定俗成把它放在 `terraform.tf` 或 `versions.tf`：

```hcl
# versions.tf
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws" # Registry 上的地址：命名空间/名字
      version = "~> 5.0"         # 版本约束：>=5.0 且 <6.0
    }
  }
}

# provider 块：配置该 Provider 的连接参数（区域、认证等）
provider "aws" {
  region = "ap-northeast-1"
  # 生产不要在这写密钥！用环境变量 AWS_ACCESS_KEY_ID / AWS_PROFILE / OIDC
}
```

::: warning 认证凭据别硬编码
`provider` 块里几乎永远不该出现明文 access key。用环境变量、共享凭据文件、或 CI 里的 **OIDC**（见[生态篇](./guide-line/ecosystem)）。硬编码的凭据会随代码进版本库，也可能被写进 plan 文件。
:::

## 三、第一个资源：`resource`

`resource` 块是 Terraform 的主角，声明一个「要被管理的真实对象」。语法固定为 `resource "<类型>" "<本地名>"`：

```hcl
# main.tf
resource "aws_instance" "web" {
  ami           = "ami-0abcd1234efgh5678"
  instance_type = "t3.micro"

  tags = {
    Name = "hello-terraform"
  }
}
```

- **类型（`aws_instance`）**：由 Provider 决定，前缀通常是 Provider 名，代表「EC2 实例」这种资源种类。
- **本地名（`web`）**：只在 Terraform 内部用于引用（`aws_instance.web.id`），**不会**成为云上资源的名字。
- **参数（`ami`/`instance_type`/`tags`）**：具体填什么由 Provider 文档定义。

引用其它资源的属性时，Terraform 会**自动建立依赖**。比如给实例挂一个弹性 IP：

```hcl
resource "aws_eip" "web_ip" {
  # 引用上面实例的 id —— 这行让 Terraform 知道：必须先建 instance 再建 eip
  instance = aws_instance.web.id
}
```

这种「A 引用了 B 的属性 → A 依赖 B」叫**隐式依赖**，是 Terraform 排序的主要依据（详见[配置语言篇](./guide-line/language)）。

## 四、核心工作流：init → plan → apply → destroy

### `terraform init`：初始化

在配置目录第一次动手前必须跑。它会：下载 `required_providers` 里声明的 Provider 到 `.terraform/`、初始化 **backend**（state 存哪）、下载引用的模块。

```bash
terraform init
# Initializing provider plugins...
# - Installing hashicorp/aws v5.x.x...
# Terraform has been successfully initialized!
```

换了 Provider 版本、加了新模块、改了 backend，都要重跑 `init`（必要时 `init -upgrade`）。

### `terraform plan`：先看后做

`plan` 是 Terraform 最有价值的一步——它读当前 state、对比配置，**只算不做**，把将发生的变更列成计划给你审：

```bash
terraform plan
# Terraform will perform the following actions:
#   # aws_instance.web will be created
#   + resource "aws_instance" "web" {
#       + ami           = "ami-0abcd1234efgh5678"
#       + instance_type = "t3.micro"
#       + id            = (known after apply)
#     }
# Plan: 1 to add, 0 to change, 0 to destroy.
```

符号含义要记牢：**`+` 新建、`~` 原地修改、`-` 销毁、`-/+`（或 `+/-`）先删后建的替换**。`(known after apply)` 表示这个值要等真正创建后才知道。想固化这份计划可以 `plan -out=tfplan`，再让 `apply tfplan` 严格照它执行。

### `terraform apply`：执行

```bash
terraform apply
# ...同样的 plan 输出...
# Do you want to perform these actions?
#   Enter a value: yes
```

默认会**再算一遍 plan 并要你输入 `yes` 确认**。CI 环境里用 `terraform apply -auto-approve` 或先 `plan -out` 再 `apply tfplan`（更安全，保证执行的就是审过的那份）。

### `terraform destroy`：销毁

```bash
terraform destroy   # 等价 terraform apply -destroy
```

销毁本配置管理的全部资源，同样要确认。想只销毁部分可配合 `-target`（应急用，别常态化）。

一张图记住全流程：

```bash
# 编辑 .tf 文件（write）
terraform init      # 一次性：装 provider / 连 backend
terraform fmt        # 规范化格式
terraform validate   # 校验语法（不连云）
terraform plan       # 看将要发生什么
terraform apply      # 确认并执行
# ……日常改配置后重复 plan / apply……
terraform destroy    # 不需要时拆除
```

## 五、期望状态与幂等：Terraform 的世界观

理解这一节，才算真正入门。

`apply` 成功后，state 里记下了「web 实例 = 云上那台 i-xxxx」。此时你**不改配置**再 `plan`：

```bash
terraform plan
# No changes. Your infrastructure matches the configuration.
```

因为 Terraform 会先 **refresh**（读云上真实状态刷新到 state 副本），再对比配置——现状 == 期望，所以无操作。这就是**幂等**。

如果有人绕过 Terraform 去控制台改了这台实例（比如手动改了 tag），下次 `plan` 会检测到 **drift（漂移）**：

```bash
terraform plan
#   ~ resource "aws_instance" "web" {
#       ~ tags = {
#           ~ "Name" = "changed-by-hand" -> "hello-terraform"
#         }
#     }
# Plan: 0 to add, 1 to change, 0 to destroy.
```

Terraform 认定「配置才是真相」，会计划把它**改回**配置描述的样子。这正是声明式 + state 的威力，也是「别绕过 Terraform 手改基础设施」这条铁律的由来（drift 细节见[状态管理篇](./guide-line/state)）。

## 六、变量与输出：让配置可复用

写死值不利复用。用 `variable` 把可变部分参数化、用 `output` 把结果暴露出来：

```hcl
# variables.tf
variable "instance_type" {
  type        = string
  default     = "t3.micro"
  description = "EC2 实例规格"
}

# main.tf 中引用
resource "aws_instance" "web" {
  ami           = "ami-0abcd1234efgh5678"
  instance_type = var.instance_type # 用 var.<名> 引用
}

# outputs.tf
output "public_ip" {
  value = aws_instance.web.public_ip # apply 后打印出来
}
```

赋值方式（优先级从高到低）：命令行 `-var="instance_type=t3.small"` > `-var-file` > `*.auto.tfvars` > `terraform.tfvars` > 环境变量 `TF_VAR_instance_type` > `default`。变量、输出、locals 的完整用法见[配置语言篇](./guide-line/language)。

到这里你已经能跑通「写配置 → plan → apply → 改 → 再 apply → destroy」的完整闭环。接下来按[本叶地图](./)深入语言、状态、模块与生态四块。
