---
layout: doc
---

# Vue

Evan You 创建并维护的渐进式 JavaScript 框架，以「响应式数据 + 模板编译 + 单文件组件」三件套为核心。从设计上 Vue 3 是「**编译时优化 + 运行时小核**」——模板在编译期被解析成最优的渲染函数，运行时只负责响应式追踪与 DOM 更新；这与 React「**全运行时 + JSX 直译**」的路线形成鲜明对比。Vue 3.5（2024.9）稳定了 reactive props destructure、新增 `useId` / `useTemplateRef` / `onWatcherCleanup` 等小工具，Vapor Mode（跳过 Virtual DOM 的纯 DOM 编译输出）目前仍在 alpha 分支孵化，未进入稳定版。

## 评价

**优点**

- **心智模型简单**：模板 + script + style 三段式 SFC，初学者一天即可写第一个组件；Composition API 之后函数式组织代码与 React Hooks 等价但更可控（无依赖数组、无 Rules of Hooks 噪声）
- **响应式系统优雅**：基于 Proxy 的 `ref` / `reactive` 自动追踪依赖，不需要手动声明 deps；`computed` 缓存语义清晰，`watch` 类型完整
- **编译时优化重**：`block` / `patchFlag` / 静态提升 / 内联事件缓存等让运行时 diff 量比 React 少得多；同等场景下 Vue bundle 与运行时性能领先
- **渐进式落地**：可以从一个 `<script>` 标签开始用，也能上 Vite + Pinia + Vue Router + Nuxt 的完整工具链；新老项目都好上手
- **生态完整**：Vue Router / Pinia / VueUse / Vite / Nuxt 全官方背书；UI 库（Element Plus / Naive UI / Vuetify / Ant Design Vue）覆盖企业 / 移动 / 桌面各场景

**缺点**

- **TypeScript 集成历史包袱**：Options API 时代类型推导一直是痛点，Composition API + `<script setup>` 才彻底解决；老项目 mixed 风格类型还是麻烦
- **生态相对集中**：UI 库与状态库选择虽多，但每个细分赛道头部只有 1-2 个选项，比 React 的「Library 海洋」少一档
- **Vapor Mode 长期开发中**：3.4 时官方就宣传跳过 VDOM 的编译输出，到 3.5 仍在 alpha 分支；Solid / Qwik 这种激进路线已经稳定可用
- **国际人才市场偏小**：北美 / 欧洲招人时 React 候选人比 Vue 多一个数量级；国内市场刚好相反
- **SSR / 元框架强绑定 Nuxt**：要 SSR 几乎只有 Nuxt 一条路；与 React 的 Next.js / Remix / Astro 多选项相比单薄

## 文档地址

[Vue.js](https://cn.vuejs.org/)

## GitHub 地址

[vuejs/core](https://github.com/vuejs/core)

## 幻灯片地址

<a href="/SlideStack/vue-slide/" target="_blank">Vue</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vue" target="_blank" rel="noopener noreferrer">Vue 测试题</a>
