---
layout: doc
outline: [2, 3]
---

# 集成生态：Grafana、CI 与 JMeter 深度对比

> 基于 k6 0.50+ · 核于 2026-08

## 速查

- **Grafana Labs 生态**：k6 属 Grafana Labs（与 Grafana、Prometheus、Loki 同家族），结果可直推 Grafana Cloud / Prometheus，用预置看板可视化 P95/P99/错误率随时间变化。
- **结果输出**：k6 原生输出终端实时数据 + JSON/CSV 文件；`--out` 参数可推 Prometheus（`--out experimental-prometheus-rw`）或 Grafana Cloud / k6 Cloud。
- **CI/CD 集成**：`k6 run` 挂进 GitHub Actions / GitLab CI，部署后跑 smoke 负载测试，靠 thresholds 的退出码做性能门禁，退化即阻断发布。
- **分布式压测**：单机够用至上万 VU；海量并发用 **k6 Operator**（K8s 自定义资源，多 Pod 分发 VU）或 **k6 Cloud**（Grafana 托管，一键多地域）。
- **k6 扩展（xk6）**：用 xk6 编译定制 k6 二进制，加非内置能力（Kafka/Redis/SQL 客户端、自定义指标）。
- **与 JMeter 核心差异**：①k6 脚本即代码 vs JMeter GUI/XML 配置 ②k6 Go 核心 + VU 轻量 vs JMeter JVM + 一用户一线程 ③k6 开发者/CI 友好 vs JMeter QA 专员/GUI 主导 ④k6 结果接 Grafana vs JMeter 内置 HTML 报告。
- **何时选 JMeter**：已有大量 JMeter 资产、团队无人会 JS、需要 JMeter 特定协议插件（如遗留协议）——其余场景 k6 更现代。

## 一、Grafana Labs 生态协同

k6 是 Grafana Labs 家族成员，与可观测性栈天然集成：

```
k6 跑压测 ──(结果指标)──> Prometheus ──(查询)──> Grafana 看板
                                      (P95/P99/错误率随时间曲线)
```

- **推 Prometheus**：`k6 run --out experimental-prometheus-rw=url script.js`，把指标实时写 Prometheus 远端存储。
- **Grafana 预置看板**：Grafana Labs 提供官方 k6 看板模板，导入即用，展示 http_req_duration 分位数、错误率、VU 数随时间变化。
- **k6 Cloud**：Grafana 托管的 k6，无需自建分布式，一键多地域发起海量并发，结果在云端看板。

> 同栈的好处：压测结果与日常监控（Prometheus + Grafana）同一套数据，对比「压测时」与「线上真实流量」一目了然。

## 二、CI/CD 集成做性能门禁

```yaml
# .github/workflows/perf.yml（GitHub Actions 示例）
name: 性能门禁
on: [deployment_status]
jobs:
  k6:
    if: ${{ github.event.deployment_status.state == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/load/smoke.js
          flags: '--env API_URL=$API_URL'
```

- **部署后触发**：部署到 staging 成功后，自动跑 smoke 负载测试。
- **阈值阻断**：smoke 脚本里 thresholds 不达标 → `k6 run` 退出码非零 → CI job 失败 → 阻断/告警。
- **性能回归捕捉**：新代码让 P95 退化，threshold 立刻红灯，避免性能问题流入生产。

## 三、分布式压测

单机 k6 能扛上万 VU（Go 核心轻量），但十万级以上要用分布式：

| 方案 | 说明 | 适合 |
| --- | --- | --- |
| **单机 k6** | 一台机器跑 | 上万 VU 以内，开发/CI 冒烟 |
| **k6 Operator（K8s）** | 自定义资源，多 Pod 分发 VU | 已有 K8s，自建分布式 |
| **k6 Cloud** | Grafana 托管，多地域一键发起 | 海量并发 + 多地域，省心付费 |

- **k6 Operator**：在 K8s 集群定义 `K6` 自定义资源，Operator 自动起多个 Pod，每 Pod 跑部分 VU，结果汇总——自建分布式的标准方式。
- **k6 Cloud**：不想自建就上 Cloud，按量付费，多地域发起模拟全球用户。

## 四、k6 扩展（xk6）

k6 核心只内置常用能力（HTTP/WebSocket/指标），特殊需求用 xk6 编译定制二进制：

```bash
# 用 xk6 编译带 Kafka 客户端的 k6
xk6 build --with github.com/mostafa/xk6-kafka@latest
```

- **常见扩展**：xk6-kafka（压 Kafka）、xk6-redis、xk6-sql（直连数据库）、xk6-browser（驱动浏览器，端到端压测）。
- **自定义指标**：用 xk6 加业务指标（如「订单创建成功率」），纳入 thresholds。
- **局限**：xk6 编译的是定制二进制，CI 里要维护这个二进制；k6 团队正把更多扩展官方化。

## 五、与 JMeter 深度对比

| 维度 | k6 | JMeter |
| --- | --- | --- |
| **配置方式** | JS 脚本（代码） | GUI / XML（配置） |
| **实现** | Go 核心 + JS 脚本 | Java（JVM） |
| **用户模型** | VU（轻量，单机数万） | 线程（一用户一线程，重） |
| **资源占用** | 低（单机 65k VU 实测可行） | 高（JVM 线程开销，单机千级线程） |
| **主导角色** | 开发者 | QA 专员 |
| **CI 友好** | ✅ CLI 原生、脚本进 Git | 🟡 GUI 为主，CLI 有但要配 XML |
| **报告** | 终端 + JSON，推 Grafana/Prometheus | 内置 HTML/CSV 报告（GUI 生成） |
| **分布式** | k6 Operator / k6 Cloud | JMeter 分布式（多机主从） |
| **协议覆盖** | HTTP/WS/gRPC + xk6 扩展 | 内置极多协议插件（含遗留） |
| **学习曲线** | 会 JS 即可，开发者友好 | GUI 配置繁琐，QA 专员培训 |

**何时仍选 JMeter**：①已有大量 JMeter 测试计划资产，迁移成本高 ②团队无人会 JS，但有熟练 JMeter 的 QA ③需要 JMeter 特定的遗留协议插件（如某些老旧中间件）④合规要求只能用特定工具。**其余场景 k6 更现代、更开发者友好、更 CI 友好**。

## 六、迁移提示（JMeter → k6）

- JMeter 的 Test Plan（XML）→ 用工具（如 jmeter-to-k6）辅助转成 k6 JS 脚本，但通常需手工调整。
- JMeter 的 Thread Group → k6 的 `options.vus` + `options.stages`。
- JMeter 的 Assertions → k6 的 `check()`。
- JMeter 的 Listeners（HTML 报告）→ k6 推 Grafana/Prometheus。

## 下一步

集成跑通后，回头查[参考](../reference) 的命令速查、脚本模板、阈值清单与易错点。
