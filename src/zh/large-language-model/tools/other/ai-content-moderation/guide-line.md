---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 OpenAI Moderation / Google Perspective / Azure Content Safety / AWS Comprehend 官方文档（2026 年）编写

## 速查

- 多模态审核：OpenAI `omni-moderation-latest`（文本+图像）、Azure 多模态 API（preview）
- Azure 弃用策略：新 GA 后旧 GA **90 天 deprecated**；新 Public Preview 后旧 preview **90 天 deprecated**
- Azure Prompt Shields：检测 LLM 越狱攻击（user prompt + 文档）
- Azure Groundedness Detection：检测 LLM 回答是否基于源材料
- Protected Material Detection：检测版权内容（歌词 / 文章 / 代码）
- Custom Categories：标准（需训练）/ 快速（规则式）
- 业务规则（竞品名、方言辱骂）：自定义分类器 + 黑名单
- 中文质量：OpenAI / Azure 中等，AWS 较弱；高要求考虑开源 Llama Guard 自部署

## Azure 版本弃用策略（重要）

Azure Content Safety 走严格版本生命周期：

- **Public Preview 版本**：每个新 preview 版本发布后，旧 preview **90 天 deprecated**（前提：无 breaking change）
- **GA 版本**：新 GA 版本发布后，旧 GA **90 天 deprecated**（前提：保持兼容）

::: warning 生产代码必须 pin 版本

```python
# 不要用 latest，要 pin 到具体版本
client = ContentSafetyClient(endpoint, api_version="2024-09-01")
```

订阅 [What's new](https://learn.microsoft.com/azure/ai-services/content-safety/whats-new) 页面，及时迁移。

:::

## 多模态审核实战

### OpenAI omni-moderation-latest（文本 + 图像）

```python
response = client.moderations.create(
    model="omni-moderation-latest",
    input=[
        {"type": "text", "text": "看这只猫"},
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}},
    ],
)

# 6 个图像类别 + 13 个文本类别统一在 category_scores 里
for cat, score in response.results[0].category_scores.items():
    if score > 0.5:
        print(f"违规: {cat} = {score}")
```

### Azure 多模态 API（preview）

```python
# Analyze Multimodal API（preview，部分区域）
result = client.analyze_multimodal_api(
    url="...",  # 或 base64
    text="可选的配图文本"
)
```

支持文本 ≤1K 字符、图像 ≤4MB。

### 图像审核独立流程

UGC 图片上传场景：

```python
async def moderate_image(image_bytes: bytes):
    result = client.analyze_image(AnalyzeImageOptions(image=ImageData(content=image_bytes)))

    for item in result.categories_analysis:
        if item.severity >= 4:  # 严重
            return {"action": "block", "reason": item.category}
        elif item.severity >= 2:  # 需复核
            return {"action": "review", "reason": item.category}
    return {"action": "allow"}
```

## Prompt Shields（LLM 输入防御）

LLM 应用必加的「越狱检测」：

```python
from azure.ai.contentsafety.models import (
    AnalyzeTextOptions,
    TextPromptShieldAnalysisConfig,
    TextDocument,

result = client.analyze_text(AnalyzeTextOptions(
    text=user_input,
    prompt_shield_analysis=TextPromptShieldAnalysisConfig(
        enable=True,
    ),
    # 可附加文档（检测 indirect attack）
    # documents=[{"text": retrieved_doc}]
))

print(result.prompt_analysis.user_prompt_analysis.attack_detected)
print(result.prompt_analysis.documents_analysis)  # 每个 doc 的攻击检测结果
```

两类攻击：

- **User Prompt Attack**：直接越狱（"忽略上面所有指令"）
- **Indirect Attack**：从检索到的恶意文档注入（embedded instructions）

## Groundedness Detection（幻觉检测）

检测 LLM 回答是否基于源材料：

```python
result = client.detect_groundingness(DetectGroundednessOptions(
    domain="medical",  # 可选
    task="QnA",         # QnA / Summarization
    qna={"query": "用户问题", "answer": "LLM 回答"},
    grounding_source={"text": "源材料"}
))

print(result.groundedness)  # 0-1
```

源材料 ≤55K 字符，query ≥3 词。

## Protected Material Detection

检测输出是否含版权材料：

```python
result = client.detect_text_protected_material(AnalyzeTextOptions(text=llm_output))
print(result.protected_material_analysis.detected)
# 检测歌词、文章、网页内容、代码（不同 API 端点）
```

最小输入长度 110 字符（针对 LLM 输出而非用户输入）。

## 自定义分类器

### Azure Custom Categories - Rapid（规则式）

快速定义业务规则，文本 + 图像都支持：

```python
# 1. 创建分类
client.create_or_update_custom_category_rapid(category={
    "name": "competitor_mention",
    "definition": "提到竞品 X 或 Y 的内容",
    "sample_positive_texts": ["用 X 更好", "推荐 Y"],
    "sample_negative_texts": ["我们产品", "用本产品"],
})

# 2. 推理
result = client.analyze_text_with_rapid_categories(text=content)
```

### Azure Custom Categories - Standard（训练式）

需要训练数据，更准但要异步训练：

```python
# 提交训练任务（返回 ARN）
job = client.train_custom_category_standard(...)
# 轮询状态...
# 完成后用 client.analyze_text_with_standard_categories()
```

### 完全自训练（开源模型）

对中文/方言/业务黑话要求高时，考虑：

- **Llama Guard**（Meta）：开源 LLM-as-judge，可自部署
- **Llama Prompt Guard**：越狱检测开源版
- **Guardrails AI**：Python 框架，组合多规则
- **NeMo Guardrails**（NVIDIA）：流程编排

## 多 API 组合策略

生产系统典型架构：

```
用户内容
   │
   ├─→ 1. 关键词黑名单（毫秒级，正则 + 字典）
   │       └ 命中 → 直接屏蔽
   │
   ├─→ 2. OpenAI Moderation（毫秒级，通用有害）
   │       └ flagged → 屏蔽 / 复核
   │
   ├─→ 3. 业务自定义分类器（Azure Custom Categories）
   │       └ 命中 → 业务规则处理（如举报）
   │
   └─→ 4. 人工审核队列（高价值 / 争议内容）
```

### 代码示例：组合 pipeline

```python
class ContentModerationPipeline:
    def __init__(self):
        self.blocklist = load_blocklist()
        self.openai_client = OpenAI()
        self.azure_client = ContentSafetyClient(...)

    async def moderate(self, content: str) -> dict:
        # 1. 黑名单
        if any(word in content.lower() for word in self.blocklist):
            return {"action": "block", "reason": "blocklist"}

        # 2. OpenAI Moderation
        moderation = self.openai_client.moderations.create(
            model="omni-moderation-latest", input=content
        ).results[0]
        if moderation.flagged:
            return {"action": "block", "reason": "moderation", "scores": moderation.category_scores}

        # 3. Azure 自定义分类
        rapid = self.azure_client.analyze_text_with_rapid_categories(text=content)
        if rapid.has_match:
            return {"action": "report", "reason": rapid.matches}

        return {"action": "allow"}
```

## 性能与成本

### 缓存

相同内容多次审核浪费——加 Redis 缓存（key 是内容 hash）：

```python
async def moderate_cached(content: str):
    key = f"mod:{hashlib.sha256(content.encode()).hexdigest()}"
    cached = await redis.get(key)
    if cached:
        return json.loads(cached)

    result = await pipeline.moderate(content)
    await redis.setex(key, 86400, json.dumps(result))  # 缓存 1 天
    return result
```

### 批量

OpenAI Moderation 单次支持最多 32 条 input 数组（batch）。Perspective 单请求 1 条。Azure 文本 API 也支持批量。

### 异步

```python
import asyncio
results = await asyncio.gather(*[moderate(c) for c in contents])
```

注意各 API rate limit（OpenAI 通常 RPM 限制，Azure S0 是 RP10S）。

## 误判处理

### 申诉流程

```python
# 用户申诉 → 进人工审核队列
def user_appeal(content_id: str):
    queue.push({
        "content_id": content_id,
        "moderation_result": get_cache(content_id),
        "action": "human_review",
    })
```

### 阈值微调

```python
# 用历史标注数据找最优阈值
from sklearn.metrics import precision_recall_curve

precision, recall, thresholds = precision_recall_curve(labels, scores)
# 选 precision > 0.95 的最高阈值
best = thresholds[(precision >= 0.95).argmax() - 1]
```

## 常见陷阱

| 陷阱 | 解决 |
| --- | --- |
| Azure API 突然 410 Gone | 旧版本已 deprecated，迁移到新 GA |
| 中文辱骂漏判 | 加 OpenAI Moderation + 自定义分类器 |
| 反讽 / 艺术作品被误杀 | 设双阈值（高屏蔽，中人审） |
| 图像审核慢 | 用低分辨率版 + 缓存 |
| 成本爆炸 | 加缓存 + 仅对高风险内容调用付费 API |
| 用户绕过（拆字、emoji） | 预处理 normalize（去 emoji、合并拆字） |
| OpenAI Moderation 限速 | 申请更高 tier 或用 batch |

## 各厂商独有能力

| 能力 | 厂商 |
| --- | --- |
| 越狱检测（Prompt Shields） | Azure |
| 幻觉检测（Groundedness） | Azure |
| 版权检测（Protected Material） | Azure |
| 任务对齐（Task adherence） | Azure（preview） |
| PII 检测 | AWS Comprehend / Azure |
| 多模态（图） | OpenAI omni / Azure |
| 评论场景专用属性（FLIRTATION/SPAM） | Perspective |

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2017 | Perspective API 发布（评论毒性） |
| 2023 | OpenAI Moderation GA；Azure Content Safety GA |
| 2024 | OpenAI omni-moderation-latest（多模态，新增 illicit 类）；Azure Prompt Shields GA |
| 2025 | Azure Custom Categories Rapid GA；Groundedness / Task adherence preview |
| 2026 | Azure 持续 GA + 90 天 deprecation 推进；多模态审核能力扩展 |
