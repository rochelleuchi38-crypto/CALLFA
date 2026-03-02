<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-lime-50 p-4 lg:p-6 font-sans">
    
    <!-- Dashboard Header -->
    <DashboardHeader :user="authStore.currentUser" />

    <div class="max-w-7xl mx-auto">
      <!-- Page Title -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 class="text-3xl font-bold text-green-800 flex items-center gap-3">
          <span class="text-4xl">�</span>
          Financial Records
        </h1>

        <!-- Filter Section -->
        <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select 
            v-model="recordType"
            class="border border-green-400 rounded-xl px-4 py-2 text-green-900 focus:ring-2 focus:ring-green-500 shadow-sm"
          >
            <option value="all">All Types</option>
            <option value="loan">Loans</option>
            <option value="contribution">Contributions</option>
            <option value="payment">Payments</option>
          </select>

          <input 
            type="text"
            v-model="searchQuery"
            placeholder="Search records..."
            class="border border-green-400 rounded-xl px-4 py-2 text-green-900 focus:ring-2 focus:ring-green-500 shadow-sm"
          />

          <input 
            type="date"
            v-model="filterDate"
            class="border border-green-400 rounded-xl px-4 py-2 text-green-900 focus:ring-2 focus:ring-green-500 shadow-sm"
          />
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-md p-4 border border-green-200">
          <div class="text-sm text-gray-600">Total Contributions</div>
          <div class="text-2xl font-bold text-green-700">₱{{ formatCurrency(stats.totalContributions) }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-md p-4 border border-blue-200">
          <div class="text-sm text-gray-600">Active Loans</div>
          <div class="text-2xl font-bold text-blue-700">₱{{ formatCurrency(stats.activeLoans) }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-md p-4 border border-yellow-200">
          <div class="text-sm text-gray-600">Total Paid</div>
          <div class="text-2xl font-bold text-yellow-700">₱{{ formatCurrency(stats.totalPaid) }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-md p-4 border border-red-200">
          <div class="text-sm text-gray-600">Outstanding</div>
          <div class="text-2xl font-bold text-red-700">₱{{ formatCurrency(stats.outstanding) }}</div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        <p class="mt-4 text-green-700">Loading financial records...</p>
      </div>

      <!-- Records Table -->
      <div v-else class="overflow-x-auto bg-white rounded-xl shadow-md p-4 border border-green-200">
        <table class="min-w-full divide-y divide-green-200">
          <thead class="bg-green-100">
            <tr>
              <th class="px-4 py-2 text-left text-green-800 font-semibold">Date</th>
              <th class="px-4 py-2 text-left text-green-800 font-semibold">Member</th>
              <th class="px-4 py-2 text-left text-green-800 font-semibold">Type</th>
              <th class="px-4 py-2 text-left text-green-800 font-semibold">Amount</th>
              <th class="px-4 py-2 text-left text-green-800 font-semibold">Status</th>
              <th class="px-4 py-2 text-left text-green-800 font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-green-100">
            <tr v-for="record in filteredRecords" :key="record.id" class="hover:bg-green-50 transition">
              <td class="px-4 py-2">{{ formatDate(record.date) }}</td>
              <td class="px-4 py-2">{{ record.member_name }}</td>
              <td class="px-4 py-2">
                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="typeBadge(record.type)">
                  {{ record.type }}
                </span>
              </td>
              <td class="px-4 py-2">₱{{ formatCurrency(record.amount) }}</td>
              <td class="px-4 py-2">
                <span 
                  :class="statusBadge(record.status)"
                  class="px-3 py-1 rounded-full text-sm font-semibold"
                >
                  {{ record.status }}
                </span>
              </td>
              <td class="px-4 py-2">{{ record.remarks || 'N/A' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- No records message -->
        <div v-if="filteredRecords.length === 0" class="text-center text-green-600 py-6">
          No records found.
        </div>
      </div>

      <!-- Totals -->
      <div class="mt-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-md p-4 border border-green-200 flex justify-end gap-6 text-green-800 font-semibold">
        <div>Total Paid: ₱{{ formatCurrency(totalPaid) }}</div>
        <div>Total Pending: ₱{{ formatCurrency(totalPending) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const records = ref([])
const loans = ref([])
const contributions = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterDate = ref('')
const recordType = ref('all')

const stats = ref({
  totalContributions: 0,
  activeLoans: 0,
  totalPaid: 0,
  outstanding: 0
})

onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }
  loadFinancialData()
})

const loadFinancialData = async () => {
  loading.value = true
  try {
    // Load loans
    const loansRes = await fetch('http://localhost:3000/api/loans')
    if (loansRes.ok) {
      const loansData = await loansRes.json()
      loans.value = loansData.loans || []
    }

    // Load contributions
    const contribRes = await fetch('http://localhost:3000/api/contributions')
    if (contribRes.ok) {
      const contribData = await contribRes.json()
      contributions.value = contribData.contributions || []
    }

    // Load loan stats
    const statsRes = await fetch('http://localhost:3000/api/loans/stats/summary')
    if (statsRes.ok) {
      const statsData = await statsRes.json()
      const loanStats = statsData.stats || {}
      
      // Load contribution stats
      const contribStatsRes = await fetch('http://localhost:3000/api/contributions/stats')
      const contribStatsData = await contribStatsRes.json()
      const contribTotals = contribStatsData.totals || {}
      
      stats.value = {
        totalContributions: parseFloat(contribTotals.total_sum || 0),
        activeLoans: parseFloat(loanStats.total_outstanding || 0),
        totalPaid: parseFloat(loanStats.total_collected || 0),
        outstanding: parseFloat(loanStats.total_outstanding || 0)
      }
    }

    // Combine all records
    combineRecords()
  } catch (error) {
    console.error('Error loading financial data:', error)
  } finally {
    loading.value = false
  }
}

const combineRecords = () => {
  const allRecords = []
  
  // Add loans
  loans.value.forEach(loan => {
    allRecords.push({
      id: `loan-${loan.id}`,
      date: loan.application_date,
      type: 'Loan',
      amount: parseFloat(loan.loan_amount),
      status: loan.status,
      remarks: loan.loan_purpose || '',
      member_name: loan.full_name
    })
  })
  
  // Add contributions
  contributions.value.forEach(contrib => {
    allRecords.push({
      id: `contrib-${contrib.id}`,
      date: contrib.contribution_date,
      type: 'Contribution',
      amount: parseFloat(contrib.amount),
      status: contrib.status,
      remarks: contrib.remarks || contrib.contribution_type,
      member_name: contrib.full_name
    })
  })
  
  // Sort by date descending
  records.value = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Computed filtered records
const filteredRecords = computed(() => {
  return records.value.filter(record => {
    const matchesType = recordType.value === 'all' || 
                       record.type.toLowerCase() === recordType.value.toLowerCase()
    const matchesQuery = record.type.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         record.remarks.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         record.member_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDate = !filterDate.value || record.date === filterDate.value
    return matchesType && matchesQuery && matchesDate
  })
})

// Status badge classes
const statusBadge = (status) => {
  const statusLower = status?.toLowerCase() || ''
  switch(statusLower) {
    case 'paid':
    case 'confirmed': 
      return 'bg-green-200 text-green-800'
    case 'pending': 
      return 'bg-yellow-200 text-yellow-800'
    case 'approved':
    case 'active':
      return 'bg-blue-200 text-blue-800'
    case 'overdue':
    case 'rejected': 
      return 'bg-red-200 text-red-800'
    default: 
      return 'bg-gray-200 text-gray-800'
  }
}

// Type badge classes
const typeBadge = (type) => {
  switch(type.toLowerCase()) {
    case 'loan': 
      return 'bg-blue-100 text-blue-800'
    case 'contribution': 
      return 'bg-green-100 text-green-800'
    case 'payment': 
      return 'bg-purple-100 text-purple-800'
    default: 
      return 'bg-gray-100 text-gray-800'
  }
}

// Totals
const totalPaid = computed(() => 
  filteredRecords.value
    .filter(r => ['paid', 'confirmed'].includes(r.status?.toLowerCase()))
    .reduce((sum, r) => sum + r.amount, 0)
)

const totalPending = computed(() => 
  filteredRecords.value
    .filter(r => r.status?.toLowerCase() === 'pending')
    .reduce((sum, r) => sum + r.amount, 0)
)

const formatCurrency = (value) => new Intl.NumberFormat('en-PH').format(value || 0)

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
/* Scrollbar for table */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #e5e5e5;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb {
  background: #a3d49f;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #7cbf73;
}
</style>
