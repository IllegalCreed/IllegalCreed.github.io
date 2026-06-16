---
layout: doc
---

# Kiro

AWS 推出的 **spec-driven（规格驱动）agentic IDE**，把工程严谨性带入 AI 编码；提供 IDE / CLI / Web 三形态。

## 评价

### 优点

- **spec-driven**：从需求生成 `requirements / design / tasks` 三份**可版本化文档**，再据此实现
- **Agent Hooks**：事件触发 agent（如保存文件）自动生成测试 / 文档 / 安全扫描
- **Steering**：用 markdown 持久引导 agent（product / tech / structure + 四种 inclusion mode）
- 弥合「vibe coding → production」，补足未文档化假设、需求符合性、系统设计可见性
- 基于 Code OSS，可导入 VS Code 设置，支持 Open VSX 插件

### 缺点

- 流程偏重（规格驱动有学习成本），不如 chat-driven 轻快
- 扩展走 **Open VSX** 而非微软 Marketplace
- 与 AWS 生态结合，部分能力面向 AWS 用户
- 模型版本/配额随更新变动

## 文档地址

[Kiro](https://kiro.dev/docs)

## GitHub地址

[Kiro](https://kiro.dev)（闭源，无公开源码仓库）

## 幻灯片地址

<a href="/SlideStack/kiro-slide/" target="_blank">Kiro</a>
