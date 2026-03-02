<template>
  <div class="admin-dashboard-container">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-top">
        <h1 class="dashboard-title">👨‍💼 Admin Dashboard</h1>
        <button @click="handleLogout" class="logout-button">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="logout-icon"
          >
            <path
              d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M16 17L21 12L16 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21 12H9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="logout-text">Logout</span>
        </button>
      </div>
      
      <!-- Quick Navigation Links -->
      <div class="quick-nav">
        <router-link to="/farmers-table" class="quick-nav-item">
          <span class="nav-icon">👥</span>
          <span class="nav-text">Members</span>
        </router-link>
        <router-link to="/system-activity" class="quick-nav-item">
          <span class="nav-icon">📋</span>
          <span class="nav-text">System Activity</span>
        </router-link>
        <router-link to="/financial-overview" class="quick-nav-item">
          <span class="nav-icon">💰</span>
          <span class="nav-text">Financial Overview</span>
        </router-link>
        <router-link to="/notification-center" class="quick-nav-item">
          <span class="nav-icon">🔔</span>
          <span class="nav-text">Notifications</span>
        </router-link>
        <router-link to="/audit-logs" class="quick-nav-item">
          <span class="nav-icon">📜</span>
          <span class="nav-text">Audit Logs</span>
        </router-link>
      </div>

      <!-- Stats Overview -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-label">Total Farmers</div>
            <div class="stat-value">{{ totalFarmers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending-icon">⏳</div>
          <div class="stat-info">
            <div class="stat-label">Pending Approvals</div>
            <div class="stat-value pending">{{ pendingCount }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon approved-icon">✓</div>
          <div class="stat-info">
            <div class="stat-label">Approved Farmers</div>
            <div class="stat-value approved">{{ approvedCount }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon rejected-icon">✗</div>
          <div class="stat-info">
            <div class="stat-label">Rejected Members</div>
            <div class="stat-value rejected">{{ rejectedCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Members Section -->
    <div class="section-card">
      <div class="section-header-with-actions">
        <h2 class="section-title">Pending Member Approvals</h2>
        <div v-if="pendingMembers.length > 0" class="bulk-actions">
          <button @click="approveAllPending" class="bulk-approve-btn" :disabled="processingBulk">
            <span v-if="!processingBulk">✓ Approve All ({{ pendingMembers.length }})</span>
            <span v-else>Processing...</span>
          </button>
          <button @click="refreshData" class="refresh-btn" :disabled="loading">
            🔄 Refresh
          </button>
        </div>
      </div>
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading pending members...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadPendingMembers" class="retry-btn">Retry</button>
      </div>
      <div v-else-if="pendingMembers.length === 0" class="empty-state">
        <p>No pending members to approve.</p>
        <p class="text-sm text-gray-500 mt-2">If you expect pending accounts, verify that:</p>
        <ul class="text-xs text-gray-400 mt-1">
          <li>- You are logged in as an admin account</li>
          <li>- The backend server is running (http://localhost:5000)</li>
          <li>- New users have status set to <code>pending</code> in the database</li>
        </ul>
      </div>
      <div v-else class="members-table">
        <table>
          <thead>
            <tr>
              <th>Reference Number</th>
              <th>Full Name</th>
              <th>Date of Birth</th>
              <th>Address</th>
              <th>Phone Number</th>
              <th>Role</th>
              <th>Registered Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in pendingMembers" :key="member.id">
              <td>{{ member.reference_number }}</td>
              <td>{{ member.full_name }}</td>
              <td>{{ formatDate(member.date_of_birth) }}</td>
              <td>{{ member.address }}</td>
              <td>{{ member.phone_number }}</td>
              <td>
                <span class="role-badge" :class="member.role">{{ member.role }}</span>
              </td>
              <td>{{ formatDate(member.registered_on) }}</td>
              <td>
                <div class="action-buttons">
                  <button
                    @click="approveMember(member.id)"
                    class="approve-btn"
                    :disabled="processingId === member.id"
                  >
                    {{ processingId === member.id ? 'Processing...' : '✓ Approve' }}
                  </button>
                  <button
                    @click="rejectMember(member.id)"
                    class="reject-btn"
                    :disabled="processingId === member.id"
                  >
                    ✗ Reject
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message-banner">
      <span class="success-icon">✓</span>
      <span class="success-text">{{ successMessage }}</span>
      <button @click="successMessage = ''" class="close-success">×</button>
    </div>

    <!-- All Farmers Section -->
    <div class="section-card">
      <h2 class="section-title">All Registered Farmers</h2>
      <div class="table-controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or reference number..."
          class="search-input"
        />
        <select v-model="filterStatus" class="filter-select">
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div v-if="loadingAll" class="loading-state">
        <div class="spinner"></div>
        <p>Loading farmers...</p>
      </div>
      <div v-else-if="errorAll" class="error-state">
        <p>{{ errorAll }}</p>
      </div>
      <div v-else-if="filteredFarmers.length === 0" class="empty-state">
        <p>No farmers found</p>
      </div>
      <div v-else class="members-table">
        <table>
          <thead>
            <tr>
              <th>Reference Number</th>
              <th>Full Name</th>
              <th>Date of Birth</th>
              <th>Address</th>
              <th>Phone Number</th>
              <th>Role</th>
              <th>Status</th>
              <th>Registered Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="farmer in filteredFarmers" :key="farmer.id">
              <td>{{ farmer.reference_number }}</td>
              <td>{{ farmer.full_name }}</td>
              <td>{{ formatDate(farmer.date_of_birth) }}</td>
              <td>{{ farmer.address }}</td>
              <td>{{ farmer.phone_number }}</td>
              <td>
                <span class="role-badge" :class="farmer.role">{{ farmer.role }}</span>
              </td>
              <td>
                <select 
                  :value="farmer.status || 'pending'"
                  @change="updateFarmerStatus(farmer.id, $event.target.value)"
                  class="status-select"
                  :disabled="processingId === farmer.id"
                >
                  <option value="pending">PENDING</option>
                  <option value="approved">APPROVED</option>
                  <option value="rejected">REJECTED</option>
                </select>
              </td>
              <td>{{ formatDate(farmer.registered_on) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Content Sections based on Sidebar Items -->
    <div class="dashboard-content-grid">
      <!-- Members Section -->
      <section class="content-section">
        <div class="section-header">
          <span class="section-icon">👥</span>
          <h3>Members</h3>
          <router-link to="/farmers-table" class="view-all-link">View All →</router-link>
        </div>
        <div class="section-body">
          <p class="description">Manage all registered farmers and their profiles.</p>
          <div class="quick-stats">
            <div class="quick-stat">
              <span class="label">Total Members:</span>
              <span class="value">{{ totalFarmers }}</span>
            </div>
            <div class="quick-stat">
              <span class="label">Approved:</span>
              <span class="value approved">{{ approvedCount }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- System Activity Section -->
      <section class="content-section">
        <div class="section-header">
          <span class="section-icon">📋</span>
          <h3>System Activity</h3>
          <router-link to="/system-activity" class="view-all-link">View →</router-link>
        </div>
        <div class="section-body">
          <p class="description">Monitor system-wide activities and events.</p>
          <div class="activity-preview">
            <p class="empty-message">Recent activities will appear here.</p>
          </div>
        </div>
      </section>

      <!-- Financial Overview Section -->
      <section class="content-section">
        <div class="section-header">
          <span class="section-icon">💰</span>
          <h3>Financial Overview</h3>
          <router-link to="/financial-overview" class="view-all-link">Details →</router-link>
        </div>
        <div class="section-body">
          <p class="description">View financial metrics and loan management.</p>
          <div class="quick-stats">
            <div class="quick-stat">
              <span class="label">Active Loans:</span>
              <span class="value">{{ financialStats?.activeLoans || 0 }}</span>
            </div>
            <div class="quick-stat">
              <span class="label">Pending:</span>
              <span class="value">{{ financialStats?.pendingLoans || 0 }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Notifications Section -->
      <section class="content-section">
        <div class="section-header">
          <span class="section-icon">🔔</span>
          <h3>Notifications</h3>
          <router-link to="/notification-center" class="view-all-link">Center →</router-link>
        </div>
        <div class="section-body">
          <p class="description">Manage system notifications and alerts.</p>
          <div class="quick-stats">
            <div class="quick-stat">
              <span class="label">Unread:</span>
              <span class="value">{{ notificationStats?.unread || 0 }}</span>
            </div>
            <div class="quick-stat">
              <span class="label">Total:</span>
              <span class="value">{{ notificationStats?.total || 0 }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Audit Logs Section -->
      <section class="content-section">
        <div class="section-header">
          <span class="section-icon">📜</span>
          <h3>Audit Logs</h3>
          <router-link to="/audit-logs" class="view-all-link">Logs →</router-link>
        </div>
        <div class="section-body">
          <p class="description">Review comprehensive system audit trails.</p>
          <div class="activity-preview">
            <p class="empty-message">Audit logs will appear here.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const loadingAll = ref(false)
const error = ref('')
const errorAll = ref('')
const pendingMembers = ref([])
const allFarmers = ref([])
const searchQuery = ref('')
const filterStatus = ref('approved')
const processingId = ref(null)
const processingBulk = ref(false)
const successMessage = ref('')
const financialStats = ref({ activeLoans: 12, pendingLoans: 5 })
const notificationStats = ref({ unread: 3, total: 24 })

const totalFarmers = computed(() => allFarmers.value.length)
const pendingCount = computed(() => pendingMembers.value.length)
const approvedCount = computed(() => allFarmers.value.filter(f => f.status === 'approved').length)
const rejectedCount = computed(() => allFarmers.value.filter(f => f.status === 'rejected').length)

const filteredFarmers = computed(() => {
  let filtered = allFarmers.value

  // Filter by status
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(f => (f.status || 'pending') === filterStatus.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(f =>
      f.full_name.toLowerCase().includes(query) ||
      f.reference_number.toLowerCase().includes(query)
    )
  }

  return filtered
})

const loadPendingMembers = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/farmers/pending')

    if (!response.ok) {
      // try to read body for better error message
      const text = await response.text().catch(() => '')
      throw new Error(`HTTP error: ${response.status} ${response.statusText}. ${text}`)
    }

    const data = await response.json().catch(() => null)
    console.debug('Admin pending fetch response:', data)

    // Support multiple response shapes: { success:true, farmers: [...] } or direct array
    if (data && data.success) {
      if (Array.isArray(data.farmers)) {
        pendingMembers.value = data.farmers
      } else {
        // If success but no farmers property, fallback to empty array
        pendingMembers.value = []
      }
    } else if (Array.isArray(data)) {
      // API returned array directly
      pendingMembers.value = data
    } else {
      throw new Error((data && data.message) || 'Failed to load pending members')
    }
  } catch (err) {
    error.value = err.message || 'Error loading pending members. Please check if the backend server is running.'
    console.error('Error loading pending members:', err)
    // Set empty array on error to prevent UI issues
    pendingMembers.value = []
  } finally {
    loading.value = false
  }
}

const loadAllFarmers = async () => {
  loadingAll.value = true
  errorAll.value = ''

  try {
    const response = await fetch('/api/farmers')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()

    if (data.success) {
      allFarmers.value = data.farmers || []
      // If no farmers returned but success, set empty array
      if (!data.farmers || data.farmers.length === 0) {
        allFarmers.value = []
      }
    } else {
      // Handle case where response is array directly (old format)
      if (Array.isArray(data)) {
        allFarmers.value = data
      } else {
        throw new Error(data.message || 'Failed to load farmers')
      }
    }
  } catch (err) {
    errorAll.value = err.message || 'Error loading farmers. Please check if the backend server is running.'
    console.error('Error loading farmers:', err)
    // Set empty array on error to prevent UI issues
    allFarmers.value = []
  } finally {
    loadingAll.value = false
  }
}

const approveMember = async (memberId) => {
  if (!confirm('Are you sure you want to approve this member? They will be able to login after approval.')) {
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    const response = await fetch(`/api/farmers/${memberId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (data.success) {
      // Remove from pending and update all farmers list
      const member = pendingMembers.value.find(m => m.id === memberId)
      if (member) {
        member.status = 'approved'
        // Update in allFarmers if exists, otherwise add
        const existingIndex = allFarmers.value.findIndex(f => f.id === memberId)
        if (existingIndex >= 0) {
          allFarmers.value[existingIndex] = { ...member }
        } else {
          allFarmers.value.push({ ...member })
        }
        pendingMembers.value = pendingMembers.value.filter(m => m.id !== memberId)
      }
      
      successMessage.value = `Member "${member?.full_name || memberId}" approved successfully! They can now login.`
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
    } else {
      throw new Error(data.message || 'Failed to approve member')
    }
  } catch (err) {
    alert('Error approving member: ' + err.message)
    console.error('Error approving member:', err)
  } finally {
    processingId.value = null
  }
}

const approveAllPending = async () => {
  if (pendingMembers.value.length === 0) {
    return
  }

  if (!confirm(`Are you sure you want to approve all ${pendingMembers.value.length} pending members?`)) {
    return
  }

  processingBulk.value = true
  successMessage.value = ''

  try {
    const approvePromises = pendingMembers.value.map(member => 
      fetch(`/api/farmers/${member.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )

    const responses = await Promise.all(approvePromises)
    const results = await Promise.all(responses.map(r => r.json()))

    const successCount = results.filter(r => r.success).length
    const failedCount = results.length - successCount

    // Update all approved members
    const approvedMembers = pendingMembers.value.filter((member, index) => results[index].success)
    approvedMembers.forEach(member => {
      member.status = 'approved'
      const existingIndex = allFarmers.value.findIndex(f => f.id === member.id)
      if (existingIndex >= 0) {
        allFarmers.value[existingIndex] = { ...member }
      } else {
        allFarmers.value.push({ ...member })
      }
    })

    // Remove approved members from pending
    pendingMembers.value = pendingMembers.value.filter((member, index) => !results[index].success)

    if (successCount > 0) {
      successMessage.value = `Successfully approved ${successCount} member(s)! ${failedCount > 0 ? `${failedCount} failed.` : ''}`
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
    }

    if (failedCount > 0) {
      alert(`Approved ${successCount} members, but ${failedCount} failed. Please try again.`)
    }
  } catch (err) {
    alert('Error approving members: ' + err.message)
    console.error('Error approving members:', err)
  } finally {
    processingBulk.value = false
  }
}

const refreshData = async () => {
  await Promise.all([
    loadPendingMembers(),
    loadAllFarmers()
  ])
}

// Auto-refresh data every 30 seconds
const startAutoRefresh = () => {
  setInterval(async () => {
    if (!loading.value && !loadingAll.value) {
      await refreshData()
    }
  }, 30000) // 30 seconds
}

const updateFarmerStatus = async (farmerId, newStatus) => {
  if (!confirm(`Are you sure you want to change this account status to "${newStatus.toUpperCase()}"?`)) {
    return
  }

  processingId.value = farmerId
  successMessage.value = ''

  try {
    const response = await fetch(`/api/farmers/${farmerId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus
      })
    })

    const data = await response.json()

    if (data.success) {
      // Update farmer in allFarmers array
      const farmerIndex = allFarmers.value.findIndex(f => f.id === farmerId)
      if (farmerIndex >= 0) {
        allFarmers.value[farmerIndex].status = newStatus
      }

      // Update in pendingMembers if exists
      const pendingIndex = pendingMembers.value.findIndex(m => m.id === farmerId)
      if (pendingIndex >= 0) {
        if (newStatus === 'approved' || newStatus === 'rejected') {
          // Remove from pending if approved or rejected
          pendingMembers.value.splice(pendingIndex, 1)
        } else {
          // Update status in pending list
          pendingMembers.value[pendingIndex].status = newStatus
        }
      } else if (newStatus === 'pending') {
        // Add to pending if status changed to pending
        const farmer = allFarmers.value.find(f => f.id === farmerId)
        if (farmer) {
          pendingMembers.value.push({ ...farmer, status: 'pending' })
        }
      }

      const farmer = allFarmers.value.find(f => f.id === farmerId)
      successMessage.value = `Status updated to "${newStatus.toUpperCase()}" for ${farmer?.full_name || 'member'}`
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)

      // Refresh data to get updated counts
      await Promise.all([
        loadPendingMembers(),
        loadAllFarmers()
      ])
    } else {
      throw new Error(data.message || 'Failed to update status')
    }
  } catch (err) {
    alert('Error updating status: ' + err.message)
    console.error('Error updating status:', err)
  } finally {
    processingId.value = null
  }
}

const rejectMember = async (memberId) => {
  if (!confirm('Are you sure you want to reject this member? This action cannot be undone.')) {
    return
  }

  processingId.value = memberId

  try {
    const response = await fetch(`/api/farmers/${memberId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (data.success) {
      // Remove from pending
      pendingMembers.value = pendingMembers.value.filter(m => m.id !== memberId)
      alert('Member rejected successfully!')
    } else {
      throw new Error(data.message || 'Failed to reject member')
    }
  } catch (err) {
    alert('Error rejecting member: ' + err.message)
    console.error('Error rejecting member:', err)
  } finally {
    processingId.value = null
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    authStore.logout()
    router.push('/')
  }
}

onMounted(async () => {
  // Check if user is admin
  if (!authStore.currentUser || authStore.currentUser.role !== 'admin') {
    router.push('/login')
    return
  }

  await Promise.all([
    loadPendingMembers(),
    loadAllFarmers()
  ])

  // Start auto-refresh
  startAutoRefresh()
})
</script>

<style scoped>
.admin-dashboard-container {
  min-height: calc(100vh - 70px);
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f9fafb;
}

.dashboard-header {
  margin-bottom: 32px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.logout-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.logout-button:active {
  transform: translateY(0);
}

.logout-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.logout-button:hover .logout-icon {
  transform: translateX(2px);
}

.logout-text {
  font-weight: 600;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}

.stat-value.pending {
  color: #f59e0b;
}

.stat-value.approved {
  color: #10b981;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.section-header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.bulk-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.bulk-approve-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.bulk-approve-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.bulk-approve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn {
  padding: 10px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #d1fae5;
  border: 1px solid #10b981;
  border-radius: 8px;
  margin-bottom: 24px;
  color: #065f46;
}

.success-icon {
  font-size: 20px;
  font-weight: 700;
  color: #10b981;
}

.success-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.close-success {
  background: transparent;
  border: none;
  color: #065f46;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-success:hover {
  background: rgba(5, 95, 70, 0.1);
}

.table-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #166534;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: 8px 16px;
  background: #166534;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
}

.members-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  color: white;
}

th {
  padding: 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.2s;
}

tbody tr:hover {
  background: #f9fafb;
}

td {
  padding: 12px;
  font-size: 14px;
  color: #111827;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.approve-btn,
.reject-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn {
  background: #10b981;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background: #059669;
}

.reject-btn {
  background: #ef4444;
  color: white;
}

.reject-btn:hover:not(:disabled) {
  background: #dc2626;
}

.approve-btn:disabled,
.reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.role-badge.farmer {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.admin {
  background: #fef3c7;
  color: #92400e;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.approved {
  background: #d1fae5;
  color: #059669;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #dc2626;
}

.status-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #111827;
  transition: all 0.2s;
  text-transform: uppercase;
}

.status-select:focus {
  outline: none;
  border-color: #166534;
  box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.1);
}

.status-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-select option {
  text-transform: uppercase;
  font-weight: 600;
}

.processing-indicator {
  color: #6b7280;
  font-size: 14px;
  margin-left: 8px;
}

@media (max-width: 768px) {
  .admin-dashboard-container {
    padding: 16px;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .table-controls {
    flex-direction: column;
  }

  .members-table {
    overflow-x: scroll;
  }

  table {
    min-width: 800px;
  }

  .dashboard-content-grid {
    grid-template-columns: 1fr;
  }

  .quick-nav {
    flex-wrap: wrap;
  }
}

/* Dashboard Content Grid Styles */
.dashboard-content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 32px;
}

.content-section {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

.content-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #d1d5db;
}

.content-section .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 2px solid #f3f4f6;
  background: linear-gradient(135deg, #fafbfc 0%, #f3f4f6 100%);
}

.content-section .section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-section .section-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
}

.content-section .view-all-link {
  color: #059669;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(5, 150, 105, 0.1);
  transition: all 0.2s;
  white-space: nowrap;
}

.content-section .view-all-link:hover {
  background: rgba(5, 150, 105, 0.2);
  color: #047857;
}

.section-body {
  padding: 20px;
}

.description {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.quick-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(31, 41, 55, 0.05);
  border-radius: 8px;
  border-left: 3px solid #059669;
}

.quick-stat .label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
}

.quick-stat .value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.quick-stat .value.approved {
  color: #10b981;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-action-btn {
  padding: 12px 16px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.quick-action-btn:hover {
  background: #f9fafb;
  border-color: #059669;
  color: #059669;
}

.quick-action-btn span {
  font-size: 16px;
}

.activity-preview {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
}

.empty-message {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
  padding: 8px 0;
}

/* Quick Navigation Bar */
.quick-nav {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  overflow-x: auto;
  scroll-behavior: smooth;
  margin-bottom: 16px;
}

.quick-nav::-webkit-scrollbar {
  height: 4px;
}

.quick-nav::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.quick-nav::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.quick-nav::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.quick-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}

.quick-nav-item:hover {
  background: #f3f4f6;
  border-color: #059669;
  color: #059669;
}

.quick-nav-item .nav-icon {
  font-size: 16px;
}

.quick-nav-item .nav-text {
  display: none;
}

@media (min-width: 768px) {
  .quick-nav-item .nav-text {
    display: inline;
  }
}

/* Updated Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.pending-icon {
  font-size: 26px;
}

.stat-icon.approved-icon {
  font-size: 26px;
}

.stat-icon.rejected-icon {
  font-size: 26px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.stat-value.pending {
  color: #f59e0b;
}

.stat-value.approved {
  color: #10b981;
}

.stat-value.rejected {
  color: #ef4444;
}
</style>
