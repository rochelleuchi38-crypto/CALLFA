<template>
  <div class="financial-overview-container">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">
          <span class="title-icon">💰</span>
          Financial Overview
        </h1>
        <p class="page-subtitle">System-wide financial metrics, income, expenses, and savings breakdown</p>
      </div>
      <div class="header-actions">
        <button class="export-btn" @click="exportReport('csv')">📥 Export CSV</button>
        <button class="export-btn" @click="exportReport('pdf')">📄 Export PDF</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-label">Total Loans Disbursed</div>
          <div class="stat-value income">₱{{ totalLoansDisbursed.toLocaleString() }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💵</div>
        <div class="stat-info">
          <div class="stat-label">Payments Received</div>
          <div class="stat-value savings">₱{{ totalPaymentsReceived.toLocaleString() }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💳</div>
        <div class="stat-info">
          <div class="stat-label">Outstanding Balance</div>
          <div class="stat-value expense">₱{{ outstandingBalance.toLocaleString() }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-label">Active Loans</div>
          <div class="stat-value">{{ activeLoansCount }}</div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-section">
      <div class="chart-card">
        <h3 class="chart-title">Financial Breakdown</h3>
        <!-- Perfect-circle wrapper to ensure exact donut shape -->
        <div class="donut-wrap">
          <DonutChart
            :income="totalIncome"
            :expenses="totalExpenses"
            :savings="netSavings"
            :size="chartSize"
          />
        </div>
      </div>
    </div>

    <!-- Section 1: Approved Loans -->
    <div class="info-section">
      <div class="section-header">
        <h3 class="section-title">✓ Approved Loans</h3>
        <div class="section-actions">
          <span class="section-badge">{{ approvedLoans.length }} Loans</span>
          <button class="print-btn" @click="printSection('approved-loans')">🖨️ Print</button>
        </div>
      </div>
      
      <div class="section-stats">
        <div class="summary-stat">
          <span class="stat-label">Total Approved Amount:</span>
          <span class="stat-value approved">₱{{ approvedLoansTotal.toLocaleString() }}</span>
        </div>
      </div>

      <div id="approved-loans" class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ref No.</th>
              <th>Farmer Name</th>
              <th>Loan Type</th>
              <th>Loan Amount</th>
              <th>Approval Date</th>
              <th>Due Date</th>
              <th>Approved By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="loading-row">
              <td colspan="7">Loading approved loans...</td>
            </tr>
            <tr v-else-if="approvedLoans.length === 0" class="empty-row">
              <td colspan="7">No approved loans</td>
            </tr>
            <tr v-else v-for="loan in approvedLoans" :key="loan.id" class="data-row">
              <td>{{ loan.reference_number || 'N/A' }}</td>
              <td class="farmer-name">{{ loan.full_name }}</td>
              <td>{{ formatLoanType(loan.loan_type) }}</td>
              <td class="amount">₱{{ parseFloat(loan.loan_amount).toLocaleString() }}</td>
              <td>{{ formatDate(loan.approval_date) }}</td>
              <td>{{ formatDate(loan.due_date) }}</td>
              <td>{{ loan.approved_by_name || 'N/A' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 2: Partial Payment History -->
    <div class="info-section">
      <div class="section-header">
        <h3 class="section-title">💳 Partial Payment History</h3>
        <div class="section-actions">
          <span class="section-badge">{{ partialPayments.length }} Payments</span>
          <button class="print-btn" @click="printSection('partial-payments')">🖨️ Print</button>
        </div>
      </div>
      
      <div class="section-stats">
        <div class="summary-stat">
          <span class="stat-label">Total Partial Payments:</span>
          <span class="stat-value partial">₱{{ totalPartialPayments.toLocaleString() }}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Outstanding Balance:</span>
          <span class="stat-value warning">₱{{ activeLoansBalance.toLocaleString() }}</span>
        </div>
      </div>

      <div id="partial-payments" class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Payment Date</th>
              <th>Farmer Name</th>
              <th>Loan Type</th>
              <th>Original Amount</th>
              <th>Payment Amount</th>
              <th>Remaining Balance</th>
              <th>Receipt No.</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="loading-row">
              <td colspan="8">Loading partial payments...</td>
            </tr>
            <tr v-else-if="partialPayments.length === 0" class="empty-row">
              <td colspan="8">No partial payments found</td>
            </tr>
            <tr v-else v-for="payment in partialPayments" :key="payment.id" class="data-row">
              <td>{{ formatDate(payment.payment_date) }}</td>
              <td class="farmer-name">{{ payment.farmer_name }}</td>
              <td>{{ formatLoanType(payment.loan_type) }}</td>
              <td class="amount">₱{{ parseFloat(payment.loan_amount).toLocaleString() }}</td>
              <td class="amount highlight">₱{{ parseFloat(payment.amount).toLocaleString() }}</td>
              <td class="amount warning">₱{{ parseFloat(payment.remaining_after_payment || 0).toLocaleString() }}</td>
              <td>{{ payment.reference_number || '-' }}</td>
              <td>{{ payment.payment_method || 'Cash' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 3: Completed Loans (Fully Paid) -->
    <div class="info-section">
      <div class="section-header">
        <h3 class="section-title">✅ Completed Loans (Fully Paid)</h3>
        <div class="section-actions">
          <span class="section-badge success">{{ paidLoans.length }} Completed</span>
          <button class="print-btn" @click="printSection('completed-loans')">🖨️ Print</button>
        </div>
      </div>
      
      <div class="section-stats">
        <div class="summary-stat">
          <span class="stat-label">Total Loans Completed:</span>
          <span class="stat-value success">{{ paidLoans.length }}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Total Amount Collected:</span>
          <span class="stat-value success">₱{{ totalPaidLoansAmount.toLocaleString() }}</span>
        </div>
      </div>

      <div id="completed-loans" class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ref No.</th>
              <th>Farmer Name</th>
              <th>Loan Type</th>
              <th>Loan Amount</th>
              <th>Total Paid</th>
              <th>Approval Date</th>
              <th>Paid Date</th>
              <th>Duration (Days)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="loading-row">
              <td colspan="8">Loading completed loans...</td>
            </tr>
            <tr v-else-if="paidLoans.length === 0" class="empty-row">
              <td colspan="8">No completed loans</td>
            </tr>
            <tr v-else v-for="loan in paidLoans" :key="loan.id" class="data-row">
              <td>{{ loan.reference_number || 'N/A' }}</td>
              <td class="farmer-name">{{ loan.full_name }}</td>
              <td>{{ formatLoanType(loan.loan_type) }}</td>
              <td class="amount">₱{{ parseFloat(loan.loan_amount).toLocaleString() }}</td>
              <td class="amount success">₱{{ parseFloat(loan.total_paid).toLocaleString() }}</td>
              <td>{{ formatDate(loan.approval_date) }}</td>
              <td>{{ formatDate(loan.paid_date) }}</td>
              <td>{{ calculateDuration(loan.approval_date, loan.paid_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Table -->
    <div class="financial-table-section">
      <div class="table-header">
        <h3 class="section-title">Financial Summary by Category</h3>
        <div class="table-actions">
          <label class="filter-label">Sort by:</label>
          <select v-model="sortKey" class="sort-select">
            <option value="">None</option>
            <option value="category">Category</option>
            <option value="income">Income</option>
            <option value="expenses">Expenses</option>
            <option value="net">Net</option>
          </select>
          <button class="sort-dir-btn" @click="toggleSortDir" :disabled="!sortKey">
            {{ sortAsc ? '⬆️ Asc' : '⬇️ Desc' }}
          </button>
        </div>
      </div>

      <table class="financial-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sortedSummary" :key="item.category">
            <td>{{ item.category }}</td>
            <td class="income">{{ formatCurrency(item.income) }}</td>
            <td class="expense">{{ formatCurrency(item.expenses) }}</td>
            <td :class="item.net >= 0 ? 'positive' : 'negative'">
              {{ formatCurrency(item.net) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import DonutChart from '../components/DonutChart.vue'

const authStore = useAuthStore()

// Real data refs
const loading = ref(true)
const approvedLoans = ref([])
const activeLoans = ref([])
const paidLoans = ref([])
const paymentHistory = ref([])
const paymentFilter = ref('all')

// Keep chart size fixed to avoid distortion
const chartSize = ref(260)

// Computed values from real data
const totalLoansDisbursed = computed(() => {
  return [...approvedLoans.value, ...activeLoans.value, ...paidLoans.value]
    .reduce((sum, loan) => sum + parseFloat(loan.loan_amount || 0), 0)
})

const totalPaymentsReceived = computed(() => {
  return paymentHistory.value.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
})

const outstandingBalance = computed(() => {
  const approvedTotal = approvedLoans.value.reduce((sum, loan) => sum + parseFloat(loan.loan_amount || 0), 0)
  const activeTotal = activeLoans.value.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance || 0), 0)
  return approvedTotal + activeTotal
})

const activeLoansCount = computed(() => approvedLoans.value.length + activeLoans.value.length)

const approvedLoansTotal = computed(() => {
  return approvedLoans.value.reduce((sum, loan) => sum + parseFloat(loan.loan_amount || 0), 0)
})

const activeLoansBalance = computed(() => {
  return activeLoans.value.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance || 0), 0)
})

const monthlyPayments = computed(() => {
  const now = new Date()
  const thisMonth = paymentHistory.value.filter(payment => {
    const paymentDate = new Date(payment.payment_date)
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
  })
  return thisMonth.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
})

const filteredPayments = computed(() => {
  if (paymentFilter.value === 'all') return paymentHistory.value
  if (paymentFilter.value === 'full') return paymentHistory.value.filter(p => p.loan_status === 'paid')
  if (paymentFilter.value === 'partial') return paymentHistory.value.filter(p => p.loan_status === 'active')
  return paymentHistory.value
})

// Partial payments only (status = active)
const partialPayments = computed(() => {
  return paymentHistory.value.filter(p => p.loan_status === 'active' && parseFloat(p.remaining_after_payment || 0) > 0)
})

const totalPartialPayments = computed(() => {
  return partialPayments.value.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
})

const totalPaidLoansAmount = computed(() => {
  return paidLoans.value.reduce((sum, loan) => sum + parseFloat(loan.total_paid || 0), 0)
})

// Updated chart data based on real financial data
const totalIncome = computed(() => totalPaymentsReceived.value)
const totalExpenses = computed(() => totalLoansDisbursed.value - totalPaymentsReceived.value)
const netSavings = computed(() => totalPaymentsReceived.value - (totalLoansDisbursed.value - totalPaymentsReceived.value))

const financialSummary = ref([
  { category: 'Agricultural Loans', income: 0, expenses: 0, net: 0 },
  { category: 'Provident Loans', income: 0, expenses: 0, net: 0 },
  { category: 'Educational Loans', income: 0, expenses: 0, net: 0 },
  { category: 'Total', income: 0, expenses: 0, net: 0 }
])

// Sort controls
const sortKey = ref('')
const sortAsc = ref(true)

const sortedSummary = computed(() => {
  const items = [...financialSummary.value]
  if (!sortKey.value) return items
  return items.sort((a, b) => {
    const A = a[sortKey.value]
    const B = b[sortKey.value]
    // Category sort should be alphabetic
    if (sortKey.value === 'category') {
      return sortAsc.value
        ? String(A).localeCompare(String(B))
        : String(B).localeCompare(String(A))
    }
    // Numeric sort for income/expenses/net
    return sortAsc.value ? A - B : B - A
  })
})

const toggleSortDir = () => {
  if (!sortKey.value) return
  sortAsc.value = !sortAsc.value
}

const formatCurrency = (amount) => {
  const formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: amount >= 1000000 ? 1 : 0,
    notation: amount >= 1000000 ? 'compact' : 'standard'
  })
  return formatter.format(amount)
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatLoanType = (type) => {
  if (!type) return 'N/A'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 'N/A'
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const printSection = (sectionId) => {
  const section = document.getElementById(sectionId)
  if (!section) return
  
  const printWindow = window.open('', '_blank')
  const scriptTag = '<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }<\/script>'
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Print - ${sectionId}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .farmer-name {
            font-weight: 600;
          }
          .amount {
            text-align: right;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
          }
          .print-date {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <h1>${sectionId.replace(/-/g, ' ').toUpperCase()}</h1>
        <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
        ${section.innerHTML}
        ${scriptTag}
      </body>
    </html>
  `)
  printWindow.document.close()
}

// Data loading functions
const loadApprovedLoans = async () => {
  try {
    const token = authStore.token;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('http://localhost:3000/api/loans?status=approved', { headers });
    if (response.ok) {
      const data = await response.json();
      approvedLoans.value = data.loans || [];
    }
  } catch (error) {
    console.error('Error loading approved loans:', error);
  }
}

const loadActiveLoans = async () => {
  try {
    const token = authStore.token;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('http://localhost:3000/api/loans?status=active', { headers });
    if (response.ok) {
      const data = await response.json();
      activeLoans.value = data.loans || [];
    }
  } catch (error) {
    console.error('Error loading active loans:', error);
  }
}

const loadPaidLoans = async () => {
  try {
    const token = authStore.token;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('http://localhost:3000/api/loans?status=paid', { headers });
    if (response.ok) {
      const data = await response.json();
      paidLoans.value = data.loans || [];
    }
  } catch (error) {
    console.error('Error loading paid loans:', error);
  }
}

const loadPaymentHistory = async () => {
  try {
    const token = authStore.token;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('http://localhost:3000/api/loan-payments/history', { headers })
    if (response.ok) {
      const data = await response.json()
      paymentHistory.value = data.payments || []
    }
  } catch (error) {
    console.error('Error loading payment history:', error)
    // Fallback to empty array
    paymentHistory.value = []
  }
}

const updateFinancialSummary = () => {
  const allLoans = [...approvedLoans.value, ...activeLoans.value, ...paidLoans.value]
  const allPayments = paymentHistory.value
  
  // Group by loan type
  const agricultural = allLoans.filter(l => l.loan_type === 'agricultural')
  const provident = allLoans.filter(l => l.loan_type === 'provident')
  const educational = allLoans.filter(l => l.loan_type === 'educational')
  
  // Calculate disbursed amounts and payments received for each type
  const agriculturealDisbursed = agricultural.reduce((sum, l) => sum + parseFloat(l.loan_amount || 0), 0)
  const providentDisbursed = provident.reduce((sum, l) => sum + parseFloat(l.loan_amount || 0), 0)
  const educationalDisbursed = educational.reduce((sum, l) => sum + parseFloat(l.loan_amount || 0), 0)
  
  const agriculturalPayments = allPayments.filter(p => p.loan_type === 'agricultural').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const providentPayments = allPayments.filter(p => p.loan_type === 'provident').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const educationalPayments = allPayments.filter(p => p.loan_type === 'educational').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  
  financialSummary.value = [
    { 
      category: 'Agricultural Loans', 
      income: agriculturalPayments, 
      expenses: agriculturealDisbursed, 
      net: agriculturalPayments - agriculturealDisbursed 
    },
    { 
      category: 'Provident Loans', 
      income: providentPayments, 
      expenses: providentDisbursed, 
      net: providentPayments - providentDisbursed 
    },
    { 
      category: 'Educational Loans', 
      income: educationalPayments, 
      expenses: educationalDisbursed, 
      net: educationalPayments - educationalDisbursed 
    },
    { 
      category: 'Total', 
      income: totalPaymentsReceived.value, 
      expenses: totalLoansDisbursed.value, 
      net: totalPaymentsReceived.value - totalLoansDisbursed.value 
    }
  ]
}

const exportReport = (format) => {
  if (format === 'csv') {
    exportCSV()
  } else if (format === 'pdf') {
    exportPDF()
  }
}

const exportCSV = () => {
  const csvData = [
    ['Category', 'Income', 'Expenses', 'Net'],
    ...financialSummary.value.map(item => [
      item.category,
      item.income,
      item.expenses,
      item.net
    ])
  ]
  
  const csvContent = csvData.map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

const exportPDF = () => {
  // Simple PDF export using window.print
  window.print()
}

onMounted(async () => {
  loading.value = true
  await Promise.all([
    loadApprovedLoans(),
    loadActiveLoans(),
    loadPaidLoans(),
    loadPaymentHistory()
  ])
  updateFinancialSummary()
  loading.value = false
})
</script>

<style scoped>
/* Container and base layout */
.financial-overview-container {
  min-height: calc(100vh - 70px);
  padding: 20px;
  max-width: 1280px;
  margin: 0 auto;
  background: #f9fafb;
  font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.page-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: end;
  margin-bottom: 20px;
}

.page-header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-title {
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Poppins', sans-serif;
}

.title-icon {
  font-size: 30px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.export-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  min-height: 40px;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35);
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}
@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: white;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.stat-icon {
  font-size: 34px;
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 12px;
  flex: 0 0 56px;
}

.stat-info {
  display: grid;
  grid-template-rows: auto auto;
  gap: 6px;
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  font-family: 'Poppins', sans-serif;
  letter-spacing: -0.2px;
}

.stat-value.income { color: #10b981; }
.stat-value.expense { color: #ef4444; }
.stat-value.savings { color: #3b82f6; }

/* Charts section */
.charts-section {
  background: white;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.chart-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 14px 0;
  color: #111827;
}

/* Ensures exact circle: the wrapper locks aspect ratio and prevents stretching */
.donut-wrap {
  width: 100%;
  max-width: 360px;         /* optional cap */
  margin: 0 auto;
  aspect-ratio: 1 / 1;      /* guarantees 1:1 box */
  display: grid;
  place-items: center;      /* center the chart */
  /* Prevent child from stretching oddly */
}
.donut-wrap > * {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  /* If DonutChart uses SVG, this keeps perfect circle when parent changes */
}

/* Table section */
.financial-table-section {
  background: white;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.table-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  color: #6b7280;
}

.sort-select {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #374151;
}

.sort-dir-btn {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}
.sort-dir-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.financial-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* keeps columns balanced */
}

.financial-table th,
.financial-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.financial-table th {
  background: #f9fafb;
  font-weight: 700;
  font-size: 12.5px;
  color: #6b7280;
  border-bottom: 2px solid #e5e7eb;
}

.financial-table td {
  font-size: 13.5px;
  color: #111827;
}

.financial-table td.income {
  color: #10b981;
  font-weight: 700;
}

.financial-table td.expense {
  color: #ef4444;
  font-weight: 700;
}

.financial-table td.positive {
  color: #10b981;
  font-weight: 700;
}

.financial-table td.negative {
  color: #ef4444;
  font-weight: 700;
}

/* Info Sections */
.info-section {
  background: white;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.section-title {
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-badge {
  padding: 6px 14px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.section-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.print-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
  font-size: 13px;
}

.print-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
}

.section-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-stat .stat-label {
  font-size: 13px;
  color: #6b7280;
}

.summary-stat .stat-value {
  font-size: 20px;
  font-weight: 800;
  font-family: 'Poppins', sans-serif;
}

.summary-stat .stat-value.approved {
  color: #f59e0b;
}

.summary-stat .stat-value.partial {
  color: #3b82f6;
}

.summary-stat .stat-value.warning {
  color: #ef4444;
}

.summary-stat .stat-value.success {
  color: #10b981;
}

.data-table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.data-table th {
  background: #f9fafb;
  font-weight: 700;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 2px solid #e5e7eb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  font-size: 13.5px;
  color: #374151;
}

.data-table .farmer-name {
  font-weight: 600;
  color: #111827;
}

.data-table .amount {
  text-align: right;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.data-table .amount.highlight {
  color: #3b82f6;
}

.data-table .amount.warning {
  color: #ef4444;
}

.data-table .amount.success {
  color: #10b981;
}

.data-table .loading-row,
.data-table .empty-row {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

.data-table .data-row:hover {
  background: #f9fafb;
}

/* Print styles */
@media print {
  .page-header,
  .stats-grid,
  .charts-section,
  .financial-table-section {
    display: none;
  }
  
  .section-header .section-actions {
    display: none;
  }
  
  .info-section {
    page-break-inside: avoid;
    margin-bottom: 30px;
    box-shadow: none;
    border: 1px solid #ccc;
  }
}
</style>
