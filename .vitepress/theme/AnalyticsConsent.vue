<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useData } from "vitepress";
import {
  readAnalyticsConsent,
  writeAnalyticsConsent,
  type AnalyticsConsent,
} from "./consent";

const { lang } = useData();
// SSR 与客户端首次渲染必须保持空树，localStorage 只能在 mounted 后读取。
const consent = ref<AnalyticsConsent>("unset");
const isReady = ref(false);
const isOpen = ref(false);
const isEnglish = computed(() => lang.value === "en");

onMounted(() => {
  consent.value = readAnalyticsConsent();
  isOpen.value = consent.value === "unset";
  isReady.value = true;
});

const copy = computed(() =>
  isEnglish.value
    ? {
        title: "Optional analytics",
        body: "Allow page views only? Searches and other interactions are not sent as custom analytics events.",
        accept: "Allow",
        reject: "Decline",
        preferences: "Privacy settings",
        privacy: "Privacy policy",
        privacyHref: "/privacy",
      }
    : {
        title: "可选访问统计",
        body: "是否允许仅统计页面浏览？搜索和其他交互不会作为自定义分析事件发送。",
        accept: "允许",
        reject: "拒绝",
        preferences: "隐私设置",
        privacy: "隐私政策",
        privacyHref: "/zh/privacy",
      },
);

function choose(nextConsent: Exclude<AnalyticsConsent, "unset">) {
  if (!writeAnalyticsConsent(nextConsent)) return;
  consent.value = nextConsent;
  isOpen.value = false;
}
</script>

<template>
  <template v-if="isReady">
    <aside
      v-if="isOpen"
      class="analytics-consent"
      data-testid="analytics-consent-panel"
      :aria-label="copy.title"
    >
      <div class="analytics-consent__copy">
        <strong>{{ copy.title }}</strong>
        <span>{{ copy.body }}</span>
        <a :href="copy.privacyHref">{{ copy.privacy }}</a>
      </div>
      <div class="analytics-consent__actions">
        <button type="button" data-choice="denied" @click="choose('denied')">
          {{ copy.reject }}
        </button>
        <button
          type="button"
          class="primary"
          data-choice="granted"
          @click="choose('granted')"
        >
          {{ copy.accept }}
        </button>
      </div>
    </aside>

    <button
      v-else
      type="button"
      class="analytics-preferences"
      data-testid="analytics-preferences"
      @click="isOpen = true"
    >
      {{ copy.preferences }}
    </button>
  </template>
</template>

<style scoped>
.analytics-consent {
  position: fixed;
  z-index: 100;
  right: 24px;
  bottom: 24px;
  left: 24px;
  display: flex;
  max-width: 760px;
  margin: 0 auto;
  padding: 16px 18px;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  color: var(--vp-c-text-1);
  background: color-mix(in srgb, var(--vp-c-bg) 94%, transparent);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: var(--vp-shadow-4);
  backdrop-filter: blur(12px);
}

.analytics-consent__copy {
  display: grid;
  gap: 5px;
  font-size: 14px;
  line-height: 1.45;
}

.analytics-consent__copy a {
  width: fit-content;
  color: var(--vp-c-brand-1);
  text-underline-offset: 3px;
}

.analytics-consent__actions {
  display: flex;
  flex: none;
  gap: 10px;
}

.analytics-consent__actions button {
  min-height: 38px;
  padding: 0 16px;
  color: inherit;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
}

.analytics-consent__actions .primary {
  color: var(--vp-c-white);
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.analytics-preferences {
  position: fixed;
  z-index: 99;
  right: 14px;
  bottom: 14px;
  padding: 7px 10px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  cursor: pointer;
}

@media (max-width: 720px) {
  .analytics-consent {
    align-items: stretch;
    flex-direction: column;
  }

  .analytics-consent__actions {
    justify-content: flex-end;
  }
}
</style>
