---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OpenAI Moderation / Google Perspective / Azure Content Safety / AWS Comprehend 官方文档（2026 年）编写

## OpenAI Moderation

### 端点

```
POST https://api.openai.com/v1/moderations
```

### 请求

```json
{
  "model": "omni-moderation-latest",
  "input": "待审核文本"  // 或数组，或图文混合数组
}
```

### 模型

| 模型 | 输入 | 类别数 |
| --- | --- | --- |
| `omni-moderation-latest` | 文本 + 图像 | 13（文本）+ 6（图像） |
| `text-moderation-latest` | 仅文本 | 11（旧版） |

### 13 个文本类别

| 类别 | 含义 |
| --- | --- |
| `harassment` | 骚扰 |
| `harassment/threatening` | 含威胁的骚扰 |
| `hate` | 仇恨言论 |
| `hate/threatening` | 含威胁的仇恨 |
| `illicit` | 鼓励非法活动（omni 新增） |
| `illicit/violent` | 含暴力的非法活动（omni 新增） |
| `self-harm` | 自残 |
| `self-harm/intent` | 自残意图 |
| `self-harm/instructions` | 自残方法说明 |
| `sexual` | 性内容 |
| `sexual/minors` | 涉未成年人 |
| `violence` | 暴力 |
| `violence/graphic` | 血腥暴力 |

### 6 个图像类别

omni-moderation-latest 图像支持的子集（具体见官方 model card）。

### 响应

```json
{
  "id": "modr-...",
  "model": "omni-moderation-latest",
  "results": [{
    "flagged": true,
    "categories": {
      "hate": true,
      "harassment": false,
      ...
    },
    "category_scores": {
      "hate": 0.93,
      "harassment": 0.12,
      ...
    }
  }]
}
```

### 限制

- 单次请求最多 32,768 字符
- Batch：`input` 数组最多 32 条
- Rate limit：与 OpenAI 账号 tier 相关
- **免费**：不消耗 token 费用

## Google Perspective API

### 端点

```
POST https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=API_KEY
```

### 请求

```json
{
  "comment": {"text": "评论内容"},
  "requestedAttributes": {
    "TOXICITY": {},
    "INSULT": {}
  },
  "languages": ["en"],
  "doNotStore": false,
  "spanAnnotations": false
}
```

### 属性

| Attribute | 含义 | 多语言 |
| --- | --- | --- |
| `TOXICITY` | 总体毒性 | ✅ 多语种 |
| `SEVERE_TOXICITY` | 极端攻击 | ✅ 多语种 |
| `IDENTITY_ATTACK` | 身份攻击 | ✅ |
| `INSULT` | 侮辱 | ✅ |
| `PROFANITY` | 脏话 | ✅ |
| `THREAT` | 威胁 | ✅ |
| `SEXUALLY_EXPLICIT` | 性露骨 | ✅ |
| `FLIRTATION` | 调情 | 部分语言 |
| `SPAM` | 垃圾 | 仅英文 |
| `INCOHERENT` | 不连贯 | 仅英文 |
| `UNSUBSTANTIAL` | 空洞 | 仅英文 |
| `OBSCENE` | 猥亵 | 实验 |
| `INFLAMMATORY` | 煽动 | 实验 |

### 响应

```json
{
  "attributeScores": {
    "TOXICITY": {
      "spanScores": [{"begin": 0, "end": 12, "score": {"value": 0.82}}],
      "summaryScore": {"value": 0.82, "type": "PROBABILITY"}
    }
  },
  "detectedLanguages": ["zh"],
  "languages": ["zh"]
}
```

### 限制

- 输入 ≤3000 字节（UTF-8）
- 默认配额：1000 QPS（按 attribute 计），实际常 100-1000 QPS
- **免费**

## Azure AI Content Safety

### 端点

```
POST {endpoint}/contentsafety/text:analyze?api-version=2024-09-01
POST {endpoint}/contentsafety/image:analyze?api-version=2024-09-01
```

### 文本审核

```python
from azure.ai.contentsafety.models import AnalyzeTextOptions

result = client.analyze_text(AnalyzeTextOptions(
    text="内容",
    categories=[Hate, Sexual, Violence, SelfHarm],  # 可选，默认全部
    blocklist_names=["my_blocklist"],
    halt_on_blocklist_hit=False,
    output_type="FourSeverityLevels",  # 或 SeverityLevels
))
```

### 类别 + 严重度

| Category | 0 | 2 | 4 | 6 |
| --- | --- | --- | --- | --- |
| `Hate` | 无 | 轻微偏见 | 明显仇恨 | 严重/煽动 |
| `Sexual` | 无 | 暗示 | 明显 | 露骨 |
| `Violence` | 无 | 描述 | 描绘 | 鼓励/血腥 |
| `SelfHarm` | 无 | 提及 | 描述行为 | 鼓励/教唆 |

### 图像审核

```python
result = client.analyze_image(AnalyzeImageOptions(
    image=ImageData(content=bytes)
))
```

限制：≤4MB，50x50 ~ 7200x7200，JPEG/PNG/GIF/BMP/TIFF/WEBP。

### Blocklists

```python
# 创建
client.create_or_update_text_blocklist(name="my_list", resource=...)

# 加项
client.add_or_update_text_blocklist_items(name, body={
    "block_items": [
        {"text": "敏感词"},
        {"pattern": "v[i1]agra", "is_regex": True},
    ]
})

# 审核时引用
result = client.analyze_text(AnalyzeTextOptions(text=..., blocklist_names=["my_list"]))
print(result.blocklists_match)
```

### Prompt Shields

```python
result = client.analyze_text(AnalyzeTextOptions(
    text=user_input,
    prompt_shield_analysis=TextPromptShieldAnalysisConfig(enable=True),
    documents=[TextDocument(text=retrieved_doc)]
))
# result.prompt_analysis.user_prompt_analysis.attack_detected
# result.prompt_analysis.documents_analysis[].attack_detected
```

限制：prompt ≤10K 字符；最多 5 个文档，总 10K 字符。

### Groundedness Detection

```python
result = client.detect_groundingness(DetectGroundednessOptions(
    domain="medical",
    task="QnA",  # 或 "Summarization"
    qna={"query": "Q", "answer": "A"},
    grounding_source={"text": "..."}
))
```

限制：源 ≤55K 字符；query + answer ≤7500 字符；query ≥3 词。

### Protected Material Detection

```python
client.detect_text_protected_material(AnalyzeTextOptions(text=llm_output))
# 或检测代码：
client.detect_code_protected_material(...)
```

限制：≥110 字符（针对 LLM 输出）。

### Custom Categories

- **Rapid**：规则式，立即可用，文本+图像
- **Standard**：训练式，需提交训练任务（ARN）

### 版本弃用

- Public Preview：新版本后旧 90 天 deprecated
- GA：新 GA 后旧 90 天 deprecated（保持兼容前提下）

### 限制速查

| Feature | 限制 |
| --- | --- |
| Text | 10K 字符 |
| Image | 4MB / 50x50~7200x7200 |
| Multimodal | 文本 1K + 图 4MB |
| Prompt Shields | 10K 字符 + 5 doc |
| Groundedness | 源 55K / q+a 7500 |
| Custom Categories Standard | 1K 字符 |
| Task Adherence | 100K 字符 |

### Rate Limits

| Tier | Moderation | Prompt Shields | Groundedness | Custom Standard |
| --- | --- | --- | --- | --- |
| F0 | 5 RPS | 5 RPS | N/A | 5 RPS |
| S0 | 1000 RP10S | 1000 RP10S | 50 RPS | 5 RPS |

### 语言支持

英文 only：Protected Material / Groundedness / Custom Categories Standard
多语言（中英法德西意日葡）：文本 / 图像 / Prompt Shields / Custom Categories Rapid

## AWS Comprehend

### Toxicity Detection

```python
result = comprehend.detect_toxic_content(
    TextSegments=[{"Text": "..."}],
    LanguageCode='en'
)
```

7 标签：`PROFANITY` / `SEVERE_PROFANITY` / `DEROGATORY` / `HATE_SPEECH` / `INSULT` / `GRAPHIC` / `HARASSMENT_OR_ABUSE`。

### PII 检测

```python
result = comprehend.detect_pii_entities(Text="...", LanguageCode='en')
# 实体：NAME / EMAIL / PHONE / ADDRESS / SSN / CREDIT_DEBIT_NUMBER / BANK_ACCOUNT ...
```

### 自定义分类

需要训练数据 → 异步训练 → 用 endpoint 推理。

### 价格

- 按字符 / 文档计费
- 50K-100K 字符免费 tier

## 开源自部署

| 模型 / 工具 | 用途 |
| --- | --- |
| [Llama Guard](https://github.com/meta-llama/PurpleLlama) | LLM-as-judge，分类有害内容 |
| [Llama Prompt Guard](https://github.com/meta-llama/PurpleLlama) | 越狱检测 |
| [Guardrails AI](https://www.guardrailsai.com/) | Python 框架，组合多规则 |
| [NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails) | NVIDIA 流程编排 |
| [Lassomoderation](https://lassomoderation.com) | 商用，组合多 API |

## 价格速查

| 服务 | 价格 |
| --- | --- |
| OpenAI Moderation | 免费 |
| Google Perspective | 免费 |
| Azure Content Safety F0 | 免费 tier |
| Azure Content Safety S0 | 按 API 调用计费 |
| AWS Comprehend | 按字符计费，有免费 tier |

## 资源链接

- OpenAI Moderation：[platform.openai.com/docs/guides/moderation](https://platform.openai.com/docs/guides/moderation)
- Perspective API：[perspectiveapi.com](https://www.perspectiveapi.com/)
- Azure Content Safety：[learn.microsoft.com/azure/ai-services/content-safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/)
- AWS Comprehend：[docs.aws.amazon.com/comprehend](https://docs.aws.amazon.com/comprehend/)
- ConversationAI（Perspective 源码）：[github.com/conversationai](https://github.com/conversationai)
- Azure SDK JS：[github.com/Azure/azure-sdk-for-js](https://github.com/Azure/azure-sdk-for-js)
