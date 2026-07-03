---
layout: doc
outline: [2, 3]
---

# Dart 与 Widget：三棵树与生命周期

> 基于 Flutter 3.44 · 核于 2026-07

## 速查

- **分层架构**：**Framework（Dart）**：Material/Cupertino → Widgets → Rendering → Foundation；**Engine（C++）**：`dart:ui`、光栅化、文本、Dart runtime、Skia/Impeller；**Embedder（平台）**：入口/事件循环/线程/surface。每层只依赖下层
- **一切皆 Widget**：Widget = **不可变**的 UI 声明片段，用**组合**（composition over inheritance）构树；连 App 都是 Widget（`MaterialApp`/`CupertinoApp`）
- **Stateless vs Stateful**：`StatelessWidget` 无可变状态、纯由构造参数决定；`StatefulWidget` = **不可变的 Widget 配置 + 可变的 `State` 对象**，`State` **跨 rebuild 持久存在**，靠 `setState` 触发重建
- **State 生命周期**：`createState` → `initState`（只一次）→ `didChangeDependencies` → `build`（每次重建）→（`didUpdateWidget` / `setState`→`build`）→ `deactivate` → `dispose`（**必须在此释放 controller/订阅防泄漏**）
- **三棵树**：**Widget**（不可变蓝图·便宜·频繁重建）/ **Element**（可变·持久·diff 复用·即 `BuildContext`）/ **RenderObject**（做 layout+paint+hit-test）
- **为什么高效**：Widget 便宜可随意重建，Element 复用避免重建整棵渲染树 → 最小更新
- **BuildContext**：Widget 在 Element 树中的**位置句柄**；`Theme.of(context)`/`MediaQuery.of(context)`/`Navigator.of(context)` 靠它查祖先。**误用**：`initState` 里查 InheritedWidget、async 后用未 mounted 的 context、拿错层级 context（用 `Builder` 包一层）
- **key**：`ValueKey`/`ObjectKey`/`UniqueKey` 让同类型 Widget 重排/增删时正确复用 Element 与保留 State；`GlobalKey` 跨树访问 State（开销大、勿滥用）
- **const 构造**：编译期常量、同参共享同一实例，可跳过重建/减 GC → **能加就加**

## 一、分层架构

Flutter 是一个分层系统，每一层只依赖它下面的层、没有向上的特权访问，因此每层都可替换、可扩展：

```
Framework (Dart):  Material / Cupertino → Widgets → Rendering → Foundation(animation/painting/gestures)
Engine    (C++):   dart:ui 绑定、光栅化、文本布局、Dart runtime & 编译工具链、Skia/Impeller
Embedder  (平台):  Android(Java/C++)、iOS/macOS(Swift/ObjC)、Win/Linux(C++) —— 入口、事件循环、线程、surface
OS
```

你日常写的代码几乎全在最上面的 **Framework（Dart）** 层：用 Widget 描述 UI，Rendering 层负责布局与绘制，Engine 负责把它光栅化成像素（Skia/Impeller，见 [渲染引擎：Skia 到 Impeller](./rendering-impeller)），Embedder 负责与各平台的窗口、输入、线程对接。

## 二、一切皆 Widget

在 Flutter 里，**Widget 是不可变（immutable）的 UI 声明片段**，你通过**组合**（把小 Widget 拼成大 Widget）而非继承来搭建界面。连「应用」本身都是一个 Widget——`MaterialApp` 或 `CupertinoApp`。

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // build 返回一棵 Widget 子树：这就是用组合描述 UI
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Home')),
        body: Center(
          child: ElevatedButton(
            onPressed: () => debugPrint('Click!'),
            child: const Text('A button'),
          ),
        ),
      ),
    );
  }
}
```

因为 Widget 不可变，「更新 UI」不是去改某个 Widget，而是**用新的 Widget 树替换旧的**——这正是声明式 `UI = f(state)` 的落地方式（见 [入门](../getting-started)）。

## 三、StatelessWidget vs StatefulWidget

这是最基础的分类考点：

- **`StatelessWidget`**：**没有可变状态**，UI 完全由构造参数决定，`build()` 一次性描述结果。图标、静态文本、纯展示卡片都适合。
- **`StatefulWidget`**：由**两个类**组成——不可变的 `StatefulWidget`（配置）+ 可变的 `State`（数据）。关键点：**`State` 对象跨 rebuild 持久存在**（它的实例变量在重建间保留），而 Widget 本身仍然不可变。改状态要调 `setState()` 通知框架重建。

```dart
class MyCounter extends StatefulWidget {
  const MyCounter({super.key});

  @override
  State<MyCounter> createState() => _MyCounterState();
}

class _MyCounterState extends State<MyCounter> {
  int _count = 0; // 这个字段跨 rebuild 存活

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      // setState 标记脏 → 框架重新调用 build → UI 更新
      onPressed: () => setState(() => _count++),
      child: Text('Count: $_count'),
    );
  }
}
```

> 记住这句：**Widget 不可变，可变的是 `State`；`State` 跨 rebuild 存活，Widget 每次重建都是新实例。**

## 四、State 生命周期

`State` 从创建到销毁有一条清晰的生命周期，理解它能避开内存泄漏与 context 误用：

1. **`createState()`** —— 创建 `State` 对象。
2. **`initState()`** —— **只调一次**，初始化资源（controller、订阅、动画）；**此时不能用 `context` 去依赖 InheritedWidget**（依赖还没就绪）。
3. **`didChangeDependencies()`** —— 依赖的 InheritedWidget 变化时调用（`initState` 之后首次也会调一次）。
4. **`build()`** —— 每次 rebuild 都调，返回 Widget 子树。
5. **`didUpdateWidget(old)`** —— 父级用新配置重建同类型 Widget 时调用。
6. **`setState()`** —— 标记脏、触发 rebuild。
7. **`deactivate()` / `dispose()`** —— 移除时清理；**`dispose()` 里必须释放 controller / 取消订阅，否则内存泄漏**。

```dart
class _EditorState extends State<Editor> {
  final myController = TextEditingController();

  @override
  void dispose() {
    myController.dispose(); // 防泄漏：controller/animation/StreamSubscription 都要在这释放
    super.dispose();
  }
  // ...
}
```

> 生命周期速记：`createState → initState → didChangeDependencies → build →（didUpdateWidget / setState→build）→ deactivate → dispose`。

## 五、三棵树：Widget → Element → RenderObject

这是 Flutter 高效更新的核心机制，也是面试重灾区。运行时其实有**三棵树协同**：

| 树 | 性质 | 职责 |
| --- | --- | --- |
| **Widget 树** | 不可变、声明式、频繁重建、**廉价** | 配置蓝图（你写的代码） |
| **Element 树** | **可变、持久、跨帧缓存** | 桥梁：管理生命周期、diff 复用、把 Widget 绑到 RenderObject；**`BuildContext` 本质就是 Element** |
| **RenderObject 树** | 持久、**重** | 真正的 **layout / paint / hit-test**（`RenderBox` 等） |

关键洞察：**Widget 很便宜，可以随意整棵重建；Element 会尽量复用**——当新旧 Widget 类型与 `key` 匹配时，框架保留对应 Element（连带保留 `State` 与底层 RenderObject），只更新变化的属性，从而**避免重建整棵昂贵的渲染树**。

另外，一行代码常常展开成更深的树：`Container` 内部会按需插入 `ColoredBox`/`Padding`，`Text` 底层是 `RichText`，`Image` 底层是 `RawImage`——这些在 DevTools 的 Flutter Inspector 里都能看到。

## 六、BuildContext 与 key

**`BuildContext`** 是当前 Widget 在 Element 树中的**位置句柄**，每个 `build(context)` 都会收到它。它的主要用途是**沿树向上查找**：`Theme.of(context)`、`MediaQuery.of(context)`、`Navigator.of(context)` 都靠它定位祖先 InheritedWidget。

三个高频误用：

1. 在 **`initState`** 里用 `context` 查 InheritedWidget —— 依赖未就绪，应放到 `didChangeDependencies`。
2. **`async` 间隙后**继续用可能已卸载的 context —— 用 `if (context.mounted)` 守卫。
3. **拿错层级的 context** —— 比如在 `Scaffold` 外层 context 上调 `ScaffoldMessenger` 拿不到，需要用 `Builder` 包一层、拿到子级新 context。

**`key`** 则解决「同类型 Widget 重排/增删时如何正确复用」：`ValueKey`/`ObjectKey`/`UniqueKey` 让框架在列表项顺序变化时保住正确的 Element 与 `State`；`GlobalKey` 能跨树访问某个 State 或做唯一标识，但**开销大、勿滥用**。

配套优化：**能加 `const` 就加**——`const` 构造是编译期常量、同参共享同一实例（canonicalize），可让框架跳过该子树重建、减少 GC。

---

理解了 Widget 与三棵树，下一步看它们如何**排布尺寸与位置**——见 [布局与约束系统](./layout-constraints)；想知道状态怎么在多个 Widget 间共享，见 [状态管理](./state-management)。
