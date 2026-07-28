---
layout: doc
---

# AI 内容审核

**用 AI 模型自动识别文本 / 图像 / 多模态中的有害内容**——把「是否违规」从人工抽审升级为 API 实时判定，是 UGC 平台、生成式 AI 应用上线前的合规底线。

主流方案分四类：

- **厂商托管 API**：OpenAI Moderation（13 类，多模态）、Google Perspective（毒性分数）、Azure AI Content Safety（4 大类 + 严重度）、AWS Comprehend（文本分类）
- **多模态审核**：OpenAI `omni-moderation-latest` 支持文本+图像；Azure 多模态 API（preview）；厂商专用图像审核
- **自定义分类器**：Azure Custom Categories、自训练模型（针对业务规则如「竞品名」「特定方言辱骂」）
- **Prompt Shields / 越狱检测**：Azure Prompt Shields 检测 LLM 输入攻击；OpenAI 内置 moderation

**关键陷阱**：Azure Content Safety 走严格版本生命周期——新 GA 发布后旧 GA **90 天 deprecated**，新 Public Preview 后旧 preview **90 天 deprecated**。生产代码必须 pin 版本号并订阅 deprecation notice。

## 评价

**优点**

- **实时**：API 毫秒级响应，比人工审核快几个数量级
- **多维度**：hate / violence / sexual / self-harm 等细分类，比关键词黑名单准
- **可解释**：每类返回 0-1 分数 + flagged 布尔，可设阈值
- **多模态**：新一代模型支持图像 / 图文混合审核
- **合规友好**：满足《生成式 AI 服务管理办法》《GDPR》《平台信任与安全》等要求

**缺点**

- **误判率不低**：边缘 case（反讽、艺术、医学）易误杀或漏判
- **语言覆盖不均**：英文最准，中文/方言/小语种质量下降
- **更新滞后**：新网络梗 / 黑话模型几个月才学会
- **成本累加**：每条内容都要调一次 API
- **隐私顾虑**：内容传到第三方服务器（敏感数据需脱敏或自部署）
- **Azure 版本弃用快**：90 天 deprecation 政策需持续跟进

## 文档地址

- OpenAI Moderation：[platform.openai.com/docs/guides/moderation](https://platform.openai.com/docs/guides/moderation)
- Google Perspective：[perspectiveapi.com](https://www.perspectiveapi.com/)
- Azure Content Safety：[learn.microsoft.com/azure/ai-services/content-safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/)
- AWS Comprehend：[docs.aws.amazon.com/comprehend](https://docs.aws.amazon.com/comprehend/)

## GitHub地址

- Perspective API 示例：[github.com/conversationai/perspectiveapi](https://github.com/conversationai/perspectiveapi)
- Azure SDK：[github.com/Azure/azure-sdk-for-js](https://github.com/Azure/azure-sdk-for-js)（`@azure-rest/ai-content-safety`）

## 推荐场景

| 场景 | 推荐方案 |
| --- | --- |
| 已用 OpenAI 生态、英文为主 | OpenAI Moderation |
| 评论 / 论坛毒性治理 | Google Perspective |
| 企业合规 / 多模态 / 越狱检测 | Azure Content Safety |
| AWS 生态 / PII 检测 | AWS Comprehend |
| 自定义规则（竞品名、特定黑话） | Azure Custom Categories / 自训练 |
| 高隐私 / 离线 | 开源模型自部署（Llama Guard 等） |

## 幻灯片地址

<a href="/SlideStack/ai-content-moderation-slide/" target="_blank">AI 内容审核</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ai-content-moderation" target="_blank" rel="noopener noreferrer">AI 内容审核测试题</a>
