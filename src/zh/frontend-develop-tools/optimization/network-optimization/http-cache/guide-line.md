---
layout: doc
outline: [2, 3]
---

# 核心策略详解

> 基于 MDN（developer.mozilla.org）+ web.dev 官方文档 + RFC 9111（HTTP Caching, 2022）编写，对照 RFC 8246（immutable, 2017）与 RFC 5861（stale-while-revalidate）

## 速查

- **强缓存**：`max-age=<秒>`（新鲜期）/ `s-maxage=<秒>`（仅共享缓存）/ `public` / `private`（默认）/ `immutable`（跳过刷新触发的条件请求）
- **控制缓存**：`no-cache`（可存但每次校验）/ `no-store`（不存）/ `must-revalidate`（过期必校验）/ `proxy-revalidate`（仅共享缓存）
- **协商验证器**：`ETag`（内容指纹，优先）+ `If-None-Match`；`Last-Modified`（1 秒粒度）+ `If-Modified-Since`；命中返 **304**
- **生产黄金组合**：版本化资源 = `public, max-age=31536000, immutable`；HTML = `no-cache`；接口 = `stale-while-revalidate=<秒>`
- **不设 ≠ 不缓存**：默认启发式，`max(0, (date - last_modified) × 10%)`
- **优先级**：`Cache-Control` 覆盖 `Expires`；`s-maxage` 覆盖 `max-age`（仅共享缓存）
- **资源提示**：`preload`（当前页 / 必配 `as`）/ `prefetch`（未来导航）/ `preconnect`（DNS+TCP+TLS，仅关键跨源）/ `dns-prefetch`（仅 DNS）
- **Fetch Priority**：LCP 图片加 `fetchpriority="high"` 绕过默认两阶段延迟
- **Vary**：声明缓存键依赖的请求头维度（如 `Vary: Accept-Encoding` 避免把 br 版错发给 gzip 客户端）
- **反模式**：用 `no-cache` 表达不缓存 / 给 HTML 配长 max-age / preload 缺 `as` / preload 字体缺 `crossorigin` / 无脑 preconnect

## 强缓存：Cache-Control 全指令

### 新鲜期与作用域

#### `max-age=<秒>`（私有缓存新鲜期）

```text
Cache-Control: max-age=3600
```

- 自响应生成时刻（`Date` 头）起算的**相对秒数**
- 仅对浏览器等私有缓存生效；共享缓存（CDN / 代理）会按本值或 `s-maxage` 取舍
- `max-age=0` 等价「立即过期，每次必校验」，配合 `must-revalidate` 等价 `no-cache`

#### `s-maxage=<秒>`（共享缓存新鲜期）

```text
Cache-Control: max-age=600, s-maxage=86400
```

- 仅对共享缓存（CDN / 代理）生效，**覆盖** `max-age`
- 让 CDN 与浏览器新鲜期**解耦**：CDN 缓存 1 天、浏览器只缓存 10 分钟，常见于「接口数据 CDN 共享但客户端要快速感知更新」场景
- 共享缓存过期后会忽略 `stale-while-revalidate` 等扩展，除非也用 `Cache-Cache-Control` / `Surrogate-Control`（厂商私有）

#### `public` / `private`

| 指令 | 含义 | 何时显式用 |
| --- | --- | --- |
| `public` | 允许共享缓存存储 | 仅**带 `Authorization` 头响应**需要（默认私有）；普通场景不必显式 |
| `private` | 仅浏览器私有缓存可存（**默认值**） | 个性化 / 认证后响应显式加，**防止共享缓存泄露**给其他用户 |

> 高频误区：以为「要被 CDN 缓存就必须写 `public`」。普通响应（无 `Authorization`）默认就能被共享缓存；`public` 的真正用途是**覆盖 `Authorization` 头触发的「默认私有」行为**。

### 控制类指令

#### `no-cache`（每次必校验）

```text
Cache-Control: no-cache
```

- **可存储**，但每次使用前必须向源服务器发条件请求再校验
- 命中后返回 304，几乎无 body——成本几乎为零
- **不等于「不缓存」**：真正禁止缓存用 `no-store`
- 历史回退：`max-age=0, must-revalidate` 在 HTTP/1.0 缓存不支持 `no-cache` 时作为等价回退方案

#### `no-store`（真正禁止）

```text
Cache-Control: no-store
```

- **完全不存储**任何缓存（请求与响应均不存）
- 适合敏感数据（金融、医疗、即时身份）与不可重放的状态变更响应
- 与 `max-age=0, must-revalidate` 同时设置时按最严格执行，**基本等同 `no-store`**——别写一长串冲突指令

#### `must-revalidate` / `proxy-revalidate`

```text
Cache-Control: must-revalidate          # 所有缓存
Cache-Control: proxy-revalidate         # 仅共享缓存
```

- 副本过期后**必须再校验**，不能用过期副本兜底
- 不写则缓存可在断网时「乐观」用过期副本响应（5xx 容忍）
- 适合严格数据：金融、库存、密钥——过期宁可 504 也不能用过期值

#### `no-transform`

```text
Cache-Control: no-transform
```

- 禁止中介（代理 / 运营商 / 增值服务）转换内容（如图片有损压缩、HTML minify）
- 移动端运营商曾普遍对图像做「优化」，破坏内容完整性

### 扩展指令

#### `immutable`（RFC 8246, 2017）

```text
Cache-Control: public, max-age=31536000, immutable
```

- 新鲜期内**连用户刷新触发的条件请求都跳过**
- 浏览器默认对未过期资源在用户刷新时仍发条件请求（拿 304）；`immutable` 跳过这一步
- Facebook 报告：版本化资源加 `immutable` 后省 **60% 请求量**
- **只对内容永不变化的 hash 资源有意义**；HTML / API 这类需要每次校验的不要加
- 实现差异：Firefox 49+（仅 HTTPS 下生效）支持；Chromium 历史上未完整实现，不支持的浏览器**安全忽略**（可放心加上做渐进增强）

#### `stale-while-revalidate=<秒>`（RFC 5861）

```text
Cache-Control: max-age=60, stale-while-revalidate=600
```

- 过期后 N 秒内可一边**返回旧副本**、一边**后台异步再校验**
- 对用户隐藏重新验证的延迟，适合「可容忍短暂过期」的接口 / 资源
- Chrome 75+ 支持；Firefox 至今未原生支持（实际多由 Service Worker 模拟）

#### `stale-if-error=<秒>`（RFC 5861）

```text
Cache-Control: max-age=60, stale-if-error=86400
```

- 源站出错（5xx）时可返回过期副本
- 提升可用性，CDN 常用作「容灾层」

### HTTP/1.0 兼容字段

#### `Expires`（HTTP/1.0）

```text
Expires: Wed, 21 Oct 2026 07:28:00 GMT
```

- **绝对日期时间**，依赖客户端时钟（漂移会导致缓存提前 / 滞后失效）
- `Cache-Control` 同时存在时被其覆盖
- 新项目一律用 `Cache-Control: max-age=…`

#### `Pragma: no-cache`（HTTP/1.0）

- HTTP/1.0 回退兼容字段，等价语义模糊
- 新项目用 `Cache-Control: no-cache`

### `Age` 头

```text
Age: 30
```

- 响应从源服务器生成到现在经过的秒数
- 私有缓存会从 `max-age` 中**扣除** `Age`（如 CDN 缓存 30 秒后才到浏览器，浏览器实际剩 `max-age - 30` 秒）

## 协商缓存：验证器与条件请求

### ETag（强 / 弱验证器）

```text
响应头：
  ETag: "abc123"           强验证器
  ETag: W/"abc123"         弱验证器（值相同允许「语义等价但字节不同」）

请求头：
  If-None-Match: "abc123"
```

- 通常由服务器对响应体做 hash 生成（如 sha256 前 N 位）
- 强 ETag 必须字节级一致才匹配；弱 ETag `W/"…"` 允许语义等价即可（如 minify 前后）
- `If-Match` 用于 PUT 乐观锁（不匹配返 412 Precondition Failed）

### Last-Modified

```text
响应头：
  Last-Modified: Wed, 21 Oct 2026 07:28:00 GMT

请求头：
  If-Modified-Since: Wed, 21 Oct 2026 07:28:00 GMT
  If-Unmodified-Since: ...
```

- 1 秒粒度时间戳
- 只反映**文件改动时间**，不反映内容（同样的内容存一次也会更新 mtime）

### ETag 优于 Last-Modified

| 场景 | ETag 识别 | Last-Modified 识别 |
| --- | --- | --- |
| 内容变 mtime 未变（如 `touch`） | 是 | 否（mtime 更新触发 304 失败） |
| 1 秒内多次改 | 是 | 否（粒度不够） |
| 内容未变 mtime 变 | 否（ETag 同 → 304） | 是（mtime 不同 → 200） |
| 内容变 mtime 也变 | 是 | 是 |

> 同时设置时，客户端两个条件都发，服务端应**两个都满足**才返 304。

### 完整协商流程

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

### 条件请求头家族

| 请求头 | 配对响应头 | 用途 |
| --- | --- | --- |
| `If-None-Match` | ETag | GET / HEAD 协商，命中返 304 |
| `If-Modified-Since` | Last-Modified | GET / HEAD 协商，未修改返 304 |
| `If-Match` | ETag | PUT 乐观锁，不匹配返 412 |
| `If-Unmodified-Since` | Last-Modified | 同上，时间维度 |
| `If-Range` | ETag / Last-Modified | 范围请求条件（断点续传） |

### 状态码

| 状态 | 含义 |
| --- | --- |
| **200 OK** | 资源已变 / 无缓存，返回新 body + 新验证器 |
| **304 Not Modified** | 资源未变，复用本地副本，**几乎无 body** |
| **412 Precondition Failed** | `If-Match` / `If-Unmodified-Since` 不匹配（乐观锁失败） |

## 生产缓存策略组合

### 黄金组合：版本化资源 + HTML 入口

```text
# 组合 A：版本化静态资源（构建器产出的文件名带 hash）
app.a3f9b2c1.js     →  Cache-Control: public, max-age=31536000, immutable
style.7c4e8d2a.css  →  Cache-Control: public, max-age=31536000, immutable
font.woff2          →  Cache-Control: public, max-age=31536000, immutable
hero.webp           →  Cache-Control: public, max-age=31536000, immutable

# 组合 B：HTML 入口
index.html          →  Cache-Control: no-cache
```

**为何这样配**：

- 资源 hash 即版本：内容变 hash 就变、URL 就变；旧 URL 副本永久有效，可一直复用 `max-age=31536000`（web.dev 推荐最大值）
- `immutable` 阻止刷新触发条件请求，省 60% 请求量（Facebook 数据）
- HTML 是资源引用清单，必须每次协商才能拿到新 hash 引用；304 几乎零成本

> **用文件名 hash 而非 query string `?v=2`**：部分老代理 / CDN 不缓存含 `?` 的 URL，文件名 hash 更通用。

### 按资源类型的策略矩阵

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

### `max-age=0, must-revalidate` 等价 `no-cache`

```text
Cache-Control: max-age=0, must-revalidate
Cache-Control: no-cache
```

- 前者是 HTTP/1.0 缓存不支持 `no-cache` 时的回退方案
- 现代浏览器两者行为一致：可存但每次必校验
- 新项目直接写 `no-cache` 即可

## 启发式缓存

**不写 `Cache-Control` ≠ 不缓存**，浏览器与中间缓存会按启发式规则推断新鲜期：

```text
启发式新鲜期 ≈ max(0, (date - last_modified) × 10%)
```

**例**：响应头未设 `Cache-Control`，但 `Last-Modified` 是 100 天前——浏览器可能推断「这资源 10 天没变，给 10 天新鲜期」，结果出乎意料地长。

**应对**：

- **始终显式设置 Cache-Control**——哪怕只是 `no-cache` / `no-store`，别让浏览器自己猜
- 排查「为何这个资源缓存这么久」时，先确认响应头里是否漏了 `Cache-Control`

## Vary 头

```text
Vary: Accept-Encoding, User-Agent
```

- 声明**缓存键依赖的请求头维度**
- 同 URL 但返回不同内容时必配，否则共享缓存会**错发版本**

**典型场景**

| 场景 | Vary 取值 | 防止的错误 |
| --- | --- | --- |
| 压缩协商（gzip / br / identity） | `Accept-Encoding` | 把 br 版错发给不支持 br 的客户端 |
| 设备适配（移动 / 桌面 HTML） | `User-Agent` 或 `Sec-CH-UA-Mobile` | 把桌面版错发给移动用户 |
| 国际化（多语言） | `Accept-Language` | 把英文版错发给中文用户 |
| 客户端提示（DPR / Viewport） | `Sec-CH-UA-Viewport-Width` 等 | 把高分辨率图错发给低端设备 |

> `Vary: User-Agent` 会让 CDN 缓存键数量爆炸（每设备一份）——优先用 `Sec-CH-UA-Mobile` 等客户端提示维度。

## 资源提示详解

### `<link rel="preload">`（当前页关键资源）

```html
<link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
<link rel="preload" href="/critical.css" as="style">
```

- **当前页**就会用到的关键资源，高优先级预拉取
- **必须配 `as`**（如 `script` / `style` / `font` / `image` / `fetch` / `track`）：缺 `as` 资源会被**重复下载一次**，且 `as` 让浏览器应用正确 CSP、Accept、优先级
- **字体必须加 `crossorigin`**：字体强制走 CORS 匿名模式，缺失会让字体下载**两次**（且第二次才可用）
- 与 `fetchpriority="high"` 配合可显著改善 LCP

### `<link rel="prefetch">`（未来导航）

```html
<link rel="prefetch" href="/next-page.js" as="script">
```

- **未来导航可能用到**的资源，**低优先级**，浏览器空闲时下载
- 缓存到 HTTP 缓存，下次导航命中即用
- 流量成本：用户**不一定真访问**，基于分析数据高置信度再用；移动端 / `Save-Data` 用户更谨慎

### `<link rel="preconnect">`（DNS + TCP + TLS）

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

- 提前完成跨源 **DNS 解析 + TCP 握手 + TLS 握手**
- 每条 `preconnect` 都会真开一条 TCP + TLS 连接占 socket——**只对最关键跨源用**（字体 CDN、关键 API 域名）
- Google Fonts 推荐对 `fonts.googleapis.com` 和 `fonts.gstatic.com` 都加 `preconnect`
- 滥用会预开大量连接挤占浏览器 socket 上限，反而拖慢

### `<link rel="dns-prefetch">`（仅 DNS）

```html
<link rel="dns-prefetch" href="https://cdn.example.com">
```

- 只提前解析跨源 **DNS**（不含 TCP / TLS）
- 开销极小，适合「可能访问但不必握手」的第三方域名
- 与 `preconnect` 取舍：只对最关键跨源用 `preconnect`，其他用 `dns-prefetch` 省 socket

### `<link rel="modulepreload">`（ES Module 专用）

```html
<link rel="modulepreload" href="/app.js">
```

- 专门用于 ES Module：预拉取并**解析模块图**（依赖的子模块也一起拉）
- 比 `preload as="script"` 更适合现代 ES Module 项目

### Fetch Priority API（`fetchpriority`）

```html
<img src="/hero.webp" fetchpriority="high">
<iframe src="/ads.html" fetchpriority="low"></iframe>
<script src="/analytics.js" fetchpriority="low"></script>
```

| 取值 | 含义 |
| --- | --- |
| `high` | 显式提升（LCP 图片、关键字体、首屏 CSS） |
| `low` | 显式降级（非关键预取、分析脚本、广告 iframe） |
| `auto`（默认） | 浏览器自决 |

**LCP 图片加 `fetchpriority="high"` 的原理**：浏览器默认给图片低优先级、布局后才提升——分两阶段下载；显式 `high` 让 LCP 图片在**第一下载阶段**就跑，直接改善 LCP 指标。

### 资源提示最佳实践

- `preconnect` 限 ≤ 3-4 个最关键跨源
- `preload` 限当前页关键资源，别滥用
- `prefetch` 基于分析数据高置信度再用
- LCP 图片加 `fetchpriority="high"`
- 字体 preload 必带 `crossorigin`
- Google Fonts 配对：`preconnect` `fonts.googleapis.com` + `fonts.gstatic.com`

## 清空缓存

```text
Clear-Site-Data: "cache"
```

- 浏览器**清空该站点全部缓存**
- 不影响中间缓存（CDN / 代理）
- 适合「登出后清本地数据」「部署后强制刷新」

## 反模式（避坑）

### 指令理解错

- **用 `no-cache` 表达「不缓存」**：允许存储只是每次必校验，真正禁止缓存用 `no-store`
- **同时设 `no-store` 与 `max-age=0, must-revalidate`**：指令冲突时按最严格执行，MDN 明确写「基本等同 `no-store`」，写一长串是无效噪音
- **把 `no-cache` 当成「过期」**：`no-cache` 是「每次必校验」，与「立即过期」语义不同；立即过期应写 `max-age=0, must-revalidate`

### HTML / 资源策略错

- **给 HTML 配 `max-age=31536000`**：HTML 是资源引用清单，长期缓存会导致部署后用户拿不到新版资源引用，只能等缓存自然过期或硬刷新
- **给带 hash 指纹的资源配 `no-cache`**：hash 已保证内容唯一，强制每次协商是浪费往返；应是 `max-age=31536000 + immutable`
- **不设 `Cache-Control`**：默认走启发式，按 `Last-Modified` 时间比例自行推断新鲜期，结果不可控

### 共享缓存语义错

- **个性化 / 认证响应漏加 `private`**：CDN / 共享缓存默认会缓存可缓存的响应，漏加 `private` 会把一个用户的隐私数据返回给另一个用户，**信息泄露**
- **以为「要被 CDN 缓存就必须写 `public`」**：普通响应（无 `Authorization` 头）默认就能被共享缓存；`public` 真正用途是覆盖 `Authorization` 触发的默认私有
- **`Vary` 漏配 `Accept-Encoding`**：同 URL 返回 br / gzip 不同版本时，漏配会把 br 版错发给不支持 br 的客户端

### 资源提示滥用

- **无脑给所有第三方域名都加 `preconnect`**：预开大量 TCP / TLS 连接挤占浏览器 socket 上限，只对真正关键的（字体 CDN、关键图片 CDN）用
- **`preload` 不写 `as`**：缺 `as` 会导致资源重复下载；且 `as` 让浏览器应用正确 CSP、Accept、优先级
- **`preload` 字体不加 `crossorigin`**：字体强制 CORS 匿名模式，缺失会让字体被下载两次，且第二次才真正可用
- **滥用 `prefetch`**：低优先级但确实消耗流量，用户不一定真访问；应基于分析数据高置信度再用

### 协议层错

- **服务端忽略 `If-None-Match` / `If-Modified-Since` 直接返回 200 + 完整 body**：丢失协商缓存优化，白白消耗带宽与用户流量
- **用 `Expires` 或 `Pragma: no-cache` 代替 `Cache-Control`**：HTTP/1.0 字段优先级更低、`Expires` 用绝对时间受客户端时钟漂移影响，新项目一律用 `Cache-Control`
- **用 query string `?v=2` 做版本化**：部分老代理 / CDN 不缓存含 `?` 的 URL，文件名 hash 更通用

## 下一步

- [参考](./reference.md)：完整指令表 / 条件请求头表 / 资源提示表 / 版本支持 / 官方资源
