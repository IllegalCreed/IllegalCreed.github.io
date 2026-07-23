---
layout: doc
---

# 压缩

HTTP 传输压缩是**在响应字节流送出网络前，对其做一次无损编码以减小字节数**的过程，由 `Content-Encoding` 响应头声明所用算法，客户端按 `Accept-Encoding` 请求头声明自己支持的算法集合，服务器据此做内容协商。前端真正会撞上的四种算法是 **gzip**（RFC 1952，1996，LZ77+Huffman，全平台 100% 支持，事实兜底标准）、**deflate**（RFC 1950/1951，HTTP 中因 zlib/raw 歧义被现代实践逐渐弃用）、**brotli**（RFC 7932，2016，内置 Web 静态字典，仅 HTTPS 通告，已是生产文本压缩主流——HTTP Archive 统计使用率超过 gzip）、**zstandard**（RFC 8478，2018，解压 >1GB/s，Chrome 124+ / Edge 124+ / Firefox 已支持，Safari 26 才加入，2026-02 进入 Baseline，生产可用但需保留 br/gzip 兜底）。配套的核心协议头有三：`Accept-Encoding`（请求头，客户端宣告支持的算法，可带 `q` 权重，如 `br;q=1.0, gzip;q=0.8`）、`Content-Encoding`（响应头，服务器告知应用的算法，可叠加，如 `Content-Encoding: deflate, gzip` 表示按列出顺序依次应用，解码反向剥层）、`Vary: Accept-Encoding`（响应头，告诉缓存此响应随 Accept-Encoding 变化，必须把它纳入缓存键——缺失会让 CDN/代理把压缩版返给不支持该编码的客户端，生产事故级缓存中毒）。服务器侧最常见的是 **Nginx** 三模块：`ngx_http_gzip_module`（内置，运行期 gzip）、`ngx_http_gzip_static_module`（编译开关 `--with-http_gzip_static_module`，直发 `.gz` 预压缩文件）、Google `ngx_brotli`（动态模块，运行期 brotli + `brotli_static` 发预压缩 `.br`）。生产最佳实践是**构建期预压缩双产物**：用 `brotli -q 11 -k file.js` 和 `gzip -9 -k file.js` 离线生成 `.br` 和 `.gz`，交给 nginx `brotli_static on; gzip_static on;` 直发，零运行期 CPU——brotli level 9-11 压缩极慢，绝不用于 on-the-fly 动态请求。**边界**：本叶只讲传输层字节流压缩（无损，可还原原字节）；构建期对源码的语法改造（Terser/esbuild/cssnano 删空白/注释/缩短变量名/常量折叠）属[代码优化 / 代码压缩](../../code-optimization/minification/) 叶，两者**叠加使用**，互不替代——先 minify 把源码降到最小，再 brotli/gzip 压这个最小化后的字节流，乘性收益最大（典型 100KB JS → 压缩 70KB → gzip 25KB）。

## 评价

**优点**

- **零客户端逻辑**：浏览器原生解压，开发者只需配服务器/构建产物
- **直接省字节 = 直接省时间**：JS/CSS/HTML/SVG/JSON 普遍可压 70% 以上，移动网络尤其受益
- **算法分层兜底**：zstd > br > gzip 的优先级协商，新客户端享受高压缩率，老客户端仍有 gzip 兜底
- **静态预压缩零运行期成本**：构建期 `.br`/`.gz` 双产物交给 `brotli_static`/`gzip_static` 直发，CPU 0 开销
- **解压速度与级别无关**：brotli level 11 离线压出的文件，解压速度与 level 1 基本一致——所以静态资源宁可用高级别离线压
- **与缓存正交**：Vary:Accept-Encoding 配合 ETag/Cache-Control，能安全地与 CDN/Service Worker 缓存联动

**缺点**

- **共享缓存语义复杂**：忘开 `gzip_vary on`（默认 off）会丢 `Vary: Accept-Encoding`，CDN 把压缩版串给不支持客户端 → 局部乱码
- **动态压缩吃 CPU**：高 level（gzip 9 / brotli 11）on-the-fly 压缩 TTFB 飙升，吞吐骤降，只该离线跑
- **二进制二次压缩无效甚至变大**：JPEG/PNG/WebP/AVIF/MP4/WOFF2 已是高压缩比格式，再套 gzip/br 多半压不动且因加头变大，纯浪费 CPU
- **deflate 跨平台坑**：RFC 2616 说 deflate = zlib（RFC 1950），但实际很多服务器发 raw deflate（RFC 1951），浏览器只能试错兜底——新项目应直接用 gzip/br
- **Brotli 仅 HTTPS 通告**：`Accept-Encoding: br` 只在 HTTPS 请求里出现，明文 HTTP 上发 br 浏览器忽略；动态压缩含敏感参数的响应还要警惕 BREACH 类时序攻击
- **zstd 浏览器侧覆盖未达 100%**：Safari 26 才追上，老 Safari/IE/部分爬虫必须留 br/gzip 兜底链
- **小响应压缩净亏**：< 1KB 响应因 HTTP/2+ 帧头 + 字典开销，压缩后可能更大且耗 CPU

## 文档地址

- [MDN Content-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding)
- [MDN Accept-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Encoding)
- [MDN Vary](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Headers/Vary)
- [web.dev — Optimize encoding and transfer size of text-based assets](https://web.dev/articles/optimizing-content-efficiency-optimize-encoding-and-transfer)
- [nginx ngx_http_gzip_module](https://nginx.org/en/docs/http/ngx_http_gzip_module.html) · [ngx_http_gzip_static_module](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html)
- [Google ngx_brotli](https://github.com/google/ngx_brotli) · [NGINX Plus Brotli 动态模块](https://docs.nginx.com/nginx/admin-guide/dynamic-modules/brotli/)
- [RFC 1952 (gzip)](https://www.rfc-editor.org/rfc/rfc1952) · [RFC 1950 (zlib)](https://www.rfc-editor.org/rfc/rfc1950) · [RFC 1951 (deflate)](https://www.rfc-editor.org/rfc/rfc1951) · [RFC 7932 (Brotli)](https://www.rfc-editor.org/rfc/rfc7932) · [RFC 8478 (Zstandard)](https://www.rfc-editor.org/rfc/rfc8478)
- [Can I use zstd](https://caniuse.com/zstd) · [MDN Compression Dictionary Transport](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression_dictionary_transport)

## GitHub地址

[google/brotli](https://github.com/google/brotli) · [google/ngx_brotli](https://github.com/google/ngx_brotli) · [facebook/zstd](https://github.com/facebook/zstd) · [madler/zlib](https://github.com/madler/zlib) · [nginx/nginx](https://github.com/nginx/nginx)

## 幻灯片地址

<a href="/SlideStack/compression-slide/" target="_blank">压缩</a>

## 测试题


<a href="https://quiz.illegalscreed.cn/?category=684" target="_blank" rel="noopener noreferrer">压缩 测试题</a>

## 相关章节

- **代码优化 / 代码压缩（Minification）**：构建期对源码的语法改造，与本章传输层压缩正交叠加，归 [code-optimization/minification](../../code-optimization/minification/)
- **HTTP 缓存**：本章只引用 `Vary: Accept-Encoding` 与缓存联动；Cache-Control / ETag / 强/协商缓存归 HTTP 缓存叶
- **HTTP/2 / HTTP/3**：HPACK / QPACK 是头部压缩（专对 header），与本章 body 内容压缩是两套机制，不混
- **Compression Dictionary Transport（共享字典，IETF draft-ietf-httpbis-compression-dictionary）**：新兴特性，Chrome 已 ship，跨浏览器支持有限，标准演进中，属前瞻内容

## 学习路径

- [入门](./getting-started.md)：定位、为何传输压缩、gzip/brotli/zstd 速览
- [核心原理与配置](./guide-line.md)：算法对比、Content-Encoding/Accept-Encoding 协商、Vary 必要性、Nginx 配置、压缩 vs Minification、反模式
- [参考](./reference.md)：算法对比表、服务器配置、官方资源链接
