---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 React Navigation 7.x。包含 5 种 Navigator 详解 / Native Stack vs JS Stack 选型 / 嵌套 Navigator 模式 / TypeScript 类型系统 / Header 自定义 / 转场动画 / Modal / Deep Linking / Authentication Flow / State Persistence / 屏幕事件 / Static API / v6→v7 迁移 / 与 Expo Router 对比。

## 速查

- **Navigator**：5 种 — Native Stack / JS Stack / Bottom Tabs / Drawer / Material Top Tabs
- **Native Stack**：原生导航控制器（iOS UINav / Android Fragment），性能最佳、可定制度有限
- **JS Stack**：纯 JS，可深度自定义转场（`cardStyleInterpolator`），性能较低
- **嵌套模式**：Tabs 包 Stacks（最常用）/ Drawer 包 Tabs 包 Stacks / Modal Stack 平级模式
- **跨 Navigator 跳转**：`navigation.navigate('Tabs', { screen: 'Home', params: {} })`
- **TS 类型 4 件套**：`RootStackParamList` / `NativeStackScreenProps` / `RouteProp` / `CompositeNavigationProp`（嵌套）
- **全局类型扩展**：`declare global { namespace ReactNavigation { interface RootParamList ... } }`
- **Header 完全自定义**：`headerRight` / `headerLeft` / `headerTitle` 函数返回组件、`navigation.setOptions` 动态更新
- **Modal**：`presentation: 'modal' | 'transparentModal' | 'formSheet' | 'fullScreenModal'`
- **Deep Linking**：`linking.prefixes + config.screens` 映射 URL → 屏幕栈
- **Auth Flow**：根据 `isSignedIn` 渲染两个 Stack、React Navigation 自动转场
- **State Persistence**：`initialState` + `onStateChange` + `AsyncStorage`
- **屏幕事件**：`focus` / `blur` / `beforeRemove` / `tabPress` / `drawerItemPress`
- **`beforeRemove`**：拦截返回（如未保存表单弹确认对话框）

## Native Stack：原生导航控制器

`@react-navigation/native-stack` 走平台原生导航——iOS 用 `UINavigationController`、Android 用 `Fragment`——**这是 90% RN App 的推荐选择**。

### 安装

```bash
pnpm add @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

### 基本用法（Dynamic）

```tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

function MyStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#f1f1f1' },
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '主页' }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <MyStack />
    </NavigationContainer>
  )
}
```

### 关键 Screen Options

#### Header 系列

```tsx
<Stack.Screen
  name="Profile"
  component={ProfileScreen}
  options={{
    title: '个人中心',                       // 标题文本
    headerShown: true,                       // 是否显示 header（默认 true）
    headerStyle: { backgroundColor: '#fff' },// header 背景色
    headerTintColor: '#000',                 // 返回箭头 + 标题颜色
    headerTitleStyle: { fontWeight: '600' }, // 标题样式
    headerTitleAlign: 'center',              // 标题居中（iOS 默认居中）
    headerBackVisible: true,                 // 是否显示返回按钮
    headerBackTitle: '返回',                 // iOS 返回按钮文字
    headerLargeTitle: true,                  // iOS 大标题（滚动时缩小）
    headerTransparent: false,                // header 透明（浮于内容上）
    headerShadowVisible: true,               // 是否显示底部阴影
    headerRight: () => <CustomRightButton />,// 右侧自定义按钮
    headerLeft: () => <CustomLeftButton />,  // 左侧自定义按钮（替换返回箭头）
  }}
/>
```

#### Presentation：屏幕呈现方式

```tsx
options={{
  // 'card'        — 默认，标准 push 转场
  // 'modal'       — Modal 滑动模式（iOS 顶部留 inset、可下拉关闭）
  // 'transparentModal' — 透明 Modal（背景可见，常用于半屏弹层）
  // 'formSheet'   — iOS 表单 sheet 样式
  // 'fullScreenModal' — 全屏 Modal
  // 'containedModal' / 'containedTransparentModal' — iOS containerVc
  presentation: 'modal',
}}
```

#### Animation：转场动画

```tsx
options={{
  // 'default'           — 平台默认
  // 'fade'              — 淡入淡出
  // 'fade_from_bottom'  — 底部淡入
  // 'slide_from_right'  — 从右滑入（iOS push 默认）
  // 'slide_from_left'   — 从左滑入
  // 'slide_from_bottom' — 从底部滑入（Modal 默认）
  // 'flip'              — 翻页（iOS only）
  // 'none'              — 无动画
  animation: 'slide_from_right',
}}
```

#### 其他常用

```tsx
options={{
  gestureEnabled: true,                  // 是否允许手势返回（iOS 默认 true）
  fullScreenGestureEnabled: false,       // 全屏区域响应手势
  statusBarStyle: 'dark',                // 状态栏样式：'light' / 'dark' / 'auto'
  statusBarBackgroundColor: '#fff',      // 状态栏背景色（Android）
  navigationBarColor: '#000',            // 底部导航栏颜色（Android）
  contentStyle: { backgroundColor: '#f5f5f5' }, // 内容区背景
  freezeOnBlur: true,                    // 离开屏幕时冻结（不再渲染，省 CPU）
  autoHideHomeIndicator: false,          // iOS 自动隐藏 Home Indicator
}}
```

### Native Stack 上的 navigation 方法

`navigation` 在 Native Stack 上的方法：

```tsx
navigation.push('Profile', { id: 123 })       // 无条件推新屏幕
navigation.pop()                               // 弹一屏（=goBack）
navigation.pop(3)                              // 弹 3 屏
navigation.popToTop()                          // 弹到栈底
navigation.popTo('Home', { tab: 'feeds' })     // 弹到指定屏
navigation.replace('Login')                    // 替换栈顶
navigation.navigate('Settings')                // navigate（已存在则跳回）
navigation.goBack()                            // 等价 pop()
```

## JS Stack：完全可定制

`@react-navigation/stack` 是纯 JavaScript 实现——**性能不如 Native Stack**、但**转场动画完全可定制**。

### 安装

```bash
pnpm add @react-navigation/stack
npx expo install react-native-gesture-handler
```

Expo 项目还需要 `@react-native-masked-view/masked-view`：

```bash
npx expo install @react-native-masked-view/masked-view
```

iOS：`cd ios && pod install`。

### 关键差异

```tsx
import { createStackNavigator, TransitionPresets, CardStyleInterpolators } from '@react-navigation/stack'

const Stack = createStackNavigator()

<Stack.Navigator
  screenOptions={{
    headerMode: 'float',                                   // 'float' (header 独立动画) / 'screen' (随屏幕一起动)
    ...TransitionPresets.SlideFromRightIOS,                // 完整转场预设
    cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
    gestureDirection: 'horizontal',                        // 'horizontal' / 'vertical' / 'horizontal-inverted' / 'vertical-inverted'
    transitionSpec: {
      open:  { animation: 'timing', config: { duration: 300 } },
      close: { animation: 'spring', config: { damping: 500 } },
    },
  }}
>
  {/* ... */}
</Stack.Navigator>
```

### TransitionPresets 预设

| 预设 | 效果 |
|---|---|
| `SlideFromRightIOS` | iOS 右滑（默认） |
| `ModalSlideFromBottomIOS` | iOS 底部 Modal |
| `ModalPresentationIOS` | iOS 13+ 卡片式 Modal |
| `FadeFromBottomAndroid` | Android M Fade |
| `RevealFromBottomAndroid` | Android Q Reveal |
| `ScaleFromCenterAndroid` | Android S Scale |
| `DefaultTransition` | 平台默认 |
| `ModalTransition` | 平台 Modal 默认 |

### 自定义 `cardStyleInterpolator`

```tsx
const fadeInterpolator = ({ current }) => ({
  cardStyle: { opacity: current.progress },
})

<Stack.Screen
  name="Fade"
  component={FadeScreen}
  options={{ cardStyleInterpolator: fadeInterpolator }}
/>
```

`current.progress` 是 0→1 的 `Animated.Value`，可任意 interpolate 生成 `transform` / `opacity` 等样式。

### Native Stack vs JS Stack 选型

| 维度 | Native Stack | JS Stack |
|---|---|---|
| 包 | `@react-navigation/native-stack` | `@react-navigation/stack` |
| 实现 | iOS UINavigationController / Android Fragment | 纯 JS + Animated |
| 性能 | **高**（原生 60fps） | **中**（低端 Android 掉帧） |
| iOS 大标题 | 支持 (`headerLargeTitle`) | 不支持 |
| iOS formSheet | 支持 (`presentation: 'formSheet'`) | 不支持 |
| 自定义转场 | 限于内置字符串 | **完全可定制** |
| 自定义 Header | 受限（HTML 风） | 完全可定制 |
| 共享元素 | 难（与原生导航冲突） | 易（纯 JS） |
| 默认推荐 | **是** | 仅在需要深度定制时 |

> **决策树**：默认 Native Stack → 需要 iOS 大标题 / formSheet → Native Stack → 需要共享元素 / 自定义曲线 → JS Stack。

## Bottom Tabs：底部 Tab 导航

`@react-navigation/bottom-tabs` 是底部 Tab 栏导航器。

### 完整示例

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Ionicons from '@expo/vector-icons/Ionicons'

const Tab = createBottomTabNavigator()

<Tab.Navigator
  initialRouteName="Home"
  screenOptions={{
    tabBarActiveTintColor: '#007AFF',
    tabBarInactiveTintColor: '#888',
    tabBarStyle: {
      backgroundColor: '#fff',
      borderTopColor: '#eee',
    },
    tabBarLabelStyle: { fontSize: 12 },
    tabBarHideOnKeyboard: true,
  }}
>
  <Tab.Screen
    name="Home"
    component={HomeScreen}
    options={{
      title: '主页',
      tabBarIcon: ({ focused, color, size }) => (
        <Ionicons
          name={focused ? 'home' : 'home-outline'}
          size={size}
          color={color}
        />
      ),
    }}
  />
  <Tab.Screen
    name="Notifications"
    component={NotificationsScreen}
    options={{
      title: '通知',
      tabBarBadge: 3,
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="notifications" size={size} color={color} />
      ),
    }}
  />
  <Tab.Screen
    name="Profile"
    component={ProfileScreen}
    options={{
      title: '我的',
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="person-circle" size={size} color={color} />
      ),
    }}
  />
</Tab.Navigator>
```

### 关键 Options

| Option | 类型 / 说明 |
|---|---|
| `tabBarLabel` | 字符串或函数（含 `focused` / `color`） |
| `tabBarIcon` | 函数：`({ focused, color, size }) => ReactNode` |
| `tabBarShowLabel` | 是否显示文字（默认 `true`） |
| `tabBarBadge` | 红点数字或字符串 |
| `tabBarBadgeStyle` | Badge 样式 |
| `tabBarStyle` | 整个 tab bar 样式 |
| `tabBarItemStyle` | 单个 tab item 样式 |
| `tabBarLabelStyle` | 文字样式 |
| `tabBarActiveTintColor` | 选中色 |
| `tabBarInactiveTintColor` | 未选中色 |
| `tabBarActiveBackgroundColor` | 选中背景色 |
| `tabBarPosition` | `'bottom'`（默认） / `'top'` / `'left'` / `'right'` |
| `tabBarHideOnKeyboard` | 键盘弹起时隐藏 tab bar |
| `popToTopOnBlur` | 切走时 reset 当前 stack 到栈底 |
| `lazy` | 懒加载（默认 `true`） |

### 响应式 Tab Bar（大屏侧栏）

v7 起 `tabBarPosition: 'left'` 让 tab bar 在大屏（iPad / 横屏）变为侧栏：

```tsx
import { useWindowDimensions } from 'react-native'

function MyTabs() {
  const { width } = useWindowDimensions()
  const isLandscape = width >= 768

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarPosition: isLandscape ? 'left' : 'bottom',
      }}
    >
      {/* ... */}
    </Tab.Navigator>
  )
}
```

### Tab 事件

```tsx
import { useNavigation } from '@react-navigation/native'

function HomeScreen() {
  const navigation = useNavigation()

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      // 用户点击当前 tab → 可阻止默认行为
      // e.preventDefault()
    })
    return unsubscribe
  }, [navigation])
}
```

事件类型：`tabPress` / `tabLongPress`。

### 跳到 Tab：`jumpTo`

```tsx
navigation.jumpTo('Profile', { owner: 'John' })
```

`jumpTo` 用于在 Tab 之间切换、可带 params；**Tabs 没有 `push` / `pop`**（不是 Stack）。

## Drawer：侧滑抽屉

`@react-navigation/drawer` 提供侧滑抽屉导航。**v7 起强依赖 Reanimated 2+ 与 Gesture Handler**。

### 安装

```bash
pnpm add @react-navigation/drawer
npx expo install react-native-reanimated react-native-gesture-handler
```

RN CLI 项目还需要在入口文件第一行 import：

```tsx
// index.js
import 'react-native-gesture-handler'
import { AppRegistry } from 'react-native'
// ...
```

`babel.config.js` 加 Reanimated 插件：

```js
module.exports = {
  plugins: ['react-native-reanimated/plugin'], // 必须在最后
}
```

### 基本用法

```tsx
import { createDrawerNavigator } from '@react-navigation/drawer'
import { NavigationContainer } from '@react-navigation/native'

const Drawer = createDrawerNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={{
          drawerType: 'front',     // 'front' / 'back' / 'slide' / 'permanent'
          drawerPosition: 'left',  // 'left' / 'right'
          drawerStyle: {
            backgroundColor: '#fff',
            width: 280,
          },
          headerShown: true,
        }}
      >
        <Drawer.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: '主页',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: '设置' }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  )
}
```

### drawerType 4 种

| 类型 | 效果 |
|---|---|
| `front` | 抽屉浮在屏幕上、有遮罩（默认） |
| `back` | 抽屉在屏幕后、内容滑开露出 |
| `slide` | 屏幕和抽屉一起滑动 |
| `permanent` | 永远展开（适合 iPad / Web 大屏） |

### 控制 Drawer

```tsx
navigation.openDrawer()    // 打开
navigation.closeDrawer()   // 关闭
navigation.toggleDrawer()  // 切换
navigation.jumpTo('Home')  // 跳到 Drawer 内某 screen
```

### 自定义 Drawer 内容

```tsx
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer'

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="退出登录"
        onPress={() => {
          // 退出逻辑
        }}
      />
    </DrawerContentScrollView>
  )
}

<Drawer.Navigator
  drawerContent={(props) => <CustomDrawerContent {...props} />}
>
  {/* ... */}
</Drawer.Navigator>
```

### Drawer 状态 Hook

```tsx
import {
  useDrawerStatus,
  useDrawerProgress,
} from '@react-navigation/drawer'

function MyScreen() {
  const status = useDrawerStatus() // 'open' | 'closed'
  const progress = useDrawerProgress() // Reanimated SharedValue: 0~1
  // ...
}
```

## Material Top Tabs：顶部 Tab + 滑动切换

`@react-navigation/material-top-tabs` 基于 `react-native-tab-view`，提供 Material Design 风格的顶部 tab + 横向滑动。

### 安装

```bash
pnpm add @react-navigation/material-top-tabs react-native-pager-view
```

### 基本用法

```tsx
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'

const TopTab = createMaterialTopTabNavigator()

<TopTab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#007AFF',
    tabBarLabelStyle: { fontSize: 14 },
    tabBarIndicatorStyle: {
      backgroundColor: '#007AFF',
      height: 3,
    },
    tabBarScrollEnabled: false, // 标签栏可滚动
    swipeEnabled: true,         // 内容区可滑动切换
    lazy: true,                 // 懒加载非活跃 tab
  }}
>
  <TopTab.Screen name="Feed" component={FeedScreen} options={{ title: '动态' }} />
  <TopTab.Screen name="Following" component={FollowingScreen} options={{ title: '关注' }} />
  <TopTab.Screen name="Discover" component={DiscoverScreen} options={{ title: '发现' }} />
</TopTab.Navigator>
```

## 嵌套 Navigator

### 最常见模式：Tabs 包 Stacks

每个 Tab 内含独立 Stack——进入二级页时 **tab bar 仍可见**：

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const HomeStack = createNativeStackNavigator()
const ProfileStack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Feed" component={FeedScreen} />
      <HomeStack.Screen name="PostDetail" component={PostDetailScreen} />
    </HomeStack.Navigator>
  )
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="HomeTab"
          component={HomeStackScreen}
          options={{ title: '主页', headerShown: false }} // Tab 自己不要 header（用 Stack 的）
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackScreen}
          options={{ title: '我的', headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
```

> **关键**：把外层 Tab 的 `headerShown` 关掉——否则会出现**双层 header**（Tab 一个 + Stack 一个）。

### 反过来：Stack 包 Tabs

适合「主体是 Tabs、二级页全屏覆盖（盖住 tab bar）」的场景：

```tsx
const RootStack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator>
        <RootStack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Profile"
          component={ProfileScreen}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  )
}
```

效果：在 Feed / Messages 任意 tab 进 Profile，**tab bar 被盖住**。

### 跨 Navigator 跳转

跳到嵌套 Navigator 内部某 screen——用 `screen` + `params`：

```tsx
// 从 Profile 跳到 Main Tabs 内的 Messages
navigation.navigate('Main', {
  screen: 'Messages',
  params: { user: 'jane' },
})

// 深嵌套：跳到 Main → Settings → Sound
navigation.navigate('Main', {
  screen: 'Settings',
  params: {
    screen: 'Sound',
    params: { volume: 50 },
  },
})
```

### 跨 Navigator 的事件订阅

要在 Stack 内的某 screen 监听**父 Tab 的 tabPress 事件**：

```tsx
function FeedScreen({ navigation }) {
  React.useEffect(() => {
    const parent = navigation.getParent('MyTabs')
    if (!parent) return

    const unsubscribe = parent.addListener('tabPress', (e) => {
      // 父 Tab 按了
      // 例：双击同 tab → 滚回顶部
    })
    return unsubscribe
  }, [navigation])
}
```

> 用 `getParent('MyTabs')` 而不是 `getParent()`——给目标 Navigator 加 `id="MyTabs"` 可精确定位。

### 嵌套层级的陷阱

1. **导航事件先在当前 Navigator 处理**：`goBack` 先尝试本层栈、不行才冒泡
2. **Options 不会跨层级**：父 Tab 的 `tabBarStyle` 不影响子 Stack 的 header
3. **Params 作用域**：每个 screen 的 params 是独立的——子 screen 拿不到父 screen 的 params
4. **不要嵌太深**：3+ 层（如 Drawer → Tab → Stack）虽支持但**性能下降、心智负担陡升**——官方建议**尽量降低嵌套**

### `Group` 与 `groups`：替代过度嵌套

不想嵌套又想**复用 screenOptions**？用 `Stack.Group` / `groups`：

```tsx
// Dynamic
<Stack.Navigator>
  <Stack.Group>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Group>
  <Stack.Group screenOptions={{ presentation: 'modal' }}>
    <Stack.Screen name="Help" component={HelpScreen} />
    <Stack.Screen name="Invite" component={InviteScreen} />
  </Stack.Group>
</Stack.Navigator>
```

```tsx
// Static
const MyStack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
    Profile: ProfileScreen,
  },
  groups: {
    Modal: {
      screenOptions: { presentation: 'modal' },
      screens: { Help: HelpScreen, Invite: InviteScreen },
    },
  },
})
```

`Group` **不是 Navigator**——不增加嵌套层级，仅作为 `screenOptions` 复用容器。

## TypeScript 进阶

### 嵌套 Navigator 的类型：`CompositeNavigationProp`

子 Navigator 内的 screen 跳父级 screen 时，需要**复合类型**：

```ts
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

// 顶层 Stack 的 param list
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>
  Profile: { userId: string }
}

// Tab 的 param list
export type TabParamList = {
  Feed: undefined
  Messages: undefined
}

// 在 Feed 内的 navigation 既能跳 Tabs 内 screen、也能跳父 Stack 内 screen
type FeedNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Feed'>,
  NativeStackNavigationProp<RootStackParamList>
>

function FeedScreen() {
  const navigation = useNavigation<FeedNavigationProp>()
  navigation.jumpTo('Messages')                  // ✅ Tab 内
  navigation.navigate('Profile', { userId: 'a' })// ✅ 父 Stack 内
}
```

### `CompositeScreenProps`：同时类型化 navigation + route

```ts
import type { CompositeScreenProps } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

type FeedScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Feed'>,
  NativeStackScreenProps<RootStackParamList>
>

function FeedScreen({ navigation, route }: FeedScreenProps) {
  // 都已类型化
}
```

### `NavigatorScreenParams`：声明子 Navigator 的 params 形状

父 Stack 跳子 Tabs 时，传 `{ screen, params }` 结构——`NavigatorScreenParams` 告诉 TypeScript 这一点：

```ts
import type { NavigatorScreenParams } from '@react-navigation/native'

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined
  Profile: { userId: string }
}

// 现在：
navigation.navigate('Main', {
  screen: 'Messages',           // ✅ TypeScript 知道 Main 是 TabParamList
  params: { /* 自动类型化 */ },
})
```

### 全局 ReactNavigation.RootParamList 扩展

让所有 `useNavigation()` / `useRoute()` 调用都自动获得类型：

```ts
// src/types/navigation.ts
import type { RootStackParamList } from '@/navigation/types'

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

只要这个文件被加载一次（如 `App.tsx` 顶部 `import './types/navigation'`），所有 hook 都会自动推导。

> **注意**：嵌套场景下 `RootParamList` 应该是**最顶层** Navigator 的 param list。

## Header 完全自定义

### 基础选项（前面已介绍）

`title` / `headerStyle` / `headerTintColor` / `headerTitleStyle` / `headerShown` / `headerBackTitle` / `headerLargeTitle` / `headerTransparent` —— 参考前文 Native Stack Screen Options。

### `headerRight` / `headerLeft`：自定义元素

```tsx
import { Button } from '@react-navigation/elements'

<Stack.Screen
  name="Home"
  component={HomeScreen}
  options={{
    headerRight: () => (
      <Button onPress={() => alert('点击')}>设置</Button>
    ),
    headerLeft: () => (
      <Button onPress={() => alert('菜单')}>菜单</Button>
    ),
  }}
/>
```

> `Button` 来自 `@react-navigation/elements`——**自动适配明暗主题、Header 上的对齐与字号**。

### 动态 Header：`navigation.setOptions`

`headerRight` 直接定义无法访问屏幕内的 state。**在屏幕内动态设置**：

```tsx
import { useNavigation } from '@react-navigation/native'
import { Button } from '@react-navigation/elements'

function HomeScreen() {
  const navigation = useNavigation()
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={() => setCount((c) => c + 1)}>
          +1
        </Button>
      ),
    })
  }, [navigation])

  return <Text>计数: {count}</Text>
}
```

> **最佳实践**：在 `Stack.Screen` 的 `options` 中预定义一个占位 `headerRight`——避免屏幕进入时 header 闪烁。

### `headerTitle`：完全替换标题组件

```tsx
import { Image } from 'react-native'

<Stack.Screen
  name="Home"
  component={HomeScreen}
  options={{
    headerTitle: () => (
      <Image
        style={{ width: 30, height: 30 }}
        source={require('./logo.png')}
      />
    ),
  }}
/>
```

## Modal 模式

### 单个 Modal：用 `presentation`

```tsx
<Stack.Navigator>
  <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen
    name="LoginModal"
    component={LoginScreen}
    options={{
      presentation: 'modal',
      animation: 'slide_from_bottom',
    }}
  />
</Stack.Navigator>
```

### Modal Stack：`Group` 复用

```tsx
<Stack.Navigator>
  {/* 普通卡片 */}
  <Stack.Group>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Details" component={DetailsScreen} />
  </Stack.Group>

  {/* Modal 组——所有 screen 都用 modal presentation */}
  <Stack.Group screenOptions={{ presentation: 'modal' }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Help" component={HelpScreen} />
  </Stack.Group>
</Stack.Navigator>
```

### Modal 类型

| presentation | 效果 |
|---|---|
| `'card'` | 默认 push 转场（不是 Modal） |
| `'modal'` | iOS 顶部留 inset、可下滑关闭 |
| `'transparentModal'` | 背景透明（半屏弹层、确认对话框） |
| `'formSheet'` | iOS 表单 sheet（半屏卡片） |
| `'fullScreenModal'` | 全屏 Modal（盖住整个屏幕） |
| `'containedModal'` / `'containedTransparentModal'` | iOS Container VC |

### 退出 Modal

```tsx
<Button onPress={() => navigation.goBack()}>关闭</Button>
```

iOS Modal **下滑手势**自动调用 `goBack`。

## Deep Linking

### 基础配置

```tsx
import { NavigationContainer } from '@react-navigation/native'

const linking = {
  prefixes: [
    'myapp://',                  // URI Scheme
    'https://app.example.com',   // Universal Link
  ],
  config: {
    screens: {
      Home: 'home',                       // myapp://home
      Profile: 'user/:userId',            // myapp://user/abc
      Settings: {
        path: 'settings',
        screens: {
          Sound: 'sound',                 // myapp://settings/sound
          Account: 'account',             // myapp://settings/account
        },
      },
    },
  },
}

export default function App() {
  return (
    <NavigationContainer
      linking={linking}
      fallback={<Text>加载中...</Text>}
    >
      {/* ... */}
    </NavigationContainer>
  )
}
```

### URL Path 模板

| 模板 | 匹配 |
|---|---|
| `'home'` | `myapp://home` |
| `'user/:userId'` | `myapp://user/123` → params `{ userId: '123' }` |
| `'post/:id?'` | 可选 param |
| `'search'` | `myapp://search?q=foo` → params `{ q: 'foo' }`（query 自动解析） |

### URI Scheme 配置（Expo）

`app.json`：

```json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

`expo-linking` 自动生成 prefixes：

```tsx
import * as Linking from 'expo-linking'

const linking = {
  prefixes: [Linking.createURL('/')],
  config: { /* ... */ },
}
```

### URI Scheme 配置（RN CLI）

iOS — 修改 `AppDelegate.swift`：

```swift
func application(
  _ app: UIApplication,
  open url: URL,
  options: [UIApplication.OpenURLOptionsKey : Any] = [:]
) -> Bool {
  return RCTLinkingManager.application(app, open: url, options: options)
}
```

用 CLI 工具自动注册 scheme：

```bash
npx uri-scheme add myapp --ios
```

Android — 修改 `AndroidManifest.xml`：

```xml
<activity android:name=".MainActivity" android:launchMode="singleTask">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="myapp" />
  </intent-filter>
</activity>
```

或：

```bash
npx uri-scheme add myapp --android
```

### Universal Link（iOS）

`app.json`（Expo）：

```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:app.example.com"]
    }
  }
}
```

服务端必须托管 `https://app.example.com/.well-known/apple-app-site-association` JSON 文件。

### App Link（Android）

`app.json`（Expo）：

```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            { "scheme": "https", "host": "app.example.com" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

服务端托管 `https://app.example.com/.well-known/assetlinks.json` Digital Asset Links JSON。

### 自定义 `getInitialURL` + `subscribe`

集成 Push Notification 唤起的链接：

```tsx
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'

const linking = {
  prefixes: ['myapp://', 'https://app.example.com'],

  // App 启动时的 URL
  async getInitialURL() {
    // 1. 系统 Linking 给的 URL
    const url = await Linking.getInitialURL()
    if (url != null) return url

    // 2. Push Notification 唤起的 URL
    const response = await Notifications.getLastNotificationResponseAsync()
    return response?.notification.request.content.data.url ?? null
  },

  // 运行时新 URL 订阅
  subscribe(listener) {
    const linkSub = Linking.addEventListener('url', ({ url }) => listener(url))

    const notifSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data.url
        if (url) listener(url as string)
      }
    )

    return () => {
      linkSub.remove()
      notifSub.remove()
    }
  },

  config: {
    screens: { Chat: 'chat/:id' },
  },
}
```

### 测试 Deep Link

```bash
# iOS 模拟器
xcrun simctl openurl booted "myapp://chat/jane"

# Android 模拟器
adb shell am start -W -a android.intent.action.VIEW \
  -d "myapp://chat/jane" com.myapp

# uri-scheme CLI
npx uri-scheme open "myapp://chat/jane" --ios
npx uri-scheme open "myapp://chat/jane" --android
```

## Authentication Flow

**核心理念**：根据 `isSignedIn` 状态**渲染两个 Stack**（登录 / 应用），React Navigation 自动转场——**不要 `navigation.navigate('Login')` 手动跳**（不可靠、有安全漏洞）。

### Dynamic 写法

```tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

function App() {
  const [isSignedIn, setIsSignedIn] = React.useState(false)
  // ... 实际从 Context / Redux / Zustand 读

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isSignedIn ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

登录成功 → `setIsSignedIn(true)` → React Navigation 自动转场到 Home、**栈中没有 SignIn**（无法返回）。

### Static 写法：`if` 属性

```tsx
const RootStack = createNativeStackNavigator({
  screens: {
    Home: {
      if: useIsSignedIn,    // 仅当 hook 返回 true 时存在
      screen: HomeScreen,
    },
    SignIn: {
      if: useIsSignedOut,
      screen: SignInScreen,
    },
  },
})
```

### 完整 Auth Flow（含 Token 持久化）

```tsx
import * as React from 'react'
import * as SecureStore from 'expo-secure-store'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const AuthContext = React.createContext<{
  signIn: (token: string) => void
  signOut: () => void
  signUp: (token: string) => void
} | null>(null)

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

const Stack = createNativeStackNavigator()

type AuthState = {
  isLoading: boolean
  isSignout: boolean
  userToken: string | null
}

type AuthAction =
  | { type: 'RESTORE_TOKEN'; token: string | null }
  | { type: 'SIGN_IN'; token: string }
  | { type: 'SIGN_OUT' }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { ...state, userToken: action.token, isLoading: false }
    case 'SIGN_IN':
      return { ...state, isSignout: false, userToken: action.token }
    case 'SIGN_OUT':
      return { ...state, isSignout: true, userToken: null }
  }
}

export default function App() {
  const [state, dispatch] = React.useReducer(authReducer, {
    isLoading: true,
    isSignout: false,
    userToken: null,
  })

  // 启动时从 SecureStore 恢复 Token
  React.useEffect(() => {
    const bootstrap = async () => {
      let userToken: string | null = null
      try {
        userToken = await SecureStore.getItemAsync('userToken')
      } catch (e) {
        // 读失败时按未登录处理
      }
      dispatch({ type: 'RESTORE_TOKEN', token: userToken })
    }
    bootstrap()
  }, [])

  const authContext = React.useMemo(
    () => ({
      signIn: async (token: string) => {
        await SecureStore.setItemAsync('userToken', token)
        dispatch({ type: 'SIGN_IN', token })
      },
      signOut: async () => {
        await SecureStore.deleteItemAsync('userToken')
        dispatch({ type: 'SIGN_OUT' })
      },
      signUp: async (token: string) => {
        await SecureStore.setItemAsync('userToken', token)
        dispatch({ type: 'SIGN_IN', token })
      },
    }),
    []
  )

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator>
          {state.userToken == null ? (
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{
                title: '登录',
                animationTypeForReplace: state.isSignout ? 'pop' : 'push',
              }}
            />
          ) : (
            <Stack.Screen name="Home" component={HomeScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  )
}

function SignInScreen() {
  const { signIn } = useAuth()
  // ...
  return null
}
```

> **`animationTypeForReplace: 'pop'`**：登出时反向转场（从右到左、像「弹」回登录页），用户体验更好。

### 公共屏幕（如帮助页）

如果某些 screen **登录 / 未登录都能访问**，用 `Group` + `navigationKey`：

```tsx
<Stack.Group navigationKey={isSignedIn ? 'user' : 'guest'}>
  <Stack.Screen name="Help" component={HelpScreen} />
</Stack.Group>
```

`navigationKey` 改变时 React Navigation 重置该 Group——避免登录后回到 Help 还显示游客内容。

## State Persistence

把整棵导航状态存到 AsyncStorage、下次启动恢复：

```tsx
import * as React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationContainer } from '@react-navigation/native'

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1'

export default function App() {
  const [isReady, setIsReady] = React.useState(false)
  const [initialState, setInitialState] = React.useState<any>()

  React.useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(PERSISTENCE_KEY)
        setInitialState(saved ? JSON.parse(saved) : undefined)
      } finally {
        setIsReady(true)
      }
    }
    restore()
  }, [])

  if (!isReady) return null

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) => {
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
      }}
    >
      <RootStack />
    </NavigationContainer>
  )
}
```

> **生产环境注意**：State Persistence 在**开发期非常有用**（Hot Reload 不丢导航位置）、**生产期建议关闭或加版本号**——App 更新后导航结构变化、旧 state 反序列化可能崩溃。

## 屏幕事件

### `focus` / `blur`

```tsx
React.useEffect(() => {
  const unsubFocus = navigation.addListener('focus', () => {
    console.log('屏幕聚焦')
  })
  const unsubBlur = navigation.addListener('blur', () => {
    console.log('屏幕失焦')
  })
  return () => {
    unsubFocus()
    unsubBlur()
  }
}, [navigation])
```

> **优先用 `useFocusEffect`**——比手写 `focus`/`blur` 监听更简洁、自动处理 unmount。

### `beforeRemove`：拦截返回

最常见用例：表单未保存时弹确认对话框：

```tsx
function EditScreen({ navigation }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) return // 没有变化、放行

      e.preventDefault() // 拦截

      Alert.alert(
        '丢弃修改？',
        '你有未保存的修改，确定离开吗？',
        [
          { text: '继续编辑', style: 'cancel' },
          {
            text: '丢弃',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      )
    })

    return unsubscribe
  }, [navigation, hasUnsavedChanges])

  // ...
}
```

> `e.data.action` 是被拦截的原始 action——用户确认后用 `navigation.dispatch(e.data.action)` 重新触发（不要 `goBack`，因为可能是 `replace` 或 `reset`）。

### Tab 事件（在 Bottom Tabs 中）

```tsx
React.useEffect(() => {
  const unsubscribe = navigation.addListener('tabPress', (e) => {
    // 用户点击当前 tab 按钮——常见用例：双击 tab 滚回顶部
  })
  return unsubscribe
}, [navigation])
```

事件类型：`tabPress` / `tabLongPress`。

### Drawer 事件

```tsx
navigation.addListener('drawerItemPress', (e) => {
  e.preventDefault() // 阻止默认行为
})
```

## Screen Preloading

v7 新增——**提前渲染**屏幕到内存、加速点击到显示：

```tsx
// 启动后预加载 Profile screen
React.useEffect(() => {
  navigation.preload('Profile', { userId: 'a' })
}, [navigation])

// 实际跳转时已渲染好、瞬间出现
<Button onPress={() => navigation.navigate('Profile', { userId: 'a' })}>
  Profile
</Button>
```

> **注意**：预加载会**立即调用** screen 组件的渲染 + `useEffect`——不能假设 `useFocusEffect` 已跑。

## v6 → v7 关键迁移

### `navigate` 行为变化

```ts
// v6：navigate 会回退到栈中已存在的屏幕
navigation.navigate('Home')  // 在 Home/Details/Profile，跳回 Home

// v7：navigate 不再回退——需要回退用 popTo
navigation.popTo('Home')     // 等价 v6 navigate
navigation.navigate('Home')  // v7：如不存在则推、存在则更新 params
```

### 嵌套 navigate 需显式

```ts
// v6：可以直接跳子 screen
navigation.navigate('Messages')

// v7：必须显式
navigation.navigate('Main', { screen: 'Messages' })
```

### 其他变化

- **NavigationContainer.theme**：现在必须含 `fonts` 字段
- **Stack: `animationEnabled: false`** → **`animation: 'none'`**
- **Native Stack 依赖 `react-native-screens` v4**
- **`unmountOnBlur`** → **`popToTopOnBlur`**（Tabs / Drawer）
- **`Link.to`** → **`Link.screen`** + `Link.params`
- **`independent`** → 包 `<NavigationIndependentTree>`
- **Material Bottom Tab Navigator** 迁移到 `react-native-paper/react-navigation`

完整迁移：[Upgrading from 6.x](https://reactnavigation.org/docs/upgrading-from-6.x)

## 与 Expo Router 对比

**Expo Router 7+**（Expo SDK 50+ 推荐）是**基于 React Navigation**构建的 **file-based** 路由框架——**底层仍是 `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`**，只是把路由表换成 `app/` 目录。

### 对比表

| 维度 | React Navigation（原生） | Expo Router |
|---|---|---|
| 路由表 | 手写 `Stack.Screen` 数组 / Static API screens 对象 | **`app/` 目录文件结构** |
| 二级页 | `<Stack.Screen name="Profile">` | `app/profile.tsx` |
| 动态参数 | `name="user/:userId"` | `app/user/[userId].tsx` |
| Tab 组 | `createBottomTabNavigator` | `app/(tabs)/_layout.tsx` |
| TypeScript Route | 手写 `RootStackParamList` | **类型自动生成**（`expo/types`） |
| Deep Linking | 手写 `linking.config.screens` | **自动**（URL = 文件路径） |
| Web 支持 | 有限 | 一等（同一份 `app/` 跑 RN + Web） |
| 后端 + 跨端 | 仅 RN | RN + Web + Expo Router API Routes |
| 学习曲线 | 中 | 平（写文件即可） |
| 何时选 | 老项目 / 自定义 Navigator | 新项目 / Expo 用户 / 全栈跨端 |

### 共存策略

Expo Router 内部仍是 React Navigation——**所有 React Navigation API 都能用**：

```tsx
// app/profile.tsx
import { useNavigation, useRoute } from '@react-navigation/native'

export default function Profile() {
  const navigation = useNavigation()
  const route = useRoute()
  // ...
}
```

Expo Router 还提供 `expo-router` 自己的 hooks：

```tsx
// app/profile.tsx
import { useRouter, useLocalSearchParams } from 'expo-router'

export default function Profile() {
  const router = useRouter()
  const { userId } = useLocalSearchParams()

  return (
    <Button onPress={() => router.push('/settings')}>设置</Button>
  )
}
```

> **结论**：现在新项目优先 Expo Router；本指南教的所有 React Navigation 概念**都直接适用于 Expo Router 底层**——理解 Native Stack / Bottom Tabs / 嵌套 / Deep Linking / Auth Flow 都是同一套。

## 与 React Router 对比

React Router 是 **Web 路由库**——不能在 React Native 上跑（除非用 `react-router-native`，但官方不推荐）。**两者不可直接迁移**：

| 维度 | React Router 7 | React Navigation 7 |
|---|---|---|
| 平台 | Web（DOM） | React Native |
| URL | **浏览器 URL** | 屏幕栈（Deep Linking 反向映射） |
| 转场 | CSS Transition | 原生导航控制器 |
| 数据加载 | Loader / Action | 手写 `useFocusEffect` 或外部库（TanStack Query） |
| 嵌套 | `<Outlet>` | 嵌套 Navigator |
| 跨端 | 不跨 RN | 不跨 Web（生产可用） |

**RN + Web 同构**项目用 [Solito](https://solito.dev/) 或 **Expo Router**——它们桥接两套。

## 常见坑

### 1. `useNavigation` 在 NavigationContainer 外报错

```tsx
function MyApp() {
  const navigation = useNavigation() // ❌ 在 NavigationContainer 外
  return <NavigationContainer>...</NavigationContainer>
}
```

`useNavigation` 必须在 `<NavigationContainer>` **子树内**——把它移到 Screen 组件内。

### 2. 双层 header

嵌套 Tabs + Stack 时如果不关 Tab 的 header，会出现：

```
[ Header（Tab）  ]
[ Header（Stack） ]
[ Screen 内容    ]
```

修复：

```tsx
<Tab.Screen
  name="HomeTab"
  component={HomeStackScreen}
  options={{ headerShown: false }}
/>
```

### 3. params 包含函数 / 不可序列化对象

```tsx
navigation.navigate('Details', {
  onConfirm: () => {},  // ❌ 函数
  date: new Date(),     // ❌ Date 对象
})
```

State Persistence + Deep Linking 都会失败。**只传 ID / 字符串 / 数字 / 布尔**——回调改用 EventEmitter / 全局 store。

### 4. `navigate` 不带 params 时还能拿到旧 params

```tsx
navigation.navigate('Home')
// route.params 仍然是上次的值——可能让人困惑
```

修复：明确传 `undefined` 或用 `popTo` + `setParams`。

### 5. Modal 嵌套到 Tab 内

Modal **必须放根 Stack**——嵌入 Tab 内的 Modal 会被 tab bar 盖住：

```tsx
const RootStack = createNativeStackNavigator()
// 把 Modal 放 RootStack、不要放某个 Tab 内的子 Stack
```

### 6. `useFocusEffect` 忘记 `useCallback`

```tsx
useFocusEffect(() => {
  // ❌ 每次渲染都重跑
})
```

修复：

```tsx
useFocusEffect(
  React.useCallback(() => {
    // ✅ deps 不变就不重跑
  }, [])
)
```

### 7. 手势返回（iOS）触发后没法阻止

`gestureEnabled: false` 完全禁用、或在 `beforeRemove` 拦截：

```tsx
<Stack.Screen
  name="Editor"
  component={EditorScreen}
  options={{ gestureEnabled: false }}
/>
```

### 8. v7 升级后 `navigate` 不回退

```ts
// v6 行为：v7 已废除
navigation.navigate('Home') // 不再回退到栈中 Home

// v7 用法
navigation.popTo('Home')
```

### 9. TypeScript 全局扩展不生效

```ts
// src/types/navigation.ts
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

确保此文件被 import 至少一次（如 `App.tsx` 顶部加 `import './src/types/navigation'`）——TypeScript 才会读到全局 augmentation。

### 10. Drawer 抽屉打不开

通常是缺 `react-native-gesture-handler` 入口 import 或 Reanimated 插件没配：

```tsx
// index.js 第一行
import 'react-native-gesture-handler'
```

```js
// babel.config.js
module.exports = {
  plugins: ['react-native-reanimated/plugin'], // 必须最后
}
```

## 小结

走完本页应该能：

1. **5 种 Navigator 灵活组合**：Native Stack / JS Stack / Bottom Tabs / Drawer / Material Top Tabs
2. **嵌套模式**：Tabs 包 Stacks、Drawer 包 Tabs 包 Stacks、Modal Stack 平级
3. **跨 Navigator 跳转**：`navigation.navigate(Parent, { screen, params })` + `getParent` 监听父事件
4. **完整 TypeScript 类型化**：嵌套用 `CompositeNavigationProp` / `CompositeScreenProps`、全局扩展 `ReactNavigation.RootParamList`
5. **Header 完全自定义**：`headerRight` / `headerLeft` / `navigation.setOptions` 动态更新
6. **Modal 模式**：`presentation: 'modal' | 'transparentModal' | 'formSheet' | 'fullScreenModal'`
7. **Deep Linking**：URI Scheme + Universal Link / App Link、自定义 `getInitialURL` + `subscribe`
8. **Authentication Flow**：条件渲染两个 Stack、`useReducer` Token 三态、`SecureStore` 持久化
9. **State Persistence**：`initialState` + `onStateChange` + `AsyncStorage`
10. **屏幕事件**：`focus` / `blur` / `beforeRemove` 拦截返回 / `tabPress` 双击滚顶
11. **v6 → v7 迁移**：`navigate` 不再回退（用 `popTo`）/ 嵌套 navigate 必须显式
12. **与 Expo Router 共存**：底层同一套 API、新项目优先 Expo Router

下一步看 **[参考](./reference.md)**——完整 API 速查（5 种 navigator 全签名、`useNavigation` 等 Hook、navigation 方法表、screen options 全表、linking 配置类型、TypeScript 类型工具）。
