---
layout: doc
outline: [2, 3]
---

# 会话、窗口与面板：命令、操作与快捷键

> 基于 tmux 3.4 · 核于 2026-08

## 速查

- **会话命令**：`tmux new -s 名字`（新建并进入）、`tmux ls`（列出）、`tmux attach -t 名字`（接入）、`tmux kill-session -t 名字`（销毁）、`tmux rename-session`（重命名）。
- **会话内 detach/attach**：`Ctrl-b d`（分离，进程继续）、`Ctrl-b s`（会话内列出并切换会话）、`tmux a`（终端内重连）。
- **窗口快捷键**：`Ctrl-b c`（新建）、`Ctrl-b ,`（重命名）、`Ctrl-b n`/`p`（下/上一个）、`Ctrl-b 0-9`（切第 N 个）、`Ctrl-b &`（关闭）、`Ctrl-b w`（列表选择）、`Ctrl-b f`（按内容查找窗口）。
- **面板快捷键**：`Ctrl-b %`（垂直分）/`Ctrl-b "`（水平分）、`Ctrl-b 方向键`/`o`（切换）、`Ctrl-b z`（全屏切换）、`Ctrl-b x`（关闭）、`Ctrl-b {`/`}`（交换）、`Ctrl-b q`（显示面板编号）。
- **面板调整**：`Ctrl-b :`（进命令模式）后用 `resize-pane -L/R/U/D 10`（移动边界 10 格），或绑定快捷键。
- **copy mode**：`Ctrl-b [`（进入翻页/选择）、`Space`（开始选）、`Enter`（复制）、`Ctrl-b ]`（粘贴）、`q`（退出）。
- **同步输入（synchronize-panes）**：开 `:setw synchronize-panes on`，在多个面板同时输入相同命令（批量运维神器）。
- **命名规范**：会话用业务名（work/build）、窗口用任务名（logs/editor/test）、面板按布局组织，配合状态栏一目了然。

## 一、会话管理：完整命令清单

会话是 tmux 最外层容器，掌握这些命令就能驾驭多会话工作流：

```bash
# 新建
tmux new -s work                    # 新建名为 work 的会话并进入
tmux new -s work -d                 # 新建但不自动进入（后台）
tmux new -s work -d 'top'           # 新建并跑一个命令

# 列出
tmux ls                             # 列出所有会话
# work: 3 windows (attached)
# build: 1 windows

# 接入
tmux attach                         # 接入最近的会话
tmux attach -t work                 # 接入指定会话
tmux a -t work                      # 简写

# 分离（在会话内）
# Ctrl-b d                          # detach，会话进后台

# 会话内切换
# Ctrl-b s                          # 列出所有会话，方向键选

# 销毁
tmux kill-session -t work           # 从外部销毁指定会话
tmux kill-server                    # 销毁所有会话（慎用）
# 在会话内输入 exit 或 Ctrl-d       # 退出窗口，最后窗口退出则会话灭

# 重命名
tmux rename-session -t work dev     # 改名为 dev
# 或会话内 Ctrl-b $（prefix + $）
```

- **`-d` 后台新建**：脚本里新建会话不自动进入，稍后 attach。常用于「远程拉起一个长任务会话」。
- **`Ctrl-b s` 会话切换**：会话内按 `prefix s` 弹出会话列表，方向键选 + 回车切，比退出再 attach 快。
- **`kill-server` 慎用**：杀掉所有会话（所有后台进程都死），除非确定要清空。

## 二、窗口管理：标签页式多任务

窗口是会话内的标签页，底部状态栏显示编号。常用快捷键：

```bash
# 创建与命名
Ctrl-b c                            # 新建窗口
Ctrl-b ,                            # 重命名当前窗口

# 切换
Ctrl-b n                            # 下一个窗口（next）
Ctrl-b p                            # 上一个窗口（previous）
Ctrl-b 0                            # 切到第 0 个窗口（0-9）
Ctrl-b l                            # 切到上一个活跃窗口（last）

# 查找与列表
Ctrl-b w                            # 列出所有窗口选择（方向键 + 回车）
Ctrl-b f                            # 按窗口内文本内容查找

# 关闭
Ctrl-b &                            # 关闭当前窗口（会确认 y/n）
exit                                # 在窗口的 shell 里输入，关闭窗口
```

- **命名窗口**：`Ctrl-b ,` 给窗口起名（如 logs/editor/test），状态栏显示名字而非默认的 bash/数字，管理多窗口时不混乱。
- **`Ctrl-b w` 可视化选择**：窗口多时按 w 弹列表，预览每个窗口内容，比记数字快。
- **窗口关闭会确认**：`Ctrl-b &` 会问「kill-window? (y/n)」防误删；shell 里 `exit` 则直接关。

## 三、面板管理：分屏与布局

面板是窗口内的分屏区域，让你同屏看多个任务：

```bash
# 分屏
Ctrl-b %                            # 垂直分屏（左右两块）
Ctrl-b "                            # 水平分屏（上下两块）

# 切换
Ctrl-b 方向键                        # 切到对应方向的面板
Ctrl-b o                            # 顺序切换（顺时针）
Ctrl-b q                            # 短暂显示每个面板的编号，按数字快速切

# 调整大小（命令模式）
Ctrl-b :                            # 进入命令模式
:resize-pane -L 10                  # 左移边界 10 格（-R 右、-U 上、-D 下）
# 或按住 Ctrl-b + 方向键连续按调整

# 全屏与交换
Ctrl-b z                            # 当前面板全屏切换（zoom toggle）
Ctrl-b {                            # 与上一个面板交换
Ctrl-b }                            # 与下一个面板交换

# 关闭
Ctrl-b x                            # 关闭当前面板（确认）
```

- **`Ctrl-b q` 显示编号**：面板多时按 q 显示编号（左上角闪数字），按对应数字快速切。
- **`Ctrl-b z` zoom 最常用**：分屏后想暂时全屏某个面板（看长日志/代码），按 z 全屏，再按 z 恢复。
- **布局预设**：`Ctrl-b Space`（注意是 prefix 后的 Space）在预设布局间切换（even-horizontal/vertical/main-horizontal 等）。
- **`Ctrl-b {`/`}` 交换**：面板顺序不满意时交换位置。

## 四、copy mode：翻历史与复制

终端默认只能看当前一屏，copy mode 让你在 tmux 内翻历史、选文本：

```bash
# 进入
Ctrl-b [                            # 进入 copy mode（左上角显示标记）

# 移动（vi 模式，emacs 模式不同）
h/j/k/l 或方向键                     # 移动光标
Ctrl-u / Ctrl-d                     # 半屏上/下翻
Ctrl-b / Ctrl-f                     # 全屏上/下翻（注意与 prefix 区分，copy mode 内）
g / G                               # 顶部/底部

# 选择与复制
v（vi 模式）或 Space                 # 开始选择
移动光标选中
Enter                               # 复制选中内容到 tmux 缓冲区
q                                   # 退出 copy mode

# 粘贴
Ctrl-b ]                            # 粘贴 tmux 缓冲区内容
Ctrl-b =                            # 列出缓冲区选择粘贴（多个复制历史）
```

- **vi/emacs 模式**：`.tmux.conf` 里 `set -g mode-keys vi` 改用 vi 风格按键（hjkl/v/y），多数人选 vi。
- **翻历史看日志**：长日志刷屏看不全，进 copy mode 往上翻，这是 tmux 日常高频用法。
- **复制到系统剪贴板**：tmux 默认复制到自己的缓冲区，要同步系统剪贴板需配 `copy-pipe`（macOS 用 `pbcopy`，Linux 用 `xclip`），见 [配置与工作流](./config-and-workflow)。

## 五、同步输入：批量运维神器

`synchronize-panes` 让你在多个面板同时输入相同命令——批量在几十台机器执行同样操作：

```bash
# 开启同步
Ctrl-b :                            # 进命令模式
:setw synchronize-panes on          # 开启：当前窗口所有面板同步输入

# 此时在任一面板输入命令，所有面板同时执行
# 例如 ssh 到不同机器后，同时跑 sudo apt update

# 关闭
:setw synchronize-panes off
```

- **使用场景**：多台服务器同时更新、同时查看日志、批量部署。开 N 个面板各自 ssh 到不同机器，开同步，一次输入 N 台执行。
- **风险**：危险的命令（如 `rm -rf`）会同时在所有机器执行，务必确认后用。

## 六、典型工作流：从新建到 detach 的完整流程

```bash
# 1. SSH 连服务器，新建工作会话
ssh user@server
tmux new -s work

# 2. 在会话内开多个窗口
Ctrl-b c                            # 窗口 1: editor（Ctrl-b , 改名）
Ctrl-b c                            # 窗口 2: logs
Ctrl-b c                            # 窗口 3: build

# 3. 在 logs 窗口分屏看多个日志
Ctrl-b 2                            # 切到 logs 窗口
Ctrl-b %                            # 垂直分屏
# 左面板跑 tail -f app.log，右面板跑 tail -f error.log

# 4. 跑长任务（如训练）
Ctrl-b 3                            # 切到 build 窗口
python train.py                     # 开始训练

# 5. 下班，分离会话
Ctrl-b d                            # detach，训练继续跑

# 6. 第二天重连
ssh user@server
tmux a -t work                      # attach 回去，训练还在跑

# 7. 训练完，关闭会话
Ctrl-b 3                            # 切回 build
# 训练结束后 exit 或 Ctrl-d
```

## 下一步

会话/窗口/面板操作讲完后，下一站是 [配置与工作流](./config-and-workflow)——`.tmux.conf` 自定义（改 prefix、开鼠标、配色）、会话持久化方案、tmux 与 screen 的对比。
