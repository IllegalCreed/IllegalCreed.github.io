---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 @pinia/testing v1.x（配 Pinia v3）编写

## 速查

- 注入：`mount(C, { global: { plugins: [createTestingPinia(options)] } })`
- 默认 `stubActions: true`；断言 `expect(store.action).toHaveBeenCalledOnce()`
- 完整说明见 [入门](./getting-started.md) / [选项](./guide-line/options.md) / [state 与断言](./guide-line/state-assertions.md) / [与 setActivePinia](./guide-line/setactivepinia.md)

## createTestingPinia(options)

返回 `TestingPinia`（继承 Pinia，多一个 `.app` 属性），作为 `global.plugins` 注入。

## TestingOptions

| 选项 | 默认 | 说明 |
| ---- | ---- | ---- |
| `stubActions` | `true` | `true` 全 stub / `false` 真执行+spy / `string[]` 选择性 / 函数 |
| `initialState` | `{}` | 预设各 store 初始 state（key 为 store id） |
| `stubPatch` | `false` | `true` 时 `$patch` 被 spy 不改 state |
| `stubReset` | `false` | `true` 时 `$reset` 被 spy 不重置 |
| `plugins` | `[]` | 应用层 Pinia 插件 |
| `fakeApp` | `false` | 创建空 App 并 `app.use(pinia)` |
| `createSpy` | 自动 | spy 工厂（Vitest 无 globals 时传 `vi.fn`） |

## 测试中的 store 能力

| 操作 | 写法 |
| ---- | ---- |
| 改 state | `store.x = 1` / `store.$patch({ ... })` |
| 覆盖 getter | `store.getterName = value`（赋 `undefined` 恢复） |
| 断言 action | `expect(store.action).toHaveBeenCalledWith(...)` |
| 类型安全 mock | `mockedStore(useStore).action.mockResolvedValue(...)` |

## 与 setActivePinia 对照

| 工具 | 场景 |
| ---- | ---- |
| `createTestingPinia()` | 组件 + store 集成测试 |
| `setActivePinia(createPinia())` | 纯 store 单元测试 |

## 官方资源

- 测试文档：[https://pinia.vuejs.org/cookbook/testing.html](https://pinia.vuejs.org/cookbook/testing.html)
- TestingOptions：[https://pinia.vuejs.org/api/@pinia/testing.html](https://pinia.vuejs.org/api/@pinia/testing.html)
- GitHub：[https://github.com/vuejs/pinia](https://github.com/vuejs/pinia)
