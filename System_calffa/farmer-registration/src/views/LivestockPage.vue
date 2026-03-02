<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-lime-50 p-4 lg:p-6 font-sans">
    <DashboardHeader :user="authStore.currentUser" />
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-green-800 mb-6 flex items-center gap-3">
        <span class="text-4xl">🐄</span>
        Livestock
      </h1>
      <div class="bg-white rounded-xl shadow-md p-6 border border-green-200">
        <p class="text-green-700 text-lg">Livestock management information will be displayed here.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
  }
})
</script>

