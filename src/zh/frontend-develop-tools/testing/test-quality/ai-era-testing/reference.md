---
layout: doc
outline: [2, 3]
---

# 参考

> 三方式按场景选，不按自动化程度排——决策表 + 原则方法 + 工作流速查

## 速查

- **三方式**：手工（人脑断言/判断力）、MCP+AI 跑 e2e（自然语言驱动浏览器/即时验证）、AI 写框架用例（五层 spec/CI 门禁）——**平权，按场景选**
- **决策一句话**：要立刻有结果且不值得写 spec → MCP；要人判断（好不好用/像不像需求）→ 手工；要长期反复跑守住不许坏 → AI 写用例
- **原则**：一致性 / 独立性 / 反向验证 / 分级覆盖（安全类 100%）/ 回归网 / bug-fail-first / 精确到 case
- **方法**：TDD（红绿重构）/ BDD（Given-When-Then）/ 五层 L1~L5 / 自测→报告→准入 / 提示词工作流
- **AI 防线**：反向验证 + 人评审粒度，揪假绿用例

## 三方式决策表（按场景选）

不是「按自动化程度从低到高排」，是「**这个场景哪种最划算**」：

| 你要做的事 | 选哪种 | 为什么 |
| ---------- | ------ | ------ |
| 探索性「点点看哪不对」、找意料之外的问题 | **手工** | AI 只会按剧本走，发散性靠人 |
| 判断好不好用 / 像不像需求 / UX 体验 | **手工** | 断言是人的判断，写不成 `expect` |
| 需求验收走查、合意性确认 | **手工** | 「正确」之上的「合意」要懂业务的人 |
| 提测准入抽查复现、核对自测报告 | **手工** | 「信不信得过」「抽哪几个」是人的判断 |
| 视觉还原 / 手势手感 / 真机兼容 | **手工** | 自动化成本极高或测不出「人感觉的不对」 |
| 改完随手验主流程还通不通（快速冒烟） | **MCP+AI** | 说句话就跑，比写 spec 快 |
| 临时验证（e2e 还没写） | **MCP+AI** | 空档期顶上，当下就知道有没有大问题 |
| bug 快速复现、读 console/网络 | **MCP+AI** | 灵活还原现场（再转框架 fail 用例） |
| a11y 快查（对比度/ARIA/焦点） | **MCP+AI** | Lighthouse/无障碍树即时体检 |
| 没 e2e 框架的项目要兜底 | **MCP+AI** | 零搭建就有「AI 跑一遍核心流程」 |
| 核心链路 / 安全类系统性覆盖 | **AI 写用例** | 五层 + 精确到 case，严谨不漏分支 |
| 回归网（每个 bug 永久守护） | **AI 写用例** | 长期反复跑是 git spec 主场 |
| TDD 新功能 / 重构保行为 | **AI 写用例** | 先 fail 再实现 / 既有用例当安全网 |
| CI 长期门禁、卡覆盖率回退 | **AI 写用例** | 确定可重复、能跑成百上千次 |

> **接力而非竞争**：开发中用 MCP 冒烟 → 验收时手工走查 → 沉淀时让 AI 写成 spec 进回归网。同一个功能三方式都用得上，按阶段切换。

## 错配对照（反过来用就是错）

| 错配 | 后果 |
| ---- | ---- |
| 拿 MCP 当 CI 回归门禁 | 断言松、易 flaky，守不住 |
| 拿手工去守回归网 | 每次发版人肉重点，又慢又漏 |
| 拿 AI 写用例做探索性 | AI 只按剧本走，发现不了意料之外 |
| 把「探索性/主观体验」硬塞框架 | 断言不出「好不好用」，测了个寂寞 |
| 把「稳定回归」一直手工点 | 纯浪费人力，迟早漏 |
| 把「一次性验证」写成框架 spec | 写完就过时，给自己挖维护坑 |

## 原则清单

| 原则 | 一句话 |
| ---- | ------ |
| **一致性** | 结果确定可复现：环境隔离（不连开发/生产库）、不依赖自增 ID/时间/随机 |
| **独立性** | 用例自带前置自己清理，不靠上一个用例的残留 |
| **反向验证** | 打 bug 用例必 fail、删安全类用例覆盖率必掉；纹丝不动就是假绿 |
| **分级覆盖** | 安全类 100%、业务核心 ≥85%/≥75%、业务一般 ≥70%/≥60%、框架不计 |
| **回归网** | 每个 bug 的复现用例永久保留，同类问题自测阶段就拦 |
| **bug-fail-first** | 禁裸修复：先写 fail 复现用例 → 修 → 转绿 |
| **精确到 case** | 禁模块名粒度；每方法 happy/边界/异常 + 逐副作用分支 + 反例 |

## 方法清单

| 方法 | 要点 |
| ---- | ---- |
| **TDD** | 红（写 fail 测试）→ 绿（最小实现）→ 重构；提示词显式写死「先 fail 再实现」 |
| **BDD** | Given-When-Then；`describe`/`it` 功能化命名，禁内部代号（Phase3/R1-1） |
| **五层 L1~L5** | 后端单元/集成 + 前端单元/组件/端到端；金字塔，L5 不计覆盖率 |
| **自测→报告→准入** | 研发自测产报告，QA 准入审查（核对+抽查）通过才开测 |
| **提示词工作流** | plan→评审→TDD→自测报告→准入→PR review，串成流水线 |

## 提示词集工作流速查

| # | 提示词 | 用途 |
| - | ------ | ---- |
| 1 | 写测试用例计划 | 编码前精确到 case 写 plan（五层/副作用/反例） |
| 2 | 执行测试计划（TDD） | **显式 TDD**：每 case 先 fail 再实现，逐层推进 |
| 3 | 生成自测报告 | 跑五层 + 覆盖率 + 反向验证 + 结论 |
| 4 | 测试准入审查 | QA 视角：完整性核对 + 抽查复现，不达标退回 |
| 5 | 缺陷修复 | fail-test-first 铁律，禁裸修复 |
| 6 | 测试计划评审 | 粒度守门，第一次被退回是常态 |
| 7 | PR 测试 review | 对应层齐全 / 真跑过 / 业务语义验证 |
| 8 | 覆盖率审计 + 反向验证 | 分类清单 + 实际数字 + 反向验证 ≥2 项 |
| 9 | Flaky / 残留数据排查 | 连跑 N 次复现 → 定位残留 → 精准清理 |
| 10 | 安全类清单维护 | 判断是否安全类 → 决定是否纳入 100% 门槛 |

> 顺序流：写 plan → ① → ⑥ → ② → ③ → 提测 → ④ → 测试 → 发现 bug ⑤ → ⑦。横向辅助 ⑧⑨⑩ 按需触发。

## 五层模型速查

| 层 | 名称 | 工具示例 | 启动应用/DB | 计覆盖率 |
| -- | ---- | -------- | ----------- | -------- |
| **L1** | 后端单元 | JUnit + Mockito | 否（全 mock） | 是 |
| **L2** | 后端集成 | `@SpringBootTest` + 真 DB | 是 | 是 |
| **L3** | 前端单元 | Vitest（不 mount） | 否（API mock） | 是 |
| **L4** | 前端组件 | Vitest + Vue Test Utils（mount） | 否 | 是 |
| **L5** | 端到端 | Playwright / Cypress + 真后端 | 是 | **否**（指标为通过率/flaky） |

> 比例参考（金字塔）：L1 ~50% / L2 ~20% / L4 ~15% / L3 ~10% / L5 ~5%。L5 膨胀多半是该下沉到 L1~L4 的逻辑被堆到了 e2e。

## 真实落地锚点

以 **beitou-survey-admin**（Vue 3 + TS + Element Plus 运维端）为例：

| 维度 | 落地 |
| ---- | ---- |
| L3/L4 | colocate `*.spec.ts`（37 个，composables/utils/stores/views）；`pnpm exec vitest run` |
| L5 | `cypress/e2e/*.cy.ts`（11 个 `admin-*-crud.cy.ts`，真后端 `btzh` 环境）；`pnpm test:e2e` |
| 覆盖率 | Vitest 内置 V8；引用通用分级门槛，无项目定制 |
| 环境隔离 | L5 用 `@Profile("test")` + 开关 + `@Anonymous` 三重隔离的 seed/cleanup 接口；数据打 runId 前缀，cleanup 只按标记删，禁 truncate |

## 链接

- 测试金字塔（Martin Fowler）：[https://martinfowler.com/articles/practical-test-pyramid.html](https://martinfowler.com/articles/practical-test-pyramid.html)
- Playwright：[https://playwright.dev/](https://playwright.dev/)
- Cypress：[https://www.cypress.io/](https://www.cypress.io/)
- Vitest：[https://vitest.dev/](https://vitest.dev/)
- MDN 跨浏览器测试：[https://developer.mozilla.org/zh-CN/docs/Learn/Tools_and_testing/Cross_browser_testing](https://developer.mozilla.org/zh-CN/docs/Learn/Tools_and_testing/Cross_browser_testing)
- 幻灯片：<a href="/SlideStack/ai-era-testing-slide/" target="_blank">AI 时代如何测试</a>
