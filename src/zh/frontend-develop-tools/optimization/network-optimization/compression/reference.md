---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MDN / Nginx / web.dev / RFC 1952·1950·1951·7932·8478 官方文档编写，对照 2026-07 浏览器与 Nginx 稳定版

## 速查

- **算法 token**：`gzip` / `deflate` / `br` / `zstd` / `identity`
- **四算法特性**：gzip（兜底 100%）/ deflate（弃用）/ brotli（HTTPS 文本主流）/ zstd（2026-02 Baseline）
- **三大头**：`Accept-Encoding`（请求）+ `Content-Encoding`（响应）+ `Vary: Accept-Encoding`（响应，缓存键必含）
- **nginx 默认值**：`gzip off` / `gzip_vary off` / `gzip_proxied off` / `gzip_comp_level 1` / `gzip_types` 仅 text/html
- **nginx `gzip_static on` vs `always`**：on 协商发；always 强发（封闭环境才用）
- **级别甜点**：gzip 6（动态） / 9（离线）；brotli 4-6（动态） / 11（离线）
- **不该压**：JPEG/PNG/WebP/AVIF/MP4/WOFF2/.tar.gz
- **Brotli 仅 HTTPS 通告**：明文 HTTP 浏览器不声明 br
- **静态预压缩最佳实践**：构建期生成 `.br`+`.gz`，nginx `brotli_static on; gzip_static on;` 直发，零运行期 CPU
- 完整说明见 [入门](./getting-started.md) / [核心原理与配置](./guide-line.md)

## 四算法完整对比表

| 维度 | gzip | deflate | brotli（br） | zstd |
| --- | --- | --- | --- | --- |
| **RFC** | 1952 | 1950 + 1951 | 7932 | 8478 |
| **发布年** | 1996 | 1996 | 2016 | 2018 |
| **底层算法** | LZ77 + Huffman | raw deflate / zlib | LZ77 变体 + Huffman + 静态字典 | FSE（Huffman 现代变体） |
| **HTTP token** | `gzip` | `deflate` | `br` | `zstd` |
| **level 范围** | 1-9 | 1-9 | 0-11 | 负数到 22 |
| **默认 level** | 1（nginx）/ 6（CLI） | 6 | 6 | 3 |
| **甜点 level** | 6（动态）/ 9（离线） | 6 | 4-6（动态）/ 11（离线） | 3-9（动态）/ 19-22（离线） |
| **压缩率（同级别）** | 基准 | 与 gzip 相当 | 比 gzip 高 15-25% | 与 brotli 11 相当或更高 |
| **压缩速度** | 中 | 中 | level 11 极慢 | 快 |
| **解压速度** | ≈ 500 MB/s | 与 gzip 相当 | 与 gzip 相当 | **>1 GB/s** |
| **浏览器覆盖** | **100%** | 全平台但歧义 | Chrome 50+/Firefox 44+/Edge/Safari 11+ | Chrome 124+/Edge 124+/Firefox/Safari 26+ |
| **Baseline 状态** | 已稳定 | 已稳定 | 已稳定 | 2026-02 进 Baseline |
| **HTTPS 要求** | 否 | 否 | **仅 HTTPS 通告** | 否 |
| **何时用** | 兜底 / 动态 | 不推荐 | 静态文本主力 | 极致压缩率 + 解压速度 |
| **典型场景** | 老客户端 / API | 历史包袱 | JS/CSS/HTML 离线 | 现代 CDN / 大数据 |

## 三大协议头速查

| 头部 | 方向 | 作用 | 示例 |
| --- | --- | --- | --- |
| `Accept-Encoding` | 请求 | 客户端声明支持的算法 | `Accept-Encoding: br;q=1.0, gzip;q=0.8, *;q=0` |
| `Content-Encoding` | 响应 | 服务器告知应用的算法（可叠加） | `Content-Encoding: br` 或 `Content-Encoding: deflate, gzip` |
| `Vary: Accept-Encoding` | 响应 | 缓存键必须包含 Accept-Encoding | `Vary: Accept-Encoding` |

**叠加语义**：`Content-Encoding: deflate, gzip` = 按列出顺序应用（先 deflate 再 gzip），解码反向剥层。

## Nginx 指令清单

### ngx_http_gzip_module（内置，运行期 gzip）

| 指令 | 默认值 | 作用 |
| --- | --- | --- |
| `gzip` | **off** | 开关 |
| `gzip_comp_level` | **1** | 压缩级别 1-9，甜点 6 |
| `gzip_types` | **仅 text/html** | 压缩的 MIME 列表 |
| `gzip_min_length` | 0 | 小于 N 字节不压 |
| `gzip_buffers` | 32 4K | 压缩缓冲区 |
| `gzip_vary` | **off** | 是否输出 `Vary: Accept-Encoding` |
| `gzip_proxied` | **off** | 对代理请求是否压（off/any/no-cache/...） |
| `gzip_http_version` | **1.1** | 起效的 HTTP 版本 |
| `gzip_disable` | 空 | 按 UA 跳过（如 `"MSIE [1-6]\."`） |

### ngx_http_gzip_static_module（编译开关 --with-http_gzip_static_module）

| 指令 | 默认值 | 作用 |
| --- | --- | --- |
| `gzip_static` | **off** | off/on/always：发预压缩 `.gz` |

`on` vs `always`：

- `on`：协商后发 .gz（推荐）
- `always`：无视 Accept-Encoding 一律发 .gz（封闭环境）

### Google ngx_brotli（动态模块）

| 指令 | 默认值 | 作用 |
| --- | --- | --- |
| `brotli` | off | 开关 |
| `brotli_comp_level` | **6** | 压缩级别 0-11 |
| `brotli_types` | **仅 text/html** | 压缩的 MIME 列表 |
| `brotli_buffers` | 16 8K | 压缩缓冲区 |
| `brotli_min_length` | 20 | 小于 N 字节不压 |
| `brotli_static` | off | off/on/always：发预压缩 `.br` |

NGINX Plus 用动态模块：`ngx_http_brotli_filter_module.so` + `ngx_http_brotli_static_module.so`。

## 静态预压缩生成方法

### Vite（vite-plugin-compression2）

```js
import { defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";

export default defineConfig({
  plugins: [
    compression({ algorithm: "brotliCompress", threshold: 1024 }),
    compression({ algorithm: "gzip", threshold: 1024 }),
  ],
});
```

### Webpack（compression-webpack-plugin）

```js
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  plugins: [
    new CompressionPlugin({
      filename: "[path][base].br",
      algorithm: "brotliCompress",
      threshold: 1024,
    }),
    new CompressionPlugin({
      filename: "[path][base].gz",
      algorithm: "gzip",
      threshold: 1024,
    }),
  ],
};
```

### CLI 批量生成

```bash
# 批量生成 .br（level 11）
find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \
                    -o -name "*.svg" -o -name "*.json" \) \
  -exec brotli -q 11 -k {} \;

# 批量生成 .gz（level 9）
find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \
                    -o -name "*.svg" -o -name "*.json" \) \
  -exec gzip -9 -k {} \;
```

## 压缩级别权衡表

| 算法 | level | 压缩速度 | 压缩率 | 解压速度 | 适用 |
| --- | --- | --- | --- | --- | --- |
| gzip | 1 | 极快 | 基准的 70% | ≈ 500 MB/s | 极致吞吐（不推荐，压不实） |
| gzip | **6**（甜点） | 中 | 基准的 75% | ≈ 500 MB/s | **动态响应** |
| gzip | 9 | 慢（3-5x） | 基准的 78% | ≈ 500 MB/s | 离线预压缩 |
| brotli | 4-5 | 快 | 显著优于 gzip 6 | 与 gzip 相当 | 静态轻量 |
| brotli | **6**（默认） | 中 | 比 gzip 6 高 15-20% | 与 gzip 相当 | **动态响应** |
| brotli | 11 | 极慢（10-100x） | 最高（+5-10%） | 与 gzip 相当 | **离线预压缩** |
| zstd | 3（默认） | 极快 | 与 brotli 6 相当 | **>1 GB/s** | 动态响应 |
| zstd | 19-22 | 慢 | 接近 brotli 11 | >1 GB/s | 离线极致 |

**关键性质**：**解压速度与压缩级别基本无关**——压缩耗时随级别近似指数增长，但解压按算法本身的吞吐。

## 不该压缩的资源清单

| 资源 | 为何不压 |
| --- | --- |
| JPEG / PNG / WebP / AVIF / GIF | 内部已用更贴近数据特征的算法压过一轮 |
| MP4 / WebM | 同上，视频编码已高压缩比 |
| WOFF2 | **本身已 brotli 压过** |
| WOFF | 本身已 zlib 压过 |
| `.tar.gz` / `.zip` / `.7z` | 已是压缩档案 |
| 大于 ~1KB 但内部随机的二进制 | 通常压不动，加头反变大 |

> nginx 默认 `gzip_types` 不含这些 MIME 是有道理的，`brotli_types` 同理要限定到 text/javascript/json/svg/xml 等文本类。

## Accept-Encoding q 值速查

```http
Accept-Encoding: br;q=1.0, zstd;q=0.9, gzip;q=0.8, identity;q=0
```

| 写法 | 含义 |
| --- | --- |
| `gzip` 或 `gzip;q=1` | 接受 gzip（q 缺省 = 1.0） |
| `gzip;q=0.8` | 接受但优先级 0.8 |
| `gzip;q=0` | **拒绝** gzip |
| `identity` | 不编码 |
| `identity;q=0` | 拒绝明文（必须编码） |
| `*` | 通配，接受任意编码 |
| `*;q=0` | 拒绝所有未显式声明的 |

**协商规则**：服务器选**客户端已声明且自己支持**的算法中 q 最高的；不得强发未声明算法。

## 版本与 Baseline 状态

| 算法 | Baseline 状态 | 浏览器覆盖 |
| --- | --- | --- |
| gzip | 已稳定（1996） | 全平台 100% |
| deflate | 已稳定但歧义 | 全平台但跨服务器行为不一 |
| brotli | 已稳定（2016-17） | Chrome 50+/Firefox 44+/Edge/Safari 11+ |
| zstd | **2026-02 进 Baseline** | Chrome 124+/Edge 124+/Firefox/Safari 26+（全球 ~77%） |
| Compression Dictionary Transport | 演进中（IETF draft） | Chrome 已 ship，跨浏览器有限 |

**HTTP Archive 统计**：Brotli 在生产环境文本压缩使用率**超过 gzip**（得益于 CDN 与现代浏览器普及）。

## 官方资源

- MDN：[Content-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding) · [Accept-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Encoding) · [Vary](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Headers/Vary)
- web.dev：[Optimize encoding and transfer size of text-based assets](https://web.dev/articles/optimizing-content-efficiency-optimize-encoding-and-transfer)
- nginx：[ngx_http_gzip_module](https://nginx.org/en/docs/http/ngx_http_gzip_module.html) · [ngx_http_gzip_static_module](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html) · [NGINX Plus Brotli 动态模块](https://docs.nginx.com/nginx/admin-guide/dynamic-modules/brotli/)
- RFC：[1952 (gzip)](https://www.rfc-editor.org/rfc/rfc1952) · [1950 (zlib)](https://www.rfc-editor.org/rfc/rfc1950) · [1951 (deflate)](https://www.rfc-editor.org/rfc/rfc1951) · [7932 (Brotli)](https://www.rfc-editor.org/rfc/rfc7932) · [8478 (Zstandard)](https://www.rfc-editor.org/rfc/rfc8478)
- GitHub：[google/brotli](https://github.com/google/brotli) · [google/ngx_brotli](https://github.com/google/ngx_brotli) · [facebook/zstd](https://github.com/facebook/zstd) · [madler/zlib](https://github.com/madler/zlib) · [nginx/nginx](https://github.com/nginx/nginx)
- [Can I use zstd](https://caniuse.com/zstd)
- [MDN Compression Dictionary Transport（前瞻）](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression_dictionary_transport)
