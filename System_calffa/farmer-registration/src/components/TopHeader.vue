<template>
  <header class="top-header">
    <div class="backdrop-header backdrop-theme"></div>
    <div class="header-content">
      <!-- Center: System Status & Timestamp -->
      <div class="system-info">
        <div class="status-indicator" :class="{ active: systemStatus }">
          <span class="status-dot"></span>
          <span class="status-text">{{ systemStatus ? 'System Active' : 'System Inactive' }}</span>
        </div>
        <div class="timestamp">
          <span class="time-icon">🕐</span>
          <span class="time-text">{{ currentTime }}</span>
        </div> 
      </div>

      <!-- Right: User Controls -->
      <div class="user-controls">
        <!-- Notifications -->
        <div class="notification-container">
          <button class="icon-btn notification-btn" @click="toggleNotifications">
            <span class="icon">🔔</span>
            <span v-if="notificationCount > 0" class="badge">{{ notificationCount }}</span>
          </button>
          
          <!-- Notifications Dropdown -->
          <div v-if="showNotifications" class="notifications-dropdown" ref="notificationsRef">
            <div class="notifications-header">
              <h3>Notifications</h3>
              <div class="notifications-header-actions">
                <button v-if="unreadCount > 0" class="mark-read-btn" @click="markAllAsRead">Mark all read</button>
                <button class="clear-all-btn" @click="clearAllNotifications">Clear All</button>
              </div>
            </div>

            <!-- Tab filter (System tab only for admin roles) -->
            <div class="notification-tabs">
              <button 
                class="notif-tab" 
                :class="{ active: activeTab === 'due' }" 
                @click="activeTab = 'due'"
              >
                Due Dates
                <span v-if="dueNotifications.length > 0" class="tab-badge">{{ dueNotifications.length }}</span>
              </button>
              <button 
                v-if="isAdminRole"
                class="notif-tab" 
                :class="{ active: activeTab === 'system' }" 
                @click="activeTab = 'system'"
              >
                System
                <span v-if="systemNotifications.length > 0" class="tab-badge">{{ systemNotifications.length }}</span>
              </button>
            </div>

            <div class="notifications-list">
              <!-- Due Date Notifications -->
              <template v-if="activeTab === 'due'">
                <div 
                  v-for="notification in dueNotifications" 
                  :key="'due-' + notification.id"
                  class="notification-item"
                  :class="[getDueSeverity(notification), { unread: !notification.is_read }]"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="notification-icon">{{ getDueIcon(notification) }}</div>
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-meta">
                      <span class="notification-time">{{ formatTriggerDate(notification.trigger_date) }}</span>
                      <span v-if="!notification.is_read" class="unread-dot"></span>
                    </div>
                  </div>
                </div>
                <div v-if="dueNotifications.length === 0" class="no-notifications">
                  <span class="empty-icon">✅</span>
                  <span>No upcoming due dates</span>
                </div>
              </template>

              <!-- System Notifications (original ones) -->
              <template v-if="activeTab === 'system'">
                <div 
                  v-for="notification in systemNotifications" 
                  :key="notification.id"
                  class="notification-item"
                  :class="notification.severity"
                >
                  <div class="notification-icon">{{ notification.icon }}</div>
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-time">{{ notification.time }}</div>
                  </div>
                </div>
                <div v-if="systemNotifications.length === 0" class="no-notifications">
                  <span>No system notifications</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Logout -->
        <button class="icon-btn logout-btn" @click="handleLogout" title="Logout">
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
        </button>

        <!-- User Profile -->
        <div class="user-profile" @click="goToSettings" title="Edit Profile">
          <img :src="userAvatar" class="profile-avatar" alt="User Avatar" />
          <div class="profile-info">
            <div class="profile-name">{{ userName }}</div>
            <div class="profile-id">ID: {{ userId }}</div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const systemStatus = ref(true)
const currentTime = ref('')
const showNotifications = ref(false)
const notificationsRef = ref(null)
const activeTab = ref('due')

// Role check: admin roles see system notifications, farmers only see due dates
const userRole = computed(() => authStore.currentUser?.role)
const isAdminRole = computed(() => ['admin', 'treasurer', 'president'].includes(userRole.value))

const userName = computed(() => authStore.currentUser?.full_name || 'Juan Dela Cruz')
const userId = computed(() => authStore.currentUser?.reference_number || 'CALFFA-00123')

const userInitials = computed(() => {
  const name = userName.value
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

const userAvatar = computed(() => {
  return (
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(userName.value) +
    "&background=4CAF50&color=fff&size=128"
  )
})

// ─── Due-date notifications from backend ───
const dueNotifications = ref([])
const unreadCount = ref(0)

// System notifications (original activity-log based)
const systemNotifications = ref([])

// Total badge count: farmers only see due-date count, admins see both
const notificationCount = computed(() => {
  if (isAdminRole.value) {
    return unreadCount.value + systemNotifications.value.length
  }
  return unreadCount.value
})

const getAuthHeaders = () => {
  const token = authStore.token || localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Load due-date notifications from the new backend API
const loadDueNotifications = async () => {
  try {
    const headers = getAuthHeaders()
    if (!headers.Authorization) return

    const [notifRes, countRes] = await Promise.all([
      fetch('/api/notifications', { headers }),
      fetch('/api/notifications/unread-count', { headers })
    ])

    if (notifRes.ok) {
      const data = await notifRes.json()
      dueNotifications.value = data.notifications || []
    }

    if (countRes.ok) {
      const data = await countRes.json()
      unreadCount.value = data.count || 0
    }
  } catch (error) {
    console.error('Error loading due-date notifications:', error)
  }
}

// Load system notifications (original logic: pending farmers + activity logs)
const loadSystemNotifications = async () => {
  try {
    const notifs = []
    
    const farmersRes = await fetch('/api/farmers/pending')
    if (farmersRes.ok) {
      const pendingFarmers = await farmersRes.json()
      if (pendingFarmers.length > 0) {
        notifs.push({
          id: 'pending-farmers',
          title: 'Pending Approvals',
          message: `${pendingFarmers.length} farmer${pendingFarmers.length > 1 ? 's' : ''} waiting for approval`,
          time: 'Now',
          severity: 'warning',
          icon: '⏳'
        })
      }
    }
    
    const logsRes = await fetch('/api/activity-logs?limit=5')
    if (logsRes.ok) {
      const logs = await logsRes.json()
      const recentLogs = Array.isArray(logs) ? logs : logs.logs || []
      
      recentLogs.forEach(log => {
        const timeAgo = formatTimeAgo(log.created_at)
        notifs.push({
          id: `log-${log.id}`,
          title: formatActivityTitle(log.activity_type),
          message: log.activity_description || `${log.full_name || 'User'} performed an action`,
          time: timeAgo,
          severity: getNotificationSeverity(log.activity_type),
          icon: getActivityIcon(log.activity_type)
        })
      })
    }
    
    systemNotifications.value = notifs.slice(0, 10)
  } catch (error) {
    console.error('Error loading system notifications:', error)
  }
}

const loadNotifications = async () => {
  // Farmers only load due-date notifications; admins load both
  if (isAdminRole.value) {
    await Promise.all([loadDueNotifications(), loadSystemNotifications()])
  } else {
    await loadDueNotifications()
  }
}

// ─── Due notification helpers ───
const getDueSeverity = (notification) => {
  const type = notification.notification_type
  if (type === 'due_day') return 'critical'
  if (type === '1_day' || type === '2_days') return 'urgent'
  if (type === '3_days' || type === 'last_week') return 'warning'
  return 'info'
}

const getDueIcon = (notification) => {
  const type = notification.notification_type
  if (type === 'due_day') return '🔴'
  if (type === '1_day') return '❗'
  if (type === '2_days' || type === '3_days') return '🚨'
  if (type === 'last_week') return '🔔'
  return '⚠️'
}

const formatTriggerDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const trigger = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today - trigger) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

// ─── Click handler: navigate to loan or machinery page with highlight ───
const handleNotificationClick = async (notification) => {
  // Mark as read
  try {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    await fetch(`/api/notifications/${notification.id}/read`, { method: 'PUT', headers })
    notification.is_read = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (e) {
    console.error('Error marking notification read:', e)
  }

  showNotifications.value = false

  // Navigate based on reference type
  if (notification.reference_type === 'loan') {
    const userRole = authStore.currentUser?.role
    if (['admin', 'treasurer'].includes(userRole)) {
      router.push({ path: '/admin-loans', query: { highlight: notification.reference_id, type: 'loan' } })
    } else {
      router.push({ path: '/loan', query: { highlight: notification.reference_id, type: 'loan' } })
    }
  } else if (notification.reference_type === 'machinery_booking') {
    const userRole = authStore.currentUser?.role
    if (['admin', 'treasurer', 'president'].includes(userRole)) {
      router.push({ path: '/machinery-financial', query: { highlight: notification.reference_id, type: 'booking' } })
    } else {
      router.push({ path: '/machinery-booking', query: { highlight: notification.reference_id, type: 'booking' } })
    }
  }
}

const markAllAsRead = async () => {
  try {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    await fetch('/api/notifications/read-all', { method: 'PUT', headers })
    dueNotifications.value.forEach(n => n.is_read = 1)
    unreadCount.value = 0
  } catch (e) {
    console.error('Error marking all as read:', e)
  }
}

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Recently'
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now - date) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return date.toLocaleDateString()
}

const formatActivityTitle = (type) => {
  const titles = {
    'login': 'User Login',
    'logout': 'User Logout',
    'profile_update': 'Profile Updated',
    'membership_change': 'Membership Changed',
    'contribution': 'New Contribution',
    'activity_participation': 'Activity Joined',
    'account_created': 'New Account',
    'document_upload': 'Document Uploaded',
    'password_change': 'Password Changed'
  }
  return titles[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getActivityIcon = (type) => {
  const icons = {
    'login': '🔓',
    'logout': '🚪',
    'profile_update': '✏️',
    'membership_change': '👤',
    'contribution': '💰',
    'activity_participation': '📅',
    'account_created': '➕',
    'document_upload': '📄',
    'password_change': '🔑'
  }
  return icons[type] || '📋'
}

const getNotificationSeverity = (type) => {
  if (['password_change', 'membership_change'].includes(type)) return 'warning'
  if (['contribution', 'account_created'].includes(type)) return 'success'
  return 'info'
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
}

const refreshData = () => {
  // Trigger refresh animation
  const btn = document.querySelector('.refresh-btn')
  if (btn) {
    btn.classList.add('refreshing')
    setTimeout(() => {
      btn.classList.remove('refreshing')
      updateTime()
    }, 1000)
  }
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    loadNotifications() // Refresh notifications when opened
  }
}

const clearAllNotifications = () => {
  if (activeTab.value === 'due') {
    markAllAsRead()
  } else {
    systemNotifications.value = []
  }
}

const handleClickOutside = (event) => {
  if (
    notificationsRef.value &&
    !notificationsRef.value.contains(event.target) &&
    !event.target.closest('.notification-btn')
  ) {
    showNotifications.value = false
  }
}

const goToSettings = () => {
  router.push('/settings')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  updateTime()
  const timeInterval = setInterval(updateTime, 1000)
  
  // Load notifications on mount
  loadNotifications()
  
  // Refresh notifications every 60 seconds
  const notifInterval = setInterval(loadNotifications, 60000)
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    clearInterval(timeInterval)
    clearInterval(notifInterval)
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style scoped>
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  /* Ensure header stays fixed and doesn't move */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
  position: fixed !important;
}

.header-content {
  max-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: relative;
  z-index: 1;
  gap: 16px;
  pointer-events: auto;
}

/* Mobile Header Responsive */
@media (max-width: 1024px) {
  .header-content {
    padding: 0 14px;
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 10px;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 8px;
    gap: 4px;
  }
}

.top-header .backdrop-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.2;
  mix-blend-mode: overlay;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .logo-section {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .logo-section {
    gap: 10px;
    flex-shrink: 1;
  }
}

@media (max-width: 480px) {
  .logo-section {
    gap: 8px;
    flex-shrink: 1;
    min-width: 0;
  }
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-radius: 10px;
  flex-shrink: 0;
}

.logo-text-container {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.calffa-logo {
  font-size: 20px;
  font-weight: 800;
  color: #166534;
  letter-spacing: 0.5px;
  line-height: 1.2;
  font-family: 'Poppins', sans-serif;
}

.logo-text {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .logo-container {
    gap: 10px;
  }

  .logo-icon {
    font-size: 24px;
    width: 36px;
    height: 36px;
  }

  .calffa-logo {
    font-size: 16px;
  }

  .logo-text {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .logo-container {
    gap: 8px;
  }

  .logo-icon {
    font-size: 20px;
    width: 32px;
    height: 32px;
  }

  .calffa-logo {
    font-size: 14px;
  }

  .logo-text {
    font-size: 8px;
  }
}

/* System Info */
.system-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 0 24px;
  border-right: 1px solid #e5e7eb;
  flex-grow: 1;
}

@media (max-width: 1024px) {
  .system-info {
    display: none;
  }
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: #fee2e2;
  color: #dc2626;
}

.status-indicator.active {
  background: #d1fae5;
  color: #059669;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timestamp {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.time-icon {
  font-size: 14px;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #e5e7eb;
  transform: rotate(90deg);
}

.refresh-btn.refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.refresh-icon {
  font-size: 16px;
}

/* Notifications */
.notification-container {
  position: relative;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 360px;
  max-height: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@media (max-width: 1024px) {
  .notifications-dropdown {
    width: 320px;
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .notifications-dropdown {
    width: calc(100vw - 32px);
    right: auto;
    left: 16px;
    max-height: 60vh;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.notifications-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.clear-all-btn {
  padding: 4px 12px;
  background: transparent;
  border: none;
  color: #166534;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.clear-all-btn:hover {
  background: #e5e7eb;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
  cursor: pointer;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.success {
  border-left: 3px solid #10b981;
}

.notification-item.warning {
  border-left: 3px solid #f59e0b;
}

.notification-item.info {
  border-left: 3px solid #3b82f6;
}

.notification-item.urgent {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
}

.notification-item.critical {
  border-left: 4px solid #dc2626;
  background: #fee2e2;
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.2); }
}

.notification-item.unread {
  background: #f0fdf4;
}

.notification-item.unread.urgent {
  background: #fef2f2;
}

.notification-item.unread.critical {
  background: #fee2e2;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
}

/* Notification tabs */
.notification-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.notif-tab {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.notif-tab:hover {
  color: #166534;
  background: #f0fdf4;
}

.notif-tab.active {
  color: #166534;
  border-bottom-color: #166534;
  background: white;
}

.tab-badge {
  font-size: 10px;
  font-weight: 700;
  background: #ef4444;
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.6;
}

.notifications-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mark-read-btn {
  padding: 4px 12px;
  background: transparent;
  border: none;
  color: #3b82f6;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.mark-read-btn:hover {
  background: #eff6ff;
}

.empty-icon {
  display: block;
  font-size: 32px;
  margin-bottom: 8px;
}

.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
  line-height: 1.4;
}

.notification-time {
  font-size: 11px;
  color: #9ca3af;
}

.no-notifications {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.user-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .user-controls {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .user-controls {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .user-controls {
    gap: 4px;
  }
}

.role-dropdown {
  position: relative;
}

.role-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.role-select:hover {
  border-color: #9ca3af;
}

.role-select:focus {
  border-color: #166534;
  box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.1);
}

.icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.icon-btn:hover {
  background: #f3f4f6;
}

.icon-btn .icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .icon-btn {
    width: 36px;
    height: 36px;
  }

  .icon-btn .icon {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .icon-btn {
    width: 32px;
    height: 32px;
  }

  .icon-btn .icon {
    font-size: 16px;
  }
}

.logout-icon {
  transition: transform 0.2s ease;
}

.logout-btn:hover .logout-icon {
  transform: translateX(2px);
}

.notification-btn {
  position: relative;
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.4;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
  cursor: pointer;
  flex-shrink: 0;
}

.user-profile:hover {
  background: #f3f4f6;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
}

.profile-id {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .profile-avatar {
    width: 36px;
    height: 36px;
  }

  .profile-info {
    display: none;
  }
}

@media (max-width: 480px) {
  .profile-avatar {
    width: 32px;
    height: 32px;
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .system-info {
    display: none;
  }
}

@media (max-width: 768px) {
  .logo-text {
    display: none;
  }

  .logo-container {
    gap: 8px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }

  .calffa-logo {
    font-size: 16px;
  }

  .notifications-dropdown {
    width: 320px;
    right: -20px;
  }

  .profile-info {
    display: none;
  }
}
</style>


