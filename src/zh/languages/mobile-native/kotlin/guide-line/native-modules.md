---
layout: doc
outline: [2, 3]
---

# 原生模块：React Native Android 桥接与 Gradle 集成

> 基于 React Native 0.75+（新架构 Fabric/TurboModule）与 Kotlin 2.x · 核于 2026-08

## 速查

- **为何写原生模块**：React Native 用 JS 写 UI，但**平台专属能力**（蓝牙/相机/生物识别/后台任务/原生 SDK）必须走原生代码。Android 侧用 Kotlin（或 Java）实现一个**模块**，通过**桥（Bridge）**暴露给 JS 调用。
- **两种架构**：①**旧架构 Bridge**——异步消息队列，JS 与原生之间靠 JSON 序列化通信，有固有延迟；②**新架构（New Architecture，Fabric + TurboModule，RN 0.68+ 可选、0.74+ 默认）**——**JSI（JavaScript Interface）C++ 同步绑定**，可直接持有原生对象引用、同步调用，性能大幅提升。
- **Kotlin 替代 Java 是 Android 新代码事实标准**：2017 年 Google 确立 Kotlin 为官方首选语言后，新工程默认 Kotlin，RN Android 原生模块的新代码也优先 Kotlin。**Java 是 Kotlin 的前身**（1995 年起 Android 与服务端主力近 30 年），**不独立立叶**——仅作为旧 Android 语言与服务端经典语言在对比中提及。Kotlin 与 Java 100% 互操作，可在同一工程混用、渐进迁移。
- **Kotlin 写 RN 模块的优势**：① 空安全（`T?` 编译期检查，减少 NPE）；② 协程（`suspend fun` 写异步，比 Java 的回调优雅）；③ 简洁（data class 一行声明模型，扩展函数加方法）。代价是与 Java 互操作的平台类型陷阱仍需注意。
- **典型流程（旧 Bridge）**：① 在 RN 工程 `android/app/src/main/java/` 下用 Android Studio 新建 Kotlin 文件；② 实现 `ReactContextBaseJavaModule` 子类（Kotlin 可继承 Java 类）；③ 用 `@ReactMethod` 注解暴露方法；④ 实现 `ReactPackage` 注册模块；⑤ JS 侧 `NativeModules.MyModule` 获取。
- **TurboModule（新架构）**：用 **Codegen** 工具从 TypeScript 接口规范自动生成 C++/Java 胶水，开发者只写 Kotlin 实现并继承生成的 `MyModuleSpec`——比手写 Bridge 模板代码少、类型安全、同步调用。
- **Gradle 集成要点**：`android/app/build.gradle` 配 `kotlin_version` 与 `kotlin-android` 插件；新架构需在 `gradle.properties` 设 `newArchEnabled=true`；依赖通过 Maven Central 或本地 AAR 引入。

## 一、为什么需要原生模块

React Native 的核心思想是用 JS 写 UI（最终渲染成原生视图），但**有一类能力 JS 无法触及**：

- **平台 SDK**：Health Connect / 推送通知 / 内购（BillingClient）/ AccountManager——Google 只提供 Java/Kotlin API。
- **硬件底层**：蓝牙（BluetoothAdapter）、NFC、相机（CameraX）、生物识别（BiometricPrompt）。
- **性能关键路径**：图像处理（RenderScript/Coroutines）、加密、大文件 IO、音频处理。
- **集成第三方原生 SDK**：支付宝/微信 SDK、地图 SDK、统计 SDK 几乎都是 AAR 原生库。

这时就要写一个**原生模块（Native Module）**——用 Kotlin/Java 实现功能，通过 RN 的桥暴露给 JS 调用，把 JS 世界与原生世界连起来。

## 二、React Native 桥接的两种架构

### 旧架构：Bridge（异步消息队列）

```
   JS 线程                  Bridge（异步 JSON）              原生主线程
┌──────────┐   ┌─────────────────────────────────┐    ┌──────────────┐
│ JS 调用  │ → │ 序列化为 JSON → 队列 → 反序列化   │ →  │ Kotlin/Java  │
│ 返回值   │ ← │ 序列化为 JSON → 队列 → 反序列化   │ ←  │ 方法返回     │
└──────────┘   └─────────────────────────────────┘    └──────────────┘
```

- **特点**：JS 与原生**完全异步**，靠 JSON 字符串序列化传参（大对象慢）。
- **问题**：① 序列化开销（每帧动画跨桥一次就废）；② 三线程模型（JS / Native / Shadow）协调复杂；③ 不能同步访问原生对象。
- **何时仍用**：旧工程升级前的兼容；简单一次性调用（如打开设置页）。

### 新架构：JSI + TurboModule + Fabric

```
   JS 持有 C++ 对象引用（jsi::Object）—— 同步直接调用
                         │
                         ▼
            TurboModule（C++ 接口，Codegen 生成）
                         │
                         ▼
            Kotlin/Java 实现（同步或异步）
```

- **JSI**：Hermes 引擎提供的 C++ API，让 JS **直接持有原生对象的引用**并**同步调用**——无序列化、无队列。
- **TurboModule**：基于 JSI 的模块系统。开发者用 TS 写接口规范，**Codegen** 自动生成 C++/Java 胶水，Kotlin 实现继承生成的 Spec 基类。
- **Fabric**：基于 JSI 的**新渲染器**——UI 树在 C++ 层构建与 diff，跨线程同步、性能更好、支持并发渲染。
- **迁移**：RN 0.68+ 可选启用，0.74+ 默认开启。新工程必须用新架构，旧工程可渐进迁移。

## 三、原生模块实战（旧 Bridge 架构）

最经典的「用 Kotlin 写 RN Android 原生模块」模式：

```kotlin
// MyModule.kt —— Kotlin 实现部分
package com.myapp

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

class MyModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MyModule"

    @ReactMethod                      // 暴露给 JS
    fun add(a: Double, b: Double, promise: Promise) {
        promise.resolve(a + b)
    }

    @ReactMethod
    fun fetchUser(id: String, promise: Promise) {
        // 协程写异步（需桥接到 RN 的异步世界）
        Thread {
            try {
                val user = userService.fetch(id)   // 假设的同步阻塞调用
                val map = Arguments.makeNativeMap()  // 或用可读 WritableMap
                promise.resolve(user.toJson())
            } catch (e: Exception) {
                promise.reject("FETCH_ERROR", e.message, e)
            }
        }.start()
    }
}
```

```kotlin
// MyPackage.kt —— 注册模块
class MyPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext) =
        listOf(MyModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext) =
        emptyList<ViewManager<*, *>>()
}
```

```ts
// JS 侧调用
import { NativeModules } from 'react-native'
const { MyModule } = NativeModules
const sum = await MyModule.add(1, 2)        // 3
const user = await MyModule.fetchUser('1')
```

- **Kotlin 比 Java 的优势**：① 空安全（参数类型 `String` 而非 `String?` 明示非空）；② 协程（`suspend fun` + `withContext` 替代 Thread）；③ data class（一行声明 User 模型）；④ when 表达式（分支处理更优雅）。
- **Promise vs Callback**：异步方法用 `Promise`（`resolve`/`reject`，配合 JS `await`），或老式 `Callback`（`ReactMethod` 注解的 `Callback` 参数，回调数组）。
- **线程**：`@ReactMethod` 默认在原生**后台线程**执行（非 UI 线程）；需 UI 操作时切到主线程（`runOnUiThread { }` 或 `Handler(Looper.getMainLooper()).post { }`）。

## 四、TurboModule（新架构）

新架构下，模板代码被 **Codegen** 取代——开发者只写 TS 规范 + Kotlin 实现。

```ts
// 1. 写 TS 接口规范（Codegen 据此生成 C++/Java 胶水）
import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  add(a: number, b: number): Promise<number>
  getValueSync(key: string): string   // 同步方法（新架构才支持）
}
export default TurboModuleRegistry.getEnforcing<Spec>('MyModule')
```

```kotlin
// 2. Kotlin 实现 —— 继承 Codegen 生成的 MyModuleSpec（Java 抽象类）
package com.myapp

import com.facebook.react.bridge.*

class MyModule(reactContext: ReactApplicationContext) :
    NativeMyModuleSpec(reactContext) {     // NativeMyModuleSpec 由 Codegen 生成

    override fun getName(): String = "MyModule"

    override fun add(a: Double, b: Double, promise: Promise) {
        promise.resolve(a + b)
    }

    override fun getValueSync(key: String): String {   // 同步方法（JSI 支持）
        return prefs.getString(key, "") ?: ""
    }
}
```

- **Codegen 产物**：在 `node_modules/.generated/android/` 下生成 `NativeMyModuleSpec.java`（抽象类，含方法签名）+ C++ JSI 接口。Kotlin 实现继承 Spec 抽象类并 override 所有方法。
- **同步方法**：新架构最大优势——JS 可同步拿到原生结果（无 Promise 开销），适合频繁调用（每帧动画、手势回调）。
- **升级注意**：从旧 Bridge 迁移时，先确保依赖库都支持新架构，再在 `android/gradle.properties` 设 `newArchEnabled=true`，运行 `npx react-native run-android` 后用 Android Studio 重编译。

## 五、Gradle 集成实战要点

把 Kotlin 原生模块接入 RN Android 工程的关键步骤：

1. **确认 Kotlin 环境**：RN 工程 `android/` 默认已配 Kotlin（`build.gradle` 顶层有 `kotlin_version`，`app/build.gradle` 应用 `kotlin-android` 插件）。若用 Kotlin DSL，`build.gradle.kts` 配 `id("org.jetbrains.kotlin.android")`。
2. **新建 Kotlin 文件**：用 Android Studio 打开 `android/` 目录，在 `app/src/main/java/com/myapp/` 下 New → Kotlin Class/File，命名 `MyModule.kt`。
3. **注册 Package**：在应用的 `MainApplication.kt`（或 `MainApplication.java`）的 `getPackages()` 列表加入 `MyPackage()`。
4. **新架构配置**（TurboModule）：在 `android/gradle.properties` 设 `newArchEnabled=true`，在库的 `package.json` 配 `codegenConfig` 字段，构建时 Codegen 自动生成 Spec。
5. **依赖管理**：通过 Maven Central 在 `app/build.gradle` 的 `dependencies { implementation("...") }` 引入第三方 AAR；本地模块用 `:my-module` 形式 include。
6. **运行验证**：`npx react-native run-android` 启动模拟器/真机，在 JS 中调用 `MyModule.add(1,2)` 验证；用 Android Studio 的 Logcat 看原生日志（`adb logcat`），断点调试用 Debug → Attach to Process 选 RN 宿主进程。
7. **常见坑**：① Kotlin 方法签名必须与 Codegen Spec 严格对齐（类型/参数名），否则运行时找不到方法；② 修改了 Kotlin 文件后必须 Gradle 重新 Build（metro 不会重编原生）；③ Android 模拟器不能测真机专属硬件（如某些蓝牙/相机特性）；④ ProGuard/R8 混淆时需保留 RN 模块的 `@Keep` 或混淆规则。

## 下一步

掌握 RN Android 桥接后，可进入更深入的方向：① 自定义 Fabric 视图组件（用 Kotlin 写原生 ViewGroup，在 JS 中像普通组件一样用）；② 把原生模块发布成独立 npm 包（配 Codegen + Android 的 build.gradle）；③ 与 iOS 端 Swift 模块对齐（参考 [Swift 叶](../../swift/)）。最后回[参考](../reference)速查类型系统与易错点。
