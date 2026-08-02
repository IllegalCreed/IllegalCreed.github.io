---
layout: doc
outline: [2, 3]
---

# DI 与模块详解：依赖注入、Provider 与模块边界

> 基于 NestJS 10/11 · 核于 2026-08

## 速查

- **依赖注入（DI）本质**：把"创建依赖"的控制权从业务代码**反转**给容器。你只声明 `constructor(svc: UsersService)`，容器负责 `new`、注入、管理生命周期——不写 `new`，依赖解耦，测试时一行 mock。
- **三种注入方式**：①**构造函数注入**（最推荐，属性 `readonly`，依赖在实例化时确定）；②**属性注入**（`@Inject()` + 普通属性，可选依赖用，破坏不可变性，少用）；③**Token 注入**（`@Inject('CONFIG')`，注入非类 Provider 如字符串配置）。
- **Token（provide）**：Provider 的唯一标识。类 Provider 的 Token 是类本身（`UsersService`）；值/工厂 Provider 用字符串或 Symbol Token（`'DB_CONN'`），注入时必须 `@Inject(token)`。
- **四种 Provider 形态**：`useClass`（类，默认）、`useValue`（常量/mock）、`useFactory`（异步或依赖其他 Provider 的初始化，配 `inject`）、`useExisting`（别名）。
- **@Module 四字段**：`providers`（注册本模块内部 Provider）、`controllers`（本模块控制器）、`imports`（引入其他模块以用其 `exports`）、`exports`（导出哪些 Provider 供别的模块注入）。
- **模块边界 = 显式依赖图**：A 模块要用 B 的服务，必须 `imports: [BModule]` 且 B `exports` 了该服务。这让依赖关系**显式、可追踪**，避免 Express 那种"全局任意 require"的隐式耦合。
- **全局模块（@Global()）**：标了 `@Global()` 的模块，其 `exports` 无需被 `imports` 即可全应用注入。慎用（破坏显式依赖），典型场景是配置/日志/数据库连接这种**全应用单例**。
- **Provider 作用域**：默认 **singleton**（应用级单例，所有请求共享一个实例）；可配 **request**（每个请求新建，DI 链上所有依赖也变 request 作用域，性能开销大）；**transient**（每次注入都新建）。默认 singleton 是性能与简单性的保证，**不要随意改作用域**。
- **动态模块（Dynamic Modules）**：`DatabaseModule.forRoot({ url })` / `forRootAsync({ inject, useFactory })`——模块导出一个**静态方法返回模块配置对象**，让模块可接收配置参数（数据库连接、配置加载）。所有"可配置的基础设施模块"（TypeOrmModule/ConfigModule/MongooseModule）都是动态模块。

## 一、为什么需要 DI：控制反转

先看不用 DI 的痛点。传统写法里依赖是手动 new 的：

```ts
// ❌ 不用 DI：手动 new，强耦合，难测试
export class UsersController {
  private usersService: UsersService;
  constructor() {
    // 硬编码依赖：要换实现得改这里；测试无法 mock
    this.usersService = new UsersService(new UsersRepository(db));
  }
}
```

痛点：①**强耦合**——换 `UsersService` 实现要改控制器代码；②**难测试**——测试控制器时会真连数据库（`new UsersRepository(db)`）；③**生命周期难管**——单例要自己写，多实例要自己控制，依赖一多就乱。

DI 的解法是把"创建依赖"交给**容器（IoC Container）**：

```ts
// ✅ 用 DI：声明依赖，容器注入
@Controller("users")
export class UsersController {
  // 只声明类型，容器 new UsersService() 注入
  constructor(private readonly usersService: UsersService) {}
}
```

- 容器看到构造函数的 `UsersService` 类型（靠 TypeScript 的 `emitDecoratorMetadata` 反射拿到类型元数据），自动找已注册的 Provider 实例化并注入。
- **好处**：解耦（控制器只依赖接口/类型，不关心实现）、可测试（测试时把 Provider 换成 mock）、统一生命周期管理。

## 二、三种注入方式

```ts
// 1. 构造函数注入（推荐）
@Injectable()
export class OrdersService {
  constructor(
    private readonly usersService: UsersService, // 必须依赖
    @Optional() private readonly cache?: CacheService, // 可选依赖
  ) {}
}

// 2. 属性注入（少用，破坏不可变性）
@Injectable()
export class OrdersService {
  @Inject(CacheService) // 必须显式 Token（属性无类型反射保证）
  private cache!: CacheService;
}

// 3. Token 注入（非类 Provider）
@Injectable()
export class OrdersService {
  constructor(@Inject("CONFIG") private config: { port: number }) {}
}
```

- **构造函数注入为何推荐**：①依赖在实例化时就齐备，不会出现"对象已创建但依赖还没注入"的半成品状态；②`readonly` 保证不可变；③TypeScript 类型系统全程覆盖。Nest 官方与大多数团队都用它。
- **属性注入的场景**：可选依赖、循环依赖的临时解法（用 `forwardRef`）。常规场景避免。
- **Token 注入**：注入字符串/Symbol Token（`'CONFIG'`/`'DB_CONN'`）时，TypeScript 反射拿不到类型，必须用 `@Inject(token)` 显式告诉容器找哪个 Provider。

## 三、Provider 的四种形态

```ts
@Module({
  providers: [
    // 1. useClass（简写：直接写类）
    UsersService,

    // 2. useValue：常量或 mock
    { provide: "APP_NAME", useValue: "my-api" },

    // 3. useFactory：需要初始化/异步/依赖其他 Provider
    {
      provide: "DB_CONN",
      useFactory: async (config: Config) => {
        const conn = await createConnection(config.dbUrl); // 异步
        return conn;
      },
      inject: [Config], // 工厂依赖 Config，容器先实例化 Config 再调工厂
    },

    // 4. useExisting：别名（多 Token 指向同一实例）
    { provide: "Logger", useExisting: ConsoleLogger },
  ],
})
export class AppModule {}
```

- **useClass**：默认，Nest 自动 `new`。换实现时只改 `provide` 绑定的类：`{ provide: UsersService, useClass: MockUsersService }`——这是测试替换的核心手法。
- **useFactory**：用于**异步初始化**（数据库连接、配置文件加载、第三方 SDK 初始化）。`inject` 声明工厂自身的依赖，容器按顺序传入。Nest 启动时会**等工厂的 Promise resolve** 才完成装配。
- **useValue**：注入常量、配置对象，或测试时注入 mock 对象 `{ provide: UsersService, useValue: { findAll: jest.fn() } }`。

## 四、@Module：显式依赖边界

模块是组织 Provider 与 Controller 的单元，它的四个字段构成**显式依赖图**：

```ts
@Module({
  imports: [DbModule],          // 引入别的模块，才能用它 exports 的 Provider
  controllers: [UsersController], // 本模块的路由控制器
  providers: [UsersService],     // 本模块注册的 Provider（仅模块内可注入）
  exports: [UsersService],       // 导出，别的模块 import 本模块后可注入
})
export class UsersModule {}
```

```
   UsersModule                AuthModule
   providers:                 providers:
     UsersService ──────┐       AuthService
   exports:             │     exports:
     UsersService ──────┘       AuthService
                        │
                        ▼ 别的模块要用 UsersService？
                        │ 必须在 imports 里写 UsersModule
   OrdersModule
   imports: [UsersModule, DbModule]   ← 显式声明依赖
   providers: [OrdersService]
```

- **`exports` 是闸门**：一个 Provider 只有被 `exports` 才能被别的模块注入。没 `exports` 的 Provider 是模块**私有**的（封装）。
- **`imports` 是依赖声明**：要用别的模块的服务，必须 `imports` 那个模块。这让模块间依赖**显式可见**，构建时甚至能画出依赖图。
- **对比 Express**：Express 里 `require('./usersService')` 是**文件级**隐式依赖，任意文件可 require 任意文件，依赖关系散乱；Nest 的模块机制是**架构级**显式依赖边界，更适合大型项目。

## 五、全局模块与动态模块

**全局模块（@Global）**：

```ts
@Global() // 标记为全局
@Module({
  providers: [ConfigService],
  exports: [ConfigService], // 全应用可直接注入，无需 imports
})
export class ConfigModule {}
```

- 全局模块的 `exports` 对所有模块可见，无需逐一 `imports`。
- **慎用**：它破坏了显式依赖的好处。仅用于**全应用单例基础设施**（配置、日志、数据库连接、缓存）。

**动态模块（Dynamic Modules）**：让模块接收配置参数：

```ts
// 使用方
@Module({
  imports: [
    DatabaseModule.forRoot({ url: "postgres://...", pool: 10 }), // 同步配置
    // 或异步：从 ConfigService 读配置
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({ url: cfg.dbUrl }),
    }),
  ],
})
export class AppModule {}

// 动态模块的实现
@Module({})
export class DatabaseModule {
  // 静态方法返回模块配置
  static forRoot(options: DbOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [{ provide: "DB_OPTIONS", useValue: options }, DbService],
      exports: [DbService],
    };
  }
}
```

- **`forRoot` / `forFeature` 约定**：`forRoot` 配置全局一次（如 `TypeOrmModule.forRoot()`），`forFeature` 在各业务模块注册局部资源（如 `TypeOrmModule.forFeature([UserEntity])`）。
- 这是所有可配置基础设施模块（TypeORM/Prisma/Mongoose/Config/Bull）的标准模式。

## 六、Provider 作用域：慎改 singleton

```ts
@Injectable({ scope: Scope.REQUEST }) // 每个请求新建实例
export class RequestScopedService {}
```

| 作用域 | 行为 | 开销 | 适用 |
| --- | --- | --- | --- |
| **DEFAULT（singleton）** | 应用级单例，所有请求共享 | 极低（实例化一次） | 绝大多数服务（默认） |
| **REQUEST** | 每个请求新建一个实例 | **高**（DI 链上所有依赖也变 request 作用域，每请求重装配） | 需要按请求隔离状态（如多租户上下文） |
| **TRANSIENT** | 每次注入都新建 | 中 | 短期/无状态工具对象 |

- **关键陷阱**：一个 request 作用域的 Provider，它的**所有上游依赖**也会被迫变成 request 作用域（每请求重装配）——性能可能掉一个数量级。能用 singleton 就别用 request。
- **替代方案**：需要"每请求上下文"时，用 `REQUEST` 注入（`@Inject(REQUEST)` 拿到请求对象）而非改作用域，或用 **AsyncLocalStorage**（Node 原生，零开销跨异步传递上下文）。

## 七、循环依赖

A 依赖 B、B 又依赖 A 时，直接构造注入会死锁。Nest 用 `forwardRef` 解：

```ts
@Injectable()
export class A {
  constructor(@Inject(forwardRef(() => B)) private b: B) {}
}
@Injectable()
export class B {
  constructor(@Inject(forwardRef(() => A)) private a: A) {}
}
```

- `forwardRef` 延迟到运行时解析依赖，打破实例化顺序死锁。
- **根因多在架构**：循环依赖常意味着职责划分有问题，更好的做法是**抽公共 Service**（A、B 都依赖 C，而不是互相依赖）或用事件解耦。

## 八、可测试性：DI 的最大红利

```ts
const moduleRef = await Test.createTestingModule({
  controllers: [UsersController],
  providers: [UsersService], // 真实
})
  .overrideProvider(UsersService) // 替换为 mock
  .useValue({ findAll: () => [{ id: 1, name: "mock" }] })
  .compile();

const controller = moduleRef.get(UsersController);
expect(await controller.findAll()).toEqual([{ id: 1, name: "mock" }]);
```

- 因为依赖由容器注入，测试时一行 `overrideProvider` 把真服务换 mock，被测代码无感——这是 DI 相比"手动 new"最实在的好处，也是企业级项目重视 Nest 的核心理由。

## 下一步

DI 与模块是 Nest 的骨架，下一站进入[管线与适配器](./pipeline-and-adapters)——Middleware/Guards/Pipes/Interceptors/Exception Filter 如何在请求生命周期中各司其职，以及 Express 与 Fastify 适配器的切换与性能权衡。
