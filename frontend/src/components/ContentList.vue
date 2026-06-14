<script setup>
defineProps({
  title: String,
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section>
    <h2>{{ title }}</h2>
    <ul v-if="items.length">
      <li v-for="item in items" :key="item.id">
        <h3>{{ item.title }}</h3>
        <p>{{ item.body }}</p>
      </li>
    </ul>
    <p v-else>No content yet.</p>
  </section>
</template>
