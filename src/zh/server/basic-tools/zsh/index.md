---
layout: doc
---

# Zsh

**Zsh**（**Z shell**）是 Unix shell 家族中**交互体验最强**的成员——一个兼容 Bash/POSIX 的命令解释器，却在补全、历史、Glob、拼写纠正上甩开 Bash 一个身位。如果说 Bash 是"服务器的通用语"（脚本生态绑定），那 Zsh 就是"开发者的日常驱动"（交互流畅度）。**自 2019 年 macOS Catalina 起，Zsh 取代 Bash 成为 macOS 默认登录 shell**——这是 Zsh 在桌面/开发机阵地战胜 Bash 的标志事件。Zsh 由 Princeton 学生 Paul Falstad 于 1990 年创建（灵感来自 ksh 与 tcsh），名字 Z 是"最后一个字母"——寓意当时 shell 的终极形态。

Zsh 的核心价值在**交互**：①**补全系统**（compsys）——开箱即用、可编程的 Tab 补全，命令、参数、文件、git 分支、docker 镜像、ssh 主机都能智能补全（Bash 要装 bash-completion 才勉强及格）；②**共享历史**——多个终端窗口共享同一条历史记录，关一个开一个不丢命令；③**拼写纠正**——`cd /usr/locol/bin` 自动纠正成 `/usr/local/bin`，告别 typo；④**强大的 Glob**——`**/*.py` 递归匹配、`*(.)` 只匹配普通文件、限定符比 Bash 强大数倍；⑤**主题与提示符**——`PROMPT` 支持右侧提示符 `RPROMPT`、Vi 模式指示器、上下文感知。围绕 Zsh 形成了繁荣的**框架生态**：oh-my-zsh（最流行，280+ 插件 150+ 主题）、prezto（轻量快速）、Zinit（插件管理器，按需懒加载）、Powerlevel10k（最快的提示符主题，含向导式配置）、Starship（跨 shell 的 Rust 写提示符）。本叶讲透 Zsh 的交互特性与框架选型，并厘清"交互用 Zsh，脚本用 Bash"的边界。

## 评价

**优点**

- **补全最强**：开箱即用的可编程补全系统，覆盖 git/docker/kubectl/npm 等数百命令，远超 Bash
- **交互贴心**：共享历史、拼写纠正、Glob 限定符、右侧提示符、菜单式选择，日常流畅度高
- **Bash 兼容**：默认多数 Bash 语法可直接跑（`emulate bash` 完全兼容），迁移成本低
- **框架生态**：oh-my-zsh/prezto/Zinit + Powerlevel10k/Starship，一键获得美观且功能强的开发环境

**缺点**

- **脚本生态不如 Bash**：CI/Docker/cron 默认假设 Bash，运维脚本用 Zsh 语法不可移植
- **默认配置朴素**：原生 Zsh 补全要 `compinit` 启用、提示符默认简陋——需配框架才发挥威力（这也是 oh-my-zsh 流行的原因）
- **框架拖慢启动**：oh-my-zsh 大量插件会让冷启动从 20ms 慢到几百毫秒，影响大量子进程场景
- **学习曲线**：补全/Glob 限定符/钩子体系复杂，深度定制需读手册

## 本叶地图

- [入门](./getting-started) —— Zsh 是什么、与 Bash 的兼容与差异、macOS 默认、核心交互优势
- [交互特性](./guide-line/interactive-features) —— 补全系统、共享历史、拼写纠正、Glob 限定符、提示符
- [框架生态](./guide-line/frameworks) —— oh-my-zsh/prezto/Zinit、Powerlevel10k、Starship 选型
- [参考](./reference) —— Zsh 速查、补全配置、常用选项、与 Bash 差异表、易错点

## 幻灯片地址

<a href="/SlideStack/zsh-slide/" target="_blank">Zsh</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Zsh" target="_blank" rel="noopener noreferrer">Zsh 测试题</a>
