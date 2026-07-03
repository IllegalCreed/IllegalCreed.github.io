---
layout: doc
outline: [2, 3]
---

# 入门：Flutter 是什么与怎么起步

> 基于 Flutter 3.44 · 核于 2026-07

## 速查

- **一句话**：Flutter 是 **Google 开源的 UI 框架**，用 **Dart** 语言、**自带渲染引擎自绘每一个像素**，一套代码跑移动 / Web / 桌面 / 嵌入式——控件全是纯 Dart 实现，**不调用系统原生控件**
- **vs React Native**：**RN「翻译」给系统画**（桥接真实原生控件，外观随 OS 变）；**Flutter「自己」画**（Impeller 引擎直接画像素，跨平台/跨版本外观一致）
- **Dart**：Google 出品、类 C 语法、面向对象、**静态强类型**（带推断）、**sound null safety**、**JIT + AOT 双编译**；入口固定为 `main()`；包生态在 **pub.dev**（**非 npm**）
- **核心心智**：**一切皆 Widget**（连 App 都是 Widget）＋ **声明式 `UI = f(state)`**（描述 UI 长什么样，而非怎么改；状态变则框架自动 diff 只更新变化处）
- **两种 UI 风格**：**Material**（`MaterialApp`/`Scaffold`/`AppBar`/`ElevatedButton`，Google 设计）与 **Cupertino**（`CupertinoApp`/`CupertinoButton`，iOS 风格）
- **起步**：装 SDK → `flutter doctor`（查环境）→ `flutter create my_app` → `flutter run`；常用 `flutter pub add <包>`、`flutter build apk|ipa|web`
- **热重载**：改代码存盘即 **Hot Reload**（**保留 App 状态**、仅 debug/JIT 模式，见 [Dart 编译、异步与热重载](./guide-line/dart-async-hotreload)）
- **版本坐标**：**Flutter 3.44 + Dart 3.12**（2026-05，Google I/O 2026）；Impeller 引擎 iOS 默认自 3.10、Android 默认自 3.27
- **进阶顺序**：先读 [Dart 与 Widget：三棵树与生命周期](./guide-line/dart-widgets) 吃透 Widget 范式 → 再读 [布局与约束系统](./guide-line/layout-constraints) 与 [状态管理](./guide-line/state-management)

## 一、Flutter 解决什么问题

Flutter 要回答的问题是：**能不能用一套代码，产出在各平台观感与性能都优秀、且外观完全一致的应用？** 它的答案很激进——**不包一层原生控件，而是自带渲染引擎、亲手画出每一个像素**。你看到的按钮、文本、滚动条，全部是 Flutter 框架用 Dart 实现并由引擎绘制的，而非系统提供的控件。

这带来两个直接结果：

- **一致性**：渲染引擎随 App 一起打包，同一份 UI 在 iOS 15 和 Android 14 上像素级一致，不受系统版本控件差异影响。
- **性能**：没有「JS 与原生之间序列化通信」这一层，Dart 直连图形引擎，动画与滚动天然流畅。

代价是：需要学 **Dart 语言 + Widget 范式**（学习曲线更陡），产物里含 Dart runtime（体积略大）。

## 二、与 React Native 的本质差异

这是最高频的对比考点，一张表说清：

| 维度 | Flutter | React Native |
| --- | --- | --- |
| **渲染** | **自绘**（引擎直接画像素，控制每个像素） | **桥接原生控件**（映射成系统真实视图） |
| **UI 控件** | 纯 Dart 实现，跨平台/跨系统版本**一致** | 包装系统原生控件，外观随 OS 版本变 |
| **语言** | Dart（静态类型，编译到原生机器码或 JS/Wasm） | JavaScript/TypeScript + JSX |
| **性能** | 无桥接/序列化开销，直连图形引擎 | 早期受 JS bridge 影响（新架构已改善） |
| **一致性** | 引擎随 App 打包 → 各系统版本表现一致 | 依赖 OS 实现 → 有差异 |
| **代价** | 学习曲线更陡（Dart + Widget）；产物略大 | 复用 JS 生态；产物略小 |

> 一句话记忆：**RN「翻译」给系统画（native widgets），Flutter「自己」画（self-drawn pixels）**。

## 三、Dart 是什么

Dart 是 Google 出品、为「任意平台的快应用」优化的语言：**类 C 语法、面向对象（万物皆对象、均继承 `Object`）、静态强类型**（带类型推断），并具备 **sound null safety**（编译器保证非空类型永不为 null）。它最独特的是 **JIT + AOT 双编译**——开发期用 JIT 支撑 Hot Reload，发布期用 AOT 编成原生机器码。程序入口固定是 `main()`，包管理与发布走 **pub.dev**（**不是 npm**）。

```dart
void main() {
  // Dart 字面量一律用单引号；字符串插值用 $ 或 ${...}
  const name = 'Flutter';
  final version = 3.44;
  print('Hello, $name ${version.toString()}');
}
```

Dart 语言的空安全、异步、并发等要点见 [Dart 编译、异步与热重载](./guide-line/dart-async-hotreload)。

## 四、声明式 UI 心智：`UI = f(state)`

Flutter 是**声明式**框架。命令式写法要你手动改 UI：「如果登录了就显示首页，否则显示登录页」，一旦状态变化，UI 很容易和状态失同步。声明式写法让你在 `build()` 里直接**描述 UI 应该长什么样**：

```dart
@override
Widget build(BuildContext context) {
  // 你只描述结果长什么样，状态一变，框架自动 diff 并只更新变化的部分
  return user.isLoggedIn ? const HomeScreen() : const LoginScreen();
}
```

好处是 **UI 恒等于 state**——你不再关心「怎么从旧 UI 改到新 UI」，框架通过 Element 树的 diff 高效完成最小更新（原理见 [Dart 与 Widget：三棵树与生命周期](./guide-line/dart-widgets)）。

## 五、怎么起步

Flutter 用 `flutter` CLI 管理整个生命周期。装好 SDK 后：

```bash
flutter doctor              # 体检：检查 SDK、Android/iOS 工具链、IDE 插件是否齐全
flutter create my_app       # 生成一个标准工程（含 Material 计数器示例）
cd my_app
flutter run                 # 在模拟器/真机上跑（默认 debug 模式，支持 Hot Reload）

flutter pub add http        # 从 pub.dev 加依赖（写进 pubspec.yaml）
flutter build apk           # 出 Android 包（AOT release）；还有 ipa / web / macos 等
```

- **`pubspec.yaml`** 是项目清单：声明依赖、SDK 约束、assets（图片/字体）等；`pubspec.lock` 锁版本。
- 开发时改完代码存盘，终端按 `r` 触发 **Hot Reload**（保留状态）、`R` 触发 Hot Restart。
- **模拟器只能跑 debug**；性能分析（profile）与上线（release）需真机，详见 [Dart 编译、异步与热重载](./guide-line/dart-async-hotreload) 的构建模式表。

## 六、最小示例：一切皆 Widget

下面这个「应用」本身就是 Widget，UI 由 Widget 组合而成：

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
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

`MaterialApp` → `Scaffold` → `AppBar` / `Center` / `ElevatedButton` 层层嵌套，就是「用组合构建 UI 树」。想区分有状态与无状态、理解生命周期，见下一页。

## 七、心智地图：接下来读什么

- 想搞懂 Widget 范式与底层「为什么高效」→ [Dart 与 Widget：三棵树与生命周期](./guide-line/dart-widgets)。
- 想写对界面、不再被 overflow 折磨 → [布局与约束系统](./guide-line/layout-constraints)。
- 想管理好数据流 → [状态管理](./guide-line/state-management)。
- 想懂渲染与性能 → [渲染引擎：Skia 到 Impeller](./guide-line/rendering-impeller)。
- 想吃透 Dart 编译、异步与热重载 → [Dart 编译、异步与热重载](./guide-line/dart-async-hotreload)。
- 速记表在 [参考](./reference)。
