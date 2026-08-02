---
layout: doc
outline: [2, 3]
---

# 事件驱动与触发器：Lambda 如何被唤起

> 基于 AWS Lambda · 核于 2026-08

## 速查

- **事件驱动**：Lambda 不常驻，由**触发器（Trigger）**在事件到来时唤起。触发器决定"什么时候调、传什么事件"。
- **同步触发器**：调用方**等待**返回——**API Gateway / ALB**（HTTP）、**Lambda 直接 Invoke**（同步）、**Step Functions**（任务）。适合请求-响应模型。
- **异步触发器**：调用方**不等**，事件入队列，Lambda 处理失败可重试——**S3 / SNS / EventBridge 自定义/CloudWatch Alarm**。适合通知、Webhook。
- **流/队列触发器（事件源映射）**：Lambda **轮询**数据源拉取——**SQS**（队列）、**DynamoDB Streams / Kinesis**（流）。批量处理、削峰。
- **定时触发器**：**EventBridge Scheduler / CloudWatch Events Cron**——定时唤起，做 Cron 任务。
- **事件源映射（Event Source Mapping）**：Lambda 主动轮询 SQS/Kinesis/DynamoDB Streams 的机制——Lambda 维护一个内部 poller，批量拉取消息调 handler。
- **BFF 模式**：Lambda + API Gateway 实现 Backend-for-Frontend——一个前端一个专属后端聚合函数，屏蔽下游微服务，适配前端需求。
- **EventBridge**：AWS 的**事件总线**——服务（S3/DynamoDB/自定义应用）发事件到总线，规则路由到 Lambda/Step Functions/SQS。是事件驱动架构（EDA）的中枢。
- **SQS**：AWS 的托管消息队列——削峰、解耦。Lambda 作为消费者自动扩并发拉取。
- **Step Functions**：**状态机**编排多个 Lambda——串行/并行/分支/重试/补偿。适合长流程（订单、ETL）。
- **IAM 权限**：Lambda 的执行角色（Execution Role）决定它能访问哪些 AWS 资源（S3 读写、DynamoDB 查询）——最小权限原则。

## 一、触发器全景：四类模型

Lambda 的触发器按"调用方式"分四类：

| 类型 | 代表触发器 | 调用方行为 | 失败处理 | 适合 |
| --- | --- | --- | --- | --- |
| **同步** | API Gateway、ALB、Invoke | 等待返回 | 调用方处理错误 | HTTP API、请求-响应 |
| **异步** | S3、SNS、EventBridge 自定义、CloudWatch Alarm | 不等，入内部队列 | 自动重试 2 次 + DLQ | 通知、Webhook、副作用 |
| **流/队列（事件源映射）** | SQS、DynamoDB Streams、Kinesis | Lambda 轮询拉取 | 批次失败重试 + DLQ | 削峰、批量、数据流 |
| **定时** | EventBridge Scheduler、CloudWatch Cron | 定时唤起 | 失败即结束 | Cron 任务、定期清理 |

```ts
// 同步触发器（API Gateway）—— handler 接收 HTTP 请求
export const handler = async (event) => {
  const name = event.queryStringParameters?.name;
  return { statusCode: 200, body: JSON.stringify({ hi: name }) };
};
```

- **同步**：API Gateway 把 HTTP 请求映射成 event 传给 Lambda，Lambda 返回响应，API Gateway 转成 HTTP 响应给客户端。**客户端等 Lambda 执行完**——冷启动延迟直接暴露给用户。
- **异步**：S3 上传一个文件，发事件到 Lambda 的内部队列就返回（不等 Lambda）。Lambda 异步处理，失败自动重试 2 次，还失败进死信队列（DLQ）。
- **事件源映射**：你配置 Lambda 关联一个 SQS 队列，AWS 在 Lambda 与 SQS 之间起一个 **poller**，自动按队列消息量扩并发，批量（如 10 条）调 handler。这是**削峰**的关键——突发流量堆在 SQS，Lambda 按配额消费。

## 二、BFF 模式：Lambda + API Gateway

**BFF（Backend for Frontend）** 模式：为每个前端（Web、iOS、Android）建一个**专属后端**，聚合下游多个微服务，返回前端恰好需要的数据形状。Lambda + API Gateway 是 BFF 的经典实现：

```
   Web 前端 ─┐
   iOS ──────┼─→ API Gateway ─→ Lambda(BFF-Web)  ─┬─→ 用户服务
   Android ──┘                  Lambda(BFF-Mobile)─┼─→ 订单服务
                                                   └─→ 推荐服务
```

- **为什么 Lambda 适合 BFF**：①不同前端 BFF 独立部署、独立扩缩；②低流量时零成本（空闲不计费）；③按请求自动扩缩，应对前端突发。
- **典型实现**：API Gateway 做 HTTP 路由 + 鉴权，Lambda 内用 `Promise.all` 并发聚合多个下游服务，做字段裁剪/形状重组后返回。
- **坑**：冷启动——BFF 常是延迟敏感（首屏），要靠 Provisioned Concurrency 或减小依赖（瘦打包）缓解。

## 三、EventBridge：事件总线

**EventBridge** 是 AWS 的**事件总线（Event Bus）**——服务发事件到总线，规则匹配后路由到目标（Lambda/Step Functions/SQS）：

```
S3 上传 ─┐
DynamoDB 变更 ─┼─→ EventBridge 总线 ─→ 规则匹配 ─→ 目标 Lambda
自定义应用 ──┘                                    ─→ Step Functions
                                                  ─→ SQS
```

- **为什么用 EventBridge**：①**解耦**——生产者发事件，不关心谁消费；②**规则路由**——按事件内容（source/detail-type/detail 字段）匹配分发；③**Schema Registry**——自动发现事件结构，生成代码类型。
- **EventBridge vs SNS**：SNS 是简单的 pub/sub 通知（fan-out）；EventBridge 在 SNS 之上加**规则匹配 + Schema + 多总线隔离**，更适合复杂事件驱动架构（EDA）。
- **典型用途**：①订单完成 → 发事件 → 库存/通知/分析各自消费；②跨服务事件编排（用 EventBridge + Step Functions）。

## 四、SQS + Step Functions：削峰与编排

- **SQS 削峰**：突发请求堆在 SQS 队列，Lambda 作为消费者按配额（并发上限）批量拉取——保护下游不被冲垮。队列长度还能触发 Auto Scaling。
- **Step Functions 编排**：用 **ASL（Amazon States Language）** 写状态机，编排多个 Lambda——串行、并行、分支、错误重试、补偿事务。适合**长流程**（订单履约、ETL、审批流），单 Lambda 15 分钟上限的问题靠拆分解决。

```json
{
  "StartAt": "Validate",
  "States": {
    "Validate": { "Type": "Task", "Resource": "validate-lambda", "Next": "Charge" },
    "Charge":   { "Type": "Task", "Resource": "charge-lambda", "Retry": [{ "ErrorEquals": ["States.TaskFailed"], "MaxAttempts": 3 }], "End": true }
  }
}
```

## 五、IAM 权限：执行角色

Lambda 的**执行角色（Execution Role）**决定它能访问哪些 AWS 资源：

- **最小权限**：只授予函数实际需要的权限（如只读某个 S3 bucket、只查某张 DynamoDB 表）——不要用 `AdministratorAccess`。
- **资源策略 vs 执行角色**：执行角色是 Lambda **主动访问别人**（出方向）；资源策略是**别人能否调用 Lambda**（入方向，如允许 S3 触发）。

## 下一步

事件驱动与触发器讲完后，下一个核心是 [冷启动、SnapStart 与定价](./cold-start-and-pricing)——冷启动机制、SnapStart 快照原理、Provisioned Concurrency、计费模型与陷阱。
