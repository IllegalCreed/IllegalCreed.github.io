---
layout: doc
---

# Web Storage API

Web Storage API 是浏览器里最简单的键值存储：一个 **Storage 接口**（`getItem` / `setItem` / `removeItem` / `clear` / `key` 五方法加 `length` 一属性）、两个实例（**`window.localStorage`** 按源共享且持久、**`window.sessionStorage`** 按页签隔离且关页即清），外加一个跨文档广播的 **storage 事件**。它不是独立规范，而是定义在 **WHATWG HTML 标准**的 Web storage 章；自 2015-07 起 Baseline Widely available，**全绿十几年、API 形态零演进包袱**——这既是"随手可用"的底气，也意味着**只存字符串、同步阻塞**这些先天设定被永久锁死。本叶聚焦它的 **API 编程面**：方法语义与边界、storage 事件、序列化陷阱、异常处理、工程封装；隔离模型、选型对比、配额驱逐、存储分区等机制问题统一归[浏览器章存储叶](/zh/base/browser/browser-storage/guide-line/web-storage-model)，本叶只链接、不重复展开。

## 评价

**优点**

- **零门槛**：不开数据库、无 Promise、无事务，两行代码完成持久化——浏览器里心智负担最小的存储 API
- **全绿十几年**：2015-07 起 Baseline Widely available，无版本碎片、无 polyfill 负担，一次学会终身有效
- **storage 事件自带跨页签广播**：localStorage 一处修改、同源其他页签即时收到，多页签登出/主题同步不需要任何库
- **sessionStorage 的"页签隔离 + 关页即焚"语义独一份**：表单草稿、向导步骤这类单页签临时态没有更贴切的原生容器
- **调试友好**：DevTools Application 面板直接可视化增删改查，问题一眼可见

**局限**

- **只存字符串**：对象全靠 JSON 往返，`undefined`、`Date`、`Map`、循环引用各有丢形或抛错的姿势（[序列化页](./guide-line/serialization-exceptions)专讲）
- **同步 API 阻塞主线程**：大值、高频写是实打实的卡顿来源，且 Worker / Service Worker 里完全不可用
- **约 5 MiB 独立小池**：超限时 `setItem` 同步抛 `QuotaExceededError`，写操作必须 try-catch（配额口径见[浏览器章](/zh/base/browser/browser-storage/guide-line/quota-eviction)）
- **裸 API 什么都不管**：无过期、无命名空间、无类型约束，TTL/前缀/泛型/迁移全要自己封装（[模式页](./guide-line/patterns)给全套）
- **XSS 可直接读**：同源脚本一行代码读光所有键值，敏感凭证禁入（该进 HttpOnly Cookie）

一句话选型：**小体量、结构扁平、同步读写无压力的偏好类数据，Web Storage 仍是最顺手的答案**；结构化、大体量、要进 Worker 的数据直接上 [IndexedDB](/zh/web-advanced/web-api/indexeddb/)。完整选型矩阵见[浏览器章存储全景](/zh/base/browser/browser-storage/guide-line/storage-overview)。

## 本叶地图

- [入门](./getting-started) —— 一分钟上手五方法一属性、localStorage vs sessionStorage 两种生命周期、第一天要建立的条件反射、与浏览器章的分工地图
- [API 与事件全解](./guide-line/api-and-events) —— 六成员精确语义与边界、遍历与批量删除模式、属性式访问的原型遮蔽坑、storage 事件触发规则与五字段 null 语义、跨页签通信实战
- [序列化与异常处理](./guide-line/serialization-exceptions) —— 只存字符串的自动转换真相、JSON 往返丢形清单、getItem 的 null 防御、QuotaExceededError 处理、Safari 隐私模式历史坑 vs 现状、storageAvailable 特性检测
- [封装模式与工程实践](./guide-line/patterns) —— 带 TTL 的过期封装、命名空间前缀、TypeScript 泛型包装、版本迁移、同步性能姿势、SSR 守卫、何时升级 IndexedDB
- [参考](./reference) —— API 表 / storage 事件字段表 / 序列化边界表 / local vs session 对比 / 易错点清单 / 资源链接

## 文档地址

[MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

## GitHub 地址

[whatwg/html](https://github.com/whatwg/html)（Web Storage 无独立规范仓库，定义于 HTML 标准 [Web storage 章](https://html.spec.whatwg.org/multipage/webstorage.html)）

## 幻灯片地址

<a href="/SlideStack/web-storage-slide/" target="_blank">Web Storage API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=web-storage-api" target="_blank" rel="noopener noreferrer">Web Storage API 测试题</a>
