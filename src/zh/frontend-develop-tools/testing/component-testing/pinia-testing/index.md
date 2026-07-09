---
layout: doc
---

# @pinia/testing

Pinia 官方的测试工具包，核心是 `createTestingPinia()`。在组件 + store 的集成测试里，把它作为 `global.plugins` 注入（配合 Vue Test Utils 的 `mount` 或 Testing Library 的 `render`），即可让 store 的 action 默认被替换为 spy（只记录调用、不执行真实逻辑）、state 可任意预设与修改、getter 可被覆盖——从而隔离组件与 store 实现、专注验证「组件如何与 store 交互」。

## 评价

**优点**

- **官方出品**：与 Pinia 同仓库发布、随 Pinia v3 同步，无额外依赖
- **一行注入**：`global.plugins: [createTestingPinia()]`，与 VTU / Testing Library 无缝配合
- **action 自动 spy**：默认 stub 所有 action 为 spy，轻松断言「被调用了几次、传了什么」
- **state 可控**：`initialState` 预设初始状态，测试中还能直接改 `store.x` 或 `$patch`
- **getter 可覆盖**：测试里直接给 getter 赋值 mock 返回，免去复杂构造

**缺点**

- **仅限组件集成**：纯 store 单元测试应用 `setActivePinia(createPinia())`，不是它的场景
- **createSpy 需留意**：Vitest 未开 `globals` 时要显式传 `createSpy: vi.fn`
- **类型不完美**：action 类型上仍是普通函数，要用 `.mockResolvedValue` 等需 `mockedStore` 包装
- **概念依赖 Pinia**：需先理解 Pinia 的 store / action / getter / `$patch` 才好上手

## 文档地址

[Pinia Testing](https://pinia.vuejs.org/cookbook/testing.html)

## GitHub地址

[Pinia](https://github.com/vuejs/pinia)

## 幻灯片地址

<a href="/SlideStack/pinia-testing-slide/" target="_blank">@pinia/testing</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=pinia-testing" target="_blank" rel="noopener noreferrer">@pinia/testing 测试题</a>
