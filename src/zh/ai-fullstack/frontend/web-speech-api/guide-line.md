---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 MDN Web Docs 与 W3C WebAudio Community Group 规范草案（2026 年）编写

## 速查

- 选型第一问：只要朗读（TTS）还是要听写（STT）？TTS 跨浏览器稳，STT 仅 Chromium/Safari
- 跨浏览器 STT：检测 `SpeechRecognition` 不存在时降级到 Whisper API / AssemblyAI
- 离线/隐私要求高：不用 Chrome 原生 STT（传云），改用 whisper.cpp WASM 或本地模型
- 长文本 TTS：Chrome 有约 15 秒自动停止 Bug，需分句 + `onboundary` 或定时 `resume`
- 选语言：`lang` 用 BCP-47（`zh-CN` / `en-US` / `ja-JP`），选错识别率骤降
- 连续听写：`continuous=true` + `onend` 自动重启（Chrome 会因网络自行 end）
- 指令识别：别用已废弃的 Grammar，自己在 `onresult` 里做关键词匹配
- 权限 UX：`start()` 必须用户手势触发，提前提示「即将使用麦克风」
- 中文 TTS 选声：`getVoices()` 筛 `lang.startsWith('zh')`，优先 `localService=true`
- 实时字幕：`interimResults=true` 显示 partial，`isFinal` 时入库

## 选型决策树

```
需求？
│
├─ 只需文字转语音（朗读）？
│     └ ✅ window.speechSynthesis（Baseline 全平台支持）
│        音质要求高 → Azure TTS / ElevenLabs
│
├─ 只需语音转文字（听写/命令）？
│     ├ Chrome/Edge/Safari 受众 → ✅ 原生 SpeechRecognition（免费、低延迟）
│     ├ 必须跨浏览器/含 Firefox → Whisper API / AssemblyAI（WebSocket）
│     ├ 必须离线/隐私 → whisper.cpp WASM / Vosk
│     └ 高精度/多语种/说话人分离 → Whisper large / 商业 STT
│
├─ 语音助手（双向对话）？
│     └ STT + LLM + TTS 组合，注意回声消除（用 headset 或 AEC）
│
└─ 无障碍（accessibility）？
      └ ✅ TTS 朗读页面内容，WCAG 友好
```

## 跨浏览器降级方案

### 能力检测

```javascript
function getSTTEngine() {
  const NativeSR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (NativeSR) return { type: "native", Ctor: NativeSR };
  return { type: "whisper", Ctor: null }; // 降级
}
```

### 降级到 Whisper API

```javascript
async function whisperTranscribe(audioBlob) {
  const form = new FormData();
  form.append("file", audioBlob, "record.webm");
  form.append("model", "whisper-1");
  form.append("language", "zh");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  const data = await res.json();
  return data.text; // 识别文字
}
```

原生 STT（实时、免费）与 Whisper API（跨浏览器、高精度、按量付费）的取舍：

| 维度 | 原生 SpeechRecognition | Whisper API |
| --- | --- | --- |
| 浏览器 | Chromium/Safari | 全部（能录音即可） |
| 实时性 | 实时 interim 结果 | 录完再传，秒级延迟 |
| 离线 | 不可（Chrome 云端） | 不可 |
| 成本 | 免费 | 按音频分钟计费 |
| 精度 | 中（短句好） | 高（长文/多语种/标点） |
| 标点/分段 | 弱 | 自动加标点 |
| 说话人分离 | 不支持 | 部分（diarization） |

### 录音用 MediaRecorder

```javascript
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const text = await whisperTranscribe(blob);
    console.log(text);
  };
  recorder.start();
  // 停止：recorder.stop();
}
```

## 连续听写实战

### 完整听写组件骨架

```javascript
class Dictation {
  constructor() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.lang = "zh-CN";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.listening = false;
    this.finalText = "";

    this.recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) this.finalText += t;
        else interim += t;
      }
      this.render(this.finalText, interim);
    };

    this.recognition.onerror = (e) => {
      if (e.error === "no-speech") return;       // 静默，忽略
      if (e.error === "not-allowed") {           // 权限被拒
        this.listening = false;
        alert("请授予麦克风权限");
      }
    };

    // Chrome 连续模式会在静默/网络中断时自动 end，需要重启
    this.recognition.onend = () => {
      if (this.listening) {
        try { this.recognition.start(); }
        catch (_) { /* 已在 start 中 */ }
      }
    };
  }

  start() {
    this.listening = true;
    this.recognition.start();
  }

  stop() {
    this.listening = false;
    this.recognition.stop();
  }

  render(final, interim) { /* 更新 DOM */ }
}
```

### 防止「重启抛错」

`start()` 在已运行时调用会抛 `InvalidStateError`。在 `onend` 重启时需 try/catch，或用标志位：

```javascript
recognition.onend = () => {
  if (shouldListen && !recognitionRunning) {
    recognitionRunning = true;
    recognition.start();
  }
};
recognition.onstart = () => { recognitionRunning = true; };
```

## Chrome 长文本 TTS Bug 规避

Chrome 的 `speechSynthesis` 在朗读较长文本（约 15 秒/200+ 字）时会莫名停止。社区常用 workaround：

### 方案 1：分句朗读

```javascript
function speakLong(text) {
  // 按标点切成短句
  const chunks = text.match(/[^。！？.!?]+[。！？.!?]?/g) || [text];
  let i = 0;
  const speakNext = () => {
    if (i >= chunks.length) return;
    const u = new SpeechSynthesisUtterance(chunks[i]);
    u.lang = "zh-CN";
    u.onend = () => { i++; speakNext(); };
    window.speechSynthesis.speak(u);
  };
  speakNext();
}
```

### 方案 2：定时 resume（hack）

```javascript
function keepAlive() {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }
}
setInterval(keepAlive, 10000); // 每 10 秒
```

### 方案 3：boundary 切分

监听 `onboundary` 拿到当前 charIndex，超时则从该位置重新 `speak`。

## 语音指令实现（无 Grammar）

废弃的 `SpeechGrammarList` 不能做有限词表，改在 `onresult` 中匹配：

```javascript
const COMMANDS = {
  "打开首页": () => (location.href = "/"),
  "搜索": (q) => location.href = `/search?q=${encodeURIComponent(q)}`,
  "停止": () => recognition.stop(),
};

recognition.onresult = (e) => {
  const text = e.results[e.results.length - 1][0].transcript.trim();
  for (const [cmd, fn] of Object.entries(COMMANDS)) {
    if (text.includes(cmd)) {
      const arg = text.replace(cmd, "").trim();
      fn(arg);
      return;
    }
  }
  // 未命中指令 → 当作自由文本
};
```

更鲁棒的做法：把识别文本喂给 LLM 做意图分类 +槽位抽取。

## TTS 选声与多语言

```javascript
async function pickVoice(lang) {
  let voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    await new Promise((r) => {
      window.speechSynthesis.onvoiceschanged = r;
    });
    voices = window.speechSynthesis.getVoices();
  }
  // 优先本地服务、目标语言
  return (
    voices.find((v) => v.lang === lang && v.localService) ||
    voices.find((v) => v.lang.startsWith(lang.split("-")[0])) ||
    voices.find((v) => v.default)
  );
}

const voice = await pickVoice("zh-CN");
utterance.voice = voice;
```

| 平台 | 典型中文语音 |
| --- | --- |
| macOS | Ting-Ting（本地） |
| Windows | Microsoft Huihui / Xiaoxiao |
| Chrome（Google 云） | Google 普通话（中国大陆）（`localService=false`） |
| Android | 系统TTS引擎语音 |

注意：`localService=false` 的语音（如 Google 云端）在某些网络环境下不可用。

## 错误处理

### STT error 类型

| `event.error` | 含义 | 处理 |
| --- | --- | --- |
| `no-speech` | 没检测到语音 | 忽略，继续 |
| `audio-capture` | 麦克风硬件问题 | 提示检查设备 |
| `not-allowed` / `service-not-allowed` | 权限被拒 | 引导授权 |
| `network` | 网络故障（Chrome 云端） | 重试或降级 |
| `aborted` | 主动 `abort()` | 正常 |
| `language-unsupported` | `lang` 不支持 | 换 BCP-47 |

### TTS error

`SpeechSynthesisErrorEvent.error` 常见值：`synthesis-failed` / `audio-busy` / `interrupted` / `canceled`。

## 性能与体验

- **节流 start**：用户频繁点击麦克风时 debounce，避免 `InvalidStateError`
- **可视化反馈**：识别中显示波形/指示灯，`onaudiostart`/`onspeechstart` 驱动
- **回声消除**：TTS 声音被 STT 重新拾取（自循环），用耳机或 WebRTC AEC
- **移动端耗电**：`continuous=true` 极耗电，非前台时 `stop()`
- **iOS 解锁**：iOS Safari 必须用户手势触发首次 `speak()`，否则静音

## 无障碍（A11y）应用

```javascript
// 为视障用户朗读选中内容
document.addEventListener("mouseup", () => {
  const text = window.getSelection().toString();
  if (text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = document.documentElement.lang || "zh-CN";
    window.speechSynthesis.speak(u);
  }
});
```

- WCAG 2.1 SC 1.4 系列鼓励提供「朗读」控件
- 配合 `aria-live="polite"` 让屏幕阅读器与 TTS 协同

## 常见陷阱

| 陷阱 | 解决 |
| --- | --- |
| `getVoices()` 返回空 | 监听 `voiceschanged` 后重新取 |
| Chrome STT 一会儿就停 | `onend` 中自动重启，注意防 `InvalidStateError` |
| Firefox 报 `SpeechRecognition is not defined` | 降级到 Whisper API，或引导用户开 about:config |
| 长文本 TTS 中途停止 | 分句朗读 或 定时 `pause()/resume()` |
| 识别中文全是乱字 | `lang` 没设或设错（应为 `zh-CN`） |
| iOS 不出声 | 首次必须在用户点击回调里 `speak()` |
| `grammars` 无效 | 已废弃，改 `onresult` 关键词匹配 |
| 麦克风权限被拒 | 引导到浏览器地址栏权限设置 |

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2012 | Web Speech API 草案发布；Chrome 率先实现 `webkitSpeechRecognition` |
| 2014-2016 | SpeechSynthesis 在各主流浏览器陆续落地 |
| 2018.09 | SpeechSynthesis 进入 Baseline（Widely available） |
| 2021 | Safari 14.1 支持 `webkitSpeechRecognition`；Grammar 接口标记 deprecated |
| 2023 | `SpeechRecognition`（无前缀）规范推进；Grammar 从规范移除 |
| 2024-2025 | Firefox 仍默认禁用 STT；社区转向 Whisper/Whisper.cpp 等跨浏览器方案 |
| 2026 | SpeechSynthesis 稳定；SpeechRecognition 仍「Limited availability」，规范处于 WICG 草案阶段 |
