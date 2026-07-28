---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Diffblue Cover（diffblue.com/docs，2026）、EvoSuite（evosuite.org）、GitHub Copilot（docs.github.com/copilot）官方文档与 Qodo Cover（github.com/Codium-ai/cover-ai，**已停维护**）编写

## 速查

- **Diffblue RL 核心**：强化学习智能体实际执行目标代码 → 学习输入/输出行为 → 产出带真实断言的 JUnit 测试
- **EvoSuite 进化核心**：遗传算法——种子变异/交叉、按覆盖率适应度迭代筛选、最大化分支/行覆盖
- **LLM 提示词核心**：指明框架 + 覆盖目标 + Mock 策略 + 禁止硬编码期望值，缓解幻觉断言
- **覆盖率陷阱**：覆盖率只衡量「代码被触达」，不衡量「断言验证了真实行为」
- **Diffblue vs LLM 关键差异**：Diffblue 跑代码验证断言（可靠）；LLM 凭模型猜测断言（易幻觉）
- **EvoSuite 局限**：学术出身，新 Java 版本/框架兼容跟进慢，偶发编译失败
- **Qodo Cover 历史**：曾以「用项目已有 runner + coverage parser」的 agentic 方式出名，**2025-06 停维护，仅作学习样本**
- **CI 集成**：Diffblue Enterprise / EvoSuite Maven 插件 / Copilot 均可接入 PR 流水线
- **复核纪律**：AI 测试必须人审断言，删测试后原代码若有 bug 测试应失败
- **选型矩阵**：Java 重资产→Diffblue；学术/覆盖率→EvoSuite；跨语言快生成→Copilot/Cursor

## 三大流派原理深入

### 强化学习派：Diffblue Cover

Diffblue Cover 的核心是把「写测试」建模成强化学习问题：

1. 静态分析目标类，确定可调用方法与签名
2. RL 智能体生成测试输入（构造对象、调方法、传参）
3. **实际执行**被测代码，观察输出与异常
4. 按覆盖增量 + 断言有效性给奖励，迭代优化
5. 产出能编译、能通过、断言基于真实执行的 JUnit 测试

关键差异：因为真正跑了代码，它的断言不是「猜测 a+b 应该等于几」，而是「我执行 a=2,b=3 得到 5，所以断言 5」。这让测试有意义——后续若代码行为变化（如改成返回 a*b），测试会失败，真正起到回归保护。

### 进化算法派：EvoSuite

EvoSuite 用搜索式软件测试（Search-Based Software Testing）：

```text
1. 随机生成一批测试用例（种群）
2. 执行，计算适应度（主要看分支/行覆盖增量）
3. 选择高适应度个体 → 交叉 / 变异 产生新一代
4. 重复若干代，直到覆盖收敛或代数上限
5. 输出覆盖最大化的测试集 + 断言
```

它不依赖训练数据或 LLM，纯靠搜索算法在「测试用例空间」里找高覆盖解。优点：可解释、不联网、纯本地；缺点：适应度只盯覆盖率，断言质量不如 Diffblue，且对新框架兼容慢。

### LLM 派：Copilot / Cursor / Claude

LLM 生成测试的本质是「序列预测」：模型读了被测函数 + 提示词，预测一段「看起来像测试」的代码。优势是跨语言、灵活、快；致命弱点是断言质量无保障——模型可能：

```java
// 幻觉断言示例（错误示范）
@Test
void shouldAdd() {
    Calculator c = new Calculator();
    c.add(2, 3);
    assertThat(true).isTrue();   // 断言恒真，毫无意义
}
// 或硬编码
assertThat(result).isEqualTo(5); // result 可能根本没赋值正确
```

因此 LLM 派必须人工复核断言，提示词里强制「断言针对真实返回值，禁止硬编码期望值」可缓解但无法根除。

## 三流派横向对比

| 维度 | Diffblue Cover（RL） | EvoSuite（进化） | LLM（Copilot/Cursor） |
|---|---|---|---|
| 技术 | 强化学习 + 代码执行 | 遗传算法 / 搜索 | 大语言模型 |
| 断言可靠性 | 高（基于执行） | 中（基于覆盖） | 低（可能幻觉） |
| 语言 | Java（JUnit） | Java | 几乎任意语言 |
| 是否联网 | 否（本地） | 否（本地） | 多数需云端（除本地模型） |
| 新框架兼容 | 跟进 Enterprise 版 | 慢，偶发问题 | 快（模型随训随新） |
| 成本 | Community 免费/Enterprise 付费 | 开源免费 | 按 LLM 计费 |
| 适合 | Java 重资产、求可靠回归 | 学术研究、纯拉覆盖率 | 快速跨语言、人能复核 |

## Diffblue Cover 工作流

### 单类生成（Community）

1. IntelliJ 装插件 → 打开 Java 类
2. 右键 → Diffblue Cover → Write Tests（或 Write Tests for Class）
3. 插件后台执行 RL，生成 `XTest.java` 到 test 源码目录
4. 自动跑一遍验证测试通过

### 批量 + CI（Enterprise）

```bash
dcover create-tests \
  --target src/main/java \
  --output src/test/java
dcover validate          # 跑所有生成的测试确认通过
```

可挂 GitHub Actions / Jenkins，在 PR 时自动为新改动文件补测试、阻止覆盖率下降。

## EvoSuite 进化参数

| 参数 | 作用 |
|---|---|
| `-targetClass &lt;FQN&gt;` | 指定被测类 |
| `-projectCP &lt;path&gt;` | 项目 classpath |
| `-Dsearch_budget=N` | 搜索预算（秒），越长覆盖越好 |
| `-Dcriterion=BRANCH` | 覆盖准则（分支/行/异常等，可组合） |
| `-Dminimize=true` | 测试用例最小化（去冗余） |

经验：`search_budget` 给 60-120 秒、`criterion` 组合 BRANCH,LIN E 常见。

## Qodo Cover（停维护，仅作学习样本）

> 仓库已标注「no longer maintained」，**2025-06 起停维护**，新项目不应采用。下文仅作历史与思想学习。

Qodo Cover（原 CodiumAI Cover）的 agentic 思路：用项目**已有的** test runner（pytest/maven/gradle 等）与 coverage parser，让 agent 循环「生成测试 → 跑测试 → 读覆盖率 → 改进」，目标是产出能真正提升覆盖率的测试。它不自带框架，依赖项目现有工具链——这是它与 Diffblue（自带 Java 聚焦）的区别。停维护后，其 agentic「生成-执行-反馈」闭环思想被 Qodo Gen / Merge 等后续产品吸收。

## 通用最佳实践

- **复核断言**：每条 AI 测试都看断言是否针对真实行为，删掉「恒真」断言
- **变异测试辅助**：用 PIT（Java）/ Stryker（JS）做变异测试，验证测试能否抓出被改坏的代码——能抓才是有效测试
- **覆盖目标分层**：核心业务逻辑要求高覆盖 + 强断言；DTO/工具类放宽
- **CI 卡覆盖率门槛**：PR 不让覆盖率下降，但不盲目追高（高覆盖 + 弱断言是假象）
- **人机分工**：AI 生骨架与样板，人补业务语义与边界设计
