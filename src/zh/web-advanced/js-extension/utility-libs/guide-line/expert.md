---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线：mitt 3.0.1、qs 6.15.3、JSZip 3.10.1、FileSaver 2.0.5、qrcode 1.5.4、chroma.js 3.2.0、marked 18.0.6。本篇汇总 7 个库的边缘陷阱、性能与安全边界。

## 速查

- **mitt 快照**：同一事件列表在调用前 `slice()`；本轮删除仍会执行已入快照的 handler，本轮新增要到下次 emit。通配列表在类型列表之后单独读取。
- **qs comma**：单元素数组默认会退化成字符串，用 `commaRoundTrip: true` 保留 `[]`；默认编码会保护值内逗号，裸逗号查询仍有歧义。
- **qs 防护**：不要为省事开启 `allowPrototypes`；不可信输入同时限制原始字节数、参数数、深度与数组下标。
- **JSZip 内存**：`generateAsync` / `ZipObject#async` 会持有完整结果；`streamFiles` 不是浏览器大文件落盘方案，超大归档优先服务端或真正流式工具。
- **JSZip 安全**：3.8+ 会清理文件名中的 `..` 防 zip slip，但不提供完整 zip-bomb 配额；上传归档仍需隔离、限额与超时。
- **FileSaver**：Blob 上限和下载行为随浏览器 / 设备变化；iOS 需用户手势，大文件评估 StreamSaver、File System Access API 或服务端下载。
- **qrcode**：容量由版本、纠错级别和编码模式共同决定；提高到 H 不能保证任意 logo 遮挡可扫，必须用真实设备矩阵验证。
- **chroma / marked**：分位数先 `chroma.limits(data, 'q', n)` 再交给 `classes`；marked 输出先净化、再写 DOM，并隔离全局扩展状态。

## 一、mitt：触发期间修改监听 & 解构陷阱

### emit 期间增删监听

mitt 3.0.1 会在调用某一组 handler 前执行 `.slice()`。因此同类型事件的本轮名单已经固定：handler A 在执行时移除 handler B，B 本轮仍会执行；A 新增 handler C，C 从下一次 `emit` 才开始执行。这不是“不确定的实现差异”，而是当前源码的快照语义。

通配 `'*'` 列表是在类型 handler 全部结束后再读取并复制，所以类型 handler 对**通配列表**的修改可能赶上同一次 emit 的通配阶段。不要在回调里依赖这种时序技巧；若业务需要稳定事务边界，把订阅变化放到 emit 之外。

### 解构是特性而非 bug

mitt 方法不依赖 `this`，所以 `const { emit } = bus` 后单独调用完全正常——这与很多 OO 风格的 emitter 不同。**触发顺序确定**：类型化 handler 先于 `'*'` 通配 handler（已实测 `typed -> wild`）。手动 `emit('*')` 来触发通配是不支持的。

### 没有 `removeAllListeners`，但有 `all`

mitt 不提供 `removeAllListeners()`，但 `all` 是个 `Map`，`bus.all.clear()` 即可清空全部；针对单事件用 `bus.off('e')`。

## 二、qs：comma 往返陷阱与原型污染防护

### comma 格式不保证无损往返

`arrayFormat: 'comma'` 把数组拼成 `a=b,c`，但反向解析有歧义：

- **单元素数组退化**：`['b']` → `a=b`，再 `parse` 通常得到字符串 `'b'` 而非 `['b']`；
- **单元素可显式保形**：stringify 时加 `commaRoundTrip: true` 会输出 `a[]=b`，再用 `{ comma: true }` 解析可保留数组。
- **值内逗号取决于编码**：默认 stringify 会输出 `a=a%2Cb`，不会按分隔逗号拆开；只有 `encode:false` 或手写的 `a=a,b` 才会产生歧义。

需要稳定往返时，优先 `brackets` / `indices`；确需 comma 时同时固定 stringify 与 parse 选项，并覆盖单元素、空数组、值内逗号测试。

### 原型污染防护

qs 默认会过滤 `__proto__` 等危险键，避免**原型污染**（`?__proto__[polluted]=1` 这类攻击）。仍应：

- 不放宽 `depth`/`parameterLimit`/`arrayLimit` 到危险量级；
- 对解析结果做白名单取值，而非整体并入业务对象。

```ts
// 必要时让超限直接抛错，而不是静默截断
qs.parse(input, { parameterLimit: 50, throwOnLimitExceeded: true });
qs.parse(input, { depth: 3, strictDepth: true });
```

## 三、JSZip：内存峰值与流式取舍

### 大文件的内存峰值

JSZip 在浏览器里**把内容放在内存**处理。打包很大的文件集时，`generateAsync({type:'blob'})` 会形成明显内存峰值，移动端可能崩溃。缓解：

- 对已压缩资源用 `compression: 'STORE'` 省 CPU；
- 超大归档考虑服务端打包，或用支持流式的方案（如 `client-zip` / `fflate`）替代。

### date 与跨平台一致性

ZIP 条目带修改时间，跨时区/平台可能导致**哈希不一致**（影响构建缓存复现）。需要可复现产物时，显式给 `file(name, data, { date: fixedDate })` 固定时间。

### 读取不受信 zip 的「zip 炸弹」风险

解析用户上传的 zip 时，警惕**解压炸弹**（极小压缩包解出超大内容）。JSZip 3.8+ 会清理文件名里的 `..` 防止 zip slip，并在 `unsafeOriginalName` 保留原名，但这不等于提供解压配额。

可以在 `loadAsync` 后限制条目数，并在传入前限制压缩包字节数；但 JSZip 没有稳定的公开 API 让你在解压前可靠汇总所有条目的最终展开体积。真正不可信或高价值场景应在隔离的服务端 / worker 中处理，设置 CPU、内存、时间与输出总量上限，不能只看文件数。

## 四、FileSaver：体积上限、iOS 与用户手势

- **单 Blob 体积上限**随浏览器版本、设备内存和平台而异，不能把旧兼容表里的数字当稳定配额；大文件别一次性 `saveAs`，应在目标设备压测。
- **iOS Safari** 对下载支持弱，常是「在新窗口打开」而非保存，且需**用户手势**触发；自动/延迟很久后调用 `saveAs` 多会被拦。
- **跨源 URL**：`saveAs(url)` 跨域是否能按数据下载取决于服务端 CORS，否则退化为普通跳转（可能直接在浏览器打开而非下载）。
- **现代替代**：对「保存到用户指定位置 + 大文件流式写」，可评估 File System Access API（`showSaveFilePicker`），但兼容性不如 FileSaver 广。

## 五、qrcode：容量、纠错与中心遮挡的权衡

### 容量取决于「版本 × 纠错级别 × 数据模式」

- **版本**（1~40）决定矩阵尺寸，越大容量越高；不指定则按内容自动选最小可容纳版本。
- **纠错级别越高（H），可用数据容量越低**——同样数据，`H` 可能需要更大的版本/尺寸。
- 数字/字母/字节/Kanji 模式容量不同，纯数字最省。

### 带 logo 的码为什么要用 H

中心叠 logo 会遮挡部分模块。`H` 级提供更高纠错能力，但官方并没有给出「logo 可遮挡固定百分比」的安全承诺；定位图、静默区、内容长度、尺寸与打印质量都会影响识别。生成后应覆盖不同扫码器、屏幕 / 打印介质、距离与光照做真机测试。

### 服务端渲染选 toString('svg')

无 DOM 的服务端场景，`toString(text, { type: 'svg' })` 直出矢量、可内联进 HTML/邮件，比 canvas 路径更省依赖（canvas 在 Node 需 node-canvas）。

## 六、chroma.js：感知均匀性与插值色彩空间

### 为什么默认 RGB 插值有时「发灰/发暗」

在 sRGB 直接线性插值（`scale` 默认 `rgb`）穿过中间色时，亮度/饱和度可能塌陷出现「脏中点」。改用感知更均匀的空间能缓解：

```ts
chroma.scale(["red", "green"]).mode("lab"); // 或 'lch'，过渡更自然
```

而 `chroma.mix` / `chroma.average` 默认用 `lrgb`（线性 RGB），正是为了避免简单 sRGB 平均产生的暗带。**记住这个默认差异**：`scale` 默认 `rgb`、`mix`/`average` 默认 `lrgb`。

### contrast 是 WCAG 2.x 比值，不是唯一真理

`chroma.contrast` 给出 WCAG 2.x 的相对亮度对比（1~21，正文建议 ≥ 4.5、大字 ≥ 3）。它对某些色相（如亮黄 vs 白）的判断与人眼主观不完全吻合——WCAG 3 的 APCA 正是为改进这点。做可访问性时以 4.5 为底线，但别迷信单一数值。

### 分级数与数据分布

`classes(n)` 等距分桶，若数据高度偏斜，等距分级会让多数值挤在一两档。分位数断点应先用 `chroma.limits(values, 'q', n)` 计算，再交给 `classes`：

```ts
const breaks = chroma.limits(values, 'q', 5);
const quantileScale = chroma.scale('OrRd').classes(breaks);
```

`scale.domain(values, n, 'quantiles')` 不是 chroma.js 3.2.0 的 API；多余参数会被忽略，反而可能把整组样本误当成颜色停靠位置。

## 七、marked：XSS 纵深防御与同步/异步

### marked 不是安全边界——这是最重要的一条

marked **默认不净化、`sanitize` 选项已移除**，它会原样输出 ``<img src=x onerror=alert(1)>`` 这类内容。把用户输入直接 `innerHTML = marked.parse(input)` 就是 XSS 漏洞。正确管线：

```ts
const safe = DOMPurify.sanitize(marked.parse(userInput) as string);
container.innerHTML = safe; // 净化必须紧挨写入 DOM 这一步
```

要点：

- **顺序**：marked 转 HTML → DOMPurify 净化 → 写入 DOM。净化之后别再被其它库改写 HTML。
- **纵深防御**：净化之外仍应配 CSP，不要因为净化了就省掉。
- **服务端渲染**：Node 端用 DOMPurify 需 jsdom 提供 window，或用 `isomorphic-dompurify`。

### 同步默认、异步按需

`marked.parse` **默认同步返回字符串**。只有用到异步扩展 / 异步 `walkTokens` 时设 `async: true`，此时返回 `Promise<string>`，务必 `await`，否则会把 `[object Promise]` 渲染进页面。

### 隔离全局状态

`marked.use()` 修改的是**全局单例**。若一个应用里多处需要不同配置/扩展，用 `new Marked(options)` 创建独立实例，避免相互串扰。

---

回到 [参考](../reference) 查 7 库的 API 速查，或回 [入门](../getting-started) 重温最小示例。
