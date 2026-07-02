---
layout: doc
outline: [2, 3]
---

# Cookie 的浏览器侧

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- `document.cookie` 是**访问器属性**（getter/setter），读和写走的是两条完全不同的路——写进去的格式和读出来的格式不一样
- **读**：返回一整根字符串 `"a=1; b=2"`——所有匹配 Cookie 的名值对；**读不到任何属性**（Domain/Path/过期时间一概不可见）
- **HttpOnly Cookie 根本不出现在 `document.cookie` 里**——它是浏览器里唯一 JS 读不到的存储位
- **写**：一次赋值只能设**一条** Cookie；`document.cookie = "k=v; max-age=3600"` 是「新增/更新一条」而不是「覆盖全部」
- 写失败**静默无报错**：给别人的域设 Cookie、violating 前缀规则……浏览器直接忽略，不抛异常
- 容量：RFC 6265 要求实现至少支持**单条 4096 字节**（名+值+属性合计）、**每域 50 条**、总量 3000 条——工程上按「单条 ~4KB、每域几十条」记
- **随每个匹配请求自动上行**：Cookie 里多 1KB，全站每个请求都多 1KB——这是它不当存储用的根本原因
- 值该用 `encodeURIComponent()` 编码，分号/逗号/空白会破坏格式
- 删除 = 写一条同名、过期时间在过去的 Cookie（`max-age=0` 或 `expires` 设过去时间）
- `document.cookie` 是**同步 API**；异步替代品 **Cookie Store API** 可在 Service Worker 用，但各引擎兼容性尚未拉齐，用前查表
- 本页只讲浏览器侧；`Set-Cookie` 属性语义、会话方案见 [Cookie 与会话管理](/zh/base/network/net-http-basics/guide-line/cookies-sessions)，SameSite/CHIPS 深挖见 [SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep)

## 一、document.cookie：一个伪装成字符串的访问器

`document.cookie` 长得像个普通字符串属性，实际是**原生 getter/setter**——这解释了它几乎所有的怪癖：

```js
// 读：拿到的是「当前文档可见的所有 Cookie」拼成的一根字符串
console.log(document.cookie);
// "theme=dark; lang=zh-CN"（分号+空格分隔的名值对）

// 写：一次赋值 = 新增/更新【一条】Cookie，不会覆盖其他条
document.cookie = "theme=light; max-age=31536000; path=/";
// 再读，theme 变了，lang 还在
```

### 1.1 读的三个坑

- **只有名和值**：Domain、Path、Expires、Secure……任何属性都读不出来。想知道「这条 Cookie 什么时候过期」？浏览器侧没有 API 能回答（DevTools 的 Application 面板才看得到）。
- **HttpOnly 完全隐身**：带 `HttpOnly` 的 Cookie 不会出现在返回值里。这不是缺陷而是设计——它让会话凭证对 XSS 注入的脚本不可见。
- **解析要自己来**：拿到的是一根字符串，取单个值得自己 `split("; ")` 再找——这门「祖传手艺」也是 Cookie 作为存储体验糟糕的日常注脚。

### 1.2 写的三个坑

- **一次一条**：想设三条 Cookie 就要赋值三次；把多条拼进一次赋值，后面的会被当成第一条的属性。
- **静默失败**：给非当前文档域写 Cookie、`http:` 页面写 `Secure` Cookie、违反 `__Host-` 前缀约束——统统**不抛错、不生效**。线上「Cookie 怎么没写进去」的排查，第一步永远是打开 DevTools 看真相。
- **编码自理**：值里出现分号、逗号、空白会破坏整根字符串的格式，规范做法是 `document.cookie = "k=" + encodeURIComponent(value)`。

属性怎么填（`path`/`domain`/`max-age`/`samesite`……）属于 Set-Cookie 语义，本叶不重复——见 [Cookie 与会话管理](/zh/base/network/net-http-basics/guide-line/cookies-sessions)的逐属性精讲。

### 1.3 名字里的约束：前缀也是浏览器侧规则

Cookie 前缀由**浏览器在写入时强制校验**，不满足约束同样静默失败——所以它属于浏览器侧知识：

| 前缀 | 浏览器强制的写入约束 |
| --- | --- |
| `__Secure-` | 必须 HTTPS 且带 `Secure` |
| `__Host-` | 必须 HTTPS + `Secure`，**不得设 `Domain`**、`Path` 必须 `/`——锁死单主机 |
| `__Http-` | 必须 `HttpOnly`——从名字上宣告「JS 写不了」，`document.cookie` 与 Cookie Store API 都设不动（较新，注意兼容性） |
| `__Host-Http-` | 上两者约束合体 |

对前端的实际意义：看到 `__Http-` 开头的名字连试都不用试，它只可能来自服务端 `Set-Cookie`。前缀的安全语义仍归网络章。

## 二、容量与条数：4KB 的天花板

RFC 6265 §6.1 对实现的最低要求：**每条 Cookie 至少 4096 字节**（名、值、属性长度合计）、**每域至少 50 条**、**总量至少 3000 条**。各浏览器实际上限围绕这些下限浮动（每域几十到几百条不等），但工程记忆只需要一条：**单条 ~4KB、每域几十条起步——这是六种存储机制里最小的天花板**。超限的行为也不友好：新 Cookie 被丢弃或挤掉旧的，同样静默无报错。

## 三、随请求自动发送：每个字节都要乘以请求数

Cookie 与其他五种存储的本质区别：**它是发给服务器的信头，不是存给自己的数据**。每个匹配 Domain/Path/SameSite 规则的 HTTP 请求——HTML、JS、CSS、图片、XHR/fetch——都会自动带上 `Cookie` 请求头。

算笔账：Cookie 总量 4KB、页面加载发 50 个同源请求，仅上行就多出 **200KB**，且上行带宽通常远小于下行。web.dev 的立场因此很干脆：「存的东西一多，每个 Web 请求的体积都会显著增大」——**Cookie 不当存储用**。它只该装「服务端每个请求都要看的最小状态」，通常就是一个会话标识。

## 四、HttpOnly：从存储视角看会话凭证该放哪

把六种机制当候选存储位横向看，会得到一个安全上的关键结论：

- localStorage/sessionStorage/IndexedDB/Cache API/OPFS——**页面里任何 JS 都能读**。一旦有 XSS，注入脚本同样能读。
- **HttpOnly Cookie 是唯一对 JS 不可见的存储位**：`document.cookie` 读不到、Cookie Store API 也拿不到，但浏览器照常随请求回传给服务端。

所以「token 别放 localStorage」的存储视角解释就一句话：**放得进 JS 读得到的地方，就偷得走**；会话凭证应放 HttpOnly Cookie（配 `Secure` + `SameSite`）。攻防细节归安全主题与网络章，此处只立结论。

## 五、Cookie Store API：迟到的异步替代

`document.cookie` 还有个隐性成本：**同步**。Cookie 数据在现代浏览器里由浏览器进程统一管理，同步读取可能意味着跨进程等待。为此规范侧给出了异步的 **Cookie Store API**（`cookieStore.get()/set()/delete()`，Promise 风格，还能在 Service Worker 里用——`document.cookie` 在 Worker 里根本不存在）。方向是对的，但各引擎支持进度不一，跨浏览器项目使用前务必查兼容性表；完整 API 属 Web API 章（待产出）。

## 六、排查：DevTools 是唯一的全知视角

既然 JS 读不到属性、写失败又不报错，Cookie 问题的排查主场只能是 DevTools（Chrome/Edge：Application → Cookies；Firefox：存储面板）：每条 Cookie 的 Domain/Path/Expires/Secure/HttpOnly/SameSite/Partitioned 全部可见，还能单条删除、按域过滤。两个高频排查姿势：

- 「写了没生效」→ 面板里根本没出现：多半是域不匹配、`http:` 页面写 `Secure`、或违反前缀约束——写入被静默丢弃。
- 「JS 读不到但请求里有」→ 面板里该条的 **HttpOnly 列打了勾**：一切正常，本来就不该读到。

## 七、浏览器侧小抄

```js
/** 读单个 Cookie（祖传手艺版） */
function getCookie(name) {
  // document.cookie 形如 "a=1; b=2"，按分隔符拆开逐条匹配
  const hit = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

/** 写：值编码 + 常用属性；一次只能写一条 */
document.cookie = `draft=${encodeURIComponent("你好; world")}; max-age=86400; path=/; samesite=lax`;

/** 删：同名 + 过期时间设为过去（属性 path/domain 要与原 Cookie 一致才能命中） */
document.cookie = "draft=; max-age=0; path=/";
```

## 小结

- `document.cookie` 是访问器不是数据属性：读是「全部名值对拼串」，写是「一次一条」，属性永远读不到，失败永远静默。
- 容量天花板全场最低：RFC 6265 下限单条 4096 字节、每域 50 条——只装服务端每次都要看的最小状态。
- 「随请求自动发送」既是 Cookie 的存在意义，也是它不配当存储的原因：每个字节都要乘以请求数。
- HttpOnly Cookie 是唯一 JS 读不到的存储位——会话凭证放这里，而不是 localStorage。
- 语义与会话方案回网络章；下一页看纯客户端阵营的老将：[Web Storage 存储模型](./web-storage-model)。
