<template>
  <div class="market-prices-card">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-lg text-gray-800 flex items-center gap-2">
        <span class="text-xl">📈</span>
        Today's Market Prices
      </h3>
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span class="text-xs bg-gray-100 px-2 py-1 rounded">{{ lastUpdatedText }}</span>
        <button 
          @click="refreshPrices" 
          :disabled="isLoading"
          class="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Refresh prices"
        >
          <svg 
            :class="{'animate-spin': isLoading}" 
            class="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !hasPrices" class="space-y-3">
      <div v-for="n in 3" :key="n" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-pulse">
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div class="text-right space-y-1">
          <div class="h-5 bg-gray-200 rounded w-16"></div>
          <div class="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-4">
      <div class="text-red-500 mb-2">⚠️ Failed to load prices</div>
      <button 
        @click="refreshPrices" 
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        Try Again
      </button>
    </div>

    <!-- Prices List -->
    <div v-else class="prices-list">
      <div 
        v-for="commodity in commodities" 
        :key="commodity.id"
        class="price-item"
      >
        <div class="price-left">
          <span class="price-icon">{{ commodity.icon }}</span>
          <span class="price-name">{{ commodity.name }}</span>
        </div>
        <div class="price-right">
          <div class="price-value">P{{ getPrice(commodity.id) }}/kg</div>
          <div class="price-change" :class="getChangeColor(commodity.id)">
            {{ getChange(commodity.id) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Auto-update indicator -->
    <div v-if="!isLoading && hasPrices" class="mt-3 pt-3 border-t border-gray-100">
      <div class="text-xs text-gray-400 text-center">
        Auto-updates every 5 minutes
        <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
          <div 
            class="bg-blue-500 h-1 rounded-full transition-all duration-1000" 
            :style="{ width: `${updateProgress}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useFarmerStore } from '../stores/farmerStore'

const farmerStore = useFarmerStore()
const isLoading = ref(false)
const error = ref(null)
const updateProgress = ref(0)
let updateInterval
let progressInterval

// Define commodities with their metadata
const commodities = [
  { id: 'rice', name: 'Rice (IR-64)', icon: '🌾', region: 'National Average' },
  { id: 'corn', name: 'Corn', icon: '🌽', region: 'National Average' },
  { id: 'tomatoes', name: 'Tomatoes', icon: '🍅', region: 'National Average' },
  { id: 'onions', name: 'Onions', icon: '🧅', region: 'National Average' }
]

// Computed properties
const hasPrices = computed(() => {
  return farmerStore.marketPrices && Object.keys(farmerStore.marketPrices).length > 0
})

const lastUpdatedText = computed(() => {
  if (!hasPrices.value) return 'Loading...'
  
  const timestamps = commodities.map(commodity => {
    const ts = farmerStore.marketPrices?.[commodity.id]?.timestamp
    return ts ? new Date(ts) : null
  }).filter(ts => ts)
  
  if (timestamps.length === 0) return 'Just now'
  
  const latest = new Date(Math.max(...timestamps))
  const now = new Date()
  const diffMinutes = Math.floor((now - latest) / (1000 * 60))
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes === 1) return '1 min ago'
  if (diffMinutes < 60) return `${diffMinutes} mins ago`
  
  return latest.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
})

// Methods
const getPrice = (commodityId) => {
  const prices = {
    rice: 24.50,
    corn: 18.75,
    tomatoes: 35.20,
    onions: 42.80
  }
  return farmerStore.marketPrices?.[commodityId]?.price?.toFixed(2) || prices[commodityId]?.toFixed(2) || '--'
}

const getChange = (commodityId) => {
  const changes = {
    rice: '+2.3%',
    corn: '+1.1%',
    tomatoes: '-0.8%',
    onions: '+3.2%'
  }
  const change = farmerStore.marketPrices?.[commodityId]?.change
  if (!change) return changes[commodityId] || '--'
  
  const changeValue = parseFloat(change)
  if (isNaN(changeValue)) return change
  
  const sign = changeValue > 0 ? '+' : ''
  return `${sign}${changeValue}%`
}

const getChangeColor = (commodityId) => {
  const change = farmerStore.marketPrices?.[commodityId]?.change
  if (!change) return 'text-gray-500'
  
  const changeValue = parseFloat(change)
  if (isNaN(changeValue)) return 'text-gray-500'
  
  return changeValue > 0 ? 'text-green-600' : changeValue < 0 ? 'text-red-600' : 'text-gray-500'
}

const getCommodityColor = (commodityId) => {
  const colors = {
    rice: { bg: 'bg-green-50', text: 'text-green-600' },
    corn: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    tomatoes: { bg: 'bg-red-50', text: 'text-red-600' },
    onions: { bg: 'bg-purple-50', text: 'text-purple-600' }
  }
  return colors[commodityId] || { bg: 'bg-gray-50', text: 'text-gray-600' }
}

const getUpdateTime = (commodityId) => {
  const timestamp = farmerStore.marketPrices?.[commodityId]?.timestamp
  if (!timestamp) return '--:--'
  
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const refreshPrices = async () => {
  try {
    isLoading.value = true
    error.value = null
    await farmerStore.getMarketPrices()
    resetProgressBar()
  } catch (err) {
    error.value = 'Failed to fetch market prices'
    console.error('Error fetching market prices:', err)
  } finally {
    isLoading.value = false
  }
}

const resetProgressBar = () => {
  updateProgress.value = 100
  const startTime = Date.now()
  const duration = 300000 // 5 minutes
  
  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, duration - elapsed)
    updateProgress.value = (remaining / duration) * 100
    
    if (remaining <= 0) {
      clearInterval(progressInterval)
    }
  }, 1000)
}

// Lifecycle
onMounted(async () => {
  await refreshPrices()
  
  // Update every 5 minutes
  updateInterval = setInterval(refreshPrices, 300000)
})

onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval)
  if (progressInterval) clearInterval(progressInterval)
})
</script>

<style scoped>
.market-prices-card {
  background: #fed7aa;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #fdba74;
}

.prices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.price-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price-icon {
  font-size: 24px;
}

.price-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.price-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.price-value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.price-change {
  font-size: 13px;
  font-weight: 600;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>