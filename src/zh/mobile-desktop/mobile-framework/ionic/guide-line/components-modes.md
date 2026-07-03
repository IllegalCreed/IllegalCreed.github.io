---
layout: doc
outline: [2, 3]
---

# Ionic 组件体系与双 mode

> 基于 Ionic 8 · 核于 2026-07

## 速查

- **组件都是 Web Components**：模板里直接写 `<ion-button>`；框架包里对应 PascalCase（`IonButton`）；事件按框架惯例——React `onIonChange` / Vue `@ionChange` / Angular `(ionChange)`
- **按功能分组**：App 骨架（`ion-app`/`ion-content`/`ion-header`/`ion-toolbar`）、导航（`ion-router-outlet`/`ion-tabs`/`ion-menu`）、按钮（`ion-button`/`ion-fab`/`ion-icon`）、表单（`ion-input`/`ion-select`/`ion-datetime`）、列表（`ion-list`/`ion-item`/`ion-item-sliding`）、数据展示（`ion-card`/`ion-chip`/`ion-accordion`）、浮层（`ion-modal`/`ion-alert`/`ion-toast`）、进度（`ion-spinner`/`ion-skeleton-text`）、滚动（`ion-refresher`/`ion-infinite-scroll`）
- **Overlays 两种用法**：**内联组件**（写模板里 + `isOpen` 控制）或**控制器/函数式**（Angular `AlertController.create()`、React `useIonAlert()`、Vue 同名 composable）
- **双 mode**：`mode` 取 `'ios'` 或 `'md'`（Material Design），决定平台外观（Adaptive Styling）
- **自动检测**：iOS 设备（iPhone/iPad）→ `ios`；Android 及其他（含桌面/网页）→ `md`
- **覆盖 mode**：全局用各框架 config（见[框架集成](./framework-integration)）；单组件 `<ion-button mode='ios'>`
- **mode 影响**：外观样式、MD 波纹 `rippleEffect`、部分动画

## 一、组件都是 Web Components（用法通则）

Ionic 的每个组件都是一个标准自定义元素，用法有统一规律：

- **模板里直接写标签**：`<ion-button>`、`<ion-list>`……无需注册（框架里由 wrapper 负责）。
- **框架内是 PascalCase 组件**：`IonButton`、`IonList`，从 `@ionic/angular|react|vue` 引入。
- **属性用各框架惯例**：布尔/字符串属性照写；事件名各框架不同：

| 框架 | 事件写法示例 |
| --- | --- |
| React | `onIonChange={...}` |
| Vue | `@ionChange="..."` |
| Angular | `(ionChange)="..."` |

- 多数组件用 **Shadow DOM** 封装，改内部样式要靠 CSS 变量 / CSS Shadow Parts（见[主题与暗色](./theming)）。

## 二、组件分组全景

以下按功能分组覆盖高频组件（非官方完整清单，具体属性/事件以官方 `docs/api/<component>` 为准）：

### App 骨架 / 布局

`ion-app`（根容器）、`ion-content`（可滚动主体）、`ion-header` / `ion-footer` / `ion-toolbar` / `ion-title`、`ion-grid` / `ion-row` / `ion-col`（响应式 12 栅格）、`ion-split-pane`（宽屏分栏）。

### 导航

`ion-router-outlet`（承载页面转场）、`ion-nav`、`ion-tabs` / `ion-tab-bar` / `ion-tab-button`、`ion-menu`（侧边抽屉）/ `ion-menu-button`、`ion-back-button`、`ion-breadcrumb(s)`。详见[路由与导航](./routing)。

### 按钮 / 动作

`ion-button`、`ion-fab` / `ion-fab-button` / `ion-fab-list`（悬浮操作）、`ion-icon`（配 Ionicons）、`ion-ripple-effect`。

### 表单 / 输入

`ion-input`、`ion-textarea`、`ion-checkbox`、`ion-radio` / `ion-radio-group`、`ion-toggle`、`ion-select` / `ion-select-option`、`ion-range`、`ion-searchbar`、`ion-datetime`（日期/时间选择）、`ion-segment` / `ion-segment-button`。

### 列表 / 条目

`ion-list`、`ion-item`、`ion-item-sliding`（左右滑操作）、`ion-item-divider`、`ion-label`、`ion-note`、`ion-reorder` / `ion-reorder-group`、`ion-avatar`、`ion-thumbnail`。

### 数据展示

`ion-card`（+ `-header` / `-title` / `-subtitle` / `-content`）、`ion-badge`、`ion-chip`、`ion-text`、`ion-img`、`ion-accordion` / `ion-accordion-group`。

### 浮层 / 反馈（Overlays）

`ion-modal`、`ion-popover`、`ion-alert`、`ion-action-sheet`、`ion-toast`、`ion-loading`、`ion-picker`（用法见下一节）。

### 进度 / 占位 / 滚动

进度占位：`ion-spinner`、`ion-progress-bar`、`ion-skeleton-text`；滚动交互：`ion-refresher` / `ion-refresher-content`（下拉刷新）、`ion-infinite-scroll` / `ion-infinite-scroll-content`（无限滚动）。

## 三、Overlays 的两种用法：内联 vs 控制器

浮层类组件（modal / alert / toast / popover……）有两条并行的用法路线：

**A. 内联组件**——写在模板里，用 `isOpen` 等属性控制显隐：

```html
<ion-button id="open-modal">打开</ion-button>
<ion-modal trigger="open-modal">
  <ion-content class="ion-padding">弹窗内容</ion-content>
</ion-modal>
```

**B. 控制器 / 函数式**——用代码创建并呈现，适合命令式场景：

```ts
// React：用 hook
const [presentAlert] = useIonAlert();
presentAlert({ header: '提示', message: '已保存', buttons: ['OK'] });
```

```ts
// Angular：注入控制器
constructor(private alertCtrl: AlertController) {}
async show() {
  const alert = await this.alertCtrl.create({ header: '提示', buttons: ['OK'] });
  await alert.present();
}
```

> Vue 既可用组件式（`<ion-alert>`），也可用同名 composable（如 `alertController.create()`）。两条路线殊途同归，按团队风格选一即可。

## 四、iOS / MD 双 mode 是什么

Ionic 的一大卖点是 **Adaptive Styling（自适应样式）**：**一套 `ion-*` 代码，在不同平台自动呈现「原生感」外观**，无需你写两套 UI。

- `mode` 只有两个取值：**`'ios'`**（iOS 风格）与 **`'md'`**（Material Design，Android 风格）。
- 它影响的是**外观**：圆角、间距、字体、控件形态、过渡动画、MD 的点击波纹等。

## 五、mode 的检测与覆盖

**默认自动检测**：

| 平台 | 默认 mode |
| --- | --- |
| iOS 设备（iPhone / iPad） | `ios` |
| Android 及其他（含桌面 / 网页） | `md` |

**手动覆盖**分两个层级：

- **全局**：在各框架初始化 config 里设 `mode`（Angular `provideIonicAngular({ mode: 'ios' })`、React `setupIonicReact({ mode: 'md' })`、Vue `.use(IonicVue, { mode: 'md' })`）——详见[框架集成与底座](./framework-integration)。
- **单组件**：直接在标签上写 `mode`：

```html
<!-- 强制这个按钮用 iOS 外观，无视平台 -->
<ion-button mode="ios">iOS 风格按钮</ion-button>
```

## 六、mode 影响什么

- **外观样式**：同一组件在 `ios` 与 `md` 下有不同的圆角/间距/形态/字体。
- **MD 波纹**：`ripple-effect`（点击涟漪）是 Material Design 特征，由 mode 驱动，可用全局 config 的 `rippleEffect` 开关。
- **动画/过渡**：部分转场与交互动画随 mode 不同。
- 想统一体验或做品牌化，可**全局锁定一种 mode**（如统一走 `md`），再用主题变量定制颜色（见[主题与暗色](./theming)）。
