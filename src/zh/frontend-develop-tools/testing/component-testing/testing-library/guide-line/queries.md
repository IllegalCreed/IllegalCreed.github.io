---
layout: doc
outline: [2, 3]
---

# 查询

> 基于 @testing-library/vue v8 编写

## 速查

- 优先级：`getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByDisplayValue` > `getByAltText` > `getByTitle` > `getByTestId`
- `getByRole(role, { name })`：最推荐，基于无障碍树
- 变体：`getBy`（找不到抛错）/ `queryBy`（找不到返 null）/ `findBy`（异步，返 Promise）
- 多个：`getAllBy` / `queryAllBy` / `findAllBy`

## 查询优先级金字塔

按"对用户（含辅助技术用户）的可访问程度"从高到低选查询：

| 级别 | 查询 | 适用 |
| ---- | ---- | ---- |
| 1 | `getByRole` | 几乎一切：按钮、输入框、标题、链接 |
| 2 | `getByLabelText` | 表单字段（最贴近填表行为） |
| 3 | `getByPlaceholderText` | 只有 placeholder、无 label 时 |
| 4 | `getByText` | 非交互元素（div / span / p）的文本 |
| 5 | `getByDisplayValue` | 已填值的表单元素 |
| 6–7 | `getByAltText` / `getByTitle` | img 的 alt / title 属性 |
| 8 | `getByTestId` | 无法语义匹配时的兜底（`data-testid`） |

::: tip 为什么是这个顺序
优先级越高越能反映用户真实体验，也倒逼写出可访问性更好的 HTML。`getByRole` 基于 ARIA 无障碍树——如果查不到，往往说明 UI 本身不可访问。`getByTestId` 与用户体验无关，仅作兜底。
:::

## getByRole 细节

`getByRole(role, options)`，最常用 `name` 选项按可访问名称过滤：

```ts
screen.getByRole("button", { name: "提交" });
screen.getByRole("button", { name: /取消/i }); // 正则、忽略大小写
screen.getByRole("heading", { level: 2, name: "章节" }); // h2
screen.getByRole("tab", { selected: true }); // aria-selected
screen.getByRole("button", { expanded: true }); // aria-expanded
screen.getByRole("textbox", { name: "搜索" }); // name 也匹配 aria-label
```

常见隐式 role：

| 元素 | role |
| ---- | ---- |
| `<button>` | `button` |
| `<a href>` | `link` |
| `<input type="text">` | `textbox` |
| `<input type="checkbox">` | `checkbox` |
| `<h1>`–`<h6>` | `heading`（带 level） |
| `<nav>` | `navigation` |
| `<input type="password">` | 无隐式 role（退选 `getByLabelText`） |

## 查询变体

同一查询有三种行为变体，按"是否存在/是否异步"选择：

| 变体      | 0 个匹配      | 多个匹配 | 异步重试 |
| --------- | ------------- | -------- | -------- |
| `getBy`   | **抛错**      | 抛错     | 否       |
| `queryBy` | **返回 null** | 抛错     | 否       |
| `findBy`  | 抛错（超时后）| 抛错     | **是**   |

```ts
// getBy：最常用，元素必须存在
screen.getByRole("button", { name: "提交" });

// queryBy：断言「不存在」专用（getBy 会先抛错）
expect(screen.queryByText("错误信息")).not.toBeInTheDocument();

// findBy：等待异步出现的元素（内置 waitFor，默认 1000ms）
const msg = await screen.findByText("加载完成");
```

查多个元素用 `getAllBy` / `queryAllBy` / `findAllBy`（返回数组）：

```ts
expect(screen.getAllByRole("listitem")).toHaveLength(3);
```

`findBy` / `waitFor` 等异步细节见 [异步与断言](./async-matchers.md)。
