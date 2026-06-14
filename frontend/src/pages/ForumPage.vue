<script setup>
import { onMounted, ref } from 'vue'
import { apiRequest } from '../api'

const posts = ref([])
const userId = ref('')
const title = ref('')
const body = ref('')
const error = ref('')

const loadPosts = async () => {
  posts.value = await apiRequest('/posts')
}

const submitPost = async () => {
  error.value = ''
  try {
    await apiRequest('/posts', {
      method: 'POST',
      headers: { 'x-user-id': userId.value },
      body: JSON.stringify({ title: title.value, body: body.value }),
    })
    title.value = ''
    body.value = ''
    await loadPosts()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadPosts)
</script>

<template>
  <section>
    <h2>Forum</h2>
    <label>User ID <input v-model="userId" placeholder="登录用户ID" /></label>
    <div>
      <input v-model="title" placeholder="Post title" />
      <textarea v-model="body" placeholder="Post body" />
      <button @click="submitPost">Publish</button>
      <p v-if="error">{{ error }}</p>
    </div>
    <ul>
      <li v-for="post in posts" :key="post.id">
        <strong v-if="post.is_pinned">[置顶]</strong> {{ post.title }}
        <p>{{ post.body }}</p>
      </li>
    </ul>
  </section>
</template>
