---
layout: doc
---

# Secretlint

可插拔（Pluggable）的密钥泄露检测工具，在提交代码前扫描并拦截硬编码的凭据（API Key、Token、私钥、连接串等）。

## 评价

### 优点

- 专注 **shift-left**：跑在本地、`pre-commit` 阶段拦截，从源头阻断密钥进入 Git 历史，而非像 GitHub Secret Scanning 那样事后告警
- **opt-in（按需启用）** 设计：默认不带任何规则，装哪个规则包才检查什么，配合「规则即文档」理念，误报率低
- 规则即独立 npm 包，`@secretlint/secretlint-rule-preset-recommend` 一次覆盖 AWS / GCP / GitHub / Slack / OpenAI / Anthropic 等 15 类常见凭据
- 输出**默认脱敏**，避免密钥在 CI 日志中二次暴露；支持 Docker / 单文件二进制 / Node.js 三种运行方式，易接入 CI 与 pre-commit

### 缺点

- 无内置规则，必须显式安装并在 `.secretlintrc` 中声明规则包后才生效，初次配置略繁琐
- 只能**检测**、不能自动修复密钥（`--format=mask-result` 仅能对文件就地打码，并非修复）
- 基于已知模式/正则匹配，对完全自定义格式的私有密钥需要用 `pattern` 规则或自写规则覆盖，存在漏报可能

## 文档地址

[Secretlint](https://secretlint.github.io/)

## GitHub地址

[secretlint/secretlint](https://github.com/secretlint/secretlint)

## 幻灯片地址

<a href="/SlideStack/secretlint-slide/" target="_blank">Secretlint</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=secretlint" target="_blank" rel="noopener noreferrer">Secretlint 测试题</a>
