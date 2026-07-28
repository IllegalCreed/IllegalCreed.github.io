---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 LiteLLM / Portkey / Helicone 官方文档 2026 编写。完整 API 见各官方文档。

## 网关产品对比

| 产品 | 类型 | 核心定位 | 部署 | 语言 | 特色 |
| --- | --- | --- | --- | --- | --- |
| **LiteLLM** | 开源 | 路由 + 代理 | 自建（Python） | Python | 6 种路由策略、最流行 |
| **Portkey** | 商业+开源核心 | AI 控制面 | SaaS + 自托管 | TypeScript | 治理 + guardrails + 语义缓存 |
| **Helicone** | 开源+SaaS | 可观测为主 | 自建 / SaaS | TypeScript | 日志 + 成本 + 延迟，轻量 |
| OpenRouter（对比项） | SaaS | 托管聚合 | SaaS | - | 加价转售，自带模型 |

## LiteLLM

### 安装

```bash
pip install litellm                # SDK
pip install 'litellm[proxy]'       # Proxy Server
```

### SDK 调用

```python
import litellm

# 文本
response = litellm.completion(
    model="anthropic/claude-sonnet-4.6",   # vendor/model
    messages=[{"role": "user", "content": "你好"}],
    api_key="sk-ant-xxx",
)

# 嵌入
emb = litellm.embedding(
    model="openai/text-embedding-3-small",
    input="...",
)

# 流式
stream = litellm.completion(model="...", messages=[...], stream=True)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")
```

### Proxy Server 配置

```yaml
# config.yaml
model_list:
  - model_name: claude                  # 对外别名
    litellm_params:
      model: anthropic/claude-sonnet-4.6
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: gpt5
    litellm_params:
      model: openai/gpt-5
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  num_retries: 3
  request_timeout: 30
  drop_params: true                     # 丢弃不支持的参数

router_settings:
  routing_strategy: simple-shuffle      # 默认
  allowed_fails: 3
  cooldown_time: 60

litellm_cache:
  type: redis
  host: redis
  port: 6379
```

### 启动

```bash
litellm --config config.yaml --port 4000 --api_key sk-gateway-xxx
```

### 调用

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:4000/v1", api_key="sk-gateway-xxx")
resp = client.chat.completions.create(model="claude", messages=[...])
```

## LiteLLM 路由策略

| 策略 | 原理 | 配置值 | 适合 |
| --- | --- | --- | --- |
| simple-shuffle | 随机打乱（默认） | `simple-shuffle` | 均匀分流 |
| least-busy | 最少活跃请求 | `least-busy` | 长耗时请求 |
| latency-based-routing | 历史延迟最低 | `latency-based-routing` | 延迟敏感 |
| cost-based-routing | 单价最低 | `cost-based-routing` | 成本敏感 |
| usage-based-routing | TPM/RPM 用量 | `usage-based-routing` | 突破限速 |
| usage-based-routing-v2 | v1 改进版 | `usage-based-routing-v2` | 大规模生产 |

## LiteLLM 模型格式

```
<vendor>/<model-name>
```

主要 vendor 前缀：

| 前缀 | 厂商 |
| --- | --- |
| `openai/` | OpenAI |
| `anthropic/` | Anthropic |
| `vertex_ai/` | Google Vertex |
| `gemini/` | Google AI Studio |
| `bedrock/` | AWS Bedrock |
| `azure/` | Azure OpenAI |
| `huggingface/` | HF Inference |
| `together_ai/` | Together AI |
| `ollama/` | Ollama 本地 |
| `ollama_chat/` | Ollama chat |

## Portkey

### 安装

```bash
pip install portkey-ai
```

### 调用

```python
from portkey_ai import Portkey

client = Portkey(
    api_key="pk_xxx",           # Portkey 主 key
    virtual_key="vk_xxx",       # 关联特定厂商/team 配置
)
resp = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=[...],
)
```

### 自托管 Gateway（开源核心）

```bash
# Docker
docker run -d -p 8787:8787 portkeyai/gateway
```

应用指向 `http://localhost:8787`，配置通过 dashboard 或 config 文件管理。

### 特色功能

| 功能 | 说明 |
| --- | --- |
| virtual_key | 按 team/project 隔离配置与额度 |
| 语义缓存 | embedding 相似命中 |
| Guardrails | 输入/输出过滤、PII 脱敏 |
| Prompt 管理 | 版本化、A/B、回滚 |
| 治理 | 细粒度权限、审计日志 |

## Helicone

### 部署方式

#### 1. SaaS 代理（最简单）

```python
from openai import OpenAI
client = OpenAI(
    base_url="https://api.helicone.ai/openai/v1",
    api_key="sk-openai-xxx",
    default_headers={"Helicone-Auth": "Bearer hc_xxx"},
)
# 所有调用自动记录到 Helicone
```

#### 2. SDK 插桩（不改 base_url）

```python
import helicone
helicone.init(api_key="hc_xxx")

from openai import OpenAI
client = OpenAI()   # 用官方 base_url，Helicone 透明记录
```

#### 3. 自托管

Docker compose 部署，数据完全在自己服务器。

### 可观测能力

| 能力 | 说明 |
| --- | --- |
| 请求日志 | 每次调用的 input/output/tokens |
| 成本追踪 | 按 model/user 维度 |
| 延迟监控 | p50/p95/p99 |
| 错误分析 | 按错误码归类 |
| Prompt 版本 | 对比不同 prompt 效果 |
| 缓存 | 精确 + 语义 |

## Proxy 模式架构

```text
应用代码
  ↓ OpenAI SDK (base_url 指向网关)
AI 网关 (LiteLLM/Portkey/Helicone)
  ↓ 按路由策略选 deployment
真实厂商 API (OpenAI/Anthropic/Google/...)
```

应用侧改动：

```python
# 改前：直连 OpenAI
client = OpenAI(api_key="sk-openai-xxx")

# 改后：走网关
client = OpenAI(
    base_url="http://my-gateway:4000/v1",
    api_key="sk-gateway-xxx",
)
```

## 选型决策矩阵

| 场景 | 首选 | 备选 |
| --- | --- | --- |
| 多模型路由 + 开源 + 自建 | **LiteLLM** | - |
| 企业级治理 + guardrails | **Portkey** | LiteLLM |
| 只要可观测 | **Helicone** | Portkey |
| 已有各家 key + 重视合规 | LiteLLM / Portkey | - |
| 个人/原型，不想注册多家 | OpenRouter（聚合 SaaS） | - |
| 极致延迟敏感 | 直连厂商（绕过网关） | - |

::: tip 极致延迟场景绕过网关

网关多一跳增加几毫秒到几十毫秒。对极致延迟敏感的核心链路（如实时对话首 token），可考虑直连厂商，仅非核心调用走网关。

:::

## 资源链接

- LiteLLM 文档：[docs.litellm.ai](https://docs.litellm.ai/docs/proxy/quick_start)
- LiteLLM 路由：[docs.litellm.ai/docs/routing](https://docs.litellm.ai/docs/routing)
- LiteLLM GitHub：[github.com/BerriAI/litellm](https://github.com/BerriAI/litellm)
- Portkey 文档：[docs.portkey.ai](https://docs.portkey.ai)
- Portkey Gateway（开源）：[github.com/Portkey-AI/gateway](https://github.com/Portkey-AI/gateway)
- Helicone 文档：[docs.helicone.ai](https://docs.helicone.ai)
- Helicone GitHub：[github.com/Helicone/helicone](https://github.com/Helicone/helicone)
- Portkey vs LiteLLM vs OpenRouter 对比：[pkgpulse.com/guides/portkey-vs-litellm-vs-openrouter-llm-gateway-2026](https://www.pkgpulse.com/guides/portkey-vs-litellm-vs-openrouter-llm-gateway-2026)
- Helicone vs OpenRouter：[truefoundry.com/blog/helicone-vs-openrouter](https://www.truefoundry.com/blog/helicone-vs-openrouter)
