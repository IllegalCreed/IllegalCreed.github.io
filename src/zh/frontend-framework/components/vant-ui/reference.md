---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 **Vant 4.x**（v4.9.24+）的 API 速查——组件 props / events / slots / 命令式 API 签名 / Composables / TypeScript 类型 / CSS 变量入口。

## 组件分类速查表（80+ 组件）

### 基础组件（Basic）

| 标签 | 中文名 | 关键 Props |
|---|---|---|
| van-button | 按钮 | type / size / loading / icon / round / block / disabled / plain / hairline / square / color / url / to |
| van-cell | 单元格 | title / value / label / icon / is-link / to / center / size / clickable |
| van-cell-group | 单元格组 | title / inset / border |
| van-icon | 图标 | name / size / color / badge / class-prefix |
| van-image | 图片 | src / fit（contain/cover/fill/none/scale-down）/ width / height / lazy-load / round / show-error / show-loading |
| van-row / van-col | 栅格 | gutter / span / offset / justify / align |
| van-popup | 弹出层 | v-model:show / position（top/bottom/left/right/center）/ round / closeable / overlay / lock-scroll / safe-area-inset-bottom / destroy-on-close |
| van-style | 样式工具类 | （无组件、用 class）`van-hairline--top` `van-clearfix` 等 |

### 表单组件（Form）

| 标签 | 中文名 | 关键 Props |
|---|---|---|
| van-form | 表单 | validate-trigger / colon / disabled / readonly / show-error / scroll-to-error / label-align / label-width |
| van-field | 输入框 | v-model / type / label / placeholder / clearable / rules / disabled / readonly / required / max-length / show-word-limit / formatter / left-icon / right-icon / is-link |
| van-checkbox | 复选框 | v-model / disabled / shape（square/round）/ checked-color / icon-size / label-position |
| van-checkbox-group | 复选框组 | v-model / max / direction / disabled |
| van-radio | 单选 | name / disabled / icon-size |
| van-radio-group | 单选组 | v-model / direction / disabled |
| van-switch | 开关 | v-model / disabled / loading / size / active-color / inactive-color |
| van-stepper | 步进器 | v-model / min / max / step / disabled / disable-input / integer / decimal-length |
| van-rate | 评分 | v-model / count / size / color / void-icon / allow-half / readonly / disabled |
| van-slider | 滑块 | v-model / min / max / step / disabled / range（双滑块）/ active-color / button-size / vertical |
| van-search | 搜索框 | v-model / placeholder / background / shape（square/round）/ left-icon / clearable / action-text |
| van-uploader | 上传 | v-model / accept / multiple / max-count / max-size / preview-size / preview-image / before-read / after-read / disabled |
| van-picker | 选择器 | v-model / columns / columns-field-names / title / confirm-button-text / cancel-button-text / loading / readonly |
| van-picker-group | Picker 组 | title / tabs / next-step-text |
| van-date-picker | 日期选择器 | v-model / columns-type / min-date / max-date / filter / formatter |
| van-time-picker | 时间选择器 | v-model / columns-type（hour/minute/second）/ min-hour / max-hour / min-minute / max-minute / filter / formatter |
| van-calendar | 日历 | v-model:show / type（single/multiple/range）/ min-date / max-date / formatter / confirm-text / show-confirm / position |
| van-area | 省市区 | v-model / area-list / columns-placeholder / title / confirm-button-text |
| van-cascader | 级联 | v-model / options / field-names / placeholder / title / closeable / show-header |
| van-number-keyboard | 数字键盘 | v-model:show / theme / extra-key / close-button-text / show-delete-key / random-key-order / safe-area-inset-bottom |
| van-password-input | 密码输入 | value / length（默认 6 位）/ mask / focused / gutter |
| van-signature | 手写签名 | type / pen-color / line-width / background-color / tips |

### 反馈组件（Feedback）

| 标签 / 函数 | 中文名 | 关键 Props / Options |
|---|---|---|
| van-action-sheet / showActionSheet | 动作面板 | v-model:show / actions / title / cancel-text / description / closeable / close-on-click-action |
| van-dialog / showDialog / showConfirmDialog | 对话框 | v-model:show / title / message / message-align / show-cancel-button / confirm-button-text / cancel-button-text / before-close |
| van-loading | 加载 | type（circular/spinner）/ color / size / text-size / vertical |
| van-notify / showNotify | 通知 | v-model:show / type（primary/success/warning/danger）/ message / color / background / duration |
| van-overlay | 遮罩层 | show / z-index / duration / class-name / custom-style |
| van-pull-refresh | 下拉刷新 | v-model / pulling-text / loosing-text / loading-text / success-text / disabled / animation-duration |
| van-share-sheet | 分享面板 | v-model:show / options / title / cancel-text / description / duration |
| van-swipe-cell | 滑动单元格 | left-width / right-width / disabled / on-close |
| van-toast / showToast / showSuccessToast / showFailToast / showLoadingToast | 轻提示 | message / type（text/loading/success/fail）/ position（top/middle/bottom）/ icon / loading-type / duration / forbidClick / overlay / wordBreak |

### 展示组件（Display）

| 标签 | 中文名 | 关键 Props |
|---|---|---|
| van-badge | 徽标 | content / color / max / dot / show-zero / offset |
| van-barrage | 弹幕 | v-model / auto-play / loop / rows / top |
| van-card | 商品卡片 | title / desc / num / price / thumb / origin-price / tag / centered |
| van-circle | 环形进度条 | v-model:current-rate / rate / size / stroke-width / color / layer-color / fill / clockwise |
| van-collapse / van-collapse-item | 折叠面板 | v-model / accordion / border / disabled / title / icon |
| van-count-down | 倒计时 | time / format / auto-start / millisecond |
| van-divider | 分割线 | content-position / dashed / hairline |
| van-empty | 空状态 | image / description / image-size |
| van-floating-bubble | 悬浮气泡 | axis（x/y/xy/lock）/ magnetic / icon |
| van-floating-panel | 悬浮面板 | v-model:height / anchors / duration / content-draggable |
| van-highlight | 关键词高亮 | source-string / keywords / highlight-class / unhighlight-class / case-sensitive / tag |
| showImagePreview | 图片预览 | images / start-position / loop / show-index / show-indicators / close-on-popstate |
| van-lazyload / v-lazy | 图片懒加载 | （指令）需 `app.use(Lazyload, { ... })` 注册 |
| van-notice-bar | 通告栏 | text / mode（closeable/link）/ color / background / left-icon / delay / speed / scrollable |
| van-progress | 进度条 | percentage / color / track-color / stroke-width / show-pivot / pivot-text / inactive |
| van-rolling-text | 数字滚动 | start-num / target-num / duration / direction / auto-start / stop-order |
| van-skeleton | 骨架屏 | title / avatar / row / row-width / loading / animate |
| van-sticky | 粘性布局 | offset-top / position / container / z-index |
| van-swipe / van-swipe-item | 轮播 | autoplay / duration / initial-swipe / loop / show-indicators / vertical / touchable / lazy-render |
| van-tag | 标签 | type / size / color / plain / round / mark / closeable |
| van-text-ellipsis | 文本省略 | content / rows / expand-text / collapse-text / dots / position |
| van-watermark | 水印 | content / image / image-width / image-height / gap-x / gap-y / opacity / rotate / z-index |

### 导航组件（Navigation）

| 标签 | 中文名 | 关键 Props |
|---|---|---|
| van-action-bar | 动作栏 | safe-area-inset-bottom |
| van-action-bar-icon | 动作栏图标 | icon / text / color / dot / badge / to / url |
| van-action-bar-button | 动作栏按钮 | type / text / color / icon / to / url / disabled / loading |
| van-back-top | 返回顶部 | target / right / bottom / offset / immediate |
| van-grid / van-grid-item | 宫格 | column-num / icon-size / gutter / border / center / square / clickable / direction / reverse |
| van-index-bar / van-index-anchor | 索引栏 | sticky / sticky-offset-top / z-index / highlight-color / index-list |
| van-nav-bar | 导航栏 | title / left-text / right-text / left-arrow / fixed / border / placeholder / safe-area-inset-top |
| van-pagination | 分页 | v-model / page-count / total-items / items-per-page / show-page-size / force-ellipses / mode |
| van-sidebar / van-sidebar-item | 侧边栏 | v-model / title / disabled / dot / badge |
| van-tab / van-tabs | Tab | v-model:active / sticky / swipeable / scrollspy / color / background / line-width / line-height / type（line/card）/ ellipsis / shrink |
| van-tabbar / van-tabbar-item | 底部 Tab 栏 | v-model / fixed / border / route / placeholder / safe-area-inset-bottom / active-color / inactive-color |
| van-tree-select | 树形选择 | v-model:main-active-index / v-model:active-id / items / max / height |

### 业务组件（Business）

| 标签 | 中文名 | 关键 Props |
|---|---|---|
| van-address-edit | 地址编辑 | area-list / area-columns-placeholder / address-info / search-result / show-postal / show-delete / show-set-default / disable-area / show-search-result |
| van-address-list | 地址列表 | v-model / list / disabled-list / disabled-text / add-button-text / default-tag-text |
| van-contact-card | 联系人卡片 | type（add/edit）/ name / tel / add-text |
| van-contact-edit | 联系人编辑 | contact-info / is-edit / is-saving / is-deleting / show-set-default / set-default-label / tel-validator |
| van-contact-list | 联系人列表 | v-model / list / add-text / default-tag-text |
| van-coupon-cell | 优惠券单元格 | title / chosen-coupon / coupons / editable / border / currency |
| van-coupon-list | 优惠券列表 | v-model:code / chosen-coupon / coupons / disabled-coupons / enabled-title / disabled-title / exchange-button-text / show-close-button / show-exchange-bar / currency |
| van-submit-bar | 提交栏 | price / label / suffix-label / text-align / button-text / button-type / button-color / tip / tip-icon / currency / decimal-length / safe-area-inset-bottom |

## 常用组件 API 详查

### Button（按钮）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 按钮类型：default / primary / success / warning / danger | string | default |
| size | 尺寸：large / normal / small / mini | string | normal |
| text | 按钮文字 | string | - |
| color | 按钮颜色（支持 linear-gradient 渐变） | string | - |
| icon | 左侧图标名称或图片链接 | string | - |
| icon-prefix | 图标类名前缀 | string | van-icon |
| icon-position | 图标位置：left / right | string | left |
| tag | HTML 标签 | string | button |
| native-type | 原生 button 标签的 type | string | button |
| block | 是否为块级元素 | boolean | false |
| plain | 是否为朴素按钮 | boolean | false |
| square | 是否为方形按钮 | boolean | false |
| round | 是否为圆形按钮 | boolean | false |
| disabled | 是否禁用 | boolean | false |
| hairline | 是否使用 0.5px 边框 | boolean | false |
| loading | 是否显示加载状态 | boolean | false |
| loading-text | 加载状态文字 | string | - |
| loading-type | 加载图标类型：spinner / circular | string | circular |
| loading-size | 加载图标大小 | number / string | 20px |
| url | 点击后跳转的链接 | string | - |
| to | 路由对象（Vue Router） | string / object | - |
| replace | 是否替换历史记录 | boolean | false |

#### Events

| 事件名 | 说明 | 回调参数 |
|---|---|---|
| click | 点击触发（loading / disabled 时不触发） | event: MouseEvent |
| touchstart | 触摸开始 | event: TouchEvent |

#### Slots

| 名称 | 说明 |
|---|---|
| default | 按钮内容 |
| loading | 自定义加载图标 |
| icon | 自定义图标 |

### Field（输入框）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model | 当前输入值 | number / string | - |
| label | 左侧文本 | string | - |
| name | 表单字段名 | string | - |
| id | 输入框 id | string | van-field-n-input |
| type | 类型（text / digit / number / tel / password / textarea 等） | string | text |
| size | 大小：large / normal | string | - |
| max-length | 最大字符数 | number / string | - |
| min | 最小值（数字类型） | number | - |
| max | 最大值（数字类型） | number | - |
| placeholder | 占位提示 | string | - |
| border | 是否显示内边框 | boolean | true |
| disabled | 是否禁用 | boolean | false |
| readonly | 是否只读 | boolean | false |
| colon | label 后是否加冒号 | boolean | false |
| required | 是否显示必填星号 | boolean / 'auto' | null |
| center | 内容是否垂直居中 | boolean | false |
| clearable | 是否启用清除图标 | boolean | false |
| clear-icon | 清除图标名 | string | clear |
| clear-trigger | 清除时机：always / focus | string | focus |
| clickable | 是否启用点击反馈 | boolean | false |
| is-link | 是否显示右侧箭头并启用点击反馈 | boolean | false |
| autofocus | 是否自动聚焦 | boolean | false |
| show-word-limit | 是否显示字数统计 | boolean | false |
| error | 是否标红 | boolean | false |
| error-message | 错误提示 | string | - |
| error-message-align | 错误对齐：left / center / right | string | left |
| formatter | 格式化函数 | (val) => string | - |
| format-trigger | 格式化时机：onChange / onBlur | string | onChange |
| arrow-direction | 箭头方向：left / up / down | string | right |
| label-class | label 类名 | string / array / object | - |
| label-width | label 宽度 | number / string | 6.2em |
| label-align | label 对齐：left / center / right / top | string | left |
| input-align | 输入框对齐 | string | left |
| autosize | textarea 自适应高度 | boolean / object | false |
| left-icon | 左侧图标 | string | - |
| right-icon | 右侧图标 | string | - |
| rules | 校验规则 | FieldRule[] | - |
| autocomplete | HTML autocomplete | string | - |
| inputmode | HTML inputmode | string | - |
| rows | textarea 行数 | number / string | - |

#### Events

| 事件名 | 说明 | 回调参数 |
|---|---|---|
| update:model-value | 输入内容变化 | value: string |
| focus | 输入框聚焦 | event: Event |
| blur | 输入框失焦 | event: Event |
| clear | 点击清除按钮 | event: MouseEvent |
| click | 点击组件 | event: MouseEvent |
| click-input | 点击输入区域 | event: MouseEvent |
| click-left-icon | 点击左侧图标 | event: MouseEvent |
| click-right-icon | 点击右侧图标 | event: MouseEvent |
| start-validate | 校验开始 | - |
| end-validate | 校验结束 | result 对象，含 status（passed / failed / unvalidated）和 errorMessage |

#### Slots

| 名称 | 说明 |
|---|---|
| label | 自定义 label |
| input | 自定义输入框 |
| left-icon | 自定义左侧图标 |
| right-icon | 自定义右侧图标 |
| button | 自定义右侧按钮 |
| extra | 自定义右侧额外内容 |
| error-message | 自定义错误提示 |

### Form（表单）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| label-align | label 对齐 | string | left |
| label-width | label 宽度 | number / string | 6.2em |
| input-align | 输入框对齐 | string | left |
| error-message-align | 错误对齐 | string | left |
| validate-trigger | 校验时机：onSubmit / onChange / onBlur | string \| string[] | onBlur |
| colon | 是否在 label 后加冒号 | boolean | false |
| disabled | 是否禁用 | boolean | false |
| readonly | 是否只读 | boolean | false |
| show-error | 出错时是否标红 | boolean | true |
| show-error-message | 出错时是否显示错误提示 | boolean | true |
| submit-on-enter | 是否在按下回车键时提交 | boolean | true |
| scroll-to-error | 提交失败时自动滚动到错误项 | boolean | false |
| scroll-to-error-position | 滚动位置：top / center / bottom | string | start |
| validate-first | 是否在校验完一个字段后立即返回 | boolean | false |

#### Events

| 事件名 | 说明 | 回调参数 |
|---|---|---|
| submit | 校验通过提交 | values: 表单数据对象 |
| failed | 校验失败 | errorInfo: { values, errors } |

#### Methods（通过 ref 调用）

| 方法 | 说明 | 类型 |
|---|---|---|
| submit | 提交表单（触发 submit 事件） | () => void |
| validate | 校验表单 | (name?: string 或 string[]) =&gt; Promise&lt;void&gt; |
| resetValidation | 重置校验状态 | (name?: string \| string[]) => void |
| getValidationStatus | 获取所有字段校验状态 | () =&gt; 字段状态映射对象 |
| scrollToField | 滚动到指定字段 | (name: string, alignToTop?: boolean) => void |

### Cell（单元格）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 左侧标题 | string / number | - |
| value | 右侧内容 | string / number | - |
| label | 标题下方描述 | string | - |
| size | 尺寸：large / normal | string | - |
| icon | 左侧图标名 | string | - |
| icon-prefix | 图标类名前缀 | string | van-icon |
| url | 跳转链接 | string | - |
| to | 路由对象 | string / object | - |
| border | 是否显示下边框 | boolean | true |
| replace | 是否替换历史 | boolean | false |
| clickable | 是否启用点击反馈 | boolean | null |
| is-link | 是否显示右侧箭头 + 点击反馈 | boolean | - |
| required | 是否显示必填星号 | boolean / 'auto' | null |
| center | 内容垂直居中 | boolean | false |
| arrow-direction | 箭头方向：left / up / down | string | right |
| title-style | 标题样式 | string / array / object | - |
| title-class | 标题类名 | string / array / object | - |
| value-class | 内容类名 | string / array / object | - |
| label-class | 描述类名 | string / array / object | - |
| tag | HTML 标签 | string | div |

### Picker（选择器）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model | 当前选中值（数组） | (number \| string)[] | [] |
| columns | 选项数据（一维 / 二维 / 级联） | PickerOption[] \| PickerOption[][] | [] |
| columns-field-names | 自定义字段名 | { text, value, children } | - |
| title | 顶部标题 | string | - |
| confirm-button-text | 确认按钮文字 | string | 确认 |
| cancel-button-text | 取消按钮文字 | string | 取消 |
| show-toolbar | 是否显示顶部栏 | boolean | true |
| loading | 是否显示加载 | boolean | false |
| readonly | 是否只读 | boolean | false |
| option-height | 选项高度 | number / string | 44 |
| visible-option-num | 可见选项数 | number / string | 6 |
| swipe-duration | 滑动惯性时间 | number / string | 1000 |

#### Events

| 事件名 | 说明 | 回调参数 |
|---|---|---|
| confirm | 确认 | PickerConfirmEventParams |
| cancel | 取消 | PickerCancelEventParams |
| change | 选项变化 | PickerChangeEventParams |
| click-option | 点击选项 | PickerOption |

#### Slots

| 名称 | 说明 |
|---|---|
| toolbar | 自定义顶部栏 |
| title | 自定义标题 |
| confirm | 自定义确认按钮 |
| cancel | 自定义取消按钮 |
| option | 自定义选项 |
| columns-top | 顶部内容 |
| columns-bottom | 底部内容 |

### DatePicker（日期选择器）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model | 当前日期（数组形式 ['2026', '05', '17']） | string[] | [] |
| columns-type | 显示列：year / month / day / hour / minute / second | string[] | ['year', 'month', 'day'] |
| min-date | 最小日期 | Date | 10 年前 |
| max-date | 最大日期 | Date | 10 年后 |
| filter | 过滤函数 | (type, options) => options | - |
| formatter | 格式化函数 | (type, option) => option | - |
| title | 顶部标题 | string | - |

### Tabs（标签页）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model:active | 激活标签的 name 或索引 | number / string | 0 |
| type | 类型：line / card | string | line |
| color | 标签主题色 | string | - |
| background | 标签栏背景色 | string | - |
| duration | 切换动画时长（秒） | number / string | 0.3 |
| line-width | 底部线宽 | number / string | 40px |
| line-height | 底部线高 | number / string | 3px |
| title-active-color | 激活标题颜色 | string | - |
| title-inactive-color | 未激活标题颜色 | string | - |
| swipeable | 是否启用滑动切换 | boolean | false |
| sticky | 是否吸顶 | boolean | false |
| scrollspy | 是否启用滚动导航 | boolean | false |
| animated | 是否启用切换动画 | boolean | false |
| offset-top | sticky 时距顶距离 | number / string | 0 |
| ellipsis | 是否省略过长的标题 | boolean | true |
| sticky-offset-top | sticky 距顶距离 | number / string | 0 |
| shrink | 是否启用左侧收缩布局 | boolean | false |
| before-change | 切换前回调（返回 false 阻止） | (name) => boolean \| Promise | - |

#### Events

| 事件名 | 说明 | 回调参数 |
|---|---|---|
| change | 切换 tab 时 | { name, title } |
| click-tab | 点击 tab 时 | { name, title, event, disabled } |
| disabled | 点击禁用 tab 时 | { name, title } |
| rendered | 标签内容首次渲染时（lazy-render 才触发） | { name, title } |
| scroll | 滚动时（sticky 模式） | { scrollTop, isFixed } |

### Tabbar（底部 Tab）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model | 当前激活 tab 的 name | number / string | 0 |
| fixed | 是否固定底部 | boolean | true |
| border | 是否显示上边框 | boolean | true |
| z-index | z-index | number / string | 1 |
| active-color | 激活色 | string | - |
| inactive-color | 未激活色 | string | - |
| route | 是否启用路由模式 | boolean | false |
| placeholder | 是否生成占位元素 | boolean | false |
| safe-area-inset-bottom | 底部安全区适配 | boolean | true |
| before-change | 切换前回调（返回 false 阻止） | (name) => boolean \| Promise | - |

### NavBar（导航栏）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 标题 | string | - |
| left-text | 左侧文字 | string | - |
| right-text | 右侧文字 | string | - |
| left-arrow | 是否显示左侧返回箭头 | boolean | false |
| left-disabled | 禁用左侧 | boolean | false |
| right-disabled | 禁用右侧 | boolean | false |
| border | 是否显示下边框 | boolean | true |
| fixed | 是否固定顶部 | boolean | false |
| placeholder | 是否生成占位元素（fixed 时） | boolean | false |
| z-index | z-index | number / string | 1 |
| safe-area-inset-top | 顶部安全区适配 | boolean | false |
| clickable | 是否启用点击反馈 | boolean | true |

#### Events

| 事件名 | 说明 |
|---|---|
| click-left | 点击左侧 |
| click-right | 点击右侧 |

### List（列表）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model:loading | 是否加载中 | boolean | false |
| v-model:error | 是否加载失败 | boolean | false |
| finished | 是否已加载完毕 | boolean | false |
| offset | 触发距离（px） | number / string | 300 |
| loading-text | 加载中文字 | string | 加载中... |
| finished-text | 已加载完毕文字 | string | - |
| error-text | 错误提示文字 | string | - |
| immediate-check | 初始化是否立即检查 | boolean | true |
| direction | 加载方向：up / down | string | down |

#### Events

| 事件名 | 说明 |
|---|---|
| load | 滚动条与底部距离小于 offset 时触发 |

### PullRefresh（下拉刷新）

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model | 是否刷新中 | boolean | false |
| pulling-text | 下拉中提示 | string | 下拉即可刷新... |
| loosing-text | 释放提示 | string | 释放即可刷新... |
| loading-text | 加载中提示 | string | 加载中... |
| success-text | 刷新成功提示 | string | - |
| success-duration | 成功提示展示时长（ms） | number / string | 500 |
| animation-duration | 动画时长 | number / string | 300 |
| head-height | 顶部内容高度 | number / string | 50 |
| pull-distance | 触发下拉刷新距离 | number / string | - |
| disabled | 是否禁用 | boolean | false |

#### Events

| 事件名 | 说明 |
|---|---|
| refresh | 触发下拉刷新 |
| change | 距离变化（callback param: distance） |

### Toast（命令式）

```ts
function showToast(options: string | ToastOptions): ToastInstance
function showSuccessToast(options: string | ToastOptions): ToastInstance
function showFailToast(options: string | ToastOptions): ToastInstance
function showLoadingToast(options: string | ToastOptions): ToastInstance
function closeToast(all?: boolean): void
function allowMultipleToast(allow?: boolean): void
function setToastDefaultOptions(type: ToastType | ToastOptions, options?: ToastOptions): void
function resetToastDefaultOptions(type?: ToastType): void
```

#### ToastOptions

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 类型：text / loading / success / fail / html | string | text |
| position | 位置：top / middle / bottom | string | middle |
| message | 内容 | string / number | - |
| icon | 自定义图标 | string | - |
| iconSize | 图标大小 | number / string | 36px |
| iconPrefix | 图标前缀 | string | van-icon |
| overlay | 是否显示遮罩 | boolean | false |
| forbidClick | 是否禁止背景点击 | boolean | false |
| closeOnClick | 点击 Toast 后是否关闭 | boolean | false |
| closeOnClickOverlay | 点击遮罩后是否关闭 | boolean | false |
| loadingType | 加载图标类型：spinner / circular | string | circular |
| duration | 展示时长（ms）；0 = 不自动关闭 | number | 2000 |
| className | 自定义类名 | string / array / object | - |
| onOpened | 完全展示后触发 | () => void | - |
| onClose | 关闭时触发 | () => void | - |
| transition | 动画类名 | string | van-fade |
| teleport | 指定挂载节点 | string / Element | body |
| wordBreak | 文本换行方式：break-all / break-word / normal | string | break-all |

### Dialog（命令式）

```ts
function showDialog(options: DialogOptions): Promise<DialogAction>
function showConfirmDialog(options: DialogOptions): Promise<DialogAction>
function closeDialog(): void
function setDialogDefaultOptions(options: DialogOptions): void
function resetDialogDefaultOptions(): void

type DialogAction = 'confirm' | 'cancel'
```

#### DialogOptions

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 标题 | string | - |
| width | 弹窗宽度 | number / string | 320px |
| message | 内容（支持 HTML） | string | - |
| messageAlign | 内容对齐：left / center / right | string | center |
| theme | 主题：default / round-button | string | default |
| className | 自定义类名 | string / array / object | - |
| showConfirmButton | 是否显示确认按钮 | boolean | true |
| showCancelButton | 是否显示取消按钮 | boolean | false |
| confirmButtonText | 确认按钮文字 | string | 确认 |
| confirmButtonColor | 确认按钮颜色 | string | #ee0a24 |
| cancelButtonText | 取消按钮文字 | string | 取消 |
| cancelButtonColor | 取消按钮颜色 | string | black |
| overlay | 是否显示遮罩 | boolean | true |
| overlayClass | 遮罩自定义类名 | string | - |
| overlayStyle | 遮罩自定义样式 | object | - |
| closeOnPopstate | 路由变化时关闭 | boolean | true |
| closeOnClickOverlay | 点击遮罩关闭 | boolean | false |
| lockScroll | 是否锁定背景滚动 | boolean | true |
| beforeClose | 关闭前回调（返回 false 阻止） | (action) =&gt; boolean 或 Promise&lt;boolean&gt; | - |
| allowHtml | 是否允许 message 解析 HTML | boolean | false |
| transition | 动画类名 | string | van-dialog-bounce |
| teleport | 挂载节点 | string / Element | body |

### Notify（命令式）

```ts
function showNotify(options: string | NotifyOptions): NotifyInstance
function closeNotify(): void
function setNotifyDefaultOptions(options: NotifyOptions): void
function resetNotifyDefaultOptions(): void
```

#### NotifyOptions

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 类型：primary / success / warning / danger | string | danger |
| message | 内容 | string / number | - |
| color | 字体颜色 | string | - |
| background | 背景色 | string | - |
| duration | 展示时长（ms） | number | 3000 |
| className | 自定义类名 | string / array / object | - |
| lockScroll | 是否锁定背景滚动 | boolean | false |
| onClick | 点击回调 | (event) => void | - |
| onOpened | 完全展示后回调 | () => void | - |
| onClose | 关闭时回调 | () => void | - |

### ImagePreview（命令式）

```ts
function showImagePreview(options: ImagePreviewOptions | string[]): ImagePreviewInstance
```

#### ImagePreviewOptions

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| images | 图片数组 | string[] | [] |
| startPosition | 起始索引 | number | 0 |
| swipeDuration | 切换动画时长（ms） | number / string | 300 |
| showIndex | 是否显示索引 | boolean | true |
| showIndicators | 是否显示指示器 | boolean | false |
| loop | 是否循环 | boolean | true |
| closeable | 是否显示关闭按钮 | boolean | false |
| closeIcon | 关闭图标 | string | clear |
| closeIconPosition | 关闭按钮位置：top-left / top-right / bottom-left / bottom-right | string | top-right |
| closeOnPopstate | 路由变化时关闭 | boolean | true |
| beforeClose | 关闭前回调 | (action, { index }) => boolean | - |
| onClose | 关闭时回调 | () => void | - |
| onChange | 切换时回调 | (index) => void | - |
| onScale | 缩放时回调 | ({ index, scale }) => void | - |
| onLongPress | 长按时回调 | ({ index }) => void | - |

## ConfigProvider 全局配置

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| theme | 主题：light / dark | string | light |
| theme-vars | 主题变量（camelCase） | ConfigProviderThemeVars | - |
| theme-vars-dark | 仅深色模式生效的变量 | ConfigProviderThemeVars | - |
| theme-vars-light | 仅浅色模式生效的变量 | ConfigProviderThemeVars | - |
| theme-vars-scope | 变量作用域：global / local | string | local |
| icon-prefix | 图标前缀 | string | van-icon |
| tag | HTML 标签 | string | div |
| z-index | 全局 z-index 起始值 | number | - |

```ts
import type { ConfigProviderThemeVars } from 'vant'

const themeVars: ConfigProviderThemeVars = {
  // 基础变量
  primaryColor: '#07c160',
  successColor: '#07c160',
  warningColor: '#ff976a',
  dangerColor: '#ee0a24',
  textColor: '#323233',
  backgroundColor: '#f7f8fa',

  // 组件变量（任意组件 + 任意属性的 camelCase）
  buttonPrimaryBackground: '#07c160',
  buttonPrimaryBorderColor: '#07c160',
  tabActiveTextColor: '#07c160',
  navBarBackground: '#fff',
  cellGroupBackground: '#fff',
  fieldInputTextColor: '#323233',
  // ... 700+ 变量
}
```

## Locale 国际化 API

```ts
import { Locale, useCurrentLang } from 'vant'

// 切换语言（覆盖式）
Locale.use(lang: string, messages: Record<string, any>): void

// 追加 / 覆盖部分文案
Locale.add(messages: Record<string, Record<string, any>>): void

// 获取当前语言（Composable）
const currentLang: Ref<string> = useCurrentLang()
```

支持的语言文件：

```ts
// vant/es/locale/lang/ 下的所有文件
import zhCN from 'vant/es/locale/lang/zh-CN'
import zhHK from 'vant/es/locale/lang/zh-HK'
import zhTW from 'vant/es/locale/lang/zh-TW'
import enUS from 'vant/es/locale/lang/en-US'
import jaJP from 'vant/es/locale/lang/ja-JP'
import koKR from 'vant/es/locale/lang/ko-KR'
import frFR from 'vant/es/locale/lang/fr-FR'
import deDE from 'vant/es/locale/lang/de-DE'
import esES from 'vant/es/locale/lang/es-ES'
import itIT from 'vant/es/locale/lang/it-IT'
import ptBR from 'vant/es/locale/lang/pt-BR'
import ruRU from 'vant/es/locale/lang/ru-RU'
import arSA from 'vant/es/locale/lang/ar-SA'  // RTL
import idID from 'vant/es/locale/lang/id-ID'
import viVN from 'vant/es/locale/lang/vi-VN'
import thTH from 'vant/es/locale/lang/th-TH'
import trTR from 'vant/es/locale/lang/tr-TR'
import plPL from 'vant/es/locale/lang/pl-PL'
import roRO from 'vant/es/locale/lang/ro-RO'
import nlNL from 'vant/es/locale/lang/nl-NL'
import svSE from 'vant/es/locale/lang/sv-SE'
import heIL from 'vant/es/locale/lang/he-IL'  // RTL
import hiIN from 'vant/es/locale/lang/hi-IN'
import faIR from 'vant/es/locale/lang/fa-IR'  // RTL
import csCZ from 'vant/es/locale/lang/cs-CZ'
import bgBG from 'vant/es/locale/lang/bg-BG'
import elGR from 'vant/es/locale/lang/el-GR'
import laLA from 'vant/es/locale/lang/la-LA'
import isIS from 'vant/es/locale/lang/is-IS'
import mmMN from 'vant/es/locale/lang/mm-MN'
import kmKH from 'vant/es/locale/lang/km-KH'
import bnBD from 'vant/es/locale/lang/bn-BD'
import daDK from 'vant/es/locale/lang/da-DK'
import nbNO from 'vant/es/locale/lang/nb-NO'
import eoEO from 'vant/es/locale/lang/eo-EO'
import srRS from 'vant/es/locale/lang/sr-RS'
import ukUA from 'vant/es/locale/lang/uk-UA'
import kkKZ from 'vant/es/locale/lang/kk-KZ'
```

## TypeScript 类型

```ts
import type {
  // 组件实例
  FormInstance,
  FieldInstance,
  PickerInstance,
  DatePickerInstance,
  ToastInstance,
  DialogInstance,
  NotifyInstance,
  ImagePreviewInstance,
  CountDownInstance,
  CalendarInstance,
  SwipeInstance,
  TabsInstance,

  // Props 类型
  ButtonProps,
  FieldProps,
  CellProps,
  PickerProps,
  FormProps,

  // 校验规则
  FieldRule,
  FieldValidationStatus,

  // Picker / DatePicker
  PickerOption,
  PickerColumn,
  PickerConfirmEventParams,
  PickerCancelEventParams,
  PickerChangeEventParams,
  PickerFieldNames,

  // 命令式 API 选项
  ToastOptions,
  ToastType,
  DialogOptions,
  DialogAction,
  NotifyOptions,
  NotifyType,
  ImagePreviewOptions,

  // ConfigProvider
  ConfigProviderProps,
  ConfigProviderTheme,
  ConfigProviderThemeVars,
  ConfigProviderThemeVarsScope,

  // 业务组件
  AddressEditInfo,
  AddressEditSearchItem,
  AddressListAddress,
  ContactEditInfo,
  ContactListItem,
  CouponInfo,

  // 通用工具类型
  Numeric,
} from 'vant'
```

### 类型化 ref（推荐写法）

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { FormInstance, FieldInstance } from 'vant'

const formRef = useTemplateRef<FormInstance>('formRef')
const fieldRef = useTemplateRef<FieldInstance>('fieldRef')

async function onSubmit() {
  // 自动类型推导：validate() / resetValidation() / scrollToField()
  await formRef.value?.validate()
}
</script>

<template>
  <van-form ref="formRef">
    <van-field ref="fieldRef" v-model="value" />
  </van-form>
</template>
```

### FieldRule 类型

```ts
type FieldRuleMessage = string | ((value: any, rule: FieldRule) => string)
type FieldRuleValidator = (value: any, rule: FieldRule) => boolean | string | Promise<boolean | string>
type FieldRuleFormatter = (value: any, rule: FieldRule) => any

interface FieldRule {
  pattern?: RegExp
  trigger?: 'onBlur' | 'onChange' | 'onSubmit'
  message?: FieldRuleMessage
  required?: boolean
  validator?: FieldRuleValidator
  formatter?: FieldRuleFormatter
  min?: number
  max?: number
  validateEmpty?: boolean
}
```

## Composables（@vant/use）

Vant 4 抽出独立 `@vant/use` 包提供可复用的 composables（部分已合并到 `vant` 主包）：

| Composable | 签名 | 用途 |
|---|---|---|
| useClickAway | `useClickAway(target, listener, options?)` | 监听点击元素外部 |
| useCountDown | `useCountDown(options)` | 倒计时（与 CountDown 组件配合） |
| useCustomFieldValue | `useCustomFieldValue(getValue)` | 自定义表单字段值（在 Field input 插槽中） |
| useEventListener | `useEventListener(type, listener, options?)` | 监听 DOM 事件 |
| usePageVisibility | `usePageVisibility()` | 监听 document.visibilityState |
| useRaf | `useRaf(fn, options?)` | requestAnimationFrame 循环 |
| useRect | `useRect(target)` | 获取元素 `getBoundingClientRect()` |
| useRelation | `useRelation(parent, child)` | 父子组件互相通讯（内部使用） |
| useScrollParent | `useScrollParent(element)` | 找到最近的可滚动父元素 |
| useToggle | `useToggle(initial?)` | 切换 boolean 状态 |
| useWindowSize | `useWindowSize()` | 监听窗口大小变化 |

### 示例

```ts
import {
  useClickAway,
  useCountDown,
  useEventListener,
  usePageVisibility,
  useRect,
  useScrollParent,
  useToggle,
  useWindowSize,
} from 'vant'

// 点击外部关闭
useClickAway(targetRef, () => {
  show.value = false
})

// 倒计时
const countDown = useCountDown({
  time: 3 * 60 * 60 * 1000, // 3 小时
  onChange(current) {
    console.log(current.minutes)
  },
})
countDown.start()
countDown.pause()
countDown.reset()

// 页面可见性
const visibility = usePageVisibility()
watch(visibility, (val) => {
  if (val === 'hidden') {
    // 页面切走
  }
})

// 元素矩形
const rect = useRect(targetRef)
console.log(rect.width, rect.height)

// 窗口大小
const { width, height } = useWindowSize()

// 状态切换
const [show, toggle] = useToggle(false)
toggle() // 切换
toggle(true) // 显式设置
```

## 700+ CSS 变量入口

### 完整变量源码

[Vant 4 CSS 变量源](https://github.com/vant-ui/vant/blob/main/packages/vant/src/style/var.less) —— Less 源文件，700+ 行。

### 基础变量（部分速查）

```less
// 颜色调色板（Color Palette）
--van-black: #000;
--van-white: #fff;
--van-gray-1: #f7f8fa;
--van-gray-2: #f2f3f5;
--van-gray-3: #ebedf0;
--van-gray-4: #dcdee0;
--van-gray-5: #c8c9cc;
--van-gray-6: #969799;
--van-gray-7: #646566;
--van-gray-8: #323233;
--van-red: #ee0a24;
--van-blue: #1989fa;
--van-orange: #ff976a;
--van-orange-dark: #ed6a0c;
--van-orange-light: #fffbe8;
--van-green: #07c160;

// 主题颜色（Theme Colors）
--van-primary-color: var(--van-blue);
--van-success-color: var(--van-green);
--van-danger-color: var(--van-red);
--van-warning-color: var(--van-orange);
--van-text-color: var(--van-gray-8);
--van-text-color-2: var(--van-gray-6);
--van-text-color-3: var(--van-gray-5);
--van-active-color: var(--van-gray-2);
--van-active-opacity: 0.7;
--van-disabled-opacity: 0.5;
--van-background: var(--van-gray-1);
--van-background-2: var(--van-white);
--van-background-3: var(--van-gray-2);

// 边框（Border）
--van-border-color: var(--van-gray-3);
--van-border-width: 1px;
--van-border-radius-sm: 2px;
--van-border-radius-md: 4px;
--van-border-radius-lg: 8px;
--van-border-radius-max: 999px;

// 字体（Font）
--van-font-bold: 600;
--van-font-size-xs: 10px;
--van-font-size-sm: 12px;
--van-font-size-md: 14px;
--van-font-size-lg: 16px;
--van-line-height-xs: 14px;
--van-line-height-sm: 18px;
--van-line-height-md: 20px;
--van-line-height-lg: 22px;
--van-base-font: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
--van-price-integer-font: avenir-heavy, 'PingFang SC', helvetica, 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;

// 间距（Padding）
--van-padding-base: 4px;
--van-padding-xs: 8px;
--van-padding-sm: 12px;
--van-padding-md: 16px;
--van-padding-lg: 24px;
--van-padding-xl: 32px;

// 动画（Animation）
--van-duration-base: 0.3s;
--van-duration-fast: 0.2s;
--van-ease-out: ease-out;
--van-ease-in: ease-in;
```

### 组件变量命名规则

```less
// 1. 普通：--van-{component}-{property}
--van-button-default-color
--van-cell-text-color

// 2. 带状态：--van-{component}-{state}-{property}
--van-button-primary-background
--van-tab-active-text-color

// 3. 带尺寸：--van-{component}-{size}-{property}
--van-button-large-min-width
--van-cell-large-vertical-padding
```

## 类型化模板 ref 完整模板

```ts
// <script setup lang="ts"> 中的写法
import { useTemplateRef } from 'vue'
import type {
  FormInstance,
  FieldInstance,
  PickerInstance,
  DatePickerInstance,
  CalendarInstance,
  SwipeInstance,
  TabsInstance,
  CountDownInstance,
  ImagePreviewInstance,
} from 'vant'

// 表单类
const formRef = useTemplateRef<FormInstance>('formRef')
const fieldRef = useTemplateRef<FieldInstance>('fieldRef')

// 选择类
const pickerRef = useTemplateRef<PickerInstance>('pickerRef')
const datePickerRef = useTemplateRef<DatePickerInstance>('datePickerRef')
const calendarRef = useTemplateRef<CalendarInstance>('calendarRef')

// 容器类
const swipeRef = useTemplateRef<SwipeInstance>('swipeRef')
const tabsRef = useTemplateRef<TabsInstance>('tabsRef')

// 计时类
const countDownRef = useTemplateRef<CountDownInstance>('countDownRef')

// 业务类
const imagePreviewRef = useTemplateRef<ImagePreviewInstance>('imagePreviewRef')

// 调用实例方法
formRef.value?.validate()
fieldRef.value?.focus()
swipeRef.value?.next()
swipeRef.value?.prev()
swipeRef.value?.swipeTo(2)
tabsRef.value?.resize()
tabsRef.value?.scrollTo(1)
countDownRef.value?.start()
countDownRef.value?.pause()
countDownRef.value?.reset()
```

## 命令式 API 默认配置 setter

```ts
import {
  setToastDefaultOptions,
  resetToastDefaultOptions,
  setDialogDefaultOptions,
  resetDialogDefaultOptions,
  setNotifyDefaultOptions,
  resetNotifyDefaultOptions,
  setImagePreviewDefaultOptions,
  resetImagePreviewDefaultOptions,
} from 'vant'

// Toast 默认配置
setToastDefaultOptions({ duration: 1500 })
setToastDefaultOptions('loading', { forbidClick: true, duration: 0 })
resetToastDefaultOptions()
resetToastDefaultOptions('loading')

// Dialog 默认配置
setDialogDefaultOptions({
  width: '90%',
  confirmButtonColor: '#07c160',
  beforeClose: async (action) => action === 'confirm',
})

// Notify 默认配置
setNotifyDefaultOptions({
  duration: 4000,
})
```

## 图标库（1000+ 图标）

Vant 4 内置 **1000+ 图标**——通过 `van-icon` 组件的 `name` 属性使用。**部分常用图标速查**：

### 操作类

| name | 含义 |
|---|---|
| arrow / arrow-left / arrow-up / arrow-down | 箭头 |
| cross / close | 关闭 |
| add / plus | 添加 |
| minus | 减少 |
| edit | 编辑 |
| delete / delete-o | 删除 |
| search | 搜索 |
| filter-o | 筛选 |
| share-o | 分享 |
| comment-o | 评论 |
| like / like-o | 点赞 |
| star / star-o | 收藏 |
| home-o | 首页 |
| user-o / friends-o | 用户 / 朋友 |
| setting-o | 设置 |
| sign | 签到 |

### 提示类

| name | 含义 |
|---|---|
| success | 成功 |
| fail | 失败 |
| warning / warning-o | 警告 |
| info / info-o | 信息 |
| question / question-o | 疑问 |
| passed | 已通过 |
| clear | 清除 |
| checked | 已选 |
| close | 关闭 |

### 业务类（电商）

| name | 含义 |
|---|---|
| shopping-cart-o | 购物车 |
| cart-o | 购物车 |
| gold-coin-o | 金币 |
| balance-pay | 余额支付 |
| balance-o | 余额 |
| coupon-o | 优惠券 |
| gift-o | 礼品 |
| location-o | 位置 |
| logistics | 物流 |
| order | 订单 |
| pending-payment | 待支付 |
| paid | 已支付 |
| points | 积分 |
| medal-o | 勋章 |
| label-o | 标签 |

### 完整图标列表

参见 [Vant Icon 文档](https://vant-ui.github.io/vant/#/zh-CN/icon) —— 在线预览所有图标 + 复制名称。

### 自定义图标前缀

```vue
<template>
  <van-config-provider icon-prefix="my-icon">
    <!-- 现在 van-icon 不再走 van-icon-* 类名、而走 my-icon-* -->
    <van-icon name="home" />
  </van-config-provider>
</template>
```

或者用 `van-icon` 的 `class-prefix` 属性单独覆盖。

## 工具函数

### 数字格式化

```ts
// Vant 不导出公共数字格式化工具——可以用 SubmitBar 的内部逻辑
// 价格单位：分（3050 → ¥30.50）
function formatPrice(price: number, decimalLength = 2): string {
  return (price / 100).toFixed(decimalLength)
}

// 千分位
function thousandSeparator(num: number | string): string {
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
```

### 自定义校验工具（FieldRule 复用）

```ts
import type { FieldRule } from 'vant'

// 手机号
export const phoneRule: FieldRule = {
  pattern: /^1\d{10}$/,
  message: '请输入正确的手机号',
}

// 邮箱
export const emailRule: FieldRule = {
  pattern: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,}$/,
  message: '请输入正确的邮箱',
}

// 身份证
export const idCardRule: FieldRule = {
  pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
  message: '请输入正确的身份证号',
}

// 密码强度（8 位以上、含字母数字）
export const passwordRule: FieldRule = {
  pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
  message: '密码至少 8 位、包含字母和数字',
}
```

## 与 vue-i18n 集成

```ts
// main.ts
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'
import zhCN from 'vant/es/locale/lang/zh-CN'
import App from './App.vue'

const i18n = createI18n({
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  legacy: false,
  messages: {
    'zh-CN': { hello: '你好' },
    'en-US': { hello: 'Hello' },
  },
})

// 同步 vue-i18n locale 变化到 Vant Locale
const vantLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

i18n.global.locale.value = 'zh-CN'
Locale.use('zh-CN', zhCN)

// 切换语言
function switchLanguage(lang: 'zh-CN' | 'en-US') {
  i18n.global.locale.value = lang
  Locale.use(lang, vantLocales[lang])
}

createApp(App).use(i18n).mount('#app')
```

## 相关链接

- [Vant 官网（中文）](https://vant-ui.github.io/vant/#/zh-CN)
- [Vant 官网（英文）](https://vant-ui.github.io/vant/#/en-US)
- [组件总览](https://vant-ui.github.io/vant/#/zh-CN/home)
- [Vant 4 更新日志](https://vant-ui.github.io/vant/#/zh-CN/changelog)
- [从 Vant 3 迁移](https://vant-ui.github.io/vant/#/zh-CN/migrate-from-v3)
- [从 Vant 2 迁移](https://vant-ui.github.io/vant/#/zh-CN/migrate-from-v2)
- [GitHub: vant-ui/vant](https://github.com/vant-ui/vant)
- [GitHub: vant-weapp（小程序版）](https://github.com/vant-ui/vant-weapp)
- [@vant/nuxt（Nuxt 模块）](https://github.com/vant-ui/vant-nuxt)
- [@vant/area-data（省市区数据）](https://github.com/vant-ui/vant/tree/main/packages/vant-area-data)
- [@vant/touch-emulator（桌面端事件模拟）](https://github.com/vant-ui/vant/tree/main/packages/vant-touch-emulator)
- [@vant/auto-import-resolver（按需引入）](https://github.com/vant-ui/vant/tree/main/packages/vant-auto-import-resolver)
- [设计资源（Sketch + Axure）](https://vant-ui.github.io/vant/#/zh-CN/design)
- [Vant 在线主题工具](https://github.com/Aisen60/vant-theme)
- [Rsbuild（同作者）](https://rsbuild.dev/zh)
