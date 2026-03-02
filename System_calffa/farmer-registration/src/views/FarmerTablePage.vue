<template>
  <div class="min-h-screen bg-gray-50 p-4 lg:p-6">
    <DashboardHeader :user="authStore.currentUser" />
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">� Members Management</h1>
      
      <!-- Tabs -->
      <div class="tabs-container mb-6">
        <button 
          @click="activeTab = 'pending'" 
          :class="['tab-btn', { 'active': activeTab === 'pending' }]"
        >
          ⏳ Pending Approval ({{ pendingCount }})
        </button>
        <button 
          @click="activeTab = 'registered'" 
          :class="['tab-btn', { 'active': activeTab === 'registered' }]"
        >
          ✅ Registered Members ({{ registeredCount }})
        </button>
        <button 
          @click="activeTab = 'rejected'" 
          :class="['tab-btn', { 'active': activeTab === 'rejected' }]"
        >
          ✗ Rejected Accounts ({{ rejectedCount }})
        </button>
      </div>

      <!-- Tab Content -->
      <div v-if="activeTab === 'pending'">
        <PendingFarmersTab 
          :farmers="pendingFarmers"
          :loading="loading"
          :error="error"
          @approve="handleApprove"
          @reject="handleReject"
          @delete="handleDelete"
          @update-role="handleUpdateRole"
          @refresh="loadFarmers"
        />
      </div>
      <div v-else-if="activeTab === 'rejected'">
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Rejected Accounts</h2>
            <div v-if="loading" class="text-center py-8">
              <div class="spinner"></div>
              <p class="text-gray-500 mt-2">Loading...</p>
            </div>
            <div v-else-if="rejectedFarmers.length === 0" class="text-center py-8">
              <p class="text-gray-500">No rejected accounts</p>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference #</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="farmer in rejectedFarmers" :key="farmer.id">
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <div class="flex justify-center">
                        <img 
                          v-if="farmer.profile_picture" 
                          :src="`http://localhost:3000${farmer.profile_picture}`" 
                          alt="Profile" 
                          class="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                        />
                        <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg">
                          👤
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ farmer.full_name }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-500">{{ farmer.reference_number }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-500">{{ farmer.contact_number }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {{ farmer.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        @click="handleApprove(farmer.id)" 
                        class="text-green-600 hover:text-green-900 mr-3"
                      >
                        Approve
                      </button>
                      <button 
                        @click="handleDelete(farmer.id)" 
                        class="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <FarmerTable 
          :farmers="registeredFarmers"
          :loading="loading"
          :error="error"
          :user-barangay-id="userBarangayId"
          :is-president="isPresident"
          @member-updated="loadFarmers"
          @member-deleted="loadFarmers"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import FarmerTable from '../components/FarmerTable.vue'
import PendingFarmersTab from '../components/PendingFarmersTab.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const activeTab = ref('pending')
const allFarmers = ref([])
const loading = ref(false)
const error = ref(null)

// Check authorization - only admin and president can access
const isAuthorized = computed(() => {
  const user = authStore.currentUser
  return user && ['admin', 'president'].includes(user.role)
})

const userBarangayId = computed(() => {
  return authStore.currentUser?.barangay_id
})

const isAdmin = computed(() => {
  return authStore.currentUser?.role === 'admin'
})

const isPresident = computed(() => {
  return authStore.currentUser?.role === 'president'
})

const pendingFarmers = computed(() => {
  return allFarmers.value.filter(f => f.status === 'pending' || !f.status)
})

const registeredFarmers = computed(() => {
  return allFarmers.value.filter(f => f.status === 'approved')
})

const rejectedFarmers = computed(() => {
  return allFarmers.value.filter(f => f.status === 'rejected')
})

const pendingCount = computed(() => pendingFarmers.value.length)

const registeredCount = computed(() => registeredFarmers.value.length)

const rejectedCount = computed(() => rejectedFarmers.value.length)

const loadFarmers = async () => {
  loading.value = true
  error.value = null
  try {
    const token = authStore.token
    // Call root endpoint to get all farmers with all statuses (pending, approved, rejected)
    const response = await fetch('/api/farmers', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    if (response.ok) {
      const data = await response.json()
      if (isAdmin.value) {
        // Admin can see all farmers from all barangays
        allFarmers.value = data.farmers || data || []
      } else if (isPresident.value) {
        // President sees only farmers from their own barangay
        const farmers = data.farmers || data || []
        if (userBarangayId.value) {
          allFarmers.value = farmers.filter(
            f => f.barangay_id === userBarangayId.value
          )
        } else {
          allFarmers.value = farmers
        }
      } else {
        error.value = 'Insufficient permissions to view members'
        allFarmers.value = []
      }
    } else if (response.status === 403) {
      error.value = 'You do not have permission to view members. Only Admins and Presidents can access this page.'
      allFarmers.value = []
    } else {
      error.value = 'Failed to load farmers'
    }
  } catch (err) {
    console.error('Error loading farmers:', err)
    error.value = err.message || 'Failed to load farmers'
  } finally {
    loading.value = false
  }
}

const handleApprove = async (farmerId) => {
  try {
    const token = authStore.token
    const response = await fetch(`/api/farmers/${farmerId}/approve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    const data = await response.json()
    if (response.ok) {
      await loadFarmers()
      alert('Farmer approved successfully!')
    } else {
      alert('Failed to approve farmer: ' + (data.message || 'Unknown error'))
    }
  } catch (err) {
    alert('Error approving farmer: ' + err.message)
  }
}

const handleReject = async (farmerId) => {
  try {
    const token = authStore.token
    const response = await fetch(`/api/farmers/${farmerId}/reject`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    const data = await response.json()
    if (response.ok) {
      await loadFarmers()
      alert('Farmer rejected successfully!')
    } else {
      alert('Failed to reject farmer: ' + (data.message || 'Unknown error'))
    }
  } catch (err) {
    alert('Error rejecting farmer: ' + err.message)
  }
}

const handleDelete = async (farmerId) => {
  try {
    const response = await fetch(`/api/farmers/${farmerId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) {
      await loadFarmers()
      alert('Farmer deleted successfully!')
    } else {
      const data = await response.json()
      alert('Failed to delete farmer: ' + (data.message || 'Unknown error'))
    }
  } catch (err) {
    alert('Error deleting farmer: ' + err.message)
  }
}

const handleUpdateRole = async ({ memberId, newRole }) => {
  try {
    const response = await fetch(`/api/farmers/${memberId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    })
    if (response.ok) {
      await loadFarmers()
    } else {
      const data = await response.json()
      alert('Failed to update role: ' + (data.message || 'Unknown error'))
      await loadFarmers() // Refresh to reset dropdown
    }
  } catch (err) {
    alert('Error updating role: ' + err.message)
    await loadFarmers() // Refresh to reset dropdown
  }
}

onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }
  // Check authorization
  if (!isAuthorized.value) {
    alert('You do not have permission to access Member Management. Only Admins and Presidents can approve members.')
    router.push('/dashboard')
    return
  }
  loadFarmers()
})
</script>

<style scoped>
.tabs-container {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.tab-btn.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}
</style>