---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 flutter/agent-plugins 官方仓库 README 与各 SKILL.md 编写。

## 速查

- **是什么**：Flutter 团队官方 agent 插件——捆绑 skills + MCP server 配置 + rules
- **Skill vs MCP**：MCP 给 agent 访问工具，Skill 教 agent「怎么用」工具做特定任务（互补）
- **装（通用）**：`npx skills@1.5.17 add flutter/agent-plugins --skill '*' --agent universal --yes`（→ `.agents/skills`）
- **装（Claude Code plugin）**：`claude plugin marketplace add flutter/agent-plugins` → `claude plugin install dart-flutter@dart-flutter`
- **两类 skill**：flutter-\*（10：架构/布局/路由/本地化/preview/test/集成测试/JSON/HTTP）+ dart-\*（12：单测/覆盖率/静态分析/FFI/ffigen/pattern matching…）
- **另可装** `dart-lang/skills`（纯 Dart 任务）
- **官方**：flutter org，BSD-3-Clause，★2.7k

## 是什么：插件捆绑三件

Flutter Agent Plugins 由 Flutter 团队维护，把多种定制**捆绑**在一个插件里：

- **Agent Skills**：核心，一个个「文件夹式」技能（SKILL.md + 资源）
- **MCP server 配置**：接 Dart/Flutter MCP 工具
- **rules**：happy path 工作流规则

> **Skill 与 MCP 的关系**：MCP 给 agent **访问专用工具**（如 Flutter/Dart 分析、hot reload 驱动）；Skill 教 agent「**怎么用**」这些工具完成特定任务。二者互补，不是替代。

## 安装

**通用（多数 agent）**——放进标准 `.agents/skills`：

```bash
npx skills@1.5.17 add flutter/agent-plugins --skill '*' --agent universal --yes
```

**Claude Code 官方 plugin**：

```bash
claude plugin marketplace add flutter/agent-plugins
claude plugin install dart-flutter@dart-flutter
claude plugin marketplace list   # 验证
```

> Dart 任务可另装 [`dart-lang/skills`](https://github.com/dart-lang/skills)。

## skills 两大类

| 类 | 数量 | 例子 |
| --- | --- | --- |
| **flutter-\*** | 10 | apply-architecture-best-practices、fix-layout-issues、build-responsive-layout、setup-declarative-routing、setup-localization、add-widget-preview/test、add-integration-test、implement-json-serialization、use-http-package |
| **dart-\*** | 12+ | add-unit-test、collect-coverage、run-static-analysis、fix-runtime-errors、generate-test-mocks、setup-ffi-assets、use-ffigen、use-pattern-matching、use-primary-constructors、build-cli-app… |

## 下一步

- [指南](./guide-line) —— flutter-\* 技能深入、dart-\* 技能、分层架构、布局排错铁律
- [参考](./reference) —— flutter-\*/dart-\* 完整清单、安装、MCP、许可
