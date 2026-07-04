---
layout: doc
outline: [2, 3]
---

# 差异化特性与迁移选型

> 基于 OpenTofu 1.12 · 核于 2026-07

## 速查

- **招牌特性**：**客户端 state/plan 加密（1.7）**——落盘前加密 state 与 plan 文件，Terraform 开源版至今没有。
- **加密配置**：`terraform {}` 内 `encryption` 块或 `TF_ENCRYPTION` 环境变量；**key provider + method + state/plan** 三段式。
- **key provider**：`pbkdf2`（口令）、`aws_kms`、`gcp_kms`、`openbao`（Vault Transit），以及 Azure Key Vault 与 external（实验）。
- **加密 method**：`aes_gcm`（16/24/32 字节 key）；`unencrypted`（迁移过渡）；external（实验）。
- **key 轮换**：`fallback` 块支持自动回退旧 key 读取、用新 key 写入；`encrypted_metadata_alias`（1.9）固定元数据 ID 防误伤。
- **其他 OpenTofu-only**：provider-defined functions、`for_each` import、`removed` 块（1.7）；early variable evaluation（1.8）；provider `for_each`、`-exclude`（1.9）；OCI registry（1.10）；ephemeral、**`enabled` 元参数**（1.11）；`destroy = false`、动态 `prevent_destroy`（1.12）。
- **`enabled` 元参数**：`enabled = false` 直接关掉资源/模块，比 `count = var.x ? 1 : 0` 的丑写法优雅（1.11）。
- **`-exclude`**：`tofu plan -exclude=<addr>`，`-target` 的反选，圈定「除了它以外全做」。
- **迁移四步**：**① 备份 state+代码 → ② 装 `tofu` → ③ `tofu init` 初始化验证 → ④ 小步改动试跑**。
- **回退成本**：没用 OpenTofu-only 特性时回 Terraform 基本无痛；**用了独有特性（尤其 state 加密）后回退代价高**。
- **各自演进**：两边独立路线，特性会越差越远——OpenTofu-first 未必进 Terraform，反之亦然；选型要按**长期**算。
- **选型主线**：许可/开源/中立/独有特性 → OpenTofu；深绑 HCP Terraform/TFE 商业生态 → Terraform。

## 一、招牌特性：客户端 state / plan 加密

这是 OpenTofu **最有分量**的差异化特性，也是它相对 Terraform 开源版最硬的卖点。

### 为什么重要

Terraform/OpenTofu 的 **state 文件里会明文存敏感值**——数据库密码、私钥、token，只要资源属性里有，就可能落进 state。传统做法只能靠「backend 层加密（如 S3 SSE）」和「严格的访问控制」，但 **state 内容本身在工具侧是明文**。OpenTofu 的 state 加密把这一步提前到**客户端**：**写盘前就加密，`tofu` 之外的任何人拿到 state 文件都是密文**。

### 怎么配

加密配置写在 `terraform {}` 的 `encryption` 块里（或用 `TF_ENCRYPTION` 环境变量传入），三段式结构：**key provider（拿 key）→ method（怎么加密）→ state/plan（对谁生效）**。

```hcl
terraform {
  encryption {
    # 1) key provider：从哪拿加密密钥（这里用口令派生）
    key_provider "pbkdf2" "passphrase" {
      passphrase = var.encryption_passphrase # 口令 >= 16 字符
      # 默认 600000 次迭代
    }

    # 2) method：用什么算法加密
    method "aes_gcm" "primary" {
      keys = key_provider.pbkdf2.passphrase
    }

    # 3) 对 state / plan 生效
    state {
      method = method.aes_gcm.primary
    }
    plan {
      method = method.aes_gcm.primary
    }
  }
}
```

生产更常用云 KMS 托管密钥：

```hcl
terraform {
  encryption {
    key_provider "aws_kms" "kms" {
      kms_key_id = "arn:aws:kms:...:key/xxxx"
      region     = "ap-northeast-1"
      key_spec   = "AES_256"
    }
    method "aes_gcm" "kms" {
      keys = key_provider.aws_kms.kms
    }
    state { method = method.aes_gcm.kms }
    plan  { method = method.aes_gcm.kms }
  }
}
```

- **key provider**：`pbkdf2`（口令派生，≥16 字符、默认 60 万次迭代）、`aws_kms`、`gcp_kms`、`openbao`（OpenBao/Vault Transit，兼容 Vault 1.14），以及 Azure Key Vault 与 external（实验，跑外部命令）。
- **method**：`aes_gcm`（业界标准，key 需 16/24/32 字节）；`unencrypted`（显式允许读明文，仅用于迁移过渡）；external（实验）。
- **也覆盖 `terraform_remote_state`**：读远程 state 数据源同样能配加密。

### key 轮换与回退

```hcl
method "aes_gcm" "new" { keys = key_provider.aws_kms.new }
method "aes_gcm" "old" { keys = key_provider.aws_kms.old }

state {
  method = method.aes_gcm.new   # 写：永远用新 method
  fallback {
    method = method.aes_gcm.old # 读：新的读不出就回退旧的
  }
}
```

- **`fallback`**：读 state/plan 时若**新 method 读不出**，自动**回退**用 fallback method；**写盘一律用新 method**——这就实现了平滑轮换。
- **`encrypted_metadata_alias`（1.9）**：给加密数据显式设一个稳定 ID，**避免重命名 key provider / method 时元数据对不上导致数据读不出**。官方特别提醒：**别随意重命名 key provider / method**，需要改时用 alias 或 fallback 兜住。

::: warning 加密不是万能
state 加密保护的是**静态数据（at rest）**。它**不防数据丢失、不防重放攻击**；运行 `tofu` 的人依然能在内存里看到解密后的 state。它也**不与 Terraform 互通**——开了加密的 state，Terraform 读不了。
:::

## 二、其他 OpenTofu-only（或先行）特性

按版本梳理 OpenTofu 相对 Terraform 开源版**独有或明显先行**的能力：

- **1.7**
  - **state/plan 加密**（见上，招牌）。
  - **provider-defined functions**：provider 可自带函数、在 HCL 里直接调用，扩展内置函数集。
  - **`for_each` in `import` 块**：批量导入现有资源。
  - **`removed` 块**：优雅地把资源移出配置（从 state 移除而非销毁的声明式写法）。
- **1.8**
  - **early variable evaluation**：允许在 `backend`、module `source`、加密配置等**早期**就用变量/locals，突破 Terraform「这些位置不能用变量」的限制。
  - **`.tofu` 文件扩展名**（见[兼容与 CLI](./compatibility-cli)）。
- **1.9**
  - **provider `for_each`**：`provider` 块支持 `for_each` 迭代（如按 region 批量生成 provider 实例），解决多区域 / 多账号老大难。
  - **`-exclude` 标志**：`tofu plan/apply -exclude=<addr>`，是 `-target` 的**反选**——「除了它，其余都做」。
  - **`encrypted_metadata_alias`**（配合加密）。
- **1.10**
  - **OCI registry 支持**：从 OCI 制品仓库分发 provider / module。
- **1.11**
  - **ephemeral values / resources**：临时值不落 state/plan。
  - **`enabled` 元参数**：资源 / 模块新增 `enabled`，与 `count` / `for_each` 并列——`enabled = false` 直接关掉，告别 `count = condition ? 1 : 0` 的丑写法。
- **1.12**
  - **`destroy = false` 生命周期元参数**：把对象**移出 state 但不销毁**远端真实资源。
  - **动态 `prevent_destroy`**：`lifecycle` 里可引用其它模块符号（不再要求字面量）。
  - **`tofu init` 默认写全 `zh:` + `h1:` 校验和**、`-json-into=FILENAME` 同时输出机器可读文件、provider 安装并发化等。

```hcl
# enabled 元参数（1.11）：比 count = x ? 1 : 0 优雅
resource "aws_instance" "bastion" {
  enabled       = var.enable_bastion
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
}
```

```bash
# -exclude（1.9）：除了这台，其余都 apply
tofu apply -exclude=aws_instance.legacy
```

::: tip 别把「OpenTofu 有」= 「Terraform 一定没有」
两边都在快速迭代，部分特性是**并行出现**的（如 provider-defined functions、`removed` 块、ephemeral values 在 Terraform 也有对应）。真正**至今仍是 OpenTofu 独占**的硬差异是 **客户端 state/plan 加密**、**`-exclude`**、**provider `for_each`**、**`enabled` 元参数**、**`.tofu` 文件**、**OCI registry** 等。下笔选型前，以两边当时的官方 What's new 为准核对。
:::

## 三、从 Terraform 迁移到 OpenTofu

官方迁移指南给出的是**四步最小路径**：

1. **备份 state 与代码**：迁移前先把 `terraform.tfstate`（或远程 state）和整个配置备份，出问题能回滚。
2. **安装 `tofu`**：见[入门](../getting-started)。
3. **`tofu init` 初始化并验证**：在现有配置目录直接 `tofu init`，让它接管现有 state 与 provider；随后 `tofu plan` 应显示 **`No changes`**（若显示大量变更，说明有不兼容点，停下排查）。
4. **小步试跑**：先用一个**低风险的小改动**跑通 `plan → apply`，确认行为一致，再全面切换。

```bash
# 在已有 Terraform 项目里
cp terraform.tfstate terraform.tfstate.bak   # ① 备份
brew install opentofu                          # ② 装 tofu
tofu init                                      # ③ 接管现有 state/provider
tofu plan                                      # 期望：No changes
```

需要额外当心：

- **`terraform_remote_state`**：多份配置用它互相传值的系统，迁移要成对推进、注意版本与加密一致（见[兼容与 CLI](./compatibility-cli)）。
- **CI/CD**：把流水线里的 `terraform` 命令替换为 `tofu`；`.terraformrc` 相关配置迁到 `.tofurc`。
- **HCP Terraform / TFE 集成**：若重度依赖 HashiCorp 的远程执行 / 私有 registry，迁移前要评估替代方案（OpenTofu 侧可用 Spacelift、Scalr、env0 等平台或自建）。

## 四、各自演进：特性分叉是长期变量

**这是选型时最容易被忽略、却最要紧的一点。**

分叉那天，OpenTofu ≈ Terraform 1.6；但**两边此后各走各路**：

- OpenTofu 由社区 / 基金会按 RFC 决定特性，**先行做了 state 加密、`-exclude`、provider `for_each`、`enabled`** 等。
- Terraform 由 HashiCorp（现属 IBM，2025-02 完成约 64 亿美元收购）按自己的商业路线推进，也有自己的新特性。
- 结果是**特性集持续分叉**：一段用了某边独有特性的配置，**就不再能无缝跑到另一边**。

::: warning 迁移是「单向门」吗
不完全是，但**越往后越难回头**。只要你**没用**任何一边的独有特性，来回迁移基本无痛（改命令名即可）；一旦**用了独有特性**（尤其 **state 加密**——加密后的 state Terraform 根本读不了），回退就要先「卸掉」这些特性、解密 state，代价陡增。**把选型当成长期承诺，而非可随时反悔的开关。**
:::

## 五、OpenTofu vs Terraform：怎么选

没有放之四海皆准的答案，按下面几条对号入座：

| 你的处境 | 倾向 |
| --- | --- |
| 在意**许可确定性 / 纯开源 / 厂商中立** | **OpenTofu** |
| 公司**在做与 HashiCorp 竞争的产品**（IaC 平台、托管 state…） | **OpenTofu**（BUSL 有合规风险） |
| 想用 **state 加密 / `-exclude` / provider `for_each` / `enabled` / OCI** | **OpenTofu** |
| 用 **Spacelift / Scalr / env0** 等第三方 IaC 平台 | 多**默认 / 优先 OpenTofu** |
| 深度绑定 **HCP Terraform / Terraform Enterprise** 商业能力 | **Terraform** |
| 依赖**只有 Terraform 才有**的某新特性或商业集成 | **Terraform** |
| 只是本地 / 小团队自用、都不涉及竞品、无特殊特性需求 | **两者皆可**，看团队熟悉度 |

::: tip 落到一句话
**「这套基础设施代码要活很多年、要开源可控、可能嵌进自家产品」→ OpenTofu；「已经吃着 HashiCorp 商业全家桶、且明确不做竞品」→ Terraform。** 中间地带则看你最想要哪几个独有特性、以及团队与生态的现状。
:::
