---
layout: doc
---

# 操作系统安全与保护

操作系统**安全与保护（OS Security & Protection）**研究的是如何在**同一台机器**上让多个互不信任的程序"和平共处"——既能共享 CPU、内存、文件，又不能互相窥探、篡改或越权。它由两条主线交织：①**保护（Protection）**是机制层，回答"如何用硬件 + OS 机制实现隔离与权限"，典型如特权级（Ring 0/3）、虚拟内存隔离、访问控制表（ACL）、能力（capability）；②**安全（Security）**是策略层，回答"系统应该让谁能做什么、如何认证他是谁"，典型如身份认证、最小权限原则、信任链。两者关系是：**保护机制提供隔离的"墙"，安全策略决定墙上开哪些门。**

操作系统安全的全部考点围绕**三条主线**展开：①**安全目标**——CIA 三要素（机密性 Confidentiality / 完整性 Integrity / 可用性 Availability），这是所有安全设计的终极目标；②**隔离与访问控制机制**——特权级（用户态/内核态）、地址空间隔离、ACL 与 capability 两类权限模型、Unix 的 rwx 与 sudo、身份认证；③**典型攻击与防御**——缓冲区溢出（覆盖返回地址执行 shellcode）及其缓解（ASLR 地址随机化、DEP/NX 数据不可执行、Stack Canary 栈金丝雀、CFI 控制流完整性）、最小权限原则、推测执行侧信道（Meltdown/Spectre）、恶意软件防护。本叶是 OS 层的隔离防护，**不涉及网络层加密/TLS**（归网络安全章）——只讲"OS 内部的墙与门"。

## 评价

**优点**

- **硬件级隔离**：特权级（Ring 0/3）+ 虚拟内存让进程天然隔离，应用崩溃不波及系统
- **细粒度权限**：ACL/capability/Unix rwx 三种模型覆盖"按对象"与"按主体"两类授权需求
- **纵深防御**：ASLR + DEP + Canary + CFI 多层缓解叠加，单层被攻破不致全盘失守
- **可审计可追溯**：身份认证 + 权限审计 + 日志，让操作可回溯追责

**缺点**

- **安全 vs 性能矛盾**：KPTI（Meltdown 缓解）让 syscall 多切一次页表，开销涨 5-30%；ASLR 增加载入重定位
- **机制不能防人**：再强的 ACL 也防不住用户把密码写在便签上，社会工程学绕过一切技术防护
- **攻击面永远存在**：特权指令、推测执行、共享缓存都成了侧信道入口，防御总在追赶攻击
- **复杂度爆炸**：一个现代 Linux 的 SELinux 策略有数万条规则，难以审计与正确配置

## 本叶地图

- [入门](./getting-started) —— 安全目标 CIA 三要素、保护与安全的区别、信任域（用户态/内核态）、最小权限原则
- [访问控制与身份认证](./guide-line/access-control) —— 访问控制矩阵、ACL（按对象）与 capability（按主体）对比、Unix rwx/sudo、身份认证（口令/双因素）
- [缓冲区溢出与防御](./guide-line/attacks) —— 缓冲区溢出攻击原理、ASLR/DEP/Canary/CFI 四大缓解、Meltdown/Spectre 推测执行侧信道
- [参考](./reference) —— ACL vs capability 对比、防御机制速查、Unix 权限速查、易错点

## 幻灯片地址

<a href="/SlideStack/os-security-slide/" target="_blank">操作系统安全与保护</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F%E5%AE%89%E5%85%A8%E4%B8%8E%E4%BF%9D%E6%8A%A4" target="_blank" rel="noopener noreferrer">操作系统安全与保护测试题</a>
