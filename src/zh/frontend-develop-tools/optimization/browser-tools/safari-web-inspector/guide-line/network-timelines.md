---
layout: doc
outline: [2, 3]
---

# Network 与 Timelines

> 基于 Safari 26（macOS / iOS 26）编写

## 速查

- Network：请求列表 + Headers / Cookies / Sizes / Timing；可导出 HAR
- Timelines = Safari 的性能分析：点红色录制 / 重载页面开始记录
- Timelines 子项：Network、Layout & Rendering、JavaScript & Events、CPU、Memory
- 真机：连 iOS 后同样能看真机的网络与性能时间线
- 限速：Network 支持节流（档位少于 Chrome）

## Network 面板

请求分析与其他浏览器一致：

- **请求列表**：按类型 / 状态过滤；列可定制
- **详情**：Headers、Cookies、请求 / 响应内容、各阶段 Timing、Sizes
- **HAR 导出**：保存请求记录供分析或复现
- **限速**：模拟较慢网络（档位较 Chrome 简单）

> 远程调试时可直接观察 **iPhone 上的真实网络请求**——排查移动端接口、跨域、缓存问题。

## Timelines 面板（性能分析）

Safari 的 **Timelines** 对应 Chrome 的 Performance，记录页面加载与交互期间发生的各类活动。点红色录制按钮或重载页面开始记录：

| 时间线 | 内容 |
| --- | --- |
| **Network Requests** | 请求的时间分布 |
| **Layout & Rendering** | 布局重排、绘制、合成 |
| **JavaScript & Events** | 脚本执行、事件处理 |
| **CPU** | CPU 占用 |
| **Memory** | 内存使用变化 |
| **Heap Allocations** | 堆分配采样 |

录制后可定位长时间的脚本、频繁的重排重绘、内存增长等性能问题。

> Timelines 在 JS / 布局剖析上够用，但缺少 Chrome 的 Core Web Vitals 与 Insights 可操作建议；综合性能优化主力仍是 Chrome，Safari 的价值在于**剖析 iOS 上的真实性能表现**。

## 在 iOS 真机上分析性能

桌面性能数据不能代表移动端。连接 iPhone 后用 Timelines 录制真机页面，能发现只在移动端出现的性能瓶颈（低端 GPU、内存压力、WebKit 特有的渲染开销）——这是 Chrome 设备模式给不了的。

## 下一步

存储、审计与图形见 [Storage 审计与图形](./storage-audit-graphics.md)。
