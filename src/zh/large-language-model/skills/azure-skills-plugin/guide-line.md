---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 microsoft/azure-skills 官方仓库的 README 与各 `skills/*/SKILL.md` 编写。

## 速查

- **两层协作**：skill = 推理层（决策树 + 护栏）、Azure MCP = 执行层（200+ 工具 / 40+ 服务）；查真实资源靠 MCP，不靠 skill 编
- **部署链**：`azure-prepare → azure-validate → azure-deploy`，validate 未过 STOP、破坏性动作 `ask_user`、禁止绕过直接 `azd up`
- **Troubleshooting**：`azure-diagnostics`（AppLens/Azure Monitor/KQL）、`azure-messaging`（Event Hubs/Service Bus SDK）
- **Best Practices**：`azure-validate` `azure-reliability`（区域冗余/多区故障转移）`azure-cost` `azure-compliance`（azqr）`azure-upgrade`
- **Architecture**：`azure-enterprise-infra-planner`（落地区/hub-spoke/WAF）`azure-resource-visualizer`（Mermaid 图）`azure-kubernetes` `airunway-aks-setup`
- **Security / 身份**：`azure-rbac`（最小权限）`entra-app-registration`（OAuth/MSAL）`entra-agent-id`（Agent 身份/OBO）
- **Configuration / 供给**：`azure-prepare` `azure-deploy` `azure-quotas` `azure-resource-lookup` `azure-compute`
- **反模式**：跳过 validate 直接部署、混淆 prepare（建新应用）与 deploy（部署已备好的）、让 skill「猜」资源状态

## 两层如何配合：推理 + 执行

这是理解整个 plugin 的关键。

- **Skill（推理层）**：`SKILL.md` 是给 agent 的**指令**——写清楚工作流步骤、决策树、护栏（如「所有校验必须通过才能部署」）。它教 agent「怎么想、按什么顺序做、什么不能做」。
- **Azure MCP（执行层）**：`@azure/mcp` 提供 200+ 结构化工具，覆盖 40+ Azure 服务——列资源、查定价、读日志、诊断、驱动真实工作流。它让 agent「真的动手」。

举例：`azure-rbac` skill 指导 agent 先用 `azure__documentation` 工具找匹配的最小内置角色，找不到再用 `azure__extension_cli_generate` 造自定义角色，最后用 `azure__bicepschema` + `azure__get_azure_bestpractices` 生成 Bicep 角色分配片段。**决策靠 skill，取数与生成靠 MCP 工具。**

## Troubleshooting：诊断类 skill

### azure-diagnostics

在 Azure 上排查线上问题——借 AppLens、Azure Monitor、resource health 做安全分诊。覆盖 App Service 高 CPU / 部署失败、Container Apps / Functions / AKS 故障（kubectl 连不上、CoreDNS 挂、pod pending、crashloop、node not ready）、镜像拉取失败、冷启动、健康探针失败、KQL 日志分析，以及 Event Hubs / Service Bus 的 AMQP 连接与消息锁问题。触发词如「debug production issues」「app service high CPU」「pod pending」。

### azure-messaging

专治 Azure 消息 SDK（Event Hubs / Service Bus）的疑难：连接失败、认证错误、消息处理、AMQP link detach、message lock lost / lock renewal、send timeout、dead letter、session lock expired，覆盖 Python / Java / JavaScript / .NET SDK 的日志开关与排查。

## Best Practices：校验与优化类

### azure-validate（部署前的守门人）

部署前深度校验：配置、基础设施（Bicep / Terraform）、RBAC 角色分配、托管标识权限、前置条件。它有强护栏——**没有 `azure-prepare` 产出的 `.azure/deployment-plan.md` 就 STOP**，且**所有校验通过前不许把状态置为 `Validated`、更不许直接跑部署命令**，必须把校验命令与结果记进「Validation Proof」再交给 `azure-deploy` 执行。

### 其它

- **azure-reliability**：扫 PaaS（Functions / App Service）的区域冗余、ZRS 存储、健康探针、多区故障转移，给「按特性透视」的清单并分阶段整改
- **azure-cost**：查成本、预测支出、优化去浪费（孤儿资源、rightsize VM、成本尖峰）；明确 `DO NOT USE FOR` 部署/诊断/安全审计
- **azure-compliance**：跑 azqr 合规与安全审计 + Key Vault 过期检查（过期证书 / 将到期密钥 / 孤儿资源）
- **azure-upgrade**：升级计划/层/SKU（Consumption→Flex Consumption、App Service→Container Apps），或现代化 Azure SDK 依赖（`com.microsoft.azure`→`com.azure`、Redis ACR→AMR）

## Architecture：架构类

- **azure-enterprise-infra-planner**：从工作负载描述架构并供给企业级基础设施——网络、身份、安全、合规、多资源拓扑，对齐 WAF（Well-Architected Framework），直接产 Bicep 或 Terraform（不走 azd）。适合规划落地区、hub-spoke 网络、多区 DR
- **azure-resource-visualizer**：分析资源组并生成 Mermaid 架构图，展示资源间关系
- **azure-kubernetes**：规划/创建生产级 AKS——Day-0 清单、SKU 选择（Automatic vs Standard）、网络（私有 API server、Azure CNI Overlay、出站配置）、安全、运维（自动扩缩、升级、VPA)
- **airunway-aks-setup**：在 AKS 上搭 AI Runway——集群校验、控制器安装、GPU 评估、KAITO / vLLM 模型服务首次部署

## Security 与身份

- **azure-rbac**：为身份找最小权限角色，生成 CLI 命令 + Bicep 分配代码，并说明「授予角色本身」需要的权限
- **entra-app-registration**：Microsoft Entra ID 应用注册、OAuth 2.0、MSAL 集成（API 权限、服务主体、console app 认证）
- **entra-agent-id**：供给 Entra Agent Identity Blueprint / BlueprintPrincipal / 每实例 Agent Identity，配 OAuth 2.0 token exchange（`fmi_path`、OBO、跨租户）与 AgentID sidecar
- **azure-compliance**：见上，合规与安全姿态双管

> 三个身份 skill 各有边界：标准应用注册用 `entra-app-registration`、资源 RBAC 用 `azure-rbac`、agent 身份用 `entra-agent-id`，互相在 frontmatter 里写了 `DO NOT USE FOR` 指路。

## Configuration / 供给类

- **azure-prepare**：为 azd 工程生成 `azure.yaml`、IaC（Bicep / Terraform）、Dockerfile。**只在明确要用 azd 时用**；非 azd、纯 Python App Service、跨云迁移各有专 skill
- **azure-deploy**：为**已准备好**（有 `.azure/deployment-plan.md` 且 validate 通过）的应用执行部署——跑 `azd up` / `azd deploy` / `terraform apply` / `az deployment`，带错误恢复
- **azure-quotas**：查/管配额与用量，做部署规划、容量校验、区域选择
- **azure-resource-lookup**：跨订阅/资源组列资源，走 Azure Resource Graph，找孤儿资源、按标签分析
- **azure-compute**：VM / VMSS 路由器——选型、比价、排查连不上（RDP/SSH 3389、NSG、黑屏、重置密码）

## Foundry MCP：AI 专家层

`microsoft-foundry` skill + Foundry MCP 覆盖 Foundry agent 全生命周期：hosted agent 脚手架/运行/部署、prompt agent 创建、批量与持续评估、prompt/Agent 优化器、`agent.yaml`、从 trace curate 数据集、模型微调（SFT / DPO / RFT）。验证时问「What AI models are available in Microsoft Foundry?」应得 Foundry 背书响应。

## 反模式

- **跳过校验直接部署**：`azure-validate` 明确「所有检查必须通过，不许带失败部署」——不要绕过它直接 `azd up`
- **绕过 azure-deploy 手动跑部署命令**：skill 要求让 `azure-deploy` 统一执行（内置错误恢复），别自己乱跑 `azd deploy`
- **混淆 prepare 与 deploy**：「create and deploy a new app」用 `azure-prepare`（建新工程），「run azd up / ship it」用 `azure-deploy`（部署已备好的）——用反了 skill 会拦
- **让 skill「猜」资源状态**：真实资源清单、定价、日志要用 Azure MCP 工具取，不要指望 skill 凭空编
- **忽视破坏性操作确认**：破坏性动作要 `ask_user`，不要让 agent 自动执行不可逆变更
- **用错 skill**：每个 skill 有 `DO NOT USE FOR`（如 `azure-cost` 不做部署、`azure-storage` 不管 Cosmos DB）——按边界选

## 下一步

- [参考](./reference) —— 27 skill 全表、安装命令、MCP 配置、认证、主权云、许可与链接
- 上游：[Azure Skills 站点](https://microsoft.github.io/azure-skills/) · [Azure MCP Server 文档](https://learn.microsoft.com/azure/developer/azure-mcp-server/)
