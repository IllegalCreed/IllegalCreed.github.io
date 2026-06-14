---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇给 7 个小库各一段**最小可用示例**，照着即可跑通。每库版本基线：mitt 3.x、qs 6.x、JSZip 3.10.x、FileSaver 2.0.x、qrcode 1.5.x、chroma.js 3.x、marked 18.x。深入用法见[基础](./guide-line/base)/[进阶](./guide-line/advanced)/[专家](./guide-line/expert)。

## 速查

- **事件总线**：`const bus = mitt(); bus.on('e', fn); bus.emit('e', data)`
- **查询串**：`qs.parse('a[b]=c')` → `{a:{b:'c'}}`；`qs.stringify({a:{b:'c'}})`
- **打包**：`const zip = new JSZip(); zip.file('a.txt','hi'); await zip.generateAsync({type:'blob'})`
- **下载**：`import { saveAs } from 'file-saver'; saveAs(blob, 'a.txt')`
- **二维码**：`await QRCode.toDataURL('https://...')`
- **颜色**：`chroma('#f00').hsl()`；`chroma.scale(['white','red'])(0.5).hex()`
- **Markdown**：`marked.parse('# Hi')` → `<h1>Hi</h1>`（⚠️ 用户输入要配 DOMPurify）

## 一、mitt：事件总线

```bash
npm i mitt
```

```ts
import mitt from "mitt";

// 可选：用 TS 泛型声明事件与负载类型
type Events = { login: { id: number }; logout: void };
const bus = mitt<Events>();

// 订阅
bus.on("login", (user) => console.log("登录", user.id));
// 通配：监听所有事件，首参是事件名
bus.on("*", (type, payload) => console.log("事件", type, payload));

// 触发
bus.emit("login", { id: 1 }); // 输出「登录 1」与「事件 login {...}」

// 取消订阅
const onLogout = () => console.log("登出");
bus.on("logout", onLogout);
bus.off("logout", onLogout); // 移除指定 handler
bus.off("login"); // 省略 handler：移除该事件全部监听
```

> mitt 没有 `once`，一次性监听需在回调里 `bus.off(type, self)` 解绑自己。`bus.all` 是个 `Map`，`bus.all.clear()` 可一键清空全部监听。

## 二、qs：查询字符串

```bash
npm i qs
```

```ts
import qs from "qs";

// 解析：天然支持嵌套对象与数组
qs.parse("user[name]=jo&user[age]=3"); // { user: { name: 'jo', age: '3' } }
qs.parse("tags[]=a&tags[]=b"); // { tags: ['a', 'b'] }

// 序列化：默认会 URI 编码（[ ] → %5B %5D）
qs.stringify({ user: { name: "jo" } }); // 'user%5Bname%5D=jo'
qs.stringify({ user: { name: "jo" } }, { encode: false }); // 'user[name]=jo'

// 数组格式
qs.stringify({ a: ["x", "y"] }, { encode: false }); // 'a[0]=x&a[1]=y'（默认 indices）
qs.stringify({ a: ["x", "y"] }, { encode: false, arrayFormat: "repeat" }); // 'a=x&a=y'
```

> 这是相对原生 `URLSearchParams` 的核心增量：嵌套对象/数组 + 多种数组格式。

## 三、JSZip：打包 ZIP

```bash
npm i jszip
```

```ts
import JSZip from "jszip";

const zip = new JSZip();
zip.file("hello.txt", "Hello, World!"); // 加文件
zip.folder("images")?.file("a.png", pngBlob); // 建目录并放文件

// 生成（浏览器用 blob，Node 用 nodebuffer）—— 异步
const blob = await zip.generateAsync({ type: "blob" });

// 读取一个已有 zip（如上传的 ArrayBuffer）
const loaded = await JSZip.loadAsync(arrayBuffer);
const text = await loaded.file("hello.txt")?.async("string");
```

## 四、FileSaver.js：触发下载

```bash
npm i file-saver
```

```ts
import { saveAs } from "file-saver";

// 保存文本
const blob = new Blob(["你好"], { type: "text/plain;charset=utf-8" });
saveAs(blob, "hello.txt", { autoBom: true }); // autoBom 防中文乱码

// 配合 JSZip：JSZip 产内容，FileSaver 负责下载
const zipBlob = await zip.generateAsync({ type: "blob" });
saveAs(zipBlob, "archive.zip");
```

> FileSaver 只负责「把 Blob 存成文件」，内容由你准备。

## 五、qrcode：生成二维码

```bash
npm i qrcode
```

```ts
import QRCode from "qrcode";

// 浏览器：画到 canvas
await QRCode.toCanvas(document.getElementById("c"), "https://example.com");

// 得到可赋给 <img src> 的 Data URL
const url = await QRCode.toDataURL("https://example.com", {
  errorCorrectionLevel: "H", // 纠错级别 L/M/Q/H
  width: 240,
});

// 不依赖 DOM：直接产 SVG 字符串
const svg = await QRCode.toString("https://example.com", { type: "svg" });

// Node：写文件
await QRCode.toFile("qr.png", "https://example.com");
```

## 六、chroma.js：颜色处理

```bash
npm i chroma-js
```

```ts
import chroma from "chroma-js";

chroma("#ff0000").hsl(); // [0, 1, 0.5]
chroma("tomato").darken().hex(); // 调暗
chroma("red").alpha(0.5).css(); // 'rgba(255,0,0,0.5)'

// 两色混合（取中点）
chroma.mix("red", "blue", 0.5).hex();

// 色阶（数据可视化配色）
const scale = chroma.scale(["white", "red"]);
scale(0.5).hex(); // 中间色
scale.colors(5); // 取 5 个等距颜色

// WCAG 对比度（1~21）
chroma.contrast("#fff", "#777"); // 判断文字可读性
```

## 七、marked：Markdown → HTML

```bash
npm i marked dompurify
```

```ts
import { marked } from "marked";
import DOMPurify from "dompurify";

// 基本转换（默认同步返回字符串）
const html = marked.parse("# 标题\n\n- 列表项"); // <h1>标题</h1>...

// 选项
marked.parse("第一行\n第二行", { breaks: true }); // 单换行 → <br>

// ⚠️ 渲染用户提交内容：先转、再净化、最后写入 DOM
const dirty = marked.parse(userInput) as string;
const safe = DOMPurify.sanitize(dirty);
element.innerHTML = safe;
```

> **marked 默认不净化 HTML**，旧的 `sanitize` 选项已被移除。渲染不可信内容必须配合 [DOMPurify](../dompurify/)，否则有 XSS 风险。

---

会用之后，进入 [指南 · 基础](./guide-line/base) 理解每库的机制与常用配置。
