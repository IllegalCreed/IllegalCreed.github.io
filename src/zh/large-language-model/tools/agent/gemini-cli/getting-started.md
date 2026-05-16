---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Gemini CLI 0.42+（2026 年 5 月版本）编写。

## 安装

最直接的方式是 npm 全局装：

```bash
# npm 全局装（最常用）
npm install -g @google/gemini-cli

# 或不安装直接试用（npx 拉取最新版）
npx https://github.com/google-gemini/gemini-cli

# 或 macOS brew
brew install gemini-cli

# 或 MacPorts
sudo port install gemini-cli

# Conda（受限环境）
conda create -y -n gemini_env -c conda-forge nodejs
conda activate gemini_env
npm install -g @google/gemini-cli
```

对 Node.js 版本有硬性要求：**Node 20.0.0+**（22 LTS 推荐）。

```bash
gemini --version
# 0.42.x

gemini -h
# 列出全部 flag
```

::: tip Docker / 沙箱镜像

官方提供完整沙箱镜像，可直接拉取：

```bash
docker run --rm -it \
  us-docker.pkg.dev/gemini-code-dev/gemini-cli/sandbox:0.42.0
```

CLI 默认可挂 `--sandbox` flag 让所有 tool 在 Docker / Podman 内隔离执行。

:::

## 认证：四选一

首次启动 `gemini` 会弹出认证向导，主要四种方式：

| 方式 | 适合 | 免费额度 |
| --- | --- | --- |
| **Google OAuth 登录**（个人账号） | 个人 + 大多数场景 | **60 RPM + 1000 RPD**（含 Gemini 3 Pro + 1M 上下文） |
| **Gemini API Key**（AI Studio） | 脚本 / CI / 不想 OAuth | 1000 RPD（免费） |
| **Vertex AI**（GCP 企业） | 企业 + 团队 | 走 GCP 账单 |
| **Workspace 账号**（公司 / 学校） | 组织内部 | 需配 GCP project |

### 1. Google OAuth（推荐）

```bash
gemini
# 首次：浏览器自动跳 Google 授权页
# 登录后凭据写入 ~/.gemini/credentials/
```

::: tip 业界最慷慨免费额度

OAuth 个人账号 **60 RPM + 1000 RPD** 涵盖 **Gemini 3 Pro + 1M token 上下文**，几乎无需付费即可日常使用。对比：

- Claude Code：无免费额度（按订阅 / token 计费）
- Codex：无免费额度
- Gemini CLI：1000 次 / 天，免费

:::

### 2. Gemini API Key

```bash
# AI Studio 申请 key：https://aistudio.google.com/apikey
export GEMINI_API_KEY="YOUR_API_KEY"
gemini
```

适合不希望浏览器 OAuth 的场景（CI / 远程服务器）。免费额度 1000 RPD。

### 3. Vertex AI（企业）

```bash
export GOOGLE_GENAI_USE_VERTEXAI=true
export GOOGLE_CLOUD_PROJECT="my-gcp-project"
export GOOGLE_CLOUD_LOCATION="us-central1"
# 用 gcloud ADC（Application Default Credentials）
gcloud auth application-default login

gemini
```

走 Vertex AI 端点，配额按 GCP 项目配置，可大批量调用。

### 4. Workspace / 学校 账号

Workspace（如 `*@company.com` Google 账号）必须先建 GCP Project：

```bash
# 在 GCP Console 建 project
export GOOGLE_CLOUD_PROJECT="<project-id>"
gemini  # OAuth 登录绑定
```

## 第一次对话

进入项目目录直接跑 `gemini`：

```bash
cd ~/projects/my-app
gemini
```

界面进入交互模式：

```
╭──────────────────────────────────────╮
│  Gemini CLI  v0.42.0                 │
│  cwd: ~/projects/my-app              │
│  model: gemini-3-pro-preview (auto)  │
│  context: 0 / 1,048,576 tokens       │
╰──────────────────────────────────────╯

> 帮我看看 src/index.ts 文件里的 main 函数
```

Gemini 会：

1. 调 `read_file` 读 `src/index.ts`
2. 分析代码后回复说明
3. 全部 tool 调用 + 结果留在屏幕，方便审查

::: tip 权限审批模式

首次每个写操作（write_file / replace / shell）都会询问。CLI 提供四种 approval mode：

- `default`：每个写操作都询问
- `auto_edit`：自动接受文件编辑，仅 shell 询问
- `yolo`：全部自动（**仅本地受信任沙箱用**）
- `plan`：仅读不写（规划阶段）

按 `Shift+Tab` 在模式间循环。也可启动时 `--approval-mode=auto_edit` 指定。

:::

## 退出 / 暂停

| 操作 | 快捷键 / 命令 |
| --- | --- |
| 退出 | `Ctrl+C` 两次 / `/quit` |
| 清空当前显示 | `Ctrl+L` / `/clear` |
| 压缩对话历史 | `/compress`（生成总结后释放 token） |
| 恢复上次会话 | `gemini --resume` / `gemini -r latest` |
| 浏览历史会话 | `/chat`（或 `/resume`） |

## 项目级配置：`GEMINI.md`

Gemini CLI 启动时**自动读多个 `GEMINI.md` 文件**——这是给 Gemini 看的「项目说明书」，三级层次加载：

1. **全局**：`~/.gemini/GEMINI.md`（所有项目通用）
2. **项目根 + 上溯到 `.git` 或家目录**
3. **子目录**：访问哪个目录时按需加载（最多 200 个）

```md
# AI 开发指南

## 项目概述
本仓库是 Vue 3 + Vite + TS 的电商前台...

## 代码规范
- 注释用中文
- 组件 PascalCase
- 函数 JSDoc

## 常用命令
- `pnpm dev`：启动 dev server
- `pnpm test`：单元测试
- `pnpm lint:fix`：自动修复格式
```

每次启动 / `cd` 时 Gemini CLI 都会重新扫描。**这是教 Gemini 项目约定最有效的方式**。

```bash
# 看当前加载了哪些 GEMINI.md
/memory show

# 重新扫描（改了 GEMINI.md 后用）
/memory refresh
```

::: tip GEMINI.md 支持模块化 import

```md
# 主 GEMINI.md
本项目约定：

@docs/style-guide.md
@docs/architecture.md
```

引用语法 `@<path>` 把外部文件内容内嵌进来，可拆分大型 GEMINI.md。

:::

::: tip /init 自动生成 GEMINI.md

`/init` 让 Gemini 扫 README / package.json 等自动起草一份骨架 GEMINI.md，省去手写。

:::

## 常用 Slash 命令

在交互界面里输入 `/` 触发：

| 命令 | 作用 |
| --- | --- |
| `/help` | 显示所有 slash 命令 |
| `/auth` | 切换认证方式（OAuth / API key / Vertex） |
| `/model` | 查看 / 切换模型（Gemini 3 Pro / Flash / 2.5 Pro 等） |
| `/clear` | 清空终端显示 |
| `/compress` | 压缩对话上下文 |
| `/memory` | 管理 GEMINI.md（show / refresh） |
| `/tools` | 列出所有可用工具 |
| `/mcp` | 看 MCP server 状态 |
| `/extensions` | 装 / 看 / 卸 extension |
| `/skills` | 启用 / 禁用 agent skill |
| `/init` | 生成 GEMINI.md 骨架 |
| `/restore` | 列出 / 回滚 checkpoint |
| `/chat` | 浏览历史会话 |
| `/stats` | 看 token 用量 |
| `/plan <goal>` | 进入 Plan Mode |
| `/theme` | 切换主题 |
| `/editor` | 选编辑器（vim / code 等） |
| `/quit` | 退出 |

特殊语法：

- `@<path>`：把文件 / 目录内容注入到 prompt（git-aware，自动跳过 `node_modules/`、`.env` 等）
- `!<cmd>`：直接跑 shell 命令（无需 Gemini 中转）
- `!`（独占）：进入 / 退出 shell 模式（连续跑多条）

## 第一个真实任务

试一个端到端流程：

```
> 帮我加一个 GET /api/health 端点，返回 { status: 'ok', time: ISO 时间戳 }
```

Gemini 会：

1. **glob / grep_search** 查找当前路由文件结构
2. **read_file** 已有路由文件理解风格
3. **replace / write_file** 添加新端点
4. （视情况）**run_shell_command** 跑测试验证

每一步都在屏幕显示，可随时打断纠正。

::: tip 让 Gemini 自己测试

任务结束后追问：「跑一下 dev server 看 `/api/health` 是否返回正确」。Gemini 会启动 dev server 后台跑 + curl 验证 + 报告结果。

:::

## 下一步

熟悉基本对话后建议看：

- [指南](./guide-line) —— 模型路由 / Plan Mode / Skills / Hooks / MCP / Extensions 深入
- [参考](./reference) —— 所有 CLI flag / 设置项 / 环境变量 / 内置工具列表
- 官方扩展画廊：[geminicli.com/extensions](https://geminicli.com/extensions/browse/)
