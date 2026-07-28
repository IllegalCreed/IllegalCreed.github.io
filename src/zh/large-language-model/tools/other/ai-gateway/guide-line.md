---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 LiteLLM / Portkey / Helicone 官方文档 2026 编写

## 速查

- 路由策略默认 simple-shuffle（随机），延迟敏感切 latency-based-routing
- fallback 链：主模型失败按顺序切备模型，避免单点故障
- retry：只重试瞬时错误（429/5xx），别重试 400（参数错）
- 多 key 负载均衡：同一模型挂多个 key，轮询突破单 key 限速
- cooldown：失败的 deployment 暂时摘除（如 60 秒），避免持续打挂的节点
- 缓存：精确缓存（hash 输入）+ 语义缓存（embedding 相似），时间敏感查询慎用
- 成本控制：按 team/project 设预算 + 告警，超预算限流
- 可观测三件套：请求日志 + 成本追踪 + 延迟监控
- Guardrails：内容安全 / PII 脱敏 / 输出格式校验
- 高可用：网关本身要集群部署，别成新单点

## LiteLLM 路由策略详解

### simple-shuffle（默认，随机）

把 deployment 列表随机打乱后选一个。简单有效，均匀分流，是官方推荐默认。

```yaml
router_settings:
  routing_strategy: simple-shuffle
```

### least-busy（最少活跃请求）

跟踪每个 deployment 当前未完成的请求数，选最闲的。适合**长耗时请求**（如长文生成），避免单点堆积。

```yaml
router_settings:
  routing_strategy: least-busy
```

### latency-based-routing（延迟优先）

维护每个 deployment 的**历史延迟**（滑动窗口平均），选最快的。适合 UI 等延迟敏感场景。

```yaml
router_settings:
  routing_strategy: latency-based-routing
  routing_args:
    sliding_window_size: 10   # 用最近 10 次延迟平均
```

::: warning 滑动窗口太小不稳

窗口太小（如 3）容易受偶发抖动影响，太大（如 100）反应慢。10-30 是经验值。

:::

### cost-based-routing（成本优先）

选**单价最低**的 deployment。适合成本敏感、对延迟/质量要求不极致的场景（如批量处理）。

```yaml
router_settings:
  routing_strategy: cost-based-routing
```

### usage-based-routing / v2（用量分配）

按各 deployment 的 TPM（每分钟 token）/ RPM（每分钟请求）用量分配，把请求往「还有余量」的 deployment 送。**核心价值是突破单 key 限速**——挂多个 key 轮询。

```yaml
router_settings:
  routing_strategy: usage-based-routing-v2   # v2 更平滑
```

v2 相比 v1 改进了分配算法，避免请求在 key 间剧烈跳变。

## fallback 配置

主模型失败时按链顺序切备模型：

```yaml
router_settings:
  fallbacks:
    - model: claude-sonnet
      fallback_model: gpt-5          # claude 失败切 gpt-5
    - model: gpt-5
      fallback_model: llama-70b      # gpt-5 也失败切 llama
```

触发条件通常是：主模型返回 429（限速）/ 5xx（服务端错）/ 超时。

::: tip fallback 不是 retry

- **retry**：同一模型重试（瞬时错误恢复）
- **fallback**：换另一个模型（彻底降级）

两者叠加：先 retry 主模型几次，还失败再 fallback。

:::

## retry 策略

```yaml
litellm_settings:
  num_retries: 3
  retry_after: 5          # 429 时尊重 Retry-After header
  backoff_factor: 2       # 指数退避：1s → 2s → 4s
```

只重试**瞬时错误**：

| 错误 | 是否重试 |
| --- | --- |
| 429（限速） | ✓ |
| 500/502/503/504（服务端） | ✓ |
| 408（超时） | ✓ |
| 400（参数错） | ✗（重试也是错） |
| 401（鉴权） | ✗ |
| 403（无权限） | ✗ |

## 多 key 负载均衡

同一个模型挂多个 key，轮询突破单 key 限速：

```yaml
model_list:
  - model_name: claude              # 对外统一名
    litellm_params:
      model: anthropic/claude-sonnet-4.6
      api_key: sk-ant-key1
  - model_name: claude              # 同名 = 同一逻辑模型
    litellm_params:
      model: anthropic/claude-sonnet-4.6
      api_key: sk-ant-key2
  - model_name: claude
    litellm_params:
      model: anthropic/claude-sonnet-4.6
      api_key: sk-ant-key3
```

配合 `usage-based-routing-v2`，请求自动往还有 TPM 余量的 key 送。

## cooldown 机制

某 deployment 连续失败 N 次后，**暂时摘除**（如 60 秒），避免持续打挂的节点：

```yaml
router_settings:
  allowed_fails: 3          # 连续失败 3 次摘除
  cooldown_time: 60         # 摘除 60 秒
```

摘除期间请求不会再路由到它，60 秒后自动恢复尝试。

## 缓存策略

### 精确缓存（exact）

相同输入（model + messages + params 的 hash）命中缓存。

```yaml
litellm_cache:
  type: redis
  host: redis_host
  port: 6379
  ttl: 3600   # 1 小时
```

适合：FAQ 类、重复查询多的场景。

### 语义缓存（semantic）

用 embedding 算输入相似度，相似请求复用历史结果。Portkey 等支持。

```text
查询1：「如何重置密码」→ 生成结果 A，缓存
查询2：「密码忘了怎么改」→ embedding 相似 → 命中，返回 A
```

::: warning 语义缓存风险

**时间敏感查询**（如「今天天气」「最新新闻」）语义缓存会返回过期结果。配置时要排除这类，或设很短 TTL。

:::

## 成本控制

### 按 team/project 分摊

Portkey 用 virtual_key 按 team 隔离：

```python
# team A 的 key
client_a = Portkey(api_key="pk_xxx", virtual_key="vk_team_a")
# team B 的 key
client_b = Portkey(api_key="pk_xxx", virtual_key="vk_team_b")
```

LiteLLM 用 metadata + budget：

```yaml
litellm_settings:
  max_budget:
    team_a:
      max_budget: 100        # $100/月
      soft_budget: 80        # $80 告警
```

### 预算告警

超 soft_budget 发告警，超 max_budget 拒绝请求。

## 可观测三件套

### 1. 请求日志

每次调用记录：model / input / output / tokens / latency / status / cost。Helicone 专长。

### 2. 成本追踪

按 model / team / project 维度统计花费，导出报表。

### 3. 延迟监控

p50 / p95 / p99 延迟，按 model 对比，发现慢模型。

## Guardrails

Portkey 等支持内容安全 / PII 脱敏 / 输出校验：

- **输入过滤**：拦截敏感词 / 越狱 prompt
- **PII 脱敏**：身份证 / 手机号等自动 mask
- **输出校验**：JSON schema 校验、敏感内容拦截

## 高可用部署

网关本身别成新单点：

- 多实例 + 负载均衡（nginx / k8s service）
- 共享状态（redis 存路由统计、缓存）
- 健康检查 + 自动重启

::: warning 网关宕机 = 全站挂

自建网关是「单点风险转移」——从「单家厂商挂」变成「你的网关挂」。务必高可用部署。

:::

## 常见陷阱

| 陷阱 | 原因 | 解决 |
| --- | --- | --- |
| 网关成了新单点 | 单实例部署 | 多实例 + LB |
| 缓存返回过期数据 | 语义缓存 + 时间敏感查询 | 排除或缩短 TTL |
| retry 风暴 | 重试 400/401 | 只重试瞬时错误 |
| 成本超预算 | 没设 max_budget | 配 budget + 告警 |
| 厂商独有特性丢失 | 网关不透传（如 Claude MCP） | 关键特性直连 |
| 调试难分清责任 | 网关 vs 上游 | 日志带 request_id 串联 |
| 多 key 不均衡 | 用了 simple-shuffle 但 key 限速不同 | 换 usage-based-routing |

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2023 | LiteLLM 诞生 / OpenRouter 聚合模式兴起 |
| 2024 | LiteLLM 6 种路由策略完善 / Portkey 治理能力增强 |
| 2025 | 语义缓存普及 / Helicone 可观测成熟 / Portkey 被 Palo Alto 收购 |
| 2026 | Guardrails 标配化 / 多模态网关 / 与向量库融合 |
