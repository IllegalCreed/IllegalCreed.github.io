---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MDN / Nginx / web.dev / RFC 1952·1950·1951·7932·8478 官方文档编写，对照 2026-07 浏览器与 Nginx 稳定版行为

## 速查

- **传输压缩定义**：HTTP 响应字节流送出网络前做**无损编码**减字节数，浏览器自动解压
- **四大算法**：**gzip**（RFC 1952，全平台 100%，事实兜底）/ **deflate**（RFC 1950/1951，HTTP 中有歧义，新项目弃用）/ **brotli**（RFC 7932，level 0-11，仅 HTTPS 通告，文本压缩率最高）/ **zstd**（RFC 8478，解压 >1GB/s，2026-02 进 Baseline，Safari 26 才追上）
- **三大协议头**：`Accept-Encoding`（请求，客户端声明）/ `Content-Encoding`（响应，服务器告知）/ `Vary: Accept-Encoding`（响应，告诉缓存必须把它纳入缓存键）
- **协商规则**：客户端发 `Accept-Encoding: br;q=1.0, gzip;q=0.8` → 服务器按 q 值与自己支持的算法选最高，**不得强发未声明算法**
- **叠加语义**：`Content-Encoding: deflate, gzip` = 按列出顺序应用（先 deflate 再 gzip），解码反向剥层
- **Brotli 仅 HTTPS**：`Accept-Encoding: br` 只出现在 HTTPS 请求里；明文 HTTP 浏览器不声明，服务器强发会被忽略
- **Nginx 关键指令**：`gzip on|off`（默认 **off**）/ `gzip_comp_level 1-9`（默认 1，甜点 6）/ `gzip_types`（默认仅 text/html）/ `gzip_vary on|off`（默认 **off**，必须显式开）
- **静态预压缩最佳实践**：构建期生成 `.br`（`brotli -q 11`）和 `.gz`（`gzip -9`），`brotli_static on; gzip_static on;` 直发，零运行期 CPU
- **不该压的二进制**：JPEG/PNG/WebP/AVIF/MP4/WOFF2（WOFF2 本身已 brotli 压过）
- **级别权衡**：gzip 6 是甜点（9 仅多省 1-3% 但 CPU 激增）；brotli 4-5 已显著优于 gzip 6，11 留给离线预压缩
- **边界**：Minification（构建期源码改造）属 [code-optimization/minification](../../code-optimization/minification/) 叶；本章只讲传输层字节流压缩

## 传输压缩是什么

**传输压缩（HTTP Compression）** 是 HTTP 响应在送出网络前对其字节流做一次无损编码以减小字节数的过程。服务器用 `Content-Encoding` 响应头声明所用算法，浏览器收到后自动解压——开发者写代码时**完全不需要处理解压逻辑**，只需配置服务器或构建产物。

它与以下概念易混淆但本质不同：

| 概念 | 阶段 | 干什么 | 是否可逆 |
| --- | --- | --- | --- |
| **传输压缩（gzip/brotli）** | 传输层 | 字节流无损编码 | **可逆**，解压精确还原原字节 |
| **代码压缩（Minification）** | 构建期 | 源码语法等价改写 | **不可逆**，注释/原名丢失 |
| **Tree shaking** | 打包期 | 删未引用导出（DCE） | 不可逆，删的就是死代码 |
| **HTTP/2 HPACK / HTTP/3 QPACK** | HTTP/2·3 头部 | 专压 header | 与 body 压缩是两套机制 |
| **资源优化** | 构建期 | 图片/字体编码优化 | 与文本压缩不同范畴 |

> 传输压缩 vs Minification：两者**正交叠加**，互不替代。100KB JS 源码 → minify 70KB → gzip 25KB，两层都开才是完整收益。

## 为何要传输压缩

- **下载更快**：JS/CSS/HTML/SVG/JSON 普遍可压 70% 以上，移动网络与弱网尤其受益
- **TTFB 之后的内容传输时间下降**：字节少了，TCP 传完的 RTT 数显著减少（尤其 HTTP/1.1 多请求串行场景）
- **节省带宽成本**：CDN 流量、服务器带宽都是钱，压缩后乘以 QPS 收益可观
- **缓存友好**：更小的响应利于浏览器 / CDN 缓存命中
- **SEO 间接加分**：Core Web Vitals 是搜索排名信号，压缩直接拉快 FCP/LCP

> web.dev 官方原话：压缩文本资源是 Content Efficiency 优化里 ROI 最高的一档。

## 四大算法速览

| 算法 | RFC / 年 | level 范围 | 浏览器覆盖 | 主要特点 |
| --- | --- | --- | --- | --- |
| **gzip** | RFC 1952 / 1996 | 1-9 | 全平台 100% | LZ77+Huffman，事实兜底标准 |
| **deflate** | RFC 1950/1951 / 1996 | 1-9 | 全平台但**有歧义** | zlib(RFC1950) 包 raw deflate(RFC1951)，HTTP 中服务器行为不一 |
| **brotli**（br） | RFC 7932 / 2016 | 0-11 | Chrome 50+/Firefox 44+/Edge/Safari 11+，**仅 HTTPS 通告** | 内置 Web 静态字典，文本压缩率最高 |
| **zstd** | RFC 8478 / 2018 | 负数到 22 | Chrome 124+/Edge 124+/Firefox/Safari 26+，2026-02 进 Baseline | 解压 >1GB/s，移动端省电 |

**一句话选型**：

- 老客户端兜底：**gzip**
- 现代文本压缩主力：**brotli**（HTTPS 才通告）
- 追求最快解压 + 最高压缩率：**zstd**（但需保留 br/gzip 兜底链）

> deflate 的「坑」：RFC 2616 原文说 deflate = zlib 格式（RFC 1950），但实际大量服务器（含历史 IIS）发的是 raw deflate（RFC 1951），浏览器只能靠试错兜底——新项目应直接用 gzip/br，跳过 deflate。

## 三大协议头

| 头部 | 方向 | 作用 |
| --- | --- | --- |
| `Accept-Encoding` | 请求 | 客户端声明支持的算法集合，可带 `q` 权重 |
| `Content-Encoding` | 响应 | 服务器告知对实体应用了哪种算法 |
| `Vary: Accept-Encoding` | 响应 | 告诉缓存此响应随 Accept-Encoding 变化 |

**典型协商流程**

```text
1. 浏览器发请求：
   GET /app.js HTTP/2
   Accept-Encoding: br;q=1.0, zstd;q=0.9, gzip;q=0.8, identity;q=0

2. 服务器选最高 q 且自己支持的算法（zstd 未配 → 选 br）

3. 服务器返回：
   HTTP/2 200
   Content-Encoding: br
   Content-Length: 25301
   Vary: Accept-Encoding
   <brotli 字节流>

4. 浏览器按 Content-Encoding 自动解压
```

**q 值含义**：1.0 = 最想要，0 = 拒绝。`*` 通配表示接受任意编码。`identity` 表示不编码。

> 服务器**不得**强发客户端未声明的算法。否则老客户端/爬虫直接乱码或解码失败。

## 叠加语义（常考点）

`Content-Encoding` 可以多个值叠加，按**列出顺序**应用：

```text
Content-Encoding: deflate, gzip
```

含义：先 deflate 压，再 gzip 压外层；解码时**反向剥层**——先解 gzip，再解 deflate。实际生产极少叠加，单一 brotli 或 gzip 已是最佳点。

## Brotli 的 HTTPS 约束

浏览器**只在 HTTPS 请求里**才会发出 `Accept-Encoding: br`。这是历史安全设计：避免 BREACH / CRIME 类时序攻击利用压缩比推断加密通道上的明文。明文 HTTP 上：

- 浏览器**不声明** br
- 服务器**强行发** br 浏览器会忽略或解码失败
- 所以本地 `http://localhost` 调试看不到 brotli，必须 HTTPS 才能验证

> 含敏感参数的动态响应（如带用户 token 的 HTML / API）即使在 HTTPS 上做动态 brotli，也要警惕 BREACH 类攻击——这是为什么很多安全团队建议动态响应用低级别 brotli（4-5）或仅 gzip。

## 静态预压缩 vs 运行期压缩

| 维度 | 静态预压缩（推荐） | 运行期 on-the-fly |
| --- | --- | --- |
| **CPU 开销** | 0（构建期一次性付） | 每请求都压 |
| **可用级别** | brotli 11 / gzip 9（极致） | brotli 4-6 / gzip 4-6（权衡 CPU） |
| **延迟** | 直接发文件，TTFB 不受影响 | 高级别压动态内容会拖 TTFB |
| **适用** | 静态产物（JS/CSS/SVG/JSON） | 动态响应（API/SSR HTML） |
| **配置** | `brotli_static on; gzip_static on;` | `brotli on; gzip on;` |

**构建期生成 `.br` 和 `.gz`**：

```bash
# brotli CLI（level 11 极致）
brotli -q 11 -k dist/assets/app.js
# 产出 dist/assets/app.js.br

# gzip（level 9）
gzip -9 -k dist/assets/app.js
# 产出 dist/assets/app.js.gz
```

**Nginx 直发预压缩文件**：

```nginx
http {
  gzip_static on;     # 有 .gz 就直发，跳过运行期 gzip
  brotli_static on;   # 有 .br 就直发
}
```

> Vite 5+ 可用 `vite-plugin-compression2`、Webpack 用 `compression-webpack-plugin`，在 build 阶段批量生成 `.br`/`.gz`。

## 下一步

- [核心原理与配置](./guide-line.md)：算法深度对比、Accept-Encoding 协商细节、Vary 必要性、Nginx 完整配置、压缩 vs Minification、反模式
- [参考](./reference.md)：算法对比表、Nginx 指令清单、官方资源
