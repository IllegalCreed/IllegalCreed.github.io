---
layout: doc
outline: [2, 3]
---

# 状态管理

> 基于 Flutter 3.44 · 核于 2026-07

## 速查

- **官方不钦定唯一方案**：从**内置手段起步**，复杂了再上包；「最佳选择取决于 App 复杂度、团队偏好与要解决的具体问题」
- **局部 vs 共享**：**Ephemeral（局部/临时）state** 用 `setState`（如一个开关、当前页码）；**App（共享）state** 才考虑上升到跨树方案
- **内置三件**：`setState`（最低层、单 Widget 内）／ `ValueNotifier` + `ValueListenableBuilder`（官方响应式原语、最小依赖）／ `InheritedWidget`（祖先→后代高效传递，**Provider 等库底层就用它**）
- **社区选型速记**：**小 → setState / ValueNotifier；中 → Provider / Riverpod；大/团队 → Bloc / Riverpod**
- **provider**：`InheritedWidget` 的官方友好封装，入门首选，`ChangeNotifier` + `Consumer`
- **Riverpod**：provider 作者重写，**编译期安全、无需 `BuildContext`**、可测试、支持 codegen（现代推荐）
- **Bloc / flutter_bloc**：事件 → 状态流（`Stream`），单向数据流，可预测/强测试，样板多（大型/团队）
- **其他**：GetX（一体化、API 极简、侵入强）、MobX（observable + codegen）、Redux、signals（细粒度信号）、flutter_hooks（复用有状态逻辑，常配 Riverpod）
- **收敛重建**：`setState` 只重建**该 `State` 的 `build` 子树**；范围过大就**拆小 Widget** 或加 `const`/局部 builder

## 一、官方立场：先内置，按复杂度升级

Flutter 官方**刻意不指定唯一的状态管理方案**。它的建议是：**从内置手段起步，当 App 变复杂时再引入第三方包**，并明确指出「最佳选择取决于你的 App 复杂度、团队偏好，以及你要解决的具体问题」，最后把你指向 pub.dev 的 `#state-management` 主题自行选择。

因此正确的学习姿势不是「一上来就学 Riverpod」，而是先分清**你的状态是局部的还是共享的**。

## 二、局部 state vs 共享 state

官方把状态分成两类，这是选型的第一个岔路口：

- **Ephemeral（局部 / 临时）state**：只属于**单个 Widget** 的状态，比如一个复选框的选中、`PageView` 的当前页、动画进度。**用 `setState` 就够了**，无需任何库。
- **App（共享）state**：需要在**多个 Widget / 多个页面**间共享的状态，比如登录用户、购物车、主题设置。这才需要「上升」到跨树的方案。

> 判断口诀：**只有这个 Widget 关心 → 局部，用 setState；别的地方也要读/改 → 共享，才考虑上升。**

## 三、内置手段（无需依赖）

| 手段 | 说明 | 适用 |
| --- | --- | --- |
| **`setState`** | 最低层，触发当前 `State` 重建 | 单个 Widget 内部的局部状态 |
| **`ValueNotifier` + `ValueListenableBuilder`** | 官方响应式原语，最小依赖 | 少量跨树的响应式更新 |
| **`InheritedWidget` / `InheritedModel`** | 祖先 → 后代高效传递；**Provider 等库底层就用它** | 自定义方案、理解原理 |

`InheritedWidget` 是理解所有状态管理库的地基——它让后代 Widget 通过 `context` 高效读取祖先数据，并在数据变化时精确通知依赖者：

```dart
class StudentState extends InheritedWidget {
  final String grade;
  const StudentState({required this.grade, required super.child, super.key});

  // 后代用 StudentState.of(context) 读取
  static StudentState of(BuildContext c) =>
      c.dependOnInheritedWidgetOfExactType<StudentState>()!;

  // 返回 true 才通知依赖者重建
  @override
  bool updateShouldNotify(StudentState old) => old.grade != grade;
}
```

`Theme.of(context)`、`MediaQuery.of(context)` 就是这个机制的官方应用（见 [Dart 与 Widget：三棵树与生命周期](./dart-widgets) 的 BuildContext 一节）。

## 四、社区主流包与选型

当内置手段不够用（样板多、跨页共享复杂）时，再上第三方包：

| 方案 | 心智 | 特点 / 选型 |
| --- | --- | --- |
| **provider** | `InheritedWidget` 的官方友好封装 | 入门首选，官方样例常用；`ChangeNotifier` + `Consumer` |
| **Riverpod** | provider 作者重写 | **编译期安全、无需 `BuildContext`**、可测试、支持 codegen；现代推荐 |
| **Bloc / flutter_bloc** | 事件 → 状态流（`Stream`），单向数据流 | 大型/团队协作、可预测、强测试；样板多 |
| **GetX** | 一体化（状态+路由+DI），API 极简 | 上手快、社区评价两极；侵入性强 |
| **MobX** | 响应式 observable + codegen | 细粒度响应 |
| **Redux** | 单一 store + reducer | 从 Web Redux 迁移者 |
| **signals** | 细粒度信号（新范式） | 新兴 |
| **flutter_hooks** | 类 React Hooks，复用有状态逻辑 | 常与 Riverpod 搭配 |

> **选型速记：小 → `setState` / `ValueNotifier`；中 → Provider / Riverpod；大 / 团队 → Bloc / Riverpod。**

### provider 一瞥

```dart
// 用 ChangeNotifier 承载共享状态，用 Consumer 在需要处订阅
class CartModel extends ChangeNotifier {
  final _items = <String>[];
  List<String> get items => List.unmodifiable(_items);
  void add(String x) {
    _items.add(x);
    notifyListeners(); // 通知订阅者重建
  }
}
```

### Riverpod 一瞥

Riverpod 的卖点是**不依赖 `BuildContext`、编译期发现错误、天然可测试**：

```dart
// provider 在顶层声明，读写不经过 context
final counterProvider = StateProvider<int>((ref) => 0);

// 在 Widget 里用 ref 读，值变即精确重建
class Counter extends ConsumerWidget {
  const Counter({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return Text('$count');
  }
}
```

## 五、性能：收敛重建范围

不管用哪种方案，都要记住 `setState`（以及库触发的更新）**只重建对应 `State` 的 `build` 子树**。若这个子树太大，重建成本就高。两条通用优化：

1. **拆小 Widget**：把「会变的部分」抽成独立的小 Widget，让重建只发生在它身上。
2. **善用 `const` 与局部 builder**：`const` 子树可被跳过重建（见 [Dart 与 Widget](./dart-widgets)）；`Consumer`/`ValueListenableBuilder` 等局部 builder 把订阅范围收窄到最小。

---

想理解重建背后「三棵树如何 diff 复用」，回看 [Dart 与 Widget：三棵树与生命周期](./dart-widgets)；异步数据如何进 UI（`FutureBuilder`/`StreamBuilder`），见 [Dart 编译、异步与热重载](./dart-async-hotreload)。
