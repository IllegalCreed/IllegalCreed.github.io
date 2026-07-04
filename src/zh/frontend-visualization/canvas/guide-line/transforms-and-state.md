---
layout: doc
outline: [2, 3]
---

# 变换与状态：transform / save-restore / 合成 / 裁剪

> 基于 Canvas 2D API（2026 浏览器基线）· 核于 2026-07

## 速查

- **变换改的是坐标系**：影响**之后**的绘制，已画的像素不动（立即模式）；矩阵依次叠乘，**顺序敏感**——先 translate 再 rotate ≠ 反过来。
- **不吃变换的两位**：`shadowOffsetX/Y` 不受变换影响；`putImageData` 无视变换/合成/alpha。
- **三板斧**：`translate(x, y)` 原点平移；`rotate(angle)` 绕**当前原点**顺时针旋转（弧度）；`scale(sx, sy)` 缩放，**负值 = 镜像**（`scale(-1, 1)` 水平翻转）。
- **角度是弧度**：`rotate((Math.PI / 180) * deg)`；直接传度数 = 转错十几圈。
- **矩阵四件**：
  - `transform(a, b, c, d, e, f)` —— 当前矩阵 × 新矩阵（**叠加**）；
  - `setTransform(a, b, c, d, e, f)` —— 先重置为单位矩阵再设（**绝对**）;
  - `resetTransform()` —— 等价 `setTransform(1, 0, 0, 1, 0, 0)`；
  - `getTransform()` —— 返回 DOMMatrix。
- **六参含义**：`a` 水平缩放、`b` 垂直倾斜、`c` 水平倾斜、`d` 垂直缩放、`e` 水平位移、`f` 垂直位移。
- **绕图形中心旋转三步**（rotate 永远绕原点）：`translate(cx, cy)` → `rotate(θ)` → `translate(-cx, -cy)`。
- **save/restore 栈**：`save()` 快照压栈、`restore()` 弹栈恢复；必须**配对**，栈式嵌套。
- **快照内容（完整清单）**：
  - 变换矩阵 + **裁剪路径**；
  - `strokeStyle` / `fillStyle` / `globalAlpha` + 线型五件（`lineWidth/lineCap/lineJoin/miterLimit/lineDashOffset`）；
  - `shadow*` 四件 + `globalCompositeOperation`；
  - 文本四件（`font/textAlign/textBaseline/direction`）+ `imageSmoothingEnabled`。
- **当前路径不属于状态**：不被 save/restore 保存——`beginPath()` 与 save/restore 互不相干（必考）。
- **循环标准范式**：每轮 `save()` → 变换 → 画 → `restore()`，避免变换累积偏移。
- **不配对的后果**：多 save 少 restore → clip/变换「泄漏」到后续所有绘制，且栈越积越深；clip 必用 save/restore 包裹（或 try/finally 保 restore）。
- **合成 gCO**：`globalCompositeOperation` 默认 `"source-over"`，共 **26 个值**（Porter-Duff 12 类 + blend modes；老中文教程「12 种」的说法以参考页 26 值为准）。
- **gCO 高频（抠/垫）**：`destination-out` 橡皮擦/刮刮卡；`destination-over` 垫背景（MDN 太阳系例：先画前景、后垫背景）。
- **gCO 高频（蒙/光）**：`source-in` 蒙版填充；`source-atop` 贴花；`lighter` 发光粒子；`copy` 整帧替换；`xor` 反选；`multiply`/`screen`/`overlay` 等 PS 混合模式。
- **gCO 属状态**：在 save/restore 快照内，用完恢复——否则后续绘制全被灵异合成。
- **裁剪 clip**：当前路径 → 裁剪区，之后绘制只在区内可见；默认裁剪区 = 整个画布；多次 clip 取**交集**；支持 `clip(path, fillRule)`。
- **clip vs source-in**：效果近似，但 clip **不画任何东西**、不受后续图形影响；裁剪路径属于状态、可 save/restore。
- **clip 无法单独撤销**：只能靠 `restore()` 弹回裁剪前状态——先 `save()` 再 `clip()` 是铁律。
- **带变换清屏清不净**：translate 后 `clearRect(0,0,w,h)` 清的是变换后的矩形——先 `setTransform(1,0,0,1,0,0)` 回单位矩阵再清（save/restore 包裹，详见[动画页](./animation)）。
- **拾取与变换**：`isPointInPath` 传入的坐标是**未经变换的画布坐标**，不受当前 transform 影响。
- **重设 width 副作用**：给 `canvas.width` 赋值（即使同值）= 清位图 + **重置全部状态**（含变换/裁剪），dpr 适配随之失效。

## 一、变换：改变坐标系而非图形

Canvas 的变换不作用于「已画的图形」（立即模式没有图形对象），而是**改变坐标系**，影响之后的绘制命令。矩阵依次叠乘，**顺序敏感**：先 `translate` 再 `rotate`，与先 `rotate` 再 `translate`，结果完全不同。

```js
ctx.translate(x, y);   // 原点平移
ctx.rotate(angle);     // 绕【当前原点】顺时针旋转（弧度）
ctx.scale(sx, sy);     // 缩放；负值 = 镜像（scale(-1, 1) 水平翻转）

ctx.transform(a, b, c, d, e, f);    // 当前矩阵 × 新矩阵（叠加）
ctx.setTransform(a, b, c, d, e, f); // 先重置为单位矩阵再设（绝对）
ctx.resetTransform();               // = setTransform(1, 0, 0, 1, 0, 0)
ctx.getTransform();                 // 返回 DOMMatrix
```

矩阵六参：`a` 水平缩放、`b` 垂直倾斜、`c` 水平倾斜、`d` 垂直缩放、`e` 水平位移、`f` 垂直位移。

### 绕图形中心旋转（必会三步）

`rotate` 永远绕**原点**转。想绕图形中心转，先把原点搬过去：

```js
ctx.translate(cx, cy);            // ① 原点移到图形中心
ctx.rotate((Math.PI / 180) * 25); // ② 旋转（弧度！）
ctx.translate(-cx, -cy);          // ③ 移回
ctx.fillRect(150, 30, 100, 100);
```

## 二、save/restore：状态栈（必考）

上下文是状态机，`save()` 把当前状态快照压栈，`restore()` 弹栈恢复。**快照内容（MDN 完整清单）**：

- 变换矩阵；
- `strokeStyle` / `fillStyle` / `globalAlpha`；
- `lineWidth` / `lineCap` / `lineJoin` / `miterLimit` / `lineDashOffset`；
- `shadowOffsetX/Y` / `shadowBlur` / `shadowColor`；
- `globalCompositeOperation`；
- `font` / `textAlign` / `textBaseline` / `direction`；
- `imageSmoothingEnabled`；
- **裁剪路径**。

**当前路径不属于状态、不被保存**——`beginPath()` 与 save/restore 互不相干，这是最常见的认知混淆点。

```js
ctx.fillRect(0, 0, 150, 150);   // 默认黑
ctx.save();                      // 压栈：默认态
ctx.fillStyle = "#09F";
ctx.fillRect(15, 15, 120, 120);
ctx.save();                      // 压栈：蓝色态
ctx.fillStyle = "#FFF";
ctx.globalAlpha = 0.5;
ctx.fillRect(30, 30, 90, 90);
ctx.restore();                   // 回到蓝色态
ctx.fillRect(45, 45, 60, 60);
ctx.restore();                   // 回到默认态
ctx.fillRect(60, 60, 30, 30);
```

两条纪律：

1. **循环里改变换/样式的标准范式**：每轮 `save()` → 变换 → 画 → `restore()`，否则变换逐轮叠乘、越转越偏。
2. **save/restore 严格配对**：多 save 少 restore 会让 clip/变换「泄漏」到后续所有绘制，且栈越积越深；关键路径可用 try/finally 保证 restore 执行。

另外注意：给 `canvas.width` 赋值（**即使同值**）会清空位图并**重置全部状态**——变换、样式、裁剪、状态栈全没了，dpr 适配随之失效。清屏别用这招（见[动画页](./animation)清屏三法）。

## 三、合成：globalCompositeOperation

默认新图形画在旧内容**之上**（`"source-over"`）。`globalCompositeOperation` 改变新旧像素的合成规则，共 **26 个值**（Porter-Duff 12 类合成 + CSS blend modes；老中文教程页说「12 种」，以 gCO 参考页 26 值为准）。高频值：

| 值 | 效果 | 典型用途 |
| --- | --- | --- |
| `source-over` | 新图画在旧图上（默认） | 常规绘制 |
| `destination-over` | 新图画到旧图**后面** | 补背景/太阳系轨道垫底 |
| `destination-out` | 旧图中与新图重叠处被抠掉 | **橡皮擦/刮刮卡** |
| `source-in` | 只留新图与旧图重叠部分 | 蒙版填充 |
| `source-atop` | 新图只画在旧图之上的重叠区 | 贴花 |
| `lighter` | 颜色相加 | 发光粒子 |
| `copy` | 只显示新图 | 整帧替换 |
| `xor` | 重叠处变透明 | 反选效果 |
| `multiply` / `screen` / `overlay` / `darken` / `lighten` … | PS 混合模式 | 滤镜合成 |

gCO 属于状态（在 save/restore 快照里），用完记得恢复，否则后续绘制全被「合成」出灵异效果。

## 四、裁剪：clip

`clip()` 把**当前路径**变成裁剪区，之后的绘制只在区内可见：

```js
ctx.save();                 // clip 无法单独撤销，先存档
ctx.beginPath();
ctx.arc(0, 0, 60, 0, Math.PI * 2, true);
ctx.clip();                 // 当前路径 → 裁剪区；之后绘制只在圆内可见
// ...绘制星空等
ctx.restore();              // 恢复裁剪前状态
```

关键性质：

- **clip 与 `source-in`/`source-atop` 效果近似，但 clip 不画任何东西**、且不受后续图形影响。
- 裁剪路径属于状态，可 save/restore；**除 restore 外没有「取消裁剪」的办法**——先 `save()` 再 `clip()` 是铁律。
- 默认裁剪区 = 整个画布；**多次 clip 取交集**（只会越裁越小）。
- 支持 `clip(path, fillRule)`——配 Path2D 与奇偶规则可裁出环形等复杂区域。

坐标系、状态栈、合成、裁剪是静态画面的最后一块拼图；下一页[动画](./animation)把它们组装成每帧重绘的动态循环。
