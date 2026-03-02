<template>
  <div class="min-h-screen bg-gray-50 p-4 lg:p-6">
    <DashboardHeader :user="authStore.currentUser" />
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">📋 Farm Tasks</h1>
      <FarmTasks :tasks="farmerStore.tasks" />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import FarmTasks from '../components/FarmTasks.vue'
import { useFarmerStore } from '../stores/farmerStore'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const farmerStore = useFarmerStore()
const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }

  try {
    await farmerStore.getFarmData(authStore.currentUser.id)
  } catch (error) {
    console.error('Failed to load tasks:', error)
  }
})
</script>

