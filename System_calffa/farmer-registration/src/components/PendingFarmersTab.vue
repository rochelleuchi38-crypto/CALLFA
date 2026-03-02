<template>
  <div class="section-card">
    <div class="section-header-with-actions">
      <h2 class="section-title">⏳ Pending Member Approvals</h2>
      <div v-if="filteredFarmers.length > 0" class="bulk-actions">
        <button @click="approveAllPending" class="bulk-approve-btn" :disabled="processingBulk">
          <span v-if="!processingBulk">✓ Approve All ({{ filteredFarmers.length }})</span>
          <span v-else>Processing...</span>
        </button>
        <button @click="$emit('refresh')" class="refresh-btn" :disabled="loading">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name, reference number, or phone..."
        class="search-input"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading pending members...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('refresh')" class="retry-btn">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredFarmers.length === 0" class="empty-state">
      <p>✓ No pending members to approve.</p>
      <p class="text-sm text-gray-500 mt-2">If you expect pending accounts, verify that:</p>
      <ul class="text-xs text-gray-400 mt-1">
        <li>- You are logged in as an admin account</li>
        <li>- The backend server is running (http://localhost:5000)</li>
        <li>- New users have status set to <code>pending</code> in the database</li>
      </ul>
    </div>

    <!-- Pending Members Table -->
    <div v-else class="members-table">
      <table>
        <thead>
          <tr>
            <th>Reference Number</th>
            <th>Full Name</th>
            <th>Date of Birth</th>
            <th>Phone Number</th>
            <th>Education</th>
            <th>Role</th>
            <th>Barangay</th>
            <th>Registered Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in filteredFarmers" :key="member.id">
            <td>{{ member.reference_number }}</td>
            <td>{{ member.full_name }}</td>
            <td>{{ formatDate(member.date_of_birth) }}</td>
            <td>{{ member.phone_number }}</td>
            <td>{{ member.educational_status || 'N/A' }}</td>
            <td>
              <select 
                :value="member.role" 
                @change="updateRole(member.id, $event.target.value)"
                class="role-select"
                :disabled="processingId === member.id"
              >
                <option value="farmer">👨‍🌾 Farmer</option>
                <option value="president">👔 President</option>
                <option value="treasurer">💰 Treasurer</option>
                <option value="auditor">📊 Auditor</option>
                <option value="operator">⚙️ Operator</option>
                <option value="operation_manager">🛠️ Operation Manager</option>
                <option value="business_manager">💼 Business Manager</option>
                <option value="agriculturist">🌱 Agriculturist</option>
                <option value="admin">👨‍💼 Admin</option>
              </select>
            </td>
            <td>{{ member.barangay_name || 'Not assigned' }}</td>
            <td>{{ formatDate(member.registered_on) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  @click="approveMember(member.id)"
                  class="approve-btn"
                  :disabled="processingId === member.id || member.role === 'admin'"
                >
                  {{ processingId === member.id ? 'Processing...' : '✓ Approve' }}
                </button>
                <button
                  @click="rejectMember(member.id)"
                  class="reject-btn"
                  :disabled="processingId === member.id || member.role === 'admin'"
                >
                  ✗ Reject
                </button>
                <button
                  @click="deleteMember(member.id)"
                  class="delete-btn"
                  :disabled="processingId === member.id || member.role === 'admin'"
                >
                  🗑️ Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message-banner">
      <span class="success-icon">✓</span>
      <span class="success-text">{{ successMessage }}</span>
      <button @click="successMessage = ''" class="close-success">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'

const emit = defineEmits(['approve', 'reject', 'delete', 'refresh', 'update-role'])
const authStore = useAuthStore()

const props = defineProps({
  farmers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
})

const searchQuery = ref('')
const processingId = ref(null)
const processingBulk = ref(false)
const successMessage = ref('')

const filteredFarmers = computed(() => {
  const farmerList = props.farmers || []
  if (!searchQuery.value) return farmerList

  const query = searchQuery.value.toLowerCase()
  return farmerList.filter(farmer =>
    farmer.full_name?.toLowerCase().includes(query) ||
    farmer.reference_number?.toLowerCase().includes(query) ||
    farmer.phone_number?.includes(query)
  )
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const approveMember = async (memberId) => {
  if (!confirm('Are you sure you want to approve this member? They will be able to login after approval.')) {
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    emit('approve', memberId)
    
    const member = props.farmers.find(m => m.id === memberId)
    successMessage.value = `Member "${member?.full_name || memberId}" approved successfully! They can now login.`
    
    setTimeout(() => {
      successMessage.value = ''
      processingId.value = null
    }, 3000)
  } catch (err) {
    processingId.value = null
    alert('Error approving member: ' + err.message)
  }
}

const rejectMember = async (memberId) => {
  if (!confirm('Are you sure you want to reject this member?')) {
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    emit('reject', memberId)
    
    const member = props.farmers.find(m => m.id === memberId)
    successMessage.value = `Member "${member?.full_name || memberId}" has been rejected.`
    
    setTimeout(() => {
      successMessage.value = ''
      processingId.value = null
    }, 3000)
  } catch (err) {
    processingId.value = null
    alert('Error rejecting member: ' + err.message)
  }
}

const deleteMember = async (memberId) => {
  if (!confirm('Are you sure you want to permanently delete this member? This action cannot be undone.')) {
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    emit('delete', memberId)
    
    successMessage.value = 'Member deleted successfully.'
    
    setTimeout(() => {
      successMessage.value = ''
      processingId.value = null
    }, 3000)
  } catch (err) {
    processingId.value = null
    alert('Error deleting member: ' + err.message)
  }
}

const updateRole = async (memberId, newRole) => {
  if (!confirm(`Are you sure you want to change this account role to "${newRole.toUpperCase()}"?`)) {
    emit('refresh') // Refresh to reset the dropdown
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    emit('update-role', { memberId, newRole })
    
    successMessage.value = `Role updated to ${newRole} successfully!`
    
    setTimeout(() => {
      successMessage.value = ''
      processingId.value = null
    }, 2000)
  } catch (err) {
    processingId.value = null
    emit('refresh') // Refresh to reset on error
    alert('Error updating role: ' + err.message)
  }
}

const approveAllPending = async () => {
  if (filteredFarmers.value.length === 0) {
    return
  }

  if (!confirm(`Are you sure you want to approve all ${filteredFarmers.value.length} pending members?`)) {
    return
  }

  processingBulk.value = true
  successMessage.value = ''

  try {
    // Emit approve for each member
    for (const member of filteredFarmers.value) {
      emit('approve', member.id)
    }
    
    successMessage.value = `Successfully processing ${filteredFarmers.value.length} member(s) for approval!`
    
    setTimeout(() => {
      successMessage.value = ''
      processingBulk.value = false
      emit('refresh')
    }, 2000)
  } catch (err) {
    processingBulk.value = false
    alert('Error approving members: ' + err.message)
  }
}
</script>

<style scoped>
.section-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.section-header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.bulk-actions {
  display: flex;
  gap: 12px;
}

.bulk-approve-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.bulk-approve-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.bulk-approve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn {
  padding: 10px 20px;
  background: white;
  color: #059669;
  border: 2px solid #059669;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #059669;
  color: white;
}

.search-container {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: #ef4444;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 24px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.members-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead tr {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.2s;
}

tbody tr:hover {
  background: #f9fafb;
}

td {
  padding: 16px;
  color: #1f2937;
  font-size: 14px;
}

.role-select {
  padding: 6px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: capitalize;
}

.role-select:hover:not(:disabled) {
  border-color: #10b981;
}

.role-select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.role-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f3f4f6;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.approve-btn,
.reject-btn,
.delete-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn {
  background: #d1fae5;
  color: #065f46;
}

.approve-btn:hover:not(:disabled) {
  background: #10b981;
  color: white;
}

.reject-btn {
  background: #fee2e2;
  color: #991b1b;
}

.reject-btn:hover:not(:disabled) {
  background: #ef4444;
  color: white;
}

.delete-btn {
  background: #fef3c7;
  color: #92400e;
}

.delete-btn:hover:not(:disabled) {
  background: #f59e0b;
  color: white;
}

.approve-btn:disabled,
.reject-btn:disabled,
.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-message-banner {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.success-icon {
  font-size: 20px;
}

.success-text {
  font-weight: 600;
}

.close-success {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-success:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .section-header-with-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .bulk-actions {
    width: 100%;
    flex-direction: column;
  }

  .bulk-approve-btn,
  .refresh-btn {
    width: 100%;
  }

  .members-table {
    font-size: 12px;
  }

  th, td {
    padding: 8px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .approve-btn,
  .reject-btn,
  .delete-btn {
    width: 100%;
  }

  .success-message-banner {
    left: 20px;
    right: 20px;
  }
}
</style>
