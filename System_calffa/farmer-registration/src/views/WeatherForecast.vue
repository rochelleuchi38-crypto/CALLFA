<template>
  <div class="min-h-screen bg-gray-50 p-4 lg:p-6">
    <DashboardHeader :user="authStore.currentUser" />
    
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">🌤️ Weather Forecast</h1>
        <p class="text-gray-600">3-day weather forecast with actionable advisories</p>
      </div>

        <div class="grid md:grid-cols-3 gap-6">
          <!-- Today -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="text-center mb-4">
              <div class="text-5xl mb-2">{{ farmerStore.weather?.today?.icon || '☀️' }}</div>
              <h3 class="text-lg font-semibold text-gray-800">Today</h3>
              <div class="text-2xl font-bold text-blue-600 mt-2">{{ farmerStore.weather?.today?.temp || 28 }}°C</div>
              <div class="text-gray-600 mt-1">{{ farmerStore.weather?.today?.condition || 'Sunny' }}</div>
            </div>
            <div class="mt-4 p-3 bg-blue-50 rounded-lg">
              <p class="text-sm text-gray-700">{{ farmerStore.weather?.today?.advice || 'Good day for fieldwork' }}</p>
            </div>
          </div>

          <!-- Tomorrow -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="text-center mb-4">
              <div class="text-5xl mb-2">{{ farmerStore.weather?.tomorrow?.icon || '🌧️' }}</div>
              <h3 class="text-lg font-semibold text-gray-800">Tomorrow</h3>
              <div class="text-2xl font-bold text-green-600 mt-2">{{ farmerStore.weather?.tomorrow?.temp || 25 }}°C</div>
              <div class="text-gray-600 mt-1">{{ farmerStore.weather?.tomorrow?.condition || 'Rainy' }}</div>
            </div>
            <div class="mt-4 p-3 bg-green-50 rounded-lg">
              <p class="text-sm text-gray-700">{{ farmerStore.weather?.tomorrow?.advice || 'Prepare for rain; delay planting' }}</p>
            </div>
          </div>

          <!-- Day After Tomorrow -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="text-center mb-4">
              <div class="text-5xl mb-2">⛅</div>
              <h3 class="text-lg font-semibold text-gray-800">Day After</h3>
              <div class="text-2xl font-bold text-yellow-600 mt-2">27°C</div>
              <div class="text-gray-600 mt-1">Partly Cloudy</div>
            </div>
            <div class="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p class="text-sm text-gray-700">Moderate conditions, suitable for most farm activities</p>
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

onMounted(async () => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }

  try {
    await farmerStore.getWeather()
  } catch (error) {
    console.error('Failed to load weather data:', error)
  }
})
</script>

