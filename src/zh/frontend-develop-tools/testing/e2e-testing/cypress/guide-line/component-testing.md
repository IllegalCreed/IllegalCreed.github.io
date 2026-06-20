---
layout: doc
outline: [2, 3]
---

# 组件测试

> 基于 Cypress v15.x 编写

## 速查

- Component Testing：直接挂载单个组件到真实浏览器，无需后端、更快、隔离性高
- 配置：`component.devServer: { framework: "vue", bundler: "vite" }`
- 挂载：`cy.mount(Component, { props })`（在 support/component.ts 注册，可注入 Pinia/Router）
- 事件：`cy.spy().as("x")` 传给 prop，`cy.get("@x").should("have.been.called")`
- 支持 Vue 3 / React / Angular / Svelte，Vite 5-8 / Webpack 5

## E2E vs 组件测试

| 维度 | E2E 测试 | 组件测试 |
| ---- | -------- | -------- |
| 对象 | 整页 / 用户流程 | 单个组件 |
| 后端 | 需要（或 Mock） | 不需要 |
| 速度 | 较慢（载整页） | 快（只挂组件） |
| 隔离 | 低 | 高 |

## 配置（Vue 3 + Vite）

```ts
// cypress.config.ts
component: {
  devServer: { framework: "vue", bundler: "vite" },
  specPattern: "src/**/*.cy.ts",
  supportFile: "cypress/support/component.ts",
}
```

```ts
// cypress/support/component.ts —— 注册 mount，可注入插件
import { mount } from "cypress/vue";

Cypress.Commands.add("mount", (component, options = {}) => {
  options.global = options.global || {};
  options.global.plugins = options.global.plugins || [];
  // options.global.plugins.push(createPinia()); // 按需注入 Pinia
  return mount(component, options);
});
```

## 组件测试示例

```ts
// src/components/QuizOption.cy.ts
import QuizOption from "./QuizOption.vue";

describe("QuizOption 组件", () => {
  it("渲染选项文字", () => {
    cy.mount(QuizOption, { props: { label: "A", text: "选项文字" } });
    cy.get('[data-cy="option-text"]').should("contain", "选项文字");
  });

  it("点击触发 select 事件", () => {
    const onSelect = cy.spy().as("onSelect");
    cy.mount(QuizOption, { props: { label: "A", text: "x", onSelect } });
    cy.get('[data-cy="option-wrap"]').click();
    cy.get("@onSelect").should("have.been.calledOnce");
  });
});
```

> 用 `cy.spy()` / `cy.stub()` 配 `.as()` 别名监听组件事件——通过 `cy.get("@alias")` 引用，而非链在动作命令后。