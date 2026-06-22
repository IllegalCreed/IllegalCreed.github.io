---
layout: doc
outline: [2, 3]
---

# 单元 / 组件接入

> 基于 jest-axe 10.0.0 / axe-core 4.12.1 编写

## 速查

- **jest-axe 10.0.0**：依赖**精确锁 axe-core 4.10.2**（非 `^`，重装不升）；`toHaveNoViolations()` 是自定义 matcher，**必须先 `expect.extend`**
- **vitest-axe**：稳定版仍卡 **0.1.0（2022-10-21）**、依赖 axe-core `^4.4.2`；`1.0.0-pre.5` **从未正式 release**，是 jest-axe 的 fork，**半停滞**
- **Vitest 用户推荐**：**直接用 axe-core**，吃最新 4.12.1，断言 `expect((await axe.run(c)).violations).toEqual([])`
- **jsdom 对比度不可靠**：无布局，`color-contrast` 等渲染相关规则不准（jest-axe 直接关闭），放浏览器层
- **Testing Library + jest-dom 互补**：jest-dom 查「某元素有无可访问名」，axe 查「整体是否违反 WCAG」
- **Storybook addon-a11y 10.4.6**：对每个 story 跑 axe，配 test-runner 进 CI

## jest-axe

`jest-axe` 把 axe-core 封装成 Jest matcher。**当前 10.0.0（2025-03）依赖精确锁 `axe-core` 4.10.2**（写死版本号、非 `^`，所以**重装也不会升到 4.12.1**）。

`toHaveNoViolations()` 是**自定义 matcher，必须先 `expect.extend` 注册**，否则 `toHaveNoViolations is not a function`：

```js
const { axe, toHaveNoViolations } = require("jest-axe");
expect.extend(toHaveNoViolations); // 或 require('jest-axe/extend-expect')

it("无可访问性违规", async () => {
  const { container } = render(<MyComponent />);
  expect(await axe(container)).toHaveNoViolations();
});
```

::: warning jsdom 下对比度被关闭
jest-axe README 明确写道：**「Color contrast 在 jsdom 下不工作，已在 jest-axe 中关闭」**。因为 jsdom 没有布局引擎，算不出真实颜色对比度。对比度检查请放到浏览器层（见 [端到端接入](./e2e.md)）。
:::

> jest-axe 在 Vitest 里也能跑（`expect` 兼容），但**官方未声明、未测**。

## vitest-axe（半停滞，谨慎）

`vitest-axe` 是 jest-axe 的 **fork**，但维护几乎停滞：

- **稳定 / latest 仍是 0.1.0（2022-10-21）**，依赖 `axe-core ^4.4.2`——规则已严重滞后；
- `dist-tags.pre = 1.0.0-pre.5`（2025-01，依赖 `^4.10.2`）**从未正式 release**——`npm i vitest-axe` 默认仍装 **0.1.0**；
- setup 入口为 `vitest-axe/extend-expect`。

::: warning 不建议在新项目用 vitest-axe
0.1.0 锁的 axe-core 是 2022 年的 `^4.4.2`，规则严重过时。除非有历史包袱，**Vitest 用户应直接用 axe-core**（见下）。
:::

## ⭐ Vitest 推荐：直接用 axe-core

对 Vitest 用户，**最稳的做法是直接依赖 axe-core**——吃最新 4.12.1 规则，自己写断言，不受封装库版本滞后拖累：

```ts
import axe from "axe-core";
import { render } from "@testing-library/vue";

it("组件无可访问性违规", async () => {
  const { container } = render(MyComponent, { props: { label: "Save" } });
  // 直接断言 violations 为空；container 限定检查范围
  expect((await axe.run(container)).violations).toEqual([]);
});
```

jsdom **没有布局**，对比度等渲染相关规则不可靠（axe issue #595；jest-axe 也是直接关闭）。这类规则应放到 Playwright 浏览器层。若 jsdom 噪声过多，可临时关掉对比度规则：

```ts
// 在 jsdom 层关闭对比度，避免假阳性
const r = await axe.run(container, {
  rules: { "color-contrast": { enabled: false } },
});
expect(r.violations).toEqual([]);
```

## Testing Library + jest-dom（互补，非替代）

`@testing-library/jest-dom` 与 axe **互补，查的东西不一样**：

| 工具 | 查什么 | 例 |
| ---- | ------ | --- |
| jest-dom | **单个元素**有无可访问名 / 是否可见 | `toHaveAccessibleName()`、`toBeVisible()` |
| axe | **整体**是否违反 WCAG | `axe.run()` |

Vitest 里引入 jest-dom matcher：

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

此外，Testing Library 的 `getByRole('button', { name })` / `getByLabelText()` **仅在标记可访问时才匹配**——一个 `<div @click>` 用 `getByRole('button')` 根本找不到，等于把查询本身变成了一道 a11y 检查（详见 [Vue 实战与最佳实践](./best-practices.md)）。

## Storybook addon-a11y

`@storybook/addon-a11y 10.4.6`（内置 axe-core）会**对每个 story 跑 axe**，在 Storybook 面板直接显示违规；配合 Storybook test-runner 可把这些检查带进 CI。本项目 `packages/ui` 用 Storybook，组件库的可访问性回归很适合用这条路。

## 小结：选哪个

| 场景 | 推荐 |
| ---- | ---- |
| Jest 项目 | jest-axe（接受锁 4.10.2）+ `expect.extend` |
| **Vitest 项目** | **直接 `axe.run()`**（吃最新规则），辅以 jest-dom |
| 组件库 | Storybook addon-a11y + test-runner |
| 对比度 / 焦点 / 键盘 | **都放浏览器层**（jsdom 不可靠） |
