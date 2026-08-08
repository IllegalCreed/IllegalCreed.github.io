---
layout: doc
outline: [2, 3]
---

# 入门：Apollo Sandbox 定义、定位与 GraphQL Playground EOL

> 基于 Apollo Server 4 · Apollo Sandbox · 核于 2026-08

## 速查

- **GraphQL IDE 定义**：用于**探索 Schema、构造并执行 GraphQL 查询/变更、调试接口**的交互式工具，是 GraphQL 后端开发者的「Postman」——把「读 schema、写 query、看响应」收拢到一个界面。
- **Apollo Sandbox 定位**：Apollo Server 4+ 的**默认内置 GraphQL IDE**，访问根路径 `/` 即用；本质是 Apollo GraphOS Studio 的**本地开发模式**，跑在浏览器、**可离线、无需 Apollo 账号**。
- **核心能力四件套**：①Schema 探索（左侧文档面板浏览全部类型/字段/参数）②查询构建（带字段补全、语法高亮、变量提示的编辑器）③请求执行（带变量、Header、Authorization）④响应检视（美化 JSON、错误路径高亮）。
- **替换 GraphQL Playground**：GraphQL Playground 自 2022-12-31 起**正式 EOL（不再维护）**，Apollo Server 从 v3 起用 Sandbox 替换 Playground 为默认落地页，v4 延续。**新项目不应再选 Playground。**
- **与云端 Studio 的关系**：Sandbox = Studio 的本地子集，主打离线开发；登录后可一键发布 Schema 到 GraphOS、查变更历史，但核心 IDE 功能不依赖账号。
- **何时不用 Sandbox**：①非 Apollo 后端（mercurius/async-graphql/.NET Hot Chocolate 等）②想要可嵌入极简 IDE → 选 **GraphiQL** 或 **Banana Cake Pop**。
- **GraphQL IDE 生态速览**：Sandbox（Apollo 默认）/ GraphiQL（基金会参考实现，轻量可嵌入）/ Banana Cake Pop（ChilliCream .NET 生态）/ GraphQL Playground（**已 EOL，勿用**）。
- **进阶顺序**：[Sandbox 功能](./guide-line/features) → [备选方案](./guide-line/alternatives) → [参考](./reference)。

## 一、GraphQL IDE 是什么

GraphQL 是强类型 Schema 驱动的——每个 API 都有一份类型系统（Query/Mutation/Type/Field），客户端按 Schema 构造查询。GraphQL IDE 解决的核心问题：**怎么方便地知道「有哪些类型、字段、参数」，并把查询跑起来看结果**。原始方式是手写 introspection 查询拿 Schema，再手写 query，再用 curl 发 POST——三步割裂，体验差。GraphQL IDE 把三步合一：

1. **Schema 探索**：自动 introspection，左侧文档树展示全部类型/字段/参数，支持搜索，鼠标悬停看文档。
2. **查询构建**：编辑器带字段补全（输入 `user.` 自动列字段）、语法高亮、变量与片段提示，写 query 像写代码。
3. **请求执行 + 响应检视**：填变量/Header/Authorization，一键执行，响应 JSON 美化折叠，错误路径高亮。

一句话：**GraphQL IDE = Schema 文档 + 查询编辑器 + 执行器 + 响应可视化。**

## 二、Apollo Sandbox 定位

Apollo Sandbox 是 Apollo Server 4+ 的默认 GraphQL IDE。启动一个 Apollo Server 后，浏览器访问根路径，看到的就是 Sandbox 界面。它的关键定位：

- **本地优先**：跑在浏览器里，可完全离线使用，**不需要 Apollo 账号**——这是它区别于云端 Studio 的核心。
- **Apollo Server 默认**：v3 起替换 GraphQL Playground 为默认落地页，v4 延续。开箱即用，无需配置。
- **GraphOS Studio 的本地模式**：Sandbox 本质是云端 Studio 的本地子集，登录后可发布 Schema 到 GraphOS、查变更历史，但 IDE 核心功能（探索/查询/响应）不依赖账号。

## 三、为什么 GraphQL Playground 不能再用

GraphQL Playground 曾是 GraphQL 生态最受欢迎的 IDE（Prisma 团队开发），但 2020 年后基本停止维护，Apollo 官方于 **2022-12-31 正式宣布 EOL（End of Life）**：

- 不再接收任何更新（功能、安全补丁都没有）。
- Apollo Server 从 v3 起移除 Playground 内置支持，v4 完全不再提供（要用需装 `@apollo/server-plugin-landing-page-graphql-playground` 旧插件）。
- **新项目应选 Apollo Sandbox（Apollo 后端）或 GraphiQL（通用）**，不要再选 Playground。
- GraphiQL（GraphQL 基金会维护）吸收了 Playground 的部分功能（如多标签），是通用替代。

## 四、GraphQL IDE 选型速览

| IDE | 定位 | 维护状态 | 适合 |
| --- | --- | --- | --- |
| **Apollo Sandbox** | Apollo Server 默认，本地优先 | ✅ 活跃 | Apollo 后端开发 |
| **GraphiQL** | GraphQL 基金会参考实现 | ✅ 活跃 | 通用、可嵌入、轻量 |
| **Banana Cake Pop** | ChilliCream/Hot Chocolate 生态 | ✅ 活跃 | .NET GraphQL 后端 |
| **GraphQL Playground** | Prisma 早期 IDE | ❌ EOL 2022-12-31 | **勿用** |

## 下一步

理解了 Sandbox 定位后，下一步深入它的核心能力——[Sandbox 功能](./guide-line/features)（Schema 探索/查询构建/响应检视/本地运行）。
