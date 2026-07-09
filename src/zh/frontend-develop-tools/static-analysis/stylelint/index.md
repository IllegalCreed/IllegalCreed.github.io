---
layout: doc
---

# Stylelint

一款强大的样式表 linter，内置 100+ 规则，帮你发现 CSS（及 SCSS / Less / CSS-in-JS）中的错误并强制团队约定。

## 评价

### 优点

- 内置 100+ 规则，覆盖“避免错误”（无效十六进制、重复属性、未知属性）与“强制约定”（命名模式、标记法、单位/选择器限制）两大场景
- 通过 PostCSS 自定义语法支持 SCSS / Less / Sass / CSS-in-JS / Vue / HTML，并有丰富的共享配置与插件生态（`stylelint-config-standard`、`stylelint-scss`、`stylelint-order` 等）
- 与 Prettier 职责清晰互补：自 15 起废弃、16 起移除全部风格类规则，专注质量检查，格式化交给 Prettier（`stylelint-config-prettier` 因此不再需要）
- 提供 `--fix` 自动修复、缓存加速、灵活的 `overrides` 分文件配置，以及官方编辑器扩展与各类构建/CI 集成

### 缺点

- 默认零规则、不内置语言解析，接入需 `extends` 共享配置并按需配置 `customSyntax`，起步比“零配置即用”的工具略繁琐
- 只做样式检查，不做格式化（需搭配 Prettier）、不做 JS/TS 检查（需搭配 ESLint/oxlint）
- 16 起为纯异步 API + Node 18.12+ 要求，老项目升级需留意退出码/输出流/API 变更

## 文档地址

[Stylelint](https://stylelint.io/)

## GitHub地址

[stylelint/stylelint](https://github.com/stylelint/stylelint)

## 幻灯片地址

<a href="/SlideStack/stylelint-slide/" target="_blank">Stylelint</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=stylelint" target="_blank" rel="noopener noreferrer">Stylelint 测试题</a>
