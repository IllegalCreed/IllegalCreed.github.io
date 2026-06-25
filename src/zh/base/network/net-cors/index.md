---
layout: doc
---

# 跨域与同源策略

同源策略（SOP）是浏览器最核心的安全基石——它限制一个源的脚本读取另一个源的数据，挡住恶意站点窃取你在其他站点的信息。但现代前端天然需要跨域：调不同域的 API、用 CDN、嵌第三方页面。本叶先讲清 SOP 到底限制什么、为什么跨域会报错，再系统讲解放行跨域的标准方案 **CORS**（简单请求、预检、凭证），以及 JSONP / 反向代理等手段，最后到 Cookie SameSite 与 COOP/COEP 跨源隔离——覆盖前端处理跨域所需的完整知识。

## 概述

- **同源策略 SOP**：「源 = 协议 + 域名 + 端口」三元组全等才同源；SOP **拦的是「读取」而非「发送」**——跨源请求常照常送达服务器，浏览器只是拦住脚本读取响应。
- **CORS 机制**：服务器通过 `Access-Control-*` 响应头**授权**浏览器放行跨源读取；非简单请求会先发 OPTIONS **预检**。
- **关键认知**：CORS 报错是**浏览器行为**——请求其实到了服务器、响应也回来了，只是浏览器拦截了 JS 读取（所以 Postman/curl 不受影响）。
- **前端关切点**：正确配 CORS 响应头（尤其凭证 + 不能用 `*` 的坑）、开发环境用代理绕开、Cookie SameSite 防 CSRF、COOP/COEP 跨源隔离解锁 SharedArrayBuffer；而 XSS/CSRF 攻防本身属「浏览器安全」叶。

## 本叶地图

- [入门](./getting-started) —— 同源策略与跨域的全景，CORS 如何放行
- [同源策略与「源」的定义](./guide-line/same-origin-policy) —— 源三元组、SOP 限制什么、跨域 vs 跨站
- [跨域常见场景与报错排查](./guide-line/cross-origin-scenarios) —— 典型场景、CORS 报错解读、DevTools 定位
- [CORS 简单请求与预检请求](./guide-line/cors-simple-preflight) —— 简单请求三条件、预检 OPTIONS、Max-Age
- [CORS 凭证与 Access-Control 首部全谱](./guide-line/cors-credentials-headers) —— 凭证请求、凭证 + 通配符冲突、响应头全谱
- [JSONP 与反向代理方案](./guide-line/jsonp-proxy) —— JSONP 原理与淘汰、反向代理、Vite/nginx proxy
- [Cookie SameSite 与 COOP/COEP/CORP](./guide-line/samesite-coop-coep) —— SameSite 三值、跨源隔离、crossOriginIsolated
- [参考](./reference) —— SOP 判定 + CORS 流程 + 响应头表 + 权威链接

## 文档地址

- [MDN: 同源策略](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)
- [MDN: 跨源资源共享 CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS) · [CORS 错误](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors)
- [Fetch 标准: CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [web.dev: same-site 与 same-origin](https://web.dev/articles/same-site-same-origin)

## 幻灯片地址

<a href="/SlideStack/net-cors-slide/" target="_blank">跨域与同源策略</a>
