---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Pulumi v3 · 核于 2026-07。CLI 命令、核心概念、Output 操作、resource options、配置/密钥、state 后端、常见坑、与 Terraform 术语对照速查与权威链接。

## CLI 命令速查

| 命令 | 作用 |
| --- | --- |
| `pulumi new [模板]` | 从模板起项目（如 `aws-typescript`）；`--config="aws:region=us-west-2"` 预设配置 |
| `pulumi preview` | **只算不做**，列出将发生的变更（≈ `terraform plan`）；`--save-plan FILE` 存盘 |
| `pulumi up` | 部署：跑程序→注册→对比 state→执行；`--yes` 免确认、`--refresh` 先同步、`--plan FILE` 按存盘计划执行、`--policy-pack PATH` 挂策略 |
| `pulumi refresh` | 把 state 与云上**真实状态**同步（检测漂移） |
| `pulumi destroy` | 销毁当前 stack 管理的全部资源（保留 stack 本身） |
| `pulumi stack init/select/ls/rm/rename` | 建/切/列/删/改名 stack |
| `pulumi stack output [KEY]` | 读 stack 输出；`--show-secrets` 显示明文 |
| `pulumi stack export/import --file F` | 导出/导入 state（迁移后端、手术） |
| `pulumi config set KEY [VAL]` | 设配置；`--secret` 加密、`--path 'a.b[0]'` 结构化 |
| `pulumi config get/rm KEY` · `pulumi config` | 读/删/列配置（`--json`） |
| `pulumi login [URL\|--local]` · `logout` · `whoami` | 选后端/登出/看当前身份 |
| `pulumi import TYPE NAME ID` | 把已有云资源纳管并生成代码 |
| `pulumi convert --from terraform` | 把 Terraform HCL 转成目标语言的 Pulumi 程序 |
| `pulumi package add PKG` | 加 package（组件/桥接 provider），登记到 `Pulumi.yaml` |
| `pulumi policy [publish/enable/…]` | 策略包管理 |
| `pulumi state delete/unprotect/rename/move` | state 手术（谨慎） |
| `pulumi plugin ls/install/rm` | provider 插件管理 |
| `pulumi cancel` · `pulumi about` | 取消卡住的更新 · 环境诊断 |

## 核心概念速查

| 概念 | 说明 |
| --- | --- |
| **Project（项目）** | 一份 Pulumi 程序 + `Pulumi.yaml`（name/runtime/description） |
| **Stack（栈）** | 程序的一个**隔离、可独立配置**的实例 = 一个环境；有独立 config + 独立 state |
| **Resource（资源）** | `new Res(name, args, opts)`；分 `CustomResource`（真实云资源）与 `ComponentResource`（逻辑组合） |
| **逻辑名 vs 物理名** | 逻辑名同类型同栈唯一、跨运行须稳定；物理名默认**自动命名**（逻辑名 + 随机后缀） |
| **Input&lt;T&gt; / Output&lt;T&gt;** | 输入接受普通值/Promise/Output；输出是**创建后才知**的异步值，携带依赖与 secret 元信息 |
| **Provider** | 调云/SaaS API 的插件 + SDK；原生 / 桥接 TF / 参数化 / 动态四形态 |
| **State / Backend** | state = 资源元数据；后端存 state，Pulumi Cloud（默认）或 DIY（S3/Azure/GCS/本地/PG） |
| **Config / Secret** | 每栈参数存 `Pulumi.<stack>.yaml`；secret **默认加密**，是特殊 Output |
| **Stack Reference** | 跨栈读另一栈 output：`new pulumi.StackReference("org/proj/stack")` |
| **Automation API** | 用 SDK 在自己程序里驱动引擎，不经 CLI |
| **Policy Pack（CrossGuard）** | 策略即代码，`preview`/`up` 时拦违规 |

## Output 操作速查

| 写法 | 用途 |
| --- | --- |
| `out.apply(v => f(v))` | 变换**单个** output，返回新 Output（回调里是明文） |
| `pulumi.all([a, b]).apply(([a, b]) => …)` | 组合**多个** output 后变换（≈ `Promise.all`） |
| `pulumi.interpolate\`…${out}…\`` | 模板字符串式拼接 output（最常用） |
| `pulumi.concat(a, b, c)` | `interpolate` 的函数版拼接 |
| `pulumi.jsonStringify(objWithOutputs)` | 把含 output 的对象序列化为 JSON（正确等待就绪） |
| `pulumi.output(x)` | 把普通值/Promise「抬」成 Output |
| `pulumi.secret(x)` | 把值标记为 secret（加密、传播） |
| `export const k = out` | 变成 stack output，`pulumi stack output k` 可取 |

> ⚠️ output **不能直接**当普通值打印/字符串拼接；进 `apply`/`all`/`interpolate` 才行，且结果仍是 Output。

## resource options 速查

| 选项 | 作用 |
| --- | --- |
| `dependsOn` | 追加**显式依赖**（数据未引用但逻辑上依赖时） |
| `protect` | **防误删**，任何删它的操作报错 |
| `parent` | 建父/子层级（Component 子资源必传 `{ parent: this }`） |
| `provider` / `providers` | 指派显式 provider（单个 / 给组件子资源批量） |
| `ignoreChanges` | diff 忽略指定属性变化 |
| `deleteBeforeReplace` | 替换时先删旧再建新（默认相反） |
| `import` | 首次 up 时把已有云资源纳管 |
| `aliases` | 声明别名，让重命名/重构**不触发替换** |
| `customTimeouts` | 覆盖供给的重试/超时 |
| `retainOnDelete` | Pulumi 删除时在云上**保留**该资源 |
| `replaceOnChanges` | 指定属性变化即**强制替换** |
| `transforms` | 注册前动态改写属性（旧名 `transformations`） |
| `version` | 钉住 provider 插件版本 |

## 配置与 secret 速查

```bash
pulumi config set aws:region us-west-2       # 带命名空间（provider 配置）
pulumi config set size 3                      # 无命名空间 → 默认用项目名
pulumi config set --secret dbPassword S3cr37  # 加密存入 Pulumi.<stack>.yaml
pulumi config set --path 'data.nums[0]' 1     # 结构化配置
```

```ts
const c = new pulumi.Config();      // 默认命名空间 = 项目名
c.require("k");                      // 缺则抛错
c.get("k");                          // 缺则 undefined
c.getNumber("k"); c.getBoolean("k"); // 类型转换
c.requireObject<T>("data");          // 结构化
c.requireSecret("k");                // 返回加密 Output
```

| secret provider | `--secrets-provider` URL |
| --- | --- |
| Pulumi Cloud（默认） | 无需指定（每栈独立密钥） |
| passphrase | `passphrase`（配 `PULUMI_CONFIG_PASSPHRASE`） |
| AWS KMS | `awskms://<key-id>?region=us-east-1` |
| Azure Key Vault | `azurekeyvault://<vault>.vault.azure.net/keys/<key>` |
| GCP KMS | `gcpkms://projects/P/locations/L/keyRings/R/cryptoKeys/K` |
| HashiCorp Vault | `hashivault://<key>`（配 `VAULT_SERVER_URL`/`VAULT_SERVER_TOKEN`） |

## state 后端 login 速查

```bash
pulumi login                          # Pulumi Cloud（默认）
pulumi login https://pulumi.acme.com  # 自托管 Pulumi Cloud
pulumi login --local                  # 本地文件，等价 file://~
pulumi login file:///app/data         # 本地自定义路径
pulumi login s3://<bucket>            # AWS S3（+ ?region=&profile=；Minio 加 ?endpoint=&s3ForcePathStyle=true）
pulumi login azblob://<container>     # Azure Blob（需 AZURE_STORAGE_ACCOUNT 等）
pulumi login gs://<bucket>            # Google Cloud Storage（用 ADC）
pulumi login postgres://u:p@host/db   # PostgreSQL
# 或设环境变量 PULUMI_BACKEND_URL / 在 Pulumi.yaml 写 backend.url
```

## 常见坑速查

- **直接用 output**：`"x" + res.id` 拼不出值——`res.id` 是 Output，必须 `apply`/`interpolate`。
- **逻辑名用随机/时间**：`new Res(\`b-${Date.now()}\`)` 会每次运行改名 → **误删重建**。逻辑名必须稳定。
- **在 `apply` 回调里 new 资源**：这些资源游离于 `preview` 之外，破坏「先看后做」。重构数据流，别在 apply 里建资源。
- **组件子资源漏 `parent: this`**：子资源跑到组件外面，层级与依赖不对。
- **`config set` 没带命名空间**：provider 配置要写 `aws:region`，漏了 `aws:` 会存到项目命名空间、provider 读不到。
- **DIY 后端当团队库用**：只有基础文件锁，高并发/协作易冲突；备份与访问控制自负——团队优先 Pulumi Cloud。
- **敏感值放进物理 ID/名字**：物理 ID 永远明文存 state，无法加密。
- **重构触发替换**：改逻辑名/挪层级会替换资源；用 `aliases` 声明旧名 → 新名保住资源。
- **误信 state**：Pulumi 默认不主动核对云上现状；怀疑漂移要 `refresh` 或 `up --refresh`。
- **provider 版本漂移**：不 pin 版本，团队/CI 间可能装到不同 provider；用 `version` 选项或锁依赖。

## 与 Terraform 术语对照

| Pulumi | Terraform | 备注 |
| --- | --- | --- |
| `pulumi preview` | `terraform plan` | 只算不做 |
| `pulumi up` | `terraform apply` | 执行变更 |
| `pulumi destroy` | `terraform destroy` | 销毁 |
| `pulumi refresh` | `terraform refresh` / `-refresh` | 同步真实态 |
| Stack | Workspace（近似） | 环境隔离单元 |
| `new Res(name, args, opts)` | `resource "type" "name" {}` | 声明资源 |
| `.get()` / provider 数据函数 | `data` 源 | 读已有资源/数据 |
| Component Resource | Module | 复用单元（Pulumi 可跨语言） |
| Output apply/interpolate | `${}` 插值 + 依赖图 | 值传递与依赖 |
| Config / `Pulumi.<stack>.yaml` | variables / `*.tfvars` | 参数化 |
| Secret（默认加密） | `sensitive`（state 不加密） | Pulumi 默认加密 state |
| Terraform Bridge 桥接 provider | 原生 provider | Pulumi 可复用 TF provider |
| Policy Pack / CrossGuard | Sentinel（HCP 专有） | 策略即代码 |
| Automation API | 无等价物 | 可编程驱动引擎 |

## 权威链接

- [Pulumi 官方文档](https://www.pulumi.com/docs/) · [IaC 概念](https://www.pulumi.com/docs/iac/concepts/) · [How Pulumi works](https://www.pulumi.com/docs/iac/guides/basics/how-pulumi-works/)
- [Inputs & Outputs](https://www.pulumi.com/docs/iac/concepts/inputs-outputs/) · [Resources](https://www.pulumi.com/docs/iac/concepts/resources/) · [Resource options](https://www.pulumi.com/docs/iac/concepts/options/) · [Components](https://www.pulumi.com/docs/iac/concepts/resources/components/)
- [Stacks](https://www.pulumi.com/docs/iac/concepts/stacks/) · [Config](https://www.pulumi.com/docs/iac/concepts/config/) · [Secrets](https://www.pulumi.com/docs/iac/concepts/secrets/) · [State & Backends](https://www.pulumi.com/docs/iac/concepts/state/)
- [Providers](https://www.pulumi.com/docs/iac/concepts/resources/providers/) · [Automation API](https://www.pulumi.com/docs/iac/packages-and-automation/automation-api/) · [Policy as Code](https://www.pulumi.com/docs/iac/policies/) · [ESC](https://www.pulumi.com/docs/esc/)
- [Pulumi vs Terraform](https://www.pulumi.com/docs/iac/comparisons/terraform/) · [Pulumi Registry](https://www.pulumi.com/registry/) · [CLI 参考](https://www.pulumi.com/docs/iac/cli/)
- [GitHub: pulumi/pulumi](https://github.com/pulumi/pulumi)（Apache 2.0）
