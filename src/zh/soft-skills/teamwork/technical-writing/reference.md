---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 writethedocs.org 与 keepachangelog.com 编写 —— 文档类型矩阵 / OpenAPI / CHANGELOG / 图表工具对照 / 写作原则 / 工具链

## 文档类型矩阵

| 类型 | 受众 | 目的 | 关键产物 | 规范/工具 |
|---|---|---|---|---|
| **API 文档** | 集成者 | 零摩擦使用 API | spec + 交互文档 | OpenAPI / Redoc |
| **架构文档** | 团队/新人 | 解释设计与决策 | 设计文档 + ADR + 图 | C4 模型 / ADR |
| **README** | 所有人 | 30 秒决策 | 项目门面 | Standard README |
| **CHANGELOG** | 使用者 | 升级有预期 | 变更记录 | Keep a Changelog |
| **技术博客** | 社区/同行 | 经验外溢 | 长文 + 示例 | Markdown / MDX |
| **教程** | 新手 | 手把手学会 | step-by-step | 渐进式示例 |
| **参考手册** | 资深用户 | 查阅细节 | 全 API/配置 | 自动生成 |
| **运行手册 Runbook** | 运维 | 应急处置 | 故障流程 | SOP 模板 |

## OpenAPI 速查

### 结构骨架

```yaml
openapi: 3.1.0          # 版本
info:                    # 元信息
  title: ...
  version: ...
  description: ...
servers:                 # 服务器地址
  - url: https://api.example.com/v1
paths:                   # 路径与操作
  /resource:
    get:
      summary: ...
      parameters: ...
      responses: ...
components:              # 可复用组件
  schemas:
    Model: ...
  securitySchemes: ...
security:                # 全局安全
  - ApiKeyAuth: []
tags: []                 # 分组
```

### 常用工具

| 工具 | 用途 |
|---|---|
| **Swagger UI** | 交互式 API 文档（可试调）|
| **Redoc** | 美观的只读 API 文档 |
| **openapi-generator** | 生成 SDK / 服务端桩 |
| **Prism** | Mock 服务 |
| **Spectral** / **vacuum** | OpenAPI lint / 规范检查 |
| **Stoplight Studio** | 可视化 OpenAPI 编辑器 |

## CHANGELOG 速查

### Keep a Changelog 六类

| 类别 | 何时用 |
|---|---|
| **Added** | 新增功能 |
| **Changed** | 现有功能变更（非新增非修复）|
| **Deprecated** | 标记即将移除 |
| **Removed** | 本次移除（通常先 Deprecated）|
| **Fixed** | bug 修复 |
| **Security** | 安全漏洞修复 |

### 完整模板

```markdown
# Changelog

All notable changes to this project will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- ...

## [1.2.0] - 2026-07-15

### Added
- 批量导出（CSV/Excel）

### Changed
- 默认分页 20 → 50

### Deprecated
- `/orders/list` 废弃，用 `/orders`

### Fixed
- 时区导致日期错位

### Security
- 修复 SQL 注入（CVE-2026-xxxx）

## [1.1.0] - 2026-05-10
...
```

### Conventional Commits type 对照

| type | 说明 | 进 CHANGELOG | SemVer |
|---|---|---|---|
| `feat` | 新功能 | Added | MINOR |
| `fix` | bug 修复 | Fixed | PATCH |
| `BREAKING CHANGE` / `feat!` | 破坏性 | Changed | MAJOR |
| `docs` | 文档 | 不进 | - |
| `style` | 格式 | 不进 | - |
| `refactor` | 重构 | 不进 | - |
| `perf` | 性能 | perf（视工具）| PATCH |
| `test` | 测试 | 不进 | - |
| `build` / `ci` / `chore` | 工程类 | 不进 | - |

提交示例：

```
feat(orders): 支持批量导出 CSV

新增 GET /orders/export 端点，异步生成下载链接。

Closes #123
```

## Diagrams as Code 工具对照

### 全面对照

| 维度 | Mermaid | PlantUML | D2 |
|---|---|---|---|
| **语法** | Markdown 内嵌 / 类 JS | Java 风格 DSL | 现代声明式 |
| **渲染** | 浏览器原生（JS）| 服务端（Java）| 本地/CLI（Go）|
| **GitHub 渲染** | **原生支持** | 需插件/Action | 需 Action |
| **UML 完整度** | 中（常见图）| **全（UML 标杆）**| 中 |
| **美观度** | 中 | 中 | **高（现代设计）**|
| **自动布局** | 有限 | 有限 | **强（多引擎）**|
| **主题** | 有限 | 有限 | **丰富（设计师主题）**|
| **导出** | SVG/PNG | SVG/PNG/PDF | **SVG/PNG/PDF**|
| **Sketch 手绘风** | 无 | 无 | **有**|
| **生态成熟度** | 高（社区广）| **高（企业）**| 新兴 |
| **学习曲线** | 低 | 中 | 低-中 |

### 支持的图类型

| 图类型 | Mermaid | PlantUML | D2 |
|---|---|---|---|
| 流程图 Flowchart | ✅ | ✅ | ✅ |
| 时序图 Sequence | ✅ | ✅ | ✅ |
| 类图 Class | ✅ | ✅ | ✅ |
| 状态图 State | ✅ | ✅ | ✅ |
| 实体关系 ER | ✅ | ✅ | ✅ |
| 甘特图 Gantt | ✅ | ✅ | ❌ |
| 饼图 Pie | ✅ | ❌ | ❌ |
| 思维导图 Mindmap | ✅ | ❌ | ❌ |
| 组件/部署图 | ✅ | ✅（UML 部署图）| ✅ |
| 网络架构 | 有限 | 有限 | **强** |

### 选型决策

```
图要内嵌 GitHub README/Wiki？
├─ 是 → Mermaid（原生渲染）
└─ 否 → 需要标准 UML？
        ├─ 是 → PlantUML
        └─ 否 → 需要演示级美观？
                ├─ 是 → D2
                └─ 否 → Mermaid（默认，生态最广）
```

## 写作原则速查

### 受众先行

写之前问三个问题：
1. 读者是谁？（初级/资深/外部/非技术）
2. 他们已经知道什么？（背景假设）
3. 他们需要知道什么？（目标）

### 主动 vs 被动语态

| 被动（避免）| 主动（推荐）|
|---|---|
| The error is returned by the system | The system returns the error |
| Configuration should be modified | Modify the configuration |
| It is recommended that | We recommend |

### 术语一致性

- 建术语表（glossary），定义关键术语
- 全篇同一概念用同一个词
- 中英文混用要统一（要么全「端点」要么全「endpoint」）

### 简洁原则

- 一句话表达一个意思
- 列表优于长段落
- 示例配抽象描述
- 删掉「非常」「十分」「基本上」等填充词

## SemVer 速查

```
MAJOR.MINOR.PATCH
```

| 变更类型 | 影响位 | 示例 |
|---|---|---|
| 不兼容 API 变更 | MAJOR | 1.2.3 → 2.0.0 |
| 兼容新功能 | MINOR | 1.2.3 → 1.3.0 |
| bug 修复 | PATCH | 1.2.3 → 1.2.4 |
| 预发布 | 后缀 | 1.0.0-alpha.1 |
| 构建元数据 | +后缀 | 1.0.0+exp.sha.5114f85 |

规则：一旦发布，该版本号内容不可变；后续变更只能递增新版本。

## 文档质量五要素（writethedocs）

| 要素 | 含义 | 检查方法 |
|---|---|---|
| 可发现 Discoverable | 读者能找到 | 搜索/导航是否顺畅 |
| 可读 Readable | 找到能读懂 | 受众测试、结构清晰 |
| 准确 Accurate | 内容正确 | 专家审、代码示例可运行 |
| 及时 Current | 与产品同步 | Docs as Code、更新日期标记 |
| 连贯 Coherent | 风格一致 | 风格指南、术语表、lint |

## 写作工具链全表

| 环节 | 工具 |
|---|---|
| 编辑 | VS Code / Obsidian / HackMD |
| Markdown 扩展 | MDX（组件嵌入）/ reST / AsciiDoc |
| 图表 | Mermaid / PlantUML / D2 / Excalidraw |
| 静态站点 | VitePress / Docusaurus / MkDocs Material / Antora / docsify |
| API 文档 | Redoc / Swagger UI / Stoplight |
| CI 检查 | markdownlint / vale / cspell / markdown-link-check / lychee |
| CHANGELOG | standard-version / semantic-release / changesets / lerna |
| 协作 | Git PR / GitHub Review / Notion / Confluence |
| 翻译 i18n | Crowdin / Lokalise（Docusaurus 原生支持）|
| 分析 | Google Analytics / Plausible（阅读量）|

## 参考

- Write the Docs 指南：<https://www.writethedocs.org/guide/>
- Docs as Code：<https://www.writethedocs.org/guide/docs-as-code/>
- Keep a Changelog：<https://keepachangelog.com/>
- Conventional Commits：<https://www.conventionalcommits.org/>
- Semantic Versioning：<https://semver.org/>
- OpenAPI 规范：<https://spec.openapis.org/oas/v3.1.0>
- Mermaid：<https://mermaid.js.org/> / [GitHub](https://github.com/mermaid-js/mermaid)
- PlantUML：<https://plantuml.com/>
- D2：<https://d2lang.com/>
- Redoc：<https://redocly.com/redoc>
- Docusaurus：<https://docusaurus.io/>
- VitePress：<https://vitepress.dev/>
