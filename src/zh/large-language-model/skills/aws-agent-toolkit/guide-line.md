---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 aws/agent-toolkit-for-aws 官方仓库的 README、rules/aws-agent-rules.md、setup-instructions/ 与 skills/ 各 SKILL.md 编写。

## 速查

- **技能四大内容形态**：架构决策表（decision table）/ 服务对比矩阵（comparison matrix）/ 部署工作流 / 排障指南
- **架构决策表**：如 `aws-containers` 的「需求 → 推荐服务 → 关键 CLI/CDK」——简单 HTTP 应用推 ECS Express Mode，其余推 Fargate，**没点名 Kubernetes 绝不推 EKS**
- **服务对比 / 选型**：`aws-database` 用「子技能 registry」把任务路由到具体服务技能，覆盖关系型/键值/文档/宽列/图/时序/内存 15+ 引擎
- **部署工作流**：`aws-deployment` = CodeConnections → CodeBuild → CodeDeploy，由 CodePipeline 编排；含跨账号三件套、CodeConnections PENDING 陷阱等 Critical Warning
- **排障**：`debugging-lambda-timeouts` 系统化查 配置 / CloudWatch 日志指标 / VPC / 冷启动 / 内存 / 下游依赖 → 产排序建议
- **按需加载**：技能发现即用，内部再按需读 `references/` 与知识卡（每次 2–3 张）
- **反模式**：别用训练知识答易变的 AWS 事实（STOP 护栏）、别沉默产出非法 Fargate CPU/内存组合、优先 IaC、资源名不用 em dash、秘密走 `resolve:secretsmanager` 不直接取值
- **Rules files**：项目级规则让 agent 先用 MCP Server、先发现技能、先查文档

## 技能内容的四种形态

Toolkit 的技能不是泛泛的 prompt，而是把 AWS 工程经验结构化成四类可执行内容。下面各挑代表性技能讲透。

### 一、架构决策表（decision table）——`aws-containers`

`aws-containers` 开头就是一张「服务选型总览表」，把「开发者需求」直接映射到「推荐服务 + 关键命令」：

| 开发者需求 | 推荐 | 关键 CLI / CDK |
| --- | --- | --- |
| 最简单的容器部署（HTTP 应用/API，新用户） | ECS Express Mode | `aws ecs create-express-gateway-service` |
| Web 应用 / worker / 批处理 / 定时任务 | ECS on Fargate | `ecsPatterns.ApplicationLoadBalancedFargateService` |
| GPU 工作负载 或 >16 vCPU | ECS on EC2 | CDK `ecs.Ec2Service` |
| SQS worker 按队列深度扩缩 | Fargate + SQS | `ecsPatterns.QueueProcessingFargateService` |
| 调试运行中的容器 | ECS Exec | `aws ecs execute-command --interactive` |

> 表尾还写死决策规则：「说『部署我的容器』但没点名服务时——简单 HTTP 推 ECS Express Mode，其余推 Fargate，**除非明确要 Kubernetes 否则绝不推 EKS**」。这就是把架构经验固化成 agent 能照做的护栏。

### 二、服务对比 / 路由矩阵——`aws-database`

`aws-database` 开头是一条硬护栏：**「STOP — 别用训练知识回答」**。它不直接答，而是把任意数据库任务对着「子技能 registry」路由：

| 子技能 | 触发 | 去哪 |
| --- | --- | --- |
| `select` 选型 | 「用哪个数据库」「帮我选」「我在做…」 | 选型后交给 `handoff` |
| `handoff` 服务交接 | 点名了具体服务 + 操作问题 | 加载该服务技能 |
| `report-issue` | 「你选错了」「这不对」 | 路由到报告，不辩护 |

再配一张「服务 → 知识卡 → 交接技能」表，覆盖 Aurora（DSQL/MySQL/PG）、RDS（Oracle/SQL Server/Db2/MariaDB）、DynamoDB、DocumentDB、Keyspaces、Neptune、Timestream、ElastiCache、MemoryDB 等 **15+ 引擎**。**每次只加载 2–3 张相关知识卡**——这既是对比矩阵，也是按需加载的范例。

### 三、部署工作流——`aws-deployment`

`aws-deployment` 讲 CI/CD 的服务如何编排，并前置一串 **Critical Warning**：

| 层 | 服务 | 职责 |
| --- | --- | --- |
| Source | CodeConnections | 鉴权 GitHub/GitLab/Bitbucket，投递代码 |
| Packages | CodeArtifact | 私有包仓库、依赖缓存 |
| Build | CodeBuild | 编译、测试、打包 |
| Deploy | CodeDeploy | 部署到 EC2/ECS/Lambda，蓝绿/金丝雀/线性流量切换 |
| 编排 | CodePipeline | 串联各阶段、审批门 |

组合关系：**CodeConnections → CodeBuild → CodeDeploy，由 CodePipeline 编排**。技能还点破典型坑：CodeConnections 经 CLI/CFN 创建会一直 `PENDING`（必须去控制台完成 OAuth）、跨账号需 KMS + S3 + IAM 角色**三件缺一不可**、CodeBuild 在无 NAT 的 VPC 子网里会静默卡在 `DOWNLOAD_SOURCE`。

### 四、排障指南——`debugging-lambda-timeouts`

排障类技能给的是**系统化流程**而非零散提示。`debugging-lambda-timeouts` 按固定顺序收集：函数配置 → CloudWatch 指标与日志 → VPC/网络 → 冷启动模式 → 内存约束 → 下游依赖（有代码再审代码），最后编成**带优先级排序的排障报告**。同类还有 `troubleshooting-s3-files`、`troubleshooting-efs`、`troubleshooting-application-failures`。

## 两个插件专属技能族

除了核心/专项技能，两个插件带来独立技能族：

- **`aws-agents`（7 个）**：在 Bedrock **AgentCore** 上建 AI agent——`agents-get-started`（框架选型 Strands / LangGraph / GoogleADK / OpenAI Agents、脚手架、首次部署）、`agents-build`、`agents-connect`（Gateway + MCP）、`agents-deploy`、`agents-debug`、`agents-harden`（入站鉴权/IAM/限流/冷启动）、`agents-optimize`。用 `agentcore` CLI（`npm install -g @aws/agentcore`，需 Node 20+、CLI ≥0.9.0）。
- **`aws-agents-for-devsecops`（13 个）**：事件调查、发布就绪评审、UAT、漏洞扫描、渗透测试、威胁建模、修复——依赖 **AWS DevOps Agent** 与 **AWS Security Agent** 两个独立产品，装后需 `/aws-agents-for-devsecops:setup`。

## 按需加载（on-demand loading）

这是 Toolkit 的核心机制，分两层：

1. **技能层**：agent **发现并只检索**与当前任务相关的技能，不一次性装进上下文
2. **技能内部**：单个技能再把重内容拆进 `references/*.md` 与知识卡，用到才读——如 `aws-database` 每请求只读 2–3 张知识卡、`aws-deployment` 把 codebuild/codedeploy 等拆成独立参考文件

好处：上下文省、相关性高、facts 从「当前文档」而非「训练记忆」来。

## Rules files：给项目定规矩

`rules/aws-agent-rules.md` 是推荐放进项目的项目级规则，核心几条：

- **优先 AWS MCP Server**（沙箱执行、可观测、审计），没有再用 AWS CLI
- **动手前先查有没有相关技能**，用 `retrieve_skill` 加载并优先于训练知识
- **不确定就查文档**（API 参数、权限、限额、错误码），不能确认就明说
- **建基础设施优先 IaC**（CDK / CloudFormation）而非直接 CLI；遵 Well-Architected
- **资源名不用 em dash**，用连字符

## 反模式（技能刻意纠正的常见错误）

- **别用训练知识答易变的 AWS 事实**：配额、GA 状态、限额、错误码要查知识卡/文档，「我不确定，去查文档」好过自信的错答
- **别沉默产出非法 Fargate CPU/内存组合**：`aws-containers` 要求发现非法组合时告知用户并推荐最近的合法值，不许静默生成非法 task definition
- **别把 Fargate 设成 `bridge`/`host` 网络**：Fargate 必须 `awsvpc`
- **别混淆 executionRole 与 taskRole**：拉镜像/取秘密/写日志用前者，应用代码调 API 用后者
- **秘密不要直接取值**：先加载 `aws-secrets-manager` 技能，**不要**直接调 `get-secret-value`，用运行时解析引用（下例放在围栏内以免被当模板插值）：

```text
{{resolve:secretsmanager:secret-id:SecretString:json-key}}
```

- **别绕过审批与门禁**：CodeConnections 的 `UseConnection` 过于宽松，要用条件键限制到具体仓库/分支

## 与相邻叶的边界

- **本叶 = AWS 官方 Toolkit**（Plugins/Skills/Rules/MCP Server 四位一体）；社区 [awslabs](https://github.com/awslabs) 的 MCP/skills 是其前身，仍并存
- **Plugins 目前限 Claude Code/Codex/Cursor**；Kiro 与其它 agent 走 MCP Server + `npx skills add` 手动路径

## 下一步

- [参考](./reference) —— 技能库分组清单、4 插件、安装矩阵、AWS MCP Server、许可与链接
- 上游：[用户指南](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/) · [AWS MCP Server 工具参考](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/understanding-mcp-server-tools.html)
