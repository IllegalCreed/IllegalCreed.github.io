---
layout: doc
---

# TypeORM

**TypeORM** 是 **Node.js 上最经典的 OOP 风格 ORM**——用 TypeScript **装饰器**（`@Entity`/`@Column`/`@PrimaryGeneratedColumn`）把 class 映射成数据库表，受 Java Hibernate / .NET Entity Framework 启发，世界观与面向对象的继承、Repository 模式一致。它是 **NestJS 的默认 ORM**，长期垄断 Node 企业级后端，是 Java/.NET 转 Node 开发者最熟悉的 ORM。TypeORM 同时支持 **Active Record**（实体自带 save/find）和 **DataMapper**（通过 Repository 隔离）两种模式——前者简单适合小项目，后者可测试性强适合中大型项目。

**TypeORM 1.0（2026 年 6 月发布）** 是沉寂数年后的复兴——社区接管重启：现代化重构（ESM 优先、移除遗留 `require`）、升级驱动（mysql2/pg-native）、连接入口从 `createConnection` 改为 `new DataSource()` + `.initialize()`、装饰器类型推断增强、与 NestJS 11 深度对齐。本叶覆盖 ORM 本身：装饰器实体（`@Entity`/`@Column`/关系装饰器）、Active Record vs DataMapper 两种模式的取舍、迁移全流程（generate/run/revert）、NestJS 标准集成（forRoot/forFeature/InjectRepository）、QueryBuilder 复杂查询。注意边界：NestJS 专属最佳实践归 NestJS 叶，本叶讲 TypeORM 作为通用 ORM 的工程用法。

## 评价

**优点**

- **OOP 亲切**：装饰器实体 + Repository 模式，Java/.NET 背景开发者上手快，与 NestJS 依赖注入天然契合
- **两种模式**：Active Record（简单）+ DataMapper（可测试），按场景灵活选择
- **QueryBuilder 强大**：链式构建复杂查询（多表 join/子查询/聚合/分页），参数绑定防注入，表达力强
- **NestJS 默认**：`@nestjs/typeorm` 官方集成，forRoot/forFeature/InjectRepository 一条龙
- **关系映射完整**：一对一/一对多/多对多 + 级联（cascade）+ 懒加载（lazy）都支持

**缺点**

- **装饰器配置繁琐**：要开 `emitDecoratorMetadata`/`experimentalDecorators`，与原生 ESM/新 TS 配置时有摩擦
- **类型推断不如生成式**：手写实体类，类型靠开发者维护，不像 Prisma 自动推断；装饰器元数据偶有不精确
- **历史包袱**：0.x 时代遗留 API（Connection/EntityManager 混用）、issue 堆积，1.0 才系统清理
- **边缘运行时弱**：依赖装饰器元数据和反射，在 Cloudflare Workers 等受限环境支持差
- **N+1 与懒加载陷阱**：lazy 关系触发隐式查询易 N+1；find 的 relations 选项用错也 N+1

## 本叶地图

- [入门](./getting-started) —— TypeORM 是什么、Active Record vs DataMapper、TypeORM 1.0 复兴、工作流、与其他 ORM 的定位差异
- [实体与两种模式详解](./guide-line/entities-and-patterns) —— 装饰器实体（@Entity/@Column/关系）、Active Record vs DataMapper 取舍、关系映射、级联与懒加载
- [迁移、NestJS 集成与 QueryBuilder](./guide-line/migrations-and-nestjs) —— 迁移全流程、NestJS 标准集成、QueryBuilder 复杂查询
- [参考](./reference) —— 装饰器速查、Repository API、QueryBuilder 模式、易错点、与 Prisma/Drizzle 对比

## 幻灯片地址

<a href="/SlideStack/typeorm-slide/" target="_blank">TypeORM</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=TypeORM" target="_blank" rel="noopener noreferrer">TypeORM 测试题</a>
