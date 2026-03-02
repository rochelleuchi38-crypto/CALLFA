<template>
  <div class="crop-status-card">
    <h3 class="card-title">Current Crop: {{ cropType }} ({{ cropVariety }})</h3>
    <div v-if="cropType !== 'No crop'" class="crop-content">
      <!-- Growth Stage -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">Growth Stage</span>
          <span class="progress-value">{{ growthStagePercent }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar green" :style="{ width: growthStagePercent + '%' }"></div>
        </div>
        <div class="progress-status">{{ growthStage }}</div>
      </div>

      <!-- Soil Moisture -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">Soil Moisture</span>
          <span class="progress-value">{{ moistureLevel }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar blue" :style="{ width: moistureLevel + '%' }"></div>
        </div>
        <div class="progress-status">{{ moistureStatus }}</div>
      </div>

      <!-- Nutrient Level -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">Nutrient Level</span>
          <span class="progress-value">{{ soilNutrient }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar orange" :style="{ width: soilNutrient + '%' }"></div>
        </div>
        <div class="progress-status">{{ nutrientStatus }}</div>
      </div>
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon">🌱</div>
      <p class="empty-text">No active crop</p>
      <p class="empty-subtext">Add a crop to get started</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFarmerStore } from '../stores/farmerStore'

const farmerStore = useFarmerStore()

const cropType = computed(() => farmerStore.currentCrop?.cropType || 'Rice')
const cropVariety = computed(() => farmerStore.currentCrop?.variety || 'IR-64')
const growthStage = computed(() => farmerStore.currentCrop?.growthStage || 'Vegetative Stage')
const growthStagePercent = computed(() => {
  const stage = growthStage.value.toLowerCase()
  if (stage.includes('seedling')) return 25
  if (stage.includes('vegetative')) return 65
  if (stage.includes('flowering')) return 85
  if (stage.includes('ripening')) return 95
  return 65
})
const soilNutrient = computed(() => farmerStore.currentCrop?.soilNutrient || 62)
const moistureLevel = computed(() => farmerStore.currentCrop?.moistureLevel || 78)

const moistureStatus = computed(() => {
  const level = moistureLevel.value
  if (level >= 70) return 'Optimal'
  if (level >= 50) return 'Good'
  return 'Low'
})

const nutrientStatus = computed(() => {
  const level = soilNutrient.value
  if (level >= 70) return 'Excellent'
  if (level >= 50) return 'Good'
  return 'Needs improvement'
})
</script>

<style scoped>
.crop-status-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 20px;
}

.crop-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-bar.green {
  background: #10b981;
}

.progress-bar.blue {
  background: #3b82f6;
}

.progress-bar.orange {
  background: #f59e0b;
}

.progress-status {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 4px;
}

.empty-subtext {
  font-size: 14px;
  color: #9ca3af;
}
</style>
