---
layout: doc
outline: [2, 3]
---

# 内存缓存与磁盘缓存

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **memory cache**：渲染进程**内存**中的资源复用层——**同一标签页会话内**有效，关标签页即清空，读取近乎 **0ms**。
- **disk cache**：落在磁盘上的 **HTTP 缓存本体**——**跨会话持久**（重启浏览器仍在），严格按 **RFC 9111** 新鲜度语义工作，容量满时淘汰旧条目。
- **典型 memory cache 命中**：同一页面里重复出现的图片、刚被 `preload` 预取的脚本/样式——「这个文档刚用过」是关键。
- **典型 disk cache 命中**：关掉浏览器第二天再访问、新开标签页访问同一站点。
- **放哪一层不归你管**：这是浏览器内部启发式（资源大小、内存压力、是否刚被本文档用过），**没有任何 HTTP 头或 API 能指定**「进内存」或「进磁盘」。
- **DevTools 判读**：Network Size 栏 `(memory cache)`（Time 常为 0ms）vs `(disk cache)`（微小但非零耗时）。
- **语义差异**：disk cache 是标准定义的「私有缓存」；memory cache 是**实现细节**，行为宽松、各浏览器不承诺一致。
- **对 SW 的可见性**：memory cache 命中**不触发** Service Worker 的 `fetch` 事件；disk cache 命中会触发（见[多层缓存总览](./cache-layers)）。
- **304 的去向**：协商成功的 `304` 会刷新 **disk cache** 里那份副本的新鲜期——续命发生在磁盘层。
- **隐私视角**：disk cache **落盘留痕**——给敏感响应配 `no-store` 的实质是「别写进磁盘」，不是性能考量。

## 一、memory cache：文档会话里的短命高速层

memory cache 活在**渲染进程的内存**里，服务对象是「当前这个文档」：

- **复用粒度是文档会话**——同一标签页里当前页面（及同会话导航）刚加载过的资源，再次请求时直接从内存兑现。最典型的场景：
  - 一张商品图在列表里出现 20 次，只有第一次真正走了网络/磁盘，其余 19 次全是 `(memory cache)`；
  - `<link rel="preload">` 预取的资源，正式使用时从 memory cache 认领；
  - 页面内脚本对同一 URL 的重复 `fetch`（可缓存的 GET）。
- **生命周期短**：关闭标签页、渲染进程退出，memory cache 随之蒸发。它不跨标签页共享——每个渲染进程各有一份（进程模型见[浏览器架构与进程模型](../../browser-architecture/)）。
- **快**：不涉及磁盘 I/O、不涉及进程间通信，DevTools 里 Time 一栏常显示 **0ms**。

::: warning memory cache 是实现细节，不是标准行为
RFC 9111 定义的「私有缓存」指的是 disk cache 那套按新鲜度工作的机制；memory cache 的匹配与保留策略是各浏览器的**内部实现**——它以「本文档刚用过」为主要依据，对 HTTP 缓存头的遵守比 disk cache 宽松，且各浏览器不承诺行为一致。工程上的正确姿势：**把 memory cache 当成不可控的加速红利**，正确性永远建立在 HTTP 语义（disk cache 层）之上，不要写「依赖某资源一定在/一定不在内存缓存」的逻辑。
:::

## 二、disk cache：HTTP 缓存的本体

disk cache（Chrome 里对应 profile 目录下的 Cache 文件）才是标准意义上的「浏览器 HTTP 缓存」：

- **严格遵守 HTTP 语义**：存不存看 `Cache-Control` / 启发式缓存规则；用不用看新鲜度（`max-age` vs `Age`）；陈旧后带 `If-None-Match` / `If-Modified-Since` 协商——整套语义见[网络章](/zh/base/network/net-http-basics/guide-line/connection-range-caching)，浏览器侧走法见 [HTTP 缓存的浏览器侧落地](./http-cache-landing)。
- **跨会话持久**：重启浏览器、重启系统都还在；这正是「一年 `max-age` + 文件名带哈希」策略能成立的物质基础。
- **容量有限、自动淘汰**：磁盘缓存有上限（随磁盘空间动态调整），满了按近期使用情况淘汰旧条目——所以「缓存一年」是「**最多**一年」，不是保证。
- **全 profile 共享**：同一浏览器 profile 的所有标签页共用一份 disk cache——A 标签页下载过的资源，B 标签页直接命中 `(disk cache)`。
- **落盘即痕迹**：磁盘缓存的内容持久留存在用户设备上（共享电脑、取证场景可见）。这才是给敏感响应配 `Cache-Control: no-store` 的实质理由——不是性能问题，是**别让隐私数据写进磁盘**。

## 三、浏览器怎么决定放哪

「这份响应进内存还是进磁盘」没有规范可查，是浏览器（以 Chrome 为例）的内部启发式。可观测的规律有三条：

| 因素 | 倾向 |
| --- | --- |
| **是否本文档刚用过** | 刚加载过的资源保留在 memory cache，供同文档复用 |
| **资源大小** | 大文件（如视频分片、大图）倾向只走磁盘，避免挤占渲染进程内存 |
| **内存压力** | 内存紧张时 memory cache 更早被清理，后续命中降级为 disk cache |

三个工程推论：

1. **不可编程**：没有「请把这个文件放内存」的头或 API；性能优化的抓手是 HTTP 语义（让 disk cache 尽可能命中）和 `preload`（让关键资源提前进入本文档的 memory cache 服务半径）。
2. **同一资源两次刷新的来源可能不同**：第一次刷新 `(memory cache)`、隔一会儿再刷变 `(disk cache)`，属正常现象（内存副本被回收），不是缓存策略坏了。
3. **测缓存行为要用干净基线**：memory cache 的存在会掩盖 disk cache 的真实表现——验证 `Cache-Control` 策略时用「新开标签页」或重启浏览器，绕开内存层。

## 四、DevTools 判读与三连实验

Network 面板 Size 栏是判读主战场（全部标签的对照表见[观测与清除](./cache-observe-clear)）：

| Size 栏显示 | 含义 | Time 栏特征 |
| --- | --- | --- |
| `(memory cache)` | 内存命中，未发请求 | 常为 0ms |
| `(disk cache)` | 磁盘命中，未发请求 | 微小但非零（有磁盘 I/O） |
| 具体字节数 + Status 304 | 发了条件请求，服务端确认未变 | 一个网络来回 |
| 具体字节数 + Status 200 | 完整下载 | 正常网络耗时 |

**三连实验**（拿任意静态资源丰富的站点验证）：

1. **首次访问**（或先清缓存）：资源全部显示真实传输字节——全走网络；
2. **同标签页刷新**：大量 `(memory cache)` 与 `(disk cache)` 混合——同文档刚用过的在内存，其余从磁盘拿；
3. **重启浏览器后再访问**：内存副本已蒸发，命中的全部是 `(disk cache)`。

一份典型的实验记录长这样（结果因资源大小与内存状况浮动，属正常）：

| 资源 | ① 首访 | ② 同 tab 刷新 | ③ 重启后再访 |
| --- | --- | --- | --- |
| `logo.svg`（小图，页内多处复用） | 4.2 kB / 200 | `(memory cache)` | `(disk cache)` |
| `app.3f2a.js`（哈希长缓存） | 180 kB / 200 | `(disk cache)` | `(disk cache)` |
| `hero.mp4`（大文件） | 2.1 MB / 200 | `(disk cache)` | `(disk cache)` |
| `index.html`（`no-cache`） | 12 kB / 200 | 条件请求 / 304 | 条件请求 / 304 |

::: tip 勾了 Disable cache 为什么还能看到缓存命中？
DevTools 的 **Disable cache** 只在 DevTools 打开期间禁用 HTTP 缓存（memory + disk），但**不禁用 Service Worker 的 Cache API**——SW 控制的页面照样可能显示 `(ServiceWorker)`。要连 SW 一起绕过，去 Application → Service workers 勾 **Bypass for network**（详见[观测与清除](./cache-observe-clear)）。
:::

## 五、常见问答

**Q：能用代码把某个资源「钉」在内存缓存里吗？**
不能。memory/disk 的分配对开发者完全不透明；最接近的手段是 `<link rel="preload">`——它让关键资源**提前到达**并进入本文档的服务半径（正式使用时常见 `(memory cache)` 命中），但「放哪、留多久」仍由浏览器定。需要**可编程**的常驻缓存，正确工具是 [Cache API](./sw-cache-api)。

顺带一个相关信号：Chrome 控制台的「resource was preloaded but not used within a few seconds」警告，说的正是「资源提前进了缓存服务半径却没人认领」——preload 了不用，白占带宽与内存。

**Q：`preload` 和 `prefetch` 进的是同一层吗？**
不是一个语义。`preload` 服务**本页马上要用**的资源，走正常 HTTP 缓存路径 + 内存复用；`prefetch` 拉的是**下一页可能用**的资源，命中时 Size 栏显示独立的 `(prefetch cache)` 标签（见[观测与清除](./cache-observe-clear)）。

**Q：隐身/无痕窗口的缓存去哪了？**
隐身会话的缓存不与常规 profile 互通，且**随会话结束丢弃**——不落长期磁盘痕迹。这也是它适合当「干净基线」复现缓存问题的原因：等价于一个自带作废机制的空缓存环境。

**Q：304 协商成功后，Size 栏为什么还是显示字节数？**
因为那一行记录的是**这次条件请求本身**（传输了请求/响应头）。304 的效果体现在**下一次**：副本被续命，新鲜期内再访问就变回 `(disk cache)`。

**Q：内存紧张时，原本 `(memory cache)` 的资源怎么变成 `(disk cache)` 了？**
正常降级。内存压力是分配启发式的输入之一：渲染进程内存吃紧时 memory cache 会被更早回收，后续命中自然落到磁盘层。这不是缓存失效——磁盘副本仍在新鲜期内，只是少了「零拷贝级」的加速，无需处理。

**Q：`no-store` 的资源会被 memory cache 复用吗？**
目标行为是**任何缓存都不保存**。但 memory cache 属于实现细节，历史上各浏览器在「同文档内复用」上存在过灰色地带——结论不变：`no-store` 是缓存指令不是安全机制，真正的敏感数据要靠鉴权与传输安全兜底，别把边界押在内存层的行为上。

## 小结

- **memory cache**：渲染进程内存、同标签页会话、关 tab 即失效、近 0ms；服务「本文档刚用过」的复用（重复图片、preload），是实现细节而非标准行为，且命中时不触发 SW `fetch` 事件。
- **disk cache**：HTTP 缓存本体——跨会话持久、严格遵守 RFC 9111 新鲜度与协商语义、全 profile 共享、容量满自动淘汰；`304` 续命续的是这一层。
- **放哪一层由浏览器启发式决定**（大小/内存压力/最近使用），不可编程控制；判读靠 Size 栏 `(memory cache)` / `(disk cache)`，验证缓存策略时注意用新标签页或重启绕开内存层干扰。
