---
layout: doc
---

# 网络分层模型

网络通信极其复杂——从应用数据到电信号，要经过寻址、路由、可靠传输、编码等无数环节。**分层**是驾驭这种复杂度的核心思想：把大问题切成职责单一、可独立演进的若干层。业界有两套模型：**OSI 七层**是理论上的「参考模型」（教学与排障的通用语言），**TCP/IP 四层**是互联网实际运行的事实标准。本叶讲清为什么要分层、OSI 与 TCP/IP 各层职责、数据如何逐层封装/解封装、常见协议与设备归在哪一层，最后用一个 HTTP 请求的端到端旅程把全章串起来。

## 概述

- **为什么分层**：分而治之、职责单一、各层独立演进；下层为上层提供服务，对等层之间用协议通信。
- **OSI 七层**（参考模型）：物理 / 数据链路 / 网络 / 传输 / 会话 / 表示 / 应用——自下而上。
- **TCP/IP 四层**（事实标准）：网络接口 / 网际（IP）/ 传输（TCP·UDP）/ 应用；五层教学模型把网络接口拆为物理 + 数据链路。
- **封装/解封装**：发送方自顶向下逐层加首部（段 → 包 → 帧 → 比特），接收方自底向上逐层剥首部。
- **端到端规律**：MAC 逐跳重写、IP 端到端不变；交换机看 MAC（二层）、路由器拆 IP（三层）逐跳转发。

## 本叶地图

- [入门](./getting-started) —— 分层全景，OSI 与 TCP/IP 两套模型
- [为什么要分层](./guide-line/why-layering) —— 分层思想、协议栈、服务与接口、分层的代价
- [OSI 七层逐层职责](./guide-line/osi-seven-layers) —— 七层职责、PDU、典型协议与设备、记忆法
- [TCP/IP 四层与五层教学模型](./guide-line/tcpip-five-layer) —— 四层职责、与 OSI 映射、为何是事实标准
- [数据封装与解封装](./guide-line/encapsulation) —— 逐层加头、PDU 名称、首部/载荷、MTU 分片
- [两模型对照与协议归层](./guide-line/model-comparison) —— 三模型对照、协议归层、设备归层、ARP 争议
- [一个 HTTP 请求穿越协议栈的端到端旅程](./guide-line/end-to-end-journey) —— DNS→TCP→TLS→HTTP，封装与逐跳转发
- [参考](./reference) —— 三模型对照 + 协议/设备归层 + 封装 PDU + 权威链接

## 文档地址

- [Cloudflare: OSI 模型](https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/)
- [Wikipedia: OSI model](https://en.wikipedia.org/wiki/OSI_model) · [Internet protocol suite](https://en.wikipedia.org/wiki/Internet_protocol_suite)
- [RFC 1122: Host Requirements](https://www.rfc-editor.org/rfc/rfc1122) · [MDN: Protocol](https://developer.mozilla.org/en-US/docs/Glossary/Protocol)

## 幻灯片地址

<a href="/SlideStack/net-layering-slide/" target="_blank">网络分层模型</a>
