---
layout: doc
outline: [2, 3]
---

# Flutter 参考

> 基于 Flutter 3.44 · Dart 3.12 · 核于 2026-07

## 速查

- 版本：**Flutter 3.44 + Dart 3.12**（2026-05，Google I/O 2026）；Impeller **iOS 默认自 3.10、Android 默认自 3.27**；null safety **Dart 3 起强制**
- 三棵树：**Widget**（蓝图·便宜）/ **Element**（持久·diff 复用·即 `BuildContext`）/ **RenderObject**（layout+paint）
- 约束法则：**Constraints go down. Sizes go up. Parent sets position.**（一趟 O(n)）
- 最常踩：`Container(width)` 单独放会铺满全屏（需 `Center`）、`Row/Column` 主轴 overflow（用 `Expanded`）、`initState` 里用 context 查 InheritedWidget、`async` 后用未 mounted 的 context、CPU 密集卡 UI（用 isolate）、Hot Reload 改 `main`/`initState` 不生效

## 一、版本坐标

| 项 | 值 |
| --- | --- |
| Flutter 最新稳定 | **3.44**（2026-05，Google I/O 2026） |
| Dart | **3.12** |
| Impeller iOS 默认 | **Flutter 3.10**（Metal，Skia 已移除） |
| Impeller Android 默认 | **Flutter 3.27**（Vulkan，API 29+） |
| Dart sound null safety 强制 | **Dart 3.0** |
| 包仓库 | **pub.dev**（非 npm） |
| 支持平台 | iOS / Android / Web / Windows / macOS / Linux / 嵌入式 |

## 二、三棵树

| 树 | 性质 | 职责 |
| --- | --- | --- |
| **Widget** | 不可变、频繁重建、廉价 | 配置蓝图（你写的代码） |
| **Element** | 可变、持久、跨帧缓存 | diff 复用、绑定 Widget↔RenderObject；**即 `BuildContext`** |
| **RenderObject** | 持久、重 | layout / paint / hit-test |

## 三、约束法则

- **Constraints go down. Sizes go up. Parent sets position.**（约束向下、尺寸向上、父级定位置，一趟 O(n)）
- **紧约束**（min==max）子必须服从；**松约束**（min<max）子可自选。
- `Row`/`Column` 主轴给子**无约束** → 易 overflow；用 `Expanded`（强制填满，`FlexFit.tight`）/ `Flexible`（可更小，`FlexFit.loose`）。

## 四、State 生命周期

`createState → initState（只一次）→ didChangeDependencies → build（每次）→（didUpdateWidget / setState→build）→ deactivate → dispose（释放 controller/订阅）`

## 五、状态管理选型

| 方案 | 一句话 |
| --- | --- |
| **setState** | 最低层，局部/临时状态 |
| **ValueNotifier + ValueListenableBuilder** | 官方响应式原语，最小依赖 |
| **InheritedWidget** | 祖先→后代传递，Provider 等底层就用它 |
| **provider** | `InheritedWidget` 官方友好封装，入门首选 |
| **Riverpod** | 编译期安全、无需 context、可测试（现代推荐） |
| **Bloc / flutter_bloc** | 事件→状态流，单向数据流（大型/团队） |
| GetX / MobX / Redux / signals / flutter_hooks | 一体化 / observable / 单 store / 信号 / 逻辑复用 |

> 选型速记：**小 → setState/ValueNotifier；中 → Provider/Riverpod；大/团队 → Bloc/Riverpod**。

## 六、渲染 / Impeller

| 平台 | 后端 | 默认 |
| --- | --- | --- |
| iOS | Metal | 默认自 3.10（Skia 已移除） |
| Android | Vulkan（API 29+，OpenGL 回退） | 默认自 3.27 |
| macOS | Metal | 实验 / opt-in |
| Web | CanvasKit（默认）/ Skwasm（`--wasm`） | 不支持 Impeller（基于 Skia） |

- Impeller 核心：**构建期预编译 shader/PSO**，消除 shader compilation jank。
- 渲染管线：**Build → Layout → Paint → Composite & Rasterize**。
- Android 关闭：`flutter run --no-enable-impeller` / `AndroidManifest.xml` 设 `EnableImpeller=false`。

## 七、Dart 空安全速记

| 记号 | 含义 |
| --- | --- |
| `int` / `int?` | 非空 / 可空 |
| `!` | 断言非空（为 null 抛异常） |
| `late` | 延迟初始化，用前必须赋值 |
| `required` | 必填命名参数 |
| `??` / `?.` | 空合并 / 空安全调用 |
| `!= null` 后 | 类型提升（promotion） |

## 八、异步与 isolate

| API | 用途 |
| --- | --- |
| `Future` + `async`/`await` | 单个异步值（≈ Promise） |
| `Stream` + `async*`/`yield` / `await for` | 异步事件序列；UI 用 `StreamBuilder` |
| `Isolate.run(fn)` | 一次性重计算（最常用） |
| `compute(fn, msg)` | Flutter 封装；**Web 无 isolate → 退回主线程** |
| `Isolate.spawn` + Port | 长期存活、多次收发 |

> `async/await` 不开线程、不解决 CPU 密集卡顿；重计算要 isolate。isolate 各自独立内存、只靠消息传递。

## 九、Hot Reload vs Restart

| | Hot Reload | Hot Restart | Full Restart |
| --- | --- | --- | --- |
| 状态保留 | ✅ | ❌ | ❌ |
| 重跑 `main`/`initState` | ❌ | ✅ | ✅ |
| 重编原生代码 | ❌ | ❌ | ✅ |

失效需 Restart：改 `main`/`initState`、全局/静态初始化器、enum↔class、泛型签名增删、原生代码。

## 十、构建模式

| | Debug | Profile | Release |
| --- | --- | --- | --- |
| 编译 | JIT | AOT | AOT |
| Hot Reload | ✅ | ❌ | ❌ |
| 用途 | 开发 | 真机性能分析 | 上线 |

> 模拟器只跑 debug；profile/release 需真机。

## 十一、Widget 分类速查

| 类别 | 常用 Widget |
| --- | --- |
| 基础 | `Container` `Row` `Column` `Stack` `Center` `Padding` `SizedBox` `Text` `Icon` `Image` |
| 布局约束 | `Expanded` `Flexible` `ConstrainedBox` `FittedBox` `LayoutBuilder` `Wrap` `Align` |
| Material | `Scaffold` `AppBar` `ElevatedButton`/`TextButton`/`OutlinedButton` `FloatingActionButton` `Card` `ListTile` `TextField` `Drawer` |
| Cupertino | `CupertinoApp` `CupertinoButton` `CupertinoNavigationBar` `CupertinoPageScaffold` |
| 滚动 | `ListView(.builder)` `GridView` `SingleChildScrollView` `CustomScrollView` + Slivers（`SliverAppBar`） |
| 异步 | `FutureBuilder` `StreamBuilder` |
| 交互 | `GestureDetector` `InkWell` `Dismissible` |

## 十二、CLI 速查

```bash
flutter doctor                         # 体检环境
flutter create my_app                  # 新建工程
flutter run [--profile|--release] [--no-enable-impeller] [--wasm]
flutter build apk|ipa|web|macos        # 出包（AOT）
flutter pub add <包> / flutter pub get # 依赖（pub.dev）
flutter test                           # 跑测试
flutter upgrade                        # 升级 SDK
```

## 十三、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | `Container(width:100)` 单独放会铺满全屏（屏幕给紧约束）；需 `Center` 拿松约束 |
| 2 | `RenderFlex overflow` / infinite constraints：Column 放无高 `ListView`、Row 放无宽 `TextField` → 用 `Expanded` |
| 3 | `setState` 只重建该 `State` 的 `build` 子树；范围过大 → 拆小 Widget 或加 `const` |
| 4 | 能加 `const` 就加：编译期常量、同参共享实例，跳过重建、减 GC |
| 5 | BuildContext 误用：`initState` 查 InheritedWidget、`async` 后用未 mounted 的 context（需 `context.mounted`）、拿错层级（用 `Builder`） |
| 6 | Impeller 构建期预编译 shader 消除 jank；iOS 默认 3.10 / Android 默认 3.27 / Web 仍 Skia 系 |
| 7 | Dart null safety：`?`/`!`/`late`/`required`/`??`/`?.`；Dart 3 强制 sound |
| 8 | JIT vs AOT ↔ debug vs release：Hot Reload 仅 debug/JIT，release 是 AOT 无热重载 |
| 9 | `async/await` 不解决 CPU 密集卡顿，重计算用 `Isolate.run`/`compute`；Web 无 isolate |
| 10 | Hot Reload 不生效：改 `main`/`initState`、全局/静态初始化器、enum↔class、泛型签名、原生代码 |
| 11 | key：`ValueKey`/`ObjectKey`/`UniqueKey` 让同类型 Widget 重排时复用 Element 与保留 State；`GlobalKey` 开销大勿滥用 |
| 12 | 三棵树：Widget（蓝图·便宜）/ Element（持久·diff 复用·即 BuildContext）/ RenderObject（layout+paint） |
| 13 | Flutter 用 Dart（非 JS）、包在 pub.dev（非 npm）；`main()` 是固定入口 |
| 14 | Flutter 自绘像素（区别于 React Native 桥接原生控件） |

## 十四、权威链接

- [Flutter 官网](https://flutter.dev/) · [Flutter 文档站](https://docs.flutter.dev/)
- [Architectural Overview](https://docs.flutter.dev/resources/architectural-overview) · [Understanding constraints](https://docs.flutter.dev/ui/layout/constraints)
- [State management options](https://docs.flutter.dev/data-and-backend/state-mgmt/options) · [Widget catalog](https://docs.flutter.dev/ui/widgets)
- [Impeller rendering engine](https://docs.flutter.dev/perf/impeller) · [Web renderers](https://docs.flutter.dev/platform-integration/web/renderers)
- [Hot reload](https://docs.flutter.dev/tools/hot-reload) · [Build modes](https://docs.flutter.dev/testing/build-modes) · [Isolates](https://docs.flutter.dev/perf/isolates)
- [Dart 官网](https://dart.dev/) · [Sound null safety](https://dart.dev/null-safety) · [Concurrency](https://dart.dev/language/concurrency)
- [pub.dev](https://pub.dev/) · [DevTools](https://docs.flutter.dev/tools/devtools)
