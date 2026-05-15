---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 vee-validate v4 编写

## 速查

- 声明式：`<Form :validation-schema>` + `<Field name>` + `<ErrorMessage name>`
- 动态字段：`useFieldArray('items')` → `{ fields, push, remove, swap, insert, move, replace }`
- 全局规则：`defineRule('required', fn)`，模板 `rules="required|min:8"`
- 跨字段：`rules="confirmed:@password"`（`@` 引用其它字段值）
- 内置规则包：`import { all } from '@vee-validate/rules'`
- 错误国际化：`@vee-validate/i18n` + `configure({ generateMessage: localize(...) })`
- Schema 类型推导：`toTypedSchema(z.object({...}))`，`values` / submit 参数自动带类型
- 调试：装 `@vee-validate/devtools` 后 Vue Devtools 多出 vee-validate 面板
- SSR / Nuxt：直接装 `@vee-validate/nuxt` 模块，自动注册 `<Field>` 等组件
- 测试：用 `@vue/test-utils` 直接挂载，`flushPromises()` 等异步校验结束再断言

## 声明式组件

`<Form>` / `<Field>` / `<ErrorMessage>` 是组合 API 的同等替代品，适合简单表单或模板偏好者。

### 基础

```vue
<script setup lang="ts">
import { Form, Field, ErrorMessage } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const schema = toTypedSchema(
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
);

function onSubmit(values: { email: string; password: string }) {
  console.log(values);
}
</script>

<template>
  <Form :validation-schema="schema" @submit="onSubmit">
    <Field name="email" type="email" />
    <ErrorMessage name="email" class="err" />

    <Field name="password" type="password" />
    <ErrorMessage name="password" class="err" />

    <button>提交</button>
  </Form>
</template>
```

### `<Form>` 的 slot props

整表状态可以从默认 slot 拿：

```vue
<Form v-slot="{ values, errors, meta, isSubmitting }">
  <pre>{{ values }}</pre>
  <button :disabled="!meta.valid || isSubmitting">提交</button>
</Form>
```

常用 slot props：`values` / `errors` / `errorBag` / `meta` / `isSubmitting` / `isValidating` / `submitCount` / `handleSubmit` / `resetForm` / `setFieldValue` / `validate`。

### `<Field>` 自定义渲染

接入第三方组件时用 `v-slot`：

```vue
<Field name="role" v-slot="{ field, errors }">
  <ElSelect v-bind="field">
    <ElOption value="admin">管理员</ElOption>
    <ElOption value="user">普通用户</ElOption>
  </ElSelect>
  <span class="err">{{ errors[0] }}</span>
</Field>
```

`field` 包含 `value` / `onInput` / `onBlur` / `onChange`，`v-bind` 一把梭。

`<Field>` 还有几个有用的 prop：

- `as="select"`：直接当 `<select>` 渲染
- `type="checkbox" :value="..." :unchecked-value="..."`：复选框 / 单选自动收集
- `standalone`：脱离 `<Form>` 上下文（独立校验，不计入 submit）
- `keep-value`：组件卸载后保留值（用于多步表单）

## 动态字段（FieldArray）

`useFieldArray` 处理"链接列表"、"标签 / 教育经历"等可增删的数组字段：

```ts
import { useForm, useFieldArray } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const schema = toTypedSchema(
  z.object({
    links: z
      .array(
        z.object({
          label: z.string().min(1),
          url: z.string().url(),
        }),
      )
      .min(1, "至少一条"),
  }),
);

useForm({
  validationSchema: schema,
  initialValues: { links: [{ label: "", url: "" }] },
});

const { fields, push, remove, swap, move } = useFieldArray<{
  label: string;
  url: string;
}>("links");
```

```vue
<template>
  <div v-for="(item, idx) in fields" :key="item.key">
    <Field :name="`links[${idx}].label`" placeholder="标题" />
    <Field :name="`links[${idx}].url`" placeholder="URL" />
    <button @click="remove(idx)" :disabled="item.isFirst">删除</button>
  </div>
  <button @click="push({ label: '', url: '' })">+ 新增</button>
</template>
```

`fields` 是只读响应式数组，每项是 `FieldEntry`，含 `key`（稳定）、`value`、`isFirst`、`isLast`。

::: warning 数组路径用方括号

字段名一定要写成 `links[0].url`（带方括号），不能用 `links.0.url`。后者 vee-validate 会按对象路径解析，不会归到数组里。

:::

## 全局规则

适合 Laravel 风格短表单，避免每个表单重写 schema。

### 自定义一条

```ts
// main.ts
import { defineRule } from "vee-validate";

defineRule("required", (value) => {
  if (value === null || value === undefined || value === "") {
    return "此项必填";
  }
  return true;
});

defineRule("minLength", (value: string, [limit]: [number]) => {
  if (!value) return true; // 空值交给 required
  return value.length >= limit || `至少 ${limit} 个字符`;
});
```

模板里管道串联：

```vue
<Field name="username" rules="required|minLength:6" />
```

### 跨字段

第三个参数能拿到表单上下文：

```ts
defineRule("confirmed", (value, [target]: [string], ctx) => {
  return value === ctx.form[target] || "两次密码不一致";
});
```

```vue
<Field name="password" />
<Field name="confirm" rules="confirmed:@password" />
<!-- 注意 @ 前缀引用同表单其它字段 -->
```

### 直接用内置规则包

```ts
import { defineRule } from "vee-validate";
import { all } from "@vee-validate/rules";

Object.entries(all).forEach(([name, rule]) => {
  defineRule(name, rule);
});
```

包含 `required` / `email` / `min` / `max` / `numeric` / `url` / `regex` / `confirmed` / `image` / `mimes` / `size` 等 30+ 规则。

## 错误消息本地化

```ts
// main.ts
import { configure, defineRule } from "vee-validate";
import { all } from "@vee-validate/rules";
import { localize, setLocale } from "@vee-validate/i18n";
import zhCN from "@vee-validate/i18n/dist/locale/zh_CN.json";
import en from "@vee-validate/i18n/dist/locale/en.json";

Object.entries(all).forEach(([k, r]) => defineRule(k, r));

configure({
  generateMessage: localize({
    "zh-CN": {
      ...zhCN,
      names: { email: "邮箱地址" }, // 字段显示名
    },
    en,
  }),
});

setLocale("zh-CN");
```

切换语言用 `setLocale('en')`，已有错误会按新规则重新生成。

::: tip 与 Vue I18n 联动

如果项目里已经用了 Vue I18n，可以把 `generateMessage` 接到 vue-i18n 的 `t()` 上，避免维护两套字典：

```ts
import { i18n } from "./i18n";

configure({
  generateMessage: ({ field, rule }) =>
    i18n.global.t(`validation.${rule!.name}`, { field, params: rule!.params }),
});
```

:::

## Schema 适配器对比

| 适配器                  | Schema 库 | 包体积  | 类型推导 | 备注                                  |
| ----------------------- | --------- | ------- | -------- | ------------------------------------- |
| `@vee-validate/zod`     | Zod       | ★★      | ★★★      | 主流首选，TS-first                    |
| `@vee-validate/yup`     | Yup       | ★★      | ★★       | 老牌库，文档最多                      |
| `@vee-validate/valibot` | Valibot   | ★（最小） | ★★★      | tree-shake 友好，新项目可考虑         |

三个适配器都暴露 `toTypedSchema(schema)`，用法完全一致：

```ts
import { toTypedSchema } from "@vee-validate/yup";
import * as yup from "yup";

const schema = toTypedSchema(
  yup.object({
    age: yup.number().required().min(18, "未成年"),
  }),
);
```

::: warning 别从 Yup 整包导入

```ts
import * as yup from "yup"; // ❌ 打包后 ~50 KB
import { object, string, number } from "yup"; // ✅ tree-shake 友好
```

vee-validate 官方在最佳实践里点名了这一条。

:::

## TypeScript 集成

`toTypedSchema` 会把 schema 的输入 / 输出类型反推到 `useForm`：

```ts
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const schema = toTypedSchema(
  z.object({
    email: z.string().email(),
    age: z.coerce.number().min(18),
  }),
);

const { values, handleSubmit } = useForm({ validationSchema: schema });

handleSubmit((vals) => {
  vals.email; // string
  vals.age; // number（zod coerce 后）
});
```

`values.value` 同样带类型，IDE 自动补全嵌套字段路径。

## 提交状态管理

```ts
const { handleSubmit, isSubmitting, submitCount } = useForm({ validationSchema });

const onSubmit = handleSubmit(async (values, { resetForm, setErrors }) => {
  try {
    await api.post("/login", values);
    resetForm();
  } catch (e) {
    setErrors(e.response.data); // { email: '已注册', password: '...' }
  }
});
```

`isSubmitting` 会在异步回调完成前一直 `true`，按钮 `:disabled` 直接拿来用。

`submitCount` 不论成败都加 1，可以用来做"连续点击三次还有问题就直接弹支持"这种交互。

## SSR / Nuxt 集成

Nuxt 用官方模块，自动注册组件：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@vee-validate/nuxt"],
  veeValidate: {
    autoImports: true, // 自动 import useForm 等
    componentNames: { Form: "VForm", Field: "VField" }, // 重命名避免冲突
  },
});
```

非 Nuxt 的 SSR 项目（VitePress、Astro 之类）正常用即可，vee-validate 没有副作用模块。

## 测试

```ts
import { mount, flushPromises } from "@vue/test-utils";
import LoginForm from "./LoginForm.vue";

it("校验失败时不调用 submit", async () => {
  const wrapper = mount(LoginForm);
  await wrapper.find("form").trigger("submit");
  await flushPromises(); // 等异步校验结束

  expect(wrapper.text()).toContain("邮箱格式不正确");
  expect(submitHandler).not.toHaveBeenCalled();
});
```

要点：触发 submit 后必须 `await flushPromises()`，否则错误消息和 `errors` 还没就绪。

## 常见陷阱

- **`useField` 单独用**：v4 起 `defineField` 才是正解，`useField` 没有外层 `useForm` 时不参与提交。
- **`v-model` 和 `v-bind="attrs"` 同时绑值**：用 `defineField` 已经返回 `[model, attrs]`，分别绑 `v-model="model"` 和 `v-bind="attrs"`，别把 `attrs` 里的 `onUpdate:modelValue` 拿掉。
- **Yup `shape` 在 v1+ 不存在**：直接 `yup.object({...})`，老文档里的 `yup.object().shape({...})` 还能用但不必。
- **Zod `refine` 跨字段缺值不触发**：表单初始空值时 `refine` 拿到 `undefined`，建议把 `refine` 写在 `superRefine` 里加 `if (!data.x) return;` 提前 return。
- **`setErrors` 后 `meta.valid` 仍 true**：因为 schema 没失败；这是 vee-validate 设计——服务端错误属于"外部错误"，不影响 schema-level meta。

## 何时用 vee-validate

适合：

- 字段超过 5 个、需要复杂校验关系（跨字段、动态依赖）
- 已经选了 Zod / Yup 做 API schema，想前后端共享
- 多语言项目（内置 i18n + 字段名映射）

不太需要：

- 只有 1-2 个输入框，自己 `ref()` + 简单 `v-if` 也能搞定
- 表单结构高度动态（schema 每次都重生成），vee-validate 的反应性优势打折
- 项目已经用 FormKit / Naive UI Form 的话，没必要再多加一层校验库
