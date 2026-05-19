---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **React Navigation 7.x**（2024-2026 主线，`@react-navigation/native@^7` / `@react-navigation/native-stack@^7` 等）。要求 **React Native ≥ 0.72** / **Expo ≥ 52** / **TypeScript ≥ 5.0**。React Navigation 是**专为 React Native 设计**的路由库，**不是 Web 路由**——本页所有示例都是 RN 代码。

## 速查

- 系统要求：**React Native ≥ 0.72** / **Expo ≥ 52** / **TypeScript ≥ 5.0**
- 核心包：`@react-navigation/native`
- Native Stack：`@react-navigation/native-stack`（推荐，走原生平台导航）
- JS Stack：`@react-navigation/stack`（纯 JS，可定制转场）
- Bottom Tabs：`@react-navigation/bottom-tabs`
- Drawer：`@react-navigation/drawer`（需 Reanimated 2+）
- Material Top Tabs：`@react-navigation/material-top-tabs`（需 react-native-pager-view）
- Peer Deps：`react-native-screens` + `react-native-safe-area-context`（**所有 navigator 必装**）
- Expo 装包：`npx expo install react-native-screens react-native-safe-area-context`
- 社区 CLI 装包：`npm install react-native-screens react-native-safe-area-context`，iOS 还要 `npx pod-install ios`
- 顶层包装：`<NavigationContainer>` 包整棵导航树（或 `createStaticNavigation` 静态 API）
- 创建导航器：`const Stack = createNativeStackNavigator()`
- 注册屏幕：`<Stack.Screen name="Home" component={HomeScreen} />`
- 编程式跳转：`navigation.navigate('Details', { id: 1 })`
- 读取参数：`route.params.id`
- Composition Hook：`const navigation = useNavigation()` / `const route = useRoute()`
- TypeScript：定义 `type RootStackParamList = { Home: undefined; Details: { id: string } }`
- 全局类型：`declare global { namespace ReactNavigation { interface RootParamList extends RootStackParamList {} } }`

## React Navigation 是什么

React Navigation 是 **React Native 官方推荐**的路由库，由 [Software Mansion](https://swmansion.com/) 与 [Expo](https://expo.dev/) 工程师维护。它与 React Router / TanStack Router 等 Web 路由的**本质差异**：

| 维度 | React Navigation 7 | Expo Router 7 | React Router 7 | TanStack Router |
|---|---|---|---|---|
| 平台 | **React Native（原生）** | React Native + RN-Web | Web（DOM） | Web（React/Solid） |
| 配置 | **配置式**（`Stack.Screen`）/ Static API | **文件系统**（`app/`） | Data Routers（配置 / 文件） | 文件 + 类型生成 |
| URL | Deep Linking 映射 | 文件路径 = URL | **浏览器 URL** | **浏览器 URL** |
| 核心抽象 | **屏幕栈 + Navigator 树** | 同 React Navigation | URL → Route | 编译期路由表 |
| 转场 | **原生导航控制器**（iOS UINav / Android Frag） | 同 React Navigation | CSS Transition | CSS Transition |
| Deep Linking | `linking.prefixes + config.screens` | 文件路径自动映射 | URL → Loader | URL → Loader |
| 嵌套 | 一等公民（Tabs 包 Stacks 等） | 文件夹嵌套 | Outlet 嵌套 | Outlet 嵌套 |
| TypeScript | `RootStackParamList` 手写 | **自动生成** | 手写 | **编译期推导** |
| 学习曲线 | 中（5 种 Navigator） | 平（文件即路由） | 中 | 陡 |

**含义**：

- React Navigation **不是 Web 路由**——`navigation.navigate('Details')` 不是「跳到 URL `/details`」、而是「在当前 Navigator 内推一个 `Details` 屏幕到栈顶」
- Web 路由（React Router / TanStack Router）的「URL = 应用状态」哲学**不适用于 React Native**——RN 的 App 状态是**屏幕栈 + Tab 索引 + Drawer 开关**的组合
- Deep Linking 是**反向映射**：把 `myapp://chat/jane` 解析回「Tabs → ChatTab → ChatStack → Chat({id: 'jane'})」这棵导航状态
- **学习路径**：先掌握 Native Stack（90% 场景）→ Bottom Tabs（多 tab 应用）→ 嵌套（Tabs 包 Stacks）→ TypeScript 类型化 → Deep Linking → Auth Flow
- **何时选 Expo Router**：新项目 / 已在用 Expo / 希望 file-based 体验 → Expo Router 7+；老项目 / 需要自定义 Navigator / 不想全栈绑死 Expo → React Navigation 原生用法

## 安装

### Expo 项目（推荐）

Expo 项目用 `npx expo install` 安装 RN peer deps，能自动选与当前 Expo SDK 兼容的版本：

```bash
# 1. 核心 + Native Stack
pnpm add @react-navigation/native @react-navigation/native-stack

# 2. RN peer deps（必装）
npx expo install react-native-screens react-native-safe-area-context

# 3. Bottom Tabs（可选）
pnpm add @react-navigation/bottom-tabs

# 4. Drawer（可选，需 Reanimated + Gesture Handler）
pnpm add @react-navigation/drawer
npx expo install react-native-reanimated react-native-gesture-handler
```

> **注意**：`react-native-reanimated` 在 Expo SDK 50+ 默认包含；React Native CLI 项目需手动配 `babel.config.js` 插件。

### React Native CLI 项目

社区 CLI（`npx @react-native-community/cli init`）需要手动装 peer deps + iOS Pod：

```bash
# 1. 核心 + Native Stack
pnpm add @react-navigation/native @react-navigation/native-stack

# 2. peer deps
pnpm add react-native-screens react-native-safe-area-context

# 3. iOS：必须装 Pod
cd ios && pod install && cd ..

# 4. Android：见下方 MainActivity 配置
```

#### Android 平台配置

编辑 `android/app/src/main/java/<your-package>/MainActivity.kt`：

```kotlin
import android.os.Bundle
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
  }

  // ... 其余原有代码
}
```

Java 版本：

```java
import android.os.Bundle;
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    getSupportFragmentManager().setFragmentFactory(new RNScreensFragmentFactory());
    super.onCreate(savedInstanceState);
  }
}
```

并在 `AndroidManifest.xml` 中禁用 Predictive Back（避免与 React Navigation 手势冲突）：

```xml
<application
  android:enableOnBackInvokedCallback="false"
  ...
>
  <!-- ... -->
</application>
```

> **为什么需要 `react-native-screens`？** React Navigation 默认所有屏幕都常驻 JS 内存（即使不可见）。`react-native-screens` 把不可见屏幕**从原生视图树中卸载**——大幅降低内存、加速复杂应用启动。Native Stack 强依赖此包以获得原生导航控制器。

### 验证版本

```bash
pnpm list @react-navigation/native @react-navigation/native-stack
```

输出应类似：

```
@react-navigation/native 7.x.x
@react-navigation/native-stack 7.x.x
```

如果是 6.x，参考 [v6 → v7 迁移指南](https://reactnavigation.org/docs/upgrading-from-6.x)。

## 第一个 Native Stack

### 完整最小示例

新建 `App.tsx`：

```tsx
import * as React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Button } from '@react-navigation/elements'

// 1. 创建 Navigator
const Stack = createNativeStackNavigator()

// 2. 定义屏幕组件
function HomeScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>主页</Text>
      <Button onPress={() => navigation.navigate('Details')}>
        前往详情页
      </Button>
    </View>
  )
}

function DetailsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>详情页</Text>
    </View>
  )
}

// 3. 组装路由
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: '主页' }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{ title: '详情' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 16 },
})
```

启动应用：

```bash
# Expo
pnpm start

# RN CLI
pnpm ios   # 或 pnpm android
```

效果：

- 启动后看到 **「主页」** 屏幕、顶部有 header 显示 "主页"
- 点击 **「前往详情页」** 按钮 → 推一个 **「详情」** 屏幕、header 自动出现返回箭头
- iOS 可从屏幕左缘滑回；Android 按硬件返回键即可

### 三个关键概念

#### NavigationContainer

`NavigationContainer` 是**整个 App 的根容器**——管理导航状态、提供 Deep Linking、主题、State Persistence 入口。**每个 App 只能有一个**（如果实在需要多个独立导航树，用 `NavigationIndependentTree` 包装）。

```tsx
<NavigationContainer
  linking={linking}              // Deep Linking 配置
  theme={DarkTheme}              // 主题
  onStateChange={(state) => ...} // 状态持久化
  fallback={<Text>Loading...</Text>} // Linking 解析期占位
>
  {/* 导航器树 */}
</NavigationContainer>
```

#### Navigator + Screen

`createNativeStackNavigator()` 返回 `{ Navigator, Screen, Group }` 三个组件。**Navigator 是一组屏幕的容器**，Screen 声明单个路由：

```tsx
const Stack = createNativeStackNavigator()

<Stack.Navigator
  initialRouteName="Home"        // 默认屏幕
  screenOptions={{               // 所有屏幕共享的选项
    headerStyle: { backgroundColor: 'tomato' },
    headerTintColor: '#fff',
  }}
>
  <Stack.Screen
    name="Home"
    component={HomeScreen}
    options={{ title: '主页' }}  // 单屏覆盖
  />
  <Stack.Screen name="Details" component={DetailsScreen} />
</Stack.Navigator>
```

> **`name` 必须唯一**——同一 Navigator 内不能两个 Screen 重名。`name` 也是后续 `navigation.navigate(name)` 与 Deep Linking `config.screens` 的 key。

#### navigation prop

每个由 Screen 渲染的组件**自动接收 `navigation` 与 `route` 两个 prop**：

```tsx
function HomeScreen({ navigation, route }) {
  return (
    <Button onPress={() => navigation.navigate('Details')}>
      Go
    </Button>
  )
}
```

但**仅 Screen 的直接子组件**有这两个 prop——孙子组件需要用 `useNavigation()` Hook 拿。详见后文「编程式导航」。

## 屏幕跳转

### `navigation.navigate(name, params?)`

跳到指定 screen——**如果当前栈中已有该 screen，则跳回到那里**而不是新推一个。

```tsx
// 跳到 Details，并传 params
navigation.navigate('Details', { itemId: 86, otherParam: 'foo' })

// 不传 params
navigation.navigate('Profile')
```

### `navigation.push(name, params?)`

**无条件推一个新屏幕到栈顶**——即使当前已在该屏幕，也再推一个新实例。常用于「微博详情页里点用户头像，进另一个用户主页」这类场景：

```tsx
// 当前已在 Details，再推一个 Details
navigation.push('Details', { itemId: 99 })
```

> **`navigate` vs `push` 核心区别**：`navigate` 像浏览器 `<a href>`（已在该页就不跳）；`push` 像 `window.open` / `history.pushState`（无条件新增）。

### `navigation.goBack()`

返回上一屏：

```tsx
<Button onPress={() => navigation.goBack()}>返回</Button>
```

Native Stack **header 上的返回箭头**自动调用 `goBack`；Android 硬件返回键也自动调用。

### `navigation.popTo(name, params?)`

回退到栈中**指定 screen**（如果存在）：

```tsx
// 从 Details/Profile/Settings 一路返回到 Home
navigation.popTo('Home')
```

### `navigation.popToTop()`

回退到栈底（首屏）：

```tsx
navigation.popToTop()
```

### `navigation.replace(name, params?)`

**替换当前栈顶**——常用于登录成功后跳主页（不希望返回到登录页）：

```tsx
// 登录成功后
navigation.replace('Home')
```

> **更好的登录流写法**：用 [Authentication Flow 模式](./guide-line.md#authentication-flow)——根据 `isSignedIn` 渲染不同 Navigator，让 React Navigation 自动转场，**无需 `replace`**。

## 传参与接收

### 传 params

`navigate` / `push` 的第二个参数是 params：

```tsx
navigation.navigate('Details', {
  itemId: 86,
  otherParam: 'anything you want',
})
```

> **params 必须可 JSON 序列化**——不要传函数 / class 实例 / Date 对象（用 ISO 字符串）。这是 [State Persistence](./guide-line.md#state-persistence) 与 Deep Linking 的硬性要求。

### 接收 params

通过 `route.params` 读取：

```tsx
function DetailsScreen({ route }) {
  const { itemId, otherParam } = route.params

  return (
    <View>
      <Text>itemId: {JSON.stringify(itemId)}</Text>
      <Text>otherParam: {JSON.stringify(otherParam)}</Text>
    </View>
  )
}
```

### 默认值 `initialParams`

如果 Screen 总是有 params、不希望调用方每次都传，用 `initialParams` 定默认值：

```tsx
<Stack.Screen
  name="Details"
  component={DetailsScreen}
  initialParams={{ itemId: 42 }}
/>
```

调用方不传 params 时，`route.params.itemId === 42`；传了则按传入的值。

### 更新当前 params

在屏幕内更新自己的 params（不离开屏幕）：

```tsx
navigation.setParams({
  itemId: Math.floor(Math.random() * 100),
})
```

`setParams` **合并**新旧 params——只覆盖传入的 key、保留其他。如需完全替换，用 `navigation.dispatch(CommonActions.setParams(...))`（不常用）。

### 避免的保留字

下列 key 是 React Navigation 保留字，**不要用作 params key**：`screen` / `params` / `initial` / `state` / `path`（嵌套导航器跳转用的 key）。

## Composition Hooks

### `useNavigation`

**非直接 Screen 的子组件**（如深层嵌套的按钮、自定义 header 组件）拿 navigation 对象的标准方式：

```tsx
import { useNavigation } from '@react-navigation/native'

function BackButton() {
  const navigation = useNavigation()

  return (
    <Button onPress={() => navigation.goBack()}>返回</Button>
  )
}
```

`useNavigation` 通过 React Context 取得当前最近的 Navigator——**只能在 NavigationContainer 子树内使用**。

### `useRoute`

读取当前屏幕的 route 对象（含 `params` / `name` / `key`）：

```tsx
import { useRoute } from '@react-navigation/native'

function Header() {
  const route = useRoute()
  return <Text>当前: {route.name}</Text>
}
```

### `useFocusEffect`

屏幕**聚焦时**执行副作用、**失焦时**清理。常用于「**进入屏幕重新拉数据**」：

```tsx
import { useFocusEffect } from '@react-navigation/native'

function ProfileScreen({ route }) {
  const { userId } = route.params

  useFocusEffect(
    React.useCallback(() => {
      let active = true
      ;(async () => {
        const user = await fetchUser(userId)
        if (active) setUser(user)
      })()
      return () => { active = false } // 清理
    }, [userId])
  )

  // ...
}
```

> **`useEffect` vs `useFocusEffect`**：`useEffect` 在屏幕 mount/unmount 时跑一次（mount 后即使被压栈到不可见也不会清理）；`useFocusEffect` 在屏幕**聚焦 / 失焦**时跑——离开屏幕（不一定 unmount）就清理。

### `useIsFocused`

布尔值——当前屏幕是否聚焦：

```tsx
import { useIsFocused } from '@react-navigation/native'

function VideoPlayer() {
  const isFocused = useIsFocused()

  React.useEffect(() => {
    if (!isFocused) pauseVideo()
    else resumeVideo()
  }, [isFocused])
}
```

## Bottom Tabs：第二个 Navigator

大多数 RN App 有底部 tab 栏——`@react-navigation/bottom-tabs` 提供：

```bash
pnpm add @react-navigation/bottom-tabs
```

`App.tsx`：

```tsx
import * as React from 'react'
import { Text, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Tab = createBottomTabNavigator()

function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>主页</Text>
    </View>
  )
}

function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>个人中心</Text>
    </View>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: '主页' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
```

### Tab 图标

`tabBarIcon` 是个函数、收 `{ focused, color, size }`、返回 React 节点：

```tsx
import Ionicons from '@expo/vector-icons/Ionicons'

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
```

### Tab 颜色

`tabBarActiveTintColor` / `tabBarInactiveTintColor` 控制 icon + label 颜色：

```tsx
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#007AFF',
    tabBarInactiveTintColor: '#888888',
  }}
>
  {/* ... */}
</Tab.Navigator>
```

### Tab 上的红点 Badge

```tsx
<Tab.Screen
  name="Notifications"
  component={NotificationsScreen}
  options={{ tabBarBadge: 3 }}
/>
```

`tabBarBadge` 可以是数字或字符串。

## TypeScript 入门

### 定义 Param List

为每个 Navigator 定义一个 Param List 类型——key 是 screen name、value 是 params（无 params 用 `undefined`、可选用 `... | undefined`）：

```ts
// src/navigation/types.ts
export type RootStackParamList = {
  Home: undefined
  Details: { itemId: number; otherParam?: string }
  Profile: { userId: string }
}
```

> **用 `type`、不要用 `interface`**——React Navigation 的泛型对 `interface` 不友好。

### 传给 Navigator

`createNativeStackNavigator` 接受泛型：

```tsx
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()
```

现在 `<Stack.Screen name="..." />` 的 `name` 必须是 `'Home' | 'Details' | 'Profile'`、`initialParams` 必须匹配对应 screen 的 params 类型。

### 类型化屏幕 Props

用 `NativeStackScreenProps` 一键拿到 `navigation` + `route` 类型：

```tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from './types'

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>

function DetailsScreen({ route, navigation }: Props) {
  // route.params 已自动是 { itemId: number; otherParam?: string }
  const { itemId } = route.params

  // navigation.navigate 也自动检查参数
  navigation.navigate('Profile', { userId: 'abc' }) // ✅
  navigation.navigate('Profile', { wrong: 1 }) // ❌ 编译错

  return null
}
```

类似的类型工具：

- `BottomTabScreenProps` from `@react-navigation/bottom-tabs`
- `DrawerScreenProps` from `@react-navigation/drawer`
- `MaterialTopTabScreenProps` from `@react-navigation/material-top-tabs`

### 全局类型扩展：让 `useNavigation()` 也类型安全

默认 `useNavigation()` 返回 `NavigationProp&lt;ParamListBase&gt;`——不带 params 类型。声明全局类型让所有 hook 调用都获得 `RootStackParamList`：

```ts
// src/navigation/types.ts
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

只要这个文件被 import 至少一次（如在 `App.tsx` 中 `import type { RootStackParamList } from './navigation/types'`），全局所有 `useNavigation()` 都会自动推导：

```tsx
function SomeDeepComponent() {
  const navigation = useNavigation()
  navigation.navigate('Details', { itemId: 1 }) // ✅ 已类型化
  navigation.navigate('NotExist') // ❌ 编译错
}
```

### 完整 TypeScript Demo

`src/navigation/types.ts`：

```ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  Home: undefined
  Details: { itemId: number; otherParam?: string }
  Profile: { userId: string }
}

// 工具类型：为每个 Screen 生成 Props
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>
export type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>

// 全局类型扩展
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

`App.tsx`：

```tsx
import * as React from 'react'
import { Text, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Button } from '@react-navigation/elements'

import type {
  RootStackParamList,
  HomeScreenProps,
  DetailsScreenProps,
} from './src/navigation/types'

const Stack = createNativeStackNavigator<RootStackParamList>()

function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>主页</Text>
      <Button
        onPress={() => navigation.navigate('Details', { itemId: 86 })}
      >
        看详情
      </Button>
    </View>
  )
}

function DetailsScreen({ route, navigation }: DetailsScreenProps) {
  const { itemId, otherParam } = route.params
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>itemId: {itemId}</Text>
      <Text>otherParam: {otherParam ?? '(未传)'}</Text>
      <Button onPress={() => navigation.goBack()}>返回</Button>
    </View>
  )
}

function ProfileScreen() {
  return null
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '主页' }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: '详情' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

## Static API：v7 推荐入口

v7 新增 `createStaticNavigation`——**对象配置式** Navigator，更适合 Deep Linking + TypeScript 自动推导。

### 改写示例

```tsx
import * as React from 'react'
import { Text, View } from 'react-native'
import { createStaticNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

function HomeScreen() {
  return <View><Text>主页</Text></View>
}

function DetailsScreen() {
  return <View><Text>详情</Text></View>
}

// 对象配置——所有 screen 在 screens 对象里声明
const RootStack = createNativeStackNavigator({
  initialRouteName: 'Home',
  screens: {
    Home: {
      screen: HomeScreen,
      options: { title: '主页' },
    },
    Details: DetailsScreen, // 简写：等价于 { screen: DetailsScreen }
  },
  screenOptions: {
    headerStyle: { backgroundColor: 'tomato' },
  },
})

// createStaticNavigation 包装后得到一个直接渲染的组件
const Navigation = createStaticNavigation(RootStack)

export default function App() {
  return <Navigation />
}
```

### Static API 的好处

1. **TypeScript 自动推导**：不需要手写 `RootStackParamList`——从 `screens` 对象推
2. **Deep Linking 自动配置**：screen 名 → URL path 一一对应
3. **代码组织更紧凑**：所有 screen 在一个对象里、像 React Router 的 `routes` 数组

### Static vs Dynamic

| 维度 | Static API | Dynamic API |
|---|---|---|
| 入口 | `createStaticNavigation(RootStack)` | `<NavigationContainer>` + `<Stack.Navigator>` |
| 配置方式 | 对象 `{ screens: { ... } }` | JSX `<Stack.Screen>` 子组件 |
| TypeScript | **自动推导**（无需 Param List） | 需手写 `RootStackParamList` |
| Auth Flow 条件渲染 | `if: useIsSignedIn` 函数 | JSX 条件渲染 |
| 动态增删 screen | 不支持 | 支持 |
| 学习成本 | 平 | 中 |
| 何时选 | 新项目、screen 列表稳定 | 老项目、运行时增删 screen |

> **推荐**：新项目优先 Static API；本指南后续示例**两种风格都给出**，便于对照。

## 小结

走完本页应该能：

1. **装好 React Navigation 7**：核心包 + native-stack + bottom-tabs + RN peer deps
2. **跑起第一个 Native Stack**：`NavigationContainer` 包 `Stack.Navigator` + `Stack.Screen`
3. **屏幕间跳转**：`navigation.navigate / push / goBack / popTo / popToTop / replace`
4. **传参与接收**：`navigation.navigate(name, params)` + `route.params`、`initialParams` 默认值、`setParams` 更新
5. **Composition Hooks**：`useNavigation` / `useRoute` / `useFocusEffect` / `useIsFocused`
6. **Bottom Tabs 基础**：`createBottomTabNavigator` + `tabBarIcon` + `tabBarBadge`
7. **TypeScript 类型化**：`RootStackParamList` + `NativeStackScreenProps` + 全局 `ReactNavigation.RootParamList` 扩展
8. **Static API**：`createStaticNavigation` 对象配置式入口

下一步看 **[指南](./guide-line.md)**——5 种 Navigator 详解、嵌套模式、Authentication Flow、Deep Linking、State Persistence、Modal、自定义 Header、TypeScript 进阶（嵌套 Navigator 的 `CompositeNavigationProp`）。
