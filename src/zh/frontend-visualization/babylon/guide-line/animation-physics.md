---
layout: doc
outline: [2, 3]
---

# 指南 · 动画与物理

> 基于 Babylon.js v9.15。动画：`Animation` 底层对象、`AnimationGroup` 编组、骨骼/变形目标；物理：V1（legacy）与 V2（推荐）架构差异、Havok 的 WASM 异步初始化、`PhysicsAggregate` 简化写法。

## 速查

**动画基础**

- 底层对象 `Animation("name", 属性路径, fps, 类型, 循环模式)` + `setKeys([{frame, value}, ...])` 定义关键帧
- 播放入口：`mesh.animations.push(anim)` + `scene.beginAnimation(mesh, from, to, loop)`；或不挂 `mesh.animations`，直接 `scene.beginDirectAnimation(mesh, [anim], from, to, loop)`
- `scene.beginAnimation` 返回 `Animatable`，支持 `pause()`/`restart()`/`stop()`/`reset()`
- 属性类型覆盖 `FLOAT`/`VECTOR3`/`QUATERNION`/`COLOR3`/`MATRIX`；循环模式 `CYCLE`/`CONSTANT`/`RELATIVE`/`YOYO`
- 缓动用 `EasingFunction` 系列（如 `CubicEase`）配合 `setEasingFunction()`

**AnimationGroup（角色动画标配）**

- `addTargetedAnimation(anim, target)` 打包多条动画+目标；`normalize(from, to)` 统一不同动画的帧区间
- `play(loop)`/`speedRatio`/`onAnimationEndObservable.add(callback)`
- 骨骼/蒙皮：`Skeleton` + `Bone`，glTF/导入模型自带；变形目标 `MorphTarget`（表情/口型常用）
- `AnimationGroupMask`（Include/Exclude）可对分组内动画做精细遮罩控制

**物理引擎：V1 vs V2**

- 官方明确建议：**强烈推荐 V2 over V1**
- V1（legacy）：`PhysicsImpostor`（"简单对象"贴到复杂网格上），支持 CannonJSPlugin/OimoJSPlugin/AmmoJSPlugin
- V2（推荐）：`PhysicsBody` + `PhysicsShape` 分离、可复用 Shape，配 **HavokPlugin**（AAA 级，WASM，MIT 免费）
- 便捷封装 `PhysicsAggregate` 对标 V1 Impostor 的简化写法，一次性绑定 Body+Shape

**Havok 集成流程**

- `await HavokPhysics()` 异步加载 WASM 模块 → `new BABYLON.HavokPlugin(true, havokInstance)` → `scene.enablePhysics(gravity, havokPlugin)`
- 默认重力 `(0, -9.81, 0)` 沿 Y 轴
- `aggregate.dispose()`：内部创建的 shape 自动释放；外部传入的 shape 不会被误删

**调试与关键区别**

- `PhysicsViewer`（代码或 Inspector 的 Debug 面板）可视化"物理引擎眼中的世界"，常用于排查物理形状与视觉网格不一致
- ⚠️ **物理引擎 ≠ 碰撞检测**：物理模拟真实碰撞反弹动力学；`mesh.intersectsMesh`/`ActionManager` 的 `OnIntersectionEnterTrigger` 属于更轻量的简单碰撞检测

## 一、动画基础：Animation 对象

```javascript
const anim = new BABYLON.Animation(
  "myAnim", "position.x", 30 /*fps*/,
  BABYLON.Animation.ANIMATIONTYPE_FLOAT,
  BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
);
anim.setKeys([
  { frame: 0, value: 0 },
  { frame: 30, value: 5 },
]);
mesh.animations.push(anim);
scene.beginAnimation(mesh, 0, 30, true); // target, from, to, loop → 返回 Animatable
// 或不挂 mesh.animations，直接：
scene.beginDirectAnimation(mesh, [anim], 0, 30, true);
```

`Animatable`（`beginAnimation` 的返回值）支持 `pause()`/`restart()`/`stop()`/`reset()`。属性类型覆盖 `FLOAT`/`VECTOR3`/`QUATERNION`/`COLOR3`/`MATRIX`；循环模式 `CYCLE`/`CONSTANT`/`RELATIVE`/`YOYO`。缓动用 `EasingFunction` 系列（如 `CubicEase`）配合 `setEasingFunction()` 让运动不再是死板的线性插值。

## 二、AnimationGroup：角色动画标配

把多条动画 + 目标打包统一控制：

```javascript
const walkGroup = new BABYLON.AnimationGroup("walk");
walkGroup.addTargetedAnimation(anim1, mesh1);
walkGroup.normalize(0, 100); // 统一不同动画的帧区间
walkGroup.play(true);        // loop
walkGroup.speedRatio = 1.5;
walkGroup.onAnimationEndObservable.add(() => {/* 播放结束回调 */});
```

骨骼/蒙皮动画由 `Skeleton` + `Bone` 驱动，glTF/导入模型通常自带；变形目标 `MorphTarget`（表情/口型动画常用）是另一套形变机制。需要对分组内动画做精细遮罩时，`AnimationGroupMask`（Include/Exclude）可以只让特定动画生效（如角色上半身播攻击动画、下半身继续播行走动画）。

## 三、物理引擎：V1（legacy）vs V2（推荐）

官方原话：**强烈推荐使用 V2 而非 V1**。

| | V1（legacy） | V2（推荐） |
|---|---|---|
| 核心概念 | `PhysicsImpostor`（"简单对象"贴到复杂网格上） | `PhysicsBody` + `PhysicsShape` 分离，可复用 Shape |
| 支持插件 | CannonJSPlugin（纯 JS）、OimoJSPlugin、AmmoJSPlugin（Bullet 移植） | **HavokPlugin**（AAA 级，WASM，MIT 免费） |
| 便捷封装 | - | `PhysicsAggregate`（对标 V1 Impostor 的简化写法） |

::: warning 物理 V1→V2 API 断层
`PhysicsImpostor`（V1）与 `PhysicsBody`/`PhysicsShape`/`PhysicsAggregate`（V2）不是同一套 API。老教程/老代码大量还停留在 V1 的 Cannon/Oimo/Ammo 插件，混着抄容易踩版本不对口的坑——新项目直接上 V2 + Havok。
:::

## 四、Havok 集成：异步初始化 + PhysicsAggregate

```javascript
// Havok 异步初始化（WASM 模块）
const havokInstance = await HavokPhysics();
const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), havokPlugin); // 默认重力 -9.81 沿 Y

// 简化写法：PhysicsAggregate 一次性绑定 Body+Shape
const aggregate = new BABYLON.PhysicsAggregate(
  mesh, BABYLON.PhysicsShapeType.BOX, { mass: 1, restitution: 0.75 }, scene
);
aggregate.body.setMassProperties({ mass: 10 }); // 组件仍可单独访问微调
aggregate.dispose(); // 内部创建的 shape 自动释放；外部传入的 shape 不会被误删
```

`PhysicsAggregate` 是快速上手的简化写法；需要多个物体**复用同一个 Shape**（省内存、常见于大量相同刚体）时，手动拆分创建 `PhysicsShape` + `PhysicsBody` 更合适。

## 五、调试与"物理 ≠ 碰撞检测"

调试可视化：代码 `new BABYLON.PhysicsViewer()` 或 Inspector 的 Debug 面板勾选 physics viewer，展示"物理引擎眼中的世界"（常用于排查物理形状与视觉网格不一致，例如碰撞体比模型大一圈）。

::: warning 关键区别：物理引擎 ≠ 碰撞检测
物理引擎模拟**真实碰撞反弹动力学**（质量、恢复系数、约束、连续冲量），**不等于**简单的碰撞检测。`mesh.intersectsMesh`、`ActionManager` 的 `OnIntersectionEnterTrigger` 属于后者——只判断"有没有相交"，更轻量，不涉及真实物理反应。触发提示/拾取用后者足够，需要真实物理交互（弹开、堆叠、约束）才需要接入完整物理引擎。
:::

---

动画与物理搭好后，进入[指南 · GUI、资产与后处理](./gui-assets-postfx)：2D/3D GUI、glTF 资产加载、粒子系统、后处理管线，以及 Inspector/Playground 调试工具。
