---
layout: doc
outline: [2, 3]
---

# uni-app 条件编译

> 基于 uni-app 5.x（uni-app x）· 核于 2026-07

## 速查

- **三指令**：`#ifdef 平台`（if defined，**仅**该平台保留）｜ `#ifndef 平台`（**除**该平台外都保留）｜ `#endif`（结束）；条件支持 `||`（或）`&&`（与）`!`（非）
- **注释语法按文件类型走，写错就不生效**：JS/UTS/TS → `//`｜**CSS/SCSS/Less/Stylus → `/* */`（预处理器也必须用 `/* */`，不能用 `//`）**｜Vue/nvue/uvue template → `<!-- -->`｜pages.json/manifest.json → `//`
- **高频常量**：`H5`/`WEB`、`APP`/`APP-PLUS`、`APP-HARMONY`、`APP-ANDROID`/`APP-IOS`（**仅 uni-app x**）、`MP`（全部小程序）、`MP-WEIXIN`/`MP-ALIPAY`/`MP-BAIDU`/`MP-TOUTIAO`/`MP-QQ`/`MP-XHS`、`VUE2`/`VUE3`/`VUE3-VAPOR`、`UNI-APP-X`
- **传统版不能按 iOS/Android 分编译**：`APP-IOS`/`APP-ANDROID` **仅 uni-app x 支持**；传统版要区分手机系统得用 `uni.getSystemInfo()` **运行时判断**
- **`APP` 与 `APP-PLUS` 基本等价**（`APP-PLUS` 是历史命名），别把两者对立；CLI 打包脚本旧写法 `dev:app-plus`、新写法 `dev:app`
- **进阶**：`static/` 下建 `app/`、`web/`、`mp-weixin/` 等**平台子目录**只在对应端参与编译；`// #ifdef uniVersion > 3.9` 可按 HBuilderX 版本编译
- **JSON 里**：条件编译不能产生**重复 key** 或**尾逗号**

## 一、条件编译是什么

条件编译用**类 C 预处理指令**，在**同一份代码**里按平台裁剪，是 uni-app「一套代码跨端」的核心机制。三个指令：

- **`#ifdef 平台`**：if defined，**仅**指定平台保留这段代码。
- **`#ifndef 平台`**：if not defined，**除**指定平台外都保留。
- **`#endif`**：结束条件块。

条件表达式支持 `||`（或）、`&&`（与）、`!`（非），可组合多个平台常量。

## 二、按文件类型的注释语法（写错就不生效）

指令要**写在对应文件类型的注释里**，不同文件注释符不同，用错则整段失效：

| 文件 | 注释语法 | 示例 |
| --- | --- | --- |
| JS / UTS / TS | `//` | `// #ifdef APP-PLUS` |
| **CSS / SCSS / Less / Stylus** | **`/* */`** | `/* #ifdef MP-WEIXIN */`（**预处理器也必须用 `/* */`**，不能写 `//`） |
| Vue / nvue / uvue template | `<!-- -->` | `<!-- #ifdef H5 -->` |
| pages.json / manifest.json | `//` | 见下 |

```js
// JS / UTS
// #ifdef APP-PLUS
console.log('仅 App')
// #endif
// #ifndef H5
console.log('除 H5 外都有')
// #endif
// #ifdef MP-WEIXIN || MP-ALIPAY
uni.showModal({ title: '小程序专属' })
// #endif
```

```css
/* CSS / SCSS：条件编译必须用 /* */，即便在预处理器里 */
/* #ifdef MP-WEIXIN */
.only-wx { color: green; }
/* #endif */
```

```html
<!-- template：用 HTML 注释 -->
<!-- #ifdef H5 -->
<view>Web 专属内容</view>
<!-- #endif -->
```

```json
// pages.json / manifest.json 用 // 注释
{
  "pages": [
    { "path": "pages/index/index" }
    // #ifdef MP-WEIXIN
    , { "path": "pages/wx-only/wx-only" }
    // #endif
  ]
}
```

> **CSS 那条是高频错**：哪怕你用 SCSS/Less，条件编译注释也只能是 `/* */`，写成 `//` 不生效。

## 三、平台常量全表

| 常量 | 平台 | 备注 |
| --- | --- | --- |
| `VUE2` / `VUE3` | Vue 版本 | 区分 Vue2/Vue3（HBuilderX 3.2.0+） |
| `VUE3-VAPOR` | Vapor 模式 | HBuilderX 5.0+ |
| `UNI-APP-X` | 项目类型 | uni-app x 项目（HBuilderX 3.9.0+） |
| `APP` | App 通用 | 任意 App 平台 |
| `APP-PLUS` | App | **历史命名，与 `APP` 基本等价**，勿对立 |
| `APP-NVUE` / `APP-PLUS-NVUE` | nvue 页面 | App 端原生渲染页 |
| `APP-ANDROID` / `APP-IOS` | 安卓 / iOS | **仅 uni-app x 支持**按系统分编译；传统版不支持，需运行时判断 |
| `APP-HARMONY` | 鸿蒙 App | HarmonyOS Next |
| `H5` / `WEB` | 浏览器/Web | `WEB` 为 3.6.3+ 别名 |
| `MP-WEIXIN` | 微信小程序 | |
| `MP-ALIPAY` | 支付宝小程序 | |
| `MP-BAIDU` | 百度小程序 | |
| `MP-TOUTIAO` | 抖音/字节小程序 | |
| `MP-LARK` | 飞书小程序 | |
| `MP-QQ` | QQ 小程序 | |
| `MP-KUAISHOU` | 快手小程序 | |
| `MP-JD` | 京东小程序 | |
| `MP-360` | 360 小程序 | |
| `MP-XHS` | 小红书小程序 | |
| `MP-HARMONY` | 鸿蒙元服务 | HBuilderX 4.34+ |
| `MP` | 所有小程序 | 覆盖全部 MP 平台 |
| `QUICKAPP-WEBVIEW` / `-UNION` / `-HUAWEI` | 快应用 | 通用/联盟/华为 |

## 四、进阶用法

- **平台子目录**：`static/` 下建 `app/`、`web/`、`mp-weixin/` 等子目录，其中的资源**只在对应端参与编译**；根目录 `platforms/` 可整页分平台。
- **按版本编译**：`// #ifdef uniVersion > 3.9` 可按 HBuilderX 版本条件编译。
- **组合条件**：`// #ifdef MP-WEIXIN || MP-QQ`、`// #ifndef H5 && APP-PLUS` 等。

## 五、易错点

1. **传统版不能按 iOS/Android 条件编译**：`APP-IOS`/`APP-ANDROID` **仅 uni-app x 支持**。传统 uni-app 想区分手机系统，要在运行时用 `uni.getSystemInfo()` 判断 `platform`，而不是靠条件编译。

```js
// 传统版区分 iOS/Android：运行时判断，不能用条件编译
const { platform } = uni.getSystemInfoSync()
if (platform === 'ios') { /* ... */ }
```

2. **CSS 条件编译必须 `/* */`**：SCSS/Less/Stylus 里也一样，写 `//` 不生效。
3. **`APP` 与 `APP-PLUS` 基本等价**：`APP-PLUS` 是历史命名（源自「App(基于 HTML5+/JS 引擎)」），当前文档二者基本等价，别把它们当作两个对立平台；CLI 脚本旧写法 `dev:app-plus`、新写法 `dev:app`。
4. **JSON 别产生重复 key / 尾逗号**：条件块两侧不要各写同名 key；拼接数组项注意逗号位置。
5. **条件块内外都要语法合法**：同一模块别在多个条件分支里重复 `import`；需要时用「先 `let` 声明、各分支再赋值」的模式。

平台常量在打包脚本里也有对应（`dev:h5` / `dev:mp-weixin` / `dev:app`），配置文件里的条件编译见[工程配置](./project-config)；生命周期从哪引入见[生命周期](./lifecycle)。
