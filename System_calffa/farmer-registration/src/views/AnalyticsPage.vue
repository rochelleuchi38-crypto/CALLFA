<template>
  <div class="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-white p-4 lg:p-8 font-sans">
    
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl lg:text-5xl font-bold text-green-800 mb-3 flex items-center gap-3">
        <span class="text-4xl">📊</span>
        Analytics & Insights
      </h1>
      <p class="text-lg text-green-700">
        Actionable, data-driven insights and projections for your farm
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="text-6xl mb-4 animate-spin">🌾</div>
        <p class="text-green-700 font-semibold">Loading insights…</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
      <div class="flex items-center gap-3">
        <span class="text-3xl">⚠️</span>
        <div>
          <h3 class="font-bold text-red-800">Error loading analytics</h3>
          <p class="text-red-600">{{ error }}</p>
          <button 
            @click="loadAnalytics" 
            class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      
      <!-- Insights Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MLInsightCard
          title="Estimated yield"
          :value="mlInsights.predictedYield"
          unit="kg"
          icon="🌾"
          color="green"
          :trend="yieldTrend"
        />
        <MLInsightCard
          title="Crop Health Index"
          :value="mlInsights.healthIndex"
          unit="%"
          icon="💚"
          color="blue"
          :trend="healthTrend"
        />
        <MLInsightCard
          title="Pest/Disease Risk"
          :value="mlInsights.pestRisk"
          unit="%"
          icon="⚠️"
          color="red"
          :trend="riskTrend"
        />
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Yield Trends Chart -->
        <ChartCard
          title="Yield Trends"
          :data="analytics.yieldTrends"
          type="line"
          icon="📈"
        />
        
        <!-- Crop Performance Chart -->
        <ChartCard
          title="Crop Performance"
          :data="analytics.cropPerformance"
          type="bar"
          icon="🌱"
        />
      </div>

      <!-- Health Metrics -->
      <div class="bg-white rounded-xl shadow-md p-6 border border-green-200">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span class="text-3xl">💚</span>
          Health Metrics
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            v-for="metric in analytics.healthMetrics"
            :key="metric.metric"
            :metric="metric"
          />
        </div>
      </div>

      <!-- Recommendations -->
      <div class="bg-white rounded-xl shadow-md p-6 border border-green-200">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span class="text-3xl">💡</span>
          Recommendations
        </h2>
        <div class="space-y-3">
          <div
            v-for="(rec, index) in mlInsights.recommendations"
            :key="index"
            class="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <span class="text-2xl">💡</span>
            <p class="text-gray-700 flex-1">{{ rec }}</p>
          </div>
          <div v-if="mlInsights.recommendations.length === 0" class="text-center py-8 text-gray-500">
            No recommendations at this time
          </div>
        </div>
      </div>

      <!-- Projections Table -->
      <div class="bg-white rounded-xl shadow-md p-6 border border-green-200">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span class="text-3xl">🔮</span>
          Recent projections
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Prediction</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Confidence</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(pred, index) in analytics.predictions"
                :key="index"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4 font-medium text-gray-800">{{ pred.type }}</td>
                <td class="py-3 px-4">
                  <span class="font-semibold text-green-700">{{ pred.value }}</span>
                  <span class="text-gray-500 ml-1">{{ pred.unit || '' }}</span>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-green-500 h-2 rounded-full"
                        :style="{ width: pred.confidence + '%' }"
                      ></div>
                    </div>
                    <span class="text-sm font-medium">{{ pred.confidence }}%</span>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <span
                    class="px-3 py-1 rounded-full text-xs font-semibold"
                    :class="pred.confidence >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                  >
                    {{ pred.confidence >= 80 ? 'High' : 'Medium' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Refresh Button -->
      <div class="flex justify-end">
        <button
          @click="loadAnalytics"
          :disabled="loading"
          class="px-6 py-3 bg-gradient-to-r from-green-600 to-lime-500 text-white font-semibold rounded-xl shadow-md hover:scale-105 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <span>🔄</span>
          <span>Refresh insights</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmerStore } from '../stores/farmerStore'
import { useAuthStore } from '../stores/authStore'
import MLInsightCard from '../components/MLInsightCard.vue'
import ChartCard from '../components/ChartCard.vue'
import MetricCard from '../components/MetricCard.vue'

const router = useRouter()
const farmerStore = useFarmerStore()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref(null)

const mlInsights = computed(() => farmerStore.mlInsights)
const analytics = computed(() => farmerStore.analytics)

const yieldTrend = computed(() => {
  const trends = analytics.value.yieldTrends
  if (trends.length < 2) return 'stable'
  const recent = trends.slice(-2)
  return recent[1].yield > recent[0].yield ? 'up' : 'down'
})

const healthTrend = computed(() => {
  return mlInsights.value.healthIndex >= 80 ? 'up' : 'stable'
})

const riskTrend = computed(() => {
  return mlInsights.value.pestRisk < 30 ? 'down' : 'up'
})

const loadAnalytics = async () => {
  if (!authStore.currentUser?.id) {
    router.push('/login')
    return
  }

  loading.value = true
  error.value = null

  try {
    await Promise.all([
      farmerStore.getMLInsights(authStore.currentUser.id),
      farmerStore.getAnalytics(authStore.currentUser.id)
    ])
  } catch (err) {
    error.value = err.message || 'Failed to load analytics'
    console.error('Error loading analytics:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAnalytics()
})
</script>

