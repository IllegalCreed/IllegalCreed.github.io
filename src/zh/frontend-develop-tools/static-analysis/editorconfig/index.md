---
layout: doc
---

# EditorConfig

跨编辑器/IDE 统一基础代码风格的配置规范——在项目放一个 `.editorconfig`，约束缩进、换行、编码等编辑器行为。它不是 linter，也不是格式化器，而是一份「文件格式 + 一组编辑器插件」的开放规范。

## 评价

### 优点

- 跨编辑器统一基础风格：缩进、换行、编码、末尾空行等，团队不再各搞各的
- 零运行时、零依赖：只是一个纯文本文件，无需安装 CLI、无构建步骤
- 主流编辑器多为原生支持（VS Code、JetBrains 全家桶、Vim/Neovim、GitHub/GitLab…），其余装插件即可
- 与格式化器互补：Prettier 会读取 `.editorconfig` 作为基线，职责不重叠

### 缺点

- 只管最基础的风格，引号/分号/换行折叠等细粒度规则仍需 Prettier 这类格式化器
- 并非所有属性被所有编辑器支持（如 `max_line_length` 仅部分编辑器认）
- 无统一软件版本，行为取决于各编辑器/插件对规范的实现完整度

## 文档地址

[EditorConfig](https://editorconfig.org/)

## GitHub地址

[editorconfig/editorconfig](https://github.com/editorconfig/editorconfig)

## 幻灯片地址

<a href="/SlideStack/editorconfig-slide/" target="_blank">EditorConfig</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=editorconfig" target="_blank" rel="noopener noreferrer">EditorConfig 测试题</a>
