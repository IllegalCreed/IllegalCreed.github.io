---
layout: doc
outline: [2, 3]
---

# 入门：NestJS、依赖注入与装饰器架构

> 基于 NestJS 10/11 · 核于 2026-08

## 速查

- **NestJS 是什么**：Node.js 上**企业级、Opinionated** 的服务端框架（2017 年 Kamil Myśliwiec 创建），受 Angular 启发，以**依赖注入（DI）容器** + **装饰器驱动的模块/控制器/Provider** 为核心，让大型后端像 Spring Boot 那样分层、解耦、可测试。默认跑在 **Express** 上，可切 **Fastify** 适配器。npm 周下载约 500 万。
- **三大装饰器**：①`@Module({ controllers, providers, imports, exports })` 聚合一组控制器与 Provider；②`@Controller('users')` 声明路由控制器（路径前缀）；③`@Injectable()` 标记一个类可被 DI 容器实例化与注入。
- **依赖注入（DI）**：在构造函数声明依赖 `constructor(private readonly svc: UsersService)`，Nest 启动时自动 `new UsersService()` 并注入——开发者不写 `new`，依赖由容器管理生命周期（默认单例），且极易 mock 测试。
- **Provider**：被 `@Module.providers` 注册、可被注入的"服务"。可以是类（最常见）、值（`useValue`）、工厂（`useFactory`）、现有 Provider（`useExisting`）。默认**单例（singleton）**，可改 request/transient 作用域。
- **请求处理管线（执行顺序）**：**Middleware → Guards（鉴权，决定是否放行）→ Interceptors 前置（AOP，如缓存/日志）→ Pipes（参数校验/转换）→ Controller 方法 → Interceptors 后置（改返回值）→ Exception Filters（异常兜底）→ 响应**。这是 Nest 区别于 Express"只有中间件链"的核心。
- **HTTP 适配器**：`NestFactory.create(AppModule)` 默认 Express；`NestFactory.create<NestFastifyBody>(AppModule, new FastifyAdapter())` 切 Fastify（基准约 2 倍 QPS）。底层换不影响上层 Controller/Service 代码。
- **脚手架**：`npm i -g @nestjs/cli` → `nest new app`（建项目）→ `nest g resource users`（一键生成 Module/Controller/Service/DTO/Entity 全套 CRUD）。
- **Opinionated 的代价**：一个简单接口要建 Module/Controller/Service/DTO 四个文件，样板多、概念重，小项目显得过重——这是企业级架构的红利与代价。
- **进阶顺序**：[DI 与模块详解](./guide-line/di-and-modules) → [管线与适配器](./guide-line/pipeline-and-adapters) → [参考](./reference)。

## 一、NestJS 是什么：企业级的 DI 框架

NestJS 把"如何组织一个大型后端"这件事**给出了明确答案**——分层、解耦、用 DI 管理依赖。它的核心架构是三层 + 一个容器：

```
                  NestFactory.create(AppModule)
                              │
                  ┌───────────▼───────────┐
                  │     AppModule (根)     │   ← @Module，聚合一切
                  │   imports: [Users,     │
                  │     Auth, DbModule]    │
                  └───────────┬───────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   UsersModule           AuthModule            DbModule
   @Controller           @Controller          (动态模块)
   UsersService          AuthService          提供数据库连接
        │                     │                     │
        └──── DI 容器自动注入依赖（构造函数声明）─────┘
```

- **控制反转（IoC）**：传统代码里 `new UsersService(new UsersRepository())` 由开发者手动 new；Nest 里你只声明"我需要 UsersService"，容器负责实例化、注入、管理单例——这就是**控制权反转**给容器。
- **为什么企业级**：大型项目有几十上百个服务互相依赖，手动 new 与管理单例会陷入"依赖地狱"。DI 容器统一接管，且测试时一行代码替换成 mock。
- **与 Angular 的关系**：Nest 几乎是把 Angular 的架构（Module/Component/Service/DI）搬到了后端——这也是它装饰器味浓、类优先的根源。

## 二、最小应用：脚手架起服务

```bash
npm i -g @nestjs/cli
nest new my-api        # 建项目（选 pnpm/npm + TS）
cd my-api
nest g resource users   # 生成 users 模块全套（CRUD）
pnpm start:dev
```

Nest 启动入口 `src/main.ts`：

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // 默认 Express 适配器
  await app.listen(3000);
}
bootstrap();
```

- `NestFactory.create(AppModule)` 接收根模块，扫描其 `imports` 递归装配所有子模块、实例化所有 Provider，最后挂在 Express 上监听。
- 这与 Express 的 `const app = express(); app.listen()` 看似相近，但 Nest 在 `create` 这一步**构建了整个 DI 容器并完成依赖注入**——这是本质区别。

## 三、三大装饰器：@Module / @Controller / @Injectable

Nest 的代码骨架由三个装饰器搭起来：

```ts
// 1. @Injectable()：标记可被 DI 注入的服务
import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersService {
  private users = [{ id: 1, name: "Ada" }];
  findAll() {
    return this.users;
  }
}

// 2. @Controller()：声明路由控制器（路径前缀 'users'）
import { Controller, Get } from "@nestjs/common";

@Controller("users")
export class UsersController {
  // 构造函数注入 UsersService（DI 关键）
  constructor(private readonly usersService: UsersService) {}

  @Get() // GET /users
  findAll() {
    return this.usersService.findAll();
  }
}

// 3. @Module()：聚合控制器与 Provider
import { Module } from "@nestjs/common";

@Module({
  controllers: [UsersController], // 本模块的控制器
  providers: [UsersService],      // 本模块提供的可注入服务
  exports: [UsersService],        // 导出后其他模块才能注入它
})
export class UsersModule {}
```

- **`@Injectable()`**：告诉容器"这个类可以被实例化并注入到别处"。没有这个装饰器，DI 容器不会管理它。
- **`@Controller(prefix)`**：把类标记为路由控制器，方法上的 `@Get/@Post/@Put/@Delete(path)` 注册具体路由，`prefix` 是该控制器所有路由的公共前缀。
- **`@Module({...})`**：组织单元。`providers` 注册本模块内部用的服务；`exports` 声明哪些 Provider 可以被**其他模块**（通过 `imports` 引入本模块后）注入。这是 Nest 模块间**显式依赖边界**的关键。

## 四、依赖注入：构造函数声明依赖

Nest 的 DI 最常见形式是**构造函数注入**：

```ts
@Controller("users")
export class UsersController {
  // 只声明类型，Nest 自动 new UsersService() 注入
  constructor(private readonly usersService: UsersService) {}
}

// 多依赖同理
@Injectable()
export class OrdersService {
  constructor(
    private readonly usersService: UsersService, // 跨模块需 UsersModule 导出 + 本模块 import
    private readonly db: DatabaseService,
  ) {}
}
```

- **不写 new**：你从不在控制器/服务里 `new UsersService()`，永远声明"我需要它"，容器负责创建与注入。
- **默认单例**：整个应用里 `UsersService` 只有一个实例（singleton 作用域），所以它内部的状态（如 `this.users`）在所有请求间共享。
- **可测试**：测试时用 `Test.createTestingModule` 构建测试容器，`.overrideProvider(UsersService).useValue(mockService)` 一行把真服务换成 mock，控制器完全无感。

## 五、Provider：类、值、工厂

Provider 不只是类，有四种注册形态：

```ts
@Module({
  providers: [
    UsersService,                           // 1. 类（最常见，简写）
    { provide: 'CONFIG', useValue: { port: 3000 } },            // 2. 值
    { provide: 'DB_CONN', useFactory: (cfg) => createConn(cfg), // 3. 工厂
      inject: ['CONFIG'] },                 //    工厂自己也能注入别的 Provider
    { provide: 'Logger', useExisting: ConsoleLogger },          // 4. 别名
  ],
})
export class AppModule {}
```

- **Token（provide）**：可以是类本身（`UsersService`），也可以是字符串/Symbol Token（`'CONFIG'`）。注入 Token 时用 `@Inject('CONFIG')` 显式指定。
- **工厂（useFactory）**：用于需要异步初始化或依赖其他 Provider 的场景（如数据库连接、配置加载），`inject` 声明工厂的依赖，容器先实例化依赖再调用工厂。

## 六、请求处理管线：不止中间件

这是 Nest 与 Express 最大的架构差异。一个请求流经**六层**横切组件，每层职责单一：

```
   请求进来
     │
     ▼
  Middleware       ← 类似 Express 中间件：(req,res,next)，解析 body/CORS
     │
     ▼
  Guards           ← 鉴权：返回 boolean/Promise，false 则直接 403
     │
     ▼
  Interceptors 前置 ← AOP：进 controller 前做事（缓存命中？日志？）
     │
     ▼
  Pipes            ← 参数校验/转换（class-validator 校验 DTO）
     │
     ▼
  Controller 方法   ← 业务逻辑
     │
     ▼
  Interceptors 后置 ← AOP：拿到返回值后改写（加缓存、统一响应包装）
     │
     ▼
  Exception Filters ← controller 抛异常时兜底（统一错误格式）
     │
     ▼
  响应返回
```

- **Guards（守卫）**：决定请求**是否有权**继续（鉴权）。返回 `false` 抛 `ForbiddenException`。比 Express 在中间件里写鉴权更显式。
- **Pipes（管道）**：对**参数**做校验或转换。`ValidationPipe` + `class-validator` 自动校验 DTO，失败抛 `BadRequestException`。
- **Interceptors（拦截器）**：AOP 风格，包裹 controller 方法，可在执行前后做事（缓存、日志、映射返回值、超时控制）。底层用 **RxJS Observable** 实现。
- **Exception Filters（异常过滤器）**：捕获特定异常，转成自定义响应格式（统一错误体）。
- **为什么分层**：每个横切关注点（鉴权/校验/日志/异常）有专属组件，单一职责，可全局也可挂到具体 controller/route——比 Express 把所有逻辑塞进中间件链清晰得多。

## 七、HTTP 适配器：Express 与 Fastify

Nest 把底层 HTTP 引擎抽象成**适配器（Adapter）**，上层 Controller/Service 完全不感知底层：

```ts
// 默认：Express
const app = await NestFactory.create(AppModule);

// 切 Fastify（约 2 倍 QPS）
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
```

- **性能差异**：Fastify 因 Schema 序列化与更精简的路由，基准测试比 Express 快约 2 倍。高 QPS 场景值得切换。
- **生态权衡**：Express 适配器能用所有 Express 中间件（`app.use(helmet())`）；Fastify 适配器要用 Fastify 插件（`register`）。大部分 Nest 官方模块（GraphQL/Microservices）对两者都支持。
- **代码不变**：切换适配器时，你的 `@Controller`/`@Get`/Service 代码一行不改——这是抽象层隔离的价值。

## 下一步

理解了 NestJS 的 DI 容器、三大装饰器、Provider 与请求处理管线后，下一步深入[DI 与模块详解](./guide-line/di-and-modules)（注入原理、作用域、动态模块）与[管线与适配器](./guide-line/pipeline-and-adapters)（Guards/Pipes/Interceptors 的实战与执行细节、Express vs Fastify 切换）。
