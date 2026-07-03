---
layout: doc
outline: [2, 3]
---

# 入门：抖音小程序是什么与怎么起步

> 基于抖音小程序（基础库 4.x）· 核于 2026-07

## 速查

- **一句话**：字节跳动小程序平台在抖音宿主里的形态；范式类微信，靠**内容公域**（短视频/直播/评论）分发
- **命名**：字节小程序（统称）＝抖音小程序（抖音宿主）＝头条小程序（早期）；官方域名 `developer.open-douyin.com`
- **宿主 4 端**：抖音、今日头条、今日头条极速版、抖音极速版（一套代码多宿主，能力按宿主有差异）
- **四文件**：`.ttml`（模板）/ `.ttss`（样式）/ `.js` / `.json`；脚本 `.sjs`；单位 `rpx`
- **对应微信记忆法**：`wx:`→`tt:`、`wxml/wxss`→`ttml/ttss`、`wx.`→`tt.`，其余大部分一致
- **但**：语法相似 ≠ 复制即用——**支付/登录/分享/音视频/用户信息**等生态 API 必须逐个适配
- **工具**：抖音开发者工具（旧称字节跳动开发者工具），4.5.4（2026-06，基础库 4.x）；支持构建 npm
- **迁移**：官方「搬家工具」/ `wx2tt` 批量改后缀 + 前缀，但生态 API 仍需手动适配

## 一、抖音小程序解决什么

抖音小程序让你用近似微信小程序的技术栈，把服务接入**字节系 App 的内容公域流量**：用户在刷短视频、看直播、逛评论时，可经**短视频挂载、直播小风车、评论锚点**等入口直达你的小程序，实现「内容 → 转化」的即时闭环。这与微信「社交私域、分享裂变、长期留存」的逻辑正好互补——是选型/生态类题的核心对比点。

## 二、命名与宿主（易混）

- **字节小程序 / 字节跳动小程序**：平台统称（官方文档、开发者工具都这么自称）。
- **抖音小程序**：跑在抖音宿主里的称呼；**头条小程序**是早期叫法（今日头条宿主）——同一套技术栈与开放平台。
- **宿主 App**：官方「流量入口」文档当前列 **4 端**——抖音、今日头条、今日头条极速版、抖音极速版。一套代码可多宿主上线，但部分 API 标「只支持抖音宿主」，跨宿主需判端降级。
- **域名沿革**：`microapp.bytedance.com`、`developer.toutiao.com`（旧）均导向 `developer.open-douyin.com`（现行）。

## 三、起步与四文件

用**抖音开发者工具**新建项目，一个页面通常 4 个同名文件：

```
pages/index/
├─ index.ttml   # 结构/模板（对应微信 .wxml）
├─ index.ttss   # 样式（对应微信 .wxss）
├─ index.js     # 逻辑（Page 构造器）
└─ index.json   # 页面配置
```

全局：`app.json`（pages / window / tabBar / 分包 / 域名白名单）+ `app.js` + `app.ttss`。样式单位用 `rpx`（同微信）。

## 四、最小页面

```js
// index.js
Page({
  data: { message: 'hello' },
  onLoad(options) {},
  handleTap() {
    this.setData({ message: 'clicked' }); // setData 是逻辑层→视图层唯一通道
  },
});
```

```html
<!-- index.ttml -->
<view tt:if="{{ message }}" bindtap="handleTap">{{ message }}</view>
<view tt:for="{{ list }}" tt:key="id">{{ item.name }}</view>
```

把微信心智里的 `wx:` 换成 `tt:`、`wx.` 换成 `tt.` 即可——但记住生态 API 要单独适配（见 [生态能力](./guide-line/features)）。

## 五、心智地图

- 语法细节 → [文件结构与视图层](./guide-line/structure)。
- API 与生命周期 → [API 与生命周期](./guide-line/api-lifecycle)。
- 登录/支付/抖音特色 → [生态能力](./guide-line/features)。
- 和微信到底差在哪 → [对比微信](./guide-line/vs-wechat)。
- 速记表 → [参考](./reference)。
