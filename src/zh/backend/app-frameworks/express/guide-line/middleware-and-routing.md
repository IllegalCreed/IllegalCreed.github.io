---
layout: doc
outline: [2, 3]
---

# 中间件与路由详解：执行顺序、Router 模块化与错误处理

> 基于 Express 5.0 / 4.x · 核于 2026-08

## 速查

- **中间件执行顺序 = 注册顺序**：`app.use`/`app.get` 按代码调用顺序入队，请求从第一个开始依次流过。先挂全局（日志/CORS/body），再挂路由，最后挂错误中间件。
- **中间件三要素**：签名 `(req, res, next) => {}`；要么 `res.send/json/end` 终结响应，要么 `next()` 放行下一个；不调 `next()` 请求挂起。
- **`next(err)` 跳错误链**：传参 `next(err)` 后，普通中间件被跳过，直达第一个 4 参数错误中间件 `(err, req, res, next) => {}`。
- **错误中间件必须是 4 参数**：Express 用 `fn.length === 4` 识别错误处理器，少一个参数就被当普通中间件（永远收不到错误，是最隐蔽的坑）。
- **`express.Router()` 模块化**：把一组路由封装成"迷你 app"，`app.use(prefix, router)` 挂载，避免 `app` 堆几百个路由，也利于按业务域拆文件。
- **路径参数与通配**：`:id`（`req.params.id`）、5.0 命名通配 `*splat`（`req.params.splat`，取代 4.x 未命名 `*`）、正则路由 `/^\/users\/(\d+)$/`。
- **`req.query` 5.0 变化**：4.x 用 qs 嵌套解析（`?a[b]=1` → `{a:{b:1}}`），**5.0 默认普通对象**（`{"a[b]":"1"}`），需嵌套则 `app.set('query parser', 'extended')`。
- **`req.body` 需中间件**：必须 `app.use(express.json())` / `express.urlencoded()` 在路由前挂，否则 `req.body` 是 undefined。
- **async 错误处理**：4.x 需手动 try/catch + next(err)（或 `express-async-errors` 补丁）；**5.0 自动捕获** async 处理器的 rejection。
- **路由方法**：`app.get/post/put/delete/patch/all`，`app.all` 匹配所有方法（常用于全局拦截）。

## 一、中间件执行顺序：管道模型

Express 把请求处理建模成一条管道，中间件按注册顺序入队：

```js
app.use(cors());          // 1. CORS：加跨域头
app.use(helmet());        // 2. helmet：安全头
app.use(express.json());  // 3. body 解析：req.body = {...}
app.use(morgan('dev'));   // 4. 日志

app.use('/api', authMiddleware); // 5. 路径中间件：/api/* 鉴权

app.get('/api/users', getUsers); // 6. 路由处理器：res.json()

app.use(notFound);        // 7. 404：没匹配到路由
app.use(errorHandler);    // 8. 错误中间件（4 参数，最后）
```

- **顺序敏感**：`express.json()` 必须在路由前，否则 `req.body` 没解析；错误中间件必须在最后，否则它兜不到后面的错误。
- **`next()` 控制流**：每个中间件调 `next()` 后，控制权交给下一个中间件；若某中间件直接 `res.send()`，管道终结，后面的中间件不执行。
- **挂载路径**：`app.use('/api', fn)` 表示 fn 只对 `/api` 开头的请求生效——Express 会把 `req.url` 中的 `/api` 去掉传给 fn（`req.baseUrl` 仍是 `/api`）。

## 二、next() 与 next(err)：普通流 vs 错误流

```js
// 普通流：next() 放行
app.use((req, res, next) => {
  req.startTime = Date.now();
  next(); // → 下一个中间件
});

// 错误流：next(err) 跳错误中间件
app.use((req, res, next) => {
  if (!req.headers.authorization) {
    return next(new Error('未授权')); // → 第一个错误中间件
  }
  next();
});

// 错误中间件：4 参数，收所有 next(err)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});
```

- **`next(err)` 的行为**：跳过所有**普通**中间件（3 参数的），直达第一个**错误**中间件（4 参数的）。错误中间件处理完后若再 `next(err)`，传给下一个错误中间件；若 `next()`（无参），回到普通流（少见）。
- **为什么错误中间件要 4 参数**：Express 用 `fn.length` 判断——`length === 4` 是错误处理器，`length === 3` 是普通中间件。所以**绝不能**写成箭头函数省参数或写成 3 参数，否则它不会被识别为错误处理器，永远收不到错误。

## 三、express.Router：模块化路由

大型项目的路由会有几百个，全堆在 `app.js` 里不可维护。Express 提供 `express.Router()` 把路由分组：

```js
// routes/users.js
import { Router } from 'express';
const router = Router();

router.get('/', listUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;

// app.js
import users from './routes/users.js';
import posts from './routes/posts.js';

app.use('/users', users);  // /users、/users/:id...
app.use('/posts', posts);  // /posts、/posts/:id...
```

- **Router 是迷你 app**：有自己的 `use/get/post`，但路径相对于挂载点（`router.get('/:id')` 挂到 `/users` 后，完整路径是 `/users/:id`）。
- **Router 也能挂中间件**：`router.use(authMiddleware)` 只对该 Router 的路由生效，不影响其他 Router——按业务域隔离中间件。
- **参数共享**：`req.params` 在 Router 内外都能访问；Router 挂载点前缀不影响 `req.params.id` 的取值。

## 四、路径参数、通配与正则路由

```js
// 命名参数
app.get('/users/:id', (req, res) => res.json(req.params.id));

// 多参数
app.get('/posts/:userId/:postId', (req, res) => {
  const { userId, postId } = req.params;
});

// 5.0 命名通配（取代 4.x 未命名 *）
app.get('/files/*splat', (req, res) => res.json(req.params.splat));

// 可选参数（5.0 path-to-regexp v8）
app.get('/users/:id?', (req, res) => {});

// 正则路由
app.get(/^\/users\/(\d+)$/, (req, res) => res.json(req.params[0]));
```

- **`:id`**：命名参数，`req.params.id` 收集。
- **`*splat`**（5.0）：命名通配，匹配任意路径段，`req.params.splat` 收集。4.x 的未命名 `*` 在 5.0 被移除（必须命名）。
- **正则路由**：用 `RegExp` 直接匹配，捕获组进 `req.params[0]`、`req.params[1]`。
- **path-to-regexp v8（5.0）**：语法收紧，`*` 必须命名，部分 4.x 正则写法需调整。

## 五、req.body / req.query / req.params

| 对象 | 来源 | 需要中间件 | 4.x vs 5.0 |
| --- | --- | --- | --- |
| `req.params` | 路径 `/users/:id` | 否（路由自动） | 一致 |
| `req.query` | URL `?a=1&b=2` | 否 | 4.x qs 嵌套；**5.0 普通对象** |
| `req.body` | POST/PUT body | **是**（`express.json()`） | 一致 |
| `req.headers` | 请求头 | 否 | 一致 |
| `req.cookies` | Cookie 头 | 是（`cookie-parser`） | 一致 |

- **`req.body` 是 undefined 的最常见原因**：忘了在路由前 `app.use(express.json())`。Express 默认不解析 body，必须显式挂中间件。
- **`req.query` 5.0 行为变化**：4.x `?a[b]=1&c[]=2` 会解析成 `{a:{b:1}, c:[2]}`（qs 库）；5.0 默认返回 `{"a[b]":"1", "c[]":"2"}`（普通对象）。要嵌套：`app.set('query parser', 'extended')` 或自定义函数。

## 六、async 错误处理：4.x 的坑与 5.0 的修复

```js
// 4.x：async 抛错丢失（错误中间件收不到）
app.get('/users/:id', async (req, res, next) => {
  const user = await db.findUser(req.params.id); // 抛错 → 未处理 rejection
  res.json(user); // 不会执行，但客户端收不到错误响应（挂起）
});

// 4.x 正确写法：try/catch + next
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await db.findUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err); // 手动传给错误中间件
  }
});

// 5.0：自动捕获，解放双手
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id); // 抛错自动 → next(err)
  res.json(user);
});
```

- **4.x 的根本问题**：Express 诞生于回调时代，中间件链靠 `next` 同步驱动。async 函数返回 Promise，但 4.x 的中间件调度不 await 这个 Promise——所以 async 内的 rejection 不会被转成 `next(err)`。
- **解法（4.x）**：①每个 async 处理器 try/catch + next(err)（啰嗦）；②用 `express-async-errors` 包（在入口 import 一次，补丁全局生效）；③用 `express-async-handler` 高阶函数包装。
- **5.0 的修复**：核心调度逻辑改为检测返回值是否 Promise，是则 `.catch(next)`——与 Koa/Fastify 对齐。

## 七、Express 5.0 变化清单

| 维度 | 4.x | 5.0 | 迁移影响 |
| --- | --- | --- | --- |
| async 错误捕获 | 手动 | 自动 | 可删 try/catch 和补丁包 |
| req.query | qs 嵌套 | 普通对象 | 依赖嵌套的代码需配置或改 |
| 废弃 API | 在 | 移除 | `res.send(status)` → `res.sendStatus(status)`；`app.del` → `app.delete`；`req.param()` → `req.params/body/query` |
| path-to-regexp | v0.x | v8 | 未命名 `*` → 命名 `*splat` |
| Node 版本 | ≥ 0.10 | ≥ 18 | 老旧 Node 部署需升级 |

## 下一步

中间件与路由是 Express 的骨架，下一步看[生态与对比](./ecosystem)——必装中间件清单、与 Fastify/Hono/Koa 的选型、何时该从 Express 迁移。
