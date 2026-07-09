---
layout: doc
---

# Vue Test Utils

Vue 官方维护的组件测试工具库（`@vue/test-utils`，v2.x 对应 Vue 3）。它把 Vue 组件挂载到虚拟 DOM，提供 `trigger` / `setValue` 等交互 API 和 `find` / `text` / `emitted` 等断言入口（统称 wrapper），让你验证组件的渲染、props、事件、插槽等行为。它也是 Testing Library、Cypress / Playwright 组件测试等上层工具的底层基础。

## 评价

**优点**

- **Vue 官方**：与 Vue 3 同步演进，对 Composition API、`<script setup>`、Suspense、Teleport 一等支持
- **可访问组件内部**：`props()` / `emitted()` / `vm` 直接验证 props 契约与自定义事件，适合组件单测
- **挂载选项强大**：`global.plugins` 一行注入 Pinia / Vue Router，`global.stubs` 精细 stub 子组件
- **运行器无关**：搭配 Vitest（推荐）或 Jest 均可，只负责"挂载与交互"
- **深浅挂载**：`mount` 集成 / `shallowMount` 隔离，按测试粒度自由选

**缺点**

- **需要 DOM 环境**：依赖 jsdom / happy-dom，需在运行器里显式配置
- **异步易踩**：Vue 的 DOM 更新是异步的，`trigger` / `setProps` 必须 `await`，初学常忘
- **偏实现细节**：直接断言 props / vm 可能让测试脆弱；关注"用户行为"的场景 Testing Library 更合适
- **v1 / v2 不通用**：v1.x 对应 Vue 2、v2.x 对应 Vue 3，API 有差异

## 文档地址

[Vue Test Utils](https://test-utils.vuejs.org/)

## GitHub地址

[Vue Test Utils](https://github.com/vuejs/test-utils)

## 幻灯片地址

<a href="/SlideStack/vue-test-utils-slide/" target="_blank">Vue Test Utils</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vue-test-utils" target="_blank" rel="noopener noreferrer">Vue Test Utils 测试题</a>
