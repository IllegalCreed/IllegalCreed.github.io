---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 @faker-js/faker v10 编写

## 速查

- 包名 **`@faker-js/faker`**（带 scope）；裸 `faker` 已废弃。装为 **devDependency**
- 当前 **v10.5.x**，要求 **Node 20+**、**ESM-only**
- `import { faker } from '@faker-js/faker'`（默认英文）/ `fakerZH_CN`（中文）
- **测试务必 `faker.seed(固定值)`**；`faker.seed()` 无参取当前 seed；相对日期配 `faker.setDefaultRefDate()`
- 改名速记：`name→person`、`address→location`（v8）｜`datatype.number→number.int`、`random.*` 移除、`helpers.unique` 移除（v9）｜`internet.userName→username`（v10）
- 唯一值用 **`enforce-unique`** 或 `faker.helpers.uniqueArray`；Zod→mock 用 `zod-schema-faker`

## 版本锚点

| 版本 | 关键变化 | 运行环境 |
| ---- | -------- | -------- |
| **v10.x**（当前 v10.5.x） | `internet.userName→username`；Word 模块默认策略 `'fail'`（找不到词抛错）；`image.urlPlaceholder` 移除 | **Node 20+**、**ESM-only** |
| v9.x | 移除 `faker.helpers.unique`、`faker.datatype.number/float`、整个 `faker.random` 模块 | Node 18+ |
| v8.x | `name→person`、`address→location`；String/Number 拆为独立模块；取消运行时 locale 切换 | Node 18+ |

> ⚠️ 同一 `seed` 只保证「同版本内」可复现，**不保证跨版本**；升级 Faker 后快照基线可能需更新。

## 模块改名对照（v8/v9/v10）

| 旧写法（已失效） | 新写法 | 变更版本 |
| ---------------- | ------ | -------- |
| `faker.name.*` | `faker.person.*` | v8 |
| `faker.address.*` | `faker.location.*` | v8 |
| `faker.datatype.number()` | `faker.number.int()` | v9（移除） |
| `faker.datatype.float()` | `faker.number.float()` | v9（移除） |
| `faker.datatype.uuid()` / `string()` | `faker.string.uuid()` / `faker.string.*` | v9（移除） |
| `faker.random.alpha()` | `faker.string.alpha()` | v9（整模块移除） |
| `faker.random.alphaNumeric()` | `faker.string.alphanumeric()` | v9（整模块移除） |
| `faker.random.numeric()` | `faker.string.numeric()` | v9（整模块移除） |
| `faker.random.word()` / `words()` | `faker.lorem.word()` / `faker.word.sample()` | v9（整模块移除） |
| `faker.helpers.unique()` | `enforce-unique` / `faker.helpers.uniqueArray()` | v9（移除） |
| `faker.internet.userName()` | `faker.internet.username()` | v10 |
| `faker.internet.color()` | `faker.color.rgb()` | v10 |
| `faker.image.urlPlaceholder()` | `faker.image.url()` / `dataUri()` | v10（移除） |
| `faker.image.avatarLegacy()` | `faker.image.avatar()` | v10 |
| `faker.finance.maskedNumber()` | （无直接替代） | v10（移除） |

## 常用 API（v10）

| 模块 | 常用方法 | 示例 |
| ---- | -------- | ---- |
| `faker.person` | `firstName(sex?)` / `lastName()` / `fullName()` / `sex()` / `jobTitle()` | `faker.person.fullName()` |
| `faker.internet` | `email({firstName,lastName})` / `username()` / `url()` / `password()` | `faker.internet.email()` |
| `faker.location` | `city()` / `country()` / `zipCode()` / `streetAddress()` / `latitude()` | `faker.location.city()` |
| `faker.number` | `int({min,max})` / `float({min,max,fractionDigits})` | `faker.number.int({ min: 1, max: 10 })` |
| `faker.string` | `uuid()` / `alphanumeric(n)` / `alpha()` / `numeric()` / `nanoid()` | `faker.string.uuid()` |
| `faker.datatype` | `boolean(probability?)` | `faker.datatype.boolean()` |
| `faker.date` | `past()` / `future()` / `between({from,to})` / `recent()` / `birthdate()` | `faker.date.past()` |
| `faker.finance` | `amount()` / `accountNumber()` / `currencyCode()` / `iban()` | `faker.finance.amount()` |
| `faker.commerce` | `productName()` / `price()` / `department()` | `faker.commerce.productName()` |
| `faker.company` | `name()` / `catchPhrase()` / `buzzPhrase()` | `faker.company.name()` |
| `faker.lorem` | `word()` / `sentence()` / `paragraph()` / `paragraphs()` | `faker.lorem.paragraph()` |
| `faker.helpers` | `arrayElement` / `arrayElements` / `multiple` / `fake` / `weightedArrayElement` / `uniqueArray` | `faker.helpers.multiple(fn, { count: 5 })` |

## 确定性 API

| API | 作用 |
| --- | ---- |
| `faker.seed(123)` | 固定随机序列；再次同值调用复位序列 |
| `faker.seed([42, 1, 2])` | 数组种子 |
| `faker.seed()` | **无参返回当前 seed**，也用于取消固定 |
| `faker.setDefaultRefDate(date)` | 固定相对日期基准，让 `faker.date.*` 可复现 |

## 命令速查

```bash
# 安装（dev 依赖）
pnpm add -D @faker-js/faker          # v10.5.x，需 Node 20+，ESM-only

# 相关生态
pnpm add -D enforce-unique           # 唯一值（替代已移除的 helpers.unique）
pnpm add -D zod-schema-faker         # 从 Zod schema 生成 mock（底层用 @faker-js/faker）
```

```ts
// 最小用法
import { faker } from "@faker-js/faker";
faker.seed(123); // 测试里务必固定
faker.person.fullName();
faker.helpers.multiple(() => faker.person.fullName(), { count: 5 });
```

## 官方资源

- 官方文档：[https://fakerjs.dev/](https://fakerjs.dev/)
- 使用指南（导入 / 复现 / refDate）：[https://fakerjs.dev/guide/usage.html](https://fakerjs.dev/guide/usage.html)
- 框架集成（Vitest/Jest seed 示例）：[https://fakerjs.dev/guide/frameworks.html](https://fakerjs.dev/guide/frameworks.html)
- 唯一值（unique 替代）：[https://fakerjs.dev/guide/unique.html](https://fakerjs.dev/guide/unique.html)
- 升级到 v10：[https://fakerjs.dev/guide/upgrading.html](https://fakerjs.dev/guide/upgrading.html)
- Helpers API：[https://fakerjs.dev/api/helpers.html](https://fakerjs.dev/api/helpers.html)
- GitHub：[https://github.com/faker-js/faker](https://github.com/faker-js/faker)
- enforce-unique：[https://github.com/MansurAliKoroglu/enforce-unique](https://github.com/MansurAliKoroglu/enforce-unique)
- zod-schema-faker：[https://github.com/soc221b/zod-schema-faker](https://github.com/soc221b/zod-schema-faker)
