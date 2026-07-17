---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 flutter/agent-plugins 官方各 SKILL.md 编写（含 flutter-apply-architecture-best-practices、flutter-fix-layout-issues 等）。

## 速查

- **分层架构**（flutter-apply-architecture-best-practices）：UI（MVVM：View + ViewModel extends ChangeNotifier）/ Data（Repository + Service）/ Domain（可选 Use Case）；`lib/data|domain|ui`
- **布局铁律**（flutter-fix-layout-issues）：**Constraints go down. Sizes go up. Parent sets position.**
- **常见布局错**：Vertical viewport unbounded height（ListView 套 Column）/ RenderFlex overflowed / Expanded 在 Flex 外 / RenderBox was not laid out（看更上层）
- **flutter-\***：路由（setup-declarative-routing）、本地化、响应式布局、widget preview/test、集成测试、JSON 序列化、HTTP
- **dart-\***：单测/覆盖率/静态分析/FFI/ffigen/pattern matching/primary constructors

## flutter-apply-architecture-best-practices：分层架构

强制**关注点分离**，把应用分成三层，**绝不**把 UI 渲染与业务逻辑/数据获取混在一起：

### UI 层（Presentation）—— MVVM

- **Views**：写精简、可复用的 widget；View 里只放 UI 相关逻辑（动画、布局约束、简单路由）；数据全从 ViewModel 传入
- **ViewModels**：管 UI 状态 + 处理用户交互；`extends ChangeNotifier`（或 `Listenable`）暴露状态；只暴露**不可变状态快照**给 View；Repository 经构造函数注入

### Data 层 —— Repository 模式（单一真相源）

- **Services**：无状态类，包外部 API（HTTP 客户端、本地数据库、平台插件）；返回原始 API model 或 `Result` 包装
- **Repositories**：消费一到多个 Service；把原始 API model 转成干净的 Domain Model；处理缓存、离线同步、重试；向 ViewModel 暴露 Domain Model

### Logic 层（Domain，可选）—— Use Case

- 仅当业务逻辑复杂到塞满 ViewModel、或需跨多个 ViewModel 复用时才用；抽成 Use Case（interactor）类，夹在 ViewModel 与 Repository 之间

**项目结构**（UI 按 feature 分组，Data/Domain 按 type 分组）：

```text
lib/
├── data/         # models（API）/ repositories / services
├── domain/       # models（干净）/ use_cases（可选）
└── ui/           # 按 feature 分组的 View + ViewModel
```

## flutter-fix-layout-issues：布局排错

Flutter 布局铁律：**Constraints go down. Sizes go up. Parent sets position.**（约束向下、尺寸向上、父定位）。布局错误多因**无界约束**或**未约束子组件**导致协商失败。按错误签名诊断：

| 错误 | 触发 |
| --- | --- |
| **Vertical viewport was given unbounded height** | 可滚动 widget（ListView/GridView）放进未约束的竖向父（Column），父给无限高、子想无限扩展 |
| **InputDecorator...cannot have an unbounded width** | TextField/TextFormField 放进未约束的横向父（Row） |
| **RenderFlex overflowed** | Row/Column 的子请求尺寸大于父分配约束（黄黑警示条） |
| **Incorrect use of ParentData widget** | ParentDataWidget 不是所需祖先的直接后代（如 `Expanded` 在 `Flex` 外、`Positioned` 在 `Stack` 外） |
| **RenderBox was not laid out** | 级联副作用错，**忽略它**、往上看栈里真正的约束违规（通常是 unbounded 高/宽） |

## 其它 flutter-\* 技能

| skill | 用途 |
| --- | --- |
| setup-declarative-routing | 声明式路由 |
| setup-localization | 本地化 i18n |
| build-responsive-layout | 响应式布局 |
| add-widget-preview | 用 previews.dart 加交互 widget preview |
| add-widget-test / add-integration-test | widget 测试 / 集成测试（Flutter Driver 把 MCP 动作转成永久集成测试） |
| implement-json-serialization | JSON 序列化 |
| use-http-package | HTTP 请求 |

## dart-\* 技能

覆盖纯 Dart 任务：add-unit-test、collect-coverage、run-static-analysis、fix-runtime-errors、generate-test-mocks、migrate-to-checks-package、resolve-package-conflicts、setup-ffi-assets、use-ffigen、use-pattern-matching、use-primary-constructors、build-cli-app 等。

## 反模式

| 反模式 | 正确 |
| --- | --- |
| View 里写业务逻辑/数据获取 | 分层：逻辑进 ViewModel、数据进 Repository |
| ViewModel 暴露可变状态 | 暴露不可变状态快照 |
| ListView 直接放进 Column | 约束高度（Expanded/SizedBox）避免 unbounded |
| 看到 RenderBox was not laid out 就改它 | 往上看真正的约束违规 |
| 无脑加 Use Case 层 | 仅逻辑复杂/需复用时才加（可选层） |

## 下一步

- [参考](./reference) —— flutter-\*/dart-\* 完整清单、安装命令、MCP、许可、链接
- 上游：[flutter/agent-plugins](https://github.com/flutter/agent-plugins) · [docs.flutter.dev/ai](https://docs.flutter.dev/ai)
