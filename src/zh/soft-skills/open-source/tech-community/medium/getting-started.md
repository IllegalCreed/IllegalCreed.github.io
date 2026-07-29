---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Medium 官方 Help Center（help.medium.com）与平台公告编写 —— 注册 / 写作 / Partner Program / Publication / 自定义域名

## 速查

- 注册：邮箱 / Google / Apple / X（Twitter）登录，免费即可阅读公开文章
- 会员：$5/月 或 $50/年，解锁全部会员文章 + 音频朗读；非会员每月限读 3 篇会员文章
- Partner Program：必须是会员才能加入；收入按「会员读者阅读时长」分配 + 2026-02-17 起新增「读者转会员推荐奖励」
- 写作：点击头像 → Write，编辑器为所见即所得 Markdown 风格，支持代码块、引用、图片、Series
- 付费墙：发文时勾选「Metered story（paywall）」即可，文章对非会员锁住部分内容
- Publication（出版物）：Settings → Publications → New publication，多作者协作的子站点
- 自定义域名：会员可在 Publication 设置里绑定自有域名（如 `blog.acme.com`）
- Boost：由 100+ 名人工 Boost 提名人评审提名，优质文章获算法加权分发
- 分发等级：Not eligible / On platform / Network / Boosted（流量递增）
- AI 政策：2024-05 起 AI 生成内容不得进入付费墙、不参与 Partner Program 分成
- 导出：Settings → Export 下载你的文章归档（HTML / Markdown）
- 国际化：几乎纯英文平台，中文生态弱，国内访问需翻墙

## Medium 是什么

Medium 是一个**面向严肃长文写作者的内容平台**，介于「个人博客」与「在线杂志」之间。它的定位与同类平台形成清晰对照：

| 维度 | Medium | dev.to | Substack | WordPress.com |
|---|---|---|---|---|
| 定位 | 付费墙长文社区 | 免费开源开发者社区 | 邮件订阅 + 博客 | 自建博客 SaaS |
| 是否开源 | **闭源** | **开源（Forem）** | 闭源 | 部分开源 |
| 商业模式 | $5/月会员分成 | 完全免费 / 赞助 | 订阅抽成 10% | 套餐订阅 |
| 创作者收入 | Partner Program 阅读时长分成 | 无直接分成 | 订阅收入 90% | 自营 |
| 技术内容占比 | 中等（Technology 是大类） | **极高** | 低（多为评论 / 行业） | 自定 |
| 自定义域名 | 会员可绑定 Publication | 否 | 付费可用 | 套餐支持 |
| 中文友好 | 弱 | 弱（英文为主） | 弱 | 好 |

**核心结论**：Medium = 「**付费墙 + Partner Program 分成 + Publication + 自定义域名**」，适合希望用英文长文获得稳定收入的写作者；纯技术教程类内容更适合 dev.to / 个人博客。

## 注册与会员

### 注册

访问 [medium.com](https://medium.com/)，用邮箱 / Google / Apple / X 登录即可，免费账号可阅读所有公开文章。

### 升级会员

进入 [medium.com/membership](https://medium.com/membership)：

- **$5/月** 或 **$50/年**（年付省 ~17%）
- 解锁全部会员专享文章
- 解锁音频朗读（部分文章）
- 获得加入 Partner Program 的资格（必须先成为会员）
- 获得自定义域名等 Publication 高级功能

> 注意：会员费池会按「会员阅读时长」分配给所有参与 Partner Program 的作者——也就是说，你交的 $5 大部分会流向你读过的文章的作者。

## 写第一篇文章

点击右上角头像 → **Write**，进入编辑器。

### 编辑器速览

| 元素 | 输入 |
|---|---|
| 大标题 | `# 标题` |
| 小标题 | `## 二级` / `### 三级` |
| 加粗 / 斜体 | `**粗**` / `*斜*` |
| 代码块 | <code>```</code> + 语言名 |
| 行内代码 | <code>`code`</code> |
| 引用 | `> 引用` |
| 图片 | 拖拽 / 粘贴到编辑器 |
| 分割线 | `---` |
| Series（系列） | 发文时勾选「Add to series」 |

### 设置付费墙

发文界面右侧齿轮里勾选 **Metered story（paywall it）**：

- 文章对非会员显示前几段后锁住
- 非会员每月只能读 3 篇付费墙文章
- 付费墙文章才参与 Partner Program 分成

> 技术 API 文档 / 教程类内容**不建议**上付费墙——开放访问能获得更多搜索流量与引用。

## 加入 Partner Program

进入 [medium.com/creator-earnings](https://medium.com/me/partner-program）：

1. 必须先成为付费会员（$5/月）
2. 绑定 Stripe 收款账户（需支持的国家 / 地区）
3. 选择参与分成的文章（可逐篇勾选）
4. 每月 8-15 日发放上月收入到 Stripe

### 收入如何计算

- **会员阅读时长**：会员读者在你文章上停留的时间越长，你从会员费池分到的比例越高
- **互动加权**：点赞、评论、阅读完成率会提升分成权重
- **2026-02-17 推荐奖励**：当非会员读者读完你付费墙文章后购买会员，你额外获得一次性推荐奖金
- **AI 内容禁令**：2024-05 起 AI 生成内容不得参与分成

## 创建 Publication（出版物）

适合多人协作或公司技术博客。

### 步骤

1. 头像 → **Settings** → **Publications** → **New publication**
2. 设置名称、描述、Logo、导航
3. 邀请其他作者加入（Editor / Writer / Draft author 角色）
4. 在 Publication 里发文，文章会聚合到 Publication 页面

### Publication 适用场景

- 公司技术博客（如 Stripe、Airbnb engineering）
- 开源项目布道站点
- 多人协作的主题专栏（如 *Better Programming*、*Towards Data Science*）

## 绑定自定义域名

会员可把 Publication 绑定到自有域名：

1. Publication 设置 → **Custom domain**
2. 输入域名（如 `blog.acme.com`）
3. 按提示在 DNS 添加 CNAME 记录
4. Medium 自动签发 HTTPS 证书

绑定后访问 `blog.acme.com` 即看到你的 Publication，文章 URL 也变成你的域名下。

## Boost 与分发

| 分发等级 | 流量 |
|---|---|
| Not eligible | 不进入推荐流 |
| On platform | 仅关注者可见 |
| Network | 进入主题推荐流 |
| **Boosted** | 算法加权，大幅推送给更多读者 |

Boost 由 100+ 名人工 **Boost 提名人**评审，提名标准包括：原创性、深度、研究质量、可读性。2026 年起 Boost 提名计划升级为 **Editor Partner Program**，编辑对参与的文章都能获得分成。

## 下一步

入门到此为止——你已经能注册会员、写作、加入 Partner Program 获得收入、创建 Publication 并绑定域名。下一章 `guide-line.md` 深入讲 **创作策略 / 付费墙取舍 / Publication 运营 / Boost 投递技巧 / 与 dev.to / Substack 对比**等核心主题。
