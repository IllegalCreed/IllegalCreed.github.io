---
layout: doc
outline: [2, 3]
---

# 核心 API 与思考模式

> 基于阿里云百炼帮助中心（OpenAI 兼容 + Responses + Anthropic 兼容 + DashScope 原生四端点）+ Qwen-Agent GitHub 官方文档编写，对照 2026 年 Qwen3.7 系列

## 速查

- **四端点定位**：OpenAI 兼容-Chat（迁移成本最低，默认首选）/ Responses（内置联网 + 代码解释器）/ Anthropic 兼容-Messages / DashScope 原生（全参数集）
- **思考模式总开关**：`enable_thinking`（bool，放 extra_body）+ `thinking_budget`（int，token 上限）
- **`reasoning_effort`**：`low/medium/high/xhigh`，与 `thinking_budget` 自动互转
- **逐轮软切换**：`/think` 与 `/no_think` 写在 prompt 里
- **返回字段**：`reasoning_content`（思维链） vs `content`（最终回答）
- **长度限制**：`max_completion_tokens`（含思维链 + 回答）取代即将废弃的 `max_tokens`（仅回答）
- **多轮保留思维链**：`preserve_thinking=true`
- **思考模式采样推荐**：`temperature=0.6 / top_p=0.95 / top_k=20`；**严禁 `temperature=0`**
- **非思考模式**：`temperature=0.7`（默认）
- **SDK 调用规则**：`enable_thinking` / `thinking_budget` / `top_k` / `enable_search` 等非 OpenAI 标准参数**必须放 `extra_body`**；curl 调用放请求体**顶层**
- **开源协议**：Qwen3 全系列 **Apache 2.0**（含 235B-A22B）；Qwen3-Max / Qwen3.7-Max 闭源旗舰仅 API
- **Qwen-Agent 三层**：BaseChatModel（LLM）/ BaseTool + `@register_tool`（工具）/ Assistant + FnCallAgent + ReActChat（Agent）
- **MCP 集成**：标准 MCP 配置接入 memory / filesystem / sqlite 等外部工具
- **反模式**：思考模式 `temperature=0` / `max_tokens` 限思考模型 / `enable_thinking` 放顶层 / 无脑开 thinking

## 模型选型：场景 → 模型映射

| 场景 | 首选 | 备选 |
| --- | --- | --- |
| 通用生产（成本敏感） | `qwen-plus` / `qwen3.7-plus` | `qwen3-30b-a3b`（开源自部署） |
| 旗舰复杂任务 | `qwen-max` / `qwen3.7-max` | `qwen3-235b-a22b`（开源自部署） |
| 高并发 / 简单任务 | `qwen-turbo` / `qwen3.7-flash` | `Qwen3-4B`（开源自部署） |
| 深度推理（数学 / 逻辑） | `qwen3-235b-a22b-thinking-2507` | `qwen3-max-thinking` |
| 编程（仓库级） | `qwen3-coder-480b-a35b-instruct` | `Qwen3-Coder-480B`（开源自部署） |
| 超长文档（>128K） | `Qwen3-Coder-480B`（YaRN 1M） | Qwen-Agent RAG |
| 多模态（图 / 音 / 视频） | `qwen3.5-omni-plus` | `qwen-vl-max` |
| 边缘设备 | `Qwen3-0.6B` / `1.7B` | `Qwen3-4B` |

## 四端点对照

| 端点 | URL | 定位 |
| --- | --- | --- |
| **OpenAI 兼容-Chat**（默认首选） | `compatible-mode/v1/chat/completions` | 直接复用 OpenAI SDK，迁移成本接近 0 |
| **OpenAI 兼容-Responses** | `compatible-mode/v1/responses` | 内置联网搜索 + 代码解释器（Docker 沙箱） |
| **Anthropic 兼容-Messages** | `compatible-mode/v1/messages` | 直接复用 Anthropic SDK，迁移 Claude 应用 |
| **DashScope 原生** | `/api/v1/services/aigc/text-generation/generation` | 全参数集（`result_format` 等百炼专属） |

> 选型原则：**默认走 OpenAI 兼容-Chat**；仅当需要 `result_format`、原生 `input.parameters` 等百炼专属字段，或要复用 Anthropic SDK 现有代码，才换其他端点。

## 思考模式：参数全解

### `enable_thinking`：总开关（必放 extra_body）

```python
# Python OpenAI SDK 调用：非标准参数必须放 extra_body
resp = client.chat.completions.create(
    model="qwen3-235b-a22b-thinking-2507",
    messages=[{"role": "user", "content": "..."}],
    extra_body={"enable_thinking": True},   # 放这里
)
```

```bash
# curl 调用：直接放请求体顶层
curl -s https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
  -d '{"model": "...", "messages": [...], "enable_thinking": true}'
```

> 反模式：把 `enable_thinking` 直接放 OpenAI SDK 的 `client.chat.completions.create()` 顶层——会被 SDK 拒绝或静默忽略。

### `thinking_budget`：思维链 token 预算

- 简单任务：`512` ~ `1024`（省成本 / 延迟）
- 复杂多步推理：`4096` +（数学证明 / 复杂代码生成）
- 与 `reasoning_effort`（`low/medium/high/xhigh`）**自动互转**——任选其一即可

### `reasoning_content` vs `content`

返回的 `message` 对象分两个字段：

| 字段 | 内容 | 限制参数 |
| --- | --- | --- |
| `reasoning_content` | 思维链推理过程（thinking 子模型才有） | `thinking_budget` |
| `content` | 最终回答 | `max_completion_tokens`（含 reasoning） |

> 反模式：解析时把 `reasoning_content` 混入主答案——会污染业务逻辑、JSON 解析、工具调用参数提取。

### `max_completion_tokens` vs `max_tokens`（坑）

| 参数 | 含义 | 状态 |
| --- | --- | --- |
| `max_completion_tokens` | 含「思维链 + 回答」的总长度 | **推荐** |
| `max_tokens` | 仅限制 `content`（回答） | **即将废弃** |

> 反模式：用 `max_tokens` 限制思考模型总输出——只限回答不限思维链，token 超额仍会失败。改用 `max_completion_tokens`。

### `/think` 与 `/no_think`：逐轮软切换

```python
messages = [
    {"role": "user", "content": "/think 详细分析这道数学题"},     # 本轮开思考
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": "/no_think 把这段翻译成英文"},    # 本轮关思考
]
```

> 同一会话混合简单 / 复杂任务时用软切换；不要无脑全局开 thinking（简单 QA / 闲聊 / 格式转换纯属浪费 token）。

### 关闭思考的正确姿势

```python
# 正确：用 enable_thinking=false
extra_body={"enable_thinking": False}

# 反模式：用 thinking_budget=0 期望「完全关闭」——行为不直观，官方不推荐
```

### 采样参数（思考模式专属）

| 模式 | temperature | top_p | top_k |
| --- | --- | --- | --- |
| **思考模式** | **0.6** | **0.95** | **20** |
| 非思考模式（默认） | 0.7 | 0.8 | 不设 |

> 反模式：思考模式用 `temperature=0` 贪婪解码——会导致思维链重复、卡死，性能塌陷。

> 反模式：同时设置 `temperature` 与 `top_p` 各自调参——官方建议**二选一**，同时设置会相互冲突。

## Function Calling 与工具调用

### 标准参数

| 参数 | 含义 |
| --- | --- |
| `tools` | 工具定义数组（同 OpenAI 结构） |
| `tool_choice` | `"auto"` / `"none"` / 指定工具 |
| `parallel_tool_calls` | 是否允许并行调用多个工具 |

### 工具命名限制（百炼）

- **仅允许**：字母 / 数字 / 下划线 `_` / 短划线 `-`
- **长度**：≤ 64 token
- **禁止**：中文 / 空格 / 点号 / 其他特殊字符

> 反模式：工具名包含中文（如 `获取天气`）会被百炼拒绝；改为 `get_weather`。

### 内置工具（OpenAI 兼容-Responses 端点）

| 工具 | 能力 |
| --- | --- |
| `web_search` | 内置联网搜索（无需自己接搜索 API） |
| `code_interpreter` | Docker 沙箱内执行 Python 代码 |

```python
# 走 Responses 端点（OpenAI 兼容）
resp = client.responses.create(
    model="qwen3.7-max",
    input="今天北京 PM2.5 多少？",
    tools=[{"type": "web_search"}],
)
```

## Qwen-Agent 框架

> Agent 场景**优先用 Qwen-Agent 框架**而非裸调 API——框架内置函数调用模板（nous 模板适配 Qwen3）与 tool call parser，省去手写 ReAct prompt 与解析逻辑。

### 三层抽象

| 层 | 抽象 | 职责 |
| --- | --- | --- |
| LLM 层 | `BaseChatModel` | 对接各模型后端（DashScope / OpenAI 兼容 / 本地 vLLM） |
| 工具层 | `BaseTool` + `@register_tool` 装饰器 | 自定义工具的统一接口 |
| Agent 层 | `Assistant` / `FnCallAgent` / `ReActChat` | 编排工具调用与多步推理 |

### 自定义工具：`@register_tool`

```python
from qwen_agent.tools.base import BaseTool, register_tool

@register_tool("get_weather")
class GetWeather(BaseTool):
    description = "获取城市天气"
    parameters = [{
        "name": "city",
        "type": "string",
        "description": "城市名",
        "required": True,
    }]

    def call(self, params: str, **kwargs) -> str:
        # params 是 JSON 字符串
        import json
        city = json.loads(params)["city"]
        return f"{city} 今天晴，25℃"
```

### Assistant：一行起 Agent

```python
from qwen_agent.agents import Assistant

# LLM 配置
llm_cfg = {
    "model": "qwen3-235b-a22b-thinking-2507",
    "model_server": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "api_key": os.environ["DASHSCOPE_API_KEY"],
}

# 把工具直接传给 Assistant，框架自动处理 tool_calls 解析
bot = Assistant(
    llm=llm_cfg,
    function_list=["get_weather"],  # 注册名
    system_message="你是天气助手",
)

# 流式跑
for chunk in bot.run([{"role": "user", "content": "北京天气"}]):
    print(chunk)
```

### MCP 集成

通过标准 MCP 配置接入 `memory` / `filesystem` / `sqlite` 等外部工具：

```python
# 把 MCP server 当 tool 传给 Assistant
tools = [
    {
        "mcp": {
            "server": {
                "url": "http://localhost:9000/sse",  # MCP server
            }
        }
    }
]
bot = Assistant(llm=llm_cfg, function_list=tools)
```

> MCP（Model Context Protocol）是 Anthropic 主导的标准协议，Qwen-Agent 原生支持，可复用 Claude / Cursor 等生态的 MCP server。

## 超长上下文：原生 vs RAG

| 方案 | 适用 | 成本 |
| --- | --- | --- |
| 原生 1M 上下文 | 仓库级代码分析（Qwen3-Coder YaRN） | 高（按 1M token 计费） |
| Qwen-Agent RAG | 通用长文 / 知识库 | 低（向量检索 + 切片） |

> 官方建议：超长文档（>128K）二选一，**仓库级代码用 Coder 原生 1M**，**通用长文用 RAG**——后者多个基准超越原生长上下文模型。

## 反模式（避坑）

- **思考模式用 `temperature=0`**：导致思维链重复、卡死；必须 `temperature=0.6`
- **`enable_thinking` 放 OpenAI SDK 顶层**：必须放 `extra_body`，否则被拒绝或静默忽略
- **用 `max_tokens` 限制思考模型总输出**：只限回答不限思维链；改用 `max_completion_tokens`
- **同时调 `temperature` 与 `top_p`**：相互冲突，官方建议二选一
- **解析时混淆 `reasoning_content` 与 `content`**：思维链混入主答案会污染业务逻辑
- **误以为 Qwen3-235B-A22B 是闭源**：实际 Apache 2.0 全量开源，可商用与微调
- **无脑默认开 thinking**：简单 QA / 闲聊 / 格式转换开思考纯属浪费，应 `enable_thinking=false` 或 `/no_think`
- **用 `thinking_budget=0` 期望「完全关闭思考」**：行为不直观，正确做法是 `enable_thinking=false`
- **把 Qwen3-Max / Qwen3.7-Max 当开源模型**：闭源旗舰，仅百炼 API，无权重下载
- **Function Calling 工具名包含中文 / 空格 / 点号**：仅允许字母 / 数字 / 下划线 / 短划线
- **Qwen3 思考模型接 vLLM 加 `--enable-auto-tool-choice`**：Qwen-Agent 官方明确 QwQ-32B 与 Qwen3 系列不应加该参数，框架自行解析工具输出
- **百炼 API Key 硬编码到代码**：泄露风险，必须用 `DASHSCOPE_API_KEY` 环境变量注入
- **国际站与国内站 API Key 混用**：双轨不通用，国际站用 `dashscope-intl.aliyuncs.com`

## 下一步

- [参考](./reference.md)：完整端点对照表 + 参数速查 + 模型 ID 速查 + 官方资源
