---
layout: doc
---

# AWS Agent Toolkit

AWS Agent Toolkit（`aws/agent-toolkit-for-aws`）是 AWS **官方**出品的「给 AI 编码 agent 用的 AWS 工具箱」——把在 AWS 上构建、部署、运维应用所需的**工具、知识与护栏（guardrails）**打包，让 Claude Code、Codex、Cursor、Kiro 等开发者已在用的 agent 能安全高效地操作 AWS。2026 年 GA，是 2025 年社区 [awslabs](https://github.com/awslabs) 那批 MCP server / skills / plugins 的**官方继任者**。四位一体：**Plugins**（4 个开箱即用插件）+ **Skills**（按需加载的技能库）+ **Rules files**（项目级规则）+ **AWS MCP Server**（托管的 AWS API 网关）。Apache-2.0 开源。

## 评价

**优点**

- **AWS 官方 + 已 GA**：不是第三方封装，是 AWS 官方支持、经端到端评测的 agent 工具，仓库徽章标注 `status GA`
- **四位一体**：Plugins（一键装）/ Skills（技能库）/ Rules（规则）/ AWS MCP Server（托管网关）分工明确，各自可独立用
- **企业级护栏**：IAM condition keys **区分 agent 动作与人类动作**（可写「只允许 agent 走只读」的策略）、每次请求都有 CloudWatch 指标 + CloudTrail 审计日志
- **技能经评测**：skills 都做过端到端评估，比社区版更有把握「工作流能跑通」
- **跨 agent**：同一套技能装进 Claude Code / Codex / Cursor / Kiro 等，`npx skills add` 一条命令
- **MCP Server 强**：单一鉴权端点覆盖 **300+ AWS 服务**、沙箱化 Python 脚本执行、**免鉴权**的实时文档搜索
- **反幻觉设计**：技能内置「STOP — 别用训练知识回答」「先查文档再答」的护栏，降低对易变的 AWS 事实（配额/GA/限额）编造

**缺点 / 边界**

- **Plugins 目前限 3 个 agent**：一键插件当前面向 Claude Code / Codex / Cursor；其它 agent（含 Kiro）走「配 AWS MCP Server + `npx skills add`」的手动路径
- **需 AWS 账号与凭据**：API 调用与脚本执行需本地配好 AWS 凭据（仅文档搜索、技能发现不需要）
- **devsecops 插件需另设**：`aws-agents-for-devsecops` 依赖 AWS DevOps Agent、AWS Security Agent 两个独立产品，装后要跑 `setup`
- **绑 AWS 生态**：面向 AWS 服务，非云中立
- **与社区 awslabs 并存**：awslabs 仍在维护，选型时需分清「用官方 Toolkit 还是社区版」（官方推荐前者）

## 适用场景

- 让 Claude Code / Codex / Cursor / Kiro 在 AWS 上写 IaC（CDK/CloudFormation）、部署 serverless/容器、选数据库、排障
- 想给 agent 加「企业护栏」：只读策略、审计日志、区分 agent/人类动作
- 在 AWS 上用 Bedrock AgentCore 构建 AI agent（`aws-agents` 插件）
- 数据湖 / 分析 / ETL 工作流（`aws-data-analytics` 插件）
- 事件调查、发布就绪评审、漏洞扫描、渗透测试（`aws-agents-for-devsecops` 插件）

## 边界

- **不是单个技能，是一整套工具箱**：Plugins / Skills / Rules / MCP Server 四部分
- **技能可脱离 MCP Server 用**：skills 不强依赖 MCP Server；MCP Server 也不负责分发本地技能，两者互补独立
- **凭据分层**：文档搜索 / 技能发现无需 AWS 凭据；真正调 API、跑脚本才需要
- **官方 ≠ 唯一**：社区 awslabs 的 MCP/skills/plugins 仍可用，官方会逐步把其中最好的迁进 Toolkit

## 官方文档

[用户指南](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/) ｜ [AWS MCP Server 工具参考](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/understanding-mcp-server-tools.html) ｜ [产品页](https://aws.amazon.com/products/developer-tools/agent-toolkit-for-aws/)

## GitHub 地址

[aws/agent-toolkit-for-aws](https://github.com/aws/agent-toolkit-for-aws)（Apache-2.0）

## 内容地图

- [入门](./getting-started) —— 定位、安装（各 agent）、技能库 83 个 12 组总览、Plugins/Skills/Rules/MCP Server 四部分
- [指南](./guide-line) —— 代表性技能逐讲（架构决策表 / 服务对比矩阵 / 部署工作流 / 排障）、按需加载、反模式
- [参考](./reference) —— 技能库分组清单、4 插件、安装矩阵、AWS MCP Server、许可、链接

## 幻灯片地址

<a href="/SlideStack/aws-agent-toolkit-slide/" target="_blank">AWS Agent Toolkit</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=638" target="_blank" rel="noopener noreferrer">AWS Agent Toolkit 测试题</a>
