---
layout: doc
outline: [2, 3]
---

# 管线与适配器：Guards/Pipes/Interceptors 与 Fastify

> 基于 NestJS 10/11 · 核于 2026-08

## 速查

- **请求处理管线（执行顺序）**：`Middleware → Guards → Interceptors(前置) → Pipes → Controller → Interceptors(后置) → Exception Filters → 响应`。每层职责单一，可全局（`APP_*`）或挂到 controller/route。
- **Middleware**：最外层，签名 `(req, res, next)`，几乎等同 Express 中间件。做与业务无关的预处理（CORS、body 解析、日志）。在 Nest 中**用得最少**（鉴权交给 Guards，校验交给 Pipes）。
- **Guards（守卫）**：决定**是否放行**（鉴权）。`canActivate(context): boolean | Promise | Observable`，返回 `false` 抛 `ForbiddenException`。用 `@UseGuards(JwtAuthGuard)` 挂载，可读 `Reflector` 拿到 `@Roles()` 等元数据做角色判断。
- **Pipes（管道）**：对**参数**做**转换或校验**。`transform(value, metadata)`。内置 `ValidationPipe`（配 class-validator 自动校验 DTO，失败抛 `BadRequestException`）、`ParseIntPipe`/`ParseUUIDPipe`（类型转换）。
- **Interceptors（拦截器）**：AOP 风格，用 **RxJS Observable** 包裹 controller 方法。可在方法执行**前后**做事：缓存、统一日志、映射返回值、超时控制、事务包装。`intercept(context, next)` 里 `next.handle()` 返回 Observable。
- **Exception Filters（异常过滤器）**：捕获**特定异常**转成自定义响应体（统一错误格式）。`@Catch(HttpException)` 挂到 controller 或全局。Nest 内置全局异常层会把未捕获异常转成 `InternalServerErrorException`。
- **全局注册**：`APP_GUARD`/`APP_PIPE`/`APP_INTERCEPTER`/`APP_FILTER` 这几个 Provider Token 注册到根模块即全局生效。
- **Guards vs Pipes vs Interceptors 边界**：鉴权/权限→Guard；参数格式/类型校验→Pipe；横切前后置逻辑（缓存/日志/映射）→Interceptor；异常格式化→Filter。**别在 Middleware 里做鉴权**（Guard 更合适，能拿到装饰器元数据）。
- **Express 适配器（默认）**：`NestFactory.create()` 用 Express，能用全部 Express 中间件（helmet/morgan），生态最全。
- **Fastify 适配器**：`NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())`，基准 QPS 约为 Express 的 **2 倍**（Schema 序列化 + 精简路由）。要 `@nestjs/platform-fastify`，中间件改用 Fastify 插件。
- **底层切换零成本**：换适配器时 `@Controller`/`@Get`/Service 代码一行不改——这是抽象层隔离的核心价值，也是 Nest 比"绑死 Express"更优的地方。

## 一、管线总览：六层各司其职

Nest 把一个请求的处理拆成**六层横切组件**，每层单一职责，可全局也可挂到具体路由：

```
   GET /users/123
        │
        ▼
   ┌─────────────────────────────────────────┐
   │ 1. Middleware (cors, body-parser, morgan)│  ← (req,res,next)，最外层
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ 2. Guard (JwtAuthGuard)                  │  ← canActivate() 返回 false → 403
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ 3. Interceptor 前置 (CacheInterceptor)   │  ← 缓存命中？命中直接返回
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ 4. Pipe (ValidationPipe, ParseIntPipe)   │  ← 校验 DTO/转换 :id 为 number
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ 5. Controller 方法 findAll(id)            │  ← 业务逻辑
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ 6. Interceptor 后置 (LoggingInterceptor) │  ← 拿返回值，日志/包装响应
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │ 7. Exception Filter (兜底，仅异常时)       │  ← 统一错误格式
   └──────────────────┬──────────────────────┘
                      ▼
                   响应返回
```

- **顺序很重要**：Guard 在 Pipe 前，意味着**先鉴权再校验参数**（未授权的人不应知道参数细节）。Interceptor 包裹 Controller，所以前置/后置逻辑都能做。
- **与 Express 的对比**：Express 只有"中间件链"，鉴权、校验、日志、异常全塞中间件，逻辑混杂。Nest 把它们拆成四种组件，单一职责，可复用可测试。

## 二、Guards：鉴权与权限

```ts
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>("roles", ctx.getHandler());
    if (!required) return true;
    const req = ctx.switchToHttp().getRequest();
    return required.some((r) => req.user?.roles?.includes(r));
  }
}

// 用法：装饰器声明所需角色 + 挂 Guard
@UseGuards(JwtAuthGuard, RolesGuard) // 先验登录，再验角色
@Roles("admin")
@Get("users")
findAll() {}
```

- **`canActivate` 返回 false**：Nest 抛 `ForbiddenException`（403），请求不到 controller。
- **`ExecutionContext`**：统一抽象 HTTP/WS/Microservice 上下文，Guard 能跨传输层复用（同一个 Guard 既护 HTTP 也能护 GraphQL）。
- **`Reflector` 读元数据**：`@Roles('admin')` 把角色写进元数据，Guard 用 `reflector.get('roles')` 读出——这是 Nest"装饰器声明 + Guard 执行"的经典模式。

## 三、Pipes：参数转换与校验

```ts
// 内置：类型转换
@Get(":id")
findOne(@Param("id", ParseIntPipe) id: number) { // 字符串 → number，失败抛 400
  return this.usersService.findOne(id);
}

// ValidationPipe + class-validator：自动校验 DTO
@Post()
create(@Body(new ValidationPipe()) dto: CreateUserDto) {}

// DTO：用装饰器声明约束
class CreateUserDto {
  @IsString() @MinLength(2)
  name: string;
  @IsEmail()
  email: string;
  @IsInt() @Min(0)
  age: number;
}
```

- **两种用途**：①**转换**（`ParseIntPipe` 把字符串转 number）；②**校验**（`ValidationPipe` 配 class-validator 校验 DTO 字段约束）。
- **失败行为**：抛 `BadRequestException`（400），响应体含详细字段错误——前端能据此渲染表单错误。
- **全局开启**：`app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`——`whitelist` 剥离 DTO 未声明的字段（防参数污染），`transform` 把普通对象转成 DTO 类实例。

## 四、Interceptors：AOP 与 RxJS

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap, timeout } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe( // next.handle() 返回 Observable
      tap(() => console.log(`耗时 ${Date.now() - now}ms`)), // 后置：方法返回后
    );
  }
}

// 超时控制：5s 没返回就抛错
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(timeout(5000)); // RxJS timeout 操作符
  }
}
```

- **AOP（面向切面）**：在不改 controller 代码的前提下，给一批方法统一加横切逻辑（日志/缓存/事务/超时）。
- **RxJS Observable**：`next.handle()` 返回的是 Observable，能 `tap`（后置）、`map`（改返回值）、`catchError`（兜底）、`timeout`（超时）——函数响应式编程的威力。
- **典型用途**：缓存（前置命中则不调 controller）、统一响应包装（`map` 把返回值包成 `{ code, data }`）、超时、事务边界、日志。
- **缓存拦截器**：Nest 内置 `CacheInterceptor`（配 `CacheModule`），用装饰器 `@UseInterceptors(CacheInterceptor)` 标记即自动缓存返回值。

## 五、Exception Filters：统一错误格式

```ts
@Catch(HttpException) // 捕获这类异常
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const status = exception.getStatus();
    res.status(status).json({ // 统一错误体
      code: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// 全局注册
app.useGlobalFilters(new HttpExceptionFilter());
```

- **内置异常**：Nest 抛 `HttpException`/`BadRequestException`/`NotFoundException`/`UnauthorizedException` 等会自动转成对应 HTTP 状态码。
- **Filter 的价值**：把异常**格式化**成前端期望的统一错误体（`{ code, message, data }`），而不是裸的 `{ statusCode, message }`。
- **兜底**：未捕获的异常会被 Nest 内置的全局异常层转成 `InternalServerErrorException`（500），不会让进程崩。

## 六、HTTP 适配器：Express 与 Fastify

```ts
// 默认：Express（用全部 Express 中间件）
import { NestFactory } from "@nestjs/core";
const app = await NestFactory.create(AppModule);
// app.use(helmet()); // 直接用 Express 中间件

// 切 Fastify（约 2 倍 QPS）
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
// 用 Fastify 插件：await app.register(helmet);
```

| 维度 | Express 适配器 | Fastify 适配器 |
| --- | --- | --- |
| **包** | `@nestjs/platform-express`（默认装） | `@nestjs/platform-fastify`（另装） |
| **性能** | 基线 | **约 2 倍 QPS**（Schema 序列化 + 精简路由） |
| **中间件/插件** | `app.use(expressMiddleware)` | `app.register(fastifyPlugin)` |
| **类型** | `INestApplication` | `NestFastifyApplication` |
| **生态** | Express 中间件海量 | Fastify 插件够用但少于 Express |
| **何时选** | 默认，依赖大量 Express 中间件 | 高 QPS、需要 Schema 性能 |

- **上层代码不变**：无论哪个适配器，你的 `@Controller`/`@Get`/`@Injectable`/Service/DI/管线代码**一行不改**。Nest 把 HTTP 引擎抽象成 `HttpAdapter` 接口，上层只面向 Nest 抽象编程。
- **基准差异来源**：Fastify 用 JSON Schema 做响应序列化（编译期生成快路径函数）+ 更精简的路由树，所以快。代价是定义 Schema 比 Express 啰嗦，但 Nest 的 `@nestjs/swagger` 等能自动产出 Schema。
- **微服务场景**：`NestFactory.createMicroservice` 用 TCP/Redis/NATS/RabbitMQ/gRPC 等 transport（**微服务架构视角归微服务章**），HTTP 适配器只针对 HTTP 场景。

## 七、何时不选 NestJS

| 场景 | 更合适的选择 | 原因 |
| --- | --- | --- |
| **简单 CRUD/小服务** | Express / Fastify / Hono | Nest 的样板与概念对小项目过重 |
| **边缘/Serverless 冷启动敏感** | Hono / Fastify | Nest DI 容器 + 反射元数据冷启动慢 |
| **函数式/极简派团队** | Hono / Fastify | Nest 的 OOP + 装饰器风格不匹配 |
| **TypeScript 端到端类型安全（前后端一体）** | tRPC | Nest 的类型在 HTTP 边界断了，tRPC 无 codegen 更彻底 |
| **大型企业业务系统** | **NestJS（本叶）** | DI + 分层 + 可测试 + 生态，复杂度管理最佳 |

## 下一步

管线与适配器讲完后，建议进入[参考](./reference)速查装饰器、管线组件对比与易错点；横向对比可看 [Express](../../express/)（中间件派）与 [tRPC](../../trpc/)（类型安全派）。
