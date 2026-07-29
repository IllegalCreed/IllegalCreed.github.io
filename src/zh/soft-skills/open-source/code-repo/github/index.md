---
layout: doc
---

# GitHub

全球**事实标准**的代码托管与协作平台——**开源界的「操作系统」**。GitHub 不只是把 Git 仓库搬到云端，而是围绕「**仓库 → 分支 → Pull Request → Review → Merge**」这套社交化协作流，构建了一个覆盖托管、CI/CD、包管理、静态站、AI 编程助手的完整开发者生态。一个 GitHub 账号几乎是当代程序员的「数字身份证」：开源项目在此聚集（Linux Kernel、React、Vue、TensorFlow…），企业私有代码在此托管，简历上的贡献绿格子（contribution graph）成了衡量活跃度的硬通货。核心能力包括：**仓库托管**（公开仓库永久免费、支持 Fork/Star/Watch 社交化传播）、**Pull Request**（业界事实标准的代码评审流）、**Issues + Projects**（轻量项目跟踪）、**GitHub Actions**（云端 CI/CD，yaml 声明式 workflow，跨平台 Runner）、**GitHub Packages**（npm/Docker/Maven 多格式包仓库）、**GitHub Pages**（仓库即静态站，文档/博客零成本上线）、**GitHub Copilot**（基于 LLM 的 AI 结对编程，IDE 内补全+对话+Agent）。2026 年 GitHub 进一步把 Copilot 从订阅制转向**用量计费（usage-based billing）**，AI 能力成为平台增长主引擎。注意：本叶讲**平台功能**（托管/CI/AI/协作），Git 工具命令用法归「版本控制」章。

## 评价

**优点**

- **开源生态垄断**：全球最大开源项目聚集地，Fork/Star/PR 社交化协作成为行业标准；想参与开源几乎绕不开 GitHub
- **公开仓库永久免费**：不限私有仓库数量（Free 已支持无限私有库），降低个人与团队托管门槛
- **Pull Request 事实标准**：代码评审、CI 触发、讨论、改动可视化一体，已成为团队协作的通用语言
- **GitHub Actions 一体化 CI/CD**：yaml 声明式 workflow + 跨平台托管 Runner + 海量 Marketplace Action，免运维 CI 基建
- **GitHub Packages 统一制品库**：npm/Docker/Maven/NuGet/RubyGems 多格式包仓库，与代码同源管理
- **GitHub Pages 零成本静态站**：仓库即网站，文档/博客/项目主页 git push 即上线，自带 HTTPS
- **GitHub Copilot AI 编程领先**：IDE 内补全、Chat 对话、Agent 模式、代码审查，AI 能力业界第一梯队
- **生态完整**：Codespaces（云端 IDE）、Codespaces、Security（Dependabot/Secret Scanning）、Discussions（社区论坛）形成闭环

**缺点**

- **Copilot 用量计费不可控**：2026-06-01 转向 usage-based 后，token 消耗难以预估，重度用户账单可能暴涨
- **私有仓库 Actions 限额**：免费 2000 分钟/月、Team 3000 分钟/月，macOS/Windows Runner 有倍率换算，超额按分钟计费
- **被微软收购的隐私顾虑**：用仓库内容训练 AI 模型的争议（虽 Enterprise 可 opt-out）让部分开源项目迁移
- **体量过大致体验变重**：功能堆叠（Projects v2、Copilot Workspace、Agent）让新用户上手成本上升
- **国内访问不稳定**：无国内节点，clone/push 速度受网络影响，需镜像或代理（催生 Gitee/GitLab 国内需求）
- **平台锁定风险**：Actions/Projects/Packages 深度耦合，迁移到 GitLab/Gitee 有成本
- **免费 Runner 性能有限**：2 核 7GB，大型构建/测试需自建 Runner 或付费升级

## 文档地址

[GitHub Docs](https://docs.github.com/)

## GitHub 地址

[github/github (GitHub 仓库自身)](https://github.com/github)

## 幻灯片地址

<a href="/SlideStack/github-slide/" target="_blank">GitHub</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=GitHub" target="_blank" rel="noopener noreferrer">GitHub 测试题</a>
