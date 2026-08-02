---
layout: doc
---

# 进程管理与服务（systemd）

服务器上跑着成百上千个进程——Nginx、数据库、SSH 守护进程、你的应用——它们谁在占用 CPU、谁卡死了、谁该开机自启？**进程管理**回答这些问题。Linux 把进程看作资源分配的基本单位（每个进程有独立的地址空间、文件描述符、权限），通过 `ps`/`top`/`htop` 查看状态，用 `kill` 发送信号控制生命周期。而**服务管理**（systemd）则把「让程序在后台持续运行、开机自启、崩溃自动重启」这件事标准化了——`systemctl` 是几乎所有现代 Linux 发行版的服务管家。

本叶把**进程控制**（`ps`/`top`/`htop`/`kill`/`jobs`/`bg`/`fg`）、**systemd 服务管理**（`systemctl` 的 start/stop/enable/status）、**日志查询**（`journalctl`）与**定时任务**（`cron`/`crontab` + systemd timers）汇于一处。讲清进程状态机（运行/睡眠/僵尸/停止）、信号机制（`kill -9` 为何是最后手段、SIGTERM 与 SIGKILL 的区别）、systemd unit 的结构与 enable 的含义、cron 表达式的五段式——这是从「会敲命令」到「能管服务器」的关键一跃。

## 评价

**优点**

- **systemd 统一管理**：服务启停、开机自启、依赖编排、日志收集一站式，替代了碎片化的 init 脚本
- **信号机制灵活**：从优雅终止（SIGTERM）到强制杀死（SIGKILL），覆盖各种进程控制场景
- **journalctl 集中日志**：所有 systemd 服务的日志统一存储、可按服务/时间/优先级过滤，排障效率高

**缺点**

- **systemd 争议大**：庞大的「第二个内核」，违背 Unix「做一件事做好」哲学，部分老运维仍偏爱 SysVinit
- **信号用错危险**：`kill -9` 不给进程清理机会（不 flush 缓冲、不留临时文件清理），数据可能损坏
- **cron 表达式易错**：五段式（分时日月周）字段顺序、`*/5` 与 `5-10` 的含义，新手常写错

## 本叶地图

- [入门](./getting-started) —— 进程与程序的区别、进程状态、信号、systemd 与 init、cron 调度
- [进程控制详解](./guide-line/process-control) —— `ps`/`top`/`htop`/`kill`/`jobs`/`bg`/`fg` 的高频用法
- [systemd 与定时任务](./guide-line/systemd-and-cron) —— `systemctl`/unit 文件/`journalctl`/`crontab`/systemd timers
- [参考](./reference) —— 信号速查、systemctl 命令速查、cron 表达式、易错点清单

## 幻灯片地址

<a href="/SlideStack/process-services-slide/" target="_blank">进程管理与服务（systemd）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E8%BF%9B%E7%A8%8B%E7%AE%A1%E7%90%86%E4%B8%8E%E6%9C%8D%E5%8A%A1%EF%BC%88systemd%EF%BC%89" target="_blank" rel="noopener noreferrer">进程管理与服务（systemd）测试题</a>
