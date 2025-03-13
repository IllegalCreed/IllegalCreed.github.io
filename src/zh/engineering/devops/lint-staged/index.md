---
layout: doc
---

# lint-staged

用于在 `Git` 的 **暂存文件（staged files）** 上运行 `format` 工具（如 `Prettier`）或 `lint` 工具（如 `ESLint`），确保只对即将提交的代码进行检查和修复，提高效率并保持代码质量。

## 评价

`lint-staged` 一般搭配 `husky` 使用

**优点**

- 可以获取暂存文件
- 相比全量数据，处理速度更快
- 支持 `glob` 筛选

**缺点**

- 工具链过于零碎，希望可以和 husky 整合

## GitHub地址

[lint-staged](https://github.com/lint-staged/lint-staged)