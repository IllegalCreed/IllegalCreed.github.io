---
layout: doc
outline: [2, 3]
---

# DTO 模式：请求/响应形状、序列化与转换

> 基于 NestJS · class-validator · Zod · 核于 2026-08

## 速查

- **请求 DTO vs 响应 DTO 分离**：永远不要用一个 DTO 同时描述请求和响应——请求要校验（`@IsEmail`），响应要控暴露（不含 passwordHash），职责不同。常见命名：`CreateUserDTO`（请求）、`UserResponseDTO`（响应）。
- **字段暴露控制**：响应 DTO 只声明客户端该看的字段，敏感字段（passwordHash/internalFlag/deletedAt）不进 DTO，序列化时天然不输出——这是「白名单」策略。
- **序列化策略**：①白名单（DTO 只列要暴露的，最安全）②黑名单（实体标 `@Exclude()`，易漏）③分组（`@Expose({ groups: ['public'] })`，按场景分组暴露）。**优先白名单。**
- **实体 ↔ DTO 转换**：手写 `toResponseDTO(entity)` 映射函数（显式可控），或用 mapper 库（automapper）自动映射（省样板但加间接）。小项目手写，大项目考虑 mapper。
- **嵌套 DTO**：响应含子资源时用嵌套 DTO（`UserResponseDTO { posts: PostResponseDTO[] }`），每个子资源也走白名单，避免深层泄露。
- **分页 DTO 标准化**：列表接口统一分页形状（`{ items, total, page, pageSize }`），客户端通用处理。
- **不可变 DTO**：响应 DTO 字段用 `readonly`，防止业务代码意外修改序列化结果。
- **进阶顺序**：本文 → [校验模式对比](./validation-comparison) → [参考](../reference)。

## 一、请求 DTO 与响应 DTO 分离

最常见的设计错误是用一个 DTO 既描述请求又描述响应。正确做法是**按职责分离**：

```ts
// 请求 DTO：重在「校验」（输入约束）
class CreateUserRequestDTO {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsString()
  @MaxLength(50)
  name: string;
  // 不含 id/createdAt —— 这些是服务端生成，不由客户端传
}

// 响应 DTO：重在「暴露控制」（只吐该吐的）
class UserResponseDTO {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  // 不含 passwordHash / internalFlag / deletedAt —— 白名单隔离
}
```

- **请求 DTO 关注校验**：每个字段挂校验规则（格式/长度/范围），非法输入在入口被拒。
- **响应 DTO 关注暴露**：只声明客户端该看的字段，敏感字段天然不输出。
- **命名约定**：`CreateXxxRequestDTO` / `UpdateXxxRequestDTO` / `XxxResponseDTO` / `XxxListItemDTO`，扫一眼就知道用途。

## 二、字段暴露控制：白名单优先

响应序列化的核心问题是「暴露哪些字段」。三种策略：

| 策略 | 做法 | 安全性 | 推荐 |
| --- | --- | --- | --- |
| **白名单** | 响应 DTO 只列要暴露的字段，不在 DTO 的字段天然不输出 | ✅ 最安全（默认不暴露） | **优先** |
| **黑名单** | 实体上标 `@Exclude()` 排除敏感字段，其余都吐 | ❌ 易漏（新加字段忘了排除就泄露） | 不推荐 |
| **分组** | `@Expose({ groups: ['public'] })` 按场景分组，序列化时选组 | 🟡 灵活但复杂 | 多视图场景 |

```ts
// ✅ 白名单：响应 DTO 只列要暴露的
class UserResponseDTO {
  id: string;
  name: string;
  email: string;
  // 实体里的 passwordHash / internalFlag / deletedAt 不在这里 → 不输出
}

// ❌ 黑名单：实体标 @Exclude（新字段忘了标就泄露）
class User {
  @Exclude()
  passwordHash: string;
  name: string;
  email: string;
  internalFlag: boolean; // 忘了 @Exclude → 泄露
}
```

- **白名单最安全**：默认不暴露，要暴露才显式声明，新字段不会意外泄露。
- **黑名单的坑**：DB 加字段 → 实体加字段 → 忘了 @Exclude → 泄露，是安全事故温床。

## 三、实体 ↔ DTO 转换

DTO 与 ORM 实体是两个世界，需要转换。两种方式：

```ts
// 方式一：手写映射函数（显式可控，推荐小项目）
function toUserResponseDTO(user: UserEntity): UserResponseDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

// 方式二：mapper 库自动映射（省样板，大项目）
// 用 @automapper/classes 等，配置实体↔DTO 映射规则，自动转换
```

- **手写映射**：显式、可调试、无魔法，字段多了显繁琐但安全。小中型项目首选。
- **mapper 库**：定义一次映射规则，复用转换，省样板但加一层间接与学习成本。大型多实体项目考虑。
- **转换的位置**：在 service 层返回 DTO（不返实体），controller 直接吐 DTO——保证接口边界只流通 DTO。

## 四、嵌套 DTO 与深层暴露控制

响应含子资源时（如用户含其文章列表），每个子资源也要用 DTO 走白名单：

```ts
class PostResponseDTO {
  id: string;
  title: string;
  // 不含 authorId 内部字段、不含 deletedAt
}

class UserWithPostsResponseDTO {
  id: string;
  name: string;
  posts: PostResponseDTO[]; // 嵌套 DTO，每个 post 也白名单
}
```

- **深层泄露风险**：嵌套资源若直接吐实体，敏感字段会随子资源泄露（如每篇文章的 internalNotes）。
- **嵌套校验**：请求 DTO 嵌套时用 `@ValidateNested()`（class-validator）或 Zod 的 `z.array(z.object(...))` 递归校验。

## 五、分页 DTO 标准化

列表接口的分页形状应全项目统一，客户端写一次通用处理：

```ts
class PaginatedResponseDTO<T> {
  items: T[];        // 当前页数据
  total: number;     // 总条数
  page: number;      // 当前页码
  pageSize: number;  // 每页条数
  // 可选：hasNext、totalPages
}
```

- 统一形状让前端分页组件通用，不用每个接口适配。
- 泛型 `PaginatedResponseDTO<UserResponseDTO>` 复用结构。

## 六、不可变 DTO 与 readonly

响应 DTO 字段用 `readonly`，防止业务代码意外修改序列化结果：

```ts
class UserResponseDTO {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}
// const dto = toUserResponseDTO(user);
// dto.name = 'x'; // 编译期报错，防止意外篡改
```

- DTO 是「数据快照」，不应被修改；readonly 在编译期拦住误改。
- 请求 DTO 也可加 readonly，保证校验后不被业务逻辑改值（否则校验失效）。

## 下一步

掌握了 DTO 模式后，下一步对比两种校验流派——[校验模式对比](./validation-comparison)（装饰器 vs schema、向后兼容）。
