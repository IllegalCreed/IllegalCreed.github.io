---
layout: doc
outline: [2, 3]
---

# 导航交接与复用

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- 从已有页面再导航时，browser 进程必须**先问旧 renderer**：有 `beforeunload` 吗？——tab 内一切（含 JS）是 renderer 的地盘，browser 自己不知道
- `beforeunload` 可弹「**离开此页？**」确认框；**无条件注册 = 每次导航前都多一趟 browser↔renderer 往返 + handler 执行**，白白加延迟
- 正确姿势：**只在真有未保存数据时**注册，保存后立刻移除
- renderer 内发起的导航（点链接、`window.location = ...`）：renderer **先自查 beforeunload**，再把导航请求交给 browser 进程，其余流程与地址栏导航相同
- **跨站导航双 renderer 并存**：新 renderer 构建新页的**同时**，旧 renderer 保留着跑 `unload`——新旧页面短暂并行存在
- 这段并行属**页面生命周期（page lifecycle）**范畴；unload 系列在现代浏览器（含站点隔离、bfcache）下**不保证执行**，收尾逻辑改用 `visibilitychange`/`pagehide` + `sendBeacon`
- **Service Worker = 应用层网络代理**，本质是**跑在 renderer 进程里的 JS**；可决定「读缓存还是走网络」
- SW 介入导航的路径：网络侧拿 URL 匹配**已注册的 SW scope**（注册时 scope 已被记录）→ 命中 → UI 线程**找 renderer 跑 SW 代码**
- **Navigation Preload**：SW 冷启动与网络请求**并行**，请求带专门标头（`Service-Worker-Navigation-Preload`），服务器可据此只回增量数据
- 对前端：beforeunload 让新导航**变慢**的元凶常是「进页面就注册」的挽留弹窗/埋点

## 一、再导航：先过 beforeunload 这一关

[上一页](./navigation-flow)的六步流程假设 tab 是空的。真实场景更多是**从一个页面跳向另一个**——此时导航开始前多了一道手续。

页面可以注册 `beforeunload` 事件，在用户离开时弹出「离开此站点？未保存的更改可能丢失」的确认框。问题在于：**tab 内的一切——包括 JS——都是 renderer 进程的地盘**，browser 进程根本不知道当前页面有没有注册这个监听。所以每当用户发起新导航，browser 进程必须**先向当前 renderer 确认**：「当前站点在乎 beforeunload 吗？」

这道确认的代价直接落在导航延迟上：

```text
无 beforeunload：  回车 ──────────────► 立刻开始网络请求
有 beforeunload：  回车 ──IPC──► 旧 renderer 执行 handler ──放行──► 才开始网络请求
                              （若弹框，还要等用户点「离开」）
```

**因此官方明确警告：不要无条件添加 beforeunload。** handler 在导航**开始之前**执行——哪怕它什么都不做，这趟往返 + 执行时间也已经计入每一次离开本页的导航。正确姿势：

```js
/** 只在真有未保存数据时才拦截离开 */
function onBeforeUnload(event) {
  // 触发浏览器的「离开此页？」原生确认框（文案不可定制）
  event.preventDefault();
}

// 表单变脏时才注册——干净页面的导航不背 beforeunload 的账
form.addEventListener("input", () => {
  window.addEventListener("beforeunload", onBeforeUnload);
});

// 保存成功后立刻移除，还导航一个「秒开跑道」
async function save() {
  await submitForm();
  window.removeEventListener("beforeunload", onBeforeUnload);
}
```

**导航从 renderer 内发起时**（用户点了 `<a>` 链接，或 JS 执行 `window.location = "https://newsite.example"`）流程对称：renderer **先自查** beforeunload，处理完再把导航请求提交给 browser 进程——之后走的仍是上一页那套「网络请求 → 安检 → commit」流程，唯一区别是发起方从地址栏换成了 renderer。

## 二、跨站导航：新旧 renderer 并存的瞬间

确认可以离开后，若目标是**另一个站点**，browser 进程不会复用当前 renderer（站点隔离也不允许，见[站点隔离](./site-isolation)），而是**另起一个 renderer 进程**处理新导航。此时出现一个容易被忽略的事实：

```text
时间 ──────────────────────────────────►
旧 renderer：显示旧页面 ──► 执行 unload ──► 退场
新 renderer：        └─ 并行构建/加载新页面 ──► commit ──► 显示
```

**两个 renderer 短暂并存**：新 renderer 加载与构建新页面的同时，旧 renderer 留守执行 `unload` 等收尾事件。旧页面「看起来已经关了」，它的收尾代码却可能还在另一个进程里跑。

这段并行让「页面还活着吗」变成一个需要精确定义的问题——这正是**页面生命周期（Page Lifecycle）**API 要回答的。对前端的实际叮嘱有两条：

- **unload 系列靠不住**：站点隔离下 unload 不保证执行（unload 中 `postMessage` 还可能失败），bfcache 命中时更是整段跳过。离场统计/清理用 `visibilitychange` 或 `pagehide` + `navigator.sendBeacon()`。
- **别在 unload 里做重活**：它挤占的是「旧 renderer 退场」的时间窗，做多了只会延长进程回收。

## 三、Service Worker：导航请求的「应用层拦路人」

以上流程默认请求必然上网。**Service Worker（SW）**改变了这一点：它是你用 JS 写的**网络代理**，可编程决定「这个请求读缓存，还是走网络」。关键认知：**SW 是 JS 代码，跑在某个 renderer 进程里**——它不是浏览器内核的神秘组件，而是一段被特殊调度的应用代码。

SW 注册时，其 **scope**（作用范围 URL 前缀）会被记录下来（存储侧的地盘）。导航发生时流程多一个岔路：

```text
导航请求
   │
   ▼
网络侧：这个 URL 落在某个已注册的 SW scope 里吗？
   ├─ 否 ──► 照常发网络请求（上一页流程）
   └─ 是 ──► 通知 UI 线程 ──► 找一个 renderer 进程，启动并执行 SW 代码
                                  │
                                  ├─ SW 决定读缓存 ──► 不发网络请求
                                  └─ SW 决定走网络 ──► 由 SW 发起 fetch
```

注意启动顺序的含义：**必须先唤起 renderer、跑起 SW，才知道要不要发网络请求**。SW 给了前端拦截导航的超能力，也在导航关键路径上插入了「进程唤起 + JS 冷启动」的成本。

## 四、Navigation Preload：别让 SW 启动挡住网络

最坏的情形：SW 冷启动花了几十上百毫秒，跑完逻辑的结论却是「走网络吧」——网络请求被 SW 启动**串行**耽误了。若没有 SW，请求早就在路上了。

**Navigation Preload** 针对性优化：导航时**并行**做两件事——启动 SW、同时把网络请求发出去。这类预载请求带有专门的标头（`Service-Worker-Navigation-Preload`），服务器识别后可以定制响应，比如只回**增量数据**而非完整文档。SW 启动完成后，可在 `fetch` 事件里等待并直接使用这份预载响应（`event.preloadResponse`），两段耗时从相加变成取最大值：

```text
无预载：   [SW 启动][SW 决策][─────网络请求─────] ← 串行相加
有预载：   [SW 启动][SW 决策]
           [─────网络请求（并行已在路上）─────]   ← 取较长者
```

接入是两小段 SW 代码：

```js
// sw.js —— 激活时开启 Navigation Preload
self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.navigationPreload?.enable());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // 只处理导航请求
  event.respondWith(
    (async () => {
      // 预载响应：浏览器在 SW 启动的同时已并行发出的那次请求
      const preloaded = await event.preloadResponse;
      if (preloaded) return preloaded;
      return fetch(event.request); // 未开启/未命中时回退为普通网络请求
    })(),
  );
});
```

## 五、对前端工程师的实际影响

- **「进页面就注册 beforeunload」的挽留弹窗**是导航变慢的常见元凶：它让用户离开你站点的每一次导航都先绕道旧 renderer。按需注册、用完即摘。
- **收尾逻辑迁移**：`unload` → `pagehide`/`visibilitychange` + `sendBeacon`；既是站点隔离下的可靠性要求，也为 bfcache 让路。
- **SW 不是零成本缓存层**：它把自己插进了导航关键路径。命中缓存时快如本地，miss 时多付一次冷启动——记得开 Navigation Preload 兜底。
- **双 renderer 并存**解释了一些「灵异现象」：旧页面的定时器/日志在新页面已显示后仍多跑了一拍——那是旧 renderer 还在收尾。

## 小结

再导航比首次导航多三层交接：browser 进程先经 IPC 询问旧 renderer 的 beforeunload（无条件注册会给每次离开加税）；跨站时新旧 renderer 短暂并存——新页构建与旧页 unload 并行，unload 从此不可托付；Service Worker 作为跑在 renderer 里的应用层网络代理，可在网络侧匹配 scope 后被唤起接管请求，Navigation Preload 再把「SW 启动」与「网络请求」从串行拧成并行。至此，从进程模型到导航编排的链路走完；页面拿到数据后如何变成像素，见下一叶[浏览器渲染原理](../../browser-rendering/)，速查表见[参考](../reference)。
