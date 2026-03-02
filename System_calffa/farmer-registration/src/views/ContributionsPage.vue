<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">💳 Contributions</h1>
      <p class="page-subtitle">View and manage your contributions and membership details</p>
    </div>

    <div class="content-grid">
      <!-- Contribution Summary -->
      <div class="card">
        <h2 class="card-title">Contribution Summary</h2>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-label">Total Contributions</div>
            <div class="stat-value">P{{ totalContributions.toLocaleString() }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">This Month</div>
            <div class="stat-value">P{{ monthlyContribution.toLocaleString() }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Next Payment</div>
            <div class="stat-value">{{ nextPaymentDate }}</div>
          </div>
        </div>
      </div>

      <!-- Make Contribution -->
      <div class="card">
        <h2 class="card-title">Make Contribution</h2>
        <form @submit.prevent="submitContribution" class="contribution-form">
          <div class="form-group">
            <label>Amount</label>
            <input
              type="number"
              v-model="contributionForm.amount"
              placeholder="Enter amount"
              required
              min="100"
              step="100"
            />
          </div>
          <div class="form-group">
            <label>Payment Method</label>
            <select v-model="contributionForm.method" required>
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="gcash">GCash</option>
              <option value="paymaya">PayMaya</option>
            </select>
          </div>
          <button type="submit" class="submit-btn">Submit Contribution</button>
        </form>
      </div>

      <!-- Contribution History -->
      <div class="card full-width">
        <h2 class="card-title">Contribution History</h2>
        <div class="table-container">
          <table class="contributions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contribution in contributions" :key="contribution.id">
                <td>{{ formatDate(contribution.date) }}</td>
                <td>P{{ contribution.amount.toLocaleString() }}</td>
                <td>{{ contribution.method }}</td>
                <td>
                  <span class="status-badge" :class="contribution.status">
                    {{ contribution.status }}
                  </span>
                </td>
                <td>
                  <button class="receipt-btn" @click="viewReceipt(contribution.id)">
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const contributionForm = ref({
  amount: '',
  method: ''
})

const contributions = ref([
  {
    id: 1,
    date: new Date('2024-12-01'),
    amount: 500,
    method: 'GCash',
    status: 'completed'
  },
  {
    id: 2,
    date: new Date('2024-11-01'),
    amount: 500,
    method: 'Cash',
    status: 'completed'
  },
  {
    id: 3,
    date: new Date('2024-10-01'),
    amount: 500,
    method: 'Bank Transfer',
    status: 'completed'
  }
])

const totalContributions = computed(() => {
  return contributions.value.reduce((sum, c) => sum + c.amount, 0)
})

const monthlyContribution = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  return contributions.value
    .filter(c => {
      const date = new Date(c.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, c) => sum + c.amount, 0)
})

const nextPaymentDate = computed(() => {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

const submitContribution = () => {
  alert('Contribution submitted successfully!')
  contributionForm.value = {
    amount: '',
    method: ''
  }
}

const viewReceipt = (id) => {
  alert(`Viewing receipt for contribution #${id}`)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #6b7280;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.card.full-width {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 20px;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.contribution-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #166534;
  box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.1);
}

.submit-btn {
  padding: 12px;
  background: #166534;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #15803d;
}

.table-container {
  overflow-x: auto;
}

.contributions-table {
  width: 100%;
  border-collapse: collapse;
}

.contributions-table thead {
  background: #f9fafb;
}

.contributions-table th {
  padding: 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.contributions-table td {
  padding: 12px;
  font-size: 14px;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.completed {
  background: #d1fae5;
  color: #059669;
}

.receipt-btn {
  padding: 6px 12px;
  background: #166534;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.receipt-btn:hover {
  background: #15803d;
}
</style>
