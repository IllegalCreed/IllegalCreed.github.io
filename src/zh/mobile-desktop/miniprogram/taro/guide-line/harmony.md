---
layout: doc
outline: [2, 3]
---

# 纯血鸿蒙三路线

> 基于 Taro 4.x · 核于 2026-07

## 速查

- **三条路线，别混**：`harmony-hybrid`（套壳）≠ `harmony`（ArkTS）≠ `harmony_cpp`（C-API 纯血主推），起始版本、命令、本质各不相同
- **`harmony-hybrid`（v3.6.24+）**：命令 `build:harmony-hybrid`；本质是 **H5 套壳（WebView）**，属**过渡方案**
- **`harmony`（ArkTS，Taro 4.0）**：命令 `taro build --type harmony`；把 React 代码转成 **ArkUI 自定义组件递归渲染**，跑在 ArkVM / ArkTS
- **`harmony_cpp`（C-API，v4.1.0+，纯血鸿蒙主推）**：命令 `taro build --type harmony_cpp`；大部分渲染**下沉 C++**、直调 **ArkUI C-API**；**仅支持 Vite**（`compiler: 'vite'`）
- **C-API 插件**：`@tarojs/plugin-platform-harmony-cpp`，**2025-05-16 正式开源**；配置 `projectPath`（鸿蒙工程目录）、`hapName`（模块名，默认 `entry`）；需 **DevEco Studio**（具体版本以官方为准）
- **C-API 架构**：三层 = `ArkVM`（React 业务）→ `CSSOM + TaroElement 树` → `TaroRenderNode 树`（**Yoga 布局**）；用 **VSync 驱动的任务流水线**管理 样式→测量→布局→渲染
- **相比 ArkTS**：C-API **样式适配更全、渲染更快、组件支持更完整**
- **实战背书**：**京东 APP 纯血鸿蒙版 2024 年 9 月上线**，核心购物链路用 Taro 开发，上线即获华为 **S 级应用认证**

## 一、三条路线，演进顺序（严禁混淆）

「用 Taro 上鸿蒙」并不是一件事，而是**三条彼此独立的路线**，按时间先后演进。写代码/选型前务必分清——它们的**起始版本、构建命令、底层本质完全不同**：

| 路线 | 起始版本 | 命令 / 插件 | 本质 |
| --- | --- | --- | --- |
| **`harmony-hybrid`** | v3.6.24+ | `build:harmony-hybrid` | **H5 套壳（WebView）**，过渡方案 |
| **`harmony`（ArkTS）** | Taro 4.0 | `taro build --type harmony` | React 代码 → **ArkUI 自定义组件递归渲染**（跑在 ArkVM / ArkTS） |
| **`harmony_cpp`（C-API）** | **v4.1.0+** | `taro build --type harmony_cpp` | 大部分渲染**下沉 C++**，直调 **ArkUI C-API**（纯血鸿蒙主推） |

- **`harmony-hybrid`**：最早、最轻，本质是把 H5 塞进 WebView 套壳，只当**过渡**用，性能与观感受限于 WebView。
- **`harmony`（ArkTS）**：Taro 4.0 引入的第一条「原生化」路线，把 React 代码转成 ArkUI 的自定义组件并递归渲染，运行在 ArkVM / ArkTS 层。
- **`harmony_cpp`（C-API）**：**v4.1.0+** 的纯血鸿蒙**主推方案**，把渲染大量下沉到 C++、直调 ArkUI C-API，是 2026 年的重点。

## 二、C-API 方案（`@tarojs/plugin-platform-harmony-cpp`）

C-API 方案 **2025-05-16 正式开源**（官方博客《Taro on Harmony C-API 版本正式开源》）。

### 安装与配置

```bash
pnpm i @tarojs/plugin-platform-harmony-cpp
```

```ts
// config/index.ts（要点）
export default {
  compiler: 'vite', // ⚠️ C-API 仅支持 Vite
  // 插件里配置鸿蒙工程目录与模块名
  // projectPath: 鸿蒙工程目录
  // hapName: 模块名（默认 'entry'）
}
```

- **`compiler` 必须为 `'vite'`**——纯血鸿蒙 C-API **仅支持 Vite** 编译内核，webpack 不行。
- **`projectPath`**：鸿蒙工程（DevEco 工程）目录；**`hapName`**：HAP 模块名，默认 `entry`。
- **类型**：在 `types/global.d.ts` 里引用 `.../plugin-platform-harmony-cpp/types/define.d.ts`。
- **环境**：需安装 **DevEco Studio**（具体版本要求以官方文档为准）。

### 构建命令

```bash
taro build --type harmony_cpp                        # 构建纯血鸿蒙产物
taro build native-components --type harmony_cpp      # 构建原生组件
```

### 能力

- 通过 `usingComponents` / `importNativeComponent` 接入**鸿蒙原生组件**。
- 用**类继承**做运行时定制。
- 内置**虚拟长列表**（懒加载 / 预加载 / 节点复用）。

## 三、C-API 架构（深度）

C-API 方案的目标是**尽量绕开 ArkVM 层的运行时开销**，把重活压到 C++。

### 三层结构

```
ArkVM（业务 / React 代码）
   ↓
CSSOM + TaroElement 树        ← 中间层
   ↓
TaroRenderNode 树（Yoga 布局引擎）  ← 底层，渲染下沉 C++
```

### 性能手段

- 把大部分 **`TaroElement`** 的能力**下沉到 C++**，砍掉 ArkVM 层的运行时体积、**解除父子节点绑定**。
- 用 **VSync 驱动的任务流水线**统一管理 **样式 → 测量 → 布局 → 渲染** 各阶段。
- 直调 **ArkUI C++ API** 高效地建节点 / 设属性 / 绑事件；布局由 **Yoga** 引擎完成。

### 相比 ArkTS 方案

C-API 方案的 **样式适配更全、渲染更快、组件支持更完整**——这也是它被定位为「纯血鸿蒙主推」的原因。

## 四、京东实战背书

Taro 的鸿蒙能力有真实大盘验证：

- **京东 APP 纯血鸿蒙版**：**2024 年 9 月**在鸿蒙应用市场正式上线，**核心购物链路**（首页 / 搜索 / 商详 / 购物车 / 订单 / 结算 / 我的）**用 Taro 开发**，上线即获华为 **S 级应用认证**。
- 官方随后（2024-09~11）发布系列技术博客：React 跑在 ArkUI、W3C CSS 跑鸿蒙、通用事件系统、JDImage 自研图片库、长列表优化等，是理解 Taro 鸿蒙内幕的一手材料。

> 编译内核（Vite）与工程配置详见[工程与构建配置](./build-config)；运行时模型见[架构演进](./architecture)。
