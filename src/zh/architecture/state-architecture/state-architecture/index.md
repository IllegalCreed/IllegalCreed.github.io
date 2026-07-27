---
layout: doc
---

# 状态架构策略

状态架构策略是前端「应用状态如何组织」的一组架构层取舍——不绑定具体库的 API，而是回答四个维度的问题：①状态放在**本地还是全局**（组件内 `useState` / `ref` 还是中心化 store）；②状态以**响应式还是不可变**范式演进（Vue `reactive` / MobX `observable` 的可变依赖追踪 vs Redux / React `setState` 的不可变替换）；③状态拆成**原子化还是规范化**（Jotai / Recoil 的细粒度 atom 依赖图 vs Redux 的 `byId + allIds` 中心化范式）；④**数据流方向**是单向（Redux dispatch → reducer → state）、双向（Vue `v-model` 语法糖）、还是原子订阅（Jotai 直接订阅 atom）。这四个维度一旦在项目初期定下来，会决定后续重渲染性能上限、可调试性、SSR 序列化成本、团队协作门槛与状态演进路径——选错范式的代价会随应用规模线性放大。Kent C. Dodds 把「状态就近放置」（State Colocation）列为 React 性能首要原则，Redux 用三大原则（单一数据源 / 状态只读 / 纯函数变更）约束出可预测的 time-travel 调试，MobX/Vue 用 Proxy 自动构建依赖树让「任何能派生的都应自动派生」，Jotai/Recoil 用 atom 依赖图解决「深层嵌套兄弟组件共享状态」的难题。当下（2026）的总体走向是「三分法」：**服务端状态交给 Query 库（RTK Query / TanStack Query）、客户端 UI 状态用轻量 store/atom、关系型实体缓存用 normalized 或 Query 缓存**——取代了过去「所有状态塞进 Redux」的单一范式。

## 评价

**优点**

- **抽象先行，库在后**：把「状态怎么组织」与「用什么 API」解耦，决策可跨库迁移（Redux → Zustand、MobX → Pinia）
- **四维度正交**：本地/全局、响应式/不可变、原子/规范、单向/双向/原子，每维独立判断，组合出适合场景的范式
- **性能天花板可控**：colocate + 原子化 + 规范化三件套撑起大型应用最小重渲染范围
- **可调试性递进**：不可变 + 单向 = time-travel；响应式 + 自动追踪 = 最少样板；规范 = 数据一致性可推理
- **演进路径清晰**：从 `useState` 起步 → 提升到公共祖先 → 切原子化 / 中心化 store，colocate 是「持续重构」过程

**缺点**

- **决策面广，初学者易误判**：四维度任意组合共 16+ 种风格，没经验容易「一开始就选错」
- **跨范式迁移成本高**：从 Redux 单一 store 切到 Jotai atom 几乎是重写状态层
- **响应式与不可变存在哲学冲突**：混用（如 Redux + Immer + MobX）会让团队心智负担陡增
- **原子化对新项目友好、对老项目改造难**：atom 依赖图需要从零设计
- **「全局 store 万灵药」惯性**：团队习惯把所有状态塞 Redux，反模式难纠

## 文档地址

- [Redux 官方 - Three Principles](https://redux.js.org/understanding/thinking-in-redux/three-principles)
- [Redux 官方 - Normalizing State Shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)
- [Vue 官方 - Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [MobX 官方 README](https://mobx.js.org/README.html)
- [Kent C. Dodds - State Colocation](https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster)
- [Jotai 官方](https://jotai.org/)

## 幻灯片地址

<a href="/SlideStack/state-architecture-slide/" target="_blank">状态架构策略</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=708" target="_blank" rel="noopener noreferrer">状态架构策略 测试题</a>
