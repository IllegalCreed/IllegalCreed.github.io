---
layout: doc
outline: [2, 3]
---

# 入门：k6 定义、开发者优先与三大抽象

> 基于 k6 0.50+ · 核于 2026-08

## 速查

- **k6 定义**：Grafana Labs 出品的**开发者优先负载测试工具**，用 JavaScript 写脚本，CLI 发起成百上千虚拟用户（VU）压测 HTTP/GraphQL/WebSocket，靠**阈值**判定成败。
- **核心定位**：把负载测试从「QA 专员用 GUI 配 JMeter」下沉到「开发者在 CI 里用代码定义性能契约」——脚本即代码、与 Git/CI/可观测性栈天然集成。
- **三大抽象**：①**虚拟用户（VU）**模拟并发用户，循环执行脚本里的请求 ②**阈值（thresholds）**定义性能红线（P95 < 500ms、错误率 < 1%），不达标测试失败 ③**检查（checks）**断言单次请求是否符合预期（status=200、body 非空）。
- **Go 实现核心**：单机能发起数万 VU，资源占用远低于 JMeter 的 JVM 线程模型（JMeter 一个用户一个线程，重）。
- **场景类型**：smoke（少量 VU 快速验证）、load（日常峰值）、stress（超出预期找瓶颈）、soak（长时间跑查内存泄漏）、spike（瞬时暴涨）、ramp-up（逐步加压）。
- **与 JMeter 的定位差异**：JMeter = GUI/XML 配置、Java、QA 专员工具、报告重；k6 = 脚本即代码、Go/JS、开发者工具、CI 友好。
- **进阶顺序**：[脚本与测试](./guide-line/scripts-and-tests) → [集成生态](./guide-line/integrations) → [参考](./reference)。

## 一、k6 是什么

负载测试的核心问题：**系统在上线前能扛多少并发、延迟多少、长时间跑会不会崩**。传统工具（JMeter）用 GUI 配测试计划，存成 XML，QA 专员主导——开发者很难纳入日常开发流程。k6 重新定义了这套工作流：

1. **用 JavaScript 写测试脚本**：`http.get(url)`、`check(res, {...})`，与写业务代码同构，能 git 版本控制、code review。
2. **CLI 一键发起**：`k6 run script.js`，指定 VU 数与时长，命令行一条命令跑起来，无需 GUI。
3. **阈值即性能门禁**：thresholds 把「P95 < 500ms」「错误率 < 1%」变成 CI 的 pass/fail，不达标阻断发布。

一句话：**k6 = JS 脚本定义负载 + CLI 发起 + 阈值做门禁 + Grafana 看结果。**

## 二、为什么「开发者优先」重要

JMeter 时代，负载测试是 QA 专员的活——开发者写完代码丢给 QA 配 JMeter，结果反馈周期长、脚本难复用、进不了 CI。k6 把负载测试拉回开发者身边：

- **同一种语言**：前端/Node 后端都熟 JS，写 k6 脚本无学习障碍。
- **脚本进仓库**：测试脚本与业务代码同仓库，git 版本控制 + PR review，接口改了顺手改压测。
- **CI 原生**：`k6 run` 挂进 GitHub Actions / GitLab CI，每次部署后跑冒烟，性能退化立刻暴露。
- **可观测性栈协同**：k6 属 Grafana Labs 生态，结果直推 Grafana/Prometheus，与日常监控同栈。

## 三、三大核心抽象

### 虚拟用户（VU）

VU 是 k6 模拟并发用户的单位。每个 VU 是一个独立的 JS 执行上下文，循环（iteration）执行 `default function` 里的请求逻辑。`--vus 100` 表示起 100 个并发 VU。

### 阈值（thresholds）

thresholds 定义性能红线，是 k6 做性能门禁的核心：

```js
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% 请求 < 500ms
    http_req_failed: ['rate<0.01'],      // 错误率 < 1%
  },
};
```

任一阈值不达标，`k6 run` 退出码非零，CI 据此阻断发布。

### 检查（checks）

checks 断言单次请求是否符合预期（类似测试框架的 assert）：

```js
check(res, {
  'status 200': (r) => r.status === 200,
  'body 非空': (r) => r.body && r.body.length > 0,
});
```

checks 不影响退出码（只统计通过率），但配合 thresholds 能做精细断言。

## 四、负载测试场景类型

| 场景 | 目的 | 典型配置 |
| --- | --- | --- |
| **smoke** | 快速验证脚本能跑、无明显错误 | 少量 VU（1-10），短时（1-2 分钟） |
| **load** | 验证日常峰值流量下的表现 | 中等 VU（接近预估峰值） |
| **stress** | 逐步加压找系统瓶颈 | VU 持续 ramp-up 到崩溃 |
| **soak** | 长时间跑查内存泄漏/连接耗尽 | 中等 VU，持续数小时 |
| **spike** | 模拟瞬时暴涨（秒杀/热点） | VU 瞬间从 0 涨到极高 |
| **ramp-up** | 逐步加压观察拐点 | 分阶段阶梯式加 VU |

## 五、与 JMeter 的定位差异

| 维度 | k6 | JMeter |
| --- | --- | --- |
| 配置方式 | **JS 脚本**（代码） | GUI / XML（配置文件） |
| 实现 | Go 核心 + JS 脚本 | Java（JVM） |
| 用户模型 | VU（轻量协程式） | 线程（一个用户一个线程，重） |
| 谁主导 | **开发者** | QA 专员 |
| CI 友好 | ✅ CLI 原生，脚本进 Git | 🟡 GUI 为主，CLI 有但要配 XML |
| 报告 | 终端 + JSON，可推 Grafana | 内置 HTML/CSV 报告 |
| 分布式 | k6 Operator（K8s）/ Cloud | JMeter 分布式（多机主从） |

## 下一步

理解了 k6 定位后，下一步深入脚本编写——[脚本与测试](./guide-line/scripts-and-tests)（JS 脚本/HTTP 请求/checks/thresholds/stages）。
