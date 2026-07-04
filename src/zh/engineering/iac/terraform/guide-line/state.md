---
layout: doc
outline: [2, 3]
---

# 状态管理：state 与 backend

> 基于 Terraform（1.x）· 核于 2026-07

## 速查

- **state 是什么**：`terraform.tfstate`（JSON），记录「配置里的资源 ↔ 真实世界的对象」一一映射，是 Terraform 的**真相之源**。
- **为什么需要**：Terraform 靠它知道「谁已经建过、云上对象 ID 是什么」，才能算增量、才能销毁正确的东西；大规模下还缓存属性提升性能。
- **别手改**：`terraform.tfstate` 与 `.tfstate.backup` 由 Terraform 维护，手改易损坏；改动走命令。
- **本地 backend 之痛**：state 在单机、无法多人协作、无锁、易进版本库泄密——团队必须上**远程 backend**。
- **远程 backend**：`s3` / `gcs` / `azurerm` / `consul` / HCP Terraform；在 `terraform { backend "..." {} }` 声明，一个配置只能一个 backend。
- **backend 块限制**：**不能引用变量/locals**（early evaluation）；缺的参数靠 `init -backend-config` 补（partial configuration）。
- **state locking（状态锁）**：多人同时 `apply` 会腐化 state；backend 支持锁则自动加锁，`force-unlock` 应急解锁。
- **drift（漂移）**：有人绕过 Terraform 手改了云资源；`plan` 会检测并计划改回配置描述的样子。
- **`refresh`**：`plan`/`apply` 前默认刷新 state 与真实状态对齐；`plan -refresh-only` 只刷新看差异。
- **`import`**：把已存在的资源纳入管理——现代用 `import` 块（可配 `-generate-config-out` 生成配置），旧法 `terraform import` 命令。
- **敏感值风险**：密码、私钥、token 等会**明文存进 state**——务必远程 backend + 加密 + 访问控制，切勿进 Git。
- **state 手术**：`state list` / `show` / `mv`（重命名/搬移地址）/ `rm`（脱管不删真实资源）/ `pull` / `push`，高危、慎用。

## 一、state 是什么，为什么必须有

Terraform 官方定义：state 的首要目的是**「存储远程系统中的对象与配置中声明的资源实例之间的绑定关系」**。换句话说，state 是那本「账」——记着「我配置里那个 `aws_instance.web`，对应云上真实的 `i-0abc123`」。

没有 state，Terraform 就是「无记忆」的：它无法知道某个资源上次是否建过、对应的真实对象 ID 是多少，也就无法算增量、无法在你删配置时找到该销毁谁。state 的三大作用：

1. **映射真实世界**：资源地址 ↔ 真实对象 ID 的一一对应。
2. **记录元数据与依赖**：包括资源间依赖顺序，销毁时用得上。
3. **性能**：大规模基础设施下，state 缓存资源属性，`plan` 时不必对每个资源都实时查一遍云 API（可选 refresh）。

默认 state 存在工作目录的 `terraform.tfstate`（外加一份 `terraform.tfstate.backup`），是 JSON 文本。官方明确警告：**不要直接编辑这个文件**——手改极易造成 state 与真实世界不一致，进而 `apply` 出灾难性结果。要改，走 `terraform state` 子命令。

## 二、本地 state 的问题 → 远程 backend

默认使用 **`local` backend**——state 就是本机磁盘上那个文件。个人练习没问题，团队则处处踩雷：

- **无法协作**：state 在你电脑上，同事看不到、拿不到最新真相。
- **没有锁**：两人同时 `apply`，两份进程同时改同一份 state，**必然腐化**。
- **易泄密**：图省事把 `terraform.tfstate` 提交进 Git——而 state 里可能有明文密码（见第七节），等于把密钥推上了仓库。
- **易丢失**：本地文件误删、换机器就没了。

解决方案是 **remote backend（远程后端）**：把 state 挪到共享的、支持锁和加密的远程存储。**backend 定义的就是「Terraform 把 state 存哪」**。

## 三、配置远程 backend

在顶层 `terraform` 块里声明 `backend`，块标签即 backend 类型。以最常见的 AWS S3 为例：

```hcl
terraform {
  backend "s3" {
    bucket       = "my-org-tfstate"
    key          = "prod/network/terraform.tfstate" # state 在桶里的路径
    region       = "ap-northeast-1"
    encrypt      = true       # 服务端加密
    use_lockfile = true       # 用 S3 原生对象锁（1.10+，替代 DynamoDB 锁表）
  }
}
```

内置远程 backend 有 `s3`、`gcs`、`azurerm`、`consul`、`local` 等；HCP Terraform 用 `cloud` 块接入。要点铁律：

- **一个配置只能有一个 backend 块**。
- **backend 块里不能引用变量、locals 或任何资源属性**——因为 backend 要在一切之前初始化，那时这些值还没求值。
- 因此**敏感/环境相关的参数常故意留空**，`init` 时再补——这叫 **partial configuration**：

```bash
# 缺的参数用 -backend-config 补（文件或 KEY=VALUE）
terraform init -backend-config="bucket=my-org-tfstate" \
               -backend-config=prod.s3.tfbackend
```

凭据永远走环境变量或 CI 注入，不要写进 backend 块（它会落进 `.terraform/` 和 plan 文件）。首次配置或切换 backend 时，`init` 会问你是否把现有 state **迁移**过去。

## 四、state locking（状态锁）

多人/多进程同时操作同一份 state 会导致写冲突、state 腐化。支持锁的 backend 会在 `apply`（以及会写 state 的操作）期间**自动加锁**，别人此时操作会等待或报错：

```
Error: Error acquiring the state lock
Lock Info:
  ID:        1a2b3c...
  Operation: OperationTypeApply
  Who:       alice@laptop
```

- **S3**：早期靠额外的 **DynamoDB 锁表**（`dynamodb_table`）；1.10 起支持 **S3 原生对象锁 `use_lockfile = true`**，可省掉 DynamoDB。
- **进程被强杀导致锁没释放**时，用 `terraform force-unlock <LOCK_ID>` 应急解锁——**务必确认真的没有别的进程在跑**，否则解错锁 = 主动制造腐化。

## 五、drift（漂移）与 refresh

**drift** 指「真实世界被 Terraform 之外的力量改动了」——有人在控制台手改、别的脚本动了它、云厂商自动调整了某属性。

Terraform 在 `plan` / `apply` 前默认做一次 **refresh**：读云上真实状态，刷新到 state 的内存副本，再拿它和配置比。于是漂移会在 `plan` 里现形，并被计划**改回配置描述的期望值**（因为「配置才是真相」）。

```bash
# 只刷新、只看漂移，不打算改任何东西
terraform plan -refresh-only

# 大规模场景可跳过刷新加速 plan（牺牲漂移检测，慎用）
terraform plan -refresh=false
```

这也解释了那条铁律：**别绕过 Terraform 手改基础设施**——否则要么被下次 `apply` 悄悄改回、要么两边打架。

## 六、`import`：把已有资源纳入管理

历史遗留的、手工建的资源，想交给 Terraform 管，用 **import** 建立「真实对象 → state 条目」的绑定（import **只补 state，不创建资源**）。

现代做法是**配置驱动的 `import` 块**（1.5 引入），声明式、可 review、可 plan：

```hcl
import {
  to = aws_s3_bucket.legacy   # 要绑定到哪个资源地址
  id = "my-existing-bucket"   # 真实对象的标识（因 Provider 而异）
}

resource "aws_s3_bucket" "legacy" {
  # 手写配置，或先留空用 -generate-config-out 生成
}
```

不想手写资源配置，可让 Terraform 帮你生成：

```bash
# 依据 import 块反查真实资源，把配置写到文件
terraform plan -generate-config-out=generated.tf
terraform apply   # 执行导入
```

旧法是命令式的 `terraform import <地址> <id>`——它只改 state，配置仍需你手写，且不进 plan 审阅。新项目优先用 `import` 块。

## 七、敏感值明文进 state 的风险

这是 state 最容易被忽视、后果最严重的一点：**Terraform 会把资源的敏感属性明文写进 state**——数据库密码、生成的私钥、访问 token、随机口令等，即便你在 `variable`/`output` 上标了 `sensitive`（那只影响**终端回显打码**，**不影响 state 里的存储**）。

由此推出的硬性要求：

- **绝不把 state 提交进 Git** 或任何不支持锁与访问控制的存储——等于泄露全部密钥。
- **远程 backend 必开加密**（S3 `encrypt`/SSE-KMS、GCS/azurerm 默认加密）+ **最小权限访问控制**（谁能读写这个桶）。
- **需要临时敏感值不落盘**时，用变量的 `ephemeral = true`（1.10+）——它**不写进 state 和 plan 文件**。
- 减少把密钥「物化」进 state 的做法：用 `data` 源在运行时从 Vault / Secrets Manager 拉取，而非用 Terraform 生成并存下来。

## 八、state 手术：`terraform state`（高危）

state 出问题、或需要重构资源地址时，用 `terraform state` 子命令**外科手术**——高危，先备份：

```bash
terraform state list                      # 列出 state 里所有资源
terraform state show aws_instance.web      # 看某资源在 state 里的属性

# 重命名 / 搬移地址：把资源在 state 里换个地址，不动真实资源
terraform state mv aws_instance.web aws_instance.frontend

# 脱管：从 state 移除，真实资源【不删除】，之后 Terraform 不再管它
terraform state rm aws_instance.web

terraform state pull > backup.tfstate      # 拉出当前 state（备份/检查）
```

更推荐的重构方式是**配置里的 `moved` 块**（声明式记录地址变迁，团队可 review，代替易忘的 `state mv`）和 `removed` 块（声明式脱管）。任何 state 操作前，**先 `state pull` 备份**——这是能救命的习惯。

到这里，state 的「是什么 / 为什么远程 / 怎么锁 / 怎么处理漂移与导入 / 敏感值风险」就齐了。协作与多环境（workspace、HCP Terraform、CI 里的 remote state）继续看[生态与工程化篇](./ecosystem)。
