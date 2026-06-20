---
layout: doc
---

# Selenium

Selenium 是历史最悠久、**W3C WebDriver 标准的发起者**——通过 WebDriver 协议在浏览器**外部**远程控制浏览器，支持 Java / Python / C# / Ruby / JavaScript 等**多语言**与 Chrome / Firefox / Edge / Safari 全主流浏览器。配合 **Selenium Grid** 可做大规模分布式并行，是企业 QA 与多语言技术栈的行业标杆。2026 年它在企业、多语言栈、全浏览器覆盖场景仍不可替代，但前端 JS 新项目的体验与速度已被 Playwright / Cypress 赶超，通常不再作为首选。本叶以 JavaScript 绑定 `selenium-webdriver` 为主线。

## 评价

**优点**

- **W3C 标准制定者**：WebDriver 是浏览器厂商原生支持的标准协议，权威且稳定
- **真多语言**：Java / Python / C# / Ruby / JS / Kotlin，同一套概念跨语言复用
- **全浏览器覆盖**：Chrome / Firefox / Edge / Safari（含历史上的 IE）
- **Selenium Grid**：成熟的分布式架构，企业级大规模跨机器跨浏览器并行
- **生态最深厚**：与 TestNG / JUnit / PyTest 等无缝集成；**Selenium Manager**（4.6+）自动管理浏览器驱动

**缺点**

- **API 偏底层**：需手写大量显式等待，上手与维护成本高于现代框架
- **更慢**：进程外 + WebDriver 协议层往返开销，速度逊于 Playwright / Cypress
- **配置历史包袱**：早期 driver 版本匹配繁琐（Selenium Manager 已大幅改善）
- **现代特性跟进偏慢**：WebDriver BiDi（双向协议）的推进不如 Playwright 的 CDP 激进
- **前端新项目不首选**：DX 与速度被现代框架超越，多用于存量与企业多语言场景

## 文档地址

[Selenium 文档](https://www.selenium.dev/documentation/)

## GitHub地址

[Selenium](https://github.com/SeleniumHQ/selenium)

## 幻灯片地址

<a href="/SlideStack/selenium-slide/" target="_blank">Selenium</a>