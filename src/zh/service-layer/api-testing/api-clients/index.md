---
layout: doc
---

# API 客户端（Postman / Bruno / Insomnia / Hoppscotch）

API 客户端（API Client）是开发者**调试、测试、文档化 HTTP/GraphQL 接口**的核心工具——它把「发请求、看响应、管环境、存用例」收拢到一个图形界面，让接口联调从「写 curl 脚本」升级为「点按式交互」。一个称手的 API 客户端要解决四件事：①**请求构造**（method/URL/header/body/auth 一站式编辑，支持 JSON/表单/二进制/multipart）；②**响应检视**（美化 JSON、展示状态码/耗时/大小、自动高亮）；③**环境与变量**（dev/staging/prod 切换、密钥注入，避免硬编码）；④**团队协作**（请求集合共享、版本同步、Mock 服务）。2026 年这个赛道的格局已被重塑——Postman 因免费层持续削减、强制云端、隐私争议，正把个人开发者推向**开源 + Git-native** 的 Bruno；Insomnia 被 GitLab 收购后更新放缓；Hoppscotch 作为浏览器端开源替代持续抢份额。选型不再是「Postman 就行」，而是要权衡**定价模型、数据主权、Git 集成、团队规模**四个维度。

本叶是 API 测试子组的**总览与选型地基**，先把四个工具横放对比（功能/定价/协作/Git 集成），再分别深入「工具对比」与「实际工作流」两条线——前者帮你在立项时做出选型决策，后者教你把选定的工具真正跑进日常联调（环境变量管理、集合导入导出、与 CI/自动化测试对接）。GraphQL IDE（Apollo Sandbox）与负载测试（k6）是另外两条独立的测试脉络，见各自专叶。

## 评价

**优点**

- **请求可复现**：把接口的 URL/header/body/参数存成命名请求，一键重发，告别「我这边能跑」的口头联调
- **环境隔离**：用变量切换 dev/staging/prod，token/密钥集中管理，不散落脚本
- **团队知识沉淀**：请求集合即接口文档 + 冒烟用例，新人 clone 即可上手，降低协作摩擦
- **生态扩展**：支持脚本断言、Mock、监控、OpenAPI 导入，能从「调试器」长成「轻量测试平台」

**缺点**

- **厂商锁定风险**：Postman 集合存云端，免费层缩水时历史数据迁移成本高，是 2025-2026 切换 Bruno 的主因
- **本地状态难复现**：环境变量、cookie、历史记录散在本地，跨机器/多人同步要靠云同步或 Git
- **重型工具臃肿**：Postman 桌面端基于 Electron 内存占用大，简单发请求也要启动完整 GUI
- **协作与隐私矛盾**：团队共享往往要求上传到厂商云，企业内部接口不能外流，必须选本地优先或私有部署方案

## 本叶地图

- [入门](./getting-started) —— API 客户端定义、四工具定位（Postman/Bruno/Insomnia/Hoppscotch）、核心能力清单、选型速查
- [工具对比](./guide-line/comparison) —— 四工具功能矩阵、定价梯队、团队协作能力、Git 集成深度
- [实际工作流](./guide-line/workflow) —— 环境变量管理、集合组织、Git 集成实操、与 CI/自动化对接
- [参考](./reference) —— 四工具速查表、快捷键、命令行对应、易错点

## 幻灯片地址

<a href="/SlideStack/api-clients-slide/" target="_blank">API 客户端</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=API%20%E5%AE%A2%E6%88%B7%E7%AB%AF%EF%BC%88Postman%20%2F%20Bruno%20%2F%20Insomnia%20%2F%20Hoppscotch%EF%BC%89" target="_blank" rel="noopener noreferrer">API 客户端测试题</a>
