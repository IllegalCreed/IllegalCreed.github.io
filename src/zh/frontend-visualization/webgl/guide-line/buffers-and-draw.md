---
layout: doc
outline: [2, 3]
---

# 缓冲区与绘制：顶点属性与图元

> 基于 WebGL 1.0 / 2.0（2026 浏览器基线）· 核于 2026-07

## 速查

- **Buffer 三步**：`createBuffer` → `bindBuffer(ARRAY_BUFFER, buf)` → `bufferData(ARRAY_BUFFER, new Float32Array(...), usage)`。
- **两种 Buffer 目标**：`ARRAY_BUFFER`（通用顶点数据：位置/颜色/法线/纹理坐标等）/ `ELEMENT_ARRAY_BUFFER`（索引缓冲区，配合 `drawElements` 复用顶点、减少数据量）。
- **WebGL 是状态机**：`bindBuffer` 只是把某个 buffer 设为"当前绑定"，后续的 `bufferData`/`vertexAttribPointer` 等调用都作用于这个当前绑定对象，而非传参指定的对象。
- **usage 提示三档**：`STATIC_DRAW`（数据不常变）/ `DYNAMIC_DRAW`（常变）/ `STREAM_DRAW`（只用一次）——只是性能提示，不影响功能正确性。
- **Buffer 是纯数据，不带类型信息**：GPU 不知道 buffer 里的数字该怎么切分，全靠 `vertexAttribPointer` 的 `size`/`type`/`stride`/`offset` 参数告知。
- **顶点属性配置**：`vertexAttribPointer(location, size, type, normalized, stride, offset)`——告诉 GPU 如何从当前绑定的 buffer 里取数据喂给某个 attribute。
  - `size`：每个顶点取几个分量，`vec2` 传 2、`vec4` 传 4
  - `type`：数据类型，常见 `gl.FLOAT`
  - `stride`/`offset`：字节步长与起始偏移，`0`/`0` 表示紧密排列、从头读取
- **必须显式启用**：`vertexAttribPointer` 配置完之后必须调用 `enableVertexAttribArray(location)`，否则该 attribute 读不到 buffer 数据、恒为默认值（不会抛错，只会静默出错）。
- **location 获取与缓存**：`getAttribLocation(program, name)` / `getUniformLocation(program, name)` 有查表开销，应在初始化阶段查一次并缓存，渲染循环里只用缓存值。
- **attribute location 0 特例**：部分桌面 OpenGL 实现（如 macOS）里禁用顶点属性 0 会触发驱动的软件模拟兜底、性能骤降；最佳实践是始终显式 `bindAttribLocation` 让某个属性占用 location 0 并保持 enable。
- **索引缓冲的绑定目标**：`ELEMENT_ARRAY_BUFFER`，而非 `ARRAY_BUFFER`——绑定目标搞错，索引数据不会生效。
- **VAO 是什么**：把"哪个 buffer 绑定到哪个 attribute、格式如何"整套状态打包成一个对象；初始化阶段配置一次，渲染循环里只需 `bindVertexArray`，避免每帧重复多条状态设置调用。
- **VAO 获取方式**：WebGL2 原生 `createVertexArray`/`bindVertexArray`；WebGL1 需 `OES_vertex_array_object` 扩展。
- **VAO 不等于记录了 buffer 数据本身**：它只记录每个 attribute 的 `vertexAttribPointer` 配置结果；若要用 `bufferSubData` 更新数据，仍需重新 `bindBuffer(ARRAY_BUFFER, …)`——`bindVertexArray` 不能替代这一步。
- **多 Buffer 组合常态**：位置、颜色、法线、纹理坐标等常分开存成多个 `ARRAY_BUFFER`，各自绑定到不同的 attribute location，绘制前依次配置或统一收进一个 VAO。
- **绘制两大基本方式**：`drawArrays(mode, first, count)` 无索引、直接按顶点顺序绘制；`drawElements(mode, count, type, offset)` 按索引缓冲绘制，能复用顶点省内存。
- **实例化绘制**：`drawArraysInstanced`/`drawElementsInstanced`（WebGL2 原生，WebGL1 靠 `ANGLE_instanced_arrays` 扩展）配合 `vertexAttribDivisor` 让某个 attribute 按实例而非按顶点前进，一次 draw call 画上千个变体几何体。
- **图元类型七种**：`POINTS`/`LINES`/`LINE_STRIP`/`LINE_LOOP`/`TRIANGLES`/`TRIANGLE_STRIP`/`TRIANGLE_FAN`；`TRIANGLE_STRIP` 用相邻三顶点组三角形，顶点数量比 `TRIANGLES` 少，适合连续条带状几何体。
- **顶点属性默认值**：未 `enableVertexAttribArray` 的 attribute 会退回恒定默认值而不是抛错，是"配置了却忘记 enable"这类 bug 难排查的根本原因。
- **一个 canvas 多个几何体**：不同几何体常各自维护一套 buffer（或 VAO），draw call 之间只切换 buffer/VAO 绑定，不需要重新创建 buffer 对象。
- **索引类型上限**：
  - WebGL1 默认仅 `UNSIGNED_BYTE`/`UNSIGNED_SHORT`，顶点数超 65536 需 `OES_element_index_uint` 扩展，否则索引静默回绕、画面错乱
  - WebGL2 原生支持 `UNSIGNED_INT`，没有这层顾虑
- **退化三角形**：用重复顶点构造面积为零的"退化三角形"，可以把多段不相连的 `TRIANGLE_STRIP` 拼接进一次 `drawArrays` 调用，是减少 draw call 的技巧之一。
- **多对象绘制**：一个 canvas 画多个对象，通常靠多次 `drawArrays`/`drawElements` 调用，每次调用前切换所需的 buffer/uniform；用 VAO 时切换绘制对象只需 `bindVertexArray(otherVao)`。
- **进阶顺序**：本页 → [纹理与变换](./textures-and-transforms) → [WebGL2 与进阶](./webgl2-and-advanced) → [参考](../reference)。

## 一、Buffer 的创建与写入

```javascript
// 创建 + 绑定 + 写入数据
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
```

三步走：`createBuffer` 申请一个空 buffer 对象 → `bindBuffer` 把它设为"当前绑定"（WebGL 是状态机，后续操作都作用于当前绑定的对象）→ `bufferData` 把 CPU 端的类型化数组写进 GPU 显存。

`bufferData` 第三参 `usage` 是给驱动的性能提示，不影响功能正确性：

| usage | 含义 | 典型场景 |
| --- | --- | --- |
| `STATIC_DRAW` | 数据写入后不常变 | 静态几何体的顶点位置 |
| `DYNAMIC_DRAW` | 数据会被频繁更新 | 每帧变化的粒子位置 |
| `STREAM_DRAW` | 数据只使用一次 | 一次性生成的过程几何体 |

两种 Buffer 目标语义不同：`ARRAY_BUFFER` 装通用顶点数据（位置、颜色、法线、纹理坐标……），`ELEMENT_ARRAY_BUFFER` 装索引数据，用于下文的 `drawElements`。

## 二、顶点属性：vertexAttribPointer 与 enableVertexAttribArray

Buffer 里只是一串数字，GPU 需要知道"怎么切"这串数字喂给某个 attribute：

```javascript
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(
  location, // attribute 位置(getAttribLocation 返回)
  2, // 每个顶点取几个分量(如 vec2 = 2)
  gl.FLOAT, // 数据类型
  false, // 是否归一化
  0, // stride，0 = 紧密排列
  0, // offset
);
gl.enableVertexAttribArray(location); // 必须显式开启，否则 attribute 恒为默认值
```

六个参数的含义：

| 参数 | 说明 |
| --- | --- |
| `location` | attribute 的位置句柄，`getAttribLocation(program, name)` 返回 |
| `size` | 每个顶点取几个分量，如 `vec2` 传 2、`vec4` 传 4 |
| `type` | 数据类型，常见 `gl.FLOAT` |
| `normalized` | 整数类型是否归一化到 `0~1` 或 `-1~1` |
| `stride` | 每个顶点之间的字节步长，`0` 表示数据紧密排列 |
| `offset` | 从 buffer 的第几个字节开始读 |

**最容易踩的坑**：配置了 `vertexAttribPointer` 却忘记调用 `enableVertexAttribArray`，该属性会静默取默认值——典型症状是图形全黑，或者所有顶点重合于原点，且没有任何报错信息。

## 三、索引缓冲与 VAO

**索引缓冲**用 `ELEMENT_ARRAY_BUFFER` 目标，让多个三角形复用同一批顶点：

```javascript
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
```

**VAO（顶点数组对象）**把"哪个 buffer 绑定到哪个 attribute、格式如何"整套状态打包成一个对象：

```javascript
// WebGL2：原生支持
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
// ……配置若干次 bindBuffer + vertexAttribPointer + enableVertexAttribArray……

// 渲染循环里，切换绘制对象只需要一行
gl.bindVertexArray(vao);
gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
```

WebGL1 没有原生 VAO，需要 `OES_vertex_array_object` 扩展提供等价的 `createVertexArrayOES`/`bindVertexArrayOES`。最佳实践是**初始化阶段配置一次 VAO，渲染循环里只调用 `bindVertexArray`**，避免每帧重复执行多条 `bindBuffer`/`vertexAttribPointer`/`enableVertexAttribArray` 调用。

**一个容易误解的细节**：VAO 只记录每个 attribute 的 `vertexAttribPointer` 配置结果，**不记录 buffer 里的数据本身**。如果要用 `bufferSubData` 更新某个 buffer 的数据，仍然需要重新 `bindBuffer(ARRAY_BUFFER, …)`——切换到某个 VAO 不能替代这一步。

## 四、绘制调用与图元类型

```javascript
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // 无索引，直接按顶点顺序绘制
gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); // 按索引缓冲绘制
gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 100); // WebGL2：一次绘制 100 个实例
```

- **`drawArrays(mode, first, count)`**：不经过索引缓冲，直接按顶点顺序从 `first` 开始取 `count` 个顶点绘制。
- **`drawElements(mode, count, type, offset)`**：按 `ELEMENT_ARRAY_BUFFER` 里的索引取顶点绘制，能让多个三角形复用同一批顶点、节省显存。
- **`drawArraysInstanced`/`drawElementsInstanced`**（WebGL2 原生，WebGL1 靠 `ANGLE_instanced_arrays` 扩展）：配合 `vertexAttribDivisor` 让某个 attribute 按"每个实例前进一次"而非"每个顶点前进一次"，一次 draw call 就能画出成百上千个变体几何体（比如森林里的每一棵树），是减少 draw call 的核心手段。

图元类型（绘制模式）一共七种：`POINTS` / `LINES` / `LINE_STRIP` / `LINE_LOOP` / `TRIANGLES` / `TRIANGLE_STRIP` / `TRIANGLE_FAN`。其中 `TRIANGLE_STRIP` 用相邻的三个顶点组成一个三角形，顶点数量比逐个独立声明的 `TRIANGLES` 少，适合连续的条带状几何体。

索引类型的上限也要注意：WebGL1 默认只支持 `UNSIGNED_BYTE`/`UNSIGNED_SHORT` 作为索引类型，顶点数一旦超过 65536，索引会静默回绕导致画面错乱（不会抛异常），需要 `OES_element_index_uint` 扩展才能用 `UNSIGNED_INT`；WebGL2 原生支持 `UNSIGNED_INT`，没有这个顾虑。

一个 canvas 上画多个对象，通常就是靠多次 `drawArrays`/`drawElements` 调用实现——每次绘制前切换到对应的 buffer/纹理/uniform（或者切换 VAO），这也是下一页要处理纹理时会延续的模式。

---

搞定了顶点数据怎么进 GPU、怎么画出来，下一页[纹理与变换](./textures-and-transforms)进入"贴图"与"让三角形动起来"：纹理加载、MVP 矩阵、深度与混合。
