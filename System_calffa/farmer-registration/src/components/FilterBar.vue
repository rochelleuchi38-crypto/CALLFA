<template>
  <div class="bg-white rounded-xl shadow-md border border-green-200 p-6 mb-6">
    <!-- Category Buttons -->
    <div class="mb-4">
      <div class="flex flex-wrap gap-3">
        <button
          v-for="category in categories"
          :key="category"
          @click="selectCategory(category)"
          :class="[
            'px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200',
            selectedCategory === category
              ? 'bg-green-600 text-white shadow-md scale-105'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <!-- Controls Row -->
    <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <!-- Toggle and Dropdown -->
      <div class="flex flex-wrap gap-4 items-center">
        <!-- View Saved Toggle -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="showSavedOnly"
            @change="handleToggleSaved"
            class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <span class="text-sm font-medium text-gray-700">View Saved Practices</span>
        </label>

        <!-- Crop Selection Dropdown -->
        <div class="flex items-center gap-2">
          <label for="cropSelect" class="text-sm font-medium text-gray-700">Crop:</label>
          <select
            id="cropSelect"
            v-model="selectedCrop"
            @change="handleCropChange"
            class="px-4 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700"
          >
            <option value="all">All Crops</option>
            <option value="rice">Rice</option>
            <option value="corn">Corn</option>
            <option value="wheat">Wheat</option>
            <option value="vegetables">Vegetables</option>
            <option value="tomato">Tomato</option>
          </select>
        </div>
      </div>

      <!-- Results Count -->
      <div class="text-sm text-gray-600">
        Showing <span class="font-semibold text-green-700">{{ filteredCount }}</span> practices
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const emit = defineEmits(['filter-change'])

const categories = ['All Practices', 'Soil', 'Fertilizer', 'Irrigation', 'Pest Management', 'Water Management']
const selectedCategory = ref('All Practices')
const showSavedOnly = ref(false)
const selectedCrop = ref('all')
const filteredCount = ref(0)

const selectCategory = (category) => {
  selectedCategory.value = category
  emitFilterChange()
}

const handleToggleSaved = () => {
  emitFilterChange()
}

const handleCropChange = () => {
  emitFilterChange()
}

const emitFilterChange = () => {
  emit('filter-change', {
    category: selectedCategory.value,
    crop: selectedCrop.value,
    savedOnly: showSavedOnly.value
  })
}

// Update count when filters change
watch([selectedCategory, selectedCrop, showSavedOnly], () => {
  emitFilterChange()
})

defineExpose({
  updateCount: (count) => {
    filteredCount.value = count
  }
})
</script>



