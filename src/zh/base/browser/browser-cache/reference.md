---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **命中链**：SW（Cache API）→ memory cache → disk cache → 网络；push cache 已死（Chrome 106 / Firefox 132 默认禁用）。
- **归属三分法**：Cache API 归代码、memory/disk 归浏览器、bfcache 归导航——排查先定层再动手。
- **灰色 200 + `(disk cache)`/`(memory cache)`＝没发请求**；**304＝发了条件请求**只回头不回体。
- **普通刷新只重验证主文档**（Chrome `max-age=0`+条件头 / Firefox 仅条件头 / Safari `no-cache`）；**强刷全资源 `no-cache`+`Pragma` 且无验证器**，304 不可能。
- **bfcache**：整页内存快照含 JS 堆；`pageshow(persisted)` 判恢复；阻断项背：unload / no-store（Chrome 已条件放宽，3 分钟时限）/ 打开的 IndexedDB 连接 / 在途 fetch / WebSocket、WebRTC / window.opener。
- **Cache API**：不看 HTTP 头、不自动过期；`add` 非 2xx 即 reject（opaque 用 `put`）；install 备货、activate 收尸。
- **`Clear-Site-Data`**：指令带双引号、仅 HTTPS；`"cookies"`（清整个注册域）/`"storage"` 稳，`"cache"` 兼容坑多，`"executionContexts"` 无人支持。
- **NotRestoredReasons**：Chrome 125+，`performance.getEntriesByType("navigation")[0].notRestoredReasons`。

## 一、多层缓存对照表

| 层 | 归谁管 | 存什么 | 生命周期 | 遵守 HTTP 语义 | 可编程 | Size 栏 |
| --- | --- | --- | --- | --- | --- | --- |
| Service Worker（Cache API） | 开发者 | Request/Response 对 | 不删不灭；配额压力整源清 | 否 | 完全 | `(ServiceWorker)` |
| memory cache | 浏览器（渲染进程） | 本文档刚用过的资源 | 标签页会话；关 tab 即清 | 宽松（实现细节） | 否 | `(memory cache)` |
| disk cache | 浏览器（网络栈） | 按 RFC 9111 可缓存的响应 | 跨会话；LRU 淘汰 | 严格 | 否（靠响应头影响） | `(disk cache)` |
| prefetch cache | 浏览器 | `rel="prefetch"` 预取的下一页资源 | 短期（认领即用） | — | 声明式触发 | `(prefetch cache)` |
| ~~push cache~~ | ~~HTTP/2 连接~~ | ~~Server Push 资源~~ | ~~随连接~~ | — | — | **已死**（Chrome 106 / Firefox 132） |
| bfcache | 浏览器（导航层） | **整页快照（DOM+JS 堆）** | 内存；Chrome 常规约 10 分钟、CCNS 页 3 分钟 | 非 RFC 9111 范畴 | 只能规避阻断项 | 不产生请求行 |

## 二、刷新行为矩阵

| 进入方式 | 主文档请求头 | 子资源 | 可能 304？ | 典型用途 |
| --- | --- | --- | --- | --- |
| 地址栏回车 / 点链接 | 无特殊头，正常缓存规则 | 正常缓存规则（新鲜不发请求） | 陈旧时可 | 日常导航 |
| 普通刷新（F5 / ⌘R） | Chrome `Cache-Control: max-age=0`+条件头；Firefox 仅条件头；Safari `no-cache`+`Pragma`（无条件头） | 正常缓存规则（2017「Reload, reloaded」后不连坐） | Chrome/Firefox 主文档可；Safari 否 | 「这页好像旧了」 |
| 强制刷新（⌘⇧R / Ctrl+Shift+R） | `Cache-Control: no-cache` + `Pragma: no-cache`（三家一致） | 同主文档，全量重下 | **不可能**（无验证器） | 「怀疑缓存坏了」 |
| DevTools Disable cache | 旁路 HTTP 缓存（仅 DevTools 打开时） | 全部旁路；**不含 Cache API** | 否 | 模拟首访 |

请求方向指令语义：`max-age=0`＝视作陈旧请重验证（验证不可达可兜底用旧）；`no-cache`＝必须验证成功才准用缓存。

## 三、bfcache 阻断条件表

| 阻断项 | 状态 | 对策 |
| --- | --- | --- |
| `unload` 监听 | 桌面 Chrome/Firefox 直接失格；移动端尝试缓存但事件不执行 | 永远别用；`pagehide` 替代；`Permissions-Policy: unload=()` 防第三方 |
| `Cache-Control: no-store` | 历史全阻断；Chrome 116 实验→2025-03/04 全量放宽：可进入但 Cookie/凭据变化即逐出、CCNS 子请求响应逐出、时限 3 分钟 | 仅真敏感页用 no-store；动态页用 no-cache |
| 打开的 IndexedDB 连接 | 阻断 | 空闲即关；`pagehide` 里 `db.close()` |
| 进行中的 fetch()/XHR | 阻断 | 完成或 `AbortController` 中止 |
| 打开的 WebSocket / WebRTC | 阻断 | `pagehide` 关闭、`pageshow(persisted)` 重连 |
| 非空 `window.opener` | 不能安全缓存 | `rel="noopener"`（`target="_blank"` 现代默认） |
| `beforeunload` 监听 | **不阻断**（现代浏览器）但不可靠 | 有未保存更改才挂、保存后即摘 |

**NotRestoredReasons 常见值**（Chrome 125+）：`unload-listener`、`response-cache-control-no-store`、`fetch`、`websocket`、`lock`、`broadcastchannel-message`、`masked`（跨域 iframe 原因折叠）。测试入口：DevTools Application → Back/forward cache → Run Test；Lighthouse ≥10.0 内置审计。

**事件对照**：初次加载 `load`→`pageshow(persisted=false)`；进 bfcache `pagehide(persisted=true)`（Chromium 另发 `freeze`）；恢复 `resume`（Chromium）→`pageshow(persisted=true)`。

## 四、SW 缓存策略选型表

| 策略 | 首选来源 | 兜底 | 新鲜度 | 适用 |
| --- | --- | --- | --- | --- |
| cache-first | 缓存 | 网络（miss 时取并写回） | 低（靠版本化换仓） | 带哈希的 JS/CSS/字体/图 |
| network-first | 网络（成功顺手写回） | 缓存（离线/失败） | 高 | 接口数据、HTML 入口 |
| stale-while-revalidate | 缓存（立即回） | 网络（后台拉新写回） | 中（旧一拍） | 头像、配置、非关键资源 |
| network-only | 网络 | 无 | 最高 | 支付等绝不容忍旧数据 |
| cache-only | 缓存 | 无 | — | 预缓存的离线专用资源 |

配套纪律：`add/addAll` 非 2xx reject、opaque（status 0）只能 `put`；写回必 `clone()`；`put` 前按 `response.ok` 过滤；**install 预缓存、activate 删旧版本仓**；用量算入存储配额（估算 `navigator.storage.estimate()`），详见[浏览器存储](../browser-storage/)。

## 五、Size 栏判读表

| 显示 | 含义 | 网络成本 |
| --- | --- | --- |
| `(memory cache)` | 渲染进程内存命中（Time≈0ms） | 0 |
| `(disk cache)` | HTTP 缓存命中（强缓存新鲜） | 0 |
| `(prefetch cache)` | 预取资源被认领 | 已预付 |
| `(ServiceWorker)` | SW 兑现（Cache API 或自造响应） | 0（SW 内 fetch 另计） |
| 字节数 + Status 200 | 完整下载 | 全量 |
| 字节数 + Status 304 | 协商命中：条件请求出网、仅回头部 | 一个 RTT + 头部 |

Size 两行：上＝传输量（压缩+头）、下＝资源解压后大小。Disable cache 不禁 SW（Application → Service workers → Bypass for network）；筛选缓存命中可用 filter `is:from-cache`。

## 六、Clear-Site-Data 指令兼容表

| 指令 | 清除范围 | Chrome | Firefox | Safari |
| --- | --- | --- | --- | --- |
| `"cache"` | 本源浏览器缓存（或含预渲染、bfcache、脚本缓存等） | 61+，**partial**（已知残留与卡顿 bug） | 63~94 → **移除** → **138 恢复** | 17+ |
| `"cookies"` | **整个注册域含子域**的 Cookie + HTTP 认证凭据 | 61+ | 63+ | 17+ |
| `"storage"` | 本源 localStorage/sessionStorage/IndexedDB/**SW 注册**/FileSystem 等 | 61+ | 63+ | 17+ |
| `"clientHints"` | `Accept-CH` 登记的客户端提示 | 117+（cache/cookies/* 顺带清） | ✗ | ✗ |
| `"executionContexts"` | 重载本源所有浏览上下文 | ✗（未实现） | 63~68 后移除 | 17~18.3 后移除 |
| `"prefetchCache"` / `"prerenderCache"` | 投机加载预取/预渲染 | 138+ | ✗ | ✗ |
| `"*"` | 全部（含未来类型） | 117+（partial） | 63+ | 17+ |

语法：指令必须双引号包裹；仅 HTTPS。登出推荐 `Clear-Site-Data: "cache", "cookies", "storage"`（投机加载站点加 `"prefetchCache", "prerenderCache"`）。

## 七、「拿到旧版」排查决策树（速记）

1. **无痕窗口复现**：新的 → 缓存层问题，继续；也是旧的 → 查部署产物 / CDN，浏览器无罪。
2. **curl 核对服务端响应头**：`Cache-Control` 配错（HTML 长 `max-age`）→ 改头 + 资源版本化根治。
3. **Size 栏定层**：`(ServiceWorker)` → SW 版本化收尸 / Bypass for network；`(disk cache)` → HTTP 策略问题；`(memory cache)` → 换标签页自愈。
4. **无任何请求且整页状态旧** → bfcache：`pageshow(persisted)` 刷新时效数据。
5. **修复手段选强度**：等自然过期 < `Clear-Site-Data`（注意 `"cache"` 兼容坑）< 改 URL（哈希换名，**唯一 100% 可靠**）。

## 权威链接

- [web.dev: Back/forward cache](https://web.dev/articles/bfcache) · [Chrome: bfcache 与 Cache-Control: no-store](https://developer.chrome.com/docs/web-platform/bfcache-ccns)
- [web.dev: Prevent unnecessary network requests with the HTTP Cache](https://web.dev/articles/http-cache)
- [MDN: Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) · [MDN: CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) · [MDN: 监控 bfcache 阻断原因](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Monitoring_bfcache_blocking_reasons)
- [MDN: Clear-Site-Data](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data)
- [Chrome: Removing HTTP/2 Server Push](https://developer.chrome.com/blog/removing-push) · [Firefox 132 Release Notes](https://www.firefox.com/en-US/firefox/132.0/releasenotes/)
- [Chromium Blog: Reload, reloaded](https://blog.chromium.org/2017/01/reload-reloaded-faster-and-leaner-page_26.html) · [csswizardry: Why Do We Have a Cache-Control Request Header?](https://csswizardry.com/2025/03/why-do-we-have-a-cache-control-request-header/)

## 相关页

- [入门](./getting-started) · [多层缓存总览](./guide-line/cache-layers) · [内存缓存与磁盘缓存](./guide-line/memory-disk-cache)
- [HTTP 缓存的浏览器侧落地](./guide-line/http-cache-landing) · [往返缓存 bfcache](./guide-line/bfcache)
- [Service Worker 缓存与 Cache API](./guide-line/sw-cache-api) · [观测与清除](./guide-line/cache-observe-clear)
- 跨章：[HTTP 缓存首部语义](/zh/base/network/net-http-basics/guide-line/connection-range-caching) · [HTTP 演进与性能](/zh/base/network/net-http-evolution/) · 兄弟叶：[浏览器存储](../browser-storage/) · [浏览器渲染原理](../browser-rendering/)
