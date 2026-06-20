---
layout: doc
outline: [2, 3]
---

# 最佳实践与局限

> 基于 Cypress v15.x 编写

## 速查

- 架构局限：仅 JS/TS、单浏览器实例、跨域要 `cy.origin`、不能直连 DB（用 `cy.task`/`cy.request`）
- 反模式：`cy.wait(固定时间)`、CSS/ID 选择、`const` 存命令结果、测试间共享状态、UI 登录
- 状态用 API 设置（`cy.request`）+ `cy.session` 缓存，别用 UI 走流程
- vs Playwright：DX/组件测试更成熟 vs 跨浏览器/多语言/免费并行
- CI：`cypress-io/github-action@v6`

## 架构局限（Trade-offs）

官方明确列出的**永久性**限制：

- **仅 JS/TS**：测试跑在浏览器里，无法用 Python/Java
- **单浏览器实例**：不支持多浏览器同时（无法测双端协作）
- **跨域要 cy.origin**：每次切 origin 有开销
- **不能直连数据库/后端**：要用 `cy.task` / `cy.exec` / `cy.request` 间接
- **不适合通用自动化**：爬虫、性能测试、第三方站点

临时性（官方计划改进）：无原生 `cy.hover`（用 `.trigger("mouseover")`）、iframe 支持有限。

## vs Playwright

| 维度 | Cypress | Playwright |
| ---- | ------- | ---------- |
| 跨浏览器 | Chrome 系一等，Safari 实验 | Chromium/FF/WebKit 正式 |
| 多语言 | 仅 JS/TS | JS/Py/Java/.NET |
| 并行 | 需 Cloud（付费） | 内置免费 |
| 组件测试 | 成熟 | 较新 |
| DX/调试 | 时间旅行、Command Log 极佳 | Trace Viewer |

## 反模式

| 反模式 | 正确做法 |
| ------ | -------- |
| `cy.wait(5000)` 固定等待 | `cy.wait("@alias")` 或断言等待 |
| CSS 类 / ID 选元素 | `[data-cy="..."]` 属性 |
| `const el = cy.get(...)` | `.as("name")` + `cy.get("@name")` |
| 测试间共享状态 | 每个 `it` 独立可运行 |
| UI 登录（每测试走登录页） | `cy.session` 缓存 + API 设状态 |
| `afterEach` 清理 | 在 `beforeEach` 初始化 |

```ts
// ✅ 用 API 设状态（快、可靠），别用 UI
beforeEach(() => {
  cy.request("POST", "/api/test/seed", { scenario: "has-quiz" });
  cy.login("user", "pass"); // cy.session 缓存
  cy.visit("/dashboard");
});
```

## CI 集成（GitHub Actions）

```yaml
- name: Run Cypress
  uses: cypress-io/github-action@v6
  with:
    build: pnpm build
    start: pnpm start
    wait-on: "http://localhost:3000"
    browser: chrome
```