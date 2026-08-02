---
layout: doc
---

# NestJS

**NestJS** 是 Node.js 上**企业级、 Opinionated（约定优于配置）** 的服务端应用框架——诞生于 2017 年（Kamil Myśliwiec），深受 **Angular** 启发，把**面向对象（OOP）**、**函数式编程（FP）** 与 **函数响应式编程（FRP/RxJS）** 融为一体。它的核心卖点是**依赖注入（DI）容器** + **装饰器驱动的模块/控制器/Provider 架构**——让大型后端项目像写 Spring Boot/.NET 那样**分层、解耦、可测试**，而不是 Express 那种"自己拼中间件"的散装风格。底层默认跑在 **Express** 之上（也可切 **Fastify** 适配器获得约 2 倍吞吐），开箱即用地整合了 GraphQL、WebSocket、微服务、定时任务、队列等企业级能力。截至 2026 年，npm **周下载约 500 万**，是 Node 后端**复杂业务系统**选型时绕不开的名字，尤其适合**已有 Java/C# 背景的团队**上手 Node。

NestJS 的全部考点围绕**分层架构**与**DI 容器**展开：①**装饰器与模块**——`@Module()` 聚合控制器与 Provider，`@Controller()` 声明路由，`@Injectable()` 标记可注入服务，三者构成 Nest 的"控制反转（IoC）"骨架；②**依赖注入（DI）**——构造函数声明依赖（`constructor(private readonly usersService: UsersService)`），容器自动 `new` 并注入，省去手动 `new` 与单例管理，且**极易 mock 测试**；③**Provider 与作用域**——Provider 默认**单例（singleton）**，可配置 request 瞬态/请求级作用域；④**请求处理管线**——**Middleware → Guards（鉴权）→ Interceptors（前后置，AOP）→ Pipes（参数校验/转换）→ Controller handler → Interceptors 后置 → Exception Filter（异常兜底）**，一条完整的横切关注点链路；⑤**HTTP 适配器**——`NestFactory.create` 默认用 Express，`createMicroservice`/Fastify 适配器可切换底层。本叶讲**应用框架视角**（DI/模块/路由/装饰器/管线），与 [Express](../express/)（中间件派）、[Fastify](../fastify/)（性能派）、[tRPC](../trpc/)（类型安全派）形成对比；**服务拆分/注册发现/gRPC 等微服务架构视角归[微服务架构]章**，本叶不深入。

## 评价

**优点**

- **企业级架构**：DI + 模块 + 装饰器，天然分层（Controller/Service/Repository），大型项目结构清晰、可维护性强
- **强类型 + 装饰器**：一等公民 TypeScript，结合 `class-validator`/`class-transformer` 做参数校验与转换，类型从路由贯穿到服务层
- **生态完备**：官方维护 GraphQL、WebSocket、Microservices、BullMQ 队列、TypeORM/Prisma/Mongoose 集成、Swagger 自动生成、Config/Logger/CLI（nest）等一等模块
- **可测试性**：DI 容器让 mock 依赖极简，`Test.createTestingModule().overrideProvider()` 一行替换，单元测试/e2e 测试体验优秀
- **底层可换**：Express 与 Fastify 适配器任选，性能与生态兼得

**缺点**

- **概念重、学习曲线陡**：DI/Provider/作用域/Guards/Pipes/Interceptors/Filters 一堆概念，对只写过 Express 的人是认知负担
- **样板代码多**：一个简单 CRUD 要建 Module/Controller/Service/DTO 四个文件，小项目显得"重"
- **Angular 味重**：装饰器 + 类 + RxJS 的风格，对函数式/极简派开发者不友好（与 Hono/Fastify 形成反差）
- **启动与反射开销**：DI 容器初始化 + 装饰器元数据反射有一定启动成本，且 Serverless 冷启动比裸 Express 慢
- **微服务/GraphQL 深入需另学**：本叶只点到，真正落地要单独研究 transport 层与 code-first schema

## 本叶地图

- [入门](./getting-started) —— NestJS 是什么、DI 与 @Module/@Controller/@Injectable、最小应用、Provider/Service、请求处理管线概览
- [DI 与模块详解](./guide-line/di-and-modules) —— 依赖注入原理、Provider 注册与注入方式（构造函数/属性/Token）、作用域（singleton/request/transient）、@Module 的 imports/exports/providers、动态模块
- [管线与适配器](./guide-line/pipeline-and-adapters) —— Middleware/Guards/Pipes/Interceptors/Exception Filter 执行顺序与各自职责、Express vs Fastify 适配器切换与性能
- [参考](./reference) —— 装饰器速查、管线组件对比、Provider 作用域、易错点、与 Express/Spring Boot 的对照

## 幻灯片地址

<a href="/SlideStack/nestjs-slide/" target="_blank">NestJS</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=NestJS" target="_blank" rel="noopener noreferrer">NestJS 测试题</a>
