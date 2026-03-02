<template>
  <div class="weather-card">
    <h3 class="card-title">Weather Advisory</h3>
    <div class="weather-content">
      <!-- Today -->
      <div class="weather-item">
        <div class="weather-header">
          <div class="weather-icon">{{ todayIcon }}</div>
          <div class="weather-info">
            <div class="weather-day">Today</div>
            <div class="weather-temp">{{ todayTemp }}°C</div>
            <div class="weather-condition">{{ todayCondition }}</div>
            <div class="weather-rain">Rain: {{ todayRain }}%</div>
          </div>
        </div>
      </div>

      <!-- Tomorrow -->
      <div class="weather-item">
        <div class="weather-header">
          <div class="weather-icon">{{ tomorrowIcon }}</div>
          <div class="weather-info">
            <div class="weather-day">Tomorrow</div>
            <div class="weather-temp">{{ tomorrowTemp }}°C</div>
            <div class="weather-condition">{{ tomorrowCondition }}</div>
            <div class="weather-rain">Rain: {{ tomorrowRain }}%</div>
          </div>
        </div>
      </div>

      <!-- Advisory -->
      <div class="weather-advisory">
        <div class="advisory-label">Advisory:</div>
        <div class="advisory-text">{{ advisoryText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFarmerStore } from '../stores/farmerStore'

const farmerStore = useFarmerStore()

const todayIcon = computed(() => farmerStore.weather?.today?.icon || '🌤️')
const todayTemp = computed(() => farmerStore.weather?.today?.temp || 28)
const todayCondition = computed(() => farmerStore.weather?.today?.condition || 'Partly Cloudy')
const todayRain = computed(() => farmerStore.weather?.today?.rain || 30)

const tomorrowIcon = computed(() => farmerStore.weather?.tomorrow?.icon || '🌧️')
const tomorrowTemp = computed(() => farmerStore.weather?.tomorrow?.temp || 26)
const tomorrowCondition = computed(() => farmerStore.weather?.tomorrow?.condition || 'Heavy Rain')
const tomorrowRain = computed(() => farmerStore.weather?.tomorrow?.rain || 90)

const advisoryText = computed(() => {
  if (tomorrowRain.value >= 80) {
    return 'Heavy rain expected tomorrow. Consider postponing fieldwork and ensure proper drainage.'
  }
  return farmerStore.weather?.advisory || 'Normal weather conditions expected.'
})
</script>

<style scoped>
.weather-card {
  background: #dbeafe;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #bfdbfe;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 20px;
}

.weather-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weather-item {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  padding: 16px;
}

.weather-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.weather-icon {
  font-size: 48px;
  line-height: 1;
}

.weather-info {
  flex: 1;
}

.weather-day {
  font-size: 16px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 4px;
}

.weather-temp {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.weather-condition {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 4px;
}

.weather-rain {
  font-size: 13px;
  color: #6b7280;
}

.weather-advisory {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #3b82f6;
}

.advisory-label {
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 8px;
}

.advisory-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}
</style>
