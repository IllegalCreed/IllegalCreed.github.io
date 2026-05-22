---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 **VueUse v14.3.0**（2026-05）。本页是**速查工具**——包含 `@vueuse/core` 12 大分类全部 211 个函数表、10 个 add-on 包全部 59 个函数表、常用 composable 详细参数 / 选项速查、核心约定（MaybeRef / toValue / controls / isSupported）、TypeScript 类型、自动导入配置。

## 速查

- **核心包**：`@vueuse/core`（211 个函数，覆盖 12 大分类，已含 `@vueuse/shared` 的工具函数）
- **add-on 包**：`@vueuse/router` / `integrations` / `math` / `motion` / `rxjs` / `firebase` / `electron` / `sound` / `schema-org`（按需安装，各自独立 npm 包）
- **命名约定**：`useXxx` 返回响应式状态的 composable，`onXxx` 注册事件型监听，`createXxx` 工厂函数，`tryOnXxx` 安全生命周期钩子
- **入参约定**：大多数函数接受 `MaybeRefOrGetter<T>`——可传普通值、`ref`、`computed` 或 getter 函数，内部用 `toValue()` 解包
- **返回约定**：返回单个状态用 `ref`；返回多状态用对象（可解构）；带控制能力的返回 `{ ...state, pause, resume, ... }` 或通过 `controls: true` 选项开启
- **能力探测**：浏览器 API 类函数返回 `isSupported`（`ComputedRef<boolean>`），调用前应判断
- **SSR 友好**：绝大多数函数 SSR 安全，浏览器 API 在服务端降级为惰性值
- **副作用清理**：在组件作用域内自动注册 `onScopeDispose` 清理，无需手动解绑
- **Vue 兼容**：Vue 3.x（v14 起不再支持 Vue 2）

## @vueuse/core 12 大分类完整函数表

### State（状态，15）

| 函数 | 说明 |
|---|---|
| `createGlobalState` | 把状态保持在全局作用域，跨组件复用 |
| `createInjectionState` | 创建可注入的状态，封装 provide / inject 对 |
| `createSharedComposable` | 让 composable 在多个调用方间共享同一份状态 |
| `injectLocal` | 增强版 `inject`，支持在同组件内 `provideLocal` 后立即取值 |
| `provideLocal` | 增强版 `provide`，可在同组件内被 `injectLocal` 取到 |
| `useAsyncState` | 处理异步状态，暴露 `state` / `isLoading` / `isReady` / `execute` |
| `useDebouncedRefHistory` | 带防抖的 ref 历史记录 |
| `useLastChanged` | 记录某个 ref 最后一次变化的时间戳 |
| `useLocalStorage` | 响应式 `localStorage`（`useStorage` 的预设） |
| `useManualRefHistory` | 手动调用 `commit()` 才记录的 ref 历史 |
| `useRefHistory` | 跟踪 ref 变更历史，支持撤销 / 重做 |
| `useSessionStorage` | 响应式 `sessionStorage`（`useStorage` 的预设） |
| `useStorage` | 响应式 Web Storage（local / session），自动序列化 |
| `useStorageAsync` | 响应式存储的异步版本（支持异步 storage） |
| `useThrottledRefHistory` | 带节流的 ref 历史记录 |

### Elements（元素，15）

| 函数 | 说明 |
|---|---|
| `useActiveElement` | 响应式获取 `document.activeElement` |
| `useDocumentVisibility` | 响应式 `document.visibilityState` |
| `useDraggable` | 让元素可拖拽，返回坐标与样式 |
| `useDropZone` | 创建拖放区域，处理文件 / 数据投放 |
| `useElementBounding` | 响应式获取元素的 `getBoundingClientRect()` |
| `useElementSize` | 响应式获取元素宽高（基于 ResizeObserver） |
| `useElementVisibility` | 元素是否进入视口可见 |
| `useIntersectionObserver` | 封装 IntersectionObserver 监听元素交叉状态 |
| `useMouseInElement` | 鼠标相对某元素的位置与是否在内部 |
| `useMutationObserver` | 封装 MutationObserver 监听 DOM 变更 |
| `useParentElement` | 响应式获取元素的父节点 |
| `useResizeObserver` | 封装 ResizeObserver 监听尺寸变化 |
| `useWindowFocus` | 窗口是否处于聚焦状态 |
| `useWindowScroll` | 响应式 window 滚动位置 |
| `useWindowSize` | 响应式 window 宽高 |

### Browser（浏览器，41）

| 函数 | 说明 |
|---|---|
| `useBluetooth` | 封装 Web Bluetooth API |
| `useBreakpoints` | 响应式断点判断（内置 Tailwind / Bootstrap 等预设） |
| `useBroadcastChannel` | 封装 BroadcastChannel 实现同源标签页通信 |
| `useBrowserLocation` | 响应式 `window.location` |
| `useClipboard` | 读写系统剪贴板（文本） |
| `useClipboardItems` | 读写剪贴板（支持富类型 ClipboardItem） |
| `useColorMode` | 颜色模式管理（auto / light / dark / 自定义） |
| `useCssVar` | 响应式读写 CSS 自定义属性（变量） |
| `useDark` | 响应式深色模式开关，自动持久化 |
| `useEventListener` | 安全地添加事件监听，自动解绑 |
| `useEyeDropper` | 封装 EyeDropper 屏幕取色 API |
| `useFavicon` | 响应式修改页面 favicon |
| `useFileDialog` | 以编程方式打开文件选择对话框 |
| `useFileSystemAccess` | 封装 File System Access API（读写本地文件） |
| `useFullscreen` | 进入 / 退出全屏 |
| `useGamepad` | 封装 Gamepad API 读取手柄状态 |
| `useImage` | 响应式加载图片，暴露加载状态 |
| `useMediaControls` | 控制 `<audio>` / `<video>` 播放（进度、音量等） |
| `useMediaQuery` | 响应式 CSS 媒体查询匹配 |
| `useMemory` | 响应式读取 `performance.memory` 内存信息 |
| `useObjectUrl` | 为 Blob / File 创建并自动回收 Object URL |
| `usePerformanceObserver` | 封装 PerformanceObserver 监听性能条目 |
| `usePermission` | 响应式查询 Permissions API 权限状态 |
| `usePreferredColorScheme` | 用户系统颜色偏好（light / dark / no-preference） |
| `usePreferredContrast` | 用户系统对比度偏好 |
| `usePreferredDark` | 用户系统是否偏好深色 |
| `usePreferredLanguages` | 用户系统语言偏好列表 |
| `usePreferredReducedMotion` | 用户是否偏好减少动画 |
| `usePreferredReducedTransparency` | 用户是否偏好减少透明度 |
| `useScreenOrientation` | 响应式屏幕方向与锁定 |
| `useScreenSafeArea` | 响应式读取屏幕安全区域 inset |
| `useScriptTag` | 动态注入 `<script>` 标签并跟踪加载 |
| `useShare` | 封装 Web Share API 调起系统分享 |
| `useSSRWidth` | 为 SSR 提供视口宽度，供断点等函数使用 |
| `useStyleTag` | 动态注入 `<style>` 标签 |
| `useTextareaAutosize` | 文本域随内容自动调整高度 |
| `useTextDirection` | 响应式读写文本方向（ltr / rtl） |
| `useTitle` | 响应式读写 `document.title` |
| `useUrlSearchParams` | 响应式读写 URL 查询参数 |
| `useVibrate` | 封装 Vibration API 触发设备震动 |
| `useWakeLock` | 封装 Screen Wake Lock 防止屏幕休眠 |
| `useWebNotification` | 封装 Notification API 发送桌面通知 |
| `useWebWorker` | 简化 Web Worker 通信 |
| `useWebWorkerFn` | 在 Web Worker 中运行函数，不阻塞主线程 |

### Sensors（传感器，38）

| 函数 | 说明 |
|---|---|
| `onClickOutside` | 监听元素外部的点击 |
| `onElementRemoval` | 监听元素从 DOM 被移除 |
| `onKeyStroke` | 监听键盘按键 |
| `onLongPress` | 监听元素长按 |
| `onStartTyping` | 监听用户开始打字（非输入框聚焦时） |
| `useBattery` | 响应式电池状态（电量、充电中） |
| `useDeviceMotion` | 响应式设备运动加速度数据 |
| `useDeviceOrientation` | 响应式设备方向（陀螺仪） |
| `useDevicePixelRatio` | 响应式 `devicePixelRatio` |
| `useDevicesList` | 响应式枚举媒体输入 / 输出设备 |
| `useDisplayMedia` | 封装 `getDisplayMedia`（屏幕共享流） |
| `useElementByPoint` | 获取指定坐标处的元素 |
| `useElementHover` | 元素是否处于悬停状态 |
| `useFocus` | 响应式读写元素聚焦状态 |
| `useFocusWithin` | 元素或其后代是否聚焦 |
| `useFps` | 响应式帧率（FPS） |
| `useGeolocation` | 响应式地理位置定位 |
| `useIdle` | 检测用户是否空闲 |
| `useInfiniteScroll` | 滚动到底部时触发加载更多 |
| `useKeyModifier` | 响应式修饰键状态（CapsLock / NumLock 等） |
| `useMagicKeys` | 响应式按键映射，支持组合键 |
| `useMouse` | 响应式鼠标坐标 |
| `useMousePressed` | 鼠标 / 触摸是否按下 |
| `useNavigatorLanguage` | 响应式 `navigator.language` |
| `useNetwork` | 响应式网络连接状态（类型、速率） |
| `useOnline` | 响应式在线 / 离线状态 |
| `usePageLeave` | 检测鼠标是否离开页面 |
| `useParallax` | 创建视差滚动 / 倾斜效果 |
| `usePointer` | 响应式指针（鼠标 / 触摸 / 笔）状态 |
| `usePointerLock` | 封装 Pointer Lock API |
| `usePointerSwipe` | 基于 Pointer 事件的滑动检测 |
| `useScroll` | 响应式元素滚动位置与方向 |
| `useScrollLock` | 锁定 / 解锁元素滚动 |
| `useSpeechRecognition` | 封装语音识别 API |
| `useSpeechSynthesis` | 封装语音合成 API（文字转语音） |
| `useSwipe` | 基于 Touch 事件的滑动检测 |
| `useTextSelection` | 响应式获取用户选中的文本 |
| `useUserMedia` | 封装 `getUserMedia`（摄像头 / 麦克风流） |

### Network（网络，3）

| 函数 | 说明 |
|---|---|
| `useEventSource` | 封装 EventSource（SSE 服务器推送） |
| `useFetch` | 响应式封装 `fetch`，支持中断、重取、拦截器 |
| `useWebSocket` | 封装 WebSocket，支持自动重连与心跳 |

### Animation（动画，9）

| 函数 | 说明 |
|---|---|
| `useAnimate` | 封装 Web Animations API |
| `useInterval` | 响应式自增计数器，按固定间隔递增 |
| `useIntervalFn` | 按固定间隔执行回调，可暂停 / 恢复 |
| `useNow` | 响应式当前 `Date` 对象 |
| `useRafFn` | 在每帧 `requestAnimationFrame` 中执行回调 |
| `useTimeout` | 在指定延迟后将状态置为 ready |
| `useTimeoutFn` | 在指定延迟后执行回调，可取消 |
| `useTimestamp` | 响应式当前时间戳 |
| `useTransition` | 在数值变化间做过渡补间动画 |

### Component（组件，16）

| 函数 | 说明 |
|---|---|
| `computedInject` | 结合 `inject` 与 `computed` |
| `createReusableTemplate` | 在同一组件内定义并复用模板片段 |
| `createTemplatePromise` | 用模板渲染 Promise 式交互（如确认弹窗） |
| `templateRef` | 用字符串名绑定模板引用 |
| `tryOnBeforeMount` | 安全调用 `onBeforeMount`（作用域外不报错） |
| `tryOnBeforeUnmount` | 安全调用 `onBeforeUnmount` |
| `tryOnMounted` | 安全调用 `onMounted` |
| `tryOnScopeDispose` | 安全调用 `onScopeDispose` |
| `tryOnUnmounted` | 安全调用 `onUnmounted` |
| `unrefElement` | 从 ref / 组件实例中取出真实 DOM 元素 |
| `useCurrentElement` | 获取当前组件的根 DOM 元素 |
| `useMounted` | 响应式判断组件是否已挂载 |
| `useTemplateRefsList` | 在 `v-for` 中收集一组模板引用 |
| `useVirtualList` | 长列表虚拟滚动 |
| `useVModel` | 简化单个 `v-model` 双向绑定的封装 |
| `useVModels` | 简化多个 `v-model` 双向绑定的封装 |

### Watch（侦听，13）

| 函数 | 说明 |
|---|---|
| `until` | 等待状态满足条件的 Promise 化侦听 |
| `watchArray` | 侦听数组的新增 / 删除元素 |
| `watchAtMost` | 最多触发 N 次后停止的侦听 |
| `watchDebounced` | 带防抖的 `watch` |
| `watchDeep` | 默认 `deep: true` 的 `watch` |
| `watchIgnorable` | 可临时忽略触发的 `watch` |
| `watchImmediate` | 默认 `immediate: true` 的 `watch` |
| `watchOnce` | 只触发一次的 `watch` |
| `watchPausable` | 可暂停 / 恢复的 `watch` |
| `watchThrottled` | 带节流的 `watch` |
| `watchTriggerable` | 可手动触发的 `watch` |
| `watchWithFilter` | 带自定义事件过滤器的 `watch` |
| `whenever` | 当值变为真值时执行回调的 `watch` 简写 |

### Reactivity（响应性，20）

| 函数 | 说明 |
|---|---|
| `computedAsync` | 支持异步求值的 `computed` |
| `computedEager` | 不带惰性、立即求值的 `computed` |
| `computedWithControl` | 显式控制重新求值时机的 `computed` |
| `createRef` | 创建可选深 / 浅的 ref |
| `extendRef` | 给 ref 附加额外属性 |
| `reactify` | 把普通函数转为接受响应式入参的函数 |
| `reactifyObject` | 对对象上所有方法批量 `reactify` |
| `reactiveComputed` | 返回 reactive 对象的 computed |
| `reactiveOmit` | 响应式地剔除对象部分字段 |
| `reactivePick` | 响应式地挑选对象部分字段 |
| `refAutoReset` | 一段时间后自动复位为默认值的 ref |
| `refDebounced` | 带防抖的 ref |
| `refDefault` | 为 ref 提供默认值（null / undefined 时） |
| `refThrottled` | 带节流的 ref |
| `refWithControl` | 可精细控制读写的 ref |
| `syncRef` | 双向同步两个 ref |
| `syncRefs` | 将一个源 ref 单向同步到多个目标 ref |
| `toReactive` | 把 ref 转为 reactive 对象 |
| `toRef` | 标准化为 ref（值 / getter / 对象属性皆可） |
| `toRefs` | 增强版 `toRefs`，支持解构数组与对象 |

### Array（数组，12）

| 函数 | 说明 |
|---|---|
| `useArrayDifference` | 响应式数组差集 |
| `useArrayEvery` | 响应式 `Array.every` |
| `useArrayFilter` | 响应式 `Array.filter` |
| `useArrayFind` | 响应式 `Array.find` |
| `useArrayFindIndex` | 响应式 `Array.findIndex` |
| `useArrayFindLast` | 响应式 `Array.findLast` |
| `useArrayIncludes` | 响应式 `Array.includes` |
| `useArrayJoin` | 响应式 `Array.join` |
| `useArrayMap` | 响应式 `Array.map` |
| `useArrayReduce` | 响应式 `Array.reduce` |
| `useArraySome` | 响应式 `Array.some` |
| `useArrayUnique` | 响应式数组去重 |
| `useSorted` | 响应式数组排序 |

### Time（时间，4）

| 函数 | 说明 |
|---|---|
| `useCountdown` | 倒计时计时器，暴露剩余秒数与控制方法 |
| `useDateFormat` | 按格式串格式化日期（类 dayjs 语法） |
| `useTimeAgo` | 响应式相对时间（如「3 分钟前」） |
| `useTimeAgoIntl` | 基于 `Intl.RelativeTimeFormat` 的相对时间 |

### Utilities（工具，25）

| 函数 | 说明 |
|---|---|
| `createEventHook` | 创建可订阅的事件钩子（on / trigger） |
| `createUnrefFn` | 把接受 ref 入参的函数转为自动解包版本 |
| `get` | 取出 ref 的值（`unref` 的简写） |
| `isDefined` | 类型守卫，判断 ref 值非 null / undefined |
| `makeDestructurable` | 让对象同时支持对象与数组两种解构 |
| `set` | 设置 ref 的值 |
| `useAsyncQueue` | 顺序执行一组异步任务 |
| `useBase64` | 把字符串 / 文件 / 图片转为 Base64 |
| `useCached` | 带自定义比较的缓存 ref |
| `useCloned` | 创建响应式克隆，支持手动 / 自动同步 |
| `useConfirmDialog` | 用 Promise 管理确认对话框的显隐与结果 |
| `useCounter` | 计数器，带 inc / dec / set / reset |
| `useCycleList` | 在列表中循环切换当前项 |
| `useDebounceFn` | 创建防抖函数 |
| `useEventBus` | 轻量事件总线 |
| `useMemoize` | 缓存函数计算结果（记忆化） |
| `useOffsetPagination` | 偏移分页状态管理 |
| `usePrevious` | 记录 ref 的上一个值 |
| `useStepper` | 多步骤流程（向导）状态管理 |
| `useSupported` | 把能力探测结果包成响应式 `isSupported` |
| `useThrottleFn` | 创建节流函数 |
| `useTimeoutPoll` | 用 timeout 实现的轮询（上次完成后再等待） |
| `useToggle` | 布尔值切换器 |
| `useToNumber` | 把字符串 ref 响应式转为数字 |
| `useToString` | 把任意 ref 响应式转为字符串 |

## 10 个 add-on 包函数表

> 每个 add-on 是独立 npm 包，需单独安装，如 `pnpm add @vueuse/router`。

### @vueuse/router（路由，3）

依赖 `vue-router`。需安装：`@vueuse/router`。

| 函数 | 说明 |
|---|---|
| `useRouteHash` | 响应式读写路由 hash |
| `useRouteParams` | 响应式读写路由 params |
| `useRouteQuery` | 响应式读写路由 query |

### @vueuse/integrations（第三方集成，12）

各函数依赖对应第三方库（需自行安装 peer 依赖）。需安装：`@vueuse/integrations`。

| 函数 | 依赖库 | 说明 |
|---|---|---|
| `useAsyncValidator` | `async-validator` | 异步表单校验 |
| `useAxios` | `axios` | 响应式封装 axios 请求 |
| `useChangeCase` | `change-case` | 响应式字符串大小写转换 |
| `useCookies` | `universal-cookie` | 响应式读写 Cookie |
| `useDrauu` | `drauu` | 集成 drauu SVG 绘图 |
| `useFocusTrap` | `focus-trap` | 焦点陷阱（弹窗内锁定 Tab 焦点） |
| `useFuse` | `fuse.js` | 模糊搜索 |
| `useIDBKeyval` | `idb-keyval` | 响应式 IndexedDB 键值存储 |
| `useJwt` | `jwt-decode` | 解码 JWT |
| `useNProgress` | `nprogress` | 控制 NProgress 顶部进度条 |
| `useQRCode` | `qrcode` | 生成二维码 DataURL |
| `useSortable` | `sortablejs` | 列表拖拽排序 |

### @vueuse/math（数学，18）

需安装：`@vueuse/math`。

| 函数 | 说明 |
|---|---|
| `createGenericProjection` | 创建自定义投影函数 |
| `createProjection` | 创建数值区间投影函数 |
| `logicAnd` | 响应式逻辑「与」 |
| `logicNot` | 响应式逻辑「非」 |
| `logicOr` | 响应式逻辑「或」 |
| `useAbs` | 响应式 `Math.abs` |
| `useAverage` | 响应式求平均值 |
| `useCeil` | 响应式 `Math.ceil` |
| `useClamp` | 把响应式数值钳制在区间内 |
| `useFloor` | 响应式 `Math.floor` |
| `useMax` | 响应式求最大值 |
| `useMin` | 响应式求最小值 |
| `usePrecision` | 响应式设置数值精度 |
| `useProjection` | 把数值从一个区间映射到另一个区间 |
| `useRound` | 响应式 `Math.round` |
| `useSum` | 响应式求和 |
| `useTrunc` | 响应式 `Math.trunc` |

### @vueuse/motion（动画，6）

需安装：`@vueuse/motion`。

| 函数 | 说明 |
|---|---|
| `useElementStyle` | 响应式同步元素 style |
| `useElementTransform` | 响应式同步元素 transform |
| `useMotion` | 给元素施加声明式动画 |
| `useMotionProperties` | 读写元素的可动画属性 |
| `useMotionVariants` | 管理动画变体（variants） |
| `useSpring` | 弹簧物理动画 |

### @vueuse/rxjs（RxJS 集成，7）

依赖 `rxjs`。需安装：`@vueuse/rxjs`。

| 函数 | 说明 |
|---|---|
| `from` | 把 ref / watch 源转为 Observable |
| `toObserver` | 把 ref 转为 Observer（语法糖） |
| `useExtractedObservable` | 从依赖中提取并订阅 Observable |
| `useObservable` | 把 Observable 转为响应式 ref |
| `useSubject` | 把 RxJS Subject 双向绑定为 ref |
| `useSubscription` | 自动管理订阅生命周期 |
| `watchExtractedObservable` | 侦听从依赖提取出的 Observable |

### @vueuse/firebase（Firebase 集成，3）

依赖 `firebase`。需安装：`@vueuse/firebase`。

| 函数 | 说明 |
|---|---|
| `useAuth` | 响应式 Firebase 认证状态 |
| `useFirestore` | 响应式订阅 Firestore 文档 / 集合 |
| `useRTDB` | 响应式订阅 Realtime Database |

### @vueuse/electron（Electron 集成，5）

依赖 Electron 运行环境。需安装：`@vueuse/electron`。

| 函数 | 说明 |
|---|---|
| `useIpcRenderer` | 封装 `ipcRenderer` 通信 |
| `useIpcRendererInvoke` | 响应式封装 `ipcRenderer.invoke` |
| `useIpcRendererOn` | 监听 `ipcRenderer` 事件 |
| `useZoomFactor` | 响应式读写窗口缩放因子 |
| `useZoomLevel` | 响应式读写窗口缩放级别 |

### @vueuse/sound（音效，1）

需安装：`@vueuse/sound`。

| 函数 | 说明 |
|---|---|
| `useSound` | 播放音效，控制音量 / 速率 / 播放状态 |

### @vueuse/schema-org（结构化数据，2）

需安装：`@vueuse/schema-org`。

| 函数 | 说明 |
|---|---|
| `createSchemaOrg` | 创建 Schema.org 结构化数据插件 |
| `useSchemaOrg` | 在页面注入 Schema.org JSON-LD |

### @vueuse/head（已迁移）

历史上的 `createHead` / `useHead` 已独立为 **[@unhead/vue](https://unhead.unjs.io/)**，新项目请直接使用 `@unhead/vue`，不再用 `@vueuse/head`。

## 常用 composable 详细速查

### useStorage

```ts
useStorage<T>(
  key: MaybeRefOrGetter<string>,
  defaults: MaybeRefOrGetter<T>,
  storage?: StorageLike,            // 默认 localStorage
  options?: UseStorageOptions<T>,
): RemovableRef<T>
```

**UseStorageOptions**：

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `deep` | boolean | `true` | 深度侦听对象 / 数组变化 |
| `listenToStorageChanges` | boolean | `true` | 监听 `storage` 事件，跨标签页同步 |
| `writeDefaults` | boolean | `true` | storage 无值时写入默认值 |
| `mergeDefaults` | boolean / function | `false` | 把默认值与已存值合并（对象新增字段时有用） |
| `serializer` | `Serializer<T>` | 按类型自动推断 | 自定义序列化（`{ read, write }`） |
| `onError` | `(e) => void` | `console.error` | 错误回调 |
| `shallow` | boolean | `false` | 用 `shallowRef` 代替 `ref` |
| `initOnMounted` | boolean | `false` | 延迟到 `onMounted` 再读取（SSR 水合一致） |
| `flush` | `'pre'` / `'post'` / `'sync'` | `'pre'` | 侦听写回的 flush 时机 |

> 返回 `RemovableRef<T>`：把它设为 `null` 会从 storage 删除该键。`useLocalStorage` / `useSessionStorage` 是预绑定 storage 的快捷方式。

### useFetch

```ts
useFetch<T>(url: MaybeRefOrGetter<string>): UseFetchReturn<T> & PromiseLike<...>
useFetch<T>(url, useFetchOptions): ...
useFetch<T>(url, requestInit, useFetchOptions?): ...
```

**UseFetchOptions**：

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `fetch` | `typeof fetch` | `window.fetch` | 自定义 fetch 实现 |
| `immediate` | boolean | `true` | 初始化时立即请求 |
| `refetch` | `MaybeRefOrGetter<boolean>` | `false` | URL / payload 变化时自动重取 |
| `initialData` | any | `null` | `data` 的初始值 |
| `timeout` | number | `0` | 超时毫秒数（0 = 不超时） |
| `updateDataOnError` | boolean | `false` | 出错时是否仍更新 `data` |
| `beforeFetch` | `(ctx) => ...` | - | 请求前拦截器（改 url / options / 取消） |
| `afterFetch` | `(ctx) => ...` | - | 成功后拦截器（改 data） |
| `onFetchError` | `(ctx) => ...` | - | 失败拦截器（改 data / error） |

**UseFetchReturn**：

| 成员 | 类型 | 说明 |
|---|---|---|
| `data` | `ShallowRef<T \| null>` | 响应体（JSON / 文本） |
| `response` | `ShallowRef<Response \| null>` | 原始 Response |
| `error` | `ShallowRef<any>` | 错误对象 |
| `statusCode` | `ShallowRef<number \| null>` | HTTP 状态码 |
| `isFetching` | `Readonly<ShallowRef<boolean>>` | 是否请求中 |
| `isFinished` | `Readonly<ShallowRef<boolean>>` | 是否已完成 |
| `canAbort` | `ComputedRef<boolean>` | 是否可中断 |
| `aborted` | `ShallowRef<boolean>` | 是否已中断 |
| `abort(reason?)` | function | 中断请求 |
| `execute(throwOnFailed?)` | `() => Promise` | 手动触发请求 |
| `onFetchResponse` / `onFetchError` / `onFetchFinally` | EventHook | 事件回调注册 |

**链式方法**：`.get()` / `.post(payload?, type?)` / `.put()` / `.delete()` / `.patch()` / `.head()` / `.options()` 设置请求方法；`.json<T>()` / `.text()` / `.blob()` / `.arrayBuffer()` / `.formData()` 设置响应解析方式。返回值可 `await`。

### useDark / useColorMode

```ts
useDark(options?: UseDarkOptions): WritableComputedRef<boolean>
useColorMode(options?: UseColorModeOptions): WritableComputedRef<...>
```

**UseDarkOptions**（继承 `UseColorModeOptions`）：

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `selector` | string | `'html'` | 应用模式的目标元素 |
| `attribute` | string | `'class'` | 要修改的属性名 |
| `valueDark` | string | `'dark'` | `isDark=true` 时写入的值 |
| `valueLight` | string | `''` | `isDark=false` 时写入的值 |
| `storageKey` | string / null | `'vueuse-color-scheme'` | 持久化键名（`null` 不持久化） |
| `storage` | StorageLike | `localStorage` | 持久化存储 |
| `onChanged` | function | - | 自定义模式应用逻辑 |

**UseColorModeOptions**（额外）：

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `modes` | `Record<string,string>` | `{}` | 自定义模式与对应属性值 |
| `emitAuto` | boolean | `false` | `store` 暴露 `'auto'`，并新增 `system` / `state` |
| `disableTransition` | boolean | `true` | 切换时禁用 CSS 过渡，避免闪烁 |
| `initialValue` | string | `'auto'` | 初始模式 |

> `useColorMode` 返回的 `WritableComputedRef` 上附带 `system`（系统偏好）、`store`（原始存值）、`state`（含 auto）等属性。

### useMouse

```ts
useMouse(options?: UseMouseOptions): { x, y, sourceType }
```

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `type` | `'page'` / `'client'` / `'screen'` / `'movement'` / 函数 | `'page'` | 坐标系 |
| `target` | `Window` / `EventTarget` / ref | `window` | 监听目标 |
| `touch` | boolean | `true` | 同时监听 touchmove |
| `scroll` | boolean | `true` | 监听滚动（仅 page 坐标系） |
| `resetOnTouchEnds` | boolean | `false` | touchend 时复位 |
| `initialValue` | `{ x, y }` | `{x:0,y:0}` | 初始坐标 |

返回 `x` / `y`（`Ref<number>`）、`sourceType`（`'mouse'` / `'touch'` / `null`）。

### useElementSize / useElementBounding

```ts
useElementSize(
  target: MaybeComputedElementRef,
  initialSize?: { width, height },
  options?: { box?: 'content-box' | 'border-box' | 'device-pixel-content-box' },
): { width: Ref<number>, height: Ref<number> }

useElementBounding(target, options?): {
  width, height, top, right, bottom, left, x, y, update
}
```

> `useElementSize` 基于 ResizeObserver；`useElementBounding` 返回 `getBoundingClientRect()` 全字段并暴露 `update()` 手动刷新。`updateTiming` 选项可设 `'sync'` / `'next-frame'`。

### useIntersectionObserver

```ts
useIntersectionObserver(
  target: MaybeComputedElementRef | MaybeComputedElementRef[],
  callback: IntersectionObserverCallback,
  options?: UseIntersectionObserverOptions,
): { isSupported, isActive, pause, resume, stop }
```

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `root` | MaybeComputedElementRef | `null` | 视口根元素 |
| `rootMargin` | string | `'0px'` | 根边距 |
| `threshold` | number / number[] | `0` | 触发阈值 |
| `immediate` | boolean | `true` | 立即开始观察 |

### useEventListener

```ts
// 多种重载，自动在作用域销毁时解绑
useEventListener(target, event, listener, options?)
useEventListener(event, listener, options?)            // 默认 target = window
```

- `target`：`window` / `document` / ref / EventTarget，可省略
- `event`：事件名或事件名数组
- `listener`：回调或回调数组
- `options`：`AddEventListenerOptions`（`capture` / `passive` / `once`）
- 返回 `stop()` 函数手动解绑

### onClickOutside

```ts
onClickOutside(
  target: MaybeElementRef,
  handler: (evt: PointerEvent) => void,
  options?: { ignore?, capture?, detectIframe?, controls? },
): () => void   // 返回 stop
```

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `ignore` | (元素 / ref / 选择器)[] | `[]` | 忽略这些元素的点击 |
| `capture` | boolean | `true` | 捕获阶段监听 |
| `detectIframe` | boolean | `false` | 把点击 iframe 也算作外部 |

### useClipboard

```ts
useClipboard(options?: UseClipboardOptions): {
  isSupported, text, copied, copy, source
}
```

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `source` | `MaybeRefOrGetter<string>` | - | 要复制的默认文本源 |
| `read` | boolean | `false` | 是否监听并读取剪贴板内容 |
| `copiedDuring` | number | `1500` | `copied` 保持 true 的毫秒数 |
| `legacy` | boolean | `false` | 无 Clipboard API 时降级到 `execCommand` |

`copy(text?)` 复制文本；`copied` 在 `copiedDuring` 内为 true，常用于「已复制」提示。

### useToggle

```ts
useToggle(initialValue?: boolean): [Ref<boolean>, (value?: boolean) => boolean]
useToggle(ref: Ref<T>, options?: { truthyValue, falsyValue }): (value?) => T
```

传布尔值返回 `[state, toggle]` 元组；传已有 ref 只返回 `toggle` 函数。

### useCounter

```ts
useCounter(initialValue?: number, options?: { min?, max? }): {
  count: Ref<number>,
  inc: (delta?: number) => void,
  dec: (delta?: number) => void,
  get: () => number,
  set: (val: number) => void,
  reset: (val?: number) => void,
}
```

### useDebounceFn / useThrottleFn

```ts
useDebounceFn(fn, ms?, options?: { maxWait?, rejectOnCancel? }): 防抖函数
useThrottleFn(fn, ms?, trailing?, leading?, rejectOnCancel?): 节流函数
```

- `ms`：`MaybeRefOrGetter<number>`，等待 / 间隔毫秒数
- 防抖 `maxWait`：最长等待时间上限
- 节流 `leading` / `trailing`：是否在区间首 / 尾调用
- 配套 `refDebounced` / `refThrottled` 直接产出防抖 / 节流 ref

### useBreakpoints

```ts
const bp = useBreakpoints(breakpoints, options?)
```

- 内置预设：`breakpointsTailwind` / `breakpointsBootstrapV5` / `breakpointsAntDesign` / `breakpointsVuetifyV3` / `breakpointsMasterCss` / `breakpointsPrimeFlex` / `breakpointsQuasar` / `breakpointsSematic`
- 返回对象：`bp.greaterOrEqual('md')` / `bp.smaller('lg')` / `bp.between('sm','lg')` / `bp.isGreater(...)` / `bp.current()` / `bp.active()`，并可用 `bp.md`（`Ref<boolean>`）直接判断
- `options.strategy`：`'min-width'`（默认）/ `'max-width'`

### useVModel / useVModels

```ts
useVModel(props, key?, emit?, options?: {
  passive?, eventName?, deep?, defaultValue?, clone?, shouldEmit?
}): Ref
useVModels(props, emit?, options?): 各 prop 的 ref 对象
```

- `passive: true`：内部维护本地状态，仅在变更时 emit（默认 false 直接透传）
- `eventName`：自定义 emit 事件名（默认 `update:key`）
- Vue 3.4+ 也可直接用 `defineModel()`，`useVModel` 适合兼容旧写法或需要 `passive` 行为

### useScroll

```ts
const { x, y, isScrolling, arrivedState, directions, measure }
  = useScroll(element, options?)
```

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `throttle` | number | `0` | 滚动事件节流毫秒 |
| `idle` | number | `200` | 停止滚动判定延迟 |
| `offset` | `{ top, bottom, left, right }` | 全 0 | `arrivedState` 的边缘偏移 |
| `behavior` | `'auto'` / `'smooth'` | `'auto'` | 设置 x/y 时的滚动行为 |
| `onScroll` / `onStop` | function | - | 滚动 / 停止回调 |

`arrivedState` 含 `top/bottom/left/right` 是否到边；`directions` 含四个方向布尔值；`x`/`y` 可写以编程滚动。

### useRefHistory

```ts
const { history, undo, redo, canUndo, canRedo, clear, commit, pause, resume }
  = useRefHistory(source, options?)
```

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `deep` | boolean | `false` | 深度侦听 |
| `flush` | `'pre'`/`'post'`/`'sync'` | `'pre'` | 记录时机 |
| `capacity` | number | 无限 | 历史记录上限 |
| `clone` | boolean / function | `false` | 记录时克隆值（对象需开启） |
| `dump` / `parse` | function | - | 自定义序列化快照 |

`history` 是 `{ snapshot, timestamp }[]`；配套 `useDebouncedRefHistory` / `useThrottledRefHistory` / `useManualRefHistory`。

### useAsyncState

```ts
const { state, isReady, isLoading, error, execute }
  = useAsyncState(promiseOrFn, initialState, options?)
```

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `immediate` | boolean | `true` | 立即执行 |
| `delay` | number | `0` | 执行前延迟毫秒 |
| `resetOnExecute` | boolean | `true` | 重新执行时先重置为初值 |
| `shallow` | boolean | `true` | 用 `shallowRef` |
| `throwError` | boolean | `false` | 失败时抛出而非吞掉 |
| `onError` / `onSuccess` | function | - | 结果回调 |

### useIntervalFn / useTimeoutFn

```ts
const { isActive, pause, resume } = useIntervalFn(callback, interval?, options?)
const { isPending, start, stop } = useTimeoutFn(callback, delay?, options?)
```

- `interval` / `delay`：`MaybeRefOrGetter<number>`
- 共同选项 `immediate`（是否立即启动，默认 `true`）、`immediateCallback`（启动时是否立即执行一次回调）

## 核心约定速查

### MaybeRef 与 MaybeRefOrGetter

```ts
type MaybeRef<T>          = T | Ref<T>
type MaybeRefOrGetter<T>  = T | Ref<T> | (() => T)   // VueUse 大多数入参类型
```

- 调用方可传普通值、`ref`、`computed`、getter 函数，无需手动 `.value`
- 函数内部统一用 Vue 内置的 `toValue()`（旧称 `resolveUnref`）解包
- 写自定义 composable 时入参也应优先用 `MaybeRefOrGetter<T>`

### toValue

```ts
import { toValue } from 'vue'   // VueUse 也再导出

toValue(1)           // 1
toValue(ref(1))      // 1
toValue(() => 1)     // 1
```

把 `MaybeRefOrGetter` 归一为真实值。`get` / `set`（来自 `@vueuse/core`）是 `unref` 取值 / 赋值的简写工具。

### controls 选项

部分函数（如 `useTimestamp` / `useNow` / `useDateFormat` 经 `controls` 触发）支持 `{ controls: true }`：

- 不开启 → 直接返回单个 ref（最简用法）
- 开启 → 返回 `{ <值>, pause, resume, ... }` 对象，便于精细控制

### isSupported

浏览器 API 类函数返回对象含 `isSupported: ComputedRef<boolean>`：

```ts
const { isSupported, share } = useShare()
if (isSupported.value) share({ title: '...', url: '...' })
```

SSR 或不支持的环境下相关功能静默降级，应在调用前判断。

### configurableWindow / configurableDocument

涉及全局对象的函数接受 `window` / `document` 选项，便于在 iframe、测试或多窗口场景注入自定义全局对象：

```ts
useEventListener('resize', fn, { /* ... */ })
useMediaQuery('(min-width: 768px)', { window: customWindow })
```

### 生命周期与作用域

- 在组件 `setup` 或 `effectScope` 内调用 → 自动 `onScopeDispose` 清理副作用
- 作用域外调用 → `tryOnMounted` / `tryOnScopeDispose` 等 `tryOnXxx` 不会报错，静默跳过
- `createSharedComposable` 让 composable 只初始化一次、引用计数归零后自动清理

## TypeScript 类型速查

```ts
import type {
  MaybeRef,
  MaybeRefOrGetter,
  MaybeComputedElementRef,
  RemovableRef,
  UseStorageOptions,
  UseFetchReturn,
  UseFetchOptions,
  UseDarkOptions,
  UseColorModeOptions,
  UseScrollOptions,
  UseElementSizeOptions,
  UseIntersectionObserverOptions,
  EventHook,
  EventHookOn,
  Fn,
  Stoppable,
  Pausable,
} from '@vueuse/core'
```

| 类型 | 含义 |
|---|---|
| `MaybeRef<T>` | `T \| Ref<T>` |
| `MaybeRefOrGetter<T>` | `T \| Ref<T> \| (() => T)` |
| `MaybeComputedElementRef` | 元素 / ref / 组件实例，经 `unrefElement` 取真实 DOM |
| `RemovableRef<T>` | 可设为 `null` 以移除底层存储的 ref（`useStorage` 返回） |
| `Stoppable` | `{ isPending, start, stop }`（`useTimeoutFn` 等） |
| `Pausable` | `{ isActive, pause, resume }`（`useIntervalFn` 等） |
| `EventHook<T>` | `{ on, off, trigger, clear }`（`createEventHook` 返回） |
| `Fn` | `() => void` 通用无参函数别名 |

```ts
// 自定义 composable 入参遵循 MaybeRefOrGetter
import { toValue } from 'vue'
import type { MaybeRefOrGetter } from '@vueuse/core'

function useDouble(value: MaybeRefOrGetter<number>) {
  return computed(() => toValue(value) * 2)
}
```

## 自动导入配置速查

VueUse 提供 `@vueuse/core/resolver` 供 `unplugin-auto-import` 自动按需导入，无需手写 `import`。

```ts
// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite'
import { VueUseComponentsResolver } from '@vueuse/core/resolver'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    // 自动导入 ref / computed / VueUse 函数
    AutoImport({
      imports: ['vue', '@vueuse/core'],
      dts: 'src/auto-imports.d.ts',
    }),
    // 自动注册 VueUse 的组件式 API（如 <UseDark>、<OnClickOutside>）
    Components({
      resolvers: [VueUseComponentsResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
})
```

| 形态 | 包 / 入口 | 说明 |
|---|---|---|
| 函数式 | `@vueuse/core` | `useDark()`、`useMouse()` 等 composable |
| 组件式 | `@vueuse/components` | `<UseMouse>`、`<OnClickOutside>` 等无渲染组件 |
| 指令式 | `@vueuse/components` | `v-on-click-outside`、`v-intersection-observer` 等指令 |

- `AutoImport({ imports: ['@vueuse/core'] })` 即可在 `.vue` 中直接使用所有 core 函数
- add-on 包（`@vueuse/router` 等）可追加到 `imports` 数组：`{ '@vueuse/router': ['useRouteQuery'] }`
- 自动生成的 `auto-imports.d.ts` / `components.d.ts` 需加入 `tsconfig.json` 的 `include`，并提交或加入 `.gitignore` 视团队约定

## 相关链接

- **官网**：[vueuse.org](https://vueuse.org/)
- **函数总览**：[vueuse.org/functions](https://vueuse.org/functions.html)
- **GitHub**：[vueuse/vueuse](https://github.com/vueuse/vueuse)
- **组件式 API**：[vueuse.org/guide/components](https://vueuse.org/guide/components.html)
- **指令式 API**：[vueuse.org/guide/directives](https://vueuse.org/guide/directives.html)
- **配置项约定**：[vueuse.org/guide/config](https://vueuse.org/guide/config.html)
- **更新日志**：[github.com/vueuse/vueuse/releases](https://github.com/vueuse/vueuse/releases)
