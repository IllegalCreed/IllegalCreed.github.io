---
layout: doc
---

# Cursor

基于 VS Code 构建的 **AI 原生代码编辑器**，以 Tab 预测补全与 Agent 自主编程为核心。

## 评价

### 优点

- AI 深度原生：Tab 预测、Cmd+K 内联编辑、Agent 多文件自主开发一体整合
- 是 VS Code 的 fork，扩展 / 主题 / 快捷键 / 设置可**一键导入**，迁移成本极低
- 代码库**语义索引**，AI 能理解整个项目而非单文件
- 模型丰富（自研 Composer + Claude / GPT / Gemini / Grok 等），Auto / Max 模式按需取舍
- 2026 AI 编辑器流行度第一梯队（Stack Overflow 约 18%、百万级日活）

### 缺点

- 扩展走 **Open VSX** 注册表而非微软官方 Marketplace，部分扩展缺失或行为不同
- 闭源商业产品，核心 AI 按 token / 额度计费，重度使用成本可观
- 隐私：AI 功能需把代码上下文发往模型提供商（隐私模式 + ZDR 可缓解）
- 跟随 VS Code 上游但存在版本滞后

## 文档地址

[Cursor](https://cursor.com/docs)

## GitHub地址

[Cursor](https://github.com/getcursor/cursor)（主程序闭源，此为官方 issue 跟踪仓库）

## 幻灯片地址

<a href="/SlideStack/cursor-slide/" target="_blank">Cursor</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=cursor" target="_blank" rel="noopener noreferrer">Cursor 测试题</a>
