---
layout: doc
outline: [2, 3]
---

# 参考：GraphQL IDE 速查、Apollo Server 配置与易错点

> 基于 Apollo Server 4 · Apollo Sandbox · 核于 2026-08

## 速查

- **Apollo Sandbox**：Apollo Server 4+ 默认 GraphQL IDE，本地优先、可离线、无需账号，访问根路径即用。
- **核心能力**：Schema 探索（自动 introspection + 文档面板）+ 查询构建（字段补全/语法检查）+ 变量/Header 分离 + 响应美化与错误 path 高亮。
- **替换关系**：Sandbox 替换了已 EOL 的 GraphQL Playground（2022-12-31 停止维护）。
- **备选**：GraphiQL（基金会参考实现，通用可嵌入）/ Banana Cake Pop（.NET Hot Chocolate 生态）/ Playground（**勿用**）。
- **默认端口**：Apollo Server 4 默认 4000，Sandbox 默认连 `http://localhost:4000/`。
- **前提**：Apollo Server 必须开启 introspection（本地默认开，生产常关）与 CORS（v4 默认允许）。
- **与 GraphOS**：登录后可发布 Schema 到 GraphOS，配合 Rover CLI 做 CI 自动注册——可选，非本地开发必需。

## 一、GraphQL IDE 速查表

| IDE | 维护 | 定位 | 适合后端 | 特色 |
| --- | --- | --- | --- | --- |
| **Apollo Sandbox** | ✅ 活跃 | Apollo Server 默认 | Apollo Server | 本地优先、与 GraphOS 协同 |
| **GraphiQL** | ✅ 活跃 | 基金会参考实现 | 任意（可嵌入） | 轻量、跨框架、组件化 |
| **Banana Cake Pop** | ✅ 活跃 | ChilliCream 生态 | Hot Chocolate (.NET) | Schema diff、subscription |
| **GraphQL Playground** | ❌ EOL 2022-12-31 | 历史 IDE | **勿用** | 无安全更新 |

## 二、Apollo Server 4 IDE 配置

```ts
// 默认：Sandbox（无需配置）
const server = new ApolloServer({ typeDefs, resolvers });

// 禁用落地页
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
const server = new ApolloServer({
  typeDefs, resolvers,
  plugins: [ApolloServerPluginLandingPageDisabled()],
});

// 强制用 GraphQL Playground（不推荐，已 EOL）
import { ApolloServerPluginLandingPageGraphQLPlayground } from '@apollo/server-plugin-landing-page-graphql-playground';
const server = new ApolloServer({
  typeDefs, resolvers,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});
```

## 三、Apollo Server 版本与默认 IDE 对照

| Apollo Server | 默认 IDE | 说明 |
| --- | --- | --- |
| v2 及更早 | GraphQL Playground | 当年 Playground 仍活跃 |
| v3 | Apollo Sandbox（替换 Playground） | Playground 进入 EOL 倒计时 |
| v4 | Apollo Sandbox | Playground 内置支持完全移除 |

## 四、Sandbox 常用操作

| 操作 | 方式 |
| --- | --- |
| 打开 Sandbox | 浏览器访问 Apollo Server 根路径 `/` |
| 改 endpoint | 顶部 URL 栏手动输入 |
| 填变量 | 左下 Variables 面板（JSON） |
| 填鉴权 | Headers 面板（如 `Authorization: Bearer xxx`） |
| 运行查询 | 点播放按钮 / 快捷键 Ctrl+Enter |
| 切换操作 | 一个文档多个 query 时，下拉选要跑的 |
| 浏览 Schema | 左侧文档面板，支持搜索 |

## 五、易错点清单

- **「Apollo Sandbox 必须登录 Apollo 账号才能用」**：错。Sandbox 可离线、无需账号，核心 IDE 功能完全本地；登录只为发布 Schema 到 GraphOS。
- **「GraphQL Playground 还能用所以不用换」**：错。Playground 自 2022-12-31 EOL，无安全更新，是技术债，应迁移。
- **「Sandbox 也能用于 mercurius/async-graphql」**：部分对。Sandbox 本质是个 web IDE，理论上能连任意 GraphQL 端点，但它是为 Apollo Server 优化的默认落地页；非 Apollo 后端用 GraphiQL 更顺。
- **「生产环境也开 introspection 没事」**：错。生产关 introspection 是安全实践（防 Schema 信息泄露）；Sandbox 仅本地开发用。
- **「Sandbox 就是 GraphiQL」**：错。两者都是 GraphQL IDE，但 Sandbox 是 Apollo 专属（本地 Studio 模式），GraphiQL 是基金会通用参考实现。
- **「Banana Cake Pop 是 Apollo 的产品」**：错。它是 ChilliCream/Hot Chocolate（.NET）团队的产品，与 Apollo 无关。
- **「Sandbox 响应慢是因为 Apollo 云」**：错。Sandbox 本地运行，请求直连本地 Apollo Server，不经过 Apollo 云；慢多半是查询本身慢或 introspection 大。
- **「改了 endpoint 但 Sandbox 还连旧的」**：检查顶部 URL 栏是否真的改了，以及 Apollo Server CORS 是否允许该源。

## 六、进阶方向（链接其他叶）

- [API 客户端](../../api-clients/) —— Postman/Bruno/Insomnia 也支持 GraphQL，与 Sandbox 互补
- [k6](../../k6/) —— GraphQL 接口的负载测试

## 权威链接

- [Apollo Sandbox 官方文档](https://www.apollographql.com/docs/graphos/platform/sandbox)
- [Apollo Server 4 文档](https://www.apollographql.com/docs/apollo-server/)
- [GraphiQL 项目](https://github.com/graphql/graphiql)
- [Banana Cake Pop](https://chillicream.com/docs/banana-cake-pop)
- [GraphQL Playground EOL 说明](https://www.apollographql.com/docs/apollo-server/v2/testing/graphql-playground)
- [Rover CLI](https://www.apollographql.com/docs/rover/)
- 本站幻灯片：<a href="/SlideStack/apollo-sandbox-slide/" target="_blank">Apollo Sandbox</a>
