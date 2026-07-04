---
layout: doc
outline: [2, 3]
---

# 路由同步

> 基于 wujie v2（2026-06 复活） · 核于 2026-07

## 速查

- **路由同步**解决裸 iframe 的老毛病：刷新浏览器 / 分享 URL 后子应用**路由不丢失**
- 机制：wujie **劫持子应用 iframe 的 `history.pushState`/`replaceState`**，把子应用路由变化**同步写回主应用的 URL query**
- URL 编码格式：子应用的 **`path + query + hash`** 用 `encodeURIComponent` 编码，挂到主应用 query 上，**key = 子应用 `name`**——形如 `主应用地址?子应用name=编码后的子应用路由`
- **开关**：`sync: true` 开启（`startApp` 配置或 <code v-pre>&lt;WujieVue :sync="true"&gt;</code>），默认 `false` 关闭
- **多子应用可同时同步**：主应用 URL 上可挂多个 `?a=...&b=...`，各子应用互不干扰
- **浏览器前进后退**：v2.0 全新沙箱支持——点浏览器前进/后退能正确驱动子应用路由（v1 的老痛点）
- **单向同步限制（关键）**：只有 wujie 实例**初次实例化**时才从 URL **读回**子应用路由；实例化后是**单向**的（子应用路由 → 主应用 URL），主应用改 URL **不会**反向驱动子应用
- **保活模式下 url 不驱动路由**：`alive: true` 时改 `url` 参数**不触发路由跳转**，要用[通信](./communication)让子应用自己跳
- **`prefix` 短路径**：把冗长的子应用路由前缀替换成短标识，缩短主应用 URL——`{ prod: "/example/prod" }` 让 `/example/prod/hello` 显示成 `{prod}/hello`（配置时**去掉域名**）
- 一句话：**iframe 自带 `history` 栈 → wujie 劫持它 → 把路由投影到主应用 URL**，这是 iframe 路线做路由同步的天然优势

## 一、裸 iframe 的路由之痛

裸 iframe 里，子应用的路由跳转发生在 iframe 内部的 `history` 栈上，**主应用的地址栏 URL 完全不变**。后果有三：

1. **刷新即回到首页**：用户在子应用里点到第 5 页，按 F5 刷新，主应用 URL 没记录子应用在哪，子应用重新加载回到默认路由。
2. **URL 分享无效**：把地址栏 URL 发给同事，对方打开只看到子应用首页，不是你当前看的那一页。
3. **浏览器前进后退错乱**：iframe 的历史与主页面历史各行其是。

wujie 的路由同步就是来根治这三点的——核心是**把子应用 iframe 里的路由状态，投影到主应用可见的 URL 上**。

## 二、机制：劫持 iframe history

因为 wujie 的[沙箱是 iframe](./iframe-sandbox)，子应用的路由（无论 `history` 模式还是 `hash` 模式）操作的是 **iframe 自己原生的 `history`/`location`**。wujie 只需**劫持 iframe 的 `history.pushState` 与 `history.replaceState`**，就能在子应用每次路由跳转时拿到新路由，并同步到主应用 URL：

```text
子应用在 iframe 里跳路由
  router.push('/detail/5?tab=info')
        │
        ▼  iframe.history.pushState 被 wujie 劫持
  wujie 取出 path+query+hash = "/detail/5?tab=info"
        │  encodeURIComponent 编码
        ▼
  写回主应用 URL：
  https://main.app/dashboard?app-vue=%2Fdetail%2F5%3Ftab%3Dinfo
                              └── key 是子应用的 name ──┘
```

于是主应用地址栏就「记住」了子应用当前在哪。**刷新浏览器 / 分享这个 URL**，wujie 初次实例化时会从 query 里把 `app-vue=...` 解码读回，让子应用直接恢复到 `/detail/5?tab=info`——路由状态不再丢失。

## 三、开启同步：sync

同步默认关闭，用 `sync: true` 开启：

```js
// 命令式
startApp({
  name: "app-vue",
  url: "//localhost:7100/",
  el: "#sub-container",
  sync: true, // 开启路由同步：子应用路由 ↔ 主应用 URL query
});
```

```vue
<!-- 组件式 -->
WujieVue name="app-vue" :url="url" :sync="true" /
```

**多个子应用可以同时同步**——各自用自己的 `name` 作 key 挂在主应用 query 上，互不干扰：`https://main.app/?app-vue=%2Fa&app-react=%2Fb`。浏览器的前进后退（v2.0 支持）会正确驱动对应子应用路由。

## 四、单向同步：最容易踩的语义坑

这是路由同步**最关键、最反直觉**的一条，务必记牢——官方原文：

> 只有无界实例在**初次实例化**的时候才会从 url 上读回路由信息，一旦实例化完成，后续只会**单向**地将子应用路由同步到主应用 url 上。

拆开说：

- **初次实例化**：从主应用 URL 的 query 读回子应用路由（用于刷新/分享恢复）——这是**唯一一次** URL → 子应用方向。
- **实例化之后**：只有**子应用路由 → 主应用 URL** 一个方向。你在主应用里用 JS 改地址栏的 `?app-vue=...`，**不会**反向驱动子应用跳路由。

所以「主应用想控制子应用跳到某路由」**不能靠改 URL query**，要靠[通信](./communication)（`props` 传目标路由 + 子应用监听，或 EventBus 广播跳转指令）。尤其**保活模式**（`alive: true`）下，改 `startApp` 的 `url` 参数也**不会**触发子应用路由跳转——同样得走通信通道。

## 五、prefix：给 URL 瘦身

子应用路由前缀往往很长（`/example/prod/module-a/page`），全塞进主应用 query 会让 URL 又臭又长。`prefix` 让你用短标识替换长前缀：

```js
startApp({
  name: "app-vue",
  url: "//localhost:7100/",
  el: "#sub-container",
  sync: true,
  // prefix：把长前缀映射成短 key（配置时去掉域名部分）
  prefix: {
    prod: "/example/prod",
    test: "/example/test",
  },
});
```

同步时 wujie 会**匹配最长可用前缀**做替换：

| 子应用真实路由 | 主应用 URL 里显示 |
| --- | --- |
| `/example/prod/hello` | `{prod}/hello` |
| `/example/test/name` | `{test}/name` |
| `/example/prod/debug?id=5` | `{prod}/debug?id=5` |

读回时再反向展开成完整路由。`prefix` 纯粹是「URL 显示瘦身」，不改变子应用实际路由。

## 六、与 qiankun 路由的对比

同是「让子应用路由体现在主应用 URL」，两条路线的机制不同：

| 维度 | qiankun | wujie |
| --- | --- | --- |
| 路由载体 | 子应用改造成用**主应用 `history`**（共享一个 `history`） | 子应用用 **iframe 原生 `history`**（各自独立） |
| 同步方式 | 子应用路由 `base` 前缀直接体现在**主应用真实 path** | 劫持 iframe `history`，**投影到主应用 query** |
| 子应用改造 | 需切换路由 `base`（`activeRule` 前缀） | **重建/保活模式零改造** |
| 刷新恢复 | 靠 `activeRule` 命中重新挂载 | 初次实例化从 query 读回 |

wujie 的路由同步是**基于「iframe 自带独立 history」这个物理事实**的自然产物——劫持它、投影到 query 即可，子应用几乎不用为路由改代码。这与它 [iframe 沙箱](./iframe-sandbox)的整体路线一脉相承。

## 小结

wujie 的路由同步把裸 iframe「刷新即丢路由」的老毛病根治了：因为子应用跑在 iframe 里、用的是 iframe 原生 `history`，wujie 只需**劫持 iframe 的 `pushState`/`replaceState`**，把子应用 `path+query+hash` 编码后投影到**主应用 URL query**（key = 子应用 `name`），刷新/分享即可从 query 读回恢复，v2.0 还支持浏览器前进后退。最需要记牢的是**单向同步**：只有初次实例化读回一次 URL，之后只有「子应用 → 主应用 URL」方向，主应用想驱动子应用跳路由必须走通信（保活模式下改 `url` 也不跳）。`prefix` 给长 URL 瘦身。路由通了，怎么让切换像换 Tab 一样秒切、进入前就秒开？下一页 [保活与预加载](./keep-alive-preload)。
