---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 flutter/agent-plugins 官方仓库 README、各 SKILL.md 与 docs.flutter.dev/ai 编写。

## 速查

- **装（通用）**：`npx skills@1.5.17 add flutter/agent-plugins --skill '*' --agent universal --yes`
- **装（Claude plugin）**：`claude plugin marketplace add flutter/agent-plugins` → `claude plugin install dart-flutter@dart-flutter`
- **skills**：flutter-\* 10 + dart-\* 12+，另 dart-lang/skills
- **捆绑**：skills + MCP server 配置 + rules
- **官方**：flutter org，BSD-3-Clause

## flutter-\* skills 清单

| skill | 用途 |
| --- | --- |
| flutter-apply-architecture-best-practices | 分层架构（UI/Logic/Data + MVVM + Repository） |
| flutter-fix-layout-issues | 修布局错误（overflow/unbounded 约束） |
| flutter-build-responsive-layout | 响应式布局 |
| flutter-setup-declarative-routing | 声明式路由 |
| flutter-setup-localization | 本地化 |
| flutter-add-widget-preview | previews.dart 交互 widget preview |
| flutter-add-widget-test | widget 测试 |
| flutter-add-integration-test | 集成测试（Flutter Driver） |
| flutter-implement-json-serialization | JSON 序列化 |
| flutter-use-http-package | HTTP 请求 |

## dart-\* skills 清单

| skill | 用途 |
| --- | --- |
| dart-add-unit-test | 单元测试 |
| dart-collect-coverage | 覆盖率 |
| dart-run-static-analysis | 静态分析 |
| dart-fix-runtime-errors | 修运行时错误 |
| dart-generate-test-mocks | 生成测试 mock |
| dart-migrate-to-checks-package | 迁移到 checks 包 |
| dart-resolve-package-conflicts | 解包依赖冲突 |
| dart-setup-ffi-assets / dart-use-ffigen | FFI 资源 / ffigen |
| dart-use-pattern-matching | pattern matching |
| dart-use-primary-constructors | primary constructors |
| dart-build-cli-app | 建 CLI 应用 |

## 安装命令

```bash
# 通用（.agents/skills）
npx skills@1.5.17 add flutter/agent-plugins --skill '*' --agent universal --yes

# Claude Code plugin
claude plugin marketplace add flutter/agent-plugins
claude plugin install dart-flutter@dart-flutter
claude plugin marketplace list

# 纯 Dart 任务
npx skills add dart-lang/skills --skill '*'
```

## Skill 与 MCP

- **MCP**：给 agent **访问** Dart/Flutter 专用工具
- **Skill**：教 agent「**怎么用**」工具完成特定任务（如用 previews.dart 加 preview、Flutter Driver 把 MCP 动作转永久集成测试）
- 插件把二者 + rules **捆绑**，happy path 工作流开箱即用

## 分层架构速览

| 层 | 组件 | 要点 |
| --- | --- | --- |
| UI | View / ViewModel | MVVM；ViewModel extends ChangeNotifier，暴露不可变状态快照 |
| Data | Service / Repository | Service 包 API；Repository 转 Domain Model + 缓存/离线/重试（单一真相源） |
| Domain（可选）| Use Case | 仅复杂/复用时用 |

## 许可与链接

- **许可**：BSD-3-Clause（同 Flutter 本体）
- 仓库：[flutter/agent-plugins](https://github.com/flutter/agent-plugins)
- 文档：[docs.flutter.dev/ai](https://docs.flutter.dev/ai) · [Create with AI](https://docs.flutter.dev/ai/create-with-ai)
- Dart skills：[dart-lang/skills](https://github.com/dart-lang/skills)
- 相关叶：[Expo Skills](../expo-skills/)（同「移动与跨端」组，RN 侧）
