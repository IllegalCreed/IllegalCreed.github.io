---
layout: doc
outline: [2, 3]
---

# 跨域常见场景与报错排查

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **跨域 = 协议 / 域名 / 端口任一不同**：`http` vs `https`、`a.com` vs `b.com`、`a.com:80` vs `a.com:8080` 都算跨域；子域 `api.a.com` 与 `www.a.com` 同样跨域。
- **最核心的认知**：CORS 报错是**浏览器的拦截行为**——请求其实已发到服务器、响应也回来了，浏览器只是**不让 JS 读取响应**。后端日志里能看到这条请求被正常处理（200）。
- **报错只在 Console**：出于安全，CORS 失败的具体原因**不暴露给 JS**，`fetch` 的 `catch` 只拿到一个笼统的 `TypeError: Failed to fetch`；详情看浏览器控制台红字。
- **最常见报错**：`No 'Access-Control-Allow-Origin' header is present`（响应缺 `Access-Control-Allow-Origin` 头）。
- **预检失败报错**：`Response to preflight request doesn't pass access control check` / `preflight response is not successful`（OPTIONS 预检没返 2xx 或缺头）。
- **凭证类报错**：携带 Cookie 时 `Access-Control-Allow-Origin` 不能是 `*`，否则报 `credentials mode is 'include'... not 'true'` 一类。
- **DevTools 定位三步**：Network 面板勾选「Fetch/XHR」→ 看是否多出一条 `OPTIONS`（预检）→ 点开看 Response Headers 有没有 `Access-Control-Allow-*`。
- **看 Status 别误判**：预检 OPTIONS 显示 `(failed)` 或被红框标记，但真实请求可能 Status 200——状态码 200 不代表 CORS 通过。
- **本地开发联调线上**：`localhost:5173` 调 `https://api.线上.com` 必跨域；要么线上配 CORS 允许 localhost，要么走代理（见下一叶）。
- **排查决策树**：① 响应有没有 `Access-Control-Allow-Origin`？无 → 后端没配；② 有但值不对？→ 多源/动态源问题；③ 有预检且预检挂了？→ 方法/自定义头没在白名单；④ 带 Cookie 挂了？→ 凭证四件套没配齐。
- **不是所有跨域都报 CORS**：`<img>`、`<script src>`、`<link>`、表单 `POST` 等可跨域加载，只是 JS 读不到内容；报 CORS 的主要是 `fetch` / `XMLHttpRequest`。
- **机制原理见下一叶**：本页只讲「现象与定位」，简单请求 vs 预检的触发规则与完整首部见 [CORS 简单请求与预检请求](./cors-simple-preflight)。

## 一、什么情况会跨域

浏览器判定「同源」要求**协议、域名、端口三者完全一致**（详见 [同源策略与「源」的定义](./same-origin-policy)）。前端日常踩到跨域，几乎都落在下面几类场景：

| 场景 | 当前页面 | 请求目标 | 为何跨域 |
| --- | --- | --- | --- |
| 调不同域名的 API | `https://www.shop.com` | `https://api.shop.com/order` | **域名**不同（子域也算） |
| 本地起多端口 | `http://localhost:5173` | `http://localhost:8080/api` | **端口**不同 |
| 协议升级未对齐 | `http://site.com` | `https://site.com/api` | **协议**不同（http ≠ https） |
| 本地联调线上 | `http://localhost:5173` | `https://api.prod.com` | 协议 + 域名都不同 |
| 第三方开放接口 | `https://myapp.com` | `https://api.github.com` | 域名不同，且你无法改对方后端 |
| CDN / 字体 / 图片画布 | `https://myapp.com` | `https://cdn.com/font.woff2` | 字体、`canvas.drawImage`、WebGL 纹理也受同源约束 |

::: tip 子域之间也是跨域
很多人以为 `www.a.com` 和 `api.a.com` 同属 `a.com` 就不跨域，**错**。同源策略只认完整的「协议 + 主机 + 端口」三元组，主机名只要有一个字符不同就是不同源。子域共享 Cookie 是另一套规则（`Domain` 属性），与 CORS 无关，详见本叶 [Cookie SameSite 与 COOP/COEP/CORP](./samesite-coop-coep)。
:::

::: warning `localhost` 与 `127.0.0.1` 也算两个源
`http://localhost:3000` 和 `http://127.0.0.1:3000` 主机名不同，浏览器视为**不同源**。本地调试时若前端配的是 `localhost`、后端 CORS 白名单写的是 `127.0.0.1`，照样跨域报错。
:::

## 二、最关键的认知：CORS 报错是浏览器拦的，请求已经到服务器了

这是前端跨域问题里**最高频的误区**，必须先建立正确心智，否则排查方向全错。

跨域请求（非预检的简单请求）的真实流程是：

1. JS 调用 `fetch('https://api.other.com/data')`。
2. 浏览器**照常把请求发出去**，带上 `Origin: https://myapp.com` 头。
3. 服务器**收到并正常处理**，返回 `200` 和数据——后端日志里这条请求清清楚楚。
4. 响应回到浏览器后，浏览器检查响应里有没有匹配的 `Access-Control-Allow-Origin`。
5. **没有匹配 → 浏览器把响应丢弃，不交给 JS**，并在控制台打印 CORS 错误。

```js
// 跨域且后端没配 CORS 时
fetch("https://api.other.com/data")
  .then((res) => res.json()) // 走不到这里
  .catch((err) => {
    // 只能拿到笼统的 TypeError: Failed to fetch
    // 拿不到状态码、拿不到响应体、拿不到具体 CORS 原因
    console.log(err.message);
  });
```

::: danger 由此推出三条实战结论
1. **后端没报错、日志显示 200，不等于跨域成功**——浏览器可能已在客户端拦截，写操作（如 `POST` 提交订单）可能已经在服务器执行了。
2. **不能用 `fetch().catch()` 区分「CORS 失败」还是「断网/超时」**——两者都只是 `Failed to fetch`，必须去 Console 看红字。
3. **CORS 是浏览器的安全策略，不是后端的「拦截」**——用 curl / Postman / 服务端代码请求同一接口**永远不会**有 CORS 报错（它们不执行浏览器的同源策略），所以「Postman 能通、网页报跨域」是再正常不过的现象。
:::

## 三、浏览器报错信息对照表

CORS 报错的措辞在 Chrome（Blink）和 Firefox 略有差异。Chrome 控制台通常以 `Access to fetch at ... has been blocked by CORS policy:` 开头，后接具体原因；Firefox 以 `Cross-Origin Request Blocked` 开头并给出一个错误标识符（如 `CORSMissingAllowOrigin`）。下表把常见报错按**根因**归类：

| 报错关键片段（Chrome / Firefox 标识） | 根因 | 排查方向 |
| --- | --- | --- |
| `No 'Access-Control-Allow-Origin' header is present` / `CORSMissingAllowOrigin` | 响应里完全没有 `Access-Control-Allow-Origin` 头 | 后端没开 CORS，或没对该路由 / 该请求方法生效 |
| `The 'Access-Control-Allow-Origin' header has a value '...' that is not equal to the supplied origin` / `CORSAllowOriginNotMatchingOrigin` | 有这个头，但值和当前页面 `Origin` 不一致 | 后端写死了某个源，或多源时没动态回显当前 `Origin` |
| `Response to preflight request doesn't pass access control check` | 预检（OPTIONS）的响应没通过校验 | 看 OPTIONS 这条请求的响应头与状态码 |
| `It does not have HTTP ok status` / `CORSPreflightDidNotSucceed` | 预检 OPTIONS 没返回 2xx（如返回了 404 / 401 / 500） | 后端没处理 OPTIONS 方法，或鉴权中间件把 OPTIONS 也拦了 |
| `Method ... is not allowed by Access-Control-Allow-Methods` / `CORSMethodNotFound` | 真实请求的方法（如 `PUT`、`DELETE`）不在预检响应允许列表里 | 后端 `Access-Control-Allow-Methods` 没包含该方法 |
| `Request header field ... is not allowed by Access-Control-Allow-Headers` / `CORSMissingAllowHeaderFromPreflight` | 自定义请求头（如 `Authorization`、`X-Token`）没被预检放行 | 后端 `Access-Control-Allow-Headers` 没列出该头 |
| `The value of the 'Access-Control-Allow-Credentials' header ... is not 'true'` / `CORSMissingAllowCredentials` | 带凭证请求，但响应没声明允许凭证 | 后端补 `Access-Control-Allow-Credentials: true` |
| `The value of the 'Access-Control-Allow-Origin' header ... must not be the wildcard '*' when the request's credentials mode is 'include'` / `CORSNotSupportingCredentials` | 带 Cookie 时后端却返回了 `Access-Control-Allow-Origin: *` | 凭证模式下必须回显**具体源**，不能用 `*` |
| `Redirect is not allowed for a preflight request` / `CORSExternalRedirectNotAllowed` | 预检或请求过程中发生了跨源重定向 | 检查是否有 301/302 把请求重定向到了别的域 |

::: tip 报错措辞会变，根因不变
浏览器版本更新会微调报错文案，不必死记原句。抓住**冒号后那句话在抱怨哪个响应头**即可：抱怨 `Allow-Origin` → 源不匹配 / 缺失；抱怨 `Allow-Methods` / `Allow-Headers` → 预检白名单不全；抱怨 `Allow-Credentials` 或 `wildcard` → 凭证配置问题。Firefox 的错误标识符（`CORS*`）含义可在 MDN「CORS errors」页逐条查到。
:::

## 四、用 DevTools Network 面板定位

控制台只告诉你「哪个头有问题」，**Network 面板才能看到请求的真实往返**。标准排查步骤：

1. **打开 Network 面板**，勾选顶部过滤器 **Fetch/XHR**（只看 JS 发起的请求，排除噪音）。
2. **复现一次失败操作**，让请求重新发出。
3. **看是否多出一条 `OPTIONS` 请求**：
   - 有 OPTIONS → 这是**预检请求**，问题大概率在预检环节（方法/头未放行、OPTIONS 没返 2xx）。
   - 没有 OPTIONS → 这是**简单请求**，问题在真实请求的响应缺 `Access-Control-Allow-Origin`。
4. **点开可疑请求 → Headers 选项卡**：
   - 看 **Request Headers** 里的 `Origin` 是否就是你当前页面的源。
   - 看 **Response Headers** 里有没有 `Access-Control-Allow-Origin`、值对不对、带凭证时有没有 `Access-Control-Allow-Credentials: true`。
5. **看真实请求的 Status**：常常会发现真实请求 **Status 是 200、响应体也有数据**——这正是「请求已达服务器、被浏览器拦在 JS 之外」的铁证。

```http
# 一次失败的简单请求：真实请求 200，但响应头里没有 Access-Control-Allow-Origin
> GET /data HTTP/1.1
> Origin: https://myapp.com

< HTTP/1.1 200 OK
< Content-Type: application/json
< （此处没有 Access-Control-Allow-Origin —— 浏览器据此拦截）
```

::: warning OPTIONS 显示「失败」但接口其实在工作
预检 OPTIONS 在 Network 里可能标红或显示为受阻，让人误以为「接口挂了」。其实**真实的 GET/POST 那一条**才反映后端逻辑是否执行。排查时务必把 OPTIONS（预检）和真实请求**分开看**：预检管「能不能发」，真实请求管「业务结果」。
:::

::: tip 善用「按发起时间排序 + Initiator 列」
带预检的请求在 Network 里是**成对出现**的（先 OPTIONS 后真实请求）。用 Initiator 列能看出请求是被哪段 JS 发起的，快速定位到具体的 `fetch` / `axios` 调用代码。预检结果会被浏览器缓存（`Access-Control-Max-Age`），所以同一接口第二次可能看不到 OPTIONS，这是正常缓存行为，不是漏发。
:::

## 五、典型排查思路（决策树）

把上面的信息串成一条可执行的排查路径：

1. **先确认是不是真跨域**：当前页面源 ≠ 请求目标源？同源就不会是 CORS 问题，去查别的（鉴权、参数、网络）。
2. **Console 看根因措辞 + Network 看有无 OPTIONS**，二者结合定位：
   - **缺 `Access-Control-Allow-Origin`** → 后端根本没配 CORS，或没对这个路由/方法生效。这是最常见的「No 'Access-Control-Allow-Origin' header」。
   - **`Allow-Origin` 值不匹配** → 后端写死了单个源，或多源场景没有回显当前 `Origin`（且常缺 `Vary: Origin` 导致缓存串源）。
   - **有 OPTIONS 且预检失败** → 检查后端是否处理 OPTIONS、是否返 2xx；自定义头（`Authorization` 等）和方法（`PUT`/`DELETE`）是否进了 `Allow-Headers` / `Allow-Methods`。
   - **带 Cookie 才失败** → 凭证四件套：前端 `credentials: 'include'`、后端 `Access-Control-Allow-Credentials: true`、`Allow-Origin` 必须是具体源（非 `*`）、`Allow-Headers`/`Allow-Methods` 也不能用 `*`。
3. **本地联调线上的特例**：`localhost` 调线上接口跨域，通常**不该让线上长期允许 localhost**（有安全风险），而是走开发代理（Vite `server.proxy` / Nginx 反代）把请求变成同源——具体方案见 [JSONP 与反向代理方案](./jsonp-proxy)。
4. **确认改对了**：修复后回到 Network 面板，确认响应头出现了正确的 `Access-Control-Allow-*`，且 Console 不再报红。

::: danger 排查时最容易走偏的两件事
- **盯着前端代码改 `fetch` 配置**：绝大多数「缺 `Allow-Origin`」的根因在**后端**，前端怎么改 header 都没用（`Origin` 由浏览器控制，不能用 JS 伪造）。
- **用 Postman 验证后就以为没问题**：Postman / curl 不执行同源策略，永远不报 CORS。要验证浏览器行为，必须**在浏览器里**复现并看 Network。
:::

## 小结

- 跨域由**协议 / 域名 / 端口**任一不同触发，子域之间、`localhost` 与 `127.0.0.1` 之间都算跨域。
- 最重要的认知：**CORS 报错是浏览器拦截 JS 读取响应的行为，请求已经到达服务器并被正常处理**——这解释了为何「后端日志有 200、Postman 能通，网页却报跨域」。
- 排查靠两件工具：**Console** 看报错措辞抱怨哪个响应头定位根因，**Network 面板**看有无 OPTIONS 预检、看真实请求的状态码与响应头。
- 修复方向几乎都在**后端补对响应头**或**走代理变同源**，而非在前端改 `fetch`。

承上：源的判定规则见上一页 [同源策略与「源」的定义](./same-origin-policy)。启下：本页只讲现象与定位，简单请求与预检请求的**触发条件、OPTIONS 报文格式、完整 `Access-Control-*` 首部**见下一页 [CORS 简单请求与预检请求](./cors-simple-preflight)。
