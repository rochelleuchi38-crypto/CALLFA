<template>
  <div class="dashboard-container">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-top">
        <div class="header-left">
          <h1 class="dashboard-title">📊 CALFFA Dashboard</h1>
          <p class="dashboard-subtitle">Comprehensive Overview & Management System</p>
        </div>
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

      <!-- Stats Overview -->
      <div class="stats-overview">
        <div class="stat-card stat-primary">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-label">Total Members</div>
            <div class="stat-value">{{ totalFarmers }}</div>
          </div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-icon">👨‍🌾</div>
          <div class="stat-info">
            <div class="stat-label">Total Farmers</div>
            <div class="stat-value">{{ farmersCount }}</div>
          </div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-icon">📍</div>
          <div class="stat-info">
            <div class="stat-label">Barangays</div>
            <div class="stat-value">{{ barangaysCount }}</div>
          </div>
        </div>
        <template v-if="isAdmin">
          <div class="stat-card stat-pending">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
              <div class="stat-label">Pending Approvals</div>
              <div class="stat-value">{{ pendingCount }}</div>
            </div>
          </div>
          <div class="stat-card stat-loan" @click="goToLoans" style="cursor: pointer;">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <div class="stat-label">Pending Loans</div>
              <div class="stat-value">{{ pendingLoansCount }}</div>
            </div>
            <div v-if="pendingLoansCount > 0" class="notification-badge">!</div>
          </div>
        </template>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <h2 class="section-title">📊 Analytics & Insights</h2>
      <div class="charts-grid">
        <!-- Members by Status Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">👥 Members by Status</h3>
            <span class="chart-badge">{{ totalFarmers }} Total</span>
          </div>
          <canvas ref="statusChartRef"></canvas>
        </div>

        <!-- Top Barangays Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">📍 Top 10 Barangays</h3>
            <span class="chart-badge">By Members</span>
          </div>
          <canvas ref="barangayChartRef"></canvas>
        </div>

        <!-- Financial Overview Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">💰 Financial Overview</h3>
            <span class="chart-badge">{{ isAdmin ? 'All Members' : 'My Account' }}</span>
          </div>
          <canvas ref="financialChartRef"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()
const authStore = useAuthStore()

// State
const allFarmers = ref([])
const barangays = ref([])
const pendingLoans = ref([])
const allApprovedLoans = ref([])
const allActiveLoans = ref([])
const allContributions = ref([])
const loading = ref(false)

// Farmer-specific financial data
const farmerContributions = ref(0)
const farmerLoans = ref(0)

// Chart refs
const statusChartRef = ref(null)
const barangayChartRef = ref(null)
const financialChartRef = ref(null)

let statusChart = null
let barangayChart = null
let financialChart = null

// Computed
const isAdmin = computed(() => authStore.currentUser?.role === 'admin')
const totalFarmers = computed(() => allFarmers.value.length)
const farmersCount = computed(() => allFarmers.value.filter(f => f.role === 'farmer').length)
const barangaysCount = computed(() => barangays.value.length)
const approvedCount = computed(() => allFarmers.value.filter(f => f.status === 'approved').length)
const pendingCount = computed(() => allFarmers.value.filter(f => f.status === 'pending' || !f.status).length)
const rejectedCount = computed(() => allFarmers.value.filter(f => f.status === 'rejected').length)

// Calculate total contributions from actual contribution records
const totalContributions = computed(() => {
  if (isAdmin.value) {
    return allContributions.value.reduce((sum, contrib) => sum + parseFloat(contrib.amount || 0), 0)
  }
  return farmerContributions.value
})

// Calculate loans from actual approved and active loans
const totalLoans = computed(() => {
  if (isAdmin.value) {
    // Approved loans: full loan amount
    const approvedTotal = allApprovedLoans.value.reduce(
      (sum, loan) => sum + parseFloat(loan.loan_amount || 0), 0
    )
    // Active (partial paid) loans: remaining balance only
    const activeTotal = allActiveLoans.value.reduce(
      (sum, loan) => sum + parseFloat(loan.remaining_balance || 0), 0
    )
    return approvedTotal + activeTotal
  }
  return farmerLoans.value
})

// Calculate actual expenses (disbursed loans minus payments received)
// Pending loans count
const pendingLoansCount = computed(() => pendingLoans.value.length)

// Methods
const loadAllFarmers = async () => {
  try {
    const response = await fetch('/api/farmers')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    allFarmers.value = data.farmers || data || []
  } catch (err) {
    console.error('Error loading farmers:', err)
  }
}

const loadBarangays = async () => {
  try {
    const response = await fetch('/api/barangays')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    barangays.value = data.barangays || []
  } catch (err) {
    console.error('Error loading barangays:', err)
  }
}

const loadPendingLoans = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/loans?status=pending')
    if (response.ok) {
      const data = await response.json()
      pendingLoans.value = data.loans || []
    }
  } catch (err) {
    console.error('Error loading pending loans:', err)
  }
}

const loadApprovedLoans = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/loans?status=approved')
    if (response.ok) {
      const data = await response.json()
      allApprovedLoans.value = data.loans || []
    }
  } catch (err) {
    console.error('Error loading approved loans:', err)
  }
}

const loadActiveLoans = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/loans?status=active')
    if (response.ok) {
      const data = await response.json()
      allActiveLoans.value = data.loans || []
    }
  } catch (err) {
    console.error('Error loading active loans:', err)
  }
}

const loadAllContributions = async () => {
  if (!isAdmin.value) return
  
  try {
    const response = await fetch('http://localhost:3000/api/contributions')
    if (response.ok) {
      const data = await response.json()
      allContributions.value = data.contributions || []
    }
  } catch (err) {
    console.error('Error loading contributions:', err)
  }
}

const loadFarmerFinancialData = async () => {
  if (isAdmin.value) return // Admin uses aggregated data
  
  try {
    const userId = authStore.currentUser?.id
    if (!userId) {
      console.warn('No user ID found for loading financial data')
      return
    }

    console.log('Loading financial data for farmer ID:', userId)

    // Load farmer's contributions
    const contribResponse = await fetch(`http://localhost:3000/api/contributions/farmer/${userId}`)
    console.log('Contributions response status:', contribResponse.status)
    
    if (contribResponse.ok) {
      const contribData = await contribResponse.json()
      console.log('Contributions data:', contribData)
      
      if (contribData.success && contribData.contributions) {
        farmerContributions.value = contribData.contributions.reduce(
          (sum, c) => sum + parseFloat(c.amount || 0), 0
        )
        console.log('Total contributions:', farmerContributions.value)
      }
    } else {
      console.error('Failed to load contributions:', await contribResponse.text())
    }

    // Load farmer's loans (using same endpoint as LoanPage)
    const loansResponse = await fetch(`http://localhost:3000/api/loans?farmer_id=${userId}`)
    console.log('Loans response status:', loansResponse.status)
    
    if (loansResponse.ok) {
      const loansData = await loansResponse.json()
      console.log('Loans data:', loansData)
      
      if (loansData.success && loansData.loans) {
        const approvedLoans = loansData.loans.filter(l => 
          l.status === 'approved' || l.status === 'active' || l.status === 'paid'
        )
        console.log('Approved/Active/Paid loans:', approvedLoans)
        
        // Use loan_amount field (not amount)
        farmerLoans.value = approvedLoans.reduce(
          (sum, l) => sum + parseFloat(l.loan_amount || 0), 0
        )
        console.log('Total loans:', farmerLoans.value)
      }
    } else {
      console.error('Failed to load loans:', await loansResponse.text())
    }

    console.log('Final financial data:', {
      contributions: farmerContributions.value,
      loans: farmerLoans.value
    })
  } catch (err) {
    console.error('Error loading farmer financial data:', err)
  }
}

const goToLoans = () => {
  router.push('/admin-loans')
}

const renderCharts = () => {
  renderStatusChart()
  renderBarangayChart()
  renderFinancialChart()
}

const renderStatusChart = () => {
  if (!statusChartRef.value) return
  if (statusChart) statusChart.destroy()

  const ctx = statusChartRef.value.getContext('2d')
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [{
        data: [approvedCount.value, pendingCount.value, rejectedCount.value],
        backgroundColor: ['#10B981', '#FBBF24', '#EF4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  })
}

const renderBarangayChart = () => {
  if (!barangayChartRef.value) return
  if (barangayChart) barangayChart.destroy()

  // Count farmers by barangay
  const barangayCounts = {}
  allFarmers.value.forEach(farmer => {
    const barangay = farmer.address || 'Unknown'
    barangayCounts[barangay] = (barangayCounts[barangay] || 0) + 1
  })

  // Sort and get top 10
  const sortedBarangays = Object.entries(barangayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const ctx = barangayChartRef.value.getContext('2d')
  barangayChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedBarangays.map(([name]) => name),
      datasets: [{
        label: 'Number of Members',
        data: sortedBarangays.map(([, count]) => count),
        backgroundColor: '#7C3AED',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
}

const renderFinancialChart = () => {
  if (!financialChartRef.value) return
  if (financialChart) financialChart.destroy()

  const ctx = financialChartRef.value.getContext('2d')
  
  // Show only contributions and outstanding loans
  const contributions = totalContributions.value
  const loans = totalLoans.value
  
  financialChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Contributions', 'Outstanding Loans'],
      datasets: [{
        label: 'Amount (₱)',
        data: [contributions, loans],
        backgroundColor: ['#10B981', '#3B82F6'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return '₱' + context.parsed.y.toLocaleString()
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₱' + value.toLocaleString()
            }
          }
        }
      }
    }
  })
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// Lifecycle
onMounted(async () => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }

  loading.value = true
  
  // Load data in parallel
  await Promise.all([
    loadAllFarmers(),
    loadBarangays(),
    loadPendingLoans(),
    loadApprovedLoans(),
    loadActiveLoans(),
    loadAllContributions()
  ])
  
  // Load farmer-specific data if not admin
  if (!isAdmin.value) {
    await loadFarmerFinancialData()
  }
  
  loading.value = false

  await nextTick()
  renderCharts()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
}

/* Dashboard Header */
.dashboard-header {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  margin-bottom: 28px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f3f4f6;
}

.header-left {
  flex: 1;
}

.dashboard-title {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dashboard-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.logout-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.logout-icon {
  color: white;
}

.logout-text {
  font-weight: 600;
}

/* Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  border: 2px solid #f3f4f6;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 36px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-primary .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.stat-pending .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.stat-success .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.stat-danger .stat-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.stat-info .stat-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.stat-warning .stat-icon {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.stat-loan .stat-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.stat-card {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ef4444;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #111827;
}

/* Charts Section */
.charts-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.chart-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.chart-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

canvas {
  max-height: 300px;
}

/* Quick Actions */
.quick-actions-section {
  margin-bottom: 28px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid transparent;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.action-primary {
  border-left-color: #667eea;
}

.action-primary .action-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-success {
  border-left-color: #10b981;
}

.action-success .action-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.action-warning {
  border-left-color: #f59e0b;
}

.action-warning .action-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.action-info {
  border-left-color: #3b82f6;
}

.action-info .action-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.action-danger {
  border-left-color: #ef4444;
}

.action-danger .action-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.action-secondary {
  border-left-color: #6b7280;
}

.action-secondary .action-icon {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-text {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.action-desc {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .logout-button {
    width: 100%;
    justify-content: center;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-title {
    font-size: 24px;
  }

  .section-title {
    font-size: 18px;
  }
}
</style>
