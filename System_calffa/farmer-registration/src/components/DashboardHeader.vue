<template>
  <div class="dashboard-banner">
    <!-- Fixed Sidebar Toggle Button -->
    <button
      @click="toggleSidebar"
      class="sidebar-toggle-btn"
      :class="{ 'sidebar-open': isSidebarOpen }"
      aria-label="Toggle sidebar"
    >
      <span class="hamburger-icon">☰</span>
    </button>

    <div class="banner-content">
      <div class="banner-left">
        <h1 class="banner-title">My Farm Dashboard</h1>
        <p class="banner-subtitle">Welcome back! Here's your farm overview for today.</p>
      </div>
      <div class="banner-right">
        <div class="farm-info">
          <span class="farm-label">Farm:</span>
          <span class="farm-name">{{ farmName }} ({{ cropType }})</span>
          <span class="farm-size">• {{ farmSize }} hectares</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useFarmerStore } from '../stores/farmerStore'

const router = useRouter()
const authStore = useAuthStore()
const farmerStore = useFarmerStore()

// Sidebar toggle state
const isSidebarOpen = ref(false)

// Computed values
const userName = computed(() => authStore.currentUser?.full_name || 'Farmer')
const farmName = computed(() => authStore.currentUser?.address || 'Rice Field')
const cropType = computed(() => farmerStore.currentCrop?.cropType || 'IR-64')
const farmSize = computed(() => {
  const area = farmerStore.currentCrop?.area_hectares || 2.5
  return area.toFixed(1)
})

// Toggle sidebar function
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  const sidebar = document.querySelector('.sidebar')
  if (sidebar) {
    sidebar.classList.toggle('mobile-open', isSidebarOpen.value)
  }
}

</script>

<style scoped>
.dashboard-banner {
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  color: white;
  padding: clamp(1rem, 4vw, 1.5rem) clamp(1.5rem, 5vw, 2rem);
  border-radius: clamp(0.5rem, 2vw, 0.75rem);
  margin-bottom: clamp(1.5rem, 4vw, 2rem);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  margin-left: -20px;
  margin-right: -20px;
  padding-left: clamp(1.5rem, 5vw, 2.5rem);
  padding-right: clamp(1.5rem, 5vw, 2.5rem);
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: clamp(1rem, 3vw, 1.5rem);
}

.banner-left {
  flex: 1;
  min-width: 200px;
}

.banner-title {
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 700;
  margin-bottom: clamp(0.375rem, 1vw, 0.5rem);
  color: white;
  line-height: 1.2;
}

.banner-subtitle {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
  margin: 0;
}

.banner-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.farm-info {
  display: flex;
  align-items: center;
  gap: clamp(0.375rem, 1.5vw, 0.5rem);
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  background: rgba(255, 255, 255, 0.15);
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem);
  border-radius: clamp(0.375rem, 2vw, 0.5rem);
  backdrop-filter: blur(10px);
  flex-wrap: wrap;
  white-space: normal;
  word-break: break-word;
}

.farm-label {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.farm-name {
  color: white;
  font-weight: 600;
}

.farm-size {
  color: rgba(255, 255, 255, 0.9);
}

/* Fixed Sidebar Toggle Button */
.sidebar-toggle-btn {
  position: fixed;
  top: clamp(75px, 10vh, 95px);
  left: clamp(10px, 2vw, 20px);
  width: clamp(40px, 10vw, 50px);
  height: clamp(40px, 10vw, 50px);
  background: linear-gradient(135deg, #166534, #15803d);
  border: clamp(1px, 0.5vw, 2px) solid white;
  border-radius: clamp(0.5rem, 2vw, 0.75rem);
  color: white;
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
}

.sidebar-toggle-btn:hover {
  background: linear-gradient(135deg, #15803d, #22c55e);
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.sidebar-toggle-btn:active {
  transform: scale(0.95);
}

.sidebar-toggle-btn .hamburger-icon {
  display: block;
  transition: transform 0.3s ease;
}

.sidebar-toggle-btn.sidebar-open .hamburger-icon {
  transform: rotate(90deg);
}

/* Mobile: Single column layout */
@media (max-width: 480px) {
  .dashboard-banner {
    margin-left: -16px;
    margin-right: -16px;
    margin-top: 20px;
  }

  .banner-content {
    flex-direction: column;
    gap: clamp(0.75rem, 2vw, 1rem);
  }

  .banner-left {
    min-width: unset;
    width: 100%;
  }

  .banner-right {
    width: 100%;
  }

  .farm-info {
    width: 100%;
    flex-wrap: wrap;
  }
}

/* Small tablet: 600px - 768px */
@media (min-width: 481px) and (max-width: 768px) {
  .dashboard-banner {
    padding-left: clamp(1.5rem, 4vw, 2rem);
    padding-right: clamp(1.5rem, 4vw, 2rem);
  }

  .banner-content {
    gap: clamp(0.75rem, 2vw, 1.25rem);
  }

  .farm-info {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}

/* Tablet: 769px - 1024px */
@media (min-width: 769px) and (max-width: 1024px) {
  .dashboard-banner {
    padding: clamp(1.25rem, 3vw, 1.5rem) clamp(1.75rem, 4vw, 2rem);
  }

  .banner-content {
    gap: clamp(1rem, 3vw, 1.5rem);
  }
}

/* Large desktop: 1025px and up */
@media (min-width: 1025px) {
  .dashboard-banner {
    margin-left: 0;
    margin-right: 0;
  }

  .banner-content {
    justify-content: space-between;
  }

  .sidebar-toggle-btn {
    display: none;
  }
}

/* Extra small devices with height constraints */
@media (max-height: 600px) {
  .sidebar-toggle-btn {
    top: clamp(60px, 8vh, 75px);
  }

  .dashboard-banner {
    padding: clamp(0.75rem, 2vw, 1rem) clamp(1rem, 4vw, 1.5rem);
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
  }

  .banner-title {
    font-size: clamp(1.25rem, 4vw, 1.5rem);
    margin-bottom: clamp(0.25rem, 0.5vw, 0.375rem);
  }

  .banner-subtitle {
    font-size: clamp(0.75rem, 2vw, 0.875rem);
  }
}

/* Landscape mode adjustments */
@media (max-height: 500px) and (orientation: landscape) {
  .dashboard-banner {
    padding: clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
    margin-bottom: clamp(0.75rem, 1.5vw, 1rem);
  }

  .banner-title {
    font-size: clamp(1rem, 3vw, 1.25rem);
    margin-bottom: 0.25rem;
  }

  .banner-subtitle {
    font-size: clamp(0.75rem, 1.5vw, 0.8125rem);
  }

  .sidebar-toggle-btn {
    top: clamp(45px, 6vh, 55px);
    width: clamp(35px, 8vw, 44px);
    height: clamp(35px, 8vw, 44px);
  }
}
</style>
