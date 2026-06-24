---
layout: doc
---

# HTML 表单与约束校验

表单是网页上「让用户把数据交回服务器」的唯一原生入口——登录、搜索、下单、上传，背后都是一个 `<form>`。它由一组**表单控件**（`<input>` / `<select>` / `<textarea>` / `<button>` 等）和把它们打包提交的 `<form>` 容器组成；而浏览器内置的**约束校验**（required、pattern、类型校验……）让你不写一行 JavaScript 就能拦下大部分错误输入。本叶讲透「控件怎么选、数据怎么提交、校验怎么做、移动端怎么填得顺」这四件事。

## 概述

- **它管什么**：用什么控件采集数据（22 种 `input` 类型 + 选择类控件）、数据怎样打包提交（`action` / `method` / `enctype` / `FormData`）、提交前怎样在浏览器侧拦下错误（约束校验）、以及移动端怎样唤起正确键盘、自动填充得更快。
- **为什么值得认真学**：表单是「用户与你的系统交互最频繁、也最容易出错」的地方——控件选错伤体验、`name` 漏了数据收不到、不做校验脏数据直接入库、移动端键盘不对填一个手机号都费劲。这些坑大多**不报错**，却实打实地流失用户。
- **现代化关注点**：原生约束校验 API（`setCustomValidity` / `:user-invalid`）、`autocomplete` 字段名（直接关系到浏览器自动填充与密码管理）、`inputmode` / `enterkeyhint`（移动端虚拟键盘）、`datalist` / `<output>` / `<meter>` / `<progress>` 等常被忽略却很实用的控件。

## 本叶地图

- [入门](./getting-started) —— 一个「正确且现代」的注册表单，逐块讲清控件、`name`、`label` 与校验为什么这么写
- [表单提交机制](./guide-line/form-submission) —— `<form>` 的 `action` / `method`（GET vs POST）/ `enctype` 三种取值与 `FormData`
- [`input` 类型全谱](./guide-line/input-types) —— text / email / number / range / date 系列 / color / file / checkbox / radio / hidden 等 22 种类型
- [`label` / `fieldset` 与可访问关联](./guide-line/labels-fieldset) —— 显式 `for` vs 隐式包裹、`fieldset` / `legend` 分组
- [选择类控件](./guide-line/select-controls) —— `select` / `option` / `optgroup` / `datalist` / `textarea` / `button` / `output` / `meter` / `progress`
- [约束校验](./guide-line/constraint-validation) —— `required` / `pattern` / `min` / `max` / `step`、`:valid` / `:invalid`、Constraint Validation API、`novalidate`
- [自动填充与移动端体验](./guide-line/autofill-mobile) —— `autocomplete` 字段名、`inputmode`、`enterkeyhint`、虚拟键盘
- [参考](./reference) —— 速查表 + `input` 类型表 + 约束属性表 + 标准 / Baseline / 工具链接

## 文档地址

- [web.dev: Learn HTML — Forms](https://web.dev/learn/html/forms)
- [MDN: `<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) · [Client-side form validation（学习）](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)
- [MDN: Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [WHATWG HTML Standard — Forms](https://html.spec.whatwg.org/multipage/forms.html)

## 幻灯片地址

<a href="/SlideStack/html-forms-slide/" target="_blank">HTML 表单与约束校验</a>
