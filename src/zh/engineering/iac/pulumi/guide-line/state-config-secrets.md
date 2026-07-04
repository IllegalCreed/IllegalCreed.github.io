---
layout: doc
outline: [2, 3]
---

# 栈·配置·密钥·状态

> 基于 Pulumi v3 · 核于 2026-07

## 速查

- **stack = 环境实例**：一套程序的隔离实例，各有**独立 config + 独立 state**；`pulumi stack init/select/ls/rm`。
- **两个 yaml**：`Pulumi.yaml`（项目：name/runtime）由 `pulumi new` 建；`Pulumi.<stack>.yaml`（该栈 config + 加密 secrets）由 `pulumi config` 维护，**该提交进版本库**。
- **设配置**：`pulumi config set <key> [value]`；带命名空间 `pulumi config set aws:region us-west-2`；无命名空间时默认用项目名。
- **读配置（代码）**：`new pulumi.Config()` → `require`（缺则抛错）/ `get`（缺则 undefined）/ `getNumber`/`getBoolean`/`requireObject<T>`。
- **结构化配置**：`pulumi config set --path 'data.nums[0]' 1` + `config.requireObject<T>("data")`。
- **配置只读**：程序运行期**只能读不能写** config；要在代码里增删栈/配置得用 Automation API。
- **设密钥**：`pulumi config set --secret dbPassword S3cr37`；列出时显示 `[secret]`，打印也被 mask。
- **读密钥（代码）**：`config.requireSecret("k")` 返回 `Output`（加密态）；`pulumi.secret(v)` 把普通值标记为 secret。
- **secret 会传播**：secret output 经 `apply`/`all` 组合后结果**仍是 secret**，在 state 里保持加密；`additionalSecretOutputs` 可手动补标。
- **secret provider**：默认 Pulumi Cloud（每栈独立密钥）；可换 `passphrase` / `awskms://` / `azurekeyvault://` / `gcpkms://` / `hashivault://`——`pulumi stack init --secrets-provider=...`。
- **state 后端**：默认 **Pulumi Cloud**；自管（DIY）可选 **S3 / Azure Blob / GCS / 本地 / PostgreSQL**。
- **登录**：`pulumi login`（Cloud）/ `--local`（=`file://~`）/ `s3://桶` / `azblob://容器` / `gs://桶` / `postgres://...`；或设 `PULUMI_BACKEND_URL`。
- **物理 ID 明文坑**：资源的物理 ID **永远明文**存 state，无法加密——别把敏感信息放进它。

## 一、stack：环境的隔离实例

**stack（栈）是 Pulumi 的部署单元**：同一套程序的一个**隔离的、可独立配置**的实例。官方常见用法就是「一个环境一个 stack」——`development` / `staging` / `production`，或按 feature 分支开临时栈。每个 stack 拥有**独立的 config** 和**独立的 state**，互不污染。

```bash
pulumi stack init prod        # 新建并切到 prod
pulumi stack ls               # 列出本项目所有 stack（带最近更新等元信息）
pulumi stack select dev       # 切换活动 stack
pulumi stack rm staging       # 删除（空）stack
```

两个配置文件分工明确：

- **`Pulumi.yaml`（项目级）**：定义 `name`、`runtime`、`description`，由 `pulumi new` 创建，跨 stack 共享。
- **`Pulumi.<stack>.yaml`（stack 级）**：存**该 stack 的 config 与加密后的 secrets**。官方特别强调：它由 `pulumi config` 命令维护，**并非** `pulumi stack init` 创建。**它应当提交进版本库**（secrets 已加密，安全）。

程序里可用 `pulumi.getStack()` 拿当前 stack 名，用真实 `if` 分环境逻辑（见[入门](../getting-started)）。

## 二、配置（Configuration）

配置是「**每个 stack 可不同的参数**」——区域、实例规格、副本数、域名……用 CLI 设、用代码读。

### 用 CLI 设置与查看

```bash
pulumi config set aws:region us-west-2   # 带命名空间的键
pulumi config get aws:region             # us-west-2
pulumi config                            # 列出全部（--json 输出 JSON）
```

键格式是 `[<命名空间>:]<键名>`。**不带命名空间时，Pulumi 自动用 `Pulumi.yaml` 里的项目名作命名空间**（所以 provider 配置要显式写 `aws:region`，本项目自定义配置写 `myproj:size` 或直接 `size`）。多行/转义值可管道输入：`cat key.pub | pulumi config set publicKey`。

### 在代码里读取

```ts
const config = new pulumi.Config();          // 默认命名空间 = 项目名
const name = config.require("name");         // 缺失则抛异常
const size = config.getNumber("size") ?? 3;  // 缺失返回 undefined，兜个默认
const on = config.getBoolean("enabled");

// 读别的命名空间（如 aws）
const awsCfg = new pulumi.Config("aws");
const region = awsCfg.require("region");
```

- **`require(k)`**：缺失**抛异常**（关键配置用它，早失败）。
- **`get(k)`**：缺失返回 `undefined`（配 `??` 给默认值）。
- `getNumber` / `getBoolean` / `getObject<T>` 及其 `require*` 变体做类型转换。

::: warning 配置只能读，不能在程序里写
官方明确：**配置值只能在程序执行期被「读」，不能被「设」**。想在代码里编程式地创建/更新 stack、写配置，得用 **Automation API**（见[生态与选型](./ecosystem-selection)）。
:::

### 结构化配置

嵌套结构用 `--path` 设置、`requireObject<T>` 读取：

```bash
pulumi config set --path 'data.active' true
pulumi config set --path 'data.nums[0]' 1
```

```ts
interface Data { active: boolean; nums: number[]; }
const data = new pulumi.Config().requireObject<Data>("data");
// 之后用标准对象访问 data.active / data.nums[0]
```

## 三、Secrets：默认加密的敏感值

这是 Pulumi 相对 Terraform 的重要优势。Pulumi **把敏感值加密后存进 state**，并自动「**把由 secret 输入派生出的数据也标记为 secret、把任何含 secret 的资源属性整体加密**」。

### 设置与使用

```bash
pulumi config set --secret dbPassword S3cr37   # 加密存入 Pulumi.<stack>.yaml
pulumi config                                   # 该项显示 [secret]，不回显明文
```

```ts
const config = new pulumi.Config();

// 读密钥：返回 Output<string>（加密态），不会变成明文字符串
const dbPassword = config.requireSecret("dbPassword");

// 直接把它喂给资源——保持加密
const param = new aws.ssm.Parameter("db", {
  type: "SecureString",
  value: dbPassword,
});

// 把一个普通值显式标记为 secret
const token = pulumi.secret("hardcoded-but-should-be-hidden");
```

其它语言对应：`Output.secret()`（Python）、`ToSecret()`（Go）。

### secret 如何传播

secret 本质是**带 secret 标记的 `Output`**。当它经 `apply()` / `pulumi.all()` 与别的 output 组合，**结果 output 也自动是 secret**，在 state 保持加密、CLI 里显示 `[secret]`。注意：`apply` 的回调里拿到的是**解密后的明文**——回调内要谨慎，别把它写进日志或非 secret 的输出。

需要把某个「本来不算 secret，但你希望隐藏」的资源输出补标为 secret，用资源选项 `additionalSecretOutputs`。

::: warning 物理 ID 永远明文
官方明确：**资源的物理 ID 始终以明文存在 state 里，无法加密**。所以别把敏感信息塞进会成为资源 ID/名字的字段。
:::

### secret provider：谁来加密

加密密钥的来源可在 `pulumi stack init` 时选择：

```bash
pulumi stack init prod --secrets-provider="awskms://<key-id>?region=us-east-1"
```

| provider | URL 形式 | 说明 |
| --- | --- | --- |
| **默认（Pulumi Cloud）** | 无需指定 | Pulumi Cloud 为**每个 stack** 管一把独立密钥 |
| **passphrase** | `passphrase` | 用户自设口令（存 `PULUMI_CONFIG_PASSPHRASE`），DIY 后端常用 |
| **AWS KMS** | `awskms://<key-id>?region=us-east-1` | 用 AWS KMS 密钥 |
| **Azure Key Vault** | `azurekeyvault://<vault>.vault.azure.net/keys/<key>` | |
| **GCP KMS** | `gcpkms://projects/P/locations/L/keyRings/R/cryptoKeys/K` | |
| **HashiCorp Vault** | `hashivault://<key-name>` | 需 `VAULT_SERVER_URL` / `VAULT_SERVER_TOKEN` |

加密后的配置文件**可安全提交**——解密需要 Pulumi Cloud 访问权或对应的加密 provider 凭据。

## 四、State 与后端

**state 是 Pulumi 记录基础设施的元数据**：每个 stack 有自己的 state，Pulumi 靠它知道「何时、如何创建/读取/删除/更新」资源。后端分两类：

### Pulumi Cloud（默认，托管）

`pulumi login` 即用，state 托管在 Pulumi Cloud（或自托管的 Pulumi Cloud 实例 `pulumi login https://pulumi.acmecorp.com`）。省心，且自带并发锁、历史、协作、加密密钥托管。

### DIY / 自管后端

不想把 state 交给云端时，可自管到多种存储。**登录即选后端**：

```bash
pulumi login --local                 # 本地文件，等价 pulumi login file://~
pulumi login file:///app/data        # 本地自定义路径

pulumi login s3://<bucket>                                    # AWS S3
pulumi login 's3://<bucket>?region=us-east-1&profile=<p>'     # 带区域/凭据
pulumi login 's3://<bucket>?endpoint=my.minio.local:8080&disableSSL=true&s3ForcePathStyle=true'  # Minio/Ceph 等 S3 兼容

pulumi login azblob://<container>                             # Azure Blob（需 AZURE_STORAGE_ACCOUNT 等）
pulumi login 'azblob://<container>?storage_account=<acct>'

pulumi login gs://<bucket>                                    # Google Cloud Storage（用 ADC）
pulumi login postgres://<user>:<pass>@<host>:<port>/<db>      # PostgreSQL
```

也可不每次 `login`，改设环境变量 `PULUMI_BACKEND_URL`，或在 `Pulumi.yaml` 写：

```yaml
backend:
  url: s3://my-pulumi-state-bucket
```

::: warning DIY 后端的取舍
DIY 后端默认带**基础的文件锁**，但**备份、访问控制、并发治理要你自己负责**——团队协作/CI 高并发场景，Pulumi Cloud 的托管锁与历史更稳。凭据别写进命令行（`postgres://user:pass@...` 会进 shell 历史），用环境变量。
:::

### 迁移、快照与 refresh

- **换后端**：用 `pulumi stack export` / `import` 搬家：

  ```bash
  pulumi stack export --show-secrets --file prod.stack.json
  # 换一个后端 pulumi login ...，再：
  pulumi stack import --file prod.stack.json
  ```

- **checkpoint（检查点）**：Pulumi 把 state 存成**事务性快照**，中途失败也能可靠恢复。
- **`pulumi refresh`**：把 state 与云上**真实状态**同步（检测并纳入外部漂移）。Pulumi 默认不主动核对现状，怀疑漂移时手动 `refresh` 或 `up --refresh`。

## 五、ESC：环境、密钥与配置的统一层

**Pulumi ESC（Environments, Secrets, and Configuration）**是更上层的能力：把 secrets 与配置抽成可组合、可复用的**环境（environment）**，供**多个 stack、甚至非 Pulumi 的应用/CI** 共享，并能**动态拉取**云厂商密钥（如用 OIDC 换临时凭据，避免长期密钥落盘）。当多个 stack/项目要共享同一套密钥与配置来源时，ESC 比在每个 `Pulumi.<stack>.yaml` 里各写一份更集中、更安全。详见 [ESC 文档](https://www.pulumi.com/docs/esc/)。

配置怎么在代码里参与运算、secret 怎么随 output 传播，回顾[编程模型](./programming-model)；provider 生态与 Automation API 见[生态与选型](./ecosystem-selection)。
