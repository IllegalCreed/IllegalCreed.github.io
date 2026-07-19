---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MDN（developer.mozilla.org）+ web.dev 官方文档编写，对照 RFC 9111（HTTP Caching, 2022）标准化语义

## 速查

- **两层语义**：强缓存（不发请求 / 直接复用） + 协商缓存（条件请求 / 304）
- **强缓存触发**：`Cache-Control: max-age=<秒>`（推荐）或 `Expires: <绝对日期>`（HTTP/1.0 兼容回退）
- **协商触发**：`ETag` + `If-None-Match` / `Last-Modified` + `If-Modified-Since`，命中返回 **304**
- **核心指令**：`no-cache`（可存但要校验）/ `no-store`（不存储）/ `public` / `private` / `must-revalidate` / `immutable`
- **生产黄金组合**：版本化资源（带 hash 文件名）= `public, max-age=31536000, immutable`；HTML 入口 = `no-cache`
- **不设 ≠ 不缓存**：默认走启发式缓存，按 `Last-Modified` 时间比例自行推断新鲜期
- **优先级**：`Cache-Control` 同时存在时覆盖 `Expires`；协商缓存优先用 `ETag` 而非 `Last-Modified`
- **资源提示四件**：`preload`（当前页 / 高优先级）/ `prefetch`（未来导航 / 低优先级）/ `preconnect`（DNS+TCP+TLS）/ `dns-prefetch`（仅 DNS）
- **必填搭档**：`<link rel="preload">` 必须写 `as`，字体必须加 `crossorigin`
- **状态码**：200 OK（资源已变 / 返回新副本）/ 304 Not Modified（未变 / 几乎无 body）/ 412（If-Match 失败）

## HTTP 缓存是什么

HTTP 缓存是浏览器 / 中间代理在客户端与源站之间保存响应副本的机制。它解决了「同一资源反复下载」的浪费，把 RTT 与带宽消耗降到接近零。核心定位有三：

- **协议层规范**：由 HTTP/1.1 引入、RFC 9111（2022）标准化，与浏览器实现细节无关
- **策略可配置**：所有控制都通过响应头（`Cache-Control` / `Expires` / `ETag` / `Last-Modified` / `Vary`）声明，前端 / 后端用头字段表达意图
- **双层语义**：强缓存（直接复用）+ 协商缓存（再校验），命中级别不同开销不同

> HTTP 缓存 ≠ Service Worker Cache Storage。前者是协议层被动缓存，后者是 JS 可编程的主动缓存层。

## 两层语义速览

| 层级 | 触发条件 | 命中行为 | 是否发请求 | 关键头 |
| --- | --- | --- | --- | --- |
| **强缓存**（fresh） | 副本在 `max-age` 新鲜期内 | 直接用本地副本 | **不发**（连条件请求都不发） | `Cache-Control` / `Expires` |
| **协商缓存**（revalidate） | 副本过期 / 被 `no-cache` 标记 | 发条件请求，命中则 304 | 发请求，但几乎无 body | `ETag` + `If-None-Match` / `Last-Modified` + `If-Modified-Since` |
| **未命中** | 本地无副本 / `no-store` | 完整下载新副本 | 发请求 + 完整 body | — |

> 强缓存命中浏览器「连请求都不发」，DevTools Network 面板里这类条目状态会标 `(disk cache)` 或 `(memory cache)`。

## Cache-Control 核心指令

```text
Cache-Control: public, max-age=31536000, immutable
              └─────┘  └──────────────┘  └───────┘
              是否允许   浏览器新鲜期     新鲜期内连
              共享缓存   （秒）          条件请求都跳过
```

**响应头高频指令**

| 指令 | 含义 |
| --- | --- |
| `max-age=<秒>` | 浏览器（私有缓存）新鲜期，自响应生成时刻起算 |
| `s-maxage=<秒>` | 仅共享缓存（CDN / 代理）新鲜期，覆盖 `max-age` |
| `public` | 允许共享缓存存储（解锁带 `Authorization` 头响应的共享缓存） |
| `private` | 仅浏览器私有缓存可存（默认值，普通场景不必显式） |
| `no-cache` | **可存储但每次使用前必须再校验**（≠ 不缓存） |
| `no-store` | **完全不存储**任何缓存（真正禁止） |
| `must-revalidate` | 过期后必须再校验，否则 504 |
| `proxy-revalidate` | 同 `must-revalidate`，仅对共享缓存生效 |
| `no-transform` | 禁止中介（代理 / 运营商）转换内容（如图像压缩） |
| `immutable` | 新鲜期内连用户刷新触发的条件请求都跳过 |
| `stale-while-revalidate=<秒>` | 过期窗口内可后台异步再校验 |
| `stale-if-error=<秒>` | 源站出错时可返回过期副本 |

**请求头高频指令**

| 指令 | 含义 |
| --- | --- |
| `max-age=<秒>` | 仅接受 N 秒内生成的副本 |
| `max-stale=<秒>` | 接受过期 N 秒内的副本 |
| `min-fresh=<秒>` | 要求剩余至少 N 秒新鲜期 |
| `no-cache` | 强制再校验（用户刷新时常发） |
| `no-store` | 不接受缓存副本 |
| `only-if-cached` | 只用缓存，无则 504 |

> 高频陷阱：`no-cache` ≠ 不缓存。允许存储，只是每次必须再校验；真正禁止缓存用 `no-store`。

## 协商缓存流程

完整的协商缓存生命周期：

```text
1. 首次请求
   GET /app.js
   ← 200 OK
     Cache-Control: max-age=0 / no-cache
     ETag: "abc123"
     Last-Modified: Wed, 21 Oct 2026 07:28:00 GMT

2. 副本过期（max-age 到期或被 no-cache 标记）
   GET /app.js
     If-None-Match: "abc123"
     If-Modified-Since: Wed, 21 Oct 2026 07:28:00 GMT

3a. 资源未变 → 服务端命中
   ← 304 Not Modified（几乎无 body）
     Cache-Control: max-age=0
     ETag: "abc123"（验证器刷新）
   → 客户端复用本地副本

3b. 资源已变 → 服务端未命中
   ← 200 OK
     新的完整 body
     新的 ETag / Last-Modified
```

**两类验证器对比**

| 维度 | ETag（推荐） | Last-Modified |
| --- | --- | --- |
| 形式 | 内容 hash（`"abc123"`，可带 `W/` 弱验证） | 绝对时间戳 |
| 精度 | 内容指纹，任意精度 | 1 秒粒度 |
| 能识别「内容变 mtime 未变」 | 是 | 否 |
| 能识别「1 秒内多次改」 | 是 | 否 |
| 反映内容而非文件改动 | 是 | 否（只反映 mtime） |

> 同时设置 ETag 与 Last-Modified 时，客户端两个条件都发，服务端应两个都满足才返回 304。

## 缓存策略组合

生产环境最经典的两组组合：

```text
# 组合 A：版本化静态资源（文件名带 hash 指纹）
# 例：app.a3f9b2c1.js、style.7c4e8d2a.css、字体、图标
Cache-Control: public, max-age=31536000, immutable

# 组合 B：HTML 入口文档
# 例：index.html
Cache-Control: no-cache
```

**为什么这样配**：

- **资源 hash 即版本**：内容变 hash 就变、URL 就变；旧 URL 的副本永久有效，可一直复用 `max-age=31536000`（1 年）也是 web.dev 推荐的最大值
- **`immutable` 阻止刷新触发条件请求**：浏览器默认在用户刷新时对未过期资源仍发条件请求，`immutable` 跳过这一步，Facebook 报告省 60% 请求量
- **HTML 必须每次协商**：HTML 是资源引用清单，若 HTML 长期缓存，部署新版后用户拿不到新 hash 引用，只能等缓存自然过期或硬刷新

**特殊场景**

| 资源类型 | 推荐策略 |
| --- | --- |
| 用户个性化 / 认证后响应 | `private, no-cache`（防共享缓存泄隐私） |
| 接口数据（短期不变） | `max-age=60` 或 `stale-while-revalidate=60` |
| 完全敏感不缓存 | `no-store` |
| 同 URL 多版本协商（压缩 / 设备） | 加 `Vary: Accept-Encoding, User-Agent` |

## 启发式缓存陷阱

**未写 `Cache-Control` 不等于不缓存**——浏览器与中间缓存会按启发式规则推断新鲜期：

```text
启发式新鲜期 ≈ max(0, (date - last_modified) × 10%)
```

例：响应头未设 `Cache-Control`，但 `Last-Modified` 是 100 天前，浏览器可能推断「这资源 10 天没变，给 10 天新鲜期」，结果出乎意料地长。

> **始终显式设置 Cache-Control**——哪怕只是 `no-cache` 或 `no-store`，也别让浏览器自己猜。

## Cache-Control vs Expires

| 维度 | Cache-Control | Expires |
| --- | --- | --- |
| 协议版本 | HTTP/1.1（推荐） | HTTP/1.0（兼容回退） |
| 形式 | 相对秒数（`max-age=3600`） | 绝对日期（`Wed, 21 Oct 2026 07:28:00 GMT`） |
| 优先级 | **高**（同时存在时覆盖 Expires） | 低 |
| 时钟漂移风险 | 无（相对时间） | 有（依赖客户端时钟） |
| 表达力 | 多指令组合 | 单值 |

> 新项目一律用 `Cache-Control: max-age=…`，不要再依赖 `Expires` 或 `Pragma: no-cache`（HTTP/1.0 兼容字段）。

## 资源提示四件

HTML `<link>` 提供四类资源提示，**全部放在 `<head>` 内**：

| 提示 | 用途 | 优先级 | 必填属性 |
| --- | --- | --- | --- |
| `<link rel="preload">` | 当前页**关键资源**预拉取（字体 / hero 图 / 关键 CSS / JS） | 高 | `as`、字体加 `crossorigin` |
| `<link rel="prefetch">` | 未来**导航可能用到**的资源预取 | 低（空闲时下载） | `as` |
| `<link rel="preconnect">` | 提前完成跨源 **DNS + TCP + TLS** 握手 | 中 | `href` 跨源 URL，必要时 `crossorigin` |
| `<link rel="dns-prefetch">` | 仅提前解析跨源 **DNS** | 低 | `href` 跨源 URL |

```html
<!-- 例：字体 CDN 提前握手 + hero 图预加载 -->
<head>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
  <link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin>
</head>
```

> `preconnect` 只对最关键跨源用（字体 CDN、关键 API 域名），其他用 `dns-prefetch` 省 socket。

## Fetch Priority API

`fetchpriority` 属性显式调整资源下载优先级，可用于 `<link>`、`<img>`、`<script>`、`<iframe>`：

| 取值 | 含义 |
| --- | --- |
| `high` | 显式提升（如 LCP 图片） |
| `low` | 显式降级（如非关键预取） |
| `auto`（默认） | 浏览器自决 |

> LCP 图片配 `fetchpriority="high"` 可绕过浏览器默认「低优先级 + 布局后才提升」的两阶段延迟，直接改善 LCP 指标。

## 下一步

- [核心策略详解](./guide-line.md)：Cache-Control 全指令深度 + 协商缓存验证器 + 生产策略组合 + 启发式 + 资源提示 + Vary + 反模式
- [参考](./reference.md)：完整指令表 / 条件请求头表 / 资源提示表 / 版本支持 / 官方资源
