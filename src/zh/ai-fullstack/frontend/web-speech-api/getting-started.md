---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MDN Web Docs（Web Speech API / SpeechSynthesis / SpeechRecognition）与 W3C WebAudio Community Group 规范草案（2026 年）编写

## 速查

- **两大模块**：SpeechSynthesis（TTS 文字转语音，Baseline 广泛支持）+ SpeechRecognition（STT 语音转文字，兼容性受限）
- **TTS 入口**：全局 `window.speechSynthesis`，调用 `speak(new SpeechSynthesisUtterance(text))`
- **Utterance 属性**：`text` / `lang` / `voice` / `volume`(0-1) / `rate`(0.1-10) / `pitch`(0-2)
- **取声音异步**：`getVoices()` 首次可能返回空数组，需监听 `voiceschanged` 事件
- **STT 构造**：`const SR = window.SpeechRecognition || window.webkitSpeechRecognition`（Chrome 必须 webkit 前缀）
- **STT 关键属性**：`lang`（BCP-47，如 `zh-CN`）/ `continuous`（连续）/ `interimResults`（中间结果）/ `maxAlternatives`
- **STT 事件**：`result`（拿到文字）/ `error` / `end` / `speechstart` / `speechend` / `nomatch`
- **STT 方法**：`start()` / `stop()` / `abort()`
- **安全上下文**：SpeechRecognition 必须在 HTTPS 或 localhost 下运行，且需麦克风权限
- **Chrome STT 是云端**：音频上传 Google 服务器，离线不可用
- **Grammar 已废弃**：`SpeechGrammar` / `SpeechGrammarList` 接口保留但无效
- **Firefox**：STT 默认禁用，需 `about:config` 开 `media.webspeech.recognition.enable`

## 第一个 TTS：让网页说话

```javascript
// 最简文字转语音
const utterance = new SpeechSynthesisUtterance("你好，这是 Web Speech API 的语音合成。");
utterance.lang = "zh-CN";
utterance.rate = 1.0;   // 语速 0.1-10，默认 1
utterance.pitch = 1.0;  // 音调 0-2，默认 1
utterance.volume = 1.0; // 音量 0-1，默认 1
window.speechSynthesis.speak(utterance);
```

`SpeechSynthesisUtterance` 实例还可以监听事件：

```javascript
utterance.onstart = () => console.log("开始朗读");
utterance.onend = () => console.log("朗读结束");
utterance.onerror = (e) => console.error("出错：", e.error);
utterance.onboundary = (e) => console.log("读到第", e.charIndex, "个字符");
```

### SpeechSynthesis 控制方法

| 方法 | 作用 |
| --- | --- |
| `speak(utterance)` | 加入队列朗读（排队，非打断） |
| `cancel()` | 清空队列，停止所有朗读 |
| `pause()` | 暂停当前朗读 |
| `resume()` | 恢复暂停的朗读 |
| `getVoices()` | 返回可用语音数组（可能为空，见下） |

只读状态属性：`speaking` / `paused` / `pending`。

## 获取并选择语音

`getVoices()` 是异步加载的，首次调用常返回空数组，必须监听 `voiceschanged`：

```javascript
let voices = [];

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  // 例如筛选中文语音
  const zhVoices = voices.filter((v) => v.lang.startsWith("zh"));
  console.log(zhVoices.map((v) => `${v.name} (${v.lang})`));
  // 可能输出：["Microsoft Xiaoxiao (zh-CN)", "Google 普通话（中国大陆） (zh-CN)"]
}

loadVoices();
if (window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
```

### SpeechSynthesisVoice 属性

| 属性 | 含义 |
| --- | --- |
| `name` | 语音名称（如「Google 普通话」） |
| `lang` | BCP-47 语言标签（如 `zh-CN`、`en-US`） |
| `voiceURI` | 唯一标识 |
| `default` | 是否系统默认语音 |
| `localService` | 是否本地引擎（false 表示云端） |

选定后赋给 utterance：

```javascript
utterance.voice = voices.find((v) => v.lang === "zh-CN");
```

## 第一个 STT：让网页听写

```javascript
// 兼容 webkit 前缀
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("当前浏览器不支持语音识别，请用 Chrome / Edge / Safari。");
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.continuous = false;     // 单次识别
  recognition.interimResults = true;  // 返回中间结果
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    // event.results 是 SpeechRecognitionResultList
    const last = event.results[event.results.length - 1];
    const transcript = last[0].transcript;   // 识别文字
    const confidence = last[0].confidence;   // 置信度 0-1
    console.log(`"${transcript}" (置信度 ${confidence})`);
  };

  recognition.onerror = (e) => console.error("识别错误：", e.error);
  recognition.onend = () => console.log("识别结束");

  recognition.start(); // 必须由用户手势触发
}
```

### 关键属性详解

| 属性 | 默认 | 含义 |
| --- | --- | --- |
| `lang` | 浏览器默认 | BCP-47 语言（如 `zh-CN` / `en-US`），决定识别语言 |
| `continuous` | `false` | `false` 单次（用户停顿即结束）；`true` 持续识别直到 `stop()` |
| `interimResults` | `false` | 是否返回实时中间结果（partial） |
| `maxAlternatives` | `1` | 每个结果返回多少候选（按置信度排序） |
| `grammars` | - | **已废弃**，设置无效，仅向后兼容保留 |

### result 事件结构

```javascript
recognition.onresult = (event) => {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];           // SpeechRecognitionResult
    const isFinal = result.isFinal;            // 是否最终结果
    for (let j = 0; j < result.length; j++) {
      const alt = result[j];                   // SpeechRecognitionAlternative
      console.log(alt.transcript, alt.confidence);
    }
  }
};
```

## 浏览器兼容性

### SpeechSynthesis（TTS）—— Baseline 广泛支持

| 浏览器 | 状态 |
| --- | --- |
| Chrome / Edge | 全支持 |
| Firefox | 全支持 |
| Safari | 全支持（iOS Safari 7+） |
| Samsung Internet | 全支持 |

2018 年 9 月起跨主流浏览器可用，可放心用于生产。

### SpeechRecognition（STT）—— Limited availability

| 浏览器 | 状态 | 备注 |
| --- | --- | --- |
| Chrome | 支持（`webkit` 前缀） | 云端识别引擎，音频上传 Google |
| Edge | 支持（`webkit` 前缀） | 同 Chromium 内核 |
| Safari | 14.1+ 支持（`webkit` 前缀） | 功能不如 Chrome 完整 |
| Opera | 支持 | Chromium 内核 |
| Samsung Internet | 支持 | |
| **Firefox** | **默认禁用** | 需 `about:config` 开 `media.webspeech.recognition.enable` + `force_enable`，实验性 |

> Chrome 的识别是**服务器端引擎**：MDN 明确指出「using Speech Recognition on a web page involves a server-based recognition engine. Your audio is sent to a web service for recognition processing, so it won't work offline.」

## 安全上下文与权限

- SpeechRecognition 必须运行在**安全上下文**（HTTPS 或 `localhost`），否则 API 不可用
- 需用户授予**麦克风权限**，首次调用 `start()` 时浏览器弹出授权提示
- 受 `Permissions-Policy` 的 `microphone` 指令控制；可在 iframe 通过 `allow="microphone"` 开启
- `start()` 必须由**用户手势**（点击/按键）触发，不能页面加载即自动启动

## 连续识别（听写模式）

```javascript
const recognition = new webkitSpeechRecognition();
recognition.lang = "zh-CN";
recognition.continuous = true;   // 持续
recognition.interimResults = true;

let finalTranscript = "";
recognition.onresult = (event) => {
  let interim = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcript;
    } else {
      interim += transcript;
    }
  }
  document.querySelector("#final").textContent = finalTranscript;
  document.querySelector("#interim").textContent = interim;
};

// Chrome 连续模式会因网络抖动自行 end，需要自动重启
recognition.onend = () => {
  if (shouldKeepListening) recognition.start();
};

recognition.start();
```

## 已废弃的 SpeechGrammar 陷阱

早期规范定义了 `SpeechGrammar` / `SpeechGrammarList`，用于指定 JSGF 语法定义识别范围。**MDN 明确说明：grammar 概念已从 Web Speech API 中移除**，相关接口仅为向后兼容保留，调用后对识别服务**没有任何效果**。

```javascript
// 以下代码无害但无效 —— 不要依赖它来约束识别范围
const grammar =
  "#JSGF V1.0; grammar colors; public <color> = red | green | blue ;";
const speechRecognitionList = new webkitSpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList; // 已废弃，无效
```

陷阱：许多老旧教程仍在教 `SpeechGrammarList`，误以为能做「指令识别」（只听固定词表）。实际上现代浏览器忽略它，要实现有限词表仍需自己在 `onresult` 中做字符串匹配或正则过滤。

## TTS + STT 组成语音助手

```javascript
async function voiceAssistant() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;

  recognition.onresult = async (event) => {
    const userText = event.results[0][0].transcript;
    // 调 LLM 拿回复
    const reply = await callLLM(userText);
    // 朗读回复
    const u = new SpeechSynthesisUtterance(reply);
    u.lang = "zh-CN";
    window.speechSynthesis.speak(u);
  };

  recognition.start();
}
```

这是浏览器内零成本语音助手的典型骨架（识别依赖 Chrome 云端）。

## 下一步

- [指南](./guide-line) —— 连续听写 / Chrome 长文本 Bug 规避 / 跨浏览器降级 / vs Whisper API 选型 / 语音指令实现
- [参考](./reference) —— 全部接口 / 属性 / 事件 / 错误码 / 兼容性详表
