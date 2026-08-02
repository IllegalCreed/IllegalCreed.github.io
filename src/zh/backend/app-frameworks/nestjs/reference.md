---
layout: doc
outline: [2, 3]
---

# 参考：装饰器、管线组件与易错点速查

> 基于 NestJS 10/11 · 核于 2026-08

## 速查

- **NestJS 定义**：Node.js 上企业级、Opinionated 框架，受 Angular 启发，核心是 DI 容器 + 装饰器驱动的模块/控制器/Provider 架构。
- **三大装饰器**：`@Module`（聚合）、`@Controller`（路由）、`@Injectable`（可注入）。
- **DI**：构造函数声明依赖，容器自动 new 注入，默认单例，极易 mock 测试。
- **Provider 四形态**：`useClass`（类）/`useValue`（值）/`useFactory`（异步或依赖其他）/`useExisting`（别名）。
- **作用域**：DEFAULT（singleton，推荐）/ REQUEST（每请求新建，性能差）/ TRANSIENT（每注入新建）。
- **管线顺序**：Middleware → Guards → Interceptors 前置 → Pipes → Controller → Interceptors 后置 → Exception Filters。
- **适配器**：默认 Express，可切 Fastify（约 2 倍 QPS），上层代码不变。

## 一、核心装饰器速查

| 装饰器 | 用途 | 位置 |
| --- | --- | --- |
| `@Module({...})` | 聚合 controllers/providers/imports/exports | 类 |
| `@Controller(prefix)` | 声明路由控制器，设路径前缀 | 类 |
| `@Injectable()` | 标记可被 DI 注入 | 类 |
| `@Global()` | 模块 exports 全应用可见 | 类（模块） |
| `@Get/@Post/@Put/@Delete/@Patch(path)` | 注册 HTTP 路由 | 方法 |
| `@Param(name)` | 取路径参数 | 方法参数 |
| `@Query(name)` | 取查询串 | 方法参数 |
| `@Body()` | 取请求体 | 方法参数 |
| `@Headers(name)` | 取请求头 | 方法参数 |
| `@Req() / @Res()` | 取原生 req/res（少用，破坏 Nest 抽象） | 方法参数 |
| `@Inject(token)` | 用 Token 注入非类 Provider | 方法参数/属性 |
| `@Optional()` | 标记依赖可选（缺失不报错） | 方法参数 |
| `@UseGuards(...)` | 挂载 Guard | 类/方法 |
| `@UsePipes(...)` | 挂载 Pipe | 类/方法 |
| `@UseInterceptors(...)` | 挂载 Interceptor | 类/方法 |
| `@UseFilters(...)` | 挂载 Exception Filter | 类/方法 |
| `@SetMetadata(key, val)` | 写元数据（自定义装饰器基础） | 方法 |

## 二、管线组件对比

| 组件 | 职责 | 签名/返回 | 典型场景 |
| --- | --- | --- | --- |
| **Middleware** | 最外层预处理 | `(req, res, next)` | CORS、body 解析、日志 |
| **Guard** | 鉴权/权限 | `canActivate(): boolean` | 登录校验、角色权限 |
| **Pipe** | 参数转换/校验 | `transform(value): value` | DTO 校验、类型转换 |
| **Interceptor** | AOP 前后置 | `intercept(ctx, next): Observable` | 缓存、日志、响应包装、超时 |
| **Exception Filter** | 异常格式化 | `catch(exc, host)` | 统一错误响应体 |

- **边界**：鉴权→Guard；参数校验→Pipe；横切前后置→Interceptor；异常→Filter。**不要在 Middleware 里做鉴权**（Guard 能拿装饰器元数据，更合适）。

## 三、Provider 作用域与影响

| 作用域 | 实例化时机 | 性能 | 何时用 |
| --- | --- | --- | --- |
| `DEFAULT`（singleton） | 应用启动一次 | 最佳 | 99% 场景（默认） |
| `Scope.REQUEST` | 每个请求新建 | **差**（DI 链全变 request） | 多租户上下文等需请求级隔离 |
| `Scope.TRANSIENT` | 每次注入新建 | 中 | 无状态工具对象 |

- **陷阱**：一个 request 作用域 Provider 会**拖累整条 DI 链**（它的依赖也被迫 request 化），性能可能掉一个数量级。需"每请求上下文"时优先用 `REQUEST` 注入或 AsyncLocalStorage。

## 四、Express vs Fastify 适配器

| 维度 | Express | Fastify |
| --- | --- | --- |
| 包 | `@nestjs/platform-express`（默认） | `@nestjs/platform-fastify` |
| 性能 | 基线 | **约 2 倍 QPS** |
| 中间件 | `app.use(fn)` | `app.register(plugin)` |
| 类型 | `INestApplication` | `NestFastifyApplication` |
| 选型 | 默认、生态全 | 高 QPS、需 Schema 性能 |

## 五、与 Express / Spring Boot 对照

| 概念 | Express | NestJS | Spring Boot |
| --- | --- | --- | --- |
| 路由 | `app.get('/x', h)` | `@Controller('x')` + `@Get()` | `@RestController` + `@GetMapping` |
| 中间件 | `app.use(fn)` | Middleware / Guards / Pipes / Interceptors | Filter / Interceptor / AOP |
| 依赖管理 | 手动 `new` / require | **DI 容器**（@Injectable） | **DI 容器**（@Component/@Autowired） |
| 模块化 | express.Router | `@Module` | `@Configuration` / Bean |
| 校验 | 手写/joi | `ValidationPipe` + class-validator | `@Valid` + Bean Validation |
| 鉴权 | 中间件 | Guard | Filter / Spring Security |

- **Nest ≈ Spring Boot for Node**：架构理念最接近 Spring Boot，是 Java/C# 团队转 Node 的最低摩擦选择。
- **Nest vs Express**：Express 是"地基+中间件"，Nest 是"完整建筑方案"（DI/分层/管线/生态）。

## 六、易错点清单

- **"Provider 没在 providers 注册也能注入"**：错。必须先在某个模块的 `providers` 注册，容器才认识它；跨模块还要 `exports` 出去并被 `imports`。
- **"构造函数注入要写 @Inject()"**：错。类 Provider 靠 TypeScript 类型反射自动注入，不用 `@Inject()`。只有**字符串/Symbol Token**才需要 `@Inject(token)`。
- **"Guards 在 Pipes 之后"**：错。顺序是 **Guards → Pipes**，先鉴权再校验参数（未授权者不应看到参数错误细节）。
- **"在 Middleware 里做鉴权"**：不推荐。Middleware 拿不到 `@Roles()` 等装饰器元数据，鉴权应交给 Guard（用 Reflector 读元数据）。
- **"作用域随便改 REQUEST"**：错。request 作用域会拖累整条 DI 链，性能掉一个数量级。需要请求上下文用 `REQUEST` 注入或 AsyncLocalStorage。
- **"全局模块（@Global）随便用"**：错。它破坏显式依赖，只用于配置/日志/DB 这类全应用单例基础设施。
- **"换 Fastify 要改 Controller 代码"**：错。上层 `@Controller`/`@Get`/Service 一行不改，只换 `NestFactory.create` 的适配器与 `app.use`/`app.register` 用法。
- **"Nest 比 Express 快"**：错。Nest 跑在 Express 之上，启动有 DI 容器装配 + 反射开销，**基准比裸 Express 慢**。切 Fastify 才接近 Fastify 性能，但仍不如裸 Fastify。
- **"NestJS 的类型能跨 HTTP 边界"**：错。Nest 的 TS 类型在 controller 返回 JSON 后就断了，前端拿不到类型。要端到端类型安全用 **tRPC** 或配 Swagger codegen。
- **"NestJS 是微服务框架"**：部分对。Nest 有 `@nestjs/microservices`（transport 层），但**服务拆分/注册发现/gRPC 等架构视角归微服务章**；本叶讲 Nest 作为应用框架（DI/模块/路由）。

## 七、进阶方向（链接其他叶）

- [Express](../../express/) —— Nest 默认底层，中间件管道的极简哲学
- [Fastify](../../fastify/) —— Schema 性能派，Nest 可切换的适配器
- [tRPC](../../trpc/) —— 端到端类型安全，对比 Nest 的"类型在 HTTP 边界断"
- [微服务架构] —— Nest microservices transport 的架构视角（服务拆分/注册发现/gRPC）

## 权威链接

- [NestJS 官方文档](https://docs.nestjs.com/)
- [NestJS Providers](https://docs.nestjs.com/providers)
- [NestJS Injection Scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
- [NestJS Guards / Pipes / Interceptors / Filters](https://docs.nestjs.com/guards)
- [NestJS Dynamic Modules](https://docs.nestjs.com/fundamentals/dynamic-modules)
- [NestJS Fastify Adapter](https://docs.nestjs.com/techniques/performance)
- 本站幻灯片：<a href="/SlideStack/nestjs-slide/" target="_blank">NestJS</a>
