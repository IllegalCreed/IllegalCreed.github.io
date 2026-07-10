---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线：mitt 3.0.1、qs 6.15.3、JSZip 3.10.1、FileSaver 2.0.5、qrcode 1.5.4、chroma.js 3.2.0、marked 18.0.6。本篇按库讲清各自的**机制与常用用法**。

## 速查

- **mitt**：`on` / `off` / `emit` + `all`；类型 handler 先于 `'*'`，同一 handler 列表在触发前会复制快照，没有内置 `once`。
- **qs**：嵌套与数组是主价值；默认 `depth=5`、`parameterLimit=1000`、`arrayLimit=20`，索引 **20 起**转对象而非稀疏数组。
- **JSZip**：`generateAsync`、`loadAsync`、`ZipObject#async` 都返回 Promise；浏览器常用 `blob`，Node 常用 `nodebuffer`。
- **FileSaver**：只负责 `saveAs`，不生成内容；跨源 URL 依赖 CORS，移动端尤其要从用户手势链路触发。
- **qrcode**：默认纠错级别 `M`；`H` 更抗遮挡但容量更低。浏览器 `toString` 仅输出 SVG，Node 还支持 utf8 / terminal。
- **chroma.js**：`scale` 默认在 `rgb` 插值，`mix` / `average` 默认 `lrgb`；数据分位数断点用 `chroma.limits(data, 'q', n)`。
- **marked**：18.x 默认同步、GFM 开启，但**从不净化 HTML**；不可信输入必须在输出阶段交给 DOMPurify 等净化器。
- **职责组合**：JSZip 产 ZIP + FileSaver 下载；marked 产 HTML + DOMPurify 建安全边界；不要把组合方能力误算给单库。

## 一、mitt：极简的代价与收益

mitt 返回的 `Emitter` 只有 `on` / `off` / `emit` 三个方法和一个 `all` 属性。它的设计哲学是「能砍就砍」：

- **`all` 是 `Map`**：键为事件名（或 `'*'`），值为 handler 数组。它对外暴露，可直接操作，例如 `bus.all.clear()` 一次性清空所有监听。
- **方法不依赖 `this`**：可以安全解构使用，`const { on, emit } = mitt()` 后单独调用也没问题。
- **通配 `'*'`**：`on('*', (type, payload) => ...)` 监听所有事件，回调首参是被触发的事件名。
- **触发顺序**：同一次 `emit`，**先调用该事件名的类型化 handler，再调用 `'*'` 通配 handler**。
- **列表快照**：每一组 handler 在执行前用 `slice()` 复制；同类型 handler 在本轮里增删监听，不会改写这一组已经取得的执行名单。

```ts
const bus = mitt();
bus.on("foo", () => console.log("typed"));
bus.on("*", (t) => console.log("wild:", t));
bus.emit("foo", 1); // 依次输出 "typed" 与 "wild: foo"
```

::: warning mitt 没有 once
要实现一次性监听，得在 handler 内部解绑自己：

```ts
function onceHandler(payload: unknown) {
  // ...处理逻辑
  bus.off("ready", onceHandler); // 用完即解绑
}
bus.on("ready", onceHandler);
```

:::

## 二、qs：嵌套、数组与安全限制

### 嵌套与数组

qs 用方括号路径表达层级：`a[b][c]=d` ↔ `{ a: { b: { c: 'd' } } }`。数组解析支持 `a[]=x`（隐式）与 `a[0]=x`（显式下标）。

### 序列化的数组格式（arrayFormat）

| 取值 | 输出（`{ a: ['b','c'] }`，`encode:false`） |
|---|---|
| `indices`（**默认**） | `a[0]=b&a[1]=c` |
| `brackets` | `a[]=b&a[]=c` |
| `repeat` | `a=b&a=c` |
| `comma` | `a=b,c` |

### 默认的安全限制（防 DoS）

qs 的几个默认值都是为**防止恶意构造的超大/超深查询拖垮服务**：

| 选项 | 默认 | 含义 |
|---|---|---|
| `depth` | `5` | 最大嵌套深度，超出部分并入键名 |
| `parameterLimit` | `1000` | 最大参数（键值对）数，超出默认忽略 |
| `arrayLimit` | `20` | 数组下标达到 `20` 起就**转成对象**（避免稀疏大数组） |

```ts
qs.parse("a[20]=x"); // { a: { '20': 'x' } }（下标达到阈值，转对象）
```

> 这正是 qs 优于原生 `URLSearchParams` 的地方：后者只能处理扁平键值对，且无这些保护。

## 三、JSZip：异步 I/O 与类型选择

JSZip 的核心 I/O 都是**异步、返回 Promise**：

- `zip.generateAsync({ type })` —— 生成压缩包；
- `JSZip.loadAsync(data)` —— 读取已有 zip；
- `zipObject.async(type)` —— 读出单个文件内容。

`type` 取值要按环境选：

| type | 适用 |
|---|---|
| `blob` | 浏览器下载 / 预览 |
| `nodebuffer` | Node 写文件（`fs.writeFile`） |
| `base64` | 嵌入 Data URL / 传输 |
| `uint8array` / `arraybuffer` | 二进制处理 |

```ts
// 浏览器：生成并下载
const blob = await zip.generateAsync({ type: "blob" });
saveAs(blob, "out.zip"); // 配合 FileSaver

// Node：写盘
const buf = await zip.generateAsync({ type: "nodebuffer" });
fs.writeFileSync("out.zip", buf);
```

> 遍历条目用 `zip.forEach((path, entry) => ...)` 或直接读 `zip.files`（路径 → ZipObject 的对象）。

## 四、FileSaver.js：它只做「保存」这一步

`saveAs(blob, filename, options?)` 的底层套路：用 `URL.createObjectURL(blob)` 造临时 URL，创建带 `download` 属性的隐藏 `<a>` 并程序化点击，再释放 URL，并对各浏览器/iOS 做兼容回退。

- **首参可以是 Blob / File / URL 字符串**：URL 同源走 `<a download>`，跨源需服务端 CORS 支持。
- **`autoBom`**：当 blob 的 `type` 含 `charset=utf-8` 时，加 UTF-8 BOM，帮助 Excel 等正确识别编码、避免中文乱码（导出 CSV 常用）。
- **它不产生内容**：内容由 `new Blob([...])`、`canvas.toBlob`、JSZip 等准备。

```ts
canvas.toBlob((blob) => saveAs(blob!, "shot.png")); // canvas → 图片下载
```

## 五、qrcode：四种输出 + 纠错级别

qrcode 按「输出目标」提供四组方法：

| 方法 | 输出 | 环境 |
|---|---|---|
| `create` | QR 数据对象（同步，不渲染） | 通用 |
| `toCanvas` | 画到传入的 canvas | 浏览器 / 兼容 Canvas 实现 |
| `toDataURL` | base64 Data URL（可赋 `img.src`） | 浏览器 / Node |
| `toString` | 浏览器仅 `svg`；Node 为 `svg` / `utf8` / `terminal` | 浏览器 / Node |
| `toFile` | 写文件（`png` / `svg` / `utf8`） | **仅 Node** |

**纠错级别 errorCorrectionLevel**（默认 `M`）：

| 级别 | 可恢复污损 | 特点 |
|---|---|---|
| `L` | ~7% | 数据密度最高、最脆弱 |
| `M` | ~15% | 默认，均衡 |
| `Q` | ~25% | 较抗损 |
| `H` | ~30% | 最抗损（可遮挡更多，常用于带 logo 的码） |

> `create()` 是同步 API。`toCanvas` / `toDataURL` / `toString` / `toFile` 支持回调或 Promise；流式写入 API 另有自己的调用约定。

## 六、chroma.js：构造、转换与色阶

### 构造与转换

`chroma(input)` 接受 hex、CSS 名、`chroma.rgb(...)`、`chroma.hsl(...)` 等多种输入；再链式取目标表示：`.rgb()` / `.hsl()` / `.lab()` / `.lch()` / `.hex()` / `.css()`。调整类方法 `.darken()` / `.brighten()` / `.saturate()` / `.alpha()` 都返回**新的 chroma 对象**，可继续链式。

### 色阶 scale

`chroma.scale([colors])` 返回一个**色阶函数**，传 `0~1` 取插值色：

```ts
const s = chroma.scale(["white", "red"]);
s(0.5).hex(); // 中间色
s.colors(5); // 取 5 个等距颜色
s.mode("lab"); // 改插值色彩空间（默认 'rgb'）
```

> 注意默认插值 mode 的差异：`chroma.scale` 默认 `rgb`，而 `chroma.mix` / `chroma.average` 默认 `lrgb`（线性 RGB）。

## 七、marked：转换与安全模型

`marked.parse(md)`（或 `marked(md)`）把 Markdown 编译成 HTML，**默认同步返回字符串**。常用选项：

| 选项 | 默认 | 含义 |
|---|---|---|
| `gfm` | `true` | GitHub Flavored Markdown（表格、删除线、任务列表等） |
| `breaks` | `false` | 把单个换行渲染为 `<br>` |
| `pedantic` | `false` | 严格遵循原始 markdown.pl |
| `async` | `false` | 开启后 `parse` 返回 `Promise<string>` |

::: danger marked 默认不净化 HTML
marked 会**原样输出**内嵌的 HTML。旧的 `sanitize` / `sanitizer` 选项已被**移除**。渲染不可信内容时，必须自行用 [DOMPurify](../../dompurify/) 净化输出：

```ts
const html = DOMPurify.sanitize(marked.parse(userInput) as string);
element.innerHTML = html; // 净化必须在写入 DOM 之前
```

:::

---

进入 [指南 · 进阶](./advanced)：mitt 类型化与解绑模式、qs 高级选项、JSZip 流式与压缩级别、chroma 色阶分级、marked 自定义渲染。
