<template>
  <div class="sidebar-wrapper">
    <!-- Sidebar Navigation -->
    <nav class="sidebar" :class="{ collapsed: isCollapsed && !isDesktop }">
      <div class="backdrop-sidebar backdrop-theme"></div>
      <!-- CALFFA LOGO HEADER -->
    <div class="sidebar-header">
      <div class="calffa-logo-container">
        <div class="rice-logo">🌾</div>
        <div class="calffa-text" v-if="!isCollapsed">
          <div class="calffa-brand">CALFFA</div>
          <div class="calffa-tagline">Smart Farming Solutions</div>
        </div>
      </div>
      <!-- Toggle Button -->
      <button 
        class="toggle-btn"
        @click="toggleSidebar"
        :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <span class="toggle-icon" :class="{ rotated: isCollapsed }">›</span>
      </button>
    </div>

    <!-- Navigation Sections with Grouped Items -->
    <div class="nav-sections">
      <!-- FARM MANAGEMENT Section -->
      <div class="nav-section">
        <div class="section-header">
          <span class="section-icon">🌾</span>
          <span class="section-title">FARM MANAGEMENT</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in farmManagementItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <span class="icon">{{ item.icon }}</span>
              <span class="text">{{ item.text }}</span>
              <span class="leaf-accent">🌿</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- OPERATIONS Section -->
      <div class="nav-section">
        <div class="section-header">
          <span class="section-icon">⚙️</span>
          <span class="section-title">OPERATIONS</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in operationsItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <span class="icon">{{ item.icon }}</span>
              <span class="text">{{ item.text }}</span>
              <span 
                v-if="item.badge" 
                class="nav-badge"
              >
                {{ item.badge }}
              </span>
              <span class="leaf-accent">🌿</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Community Section (Farmers only) -->
      <div class="nav-section" v-if="isFarmer">
        <div class="section-header">
          <span class="section-icon">👥</span>
          <span class="section-title">Community</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in communityItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <span class="icon">{{ item.icon }}</span>
              <span class="text">{{ item.text }}</span>
              <span 
                v-if="item.badge" 
                class="nav-badge"
              >
                {{ item.badge }}
              </span>
              <span class="leaf-accent">🌿</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Member Management Section (Admin and President only) -->
      <div class="nav-section" v-if="canManageMembers">
        <div class="section-header">
          <span class="section-icon">👥</span>
          <span class="section-title">Member Management</span>
        </div>
        <ul class="nav-list">
          <li
            :class="{ active: isActiveRoute('/farmers-table') }"
            @click="handleMenuClick({ text: 'Members', route: '/farmers-table' })"
          >
            <router-link class="nav-link" to="/farmers-table" aria-label="Members">
              <span class="icon">👥</span>
              <span class="text">Members</span>
              <span class="leaf-accent">🌿</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Loan Management Section (Treasurer only) -->
      <div class="nav-section" v-if="canManageLoans && !isAdmin">
        <div class="section-header">
          <span class="section-icon">💳</span>
          <span class="section-title">Loan Management</span>
        </div>
        <ul class="nav-list">
          <li
            :class="{ active: isActiveRoute('/admin-loans') }"
            @click="handleMenuClick({ text: 'Loan Management', route: '/admin-loans' })"
          >
            <router-link class="nav-link" to="/admin-loans" aria-label="Loan Management">
              <span class="icon">💳</span>
              <span class="text">Loan Management</span>
              <span class="leaf-accent">🌿</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Machinery Management Section (President only) -->
      <div class="nav-section" v-if="isPresident && !isAdmin">
        <div class="section-header">
          <span class="section-icon">🚜</span>
          <span class="section-title">Machinery Management</span>
        </div>
        <ul class="nav-list">
          <li
            :class="{ active: isActiveRoute('/machinery-management') }"
            @click="handleMenuClick({ text: 'Machinery Management System', route: '/machinery-management' })"
          >
            <router-link class="nav-link" to="/machinery-management" aria-label="Machinery Management System">
              <span class="icon">🚜</span>
              <span class="text">Machinery Management System</span>
              <span class="leaf-accent">🌿</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Farmer Income Records Section (Officers only: president, treasurer, auditor, agriculturist) -->
      <div class="nav-section" v-if="isOfficer && !isAdmin">
        <div class="section-header">
          <span class="section-icon">🌾</span>
          <span class="section-title">Kita ng Magsasaka</span>
        </div>
        <ul class="nav-list">
          <li
            :class="{ active: isActiveRoute('/officer-farmer-income') }"
            @click="handleMenuClick({ text: 'Farmer Income Records', route: '/officer-farmer-income' })"
          >
            <router-link class="nav-link" to="/officer-farmer-income" aria-label="Farmer Income Records">
              <span class="icon">📋</span>
              <span class="text">Farmer Income Records</span>
              <span class="leaf-accent">🌿</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Insights Section -->
      <div class="nav-section">
        <div class="section-header">
          <span class="section-icon">📊</span>
          <span class="section-title">Insights</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in insightsItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <span class="icon">{{ item.icon }}</span>
              <span class="text">{{ item.text }}</span>
              <span class="leaf-accent">🌿</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Admin Section (if admin) -->
      <div class="nav-section" v-if="isAdmin">
        <div class="section-header">
          <span class="section-icon">👨‍💼</span>
          <span class="section-title">Admin</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in adminItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <span class="icon">{{ item.icon }}</span>
              <span class="text">{{ item.text }}</span>
              <span class="leaf-accent">🌿</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="sidebar-footer">
      <div class="farmer-mode">{{ isAdmin ? 'Admin Mode' : 'Farmer Mode' }}</div>
      <div class="version-text">v1.0.0</div>
    </div>
  </nav>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const emit = defineEmits(['menu-click', 'active-menu', 'toggle']);

const route = useRoute();
const authStore = useAuthStore();
const isCollapsed = ref(false);
const windowWidth = ref(window.innerWidth);

const currentUser = computed(() => authStore.currentUser);
const isAdmin = computed(() => currentUser.value?.role === 'admin');
const isPresident = computed(() => currentUser.value?.role === 'president');
const isOperator = computed(() => currentUser.value?.role === 'operator');
const isFarmer = computed(() => currentUser.value?.role === 'farmer');
const isOfficer = computed(() => {
  const role = currentUser.value?.role;
  return ['president', 'treasurer', 'auditor', 'agriculturist'].includes(role);
});
const canManageApprovals = computed(() => {
  const role = currentUser.value?.role;
  return ['operator', 'operation_manager', 'business_manager'].includes(role);
});
const canManageFinancial = computed(() => {
  const role = currentUser.value?.role;
  return ['admin', 'president', 'treasurer'].includes(role);
});
const canManageMembers = computed(() => {
  // Admin and President can manage members
  const role = currentUser.value?.role;
  return ['admin', 'president'].includes(role);
});
const canManageLoans = computed(() => {
  // Admin and Treasurer can manage loans
  const role = currentUser.value?.role;
  return ['admin', 'treasurer'].includes(role);
});
const isDesktop = computed(() => windowWidth.value >= 1025);

// Handle menu item click
const handleMenuClick = (item) => {
  emit('menu-click', { route: item.route, item });
  emit('active-menu', { activeRoute: item.route, item });
};

// Toggle sidebar collapse
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('toggle', { isCollapsed: isCollapsed.value });
};

// Navigation items organized by category
const farmManagementItems = [
  { text: "Dashboard", route: "/dashboard", icon: "📊" },
];

const operationsItems = computed(() => {
  const items = [];
  
  // Machinery Booking for farmers only (and admins can see all)
  if (!isAdmin.value && currentUser.value?.role === 'farmer') {
    items.push({ text: "Machinery Booking", route: "/machinery-booking", icon: "🚜" });
  }
  
  // Machinery Approval for operators, operation managers, business managers, and admins
  if (canManageApprovals.value && !isAdmin.value) {
    items.push({ text: "Machinery Approval", route: "/machinery-approval", icon: "✅" });
  }

  // Machinery Financial Management for admin, president, and treasurer
  if (canManageFinancial.value) {
    items.push({ text: "💰 Machinery Financial", route: "/machinery-financial", icon: "💰" });
  }
  
  return items;
});

const communityItems = [
  { text: "Loans", route: "/loan", icon: "💰" },
  { text: "Kita sa Pagsasaka", route: "/farmer-income", icon: "🌾" },
];

const insightsItems = [
  { text: "News", route: "/news", icon: "📰", badge: null },
  { text: "Announcements", route: "/announcement", icon: "📢", badge: 1 },
];

const adminItems = [
  { text: "Barangays", route: "/barangays", icon: "🏘️", badge: null },
  { text: "Loan Management", route: "/admin-loans", icon: "💳", badge: null },
  { text: "Machinery Management", route: "/machinery-management", icon: "🚜", badge: null },
  { text: "System Activity", route: "/system-activity", icon: "📋", badge: null },
  { text: "Financial Overview", route: "/financial-overview", icon: "💰", badge: null },
  { text: "Audit Logs", route: "/audit-logs", icon: "📜", badge: null },
];

const isActiveRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

onMounted(() => {
  // Handle window resize to detect desktop/mobile
  const handleResize = () => {
    windowWidth.value = window.innerWidth;
  };
  
  window.addEventListener('resize', handleResize);
  
  // Cleanup on unmount
  return () => {
    window.removeEventListener('resize', handleResize);
  };
});
</script>

<style scoped>
/* Sidebar Wrapper */
.sidebar-wrapper {
  position: relative;
  height: 100%;
}

.sidebar {
  position: fixed;
  top: 70px;
  left: 0;
  width: 260px;
  height: calc(100vh - 70px);
  background: linear-gradient(180deg, #166534 0%, #15803d 50%, #16a34a 100%);
  color: white;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
  z-index: 999;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* Ensure sidebar stays fixed and doesn't resize */
  will-change: width;
  backface-visibility: hidden;
  transform: translateZ(0);
  /* Prevent sidebar from moving during scroll */
  position: fixed !important;
}

.sidebar .backdrop-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.3;
  mix-blend-mode: multiply;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 30px,
      rgba(255, 255, 255, 0.03) 30px,
      rgba(255, 255, 255, 0.03) 60px
    );
  pointer-events: none;
  opacity: 0.4;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  background: rgba(0, 0, 0, 0.15);
  margin-bottom: 8px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.calffa-logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.toggle-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  font-size: 20px;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.toggle-btn:active {
  transform: scale(0.95);
}

.toggle-icon {
  font-weight: 700;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar.collapsed .calffa-text {
  display: none;
}

.sidebar.collapsed .calffa-logo-container {
  justify-content: center;
}

.sidebar.collapsed .section-header {
  display: none;
}

.sidebar.collapsed .text,
.sidebar.collapsed .nav-badge,
.sidebar.collapsed .leaf-accent,
.sidebar.collapsed .calffa-text,
.sidebar.collapsed .section-header,
.sidebar.collapsed .version-text {
  display: none;
}

.sidebar.collapsed .sidebar-footer {
  padding: 12px 6px;
}

.sidebar.collapsed .farmer-mode {
  font-size: 9px;
  word-break: break-word;
}

.sidebar.collapsed .nav-link {
  justify-content: center;
  padding: 12px;
  gap: 0;
}

.sidebar.collapsed .icon {
  font-size: 24px;
}

.rice-logo {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  animation: sway 3s ease-in-out infinite;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

.calffa-brand {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1px;
  color: white;
  line-height: 1.2;
}

.calffa-tagline {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  line-height: 1.2;
}

/* Navigation Sections */
.nav-sections {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  position: relative;
  z-index: 1;
}

.nav-section {
  margin-bottom: 24px;
}

.nav-section:last-child {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: rgba(255, 255, 255, 0.7);
}

.section-icon {
  font-size: 14px;
}

.section-title {
  flex: 1;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  color: rgba(255, 255, 255, 0.95);
  text-decoration: none;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.25s ease;
  font-size: 14px;
  position: relative;
  border-left: 3px solid transparent;
  margin-bottom: 0;
  min-height: 48px;
  cursor: pointer;
  user-select: none;
}

.nav-link:hover {
  background: rgba(34, 197, 94, 0.25);
  color: #ffffff;
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.nav-link:active {
  background: rgba(34, 197, 94, 0.35);
  transform: translateX(2px);
}

.nav-link:focus {
  outline: 2px solid rgba(255, 255, 255, 0.6);
  outline-offset: 2px;
  background: rgba(34, 197, 94, 0.2);
}

/* Active state with soft green background and leaf accent */
.active .nav-link {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-left-color: #facc15;
  font-weight: 600;
  box-shadow: inset 0 0 20px rgba(250, 204, 21, 0.1);
}

.leaf-accent {
  margin-left: auto;
  font-size: 16px;
  opacity: 0.9;
  animation: leafSway 2s ease-in-out infinite;
}

@keyframes leafSway {
  0%, 100% { transform: rotate(-3deg) scale(1); }
  50% { transform: rotate(3deg) scale(1.1); }
}

.icon {
  font-size: 20px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
  border-radius: 6px;
}

.nav-link:hover .icon {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.1);
}

.nav-link:active .icon {
  transform: scale(0.95);
}

.text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.25s ease;
}

.nav-badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: auto;
  background: rgba(0, 0, 0, 0.15);
  text-align: center;
  position: relative;
  z-index: 1;
}

.farmer-mode {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.version-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Courier New', monospace;
}

/* Scrollbar Styling */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Ensure sidebar width never changes */
.sidebar {
  min-width: 0;
  max-width: none;
  /* Prevent any width changes */
  flex-shrink: 0;
  flex-grow: 0;
}

/* MOBILE RESPONSIVENESS */
/* Small Mobile (≤ 480px) */
@media (max-width: 480px) {
  .sidebar {
    width: 200px;
    top: 60px;
    height: calc(100vh - 60px);
  }

  .sidebar.collapsed {
    width: 70px;
  }

  .sidebar-header {
    padding: 12px 12px;
    margin-bottom: 4px;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 12px 6px;
  }

  .calffa-logo-container {
    gap: 8px;
  }

  .sidebar.collapsed .calffa-logo-container {
    gap: 4px;
  }

  .toggle-btn {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }

  .sidebar.collapsed .toggle-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .toggle-icon {
    font-size: 14px;
  }

  .rice-logo {
    width: 40px;
    height: 40px;
    font-size: 20px;
    border-radius: 8px;
  }

  .calffa-brand {
    font-size: 14px;
    letter-spacing: 0.5px;
  }

  .calffa-tagline {
    font-size: 8px;
  }

  .nav-sections {
    padding: 12px 0;
  }

  .nav-section {
    margin-bottom: 12px;
  }

  .section-header {
    padding: 8px 12px;
    margin-bottom: 6px;
    font-size: 9px;
    gap: 6px;
  }

  .section-icon {
    font-size: 12px;
  }

  .nav-list {
    padding: 0 6px;
    gap: 4px;
  }

  .nav-link {
    padding: 8px 8px;
    font-size: 12px;
    gap: 8px;
    min-height: 40px;
    border-radius: 6px;
  }

  .icon {
    font-size: 16px;
    width: 24px;
    height: 24px;
  }

  .text {
    font-size: 11px;
  }

  .leaf-accent {
    font-size: 12px;
  }

  .nav-badge {
    font-size: 9px;
    padding: 1px 4px;
    min-width: 16px;
  }

  .sidebar-footer {
    padding: 12px;
  }

  .farmer-mode {
    font-size: 10px;
    margin-bottom: 2px;
  }

  .version-text {
    font-size: 8px;
  }

  .sidebar::-webkit-scrollbar {
    width: 4px;
  }
}

/* Mobile (481px - 768px) */
@media (min-width: 481px) and (max-width: 768px) {
  .sidebar {
    width: 220px;
    top: 65px;
    height: calc(100vh - 65px);
  }

  .sidebar.collapsed {
    width: 75px;
  }

  .sidebar-header {
    padding: 16px 14px;
    margin-bottom: 6px;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 16px 8px;
  }

  .calffa-logo-container {
    gap: 10px;
  }

  .sidebar.collapsed .calffa-logo-container {
    gap: 4px;
  }

  .toggle-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .sidebar.collapsed .toggle-btn {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }

  .rice-logo {
    width: 44px;
    height: 44px;
    font-size: 24px;
    border-radius: 10px;
  }

  .calffa-brand {
    font-size: 16px;
  }

  .calffa-tagline {
    font-size: 9px;
  }

  .nav-sections {
    padding: 16px 0;
  }

  .nav-section {
    margin-bottom: 16px;
  }

  .section-header {
    padding: 10px 16px;
    margin-bottom: 8px;
    font-size: 10px;
    gap: 8px;
  }

  .nav-list {
    padding: 0 8px;
    gap: 5px;
  }

  .nav-link {
    padding: 10px 10px;
    font-size: 13px;
    gap: 10px;
    min-height: 44px;
    border-radius: 8px;
  }

  .icon {
    font-size: 18px;
    width: 26px;
    height: 26px;
  }

  .text {
    font-size: 12px;
  }

  .leaf-accent {
    font-size: 14px;
  }

  .nav-badge {
    font-size: 10px;
    padding: 1px 5px;
    min-width: 18px;
  }

  .sidebar-footer {
    padding: 16px;
  }

  .farmer-mode {
    font-size: 11px;
    margin-bottom: 3px;
  }

  .version-text {
    font-size: 9px;
  }

  .sidebar::-webkit-scrollbar {
    width: 5px;
  }
}

/* Tablet (769px - 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 240px;
    top: 70px;
    height: calc(100vh - 70px);
  }

  .sidebar.collapsed {
    width: 80px;
  }

  .sidebar-header {
    padding: 20px 18px;
    margin-bottom: 8px;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 20px 10px;
  }

  .calffa-logo-container {
    gap: 12px;
  }

  .sidebar.collapsed .calffa-logo-container {
    gap: 4px;
  }

  .toggle-btn {
    width: 34px;
    height: 34px;
    font-size: 19px;
  }

  .sidebar.collapsed .toggle-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .rice-logo {
    width: 50px;
    height: 50px;
    font-size: 28px;
  }

  .calffa-brand {
    font-size: 18px;
  }

  .calffa-tagline {
    font-size: 10px;
  }

  .nav-sections {
    padding: 18px 0;
  }

  .nav-section {
    margin-bottom: 20px;
  }

  .section-header {
    padding: 11px 18px;
    margin-bottom: 10px;
    font-size: 10.5px;
  }

  .nav-list {
    padding: 0 10px;
    gap: 6px;
  }

  .nav-link {
    padding: 11px 12px;
    font-size: 13px;
    gap: 11px;
    min-height: 46px;
    border-radius: 9px;
  }

  .icon {
    font-size: 19px;
    width: 27px;
    height: 27px;
  }

  .text {
    font-size: 13px;
  }

  .leaf-accent {
    font-size: 15px;
  }

  .nav-badge {
    font-size: 10px;
    padding: 2px 6px;
    min-width: 19px;
  }

  .sidebar-footer {
    padding: 18px;
  }

  .farmer-mode {
    font-size: 11px;
    margin-bottom: 3px;
  }

  .version-text {
    font-size: 9px;
  }

  .sidebar::-webkit-scrollbar {
    width: 5px;
  }
}

/* Desktop (1025px+) */
@media (min-width: 1025px) {
  .sidebar {
    width: 260px;
    top: 70px;
    height: calc(100vh - 70px);
  }

  .sidebar.collapsed {
    width: 80px;
  }

  .sidebar-header {
    padding: 24px 20px;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 24px 12px;
  }

  .calffa-logo-container {
    gap: 14px;
  }

  .sidebar.collapsed .calffa-logo-container {
    gap: 4px;
  }

  .toggle-btn {
    display: none;
  }

  .sidebar.collapsed .toggle-btn {
    display: none;
  }

  .nav-sections {
    padding: 20px 0;
  }

  .nav-link {
    min-height: 48px;
  }

  .sidebar::-webkit-scrollbar {
    width: 6px;
  }
}

/* Landscape Orientation - Reduce Height */
@media (max-height: 600px) {
  .sidebar-header {
    padding: 12px 16px;
    margin-bottom: 4px;
  }

  .rice-logo {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .calffa-brand {
    font-size: 14px;
  }

  .calffa-tagline {
    font-size: 8px;
  }

  .nav-sections {
    padding: 12px 0;
  }

  .nav-section {
    margin-bottom: 8px;
  }

  .section-header {
    padding: 8px 16px;
    margin-bottom: 4px;
    font-size: 9px;
  }

  .nav-link {
    padding: 8px 10px;
    font-size: 12px;
    min-height: 36px;
  }

  .icon {
    font-size: 16px;
    width: 20px;
    height: 20px;
  }

  .sidebar-footer {
    padding: 12px;
  }

  .farmer-mode {
    font-size: 10px;
    margin-bottom: 2px;
  }

  .version-text {
    font-size: 8px;
  }
}
</style>
