import { describe, expect, it } from "vitest";
import vitePressConfig from "../config.mts?raw";
import privacyEn from "../../src/privacy.md?raw";
import privacyZh from "../../src/zh/privacy.md?raw";

describe("统一隐私政策", () => {
  it("中英文均覆盖四个产品和 Quiz 的独立数据边界", () => {
    expect(privacyEn).toContain("four separate Google Analytics 4 properties");
    expect(privacyEn).toContain("IllegalCreed Quiz can be used as a guest");
    expect(privacyEn).toContain("Baidu Analytics");
    expect(privacyEn).toContain("General mutation logs may also contain answer submission");

    expect(privacyZh).toContain("四个独立的 Google Analytics 4 属性");
    expect(privacyZh).toContain("IllegalCreed Quiz 可作为游客使用");
    expect(privacyZh).toContain("百度统计");
    expect(privacyZh).toContain("通用操作日志还可能");
  });

  it("全站入口统一使用 IllegalCreed Quiz 品牌名", () => {
    expect(vitePressConfig).toContain('text: "IllegalCreed Quiz"');
    expect(vitePressConfig).not.toContain("程序员刷题站");
  });
});
