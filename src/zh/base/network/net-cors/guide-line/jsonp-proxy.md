---
layout: doc
outline: [2, 3]
---

# JSONP 与反向代理方案

> 基于 HTTP 现代标准 · 核于 2026-06

CORS 出现之前，前端绕过同源策略（SOP）的主力是 **JSONP**；如今 JSONP 已基本被 CORS 取代，工程上更常用的「跨域」手段则是**反向代理**。本页讲透 JSONP 的原理与局限，以及为何反向代理能从根上绕开 SOP——因为 **SOP 是浏览器限制，服务器之间通信不受其约束**。

## 速查

- **JSONP 原理**：利用 `<script src>` 加载脚本不受 SOP 限制，服务器返回 `callback(data)` 形式的 JS，前端预先定义 `callback` 函数接收数据。
- **JSONP 只支持 GET**：`<script>` 标签只能发 GET 请求，无法 POST/PUT/DELETE，也无法自定义请求头。
- **JSONP 无错误处理**：脚本加载失败只能监听 `onerror`，拿不到 HTTP 状态码与错误体，超时也要自己实现。
- **JSONP 有安全风险**：等于无条件信任第三方、执行其返回的任意 JS（可被 XSS/数据投毒利用），必须信任目标域。
- **JSONP 已被 CORS 取代**：CORS 支持所有 HTTP 方法、有标准错误语义、可携带凭证、由浏览器原生把关，无需 `<script>` 黑科技。
- **反向代理本质**：浏览器只与**同源**代理通信（不触发 SOP），代理在服务器端转发到目标服务器；SOP 是**浏览器**限制，服务器间通信不受约束。
- **开发环境代理**：Vite `server.proxy` / webpack `devServer.proxy`，把 `/api` 前缀转发到后端，本地零 CORS 配置。
- **Vite 代理关键项**：`target`（目标）、`changeOrigin: true`（改写 Origin 头）、`rewrite`（路径重写）、`ws`（WebSocket）。
- **生产环境代理**：nginx `location /api/ { proxy_pass ...; }`，前端与 API 同域同源，CORS 不再是问题。
- **postMessage**：跨窗口/iframe 的**窗口间**通信机制，与 AJAX 跨域无关，本页仅一句话带过。
- **选型**：现代项目首选 CORS（接口公开跨域）或反向代理（自有后端/聚合多服务）；JSONP 仅为老旧浏览器/历史接口的兜底，新项目不应再用。

## JSONP：历史方案

::: warning 注意
JSONP 已**基本被 CORS 取代**，且**存在安全风险**（需无条件信任并执行第三方返回的 JS）。本节用于理解原理与读懂老代码，**新项目不应再使用 JSONP**。
:::

### 原理：借 `<script>` 的「豁免」

同源策略限制的是 `XMLHttpRequest`、`fetch` 这类脚本发起的跨源数据请求；但 `<script>`、`<img>`、`<link>` 等标签加载资源**不受 SOP 限制**（这正是 CDN 能跨域加载脚本的原因）。JSONP 就是钻这个空子：

1. 前端预先定义一个全局回调函数，例如 <code v-pre>handleData</code>；
2. 动态插入一个 `<script>`，其 `src` 指向目标接口并把回调名作为查询参数传过去；
3. 服务器**不返回纯 JSON**，而是返回一段「用回调函数包裹数据」的 JS：`handleData({...})`；
4. 脚本加载完即执行，回调函数被调用，前端拿到数据。

```js
// 前端：手写一个最小 JSONP 实现
function jsonp(url, params = {}) {
  return new Promise((resolve, reject) => {
    // 1. 生成唯一回调名，挂到全局，避免并发冲突
    const cbName = `__jsonp_cb_${Date.now()}`;
    const query = new URLSearchParams({ ...params, callback: cbName });
    const script = document.createElement("script");
    const cleanup = () => (delete window[cbName], script.remove());

    window[cbName] = (data) => (resolve(data), cleanup()); // 2. 服务器会调用它传入数据
    script.onerror = () => (reject(new Error("JSONP 失败")), cleanup()); // 3. 只能这样兜错误，拿不到状态码
    script.src = `${url}?${query}`;
    document.head.appendChild(script); // 4. 插入即发起 GET 请求
  });
}

// 用法 → 请求 https://api.example.com/user?id=1&callback=__jsonp_cb_xxx
jsonp("https://api.example.com/user", { id: 1 }).then((user) => console.log(user));
```

```js
// 服务器端（Node/Express 示意）：返回的不是 JSON，而是「调用回调」的 JS
app.get("/user", (req, res) => {
  const cb = req.query.callback; // 取回调名
  const data = { id: req.query.id, name: "Ada" };
  // 关键：用 callback 包裹数据，浏览器加载后会执行它
  res.type("application/javascript").send(`${cb}(${JSON.stringify(data)})`);
});
```

### 局限：为何被淘汰

| 局限 | 说明 |
| --- | --- |
| **只支持 GET** | `<script>` 标签只能发起 GET，无法 POST/PUT/DELETE，也无法携带自定义请求头。 |
| **无错误处理** | 只能监听脚本的 `onerror`，拿不到 HTTP 状态码与错误体；超时、重试都得自己造轮子。 |
| **安全风险大** | 浏览器会**无条件执行**服务器返回的 JS。一旦目标域被攻破或本就恶意，等于在你的页面里执行任意脚本（XSS / 数据投毒），故必须**完全信任**目标域。 |
| **需服务端配合** | 接口必须特意支持「用 callback 包裹响应」这种非标准格式，普通 REST/JSON 接口用不了。 |
| **全局污染** | 回调函数挂在 `window` 上，需手动清理，并发请求要管理唯一命名。 |

CORS 出现后，上述痛点被一举解决：CORS 由浏览器原生把关，**支持所有 HTTP 方法**、有**标准的错误语义**、可**携带身份凭证**、且无需 `<script>` 黑科技与服务端的非标准包裹格式。因此现代项目**首选 CORS**，JSONP 仅作为面向极老旧浏览器或历史接口的兜底。CORS 的请求分类与首部细节见上一页 [CORS 凭证与 Access-Control 首部全谱](./cors-credentials-headers)。

## 反向代理：绕开 SOP 的工程方案

### 为什么代理能「跨域」

回到根上：**同源策略是浏览器对 JS 发起跨源请求的限制**，它管不着服务器之间的通信。反向代理正是利用这一点：

```
浏览器 ──同源请求──▶ 反向代理(同域)  ──服务器间转发──▶ 目标后端(任意域)
        (不触发 SOP)                   (后端通信，无 SOP)
```

浏览器始终只与**同源的代理**对话（协议/域名/端口一致，根本不算跨域），代理在服务器侧把请求转发到真正的目标服务器，再把响应原样带回。整条链路**没有任何一步是浏览器发起的跨源请求**，所以 SOP 与 CORS 都不会介入。代理因此能对接**不支持 CORS 的第三方接口**，也能聚合多个后端到同一前缀下。

::: tip 代理 vs CORS
二者解决的是同一问题的不同层面：CORS 是**服务器显式授权**浏览器跨源访问（需目标服务器配合加响应头）；反向代理是**让请求不再跨源**（前端无感，目标服务器无需任何改动）。自有后端或要对接无法改动的第三方接口时，代理更省事。
:::

### 开发环境：Vite / webpack devServer

本地开发时前端跑在 `localhost:5173`、后端在 `localhost:3000`，直接请求会跨域。最常用的做法是用 dev server 自带的代理，把某个前缀（如 `/api`）转发到后端：

```ts
// vite.config.ts —— Vite 底层使用 http-proxy-3
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      // 字符串简写：/foo -> http://localhost:4567/foo
      "/foo": "http://localhost:4567",

      // 对象写法：把 /api/xxx 转发到后端，并去掉 /api 前缀
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true, // 改写请求头 Origin 为 target，后端按同源看待
        rewrite: (path) => path.replace(/^\/api/, ""), // /api/user -> /user
      },

      // 正则匹配：键以 ^ 开头按正则解析
      "^/fallback/.*": {
        target: "http://jsonplaceholder.typicode.com",
        changeOrigin: true,
      },

      // 代理 WebSocket
      "/socket.io": {
        target: "ws://localhost:5174",
        ws: true,
      },
    },
  },
});
```

要点：`target` 是转发目标；`changeOrigin: true` 会把转发请求的 `Origin`/`Host` 改成 `target`，让后端把它当同源请求处理（避免后端的来源校验或 CORS 拦截）；`rewrite` 做路径重写（前端用 `/api` 前缀做标识，转发时剥掉）；`ws: true` 代理 WebSocket。更细的选项（`secure`、`configure` 等）可访问底层 `http-proxy-3` 实例定制。webpack 的 `devServer.proxy` 思路完全一致。

::: warning 仅限开发
dev server 代理**只在本地开发生效**，打包产物里没有它。生产环境的同源代理需在部署层（如 nginx）配置。
:::

### 生产环境：nginx 反向代理

生产部署常把前端静态资源和 API 放在**同一域名**下，由 nginx 按路径分流：静态文件本地伺服，`/api/` 前缀转发到后端服务。前端与 API 同源，CORS 从此与你无关。

```nginx
server {
  listen 80;
  server_name example.com;

  # 前端静态资源
  location / {
    root /var/www/dist;
    try_files $uri $uri/ /index.html; # SPA 单页回退
  }

  # 反向代理：/api/ 转发到后端，浏览器视角始终同源
  location /api/ {
    proxy_pass http://127.0.0.1:3000/; # 末尾 / 会剥掉 /api 前缀
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; # 透传真实客户端 IP
  }
}
```

注意 `proxy_pass` 末尾的 `/`：带上它，`/api/user` 会被转发为后端的 `/user`（剥掉 `/api`）；不带则原样保留 `/api/user`，这点与 Vite 的 `rewrite` 等价。

## 三种方案对比

| 维度 | CORS | JSONP | 反向代理 |
| --- | --- | --- | --- |
| 解决层面 | 服务器授权浏览器跨源 | 借 `<script>` 豁免 | 让请求不再跨源 |
| HTTP 方法 | **全部** | 仅 GET | **全部** |
| 错误处理 | 标准、完善 | 几乎没有 | 标准、完善 |
| 携带凭证 | 支持（需配置） | 仅默认 Cookie | 取决于代理配置 |
| 目标服务器是否需改动 | **需加 CORS 响应头** | 需支持 callback 包裹 | **无需改动** |
| 安全性 | 高（浏览器把关） | **低**（执行任意 JS） | 高（不跨源） |
| 现状 | **现代标准首选** | 已基本淘汰、有风险 | 工程常用（自有后端） |

> 另有 **postMessage**：用于**跨窗口/iframe** 之间的安全通信（如父页面与嵌入的第三方 iframe 互传消息），属于**窗口间**通信而非 AJAX 跨域，与本页的「请求跨域」是两回事，此处仅一句带过。

## 小结

- JSONP 利用 `<script>` 不受 SOP 限制、服务器返回 `callback(data)` 包裹的 JS 来取数据；但**只支持 GET、无错误处理、需信任并执行第三方任意 JS**，已**基本被 CORS 取代**，新项目不应再用。
- 反向代理从根上绕开 SOP——因为 **SOP 是浏览器限制**，浏览器只与同源代理通信，代理在服务器侧转发到目标服务器，服务器间通信不受 SOP 约束，且**目标服务器无需任何改动**。
- 开发环境用 Vite `server.proxy` / webpack `devServer.proxy`（`target` + `changeOrigin` + `rewrite`），生产环境用 nginx `proxy_pass` 让前端与 API 同源。
- 现代选型：接口需公开跨域用 **CORS**，自有后端或对接无法改动的第三方接口用**反向代理**，JSONP 仅作历史兜底。

上一页：[CORS 凭证与 Access-Control 首部全谱](./cors-credentials-headers) ｜ 下一页：[Cookie SameSite 与 COOP/COEP/CORP](./samesite-coop-coep)
