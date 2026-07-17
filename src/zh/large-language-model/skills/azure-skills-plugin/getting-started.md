---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 microsoft/azure-skills 官方仓库（README、`.claude-plugin/`、`skills/`，plugin 版本 1.1.95）编写。

## 速查

- **定位**：Microsoft 官方多 host agent plugin，一装给三层能力，MIT
- **三层**：**27 个 Azure skills**（大脑，工作流 + 护栏）+ **Azure MCP Server**（双手，200+ 工具 / 40+ 服务，`npx -y @azure/mcp@latest server start`）+ **Foundry MCP**（AI 专家，模型/agent）
- **Claude Code 装**：`/plugin install azure@claude-plugins-official`（或 `/plugin` 搜 "azure"）；更新 `/plugin update azure@claude-plugins-official`
- **Copilot CLI 装**：`/plugin marketplace add microsoft/azure-skills` → `/plugin install azure@azure-skills`
- **APM 跨 host**：`apm install microsoft/azure-skills`（一条命令装到 Copilot / Claude Code / Cursor / OpenCode / Codex / Gemini）
- **前置**：Azure 账号 + **Node.js 18+**（`npx` 拉起 MCP）+ Azure CLI `az login`（部署再加 `azd auth login`）
- **skill 分类**：准备/校验/部署 · 诊断/监控/治理 · 架构/成本 · 数据/AI/身份/平台
- **验证**：问「List my Azure resource groups.」若得工具背书的真实响应，说明 MCP 已通

## 定位：官方的「Azure 能力层」

Azure Skills Plugin 不是 prompt 包，而是 Microsoft 官方打包的 **Azure 能力层**：

- **Skills** 教 agent「何时」用某个 Azure 工作流、以及「要避免什么」
- **MCP 工具**让 agent 在**真实** Azure / Foundry 资源上执行
- **Plugin** 把「指导层」和「执行层」对齐在一次安装里

一句话：装之前 agent 只会给通用云建议；装之后它既懂 Azure，又能用真实工具**执行** Azure 工作流。仓库自 `microsoft/GitHub-Copilot-for-Azure` 同步，贡献要提到那边。

## 三层能力

| 层 | 组件 | 加了什么 | 例子 |
| --- | --- | --- | --- |
| 大脑 | **Azure skills** | Azure 专家知识、工作流、护栏 | 准备、校验、部署、诊断、成本、AI、RBAC |
| 双手 | **Azure MCP Server** | 真实 Azure 工具（200+ 工具 / 40+ 服务） | 资源清单、监控、定价、存储、数据库、消息 |
| AI 专家 | **Foundry MCP** | Microsoft Foundry 工作流 | 模型目录、部署、agent、评估 |

Azure MCP Server 通过 `.mcp.json` 里的 `npx -y @azure/mcp@latest server start` 拉起；Foundry 能力经 `microsoft-foundry` skill 与 host 集成接入。

## 安装

### Claude Code

从官方市场 `claude-plugins-official` 安装（**不是** `microsoft/azure-skills` 那个市场——那是 Copilot CLI 用的）：

```bash
/plugin install azure@claude-plugins-official
```

或运行 `/plugin` 后在市场里搜 "azure"。更新：

```bash
/plugin update azure@claude-plugins-official
```

### 其它 host（择一）

```bash
# APM：一条命令跨 Copilot / Claude Code / Cursor / OpenCode / Codex / Gemini
apm install microsoft/azure-skills

# GitHub Copilot CLI
/plugin marketplace add microsoft/azure-skills   # 首次
/plugin install azure@azure-skills

# Gemini CLI
gemini extensions install https://github.com/microsoft/azure-skills

# Codex CLI
codex plugin marketplace add microsoft/azure-skills
```

VS Code / Cursor / IntelliJ 从各自扩展市场装 Azure MCP 扩展，会自动配好 MCP + skills。

### 前置条件

- Azure 账号 / 订阅
- **Node.js 18+**（`npx` 用来启动 MCP server）
- **Azure CLI** 且已 `az login`
- 要用部署工作流再装 **Azure Developer CLI** 并 `azd auth login`

## 27 个 skill 分类总览

插件当前带 **27 个 SKILL.md**（`skills/` 目录下），按功能分四大类：

| 类别 | 代表 skill | 干什么 |
| --- | --- | --- |
| 构建 / 部署 / 演进 | `azure-prepare` `azure-validate` `azure-deploy` `azure-upgrade` `azure-kubernetes` `airunway-aks-setup` `python-appservice-deploy` | 准备 azd 工程、校验、执行部署、升级 SKU、AKS |
| 诊断 / 监控 / 治理 | `azure-diagnostics` `appinsights-instrumentation` `azure-compliance` `azure-resource-lookup` `azure-quotas` `azure-messaging` | 排查线上问题、埋点、合规扫描、资源清单、配额 |
| 架构 / 成本优化 | `azure-cost` `azure-compute` `azure-resource-visualizer` `azure-cloud-migrate` `azure-enterprise-infra-planner` `azure-reliability` | 省成本、选 VM、画架构图、跨云迁移、落地区 |
| 数据 / AI / 身份 / 平台 | `azure-ai` `azure-aigateway` `azure-storage` `azure-kusto` `azure-rbac` `entra-app-registration` `entra-agent-id` `microsoft-foundry` | AI Search/Speech、AI 网关、存储、KQL、RBAC、身份、Foundry |

> 每个 skill 的 `SKILL.md` frontmatter 里都写了 `WHEN:`（触发词）和 `DO NOT USE FOR:`（边界），agent 据此自动选对 skill。

## 验证安装

装完做三个快检：

1. **skills 层**：问「What Azure services would I need to deploy this project?」——应得结构化 Azure 指导而非泛泛而谈
2. **Azure MCP**：问「List my Azure resource groups.」——应得工具背书的真实响应
3. **Foundry MCP**：问「What AI models are available in Microsoft Foundry?」——应得 Foundry 背书的响应

## 认证与主权云

```bash
az login                 # 推荐路径
azd auth login           # 要用 azd 部署时
# 或服务主体：export AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET
```

在 Azure 内运行时，Azure MCP 还能用托管标识。中国云 / 美国政府云用 `--cloud AzureChinaCloud` / `AzureUSGovernment` 参数，并先 `az cloud set` 切到对应环境。

## 下一步

- [指南](./guide-line) —— skill 分类逐讲、Azure MCP / Foundry MCP 推理 + 执行、部署工作流护栏、反模式
- [参考](./reference) —— 27 skill 全表、安装命令、MCP 配置、认证、许可与链接
