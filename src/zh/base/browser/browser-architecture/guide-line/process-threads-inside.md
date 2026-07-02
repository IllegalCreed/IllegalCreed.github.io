---
layout: doc
outline: [2, 3]
---

# 各进程内的线程

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **browser 进程**三大员：**UI 线程**（画地址栏/按钮、判定输入、路由用户操作）、**network 线程**（网络栈——现代已移入独立 **Network Service** 进程）、**storage 线程**（文件与存储访问）
- **renderer 主线程（main thread）**：解析 HTML→DOM、样式计算、布局树、绘制记录、**执行你的 JS**、事件命中与派发——一人分饰全部关键角色
- **compositor 线程**：把页面分层、生成合成帧（compositor frame）；**不经主线程也能处理滚动/动画**
- **raster 线程 ×N**：把 compositor 切好的**图块（tile）**光栅化成位图，存入 GPU 内存
- **worker 线程**：Web Worker / Service Worker 的 JS 在这里跑，与主线程只通消息
- **Viz 进程**（原 GPU 进程，全浏览器**仅一个**——「通常只有一块 GPU」）：**display compositor 线程**聚合各 renderer + browser 的合成帧为单帧；**GPU main 线程**光栅化并真正画上屏幕
- display compositor 单独成线程的理由：**必须时刻可响应**，不能被 GPU 慢操作阻塞
- 帧的旅程：renderer 各自产出 compositor frame --IPC→ Viz 聚合 → GPU 绘制上屏
- 演进注记：inside-browser 系列（2018）描述的「browser 进程 network 线程」「GPU 进程」，在现代 Chromium 中分别演进为 **Network Service** 与 **Viz**
- 对前端：JS、布局、样式全挤在主线程 → 长任务卡一切；`transform`/`opacity` 动画可走 compositor 线程**绕开主线程**

## 一、browser 进程：UI、网络、存储三条线

多进程解决「谁和谁隔离」，进程内部还要靠线程分工。先看总调度 browser 进程，导航一章（[一次导航的全流程](./navigation-flow)）的主角就是这几条线：

| 线程             | 职责                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| **UI 线程**      | 绘制浏览器自身界面（地址栏、按钮、tab 条）；判定地址栏输入；编排导航 |
| **network 线程** | 跑网络栈，从互联网收发数据（DNS、连接、响应）                        |
| **storage 线程** | 控制文件访问与各类存储                                               |

两点补充：

- **network 线程的现代归宿**：这是 2018 年 inside-browser 系列的描述；随服务化推进，网络栈已移入独立的 **Network Service** 进程（资源受限设备上可回退为进程内线程）。本叶叙述导航时仍沿用「network 线程/网络侧」的说法，读者对号入座即可。
- **RenderingNG 视角**：browser 进程还有自己的「渲染与合成」职责——浏览器 UI 本身也要布局和绘制，并把输入事件**路由**给正确的 renderer；因无性能隔离需求，这些由单一线程（配少量 helper 线程做图像解码等）承担。

## 二、renderer 进程：主线程和它的帮手们

renderer 是 tab 内的整个世界，每个 tab（站点隔离下每个 site）一个。内部线程分工是前端性能话题的核心地图：

```text
renderer 进程
├─ main thread（主线程）×1
│    解析 HTML → DOM · 样式计算 · 布局树 · 绘制记录
│    执行 JS · 事件命中测试与派发 · 文档生命周期
├─ compositor thread（合成器线程）×1
│    分层（layerization）· 滚动/部分动画 · 产出 compositor frame
├─ raster threads（光栅化线程）×N
│    把 tile 变成位图，写入 GPU 内存
└─ worker threads ×N
     Web Worker / Service Worker 的 JS · 媒体/音频等辅助线程
```

### 2.1 主线程：唯一跑你 JS 的地方

主线程包揽了渲染管线的关键环节：把 HTML 解析成 DOM、算每个节点的样式、构建布局树（几何与位置）、生成绘制记录（先画什么后画什么）、构建分层信息并提交给 compositor 线程——**外加执行你的所有 JS 和派发输入事件**。各环节细节属[浏览器渲染原理](../../browser-rendering/)叶，这里只需看清一件事：这么多活挤在一条线程上，**一个长任务就能让解析、渲染、交互全部排队**。Web Worker / Service Worker 之所以存在，就是把可挪的 JS 挪去 worker 线程。

### 2.2 compositor 线程：没有主线程也要能滚

**合成（compositing）**是把页面拆成多个**图层（layer）**、各自光栅化、再拼成一帧的技术，由独立的 compositor 线程主持。它的独立价值在于：**输入滚动、图层级动画可以完全不等主线程**——主线程哪怕正被 JS 卡住，compositor 线程照样让页面滚起来。它还负责计算分层、协调图像解码与光栅化任务。

### 2.3 raster 线程：把图层切块变位图

图层可能很大（比如整页长图层），compositor 线程把它切成**图块（tile）**分发给多条 raster 线程；raster 线程把 tile 光栅化成位图存进 GPU 内存。compositor 线程会**优先**光栅化视口附近的 tile。随后 compositor 把「哪些 tile、放哪、怎么拼」封装成 **draw quad**，聚合为一张 **compositor frame（合成帧）**，经 IPC 提交出去。

## 三、Viz 进程：全浏览器只有一个的「上屏部门」

原「GPU 进程」在现代 Chromium 重构为 **Viz**（取自 Visuals）。整个浏览器**只有一个** Viz 进程——理由朴素：「通常只有一块 GPU」。它接收所有 renderer 进程和 browser 进程各自提交的 compositor frame，聚合后画上屏幕。内部两条关键线程：

| 线程                          | 职责                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| **display compositor 线程**   | 把各进程的合成帧**聚合**、优化成一张全局帧                             |
| **GPU main 线程**             | 光栅化显示列表与视频帧为 GPU 纹理 tile；把合成帧真正**绘制到屏幕**     |

为什么 display compositor 不和 GPU main 挤一条线程？官方解释：display compositor **必须时刻保持响应**，不能被 GPU 上的慢操作阻塞——聚合调度与真正画图解耦，掉帧风险被隔离在 GPU main 一侧。

一帧画面的完整旅程（站点隔离下一个页面可能由多个 renderer 拼成，聚合正是 Viz 的价值）：

```text
renderer A（主文档）─ compositor frame ─┐
renderer B（跨站 iframe）─ compositor frame ─┼─► Viz：display compositor 聚合成单帧
browser 进程（浏览器 UI）─ compositor frame ─┘        └─► GPU main 绘制上屏
```

## 四、演进注记：从 2018 年的图景到现在

inside-browser 系列（2018）与 RenderingNG 文档（2021+）之间，有两处名词更替需要对齐，读旧文章时别错乱：

| 2018 年说法                     | 现代 Chromium                                          |
| ------------------------------- | ------------------------------------------------------ |
| browser 进程内的 network 线程   | 独立 **Network Service** 进程（服务化，弱设备可合并）  |
| GPU 进程                        | **Viz** 进程（display compositor + GPU main）          |
| compositor frame 先提交给 browser 进程再转 GPU | renderer 直接把 compositor frame 提交给 Viz 聚合 |

架构在演进，但分工哲学未变：**每条线程只守一类职责，跨线程/跨进程只传消息**。

## 五、在 DevTools 里认出这些线程

Performance 面板录一段 trace，泳道与本页线程一一对应——这是把抽象架构落到日常调试的桥：

| Performance 泳道       | 对应线程                     | 常看什么                                             |
| ---------------------- | ---------------------------- | ---------------------------------------------------- |
| Main                   | renderer 主线程              | 长任务（红角标）、Parse HTML、Recalculate Style、Layout、Paint |
| Compositor             | renderer compositor 线程     | 滚动/合成是否独立推进；等主线程的空洞                |
| Raster（Rasterizer ×N）| raster 线程                  | 光栅化耗时、tile 任务分布                            |
| Thread pool / Worker   | worker 线程                  | 你的 Worker JS 是否真把活挪出去了                    |
| GPU                    | Viz 侧工作                   | 上屏是否成为瓶颈                                     |

一个常用判读：页面滚动流畅但点击无响应——Compositor 泳道在动、Main 泳道被长任务塞满，正是「合成器线程独立于主线程」的教科书现场。

## 六、对前端工程师的实际影响

- **长任务卡一切**：样式、布局、事件派发与你的 JS 同挤主线程——拆长任务、上 Worker 是架构层面的对症下药。
- **合成器动画丝滑的原理**：只改 `transform`/`opacity` 的动画可在 compositor 线程独立推进，主线程卡死也不掉帧；改布局属性的动画则必须回主线程走全管线（详见[浏览器渲染原理](../../browser-rendering/)）。
- **滚动为什么不容易卡**：滚动默认由 compositor 线程处理；但注册非 passive 的 `touchmove`/`wheel` 监听会迫使合成器等主线程确认，滚动性能应声而降。
- **iframe 多 ≠ 只费内存**：每个跨站 iframe 的帧要在 Viz 聚合，进程/线程编排成本也随之增加。

## 小结

browser 进程用 UI、network、storage 三条线程编排全局；renderer 进程里主线程一人扛下解析、样式、布局、JS 与事件，compositor 线程负责分层与合成帧、raster 线程切块光栅化、worker 线程收留后台 JS；全浏览器唯一的 Viz 进程用 display compositor 线程聚合各方合成帧、GPU main 线程绘制上屏。名词随架构演进（network 线程 → Network Service，GPU 进程 → Viz），但「单一职责 + 消息传递」的分工哲学一以贯之。看懂了线程分工，就能解释为什么长任务卡交互、合成器动画不掉帧。下一页把进程边界再切细一刀：[站点隔离](./site-isolation)。
