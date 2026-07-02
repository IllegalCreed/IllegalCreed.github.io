---
layout: doc
outline: [2, 3]
---

# shared 版本治理

> 基于 Module Federation 2.0（v2.6 2026-06） · 核于 2026-07

## 速查

- **本页只谈治理决策**，不重复机制：三路线通论（externals+import maps / MF shared / 不共享）见[核心机制 · 依赖共享三路线](../../mfe-mechanisms/guide-line/dependency-sharing)，`shared` 字段语法见[构建工具章 · webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)。
- **核心矛盾**：MF 把依赖版本的裁决从「构建期集中裁定」搬到「**运行时现场协商**」——换来独立部署，代价是**版本不再由任何单点掌控**，必须用治理策略补回确定性。
- **双端声明是硬前提**：共享是「注册 + 消费」的双向协议，生产者与消费者**都要**在 `shared` 声明同一 `shareKey`；只有一端声明 = 共享静默失效、页面双份依赖（无报错，最阴险）。
- **singleton 的必然后果**：版本冲突时**最高版本获胜、低版本方仅得控制台告警**——你实际运行的版本由**页面里版本最高的参与者**决定，**本地 lockfile 说了不算**。React/Vue 这类全局状态库必须 singleton。
- **治理三档**（从宽到严）：不设 requiredVersion（全凭 semver）→ **requiredVersion**（不合只告警）→ **strictVersion**（不合就拒绝：有 fallback 用 fallback，无 fallback 直接运行时抛错）。
- **strictVersion 是把「软告警」变「硬失败」的开关**：它把「版本漂移」从潜伏的运行期 bug 提前成**可在联调/CI 暴露的显式错误**——用可控的失败换不可控的诡异。
- **shareStrategy 是可用性决策**：`version-first`（默认，启动即拉全部 remote 保证版本最优 → **任一 remote 离线则启动即炸**）vs `loaded-first`（按需、容错好但版本可能非全局最优）——生产环境 remote 可用性无保证时选后者 + 错误兜底。
- **shared 名单要「按需最小」**：Fowler 警告——每加一个共享项就多一分**构建时耦合**，共享名单越长，被锁死的「协同升级」范围越大。从「不共享」起步，只共享大而全局的（React/设计系统）。
- **版本收敛是根治手段**：治理版本地狱不能靠 lockfile，要靠**让所有参与方的版本范围主动收敛**（统一升级节奏、共享 preset、CI 校验 manifest 版本），把「最高版本获胜」变成「大家本就同版本」。
- **谁拥有 shared 名单**：这是**平台/架构组的一等职责**，不能让各业务团队各自决定——需要一份**中心化的共享依赖契约**（哪些库共享、singleton 与否、版本基线），业务方遵从。
- **mf-manifest.json 是版本治理的可观测抓手**：清单里记录了每个 remote 声明的 shared 版本，可被 CI/DevTools 采集做**跨 remote 版本一致性巡检**（2.0 才有的能力）。
- **混用红线**：同一依赖**不要**同时走 import maps 与 MF shared——两套解析各自为政，双份实例、singleton 名存实亡（single-spa 官方立场，详见通论页）。

## 一、为什么 shared 是治理问题而非配置问题

依赖共享的**机制**（singleton 怎么协商、requiredVersion 默认值、子路径尾斜杠）在[依赖共享三路线](../../mfe-mechanisms/guide-line/dependency-sharing)已逐条讲透，字段**语法**在 [webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)。本页不重复这些。本页要回答的是配置文档不会讲的问题：**当依赖版本的裁决从构建期搬到运行时之后，一个多团队组织该用什么策略把「确定性」补回来？**

这个问题的根源是 MF 的一次**权力转移**：

| | 集中裁定（externals + import maps） | 运行时协商（MF shared） |
| --- | --- | --- |
| 版本裁决者 | import map 维护者（**单点、可审计**） | share scope 里的最高版本参与者（**分散、动态**） |
| 何时确定 | 部署时（改一行 JSON） | **运行时**（页面加载那一刻现场协商） |
| 你的 lockfile | 基本等于真相 | **可能说了不算** |

运行时协商买到的是**独立部署**（remote 换版本不必惊动 host），卖出去的是**版本的可预测性**。治理，就是用策略把卖出去的那部分**有选择地赎回来**。

## 二、singleton 与 lockfile 失效：治理的靶心

治理要瞄准的头号现象，是 singleton 带来的**「你跑的不是你锁的版本」**。机制页已给出裁决规则：`singleton: true` 时 scope 内只留一份，**版本不一致则加载较高版本、低版本方收到控制台告警**。把它翻译成架构语言：

> 你在 `package.json` 锁了 `react@18.2.0`，但某个 remote 带着 `react@18.3.1` 进场——**整个页面跑的就是 18.3.1**。这不是 bug，是 singleton 的**定义行为**。

这条对治理的三个直接启示：

1. **lockfile 不是防线**。指望「我锁死版本就安全」在 MF 下失效——防线必须建在**所有参与方的版本范围收敛**上，而不是单方 lockfile。
2. **最高版本获胜 = 升级风险会「传染」**。一个团队激进升级 React，可能让所有共享它的 remote 被动跑上新版本——治理要管住**谁能推高共享库的下限**。
3. **告警不等于安全**。低版本方只收到「控制台告警」而非报错，很容易被忽略，直到某个 API 在新版被移除才炸——治理要决定**这种告警要不要升级成硬失败**（见下节 strictVersion）。

## 三、治理光谱：从 semver 到 strictVersion

MF 提供的策略字段，本质是一条**「宽容 ↔ 严格」的调节光谱**。治理就是为不同依赖**选择光谱上的档位**：

```text
宽 ────────────────────────────────────────────► 严
 不设 requiredVersion      requiredVersion         strictVersion
 （纯 semver 协商）        （不合 → 控制台告警）    （不合 → 拒绝该共享）
 图省事、风险自负          默认档、能跑但会漂        有 fallback 用 fallback
                                                   无 fallback → 运行时抛错
```

**怎么选档，是治理决策**：

- **全局状态库**（React、Vue、Angular、状态管理）→ **singleton + 收敛的 requiredVersion**，甚至对关键库上 **strictVersion**：宁可在联调期显式炸掉，也不要两份 React 实例悄悄引发 hooks 崩溃。
- **无状态工具库**（lodash、dayjs）→ 可以宽松，甚至**不共享**（各自带一份、体积可接受，换独立升级权）。
- **设计系统 / 内部 SDK** → singleton + strictVersion + 明确的版本基线：它是跨团队一致性的载体，版本漂移的后果最直接（UI 不一致、API 断裂）。

`strictVersion` 的治理价值常被低估：它把**版本漂移**这个「潜伏到生产才发作」的 bug，**提前到联调 / CI 阶段以显式错误暴露**。用一次可控的、看得见的失败，换掉一堆不可控的、诡异的运行期怪象——对关键共享库，这笔交易通常划算。

## 四、shareStrategy：把版本策略连到可用性

`shareStrategy` 表面是「协商积极程度」，实质是一道**可用性 / 容错决策**，架构层必须显式选择：

| 策略 | 行为 | 代价 / 适用 |
| --- | --- | --- |
| **`version-first`**（默认） | 初始化即**拉一遍所有 remote 的入口**，登记各家版本以保证「最高版本」裁决准确 | **任一 remote 离线 → 启动期加载失败（白屏）**；适合 remote 高可用、要严格版本最优 |
| **`loaded-first`** | 优先复用**已加载**的副本，remote 按需再拉 | 版本裁决可能非全局最优，换来**启动性能 + 离线容错**；适合 remote 可用性无保证的生产系统 |

治理结论很直接：**默认的 `version-first` 把「版本正确性」置于「可用性」之上**——它假设所有 remote 都在线。一旦某个 remote 挂了，启动期就在共享协商阶段失败。生产系统若无法保证每个 remote 的可用性，应显式改用 `loaded-first` 并配错误兜底，把「一个 remote 拖垮整站」的风险摘掉。这是**架构决策**，不是能默认糊弄过去的配置项。

## 五、组织治理：谁拥有 shared 名单

MF 的 shared 失控，几乎都源于**没有单一负责人**——每个团队在自己的 `shared` 里各写各的版本，最终在运行时撞车。有效治理需要三件组织层的事：

1. **中心化的共享依赖契约**。由平台/架构组维护一份「共享依赖清单」：哪些库进 share scope、哪些 singleton、版本基线是什么、哪些上 strictVersion。业务方**遵从而非各自决定**——这等价于给「运行时协商」加了一层「组织级约定」。
2. **版本收敛机制**。用共享的构建 preset / 依赖版本策略（如统一的 renovate/依赖机器人节奏）让所有 remote 的关键库版本**主动趋同**——目标是让「最高版本获胜」退化成「大家本就同版本」，从根上消灭漂移。
3. **可观测巡检**。**mf-manifest.json（2.0）** 把每个 remote 声明的 shared 版本结构化地写进了清单——CI 可以采集所有 remote 的 manifest，做**跨 remote 版本一致性检查**，在合入前就发现「某 remote 悄悄把 React 下限抬高了」。这是 2.0 相比裸 remoteEntry 才有的治理抓手（生态见 [MF 2.0 生态](./mf2-ecosystem)）。

最后两条底线来自通论页、值得在治理清单里钉死：**① shared 名单按需最小**——每个共享项都是一份「必须协同升级」的构建耦合（Fowler），从「不共享」起步、只共享大而全局的；**② 同一依赖不要混用 import maps 与 MF shared**——两套解析体系互不知晓，混用必然双份实例、singleton 名存实亡。

## 六、落地：一份共享依赖契约示例

把前面的策略收敛成一张**可以直接抄的契约表**——这正是平台/架构组该维护、业务方该遵从的东西：

| 依赖 | 共享？ | singleton | 版本策略 | 理由 |
| --- | --- | --- | --- | --- |
| `react` / `react-dom` | ✅ | ✅ | **strictVersion** + 收敛基线 | 全局内部状态，两份实例必崩；关键库宁可 CI 炸 |
| `react-dom/`（尾斜杠） | ✅ | ✅ | 同上 | 漏尾斜杠 → `react-dom/client` 打进第二份 |
| 设计系统 `@org/ui` | ✅ | ✅ | strictVersion | 跨团队一致性载体，漂移即 UI 断裂 |
| 状态管理 `@org/store` | ✅ | ✅ | strictVersion | 单实例才有意义 |
| `dayjs` / `lodash` | ❌（各自带） | — | — | 无状态、体积小，换独立升级权 |
| 业务小工具 | ❌ | — | — | Fowler：小到可以重复 |

配套三条运维约定：**① `shareStrategy` 按 remote 可用性选**（无保证 → `loaded-first` + 错误兜底）；**② CI 采集各 remote 的 mf-manifest.json 做版本一致性巡检**；**③ 契约变更走评审**——谁想抬高某个共享库的下限，必须让全体参与方一起升（因为「最高版本获胜」会把升级传染给所有人）。

## 七、反模式清单

- **只在一端声明 shared** —— 静默双份依赖、无报错，靠 bundle 分析才发现；务必**双端同 `shareKey`**。
- **漏尾斜杠** —— `shared: ['react-dom']` 拦不住 `react-dom/client`，第二份 React DOM 破坏单例（hydration 报错）。
- **拿 lockfile 当版本防线** —— singleton 下实际版本由最高参与者定，lockfile 说了不算；防线在**全体收敛**。
- **默认 `version-first` 上生产、却不保证 remote 可用** —— 一个 remote 离线 = 启动即白屏。
- **同一依赖混用 import maps + MF shared** —— 双份实例、singleton 名存实亡（通论红线）。
- **shared 名单只增不减** —— 每个共享项都是一份协同升级负担，定期审计、砍掉不必共享的。

## 小结

shared 的机制在通论页、语法在 webpack 章；本页只做一件事——把「运行时协商」这个买来独立部署、卖掉版本确定性的交易，用治理策略**有选择地赎回**。治理的靶心是 singleton 的「最高版本获胜 + lockfile 失效」：防线不在单方 lockfile，而在**全体版本收敛**。手段是那条从 semver 到 strictVersion 的光谱——为全局状态库选严、为无状态工具选宽甚至不共享；`shareStrategy` 则是连着可用性的容错决策，`version-first` 的默认值把版本正确性置于可用性之上，生产系统需按 remote 可用性显式取舍。组织层面，shared 名单必须有单一负责人 + 中心契约 + 基于 mf-manifest.json 的 CI 巡检。把这些做对，MF 才敢在多团队规模上跑。这套治理能力属于 MF 2.0 的运行时化重构——它是怎么来的，见下一页：[MF 2.0 运行时化](./mf2-runtime)。
