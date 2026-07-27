---
layout: doc
outline: [2, 3]
---

# 深度指南

> 基于 Martin Fowler「GUI Architectures / Passive View / Presentation Model」+ MDN MVC 词条 + React/Vue/Angular 官方文档编写，对照 2026-07 框架现状

## 速查

- **MVC 三角色**：Model（数据 + 业务逻辑，不感知 UI）/ View（展示，观察 Model）/ Controller（输入分发）
- **MVC 数据流**：用户输入 → Controller → 更新 Model → Model 发变更通知 → View 自行刷新；Controller **不直接 set View**
- **MVC 同步机制**：Observer Synchronization——多屏自动同步为优，隐式难追踪为缺
- **MVP 关键差异**：Presenter 完全中介，View 与 Model **彻底解耦**（无可见性）
- **MVP 两变体**：Passive View（Presenter 全权操纵 widget）/ Supervising Controller（简单同步仍走绑定）
- **MVVM 三特征**：ViewModel 是视图的抽象、不持 View 引用、靠 Data Binding + Change Notification 同步
- **React 三原则**：data flows down（props）/ events flow up（callback）/ Lifting State Up
- **Vue 数据流**：one-way-down；`v-model` = `:modelValue` + `@update:modelValue` 语法糖
- **Angular MVVM**：组件类 = ViewModel，模板 = View；`[(ngModel)]` banana in a box
- 可测试性：Passive View > MVVM/PM > Supervising Controller > 经典 MVC
- Humble Object：难测对象（View/DOM）只含最少行为，逻辑推到 Presenter/ViewModel
- 反模式：Fat Controller / View 直接观察 Model / 子组件 mutate prop / 深层双向绑定 / VM 持 View 引用

## MVC 三角色详解

### Model（模型）

- 持有**领域数据 + 业务规则**，例如「购物车总额不能为负」「邮箱格式校验」
- **完全自包含**：不知道有 View，也不依赖任何 UI 框架（无 React/Vue import）
- 提供**查询接口**给 View 读取状态，提供**命令接口**给 Controller 修改状态
- 维护**变更通知机制**（Observer Pattern）——状态变化时广播通知

> Fowler：Model 越纯越好。把业务规则写进 ViewModel/Presenter 是反模式——本应下沉到 Model 层的逻辑泄漏到表现层，会导致多视图无法复用同一业务规则。

### View（视图）

- **展示 Model 的当前状态**：读取 Model 数据并渲染
- **观察 Model 的变更通知**：收到通知后自行决定如何刷新（重新读取 / 局部更新）
- **转发用户手势**给 Controller：点击、输入、滚动等
- **不做业务决策**：最多做格式化（日期、货币、单位）

### Controller（控制器）

- **接收用户输入**，决定如何作用于 Model
- **不直接 set View 的值**——View 由 Model 的通知触发刷新，Controller 只更新 Model
- 可在多个 View 之间做协调（选择哪个 View 显示）

### MVC 数据流（必背）

```
1. 用户在 View 上点击 / 输入
2. Controller 接收事件，调用 Model 的命令接口
3. Model 更新状态，发出变更通知
4. 所有观察该 Model 的 View 收到通知
5. 各 View 自行重新读取 Model 状态并刷新
```

> 这条链路的关键：**Controller 永远不直接 set View 的值**。一旦 Controller 既改 Model 又改 View，就退化成反模式，丧失 MVC 自动多屏同步的优势。

## Observer Synchronization（观察者同步）

MVC 的同步机制——所有 View 与 Controller **观察** Model，Model 变更时**广播通知**，观察者各自决定如何响应。

**优点**

- **多屏自动同步**：同一个 Model 可以挂多个 View（列表 + 图表 + 详情），它们自动保持一致
- **解耦**：Model 不知道有哪些 View，View 之间也互不依赖
- **扩展性**：新增 View 不需要改 Model 也不需要改 Controller

**缺点**

- **隐式难追踪**：Model 一变触发一串 View 刷新，调试时难以一眼看出「这个 View 为什么变了」
- **级联更新风险**：View 收到通知后修改 Model → 又触发通知 → 死循环

> 这正是 MVP 与 MVVM 出现的动机：把更新链路变得**显式可追踪**。

## MVP：Presenter 完全中介

### MVP 与 MVC 的关键差异

| 维度 | MVC | MVP |
| --- | --- | --- |
| 中间层 | Controller | Presenter |
| View 对 Model 的可见性 | 有（观察 Model） | **零**（彻底解耦） |
| 谁主动操纵 View | View 自己刷新 | Presenter 显式 set |
| 同步机制 | Observer | Presenter 命令 |
| 可测试性 | 难 | 容易 |

### MVP 三角色

- **Model**：同 MVC，但**与 View 完全解耦**
- **View**：只是一个 widget 结构，**无 view/controller 分裂**，对外暴露 setter 给 Presenter 调用
- **Presenter**：**主动**响应用户手势、**完全中介** Model 与 View 之间的所有交互

### 数据流

```
1. 用户在 View 上点击 / 输入
2. View 把事件转发给 Presenter（不直接动 Model）
3. Presenter 调 Model 的命令接口
4. Model 更新状态
5. Presenter 从 Model 读新状态
6. Presenter 主动 set View 的各字段（View 是被动的）
```

## Passive View vs Supervising Controller

Fowler 把 MVP **拆成两个变体**，差别在于 Presenter 的工作量。

### Passive View（被动视图）

- Presenter **负责全部 widget 操纵**，包括数据填充（如 `view.setName(model.name)`）
- View 对 Model **零可见**——不知道 Model 存在
- View 只剩「显示 + 转发手势」的最简行为

**优点**

- **可测试性最高**：Presenter 是纯逻辑，可用 Test Double 替身 View 做单测
- **完全解耦**：换 UI 框架（如 Swing → Web）只需重写 View

**缺点**

- 样板代码爆炸：每个字段都要 Presenter 手动同步
- Fowler 直言：「**测试是 Passive View 的首要动机**」——如果不为测试，没必要这么彻底

### Supervising Controller（监督控制器）

- Presenter 只处理**复杂逻辑**（如条件着色、跨字段联动）
- **简单字段同步**仍由 View 通过**数据绑定 / 观察 Model** 完成（混合策略）
- View 对 Model 有可见性，但仅限于「读取并显示」

**优点**

- 样板代码大幅减少：简单同步让绑定机制处理
- 复杂逻辑仍然可测（在 Presenter 里）

**缺点**

- 可测试性稍弱：简单同步逻辑散落在 View，无法纯单测
- View 与 Model 重新有了依赖

> Fowler 建议：**按场景混合用**——简单字段走 Supervising，复杂联动走 Passive，没有非黑即白。

## MVVM = Presentation Model 特化

### 起源

- 2004 年 Martin Fowler 提出 **[Presentation Model](https://martinfowler.com/eaaDev/PresentationModel.html)**：把 View 的状态抽象成一个独立类（Presentation Model），与 View 同步靠事件
- 2005 年 John Gossman（Microsoft WPF 团队）在 WPF 上特化这一模式，借助 WPF 的**声明式数据绑定**，让 ViewModel 不必手写同步逻辑，称为 **Model-View-ViewModel（MVVM）**

### 三大特征

1. **ViewModel 是「视图的抽象」**：持有 UI 状态（选中态、启用态、错误提示）+ 展示逻辑（格式化、过滤、排序）
2. **ViewModel 不持有 View 引用**：完全靠 Data Binding + Change Notification 同步
3. **数据绑定是声明式的**：在模板里写 `{{ count }}` 或 `[value]="count"`，框架自动建立双向通道

### 数据流

```
1. 用户在 View 上输入
2. 通过数据绑定，输入自动写回 ViewModel 的属性
3. ViewModel 内部跑展示逻辑（可能调 Model）
4. ViewModel 通知框架属性变了
5. 框架自动重新渲染绑定到该属性的所有 View 节点
```

### 为什么 ViewModel 不能持 View 引用？

一旦 ViewModel 持 View 引用，就**退化成 MVP**——丧失声明式绑定的解耦优势，ViewModel 被钉死在特定 UI 框架上无法复用。Fowler 在 [Presentation Model](https://martinfowler.com/eaaDev/PresentationModel.html) 明确说：PM 引用 View 会增加耦合，违背模式初衷。

## 现代框架映射

### React：单向数据流（非 MVVM）

React 19（2024-12 GA）坚持**单向数据流三原则**：

1. **data flows down**：父组件通过 props 把数据向下传给子组件
2. **events flow up**：子组件通过 callback 把事件向上报给父组件
3. **Lifting State Up**：多个子组件需要共享状态时，把状态**提升到它们的共同父**

```tsx
// React 单向数据流示例
function Parent() {
  const [text, setText] = useState("");
  return <Child value={text} onChange={setText} />;
}

function Child({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}
```

**关键反模式警示**

- **子组件直接 mutate prop**：props 是只读的，子组件不能 `props.value = "x"`
- **受控/非受控混用且数据源不唯一**：同一字段既存组件内 state 又受父 props 驱动，会导致状态不一致。明确「**谁拥有这块状态**」保持 Single Source of Truth

> React **没有框架级双向绑定**——表单同步靠「受控组件 + setState」。强行套 MVVM（如手动写双向通道）会逆范式造成级联更新难追踪。

### Vue：one-way-down + v-model 语法糖

Vue 3.5（2024-09）数据流：

- **One-way-down binding**：父 → 子通过 props 传值，**props 只读**，子组件不可直接 mutate
- **`v-model` 是 syntactic sugar（语法糖）**，不是真正的双向绑定

```vue
<!-- 父组件 -->
<Child v-model="text" />

<!-- 编译后等价于 -->
<Child :modelValue="text" @update:modelValue="text = $event" />
```

子组件用 `defineModel()` 或传统的 `defineProps + defineEmits` 实现接受值 + 抛事件：

```vue
<script setup>
// Vue 3.4+ 推荐写法
const model = defineModel<string>(); // 自动是 ref，写 model.value 触发 emit
</script>
```

**关键反模式警示**

- **子组件直接 mutate prop**：触发警告并破坏单向数据流。应 emit 事件或用 `defineModel` / `computed` 代理
- **深层嵌套滥用 v-model**：多层组件两路绑定串联，级联更新难追踪。大状态用 store，跨层用 provide/inject 单向传递

### Angular：MVVM 直接实现

Angular 17-20（2024-2025）是 MVVM 的直接实现：

- **组件类 = ViewModel**：持状态、暴露方法
- **模板 = View**：声明式绑定到组件类
- **property binding `[ ]`**：ViewModel → View（数据向下）
- **event binding `( )`**：View → ViewModel（事件向上）
- **two-way binding `[( )]`**：香蕉盒子（banana in a box），是 `[ ]` + `( )` 的组合

```ts
// Angular 组件类 = ViewModel
@Component({
  template: `
    <input [(ngModel)]="name" />   <!-- banana in a box -->
    <span>{{ name }}</span>
  `,
})
export class HelloComponent {
  name = "World"; // ViewModel 状态
}
```

**`[(ngModel)]` 脱糖**：

```ts
<input [ngModel]="name" (ngModelChange)="name = $event" />
```

> Angular 17+ 已全面转向 **Signals**（`signal()` / `computed()` / `model()`）。`model()` 用于父子组件两路绑定，底层由 signal 驱动，zone.js 逐步可选化，变更检测更细粒度。

**关键反模式警示**

- **深层嵌套滥用 `[(ngModel)]`**：多层组件两路绑定串联，级联更新难以追踪、性能与调试双输——大状态用 store，跨层用 `provide/inject` 单向传递

## 可测试性排序（必背）

Fowler 在 [GUI Architectures](https://martinfowler.com/eaaDev/uiArchs.html) 给出的可测试性排序：

| 模式 | 可测试性 | 原因 |
| --- | --- | --- |
| **Passive View** | 最高 | Presenter 是纯逻辑，View 是被动壳子，Test Double 替身即可测 |
| **Presentation Model / MVVM** | 好 | ViewModel 不持 View 引用，纯逻辑测试 |
| **Supervising Controller** | 中 | 简单同步散落在 View，部分逻辑无法纯测 |
| **经典 MVC** | 最低 | View 与 Model 双向耦合，View 难脱离框架单测 |

> 这是 MVP / Presentation Model 出现的核心动机——Fowler 称 **Passive View 的首要动机就是可测试性**。

## Humble Object 原则

**Humble Object**（谦卑对象）原则：难测的对象（如 View/DOM）应该**只含最少行为**，把所有逻辑上推到可测的对象（Presenter/ViewModel）。

- View（DOM）难测因为依赖重、需要浏览器渲染器
- 把逻辑从 View 推到 Presenter/ViewModel 后，Presenter/ViewModel 可用 Test Double 做纯单测
- Fowler 把 **Passive View 与 Presentation Model 都归为 Humble Object 的体现**

```ts
// 反例：逻辑写进 View 组件，难测
function Counter() {
  const [count, setCount] = useState(0);
  const isEven = count % 2 === 0; // 业务逻辑（简化示例）
  const label = isEven ? "偶" : "奇";
  return <div>{count} ({label})</div>;
}

// 正例：逻辑推到 ViewModel（hook 或类），可单测
function useCounter() {
  const [count, setCount] = useState(0);
  const isEven = count % 2 === 0;
  return { count, setCount, label: isEven ? "偶" : "奇" };
}
// useCounter 可以单独测，不渲染任何组件
```

## 按场景选同步策略

**Fowler 建议**：按复杂度混合用，不要一刀切。

| 场景 | 推荐策略 |
| --- | --- |
| 简单字段同步（如显示文本） | 数据绑定 / Observer 自动同步 |
| 复杂交互（条件着色、跨字段联动） | Presenter/ViewModel 显式命令 |
| 表单（输入回写） | 受控组件（React）/ v-model（Vue）/ [(ngModel)]（Angular） |
| 跨组件共享状态 | 状态管理（Redux/Pinia） |
| 跨层传递 | provide/inject 单向（避免深层 v-model 串联） |

> 纯绑定写复杂逻辑 → 隐式魔法、难读难调；纯命令式写简单字段 → 样板代码爆炸。**边界在于「这块逻辑会不会增长到无法一眼看懂」**。

## 反模式（避坑）

- **Fat Controller / Massive View Controller**：Controller 同时塞业务逻辑 + 视图编排 + 数据访问（iOS/MVC 经典反模式）——应拆 Service/Repository，Controller 只做分发
- **View 直接访问 / 观察 Model（违反 Passive View/MVP）**：View 与 Model 双向耦合，Model 字段一变牵连所有 View，且 View 难单测
- **子组件直接 mutate prop（Vue 反模式）**：props 只读，直接赋值触发警告并破坏单向数据流——应 emit 事件或用 `defineModel` / `computed` 代理
- **深层嵌套滥用 v-model / [(ngModel)]**：多层组件两路绑定串联，级联更新难追踪、性能与调试双输——大状态用 store，跨层用 provide/inject 单向传递
- **Controller 直接操纵 View（MVC 退化）**：违背 Separated Presentation，Controller 既改 Model 又 set View，丧失 MVC 自动多屏同步优势
- **ViewModel 持有 View 引用（MVVM 退化为 MVP）**：丧失声明式绑定的解耦优势，VM 被钉死在特定 UI 框架上无法复用——Fowler 明确 PM 引用 View 会增加耦合
- **受控/非受控状态混用且数据源不唯一（React）**：同一字段既存组件内 state 又受父 props 驱动——应明确「谁拥有这块状态」保持 Single Source of Truth
- **把领域业务规则写进 ViewModel/Presenter**：本应下沉到 Model 层的逻辑泄漏到表现层，导致多视图无法复用同一业务规则

## 与相邻章的边界

- **状态管理章**（Redux/Pinia/Flux/Zustand）：讲集中式状态容器（store/action/reducer/getter）的实现，本章只讲模式层面的 View-Logic-Data 分层
- **组件通信章**（props/emit/provide-inject/EventBus/slot）：讲微观父子/兄弟传值机制，本章讲宏观架构选型
- **设计模式章**（GoF：Observer/Singleton/Strategy 等）：本章只覆盖与 UI 架构直接耦合的派生（MVC Observer Sync、Passive View 的 Humble Object），通用 GoF 归设计模式章
- **框架基础章**（React/Vue/Angular API 教学）：本章是架构层、讲设计哲学归属与模式映射，不重复讲具体 API 语法

## 下一步

- [参考](./reference.md)：三模式对比表、框架映射表、官方资源
