---
layout: doc
outline: [2, 3]
---

# 音频与视频

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<video>` / `<audio>` 都用子 `<source>` 列多格式（浏览器选**第一个能播的**），元素内文字作不支持时的兜底
- `controls`：布尔，给出播放控件——**几乎总要写**（无控件用户无法暂停 / 调音量）
- `poster`（仅 `<video>`）：加载 / 未播时显示的封面图；不写则首帧充当封面
- `preload`：`none`（不预载）/ `metadata`（只取时长尺寸）/ `auto`（可下整片），默认建议 `metadata`
- 自动播放策略：现代浏览器**拦截带声音的自动播放**，`autoplay` 必须配 `muted` 才生效（`autoplay muted`）
- 关闭自动播放要**删掉 `autoplay` 属性**，写 `autoplay="false"` 无效（布尔属性）
- `loop` 循环、`playsinline`（仅 `<video>`）移动端内联播放（不强制全屏）
- 字幕用 `<track kind src srclang label default>` 指向 `.vtt`（WebVTT）；`kind` 有 captions / subtitles / descriptions / chapters / metadata
- `default` 每个媒体每种 `kind` 只能标一个；跨域 `.vtt` 需父元素加 `crossorigin`
- 视频格式：WebM（VP9 / AV1）+ MP4（H.264）双发最稳；音频：Opus / MP3 双发
- `controlslist`：`nodownload` / `nofullscreen` / `noremoteplayback` 收敛控件项；`<audio>` 无 `poster` / `width` / `height` / `playsinline`

## `<video>`：可控、带封面、多格式

最实用的视频写法——可控件、带封面、按需预加载、多格式回退、带字幕：

```html
<video controls poster="poster.jpg" preload="metadata" width="640" height="360">
  <source src="movie.webm" type="video/webm" />
  <source src="movie.mp4" type="video/mp4" />
  <track default kind="captions" srclang="zh" label="中文" src="captions.vtt" />
  你的浏览器不支持视频，请 <a href="movie.mp4">下载观看</a>。
</video>
```

逐个属性看：

| 属性 | 作用 |
| --- | --- |
| `controls` | 布尔，显示原生播放 / 暂停 / 音量 / 进度控件——**几乎总要写** |
| `poster` | 加载中 / 未播放时的封面图；不写则用视频首帧 |
| `preload` | 预加载策略（见下） |
| `width` / `height` | 显示区尺寸（CSS 像素，绝对值，不接受百分比） |
| `loop` | 布尔，播完自动回到开头重播 |
| `muted` | 布尔，初始静音（自动播放的前提，见下） |
| `autoplay` | 布尔，可播时自动开始（受策略限制） |
| `playsinline` | 布尔，移动端内联播放、不强制全屏 |
| `crossorigin` | CORS 取流（`anonymous` / `use-credentials`），跨域字幕 / canvas 需要 |

元素**开闭标签之间的文字**是兜底：不支持 `<video>` 的环境会显示它。

## `preload`：先下多少

`preload` 是给浏览器的**提示**（非强制），权衡「秒播体验」与「流量浪费」：

| 取值 | 行为 |
| --- | --- |
| `none` | 不预加载——最省流量，但点播放后才开始下、起播慢 |
| `metadata` | 只取元数据（时长、尺寸、首帧），不下正片——**常用折中** |
| `auto` | 浏览器可下整片，哪怕用户未必播——起播最快，最费流量 |
| `""`（空串） | 等同 `auto` |

规范建议默认 `metadata`，但各浏览器实际默认不一。准则：**列表 / 长页里的视频用 `none` 或 `metadata`**，避免一进页面就吃掉大量流量；用户明确要看的主播放器才考虑 `auto`。注意 `autoplay` 会**压过** `preload`——要自动播就必然得下。

## 自动播放策略：为什么必须 `muted`

这是最容易踩的坑。**现代浏览器默认拦截「带声音的自动播放」**——突然外放声音是糟糕的体验。所以单写 `autoplay` 往往**不生效**，必须同时静音：

```html
<!-- ✅ 能自动播：静音 -->
<video autoplay muted loop playsinline width="640" height="360">
  <source src="bg.webm" type="video/webm" />
</video>

<!-- ❌ 大概率被拦：带声音的自动播放 -->
<video autoplay>
  <source src="bg.webm" type="video/webm" />
</video>
```

::: warning 两个反直觉点
- **关闭自动播放要删属性**，不能写 `autoplay="false"`。`autoplay` 是**布尔属性**——只要属性**存在**（无论值是什么）就为真，要关掉就把整个 `autoplay` 删掉。
- **`muted` 也是布尔属性**：写 `muted` 即静音，`muted="false"` 同样无法「取消静音」，删掉才有声。
:::

典型场景是「无声背景视频」：`autoplay muted loop playsinline` 四件套——自动、静音、循环、移动端内联。但**别让关键信息只靠背景视频传达**，且始终为正片提供控件与字幕。

## `<audio>`：和 `<video>` 几乎一致

`<audio>` 用法基本同 `<video>`，**但没有** `poster` / `width` / `height` / `playsinline`（音频没有画面）：

```html
<audio controls preload="metadata">
  <source src="song.opus" type="audio/ogg; codecs=opus" />
  <source src="song.mp3" type="audio/mpeg" />
  请 <a href="song.mp3" download>下载音频</a>。
</audio>
```

它同样支持 `controls` / `autoplay` / `muted` / `loop` / `preload` / `crossorigin` / `controlslist`，自动播放也受同样的静音策略约束。常见音频格式与 MIME：

| 格式 | `type` | 备注 |
| --- | --- | --- |
| MP3 | `audio/mpeg` | 兼容性最广 |
| AAC | `audio/aac` | 常见于苹果生态 |
| Opus | `audio/ogg; codecs=opus` | 现代、低码率高音质 |
| Vorbis | `audio/ogg; codecs=vorbis` | 开源 |
| WAV | `audio/wav` | 无损、体积大 |

## 多格式回退：`<source>` 的挑选规则

浏览器对编解码格式支持不一，`<source>` 让你一次列多份、由浏览器挑能播的：

```html
<video controls width="640" height="360">
  <source src="movie.webm" type="video/webm" />
  <source src="movie.mp4" type="video/mp4" />
  你的浏览器不支持，请 <a href="movie.mp4">下载</a>。
</video>
```

- 浏览器**自上而下**尝试，用**第一个它能解码**的 `<source>`；
- `type` 让浏览器**不必下载就预判**能否播，避免无谓请求；可在 `type` 里带 `codecs` 进一步声明编码；
- 全部 `<source>` 都失败时，`error` 事件在 `<video>` / `<audio>` 上触发（**不在**单个 `<source>` 上）。

实战「双发」最稳：视频给 **WebM（VP9 / AV1）+ MP4（H.264）**，音频给 **Opus + MP3**——覆盖几乎所有现代浏览器。

## 字幕与文本轨：`<track>`

无障碍的关键。`<track>` 给媒体挂同步文本轨，指向 **WebVTT**（`.vtt`）文件：

```html
<video controls width="640" height="360">
  <source src="movie.mp4" type="video/mp4" />
  <track default kind="captions" srclang="zh" label="中文" src="captions-zh.vtt" />
  <track kind="captions" srclang="en" label="English" src="captions-en.vtt" />
</video>
```

`<track>` 的属性：

| 属性 | 说明 |
| --- | --- |
| `kind` | 轨道类型（见下表）；省略默认 `subtitles`，非法值按 `metadata` 处理 |
| `src` | **必填**，指向 `.vtt` 文件 |
| `srclang` | 轨道语言（BCP 47，如 `zh` / `en`）；`kind="subtitles"` 时**必填** |
| `label` | 给用户看的轨道名（控件菜单里显示） |
| `default` | 布尔，默认启用的轨道；**每个媒体每种 `kind` 只能标一个** |

`kind` 取值含义：

| `kind` | 用途 |
| --- | --- |
| `subtitles` | 字幕：对白的转写 / 翻译（声音听得见但听不懂，如外语） |
| `captions` | 闭合字幕：对白 + 音效 + 音乐提示等（声音不可用 / 听障，更完整） |
| `descriptions` | 视觉描述：把画面内容转成可朗读文本（视障 / 无屏场景） |
| `chapters` | 章节标题：供用户在媒体里跳转导航 |
| `metadata` | 脚本用的元数据，不直接展示给用户 |

::: tip 跨域字幕要 `crossorigin`
`.vtt` 默认必须与文档**同源**；若字幕放在别的域，要给父 `<video>` / `<audio>` 加 `crossorigin`（如 `crossorigin="anonymous"`），否则字幕加载会被拦。另外，同一媒体里 `kind` + `srclang` + `label` 三者都相同的 `<track>` 不能重复。
:::

一个最小 WebVTT 文件长这样：

```text
WEBVTT

00:00:00.000 --> 00:00:03.000
大家好，欢迎收看本期内容。

00:00:03.500 --> 00:00:07.000
今天我们聊聊 HTML 多媒体。
```

首行固定 `WEBVTT`，每条「时间轴 + 文本 + 空行」。`-->` 两侧是 `时:分:秒.毫秒`。

## `controlslist`：收敛控件项

当显示了 `controls`、又想藏掉某些按钮（如下载、全屏）时用 `controlslist`：

```html
<video controls controlslist="nodownload nofullscreen" width="640" height="360">
  <source src="movie.mp4" type="video/mp4" />
</video>
```

可选 token：`nodownload`（去下载）、`nofullscreen`（去全屏）、`noremoteplayback`（去投屏）。它只是**视觉上**收敛控件，不构成真正的访问控制（用户仍可能通过其他途径拿到资源）。

## 小结

`controls` 给控制权、`poster` / `preload` 平衡体验与流量、`autoplay` 必须配 `muted`、`<track>` 提供字幕——这是音视频「能用且无障碍」的基线。前面讲的都是把**自家媒体**放进页面；下一页转向把**别人的页面**嵌进来，以及随之而来的安全问题：[`<iframe>` 嵌入与安全](./iframe-embedding)。
