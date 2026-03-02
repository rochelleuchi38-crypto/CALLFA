<template>
  <div class="quick-actions-card">
    <h3 class="card-title">Quick Actions</h3>
    <div class="actions-grid">
      <button @click="logActivity" class="action-btn">
        <span class="action-icon">📝</span>
        <span class="action-label">Log Activity</span>
      </button>
      <button @click="orderSupplies" class="action-btn">
        <span class="action-icon">📦</span>
        <span class="action-label">Order Supplies</span>
      </button>
      <button @click="viewReports" class="action-btn">
        <span class="action-icon">📊</span>
        <span class="action-label">View Reports</span>
      </button>
      <button @click="getSupport" class="action-btn">
        <span class="action-icon">💬</span>
        <span class="action-label">Get Support</span>
      </button>
    </div>

    <!-- Add Crop Modal -->
    <div v-if="showCropModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-green-700">🌾 Add New Crop</h2>
          <button @click="showCropModal = false" class="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        </div>
        <form @submit.prevent="submitCrop" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Crop Type</label>
            <select v-model="cropForm.crop_type" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="Rice">Rice</option>
              <option value="Corn">Corn</option>
              <option value="Wheat">Wheat</option>
              <option value="Vegetables">Vegetables</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Area (Hectares)</label>
            <input type="number" v-model.number="cropForm.area_hectares" step="0.1" min="0.1" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Planted Date</label>
            <input type="date" v-model="cropForm.planted_date" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Growth Stage</label>
            <select v-model="cropForm.growth_stage" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="Seedling">Seedling</option>
              <option value="Vegetative">Vegetative</option>
              <option value="Flowering">Flowering</option>
              <option value="Ripening">Ripening</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1 text-gray-700">Soil Nutrient (%)</label>
              <input type="number" v-model.number="cropForm.soil_nutrient_level" min="0" max="100" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1 text-gray-700">Moisture Level (%)</label>
              <input type="number" v-model.number="cropForm.moisture_level" min="0" max="100" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div class="flex gap-3 pt-4">
            <button type="submit" class="flex-1 bg-gradient-to-r from-green-600 to-lime-500 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-lime-600 shadow-lg transition">
              Add Crop
            </button>
            <button type="button" @click="showCropModal = false" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmerStore } from '../stores/farmerStore'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const farmerStore = useFarmerStore()
const authStore = useAuthStore()

const showCropModal = ref(false)
const cropForm = ref({
  crop_type: 'Rice',
  area_hectares: 1,
  planted_date: new Date().toISOString().split('T')[0],
  growth_stage: 'Vegetative',
  soil_nutrient_level: 75,
  moisture_level: 65
})

const logActivity = () => {
  router.push('/log-activity')
}

const viewReports = () => {
  router.push('/reports')
}

const getSupport = () => {
  router.push('/support')
}

const submitCrop = async () => {
  if (!authStore.currentUser?.id) {
    alert('Please login first')
    return
  }

  const result = await farmerStore.addCrop({
    farmer_id: authStore.currentUser.id,
    ...cropForm.value
  })

  if (result.success) {
    alert('Crop added successfully! 🌾')
    showCropModal.value = false
    // Reset form
    cropForm.value = {
      crop_type: 'Rice',
      area_hectares: 1,
      planted_date: new Date().toISOString().split('T')[0],
      growth_stage: 'Vegetative',
      soil_nutrient_level: 75,
      moisture_level: 65
    }
    // Refresh dashboard data
    await farmerStore.getFarmData(authStore.currentUser.id)
  } else {
    alert('Error adding crop: ' + (result.error || result.message))
  }
}

const orderSupplies = () => {
  router.push('/order-supplies')
}
</script>

<style scoped>
.quick-actions-card {
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

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 32px;
}

.action-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-align: center;
}
</style>
