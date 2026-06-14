---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 本篇汇总 7 个库的**边缘陷阱、性能与安全深水区**——容易踩、不易察觉、面试常考的点。

## 一、mitt：触发期间修改监听 & 解构陷阱

### emit 期间增删监听

mitt 内部对某事件的 handler 列表做遍历调用。**在一个 handler 里给同一事件再 `on`/`off`**，可能影响本次遍历的行为（不同实现细节不一），是易错点。稳妥做法：把「订阅/退订」延后到本轮 `emit` 之后，或用一次性标志位。

### 解构是特性而非 bug

mitt 方法不依赖 `this`，所以 `const { emit } = bus` 后单独调用完全正常——这与很多 OO 风格的 emitter 不同。**触发顺序确定**：类型化 handler 先于 `'*'` 通配 handler（已实测 `typed -> wild`）。手动 `emit('*')` 来触发通配是不支持的。

### 没有 `removeAllListeners`，但有 `all`

mitt 不提供 `removeAllListeners()`，但 `all` 是个 `Map`，`bus.all.clear()` 即可清空全部；针对单事件用 `bus.off('e')`。

## 二、qs：comma 往返陷阱与原型污染防护

### comma 格式不保证无损往返

`arrayFormat: 'comma'` 把数组拼成 `a=b,c`，但反向解析有歧义：

- **单元素数组退化**：`['b']` → `a=b`，再 `parse` 通常得到字符串 `'b'` 而非 `['b']`；
- **值含逗号被误拆**：`['a,b']` → `a=a,b`，解析回来变成 `['a','b']`。

需要稳定往返时，优先 `brackets`/`indices`，或对 comma 配合 `comma: true` 解析并在业务层兜底单元素/转义。

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

解析用户上传的 zip 时，警惕**解压炸弹**（极小压缩包解出超大内容）。读取前可先检查 `Object.keys(zip.files).length` 与各条目的预估大小，对异常体积拒绝处理。

## 四、FileSaver：体积上限、iOS 与用户手势

- **单 Blob 体积上限**因浏览器而异（量级如 Chrome ~2GB、Firefox ~800MiB），超限会失败——大文件别一次性 `saveAs`。
- **iOS Safari** 对下载支持弱，常是「在新窗口打开」而非保存，且需**用户手势**触发；自动/延迟很久后调用 `saveAs` 多会被拦。
- **跨源 URL**：`saveAs(url)` 跨域是否能按数据下载取决于服务端 CORS，否则退化为普通跳转（可能直接在浏览器打开而非下载）。
- **现代替代**：对「保存到用户指定位置 + 大文件流式写」，可评估 File System Access API（`showSaveFilePicker`），但兼容性不如 FileSaver 广。

## 五、qrcode：容量、纠错与中心遮挡的权衡

### 容量取决于「版本 × 纠错级别 × 数据模式」

- **版本**（1~40）决定矩阵尺寸，越大容量越高；不指定则按内容自动选最小可容纳版本。
- **纠错级别越高（H），可用数据容量越低**——同样数据，`H` 可能需要更大的版本/尺寸。
- 数字/字母/字节/Kanji 模式容量不同，纯数字最省。

### 带 logo 的码为什么要用 H

中心叠 logo 会遮挡部分模块。`H` 级（~30% 冗余）能容忍这种遮挡仍被扫出；但遮挡面积仍要克制（一般 logo 不超过码面积的 ~15%~20%），否则即便 H 也可能失败。

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

`classes(n)` 等距分桶，若数据高度偏斜，等距分级会让多数值挤在一两档。可配合 `domain(values, n, 'quantiles')` 用分位数分级，使各档样本量更均衡。

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
