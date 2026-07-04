---
layout: doc
outline: [2, 3]
---

# 参考：命令 · 差异 · 时间线 · 坑

> 基于 OpenTofu 1.12 · 核于 2026-07

## 速查

- **CLI**：`tofu` 对应 `terraform`，子命令同名同义；只有 `.terraformrc` → `.tofurc` 改了名。
- **保留**：`terraform {}` 块、`TF_*` 环境变量、`.terraform.lock.hcl`、`.terraform/` 目录全部沿用。
- **招牌差异**：客户端 **state/plan 加密**（`encryption` 块 / `TF_ENCRYPTION`）。
- **独有**：`-exclude`、provider `for_each`、`enabled` 元参数、`.tofu` 文件、OCI registry、early variable evaluation。
- **许可**：OpenTofu = **MPL 2.0**；Terraform 1.6+ = **BUSL 1.1**；TF 1.5.x 是最后的 MPL 版。
- **治理**：Linux 基金会 + TSC + 公开 RFC；不自造 provider，用 **registry.opentofu.org**。
- **迁移**：备份 → 装 `tofu` → `tofu init` → 期望 `No changes` → 小步试跑。
- **回退**：没用独有特性 ≈ 无痛；用了（尤其加密）代价高。
- **版本**：2024-01 首个稳定 **1.6.0**；2026 稳定 **1.12.x**。
- **兼容基线**：分叉初期 ≈ Terraform 1.6，state 至 1.5.x。

## 一、`tofu` 命令速查（对照 `terraform`）

| 命令 | 作用 | 备注 |
| --- | --- | --- |
| `tofu init` | 装 provider、初始化 backend、拉 module | `-upgrade` 升级；1.12 起默认写全 `zh:`+`h1:` 校验和 |
| `tofu plan` | 生成执行计划 | `-out=f` 固化；`-target` / **`-exclude`**（1.9）选择 |
| `tofu apply` | 执行变更 | `apply f` 执行计划文件；`-auto-approve` 跳确认 |
| `tofu destroy` | 销毁受管资源 | 等价 `apply -destroy` |
| `tofu fmt` | 规范化格式 | `-recursive` 递归 |
| `tofu validate` | 校验语法/一致性 | 不连云 |
| `tofu state <sub>` | 操作 state | `list` / `show` / `mv` / `rm` / `pull` / `push` |
| `tofu import <addr> <id>` | 纳管已有资源 | 或用 `import` 块（支持 `for_each`） |
| `tofu output` | 读输出 | `-json` 机器可读 |
| `tofu show` | 查看 state/plan | `-json` |
| `tofu providers` | provider 依赖树 | `lock` / `mirror` / `schema` 子命令 |
| `tofu test` | 运行 `.tftest.hcl` | 原生测试框架 |
| `tofu console` | 交互式表达式求值 | 调试利器 |
| `tofu login / logout` | 登录 registry/后端 | |
| `tofu version` | 版本 | `-json` |

## 二、OpenTofu-only（或先行）特性 × 版本

| 版本 | 发布 | 关键特性 |
| --- | --- | --- |
| **1.6** | 2024-01 | 首个稳定版；drop-in for Terraform 1.6 |
| **1.7** | 2024 | **客户端 state/plan 加密**、provider-defined functions、`import` 的 `for_each`、`removed` 块 |
| **1.8** | 2024 | **early variable evaluation**、**`.tofu` 文件扩展名** |
| **1.9** | 2024 | **provider `for_each`**、**`-exclude`**、`encrypted_metadata_alias` |
| **1.10** | 2025 | **OCI registry** 分发 provider/module |
| **1.11** | 2025 | ephemeral values/resources、**`enabled` 元参数** |
| **1.12** | 2026 | `destroy = false`、动态 `prevent_destroy`、`init` 全校验和、`-json-into` |

> 部分特性（provider-defined functions、`removed`、ephemeral）Terraform 亦有对应；**至今仍属 OpenTofu 硬差异**的是 **state/plan 加密、`-exclude`、provider `for_each`、`enabled`、`.tofu`、OCI registry**。以各版本官方 What's new 为准。

## 三、许可与分叉时间线

| 时间 | 事件 |
| --- | --- |
| 2023-08-10 | HashiCorp 将 Terraform 许可 **MPL 2.0 → BUSL 1.1**（非开源）；Terraform **1.5.x 是最后的 MPL 版** |
| 2023-08-25 | 社区请求恢复开源无果，公开发起分叉（**OpenTF**），发布 Manifesto |
| 2023-09-05 | OpenTF 仓库公开；Manifesto 获 32K+ star、100+ 公司、400+ 个人响应 |
| 2023-09-20 | **Linux 基金会**接纳；因商标更名 **OpenTofu** |
| 2024-01-10 | **OpenTofu 1.6.0** 首个稳定版，可用于生产 |
| 2025-02 | IBM 完成对 HashiCorp 约 **64 亿美元**收购（Terraform 归 IBM） |
| 2026 | OpenTofu 稳定在 **1.12.x** |

**许可对照**：

| 维度 | OpenTofu | Terraform（1.6+） |
| --- | --- | --- |
| 许可 | **MPL 2.0**（OSI 开源） | **BUSL 1.1**（source-available，非开源） |
| 竞品限制 | 无 | 禁止竞品用途 |
| 掌舵 | Linux 基金会 + TSC | HashiCorp（IBM） |
| provider | 复用现有，许可未变 | 同 |

## 四、兼容项：保留 vs 改名

| 项 | Terraform | OpenTofu | 说明 |
| --- | --- | --- | --- |
| 配置块 | `terraform {}` | `terraform {}` | 保留 |
| 变量环境变量 | `TF_VAR_*` | `TF_VAR_*` | 保留 |
| 日志/其它 env | `TF_LOG` 等 | `TF_LOG` 等 | 保留 |
| 锁文件 | `.terraform.lock.hcl` | `.terraform.lock.hcl` | 保留 |
| 工作目录 | `.terraform/` | `.terraform/` | 保留 |
| CLI 配置文件 | `.terraformrc` / `terraform.rc` | **`.tofurc` / `tofu.rc`** | 改名（格式一致） |
| 加密环境变量 | 无 | **`TF_ENCRYPTION`** | 新增 |
| 文件扩展名 | `.tf` / `.tf.json` | `.tf` + **`.tofu`**（同名覆盖） | 扩展 |
| Registry | registry.terraform.io | **registry.opentofu.org** | 各自独立 |

## 五、迁移检查清单

- 备份 state（`terraform.tfstate` 或远程 state）与全部配置代码
- 安装 `tofu`，`tofu version` 确认
- `tofu init` 接管现有目录，观察是否顺利
- `tofu plan` **应为 `No changes`**——有意外变更立即停下排查
- 用一个小改动跑通 `plan → apply`，核对行为
- CI/CD 把 `terraform` 命令替换为 `tofu`
- `.terraformrc` 内容迁到 `.tofurc`
- 评估 `terraform_remote_state` 跨配置依赖，成对迁移
- 评估对 HCP Terraform / TFE 的依赖与替代
- 决定是否启用 state 加密（启用后视为「较难回退」）

## 六、坑速查

- **块名别改**：`terraform {}` 在 OpenTofu 里**仍叫 terraform**，不是 `tofu {}`——改了会报错。
- **`.tofu` 覆盖 `.tf`**：同名同目录时 `.tofu` 生效、`.tf` 被忽略；别不小心留了个 `main.tofu` 把 `main.tf` 遮住。
- **加密后不可回跑 Terraform**：开了 state 加密，Terraform（及未配同款加密的 `tofu`）都读不了 state。
- **别重命名 key provider / method**：会让加密元数据对不上导致 state 读不出；要改用 `encrypted_metadata_alias` 或 `fallback` 兜住。
- **口令强度**：`pbkdf2` 口令**至少 16 字符**，否则报错。
- **独有特性 = 迁移锁**：用了 `-exclude` / `enabled` / provider `for_each` / 加密后，配置**不能无缝跑回 Terraform**。
- **`plan` 非 `No changes`**：迁移时若 `tofu plan` 显示大量变更，多半是版本/provider 不对齐，别急着 `apply`。
- **registry 端点**：企业内网要放行 `registry.opentofu.org`；或用 OCI / provider mirror。
- **「OpenTofu 有 = Terraform 没有」要核对**：部分特性两边并行都有，别据旧印象下结论，查当时的 What's new。

## 七、权威链接

- [OpenTofu 官方文档](https://opentofu.org/docs/) · [FAQ](https://opentofu.org/faq/) —— 一手事实
- [分叉公告](https://opentofu.org/blog/opentofu-announces-fork-of-terraform/) · [Manifesto](https://opentofu.org/manifesto/) —— 分叉背景与「真正开源」原则
- [迁移指南](https://opentofu.org/docs/intro/migration/) · [What's new](https://opentofu.org/docs/intro/whats-new/) —— 迁移步骤与各版本特性
- [state/plan 加密](https://opentofu.org/docs/language/state/encryption/) —— 招牌特性配置与 key provider
- [`.tofu` / override 文件](https://opentofu.org/docs/language/files/override/) —— 文件扩展名与覆盖规则
- [`.tofurc` CLI 配置](https://opentofu.org/docs/cli/config/config-file/) —— CLI 配置文件
- [OpenTofu Registry](https://registry.opentofu.org/) · [search.opentofu.org](https://search.opentofu.org/) —— provider/module
- [GitHub: opentofu/opentofu](https://github.com/opentofu/opentofu) —— 源码 / Release / CHANGELOG / RFC / MPL 2.0 LICENSE
- [HashiCorp 许可 FAQ](https://www.hashicorp.com/en/license-faq) —— BUSL 变更的一手说明（对照用）
