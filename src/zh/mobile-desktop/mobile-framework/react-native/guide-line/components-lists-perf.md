---
layout: doc
outline: [2, 3]
---

# React Native 组件·列表·性能·动画

> 基于 React Native 0.86 · 核于 2026-07

## 速查

- **核心组件**映射真实原生视图：`View`→`UIView`/`ViewGroup`、`Text`→`UITextView`/`TextView`、`Image`→`UIImageView`/`ImageView`；社区库目录 **reactnative.directory**（可筛新架构兼容性）
- **长列表用虚拟化 `FlatList`**（只渲染可视项），**别用 `ScrollView`**（一次性全量渲染）；`SectionList` 带分组头；底层是 `VirtualizedList`；更高性能用 **`FlashList`**（Shopify）
- **FlatList 优化**：`getItemLayout`（等高项跳过异步测量，最有效）、`keyExtractor`、`windowSize`（默认 21，视口高倍数）、`initialNumToRender`、`maxToRenderPerBatch`、`removeClippedSubviews`；列表项 `React.memo`、`renderItem` 用 `useCallback`
- **性能目标 60 FPS**＝每帧 **16.67ms** 预算；超时即掉帧
- **两线程**：**JS 线程**（React 逻辑/触摸）与 **UI 主线程**（原生动画/UI）；原生动画/滚动跑 UI 线程，**不被 JS 掉帧阻塞**
- **性能纪律**：**测 release build**（dev 拖慢 JS）；生产移除 `console.log`（`transform-remove-console`）；等高列表给 `getItemLayout`
- **动画**：`Animated`（细粒度）+ `LayoutAnimation`（一次性全局过渡，Android 需 `setLayoutAnimationEnabledExperimental(true)`）；**`useNativeDriver: true` 只支持 transform/opacity**、在 UI 线程跑；`Animated.event` 的 native driver **对 PanResponder 无效**；社区事实标准 **Reanimated**（worklet 跑 UI 线程）

## 一、核心组件与生态

RN 的核心组件在运行时映射为真实原生视图：

| RN 组件 | Android | iOS |
| --- | --- | --- |
| `<View>` | `ViewGroup` | `UIView` |
| `<Text>` | `TextView` | `UITextView` |
| `<Image>` | `ImageView` | `UIImageView` |
| `<ScrollView>` | `ScrollView` | `UIScrollView` |
| `<TextInput>` | `EditText` | `UITextField` |

- 交互组件：**`Pressable`**（官方推荐的通用按压组件，提供 `pressed` 状态）、`TouchableOpacity` 等（较老，仍可用）；复杂手势用社区 `react-native-gesture-handler`。
- 找社区原生库去 **React Native Directory（reactnative.directory）**，可按平台支持、**新架构兼容性**、维护活跃度筛选。

## 二、列表：为什么必须用 FlatList

`ScrollView` 会**一次性渲染所有子元素**，长列表会内存/性能爆炸。`FlatList` 做**虚拟化/懒渲染**——只渲染可视区附近的项、滚动时回收复用。

```tsx
import { FlatList, Text } from "react-native";

<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <Text>{item.title}</Text>}
  getItemLayout={(_, index) => ({ length: ROW_H, offset: ROW_H * index, index })}
/>;
```

- `FlatList`：长列表首选，必填 `data` + `renderItem`，推荐 `keyExtractor`。
- `SectionList`：带分组头（类 iOS `UITableView`），`sections` + `renderSectionHeader`。
- `VirtualizedList`：二者底层实现。
- **`FlashList`（`@shopify/flash-list`）**：更激进回收复用的高性能替代，API 近似 FlatList，官方性能页也推荐它（或 Legend List）。

## 三、FlatList 优化 props

| prop | 默认 | 作用 / 权衡 |
| --- | --- | --- |
| `getItemLayout` | — | 等高项提供它可**跳过异步测量**，显著提速、支持精确 `scrollToIndex` |
| `keyExtractor` | — | 唯一 key，保证缓存/重排正确 |
| `windowSize` | 21 | 渲染窗口＝视口高倍数（上10+可视1+下10）；大→少空白多内存 |
| `initialNumToRender` | 10 | 首屏渲染项数 |
| `maxToRenderPerBatch` | 10 | 每批渲染项数；大→填充快但 JS 阻塞久 |
| `removeClippedSubviews` | Android `true` | 视口外视图从原生层级卸载；省主线程但 iOS 可能内容丢失 |

- 其它：列表项用 `React.memo`；`renderItem` 用 `useCallback` 避免每次新建函数；图片用缩略图/缓存库。

## 四、性能：两线程与 60 FPS

RN 有**两条主要线程**：

- **JS 线程**：跑 React 逻辑、业务、触摸处理。重计算（复杂重渲染、大 `setState`）会连掉多帧（一次 200ms 阻塞可掉约 12 帧）。
- **UI（主）线程**：跑原生动画与 UI 操作，**不被 JS 掉帧阻塞**——所以原生栈导航转场、原生 `ScrollView` 惯性滚动即使 JS 卡也依旧顺滑。

性能目标 **60 FPS**＝每帧约 **16.67ms** 预算（高刷更严），任一线程超时即掉帧。常见性能杀手与对策：

1. **dev 模式失真** → 性能务必测 **release build**。
2. **大量 `console.log`**（含 redux-logger）→ 生产用 Babel `transform-remove-console` 移除。
3. **长列表** → `getItemLayout` / `FlashList`。
4. **动画期 JS 重活**（「导航转场慢」最常见）→ `InteractionManager` 延后、`useNativeDriver`。
5. **iOS 动 `Image` 宽高触发重裁剪** → 改用 `transform: [{ scale }]`。

## 五、动画：Animated / native driver / Reanimated

RN 内置两套动画系统：

- **`Animated`**：细粒度、可交互。`Animated.timing/spring/decay`、`Animated.sequence/parallel`、`.interpolate({inputRange, outputRange})`（可映射角度、颜色）；可动画组件 `Animated.View/Text/Image/ScrollView/FlatList` 或 `createAnimatedComponent`。
- **`LayoutAnimation`**：一次性为下一次布局变化配置全局过渡；**Android 需先 `UIManager.setLayoutAnimationEnabledExperimental(true)`**。

**`useNativeDriver: true`（关键考点）**：

```tsx
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // 动画配置一次性发到原生、在 UI 线程跑；JS 阻塞也不卡
}).start();
```

- 动画在 **UI 线程**运行，JS 阻塞不影响它。
- **仅支持 `transform` 与 `opacity`**，**不支持布局属性**（width/height/margin/padding/top/left/flex）——想动布局改用 transform 缩放或不开 native driver。
- `Animated.event` 的 native driver 只对 **direct events**（如 `ScrollView#onScroll`）有效，**对 `PanResponder` 无效**。

**Reanimated（`react-native-reanimated`，Software Mansion）**：社区事实标准动画库，worklet 直接在 UI 线程运行，比内置 `Animated` 更强大流畅；RN 0.85 起官方与其合作推进「统一动画后端」。（官方内置 Animations 文档本身不覆盖 Reanimated。）
