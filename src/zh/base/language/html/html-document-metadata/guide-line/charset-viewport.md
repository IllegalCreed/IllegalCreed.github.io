---
layout: doc
outline: [2, 3]
---

# 字符编码与视口

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 编码：`<meta charset="utf-8">` —— `<head>` 内**第一个**元素，必须落在文档**前 1024 字节**内
- HTML5 只接受 `utf-8`；旧式 `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">` 等价但啰嗦，不推荐
- 优先级：HTTP `Content-Type` 响应头 > BOM > `<meta charset>`；三者尽量一致
- 视口：`<meta name="viewport" content="width=device-width, initial-scale=1">` —— 不写则移动端按约 980px 假宽再缩小
- viewport 取值：`width` / `height` / `initial-scale` / `minimum-scale` / `maximum-scale` / `user-scalable` / `viewport-fit` / `interactive-widget`
- 刘海屏：`viewport-fit=cover` + CSS `env(safe-area-inset-*)`
- 无障碍红线：别用 `user-scalable=no` / `maximum-scale=1` 禁止缩放
- `interactive-widget`：控制虚拟键盘弹出时视口怎么变（Chromium，渐进增强）

## 字符编码：第一个 `<meta>`

计算机存的是字节，屏幕显示的是字符，中间需要一张「字节 ↔ 字符」的映射表，这就是字符编码。浏览器若用错了表，中文就会变成「ä¸­æ–‡」这样的乱码。

```html
<meta charset="utf-8" />
```

### 三条硬规则

1. **位置**：必须在 `<head>` 最前、且落在文档**前 1024 字节**内。浏览器先「嗅探」开头这段来定编码；声明太靠后，前面的字节可能已被默认编码（`windows-1252`）错误解析。
2. **取值**：HTML5 规范实际只认 `utf-8`（不区分大小写）。UTF-8 用 1～4 字节编码覆盖全部 Unicode 字符，含中文与 emoji。
3. **唯一现代写法**：`<meta charset="utf-8">`。旧式 `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">` 效果相同但冗长，无理由再用。

### 谁说了算：优先级

同一页面可能在多处声明编码，浏览器按此优先级裁决：

1. HTTP 响应头 `Content-Type: text/html; charset=utf-8`（**最高**）；
2. 文件开头的 BOM（字节顺序标记）；
3. `<meta charset>`。

::: tip 排查乱码
中文乱码时依次检查：① 文件本身是否以 UTF-8 保存；② 服务器响应头 charset 是否为 utf-8；③ `<meta charset>` 是否存在且足够靠前。三者一致才稳。生产环境最可靠的是让服务器发正确的 `Content-Type` 头。
:::

## 视口：移动端响应式的地基

手机屏幕物理像素很多但很窄。早期移动浏览器为了把「为桌面设计的老网页」塞进小屏，会假装自己有一块约 980px 宽的虚拟视口，把整页渲染好再缩小——结果就是响应式布局失效、文字小到看不清。

视口元标签就是用来关掉这种「假装」的：

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

- `width=device-width`：让布局视口宽度等于设备宽度；
- `initial-scale=1`：初始缩放为 1，避免某些设备横竖屏切换时的缩放怪异。

### `content` 全部取值

| 取值 | 含义 | 备注 |
| --- | --- | --- |
| `width` | 布局视口宽度 | 常用 `device-width`，也可给具体像素 |
| `height` | 布局视口高度 | 极少用 |
| `initial-scale` | 初始缩放（0.1～10） | 常设 `1` |
| `minimum-scale` | 最小缩放 | |
| `maximum-scale` | 最大缩放 | 设 `1` 会禁止放大，**伤无障碍** |
| `user-scalable` | 是否允许用户缩放 | `no` 禁止缩放，**伤无障碍** |
| `viewport-fit` | 刘海屏适配 | `auto`（默认）/ `contain` / `cover` |
| `interactive-widget` | 虚拟键盘弹出时视口行为 | `resizes-visual` / `resizes-content` / `overlays-content` |

::: warning 不要禁止缩放
`user-scalable=no` 或 `maximum-scale=1` 会让低视力用户无法放大页面，是常见的无障碍违规。除非地图、游戏等极特殊场景，**务必保留用户缩放能力**。
:::

### 刘海屏与安全区

全面屏 / 挖孔屏需要让内容延伸到「刘海」区域又不被遮挡：

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

`viewport-fit=cover` 让页面铺满整个物理屏幕，再用 CSS 的 `env()` 给关键内容留出安全边距：

```css
.header {
  /* 顶部至少留出刘海 / 状态栏高度 */
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### 虚拟键盘：`interactive-widget`

`interactive-widget` 控制软键盘弹出时视口如何变化——缩小可视视口（`resizes-visual`）、缩小布局视口（`resizes-content`），还是直接覆盖在内容之上（`overlays-content`）。这是较新的能力，按**渐进增强**使用：支持的浏览器受益，不支持的回退到各自默认行为。

## 实战：一份稳妥的移动端视口

```html
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
  />
  <!-- 其余 head 内容 -->
</head>
```

这是 2026 年绝大多数项目的默认起点：UTF-8、跟随设备宽度、允许缩放、兼容刘海屏。下一页讲 `<head>` 里数量最多的一类元数据——[标题与 SEO 元数据](./title-seo-meta)。
