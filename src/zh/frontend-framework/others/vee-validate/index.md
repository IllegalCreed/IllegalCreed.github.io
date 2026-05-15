---
layout: doc
---

# Vee-validate

Vue 生态最流行的表单库，由 Abdelrahman Awad 维护。它只负责"表单状态与校验"——不提供 UI 控件，而是把字段值收集、错误聚合、提交流转、reset/dirty/touched 等抽象成可组合 API，让你自由搭配 Yup / Zod / Valibot 等任意 schema 库与 Element Plus、Naive UI、Vuetify 等任意组件库。

## 评价

**优点**

- Composition API（`useForm` / `useField` / `useFieldArray`）类型完整，与 `<script setup>` 集成顺畅，schema 还能反向推导出 `values` 类型
- 解耦彻底——既支持声明式组件（`<Form>` / `<Field>` / `<ErrorMessage>`），也支持纯 hooks；同一项目可混用
- 通过 `@vee-validate/yup` / `@vee-validate/zod` / `@vee-validate/valibot` 的 `toTypedSchema` 适配主流 schema 库，校验逻辑不再绑死
- `@vee-validate/i18n` 配套 40+ 语言包，错误消息本地化开箱即用；`devtools` 插件可直接在 Vue Devtools 中调试表单状态
- `useFieldArray` 原生支持动态字段（push/remove/swap/move），动态表单不用自己写状态机

**缺点**

- API 表面积大，`useForm` 返回近 30 个方法，新手面对 `defineField` / `defineComponentBinds` / `Field` 三套绑定方式容易选错
- 默认行为偏激进：所有字段在 `submit` 前 `blur` 即触发校验，需要手动用 `validateOnBlur=false` 或 `meta.touched` 控制时机
- v3 → v4 是 breaking change，旧文档与代码片段仍大量充斥网络，搜索时需注意版本
- Zod 的 `refine` / `superRefine` 在某些键缺失时不执行（Zod 本身的设计），与表单"草稿态"配合时偶尔需要绕路

总体来说在 Vue 生态里它依然是表单库的最佳选择，复杂表单尤其值得用。

## 文档地址

[Vee-validate](https://vee-validate.logaretm.com/)

## GitHub 地址

[Vee-validate](https://github.com/logaretm/vee-validate/)

## 幻灯片地址

<a href="/SlideStack/vee-validate-slide/" target="_blank">Vee-validate</a>
