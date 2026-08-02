---
layout: doc
outline: [2, 3]
---

# 参考：Lambda 运行时、触发器与计费速查

> 基于 AWS Lambda · 核于 2026-08

## 速查

- **Lambda 定位**：AWS 事件驱动 Serverless，Firecracker 微 VM，按执行次数 + 时长（墙钟）计费。
- **运行时**：Firecracker 微 VM，完整 Linux，支持 Node/Python/Java/Go/.NET/Rust + 原生模块。
- **冷启动**：数百 ms-秒级（Java 最慢），SnapStart（Java）降到 ~200ms；Provisioned Concurrency 零冷启动。
- **15 分钟上限**：单次执行最长 15 分钟；长任务拆 Step Functions 或换 Fargate。
- **触发器四类**：同步（API Gateway/ALB）、异步（S3/SNS/EventBridge）、流/队列（SQS/Kinesis/DynamoDB Streams）、定时（EventBridge Scheduler）。
- **计费**：$0.20/百万请求 + $0.0000166667/GB-秒；墙钟计费（等待也算）；永久免费额度 100 万请求 + 40 万 GB-秒/月。

## 一、Lambda vs Workers vs 容器

| 维度 | AWS Lambda | Cloudflare Workers | 容器（Fargate/EC2） |
| --- | --- | --- | --- |
| 运行时 | Firecracker 微 VM | V8 isolates | 完整 Linux 容器 |
| 冷启动 | 200ms-数秒（SnapStart ~200ms） | **~5ms** | 视实例，秒级 |
| 部署 | 单区域 | **330+ 城市边缘** | 单区域 |
| 计费 | 请求数 + **执行时长**（墙钟） | 请求数 + **CPU 时间** | 实例时长（常驻） |
| 请求上限 | 15 分钟 | 10ms-30s CPU | 无（常驻） |
| 语言 | Node/Python/Java/Go/.NET/Rust | JS/TS（+WASM） | 任意 |
| 原生模块 | ✅ | ❌ | ✅ |
| 适合 | 事件处理/BFF/重计算/长任务 | 边缘鉴权/代理/低延迟 | 长连接/有状态/重负载 |

## 二、触发器矩阵

| 触发器 | 类型 | 调用方 | 典型用途 |
| --- | --- | --- | --- |
| **API Gateway / ALB** | 同步 | 等待返回 | HTTP API、BFF |
| **Lambda Invoke（同步）** | 同步 | 等待返回 | 服务间调用 |
| **Step Functions Task** | 同步 | 等待返回 | 工作流步骤 |
| **S3（上传/删除）** | 异步 | 不等，入队列 | 图片压缩、日志处理 |
| **SNS** | 异步 | 不等 | 通知、fan-out |
| **EventBridge（自定义/服务）** | 异步 | 不等 | 事件驱动架构（EDA） |
| **CloudWatch Alarm** | 异步 | 不等 | 告警自动处理 |
| **SQS（事件源映射）** | 流/队列 | Lambda 轮询 | 削峰、批量 |
| **DynamoDB Streams / Kinesis** | 流/队列 | Lambda 轮询 | 数据变更处理、CDC |
| **EventBridge Scheduler / Cron** | 定时 | 定时唤起 | 定时任务、清理 |

## 三、计费速查

| 资源 | 价格 | 永久免费额度 |
| --- | --- | --- |
| 请求数 | $0.20 / 百万 | 100 万请求/月 |
| 计算时长 | $0.0000166667 / GB-秒 | 40 万 GB-秒/月 |
| Provisioned Concurrency | 按预置量 × 时长 | 无 |

**内存档位**：128MB / 256MB / 512MB / ... / 10GB（CPU 随内存线性分配）。

**举例**：128MB、100ms、100 万次/月 → 计算 ≈ $0.21 + 请求 ≈ $0.20 = **$0.41/月**。

## 四、冷启动优化速查

| 手段 | 适用 | 效果 | 代价 |
| --- | --- | --- | --- |
| **减小包体积**（瘦打包/tree-shaking） | 所有语言 | 降低 require 时间 | 无 |
| **懒加载重依赖** | 所有语言 | init 快 | 代码改动 |
| **复用 warm（init 建 DB 连接）** | 所有语言 | warm 跳过 init | 无 |
| **SnapStart** | Java | 1-10s → ~200ms | 快照坑（重连/refresh） |
| **Provisioned Concurrency** | 所有语言 | 零冷启动 | 持续付费 |

## 五、SnapStart 易错点

- **网络连接失效**：快照里的 socket fd 恢复后失效，要在恢复 hook 里**重连**。
- **随机/时间来自快照**：所有恢复实例共享同一 `Random` 种子和时间缓存，要 `refresh` 重新初始化，否则产生重复随机数/相同时间戳。
- **Version 级别**：SnapStart 在 Version 上启用，`$LATEST` 不算；发布新版本才生成新快照。
- **只支持 Java**：Node/Python 本就快，不需要 SnapStart。

## 六、handler 结构速查

```ts
// Node.js handler —— init 在 handler 外，warm 复用
const db = createConnection(); // ★ init 阶段，只冷启动时跑一次

export const handler = async (event, context) => {
  // warm 实例：db 已就绪
  const result = await db.query(event.id);
  return { statusCode: 200, body: JSON.stringify(result) };
};
```

## 七、易错点清单

- **"Lambda 是常驻服务"**：错。Lambda 不常驻，靠触发器唤起；空闲被回收。WebSocket/长连接不适合。
- **"冷启动只发生一次"**：错。每次扩容（新实例）都冷启动；并发突增会触发多次冷启动。
- **"全局变量能跨请求持久化"**：错。warm 实例可能复用全局变量，但不保证（可能回收）。状态用 DynamoDB/ElastiCache。
- **"计费按 CPU 时间"**：错。Lambda 按**执行时长（墙钟）**计费，I/O 等待也算；Workers 才按 CPU 时间。
- **"内存配越小越省钱"**：不一定。内存小执行慢，总 GB-秒可能更高；要找总成本最低点。
- **"15 分钟够所有任务"**：错。长任务超时终止，要拆 Step Functions 或换 Fargate。
- **"SnapStart 支持所有语言"**：错。SnapStart 只支持 Java（Java 冷启动最痛）。
- **"SnapStart 恢复后网络连接还能用"**：错。快照里的 socket 失效，要重连。
- **"异步触发器会重试到成功"**：部分错。异步默认重试 2 次，还失败进 DLQ；要确保幂等。
- **"Provisioned Concurrency 空闲不计费"**：错。预置的实例**持续计费**，即使没请求。

## 权威链接

- [AWS Lambda 官方文档](https://docs.aws.amazon.com/lambda/)
- [Lambda SnapStart](https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html)
- [Lambda 定价](https://aws.amazon.com/lambda/pricing/)
- [EventBridge 文档](https://docs.aws.amazon.com/eventbridge/)
- [Step Functions 文档](https://docs.aws.amazon.com/step-functions/)
- [BFF 模式 - AWS 架构博客](https://aws.amazon.com/blogs/)
- 本站幻灯片：<a href="/SlideStack/aws-lambda-slide/" target="_blank">AWS Lambda</a>
