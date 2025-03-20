---
layout: doc
---

# Prettier

广泛应用于多种编程语言、框架和编辑器的代码格式化工具。

## 评价

### 优点

- 目前最主流的格式化工具，生态成熟（如被 React、Vue 等项目广泛采用）
- 优秀的默认设置，无需复杂配置即可使用
- 通过强制执行一致的代码风格，避免缩进、分号等争议，减少团队争论

### 缺点

- 扩展性受限，不支持细粒度规则定制，只能通过插件修改格式化逻辑或配置文件微调
- 需通过插件（如 `eslint-plugin-prettier`）解决与其他 Linter 的格式规则冲突
- 因使用 JavaScript 实现，执行效率较低，尤其在大项目或全量格式化时

## 文档地址

[Prettier](https://prettier.io/)

## GitHub地址

[Prettier](https://github.com/prettier/prettier/)