---
layout: doc
outline: [2, 3]
---

# React Native 样式与布局

> 基于 React Native 0.86 · 核于 2026-07

## 速查

- **用 JS 写样式**：无 CSS 文件/语言，所有核心组件接受 `style` prop；属性 **camelCase**（`backgroundColor` 非 `background-color`）
- **三种写法**：内联对象 / `StyleSheet.create({...})` / **样式数组** `style={[a, b]}`（**后者覆盖前者**，`false`/`null` 忽略）
- **无 CSS 继承/级联**：继承**只在 `<Text>` 嵌套子树内**；不能靠父 `View` 设全局字体 → 封装 `MyAppText` 基础组件
- **Flexbox 与 Web 的差异**（高频考点）：`flexDirection` 默认 **`column`**（Web row）；`flexShrink` 默认 **0**（Web 1）；`alignContent` 默认 `flex-start`（Web stretch）；`flex` 只接受**单个数字**
- **Text 规则**：**所有文本必须包在 `<Text>`**，裸串放 `<View>` 报错；`<Text>` 内文本流（inline）、可嵌套并继承；`numberOfLines`/`ellipsizeMode`
- **TextInput**：受控 `value` + **`onChangeText`（直接给字符串，非事件对象）**；`keyboardType`/`secureTextEntry`/`multiline`
- **单位**：**无单位 dp（密度无关像素）**，非 px；**Android 不支持负 margin**；触摸区不能超父视图；`position: static` 仅新架构
- **平台代码**：`Platform.OS`（`'ios'`/`'android'`）、`Platform.select({ ios, android })`、`Platform.Version`（**Android 整数 / iOS 字符串**）；文件后缀 `Foo.ios.js`/`Foo.android.js`/`Foo.native.js` 自动分流

## 一、RN 的样式系统：用 JS 写样式

RN **没有 CSS 文件、也没有 CSS 语言**。样式是普通的 **JS 对象**，通过 `style` prop 传给核心组件，属性名用 **camelCase**：

```tsx
import { View, Text, StyleSheet } from "react-native";

function Card() {
  return (
    <View style={styles.card}>
      <Text style={[styles.title, styles.emphasis]}>标题</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, backgroundColor: "#fff" },
  title: { fontSize: 18, color: "#333" },
  emphasis: { fontWeight: "700", color: "#c00" }, // 数组样式里后者覆盖前者
});
```

三种写法与优先级：

- **内联对象**：<code v-pre>style={{ margin: 8 }}</code>，简单但每次渲染新建对象。
- **`StyleSheet.create({...})`**：集中定义、可复用，推荐。
- **样式数组**：`style={[a, b, cond && c]}`——**后面的覆盖前面的**，`false`/`null`/`undefined` 会被忽略，非常适合条件样式。

## 二、没有级联，继承只在 Text 内

这是与 Web 的根本差异：**RN 基本没有 CSS 的继承与级联**。你**不能**靠给根 `<View>` 设 `fontFamily` 就让全 App 文字生效。

- 唯一的有限继承发生在 **`<Text>` 嵌套子树内**：外层 `<Text>` 的 `fontWeight`/`color`/`fontSize` 会被内层 `<Text>` 继承。
- 想复用文字样式，最佳实践是**封装一个基础文本组件**（如 `MyAppText`）来代替 CSS 的全局字体设定。

```tsx
// 用组件复用替代「全局 CSS 字体继承」
function MyAppText({ style, ...props }) {
  return <Text style={[{ fontFamily: "Inter", color: "#222" }, style]} {...props} />;
}
```

## 三、Flexbox 在 RN 的差异（超高频考点）

RN 用 **Yoga** 引擎实现 Flexbox，但**默认值与 Web CSS 不同**，这是新手最常踩的坑：

| 属性 | RN 默认 | Web 默认 |
| --- | --- | --- |
| `flexDirection` | **`column`** | `row` |
| `flexShrink` | **`0`** | `1` |
| `alignContent` | `flex-start` | `stretch` |
| `flex` | 只接受**单个数字** | 支持 `grow shrink basis` 简写 |

- `flex: 1` 表示按比例填充主轴；`justifyContent`（主轴）、`alignItems`（交叉轴，默认 `stretch`）、`alignSelf`、`flexWrap`（默认 `nowrap`）、`gap/rowGap/columnGap` 与 Web 一致。
- 尺寸 `width/height` 支持 `auto`/数值(dp)/百分比；支持 LTR/RTL，`start`/`end` 随书写方向变。

> 记忆点：**「布局怎么反了」十有八九是忘了 RN 默认 `column`**——想横向排列要显式写 `flexDirection: 'row'`。

## 四、Text 组件规则

- **所有文本必须包在 `<Text>` 里**：把裸字符串直接塞进 `<View>`（`<View>Hello</View>`）会**抛异常**——这是与 Web 的关键差异。
- `<Text>` 内部是**文本流（inline）布局**：多个子 `<Text>` 连成一行；而放在 `<View>` 里的多个 `<Text>` 各自成块。
- 可**嵌套并继承**样式——外层 `<Text>` 的 `fontWeight`/`color` 会被内层 `<Text>` 继承：

```tsx
<Text style={{ fontWeight: "700" }}>粗<Text style={{ color: "red" }}>红</Text></Text>
```
- 常用 props：`numberOfLines`（截断行数）、`ellipsizeMode`（默认 `tail`）、`onPress`、`selectable`、`allowFontScaling`；`fontFamily` 只接受单个字体名。

## 五、TextInput（受控组件）

RN 的输入框与 Web `<input>` 最大的差异在回调形态：

```tsx
import { useState } from "react";
import { TextInput } from "react-native";

function NameField() {
  const [text, setText] = useState("");
  // onChangeText 直接把最新字符串作为参数回调，不是事件对象、无需 e.target.value
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      placeholder="请输入姓名"
      keyboardType="default"
    />
  );
}
```

- 受控写法：`value` + `onChangeText`。
- 常用 props：`keyboardType`（`numeric`/`email-address` 等）、`secureTextEntry`（密码）、`multiline`、`onSubmitEditing`。

## 六、单位、平台差异与平台代码

### 单位与平台差异

- 尺寸是**无单位的 dp（密度无关像素）**，框架按屏幕密度换算成物理像素，**不写 px**。
- **Android 不支持负 margin**；触摸区域不能超出父视图边界；`position: static` 仅新架构支持。

### 平台特定代码

```tsx
import { Platform } from "react-native";

const styles = {
  paddingTop: Platform.OS === "ios" ? 44 : 0,
  ...Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.1 },
    android: { elevation: 4 },
  }),
};

// Platform.Version：Android 是整数 API level，iOS 是字符串（需 parseInt 再比较）
const apiLevel = Platform.OS === "android" ? Platform.Version : parseInt(String(Platform.Version), 10);
```

- **`Platform.OS`** → `'ios'`/`'android'`（还有 `'web'` 等）。
- **`Platform.select({...})`** 按平台返回值/组件。
- **`Platform.Version`**：**Android 整数、iOS 字符串**（经典易错点）。
- **文件后缀分流**：`Foo.ios.js`/`Foo.android.js` 让 `import './Foo'` 自动选平台文件；`Foo.native.js` 让 RN 取原生版、Web 打包器取 `Foo.js`。
