---
layout: doc
outline: [2, 3]
---

# 测试实战

> 基于 @faker-js/faker v10 编写

## 速查

- **工厂函数 + `overrides` 参数**：批量造逼真数据，又能对断言相关字段精确控制
- 断言相关字段要**写死 / 覆盖**，别依赖未 seed 的随机假值（否则 flaky）
- 用 `faker.helpers.multiple(factory, { count })` 批量造数组喂列表 / 表格组件
- 与 **Zod** 结合：`zod-schema-faker`（v2.1.1，支持 Zod 3/4/Mini）从 schema 生成 mock，底层用 `@faker-js/faker`
- **CI 复现**：在 setup 里固定 `faker.seed(固定值)`；失败时用无参 `faker.seed()` 取 seed 本地复现
- **vs fast-check 边界**：Faker 造「逼真样本」，fast-check 造「任意 / 边界输入 + shrinking 找最小反例」——目的不同，互补不互斥

## Vitest 工厂函数 + overrides

工厂模式是 Faker 在测试里的核心用法：一个函数批量造逼真对象，`overrides` 参数让测试精确控制断言相关字段。

```ts
import { faker } from "@faker-js/faker";
import type { User } from "@/types";

/** 工厂：造一个符合 User 类型的测试对象（字段间保持一致性） */
function createUser(overrides: Partial<User> = {}): User {
  const sex = faker.person.sexType();
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName();
  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }), // 邮箱与姓名一致
    age: faker.number.int({ min: 18, max: 80 }),
    ...overrides, // 允许测试覆盖关键字段
  };
}

// 批量造一组
const users = faker.helpers.multiple(createUser, { count: 10 });
```

> 要点：字段间有依赖时按顺序生成并传参（`email({ firstName, lastName })` 让邮箱与姓名一致），数据更真实。

## 喂组件 props（Vue 3 + @vue/test-utils）

```ts
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, expect, it } from "vitest";
import UserCard from "@/components/UserCard.vue";

beforeEach(() => faker.seed(2026)); // 固定 → 快照稳定
afterEach(() => faker.seed()); // 复位，避免污染后续测试

it("renders user name", () => {
  // 断言相关字段写死，不依赖随机值
  const user = createUser({ firstName: "Ada", lastName: "Lovelace" });
  const wrapper = mount(UserCard, { props: { user } });
  expect(wrapper.text()).toContain("Ada Lovelace");
});
```

## 与 Zod 结合：从 schema 生成 mock

如果项目已用 **Zod** 定义接口 / 表单 schema，可用 **`zod-schema-faker`** 直接把 schema 转成符合约束的假数据——schema 改了不必再手动同步工厂，单一事实来源驱动 mock。

- 定位：「Generate mock data from zod schemas. Powered by **@faker-js/faker** and randexp.js.」
- 版本：**v2.1.1**（支持 **Zod v3 / v4 / Zod Mini**）。

```ts
import { z } from "zod";
import { faker } from "@faker-js/faker";
import { setFaker } from "zod-schema-faker/v4";
import { fake } from "zod-schema-faker";

setFaker(faker);

const Player = z.object({ username: z.string(), xp: z.number() });
const data = fake(Player); // { username: "billie", xp: 100 }
```

## CI 可复现

统一在测试入口（如 `setup.ts`）或每个 `describe` 里 `faker.seed(固定值)`，让 CI 每次跑出同一组数据；某用例失败时，用无参 `faker.seed()` 打印当前 seed，再在本地用该 seed 复现。

```ts
// vitest setup.ts
import { faker } from "@faker-js/faker";
faker.seed(20260622); // 全局固定，CI 可复现
```

## ⚠️ 边界：Faker vs fast-check

两者**目的完全不同**，是知识库里最该讲清的边界——别拿 Faker 去找边界 bug。

| 维度 | **Faker.js** | **fast-check（属性测试）** |
| ---- | ------------ | -------------------------- |
| 目的 | 造**逼真样本数据**（像真实用户 / 订单的样子） | 造**任意 / 边界输入**，验证「对所有输入都成立的性质」 |
| 数据特征 | 真实感强、落在「正常」分布 | 刻意覆盖极端：空、最小 / 最大、特殊字符、负数、`NaN` … |
| 失败处理 | 无内置，失败靠你记 seed | **shrinking**：自动把失败用例收缩成**最小反例** |
| 复现 | `faker.seed()` 固定序列 | 也有 seed / path 复现失败用例 |
| 典型场景 | fixture、Demo、Storybook mock、种子数据、无后端开发 | 验证纯函数 / 算法 / 序列化往返 / 不变量 |
| 一句话 | 「**它看起来像真数据**」 | 「**它能不能打破我的代码**」 |

> 二者**互补不互斥**：Faker 给「逼真」的 happy-path 数据；fast-check 给「任意 + 边界」的对抗数据并 shrink 出最小反例。要 shrink / 属性验证就用 fast-check，**Faker 不是用来找边界 bug 的**。

## 最佳实践与反模式

**最佳实践**

- **测试里务必 seed**（否则不可复现、快照不稳）；需要随机覆盖面的测试再用无参 `seed()` 解开。
- **别在断言里依赖具体假值**：要断言就**显式构造 / 覆盖**该字段，或断言「形状 / 类型 / 正则」而非具体值。
- **dev-only**：装为 devDependency，不进生产包。
- **造一致性数据**：字段间有依赖时按顺序生成并传参（`email({ firstName, lastName })`）。
- 升级 Faker 后**留意快照基线**（同 seed 跨版本不保证一致）。

**反模式**

- 用裸 `faker`（旧包）/ 用已移除的 `faker.helpers.unique`、`faker.datatype.number`、`faker.random.*`、`faker.name`、`faker.address`、`faker.internet.userName`。
- 测试不 seed 却断言具体值 → flaky。
- 把 Faker 当「边界 / 对抗输入生成器」用（它造的是逼真的中间地带，不主动探测极端值）。
