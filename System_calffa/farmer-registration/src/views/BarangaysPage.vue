<template>
  <div class="barangays-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">🏘️ Barangay Management</h1>
        <p class="page-subtitle">Manage barangays and land areas</p>
      </div>
      <button @click="openAddModal" class="btn-primary">
        <span class="btn-icon">➕</span>
        Add Barangay
      </button>
    </div>

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card stat-primary">
        <div class="stat-icon">🏘️</div>
        <div class="stat-content">
          <div class="stat-label">Total Barangays</div>
          <div class="stat-value">{{ totalBarangays }}</div>
        </div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-icon">✓</div>
        <div class="stat-content">
          <div class="stat-label">Active Barangays</div>
          <div class="stat-value">{{ activeBarangays }}</div>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="search-section">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search barangays..."
          class="search-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select v-model="sortBy" class="filter-select">
          <option value="name">Sort by Name</option>
          <option value="area">Sort by Area</option>
        </select>
      </div>
    </div>

    <!-- Barangays Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Barangay Name</th>
            <th>Total Area (Hectares)</th>
            <th>Farmers</th>
            <th>Officers</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredBarangays.length === 0">
            <td colspan="7" class="text-center">
              No barangays found
            </td>
          </tr>
          <tr v-for="(barangay, index) in filteredBarangays" :key="barangay.id">
            <td>{{ index + 1 }}</td>
            <td class="font-semibold barangay-name-link" @click="viewBarangayDetails(barangay)">
              {{ barangay.name }}
            </td>
            <td>{{ barangay.total_area || '0' }} ha</td>
            <td class="text-center">{{ barangay.total_farmers || 0 }}</td>
            <td class="text-center">{{ barangay.total_officers || 0 }}</td>
            <td>
              <span :class="['status-badge', barangay.status]">
                {{ barangay.status }}
              </span>
            </td>
            <td class="actions-cell">
              <button @click="openEditModal(barangay)" class="btn-icon-sm btn-edit" title="Edit">
                ✏️
              </button>
              <button @click="deleteBarangay(barangay)" class="btn-icon-sm btn-delete" title="Delete">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingBarangay ? '✏️ Edit Barangay' : '➕ Add New Barangay' }}</h2>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Barangay Name *</label>
            <input 
              v-model="formData.name" 
              type="text" 
              class="form-input"
              placeholder="Enter barangay name"
              required
            />
          </div>
          <div class="form-group">
            <label>Total Area (Hectares) *</label>
            <input 
              v-model="formData.total_area" 
              type="number" 
              step="0.01"
              class="form-input"
              placeholder="0.00"
              required
            />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="formData.status" class="form-input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Cancel</button>
          <button @click="saveBarangay" class="btn-primary">
            {{ editingBarangay ? '💾 Update' : '➕ Add' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Barangay Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h2>🏘️ {{ selectedBarangay?.name }}</h2>
          <button @click="closeDetailsModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <!-- Search Bar -->
          <div class="modal-search-bar">
            <span class="search-icon">🔍</span>
            <input 
              v-model="memberSearchQuery" 
              type="text" 
              placeholder="Search by name or reference number..."
              class="search-input"
            />
          </div>

          <div class="details-tabs">
            <button 
              @click="activeTab = 'officers'" 
              :class="['tab-btn', { active: activeTab === 'officers' }]"
            >
              👔 Officers ({{ filteredOfficers.length }})
            </button>
            <button 
              @click="activeTab = 'farmers'" 
              :class="['tab-btn', { active: activeTab === 'farmers' }]"
            >
              👨‍🌾 Farmers ({{ filteredFarmers.length }})
            </button>
          </div>

          <div class="tab-content">
            <!-- Officers Tab -->
            <div v-if="activeTab === 'officers'">
              <div v-if="officers.length === 0" class="empty-state">
                No officers assigned to this barangay yet.
              </div>
              <div v-else-if="filteredOfficers.length === 0" class="empty-state">
                No officers found matching "{{ memberSearchQuery }}".
              </div>
              <table v-else class="members-table">
                <thead>
                  <tr>
                    <th>Reference #</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Phone Number</th>
                    <th>Registered On</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="officer in filteredOfficers" :key="officer.id">
                    <td>{{ officer.reference_number }}</td>
                    <td class="font-semibold">{{ officer.full_name }}</td>
                    <td>
                      <span class="role-badge" :class="officer.role">
                        {{ officer.role }}
                      </span>
                    </td>
                    <td>{{ officer.phone_number }}</td>
                    <td>{{ formatDate(officer.registered_on) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Farmers Tab -->
            <div v-if="activeTab === 'farmers'">
              <div v-if="farmers.length === 0" class="empty-state">
                No farmers registered from this barangay yet.
              </div>
              <div v-else-if="filteredFarmers.length === 0" class="empty-state">
                No farmers found matching "{{ memberSearchQuery }}".
              </div>
              <table v-else class="members-table">
                <thead>
                  <tr>
                    <th>Reference #</th>
                    <th>Full Name</th>
                    <th>Phone Number</th>
                    <th>Registered On</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="farmer in filteredFarmers" :key="farmer.id">
                    <td>{{ farmer.reference_number }}</td>
                    <td class="font-semibold">{{ farmer.full_name }}</td>
                    <td>{{ farmer.phone_number }}</td>
                    <td>{{ formatDate(farmer.registered_on) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailsModal" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFarmerStore } from '../stores/farmerStore'

const farmerStore = useFarmerStore()
const isAdmin = computed(() => farmerStore.role === 'admin')

const barangays = ref([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('name')

const showModal = ref(false)
const editingBarangay = ref(null)
const formData = ref({
  name: '',
  total_area: '',
  status: 'active'
})

const showDetailsModal = ref(false)
const selectedBarangay = ref(null)
const activeTab = ref('officers')
const farmers = ref([])
const officers = ref([])
const memberSearchQuery = ref('')

const totalBarangays = computed(() => barangays.value.length)
const activeBarangays = computed(() => barangays.value.filter(b => b.status === 'active').length)

const filteredOfficers = computed(() => {
  if (!memberSearchQuery.value) return officers.value
  
  const query = memberSearchQuery.value.toLowerCase()
  return officers.value.filter(officer => 
    officer.full_name.toLowerCase().includes(query) ||
    officer.reference_number.toLowerCase().includes(query)
  )
})

const filteredFarmers = computed(() => {
  if (!memberSearchQuery.value) return farmers.value
  
  const query = memberSearchQuery.value.toLowerCase()
  return farmers.value.filter(farmer => 
    farmer.full_name.toLowerCase().includes(query) ||
    farmer.reference_number.toLowerCase().includes(query)
  )
})

const filteredBarangays = computed(() => {
  let filtered = barangays.value

  // Search filter
  if (searchQuery.value) {
    filtered = filtered.filter(b => 
      b.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(b => b.status === statusFilter.value)
  }

  // Sort
  if (sortBy.value === 'name') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'area') {
    filtered = [...filtered].sort((a, b) => (b.total_area || 0) - (a.total_area || 0))
  }

  return filtered
})

const fetchBarangays = async () => {
  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/barangays')
    const data = await response.json()
    if (data.success) {
      barangays.value = data.barangays
    }
  } catch (error) {
    console.error('Error fetching barangays:', error)
    alert('Failed to load barangays')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingBarangay.value = null
  formData.value = {
    name: '',
    total_area: '',
    status: 'active'
  }
  showModal.value = true
}

const openEditModal = (barangay) => {
  editingBarangay.value = barangay
  formData.value = {
    name: barangay.name,
    total_area: barangay.total_area || '',
    status: barangay.status
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingBarangay.value = null
  formData.value = {
    name: '',
    total_area: '',
    status: 'active'
  }
}

const saveBarangay = async () => {
  if (!formData.value.name || formData.value.total_area === '') {
    alert('Please fill in all required fields')
    return
  }

  try {
    const url = editingBarangay.value 
      ? `http://localhost:3000/api/barangays/${editingBarangay.value.id}`
      : 'http://localhost:3000/api/barangays'
    
    const method = editingBarangay.value ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value)
    })

    const data = await response.json()
    
    if (data.success) {
      alert(editingBarangay.value ? 'Barangay updated successfully!' : 'Barangay added successfully!')
      closeModal()
      fetchBarangays()
    } else {
      alert(data.message || 'Operation failed')
    }
  } catch (error) {
    console.error('Error saving barangay:', error)
    alert('Failed to save barangay')
  }
}

const deleteBarangay = async (barangay) => {
  if (!confirm(`Are you sure you want to delete ${barangay.name}?`)) {
    return
  }

  try {
    const response = await fetch(`http://localhost:3000/api/barangays/${barangay.id}`, {
      method: 'DELETE'
    })

    const data = await response.json()
    
    if (data.success) {
      alert('Barangay deleted successfully!')
      fetchBarangays()
    } else {
      alert(data.message || 'Failed to delete barangay')
    }
  } catch (error) {
    console.error('Error deleting barangay:', error)
    alert('Failed to delete barangay')
  }
}

const viewBarangayDetails = async (barangay) => {
  selectedBarangay.value = barangay
  activeTab.value = 'officers'
  showDetailsModal.value = true
  
  try {
    const response = await fetch(`http://localhost:3000/api/barangays/${barangay.id}`)
    const data = await response.json()
    
    if (data.success) {
      farmers.value = data.farmers || []
      officers.value = data.officers || []
    }
  } catch (error) {
    console.error('Error fetching barangay details:', error)
    alert('Failed to load barangay details')
  }
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedBarangay.value = null
  farmers.value = []
  officers.value = []
  memberSearchQuery.value = ''
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => {
  fetchBarangays()
})
</script>

<style scoped>
.barangays-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f3f4f6;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-bar {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #10b981;
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f9fafb;
}

.data-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 14px;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #1f2937;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.text-center {
  text-align: center;
}

.font-semibold {
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-icon-sm {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-edit {
  background: #dbeafe;
  color: #1e40af;
}

.btn-edit:hover {
  background: #bfdbfe;
}

.btn-delete {
  background: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background: #fecaca;
}

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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #10b981;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.barangay-name-link {
  cursor: pointer;
  color: #2563eb;
  transition: all 0.2s;
}

.barangay-name-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.modal-large {
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-search-bar {
  position: relative;
  margin-bottom: 20px;
}

.modal-search-bar .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #9ca3af;
}

.modal-search-bar .search-input {
  width: 100%;
  padding: 10px 10px 10px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.modal-search-bar .search-input:focus {
  outline: none;
  border-color: #10b981;
}

.details-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.tab-btn {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #1f2937;
  background: #f9fafb;
}

.tab-btn.active {
  color: #10b981;
  border-bottom-color: #10b981;
}

.tab-content {
  margin-top: 20px;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
}

.members-table thead {
  background: #f9fafb;
}

.members-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 13px;
}

.members-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #1f2937;
}

.members-table tbody tr:hover {
  background: #f9fafb;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.role-badge.president {
  background: #e0e7ff;
  color: #4338ca;
}

.role-badge.treasurer {
  background: #fce7f3;
  color: #9f1239;
}

.role-badge.auditor {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.operator {
  background: #e0f2fe;
  color: #075985;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-size: 14px;
}
</style>
