---
layout: doc
---

# Go

**Go（Golang）** 是 Google 于 2009 年开源的**编译型、静态类型、带垃圾回收**的系统级编程语言。它的设计哲学是**简洁**——刻意砍掉继承、泛型（1.18 前）、异常、宏等复杂特性，用**少而精**的语言元素（25 个关键字、清晰的语法）换来**易学、易读、易协作、编译飞快**。Go 最具革命性的贡献是 **goroutine + channel 的 CSP（Communicating Sequential Processes）并发模型**——用轻量级用户态协程（goroutine，几 KB 栈）和「**不要通过共享内存通信，而要通过通信共享内存**」的 channel 哲学，让高并发编程变得直观安全。Go 配合内置的运行时（调度器 + GC）和标准库（net/http 一行起服务、`go test` 一体化测试），成为**云原生时代的基础设施语言**。

Go 的全部考点围绕**简单与并发达成共识**：①**并发模型**——goroutine（`go f()` 一关键字启动，M:N 调度，GMP 模型）+ channel（`chan T`，类型安全的通信管道）+ `select`（多路复用），用 CSP 替代锁与共享变量；②**极简语法**——无继承（只有组合，struct embedding）、无类（只有 struct + method）、显式错误（`error` 是值，无异常）、格式化强制（`gofmt` 消灭代码风格之争）；③**工程化**——`go mod` 依赖管理、`go test` 内置测试基准、单一二进制静态编译部署、跨平台编译一行命令；④**云原生生态**——**Docker、Kubernetes、etcd、Prometheus、Hugo、Caddy、Traefik、Terraform、CockroachDB、InfluxDB** 全是 Go 写的，Go 几乎垄断了云原生基础设施；⑤**与 Rust 的对照**——Go 选「简单 + GC + CSP」换开发效率与并发心智简单，Rust 选「所有权 + 零成本抽象 + 无 GC」换极致性能与安全，是「**简单 vs 安全**」的经典工程权衡。值得注意的是，**TypeScript 编译器（tsc / TS7）正基于 Go 重写**，编译速度提升 10 倍以上——这是 Go 在「需要性能与简洁平衡」的工具领域的胜利。本叶是进阶语言章的**简单派代表**，与 [Rust](../rust/) 的「安全派」形成经典对照。

## 评价

**优点**

- **并发模型优雅**：goroutine + channel（CSP），轻量协程 + 类型安全通信，高并发代码直观、易写对
- **语法极简**：25 个关键字、无继承、无异常、`gofmt` 强制格式，新人一天上手、团队代码风格统一
- **编译飞快**：大项目秒级编译（比 Rust/C++ 快一个数量级），开发循环流畅
- **工程化完善**：`go mod` + `go test` + 静态单二进制 + 跨平台编译，部署极简（一个文件丢服务器就跑）
- **云原生生态垄断**：Docker/K8s/etcd/Prometheus 全是 Go，标准库 net/http 强大，云基建首选

**缺点**

- **冗长/啰嗦**：显式错误处理（`if err != nil` 满天飞）、无泛型（1.18 前）导致重复代码
- **有 GC 停顿**：高吞吐但偶发 STW，硬实时场景受限（不如 Rust 确定性）
- **表达能力较弱**：无枚举（用 iota 模拟）、无模式匹配、错误处理繁琐、元编程弱
- **二进制偏大**：运行时 + GC 打进二进制（虽有优化，仍比 C 大）

## 本叶地图

- [入门](./getting-started) —— Go 定位、goroutine/channel 并发心智、极简语法（无继承无异常）、Go modules、与 Rust 对比
- [并发模型：goroutine、channel 与 select](./guide-line/concurrency-model) —— CSP 哲学、GMP 调度、channel 有缓冲/无缓冲、select 多路复用、竞态与 sync
- [生态与工具链](./guide-line/ecosystem-and-tools) —— Go modules、go test、云原生生态（Docker/K8s/Hugo/Caddy/Traefik）、TS7 基于 Go、与 Rust 对比
- [参考](./reference) —— Go 核心概念速查、并发原语对比、易错点清单

## 幻灯片地址

<a href="/SlideStack/go-slide/" target="_blank">Go</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Go" target="_blank" rel="noopener noreferrer">Go 测试题</a>
