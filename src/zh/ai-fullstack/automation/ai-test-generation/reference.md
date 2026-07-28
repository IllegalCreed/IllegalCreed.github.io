---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Diffblue Cover（diffblue.com/docs，2026）、EvoSuite（evosuite.org）、GitHub Copilot（docs.github.com/copilot）官方文档与 Qodo Cover（github.com/Codium-ai/cover-ai，**已停维护**）编写

## Diffblue Cover

### 版本对比

| 维度 | Community | Enterprise |
|---|---|---|
| 价格 | 免费 | 付费（按席位/年） |
| 形态 | IntelliJ IDEA 插件 | 命令行 + IDE |
| 生成上限 | 每日有限额度 | 批量、无上限 |
| CI 集成 | 无 | 支持（GitHub Actions / Jenkins） |
| 覆盖范围 | 单类 / 方法 | 全仓库批量 |
| 支持 Java 版本 | 主流 LTS（8/11/17/21） | 同 Community |
| 断言来源 | 强化学习实际执行 | 同 |

### IntelliJ 插件命令（右键菜单）

| 菜单 | 作用 |
|---|---|
| Write Tests | 为当前类生成测试 |
| Write Tests for Method | 仅选中方法 |
| Update Tests | 代码变更后刷新已有测试 |

### Enterprise CLI

| 命令 | 作用 |
|---|---|
| `dcover create-tests --target &lt;dir&gt;` | 批量生成 |
| `dcover validate` | 跑所有生成测试确认通过 |
| `dcover --help` | 查全部子命令 |

### 输出测试特性

- 框架：JUnit（与项目版本匹配）
- 断言：基于代码实际执行的真实输出
- 命名：`shouldXWhenY` 风格，描述行为意图
- 位置：对应 `src/test/java/<同包>` 下 `XTest.java`

## EvoSuite

### 命令行参数

| 参数 | 作用 |
|---|---|
| `-targetClass &lt;FQN&gt;` | 被测类全限定名 |
| `-targetClasses <prefix*>` | 通配批量 |
| `-projectCP &lt;path&gt;` | 项目 classpath（编译输出目录） |
| `-Dsearch_budget=<秒>` | 搜索时长预算 |
| `-Dcriterion=&lt;c1,c2&gt;` | 覆盖准则：BRANCH/LINE/EXCEPTION/WEAKMUTATION 等 |
| `-Dminimize=&lt;bool&gt;` | 测试最小化 |
| `-Djunit=<4|5>` | 指定 JUnit 版本 |
| `-generateSuite` | 生成测试套件（默认） |

### Maven 插件

```xml
<plugin>
  <groupId>org.evosuite.plugins</groupId>
  <artifactId>evosuite-maven-plugin</artifactId>
  <version>1.2.0</version>
</plugin>
```

| 目标 | 作用 |
|---|---|
| `mvn evosuite:generate` | 生成测试 |
| `mvn evosuite:export` | 导出到 src/test |
| `mvn evosuite:clean` | 清理临时产物 |

### 覆盖准则取值

| 准则 | 含义 |
|---|---|
| `LINE` | 行覆盖 |
| `BRANCH` | 分支覆盖（最常用） |
| `EXCEPTION` | 异常路径 |
| `WEAKMUTATION` | 弱变异（测 mutation 能否被检测） |
| `OUTPUT` | 输出覆盖 |

可组合：`-Dcriterion=BRANCH,LINE`。

## GitHub Copilot 生成测试

### 触发方式

| 方式 | 操作 |
|---|---|
| 右键菜单 | 选中代码 → Copilot → Generate Tests |
| Copilot Chat | `为 <函数> 生成 <框架> 测试，覆盖 <目标>` |
| 内联（Cmd+I） | 选中函数 → 「生成单测」 |

### 推荐提示词要素

| 要素 | 示例 |
|---|---|
| 框架 | JUnit5 / Pytest / Jest / Vitest |
| 断言库 | AssertJ / pytest asserts / Vitest expect |
| 覆盖目标 | 正常路径 / 边界值 / 异常路径 |
| Mock 策略 | 用 Mockito mock Repository，标注依赖 |
| 反幻觉约束 | 「断言针对真实返回值，禁止硬编码期望值/恒真断言」 |

### Cursor / Claude 同理

在 Cursor Composer 或 Claude Code 里同样用上述提示词结构，差异仅在交互入口。本质都是 LLM 序列预测，断言复核纪律一致。

## Qodo Cover（停维护，仅作学习样本）

> 仓库 `Codium-ai/cover-ai` 已标注「This repository is no longer maintained」，**2025-06 起停维护**。下表仅作历史参考，新项目勿用。

| 维度 | 说明 |
|---|---|
| 形态 | CLI / GitHub CI |
| 工作方式 | agentic：用项目已有 test runner + coverage parser 循环「生成→跑→读覆盖→改进」 |
| 目标 | 提升代码覆盖率 |
| 语言 | 依赖项目 runner（pytest/maven/gradle 等，多语言） |
| 状态 | **no longer maintained，仅作学习样本** |
| 思想继承 | agentic 闭环思想被 Qodo Gen/Merge 等后续产品吸收 |

## 弃用 / 状态提示

- **Qodo Cover（Codium-ai/cover-ai）**：仓库标注不再维护，2025-06 起停维护，仅作学习样本，新项目不应采用
- EvoSuite：仍开源可用，但对最新 Java 版本/框架兼容跟进偏慢，使用前需验证编译与运行

## 选型决策表

| 场景 | 推荐 |
|---|---|
| 大型 Java 项目，要可靠回归断言 | Diffblue Cover（Enterprise 批量 + CI） |
| 个人 Java 学习 / 单类快速补测 | Diffblue Cover Community（免费插件） |
| 学术研究 / 搜索式测试实验 | EvoSuite |
| 跨语言团队，追求速度，能人审断言 | GitHub Copilot / Cursor + 提示词工程 |
| 已停维护工具 | 不选 Qodo Cover（仅作学习样本） |
| 验证测试有效性 | 配合 PIT（Java）/ Stryker（JS）变异测试 |

## 版本与生态

- Diffblue Cover：商业产品，Community 插件在 JetBrains Marketplace；聚焦 Java/JUnit
- EvoSuite：开源（GitHub EvoSuite/evosuite），Java；学术起源，LGPL 许可
- Copilot / Cursor / Claude：闭源/订阅，跨语言，依赖 LLM
- Qodo Cover：开源但已停维护（Codium-ai/cover-ai），仅作学习样本
