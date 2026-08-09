import { describe, expect, it } from "vitest";
import siteConfig from "../config.mts";
import homeEn from "../../src/index.md?raw";
import homeZh from "../../src/zh/index.md?raw";

type SidebarItem = {
  text?: string;
  collapsed?: boolean;
  items?: SidebarItem[];
};

const zhSidebar = siteConfig.locales?.zh?.themeConfig?.sidebar as unknown as SidebarItem[];

describe("个人站主页项目导览", () => {
  const projects = [
    ["https://pal.illegalscreed.cn/", "/projects/webpal.png"],
    ["https://algo.illegalscreed.cn/", "/projects/algorithm-visualizer.png"],
    ["https://lumideck.illegalscreed.cn/", "/projects/slide-agent.png"],
    ["https://quiz.illegalscreed.cn/", "/projects/programmer-quiz.png"],
  ];

  it("中英文主页都明确列出四个项目入口和真实截图", () => {
    for (const [link, image] of projects) {
      expect(homeEn).toContain(link);
      expect(homeZh).toContain(link);
      expect(homeEn).toContain(image);
      expect(homeZh).toContain(image);
    }
  });
});

describe("中文侧边栏折叠层级", () => {
  it("所有一级目录展开，嵌套目录保持折叠", () => {
    const topLevelGroups = zhSidebar.filter((item) => item.items?.length);

    expect(topLevelGroups.length).toBeGreaterThan(0);
    expect(topLevelGroups.every((item) => item.collapsed === false)).toBe(true);
    expect(topLevelGroups.flatMap((item) => item.items ?? []).some((item) => item.collapsed === false)).toBe(false);
  });
});
