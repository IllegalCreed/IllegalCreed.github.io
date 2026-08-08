---
layout: doc
---

# k6

k6 是 Grafana Labs 出品的**开发者优先负载测试工具**——用 JavaScript 写测试脚本，命令行一键发起成百上千并发虚拟用户（VU）压测 HTTP/GraphQL/WebSocket 接口，靠**阈值（thresholds）**判定成败，输出可接 Grafana 可视化。它的定位是把负载测试从「QA 专员用 GUI 配 JMeter」下沉到「开发者在 CI 里用代码定义性能契约」，与 Git 仓库、CI/CD、可观测性栈（Grafana/Prometheus）天然集成。相比老牌的 **JMeter**（XML/GUI 配置、Java 实现、报告重），k6 以**脚本即代码、轻量高性能、开发者友好**重新定义了负载测试的工作流。

负载测试的核心目标：在上线前回答「系统能扛多少并发、P95 延迟多少、长时间跑会不会内存泄漏」。k6 用三个核心抽象承载这套流程：①**虚拟用户（VU）**模拟并发用户，每个 VU 循环执行脚本里的请求；②**阈值（thresholds）**定义性能红线（如 P95 < 500ms、错误率 < 1%），不达标测试失败、CI 阻断发布；③**检查（checks）**断言单次请求是否符合预期（status=200、body 非空）。进阶能力包括场景（stages/ramp-up）、冒烟测试、soak 测试、与 Grafana Cloud / Prometheus 的结果集成，以及 k6 Cloud / k6 Operator（K8s 分布式压测）。本叶是负载测试子脉络的总览，把 k6 的脚本编写、检查与阈值、集成生态讲透，并与 JMeter 做横向对比。

## 评价

**优点**

- **脚本即代码**：JS 写测试，能 git 版本控制、code review、复用函数库，告别 JMeter 的 XML 二进制配置
- **开发者友好**：JS 语法 + ES Modules，前端/后端都能上手；CLI 一条命令跑起来，无需 GUI
- **轻量高性能**：Go 实现核心，单机能发起数万 VU，资源占用远低于 JMeter 的 JVM 线程模型
- **阈值即性能门禁**：thresholds 把性能红线变成 CI 的 pass/fail，真正落地「性能契约」

**缺点**

- **分布式压测需额外组件**：单机压测开箱即用，但海量并发（十万级 VU）要用 K8s 分发（k6 Operator），不如 k6 Cloud 一键省心
- **JS 生态受限**：k6 用纯 JS 实现（非 V8/Node），不是所有 npm 包都能用，需用 k6 扩展（xk6）编译定制
- **学习曲线**：VU/iteration/Stage 的执行模型与单线程思维不同，新手易踩「VU 间状态共享」的坑
- **结果可视化要外接**：k6 本身只输出终端/JSON 报告，要 Grafana 看板需配 Prometheus/Cloud

## 本叶地图

- [入门](./getting-started) —— k6 定义、开发者优先理念、VU/阈值/检查三大抽象、与 JMeter 的定位差异
- [脚本与测试](./guide-line/scripts-and-tests) —— JS 脚本编写、HTTP 请求、检查（checks）、阈值（thresholds）、场景（stages）
- [集成生态](./guide-line/integrations) —— Grafana/Prometheus 结果可视化、CI/CD 集成、与 JMeter 深度对比
- [参考](./reference) —— k6 命令速查、脚本模板、阈值清单、易错点

## 幻灯片地址

<a href="/SlideStack/k6-slide/" target="_blank">k6</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=k6" target="_blank" rel="noopener noreferrer">k6 测试题</a>
