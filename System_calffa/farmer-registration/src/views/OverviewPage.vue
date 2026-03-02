<template>
  <div class="min-h-screen bg-gray-50 p-4 lg:p-6">
    <DashboardHeader :user="authStore.currentUser" />
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">📊 Farm Overview</h1>
      <OverviewCards :overview="farmerStore.overview" />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import OverviewCards from '../components/OverviewCards.vue'
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
    console.error('Failed to load overview data:', error)
  }
})
</script>

