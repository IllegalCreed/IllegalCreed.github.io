---
layout: doc
outline: [2, 3]
---

# 参考：ACL、防御机制与 Unix 权限速查

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **CIA 三要素**：机密性（防泄露）+ 完整性（防篡改）+ 可用性（防拒绝），安全设计的终极三角。
- **保护 vs 安全**：保护=机制（怎么隔离），安全=策略（该不该让做）；机制要通用、策略可变。
- **信任域**：内核态（Ring 0，可信，全权限）vs 用户态（Ring 3，不可信，受限），跨越需 syscall。
- **ACL（按客体）**：每个文件一张"谁能访问"的表；易查"谁能访问此文件"、易撤销；难查"某用户能访问哪些文件"。
- **capability（按主体）**：每人一组不可伪造令牌（如 fd）；易查"某用户能访问哪些"、易传递；难查"谁能访问此文件"、难撤销。
- **Unix 权限**：`rwx` 三组（属主/属组/其他），`chmod 755`、`chown`；root 绕过检查；`sudo` 临时提权；`setuid` 以文件属主身份执行。
- **缓冲区溢出**：超长输入覆盖栈上返回地址 → 跳转执行 shellcode；以 root 运行则危害最大化。
- **四大缓解**：ASLR（地址随机化）、DEP/NX（数据不可执行）、Stack Canary（检测返回地址被改）、CFI（限制跳转目标）——纵深防御叠加。
- **Meltdown/Spectre**：推测执行 + 缓存侧信道，绕过隔离；KPTI 缓解 Meltdown（代价 syscall 慢 5-30%）。
- **最小权限**：服务降权运行（如 `www-data`），溢出被利用也只能拿到受限权限——最后兜底。
- **边界**：本叶只讲 OS 层隔离防护，网络加密/TLS/防火墙归网络安全章。

## 一、ACL vs capability 对比

| 维度 | ACL（访问控制表） | capability（能力） |
| --- | --- | --- |
| **存储** | 按**客体**（列） | 按**主体**（行） |
| **类比** | 门上贴"谁能进"的告示 | 每人手里攥一串钥匙 |
| **易查** | 谁能访问**这个文件** | 某用户能访问**哪些文件** |
| **撤销权限** | **易**（删 ACL 一行） | **难**（回收散布的令牌） |
| **权限传递** | 难（属主改 ACL） | **易**（传递 fd/令牌） |
| **伪造风险** | ACL 可能被篡改 | **不可伪造**（内核颁发） |
| **天然契合** | DAC（属主自主管理） | 最小权限（按需授予） |
| **代表** | Unix 权限位、NTFS ACL | Linux 文件描述符、seccomp、Capsicum |
| **DAC/MAC** | DAC 代表（属主决定） | MAC 用系统统一策略（SELinux/AppArmor） |

注：真实系统常**混用**——Linux 文件用 ACL（权限位），进程持有的**文件描述符是 capability**，两者协同。

## 二、缓冲区溢出防御机制速查

| 缓解 | 机制 | 防什么 | 被什么绕过 | 开启方式 |
| --- | --- | --- | --- | --- |
| **ASLR** | 随机化栈/堆/库基址 | 猜不准地址 | 信息泄露地址 | 默认开（`randomize_va_space=2`） |
| **DEP / NX** | 页表 NX 位，数据页不可执行 | 注入代码不可执行 | ROP 复用已有代码 | `gcc -z noexecstack` |
| **Stack Canary** | 返回地址旁插随机值 | 检测栈溢出 | 泄露/爆破 canary、堆溢出 | `gcc -fstack-protector-strong` |
| **CFI** | 限制间接跳转目标集合 | 限制控制流劫持 | 粗粒度实现的盲区 | LLVM CFI、MS CFG |
| **PIE** | 可执行文件位置无关 | 配合 ASLR 随机化主程序 | 同 ASLR | `gcc -fPIE -pie` |
| **KPTI** | 内核/用户用不同页表 | Meltdown（用户读内核） | （硬件级，需 CPU 微码） | 默认开（受影响 CPU） |

**纵深防御**：四层相互补位，攻击者需同时绕过全部才成功；再配合**最小权限**降权运行兜底。

## 三、Unix 权限速查

```
$ ls -l /etc/passwd
-rw-r--r--  1 root root  ...  /etc/passwd
└─┬─┘
  属主  属组  其他
  rwx   rwx   rwx
```

| 符号 | 含义 | 文件 | 目录 |
| --- | --- | --- | --- |
| `r` | 读 | 看内容 | 列出文件名 |
| `w` | 写 | 改内容 | 增删目录内文件 |
| `x` | 执行 | 当程序跑 | 可进入（cd） |

- **八进制**：`rwx`=7，`rw-`=6，`r-x`=5，`r--`=4。`chmod 755` = `rwxr-xr-x`。
- **`chmod`** 改权限位，**`chown`** 改属主/属组，**`chgrp`** 改属组。
- **特殊位**：`setuid`（4xxx，以属主身份执行）、`setgid`（2xxx，以属组身份/目录新文件继承组）、`sticky`（1xxx，目录下文件只有属主能删，如 /tmp）。
- **root（UID=0）绕过所有权限检查**——所以**绝不长期以 root 跑服务**。
- **`sudo`**：经 `/etc/sudoers` 授权后临时以 root 执行单条命令，有日志、有时限、可限定命令。
- **`setuid` 程序**：典型 `passwd`（属主 root + setuid），普通用户执行时进程有 root 权限改 `/etc/shadow`——是 setuid 的妙用，也是著名提权攻击面。

## 四、身份认证速查

| 因素 | 类别 | 举例 | 风险 |
| --- | --- | --- | --- |
| **你知道什么** | 知识 | 口令、PIN | 可被猜解/钓鱼/泄露 |
| **你拥有什么** | 持有 | U 盾、手机验证码、令牌 | 可丢失/被盗 |
| **你是什么** | 生物 | 指纹、人脸、虹膜 | 难更改（泄露即永久） |

- **MFA / 2FA**：至少结合两种不同类别的因素，安全性大幅提升。
- **口令存储铁律**：**绝不存明文**，存**加盐慢哈希**（bcrypt/scrypt/Argon2）；早期 Unix 用 DES（已淘汰）。
- **`/etc/shadow`**：口令哈希单独存，只 root 可读，与公开的 `/etc/passwd` 分离，防离线爆破。

## 五、易错点清单

- **"保护和安全是一回事"**：错。保护=机制（怎么隔离），安全=策略（该不该让做），机制与策略要分离。
- **"ACL 比 capability 先进"**：错。两者是**不同查询方向**各有优势——ACL 易查"谁能访问此文件"、易撤销；capability 易查"某用户能访问哪些"、易传递。真实系统常混用。
- **"capability 可以被用户伪造"**：错。capability 由**内核颁发**（如文件描述符），用户态拿到的只是句柄，无法凭空伪造有效令牌。
- **"ASLR 能彻底防住缓冲区溢出"**：错。ASLR 只是**提高攻击成本**——信息泄露地址后即可绕过；需与 DEP/Canary/CFI 叠加才可靠。
- **"DEP/NX 让所有攻击失效"**：错。攻击者转用 **ROP**（复用已有代码片段）绕过 DEP，仍可劫持控制流。
- **"Stack Canary 阻止了溢出发生"**：错。Canary 是**检测**而非阻止——溢出发生后主动终止进程，崩溃好过被劫持。
- **"缓冲区溢出只影响崩溃"**：错。覆盖返回地址可**劫持控制流执行任意代码**，以 root 运行则等于完全沦陷。
- **"setuid 是安全漏洞，应禁用"**：偏颇。setuid 是**最小权限的精妙运用**（让普通用户临时获得特定 root 权限，如改自己密码），问题在于 setuid 程序自身的漏洞。
- **"Meltdown 是软件 bug，打补丁就行"**：错。Meltdown/Spectre 是 **CPU 硬件**推测执行机制的漏洞，KPTI 只是软件缓解（代价性能），根治需硬件 redesign。
- **"最小权限就是给最少权限就够了"**：不全对。最小权限原则要求"**只授予完成任务所必需的最小权限，且只在需要时持有、用完收回**"——时变性也是关键。
- **"root 运行服务更方便所以没问题"**：错。这是**违反最小权限**的典型，一旦被攻破直接拿系统最高权限，是纵深防御的灾难。
- **"CIA 中机密性最重要"**：偏颇。三者**缺一不可**且常冲突（强机密性损害可用性），安全设计是三角间的权衡，没有绝对优先。

## 六、进阶方向（链接其他叶）

- [操作系统概述](../../overview/) —— 用户态/内核态、系统调用（本叶的隔离基础）
- [虚拟内存](../../virtual-memory/) —— 地址空间隔离与 NX 位的页表实现
- [进程与线程基础](../../process-thread-basics/) —— 进程隔离与权限隔离的协同

## 权威链接

- [Computer security - Wikipedia](https://en.wikipedia.org/wiki/Computer_security)
- [Access-control list - Wikipedia](https://en.wikipedia.org/wiki/Access-control_list)
- [Capability-based security - Wikipedia](https://en.wikipedia.org/wiki/Capability-based_security)
- [Buffer overflow - Wikipedia](https://en.wikipedia.org/wiki/Buffer_overflow)
- [Address space layout randomization - Wikipedia](https://en.wikipedia.org/wiki/Address_space_layout_randomization)
- [Meltdown (security vulnerability) - Wikipedia](https://en.wikipedia.org/wiki/Meltdown_(security_vulnerability))
- [Spectre (security vulnerability) - Wikipedia](https://en.wikipedia.org/wiki/Spectre_(security_vulnerability))
- [Principle of least privilege - Wikipedia](https://en.wikipedia.org/wiki/Principle_of_least_privilege)
- [Operating System Security - GeeksforGeeks](https://www.geeksforgeeks.org/operating-system-security/)
- 本站幻灯片：<a href="/SlideStack/os-security-slide/" target="_blank">操作系统安全与保护</a>
