---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 microsoft/azure-skills 官方仓库（README、`.claude-plugin/plugin.json`、`.mcp.json`、`skills/`）编写。

## 速查

- **仓库**：`microsoft/azure-skills`，MIT，Microsoft，plugin 版本 1.1.95
- **三层**：27 Azure skills + Azure MCP Server（`@azure/mcp`，200+ 工具 / 40+ 服务）+ Foundry MCP
- **Claude Code 装**：`/plugin install azure@claude-plugins-official`
- **MCP 配置**：`.mcp.json` → `npx -y @azure/mcp@latest server start`
- **认证**：`az login`（推荐）/ `azd auth login`（部署）/ 服务主体 / 托管标识
- **主权云**：`--cloud AzureChinaCloud` / `AzureUSGovernment`
- **关掉遥测**：`export AZURE_MCP_COLLECT_TELEMETRY=false`

## 27 个 skill 全表

### 构建 / 部署 / 演进

| skill | 触发 | 覆盖 |
| --- | --- | --- |
| `azure-prepare` | prepare app for azd、create azure.yaml | 生成 `azure.yaml`、Bicep/Terraform、Dockerfile（azd 工作流） |
| `azure-validate` | check deployment readiness、preflight | 配置/IaC/RBAC/托管标识校验，产 Validation Proof |
| `azure-deploy` | run azd up、ship it | 执行 `azd up`/`azd deploy`/`terraform apply`，带错误恢复 |
| `azure-upgrade` | upgrade plan/tier/SKU、modernize SDK | 层/SKU 升级、Azure SDK 现代化 |
| `azure-kubernetes` | create AKS、design AKS networking | 生产级 AKS 规划、SKU、网络、VPA |
| `airunway-aks-setup` | setup AI Runway、run LLM on AKS | AKS 上 GPU 推理、KAITO、vLLM |
| `python-appservice-deploy` | deploy Flask/Django/FastAPI | Python 代码部署到 App Service Linux |

### 诊断 / 监控 / 治理

| skill | 触发 | 覆盖 |
| --- | --- | --- |
| `azure-diagnostics` | debug production、pod pending | AppLens / Azure Monitor / KQL 分诊 |
| `azure-messaging` | event hub SDK error、lock lost | Event Hubs / Service Bus SDK 排查 |
| `appinsights-instrumentation` | instrument app、telemetry | App Insights 埋点与 APM |
| `azure-compliance` | compliance scan、azqr | azqr 审计 + Key Vault 过期检查 |
| `azure-resource-lookup` | list my resources | 跨订阅列资源（Resource Graph） |
| `azure-quotas` | check quotas、vCPU limit | 配额/用量、容量校验、区域选择 |

### 架构 / 成本优化

| skill | 触发 | 覆盖 |
| --- | --- | --- |
| `azure-cost` | Azure costs、optimize costs | 查成本/预测/优化去浪费 |
| `azure-compute` | create VM、recommend VM size | VM / VMSS 选型、比价、连接排查 |
| `azure-reliability` | assess reliability、DR | 区域冗余/多区故障转移整改 |
| `azure-resource-visualizer` | architecture diagram | 资源组 → Mermaid 架构图 |
| `azure-cloud-migrate` | migrate Lambda to Functions | 跨云迁移（AWS/GCP/Heroku→Azure） |
| `azure-enterprise-infra-planner` | architect landing zone | 企业级 IaC，WAF 对齐 |

### 数据 / AI / 身份 / 平台

| skill | 触发 | 覆盖 |
| --- | --- | --- |
| `azure-ai` | AI Search、speech-to-text、OCR | AI Search/Speech/OpenAI/Document Intelligence |
| `azure-aigateway` | AI gateway、token limit | APIM 作 AI 网关（语义缓存/限流/内容安全） |
| `azure-storage` | blob、file share、access tier | Blob/File/Queue/Table/Data Lake、分层 |
| `azure-kusto` | KQL、Azure Data Explorer | ADX/Kusto KQL 时序与日志分析 |
| `azure-rbac` | what role should I assign | 最小权限角色 + CLI/Bicep 分配 |
| `entra-app-registration` | create app registration、OAuth | Entra ID 应用注册、MSAL |
| `entra-agent-id` | Agent Identity Blueprint、OBO | Entra Agent 身份、token exchange |
| `microsoft-foundry` | deploy agent、fine-tune、eval | Foundry agent 全生命周期 |

> 共 **27 个 SKILL.md**（`skills/` 目录）。每个 `SKILL.md` frontmatter 含 `name` / `description`（内含 `WHEN:` 与 `DO NOT USE FOR:`）/ `license: MIT` / `metadata.version`。

## 安装命令

| Host | 命令 |
| --- | --- |
| Claude Code | `/plugin install azure@claude-plugins-official` |
| Copilot CLI | `/plugin marketplace add microsoft/azure-skills` → `/plugin install azure@azure-skills` |
| APM（跨 host） | `apm install microsoft/azure-skills` |
| Gemini CLI | `gemini extensions install https://github.com/microsoft/azure-skills` |
| Codex CLI | `codex plugin marketplace add microsoft/azure-skills` |
| VS Code / Cursor / IntelliJ | 各自扩展市场装 Azure MCP 扩展 |

更新（Claude Code）：`/plugin update azure@claude-plugins-official`。

## MCP server 配置

仓库 `.mcp.json`（plugin 载荷同款）声明了 Azure MCP server：

```json
{
  "mcpServers": {
    "azure": {
      "command": "npx",
      "args": ["-y", "@azure/mcp@latest", "server", "start"]
    }
  }
}
```

- **Azure MCP Server**：`@azure/mcp`，200+ 工具跨 40+ Azure 服务，是执行层
- **Foundry MCP**：经 `microsoft-foundry` skill 与 host 集成接入（VS Code 扩展会自动配好）
- 需要 **Node.js 18+**（`npx` 拉起 server）

## 认证

```bash
az login                                   # 推荐
azd auth login                             # 用 azd 部署时
export AZURE_TENANT_ID="..."               # 或服务主体
export AZURE_CLIENT_ID="..."
export AZURE_CLIENT_SECRET="..."
```

在 Azure 内运行时 Azure MCP 可用**托管标识**。主权云：先 `az cloud set --name AzureChinaCloud`（或 `AzureUSGovernment`）再 `az login`，并给 MCP server 加 `--cloud` 参数。

## 仓库结构

```
azure-skills/
├── .claude-plugin/          # plugin.json + marketplace.json
├── .mcp.json                # Azure MCP server 配置
├── skills/                  # 27 个 skill（每个含 SKILL.md + references/）
├── hooks/                   # PostToolUse 遥测 hook
├── landing-page/            # Astro GitHub Pages 站点
├── apm.yml                  # APM 跨 host 打包源
└── README.md
```

## 许可与链接

- **许可**：MIT（Microsoft Corporation）；自 `microsoft/GitHub-Copilot-for-Azure` 同步（贡献提到那边）
- 仓库：[microsoft/azure-skills](https://github.com/microsoft/azure-skills)
- 站点：[microsoft.github.io/azure-skills](https://microsoft.github.io/azure-skills/) · [aka.ms/azure-plugin](https://aka.ms/azure-plugin)
- Azure MCP Server 文档：[learn.microsoft.com/azure/developer/azure-mcp-server](https://learn.microsoft.com/azure/developer/azure-mcp-server/)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Agent Skills 规范](../agent-skills-spec/)
