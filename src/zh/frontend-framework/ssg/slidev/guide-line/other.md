---
layout: doc
outline: [2, 3]
---

# 其他

## 编写主题

每个幻灯片项目只能有一个主题。主题应专注于提供幻灯片的外观。

### 创建主题

```bash
pnpm init slidev-theme
```

### 主要能力

- 全局样式
- 提供默认配置
- 提供自定义布局或覆盖现有布局
- 提供自定义组件
- 配置 UnoCSS、Shiki 等工具

<br>

在 package.json 中配置 Slidev ：

```json
{
  "slidev": {
    "defaults": {
      "transition": "slide-left",
      "aspectRatio": "4/3"
    }
  }
}
```

#### **限制 Slidev 版本**

```json
{
  "engines": {
    "slidev": ">=0.48.0"
  }
}
```

#### **配置元信息**

```json
{
  "slidev": {
    "colorSchema": "light" // or "dark" or "both"
  }
}
```

### 预览

创建一个  `./slides.md`  文件，并在其中添加以下 headmatter 配置：

```yaml
---
theme: ./ # 使用当前目录的作为主题
---
```

### **发布**

非 JS 文件（如  `.vue`  和  `.ts`  文件）可以直接发布而无需编译。

主题应遵循以下约定：

- 包名应以  `slidev-theme-`  开头。例如，`slidev-theme-name`  或  `@scope/slidev-theme-name`
- 在  `package.json`  的  `keywords`  字段中添加  `"slidev-theme"`  和  `"slidev"`

## 编写插件

每个演示文稿只能有一个主题，但可以安装多个插件。

### 创建插件

官方没有提供插件创建工具。但可以手动创建一个。

```bash
pnpm init slidev-addon
```

package.json 中配置：

```json
{
  "name": "slidev-addon-myaddon",
  "version": "0.1.0",
  "description": "My Slidev Addon",
  "keywords": ["slidev-addon", "slidev"],
  "files": ["dist", "*.ts", "*.vue"],
  "engines": {
    "slidev": ">=0.48.0"
  },
  "scripts": {
    "dev": "slidev --open",
    "build": "slidev build",
  },
  "devDependencies": {
    "@slidev/cli": "^0.51.4",
    "@slidev/theme-default": "latest",
    "vue": "^3.5.13"
  },
  "peerDependencies": {
    "vue": "^3.2.34",
    "@slidev/client": "^0.48.0"
  }
}
```

之后您就可以在对应的文件夹中创建组件或者布局了

### 主要能力

- 提供自定义组件
- 提供新的布局
- 提供新的代码片段
- 提供新的代码运行器
- 配置 UnoCSS、Vite 等工具

### **预览**

创建 `./slides.md`  文件

```yaml
---
addons:
  - ./
---
```

### **发布**

非 JS 文件（如  `.vue`  和  `.ts`  文件）可以直接发布而无需编译。

插件应遵循以下约定：

- 包名应以  `slidev-addon-`  开头。例如，`slidev-addon-name`  或  `@scope/slidev-addon-name`
- 在  `package.json`  的  `keywords`  字段中添加  `"slidev-addon"`  和  `"slidev"`
