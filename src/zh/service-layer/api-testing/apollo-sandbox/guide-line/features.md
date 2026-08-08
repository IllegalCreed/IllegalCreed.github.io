---
layout: doc
outline: [2, 3]
---

# Sandbox 功能：Schema 探索、查询构建与响应检视

> 基于 Apollo Server 4 · Apollo Sandbox · 核于 2026-08

## 速查

- **Schema 探索**：Sandbox 启动时自动对 `/graphql` 端点做 **introspection**，左侧文档面板渲染出全部 Query/Mutation/Type/Field/Enum，支持搜索与悬停看文档——开发者无需手写 introspection 查询。
- **查询构建**：编辑器带**字段补全**（输入 `user.` 自动列字段）、**语法高亮**、**错误提示**（schema 不存在的字段会标红）、**变量与片段补全**——写 GraphQL query 像写 TypeScript，IDE 全程辅助。
- **变量与 Header**：查询需要的变量在独立 `Variables` 面板填（JSON）；鉴权 header（如 `Authorization: Bearer xxx`）在 `Headers` 面板填——两者与查询分离，便于复用。
- **请求执行**：点运行按钮（或快捷键）发 POST 到 `/graphql`，支持**多操作**（一个文档多个 query，选哪个跑哪个）。
- **响应检视**：右侧美化 JSON，支持折叠展开；**错误响应**会高亮 `errors[].path`，告诉你是哪个字段出错；响应时间与状态码可见。
- **本地运行无需账号**：Sandbox 默认从浏览器直连本地 Apollo Server，**可离线、无需 Apollo 账号**；登录是可选的（用于发布 Schema 到 GraphOS）。
- **Schema 发布（可选）**：登录后可一键把当前 Schema 发布到 GraphOS，配合 Rover CLI 做 schema 注册与变更追踪。
- **CORS 与端点**：Sandbox 默认连 `http://localhost:4000/`（Apollo Server 默认端口），改端点要在 Sandbox 顶部 URL 栏手动指定；本地开发要确保 Apollo Server 开启了 introspection 与 CORS。

## 一、Schema 探索：自动 introspection

GraphQL 的强类型系统意味着 IDE 能通过 introspection 查询自动获取全部类型信息。Sandbox 启动时自动执行 introspection：

```
浏览器访问 Apollo Server 根路径 /
  → Sandbox 加载
  → 自动对 /graphql 发 introspection 查询
  → 拿到全部 Schema（Query/Mutation/Type/Field/Enum/参数）
  → 左侧文档面板渲染成可浏览的树
```

- **左侧文档面板**：分 Query/Mutation/Types 三区，点开任意类型看字段与参数，悬停看文档注释（schema 里的 `"""文档"""`）。
- **搜索**：顶部搜索框直接定位类型/字段，大型 Schema（几百个类型）也能快速找到。
- **无需手写 introspection**：早期 GraphQL 开发要手写冗长的 introspection 查询拿 Schema，Sandbox 全自动。

> **前提**：Apollo Server 必须开启 introspection（生产环境常关闭以防信息泄露），本地开发默认开。

## 二、查询构建：字段补全与语法检查

Sandbox 的查询编辑器是「GraphQL 版的 IDE」，提供完整编辑辅助：

- **字段补全**：输入 `user.` 自动弹出该类型的字段列表，Tab 选中；输入 `query` 自动补全操作骨架。
- **语法高亮**：类型、字段、变量、字符串不同颜色，可读性好。
- **实时错误检查**：query 引用了 schema 不存在的字段、参数类型不对、缺必填参数，编辑器立即标红波浪线，悬停看错误原因——**不用等到运行才发现**。
- **变量与片段提示**：声明了 `$userId: ID!` 后，编辑器会在使用处提示类型。

```graphql
# 补全辅助下的查询示例
query GetUser($userId: ID!) {
  user(id: $userId) {       # 输入 user. 后自动列出 name/email/posts...
    id
    name
    email
    posts {                 # 嵌套类型也补全
      title
    }
  }
}
```

## 三、变量、Header 与鉴权

GraphQL 查询常需要变量和鉴权 header，Sandbox 把它们与查询分离：

- **Variables 面板**：填查询变量的 JSON，如 `{ "userId": "123" }`，与查询解耦，换数据只改变量不改 query。
- **Headers 面板**：填请求头，最常见是鉴权 <code v-pre>Authorization: Bearer &#123;&#123;token&#125;&#125;</code>；也可加 `Content-Type`、自定义 header。
- **多环境**：改 endpoint URL（顶部栏）+ 改 header，就能切 dev/staging/prod。

## 四、响应检视与错误定位

执行查询后，右侧展示响应：

- **美化 JSON**：自动缩进折叠，大响应（嵌套深的列表）也能读。
- **错误高亮**：GraphQL 错误返回 `errors[]` 数组，每项有 `path`（如 `user.posts.0.title`）指向出错字段；Sandbox 高亮 path，让你快速定位是哪个字段解析失败。
- **响应时间**：底部显示本次查询耗时，方便感知慢查询。

## 五、本地运行与配置

- **默认端点**：Apollo Server 4 默认监听 4000 端口，Sandbox 默认连 `http://localhost:4000/`。
- **改端点**：Sandbox 顶部 URL 栏可手动改为任意 GraphQL 端点（如 staging 服）。
- **CORS**：浏览器里的 Sandbox 要能跨域访问 Apollo Server，需配置 CORS（Apollo Server 4 默认允许）。
- **离线运行**：Sandbox 前端资源加载后即可离线使用，不依赖云端——这是它「本地优先」的体现。
- **无需账号**：核心 IDE 功能（探索/查询/响应）完全不需要 Apollo 账号；登录只为发布 Schema 到 GraphOS。

## 六、与 GraphOS Studio 的衔接（可选）

登录 Apollo 账号后，Sandbox 可一键把当前 Schema 发布到 GraphOS（Apollo 的 schema 注册中心）：

- 配合 **Rover CLI**（`rover subgraph publish`）做 CI 自动发布。
- GraphOS 记录 Schema 变更历史，支持多 subgraph 的联邦管理。
- 这是**可选**的进阶用法，本地开发不需要。

## 下一步

掌握了 Sandbox 功能后，下一步看它和其他 GraphQL IDE 的对比——[备选方案](./alternatives)（GraphiQL/Banana Cake Pop/Playground 历史）。
