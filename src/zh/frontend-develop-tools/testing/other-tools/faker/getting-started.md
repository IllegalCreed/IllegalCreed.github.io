---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 @faker-js/faker v10 编写

## 速查

- **包名认准 `@faker-js/faker`**（带 scope）；裸 `faker` 是 2022 年被破坏 / 废弃的旧包，别再装
- 安装为 **devDependency**：`pnpm add -D @faker-js/faker`（v10.5.x，需 **Node 20+**、**ESM-only**）
- 导入即用：`import { faker } from '@faker-js/faker'`（默认输出英文数据，中文用 `fakerZH_CN`）
- 最小例：`faker.person.fullName()` / `faker.internet.email()` / `faker.string.uuid()`
- **测试里务必 `faker.seed(123)`**：不 seed → 数据每次不同 → 断言 / 快照 flaky；`faker.seed()` 无参返回当前 seed
- 造对象数组用 `faker.helpers.multiple(fn, { count })`，模板插值用 `faker.helpers.fake('{{person.lastName}}')`

## Faker 是什么

Faker 生成「逼真但虚假」（fake but reasonable）的数据。官方定位它用于：

- **单元测试 / 快照测试**：造 fixture、工厂对象，不用手写一堆假人名假邮箱
- **性能测试**：批量造大数据集压测
- **构建 Demo / 原型**：用逼真数据填充界面
- **无后端开发**：接口没就绪时，前端先用假数据把列表 / 表单 / 卡片跑通

它按模块组织成百上千个方法，例如 `faker.person.fullName()` 出人名、`faker.internet.email()` 出邮箱、`faker.location.city()` 出城市。

## 务必用 `@faker-js/faker`，别用裸 `faker`

npm 上还有一个**不带 scope 的旧 `faker`**——那是 2022 年原作者蓄意破坏 / 废弃的旧包（详见 [概念与历史](./guide-line/concepts-and-history.md)），**已不可信、不要安装**。现代正确的包是社区接管维护的 **`@faker-js/faker`**：

```bash
# ✅ 正确
pnpm add -D @faker-js/faker
# ❌ 错误 / 过时：裸 faker 已废弃
# npm install faker
```

> 任何教程 / 题目里出现 `npm install faker`（无 scope）都是过时写法，应改为 `@faker-js/faker`。

## 安装（dev 依赖）

Faker 只在测试 / 开发 / 构建期用，**必须装为 devDependency**，不进生产包：

```bash
pnpm add -D @faker-js/faker     # 本项目用 pnpm
npm  install @faker-js/faker --save-dev
yarn add  @faker-js/faker --dev
```

环境要求（v10）：

- **Node.js 20+**（精确下限 v20.19.0 / v22.13.0 / v24.0.0；v18 已不支持）
- **ESM-only**：v10 起包为纯 ESM；CJS 项目可经 Node 的 ESM-require 使用，但需 Node v20.19+ / v22.13+
- TypeScript：`moduleResolution` 用 `"Bundler"` / `"Node20"`（TS 5.9+）/ `"NodeNext"`

## 最小例

```ts
import { faker } from "@faker-js/faker"; // 默认实例输出英文数据

// 单个字段
const name = faker.person.fullName(); // "Rowan Nikolaus"
const email = faker.internet.email(); // "Kassandra.Haley@erich.biz"
const id = faker.string.uuid(); // "9c2b..."

// 造一个完整对象（官方推荐写法）
function createRandomUser() {
  return {
    userId: faker.string.uuid(),
    username: faker.internet.username(), // v10：username（旧 userName 已改名）
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    birthdate: faker.date.birthdate(),
    registeredAt: faker.date.past(),
  };
}

// 批量造数组：helpers.multiple 是造对象数组的标准方式
const users = faker.helpers.multiple(createRandomUser, { count: 5 });
```

中文数据按需导入本地化实例：

```ts
import { fakerZH_CN } from "@faker-js/faker"; // 简体中文
fakerZH_CN.person.fullName(); // "张伟" 之类
```

## 测试里务必 seed（最关键）

Faker 默认每次跑出**不同**的随机值。如果测试直接断言具体假值，或对含假数据的 DOM 做快照，就会**随机失败 / 快照永远 diff**（flaky）。解决办法是固定随机种子：

```ts
import { faker } from "@faker-js/faker/locale/en";
import { afterEach, expect, it } from "vitest";

// 每个测试结束后取消固定，避免污染后续测试（seed 是实例级全局状态）
afterEach(() => {
  faker.seed();
});

it("snapshot 稳定", () => {
  faker.seed(1234); // 固定本测试的随机序列 → 快照可复现
  const name = faker.person.fullName();
  expect(name).toMatchSnapshot();
});
```

要点：

- `faker.seed(123)`：设定种子，后续随机序列确定；再次 `faker.seed(123)` 会**复位**到同一序列
- `faker.seed()`（**无参**）：返回当前 seed（用于记录失败用例的 seed 复现），也用于「取消」固定
- seed 是**实例级全局**、有副作用，多个测试共享同一 `faker` 实例时要在 `afterEach` 里 `faker.seed()` 复位

> 相对日期（`faker.date.past()` / `recent()` 等）会随真实时间漂移，要可复现还需配 `faker.setDefaultRefDate(...)`，详见 [确定性](./guide-line/determinism.md)。

## 下一步

- [概念与历史](./guide-line/concepts-and-history.md)：用途、2022 marak 蓄意破坏事件、社区 fork、版本与运行环境
- [模块与 API](./guide-line/modules-api.md)：模块体系、常用方法、v8/v9/v10 破坏性改名全表
- [确定性](./guide-line/determinism.md)：`faker.seed()` 双重语义、afterEach 复位、`setDefaultRefDate`、跨版本不一致
- [Helpers 与本地化](./guide-line/helpers-and-locale.md)：`faker.helpers` 全家桶、`unique` 已移除→`enforce-unique`、locale 回退
- [测试实战](./guide-line/testing-practice.md)：Vitest 工厂函数、与 Zod 结合、CI 复现、vs fast-check 边界、最佳实践
