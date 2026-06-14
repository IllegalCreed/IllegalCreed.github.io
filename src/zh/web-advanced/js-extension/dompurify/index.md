---
layout: doc
---

# DOMPurify

::: tip 本篇范围
本篇聚焦 **DOMPurify —— 一个基于 DOM、超快、高容错的 XSS 净化器**，用于把不可信的 HTML / MathML / SVG 清洗成可安全插入页面的内容。它解决的是「**要把用户提交的富文本渲染成 HTML**」这一类场景的安全问题，与 `v-html`、`dangerouslySetInnerHTML`、`innerHTML` 配套使用。版本基线 **DOMPurify 3.x**（源码 TypeScript、自带类型、发布产物为纯 JS）。
:::

DOMPurify 由 [cure53](https://cure53.de/) 安全团队维护，官方定位是「**a DOM-only, super-fast, uber-tolerant XSS sanitizer for HTML, MathML and SVG**」。它的核心思路与「用正则过滤」截然不同：**借浏览器自身的 DOM 解析器把脏字符串解析成真实 DOM 树，再按白名单移除危险标签与属性，最后序列化回安全字符串**。正因为复用了浏览器解析器，它能扛住大小写变体、编码实体、畸形嵌套、命名空间混淆乃至 mutation XSS（mXSS）这类「自己写正则永远补不全」的绕过。

最该记牢的几条「现状」：**核心 API 只有一个 `DOMPurify.sanitize(dirty, config?)`**，默认返回**净化后的字符串**；返回类型随配置变化——`RETURN_DOM`→`Node`、`RETURN_DOM_FRAGMENT`→`DocumentFragment`、`RETURN_TRUSTED_TYPE`→`TrustedHTML`、`IN_PLACE`→就地净化的 `Node`，且 3.x 用 **TypeScript 函数重载**精确刻画了这些返回类型。**默认白名单相当丰富**（HTML + SVG + MathML + 文本），`ALLOW_DATA_ATTR` / `ALLOW_ARIA_ATTR` 默认 `true`，`SANITIZE_DOM` 默认 `true`（防 DOM Clobbering）。**净化必须紧挨着「写入 DOM」这一步**——先净化、之后再被别的库改写 HTML，可能让净化失效。**Node 端要用 jsdom 提供 window**（`createDOMPurify(window)`），同构项目可用 `isomorphic-dompurify`。

## 评价

**优点**

- **真正抗绕过**：复用浏览器 DOM 解析器 + 白名单清理，能扛住 HTML 容错变体与 mXSS，远胜手写正则
- **API 极简**：核心就一个 `sanitize()`，开箱即得安全字符串，可直接喂给 `v-html` / `dangerouslySetInnerHTML`
- **配置丰富而克制**：`ALLOWED_TAGS` / `FORBID_TAGS` / `USE_PROFILES` / `ADD_TAGS` 等覆盖从「只留一个标签」到「放开 SVG」的各种需求
- **返回类型可选**：字符串 / DOM 节点 / DocumentFragment / TrustedHTML，配合 TS 重载有精确类型推断
- **hooks 可深度定制**：`addHook` 在 `uponSanitizeElement` / `afterSanitizeAttributes` 等入口逐节点处理（加 `rel`、校验 iframe 来源等）
- **Trusted Types 原生集成**：`RETURN_TRUSTED_TYPE` 直接产出可赋给受保护 sink 的 `TrustedHTML`，契合严格 CSP
- **DOM Clobbering 防护**：`SANITIZE_DOM` 默认开启，`SANITIZE_NAMED_PROPS` 可加 `user-content-` 前缀进一步隔离
- **同构可用**：Node 端配 jsdom，SSR/同构项目用 `isomorphic-dompurify` 一个 import 通吃两端
- **TypeScript 友好**：3.x 源码即 TS，发布产物为纯 JS 且自带类型声明，开箱即用

**缺点**

- **依赖 DOM**：浏览器外（Node）必须借 jsdom 等提供 `window`，否则无法工作
- **只净化、不渲染**：它不负责把 Markdown / 模板渲染成 HTML，需放在渲染管线的「插入前」一环
- **配置放宽即风险**：放开 `iframe`、`ALLOW_UNKNOWN_PROTOCOLS`、关闭 `SANITIZE_DOM` 等会扩大攻击面，需谨慎
- **全局 hooks 易串扰**：`addHook` 挂在实例（常为全局单例）上、对每次 `sanitize` 都生效，多模块叠加需用多实例或配对移除隔离
- **不是万能层**：应与 CSP 等构成纵深防御，不能因为净化了就省掉 CSP
- **顺序敏感**：净化后再被其它库改写 HTML 可能 void 掉净化效果，必须控制处理时序

## 文档地址

[DOMPurify (README)](https://github.com/cure53/DOMPurify#readme)

## GitHub 地址

[cure53/DOMPurify](https://github.com/cure53/DOMPurify)

## 幻灯片地址

<a href="/SlideStack/dompurify-slide/" target="_blank">DOMPurify</a>
