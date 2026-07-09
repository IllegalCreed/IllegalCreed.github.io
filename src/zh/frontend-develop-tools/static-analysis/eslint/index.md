---
layout: doc
---

# ESLint

JavaScript / TypeScript 生态最主流的可插拔静态分析工具，专注于发现代码质量问题（未使用变量、潜在 bug、风格违规等），通过规则配置和插件机制覆盖几乎所有前端工作流。

## 评价

**优点**

- 生态极其成熟，规则插件覆盖 React / Vue / TypeScript / Jest / Tailwind / Next.js 等几乎所有主流栈
- v9 起 **flat config** 成为默认，配置文件就是 JS / TS 模块，逻辑可编程、可类型化、可组合，比旧的 `.eslintrc` 易维护得多
- `--fix` 可自动修复大部分风格类规则，开发体验顺畅
- 编辑器集成成熟（VS Code / JetBrains / Vim 等），保存即检查
- 支持自定义 parser、processor、language，可处理 Markdown 内代码块、Vue SFC、Astro 等非纯 JS 文件

**缺点**

- 性能受 JavaScript 运行时限制，大型项目跑全量 lint 慢（已有 Oxlint / Biome 等 Rust/Go 实现作为替代）
- v9 默认 flat config 与 v8 的 `.eslintrc` 不兼容，仍有大量插件未完全适配，升级需用 `@eslint/eslintrc` 的 `FlatCompat` 过渡
- 规则细节多、配置项杂，新手上手成本不低；社区在"哪些规则该开"上长期分歧
- 与 Prettier 等格式化工具的职责边界容易混淆，需要 `eslint-config-prettier` 手动关闭冲突项

## 文档地址

[ESLint](https://eslint.org/docs/latest/)

## GitHub地址

[ESLint](https://github.com/eslint/eslint)

## 幻灯片地址

<a href="/SlideStack/eslint-slide/" target="_blank">ESLint</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=eslint" target="_blank" rel="noopener noreferrer">ESLint 测试题</a>
