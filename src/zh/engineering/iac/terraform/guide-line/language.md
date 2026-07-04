---
layout: doc
outline: [2, 3]
---

# 配置语言：HCL 与核心块

> 基于 Terraform（1.x）· 核于 2026-07

## 速查

- **HCL**：块（block）+ 参数（argument）+ 表达式（expression）三要素；`.tf` 文件同目录自动合并、**顺序无关**。
- **插值**：字符串内 `${...}` 嵌表达式；`%{ for }` / `%{ if }` 做模板循环判断——注意是 `${}` 单花括号，非 Vue 双花括号。
- **`resource` vs `data`**：`resource` **管理**（增改删）资源；`data` 只**读取**已有资源/外部信息，不创建。
- **`variable`**：模块入参，支持 `type`/`default`/`description`/`sensitive`/`validation`/`nullable`/`ephemeral`。
- **`output`**：模块出参，`sensitive`/`depends_on`；父模块用 `module.<名>.<输出>` 取值。
- **`locals`**：模块内命名局部值，`local.<名>` 引用，避免重复表达式。
- **`count`**：按整数造 N 个实例，`count.index` 取序号，引用要下标 `[0]`。
- **`for_each`**：按 map/set 造实例，`each.key`/`each.value`，引用要 `["key"]`；**增删中间项不会连带重建**，优于 `count`。
- **依赖图**：Terraform 建 **DAG** 决定顺序与并发；**隐式依赖**（引用属性自动生成）优先，**显式依赖** `depends_on` 是兜底。
- **`lifecycle`**：`create_before_destroy` / `prevent_destroy` / `ignore_changes` / `replace_triggered_by` / `precondition`+`postcondition`。
- **表达式**：条件 `? :`、`for` 推导、splat `[*]`、`try()`/`can()`、上百个内置函数。
- **`dynamic` 块**：按集合动态生成嵌套块（如多个 `ingress`）。
- **`terraform_data`**：内置「无副作用」资源，替代旧 `null_resource`，可存值/触发 provisioner。

## 一、HCL 基础

HCL（HashiCorp Configuration Language）只有三种基本构造：

```hcl
# 这是块（block）：类型 + 若干标签 + { 主体 }
resource "aws_instance" "web" {
  # 这是参数（argument）：名 = 表达式
  instance_type = "t3.micro"
  count         = 2
}
```

- **块**：`<类型> "<标签1>" "<标签2>" { ... }`，标签数量由类型决定（`resource` 两个标签，`variable` 一个，`terraform` 零个）。
- **参数**：`name = expression`，把值赋给名字。
- **表达式**：字面量、引用、函数调用、运算……可出现在参数右侧。

字符串里用 `${...}` 插值，用 `%{...}` 做模板控制流；多行用 heredoc：

```hcl
locals {
  greeting = "Hello, ${var.name}!" # 插值

  # 模板控制流：for / if
  servers = <<-EOT
    %{ for ip in var.ips ~}
    server ${ip}
    %{ endfor ~}
  EOT
}
```

::: tip 关于 `${}` 与 VitePress
HCL 的插值是**美元 + 单层花括号** `${var.x}`，写在代码围栏里完全安全，不会被 Vue 当成 <code v-pre>{{ }}</code> 模板插值。只有正文行内代码里出现裸的双花括号才需要 `<code v-pre>` 包裹——HCL 本身不产生这种写法。
:::

同一目录下所有 `.tf` 文件会被合并成一份配置，**文件名和块的先后顺序都不影响结果**——Terraform 只按依赖图决定执行序。常见约定按用途拆文件：`main.tf` / `variables.tf` / `outputs.tf` / `versions.tf`。

## 二、`resource` 与 `data`：管理 vs 读取

这是最容易混淆的一对：

- **`resource`（受管资源）**：Terraform **拥有并管理**它的生命周期——`apply` 会创建、更新、销毁它，并写进 state。
- **`data`（数据源）**：Terraform **只读**，用来查询「已经存在、不归我管」的信息——某个现成 AMI、当前账号 ID、别处建好的 VPC——把结果喂给受管资源。它**不创建任何东西**。

```hcl
# data：查询官方最新 Ubuntu AMI（只读，不创建）
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-*"]
  }
}

# resource：用查到的 AMI 创建实例（受管）
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id # 引用 data 结果
  instance_type = "t3.micro"
}
```

引用规则：受管资源 `<类型>.<名>.<属性>`，数据源要多带 `data` 前缀 `data.<类型>.<名>.<属性>`。

## 三、`variable` / `output` / `locals`

三者角色分明：`variable` 是**入参**，`output` 是**出参**，`locals` 是**内部中间量**。

### variable：入参

```hcl
variable "environment" {
  type        = string
  description = "部署环境"
  default     = "dev"

  # 校验：不满足条件直接报错，早失败好过 apply 到一半崩
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment 必须是 dev / staging / prod 之一。"
  }
}

variable "db_password" {
  type      = string
  sensitive = true # plan/apply 输出里打码，不明文回显
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

常用参数：`type`（类型约束，见下）、`default`（有默认即可选）、`description`、`sensitive`（输出打码）、`validation`（自定义校验）、`nullable`（是否允许 null）、`ephemeral`（**不写进 state 与 plan 文件**，用于临时敏感值）。

类型约束体系：原始类型 `string` / `number` / `bool`；集合类型 `list(...)` / `set(...)` / `map(...)`；结构类型 `object({...})` / `tuple([...])`；以及 `any`。

### output：出参

```hcl
output "instance_ip" {
  value       = aws_instance.web.public_ip
  description = "Web 实例公网 IP"
}

output "db_conn" {
  value     = aws_db_instance.main.endpoint
  sensitive = true # 敏感输出打码
}
```

`output` 是模块对外的唯一「返回值」——父模块只能通过 `module.<名>.<output名>` 拿到子模块内部的值，其余内部实现对外不可见（模块封装性，见[模块化篇](./modules)）。

### locals：内部中间量

```hcl
locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket" "assets" {
  bucket = "${local.name_prefix}-assets"
  tags   = local.common_tags # 复用，避免每个资源重抄一遍 tags
}
```

`locals` 用 `local.<名>`（单数）引用，适合抽取重复表达式、拼装派生值。它与 `variable` 的区别：`variable` 由外部传入，`locals` 由模块内部计算，不接受外部覆盖。

## 四、`count` vs `for_each`：造多个实例

需要「同一种资源来 N 份」时有两个 meta-argument，选错会埋大坑。

### count：按数量

```hcl
resource "aws_instance" "worker" {
  count         = 3 # 造 3 个
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  tags = {
    Name = "worker-${count.index}" # count.index 从 0 开始
  }
}

# 引用：带下标；引用全部用 splat
output "worker_ids" {
  value = aws_instance.worker[*].id
}
```

### for_each：按 map/set

```hcl
resource "aws_instance" "app" {
  for_each      = toset(["api", "web", "worker"]) # set of string
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  tags = {
    Name = "app-${each.key}" # each.key / each.value
  }
}

# 引用：带字符串键
output "api_id" {
  value = aws_instance.app["api"].id
}
```

### 关键差异：为什么优先 for_each

`count` 用**数字索引**标识实例（`[0]`、`[1]`……）。一旦你从中间删掉一个元素，后面所有元素的索引**整体前移**，Terraform 会认为「`[1]` 之后全变了」，导致**大量无辜资源被销毁重建**。

`for_each` 用**稳定的键**（map key / set 成员）标识实例。删掉 `"web"` 只影响 `"web"` 这一个，`"api"`、`"worker"` 的键没变、纹丝不动。

::: tip 经验法则
实例之间**只是数量堆叠、彼此等价**用 `count`（如「3 台一样的 worker」）；实例**各有身份、需要独立增删**用 `for_each`（如「api / web / worker 三类」「按 map 配置的一批子网」）。生产里绝大多数场景应该用 `for_each`。两者**不能同时**用在一个块上。
:::

## 五、依赖图与 `depends_on`

Terraform 把所有资源和它们的关系建成一张**有向无环图（DAG）**，据此决定：谁先建、谁后建、哪些可以**并发**执行（默认并行度 10，`-parallelism=N` 可调）。依赖有两种来源：

### 隐式依赖（首选）

只要 A 的参数里**引用**了 B 的属性，Terraform 就自动推断「A 依赖 B」，无需你声明：

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id # 引用 → 自动依赖：先建 vpc 再建 subnet
  cidr_block = "10.0.1.0/24"
}
```

绝大多数依赖都应该靠这种「引用即依赖」自然形成——它精确且不易忘。

### 显式依赖 `depends_on`（兜底）

当依赖关系**不体现在数据引用上**（比如 IAM 权限必须先生效，某资源才能正常工作，但代码里并没引用它的属性），用 `depends_on` 手动声明：

```hcl
resource "aws_iam_role_policy" "s3_access" {
  # ...授予 EC2 访问 S3 的权限...
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  # 代码没引用 policy 的属性，但逻辑上必须权限先就绪
  depends_on = [aws_iam_role_policy.s3_access]
}
```

::: warning depends_on 是最后手段
能靠引用表达的依赖就别用 `depends_on`。滥用它会让图变「保守」——Terraform 无法细粒度判断，可能牺牲并发、放大 drift 时的重建范围。只在「确有隐藏依赖且无法通过引用表达」时才用。
:::

## 六、`lifecycle`：干预资源生命周期

`lifecycle` 是 `resource` 内的嵌套块，用来覆盖 Terraform 的默认增删改行为，五个核心参数：

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  lifecycle {
    # 1) 先建新的再删旧的，避免替换时出现空窗（零停机替换）
    create_before_destroy = true

    # 2) 拦截销毁：任何会删除它的 plan 直接报错，防误删关键资源
    prevent_destroy = true

    # 3) 忽略这些属性的外部漂移，不因它们生成变更（如被自动伸缩改动的 tags）
    ignore_changes = [tags["LastModified"], ami]

    # 4) 当被引用对象变化时强制替换本资源
    replace_triggered_by = [aws_launch_template.web.latest_version]

    # 5) 前置/后置断言：不满足就让 plan/apply 失败
    precondition {
      condition     = data.aws_ami.ubuntu.architecture == "x86_64"
      error_message = "AMI 架构必须是 x86_64。"
    }
  }
}
```

- **`create_before_destroy`**：默认是「先删后建」，某些不可变资源替换时会出现服务空窗；打开它变「先建后删」，实现零停机替换（注意名字/端口冲突问题）。
- **`prevent_destroy`**：给数据库、state 桶等「删了要命」的资源上保险，任何销毁计划直接报错。
- **`ignore_changes`**：告诉 Terraform「这些字段就算漂移了也别管」，常用于「初始由 Terraform 建、之后交给别的系统改」的字段。
- **`replace_triggered_by`**：引用对象变化时强制替换（1.2 引入）。
- **`precondition` / `postcondition`**：把「假设」写成断言，不满足就早失败（1.2 引入的自定义条件检查）。

## 七、表达式、函数与 `dynamic` 块

HCL 是**表达式丰富**的配置语言，日常高频：

```hcl
locals {
  # 条件表达式
  instance_type = var.environment == "prod" ? "m5.large" : "t3.micro"

  # for 推导：从 list 造 map
  name_to_id = { for s in aws_subnet.all : s.tags.Name => s.id }

  # 内置函数（上百个）：字符串、集合、编码、加密、文件、网络……
  bucket   = lower(replace(var.project, "_", "-"))
  azs      = slice(data.aws_availability_zones.all.names, 0, 3)
  config   = jsondecode(file("${path.module}/config.json"))

  # try / can：优雅处理可能出错的表达式
  region = try(var.region, data.aws_region.current.name, "us-east-1")
}
```

需要**按集合动态生成多个嵌套块**时用 `dynamic`（否则得手写 N 个重复块）：

```hcl
resource "aws_security_group" "web" {
  name = "web-sg"

  dynamic "ingress" {              # 要生成的嵌套块名
    for_each = var.allowed_ports   # 遍历的集合
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
```

最后一个实用细节：内置 **`terraform_data`** 资源（替代已不推荐的 `null_resource`），它不创建真实基础设施，可用来存储值、借 `triggers_replace` 触发 provisioner 重跑，是「需要一个占位资源挂点逻辑」时的标准选择。表达式与函数的完整清单见[参考篇](../reference)。
