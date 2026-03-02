<template>
  <div class="min-h-screen bg-gray-50 p-4 lg:p-6">
    <DashboardHeader :user="authStore.currentUser" />
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">⚡ Quick Actions</h1>
      <QuickActions />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import QuickActions from '../components/QuickActions.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
  }
})
</script>

