---
layout: doc
outline: [2, 3]
---

# 入门：Express、中间件管道与回调风格

> 基于 Express 5.0 / 4.x · 核于 2026-08

## 速查

- **Express 是什么**：Node.js 上**极简、灵活**的 Web 应用框架（2010 年 TJ Holowaychuk 创建），核心只提供**中间件管道** + **路由系统** + `req/res` 两个对象，不绑定模板/ORM/认证，由开发者用 `app.use()` 拼装任意技术栈。npm **周下载约 1800 万**，Node 后端装机量第一。
- **最小应用**：`const app = express(); app.get('/', (req,res)=>res.send('hi')); app.listen(3000)`——三行起一个 HTTP 服务，是 Node 后端的"hello world"基线。
- **中间件（Middleware）**：签名 `(req, res, next) => {}` 的函数，`app.use(fn)` 全局挂载、`app.use('/api', fn)` 挂到路径、`app.get('/x', fn1, fn2)` 挂到路由。请求到达后**按注册顺序**依次执行每个中间件，`next()` 放行下一个，`next(err)` 跳到错误中间件。
- **路由（Routing）**：`app.METHOD(path, handler)` 注册，METHOD = get/post/put/delete/patch/all。支持**路径参数** `/users/:id`（`req.params.id`）、**正则** `/ab*cd`、**多回调** `app.get('/', fn1, fn2)`。`express.Router()` 把路由模块化成子应用。
- **回调风格**：处理器是 `(req, res, next) => {}` 三参数回调——**不是** async/await 优先（与 Koa/Hono 不同）。响应靠 `res.send/json/end/status`，错误靠 `next(err)` 传递到 4 参数错误中间件 `(err, req, res, next) => {}`。
- **Express 5.0（2024.10）**：①async 处理器的 rejection 被**自动捕获**（4.x 会丢失，需手动 try/catch + next）；②`req.query` 默认返回**普通对象**（4.x 用 qs 库做嵌套解析，5.0 移除，按需 `app.set('query parser', ...)`）；③`res.send(status)`、`app.del` 等废弃 API 被移除；④`path-to-regexp` v8 升级，正则路由语法收紧。
- **不绑定什么**：不内建模板引擎（`app.set('view engine', 'ejs')` 选配）、不内建 ORM、不内建认证、不强制目录结构——这是 Express"极简灵活"的代价与红利。
- **进阶顺序**：[中间件与路由详解](./guide-line/middleware-and-routing) → [生态与对比](./guide-line/ecosystem) → [参考](./reference)。

## 一、Express 是什么：极简的中间件框架

Express 的设计哲学是**只给地基，不给楼房**。它把 HTTP 请求处理抽象成一条**中间件管道（pipeline）**：请求从最外层中间件进入，依次流经每个中间件，每个中间件可以读取/修改 `req`、`res`，决定是放行（`next()`）还是直接终结（`res.send()`）：

```
    HTTP 请求
       │
       ▼
  app.use(logger)      ← 日志：记录请求时间
       │ next()
       ▼
  app.use(cors)        ← CORS：加跨域头
       │ next()
       ▼
  app.use(bodyParser)  ← 解析 body：req.body = JSON
       │ next()
       ▼
  app.get('/api', h)   ← 路由处理器：res.json(data)
       │
       ▼
    HTTP 响应
```

- **极简**：核心代码不到 1000 行，只定义 `app`、`req`、`res`、中间件链。其余全靠中间件拼装。
- **灵活**：要 SSR 就 `app.set('view engine', 'ejs')`；要认证就 `app.use(passport.initialize())`；要 ORM 自己挑 Prisma/TypeORM——Express 不替你做决定。
- **代价**：没有开箱即用的 Schema 验证、序列化加速、TS 类型推断（这些是 Fastify/Hono 的卖点）。

## 二、最小应用：三行起服务

```js
import express from "express";
const app = express();

app.get("/", (req, res) => res.send("Hello Express"));
app.listen(3000);
```

- `express()` 创建应用实例 `app`。
- `app.get(path, handler)` 注册一个 GET 路由，`handler` 收到 `req`（请求）/`res`（响应）两个对象。
- `res.send()` 发送响应并终结管道（后续中间件不再执行）。
- `app.listen(3000)` 启动 HTTP 服务监听 3000 端口。

这就是 Node 后端最经典的起步代码——Express 把 Node 原生 `http.createServer` 的样板（手动拼状态码/头/body）彻底封装，让开发者只关心业务逻辑。

## 三、中间件：(req, res, next) 函数链

中间件是 Express 的灵魂。它是一个接收 `(req, res, next)` 的函数，挂到管道里后，请求流经它时执行：

```js
// 全局中间件：每个请求都执行
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next(); // 必须 next()，否则请求挂起
});

// 路径中间件：只对 /api 开头生效
app.use("/api", (req, res, next) => {
  req.startedAt = Date.now();
  next();
});

// 路由中间件：写在路由的 handler 前
app.get(
  "/users",
  authMiddleware,   // 鉴权
  rateLimitMiddleware, // 限流
  (req, res) => res.json({ users: [] }) // 主处理器
);

// 错误中间件：4 参数，必须放最后
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});
```

- **执行顺序 = 注册顺序**：中间件按 `app.use/get` 的调用顺序入队，请求依次流过。
- **`next()` 是关键**：不调 `next()`，请求会一直挂起（客户端超时）；调 `next(err)` 则跳过普通中间件，直达错误中间件。
- **错误中间件签名固定**：必须正好 4 个参数 `(err, req, res, next)`，Express 靠参数个数识别它是错误处理器——少一个参数就不是错误中间件（这是 Express 最隐蔽的坑）。

## 四、路由：app.METHOD 与 express.Router

Express 路由的注册方式：

```js
// 基本路由
app.get("/users", (req, res) => res.json([]));
app.post("/users", (req, res) => res.status(201).json({ ok: true }));

// 路径参数
app.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id }); // req.params.id
});

// 通配 / 正则（5.0 收紧，* 语法有变）
app.get("/files/*", (req, res) => res.send(req.params[0]));

// 模块化：express.Router 拆成子应用
const userRouter = express.Router();
userRouter.get("/", listUsers);
userRouter.post("/", createUser);
userRouter.get("/:id", getUser);
app.use("/users", userRouter); // 挂载到 /users
```

- **路径参数**：`:id` 被 `req.params` 收集；通配 `*` 在 5.0 改用命名通配 `*splat`（`req.params.splat`）。
- **`express.Router()`**：相当于"迷你 app"，把一组路由封装成模块，再 `app.use(prefix, router)` 挂载——大型项目必备，避免 `app` 里堆几百个路由。
- **`req.query`**：URL 查询串。4.x 用 `qs` 库支持嵌套（`?a[b]=1` → `{a:{b:1}}`），**5.0 默认返回普通对象**（`?a[b]=1` → `{"a[b]":"1"}`），要嵌套解析需手动 `app.set("query parser", "extended")` 或自定义函数。

## 五、回调风格与错误处理

Express 是**回调优先**而非 async/await 优先的设计（诞生于 2010 年，那时 async/await 还没出现）：

```js
// 4.x：async 处理器抛错会丢失（不会被错误中间件捕获）
app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await db.findUser(req.params.id);
    if (!user) return res.status(404).json({ error: "not found" });
    res.json(user);
  } catch (err) {
    next(err); // 必须手动传给错误中间件
  }
});

// 5.0：async rejection 自动捕获（解放双手）
app.get("/users/:id", async (req, res) => {
  const user = await db.findUser(req.params.id); // 抛错自动进错误中间件
  res.json(user);
});
```

- **4.x 的 async 坑**：async 函数里的 `throw` 或 `await` 抛的 rejection，Express 4 不会自动 `next(err)`——它会变成未处理的 promise rejection，错误中间件收不到。必须 `try/catch` + 手动 `next(err)`，或用 `express-async-errors` 这种补丁包。
- **5.0 的改进**：核心团队终于让 async 处理器的 rejection 自动转成 `next(err)`，与 Koa/Fastify 对齐。
- **错误中间件的位置**：必须在所有 `app.use/get` **之后**注册，否则它后面的中间件/路由不会被它兜底。

## 六、Express 5.0 的关键变化（2024.10）

Express 5.0 是 9 年来的第一个大版本，主要现代化与去废弃：

| 变化 | 4.x | 5.0 |
| --- | --- | --- |
| **async 错误捕获** | 手动 try/catch + next(err)，否则丢失 | 自动捕获，rejection → next(err) |
| **req.query** | qs 库嵌套解析（`?a[b]=1` → `{a:{b:1}}`） | 普通对象（`{"a[b]":"1"}`），可配置 |
| **废弃 API 移除** | `res.send(status)`、`app.del`、`req.param()` | 全部移除，用标准 API |
| **path-to-regexp** | v0.x（宽松正则） | v8（命名通配 `*splat`，移除未命名 `*`） |
| **Node 版本** | ≥ 0.10 | ≥ 18 |

- **迁移注意**：依赖 `?a[b]=1` 嵌套解析的旧代码会因 5.0 默认 query parser 行为变化而 break；用了未命名通配 `*` 的路由需改为命名通配 `*name`。
- **何时升级**：新项目直接用 5.0；老项目用 4.x 且 async 错误处理已用 `express-async-errors` 兜住的，可择机升级。

## 下一步

理解了 Express 的中间件管道、路由、回调风格与 5.0 变化后，下一步深入[中间件与路由详解](./guide-line/middleware-and-routing)（执行顺序、Router 模块化、错误处理的坑）与[生态与对比](./guide-line/ecosystem)（必装中间件、与 Fastify/Hono/Koa 的选型）。
