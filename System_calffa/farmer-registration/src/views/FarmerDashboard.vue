<template>
  <div class="dashboard-container">
    <!-- Welcome Banner with Rice Field Background -->
    <div class="welcome-banner">
      <div class="banner-background"></div>
      <div class="banner-content">
        <!-- Fixed Sidebar Toggle Button -->
        <button
          @click="toggleSidebar"
          class="sidebar-toggle-btn"
          :class="{ 'sidebar-open': isSidebarOpen }"
          aria-label="Toggle sidebar"
        >
          <span class="hamburger-icon">☰</span>
        </button>
        
        <div class="banner-header">
          <div class="user-section">
            <div class="user-avatar" @click="toggleProfileDropdown">
              <img :src="userAvatar" :alt="userName" />
              <div class="avatar-initials" v-if="!userAvatar">{{ userInitials }}</div>
            </div>
            <div class="user-info">
              <div class="user-name">{{ userName }}</div>
              <div class="user-role">{{ userRole }}</div>
            </div>
            <div class="profile-dropdown" v-if="showProfileDropdown" ref="profileDropdownRef">
              <router-link to="/settings" class="dropdown-item" @click="closeProfileDropdown">
                <span>👤</span> Edit Profile
              </router-link>
              <button class="dropdown-item logout" @click="handleLogout">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  class="logout-icon-inline"
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
                <span>Logout</span>
              </button>
            </div>
          </div>
          
          <div class="welcome-text">
            <h1 class="welcome-title">
              <span class="greeting">{{ greeting }},</span> {{ userName }}
            </h1>
            <p class="motivational-quote">"Bringing Innovation to Your Farming Journey"</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats Overview with Animated Counters -->
    <div class="stats-grid">
      <div class="stat-card stat-green">
        <div class="stat-icon">🌾</div>
        <div class="stat-content">
          <div class="stat-label">My Farm Area</div>
          <div class="stat-value">{{ farmerProfile.landArea || 0 }} ha</div>
        </div>
        <div class="stat-pattern"></div>
      </div>
      <div class="stat-card stat-blue">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-label">My Savings</div>
          <div class="stat-value">{{ formatCurrency(animatedStats.savings) }}</div>
        </div>
        <div class="stat-pattern"></div>
      </div>
      <div class="stat-card stat-orange">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-label">My Loans</div>
          <div class="stat-value">{{ formatCurrency(animatedStats.myLoans) }}</div>
        </div>
        <div class="stat-pattern"></div>
      </div>
      <div class="stat-card stat-purple">
        <div class="stat-icon">🌱</div>
        <div class="stat-content">
          <div class="stat-label">Primary Crop</div>
          <div class="stat-value">{{ farmerProfile.primaryCrop || 'Rice' }}</div>
        </div>
        <div class="stat-pattern"></div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="content-grid">
      <!-- My Crops & Farm Info -->
      <div class="widget-card inventory-widget">
        <div class="widget-header">
          <h3 class="widget-title">
            <span class="widget-icon">🌾</span>
            My Farm Information
          </h3>
          <button class="widget-toggle" @click="toggleWidget('farmInfo')">
            <span>{{ widgetCollapsed.farmInfo ? '▼' : '▲' }}</span>
          </button>
        </div>
        <div v-show="!widgetCollapsed.farmInfo">
          <div class="farm-info-list">
            <div class="farm-info-item">
              <div class="farm-info-label">
                <span class="farm-info-icon">🌾</span>
                Primary Crop
              </div>
              <div class="farm-info-value">{{ farmerProfile.primaryCrop || 'Not set' }}</div>
            </div>
            <div class="farm-info-item">
              <div class="farm-info-label">
                <span class="farm-info-icon">📏</span>
                Land Area
              </div>
              <div class="farm-info-value">{{ farmerProfile.landArea || 0 }} hectares</div>
            </div>
            <div class="farm-info-item">
              <div class="farm-info-label">
                <span class="farm-info-icon">📍</span>
                Farm Location
              </div>
              <div class="farm-info-value">{{ farmerProfile.farmLocation || 'Not set' }}</div>
            </div>
            <div class="farm-info-item">
              <div class="farm-info-label">
                <span class="farm-info-icon">🏠</span>
                Barangay
              </div>
              <div class="farm-info-value">{{ farmerProfile.barangay || 'Not set' }}</div>
            </div>
          </div>
          <button class="manage-btn" @click="goToCurrentCrop">Update Farm Info</button>
        </div>
      </div>

      <!-- My Financial Summary -->
      <div class="widget-card member-widget">
        <div class="widget-header">
          <h3 class="widget-title">
            <span class="widget-icon">💰</span>
            My Financial Summary
          </h3>
          <button class="widget-toggle" @click="toggleWidget('financial')">
            <span>{{ widgetCollapsed.financial ? '▼' : '▲' }}</span>
          </button>
        </div>
        <div v-show="!widgetCollapsed.financial">
          <div class="financial-summary">
            <div class="financial-item">
              <div class="financial-icon savings">💵</div>
              <div class="financial-content">
                <div class="financial-label">Total Savings</div>
                <div class="financial-amount">{{ formatCurrency(financialData.savings) }}</div>
              </div>
            </div>
            <div class="financial-item">
              <div class="financial-icon contributions">🤝</div>
              <div class="financial-content">
                <div class="financial-label">My Contributions</div>
                <div class="financial-amount">{{ formatCurrency(financialData.contributions) }}</div>
              </div>
            </div>
            <div class="financial-item">
              <div class="financial-icon loans">📊</div>
              <div class="financial-content">
                <div class="financial-label">Active Loans</div>
                <div class="financial-amount">{{ formatCurrency(financialData.loans) }}</div>
              </div>
            </div>
          </div>
          <button class="view-all-btn" @click="goToContributions">View Financial Details</button>
        </div>
      </div>

      

      <!-- Crop Insights -->
      <div class="widget-card ai-widget">
        <div class="widget-header">
          <h3 class="widget-title">
            <span class="widget-icon animated-icon">💡</span>
            Insights
          </h3>
          <button class="widget-toggle" @click="toggleWidget('aiInsights')">
            <span>{{ widgetCollapsed.aiInsights ? '▼' : '▲' }}</span>
          </button>
        </div>
        <div v-show="!widgetCollapsed.aiInsights" class="ai-insights-content">
          <div class="smart-tip-card">
            <div class="tip-icon animated-icon">💡</div>
            <div class="tip-content">
              <div class="tip-label">Smart Tip of the Day</div>
              <div class="tip-text">{{ smartTip }}</div>
            </div>
          </div>
          
          <div class="crop-insights">
            <div class="insight-item" v-for="insight in cropInsights" :key="insight.id">
              <div class="insight-icon">{{ insight.icon }}</div>
              <div class="insight-content">
                <div class="insight-title">{{ insight.title }}</div>
                <div class="insight-description">{{ insight.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rice Market Prices — recent projections -->
      <div class="widget-card market-widget">
        <div class="widget-header">
          <h3 class="widget-title">
            <span class="widget-icon">🌾</span>
            Rice Market Prices
          </h3>
          <button class="widget-toggle" @click="toggleWidget('marketPrices')">
            <span>{{ widgetCollapsed.marketPrices ? '▼' : '▲' }}</span>
          </button>
        </div>
        <div v-show="!widgetCollapsed.marketPrices">
          <div class="market-prices-header">
            <span class="market-subtitle">From recent projections</span>
            <span class="market-update">Updated: {{ lastMarketUpdate }}</span>
          </div>
          <div class="rice-prices-list">
            <div
              v-for="price in riceMarketPrices"
              :key="price.id"
              class="rice-price-item"
            >
              <div class="rice-type">
                <span class="rice-icon">🌾</span>
                <span class="rice-name">{{ price.name }}</span>
              </div>
              <div class="price-info">
                <span class="price-value">P{{ price.value }}/kg</span>
                <span class="price-change" :class="price.trend">
                  {{ price.trend === 'up' ? '↑' : price.trend === 'down' ? '↓' : '→' }} {{ price.change }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Animation (Rice Grain) -->
    <div class="rice-loading" v-if="isLoading">
      <div class="bouncing-grain">🌾</div>
      <p>Loading farm data...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useFarmerStore } from '../stores/farmerStore'
import DonutChart from '../components/DonutChart.vue'

const router = useRouter()
const authStore = useAuthStore()
const farmerStore = useFarmerStore()

// Sidebar toggle state
const isSidebarOpen = ref(false)
const showProfileDropdown = ref(false)
const isLoading = ref(false)
const profileDropdownRef = ref(null)

// Toggle sidebar function
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  const sidebar = document.querySelector('.sidebar')
  if (sidebar) {
    sidebar.classList.toggle('mobile-open', isSidebarOpen.value)
  }
}

const userName = computed(() => authStore.currentUser?.full_name || 'Juan Dela Cruz')
const userRole = computed(() => {
  const role = authStore.currentUser?.role || 'farmer'
  return role === 'admin' ? 'Admin' : 'Farmer'
})

const userInitials = computed(() => {
  const name = userName.value
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

const userAvatar = computed(() => {
  return (
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(userName.value) +
    "&background=10b981&color=fff&size=128"
  )
})

const toggleProfileDropdown = () => {
  showProfileDropdown.value = !showProfileDropdown.value
}

const closeProfileDropdown = () => {
  showProfileDropdown.value = false
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const stats = ref({
  savings: 12400,
  myLoans: 5000,
  landArea: 0,
  primaryCrop: ''
})

// Animated stats for counter effect
const animatedStats = ref({
  savings: 0,
  myLoans: 0
})

// Farmer's profile information
const farmerProfile = ref({
  landArea: 0,
  primaryCrop: '',
  farmLocation: '',
  barangay: ''
})

// Financial data
const financialData = ref({
  savings: 12400,
  contributions: 8500,
  loans: 5000
})

// Animate counters
const animateCounter = (target, key, duration = 2000) => {
  const start = 0
  const end = target
  const startTime = performance.now()
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    
    animatedStats.value[key] = Math.floor(start + (end - start) * easeOutQuart)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      animatedStats.value[key] = end
    }
  }
  
  requestAnimationFrame(animate)
}

// Widget collapse states
const widgetCollapsed = ref({
  farmInfo: false,
  financial: false,
  aiInsights: false,
  marketPrices: false
})

const toggleWidget = (widget) => {
  widgetCollapsed.value[widget] = !widgetCollapsed.value[widget]
}

const goToCurrentCrop = () => {
  router.push('/current-crop')
}

const goToContributions = () => {
  router.push('/contributions')
}

// Financial Data
const financialData = ref({
  income: 800000,
  expenses: 200000,
  savings: 200000
})

// Crop insights
const smartTip = ref('Avoid pollination during high wind conditions for better yield. Optimal wind speed: 5-15 km/h.')

const cropInsights = ref([
  {
    id: 1,
    icon: '🌾',
    title: 'Rice Growth Stage',
    description: 'Your rice crops are in the flowering stage. Maintain optimal water levels.'
  },
  {
    id: 2,
    icon: '🌡️',
    title: 'Temperature Alert',
    description: 'Current temperature is ideal (28°C). Continue monitoring for the next 3 days.'
  },
  {
    id: 3,
    icon: '💧',
    title: 'Irrigation Recommendation',
    description: 'Reduce irrigation frequency by 20% based on recent rainfall data.'
  }
])

// Rice Market Prices
const riceMarketPrices = ref([
  { id: 1, name: 'Premium Rice (IR-64)', value: '24.50', trend: 'up', change: 2.5 },
  { id: 2, name: 'Organic Rice', value: '32.75', trend: 'up', change: 1.8 },
  { id: 3, name: 'Hybrid Rice', value: '28.90', trend: 'down', change: -0.5 },
  { id: 4, name: 'Jasmine Rice', value: '35.20', trend: 'stable', change: 0 }
])

const lastMarketUpdate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
})

const formatCurrency = (amount) => {
  if (amount >= 1000000) {
    return `₱ ${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `₱ ${(amount / 1000).toFixed(1)}K`
  }
  return `₱ ${amount.toLocaleString()}`
}

// Load farmer's own data
const loadFarmerData = async () => {
  try {
    const userId = authStore.currentUser?.id
    if (!userId) return

    // Load farmer's profile
    const profileResponse = await fetch(`http://localhost:3000/api/farmers/${userId}/profile`)
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      if (profileData.success) {
        farmerProfile.value = {
          landArea: profileData.farmer.land_area || 0,
          primaryCrop: getCropName(profileData.farmer.primary_crop),
          farmLocation: profileData.farmer.farm_location || profileData.farmer.address,
          barangay: profileData.farmer.address
        }
        stats.value.landArea = profileData.farmer.land_area || 0
        stats.value.primaryCrop = profileData.farmer.primary_crop || ''
      }
    }

    // Load farmer's contributions
    const contribResponse = await fetch(`http://localhost:3000/api/contributions/farmer/${userId}`)
    if (contribResponse.ok) {
      const contribData = await contribResponse.json()
      if (contribData.success && contribData.contributions) {
        const totalContributions = contribData.contributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
        financialData.value.contributions = totalContributions
        financialData.value.savings = totalContributions
        stats.value.savings = totalContributions
      }
    }

    // Load farmer's loans
    const loansResponse = await fetch(`http://localhost:3000/api/loans/farmer/${userId}`)
    if (loansResponse.ok) {
      const loansData = await loansResponse.json()
      if (loansData.success && loansData.loans) {
        const activeLoans = loansData.loans
          .filter(l => l.status === 'approved' || l.status === 'active')
          .reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
        financialData.value.loans = activeLoans
        stats.value.myLoans = activeLoans
      }
    }
  } catch (error) {
    console.error('Error loading farmer data:', error)
  }
}

const getCropName = (crop) => {
  const names = {
    rice: 'Rice',
    corn: 'Corn',
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    coconut: 'Coconut',
    sugarcane: 'Sugarcane',
    calamansi: 'Calamansi'
  }
  return names[crop] || crop || 'Not set'
}

// Click outside handler
const handleClickOutside = (event) => {
  if (
    profileDropdownRef.value &&
    !profileDropdownRef.value.contains(event.target) &&
    !event.target.closest('.user-avatar')
  ) {
    closeProfileDropdown()
  }
}

onMounted(async () => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }

  isLoading.value = true
  
  try {
    await loadFarmerData()
  } catch (error) {
    console.error('Failed to load farm data:', error)
  } finally {
    isLoading.value = false
  }
  
  // Start counter animations
  setTimeout(() => {
    animateCounter(stats.value.savings, 'savings')
    animateCounter(stats.value.myLoans, 'myLoans')
  }, 300)
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Open+Sans:wght@400;500;600;700&display=swap');

.dashboard-container {
  min-height: calc(100vh - 70px);
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f9fafb;
  font-family: 'Open Sans', sans-serif;
}

/* Welcome Banner with Rice Field Background */
.welcome-banner {
  position: relative;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(146, 64, 14, 0.85) 100%);
  color: white;
  padding: 40px 32px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.banner-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    /* Rice field pattern */
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 50px,
      rgba(250, 204, 21, 0.1) 50px,
      rgba(250, 204, 21, 0.1) 100px
    ),
    /* Sunrise gradient */
    radial-gradient(ellipse at top, rgba(250, 204, 21, 0.3) 0%, transparent 70%);
  background-size: 200px 100%, 100% 100%;
  opacity: 0.6;
  z-index: 0;
}

.banner-content {
  position: relative;
  z-index: 1;
}

.banner-header {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.user-section {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.user-avatar:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 18px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}

.user-role {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  text-transform: capitalize;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  min-width: 180px;
  z-index: 100;
  overflow: hidden;
  animation: slideDown 0.3s ease;
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

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #111827;
  text-decoration: none;
  transition: background 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-item.logout {
  color: #ef4444;
  border-top: 1px solid #e5e7eb;
}

.dropdown-item.logout:hover {
  background: #fee2e2;
}

.logout-icon-inline {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.dropdown-item.logout:hover .logout-icon-inline {
  transform: translateX(2px);
}

.welcome-text {
  flex: 1;
}

.welcome-title {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 8px 0;
  font-family: 'Poppins', sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.greeting {
  font-weight: 400;
  opacity: 0.95;
}

.motivational-quote {
  font-size: 18px;
  font-style: italic;
  margin: 0;
  opacity: 0.95;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
}

/* Stats Grid with Earth-tone Colors */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-content {
  flex: 1;
}

.stat-pattern {
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 120px;
  opacity: 0.1;
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      currentColor 10px,
      currentColor 20px
    );
  pointer-events: none;
}

.stat-green {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #10b981;
}

.stat-blue {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #3b82f6;
}

.stat-orange {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  color: #facc15;
}

.stat-purple {
  background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
  color: #7c3aed;
}

.stat-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: inherit;
  line-height: 1.2;
  font-family: 'Poppins', sans-serif;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

/* Widget Cards */
.widget-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.widget-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.widget-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Poppins', sans-serif;
}

.widget-icon {
  font-size: 20px;
}

.animated-icon {
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.widget-toggle {
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #6b7280;
}

.widget-toggle:hover {
  background: #e5e7eb;
  color: #111827;
}

/* Farm Info List */
.farm-info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.farm-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
  border-left: 4px solid #10b981;
  transition: all 0.2s;
}

.farm-info-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.farm-info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

.farm-info-icon {
  font-size: 18px;
}

.farm-info-value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  font-family: 'Poppins', sans-serif;
}

/* Financial Summary */
.financial-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.financial-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
  transition: all 0.2s;
}

.financial-item:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.financial-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.financial-icon.savings {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
}

.financial-icon.contributions {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
}

.financial-icon.loans {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
}

.financial-content {
  flex: 1;
}

.financial-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 4px;
}

.financial-amount {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  font-family: 'Poppins', sans-serif;
}

.manage-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.manage-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

/* Inventory Widget */
.leaf-progress-container {
  width: 100%;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin: 8px 0;
}

.leaf-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  position: relative;
}

.leaf-fill.green {
  background: linear-gradient(90deg, #10b981, #059669);
}

.leaf-fill.orange {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.leaf-fill.red {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.leaf-icon {
  font-size: 14px;
  animation: leafFloat 3s ease-in-out infinite;
}

@keyframes leafFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(5deg); }
}

.restock-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
  min-height: 44px;
}

.restock-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.manage-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.manage-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

/* Member Activity Widget */
.member-activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.member-activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  transition: background 0.2s;
}

.member-activity-item:hover {
  background: #f9fafb;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: #111827;
  margin-bottom: 4px;
  font-weight: 500;
}

.activity-time {
  font-size: 12px;
  color: #6b7280;
}

.activity-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.activity-badge.harvest {
  background: #d1fae5;
  color: #059669;
}

.activity-badge.loan {
  background: #dbeafe;
  color: #2563eb;
}

.activity-badge.profile {
  background: #e9d5ff;
  color: #7c3aed;
}

.view-all-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.view-all-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

/* Financial Widget */
.financial-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.financial-summary {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.summary-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
}

.summary-value.income {
  color: #10b981;
}

.summary-value.expense {
  color: #ef4444;
}

.summary-value.savings {
  color: #3b82f6;
}

/* Insights widget */
.ai-insights-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.smart-tip-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 12px;
  border-left: 4px solid #facc15;
}

.tip-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.tip-content {
  flex: 1;
}

.tip-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #92400e;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.tip-text {
  font-size: 14px;
  color: #78350f;
  font-weight: 500;
  line-height: 1.5;
}

.crop-insights {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
  transition: background 0.2s;
}

.insight-item:hover {
  background: #f3f4f6;
}

.insight-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.insight-description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

/* Market Prices Widget */
.market-prices-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.market-subtitle {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.market-update {
  font-size: 11px;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
}

.rice-prices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.rice-price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 12px;
  border: 1px solid rgba(250, 204, 21, 0.3);
  transition: all 0.2s;
}

.rice-price-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 8px rgba(250, 204, 21, 0.2);
}

.rice-type {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rice-icon {
  font-size: 24px;
}

.rice-name {
  font-size: 15px;
  font-weight: 600;
  color: #78350f;
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.price-value {
  font-size: 18px;
  font-weight: 700;
  color: #92400e;
  font-family: 'Poppins', sans-serif;
}

.price-change {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
}

.price-change.up {
  background: #d1fae5;
  color: #059669;
}

.price-change.down {
  background: #fee2e2;
  color: #dc2626;
}

.price-change.stable {
  background: #e5e7eb;
  color: #6b7280;
}

/* Rice Loading Animation */
.rice-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.bouncing-grain {
  font-size: 48px;
  animation: bounceGrain 1s ease-in-out infinite;
  display: block;
  margin-bottom: 16px;
}

@keyframes bounceGrain {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

.rice-loading p {
  color: #6b7280;
  font-weight: 500;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 32px;
  }

  .stat-value {
    font-size: 28px;
  }

  .welcome-banner {
    padding: 24px 20px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .motivational-quote {
    font-size: 14px;
  }

  .banner-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .widget-card {
    padding: 20px;
  }

  .restock-btn,
  .manage-btn,
  .view-all-btn {
    min-height: 44px; /* Thumb-friendly */
  }
}

/* Fixed Sidebar Toggle Button */
.sidebar-toggle-btn {
  position: fixed;
  top: 85px;
  left: 20px;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: 2px solid white;
  border-radius: 12px;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001; /* Higher than sidebar to ensure visibility */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  min-height: 44px;
  /* Ensure button stays fixed during scroll */
  position: fixed !important;
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.sidebar-toggle-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
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

/* Hide toggle button on large screens where sidebar is always visible */
@media (min-width: 1025px) {
  .sidebar-toggle-btn {
    display: none;
  }
}
</style>
