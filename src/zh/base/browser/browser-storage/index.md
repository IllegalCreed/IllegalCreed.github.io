---
layout: doc
---

# 浏览器存储

前端的数据从来不是「存进 localStorage」一句话的事：Cookie、localStorage、sessionStorage、IndexedDB、Cache API、OPFS 六种机制并存，容量从单条 4KB 到数百 GB 差着五六个数量级，生命周期从「关标签页即焚」到「用户手动清除才消失」，有的还要随每个 HTTP 请求上行。这一叶专讲**浏览器视角下的存储模型**——数据存在哪、能存多大、什么时候会被浏览器清掉、源与站点之间如何隔离——帮你回答「这份数据该放哪」的选型题，而不是逐个教 API：localStorage/IndexedDB 的完整用法归 Web API 章（待产出）；Cookie 的语义与会话方案见 [Cookie 与会话管理](/zh/base/network/net-http-basics/guide-line/cookies-sessions)；HTTP 缓存与 Service Worker 的 Cache API 实战归兄弟叶[浏览器缓存](../browser-cache/)。

## 概述

- **六种机制、一套心智**：按「容量 / 同步异步 / 生命周期 / 是否随请求发送 / Worker 可达性」五个维度横向切开，一张选型矩阵回答「什么数据放哪」。
- **web.dev 官方立场**：加载应用所需的网络资源用 **Cache API**、文件类内容用 **OPFS**、其余数据用 **IndexedDB**——三者全异步不阻塞主线程；**localStorage 同步阻塞应避免，Cookie 不当存储用**。
- **配额是共享的**：IndexedDB/Cache API/OPFS 共用**源级配额**（Chrome 单源可达磁盘 60%），Web Storage 独立限 **~5 MiB**；`navigator.storage.estimate()` 可查用量与上限。
- **数据会被清掉**：best-effort 桶在存储压力下按 **LRU 整源驱逐**；Safari ITP 更狠——**7 天不交互清空全部脚本可写存储**（已安装 PWA 豁免）；`navigator.storage.persist()` 才能要到持久承诺。
- **隔离在收紧**：第三方 iframe 里的存储已按**顶级站点分区**（Chrome 115 / Firefox 103 默认开启），嵌入场景下「同一个源」不再等于「同一份数据」。

## 本叶地图

- [入门](./getting-started) —— 存储机制全景、选型失误的真实代价、与 Web API 章/网络章的分工
- [存储全景与选型矩阵](./guide-line/storage-overview) —— 六机制五维对比大表、web.dev 官方选型立场与决策清单
- [Cookie 的浏览器侧](./guide-line/cookie-browser-side) —— document.cookie 读写与坑、单条 ~4KB、随请求发送的代价、HttpOnly 不可读
- [Web Storage 存储模型](./guide-line/web-storage-model) —— 源隔离 vs 标签页隔离、同步阻塞、storage 事件、无痕退化、noopener 复制规则
- [IndexedDB 定位与 OPFS](./guide-line/indexeddb-opfs) —— 异步事务型对象库、结构化克隆能存什么、OPFS 同步句柄与 SQLite-wasm
- [配额与驱逐](./guide-line/quota-eviction) —— estimate()/persist()、各浏览器配额数值、LRU 驱逐、Safari 7 天清库
- [存储分区与 Storage Buckets](./guide-line/partitioning-buckets) —— 三方 iframe 按顶级站点分区、对嵌入组件的影响、一源多桶独立驱逐
- [参考](./reference) —— 六机制对比/配额数值/驱逐规则/Storage API 方法速查表

## 文档地址

- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) · [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) · [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) · [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [web.dev: Storage for the web](https://web.dev/articles/storage-for-the-web)

## 幻灯片地址

<a href="/SlideStack/browser-storage-slide/" target="_blank">浏览器存储</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%B5%8F%E8%A7%88%E5%99%A8%E5%AD%98%E5%82%A8" target="_blank" rel="noopener noreferrer">浏览器存储 测试题</a>
