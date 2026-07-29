---
layout: doc
---

# 技术写作

把「会做」变成「能教会别人」的能力——技术写作（Technical Writing）是工程师影响力的放大器。一篇好的 README 让项目被采用，一份清晰的 API 文档让集成零摩擦，一个规范的 CHANGELOG 让升级有信心，一篇深入的技术博客建立个人品牌。技术写作覆盖五类核心文档：**API 文档**（机器可读 + 人可读，OpenAPI/Swagger 规范）、**架构文档**（系统设计、ADR、决策上下文）、**README**（项目门面，30 秒决定是否用你的项目）、**CHANGELOG**（变更记录，Keep a Changelog + Conventional Commits 让发布可追踪）、**技术博客**（经验沉淀、知识外溢）。方法论上，**Docs as Code**（文档即代码）是主流——把文档当代码：版本控制、CI/CD、代码评审、自动化测试，让文档与产品同步演进；**Diagrams as Code**（图即代码）用 Mermaid/PlantUML/D2 把架构图变成可 diff 的文本，告别「图与代码不一致」。写作原则贯穿始终：**受众先行**（写给谁看决定怎么写）、**主动语态**（「系统返回 200」优于「200 被返回」）、**术语一致**（同一概念用同一个词）。信源 writethedocs.org（全球技术写作社区，Docs as Code 方法论发源地）与 keepachangelog.com（CHANGELOG 事实标准）。技术写作不是「写完代码后的附加任务」，而是把隐性知识显性化、让个人经验变成团队资产、把「只有我能维护」变成「人人能接手」的核心工程实践。

## 评价

**优点**

- **降低集成与上手成本**：清晰的 API 文档/README 让使用者零摩擦上手，减少「这怎么用」的反复问答
- **决策可追溯**：架构文档/ADR 记录「为什么这么设计」，新人能理解决策上下文，避免推倒重来
- **变更可追踪**：规范的 CHANGELOG 让升级有预期，Conventional Commits + 自动生成让发布可信赖
- **知识沉淀与传承**：把散落在个人脑子里的经验固化成文档，团队不依赖「活文档」（某个唯一懂的人）
- **Docs as Code 提质量**：版本控制追踪历史、CI 检查死链/拼写、代码评审把关质量，文档与产品同步演进
- **Diagrams as Code 解痛点**：架构图用文本（Mermaid/PlantUML/D2）描述，可 diff、可版本化、告别「图与代码不一致」
- **建立技术影响力**：博客/文档/开源 README 是工程师的个人品牌，好的写作能撬动职业机会
- **强制清晰思考**：写不清楚往往是没想清楚；写作倒逼理解深度

**缺点 / 挑战**

- **耗时且见效慢**：好文档需反复打磨，不像写功能立竿见影，易被「没时间」挤压
- **易腐烂**：代码改了文档没更新，过时文档比没文档更危险（误导）；需 Docs as Code 流程保证同步
- **受众难把握**：写给初级还是高级、内部还是外部，深度与口径难平衡
- **图维护痛苦**：传统截图/拖拽画图工具产出的图无法 diff，改一处要重画；虽 Diagrams as Code 缓解但学习有成本
- **被低估**：很多团队/管理者不重视文档，认为是「写完代码再说」的附加品，导致文档债越积越多
- **工具碎片化**：Markdown/reST/AsciiDoc、Swagger/Redoc、Mermaid/PlantUML/D2、Confluence/Notion/GitHub Wiki——选型与迁移成本高
- **写作能力培养慢**：技术写作是「手艺」，需长期练习 + 反馈，无速成
- **AI 生成带来的质量风险**：LLM 能快速产出文档，但易产生看似正确实则错误的「幻觉」内容，仍需人工把关

## 文档地址

- [Write the Docs（全球技术写作社区）](https://www.writethedocs.org/)
- [Keep a Changelog（CHANGELOG 事实标准）](https://keepachangelog.com/)
- [Conventional Commits（提交规范）](https://www.conventionalcommits.org/)

## GitHub 地址

- [Mermaid（图表即代码，最流行）](https://github.com/mermaid-js/mermaid)

## 幻灯片地址

<a href="/SlideStack/technical-writing-slide/" target="_blank">技术写作</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=技术写作" target="_blank" rel="noopener noreferrer">技术写作测试题</a>
