---
layout: doc
outline: [2, 3]
---

# 媒体捕获与设备

> 基于 WebRTC 1.0（W3C Recommendation）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **入口**：`navigator.mediaDevices` 单例；**仅安全上下文**（HTTPS / localhost / `file:`）存在，HTTP 页面上它是 `undefined`——调用直接 `TypeError`。
- **核心调用**：`getUserMedia(constraints)` 返回 `Promise<MediaStream>`；`constraints` 的 `audio`/`video` 至少开一个，两个都缺省（默认 `false`）必然 reject。
- **约束两形态**：布尔（要不要这类轨道）或 `MediaTrackConstraints` 对象（要成什么样）。
- **裸值 = ideal**：`width: 1280` 等价 `width: { ideal: 1280 }`——**尽力靠近、不满足也不失败**；浏览器按「fitness distance」挑最接近的设备与配置。
- **min/max/exact = 强制**：不满足直接 `OverconstrainedError`（`exact` 即 `min === max`）；**这类失败发生在弹权限框之前**，可被用作指纹探测面，慎用。
- **常用视频约束**：`width`/`height`/`frameRate`/`aspectRatio`/`facingMode`（`"user"` 前置、`"environment"` 后置）/`deviceId`/`resizeMode`（`"none"`/`"crop-and-scale"`）。
- **常用音频约束**：`echoCancellation`/`noiseSuppression`/`autoGainControl`/`sampleRate`。
- **锁定设备**：`deviceId: { exact: id }`；不加 `exact` 只是偏好，浏览器（或用户在权限框里的选择）可能给你换一台。
- **权限模型**：每次采集都需用户授权；浏览器**必须**显示「摄像头/麦克风使用中」指示器；`<iframe>` 里用需宿主页 `allow="camera; microphone"`（Permissions Policy 的 `camera`/`microphone` 指令）。
- **异常按 `err.name` 分诊**：`NotAllowedError`（用户拒绝/策略禁止）、`NotFoundError`（无此类设备）、`NotReadableError`（硬件被占用等系统层故障）、`OverconstrainedError`（约束无解，`err.constraint` 指认凶手）、`TypeError`（约束全空/不安全上下文）。
- **媒体模型**：`MediaStream` 是**轨道容器**，`MediaStreamTrack` 才是音/视频实体；`getTracks()`/`getVideoTracks()`/`getAudioTracks()` 取轨。
- **接 `<video>`**：`videoEl.srcObject = stream`（不是 `src`）；配 `autoplay` + `playsinline` 属性最省心。
- **停止采集**：对每条轨 `track.stop()`——释放设备、熄灭指示灯；只把 `srcObject` 置空**不会**停止采集。
- **轨道能力四件套**：`getCapabilities()`（能做到什么范围）/ `getSettings()`（现在实际是什么）/ `getConstraints()`（我要求过什么）/ `applyConstraints()`（运行时改，返回 Promise）。
- **enumerateDevices()**：列 `videoinput`/`audioinput`/`audiooutput`；**授权前 `label` 是空串**（部分浏览器连列表都收紧），先要一次权限再枚举；插拔设备监听 `devicechange` 事件。
- **getDisplayMedia(options)**：屏幕共享入口；**不可预选源**（选项只在用户选定后套用）、**权限不可持久化**（每次都弹框）、需**瞬时用户激活**（点击等手势内调用）；约束里**禁用 `min`/`exact`**（给了就 `TypeError`）。
- **getDisplayMedia 专属选项**：`preferCurrentTab`、`selfBrowserSurface`（防「镜中镜」）、`surfaceSwitching`（共享中换标签页）、`systemAudio`、`monitorTypeSurfaces`、`controller`（`CaptureController`）。
- **共享结束的正门**：用户常点浏览器自带的「停止共享」条——监听视频轨的 `ended` 事件收尾，别只做自己的停止按钮。

## 一、入口与安全上下文

媒体捕获的一切从 `navigator.mediaDevices` 开始。规范给它上了硬门槛：**只在安全上下文暴露**——HTTPS、`localhost` 或 `file:` 打开的页面。HTTP 页面上 `navigator.mediaDevices` 是 `undefined`，任何调用都会以 `TypeError` 收场。这不是浏览器实现差异，是规范行为，也是「本地开发正常、部署到 HTTP 测试机全挂」的标准答案。

`<iframe>` 里的页面还有第二道门：默认没有摄像头/麦克风权限，需要宿主页显式放行（Permissions Policy 的 `camera` 与 `microphone` 指令）：

```html
<!-- 宿主页：为这个 iframe 单独放行摄像头与麦克风 -->
<iframe src="https://meet.example.com" allow="camera; microphone"></iframe>
```

## 二、getUserMedia 与媒体流模型

`getUserMedia()` 弹出权限请求，用户允许后 resolve 一个 `MediaStream`：

```js
// 拿流 → 预览 → 用完停轨（一条最小完整链路）
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true, // 布尔形态：要这类轨道，具体参数交给浏览器
  video: { width: { ideal: 1280 }, height: { ideal: 720 } }, // 对象形态：提要求
});

const videoEl = document.querySelector("video");
videoEl.srcObject = stream; // MediaStream 接 <video> 用 srcObject，不是 src

// 结束时必须逐轨 stop()：释放设备、摄像头指示灯熄灭
function hangUp() {
  for (const track of stream.getTracks()) track.stop();
  videoEl.srcObject = null; // 只置空 srcObject 不会停止采集，stop() 才会
}
```

心智模型：**`MediaStream` 只是容器，`MediaStreamTrack` 才是实体**。一个流通常装一条音频轨 + 一条视频轨；后面把媒体送进 `RTCPeerConnection` 时，`addTrack()` 收的也是轨道（流只作分组标记）。轨道自身有 `kind`（`"audio"`/`"video"`）、`label`、`enabled`（软静音：置 `false` 发黑帧/静音帧但不释放设备）、`muted`（源头暂时没数据）与 `stop()`。

`audio`/`video` 的取值语义（MDN 原文口径）：给 `true` 表示**必须**有这类轨道，拿不到就 reject；给 `false`（或缺省）表示**不得**有；给对象则进入约束系统。

## 三、约束系统：ideal 的引力与 exact 的硬门槛

约束对象里，每个属性都能用四个关键字表达强度：

| 写法 | 语义 | 失败行为 |
| --- | --- | --- |
| `width: 1280`（裸值） | 等价 `ideal`：尽力靠近 | **不会失败**，挑最接近的 |
| `width: { ideal: 1280 }` | 理想值，有「引力」 | 不会失败；按 fitness distance 择优 |
| `width: { min: 1280 }` / `{ max: 640 }` | 硬性下/上限 | 无解则 `OverconstrainedError` |
| `width: { exact: 1280 }` | 必须恰好（`min === max`） | 无解则 `OverconstrainedError` |

```js
// 偏好 720p、前置摄像头：全 ideal，永不因约束失败
await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 24 }, // 带宽紧张的 WebRTC 传输常主动压帧率
    facingMode: "user", // 移动端：user 前置 / environment 后置
  },
});

// 硬性要求后置摄像头：拿不到就 OverconstrainedError，而不是退而求其次
await navigator.mediaDevices.getUserMedia({
  video: { facingMode: { exact: "environment" } },
});
```

几个容易忽略的行为细节（均为 MDN 明确口径）：

- **ideal 有引力**：多摄像头设备上，浏览器会综合所有 ideal 值算「fitness distance」，选整体最接近的**设备 + 配置**组合；
- **降级手段**：硬件不直接支持目标分辨率时，浏览器可能对更高分辨率**裁剪缩放**来满足你（`resizeMode: "crop-and-scale"` 强制这样做、`"none"` 禁止）；
- **`OverconstrainedError` 发生在权限框之前**：约束无解时用户根本不会被询问——这意味着它可以在未授权时探测设备能力，是规范点名的**指纹面**，公开页面慎用 `min`/`exact`；
- **用户选择可能覆盖你的偏好**：权限框里用户选了另一台摄像头时，浏览器可以尊重用户而不是你的 `deviceId` 偏好——真要锁定就 `deviceId: { exact: … }`。

运行时调整用轨道的 `applyConstraints()`，不必重新 `getUserMedia`：

```js
const [track] = stream.getVideoTracks();
console.log(track.getCapabilities()); // 该设备各属性的可行范围（如 width: {max: 1920}）
console.log(track.getSettings()); // 当前实际生效值（如 width: 1280）
await track.applyConstraints({ frameRate: { max: 15 } }); // 运行中降帧率，省带宽
```

## 四、权限模型与异常处理

规范对隐私的要求是浏览器**必须**做到的硬约束：每次采集前取得用户授权（可按域记住，但至少问一次）；摄像头/麦克风使用中时，浏览器 UI 必须有**使用指示器**，甚至「已授权但当前未采集」也要有标识。作为开发者，你要做的是把八种失败都接住：

| `err.name` | 什么时候发生 | 该怎么办 |
| --- | --- | --- |
| `NotAllowedError` | 用户拒绝、之前拒绝过、Permissions Policy 禁止 | 展示引导（如何重新开权限），别死循环重试 |
| `NotFoundError` | 没有满足要求的设备类型 | 提示接入设备/放宽约束 |
| `NotReadableError` | 授权了，但系统/驱动层拿不到（常见：设备被其他应用占用） | 提示关闭占用应用 |
| `OverconstrainedError` | 约束无解；`err.constraint` 是无法满足的那条 | 放宽或改用 ideal 重试 |
| `TypeError` | 约束全空/全 `false`，或不安全上下文 | 修代码/上 HTTPS |
| `AbortError` | 授权与硬件都正常，但设备启用被其他问题打断 | 重试或提示换设备 |
| `SecurityError` | 该 Document 上的用户媒体支持被禁用 | 检查浏览器设置/内嵌环境 |
| `InvalidStateError` | 文档不是 fully active（如已被移出） | 检查调用时机 |

```js
try {
  stream = await navigator.mediaDevices.getUserMedia(constraints);
} catch (err) {
  switch (err.name) {
    case "NotAllowedError": // 权限被拒：引导用户去地址栏重开
      showPermissionHelp();
      break;
    case "OverconstrainedError": // 约束无解：err.constraint 指认是哪条
      console.warn(`无法满足约束：${err.constraint}`);
      return retryWithIdeal(); // 降级为 ideal 再试一次
    case "NotReadableError": // 设备被占用：提示关掉其他会议软件
      showDeviceBusyHelp();
      break;
    default:
      console.error(err);
  }
}
```

## 五、enumerateDevices：设备列表与切换

`enumerateDevices()` 返回 `Promise<MediaDeviceInfo[]>`，每项含 `kind`（`"videoinput"` / `"audioinput"` / `"audiooutput"`）、`deviceId`、`label`、`groupId`。隐私规则是使用它的前提：**未授权时 `label` 一律空字符串**（部分浏览器还会收紧列表、模糊 `deviceId`）——所以「先枚举再让用户挑」行不通，正确顺序是**先要一次权限、再枚举**：

```js
// 1. 先拿一次权限（任意约束都行），否则枚举结果没有可读名字
await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

// 2. 枚举并分类，渲染设备选择下拉框
const devices = await navigator.mediaDevices.enumerateDevices();
const cams = devices.filter((d) => d.kind === "videoinput");
const mics = devices.filter((d) => d.kind === "audioinput");

// 3. 用户选定后，用 exact 精确锁定那台设备
const stream = await navigator.mediaDevices.getUserMedia({
  video: { deviceId: { exact: cams[0].deviceId } },
});

// 4. 插拔摄像头/耳机时列表会变，devicechange 事件负责感知
navigator.mediaDevices.ondevicechange = () => refreshDeviceList();
```

移动端切换前后摄像头有个经典坑：不少设备**不允许同时打开两个摄像头**，直接用新 `facingMode` 再要一条流会 `NotReadableError`。MDN 的建议是**先对旧轨 `stop()` 释放，再申请新方向**。

## 六、getDisplayMedia：屏幕共享

`getDisplayMedia()` 与 `getUserMedia()` 同属 `MediaDevices`、同样产出 `MediaStream`，但威胁模型完全不同（屏幕上什么都可能有），所以规范写死了三条安全设计——都是「API 做不到」而不是「你没找到参数」：

1. **不可预选/限定共享源**：你传的选项**不能**缩小用户的可选范围，只在用户选定后套用到输出上——「只让用户选某个窗口」这种需求 API 层面不存在；
2. **权限不可持久化**：每次调用都会弹选择框，没有「记住我的选择」；
3. **必须瞬时用户激活**：得在点击等手势的事件处理器里调用，否则 `InvalidStateError`。

```js
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: { displaySurface: "window" }, // 只是偏好提示，最终选什么由用户决定
  audio: true, // 是否真能带音频，取决于浏览器与所选源
  selfBrowserSurface: "exclude", // 不把当前标签页列为可选项，防「镜中镜」
  surfaceSwitching: "include", // 共享中允许用户直接切换共享的标签页
  monitorTypeSurfaces: "include", // 是否把「整个屏幕」列入选项
});

// 用户点浏览器自带的「停止共享」不会经过你的按钮——监听轨道 ended 收尾
screenStream.getVideoTracks()[0].addEventListener("ended", () => {
  restoreCameraUI();
});
```

约束规则比 `getUserMedia` 严：`video: false` 直接 `TypeError`（屏幕共享必须有视频轨）；约束里**禁止 `min` 与 `exact`**（用了就 `TypeError`）——因为「不可预选源」原则下，硬约束无从谈起。

把屏幕画面接进已有通话是它最常见的归宿——配合 `RTCRtpSender.replaceTrack()` 可以**不重协商**无缝切换：

```js
// 把通话中的视频从摄像头切到屏幕：换轨不换连接
const sender = pc.getSenders().find((s) => s.track?.kind === "video");
await sender.replaceTrack(screenStream.getVideoTracks()[0]);
```

## 七、易错点

- **HTTP 页面上 `navigator.mediaDevices` 是 `undefined`**：报 `TypeError` 先查协议，再查代码。
- **`audio`/`video` 全缺省**：两者默认 `false`，空约束必 reject——至少显式开一个。
- **把 `exact` 当默认写法**：约束无解直接失败且可当指纹面；日常用 ideal，确有硬要求才 `exact`。
- **先枚举后授权**：拿到的 `label` 全是空串——顺序必须反过来。
- **只置空 `srcObject` 当停止**：设备仍被占用、指示灯常亮；必须逐轨 `track.stop()`。
- **`track.enabled = false` 当挂断**：那只是软静音（发黑帧/静音帧），设备没释放。
- **移动端直接切 `facingMode`**：可能 `NotReadableError`，先 `stop()` 旧轨再申请。
- **试图预选 `getDisplayMedia` 的共享源**：API 设计上不允许，选项只是提示。
- **屏幕共享只做自己的停止按钮**：用户点的是浏览器的「停止共享」条——`ended` 事件才是可靠的收尾时机。
- **iframe 里权限死活弹不出来**：查宿主页有没有 `allow="camera; microphone"`。

媒体流已经在手，下一步把它送到对端去——连接对象的完整生命周期：[RTCPeerConnection 生命周期](./peer-connection)。
