---
layout: doc
outline: [2, 3]
---

# 参考：WebGL API / GLSL / 常量速查

> 基于 WebGL 1.0 / 2.0（2026 浏览器基线）· 核于 2026-07

## 速查

- **心智模型**：光栅化引擎，只认点/线/三角形；3D 效果全靠 GLSL 着色器"算出来"，不是内建概念；它是 `<canvas>` 的另一种上下文，与 Canvas 2D 并列而非从属。
- **两个版本**：`"webgl"`（OpenGL ES 2.0，2015 起 Widely）/ `"webgl2"`（OpenGL ES 3.0，2021 起 Widely，94.44% 可用，完全向后兼容 WebGL1）。
- **获取上下文**：`canvas.getContext("webgl2") || canvas.getContext("webgl")`，失败返回 `null` 必须判空；同一 canvas 上下文类型一旦确定即固定。
- **状态机脾气**：任何操作都作用于"当前绑定"的 buffer/texture/framebuffer/program，切换对象前忘记重新绑定是最隐蔽的 bug 来源。
- **管线口诀**：Buffer → 顶点着色器 → 图元装配 → 裁剪 → 光栅化 → 片元着色器 → 逐片元操作 → 帧缓冲；仅两站可编程，其余固定但可配置行为。
- **着色器三件套**：`attribute`/`uniform`/`varying`（WebGL1）对应 `in`/`uniform`/`out`+`in`（WebGL2）；`varying`/`out`-`in` 由光栅化阶段自动插值。
- **两个强制输出**：顶点着色器必写 `gl_Position`；片元着色器必写 `gl_FragColor`（WebGL1）或自定义 `out vec4`（WebGL2）。
- **GLSL 版本规则**：WebGL2 需源码首行 `#version 300 es`，前面不能有任何字符；版本声明与语法必须成对升级。
- **精度规则**：`lowp`/`mediump`/`highp` 三档；顶点着色器默认 `highp`，片元着色器必须显式声明，否则编译报错。
- **编译链接四步 ×2**：`createShader→shaderSource→compileShader→getShaderParameter(COMPILE_STATUS)`；`createProgram→attachShader×2→linkProgram→getProgramParameter(LINK_STATUS)`。
- **Buffer 三步**：`createBuffer→bindBuffer→bufferData`；两目标 `ARRAY_BUFFER`（顶点数据）/ `ELEMENT_ARRAY_BUFFER`（索引）；usage 三档 `STATIC_DRAW`/`DYNAMIC_DRAW`/`STREAM_DRAW`。
- **顶点属性两步**：`vertexAttribPointer` 配置 + `enableVertexAttribArray` 启用，缺一不可，否则该 attribute 静默取默认值。
- **VAO**：把 buffer 绑定 + 属性配置打包；WebGL2 原生 `createVertexArray`，WebGL1 需 `OES_vertex_array_object` 扩展；不记录 buffer 数据本身。
- **绘制三兄弟**：`drawArrays`（无索引）/ `drawElements`（按索引，索引类型 WebGL1 上限 `UNSIGNED_SHORT`）/ `drawArraysInstanced`（WebGL2 原生实例化）。
- **纹理三步**：`createTexture→bindTexture→texImage2D`；采样传的是纹理单元号（`uniform1i`），不是纹理对象；跨域需 `crossOrigin="anonymous"`。
- **非 2 次幂纹理**：WebGL1 禁 `REPEAT`/mipmap，只能 `CLAMP_TO_EDGE`；WebGL2 无此限制。
- **视频纹理坑**：需 `playing` + `timeupdate` 两个事件都触发过才算"有帧可读"，仅监听一个可能黑帧/残影。
- **MVP 顺序**：`projection * view * model * position`，从右向左生效，颠倒即错位或消失；裁剪坐标除以 `w` 得 NDC。
- **深度/剔除/混合**：`DEPTH_TEST`+`depthFunc`（清屏带 `DEPTH_BUFFER_BIT`）；`CULL_FACE`+`cullFace(BACK)`；`BLEND`+`blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)`（透明物体要从远到近画）。
- **WebGL2 新增**：VAO/实例化/MRT/UBO/变换反馈/采样器对象/查询对象原生化，多数由 WebGL1 扩展转正；`canvas.getContext("webgl2")` 获取，向后兼容 WebGL1。
- **FBO 离屏渲染**：`createFramebuffer`+`framebufferTexture2D` 挂纹理当颜色附件，绘制结果写入纹理而非屏幕；用于阴影贴图、后处理、MRT。
- **性能铁律**：减 draw call、减状态切换、片元别算顶点能算的事、别在热路径调用 `getError`/`readPixels`/`finish`、location 要缓存。
- **上下文丢失**：`webglcontextlost` 需 `preventDefault()`，`webglcontextrestored` 里重建全部资源；真实设备并不罕见。
- **调试工具**：`getShaderInfoLog`/`getProgramInfoLog` 看编译链接错误；Spector.js 逐帧抓取调用记录排查"画面不对但代码没错"。
- **WebGL vs WebGPU**：继任关系但当前共存过渡；WebGPU 2025 年内三引擎首发，Baseline 仍 "Newly"（预计 2028 前后 Widely），caniuse 约 82% 可用。
- **资源生命周期**：buffer/texture/program/framebuffer 用完要显式 `delete*()`，WebGL 无自动 GC，长期运行的 SPA 反复创建/销毁会显存泄漏。
- **扩展机制**：`getExtension(name)`（不支持返回 `null`）/ `getSupportedExtensions()`；WebGL1 常用扩展多数在 WebGL2 里转正为核心 API。
- **选型速记**：2D 图形/图表 → Canvas 2D；业务 3D 首选 Three.js 等封装库；脱离场景图的极致定制 → 原生 WebGL；计算密集且能接受兜底 → 关注 WebGPU。

## 一、上下文与生命周期 API

| API | 说明 |
| --- | --- |
| `canvas.getContext("webgl" \| "webgl2")` | 获取上下文；失败返回 `null`；同一 canvas 上下文类型一旦确定即固定 |
| `getContext(type, attrs)` 第二参 | `alpha`/`antialias`/`depth`/`stencil`/`preserveDrawingBuffer`/`premultipliedAlpha`/`failIfMajorPerformanceCaveat`/`powerPreference` |
| `gl.isContextLost()` | 检测当前上下文是否已丢失 |
| `canvas.addEventListener("webglcontextlost", …)` | 需 `event.preventDefault()` 声明"我要处理恢复" |
| `canvas.addEventListener("webglcontextrestored", …)` | 重建全部 GPU 资源后恢复渲染循环 |
| `gl.getExtension(name)` / `gl.getSupportedExtensions()` | 扩展获取（不支持返回 `null`）/ 查询支持列表 |
| `gl.getParameter(pname)` | 查询上下文参数（应缓存，不要放渲染循环） |
| `gl.getError()` | 离线排查用，勿放热路径（CPU-GPU 同步点） |

## 二、Shader / Program API

| API | 说明 |
| --- | --- |
| `gl.createShader(type)` | `type` 为 `gl.VERTEX_SHADER` / `gl.FRAGMENT_SHADER` |
| `gl.shaderSource(shader, source)` → `gl.compileShader(shader)` | 写入源码并编译 |
| `gl.getShaderParameter(shader, gl.COMPILE_STATUS)` | 编译是否成功；失败读 `gl.getShaderInfoLog(shader)` |
| `gl.createProgram()` → `gl.attachShader(program, shader)` ×2 → `gl.linkProgram(program)` | 链接顶点+片元着色器成一个 program |
| `gl.getProgramParameter(program, gl.LINK_STATUS)` | 链接是否成功；失败读 `gl.getProgramInfoLog(program)` |
| `gl.useProgram(program)` | 切换当前使用的 program |
| `gl.getAttribLocation(program, name)` / `gl.getUniformLocation(program, name)` | 取 attribute/uniform 句柄，应初始化阶段缓存 |
| `gl.uniform1f/1i` / `uniform2/3/4fv` / `uniformMatrix4fv(loc, false, mat)` | 按类型选择 uniform 赋值函数；矩阵第二参恒传 `false` |
| `gl.getShaderPrecisionFormat(type, precisionType)` | 检测某精度档位的实际硬件支持情况 |

## 三、Buffer / 顶点属性 / 绘制 API

| API | 说明 |
| --- | --- |
| `gl.createBuffer()` → `gl.bindBuffer(target, buf)` → `gl.bufferData(target, data, usage)` | Buffer 创建三步 |
| Buffer 目标 | `ARRAY_BUFFER`（顶点数据） / `ELEMENT_ARRAY_BUFFER`（索引数据） |
| usage 提示 | `STATIC_DRAW`（不常变） / `DYNAMIC_DRAW`（常变） / `STREAM_DRAW`（用一次） |
| `gl.vertexAttribPointer(location, size, type, normalized, stride, offset)` | 配置 attribute 如何从 buffer 取数据 |
| `gl.enableVertexAttribArray(location)` | 启用该 attribute，缺此步则读不到 buffer 数据 |
| `gl.createVertexArray()` / `gl.bindVertexArray(vao)`（WebGL2） | 把 buffer 绑定 + 属性配置打包成 VAO；WebGL1 需 `OES_vertex_array_object` |
| `gl.drawArrays(mode, first, count)` | 无索引，按顶点顺序绘制 |
| `gl.drawElements(mode, count, type, offset)` | 按索引缓冲绘制，复用顶点 |
| `gl.drawArraysInstanced` / `drawElementsInstanced`（WebGL2） | 配 `vertexAttribDivisor` 一次绘制多个实例；WebGL1 靠 `ANGLE_instanced_arrays` |
| 图元类型 | `POINTS`/`LINES`/`LINE_STRIP`/`LINE_LOOP`/`TRIANGLES`/`TRIANGLE_STRIP`/`TRIANGLE_FAN` |
| 索引类型 | WebGL1 默认 `UNSIGNED_BYTE`/`UNSIGNED_SHORT`（超 65536 需 `OES_element_index_uint`）；WebGL2 原生 `UNSIGNED_INT` |

## 四、纹理 API

| API | 说明 |
| --- | --- |
| `gl.createTexture()` → `gl.bindTexture(gl.TEXTURE_2D, tex)` | 创建 + 绑定 |
| `gl.texImage2D(target, level, internalformat, width, height, border, format, type, data)` | 写入 2D 纹理数据（8 参传占位像素，6 参传 `image`/`video`） |
| `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)` | 翻转纹理 Y 轴（图片默认左上原点 vs WebGL 左下原点） |
| `gl.texParameteri(target, pname, param)` | 设置 `TEXTURE_WRAP_S/T`（`REPEAT`/`CLAMP_TO_EDGE`）、`TEXTURE_MIN/MAG_FILTER`（`LINEAR`/`NEAREST`） |
| `gl.generateMipmap(gl.TEXTURE_2D)` | 生成 mip 链；非 2 次幂纹理（WebGL1）禁用 |
| `gl.activeTexture(gl.TEXTUREn)` → `gl.bindTexture` → `gl.uniform1i(loc, n)` | 激活单元 → 绑定 → 告诉 sampler2D 用第几号单元（传编号非对象） |
| `gl.texImage3D` / `TEXTURE_2D_ARRAY`（WebGL2） | 3D 纹理 / 纹理数组 |
| `gl.texStorage2D` / `texStorage3D`（WebGL2） | 一次性声明全部 mip 级别的不可变存储 |
| `image.crossOrigin = "anonymous"` | 跨域图片纹理必须设置，否则画布被"污染" |

## 五、GLSL 关键字与内置变量对照

| 用途 | WebGL1（GLSL ES 1.00） | WebGL2（GLSL ES 3.00） |
| --- | --- | --- |
| 版本声明 | 无需声明 | 源码**首行** `#version 300 es`（前面不能有任何字符/空行/注释） |
| 顶点着色器输入 | `attribute` | `in` |
| 顶点→片元传值（写出） | `varying` | `out` |
| 顶点→片元传值（读入） | `varying` | `in` |
| 顶点着色器必写输出 | `gl_Position`（两版本一致） | `gl_Position` |
| 片元着色器必写输出 | `gl_FragColor` | 自定义 `out vec4` 变量 |
| 精度限定符 | `lowp`/`mediump`/`highp`（片元必须显式声明，顶点默认 `highp`） | 同左 |
| 内置矩阵函数 | 无（需 uniform 传入） | `inverse()`/`transpose()` |
| 纹理直读/查询 | 无 | `texelFetch()`/`textureSize()` |
| 过时写法 | `#ifdef GL_ES`（WebGL 中恒为 `true`，从桌面 OpenGL 抄来的无意义判断） | 同左 |

## 六、常量速查（按类别）

| 类别 | 常量 |
| --- | --- |
| 清屏位 | `COLOR_BUFFER_BIT` / `DEPTH_BUFFER_BIT` / `STENCIL_BUFFER_BIT`（`clear()` 参数可按位或组合） |
| Shader 类型 | `VERTEX_SHADER` / `FRAGMENT_SHADER` |
| 编译/链接状态 | `COMPILE_STATUS` / `LINK_STATUS` |
| Buffer 目标 | `ARRAY_BUFFER` / `ELEMENT_ARRAY_BUFFER` |
| Buffer usage | `STATIC_DRAW` / `DYNAMIC_DRAW` / `STREAM_DRAW` |
| 绘制模式（图元） | `POINTS` / `LINES` / `LINE_STRIP` / `LINE_LOOP` / `TRIANGLES` / `TRIANGLE_STRIP` / `TRIANGLE_FAN` |
| 数据类型 | `FLOAT` / `UNSIGNED_BYTE` / `UNSIGNED_SHORT` / `UNSIGNED_INT`（WebGL2 原生） |
| 纹理目标 | `TEXTURE_2D` / `TEXTURE_2D_ARRAY`（WebGL2） |
| 纹理参数 | `TEXTURE_WRAP_S` / `TEXTURE_WRAP_T` / `TEXTURE_MIN_FILTER` / `CLAMP_TO_EDGE` / `LINEAR` |
| 纹理单元 | `TEXTURE0`（依次递增 `TEXTURE1`…） |
| 像素存储 | `UNPACK_FLIP_Y_WEBGL` |
| 深度/混合/剔除开关 | `DEPTH_TEST` / `CULL_FACE` / `BLEND` |
| 深度函数 | `LESS`（默认）/ `LEQUAL`（天空盒等边界情形常用） |
| 面剔除方向 | `BACK` / `CCW`（`frontFace` 默认逆时针为正面） |
| 混合因子 | `SRC_ALPHA` / `ONE_MINUS_SRC_ALPHA`（标准 alpha 混合公式） |
| 帧缓冲 | `FRAMEBUFFER` / `COLOR_ATTACHMENT0` |
| 上下文丢失扩展 | `WEBGL_lose_context`（`loseContext()`/`restoreContext()`） |
| WebGL1 常用扩展 | `OES_vertex_array_object`（VAO）/ `ANGLE_instanced_arrays`（实例化）/ `WEBGL_depth_texture`（深度纹理）/ `OES_element_index_uint`（32 位索引）/ `WEBGL_draw_buffers`（MRT） |

## 七、易错点清单

- **着色器精度报错**：片元着色器不显式声明精度直接编译失败；移动端 `highp` 在片元阶段可能不支持或性能极差 → 用 `mediump` 兜底，必要时 `getShaderPrecisionFormat()` 检测。
- **纹理上下颠倒**：图片左上原点 vs WebGL 纹理左下原点 → `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)`。
- **纹理跨域污染**：未设 `crossOrigin` 的跨域图片贴纹理后绘制不报错，但 `readPixels`/`toDataURL` 会抛错或静默失败 → `crossOrigin="anonymous"` + 正确 CORS 响应头。
- **上下文丢失未处理**：`webglcontextlost` 未 `preventDefault()`、未在 `webglcontextrestored` 里重建资源 → 页面永久黑屏且无报错。
- **矩阵乘序颠倒**：`projection`/`view`/`model` 顺序写反 → 物体消失或变换完全错误，且往往无报错信息。
- **忘记 enable attribute**：配置了 `vertexAttribPointer` 却忘 `enableVertexAttribArray` → 图形全黑或所有顶点重合于原点。
- **状态机泄漏**：切换绘制对象前忘记重新绑定正确的 buffer/texture/program → "改了这个物体，另一个物体也跟着变"。
- **深度缓冲区未清除**：`enable(DEPTH_TEST)` 但 `clear()` 忘带 `DEPTH_BUFFER_BIT` → 深度值只增不减，后续物体永远画不出来。
- **非 2 次幂纹理踩坑（WebGL1）**：对非 2 次幂图片 `generateMipmap` 或用 `REPEAT` → 纯黑/纯色而非报错 → `isPowerOf2` 判断后走 `CLAMP_TO_EDGE`，或迁移 WebGL2。
- **GLSL 版本与语法脱节**：加了 `#version 300 es` 却仍留 `attribute`/`gl_FragColor` → 编译失败，版本声明与语法必须成对升级。
- **premultipliedAlpha 与混合公式不匹配**：canvas 默认 `premultipliedAlpha: true`，混合函数仍按非预乘公式 → 半透明边缘发黑镶边。
- **索引越界静默出错**：WebGL1 `UNSIGNED_SHORT` 索引，顶点数超 65536 后静默回绕、画面错乱，不抛异常 → 换 `UNSIGNED_INT` + `OES_element_index_uint`，或原生 WebGL2。
- **每帧同步调用拖垮性能**：`getError()`/`readPixels()`/`finish()` 强制 CPU 等 GPU，渲染循环里高频调用让流水线串行化。
- **location 每帧重新查询**：`getUniformLocation`/`getAttribLocation` 有查表开销，应初始化阶段缓存。
- **GPU 资源不释放**：buffer/texture/program/framebuffer 不再用时不显式 `delete*()` → 显存不会自动回收，长期运行的 SPA 会泄漏直至上下文丢失。
- **视频纹理更新时机过早**：仅监听 `loadeddata` 就 `texImage2D(video)` → 可能黑帧/残影 → 用 `playing` + `timeupdate` 双事件都触发过才算"有帧可读"。
- **误以为 VAO 记录了绑定的 buffer 本身**：VAO 只记录 `vertexAttribPointer` 配置结果，用 `bufferSubData` 更新数据仍需重新 `bindBuffer`。

## 八、选型对比：Canvas 2D / WebGL / Three.js / WebGPU

| 维度 | Canvas 2D | WebGL（原生） | Three.js（封装） | WebGPU |
| --- | --- | --- | --- | --- |
| 定位 | 位图 2D 绘图 API | 底层 3D/2D 光栅化 API | 建在 WebGL（或 WebGPU）之上的场景图引擎 | 下一代底层 GPU API（图形 + 通用计算） |
| 抽象层级 | 高（路径/文本/图像内建） | 极低（状态机 + 着色器） | 高（相机/材质/灯光/场景树内建） | 极低，且引入现代绘制命令模型 |
| 3D 能力 | 无 | 有，但一切靠手写 | 有，开箱即用 | 有，且原生 compute shader |
| GPGPU 通用计算 | 无 | 无（只能费力借渲染管线模拟） | 无（依赖底层 WebGL） | 原生支持 |
| 性能上限 | 数千~数万图元 | 数万~百万级（3D/粒子） | 同 WebGL，多一层调度开销 | 更高，尤其计算密集型任务 |
| 学习曲线 | 低 | 高（需懂图形管线 + 线性代数） | 中（API 友好，仍需理解 3D 概念） | 高于 WebGL（新概念：command encoder/pipeline/bind group） |
| 浏览器基线（2026） | Widely available 多年 | WebGL1 Widely（2015~）/WebGL2 Widely（2021~） | 依赖底层引擎的基线 | 三引擎均已首发（2025 年内），Baseline 刚达成 Newly，尚未 Widely |
| 何时选它 | 2D 图形、图表、图像处理、白板 | 需要脱离场景图框架的极致定制/体积极小的 3D 场景 | 绝大多数业务 3D 需求（建模/游戏/可视化）首选，而非直接手写 WebGL | 计算密集（点云/AI 推理/物理模拟）、追求最新能力且能接受兜底 WebGL 的项目 |

**面试口径**：WebGL vs Canvas 2D 是"3D/GPU 光栅化"与"2D 位图绘制"的定位差异，不是竞争关系（很多页面两者并用，如图表用 Canvas 2D、背景特效用 WebGL）；WebGL vs Three.js 是"底层 API"与"上层框架"的关系，业务项目几乎不会脱离 Three.js/Babylon.js 直接手写 WebGL；WebGL vs WebGPU 是"现状主力"与"未来标准"的过渡关系——WebGPU 三引擎已于 2025 年内首发、原生 compute shader、性能上限更高，但截至 2026 仍处 Baseline "Newly" 阶段，生态（如 Three.js `WebGPURenderer` 自动回退 WebGL2）仍是"渐进增强"姿态，现阶段生产项目通常两者并存而非单选替换。

## 九、权威链接

- [MDN WebGL_API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API) —— 总览 + 教程导航
- [MDN WebGLRenderingContext](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext) / [WebGL2RenderingContext](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext) —— 完整 API 参考
- [MDN WebGL_API/Constants](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API/Constants) —— 全部常量分类参考
- [MDN WebGL best practices](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API/WebGL_best_practices) —— 官方最佳实践
- [MDN WebGL model-view-projection](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API/WebGL_model_view_projection) —— MVP 矩阵专题
- [MDN Using Extensions](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API/Using_Extensions) —— 扩展机制
- [WebGL Fundamentals](https://webglfundamentals.org) —— 光栅化引擎心智模型原文出处
- [WebGL2 Fundamentals：WebGL1→2 迁移](https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html) —— 差异详解
- [WebGL2 Fundamentals：新特性](https://webgl2fundamentals.org/webgl/lessons/webgl2-whats-new.html) —— WebGL2 专题
- [Khronos WebGL](https://www.khronos.org/webgl/) —— 规范维护方官方页
- [MDN WebGPU_API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGPU_API) —— WebGPU 关系交叉参考
- [web.dev：WebGPU 浏览器支持时间线](https://web.dev/blog/webgpu-supported-major-browsers) —— 官方时间线（2025-11-25 发布）
- [caniuse：WebGL2](https://caniuse.com/webgl2) / [WebGPU](https://caniuse.com/webgpu) —— 实时浏览器支持数据
