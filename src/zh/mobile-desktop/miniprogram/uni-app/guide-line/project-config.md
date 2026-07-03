---
layout: doc
outline: [2, 3]
---

# uni-app 工程配置：pages.json 与 manifest.json

> 基于 uni-app 5.x（uni-app x）· 核于 2026-07

## 速查

- **`pages.json` = 页面路由 + 全局窗口 + TabBar + 分包**的中枢，**不是 Vue Router**；`pages` 数组**首项即首页**，每项 `path` + `style`
- **顶层 key**：`pages`（必填）｜ `globalStyle`（全局窗口/导航栏默认）｜ `tabBar`（原生底部/顶部 tab，2–5 项，支持 `midButton`）｜ `subPackages`（小程序**分包**，`root`+`pages`）｜ `preloadRule`（分包预载）｜ `condition`（开发期直达调试页）｜ `easycom`（组件自动引入规则）｜ `topWindow`/`leftWindow`/`rightWindow`（H5 大屏三栏）
- **`manifest.json` = 应用级配置**：`name`/`appid`/`versionName`/`versionCode`/**`vueVersion`（"2"/"3"）**，以及 `app-plus`/`h5`/`mp-weixin` 等**各端差异化**子块
- **App 端**：`app-plus` 管启动图（`splashscreen`）、模块权限（`modules`）、SDK、签名；导航栏可用 `app-plus.titleNView` 深度定制
- **H5 端**：`h5.router.mode`（`hash`/`history`）、`publicPath`、dev server
- **各小程序端**：`mp-weixin`/`mp-alipay`/… 各自的 appid、ES6 转译、分包优化开关
- **JSON 里也能条件编译**（注释用 `//`）；**注意 JSON 不能有重复 key、不能有尾逗号**（详见[条件编译](./conditional-compile)）
- **TabBar 图标**：`iconPath`/`selectedIconPath` 用本地图片；`color`/`selectedColor` 控文字色

## 一、pages.json：页面与全局体验的中枢

`pages.json` 是 uni-app 独有的全局配置（**不是 Vue Router**），一处集中声明：**有哪些页面、每页导航栏长什么样、底部 TabBar、分包、大屏布局**。

```json
{
  "globalStyle": {
    "navigationBarTitleText": "标题",
    "navigationBarBackgroundColor": "#F8F8F8",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#FFFFFF"
  },
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "首页" } },
    { "path": "pages/detail/detail", "style": { "navigationBarTitleText": "详情" } }
  ],
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#007aff",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "static/tab-home.png", "selectedIconPath": "static/tab-home-active.png" },
      { "pagePath": "pages/mine/mine", "text": "我的", "iconPath": "static/tab-mine.png", "selectedIconPath": "static/tab-mine-active.png" }
    ]
  },
  "subPackages": [
    { "root": "pkgA", "pages": [ { "path": "list/list" } ] }
  ],
  "easycom": {
    "autoscan": true,
    "custom": { "^uni-(.*)": "@/components/uni-$1/uni-$1.vue" }
  }
}
```

### 顶层字段一览

| 字段 | 作用 |
| --- | --- |
| **`pages`** | 必填。页面数组，**首项为首页**；每项含 `path` 与页面级 `style` |
| **`globalStyle`** | 全局窗口/导航栏默认样式，页面 `style` 可覆盖 |
| **`tabBar`** | 原生底部（或顶部）tab，**2–5 项**；支持 `midButton`（中间凸起按钮）、`color`/`selectedColor`、图标 |
| **`subPackages`** | 小程序**分包**，每项 `root` + 该包下 `pages`，控制主包体积 |
| **`preloadRule`** | 分包预载规则（进入某页时预下载指定分包） |
| **`condition`** | 开发期直达指定页（含参），方便调试深链 |
| **`easycom`** | 组件自动引入规则：`autoscan` + `custom` 正则映射 |
| **`topWindow` / `leftWindow` / `rightWindow`** | H5 大屏三栏布局（宽屏适配） |

### 页面级 style 常用项

- `navigationBarTitleText`：导航栏标题；`navigationStyle: "custom"` 去掉原生导航栏自绘。
- `enablePullDownRefresh`：开启下拉刷新（配合页面周期 `onPullDownRefresh`）。
- `onReachBottomDistance`：触底距离（配合 `onReachBottom`）。
- `backgroundColor` / `backgroundTextStyle`：下拉区背景与 loading 文字色。

> App 端可用 `style.app-plus.titleNView` 对原生导航栏做深度定制（按钮、透明渐变、内嵌搜索框等）。

## 二、manifest.json：应用级与各端差异

`manifest.json` 管**整个应用**的身份与各端差异化配置。

| 分块 | 关键字段 |
| --- | --- |
| **基础** | `name`（应用名）、`appid`（DCloud 云端标识）、`description`、`versionName`（如 `"1.0.0"`）、`versionCode`（数字）、**`vueVersion`（`"2"`/`"3"`）** |
| **`app-plus`（App）** | 启动图/闪屏 `splashscreen`、模块权限 `modules`（蓝牙/地图/支付等）、第三方 SDK、分发签名、`nvueCompiler` 等 |
| **`h5`** | 路由 `router.mode`（`hash`/`history`）、`publicPath`、dev server、自定义模板 |
| **`mp-weixin` / `mp-alipay` / `mp-baidu`…** | 各端 appid、ES6 转译、压缩、分包优化开关 |
| **其他** | 请求超时（默认 60s）、`uniStatistics`（统计）、屏幕方向、隐私声明 |

```json
{
  "name": "my-app",
  "appid": "__UNI__XXXXXXX",
  "description": "示例应用",
  "versionName": "1.0.0",
  "versionCode": 100,
  "vueVersion": "3",
  "app-plus": {
    "splashscreen": { "alwaysShowBeforeRender": true },
    "modules": {},
    "distribute": {}
  },
  "h5": {
    "router": { "mode": "hash" },
    "publicPath": "/"
  },
  "mp-weixin": {
    "appid": "wxXXXXXXXXXXXX",
    "setting": { "es6": true, "minified": true }
  }
}
```

## 三、和条件编译配合

`pages.json` / `manifest.json` 都是 JSON，但也支持条件编译，注释用 `//`：

```json
{
  "pages": [
    { "path": "pages/index/index" }
    // #ifdef MP-WEIXIN
    , { "path": "pages/wx-only/wx-only" }
    // #endif
  ]
}
```

两个坑（配置文件里尤其致命）：

- **JSON 不能有重复 key**：条件块两侧不要各写一个同名 key。
- **JSON 不能有尾逗号**：条件块拼接时注意逗号位置（如上例把逗号放在条件项行首）。

平台常量全表与更多语法见[条件编译](./conditional-compile)；`uni.scss` 全局变量、组件与 API 的用法见 [API 与组件](./api-components)。
