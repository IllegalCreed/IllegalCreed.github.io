---
layout: doc
outline: [2, 3]
---

# 生态与选型：provider、自动化、策略与 vs Terraform

> 基于 Pulumi v3 · 核于 2026-07

## 速查

- **provider 两大来源**：**原生 provider**（按云 API 规范生成，如 Azure Native、Kubernetes）+ **桥接 provider**（用 **Pulumi Terraform Bridge** 包装任意 Terraform/OpenTofu provider，AWS/GCP 等大量 Registry 包如此而来）。
- **参数化 provider**：安装时传参、本地生成 SDK（如「Any Terraform Provider」`pulumi package add terraform-provider <ns>/<name>`）——几乎能用上任何 TF provider。
- **动态 provider**：TS/Python 里内联声明自定义资源，无需单独发包。
- **Automation API**：用 SDK **在自己的程序里驱动 Pulumi 引擎**（up/preview/destroy），不经 CLI；支持 TS/JS/Python/Go/C#/Java（均 Stable）。
- **inline vs local program**：inline 程序内联在 Automation 代码里、无独立 `Pulumi.yaml`；local 程序就是常规带目录的项目。
- **策略即代码（Policies/CrossGuard）**：策略包用 **TS/JS/Python/OPA Rego** 写，`preview`/`up` 时**拦截违规**；也能对 Terraform/CloudFormation 资源生效。
- **enforcementLevel**：`advisory`（警告）/ `mandatory`（阻断）/ `remediate`（自动修）/ `disabled`；本地 `pulumi up --policy-pack ./pack`。
- **⚠️ 非确定性风险**：真实语言图灵完备，你**能**写出「每次结果不同/有副作用」的程序——逻辑名不稳定会导致误删重建。这是通用语言 IaC 最大的心智负担。
- **许可**：Pulumi 引擎/CLI/SDK 是 **Apache 2.0**；Terraform 1.6+ 是 **BUSL 1.1**（非开源），社区分叉 **OpenTofu** 为 MPL 2.0。
- **迁移**：`pulumi convert --from terraform` 把 HCL 转成目标语言程序；`pulumi import` 把已有云资源纳管并生成代码。
- **选型一句话**：团队本就写代码、要抽象/测试/多语言复用/默认加密 state/自助平台 → Pulumi；偏好声明式 DSL 的简单直接、组织已标准化 HCL → Terraform/OpenTofu（provider 覆盖不再是决定因素，Pulumi 能桥接）。

## 一、provider 生态：原生 + 桥接，几乎无死角

**provider（资源提供者）**负责和云/SaaS 通信，对你定义的资源做增删改查（CRUD）。它 = 一个调云 API 的可执行插件 + 各语言 SDK。Pulumi 的 provider 有四种形态：

- **桥接 provider（bridged）**：用 **Pulumi Terraform Bridge** 包装一个 Terraform/OpenTofu provider，翻译其 schema。**AWS、Google Cloud** 等大量 Registry 里的包都是这么来的。这条路的战略意义极大——**Terraform 生态里任何 provider，几乎都能被适配进 Pulumi**，所以「provider 覆盖度」基本不再是 Pulumi vs Terraform 的选型痛点。
- **原生 provider（native）**：直接按云厂商的 API 规范生成，不经桥接，覆盖更新更快、更贴原生。**Azure Native、Kubernetes** 是代表。
- **参数化 provider（parameterized）**：安装时接受参数，在本地**按需生成语言 SDK**。「Any Terraform Provider」是典型——`pulumi package add terraform-provider hashicorp/random` 就能把 OpenTofu Registry 里的 provider 拉进来用。
- **动态 provider（dynamic）**：仅 TS/Python，允许**内联**声明自定义资源逻辑，不必单独发一个 provider 包，适合小众/一次性的自定义资源。

安装常规 provider 用语言包管理器（`npm install @pulumi/aws`）；参数化/组件包用 `pulumi package add`（自动登记到 `Pulumi.yaml` 的 `packages`）。全部在 [Pulumi Registry](https://www.pulumi.com/registry/) 检索。

## 二、Automation API：把 Pulumi 当库嵌进你的程序

**Automation API 是「不用 CLI 跑 Pulumi」的可编程接口**：它把 `pulumi up` / `preview` / `destroy` / `stack init` 等 CLI 能力封装成**强类型 SDK**，让你**在自己的应用里直接驱动 Pulumi 引擎**，而不是从 shell 里敲 `pulumi` 命令。

典型场景：CI/CD 流水线、集成测试框架、蓝绿等多阶段部署、伴随代码变更的应用发布（如带数据库迁移）、**构建自助式基础设施平台 / 自定义 CLI**、把 Pulumi 包成 REST/gRPC 服务。

程序有两种组织方式：

- **inline program（内联程序）**：把「基础设施函数」直接写在 Automation 代码里（或从包 import），**没有独立的 `Pulumi.yaml`**、无需磁盘上单独的项目。
- **local program（本地程序）**：就是常规的带目录 + `Pulumi.yaml` 的项目，Automation API 能像 CLI 一样驱动它。

工作区实现：`LocalWorkspace`（默认，读本地 `Pulumi.yaml`/`Pulumi.<stack>.yaml`）与 `RemoteWorkspace`（经 Pulumi Deployments 在远端 Git 仓库里跑）。

```ts
import { LocalWorkspace } from "@pulumi/pulumi/automation";
import * as aws from "@pulumi/aws";

// 用 inline program 编程式地建栈、配区域、up、读输出、destroy——全程无 CLI
const stack = await LocalWorkspace.createOrSelectStack({
  stackName: "dev",
  projectName: "inline-s3",
  program: async () => {
    const bucket = new aws.s3.BucketV2("bucket");
    return { bucketName: bucket.bucket };
  },
});

await stack.setConfig("aws:region", { value: "us-west-2" });
const res = await stack.up({ onOutput: console.log });
console.log("bucket:", res.outputs.bucketName.value);
```

Automation API 在 **TS/JS、Python、Go、C#、Java** 均为 Stable。它是「自助平台 / 内部开发者平台（IDP）」类需求相对 Terraform 的一大差异化能力——官方对比里 Terraform「无等价物」。

## 三、策略即代码：CrossGuard / Pulumi Policies

**Policies（CrossGuard）**让组织把合规、安全、成本护栏写成**代码**，在**部署前**统一拦截，而不是靠 review 和口头约定。它不止管 Pulumi——还能对 **Terraform、CloudFormation、以及手工创建**的资源生效。

三层结构：**单条 policy**（校验某个具体配置）→ **policy pack**（一组相关策略的**带版本**集合）→ **policy group**（把 pack 应用到指定 stack/账号，从而「生产更严、开发更松」）。

策略语言：**TS/JS（Stable）、Python（Stable）、OPA Rego（Stable）**，.NET/Go 规划中。

```ts
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";
import * as aws from "@pulumi/aws";

new PolicyPack("aws-security", {
  policies: [{
    name: "s3-no-public-read",
    description: "禁止公有可读的 S3 桶",
    enforcementLevel: "mandatory", // advisory | mandatory | remediate | disabled
    validateResource: validateResourceOfType(aws.s3.BucketV2, (bucket, args, reportViolation) => {
      // 命中即报违规——mandatory 下会直接阻断 up
      if ((bucket as any).acl === "public-read" || (bucket as any).acl === "public-read-write") {
        reportViolation("S3 桶不得设置为公有可读");
      }
    }),
  }],
});
```

执行方式：

- **本地**：`pulumi up --policy-pack ./aws-security`（需本地磁盘上的 pack）。
- **Pulumi Cloud**：集中管理、自动下发 pack，并附带 **CIS / PCI DSS / HITRUST / NIST** 等预置合规包。

两种运行模式：**Preventative（预防式）**——在 `preview`/`up` 时校验、违规阻断；**Audit（审计式）**——通过 Insights Discovery **持续扫描**已存在资源找违规。enforcementLevel 决定命中后是**警告（advisory）**、**阻断（mandatory）**、**自动修复（remediate）**还是**关闭（disabled）**。

## 四、非确定性风险：通用语言 IaC 的最大心智负担

Pulumi 的自由是双刃剑。因为你用的是**图灵完备**的真实语言，**你有能力写出「声明式引擎无法安全处理」的程序**——这是它相对 HCL（受限 DSL、天然更接近纯声明）最需要警惕的地方：

- **逻辑名不稳定 → 误删重建**：资源逻辑名（`new Res("这个名")`）是引擎跨运行识别「同一个资源」的键。若你用 `Math.random()`、`Date.now()`、随机 UUID、或**遍历顺序不定的对象**去拼逻辑名，两次运行名字就变了，引擎会当成「旧的没了、来了新的」，**销毁重建**真实资源。**铁律：逻辑名必须每次运行都确定、稳定。** 需要随机/唯一值时交给 provider 自动命名或 `random.RandomId` 这类专门资源（其随机值记进 state、保持稳定）。
- **副作用与外部依赖**：程序在**每次** `preview`/`up` 都会完整执行。若里面有网络请求、读可变外部状态、写文件等副作用，结果可能不可复现，甚至 `preview` 就产生真实影响。保持程序**尽量纯**、把 IO 挡在资源声明之外。
- **重构的爆炸半径**：改变量名、挪代码位置若改动了逻辑名或资源树结构，可能触发替换；用资源选项 `aliases` 声明「旧名 → 新名」可让重构**不触发替换**。
- **抽象过度**：真实语言太能抽象，容易把简单基础设施写成难懂的元编程。团队要约定「基础设施代码优先直白」。

::: warning 用工程手段补住自由的代价
Pulumi 把「怎么写」交还给你，也就把「保证确定性」的责任交给了你。对策是**工程化**：CI 里跑 `preview` 做门禁、用本页上文的 **CrossGuard 策略**统一拦违规、用[单元测试](./programming-model)锁行为、代码 review 盯住逻辑名与副作用、`pin` provider 版本。这套纪律到位，通用语言的红利才不反噬。
:::

## 五、Pulumi Cloud、自托管与许可

- **开源与许可**：Pulumi 的**引擎、CLI、SDK 都是 Apache 2.0 开源**（[pulumi/pulumi](https://github.com/pulumi/pulumi)）。这与 Terraform 1.6+ 转 **BUSL 1.1**（非开源的 source-available）形成鲜明对比——后者促成了社区分叉 **OpenTofu**（MPL 2.0）。就「核心工具是否开源」而言，Pulumi 立场更干净。
- **Pulumi Cloud**：商业化主要在这里——托管 state 与并发锁、团队协作与 RBAC、策略中心、**Deployments**（云端跑 up、drift 检测、GitOps）、**ESC**（环境/密钥/配置）。有 SaaS 与**自托管（Self-Hosted）**两种部署。
- **不绑定**：即便不用 Pulumi Cloud，你也能用[自管后端](./state-config-secrets)（S3/Azure/GCS/本地/PG）跑完整的 Pulumi——云端能力是增值，不是运行前提。

## 六、与 Terraform 全面对比与选型

Pulumi 与 Terraform 同为**声明式 IaC**，核心分野是**「真实编程语言 vs HCL DSL」**。官方逐项对比：

| 维度 | Pulumi | Terraform |
| --- | --- | --- |
| **语言** | Python / TS / JS / Go / .NET / Java / YAML（真实语言，有循环/条件/类/包/测试） | HCL（配置 DSL，控制流随复杂度变难读，无类、运行时逻辑有限） |
| **state** | 默认 Pulumi Cloud；自管 S3/Azure/GCS/本地/PG 等 | 默认本地文件；远程 backend（S3/Azure/GCS/Consul/HCP Terraform） |
| **secrets** | **默认加密**进 state（每栈独立密钥，可换 KMS） | **默认不加密**在 state；HCP 加密 at-rest，Vault 是独立产品 |
| **可编程 API** | **Automation API**（可嵌入 SDK） | 无等价物 |
| **策略即代码** | 开源（TS/Python/OPA Rego） | Sentinel（专有，仅 HCP） |
| **许可** | Apache 2.0 | BUSL 1.1 |
| **provider** | 原生 + **桥接任意 TF provider** | 原生 Terraform Registry provider |
| **复用/模块** | Component + 跨语言 Pulumi Package | HCL Terraform module |
| **测试** | 复用本语言现成测试框架 | HCL 无同等内建测试能力 |

两者的**期望状态收敛**逻辑一致：失败的更新会让 stack/workspace 处于「部分更新」态，再跑 `up`/`apply` 继续朝期望收敛。

**迁移路径**（两条都由 Pulumi 提供）：

```bash
pulumi convert --from terraform   # 把 HCL 转成你选的语言的 Pulumi 程序（尽量保留名字/模块/结构）
pulumi import <type> <name> <id>  # 把已建好的云资源纳管，并生成对应代码
```

**怎么选**（务实版）：

- **选 Pulumi**：团队本就是开发者、习惯 TS/Python/Go；要用**循环/条件/函数/类**抗复杂度、要给基础设施写**单元测试**、要**跨语言复用**组件；看重 **state secrets 默认加密**；要建**自助平台 / 内部开发者平台**（Automation API）；在意**核心工具开源（Apache 2.0）**。
- **选 Terraform / OpenTofu**：团队偏好**声明式 DSL 的直白与克制**、不想引入编程语言的自由与其确定性负担；组织已**标准化在 HCL** 与其庞大成熟的 module/registry 生态；运维主导、更认 `plan` 的确定性心智。
- **provider 覆盖不再是决定因素**：Pulumi 能桥接几乎任何 TF provider，两边可用资源高度重叠——决策更多落在「语言 vs DSL、团队画像、state/secrets/策略/许可偏好」上。

Terraform 侧的 HCL、state、模块与 BUSL/OpenTofu 分叉细节，见本仓库 [Terraform](../../terraform/) 叶。Pulumi 自身的命令与坑速查见[参考](../reference)。
