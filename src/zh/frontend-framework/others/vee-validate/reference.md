---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 vee-validate v4 编写。完整 API 见 [官方文档](https://vee-validate.logaretm.com/v4/api/)。

## 核心 API

### `useForm(options)`

```ts
import { useForm } from "vee-validate";

const form = useForm({
  // schema 或字段规则二选一
  validationSchema?: GenericValidateFunction | Schema,
  initialValues?: Partial<TValues>,
  initialErrors?: Partial<Record<string, string>>,
  initialTouched?: Partial<Record<string, boolean>>,
  validateOnMount?: boolean,        // mount 时立即校验
  keepValuesOnUnmount?: boolean,    // 字段 unmount 后保留值
  controlled?: boolean,             // 是否对接 v-model
});
```

返回值见 [指南：表单级方法](#composition-api-useform-definefield)。

### `defineField(name, configOrFn?)`

```ts
const [model, attrs] = defineField("email", {
  validateOnInput?: boolean,
  validateOnBlur?: boolean,
  validateOnChange?: boolean,
  validateOnModelUpdate?: boolean,
  props?: (state: FieldState) => Record<string, unknown>,
  label?: string,
  syncVModel?: boolean | string,
});
```

返回 `[Ref<TValue>, Ref<{ onChange, onBlur, onInput, ... }>]`。

### `useField(name, rules?, opts?)`

底层 API，`defineField` 内部用它。手动绑定时：

```ts
const { value, errors, errorMessage, meta, handleChange, handleBlur, validate } = useField(
  "email",
  "required|email",
);
```

| 字段              | 类型                  | 说明                              |
| ----------------- | --------------------- | --------------------------------- |
| `value`           | `Ref<TValue>`         | 字段值                            |
| `errors`          | `Ref<string[]>`       | 当前所有错误                      |
| `errorMessage`    | `Ref<string>`         | 第一条错误                        |
| `meta`            | `FieldMeta`           | 字段元数据                        |
| `handleChange`    | `Function`            | 触发 change                      |
| `handleBlur`      | `Function`            | 触发 blur                         |
| `validate`        | `() => Promise`       | 手动校验                          |
| `resetField`      | `Function`            | 重置该字段                       |
| `setValue`        | `Function`            | 设置值并校验                      |
| `setErrors`       | `Function`            | 设置错误（不触发校验）           |
| `setTouched`      | `Function`            | 设置 touched 状态                |

### `useFieldArray(name)`

```ts
const {
  fields, push, prepend, insert, remove, swap, move, replace, update,
} = useFieldArray<TItem>("links");
```

详见 [指南：FieldArray 进阶](#fieldarray-进阶)。

### `defineRule(name, fn)`

```ts
import { defineRule } from "vee-validate";

defineRule("ruleName", (
  value: unknown,
  params: unknown[],
  ctx: { form: FormValues, field: string, name: string, label?: string },
) => true | string | Promise<true | string>);
```

返回 `true` 通过，返回字符串作错误消息。

### `configure(opts)`

全局配置：

```ts
import { configure } from "vee-validate";

configure({
  // 触发行为默认
  validateOnInput: false,
  validateOnBlur: true,
  validateOnChange: false,
  validateOnModelUpdate: true,

  // 错误消息生成器
  generateMessage: (ctx) => `${ctx.field} is invalid`,

  // 字段命名风格
  bails: true, // true: 第一条规则失败即停（默认）
});
```

## 声明式组件

### `<Form>`

| Prop                     | 类型                      | 说明                                            |
| ------------------------ | ------------------------- | ----------------------------------------------- |
| `validation-schema`      | `Schema / Function`       | 校验 schema                                     |
| `initial-values`         | `object`                  | 初始值                                          |
| `initial-errors`         | `object`                  | 初始错误                                        |
| `validate-on-mount`      | `boolean`                 | mount 即校验                                    |
| `keep-values`            | `boolean`                 | 卸载字段保留值                                  |
| `as`                     | `string`                  | 渲染为指定 tag（默认 `form`）                 |

| Slot prop                | 类型                              |
| ------------------------ | --------------------------------- |
| `values`                 | `FormValues`                      |
| `errors`                 | `Record<string, string>`          |
| `errorBag`               | `Record<string, string[]>`        |
| `meta`                   | `FormMeta`                        |
| `isSubmitting`           | `boolean`                         |
| `isValidating`           | `boolean`                         |
| `submitCount`            | `number`                          |
| `handleSubmit`           | `Function`                        |
| `resetForm`              | `Function`                        |
| `setFieldValue`          | `Function`                        |
| `setErrors`              | `Function`                        |
| `validate`               | `Function`                        |

### `<Field>`

| Prop                     | 类型                          | 说明                                          |
| ------------------------ | ----------------------------- | --------------------------------------------- |
| `name`                   | `string`                      | 必填，字段名                                  |
| `rules`                  | `string / object / Function`  | 字段级规则（模板字符串或函数）              |
| `as`                     | `string`                      | 渲染为指定 tag，默认 `input`                |
| `type`                   | `string`                      | input type                                    |
| `value`                  | -                             | 复选框/单选时设值                            |
| `unchecked-value`        | -                             | 复选框未选时的值                              |
| `standalone`             | `boolean`                     | 脱离 `<Form>` 校验上下文                    |
| `keep-value`             | `boolean`                     | 卸载保留值                                    |
| `validate-on-mount`      | `boolean`                     | mount 即校验该字段                            |
| `validate-on-blur`       | `boolean`                     | -                                             |
| `validate-on-input`      | `boolean`                     | -                                             |
| `validate-on-change`     | `boolean`                     | -                                             |

| Slot prop                | 类型                                              |
| ------------------------ | ------------------------------------------------- |
| `field`                  | `{ value, onInput, onBlur, onChange, ... }`     |
| `errors`                 | `string[]`                                        |
| `errorMessage`           | `string`                                          |
| `meta`                   | `FieldMeta`                                       |
| `handleChange`           | `Function`                                        |
| `handleBlur`             | `Function`                                        |
| `resetField`             | `Function`                                        |
| `setValue`               | `Function`                                        |
| `validate`               | `Function`                                        |

### `<ErrorMessage>`

```vue
<ErrorMessage name="email" class="text-red-500" as="p" />
```

| Prop | 类型     | 说明                          |
| ---- | -------- | ----------------------------- |
| `name` | `string` | 必填                        |
| `as`   | `string` | 渲染 tag，默认 `<span>`     |

无 slot props 时默认渲染错误文本；有 slot 时：

```vue
<ErrorMessage name="email" v-slot="{ message }">
  <p v-if="message" class="err">⚠️ {{ message }}</p>
</ErrorMessage>
```

### `<FieldArrayItems>`

v4.13+ 提供的声明式 FieldArray：

```vue
<FieldArrayItems name="links" v-slot="{ fields, push, remove, swap }">
  <div v-for="(item, idx) in fields" :key="item.key">
    <Field :name="`links[${idx}].url`" />
    <button @click="remove(idx)">×</button>
  </div>
  <button @click="push({ url: '' })">+</button>
</FieldArrayItems>
```

## 内置规则 (`@vee-validate/rules`)

```bash
pnpm add @vee-validate/rules
```

| 规则           | 参数                    | 作用                                         |
| -------------- | ----------------------- | -------------------------------------------- |
| `required`     | -                       | 必填（空字符串 / null / undefined 失败）    |
| `email`        | -                       | 邮箱格式                                     |
| `min`          | `number`                | 字符串最小长度 / 数字最小值                |
| `max`          | `number`                | 字符串最大长度 / 数字最大值                |
| `min_value`    | `number`                | 仅数字最小值                                 |
| `max_value`    | `number`                | 仅数字最大值                                 |
| `between`      | `min, max`              | 数字在区间内                                 |
| `length`       | `number`                | 字符串精确长度                               |
| `numeric`      | -                       | 仅数字                                       |
| `integer`      | -                       | 仅整数                                       |
| `decimal`      | `digits`                | 小数位                                       |
| `alpha`        | -                       | 仅字母                                       |
| `alpha_num`    | -                       | 字母 + 数字                                  |
| `alpha_dash`   | -                       | 字母 + 数字 + `-` + `_`                     |
| `alpha_spaces` | -                       | 字母 + 空格                                  |
| `url`          | -                       | URL 格式                                     |
| `regex`        | `pattern`               | 正则匹配                                     |
| `confirmed`    | `target`                | 与另一字段相等                               |
| `not_one_of`   | `values...`             | 不能是某些值                                 |
| `one_of`       | `values...`             | 必须是某些值之一                            |
| `image`        | -                       | File 是图片                                  |
| `mimes`        | `mime1, mime2`         | File MIME 校验                               |
| `size`         | `kb`                    | File 大小 ≤ kb                              |
| `dimensions`   | `width, height`         | 图片尺寸                                     |
| `ext`          | `ext1, ext2`           | 文件扩展名                                   |
| `is`           | `value`                 | 严格相等                                     |
| `is_not`       | `value`                 | 严格不等                                     |

注册全部：

```ts
import { defineRule } from "vee-validate";
import { all } from "@vee-validate/rules";

Object.entries(all).forEach(([k, r]) => defineRule(k, r));
```

按需注册：

```ts
import { required, email, min } from "@vee-validate/rules";

defineRule("required", required);
defineRule("email", email);
defineRule("min", min);
```

## Schema 适配器 API

### `@vee-validate/zod`

```ts
import { toTypedSchema } from "@vee-validate/zod";

toTypedSchema(zodSchema): TypedSchema
```

### `@vee-validate/yup`

```ts
import { toTypedSchema } from "@vee-validate/yup";

toTypedSchema(yupSchema): TypedSchema
```

### `@vee-validate/valibot`

```ts
import { toTypedSchema } from "@vee-validate/valibot";

toTypedSchema(valibotSchema): TypedSchema
```

### `@vee-validate/joi`

```ts
import { toTypedSchema } from "@vee-validate/joi";

toTypedSchema(joiSchema): TypedSchema
```

## i18n API

### `localize(messagesMap)`

```ts
import { localize } from "@vee-validate/i18n";
import zhCN from "@vee-validate/i18n/dist/locale/zh_CN.json";

const generateMessage = localize({
  "zh-CN": {
    ...zhCN,
    names: { email: "邮箱" },        // 字段显示名
    fields: {                         // 字段级覆盖
      email: { required: "邮箱不能为空" },
    },
  },
});

configure({ generateMessage });
```

### `setLocale(locale)`

```ts
import { setLocale } from "@vee-validate/i18n";

setLocale("en"); // 切语言
```

### 内置 locale 列表（部分）

```
ar, az, be, bg, bn, ca, cs, da, de, dv, el, en, eo, es, et, eu, fa, fi, fr, gl,
he, hi, hr, hu, hy, id, it, ja, ka, kk, km, ko, ku, lt, lv, mk, mn, ms, my, nb,
ne, nl, no, pa, pl, pt_BR, pt_PT, ro, ru, sk, sl, sq, sr, sr_Cyrl, sv, ta, th,
tr, uk, uz, vi, zh_CN, zh_TW
```

按需 import：

```ts
import zhCN from "@vee-validate/i18n/dist/locale/zh_CN.json";
import en from "@vee-validate/i18n/dist/locale/en.json";
```

## Nuxt 模块 (`@vee-validate/nuxt`)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@vee-validate/nuxt"],
  veeValidate: {
    autoImports?: boolean,           // 自动 import useForm / useField 等
    componentNames?: {               // 重命名内置组件（避免冲突）
      Form?: string,
      Field?: string,
      FieldArray?: string,
      ErrorMessage?: string,
    },
  },
});
```

## TypeScript 工具类型

```ts
import type {
  FieldMeta,
  FormMeta,
  ValidationResult,
  FormValidationResult,
  GenericValidateFunction,
  TypedSchema,
  PathValue,
  Path,
} from "vee-validate";

// 取 schema 推导出的 form values 类型
type Values = z.infer<typeof zodSchema>;
```

## 触发时机决策表

| 用户场景                  | 推荐触发                                  |
| ------------------------- | ----------------------------------------- |
| 邮箱、用户名等格式校验    | `validateOnBlur: true`（输入完才校验）  |
| 密码强度提示              | `validateOnInput: true`（实时反馈）      |
| 数字范围                  | `validateOnChange: true`                  |
| 异步唯一性（如邮箱已注册）| `validateOnBlur` + debounce              |
| 跨字段依赖（如二次密码）  | 任一字段改变都校验，`validateOnInput`    |
| 整表 / 大型校验           | `validateOnInput: false`，仅 submit 校验|

## 与其它表单库对比

| 库              | 风格           | TS 支持 | 适配器       | 包体  | 推荐场景                          |
| --------------- | -------------- | ------- | ------------ | ----- | --------------------------------- |
| **vee-validate**| 声明 + Composition | ★★★    | Zod/Yup/Valibot/Joi | ~20KB | Vue 项目复杂表单首选              |
| FormKit         | 全配置驱动     | ★★      | 自家 schema  | ~70KB | 大量重复表单（CMS / 后台）        |
| Naive UI Form   | 内置           | ★★      | Yup 风格     | -     | 用 Naive UI 时直接用             |
| Element Form    | 内置           | ★       | async-validator | -   | 用 Element Plus 时直接用         |
| Custom（ref）  | 手写           | -       | 任意         | <1KB  | 1-3 字段的简单表单                |

## 性能基线

参考数字（M1 MacBook，Chrome 122）：

| 操作                          | 耗时       |
| ----------------------------- | ---------- |
| `useForm` 创建                | < 1ms      |
| 单字段校验（同步规则）        | < 0.5ms    |
| 单字段校验（Zod schema 命中） | 1-3ms      |
| FieldArray push 100 项        | ~50ms      |
| FieldArray push 1000 项       | 500ms+（建议虚拟滚动）|
| 整表 validate（50 字段）       | 10-30ms    |
| 异步规则（含 fetch）          | 网络 RTT  |

## 版本里程碑

| 版本 | 时间    | 主要变化                                                        |
| ---- | ------- | --------------------------------------------------------------- |
| v3   | 2020    | Vue 2 时代，Provider / ValidationObserver 组件式               |
| v4.0 | 2021    | 重写为 Vue 3 原生，提供 useForm / useField                     |
| v4.10| 2023    | `defineField` 替代 `useFieldModel`                             |
| v4.11| 2023    | 标准化 Composition API 触发选项                                |
| v4.13| 2024    | `<FieldArrayItems>` 声明式 FieldArray                         |
| v4.14| 2024    | TypedSchema 推导改进                                           |
| v4.15| 2025    | `keepValuesOnUnmount` 表单级配置                              |

## 参考链接

- [vee-validate 官方文档](https://vee-validate.logaretm.com/v4/)
- [GitHub](https://github.com/logaretm/vee-validate)
- [`@vee-validate/rules`](https://vee-validate.logaretm.com/v4/guide/global-validators/#available-rules)
- [Zod 文档](https://zod.dev/)
- [Yup 文档](https://github.com/jquense/yup)
- [Valibot 文档](https://valibot.dev/)
- [示例仓库](https://github.com/logaretm/vee-validate-examples)
