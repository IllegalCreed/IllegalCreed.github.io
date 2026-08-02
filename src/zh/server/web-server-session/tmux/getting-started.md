---
layout: doc
outline: [2, 3]
---

# 入门：tmux 定位、SSH 断连痛点与三层结构

> 基于 tmux 3.4 · 核于 2026-08

## 速查

- **定位**：tmux（terminal multiplexer，终端复用器）是 Linux/macOS 服务器运维工具——让进程在 SSH 断开后继续运行，并支持一个终端管理多会话/窗口/面板。
- **核心痛点解决**：SSH 断连时，tmux 会话「分离」（detach）而非终止，进程继续在后台跑，重连后 `tmux attach` 恢复。没 tmux 的话断连会发 SIGHUP 杀死前台进程。
- **三层结构**：①**会话（session）**——最外层容器，独立于 SSH 连接存在；②**窗口（window）**——会话内的标签页，可开多个；③**面板（pane）**——窗口内的分屏区域。
- **前缀键（prefix）**：tmux 的所有快捷键都先按 prefix（默认 `Ctrl-b`）再按功能键。如 `Ctrl-b c` 创建窗口、`Ctrl-b %` 垂直分屏。
- **会话生命周期**：`tmux new -s 名字`（新建）→ `Ctrl-b d`（detach 分离，进程继续跑）→ `tmux ls`（列出）→ `tmux attach -t 名字`（重新接入）。
- **窗口操作**：`Ctrl-b c`（新建）、`Ctrl-b n`/`p`（下一个/上一个）、`Ctrl-b 数字`（切到第 N 个）、`Ctrl-b &`（关闭）。
- **面板操作**：`Ctrl-b %`（垂直分屏）、`Ctrl-b "`（水平分屏）、`Ctrl-b 方向键`（切面板）、`Ctrl-b x`（关闭当前面板）。
- **copy mode**：`Ctrl-b [`（进入翻页/复制模式），用方向键/vi 按键翻历史输出，空格选、回车复制。
- **配置文件**：`~/.tmux.conf` 自定义 prefix、开鼠标、改配色、加插件，让默认反人类的配置变好用。
- **与 screen 的区别**：tmux 是 screen 的现代继任者——配置更活、状态栏更强、活跃维护；screen 老旧但仍存于某些系统，基本概念相同。

## 一、tmux 是什么：为什么 SSH 运维离不开它

想象这个场景：你 SSH 连远程服务器跑一个深度学习训练（预计 8 小时）。第 3 小时你的网络抖了一下，SSH 断连。这时 Linux 会给该 SSH 会话的前台进程发 **SIGHUP（hangup）信号**——进程被杀死，3 小时训练进度全部丢失。这就是没有 tmux 的惨痛。

tmux 解决这个根本痛点。进程跑在 tmux 的**会话（session）**里，会话是独立于 SSH 连接存在的——SSH 断连时，tmux 会话只是「分离」（detach），里面的进程继续在服务器后台跑。你重连 SSH 后，`tmux attach` 重新接入这个会话，终端画面恢复如初，就像没断过。

```
无 tmux：SSH 断连 → 前台进程收 SIGHUP 被杀 → 任务丢失
有 tmux：进程在 tmux 会话里 → SSH 断连只是 detach → 进程继续 → 重连 attach 恢复
```

除了解决断连，tmux 还让你**一个终端管理多任务**：开多个窗口（一个跑日志、一个跑构建、一个调试），每个窗口还能分屏（一边看代码一边跑命令），不用开十几个 SSH 窗口。

## 二、三层结构：会话、窗口、面板

tmux 的核心心智模型是**三层嵌套**：

```
会话（session）  ← 最外层，独立于 SSH 存在
├── 窗口 1（window）  ← 像浏览器的标签页
│   ├── 面板 A（pane）  ← 窗口内的分屏区域
│   └── 面板 B
├── 窗口 2
│   └── 面板 C（单面板占满窗口）
└── 窗口 3
```

- **会话（session）**：最外层容器。一个服务器上可有多个会话（如「工作」「实验」），各自独立。SSH 断连只会 detach 当前会话，不影响会话本身。`tmux new -s work` 新建名为 work 的会话。
- **窗口（window）**：会话内的标签页，底部状态栏显示编号。一个会话可开多个窗口（`Ctrl-b c` 新建），用 `Ctrl-b 数字` 切换。每个窗口在同一时刻全屏显示一个（除非用 zoom）。
- **面板（pane）**：窗口内的分屏区域。`Ctrl-b %` 垂直分（左右两块）、`Ctrl-b "` 水平分（上下两块）。面板间用 `Ctrl-b 方向键` 切换。

**记忆要点**：会话管「断连存活」、窗口管「多任务标签」、面板管「同屏分屏」。

## 三、会话生命周期：new / detach / attach

会话是 tmux 最核心的概念，掌握其生命周期就掌握了 tmux 的精髓：

```bash
# 新建会话（命名方便管理）
tmux new -s work           # 新建名为 work 的会话并进入

# 在会话内：分离（detach）
# 按 Ctrl-b 然后按 d
# 此时回到原终端，会话在后台继续运行

# 列出所有会话
tmux ls
# 输出：work: 1 windows (created Mon Aug  3 09:00:00 2026)

# 重新接入会话
tmux attach -t work        # -t 指定会话名
tmux a -t work             # attach 的简写

# 销毁会话（在会话内）
exit                       # 退出当前窗口，最后一个窗口退出则会话结束
# 或从外部
tmux kill-session -t work
```

- **detach 是关键**：`Ctrl-b d` 让会话进后台，进程继续跑。这是 tmux 最常用的操作——下班 detach，第二天 attach 回去。
- **命名会话**：`-s 名字` 给会话起名（如 work/build），`tmux ls` 和 `attach -t` 时好区分。
- **重连场景**：SSH 断连后会话自动 detach（不是被杀），重连后 `tmux a` 恢复——这就是 tmux 的核心价值。

## 四、前缀键（prefix）：tmux 的操作中枢

tmux 的所有快捷键都遵循「**前缀键 + 功能键**」模式：先按 prefix（默认 `Ctrl-b`，即按住 Ctrl 再按 b），松开后再按功能键。这是为了不与 shell/应用自身的快捷键冲突。

```
Ctrl-b（按下松开）→ c      创建新窗口
Ctrl-b → %                垂直分屏（左右）
Ctrl-b → "                水平分屏（上下）
Ctrl-b → 数字             切换到第 N 个窗口
Ctrl-b → d                分离会话
Ctrl-b → [                进入 copy mode（翻页/复制）
```

- **为什么默认 Ctrl-b 难按**：`Ctrl-b` 在键盘左下角，频繁按累手。所以几乎所有 tmux 用户都会在 `.tmux.conf` 里改成 `Ctrl-a`（更顺手，与 screen 习惯一致）或 `Ctrl-Space`。
- **prefix 是「松开再按」**：不是同时按，是先按 prefix 松开，再按功能键。新手常犯的错是同时按导致没反应。
- **重复操作**：有些键支持「prefix 松开后再按 prefix」表示「上一个窗口」等，具体查参考。

## 五、窗口与面板的核心快捷键

**窗口（window）操作**：

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl-b c` | 创建新窗口 |
| `Ctrl-b n` | 切到下一个窗口（next） |
| `Ctrl-b p` | 切到上一个窗口（previous） |
| `Ctrl-b 0-9` | 切到第 N 个窗口 |
| `Ctrl-b &` | 关闭当前窗口（确认） |
| `Ctrl-b ,` | 重命名当前窗口 |
| `Ctrl-b w` | 列出所有窗口选择 |

**面板（pane）操作**：

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl-b %` | 垂直分屏（左右两块） |
| `Ctrl-b "` | 水平分屏（上下两块） |
| `Ctrl-b 方向键` | 切到对应方向的面板 |
| `Ctrl-b o` | 顺序切换面板 |
| `Ctrl-b x` | 关闭当前面板（确认） |
| `Ctrl-b z` | 当前面板全屏/恢复（zoom） |
| `Ctrl-b {` / `}` | 交换面板位置 |

- **`Ctrl-b z` zoom**：分屏后某个面板想暂时全屏看，按 z 全屏，再按 z 恢复分屏——非常实用。
- **分屏方向记忆**：`%` 在键盘上竖直（两竖点），所以垂直分（左右）；`"` 横着，所以水平分（上下）。

## 六、copy mode：翻页与复制

终端默认只能看当前一屏，往上翻历史要靠终端模拟器的滚轮。tmux 的 copy mode 让你在 tmux 内翻历史、选文本、复制：

- **进入**：`Ctrl-b [`，进入后左上角显示 `[0/0]` 之类标记。
- **翻页**：用方向键、PgUp/PgDn，或 vi 模式下的 `k`/`j`（上下）、`Ctrl-u`/`Ctrl-d`（半屏）。
- **选择**：按 `Space`（vi 模式）或 `Ctrl-Space`（emacs 模式）开始选，移动光标选中文本，`Enter` 复制。
- **粘贴**：`Ctrl-b ]` 粘贴 tmux 复制的内容。
- **退出 copy mode**：按 `q`。

复制到系统剪贴板需额外配置（macOS 要 `reattach-to-user-namespace`，Linux 要 `xclip` 集成），在 [配置与工作流](./guide-line/config-and-workflow) 详述。

## 下一步

入门讲完 tmux 的定位、三层结构、会话生命周期、核心快捷键后，下一步深入两个专题——[会话、窗口与面板](./guide-line/sessions-and-panes)（完整命令与操作流程）与 [配置与工作流](./guide-line/config-and-workflow)（`.tmux.conf` 自定义、持久化、tmux vs screen）。
