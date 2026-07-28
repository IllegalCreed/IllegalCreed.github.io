---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Promptfoo / DeepEval / Garak 2026 官方文档编写

## 速查

- 三大工具：**Promptfoo**（CLI/配置驱动 + 红队）、**DeepEval**（pytest 风格）、**Garak**（LLM 漏洞扫描）
- Promptfoo 断言：**44 种确定性 + 15 种模型评分**（含 not- 前缀取反）
- DeepEval：**50+ 即插即用 metric**，覆盖 RAG / Agent / 对话
- Garak：NVIDIA 出品，扫**幻觉 / 数据泄露 / prompt injection / 越狱 / 毒性 / 编码绕过**
- 红队风险：越狱 / 注入 / PII 泄露 / 偏见 / 幻觉 / 毒性 / SSRF
- 接入：CLI（Promptfoo / Garak）/ pytest 插件（DeepEval）/ 库
- CI/CD：三工具都能集成 GitHub Actions / GitLab CI
- 本地运行优先——Promptfoo 默认本地，保隐私

## 为什么需要 LLM 测试框架

传统单元测试验证「**函数行为**」。LLM 应用的问题：

- 输出非确定（同 prompt 跑两次结果可能不同）
- 行为空间巨大（不可能穷举）
- 「对错」模糊（需 LLM-as-judge 或业务规则）

LLM 测试框架解决：

| 问题 | 方案 |
| --- | --- |
| 改 prompt 怕回归 | 测试矩阵 + 多次跑取通过率 |
| 担心越狱 / 注入 | 红队自动生成攻击 prompt |
| 答案质量难量化 | 内置 metric（相关性 / 忠实度 / 毒性） |
| 多模型对比 | 同 prompt 跑多个 provider 对比 |

## Promptfoo：第一个测试

安装：

```bash
npm install -g promptfoo
# 或 npx promptfoo@latest
```

初始化：

```bash
promptfoo init
# 生成 promptfooconfig.yaml
```

最简配置（评测一个 prompt 对多输入）：

```yaml
# promptfooconfig.yaml
prompts:
  - "请用一句话总结：{{input}}"

providers:
  - openai:gpt-4o-mini

tests:
  - vars:
      input: "RAG 是检索增强生成的缩写..."
    assert:
      - type: contains
        value: "检索"
      - type: llm-rubric
        value: "总结准确且简洁"
  - vars:
      input: "Transformer 架构..."
    assert:
      - type: contains
        value: "Transformer"
```

跑评测：

```bash
promptfoo eval
# 输出表格：每个 test 是否通过、各 assert 结果
```

看结果：

```bash
promptfoo view
# 打开 http://localhost:15500 浏览
```

## Promptfoo 断言类型速览

两大类，每类还可加 `not-` 前缀取反。

**确定性断言（44 种，节选）**：

| 断言 | 评什么 |
| --- | --- |
| `equals` / `contains` / `icontains` | 精确等 / 包含 / 大小写不敏感包含 |
| `regex` / `starts-with` | 正则 / 前缀 |
| `is-json` / `contains-json` | 是合法 JSON / 含 JSON 片段 |
| `is-sql` / `is-xml` / `is-html` | 是 SQL/XML/HTML |
| `is-refusal` | 是模型拒绝 |
| `javascript` / `python` / `ruby` | 自定义代码 |
| `rouge-n` / `bleu` / `meteor` | 文本重叠指标 |
| `levenshtein` | 编辑距离 |
| `latency` / `cost` | 性能 / 成本 |
| `is-valid-openai-function-call` | 是合法 OpenAI tool 调用 |
| `webhook` | 调外部 URL 判定 |

**模型评分断言（15 种，节选）**：

| 断言 | 评什么 |
| --- | --- |
| `similar` | 语义相似度 |
| `llm-rubric` | LLM 按 rubric 评分 |
| `g-eval` | G-Eval 算法 |
| `factuality` | 事实正确性 |
| `answer-relevance` | 答案相关性 |
| `context-faithfulness` / `context-recall` / `context-relevance` | RAG 三件套 |
| `moderation` | OpenAI moderation |
| `select-best` | 多输出选最优 |

## Promptfoo 红队

自动生成攻击 prompt，扫漏洞：

```bash
promptfoo redteam init
# 交互式生成 redteam 配置
promptfoo redteam run
# 跑红队测试，输出漏洞报告
```

配置（节选）：

```yaml
redteam:
  plugins:
    - prompt-injection      # 指令注入
    - jailbreak             # 越狱
    - pii                   # 个人信息泄露
    - harmful:hate          # 仇恨
    - excessive-agency      # Agent 越权
  strategies:
    - basic                 # 基础绕过
    - jailbreak             # 越狱策略
    - encoding              # 编码绕过（base64 等）
  purpose: "客服助手，回答订单与退货问题"
```

输出：**漏洞报告**（哪个攻击成功、风险等级、修复建议），可对齐 **NIST AI RMF** 等框架。

## DeepEval：pytest 风格

安装：

```bash
pip install deepeval
```

写测试（和 pytest 一模一样）：

```python
# test_rag.py
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import (
    AnswerRelevancyMetric,
    FaithfulnessMetric,
)

def test_rag_answer():
    case = LLMTestCase(
        input="RAG 是什么？",
        actual_output="RAG 是检索增强生成...",
        retrieval_context=["RAG 结合检索与生成..."],
    )
    assert_test(
        case,
        [
            AnswerRelevancyMetric(threshold=0.7),
            FaithfulnessMetric(threshold=0.7),
        ],
    )
```

跑：

```bash
pytest test_rag.py
# 或 deepeval test run test_rag.py
```

DeepEval 的卖点：**50+ 即插即用 metric**，覆盖 RAG / Agent / 对话；与 pytest 工作流无缝；可上报 Confident AI 云端协作。

## Garak：LLM 漏洞扫描

安装：

```bash
pip install garak
```

扫一个模型（Probes = 探测类别）：

```bash
garak --model_type openai --model_name gpt-4o-mini
# 跑全套 probes，扫幻觉/泄露/注入/越狱/毒性/编码绕过
```

指定 probe：

```bash
garak --model_type openai --model_name gpt-4o-mini \
      --probes promptinject,jailbreak,leakage
```

输出：每个 probe 的通过率、失败案例。被誉为「**Nessus for LLMs**」——把已知攻击模式批量打向你的端点。

Garak 适合：模型选型时的安全评估、护栏（guardrails）上线前的扫描、定期安全审计。

## CI/CD 集成

### Promptfoo（GitHub Actions）

```yaml
# .github/workflows/llm-tests.yml
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g promptfoo
      - run: promptfoo eval --no-cache
      - run: promptfoo redteam run || exit 1  # 红队失败阻断合并
```

### DeepEval

```yaml
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install deepeval
      - run: deepeval test run tests/
```

## 大陆访问

- 三工具都是开源本地运行——无网络访问障碍
- 调用 OpenAI / Anthropic 等 API 仍需自备网络
- 可换用国产模型（DeepSeek / Qwen / GLM）作 provider

## 下一步

- [指南](./guide-line) —— 测试用例设计 / 红队策略 / 多模型对比 / 与可观测工具联动
- [参考](./reference) —— 断言全表 / metric 全表 / probe 类别 / 工具对比矩阵
