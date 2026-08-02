---
layout: doc
outline: [2, 3]
---

# 参考：Express API、中间件清单与 4/5 对照速查

> 基于 Express 5.0 / 4.x · 核于 2026-08

## 速查

- **核心 API**：`express()` 建 app、`app.use(path?, fn)` 挂中间件、`app.METHOD(path, ...handlers)` 注册路由、`app.listen(port)` 启动、`express.Router()` 建子路由。
- **req 对象**：`req.params`（路径参数）、`req.query`（查询串，5.0 默认普通对象）、`req.body`（需 body-parser 中间件）、`req.headers`、`req.cookies`（需 cookie-parser）。
- **res 对象**：`res.status(code)`、`res.json(obj)`、`res.send(data)`、`res.end()`、`res.redirect(url)`、`res.set(field, value)`、`res.cookie(name, value)`。
- **中间件四类**：应用级（`app.use`）、路由级（`router.use`）、错误处理（4 参数 `(err,req,res,next)`）、内建（`express.static/json/urlencoded`）。
- **路由参数**：`:id`（命名）、`*splat`（5.0 命名通配）、正则 `/^\/users\/(\d+)$/`。
- **Express 5 关键变化**：async 自动捕获、req.query 普通对象、废弃 API 移除、path-to-regexp v8、Node ≥ 18。
- **错误处理**：`next(err)` 触发错误中间件，4.x async 需手动 try/catch，5.x 自动。
- **必装中间件**：`cors`、`helmet`、`morgan`、`multer`、`cookie-parser`、`compression`、`passport`。

## 一、app 对象核心方法

| 方法 | 说明 | 示例 |
| --- | --- | --- |
| `express()` | 创建应用 | `const app = express()` |
| `app.use([path,] fn)` | 挂中间件 | `app.use(cors())` / `app.use('/api', auth)` |
| `app.METHOD(path, ...handlers)` | 注册路由 | `app.get('/users/:id', getUser)` |
| `app.all(path, ...handlers)` | 所有方法 | `app.all('*', logAll)` |
| `app.listen(port, cb)` | 启动监听 | `app.listen(3000)` |
| `app.set(key, value)` | 配置项 | `app.set('json spaces', 2)` |
| `app.engine(ext, fn)` | 注册模板引擎 | `app.engine('ejs', ejs.renderFile)` |
| `app.render(view, locals, cb)` | 渲染视图 | SSR 场景 |

## 二、req 对象常用属性

| 属性 | 说明 | 4.x vs 5.0 |
| --- | --- | --- |
| `req.params` | 路径参数（`/users/:id` → `{id}`） | 一致 |
| `req.query` | 查询串 | 4.x qs 嵌套；**5.0 普通对象** |
| `req.body` | 请求体（需中间件解析） | 一致 |
| `req.headers` | 请求头 | 一致 |
| `req.cookies` | Cookie（需 cookie-parser） | 一致 |
| `req.path` | 路径 | 一致 |
| `req.method` | 方法 | 一致 |
| `req.ip` | 客户端 IP（受 trust proxy 影响） | 一致 |

## 三、res 对象常用方法

| 方法 | 说明 | 是否终结响应 |
| --- | --- | --- |
| `res.status(code)` | 设置状态码 | 否（链式） |
| `res.set(field, value)` | 设置响应头 | 否 |
| `res.json(obj)` | 发 JSON | 是 |
| `res.send(data)` | 发数据（自动判断类型） | 是 |
| `res.end()` | 结束响应（无 body） | 是 |
| `res.redirect([code,] url)` | 重定向 | 是 |
| `res.cookie(name, value, opts)` | 设置 Cookie | 否 |
| `res.clearCookie(name)` | 清除 Cookie | 否 |
| `res.download(path)` | 下载文件 | 是 |
| `res.render(view, locals)` | SSR 渲染 | 是 |

## 四、中间件四类

| 类型 | 签名 | 挂载方式 | 用途 |
| --- | --- | --- | --- |
| **应用级** | `(req, res, next) => {}` | `app.use(fn)` | 全局预处理（日志/CORS/body） |
| **路由级** | 同上 | `router.use(fn)` 或 `app.get(path, fn, h)` | 特定路由预处理（鉴权/限流） |
| **错误处理** | `(err, req, res, next) => {}`（必须 4 参数） | `app.use(fn)` 在最后 | 兜底错误，返回 500 |
| **内建** | `express.static/json/urlencoded` | `app.use(express.json())` | 静态文件/body 解析 |

- **错误中间件必须是 4 参数**：Express 靠 `fn.length === 4` 识别错误处理器——写成 3 参数会被当成普通中间件，永远收不到错误。
- **`express.json()` / `express.urlencoded()`**：4.16 起内建（取代独立的 `body-parser`），分别解析 JSON body 和表单 body。

## 五、Express 4.x vs 5.0 对照

| 维度 | Express 4.x | Express 5.0 |
| --- | --- | --- |
| **发布** | 2014-04 | 2024-10（等 9 年） |
| **async 错误** | 手动 try/catch + next(err)，rejection 丢失 | 自动捕获，rejection → next(err) |
| **req.query** | qs 库嵌套解析 | 普通对象（可配置回 qs） |
| **废弃 API** | `res.send(status)`/`app.del`/`req.param()` 尚在 | 全部移除 |
| **path-to-regexp** | v0.x | v8（命名通配 `*splat`） |
| **Node 版本** | ≥ 0.10 | ≥ 18 |
| **中间件兼容** | 大部分 4.x 中间件 | 多数兼容，依赖废弃 API 的需更新 |

## 六、必装中间件清单

| 中间件 | 作用 | 周下载量级 |
| --- | --- | --- |
| `cors` | 跨域资源共享 | 数千万 |
| `helmet` | 安全头（CSP/XSS/HSTS 等） | 数千万 |
| `morgan` | HTTP 请求日志 | 数千万 |
| `multer` | multipart/form-data 文件上传 | 数千万 |
| `cookie-parser` | 解析 Cookie 头 | 数千万 |
| `compression` | gzip/deflate 压缩响应 | 数千万 |
| `express-rate-limit` | API 限流 | 数千万 |
| `passport` | 认证策略（JWT/OAuth/Local） | 数千万 |
| `express-validator` | 请求参数校验 | 数千万 |

## 七、易错点清单

- **错误中间件写成 3 参数**：错。必须是 4 参数 `(err, req, res, next)`，否则 Express 不认它是错误处理器。
- **中间件忘了 `next()`**：请求挂起，客户端超时。记得每个中间件要么 `res.send()` 终结，要么 `next()` 放行。
- **4.x async 抛错丢失**：4.x 不会自动 `next(err)`，async 处理器必须 try/catch 或用 `express-async-errors`。5.0 已修复。
- **5.0 req.query 行为变了**：依赖 `?a[b]=1` 嵌套的代码升级会 break，需 `app.set('query parser', 'extended')` 或改代码。
- **5.0 通配 `*` 改了**：未命名 `*` 被移除，需命名 `*splat`（`req.params.splat`）。
- **`express.json()` 要在路由前挂**：`app.use(express.json())` 必须在 `app.post(...)` 之前，否则 `req.body` 是 undefined。
- **`app.listen` 异步回调里的错误**：端口被占用等错误在回调里，记得处理 `app.listen(port, () => ...).on('error', ...)`。
- **静态文件中间件顺序**：`app.use(express.static('public'))` 通常放最前，避免被日志/CORS 中间件拖慢静态资源。

## 八、进阶方向（链接其他叶）

- [Fastify](../fastify/) —— Schema 验证 + 性能派，对比基准
- [Hono](../hono/) —— 边缘优先 + 跨运行时派
- [NestJS](../../nestjs/)（如有） —— 基于 Express/Fastify 的企业级框架

## 权威链接

- [Express 官网](https://expressjs.com/)
- [Express 5 发布说明](https://expressjs.com/en/guide/migrating-to-5.html)
- [Express GitHub](https://github.com/expressjs/express)
- [path-to-regexp v8](https://github.com/pillarjs/path-to-regexp)
- 本站幻灯片：<a href="/SlideStack/express-slide/" target="_blank">Express</a>
