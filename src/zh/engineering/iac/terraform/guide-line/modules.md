---
layout: doc
outline: [2, 3]
---

# 模块化：复用、组合与 Registry

> 基于 Terraform（1.x）· 核于 2026-07

## 速查

- **模块（module）**：一组一起被管理的资源集合，Terraform 的**复用单元**；把「一份 .tf 的目录」封装成可参数化调用的组件。
- **root module（根模块）**：你执行 `terraform` 命令的那个目录；它调用 **child module（子模块）**。
- **调用**：`module "<名>" { source = "..." ; ... }`；`apply` 时子模块的资源被并入你的工作区。
- **`source`**：来源——本地路径 `./modules/vpc`、Registry `org/name/provider`、Git `git::https://...`、S3/GCS 等。
- **`version`**：**只对 Registry 来源有效**，配版本约束 `~> 5.0`；Git 用 `?ref=` 锁 tag。
- **输入**：子模块的 `variable` 就是它的入参，在 `module` 块里以参数形式传入。
- **输出**：子模块的 `output` 是它唯一对外暴露的返回值，父模块用 `module.<名>.<输出>` 取。
- **封装**：父模块**只能**通过输出拿子模块的值，内部资源对外不可见——这是模块的封装边界。
- **Registry**：公共 [registry.terraform.io](https://registry.terraform.io/) 有海量官方/伙伴/社区模块，免费引用；也可建私有 Registry。
- **`count`/`for_each` 用在模块上**：一次调用造多份模块实例。
- **组合优于继承**：用「小而专的模块 + 在根模块拼装」而非深层嵌套；扁平组合更好维护。
- **结构约定**：`main.tf` / `variables.tf` / `outputs.tf` / `README.md`；子模块放 `modules/`；examples 放 `examples/`。
- **别过早抽象**：模块是为「复用」和「隐藏复杂度」，只用一次、无参数的包装是负担。

## 一、什么是模块，root vs child

官方定义：模块是**「Terraform 一起管理的一组资源」**。它让你把「配好一套 VPC」「配好一台带监控的实例」这类**成套配置**封装起来，参数化后到处复用，统一组织的基础设施规范。

任何 Terraform 配置都至少有一个模块：

- **root module（根模块）**：你运行 `terraform init/plan/apply` 的那个目录里的 `.tf` 文件，就是根模块。
- **child module（子模块）**：被根模块（或其它模块）用 `module` 块调用的模块。子模块还能再调更深的子模块（嵌套），但不建议嵌套过深。

`apply` 时，Terraform 会把被调用子模块里的资源**并入你的工作区**一起规划执行——模块只是**组织与复用**的手段，不改变「所有资源最终在一次 plan/apply 里统一收敛」这件事。

## 二、调用子模块：`module` 块

```hcl
module "network" {
  source = "./modules/network" # 来源：本地路径

  # 下面这些都是给子模块的【入参】（对应子模块里的 variable）
  vpc_cidr    = "10.0.0.0/16"
  az_count    = 3
  environment = var.environment
}

module "web" {
  source = "./modules/web"

  # 用另一个模块的【输出】作为本模块的入参 —— 模块间组合
  subnet_ids = module.network.public_subnet_ids
}
```

- **`source`（必填）**：告诉 Terraform 去哪加载模块代码。
- 其余参数：全部是传给子模块 `variable` 的值。
- 引用子模块产出：`module.network.public_subnet_ids`（`module.<模块名>.<output名>`）。

`init` 时 Terraform 会**下载/链接**所有被引用的模块到 `.terraform/modules/`；改了 `source` 或 `version` 要重跑 `init`。

## 三、模块的输入与输出

模块对外的接口就两样：**输入变量（variable）** 和 **输出（output）**。中间的资源实现，对调用者是**黑盒**。

一个精简的 `network` 子模块：

```hcl
# modules/network/variables.tf —— 输入接口
variable "vpc_cidr" {
  type        = string
  description = "VPC 网段"
}

variable "az_count" {
  type    = number
  default = 2
}

# modules/network/main.tf —— 内部实现（对调用者不可见）
resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr
}

resource "aws_subnet" "public" {
  count      = var.az_count
  vpc_id     = aws_vpc.this.id
  cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index)
}

# modules/network/outputs.tf —— 输出接口（唯一对外返回值）
output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}
```

**封装性是重点**：调用者拿不到 `aws_vpc.this` 本身，只能拿到你在 `output` 里显式暴露的 `vpc_id`、`public_subnet_ids`。这迫使模块作者设计清晰的对外契约，也让内部重构（换资源、改结构）不影响调用方——只要输入输出签名不变。

## 四、模块来源：`source` 的几种写法

```hcl
# 1) 本地路径：项目内自建模块，最常见
module "a" { source = "./modules/network" }

# 2) 公共/私有 Registry：<命名空间>/<名字>/<provider>
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0" # 【version 只对 Registry 来源生效】
}

# 3) Git：用 ?ref= 锁定 tag/commit（Git 来源不能用 version 参数）
module "b" {
  source = "git::https://github.com/org/modules.git//network?ref=v1.2.0"
}

# 4) 其它：S3、GCS、HTTP 等也支持
```

要点：**`version` 参数只对 Registry 来源有效**；Git/HTTP 来源要靠 `?ref=`（tag、分支或 commit SHA）来固定版本。生产中无论哪种来源都应**锁定版本**，避免上游变更悄悄改了你的基础设施。

## 五、公共 Registry 与版本约束

公共 **Terraform Registry**（registry.terraform.io）托管了大量官方、伙伴、社区维护的模块——AWS VPC、EKS、RDS，GCP 网络等常见基建都有高质量现成模块，**声明 `source` + `version` 即可免费引用**，不必从零造轮子。

版本约束语法（同样适用于 Provider）：

| 写法 | 含义 |
| --- | --- |
| `= 5.1.0` | 精确锁定 5.1.0 |
| `>= 5.1.0` | 不低于 5.1.0 |
| `~> 5.1.0` | `>= 5.1.0` 且 `< 5.2.0`（锁到 patch） |
| `~> 5.1` | `>= 5.1` 且 `< 6.0`（锁到 minor，最常用） |
| `>= 5.1, < 6.0` | 区间组合 |

`~>`（悲观约束）是实践首选：允许兼容的小版本升级、挡住可能破坏性的大版本跳跃。`init` 会把实际选中的版本连同校验和写进 **`.terraform.lock.hcl`（依赖锁文件）**，务必提交进 Git——它保证团队每个人、每次 CI 用的是**完全相同**的 Provider/模块版本。

## 六、模块组合：优于继承

Terraform 官方推崇**「组合优于继承」**的模块设计：不要造巨大的、无所不包的「上帝模块」，也别层层深嵌；而是拆成**小而专**的模块，在**根模块里把它们拼起来**，用一个模块的 `output` 喂另一个模块的 `variable`：

```hcl
# 根模块：扁平地组合三个专职模块
module "network" {
  source   = "./modules/network"
  vpc_cidr = "10.0.0.0/16"
}

module "database" {
  source     = "./modules/database"
  subnet_ids = module.network.private_subnet_ids # 组合：network → database
}

module "app" {
  source     = "./modules/app"
  subnet_ids = module.network.public_subnet_ids
  db_endpoint = module.database.endpoint          # 组合：database → app
}
```

需要「同一模块来多份」时，`count` / `for_each` 也能用在 `module` 块上：

```hcl
module "team_env" {
  source   = "./modules/environment"
  for_each = toset(["dev", "staging", "prod"])
  env_name = each.key
}
# 引用：module.team_env["prod"].xxx
```

## 七、结构约定与最佳实践

社区标准模块目录结构（Registry 发布也遵循它）：

```bash
modules/network/
├── main.tf         # 主要资源
├── variables.tf    # 输入接口
├── outputs.tf      # 输出接口
├── versions.tf     # required_providers / required_version
└── README.md       # 用途、输入输出、示例（Registry 会渲染）
# 复合项目里：
examples/           # 可运行的调用示例
modules/            # 子模块（若本身是模块库）
```

几条经验：

- **单一职责**：一个模块管一类东西（网络就是网络），接口小而清晰。
- **锁版本 + 提交 lock 文件**：`~> x.y` 约束 + `.terraform.lock.hcl` 进 Git。
- **每个 `variable` 写 `description` 与合理 `default`、每个 `output` 写 `description`**：模块即文档。
- **别过早抽象**：模块的价值是**复用**与**隐藏复杂度**。只调用一次、不带参数、纯转发的「包装模块」只会徒增一层间接，不如直接写资源。等真正出现重复再抽取。
- **敏感输出标 `sensitive`**：避免 plan 回显泄密（但记住它仍明文进 state，见[状态篇](./state)）。

模块把「复用」讲透了。接下来的[生态与工程化篇](./ecosystem)讲清楚许可分叉、多环境 workspace、以及怎么把 plan/apply 搬进 CI/CD。
