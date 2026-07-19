---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MDN（developer.mozilla.org）+ web.dev 官方文档 + RFC 9111（HTTP Caching, 2022）编写

## 速查

- **强缓存**：`Cache-Control: max-age=3600`（不发请求，直接复用）
- **协商缓存**：`ETag` + `If-None-Match` / `Last-Modified` + `If-Modified-Since`，命中返 **304**
- **生产黄金组合**：版本化资源 `public, max-age=31536000, immutable`；HTML `no-cache`
- **高频陷阱**：`no-cache` ≠ 不缓存（用 `no-store`）；`public` 不必显式（带 `Authorization` 头时才需要）
- **资源提示四件**：`preload`（必配 `as`）/ `prefetch`（未来）/ `preconnect`（DNS+TCP+TLS）/ `dns-prefetch`（仅 DNS）
- **必填搭档**：`preload` 字体必加 `crossorigin`；LCP 图片加 `fetchpriority="high"`
- **优先级**：`Cache-Control` 覆盖 `Expires`；`s-maxage` 覆盖 `max-age`（仅共享缓存）
- **不设 ≠ 不缓存**：默认启发式 `max(0, (date - last_modified) × 10%)`
- **协议标准**：RFC 9111（Caching, 2022）/ RFC 8246（immutable, 2017）/ RFC 5861（stale-while-revalidate）
- **完整说明**见 [入门](./getting-started.md) / [核心策略详解](./guide-line.md)

## Cache-Control 响应头指令全表

| 指令 | 含义 | 优先级 / 备注 |
| --- | --- | --- |
| `max-age=<秒>` | 浏览器（私有缓存）新鲜期，自 `Date` 头起算 | 推荐 |
| `s-maxage=<秒>` | 仅共享缓存新鲜期，**覆盖 `max-age`** | CDN 解耦浏览器 TTL |
| `public` | 允许共享缓存存储 | 仅带 `Authorization` 头时显式 |
| `private` | 仅浏览器私有缓存可存（**默认值**） | 防 CDN 泄隐私 |
| `no-cache` | 可存储但每次必校验 | ≠ 不缓存 |
| `no-store` | 完全不存储 | 真正禁止 |
| `must-revalidate` | 过期后必须再校验，否则 504 | 严格数据 |
| `proxy-revalidate` | 同上，仅对共享缓存 | — |
| `must-understand` | 须理解状态码缓存语义，配合 `no-store` 兜底 | RFC 9111 新增 |
| `no-transform` | 禁止中介转换内容（如压缩图像） | 防运营商 |
| `immutable` | 新鲜期内连条件请求都跳过 | RFC 8246，仅 hash 资源 |
| `stale-while-revalidate=<秒>` | 过期窗口内可后台异步再校验 | RFC 5861 |
| `stale-if-error=<秒>` | 源站出错时可返回过期副本 | RFC 5861 容灾 |

## Cache-Control 请求头指令全表

| 指令 | 含义 |
| --- | --- |
| `max-age=<秒>` | 接受 N 秒内生成的副本 |
| `max-stale=<秒>` | 接受过期 N 秒内的副本 |
| `min-fresh=<秒>` | 要求剩余至少 N 秒新鲜期 |
| `no-cache` | 强制再校验（刷新常发） |
| `no-store` | 不接受缓存副本 |
| `only-if-cached` | 只用缓存，无则 504 |

## 条件请求头全表

| 请求头 | 配对响应头 | 用途 | 失败行为 |
| --- | --- | --- | --- |
| `If-None-Match` | `ETag` | GET / HEAD 协商 | 命中返 **304** |
| `If-Modified-Since` | `Last-Modified` | GET / HEAD 协商 | 未修改返 **304** |
| `If-Match` | `ETag` | PUT 乐观锁 | 不匹配返 **412** |
| `If-Unmodified-Since` | `Last-Modified` | 同上，时间维度 | 不匹配返 **412** |
| `If-Range` | `ETag` / `Last-Modified` | 范围请求条件 | 不匹配返完整 200 |

## 验证器对比

| 维度 | ETag（推荐） | Last-Modified |
| --- | --- | --- |
| 形式 | 内容 hash（`"abc123"`，可带 `W/` 弱验证） | 绝对时间戳 |
| 精度 | 内容指纹，任意精度 | **1 秒粒度** |
| 识别「内容变 mtime 未变」 | 是 | 否 |
| 识别「1 秒内多次改」 | 是 | 否 |
| 反映内容而非文件改动 | 是 | 否（只反映 mtime） |

## 资源提示全表

| 提示 | 用途 | 优先级 | 必填属性 |
| --- | --- | --- | --- |
| `<link rel="preload">` | 当前页关键资源预拉取 | 高 | `as`、字体加 `crossorigin` |
| `<link rel="prefetch">` | 未来导航资源预取 | 低（空闲时下载） | `as` |
| `<link rel="preconnect">` | 提前完成 DNS + TCP + TLS 握手 | 中 | `href` 跨源 URL |
| `<link rel="dns-prefetch">` | 仅提前解析 DNS | 低 | `href` 跨源 URL |
| `<link rel="modulepreload">` | ES Module 专用，预拉取并解析模块图 | 中 | `href` |

### `preload` 的 `as` 取值

| `as` 值 | 资源类型 |
| --- | --- |
| `script` | JavaScript 文件 |
| `style` | CSS 文件 |
| `font` | 字体文件（必加 `crossorigin`） |
| `image` | 图片 |
| `fetch` | fetch / XHR 资源 |
| `track` | WebVTT 字幕 |
| `audio` / `video` / `document` / `worker` / `embed` / `object` 等 | 各自类型 |

## Fetch Priority API（`fetchpriority`）

| 取值 | 含义 | 用途 |
| --- | --- | --- |
| `high` | 显式提升 | LCP 图片、关键字体、首屏 CSS |
| `low` | 显式降级 | 非关键预取、分析脚本、广告 iframe |
| `auto`（默认） | 浏览器自决 | — |

可用元素：`<link>` / `<img>` / `<script>` / `<iframe>`。

## 状态码

| 状态 | 含义 |
| --- | --- |
| **200 OK** | 资源已变 / 无缓存，返回新 body + 新验证器 |
| **304 Not Modified** | 资源未变，复用本地副本，**几乎无 body** |
| **412 Precondition Failed** | `If-Match` / `If-Unmodified-Since` 不匹配（乐观锁失败） |

## 相关响应头

| 头 | 含义 |
| --- | --- |
| `Cache-Control` | 策略总入口（推荐） |
| `Expires` | HTTP/1.0 绝对时间，被 `Cache-Control` 覆盖 |
| `ETag` / `Last-Modified` | 协商验证器 |
| `Vary` | 缓存键依赖的请求头维度 |
| `Age` | 响应已存在的秒数（私有缓存从 `max-age` 中扣除） |
| `Date` | 响应生成时刻（`max-age` 起算点） |
| `Clear-Site-Data: "cache"` | 清空该站点浏览器全部缓存 |

## Cache-Control vs Expires

| 维度 | Cache-Control | Expires |
| --- | --- | --- |
| 协议版本 | HTTP/1.1（推荐） | HTTP/1.0（兼容回退） |
| 形式 | 相对秒数（`max-age=3600`） | 绝对日期（`Wed, 21 Oct 2026 07:28:00 GMT`） |
| 优先级 | **高**（同时存在时覆盖 Expires） | 低 |
| 时钟漂移风险 | 无（相对时间） | 有（依赖客户端时钟） |
| 表达力 | 多指令组合 | 单值 |

## 生产策略矩阵

| 资源类型 | 推荐策略 | 理由 |
| --- | --- | --- |
| 文件名 hash 的 JS / CSS / 字体 / 图标 | `public, max-age=31536000, immutable` | 内容变 URL 就变 |
| HTML 入口 | `no-cache` | 每次协商拿新 hash 引用 |
| 用户个性化 / 认证后响应 | `private, no-cache` | 防共享缓存泄隐私 |
| 接口数据（短期不变） | `max-age=60` 或 `stale-while-revalidate=60` | 容忍短暂过期 |
| 完全敏感不缓存 | `no-store` | 真正禁止 |
| 同 URL 多版本（压缩 / 设备） | 加 `Vary: Accept-Encoding` 等 | 避免错发版本 |
| CDN 共享 + 浏览器短新鲜 | `max-age=600, s-maxage=86400` | 解耦两层 TTL |
| 严格数据（金融 / 库存） | `no-cache, must-revalidate` | 过期宁可 504 也不过期 |
| 历史兼容（HTTP/1.0 缓存回退） | `max-age=0, must-revalidate` | 等价 `no-cache` |

## HTTP/1.0 兼容字段

| 字段 | 用途 | 现状 |
| --- | --- | --- |
| `Expires: <绝对日期>` | HTTP/1.0 新鲜期 | 被 `Cache-Control` 覆盖；新项目不用 |
| `Pragma: no-cache` | HTTP/1.0 不缓存 | 等价语义模糊；用 `Cache-Control: no-cache` |

## 反模式速查

- 用 `no-cache` 表达「不缓存」（应是 `no-store`）
- 同时设 `no-store` 与 `max-age=0, must-revalidate`（基本等同 `no-store`，是无效噪音）
- 给 HTML 配 `max-age=31536000`（部署后用户拿不到新资源引用）
- 给带 hash 指纹的资源配 `no-cache`（强制每次协商浪费往返）
- 不设 `Cache-Control`（默认启发式，结果不可控）
- 个性化 / 认证响应漏加 `private`（共享缓存泄露隐私）
- 无脑给所有第三方域名都加 `preconnect`（挤占 socket）
- `preload` 不写 `as`（资源重复下载）
- `preload` 字体不加 `crossorigin`（字体下载两次）
- 服务端忽略 `If-None-Match` / `If-Modified-Since` 直接返回 200 + body（丢失协商优化）
- 用 `Expires` / `Pragma: no-cache` 代替 `Cache-Control`
- 用 query string `?v=2` 做版本化（部分老代理 / CDN 不缓存含 `?`）

## 版本支持（截至 2026-07）

| 特性 | 标准化 | Baseline | 备注 |
| --- | --- | --- | --- |
| `Cache-Control` | RFC 9111（2022） | Baseline widely available（2015-07 起） | 所有主流浏览器全支持 |
| `ETag` / `If-None-Match` | RFC 9110 | Baseline widely available | — |
| `Last-Modified` / `If-Modified-Since` | RFC 9110 | Baseline widely available | — |
| `Vary` | RFC 9110 | Baseline widely available | — |
| `immutable` | RFC 8246（2017） | Firefox 49+（仅 HTTPS）；Chrome / Safari 历史上未完整实现 | 不支持的浏览器**安全忽略**（可加上做渐进增强） |
| `stale-while-revalidate` | RFC 5861 | Chrome 75+；Firefox 至今未原生支持 | 多由 Service Worker 模拟 |
| `stale-if-error` | RFC 5861 | Chrome / Safari 支持；Firefox 未原生支持 | — |
| `<link rel="preload">` | WHATWG HTML | Baseline widely available（2021-01 起） | — |
| `<link rel="preconnect">` | WHATWG HTML | Baseline widely available | — |
| `<link rel="dns-prefetch">` | WHATWG HTML | Baseline widely available | — |
| `<link rel="prefetch">` | WHATWG HTML | Baseline widely available | — |
| `<link rel="modulepreload">` | WHATWG HTML | Baseline widely available | ES Module 专用 |
| Fetch Priority API（`fetchpriority`） | W3C 草案 | Baseline 2023 起 | Chrome 101+ / Firefox 117+ / Safari 17+ |
| `Clear-Site-Data` | W3C | Baseline widely available | 不影响中间缓存 |

## 启发式缓存公式

```text
启发式新鲜期 ≈ max(0, (date - last_modified) × 10%)
```

**例**：响应头未设 `Cache-Control`，`Last-Modified` 是 100 天前——浏览器可能推断「给 10 天新鲜期」。

**应对**：始终显式设置 `Cache-Control`，哪怕只是 `no-cache` / `no-store`。

## 完整协商流程

```text
# 首次请求
GET /app.js
→ 200 OK
  Date: Wed, 21 Oct 2026 07:28:00 GMT
  Cache-Control: max-age=0
  ETag: "abc123"
  Last-Modified: Wed, 21 Oct 2026 07:28:00 GMT

# 副本过期，发条件请求
GET /app.js
  If-None-Match: "abc123"
  If-Modified-Since: Wed, 21 Oct 2026 07:28:00 GMT

# 服务端比对
3a. 未变 → 304 Not Modified（几乎无 body）
    Cache-Control: max-age=0
    ETag: "abc123"
    → 客户端复用本地副本

3b. 已变 → 200 OK + 新 body + 新验证器
```

## 官方资源

- MDN HTTP caching 指南：[https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- MDN Cache-Control 参考：[https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
- MDN conditional requests：[https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests)
- MDN `rel="preload"`：[https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)
- MDN `rel="preconnect"`：[https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect)
- MDN `Vary`：[https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary)
- web.dev HTTP Cache：[https://web.dev/articles/http-cache](https://web.dev/articles/http-cache)
- web.dev Resource Hints：[https://web.dev/learn/performance/resource-hints](https://web.dev/learn/performance/resource-hints)
- web.dev Fetch Priority：[https://web.dev/articles/fetch-priority](https://web.dev/articles/fetch-priority)
- RFC 9111（HTTP Caching, 2022）：[https://www.rfc-editor.org/rfc/rfc9111](https://www.rfc-editor.org/rfc/rfc9111)
- RFC 9110（HTTP Semantics）：[https://www.rfc-editor.org/rfc/rfc9110](https://www.rfc-editor.org/rfc/rfc9110)
- RFC 8246（immutable, 2017）：[https://www.rfc-editor.org/rfc/rfc8246](https://www.rfc-editor.org/rfc/rfc8246)
- RFC 5861（stale-while-revalidate / stale-if-error）：[https://www.rfc-editor.org/rfc/rfc5861](https://www.rfc-editor.org/rfc/rfc5861)
