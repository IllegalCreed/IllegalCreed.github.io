---
layout: doc
---

# Dagster

**Dagster** 是 2018 年由 Nick Schrock（前 Meta/Facebook GraphQL 联合创始人）创立的**资产优先（Asset-centric）数据编排平台**——核心理念是「**以数据资产（Asset）为一等公民**」。与 Airflow「以 Task 为中心」、Prefect「以 Flow 为中心」不同，Dagster 让你**声明式地定义数据资产**（表、模型、报表）及其依赖关系，调度围绕「**资产是否最新**」展开。这种「资产优先」哲学让 Dagster 在数据治理、ELT、强类型场景独具优势。2026-07-13 被 Prefect 收购后，预计以 Prefect 名义运营，其资产能力将与 Prefect 的动态能力融合。

Dagster 的全部考点围绕「**Asset-centric + IO Manager + 类型系统**」展开：①**Software-defined Asset（软件定义资产）**——用 `@asset` 装饰器声明数据资产及其上游依赖，资产间的依赖图就是调度图，调度围绕「资产是否物化（materialized）/最新」展开；②**IO Manager**——自动管理 asset/op 的数据存储与加载（存哪儿、怎么序列化），开发者只需声明存什么，存哪儿交给 IO Manager；③**类型系统**——DagsterType/Pydantic 风格的强类型，运行时校验数据契约，提前发现 schema 漂移；④**op vs asset**——op 是传统的「无副作用任务」（类似 Airflow Task），asset 是「产出数据资产的任务」（现代推荐写法）；⑤**2026-07-13 被 Prefect 收购**——Prefect 收购 Dagster Labs，Dagster 的资产能力融入 Prefect，未来定位是「Prefect 的资产治理模块」。本叶是 Dagster 全章的总览与地基。

## 评价

**优点**

- **资产优先**：以数据资产为一等公民，资产依赖图即调度图，对数据治理/ELT 天然友好
- **数据感知强**：调度围绕「资产是否最新」展开，无需手动 Sensor 轮询（Airflow 2.x 的痛点）
- **IO Manager 解耦存储**：自动管数据存哪/序列化，开发者只声明存什么，存储变更不改业务代码
- **强类型系统**：运行时校验数据契约，提前发现 schema 漂移（Pydantic 风格）

**缺点**

- **学习曲线陡**：Asset/IO Manager/Resource/Type 概念多，比 Airflow/Prefect 入门难
- **生态较新**：集成数量不及 Airflow（十年积累），复杂场景要自己写
- **动态流程弱**：以资产为中心，动态流程（ML 超参搜索）不如 Prefect 灵活
- **被收购的不确定性**：2026-07 被 Prefect 收购后，长期产品路线图与独立性存疑

## 本叶地图

- [入门](./getting-started) —— Dagster 定义、Asset-centric 哲学、Software-defined Asset、IO Manager、类型系统、被 Prefect 收购后定位
- [Asset 优先：Software-defined Asset 与 IO Manager](./guide-line/asset-centric) —— `@asset` 装饰器、资产依赖图、物化（materialization）、IO Manager 解耦存储、op vs asset
- [类型系统、生态与被 Prefect 收购后定位](./guide-line/ecosystem-and-prefect) —— DagsterType/Pydantic 类型、Resource、Dagster 生态、2026-07 被收购的来龙去脉与重定位
- [参考](./reference) —— @asset/@op/@resource API 速查、IO Manager 类型、Dagster vs Prefect vs Airflow、易错点

## 幻灯片地址

<a href="/SlideStack/dagster-slide/" target="_blank">Dagster</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Dagster" target="_blank" rel="noopener noreferrer">Dagster 测试题</a>
