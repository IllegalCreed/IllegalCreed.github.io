---
layout: doc
outline: [2, 3]
---

# 参考：TypeORM 装饰器、Repository、QueryBuilder 速查

> 基于 TypeORM 1.0（2026 复兴版） · 核于 2026-08

## 速查

- **TypeORM 是什么**：OOP 风格的装饰器 ORM；`@Entity` class = 表，两种模式 Active Record / DataMapper。
- **TypeORM 1.0（2026.6）**：社区接管复兴——ESM、mysql2/pg-native、`new DataSource()` 替代 `createConnection`、NestJS 11 对齐。
- **两种模式**：Active Record（继承 BaseEntity，难测试）/ DataMapper（Repository，推荐）。
- **关系**：`@OneToMany`（反向，不建列）/`@ManyToOne`（持有外键 + `@JoinColumn`）/`@OneToOne`/`@ManyToMany`（`@JoinTable` 建中间表）。
- **迁移**：`migration:generate`（生成）/`run`/`revert`；synchronize 生产必须 false。
- **NestJS**：`forRoot`（连接）+ `forFeature([Entity])`（注册）+ `@InjectRepository`（注入）。
- **QueryBuilder**：复杂查询首选；参数绑定（`:name` + params）防注入。

## 一、装饰器速查

### 类/表

| 装饰器 | 作用 |
| --- | --- |
| `@Entity({ name })` | 标记 class 为表，name 指定表名 |
| `@Entity({ schema, database })` | 跨 schema/database |

### 主键

| 装饰器 | 作用 |
| --- | --- |
| `@PrimaryGeneratedColumn()` | 自增整数主键 |
| `@PrimaryGeneratedColumn('uuid')` | UUID 主键 |
| `@PrimaryGeneratedColumn('identity', { generatedIdentity })` | Postgres generated identity |
| `@PrimaryColumn()` | 手动主键 |

### 列

| 装饰器 | 作用 |
| --- | --- |
| `@Column({ type, length, nullable, default, unique, name })` | 普通列 |
| `@CreateDateColumn()` | 插入时自动当前时间 |
| `@UpdateDateColumn()` | 更新时自动当前时间 |
| `@DeleteDateColumn()` | 软删除（deletedAt） |
| `@VersionColumn()` | 乐观锁版本号 |

### 关系

| 装饰器 | 作用 |
| --- | --- |
| `@OneToOne(() => X, x => x.y)` | 一对一 |
| `@OneToMany(() => X, x => x.y)` | 一对多（反向，不建列） |
| `@ManyToOne(() => X, x => y)` | 多对一（持有外键） |
| `@ManyToMany(() => X, x => x.y)` | 多对多 |
| `@JoinColumn({ name })` | 声明外键列（在持有外键一侧） |
| `@JoinTable()` | 声明中间表（多对多其中一侧） |
| `{ eager: true }` | 每次 find 自动带关联 |
| `{ cascade: true }` | save 时级联保存关联 |
| `{ lazy: true }` | 访问时才查（易 N+1，慎用） |
| `{ onDelete: 'CASCADE' }` | 外键级联删除 |

## 二、Repository API（DataMapper）

```ts
const repo = dataSource.getRepository(User)
// 或 NestJS: @InjectRepository(User) private repo: Repository<User>

// 创建（实例化不入库）
const u = repo.create({ name: 'Alice', email: 'a@b.com' })

// 保存（插入或更新）
await repo.save(u)
await repo.save([u1, u2])                    // 批量

// 查询
const all = await repo.find()
const one = await repo.findOne({ where: { id: 1 } })
const list = await repo.find({
  where: { role: 'ADMIN', age: Raw((a) => `${a} > 18`) },
  relations: { posts: true },
  order: { createdAt: 'DESC' },
  take: 20, skip: 0,
  select: { id: true, email: true },
  withDeleted: false,                        // 含软删除的？
})

// 简化查
await repo.findBy({ name: 'Alice' })         // 仅 where
await repo.findOneBy({ email: 'a@b.com' })
await repo.findOneOrFail({ where: { id: 1 } })   // 找不到抛错

// 更新/删除（不加载实体，直接 SQL）
await repo.update({ role: 'USER' }, { active: false })
await repo.delete({ id: 1 })
await repo.softDelete({ id: 1 })             // 软删除
await repo.restore({ id: 1 })                // 恢复软删除

// 计数
await repo.count({ where: { active: true } })

// 批量插入（高性能）
await repo.insert([{ name: 'a' }, { name: 'b' }])

// QueryBuilder
await repo.createQueryBuilder('u').where('u.id = :id', { id: 1 }).getOne()
```

## 三、Active Record API

```ts
class User extends BaseEntity {
  @PrimaryGeneratedColumn() id: number
  @Column() name: string
}

// 静态方法
await User.find()
await User.findOne({ where: { id: 1 } })
await User.findBy({ name: 'Alice' })
await User.count({ where: { active: true } })
await User.delete({ id: 1 })
await User.update({ role: 'USER' }, { active: false })
await User.insert([{ name: 'a' }])

// 实例方法
const u = new User()
u.name = 'Bob'
await u.save()
await u.remove()
await u.reload()
```

## 四、QueryBuilder 模式

```ts
// 链式
await repo
  .createQueryBuilder('u')                  // 别名 u
  .select(['u.id', 'u.email'])
  .addSelect('COUNT(p.id)', 'postCount')
  .leftJoin('u.posts', 'p')
  .where('u.role = :role', { role: 'ADMIN' })
  .andWhere('u.age > :age', { age: 18 })
  .groupBy('u.id')
  .having('COUNT(p.id) > :n', { n: 5 })
  .orderBy('u.name', 'ASC')
  .take(20).skip(0)
  .getRawMany()                              // 或 getMany() / getOne() / getCount()

// 子查询
.where((qb) => {
  const sub = qb.subQuery().select('p.authorId').from(Post, 'p').getQuery()
  return 'u.id IN ' + sub
})

// 参数绑定（防注入，必须用）
.where('u.email = :email', { email: userInput })
```

## 五、CLI 命令速查

| 命令 | 用途 |
| --- | --- |
| `typeorm init` | 初始化项目 |
| `typeorm migration:generate -d <ds> <Name>` | 对比实体生成迁移 |
| `typeorm migration:create <Name>` | 建空迁移（手写） |
| `typeorm migration:run -d <ds>` | 应用迁移 |
| `typeorm migration:revert -d <ds>` | 回滚最近迁移 |
| `typeorm migration:show -d <ds>` | 查看迁移状态 |
| `typeorm entity:create -d <dir> <Name>` | 生成实体骨架 |
| `typeorm schema:drop -d <ds>` | 删所有表 |
| `typeorm schema:sync -d <ds>` | 同步实体到库（生产慎用） |

`<ds>` 是 DataSource 实例文件路径（如 `dist/data-source.js`）。

## 六、三大 ORM 对比

| 维度 | TypeORM | Prisma | Drizzle ORM |
| --- | --- | --- | --- |
| 范式 | OOP（Active Record/DataMapper） | Schema-first + 代码生成 | SQL-faithful（代码即 schema） |
| schema 语言 | TS 装饰器 `@Entity` | `.prisma` DSL | TS 代码 `pgTable` |
| 类型来源 | 手写实体类+装饰器推断 | 生成式推断 | 原生 TS |
| 复杂查询 | **QueryBuilder（强）** | 受限（回落 raw） | 原生 SQL（最强） |
| NestJS 集成 | **默认** | 第三方 | 第三方 |
| 边缘运行时 | 弱 | Prisma 7 起支持 | 最佳 |
| 托管服务 | 无 | Accelerate/Postgres | 无 |
| 典型场景 | NestJS、OOP 习惯 | 类型安全、schema 即文档 | 控 SQL、轻量、边缘 |

## 七、易错点清单

- **"生产开 synchronize: true"**：错。生产必须 false，synchronize 改 schema 可能丢数据，用迁移。
- **"Active Record 用于中大型项目"**：不推荐。Active Record 难测试，中大型项目用 DataMapper（Repository）。
- **"QueryBuilder 字符串拼接 SQL"**：危险，SQL 注入。用 `:param` 占位符 + params 对象参数绑定。
- **"lazy 关系随便用"**：慎用。lazy 在循环访问时触发 N+1。生产用 `relations` 或 `leftJoinAndSelect` 显式 join。
- **"eager 关系没代价"**：eager 每次 find 带关联，可能查大量数据。按需用 `relations`。
- **"1.0 还用 createConnection"**：TypeORM 1.0 推荐用 `new DataSource()` + `.initialize()`。
- **"TypeORM 类型推断像 Prisma 一样自动"**：不。TypeORM 类型靠手写实体类维护，装饰器元数据偶有不精确。
- **"NestJS 用 forRoot 就够了"**：还要 `forFeature([Entity])` 注册实体的 Repository，才能 `@InjectRepository`。
- **"find 的 relations 不会 N+1"**：正确用法不会（一次 join）；但循环访问 lazy 才 N+1。误用 find+循环则 N+1。
- **"cascade: true 总是好"**：慎用。级联 save 误传关联可能误删/误更新，确认业务语义再开。

## 八、进阶方向（链接其他叶）

- [Prisma](../prisma/) —— Schema-first + 代码生成的类型安全 ORM
- [Drizzle ORM](../drizzle/) —— TypeScript-first、SQL-faithful、边缘运行时友好
- NestJS Best Practices —— NestJS 框架最佳实践（含 TypeORM 集成）

## 权威链接

- [TypeORM 官方文档](https://typeorm.io)
- [TypeORM 1.0 升级说明](https://typeorm.io/changelog)
- [TypeORM Entities](https://typeorm.io/entities)
- [TypeORM QueryBuilder](https://typeorm.io/select-query-builder)
- [@nestjs/typeorm](https://docs.nestjs.com/techniques/database)
- 本站幻灯片：<a href="/SlideStack/typeorm-slide/" target="_blank">TypeORM</a>
