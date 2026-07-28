---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OpenAI Moderation / Google Perspective / Azure Content Safety / AWS Comprehend 官方文档（2026 年）编写

## 速查

- **OpenAI Moderation**：模型 `omni-moderation-latest`，端点 `POST /v1/moderations`，**13 个文本类** + **6 个图像类**，免费调用
- **Perspective API**：Jigsaw（Google 旗下），端点 `commentanalyzer.googleapis.com/v1alpha1/comments:analyze`，返回 0-1 毒性分数
- **Azure Content Safety**：4 大类（Hate/Sexual/Violence/SelfHarm）×4 严重度（0/2/4/6）
- **AWS Comprehend**：Toxicity Detection（7 类）、PII 检测、Custom Classification
- **关键陷阱**：Azure 新 GA 发布后旧 GA **90 天 deprecated**
- **多模态**：OpenAI omni-moderation-latest 支持文本+图像混合审核
- **阈值**：通常 0.5-0.8 调参，业务场景不同

## OpenAI Moderation 第一次调用

```python
from openai import OpenAI
client = OpenAI()

response = client.moderations.create(
    model="omni-moderation-latest",
    input="要审核的文本",
)

print(response.results[0].flagged)        # True/False
print(response.results[0].categories)     # 各类别的布尔
print(response.results[0].category_scores)  # 各类别的 0-1 分数
```

返回结构：

```json
{
  "results": [{
    "flagged": true,
    "categories": {
      "harassment": false,
      "hate": true,
      "self-harm": false,
      "sexual": false,
      "violence": false,
      ...
    },
    "category_scores": {
      "harassment": 0.12,
      "hate": 0.93,
      "self-harm": 0.01,
      ...
    }
  }]
}
```

### 13 个文本类别

| 类别 | 含义 |
| --- | --- |
| `harassment` | 骚扰、恐吓、欺凌 |
| `harassment/threatening` | 含暴力威胁的骚扰 |
| `hate` | 基于身份的仇恨言论 |
| `hate/threatening` | 含暴力威胁的仇恨言论 |
| `illicit` | 鼓励或协助非法活动 |
| `illicit/violent` | 含暴力的非法活动 |
| `self-harm` | 自残内容 |
| `self-harm/intent` | 表达自残意图 |
| `self-harm/instructions` | 提供自残方法说明 |
| `sexual` | 性内容 |
| `sexual/minors` | 涉及未成年人 |
| `violence` | 暴力内容 |
| `violence/graphic` | 血腥暴力画面 |

::: tip omni vs text-moderation

`omni-moderation-latest`（多模态，新增 `illicit` / `illicit/violent`）替代旧的 `text-moderation-latest`（仅文本 11 类）。新模型支持图像输入。

:::

### 多模态：文本 + 图像

```python
response = client.moderations.create(
    model="omni-moderation-latest",
    input=[
        {"type": "text", "text": "看这张图"},
        {"type": "image_url", "image_url": {"url": "https://..."}},
    ],
)
```

图像支持 6 个有害类别（基于上述 13 类的子集，主要 hate / violence / sexual / self-harm 等）。

## Google Perspective API

### 注册

[Perspective API](https://www.perspectiveapi.com/) → Get Started → 关联 Google Cloud 项目 → 启用 API → 拿 API key。

### 第一次调用

```bash
curl -X POST \
  'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "comment": {"text": "你是个愚蠢的人"},
    "requestedAttributes": {"TOXICITY": {}, "INSULT": {}},
    "languages": ["zh", "en"]
  }'
```

返回：

```json
{
  "attributeScores": {
    "TOXICITY": {"summaryScore": {"value": 0.82}},
    "INSULT": {"summaryScore": {"value": 0.76}}
  },
  "detectedLanguages": ["zh"]
}
```

### 主要属性（attributes）

| Attribute | 含义 |
| --- | --- |
| `TOXICITY` | 总体毒性（粗鲁、让人想离开讨论） |
| `SEVERE_TOXICITY` | 极端仇恨 / 攻击性 |
| `IDENTITY_ATTACK` | 基于身份的攻击 |
| `INSULT` | 侮辱 |
| `PROFANITY` | 脏话 |
| `THREAT` | 威胁 |
| `SEXUALLY_EXPLICIT` | 性露骨 |
| `FLIRTATION` | 调情（轻浮） |
| `SPAM` | 垃圾信息 |
| `INCOHERENT` | 不连贯 |
| `UNSUBSTANTIAL` | 空洞无内容 |

可同时请求多个属性。

::: warning 配额

Perspective API 免费配额：默认 1000 QPS（按属性计），实际申请常给到 100-1000 QPS。超量大场景需邮件申请提额。

:::

## Azure AI Content Safety

### 创建资源

Azure Portal → Create resource → Search "Content Safety" → 选区域（East US / West Europe 等支持最全）→ F0（免费）/ S0（付费）。

### 文本审核

```python
from azure.ai.contentsafety import ContentSafetyClient
from azure.identity import DefaultAzureCredential
from azure.ai.contentsafety.models import AnalyzeTextOptions

client = ContentSafetyClient(endpoint, credential=DefaultAzureCredential())

result = client.analyze_text(AnalyzeTextOptions(text="待审核文本"))

for item in result.categories_analysis:
    print(item.category, item.severity)  # Hate/Sexual/Violence/SelfHarm + 0/2/4/6
```

### 4 大类别 × 严重度

| Category | Severity 0 | 2 | 4 | 6 |
| --- | --- | --- | --- | --- |
| `Hate` | 无 | 轻微偏见 | 明显仇恨 | 严重仇恨/煽动 |
| `Sexual` | 无 | 暗示 | 明显性内容 | 露骨 |
| `Violence` | 无 | 描述 | 描绘 | 血腥/鼓励 |
| `SelfHarm` | 无 | 提及 | 描述行为 | 鼓励/教唆 |

严重度比 OpenAI 的 0-1 分数粒度更粗但更易决策（4+ 直接屏蔽，2 需复核）。

### 图像审核

```python
result = client.analyze_image(AnalyzeImageOptions(image=ImageData(content=bytes)))
```

同样 4 类 × 严重度。图像 ≤4MB、50x50 ~ 7200x7200、JPEG/PNG/GIF/BMP/TIFF/WEBP。

### Blocklists（自定义黑名单）

```python
client.create_or_update_blocklist(...)
client.add_block_items(list_name, block_items=[{"text": "竞品名"}, {"pattern": "v[i1]agra", "is_regex": True}])
```

正则 + 精确匹配，规则匹配返回 `blocklistsMatch` 字段。

## AWS Comprehend

### Toxicity Detection

```python
import boto3
comprehend = boto3.client('comprehend')

result = comprehend.detect_toxic_content(
    TextSegments=[{"Text": "评论内容"}],
    LanguageCode='en'
)

for segment in result['ResultList'][0]['ToxicityLabels']:
    print(segment['Name'], segment['Score'])
```

7 个标签：`PROFANITY` / `SEVERE_PROFANITY` / `DEROGATORY` / `HATE_SPEECH` / `INSULT` / `GRAPHIC` / `HARASSMENT_OR_ABUSE`。

### PII 检测

```python
result = comprehend.detect_pii_entities(Text="我的邮箱是 abc@x.com", LanguageCode='en')
# 返回 PII 实体类型（EMAIL / PHONE / SSN / CREDIT_DEBIT_NUMBER 等）+ 范围
```

### 自定义分类

需要训练数据 + 模型训练（异步 ARN 任务）。适合业务专属规则。

## 选型对比

| 维度 | OpenAI Moderation | Perspective | Azure Content Safety | AWS Comprehend |
| --- | --- | --- | --- | --- |
| 多模态（图） | ✅（omni） | ❌ | ✅ | ❌ |
| 中文质量 | 中 | 中 | 中 | 较弱 |
| 严重度粒度 | 0-1 连续 | 0-1 连续 | 4 档离散 | 0-1 连续 |
| 越狱检测 | 部分 | ❌ | ✅ Prompt Shields | ❌ |
| 自定义分类 | ❌ | ❌ | ✅ | ✅ |
| 价格 | 免费 | 免费 | F0 免费/S0 付费 | 按 API 调用 |
| 部署 | 仅托管 | 仅托管 | 仅托管 | 仅托管 |

## 阈值调优经验

| 场景 | 推荐阈值 |
| --- | --- |
| 严格（儿童平台） | flagged=true 即屏蔽；分数 >0.3 转人工 |
| 中性（一般 UGC） | 分数 >0.7 屏蔽；0.5-0.7 标记复核 |
| 宽松（成人社区） | 仅 `severe_*` >0.5 屏蔽 |
| LLM 输入审核 | 任何 `hate/threatening` / `self-harm/instructions` >0.5 拒绝 |

::: tip 多层防御

不要只用单一 API——常见做法：关键词黑名单（快）+ OpenAI Moderation（准）+ 业务自定义分类器（兜底业务规则）。三层叠加，召回率和准确率都更高。

:::

## 下一步

- [指南](./guide-line) —— Azure 版本弃用策略 / 多模态实战 / Prompt Shields / 自定义分类器
- [参考](./reference) —— 全部 API schema / 类别表 / 价格 / 区域支持
