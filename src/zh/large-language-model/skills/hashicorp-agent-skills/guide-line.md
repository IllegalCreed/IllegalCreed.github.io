---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 hashicorp/agent-skills 官方仓库的 README 与各 `SKILL.md`（Terraform code-generation / module-generation / provider-development / policy，Packer builders / hcp）编写。

## 速查

- **Terraform code-gen**：`style-guide`（官方风格）·`terraform-test`（`.tftest.hcl`）·`azure-verified-modules`（AVM 37 条）·`search-import`（`.tfquery.hcl` 纳管存量）
- **Terraform module**：`refactor-module`（单体→模块 + `moved`）·`terraform-stacks`（`.tfcomponent.hcl` / `.tfdeploy.hcl` 编排）
- **Terraform provider**：脚手架 / 资源 / 动作 / 文档 / 验收测试（Plugin Framework，Go）
- **Terraform policy**：`.policy.hcl` 策略 + `.policytest.hcl` 测试 + Sentinel 转换
- **Packer builders**：`aws-ami-builder`（`amazon-ebs`）·`azure-image-builder`（`azure-arm`）·`windows-builder`（WinRM + PowerShell）
- **Packer hcp**：`push-to-registry`（`hcp_packer_registry` 块，推元数据）
- **反模式**：LLM 裸写 Terraform 易幻觉属性 / 过时语法 → 用 style-guide 约束 + terraform-test 兜底 + `fmt`/`validate` 门禁
- **版本门槛**：search-import 需 TF ≥ 1.14 + provider list 资源；Stacks 需 CLI 1.13+；mock provider 需 1.7+

## Terraform · code-generation 插件

### terraform-style-guide：按官方风格生成 HCL

这是治「LLM 幻觉写 Terraform」最直接的一把——把 [HashiCorp 官方 Style Guide](https://developer.hashicorp.com/terraform/language/style) 灌给 agent。要点：

- **文件组织**：`terraform.tf`（版本约束）、`providers.tf`、`main.tf`、`variables.tf`（字母序）、`outputs.tf`（字母序）、`locals.tf`
- **格式**：两空格缩进（不用 Tab）、连续赋值对齐等号、参数在前、块在后、meta-argument（`count` / `for_each`）置顶、`lifecycle` 置底
- **命名**：全小写下划线、用不含资源类型的描述性名词、资源名单数、单实例可用 `main`
- **变量 / 输出**：每个变量必带 `type` + `description`（可加 `validation`），每个输出必带 `description`，敏感值标 `sensitive = true`
- **动态创建**：多实例优先 `for_each`（命名实例），条件创建才用 `count = var.x ? 1 : 0`
- **版本 pin**：`required_version = ">= 1.14"`，provider 用 `~> 6.0`；操作符 `=` / `>=` / `~>` / 范围
- **门禁**：提交前 `terraform fmt -recursive` + `terraform validate`，配合 `tflint` / `checkov` / `tfsec`

```hcl
# terraform.tf —— 版本约束先行
terraform {
  required_version = ">= 1.14"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
```

### terraform-test：内置测试框架

用 Terraform 原生测试框架，在**临时资源**上验证配置更新不引入破坏性变更，保护现有基础设施与状态。核心概念：

- **测试文件** `.tftest.hcl` / `.tftest.json`：含若干 `run` 块
- **run 块**：一个测试场景，可带 `variables` / `providers` / `assert`
- **assert 块**：必须为真的断言
- **mock provider**：不建真实资源模拟 provider（Terraform 1.7.0+）
- **测试模式**：`apply`（默认，建真实资源）或 `plan`（只验逻辑）

```hcl
run "test_default_configuration" {
  command = plan

  assert {
    condition     = aws_instance.example.instance_type == "t2.micro"
    error_message = "Instance type should be t2.micro by default"
  }
}
```

实践：`*_unit_test.tftest.hcl` 用 plan 模式（快、不建资源），`*_integration_test.tftest.hcl` 用 apply 模式；`expect_failures` 验证 `validation` 规则能拒绝坏输入；`state_key` 共享状态、`parallel = true` 并行；清理按 run 块**逆序**销毁（S3 对象先于桶）。CI 里 PR 跑单测、合并跑集成测。

### azure-verified-modules（AVM）：认证 37 条要求

给需要 AVM 认证的 Azure 模块用，按 MUST / SHOULD / MAY 分级共 37 条（3 功能 + 34 非功能）。硬性要点：

- **Provider**：只用 `azurerm`（>= 4.0, < 5.0）和 / 或 `azapi`（>= 2.0, < 3.0），`required_providers` 用 `~>` 约束
- **命名**：locals / variables / outputs / 资源与模块符号名全 `lower_snake_case`
- **for_each**：条件创建用 `count`，多实例用 `map()` / `set()` 且 key 为静态字面量
- **块内顺序**：meta-arg（`provider`/`count`/`for_each`）→ 必需 / 可选参数与块（字母序）→ `depends_on`/`lifecycle`
- **变量**：每个必带 `type`（尽量精确、少用 `any`）；禁 `enabled` / `module_depends_on` 这类整模块开关；集合默认 `nullable = false`；敏感输入不设默认值
- **输出**：用「防腐层」——输出离散计算属性而非整个资源对象；敏感输出必 `sensitive = true`
- **交叉引用**：只用 registry 引用 + pin 版本，禁 git 引用、禁引非 AVM 模块
- **文档**：用 [terraform-docs](https://github.com/terraform-docs/terraform-docs) 自动生成，模块根须有 `.terraform-docs.yml`

### terraform-search-import：纳管存量资源

把手工建的云资源发现并批量导入 Terraform 管理（需 TF ≥ 1.14 + provider 支持 list 资源）。流程：

1. 写 `.tfquery.hcl`，用 `list` 块声明查询
2. `terraform query` 发现匹配资源
3. `terraform query -generate-config-out=imported.tf` 生成 `resource` + `import` 块
4. 清理生成的配置（删计算属性、换变量、规范命名）
5. `terraform plan` / `apply` 完成导入

```hcl
# discovery.tfquery.hcl
provider "aws" {
  region = "us-west-2"
}

list "aws_instance" "production" {
  provider = aws
  config {
    filter {
      name   = "tag:Environment"
      values = ["production"]
    }
  }
  limit = 100
}
```

生成的 `import` 块用**基于 identity 的导入**（Terraform 1.12+）：`identity = { account_id, id, region }`。动手前先跑仓库脚本 `./scripts/list_resources.sh <provider>` 确认目标资源类型受支持，不支持则走手动 import 流程。

## Terraform · module-generation 插件

### refactor-module：单体配置重构成模块

把巨石 `main.tf` 系统化拆成可复用模块——定义清晰的输入 / 输出契约、合理封装、版本与文档、测试，并给出**状态迁移路径**。关键取舍：

- **该进模块**：紧耦合资源（VPC + 子网）、共享生命周期的资源、边界清晰的配置
- **该留外面**：横切关注点（监控、打标）、不同生命周期的资源、provider 配置
- **状态迁移**：优先用 `moved` 块（Terraform 1.1+），无损、可 review

```hcl
moved {
  from = aws_subnet.public_1
  to   = module.vpc.aws_subnet.public["us-east-1a"]
}
```

常见坑：**过度抽象**（`map(map(any))` 太灵活难校验，应用具体 `object` 类型）、**紧耦合**（模块间直接引用，应经根模块传依赖）、**状态迁移出错**（先在非生产验证，`terraform plan` 确认迁移后 0 变更再 apply）。

### terraform-stacks：规模化编排

Terraform Stacks 是模块之上的编排层，声明式管理跨环境 / 区域 / 云账号的多个组件（Terraform CLI 1.13+ GA）。它用**独立的 Stack 语言**（不是普通 HCL）：

- **组件配置** `.tfcomponent.hcl`：`variable` / `required_providers` / `provider` / `component` / `output` / `locals` / `removed` 块
- **部署配置** `.tfdeploy.hcl`：`identity_token` / `store` / `deployment` / `deployment_group` / `deployment_auto_approve` / `publish_output` / `upstream_input` 块

核心概念：**Component**（对模块的抽象，指定 source + inputs + providers）、**Deployment**（一组组件的具体实例，对应 dev/staging/prod，每 Stack 1–20 个）。特点：

- **组件依赖自动推断**：一个组件引用另一个的输出（`subnet_ids = component.vpc.private_subnet_ids`）即成依赖
- **provider 支持 `for_each`**，别名写在块头、配置放 `config` 块——和普通 Terraform 不同
- **认证首选 OIDC workload identity**：`identity_token` + `assume_role_with_web_identity`，凭据变量标 `ephemeral = true` 不落状态
- **CLI 无 plan / apply**：`terraform stacks init` / `validate`，然后 `configuration upload` 触发部署运行，`deployment-run approve-all-plans` 审批

```hcl
component "vpc" {
  source  = "app.terraform.io/my-org/vpc/aws"
  version = "2.1.0"
  inputs  = { cidr_block = var.vpc_cidr }
  providers = { aws = provider.aws.this }
}
```

注意：Stacks 里用的模块不能含 `provider` 块（在 Stack 配置里配 provider）；公共 registry 模块用前先测兼容性。

## Terraform · provider-development / policy 插件

- **provider-development**（6 个 skill）：`new-terraform-provider`（用 Plugin Framework 脚手架，Go module + `main.go` + `go build` / `go test`）、`provider-resources`（CRUD 资源与数据源、schema、状态）、`provider-actions`（生命周期动作）、`provider-docs`（生成文档）、`run-acceptance-tests`（跑 / 调验收测试）、`provider-test-patterns`（`terraform-plugin-testing` 范式）。面向自建 provider 的工程团队。
- **policy**（`terraform-policy` skill）：为 HCP Terraform 原生策略即代码引擎服务——从自然语言或 Sentinel 源写 `.policy.hcl`、写 `.policytest.hcl` 测试与资源 mock、把 Sentinel 策略转成 Terraform Policy。

## Packer · builders 插件

### aws-ami-builder：用 amazon-ebs 建 AMI

```hcl
source "amazon-ebs" "ubuntu" {
  region        = var.region
  instance_type = "t3.micro"
  source_ami_filter {
    filters     = { name = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*" }
    most_recent = true
    owners      = ["099720109477"] # Canonical
  }
  ssh_username = "ubuntu"
  ami_name     = "my-app-${local.timestamp}"
  ami_regions  = ["us-east-1", "eu-west-1"] # 多区复制
}
```

要点：`source_ami_filter` 选基础镜像、时间戳保证 `ami_name` 唯一、`ami_regions` 复制到多区；凭据按 AWS 标准链解析（环境变量 / `~/.aws/credentials` / IAM 实例 profile）；命令 `packer init` / `validate` / `build`。建 AMI 约 10–30 分钟且产生 AWS 费用。

### azure-image-builder & windows-builder

- **azure-image-builder**：用 `azure-arm` builder 建 Azure 托管镜像或 Azure Compute Gallery 镜像，需 `client_id` / `client_secret` / `subscription_id` / `tenant_id`（敏感变量标 `sensitive`）；约 15–45 分钟。
- **windows-builder**：跨平台（AWS / Azure / VMware）的 Windows 镜像范式，用 **WinRM communicator** 通信 + **PowerShell provisioner** 配置。需 `user_data` 脚本（用 `<powershell>` 包裹）开 WinRM、配防火墙；因 Windows Updates，约 45–120 分钟，失败可能遗留计费资源，务必核对清理。

## Packer · hcp 插件

### push-to-registry：推元数据到 HCP Packer

在 `build` 块里加 `hcp_packer_registry` 块，把构建**元数据**（非镜像本身）推到 HCP Packer 注册表做版本与治理：

```hcl
build {
  sources = ["source.amazon-ebs.ubuntu"]
  hcp_packer_registry {
    bucket_name = var.image_name          # 必填，跨构建须保持一致
    description = "Ubuntu 22.04 base image"
    bucket_labels = { os = "ubuntu", team = "platform" }  # 桶级，每次构建更新
    build_labels  = { build-time = local.timestamp }      # 迭代级，构建后不可变
  }
}
```

认证用 HCP 服务主体：`HCP_CLIENT_ID` / `HCP_CLIENT_SECRET` / `HCP_ORGANIZATION_ID` / `HCP_PROJECT_ID`。之后可在 Terraform 里用 `data.hcp_packer_artifact` 按 `channel_name`（如 production）查最新镜像给 `aws_instance.ami` 用。注意 `bucket_name` 别带时间戳（变了会新建桶）；推元数据失败 Packer 会立即失败以防漂移。HCP Packer 基础用途免费，开销 < 1 分钟。

## 反模式：为什么 LLM 裸写 Terraform 危险

LLM 直接凭记忆写 Terraform / Packer 常见问题：**编造不存在的资源属性、用已废弃的语法、版本约束缺失、命名和文件组织混乱、敏感值不打 `sensitive`**。HashiCorp Agent Skills 的整套设计正是对症下药：

- **约束生成**：`terraform-style-guide` / AVM 把官方风格与命名喂给 agent，从源头减少幻觉
- **测试兜底**：`terraform-test` 用 `.tftest.hcl` 在临时资源 / mock 上验证，坏配置在 plan 阶段就暴露
- **门禁验证**：始终 `terraform fmt` + `validate`（+ `tflint` / `checkov`），把生成物拉回可编译、合规
- **纳管而非重建**：存量资源用 `search-import` 导入、重构用 `moved` 块迁移，避免 agent「删了重建」误伤生产

一句话：技能给的是**官方约束 + 验证闭环**，把 agent 从「凭感觉写」拉到「按规范写、用测试证」。

## 下一步

- [参考](./reference) —— skill 清单表、安装命令、许可、链接
- 上游：[Terraform 文档](https://developer.hashicorp.com/terraform) ｜ [Packer 文档](https://developer.hashicorp.com/packer)
