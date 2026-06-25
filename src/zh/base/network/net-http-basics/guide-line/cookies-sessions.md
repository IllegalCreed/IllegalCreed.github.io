---
layout: doc
outline: [2, 3]
---

# Cookie 与会话管理

> 基于 HTTP 标准（RFC 6265bis）· 核于 2026-06

## 速查

- HTTP 是**无状态**协议：服务端默认认不出两次请求是否来自同一用户，Cookie 就是在客户端存状态、随请求自动回传的机制。
- 链路：服务端用 `Set-Cookie` **响应头**下发 → 浏览器存储 → 之后同源请求自动带 `Cookie` **请求头**送回。
- `Domain` 定作用域：设了则**含子域**；不设则只发给设置它的那台主机（host-only），更安全。
- `Path` 定路径作用域：`Path=/docs` 命中 `/docs`、`/docs/web`，但不命中 `/`、`/docsets`；**不是安全边界**。
- `Expires`（绝对时间）vs `Max-Age`（相对秒数）：**两者都设时 `Max-Age` 优先**；都不设 = **会话 Cookie**（关浏览器即失效）。
- `Secure`：只在 HTTPS 上发送，防明文链路被窃听；`http:` 页面无法设置带 `Secure` 的 Cookie（localhost 除外）。
- `HttpOnly`：JS 读不到 `document.cookie`，挡 XSS 窃取——会话凭证必开。
- `SameSite`：`Strict` / `Lax`（**现代浏览器默认值**）/ `None`；`None` 跨站发送但**必须同时配 `Secure`**，是 CSRF 的第一道 HTTP 层防线。
- 前缀 `__Host-`：必须 `Secure` + **不带 `Domain`** + `Path=/`，把 Cookie 锁死在单台主机；`__Secure-`：必须 `Secure`。
- 会话两条路线：**服务端 Session + Cookie 存 sessionId**（状态在服务端）vs **Token / JWT 自包含**（状态在客户端，常放 `Authorization` 头）。
- 敏感 Cookie 三件套：`Secure` + `HttpOnly` + `SameSite`（外加 `__Host-` 前缀更稳）。
- 容量：单个 Cookie ~4KB，每域几十到几百个上限；大数据 / 不需回传的数据用 Web Storage，别塞 Cookie。

## 为什么需要 Cookie：无状态协议的状态补丁

HTTP 本身是**无状态**（stateless）的——每个请求独立处理，服务端默认无法把「这次请求」和「上一次请求」关联成同一个用户的连续会话。这对登录态、购物车、个性化设置是个大问题：刷新一下页面，服务端就「不认识你了」。

Cookie 就是补这个缺口的标准方案：让服务端把一小段状态**写到客户端**，浏览器之后每次请求都**自动带上**，服务端读到它就能认出「还是刚才那个浏览器」。它最常见的三类用途：

- **会话管理**：登录态、购物车、游戏分数——本页重点。
- **个性化**：主题、语言、偏好设置。
- **追踪 / 分析**：记录与分析用户行为（第三方追踪 Cookie 正被各浏览器逐步默认拦截，下文有说明）。

::: tip 一句话定位
Cookie 不是「存储方案」，而是「**随请求自动回传的状态**」。需要服务端每次都看到的小段状态（如 sessionId）才放 Cookie；纯客户端、体积大、不必回传的数据应放 Web Storage（详见后文取舍）。
:::

## 工作机制：一次完整的下发与回传

整条链路只有两个 HTTP 头在配合——服务端的 `Set-Cookie`（响应头）和浏览器的 `Cookie`（请求头）：

**① 服务端在响应里下发**（一个响应可带多个 `Set-Cookie`，每个一行）：

```http
HTTP/1.1 200 OK
Content-Type: text/html
Set-Cookie: sessionId=38afes7a8; HttpOnly; Secure; SameSite=Lax
Set-Cookie: theme=dark; Max-Age=31536000
```

**② 浏览器存下来，之后向同源发请求时自动回传**（注意：请求头里只有 `名=值`，所有属性都是给浏览器看的本地元数据，**不会**回传给服务端）：

```http
GET /account HTTP/1.1
Host: example.com
Cookie: sessionId=38afes7a8; theme=dark
```

::: warning 服务端收不到属性
请求的 `Cookie` 头**只携带名值对**，`Domain` / `Path` / `Expires` / `SameSite` 等属性一律不回传。所以服务端无法靠读 Cookie 头判断「这条 Cookie 是不是带了 HttpOnly」——属性只影响浏览器的存取与发送行为。
:::

## Set-Cookie 属性逐个讲

下面这张表是本页的核心，逐个属性给出语义与要点：

| 属性 | 取值示例 | 作用 | 要点 |
| --- | --- | --- | --- |
| `Domain` | `Domain=example.com` | 指定能收到该 Cookie 的主机 | 设了则**含全部子域**；不设则 host-only（仅设置它的主机）；只能设为自身或父域，不能设兄弟域/子域 |
| `Path` | `Path=/docs` | 请求 URL 须以此路径开头才发送 | 目录前缀匹配；**不是安全措施**，挡不住同站其他路径读取 |
| `Expires` | `Expires=Wed, 21 Oct 2026 07:28:00 GMT` | 绝对过期时刻（HTTP-date） | 基于**客户端时钟**，机器时间不准会出错；不设即会话 Cookie |
| `Max-Age` | `Max-Age=2592000` | 相对当前的存活秒数 | **与 `Expires` 同设时优先**；`0` 或负数表示立即删除；更不易出错，推荐 |
| `Secure` | `Secure` | 仅经 HTTPS 加密链路发送 | 防中间人明文窃听；`http:` 页面无法设置（localhost 例外） |
| `HttpOnly` | `HttpOnly` | 禁止 JS 通过 `document.cookie` 读取 | 缓解 XSS 窃取会话凭证；JS 发起的请求仍会自动带上 |
| `SameSite` | `SameSite=Lax` | 控制跨站请求是否携带 | `Strict`/`Lax`/`None`；现代浏览器默认 `Lax`；`None` 须配 `Secure`（详见下节） |
| `Partitioned` | `Partitioned` | 按顶级站点分区存储（CHIPS） | 第三方 Cookie 隔离方案；须同时配 `Secure` 与 `SameSite=None` |

### Expires vs Max-Age 与会话 Cookie

二者都用来定**有效期**，区别在「绝对 vs 相对」：

```http
Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2026 07:28:00 GMT   # 绝对时刻，依赖客户端时钟
Set-Cookie: id=a3fWa; Max-Age=2592000                         # 30 天后过期，相对、推荐
```

- **两者都设**：`Max-Age` 优先（不受客户端时钟漂移影响，更可靠）。
- **都不设**：这是一条**会话 Cookie**——会话结束（通常关浏览器）即删除。但「会话」何时结束由浏览器定义，部分浏览器的「恢复上次会话」会让会话 Cookie 实际续命，不能当成「绝对短命」来用。

### Secure 与 HttpOnly：两道独立防线

这两个属性各防一类威胁，互不替代，敏感 Cookie 通常一起开：

- **`Secure`** 管**传输安全**：只在 HTTPS 上发送，防止明文 HTTP 链路被中间人嗅探。它不防 JS 读取，也不防本地磁盘被翻。
- **`HttpOnly`** 管**脚本隔离**：打了这个标记，`document.cookie` 读不到它，即便页面被注入恶意脚本（XSS）也偷不走会话凭证。它不影响请求自动携带——`fetch` / `XHR` 发请求时浏览器照样带上。

```http
Set-Cookie: sessionId=38afes7a8; Secure; HttpOnly; SameSite=Lax
```

### SameSite：跨站携带与 CSRF 第一道防线

`SameSite` 决定「从**别的站点**发起的请求」要不要带上本站 Cookie，是缓解 CSRF（跨站请求伪造）的关键开关。三个取值：

| 取值 | 跨站请求是否携带 | 典型场景 |
| --- | --- | --- |
| `Strict` | 一律**不带** | 改密码、转账、加购等敏感操作的会话 Cookie，安全性最高 |
| `Lax`（默认） | 仅**顶层导航 + 安全方法**（点链接跳转的 GET）带 | 兼顾安全与可用性，现代浏览器在未声明时的默认值 |
| `None` | **都带**（同站跨站均带） | 嵌入式第三方组件、跨站登录态；**必须同时配 `Secure`** |

```http
Set-Cookie: sid=...; SameSite=Strict                 # 跨站绝不携带
Set-Cookie: sid=...; SameSite=Lax                     # 等价于不写（现代默认）
Set-Cookie: sid=...; SameSite=None; Secure            # 跨站携带，强制 HTTPS
```

::: tip Lax 的精确边界
`Lax` 的「带」仅限**顶层导航**（地址栏地址变化，如点链接、`window.location` 跳转）且使用**安全方法**（GET/HEAD）。`<img>`、`<iframe>`、跨站 `fetch`、表单 POST 等都**不带**。正因 POST 默认不带，`Lax` 才能挡住绝大多数 CSRF。
:::

::: warning `None` 离不开 `Secure`
单写 `SameSite=None` 而不配 `Secure`，现代浏览器会**直接丢弃**这条 Cookie。跨站携带必然是更高风险场景，所以规范强制它走加密链路。
:::

> CSRF 的完整攻击原理与纵深防御（CSRF Token、二次确认、`Origin`/`Referer` 校验等）属「浏览器安全」专题，本页只覆盖 `SameSite` 这一道 HTTP 层防线。同样地，跨站请求要携带 Cookie 还涉及 CORS 的 `withCredentials` / `Access-Control-Allow-Credentials`，属「跨域与同源策略」专题，此处不展开。

### Cookie 前缀：把约束写进名字

`__Host-` 与 `__Secure-` 是写在 **Cookie 名**里的安全约束——浏览器看到这种前缀就强制校验对应属性，不满足直接拒收，等于把安全要求「焊死」在名字上，防止被降级或被子域覆盖：

| 前缀 | 强制要求 | 效果 |
| --- | --- | --- |
| `__Secure-` | 必须带 `Secure`，且由 HTTPS 页面设置 | 保证这条 Cookie 一定走加密链路 |
| `__Host-` | 必须 `Secure` + **不能带 `Domain`** + `Path=/` | 锁死在**单台主机**，子域无法读写/覆盖，最接近「以源为安全边界」 |

```http
Set-Cookie: __Host-sessionId=38afes7a8; Secure; HttpOnly; Path=/; SameSite=Lax
```

::: tip 会话 Cookie 的推荐写法
登录态优先用 `__Host-` 前缀：它一次性保证了「HTTPS + 不外溢到子域 + 全站路径」，再叠加 `HttpOnly` + `SameSite`，是当前最稳的会话 Cookie 配置。前缀约束仅在支持的浏览器生效，旧浏览器会忽略前缀照常接收——服务端逻辑仍需自行校验，别把它当唯一防线。
:::

## 会话管理方案对比：有状态 vs 无状态

认出「这是登录用户」有两条主流路线，差别在**状态存哪**：

### 服务端 Session + Cookie（sessionId）

会话数据（用户身份、权限、购物车等）存在**服务端**（内存 / Redis / 数据库），Cookie 里只放一个**不透明的 sessionId**：

```http
Set-Cookie: __Host-sessionId=opaque-random-id; Secure; HttpOnly; SameSite=Lax; Path=/
```

- **优点**：Cookie 不含敏感信息，仅是查表的钥匙；服务端随时可让会话失效（登出、踢人、改权限即时生效）。
- **代价**：服务端要存会话状态，多实例需共享存储（如 Redis），有一定横向扩展成本。
- **安全要点**：用户每次**重新认证后应重新签发 sessionId**，防会话固定（session fixation）攻击。

### Token（如 JWT）

会话状态**自包含**在令牌里（JWT = 头部 + 载荷 + 签名），服务端靠**验签**确认其真实性，无需查存储。令牌常放在 `Authorization: Bearer <token>` 请求头，也可放 Cookie：

- **优点**：服务端**无状态**，天然适合水平扩展、跨服务（微服务 / 第三方 API）传递身份。
- **代价**：签发后**难以主动撤销**（要等过期，或额外维护黑名单 / 短时令牌 + 刷新令牌机制，反而引回部分状态）；载荷可被解码，**不能放敏感明文**。
- **放哪**：放 `Authorization` 头则不受 Cookie 自动携带与 CSRF 影响，但 XSS 可读（需自行妥善存放）；放 Cookie 则可借 `HttpOnly` + `SameSite` 防护，但要自行处理 CSRF。

::: tip 怎么选
单体 / 中小应用、需要「即时登出」与最小客户端暴露 → **服务端 Session + sessionId Cookie**（配 `__Host-` 三件套）通常更省心；分布式 / 跨服务 / 移动端与第三方 API → **Token** 更契合无状态扩展，但要正视撤销与存放问题。两者并非互斥，常见做法是「短时 Access Token + 服务端可撤销的 Refresh Token」折中。
:::

## 安全要点小抄

::: warning 敏感 Cookie 必做
- **`HttpOnly`**：挡 XSS 窃取——会话凭证绝不让 JS 读到。
- **`SameSite`**（`Strict` 或 `Lax`）：缓解 CSRF，挡住跨站伪造请求自动带 Cookie。
- **`Secure`**：强制 HTTPS，防明文链路泄露。
- **`__Host-` 前缀**：锁定单主机、禁子域覆盖，把上述约束焊进名字。
- **重新认证后重签 sessionId**：防会话固定。
- **不在 Cookie / JWT 载荷里放敏感明文**：Cookie 用不透明 id，JWT 载荷可被解码。
:::

## 实务：容量限制与 Web Storage 取舍

- **大小**：单个 Cookie 约 **4KB**（名+值+属性合计），每个域可存的 Cookie 数有上限（按浏览器从几十到几百不等）。超限会被丢弃或挤掉旧 Cookie。
- **每请求开销**：同源的**每个**请求都会自动带上匹配的 Cookie，塞太多会徒增请求体积、拖慢性能。Cookie 只该放「服务端每次都要看的小段状态」。
- **与 Web Storage 取舍**：`localStorage` / `sessionStorage` 容量大得多（约 5MB），且**不随请求自动发送**——适合纯客户端、不必回传服务端的数据（UI 偏好、草稿、缓存）。但它们能被 JS 读取，**不适合存会话凭证**（无 `HttpOnly` 等价物，易被 XSS 读走）。一句话：**要回传、要防脚本读 → Cookie；纯前端、体积大、不回传 → Web Storage**。Web Storage 与 IndexedDB 的完整用法属「Web API」专题，此处仅作对比。

::: tip 第三方 Cookie 的现状
跨站（第三方）Cookie 正被各浏览器逐步**默认拦截**，社交挂件、跨站追踪等依赖它的功能会逐渐失效。新代码应减少对第三方 Cookie 的依赖；确有跨站存储需求时，关注 `Partitioned`（CHIPS）等分区方案。
:::

## 小结

Cookie 是给无状态 HTTP 打的「状态补丁」：服务端用 `Set-Cookie` 下发、浏览器自动用 `Cookie` 头回传；`Domain`/`Path` 划作用域，`Expires`/`Max-Age` 定寿命（`Max-Age` 优先、都不设即会话 Cookie），而真正决定安全的是 `Secure` + `HttpOnly` + `SameSite` 三件套外加 `__Host-` 前缀。会话管理则在「服务端 Session 存状态」与「Token 自包含」之间按可撤销性与扩展性取舍。把状态这层讲透后，下一页回到连接与传输本身——[持久连接、范围请求与缓存首部](./connection-range-caching)。
