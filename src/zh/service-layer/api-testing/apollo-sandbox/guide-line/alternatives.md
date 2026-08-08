---
layout: doc
outline: [2, 3]
---

# 备选方案：GraphiQL、Banana Cake Pop 与 Playground 历史

> 基于 Apollo Server 4 · GraphiQL · Banana Cake Pop · 核于 2026-08

## 速查

- **GraphiQL**：GraphQL 基金会维护的**参考实现**（reference implementation），轻量、可嵌入，许多 GraphQL 服务器框架默认带它是 IDE；吸收了 Playground 的部分功能（如多标签）。通用、跨后端框架的首选。
- **Banana Cake Pop**：ChilliCream/Hot Chocolate 生态（.NET）的现代 GraphQL IDE，支持 Schema 探索、查询、subscription、schema diff；Hot Chocolate 服务器默认带它。
- **GraphQL Playground（已 EOL）**：Prisma 团队开发的早期 IDE，曾是最流行的 GraphQL IDE，但 2020 年后基本停止维护，**Apollo 官方 2022-12-31 宣布 EOL**，新项目勿用。
- **选型口诀**：①Apollo 后端 → **Apollo Sandbox**（默认）；②通用/可嵌入/非 Apollo → **GraphiQL**；③.NET Hot Chocolate → **Banana Cake Pop**；④任何场景都别再选 **Playground**。
- **Sandbox vs GraphiQL**：Sandbox 功能更全（Schema 探索体验、字段补全、与 GraphOS 衔接），但绑定 Apollo Server；GraphiQL 更轻量可嵌入任意框架，功能精简够用。
- **Sandbox vs Banana Cake Pop**：Sandbox 是 Apollo 生态专属；Banana Cake Pop 是 .NET 生态专属，两者基本按后端框架走，少有跨生态选择。
- **Playground 迁移**：老项目还在用 Playground 的应迁移到 Sandbox 或 GraphiQL——Apollo Server 装 `@apollo/server-plugin-landing-page-graphql-playground` 旧插件能用但**不推荐**，因无安全更新。

## 一、GraphiQL：基金会的参考实现

GraphiQL 是 GraphQL 基金会官方维护的 GraphQL IDE 参考实现，地位类似 React 官方文档的 playground：

- **轻量可嵌入**：作为一个 React 组件，能嵌入任意 web 应用；许多 GraphQL 服务器（Express GraphQL、Mercurius、async-graphql 等）默认带它。
- **核心功能**：Schema 探索（文档面板）、查询编辑、字段补全、响应检视——和 Sandbox 类似但界面更朴素。
- **吸收了 Playground 功能**：Playground EOL 后，GraphiQL 加入了多标签、主题切换等 Playground 受欢迎的特性，成为通用替代。
- **跨后端框架**：不绑定 Apollo，任何符合 GraphQL 规范的服务器都能用——这是它相对 Sandbox 的最大优势。

## 二、Banana Cake Pop：.NET 生态的 IDE

Banana Cake Pop 是 ChilliCream 团队（Hot Chocolate GraphQL 服务器作者）开发的现代 GraphQL IDE：

- **Hot Chocolate 默认带**：.NET 生态用 Hot Chocolate 做 GraphQL 后端时，默认 IDE 就是 Banana Cake Pop。
- **功能全面**：Schema 探索、查询/变更/subscription 执行、Schema diff（对比版本差异）、性能追踪。
- **独立桌面应用 + 浏览器版**：既有可安装的桌面端（体验更完整），也有浏览器版。
- **定位**：.NET 生态的「Apollo Sandbox」，与 Apollo 生态基本不重叠。

## 三、GraphQL Playground：已 EOL 的历史包袱

GraphQL Playground 由 Prisma 团队开发，2017-2019 年是最流行的 GraphQL IDE，但：

- **2020 年后基本停止维护**：Issue 和 PR 大量积压，无新功能无安全更新。
- **Apollo 官方 2022-12-31 宣布 EOL**：Apollo Server 从 v3 起移除内置 Playground 支持，v4 完全不提供。
- **要硬用需装旧插件**：`@apollo/server-plugin-landing-page-graphql-playground` 能在 Apollo Server 4 强制启用 Playground，但**不推荐**——无安全更新，是技术债。
- **迁移方向**：Apollo 后端 → Sandbox；其他后端 → GraphiQL 或对应生态的 IDE。

> **判断项目是否技术债**：如果还在用 GraphQL Playground，应列入迁移清单——它不会变好，只会越拖越脆。

## 四、选型决策矩阵

| 后端框架 | 推荐 IDE | 理由 |
| --- | --- | --- |
| Apollo Server（Node.js） | **Apollo Sandbox** | 默认内置，开箱即用，与 GraphOS 协同 |
| Hot Chocolate（.NET） | **Banana Cake Pop** | 生态默认，功能全面 |
| 其他框架（Mercurius/async-graphql 等） | **GraphiQL** | 通用、轻量、可嵌入 |
| 任意（追求可嵌入极简） | **GraphiQL** | 作为组件嵌入，最轻 |
| 老项目还在用 Playground | **迁移到 Sandbox/GraphiQL** | Playground 已 EOL，是技术债 |

## 五、Apollo Server 4 的 IDE 配置

Apollo Server 4 默认用 Sandbox，但可以切换：

- **保持默认 Sandbox**：无需任何配置，访问根路径就是 Sandbox。
- **禁用落地页**：设置 `ApolloServerPluginLandingPageDisabled` 插件，访问根路径返回 404。
- **自定义落地页**：用 `ApolloServerPluginLandingPageLocalDefault` 传自定义 HTML。
- **强制用 GraphQL Playground**：装 `@apollo/server-plugin-landing-page-graphql-playground`（不推荐，因 Playground 已 EOL）。

## 下一步

选型定了之后，回头查[参考](../reference) 的 GraphQL IDE 速查表、Apollo Server 配置与易错点。
