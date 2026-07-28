---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Ollama 官方文档编写（ollama.com / ollama.readthedocs.io，2025.07 版本）

## 速查

- 系统要求：macOS 11+ / Windows 10+ / Linux；内存 ≥ 8GB（跑 7B 模型）、16GB+（13B）、32GB+（33B/70B 量化）
- 安装：macOS/Windows 下官网下载 `.dmg`/`Setup.exe`；Linux `curl -fsSL https://ollama.com/install.sh | sh`
- 跑模型：`ollama run llama3.2`（首次自动下载）
- 列出已装：`ollama list`
- 删除：`ollama rm llama3.2`
- 起服务：`ollama serve`（前台）或后台守护进程
- 默认 API 端口：`http://localhost:11434`
- OpenAI 兼容端点：`/v1/chat/completions` / `/v1/completions` / `/v1/embeddings` / `/v1/models`
- 原生 API：`/api/chat` / `/api/generate` / `/api/embeddings`
- Modelfile：`FROM` / `TEMPLATE` / `SYSTEM` / `PARAMETER` / `ADAPTER` / `MESSAGE` / `LICENSE`
- 常用 PARAMETER：`temperature` / `top_p` / `top_k` / `num_ctx` / `num_predict` / `stop` / `seed` / `repeat_penalty`
- 自定义模型：`ollama create mybot -f Modelfile` → `ollama run mybot`
- 多模态：`ollama run llava`（图生文）/ `ollama run llama3.2-vision`
- 分享模型：`ollama push &lt;user&gt;/<model>` / `ollama pull &lt;user&gt;/<model>`
- 环境变量：`OLLAMA_HOST` / `OLLAMA_PORT` / `OLLAMA_MODELS`（模型目录）/ `OLLAMA_ORIGINS`（CORS）

## Ollama 是什么

Ollama 是一个**本地 LLM 运行时**——把「下载模型 → 量化 → 加载到内存 → 推理 → 暴露 API」这一整套，简化成几个 `ollama` 子命令。它的定位与 vLLM / LM Studio 形成清晰对照：

| 维度 | Ollama | vLLM | LM Studio | llama.cpp（裸）|
|---|---|---|---|---|
| 目标场景 | **本地/边缘运行** | 数据中心高吞吐服务 | 本地 GUI 体验 | 极客底层 |
| 硬件 | 全平台通吃 | NVIDIA/AMD 数据中心 GPU | 全平台（GUI） | 全平台（CLI）|
| 模型格式 | **GGUF** | safetensors/PyTorch | GGUF | GGUF |
| 易用性 | **CLI 一行起** | 需配置 | 最易（GUI） | 需编译 |
| API | OpenAI 兼容 (:11434) | OpenAI 兼容 (:8000) | OpenAI 兼容 | 需 server 模式 |
| 高并发 | 弱（单机为主） | **强** | 弱 | 弱 |
| Modelfile | **有**（声明式） | 无 | 无 | 无 |
| 多卡 TP | 弱 | 强 | 弱 | 中 |

**核心结论**：Ollama = 「**GGUF + llama.cpp + Docker 式 CLI + OpenAI API**」，本地/边缘/开发调试首选；高并发生产服务请用 vLLM。

## 安装

### macOS / Windows

官网 <https://ollama.com/download> 下载安装包，双击安装。装完 `ollama` 命令在 PATH 中。

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

脚本会自动检测发行版、安装二进制、注册 systemd 服务（`ollama.service`）。

### Docker

```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

### 验证安装

```bash
ollama --version
# ollama version is 0.x.x
```

## 第一个模型

```bash
# 下载并运行（首次会拉模型，约 2-5GB）
ollama run llama3.2
>>> 你好，介绍一下你自己
>>> /?                  # 查看命令
>>> /bye                # 退出
```

`ollama run` = `ollama pull` + 启动交互式 REPL。首次拉取后模型缓存在本地（默认 `~/.ollama/models`），之后再 run 直接进对话。

### 指定量化 tag

ollama registry 一个模型常有多个 tag（不同参数量、不同量化）：

```bash
ollama run llama3.2:1b        # 1B 参数版
ollama run llama3.2:3b        # 3B 参数版
ollama run qwen2.5:7b         # Qwen 2.5 7B
ollama run qwen2.5:7b-instruct-q4_K_M   # 指定量化
```

## 常用 CLI 命令

| 命令 | 用途 |
|---|---|
| `ollama run &lt;model&gt;` | 拉取并进入交互对话 |
| `ollama pull &lt;model&gt;` | 仅下载（不进对话） |
| `ollama push &lt;user&gt;/<model>` | 推送到 ollama registry |
| `ollama create &lt;name&gt; -f Modelfile` | 从 Modelfile 创建自定义模型 |
| `ollama list` | 列出本地已装模型 |
| `ollama ps` | 列出当前运行中的模型 |
| `ollama show &lt;model&gt;` | 显示模型详情（参数、模板、许可证） |
| `ollama rm &lt;model&gt;` | 删除本地模型 |
| `ollama cp &lt;src&gt; <dst>` | 复制模型 |
| `ollama serve` | 启动后台服务（监听 11434） |

## OpenAI 兼容 API

Ollama 后台默认监听 `http://localhost:11434`，提供 OpenAI 兼容端点：

```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": false
  }'
```

用 OpenAI Python SDK，只改 `base_url`：

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",   # 任意字符串即可，Ollama 不校验
)

resp = client.chat.completions.create(
    model="llama3.2",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)
```

### 原生 API（更全功能）

OpenAI 兼容端点是为兼容牺牲了部分功能。要用 Ollama 全部能力（keep_alive、raw 模式、自定义 options）用原生 `/api/*`：

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [{"role": "user", "content": "你好"}],
  "stream": false,
  "options": {
    "temperature": 0.8,
    "num_ctx": 4096
  }
}'
```

## Modelfile 创建自定义模型

Modelfile 是 Ollama 的核心——像 Dockerfile 一样声明式定义模型。

### 最小例子

```dockerfile
# Modelfile
FROM llama3.2

# 系统提示
SYSTEM """你是一个友善的中文助手，回答简洁。"""

# 采样参数
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
```

构建并运行：

```bash
ollama create mybot -f ./Modelfile
ollama run mybot
```

### 完整 Modelfile 指令

| 指令 | 必需 | 用途 |
|---|---|---|
| `FROM` | 是 | 基础模型（`llama3.2` 或 `./model.gguf` 本地路径） |
| `TEMPLATE` | 否 | chat template（Go template 语法，变量 `.System`/`.Prompt`/`.Response`） |
| `SYSTEM` | 否 | 默认 system message |
| `PARAMETER` | 否 | 采样 / 推理参数 |
| `ADAPTER` | 否 | LoRA/QLoRA adapter（`.gguf` 文件） |
| `MESSAGE` | 否 | few-shot 对话示例 |
| `LICENSE` | 否 | 模型许可证 |
| `TEMPLATE` 内 `.System` / `.Prompt` / `.Response` | - | template 变量 |

### 用本地 GGUF

```dockerfile
FROM ./my-model-q4_K_M.gguf
PARAMETER num_ctx 8192
```

`ollama create` 会自动处理 GGUF 元数据、配置 tokenizer 与默认 chat template（若 GGUF 内嵌了）。

## 多模态

跑视觉模型（llava、Llama 3.2 Vision）：

```bash
ollama run llava
>>> 这张图里有什么？/path/to/image.jpg
```

API 调用时把图片用 base64 或 URL 传入 `images` 字段：

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2-vision",
  "messages": [{"role": "user", "content": "描述这张图", "images": ["<base64>"]}]
}'
```

## 工具调用（Function Calling）

支持 OpenAI 风格 tools（部分模型支持，如 Llama 3.1+）：

```python
resp = client.chat.completions.create(
    model="llama3.1",
    messages=[{"role": "user", "content": "北京天气怎么样？"}],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "parameters": {"type": "object", "properties": {"city": {"type": "string"}}}
        }
    }]
)
print(resp.choices[0].message.tool_calls)
```

## 与生态集成

| 工具 | 集成方式 |
|---|---|
| LangChain | `ChatOllama` / `OllamaEmbeddings` |
| LlamaIndex | `Ollama` LLM / embedding |
| Open WebUI | 默认后端（最流行的 Ollama GUI） |
| Dify / FastGPT | 本地模型选项 |
| Continue.dev | VS Code 本地补全 |
| Cursor / Cline | 配 base_url 接本地 |

## 下一步

入门到此——你已经能跑模型、调 API、自定义 Modelfile。下一章 `guide-line.md` 深入讲 **Modelfile 完整指令 / GGUF 量化级别 / 工具调用 / 结构化输出 / 性能调优 / 多卡 / 部署运维 / 与 vLLM/LM Studio 对比**等核心主题。
