---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 v0.app 2025–2026 现状编写

## 速查

- 默认栈：**Next.js + React + shadcn/ui + Tailwind CSS**，部署面向 Vercel
- 自有模型：`v0-1.5-md`(128K) / `v0-1.5-lg`(512K) / `v0-1.0-md`(128K, legacy)，均 **beta**
- **Model API**：`https://api.v0.dev/v1`，OpenAI 兼容，鉴权 `Authorization: Bearer $V0_API_KEY`
- **兼容性坑**：不支持 `temperature` / `max_tokens` / `top_p`，仅 `messages` / `model` / `stream` / `tools` / `tool_choice`
- **Platform API**：`v0-sdk` 包，做 dev tools（管 chat / 解析文件 / 跑 app / 操作 deployment）
- 部署：点 **Publish** 自动建 Vercel Project；预览继承 Development 环境变量
- GitHub：仓库即唯一真相源，自动建工作分支 + 每条消息一次 commit，Publish 时向 `main` 发 PR
- 计费：额度制（按 token 扣 credits），**Premium($20) 正 sunset**，金额一律以官方为准
- 竞品记忆点：**v0 = Vercel 生态 + shadcn/ui + 可调 API 的自有模型**

## 默认技术栈

v0 生成的代码紧贴 Vercel 生态，默认栈固定：

| 层级 | 技术 |
| --- | --- |
| 框架 | **Next.js** |
| UI 库 | **React + shadcn/ui** 组件 |
| 样式 | **Tailwind CSS** |
| 部署 | **Vercel** 基础设施 |

含义：因为生成物 = Next.js + shadcn/ui + Tailwind，所以 v0 输出可以**无缝接入 Vercel 项目**——这也是它区别于 bolt.new / Lovable 的关键护城河之一。

::: warning 生态锁定的另一面
默认且主要产出 Next.js，部署面向 Vercel。如果你的目标是 Vite / Astro / 非 Vercel 平台，v0 的适配会偏弱；选型时把这点纳入考量。
:::

## 自有模型与 Model API

v0 既是"对话式产品"，背后也有**自有模型**，且这些模型可经 **v0 Model API** 独立调用（OpenAI 兼容）。

### 模型清单

| 模型 ID | 上下文窗口 | 最大输出 | 定位 |
| --- | --- | --- | --- |
| `v0-1.5-md` | **128K** tokens | 约 32K（以官方为准） | 日常任务、UI 生成（medium，速度优先） |
| `v0-1.5-lg` | **512K** tokens | — | 高级思考 / 推理（large） |
| `v0-1.0-md` | **128K** tokens | 32K tokens | 旧版（legacy），仍可用 |

::: tip 版本与状态说明
`v0-1.5-md`(128K) 与 `v0-1.5-lg`(512K) 于 2025-06-09 以 **beta** 形式上线 Models API，文档上长期标 beta。`v0-1.5-md` 的"约 32K 输出"来自第三方聚合页，官方页未逐字确认——教学 / 生产时一律按"约 32K，以官方为准"处理。
:::

### 框架感知与自动修复

- **Framework-Aware Completions**：模型针对 **Next.js / Vercel 平台**优化，输出贴合当前最佳实践
- **Auto-fix / Quick Edit**：内建自动改错与快速编辑。配套的 `vercel-autofixer-01` 单独可达约 **86%** error-free，与基座模型组合后整套栈约 **94%** error-free

::: warning 基准数字注意
上述 error-free 百分比为**厂商自测的官方基准**，并非独立第三方评测；引用时注明出处与口径，不要当作中立结论。
:::

### Model API 调用（OpenAI 兼容）

```bash
curl https://api.v0.dev/v1/chat/completions \
  -H "Authorization: Bearer $V0_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "v0-1.5-md",
    "stream": true,
    "messages": [
      { "role": "user", "content": "用 Next.js 写一个登录表单组件" }
    ]
  }'
```

- **Base URL**：`https://api.v0.dev/v1`
- **端点**：`POST /v1/chat/completions`（OpenAI Chat Completions 格式）
- **鉴权**：Bearer Token，`Authorization: Bearer $V0_API_KEY`，环境变量惯例 `V0_API_KEY`
- **能力**：多模态（文本 + 图像，图像需 **base64**）、SSE 流式、工具 / 函数调用（`tools` / `tool_choice`）

::: warning OpenAI 兼容但参数受限（重要易错点）
虽然 OpenAI 兼容，但**参数子集受限**——`temperature` / `max_tokens` / `top_p` **不支持**，仅支持 `messages` / `model` / `stream` / `tools` / `tool_choice`。沿用 OpenAI 调用代码时必须删掉这几个参数，否则可能报错或被忽略。
:::

### 在第三方客户端里当模型用

因为 OpenAI 兼容，可在 **Cursor / Cline / liteLLM** 等任何 OpenAI 兼容客户端里直接用：

| 配置项 | 值 |
| --- | --- |
| Base URL | `https://api.v0.dev/v1` |
| Model ID | `v0-1.5-md`（或 `-lg` / `-1.0-md`） |
| API Key | 你的 `V0_API_KEY` |

::: tip 访问门槛
Model API 需**付费计划**（历史上为 Premium 或 Team）并开启 usage-based billing，配合 `V0_API_KEY` 使用。legacy `v0-1.0-md` 文档提及每天最多 200 条消息；1.5 系列的限速以官方为准。
:::

## Platform API（v0-sdk）

**v0 Platform API** 是面向"做 dev tools / 平台"的**基础设施 API**，与上面调模型的 Model API 完全不同。

```bash
pnpm add v0-sdk
```

它能做的事：

- 程序化管理 **chat**（创建、追加消息）
- **解析代码生成的文件**
- 在浏览器里**运行生成的 app**
- 操作 **project / deployment**

环境变量同样是 `V0_API_KEY`。子页见 `/docs/api/platform/overview` 与 `/docs/api/platform/quickstart`。

::: tip 怎么分辨我该用哪套
- 想"**调 v0 的模型**做补全 / 对话" → **Model API**（`api.v0.dev/v1`，OpenAI 兼容）
- 想"**基于 v0 搭自己的工具 / 平台**"（管理生成流程、操作部署） → **Platform API**（`v0-sdk`）

:::

## 集成体系

### Vercel 部署

点 **Publish** 即把某个 chat 部署到 Vercel：

- **首次部署自动创建对应的 Vercel Project**，之后更新该 project
- 预览窗口继承所连 Vercel project 的**环境变量（仅 Development 环境）**，构建期就能跑通真实集成
- "**v0 账号本质就是 Vercel 账号**"，共享团队 / 计费 / RBAC / 自定义域名

### GitHub

连接后**仓库即"唯一真相源"，v0 不另存代码副本**：

- 自动从 `main` 切工作分支（命名如 `v0/main-abc123`）
- **每条改代码的消息自动产生一次 commit**
- 点 Publish 则**从工作分支向 `main` 发 PR**

::: warning 不是双向实时同步
v0 读写 GitHub 而非维护独立副本，文档**未承诺**导入既有仓库的双向 sync。把它理解为"v0 通过 commit + PR 与你的仓库交互"，而非"两边实时镜像"。
:::

### 数据库与外部服务

| 接入方式 | 适用 |
| --- | --- |
| **Vercel Marketplace** | 数据库（**Supabase / Neon**）、支付等，集成暴露为 agent 可调用的"工具" |
| **MCP 服务器** | 超出 Marketplace 的服务，用 MCP 接入 |
| 内置 | **Snowflake**、**Slack**、预装 agent |

### AI 模型集成

v0 生成的 app 默认预接 **Vercel AI Gateway**（开箱即用调各家模型）：

- 也支持 **fal、Deep Infra、Grok(xAI)** 等 provider
- 或自填 **OpenAI** 等 API key（走环境变量）

### Sandbox 与权限

所有 agent 动作都在**隔离 sandbox** 里执行，终端命令有三档权限：

| 档位 | 行为 |
| --- | --- |
| **Ask** | 每条命令都询问 |
| **Auto** | 自动执行常规命令 |
| **Full** | 全自动 |

可随时打断 agent。

## 计费与额度

::: warning 金额一律以官方为准
v0 采用**额度制（credit）**：每个计划含每月 credit，AI 生成按 **token**（input + output）从余额扣费，额度用尽则生成暂停。金额 / 额度功能性强、变动频繁，**务必以 [v0 官方定价页](https://v0.app/pricing) 为准**。
:::

| 计划 | 价格 | 含月度额度 | 关键能力 |
| --- | --- | --- | --- |
| **Free** | $0/月 | $5/月 credits | 部署 Vercel、Design Mode、GitHub 同步；**每天 7 条消息上限** |
| **Premium** | $20/月（**正被 sunset、对新用户不可用**） | $20/月 credits | 加购 credits、更高上传上限、**Figma 导入**、**v0 API 访问** |
| **Team** | $30/用户/月 | $30/用户/月 + 登录每日 $2 免费 credits | 团队共享加购 credits、集中计费、共享 chat 协作、API 访问 |
| **Business** | $100/用户/月 | $30/用户/月 + 每日 $2 | 上同 + **默认训练 opt-out**（数据不用于训练） |
| **Enterprise** | 定制 | 定制 | **数据绝不用于训练**、SAML SSO、RBAC、优先性能 / 无排队、SLA 客服 |

**额度细则**：

- **Token**：input token 来自 prompt / 上传，output token 是 v0 生成的内容；用量随 prompt 长度与回复细节变化
- **滚存 / 过期**：未用完的月度 credits 可滚存到下个账期，**65 天后过期**；加购的 credits **一年后过期**
- **共享池**：Team / Business / Enterprise 有**共享 credit 池**（月度按人计，加购的进共享池）

::: warning 重要变动
**Premium($20) 正在 sunset、对新用户关闭**——新个人用户路径已转向 **Free + 按需**，团队走 **Team**。早期资料常说 Free 是"$5/月 credits"，新版定价页同时出现"**每天 7 条消息上限**"，两者并存，按官方现状理解即可。
:::

## 限制与竞品区别

### 限制要点

- **强绑 Vercel / Next.js 生态**：默认且主要产出 Next.js + shadcn/ui + Tailwind，非 Vercel / Next 场景适配弱
- **复杂逻辑仍需懂代码**：v0 擅长 UI 与脚手架 / 全栈起步，复杂业务逻辑、深度定制仍需人工读改代码
- **GitHub 非双向实时同步**：仓库是唯一真相源，文档未承诺既有仓库的双向 sync
- **Model API 参数受限**：不支持 `temperature` / `max_tokens` / `top_p`
- **额度 / 限速**：Free 每天 7 条消息；额度耗尽即停

### 与 bolt.new / Lovable 的区别

| | v0（Vercel） | bolt.new（StackBlitz） | Lovable |
| --- | --- | --- | --- |
| 运行环境 | Vercel sandbox + 部署 | **WebContainers**（浏览器内跑 Node） | 云端构建 |
| 默认栈 | **Next.js + shadcn/ui + Tailwind** | 框架不挑（Vite / Astro / Next 等） | 偏 React + Supabase |
| 护城河 | Vercel 生态 + shadcn/ui + **可调 API 的自有模型** | 浏览器内"真环境"、不绑单一云 | 强 Supabase、面向非工程产品向 |
| 开源版 | 无（本体闭源） | **bolt.diy**（MIT，可换模型自托管） | 无 |

关键记忆点：**"v0 = Vercel 生态 + shadcn/ui + 可调 API 的自有模型"**——既能在网页用，也能进 Cursor / Cline 当模型用，这是它区别于另两者的护城河。

::: tip 竞品对比口径
bolt.new / Lovable 的细节属横向定性，部分数字未在本轮逐页核验；需要精确指标时请另查其各自官方。bolt.new 的详细笔记见 [bolt.new](../bolt-new/)。
:::

## 目标用户

官方强调"**任何人**"，列出的非纯工程角色包括：产品经理、设计师、工程师、数据科学家、市场团队、内容创作者 / 教育者、客服、创始人。这也解释了它为何强调可视化的 Design Mode、Figma 导入与一键部署——把"能上线的产品"门槛压到尽量低。

## 与本站其它 app-builder 的关系

| 工具 | 一句话 | 链接 |
| --- | --- | --- |
| **v0** | Vercel 生态 + shadcn/ui + 可调 API 的自有模型 | 本页 |
| **bolt.new** | WebContainers 浏览器内真环境、不绑单一云 | [bolt.new](../bolt-new/) |

选型直觉：**深用 Vercel / Next 选 v0；要框架自由 + 浏览器内真环境选 bolt.new**。
