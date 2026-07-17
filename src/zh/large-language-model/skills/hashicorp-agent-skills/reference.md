---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 hashicorp/agent-skills 官方仓库的 README、marketplace.json 与各 `SKILL.md` 编写。

## 速查

- **装（跨 agent）**：`npx skills add hashicorp/agent-skills`
- **装（Claude Code）**：`claude plugin marketplace add hashicorp/agent-skills` → `claude plugin install <plugin>@hashicorp`
- **6 插件**：terraform-code-generation / terraform-module-generation / terraform-provider-development / terraform-policy-code / packer-builders / packer-hcp
- **约 17 skill**：Terraform 13 + Packer 4，每 skill 一个 `SKILL.md`
- **格式**：agentskills.io 开放格式；**许可 MPL-2.0**；HashiCorp（IBM）官方
- **版本门槛**：search-import ≥ 1.14、Stacks CLI ≥ 1.13、mock provider ≥ 1.7

## 插件与 skill 全表

### Terraform

| 插件 | skill | 触发 / 用途 |
| --- | --- | --- |
| `terraform-code-generation` | `terraform-style-guide` | 写 / 审 / 生成 HCL，按 HashiCorp 官方风格 |
| `terraform-code-generation` | `terraform-test` | 建 `.tftest.hcl`、run / assert、mock、plan vs apply |
| `terraform-code-generation` | `azure-verified-modules` | 建 / 审需 AVM 认证的 Azure 模块（37 条要求） |
| `terraform-code-generation` | `terraform-search-import` | 纳管存量、审计云资源、迁移到 IaC |
| `terraform-module-generation` | `refactor-module` | 单体配置重构成可复用模块 + 状态迁移 |
| `terraform-module-generation` | `terraform-stacks` | 建 / 改 / 验 Stack 配置，多区多环境编排 |
| `terraform-provider-development` | `new-terraform-provider` | 用 Plugin Framework 脚手架新 provider |
| `terraform-provider-development` | `provider-resources` | 实现资源与数据源（CRUD、schema、状态） |
| `terraform-provider-development` | `provider-actions` | 实现 provider 动作（生命周期操作） |
| `terraform-provider-development` | `provider-docs` | 生成 provider 文档 |
| `terraform-provider-development` | `run-acceptance-tests` | 跑 / 调 provider 验收测试 |
| `terraform-provider-development` | `provider-test-patterns` | `terraform-plugin-testing` 验收测试范式 |
| `terraform-policy-code` | `terraform-policy` | 写 `.policy.hcl` / `.policytest.hcl`、转 Sentinel |

### Packer

| 插件 | skill | 触发 / 用途 |
| --- | --- | --- |
| `packer-builders` | `aws-ami-builder` | 用 `amazon-ebs` 建 AMI，多区复制 |
| `packer-builders` | `azure-image-builder` | 用 `azure-arm` 建 Azure 托管镜像 / Compute Gallery |
| `packer-builders` | `windows-builder` | 跨平台 Windows 镜像（WinRM + PowerShell） |
| `packer-hcp` | `push-to-registry` | `hcp_packer_registry` 块推构建元数据到 HCP Packer |

> 注：README 里 `terraform-policy-code` 用途表描述了 `tfpolicy-author` / `tfpolicy-test` 两个子技能，而仓库实际是单个 `terraform-policy` skill（作者 / 测试 / 转换的说明在其 `references/` 下）；`provider-development` README 列 5 skill、仓库实为 6（含 `provider-docs`）。以仓库 `SKILL.md` 为准。

## 安装命令

```bash
# —— 跨 agent（skills CLI）——
npx skills add hashicorp/agent-skills                 # 列全部
npx skills add hashicorp/agent-skills/terraform/code-generation/skills/terraform-style-guide

# —— Claude Code 插件 ——
claude plugin marketplace add hashicorp/agent-skills  # 先加 marketplace
claude plugin install terraform-code-generation@hashicorp
claude plugin install terraform-module-generation@hashicorp
claude plugin install terraform-provider-development@hashicorp
claude plugin install terraform-policy-code@hashicorp
claude plugin install packer-builders@hashicorp
claude plugin install packer-hcp@hashicorp
# 或交互式：/plugin
```

## 关键文件扩展名

| 扩展名 | 属于 | 说明 |
| --- | --- | --- |
| `.tf` | Terraform | 常规配置（`main.tf` / `variables.tf` / `outputs.tf` …） |
| `.tftest.hcl` | terraform-test | 测试文件（`run` / `assert` 块） |
| `.tfquery.hcl` | search-import | Search 查询（`list` 块） |
| `.tfcomponent.hcl` | Stacks | 组件配置（component / provider / output） |
| `.tfdeploy.hcl` | Stacks | 部署配置（deployment / identity_token） |
| `.policy.hcl` | policy | HCP Terraform 策略即代码 |
| `.policytest.hcl` | policy | 策略测试 |
| `.pkr.hcl` | Packer | 镜像模板（source / build / provisioner） |

## 版本与环境要求

| 能力 | 要求 |
| --- | --- |
| terraform-search-import | Terraform ≥ 1.14 + provider 支持 list 资源 |
| import by identity | Terraform ≥ 1.12 |
| Terraform Stacks CLI | Terraform ≥ 1.13（GA） |
| terraform-test mock provider | Terraform ≥ 1.7 |
| `moved` 块状态迁移 | Terraform ≥ 1.1 |
| Packer HCP 推送 | Packer ≥ 1.7.7 |

## 目录结构

```
agent-skills/
├── .claude-plugin/marketplace.json
├── terraform/
│   ├── code-generation/{.claude-plugin/plugin.json, skills/…}
│   ├── module-generation/{.claude-plugin/plugin.json, skills/…}
│   ├── provider-development/{.claude-plugin/plugin.json, skills/…}
│   └── policy/{.claude-plugin/plugin.json, skills/terraform-policy/…}
├── packer/
│   ├── builders/{.claude-plugin/plugin.json, skills/…}
│   └── hcp/{.claude-plugin/plugin.json, skills/…}
├── README.md
└── AGENTS.md
```

## 资源链接

- 仓库：[hashicorp/agent-skills](https://github.com/hashicorp/agent-skills)（MPL-2.0）
- Terraform 文档：[developer.hashicorp.com/terraform](https://developer.hashicorp.com/terraform)
- Terraform Style Guide：[语言风格](https://developer.hashicorp.com/terraform/language/style)
- Terraform Test：[测试文档](https://developer.hashicorp.com/terraform/language/tests)
- Azure Verified Modules：[AVM 规范](https://azure.github.io/Azure-Verified-Modules/)
- Packer 文档：[developer.hashicorp.com/packer](https://developer.hashicorp.com/packer)
- HCP Packer：[hcp/docs/packer](https://developer.hashicorp.com/hcp/docs/packer)
- Terraform MCP Server：[hashicorp/terraform-mcp-server](https://github.com/hashicorp/terraform-mcp-server)

## 下一步

- 回 [入门](./getting-started) 或 [指南](./guide-line)
- 相关叶：本站「Agent Skills」方向下的其它官方 / 社区技能集叶
