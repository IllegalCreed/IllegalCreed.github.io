---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **three r184**。把「能跑第一个场景」用到「会搭场景」：场景图与变换、两种相机、几何体、材质体系、纹理与色彩管理。

## 一、场景图与变换

Three.js 用**场景图（scene graph）**组织三维世界：`Object3D` 是所有可放入场景的对象（Mesh、Light、Camera、Group）的基类，承载局部变换与父子层级。

```js
const group = new THREE.Group(); // 不可见容器
scene.add(group);

const wheel = new THREE.Mesh(geo, mat);
wheel.position.set(2, 0, 0); // 相对父节点 group 的局部坐标
group.add(wheel);

group.rotation.y = Math.PI / 4; // group 转，子节点 wheel 随之联动
```

**世界变换 = 父链局部变换逐级相乘**。所以用嵌套的空 `Object3D`/`Group` 当「枢轴/轨道节点」，就能不算坐标地表达轨道、关节、车轮等结构（经典的太阳系 sun→earth→moon 即此原理）。

变换的三个属性：

- `position`：`Vector3`，位置。
- `scale`：`Vector3`，缩放（注意子节点会继承父缩放）。
- `rotation`：`Euler`（欧拉角，弧度 + 旋转顺序），内部与 `quaternion`（四元数）**自动同步**。

::: tip 朝向某点用 lookAt
`object.lookAt(x, y, z)` 让对象 -Z 轴指向目标点，相机/灯光/模型通用。它基于当前世界矩阵计算；若父级变换刚改过，必要时先 `object.updateMatrixWorld()`。
:::

## 二、两种相机

```js
// 透视：模拟人眼，近大远小
const persp = new THREE.PerspectiveCamera(fov, aspect, near, far);
// fov 是垂直视野角度（度）；aspect 是宽高比

// 正交：无透视收缩，远近同样大小（2D / 等距 / 工程图）
const ortho = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
```

| 维度 | PerspectiveCamera | OrthographicCamera |
|---|---|---|
| 投影 | 近大远小，有透视收缩 | 远近同尺寸，无透视 |
| 参数 | `fov, aspect, near, far` | `left, right, top, bottom, near, far` |
| 场景 | 3D 游戏/写实 | 2D、等距、CAD、小地图 |

⚠️ 改了任何相机参数后，**必须 `camera.updateProjectionMatrix()`**——投影矩阵是缓存值，不会自动重算。

## 三、几何体：BufferGeometry

现代 Three.js 所有几何体都继承 `BufferGeometry`，用紧凑的 typed array（`BufferAttribute`）存顶点属性，直连 GPU。内置 primitives 覆盖大多数需求：

```js
new THREE.BoxGeometry(w, h, d);                     // 盒
new THREE.SphereGeometry(radius, wSeg, hSeg);       // 球（分段控平滑度）
new THREE.PlaneGeometry(w, h);                       // 平面
new THREE.CylinderGeometry(rTop, rBottom, h, seg);  // 圆柱/圆锥
new THREE.TorusGeometry(r, tube, radSeg, tubSeg);   // 圆环
```

::: warning 分段数（segments）的取舍
分段越多，顶点/三角形成倍增加、开销上升。**平面盒子无需分段**；球/圆柱靠分段控制平滑度；只有需要顶点级形变（顶点着色器位移）时才给平面加分段。
:::

手写几何体（见[进阶篇](./advanced)）用 `setAttribute('position', new THREE.BufferAttribute(float32, 3))` 设顶点，`setIndex([...])` 复用顶点。

## 四、材质体系

材质决定表面外观，按「是否受光、真实感、性能」分层：

```js
new THREE.MeshBasicMaterial({ color: 0xff0000 });   // 不受光，直接显色
new THREE.MeshStandardMaterial({                     // PBR 主力，受光
  color: 0x44aa88,
  roughness: 0.5,  // 粗糙度 0~1：高=哑光，低=光滑
  metalness: 0.0,  // 金属度 0~1：1=金属
});
```

- **不受光**：`MeshBasicMaterial`（无光显色，UI/线框/调试）、`MeshNormalMaterial`（法线调试）。
- **受光（经验模型）**：`MeshLambertMaterial`（逐顶点，廉价）、`MeshPhongMaterial`（逐像素 + `shininess` 高光）。
- **受光（PBR）**：`MeshStandardMaterial`（`roughness`+`metalness`，配 `envMap` 更真实）、`MeshPhysicalMaterial`（再加 `clearcoat`/`transmission`，最真实最慢）。

通用属性：

```js
mat.side = THREE.DoubleSide;   // 双面渲染（平面、敞口模型必备）
mat.transparent = true;        // 开启透明混合
mat.opacity = 0.5;
mat.flatShading = true;        // 平直（低面感）着色
```

## 五、纹理与色彩管理

```js
const loader = new THREE.TextureLoader();
const map = loader.load("/brick.jpg");
map.colorSpace = THREE.SRGBColorSpace;  // 颜色贴图必设！
const mat = new THREE.MeshStandardMaterial({ map });
```

::: warning 颜色贴图 vs 数据贴图
自 r152 默认开启色彩管理（内部线性、输出 sRGB）。**颜色类贴图**（`map`/`emissiveMap`）是 sRGB 编码图片，必须设 `colorSpace = SRGBColorSpace`，否则偏暗发灰；**数据类贴图**（`normalMap`/`roughnessMap`/`aoMap`）存的是非颜色数据，**保持默认 `NoColorSpace`**，绝不能设 sRGB。
:::

平铺与过滤：

```js
map.wrapS = map.wrapT = THREE.RepeatWrapping; // 先允许重复
map.repeat.set(4, 2);                          // 再设次数
map.anisotropy = renderer.capabilities.getMaxAnisotropy(); // 掠射角防糊
```

## 六、光照与阴影

```js
scene.add(new THREE.AmbientLight(0xffffff, 0.4)); // 均匀补暗部
const sun = new THREE.DirectionalLight(0xffffff, 3); // 太阳（平行光）
sun.position.set(5, 10, 7);
scene.add(sun);
```

开启阴影需四步：

```js
renderer.shadowMap.enabled = true; // ① 渲染器启用
sun.castShadow = true;             // ② 光源投影
mesh.castShadow = true;            // ③ 物体投影
floor.receiveShadow = true;        // ④ 地面接收
```

> 受光材质（Standard/Phong/Lambert）才参与光照；`MeshBasicMaterial` 不受光也不接收阴影。

---

进入 [指南 · 进阶](./advanced)：加载器与压缩、动画系统、Raycaster 交互、响应式与按需渲染、自定义 BufferGeometry。
