---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 writethedocs.org 与 keepachangelog.com 官方文档编写（2026.07 版本）

## 速查

- 技术写作本质：把「会做」变成「能教会别人」，是工程师影响力的放大器
- 五类核心文档：**API 文档 / 架构文档 / README / CHANGELOG / 技术博客**
- API 文档规范：**OpenAPI**（前身 Swagger），机器可读 + 人可读，驱动 mock/SDK/文档生成
- README 工程：项目门面，**30 秒决定别人是否用你的项目**
- CHANGELOG 标准：**Keep a Changelog**（Added/Changed/Deprecated/Removed/Fixed/Security 六类）
- CHANGELOG 自动化：**Conventional Commits**（feat/fix/BREAKING CHANGE）→ 自动生成 CHANGELOG
- 架构文档：设计文档 + **ADR**（Architecture Decision Record）记录决策上下文
- **Docs as Code**：文档当代码——版本控制、CI/CD、代码评审、自动化测试
- **Diagrams as Code**：Mermaid（Markdown 内嵌）/ PlantUML（Java DSL）/ D2（现代声明式）
- 写作三原则：**受众先行 / 主动语态 / 术语一致**
- 信源：writethedocs.org（Docs as Code 方法论）+ keepachangelog.com（CHANGELOG 标准）
- SemVer 语义化版本：MAJOR.MINOR.PATCH（不兼容/新增功能/修 bug）
- 好文档的标准：**可发现、可读、准确、及时、连贯**（writethedocs 五要素）

## 技术写作是什么

技术写作是把技术知识转化为**他人能理解、能使用的文档**的能力。它不是「写代码后的附加任务」，而是工程实践的核心一环。

### 五类核心文档矩阵

| 文档类型 | 受众 | 核心目的 | 关键产物 |
|---|---|---|---|
| **API 文档** | 集成者 | 让 API 零摩擦被使用 | OpenAPI spec + 交互文档 |
| **架构文档** | 团队/新人 | 解释系统设计与决策 | 设计文档 + ADR + 架构图 |
| **README** | 所有人（含外部）| 30 秒决定是否使用 | 项目门面 |
| **CHANGELOG** | 使用者 | 让升级有预期 | 变更记录 |
| **技术博客** | 社区/同行 | 经验外溢、建立影响 | 长文 + 示例 |

### Docs as Code 方法论

[Write the Docs](https://www.writethedocs.org/) 推动的 **Docs as Code**：把文档用**与代码相同的工具和流程**管理：

| 维度 | 传统文档 | Docs as Code |
|---|---|---|
| 格式 | Word/Wiki 富文本 | **纯文本标记**（Markdown/reST/AsciiDoc）|
| 版本控制 | 文件系统/附件 | **Git**（与代码同库或配套）|
| 评审 | 邮件/口头 | **Pull Request**（与代码同审）|
| 发布 | 手动复制 | **CI/CD**（推送即构建部署）|
| 测试 | 无 | **自动化**（死链/拼写/lint）|
| 同步 | 人工记忆 | **代码变更触发文档更新** |

核心理念：**写文档的人和写代码的人是同一拨**，用同一套工具，文档才能与产品同步演进。

## API 文档与 OpenAPI

### 为什么需要规范

非结构化的 API 文档（一堆 Markdown 描述端点）问题：易过时、不能驱动工具、无法自动测试。**OpenAPI**（前身 Swagger）用一份机器可读的 spec 描述整个 API，一次编写，多处使用。

### OpenAPI 示例

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: 订单 API
  version: 1.0.0
paths:
  /orders/{id}:
    get:
      summary: 获取订单
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '404':
          description: 订单不存在
components:
  schemas:
    Order:
      type: object
      properties:
        id:
          type: string
        amount:
          type: number
        status:
          type: string
          enum: [pending, paid, shipped]
```

### OpenAPI 驱动的工具链

一份 spec 驱动整个生态：

| 用途 | 工具 |
|---|---|
| 交互式文档 | **Redoc** / **Swagger UI** |
| Mock 服务 | Prism / Swaggermock |
| 客户端 SDK 生成 | openapi-generator |
| 服务端桩 | openapi-generator server |
| 契约测试 | Dredd / Schemathesis |
| Lint/规范检查 | Spectral / vacuum |

**核心收益**：spec 是单一真相源（single source of truth），文档/mock/SDK/测试全部自动同步。

## README 工程

README 是项目的**门面**——读者 30 秒内决定是否继续了解。开源项目的 README 尤其关键。

### README 必备结构

```markdown
# 项目名

一句话说清是什么、解决什么问题。

[徽章：build status / version / license]

## 特性
- 特性 1
- 特性 2

## 快速开始
安装 + 最小可运行示例（复制即用）

## 安装
详细安装步骤

## 用法
进阶用法 + 示例

## 文档
完整文档链接

## 贡献
如何贡献（CONTRIBUTING.md 链接）

## License
开源协议
```

### README 写作要点

- **一句话价值主张**：开头说清「这是什么 + 为什么你应该用」
- **可复制的快速开始**：复制粘贴就能跑的最小示例
- **徽章（Badges）**：构建状态、版本、覆盖率、License——建立信任
- **截图/GIF**：CLI/GUI 项目用动图展示效果
- **链接而非堆砌**：详细内容放 docs/，README 只放入口

::: tip README 是营销文档
开源 README 本质是「说服别人用你的项目」的营销文档。写得像「内部备忘录」的项目很难被采用。
:::

## CHANGELOG 与 Conventional Commits

### Keep a Changelog 规范

[keepachangelog.com](https://keepachangelog.com/) 定义 CHANGELOG 的标准格式，六类变更：

| 类别 | 含义 |
|---|---|
| **Added** | 新增功能 |
| **Changed** | 现有功能变更 |
| **Deprecated** | 即将移除的功能 |
| **Removed** | 本次移除的功能 |
| **Fixed** | bug 修复 |
| **Security** | 安全相关修复 |

### CHANGELOG 示例

```markdown
# Changelog

## [1.2.0] - 2026-07-15

### Added
- 支持批量导出订单（CSV/Excel）
- 新增 webhook 事件 `order.shipped`

### Changed
- `GET /orders` 默认分页从 20 改为 50

### Deprecated
- `GET /orders/list` 废弃，改用 `GET /orders`（下个大版本移除）

### Fixed
- 修复时区导致订单日期错位的问题

### Security
- 修复 SQL 注入漏洞（CVE-2026-xxxx）
```

### Conventional Commits 自动化

[Conventional Commits](https://www.conventionalcommits.org/) 规范提交信息，配合工具自动生成 CHANGELOG：

```
<type>(<scope>): <description>

[可选 body]

[可选 footer(s)]
```

type 决定 CHANGELOG 分类与版本号：

| type | CHANGELOG 类别 | SemVer 影响 |
|---|---|---|
| `feat` | Added | MINOR +1 |
| `fix` | Fixed | PATCH +1 |
| `BREAKING CHANGE` | Changed | MAJOR +1 |
| `docs` | （不进 CHANGELOG）| 无 |
| `chore` / `refactor` / `test` | （不进）| 无 |

工具链：`commitlint`（校验提交格式）+ `standard-version` / `semantic-release`（自动生成 CHANGELOG + 打 tag + 发版）。

## 下一步

入门到此——你已经掌握五类文档矩阵、OpenAPI 规范、README 工程、Keep a Changelog + Conventional Commits、Docs as Code 方法论。下一章 `guide-line.md` 深入讲 **架构文档与 ADR / Docs as Code 工作流实战 / Diagrams as Code（Mermaid·PlantUML·D2 选型）/ 写作原则与风格 / SemVer 语义化版本 / 文档测试与质量保障 / 写作工具链**。
