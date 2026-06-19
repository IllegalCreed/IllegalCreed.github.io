---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 @testing-library/vue v8 + user-event v14 编写

## 速查

- 渲染：`render(C, { props, global })` + `screen`
- 查询：`getByRole(role, { name })`，优先级 role > label > text > testId
- 交互：`userEvent.setup()` → `await user.click/type/...`
- 异步：`await findByText` / `waitFor`
- 完整说明见 [入门](./getting-started.md) / [查询](./guide-line/queries.md) / [user-event](./guide-line/user-event.md) / [异步与断言](./guide-line/async-matchers.md) / [与 VTU 的边界](./guide-line/vtu-boundary.md)

## 查询

| 查询前缀 | 0 匹配 | 异步 | 说明 |
| -------- | ------ | ---- | ---- |
| `getBy*` | 抛错 | 否 | 元素必须存在 |
| `queryBy*` | 返回 null | 否 | 断言不存在 |
| `findBy*` | 抛错（超时） | 是 | 等待出现 |
| `getAllBy*` / `queryAllBy*` / `findAllBy*` | — | — | 返回数组 |

| 查询后缀（优先级） | 用途 |
| ------------------ | ---- |
| `ByRole` | 最推荐，role + `{ name }` |
| `ByLabelText` | 表单字段 |
| `ByPlaceholderText` | 无 label 退选 |
| `ByText` | 非交互元素文本 |
| `ByDisplayValue` | 已填值表单 |
| `ByAltText` / `ByTitle` | alt / title |
| `ByTestId` | `data-testid` 兜底 |

## user-event

| 方法 | 说明 |
| ---- | ---- |
| `user.click(el)` / `dblClick` | 点击（完整事件序列） |
| `user.type(el, text)` | 逐字符输入 |
| `user.clear(el)` | 清空 |
| `user.keyboard("{Enter}")` | 键盘记号（`{Key>}`/`{/Key}` 组合键） |
| `user.selectOptions(el, [v])` | 下拉选择 |
| `user.upload(el, file)` | 文件上传 |

## jest-dom 断言

| matcher | 说明 |
| ------- | ---- |
| `toBeInTheDocument()` | 在文档中 |
| `toBeVisible()` | 可见 |
| `toBeDisabled()` / `toBeEnabled()` | 禁用 / 可用 |
| `toHaveValue(v)` | 表单值 |
| `toHaveTextContent(t)` | 文本 |
| `toHaveClass(c)` | 含 class |
| `toBeChecked()` | 选中 |
| `toHaveFocus()` | 获焦 |

## 官方资源

- 文档：[https://testing-library.com/docs/vue-testing-library/intro/](https://testing-library.com/docs/vue-testing-library/intro/)
- 查询优先级：[https://testing-library.com/docs/queries/about](https://testing-library.com/docs/queries/about)
- user-event：[https://testing-library.com/docs/user-event/intro](https://testing-library.com/docs/user-event/intro)
- GitHub：[https://github.com/testing-library/vue-testing-library](https://github.com/testing-library/vue-testing-library)
