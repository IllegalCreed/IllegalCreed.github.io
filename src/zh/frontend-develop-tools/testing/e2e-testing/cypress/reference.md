---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Cypress v15.x 编写

## 速查

- 查询：`cy.get` / `cy.contains` / `.find` / `.within`，选 `[data-cy]`
- 交互：`.click` / `.type` / `.select` / `.check`
- 断言：`.should("be.visible")` / `.and(...)`，自动重试
- 网络：`cy.intercept(...).as("x")` + `cy.wait("@x")`
- 完整说明见 [入门](./getting-started.md) / [命令与重试](./guide-line/commands-retry.md) / [网络拦截](./guide-line/network-intercept.md) / [自定义命令与会话](./guide-line/custom-commands-session.md) / [组件测试](./guide-line/component-testing.md) / [最佳实践](./guide-line/best-practices.md)

## 命令速查

| 命令 | 说明 |
| ---- | ---- |
| `cy.visit(url)` | 访问页面 |
| `cy.get(sel)` | 查询元素（重试） |
| `cy.contains(text)` | 按文本查 |
| `cy.intercept(m,u,r)` | 拦截网络 |
| `cy.wait("@a")` | 等待请求 |
| `cy.fixture(f)` | 加载测试数据 |
| `cy.request(...)` | 发 HTTP 请求 |
| `cy.session(k,fn)` | 缓存登录态 |
| `cy.origin(u,fn)` | 跨域操作 |
| `cy.task(name)` | 跑 Node 端逻辑 |

## 常用配置项

| 配置 | 默认 | 说明 |
| ---- | ---- | ---- |
| `baseUrl` | `null` | cy.visit 前缀 |
| `defaultCommandTimeout` | `4000` | 命令重试超时 ms |
| `retries.runMode` | `0` | CI 失败重试次数 |
| `testIsolation` | `true` | 每测试清状态 |
| `specPattern` | `cypress/e2e/**/*.cy.{js,ts,...}` | 测试文件 glob |
| `video` | `false`（v15） | 录制视频 |

## 常用断言

`be.visible` / `not.exist` / `have.text` / `contain` / `have.value` / `have.class` / `have.attr` / `have.length` / `be.disabled` / `be.checked` / `eq`（非 DOM 值）

## v14/15 变更要点

| 版本 | 变更 |
| ---- | ---- |
| v14 | `injectDocumentDomain` 默认关，跨 origin 跳转必用 `cy.origin` |
| v15 | `video` 默认 `false`；`env` 不再支持 test-level 覆盖（安全加固） |
| v10 | 配置从 `cypress.json` 改为 `cypress.config.{js,ts}` |

## 官方资源

- 文档：[https://docs.cypress.io](https://docs.cypress.io)
- 最佳实践：[https://docs.cypress.io/app/core-concepts/best-practices](https://docs.cypress.io/app/core-concepts/best-practices)
- API：[https://docs.cypress.io/api/table-of-contents](https://docs.cypress.io/api/table-of-contents)
- GitHub：[https://github.com/cypress-io/cypress](https://github.com/cypress-io/cypress)