---
layout: doc
outline: [2, 3]
---

# 参考

> React Navigation 7.x API 速查。所有签名 / 类型 / 选项与官方文档对齐。

## 包结构

```
@react-navigation/native          ← 核心：NavigationContainer / 主题 / Linking / Hooks
@react-navigation/native-stack    ← Native Stack（推荐）
@react-navigation/stack           ← JS Stack（可定制转场）
@react-navigation/bottom-tabs     ← 底部 Tabs
@react-navigation/drawer          ← 侧滑 Drawer
@react-navigation/material-top-tabs ← 顶部 Material Tabs
@react-navigation/elements        ← UI 元件：Button / HeaderButton / Label
```

## 核心 API

### `createNativeStackNavigator()`

```ts
function createNativeStackNavigator(
  config?: StaticConfig
): NativeStackNavigator
```

**Dynamic 用法**：

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()
```

**Static 用法**：

```tsx
const RootStack = createNativeStackNavigator({
  initialRouteName: 'Home',
  screens: {
    Home: HomeScreen,
    Details: { screen: DetailsScreen, options: { title: '详情' } },
  },
  screenOptions: { headerStyle: { backgroundColor: 'tomato' } },
  groups: {
    Modal: {
      screenOptions: { presentation: 'modal' },
      screens: { Login: LoginScreen },
    },
  },
})
```

返回 `{ Navigator, Screen, Group }`。

### `createStackNavigator()`

JS-driven Stack：

```tsx
import { createStackNavigator } from '@react-navigation/stack'

const Stack = createStackNavigator()
```

支持深度自定义 `transitionSpec` / `cardStyleInterpolator` / `headerStyleInterpolator`。详见「JS Stack 选项」章节。

### `createBottomTabNavigator()`

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Tab = createBottomTabNavigator()
```

### `createDrawerNavigator()`

```tsx
import { createDrawerNavigator } from '@react-navigation/drawer'

const Drawer = createDrawerNavigator()
```

需要 `react-native-reanimated` + `react-native-gesture-handler`。

### `createMaterialTopTabNavigator()`

```tsx
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'

const TopTab = createMaterialTopTabNavigator()
```

需要 `react-native-pager-view`。

### `createStaticNavigation()`

```ts
function createStaticNavigation<T>(
  tree: T
): React.ComponentType<{ ref?: NavigationContainerRefWithCurrent<...> }>
```

把 Static Navigator 配置包装为可直接渲染的根组件：

```tsx
const Navigation = createStaticNavigation(RootStack)

export default function App() {
  return <Navigation />
}
```

### `<NavigationContainer>`

整棵导航树的根组件。

```tsx
<NavigationContainer
  initialState={...}       // 恢复状态（State Persistence）
  onStateChange={(s) => ...} // 状态变化回调
  linking={linking}        // Deep Linking 配置
  fallback={<Text>...</Text>}     // Linking 解析期占位
  theme={DarkTheme}        // 主题
  documentTitle={{ formatter: (opts, route) => `${opts?.title} - App` }} // Web only
  onReady={() => ...}      // 渲染完成回调
  ref={navigationRef}      // 命令式引用
>
  {children}
</NavigationContainer>
```

#### Props 完整列表

| Prop | 类型 | 说明 |
|---|---|---|
| `initialState` | `NavigationState` | 初始导航状态（State Persistence） |
| `onStateChange` | `(state) => void` | 状态变更回调 |
| `linking` | `LinkingOptions` | Deep Linking 配置 |
| `fallback` | `ReactNode` | Linking 解析中占位元素 |
| `theme` | `Theme` | 主题对象 |
| `documentTitle` | `{ formatter, enabled }` | Web 标题 |
| `onReady` | `() => void` | 第一次渲染完成 |
| `independent` | `boolean` | **已废弃**，用 `<NavigationIndependentTree>` |
| `children` | `ReactNode` | 子导航器 |

### `<NavigationIndependentTree>`

声明一棵独立的导航树（v7 新增、替代 `independent` prop）：

```tsx
<NavigationIndependentTree>
  <NavigationContainer>
    <Stack.Navigator>...</Stack.Navigator>
  </NavigationContainer>
</NavigationIndependentTree>
```

常用于嵌入第三方组件库内的隔离导航。

## Hooks

### `useNavigation()`

```ts
function useNavigation<T = NavigationProp<ParamListBase>>(): T
```

**用法**：

```tsx
const navigation = useNavigation()
navigation.navigate('Home')
```

**类型化**：

```tsx
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>
const navigation = useNavigation<Nav>()
```

声明全局 `ReactNavigation.RootParamList` 后无需手写泛型。

### `useRoute()`

```ts
function useRoute<T = RouteProp<ParamListBase>>(): T
```

```tsx
const route = useRoute()
console.log(route.name, route.params, route.key)
```

类型化：

```tsx
import type { RouteProp } from '@react-navigation/native'

const route = useRoute<RouteProp<RootStackParamList, 'Details'>>()
const { itemId } = route.params
```

### `useFocusEffect()`

```ts
function useFocusEffect(effect: EffectCallback): void
```

```tsx
useFocusEffect(
  React.useCallback(() => {
    // 进入屏幕
    return () => {
      // 离开屏幕
    }
  }, [deps])
)
```

> **必须用 `useCallback` 包**——否则每次渲染都会触发。

### `useIsFocused()`

```ts
function useIsFocused(): boolean
```

```tsx
const isFocused = useIsFocused()
```

### `useNavigationState()`

```ts
function useNavigationState<T>(selector: (state) => T): T
```

监听导航状态、避免不必要的重渲染：

```tsx
const routesLength = useNavigationState((state) => state.routes.length)
```

### `useNavigationContainerRef()`

获取 ref 给 NavigationContainer：

```tsx
const navigationRef = useNavigationContainerRef()

<NavigationContainer ref={navigationRef}>...</NavigationContainer>

// 在组件外调用
navigationRef.navigate('Home')
navigationRef.reset({ index: 0, routes: [{ name: 'Home' }] })
```

### `useScrollToTop()`

让 ScrollView 接入「双击 tab 滚回顶部」：

```tsx
import { useScrollToTop } from '@react-navigation/native'

function Feed() {
  const ref = React.useRef<ScrollView>(null)
  useScrollToTop(ref)

  return <ScrollView ref={ref}>...</ScrollView>
}
```

### `useLinkProps()` / `useLinkBuilder()`

Deep Linking 工具 Hooks——常用于自定义 Link 组件。

```tsx
import { useLinkBuilder } from '@react-navigation/native'

function MyLink() {
  const { buildHref, buildAction } = useLinkBuilder()
  const href = buildHref('Profile', { userId: 'a' }) // '/profile/a'
}
```

### Drawer 专用 Hooks

```tsx
import {
  useDrawerStatus,
  useDrawerProgress,
} from '@react-navigation/drawer'

const status = useDrawerStatus()       // 'open' | 'closed'
const progress = useDrawerProgress()   // Reanimated SharedValue 0~1
```

### Tab View 专用 Hooks

```tsx
import { useTabAnimation } from '@react-navigation/material-top-tabs'

const animation = useTabAnimation() // Reanimated SharedValue
```

## navigation 方法

### `navigate(name, params?)`

```ts
navigation.navigate(name: string, params?: object): void
```

- 当前栈已有该 screen：跳回（更新 params）
- 否则：推一个新屏幕

```tsx
navigation.navigate('Details', { itemId: 1 })
```

**嵌套写法**：

```tsx
navigation.navigate('Main', {
  screen: 'Messages',
  params: { user: 'jane' },
})
```

### `push(name, params?)`

```ts
navigation.push(name: string, params?: object): void
```

无条件推一个新屏幕（即使已在该 screen 也再推一个）。**仅 Stack 类 Navigator**。

```tsx
navigation.push('Details', { itemId: 2 })
```

### `pop(count?)`

```ts
navigation.pop(count?: number): void
```

弹一屏（默认 1）：

```tsx
navigation.pop()    // 弹一屏 = goBack
navigation.pop(3)   // 弹 3 屏
```

### `popTo(name, params?)`

```ts
navigation.popTo(name: string, params?: object): void
```

回退到栈中指定 screen：

```tsx
navigation.popTo('Home')
```

### `popToTop()`

```ts
navigation.popToTop(): void
```

回退到栈底（首屏）。

### `replace(name, params?)`

```ts
navigation.replace(name: string, params?: object): void
```

替换栈顶（无返回箭头）。**仅 Stack 类 Navigator**。

```tsx
navigation.replace('Login')
```

### `goBack()`

```ts
navigation.goBack(): void
```

返回上一屏（在 Stack = pop、在 Drawer = closeDrawer）。

### `reset(state)`

```ts
navigation.reset(state: PartialState | NavigationState): void
```

完全重置当前 Navigator 状态：

```tsx
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }],
})
```

### `setParams(params)`

```ts
navigation.setParams(params: object): void
```

**合并**更新当前 screen 的 params：

```tsx
navigation.setParams({ filter: 'active' })
```

### `setOptions(options)`

```ts
navigation.setOptions(options: object): void
```

动态更新当前 screen 的 options（如 header）：

```tsx
React.useEffect(() => {
  navigation.setOptions({
    title: `${count} 条`,
    headerRight: () => <Button onPress={...}>新建</Button>,
  })
}, [count, navigation])
```

### `dispatch(action)`

```ts
navigation.dispatch(action: NavigationAction): void
```

底层 action 派发（很少直接用）：

```tsx
import { CommonActions } from '@react-navigation/native'

navigation.dispatch(
  CommonActions.navigate({ name: 'Home', params: { ... } })
)
```

### `isFocused()`

```ts
navigation.isFocused(): boolean
```

当前 screen 是否聚焦。

### `canGoBack()`

```ts
navigation.canGoBack(): boolean
```

是否能 goBack（栈底返回 false）。

### `getParent(id?)`

```ts
navigation.getParent(id?: string): NavigationProp | undefined
```

拿到父 Navigator 的 navigation 对象（如果在嵌套中）：

```tsx
const parent = navigation.getParent('Tabs')
parent?.addListener('tabPress', ...)
```

### `getState()`

```ts
navigation.getState(): NavigationState
```

拿到当前 Navigator 的状态对象：

```tsx
const state = navigation.getState()
console.log(state.routes, state.index)
```

### `preload(name, params?)`

```ts
navigation.preload(name: string, params?: object): void
```

v7 新增——预渲染目标 screen 到内存（不显示）：

```tsx
React.useEffect(() => {
  navigation.preload('Profile', { userId: 'a' })
}, [navigation])
```

### Stack 类专属：`pop` / `popTo` / `popToTop` / `replace` / `push`

仅 Native Stack / JS Stack 有。

### Tabs 专属：`jumpTo`

```ts
navigation.jumpTo(name: string, params?: object): void
```

```tsx
navigation.jumpTo('Profile', { owner: 'John' })
```

### Drawer 专属：`openDrawer` / `closeDrawer` / `toggleDrawer`

```tsx
navigation.openDrawer()
navigation.closeDrawer()
navigation.toggleDrawer()
```

## addListener 事件

```ts
const unsubscribe = navigation.addListener(event, handler)
```

| 事件 | 何时触发 | 来源 |
|---|---|---|
| `focus` | screen 聚焦 | 通用 |
| `blur` | screen 失焦 | 通用（注意 Native Stack 可能 unmount，不触发 blur） |
| `beforeRemove` | screen 即将被移除（导航返回 / replace / reset） | 通用 |
| `state` | 导航状态变化 | 通用 |
| `tabPress` | 用户点击当前 Tab 按钮 | Bottom Tabs / Top Tabs |
| `tabLongPress` | 长按 Tab 按钮 | Bottom Tabs / Top Tabs |
| `drawerItemPress` | 用户点击 Drawer Item | Drawer |

## NavigationContainerRef 方法

```ts
const navigationRef = useNavigationContainerRef()
```

主要方法：

| 方法 | 说明 |
|---|---|
| `isReady()` | 是否已挂载完成 |
| `navigate(name, params)` | 导航 |
| `goBack()` | 返回 |
| `reset(state)` | 完全重置（顶层 reset 用 `resetRoot`） |
| `resetRoot(state)` | 重置整棵导航树 |
| `dispatch(action)` | 派发 action |
| `getRootState()` | 拿到整棵树的状态 |
| `getCurrentRoute()` | 拿到当前聚焦的 route |
| `getCurrentOptions()` | 拿到当前 screen 的 options |
| `addListener(event, handler)` | 监听全局事件 |

```tsx
navigationRef.resetRoot({
  index: 0,
  routes: [{ name: 'Home' }],
})
```

## Native Stack Screen Options 全表

```ts
type NativeStackNavigationOptions = {
  // ===== 标题 =====
  title?: string
  headerTitle?: string | ((props) => ReactNode)
  headerTitleAlign?: 'left' | 'center'
  headerTitleStyle?: StyleProp<TextStyle>

  // ===== Header 显隐与样式 =====
  headerShown?: boolean
  headerStyle?: StyleProp<ViewStyle>
  headerBackground?: () => ReactNode
  headerTintColor?: string
  headerShadowVisible?: boolean
  headerTransparent?: boolean
  headerBlurEffect?: 'systemUltraThinMaterial' | ... // iOS
  headerLargeTitle?: boolean       // iOS
  headerLargeTitleStyle?: StyleProp<TextStyle>
  headerLargeTitleShadowVisible?: boolean

  // ===== 返回按钮 =====
  headerBackVisible?: boolean
  headerBackTitle?: string
  headerBackTitleStyle?: StyleProp<TextStyle>
  headerBackButtonDisplayMode?: 'default' | 'generic' | 'minimal'
  headerBackImageSource?: ImageSourcePropType

  // ===== 左右元素 =====
  headerLeft?: (props) => ReactNode
  headerRight?: (props) => ReactNode

  // ===== 搜索栏 =====
  headerSearchBarOptions?: SearchBarProps

  // ===== 呈现 =====
  presentation?:
    | 'card'
    | 'modal'
    | 'transparentModal'
    | 'containedModal'
    | 'containedTransparentModal'
    | 'fullScreenModal'
    | 'formSheet'
  animation?:
    | 'default'
    | 'fade'
    | 'fade_from_bottom'
    | 'flip'
    | 'simple_push'
    | 'slide_from_right'
    | 'slide_from_left'
    | 'slide_from_bottom'
    | 'none'
  animationDuration?: number
  animationMatchesGesture?: boolean // 之前的 customAnimationOnGesture

  // ===== 手势 =====
  gestureEnabled?: boolean
  fullScreenGestureEnabled?: boolean
  gestureDirection?: 'horizontal' | 'vertical'

  // ===== 状态栏 =====
  statusBarStyle?: 'auto' | 'inverted' | 'light' | 'dark'
  statusBarHidden?: boolean
  statusBarAnimation?: 'none' | 'fade' | 'slide'
  statusBarTranslucent?: boolean    // Android
  statusBarBackgroundColor?: string // Android（之前的 statusBarColor）

  // ===== 内容 =====
  contentStyle?: StyleProp<ViewStyle>
  freezeOnBlur?: boolean

  // ===== Android 专属 =====
  navigationBarColor?: string
  navigationBarHidden?: boolean

  // ===== iOS 专属 =====
  orientation?: 'default' | 'all' | 'portrait' | ... // 屏幕方向
  autoHideHomeIndicator?: boolean
  sheetAllowedDetents?: ('large' | 'medium')[]      // formSheet
  sheetCornerRadius?: number
  sheetExpandsWhenScrolledToEdge?: boolean
  sheetGrabberVisible?: boolean
  sheetLargestUndimmedDetent?: 'large' | 'medium'

  // ===== 转场 =====
  animationTypeForReplace?: 'push' | 'pop'
}
```

## JS Stack Screen Options

继承 Native Stack 大部分选项、新增 / 不同：

```ts
type StackNavigationOptions = {
  // ===== Header 模式 =====
  headerMode?: 'float' | 'screen'      // float：header 独立动画 / screen：随屏幕动
  header?: (props) => ReactNode         // 完全自定义 header 组件

  // ===== 转场配置 =====
  transitionSpec?: {
    open: TransitionSpec
    close: TransitionSpec
  }
  cardStyleInterpolator?: StackCardStyleInterpolator
  headerStyleInterpolator?: StackHeaderStyleInterpolator
  gestureDirection?:
    | 'horizontal'
    | 'horizontal-inverted'
    | 'vertical'
    | 'vertical-inverted'

  // ===== 卡片 =====
  cardOverlayEnabled?: boolean
  cardOverlay?: () => ReactNode
  cardStyle?: StyleProp<ViewStyle>
  cardShadowEnabled?: boolean

  // ===== 手势 =====
  gestureResponseDistance?: number
  gestureVelocityImpact?: number

  // ===== 同 Native Stack：title / headerStyle / headerTintColor / ... =====
}
```

### 内置 TransitionPresets

```tsx
import { TransitionPresets } from '@react-navigation/stack'

screenOptions={{
  ...TransitionPresets.SlideFromRightIOS,
}}
```

| 预设 | 平台 |
|---|---|
| `SlideFromRightIOS` | iOS |
| `ModalSlideFromBottomIOS` | iOS |
| `ModalPresentationIOS` | iOS 13+ |
| `FadeFromBottomAndroid` | Android |
| `RevealFromBottomAndroid` | Android Q |
| `ScaleFromCenterAndroid` | Android S |
| `DefaultTransition` | 平台默认 |
| `ModalTransition` | Modal 默认 |

### CardStyleInterpolators

```tsx
import { CardStyleInterpolators } from '@react-navigation/stack'

screenOptions={{
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
}}
```

可选值：
- `forHorizontalIOS`
- `forVerticalIOS`
- `forModalPresentationIOS`
- `forFadeFromBottomAndroid`
- `forRevealFromBottomAndroid`
- `forScaleFromCenterAndroid`
- `forNoAnimation`

## Bottom Tabs Screen Options

```ts
type BottomTabNavigationOptions = {
  // ===== 标签 =====
  tabBarLabel?: string | ((props) => ReactNode)
  tabBarIcon?: (props: { focused, color, size }) => ReactNode
  tabBarShowLabel?: boolean
  tabBarLabelPosition?: 'beside-icon' | 'below-icon'
  tabBarLabelStyle?: StyleProp<TextStyle>
  tabBarIconStyle?: StyleProp<ViewStyle>

  // ===== Badge =====
  tabBarBadge?: string | number
  tabBarBadgeStyle?: StyleProp<TextStyle>

  // ===== 样式 =====
  tabBarStyle?: StyleProp<ViewStyle>
  tabBarItemStyle?: StyleProp<ViewStyle>
  tabBarActiveTintColor?: string
  tabBarInactiveTintColor?: string
  tabBarActiveBackgroundColor?: string
  tabBarInactiveBackgroundColor?: string

  // ===== 位置 =====
  tabBarPosition?: 'bottom' | 'top' | 'left' | 'right' // v7 新增 left/right
  tabBarVariant?: 'uikit' | 'material'                 // v7 新增

  // ===== 行为 =====
  tabBarHideOnKeyboard?: boolean
  tabBarButton?: (props) => ReactNode
  tabBarBackground?: () => ReactNode
  tabBarAccessibilityLabel?: string
  tabBarTestID?: string                                 // v6 的 tabBarTestID → v7 tabBarButtonTestID
  tabBarButtonTestID?: string

  // ===== Lazy / 行为 =====
  lazy?: boolean                  // 懒加载
  unmountOnBlur?: boolean         // v6 → v7 替换为 popToTopOnBlur
  popToTopOnBlur?: boolean        // 切走时把 stack pop 到顶
  freezeOnBlur?: boolean          // 离开时冻结渲染

  // ===== Header（顶部 header）=====
  header?: (props) => ReactNode
  headerShown?: boolean
  headerTitle?: string | ((props) => ReactNode)
  headerStyle?: StyleProp<ViewStyle>
  headerLeft?: (props) => ReactNode
  headerRight?: (props) => ReactNode
  // ... 同 Native Stack header 选项

  // ===== 内容 =====
  sceneStyle?: StyleProp<ViewStyle>   // v6 的 sceneContainerStyle → v7 sceneStyle
}
```

## Drawer Screen Options

```ts
type DrawerNavigationOptions = {
  // ===== Drawer Item =====
  drawerLabel?: string | ((props) => ReactNode)
  drawerIcon?: (props: { focused, color, size }) => ReactNode
  drawerLabelStyle?: StyleProp<TextStyle>
  drawerItemStyle?: StyleProp<ViewStyle>
  drawerActiveTintColor?: string
  drawerInactiveTintColor?: string
  drawerActiveBackgroundColor?: string
  drawerInactiveBackgroundColor?: string

  // ===== Drawer 整体 =====
  drawerType?: 'front' | 'back' | 'slide' | 'permanent'
  drawerPosition?: 'left' | 'right'
  drawerStyle?: StyleProp<ViewStyle>
  drawerContent?: (props) => ReactNode
  drawerStatusBarAnimation?: 'slide' | 'fade' | 'none'
  drawerHideStatusBarOnOpen?: boolean
  overlayColor?: string

  // ===== 手势 =====
  swipeEnabled?: boolean
  swipeEdgeWidth?: number
  swipeMinDistance?: number

  // ===== Header =====
  header?: (props) => ReactNode
  headerShown?: boolean
  // ... 同 Native Stack header 选项

  // ===== 内容 =====
  sceneStyle?: StyleProp<ViewStyle>
  popToTopOnBlur?: boolean
  freezeOnBlur?: boolean
}
```

## Material Top Tabs Screen Options

```ts
type MaterialTopTabNavigationOptions = {
  // ===== 标签 =====
  tabBarLabel?: string | ((props) => ReactNode)
  tabBarIcon?: (props) => ReactNode
  tabBarShowLabel?: boolean
  tabBarShowIcon?: boolean
  tabBarLabelStyle?: StyleProp<TextStyle>
  tabBarIconStyle?: StyleProp<ViewStyle>

  // ===== Indicator =====
  tabBarIndicatorStyle?: StyleProp<ViewStyle>
  tabBarIndicatorContainerStyle?: StyleProp<ViewStyle>

  // ===== 样式 =====
  tabBarStyle?: StyleProp<ViewStyle>
  tabBarItemStyle?: StyleProp<ViewStyle>
  tabBarContentContainerStyle?: StyleProp<ViewStyle>
  tabBarActiveTintColor?: string
  tabBarInactiveTintColor?: string
  tabBarPressColor?: string         // Android 5.0+ ripple
  tabBarPressOpacity?: number       // iOS opacity

  // ===== 行为 =====
  tabBarScrollEnabled?: boolean
  swipeEnabled?: boolean
  lazy?: boolean

  // ===== Badge =====
  tabBarBadge?: () => ReactNode
}
```

## Linking 配置

```ts
type LinkingOptions = {
  // 必须
  prefixes: string[]

  // 路由映射
  config?: {
    initialRouteName?: string
    screens: ScreensConfig
  }

  // 自定义 URL 获取
  enabled?: 'auto' | boolean
  getInitialURL?: () => string | null | Promise<string | null | undefined>
  subscribe?: (listener: (url: string) => void) => () => void

  // 完全自定义 URL ↔ State 转换
  getStateFromPath?: (path: string, options) => NavigationState
  getPathFromState?: (state: NavigationState, options) => string
  getActionFromState?: (state, options) => NavigationAction
}
```

### ScreensConfig 形式

```ts
const config = {
  screens: {
    Home: 'home',                    // 字符串 path
    Profile: {                       // 对象形式
      path: 'user/:userId',
      parse: { userId: Number },     // params 解析
      stringify: { userId: (id) => `${id}` }, // params 序列化
    },
    Settings: {                      // 嵌套
      path: 'settings',
      screens: {
        Sound: 'sound',
        Account: 'account',
      },
    },
    NotFound: '*',                   // 通配 404
  },
}
```

### URL 模板

| 模板 | 匹配 | 提取 params |
|---|---|---|
| `'home'` | `home` | – |
| `'user/:userId'` | `user/123` | `{ userId: '123' }` |
| `'user/:userId?'` | `user` 或 `user/123` | `{ userId?: string }` |
| `'item/:id(\\d+)'` | `item/123` 仅数字 | `{ id: '123' }` |
| `'*'` | 任意未匹配路径 | – |

## Theme

```ts
import { DefaultTheme, DarkTheme } from '@react-navigation/native'

const MyTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    primary: '#007AFF',
    background: '#fff',
    card: '#fff',
    text: '#000',
    border: '#ccc',
    notification: '#ff453a',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium:  { fontFamily: 'System', fontWeight: '500' },
    bold:    { fontFamily: 'System', fontWeight: '600' },
    heavy:   { fontFamily: 'System', fontWeight: '700' },
  },
}

<NavigationContainer theme={MyTheme}>...</NavigationContainer>
```

> **v7 变化**：`theme.fonts` 现在是**必填**——之前只需 `colors`。

### `useTheme()`

在组件内拿当前主题：

```tsx
import { useTheme } from '@react-navigation/native'

function MyComp() {
  const { colors } = useTheme()
  return <View style={{ backgroundColor: colors.background }} />
}
```

## CommonActions

低层级 action 工厂：

```ts
import { CommonActions } from '@react-navigation/native'

navigation.dispatch(
  CommonActions.navigate({ name: 'Profile', params: { userId: 'a' } })
)
navigation.dispatch(
  CommonActions.reset({
    index: 0,
    routes: [{ name: 'Home' }],
  })
)
navigation.dispatch(CommonActions.goBack())
navigation.dispatch(CommonActions.setParams({ filter: 'new' }))
```

### StackActions

```ts
import { StackActions } from '@react-navigation/native'

navigation.dispatch(StackActions.push('Profile'))
navigation.dispatch(StackActions.pop(2))
navigation.dispatch(StackActions.popToTop())
navigation.dispatch(StackActions.popTo('Home'))
navigation.dispatch(StackActions.replace('Login'))
```

### DrawerActions

```ts
import { DrawerActions } from '@react-navigation/drawer'

navigation.dispatch(DrawerActions.openDrawer())
navigation.dispatch(DrawerActions.closeDrawer())
navigation.dispatch(DrawerActions.toggleDrawer())
navigation.dispatch(DrawerActions.jumpTo('Settings'))
```

### TabActions

```ts
import { TabActions } from '@react-navigation/native'

navigation.dispatch(TabActions.jumpTo('Profile', { owner: 'John' }))
```

## TypeScript 工具类型

### Param List

```ts
// 每个 screen 的 params
export type RootStackParamList = {
  Home: undefined
  Details: { itemId: number; otherParam?: string }
}
```

### Screen Props

```ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { DrawerScreenProps } from '@react-navigation/drawer'
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs'

type DetailsProps = NativeStackScreenProps<RootStackParamList, 'Details'>
// = { navigation: NativeStackNavigationProp<...>, route: RouteProp<...> }
```

### Navigation Prop（单独）

```ts
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Details'>
```

### Route Prop（单独）

```ts
import type { RouteProp } from '@react-navigation/native'

type DetailsRoute = RouteProp<RootStackParamList, 'Details'>
```

### Composite（嵌套 Navigator）

```ts
import type {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native'

type TabParamList = {
  Feed: undefined
  Messages: undefined
}

type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>
  Profile: { userId: string }
}

// 在 Feed 内的 navigation —— 既能跳 Tab 内、也能跳父 Stack 内
type FeedNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Feed'>,
  NativeStackNavigationProp<RootStackParamList>
>

// 完整 Screen Props
type FeedProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Feed'>,
  NativeStackScreenProps<RootStackParamList>
>
```

### `NavigatorScreenParams`

```ts
type NavigatorScreenParams<T> =
  | { screen: keyof T; params?: T[keyof T] }
  | { screen?: undefined; initial?: false }
```

用于父 Navigator 跳子 Navigator 时声明 params 形状。

### `ParamListBase`

```ts
type ParamListBase = Record<string, object | undefined>
```

所有 Param List 的基础类型——很少直接用。

### 全局扩展模板

```ts
// types/navigation.ts
import type { RootStackParamList } from './root-stack'

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

让所有 `useNavigation()` / `useRoute()` 自动获得 RootStackParamList 类型。

## Elements 组件

`@react-navigation/elements` 提供与导航器配套的 UI 组件：

### `Button`

```tsx
import { Button } from '@react-navigation/elements'

<Button onPress={() => alert('hi')}>按钮</Button>

// 自动 Link（点击跳 screen）
<Button screen="Profile" params={{ userId: 'a' }}>个人</Button>
```

### `HeaderButton`

适用于 header 内的图标按钮：

```tsx
import { HeaderButton } from '@react-navigation/elements'

<HeaderButton onPress={...}>
  <Ionicons name="settings" size={24} />
</HeaderButton>
```

### `Label`

```tsx
import { Label } from '@react-navigation/elements'

<Label>文字</Label>
```

自动适配明暗主题、合理字号。

### `Link`

```tsx
import { Link } from '@react-navigation/native'

<Link screen="Profile" params={{ userId: 'a' }}>个人主页</Link>
```

## 完整类型 import 速查

```ts
// 核心
import type {
  NavigationProp,
  NavigationContainerRef,
  NavigationState,
  PartialState,
  Route,
  RouteProp,
  ParamListBase,
  NavigatorScreenParams,
  CompositeNavigationProp,
  CompositeScreenProps,
  EventArg,
  EventListenerCallback,
  Theme,
  LinkingOptions,
  PathConfig,
  PathConfigMap,
} from '@react-navigation/native'

// Native Stack
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
  NativeStackNavigationOptions,
  NativeStackNavigationEventMap,
} from '@react-navigation/native-stack'

// JS Stack
import type {
  StackNavigationProp,
  StackScreenProps,
  StackNavigationOptions,
  StackCardInterpolationProps,
  StackCardInterpolatedStyle,
  StackCardStyleInterpolator,
  StackHeaderInterpolationProps,
  StackHeaderInterpolatedStyle,
  StackHeaderStyleInterpolator,
  TransitionSpec,
  TransitionPreset,
} from '@react-navigation/stack'

// Bottom Tabs
import type {
  BottomTabNavigationProp,
  BottomTabScreenProps,
  BottomTabNavigationOptions,
  BottomTabBar,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs'

// Drawer
import type {
  DrawerNavigationProp,
  DrawerScreenProps,
  DrawerNavigationOptions,
  DrawerContentComponentProps,
} from '@react-navigation/drawer'

// Material Top Tabs
import type {
  MaterialTopTabNavigationProp,
  MaterialTopTabScreenProps,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs'
```

## 调试

### Reactotron 集成

```tsx
import Reactotron from 'reactotron-react-native'

navigationRef.addListener('state', (e) => {
  Reactotron.log('Navigation state', e.data?.state)
})
```

### 打印当前 state

```tsx
const state = navigation.getState()
console.log(JSON.stringify(state, null, 2))
```

### Flipper

React Navigation 7 与 Flipper 不再集成（Meta 已弃用 Flipper）——使用 React Native DevTools 或 Reactotron。

## 与同类库对比

| 维度 | React Navigation 7 | Expo Router 7 | React Native Navigation (Wix) |
|---|---|---|---|
| 阵营 | 官方推荐 | Expo 团队 | Wix 团队（社区） |
| 实现 | 原生导航控制器 + JS | 基于 React Navigation | 100% 原生 |
| 路由配置 | 配置 / Static | **文件系统** | 命令式 |
| API 风格 | React 组件 | 文件 + Hook | 命令式 `Navigation.push(...)` |
| 性能 | Native Stack 接近原生 | 同 React Navigation | **最高** |
| Deep Linking | 配置化 | 自动 | 配置化 |
| 学习曲线 | 中 | 平 | 陡 |
| 生态 | 极丰富 | 同 React Navigation | 小众 |

**结论**：

- 默认选 **React Navigation**（最广泛、生态最丰富）
- 用 Expo SDK 50+ → 优先 **Expo Router**（底层仍是 React Navigation）
- 需要 100% 原生性能 + 命令式 API → **React Native Navigation (Wix)**（较小众）

## 参考链接

- [官网](https://reactnavigation.org/)
- [Getting Started](https://reactnavigation.org/docs/getting-started)
- [Native Stack Navigator](https://reactnavigation.org/docs/native-stack-navigator)
- [Stack Navigator](https://reactnavigation.org/docs/stack-navigator)
- [Bottom Tab Navigator](https://reactnavigation.org/docs/bottom-tab-navigator)
- [Drawer Navigator](https://reactnavigation.org/docs/drawer-navigator)
- [Material Top Tab Navigator](https://reactnavigation.org/docs/material-top-tab-navigator)
- [TypeScript](https://reactnavigation.org/docs/typescript)
- [Deep Linking](https://reactnavigation.org/docs/deep-linking)
- [Authentication Flow](https://reactnavigation.org/docs/auth-flow)
- [State Persistence](https://reactnavigation.org/docs/state-persistence)
- [Upgrading from 6.x](https://reactnavigation.org/docs/upgrading-from-6.x)
- [GitHub](https://github.com/react-navigation/react-navigation)
- [Expo Router](https://docs.expo.dev/router/introduction/)
