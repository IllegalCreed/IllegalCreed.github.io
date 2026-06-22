---
layout: doc
outline: [2, 3]
---

# Helpers 与本地化

> 基于 @faker-js/faker v10 编写

## 速查

- `faker.helpers`：`arrayElement`（取一）/ `arrayElements`（取多）/ `multiple`（造数组，**标准方式**）/ `fake`（mustache 模板）/ `shuffle` / `maybe`（按概率）/ `weightedArrayElement`（按权重）/ `uniqueArray`（批量不重复）
- **`faker.helpers.unique` 已在 v9 移除**（全局 store 隐患）→ 官方首推第三方库 **`enforce-unique`**（`UniqueEnforcer`），或用 `faker.helpers.uniqueArray` 批量生成
- 本地化是**按需导入预构建实例**（如 `fakerZH_CN`），**不是**运行时 `faker.locale = 'zh_CN'`（v8 起已移除）
- 多 locale 回退用 `new Faker({ locale: [...] })`，按数组顺序取第一个命中该数据的 locale
- 支持 70+ locale（`fakerEN_US` / `fakerZH_CN` / `fakerJA` …）

## `faker.helpers` 常用方法（v10）

| 方法 | 签名 / 作用 |
| ---- | ----------- |
| `arrayElement(arr)` | 从数组随机取**一个** |
| `arrayElements(arr, count?)` | 随机取**若干**（`count` 可为数字或 `{min,max}`） |
| `multiple(fn, {count})` | 调 `fn` 多次返回数组（**造对象数组的标准方式**） |
| `fake(pattern)` | **mustache 模板**插值，如 <code v-pre>'Hello {{person.lastName}}'</code> |
| `shuffle(list, {inplace?})` | 洗牌 |
| `maybe(fn, {probability})` | 按概率返回 `fn()` 或 `undefined` |
| `weightedArrayElement([{weight,value}])` | **按权重**取元素 |
| `uniqueArray(source, length)` | 一次性生成 `length` 个**互不相同**的值 |
| `rangeToNumber(n \| {min,max})` | 把范围解析成具体数字 |
| `slugify` / `replaceSymbols` / `fromRegExp` / `enumValue` | 其它工具类 |

```ts
faker.helpers.arrayElement(["free", "basic", "business"]);
faker.helpers.multiple(() => faker.person.fullName(), { count: 5 });
faker.helpers.fake("Hello {{person.prefix}} {{person.lastName}}, how are you today?");
faker.helpers.weightedArrayElement([
  { weight: 5, value: "common" },
  { weight: 1, value: "rare" },
]);
faker.helpers.uniqueArray(faker.internet.email, 1000); // 1000 个不重复邮箱
```

## ⚠️ 唯一性：`faker.helpers.unique` 已移除

这是高频纠偏点。v9 升级指南原话：

> Prior to v9, Faker provided a `faker.helpers.unique()` method which had a global store to keep track of duplicates. **This was removed in v9.**

即：`faker.helpers.unique()` 曾用一个**全局 store** 记录已生成值，因全局状态 / 内存泄漏隐患，在 **v8 弃用 → v9 移除**。**v10 的 helpers API 里已无此方法**，再调用会报错。

官方推荐的替代方案：

1. **`faker.helpers.uniqueArray(source, length)`**：一次性批量生成不重复值（够用就首选这个，无全局状态）。

   ```ts
   const emails = faker.helpers.uniqueArray(faker.internet.email, 100);
   ```

2. **第三方库 `enforce-unique`**（官方首推迁移路径，GitHub: MansurAliKoroglu/enforce-unique）——逐个生成时强制唯一：

   ```ts
   import { UniqueEnforcer } from "enforce-unique";

   const enforcerName = new UniqueEnforcer();
   const name = enforcerName.enforce(() => faker.person.firstName());
   ```

3. **第三方库 `@dpaskhin/unique`**（GitHub: dPaskhin/unique）。

4. **自管**：自己维护已生成值的 `Set`，撞重则重生成；或给值加序列号前 / 后缀。

> 不能再写 `faker.helpers.unique(faker.internet.email)`——这是已移除 API，属反模式。

## 本地化（locale）

### 按需导入预构建实例

v8 起**取消运行时 locale 切换**，改为按需导入预构建实例。默认 `faker` 输出英文，中文 / 其它语言这样用：

```ts
import { fakerZH_CN } from "@faker-js/faker"; // 简体中文
import { fakerDE } from "@faker-js/faker"; // 德语

fakerZH_CN.person.fullName(); // 中文人名
```

> ⚠️ 纠偏：**不要**再写 `faker.locale = 'zh_CN'`（v8 起已无运行时切换）。要中文就导入 `fakerZH_CN`。

### 自定义实例 + 多 locale 回退

用 `Faker` 构造器传入 locale 数组，按顺序回退到第一个含该数据的 locale：

```ts
import type { LocaleDefinition } from "@faker-js/faker";
import { base, de, de_CH, en, Faker } from "@faker-js/faker";

const customLocale: LocaleDefinition = {
  title: "My custom locale",
  internet: { domainSuffix: ["test"] },
};

export const customFaker = new Faker({
  locale: [customLocale, de_CH, de, en, base], // 依次回退
});
```

工作机制：取某字段时，按数组顺序找**第一个**定义了该字段的 locale。上例优先用自定义 locale，缺的回退到 `de_CH` → `de` → `en` → `base`。

### 支持的 locale

支持 **70+ locale**（`en_US` / `en_GB` / `zh_CN` / `zh_TW` / `ja` / `ko` / `de` / `fr` …），每个对应导入名 `fakerEN_US` / `fakerZH_CN` / `fakerJA` / …。按需导入比导入全量更省体积（数据集较大）。
