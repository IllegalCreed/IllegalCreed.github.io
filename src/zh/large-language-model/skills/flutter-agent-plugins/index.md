---
layout: doc
---

# Flutter Agent Plugins

Flutter Agent Plugins 是 **Flutter 官方**（源在 `flutter/agent-plugins`，Flutter 团队维护，BSD-3-Clause，★2.7k）出品的一组 agent 插件——把 **skills + MCP server 配置 + rules** 捆绑在一起，为 Flutter「happy path」开发提供量身定制的工作流与指令，靠给 agent 领域专长 + 可复用工作流大幅减少出错。其中 **Agent Skills** 是核心：一个个「文件夹式」技能，与 MCP 互补——MCP 给 agent 访问专用工具，Skill 教 agent「怎么用」这些工具完成特定任务。含 **flutter-\*** 技能（架构最佳实践、修布局错误、响应式布局、声明式路由、本地化、widget preview/test、集成测试、JSON 序列化、HTTP）与 **dart-\*** 技能（单测/覆盖率/静态分析/FFI/ffigen/pattern matching/primary constructors 等 12+），另可搭配 `dart-lang/skills`。

## 评价

**优点**

- **Flutter 官方**：flutter 团队维护、BSD-3（同 Flutter 本体）、随 Flutter/Dart 演进
- **三件捆绑**：skills + MCP server 配置 + rules 一起装，给 agent 完整领域专长
- **Skill 与 MCP 互补**：MCP 给工具访问，Skill 教「怎么用工具」完成任务
- **架构 skill 权威**：flutter-apply-architecture-best-practices 强制分层（UI/Logic/Data）+ MVVM + Repository
- **布局排错 skill**：flutter-fix-layout-issues 用「Constraints go down. Sizes go up. Parent sets position.」铁律诊断 RenderFlex overflow / unbounded 等
- **Dart + Flutter 双覆盖**：flutter-\* 10 个 + dart-\* 12 个
- **多 agent 通用**：`--agent universal` 装到标准 `.agents/skills`，也有 Claude Code 官方 plugin

**缺点 / 边界**

- **面向 Flutter/Dart**：非通用技能，服务移动/跨端 Flutter 开发
- **happy path 导向**：为常见正道工作流优化，边缘场景仍需人工
- **依赖 skills CLI / plugin**：`npx skills add` 或 `claude plugin install`
- **skill 元数据标 Gemini**：部分 SKILL.md 作者/测试用 Gemini（Flutter=Google 系），但 skill 本身 agent-agnostic，Claude Code 可装用

## 适用场景

- 用 AI 建/重构 Flutter 应用，想照官方分层架构（MVVM + Repository）
- 修 Flutter 布局错误（RenderFlex overflow、unbounded 约束）
- 加 widget preview / widget test / 集成测试、声明式路由、本地化、JSON 序列化
- Dart 任务：单测、覆盖率、静态分析、FFI/ffigen、pattern matching

## 边界

- **只服务 Flutter/Dart**：移动/跨端 Flutter 开发
- **happy path 优化**：常见正道工作流
- **依赖 CLI/plugin 安装**
- **贡献到 flutter/agent-plugins**：官方仓库

## 官方文档

[docs.flutter.dev/ai](https://docs.flutter.dev/ai) ｜ [Create with AI](https://docs.flutter.dev/ai/create-with-ai) ｜ [dart-lang/skills](https://github.com/dart-lang/skills)

## GitHub 地址

[flutter/agent-plugins](https://github.com/flutter/agent-plugins)（官方，BSD-3-Clause）

## 内容地图

- [入门](./getting-started) —— 定位、安装（skills CLI / Claude plugin）、skills+MCP+rules 捆绑、Skill vs MCP
- [指南](./guide-line) —— flutter-\* 技能（架构/布局/路由/本地化/preview/测试）、dart-\* 技能、分层架构、布局铁律
- [参考](./reference) —— flutter-\*/dart-\* 清单、安装命令、MCP、许可、链接

## 幻灯片地址

<a href="/SlideStack/flutter-agent-plugins-slide/" target="_blank">Flutter Agent Plugins</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=618" target="_blank" rel="noopener noreferrer">Flutter Agent Plugins 测试题</a>
