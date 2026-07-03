---
layout: doc
outline: [2, 3]
---

# 入门：React Native 是什么与怎么起步

> 基于 React Native 0.86 · 核于 2026-07

## 速查

- **一句话**：React Native 用 **JS/TS + React** 写、**运行时渲染成真实原生控件**（`<Text>`→`UITextView`/`TextView`），观感/性能接近原生——**不是 WebView 套壳，也不是 Flutter 那种自绘像素**
- **口号**：**「Learn once, write anywhere」**（学一次到处写，复用技能而非「一套代码到处跑」）；官方定位「Meta supported. Community driven.」
- **与 React 的关系**：复用 React 的组件模型 + Hooks（`useState`/`useEffect`/JSX 全一样），只是换了个把组件渲染到**原生视图**（而非 DOM）的 renderer；差异在组件集（`View`/`Text` 而非 `div`/`p`）与样式系统
- **vs Flutter**：RN 用**真实原生控件**（继承平台观感/无障碍）；Flutter 用 Dart + 自绘引擎画像素
- **起步（官方推荐用框架 Expo）**：`npx create-expo-app@latest`；裸社区 CLI：`npx @react-native-community/cli init MyApp`（仅特殊约束/想全自控时）
- **核心组件**：`<View>`(容器)、`<Text>`(**所有文本必须包在里面**)、`<Image>`(图片)、`<ScrollView>`(小内容滚动)、`<FlatList>`(长列表虚拟化)、`<TextInput>`(输入)、`<Pressable>`(按压)
- **样式**：写 **JS 对象**、属性 **camelCase**、无 CSS 文件/级联；`StyleSheet.create({...})`；**Flexbox 默认 `flexDirection:'column'`**（Web 是 row）
- **版本坐标**：RN **0.86**（2026-06）/ React **19.2** / Expo **SDK 57**；新架构 **0.76 默认、0.82 强制不可关**；默认引擎 **Hermes**
- **调试**：**React Native DevTools**（0.76 起，取代 Flipper，需 Hermes，Dev Menu 按 `j` 开）；**Fast Refresh** 默认开（保留函数组件 + Hooks 的 state）
- **进阶顺序**：先读[新架构深潜](./guide-line/new-architecture)吃透 JSI/Fabric/TurboModules → 再读[样式与布局](./guide-line/styling-layout)与[Expo 工作流](./guide-line/expo-workflow)

## 一、React Native 解决什么问题

React Native（RN）诞生于 Meta，要回答一个问题：**能不能用前端团队已有的 JavaScript + React 技能，产出观感与性能都接近原生的 iOS/Android App，而不是套一层 WebView？** 它的答案是——**把 React 组件在运行时映射成真实的原生视图**：你写的 `<Text>` 最终是 iOS 的 `UITextView`、Android 的 `TextView`，`<View>` 是 `UIView`/`ViewGroup`。因此用户拿到的是真原生控件，天然继承平台的滚动手感、无障碍、系统字体与深色模式，而不是浏览器里的模拟。

这条路线区别于两类方案：

- **vs 原生（Swift/Kotlin）**：RN 用一套 JS/TS 跨双端，迭代快、可热更新（JS/资源层）；但极端性能或最新平台 API 仍可能要写原生模块。
- **vs WebView 套壳（Cordova/Capacitor）**：RN **不**把网页塞进 WebView，渲染的是原生视图，性能与观感是另一个量级。
- **vs Flutter**：Flutter 用 Dart + 自绘引擎（Skia/Impeller）**画每一个像素**、不用原生控件，跨平台像素级一致但要自行还原平台观感；RN 复用原生控件，方向相反。

官方特意用 **「Learn once, write anywhere」** 而非 Java 的 **「Write once, run anywhere」**：RN 复用的是**开发者的技能与心智**，并**鼓励**在需要时写平台特定代码，而不承诺「一套代码原封不动跑遍所有平台」。

## 二、React Native 与 React 是什么关系

如果你会 React Web，就已经会了 RN 的一大半。**React 是心智内核**（组件、props/state、Hooks、JSX、单向数据流），**RN 是把 React 渲染到原生的 renderer**——正如 `react-dom` 把 React 渲染到浏览器 DOM，RN 把同一套 React 渲染到 iOS/Android 原生控件。

差异集中在两处：

1. **组件集合不同**：没有 `div`/`span`/`p`/`img`，取而代之是 `View`/`Text`/`Image`/`ScrollView`/`FlatList` 等一批「核心组件」，它们映射到原生视图。
2. **样式系统不同**：没有 CSS 文件与选择器，改用 JS 对象 + camelCase 属性（详见[样式与布局](./guide-line/styling-layout)）。

```tsx
// 一个最小的 RN 组件：与 React Web 几乎一样，只是标签与样式不同
import { View, Text, StyleSheet } from "react-native";

export default function Hello({ name }: { name: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>你好，{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: "center", alignItems: "center" }, // 注意默认 flexDirection 是 column
  title: { fontSize: 20, fontWeight: "600" }, // camelCase、无单位（dp）
});
```

## 三、怎么起步：官方推荐用框架（Expo）

2026 年 reactnative.dev 的「Get Started」明确表态：**最好的 RN 体验是通过一个 Framework**，并把 **Expo** 列为推荐框架。原因是——裸 RN 需要你自己拼路由、原生模块、构建、更新等基础设施，而 Expo 开箱即给：

- **Expo Router**：基于文件的路由（`app/` 下加文件即成路由）。
- **expo-\* SDK**：一大批高质量通用原生模块（相机、通知、文件系统……）。
- **CNG / prebuild**：把 `ios/`、`android/` 当作可再生的构建产物。
- **Config Plugins**：以声明式代码修改原生工程配置。
- **EAS**：云端构建、上架、OTA 更新。

```bash
# 官方推荐：用 Expo 起步
npx create-expo-app@latest
cd my-app
npx expo start          # 启动 dev server（配合 Expo Go 或 Development Build）

# 仅在有特殊约束、想完全自控时：裸社区 CLI
npx @react-native-community/cli init MyApp
```

> 注意「managed vs bare workflow」这组**旧术语已淘汰**，现在统一用 **CNG** 模型描述（见 [Expo 工作流](./guide-line/expo-workflow)）。

## 四、核心组件与样式初识

RN 用一批**核心组件**替代 HTML 标签，运行时映射到原生视图：

| RN 组件 | Android | iOS | Web 类比 |
| --- | --- | --- | --- |
| `<View>` | `ViewGroup` | `UIView` | 非滚动 `<div>` |
| `<Text>` | `TextView` | `UITextView` | `<p>` |
| `<Image>` | `ImageView` | `UIImageView` | `<img>` |
| `<ScrollView>` | `ScrollView` | `UIScrollView` | 滚动的 `<div>` |
| `<TextInput>` | `EditText` | `UITextField` | `<input>` |

两条最容易踩的入门规则先记住：

- **所有文本必须包在 `<Text>` 里**——`<View>Hello</View>` 会**运行时报错**，必须 `<View><Text>Hello</Text></View>`。
- **Flexbox 默认 `flexDirection: 'column'`**（纵向），与 Web 的 `row` 相反；这是新手最常见的「布局怎么反了」的根因。

## 五、心智地图：接下来读什么

- 想搞懂 RN「为什么快、底层怎么变的」→ [新架构深潜](./guide-line/new-architecture)（JSI/Fabric/TurboModules/Codegen/Bridgeless + 版本时间线）。
- 想写好界面 → [样式与布局](./guide-line/styling-layout) + [组件·列表·性能·动画](./guide-line/components-lists-perf)。
- 想把项目跑起来、发出去 → [Expo 工作流](./guide-line/expo-workflow) + [EAS 与发布](./guide-line/eas-release)。
- 想配好开发环境与导航 → [工具链与导航](./guide-line/tooling-navigation)。
- 速记表在 [参考](./reference)。
