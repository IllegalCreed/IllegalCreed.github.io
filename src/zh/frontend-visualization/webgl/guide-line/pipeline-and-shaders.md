---
layout: doc
outline: [2, 3]
---

# 渲染管线与着色器：GLSL 顶点 / 片元编程

> 基于 WebGL 1.0 / 2.0（2026 浏览器基线）· 核于 2026-07

## 速查

- **管线固定顺序**：顶点数据(Buffer) → 顶点着色器(逐顶点) → 图元装配 → 裁剪(clip space) → 光栅化(生成片元) → 片元着色器(逐片元) → 逐片元操作(深度/模板→混合) → 帧缓冲。
- **可编程 vs 固定**：只有顶点/片元着色器可编程；图元装配/光栅化/逐片元测试"发生的位置"固定，但可用状态开关配置行为（深度函数、混合函数、面剔除方向等）。
- **顶点着色器**：输入 `attribute`(逐顶点变化) + `uniform`(全局不变)，必须写 `gl_Position`(裁剪空间坐标)。
- **光栅化自动插值**：`varying` 的值由三个顶点的值按重心坐标插值得到，不需要手写插值代码——这是 GPU 固定管线阶段替你做的事。
- **片元着色器**：必须写 `gl_FragColor`(WebGL1)或自定义 `out` 变量(WebGL2)；执行次数远高于顶点着色器（性能要点：能放顶点着色器算的就不要放片元）。
- **GLSL 版本**：WebGL1 用 GLSL ES 1.00；WebGL2 用 GLSL ES 3.00，需在源码**首行**声明 `#version 300 es`（前面不能有任何字符/空行/注释，否则编译报错）。
- **WebGL1 → WebGL2 关键字改名**：
  - 顶点着色器 `attribute` → `in`
  - 顶点着色器里的 `varying`（写出）→ `out`
  - 片元着色器里的 `varying`（读入）→ `in`
  - 片元着色器 `gl_FragColor` → 自定义 `out vec4` 变量
- **精度三档**：`lowp` / `mediump` / `highp`。顶点着色器有默认精度 `highp`；**片元着色器没有默认值，必须显式声明**，否则编译报错。
- **移动端精度坑**：`highp` 在片元阶段可能不被支持或性能极差，最佳实践建议避免片元着色器强依赖 `highp`，可用 `getShaderPrecisionFormat()` 检测实际支持度。
- **编译四步**：
  1. `createShader(type)`——`type` 为 `gl.VERTEX_SHADER`/`gl.FRAGMENT_SHADER`
  2. `shaderSource(shader, source)`——写入 GLSL 源码字符串
  3. `compileShader(shader)`——触发编译
  4. `getShaderParameter(shader, COMPILE_STATUS)` 检查，失败读 `getShaderInfoLog()`
- **链接四步**：`createProgram` → `attachShader` ×2（顶点+片元各一次）→ `linkProgram` → `getProgramParameter(LINK_STATUS)` 检查，失败读 `getProgramInfoLog()`。
- **调试第一步**：`gl.getShaderInfoLog()`/`gl.getProgramInfoLog()` 看编译/链接错误，永远是"画面不对"排查的起点。
- **版本语法必须成对升级**：WebGL2 上下文里保留老的 `attribute`/`varying`（GLSL ES 1.00 向后兼容，可正常编译），但一旦加了 `#version 300 es` 却仍留着 `attribute`/`gl_FragColor` 就会编译失败。
- **`#ifdef GL_ES` 无意义**：这个条件在 WebGL 环境里恒为 `true`（WebGL 的 GLSL 编译器本身就是 ES 方言），写这行判断没有意义，是从桌面 OpenGL 抄来的过时写法。
- **uniform 赋值按类型选函数**：标量 `uniform1f`/`uniform1i`，向量 `uniform2/3/4fv`，矩阵 `uniformMatrix4fv`（第二参恒传 `false`，占位保留）。
- **program 使用前提**：一个 WebGL 程序至少需要一个顶点着色器 + 一个片元着色器，两者 `linkProgram` 成功后才能 `useProgram()`。
- **location 获取与缓存**：`getAttribLocation(program, name)`/`getUniformLocation(program, name)` 有查表开销，应在初始化阶段查一次并缓存，不要放渲染循环里重复查询。
- **精度声明写法**：片元着色器头部写 `precision mediump float;`（WebGL2 里紧跟在 `#version 300 es` 之后），缺失则编译失败。
- **WebGL1 无版本声明要求**：GLSL ES 1.00 没有 `#version` 强制规则，这是 WebGL2/GLSL ES 3.00 才引入的新约束。
- **图元装配与光栅化都是固定阶段**：把顶点组织成点/线/三角形（图元装配）、把图元转成片元候选（光栅化）都在裁剪之后自动发生，开发者无法插入自定义代码，只能通过状态开关影响其行为。
- **varying/in-out 命名配对**：顶点着色器与片元着色器里同名（且同类型）的 `varying`（或 WebGL2 的 `out`/`in`）才能配对传值，名字或类型不一致会导致链接失败或取值异常。
- **进阶顺序**：本页 → [缓冲区与绘制](./buffers-and-draw) → [纹理与变换](./textures-and-transforms) → [WebGL2 与进阶](./webgl2-and-advanced) → [参考](../reference)。

## 一、渲染管线全景

WebGL 的渲染管线是固定顺序的流水线，不可跳步、不可乱序：

```
顶点数据(Buffer) → 顶点着色器(逐顶点执行) → 图元装配(点/线/三角形)
  → 裁剪(clip space 视锥外裁剪) → 光栅化(生成片元候选像素)
  → 片元着色器(逐片元/像素上色) → 逐片元操作(深度/模板测试→混合) → 写入帧缓冲
```

逐站拆解：

- **顶点着色器**：对 Buffer 里的每一个顶点执行一次，输入是 `attribute`（逐顶点变化的数据，如位置/颜色/法线）与 `uniform`（本次绘制全局不变的数据，如变换矩阵），必须写出 `gl_Position`（裁剪空间坐标）。
- **图元装配**：把顶点按绘制模式（`TRIANGLES`/`LINES`/`POINTS` 等）组织成图元（点/线/三角形）。
- **裁剪**：丢弃视锥（clip space 立方体）之外的部分，只保留会被看到的图元。
- **光栅化**：把裁剪空间里的三角形转换成一系列片元（候选像素），并自动做重心插值——顶点着色器写出的 `varying` 的值，就是这样从三个顶点插值出来的，不需要手写插值代码。
- **片元着色器**：对每一个片元执行一次，必须写出 `gl_FragColor`（WebGL1）或自定义 `out` 变量（WebGL2）。执行次数远高于顶点着色器（通常数十到数百倍），是性能优化的重点关照对象：**能放顶点着色器算的东西，就不要放片元着色器**。
- **逐片元操作**：深度测试、模板测试、混合等，决定这个片元最终是否、以及如何写入帧缓冲。
- **可编程 vs 固定**：只有顶点/片元着色器阶段用户可编程；图元装配、光栅化、逐片元测试的"发生位置"固定不可编程，但可以通过状态开关（`depthFunc`、`blendFunc`、`cullFace` 等）配置这些固定阶段的具体行为——[纹理与变换](./textures-and-transforms)会展开这部分。

## 二、着色器三件套：attribute / uniform / varying

WebGL1 使用 **GLSL ES 1.00**：

```glsl
// ===== WebGL1：顶点着色器 =====
attribute vec4 aVertexPosition; // 逐顶点输入
attribute vec4 aVertexColor;
uniform mat4 uModelViewMatrix; // 全局不变
uniform mat4 uProjectionMatrix;
varying lowp vec4 vColor; // 传给片元着色器，自动插值

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vColor = aVertexColor;
}
```

```glsl
// ===== WebGL1：片元着色器 =====
varying lowp vec4 vColor;
void main() {
  gl_FragColor = vColor;
}
```

三条通道各自的角色：

- **attribute**：逐顶点变化的数据（位置、颜色、法线、纹理坐标……），是 CPU 端 Buffer 喂给 GPU 的入口，只存在于顶点着色器。
- **uniform**：一次绘制调用内全局不变的数据（变换矩阵、光照参数、纹理单元号……），顶点/片元着色器都能读。赋值按类型选函数：标量用 `uniform1f`/`uniform1i`，向量用 `uniform2/3/4fv`，矩阵用 `uniformMatrix4fv`（第二参恒传 `false`，是历史遗留的占位参数）。
- **varying**：顶点着色器写出、片元着色器读入，中间由光栅化阶段自动做重心插值——这是"三角形内部颜色渐变"这类效果的来源，开发者不需要手写插值逻辑。

`getAttribLocation(program, name)` / `getUniformLocation(program, name)` 分别取 attribute/uniform 的位置句柄，后续设置数据都要用这个句柄；应在初始化阶段查一次并缓存，不要放进渲染循环重复查询（详见[进阶篇的性能小节](./webgl2-and-advanced)）。

## 三、WebGL2 GLSL ES 3.00：in/out 与 #version 300 es

WebGL2 使用 **GLSL ES 3.00**，语法上 `attribute`/`varying` 被 `in`/`out` 取代：

```glsl
// ===== WebGL2 / GLSL ES 3.00：顶点着色器 =====
#version 300 es
in vec4 aVertexPosition; // attribute → in
in vec4 aVertexColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
out lowp vec4 vColor; // 顶点着色器里 varying → out

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vColor = aVertexColor;
}
```

```glsl
// ===== WebGL2 / GLSL ES 3.00：片元着色器 =====
#version 300 es
precision mediump float;
in lowp vec4 vColor; // 片元着色器里 varying → in
out vec4 outColor; // 需自定义 out 变量替代 gl_FragColor
void main() {
  outColor = vColor;
}
```

三条硬规则：

1. **`#version 300 es` 必须是源码第一行**，前面不能有任何字符、空行或注释，否则编译报错。
2. **关键字对应关系**：顶点着色器 `attribute` → `in`；顶点着色器里的 `varying` → `out`；片元着色器里的 `varying` → `in`；片元着色器 `gl_FragColor` → 自定义 `out vec4` 变量（名字任意，但要在片元着色器里声明）。
3. **版本声明与语法必须成对升级**：WebGL2 上下文默认向后兼容 GLSL ES 1.00 语法（保留 `attribute`/`gl_FragColor` 也能正常编译），但一旦加上 `#version 300 es` 却还留着旧语法，就会编译失败——不能只改一半。

顺带一提一个从桌面 OpenGL 抄来的过时写法：`#ifdef GL_ES` 这个条件判断在 WebGL 环境里恒为 `true`（WebGL 的 GLSL 编译器本身就是 ES 方言），写这行判断没有实际意义。

## 四、精度限定 precision

GLSL 有三档精度限定符：`lowp` / `mediump` / `highp`。关键规则：

- **顶点着色器有默认精度 `highp`**，可以不显式声明。
- **片元着色器没有默认精度，必须显式声明**（一般在文件头写 `precision mediump float;`），否则编译直接失败——这是 WebGL1/WebGL2 都要求的。
- **移动端坑**：`highp` 在片元阶段的移动 GPU 上可能不被支持，或者支持但性能极差。最佳实践是避免片元着色器强依赖 `highp`，必要时用 `gl.getShaderPrecisionFormat()` 检测实际支持情况后再决定用哪档精度。

## 五、编译链接四步与调试

无论 WebGL1 还是 WebGL2，编译链接的样板代码都是这四步 + 四步：

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
```

- **编译四步**：`createShader` → `shaderSource` → `compileShader` → 用 `getShaderParameter(COMPILE_STATUS)` 检查是否成功。
- **链接四步**：`createProgram` → `attachShader`（顶点+片元各一次）→ `linkProgram` → 用 `getProgramParameter(LINK_STATUS)` 检查是否成功。
- **调试第一步永远是读日志**：`gl.getShaderInfoLog()` 看编译错误、`gl.getProgramInfoLog()` 看链接错误——"画面不对但代码看起来没错"的问题，十有八九是着色器编译/链接阶段就已经失败，只是没打日志没发现。

---

理解了管线与着色器之后，下一页[缓冲区与绘制](./buffers-and-draw)讲清楚 Buffer 怎么把顶点数据喂给 attribute，以及 `drawArrays`/`drawElements` 这些绘制调用如何驱动整条管线跑起来。
