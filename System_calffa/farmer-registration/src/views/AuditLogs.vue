<template>
  <div class="min-h-screen bg-gray-50 p-4 lg:p-6">
    <DashboardHeader :user="authStore.currentUser" />

    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">📋 Audit Logs</h1>
        <p class="text-gray-600">Recent user actions and activity history for transparency</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="space-y-4">
          <template v-if="auditLogs.length">
            <div v-for="(log, index) in auditLogs" :key="index" class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div class="text-2xl">{{ log.icon }}</div>
              <div class="flex-1">
                <div class="font-semibold text-gray-800">{{ log.action }}</div>
                <div class="text-sm text-gray-600 mt-1">{{ log.description }}</div>
                <div class="text-xs text-gray-500 mt-2">{{ log.timestamp }}</div>
              </div>
              <span :class="['text-xs px-2 py-1 rounded-full', log.type === 'success' ? 'bg-green-100 text-green-600' : log.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600']">
                {{ log.type }}
              </span>
            </div>
          </template>

          <div v-else class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">📋</div>
            <p>No activity logs yet</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const auditLogs = ref([
  {
    icon: '🌾',
    action: 'Crop Added',
    description: 'Added new rice crop to farm',
    timestamp: '2 hours ago',
    type: 'success'
  },
  {
    icon: '✅',
    action: 'Task Completed',
    description: 'Completed task: Water the rice fields',
    timestamp: '5 hours ago',
    type: 'success'
  },
  {
    icon: '🔐',
    action: 'Login',
    description: 'Successfully logged into dashboard',
    timestamp: '1 day ago',
    type: 'info'
  },
  {
    icon: '📊',
    action: 'Dashboard Viewed',
    description: 'Viewed farm overview and statistics',
    timestamp: '1 day ago',
    type: 'info'
  }
])

onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
  }
})
</script>

