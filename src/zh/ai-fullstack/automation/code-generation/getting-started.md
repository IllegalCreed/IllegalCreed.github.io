---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 GitHub Copilot（docs.github.com/copilot，2026）、Continue（docs.continue.dev）、Tabby（tabbyml.com/docs，Apache 2.0）官方文档编写

## 速查

- **三模式**：补全（幽灵文本 ghost text，Tab 接受）/ Chat（侧边栏 + 内联聊天）/ Agent（自主多文件任务）
- **Copilot 安装**：VS Code / JetBrains 扩展商店搜 "GitHub Copilot"，登录 GitHub 账号即可
- **Copilot 订阅**：Free / Pro $10 / Pro+ $39 / Max $100（个人，每月）、Business $19 / Enterprise $39（每席位每月）
- **Copilot CLI**：`gh extension install github/gh-copilot`，`gh copilot suggest "查最近修改的文件"`、`gh copilot explain "tar -xvf"`
- **Copilot coding agent**：在 GitHub Issue 评论里 `@github-copilot` 或指派 Copilot，自动开分支、改码、开 PR
- **Copilot Chat 上下文**：`@workspace`（整仓库）/ `#file`（指定文件）/ `#codebase` 等参与者（participants）
- **Continue 安装**：VS Code / JetBrains 扩展商店搜 "Continue"，开源（Apache 2.0）
- **Continue 配置**：`~/.continue/config.yaml`，`models` 数组按 `roles`（chat/edit/autocomplete）分配，`provider` 指定来源
- **Tabby 部署**：`docker run -v ~/.tabby:/data tabbyml/tabby serve --model Qwen2.5-Coder-7B`，或 Helm 上 K8s
- **Tabby 配置**：`~/.tabby/tabby.yml` 声明 `model` / `device` / 端口
- **Tabby IDE**：VS Code、JetBrains、Vim 装扩展指向 Tabby server 地址
- **选型一句话**：要省心选 Copilot；要自由选模型 / 本地推理选 Continue；代码不能出域选 Tabby

## GitHub Copilot 快速上手

### 安装扩展

VS Code：扩展商店搜 **GitHub Copilot** + **GitHub Copilot Chat**，安装后用 GitHub 账号登录并授权（订阅生效即可用）。JetBrains：Settings → Plugins 搜 GitHub Copilot。

### 三种模式

```text
1. 补全（Completion / ghost text）
   边打字边出灰色幽灵文本，Tab 接受，Esc 拒绝
   进阶：NES（Next Edit Suggestions）预测「下一处该改的地方」并跳转

2. Chat（Copilot Chat）
   - 侧边栏 Chat 视图：自由对话
   - 内联聊天：Cmd+I（Mac）/ Ctrl+I（Win）选中代码提问
   - 快速聊天：Cmd+Shift+I
   上下文参与者：@workspace（全仓库）/ @terminal（终端）/ @github

3. Agent（coding agent / agent mode）
   - 编辑器内 agent mode：自主规划、改多文件、跑命令、迭代修复
   - GitHub coding agent：Issue 里 @github-copilot，自动开分支 + PR
```

### Copilot CLI

```bash
gh extension install github/gh-copilot       # 装 CLI 扩展
gh copilot suggest "列出最近 7 天修改的文件"   # 自然语言 → shell 命令
gh copilot explain "find . -name '*.log' -mtime +30 -delete"  # 解释命令
gh copilot suggest -t git "撤销最近一次提交但保留改动"
```

输出建议命令并附简短解释，可交互调整后复制执行。

### Copilot coding agent

在 GitHub 仓库 Issue 里：

```text
@github-copilot 帮我把 utils/date.ts 里的时区 bug 修了，参考 #123 的复现步骤
```

或把 Issue assignee 设为 Copilot。agent 会自动：克隆仓库 → 开新分支 → 改码 → 跑测试 → 开 PR，并在 PR 里说明改动，等人工评审合并。

## Continue 快速上手

### 安装 + 首次配置

VS Code / JetBrains 扩展商店搜 **Continue**，安装。打开 Continue 侧边栏 → 点齿轮图标编辑 `~/.continue/config.yaml`。

### config.yaml 示例（自定义模型）

```yaml
# ~/.continue/config.yaml
models:
  - name: Claude Sonnet
    provider: anthropic
    model: claude-sonnet-4-5
    apiKey: "{{ env.ANTHROPIC_API_KEY }}"
    roles:
      - chat
      - edit

  - name: Qwen 本地补全
    provider: ollama
    model: qwen2.5-coder:7b
    apiBase: http://localhost:11434
    roles:
      - autocomplete

  - name: GPT 备用
    provider: openai
    model: gpt-4o
    apiKey: "{{ env.OPENAI_API_KEY }}"
    roles:
      - chat

config:
  - description: 始终用 TypeScript，回答附最小可运行示例
    auto_apply: always

mcpJson:
  - name: filesystem
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
```

关键点：每个 model 用 `roles` 决定它服务 chat / edit / autocomplete 哪几个功能；`provider` 取值含 `anthropic` / `openai` / `ollama` / `mistral` / `azure` 等；`mcpJson` 给 Agent 挂 MCP 工具。

### 本地推理（Ollama）

```bash
ollama pull qwen2.5-coder:7b
ollama serve              # 默认 http://localhost:11434
```

config.yaml 把 autocomplete 的 `provider` 设为 `ollama`，补全走本地、不联网、代码不出域。

## Tabby 快速上手

### Docker 部署

```bash
docker run -it --gpus all \
  -p 8080:8080 \
  -v ~/.tabby:/data \
  tabbyml/tabby serve \
    --model Qwen2.5-Coder-7B \
    --device cuda
```

首次启动自动从 Hugging Face 下载模型权重到 `~/.tabby`，之后启动秒级。访问 `http://localhost:8080` 看 Web UI。

### tabby.yml 配置

```yaml
# ~/.tabby/tabby.yml
server:
  host: 0.0.0.0
  port: 8080

model:
  - id: Qwen2.5-Coder-7B
    device: cuda
```

也可不改 yml，直接用 CLI flag（`--model` / `--device cuda` / `--host`）。

### IDE 扩展

VS Code / JetBrains 扩展商店搜 **Tabby**，装后在设置里填 `http://<tabby-host>:8080`，扩展会自动拉取 server 上的补全模型。代码补全请求都打到内网 Tabby server，不出域。

## 下一步

- 三种模式深入对比 / Copilot coding agent 工作流 / Continue 多模型路由 / Tabby K8s 部署见 [指南](./guide-line.md)
- Copilot 订阅全档位 / CLI 命令全表 / config.yaml 全字段 / tabby.yml 字段见 [参考](./reference.md)
