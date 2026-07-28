---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MDN Web Docs 与 W3C WebAudio Community Group 规范草案（2026 年）编写

## SpeechSynthesis（TTS）

### 接口与入口

| 名称 | 说明 |
| --- | --- |
| `window.speechSynthesis` | 全局 `SpeechSynthesis` 实例（入口） |
| `SpeechSynthesis` | 控制器，继承 `EventTarget` |
| `SpeechSynthesisUtterance` | 一次朗读请求（文本+参数） |
| `SpeechSynthesisVoice` | 一个可用语音 |
| `SpeechSynthesisEvent` | 朗读相关事件对象 |
| `SpeechSynthesisErrorEvent` | 朗读错误事件对象 |

### SpeechSynthesis 方法

| 方法 | 说明 |
| --- | --- |
| `speak(utterance)` | 把 utterance 加入队列，依次朗读 |
| `cancel()` | 清空队列并停止 |
| `pause()` | 暂停当前朗读 |
| `resume()` | 恢复暂停的朗读 |
| `getVoices()` | 返回 `SpeechSynthesisVoice[]`（可能空，待 `voiceschanged`） |

### SpeechSynthesis 只读状态

| 属性 | 类型 | 含义 |
| --- | --- | --- |
| `paused` | bool | 是否暂停 |
| `pending` | bool | 队列是否有待朗读 |
| `speaking` | bool | 是否正在朗读 |

### SpeechSynthesis 事件

| 事件 | 触发 |
| --- | --- |
| `voiceschanged` | `getVoices()` 结果变化（异步加载完成） |
| `start` / `end` | 朗读开始/全部结束 |
| `error` | 出错 |

### SpeechSynthesisUtterance

构造：`new SpeechSynthesisUtterance(text)`

| 属性 | 类型 | 范围/默认 | 说明 |
| --- | --- | --- | --- |
| `text` | string | - | 要朗读的文本 |
| `lang` | string | BCP-47 | 如 `zh-CN` / `en-US` |
| `voice` | SpeechSynthesisVoice | - | 选定语音（优先于 lang） |
| `volume` | float | 0 – 1（默认 1） | 音量 |
| `rate` | float | 0.1 – 10（默认 1） | 语速 |
| `pitch` | float | 0 – 2（默认 1） | 音调 |

事件：`start` / `end` / `pause` / `resume` / `mark` / `boundary` / `error`。

### SpeechSynthesisVoice

| 属性 | 说明 |
| --- | --- |
| `name` | 语音名称 |
| `lang` | BCP-47 语言 |
| `voiceURI` | 唯一标识 |
| `default` | 是否系统默认 |
| `localService` | 是否本地引擎（false=云端） |

## SpeechRecognition（STT）

### 接口

| 名称 | 说明 |
| --- | --- |
| `SpeechRecognition` | 控制器（Chrome/Edge 需 `webkit` 前缀） |
| `SpeechRecognitionResultList` | 识别结果列表 |
| `SpeechRecognitionResult` | 单条结果（含多个候选） |
| `SpeechRecognitionAlternative` | 单个候选（transcript + confidence） |
| `SpeechRecognitionEvent` | result 事件对象 |
| `SpeechRecognitionErrorEvent` | error 事件对象 |
| ~~`SpeechGrammar`~~ | **已废弃**，无效果 |
| ~~`SpeechGrammarList`~~ | **已废弃**，无效果 |

### 构造（兼容前缀）

```javascript
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
```

### SpeechRecognition 属性

| 属性 | 默认 | 说明 |
| --- | --- | --- |
| `lang` | 浏览器默认 | BCP-47 识别语言 |
| `continuous` | `false` | `true` 持续识别；`false` 单次 |
| `interimResults` | `false` | 是否返回中间结果 |
| `maxAlternatives` | `1` | 候选数 |
| `grammars` | - | **已废弃**，无效 |

### SpeechRecognition 方法

| 方法 | 说明 |
| --- | --- |
| `start()` | 开始识别（须用户手势触发） |
| `stop()` | 停止（等当前结果返回） |
| `abort()` | 立即中止 |

### SpeechRecognition 事件

| 事件 | 触发 |
| --- | --- |
| `audiostart` | 开始采集音频 |
| `audioend` | 结束采集音频 |
| `speechstart` | 检测到语音 |
| `speechend` | 语音结束 |
| `soundstart` / `soundend` | 检测到声音 |
| `nomatch` | 有语音但无匹配 |
| `result` | 拿到识别结果 |
| `error` | 出错 |
| `start` / `end` | 识别开始/结束 |

### result 事件结构

```text
SpeechRecognitionEvent
 └─ results: SpeechRecognitionResultList
     └─ [i]: SpeechRecognitionResult
         ├─ isFinal: boolean
         └─ [j]: SpeechRecognitionAlternative
             ├─ transcript: string
             └─ confidence: float (0-1)
```

### error 类型

| `error` 值 | 含义 |
| --- | --- |
| `no-speech` | 未检测到语音 |
| `aborted` | 主动 abort |
| `audio-capture` | 麦克风硬件问题 |
| `network` | 网络故障（Chrome 云端识别） |
| `not-allowed` | 麦克风权限被拒 |
| `service-not-allowed` | 服务不允许（策略） |
| `bad-grammar` | grammar 错误（已废弃仍会触发） |
| `language-unsupported` | lang 不支持 |

## 浏览器兼容性详表

### SpeechSynthesis

| 浏览器 | 支持 | 备注 |
| --- | --- | --- |
| Chrome | 33+ | 全功能 |
| Edge | 14+ | 全功能 |
| Firefox | 49+ | 全功能 |
| Safari | 7+（iOS）/ 7+（macOS） | 全功能 |
| Samsung Internet | 4.0+ | 全功能 |
| Opera | 21+ | 全功能 |

状态：**Baseline Widely available**（2018-09）。

### SpeechRecognition

| 浏览器 | 支持 | 备注 |
| --- | --- | --- |
| Chrome | 25+（`webkit`） | 云端识别引擎 |
| Edge | 79+（`webkit`） | Chromium 内核 |
| Safari | 14.1+（`webkit`） | 不完整 |
| Opera | 27+（`webkit`） | Chromium |
| Samsung Internet | 1.5+ | |
| Firefox | 默认禁用 | `about:config` 开 `media.webspeech.recognition.enable` + `force_enable`（实验性） |

状态：**Limited availability**（非 Baseline）。

## 安全与权限

| 要求 | 说明 |
| --- | --- |
| 安全上下文 | HTTPS 或 `localhost`（SpeechRecognition 必须） |
| 麦克风权限 | `getUserMedia` 同源权限，首次弹窗授权 |
| Permissions-Policy | `microphone` 指令；iframe 需 `allow="microphone"` |
| 用户手势 | `start()` 必须由手势触发（防自动监听） |
| 传输 | Chrome STT 音频上传服务器（非本地） |

## 第三方方案对比

| 方案 | 类型 | 浏览器 | 离线 | 精度 | 成本 |
| --- | --- | --- | --- | --- | --- |
| 原生 SpeechRecognition | 云 STT | Chromium/Safari | 否 | 中 | 免费 |
| 原生 SpeechSynthesis | 本地/云 TTS | 全部 | 部分 | 中 | 免费 |
| OpenAI Whisper API | 云 STT | 全部 | 否 | 高 | 按分钟 |
| AssemblyAI | 云 STT | 全部 | 否 | 高 | 按分钟 |
| whisper.cpp WASM | 本地 STT | 全部（WASM） | 是 | 高 | 免费 |
| Vosk | 本地 STT | 全部（WASM） | 是 | 中 | 免费 |
| Azure Speech | 云 STT/TTS | 全部 | 否 | 高 | 按量 |
| ElevenLabs | 云 TTS | 全部 | 否 | 极高（拟真） | 按字符 |
| Coqui TTS | 本地 TTS | 全部（WASM） | 是 | 高 | 免费 |

## 资源链接

- MDN Web Speech API：[developer.mozilla.org/Web/API/Web_Speech_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- W3C 规范草案：[webaudio.github.io/web-speech-api](https://webaudio.github.io/web-speech-api/)
- 规范仓库 WICG：[github.com/WICG/speech-api](https://github.com/WICG/speech-api)
- Can I Use Speech Recognition：[caniuse.com/speech-recognition](https://caniuse.com/speech-recognition)
- Can I Use Speech Synthesis：[caniuse.com/speech-synthesis](https://caniuse.com/speech-synthesis)
- 使用指南：[Using the Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)
