---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Promptfoo / DeepEval / Garak 2026 官方文档编写。本页**重点列断言、metric、probe 与工具对比**。

## 三大工具速查

| 工具 | 厂商 | 许可 | 风格 | 强项 |
| --- | --- | --- | --- | --- |
| **Promptfoo** | 社区 / 商业版 promptfoo.dev | MIT | CLI + YAML 配置 | 红队 + CI 门禁 + 多 provider 对比 |
| **DeepEval** | Confident AI | Apache-2.0 | pytest 插件 | 50+ metric、Python 友好 |
| **Garak** | NVIDIA | Apache-2.0 | CLI 探测 | LLM 漏洞扫描（Nessus for LLMs） |

## Promptfoo 断言全表

### 确定性断言（44 种）

| 断言 | 评什么 |
| --- | --- |
| `equals` / `contains` / `icontains` | 精确等 / 包含 / 大小写不敏感包含 |
| `contains-any` / `contains-all` / `icontains-any` / `icontains-all` | 多值包含（任一/全部） |
| `regex` / `starts-with` | 正则 / 前缀 |
| `is-json` / `contains-json` | 是合法 JSON / 含 JSON 片段 |
| `is-html` / `contains-html` | 是 / 含 HTML |
| `is-sql` / `contains-sql` | 是 / 含 SQL |
| `is-xml` / `contains-xml` | 是 / 含 XML |
| `is-refusal` | 是模型拒绝 |
| `javascript` / `python` / `ruby` | 自定义代码判定 |
| `webhook` | 调外部 URL 判定 |
| `rouge-n` / `bleu` / `gleu` / `meteor` | 文本重叠指标 |
| `levenshtein` | 编辑距离 |
| `latency` / `cost` | 延迟 / 成本 |
| `perplexity` / `perplexity-score` | 困惑度 |
| `is-valid-function-call` / `is-valid-openai-function-call` / `is-valid-openai-tools-call` | 合法函数/工具调用 |
| `trace-span-count` / `trace-span-duration` / `trace-error-spans` | trace 维度断言 |
| `skill-used` / `trajectory:tool-used` / `trajectory:tool-args-match` / `trajectory:tool-sequence` / `trajectory:step-count` | Agent / trajectory 断言 |
| `guardrails` | 护栏判定 |
| `assert-set` | 分组断言 |

每个断言均可加 **`not-` 前缀取反**（如 `not-equals`、`not-regex`）。

### 模型评分断言（15 种）

| 断言 | 评什么 |
| --- | --- |
| `similar` | 语义相似度 |
| `classifier` | 分类器判定 |
| `moderation` | OpenAI moderation API |
| `llm-rubric` | LLM 按 rubric 评分 |
| `g-eval` | G-Eval 算法 |
| `answer-relevance` | 答案相关性 |
| `context-faithfulness` / `context-recall` / `context-relevance` | RAG 三件套 |
| `conversation-relevance` | 多轮对话相关性 |
| `trajectory:goal-success` | Agent 目标达成 |
| `factuality` | 事实正确性 |
| `model-graded-closedqa` | 闭合问答评分 |
| `pi` | 个人身份相关 |
| `select-best` | 多输出选最优 |
| `max-score` | 元断言：选最高分输出 |

## Promptfoo 红队组件

| 组件 | 作用 | 例子 |
| --- | --- | --- |
| **plugins** | 攻击 payload 生成器 | `prompt-injection` / `jailbreak` / `pii` / `harmful:hate` / `excessive-agency` |
| **strategies** | 攻击包装策略 | `basic` / `jailbreak` / `encoding` |
| **purpose** | 应用定位 | 「客服助手，回答订单问题」 |
| **frameworks** | 对齐框架 | `NIST AI RMF` / OWASP LLM Top 10 |
| **target discovery** | 自动发现应用入口 | API / endpoint 自动探测 |
| **bundles** | 相关 plugin 打包 | `pii` bundle 含所有 PII 类 |

## DeepEval metric（节选，50+）

| 类别 | metric |
| --- | --- |
| **RAG** | AnswerRelevancy / Faithfulness / ContextualPrecision / ContextualRecall / ContextualRelevance / GEval |
| **对话** | ConversationalGEval / KnowledgeRetention |
| **Agent** | ToolCorrectness / TaskCompletion / TrajectoryEval |
| **安全** | ToxicityMetric / BiasMetric / PromptInjection |
| **通用** | HallucinationMetric / SummarizationMetric / Summac |

## Garak probe 类别

| 类别 | 扫什么 |
| --- | --- |
| **promptinject** | 指令注入 |
| **jailbreak** | 越狱（DAN 等） |
| **leakage** | 数据 / 系统提示泄露 |
| **hallucination** | 幻觉 |
| **misinformation** | 假信息 |
| **toxicity** | 毒性 |
| **encoding** | 编码绕过（base64 / rot13） |
| **latentinjection** | 隐蔽注入 |

## 工具能力矩阵

| 能力 | Promptfoo | DeepEval | Garak |
| --- | --- | --- | --- |
| 评测断言 | 44 确定 + 15 模型（含 not-） | 50+ metric | 探测类 |
| 红队 | **强项** | △ | **强项** |
| CI/CD 集成 | **原生** | pytest 兼容 | CLI |
| 多 provider 对比 | **强项** | △ | 多模型扫描 |
| Python 友好 | JS/Py 都支持 | **原生 pytest** | 原生 |
| 本地运行 | 默认本地 | 本地 | 本地 |
| Agent / trajectory 断言 | ✓ | ✓ | - |
| 漏洞报告对齐框架 | NIST AI RMF / OWASP | - | 学术标准 |
| 商业云版 | promptfoo.dev | Confident AI | - |

## CLI 速查

### Promptfoo

```bash
promptfoo init                    # 初始化配置
promptfoo eval                    # 跑评测
promptfoo view                    # 看结果
promptfoo redteam init            # 生成红队配置
promptfoo redteam run             # 跑红队
promptfoo eval --no-cache         # CI 用，禁缓存
```

### DeepEval

```bash
pip install deepeval
deepeval login                    # 接 Confident AI（可选）
pytest test_xxx.py                # 直接用 pytest 跑
deepeval test run tests/          # 或用 deepeval 命令
```

### Garak

```bash
pip install garak
garak --model_type openai --model_name gpt-4o-mini
garak --probes promptinject,jailbreak,leakage ...
```

## CI/CD 集成示例

### Promptfoo（GitHub Actions）

```yaml
on: [pull_request]
jobs:
  llm-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g promptfoo
      - run: promptfoo eval --no-cache
      - run: promptfoo redteam run
```

### DeepEval

```yaml
on: [pull_request]
jobs:
  llm-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install deepeval
      - run: deepeval test run tests/
```

## 红队风险对照（OWASP LLM Top 10 思路）

| 风险 | 工具映射 |
| --- | --- |
| **LLM01 Prompt Injection** | Promptfoo `prompt-injection` plugin / Garak `promptinject` |
| **LLM02 Insecure Output** | Promptfoo `is-json` / `is-sql` 校验输出 |
| **LLM03 Training Data Poisoning** | Garak `hallucination` |
| **LLM04 Model DoS** | Promptfoo `latency` 断言 |
| **LLM05 Supply Chain** | Garak 模型层扫描 |
| **LLM06 Sensitive Disclosure** | Promptfoo `pii` plugin / Garak `leakage` |
| **LLM07 Insecure Plugin Design** | Promptfoo `excessive-agency` |
| **LLM08 Excessive Agency** | Promptfoo `excessive-agency` / trajectory 断言 |
| **LLM09 Overreliance** | DeepEval `FaithfulnessMetric` |
| **LLM10 Model Theft** | Garak `leakage` |

## 资源链接

- Promptfoo 文档：[promptfoo.dev/docs](https://www.promptfoo.dev/docs/intro/)
- Promptfoo 断言：[promptfoo.dev/docs/configuration/expected-outputs](https://www.promptfoo.dev/docs/configuration/expected-outputs/)
- Promptfoo 红队：[promptfoo.dev/docs/red-team](https://www.promptfoo.dev/docs/red-team/)
- Promptfoo GitHub：[github.com/promptfoo/promptfoo](https://github.com/promptfoo/promptfoo)
- DeepEval 文档：[deepeval.com/docs](https://deepeval.com/docs/evaluation-introduction)
- DeepEval GitHub：[github.com/confident-ai/deepeval](https://github.com/confident-ai/deepeval)
- Garak 官网：[garak.ai](https://garak.ai/)
- Garak GitHub：[github.com/NVIDIA/garak](https://github.com/NVIDIA/garak)
- Garak 论文：[arxiv.org/abs/2406.11036](https://arxiv.org/abs/2406.11036)
- OWASP LLM Top 10：[owasp.org/www-project-top-10-for-large-language-model-applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
