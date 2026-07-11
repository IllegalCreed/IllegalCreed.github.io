---
layout: doc
outline: [2, 3]
---

# History API：pushState、popstate 与路由原理

> 基于 WHATWG HTML（导航与会话历史）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **入口**：`window.history`（`History` 接口，单例）；**仅主线程可用**，Worker/Worklet 里没有。2015 年起全浏览器可用。
- **两个改址方法**：`pushState(state, unused, url)` 推一条新历史条目；`replaceState(state, unused, url)` 原地替换当前条目——**都改地址栏但不刷新页面、不发请求**。
- **三个参数**：`state`（结构化克隆序列化的任意对象）、`unused`/`title`（**几乎被所有浏览器忽略**，传空串 `""`）、`url`（可选，**必须同源**，跨源抛 `SecurityError`）。
- **`history.state`**：读**当前**历史条目的 state，**无需等 `popstate`**；初始进入页面时为 `null`。
- **`popstate` 事件**：`window.addEventListener("popstate", …)`，`event.state` 是目标条目的 state。
- **头号坑：`popstate` 不因 `pushState`/`replaceState` 触发**——**只**在浏览器前进后退、`history.back/forward/go()`、或用户改 hash 时触发；push 完要换 UI 必须**自己**调渲染函数。
- **导航方法**：`history.back()` = `go(-1)`；`history.forward()` = `go(1)`；`history.go(n)` 相对跳转，`go(0)`/`go()` 刷新当前页；越界静默无效、不报错。
- **`history.length`**：会话历史条目数（含当前页）；新标签页首个页面为 1。**只读、不能清空历史、读不到具体 entry**——这是 History API 的硬伤。
- **`scrollRestoration`**：`"auto"`（默认，浏览器自动恢复滚动位置）/ `"manual"`（关闭自动恢复，SPA 自己控滚动）；`history.scrollRestoration = "manual"`。
- **state 走结构化克隆**：能存对象/数组/`Date`/`Map`/`Set`/`ArrayBuffer`，**存不了**函数、DOM 节点、类方法；**Firefox 上限约 16 MiB**——大数据放外部存储，history 只放 id。
- **hash 路由**：`location.hash` + `hashchange` 事件；`#` 后变化**不发请求、无需服务端配合**；URL 不美、SEO 弱。
- **history 路由**：`pushState` 造真实路径；URL 干净可 SEO，但**刷新/直接访问会真的请求该路径**。
- **history 路由必须服务端 fallback**：把未匹配静态资源的路径**回退到 `index.html`**（Nginx `try_files $uri $uri/ /index.html;`），否则刷新即 404。
- **`popstate` vs `hashchange`**：改 hash 会触发 `hashchange`，也会触发 `popstate`（若通过历史导航）；纯 `location.hash=` 赋值触发 `hashchange`。SPA 路由二选一驱动。
- **同步初始 state**：页面加载时 `history.state` 可能为 `null`；进应用先 `replaceState(initialState, "", location.href)` 把首屏状态写进当前条目，回退到首屏时 `popstate` 才有 state 可用。
- **四宗罪**：读不到完整历史栈、改不了非当前 entry、`popstate` 不因 push/replace 触发、感知不到所有导航来源——这些正是 [Navigation API](./navigation-api-basics) 要解决的。
- **别绑 `beforeunload` 做持久化**：路由 state 变了就写外部存储，别指望卸载时机。
- **框架关系**：Vue Router 的 `createWebHistory`/`createWebHashHistory`、React Router 的 `BrowserRouter`/`HashRouter` 就是这两种模式的封装——原理即本页。

## 一、History 接口全景

`window.history` 是 `History` 接口的单例，只在主线程（`Window`）可用。它的成员分三类：

| 类别 | 成员 | 作用 |
| --- | --- | --- |
| 改历史（不刷页） | `pushState()` / `replaceState()` | 推新条目 / 替换当前条目 |
| 在历史里移动 | `back()` / `forward()` / `go(n)` | 后退 / 前进 / 相对跳转 |
| 读属性 | `state` / `length` / `scrollRestoration` | 当前 state / 条目数 / 滚动恢复策略 |
| 事件（在 window 上） | `popstate` / `hashchange` | 前进后退 / hash 变化 |

注意 History API **只能读到"当前一个" state**（`history.state`），既看不到完整历史栈里其他条目，也改不了它们——这是它与 Navigation API 最本质的差距。

## 二、pushState 与 replaceState：改址不刷页

这两个方法是 SPA "history 路由"的心脏。签名一致，三个参数：

```js
history.pushState(state, unused, url);
history.replaceState(state, unused, url);
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `state` | 结构化克隆可序列化的值 | 与该历史条目绑定的数据；之后经 `popstate` 的 `event.state` 或 `history.state` 取回。Firefox 上限约 16 MiB。 |
| `unused` | 字符串 | 历史上是"页面标题"，**现今几乎被所有浏览器忽略**（Safari 曾有残留处理）；按约定传空字符串 `""`。 |
| `url` | 字符串（可选） | 新的历史条目 URL；**必须与当前页同源**，跨源抛 `SecurityError`；省略则沿用当前 URL。 |

**两者区别**：`pushState` **推一条新条目**（历史栈变长，前进后退能回到旧条目），`replaceState` **替换当前条目**（栈长不变，用于"更新地址但不产生新历史"，如把筛选参数同步进 URL）。

```js
// 用户点了"用户 1"：推新条目，地址栏变 /users/1，页面不刷新
history.pushState({ view: "user", id: 1 }, "", "/users/1");
render(location.pathname); // ⚠️ 必须自己渲染——pushState 不触发 popstate

// 只是想把当前筛选写进 URL、不产生新历史条目：用 replaceState
const params = new URLSearchParams({ sort: "hot", page: "2" });
history.replaceState(history.state, "", `?${params}`);
```

::: warning 关键：title 参数是"死参数"，url 必须同源
第二个参数几乎所有浏览器都忽略（想改标题请直接 `document.title = "…"`）。第三个参数只能同源——你无法用 `pushState` 把地址栏改到别的网站，那会抛 `SecurityError`。这两条是初学者最常撞的墙。
:::

## 三、popstate：SPA 路由最大的认知陷阱

`popstate` 是"用户在历史栈里移动了、你该换内容了"的通知。它在 `window` 上监听，`event.state` 携带目标条目的 state：

```js
window.addEventListener("popstate", (event) => {
  // event.state 是即将展示的那条历史条目的 state（等价于此刻的 history.state）
  console.log("到达：", location.pathname, "状态：", event.state);
  render(location.pathname, event.state);
});
```

**必须刻进肌肉记忆的一条：`popstate` 只在"历史导航"时触发，`pushState`/`replaceState` 时不触发。**

| 动作 | 触发 `popstate`？ |
| --- | --- |
| 用户点浏览器**后退/前进**按钮 | ✅ 触发 |
| `history.back()` / `forward()` / `go(n)` | ✅ 触发 |
| 用户改地址栏 hash 后回退到该条 | ✅ 触发（历史导航） |
| **`history.pushState(...)`** | ❌ **不触发** |
| **`history.replaceState(...)`** | ❌ **不触发** |
| 页面首次加载 | ❌ 不触发（部分老浏览器曾有差异，现代统一不触发） |

这条规则的工程含义：**"去某页"（push）和"回某页"（popstate）是两条独立代码路径**，你得分别调渲染——

```js
/** 应用内导航：主动去某页 */
function navigateTo(path, state) {
  history.pushState(state, "", path);
  render(path, state); // push 不触发 popstate，必须手动渲染
}

/** 历史导航：用户前进后退，被动响应 */
window.addEventListener("popstate", (event) => {
  render(location.pathname, event.state); // 这里才由 popstate 驱动
});
```

漏掉"push 后手动渲染"，会出现"地址栏变了但页面没变"；误以为"push 会触发 popstate 所以只在 popstate 里渲染"，则点链接毫无反应——这是自研 SPA 路由的头号 bug。

### 3.1 初始 state 的同步

页面首次加载时 `history.state` 往往是 `null`。如果用户先在应用内 `pushState` 到别处、再一路后退回首屏，回到首屏那条的 `popstate` 拿到的 state 也是 `null`，无法还原首屏。惯例是**进应用时先用 `replaceState` 把首屏状态写进当前条目**：

```js
// 应用启动：把首屏状态灌进"当前"历史条目
history.replaceState(
  { view: "home", scrollY: 0 },
  "",
  location.href, // URL 不变，只补 state
);
```

## 四、back / forward / go / length：在历史里移动

```js
history.back();     // 后退一条，等价 history.go(-1)
history.forward();  // 前进一条，等价 history.go(1)
history.go(-2);     // 后退两条
history.go(0);      // 刷新当前页（等价 go() / 无参）
history.length;     // 会话历史条目数（含当前页），只读
```

三条要点：

- **异步执行**：`back/forward/go` 触发的导航是异步的，`popstate`（及可能的 `hashchange`）随后派发。
- **越界静默**：已在栈底再 `back()`、栈顶再 `forward()` 都**无效果也不报错**——所以"能不能后退"没法直接从 History API 问出来（Navigation API 有 `canGoBack`）。
- **`length` 的局限**：它只告诉你"有多少条"，读不到每条的 URL/state，也无法主动清空或裁剪历史。要遍历完整历史栈，只有 [Navigation API 的 `entries()`](./navigation-api-basics)。

## 五、scrollRestoration：接管滚动恢复

浏览器默认会在历史导航（前进后退）时**自动把页面滚回上次的位置**。对 MPA 这很贴心，但 SPA 里内容是异步渲染的，浏览器"自动恢复"往往在内容还没渲染出来时就执行了，滚到错误位置。`history.scrollRestoration` 让你接管：

```js
// 关闭浏览器自动滚动恢复——SPA 常用，改由路由逻辑自己控制滚动
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
```

| 取值 | 行为 |
| --- | --- |
| `"auto"`（默认） | 浏览器在历史导航时自动恢复用户上次滚动到的位置 |
| `"manual"` | 浏览器不恢复滚动，**由你自己**在渲染完成后决定滚到哪 |

设为 `"manual"` 后，典型做法是把 `window.scrollY` 存进该条目的 state（`replaceState`），在 `popstate` 渲染完内容后手动 `window.scrollTo(0, state.scrollY)`。Navigation API 的 `intercept({ scroll })` 提供了更精细的接管，见 [navigate 事件与拦截](./navigate-intercept)。

## 六、state 的序列化边界：结构化克隆

`pushState`/`replaceState` 存的 state **不是简单存引用**，而是经**结构化克隆算法（structured clone）** 深拷贝后与历史条目一起持久化（页面刷新、前进后退都要能还原它，所以必须可序列化）：

| 能存 | 存不了 |
| --- | --- |
| 原始值、普通对象、数组 | **函数**（抛 `DataCloneError`） |
| `Date`、`RegExp` | **DOM 节点** |
| `Map`、`Set` | 类实例的**方法与原型**（取回退化为普通对象） |
| `ArrayBuffer`、TypedArray、`Blob` | getter/setter、循环引用外的引用共享 |

两条实践约束：

- **大小有上限**：Firefox 对 state 有约 **16 MiB** 的限制，超出报错。别把整个列表数据塞进 state——**history 里只放能重新取数的 id/引用，真数据放 [IndexedDB](/zh/web-advanced/web-api/indexeddb/) 或内存缓存**。
- **只存纯数据**：存类实例，取回时方法和 `instanceof` 都没了；存函数直接 `DataCloneError`。把 state 当作"重建视图所需的最小快照"来设计。

## 七、hash 路由 vs history 路由：原理与服务端 fallback

SPA 路由在 URL 形态上二选一，两条路线的**根本差异在于"URL 变化会不会惊动服务端"**。

### 7.1 hash 路由：靠 fragment 不发请求

```js
// URL: https://example.com/#/users/1
// 改 hash 换路由——# 后的变化不触发整页请求，服务端只看到 /
function navigate(path) {
  location.hash = path; // 触发 hashchange
}
window.addEventListener("hashchange", () => {
  render(location.hash.slice(1)); // 去掉 '#'
});
```

- **原理**：URL 中 `#` 之后的 fragment 本用于页内锚点，浏览器改它**不会重新加载文档、不会向服务端发请求**。SPA 借此把路由信息藏在 `#` 后，服务端永远只收到 `https://example.com/`。
- **优点**：**零服务端配置**，刷新、直接访问、分享链接都不会 404，纯静态托管（GitHub Pages、对象存储）即可跑。
- **缺点**：URL 挂 `#` 不美观；传统 SEO 不友好；与真实锚点定位有潜在冲突。

### 7.2 history 路由：靠 pushState 造真路径

```js
// URL: https://example.com/users/1
function navigate(path) {
  history.pushState(null, "", path); // 干净的真实路径
  render(path);
}
```

- **原理**：`pushState` 能把地址栏改成任意**同源真实路径**且不刷新。URL 干净、可 SEO。
- **代价**：**用户刷新页面、或直接输入 `https://example.com/users/1` 时，浏览器会真的向服务端请求 `/users/1`**。服务端没有这个路由就返回 404。

### 7.3 history 路由的服务端 fallback（必配）

history 路由**必须**让服务端把"未匹配到静态资源的路径"统统回退到 `index.html`，交给 SPA 的 JS 按 `location.pathname` 渲染：

```nginx
# Nginx：先找真实文件/目录，找不到就返回 index.html（SPA fallback）
location / {
  try_files $uri $uri/ /index.html;
}
```

各平台等价做法：

- **Nginx**：`try_files $uri $uri/ /index.html;`
- **Apache**：`.htaccess` 用 `mod_rewrite` 把非文件请求重写到 `index.html`
- **Vercel / Netlify**：配置 `rewrites`/`redirects` 把 `/*` 指向 `/index.html`
- **纯静态托管（不支持 fallback）**：只能退回 **hash 路由**

::: warning 刷新 404 = 十有八九漏配 fallback
"本地开发一切正常，部署后刷新子路由 404"是 history 路由最经典的坑——开发服务器（Vite 等）默认帮你做了 fallback，生产服务器没配就露馅。记住：**history 路由 ⇒ 服务端 fallback 到 index.html**，这不是可选项。
:::

### 7.4 取舍一句话

| 维度 | hash 路由 | history 路由 |
| --- | --- | --- |
| URL 形态 | `example.com/#/path`（有 `#`） | `example.com/path`（干净） |
| 服务端配合 | **不需要** | **必须 fallback 到 index.html** |
| SEO | 弱 | 好 |
| 部署 | 纯静态即可 | 需支持 fallback |
| 选择 | 静态托管、无法配后端时 | 现代项目默认（能配 fallback 时） |

对应到框架：Vue Router 的 `createWebHashHistory()` / `createWebHistory()`、React Router v6 的 `HashRouter` / `BrowserRouter`，正是这两种模式的封装——底层机制就是本页所讲。

## 八、History API 的四宗罪（承上启下）

用 History API 手搓 SPA 路由，你会撞上四个规范级缺口：

1. **读不到完整历史栈**：`history.length` 只给个数，`history.state` 只给当前条——看不到其他条目的 URL/state。
2. **改不了非当前 entry**：只能改"当前"条目的 state，历史里更早的条目动不了。
3. **`popstate` 不因 push/replace 触发**：主动导航和被动导航是两条路径，容易顾此失彼。
4. **感知不到所有导航来源**：点链接、提交表单、`location.assign`、`history.go` ……得靠全局监听 click + `preventDefault` 拼凑，且拦不全。

这四点正是 [Navigation API](./navigation-api-basics) 的设计出发点——下一页看它如何逐一填平。
