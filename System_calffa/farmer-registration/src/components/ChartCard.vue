<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-green-200">
    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      <span class="text-2xl">{{ icon }}</span>
      {{ title }}
    </h3>
    
    <!-- Simple Chart Visualization -->
    <div class="h-64 flex items-end justify-between gap-2">
      <div
        v-for="(item, index) in chartData"
        :key="index"
        class="flex-1 flex flex-col items-center gap-2"
      >
        <div class="relative w-full flex items-end justify-center" style="height: 200px;">
          <div
            class="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
            :class="getBarColor(index)"
            :style="{ height: getBarHeight(item) + '%' }"
            :title="getTooltip(item)"
          ></div>
        </div>
        <div class="text-xs font-medium text-gray-600 text-center">
          {{ getLabel(item) }}
        </div>
        <div class="text-sm font-bold text-green-700">
          {{ getValue(item) }}
        </div>
      </div>
    </div>

    <!-- Chart Legend -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex items-center justify-center gap-4 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-500 rounded"></div>
          <span class="text-gray-600">Current Period</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-blue-500 rounded"></div>
          <span class="text-gray-600">Previous Period</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  data: Array,
  type: {
    type: String,
    default: 'bar'
  },
  icon: String
})

const chartData = computed(() => props.data || [])

const maxValue = computed(() => {
  if (chartData.value.length === 0) return 100
  const values = chartData.value.map(item => {
    if (props.type === 'line') return item.yield || item.value || 0
    return item.yield || item.efficiency || item.value || 0
  })
  return Math.max(...values, 100) // Ensure minimum of 100 for better visualization
})

const getBarHeight = (item) => {
  const value = props.type === 'line' 
    ? (item.yield || item.value || 0)
    : (item.yield || item.efficiency || item.value || 0)
  return (value / maxValue.value) * 100
}

const getBarColor = (index) => {
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500']
  return colors[index % colors.length]
}

const getLabel = (item) => {
  return item.month || item.crop || item.metric || 'N/A'
}

const getValue = (item) => {
  if (props.type === 'line') {
    return (item.yield || item.value || 0).toLocaleString()
  }
  return (item.yield || item.efficiency || item.value || 0).toLocaleString()
}

const getTooltip = (item) => {
  return `${getLabel(item)}: ${getValue(item)}`
}
</script>

