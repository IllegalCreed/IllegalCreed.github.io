---
layout: doc
outline: [2, 3]
---

# Locator 与自动等待

> 基于 Playwright v1.61 编写

## 速查

- 七大语义 Locator：`getByRole` / `getByLabel` / `getByText` / `getByPlaceholder` / `getByTestId` / `getByTitle` / `getByAltText`
- 优先级：getByRole > getByLabel > getByText > getByTestId，最后才 CSS/XPath
- 链式：`page.getByRole("table").getByRole("row", { name: "张三" })`
- 过滤：`.filter({ hasText })` / `.filter({ has })` / `.and()` / `.or()` / `.nth(n)`
- Locator 惰性：执行时才查 DOM，自动适应动态内容
- auto-wait：动作前自动等元素可见 / 稳定 / 可交互 / 未遮挡

## 七大语义 Locator

按用户与无障碍视角定位，优先 getByRole：

```ts
// getByRole —— ARIA role + 可访问名称（最推荐）
await page.getByRole("button", { name: "提交" }).click();
await page.getByRole("textbox", { name: "用户名" }).fill("admin");
await page.getByRole("checkbox", { name: "记住我" }).check();

// getByLabel —— 表单控件
await page.getByLabel("电子邮件").fill("user@example.com");

// getByText —— 可见文本（支持正则、exact）
await page.getByText("欢迎登录").click();
await page.getByText("确定", { exact: true }).click();

// getByPlaceholder / getByTestId / getByTitle / getByAltText
await page.getByPlaceholder("请输入密码").fill("secret");
await page.getByTestId("submit-btn").click();
```

> `getByTestId` 默认匹配 `data-testid`，可在 config 改：`use: { testIdAttribute: "data-cy" }`。

## 链式与过滤

```ts
// filter：在结果集内进一步筛选
await page
  .getByRole("listitem")
  .filter({ hasText: "已完成" })
  .filter({ has: page.getByRole("checkbox", { checked: true }) })
  .first()
  .click();

// and / or（v1.43+）
const del = page.getByRole("button").and(page.getByTitle("删除"));
const input = page.getByLabel("用户名").or(page.getByPlaceholder("用户名"));

// nth / first / last
await page.getByRole("row").nth(2).click();

// 链式：父 → 子，缩小范围
await page
  .getByRole("table")
  .getByRole("row", { name: "张三" })
  .getByRole("button", { name: "编辑" })
  .click();
```

## Locator 惰性 + 自动重试

Locator **不立即查询 DOM**——每次用它执行动作时才在当下重新查询，因此天然适应动画、延迟渲染、状态变化，无需手写 `waitFor`。

```ts
const row = page.getByRole("row", { name: "张三" }); // 此刻不查 DOM
await row.getByRole("button", { name: "删除" }).click(); // 执行时才查
```

## auto-wait（actionability）

执行 click / fill / check 等动作前，Playwright 自动验证元素满足可操作性，全部满足才执行，否则重试到超时：

| 检查 | 含义 |
| ---- | ---- |
| Visible | 有非空盒模型、非 hidden |
| Stable | 连续两帧位置不变（动画结束） |
| Enabled | 无 disabled |
| Receives Events | 是实际点击目标（未被遮挡） |
| Editable | fill/clear 还需可编辑（非 readonly） |

```ts
// 无需手写等待——自动等按钮可见、稳定、可点击
await page.getByRole("button", { name: "保存" }).click();
```

> 必要时可 `{ force: true }` 跳过检查，但会掩盖真实可用性问题，应谨慎。