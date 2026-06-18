---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 bolt.new 2025–2026 现状编写。金额 / 额度仅作功能向参考，**一切以官方 [pricing](https://bolt.new/pricing) 为准**。完整文档见 [support.bolt.new](https://support.bolt.new/)。

## 套餐速记（功能向）

| 档位 | 价格 | token 额度 | 每日上限 | 上传 | agent | 品牌标 | 自定义域名 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Free** | $0 | 每月 1M | 每日 300K | 10MB | 仅 Standard | 有 | ✗ |
| **Pro** | $25 / 月 | 每月起 10M | 无 | 100MB | Standard + Max | 去除 | ✓ |
| **Teams** | $30 / 月·每席 | Pro 全部 + | 无 | 100MB | Standard + Max | 去除 | ✓ |
| **Enterprise** | 定制 | Pro 全部 + | 无 | 定制 | Standard + Max | 去除 | ✓ |

::: tip 金额免责
$25 / $30 / 10M token 等会随官方调整而变，做决策 / 出题一律以 [bolt.new/pricing](https://bolt.new/pricing) 为准。
:::

## 各档关键增量

| 档位 | 相对下一档新增 |
| --- | --- |
| **Free** | 公开 + 私有项目；无限数据库；约 333k web 请求 |
| **Pro** | 未用 token 滚存；SEO；AI 图片编辑；约 1M web 请求；可用 Max |
| **Teams** | 集中账单；团队访问管理；细粒度管理员控制与用户预配；私有 NPM registry；Design System（按包 prompt） |
| **Enterprise** | 高级安全（SSO、审计日志、合规）；专属客户经理 + 24/7 优先支持；定制工作流 / 集成 |

## token 机制速记

| 项 | 规则 |
| --- | --- |
| 计量单位 | token（短词约 1 个，长 / 生僻词拆多个） |
| 消耗大头 | Bolt 读取 / 同步整个项目文件——**项目越大每条消息越贵** |
| Free 重置 | 每月 1 号 |
| 付费重置 | 订阅续费日（如 7/15 订阅则每月 15 号） |
| 滚存上限 | 付费未用 token 最多保留 **2 个月**，需维持订阅 |
| 消耗顺序 | **FIFO**——先用最老的（滚存）桶，再用本期，过期作废 |
| Reload 加购 | 不过期（Pro 年付可加购） |
| 省 token | Plan / Discussion Mode 先聊清楚再生成；保持项目精简 |

## Agent 档位速记

| Agent | 定位 | 适合 | 可用 |
| --- | --- | --- | --- |
| **Standard** | 均衡、快、省 token | 中小应用、UI 改动、定义清晰的任务 | 含 Free |
| **Max** | 最大推理，每步想得更多 | 大代码库、复杂依赖、重构、开放式问题 | 付费 |
| **v1（legacy）** | 旧版 | 已淘汰 | 2026-04-13 新项目停选，2026-08-03 退役 |

## 集成速记

| 集成 | 用途 | 备注 |
| --- | --- | --- |
| **Bolt Cloud** | 托管 + 域名 + 后端 | 阶段一 2025-08 托管/域名，阶段二 2025-09-30 后端 GA |
| **Supabase** | Postgres / 鉴权 / 存储 / Edge Functions / Realtime | **仅 Vite，不支持 Next.js** |
| **Bolt Database** | 默认后端，自动按需创建 | 切 Supabase 后期有额外步骤 |
| **Netlify** | 备选托管 | **必须首次发布前选定** |
| **GitHub** | 导入仓库 + 版本管理 | — |
| **Figma** | 设计稿导入 | — |
| **Google Stitch** | 设计一键导出到 Bolt | 2025-05 |
| **Expo** | 移动端，React Native 代码生成 | Bolt V2（2025-02） |
| **MCP** | 连接 MCP server 扩展能力 | 2025-02 起 |

## 托管与域名速记

| 目标 | 默认域名 | 自定义域名 | 选择时机 |
| --- | --- | --- | --- |
| **Bolt Cloud** | `.bolt.host` 子域名（Free 即有） | 付费，内置管理 | 默认 |
| **Netlify** | 随机 `netlify.app` | Teams 可改 | **首次发布前必须选定** |
| **手动** | — | — | `npm run build` 下载后拖拽上传 Netlify |

## bolt.new vs bolt.diy

| 维度 | bolt.new | bolt.diy |
| --- | --- | --- |
| 性质 | StackBlitz 托管商业 SaaS | MIT 开源社区版 |
| 仓库 | [stackblitz/bolt.new](https://github.com/stackblitz/bolt.new) | [stackblitz-labs/bolt.diy](https://github.com/stackblitz-labs/bolt.diy) |
| 运行 | 云端 WebContainers | 本地 / 自托管 / Docker / Electron |
| 模型 | 默认 Claude 系 + 自动路由 | **每个 prompt 可换**，19+ 提供商 |
| 部署目标 | Bolt Cloud / Netlify | Netlify / Vercel / GitHub Pages |
| 适合 | 即开即用、托管 + 后端一条龙 | 完全掌控、换模型、私有部署 |

## 关键时间线

| 时间 | 事件 |
| --- | --- |
| 2024-10 | bolt.new 发布 |
| 2025-02 | Bolt V2；Expo 移动端模板；可连 MCP server；可生成图片 |
| 2025-05 | 切换为 Standard / Max 两个 agent（平台自动优化模型）；Google Stitch 导入 |
| 2025-07 | Prompt Library 上线；Teams token 用量追踪 |
| 2025-08 | **Bolt Cloud 阶段一**：整合 Hosting + Domains；Version History |
| 2025-09 | **Bolt V2 默认 Claude Agent**；Bolt Database 上线；Analytics 仪表盘 |
| 2025-09-30 | **Bolt Cloud 阶段二**：Supabase 驱动的后端 GA |
| 2026-04-13 | v1 Agent 新项目停选 |
| 2026-08-03 | v1 Agent 退役 |

## 竞品对比速记

| 工具 | 强项 | 后端 | 受众 |
| --- | --- | --- | --- |
| **bolt.new** | WebContainers 真环境全栈 + 多框架 + 移动端 + 开源版 | Bolt Cloud / Supabase | 偏技术 |
| **v0（Vercel）** | 高质量 React / Next.js UI 组件 | 自己接 | Vercel 生态 |
| **Lovable** | 端到端最快验证，零代码友好 | Lovable Cloud（Supabase） | React-focused |

## 资源链接

| 资源 | 地址 |
| --- | --- |
| 官网 | [bolt.new](https://bolt.new/) |
| 定价 | [bolt.new/pricing](https://bolt.new/pricing) |
| 帮助中心 | [support.bolt.new](https://support.bolt.new/) |
| Release Notes | [support.bolt.new/release-notes](https://support.bolt.new/release-notes) |
| 商业版仓库 | [stackblitz/bolt.new](https://github.com/stackblitz/bolt.new) |
| 开源版 bolt.diy | [stackblitz-labs/bolt.diy](https://github.com/stackblitz-labs/bolt.diy) |
| Supabase 合作 | [supabase.com/blog/bolt-cloud-launch](https://supabase.com/blog/bolt-cloud-launch) |
