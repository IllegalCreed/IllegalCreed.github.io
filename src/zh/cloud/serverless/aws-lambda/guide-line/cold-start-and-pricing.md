---
layout: doc
outline: [2, 3]
---

# 冷启动、SnapStart 与定价

> 基于 AWS Lambda · 核于 2026-08

## 速查

- **冷启动**：Lambda 不常驻，首次调用或扩容时启动新实例——下载代码、起微 VM、起运行时、加载依赖（require/import）、跑 init。常**数百毫秒到数秒**。
- **最大头是加载依赖**：`require`/`import` 整棵依赖树耗时最长，`node_modules` 越大冷启动越久。
- **语言差异**：Java 最慢（JVM 启动 + 类加载，1-10s）；Node/Python 较快（几百 ms-1s）；Go/Rust（编译型二进制）最快（百毫秒级）。
- **执行环境复用（Warm）**：处理完一个请求的实例**可能被复用**处理后续请求（warm 状态）——此时全局变量、DB 连接可复用。但**不保证**（可能回收或换实例）。
- **SnapStart（Java）**：发布版本时 AWS 跑完 init 存**内存快照**，调用时**恢复快照**跳过 init——冷启动从 1-10s 降到 **~200ms**。
- **SnapStart 坑**：①快照恢复后网络连接失效要重连；②单例/随机/时间来自快照要 refresh；③只在 Version 级别启用。
- **Provisioned Concurrency**：预置热实例常驻待命，**零冷启动**，但要**持续付费**（即使没请求）。延迟敏感场景的终极方案。
- **按执行计费**：请求数 + 执行时长（**墙钟**）× 内存配置。$0.20/百万请求 + $0.0000166667/GB-秒。
- **墙钟计费 vs CPU-time**：Lambda 等待 I/O 也计费；Workers 只计 CPU 时间。等待密集型场景 Workers 更便宜。
- **内存 128MB-10GB**：CPU 随内存线性分配。配大内存执行更快但单价更高，要找**总成本最低点**（往往配大一点反而便宜——执行快了）。
- **15 分钟上限**：单次执行最长 15 分钟，超时终止。

## 一、冷启动的完整时序

冷启动是一个**多阶段过程**，理解每阶段才能针对性优化：

```
请求到达（无 warm 实例）
  │
  ├─ 1. 下载/加载函数代码 + 镜像     几十-几百 ms（代码越大越久）
  │
  ├─ 2. 启动 Firecracker 微 VM       ~125 ms（AWS 优化，固定）
  │
  ├─ 3. 启动运行时（Node/Python/JVM） ~100-数百 ms（JVM 最慢）
  │
  ├─ 4. 加载依赖（require/import）   几百 ms-数秒 ★ 最大头
  │
  ├─ 5. 执行 init 代码（顶层/全局）   视代码（DB 连接、客户端初始化）
  │
  └─ 6. 执行 handler(event, context)  业务时间 ★ 用户感知的延迟
```

- **Init vs Handler**：第 1-5 步是 **Init 阶段**（冷启动），第 6 步是 **Invoke 阶段**（实际处理）。**Init 只在冷启动跑一次**，warm 实例跳过 1-5。
- **优化原则**：①**减小包体积**（瘦打包、tree-shaking、避免整包 `aws-sdk`）；②**懒加载**（把重依赖放在 handler 内按需加载，而非顶层）；③**复用 warm**（init 里建 DB 连接，handler 复用）。

## 二、执行环境复用（Warm 实例）

Lambda 处理完一个请求的实例**可能被 AWS 保留复用**处理后续请求：

```ts
// init 阶段（冷启动时跑一次）
const db = createDbConnection(); // 复用，不要每次 handler 内重建

export const handler = async (event) => {
  // warm 实例：db 已就绪，直接用
  return await db.query(event.id);
};
```

- **复用规则**：AWS 不保证复用——实例可能在请求间隔被回收，或在另一台机器起 warm 实例。**不要依赖全局变量做跨请求状态**（要用 DynamoDB/ElastiCache）。
- **正确姿势**：把**重资源**（DB 连接、HTTP 客户端、SDK）放在 handler 外（init 阶段），让 warm 实例复用——这是降低冷启动影响的关键。
- **错误姿势**：每个 handler 内重建 DB 连接——warm 时也每次建连，慢且耗资源。

## 三、SnapStart：快照恢复

**SnapStart** 把 Java 的冷启动从秒级压到 ~200ms，原理是**用空间换时间**：

```
发布版本 V1（启用 SnapStart）
  → AWS 起一个实例，跑完 Init 阶段（JVM 启动 + 类加载 + 静态初始化）
  → 把内存快照 snapshot 存到 Firecracker
调用时：
  → 直接从 snapshot 恢复（restore，~100-200ms）
  → 跳过整个 Init 阶段
  → 直接进 Invoke 执行 handler
```

- **为什么只 Java**：Java 冷启动最痛（JVM 重），收益最大。Node/Python 本就快（< 1s），没必要。
- **三个坑**：
  1. **网络连接失效**：快照里保留了旧 socket fd，恢复后已失效——要在 `RuntimeTools` 的 hook 里重连（如 `SnapStart` 的 `beforeRestore`）。
  2. **单例/随机/时间来自快照**：所有从快照恢复的实例共享同一 `Random` 种子、同一 `System.currentTimeMillis` 缓存——要用 `refresh` 重新初始化，否则会产生重复的随机数/相同的时间戳。
  3. **Version 级别**：SnapStart 在 Version 上启用，发布新版本才生成新快照；`$LATEST` 不算。

## 四、Provisioned Concurrency：常驻热实例

当 SnapStart 还不够（要 Node/Python 也零冷启动），用 **Provisioned Concurrency**：

- **预置并发**：你指定"N 个实例常驻 warm"，AWS 保证这 N 个实例永远热（随时可接请求，零冷启动）。
- **代价**：要**持续付费**（按预置量 × 时长，即使没请求）。本质是"为降低冷启动付固定费"——把 Serverless 退化成"常驻但有弹性"。
- **适合**：延迟敏感的关键路径（登录、支付、首页），少量常驻 + 突发用普通并发。

## 五、计费模型与陷阱

```
月账单 = 请求数 × $0.20/百万
       + Σ(执行时长秒 × 内存GB × $0.0000166667/GB-秒)
       + Provisioned Concurrency 费用（如启用）
```

- **举例**：128MB 函数，平均 100ms/次，100 万次/月 → 100 万 × 0.1s × 0.125GB × $0.0000166667 ≈ **$0.21** + 100 万请求 × $0.20/百万 = $0.20 → 共 **$0.41**。
- **永久免费额度**：每月前 100 万请求 + 40 万 GB-秒免费。小流量几乎零成本。
- **陷阱**：
  1. **墙钟计费**：`await fetch` 等待也算时长（对比 Workers 按 CPU 时间，等待不计）。等待密集型场景 Workers 更便宜。
  2. **内存配大就贵但可能更省**：128MB 执行 2s vs 512MB 执行 0.5s——后者内存贵 4 倍但执行快 4 倍，总 GB-秒相同，**但 0.5s 的体验好得多**。要找最低总成本点。
  3. **高并发突发**：默认 1000 并发上限，超出被限流（返回 429）。要提前找 AWS 提配额。
  4. **空闲调用也计费**：EventBridge 定时触发、CloudWatch Alarm 等会"自己调用自己"，产生隐性计费。
  5. **Provisioned Concurrency 持续计费**：哪怕没流量，预置的 N 个实例也按时间计费——低流量时反而比普通 Lambda 贵。

## 六、何时选 Lambda vs Workers vs 容器

| 场景 | 选谁 | 原因 |
| --- | --- | --- |
| AWS 事件处理（S3/SQS/EventBridge） | **Lambda** | 原生触发器，零运维 |
| BFF（聚合后端、SSR） | Lambda/Workers | 都行；Lambda 生态深、Workers 边缘快 |
| 全球低延迟鉴权/代理 | **Workers** | 边缘 + 无冷启动 |
| 重计算/长任务（>15min） | **Fargate/EC2** | Lambda 15 分钟上限 |
| 长连接/WebSocket | **Fargate/EC2** | Lambda 无常驻 |
| 多语言（Java/Go） | **Lambda** | Workers 只 JS/WASM |

## 下一步

冷启动、SnapStart、定价讲完后，回到[参考](../reference)查阅运行时对比、触发器矩阵、计费表与易错点清单。
