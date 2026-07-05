---
layout: doc
outline: [2, 3]
---

# JSON Schema：给 JSON 做结构校验

> 基于 RFC 8259 / ECMA-404 · JSON Schema 2020-12 · 核于 2026-07

## 速查

- **是什么**：**用一份 JSON 描述另一份 JSON 的结构与约束**，配合校验器（如 Ajv）做数据契约校验。当前 draft **2020-12**（上一版 2019-09）。
- **draft 演进**：draft-04 → draft-06 → draft-07 → **2019-09** → **2020-12**；老项目仍常见 **draft-07**。
- **声明方言**：`$schema`，2020-12 的 URI 是 `https://json-schema.org/draft/2020-12/schema`。
- **类型**：`type`（`"string"`/`"number"`/`"integer"`/`"boolean"`/`"object"`/`"array"`/`"null"`）。
- **通用约束**：`enum`、`const`。
- **数值**：`minimum`/`maximum`/`exclusiveMinimum`/`exclusiveMaximum`/`multipleOf`。
- **字符串**：`minLength`/`maxLength`/`pattern`（正则）/`format`（`email`/`date-time`/`uri`…）。
- **对象**：`properties`、`required`、`additionalProperties`、`patternProperties`、`minProperties`/`maxProperties`、`dependentRequired`。
- **数组**：`items`、**`prefixItems`（2020-12 新，元组按位校验）**、`contains`、`minItems`/`maxItems`、`uniqueItems`。
- **组合**：`allOf`/`anyOf`/`oneOf`/`not`、`if`/`then`/`else`。
- **复用与引用**：`$defs`（2019-09 起取代 `definitions`）、`$ref`、`$id`、`$anchor`；递归用 **`$dynamicRef`/`$dynamicAnchor`**（2020-12，取代 `$recursiveRef`）。
- **Ajv**：默认 `new Ajv()` 是 **draft-07**；**2020-12 要用 `ajv/dist/2020` 的 `Ajv2020`**，draft-04 用 `ajv-draft-04`。
- ⚠️ **2020-12 关键变化**：元组从「`items` 传数组」改为 **`prefixItems`**，此时 `items` 管「其余元素」。

## 一、为什么需要 Schema

JSON 本身**只描述数据、不描述结构**。跨团队协作时，「这个字段是必填吗？是字符串还是数字？取值范围？」全靠口头约定，极易出错。**JSON Schema** 就是用一份 JSON 文档，把这些约束**写成机器可校验的规则**：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 },
    "email": { "type": "string", "format": "email" },
    "role": { "enum": ["admin", "user", "guest"] }
  },
  "required": ["name", "email"],
  "additionalProperties": false
}
```

它能校验数据、生成表单、驱动文档（OpenAPI 的 schema 部分就基于 JSON Schema），是 API 契约的基石。

## 二、draft 演进与当前版本

JSON Schema 以「draft」迭代，版本顺序：

```
draft-04 → draft-06 → draft-07 → 2019-09 → 2020-12（当前）
```

- **当前主推：2020-12**（官网明确「current version is 2020-12，previous was 2019-09」）。
- **老项目仍多见 draft-07**——它稳定、工具支持最广。
- 用 `$schema` 声明所遵循的方言，避免校验器按错版本解释关键字。

::: warning 别混用不同 draft 的写法
`definitions`（旧）与 `$defs`（2019-09+）、`items` 数组元组（旧）与 `prefixItems`（2020-12）不能想当然互换。迁移时对照目标 draft 改写。
:::

## 三、核心关键字分组

### 类型与通用

```json
{ "type": "string" }              // 单一类型
{ "type": ["string", "null"] }    // 允许多类型
{ "enum": ["red", "green"] }      // 枚举取值
{ "const": "v1" }                 // 固定为单值
```

### 数值 / 字符串 / 对象 / 数组

| 分组 | 常用关键字 |
| --- | --- |
| 数值 | `minimum` `maximum` `exclusiveMinimum` `exclusiveMaximum` `multipleOf` |
| 字符串 | `minLength` `maxLength` `pattern` `format` |
| 对象 | `properties` `required` `additionalProperties` `patternProperties` `dependentRequired` |
| 数组 | `items` `prefixItems` `contains` `minItems` `maxItems` `uniqueItems` |

### 组合与条件

```json
{ "allOf": [ ... ] }   // 全部满足
{ "anyOf": [ ... ] }   // 至少一个满足
{ "oneOf": [ ... ] }   // 恰好一个满足
{ "not": { ... } }     // 取反
{ "if": {...}, "then": {...}, "else": {...} }  // 条件校验
```

## 四、2020-12 的元组变化：prefixItems

这是从 draft-07 迁移到 2020-12 **最容易踩的一处破坏性变化**。

**draft-07**：元组（按位置逐个校验数组元素）靠给 `items` 传**数组**：

```json
{ "items": [ { "type": "string" }, { "type": "number" } ] }
```

**2020-12**：改用 **`prefixItems`**，此时 `items` 的语义变成「校验 `prefixItems` 之外的**剩余元素**」：

```json
{
  "prefixItems": [ { "type": "string" }, { "type": "number" } ],
  "items": false
}
```

上例表示：第 1 个元素是字符串、第 2 个是数字、**其余元素不允许**（`items: false`）。

## 五、复用与引用：$defs / $ref / $id

`$ref` 通过 URI 引用另一处 schema，把可复用片段抽到 `$defs`（2019-09 起取代旧的 `definitions`）：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$defs": {
    "address": {
      "type": "object",
      "properties": { "city": { "type": "string" } },
      "required": ["city"]
    }
  },
  "type": "object",
  "properties": {
    "home": { "$ref": "#/$defs/address" },
    "work": { "$ref": "#/$defs/address" }
  }
}
```

| 关键字 | 职责 |
| --- | --- |
| `$schema` | 声明所用的 draft **方言** |
| `$id` | 给 schema 设**基准 URI**，供相对 `$ref` 解析 |
| `$defs` | 放**可复用子 schema** 的标准容器 |
| `$ref` | 通过 URI **引用**另一处 schema |
| `$dynamicRef` / `$dynamicAnchor` | **递归/多态**引用（2020-12，取代 `$recursiveRef`） |

## 六、用 Ajv 校验

[Ajv](https://ajv.js.org/) 是 JS 生态最流行的校验器。关键坑：**默认导出针对 draft-07**，校验 2020-12 要用专用入口：

```js
// ❌ 默认入口只认 draft-07，不识别 prefixItems / $dynamicRef 等
// import Ajv from "ajv";

// ✅ 2020-12 用专用构建入口
import Ajv2020 from "ajv/dist/2020";

const ajv = new Ajv2020();
const validate = ajv.compile(schema);
const ok = validate(data);
if (!ok) console.log(validate.errors);
```

- 2019-09：`ajv/dist/2019`
- draft-04：单独的 `ajv-draft-04` 包
- `format`（email/date-time 等）断言需额外装 `ajv-formats`

::: tip Schema 与 TypeScript 的关系
JSON Schema 校验**运行时**数据（外部输入、API 边界），TypeScript 类型只在**编译期**。两者互补：可用 `json-schema-to-typescript` 从 schema 生成 TS 类型，或用 Zod/TypeBox 等库同时产出类型与运行时校验。
:::

---

会写、会验之后，最后一页把 JSON 放回整个技术栈里——进入 [生态与选型](./ecosystem-and-selection)：JSON vs YAML vs TOML 的定位之争，以及真实工程场景。
