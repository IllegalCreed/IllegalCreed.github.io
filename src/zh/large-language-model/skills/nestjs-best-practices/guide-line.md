---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Kadajett/agent-nestjs-skills（社区，非官方）v1.1.0 的 `rules/` 40 条规则逐条阅读整理。代码示例取自各规则的 `Correct` 段；数据库示例基于 **TypeORM**。规则内容以 NestJS 官方文档（docs.nestjs.com）为一手依据。

## 速查

- **架构（CRITICAL）**：避免循环依赖（#1 崩溃源）· 按特性模块组织（非技术分层）· 单一职责（拒 god service）· 正确模块共享 · 事件解耦 · 仓储模式
- **DI（CRITICAL）**：构造函数注入优于属性注入 · 懂 scopes（singleton/request/transient）· 接口用注入令牌（interface 运行时被擦除）· 避免 service locator · ISP/LSP
- **错误（HIGH）**：异常过滤器集中处理 · service 直接抛 `HttpException` · 正确处理 async 错误
- **安全（HIGH）**：JWT 短 access + refresh、不放敏感数据 · 全局 `ValidationPipe` + class-validator · 守卫做 RBAC · XSS sanitize + Helmet · `@nestjs/throttler` 限流
- **性能（HIGH）**：策略性缓存 + 失效 · async 生命周期钩子要 `await` · 优化 DB 查询 · 大模块懒加载
- **测试/数据库（MEDIUM-HIGH）**：`Test.createTestingModule` + mock · Supertest E2E；TypeORM 事务 · 避免 N+1 · 迁移（禁生产 `synchronize`）
- **API（MEDIUM）**：DTO + `@Exclude` 序列化 · 拦截器管横切 · 管道转换输入 · 内置版本化
- **微服务（MEDIUM）**：消息/事件模式 · `@nestjs/terminus` 健康检查 · BullMQ 队列
- **DevOps（LOW-MEDIUM）**：`@nestjs/config` + Joi 校验 · 结构化日志 · 优雅关闭

## 1. 架构（arch-，CRITICAL）

架构是地基，循环依赖和 god service 是头号杀手。6 条规则：

- **避免循环依赖**（标注「#1 运行时崩溃原因」）：模块 A 导入 B、B 又导入 A 会崩。解法一是抽公共逻辑到第三方 `SharedModule`，解法二是用事件解耦：

```typescript
// users.service.ts —— 发事件，不直接依赖 orders
@Injectable()
export class UsersService {
  constructor(private eventEmitter: EventEmitter2) {}
  async createUser(data: CreateUserDto) {
    const user = await this.userRepo.save(data);
    this.eventEmitter.emit('user.created', user);
    return user;
  }
}
```

- **按特性模块组织**（非技术分层）：`users/`、`orders/` 各自装齐 controller/service/dto/entity，而非把所有 controller 堆一起。作者称可带来「3-5 倍更快的上手与开发」。
- **单一职责**：拒绝 `UserAndOrderService` 这类 god service，名字带「And」多半违规；编排逻辑放 controller 或专门 orchestrator。
- 另有**正确模块共享**（导出/导入而非重复注册 provider）、**事件驱动解耦**、**仓储模式**（抽象数据访问以便测试）。

## 2. 依赖注入（di-，CRITICAL）

NestJS 的 IoC 容器强大但易误用。6 条规则：

- **优先构造函数注入**（CRITICAL）：而非属性注入。构造函数让依赖显式、可类型检查、可在测试里 `new Service(mockRepo)`。仅可选依赖才用 `@Optional() @Inject()` 属性注入。
- **理解 provider scopes**（CRITICAL）：`DEFAULT`（单例，最常用）/ `REQUEST`（每请求一实例）/ `TRANSIENT`（每次注入新实例）。**单例里存可变请求态会串号**（并发请求互相覆盖）；需请求上下文时用 `Scope.REQUEST` 或更优的 `nestjs-cls`（不引起 scope 向上冒泡）。
- **接口用注入令牌**（HIGH）：TypeScript `interface` 在运行时被擦除，不能直接当注入令牌。用 `Symbol`/字符串令牌 + `@Inject(TOKEN)`，或用抽象类（携带运行时类型）：

```typescript
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
@Module({
  providers: [{
    provide: PAYMENT_GATEWAY,
    useClass: process.env.NODE_ENV === 'test' ? MockPaymentService : StripeService,
  }],
})
export class PaymentModule {}
```

- 另有**避免 service locator 反模式**、**接口隔离原则（ISP）**、**里氏替换原则（LSP）**。

## 3. 错误处理（error-，HIGH）

- **用异常过滤器集中处理**：不要在每个 controller 里 `try/catch` 手拼错误响应。用内置异常（`NotFoundException` 等）+ 自定义 `@Catch()` 过滤器，用 `APP_FILTER` 全局注册 `AllExceptionsFilter` 统一格式（statusCode/message/timestamp/path）。
- **从 service 抛 HTTP 异常**：service 直接 `throw new NotFoundException(...)` / `ConflictException(...)`，让 controller 保持纤薄，而非返回 `{ error }` 让 controller 逐个判空。真正跨层的 service 可抛领域异常再用过滤器映射到 HTTP 码。
- **正确处理 async 错误**：确保 Promise 拒绝被捕获，避免未处理拒绝。

## 4. 安全（security-，HIGH）

5 条规则，其中 JWT 条级为 **CRITICAL**：

- **安全 JWT 鉴权**（CRITICAL）：用 `@nestjs/jwt` + `@nestjs/passport`；密钥从 `ConfigService` 读、**别硬编码**；access token 短命（如 `15m`）配 refresh token；**payload 绝不放 password/ssn** 等敏感字段；`JwtStrategy.validate` 里校验用户仍存在且未在改密后失效。
- **校验一切输入**：DTO 上加 class-validator 装饰器，`main.ts` 开全局 `ValidationPipe`：

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // 剥离未声明属性
  forbidNonWhitelisted: true, // 出现未知属性直接报错
  transform: true,            // 自动转成 DTO 类型
}));
```

- **用守卫做鉴权 / RBAC**：`JwtAuthGuard`（`CanActivate`）+ `RolesGuard` + `@Roles(Role.Admin)` 装饰器，`APP_GUARD` 全局注册，`@Public()` 放行个别路由——取代在每个 handler 里手写 `if (!req.user)` 检查。
- **XSS 输出净化**：存用户内容前用 `sanitize-html` 白名单过滤；用 `helmet` 设 CSP 头；错误消息里不回显未净化的用户输入。
- **限流**：`@nestjs/throttler`，全局 `ThrottlerGuard` + 多档 ttl/limit，登录/找回密码等敏感端点用 `@Throttle(...)` 收紧、健康检查 `@SkipThrottle()`。

## 5. 性能（perf-，HIGH）

- **策略性缓存**：`CacheModule`（可接 Redis），对昂贵/高频/外部调用缓存，配合 TTL 与**失效策略**（写操作后 `cache.del(...)`，或订阅事件失效）；别无脑缓存一切。
- **正确用 async 生命周期钩子**：`onModuleInit` 等支持 async，**必须 `await`**（`onModuleInit() { this.connect(); }` 不 await 会让 app 在 DB 就绪前启动）；跨模块依赖用 `onApplicationBootstrap`；重初始化放钩子而非构造函数。
- 另有**优化 DB 查询**、**大模块懒加载**（加快启动）。

## 6-7. 测试与数据库（test- / db-，MEDIUM-HIGH）

- **测试用 Testing Module**：`Test.createTestingModule({ providers: [Service, { provide: Repo, useValue: mock }] })`，别手动 `new` 绕过 DI 打到真库。
- **Supertest 做 E2E**、**mock 外部服务**。
- **TypeORM 事务**：多步操作用 `dataSource.transaction(async (manager) => {...})` 自动回滚，或 `QueryRunner` 手动控制 `startTransaction/commit/rollback/release`：

```typescript
return this.dataSource.transaction(async (manager) => {
  const order = await manager.save(Order, { userId, status: 'pending' });
  await this.paymentService.chargeWithManager(manager, order.id); // 抛错则整体回滚
  return order;
});
```

- **避免 N+1**：用 `relations: ['items']` 预加载、`QueryBuilder` 的 `leftJoinAndSelect`，GraphQL 场景用 `DataLoader` 批处理；开发期开 `logging: ['query']` 侦测 N+1。
- **用迁移**：生产**禁 `synchronize: true`**（会丢列/表/数据）；用 `MigrationInterface` 的 `up`/`down`，`migrationsRun: true` 启动时跑；改列名用「加新列→拷数据→加约束→删旧列」两步走。

## 8. API 设计（api-，MEDIUM）

- **DTO + 序列化**：别直接返回实体。用 class-transformer 的 `@Exclude()`（如 `passwordHash`、`ssn`）+ 全局 `ClassSerializerInterceptor`，或显式响应 DTO + `@Expose()` + 分组（groups）控制不同角色可见字段。
- **拦截器管横切**（MEDIUM-HIGH）：日志、响应包装、超时、缓存、错误映射统一放 `NestInterceptor`（`next.handle().pipe(tap/map/timeout/catchError)`），`APP_INTERCEPTOR` 全局注册，业务逻辑保持干净。
- **管道转换输入**：`ParseUUIDPipe`、`ParseIntPipe` + `DefaultValuePipe`、`ParseEnumPipe`，或自定义 `PipeTransform` 净化/转换。
- **API 版本化**：`app.enableVersioning({ type: VersioningType.URI | HEADER | MEDIA_TYPE })` + `@Version('2')`，破坏性变更时保旧客户端；旧版加弃用拦截器（`Deprecation`/`Sunset` 头）。

## 9. 微服务（micro-，MEDIUM）

- **正确用消息/事件模式**：区分请求-响应（message pattern）与事件（event pattern）。
- **健康检查**（MEDIUM-HIGH）：`@nestjs/terminus` 做 **liveness**（是否该重启，只查基本）与 **readiness**（能否接流量，查 DB/Redis/磁盘）两种探针，配 K8s `livenessProbe`/`readinessProbe`；关机时 readiness 返回 503 让 K8s 停止导流。
- **消息队列**（MEDIUM-HIGH）：`@nestjs/bullmq` 把耗时任务（邮件、报表、通知）挪出 HTTP 请求，`@Processor` 消费、`attempts` + 指数退避重试、`repeat.cron` 定时任务。

## 10. DevOps 与部署（devops-，LOW-MEDIUM）

- **ConfigModule**：`@nestjs/config` + `registerAs` 命名空间 + **Joi `validationSchema` 启动即校验**（缺 `JWT_SECRET`/`DB_HOST` 直接 fail-fast），`isGlobal: true` 全局可用，别散着读 `process.env`。
- **结构化日志**：用 NestJS `Logger`（带 context）产 JSON 日志，附 requestId/userId（可配 `nestjs-cls` / `nestjs-pino`），**别 `console.log`**，别打印密码等敏感字段（Pino `redact`）。
- **优雅关闭**（MEDIUM-HIGH）：`app.enableShutdownHooks()` + 处理 `SIGTERM`/`SIGINT`，停收新请求、等在途请求完成、关连接，实现零停机部署。

## 反模式速览（按严重度）

| 严重度 | 反模式 → 正解 |
| --- | --- |
| CRITICAL | 循环模块依赖 → 抽共享模块 / 事件 |
| CRITICAL | 单例里存请求态 → `Scope.REQUEST` / `nestjs-cls` |
| CRITICAL | JWT 硬编码密钥 / 放敏感字段 → Config 读密钥 + 短命 access + refresh |
| HIGH | `@Body() body: any` 不校验 → DTO + 全局 `ValidationPipe(whitelist)` |
| HIGH | 每个 handler 手写鉴权 → `JwtAuthGuard` + `RolesGuard` |
| HIGH | 生产 `synchronize: true` → 迁移 `MigrationInterface` |
| MEDIUM | 直接返回实体泄露字段 → `@Exclude` + `ClassSerializerInterceptor` |

## NestJS 版本背景（补充 · 非本 skill 规则）

本技能包**版本无关**，规则引 docs.nestjs.com 的通用写法，**未针对某个 NestJS 大版本**做破坏性变更说明。作为独立于本 skill 的一般背景：**NestJS 11 升级到 Express 5**（底层 path-to-regexp 升级），**通配路由语法变了**——过去的裸 `@Get('*')` 需改成**命名通配**，如 `@Get('*splat')`（`splat` 为参数名）。这属于框架自身的迁移事项，若涉及请查 [NestJS v11 迁移指南](https://docs.nestjs.com/migration-guide)，不要把它当成本 skill 的某条规则。

## 下一步

- [参考](./reference) —— 40 规则速览表 + 5 档严重度定义 + 安装 CLI + 目录结构 + 依赖生态
- 一手来源：[NestJS 官方文档](https://docs.nestjs.com) · [TypeORM](https://typeorm.io)
