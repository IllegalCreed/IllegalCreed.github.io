---
layout: doc
---

# Scalar

消费 OpenAPI/Swagger 规范、渲染出**现代交互式 API 参考文档**的开源（MIT）工具——而且内置一个**能真实发请求的 API 客户端**。它的输入是已有的 OpenAPI spec，输出是给人浏览、可直接调试接口的文档界面。一句话：它**消费 spec，不生成 spec**。规范的生成交给上游（如 NestJS 的 Swagger 模块、各类 OpenAPI 生成器），Scalar 负责把这份规范渲染得好看、可交互。它最常被拿来替换观感偏老的 Swagger UI，又比只读的 Redoc 多出一整套可发请求的客户端。

## 评价

**优点**

- 内置完整 API 客户端：可对接口发**真实请求**，支持环境变量、请求历史、25+ 语言代码片段，远超 Swagger UI 的 Try it out
- 现代 UI：11 套内置配色主题 + `modern` / `classic` 两种布局 + `customCss` 精修，观感与可读性优于 Swagger UI
- 大文档渲染性能优化：接口数量庞大时仍较流畅
- 30+ 框架一等集成：Fastify / NestJS / Hono / Express / React / Vue 等都有官方包，以中间件或组件形式接入
- MIT 开源、offline-first 可自托管：能完全部署在内网，满足数据不出域

**缺点**

- 只消费不生成：拿不到现成的 OpenAPI spec 就用不起来，生成仍要靠上游工具
- 版本线分裂：核心包与各框架集成包**版本号各不相同**（仅 fastify 与核心同步），落地易装错版本
- 跨域要额外处理：内置客户端从浏览器直连接口，未配 `proxyUrl` 或后端未开 CORS 会失败
- 开源渲染器与托管平台（Registry/Dashboard）是两层，混淆易误判收费边界
- 仍在快速演进：旧 API（`data-url` 标签、`fetch` 选项）已弃用，跟随旧教程易踩坑

## 文档地址

[Scalar](https://guides.scalar.com/scalar/introduction)

## GitHub地址

[Scalar](https://github.com/scalar/scalar)

## 幻灯片地址

<a href="/SlideStack/scalar-slide/" target="_blank">Scalar</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=scalar" target="_blank" rel="noopener noreferrer">Scalar 测试题</a>
