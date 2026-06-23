---
layout: doc
outline: [2, 3]
---

# Network 与 Performance

> 基于 Chrome 149 稳定版编写

## 速查

- Network：`Cmd/Ctrl+R` 录请求；勾 **Disable cache**、**Preserve log**（跨页面保留）
- 限速：Network / Performance 顶部选 Slow 4G、3G，或自定义档位
- 排错：点请求看 Headers / Payload / Preview / Response / Timing / Initiator（谁发起的）
- 导出：右键请求 → Copy as cURL / fetch；整体导出 / 导入 **HAR**（149 起含 SSE 事件）
- Performance：`Cmd/Ctrl+E` 开始 / 停止录制；或 **Record and reload** 测加载
- 读图：Main 轨道火焰图找长任务（红角标 = Long Task）；底部 Bottom-Up / Call Tree 找热点
- Web Vitals：**Live metrics** 实时看 LCP / CLS / INP；Insights 侧栏给可操作建议
- React：React 19.2 起 **React Performance Tracks** 在时间线显示调度 / 渲染

## Network 面板

### 请求列表与过滤

- 顶部过滤栏：按类型（Fetch/XHR、JS、CSS、Img、Doc、WS…）、状态码、域名（`domain:`）、大小过滤
- 常用开关：**Disable cache**（禁用缓存模拟首次访问）、**Preserve log**（导航后保留记录）
- 限速：选 Slow 4G / 3G / Offline，或建自定义档（复现弱网）

### 单请求详情

点任一请求查看：

| 标签 | 内容 |
| --- | --- |
| Headers | 请求 / 响应头、状态码、远端地址 |
| Payload | 查询参数 / 请求体 |
| Preview / Response | 格式化预览 / 原始响应 |
| Initiator | **发起者调用栈**——定位是哪段代码发的请求 |
| Timing | 排队、连接、TTFB、下载各阶段耗时 |

### 导出与复用

- 右键请求 → **Copy as cURL / fetch / PowerShell**：直接拿到可复现的命令
- 工具栏导出 **HAR**（HTTP Archive），可在他处导入回放；Chrome 149 起 **SSE（Server-Sent Events）事件已完整序列化进 HAR**
- 配合 Sources 的 **Local Overrides** 可改写响应体，免后端改动验证前端

## Performance 面板

运行时性能剖析的核心，分析卡顿、掉帧、长任务、加载瓶颈。

### 录制与读图

- **Record**（`Cmd/Ctrl+E`）录交互过程；**Record and reload** 录页面加载
- 轨道（自上而下）：CPU 概览、Network、Frames（截图）、**Main**（主线程火焰图）、Timings、Interactions
- **Main 轨道**：函数调用火焰图，越宽越耗时；右上角红三角 = **Long Task**（> 50ms，阻塞交互）
- 底部分析视图：
  - **Summary**：时间分类饼图（脚本 / 渲染 / 绘制 / 空闲）
  - **Bottom-Up**：按自身耗时排序找热点函数
  - **Call Tree**：自顶向下的调用树
  - **Event Log**：按时间列事件

### Core Web Vitals 与 Insights

- **Live metrics** 视图：实时显示 **LCP / CLS / INP** 三大核心指标（来自真实交互）
- **Insights 侧栏**：自动诊断（LCP 分解、渲染阻塞资源、布局偏移来源、未压缩资源），每条都带可操作建议——这是把「测量」变「优化动作」的关键
- Chrome 149 修正了 Core Web Vitals 追踪，严格绑定主帧执行上下文，避免 iframe 干扰

### 限速与扩展轨道

- **CPU throttling**：4× / 6× 降速模拟低端机
- **自定义轨道**：框架可通过 `performance.measure` 注入自定义标记——**React 19.2 的 React Performance Tracks** 即以此在时间线展示调度器（Blocking / Transition / Suspense / Idle）与渲染阶段，并对编译器记忆化的组件标 ✨

> Lighthouse 综合审计（性能 / SEO / PWA 评分）与打包体积分析（Webpack Bundle Analyzer 等）属于「前端优化 · 性能评估」，本页聚焦 DevTools 内置的运行时剖析。

## 下一步

内存泄漏与存储管理见 [Memory 与 Application](./memory-application.md)。
