---
layout: doc
outline: [2, 3]
---

# 核心原理与配置

> 基于 MDN / Nginx 官方文档 / web.dev / RFC 1952·1950·1951·7932·8478 编写，对照 2026-07 浏览器与 Nginx 稳定版

## 速查

- **算法 token**：gzip → `gzip`；deflate → `deflate`；brotli → `br`；zstandard → `zstd`；未编码 → `identity`
- **Accept-Encoding 协商**：客户端发 `Accept-Encoding: br;q=1.0, gzip;q=0.8` → 服务器按 q 值与自己支持的算法选最高，**不得强发未声明算法**
- **Content-Encoding 叠加**：`deflate, gzip` = 按列出顺序应用（先 deflate 再 gzip），解码反向剥层
- **Vary:Accept-Encoding 必要性**：同一 URL 因 Accept-Encoding 返回不同字节，缓存必须把它纳入缓存键，否则缓存中毒乱码
- **nginx gzip 关键默认值（全是 off）**：`gzip off` / `gzip_vary off` / `gzip_proxied off` / `gzip_comp_level 1` / `gzip_types` 仅 text/html
- **`gzip_static on` vs `always`**：`on` 走 Accept-Encoding 协商后发 .gz；`always` 无视 Accept-Encoding 一律发 .gz（封闭环境才用）
- **Brotli 仅 HTTPS 通告**：`Accept-Encoding: br` 只出现在 HTTPS 请求里；动态响应警惕 BREACH
- **不该压的二进制**：JPEG/PNG/WebP/AVIF/GIF/MP4/WebM/WOFF2/.tar.gz——二次压缩无收益甚至变大
- **级别甜点**：gzip 6（9 仅多省 1-3% 但 CPU 激增）；brotli 4-5（已显著优于 gzip 6），11 留给离线预压缩
- **Minification ≠ Compression**：Minify 是构建期有损源码改造；Compression 是传输期无损字节流编码，两者叠加
- **zstd 现状**：2026-02 进 Baseline，Safari 26 才追上，生产可用但保留 br/gzip 兜底
- **deflate 跨平台坑**：RFC 2616 说 zlib 但实际服务器常发 raw deflate，新项目跳过

## 算法深度对比

### gzip（RFC 1952，1996）

**底层**：LZ77 滑动窗口（32KB）+ Huffman 编码。**level 1-9**，默认 1，甜点 6。

- **压缩率**：典型文本 70-75%
- **解压速度**：≈ 500 MB/s（与级别基本无关）
- **压缩速度**：level 6 ≈ 50 MB/s，level 9 慢 3-5 倍
- **覆盖**：全平台全浏览器 100% 支持，事实兜底标准
- **token**：`gzip`

**何时用**：动态响应（API/SSR）on-the-fly + 老客户端兜底。

### deflate（RFC 1950 zlib + RFC 1951 raw，1996）

**底层**：raw deflate 是 LZ77+Huffman 裸流；zlib 是 raw deflate 加 2 字节头 + 4 字节 Adler-32 校验。

**HTTP 中的歧义陷阱**：RFC 2616 原文规定 `Content-Encoding: deflate` = zlib 格式（RFC 1950），但实际大量服务器（含历史 IIS）发的是 raw deflate（RFC 1951），浏览器只能靠试错兜底。

- **覆盖**：浏览器都"能解"，但行为不统一
- **何时用**：**新项目不再首选**，直接 gzip/br。除非有特殊历史包袱，否则跳过

> 题目常考"deflate 在 HTTP 中的歧义"，标准答案：RFC 说 zlib 实际常发 raw。

### brotli（RFC 7932，2016）

**底层**：LZ77 变体 + 二阶 Huffman + 内置 120KB Web 静态字典（常见 JS/CSS 关键词预置）+ context modeling。**level 0-11**，默认 6。

- **压缩率**：比 gzip 同级别高 15-25%（文本）
- **解压速度**：与 gzip 相当
- **压缩速度**：level 11 极慢（比 level 6 慢 10-100 倍），**只该离线跑**
- **覆盖**：Chrome 50+ / Firefox 44+ / Edge / Safari 11+ / 所有现代浏览器
- **HTTPS 约束**：`Accept-Encoding: br` 只在 HTTPS 请求里出现
- **token**：`br`

**何时用**：静态文本（JS/CSS/HTML/SVG/JSON）的离线预压缩（level 11）+ 动态 HTTPS 响应 on-the-fly（level 4-6）。

### zstandard / zstd（RFC 8478，2018）

**底层**：Facebook 开源，基于 Finite State Entropy（FSE，Huffman 的现代变体）。**level 负数（极速档）到 22（极限档）**。

- **压缩率**：与 brotli level 11 相当或更高，远超 gzip
- **解压速度**：**> 1GB/s**，比 brotli 快 2-5 倍，移动端省电
- **覆盖**：Chrome 124+ / Edge 124+ / Firefox 已支持 / **Safari 26+ 才追上**（2026-02 进 Baseline，全球支持约 77%）
- **token**：`zstd`

**何时用**：追求最高压缩率 + 最快解压的现代场景；但**必须保留 br/gzip 兜底链**，否则老 Safari/IE/爬虫会断。

## Accept-Encoding 内容协商

### q 值权重语法

```http
Accept-Encoding: br;q=1.0, zstd;q=0.9, gzip;q=0.8, identity;q=0
```

- `q=1.0`：最想要（可省略，缺省即 1.0）
- `q=0`：拒绝
- `*`：通配，接受任意编码
- `identity`：不编码（明文）

### 协商规则

1. 服务器读 `Accept-Encoding` 的算法集合 + q 值
2. 选**客户端已声明**且**自己支持**的算法中 q 最高的
3. 如果所有 q 都 = 0，应返回 `406 Not Acceptable` 或回退 identity（实际多数服务器回退）
4. 服务器**不得**强发客户端未声明的算法（违反 HTTP 内容协商规则）

**服务器优先级建议**：`zstd > br > gzip`（按客户端 q 与算法收益），但必须给 gzip 留后路以兼容老客户端。

> 客户端没声明 br（明文 HTTP / 老 Safari），服务器硬发 br → 浏览器忽略或乱码。

## Content-Encoding 叠加语义

`Content-Encoding` 可叠加多个值，按**列出顺序应用**：

```http
Content-Encoding: deflate, gzip
```

**编码方向**：先 deflate，再 gzip 包外层。
**解码方向**：先解 gzip，再解 deflate（反向剥层）。

实际生产**极少叠加**——单一 brotli 或 gzip 已是最佳点。叠加只会增加 CPU 开销与复杂度，常作为面试题出现而非生产实践。

`identity` 表示未编码（默认值，常省略）。

## Vary: Accept-Encoding 的必要性

**Why**：同一 URL 会因 Accept-Encoding 返回不同字节（gzip/br/zstd/identity 四种版本）。CDN / 浏览器 / 反向代理若不把 Accept-Encoding 纳入**缓存键**，会发生：

1. Chrome 请求带 `Accept-Encoding: br`，服务器返回 brotli 字节流，CDN 缓存
2. 老爬虫请求同一 URL，带 `Accept-Encoding: identity`（不支持 br）
3. CDN 命中缓存，**直接返回 brotli 字节流**
4. 老爬虫解不开 → 乱码或拒绝渲染

这就是**缓存中毒**，生产事故级。

**How**：响应头加 `Vary: Accept-Encoding`，告诉所有缓存"此响应内容随 Accept-Encoding 变化"，缓存键必须包含它。

```http
HTTP/2 200
Content-Encoding: br
Vary: Accept-Encoding
Cache-Control: public, max-age=31536000, immutable
```

**Nginx 注意**：

- `gzip on` 不会自动开 `gzip_vary`（默认 off）
- **必须显式** `gzip_vary on;`
- brotli 模块默认会带 Vary，但建议显式确认

> 反模式：开启压缩但忘开 `gzip_vary on`（默认 off）→ CDN 把压缩版缓存到不支持的客户端 → 局部乱码。这是生产中最常见的压缩配置事故。

## Nginx 完整配置

### 运行期 gzip（ngx_http_gzip_module，内置）

```nginx
http {
  # 开关：默认 off，必须显式 on
  gzip on;

  # 压缩级别：默认 1，甜点 6（动态响应）
  gzip_comp_level 6;

  # 压缩哪些 MIME：默认仅 text/html，必须显式加
  gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/json
    application/xml
    application/xml+rss
    application/atom+xml
    image/svg+xml;

  # 小于 N 字节不压：典型 1024
  gzip_min_length 1024;

  # 必须 on，输出 Vary: Accept-Encoding（默认 off！）
  gzip_vary on;

  # 对代理请求是否压：常用 any 或 no-cache
  gzip_proxied any;

  # 起效的 HTTP 版本：默认 1.1
  gzip_http_version 1.1;

  # 按 UA 跳过：常用于旧 IE
  gzip_disable "MSIE [1-6]\.";
}
```

**默认值速查（重要，常考）**

| 指令 | 默认值 | 生产建议 |
| --- | --- | --- |
| `gzip` | **off** | `on` |
| `gzip_vary` | **off** | `on`（必须显式） |
| `gzip_proxied` | **off** | `any` |
| `gzip_comp_level` | **1** | `6`（甜点） |
| `gzip_types` | **仅 text/html** | 加 css/js/json/svg/xml |
| `gzip_min_length` | 0（都压） | `1024` |
| `gzip_http_version` | **1.1** | 1.1 |

### 静态预压缩（ngx_http_gzip_static_module）

需编译开关 `--with-http_gzip_static_module`，开箱即用：

```nginx
http {
  # on：协商后发 .gz；always：无视 Accept-Encoding 一律发 .gz
  gzip_static on;
}
```

**`on` vs `always` 的区别**

| 取值 | Accept-Encoding 协商 | 适用 |
| --- | --- | --- |
| `off` | 不发 .gz | 关闭 |
| `on` | 协商后发 .gz（推荐） | 大多数场景 |
| `always` | **无视** Accept-Encoding 一律发 .gz | 仅封闭环境，确认所有客户端都支持 |

> `always` 适合内网或自有客户端的封闭 API；公网服务千万别用，会破坏不支持 gzip 的客户端。

### Brotli（Google ngx_brotli 动态模块）

需自行编译或用 NGINX Plus 动态模块 `ngx_http_brotli_filter_module.so` + `ngx_http_brotli_static_module.so`。

```nginx
http {
  # 运行期 brotli
  brotli on;
  brotli_comp_level 6;       # 默认 6，甜点 4-6，极致 11（仅离线）
  brotli_min_length 1024;
  brotli_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/json
    application/xml
    image/svg+xml;

  # 静态预压缩
  brotli_static on;
}
```

**brotli 默认值**：`brotli_comp_level` 默认 6，`brotli_min_length` 默认 20，`brotli_types` 默认仅 text/html。

### 完整生产配置

```nginx
http {
  # —— gzip ——
  gzip on;
  gzip_comp_level 6;
  gzip_vary on;
  gzip_proxied any;
  gzip_http_version 1.1;
  gzip_min_length 1024;
  gzip_types text/plain text/css text/xml text/javascript
             application/javascript application/json
             application/xml image/svg+xml;
  gzip_static on;             # 优先发 .gz 预压缩文件
  gzip_disable "MSIE [1-6]\.";

  # —— brotli ——
  brotli on;
  brotli_comp_level 6;
  brotli_min_length 1024;
  brotli_types text/plain text/css text/xml text/javascript
               application/javascript application/json
               application/xml image/svg+xml;
  brotli_static on;           # 优先发 .br 预压缩文件

  server {
    listen 443 ssl http2;
    server_name example.com;

    # 静态资源
    location ~* \.(js|css|svg|json|html)$ {
      # brotli_static 与 gzip_static 已在 http 块开启
      # 优先级：brotli_static > gzip_static > on-the-fly
      add_header Cache-Control "public, max-age=31536000, immutable";
    }
  }
}
```

**优先级**：`brotli_static` > `gzip_static` > `brotli` (on-the-fly) > `gzip` (on-the-fly)。

## 构建期预压缩产物（推荐做法）

**Vite（vite-plugin-compression2）**

```js
// vite.config.ts
import { defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";

export default defineConfig({
  plugins: [
    // 同时生成 .br 和 .gz
    compression({ algorithm: "brotliCompress", threshold: 1024 }),
    compression({ algorithm: "gzip", threshold: 1024 }),
  ],
});
```

**Webpack（compression-webpack-plugin）**

```js
// webpack.config.js
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

**CLI 手动批量**：

```bash
# 批量生成 .br（level 11）
find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" -o -name "*.json" \) \
  -exec brotli -q 11 -k {} \;

# 批量生成 .gz（level 9）
find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" -o -name "*.json" \) \
  -exec gzip -9 -k {} \;
```

## 压缩级别权衡（甜点表）

| 算法 | 动态响应（on-the-fly） | 静态预压缩（离线） | 备注 |
| --- | --- | --- | --- |
| **gzip** | level 4-6 | level 9 | 9 仅多省 1-3%，CPU 激增 |
| **brotli** | level 4-6 | level 11 | 4-5 已显著优于 gzip 6 |
| **zstd** | level 3-9 | level 19-22 | 极限档需显式 unlock |

**关键性质**：**解压速度与压缩级别基本无关**——压缩耗时随级别近似指数增长，但解压仍按算法本身的吞吐。所以静态资源宁可用高级别离线压，移动端解压依然快。

## 不该压缩的二进制资源

下列格式内部已用更贴近数据特征的算法压过一轮，再套 gzip/br 通常**压不动甚至因加头变大**，纯浪费 CPU：

- **图片**：JPEG / PNG / WebP / AVIF / GIF
- **视频**：MP4 / WebM
- **字体**：**WOFF2 本身已 brotli 压过**；WOFF 已 zlib；只有 TTF/OTF 可受益
- **已压缩档案**：`.tar.gz` / `.zip` / `.7z` / `.rar`

**Nginx 默认 `gzip_types` 不含这些 MIME 是有道理的**，`brotli_types` 同理要限定到 text 类。

## 压缩 vs Minification（关键区别）

| 维度 | Minification（代码压缩） | Compression（传输压缩） |
| --- | --- | --- |
| **阶段** | 构建期 | HTTP 传输层 |
| **对象** | 源码（JS/CSS/HTML） | 字节流 |
| **是否可逆** | **不可逆**（注释/原名丢失） | **可逆**（解压精确还原） |
| **工具** | Terser / esbuild / SWC / lightningcss / cssnano | gzip / brotli / zstd |
| **代表改写** | `function f(){return true;}` → `function f(){return!0}` | 字节流编码 |
| **收益** | 30-50% | 60-80%（叠加） |

**叠加收益**：

```text
100KB 原始 JS
   ↓ minify（去空白/注释/缩短变量）
 70KB minified
   ↓ brotli level 11（传输编码）
 25KB 传输字节
   ↓ 浏览器解压
 70KB minified
   ↓ JS 引擎解析执行
```

> 只做压缩不做 minify = 把大量可省的空白也喂给压缩器白算；只做 minify 不做压缩 = 错过 60-80% 的字节数节省。**两层都开**。

## 反模式（避坑）

- **无脑 `gzip_comp_level 9` 用于动态响应**：CPU 成本远超收益，TTFB 飙升拖垮吞吐；高 level 只该离线预压缩静态产物
- **开压缩但忘开 `gzip_vary on`**（默认 off）：Vary: Accept-Encoding 缺失 → CDN/反向代理把压缩版缓存到不支持的客户端 → 局部乱码（生产事故级）
- **对图片/视频/字体也开压缩**（`gzip_types image/* application/font`）：二次压缩无效甚至变大，浪费 CPU；尤其 WOFF2 本身已 brotli 压过
- **不看 Accept-Encoding 就强发 br/zstd**：违反 HTTP 内容协商规则，老客户端/爬虫直接乱码或拒绝渲染
- **信任 `Content-Encoding: deflate` 跨平台互通**：RFC 2616 说 deflate = zlib（RFC 1950），但实际很多服务器发 raw deflate（RFC 1951），浏览器只能试错兜底——新项目应直接用 gzip/br
- **把传输压缩当 Minification 用**（或反之）：Minify 是构建期有损源码改造（不可逆还原注释/变量名），Compression 是传输期无损字节流（解码出原字节）；混淆二者会答错题目也会写错优化方案
- **以为开了 brotli 就不用 gzip**：zstd/br 在老 Safari、IE、旧 Android WebView、部分爬虫上仍不支持，必须保留 gzip 兜底链；Can I Use 显示 zstd 2026 年才进 Baseline（Safari 26 才追上）
- **本地 `http://localhost` 调试看不到 brotli 误以为配错**：浏览器明文 HTTP 不发 `Accept-Encoding: br`，必须 HTTPS 才能验证 brotli
- **`gzip_static always`**：无视 Accept-Encoding 一律发 .gz，公网服务会破坏不支持 gzip 的客户端，仅在封闭环境使用

## 下一步

- [参考](./reference.md)：算法对比表、Nginx 指令清单、官方资源
