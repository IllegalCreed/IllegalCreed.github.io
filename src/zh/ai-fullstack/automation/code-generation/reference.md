---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 GitHub Copilot（docs.github.com/copilot，2026）、Continue（docs.continue.dev）、Tabby（tabbyml.com/docs，Apache 2.0）官方文档编写 —— 订阅 / CLI 命令 / config.yaml 字段 / tabby.yml 字段 速查

## GitHub Copilot

### 订阅档位（2026）

| 档位 | 价格 | 定位 | 关键特性 |
|---|---|---|---|
| Copilot Free | $0 | 入门 | 有限额度，自动模型选择，含 agent / 内联 chat |
| Copilot Pro | $10/月 | 个人主力 | 月度 AI 额度，可选 Claude Sonnet 5 等多模型 |
| Copilot Pro+ | $39/月 | 个人高端 | 更高速率限制，含 Claude Opus 5 等旗舰 |
| Copilot Max | $100/月 | 重度个人 | 最高个人额度，优先新功能 |
| Copilot Business | $19/席位/月 | 团队 | 中央策略管理，云端 agent，多模型目录 |
| Copilot Enterprise | $39/席位/月 | 企业 | 需 Enterprise Cloud，更大额度池，优先更新 |

> 注：Copilot 当前不支持 GitHub Enterprise Server 本地部署，仅云。

### 三种模式

| 模式 | 触发 | 范围 | 备注 |
|---|---|---|---|
| 补全（Completion） | 打字自动 | 光标处 | 幽灵文本 Tab 接受；NES 预测下一处编辑 |
| Chat | 主动提问 | 对话 | 侧边栏 / 内联（Cmd+I）/ 快速（Cmd+Shift+I） |
| Agent | 指派任务 | 多文件 + 命令 | 编辑器 agent mode + GitHub coding agent |

### Copilot CLI（gh copilot）

安装：`gh extension install github/gh-copilot`

| 命令 | 用途 |
|---|---|
| `gh copilot suggest "<自然语言>"` | 自然语言 → shell 命令 |
| `gh copilot suggest -t git "<描述>"` | 指定主题（git / gh / shell）生成命令 |
| `gh copilot explain "<命令>"` | 解释 shell 命令含义 |
| `gh copilot ...` | 也支持作为终端 agent 处理仓库任务 |

`-t` 取值含 `gh` / `git` / `shell`。

### Chat 上下文参与者

| 参与者 | 含义 |
|---|---|
| `@workspace` | 整个仓库上下文 |
| `@terminal` | 终端输出 / 命令上下文 |
| `@github` | GitHub 仓库 / Issue / PR 上下文 |
| `#file:<路径>` | 指定文件 |
| `#codebase` | 代码库检索 |

### coding agent

- 触发：Issue 评论 `@github-copilot <任务>` 或 assignee = Copilot
- 流程：开分支 → 改码 → 跑测试 → 开 PR
- PR 描述含改动说明与测试结果，需人工评审合并

## Continue

### config.yaml 结构

```yaml
models:
  - name: <显示名>
    provider: <anthropic|openai|ollama|mistral|azure|...>
    model: <模型 ID>
    apiKey: "{{ env.KEY }}"          # 环境变量引用
    apiBase: <自定义 endpoint>        # 可选，本地推理用
    roles:
      - chat                         # 聊天
      - edit                         # 内联编辑
      - autocomplete                 # 补全
    defaultCompletionOptions: ...    # 可选

config:                              # 规则（Rules）
  - description: <规则文本>
    auto_apply: always|never

mcpJson:                             # MCP server，给 Agent 挂工具
  - name: <名字>
    command: <命令>
    args: [...]
    env: {...}

experimental:                        # 实验性功能开关
  ...
```

### model.roles 取值

| role | 用途 |
|---|---|
| `chat` | 侧边栏 / 内联聊天 |
| `edit` | 选中代码内联修改（Cmd+I） |
| `autocomplete` | 打字时幽灵文本补全 |

### provider 取值（常见）

| provider | 说明 |
|---|---|
| `anthropic` | Claude 系列 |
| `openai` | GPT 系列 |
| `ollama` | 本地 Ollama（apiBase 指向 localhost:11434） |
| `mistral` | Mistral / Codestral |
| `azure` | Azure OpenAI |
| `vllm` | 自托管 vLLM 推理 |
| `openai-compatible` | 任意 OpenAI 兼容 endpoint |

### 配置文件位置

- `~/.continue/config.yaml`（用户级，新格式）
- `config.json`（旧格式，已弃用，迁移到 yaml）

## Tabby

### tabby.yml 字段

```yaml
server:
  host: 0.0.0.0
  port: 8080

model:
  - id: Qwen2.5-Coder-7B       # HuggingFace 模型 ID
    device: cuda               # cuda / cpu / metal
    # 可选：量化、tensor parallel 等

# 可选：仓库索引（code intelligence）
repositories:
  - url: <git url>
```

也可不改 yml，用 CLI flag 覆盖。

### CLI 命令

| 命令 | 用途 |
|---|---|
| `tabby serve --model <id> --device cuda` | 启动 server |
| `tabby serve --host 0.0.0.0 --port 8080` | 指定监听 |
| `tabby --help` | 查全部子命令 |

### Docker / Helm

```bash
# Docker
docker run --gpus all -p 8080:8080 -v ~/.tabby:/data \
  tabbyml/tabby serve --model Qwen2.5-Coder-7B --device cuda

# Helm（K8s）
helm repo add tabby https://tabbyml.github.io/tabby
helm install tabby tabby/tabby
```

### 支持模型（开源）

| 模型 | 类型 |
|---|---|
| Qwen2.5-Coder（1.5B / 7B / 32B） | 主推，代码补全与生成 |
| StarCoder / StarCoder2 | 多语言补全 |
| CodeLlama | Meta 出品，补全 |
| DeepSeek-Coder | 推理较强 |

均从 Hugging Face Hub 拉取。

### IDE 扩展

- VS Code：扩展商店 "Tabby"
- JetBrains：Settings → Plugins "Tabby"
- Vim/Neovim：社区插件
- 配置：填 Tabby server 地址（如 `http://tabby.corp:8080`）

## 弃用提示

- **Sourcegraph Cody**：2025-07-23 sunset，Free/Pro 新注册 2025-06-25 关闭，被 **Amp**（Sourcegraph 新 agentic 助手）取代，本叶不再覆盖
- Continue 的 `config.json`：已弃用，迁移到 `config.yaml`

## 版本与生态

- Copilot：闭源 SaaS，跟随 GitHub 更新；CLI 仓库 github/gh-copilot
- Continue：开源 Apache 2.0，GitHub continuedev/continue；JS/TS 实现
- Tabby：开源 Apache 2.0，GitHub TabbyML/tabby；Rust 后端，支持消费级 GPU 与 tensor parallel
