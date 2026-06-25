---
layout: doc
outline: [2, 3]
---

# 网络性能指标与弱网优化

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- 四大核心指标：**带宽 bandwidth**（链路吞吐上限，bps）、**延迟 latency / RTT**（一来一回的往返时间，ms）、**丢包率 packet loss**（丢失分组占比）、**抖动 jitter**（连续分组延迟的波动）。
- 延迟由四段构成：**传播延迟**（距离 / 光速，物理硬约束）+ **传输延迟**（分组比特数 / 带宽）+ **处理延迟**（路由器查表 / 校验）+ **排队延迟**（缓冲区排队，拥塞时暴涨）。
- **光在光纤里只跑约 200,000 km/s**（折射率约 1.5，是真空光速的 ~2/3）；纽约↔旧金山理论 RTT 约 **42 ms**、纽约↔伦敦约 **56 ms**、纽约↔悉尼约 **160 ms**，实际常 2~3 倍。
- 一句话权衡：**「带宽不够可以加钱，延迟受光速物理限制」**——多数页面瓶颈在延迟与往返次数，而非带宽。
- 用户感知阈值：**100~200 ms 已能察觉延迟，超 300 ms 明显卡顿**；优化首先要砍掉「往返次数」。
- 减往返：**合并 / 减少请求数**、内联关键资源、HTTP 缓存、避免重定向链；一次 TLS 握手就是 1~2 个 RTT。
- 提前建连：`<link rel="preconnect">`（DNS + TCP + TLS 一次性预热）、`rel="dns-prefetch">`（只预解析 DNS，廉价兜底）。
- 资源压缩：文本走 **gzip / brotli**，图片走 **WebP / AVIF**、响应式 `srcset`，按需懒加载 `loading="lazy"`。
- 自适应加载 adaptive loading：用 `navigator.connection.effectiveType` / `saveData` / `deviceMemory` 在弱网弱机上**减质降载**。
- 离线兜底：**Service Worker** 缓存壳与静态资源，弱网 / 断网仍可秒开；请求加**超时 + 退避重试**。
- 测量三件套：浏览器 **DevTools（Network / Performance / 网络限速）**、**Lighthouse**（实验室分 + Core Web Vitals）、**WebPageTest**（多地点 / 真机 / 瀑布图）。

## 四个核心指标：先量化，再优化

弱网优化的第一步是**会量化网络质量**。脱离指标谈「网络慢」毫无意义——慢在带宽？还是慢在延迟？两者的解法南辕北辙。

| 指标 | 含义 | 单位 | 受什么决定 | 前端能做什么 |
| --- | --- | --- | --- | --- |
| 带宽 bandwidth | 链路单位时间能传的最大比特数（吞吐上限） | bps / Mbps | 链路物理能力、运营商套餐 | 压缩体积、按需加载，少占带宽 |
| 延迟 latency / RTT | 一个分组往返一次的耗时 | ms | 物理距离、跳数、拥塞 | 减少往返次数、就近接入（CDN） |
| 丢包率 packet loss | 丢失分组占发送总数的比例 | % | 无线干扰、拥塞、信号弱 | 重试、降级、容错 UI |
| 抖动 jitter | 连续分组到达延迟的波动幅度 | ms | 排队不稳、路径切换 | 缓冲（音视频）、避免强实时依赖 |

::: tip 带宽和吞吐量不是一回事
**带宽（bandwidth）** 是链路理论上限，**吞吐量（throughput）** 是你实际拿到的速率。受丢包、拥塞、TCP 慢启动、服务端能力影响，吞吐量往往远低于带宽。测速跑出 100 Mbps 不代表每个请求都能跑满。
:::

## 延迟的四个构成：为什么「加钱」治不了延迟

总延迟 = **传播延迟 + 传输延迟 + 处理延迟 + 排队延迟**，逐项拆开看：

- **传播延迟（propagation delay）**：信号从发送方到接收方的飞行时间 = 距离 / 传播速度。光在光纤中约 **200,000 km/s**（折射率约 1.5，仅真空光速的 ~2/3）。这一项**只跟物理距离有关，砸钱也压不下去**——这正是 CDN 把内容推到用户身边的根本原因。
- **传输延迟（transmission delay）**：把一个分组的所有比特「压」进链路的时间 = 分组比特数 / 链路带宽。**这一项才跟带宽相关**，加宽链路能改善它，但它通常只是总延迟里的一小块。
- **处理延迟（processing delay）**：路由器解析分组头、做错误校验、决定下一跳的时间。现代硬件极快，一般可忽略。
- **排队延迟（queuing delay）**：分组在路由器缓冲区里排队等待处理的时间。**拥塞时这一项会暴涨**，也是弱网下延迟剧烈抖动的主因。

::: warning 延迟才是大多数页面的真瓶颈
HPBN（《High Performance Browser Networking》）反复强调：**「对绝大多数网站，瓶颈是延迟而非带宽。」** 把带宽从 5 Mbps 升到 10 Mbps，页面加载几乎无感；但把 RTT 从 100 ms 降到 50 ms，每一次往返都立竿见影。这就是那句口诀的来历——**带宽不够可以加钱买，延迟受光速物理限制**，只能靠「减少往返 + 缩短物理距离」来治。

参考 RTT（光纤理论最优，实际常 2~3 倍）：纽约↔旧金山 **42 ms**、纽约↔伦敦 **56 ms**、纽约↔悉尼 **160 ms**。用户在 **100~200 ms** 就能察觉延迟，超 **300 ms** 体感明显卡顿。
:::

「最后一公里（last-mile）」延迟也不容忽视：从家庭 / 办公室到运营商核心网的接入段，光纤入户约 10~20 ms、电缆 15~40 ms、DSL 30~65 ms——这段往往比跨洋骨干还显著（接入技术细节见本叶前几页）。

## 前端弱网优化策略清单

明确了「减往返 + 缩距离 + 减体积 + 能容错」四条主线，落到前端就是这套清单：

1. **减少请求数与往返**：合并资源、内联关键 CSS、删冗余重定向；一次 TLS 握手就吃掉 1~2 个 RTT，重定向链是往返刺客。
2. **资源压缩**：文本走 **brotli / gzip**；图片用 **WebP / AVIF** + 响应式 `srcset` + `loading="lazy"`；删未用代码、做 Tree Shaking。
3. **提前建连**：对关键第三方域用 `preconnect` 预热整条 `DNS + TCP + TLS`，用 `dns-prefetch` 做廉价兜底（见下节）。
4. **就近接入（CDN）**：静态资源走 CDN，把传播延迟从「跨洋」压到「同城」——原理详见上一页 [CDN 网络原理](./cdn-principle)。
5. **自适应加载 adaptive loading**：按网速 / 机能下发不同体验，弱网弱机只给核心内容（见下节）。
6. **离线缓存（Service Worker）**：缓存应用壳与静态资源，弱网 / 断网下仍能秒开、可降级到离线页。
7. **超时与重试**：给 `fetch` 设 `AbortSignal.timeout()`，失败用**指数退避 + 抖动**重试，避免卡死与重试风暴；UI 给出明确的加载 / 失败 / 重试态。

```html
<!-- 提前建连：preconnect 预热 DNS+TCP+TLS；dns-prefetch 仅预解析 DNS 作兜底 -->
<link rel="preconnect" href="https://cdn.example.com" crossorigin />
<link rel="dns-prefetch" href="https://cdn.example.com" />
```

```js
// 超时 + 指数退避重试：弱网下避免请求卡死与雪崩
async function fetchWithRetry(url, { retries = 2, timeout = 8000 } = {}) {
  for (let i = 0; i <= retries; i++) {
    try {
      // AbortSignal.timeout 到点自动中断请求（现代浏览器原生支持）
      return await fetch(url, { signal: AbortSignal.timeout(timeout) });
    } catch (err) {
      if (i === retries) throw err; // 重试用尽，抛出
      // 指数退避 + 随机抖动，错开并发重试，避免重试风暴
      const backoff = 2 ** i * 500 + Math.random() * 300;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}
```

## Network Information API：按网速自适应

[Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) 通过 `navigator.connection` 暴露当前网络状况，让页面**按网速 / 流量偏好动态调整**要加载的内容——这正是「自适应加载」的核心信号源。

常用字段：

- `effectiveType`：有效连接类型，取值 `'slow-2g'` / `'2g'` / `'3g'` / `'4g'`，综合 RTT 与下行速率估算，**最实用**。
- `saveData`：用户是否开启了「数据节省 / 省流量」模式（布尔值）。
- `downlink`：下行带宽估计（Mbps）；`rtt`：往返时延估计（ms）。
- `'change'` 事件：网络变化时触发，可监听后动态切换策略。

```js
// 按网速 / 省流量偏好自适应下发资源
function pickImageQuality() {
  const c = navigator.connection;
  if (!c) return "high"; // 不支持时退回默认高质量
  // 省流量模式或 2G/3G：给低质量图，省带宽、保流量
  if (c.saveData || /(^|\b)(slow-2g|2g|3g)\b/.test(c.effectiveType)) {
    return "low";
  }
  return "high"; // 4g 以上给高清
}

// 监听网络切换：从 WiFi 掉到 4G 时实时降级
navigator.connection?.addEventListener("change", () => {
  applyQuality(pickImageQuality());
});
```

::: warning 实验性能力，务必特性检测
Network Information API 至今**未进入 Baseline**——桌面 Safari 与 Firefox 默认不支持。因此 `navigator.connection` 可能为 `undefined`，**必须做特性检测并准备默认值**，把它当「锦上添花的提示」而非「可依赖的事实」。`effectiveType` 是估算值、会波动，适合做**渐进降级**而非硬开关。同类信号还有 `navigator.deviceMemory`（设备内存）与 `navigator.hardwareConcurrency`（CPU 核数），可一并用于弱机降载。

业界已有成熟实践：Twitter 在省流量模式省下约 80% 数据、eBay 弱网下隐藏非核心功能、Tinder 在 3G 下禁用视频自动播放。
:::

## 测量工具：先测，别猜

优化前先量化、优化后看回归，三件套各有分工：

- **浏览器 DevTools**：`Network` 面板看每个请求的瀑布图与耗时（DNS / 连接 / TTFB / 下载），并能用**网络限速（Throttling）** 模拟 3G / 慢速验证弱网表现；`Performance` 面板抓主线程与渲染时序。
- **Lighthouse**：一键给出**实验室性能分**与 **Core Web Vitals**（LCP / CLS / INP）及可执行的优化建议，适合本地与 CI 卡门禁。
- **WebPageTest**：支持**多地理位置、真实机型、不同网络档位**测试，输出详尽瀑布图与 Filmstrip，适合复现「某地区 / 某机型用户为何慢」。

::: tip 实验室数据 ≠ 真实用户
Lighthouse / WebPageTest 是**实验室（lab）数据**，跑在固定环境里；线上真实用户的网络千差万别，需配合 **RUM（真实用户监控）** 采集**现场（field）数据**（如 web-vitals 库上报 LCP / INP / CLS），两者结合才看得清弱网用户的真实体感。
:::

## 小结

网络性能优化的全部抓手，都收敛到对四个指标的理解上：**带宽**决定吞吐上限、**延迟 / RTT** 决定响应快慢、**丢包**与**抖动**决定弱网稳定性。其中最反直觉也最关键的一点是——**延迟而非带宽，才是多数页面的真瓶颈**：传播延迟受光速物理限制，砸钱压不下去，只能靠「**减少往返 + 就近接入 + 减小体积 + 优雅容错**」四条主线来治。前端的武器箱因此清晰：减请求、提前建连（`preconnect` / `dns-prefetch`）、走 CDN、自适应加载（Network Information API）、Service Worker 离线兜底、超时重试；动手前后都用 DevTools / Lighthouse / WebPageTest 量化验证，再辅以 RUM 看真实用户。

至此，「接入与移动网络」这一叶六页走完：从[接入网与 LAN/WAN/MAN](./access-lan-wan) 的网络范围、[宽带](./broadband) 与[蜂窝 2G→5G](./cellular-2g-5g) 的接入手段，到[移动弱网对前端的挑战](./mobile-weak-network)、[CDN 网络原理](./cdn-principle)，最后落到本页的指标与优化——一条「比特如何到达用户、又如何让它更快到达」的完整链路就此闭合。再把视野放大到整个「计算机网络基础」章：从分层模型、IP 与路由、传输层、DNS、HTTP 与 HTTPS、跨域与实时通信，到这一叶的接入与性能，你已经握有一张从物理链路直通浏览器请求的全景网络地图——它是日后排查线上问题、做性能优化、读懂任何 Web 协议的底座。

延伸阅读见本叶 [参考](../reference)。
