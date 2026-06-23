---
layout: doc
outline: [2, 3]
---

# Storage 审计与图形

> 基于 Safari 26（macOS / iOS 26）编写

## 速查

- Storage：Cookies / Local / Session / IndexedDB / Databases / Cache / Service Workers
- Audit：内置可访问性与代码审计，**支持自写审计脚本**
- Graphics：Canvas 调用录制、动画关键帧、CSS 动画 / 过渡预览
- Layers：合成图层可视化，排查不必要的图层
- iOS 真机的存储 / SW 同样可在此查看

## Storage 面板

集中管理客户端存储（对应 Chrome 的 Application）：

- **Cookies**：查看 / 编辑 / 删除（含 `Secure` / `SameSite`）
- **Local / Session Storage**：键值表
- **IndexedDB / Databases**：数据库浏览
- **Cache Storage**：Service Worker 缓存
- **Service Workers**：注册与状态

> 调试 iOS 上的 **ITP（智能防跟踪）** 对 Cookie / 存储的影响时，Storage 面板是关键——ITP 会限制第三方 Cookie 与存储寿命，这种行为只在 WebKit 出现。

## Audit 面板

Safari 的 **Audit** 对页面执行审计，检查常见代码与可访问性问题：

- 内置审计组（可访问性、代码规范等）
- **支持自定义审计**：用 JavaScript 编写审计规则，针对团队规范做检查
- 运行后列出问题节点，点击定位

```js
// 自定义审计（示意）：检查图片是否都有 alt
function() {
  const imgs = Array.from(document.images);
  return { errors: imgs.filter((i) => !i.alt).length };
}
```

> Audit 的自定义能力是 Safari 的小特色；但可纳入 CI 的自动化可访问性测试仍归「前端测试 · 可访问性测试」。

## Graphics 面板

预览与调试图形相关内容：

- **Canvas**：录制 Canvas / WebGL 的绘制调用，逐帧回放
- **动画关键帧**：预览 CSS 动画、CSS 过渡、JS 动画的关键帧与时序
- 排查动画卡顿、Canvas 绘制问题

## Layers 面板

可视化页面的**合成图层（compositing layers）**：

- 列出所有合成层及其内存占用、创建原因
- 排查「图层爆炸」——过多不必要的合成层会增加内存与合成开销

> 移动端 GPU 内存有限，用 Layers 检查 iOS 页面的图层数量尤其重要。

## 小结

Safari Web Inspector 的通用面板（Elements / Console / Sources / Network / Storage）与 Chrome 习惯一致，桌面调试体验略简但够用；其**不可替代价值**始终是 **iOS / iPadOS 真机远程调试 + WebKit 真实行为还原**。做移动端 Web，它是必备的最后一站。

## 资源

- [Safari 开发者工具](https://developer.apple.com/safari/tools/)
- [检查 iOS / iPadOS](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios)
