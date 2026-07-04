---
layout: doc
outline: [2, 3]
---

# 编程模型：Output、资源选项与语言级抽象

> 基于 Pulumi v3 · 核于 2026-07

## 速查

- **`Input<T>`**：你**能提供给**资源的值；接受**普通值、Promise、或 `Output<T>`**——`pulumi.Input<string>` 处 `"x"` 也接、别的资源的 `Output<string>` 也接。
- **`Output<T>`**：资源**创建后才知道**的值（如生成的 ID、DNS 名），**异步、类似 promise**，**不能直接当普通值打印/拼接**。
- **`.apply(fn)`**：把 output 里的值取出来变换，返回新的 `Output`；`fn` 里拿到的是**已解析的明文**。
- **`pulumi.all([a, b]).apply(([a, b]) => ...)`**：等多个 output 都就绪后一起变换。
- **`pulumi.interpolate\`...${out}...\``**：模板字符串式拼接 output，最常用；`pulumi.concat(...)` 是其函数版。
- **自动依赖**：把资源 A 的 output 传给资源 B 的 input，引擎**自动记录 B 依赖 A**，无需手写顺序。
- **secret 传播**：secret 是特殊 output，经 `apply`/`all` 组合后**结果仍是 secret**，在 state 里保持加密。
- **资源三要素**：`new Res(name, args, opts)`——逻辑名（唯一、稳定）、输入参数、资源选项。
- **自动命名**：物理名默认 = 逻辑名 + 随机后缀；逻辑名**只在 Pulumi 内部**用于标识与引用。
- **`.get(name, id)` / provider 函数**：读取**已存在、不归我管**的资源/数据（类比 Terraform `data`）。
- **resource options（13 项）**：`dependsOn`/`protect`/`parent`/`provider(s)`/`ignoreChanges`/`deleteBeforeReplace`/`import`/`aliases`/`customTimeouts`/`retainOnDelete`/`replaceOnChanges`/`transforms`/`version`。
- **消除重复**：用真实的 `for`/`map`/`if`/函数/类替代复制粘贴——这是 Pulumi 相对 HCL 的核心红利。
- **可测试性**：`pulumi.runtime.setMocks({...})` 拦截资源创建与 provider 调用，用 Jest/pytest **不碰云**跑单元测试。

## 一、`Input<T>` 与 `Output<T>`：Pulumi 的核心类型

这是整个 Pulumi 编程模型的地基，务必吃透。

- **`Input<T>`** 是「你**能供给**资源的值」。它是个宽松的联合类型：一个 `pulumi.Input<string>` 类型的参数，既接受普通 `"my-bucket"`，也接受 `Promise<string>`，还接受另一个资源的 `Output<string>`。
- **`Output<T>`** 是「资源**创建后才知道**的值」。云上很多属性（自动生成的 ID、ARN、分配的 IP、负载均衡器 DNS 名……）在 `up` 真正跑之前根本不存在——它们是**异步**的，从 provider 返回。官方明确：**「你不能用语言的字符串打印函数直接打印一个 output 的值」**。

为什么必须搞这么一层？因为「供给资源」是**异步操作**（建一个资源可能要几分钟）。`Output<T>` 的角色类似 **promise/future**：它包着一个「未来才会有」的值，还额外携带两条元信息——**这个值依赖哪些资源**、**这个值是不是 secret**。

```ts
const bucket = new aws.s3.BucketV2("b");

// ❌ 错：bucket.arn 是 Output<string>，不是 string，拼出来是 "[object Object]"/报错
const wrong = "arn is " + bucket.arn;

// ✅ 对：进入 output 的世界去变换它
const right: pulumi.Output<string> = bucket.arn.apply(a => `arn is ${a}`);
```

记住这条判断：**任何来自资源的属性都是 `Output`，想「用」它就得进 `apply`/`all`/`interpolate` 的世界，出不来（结果还是 `Output`）**——直到把它 `export` 成 stack output 或喂给另一个资源的 input。

## 二、`.apply()`：变换单个 output

`apply` 是最基础的操作：给它一个函数，Pulumi 在**该 output 的值就绪后**调用这个函数，函数里拿到的是**已解析的明文值**，返回值被重新包成一个新的 `Output`：

```ts
// 从桶名派生一个网址
const url: pulumi.Output<string> = bucket.bucket.apply(name =>
  `https://${name}.s3.amazonaws.com`
);

// apply 可以链、可以嵌套访问属性
const region = bucket.arn.apply(arn => arn.split(":")[3]);
```

::: warning apply 里不要再 new 资源
`apply` 的回调只在 `up` 阶段、值就绪后执行；在里面 `new` 资源会让这些资源**游离于 preview 之外**（preview 时回调还没跑，看不到它们），破坏「先看后做」。需要「基于某 output 的值决定建什么」时，优先重构数据流，而非在 apply 里建资源。
:::

## 三、`pulumi.all()`：组合多个 output

要同时用**好几个** output 的值，用 `pulumi.all()` 把它们「打包」再 `apply`——类似 `Promise.all`：

```ts
const conn: pulumi.Output<string> = pulumi
  .all([db.address, db.port, db.name])
  .apply(([addr, port, name]) => `postgres://${addr}:${port}/${name}`);
```

`all` 也接受对象形式（可读性更好）：

```ts
const info = pulumi.all({ addr: db.address, port: db.port }).apply(v =>
  `${v.addr}:${v.port}`
);
```

## 四、`interpolate` 与 JSON 助手：更顺手的拼接

字符串拼接是最高频的场景，`.apply` 写起来啰嗦。Pulumi 提供了**模板字符串式**的 `pulumi.interpolate`：

```ts
// 等价于对 loadBalancer.dnsName 做 apply，但一眼能读
const endpoint = pulumi.interpolate`https://${loadBalancer.dnsName}/api`;
```

`pulumi.interpolate` 是打标签的模板字面量，`${}` 里可以直接塞 `Output`、`Promise` 或普通值，混着来都行。它的函数版是 `pulumi.concat("https://", loadBalancer.dnsName, "/api")`。

需要把含 output 的对象序列化成 JSON（如写 IAM policy）时，用 `pulumi.jsonStringify`（会正确等待里面的 output 就绪）：

```ts
const policy = pulumi.jsonStringify({
  Version: "2012-10-17",
  Statement: [{ Effect: "Allow", Resource: bucket.arn, Action: ["s3:GetObject"] }],
});
```

想把一个普通值「抬」成 output 参与运算，用 `pulumi.output(x)`。

## 五、自动依赖与 secret 传播：output 的两个隐藏超能力

`Output` 不只是「异步值」，它还悄悄替你做两件事：

**1）自动追踪依赖。** 当你把资源 A 的 output 作为资源 B 的 input，引擎**自动记录「B 依赖 A」**，从而保证先建 A 再建 B、删除时反过来——你**完全不用手写顺序**：

```ts
const vpc = new aws.ec2.Vpc("vpc", { cidrBlock: "10.0.0.0/16" });
// subnet 用了 vpc.id（Output）→ 自动依赖：先建 vpc 再建 subnet
const subnet = new aws.ec2.Subnet("subnet", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
});
```

这对应 Terraform 的「隐式依赖」，但在 Pulumi 里是类型系统层面天然带的。少数「逻辑上依赖但数据上没引用」的情况才需要 `dependsOn`（见下节）。

**2）传播 secret 标记。** 如果某个 output 是 secret（来自 `config.requireSecret` 或 `pulumi.secret`），那么**任何用它算出来的 output 也自动是 secret**——经过 `apply`/`all` 组合后结果仍标记为 secret，在 state 里保持加密、在 CLI 输出里显示 `[secret]`。你不用手动追踪「哪些派生值也敏感」。（secret 细节见[栈·配置·密钥·状态](./state-config-secrets)。）

## 六、资源三要素、逻辑名与读取已有资源

所有资源都按 `new Resource(name, args, options)` 声明：

```ts
const bucket = new aws.s3.BucketV2(
  "assets",                                   // ① name：逻辑名
  { tags: { Env: "prod" }, forceDestroy: true }, // ② args：输入属性
  { protect: true }                           // ③ options：资源选项（可选）
);
```

- **① 逻辑名（必填）**：**同类型、同 stack 内唯一**的标识；只在 Pulumi 内部用于引用与 diff。它**影响但通常不等于**物理名——Pulumi **默认自动命名**（逻辑名后加随机后缀，如 `assets-a1b2c3d4`），避免全局命名冲突、也便于「先建后删」式替换。想固定物理名就显式传 `bucket: "my-exact-name"`（放弃自动命名的好处，注意冲突）。
- **② args**：命名输入属性对象，值可以是普通值，也可以是别的资源的 output。具体有哪些字段查 [Pulumi Registry](https://www.pulumi.com/registry/) 的 API 文档。
- **③ options**：见下一节。

资源分两类：**`CustomResource`**（由 provider 管理的真实云资源，如桶、实例）与 **`ComponentResource`**（把多个资源封装成一个逻辑单元，见[组件与复用](./components-and-reuse)）。

读取「已存在、不归本程序管」的资源/数据（类比 Terraform 的 `data`），有两种方式：

```ts
// a) 静态 get 函数：按物理 id 取一个已有资源的引用（不创建）
const existing = aws.s3.BucketV2.get("existing", "my-existing-bucket-name");

// b) provider 数据函数：查询信息（返回 Promise/Output，不创建资源）
const ami = aws.ec2.getAmi({
  mostRecent: true,
  owners: ["099720109477"],
  filters: [{ name: "name", values: ["ubuntu/images/hvm-ssd/ubuntu-*"] }],
});
```

## 七、资源选项（resource options）十三件套

第三个参数 `options` 用来干预资源的管理行为，是排坑与治理的关键。逐项：

| 选项 | 作用 |
| --- | --- |
| `dependsOn` | 在数据依赖之外**追加显式依赖**（逻辑上依赖但代码没引用属性时用） |
| `protect` | **防误删**：标记为受保护，任何会删它的操作直接报错 |
| `parent` | 建立**父/子关系**，形成资源层级（Component Resource 给子资源必传） |
| `provider` | 传入**显式配置的 provider**（替代默认 provider，如指定区域） |
| `providers` | 给一个 component 的**子资源们**传显式 provider 集合 |
| `ignoreChanges` | diff 时**忽略指定属性**的变化（如被外部系统改动的字段） |
| `deleteBeforeReplace` | 替换时**先删旧再建新**（默认相反：先建新再删旧） |
| `import` | 把**已存在的云资源纳入** Pulumi 管理（首次 `up` 时导入） |
| `aliases` | 声明**别名**，让重命名/重构**不触发替换**（保住既有资源） |
| `customTimeouts` | 覆盖资源供给的**重试/超时**默认行为 |
| `retainOnDelete` | Pulumi 删除时**在云上保留**该资源（只从 state 移除） |
| `replaceOnChanges` | 把对指定属性的变化**当作强制替换** |
| `transforms` | 在资源注册前**动态改写**其属性（旧名 `transformations`） |
| `version` | **钉住** provider 插件版本 |

```ts
new aws.s3.BucketV2("logs", { /* args */ }, {
  protect: true,                    // 别误删日志桶
  dependsOn: [loggingRole],         // 权限先就绪
  ignoreChanges: ["tags"],          // tags 交给别的系统改，别来回 diff
  provider: usEast1,                // 指定区域的显式 provider
});
```

::: tip dependsOn 是兜底
绝大多数依赖都应靠「引用 output」自然形成（第五节）。只有「逻辑上必须先有 A，但代码里没引用 A 的任何属性」（如 IAM 权限先生效）才用 `dependsOn`。滥用它会让依赖图变保守、牺牲并行。
:::

## 八、用真实语言消除重复：Pulumi 最大的红利

这是「通用语言 vs DSL」价值最直观的地方。需要「一批相似资源」时，你用的是**语言原生的循环与数据结构**，而不是 HCL 的 `count`/`for_each`/`dynamic`：

```ts
// 按配置造一批子网——就是普通的数组 map
const azs = ["a", "b", "c"];
const subnets = azs.map((az, i) =>
  new aws.ec2.Subnet(`subnet-${az}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${i}.0/24`,
    availabilityZone: pulumi.interpolate`${region}${az}`,
  })
);
```

条件用真正的 `if`，抽象用**函数与类**：

```ts
// 用函数封装「一个带标准标签的桶」——复用逻辑，而非复制 HCL
function taggedBucket(name: string, extra: Record<string, string> = {}) {
  return new aws.s3.BucketV2(name, {
    tags: { ManagedBy: "pulumi", ...extra },
  });
}

const isProd = pulumi.getStack() === "prod";
if (isProd) {
  taggedBucket("backups", { Critical: "true" });
}
```

对比 HCL：Terraform 里「造 N 个」要在 `count`（数字索引，删中间项会连锁重建）和 `for_each`（稳定键）之间小心权衡，动态嵌套块要写 `dynamic`；Pulumi 里这些都退化成你早就烂熟的 `map`/`filter`/`reduce`/`if`/函数/类。**代价**是：语言太自由，你也更容易写出不确定或有副作用的代码（见[生态与选型](./ecosystem-selection)的「非确定性风险」）。想把「一组资源」封装成可复用、可分发的单元，用 **Component Resource**（见[组件与复用](./components-and-reuse)）。

## 九、可测试性：给基础设施写单元测试

因为是真实语言，你能用本生态的测试框架（Jest / Mocha / pytest / go test……）给基础设施写**单元测试**。关键是 `pulumi.runtime.setMocks`——它**拦截所有资源创建与 provider 函数调用**，让测试**完全不碰云、毫秒级**跑完：

```ts
import * as pulumi from "@pulumi/pulumi";

// 在加载被测程序之前设置 mock
pulumi.runtime.setMocks({
  // 每次 new 资源都走这里：返回一个假的 id 和回显输入作为 state
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return { id: `${args.name}_id`, state: args.inputs };
  },
  // provider 数据函数（getAmi 等）走这里
  call: (args: pulumi.runtime.MockCallArgs) => args.inputs,
});
```

```ts
// server.spec.ts —— 断言「实例必须带 Name 标签」
import "./mocks"; // 上面的 setMocks
import * as infra from "./index";

describe("基础设施合规", () => {
  it("每台实例都要有 Name 标签", (done) => {
    pulumi.all([infra.server.urn, infra.server.tags]).apply(([urn, tags]) => {
      if (!tags || !tags["Name"]) done(new Error(`${urn} 缺少 Name 标签`));
      else done();
    });
  });
});
```

除了这种**属性单元测试**，Pulumi 还支持**集成测试**（真建资源到临时 stack、断言、再销毁）和**策略即代码**（用 CrossGuard 在 `preview` 时统一拦截，见[生态与选型](./ecosystem-selection)）——三层各有取舍：单元测试快而浅、集成测试慢而真、策略跨程序统一治理。
