---
layout: doc
---

# Faker.js

Faker.js（现代正确包名 **`@faker-js/faker`**）是一个生成「逼真但虚假」数据的库——给单元测试造 fixture、给 Demo / 原型填充界面、在后端未就绪时让前端先用假数据跑通。它按 `person` / `internet` / `location` / `finance` / `date` 等模块组织成百上千个生成方法（`faker.person.fullName()`、`faker.internet.email()`、`faker.string.uuid()` …），并提供 `faker.seed()` 固定随机序列让测试**可复现**。它是 2022 年原版 `faker.js` 被作者蓄意破坏后，由社区在 `@faker-js/faker` 下接管维护的官方延续版本。

## 评价

**优点**

- **数据逼真、模块齐全**：人名、邮箱、地址、公司、金融、日期、Lorem 等几十个模块，一行一个，免去手写假数据
- **测试可复现**：`faker.seed(123)` 固定序列，配合快照测试稳定不 flaky；无参 `faker.seed()` 取当前 seed 便于复现失败用例
- **前端无后端友好**：接口没就绪时先用假数据驱动列表 / 卡片 / 表单，与 Vue 3 前端开发高度契合
- **本地化丰富**：70+ locale，按需导入 `fakerZH_CN` / `fakerEN_US` 等预构建实例，也可多 locale 回退
- **dev-only、零生产负担**：装为 devDependency，只在测试 / 开发 / 构建期用，不进生产包
- **生态联动**：`zod-schema-faker` 可直接从 Zod schema 生成符合约束的 mock，单一事实来源驱动假数据

**缺点**

- **不是边界 / 对抗输入工具**：造的是「正常分布」的逼真数据，不会主动探测空串 / `0` / `NaN` / 超长 / 负数等极端值——找边界 bug 该用 fast-check（属性测试 + shrinking）
- **不 seed 就 flaky**：随机值默认每次不同，断言具体假值会随机失败，快照永远 diff
- **跨版本 seed 不保证一致**：同一 seed 在不同 Faker 大版本可能输出不同，升级后快照基线可能需重建
- **破坏性改名多**：v8/v9/v10 多次重排（`name→person`、`address→location`、`datatype.number→number.int`、`random` 整模块移除、`userName→username`），跟着旧教程容易踩坑
- **ESM-only、Node 门槛**：v10 起纯 ESM 且要求 Node 20+，老环境 / CJS 项目需注意运行时版本

## 文档地址

[Faker 官方文档（fakerjs.dev）](https://fakerjs.dev/)

## GitHub地址

[faker-js/faker](https://github.com/faker-js/faker)

## 幻灯片地址

<a href="/SlideStack/faker-slide/" target="_blank">Faker.js</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=faker-js" target="_blank" rel="noopener noreferrer">Faker.js 测试题</a>
