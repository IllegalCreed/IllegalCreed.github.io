---
layout: doc
outline: [2, 3]
---

# 原生模块：React Native iOS 桥接与 Objective-C 前身

> 基于 React Native 0.75+（新架构 Fabric/TurboModule）与 Swift 5.x · 核于 2026-08

## 速查

- **为何写原生模块**：React Native 用 JS 写 UI，但**平台专属能力**（蓝牙/相机/生物识别/后台任务/原生 SDK）必须走原生代码。iOS 侧用 Swift（或 OC）实现一个**模块**，通过**桥（Bridge）**暴露给 JS 调用。
- **两种架构**：①**旧架构 Bridge**——异步消息队列，JS 与原生之间靠 JSON 序列化通信，有固有延迟；②**新架构（New Architecture，Fabric + TurboModule，RN 0.68+ 可选、0.74+ 默认）**——**JSI（JavaScript Interface）C++ 同步绑定**，可直接持有原生对象引用、同步调用，性能大幅提升。
- **Objective-C 是 Swift 的前身**：1984 年 NeXT 创立，2001 年起成为 macOS/iOS 主力语言 30 年。语法古旧（方括号 `[obj msg:arg]`）、头文件繁琐、空指针崩溃频发——2014 年 Swift 取代它成为首选。但**所有 Apple SDK 仍用 OC 写**，Swift 通过**互操作层**调用。新代码用 Swift，**OC 不独立立叶**，仅在 RN 桥接与历史代码上下文出现。
- **Swift 与 OC 互操作**：Swift 可直接调用 OC 代码（通过 Xcode 自动生成的桥接头 `Module-Bridging-Header.h`）；OC 调 Swift 需把 Swift 类标记 `@objc(MyClass)` 并继承 `NSObject`。**RN 桥接的胶水层仍是 OC/OC++**（因为 JSI 是 C++，Swift 调 C++ 有限制），所以一个完整的 RN 原生模块通常是「Swift 实现 + OC 包装层 + JSI 暴露」三段式。
- **TurboModule（新架构）**：用 **Codegen** 工具从 TypeScript 接口规范（`*.ts` 中 `TurboModuleRegistry` `getEnforcing`）自动生成 C++/OC 胶水，开发者只写 Swift 实现——比手写 Bridge 模板代码少、类型安全、同步调用。
- **典型流程**：① 在 RN 工程 `ios/` 下用 Xcode 新建 Swift 文件；② 实现 `NSObject` 子类 + `RCTBridgeModule`（旧）或 `RCTTurboModule`（新）；③ 用 `RCT_EXPORT_METHOD`（OC 宏，Swift 需 `@objc` 标注）暴露方法；④ JS 侧 `NativeModules.MyModule` 或 `TurboModuleRegistry.getEnforcing` 获取。
- **Xcode 集成要点**：CocoaPods（`pod install`）仍是 RN iOS 的依赖管理主流；Swift 与 OC 混编时 Xcode 会提示生成 Bridging Header；新架构需在 `ios/Podfile` 设 `:fabric_enabled => true` 与 `:new_arch_enabled => true`。

## 一、为什么需要原生模块

React Native 的核心思想是用 JS 写 UI（最终渲染成原生视图），但**有一类能力 JS 无法触及**：

- **平台 SDK**：HealthKit / HomeKit / ARKit / 推送通知 / 内购（StoreKit）——Apple 只提供 OC/Swift API。
- **硬件底层**：蓝牙（CoreBluetooth）、NFC、相机（AVFoundation）、生物识别（LocalAuthentication）。
- **性能关键路径**：图像处理（CoreImage/Metal）、加密、大文件 IO、音频 DSP。
- **集成第三方原生 SDK**：支付宝/微信 SDK、地图 SDK、统计 SDK 几乎都是原生库。

这时就要写一个**原生模块（Native Module）**——用 Swift/OC 实现功能，通过 RN 的桥暴露给 JS 调用，把 JS 世界与原生世界连起来。

## 二、React Native 桥接的两种架构

### 旧架构：Bridge（异步消息队列）

```
   JS 线程                  Bridge（异步 JSON）              原生主线程
┌──────────┐   ┌─────────────────────────────────┐    ┌──────────────┐
│ JS 调用  │ → │ 序列化为 JSON → 队列 → 反序列化   │ →  │ OC/Swift 方法 │
│ 返回值   │ ← │ 序列化为 JSON → 队列 → 反序列化   │ ←  │ 返回结果     │
└──────────┘   └─────────────────────────────────┘    └──────────────┘
```

- **特点**：JS 与原生**完全异步**，靠 JSON 字符串序列化传参（大对象慢）。
- **问题**：① 序列化开销（每帧动画跨桥一次就废）；② 三线程模型（JS / Native / Shadow）协调复杂；③ 不能同步访问原生对象。
- **何时仍用**：旧工程升级前的兼容；简单一次性调用（如打开设置页）。

### 新架构：JSI（JavaScript Interface）+ TurboModule + Fabric

```
   JS 持有 C++ 对象引用（jsi::Object）—— 同步直接调用
                         │
                         ▼
            TurboModule（C++ 接口，Codegen 生成）
                         │
                         ▼
            OC/Swift 实现（同步或异步）
```

- **JSI**：Hermes 引擎提供的 C++ API，让 JS **直接持有原生对象的引用**并**同步调用**——无序列化、无队列。
- **TurboModule**：基于 JSI 的模块系统。开发者用 TS 写接口规范，**Codegen** 自动生成 C++/OC 胶水，只留 Swift 实现给开发者写。
- **Fabric**：基于 JSI 的**新渲染器**——UI 树在 C++ 层构建与 diff，跨线程同步、性能更好、支持并发渲染。
- **迁移**：RN 0.68+ 可选启用，0.74+ 默认开启。新工程必须用新架构，旧工程可渐进迁移。

## 三、原生模块实战（旧 Bridge 架构）

最经典的「用 Swift 写 RN iOS 原生模块」模式：Swift 实现 + OC 宏暴露。

```swift
// MyModule.swift —— Swift 实现部分
import Foundation

@objc(MyModule)                      // 暴露给 OC（必须 @objc + 继承 NSObject）
class MyModule: NSObject {
  @objc func add(_ a: Double, _ b: Double,
                 resolve: @escaping (Double) -> Void) {
    resolve(a + b)
  }
}
```

```objc
// MyModule.m —— OC 胶水层（用 RCT 宏把方法暴露给桥）
#import <React/RCTBridgeModule.h>

@interface MyModule : NSObject <RCTBridgeModule>
@end

@implementation MyModule
RCT_EXPORT_MODULE()                  // 注册模块名（默认取类名）

RCT_EXPORT_METHOD(add:(double)a
                  withB:(double)b
                  resolve:(RCTPromiseResolveBlock)resolve) {
  [self add:a b:b resolve:resolve];  // 转调 Swift 实现
}
@end
```

```ts
// JS 侧调用
import { NativeModules } from 'react-native'
const { MyModule } = NativeModules
const sum = await MyModule.add(1, 2)   // 3
```

- **为什么需要 `.m` 胶水**：`RCT_EXPORT_METHOD` 是 OC 宏，Swift 无法直接用——必须用 OC 包一层。这是 Swift 写 RN 模块的「历史负担」。
- **Promise vs Callback**：异步方法返回 `RCTPromiseResolveBlock`/`RCTPromiseRejectBlock`（Promise 模式，配合 JS `await`），或老式 `RCTResponseSenderBlock`（回调数组）。
- **线程**：默认在原生主线程执行；耗时操作应切到后台队列（`DispatchQueue.global().async`），完成后再回主线程 `resolve`。

## 四、TurboModule（新架构）

新架构下，模板代码被 **Codegen** 取代——开发者只写 TS 规范 + Swift 实现。

```ts
// 1. 写 TS 接口规范（Codegen 据此生成 C++/OC 胶水）
import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  add(a: number, b: number): Promise<number>
  getValueSync(key: string): string   // 同步方法（新架构才支持）
}
export default TurboModuleRegistry.getEnforcing<Spec>('MyModule')
```

```swift
// 2. Swift 实现（继承 RCTBridgeModule 仍兼容旧桥）
import Foundation

@objc(MyModule)
class MyModule: NSObject {
  @objc(add:withB:resolve:reject:)
  func add(_ a: Double, _ b: Double,
           resolve: @escaping (Double) -> Void,
           reject: @escaping (String, String, Error?) -> Void) {
    resolve(a + b)
  }

  @objc(getValueSync:)                // 同步方法（新架构 JSI 才支持）
  func getValueSync(_ key: String) -> String {
    UserDefaults.standard.string(forKey: key) ?? ""
  }
}
```

- **Codegen 产物**：在 `node_modules/.generated/ios/` 下生成 `<ModuleName>Spec.h`（OC 头）+ `<ModuleName>.h`（C++ JSI 接口）。Swift 实现需匹配规范签名（`@objc` selector 名要对齐）。
- **同步方法**：新架构最大优势——JS 可同步拿到原生结果（无 Promise 开销），适合频繁调用（每帧动画、手势回调）。
- **升级注意**：从旧 Bridge 迁移时，先确保依赖库都支持新架构，再在 `ios/Podfile` 启用 `:new_arch_enabled => true`，运行 `pod install` 后用 Xcode 重编译。

## 五、Objective-C 前身与互操作

理解 OC 的存在感，能解释为什么 Swift 写 RN 仍离不开 `.m` 文件。

- **历史**：OC 是 1984 年 NeXT 创立的语言（C + Smalltalk 风格消息传递），1996 年随 NeXT 被 Apple 收购成为 macOS/iOS 主力，统治 Apple 平台近 30 年。**2014 年 Swift 发布后逐步退居幕后**——Apple 不再为 OC 添加新特性，新框架（SwiftUI/Swift Concurrency）只服务 Swift。
- **现状**：① 所有 Apple SDK（UIKit/Foundation/CoreData…）仍用 OC 写，Swift 通过**互操作层**透明调用；② 大量老工程、第三方库仍是 OC；③ C/C++ 与 Swift 的桥接仍需 OC/OC++（如 RN 的 JSI 胶水）。
- **Swift 调 OC**：在 Xcode 中新建 OC 文件时，IDE 提示创建 **Bridging Header**（`ModuleName-Bridging-Header.h`），把要用的 OC 头 import 进去，Swift 即可像调普通 API 一样用。
- **OC 调 Swift**：把 Swift 类标 `@objc`、继承 `NSObject`（或 `@objcMembers` 标注所有成员），OC 通过自动生成的头 `<ModuleName>-Swift.h` 调用。
- **为什么不直接 Swift ↔ C++**：Swift 的 C++ 互操作（Swift 5.9+ 引入，仍在完善）有限制，且 RN 的 JSI 是 C++ 抽象类——OC++（OC 的 C++ 扩展）是当前最稳妥的胶水层。所以 RN iOS 原生模块的「Swift 实现 + OC 包装」三段式仍主流。

## 六、Xcode 集成实战要点

把原生模块接入 RN iOS 工程的关键步骤：

1. **新建文件**：用 Xcode 打开 `ios/<ProjectName>.xcworkspace`，File → New → File → Swift File，命名 `MyModule.swift`。Xcode 会提示「是否创建 Bridging Header」，选**是**。
2. **同时建 OC 胶水**（旧 Bridge 才需）：再 New File → Objective-C File（`MyModule.m`），实现 `RCT_EXPORT_MODULE` 与 `RCT_EXPORT_METHOD`。
3. **Podfile 配置**（新架构）：在 `ios/Podfile` 设 `:fabric_enabled => true` 与 `:new_arch_enabled => true`，然后 `cd ios && pod install`。
4. **TS 规范 + Codegen**（TurboModule）：在库的根目录建 `src/NativeMyModule.ts`，配 `package.json` 的 `codegenConfig` 字段，构建时 Codegen 自动生成胶水。
5. **运行验证**：`npx react-native run-ios` 启动模拟器，在 JS 中调用 `MyModule.add(1,2)` 验证；用 Xcode 断点调试原生侧（Debug → Attach to Process 选 RN 宿主进程）。
6. **常见坑**：① Swift 方法 selector 名（`@objc(funcName:withB:)`）必须与 OC 胶水/Codegen 规范严格对齐，否则运行时找不到方法（unrecognized selector 崩溃）；② 修改了 Swift 文件后必须 Xcode 重新 Build（metro 不会重编原生）；③ iOS 模拟器不能测蓝牙/相机等真机硬件。

## 下一步

掌握 RN iOS 桥接后，可进入更深入的方向：① 自定义 Fabric 视图组件（用 Swift 写原生 UIView，在 JS 中像普通组件一样用）；② 把原生模块发布成独立 npm 包（配 Codegen + Podspec）；③ 与 Android 端 Kotlin 模块对齐（参考 [Kotlin 叶](../../kotlin/)）。最后回[参考](../reference)速查类型系统与易错点。
