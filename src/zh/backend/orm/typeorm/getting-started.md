---
layout: doc
outline: [2, 3]
---

# 入门：TypeORM 是什么、实体与两种模式

> 基于 TypeORM 1.0（2026 复兴版） · 核于 2026-08

## 速查

- **定义**：TypeORM 是 **Node.js 上最经典的 OOP 风格 ORM**——用 TypeScript **装饰器**（`@Entity`/`@Column`/`@PrimaryGeneratedColumn`）把 class 映射成数据库表，受 Java **Hibernate** / .NET **Entity Framework** 启发。是 **NestJS 的默认 ORM**，长期垄断 Node 企业级后端。
- **两种模式**：①**Active Record**——实体继承 `BaseEntity`，静态方法直接操作（`user.save()`、`User.find()`），简单适合小项目；②**DataMapper**（推荐）——用 `Repository`（`userRepository.find()`）隔离数据访问，可测试性好，适合中大型项目。
- **TypeORM 1.0（2026.6 复兴）**：沉寂数年后由社区接管重启——现代化重构（ESM、移除遗留 `require`）、升级驱动（MySQL2/Pg-native）、修复大量 issue、优化装饰器类型推断、与 NestJS 11 深度对齐。是 0.x 之后的大版本里程碑。
- **实体（Entity）**：一个 `@Entity()` 装饰的 class 就是一张表，字段用 `@Column`/`@PrimaryGeneratedColumn` 声明，关系用 `@OneToMany`/`@ManyToOne`/`@OneToOne`/`@ManyToMany` 装饰器。
- **迁移（Migration）**：`typeorm migration:generate`（对比实体与库差异生成迁移）、`migration:run`/`migration:revert`（应用/回滚）。与 Prisma 的 `migrate dev` 类似。
- **QueryBuilder**：链式查询构建器——`userRepository.createQueryBuilder('u').where('u.age > :age', { age: 18 }).orderBy('u.name').getMany()`，适合复杂查询（join/子查询/聚合），参数绑定防注入。
- **DataSource**：TypeORM 1.0 的连接入口（替代 0.x 的 `Connection`/`createConnection`），`new DataSource({...})` 后 `.initialize()` 连接。
- **NestJS 集成**：`@nestjs/typeorm` 的 `forRoot`（全局连接）+ `forFeature([Entity])`（模块注册）+ `@InjectRepository()` 注入 Repository——NestJS 后端的标准姿势。
- **边界**：本叶讲 TypeORM 作为通用 ORM；NestJS 专属最佳实践见 NestJS 叶。

## 一、TypeORM 是什么：OOP 风格的装饰器 ORM

TypeORM 的核心思想是 **把面向对象的 class 映射成关系型数据库的表**（Object-Relational Mapping 的经典含义）：

1. **写实体类**：用 TypeScript class + 装饰器描述一张表——class 是表、属性是列、装饰器声明主键/类型/关系。
2. **DataSource 连库**：`new DataSource({ type: 'postgres', entities: [User, Post] })` 注册所有实体并连库。
3. **两种操作模式**：要么 Active Record（实体自带 save/find 静态方法），要么 DataMapper（通过 Repository 操作）。

这与 Prisma（schema DSL + 代码生成）、Drizzle（schema 即 TS 代码、SQL-faithful）的根本区别是：**TypeORM 是传统的 OOP ORM**——它假定你用 class、用继承、用装饰器，世界观和 Java 的 Hibernate、.NET 的 EF、Python 的 SQLAlchemy 一致。如果你来自 Java/.NET 后端，TypeORM 最亲切；如果你是 TS 原教旨主义者，可能更喜欢 Drizzle。

一句话：**TypeORM 把数据库表映射成 class，让你用面向对象的方式（继承、Repository）操作数据——Node 企业级后端的经典选择。**

## 二、Active Record vs DataMapper：两种模式

TypeORM 同时支持两种数据访问模式，这是它区别于 Prisma/Drizzle 的特色：

### Active Record（简单）

实体继承 `BaseEntity`，自带静态方法和实例方法：

```ts
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string
}

// 用法：静态方法 + 实例方法
const user = new User()
user.name = 'Alice'
await user.save()              // 实例方法：保存

const users = await User.find({ where: { name: 'Alice' } })   // 静态方法：查询
await User.delete({ id: 1 })
```

- **优点**：简单直接，不用注入 Repository，小脚本/原型快。
- **缺点**：数据访问逻辑散落在实体里，**难测试**（无法 mock）、难复用、实体类臃肿。

### DataMapper（推荐，企业级）

通过 `Repository` 操作，实体是纯数据结构：

```ts
import { DataSource, Repository } from 'typeorm'
import { User } from './user.entity'

const dataSource = new DataSource({...})
await dataSource.initialize()

const userRepo = dataSource.getRepository(User)
const user = userRepo.create({ name: 'Alice' })
await userRepo.save(user)

const users = await userRepo.find({ where: { name: 'Alice' } })
```

- **优点**：**Repository 隔离数据访问**，可注入、可 mock、可测试——NestJS 标准姿势。
- **缺点**：多一层，要管理 Repository 依赖注入。

| 维度 | Active Record | DataMapper |
| --- | --- | --- |
| 操作入口 | 实体静态/实例方法 | Repository 实例方法 |
| 实体职责 | 数据 + 行为（save/find） | 纯数据结构 |
| 可测试性 | 弱（难 mock） | 强（注入 Repository） |
| 适合 | 小项目/脚本 | 中大型项目/NestJS |
| 学习成本 | 低 | 中 |

## 三、TypeORM 1.0（2026.6）：沉寂数年后的复兴

TypeORM 在 0.3.x 之后沉寂数年（2022-2025 期间维护缓慢、issue 堆积），社区一度转向 Prisma/Drizzle。**2026 年 6 月发布的 1.0** 是一次社区接管的复兴：

| 维度 | 0.3.x（旧） | 1.0（2026 复兴） |
| --- | --- | --- |
| 模块系统 | CommonJS（`require`） | **ESM 优先**（原生 `import`） |
| 驱动 | mysql/pg（旧） | **mysql2/pg-native**（现代驱动） |
| 连接入口 | `createConnection`（Promise） | **`new DataSource()` + `.initialize()`** |
| 装饰器类型 | 类型推断弱 | **类型推断增强**（字段类型严格） |
| NestJS 对齐 | NestJS 10 | **NestJS 11 深度对齐** |
| 维护 | 缓慢 | **社区接管，活跃** |

- **`DataSource` 替代 `Connection`**：1.0 推荐用 `new DataSource(config)` 同步构造 + `.initialize()` 异步连接，比 0.x 的 `createConnection()` 更清晰（构造与连接分离）。
- **ESM**：1.0 原生支持 ES Modules，`emitDecoratorMetadata`/`experimentalDecorators` 配合现代 TS 配置，与 Vite/tsx 等工具链更顺。
- **驱动升级**：MySQL 用 mysql2、Postgres 用 pg/pg-native，性能与特性（如 PG 的 prepared statements）更好。

## 四、工作流：实体 → 迁移 → 查询

```
写实体 class（@Entity + @Column + @关系）
   │
   ▼
typeorm migration:generate -d datasource   ← 对比实体与库差异生成迁移
   │
   ▼
typeorm migration:run                       ← 应用迁移到数据库
   │
   ▼
dataSource.initialize() + Repository 查询    ← DataMapper 操作
```

- **`migration:generate`**：对比实体定义和数据库现状，自动生成迁移文件（如加表/加列）。改实体后跑，生成 SQL 迁移。
- **`migration:run` / `migration:revert`**：应用/回滚迁移，迁移记录在 `migrations` 表里。
- **`synchronize: true`（开发期）**：自动把实体同步到库（每次启动改表），**生产环境必须关闭**（会丢数据）。

## 五、与其他 ORM 的定位差异

| 维度 | TypeORM | Prisma | Drizzle ORM |
| --- | --- | --- | --- |
| 范式 | OOP（Active Record/DataMapper） | Schema-first + 代码生成 | SQL-faithful（代码即 schema） |
| schema 语言 | TS 装饰器（`@Entity`） | `.prisma` DSL | TS 代码（`pgTable`） |
| 类型来源 | 手写实体类 + 装饰器推断 | 生成式推断 | 原生 TS |
| 复杂查询 | QueryBuilder（强） | 受限（回落 raw） | 原生 SQL（最强） |
| NestJS 集成 | **默认** | 第三方 | 第三方 |
| 边缘运行时 | 弱 | Prisma 7 起支持 | 最佳 |
| 学习曲线 | 学装饰器+两种模式 | 学 DSL | 会 SQL 即可 |

详见各自的叶：[Prisma](../prisma/)、[Drizzle ORM](../drizzle/)。

## 下一步

理解了 TypeORM 的定位与两种模式后，下一步深入——[实体与两种模式详解](./guide-line/entities-and-patterns)（装饰器语法、Active Record vs DataMapper、关系声明）与[迁移、NestJS 集成与 QueryBuilder](./guide-line/migrations-and-nestjs)（迁移全流程、NestJS 标准集成、QueryBuilder 复杂查询）。
