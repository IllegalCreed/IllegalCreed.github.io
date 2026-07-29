---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Gitee 官方站点与帮助中心编写（gitee.com / help.gitee.com，2026.07 版本）

## 速查

- 官网：<https://gitee.com>
- 运营方：**开源中国 OSCHINA**（北京奥思研工智能科技有限公司）
- 上线时间：**2013 年**
- 核心定位：**国内代码托管 + GitHub 镜像 + 企业研发协作**
- 仓库类型：公开（Public）/ 私有（Private）
- 协作单元：**Pull Request（PR）**（与 GitHub 同名）
- 静态站：**Gitee Pages / Gitee Pages Pro**
- CI/CD：**Gitee Go**（流水线）
- 制品库：**Gitee Packages**
- 企业服务：**企业版（SaaS）** + **专业版私有化部署**
- 镜像 GitHub：**仓库导入 + Pull/Push 同步**
- AI：**Gitee AI 队友** + **模力方舟**（开源模型/数据集）
- 特色：**CopyCat 代码克隆检测**（企业版）
- 免费：5 人团队免费、公开/私有库免费
- 特别注意：**公开仓库需人工审核后才能上线**（内容合规要求）

## Gitee 是什么

Gitee 是**国内最大的代码托管平台**，对标 GitHub。与 GitHub / GitLab 对比：

| 维度 | Gitee | GitHub | GitLab |
|---|---|---|---|
| 定位 | **国内托管 + 镜像** | 开源生态霸主 | 一体化 DevOps |
| 国内访问 | **快** | 慢 | 中 |
| 开源生态 | 国内为主 | 全球第一 | 中 |
| CI/CD | Gitee Go（轻量）| Actions（强）| 内置（强）|
| 公开库审核 | **需人工审核** | 无 | 无 |
| 企业/私有化 | 企业版 + 专业版私有化 | Enterprise | CE/EE 自建 |
| AI | AI 队友 | Copilot | Duo |

**核心结论**：要**国内速度 + 合规 + GitHub 镜像** 用 **Gitee**；要开源生态用 **GitHub**；要一体化 DevOps 用 **GitLab**。三者常互补：GitHub 主仓 → Gitee 镜像做国内加速、GitLab 跑 CI。

## 账号与第一个仓库

1. 注册 <https://gitee.com/signup>（支持手机/邮箱，国内账号体系）
2. 点 `+` → **新建仓库**
3. 填仓库名、选 公开/私有、勾 `使用 Readme 文件`、选开源许可证
4. `git clone` 到本地

### 个人 vs 企业版

| 形态 | 用途 | 计费 |
|---|---|---|
| **个人版** | 个人项目 | 免费（5 人团队）|
| **企业版（SaaS）** | 团队研发协作 | 按人按月/年 |
| **专业版私有化** | 内网/私有云部署 | 商业授权 |

## Pull Request 协作流

Gitee 的 PR 流程与 GitHub 基本一致：

1. Fork（或对组织内仓库直接开分支）
2. 开分支、commit、push
3. 网页点 **Pull Request**
4. 填标题/描述，关联 Issue（`Closes #123` / Gitee 也支持 `#123` 关联）
5. Reviewer 评审、CI（Gitee Go）跑绿
6. Merge

## 镜像 GitHub（核心用途）

Gitee 最常见的用法是给 GitHub 仓库做**国内镜像/加速**：

### 方式一：一键导入

1. Gitee 右上角 `+` → **从 GitHub/GitLab 导入仓库**
2. OAuth 授权 Gitee 访问你的 GitHub
3. 选择仓库 → 自动导入

### 方式二：手动镜像同步

```bash
# 在 Gitee 新建空仓库后
git clone https://github.com/user/repo.git
cd repo
git remote add gitee https://gitee.com/user/repo.git
git push gitee --all
git push gitee --tags
```

### 方式三：Pull/Push 镜像（自动同步）

Gitee 仓库设置里可配置**强制同步 GitHub**（Pull 方式，Gitee 定期拉 GitHub），保持镜像实时更新。

::: tip 国内加速典型用法
clone 大仓库（如 React/Vue 源码）时，把 GitHub 地址换成对应 Gitee 镜像，速度从 KB/s 提到 MB/s。很多开源项目在 README 里会提供 Gitee 镜像地址。
:::

## Gitee Pages —— 静态站

仓库即网站，与 GitHub Pages 类似：

1. 仓库 Settings → **Gitee Pages**
2. 选分支 + 目录
3. 站点地址：`https://&lt;user&gt;.gitee.io/<repo>`
4. **Gitee Pages Pro**：支持自定义域名、HTTPS、自动部署（付费）

注意：Gitee Pages 对部署内容同样有合规要求。

## Gitee Go —— 流水线 CI/CD

声明式流水线，配置文件 `.workflow/*.yml`：

```yaml
# .workflow/build.yml 简例
name: 构建测试
on: [push]
jobs:
  build:
    runs-on: ubuntu
    steps:
      - run: npm ci
      - run: npm test
```

Gitee Go 提供 SaaS Runner 与企业版自建 Runner，模板库不如 GitHub Marketplace 丰富，但覆盖国内常见构建场景。

## Gitee Packages —— 制品库

支持 npm/Maven/Docker 等格式，与代码同仓库管理。企业版可做私有制品仓库。

## 企业版与私有化部署

### 企业版（SaaS）

- **研发协作**：需求/任务/缺陷管理、看板、迭代、统计
- **代码托管**：组织/团队/仓库、权限、代码评审
- **CI/CD**：Gitee Go 企业版
- **安全**：代码扫描、CopyCat 克隆检测
- **集成**： webhook、开放 API

### 专业版私有化部署

- 部署在企业内网/私有云
- 数据完全本地化，满足等保/信创要求
- 政企、金融、教育、军工等强合规场景首选

## Gitee AI（AI 队友 / 模力方舟）

- **AI 队友**：IDE 内辅助编程、代码补全（体验不及 Copilot）
- **模力方舟（Gitee AI）**：开源模型、数据集、应用市场，对接国产开源模型生态

## 公开仓库内容审核（重要边界）

因国内内容合规要求，Gitee **公开仓库需经人工审核后才能正式公开访问**：

- **2022 年 5 月**：Gitee 公告执行「开源仓库审核后上线」——新公开库需人工审核，已公开库暂转私有待审
- 官方表态「迫于无奈」，主因内容合规与版权管理
- 该事件在开发者社区引发广泛争议（与开源自由开放精神冲突）
- 当前：公开库创建后需提交审核，通过方可公开

::: warning 与 GitHub/GitLab 的关键差异
GitHub/GitLab 的公开仓库**无需审核**即可公开。Gitee 因合规要求需审核——这是选型时必须考量的治理差异，尤其对追求「即时开源传播」的项目。
:::

## 下一步

入门到此——你已了解 Gitee 的国内定位、PR、GitHub 镜像、Pages、Go、企业版/私有化、内容审核。下一章 `guide-line.md` 深入讲 **GitHub 镜像自动化 / Gitee Go 流水线进阶 / 企业版研发协作 / 私有化部署 / CopyCat 代码查重 / Gitee AI / 多平台协同（GitHub+GitLab+Gitee）/ 选型决策**。
