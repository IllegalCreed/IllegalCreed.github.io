---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Terraform（1.x）· 核于 2026-07。命令与关键字对 OpenTofu（`tofu`）基本通用。完整文档见 [developer.hashicorp.com/terraform](https://developer.hashicorp.com/terraform)。

## 速查

- **主工作流**：`init` → `validate` → `plan` → `apply` → `destroy`；`fmt` 规范格式。
- **看状态**：`state list` / `state show` / `show` / `output`。
- **改地址**：`state mv`（或声明式 `moved` 块）；**脱管** `state rm`（或 `removed` 块）。
- **纳管已有资源**：`import` 块 + `plan -generate-config-out`（新）或 `terraform import`（旧）。
- **顶层块**：`terraform` / `provider` / `resource` / `data` / `variable` / `output` / `locals` / `module` / `import` / `moved` / `removed` / `check`。
- **meta-arguments**：`count` / `for_each` / `depends_on` / `provider` / `lifecycle`。
- **替换资源**：`apply -replace="aws_instance.web"`（取代旧 `taint`），可先 `plan` 预演。
- **版本约束**：`~> 5.1` 锁 minor（<6.0）、`~> 5.1.0` 锁 patch（<5.2.0）、`=` 精确、`>=` 下限。
- **调试**：`terraform console` 交互式求值表达式；`TF_LOG=DEBUG` 看详细日志。
- **环境变量**：`TF_VAR_*` 赋值、`TF_WORKSPACE` 选 workspace、`TF_IN_AUTOMATION`/`TF_INPUT=0` 供 CI。
- **锁文件**：`.terraform.lock.hcl` 必须进 Git；`state` 不进 Git。
- **许可**：1.5.x=最后 MPL，1.6.0+=BUSL；纯开源用 **OpenTofu**（MPL、`tofu`）。

## 一、CLI 全命令

| 命令 | 作用 | 常用 flag |
| --- | --- | --- |
| `init` | 初始化目录：装 Provider、连 backend、下模块 | `-upgrade` `-backend-config=` `-reconfigure` `-migrate-state` |
| `validate` | 校验语法与内部一致性（不连云） | `-json` |
| `plan` | 生成执行计划（diff） | `-out=FILE` `-var` `-var-file=` `-target=` `-refresh-only` `-refresh=false` `-destroy` |
| `apply` | 执行变更 | `-auto-approve` `-var` `-var-file=` `-target=` `-parallelism=N` `apply FILE`（执行已存计划） |
| `destroy` | 销毁受管资源（= `apply -destroy`） | `-auto-approve` `-target=` |
| `fmt` | 规范化 HCL 格式 | `-recursive` `-check` `-diff` |
| `show` | 显示 state 或已存 plan（可读/JSON） | `-json` |
| `output` | 打印 output 值 | `-json` `-raw NAME` |
| `refresh` | 刷新 state 对齐真实（旧命令，改用 `plan -refresh-only`） | — |
| `console` | 交互式表达式求值（调试函数/表达式利器） | `-var` |
| `graph` | 输出依赖图（Graphviz DOT） | `-type=plan` |
| `providers` | 列出配置所需 Provider；`providers lock/mirror/schema` 子命令 | — |
| `import` | 命令式导入已有资源到 state（旧法） | `-var` |
| `taint` / `untaint` | 标记/取消标记资源下次强制重建（旧法，改用 `-replace=`） | — |
| `state list` | 列出 state 中所有资源地址 | — |
| `state show ADDR` | 显示某资源在 state 中的属性 | — |
| `state mv SRC DST` | 在 state 中重命名/搬移资源地址（不动真实资源） | — |
| `state rm ADDR` | 从 state 移除（**不删真实资源**，脱管） | — |
| `state pull` / `push` | 拉出 / 写入原始 state（备份/迁移，高危） | — |
| `workspace` | `new` / `select` / `list` / `delete` 多 state 工作区 | — |
| `login` / `logout` | 登录/登出 HCP Terraform 或其它远程主机 | — |
| `force-unlock ID` | 强制释放卡住的 state 锁（确认无进程在跑再用） | — |
| `version` | 显示版本 | — |

::: tip 替换资源的现代写法
旧的 `terraform taint` 已不推荐，改用 `terraform apply -replace="aws_instance.web"` 在一次 plan/apply 中显式请求重建某资源，可先 `plan` 预演。
:::

## 二、顶层块与关键字

| 块 | 用途 |
| --- | --- |
| `terraform {}` | 全局设置：`required_version` / `required_providers` / `backend` 或 `cloud` |
| `provider "x" {}` | 配置某 Provider（区域、认证等），可用 `alias` 建多实例 |
| `resource "T" "N" {}` | 声明**受管**资源（增改删，进 state） |
| `data "T" "N" {}` | **只读**数据源（查询已有信息，不创建） |
| `variable "N" {}` | 输入变量：`type`/`default`/`description`/`sensitive`/`validation`/`nullable`/`ephemeral` |
| `output "N" {}` | 输出值：`value`/`description`/`sensitive`/`depends_on` |
| `locals {}` | 命名局部值，`local.<名>` 引用 |
| `module "N" {}` | 调用子模块：`source`/`version` + 入参 |
| `import {}` | 配置驱动导入（`to` / `id`），1.5+ |
| `moved {}` | 声明式记录资源地址迁移，代替 `state mv` |
| `removed {}` | 声明式脱管（从配置删除但不销毁真实资源），1.7+ |
| `check {}` | 独立断言块（assert），巡检期望而不阻断，1.5+ |

## 三、meta-arguments（用在 resource/module）

| meta-arg | 作用 | 备注 |
| --- | --- | --- |
| `count = N` | 造 N 个实例 | `count.index` 取序号；引用 `[i]`；中间删元素会连带重排 |
| `for_each = map/set` | 按键造实例 | `each.key`/`each.value`；引用 `["k"]`；增删稳定，**优先用它** |
| `depends_on = [...]` | 显式依赖 | 隐式依赖（引用属性）无法表达时才用 |
| `provider = x.alias` | 指定用哪个 Provider 实例 | 多区域/多账号场景 |
| `lifecycle {}` | 生命周期干预 | 见下表 |

**`lifecycle` 子参数**：

| 参数 | 作用 |
| --- | --- |
| `create_before_destroy` | 替换时先建新再删旧（零停机） |
| `prevent_destroy` | 拦截任何销毁计划（防误删） |
| `ignore_changes = [...]` | 忽略指定属性的漂移 |
| `replace_triggered_by = [...]` | 被引用对象变化时强制替换本资源 |
| `precondition {}` / `postcondition {}` | 前置/后置断言，不满足则失败 |

## 四、常用内置函数（分类速查）

| 类别 | 代表函数 |
| --- | --- |
| 字符串 | `format` `join` `split` `replace` `lower`/`upper` `trimspace` `substr` `regex` `templatefile` |
| 集合 | `length` `concat` `merge` `keys`/`values` `lookup` `contains` `flatten` `distinct` `toset` `slice` `element` |
| 数值 | `min` `max` `abs` `ceil`/`floor` `pow` |
| 编码 | `jsonencode`/`jsondecode` `yamlencode`/`yamldecode` `base64encode`/`base64decode` |
| 文件 | `file` `fileexists` `templatefile` `pathexpand` `abspath` |
| 加密/哈希 | `sha256` `md5` `bcrypt` `uuid` `filesha256` |
| 网络/IP | `cidrsubnet` `cidrhost` `cidrsubnets` |
| 类型/容错 | `try` `can` `tolist`/`toset`/`tomap` `coalesce` `nonsensitive` |
| 时间 | `timestamp` `timeadd` `formatdate` |

调试表达式与函数用 `terraform console`——交互式即时求值。

## 五、常用环境变量

| 变量 | 作用 |
| --- | --- |
| `TF_VAR_<name>` | 给输入变量 `<name>` 赋值 |
| `TF_LOG` | 日志级别：`TRACE`/`DEBUG`/`INFO`/`WARN`/`ERROR` |
| `TF_LOG_PATH` | 日志写入文件 |
| `TF_CLI_ARGS` / `TF_CLI_ARGS_<cmd>` | 给命令追加默认参数（如 `TF_CLI_ARGS_plan`） |
| `TF_WORKSPACE` | 选择 CLI workspace |
| `TF_DATA_DIR` | 覆盖 `.terraform` 目录位置 |
| `TF_IN_AUTOMATION` | 非空时精简为 CI 友好输出 |
| `TF_INPUT=0` | 禁止交互式提问（CI 常设） |

## 六、坑速查

| 坑 | 说明与对策 |
| --- | --- |
| **`count` 中间删元素** | 后续索引整体前移 → 大量无辜资源重建。改用 `for_each`（稳定键） |
| **敏感值明文进 state** | `sensitive` 只打码回显、**不影响 state 存储**。远程 backend + 加密 + 访问控制；临时值用 `ephemeral` |
| **state 提交进 Git** | 泄露全部密钥。`.gitignore` 掉 `*.tfstate*`，state 走远程 backend |
| **忘记提交 `.terraform.lock.hcl`** | 团队/CI Provider 版本不一致。**必须**提交锁文件 |
| **backend 块里写变量** | backend 不能引用 `var`/`local`。用 partial config：`init -backend-config=` |
| **`-target` 常态化** | 只应急用；长期用会让 state 与配置逐渐不一致 |
| **provisioner 当常规手段** | 破坏声明式/幂等、不进 plan。用 cloud-init/Ansible 替代 |
| **手改云资源（drift）** | 下次 `apply` 悄悄改回或打架。铁律：别绕过 Terraform 手改 |
| **`apply` 不带 `-out`** | 审的 plan 与执行的 plan 可能不是同一份。CI 用 `plan -out` + `apply FILE` |
| **`~>` 用错层级** | `~> 5.1` 锁到 minor（<6.0），`~> 5.1.0` 锁到 patch（<5.2.0），别混 |
| **误把两种 workspace 混谈** | CLI workspace（多 state）≠ HCP workspace（管理单元），语境要分清 |

## 七、许可与版本时间线

| 时间 | 事件 |
| --- | --- |
| 2014 | Terraform 首次发布，**MPL 2.0** 开源 |
| **2023-08-10** | HashiCorp 宣布许可 **MPL 2.0 → BUSL 1.1**（非开源，source-available） |
| **2023-08-25** | 社区分叉，OpenTF（后改名 **OpenTofu**）公开 |
| 2023-09-20 | OpenTofu 被 **Linux Foundation** 接纳 |
| 2023-10 | **Terraform 1.6.0**——首个 BUSL 版本（**1.5.x 是最后 MPL**）；OpenTofu 以其为 drop-in 基线 |
| 2024-04 | `Terraform Cloud` 更名 **HCP Terraform**；IBM 宣布收购 HashiCorp |
| **2025-02-27** | IBM 以约 **64 亿美元**完成对 HashiCorp 的收购 |

**BUSL 1.1 要点**：源码可见、可改、可内部使用；**禁止竞争性商业用途**；每版发布 **4 年后自动转 MPL 2.0**。纯开源诉求选 **OpenTofu**（MPL 2.0，命令 `tofu`）。

## 八、权威链接

- [Terraform 文档总入口](https://developer.hashicorp.com/terraform) · [CLI 命令](https://developer.hashicorp.com/terraform/cli/commands) · [配置语言](https://developer.hashicorp.com/terraform/language)
- [state 文档](https://developer.hashicorp.com/terraform/language/state) · [backend](https://developer.hashicorp.com/terraform/language/backend) · [模块](https://developer.hashicorp.com/terraform/language/modules) · [import](https://developer.hashicorp.com/terraform/language/import)
- [内置函数](https://developer.hashicorp.com/terraform/language/functions) · [meta-arguments](https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle)
- [Terraform Registry](https://registry.terraform.io/) —— Provider 与 Module 检索
- [HashiCorp 许可 FAQ](https://www.hashicorp.com/en/license-faq) —— MPL→BUSL 一手说明
- [OpenTofu 官网](https://opentofu.org/) · [分叉公告](https://opentofu.org/blog/opentofu-announces-fork-of-terraform/) · [迁移指南](https://opentofu.org/docs/intro/migration/)
- [GitHub: hashicorp/terraform](https://github.com/hashicorp/terraform) · [opentofu/opentofu](https://github.com/opentofu/opentofu)
