---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线：mitt 3.0.1、qs 6.15.3、JSZip 3.10.1、FileSaver 2.0.5、qrcode 1.5.4、chroma.js 3.2.0、marked 18.0.6。本篇给出类型化、自定义、组合与常见坑。

## 速查

- **mitt 生命周期**：`off` 精确解绑必须复用同一函数引用；`off(type)` 清空单事件，`all.clear()` 清空全部。
- **qs 编解码**：`encodeValuesOnly` 保留键结构但编码值；`strictNullHandling` 区分 null 与空串；重复键可用 `duplicates` 决定 combine / first / last。
- **qs 限制**：不可信输入建议启用 `strictDepth` / `throwOnLimitExceeded`，同时在 HTTP 层限制原始查询串或 body 大小。
- **JSZip 压缩**：`STORE` 不压缩，`DEFLATE` 的 level 1–9 权衡 CPU / 体积；`generateAsync` 的进度回调不等于真正流式落盘。
- **打包下载**：JSZip 负责生成 Blob，FileSaver 负责保存；长时间 `await` 后再 `saveAs` 可能丢失 iOS 用户激活。
- **qrcode 渲染**：`width` 优先于 `scale`，`margin` 是静默区；高纠错不能替代真机扫码验证。
- **chroma 分级**：`domain` 定连续输入域，`classes` 定离散断点；对比度筛选要比较黑、白两者，而不是只测试白色。
- **marked 18**：renderer 接收 token 对象；扩展用 `marked.use`，多配置场景用独立 `Marked` 实例，输出后仍须净化。

## 一、mitt：类型化事件与解绑模式

### 强类型事件映射

```ts
type Events = {
  "user:login": { id: number; name: string };
  "user:logout": void; // 无负载事件，emit 时可不传第二参
  "cart:update": number;
};
const bus = mitt<Events>();

bus.on("user:login", (u) => u.name.toUpperCase()); // u 被推断为 { id, name }
bus.emit("cart:update", 3); // ✅ 类型校验
// bus.emit('cart:update', 'x') // ❌ 类型报错
```

### 在组件里成对订阅/解绑（防内存泄漏）

事件总线最常见的坑是**只订阅不解绑**导致内存泄漏。务必在组件卸载时清理：

```ts
// Vue 3
import { onMounted, onUnmounted } from "vue";
const handler = (p: SomeType) => {
  /* ... */
};
onMounted(() => bus.on("user:login", handler));
onUnmounted(() => bus.off("user:login", handler)); // 解绑同一个引用
```

> 关键：`off` 必须传**与 `on` 相同的函数引用**才能精确移除；匿名箭头函数无法被解绑。需要清空某事件全部监听时，用 `bus.off('event')`（省略 handler）。

## 二、qs：编码控制与高级选项

### 只编码值、不编码键

默认 `encode: true` 会把键里的 `[ ]` 编码成 `%5B %5D`，可读性差。若希望保留可读的方括号但仍编码值，用 `encodeValuesOnly`：

```ts
qs.stringify({ filter: { name: "jo & co" } }, { encodeValuesOnly: true });
// 'filter[name]=jo%20%26%20co'（键不编码，值编码）
```

### 点号风格与前缀

```ts
qs.stringify({ a: { b: "c" } }, { allowDots: true }); // 'a.b=c'
qs.parse("a.b=c", { allowDots: true }); // { a: { b: 'c' } }
qs.stringify({ a: "b" }, { addQueryPrefix: true }); // '?a=b'
qs.parse("?a=b", { ignoreQueryPrefix: true }); // { a: 'b' }
```

### 空格编码：RFC3986 vs RFC1738

```ts
qs.stringify({ a: "b c" }); // 'a=b%20c'（默认 RFC3986）
qs.stringify({ a: "b c" }, { format: "RFC1738" }); // 'a=b+c'
```

### null 处理

```ts
qs.stringify({ a: null, b: "" }); // 'a=&b='（默认）
qs.stringify({ a: null }, { strictNullHandling: true }); // 'a'（区分 null 与空串）
qs.stringify({ a: null, b: "x" }, { skipNulls: true }); // 'b=x'（跳过 null）
```

### 重复键与超限策略

```ts
qs.parse("a=1&a=2"); // { a: ['1', '2'] }，默认 combine
qs.parse("a=1&a=2", { duplicates: "first" }); // { a: '1' }
qs.parse("a=1&a=2", { duplicates: "last" }); // { a: '2' }

qs.parse(input, {
  depth: 5,
  strictDepth: true,
  parameterLimit: 200,
  throwOnLimitExceeded: true,
});
```

> `parameterLimit` 只限制按分隔符拆出的参数数，不限制原始字节数；`comma: true` 还可能让一个参数展开为多个值。服务端仍要设置 URL / body 大小上限。

## 三、JSZip：压缩级别、流式与目录

### 控制压缩

`file()` / `generateAsync()` 都可指定压缩方式：

```ts
const blob = await zip.generateAsync({
  type: "blob",
  compression: "DEFLATE", // 默认 STORE（不压缩）
  compressionOptions: { level: 6 }, // 1(快)~9(小)
});
```

> 已经是压缩格式的内容（图片、视频）再 DEFLATE 收益很小，可对它们用 `STORE` 省 CPU。

### 进度回调与遍历

```ts
await zip.generateAsync({ type: "blob" }, (meta) => {
  console.log(meta.percent.toFixed(0) + "%"); // 大包生成进度
});

zip.forEach((relativePath, entry) => {
  if (entry.dir) return; // 跳过目录
  console.log(relativePath, entry.date);
});
```

### 读取上传的 zip 并提取

```ts
const zip = await JSZip.loadAsync(file); // file: File / ArrayBuffer / Blob
const names = Object.keys(zip.files);
const csv = await zip.file("data.csv")?.async("string");
```

## 四、FileSaver + JSZip：典型「打包下载」管线

最常见的组合是「在前端把多个文件打成 zip 并下载」：

```ts
import JSZip from "jszip";
import { saveAs } from "file-saver";

async function downloadAll(files: { name: string; content: Blob | string }[]) {
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.content));
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "bundle.zip"); // JSZip 产内容，FileSaver 触发下载
}
```

> 分工记牢：**JSZip 负责「生成内容」，FileSaver 负责「保存下载」**。FileSaver 自身不会读取或生成任何文件内容。

::: warning iOS 的用户手势窗口
FileSaver 官方要求 `saveAs` 在用户交互事件中触发；长时间等待 `generateAsync()` 后，iOS 可能已经丢失用户激活。面向 iOS 时应在目标设备实测，必要时改成服务端预生成下载或选择支持流式 / 原生文件选择器的方案。
:::

## 五、qrcode：尺寸、留白与颜色定制

```ts
await QRCode.toCanvas(canvas, text, {
  errorCorrectionLevel: "H", // 带 logo 时用 H，给遮挡留冗余
  width: 320, // 直接定总宽（覆盖 scale）
  margin: 2, // 四周静默区（默认 4），太小会影响识别
  color: {
    dark: "#1a1a1a", // 码点颜色
    light: "#ffffff", // 背景（设透明用 '#0000'）
  },
});
```

要点：

- **`width` 覆盖 `scale`**：`scale` 是「每个模块的像素数」，`width` 是「总宽」，同时给以 `width` 为准。
- **`margin` 别设太小**：静默区是扫码识别的一部分，过小会降低成功率。
- **带 logo 的码**：把 logo 叠在 canvas 中心，并用 `H` 级纠错，遮挡中心仍可扫出。

## 六、chroma.js：分级配色与 brewer

### 连续映射 vs 离散分级

```ts
// domain：把数据值域映射到色阶（连续渐变）
const heat = chroma.scale(["lightyellow", "navy"]).domain([0, 100]);
heat(42).hex(); // 输入 42（在 0~100 间）取对应色

// classes：把色阶切成 n 个离散分级色（阶梯，分档地图常用）
const stepped = chroma.scale("OrRd").classes(5);
stepped(0.3).hex(); // 落在第 2 档的固定色
```

> `domain` 管「输入范围 / 连续渐变」，`classes` 管「离散分桶 / 阶梯」，两者职责不同，可叠加使用。

### 用 ColorBrewer 调色板

```ts
chroma.brewer.Spectral; // 一组预定义颜色
const scale = chroma.scale("RdYlBu").domain([0, 1]); // 直接按名用作色阶
```

### WCAG 对比度筛选可读前景色

```ts
function pickText(bg: string) {
  // 在黑/白里选与背景对比度更高的作前景
  return chroma.contrast(bg, "white") >= 4.5 ? "white" : "black";
}
```

## 七、marked：自定义渲染与扩展

### 用 marked.use 覆盖渲染器

在本篇基线 marked 18 中，renderer 方法接收一个 **token 对象**：

```ts
import { marked } from "marked";

marked.use({
  renderer: {
    link({ href, title, text }) {
      // 给外链统一加 target/rel
      const t = title ? ` title="${title}"` : "";
      return `<a href="${href}"${t} target="_blank" rel="noopener">${text}</a>`;
    },
  },
});
```

### 注册自定义扩展

```ts
marked.use({
  extensions: [
    {
      name: "mention",
      level: "inline",
      start(src) {
        return src.indexOf("@");
      },
      tokenizer(src) {
        const m = /^@(\w+)/.exec(src);
        if (m) return { type: "mention", raw: m[0], user: m[1] };
      },
      renderer(token) {
        return `<a href="/u/${token.user}">@${token.user}</a>`;
      },
    },
  ],
});
```

### 与 DOMPurify 的标准管线

```ts
import DOMPurify from "dompurify";
const render = (md: string) =>
  DOMPurify.sanitize(marked.parse(md) as string); // 先转、再净化
```

---

进入 [指南 · 专家](./expert)：边缘陷阱、性能与安全的深水区。
