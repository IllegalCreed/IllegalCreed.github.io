---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 GitHub Copilot（docs.github.com/copilot，2026）、Continue（docs.continue.dev）、Tabby（tabbyml.com/docs，Apache 2.0）官方文档编写

## 速查

- **补全模式核心**：幽灵文本预测，Tab 接受；Copilot NES 跨位置预测下一处编辑；适合样板代码与短函数
- **Chat 模式核心**：自然语言问答 + 上下文参与者（@workspace / #file），适合解释、重构、生成测试骨架
- **Agent 模式核心**：自主多文件规划 + 执行 + 迭代；Copilot coding agent 把 Issue→PR 链路自动化
- **Copilot 私有化能力弱**：代码上云推理；合规场景需 Continue/Tabby
- **Continue 选型自由**：config.yaml 一个文件切 chat/edit/autocomplete 三角色到不同 provider，含本地 Ollama
- **Tabby 自托管要点**：Docker/Helm 部署，开源模型（StarCoder/Qwen2.5-Coder），代码不出内网
- **模型选型经验**：补全用小快模型（Qwen2.5-Coder-1.5B/7B、Codestral）；Chat/Agent 用大模型（Claude/GPT）
- **Agent 约束**：必须配沙箱、测试门禁、人工评审，防止多文件回归
- **避坑**：幻觉 API 必查官方文档；接受补全前读全代码；Agent PR 不能直接合
- **选型矩阵**：省心→Copilot；自由/本地→Continue；不出域→Tabby

## 三种模式深入对比

### 补全 vs Chat vs Agent

| 维度 | 补全（Completion） | Chat | Agent |
|---|---|---|---|
| 触发 | 打字时自动 | 主动提问 | 指派任务后自主 |
| 范围 | 当前光标 / 文件 | 单轮或多轮对话 | 跨多文件 + 执行命令 |
| 自主权 | 极低（只建议） | 中（给方案） | 高（改码 + 跑命令） |
| 延迟 | 毫秒到秒 | 秒级 | 分钟级（多轮迭代） |
| 适合 | 重复代码、补全签名 | 解释、重构方案、单点生成 | 整功能、bug 修复、迁移 |
| 风险 | 幻觉 API | 方案偏差 | 多文件回归、失控 |

### 何时用哪种

```text
补全：写样板（getter/setter、SQL、JSON、测试骨架）、记不清的 API 签名
Chat ：读陌生代码要解释、想重构但要方案、生成单函数 / 正则 / 文档
Agent：明确边界的小到中等任务（修 bug、加错误处理、依赖升级、迁移 API）
       不要用 Agent 做「重写整个模块」这种宽泛、难验收的任务
```

## Copilot coding agent 工作流

### Issue → PR 自动化

1. 开 GitHub Issue 描述任务（含复现步骤 / 期望行为）
2. 在 Issue 评论 `@github-copilot ...` 或把 assignee 设为 Copilot
3. Copilot 克隆仓库、开新分支（如 `copilot/fix-date-bug`）
4. 自主规划 → 改码 → 跑测试 → 迭代修复失败用例
5. 开 PR，描述改动 + 测试结果，等人工评审
6. 人工 review + CI 通过后才合并

### Agent 约束最佳实践

- **沙箱执行**：Agent 跑命令在隔离环境，避免破坏主机
- **测试门禁**：PR 必须 CI 全绿才能合，用测试兜底 Agent 的回归
- **人工评审**：Agent PR 不能自动合，必须人审代码 + 测试结果
- **任务边界清晰**：Issue 写清「改哪个文件、什么行为、怎么验证」，越具体越靠谱

## Continue 多模型路由

### 一份 config.yaml 跑三类功能

```yaml
models:
  # Chat/Edit 用强模型
  - name: Claude
    provider: anthropic
    model: claude-sonnet-4-5
    roles: [chat, edit]

  # Autocomplete 用小快模型（本地，零延迟零成本）
  - name: 本地 Qwen 补全
    provider: ollama
    model: qwen2.5-coder:1.5b
    apiBase: http://localhost:11434
    roles: [autocomplete]
```

路由逻辑：Continue 按 `roles` 把 chat 请求发 Claude、补全请求发本地 Ollama，一份配置管三种功能、多 provider。这是 Continue 相对 Copilot 的核心差异——Copilot 的模型选择受订阅档位限制，Continue 完全开放。

### 本地 vs 云端权衡

| 维度 | 本地（Ollama/Tabby 模型） | 云端（Anthropic/OpenAI） |
|---|---|---|
| 延迟 | 低（局域网 / 本机） | 中（公网往返） |
| 成本 | 硬件一次投入，推理零边际 | 按 token 计费 |
| 质量 | 开源模型弱于旗舰 | 旗舰最强 |
| 合规 | 代码不出域 | 代码出域 |
| 经验 | 补全用本地够用，Chat/Agent 上云质量更好 | 默认选云 |

## Tabby 部署运维

### Docker（单机）

```bash
docker run -d --gpus all --name tabby \
  -p 8080:8080 \
  -v ~/.tabby:/data \
  --restart unless-stopped \
  tabbyml/tabby serve --model Qwen2.5-Coder-7B --device cuda
```

### Helm（Kubernetes，团队共享）

```bash
helm repo add tabby https://tabbyml.github.io/tabby
helm repo update
helm install tabby tabby/tabby \
  --set image.tag=latest \
  --set service.type=ClusterIP
```

团队共用一个 Tabby server，IDE 扩展指向 server 地址，补全走内网、代码不出公司。

### 模型选型

| 模型 | 显存需求 | 适合 |
|---|---|---|
| Qwen2.5-Coder-1.5B | ~4GB | CPU 也能跑，实时补全 |
| Qwen2.5-Coder-7B | ~8-10GB GPU | 主流补全，质量/速度平衡 |
| StarCoder2-7B | ~10GB GPU | 多语言补全 |
| Qwen2.5-Coder-32B | ~24GB+ GPU | 较强推理，需高端卡 |

经验：补全场景优先 1.5B-7B 求速度；Chat 场景才上 32B+。

## 三工具横向对比

| 维度 | GitHub Copilot | Continue | Tabby |
|---|---|---|---|
| 开源 | 闭源 | 开源（Apache 2.0） | 开源（Apache 2.0） |
| 部署 | SaaS 云端 | IDE 扩展 + 任意 provider | 自托管 server |
| 模型 | GPT/Claude/Gemini 等（受档位限） | 任意（含本地 Ollama） | StarCoder/Qwen2.5-Coder 等开源 |
| 代码出域 | 是（云端推理） | 可选（本地即不出域） | 否（全内网） |
| 定价 | 订阅（$10-$100 个人，$19/$39 团队） | 按用的 provider 计费 | 免费 + GPU 硬件成本 |
| Agent | coding agent（Issue→PR） | Agent 模式 + MCP | 偏补全/Chat，Agent 弱 |
| IDE | VS Code / JetBrains / Vim | VS Code / JetBrains | VS Code / JetBrains / Vim |
| 适合 | 省心、生态深、订阅团队 | 想自由选模型 / 本地推理 | 强合规、代码不出域、自托管 |

### 选型决策

```text
想最省心、深度集成 GitHub → Copilot
想自由切换模型 / 本地推理 / 不锁定厂商 → Continue
代码不能出域（金融/医疗/涉密） → Tabby
想混合：Copilot 做主力 + Continue 本地补全 → 可并存
```

## 通用最佳实践

- **接受前读全**：幽灵文本别盲 Tab，读完整段再接受，幻觉 API 当场识别
- **写好注释 / 上下文**：补全质量随注释与上下文质量提升，写清意图（如 `// 校验邮箱并去重`）
- **Agent 任务要可验收**：Issue 给出测试方法，让 Agent 有明确终止条件
- **定期复核测试**：AI 生成的测试可能测错东西，不能只看覆盖率
- **敏感代码隔离**：密钥、涉密逻辑用 `.copilotignore` / Continue 排除 / Tabby 限定仓库
