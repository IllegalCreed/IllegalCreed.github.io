---
layout: doc
outline: [2, 3]
---

# 入门：百度智能小程序是什么与怎么起步

> 基于百度智能小程序（SWAN）· 核于 2026-07

## 速查

- **一句话**：百度旗下、跑在**百度 App 内**的小程序平台，用自研 **SWAN 框架**（模板语言 SWAN，指令前缀 `s-`，源出百度 San.js）编写，靠**百度搜索 / 信息流分发** + 深度 **AI 能力**差异化
- **与微信的关系**：结构高度类微信（三段式文件、`App`/`Page`/`Component`、生命周期、`bind` 事件全对应），**微信开发者几乎零门槛迁移**；差异集中在「后缀 / 指令前缀 / API 前缀 / 分发方式」四点
- **四点差异记忆**：模板后缀 **`.swan`**（微信 `.wxml`）、样式后缀 **`.css`**（微信 `.wxss`）、指令 **`s-`**（微信 `wx:`）、API **`swan.*`**（微信 `wx.*`）
- **起步**：装**百度开发者工具**（Baidu 开发者工具，2.27+）→ 用百度账号登录 → 新建项目填 AppID → 内置模板即可预览 / 真机调试
- **文件结构**：全局 `app.js` / `app.json` / `app.css` + `project.swan.json`；页面 = `index.swan`（模板）+ `index.css`（样式）+ `index.js`（逻辑）+ `index.json`（配置）四文件
- **核心组件**：`view` / `text` / `image` / `scroll-view` / `swiper` / `button` / `input` 等，基本对齐微信；响应式单位用 **`rpx`**
- **样式**：写 `.css`（不是微信的 `.wxss`），语法即 CSS + `rpx`，无 CSS 预处理级联黑魔法
- **现状提醒**：平台处于**收缩 / 维护期**，投入远不及微信，新项目不建议以百度为主战场；官方站仍在线、**未正式停运**（详见[现状定位与迁移](./guide-line/status-vs-wechat)）
- **进阶顺序**：先读 [SWAN 框架与模板](./guide-line/swan-framework) 吃透 `s-` 指令与生命周期 → 再读 [API 与分发](./guide-line/api-distribution) 掌握 `swan.*` 与搜索分发

## 一、百度智能小程序解决什么问题

百度智能小程序（Baidu Smart Mini Program）是**跑在百度 App 内的小程序平台**，回答的问题与微信小程序类似：**让用户无需安装、扫码 / 搜索即达地用上一个轻应用**。它由百度在 2018 年 7 月的 Create 大会推出，两个月 MAU 破亿。

与微信小程序不同的是，百度把自己的两张王牌嵌进了这个平台：

- **搜索 / 信息流分发**：百度是搜索引擎，小程序可以被搜索收录、出现在自然结果里，用户搜完整名称能出「寻址单卡」，甚至语音说「名称 + 小程序」直达——这是区别于微信「社交裂变」的核心流量模型。
- **深度 AI 能力**：通过 `swan.ai.*` 直接调用百度的 OCR、人脸、语音、图像识别等 AI 接口，这是百度在 AI 上的积累变现到小程序侧的差异化。

技术上，它采用百度自研的 **SWAN 框架**，模板语言称 SWAN，指令前缀 `s-` 源自百度自研的 San.js。但整体开发心智**高度贴近微信小程序**，微信开发者迁移几乎零门槛。

## 二、和微信小程序是什么关系

如果你会微信小程序，就已经会了百度智能小程序的一大半。两者的**文件模型、构造器、生命周期、事件系统几乎一一对应**，差异集中在四个「换名字」的点上：

| 维度 | 百度智能小程序 | 微信小程序 |
| --- | --- | --- |
| 模板后缀 | **`.swan`** | `.wxml` |
| 样式后缀 | **`.css`** | `.wxss` |
| 指令前缀 | **`s-`**（`s-if` / `s-for` / `s-key`） | `wx:`（`wx:if` / `wx:for` / `wx:key`） |
| API 前缀 | **`swan.*`** | `wx.*` |
| 事件绑定 | `bind` / `catch` + 全小写事件名 | 同左 |
| 生命周期 | `onLaunch` / `onShow` / `onLoad` / `onReady`… | 同左 |
| 响应单位 | `rpx` | `rpx` |

正因为结构同构，百度官方还提供了 `wx2swan` 迁移工具帮你把微信项目批量转成 SWAN（细节与坑点见[现状定位与迁移](./guide-line/status-vs-wechat)）。真正需要重新学习的，是 SWAN 的 `s-` 指令语法、`swan.ai.*` AI 能力与搜索分发机制。

## 三、怎么起步：百度开发者工具

百度智能小程序的开发入口是官方 **百度开发者工具**（Baidu 开发者工具，版本 2.27 及以上）：

1. 到智能小程序平台（`smartprogram.baidu.com`）注册开发者账号、创建小程序、拿到 **AppID**。
2. 下载安装百度开发者工具，用百度账号扫码登录。
3. 新建项目，填入 AppID（或选无 AppID 体验模式），选内置模板。
4. 工具内自带**模拟器预览 + 真机调试**，改代码即时刷新。

新建后你会得到一套和微信几乎一样的目录：

```
project/
├─ app.js            # 全局逻辑（App()）
├─ app.json          # 全局配置（页面路由、window、tabBar…）
├─ app.css           # 全局样式（微信为 app.wxss）
├─ project.swan.json # 项目配置（微信为 project.config.json）
└─ pages/
   └─ index/
      ├─ index.swan  # 页面模板（微信为 index.wxml）
      ├─ index.css   # 页面样式（微信为 index.wxss）
      ├─ index.js    # 页面逻辑（Page()）
      └─ index.json  # 页面配置
```

## 四、第一个页面

模板写在 `.swan` 里，用 `s-` 指令做条件 / 列表，用双大括号做数据插值；逻辑写在 `.js` 里，用 `Page()` 构造器 + `setData` 更新数据。

```html
<!-- pages/index/index.swan -->
<view class="wrap">
  <view s-if="show">Hello {{ name }}</view>
  <view s-for="item in list" s-key="id">{{ item.text }}</view>
  <button bind:tap="onTap">点我</button>
</view>
```

```javascript
// pages/index/index.js
Page({
  data: {
    show: true,
    name: 'swan',
    list: [{ id: 1, text: 'A' }, { id: 2, text: 'B' }],
  },
  onLoad(options) {
    // 页面加载，options 携带路由参数
  },
  onTap() {
    // 更新数据：与微信一致的 setData
    this.setData({ name: 'baidu' });
  },
});
```

```css
/* pages/index/index.css —— 就是 CSS + rpx，不是微信的 .wxss */
.wrap {
  padding: 32rpx;
  font-size: 28rpx;
}
```

两个入门要点先记住：**指令是 `s-` 前缀**（不是微信的 `wx:`），**样式文件是 `.css`**（不是 `.wxss`）；其余的 `Page` / `data` / `setData` / `bind:tap` 与微信完全一致。

## 五、核心组件与样式初识

内置组件基本对齐微信，常用的有：

| 类别 | 组件 |
| --- | --- |
| 视图容器 | `view` / `scroll-view` / `swiper` / `movable-view` / `cover-view` |
| 基础内容 | `text` / `icon` / `progress` / `rich-text` |
| 表单 | `button` / `input` / `checkbox` / `radio` / `switch` / `slider` / `picker` / `textarea` |
| 媒体 | `image` / `video` / `audio` / `camera` / `live-player` |
| 特殊 | `map` / `canvas` / `web-view` / `ad`（广告变现） |

样式方面，`.css` 就是标准 CSS 加上 **`rpx`** 响应式单位（1rpx = 屏宽 / 750），无需额外学习。

> 注：早期部分第三方跨端文档称「百度不支持 `rpx` / 循环模板」，这与官方框架文档矛盾——`rpx`、`s-for` 均受支持，该结论已过时，以官方为准。

## 六、心智地图：接下来读什么

- 想吃透 SWAN 的模板语法、`s-` 指令、`App` / `Page` / `Component` 与生命周期 → [SWAN 框架与模板](./guide-line/swan-framework)。
- 想掌握 `swan.*` API、`swan.ai.*` AI 能力与百度搜索 / 信息流分发 → [API 与分发](./guide-line/api-distribution)。
- 想了解平台现状、与微信的完整差异、`wx2swan` 迁移 → [现状定位与迁移](./guide-line/status-vs-wechat)。
- 速记表在 [参考](./reference)。
