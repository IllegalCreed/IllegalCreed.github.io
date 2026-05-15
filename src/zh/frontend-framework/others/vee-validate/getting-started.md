---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 vee-validate v4 编写

## 速查

- 安装：`pnpm add vee-validate`（v4.15+，需 Vue 3.4+）
- 表单上下文：`const { values, errors, defineField, handleSubmit } = useForm({ validationSchema })`
- 单字段：`const [name, nameAttrs] = defineField('name')`
- 模板绑定：`<input v-model="name" v-bind="nameAttrs">`
- Schema 库：`@vee-validate/yup` / `@vee-validate/zod` / `@vee-validate/valibot`，配合 `toTypedSchema()`
- 提交：`const onSubmit = handleSubmit(values => ...)`，验证通过才执行
- 重置：`resetForm({ values?, errors?, touched? })`
- 字段元信息：`meta.value.{ valid, touched, dirty, pending }`（整表）；`useField` 同名返回字段级
- 动态字段：`useFieldArray('links')` → `{ fields, push, remove, swap, move, insert }`

## 安装

```bash
pnpm add vee-validate
# 选一个 schema 适配器：
pnpm add zod @vee-validate/zod
pnpm add yup @vee-validate/yup
pnpm add valibot @vee-validate/valibot
```

::: tip 版本与 Vue 兼容

| vee-validate | Vue       | 状态                             |
| ------------ | --------- | -------------------------------- |
| v4.15.x      | Vue 3.4+  | **当前主线**，长期维护           |
| v4.13–4.14   | Vue 3.x   | 仍可用，建议升级                 |
| v3.x         | Vue 2.x   | 维护停止，新项目不要选           |

v3 → v4 是完全重写，API 和组件名都变了，迁移成本相当于换库；存量 Vue 2 项目要么留 v3，要么连同框架一起升级。

:::

## 三种使用风格

vee-validate v4 提供三种风格，可以混用，按场景选：

| 风格            | 入口                                    | 适合                                   |
| --------------- | --------------------------------------- | -------------------------------------- |
| Composition API | `useForm` / `useField` / `useFieldArray`| `<script setup>`、复杂表单、需要完整类型推导 |
| 声明式组件      | `<Form>` / `<Field>` / `<ErrorMessage>` | 简单表单、原型、SSR                    |
| Field + slot    | `<Field v-slot="{ field, errors }">`    | 接入第三方组件、需要自定义渲染         |

文档主推 Composition API，下面以它为主，组件用法见[指南](./guide-line.md#声明式组件)。

## Composition API 基本流程

```ts
// schema：先定义 + toTypedSchema，类型反推到 values
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const schema = toTypedSchema(
  z.object({
    email: z.string().email("邮箱格式不正确"),
    password: z.string().min(8, "至少 8 位"),
  }),
);

// 上下文：通过 useForm 拿到所有方法
const { values, errors, defineField, handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: { email: "", password: "" },
});

// 字段：defineField 返回 [model, attrs]，attrs 自动包含 onBlur 等
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

// 提交：handleSubmit 包装回调，校验通过才执行
const onSubmit = handleSubmit(async (vals) => {
  await api.login(vals);
});
```

```vue
<template>
  <form @submit="onSubmit">
    <input v-model="email" v-bind="emailAttrs" />
    <span v-if="errors.email">{{ errors.email }}</span>

    <input v-model="password" v-bind="passwordAttrs" type="password" />
    <span v-if="errors.password">{{ errors.password }}</span>

    <button :disabled="isSubmitting">提交</button>
  </form>
</template>
```

::: warning `defineField` vs 旧的 `useField`

v4.10 起官方推荐用 `useForm` + `defineField`，**不再推荐**单独调用顶层 `useField`。后者需要嵌在 `<Form>` 或外层 `useForm` 作用域里，独立用容易出错（无表单上下文时不校验、不参与提交）。新代码直接用 `defineField`。

:::

## 校验时机

默认行为：

- 首次校验：input 时（`validateOnInput: true`）
- 失焦再校验：blur 时（`validateOnBlur: true`）
- 值变更：v-model 时（`validateOnModelUpdate: true`）

太激进时改成"出错前 blur 校验，出错后 input 校验"（推荐 UX）：

```ts
const [email, emailAttrs] = defineField("email", (state) => ({
  validateOnModelUpdate: state.errors.length > 0,
}));
```

完全交给 submit：

```ts
const [email, emailAttrs] = defineField("email", {
  validateOnModelUpdate: false,
  validateOnBlur: false,
});
```

## 错误与状态

`useForm` 返回的几个常用 ref：

| 字段            | 类型                          | 说明                                       |
| --------------- | ----------------------------- | ------------------------------------------ |
| `values`        | `Ref<TFormValues>`            | 当前所有字段值（只读，禁止直接 mutate）    |
| `errors`        | `Ref<Record<string, string>>` | 每个字段的第一条错误（按 name 索引）       |
| `meta`          | `Ref<{...}>`                  | 整表元数据：`valid` / `touched` / `dirty` / `pending` |
| `isSubmitting`  | `Ref<boolean>`                | submit 进行中（含异步回调）                |
| `submitCount`   | `Ref<number>`                 | submit 触发次数（不论成败）                |

只想显示 touched 后的错误（避免一进页面就红字）：

```vue
<span v-if="meta.touched && errors.email">{{ errors.email }}</span>
```

## 提交与重置

```ts
const onSubmit = handleSubmit(
  async (values, actions) => {
    try {
      await api.post(values);
      actions.resetForm();
    } catch (err) {
      actions.setErrors(err.response.data); // { email: '已注册', ... }
    }
  },
  // 第二个参数：校验失败回调
  ({ errors }) => {
    console.log("失败字段：", Object.keys(errors));
  },
);
```

`actions` 对象上常用方法：`setFieldValue` / `setValues` / `setFieldError` / `setErrors` / `setFieldTouched` / `resetForm`。

## 一份能跑的最小示例

```vue
<!-- LoginForm.vue -->
<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const schema = toTypedSchema(
  z.object({
    email: z.string().email("邮箱格式不正确"),
    password: z.string().min(8, "至少 8 位"),
  }),
);

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: schema,
});

const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

const onSubmit = handleSubmit((values) => {
  console.log("提交：", values);
});
</script>

<template>
  <form @submit="onSubmit" novalidate>
    <label>
      邮箱
      <input v-model="email" v-bind="emailAttrs" />
    </label>
    <p v-if="errors.email" class="err">{{ errors.email }}</p>

    <label>
      密码
      <input v-model="password" v-bind="passwordAttrs" type="password" />
    </label>
    <p v-if="errors.password" class="err">{{ errors.password }}</p>

    <button :disabled="isSubmitting">登录</button>
  </form>
</template>
```

## 下一步

- 声明式 `<Form>` / `<Field>` / `<ErrorMessage>` 用法见 [指南 - 声明式组件](./guide-line.md#声明式组件)
- 动态字段 `useFieldArray` 见 [指南 - 动态字段](./guide-line.md#动态字段-fieldarray)
- 全局规则与 Laravel 风格 `rules="required|email"` 见 [指南 - 全局规则](./guide-line.md#全局规则)
- 错误消息本地化见 [指南 - 错误消息本地化](./guide-line.md#错误消息本地化)
- TypeScript 类型推导见 [指南 - TypeScript 集成](./guide-line.md#typescript-集成)
