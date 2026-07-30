# 隐私政策

最近更新：2026 年 7 月 30 日

本政策适用于个人网站 `illegalscreed.cn`、算法可视化站
`algo.illegalscreed.cn`、IllegalCreed Quiz 问答站 `quiz.illegalscreed.cn`
和第一阶段 Type Pal 游戏站 `pal.illegalscreed.cn`。

## 处理的信息

四个产品分别使用四个独立的 Google Analytics 4 属性了解汇总页面访问情况。
IllegalCreed Quiz 还可能使用独立的百度统计覆盖国内流量。只有在你于站内统计提示中
选择“允许”后，站点才会加载对应分析脚本。允许后，供应商可能根据各自政策处理经过
清洗的页面 URL、浏览器和设备特征、大致位置、来源页面，并使用 Cookie 或类似标识符。

四个产品只发送标准页面浏览事件。发送给 Analytics 的页面 URL 会移除任意查询参数
和 hash；只有经过校验的 `utm_source`、`utm_medium`、`utm_campaign` 和
`utm_content` 渠道参数可以保留。搜索词、算法输入、播放、测验、分享及其他交互
不会作为自定义 Analytics 事件发送。Type Pal 也不会把按键、场景、战斗、游戏进度、
存档、角色、性能数据或错误作为 Analytics 事件发送。IllegalCreed Quiz 不会向
Analytics 发送题目、所选答案、账号标识或分类偏好；Quiz 属性已关闭 GA4 Enhanced
Measurement。

Type Pal 使用浏览器 IndexedDB 在本地保存游戏存档，并可能在本地保存音量等设置。
这些本地游戏数据不会进入 Analytics 页面浏览事件。

IllegalCreed Quiz 可作为游客使用，也提供可选账号。账号记录可能包含用户名、密码哈希，
以及你主动提供的可选昵称或邮箱。游客答题不会保存答题历史；登录后，为提供历史与学习
偏好功能，服务端会保存题目 ID、所选答案、正误、时间和分类偏好。浏览器本地可能保存
登录令牌、游客分类选择、主题、提示偏好和访问统计选择。

Quiz 标签页为接收公告保持连接时，服务会在服务器内存中临时处理每个标签页的客户端
ID、IP、登录状态和当前 pathname；不包含查询参数，连接断开后从在线列表移除。
通用操作日志还可能为安全与故障排查包含答题提交和结果元数据、IP、请求路径、成功状态
与时间；它与登录后的答题历史功能分开保存。

算法可视化站已准备接入 Google AdSense。广告审核通过并启用后，Google 及其广告
合作伙伴可能使用 Cookie 或类似标识符投放、衡量和保护广告。个人主页本身不加载
AdSense 广告脚本。IllegalCreed Quiz 在广告设置和认证同意路径尚未启用时也不加载
AdSense 脚本。

Web 服务器可能为安全和运行故障排查临时处理标准请求日志，包括 IP 地址、User-Agent、
请求路径、响应状态和时间。个人站、算法可视化站和第一阶段 Type Pal 当前不提供账号
注册或评论功能；IllegalCreed Quiz 提供上文所述的可选账号。

## 广告选择与同意

你可以在四个产品上接受、拒绝或之后重新打开“隐私设置”；拒绝时不会加载对应分析
供应商。IllegalCreed Quiz 和 Type Pal 在没有已存选择且检测到 DNT/GPC 浏览器信号时
默认拒绝，除非你之后明确允许。你也可以在
[Google 广告设置](https://adssettings.google.com/)中
查看或修改广告个性化设置，或安装
[Google Analytics 停用浏览器插件](https://tools.google.com/dlpage/gaoptout)。

在欧洲经济区、英国、瑞士等依法需要同意的地区启用个性化广告前，站点会通过
AdSense 的“隐私权和消息”使用 Google 认证的同意管理平台。

## 外部服务

项目链接可能跳转到 GitHub 或其他独立运营的网站。离开本域名后，应以对应网站的
隐私政策为准。

## 联系

隐私问题可在
[个人站仓库](https://github.com/IllegalCreed/IllegalCreed.github.io/issues)
创建 Issue。请勿在公开 Issue 中提交敏感个人信息。
