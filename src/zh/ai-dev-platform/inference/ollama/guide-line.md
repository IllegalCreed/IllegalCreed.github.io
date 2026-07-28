---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Ollama 官方文档编写（ollama.com / ollama.readthedocs.io，2025.07）—— Modelfile / GGUF 量化 / 工具调用 / 结构化输出 / 性能调优 / 多卡 / 部署运维 / 与 vLLM/LM Studio 对比

## Modelfile 完整指令详解

Modelfile 是 Ollama 的灵魂——一份声明式文件复刻、定制、分发模型，工作流与 Dockerfile 高度一致。

### FROM —— 基础模型（必需）

```dockerfile
# 三种来源
FROM llama3.2                     # 从 ollama registry 拉基础模型
FROM llama3.2:3b-instruct-q4_K_M  # 指定 tag
FROM ./my-model.gguf              # 本地 GGUF 文件
```

### TEMPLATE —— chat template

Go template 语法，变量 `.System` / `.Prompt` / `.Response`。这是与 HuggingFace 的 `chat_template.jinja` 等价物。

```dockerfile
TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
{{ .Response }}<|im_end|>
"""
```

**关键点**：

- 生成时，`.Response` 之后的内容会被截断（模型从 `<|im_start|>assistant\n` 续写）
- <code v-pre>`{{ if .System }}`</code> 让无 system 时不渲染空块
- 不同模型族的 special token 不同（Llama 用 `<|begin_of_text|>`、ChatML 用 `<|im_start|>`），必须按目标模型写

### SYSTEM —— 默认系统提示

```dockerfile
SYSTEM """你是一个友善的中文助手，回答简洁准确。"""
```

调用 API 时若 messages 里没传 system，就用 Modelfile 里的 SYSTEM 兜底。

### PARAMETER —— 推理参数

完整可用参数：

| 参数 | 默认 | 说明 |
|---|---|---|
| `mirostat` | 0 | 启用 Mirostat 采样（0 关 / 1 v1 / 2 v2）|
| `mirostat_eta` | 0.1 | Mirostat 学习率 |
| `mirostat_tau` | 5.0 | Mirostat 目标熵 |
| `num_ctx` | 2048 | 上下文窗口（token）|
| `num_predict` | -1 | 最大生成 token（-1 无限）|
| `repeat_last_n` | 64 | 重复惩罚窗口 |
| `repeat_penalty` | 1.1 | 重复惩罚系数 |
| `seed` | -1 | 随机种子（-1 随机）|
| `stop` | [] | 停止字符串列表 |
| `temperature` | 0.8 | 温度 |
| `tfs_z` | 1.0 | Tail-free sampling |
| `top_k` | 40 | Top-K 采样 |
| `top_p` | 0.9 | Top-P（nucleus）采样 |
| `min_p` | 0.0 | Min-P 采样 |

```dockerfile
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"
```

### ADAPTER —— LoRA 微调权重

```dockerfile
FROM llama3.2
ADAPTER ./my-lora.gguf
```

支持 QLoRA 量化 adapter（需先转 GGUF）。多个 ADAPTER 可叠加。

### MESSAGE —— few-shot 示例

```dockerfile
MESSAGE user "把这句话翻译成英文：今天天气不错"
MESSAGE assistant "The weather is nice today."
MESSAGE user "翻译：我喜欢编程"
MESSAGE assistant "I like programming."
```

这些 MESSAGE 会作为对话前缀注入，提供 few-shot 引导。

### LICENSE —— 许可证

```dockerfile
LICENSE """MIT License

Copyright (c) 2025 ...
"""
```

`ollama show &lt;model&gt; --license` 可查看。push 到 registry 时会显示。

## GGUF 量化级别

GGUF（GPT-Generated Unified Format）是 llama.cpp 生态的模型格式。同一模型常有多个量化级别，权衡体积/速度/精度：

| 量化 | bit/权重 | 7B 体积 | 精度损失 | 适用 |
|---|---|---|---|---|
| Q8_0 | 8 | ~7GB | 几乎无损 | 内存充足，要精度 |
| Q6_K | 6 | ~5.5GB | 极小 | 平衡 |
| Q5_K_M | 5 | ~4.8GB | 很小 | **推荐** |
| Q4_K_M | 4 | ~4.1GB | 小 | **最常用** |
| Q4_0 | 4 | ~3.8GB | 中 | 老 format，更快 |
| Q3_K_M | 3 | ~3.3GB | 明显 | 内存吃紧 |
| Q2_K | 2 | ~2.7GB | 较大 | 极限压缩 |

::: tip 默认选 Q4_K_M
ollama registry 默认 tag 通常是 Q4_K_M（如 `llama3.2` = 3B Q4_K_M）。它在体积、速度、精度三者的最佳平衡点。内存充足升 Q5_K_M/Q6_K，内存吃紧降 Q3_K_M。
:::

### 自定义量化

从 HF safetensors 转 GGUF 并量化用 llama.cpp 工具：

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# 1. 转 GGUF（FP16）
python convert_hf_to_gguf.py ./hf_model --outtype f16 --outfile model-f16.gguf

# 2. 量化
./llama-quantize model-f16.gguf model-q4_K_M.gguf q4_K_M
```

然后 `FROM ./model-q4_K_M.gguf` 在 Modelfile 里用。

## 工具调用（Function Calling）

支持 OpenAI 风格 `tools`。Llama 3.1+ / Qwen2.5 / Mistral 等模型原生支持。

```python
resp = client.chat.completions.create(
    model="llama3.1",
    messages=[{"role": "user", "content": "北京天气如何？"}],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "查询城市天气",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"]
            }
        }
    }],
    tool_choice="auto"
)
# resp.choices[0].message.tool_calls[0].function.name == "get_weather"
# resp.choices[0].message.tool_calls[0].function.arguments == '{"city": "北京"}'
```

调用真实函数后把结果作为 `role=tool` 消息回传，模型生成最终自然语言答复。

## 结构化输出（JSON mode）

### format=json

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [{"role":"user","content":"列出3种水果的JSON，字段name和color"}],
  "format": "json",
  "stream": false
}'
```

响应 `message.content` 是合法 JSON 字符串。

### format=JSON Schema（更严格）

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [{"role":"user","content":"北京和上海"}],
  "format": {
    "type": "object",
    "properties": {
      "cities": {
        "type": "array",
        "items": {"type": "object", "properties": {"name":{"type":"string"}, "country":{"type":"string"}}}
      }
    },
    "required": ["cities"]
  },
  "stream": false
}'
```

模型输出严格匹配 schema。这是 GBNF/grammar 约束的封装。

## 性能调优

### 上下文长度 num_ctx

`num_ctx` 决定窗口大小，**直接决定 KV Cache 内存占用**：

```
KV Cache 内存 ≈ 2 × layers × dim × num_ctx × bytes
```

Llama 3 8B、num_ctx=8192 时 KV Cache 约 4GB。盲目调大 num_ctx 会 OOM。按业务真实需求设。

### 并发：OLLAMA_NUM_PARALLEL

默认 Ollama 同一时间只处理少量请求。`OLLAMA_NUM_PARALLEL=4` 让它能并发处理 4 个请求（共享一份模型权重，每请求独占 KV Cache）。但每多一个并发就多一份 KV Cache 内存，按内存设。

### keep_alive

模型加载后默认在内存保留 5 分钟（`keep_alive=5m`）应对后续请求，避免反复加载。空闲场景可设 `0` 立即卸载：

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2", "keep_alive": 0
}'
```

### GPU 选层

`/api/show` 返回的模型信息里有 `model_info`，可看 GPU offload 层数。大模型 num_gpu 可控制多少层放 GPU。

## 多卡 / 多 GPU

Ollama 自动检测多 GPU 并切分层（tensor split）。也可手动控制：

- `CUDA_VISIBLE_DEVICES=0,1 ollama serve` 限定 GPU
- 环境变量 `OLLAMA_GPU_OVERHEAD` 预留显存
- 显存不够时自动 CPU offload（部分层放内存，慢但能跑）

注意：Ollama 的多卡是 llama.cpp 的 tensor split，**不是 vLLM 那种 TP**，并发吞吐远不如 vLLM。生产高并发请用 vLLM。

## 部署运维

### systemd 服务（Linux）

install 脚本会注册 `ollama.service`，开机自启。

```bash
sudo systemctl status ollama
sudo systemctl restart ollama
journalctl -u ollama -f    # 查看日志
```

### 远程访问与 CORS

默认只监听 127.0.0.1。要让局域网访问：

```bash
# systemd 环境
sudo systemctl edit ollama
# 添加：
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"
```

`OLLAMA_ORIGINS` 控制 CORS（前端跨域调用必设）。

### 模型存储位置

| 平台 | 默认路径 |
|---|---|
| Linux | `~/.ollama/models` |
| macOS | `~/.ollama/models` |
| Windows | `C:\Users\&lt;user&gt;\.ollama\models` |

改位置：`OLLAMA_MODELS=/data/ollama/models`。

### Docker 持久化

```bash
docker run -d \
  -v /data/ollama:/root/.ollama \
  -p 11434:11434 \
  --gpus all \
  --name ollama \
  ollama/ollama
```

## 与 vLLM / LM Studio 对比

| 需求 | 推荐 |
|---|---|
| MacBook 本地跑 Llama | **Ollama** |
| 边缘设备 / 树莓派 | **Ollama** |
| 数据中心高并发 API | **vLLM**（吞吐高一个数量级）|
| 离线评测 / 数据合成（数据中心）| vLLM |
| 想要图形界面本地用 | LM Studio 或 Open WebUI + Ollama |
| 自定义 Modelfile 分发 | **Ollama** |
| 跨硬件通吃 | **Ollama** / llama.cpp |
| 用 LoRA 微调权重 | **Ollama**（ADAPTER 指令）|

**经验法则**：消费级 / 本地 / 开发调试 → Ollama；生产高并发 → vLLM。两者并不冲突，开发用 Ollama，上线切 vLLM。
