---
layout: doc
outline: [2, 3]
---

# 入门：事件驱动、冷启动与按执行计费

> 基于 AWS Lambda · 核于 2026-08

## 速查

- **Lambda 定位**：AWS 的**事件驱动 Serverless 计算服务**，写 handler + 配触发器，事件到达时自动执行，按执行次数 + 时长计费，无需预置服务器。
- **运行时 = Firecracker 微 VM**：每个函数实例跑在 AWS 自研的 **Firecracker**（轻量级虚拟机，专为 Serverless 设计）里，**完整 Linux 环境**，支持原生模块/任意二进制，多语言（Node/Python/Java/Go/.NET/Rust）。
- **事件驱动**：Lambda 不常驻，靠**触发器**唤起——API Gateway（HTTP）、S3（对象上传/删除）、SQS（队列消息）、EventBridge（事件总线）、DynamoDB Streams（数据变更）、CloudWatch Events（定时 Cron）。
- **冷启动**：首次调用或扩容时，要拉镜像、起微 VM、跑 init 代码——常 **数百毫秒到数秒**（Java 最慢）。延迟敏感场景用 **SnapStart**（Java）/ **Provisioned Concurrency**（预置并发）缓解。
- **SnapStart**：Java 专用优化。发布函数时先跑完 init，把内存快照存下；调用时直接**恢复快照**（跳过 init），冷启动从 1-10s 降到 **~200ms**。
- **BFF 模式**：Lambda + API Gateway 是经典的 Backend-for-Frontend 实现——一个前端（Web/iOS/Android）一个专属后端聚合函数，屏蔽下游微服务。
- **按执行计费**：**请求数 + 执行时长（墙钟）× 内存配置**。空闲不计费是 Serverless 核心卖点。128MB 内存约 $0.0000002083/100ms。
- **15 分钟上限**：单次执行最长 **15 分钟**，超时即终止。长任务要拆分（Step Functions）或换 Fargate/EC2。
- **内存可选**：128MB - 10GB，CPU 随内存线性分配（内存越大 CPU 越强）。
- **编排三件套**：EventBridge（事件总线）/ SQS（队列削峰）/ Step Functions（状态机编排多 Lambda）。
- **进阶顺序**：[事件驱动与触发器](./guide-line/event-driven) → [冷启动、SnapStart 与定价](./guide-line/cold-start-and-pricing) → [参考](./reference)。

## 一、Lambda 是什么：事件驱动的 Serverless

Serverless 的核心承诺是"**只写业务代码，不管服务器**"。Lambda 把这个承诺落地为三件事：

1. **函数即单元**：你写一个 `handler(event, context)`，处理一个事件（HTTP 请求、S3 上传、消息），返回结果。不用写 main、不用监听端口。
2. **触发器唤起**：Lambda 函数本身不常驻，而是由**触发器**在事件到来时唤起——你配置"这个函数由 API Gateway 触发"或"S3 上传触发"，AWS 自动接线。
3. **按执行计费**：函数没被调用就**不计费**（零成本空闲）；被调用才按次数 + 时长计费。

```
传统服务器                         AWS Lambda
┌──────────────────────┐          事件到达（S3 上传）
│ 常驻进程，监听端口     │           │
│ 空闲也占机器也计费     │           ▼
│ 要自己扩缩容          │      Lambda 自动起一个实例
└──────────────────────┘           │ 执行 handler
                                   │ 返回结果
                                   ▼
                              实例可被复用/回收，空闲不计费
```

- **谁该用**：①事件驱动的后端处理（图片上传后压缩、订单后异步通知）；②HTTP API（配合 API Gateway，按请求扩缩）；③定时任务（Cron）；④BFF 聚合层。不适合：长连接/WebSocket、常驻服务、超低延迟（冷启动）。

## 二、运行时：Firecracker 微 VM

Lambda 的每个函数实例跑在 **Firecracker**——AWS 为 Serverless 自研的轻量级虚拟机：

- **为什么是微 VM 而不是容器**：AWS 要兼顾**强隔离**（多租户安全，KVM 级硬件虚拟化）与**低开销**（Firecracker 用 Rust 写，启动 ~125ms，内存占用极小）。比传统 QEMU/KVM 快，比纯容器隔离强。
- **完整 Linux 环境**：因为是 VM，Lambda 跑的是**完整 Linux**——可以加载原生模块（.so）、跑任意二进制、用任意语言（甚至自定义 runtime）。
- **对比 Workers isolate**：Workers 用 V8 isolate（进程内隔离，无 OS 层），冷启动快但**运行时受限**（无 fs/原生模块）；Lambda 用微 VM（OS 级隔离，完整环境），冷启动重但**能力完整**。

## 三、冷启动：Serverless 的老大难

Lambda 不常驻，所以**首次调用**或**扩容**时要启动新实例——这就是**冷启动**：

| 阶段 | 耗时 | 说明 |
| --- | --- | --- |
| 下载/加载代码与镜像 | 几十-几百 ms | 函数代码越大越久 |
| 起微 VM + 运行时 | ~100-200ms | Firecracker 启动 + Node/Python 解释器起来 |
| 加载依赖（require/import） | 几百 ms-数秒 | `node_modules` 越大越久，**最大头** |
| 执行 init 代码（顶层/初始化） | 视代码 | DB 连接、全局对象初始化 |
| 执行 handler | 业务时间 | 真正处理请求 |

- **语言差异**：Java 冷启动最慢（JVM 启动 + 类加载常 1-10s）；Node/Python 较快（几百 ms）；Go/Rust（编译型）最快。
- **影响**：延迟敏感场景（登录、首页）首请求体验差；后台批处理不在意。
- **缓解**：①**SnapStart**（Java，恢复快照，~200ms）；②**Provisioned Concurrency**（预置并发，常驻热实例，但要持续付费）。

## 四、SnapStart：Java 冷启动的救星

**SnapStart** 是 Lambda 对 Java 冷启动的专项优化（2021 re:Invent 发布）：

```
发布函数版本（snapstart: PublishedVersions）
  → AWS 跑一次 init（启动 JVM、加载类、建 DB 连接池）
  → 把内存快照（snapshot）存下
调用时：
  → 直接从快照恢复（restore）→ 跳过 init
  → 冷启动从 1-10s 降到 ~200ms
```

- **为什么只 Java**：Java 冷启动最痛（JVM 重），收益最大；Node/Python 本就快，没必要。
- **代价/坑**：①快照恢复后，**网络连接要重连**（旧 socket 失效）；②单例/全局状态来自快照，**不要依赖恢复后的时间戳/随机种子**（要 refresh）；③只在版本（Version）级别启用，发布新版本才生成新快照。

## 五、按执行计费

Lambda 计费 = **请求数** + **执行时长（墙钟）× 内存配置**：

| 项 | 价格 |
| --- | --- |
| 请求数 | $0.20 / 百万次（前 100 万/月免费） |
| 计算时长 | $0.0000166667 / GB-秒（按内存×时长） |

- **举例**：128MB 函数，平均 100ms/次，100 万次/月 → 100 万 × 0.1s × 0.125GB × $0.0000166667 ≈ **$0.21**。极便宜。
- **空闲零成本**：没人调用就 $0。这是 Serverless 对低流量/突发流量的最大价值。
- **陷阱**：①**墙钟计费**——`await` 等待也算时长（对比 Workers 按 CPU 时间，等待不计）；②**内存配大就贵**——内存翻倍时长单价也翻倍，但 CPU 也更强（执行更快），要找平衡点；③**高并发突发**——超出并发限额会被限流（默认 1000 并发），要提前申请。

## 六、Lambda vs Workers：一句话区分

| 维度 | AWS Lambda | Cloudflare Workers |
| --- | --- | --- |
| 运行时 | **Firecracker 微 VM**（容器化） | **V8 isolates**（无容器） |
| 冷启动 | 数百 ms-秒级（SnapStart ~200ms） | **~5ms**（近乎无） |
| 部署 | **单区域** | **330+ 城市边缘** |
| 计费 | 请求数 + **执行时长**（墙钟） | 请求数 + **CPU 时间** |
| 语言 | Node/Python/Java/Go/.NET/Rust | JS/TS（+WASM） |
| 适合 | 事件处理/BFF/重计算/长任务 | 边缘鉴权/代理/低延迟 |

## 下一步

理解了事件驱动、冷启动与计费后，下一步深入两个机制——[事件驱动与触发器](./guide-line/event-driven)（触发器全景、事件源映射、BFF）与[冷启动、SnapStart 与定价](./guide-line/cold-start-and-pricing)（冷启动机制、SnapStart 原理、计费陷阱）。
