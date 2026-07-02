---
layout: doc
outline: [2, 3]
---

# 观测与清除

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **Size 栏四标签**：`(memory cache)` / `(disk cache)` / `(prefetch cache)` / `(ServiceWorker)`——有括号＝没出网络；**304 要看 Status 栏**（Size 只有几百字节的头部传输量）。
- **Size 栏两行**：上行**传输量**（压缩后 + 头）、下行**资源真实大小**（解压后）。
- **Disable cache**：只在 **DevTools 打开期间**生效，禁的是 HTTP 缓存（memory+disk）；**不禁 Cache API**——SW 要另勾 Application → Service workers → **Bypass for network**。
- **Application 面板三件套**：**Cache storage**（看/删 Cache API 条目）、**Storage → Clear site data**（一键清本源各类数据）、**Back/forward cache**（bfcache 测试）。
- **`Clear-Site-Data` 响应头**：服务端远程清客户端数据；指令**必须带双引号**（`"cache"`），仅 HTTPS；头本身 Chrome 61 / Firefox 63 / Safari 17 起支持。
- **指令**：`"cache"` / `"cookies"` / `"storage"` / `"clientHints"` / `"executionContexts"` / `"prefetchCache"` / `"prerenderCache"` / `"*"`。
- **兼容重灾区**：`"cache"`——Firefox **63~94 支持 → 94 移除 → 138 恢复**；Chrome 标注 partial（已知 bug：本标签页不重新加载时部分请求仍走缓存、可能秒级卡顿）；`"executionContexts"` 目前**三家都不支持**。
- **`"cookies"` 范围最大**：清**整个注册域含全部子域**的 Cookie 与 HTTP 认证凭据；其余指令按**源**清。
- **登出推荐**：`Clear-Site-Data: "cache", "cookies", "storage"`（可再加 `"prefetchCache", "prerenderCache"`）。
- **用户「清除浏览数据」**：「缓存的图片和文件」→ HTTP 缓存；「Cookie 及其他网站数据」→ Cookie + 各类存储 + **Cache API + SW 注册**；bfcache 是纯内存快照，不在任何清单里，随导航/超时/重启自然消亡。

## 一、DevTools Network：Size 栏判读

Network 面板每行的 **Size 栏**回答「这个资源到底从哪来」：

| Size 栏显示 | 来源层 | 出网络了吗 | 常见场景 |
| --- | --- | --- | --- |
| `(memory cache)` | 渲染进程内存 | 否 | 同页复用的图片、刚 preload 的资源；Time≈0ms |
| `(disk cache)` | HTTP 缓存（磁盘） | 否 | 二次访问、新开标签页访问；强缓存新鲜期内 |
| `(prefetch cache)` | 预取暂存 | 之前取的 | `<link rel="prefetch">` 拉回的下一页资源被认领 |
| `(ServiceWorker)` | Cache API / SW 构造的响应 | 否（由 SW 兑现） | PWA、SW 拦截的任何请求 |
| 具体字节数 | 网络 | **是** | Status 200 全量下载；**Status 304** 时字节数只是头部往返（协商命中） |

配套细节：

- **两行数字**：开启 Big request rows（或看 tooltip）后，Size 上行是**实际传输量**（含压缩与响应头），下行是**资源解压后大小**——两者差距就是压缩与缓存的功劳。
- **304 的判读位置在 Status 栏**：Size 栏不会出现「(304)」标签；Status `304` + 几百字节传输 = 发了条件请求、服务端确认未变（流程见 [HTTP 缓存的浏览器侧落地](./http-cache-landing)）。
- **Disable cache 的真实边界**：勾上后（且 DevTools 开着）HTTP 缓存整体旁路，用于「模拟首访用户」；但它**管不到 Cache API**——SW 控制的页面照样 `(ServiceWorker)`。要完全素颜，需再去 Application → Service workers 勾 **Bypass for network**（请求越过 SW 直连网络）。
- 过滤技巧：filter 输入框支持 `is:from-cache`（筛出各类缓存命中）与 `larger-than:` 等条件，核对缓存覆盖率时好用。

::: tip 观察缓存的三个配套开关
**Preserve log**（跨导航保留记录，追「跳转后资源从哪来」必开）、**Big request rows**（Size 栏两行显示）、以及审长列表时把扩展注入的请求过滤掉（filter 更多选项里隐藏扩展 URL）——扩展流量常污染「缓存命中率」的目测结论。
:::

## 二、Application 面板：查看与一键清

- **Cache storage**：列出本源全部具名 Cache（`static-v3` 之类），逐条查看 Request/Response、右键删除单条或整仓——验证 [SW 缓存版本化](./sw-cache-api)是否收尸干净就看这里。旧版本缓存仓赖着不走，是「发版后 Cache storage 里躺着 v1~v7 七个仓」这类配额慢性病的直接证据。
- **Storage → Clear site data**：按复选框一键清空本源的 Cookie、各类 Storage、Cache storage、**并可注销 Service Worker**——开发期「我想彻底从零来一遍」的正确姿势（比手动挨个删可靠）。同视图还有本源**存储用量**分布（Cache storage 占了多少配额一目了然，配额体系见[浏览器存储](../../browser-storage/)）。
- **Back/forward cache**：bfcache 专用测试入口，Run Test 自动「离开再返回」并报告阻断原因（详见 [bfcache](./bfcache)）。

## 三、`Clear-Site-Data` 响应头：服务端远程清除

用户点「退出登录」，你怎么保证这台设备上**缓存里的私有页面**、localStorage 里的残留也被清掉？[`Clear-Site-Data`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data) 响应头让服务端下达清除指令：

```http
HTTP/1.1 200 OK
Clear-Site-Data: "cache", "cookies", "storage"
```

语法铁律：**每个指令必须是带双引号的字符串**（quoted-string 文法，裸写无效）；仅 HTTPS 安全上下文生效。

| 指令 | 清什么 | 兼容（Chrome / Firefox / Safari） |
| --- | --- | --- |
| `"cache"` | 本源的浏览器缓存；视浏览器还可能连带预渲染页、**bfcache**、脚本缓存、着色器缓存等 | Chrome 61 起但**长期 partial**（127 起仍有「当前标签页不重载则部分请求照走缓存」与秒级卡顿两个已知 bug）；Firefox **63→94 移除→138 恢复**；Safari 17 |
| `"cookies"` | **整个注册域（含所有子域）**的 Cookie + HTTP 认证凭据 | Chrome 61 / Firefox 63 / Safari 17，三家稳定 |
| `"storage"` | 本源全部 DOM 存储：localStorage、sessionStorage、IndexedDB（逐库删除）、**注销 Service Worker**、FileSystem API 等 | Chrome 61 / Firefox 63 / Safari 17，三家稳定 |
| `"clientHints"` | 本源经 `Accept-CH` 登记的客户端提示（`"cache"`/`"cookies"`/`"*"` 会顺带清） | 仅 Chrome 117+ |
| `"executionContexts"` | 重载本源所有浏览上下文（`Location.reload`） | **目前无人支持**：Chrome 未实现；Firefox 63~68 后移除；Safari 17~18.3 后移除 |
| `"prefetchCache"` / `"prerenderCache"` | 投机加载（speculation rules）的预取/预渲染结果 | 仅 Chrome 138+ |
| `"*"` | 以上全部 + 未来新增类型 | Chrome 117+（partial，同 `"cache"` 的 bug）/ Firefox 63 / Safari 17 |

实战建议：

- **登出场景**：`"cache", "cookies", "storage"` 三件套起步；用了投机加载再补 `"prefetchCache", "prerenderCache"`（防止预渲染页里还带着登录态）。
- **`"cache"` 别当精确武器**：Chrome 的 partial 实现意味着「发了头 ≠ 该标签页立刻不用旧缓存」；修复「错发长缓存」事故时它只是辅助，根治仍靠[资源版本化](./http-cache-landing)。
- **作用域记清**：只有 `"cookies"` 波及整个注册域（连子域），其余按响应 URL 的**源**清——多子域架构下登出接口放哪个域名要想清楚。
- **验证生效**：给登出接口加头后，在 DevTools 里走一遍登出流程，Network 确认响应头带上了（引号正确），再到 Application 面板核对 Cookie 列表、Cache storage、Local storage 是否真被清空——`"cache"` 指令在 Chrome 的残留 bug 意味着**当前标签页**的表现不足为凭，换新标签页验证。

## 四、用户「清除浏览数据」影响矩阵

以 Chrome「清除浏览数据」对话框为例，各层归属如下（Firefox/Safari 分类名不同、归属逻辑一致）：

| 层 | 「缓存的图片和文件」 | 「Cookie 及其他网站数据」 | 都不勾（自然消亡条件） |
| --- | --- | --- | --- |
| disk cache（HTTP 缓存） | **清** | — | 容量淘汰 / 新鲜期过后协商换新 |
| memory cache | —（本就不落盘） | — | 关标签页即清 |
| Cache API（SW 缓存） | — | **清**（属「网站数据」） | 代码删除 / 配额整源清理 |
| Service Worker 注册 | — | **清** | 代码注销 |
| Cookie / localStorage / IndexedDB | — | **清** | 各自过期/删除机制 |
| bfcache | — | — | 纯内存：导航逐出、超时（Chrome 常规 10 分钟）、重启即没 |

注意不对称性：用户勾「清缓存」**救不了** SW 缓存的旧版本——旧 SW 还注册着、Cache API 还在，下次打开照旧接管。这就是「SW 事故比 HTTP 缓存事故难救」的原因，防线必须建在[版本化清理](./sw-cache-api)上。

给客服/支持同学的止血话术也要照此校准：让用户「清理缓存」时**必须勾上「Cookie 及其他网站数据」**才动得了 SW；只清「缓存的图片和文件」对 PWA 类事故完全无效（代价是用户全站登录态一起没了——所以根治永远优于清除）。

## 五、开发期缓存失灵排查手册

「改了代码刷新没变化 / 用户反馈还是旧版」的固定动作：

0. **先建干净基线**：开一个无痕窗口复现——它自带空缓存、无 SW 注册。无痕窗口里是新的 → 问题一定在缓存层；无痕窗口里也是旧的 → 别折腾浏览器了，去查部署产物和 CDN。再用 curl 看服务端**此刻**返回的头，排除浏览器因素：

   ```bash
   # -I 只取响应头；核对 Cache-Control / ETag 是否符合预期策略
   curl -sI https://example.com/index.html | grep -iE "cache-control|etag|age"
   ```

1. **定层**：DevTools Network 看目标资源的 Size 栏——`(ServiceWorker)`、`(disk cache)`、`(memory cache)` 三个方向，处理路径完全不同。
2. **`(ServiceWorker)`**：Application → Service workers 看激活的是哪个版本；勾 **Update on reload + Bypass for network** 继续开发；线上则检查 SW 是否做了版本化收尸、新 SW 是否卡在 waiting（生命周期问题，本库待补）。
3. **`(disk cache)`**：看该资源响应头的 `Cache-Control`——HTML 入口被配长 `max-age` 是头号事故源；本地用 Disable cache 绕过，线上按[部署排查流程](./http-cache-landing)根治（哈希 URL + HTML `no-cache`）。
4. **`(memory cache)`**：新开标签页或重启浏览器即可排除内存层干扰（它只是复用「本文档刚用过」的副本）。
5. **整页状态旧而非资源旧**：后退回来看到「旧页面」且没有任何请求——那是 **bfcache**（页面快照）不是资源缓存，用 `pageshow(persisted)` 判定并刷新时效数据（见 [bfcache](./bfcache)）。
6. **浏览器侧全排除后**：查 CDN/代理等共享缓存——那在服务侧，不归本叶管，但别漏。

## 小结

- 观测主入口两处：**Network Size 栏**（四个括号标签定来源层；304 看 Status）与 **Application 面板**（Cache storage / Clear site data / Back-forward cache）。
- **Disable cache ≠ 全素颜**：只禁 HTTP 缓存且限 DevTools 打开期间；SW 要 Bypass for network，内存层用新标签页排除。
- **`Clear-Site-Data`** 是服务端遥控清除：指令必须带引号、仅 HTTPS；`"cookies"`/`"storage"` 三家稳定，`"cache"` 兼容史坑多（Firefox 94 删 138 回、Chrome partial），`"executionContexts"` 目前无人支持；登出用 `"cache", "cookies", "storage"`。
- 用户清数据的矩阵要背：「清缓存」只动 HTTP 缓存，**SW 缓存与注册属「网站数据」**——SW 事故救不回来，防线在版本化；bfcache 纯内存、不进任何清除清单。
