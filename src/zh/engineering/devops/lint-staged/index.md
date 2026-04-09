---
layout: doc
---

# lint-staged

> 基于 lint-staged v16.4.0 编写

用于在 `Git` 的 **暂存文件（staged files）** 上运行 `format` 工具（如 `Prettier`）或 `lint` 工具（如 `ESLint`），确保只对即将提交的代码进行检查和修复，提高效率并保持代码质量。

## 评价

`lint-staged` 一般搭配 `husky` 使用

**优点**

- 可以获取暂存文件
- 相比全量数据，处理速度更快
- 支持 `glob` 筛选

**缺点**

- 需要与 Git hooks 工具（如 Husky）配合使用，无法独立运行

## 文档地址

[lint-staged](https://github.com/lint-staged/lint-staged#readme)（GitHub README 即官方文档）

## GitHub地址

[lint-staged](https://github.com/lint-staged/lint-staged)

## 幻灯片地址

<a href="/SlideStack/lint-staged-slide/" target="_blank">lint-staged</a>