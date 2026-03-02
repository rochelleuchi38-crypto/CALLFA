<template>
  <div class="metrics-grid">
    <!-- Crop Health -->
    <div class="metric-card">
      <div class="metric-header">
        <div class="metric-label">Crop Health</div>
        <div class="metric-change positive">+2%</div>
      </div>
      <div class="metric-value">{{ cropHealth }}%</div>
      <div class="metric-status">{{ cropHealthStatus }}</div>
    </div>

    <!-- Days to Harvest -->
    <div class="metric-card">
      <div class="metric-header">
        <div class="metric-label">Days to Harvest</div>
        <div class="metric-change neutral">-3 days</div>
      </div>
      <div class="metric-value">{{ daysToHarvest }}</div>
      <div class="metric-status">{{ harvestStatus }}</div>
    </div>

    <!-- Yield -->
    <div class="metric-card">
      <div class="metric-header">
        <div class="metric-label">Yield (MT/ha)</div>
        <div class="metric-change positive">+0.4</div>
      </div>
      <div class="metric-value">{{ yieldValue }}</div>
      <div class="metric-status">{{ yieldStatus }}</div>
    </div>

    <!-- Savings -->
    <div class="metric-card">
      <div class="metric-header">
        <div class="metric-label">Savings</div>
        <div class="metric-change positive">+P1.2K</div>
      </div>
      <div class="metric-value">{{ savings }}</div>
      <div class="metric-status">{{ savingsStatus }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFarmerStore } from '../stores/farmerStore'

const farmerStore = useFarmerStore()

const cropHealth = computed(() => farmerStore.overview?.cropHealth || 85)
const cropHealthStatus = computed(() => {
  const health = cropHealth.value
  if (health >= 80) return 'Excellent condition'
  if (health >= 60) return 'Good condition'
  return 'Needs attention'
})

const daysToHarvest = computed(() => farmerStore.overview?.daysToHarvest || 22)
const harvestStatus = computed(() => {
  const days = daysToHarvest.value
  if (days <= 30) return 'On schedule'
  if (days <= 45) return 'Approaching'
  return 'In progress'
})

const yieldValue = computed(() => farmerStore.overview?.yieldEstimate || 5.8)
const yieldStatus = computed(() => {
  const yieldVal = yieldValue.value
  if (yieldVal >= 5.5) return 'Above average'
  if (yieldVal >= 4.5) return 'Average'
  return 'Below average'
})

const savings = computed(() => {
  const amount = farmerStore.overview?.savings || 12400
  if (amount >= 1000) return `P${(amount / 1000).toFixed(1)}K`
  return `P${amount}`
})
const savingsStatus = computed(() => 'Monthly growth')
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(0.75rem, 3vw, 1.5rem);
  margin-bottom: clamp(1.5rem, 4vw, 2rem);
}

/* Mobile: 1 column */
@media (min-width: 480px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 4 columns */
@media (min-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Extra large desktop: 4 columns with better spacing */
@media (min-width: 1280px) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: clamp(1rem, 4vw, 2rem);
  }
}

.metric-card {
  background: white;
  border-radius: clamp(0.375rem, 2vw, 0.75rem);
  padding: clamp(1rem, 4vw, 1.5rem);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: clamp(140px, auto, 180px);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: clamp(0.5rem, 2vw, 0.75rem);
  gap: 0.5rem;
}

.metric-label {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  color: #6b7280;
  font-weight: 500;
  flex: 1;
  word-break: break-word;
}

.metric-change {
  font-size: clamp(0.625rem, 1.5vw, 0.75rem);
  font-weight: 600;
  padding: clamp(0.125rem, 1vw, 0.25rem) clamp(0.375rem, 2vw, 0.5rem);
  border-radius: clamp(0.25rem, 1vw, 0.375rem);
  white-space: nowrap;
  flex-shrink: 0;
}

.metric-change.positive {
  color: #10b981;
  background: #d1fae5;
}

.metric-change.neutral {
  color: #3b82f6;
  background: #dbeafe;
}

.metric-change.negative {
  color: #ef4444;
  background: #fee2e2;
}

.metric-value {
  font-size: clamp(1.75rem, 6vw, 2rem);
  font-weight: 700;
  color: #111827;
  margin-bottom: clamp(0.5rem, 2vw, 0.75rem);
  line-height: 1;
  word-break: break-word;
}

.metric-status {
  font-size: clamp(0.7rem, 1.8vw, 0.8125rem);
  color: #6b7280;
  font-weight: 500;
  margin-top: auto;
}

/* Extra small devices (320px and up) - ensure everything is readable */
@media (max-width: 480px) {
  .metric-card {
    padding: clamp(0.75rem, 3vw, 1rem);
    min-height: auto;
  }

  .metric-header {
    flex-wrap: wrap;
    margin-bottom: clamp(0.375rem, 1.5vw, 0.5rem);
  }

  .metric-label {
    width: 100%;
    margin-bottom: 0.25rem;
  }

  .metric-value {
    margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
  }
}

/* Landscape mobile (max 600px height) */
@media (max-height: 600px) and (max-width: 768px) {
  .metric-card {
    padding: clamp(0.75rem, 2vw, 1rem);
  }

  .metric-value {
    font-size: clamp(1.25rem, 4vw, 1.5rem);
  }
}
</style>
