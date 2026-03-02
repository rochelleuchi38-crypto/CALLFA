<template>
  <div class="min-h-screen bg-gray-50 p-4 lg:p-6">
    <DashboardHeader :user="authStore.currentUser" />

    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">📈 Market Prices</h1>
        <p class="text-gray-600">Real-time market prices for different rice varieties, updated hourly</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="space-y-4">
          <div class="flex justify-between items-center p-4 bg-green-50 rounded-lg">
            <div class="flex items-center gap-4">
              <span class="text-4xl">🌾</span>
              <div>
                <div class="font-semibold text-lg text-gray-800">Rice (Regular)</div>
                <div class="text-sm text-gray-600">Per kilogram</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-2xl text-green-600">₱{{ (farmerStore.marketPrices?.rice?.price || 22.50).toFixed(2) }}</div>
              <div class="text-sm text-green-600 font-medium">{{ farmerStore.marketPrices?.rice?.change || '+2.5%' }}</div>
              <div class="text-xs text-gray-500 mt-1">
                Updated: {{ formatTimestamp(farmerStore.marketPrices?.rice?.timestamp) }}
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
            <div class="flex items-center gap-4">
              <span class="text-4xl">🌾</span>
              <div>
                <div class="font-semibold text-lg text-gray-800">Premium Rice</div>
                <div class="text-sm text-gray-600">Per kilogram</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-2xl text-blue-600">₱28.50</div>
              <div class="text-sm text-blue-600 font-medium">+1.8%</div>
              <div class="text-xs text-gray-500 mt-1">Updated: Just now</div>
            </div>
          </div>

          <div class="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
            <div class="flex items-center gap-4">
              <span class="text-4xl">🌾</span>
              <div>
                <div class="font-semibold text-lg text-gray-800">Organic Rice</div>
                <div class="text-sm text-gray-600">Per kilogram</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-2xl text-yellow-600">₱35.00</div>
              <div class="text-sm text-yellow-600 font-medium">+3.2%</div>
              <div class="text-xs text-gray-500 mt-1">Updated: Just now</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import { useFarmerStore } from '../stores/farmerStore'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const farmerStore = useFarmerStore()
const authStore = useAuthStore()

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Just now'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }

  try {
    await farmerStore.getMarketPrices()
    // Auto-refresh every 5 minutes
    setInterval(async () => {
      await farmerStore.getMarketPrices()
    }, 300000)
  } catch (error) {
    console.error('Failed to load market prices:', error)
  }
})
</script>

