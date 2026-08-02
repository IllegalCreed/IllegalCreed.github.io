---
layout: doc
outline: [2, 3]
---

# Gen2 后端与 DataStore：TypeScript 声明式与离线同步

> 基于 AWS Amplify · 核于 2026-08

## 速查

- **Gen2 核心思想**：后端用 **TypeScript 代码**定义（而非 CLI 交互问答或 CloudFormation 模板），可 Git 版本管理、Code Review、CI 自动化。`defineBackend()` 是入口。
- **声明式后端**：在 `amplify/configuration.ts` 用 `defineBackend({ auth, data, storage, functions })` 组合各能力，每个能力在独立 `resource.ts` 用 `defineAuth/defineData/defineStorage/defineFunction` 定义。
- **数据模型（defineData）**：用 `a.schema()` 以 TS 写 GraphQL schema——`a.model({...})` 定义模型，`a.string()/a.integer()/a.ref().of(...)` 定义字段与关系，`.authorization((allow)=>[...])` 定义权限。Amplify 自动生成 AppSync GraphQL API + DynamoDB 表。
- **权限模型（authorization）**：声明式控权——`allow.owner()`（每用户隔离）、`allow.authenticated()`（登录可访问）、`allow.public()`（公开）、`allow.group('admins')`（角色组）、自定义 Lambda。规则在 AppSync 层强制执行。
- **类型贯穿**：后端 schema 经 `ampx generate` 自动生成前端 TS 类型（`src/models/index.ts`）与 GraphQL operations，IDE 自动补全，编译期查错。
- **部署**：`npx ampx push` 把 TS 定义编译成 CloudFormation，部署到 AWS（建 AppSync/DynamoDB/Cognito）；`npx ampx sandbox` 本地沙箱（独立后端实例，开发者互不影响）。
- **DataStore**：**离线优先的数据同步层**。前端用生成的 TS 模型调 `DataStore.save/query/delete`，SDK 自动同步到 DynamoDB（经 AppSync），断网读写本地 SQLite，联网自动合并。
- **冲突解决**：默认 **Last-Write-Wins**（按时间戳）；可自定义 `conflictHandler`（合并/丢弃/重试）与 `syncInterval`。
- **关系与查询**：模型间用 `a.ref().of(...)` 定义hasOne/hasMany/belongsTo；查询支持过滤/排序/分页，但受 GraphQL schema 限制（不像 SQL 的任意 JOIN/聚合）。
- **vs Firebase Firestore**：DataStore 数据模型是结构化 GraphQL（有 schema、有关系），Firestore 是自由 JSON 文档；DataStore 经多跳延迟更高，Firestore 直连更快。

## 一、Gen2 声明式后端：用 TS 写后端

Gen2（2024 发布）的核心革新是**后端即代码（Backend-as-Code）**——用 TypeScript 文件定义后端，告别一代的 CLI 交互问答：

```
amplify/
├── configuration.ts     ← defineBackend 入口（组合 auth/data/storage）
├── auth/
│   └── resource.ts      ← defineAuth（Cognito 用户池）
├── data/
│   └── resource.ts      ← defineData（AppSync + DynamoDB + schema）
├── storage/
│   └── resource.ts      ← defineStorage（S3）
└── functions/
    └── .../resource.ts  ← defineFunction（Lambda）
```

```ts
// amplify/configuration.ts —— 组合各能力
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";

export const backend = defineBackend({ auth, data, storage });
```

- **模块化**：每个能力（auth/data/storage/functions）独立文件，职责清晰，可单独修改部署。
- **可版本管理**：纯 TS 代码进 Git，团队协作、Code Review、CI 自动化全可用——一代的 CloudFormation 模板难审阅。
- **类型安全**：`defineBackend` 的参数有完整 TS 类型，配错编译期报错。
- **escape hatch**：高级需求（自定义 CloudFormation、复杂 IAM）可通过 `backend.data.resources.cfnResource` 注入原生 CloudFormation 属性。

代价：Gen2 仍较新（2024 GA），部分高级场景文档与社区案例少于一代；遇到边缘问题可能需查 AWS 原生文档。

## 二、defineData：用 TS 写 GraphQL schema

数据层用 `defineData` + `a.schema()` 以 TypeScript 定义 GraphQL 模型：

```ts
// amplify/data/resource.ts
import { a, defineData } from "@aws-amplify/backend";

export const data = defineData({
  schema: a.schema({
    // Todo 模型：自动生成 DynamoDB 表 + AppSync CRUD
    Todo: a.model({
      title: a.string().required(),
      done: a.boolean().default(false),
      priority: a.enum(["low", "medium", "high"]),
      // 关系：一个 Todo 属一个 User
      owner: a.belongsTo("User"),
    })
    .authorization((allow) => [
      allow.owner(),           // 只有 owner 能读写自己的 Todo
      allow.group("admins"),   // admins 组可读所有
    ]),

    User: a.model({
      name: a.string(),
      todos: a.hasMany("Todo"),
    }).authorization((allow) => [allow.owner()]),
  }),
});
```

- **模型即表**：每个 `a.model({...})` 自动生成一张 DynamoDB 表 + AppSync 的 create/read/update/delete/list/delete GraphQL operations。
- **字段类型**：`a.string()/integer/float/boolean/date/time/datetime/json/enum`；自定义类型用 `a.customType({...})`。
- **关系**：`belongsTo/hasOne/hasMany/manyToMany`——类似 ORM，自动在 DynamoDB 维护外键与连接表。
- **权限（authorization）**：声明式控权，规则在 AppSync 层强制（不可被前端绕过）：
  - `allow.owner()`——基于 Cognito sub 自动隔离每用户数据（类似 Firebase 的 `request.auth.uid == uid`）
  - `allow.authenticated()`——任何登录用户
  - `allow.public()`——完全公开（含未登录）
  - `allow.group("admins")`——Cognito 组成员
  - 自定义 Lambda——复杂业务逻辑鉴权
- **二级索引与搜索**：`.index("byStatus")` 建二级索引；全文搜索可接 OpenSearch（额外服务）。

**查询限制**：受 GraphQL schema 约束，支持过滤/排序/分页，但**不像 SQL 的任意 JOIN/聚合/窗口函数**——复杂分析仍要导出到 Athena/Redshift。

## 三、类型贯穿：前后端类型对齐

Gen2 的杀手锏是**类型贯穿**——后端 schema 自动生成前端类型：

```bash
npx ampx generate    # 生成 src/models/index.ts + GraphQL operations
```

```ts
// 前端：用生成的 TS 模型，IDE 自动补全
import { generateClient } from "aws-amplify/api";
import type { Schema } from "@/amplify/data/resource"; // 后端类型

const client = generateClient<Schema>({ authMode: "userPool" });

// 完全类型安全：title 是 string、done 是 boolean，配错编译期报错
const newTodo = await client.models.Todo.create({
  title: "学 Amplify Gen2",
  done: false,
});

const todos = await client.models.Todo.list({
  filter: { done: { eq: false } }, // 过滤条件也类型安全
});
```

这消除了"前端猜后端字段"的常见 bug——后端改 schema，前端类型立刻失效提示，重构成本极低。

## 四、DataStore：离线优先同步

DataStore 是 Amplify 的**离线优先数据访问层**，前端不直接调 GraphQL，而是操作本地模型，SDK 自动同步：

```ts
import { DataStore } from "aws-amplify/datastore";
import { Todo } from "./models";

// 写：先存本地 SQLite，自动同步到云端（AppSync → DynamoDB）
await DataStore.save(new Todo({ title: "买菜", done: false }));

// 读：本地优先（毫秒级），后台自动同步云端变更
const todos = await DataStore.query(Todo, (t) => t.done.eq(false));

// 订阅：云端变更自动推到本地（类似 Firebase onSnapshot）
const sub = DataStore.observe(Todo).subscribe(({ op, element }) => {
  console.log(op, element); // CREATE/UPDATE/DELETE 事件
});

// 删除
await DataStore.delete(todo);
```

- **离线优先**：SDK 默认用浏览器 IndexedDB / 移动 SQLite 缓存，断网时读写照常，联网自动同步合并。
- **自动同步**：观察者模式（`observe`）订阅模型变更，云端任何写入自动推到本地——多人协作/聊天天然可用。
- **冲突解决**：多端同时改同一条，默认 **Last-Write-Wins**（按 `updatedAt` 时间戳）；可自定义：
  ```ts
  DataStore.configure({
    syncExpressions: [...],
    conflictHandler: (diff, retries) => {
      // 自定义合并逻辑：合并字段 / 丢弃 / 重试
      return { ...diff.current, ...diff.remote };
    },
  });
  ```
- **关系查询**：DataStore 自动按 schema 关联（`todo.owner` 自动拉 User），但深度查询受 schema 限制。

**vs Firebase Firestore 离线优先**：DataStore 数据是结构化 GraphQL（有 schema、类型安全、有关系），Firestore 是自由 JSON（灵活但无类型保证）；DataStore 经 AppSync→Lambda→DynamoDB 多跳，**冷启动与延迟高于 Firestore 直连**。

## 五、典型 Gen2 全栈架构

```
              前端（React/Vue/Flutter + Amplify SDK）
                          │
              ┌───────────┴───────────┐
              │   DataStore / Client    │  ← 类型安全的本地访问 + 自动同步
              └───────────┬───────────┘
                          │ GraphQL（AppSync）
              ┌───────────┴───────────┐
              │   AppSync（GraphQL API）│  ← 权限/解析/订阅
              └───┬───────┬───────┬───┘
                  │       │       │
              DynamoDB  Lambda   S3      ← AWS 底层存储与计算
              (数据)   (函数)   (文件)
                  │
              Cognito（用户池/身份池）   ← Auth（JWT + STS 凭证）
```

**部署流**：后端 `npx ampx push`（建 Cognito/AppSync/DynamoDB）→ 前端 `git push`（Amplify Hosting 自动构建 CDN）——后端类型自动同步给前端，前后端版本对齐。

## 下一步

数据与后端讲完后，下一站看交付与认证——[Hosting、CI/CD 与 Cognito](./hosting-and-cicd)：Git 触发的全托管 CI/CD、预览环境与回滚，以及 Cognito 的用户池/身份池/企业 SSO/RBAC。
