<template>
  <div class="notification-center-container">
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-icon">🔔</span>
        Notification Center
      </h1>
      <p class="page-subtitle">Centralized view of all pending tasks and notifications</p>
      <button class="mark-all-read-btn" @click="markAllAsRead">✓ Mark All as Read</button>
    </div>

    <div class="stats-overview">
      <div class="stat-box">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">Pending Tasks</div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-icon">⚠️</div>
        <div class="stat-info">
          <div class="stat-value">{{ urgentCount }}</div>
          <div class="stat-label">Urgent</div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ completedCount }}</div>
          <div class="stat-label">Completed Today</div>
        </div>
      </div>
    </div>

    <div class="filters-section">
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

    <div class="notifications-list">
      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="notification-card"
        :class="{ unread: !notification.read, urgent: notification.urgency === 'high' }"
      >
        <div class="notification-icon">{{ notification.icon }}</div>
        <div class="notification-content">
          <div class="notification-header">
            <h3 class="notification-title">{{ notification.title }}</h3>
            <span class="notification-badge" :class="notification.type">{{ notification.type }}</span>
          </div>
          <p class="notification-message">{{ notification.message }}</p>
          <div class="notification-meta">
            <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
            <span class="notification-user" v-if="notification.user">By: {{ notification.user }}</span>
          </div>
        </div>
        <div class="notification-actions">
          <button
            v-if="!notification.read"
            class="mark-read-btn"
            @click="markAsRead(notification.id)"
            title="Mark as read"
          >
            ✓
          </button>
          <button
            class="action-btn"
            @click="handleAction(notification)"
            :class="notification.actionType"
          >
            {{ getActionLabel(notification.actionType) }}
          </button>
        </div>
      </div>

      <div v-if="filteredNotifications.length === 0" class="empty-state">
        <div class="empty-icon">🔔</div>
        <p class="empty-text">No notifications found</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedFilter = ref('all')

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Pending Approvals', value: 'approval' },
  { label: 'Alerts', value: 'alert' },
  { label: 'System', value: 'system' },
  { label: 'Unread', value: 'unread' }
]

const notifications = ref([
  {
    id: 1,
    type: 'approval',
    icon: '👤',
    title: 'New Member Application',
    message: 'Juan Dela Cruz has submitted a membership application',
    urgency: 'normal',
    read: false,
    timestamp: new Date('2025-01-20T10:30:00'),
    user: 'System',
    actionType: 'review',
    actionRoute: '/farmers-table'
  },
  {
    id: 3,
    type: 'approval',
    icon: '💰',
    title: 'Loan Application',
    message: 'Maria Santos has submitted a loan application for P15,000',
    urgency: 'normal',
    read: true,
    timestamp: new Date('2025-01-19T14:20:00'),
    user: 'System',
    actionType: 'review',
    actionRoute: '/loan'
  }
])

const filteredNotifications = computed(() => {
  let filtered = notifications.value

  if (selectedFilter.value === 'unread') {
    filtered = filtered.filter(n => !n.read)
  } else if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(n => n.type === selectedFilter.value)
  }

  return filtered.sort((a, b) => {
    // Unread first, then by urgency, then by timestamp
    if (a.read !== b.read) return a.read ? 1 : -1
    if (a.urgency === 'high' && b.urgency !== 'high') return -1
    if (b.urgency === 'high' && a.urgency !== 'high') return 1
    return b.timestamp - a.timestamp
  })
})

const pendingCount = computed(() => {
  return notifications.value.filter(n => !n.read && n.type === 'approval').length
})

const urgentCount = computed(() => {
  return notifications.value.filter(n => !n.read && n.urgency === 'high').length
})

const completedCount = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return notifications.value.filter(n => n.read && n.timestamp >= today).length
})

const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

const markAsRead = (id) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const getActionLabel = (actionType) => {
  const labels = {
    review: 'Review',
    manage: 'Manage',
    view: 'View',
    approve: 'Approve'
  }
  return labels[actionType] || 'View'
}

const handleAction = (notification) => {
  markAsRead(notification.id)
  if (notification.actionRoute) {
    router.push(notification.actionRoute)
  }
}
</script>

<style scoped>
.notification-center-container {
  min-height: calc(100vh - 70px);
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f9fafb;
  font-family: 'Open Sans', sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
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

.mark-all-read-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.mark-all-read-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-box {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.stat-icon {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  font-family: 'Poppins', sans-serif;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.filters-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  border-left: 4px solid #e5e7eb;
  transition: all 0.2s;
}

.notification-card.unread {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.notification-card.urgent {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.notification-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.notification-badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.notification-badge.approval {
  background: #dbeafe;
  color: #1e40af;
}

.notification-badge.alert {
  background: #fef3c7;
  color: #92400e;
}

.notification-badge.system {
  background: #e5e7eb;
  color: #6b7280;
}

.notification-message {
  color: #6b7280;
  margin-bottom: 8px;
}

.notification-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.mark-read-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.mark-read-btn:hover {
  background: #e5e7eb;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 36px;
}

.action-btn.review {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.action-btn.manage {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.action-btn:hover {
  transform: translateY(-1px);
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

