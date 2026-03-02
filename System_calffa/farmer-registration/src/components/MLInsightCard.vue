<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-green-200 hover:shadow-xl transition-all duration-300">
    <div class="flex items-center justify-between mb-4">
      <div class="text-3xl">{{ icon }}</div>
      <div
        class="px-3 py-1 rounded-full text-xs font-semibold"
        :class="getTrendClass(trend)"
      >
        {{ getTrendIcon(trend) }} {{ trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable' }}
      </div>
    </div>
    <h3 class="text-base font-semibold text-gray-700 mb-2">{{ title }}</h3>
    <div class="flex items-baseline gap-2">
      <span class="text-3xl font-bold" :class="getColorClass(color)">
        {{ formattedValue }}
      </span>
      <span class="text-lg text-gray-500">{{ unit }}</span>
    </div>
    <div class="mt-4 w-full bg-gray-200 rounded-full h-2">
      <div
        class="h-2 rounded-full transition-all duration-500"
        :class="getColorClass(color)"
        :style="{ width: Math.min(value, 100) + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  value: Number,
  unit: String,
  icon: String,
  color: {
    type: String,
    default: 'green'
  },
  trend: {
    type: String,
    default: 'stable'
  }
})

const formattedValue = computed(() => {
  if (props.unit === 'kg') {
    return new Intl.NumberFormat('en-PH').format(props.value)
  }
  return props.value
})

const getColorClass = (color) => {
  const colors = {
    green: 'text-green-600 bg-green-500',
    blue: 'text-blue-600 bg-blue-500',
    red: 'text-red-600 bg-red-500',
    yellow: 'text-yellow-600 bg-yellow-500'
  }
  return colors[color] || colors.green
}

const getTrendClass = (trend) => {
  const classes = {
    up: 'bg-green-100 text-green-700',
    down: 'bg-red-100 text-red-700',
    stable: 'bg-gray-100 text-gray-700'
  }
  return classes[trend] || classes.stable
}

const getTrendIcon = (trend) => {
  const icons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  }
  return icons[trend] || icons.stable
}
</script>

