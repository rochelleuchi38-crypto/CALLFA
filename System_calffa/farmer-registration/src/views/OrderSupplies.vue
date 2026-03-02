<template>
  <div class="min-h-screen bg-gray-50 p-4 lg:p-6">
    <DashboardHeader :user="authStore.currentUser" />

    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">🛒 Order Supplies</h1>
        <p class="text-gray-600">Order fertilizers, seeds, and tools directly from partner suppliers</p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <!-- Fertilizers -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="text-4xl mb-4 text-center">🌿</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Fertilizers</h3>
          <p class="text-sm text-gray-600 mb-4">Organic and chemical fertilizers for your crops</p>
          <button @click="openOrderModal('fertilizer')" class="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">
            Order Now
          </button>
        </div>

        <!-- Seeds -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="text-4xl mb-4 text-center">🌱</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Seeds</h3>
          <p class="text-sm text-gray-600 mb-4">High-quality seeds for various crops</p>
          <button @click="openOrderModal('seeds')" class="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">
            Order Now
          </button>
        </div>

        <!-- Tools -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="text-4xl mb-4 text-center">🔧</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Tools</h3>
          <p class="text-sm text-gray-600 mb-4">Essential farming tools and equipment</p>
          <button @click="openOrderModal('tools')" class="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">
            Order Now
          </button>
        </div>
      </div>

      <!-- Order Modal -->
      <div v-if="showOrderModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-green-700">🛒 Order {{ orderType }}</h2>
            <button @click="showOrderModal = false" class="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
          </div>
          <div class="text-center py-8">
            <div class="text-6xl mb-4">📦</div>
            <p class="text-gray-600 mb-4">Order form for {{ orderType }} will be available soon.</p>
            <p class="text-sm text-gray-500">This feature is coming in the next update!</p>
          </div>
          <button @click="showOrderModal = false" class="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const showOrderModal = ref(false)
const orderType = ref('')

const openOrderModal = (type) => {
  orderType.value = type.charAt(0).toUpperCase() + type.slice(1)
  showOrderModal.value = true
}

onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
  }
})
</script>

