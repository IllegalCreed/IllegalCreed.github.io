---
layout: doc
---

# Web Speech API

**浏览器原生的语音交互接口**——由 W3C WebAudio Community Group 起草，分为两大独立模块：**SpeechSynthesis（文字转语音 TTS）**让网页朗读文本，**SpeechRecognition（语音转文字 STT）**让网页听懂用户说话。无需安装任何 SDK 或插件，直接用 JavaScript 调用 `window.speechSynthesis` 与 `SpeechRecognition`（Chrome/Edge 中需带 `webkit` 前缀）即可。

两个模块的成熟度差异显著：SpeechSynthesis 已是 Baseline「Widely available」（2018 年 9 月起全主流浏览器支持），而 SpeechRecognition 仍是「Limited availability」——Chromium 系（Chrome/Edge/Opera）和 Safari（14.1+，带 `webkit` 前缀）原生支持，**Firefox 默认不启用**，需在 `about:config` 手动打开 `media.webspeech.recognition.enable` / `force_enable` 两个实验开关。

关键注意点：Chrome 的识别是**服务器端引擎**（音频上传至 Google 云端处理，离线不可用），且必须运行在 HTTPS（或 localhost）安全上下文并取得麦克风权限；**`SpeechGrammar` / `SpeechGrammarList` 已从规范移除**，浏览器仅为向后兼容保留接口但实际不再生效。在跨浏览器/离线/高精度场景，通常改用第三方方案（OpenAI Whisper API、AssemblyAI、浏览器 WASM 版 whisper.cpp 等）。

## 评价

**优点**

- **零依赖原生**：浏览器内置，无需引入第三方 SDK 或付费 API key
- **TTS 覆盖全**：SpeechSynthesis 全主流浏览器支持（Baseline），可直接调用系统自带语音
- **低延迟 STT**：SpeechRecognition 在 Chrome/Edge 上接近实时返回 interim 中间结果
- **API 简洁**：几十行 JS 即可完成「说话→文字」「文字→朗读」闭环
- **隐私可控**：TTS 完全本地执行，不上传任何数据
- **可组合**：与 LLM、WebRTC、Canvas 等无缝组合，构建语音助手/无障碍/教育应用

**缺点**

- **STT 兼容性差**：Firefox 默认不支持，Safari 需前缀且功能不完整
- **Chrome STT 依赖云**：音频上传服务器，离线不可用、有隐私与合规顾虑
- **已废弃 Grammar 陷阱**：`SpeechGrammarList` 仍存在于 API 但无效，容易误导开发者
- **TTS 音色受限**：只能用系统预装语音，音质/自然度不如商业 TTS（Azure/ElevenLabs）
- **长文本 Bug**：Chrome 的 `speechSynthesis` 在长文本时存在约 15 秒自动暂停的历史缺陷，需手动分句 resume
- **无进度回传**：识别置信度、说话人分离等高级能力缺失

## 文档地址

- MDN Web Speech API 总览：[developer.mozilla.org/Web/API/Web_Speech_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- SpeechSynthesis：[developer.mozilla.org/Web/API/SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- SpeechRecognition：[developer.mozilla.org/Web/API/SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- W3C 规范草案（WebAudio Community Group）：[webaudio.github.io/web-speech-api](https://webaudio.github.io/web-speech-api/)
- 使用指南：[Using the Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)

## GitHub地址

- 规范仓库（WICG）：[github.com/WICG/speech-api](https://github.com/WICG/speech-api)
- MDN 浏览器兼容数据：[github.com/mdn/browser-compat-data](https://github.com/mdn/browser-compat-data)

## 幻灯片地址

<a href="/SlideStack/web-speech-api-slide/" target="_blank">Web Speech API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=web-speech-api" target="_blank" rel="noopener noreferrer">Web Speech API 测试题</a>
