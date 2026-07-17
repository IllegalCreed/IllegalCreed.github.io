---
layout: doc
---

# HashiCorp Agent Skills

HashiCorp Agent Skills（`hashicorp/agent-skills`）是 HashiCorp（现属 IBM）官方出品的一组 AI 编码 agent 技能集与 Claude Code 插件，定位是「A collection of Agent skills and Claude Code plugins for HashiCorp products」。当前覆盖 **Terraform**（写 HCL、建模块、开发 provider、跑测试、写策略）与 **Packer**（在 AWS / Azure / Windows 上构建机器镜像、集成 HCP Packer 注册表），未来预留 Vault、Consul 等产品。它把 HashiCorp 官方的 Style Guide、AVM 认证规范、Terraform Test / Stacks 文档、Packer builder 范式打包成可按需调用的技能——核心价值是**给 LLM 灌官方约束**：让 agent 生成的 Terraform / Packer 代码对齐官方风格、版本约束与测试范式，而不是凭模型模糊记忆编造属性与过时语法。MPL-2.0 开源，遵 agentskills.io 开放格式。

## 评价

**优点**

- **官方权威**：HashiCorp 官方出品，规则直接对齐官方 [Terraform Style Guide](https://developer.hashicorp.com/terraform/language/style)、[Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/)、Terraform Test / Stacks 文档，非社区二手总结
- **治「LLM 幻觉写 Terraform」**：把官方命名、版本约束、文件组织、测试范式喂给 agent，生成的 HCL 直接过 `terraform fmt` / `validate`，减少编造资源属性、用过时语法
- **双轨安装**：跨 agent（`npx skills add`，装进 Claude Code / GitHub Copilot / Cursor / opencode 等）+ Claude Code 插件市场（`claude plugin marketplace add` 后 6 个插件按需装）
- **覆盖全生命周期**：写码（style-guide）→ 测试（terraform-test）→ 模块化（refactor-module）→ 规模编排（terraform-stacks）→ 纳管存量（search-import）→ 开发 provider → 策略即代码（tfpolicy）；Packer 侧建镜像 + 推 HCP 注册表
- **面向真实云**：AWS `amazon-ebs`、Azure `azure-arm` builder、AVM 认证、多区复制、OIDC workload identity 等生产实践
- **结构清晰**：product → plugin → skill（每 skill 一个 `SKILL.md`），符合 agentskills.io 开放格式，可跨 agent 移植

**缺点 / 边界**

- **仅 Terraform + Packer**：Vault / Consul / Nomad 等 HashiCorp 产品尚未覆盖（README 里标为 Future products）
- **进阶技能有门槛**：provider-development、AVM 37 条要求、Terraform Stacks 需要相应背景
- **依赖新版本**：search-import 需 Terraform >= 1.14 + provider 支持 list 资源；Stacks 需 CLI 1.13+；mock provider 需 1.7+
- **云操作有真实成本/耗时**：Packer 建 AMI 约 10–30 分钟、Azure 15–45 分钟、Windows 45–120 分钟，且产生云费用
- **给的是范式与约束**：具体资源属性、provider schema 仍要核对官方文档，技能不代替判断

## 适用场景

- 让 AI 按 HashiCorp 官方风格写 / 审 Terraform HCL（文件组织、命名、版本 pin）
- 给模块写 `.tftest.hcl` 测试、搭 CI 门禁（plan 单测 + apply 集成测）
- 把单体配置重构成可复用模块，用 `moved` 块做无损状态迁移
- 多区 / 多环境用 Terraform Stacks 声明式编排
- 把存量云资源用 Terraform Search + 批量 import 纳管到 IaC
- 开发 / 维护 Terraform Provider（Plugin Framework、资源、动作、验收测试）
- 用 Packer 建 AWS / Azure / Windows 镜像，并推送元数据到 HCP Packer

## 边界

- **不是单个技能，是官方技能集**：6 个插件、约 17 个 `SKILL.md`，各有触发条件，按需激活
- **只覆盖 Terraform + Packer**：其余 HashiCorp 产品未纳入
- **生成 / 审计给范式**：云侧真实属性与成本要自己核对
- **许可 MPL-2.0**：弱 copyleft，修改技能文件本身需按 MPL 回馈

## 官方文档

[Terraform 文档](https://developer.hashicorp.com/terraform) ｜ [Packer 文档](https://developer.hashicorp.com/packer) ｜ [Terraform Style Guide](https://developer.hashicorp.com/terraform/language/style) ｜ [HCP Packer](https://developer.hashicorp.com/hcp/docs/packer)

## GitHub 地址

[hashicorp/agent-skills](https://github.com/hashicorp/agent-skills)（MPL-2.0）

## 内容地图

- [入门](./getting-started) —— 定位（官方，Terraform + Packer）、双轨安装、6 插件与 skill 总览
- [指南](./guide-line) —— Terraform 各 skill（style-guide / test / search-import / AVM / refactor / stacks / provider dev）+ Packer 各 builder + hcp 逐讲、反模式
- [参考](./reference) —— skill 清单表、安装命令、许可 MPL-2.0、链接

## 幻灯片地址

<a href="/SlideStack/hashicorp-agent-skills-slide/" target="_blank">HashiCorp Agent Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=640" target="_blank" rel="noopener noreferrer">HashiCorp Agent Skills 测试题</a>
