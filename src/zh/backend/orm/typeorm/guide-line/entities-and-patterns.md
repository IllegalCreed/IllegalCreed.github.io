---
layout: doc
outline: [2, 3]
---

# 实体与两种模式：装饰器、Active Record vs DataMapper、关系

> 基于 TypeORM 1.0（2026 复兴版） · 核于 2026-08

## 速查

- **实体（Entity）**：`@Entity()` 装饰的 class = 一张表；`@Column` = 列；`@PrimaryGeneratedColumn` = 自增主键；`@CreateDateColumn`/`@UpdateDateColumn` = 自动时间。
- **列类型**：`@Column({ type: 'varchar', length: 100, nullable: true, default: 'x' })`——type 映射到 SQL 类型；不写 type 时按 TS 属性类型推断（string→varchar）。
- **关系装饰器**：`@OneToOne`/`@OneToMany`/`@ManyToOne`/`@ManyToMany`——参数是返回关系实体的函数 `() => User`，配合 `@JoinColumn`/`@JoinTable` 声明外键列/中间表。
- **关系两端**：一对多里 `@ManyToOne` 一侧持有外键（`@JoinColumn`），`@OneToMany` 一侧是反向（`posts: Post[]`，不建列）。TypeORM 自动维护外键。
- **Active Record**：实体继承 `BaseEntity`，用 `user.save()`/`User.find()` 直接操作。简单但难测试。
- **DataMapper（推荐）**：用 `Repository<Entity>` 操作（`repo.find()/save()`），可注入可 mock，NestJS 标准姿势。
- **级联（cascade）**：`@OneToMany(() => Post, p => p.author, { cascade: true })`——保存父对象时自动保存/更新关联子对象。
- **懒加载（lazy）**：`@OneToMany(() => Post, p => p.author, { lazy: true })` + `Promise<Post[]>`——访问时才查关联，但**易触发 N+1**，生产慎用。
- **eager vs lazy**：`{ eager: true }` 每次 find 自动带出关联（谨慎，可能查大量数据）；`lazy: true` 按需查；都不设则要 `relations: { posts: true }` 显式指定。

## 一、装饰器实体：用 class 描述表

一个完整的实体：

```ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn,
} from 'typeorm'

@Entity({ name: 'users' })            // 表名 users（不写默认取类名小写）
export class User {
  @PrimaryGeneratedColumn()            // 自增主键（'uuid' 可换成 UUID）
  id: number

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string

  @Column({ nullable: true })          // 可空
  name: string | null

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role

  @CreateDateColumn()                  // 插入时自动设当前时间
  createdAt: Date

  @UpdateDateColumn()                  // 更新时自动设当前时间
  updatedAt: Date

  @OneToMany(() => Post, (post) => post.author)   // 反向关系（不建列）
  posts: Post[]
}

export enum Role { USER = 'USER', ADMIN = 'ADMIN' }
```

### 常用列装饰器

| 装饰器 | 作用 |
| --- | --- |
| `@PrimaryGeneratedColumn()` | 自增整数主键 |
| `@PrimaryGeneratedColumn('uuid')` | UUID 主键 |
| `@PrimaryColumn()` | 手动赋值的主键 |
| `@Column({ type, length, nullable, default, unique })` | 普通列 |
| `@CreateDateColumn()` | 插入时自动当前时间 |
| `@UpdateDateColumn()` | 更新时自动当前时间 |
| `@DeleteDateColumn()` | 软删除（设 deletedAt，find 自动过滤） |
| `@VersionColumn()` | 乐观锁版本号 |

### 列类型映射

`@Column({ type: 'varchar' })` 的 type 决定 SQL 类型（与具体数据库方言有关）。常见：`varchar`/`text`/`int`/`bigint`/`boolean`/`datetime`/`timestamp`/`json`/`jsonb`/`decimal`/`enum`/`uuid`/`bytea`。不写 type 时按 TS 属性类型推断（`string`→`varchar`、`number`→`int`、`boolean`→`boolean`、`Date`→`datetime`）。

## 二、Active Record 模式

实体继承 `BaseEntity`，获得静态方法和实例方法：

```ts
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn() id: number
  @Column() name: string
  @Column({ unique: true }) email: string
}

// 静态方法（类上调用）
const all = await User.find()
const alice = await User.findOne({ where: { email: 'a@b.com' } })
const admins = await User.find({ where: { role: 'ADMIN' }, take: 10 })
await User.delete({ id: 1 })

// 实例方法（实例上调用）
const u = new User()
u.name = 'Bob'
u.email = 'b@c.com'
await u.save()                // 插入或更新
await u.remove()              // 删除
```

- **优点**：写法简单直接，不用注入 Repository，适合脚本/小项目/快速原型。
- **缺点**：数据访问逻辑混在实体里，**难单元测试**（无法 mock 静态方法），实体类越来越臃肿（数据+行为+持久化）。

## 三、DataMapper 模式（推荐）

通过 `Repository` 操作，实体是纯数据结构：

```ts
import { DataSource, Repository } from 'typeorm'
import { User } from './user.entity'

const dataSource = new DataSource({
  type: 'postgres', host: 'localhost', port: 5432,
  username: 'u', password: 'p', database: 'db',
  entities: [User],            // 注册实体
  synchronize: false,          // 生产必须 false
})
await dataSource.initialize()

const userRepo: Repository<User> = dataSource.getRepository(User)

// 创建
const user = userRepo.create({ name: 'Alice', email: 'a@b.com' })
await userRepo.save(user)

// 查询
const found = await userRepo.findOne({ where: { id: 1 } })
const list = await userRepo.find({
  where: { name: 'Alice' },
  relations: { posts: true },       // 带出关联
  order: { createdAt: 'DESC' },
  take: 20, skip: 0,
  select: { id: true, email: true },   // 选字段
})

await userRepo.delete({ id: 1 })
```

- **优点**：**Repository 隔离数据访问**，可注入（NestJS `@InjectRepository(User)`）、可 mock（单测替换成假 Repository）、实体类保持纯净（只描述数据）。
- **缺点**：多一层依赖管理，要管 Repository 的获取和注入。

### Repository 常用方法

| 方法 | 作用 |
| --- | --- |
| `repo.create(props)` | 实例化（不入库），返回实体 |
| `repo.save(entity)` | 插入或更新（有 id 则 update） |
| `repo.find(conditions)` | 查多条 |
| `repo.findOne({ where })` | 查一条 |
| `repo.findBy({ name })` | 简化查多条（仅 where） |
| `repo.update(criteria, partial)` | 批量更新（不加载实体） |
| `repo.delete(criteria)` | 删 |
| `repo.count({ where })` | 计数 |
| `repo.createQueryBuilder(alias)` | 进 QueryBuilder |

## 四、关系映射：四种关系

### 一对多 / 多对一（最常见）

```ts
@Entity()
export class User {
  @PrimaryGeneratedColumn() id: number

  @OneToMany(() => Post, (post) => post.author)   // 反向：不建列
  posts: Post[]
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn() id: number

  @ManyToOne(() => User, (user) => user.posts)     // 持有外键
  @JoinColumn({ name: 'author_id' })               // 外键列名
  author: User
}
```

- **`@ManyToOne` 一侧持有外键**：TypeORM 在 posts 表建 `author_id` 列。
- **`@OneToMany` 一侧是反向**：只是导航（`user.posts`），不建列。
- 两端通过参数 `(post) => post.author` 和 `(user) => user.posts` 互相引用。

### 一对一

```ts
@Entity()
export class User {
  @OneToOne(() => Profile, (p) => p.user)
  @JoinColumn()                    // 在 user 表建外键 profile_id
  profile: Profile
}
```

### 多对多

```ts
@Entity()
export class Post {
  @ManyToMany(() => Tag, (t) => t.posts)
  @JoinTable()                     // 在 post 一侧建中间表 post_tags
  tags: Tag[]
}
```

`@JoinTable` 在其中一侧声明（建中间表），另一侧只写反向 `@ManyToMany`。

## 五、级联与懒加载

### 级联（cascade）

```ts
@OneToMany(() => Post, (p) => p.author, { cascade: true })
posts: Post[]

// 保存 user 时，关联的 posts 一起保存
await userRepo.save({
  name: 'Alice',
  posts: [{ title: 'Hello' }, { title: 'World' }],
})
```

`cascade: true` 让 save/update 自动传播到关联对象——一次调用建好主+关联。慎用（误删关联）。

### 懒加载（lazy）

```ts
@OneToMany(() => Post, (p) => p.author)
posts: Promise<Post[]>          // 类型是 Promise

// 访问时才查
const user = await userRepo.findOne({ where: { id: 1 } })
const posts = await user.posts   // 此刻才查 posts
```

- 懒加载用 `Promise` 类型 + 代理（需开 `reflect-metadata`），访问属性时才查。
- **易触发 N+1**：循环里访问 `user.posts` 每次一条查询。生产建议用 `relations: { posts: true }` 显式 join，关掉 lazy。

### eager vs 显式 relations

- `eager: true`：每次 find 自动带关联——方便但可能查大量数据。
- 显式 `relations: { posts: true }`：按需带出（推荐，可控）。
- lazy：访问时查——慎用。

## 下一步

实体与模式讲完后，下一步——[迁移、NestJS 集成与 QueryBuilder](./migrations-and-nestjs)（迁移全流程、NestJS 标准集成、QueryBuilder 复杂查询）。
