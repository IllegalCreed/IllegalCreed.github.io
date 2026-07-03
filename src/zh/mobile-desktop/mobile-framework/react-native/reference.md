---
layout: doc
outline: [2, 3]
---

# React Native 参考

> 基于 React Native 0.86 · Expo SDK 57 · 核于 2026-07

## 速查

- 版本：**RN 0.86 / React 19.2 / Expo SDK 57**；新架构 **0.76 默认、0.82 强制**；默认引擎 **Hermes**
- 新架构四大件：**JSI / Fabric / TurboModules / Codegen**（配角 Bridgeless / Yoga / Hermes）
- 最常踩：Flexbox 默认 **column**、文本必包 **Text**、`useNativeDriver` 仅 **transform/opacity**、长列表用 **FlatList**、Expo Go 装不了自定义原生

## 一、版本坐标

| 项 | 值 |
| --- | --- |
| RN 最新稳定 | **0.86**（2026-06） |
| React | **19.2** |
| Expo SDK | **57**（= RN 0.86） |
| 默认 JS 引擎 | **Hermes**（AOT 字节码） |
| 新架构默认 | **0.76** |
| 新架构强制（不可关） | **0.82**（Expo SDK 55） |
| 可关新架构的最后版本 | **0.81**（Expo SDK 54） |
| Bridgeless 成新架构默认 | **0.74** |

## 二、新架构四大件

| 组件 | 一句话 |
| --- | --- |
| **JSI** | JS↔C++ 直接互引、同步调用，替代序列化 Bridge |
| **Fabric** | C++ 统一新渲染器，同步布局 + React 并发（替 Paper） |
| **TurboModules** | JSI 原生模块，类型安全 + 懒加载 |
| **Codegen** | 构建期从 TS/Flow spec 生成原生胶水，保类型安全 |
| Bridgeless | 彻底不建桥（0.74 默认） |
| Yoga | 跨平台 Flexbox 布局引擎 |
| Hermes | 默认引擎，AOT 预编译字节码 |

## 三、Flexbox：RN vs Web 默认值

| 属性 | RN | Web |
| --- | --- | --- |
| `flexDirection` | **column** | row |
| `flexShrink` | **0** | 1 |
| `alignContent` | flex-start | stretch |
| `flex` | 单个数字 | grow/shrink/basis 简写 |

## 四、核心组件映射

| RN | Android | iOS |
| --- | --- | --- |
| `View` | ViewGroup | UIView |
| `Text` | TextView | UITextView |
| `Image` | ImageView | UIImageView |
| `ScrollView` | ScrollView | UIScrollView |
| `TextInput` | EditText | UITextField |

## 五、FlatList 优化 props

| prop | 默认 | 作用 |
| --- | --- | --- |
| `getItemLayout` | — | 等高项跳过异步测量（最有效） |
| `keyExtractor` | — | 唯一 key |
| `windowSize` | 21 | 渲染窗口＝视口高倍数 |
| `initialNumToRender` | 10 | 首屏渲染项数 |
| `maxToRenderPerBatch` | 10 | 每批渲染项数 |
| `removeClippedSubviews` | Android true | 视口外视图卸载 |

## 六、Expo 关键概念

| 概念 | 要点 |
| --- | --- |
| Expo Router | 文件路由，建于 React Navigation 之上 |
| Expo Go | 固定内置库的 playground，不能加自定义原生 |
| Development Build | 含 `expo-dev-client` 的自有调试 App，可加原生 |
| CNG / prebuild | 原生目录当构建产物（`.gitignore`），配置为真源 |
| Config Plugins | prebuild 期声明式改原生工程（`with<Name>`） |
| Expo Modules API | 写的原生模块默认支持新架构 |

## 七、EAS 命令与 OTA 边界

```bash
eas build --platform all              # 云端出包
eas submit --platform android         # 上架
eas update --channel production --message "..."  # OTA
```

| 可 OTA ✅ | 不可 OTA ❌ |
| --- | --- |
| JS、样式、文案、图片、灰度 | 原生代码/依赖、权限、SDK 升级 |

## 八、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | Flexbox 默认 `column`（非 Web 的 row） |
| 2 | 文本必须包在 `<Text>` 里，裸串放 `<View>` 报错 |
| 3 | 样式无 CSS 继承/级联，继承只在 `<Text>` 嵌套内 |
| 4 | 样式 camelCase、无单位（dp），Android 不支持负 margin |
| 5 | `TextInput.onChangeText` 直接给字符串，非事件对象 |
| 6 | `useNativeDriver: true` 只支持 transform/opacity |
| 7 | 长列表用 FlatList 而非 ScrollView |
| 8 | `Platform.Version`：Android 整数、iOS 字符串 |
| 9 | 新架构：0.76 默认、0.82 强制；Bridgeless 0.74 默认 |
| 10 | Expo Go 装不了自定义原生模块，需 Development Build |
| 11 | CNG 下 `ios/`、`android/` 是 `.gitignore` 的构建产物，别手改 |
| 12 | EAS Update 不能 OTA 原生代码/权限/SDK 升级 |
| 13 | Hermes 性能要在 release build 才准 |
| 14 | RN DevTools 需 Hermes；`chrome://inspect` 远程调试已废弃 |
| 15 | Fast Refresh 不保留类组件 state |
| 16 | RN 无 CORS；iOS 默认 HTTPS、Android 默认禁明文 |
| 17 | 「Learn once, write anywhere」（非 write once run anywhere） |
| 18 | RN 渲染真实原生控件（区别于 Flutter 自绘、WebView 套壳） |

## 九、权威链接

- [React Native 官网](https://reactnative.dev/) · [Get Started](https://reactnative.dev/docs/getting-started)
- [Architecture Overview](https://reactnative.dev/architecture/overview) · [The New Architecture](https://reactnative.dev/architecture/landing-page)
- [Fabric Renderer](https://reactnative.dev/architecture/fabric-renderer) · [Hermes](https://reactnative.dev/docs/hermes)
- [Performance](https://reactnative.dev/docs/performance) · [Optimizing FlatList](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [Animations](https://reactnative.dev/docs/animations) · [React Native DevTools](https://reactnative.dev/docs/react-native-devtools)
- [Expo 文档](https://docs.expo.dev/) · [Expo Router](https://docs.expo.dev/router/introduction/) · [EAS Build](https://docs.expo.dev/build/introduction/) · [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [React Navigation](https://reactnavigation.org/) · [React Native Directory](https://reactnative.directory/)
