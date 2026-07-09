---
layout: doc
---

# Git

由 **Linus Torvalds 为 Linux 内核开发**而创建的**分布式版本控制系统（DVCS）**，以**快照（snapshot）而非差异（delta）** 记录历史、近乎所有操作**本地完成**，是当今版本控制的**绝对事实标准**（Stack Overflow 2025 调查中约 **94%** 开发者使用）。

## 评价

### 优点

- **分布式**：每个克隆都是完整仓库（含全部历史），离线即可提交 / 查历史 / 切分支，无单点依赖
- **快照模型 + 内容寻址**：每次提交是一棵完整文件树的快照，对象按内容的 SHA 哈希寻址，**完整性可校验、历史难篡改**
- **廉价的本地分支**：分支只是指向提交的可变指针，创建 / 切换 / 合并极快，催生了 feature branch / Pull Request 工作流
- **三区模型 + 暂存区**：工作区 / 暂存区（index）/ 仓库三段式，允许**精确构造每一次提交**（`git add -p` 分块暂存）
- **生态霸主**：GitHub / GitLab / Bitbucket、CI/CD、IDE、GUI 客户端全部围绕 Git 构建

### 缺点

- **学习曲线陡**：暂存区、detached HEAD、rebase vs merge、reset 三态等概念对新手不友好
- **命令行 UX 有历史包袱**：同一概念多个命令（`checkout` 身兼切分支 / 恢复文件，后才拆出 `switch` / `restore`），参数不统一
- **大文件 / 超大仓库偏弱**：二进制大文件需 Git LFS，超大 monorepo 需 partial clone / sparse-checkout / Scalar 等方案补强
- **子模块（submodule）体验差**：嵌套仓库管理繁琐、易踩坑

## 文档地址

[Git Reference / Pro Git](https://git-scm.com/doc)

## GitHub地址

[git/git](https://github.com/git/git)

## 幻灯片地址

<a href="/SlideStack/git-slide/" target="_blank">Git</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=git" target="_blank" rel="noopener noreferrer">Git 测试题</a>
