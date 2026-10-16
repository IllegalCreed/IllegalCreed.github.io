<script setup lang="ts">
import { computed } from "vue";
import { showcaseProjects, type Locale } from "./projects";

const props = defineProps<{ locale: Locale }>();

const items = computed(() =>
  showcaseProjects.map((project) => ({
    id: project.id,
    image: project.image,
    imageAlt: project.imageAlt[props.locale],
    title: project.title[props.locale],
    description: project.description[props.locale],
    links: project.links.map((link) => ({
      href: link.href,
      label: link.label[props.locale],
    })),
  })),
);
</script>

<template>
  <ul class="project-grid">
    <li v-for="project in items" :key="project.id" class="project-card">
      <img
        class="project-card__image"
        :src="project.image"
        :alt="project.imageAlt"
        width="1200"
        height="675"
        loading="lazy"
        decoding="async"
      />
      <div class="project-card__body">
        <h3 class="project-card__title">{{ project.title }}</h3>
        <p class="project-card__desc">{{ project.description }}</p>
        <p class="project-card__links">
          <a
            v-for="link in project.links"
            :key="link.href"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ link.label }}
          </a>
        </p>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17.5rem, 1fr));
  gap: 16px;
  margin: 1.25rem 0 0.5rem;
  padding: 0;
  list-style: none;
}

.project-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.project-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #0b1220;
}

.project-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 16px;
}

.project-card__title {
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--vp-c-text-1);
  font-size: 1.05rem;
  font-weight: 650;
  line-height: 1.4;
}

.project-card__desc {
  flex: 1;
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.92rem;
  line-height: 1.65;
}

.project-card__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin: 4px 0 0;
}

.project-card__links a {
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.4;
}
</style>
