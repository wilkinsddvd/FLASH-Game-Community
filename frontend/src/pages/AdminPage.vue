<script setup>
import { onMounted, ref } from 'vue'
import { apiRequest } from '../api'

const adminId = ref('1')
const contentType = ref('display')
const items = ref([])
const title = ref('')
const body = ref('')
const editingId = ref(null)
const error = ref('')

const load = async () => {
  items.value = await apiRequest(`/content/${contentType.value}`)
}

const save = async () => {
  error.value = ''
  try {
    if (editingId.value) {
      await apiRequest(`/content/${contentType.value}/${editingId.value}`, {
        method: 'PUT',
        headers: { 'x-user-id': adminId.value },
        body: JSON.stringify({ title: title.value, body: body.value }),
      })
    } else {
      await apiRequest(`/content/${contentType.value}`, {
        method: 'POST',
        headers: { 'x-user-id': adminId.value },
        body: JSON.stringify({ title: title.value, body: body.value }),
      })
    }
    editingId.value = null
    title.value = ''
    body.value = ''
    await load()
  } catch (err) {
    error.value = err.message
  }
}

const editItem = (item) => {
  editingId.value = item.id
  title.value = item.title
  body.value = item.body
}

const remove = async (id) => {
  await apiRequest(`/content/${contentType.value}/${id}`, {
    method: 'DELETE',
    headers: { 'x-user-id': adminId.value },
  })
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h2>Admin CRUD</h2>
    <label>Admin ID <input v-model="adminId" /></label>
    <label>
      Page
      <select v-model="contentType" @change="load">
        <option value="display">display</option>
        <option value="guide">guide</option>
        <option value="developer">developer</option>
      </select>
    </label>
    <div>
      <input v-model="title" placeholder="title" />
      <textarea v-model="body" placeholder="body" />
      <button @click="save">{{ editingId ? 'Update' : 'Create' }}</button>
      <p v-if="error">{{ error }}</p>
    </div>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.title }}
        <button @click="editItem(item)">Edit</button>
        <button @click="remove(item.id)">Delete</button>
      </li>
    </ul>
  </section>
</template>
