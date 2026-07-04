---
layout: doc
outline: [2, 3]
---

# 入门：通用语言写 IaC，声明式引擎执行

> 基于 Pulumi v3 · 核于 2026-07

## 速查

- **一句话**：Pulumi 让你用 **TS/JS/Python/Go/C#/Java/YAML** 写基础设施，底层仍是**声明式期望状态引擎**——**语言命令式，模型声明式**。
- **不是新 DSL**：没有 HCL 那样的专用语言，你用的就是本语言的循环/条件/函数/类/包/测试框架/IDE 补全。
- **三层架构**：**语言宿主（language host）**跑你的程序并把「资源注册」发给**部署引擎（engine）**；引擎对比 state 算差异；**provider** 真正调云 API。引擎**不直接**碰 AWS。
- **注册 ≠ 创建**：`new aws.s3.Bucket("b")` 只是「声明这个桶属于期望状态」，不代表桶已建好。
- **核心命令**：`pulumi new`（起项目）→ `pulumi preview`（只算不做，看 diff）→ `pulumi up`（执行）→ `pulumi refresh`（同步真实态）→ `pulumi destroy`（拆除）。
- **变更符号**：`+` 建、`~` 原地改、`+-` 替换（先建后删）、`-` 删、无符号=不变。
- **项目文件**：`Pulumi.yaml`（项目名/runtime）+ 程序入口（TS 是 `index.ts`）+ 语言依赖（`package.json`）。
- **stack = 环境**：程序的一个隔离实例，`dev`/`staging`/`prod` 各一个，各有独立 config 与 state。
- **登录后端**：首次要 `pulumi login`——默认连 **Pulumi Cloud**，也可 `pulumi login --local` 或 `pulumi login s3://...` 自管 state。
- **导出结果**：`export const x = res.url;` → `pulumi stack output x` 取值；secret 默认打码。
- **幂等**：程序描述目标，反复 `up` 收敛到同一状态；没变化时 preview 显示无操作。
- **确定性铁律**：逻辑名（`new Bucket("这个名")`）必须每次运行都稳定，别用 `Math.random()`/`Date.now()` 拼名字——详见[生态与选型](./guide-line/ecosystem-selection)。

## 一、Pulumi 到底特别在哪

「基础设施即代码」的公理是：**每一次基础设施变更都应像应用代码一样被写进文件、进版本库、经 review、可复现、可回滚**，取代「登录控制台手点」。在这条主线上，工具分成两大流派：

- **专用 DSL 流派**：Terraform（HCL）、CloudFormation（YAML/JSON）——发明一门配置语言来写「要什么」。
- **通用语言流派**：**Pulumi** 是代表——**不发明语言**，直接用你已经会的 TS/Python/Go/C#/Java 写。

Pulumi 的独特价值来自后者：你能用**真正的 `for` 循环**造 N 个子网、用**真正的 `if`** 分环境、用**函数与类**抽象重复、用 **npm/pip** 复用包、用 **Jest/pytest** 给基础设施写单元测试、享受 **IDE 的补全与类型检查**。

但**最容易被误解的一点**必须先说清：

::: warning 语言是命令式的，模型是声明式的
你写的 TS 程序会「从上到下执行」，看起来像命令式脚本；但 Pulumi **不是**在「一步步调 API 建资源」。程序执行时，每 `new` 一个资源只是**向引擎声明「这个资源属于我想要的最终状态」**，并不真的创建。程序跑完，引擎拿到一张完整的**期望状态资源图**，再和「上次部署的状态」对比、算差异、驱动 provider 落地。所以 Pulumi 依然是**声明式 / 期望状态**工具，只是用命令式语言来「搭图」。
:::

理解这句话，后面的一切（为什么 Output 是异步的、为什么逻辑名必须确定、为什么能幂等）才顺理成章。

## 二、三层架构：程序是怎么变成基础设施的

Pulumi 一次 `up` 背后有三个角色协作：

1. **语言宿主（language host）**：由「语言执行器」`pulumi-language-<语言>`（如 `pulumi-language-nodejs`）启动你的运行时，跑你的程序。语言 SDK 侦测到每一次资源实例化，就向引擎发一个**资源注册（resource registration）**请求，然后**继续往下执行**。官方原话：这次注册「**并不意味着 S3 桶已经在 AWS 里被创建，只是表示语言宿主声明了这个桶是期望状态的一部分**」。
2. **部署引擎（deployment engine）**：收到注册后，查已有 state 判断该资源是否建过；建过就配合 provider **对比新旧状态**决定「原地改」还是「替换」；最后**找出那些没有收到新注册的旧资源，安排删除**。引擎据此算出完整的操作集。
3. **资源提供者（provider）**：真正执行云操作。引擎**不直接和 AWS 通信**，而是「让 AWS 资源插件去建这个 Bucket」。provider = 资源插件二进制 + 各语言 SDK。

```text
你的程序(index.ts)
   │  new aws.s3.Bucket("b")   → 资源注册（≠创建）
   ▼
语言宿主 pulumi-language-nodejs
   │  把注册转发给引擎
   ▼
部署引擎  ── 对比 state，算差异（+ ~ +- -）
   │  「请把这个桶建出来」
   ▼
AWS provider 插件 ── 真正调 AWS API
```

依赖也在这一层自然形成：一个资源的 output 被喂给另一个资源的 input 时，引擎**记录二者依赖**，据此排序并**尽量并行**执行无依赖的操作。

## 三、安装、登录与 `pulumi new`

装好 CLI 后（Homebrew / 官方脚本 / 二进制均可）验证：

```bash
pulumi version   # v3.x.x
```

Pulumi 需要一个**后端**来存 state。首次使用先登录：

```bash
pulumi login              # 默认：登录 Pulumi Cloud（浏览器授权）
# 或不想用云端、只想本地存 state：
pulumi login --local      # 等价 pulumi login file://~
```

用 `pulumi new` 从模板起一个项目。模板名 = `<云>-<语言>`，例如 `aws-typescript`：

```bash
mkdir my-infra && cd my-infra
pulumi new aws-typescript
# 交互式填：project name、description、stack name（默认 dev）、aws:region
```

生成的目录结构（TypeScript 为例）：

```text
my-infra/
├─ Pulumi.yaml          # 项目定义：name / runtime: nodejs / description
├─ Pulumi.dev.yaml      # 名为 dev 的 stack 的配置（此处已写入 aws:region）
├─ index.ts             # 程序入口——你的基础设施代码写这里
├─ package.json         # 语言依赖：@pulumi/pulumi、@pulumi/aws
├─ tsconfig.json
└─ node_modules/
```

- **`Pulumi.yaml`**：项目级，定义 `name`、`runtime`、`description`；由 `pulumi new` 创建。
- **`Pulumi.<stack>.yaml`**：某个 stack 的 config（含加密后的 secrets）；由 `pulumi config` 命令维护，**不是** `pulumi stack init` 创建的。
- 依赖靠本语言的包管理器（这里 `npm`）管理——`@pulumi/pulumi` 是核心 SDK，`@pulumi/aws` 是 AWS provider 的 SDK。

## 四、第一个程序：声明资源、导出输出

打开 `index.ts`，声明一个 S3 桶并把它的名字导出：

```ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// 声明一个 S3 桶：new 出来 = 向引擎注册它属于期望状态
const bucket = new aws.s3.BucketV2("my-bucket");

// export 的顶层常量会成为 stack output，up 后可查、可被别的 stack 引用
export const bucketName = bucket.bucket; // bucket.bucket 是桶的物理名（Output<string>）
```

几个入门要点：

- **逻辑名 vs 物理名**：`new aws.s3.BucketV2("my-bucket")` 里的 `"my-bucket"` 是**逻辑名**，只在 Pulumi 内部标识资源、且**同类型同 stack 内必须唯一**；它**影响但通常不等于**云上真实名字——Pulumi 默认**自动命名**（在逻辑名后加随机后缀，避免命名冲突）。
- **`export` 即 output**：程序里 `export` 的顶层值会成为 **stack output**，`up` 时打印、可 `pulumi stack output` 取、可被其它 stack 通过 Stack Reference 引用。
- **`bucket.bucket` 是 `Output<string>`**：资源属性不是普通字符串，而是「**创建后才知道**」的异步值，不能直接 `console.log` 拼接——这是编程模型的核心，见[编程模型](./guide-line/programming-model)。

## 五、核心工作流：preview → up → refresh → destroy

### `pulumi preview`：只算不做

`preview` 跑你的程序、完成所有资源注册与 state 对比，但**只把将发生的变更列出来，不执行**——相当于 Terraform 的 `plan`：

```bash
pulumi preview
#      Type                      Name              Plan
#  +   pulumi:pulumi:Stack       my-infra-dev      create
#  +   └─ aws:s3:BucketV2        my-bucket         create
# Resources:
#     + 2 to create
```

符号：**`+` 新建、`~` 原地修改、`+-` 替换（先建新后删旧）、`-` 销毁、无符号=不变**。

### `pulumi up`：执行

```bash
pulumi up
# 先展示同样的 preview，再问 Do you want to perform this update? [yes/no/details]
```

`up` = 完整闭环：跑程序 → 注册资源 → 对比 state → 执行操作。默认交互式确认；CI 里用 `pulumi up --yes`（跳过确认），或 `pulumi preview --save-plan` + `pulumi up --plan`（更严格，执行的就是审过的那份）。

### `pulumi refresh`：同步真实态

Pulumi **默认不主动**去云上核对现状（只信 state）。若怀疑有人绕过 Pulumi 手改了资源（drift/漂移），显式：

```bash
pulumi refresh        # 或在 up 时加 --refresh
```

它会读云上真实状态、刷新到 state。之后 `preview` 才会反映出漂移带来的差异。

### `pulumi destroy`：拆除

```bash
pulumi destroy        # 销毁当前 stack 管理的全部资源（保留 stack 本身）
pulumi stack rm       # 连 stack 一起删（需先 destroy 或加 --force）
```

一张图记住闭环：

```bash
pulumi new aws-typescript   # 一次性：起项目
# ……编辑 index.ts……
pulumi preview              # 看将要发生什么（只算不做）
pulumi up                   # 确认并执行
# ……改代码后重复 preview / up……
pulumi refresh              # 怀疑漂移时同步真实态
pulumi destroy              # 不需要时拆除
```

## 六、stack = 环境：一套程序，多份实例

**stack（栈）是 Pulumi 部署的基本单元**：同一套程序的一个**隔离的、可独立配置**的实例。典型用法是一个环境一个 stack：

```bash
pulumi stack init staging          # 新建并切到 staging
pulumi stack init prod             # 再来一个 prod
pulumi stack ls                    # 列出所有 stack
pulumi stack select dev            # 切回 dev

# 给不同 stack 设不同配置——写进各自的 Pulumi.<stack>.yaml
pulumi config set aws:region us-east-1        # 当前 stack
pulumi stack select prod
pulumi config set aws:region us-west-2        # prod 用另一个区域
```

每个 stack 有**独立的 config 和独立的 state**，互不干扰。程序里可以按环境分叉逻辑（真实的 `if`）：

```ts
const config = new pulumi.Config();
const env = pulumi.getStack(); // 当前 stack 名，如 "prod"

// 生产用更大的机型——普通的 if，没有 DSL 的三元嵌套
const instanceType = env === "prod" ? "m5.large" : "t3.micro";
```

stack 命名可带层级：`stackName` / `orgName/stackName` / `orgName/projectName/stackName`（仅允许字母数字、连字符、下划线、点）。多 stack、config、Stack Reference 的完整用法见[栈·配置·密钥·状态](./guide-line/state-config-secrets)。

## 七、期望状态与幂等：Pulumi 的世界观

理解这一节才算真正入门。`up` 成功后，state 记下「`my-bucket` = 云上那个 `my-bucket-a1b2c3` 桶」。此时**不改代码**再 `preview`：

```bash
pulumi preview
# Resources:
#     2 unchanged
```

因为引擎再跑一遍程序、拿到同样的期望状态图，和 state 一比——现状 == 期望，所以无操作。这就是**幂等**：同一份程序反复 `up`，从第二次起都是「无变化」。

而这正引出 Pulumi 相对 Terraform 独有的一条**铁律**——因为你用的是图灵完备的真实语言，**你有能力写出「每次运行结果都不同」的程序**（比如用随机数、当前时间、外部 API 返回值去拼资源的**逻辑名**）。一旦逻辑名在两次运行间变了，引擎会以为「旧资源没了、来了个新资源」，从而**误删重建**。所以：

::: tip 保持程序确定性
**资源的逻辑名必须在多次运行间稳定**。别用 `Math.random()`、`Date.now()`、`Date.now()` 拼进 `new Resource("名字")`；需要随机/唯一值时交给 provider 的自动命名或 `RandomId` 等专门资源（它们的随机值会被记进 state、保持稳定）。这条「非确定性风险」是通用语言 IaC 的最大心智负担，[生态与选型](./guide-line/ecosystem-selection)有专门展开。
:::

到这里你已经能跑通「起项目 → 写程序 → preview → up → 改 → 再 up → destroy」的完整闭环。接下来按[本叶地图](./)深入编程模型、组件复用、栈与状态、生态选型四块。
