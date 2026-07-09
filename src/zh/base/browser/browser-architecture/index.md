---
layout: doc
---

# 浏览器架构与进程模型

现代浏览器（以 Chromium 为代表）不是「一个程序」，而是一组分工明确、彼此隔离的进程：browser 进程掌管界面与导航编排，每个 tab / 每个站点跑在独立的 renderer 进程里，GPU 合成、网络栈也各自独立成进程或服务。这套架构决定了前端工程师日常遇到的许多「为什么」——为什么一个 tab 崩了别的没事、为什么 iframe 多的页面内存高、为什么 `beforeunload` 会拖慢导航。本叶从进程/线程基础讲起，走完多进程分工、各进程内部线程、站点隔离，再完整拆解一次导航从输入 URL 到页面加载完成的全流程与交接细节，为「浏览器渲染原理」一叶铺好地基。

## 概述

- **多进程架构**：browser / renderer / GPU(Viz) / Network Service / utility 各司其职；每个 tab 独立 renderer——一个 tab 崩溃或卡死不拖垮整个浏览器，renderer 还被关进沙箱限制文件访问。
- **代价与弹性**：进程间内存不共享，V8 等基础设施被复制多份；Chrome 按设备内存/CPU 限制进程数，超限后同站 tab 共享进程；Servicification 让服务在强硬件上拆进程、弱硬件上合并省内存。
- **站点隔离（Site Isolation）**：Chrome 67 起桌面默认按 site（scheme + eTLD+1）划分进程，跨站 iframe 也独立进程（OOPIF）；背景是 Spectre/Meltdown——同进程即可被侧信道读内存；桌面内存代价约 10-13%，Android 3-5%（选择性开启）。
- **导航全流程**：browser 进程的 UI 线程判定「URL 还是搜索词」→ 网络侧 DNS/TLS 取响应 → Content-Type/SafeBrowsing/CORB 检查 → 并行预启动的 renderer 通过 IPC 接管（commit）→ 地址栏、会话历史更新 → onload 后 spinner 停止。
- **导航交接**：再导航须先问旧 renderer 的 `beforeunload`；跨站导航时新旧 renderer 并存（旧页跑 unload、新页同时构建）；Service Worker 可作为「应用层网络代理」介入导航，Navigation Preload 让 SW 启动与网络请求并行。

## 本叶地图

- [入门](./getting-started) —— 多进程全景速览：进程分工、三方权衡、导航七步、站点隔离一句话
- [进程、线程与 IPC](./guide-line/process-thread-ipc) —— CPU vs GPU、进程 vs 线程、私有内存与 IPC、程序如何被 OS 执行
- [多进程架构](./guide-line/multi-process-model) —— 各进程职责表、单进程 vs 多进程、稳定/安全/内存三方权衡、Servicification
- [各进程内的线程](./guide-line/process-threads-inside) —— browser 的 UI/network/storage 线程、renderer 的 main/compositor/raster/worker、Viz 的 display compositor
- [站点隔离](./guide-line/site-isolation) —— site vs origin、OOPIF、Spectre 背景、document.domain、内存代价与铺开时间线
- [一次导航的全流程](./guide-line/navigation-flow) —— 输入判定 → 请求 → 响应检查 → 预启动 renderer → commit → 加载完成
- [导航交接与复用](./guide-line/navigation-handoff) —— beforeunload 确认、跨站双 renderer 并存、Service Worker 介入、Navigation Preload
- [参考](./reference) —— 进程职责/线程分工/导航步骤/站点隔离四张速查表 + 权威链接

## 文档地址

- [Inside look at modern web browser (part 1)](https://developer.chrome.com/blog/inside-browser-part1) —— 进程线程基础与多进程架构
- [Inside look at modern web browser (part 2)](https://developer.chrome.com/blog/inside-browser-part2) —— 导航全流程与交接
- [MDN: How browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work) —— 导航→渲染全景（本叶取导航段）
- [Chromium: Site Isolation](https://www.chromium.org/Home/chromium-security/site-isolation/) —— 站点隔离设计、限制与内存代价
- 补充：[part 3（renderer 内线程）](https://developer.chrome.com/blog/inside-browser-part3) · [RenderingNG architecture（Viz 进程）](https://developer.chrome.com/docs/chromium/renderingng-architecture)

## 幻灯片地址

<a href="/SlideStack/browser-architecture-slide/" target="_blank">浏览器架构与进程模型</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%B5%8F%E8%A7%88%E5%99%A8%E6%9E%B6%E6%9E%84%E4%B8%8E%E8%BF%9B%E7%A8%8B%E6%A8%A1%E5%9E%8B" target="_blank" rel="noopener noreferrer">浏览器架构与进程模型 测试题</a>
