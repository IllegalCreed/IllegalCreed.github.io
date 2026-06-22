---
layout: doc
outline: [2, 3]
---

# 模块与 API

> 基于 @faker-js/faker v10 编写

## 速查

- 导入：`import { faker } from '@faker-js/faker'`（默认英文）；本地化用 `fakerZH_CN` 等
- 数据按模块组织：`person` / `internet` / `location` / `finance` / `commerce` / `company` / `date` / `lorem` / `string` / `number` / `datatype` / `helpers` …
- **核心改名（必记）**：`name→person`、`address→location`（v8）｜`datatype.number→number.int`、`random.*` 整模块移除、`helpers.unique` 移除（v9）｜`internet.userName→username`（v10）
- 数值归 `faker.number`（`int` / `float`），字符串归 `faker.string`（`uuid` / `alphanumeric`），`faker.datatype` 现仅剩 `boolean()` 等少量
- 造对象数组的标准方式：`faker.helpers.multiple(fn, { count })`

## 导入

```ts
// ESM（推荐）
import { faker } from "@faker-js/faker";

// CommonJS（需 Node v20.19+ / v22.13+ 的 ESM-require）
const { faker } = require("@faker-js/faker");

// 浏览器（动态 import）
const { faker } = await import("https://esm.sh/@faker-js/faker");

// 本地化实例（按需导入预构建实例）
import { fakerEN } from "@faker-js/faker";
import { fakerZH_CN } from "@faker-js/faker";
import { fakerDE as faker } from "@faker-js/faker";
```

> 默认 `faker` 实例输出**英文**数据。中文 / 其它语言按需导入对应实例（详见 [Helpers 与本地化](./helpers-and-locale.md)）。

## 模块体系

v10 的模块清单（API 侧栏）：Airline、Animal、Book、Color、Commerce、Company、Database、Datatype、Date、Finance、Food、Git、Hacker、Helpers、Image、Internet、Location、Lorem、Music、Number、Person、Phone、Science、String、System、Vehicle、Word。下面是前端测试最常用的一批：

| 模块 | 常用方法 | 示例 / 备注 |
| ---- | -------- | ----------- |
| `faker.person` | `firstName(sex?)` / `lastName()` / `fullName()` / `sex()` / `sexType()` / `jobTitle()` | `faker.person.fullName()` → `"Rowan Nikolaus"`（**旧 `faker.name` 已改名**） |
| `faker.internet` | `email({firstName,lastName})` / `username()` / `url()` / `password()` | `faker.internet.username()`（**v10：旧 `userName` 已改名**） |
| `faker.location` | `city()` / `country()` / `zipCode()` / `streetAddress()` / `latitude()` | `faker.location.city()`（**旧 `faker.address` 已改名**） |
| `faker.finance` | `amount()` / `accountNumber()` / `currencyCode()` / `iban()` | `faker.finance.amount()` |
| `faker.commerce` | `productName()` / `price()` / `department()` | `faker.commerce.productName()` |
| `faker.company` | `name()` / `catchPhrase()` / `buzzPhrase()` | `faker.company.name()` |
| `faker.date` | `past()` / `future()` / `between({from,to})` / `recent()` / `soon()` / `birthdate()` | `faker.date.past()` |
| `faker.lorem` | `word()` / `words()` / `sentence()` / `paragraph()` / `paragraphs()` | `faker.lorem.paragraph()` |
| `faker.string` | `uuid()` / `alphanumeric(n)` / `alpha()` / `numeric()` / `nanoid()` | `faker.string.uuid()`（字符串都归这里） |
| `faker.number` | `int({min,max})` / `float({min,max,fractionDigits})` | `faker.number.int({ min: 1, max: 10 })`（数值都归这里） |
| `faker.datatype` | `boolean(probability?)` | `faker.datatype.boolean()`（**`number` / `float` 已移走到 `faker.number`**） |
| `faker.helpers` | `arrayElement` / `multiple` / `fake` / `weightedArrayElement` / `uniqueArray` | 工具方法，详见 [Helpers 与本地化](./helpers-and-locale.md) |

完整对象工厂示例（官方 README）：

```ts
import { faker } from "@faker-js/faker";

export function createRandomUser() {
  return {
    userId: faker.string.uuid(),
    username: faker.internet.username(), // v10：username
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    password: faker.internet.password(),
    birthdate: faker.date.birthdate(),
    registeredAt: faker.date.past(),
  };
}

// multiple 是造对象数组的标准方式
export const users = faker.helpers.multiple(createRandomUser, { count: 5 });
```

## ⚠️ 破坏性改名全表（v8 / v9 / v10）

这是跟旧教程最容易踩的坑。下面按版本列出全部主要改名 / 移除。

### v8.0：模块大重排

| 旧写法 | 新写法 | 说明 |
| ------ | ------ | ---- |
| `faker.name.*` | `faker.person.*` | Name 模块更名 Person |
| `faker.address.*` | `faker.location.*` | Address 模块更名 Location |
| `faker.datatype.string()` 等字符串方法 | `faker.string.*` | String 拆为独立模块 |
| 数值类方法 | `faker.number.*` | Number 拆为独立模块 |
| `faker.locale = 'xx'`（运行时切换） | 按需导入本地化实例 | 移除 locale 运行时切换 |

### v9.0：清理 v8 的废弃项（Node 18+）

| 旧写法 | 新写法 | 说明 |
| ------ | ------ | ---- |
| `faker.datatype.number()` | `faker.number.int()` / `faker.number.float()` | 已移除 |
| `faker.datatype.float()` | `faker.number.float()` | 已移除 |
| `faker.datatype.uuid()` | `faker.string.uuid()` | 各自归专用模块 |
| `faker.random.alpha()` | `faker.string.alpha()` | **整个 `faker.random` 模块移除** |
| `faker.random.alphaNumeric()` | `faker.string.alphanumeric()` | 同上 |
| `faker.random.numeric()` | `faker.string.numeric()` | 同上 |
| `faker.random.word()` / `words()` | `faker.lorem.word()` / `faker.word.sample()` 等 | 同上 |
| `faker.helpers.unique()` | `enforce-unique` / `faker.helpers.uniqueArray()` | **已移除**（全局 store 隐患，详见 [Helpers 与本地化](./helpers-and-locale.md)） |

### v10.0：ESM-only、Node 20+

| 旧写法 | 新写法 | 说明 |
| ------ | ------ | ---- |
| `faker.internet.userName()` | `faker.internet.username()` | 驼峰 `N` 改小写 `n`（细节坑） |
| `faker.internet.color()` | `faker.color.rgb()` | — |
| `faker.image.urlPlaceholder()` | `faker.image.url()` / `dataUri()` | v9.4 弃用 → v10 移除（via.placeholder.com 不稳） |
| `faker.image.avatarLegacy()` | `faker.image.avatar()` | — |
| `faker.finance.maskedNumber()` | （无直接替代） | 移除 |

> v10 另一处行为变更：**Word 模块默认 resolution 策略改为 `'fail'`**——按条件（如长度）找不到符合的词时会**抛错**而非返回随机词；要恢复旧行为传 `{ strategy: 'any-length' }`。

::: warning 反模式速记
出现以下写法即为过时 / 已失效，应替换：`faker.name.*`、`faker.address.*`、`faker.datatype.number()`、`faker.random.*`、`faker.helpers.unique()`、`faker.internet.userName()`。
:::
