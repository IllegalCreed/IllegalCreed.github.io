---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 hashicorp/agent-skills 官方仓库主分支（2026-07）的 README、terraform/README、packer/README 与各 `SKILL.md` 编写。

## 速查

- **是什么**：HashiCorp 官方的 agent 技能集 + Claude Code 插件，覆盖 **Terraform + Packer**，MPL-2.0
- **跨 agent 装**：`npx skills add hashicorp/agent-skills`（列全部）｜ `npx skills add hashicorp/agent-skills/<路径>/skills/<skill>`（装单个）
- **Claude Code 插件装**：先 `claude plugin marketplace add hashicorp/agent-skills`，再 `claude plugin install <plugin>@hashicorp`
- **6 个插件**：`terraform-code-generation`、`terraform-module-generation`、`terraform-provider-development`、`terraform-policy-code`、`packer-builders`、`packer-hcp`
- **结构**：product → plugin（`.claude-plugin/plugin.json`）→ skills → `<skill>/SKILL.md`
- **约 17 个 skill**：Terraform 13（code-gen 4 + module 2 + provider 6 + policy 1）+ Packer 4（builders 3 + hcp 1）
- **触发**：装后 agent 按 `SKILL.md` 的 `description`（Use when…）自动激活，也可自然语言显式触发
- **核心价值**：给 LLM 灌官方风格 / 版本 / 测试约束，治「幻觉写 Terraform」

## 定位：HashiCorp 官方，只做 Terraform + Packer

它是 HashiCorp（现属 IBM）**官方**维护的技能集，README 一句话概括：为 HashiCorp 产品提供的 Agent skills 与 Claude Code 插件。当前两条产品线：

| 产品 | 用途 |
| --- | --- |
| [Terraform](https://developer.hashicorp.com/terraform) | 写 HCL、建模块、开发 provider、跑测试、写策略 |
| [Packer](https://developer.hashicorp.com/packer) | 在 AWS / Azure / Windows 建镜像、集成 HCP Packer 注册表 |

Vault、Consul 等其它产品在 README 里标为「Future products」，尚未提供。它和通用 prompt 的区别在于：规则是 HashiCorp 官方沉淀（Style Guide、AVM、Test / Stacks 文档），目的是让 agent 生成的 IaC 代码**先天遵官方规范**，减少模型编造属性、用废弃语法。

## 安装：两条路

### 跨 agent（skills CLI）

用开放 skills 生态装进 Claude Code / GitHub Copilot / Cursor / opencode 等：

```bash
# 列出全部技能
npx skills add hashicorp/agent-skills

# 安装单个技能（用仓库内相对路径）
npx skills add hashicorp/agent-skills/terraform/code-generation/skills/terraform-style-guide
```

### Claude Code 插件（marketplace）

先添加 HashiCorp marketplace，再按需装插件——一个插件对应一组相关技能：

```bash
# 1. 添加官方 marketplace
claude plugin marketplace add hashicorp/agent-skills

# 2. 安装插件（Terraform）
claude plugin install terraform-code-generation@hashicorp
claude plugin install terraform-module-generation@hashicorp
claude plugin install terraform-provider-development@hashicorp
claude plugin install terraform-policy-code@hashicorp

# 3. 安装插件（Packer）
claude plugin install packer-builders@hashicorp
claude plugin install packer-hcp@hashicorp
```

也可用交互界面：`/plugin`。装后技能自动可用，agent 检测到相关任务时按 `SKILL.md` frontmatter 的 `description`（写明 Use when…）激活。

## 目录结构：product / plugin / skill

仓库是三层结构，每个 plugin 有自己的 `plugin.json`，每个 skill 有一个 `SKILL.md`：

```
agent-skills/
├── .claude-plugin/marketplace.json   # 6 个插件的清单
├── terraform/
│   ├── code-generation/      # 插件 terraform-code-generation
│   │   └── skills/{terraform-style-guide, terraform-test,
│   │                azure-verified-modules, terraform-search-import}
│   ├── module-generation/    # 插件 terraform-module-generation
│   │   └── skills/{refactor-module, terraform-stacks}
│   ├── provider-development/ # 插件 terraform-provider-development
│   │   └── skills/{new-terraform-provider, provider-resources,
│   │                provider-actions, provider-docs,
│   │                run-acceptance-tests, provider-test-patterns}
│   └── policy/               # 插件 terraform-policy-code
│       └── skills/{terraform-policy}
└── packer/
    ├── builders/             # 插件 packer-builders
    │   └── skills/{aws-ami-builder, azure-image-builder, windows-builder}
    └── hcp/                  # 插件 packer-hcp
        └── skills/{push-to-registry}
```

## skill 总览

### Terraform 侧

| 插件 | skill | 一句话 |
| --- | --- | --- |
| code-generation | `terraform-style-guide` | 按 HashiCorp 官方风格生成 HCL（文件组织、命名、版本 pin） |
| code-generation | `terraform-test` | 写 / 跑 `.tftest.hcl` 测试（run / assert、plan vs apply、mock） |
| code-generation | `azure-verified-modules` | AVM 认证 37 条要求（azurerm/azapi、snake_case、MUST/SHOULD） |
| code-generation | `terraform-search-import` | 用 `.tfquery.hcl` 发现存量资源并批量 import |
| module-generation | `refactor-module` | 单体配置重构成可复用模块 + `moved` 状态迁移 |
| module-generation | `terraform-stacks` | Stack 语言（`.tfcomponent.hcl` / `.tfdeploy.hcl`）多区多环境编排 |
| provider-development | `new-terraform-provider` 等 6 个 | Plugin Framework 脚手架、资源 / 动作 / 文档 / 验收测试 |
| policy | `terraform-policy` | 写 `.policy.hcl` 策略、`.policytest.hcl` 测试、转 Sentinel |

### Packer 侧

| 插件 | skill | 一句话 |
| --- | --- | --- |
| builders | `aws-ami-builder` | 用 `amazon-ebs` builder 建 AMI，多区复制 |
| builders | `azure-image-builder` | 用 `azure-arm` builder 建 Azure 托管镜像 / Compute Gallery |
| builders | `windows-builder` | 跨平台 Windows 镜像（WinRM + PowerShell provisioner） |
| hcp | `push-to-registry` | `hcp_packer_registry` 块推构建元数据到 HCP Packer |

## 下一步

- [指南](./guide-line) —— 各 skill 深入、Packer builder 逐讲、反模式（LLM 写 Terraform 易幻觉）
- [参考](./reference) —— skill 清单表、安装命令、许可、链接
