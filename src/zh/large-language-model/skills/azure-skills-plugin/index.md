---
layout: doc
---

# Azure Skills Plugin

Azure Skills Plugin（`microsoft/azure-skills`）是 Microsoft **官方**出品的 agent plugin，MIT 开源。它把「策展的 Azure 专家知识」和「MCP 驱动的真实执行能力」打包在一起，一装即给兼容的 coding agent **三层能力**：**27 个 curated Azure skills**（大脑——教 agent 何时用哪个 Azure 工作流、有哪些护栏）+ **Azure MCP Server**（双手——200+ 工具覆盖 40+ Azure 服务，能列资源、查价、看日志、驱动真实工作流）+ **Foundry MCP**（AI 专家——Microsoft Foundry 的模型发现/部署/agent 工作流）。它让 agent 从「给通用云建议」升级到「真正做 Azure 工作」。多 host（GitHub Copilot in VS Code、Copilot CLI、Claude Code、Cursor、Codex、Gemini、IntelliJ），自 `microsoft/GitHub-Copilot-for-Azure` 自动同步。

## 评价

**优点**

- **官方能力层，非 prompt 包**：Microsoft 官方维护，skills 教「何时用、避免什么」，MCP 工具让 agent「在真实 Azure/Foundry 资源上动手」，plugin 把两层对齐在一次安装里
- **推理 + 执行合一**：skills（大脑）给决策树与护栏，Azure MCP（双手）给 200+ 工具跨 40+ 服务的执行力——不再是「解释 Azure」而是「做 Azure」
- **工作流带强护栏**：`azure-prepare → azure-validate → azure-deploy` 三段链，validate 未过 STOP 不让部署、破坏性动作要 `ask_user`、跳步会被 skill 拦住
- **27 个策展 skill**：从准备/校验/部署，到诊断/合规/成本，到 AI/存储/身份/Kubernetes，覆盖 Azure 全生命周期
- **多 host 通用**：同一份 Azure 能力在 GitHub Copilot、Claude Code、Cursor、Codex、Gemini 之间通用（APM 一条命令跨装）
- **主权云支持**：`--cloud AzureChinaCloud` / `AzureUSGovernment` 接入中国云与美国政府云

**缺点 / 边界**

- **强绑 Azure**：只服务 Azure/Foundry 生态，非跨云通用工具（跨云迁移反而是它的一个 skill）
- **执行依赖真实凭据**：Azure MCP 要 `az login` / `azd auth login` / 服务主体，未登录时只剩「解释」层
- **需要 Node.js 18+**：`npx` 拉起 MCP server，缺 Node 则 MCP 工具不可用
- **Claude Code 装法与 Copilot 不同**：Claude Code 从 `claude-plugins-official` 市场装，Copilot CLI 才是 `microsoft/azure-skills` 市场

## 适用场景

- 想让 agent 真正**准备/校验/部署** Azure 项目（azd / Bicep / Terraform）而非只给建议
- **诊断线上 Azure 问题**（App Service 高 CPU、AKS pod pending、Service Bus 锁丢失）要工具背书的排查
- **省成本 / 查合规 / 定权限**：cost 优化、azqr 合规扫描、RBAC 最小权限角色
- 做 **Foundry** 场景：模型发现、部署、agent 评估与微调

## 边界

- **不是单个技能，是官方能力层**：27 个 skill 各有触发条件与 `DO NOT USE FOR` 边界，按需激活
- **skill 是推理层，MCP 是执行层**：查真实资源状态靠 MCP 工具，不靠 skill「编」
- **平台绑定**：deploy/diagnostics/cost 等都作用于真实 Azure 订阅
- **身份 skill 分工**：RBAC（`azure-rbac`）、应用注册（`entra-app-registration`）、Agent 身份（`entra-agent-id`）各管一块

## 官方文档

[Azure Skills 站点](https://microsoft.github.io/azure-skills/) ｜ [aka.ms/azure-plugin](https://aka.ms/azure-plugin) ｜ [Azure MCP Server 文档](https://learn.microsoft.com/azure/developer/azure-mcp-server/)

## GitHub 地址

[microsoft/azure-skills](https://github.com/microsoft/azure-skills)（MIT，自 `microsoft/GitHub-Copilot-for-Azure` 同步）

## 内容地图

- [入门](./getting-started) —— 定位、三层能力、多 host 安装、27 skill 分类总览、验证安装
- [指南](./guide-line) —— skill 分类逐讲、Azure MCP / Foundry MCP（推理 + 执行）、部署工作流与护栏、反模式
- [参考](./reference) —— 27 skill 全表、安装命令、MCP server 配置、认证、主权云、许可与链接

## 幻灯片地址

<a href="/SlideStack/azure-skills-plugin-slide/" target="_blank">Azure Skills Plugin</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=637" target="_blank" rel="noopener noreferrer">Azure Skills Plugin 测试题</a>
