---
layout: doc
outline: [2, 3]
---

# 工具对比：功能矩阵、定价、协作与 Git 集成

> 基于 Postman 11 · Bruno 2 · Insomnia 11 · Hoppscotch 2025 · 核于 2026-08

## 速查

- **功能矩阵结论**：**Postman 最全**（Mock/监控/自动化测试/CI Runner/文档发布全都有），**Insomnia 次之**（强 GraphQL/gRPC），**Bruno 聚焦核心**（请求/环境/断言/CLI Runner，砍掉重型功能），**Hoppscotch 最精简**（请求/环境/集合，团队协作需自部署版）。
- **定价梯队**：Postman 免费→14/28 美元/人/月起（团队版贵）；Insomnia 社区版免费、Pro 约 5/人/月；Bruno **核心全免费**，仅「云协作」Golden Plan 收费（约 10/人/月）；Hoppscotch **完全免费**，团队版按自部署算服务器成本。
- **团队协作模型**：Postman = **云端工作区**（实时共享但数据上云）；Bruno = **Git 仓库**（请求是文件，团队 pull/push 协作，零云依赖）；Insomnia = 本地 + 可选云同步；Hoppscotch = 自部署团队空间。
- **Git 集成深度**：**Bruno 第一梯队**（请求集合本来就是文件目录，原生 git diff/merge）；**Hoppscotch 第二梯队**（可导出 JSON 提交）；Postman/Insomnia 的「Git 集成」是把云集合反向同步到 Git 仓库，**不是本地优先**，diff 体验差。
- **数据主权**：Bruno/Hoppscotch 自部署 = 数据**完全在自家**；Postman/Insomnia 默认云端，企业版才支持私有化。
- **GraphQL 支持**：Insomnia 与 Postman 都有一等公民的 GraphQL 编辑器（变量补全、Schema 查看）；Bruno/Hoppscotch 支持 GraphQL 请求但编辑器较简。
- **CLI / 自动化**：Postman 有 Newman、Bruno 有 `bru run`、Insomnia 有 Inso CLI、Hoppscotch 有 CLI——四者都能接 CI/CD 跑冒烟。

## 一、功能矩阵：谁有什么

四工具的核心能力横放对比（✅ 原生 / 🟡 部分或需插件 / ❌ 无）：

| 能力 | Postman | Insomnia | Bruno | Hoppscotch |
| --- | --- | --- | --- | --- |
| REST 请求 | ✅ | ✅ | ✅ | ✅ |
| GraphQL 编辑器 | ✅ | ✅ | 🟡 | 🟡 |
| gRPC 调试 | ✅ | ✅ | ❌ | 🟡 |
| WebSocket | ✅ | ✅ | 🟡 | ✅ |
| 环境变量/多环境 | ✅ | ✅ | ✅ | ✅ |
| 请求脚本/断言 | ✅ JS | ✅ JS | ✅ JS | 🟡 |
| Mock 服务 | ✅ | 🟡 | ❌ | 🟡 |
| 监控/定时探测 | ✅ | ❌ | ❌ | ❌ |
| OpenAPI 导入导出 | ✅ | ✅ | 🟡 | 🟡 |
| CLI Runner | ✅ Newman | ✅ Inso | ✅ bru run | 🟡 |
| 团队工作区 | ✅ 云 | ✅ 云 | 🟡 Git | 🟡 自部署 |

- **选 Postman 当且仅当**：你需要 Mock/监控/团队文档发布这一整套，且接受云端与定价。
- **选 Insomnia 当且仅当**：GraphQL/gRPC 是主力，且团队偏好开源社区版。
- **选 Bruno 当且仅当**：你要 Git 原生的版本控制、无云账号、纯本地。
- **选 Hoppscotch 当且仅当**：浏览器/自部署是硬约束，功能够用即可。

## 二、定价梯队

定价是 2024-2026 迁移潮的直接导火索，要看清梯队：

| 工具 | 免费层 | 付费起步 | 备注 |
| --- | --- | --- | --- |
| **Postman** | 个人够用，**团队工作区 2024-2025 持续缩水** | ~14 美元/人/月（基础）→ 28（高级）→ 定制（企业） | 团队越大人头费越显眼 |
| **Insomnia** | 社区版全功能 | Pro ~5 美元/人/月 | Kong→GitLab 后定价趋稳 |
| **Bruno** | **核心全免费** | Golden Plan ~10 美元/人/月（仅云协作可选） | 不订阅也能用全部核心 |
| **Hoppscotch** | **完全免费** | 团队版按自部署服务器算 | 开源无功能阉割 |

- **隐藏成本**：Postman 免费层的「团队调用次数」「集合数量」会随版本下调，立项时要按**两年后**的成本估，不能只看当下。
- **迁移成本**：从 Postman 切 Bruno，Postman 集合可直接导入 Bruno（支持 Collection v2 格式），环境变量需手动迁移。

## 三、团队协作模型

四个工具的协作哲学截然不同，直接决定适合的团队类型：

```
Postman：  请求集合 ──(云端工作区)──> 团队成员实时共享
Bruno：    请求集合 = 文件夹 ──(git push/pull)──> 团队成员 clone
Insomnia： 本地集合 ──(可选云同步)──> 团队
Hoppscotch：浏览器/自部署 ──(团队空间)──> 成员
```

- **Postman 的云端工作区**是**实时协作**的（像 Google Docs），多人改同一集合不冲突，但数据在 Postman 云。
- **Bruno 的 Git 协作**是**异步版本化**的（像代码），合并冲突靠 Git 解决，数据完全在自家仓库——对「接口即代码」的团队是天然契合。
- **数据主权敏感**的团队（金融/医疗/政企）几乎只能选 Bruno 或 Hoppscotch 自部署。

## 四、Git 集成深度对比

「Git 集成」这个词被滥用，实际深度差很多：

| 工具 | Git 集成方式 | diff 体验 | 本地优先 |
| --- | --- | --- | --- |
| **Bruno** | 请求集合**就是文件目录** | ✅ 原生 git diff，每请求一文件 | ✅ 是 |
| **Hoppscotch** | 导出 JSON 提交 | 🟡 整集合一个文件，diff 噪声大 | 🟡 部分 |
| **Postman** | 云集合→反向同步到 Git 仓库 | ❌ 同步产物，非文件优先 | ❌ 否 |
| **Insomnia** | 工作区同步到 Git | 🟡 类似 Postman | ❌ 否 |

- **Bruno 的 .bru 文件**是纯文本（类似 INI/JSON 混合），一个请求一个文件，目录结构即集合结构——`git diff` 能看清「谁改了哪个请求的哪个 header」，PR review 接口变更像 review 代码。
- **Postman 的「GitHub 集成」**是把云集合定时备份到 Git 仓库，本质是云优先 + Git 镜像，不是文件优先，diff 体验是「一个大 JSON 变了」，看不出语义。

## 五、选型决策矩阵

把四个维度（功能/定价/协作/Git）加权，不同团队的推荐：

| 团队画像 | 功能要求 | 预算 | 数据主权 | Git 集成 | 推荐 |
| --- | --- | --- | --- | --- | --- |
| 大厂 API 平台团队 | Mock/监控/文档全要 | 充足 | 可上云 | 一般 | **Postman** |
| 10 人创业团队 | 核心 + Mock | 敏感 | 敏感 | 必须 | **Bruno** |
| 重 GraphQL 后端 | GraphQL 一等公民 | 中等 | 中等 | 中等 | **Insomnia** |
| 受限网络/外包团队 | 浏览器即用 | 极敏感 | 必须 | 一般 | **Hoppscotch** |
| 开源项目维护者 | 纯本地 + Git | 零预算 | 必须 | 必须 | **Bruno** |

## 下一步

选型定了之后，下一步是把它**真正用起来**——[实际工作流](./workflow) 讲环境变量管理、集合组织、Git 集成实操、与 CI 对接。
