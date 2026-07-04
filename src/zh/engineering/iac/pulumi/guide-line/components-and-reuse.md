---
layout: doc
outline: [2, 3]
---

# 组件与复用：Component、Package 与跨栈组合

> 基于 Pulumi v3 · 核于 2026-07

## 速查

- **Component Resource**：把**一组资源**封装成**对外表现为单个资源**的高阶抽象（如 `SecureBucket`、`AcmeVirtualMachine`），是 Pulumi 复用与治理的核心单元。
- **编写三步**：① `class X extends pulumi.ComponentResource`；② 构造函数里 `super("包:模块:类型", name, {}, opts)` 传 **type token**；③ 结尾 `this.registerOutputs({...})`。
- **type token**：三段式 `<package>:<module>:<Type>`（如 `illegal:storage:SecureBucket`），是组件的类型标识。
- **子资源必挂 `parent: this`**：否则不会显示为该组件的孩子，层级与依赖也不对。
- **`registerOutputs()`**：声明组件对外暴露的输出，并标记「子资源都注册完了」。
- **封装价值**：平台团队把安全/合规/最佳实践**烘焙进组件默认值**（默认加密、默认禁公有），业务方开箱即用、无需懂内部。
- **多语言 Package**：组件可打包成 **Pulumi Package**，用一种语言编写、供 **TS/Python/Go/C#/Java** 消费（SDK 按需生成）。
- **`pulumi package add`**：把一个 package（组件包或桥接的 provider）加入项目，在 `Pulumi.yaml` 的 `packages` 下登记并生成本地 SDK。
- **Stack Reference**：`new pulumi.StackReference("org/project/stack")` + `.requireOutput("k")`，**跨栈**读取别的 stack 的 output，用于分层组合（infra 栈 ← services 栈）。
- **三种读法**：`requireOutput`（推荐，缺了在部署期报错）/ `getOutput`（缺了返回 undefined）/ `getOutputDetails`（拿原始值并区分 secret）。
- **显式 provider**：`new aws.Provider("useast1", { region })` + 资源 `{ provider }`，用于**多区域/多账号**；给组件子资源用 `providers` 选项批量下传。
- **复用三层**：程序内用函数/循环（见编程模型）→ 跨程序用 Component/Package → 跨栈用 Stack Reference。

## 一、Component Resource：为什么需要它

[编程模型](./programming-model)里我们用函数、循环在**单个程序内**消除重复。但当你想把「一套带最佳实践的资源组合」**跨程序、跨团队、甚至跨语言**分发时，就需要更强的封装单元——**Component Resource**。

官方定义：component resource 是「**一组 Pulumi 资源的逻辑集合，对外暴露为单个 Pulumi 资源**」。它的意义在于**抽象与治理**：

- 平台团队可以把**安全策略、合规要求、命名规范**烘焙成可复用积木。比如一个 `AcmeVirtualMachine` 组件强制打上公司标签，一个 `SecureBucket` 组件**默认开加密、默认禁公有访问**——业务方 `new SecureBucket("logs")` 一行，就自动拿到全套安全默认，**无需了解内部由几个资源拼成**。
- 它让资源树有了**层级**：deployment 输出里，组件是父节点，内部资源缩进显示为它的孩子，一眼看清归属。

## 二、编写一个 Component Resource

编写组件 = **继承 `pulumi.ComponentResource`** 并实现三个约定：

```ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface SecureBucketArgs {
  tags?: Record<string, string>;
}

export class SecureBucket extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly arn: pulumi.Output<string>;

  constructor(name: string, args: SecureBucketArgs = {}, opts?: pulumi.ComponentResourceOptions) {
    // ① 调 super 传 type token：<package>:<module>:<Type>
    super("illegal:storage:SecureBucket", name, {}, opts);

    // ② 创建子资源，全部传 { parent: this } —— 才会挂到本组件下
    const bucket = new aws.s3.BucketV2(`${name}-bucket`, { tags: args.tags }, { parent: this });

    // 默认开启服务端加密（把最佳实践烘焙进组件）
    new aws.s3.BucketServerSideEncryptionConfigurationV2(`${name}-sse`, {
      bucket: bucket.id,
      rules: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: "AES256" } }],
    }, { parent: this });

    // 默认阻断一切公有访问
    new aws.s3.BucketPublicAccessBlock(`${name}-pab`, {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    this.bucketName = bucket.bucket;
    this.arn = bucket.arn;

    // ③ 声明对外暴露的输出，并标记子资源注册完毕
    this.registerOutputs({ bucketName: this.bucketName, arn: this.arn });
  }
}
```

消费方就像用一个普通资源一样简单：

```ts
const logs = new SecureBucket("logs", { tags: { Env: "prod" } });
export const logsArn = logs.arn; // 组件的输出可继续 export / 传给别的资源
```

三个约定逐一说清：

- **① type token（`super` 第一参）**：三段式 `<package>:<module>:<Type>` 的类型标识（如 `illegal:storage:SecureBucket`），Pulumi 用它在资源树里标注该组件的类型。`super` 的第三个参数是「组件自身的 inputs」（一般传 `{}`），第四个是 `opts`。
- **② `{ parent: this }`**：**每一个子资源都必须传**。这既让它们在输出里正确缩进为组件的孩子，也让资源选项（如 provider）能沿层级下传。漏了 `parent`，子资源会「跑到组件外面」。
- **③ `registerOutputs({...})`**：在构造函数**最后**调用，声明本组件对外可被依赖的输出。它也是给引擎的信号——「本组件的子资源已全部注册」。

## 三、多语言 Package：一次编写，多语言消费

组件的终极形态是打包成 **Pulumi Package** 分发。Pulumi 的杀手锏：**组件用一种语言编写，却能被所有支持的语言消费**。

官方原话：以 package 形式分发的组件「通过基于插件的 SDK 支持多语言」，Pulumi 平台**按需生成各语言的 SDK**——于是团队可以用 TypeScript 写一个组件，别的团队从 **Python / Go / C# / Java** 里 `import` 进来用，就像用原生库一样。这解决了 Terraform 模块「只能在 HCL 世界里复用」的天花板。

配套能力还包括：为组件包编写、打包、测试的指南，以及通过 **Pulumi IDP Private Registry** 在组织内发布、检索、治理。

## 四、`pulumi package add` 与 Pulumi Registry

消费一个 package（无论是别人写的组件包，还是桥接的 provider——见[生态与选型](./ecosystem-selection)）有两条路：

```bash
# a) 常规 provider：直接用语言包管理器装 SDK
npm install @pulumi/aws          # TypeScript
# pip install pulumi-aws         # Python

# b) 参数化 package / 组件包：用 pulumi package add 生成本地 SDK
pulumi package add terraform-provider hashicorp/random
```

`pulumi package add` 会自动在 **`Pulumi.yaml` 的 `packages` 键**下登记该包，并生成对应语言的本地 SDK 供 `import`。所有官方与社区的 provider、组件都在 [Pulumi Registry](https://www.pulumi.com/registry/) 检索。

## 五、Stack Reference：跨栈组合

Component 解决「跨程序复用」，**Stack Reference** 解决「**跨 stack 组合**」——让一个 stack 消费**另一个 stack 的 output**。典型分层：底层 `infra` 栈建 VPC/集群，上层 `services` 栈引用它：

```ts
// 在 services 程序里引用 infra 生产栈的输出
const infra = new pulumi.StackReference("acmecorp/infra/production");

// requireOutput：缺了就在部署期报错（推荐）
const vpcId = infra.requireOutput("vpcId");

// 直接把跨栈 output 当普通 Output 用
const subnet = new aws.ec2.Subnet("svc", {
  vpcId: vpcId,
  cidrBlock: "10.0.9.0/24",
});
```

三种读法按「缺失时的期望」选：

- **`requireOutput(k)`**：目标 output 不存在时**部署期直接失败**——绝大多数场景的推荐选择。
- **`getOutput(k)`**：不存在返回 `undefined`——当「可能没有」是正常情况时用。
- **`getOutputDetails(k)`**：拿到原始值，并**区分该值是否 secret**——需要精细处理敏感值时用。

引用名就是被引栈的全限定名 `org/project/stack`。这样多个团队各管各的 stack，用 Stack Reference 拼成完整系统，边界清晰。

## 六、显式 provider 与多区域/多账号

默认情况下资源使用**默认 provider**（从环境变量 / stack config 里取配置，如 `pulumi config set aws:region us-west-2`）。但当一个程序要**同时**部署到多个区域或多个账号时，就要创建**显式 provider** 并用资源选项 `provider` 指派：

```ts
// 显式创建一个锁定 us-east-1 的 AWS provider
const useast1 = new aws.Provider("useast1", { region: "us-east-1" });

// ACM 证书用于 CloudFront，必须在 us-east-1——用 provider 选项指派
const cert = new aws.acm.Certificate("cert", {
  domainName: "example.com",
  validationMethod: "DNS",
}, { provider: useast1 });
```

给**组件的所有子资源**批量指派 provider，用 `providers` 选项（复数）：

```ts
const site = new SecureBucket("assets", {}, { providers: [useast1] });
```

想强制「所有资源都必须显式声明 provider、禁止用默认的」，可关掉默认 provider，避免误配到错误账号：

```bash
pulumi config set --path 'pulumi:disable-default-providers[0]' aws
```

至此，Pulumi 的**复用三层**就完整了：**程序内**用语言原生的函数/循环（见[编程模型](./programming-model)）；**跨程序/跨语言**用 Component Resource 与 Package；**跨栈**用 Stack Reference。provider 的**生态**（原生 vs 桥接 Terraform）与其余工程化能力见[生态与选型](./ecosystem-selection)。
