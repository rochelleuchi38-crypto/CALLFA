<template>
  <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
    <div class="flex items-center justify-between mb-3">
      <h4 class="font-semibold text-gray-800">{{ metric.metric }}</h4>
      <span
        class="text-2xl"
        :class="getTrendIconClass(metric.trend)"
      >
        {{ getTrendIcon(metric.trend) }}
      </span>
    </div>
    <div class="flex items-baseline gap-2 mb-3">
      <span class="text-3xl font-bold text-gray-800">{{ metric.value }}</span>
      <span class="text-gray-500">%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div
        class="h-2 rounded-full transition-all duration-500"
        :class="getProgressColor(metric.value)"
        :style="{ width: metric.value + '%' }"
      ></div>
    </div>
    <div class="mt-2 text-xs text-gray-600">
      Trend: <span class="font-semibold capitalize">{{ metric.trend }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  metric: {
    type: Object,
    required: true
  }
})

const getTrendIcon = (trend) => {
  const icons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  }
  return icons[trend] || icons.stable
}

const getTrendIconClass = (trend) => {
  const classes = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  }
  return classes[trend] || classes.stable
}

const getProgressColor = (value) => {
  if (value >= 80) return 'bg-green-500'
  if (value >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}
</script>

