---
layout: doc
outline: [2, 3]
---

# 入门：定位、上下文与第一个三角形

> 基于 WebGL 1.0 / 2.0（2026 浏览器基线）· 核于 2026-07

## 速查

- **全称与定位**：Web Graphics Library，嵌入 `<canvas>` 的 JS API，基于 OpenGL ES，无需插件即可调用 GPU 硬件加速；它不是"3D 库"，而是浏览器暴露的**光栅化 API**——只认点/线/三角形，3D 效果全靠开发者写的着色器"算出来"。
- **与 Canvas 2D 的关系**：并列而非从属——同为 `<canvas>` 的上下文类型（`"webgl"`/`"webgl2"` vs `"2d"`），Canvas 2D 内建路径/文本/图像，WebGL 只认三角形。
- **两个版本**：`"webgl"`（WebGL1，OpenGL ES 2.0，2015 起 Widely）/ `"webgl2"`（WebGL2，OpenGL ES 3.0，2021 起 Widely，94.44% 可用，向后兼容 WebGL1）。
- **获取上下文**：`canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl")`，失败返回 `null` 必须判空处理。
- **上下文互斥**：同一个 canvas 元素不能先后拿到 `"2d"` 和 `"webgl"`——上下文类型一旦创建即固定，再取别的类型返回 `null`。
- **上下文属性**（`getContext` 第二参 `contextAttributes`）：
  - `alpha`（默认 `true`）：绘图缓冲是否含 alpha 通道，影响与页面背景合成
  - `antialias`（默认 `true`）：是否开启多重采样抗锯齿（受硬件支持）
  - `depth`/`stencil`（默认 `true`/`false`）：是否配深度/模板缓冲
  - `preserveDrawingBuffer`（默认 `false`，性能更优）：截图/`toDataURL` 需设 `true`
  - `powerPreference`（默认 `"default"`）：`"high-performance"`/`"low-power"`，双显卡设备的 GPU 选择提示
- **渲染管线口诀**：顶点数据（Buffer）→ 顶点着色器（逐顶点）→ 图元装配 → 裁剪（clip space）→ 光栅化（生成片元）→ 片元着色器（逐片元）→ 逐片元操作（深度/模板→混合）→ 帧缓冲。
- **可编程 vs 固定**：只有顶点/片元着色器两个阶段可编程；图元装配、光栅化、逐片元测试的"发生位置"固定，但可用状态开关配置行为。
- **两个着色器的强制输出**：顶点着色器必写 `gl_Position`（裁剪空间坐标）；片元着色器必写 `gl_FragColor`（WebGL1）或自定义 `out` 变量（WebGL2）。
- **三条数据通道**：`attribute`（逐顶点变化，CPU 传数据进 GPU 的入口）/ `uniform`（全局不变）/ `varying`（顶点→片元，光栅化阶段自动插值），WebGL2 里 `attribute`/`varying` 分别改名 `in`/`out`。
- **编译四步**：`createShader`（`VERTEX_SHADER`/`FRAGMENT_SHADER`）→ `shaderSource` → `compileShader` → `getShaderParameter(COMPILE_STATUS)` 判断，失败读 `getShaderInfoLog()`。
- **链接四步**：`createProgram` → `attachShader` ×2 → `linkProgram` → `getProgramParameter(LINK_STATUS)` 判断，失败读 `getProgramInfoLog()`。
- **Buffer 三步**：`createBuffer` → `bindBuffer(ARRAY_BUFFER, buf)` → `bufferData(ARRAY_BUFFER, new Float32Array(...), STATIC_DRAW)`。
- **顶点属性两步**：`vertexAttribPointer(...)` 配置完之后必须 `enableVertexAttribArray(location)`，否则该 attribute 静默取默认值（典型症状：图形全黑或顶点重合于原点）。
- **清屏三部曲**：`clearColor(r, g, b, a)` 设置颜色 → `clear(gl.COLOR_BUFFER_BIT)` 执行清除。
- **绘制调用**：`drawArrays(mode, first, count)` 无索引直接按顶点顺序绘制；三角形是基本图元，`gl.TRIANGLES` 是最常用的绘制模式。
- **颜色约定**：WebGL 颜色分量一般用 `0.0~1.0` 的浮点数表示，而非 `0~255` 整数（`texImage2D` 的原始像素数据除外）。
- **一个 program 的最低要求**：至少一个顶点着色器 + 一个片元着色器，两者链接（link）成一个 program 才能 `useProgram()` 使用。
- **位置句柄**：`getAttribLocation(program, name)`/`getUniformLocation(program, name)` 分别取 attribute/uniform 的位置句柄，后续设置数据都要用这个句柄。
- **useProgram 生效范围**：`gl.useProgram(program)` 切换"当前使用的着色器程序"，之后的绘制调用都用这个 program，切换绘制对象时常需要重新调用。
- **多对象场景**：一个 canvas 画多个对象，通常靠多次 `drawArrays`/`drawElements` 调用，每次调用前切换所需的 buffer/uniform。
- **动画驱动**：`requestAnimationFrame` 是 WebGL 动画的标准驱动方式，每帧回调里更新 uniform（如旋转角度）再重新绘制一次。
- **进阶顺序**：本页 → [渲染管线与着色器](./guide-line/pipeline-and-shaders) → [缓冲区与绘制](./guide-line/buffers-and-draw) → [纹理与变换](./guide-line/textures-and-transforms) → [WebGL2 与进阶](./guide-line/webgl2-and-advanced) → [参考](./reference)。

## 一、定位：光栅化引擎，不是 3D 引擎

webglfundamentals.org 开篇原话："**WebGL is just a rasterization engine. It draws points, lines, and triangles based on code you supply.**"——三维效果（透视、光照、动画）全部是开发者通过顶点/片元着色器"算出来"的，WebGL 本身不理解"3D"这个概念，只认裁剪空间（clip space）里的三角形。作者进一步强调："**Getting WebGL to do anything else is up to you**"——变换矩阵、投影、光照模型统统是用户态代码（通常配 gl-matrix），GPU 编程模型就是"提供顶点着色器 + 片元着色器这两个函数"，别的都不管。

这条心智模型划出了三条边界：

- **WebGL vs Canvas 2D**：两者是并列关系，都是 `<canvas>` 的上下文类型（`"webgl"`/`"webgl2"` vs `"2d"`），不是继承关系。Canvas 2D 内建路径/文本/图像等高级绘图 API；WebGL 只认三角形，连"画一条线"都要自己搭状态机。
- **WebGL vs Three.js / Babylon.js**：这些库是在 WebGL（或 WebGPU）之上封装出的更高层框架，内建场景图、相机、材质、灯光、资源管理。业务项目做 3D 可视化几乎不会脱离这类库直接手写 WebGL，除非是做引擎本身或对包体积、控制粒度有极端要求。
- **能力上限 vs 抽象层级**：GPU 并行光栅化的能力上限很高（游戏级 3D、百万级粒子、实时滤镜），但 WebGL 本身没有场景图、没有相机/材质/灯光的内建概念——这也是它"入门门槛高、面试爱考"的根本原因。

## 二、获取 WebGL 上下文

```javascript
const canvas = document.querySelector("#glcanvas");
const gl =
  canvas.getContext("webgl2") || // 优先 WebGL2
  canvas.getContext("webgl") || // 兜底 WebGL1
  canvas.getContext("experimental-webgl"); // 极旧浏览器
if (!gl) {
  alert("无法初始化 WebGL，你的浏览器、操作系统或硬件等可能不支持 WebGL。");
}
```

关键事实：`getContext()` 失败（浏览器/硬件不支持）返回 `null`，必须判空；同一个 canvas 元素**一旦确定了上下文类型就固定**，先取了 `"webgl"` 再想取 `"2d"` 只会拿到 `null`。

`getContext()` 第二参 `contextAttributes`（`WebGLContextAttributes`）控制上下文的底层行为：

| 属性 | 默认值 | 作用 |
| --- | --- | --- |
| `alpha` | `true` | 绘图缓冲是否含 alpha 通道，影响与页面背景的合成 |
| `antialias` | `true` | 是否开启多重采样抗锯齿（MSAA，受硬件支持） |
| `depth` | `true` | 绘图缓冲是否配 ≥16 位深度缓冲 |
| `stencil` | `false` | 绘图缓冲是否配 ≥8 位模板缓冲 |
| `preserveDrawingBuffer` | `false` | `false` 时每帧渲染后缓冲可能被清空（性能更优）；截图/`toDataURL` 需设 `true` |
| `premultipliedAlpha` | `true` | 颜色通道是否已按 alpha 预乘，影响与页面合成的方式 |
| `failIfMajorPerformanceCaveat` | `false` | 若只能软件渲染（无 GPU 加速）则拒绝创建上下文 |
| `powerPreference` | `"default"` | `"high-performance"`/`"low-power"`，双显卡设备的 GPU 选择提示 |

## 三、渲染管线概览

WebGL 的渲染管线是**固定顺序、不可跳步**的流水线：

```
顶点数据(Buffer) → 顶点着色器(逐顶点执行) → 图元装配(点/线/三角形)
  → 裁剪(clip space 视锥外裁剪) → 光栅化(生成片元候选像素)
  → 片元着色器(逐片元/像素上色) → 逐片元操作(深度/模板测试→混合) → 写入帧缓冲
```

其中只有**顶点着色器**与**片元着色器**两站是可编程的（开发者写 GLSL），图元装配、裁剪、光栅化、逐片元测试"发生的位置"固定不可编程，但可以通过状态开关（`enable(DEPTH_TEST)`、`blendFunc(...)` 等）配置它们的行为。这条主线会在下一页[渲染管线与着色器](./guide-line/pipeline-and-shaders)里逐站展开，这里先建立"两个可编程站点夹在一串固定流水线里"的整体图像。

## 四、第一个三角形：管线最小闭环

下面这段代码把上一节的管线走完整一遍——从 Buffer 到屏幕上的一个三角形，是理解 WebGL 后续一切内容的最小闭环。

**第一步：写两个着色器（WebGL1 语法）**

```glsl
// ===== 顶点着色器 =====
attribute vec2 aPosition; // 逐顶点输入：裁剪空间坐标（已在 -1~1 范围内，暂不引入 MVP 矩阵）
attribute vec4 aColor;    // 逐顶点输入：颜色
varying lowp vec4 vColor; // 传给片元着色器，光栅化阶段自动按重心坐标插值

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0); // 必写：裁剪空间坐标 (x, y, z, w)
  vColor = aColor;
}
```

```glsl
// ===== 片元着色器 =====
varying lowp vec4 vColor; // 与顶点着色器同名的 varying 接收插值后的颜色
void main() {
  gl_FragColor = vColor; // 必写：本片元的最终颜色
}
```

三个顶点各给了不同颜色，中间区域会看到三色向内插值渐变——这就是"光栅化自动做重心插值"的直观效果。

**第二步：编译链接（几乎每个 WebGL 程序都要写的样板代码）**

把上面两段 GLSL 分别存成字符串变量 `vsSource`（顶点着色器源码）、`fsSource`（片元着色器源码），再执行编译链接：

```javascript
function loadShader(gl, type, source) {
  const shader = gl.createShader(type); // gl.VERTEX_SHADER / gl.FRAGMENT_SHADER
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader)); // 编译错误日志，调试第一步
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program)); // 链接错误日志
    return null;
  }
  return program;
}

const program = initShaderProgram(gl, vsSource, fsSource);
```

**第三步：准备 Buffer 数据**

```javascript
// 三角形的三个顶点：裁剪空间坐标 (x, y)
const positions = new Float32Array([0.0, 0.8, -0.8, -0.8, 0.8, -0.8]);
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

// 三个顶点各自的颜色：红、绿、蓝
const colors = new Float32Array([
  1, 0, 0, 1,
  0, 1, 0, 1,
  0, 0, 1, 1,
]);
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
```

**第四步：把 Buffer 接到 attribute，然后绘制**

```javascript
const positionLoc = gl.getAttribLocation(program, "aPosition");
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0); // vec2，2 分量
gl.enableVertexAttribArray(positionLoc); // 必须显式开启，否则 attribute 恒为默认值

const colorLoc = gl.getAttribLocation(program, "aColor");
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0); // vec4，4 分量
gl.enableVertexAttribArray(colorLoc);

gl.useProgram(program);
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3); // 从第 0 个顶点开始，取 3 个顶点画一个三角形
```

至此，"Buffer → attribute → 顶点着色器 → 光栅化插值 → 片元着色器 → 屏幕像素"这条最小闭环就走完了。这里为了先聚焦管线本身，坐标直接写在裁剪空间（`gl_Position = vec4(aPosition, 0.0, 1.0)`），没有引入相机与投影——MVP 矩阵变换在[纹理与变换](./guide-line/textures-and-transforms)一页详细展开。

---

理解了这个最小闭环后，进入[渲染管线与着色器](./guide-line/pipeline-and-shaders)：会把管线拆到每一站、把 GLSL 的 WebGL1/WebGL2 语法差异、精度限定这些"必考细节"讲透。
