<template>
  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-green-700">🚜 Farmer Login</h2>
        <button @click="closeModal" class="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
      </div>
      <div v-if="errorMessage" class="mb-4 p-3 rounded-lg bg-red-100 text-red-800 text-sm">
        {{ errorMessage }}
      </div>
      <form @submit.prevent="submitLogin" class="space-y-4">
        <div>
          <label class="flex items-center text-sm font-semibold mb-1 text-green-800">
            <span class="mr-2">🆔</span> Reference Number
          </label>
          <input v-model="form.referenceNumber" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
        </div>
        <div>
          <label class="flex items-center text-sm font-semibold mb-1 text-green-800">
            <span class="mr-2">🔑</span> Password
          </label>
          <input type="password" v-model="form.password" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-green-600 to-lime-500 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-lime-600 shadow-lg transition transform hover:scale-105">
          🌾 Login
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const showModal = ref(false)
const errorMessage = ref('')
const form = ref({
  referenceNumber: '',
  password: ''
})

const openModal = () => {
  showModal.value = true
  errorMessage.value = ''
}

const closeModal = () => {
  showModal.value = false
  form.value = { referenceNumber: '', password: '' }
  errorMessage.value = ''
}

const submitLogin = async () => {
  errorMessage.value = ''
  
  if (!form.value.referenceNumber || !form.value.password) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  const result = await authStore.login(form.value.referenceNumber, form.value.password)
  
  if (result.success) {
    closeModal()
    router.push('/welcome')
  } else {
    errorMessage.value = result.error || 'Login failed. Please try again.'
  }
}

// Expose methods for parent component
defineExpose({ openModal, closeModal })
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
