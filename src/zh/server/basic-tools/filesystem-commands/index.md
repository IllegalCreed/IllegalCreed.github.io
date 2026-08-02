---
layout: doc
---

# 文件系统与基础命令

Linux 把「一切皆文件」作为核心抽象——普通文件、目录、设备、管道、网络套接字，都被统一的文件接口（`open`/`read`/`write`/`close`）封装。掌握文件系统与基础命令，是登入服务器的**第一道门槛**：从列出目录（`ls`）、切换路径（`cd`）、到查找（`find`）、链接（`ln`）、权限（`chmod`/`chown`），这些命令构成了日常运维与开发的肌肉记忆。一个不会用 `find` 的后端工程师，定位一个日志文件要花十分钟；一个不懂 `chmod` 符号的，部署脚本权限错了都看不懂报错。

本叶是**服务器基础工具章**的开篇，把最常用的文件操作命令（`ls`/`cd`/`cp`/`mv`/`rm`/`mkdir`/`find`/`ln`/`chmod`/`chown`/`touch`）、环境辅助（`sudo`/`df`/`du`/`export`/`source`/`alias`）与**终端文本编辑器**（Vim/Nano 的生存级操作）汇于一处。讲清每条命令的**高频用法 + 易错点 + 安全陷阱**（如 `rm -rf` 的毁灭性、`chmod` 数字与符号两种模式、硬链接与软链接的本质差异、Vim 的模式思维）——后续 [进程管理与服务](../process-services/)、[文本处理](../text-processing/) 两叶建立在此基础上。

## 评价

**优点**

- **统一抽象**：一切皆文件，设备/管道/套接字共用同一套 `read`/`write` 接口，学习成本低、组合能力强
- **管道组合**：命令是小工具，通过管道（`|`）串成复杂流水线，复用性极强
- **权限精细**：属主/属组/其他人三组 × 读/写/执行九位，配合 `sudo` 实现最小权限原则

**缺点**

- **选项繁多**：单条命令动辄几十个选项（`ls` 一条就有 50+ 选项），记忆负担重
- **危险无确认**：`rm -rf`、`chmod -R 777` 等操作无回收站、无二次确认，误操作即灾难
- **Vim 学习曲线陡**：模式编辑（普通/插入/命令）反直觉，初学者卡在「怎么退出 Vim」

## 本叶地图

- [入门](./getting-started) —— 文件系统抽象、目录树、文件操作命令全览、权限模型、链接
- [文件操作详解](./guide-line/file-operations) —— `ls`/`cd`/`cp`/`mv`/`rm`/`find`/`ln`/`chmod`/`chown` 的高频用法与陷阱
- [编辑器与环境](./guide-line/editors-and-env) —— Vim/Nano 生存操作、`sudo`/`df`/`du`/`export`/`source`/`alias`
- [参考](./reference) —— 命令速查表、权限数字对照、Vim 键位、易错点清单

## 幻灯片地址

<a href="/SlideStack/filesystem-commands-slide/" target="_blank">文件系统与基础命令</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F%E4%B8%8E%E5%9F%BA%E7%A1%80%E5%91%BD%E4%BB%A4" target="_blank" rel="noopener noreferrer">文件系统与基础命令测试题</a>
