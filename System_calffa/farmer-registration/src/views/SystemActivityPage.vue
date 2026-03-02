<template>
  <div class="system-activity-container">
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-icon">📋</span>
        System Activity Logs
      </h1>
      <p class="page-subtitle">Monitor all system activities, logins, profile updates, and loan transactions</p>
    </div>

    <div class="filters-section">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search activities..."
          class="search-input"
        />
      </div>
      <div class="filter-buttons">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="filter-btn"
          :class="{ active: selectedFilter === filter.value }"
          @click="selectedFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading activity logs...</p>
    </div>

    <div v-else class="activity-list-container">
      <div
        v-for="activity in filteredActivities"
        :key="activity.id"
        class="activity-card"
        :class="activity.type"
      >
        <div class="activity-header">
          <div class="activity-icon">{{ activity.icon }}</div>
          <div class="activity-info">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-time">{{ formatDate(activity.timestamp) }}</div>
          </div>
          <span class="activity-badge" :class="activity.urgency">{{ activity.urgency || 'normal' }}</span>
        </div>
        <div class="activity-description">{{ activity.description }}</div>
        <div class="activity-meta">
          <span class="meta-item">User: {{ activity.user }}</span>
          <span class="meta-item">Action: {{ activity.action }}</span>
        </div>
      </div>

      <div v-if="filteredActivities.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">No activities found</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const searchQuery = ref('')
const selectedFilter = ref('all')
const loading = ref(false)
const activities = ref([])
const stats = ref(null)

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Logins', value: 'login' },
  { label: 'Profile Updates', value: 'profile_update' },
  { label: 'Loan Activities', value: 'loan' },
  { label: 'Member Approvals', value: 'membership_change' },
  { label: 'Accounts', value: 'account_created' }
]

onMounted(() => {
  loadActivityLogs()
  loadStats()
})

// Watch for filter changes and reload
watch(selectedFilter, () => {
  loadActivityLogs()
})

const loadActivityLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ limit: 100, offset: 0 })
    if (selectedFilter.value !== 'all') {
      // "loan" filter matches multiple loan activity types
      if (selectedFilter.value === 'loan') {
        // Don't send activity_type; we'll filter client-side for loan_*
      } else {
        params.append('activity_type', selectedFilter.value)
      }
    }
    
    const response = await fetch(`http://localhost:3000/api/activity-logs?${params}`)
    if (response.ok) {
      const data = await response.json()
      activities.value = data.logs || []
      console.log('Loaded activity logs:', data.logs?.length || 0)
    } else {
      console.error('Failed to fetch activity logs')
    }
  } catch (error) {
    console.error('Error loading activity logs:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/activity-logs/stats')
    if (response.ok) {
      const data = await response.json()
      stats.value = data
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const filteredActivities = computed(() => {
  let result = activities.value

  // Filter by activity type
  if (selectedFilter.value !== 'all') {
    if (selectedFilter.value === 'loan') {
      // Match all loan-related activity types
      result = result.filter(a => a.activity_type?.startsWith('loan_'))
    } else {
      result = result.filter(a => a.activity_type === selectedFilter.value)
    }
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(a =>
      a.full_name?.toLowerCase().includes(query) ||
      a.activity_description?.toLowerCase().includes(query) ||
      a.activity_type?.toLowerCase().includes(query)
    )
  }

  return result.map(activity => ({
    id: activity.id,
    type: activity.activity_type,
    icon: getActivityIcon(activity.activity_type),
    title: formatActivityTitle(activity.activity_type),
    description: activity.activity_description || 'No description',
    user: activity.full_name || 'System',
    action: activity.activity_type,
    urgency: getUrgency(activity.activity_type),
    timestamp: new Date(activity.created_at),
    reference: activity.reference_number
  }))
})

const getActivityIcon = (type) => {
  const icons = {
    'login': '🔐',
    'logout': '🚪',
    'profile_update': '✏️',
    'membership_change': '👤',
    'contribution': '💰',
    'activity_participation': '📅',
    'account_created': '➕',
    'document_upload': '📄',
    'password_change': '🔑',
    'loan_application': '📝',
    'loan_approval': '✅',
    'loan_rejection': '❌',
    'loan_payment': '💳',
    'loan_update': '📋'
  }
  return icons[type] || '📋'
}

const formatActivityTitle = (type) => {
  const titles = {
    'login': 'User Login',
    'logout': 'User Logout',
    'profile_update': 'Profile Updated',
    'membership_change': 'Member Approval',
    'contribution': 'Contribution Made',
    'activity_participation': 'Activity Participation',
    'account_created': 'Account Created',
    'document_upload': 'Document Uploaded',
    'password_change': 'Password Changed',
    'loan_application': 'Loan Application',
    'loan_approval': 'Loan Approved',
    'loan_rejection': 'Loan Rejected',
    'loan_payment': 'Loan Payment',
    'loan_update': 'Loan Updated'
  }
  return titles[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getUrgency = (type) => {
  if (['membership_change', 'password_change', 'loan_rejection'].includes(type)) return 'high'
  if (['contribution', 'document_upload', 'loan_application', 'loan_payment', 'loan_approval'].includes(type)) return 'medium'
  return 'normal'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  const now = new Date()
  
  // Handle future dates (from clock skew) - just show the actual date
  if (d > now) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  
  const diff = Math.floor((now - d) / 1000)

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.system-activity-container {
  min-height: calc(100vh - 70px);
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f9fafb;
  font-family: 'Open Sans', sans-serif;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Poppins', sans-serif;
}

.title-icon {
  font-size: 36px;
}

.page-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.filters-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9fafb;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.search-icon {
  font-size: 20px;
  color: #6b7280;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #111827;
  outline: none;
}

.filter-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.filter-btn.active {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.activity-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #e5e7eb;
}

.activity-card.registration {
  border-left-color: #3b82f6;
}

.activity-card.approval {
  border-left-color: #10b981;
}

.activity-card.alert {
  border-left-color: #f59e0b;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.activity-icon {
  font-size: 24px;
}

.activity-info {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #6b7280;
}

.activity-badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.activity-badge.high {
  background: #fee2e2;
  color: #dc2626;
}

.activity-badge.normal {
  background: #e5e7eb;
  color: #6b7280;
}

.activity-description {
  color: #6b7280;
  margin-bottom: 12px;
}

.activity-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  color: #6b7280;
}
</style>

