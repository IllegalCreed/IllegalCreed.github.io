---
layout: doc
---

# Apollo Sandbox

Apollo Sandbox 是 **Apollo Server 4+ 内置的默认 GraphQL IDE**——当你启动一个 Apollo Server，浏览器访问 `/` 看到的那个交互式查询界面就是 Sandbox。它用来**探索 Schema、构造并执行查询/变更、调试 GraphQL 接口**，是 GraphQL 后端开发者的「Postman」。Sandbox 本质是 Apollo GraphOS Studio（云端）的**本地开发模式**：跑在浏览器里、可离线使用、**无需 Apollo 账号**，专为本地开发设计。它的出现填补了 **GraphQL Playground 已弃用（2022-12-31 EOL）**留下的空缺——Apollo Server 从 v3 起用 Sandbox 替换 Playground 作为默认落地页，v4 延续这一选择。

GraphQL IDE 生态不止 Sandbox 一家：**GraphiQL** 是 GraphQL 基金会维护的参考实现（轻量、可嵌入，许多框架默认带）；**Banana Cake Pop** 是 ChilliCream/Hot Chocolate 生态（.NET）的现代 GraphQL IDE；**GraphQL Playground** 因长期不维护已于 2022 年底正式 EOL，新项目不应再选用。本叶是 GraphQL IDE 子脉络的**总览与选型地基**，先把 Sandbox 的核心能力（Schema 探索、查询构建、字段补全、响应检视）讲透，再横放对比备选方案（GraphiQL/Banana Cake Pop/Playground 历史），帮你在不同后端框架下做出合适选择。

## 评价

**优点**

- **开箱即用**：Apollo Server 4 默认内置，访问根路径即用，无需额外安装配置
- **Schema 探索强**：左侧文档面板可浏览全部类型/字段/参数，支持搜索，比手写 introspection 查询友好
- **本地优先**：可离线运行、无需 Apollo 账号，数据不强制上云，适合本地开发
- **与 Apollo 生态协同**：可一键发布 Schema 到 GraphOS、查看变更历史、配合 Rover CLI 做 schema 管理

**缺点**

- **绑定 Apollo Server**：非 Apollo 后端（如 mercurius/async-graphql）要用需额外配置或选 GraphiQL
- **功能比云端 Studio 少**：Sandbox 是 Studio 的本地子集，缺失部分云端协作能力（如团队共享查询、操作记录）
- **浏览器端依赖**：跑在浏览器里，重度使用时大量响应历史会占内存
- **新项目学习成本**：从 GraphQL Playground 迁移的开发者要重新熟悉操作面板

## 本叶地图

- [入门](./getting-started) —— GraphQL IDE 定义、Apollo Sandbox 定位、核心能力、与 GraphQL Playground EOL 的关系
- [Sandbox 功能](./guide-line/features) —— Schema 探索、查询构建、字段补全、变量与 Header、响应检视、本地运行
- [备选方案](./guide-line/alternatives) —— GraphiQL、Banana Cake Pop、GraphQL Playground 历史、选型决策
- [参考](./reference) —— GraphQL IDE 速查表、Apollo Server 配置、易错点

## 幻灯片地址

<a href="/SlideStack/apollo-sandbox-slide/" target="_blank">Apollo Sandbox</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Apollo%20Sandbox" target="_blank" rel="noopener noreferrer">Apollo Sandbox 测试题</a>
