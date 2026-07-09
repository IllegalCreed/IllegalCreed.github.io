---
layout: doc
---

# Vue I18n

由 intlify 团队维护的 Vue.js 官方国际化（i18n）插件，通过定义不同语言的 `messages` 字典并在运行时切换 `locale`，为单页应用提供翻译、复数、日期时间、数字格式化等完整本地化能力。

## 评价

**优点**

- Vue 官方推荐方案，Vue 3 生态适配最好；Composition API（`useI18n`）和 `<script setup>` 集成顺畅
- 消息语法丰富：命名插值、列表插值、链接消息（`@:key`）、修饰符（`@.upper`）、复数（`|` 分隔）、自定义复数规则一应俱全
- 支持 SFC `<i18n>` 自定义块（配合 `@intlify/unplugin-vue-i18n`），翻译资源可与组件就近放置
- 内置 `setLocaleMessage` 配合动态 `import()` 即可实现按需懒加载，无需额外路由库
- 全局 / 局部作用域分离（`useScope: 'global' | 'local'`），既能复用全局字典也能为组件自包含翻译

**缺点**

- API 表面积大，`t / d / n / tm / rt / $t / $tc` 等同时存在，新手容易在 Legacy 和 Composition 两套范式间混淆
- v11 起 Legacy API 与 `v-t` 自定义指令均被标记弃用，v12 将彻底移除，存量项目迁移成本不小
- TypeScript 字面量类型推断需要额外的 schema 声明，配置稍重
- 复数与上下文翻译的语法（`{n}` / `{count}` / 自定义 `pluralizationRules`）依赖约定，规则错误时排错不直观

## 文档地址

[Vue I18n](https://vue-i18n.intlify.dev/)

## GitHub 地址

[Vue I18n](https://github.com/intlify/vue-i18n)

## 幻灯片地址

<a href="/SlideStack/vue-i18n-slide/" target="_blank">Vue I18n</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vue-i18n" target="_blank" rel="noopener noreferrer">Vue I18n 测试题</a>
