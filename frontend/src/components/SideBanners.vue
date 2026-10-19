<template>
  <aside v-if="banners.length" class="side-rail" :class="`side-${side}`">
    <a
      v-for="b in banners"
      :key="b.id"
      class="side-banner"
      :href="b.link_url || undefined"
      :target="b.link_url ? '_blank' : undefined"
      :rel="b.link_url ? 'noopener noreferrer' : undefined"
    >
      <img v-if="b.image_url" :src="resolveMedia(b.image_url)" :alt="b.title" loading="lazy" />
      <span class="side-banner-mask"></span>
      <span class="side-banner-title">{{ b.title }}</span>
    </a>
  </aside>
</template>

<script setup>
import { resolveMedia } from '../api'

defineProps({
  banners: { type: Array, default: () => [] },
  side: { type: String, default: 'left' }, // left | right
})
</script>

<style scoped>
.side-rail {
  position: sticky;
  top: 88px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}
.side-banner {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  text-decoration: none;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.side-banner:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(0, 0, 0, .16);
  border-color: var(--border-strong, var(--border-light));
}
.side-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.side-banner-mask {
  position: absolute;
  inset: auto 0 0;
  height: 55%;
  background: linear-gradient(to top, rgba(0, 0, 0, .72), rgba(0, 0, 0, 0));
  pointer-events: none;
}
.side-banner-title {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  text-shadow: 0 1px 6px rgba(0, 0, 0, .45);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
