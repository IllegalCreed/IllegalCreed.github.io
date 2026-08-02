---
layout: doc
outline: [2, 3]
---

# 密钥与配置：ssh-keygen、agent 与 config

> 基于 OpenSSH · 核于 2026-08

## 速查

- **ed25519 首选**：`ssh-keygen -t ed25519 -C "comment"`。比 RSA 短、快、安全。RSA 仅老系统不支持时用 `-t rsa -b 4096`。
- **私钥保密、公钥公开**：私钥（`id_ed25519`，600）永不外传；公钥（`.pub`）复制到服务器 `authorized_keys`。
- **权限是命门**：`~/.ssh` 700、`authorized_keys` 600、私钥 600。过松则 sshd 静默拒绝。
- **ssh-agent**：常驻进程持有解密后的私钥，会话内免输 passphrase。`ssh-add` 加载、`-l` 列出、`-D` 清空。
- **`~/.ssh/config`**：`Host` 别名 + `HostName`/`User`/`Port`/`IdentityFile` 消除重复参数；`ProxyJump` 多跳；`LocalForward` 自动隧道。
- **多账号**：用 `-f` 生成不同文件名的密钥，config 里按 `Host` 分别指定 `IdentityFile`。

## 一、ssh-keygen 详解

`ssh-keygen` 生成密钥对，是 SSH 免密的第一步：

```bash
# 基础：生成 ed25519（首选）
ssh-keygen -t ed25519 -C "alice@laptop-2026"

# 指定输出文件（多账号区分）
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_work -C "work"

# 老系统兼容：RSA-4096
ssh-keygen -t rsa -b 4096 -C "legacy"

# 改已有私钥的 passphrase
ssh-keygen -p -f ~/.ssh/id_ed25519

# 从私钥重新导出公钥（公钥文件丢了时）
ssh-keygen -y -f ~/.ssh/id_ed25519 > ~/.ssh/id_ed25519.pub
```

### 1.1 算法选型：为什么 ed25519 优于 RSA

| 维度 | ed25519 | RSA-2048 | RSA-4096 |
| --- | --- | --- | --- |
| 公钥长度 | ~68 字符 | ~372 字符 | ~716 字符 |
| 安全性 | 等价 RSA-3072+ | 渐显不足 | 安全但臃肿 |
| 签名/验证速度 | 快 | 中 | 慢 |
| 抗量子前景 | 较好 | 差 | 差 |
| 兼容性 | 较新系统（OpenSSH 6.5+，2014） | 全部 | 全部 |

- **ed25519** 基于 Ed25519 椭圆曲线，密钥短、运算快、安全性高，是 2014 年后 OpenSSH 的**官方推荐**。
- **RSA** 是老牌算法，兼容性最好（老旧服务器/嵌入式设备只认 RSA）。若必须用 RSA，选 `-b 4096`（2048 已显不足）。**新项目永远首选 ed25519**。

### 1.2 passphrase 的取舍

- **设 passphrase**：私钥文件被加密，即使被盗也无法直接用（需 passphrase 解密）。多一层保护，推荐。
- **不设 passphrase**：方便（自动化脚本无需交互输密码），但私钥一旦泄露即被滥用。仅用于受控的 CI/自动化场景，且密钥权限要严格。
- **改 passphrase**：`ssh-keygen -p -f ~/.ssh/id_ed25519`，不需重新生成密钥。

### 1.3 生成的文件

- **私钥** `~/.ssh/id_ed25519`：机密，权限必须 600，**永远不要**上传服务器/提交 Git/发聊天。
- **公钥** `~/.ssh/id_ed25519.pub`：可公开（内容就是一行 `ssh-ed25519 AAAA... comment`），复制到目标服务器的 `~/.ssh/authorized_keys`。
- **指纹**：`ssh-keygen -lf ~/.ssh/id_ed25519.pub` 看公钥指纹（SHA256:...），用于首次连接时核对服务器 host key。

## 二、部署公钥与权限

### 2.1 ssh-copy-id

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p 2222 user@host   # 指定端口
```

`ssh-copy-id` 自动完成：把本地公钥追加到远程 `~/.ssh/authorized_keys`，并确保 `~/.ssh` 与 `authorized_keys` 权限正确（700/600）。这是部署公钥最省事的方式。

### 2.2 权限要求（最易踩的坑）

| 路径 | 权限 | 说明 |
| --- | --- | --- |
| `~/.ssh/` | 700 | 仅属主可读写执行 |
| `~/.ssh/id_ed25519`（私钥） | 600 | 仅属主可读写 |
| `~/.ssh/authorized_keys` | 600 | 仅属主可读写 |
| `~/.ssh/config` | 600 | 仅属主可读写 |
| `~/.ssh/known_hosts` | 644 | 可被读但只属主写 |

- **为什么严格**：SSH 的 `sshd` 检测到 `.ssh` 或 `authorized_keys` 权限过松（如组/其他用户可读），会**静默拒绝**密钥认证——不报错、不记详细日志，直接回退到密码认证。你看到的现象是「密钥明明配好了却还要输密码」，查半天找不到原因，根因往往是权限。
- **修正**：`chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_ed25519 ~/.ssh/config`。

## 三、ssh-agent 与 ssh-add

### 3.1 工作机制

```
┌─────────────┐    SSH_AUTH_SOCK     ┌─────────────┐
│   ssh 客户端 │ ───────────────────→ │  ssh-agent   │
│  (不读私钥)  │   请求签名 challenge │ (持有解密的  │
│             │ ←─────────────────── │   私钥，签名)│
└─────────────┘   返回签名结果       └─────────────┘
```

- **启动 agent**：`eval "$(ssh-agent -s)"`。`eval` 是为了把 agent 输出的 `SSH_AUTH_SOCK`/`SSH_AGENT_PID` 环境变量导入当前 shell。
- **加载私钥**：`ssh-add ~/.ssh/id_ed25519`（会问一次 passphrase，之后 agent 持有解密的私钥）。
- 之后所有 `ssh`/`scp`/`git` 操作，客户端自动通过 `SSH_AUTH_SOCK` 找 agent 签名，不再读私钥文件、不再问 passphrase。

### 3.2 常用命令

```bash
ssh-add ~/.ssh/id_ed25519          # 加载私钥（问一次 passphrase）
ssh-add -l                          # 列出已加载密钥的指纹
ssh-add -L                          # 列出已加载密钥的完整公钥
ssh-add -D                          # 删除所有已加载密钥
ssh-add -d ~/.ssh/id_ed25519        # 删除指定密钥
ssh-add -t 3600 ~/.ssh/id_ed25519   # 加载但 3600 秒后自动过期
```

### 3.3 持久化（重启不丢）

- **macOS**：`ssh-add --apple-use-keychain ~/.ssh/id_ed25519` 把 passphrase 存进系统钥匙串，并在 `~/.ssh/config` 写 `UseKeychain yes`，重启后自动加载。
- **Linux**：`~/.ssh/config` 写 `AddKeysToAgent yes`，首次使用时自动加入 agent；桌面环境（GNOME Keyring/KWallet）通常已内置 agent。

### 3.4 ForwardAgent 的风险

`ForwardAgent yes`（或 `-A`）把本地 agent 转发到远程——在远程机器上也能用你本地的私钥签名（用于从跳板机再 git pull 等场景）。**风险**：如果远程机器的 root 是恶意的，它能借用你的 agent 签名（盗用你的身份）。**铁律**：只在可信机器上开启 agent 转发，**绝不**在不可信的共享/第三方服务器开 `-A`。

## 四、~/.ssh/config 详解

### 4.1 基础结构

```
Host 别名
    指令1 值1
    指令2 值2
```

`Host` 起一个块，下面的指令对匹配该别名的连接生效。多个 `Host` 块依次排列。

### 4.2 常用指令

| 指令 | 作用 | 示例 |
| --- | --- | --- |
| `Host` | 别名（支持通配符 `*`/`?`） | `Host prod` |
| `HostName` | 真实地址 | `HostName 10.0.0.5` |
| `User` | 登录用户 | `User deploy` |
| `Port` | 端口 | `Port 2222` |
| `IdentityFile` | 私钥文件 | `IdentityFile ~/.ssh/work_key` |
| `ProxyJump` | 跳板机（经它连目标） | `ProxyJump bastion` |
| `LocalForward` | 连上后建本地转发 | `LocalForward 5432 db:5432` |
| `RemoteForward` | 连上后建反向转发 | `RemoteForward 8080 localhost:80` |
| `ForwardAgent` | 转发 agent（慎用） | `ForwardAgent no` |
| `ServerAliveInterval` | 保活探测间隔 | `ServerAliveInterval 60` |
| `AddKeysToAgent` | 首次使用自动加入 agent | `AddKeysToAgent yes` |

### 4.3 实战配置示例

```
# 默认（所有 Host 兜底）
Host *
    AddKeysToAgent yes
    ServerAliveInterval 60        # 60s 发保活包，防断连

# 跳板机
Host bastion
    HostName jump.company.com
    User deploy
    IdentityFile ~/.ssh/id_ed25519

# 经跳板机连内网机器（ProxyJump）
Host db-internal
    HostName 10.0.1.20
    User dbadmin
    ProxyJump bastion             # 先 ssh bastion，再从 bastion 连目标
    LocalForward 5432 localhost:5432   # 连上后本地 5432 映射到远程 5432

# GitHub（多账号用不同 key）
Host github.com-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work

Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
```

- **ProxyJump vs 老的 ProxyCommand**：`ProxyJump bastion` 是 OpenSSH 7.3+（2016）的简洁写法，等价于老的 `ProxyCommand ssh bastion -W %h:%p`，优先用前者。
- **通配符 Host**：`Host internal-*` 匹配所有 `internal-` 开头的别名，配合 ProxyJump 让一批内网机器都走跳板机，省去逐个写。
- **GitHub 多账号**：因为 GitHub 用同一 `HostName`（github.com）但不同账号，靠不同 `Host` 别名（`github.com-work`）区分，clone 时用别名 `git clone git@github.com-work:org/repo.git`。

## 下一步

密钥与配置讲完后，下一个核心专题是[隧道与端口转发](./tunneling)——`-L`/`-R`/`-D` 三种转发的方向语义与实战场景。
