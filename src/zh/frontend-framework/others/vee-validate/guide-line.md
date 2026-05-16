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

## Composition API：`useForm` + `defineField`

v4 之后官方推荐 Composition API 写法（声明式仅作补充）。`defineField` 是 v4.10+ 推荐用法，替代裸 `useField`。

### 基础

```vue
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

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: schema,
  initialValues: { email: "", password: "" },
});

// defineField 返回 [model, attrs]
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

const onSubmit = handleSubmit((values) => {
  console.log(values);
});
</script>

<template>
  <form @submit="onSubmit">
    <input v-model="email" v-bind="emailAttrs" />
    <span class="err">{{ errors.email }}</span>

    <input type="password" v-model="password" v-bind="passwordAttrs" />
    <span class="err">{{ errors.password }}</span>

    <button>提交</button>
  </form>
</template>
```

`v-bind="emailAttrs"` 把 `onBlur`、`onChange`、`onInput` 等事件绑定到 input，触发校验。

### `defineField` 第二参数：行为定制

```ts
const [email, emailAttrs] = defineField("email", {
  // 校验触发：'blur' | 'change' | 'input' | 'submit'
  validateOnInput: true,    // 输入即校验（默认 false，blur 时校验）
  validateOnBlur: false,
  validateOnChange: false,
  validateOnModelUpdate: false,

  // model 类型转换（如 input type=number 默认是 string，强转 number）
  props: (state) => ({
    "onUpdate:modelValue": (v: string) => {
      state.value = v === "" ? "" : Number(v);
    },
  }),
});
```

::: tip 全局默认行为

在 `configure()` 中设全局：

```ts
import { configure } from "vee-validate";

configure({
  validateOnInput: false,
  validateOnBlur: true,
  validateOnChange: false,
  validateOnModelUpdate: true,
});
```

:::

### 表单级方法

`useForm` 返回的工具方法：

| 方法                                  | 作用                                            |
| ------------------------------------- | ----------------------------------------------- |
| `handleSubmit(onValid, onInvalid?)`   | 包装 submit handler，自动校验                  |
| `submitForm()`                        | 程序触发 submit                                |
| `resetForm({ values, errors })`       | 重置表单状态                                    |
| `setValues(partial)`                  | 批量设置字段值                                 |
| `setFieldValue(name, value)`          | 设置单个字段                                    |
| `setErrors(partial)`                  | 设置多个错误（服务端错误回填）                |
| `setFieldError(name, message)`        | 设置单字段错误                                  |
| `validate(opts)`                      | 手动触发校验                                    |
| `validateField(name)`                 | 校验单字段                                      |
| `useFieldModel(name)`                 | 拿到字段 model（少用，defineField 已替代）     |

### Reactive 状态

```ts
const {
  values,         // ComputedRef<FormValues>
  errors,         // ComputedRef<Record<string, string>>
  errorBag,       // ComputedRef<Record<string, string[]>>（含每字段全部错误）
  meta,           // ComputedRef<FormMeta>
  isSubmitting,   // Ref<boolean>
  isValidating,   // Ref<boolean>
  submitCount,    // Ref<number>
  isFieldDirty,   // (name) => boolean
  isFieldTouched, // (name) => boolean
  isFieldValid,   // (name) => boolean
} = useForm({ validationSchema });
```

`meta` 字段：

```ts
{
  valid: boolean,      // 整表是否合法
  dirty: boolean,      // 至少一个字段被改过
  touched: boolean,    // 至少一个字段被 blur 过
  pending: boolean,    // 异步校验进行中
  initialValues: ...,  // 初值
}
```

## 异步校验

### 异步规则函数

```ts
defineRule("uniqueEmail", async (value: string) => {
  if (!value) return true;
  const { exists } = await api.get(`/check-email?email=${value}`);
  return exists ? "邮箱已被注册" : true;
});
```

异步校验时 `isValidating: true`，submit 会等校验完成。

### Debounce 异步规则

vee-validate 不内置 debounce，需自己 wrap：

```ts
import { useDebounceFn } from "@vueuse/core";

const checkEmail = useDebounceFn(async (email: string) => {
  const { exists } = await api.get(`/check-email?email=${email}`);
  return !exists;
}, 500);

defineRule("uniqueEmail", async (value: string) => {
  if (!value) return true;
  return (await checkEmail(value)) || "邮箱已被注册";
});
```

::: warning 异步校验性能

频繁触发的异步校验（每输入一字符发请求）易压垮后端。建议：

1. 仅在 `blur` 触发（`validateOnInput: false`）
2. 加 debounce（500ms+）
3. 服务端用专门「校验唯一性」端点，别用通用搜索接口
4. 客户端先做基础校验（格式、长度），通过后才发请求

:::

## Zod / Yup / Valibot 适配深入

### Zod 完整示例

```ts
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const schema = toTypedSchema(
  z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      confirmPassword: z.string(),
      age: z.coerce.number().int().min(18).max(120),
      hobbies: z.array(z.string()).min(1, "至少选一个"),
      address: z.object({
        country: z.string(),
        city: z.string().optional(),
      }),
      birthday: z.date().optional(),
      agreement: z.literal(true, {
        errorMap: () => ({ message: "请同意条款" }),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "两次密码不一致",
      path: ["confirmPassword"], // 错误归到 confirmPassword
    }),
);

const { defineField, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    email: "",
    password: "",
    confirmPassword: "",
    age: 18,
    hobbies: [],
    address: { country: "" },
    agreement: false,
  },
});
```

### Zod 高级：discriminated union

不同 type 字段对应不同结构：

```ts
const schema = toTypedSchema(
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("personal"), name: z.string() }),
    z.object({ type: z.literal("company"), companyName: z.string(), taxId: z.string() }),
  ]),
);
```

vee-validate 切换 `type` 时自动加载对应字段的校验。

### Yup 嵌套

```ts
import * as yup from "yup";

const schema = toTypedSchema(
  yup.object({
    user: yup.object({
      profile: yup.object({
        name: yup.string().required("必填"),
        age: yup.number().min(0, "不能为负"),
      }),
    }),
  }),
);

// 字段名用点号路径
defineField("user.profile.name");
defineField("user.profile.age");
```

### Valibot（包体最小）

```ts
import { toTypedSchema } from "@vee-validate/valibot";
import * as v from "valibot";

const schema = toTypedSchema(
  v.object({
    email: v.pipe(v.string(), v.email("邮箱格式不正确")),
    age: v.pipe(v.number(), v.minValue(18, "未成年")),
  }),
);
```

| 库      | min bundle | 适合                                           |
| ------- | ---------- | ---------------------------------------------- |
| Zod     | ~57KB      | TS-first，文档生态最强，跨端共享 schema 首选  |
| Yup     | ~45KB      | 老项目，文档多，社区扩展丰富                   |
| Valibot | ~3KB       | bundle 极致敏感场景（移动端 / SDK 集成）      |

## FieldArray 进阶

### 全部方法

```ts
const {
  fields,    // FieldEntry[]（{ key, value, isFirst, isLast }）
  push,      // (item) => void
  prepend,   // (item) => void：插队首
  insert,    // (idx, item) => void
  remove,    // (idx) => void
  swap,      // (idxA, idxB) => void
  move,      // (oldIdx, newIdx) => void
  replace,   // (newItems) => void：整数组替换
  update,    // (idx, item) => void：替换单项
} = useFieldArray<Link>("links");
```

### 嵌套 FieldArray

```ts
// schema：分组 → 链接
const schema = toTypedSchema(
  z.object({
    groups: z.array(
      z.object({
        title: z.string(),
        links: z.array(z.object({ label: z.string(), url: z.string().url() })),
      }),
    ),
  }),
);

const { fields: groups } = useFieldArray("groups");
```

模板：

```vue
<template>
  <div v-for="(group, gi) in groups" :key="group.key">
    <Field :name="`groups[${gi}].title`" />
    <FieldArrayItems :name="`groups[${gi}].links`" v-slot="{ fields, push, remove }">
      <div v-for="(link, li) in fields" :key="link.key">
        <Field :name="`groups[${gi}].links[${li}].url`" />
        <button @click="remove(li)">×</button>
      </div>
      <button @click="push({ label: '', url: '' })">+ 链接</button>
    </FieldArrayItems>
  </div>
</template>
```

::: tip `<FieldArrayItems>` vs `useFieldArray`

声明式组件 `<FieldArrayItems>` 仅 v4.13+ 支持。也可在子组件用 `useFieldArray('groups[' + idx + '].links')` 编程式访问。两种风格选其一。

:::

## 路由 / 跨页面表单

### 多步向导（Wizard）

```ts
// 父组件
const { handleSubmit, values, setFieldValue } = useForm({
  validationSchema: stepSchemas[currentStep.value],
  keepValuesOnUnmount: true, // 关键：切 step 时字段卸载但保留值
});
```

`keepValuesOnUnmount: true` 是 v4.15 起的字段——切到下一步时上一步的字段虽 unmount，值仍保留在 `values` 中。最终 submit 拿到完整数据。

### Pinia 共享表单 state

跨多个页面用同一表单（如改 Profile 散落多个 tab）：

```ts
// stores/profile-form.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useProfileFormStore = defineStore("profileForm", () => {
  const draft = ref<Partial<Profile>>({});

  function save(patch: Partial<Profile>) {
    Object.assign(draft.value, patch);
  }

  return { draft, save };
});
```

页面组件：

```ts
const store = useProfileFormStore();
const { defineField, values } = useForm({
  initialValues: store.draft,
  validationSchema: schema,
});

watch(values, (v) => store.save(v), { deep: true });
```

## Devtools

```bash
pnpm add -D @vee-validate/devtools
```

```ts
// main.ts
import { devtools } from "@vee-validate/devtools";

if (import.meta.env.DEV) devtools(); // 仅 dev 启用
```

Vue DevTools 多出 "vee-validate" 标签：

- 列出所有 `useForm` 实例
- 每实例展开看 `values` / `errors` / `meta`
- 实时刷新（输入即更新）
- 一键 reset 表单

## 自定义校验插件

封装一组业务规则（如「省份+城市级联」）成 plugin：

```ts
// validators/business.ts
import { defineRule } from "vee-validate";

export function setupBusinessValidators() {
  defineRule("chinaMobile", (value: string) => {
    if (!value) return true;
    return /^1[3-9]\d{9}$/.test(value) || "手机号格式不正确";
  });

  defineRule("provinceCity", (value, [provinceField], ctx) => {
    const province = ctx.form[provinceField];
    if (!province) return "请先选省份";
    const allowedCities = cityMap[province];
    return allowedCities.includes(value) || "城市不属于该省份";
  });
}

// main.ts
import { setupBusinessValidators } from "./validators/business";
setupBusinessValidators();
```

## 与组件库集成

### Element Plus

```vue
<Field name="role" v-slot="{ field, errors }">
  <el-form-item :error="errors[0]">
    <el-select v-bind="field">
      <el-option value="admin" label="管理员" />
    </el-select>
  </el-form-item>
</Field>
```

或用 `defineField` + `el-form-item`：

```vue
<script setup lang="ts">
const [role, roleAttrs] = defineField("role");
</script>

<template>
  <el-form-item :error="errors.role">
    <el-select v-model="role" v-bind="roleAttrs">
      <!-- ... -->
    </el-select>
  </el-form-item>
</template>
```

### Naive UI / Ant Design Vue

类似，关键是 `v-model` 绑值 + `v-bind="attrs"` 绑事件。

## 性能优化

### Schema 复用

```ts
// ❌ 每次渲染都新建 schema
const { values } = useForm({
  validationSchema: toTypedSchema(z.object({ /* ... */ })),
});

// ✅ schema 模块级常量
const SCHEMA = toTypedSchema(z.object({ /* ... */ }));

const { values } = useForm({ validationSchema: SCHEMA });
```

### 大列表 FieldArray

字段 >100 时 `useFieldArray` 每项 reactivity 开销叠加。优化：

1. **虚拟滚动**：只渲染可见部分（`vue-virtual-scroller`），但要保证不可见项的 schema 也校验
2. **延迟校验**：`validateOnInput: false`，仅 submit 触发
3. **分页校验**：滚到末尾才触发该段校验

### 服务端校验前置

复杂校验（如「订单总价是否 ≥ 100」涉及多字段计算）放服务端，前端只校验单字段格式 → 减小客户端 schema 复杂度，整表 valid 等服务端响应。

## ESLint / 工具链整合

无官方 eslint plugin，但可借 `@vue/eslint-plugin-vue` 通用规则约束：

```json
{
  "rules": {
    "@typescript-eslint/no-floating-promises": "error" // 防 onSubmit 漏 await
  }
}
```

## 与原生 HTML5 校验对比

vee-validate 与浏览器内置 `:invalid` / `pattern` 校验**互不冲突但目的不同**：

| 维度          | HTML5 原生               | vee-validate              |
| ------------- | ------------------------ | ------------------------- |
| 触发          | 提交 / 焦点              | 可控（input/blur/submit）|
| 消息          | 浏览器默认（不可改文案）| 完全自定义                |
| 跨字段        | ✗                        | ✓                         |
| 异步校验      | ✗                        | ✓                         |
| 国际化        | 受浏览器语言限制         | 完全可控                  |
| 提交阻断      | `<form>` 默认阻断        | 可控（`handleSubmit`）   |
| schema 复用   | ✗                        | ✓（Zod / Yup 共享）     |

如果只是 demo / 内部工具，可直接 HTML5。生产项目几乎都需要 vee-validate 这层。

## 错误恢复模式

服务端 422 错误（业务规则失败）回填：

```ts
const onSubmit = handleSubmit(async (values, { setErrors, resetForm }) => {
  try {
    const result = await api.post("/users", values);
    resetForm();
    router.push(`/users/${result.id}`);
  } catch (err) {
    if (err.response?.status === 422) {
      // 服务端返回 { errors: { email: '已注册', ... } }
      setErrors(err.response.data.errors);
    } else {
      ElMessage.error("提交失败，请重试");
    }
  }
});
```

服务端错误**不影响 schema-level meta.valid**——vee-validate 把它当外部错误处理。用户改字段后错误自动清除（schema-level 重新校验通过即清）。
