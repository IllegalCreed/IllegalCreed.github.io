---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 LiteLLM / Portkey / Helicone 官方文档 2026 编写

## 速查

- AI 网关 = 应用与多家 LLM 之间的代理层，统一接入/路由/治理
- LiteLLM 两种用法：Python SDK（直接调）+ Proxy Server（独立部署）
- LiteLLM 6 种路由策略：simple-shuffle / least-busy / latency-based-routing / cost-based-routing / usage-based-routing / usage-based-routing-v2
- Portkey 定位「AI 控制面」：gateway + 可观测 + guardrails + prompt 管理，SaaS + 自托管
- Helicone 主打可观测：请求日志 + 成本追踪 + 延迟监控，开源（OSS + SaaS）
- vs OpenRouter：网关用你自己的 key 不赚差价；OpenRouter 是托管聚合加价转售
- Proxy 模式：透明转发 OpenAI 兼容请求，应用只改 base_url
- fallback：主模型失败自动切备模型，提升 SLA
- retry：指数退避重试瞬时错误（429/5xx）
- load-balance：多 deployment/key 轮询，突破单 key 限速
- 缓存：精确缓存（相同输入）+ 语义缓存（相似输入）

## 网关能解决什么问题

没有网关时，应用直连各家 API 的痛点：

- 每家 SDK 不同，切换模型要改业务代码
- 单家故障（限速/宕机）直接拖垮业务
- 成本散落各家账单，无法按团队分摊
- 没有统一日志，调试困难
- 多 key 无法轮询，单 key 速率限制成瓶颈

网关把这些**横切关注点**集中到一层。

## LiteLLM：最流行的开源网关

### 两种用法

#### 1. Python SDK（嵌入式）

```python
import litellm

# 统一接口调不同模型
response = litellm.completion(
    model="anthropic/claude-sonnet-4.6",   # vendor/model 格式
    messages=[{"role": "user", "content": "你好"}],
    api_key="sk-ant-xxx",
)
```

适合：单应用、不想部署额外服务。

#### 2. Proxy Server（独立部署）

```bash
# 安装
pip install 'litellm[proxy]'

# 配置（config.yaml）
cat > config.yaml <<EOF
model_list:
  - model_name: claude
    litellm_params:
      model: anthropic/claude-sonnet-4.6
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: gpt5
    litellm_params:
      model: openai/gpt-5
      api_key: os.environ/OPENAI_API_KEY
EOF

# 启动
litellm --config config.yaml --port 4000
```

应用把 OpenAI SDK 的 base_url 指向 `http://localhost:4000`，model 用配置里的 `model_name`（如 `claude`）：

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:4000", api_key="sk-xxx")
resp = client.chat.completions.create(model="claude", messages=[...])
```

适合：多应用共享、需要统一治理。

## LiteLLM Router：6 种路由策略

当同一个逻辑模型名对应多个 deployment（如 Claude 有 OpenAI key + Azure key + 备用 key），Router 决定每次请求走哪个。

| 策略 | 原理 | 适合 |
| --- | --- | --- |
| **simple-shuffle** | 随机打乱（默认） | 均匀分流，最常用 |
| **least-busy** | 选当前活跃请求最少的 | 避免单点过载 |
| **latency-based-routing** | 选历史延迟最低的（滑动窗口） | UI 等延迟敏感场景 |
| **cost-based-routing** | 选最便宜的 | 成本敏感 |
| **usage-based-routing** | 按 TPM/RPM 用量分配 | 突破单 key 限速 |
| **usage-based-routing-v2** | v1 改进版，更平滑 | 大规模生产 |

```yaml
router_settings:
  routing_strategy: latency-based-routing
  num_retries: 3
  timeout: 30
```

::: tip simple-shuffle 是默认

官方推荐 `simple-shuffle`（随机分流）作为默认，多数场景够用。延迟/成本优化再切专门策略。

:::

## Portkey：企业级 AI 控制面

Portkey 定位比 LiteLLM 更「上层」——不只是网关，还包括 prompt 管理、guardrails、语义缓存、AI 治理。SaaS + 自托管（gateway 核心开源）。

```python
from portkey_ai import Portkey

client = Portkey(
    api_key="pk_xxx",
    virtual_key="vk_xxx",   # 关联特定厂商配置
)
resp = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=[...],
)
```

特色：语义缓存、guardrails（内容安全）、prompt 版本管理、细粒度权限（virtual_key 按 team/project 隔离）。

## Helicone：可观测为主

Helicone 主打**观测与成本分析**，轻量。可作为代理部署，也可只做 SDK 插桩。

```python
from openai import OpenAI
client = OpenAI(
    base_url="https://api.helicone.ai/openai/v1",
    api_key="sk-xxx",
    default_headers={"Helicone-Auth": "Bearer hc_xxx"},
)
# 之后所有 OpenAI 调用自动被 Helicone 记录
```

特色：请求日志、成本追踪、延迟监控、prompt 版本对比。比 Portkey 轻、比 LiteLLM 专注可观测。

## 网关 vs OpenRouter

| 维度 | AI 网关（LiteLLM/Portkey/Helicone） | OpenRouter |
| --- | --- | --- |
| 模型供应 | **自带各家 key**，网关只路由 | 托管聚合，OpenRouter 出模型 |
| 计费 | 各家原价，网关不加价 | 加 10-30% 中间费 |
| 部署 | 自建为主（部分 SaaS） | 纯 SaaS |
| 可控性 | 高（数据在自己手里） | 低（数据经 OR） |
| 上手 | 需部署/配置 | 注册即用 |
| 适合 | 企业/合规/大规模 | 个人/中小/快速验证 |

::: tip 选哪类

- **已有各家 key + 重视数据合规 + 大规模** → 自建网关（LiteLLM/Portkey）
- **不想注册多家 + 个人/原型 + 接受加价** → OpenRouter
- **只要可观测不想换路由** → Helicone 插桩

:::

## Proxy 模式详解

多数网关用「透明 Proxy」——应用以为是 OpenAI，请求被网关拦截后路由到真实厂商。

```text
应用 → OpenAI SDK → 网关(base_url) → 真实厂商 API
```

好处：**应用零改动**，已用 OpenAI SDK 的代码只改 base_url。

```python
# 应用侧
client = OpenAI(
    base_url="http://my-gateway:4000/v1",  # 指向网关
    api_key="my-gateway-key",
)
# model 用网关里配置的别名
resp = client.chat.completions.create(model="my-claude", messages=[...])
```

## 下一步

- [指南](./guide-line) —— 6 种路由策略详解 / fallback 配置 / 缓存策略 / 多 key 负载均衡
- [参考](./reference) —— LiteLLM/Portkey/Helicone API 全表 / 配置 schema / 对比矩阵
