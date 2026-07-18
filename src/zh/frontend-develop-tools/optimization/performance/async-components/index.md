---
layout: doc
---

# 异步组件

异步组件（Async Components）是把组件的**加载与渲染解耦**的一种模式：组件代码不再随主 bundle 一起下载与执行，而是「需要渲染时」才通过动态 `import()` 拉取对应 chunk，并在就绪前由框架用 fallback 占位。在 Vue 里它由 `defineAsyncComponent` + 内置 `<Suspense>` 协同实现；在 React 里它由 `React.lazy` + `<Suspense>` 协同实现。两者都把「代码分割（code splitting）」「占位 UI（loading / fallback）」「超时 / 错误处理」「与路由、Transition、KeepAlive 组合」这几件事收敛成稳定的 API，是首屏性能优化与按需加载的标配能力。本页基于 Vue 3 与 React 19.2 官方文档，整理两套体系的核心 API、机制、最佳实践与反模式。

## 评价

**优点**

- **天然代码分割**：配合构建工具的 ESM 动态 `import()`，自动产出独立 chunk，显著缩减首屏 JS 体积
- **统一 loading 模型**：用 fallback / loadingComponent 一处声明，避免在每次使用时手写「加载中」状态
- **错误与超时可控**：Vue 选项对象暴露 `delay/timeout/errorComponent/onError`；React 配合 Error Boundary 可降级
- **路由级粒度最划算**：路由边界是天然的 loading 边界，单点改造即可大幅优化
- **SSR 友好（Vue 3.5+）**：Lazy Hydration 让水合也按需发生，进一步降低低端机首屏负担
- **跨框架概念一致**：Vue 与 React 都采用 Suspense 模型，知识可迁移

**缺点**

- **Vue `<Suspense>` 仍标 Experimental**：API 可能变动；深度依赖需评估版本（嵌套需 3.3+，Lazy Hydration 需 3.5+）
- **React 无内置 errorComponent**：必须额外写 Error Boundary，否则 loader reject 直接抛错
- **默认行为易误解**：Vue `suspensible:true` 时组件自身 loading/error 选项被 Suspense 接管；React 已显示内容更新会回到 fallback
- **过度分割有代价**：每个小组件都 lazy 会触发 chunk waterfall（瀑布请求），反而损害性能
- **Suspense 不覆盖所有异步**：React 明确不检测 `useEffect` / 事件处理器内的 fetch；Vue Router 的路由懒加载「目前」也不会触发 Suspense

## 文档地址

- [Vue 异步组件指南](https://vuejs.org/guide/components/async.html)
- [Vue Suspense 指南](https://vuejs.org/guide/built-ins/suspense.html)
- [React lazy API](https://react.dev/reference/react/lazy)
- [React Suspense API](https://react.dev/reference/react/Suspense)

## GitHub 地址

- [Vue 核心](https://github.com/vuejs/core)
- [React 核心](https://github.com/facebook/react)

## 幻灯片地址

<a href="/SlideStack/async-components-slide/" target="_blank">异步组件</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=666" target="_blank" rel="noopener noreferrer">异步组件 测试题</a>

