---
layout: doc
outline: [2, 3]
---

# 渲染管线与 WGSL 着色器

> 基于 WebGPU（2026 浏览器现状）· 核于 2026-07

## 速查

- **WGSL**：WebGPU 专属着色语言，静态类型、命令式语法，同时覆盖顶点/片元/计算三类着色器（GLSL 时代 compute 支持薄弱）。
- **标量类型**：`bool` `i32` `u32` `f32`，以及需要显式开启扩展的 `f16`。
- **向量/矩阵简写**：`vec2f` ≡ `vec2<f32>`，`vec3i` ≡ `vec3<i32>`，`vec4u` ≡ `vec4<u32>`，`mat4x4f` ≡ `mat4x4<f32>`；矩阵命名规则是"列数 x 行数"。
- **入口点属性三选一**：`@vertex`/`@fragment`/`@compute`，决定着色器阶段，一个 `GPUShaderModule` 里可以同时装多个入口点。
- **`@location(n)`**：标注顶点↔片元之间传递的跨阶段变量位置，也用于顶点输入槽位。
- **`@builtin(name)`**：内置值，如 `position`（裁剪空间坐标）、`vertex_index`、`global_invocation_id`。
- **`@group(n) @binding(m)`**：资源绑定坐标，必须与 JS 侧 `GPUBindGroupLayout`/`GPUBindGroup` 的 `binding` 编号一一对应，细节见[绑定模型与资源](./binding-and-resources)。
- **`@workgroup_size(x, y, z)`**：仅用于 `@compute`，定义一个 workgroup 内并行调用的线程网格大小，细节见[命令编码与计算](./commands-and-compute)。
- **WGSL vs GLSL**：静态类型 + 更严格的编译期校验，官方定位是给出"比 GLSL 更清晰一致的编译错误信息"；语法上更接近 Rust（`let`/`var`、`fn`、`struct`）。
- **`GPURenderPipeline`**：由 `device.createRenderPipeline(descriptor)` / `createRenderPipelineAsync(descriptor)` 创建，descriptor 含 `vertex`/`primitive`/`depthStencil`/`multisample`/`fragment` 五大块。
- **`vertex.buffers`**：`arrayStride`（每顶点字节跨度）/`stepMode`（`"vertex"` 或 `"instance"`）/`attributes`（`shaderLocation`+`offset`+`format`）。
- **`primitive.topology`**：`point-list`/`line-list`/`line-strip`/`triangle-list`/`triangle-strip`。
- **`layout: "auto"`**：让 WebGPU 按着色器代码自动推导绑定布局，写起来快但不能跨管线复用，权衡见[绑定模型与资源](./binding-and-resources)。
- **本质区别（高频对比题）**：WebGL 是全局可变状态机、运行时逐次校验；WebGPU 管线创建后不可变、编译期校验，切换靠 `setPipeline()` 而非改状态。
- **`*Async` 优先**：`createRenderPipelineAsync`/`createComputePipelineAsync` 不阻塞主线程等待着色器编译，生产代码应优先使用。
- **进阶顺序**：本页 → [绑定模型与资源](./binding-and-resources) → [命令编码与计算](./commands-and-compute) → [性能与 WebGL 选型](./performance-and-webgl)。

## 一、WGSL 基础：标量、向量矩阵与入口点

WGSL（WebGPU Shading Language）静态类型、命令式，覆盖顶点/片元/计算三类着色器。标量类型只有 `bool`/`i32`/`u32`/`f32`，以及需要显式开启扩展的 `f16`。

向量/矩阵可以写完整泛型形式，也可以写简写，日常代码几乎总用简写：

| 完整形式 | 简写 |
| --- | --- |
| `vec2<f32>` | `vec2f` |
| `vec3<i32>` | `vec3i` |
| `vec4<u32>` | `vec4u` |
| `mat4x4<f32>` | `mat4x4f` |

矩阵命名规则是"列数 x 行数"，如 `mat3x4f` 是 3 列 4 行——从线性代数直接推的规则容易反过来记错，写之前对照一下。

**入口点属性**（三选一，决定着色器阶段）：

```wgsl
@vertex
fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
  let pos = array(vec2f(0.0, 0.5), vec2f(-0.5, -0.5), vec2f(0.5, -0.5));
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment
fn fs() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0); // 红色
}

@compute @workgroup_size(64)
fn cs(@builtin(global_invocation_id) id: vec3u) {
  // 计算逻辑见「命令编码与计算」
}
```

关键属性含义：

- **`@location(n)`**：标注 vertex→fragment 之间传递的"跨阶段变量"（inter-stage variable）位置，也用于顶点输入槽位。
- **`@builtin(name)`**：内置值，如 `position`（裁剪空间坐标）、`vertex_index`、`global_invocation_id`。
- **`@group(n) @binding(m)`**：资源绑定坐标，必须与 JS 侧 `GPUBindGroupLayout`/`GPUBindGroup` 的 `binding` 编号一一对应。
- **`@workgroup_size(x, y, z)`**：仅用于 `@compute`，定义一个 workgroup 内并行调用的线程网格大小。

WGSL 与 GLSL 的本质差异：**静态类型 + 更严格的编译期校验**，官方定位是给出"比 GLSL 更清晰一致的编译错误信息"；语法上更接近 Rust（`let`/`var`、`fn`、`struct`）。`shaderModule.getCompilationInfo()` 返回 `Promise<GPUCompilationInfo>`，包含编译期的 warning/error 消息列表，可用于自建 shader 调试面板。

## 二、GPURenderPipeline：完整描述符结构

`device.createRenderPipeline(descriptor)` / `createRenderPipelineAsync(descriptor)`，完整描述符结构：

```javascript
const pipeline = await device.createRenderPipelineAsync({
  label: "my pipeline",
  layout: "auto", // 或显式 device.createPipelineLayout({ bindGroupLayouts: [...] })

  vertex: {
    module: shaderModule,
    entryPoint: "vertex_main",
    buffers: [
      {
        arrayStride: 32, // 每个顶点的字节跨度
        stepMode: "vertex", // "vertex" | "instance"
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x4" }, // 对应 WGSL @location(0)
          { shaderLocation: 1, offset: 16, format: "float32x4" },
        ],
      },
    ],
  },

  primitive: {
    topology: "triangle-list", // point-list | line-list | line-strip | triangle-list | triangle-strip
    cullMode: "back", // none | front | back
    frontFace: "ccw",
  },

  depthStencil: {
    // 可选
    format: "depth24plus",
    depthWriteEnabled: true,
    depthCompare: "less",
  },

  multisample: {
    // 可选，MSAA
    count: 4,
  },

  fragment: {
    module: shaderModule,
    entryPoint: "fragment_main",
    targets: [
      {
        format: navigator.gpu.getPreferredCanvasFormat(),
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "zero", operation: "add" },
        },
      },
    ],
  },
});

const bindGroupLayout0 = pipeline.getBindGroupLayout(0); // layout: "auto" 时反查自动生成的布局
```

五大块的分工：`vertex` 描述顶点输入布局与顶点着色器入口，`primitive` 定光栅化规则（拓扑/剔除/环绕方向），`depthStencil`/`multisample` 是可选的深度模板与抗锯齿配置，`fragment` 定片元着色器入口与颜色目标（含混合）。**`layout: "auto"` 时可以用 `pipeline.getBindGroupLayout(n)` 反查自动生成的绑定布局**，供后续创建匹配的 `GPUBindGroup`。

## 三、与 WebGL 状态机的本质区别（高频对比题）

| | WebGL | WebGPU |
| --- | --- | --- |
| 状态管理 | 全局可变状态机（`gl.useProgram`/`gl.enable`/`gl.blendFunc` 分散调用，运行时生效） | 管线对象**创建后不可变**，一次性打包顶点布局/光栅化/深度模板/混合/着色器 |
| 校验时机 | 运行时逐次校验，出错易被忽略 | 创建管线时编译期校验，错误更早暴露 |
| 复用方式 | 手动保存/恢复状态 | 创建多个 pipeline 对象直接切换 `setPipeline()` |
| GPU 侧优化空间 | 受限（驱动难以预判后续状态） | 更大（驱动可在管线创建时提前编译优化） |

这张表是 WebGPU 面试/笔试的高频对比题：WebGL 的"运行时可变状态机"换来了灵活但脆弱（漏设一个状态、忘记还原上一次的 `gl.enable`，都会在运行时才暴露），WebGPU 的"创建后不可变管线"用更多前期样板代码换来了编译期校验与更大的驱动优化空间。实践中同一个场景常常需要多个 `GPURenderPipeline`（例如不同材质、不同混合模式各建一个），靠 `setPipeline()` 切换，而不是像 WebGL 那样反复调用一堆状态设置函数。

**创建管线优先用 `*Async` 版本**：`createRenderPipeline`/`createComputePipeline` 的同步版本会阻塞主线程直到着色器编译完成；`createRenderPipelineAsync`/`createComputePipelineAsync` 不阻塞，MDN 与官方样例均推荐生产代码使用异步版本。

---

理解了 WGSL 类型系统与渲染管线的完整结构，下一步是 [绑定模型与资源](./binding-and-resources)：`GPUDevice` 如何创建 Buffer/Texture/Sampler，以及 `BindGroupLayout`/`BindGroup`/`PipelineLayout` 三者如何配合把资源送进着色器。
