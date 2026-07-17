---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 aws/agent-toolkit-for-aws 官方仓库的 README、.claude-plugin/marketplace.json 与 skills/ 目录编写。

## 速查

- **装 Skills**：`npx skills add aws/agent-toolkit-for-aws/skills`
- **装 Plugin（Claude Code）**：`/plugin install aws-core@claude-plugins-official`
- **AWS CLI**：`aws configure agent-toolkit`
- **4 Plugin**：`aws-core`（v1.1.0，start here）· `aws-agents` · `aws-data-analytics` · `aws-agents-for-devsecops`
- **技能库**：`core-skills` 18 + `specialized-skills` 11 组 65 ≈ **83 个**
- **MCP Server**：托管，300+ 服务、沙箱脚本、免鉴权文档搜索、CloudWatch/IAM/CloudTrail 企业控制
- **许可**：Apache-2.0；状态 GA
- **前身**：社区 awslabs（并存，官方推荐 Toolkit）

## 4 个 Plugin

| Plugin | 版本 | 覆盖 |
| --- | --- | --- |
| **aws-core**（start here） | 1.1.0 | 服务选型、CDK/CloudFormation、serverless、容器、存储、可观测、账单、SDK、部署；核心服务 Lambda/API GW/Step Functions/ECS-Fargate/ECR/IAM/Bedrock/AWS Blocks；数据库全家桶 |
| **aws-agents** | 1.0.0 | 在 Bedrock AgentCore 上建 AI agent：Strands/LangGraph 脚手架、Gateway+MCP 连工具、多 agent/A2A、memory、Cedar 策略、评测、观测、调试、生产加固 |
| **aws-data-analytics** | 1.0.0 | 数据湖/分析/ETL：S3 Tables（Iceberg）、Glue、Athena；从 JDBC/Redshift/Snowflake/BigQuery/DynamoDB 摄取；S3 Vectors 语义搜索 |
| **aws-agents-for-devsecops** | 1.0.0 | 事件调查、发布就绪评审+UAT、漏洞扫描、渗透测试、威胁建模、修复；依赖 AWS DevOps Agent + AWS Security Agent |

> Plugins 把 AWS MCP Server 配置 + 技能打包成一键安装，**目前面向 Claude Code / Codex / Cursor**。

## 技能库分组清单

### core-skills（18）

`amazon-bedrock` · `aws-billing-and-cost-management` · `aws-blocks` · `aws-cdk` · `aws-cloudformation` · `aws-containers` · `aws-database` · `aws-deployment` · `aws-iam` · `aws-messaging-and-streaming` · `aws-networking` · `aws-observability` · `aws-sdk-js-v3-usage` · `aws-sdk-python-usage` · `aws-sdk-swift-usage` · `aws-serverless` · `launch-with-aws` · `signing-in-to-aws`

### specialized-skills（11 组，65）

| 组 | 数 | 代表技能 |
| --- | --- | --- |
| database-skills | 14 | amazon-dynamodb、aurora-dsql、amazon-aurora-postgresql、rds-oracle、timestream-influxdb |
| networking-and-content-delivery-skills | 13 | cloudfront、route53、transitgateway、waf、creating-production-vpc-multi-az |
| analytics-skills | 10 | amazon-opensearch-service、querying-data-lake、managing-amazon-msk、aws-cleanrooms |
| serverless-skills | 9 | debugging-lambda-timeouts、connecting-lambda-to-dynamodb、aws-lambda-durable-functions |
| storage-skills | 5 | securing-s3-buckets、troubleshooting-s3-files、troubleshooting-efs、storing-and-querying-vectors |
| operations-skills | 4 | setting-up-cloudwatch-alarm-notifications、troubleshooting-application-failures |
| ec2-skills | 3 | launching-ec2-instance-with-best-practices、setting-up-ec2-instance-profiles |
| system-table-skills | 3 | querying-aws-cloudwatch、querying-aws-s3、querying-aws-sagemaker-catalog |
| migration-and-modernization-skills | 2 | aws-transform、dms-schema-conversion |
| security-and-identity-skills | 1 | creating-secrets-using-best-practices |
| web-and-mobile-development | 1 | aws-amplify |

> 数字为当前官方仓库快照的实际值，会随官方新增技能增长；以仓库 `skills/` 目录为准。

## 安装矩阵

| Agent | 命令 / 步骤 |
| --- | --- |
| AWS CLI | `aws configure agent-toolkit` |
| Claude Code | `/plugin install aws-core@claude-plugins-official`（官方市场默认已加） |
| Codex | `codex plugin marketplace add aws/agent-toolkit-for-aws` → `/plugins` 装 aws-core |
| Cursor | Settings → Plugins → Team Marketplaces → Import from Repo（`aws/agent-toolkit-for-aws`）→ 装 aws-core |
| Kiro | ①`.kiro/settings/mcp.json` 配 AWS MCP Server（uvx mcp-proxy-for-aws）②`npx skills add aws/agent-toolkit-for-aws/skills` |
| 其它 agent | 配 AWS MCP Server + `npx skills add aws/agent-toolkit-for-aws/skills` |

前提：装 [uv](https://docs.astral.sh/uv/)；调 API/跑脚本需 AWS 凭据（文档搜索、技能发现不需要）。

## AWS MCP Server

| 能力 | 说明 |
| --- | --- |
| 全 API 覆盖 | 单一鉴权端点触达 300+ AWS 服务 |
| 沙箱脚本执行 | 隔离环境跑 Python 做多步操作 |
| 实时文档访问 | 搜索/读取最新 AWS 文档、API 参考，**免鉴权** |
| 企业控制 | CloudWatch 指标、IAM context keys（agent 专属策略）、CloudTrail 审计 |

Kiro 配置示例（建议 pin 版本）：

```json
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

## Rules files 要点

- 优先 AWS MCP Server（沙箱/观测/审计），无则用 AWS CLI
- 动手前先发现技能（`retrieve_skill`），优先于训练知识
- 不确定的 API/权限/限额/错误码先查文档，不能确认就明说
- 基础设施优先 IaC（CDK/CloudFormation），遵 Well-Architected
- 资源名用连字符不用 em dash；秘密走运行时解析引用，不直接 `get-secret-value`

## 许可与相较 awslabs

- **许可**：Apache-2.0，状态 GA
- **相较 awslabs**：Toolkit 多了①IAM condition keys 区分 agent/人类动作 ②CloudWatch+CloudTrail 每请求监控审计 ③技能经端到端评测；awslabs 仍维护，官方会逐步把最好的迁进 Toolkit

## 资源链接

- 仓库：[aws/agent-toolkit-for-aws](https://github.com/aws/agent-toolkit-for-aws)（Apache-2.0）
- 用户指南：[docs.aws.amazon.com/agent-toolkit](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/)
- MCP Server 工具参考：[understanding-mcp-server-tools](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/understanding-mcp-server-tools.html)
- 产品页：[agent-toolkit-for-aws](https://aws.amazon.com/products/developer-tools/agent-toolkit-for-aws/)

## 下一步

- 回到 [入门](./getting-started) 复习安装与四部分
- 深入 [指南](./guide-line) 看架构决策表 / 服务对比矩阵 / 部署 / 排障与反模式
