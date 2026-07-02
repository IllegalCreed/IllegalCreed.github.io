---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- 浏览器是**一组进程**：**browser 进程**（地址栏/书签/前进后退 + 特权操作）、**renderer 进程**（tab 内的一切网页内容）、**GPU 进程**（现代 Chromium 中为 **Viz**）、**Network Service**、utility/扩展进程
- **进程（process）**有 OS 分配的私有内存，**线程（thread）**住在进程里共享其内存；进程间通信要走 **IPC**（Inter-Process Communication）
- **一个 tab ≈ 一个 renderer 进程**：某个 tab 卡死/崩溃，关掉它即可，其余 tab 照常——这就是多进程换来的**稳定性**
- **安全**：renderer 处理任意来路的网页内容，被关进**沙箱（sandbox）**，无任意文件访问权
- **内存代价**：进程内存不共享，V8 等被复制多份；Chrome 按设备内存/CPU **限制进程数**，超限后**同站多 tab 共享一个 renderer**
- **Servicification（服务化）**：浏览器功能拆成服务，强硬件各自成进程、弱硬件合并进一个进程省内存
- **站点隔离（Site Isolation）**：Chrome 67 起桌面默认按 **site = scheme + eTLD+1** 分进程；**跨站 iframe 也独立进程（OOPIF）**；动因是 Spectre/Meltdown 侧信道攻击
- 导航由 **browser 进程主导**：UI 线程判定「搜索词还是 URL」→ 网络侧取响应 → 安全检查 → **renderer 早已并行预启动** → IPC 提交（commit navigation）
- commit 之后地址栏、安全指示器、**会话历史（session history）**才更新；所有 frame 的 `onload` 跑完，renderer 用 IPC 通知 browser 停掉 tab 上的 **spinner**
- 再导航前 browser 必须**先问旧 renderer 的 `beforeunload`**——无条件注册该监听会白白增加每次导航的延迟
- 跨站导航时**新旧两个 renderer 并存**：旧页跑 `unload`，新页同时构建
- **Service Worker** 是跑在 renderer 里的「应用层网络代理」，可以接管导航；**Navigation Preload** 让 SW 启动与网络请求并行

## 一、浏览器不是一个进程，而是一组进程

在 Chrome 的任务管理器（菜单 → 更多工具 → 任务管理器）里可以直观看到：一个浏览器窗口背后跑着一排进程。核心分工如下：

| 进程                 | 管什么                                                                       | 崩了会怎样                 |
| -------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| **browser 进程**     | 应用的「chrome」部分：地址栏、书签、前进/后退按钮；以及网络请求、文件访问等特权操作的编排 | 整个浏览器退出（仅此一个） |
| **renderer 进程**    | tab 内的一切：解析 HTML/CSS、跑 JS、渲染页面                                  | 该 tab 变「Aw, Snap!」     |
| **GPU 进程（Viz）**  | 汇总各方合成结果，用 GPU 画到屏幕                                             | 画面闪烁后自动重建         |
| **Network Service**  | 网络栈（早期是 browser 进程里的 network 线程，后服务化独立）                   | 网络请求中断后重建         |
| **plugin / utility** | 插件（如当年的 Flash）、音频、数据解码等杂项                                   | 对应功能失效               |

> 直觉模型：browser 进程是「总调度」，renderer 进程是「一间间隔离的工作室」，Viz/网络等是「公共服务部门」。

## 二、为什么这样设计：稳定、安全、内存的三方权衡

**稳定性**。如果所有 tab 跑在一个进程里（早期单进程浏览器就是如此），一段死循环 JS 就能冻住整个浏览器。每个 tab 独立 renderer 后，一个 tab 无响应，关掉它其余照旧。

**安全性**。操作系统可以按进程限制权限。renderer 天天执行互联网上任意来路的代码，于是被沙箱化——即使网页里的恶意代码攻破了渲染引擎，它也拿不到「读写你磁盘任意文件」的权力。

**内存**。代价是：进程之间内存不共享，V8 这类基础设施在每个 renderer 里都有一份拷贝。所以 Chrome 会按设备的内存和 CPU 能力限制进程数上限，超限后让同一站点的多个 tab 共享一个 renderer 进程。这也是「iframe 多、tab 多 → 内存高」的架构根源。

三方权衡的动态解法叫 **Servicification**：把浏览器的每块功能写成「服务」，强硬件上各自拆成独立进程（更稳更安全），资源受限的设备上合并进同一个进程（省内存）。网络栈独立成 Network Service 就是这条路线的产物。

## 三、把视角推进到进程内部：线程

每个进程内部又靠多条线程分工：

```text
browser 进程                      renderer 进程（每 tab / 每 site 一个）
├─ UI 线程     ← 地址栏/按钮/输入判定   ├─ 主线程        ← 解析、样式、布局、跑你的 JS
├─ network 线程 ← 网络栈（现已独立为    ├─ compositor 线程 ← 分层合成、无主线程也能滚动
│                Network Service 进程） ├─ raster 线程 ×N  ← 把图层分块光栅化成位图
└─ storage 线程 ← 文件与存储访问        └─ worker 线程 ×N  ← Web Worker / Service Worker

Viz 进程（全浏览器仅一个）
├─ display compositor 线程 ← 聚合所有进程的合成帧成一帧
└─ GPU main 线程           ← 光栅化 + 真正画上屏幕
```

对前端最要紧的一条：**你的 JS 只跑在某个 renderer 的主线程上**（除非用 Worker）。主线程忙，解析、布局、事件响应全部排队——这是性能优化章节反复出现的主角。

## 四、一次导航要过几道手

在地址栏输入 URL 到页面显示，粗线条是七步（细节见[一次导航的全流程](./guide-line/navigation-flow)）：

1. **UI 线程判定输入**：这是搜索词还是 URL？（地址栏同时也是搜索框）
2. **开始导航**：tab 角落转起 spinner，网络侧做 DNS 解析、建 TLS 连接（协议细节见[网络章](/zh/base/network/net-dns/)）
3. **读响应**：查 `Content-Type`（缺失/错误则 MIME 嗅探），过 SafeBrowsing 恶意站检查与 CORB 跨站数据拦截
4. **找 renderer**：其实第 2 步时就已**并行预启动**了一个 renderer，等数据一到立即可用
5. **commit navigation**：browser 进程通过 IPC 把数据流交给 renderer；确认后地址栏、安全指示器、会话历史更新
6. **文档加载**：renderer 接管，解析渲染（属下一叶[浏览器渲染原理](../browser-rendering/)的地盘）
7. **加载完成**：所有 frame 的 `onload` 执行完，renderer 通知 browser，spinner 停止

若是从一个页面跳往另一个站点，还要加一道前置手续：browser 先问旧 renderer「有没有 `beforeunload`？」——旧页有权弹「离开此页？」确认框。这也是**无条件注册 beforeunload 会拖慢所有导航**的原因（详见[导航交接与复用](./guide-line/navigation-handoff)）。

## 五、站点隔离：进程边界从 tab 细化到 site

「一个 tab 一个进程」还不够。页面里的跨站 iframe 若与父页同进程，Spectre/Meltdown 这类侧信道攻击就能越过同源策略直接读同进程内存。于是 Chrome 67（2018）起在桌面端默认开启**站点隔离**：进程按 **site（scheme + eTLD+1）** 划分，跨站 iframe 被拆到独立进程（OOPIF）。代价是桌面端约 10-13% 的内存开销——安全与内存的又一次明码标价的交易（详见[站点隔离](./guide-line/site-isolation)）。

## 六、动手验证：两分钟亲眼看到进程模型

不必背，打开工具看一眼印象更深：

1. **Chrome 任务管理器**（菜单 → 更多工具 → 任务管理器，macOS 上在「窗口」菜单）：每一行就是一个进程——「浏览器」「GPU 进程」「网络服务」和一排「标签页：xxx」；嵌有跨站 iframe 的页面还会多出「子框架：https://ads.example」行。
2. **制造一次隔离的崩溃**：任务管理器里选中某个「标签页」进程点「结束进程」——该 tab 变成崩溃页，其余 tab、地址栏一切照旧。
3. **`chrome://process-internals`**：查看当前站点隔离模式，以及每个 frame 归属哪个进程。
4. **DevTools Performance 面板**：录一段火焰图，泳道里的 Main / Compositor / Raster / GPU 正是[各进程内的线程](./guide-line/process-threads-inside)那几位。

## 七、三个高频疑问先给答案

- **为什么 Chrome 进程这么多？**——browser + Viz + 网络服务 + 每 tab/每 site 的 renderer + 每个扩展，按上表对号入座；这是拿内存买稳定与安全的明码交易。
- **为什么一个 tab 崩了别的没事？**——崩的是那个 tab 自己的 renderer 进程，OS 层面与其他进程内存隔离。例外：进程数到达上限后同站 tab 共享 renderer，会一起崩。
- **为什么 iframe 多的页面内存高？**——站点隔离下每个跨站 iframe 是独立进程，V8 等基础设施每进程一份。

## 八、本叶怎么读：按问题找页

| 你想弄清的问题                                       | 去哪页                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| 进程和线程到底差在哪？IPC 是什么？                   | [进程、线程与 IPC](./guide-line/process-thread-ipc)          |
| Chrome 为什么拆这么多进程？内存代价怎么算？          | [多进程架构](./guide-line/multi-process-model)               |
| 我的 JS、滚动、光栅化分别跑在哪条线程？              | [各进程内的线程](./guide-line/process-threads-inside)        |
| iframe 多为什么费内存？site 和 origin 差在哪？       | [站点隔离](./guide-line/site-isolation)                      |
| 回车到页面显示，浏览器内部发生了什么？               | [一次导航的全流程](./guide-line/navigation-flow)             |
| beforeunload 为什么拖慢导航？SW 怎么介入导航？       | [导航交接与复用](./guide-line/navigation-handoff)            |
| 面试/复习前把数字和表格过一遍                        | [参考](./reference)                                          |

读完本叶，renderer 拿到 HTML 之后的故事——解析、布局、绘制、合成——在下一叶[浏览器渲染原理](../browser-rendering/)继续。

下面各页逐一展开：先看[进程、线程与 IPC](./guide-line/process-thread-ipc)。
