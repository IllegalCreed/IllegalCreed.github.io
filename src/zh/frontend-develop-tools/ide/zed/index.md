---
layout: doc
---

# Zed

用 **Rust 从零编写、GPU 渲染**的高性能代码编辑器，内置实时协作与 AI，免费开源。

## 评价

### 优点

- **Rust + GPUI**（GPU 加速 UI），原生应用而非 Electron，启动快、输入延迟低
- **实时多人协作**（频道 / 通话 / 项目共享）与 **AI**（Agent Panel / Edit Prediction）原生内置，无需扩展
- **Multibuffer**：一个视图同时编辑多文件片段，大规模重构利器
- 免费开源（GPL/AGPL）；默认即 VS Code keymap，迁移成本低

### 缺点

- 扩展生态远小于 VS Code，且扩展是 **Rust→WASM**（不能跑任意 JS），能力受限
- **无 `.code-workspace` 等价物**（打开文件夹即项目上下文）
- 部分语言的高级支持/调试仍在完善
- 共享项目会让协作者访问你本地文件系统，需只与信任的人协作

## 文档地址

[Zed](https://zed.dev/docs)

## GitHub地址

[Zed](https://github.com/zed-industries/zed)

## 幻灯片地址

<a href="/SlideStack/zed-slide/" target="_blank">Zed</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=zed" target="_blank" rel="noopener noreferrer">Zed 测试题</a>
