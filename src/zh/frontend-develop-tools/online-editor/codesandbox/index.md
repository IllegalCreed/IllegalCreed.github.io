---
layout: doc
---

# CodeSandbox

为规模而生的云沙箱平台——核心是服务端 **Firecracker microVM**，能编程式拉起隔离虚拟机即时执行代码：跑任意 Dockerfile、原生二进制、连真实 Postgres/Redis/Mongo，快照恢复在秒级。早期作为「浏览器内打包器 + 前端原型分享」起家（今天仍以 Browser Sandboxes 保留），2024-12 被 Together AI 收购后重心转向「**AI agent 代码执行基础设施 + 云沙箱 SDK**」。同时维护开源嵌入组件库 **Sandpack**（React 官方文档采用），用于在网页内嵌入实时运行的代码示例。

## 评价

**优点**

- 核心是服务端真 Linux 虚拟机（Firecracker microVM），能力上限远高于浏览器内方案：任意语言 / 任意 Dockerfile / 原生二进制 / 连真实数据库（Postgres·Redis·Mongo）
- **CodeSandbox SDK** 可编程式批量拉起、连接、休眠、恢复沙箱，专为 AI agent 执行不受信任代码设计；快照恢复 < 1s、克隆 < 2s
- 内存快照 hibernation / resume 完整保留整机状态，会话结束休眠、需要时秒级唤醒，天然适配 CI/CD 与高并发调用
- 跑在网页版 VS Code（VS Code for the web）上，任意浏览器即可用，算力在云端
- 开源 **Sandpack**（`@codesandbox/sandpack-react`）把「实时代码编辑 + 预览」做成可拆解的 React 组件，深度可定制，文档 / 博客内联示例首选
- GitHub / git / CodeSandbox SCM 源码集成，Live 协作、私有项目、私有 NPM 等团队能力齐全

**缺点**

- 核心 VM 算力放在云端，按 **VM credits**（VM 运行时长）计费，不像浏览器内方案那样零服务器成本；重度使用需关注 credit 消耗
- 免费档（Build）只给 **SDK lite**，并发 VM Sandboxes 上限 10，完整 SDK 与高并发要升到付费档（Scale 起）
- 产品定位与定价近年大幅重构（收购后转向 AI agent 执行），旧的 Devboxes / CDE 营销叙事已淡出，老资料容易过时
- VM Sandboxes 在云端运行，断网即断（仅 Browser Sandboxes 例外，可本地继续打包）
- 套餐金额与档位会调整，需以官网 pricing 为准

## 文档地址

[CodeSandbox](https://codesandbox.io/docs)

## GitHub地址

[Sandpack](https://github.com/codesandbox/sandpack)

## 幻灯片地址

<a href="/SlideStack/codesandbox-slide/" target="_blank">CodeSandbox</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=codesandbox" target="_blank" rel="noopener noreferrer">CodeSandbox 测试题</a>
