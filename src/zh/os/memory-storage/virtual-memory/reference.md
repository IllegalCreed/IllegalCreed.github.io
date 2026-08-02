---
layout: doc
outline: [2, 3]
---

# 参考：分页、分段与虚拟内存速查

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **虚拟内存**：每个进程独享连续私有地址空间，靠 MMU + 页表翻译成物理地址。隔离 + 超售 + 按需。
- **分页**：固定大小页（4KB）/帧，页表映射页号→帧号。无外部碎片，有**内部碎片**（最后一页浪费）。
- **分段**：可变大小逻辑段（代码/数据/栈）。符合程序结构，有**外部碎片**（空闲块零碎）。
- **页表项 PTE**：物理帧号 + Present/R/W/U/S/Dirty/Accessed 位。Present=0 触发缺页。
- **多级页表**：分级（x86-64 四级），只为用到的地址建表，省内存；代价是翻译多次，靠 TLB 缓存。
- **TLB**：CPU 内页表项缓存，命中 1 周期，miss 查多级页表。命中率 >99% 是性能关键。大页/PCID 优化。
- **缺页中断**：Present=0 → fault → 内核读磁盘补页 → 重新执行指令。慢（毫秒级，5 万倍内存）。
- **置换算法**：FIFO（可能 Belady）、LRU（最优实用近似，需硬件）、OPT（理论下界，不可实现）、Clock（LRU 廉价近似，主流）。
- **Belady 异常**：FIFO 特有，帧增多缺页反增。LRU/OPT 是栈式算法不会异常。
- **抖动**：内存不足频繁缺页，CPU 全在换页。工作集模型指导帧分配。

## 一、分页 vs 分段对比

| 维度 | 分页（Paging） | 分段（Segmentation） | 段页式（Paged Seg） |
| --- | --- | --- | --- |
| 划分单位 | 固定大小页（4KB） | 可变大小逻辑段 | 先分段，段内再分页 |
| 碎片类型 | **内部碎片** | **外部碎片** | 内部（页内）碎片，无外部 |
| 程序员可见 | 不可见（透明） | 可见（段寄存器/段选择子） | 段可见、页透明 |
| 地址结构 | VPN + offset | 段号 + 段内偏移 | 段号 + 段内页号 + offset |
| 翻译 | 查页表（一级或多级） | 段基址 + 偏移 | 查段表 + 段内查页表 |
| 共享 | 按页共享（粒度小） | 按段共享（粒度大，如代码段） | 二者皆可 |
| 现代 OS | **主流**（Linux/Windows 纯分页） | 淘汰（x86 flat 模式关闭） | 教科书概念，工程少用 |
| 优点 | 无外部碎片、透明、易调页 | 符合逻辑、易共享保护 | 结合两者优点 |
| 缺点 | 内部碎片 | 外部碎片（需紧凑，代价大） | 翻译两层，复杂 |

## 二、页面置换算法对比

| 算法 | 淘汰依据 | 实现复杂度 | 是否 Belady | 需硬件支持 | 实用性 | 代表场景 |
| --- | --- | --- | --- | --- | --- | --- |
| **FIFO** | 最先装入 | O(1) 队列 | **会** | 否 | 少用 | 教学/简单系统 |
| **LRU** | 最久未访问 | O(n)（栈/计数器） | 不会 | **需**（时间戳） | 金标准 | 数据库（近似） |
| **最优 OPT** | 未来最久不用 | O(n)（需预知） | 不会 | 不可实现 | 评估基准 | 离线分析 |
| **Clock** | A=0（二次机会） | O(n) 均摊 | 不会 | Accessed 位 | **主流** | Linux/Windows |
| **LFU**（参考） | 访问次数最少 | O(log n)（堆） | 会 | 计数器 | 较少 | 偶尔配合 |

- **缺页率排序**（一般地）：OPT < LRU ≈ Clock < FIFO。OPT 是下界，LRU 接近 OPT，FIFO 最差。
- **栈式算法**：LRU/OPT 满足"n 帧驻留集 ⊆ n+1 帧驻留集"，故帧多缺页必不增（无 Belady）。FIFO 不满足。
- **工业实践**：Linux 用 active/inactive 双链表 + 引用位（Clock 改进）；Windows 类似。纯 LRU 极少精确实现（硬件成本高）。

## 三、地址转换计算模板

**通用步骤**（给定页大小、页表、虚拟地址，求物理地址）：

```
1. 计算页内偏移位数：offset_bits = log2(页大小)
   例：4KB → 12 位；8KB → 13 位；64KB → 16 位；2MB → 21 位。

2. 拆虚拟地址：
   offset = 虚拟地址 & (页大小 - 1)        （低 offset_bits 位）
   VPN    = 虚拟地址 >> offset_bits          （高位）

3. 查页表得 PFN：
   PFN = 页表[VPN].物理帧号
   若 页表[VPN].Present = 0 → 缺页中断
   若 VPN 越界 → 段错误（SIGSEGV）

4. 拼物理地址：
   物理地址 = (PFN << offset_bits) | offset
   （offset 不变，VPN 换成 PFN）
```

**例题**：页大小 4KB，页表 VPN 0→5、VPN 1→9、VPN 2→3，求虚拟地址 0x1543 物理地址。

```
offset_bits = 12
offset = 0x1543 & 0xFFF = 0x543
VPN    = 0x1543 >> 12   = 0x1
查表：VPN 1 → PFN 9
物理地址 = (9 << 12) | 0x543 = 0x9000 | 0x543 = 0x9543
```

**多级页表**（x86-64 四级）：

```
虚拟地址 48 位 = [9 PGD][9 PUD][9 PMD][9 PTE][12 offset]
翻译：CR3(页表根) → +PGD 索引查 PGD → +PUD 索引查 PUD
     → +PMD 索引查 PMD → +PTE 索引查 PTE → 得 PFN，拼 offset
每级查一次内存（无 TLB 时 4 次访存）。
```

## 四、缺页中断完整流程

```
1. CPU 访问虚拟地址 → MMU 查页表 → Present=0
2. 触发 #PF（Page Fault，fault 类异常），陷入内核态
3. 内核缺页处理程序：
   a. 地址合法（在进程地址空间）？
      - 不合法 → SIGSEGV，杀进程
      - 合法但页不在内存 → 继续
   b. 找空闲物理帧
      - 有空闲 → 直接用
      - 无空闲 → 页面置换算法淘汰一页
        · 被淘汰页 Dirty=1 → 写回磁盘 swap
        · Dirty=0 → 直接丢弃
   c. 从磁盘读页内容到物理帧
   d. 更新 PTE：Present=1，帧号=新帧，清 Dirty
4. 返回用户态，重新执行原访存指令（这次成功）
```

- **代价**：约几毫秒（磁盘 IO），比内存访问慢 **5 万倍**。频繁缺页是性能灾难。
- **写时复制（COW）**：写只读共享页触发缺页 → 内核复制一份新帧、改 PTE 为可写 → 重新执行写指令。

## 五、易错点清单

- **"分页消除了所有碎片"**：错。分页消除**外部**碎片，但仍有**内部**碎片（最后一页填不满，平均浪费页大小一半）。
- **"分段比分页更高效"**：错。分段有**外部**碎片（空闲块零碎不连续，难分配大段），需紧凑（代价大）。现代 OS 弃分段用分页。
- **"多级页表让翻译更快"**：错。多级页表**省内存**，但翻译**更慢**（多次查表）。靠 TLB 缓存弥补。
- **"TLB 命中率低也能用"**：错。TLB miss 要查多级页表（4 次内存访问），命中率必须 >99% 才让 VM 可用。命中率低则性能崩塌。
- **"增加物理帧数一定降低缺页率"**：错。**FIFO 有 Belady 异常**——帧增缺页反增。LRU/OPT 才单调。
- **"LRU 一定是最优的"**：错。LRU 是**实用近似**，理论最优是 OPT（但不可实现）。LRU 在特定访问模式下不如 FIFO（如顺序扫描）。
- **"OPT 算法能用在实时系统"**：错。OPT 需**预知未来**，不可实现，只能离线评估用。
- **"Clock 算法就是 LRU"**：错。Clock 是 LRU 的**廉价近似**（用 Accessed 位），开销小但不如 LRU 精确。
- **"缺页就是错误"**：不一定。**合法的缺页**（请求分页的按需调入、COW）是正常机制；只有访问非法地址的缺页才是错误（SIGSEGV）。
- **"抖动是因为 CPU 慢"**：错。抖动是因为**内存不足**导致频繁缺页，CPU 都在等磁盘（IO bound），不是 CPU 慢。
- **"工作集是固定的"**：错。工作集随程序**阶段变化**（编译 vs 链接阶段活跃页不同），是动态的。
- **"段页式淘汰了分页"**：错。现代 64 位 OS（Linux/Windows）用 flat 模式**只用分页**，段页式主要是教科书概念。
- **"虚拟内存一定比物理内存大"**：不一定。虚拟地址空间（如 2^48）通常远大于物理 RAM，但请求分页让**实际驻留**远小于物理 RAM——关键不是"虚拟>物理"，而是隔离与按需。
- **"swap 关掉性能更好"**：不一定。内存充足时 swap 少用（甚至可关），但内存紧张时无 swap 会导致 OOM 杀进程——swap 是安全阀。

## 六、进阶方向（链接其他叶）

- [操作系统概述](../../overview/) —— OS 四大资源管理总览，虚拟内存在其中的位置
- [进程与线程基础](../../process-concurrency/) —— 进程地址空间如何与页表配合
- [内存管理基础](./) —— 本叶入口（分页/分段/虚拟内存）
- [设备与 I/O 管理](../io-management/) —— swap 与磁盘 IO 的关系

## 权威链接

- [Virtual memory - Wikipedia](https://en.wikipedia.org/wiki/Virtual_memory)
- [Paging - Wikipedia](https://en.wikipedia.org/wiki/Memory_paging)
- [Page replacement algorithm - Wikipedia](https://en.wikipedia.org/wiki/Page_replacement_algorithm)
- [Translation lookaside buffer - Wikipedia](https://en.wikipedia.org/wiki/Translation_lookaside_buffer)
- [Belady's anomaly - Wikipedia](https://en.wikipedia.org/wiki/Belady%27s_anomaly)
- [Thrashing (computer science) - Wikipedia](https://en.wikipedia.org/wiki/Thrashing_(computer_science))
- [Working set - Wikipedia](https://en.wikipedia.org/wiki/Working_set)
- [Operating Systems: Three Easy Pieces - VM chapters](http://pages.cs.wisc.edu/~remzi/OSTEP/)
- [Page Replacement Algorithms - GeeksforGeeks](https://www.geeksforgeeks.org/page-replacement-algorithms-in-operating-systems/)
- 本站幻灯片：<a href="/SlideStack/virtual-memory-slide/" target="_blank">分页、分段与虚拟内存</a>
