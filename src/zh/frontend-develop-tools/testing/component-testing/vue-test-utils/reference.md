---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 @vue/test-utils v2.x 编写

## 速查

- 挂载：`mount(C, options)` / `shallowMount(C)`
- 查询：`find` / `get` / `findAll` / `findComponent`
- 交互：`await trigger(e)` / `await setValue(v)` / `await setProps({})`
- 断言：`text` / `html` / `exists` / `classes` / `emitted` / `props`
- 完整说明见 [入门](./getting-started.md) / [Wrapper API](./guide-line/wrapper-api.md) / [Props 与事件](./guide-line/props-events.md) / [异步与插槽](./guide-line/async-slots.md) / [global 与 stub](./guide-line/global-stubs.md) / [Router 与 Pinia](./guide-line/router-pinia.md)

## 挂载 API

| API                          | 说明                                  |
| ---------------------------- | ------------------------------------- |
| `mount(C, options)`          | 完整挂载，返回 VueWrapper             |
| `shallowMount(C, options)`   | 浅挂载，子组件 stub 成占位            |
| `mount(C, { shallow: true })`| 等价 shallowMount                     |
| `flushPromises()`            | 等待所有挂起的 Promise                |
| `enableAutoUnmount(afterEach)`| 每个测试后自动 unmount               |
| `RouterLinkStub`             | RouterLink 占位 stub                  |
| `config.global`             | 套件级默认挂载选项                    |

## 挂载选项

| 选项               | 说明                                  |
| ------------------ | ------------------------------------- |
| `props` / `attrs`  | 传入 props / 透传属性                 |
| `slots`            | 插槽内容                              |
| `data()`           | Options API 的 data（仅 Options API） |
| `attachTo`         | 挂载到真实 DOM（`isVisible` 需要）    |
| `shallow`          | 浅挂载开关                            |
| `global.plugins`   | 注入 Pinia / Vue Router 等            |
| `global.provide`   | inject 依赖                           |
| `global.mocks`     | mock 全局属性                         |
| `global.stubs`     | stub 子组件                           |
| `global.components`/`directives` | 全局组件 / 指令            |

## Wrapper 方法

| 方法                       | 返回         | 说明                          |
| -------------------------- | ------------ | ----------------------------- |
| `find(css)` / `get(css)`   | DOMWrapper   | 查 DOM（get 找不到抛错）      |
| `findAll(css)`             | DOMWrapper[] | 所有匹配                      |
| `findComponent(C)`         | VueWrapper   | 查组件                        |
| `trigger(event)`           | Promise      | 触发事件（await）             |
| `setValue(v)`              | Promise      | 设置表单值（await）           |
| `setProps({})`             | Promise      | 更新 props（await）           |
| `text()` / `html()`        | string       | 文本 / HTML                   |
| `exists()` / `isVisible()` | boolean      | 是否存在 / 可见               |
| `classes()` / `attributes()`| —           | class / 属性                  |
| `props()` / `emitted()`    | —            | props / 自定义事件记录        |
| `vm` / `unmount()`         | —            | Vue 实例 / 卸载               |

## 官方资源

- 文档：[https://test-utils.vuejs.org/](https://test-utils.vuejs.org/)
- API：[https://test-utils.vuejs.org/api/](https://test-utils.vuejs.org/api/)
- GitHub：[https://github.com/vuejs/test-utils](https://github.com/vuejs/test-utils)
