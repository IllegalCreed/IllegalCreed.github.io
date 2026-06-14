---
layout: doc
---

# Nano ID

::: tip 本篇范围
本篇聚焦 **nanoid**——一个极小、安全、URL 友好的唯一字符串 ID 生成器。重点在：**默认 21 字符 + 64 个 URL 安全字母表**的设计、用**加密随机源**（`crypto` / Web Crypto）而非 `Math.random()`、`nanoid(size)` 自定义长度、`customAlphabet` 自定义字母表、`customRandom` 替换随机源、`nanoid/non-secure` 非加密版、碰撞概率与长度/字母表的权衡，以及与 **UUID（v4 / v7）** 的体积/速度/可读性对比。版本基线 **nanoid 5**（当前最新 5.1.x，**纯 ESM**），并在关键处点明 **3.x ↔ 5.x 差异**。
:::

nanoid 由 **Andrey Sitnik**（也是 PostCSS、Autoprefixer 作者）发起，官方一句话定位是「**A tiny, secure, URL-friendly, unique string ID generator for JavaScript**」——一个极小、安全、URL 友好的唯一字符串 ID 生成器。它的三个卖点：**小**（核心代码 118 字节，min+brotli，零依赖，约为 uuid v4 的四分之一）、**安全**（默认用不可预测的硬件随机源，而非可被预测的 `Math.random()`）、**URL 友好**（默认字母表只含 `A-Za-z0-9_-`，可直接放进 URL、文件名、HTML id 而无需转义）。

理解 nanoid 的关键是它的**熵模型**：ID 的随机性 ≈ `log2(字母表大小) × 长度`。默认用 64 个符号、长度 21，约携带 **126 位随机性**，与 UUID v4 的 122 位相当——也就是说它在更短的字符串里塞进了同等的抗碰撞能力。**2026 年的现状**：主版本已是 **nanoid 5**，是**纯 ESM 包**（`"type": "module"`，exports 不含 `require` 条件）；早期的 `nanoid/async`、`nanoid/url-alphabet` 子入口已被移除（`urlAlphabet` 改从主入口具名导出）；仍需 CommonJS（`require`）的项目应停留在维护中的 **nanoid 3.x**。

## 评价

**优点**

- **体积极小**：核心代码 118 字节（min+brotli）、零依赖，是 bundle 敏感场景的理想选择（对比 uuid v4 的 423 字节）
- **默认安全**：用 `crypto`（Node）/ Web Crypto（浏览器）的硬件随机源，避免 `Math.random()` 可预测带来的猜解风险
- **URL 友好**：默认字母表 `A-Za-z0-9_-`，可直接进 URL/文件名/DOM id，无需转义
- **分布均匀**：内部用拒绝采样避免 `random % alphabet` 的模偏置，并「tested for uniformity」
- **灵活可定制**：`nanoid(size)` 改长度、`customAlphabet` 换字母表、`customRandom` 换随机源，一应俱全
- **多端通用**：通过 conditional exports 自动适配 Node / 浏览器 / React Native，自带 TS 类型，支持 `npx nanoid` CLI
- **可摇树**：`"sideEffects": false`，未用到的导出可被 tree-shake

**缺点**

- **纯随机、不可按时间排序**：默认 ID 不含时间戳，不适合「主键时间有序 / 索引写入局部性」的需求（那类应选 UUID v7 / ULID）
- **5.x 纯 ESM 的迁移摩擦**：CommonJS 项目不能直接 `require`，且 Jest 等默认 CJS 工具链常遇 ESM 解析报错（需转译或用 3.x）
- **短 ID 的碰撞风险易被低估**：缩短长度或缩小字母表会大幅降熵，需用碰撞计算器评估并配唯一约束兜底
- **默认字母表含 `-` 和 `_`**：可能以 `-` 开头被 CLI 误判为 flag、以 `_` 开头不满足 CouchDB `_id` 约定，需 `customAlphabet` 或加前缀规避
- **non-secure 版安全弱**：`nanoid/non-secure` 用 `Math.random()`，只能用于非敏感场景，误用在 token/会话 ID 上有安全隐患

## 文档地址

[Nano ID（GitHub README）](https://github.com/ai/nanoid)

## GitHub 地址

[ai/nanoid](https://github.com/ai/nanoid)

## 幻灯片地址

<a href="/SlideStack/nanoid-slide/" target="_blank">Nano ID</a>
