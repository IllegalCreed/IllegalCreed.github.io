---
layout: doc
outline: [2, 3]
---

# 布局与约束系统

> 基于 Flutter 3.44 · 核于 2026-07

## 速查

- **黄金法则**：**「Constraints go down. Sizes go up. Parent sets position.」**——**约束向下传、尺寸向上报、父级定位置**；一趟布局（single pass，**O(n)**）
- **流程**：父传 4 个 double（min/max width、min/max height）→ 子在约束内自定尺寸并上报 → 父给每个子定 (x,y) → 父再向自己的父上报尺寸
- **紧约束 vs 松约束**：**紧**（min==max）子**必须**是这个精确尺寸（屏幕给根 Widget 就是紧约束）；**松**（min<max，常 min=0）子可在范围内自选（`Center` 给子松约束）
- **三类 Widget 行为**：①尽量大（`Center`/`ListView`/无尺寸 `Container`）②随子同大小（`Padding`/`Transform`/`Opacity`）③要特定尺寸（`Image`/`Text`/带 `width/height` 的 `Container`）
- **反直觉经典**：`Container(width:100,height:100)` **单独放会铺满全屏**（屏幕给紧约束）；包 `Center` 才是 100×100（拿到松约束）
- **Flex 家族**：`Row`/`Column` 主轴给子**无约束**→子取自然尺寸、太大则 **RenderFlex overflow**（黄黑条）；`Expanded`=强制填满剩余（`FlexFit.tight`）；`Flexible`=允许更小（`FlexFit.loose`）；`flex` 控比例
- **两大崩溃**：`RenderFlex overflowed by N pixels`（子超界→用 `Expanded`/`Flexible` 或换 `ListView`）；`BoxConstraints forces an infinite width/height`（Column 放无高 `ListView`、Row 放无宽 `TextField`→用 `Expanded`/`SizedBox`）
- **响应式**：`LayoutBuilder` 按 `constraints.maxWidth` 分支（如 <600 单栏，否则双栏）
- **UI 风格**：**Material**（`MaterialApp`/`Scaffold`/`AppBar`/`ElevatedButton`，Material 3 现代默认）vs **Cupertino**（`CupertinoApp`/`CupertinoButton`/`CupertinoPageScaffold`，iOS 风格）

## 一、黄金法则：约束向下，尺寸向上，父级定位置

Flutter 布局只有一句核心口诀，逐字记住：

> **Constraints go down. Sizes go up. Parent sets position.**
> 约束向下传，尺寸向上报，父级定位置。

它描述的是一趟自上而下再自下而上的过程（**single pass，O(n)**）：

1. 父 Widget 把**约束**（4 个 double：min/max width、min/max height）传给每个子。
2. 子在**这组约束允许的范围内**决定自己的尺寸，并**向上报告**。
3. 父拿到所有子的尺寸后，给每个子确定 **(x, y) 位置**。
4. 父再把自己的最终尺寸**向上报告**给它的父。

关键限制：**一个 Widget 只能在父给的约束内决定尺寸，且无法直接知道也无法决定自己在父中的位置**——位置由父说了算。很多「布局不听话」的困惑都源于忽略了这一点。

## 二、紧约束 vs 松约束

约束分两种，决定了子有没有「自主选尺寸」的余地：

- **紧约束（tight）**：`min == max`，子**必须**正好是这个尺寸。`BoxConstraints.tightFor(width: 100, height: 100)` 就是紧约束；**屏幕给根 Widget 的也是紧约束**（必须＝屏幕尺寸）。
- **松约束（loose）**：`min < max`（常见 `min = 0`），子可以在范围内**自选**任意尺寸。`Center` 给它的子的就是松约束。

这组区别是下面所有「反直觉」现象的根因。

## 三、三类 Widget 对约束的行为

面对父给的约束，Widget 大致分三类反应：

1. **尽量大**：把约束用满。`Center`、`ListView`、`Scaffold`、没设尺寸的 `Container`。
2. **随子（同子大小）**：把约束原样传给子、自己贴着子。`Padding`、`Transform`、`Opacity`、`Align`。
3. **要特定尺寸**：坚持自己的固有尺寸。`Image`、`Text`、带 `width/height` 的 `Container`。

## 四、经典反直觉例子

这是最高频的入门坑：

```dart
// ❌ 单独放：Container 的 100x100 被忽略，铺满全屏
Container(width: 100, height: 100, color: Colors.red)
// 原因：屏幕给它的是紧约束（必须 = 屏幕尺寸），Container 的 width/height 无从生效

// ✅ 包一层 Center：Center 给 Container 的是松约束 → Container 才能真的是 100x100
Center(child: Container(width: 100, height: 100, color: Colors.red))
```

记住：**`Container` 的 `width/height` 只是「首选尺寸」，能否生效取决于父给的约束是紧还是松。**

## 五、Flex 家族：Row / Column / Expanded / Flexible

`Row`（横向）与 `Column`（纵向）都属于 **Flex**，它们对子有个特别行为：**在主轴方向给子无约束**（像 `UnconstrainedBox`），让子取自然尺寸。所以子若在主轴上太大，就会撑出边界，触发 **RenderFlex overflow**（调试时可见黄黑警示条）。

解决办法是用 `Expanded` / `Flexible` 让子去瓜分**剩余空间**：

- **`Expanded`**：**强制**子填满剩余空间，子的首选尺寸被忽略（本质是 `FlexFit.tight`）；`flex` 控制多个 Expanded 间的比例。
- **`Flexible`**：允许子**更小**（`FlexFit.loose`）——最多占剩余空间，但也可以更小。

```dart
Row(
  children: [
    Expanded(flex: 1, child: Container(color: Colors.red)),
    Expanded(flex: 2, child: Container(color: Colors.green)), // 宽度比 1:2
  ],
);
```

其他约束相关 Widget 备查：`ConstrainedBox`（加约束）、`UnconstrainedBox`（去约束、超出会警告）、`OverflowBox`（去约束、静默）、`LimitedBox`（仅在无限约束时限制）、`FittedBox`（缩放子去填充，子必须有界）、`SizedBox`（定尺寸/占位）、`IntrinsicWidth`/`IntrinsicHeight`（按内容固有尺寸，**慢**）。

## 六、两大崩溃与排错

| 报错 | 场景 | 解法 |
| --- | --- | --- |
| **`RenderFlex overflowed by N pixels`** | `Column`/`Row` 的子在主轴超界 | 用 `Expanded`/`Flexible` 包裹，或换可滚的 `ListView` |
| **`BoxConstraints forces an infinite width/height`** | 给了无界约束的东西定尺寸：`Column` 里放无高的 `ListView`、`Row` 里放无宽的 `TextField` | 用 `Expanded` 或给定 `SizedBox`/明确尺寸 |

做**响应式布局**时用 `LayoutBuilder`，它把父给的 `constraints` 交到你手上，按 `constraints.maxWidth` 分支即可：

```dart
LayoutBuilder(
  builder: (context, constraints) {
    // 窄屏单栏、宽屏双栏
    return constraints.maxWidth < 600 ? const OneColumn() : const TwoColumns();
  },
);
```

## 七、Material vs Cupertino

Flutter 内置**两套设计语言**的完整控件族：

- **Material**：Google 的 Material Design，用 `MaterialApp`/`Scaffold`/`AppBar`/`ElevatedButton`/`FloatingActionButton` 等；**Material 3 是现代默认**（`useMaterial3`）。
- **Cupertino**：iOS 风格，用 `CupertinoApp`/`CupertinoButton`/`CupertinoNavigationBar`/`CupertinoPageScaffold` 等。

想「一套代码两端各自像原生」，可按 `Theme.of(context).platform` 或 `Platform` 选择控件，官方有 adaptive & responsive 指南可循。

> **2026 动向**：从 Flutter 3.44 起，Material 与 Cupertino 正逐步**从核心框架解耦**（走模块化方向），核心引擎与设计库的边界更清晰。

---

尺寸算好了，接下来是**怎么把它画成像素**——见 [渲染引擎：Skia 到 Impeller](./rendering-impeller)；布局中的重建范围与状态共享，见 [状态管理](./state-management)。
