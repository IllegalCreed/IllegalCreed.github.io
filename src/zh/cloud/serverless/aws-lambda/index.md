---
layout: doc
---

# AWS Lambda

**AWS Lambda** 是 AWS 推出的**事件驱动 Serverless 计算服务**——开发者写一个函数（handler），配置触发器（S3 上传、API Gateway HTTP、SQS 消息、定时器），AWS 在事件到来时**自动分配计算资源执行**，按**实际执行次数 + 时长**计费，无需预置服务器。它是 Serverless 概念的开创者（2014 re:Invent 发布），至今仍是公有云 Serverless 的事实标杆。本叶是 Serverless 与边缘计算章的第二叶，与第一叶 Cloudflare Workers 形成对照——Lambda 走"**容器/微 VM + 区域 + 事件驱动**"路线，Workers 走"**V8 isolate + 边缘 + 请求驱动**"路线。

Lambda 的全部考点围绕**"事件驱动 + 冷启动 + 按执行计费"**展开：①**运行时模型**——每个函数在一个 **Firecracker 微 VM**（轻量容器化）里跑，支持 Node/Python/Java/Go/.NET/Rust 多语言，**首次调用有冷启动**（拉镜像、起进程、跑 init）；②**事件驱动**——Lambda 不常驻，靠**触发器**（API Gateway、S3、SQS、EventBridge、DynamoDB Streams、CloudWatch 定时器）在事件到达时唤起；③**SnapStart 冷启动优化**——Java 专用，把 init 后的内存快照恢复，冷启动从秒级降到 ~200ms；④**BFF 模式**——Lambda + API Gateway 是经典的 Backend-for-Frontend 实现，每个前端一个专属后端聚合函数；⑤**编排生态**——EventBridge（事件总线）、SQS（队列削峰）、Step Functions（状态机编排多 Lambda），构建复杂工作流；⑥**按执行计费**——请求数 + 执行时长（墙钟）× 内存配置，**空闲不计费**是 Serverless 的核心卖点。后续两叶分别深入"事件驱动与触发器"和"冷启动、SnapStart 与定价"。

## 评价

**优点**

- **零运维 + 弹性伸缩**：无需管理服务器，从 0 到上万并发自动扩缩，按实际用量付费，空闲零成本
- **AWS 生态深度集成**：与 S3/DynamoDB/SQS/EventBridge/API Gateway 等几十种服务原生打通，触发器/权限（IAM）开箱即用
- **多语言支持**：Node/Python/Java/Go/.NET/Rust 原生支持，可跑原生模块与任意 Linux 二进制（完整容器环境）
- **长任务友好**：单次执行最长 15 分钟，CPU/内存可选（128MB-10GB），适合中等计算任务

**缺点**

- **冷启动延迟**：首次调用或扩容时拉镜像、起进程、跑 init，常数百毫秒到数秒（Java 尤甚），延迟敏感场景要靠 SnapStart/Provisioned Concurrency 缓解
- **单区域部署**：默认部署在单一 region，全球用户要靠 CloudFront + Lambda@Edge/CloudFront Functions 或手动多区域复制
- **15 分钟上限**：长任务/常驻服务/WebSocket 不适合，要换 Fargate/EC2 或 EventBridge + 多 Lambda 拆分
- **计费按墙钟**：执行时长（含 I/O 等待）计费，等待密集型场景不如 Workers 的 CPU-time 模型便宜

## 本叶地图

- [入门](./getting-started) —— Lambda 定位、事件驱动、运行时、SnapStart、BFF、按执行计费、核心术语
- [事件驱动与触发器](./guide-line/event-driven) —— 触发器全景（API Gateway/S3/SQS/EventBridge/DynamoDB Streams）、事件源映射、BFF 模式
- [冷启动、SnapStart 与定价](./guide-line/cold-start-and-pricing) —— 冷启动机制、SnapStart 原理、Provisioned Concurrency、计费模型与陷阱
- [参考](./reference) —— 运行时对比、触发器矩阵、计费表、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/aws-lambda-slide/" target="_blank">AWS Lambda</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=AWS%20Lambda" target="_blank" rel="noopener noreferrer">AWS Lambda 测试题</a>
