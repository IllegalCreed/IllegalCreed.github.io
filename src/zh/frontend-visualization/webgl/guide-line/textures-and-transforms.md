---
layout: doc
outline: [2, 3]
---

# 纹理与变换：贴图、MVP 矩阵与深度混合

> 基于 WebGL 1.0 / 2.0（2026 浏览器基线）· 核于 2026-07

## 速查

- **纹理创建四步**：
  1. `createTexture()` 申请纹理对象
  2. `bindTexture(TEXTURE_2D, tex)` 设为当前绑定
  3. 占位：先填 1×1 纯色像素，防止图片加载完成前黑屏/报错
  4. 图片 `onload` 后用真实像素 `texImage2D` 覆盖占位数据
- **纹理坐标系**：WebGL 纹理坐标原点在左下，图片默认原点在左上，需 `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)` 翻转，否则贴图上下颠倒。
- **跨域纹理**：`image.crossOrigin = "anonymous"` 必须设置，否则纹理被标记"污染"，后续 `readPixels`/`toDataURL` 等读取操作会抛错或静默失败。
- **非 2 次幂纹理（WebGL1）**：禁止 `REPEAT` 环绕和 `generateMipmap`，只能 `CLAMP_TO_EDGE` + 非 mip 过滤（`LINEAR`/`NEAREST`）；WebGL2 完全不受此限制。
- **纹理单元**：`activeTexture(TEXTURE0)` 选定单元 → `bindTexture` 绑定纹理到该单元 → `uniform1i(loc, 0)`——sampler2D uniform 传的是**纹理单元编号**（整数），不是纹理对象本身。
- **纹理单元编号递增**：`TEXTURE0`/`TEXTURE1`/`TEXTURE2`……依次递增，一次绘制可同时绑定多个纹理单元供着色器采样（如同时采样漫反射贴图 + 法线贴图）。
- **isPowerOf2 判断**：宽高都是 2 的幂才算"2 次幂纹理"；WebGL1 下非 2 次幂纹理限制较多，判断后走兼容分支，或直接换 WebGL2（不受限）。
- **WebGL2 纹理新增**：`texImage3D`（3D 纹理/纹理数组）、`texStorage2D`/`texStorage3D`（一次性分配全部 mip 级别的不可变存储，比分级调用 `texImage2D` 有更好的驱动优化空间，且能提前捕获格式错误）。
- **视频纹理**：`texImage2D` 可直接传入 `<video>` 元素实现动画纹理；需同时等到 `playing` + `timeupdate` 两个事件都触发过，才能确认视频有可读帧——仅监听一个事件可能贴出黑帧或残影。
- **MVP 三级变换**：
  - 模型矩阵：模型空间 → 世界空间（缩放/旋转/平移）
  - 视图矩阵：世界空间 → 视图空间（相机变换的逆矩阵）
  - 投影矩阵：视图空间 → 裁剪空间（透视或正交）
- **齐次坐标 w**：普通点 `w=1`（参与平移），方向向量 `w=0`（不参与平移）；裁剪空间坐标除以 `w` 得到 NDC（归一化设备坐标），是"近大远小"透视效果的数学根源。
- **矩阵乘法顺序（必考）**：`gl_Position = projection * view * model * position`，矩阵乘法不满足交换律，变换从右向左依次生效；顺序颠倒会导致画面错位甚至消失，且往往没有任何报错信息。
- **正交 vs 透视**：正交投影平行线保持平行、无近大远小，常用于 2D/CAD；透视投影按 fov/宽高比/近远裁剪面构造，远处物体在 NDC 中收缩。
- **WebGL 不内置矩阵运算**：教程与生产代码都依赖 gl-matrix 一类的库（`mat4.create()`/`perspective()`/`translate()`/`rotate()`）。
- **法线矩阵（Normal Matrix）**：= 模型视图矩阵的逆矩阵的转置，用于正确变换法向量——非等比缩放下法向量不能直接套用模型矩阵，否则不再垂直于表面。
- **深度测试**：`enable(DEPTH_TEST)` + `depthFunc`（默认 `LESS`，`LEQUAL` 常用于天空盒等边界情形）；每帧 `clear()` 必须同时带上 `DEPTH_BUFFER_BIT`，否则深度值只增不减，后续帧被挡住。
- **面剔除**：`enable(CULL_FACE)` + `cullFace(BACK)` 剔除背面、减少片元着色器执行次数；`frontFace` 默认 `CCW`（逆时针为正面）。
- **混合**：`enable(BLEND)` + `blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)` 是标准 alpha 混合公式；透明物体渲染要先画不透明物体，再按距离从远到近画透明物体（顺序错了会穿帮）。
- **premultipliedAlpha 与混合公式要匹配**：canvas 默认 `premultipliedAlpha: true`，若混合函数仍按"非预乘"公式书写，半透明边缘会出现颜色发黑的镶边。
- **模板测试简介**：`stencilFunc`/`stencilOp` 常用于镜面反射、描边、遮罩等"只在特定区域画"的效果，机制与深度测试类似（先测试、再决定是否写入）。
- **进阶顺序**：本页 → [WebGL2 与进阶](./webgl2-and-advanced) → [参考](../reference)。

## 一、纹理创建与加载

纹理加载天然是异步的（图片要下载），标准做法是先塞一个占位像素防止黑屏，图片加载完成后再替换：

```javascript
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
// 占位：图片异步加载完成前，先填 1x1 纯色像素防止黑屏/报错
gl.texImage2D(
  gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
  new Uint8Array([0, 0, 255, 255]),
);

const image = new Image();
image.crossOrigin = "anonymous"; // 跨域图片必须设置，否则纹理被标记"污染"
image.onload = () => {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // WebGL 纹理坐标原点在左下，图片默认左上，常需翻转
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // 非 2 次幂纹理(WebGL1)：禁止 REPEAT 环绕和 mipmap，只能 CLAMP_TO_EDGE + 非 mip 过滤
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
};
image.src = url;
```

几个必须记住的事实：

- **跨域污染**：未设 `crossOrigin` 的跨域图片贴上纹理后，绘制本身不报错，但后续 `readPixels`/`toDataURL` 等读取操作会因"画布被污染"而抛错或静默失败——解法是 `image.crossOrigin = "anonymous"` 配服务器正确的 CORS 响应头。
- **上下颠倒**：图片默认左上角为原点，WebGL 纹理坐标默认左下角为原点，不处理会导致贴图上下翻转，用 `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)` 修正。
- **非 2 次幂纹理限制（WebGL1）**：对非 2 次幂图片调用 `generateMipmap` 或用 `REPEAT` 环绕，画面会显示纯黑或纯色而非报错，原因隐蔽；用 `isPowerOf2` 判断后走 `CLAMP_TO_EDGE` + 非 mip 路径，或者直接迁移到 WebGL2（完全不受此限制）。

## 二、纹理单元与采样器

绘制时需要三步把纹理"接"到着色器的 `sampler2D` uniform：

```javascript
gl.activeTexture(gl.TEXTURE0); // 激活 0 号纹理单元
gl.bindTexture(gl.TEXTURE_2D, texture); // 把纹理绑定到当前激活的单元
gl.uniform1i(samplerUniformLocation, 0); // sampler2D uniform 传纹理单元号，不是纹理对象本身
```

**容易搞反的一点**：`uniform1i` 传给 `sampler2D` uniform 的是**纹理单元编号**（一个整数，如 `0` 对应 `TEXTURE0`），而不是纹理对象本身——纹理对象是通过 `activeTexture` + `bindTexture` 这一对组合绑定到某个单元上的。

WebGL2 在纹理能力上有两处重要新增：

- **`texImage3D`**：支持 3D 纹理与纹理数组（`TEXTURE_2D_ARRAY`），WebGL1 不支持。
- **`texStorage2D`/`texStorage3D`**：一次性分配全部 mip 级别的**不可变存储**，相比逐级调用 `texImage2D` 有更好的驱动优化空间，且能提前捕获格式错误。

**视频作为纹理源**：`texImage2D` 可以直接传入一个 `<video>` 元素，每帧调用一次就能实现动画纹理。需要注意的是，仅监听 `loadeddata` 事件就调用 `texImage2D(video)` 可能贴出黑帧或残留上一帧——官方教程的做法是同时等到 `playing` + `timeupdate` 两个事件都触发过，才能确认"视频有可读帧"。

## 三、MVP 矩阵变换

WebGL **不内置任何矩阵运算**，教程与生产代码都依赖 gl-matrix 一类的库：

```javascript
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, aspect, 0.1, 100.0); // fov, 宽高比, 近裁剪, 远裁剪
const modelViewMatrix = mat4.create();
mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -6]);
mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, 1, 0]);
```

MVP 是三级变换的组合：

- **模型矩阵**：模型空间 → 世界空间（缩放/旋转/平移）。
- **视图矩阵**：世界空间 → 视图空间（相机变换的逆矩阵——"移动相机"数学上等价于"反向移动整个场景"）。
- **投影矩阵**：视图空间 → 裁剪空间（透视或正交）；裁剪空间坐标是齐次坐标 `(x, y, z, w)`，除以 `w` 得到 **NDC**（归一化设备坐标，`-1~1` 立方体）。

两个必考细节：

- **齐次坐标 `w`**：普通点 `w=1`（参与平移），方向向量 `w=0`（不参与平移）；裁剪空间坐标除以 `w` 的"透视除法"是"近大远小"效果的数学根源。
- **正交 vs 透视**：正交投影平行线保持平行、没有近大远小，常用于 2D/CAD 场景；透视投影按 fov/宽高比/近远裁剪面构造，远处物体在 NDC 中收缩。

**乘法顺序**：`gl_Position = projection * view * model * position`——矩阵乘法不满足交换律，变换从右向左依次生效（先 model，再 view，最后 projection），顺序颠倒会导致画面错位甚至消失，而且往往没有任何报错信息，是最难排查的坑之一。

## 四、深度测试、面剔除与混合

```javascript
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL); // 默认 LESS，LEQUAL 常用于天空盒等边界情形
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // 每帧必须同时清深度，否则后续帧被挡

gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK); // 剔除背面，减少片元着色器执行次数
gl.frontFace(gl.CCW); // 默认逆时针为正面

gl.enable(gl.BLEND); // 透明混合
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // 标准 alpha 混合公式
```

- **深度测试**：决定"离相机更近的片元"能不能挡住"更远的片元"。`enable(DEPTH_TEST)` 只是开关，还要在**每帧** `clear()` 时带上 `DEPTH_BUFFER_BIT`，否则深度缓冲区的值只增不减，后续帧会被挡住画不出来。
- **面剔除**：三角形有正反面之分（由顶点环绕方向决定，默认逆时针 `CCW` 为正面），`cullFace(BACK)` 剔除背对相机的面，能显著减少片元着色器的执行次数。
- **混合**：`blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)` 是标准的 alpha-over 合成公式。混合结果依赖绘制顺序——透明物体渲染的要点是**先画不透明物体、再按距离从远到近画透明物体**，顺序错了会出现"穿帮"（该被挡住的透明物体反而盖住了前面的东西）。
- 模板测试（`stencilFunc`/`stencilOp`）没有在这里展开代码，但它常用于镜面反射、描边、遮罩等"只在特定区域画"的效果，机制与深度测试类似（先测试、再决定是否写入）。

---

材质、变换、混合都齐了之后，下一页[WebGL2 与进阶](./webgl2-and-advanced)进入 WebGL2 独有的新能力、离屏渲染、性能优化，以及 WebGL 与 WebGPU 的关系。
