<template>
  <div class="sidebar-example-wrapper">
    <!-- Sidebar with event handlers -->
    <Sidebar
      @menu-click="handleMenuClick"
      @active-menu="handleActiveMenuChange"
      @collapse-toggle="handleCollapseToggle"
      @mobile-menu-toggle="handleMobileMenuToggle"
    />

    <!-- Main Content Area -->
    <main class="main-content-wrapper">
      <!-- Header -->
      <header class="example-header">
        <h1>{{ pageTitle }}</h1>
        <div class="header-info">
          <span class="current-route">Current Route: {{ currentRoute }}</span>
          <span class="active-menu">Active Menu: {{ activeMenuDisplay }}</span>
        </div>
      </header>

      <!-- Content Display Based on Active Menu -->
      <section class="example-content">
        <!-- Dashboard Content -->
        <div v-if="activeMenu === '/dashboard'" class="content-panel">
          <h2>📊 Dashboard Overview</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <p class="stat-label">Total Farmers</p>
              <p class="stat-value">245</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Active Farms</p>
              <p class="stat-value">189</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Crops Monitored</p>
              <p class="stat-value">456</p>
            </div>
          </div>
          <p>Welcome to the CALFFA dashboard! Here you can view key metrics and manage your farming operations.</p>
        </div>

        <!-- Loan Content -->
              </div>
              <span class="seed-status received">✓ Received</span>
            </div>
          </div>
        </div>

        <!-- Loans Content -->
        <div v-else-if="activeMenu === '/loan'" class="content-panel">
          <h2>💰 Loan Management</h2>
          <div class="loan-container">
            <div class="loan-card">
              <p class="loan-amount">₱50,000</p>
              <p class="loan-duration">6-month term</p>
              <span class="loan-status active">Active</span>
            </div>
            <div class="loan-card">
              <p class="loan-amount">₱75,000</p>
              <p class="loan-duration">12-month term</p>
              <span class="loan-status pending">Pending</span>
            </div>
          </div>
        </div>

        <!-- News Content -->
        <div v-else-if="activeMenu === '/news'" class="content-panel">
          <h2>📰 Latest News</h2>
          <div class="news-list">
            <article class="news-item">
              <h3>New Sustainable Farming Guidelines</h3>
              <p>Learn about the latest sustainable farming practices recommended by agricultural experts.</p>
              <time>Published: Today</time>
            </article>
            <article class="news-item">
              <h3>Rice Prices Up 15% This Month</h3>
              <p>Market analysis shows significant increase in rice prices due to seasonal demand.</p>
              <time>Published: Yesterday</time>
            </article>
          </div>
        </div>

        <!-- Announcements Content -->
        <div v-else-if="activeMenu === '/announcement'" class="content-panel">
          <h2>📢 Announcements</h2>
          <div class="announcement-list">
            <div class="announcement">
              <span class="announcement-badge">⚠️ Important</span>
              <p class="announcement-text">System maintenance scheduled for Jan 30, 2024</p>
            </div>
            <div class="announcement">
              <span class="announcement-badge">ℹ️ Info</span>
              <p class="announcement-text">New features are now available in your dashboard!</p>
            </div>
          </div>
        </div>

        <!-- Best Practices Content -->
        <div v-else-if="activeMenu === '/best-practices'" class="content-panel">
          <h2>🌟 Best Practices</h2>
          <div class="practices-list">
            <div class="practice-item">
              <h3>Crop Rotation</h3>
              <p>Rotate crops yearly to maintain soil health and reduce pest buildup.</p>
            </div>
            <div class="practice-item">
              <h3>Water Management</h3>
              <p>Implement efficient irrigation systems to conserve water and reduce costs.</p>
            </div>
            <div class="practice-item">
              <h3>Soil Testing</h3>
              <p>Test soil regularly to determine nutrient levels and pH balance.</p>
            </div>
          </div>
        </div>

        <!-- Default Content -->
        <div v-else class="content-panel">
          <h2>Welcome to CALFFA</h2>
          <p>Select a menu item from the sidebar to get started.</p>
          <div class="welcome-info">
            <p>This example demonstrates how the Sidebar component works with event handling.</p>
            <p>Click any menu item to see the corresponding content displayed here.</p>
            <p>The active button will be highlighted in the sidebar with a golden accent.</p>
          </div>
        </div>
      </section>

      <!-- Event Log (Development Only) -->
      <section class="event-log" v-if="showEventLog">
        <h3>📋 Event Log</h3>
        <div class="log-entries">
          <div v-for="(log, index) in eventLogs" :key="index" class="log-entry">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-event">{{ log.event }}</span>
            <span class="log-data">{{ log.data }}</span>
          </div>
        </div>
        <button @click="clearEventLog" class="clear-btn">Clear Log</button>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './Sidebar.vue';

const route = useRoute();
const activeMenu = ref('/dashboard');
const eventLogs = ref([]);
const showEventLog = ref(true);

const currentRoute = computed(() => route.path);

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': '📊 Dashboard',
    '/loan': '💰 Loans',
    '/news': '📰 News',
    '/announcement': '📢 Announcements',
  };
  return titles[activeMenu.value] || 'CALFFA Dashboard';
});

const activeMenuDisplay = computed(() => {
  return activeMenu.value || 'None';
});

// Event Handlers
const handleMenuClick = (event) => {
  addLog('menu-click', `Route: ${event.route}`);
  console.log('Menu clicked:', event);
};

const handleActiveMenuChange = (event) => {
  activeMenu.value = event.activeRoute;
  addLog('active-menu', `Active Route: ${event.activeRoute}`);
  console.log('Active menu changed:', event.activeRoute);
};

const handleCollapseToggle = (event) => {
  addLog('collapse-toggle', `Collapsed: ${event.isCollapsed}`);
  console.log('Sidebar collapse toggled:', event.isCollapsed);
};

const handleMobileMenuToggle = (event) => {
  addLog('mobile-menu-toggle', `Menu Open: ${event.isOpen}`);
  console.log('Mobile menu toggled:', event.isOpen);
};

// Logging Utilities
const addLog = (event, data) => {
  const time = new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  eventLogs.value.unshift({ event, data, time });
  if (eventLogs.value.length > 10) {
    eventLogs.value.pop();
  }
};

const clearEventLog = () => {
  eventLogs.value = [];
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.sidebar-example-wrapper {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.main-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: white;
}

/* Header */
.example-header {
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  color: white;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.example-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
}

.header-info {
  display: flex;
  gap: 24px;
  font-size: 13px;
  opacity: 0.9;
}

.current-route,
.active-menu {
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 6px;
}

/* Content */
.example-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.content-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.content-panel h2 {
  font-size: 24px;
  color: #166534;
  margin-bottom: 16px;
}

.content-panel p {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 12px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #d1fae5;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #166534;
}

/* Inventory List */
.inventory-list,
.seed-list,
.news-list,
.announcement-list,
.practices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inventory-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #22c55e;
}

.item-icon {
  font-size: 20px;
}

.item-name {
  flex: 1;
  font-weight: 600;
  color: #374151;
}

.item-quantity {
  font-size: 13px;
  color: #6b7280;
  background: white;
  padding: 4px 12px;
  border-radius: 6px;
}

/* Seed Items */
.seed-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.seed-info p {
  margin: 0;
  font-size: 13px;
}

.seed-name {
  font-weight: 600;
  color: #374151;
}

.seed-date {
  color: #9ca3af;
}

.seed-status {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
}

.seed-status.received {
  background: #dcfce7;
  color: #166534;
}

/* Loan Cards */
.loan-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.loan-card {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
}

.loan-amount {
  font-size: 28px;
  font-weight: 800;
  color: #166534;
  margin-bottom: 8px;
}

.loan-duration {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.loan-status {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 12px;
}

.loan-status.active {
  background: #dcfce7;
  color: #166534;
}

.loan-status.pending {
  background: #fed7aa;
  color: #b45309;
}

/* News Items */
.news-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid #f59e0b;
}

.news-item h3 {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 6px;
}

.news-item p {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.news-item time {
  font-size: 11px;
  color: #9ca3af;
}

/* Announcements */
.announcement {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  gap: 12px;
  border-left: 4px solid #ef4444;
}

.announcement-badge {
  font-size: 18px;
  min-width: 24px;
}

.announcement-text {
  font-size: 13px;
  color: #374151;
}

/* Practices */
.practice-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid #8b5cf6;
}

.practice-item h3 {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 6px;
}

/* Market Grid */
.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.market-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #d1fae5;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.market-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.1);
}

.market-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 8px;
}

.market-card p {
  font-size: 13px;
  font-weight: 600;
  color: #166534;
}

/* Welcome Info */
.welcome-info {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #d1fae5;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.welcome-info p {
  margin: 8px 0;
  color: #166534;
}

/* Event Log */
.event-log {
  background: #1f2937;
  color: #f3f4f6;
  padding: 16px;
  margin-top: 20px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
}

.event-log h3 {
  font-size: 14px;
  margin-bottom: 12px;
  color: #60a5fa;
}

.log-entries {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
  background: #111827;
  border-radius: 4px;
  padding: 8px;
}

.log-entry {
  display: grid;
  grid-template-columns: 60px 150px 1fr;
  gap: 12px;
  font-size: 11px;
  padding: 6px;
  border-bottom: 1px solid #374151;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #10b981;
}

.log-event {
  color: #60a5fa;
  font-weight: 600;
}

.log-data {
  color: #f3f4f6;
  word-break: break-all;
}

.clear-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.clear-btn:hover {
  background: #dc2626;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar-example-wrapper {
    flex-direction: column;
  }

  .example-header {
    padding: 16px;
  }

  .example-header h1 {
    font-size: 20px;
  }

  .header-info {
    flex-direction: column;
    gap: 8px;
  }

  .example-content {
    padding: 16px;
  }

  .content-panel {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .example-header {
    padding: 12px;
  }

  .example-header h1 {
    font-size: 18px;
  }

  .header-info {
    font-size: 11px;
  }

  .current-route,
  .active-menu {
    padding: 4px 8px;
  }

  .example-content {
    padding: 12px;
  }

  .content-panel {
    padding: 12px;
  }

  .content-panel h2 {
    font-size: 18px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .market-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
