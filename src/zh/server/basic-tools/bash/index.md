---
layout: doc
---

# Bash

**Bash**（**Bourne Again SHell**）是 GNU 项目打造的**自由 Shell**——既是一个**交互式命令解释器**（读入用户键入的命令、解析、执行），又是一门**脚本语言**（用 `.sh` 文件把命令序列化、参数化、流程化）。它是 **POSIX shell** 的超集：既兼容经典的 `sh` 语法（管道、重定向、变量、`if`/`for`/`while`），又新增了数组、`[[ ]]` 测试、命令历史、行编辑、进程替换等便利特性。Bash 是 **Linux 服务器的事实默认 shell**——几乎每台 Linux 的 `/etc/passwd` 里 root 与普通用户的登录 shell 都是 `/bin/bash`，systemd 启动的服务脚本、CI 流水线（GitHub Actions 的 `run:`）、Docker 的 `RUN` 指令、cron 定时任务默认都用 Bash 语法。理解 Bash，是运维 Linux 服务器、写自动化脚本、读 CI 配置的基础——一个不懂 `$(...)` 与管道的开发者，无法高效排查线上日志、批量操作文件。

Bash 的全部考点围绕**五大能力**展开：①**命令执行**（管道 `|`、重定向 `>`/`>>`/`<`、命令替换 `$()`、退出码 `$?`）——把多个小程序串成数据流水线；②**变量与展开**（用户变量、环境变量 `export`、特殊变量 `$1`/`$#`/`$@`/`$$`、四种展开：参数/命令/算术/路径）——给脚本注入参数与状态；③**流程控制**（`if`/`case`、`for`/`while`/`until`、`&&`/`||` 短路）——决定做什么、做几次；④**函数与作用域**（`function f(){}`、`local`、`return` 退出码、参数传递）——把逻辑封装复用；⑤**服务器场景**（shebang `#!/usr/bin/env bash`、`set -euo pipefail` 严苛模式、`trap` 信号处理、`source`/`.` 加载、与 Zsh/Fish 的差异）。本叶是服务器章的**工具地基**，讲透 Bash 的脚本语法、管道重定向、服务器默认 shell 的工程实践——后续 Nginx/systemd/SSH 等叶都假设你能读懂 Bash。

## 评价

**优点**

- **无处不在**：Linux/macOS（Catalina 前）默认自带，服务器、容器、CI、嵌入式几乎全覆盖，写一次脚本到处能跑
- **管道哲学**：用 `|` 把多个单一职责的小工具（`grep`/`sed`/`awk`/`sort`/`uniq`）串成强大的数据流水线，是 Unix 哲学的化身
- **胶水能力强**：能调用任何命令行程序、能被 cron/systemd/CI 调度，是连接系统各组件的天然胶水
- **POSIX 兼容**：写 `#!/bin/sh` 风格的脚本可跨 dash/ash/bash/zsh 运行，可移植性好

**缺点**

- **语法晦涩**：空格敏感（`a=1` 对、`a = 1` 错）、引号规则复杂（`"$var"` vs `'$var'` vs `$var`）、`[[` 与 `[` 的差异让人踩坑
- **错误处理弱**：默认不报错就继续（`set -e` 才中止）、管道只看最后一个命令的退出码（`set -o pipefail` 才全检查），写出"静默失败"的脚本重灾区
- **不适合复杂逻辑**：没有真正的数据结构（关联数组 Bash 4 才有）、浮点运算要靠 `bc`、超百行脚本维护性骤降——复杂场景应上 Python/Go
- **跨平台坑**：macOS 自带的 Bash 长期停留在 3.2（GPLv2），数组 `mapfile`、`readarray` 等新特性不可用

## 本叶地图

- [入门](./getting-started) —— Bash 是什么、变量与展开、管道与重定向、流程控制、函数、POSIX 兼容
- [脚本编程与管道](./guide-line/scripting-and-pipeline) —— 变量/条件/循环/函数的完整语法、管道数据流水线、重定向与文件描述符
- [服务器场景与对比](./guide-line/server-usage) —— 服务器默认 shell、shebang 与严苛模式、脚本工程实践、与 Zsh/Fish 对比
- [参考](./reference) —— Bash 速查、特殊变量表、内建命令清单、严苛模式、易错点

## 幻灯片地址

<a href="/SlideStack/bash-slide/" target="_blank">Bash</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Bash" target="_blank" rel="noopener noreferrer">Bash 测试题</a>
