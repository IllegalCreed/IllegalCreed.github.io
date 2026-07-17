---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 aws/agent-toolkit-for-aws 官方仓库（GA）的 README、rules/、skills/ 与 setup-instructions/ 编写。

## 速查

- **是什么**：AWS 官方的 AI 编码 agent 工具箱（工具 + 知识 + 护栏），GA，Apache-2.0；社区 awslabs MCP/skills/plugins 的**官方继任者**
- **四部分**：**Plugins**（4 个一键插件）+ **Skills**（按需加载技能库）+ **Rules files**（项目级规则）+ **AWS MCP Server**（托管 API 网关，300+ 服务）
- **装 Skills**：`npx skills add aws/agent-toolkit-for-aws/skills`（跨 agent）
- **装 Plugin（Claude Code）**：`/plugin install aws-core@claude-plugins-official`（官方市场默认已加，**从 aws-core 开始**）
- **AWS CLI**：`aws configure agent-toolkit`
- **4 个 Plugin**：`aws-core`（核心，start here）· `aws-agents`（Bedrock AgentCore 建 agent）· `aws-data-analytics`（数据湖/ETL）· `aws-agents-for-devsecops`（事件/安全/渗透）
- **技能库**：`core-skills` 18 个 + `specialized-skills` 11 组 65 个 ≈ **83 个**，**按需加载**
- **前提**：装 [uv](https://docs.astral.sh/uv/)；调 API / 跑脚本需 AWS 凭据（文档搜索、技能发现不需要）
- **护栏**：IAM condition keys 区分 agent/人类动作、CloudWatch 指标、CloudTrail 审计

## 定位：官方 GA，替代社区 awslabs

2025 年 AWS 以 [AWS Labs](https://github.com/awslabs) 名义发布了一批 MCP server、skills、plugins。**AWS Agent Toolkit 是它们的官方继任者**，官方建议改用 Toolkit，因为它多了三样社区版没有的关键能力：

1. **IAM condition keys 区分 agent 与人类动作**——可写「哪怕用户底层角色能写，agent 走 MCP Server 也只允许只读」的策略
2. **CloudWatch 指标 + CloudTrail 审计**——每个请求都可监控、可审计 agent 行为
3. **技能经端到端评测**——工作流更可靠

> awslabs 仍会维护并接受贡献，AWS 会逐步把其中最好的迁进 Toolkit。所以两者会并存一段时间，选型时优先官方 Toolkit。

## 安装（按 agent）

不同 agent 有各自的接入方式，核心就两件事：**装 Plugin/Skills** +（可选）**配 AWS MCP Server**。

### AWS CLI

```bash
aws configure agent-toolkit
```

### Claude Code（官方市场默认已加）

```bash
# 核心插件：服务选型、CDK/CloudFormation、serverless、容器、存储、可观测、账单、SDK、部署
/plugin install aws-core@claude-plugins-official
# 建 AI agent（Bedrock、AgentCore）
/plugin install aws-agents@claude-plugins-official
# 数据湖 / 分析 / ETL（S3 Tables、Glue、Athena）
/plugin install aws-data-analytics@claude-plugins-official
```

> 若报 `Plugin not found`，先 `/plugin marketplace update claude-plugins-official` 刷新索引。

### Codex

```bash
codex plugin marketplace add aws/agent-toolkit-for-aws
# 再启动 Codex，运行 /plugins 浏览并安装 aws-core
```

### Cursor

在 **Settings → Plugins → Team Marketplaces → Add Marketplace → Import from Repo**，指向 `aws/agent-toolkit-for-aws`；再在 Plugins 面板装 **aws-core**（先从它开始）。

### Kiro（两部分，独立）

Kiro 分两步，且两步**互不依赖**——技能不需要 MCP Server，MCP Server 也不分发本地技能：

```json
// 1. .kiro/settings/mcp.json 加 AWS MCP Server（建议 pin 版本防供应链风险）
{
  "mcpServers": {
    "aws": {
      "command": "uvx",
      "args": ["mcp-proxy-for-aws@1.6.3", "https://aws-mcp.us-east-1.api.aws/mcp",
               "--metadata", "AWS_REGION=us-west-2"]
    }
  }
}
```

```bash
# 2. 装技能（写入 ~/.kiro/skills/ 全局 或 .kiro/skills/ 项目级）
npx skills add aws/agent-toolkit-for-aws/skills
```

### 其它 agent

参考 [AWS MCP Server 入门指南](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/getting-started-aws-mcp-server.html) 配好 MCP Server，再 `npx skills add aws/agent-toolkit-for-aws/skills`。

> **前提**：需装 [uv](https://docs.astral.sh/uv/)；调 AWS API、跑脚本要本地配好 AWS 凭据——但**文档搜索、技能发现不需要凭据**。

## 四部分：Plugins / Skills / Rules / MCP Server

| 部分 | 是什么 | 怎么用 |
| --- | --- | --- |
| **Plugins** | 把 MCP Server 配置 + 技能打包成一键安装（4 个） | `/plugin install aws-core@…`（Claude Code/Codex/Cursor） |
| **Skills** | 按需加载的指令 + 参考资料包，agent 只取当前任务相关的 | `npx skills add aws/agent-toolkit-for-aws/skills` |
| **Rules files** | 项目级规则文件，告诉 agent「优先用 MCP Server / 先发现技能 / 先查文档再动手」 | 放进项目（见 `rules/`） |
| **AWS MCP Server** | 托管的 MCP 服务，agent 经它访问 AWS | 配置端点后由 agent 调用 |

### AWS MCP Server 提供什么

- **全 AWS API 覆盖**——单一鉴权端点触达 300+ 服务
- **沙箱脚本执行**——在隔离环境跑 Python 做多步操作
- **实时文档访问**——搜索/读取最新 AWS 文档、API 参考，**无需鉴权**
- **企业控制**——CloudWatch 指标、IAM context keys（写 agent 专属策略）、CloudTrail 审计日志

## 技能库总览：83 个，12 组

技能库 `skills/` 分两层：

- **`core-skills`（18 个，核心）**：`aws-blocks`（服务选型/IfC）、`aws-cdk`、`aws-cloudformation`、`aws-serverless`、`aws-containers`、`aws-database`、`aws-iam`、`aws-networking`、`aws-observability`、`aws-messaging-and-streaming`、`aws-deployment`、`aws-billing-and-cost-management`、`amazon-bedrock`、`aws-sdk-js-v3-usage`、`aws-sdk-python-usage`、`aws-sdk-swift-usage`、`launch-with-aws`、`signing-in-to-aws`
- **`specialized-skills`（11 组，65 个）**：analytics（10）、database（14）、networking-and-content-delivery（13）、serverless（9）、storage（5）、operations（4）、ec2（3）、system-table（3）、migration-and-modernization（2）、security-and-identity（1）、web-and-mobile（1）

> **按需加载**是核心思想：agent 发现并只检索与当前任务相关的技能，不一次性塞满上下文。多数技能内部还会「按需读参考文件 / 知识卡」（如 `aws-database` 每次只加载 2–3 张服务知识卡）。

## 下一步

- [指南](./guide-line) —— 代表性技能逐讲、架构决策表 / 服务对比矩阵 / 部署工作流 / 排障、按需加载与反模式
- [参考](./reference) —— 分组清单、4 插件、安装矩阵、MCP Server、许可与链接
