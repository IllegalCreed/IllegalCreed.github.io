---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **进程 = 私有内存 + 崩溃边界 + 权限边界**；线程住进程内共享内存；跨进程协作走 **IPC**
- 进程五巨头：**browser**（UI + 特权编排，仅 1 个）、**renderer**（每 tab/site 一个，沙箱）、**Viz**（原 GPU 进程，仅 1 个）、**Network Service**、utility/plugin/extension
- **多进程三笔账**：稳定（tab 崩不扩散）、安全（renderer 无任意文件访问）、内存（V8 每进程一份；超限后**同站 tab 共享进程**）
- **Servicification**：服务与进程解耦——强硬件拆进程、弱硬件合并省内存
- renderer 四线程：**main**（解析/样式/布局/JS/事件）、**compositor**（分层合成、独立滚动）、**raster ×N**（tile→位图）、**worker ×N**
- **Viz**：display compositor 线程聚合各进程合成帧 + GPU main 线程上屏
- **site = scheme + eTLD+1**（忽略子域/端口/路径）≠ origin（scheme+host+port）；选 site 是对 `document.domain`（已弃用）的兼容
- 站点隔离：**Chrome 67** 桌面全站点默认（内存 +10-13%）；**Chrome 77** Android ≥2GB RAM 隔离登录站点（+3-5%）；**Chrome 92** OAuth/COOP 站点与扩展；**Chrome 110** `<webview>`；WebView 未覆盖
- 导航六步：**判定输入 → 开始导航（DNS/TLS）→ 读响应（MIME/SafeBrowsing/CORB）→ 找（预启动的）renderer → commit（IPC+数据流）→ onload 停 spinner**
- 再导航附加项：**beforeunload 先问旧 renderer**、跨站**双 renderer 并存**（旧页跑 unload）、**SW 匹配 scope 则唤起 renderer**、**Navigation Preload 并行**

## 一、多进程职责表

| 进程                | 数量        | 职责                                                         | 崩溃影响               |
| ------------------- | ----------- | ------------------------------------------------------------ | ---------------------- |
| **browser**         | 1           | 地址栏/书签/前进后退等「chrome」界面；网络、文件等特权编排；导航与会话历史 | 整个浏览器             |
| **renderer**        | 每 tab/site | tab 内一切：解析 HTML/CSS、执行 JS、渲染页面；沙箱化          | 单个 tab（同站共享时波及同站 tab） |
| **Viz（原 GPU）**   | 1           | 聚合所有合成帧、GPU 光栅化与上屏                              | 画面重建               |
| **Network Service** | 1（可回退） | 网络栈：DNS、连接、请求/响应                                  | 网络中断后重建         |
| **plugin**          | 按需        | 站点插件（如当年的 Flash）                                    | 对应插件               |
| **extension**       | 按需        | 扩展页面                                                      | 对应扩展               |
| **utility**         | 按需        | 音频、解码、受保护视频等杂项                                  | 对应功能               |

## 二、线程分工表

| 进程         | 线程                        | 干什么                                                        |
| ------------ | --------------------------- | ------------------------------------------------------------- |
| browser      | UI 线程                     | 画浏览器界面；判定地址栏输入；编排导航；路由输入到 renderer   |
| browser      | network 线程                | 网络栈（现代已移入独立 Network Service 进程）                 |
| browser      | storage 线程                | 文件与存储访问；会话历史落盘                                  |
| renderer     | main 线程                   | 解析 HTML→DOM、样式计算、布局、绘制记录、**执行 JS**、事件派发 |
| renderer     | compositor 线程             | 分层、产出 compositor frame；**无主线程也能滚动/动画**        |
| renderer     | raster 线程 ×N              | 把 tile 光栅化成位图，写入 GPU 内存                           |
| renderer     | worker 线程 ×N              | Web Worker / Service Worker 的 JS；媒体等辅助                 |
| Viz          | display compositor 线程     | 聚合各 renderer + browser 的合成帧为单帧；须时刻可响应        |
| Viz          | GPU main 线程               | 光栅化显示列表/视频帧；把帧绘制到屏幕                          |

## 三、一次导航步骤表

| 步骤 | 名称           | 主角                 | 要点                                                                  |
| ---- | -------------- | -------------------- | --------------------------------------------------------------------- |
| 0    | beforeunload   | 旧 renderer          | 仅再导航时：browser 先经 IPC 询问旧页；无条件注册 = 每次导航加税      |
| 1    | 判定输入       | UI 线程              | 搜索词还是 URL？地址栏身兼搜索框                                      |
| 2    | 开始导航       | 网络侧               | spinner 转起；DNS 解析 + TLS 建连；301/302 则重启一轮                 |
| 3    | 读响应         | 网络侧               | `Content-Type`/MIME 嗅探分流（HTML vs 下载）；SafeBrowsing + CORB 安检 |
| 4    | 找 renderer    | UI 线程              | Step 2 已**并行预启动**；跨站重定向可能弃用重找                        |
| 5    | commit         | browser → renderer   | IPC + 数据流交接；地址栏/安全指示器/**session history** 更新           |
| 6    | 加载完成       | renderer → browser   | 所有 frame 的 `onload` 跑完 → IPC → 停 spinner；JS 仍可继续加载        |

再导航的附加项：跨站时**新旧 renderer 并存**（旧页跑 unload）；SW 命中 scope 则先唤起 renderer 跑 SW；Navigation Preload 让 SW 启动与网络请求并行。

## 四、站点隔离要点表

| 维度         | 要点                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------- |
| 隔离单位     | **site = scheme + eTLD+1**（含公共后缀，忽略子域/端口/路径）；`https://foo.example.com:8080` → `https://example.com` |
| 为何非 origin | 兼容改 `document.domain` 跨子域互访的旧页面（该 setter 已弃用，改用 `postMessage`）          |
| 分配规则     | 跨站文档**必然**不同进程：本 tab 导航、新 tab、iframe 一视同仁；跨站 iframe = **OOPIF**      |
| 动因         | renderer 漏洞常态化（M69 含 10 个可利用漏洞，M70-M73 各 5/13/13/15）、UXSS、**Spectre/Meltdown**（2018.1 公开） |
| 数据防线     | **CORB**：跨站 HTML/XML/JSON/PDF 不进错误进程（除非 CORS 放行）；尽力而为                    |
| 内存代价     | 桌面全站点 **10-13%**（Chrome 67 口径）；Android 选择性 **3-5%**（Chrome 77 口径）           |
| 铺开         | Chrome 67 桌面默认；77 Android ≥2GB 登录站点；92 OAuth/COOP 站点 + 扩展；110 `<webview>`     |
| 未覆盖       | Android WebView；RAM < 2GB 的 Android 设备                                                   |
| 副作用       | 跨进程布局不同步；**unload 不保证执行**（内含 postMessage 可能失败）；`--disable-web-security` 需连带 `--disable-features=IsolateOrigins,site-per-process` |
| 手动控制     | flags：`#enable-site-per-process` / `#isolate-origins` / `#strict-origin-isolation`；策略：`SitePerProcess` / `IsolateOrigins`；命令行：`--isolate-origins=...` |

## 五、术语表

| 术语                      | 一句话                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| IPC                       | 进程间通信：内存互不可见的进程之间传消息协作                       |
| site / origin             | scheme+eTLD+1 / scheme+host+port；站点隔离按 **site** 分进程       |
| eTLD+1                    | 有效顶级域+1 级（公共后缀列表判定）：`a.github.io` 本身即一个 site |
| OOPIF                     | Out-of-Process iframe：跨站 iframe 独立进程                        |
| Servicification           | 浏览器功能服务化：服务与进程解耦，按硬件拆分/合并                  |
| CORB                      | Cross-Origin Read Blocking：敏感跨站响应不交付给错误进程           |
| MIME 嗅探                 | `Content-Type` 缺失/错误时读首字节猜类型                           |
| commit navigation         | browser→renderer 的 IPC 交接：数据流移交，地址栏/历史随之更新      |
| session history           | tab 的前进/后退栈，commit 时入册并落盘供恢复                       |
| compositor frame          | 合成器产出的一帧描述，各进程提交给 Viz 聚合                        |
| display compositor        | Viz 内聚合各方合成帧的角色，须时刻可响应                           |
| Navigation Preload        | SW 启动与导航网络请求并行，`event.preloadResponse` 取用            |

## 六、排查与自查入口

| 入口                                   | 用途                                             |
| -------------------------------------- | ------------------------------------------------ |
| Chrome 任务管理器（更多工具 → 任务管理器） | 看每个 tab/iframe/扩展落在哪个进程、吃多少内存   |
| `chrome://process-internals`           | 查看进程模型与每个 frame 的 SiteInstance 归属    |
| `chrome://flags#enable-site-per-process` | Android 上手动开全量站点隔离                    |
| `visibilitychange` + `sendBeacon`      | 替代 unload 做离场上报（unload 不保证执行）      |
| Navigation Preload（`event.preloadResponse`） | SW 站点导航提速：启动与请求并行           |

## 权威链接

- [Inside look at modern web browser (part 1)](https://developer.chrome.com/blog/inside-browser-part1) —— 进程/线程、多进程架构、Servicification
- [Inside look at modern web browser (part 2)](https://developer.chrome.com/blog/inside-browser-part2) —— 导航全流程、beforeunload、SW 与 Navigation Preload
- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3) —— renderer 内线程与合成
- [RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture) —— 现代进程/线程结构与 Viz
- [MDN: How browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work) —— 导航到渲染全景与往返成本
- [Chromium: Site Isolation](https://www.chromium.org/Home/chromium-security/site-isolation/) —— 站点隔离设计、代价、限制
- [MDN: Document.domain](https://developer.mozilla.org/en-US/docs/Web/API/Document/domain) —— setter 弃用说明

## 相关页

- [概览](./index) —— 本叶定位与地图
- [入门](./getting-started) —— 多进程全景速览
- [进程、线程与 IPC](./guide-line/process-thread-ipc) —— 概念地基
- [多进程架构](./guide-line/multi-process-model) —— 进程分工与三笔账
- [各进程内的线程](./guide-line/process-threads-inside) —— main/compositor/raster/Viz
- [站点隔离](./guide-line/site-isolation) —— site 粒度进程模型
- [一次导航的全流程](./guide-line/navigation-flow) —— 六步接力
- [导航交接与复用](./guide-line/navigation-handoff) —— beforeunload/双 renderer/SW
