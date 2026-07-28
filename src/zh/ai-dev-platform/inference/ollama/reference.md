---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Ollama 官方文档编写 —— CLI 命令 / Modelfile 指令 / PARAMETER / API 端点 / 环境变量 / GGUF 量化 / 多模态

## CLI 命令全表

| 命令 | 用途 | 示例 |
|---|---|---|
| `ollama run &lt;model&gt;` | 拉取并进入交互对话 | `ollama run llama3.2` |
| `ollama pull &lt;model&gt;` | 仅下载模型 | `ollama pull qwen2.5:7b` |
| `ollama push &lt;user&gt;/<model>` | 推送到 registry | `ollama push myuser/mybot` |
| `ollama create &lt;name&gt; -f <file>` | 从 Modelfile 创建 | `ollama create mybot -f Modelfile` |
| `ollama list` | 列出本地模型 | `ollama list` |
| `ollama ps` | 列出运行中模型 | `ollama ps` |
| `ollama show &lt;model&gt;` | 显示模型详情 | `ollama show llama3.2` |
| `ollama rm &lt;model&gt;` | 删除模型 | `ollama rm llama3.2` |
| `ollama cp &lt;src&gt; <dst>` | 复制模型 | `ollama cp llama3.2 myllama` |
| `ollama serve` | 启动后台服务 | `ollama serve` |
| `ollama --version` | 显示版本 | `ollama --version` |

### `ollama show` 子命令

| 子命令 | 用途 |
|---|---|
| `ollama show &lt;model&gt;` | 显示完整信息 |
| `ollama show &lt;model&gt; --info` | 模型元信息（架构、参数量、量化）|
| `ollama show &lt;model&gt; --license` | 许可证 |
| `ollama show &lt;model&gt; --modelfile` | 导出 Modelfile |
| `ollama show &lt;model&gt; --parameters` | 默认参数 |
| `ollama show &lt;model&gt; --template` | chat template |
| `ollama show &lt;model&gt; --system` | 默认 system message |

### `ollama run` 交互命令

| 命令 | 用途 |
|---|---|
| `/?` | 显示帮助 |
| `/bye` | 退出 |
| `/show info` | 显示模型信息 |
| `/show license` | 显示许可证 |
| `/show modelfile` | 显示 Modelfile |
| `/show system` | 显示 system message |
| `/show stats` | 显示 token 统计 |
| `/set system &lt;text&gt;` | 设新 system message |
| `/set parameter &lt;name&gt; <value>` | 改参数 |
| `/save &lt;name&gt;` | 保存当前会话为新模型 |
| `/clear` | 清空对话历史 |
| `/load &lt;model&gt;` | 加载另一模型 |
| `/list` | 列出已加载模型 |
| `/help` | 帮助 |
| `"""&lt;text&gt;"""` | 多行输入 |

## Modelfile 指令全表

| 指令 | 必需 | 语法 | 说明 |
|---|---|---|---|
| `FROM` | 是 | `FROM &lt;model&gt;` 或 `FROM ./&lt;file&gt;.gguf` | 基础模型 |
| `TEMPLATE` | 否 | `TEMPLATE """&lt;go template&gt;"""` | chat template |
| `SYSTEM` | 否 | `SYSTEM """&lt;text&gt;"""` | 默认 system message |
| `PARAMETER` | 否 | `PARAMETER &lt;name&gt; <value>` | 推理参数 |
| `ADAPTER` | 否 | `ADAPTER ./&lt;file&gt;.gguf` | LoRA adapter |
| `MESSAGE` | 否 | `MESSAGE &lt;role&gt; <content>` | few-shot 示例 |
| `LICENSE` | 否 | `LICENSE """&lt;text&gt;"""` | 许可证 |

### TEMPLATE 变量

| 变量 | 含义 |
|---|---|
| <code v-pre>{{ .System }}</code> | system message |
| <code v-pre>{{ .Prompt }}</code> | user 输入 |
| <code v-pre>{{ .Response }}</code> | 模型响应（生成时其后截断） |

### MESSAGE 角色

| 角色 | 用途 |
|---|---|
| `system` | 系统提示（与 SYSTEM 指令等价）|
| `user` | 用户消息 |
| `assistant` | 助手消息 |

## PARAMETER 全表

| 参数 | 默认 | 类型 | 说明 |
|---|---|---|---|
| `mirostat` | 0 | int | Mirostat 模式（0/1/2）|
| `mirostat_eta` | 0.1 | float | 学习率 |
| `mirostat_tau` | 5.0 | float | 目标熵 |
| `num_ctx` | 2048 | int | 上下文窗口 |
| `num_predict` | -1 | int | 最大生成长度（-1 无限）|
| `repeat_last_n` | 64 | int | 重复惩罚窗口 |
| `repeat_penalty` | 1.1 | float | 重复惩罚系数 |
| `seed` | -1 | int | 随机种子 |
| `stop` | [] | string[] | 停止字符串 |
| `temperature` | 0.8 | float | 温度 |
| `tfs_z` | 1.0 | float | Tail-free sampling |
| `top_k` | 40 | int | Top-K |
| `top_p` | 0.9 | float | Top-P |
| `min_p` | 0.0 | float | Min-P |
| `num_keep` | 0 | int | prompt 保留 token |
| `num_thread` | auto | int | CPU 线程数 |
| `num_gpu` | auto | int | GPU offload 层数 |

## API 端点全表

### OpenAI 兼容端点（`/v1/*`）

| 端点 | 方法 | 用途 |
|---|---|---|
| `/v1/models` | GET | 列出模型 |
| `/v1/chat/completions` | POST | 对话补全 |
| `/v1/completions` | POST | 文本补全 |
| `/v1/embeddings` | POST | 向量 |
| `/v1/files` | POST | 上传文件 |

### 原生端点（`/api/*`）

| 端点 | 方法 | 用途 |
|---|---|---|
| `/api/generate` | POST | 文本生成（基础模型）|
| `/api/chat` | POST | 对话生成 |
| `/api/embeddings` | POST | 向量（旧）|
| `/api/embed` | POST | 向量（新）|
| `/api/pull` | POST | 拉取模型 |
| `/api/push` | POST | 推送模型 |
| `/api/create` | POST | 创建模型 |
| `/api/copy` | POST | 复制模型 |
| `/api/delete` | DELETE | 删除模型 |
| `/api/show` | POST | 模型详情 |
| `/api/tags` | GET | 列出本地模型 |
| `/api/ps` | GET | 列出运行中模型 |
| `/api/version` | GET | 版本 |

### `/api/chat` 请求体

```json
{
  "model": "llama3.2",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "...", "images": ["<base64>"]}
  ],
  "stream": true,
  "format": "json",
  "options": {
    "temperature": 0.7,
    "num_ctx": 4096,
    "seed": 42,
    "stop": ["</answer>"]
  },
  "tools": [...],
  "keep_alive": "5m"
}
```

### 响应字段

```json
{
  "model": "llama3.2",
  "created_at": "2025-07-28T...",
  "message": {"role": "assistant", "content": "..."},
  "done": true,
  "done_reason": "stop",
  "total_duration": 1234567890,
  "load_duration": 1234567,
  "prompt_eval_count": 42,
  "prompt_eval_duration": 987654,
  "eval_count": 128,
  "eval_duration": 876543210
}
```

## 环境变量全表

| 变量 | 默认 | 说明 |
|---|---|---|
| `OLLAMA_HOST` | 127.0.0.1 | 监听地址 |
| `OLLAMA_PORT` | 11434 | 监听端口（用 `OLLAMA_HOST=0.0.0.0:9000` 一起设）|
| `OLLAMA_ORIGINS` | localhost | CORS 允许来源（`*` 全开）|
| `OLLAMA_MODELS` | `~/.ollama/models` | 模型存储目录 |
| `OLLAMA_KEEP_ALIVE` | 5m | 默认模型驻留时间 |
| `OLLAMA_NUM_PARALLEL` | 视内存 | 并发请求数 |
| `OLLAMA_MAX_LOADED_MODELS` | 视内存 | 最大同时加载模型数 |
| `OLLAMA_MAX_QUEUE` | 512 | 请求队列长度 |
| `OLLAMA_DEBUG` | 0 | 调试日志 |
| `OLLAMA_FLASH_ATTENTION` | 0 | 启用 flash attention |
| `OLLAMA_KV_CACHE_TYPE` | f16 | KV Cache 精度（f16/q8_0/q4_0）|
| `OLLAMA_LLM_LIBRARY` | auto | 强制指定计算库 |
| `CUDA_VISIBLE_DEVICES` | 全部 | GPU 可见性 |
| `HIP_VISIBLE_DEVICES` | 全部 | AMD GPU 可见性 |

## GGUF 量化级别速查

| 量化 | 7B 体积 | 精度 | 速度 | 备注 |
|---|---|---|---|---|
| Q8_0 | ~7 GB | 几乎无损 | 快 | 内存充足首选 |
| Q6_K | ~5.5 GB | 极小 | 快 | 高质量 |
| Q5_K_M | ~4.8 GB | 很小 | 快 | 推荐 |
| Q4_K_M | ~4.1 GB | 小 | 快 | **默认/最常用** |
| Q4_0 | ~3.8 GB | 中 | 最快 | 老格式 |
| Q3_K_M | ~3.3 GB | 明显 | 快 | 内存吃紧 |
| Q2_K | ~2.7 GB | 较大 | 快 | 极限压缩 |
| F16 | ~13 GB | 无损 | 中 | 未量化 |

## 硬件支持

| 平台 | 计算后端 | 备注 |
|---|---|---|
| macOS (Apple Silicon) | **Metal** | M1/M2/M3/M4 原生加速，最佳体验 |
| macOS (Intel) | CPU | 仅 CPU |
| Linux + NVIDIA | **CUDA** | 自动检测 |
| Linux + AMD | ROCm / Vulkan | |
| Windows + NVIDIA | CUDA | |
| Windows + AMD/DirectML | DirectX | |
| 任意 + CPU | CPU | 全平台兜底 |

## 官方推荐模型（2025.07）

| 模型 | 命令 | 参数量 | 适合 |
|---|---|---|---|
| Llama 3.2 | `ollama run llama3.2` | 1B/3B | 通用对话 |
| Qwen2.5 | `ollama run qwen2.5` | 0.5B-72B | 中英文 / 代码 |
| DeepSeek-R1 | `ollama run deepseek-r1` | 1.5B-671B | 推理 |
| Gemma 3 | `ollama run gemma3` | 1B-27B | 通用 |
| Mistral | `ollama run mistral` | 7B | 通用 |
| Phi-4 | `ollama run phi4` | 14B | 小而强 |
| CodeLlama | `ollama run codellama` | 7B-70B | 代码 |
| Llava | `ollama run llava` | 7B-13B | 多模态 |
| nomic-embed-text | `ollama run nomic-embed-text` | 137M | embedding |
| llama3.2-vision | `ollama run llama3.2-vision` | 11B/90B | 多模态 |

## 参考

- 官方文档：<https://ollama.readthedocs.io/>
- 官网 / 模型库：<https://ollama.com/>
- Modelfile：<https://ollama.readthedocs.io/en/modelfile/>
- API：<https://ollama.readthedocs.io/api/>
- GitHub：<https://github.com/ollama/ollama>
- llama.cpp（GGUF 格式来源）：<https://github.com/ggerganov/llama.cpp>
