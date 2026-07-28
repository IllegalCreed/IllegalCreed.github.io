---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Diffblue Cover（diffblue.com/docs，2026）、EvoSuite（evosuite.org）、GitHub Copilot（docs.github.com/copilot）官方文档与 Qodo Cover（github.com/Codium-ai/cover-ai，**已停维护**）编写

## 速查

- **三大流派**：强化学习（Diffblue Cover，跑代码学行为）/ 进化算法（EvoSuite，搜索式）/ LLM（Copilot/Cursor/Claude，提示词工程）
- **Diffblue Cover 定位**：强化学习自动生成 Java JUnit 测试，断言基于实际执行而非猜测
- **Diffblue 版本**：Community（免费、IntelliJ 插件、有每日生成上限）/ Enterprise（付费、批量、CI 集成）
- **EvoSuite 定位**：开源进化算法、迭代优化测试最大化覆盖率，Java 生态学术经典
- **EvoSuite 命令行**：`java -jar evosuite.jar -targetClass com.x.Foo` 自动生成测试
- **Copilot 生成测试**：在 IDE 选中函数 → 右键「Generate Tests」或在 Chat 里 `为这个函数生成 Jest 测试，覆盖边界`
- **LLM 生成要点**：提示词要指明框架（JUnit5/Pytest/Jest）、覆盖目标（边界/异常/正常）、Mock 策略
- **Qodo Cover**：曾用项目已有 test runner + coverage parser 的 agentic 工具，**2025-06 起停维护，仅作学习样本**
- **核心共识**：AI 测试必须人工复核断言，覆盖率 ≠ 验证质量
- **选型一句话**：Java 重资产求可靠断言 → Diffblue；学术/纯覆盖率 → EvoSuite；跨语言快生成 → Copilot/Cursor
- **最大陷阱**：LLM 易生成「断言恒真 / 硬编码期望值」的幻觉测试
- **集成**：多数工具支持 CLI / GitHub Actions，PR 时自动为新代码补测试

## Diffblue Cover 快速上手

### 三种流派一句话区分

```text
Diffblue Cover（强化学习）：真正执行代码学行为 → 生成带正确断言的 JUnit 测试
EvoSuite（进化算法）      ：遗传算法迭代优化测试 → 最大化覆盖率
LLM（Copilot/Cursor）     ：大模型读代码 + 提示词 → 生成测试（断言可能不准）
```

### 安装 Community（IntelliJ 插件）

1. IntelliJ IDEA → Settings → Plugins → Marketplace 搜 **Diffblue Cover**
2. 安装、重启、登录（免费版有每日生成上限）
3. 在 Java 类上右键 → Diffblue Cover → Write Tests

生成的 JUnit 测试会放在对应的 `src/test/java/...`，断言基于 Diffblue 实际执行代码学到的行为。

### 生成效果

```java
// 被测：public class Calculator { public int add(int a, int b) { return a + b; } }

// Diffblue 生成的测试（断言来自实际执行）
@Test
void shouldReturnSumWhenAdd() {
    Calculator calc = new Calculator();
    assertThat(calc.add(2, 3)).isEqualTo(5);
}
```

关键：Diffblue 真的跑了一遍 `add(2,3)` 拿到 5，断言是基于执行的真实行为，而非模型猜测。这是它区别于 LLM 派的核心。

### Enterprise（批量 + CI）

Enterprise 版可在命令行批量生成（如 `dcover create-tests --target src/main/java`），并集成进 CI，对大型 Java 代码库一次性补齐回归测试。

## EvoSuite 快速上手

### 命令行生成

```bash
# 下载 evosuite.jar（含 standalone 与 Maven/Gradle 插件）
java -jar evosuite.jar \
  -targetClass com.example.Calculator \
  -projectCP target/classes

# 输出：src/test/java/com/example/Calculator_ESTest.java
```

EvoSuite 用遗传算法：随机生成测试种子 → 变异/交叉 → 按覆盖率适应度筛选 → 迭代若干代 → 输出高覆盖测试集。

### Maven 集成

```xml
<plugin>
  <groupId>org.evosuite.plugins</groupId>
  <artifactId>evosuite-maven-plugin</artifactId>
  <version>1.2.0</version>
</plugin>
```

```bash
mvn evosuite:generate    # 为所有类生成测试
mvn evosuite:export      # 导出到 src/test
```

## GitHub Copilot / Cursor 生成测试

### Copilot（IDE）

- 选中函数 → 右键 Copilot → 「Generate Tests」
- 或 Copilot Chat：`为 add(a,b) 生成 JUnit5 测试，覆盖正数/负数/零/溢出边界，用 AssertJ 断言`

### 提示词模板（关键）

```text
为以下函数生成 {JUnit5/Pytest/Jest} 单元测试：
1. 覆盖正常路径、边界值、异常路径
2. 用 {AssertJ/pytest/Vitest} 断言，断言必须针对真实返回值，禁止硬编码期望值
3. 外部依赖（DB/HTTP）用 Mock，标注 mock 点
4. 每个测试一个明确意图的命名

代码：{粘贴函数}
```

要点：明确框架、覆盖目标、Mock 策略、并要求「禁止硬编码期望值」——这能缓解 LLM 派最常见的幻觉断言。

### 复核清单（必做）

- [ ] 断言是否针对真实返回值（而非 `assertThat(true).isTrue()`）
- [ ] 边界与异常路径是否真的覆盖
- [ ] Mock 是否正确隔离了外部依赖
- [ ] 删掉测试后，原代码若有 bug，测试是否会失败（否则是无效测试）

## 下一步

- 三流派原理深入 / Diffblue RL 流程 / EvoSuite 进化算法 / LLM 提示词工程 / CI 集成见 [指南](./guide-line.md)
- Diffblue Community/Enterprise 对比 / EvoSuite CLI 全参数 / Qodo Cover 历史定位（停维护）见 [参考](./reference.md)
