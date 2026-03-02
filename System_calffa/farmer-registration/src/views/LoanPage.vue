<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">💰 My Loans</h1>
      <p class="page-subtitle">Apply for agricultural loans and manage your loan applications</p>
    </div>

    <!-- Loan Statistics -->
    <div class="stats-grid">
      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-value">{{ pendingLoans.length }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="stat-card approved">
        <div class="stat-icon">✓</div>
        <div class="stat-content">
          <div class="stat-value">{{ approvedLoans.length }}</div>
          <div class="stat-label">Approved</div>
        </div>
      </div>
      <div class="stat-card active">
        <div class="stat-icon">💳</div>
        <div class="stat-content">
          <div class="stat-value">{{ activeLoans.length }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>
      <div class="stat-card rejected">
        <div class="stat-icon">✗</div>
        <div class="stat-content">
          <div class="stat-value">{{ rejectedLoans.length }}</div>
          <div class="stat-label">Rejected</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <!-- Loan Application Form -->
      <div class="card application-card">
        <h2 class="card-title">Apply for New Loan</h2>
        
        <!-- Eligibility Message -->
        <div v-if="eligibilityMessage" class="alert" :class="canApplyLoan ? 'alert-info' : 'alert-warning'">
          {{ eligibilityMessage }}
        </div>
        
        <form @submit.prevent="submitLoanApplication" class="loan-form" v-if="canApplyLoan">
          <div class="form-group">
            <label>Loan Type</label>
            <select v-model="loanForm.type" required @change="updateMaxAmount">
              <option value="">Select loan type</option>
              <option value="agricultural">Agricultural Loan (Max: ₱5,000)</option>
              <option value="provident">Provident Loan (Max: ₱3,000)</option>
              <option value="educational">Educational Loan (Max: ₱3,000)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Loan Amount (₱)</label>
            <input
              type="number"
              v-model="loanForm.amount"
              placeholder="Enter amount"
              required
              min="500"
              :max="maxLoanAmount"
              step="100"
            />
            <small v-if="loanForm.type" class="help-text">
              Maximum: ₱{{ maxLoanAmount.toLocaleString() }} | 
              Interest: 1% | 
              Payment Term: 6 months
            </small>
            <small v-if="loanForm.amount" class="calculation-text">
              Principal: ₱{{ parseFloat(loanForm.amount).toLocaleString() }} + 
              Interest (1%): ₱{{ (parseFloat(loanForm.amount) * 0.01).toLocaleString() }} = 
              Total: ₱{{ (parseFloat(loanForm.amount) * 1.01).toLocaleString() }}
            </small>
          </div>
          <div class="form-group">
            <label>Purpose (Optional)</label>
            <input
              type="text"
              v-model="loanForm.purpose"
              placeholder="Enter loan purpose"
              maxlength="200"
            />
          </div>
          <div class="loan-info-box">
            <h4>📋 Loan Terms & Conditions</h4>
            <ul>
              <li>Fixed interest rate: <strong>1%</strong></li>
              <li>Payment period: <strong>6 months</strong></li>
              <li>Maximum loans: <strong>1 loan per 6 months</strong> (2 loans per year)</li>
              <li>Must complete existing loans before applying for new one</li>
            </ul>
          </div>
          <button type="submit" class="submit-btn" :disabled="loading || !canApplyLoan">
            {{ loading ? 'Submitting...' : 'Submit Application' }}
          </button>
        </form>
      </div>

      <!-- My Loans Section with Tabs -->
      <div class="card loans-card">
        <h2 class="card-title">My Loan Applications</h2>
        
        <!-- Tabs -->
        <div class="tabs">
          <button
            :class="['tab', { active: activeTab === 'pending' }]"
            @click="activeTab = 'pending'"
          >
            Pending ({{ pendingLoans.length }})
          </button>
          <button
            :class="['tab', { active: activeTab === 'approved' }]"
            @click="activeTab = 'approved'"
          >
            Approved ({{ approvedLoans.length }})
          </button>
          <button
            :class="['tab', { active: activeTab === 'active' }]"
            @click="activeTab = 'active'"
          >
            Active ({{ activeLoans.length }})
          </button>
          <button
            :class="['tab', { active: activeTab === 'rejected' }]"
            @click="activeTab = 'rejected'"
          >
            Rejected ({{ rejectedLoans.length }})
          </button>
          <button
            :class="['tab', { active: activeTab === 'completed' }]"
            @click="activeTab = 'completed'"
          >
            Completed ({{ completedLoans.length }})
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Pending Loans -->
          <div v-if="activeTab === 'pending'">
            <div v-if="pendingLoans.length === 0" class="empty-state">
              <p>📋 No pending loan applications</p>
            </div>
            <div v-else class="loans-list">
              <div v-for="loan in pendingLoans" :key="loan.id" class="loan-item pending" :data-loan-id="loan.id" :class="{ 'notification-highlight': highlightedLoanId == loan.id }">
                <div class="loan-header">
                  <span class="loan-status">⏳ Pending Approval</span>
                </div>
                <div class="loan-body">
                  <div class="loan-amount">₱{{ loan.loan_amount.toLocaleString() }}</div>
                  <div class="loan-details">
                    <p><strong>Type:</strong> {{ formatLoanType(loan.loan_type) }}</p>
                    <p><strong>Purpose:</strong> {{ formatPurpose(loan.loan_purpose) }}</p>
                    <p><strong>Payment Term:</strong> {{ loan.payment_term }} months</p>
                    <p><strong>Applied:</strong> {{ formatDate(loan.application_date) }}</p>
                  </div>
                </div>
                <div class="loan-actions">
                  <button class="edit-btn" @click="editLoan(loan)">✏️ Edit</button>
                  <button class="view-btn" @click="viewLoanDetails(loan)">View Details</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Approved Loans -->
          <div v-if="activeTab === 'approved'">
            <div v-if="approvedLoans.length === 0" class="empty-state">
              <p>✓ No approved loans waiting for activation</p>
            </div>
            <div v-else class="loans-list">
              <div v-for="loan in approvedLoans" :key="loan.id" class="loan-item approved" :data-loan-id="loan.id" :class="{ 'notification-highlight': highlightedLoanId == loan.id }">
                <div class="loan-header">
                  <span class="loan-status">✓ Approved</span>
                </div>
                <div class="loan-body">
                  <div class="loan-amount">₱{{ loan.loan_amount.toLocaleString() }}</div>
                  <div class="loan-details">
                    <p><strong>Purpose:</strong> {{ formatPurpose(loan.loan_purpose) }}</p>
                    <p><strong>Payment Term:</strong> {{ loan.payment_term }} months</p>
                    <p><strong>Approved:</strong> {{ formatDate(loan.approval_date) }}</p>
                    <p><strong>Due Date:</strong> {{ formatDate(loan.due_date) }}</p>
                    <p v-if="loan.remarks"><strong>Remarks:</strong> {{ loan.remarks }}</p>
                  </div>
                </div>
                <button class="view-btn" @click="viewLoanDetails(loan)">View Details</button>
              </div>
            </div>
          </div>

          <!-- Active Loans -->
          <div v-if="activeTab === 'active'">
            <div v-if="activeLoans.length === 0" class="empty-state">
              <p>💳 No active loans</p>
            </div>
            <div v-else class="loans-list">
              <div v-for="loan in activeLoans" :key="loan.id" class="loan-item active" :data-loan-id="loan.id" :class="{ 'notification-highlight': highlightedLoanId == loan.id }">
                <div class="loan-header">
                  <span class="loan-status">💳 Active</span>
                </div>
                <div class="loan-body">
                  <div class="loan-amount">₱{{ loan.loan_amount.toLocaleString() }}</div>
                  <div class="loan-progress">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: ((loan.total_paid / loan.loan_amount) * 100) + '%' }"
                      ></div>
                    </div>
                    <div class="progress-text">
                      {{ ((loan.total_paid / loan.loan_amount) * 100).toFixed(0) }}% Paid
                    </div>
                  </div>
                  <div class="loan-details">
                    <p><strong>Purpose:</strong> {{ formatPurpose(loan.loan_purpose) }}</p>
                    <p><strong>Remaining Balance:</strong> ₱{{ loan.remaining_balance.toLocaleString() }}</p>
                    <p><strong>Total Paid:</strong> ₱{{ loan.total_paid.toLocaleString() }}</p>
                    <p><strong>Due Date:</strong> {{ formatDate(loan.due_date) }}</p>
                  </div>
                </div>
                <button class="view-btn" @click="viewLoanDetails(loan)">View Details</button>
              </div>
            </div>
          </div>

          <!-- Rejected Loans -->
          <div v-if="activeTab === 'rejected'">
            <div v-if="rejectedLoans.length === 0" class="empty-state">
              <p>✗ No rejected applications</p>
            </div>
            <div v-else class="loans-list">
              <div v-for="loan in rejectedLoans" :key="loan.id" class="loan-item rejected" :data-loan-id="loan.id" :class="{ 'notification-highlight': highlightedLoanId == loan.id }">
                <div class="loan-header">
                  <span class="loan-status">✗ Rejected</span>
                </div>
                <div class="loan-body">
                  <div class="loan-amount">₱{{ loan.loan_amount.toLocaleString() }}</div>
                  <div class="loan-details">
                    <p><strong>Loan Type:</strong> {{ formatLoanType(loan.loan_type) }}</p>
                    <p><strong>Submitted:</strong> {{ formatDate(loan.application_date) }}</p>
                    <p><strong>Rejected:</strong> {{ formatDate(loan.rejection_date || loan.updated_at) }}</p>
                    <p class="rejection-reason"><strong>Reason:</strong> {{ loan.rejection_reason || 'Not specified' }}</p>
                  </div>
                </div>
                <button class="view-btn" @click="viewLoanDetails(loan)">View Details</button>
              </div>
            </div>
          </div>

          <!-- Completed Loans -->
          <div v-if="activeTab === 'completed'">
            <div v-if="completedLoans.length === 0" class="empty-state">
              <p>🎉 No completed loans yet</p>
            </div>
            <div v-else class="loans-list">
              <div v-for="loan in completedLoans" :key="loan.id" class="loan-item completed" :data-loan-id="loan.id" :class="{ 'notification-highlight': highlightedLoanId == loan.id }">
                <div class="loan-header">
                  <span class="loan-status">✓ Paid</span>
                </div>
                <div class="loan-body">
                  <div class="loan-amount">₱{{ loan.loan_amount.toLocaleString() }}</div>
                  <div class="loan-details">
                    <p><strong>Purpose:</strong> {{ formatPurpose(loan.loan_purpose) }}</p>
                    <p><strong>Total Paid:</strong> ₱{{ loan.total_paid.toLocaleString() }}</p>
                    <p><strong>Completed:</strong> {{ formatDate(loan.updated_at) }}</p>
                  </div>
                </div>
                <button class="view-btn" @click="viewLoanDetails(loan)">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loan Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📋 Loan Details</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Rejected Loan Details -->
          <div v-if="selectedLoan.status === 'rejected'" class="details-grid">
            <div class="detail-item">
              <label>Status</label>
              <p>
                <span class="status-badge rejected">Rejected</span>
              </p>
            </div>
            <div class="detail-item">
              <label>Loan Type</label>
              <p>{{ formatLoanType(selectedLoan.loan_type) }}</p>
            </div>
            <div class="detail-item">
              <label>Loan Amount</label>
              <p class="amount">₱{{ selectedLoan.loan_amount?.toLocaleString() }}</p>
            </div>
            <div class="detail-item">
              <label>Submitted Date</label>
              <p>{{ formatDate(selectedLoan.application_date) }}</p>
            </div>
            <div class="detail-item">
              <label>Rejected Date</label>
              <p>{{ formatDate(selectedLoan.rejection_date || selectedLoan.updated_at) }}</p>
            </div>
            <div class="detail-item full-width">
              <label>Rejection Reason</label>
              <p class="rejection-reason">{{ selectedLoan.rejection_reason || 'Not specified' }}</p>
            </div>
          </div>

          <!-- Other Loan Details (Pending, Approved, Active, Paid) -->
          <div v-else class="details-grid">
            <div class="detail-item">
              <label>Status</label>
              <p>
                <span :class="['status-badge', selectedLoan.status]">
                  {{ selectedLoan.status }}
                </span>
              </p>
            </div>
            <div class="detail-item">
              <label>Loan Amount</label>
              <p class="amount">₱{{ selectedLoan.loan_amount?.toLocaleString() }}</p>
            </div>
            <div class="detail-item">
              <label>Purpose</label>
              <p>{{ formatPurpose(selectedLoan.loan_purpose) }}</p>
            </div>
            <div class="detail-item">
              <label>Payment Term</label>
              <p>{{ selectedLoan.payment_term }} months</p>
            </div>
            <div class="detail-item">
              <label>Interest Rate</label>
              <p>{{ selectedLoan.interest_rate || 0 }}%</p>
            </div>
            <div class="detail-item">
              <label>Application Date</label>
              <p>{{ formatDate(selectedLoan.application_date) }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.approval_date">
              <label>Approval Date</label>
              <p>{{ formatDate(selectedLoan.approval_date) }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.due_date">
              <label>Due Date</label>
              <p>{{ formatDate(selectedLoan.due_date) }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.remaining_balance">
              <label>Remaining Balance</label>
              <p class="amount">₱{{ selectedLoan.remaining_balance?.toLocaleString() }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.total_paid">
              <label>Total Paid</label>
              <p class="amount">₱{{ selectedLoan.total_paid?.toLocaleString() }}</p>
            </div>
            <div class="detail-item full-width" v-if="selectedLoan.remarks">
              <label>Remarks</label>
              <p>{{ selectedLoan.remarks }}</p>
            </div>
            <div class="detail-item" v-if="loanReceiptNumbers">
              <label>Receipt Number</label>
              <p>{{ loanReceiptNumbers }}</p>
            </div>
          </div>

          <!-- Payment History Section -->
          <div v-if="loanPayments.length > 0" class="payment-history-section">
            <h4>💳 Payment History</h4>
            <table class="payment-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Receipt No.</th>
                  <th>Method</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in loanPayments" :key="payment.id">
                  <td>{{ formatDate(payment.payment_date) }}</td>
                  <td class="amount">₱{{ parseFloat(payment.amount).toLocaleString() }}</td>
                  <td>{{ payment.reference_number || '-' }}</td>
                  <td>{{ payment.payment_method || 'Cash' }}</td>
                  <td>{{ payment.remarks || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Loan Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>✏️ Edit Loan Application</h3>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateLoan" class="edit-loan-form">
            <div class="form-group">
              <label>Loan Type</label>
              <select v-model="editForm.type" required @change="updateEditMaxAmount">
                <option value="">Select loan type</option>
                <option value="agricultural">Agricultural Loan (Max: ₱5,000)</option>
                <option value="provident">Provident Loan (Max: ₱3,000)</option>
                <option value="educational">Educational Loan (Max: ₱3,000)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Loan Amount (₱)</label>
              <input
                type="number"
                v-model="editForm.amount"
                placeholder="Enter amount"
                required
                min="500"
                :max="editMaxAmount"
                step="100"
              />
              <small v-if="editForm.type" class="help-text">
                Maximum: ₱{{ editMaxAmount.toLocaleString() }} | 
                Interest: 1% | 
                Payment Term: 6 months
              </small>
              <small v-if="editForm.amount" class="calculation-text">
                Principal: ₱{{ parseFloat(editForm.amount).toLocaleString() }} + 
                Interest (1%): ₱{{ (parseFloat(editForm.amount) * 0.01).toLocaleString() }} = 
                Total: ₱{{ (parseFloat(editForm.amount) * 1.01).toLocaleString() }}
              </small>
            </div>
            <div class="form-group">
              <label>Purpose (Optional)</label>
              <input
                type="text"
                v-model="editForm.purpose"
                placeholder="Enter loan purpose"
                maxlength="200"
              />
            </div>
            <div class="modal-actions">
              <button type="button" @click="closeEditModal" class="cancel-btn">Cancel</button>
              <button type="submit" class="submit-btn" :disabled="loading">
                {{ loading ? 'Updating...' : 'Update Loan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const route = useRoute()

const highlightedLoanId = ref(null)

const LOAN_LIMITS = {
  agricultural: 5000,
  provident: 3000,
  educational: 3000
}

const loanForm = ref({
  type: '',
  amount: '',
  purpose: ''
})

const editForm = ref({
  id: null,
  type: '',
  amount: '',
  purpose: ''
})

const allLoans = ref([])
const loading = ref(false)
const activeTab = ref('pending')
const showDetailsModal = ref(false)
const showEditModal = ref(false)
const selectedLoan = ref({})
const canApplyLoan = ref(true)
const eligibilityMessage = ref('')

const maxLoanAmount = computed(() => {
  return LOAN_LIMITS[loanForm.value.type] || 5000
})

const editMaxAmount = computed(() => {
  return LOAN_LIMITS[editForm.value.type] || 5000
})

// Update max amount when loan type changes
const updateMaxAmount = () => {
  if (loanForm.value.amount > maxLoanAmount.value) {
    loanForm.value.amount = maxLoanAmount.value
  }
}

const updateEditMaxAmount = () => {
  if (editForm.value.amount > editMaxAmount.value) {
    editForm.value.amount = editMaxAmount.value
  }
}

// Computed properties for different loan categories
const pendingLoans = computed(() => 
  allLoans.value.filter(loan => loan.status === 'pending')
)

const approvedLoans = computed(() => 
  allLoans.value.filter(loan => loan.status === 'approved')
)

const activeLoans = computed(() => 
  allLoans.value.filter(loan => loan.status === 'active')
)

const rejectedLoans = computed(() => 
  allLoans.value.filter(loan => loan.status === 'rejected')
)

const completedLoans = computed(() => 
  allLoans.value.filter(loan => loan.status === 'paid')
)

onMounted(async () => {
  await loadLoans()
  checkEligibility()

  // Handle notification highlight
  if (route.query.highlight && route.query.type === 'loan') {
    highlightedLoanId.value = route.query.highlight
    // Find which tab the loan is in and switch to it
    const loan = allLoans.value.find(l => l.id == route.query.highlight)
    if (loan) {
      activeTab.value = loan.status === 'paid' ? 'completed' : loan.status
    }
    await nextTick()
    // Scroll the highlighted loan into view
    setTimeout(() => {
      const el = document.querySelector(`[data-loan-id="${route.query.highlight}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      // Remove highlight after 6 seconds
      setTimeout(() => { highlightedLoanId.value = null }, 6000)
    }, 300)
  }
})

const checkEligibility = async () => {
  try {
    const farmerId = authStore.currentUser?.id
    if (!farmerId) return
    
    const response = await fetch(`http://localhost:3000/api/loans/eligibility/${farmerId}`)
    if (response.ok) {
      const data = await response.json()
      canApplyLoan.value = data.allowed
      if (!data.allowed) {
        eligibilityMessage.value = data.reason
      } else {
        eligibilityMessage.value = 'You are eligible to apply for a loan.'
      }
    }
  } catch (error) {
    console.error('Error checking eligibility:', error)
  }
}

const loadLoans = async () => {
  loading.value = true
  try {
    const farmerId = authStore.currentUser?.id
    if (!farmerId) {
      console.error('No farmer ID found')
      return
    }

    const response = await fetch(`http://localhost:3000/api/loans?farmer_id=${farmerId}`)
    if (response.ok) {
      const data = await response.json()
      allLoans.value = data.loans || []
      console.log('Loaded loans:', allLoans.value)
    }
  } catch (error) {
    console.error('Error loading loans:', error)
  } finally {
    loading.value = false
  }
}

const submitLoanApplication = async () => {
  if (!authStore.currentUser || !authStore.currentUser.id) {
    alert('Please log in to apply for a loan')
    return
  }
  
  if (!loanForm.value.type) {
    alert('Please select a loan type')
    return
  }
  
  if (!loanForm.value.amount || parseFloat(loanForm.value.amount) <= 0) {
    alert('Please enter a valid loan amount')
    return
  }
  
  if (parseFloat(loanForm.value.amount) > maxLoanAmount.value) {
    alert(`Loan amount cannot exceed ₱${maxLoanAmount.value.toLocaleString()} for ${loanForm.value.type} loan`)
    return
  }
  
  loading.value = true
  try {
    const loanData = {
      farmer_id: authStore.currentUser.id,
      loan_amount: parseFloat(loanForm.value.amount),
      loan_type: loanForm.value.type,
      loan_purpose: loanForm.value.purpose || `${loanForm.value.type} loan`
    }
    
    console.log('Submitting loan application:', loanData)
    
    const response = await fetch('http://localhost:3000/api/loans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(loanData)
    })
    
    const result = await response.json()
    console.log('Loan application response:', result)
    
    if (response.ok) {
      const details = result.details
      alert(`Loan application submitted successfully!\n\nPrincipal: ₱${details.principal.toLocaleString()}\nInterest (1%): ₱${details.interest.toLocaleString()}\nTotal to Pay: ₱${details.total.toLocaleString()}\nPayment Term: ${details.payment_term} months\n\nPlease wait for admin approval.`)
      loanForm.value = {
        type: '',
        amount: '',
        purpose: ''
      }
      activeTab.value = 'pending'
      await loadLoans()
      await checkEligibility()
    } else {
      alert(result.message || 'Failed to submit loan application')
    }
  } catch (error) {
    console.error('Error submitting loan:', error)
    alert('Failed to submit loan application: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loanPayments = ref([])

const loanReceiptNumbers = computed(() => {
  if (loanPayments.value.length === 0) return ''
  const receipts = loanPayments.value
    .map(p => p.reference_number)
    .filter(Boolean)
  return receipts.length > 0 ? receipts.join(', ') : ''
})

const viewLoanDetails = async (loan) => {
  selectedLoan.value = loan
  loanPayments.value = []
  showDetailsModal.value = true

  // Fetch payment history for this loan
  try {
    const response = await fetch(`/api/loans/${loan.id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const data = await response.json()
    if (data.success && data.payments) {
      loanPayments.value = data.payments
    }
  } catch (error) {
    console.error('Error fetching loan payments:', error)
  }
}

const closeModal = () => {
  showDetailsModal.value = false
  selectedLoan.value = {}
}

const editLoan = (loan) => {
  // Calculate the principal amount (remove the 1% interest)
  const totalAmount = parseFloat(loan.loan_amount)
  const principal = totalAmount / 1.01
  
  editForm.value = {
    id: loan.id,
    type: loan.loan_type,
    amount: Math.round(principal),
    purpose: loan.loan_purpose
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = {
    id: null,
    type: '',
    amount: '',
    purpose: ''
  }
}

const updateLoan = async () => {
  if (!editForm.value.type) {
    alert('Please select a loan type')
    return
  }
  
  if (!editForm.value.amount || parseFloat(editForm.value.amount) <= 0) {
    alert('Please enter a valid loan amount')
    return
  }
  
  if (parseFloat(editForm.value.amount) > editMaxAmount.value) {
    alert(`Loan amount cannot exceed ₱${editMaxAmount.value.toLocaleString()} for ${editForm.value.type} loan`)
    return
  }
  
  loading.value = true
  try {
    const loanData = {
      loan_amount: parseFloat(editForm.value.amount),
      loan_type: editForm.value.type,
      loan_purpose: editForm.value.purpose || `${editForm.value.type} loan`
    }
    
    const response = await fetch(`http://localhost:3000/api/loans/${editForm.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(loanData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      const details = result.details
      alert(`Loan updated successfully!\n\nPrincipal: ₱${details.principal.toLocaleString()}\nInterest (1%): ₱${details.interest.toLocaleString()}\nTotal to Pay: ₱${details.total.toLocaleString()}\nPayment Term: ${details.payment_term} months`)
      closeEditModal()
      await loadLoans()
    } else {
      alert(result.message || 'Failed to update loan application')
    }
  } catch (error) {
    console.error('Error updating loan:', error)
    alert('Failed to update loan application: ' + error.message)
  } finally {
    loading.value = false
  }
}

const formatLoanType = (type) => {
  if (!type) return 'N/A'
  return type.charAt(0).toUpperCase() + type.slice(1) + ' Loan'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatPurpose = (purpose) => {
  if (!purpose) return 'N/A'
  const purposes = {
    seeds: 'Seeds Purchase',
    equipment: 'Equipment Purchase',
    fertilizer: 'Fertilizer & Chemicals',
    irrigation: 'Irrigation System',
    other: 'Other'
  }
  return purposes[purpose] || purpose
}
</script>

<style scoped>
/* Notification highlight animation */
.notification-highlight {
  animation: highlightPulse 2s ease-in-out 3;
  border: 2px solid #ef4444 !important;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3) !important;
  position: relative;
}

.notification-highlight::before {
  content: '🔔 Payment Due';
  position: absolute;
  top: -12px;
  right: 12px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
  z-index: 10;
}

@keyframes highlightPulse {
  0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); }
  50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.5); }
}

.page-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
}

/* Alert messages */
.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.alert-info {
  background-color: #e0f2fe;
  color: #0369a1;
  border-left: 4px solid #0ea5e9;
}

.alert-warning {
  background-color: #fef3c7;
  color: #92400e;
  border-left: 4px solid #f59e0b;
}

/* Help text */
.help-text {
  display: block;
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.85rem;
}

.calculation-text {
  display: block;
  margin-top: 0.5rem;
  color: #059669;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Loan info box */
.loan-info-box {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.loan-info-box h4 {
  color: #0369a1;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.loan-info-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.loan-info-box li {
  padding: 0.4rem 0;
  color: #475569;
  font-size: 0.9rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  border-left: 4px solid;
}

.stat-card.pending {
  border-left-color: #f59e0b;
}

.stat-card.approved {
  border-left-color: #10b981;
}

.stat-card.active {
  border-left-color: #3b82f6;
}

.stat-card.rejected {
  border-left-color: #ef4444;
}

.stat-icon {
  font-size: 2rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

/* Card */
.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.loans-card {
  height: auto;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

/* Loan Form */
.loan-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #475569;
  font-size: 0.875rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.tab {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
  white-space: nowrap;
  font-size: 0.875rem;
}

.tab:hover {
  color: #1e293b;
}

.tab.active {
  color: #3b82f6;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
}

/* Tab Content */
.tab-content {
  min-height: 300px;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 1rem;
}

/* Loans List */
.loans-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loan-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.loan-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.loan-item.pending {
  border-left: 4px solid #f59e0b;
}

.loan-item.approved {
  border-left: 4px solid #10b981;
}

.loan-item.active {
  border-left: 4px solid #3b82f6;
}

.loan-item.rejected {
  border-left: 4px solid #ef4444;
}

.loan-item.completed {
  border-left: 4px solid #8b5cf6;
}

.loan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.loan-id {
  font-weight: 600;
  color: #64748b;
  font-size: 0.875rem;
}

.loan-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: #e2e8f0;
  color: #475569;
}

.loan-body {
  margin-bottom: 1rem;
}

.loan-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
  margin-bottom: 0.75rem;
}

.loan-progress {
  margin: 0.75rem 0;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.75rem;
  color: #64748b;
  text-align: right;
}

.loan-details {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
}

.loan-details p {
  margin: 0.5rem 0;
}

.rejection-reason {
  color: #dc2626;
  font-style: italic;
}

.view-btn {
  width: 100%;
  padding: 0.625rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
}

.view-btn:hover {
  background: #2563eb;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.close-btn:hover {
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.detail-item p {
  font-size: 1rem;
  color: #1e293b;
  margin: 0;
}

.detail-item .amount {
  color: #059669;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.active {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.paid {
  background: #ede9fe;
  color: #6b21a8;
}

.loan-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.edit-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.edit-btn:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tabs {
    flex-wrap: wrap;
  }

  .page-container {
    padding: 1rem;
  }
  
  .loan-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .loan-actions button {
    width: 100%;
  }
}

.payment-history-section {
  margin-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.payment-history-section h4 {
  margin-bottom: 0.75rem;
  color: #2d3748;
}

.payment-history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.payment-history-table th,
.payment-history-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.payment-history-table th {
  background: #f7fafc;
  font-weight: 600;
  color: #4a5568;
}

.payment-history-table .amount {
  color: #2f855a;
  font-weight: 600;
}
</style>
