---
layout: doc
outline: [2, 3]
---

# Service Worker 缓存与 Cache API

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **模型**：`CacheStorage`（全局 `caches`）是「命名缓存的登记簿」，每个 `Cache` 存 **`Request`/`Response` 键值对**；window 与各类 worker 都能用，**不限于 Service Worker**（Baseline：2018-04 起全浏览器可用，**仅 HTTPS**）。
- **与 HTTP 缓存的根本区别**（MDN 原文）：「**Cache API 不遵守 HTTP 缓存头**」；「条目**不主动更新、不删除就不过期**」——存、更、删全是开发者的责任。
- **CacheStorage 方法**：`open`（不存在即创建）/ `match`（**跨所有 Cache** 查找）/ `has` / `delete` / `keys`。
- **Cache 方法**：`match` / `matchAll` / `add` / `addAll`（=fetch+存，**非 2xx 即 reject**）/ `put`（直接存）/ `delete` / `keys`。
- **opaque 响应坑**：跨域 no-cors 响应 status 恒为 0 → `add()/addAll()` 必 reject，只能自己 `fetch` + `put`；且读不到其头与体、真实体积照算配额。
- **匹配细节**：默认参与 **`Vary`** 头匹配；选项 `ignoreSearch`（忽略 query）/ `ignoreMethod` / `ignoreVary` 可放宽。
- **`Set-Cookie` 被剥离**：Fetch 规范要求响应对象不携带 `Set-Cookie`，因此存进 Cache 的响应不会种 Cookie。
- **配额**：算入源的存储配额，`StorageManager.estimate()` 可估算；浏览器兜底清理时**整源数据一起删**（all-or-none）——配额体系详见[浏览器存储](../../browser-storage/)。
- **三大策略**：cache-first（静态资源）/ network-first（接口数据）/ stale-while-revalidate（可容忍旧一拍的资源）。
- **版本化清理是纪律**：MDN 原文「按名字给缓存分版本，只用当前脚本能安全操作的版本」——activate 阶段删旧版本缓存。
- **DevTools**：SW 响应的请求 Size 栏显示 **`(ServiceWorker)`**；缓存内容在 Application → Cache storage 查看。

## 一、CacheStorage 与 Cache：模型与 API 面

Service Worker 能成为缓存层，靠的是一对标准接口：**`CacheStorage`**（登记簿）与 **`Cache`**（一个个具名仓库）。通过全局 `caches` 访问（`window.caches` / worker 里 `self.caches`），按**源（origin）隔离**，仅限安全上下文（非 HTTPS 直接 `SecurityError`；Firefox 隐私窗口可能不可用）。

| CacheStorage 方法 | 语义 |
| --- | --- |
| `caches.open(name)` | 取名为 `name` 的 Cache，**不存在则创建** |
| `caches.match(req)` | 在**登记的所有 Cache** 中查找匹配项（等价于自己遍历 `keys()` + 逐个 `cache.match()` 的便捷法） |
| `caches.has(name)` / `caches.delete(name)` | 存在性检查 / 整仓删除 |
| `caches.keys()` | 所有缓存名列表——版本化清理的原料 |

| Cache 方法 | 语义 |
| --- | --- |
| `cache.match(req, opts?)` / `matchAll` | 取第一个 / 全部匹配的 `Response` |
| `cache.add(req)` / `addAll(reqs)` | **fetch 并存入**；响应非 2xx 即 reject（`TypeError`），一条失败整批失败 |
| `cache.put(req, resp)` | 直接写入一对键值（不校验状态码），同键覆盖 |
| `cache.delete(req)` / `keys()` | 删单条 / 列出所有缓存的 `Request` |

键是 `Request`（实践中常直接传 URL 字符串），匹配时默认连 **`Vary`** 头一起算——MDN 原文：「键匹配算法依赖 `Vary` 头，匹配新键需要同时看键与值」。选项 `{ ignoreSearch: true }`（忽略查询串）、`ignoreMethod`、`ignoreVary` 可按需放宽。

## 二、与 HTTP 缓存的根本区别

| 维度 | HTTP 缓存（disk cache） | Cache API |
| --- | --- | --- |
| 谁决定存什么 | 服务端响应头（`Cache-Control`…） | **开发者代码**（`put`/`add` 什么存什么） |
| 遵守 HTTP 缓存头？ | 是 | **否**——MDN 原文「caching API 不遵守 HTTP 缓存头」，`no-store` 的响应照样能被 `put` 进来 |
| 过期机制 | 新鲜期一到自动陈旧、可协商续命 | **没有**——「不显式请求就不更新，不删除就不过期」 |
| 更新机制 | 浏览器自动协商（304/200） | 开发者自己 fetch 新版、自己写回 |
| 淘汰 | 容量满 LRU 逐条淘汰 | 配额压力下**整源一起删**（浏览器「要么全删要么不删」） |
| 对页面可见性 | 透明（页面无感知） | 完全可编程（SW `fetch` 事件里任意决策） |

这带来两条实战纪律：

1. **敏感数据防缓存不能只靠响应头**——`Cache-Control: no-store` 拦得住 HTTP 缓存，拦不住一行 `cache.put()`；SW 代码里要显式排除。
2. **忘了清理 = 用户永远旧版**——没有自动过期兜底，版本化清理（见第四节）不是优化项，是正确性要求。

## 三、三种常用策略

SW 在 `fetch` 事件里编排 Cache API 与网络，就是「缓存策略」。三个经典范式：

```js
// ① cache-first：先查缓存，命中直接回，未命中走网络并写回
// 适合：带哈希的静态资源（JS/CSS/字体/图）——内容不可变，越快越好
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached; // 缓存命中：0 网络成本
      return fetch(event.request).then((resp) => {
        // 响应流只能消费一次：一份给页面、一份克隆后入缓存
        const clone = resp.clone();
        caches.open("static-v2").then((cache) => cache.put(event.request, clone));
        return resp;
      });
    }),
  );
});
```

```js
// ② network-first：先走网络，失败（离线/超时）才回退缓存
// 适合：接口数据、HTML 入口——新鲜度优先，缓存做离线兜底
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const clone = resp.clone();
        caches.open("data-v1").then((cache) => cache.put(event.request, clone));
        return resp; // 网络成功：顺手更新缓存副本
      })
      .catch(() => caches.match(event.request)), // 网络失败：用旧副本救场
  );
});
```

```js
// ③ stale-while-revalidate：立即回缓存副本，同时后台拉新写回
// 适合：头像、配置等「旧一拍也能接受」的资源——速度与新鲜度折中
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open("swr-v1").then(async (cache) => {
      const cached = await cache.match(event.request);
      const refresh = fetch(event.request).then((resp) => {
        cache.put(event.request, resp.clone()); // 下次请求就是新的
        return resp;
      });
      return cached ?? refresh; // 有旧用旧，没旧等网络
    }),
  );
});
```

选型速记：**不可变静态资源 cache-first、动态数据 network-first、可容忍滞后的资源 SWR**（对照表见[参考](../reference)）。

## 四、版本化与清理：为什么必须自己收尸

Cache API 没有过期机制，于是「发新版」必须显式换仓：MDN 的处方是**按名字分版本**——「使用缓存名做版本化，只用当前脚本版本能安全操作的缓存」：

```js
const CACHE_NAME = "static-v3"; // 每次发布静态资源集合变化时递增版本号

// install：预缓存新版本资源清单
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(["/", "/app.js", "/app.css"])),
  );
});

// activate：新 SW 接管后，删掉所有旧版本缓存——不收尸就是双倍配额 + 旧资源风险
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))),
    ),
  );
});
```

为什么放 activate 而不是 install：新旧 SW 会短暂并存，旧 SW 可能还在用旧缓存，等新 SW 正式接管（activate）再删才安全——install/activate/waiting 的完整状态机属于 SW 生命周期（本库待补），此处只需记住「**install 备货、activate 收尸**」。

配额层面：Cache API 用量**算入源的存储配额**，`navigator.storage.estimate()` 可估算余量；浏览器在磁盘压力下清理时「通常要么删掉源的全部数据、要么一点不删」——别把关键数据只放缓存里。配额与持久化申请详见[浏览器存储](../../browser-storage/)。

## 五、坑位清单

- **opaque 响应**：对跨域资源发 no-cors 请求得到的响应 status 恒为 0——`add()/addAll()` 视为失败而 reject；要缓存只能 `fetch` + `put`，且读不到头和体、配额按真实体积（可能远大于表面）记账。能用 CORS 就用 CORS。
- **`clone()` 不是仪式**：`Response`/`Request` 的 body 是流、只能消费一次——「给页面」和「入缓存」两个去向必须一份原件一份克隆，忘 clone 的报错（body already used）是 SW 第一高频异常。
- **`add()` 会把错误页缓存下来吗？不会，但 `put()` 会**——`put` 不校验状态码，自己写策略时记得像 MDN 示例那样按 `response.ok`/状态码过滤，别把 500 页面缓存成「永久故障」。
- **`Set-Cookie` 拿不到**：存入缓存的响应不含 `Set-Cookie`（Fetch 规范剥离），依赖响应种 Cookie 的接口不适合走 Cache API 重放。
- **DevTools 判读**：SW 兑现的请求 Size 栏显示 `(ServiceWorker)`；注意 Network 的 **Disable cache 不会禁用 Cache API**，要旁路 SW 需在 Application → Service workers 勾 **Bypass for network**（详见[观测与清除](./cache-observe-clear)）。

## 小结

- Cache API = **开发者全权的缓存层**：`caches` 登记簿 + 具名 `Cache` 存 Request/Response 对；window/worker 通用、HTTPS 限定、按源隔离。
- 与 HTTP 缓存的根本区别一句话：**不看 HTTP 头、不自动过期、不自动更新**——正确性全靠代码自律，敏感数据的防缓存也拦不住 `put`。
- 三板斧策略：**cache-first**（哈希静态资源）、**network-first**（接口/HTML）、**stale-while-revalidate**（可滞后资源）；写回时永远记得 `clone()`。
- **install 备货、activate 收尸**：版本化缓存名 + activate 删旧仓是纪律；用量算存储配额、浏览器清理整源连坐，SW 生命周期细节本库待补。
