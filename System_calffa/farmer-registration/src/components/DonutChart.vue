<template>
  <div class="donut-chart-container">
    <svg :width="size" :height="size" class="donut-chart">
      <circle
        cx="50%"
        cy="50%"
        :r="radius"
        fill="transparent"
        stroke="#e5e7eb"
        :stroke-width="strokeWidth"
      />
      <circle
        cx="50%"
        cy="50%"
        :r="radius"
        fill="transparent"
        :stroke="incomeColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="`${incomeLength} ${circumference - incomeLength}`"
        stroke-dashoffset="0"
        stroke-linecap="butt"
        transform="rotate(-90 50 50)"
        class="chart-segment"
      />
      <circle
        cx="50%"
        cy="50%"
        :r="radius"
        fill="transparent"
        :stroke="expenseColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="`${expenseLength} ${circumference - expenseLength}`"
        :stroke-dashoffset="incomeLength"
        stroke-linecap="butt"
        transform="rotate(-90 50 50)"
        class="chart-segment"
      />
      <circle
        cx="50%"
        cy="50%"
        :r="radius"
        fill="transparent"
        :stroke="savingsColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="`${savingsLength} ${circumference - savingsLength}`"
        :stroke-dashoffset="incomeLength + expenseLength"
        stroke-linecap="butt"
        transform="rotate(-90 50 50)"
        class="chart-segment"
      />
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        class="chart-center-text"
      >
        <tspan x="50%" dy="-0.3em" class="chart-total">Total</tspan>
        <tspan x="50%" dy="1.2em" class="chart-amount">P{{ totalAmount }}</tspan>
      </text>
    </svg>
    <div class="chart-legend">
      <div class="legend-item">
        <div class="legend-color" :style="{ backgroundColor: incomeColor }"></div>
        <span class="legend-label">Income</span>
        <span class="legend-value">P{{ income }}</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" :style="{ backgroundColor: expenseColor }"></div>
        <span class="legend-label">Expenses</span>
        <span class="legend-value">P{{ expenses }}</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" :style="{ backgroundColor: savingsColor }"></div>
        <span class="legend-label">Savings</span>
        <span class="legend-value">P{{ savings }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  income: {
    type: Number,
    default: 800000
  },
  expenses: {
    type: Number,
    default: 200000
  },
  savings: {
    type: Number,
    default: 200000
  },
  size: {
    type: Number,
    default: 200
  }
})

const incomeColor = '#10b981'
const expenseColor = '#ef4444'
const savingsColor = '#6b7280'

const totalAmount = computed(() => {
  return (props.income + props.expenses + props.savings).toLocaleString()
})

const radius = computed(() => props.size / 2 - 10)
const strokeWidth = computed(() => props.size / 10)
const circumference = computed(() => 2 * Math.PI * radius.value)

const incomePercentage = computed(() => (props.income / (props.income + props.expenses + props.savings)) * 100)
const expensePercentage = computed(() => (props.expenses / (props.income + props.expenses + props.savings)) * 100)
const savingsPercentage = computed(() => (props.savings / (props.income + props.expenses + props.savings)) * 100)

const incomeLength = computed(() => (incomePercentage.value / 100) * circumference.value)
const expenseLength = computed(() => (expensePercentage.value / 100) * circumference.value)
const savingsLength = computed(() => (savingsPercentage.value / 100) * circumference.value)
</script>

<style scoped>
.donut-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.donut-chart {
  width: 100%;
  height: auto;
}

.chart-segment {
  transition: stroke-dashoffset 0.5s ease;
}

.chart-center-text {
  font-size: 14px;
  fill: #111827;
}

.chart-total {
  font-size: 12px;
  fill: #6b7280;
  font-weight: 500;
}

.chart-amount {
  font-size: 18px;
  fill: #111827;
  font-weight: 700;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  color: #6b7280;
  font-weight: 500;
}

.legend-value {
  color: #111827;
  font-weight: 600;
}
</style>

