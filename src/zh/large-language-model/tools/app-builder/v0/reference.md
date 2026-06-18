---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 v0.app 2025–2026 现状编写。金额 / 额度 / 模型指标随时可能调整，一律以 [v0 官方页](https://v0.app) 为准。

## 两套 API 对照

| 维度 | v0 Model API | v0 Platform API |
| --- | --- | --- |
| 用途 | 调 v0 **模型**做补全 / 对话 | 做 **dev tools / 平台**基础设施 |
| Base URL / 包 | `https://api.v0.dev/v1`（OpenAI 兼容） | `v0-sdk`（npm 包） |
| 安装 | 任意 OpenAI 兼容客户端 | `pnpm add v0-sdk` |
| 鉴权 | `Authorization: Bearer $V0_API_KEY` | `V0_API_KEY` |
| 典型能力 | chat completions、流式、工具调用 | 管理 chat、解析生成文件、运行 app、操作 project / deployment |
| 文档 | `apidog` / `litellm` 一手汇编 + `v0.app/docs` | `v0.app/docs/api/platform/overview` |

## 模型清单

| 模型 ID | 上下文窗口 | 最大输出 | 状态 | 定位 |
| --- | --- | --- | --- | --- |
| `v0-1.5-md` | 128K | 约 32K（以官方为准） | beta | 日常任务、UI 生成（medium） |
| `v0-1.5-lg` | 512K | — | beta | 高级思考 / 推理（large） |
| `v0-1.0-md` | 128K | 32K | legacy（仍可用） | 旧版 |

> `v0-1.5-md` / `v0-1.5-lg` 于 2025-06-09 上线 Models API（beta）。

## Model API 端点

| 项 | 值 |
| --- | --- |
| Base URL | `https://api.v0.dev/v1` |
| Chat 端点 | `POST /v1/chat/completions` |
| 格式 | OpenAI Chat Completions 兼容 |
| 鉴权 | `Authorization: Bearer $V0_API_KEY` |
| 环境变量 | `V0_API_KEY` |

## Model API 参数支持

| 参数 | 是否支持 |
| --- | --- |
| `messages` | ✓ |
| `model` | ✓ |
| `stream` | ✓（SSE） |
| `tools` | ✓ |
| `tool_choice` | ✓ |
| `temperature` | ✗ 不支持 |
| `max_tokens` | ✗ 不支持 |
| `top_p` | ✗ 不支持 |

## Model API 能力

| 能力 | 说明 |
| --- | --- |
| 多模态 | 文本 + 图像输入（图像需 **base64**） |
| 流式 | SSE 低延迟流式响应 |
| 工具 / 函数调用 | 支持 `tools` / `tool_choice` |
| 框架感知 | 针对 Next.js / Vercel 平台优化输出 |

## 第三方客户端接入

| 配置项 | 值 |
| --- | --- |
| Base URL | `https://api.v0.dev/v1` |
| Model ID | `v0-1.5-md` / `v0-1.5-lg` / `v0-1.0-md` |
| API Key | 你的 `V0_API_KEY` |
| 适用客户端 | Cursor / Cline / liteLLM 等任何 OpenAI 兼容客户端 |

## 默认技术栈

| 层级 | 技术 |
| --- | --- |
| 框架 | Next.js |
| UI 库 | React + shadcn/ui |
| 样式 | Tailwind CSS |
| 部署 | Vercel |

## 官方工作流四段式

| 阶段 | 能力 |
| --- | --- |
| Prompt | 文本 / 截图 / 文件 / Figma 多模态输入 |
| Iterate | 代码编辑、终端命令、Design Mode、Versions |
| Integrate | 数据库、外部 API、GitHub、MCP、Slack、预装 agent |
| Ship | 一键 Deploy 到 Vercel / 创建 PR、自定义域名、分享、模板 |

## 集成清单

| 集成 | 方式 / 说明 |
| --- | --- |
| Vercel 部署 | Publish 自动建 Project，预览继承 Development 环境变量 |
| GitHub | 仓库为唯一真相源，自动建工作分支 + 每条消息一次 commit，Publish 发 PR |
| 数据库 | Vercel Marketplace 集成 Supabase / Neon |
| 其它服务 | MCP 服务器；内置 Snowflake / Slack / 预装 agent |
| AI 模型 | 默认接 Vercel AI Gateway；支持 fal / Deep Infra / Grok(xAI) / 自填 OpenAI key |
| Figma | 导入 Figma 设计作为 prompt（Premium 起） |

## Sandbox 终端权限档位

| 档位 | 行为 |
| --- | --- |
| Ask | 每条命令都询问 |
| Auto | 自动执行常规命令 |
| Full | 全自动 |

## 计划档位（以官方为准）

| 计划 | 价格 | 月度额度 | 关键点 |
| --- | --- | --- | --- |
| Free | $0/月 | $5/月 credits | 每天 7 条消息上限 |
| Premium | $20/月（**正 sunset、新用户不可用**） | $20/月 credits | Figma 导入、v0 API 访问 |
| Team | $30/用户/月 | $30/用户/月 + 每日 $2 | 共享加购、集中计费、API 访问 |
| Business | $100/用户/月 | $30/用户/月 + 每日 $2 | 默认训练 opt-out |
| Enterprise | 定制 | 定制 | 数据绝不用于训练、SAML SSO、RBAC、SLA |

## 额度规则

| 项 | 规则 |
| --- | --- |
| 计费单位 | token（input + output） |
| 月度 credits 滚存 | 可滚存到下个账期，**65 天后过期** |
| 加购 credits 过期 | **一年后过期** |
| 共享池 | Team / Business / Enterprise 加购的进共享池 |
| 额度耗尽 | 生成暂停 |

## 竞品对照

| | v0 | bolt.new | Lovable |
| --- | --- | --- | --- |
| 出品方 | Vercel | StackBlitz | Lovable |
| 运行环境 | Vercel sandbox + 部署 | WebContainers（浏览器内 Node） | 云端构建 |
| 默认栈 | Next.js + shadcn/ui + Tailwind | 框架不挑 | 偏 React + Supabase |
| 自有模型可独立调用 | ✓（OpenAI 兼容 API） | ✗ | ✗ |
| 开源版 | ✗ | bolt.diy（MIT） | ✗ |

## 资源链接

| 资源 | 链接 |
| --- | --- |
| 首页 | [v0.app](https://v0.app) |
| 文档 | [v0.app/docs](https://v0.app/docs) |
| 定价（产品页） | [v0.app/pricing](https://v0.app/pricing) |
| 定价（docs） | [v0.app/docs/pricing](https://v0.app/docs/pricing) |
| Platform API 总览 | [v0.app/docs/api/platform/overview](https://v0.app/docs/api/platform/overview) |
| Platform SDK（npm） | [v0-sdk](https://www.npmjs.com/package/v0-sdk) |
| 幻灯片 | <a href="/SlideStack/v0-slide/" target="_blank">v0</a> |
