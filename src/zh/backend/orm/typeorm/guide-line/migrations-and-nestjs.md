---
layout: doc
outline: [2, 3]
---

# 迁移、NestJS 集成与 QueryBuilder

> 基于 TypeORM 1.0（2026 复兴版） · 核于 2026-08

## 速查

- **DataSource（1.0 入口）**：`new DataSource({...})` 同步构造 + `.initialize()` 异步连接（替代 0.x 的 `createConnection`）。配置含 type/host/entities/migrations/synchronize 等。
- **迁移命令**：`migration:generate`（对比实体与库差异生成迁移）、`migration:create`（空迁移手写）、`migration:run`（应用）、`migration:revert`（回滚）。
- **迁移类**：`implements MigrationInterface`，有 `up(queryRunner)` 和 `down(queryRunner)`，用 `queryRunner.query(sql)` 或 `createTable`/`dropTable` 等schema 构建器方法。
- **synchronize**：开发期可设 `true`（自动同步实体到库），**生产必须 false**（会破坏数据）。
- **NestJS 集成三件套**：①`TypeOrmModule.forRoot(config)`（全局连接）；②`TypeOrmModule.forFeature([User])`（模块注册实体）；③`@InjectRepository(User) repo`（注入 Repository）。
- **QueryBuilder**：`repo.createQueryBuilder('u')` 链式构建——`select`/`addSelect`/`where`/`andWhere`/`orWhere`/`orderBy`/`groupBy`/`leftJoin`/`leftJoinAndSelect`/`take`/`skip`，最后 `.getMany()`/`getOne()`/`getRawMany()`。
- **参数绑定防注入**：`.where('u.age > :age', { age: 18 })` 用 `:name` 占位符 + 参数对象，自动转义——绝不字符串拼接 SQL。
- **复杂查询首选 QueryBuilder**：多表 join、子查询、聚合（count/sum）、分组、条件分支，find 方法表达不了时上 QueryBuilder。

## 一、DataSource：连接入口（TypeORM 1.0）

TypeORM 1.0 推荐用 `DataSource` 替代 0.x 的 `createConnection`：

```ts
// data-source.ts
import { DataSource } from 'typeorm'
import { User } from './user.entity'
import { Post } from './post.entity'

export const AppDataSource = new DataSource({
  type: 'postgres',                  // postgres/mysql/mariadb/sqlite/...
  host: 'localhost',
  port: 5432,
  username: 'u',
  password: 'p',
  database: 'app',
  entities: [User, Post],            // 注册所有实体（或用 entities: ['dist/**/*.entity.js']）
  migrations: ['dist/migrations/*.js'],
  synchronize: false,                // 生产必须 false；开发可 true 但仅本地
  logging: ['query', 'error'],       // 打印 SQL（调试用）
})

// 初始化（异步）
await AppDataSource.initialize()
```

- **构造与连接分离**：`new DataSource(config)` 是同步的（可立即 export），`.initialize()` 是异步的（真正连库）。这让 DataSource 可在模块顶层 export，运行时再 initialize。
- **`synchronize`**：`true` 时每次启动把实体同步到库（自动建表/加列）。**开发便利但生产危险**（改字段可能丢数据），生产**必须 false**，用迁移管理 schema。
- **logging**：`['query']` 打印每条 SQL，调试 N+1/看索引用。

## 二、迁移全流程

### 1. 生成迁移（对比实体）

```bash
# 对比实体定义与数据库现状，生成迁移文件
typeorm migration:generate -d dist/data-source.js src/migrations/AddUserAge
# 产物：src/migrations/1700000000000-AddUserAge.ts
```

`migration:generate` 要 `entities` 与数据库连接都就绪——它读实体定义、连库查现状、生成差异 SQL。

### 2. 迁移类结构

```ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserAge1700000000000 implements MigrationInterface {
  // 应用迁移
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" varchar(100) NOT NULL, CONSTRAINT "PK_users" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`ALTER TABLE "users" ADD "age" integer`)
  }

  // 回滚迁移
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "age"`)
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
```

### 3. 应用与回滚

```bash
typeorm migration:run -d dist/data-source.js     # 应用所有未应用的迁移
typeorm migration:revert -d dist/data-source.js   # 回滚最近一个迁移
typeorm migration:show -d dist/data-source.js     # 查看迁移状态
```

迁移记录存在 `migrations` 表（自动建），记录已应用的迁移。`run` 跳过已应用，`revert` 回滚最后一个。

### 4. synchronize 的位置

| 场景 | synchronize |
| --- | --- |
| 本地开发库试验 | 可 `true`（方便） |
| 生产环境 | **必须 false**（用迁移） |
| 测试库 | 通常 `false`，用迁移或 drop + sync |

## 三、NestJS 集成：标准姿势

NestJS 通过 `@nestjs/typeorm` 集成 TypeORM：

### 1. 全局连接 forRoot

```ts
// app.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Post],
      synchronize: false,
      migrations: ['dist/migrations/*.js'],
    }),
  ],
})
export class AppModule {}
```

`forRoot` 建立 DataSource 并 `.initialize()`，全应用共享一个连接。

### 2. 模块注册实体 forFeature

```ts
// user.module.ts
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './user.entity'
import { UserService } from './user.service'

@Module({
  imports: [TypeOrmModule.forFeature([User])],     // 注册 User 实体的 Repository
  providers: [UserService],
})
export class UserModule {}
```

`forFeature([User])` 在该模块的依赖注入容器里注册 `Repository<User>`，模块内的 provider 可注入。

### 3. 注入 Repository

```ts
// user.service.ts
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  findAll() {
    return this.userRepo.find()
  }

  async create(dto: { name: string; email: string }) {
    const u = this.userRepo.create(dto)
    return this.userRepo.save(u)
  }
}
```

`@InjectRepository(User)` 注入对应实体的 Repository——这是 NestJS + TypeORM 的**标准数据访问姿势**，可测试性强（单测可 mock Repository）。

## 四、QueryBuilder：复杂查询

`find` 方法适合简单条件查询，复杂查询（多表 join/子查询/聚合/动态条件）用 QueryBuilder：

```ts
// 基础：查年龄大于 18 的用户，按名字排序，分页
const users = await userRepo
  .createQueryBuilder('u')                       // u 是别名
  .where('u.age > :age', { age: 18 })            // 参数绑定（防注入）
  .andWhere('u.role = :role', { role: 'ADMIN' })
  .orderBy('u.name', 'ASC')
  .take(20)                                       // LIMIT 20
  .skip(0)                                        // OFFSET 0
  .getMany()                                      // 返回实体数组

// 关联查询：带出文章（LEFT JOIN + SELECT）
const usersWithPosts = await userRepo
  .createQueryBuilder('u')
  .leftJoinAndSelect('u.posts', 'p')              // LEFT JOIN posts 并 SELECT
  .where('u.id = :id', { id: 1 })
  .getOne()

// 聚合：统计每个角色的用户数
const stats = await userRepo
  .createQueryBuilder('u')
  .select('u.role', 'role')
  .addSelect('COUNT(*)', 'count')
  .groupBy('u.role')
  .getRawMany()                                   // 返回原始行 { role, count }

// 子查询：查有文章的用户
const authors = await userRepo
  .createQueryBuilder('u')
  .where((qb) => {
    const sub = qb
      .subQuery()
      .select('p.authorId')
      .from(Post, 'p')
      .getQuery()
    return 'u.id IN ' + sub
  })
  .getMany()
```

### QueryBuilder 方法

| 方法 | 作用 |
| --- | --- |
| `select(field, alias)` / `addSelect` | 选字段 |
| `where(cond, params)` / `andWhere` / `orWhere` | 条件（AND/OR） |
| `orderBy(field, dir)` / `addOrderBy` | 排序 |
| `groupBy(field)` / `addGroupBy` | 分组 |
| `having(cond, params)` | 分组后过滤 |
| `leftJoin(field, alias)` | LEFT JOIN（不带出） |
| `leftJoinAndSelect(field, alias)` | LEFT JOIN 并带出关联 |
| `innerJoinAndSelect` | INNER JOIN 并带出 |
| `take(n)` / `skip(n)` | 分页（LIMIT/OFFSET） |
| `getMany()` / `getOne()` | 返回实体 |
| `getRawMany()` / `getRawOne()` | 返回原始行（聚合/部分字段） |
| `getCount()` | 返回 COUNT |

### 参数绑定（防注入）

```ts
// 正确：用 :name 占位符 + params 对象
.where('u.email = :email', { email: userInput })     // 自动转义

// 错误：字符串拼接（SQL 注入风险）
.where(`u.email = '${userInput}'`)                   // 危险！
```

**永远用参数绑定**，绝不字符串拼接用户输入到 SQL——这是 SQL 注入的根源。

## 五、N+1 与性能陷阱

- **lazy 关系 N+1**：循环访问 `user.posts`（lazy）每次查一次。改用 `relations: { posts: true }` 或 `leftJoinAndSelect`。
- **find 的 relations 误用**：`find()` 查 N 条后逐个查关联。要用 `relations` 一次 join。
- **避免 SELECT ***：用 `select` 选字段，减少传输。
- **索引**：where/orderBy 的字段要建索引；QueryBuilder 生成的 SQL 同样要靠索引。

## 下一步

掌握了 QueryBuilder 后，可对照 [Prisma](../../prisma/) 与 [Drizzle ORM](../../drizzle/) 看 ORM 三大范式取舍，或在 [参考](../reference) 速查装饰器与 API。
