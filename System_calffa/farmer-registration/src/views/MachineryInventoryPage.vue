<template>
  <div class="machinery-inventory-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">🚜 Machinery Inventory Management</h1>
        <p class="page-subtitle">Manage farm machinery, equipment, and operators</p>
      </div>
      <button @click="showAddMachineryModal = true" class="btn-primary">
        <span class="btn-icon">➕</span>
        Add New Machinery
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card" v-if="stats">
        <div class="stat-icon">🚜</div>
        <div class="stat-content">
          <div class="stat-label">Total Machinery</div>
          <div class="stat-value">{{ totalMachinery }}</div>
        </div>
      </div>
      <div class="stat-card stat-success" v-if="stats">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-label">Available</div>
          <div class="stat-value">{{ availableMachinery }}</div>
        </div>
      </div>
      <div class="stat-card stat-warning" v-if="stats">
        <div class="stat-icon">🔧</div>
        <div class="stat-content">
          <div class="stat-label">Under Maintenance</div>
          <div class="stat-value">{{ maintenanceMachinery }}</div>
        </div>
      </div>
      <div class="stat-card stat-info" v-if="stats">
        <div class="stat-icon">👷</div>
        <div class="stat-content">
          <div class="stat-label">Active Operators</div>
          <div class="stat-value">{{ stats.operators.active_operators || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label class="filter-label">Machinery Type</label>
        <select v-model="filters.machinery_type" @change="applyFilters" class="filter-select">
          <option value="">All Types</option>
          <option value="Harvester">Harvester</option>
          <option value="Dryer">Dryer</option>
          <option value="Hauling Track">Hauling Track</option>
          <option value="Tractor">Tractor</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Status</label>
        <select v-model="filters.status" @change="applyFilters" class="filter-select">
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="In Use">In Use</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Unavailable">Unavailable</option>
        </select>
      </div>
    </div>

    <!-- Machinery Table -->
    <div class="table-container">
      <table class="machinery-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Machinery Name</th>
            <th>Type</th>
            <th>Price</th>
            <th>Max Capacity</th>
            <th>Status</th>
            <th>Operators</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="loading-cell">
              <div class="loading-spinner"></div>
              <span>Loading machinery inventory...</span>
            </td>
          </tr>
          <tr v-else-if="inventory.length === 0">
            <td colspan="8" class="empty-cell">
              No machinery found. Click "Add New Machinery" to get started.
            </td>
          </tr>
          <tr v-else v-for="machine in inventory" :key="machine.id">
            <td>{{ machine.id }}</td>
            <td>
              <div class="machinery-name">
                <strong>{{ machine.machinery_name }}</strong>
                <small v-if="machine.description">{{ machine.description }}</small>
              </div>
            </td>
            <td>
              <span class="badge" :class="'badge-' + getMachineryTypeClass(machine.machinery_type)">
                {{ machine.machinery_type }}
              </span>
            </td>
            <td>
              <div class="price-info">
                <strong>₱{{ formatNumber(machine.price_per_unit) }}</strong>
                <small>{{ machine.unit_type }}</small>
              </div>
            </td>
            <td>
              <span v-if="machine.max_capacity">
                {{ machine.max_capacity }} {{ machine.capacity_unit }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span class="status-badge" :class="'status-' + getStatusClass(machine.status)">
                {{ machine.status }}
              </span>
            </td>
            <td>
              <span class="operators-count">{{ machine.assigned_operators || 0 }}</span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="viewMachinery(machine)" class="btn-icon-small" title="View Details">
                  👁️
                </button>
                <button @click="editMachinery(machine)" class="btn-icon-small" title="Edit">
                  ✏️
                </button>
                <button @click="deleteMachineryConfirm(machine)" class="btn-icon-small btn-danger" title="Delete">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Machinery Modal -->
    <div v-if="showAddMachineryModal || showEditMachineryModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ showEditMachineryModal ? 'Edit Machinery' : 'Add New Machinery' }}</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="showEditMachineryModal ? updateMachinery() : addMachinery()">
            <div class="form-group">
              <label class="form-label">Machinery Name *</label>
              <input
                v-model="machineryForm.machinery_name"
                type="text"
                class="form-input"
                placeholder="e.g., Harvester Unit 1"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Machinery Type *</label>
              <select v-model="machineryForm.machinery_type" class="form-input" required @change="updatePriceDefaults">
                <option value="">Select Type</option>
                <option value="Harvester">Harvester</option>
                <option value="Dryer">Dryer</option>
                <option value="Hauling Track">Hauling Track</option>
                <option value="Tractor">Tractor</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="machineryForm.description"
                class="form-input"
                rows="3"
                placeholder="Enter machinery description"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Price per Unit *</label>
                <input
                  v-model.number="machineryForm.price_per_unit"
                  type="number"
                  step="0.01"
                  class="form-input"
                  placeholder="0.00"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label">Unit Type *</label>
                <input
                  v-model="machineryForm.unit_type"
                  type="text"
                  class="form-input"
                  placeholder="e.g., per hectare"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Max Capacity (Optional)</label>
                <input
                  v-model.number="machineryForm.max_capacity"
                  type="number"
                  step="0.01"
                  class="form-input"
                  placeholder="e.g., 3.00"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Capacity Unit</label>
                <input
                  v-model="machineryForm.capacity_unit"
                  type="text"
                  class="form-input"
                  placeholder="e.g., hectares"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Status *</label>
              <select v-model="machineryForm.status" class="form-input" required>
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            <div class="pricing-guide" v-if="machineryForm.machinery_type">
              <h4>📋 Pricing Guide for {{ machineryForm.machinery_type }}</h4>
              <div class="guide-content">
                <p v-if="machineryForm.machinery_type === 'Harvester'">
                  <strong>Default:</strong> ₱5,000 per hectare (Max 3 hectares per day)
                </p>
                <p v-else-if="machineryForm.machinery_type === 'Dryer'">
                  <strong>Default:</strong> ₱7,500 per load (100 kaban per load)
                </p>
                <p v-else-if="machineryForm.machinery_type === 'Hauling Track'">
                  <strong>Default:</strong> ₱25 per kaban
                </p>
                <p v-else-if="machineryForm.machinery_type === 'Tractor'">
                  <strong>Default:</strong> ₱2,500 per hectare
                </p>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModals" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="loading">
                {{ loading ? 'Saving...' : (showEditMachineryModal ? 'Update' : 'Add') }} Machinery
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Machinery Modal -->
    <div v-if="showViewMachineryModal && selectedMachinery" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>🚜 {{ selectedMachinery.machinery_name }}</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="details-grid">
            <div class="detail-item">
              <label>Type:</label>
              <span class="badge" :class="'badge-' + getMachineryTypeClass(selectedMachinery.machinery_type)">
                {{ selectedMachinery.machinery_type }}
              </span>
            </div>
            <div class="detail-item">
              <label>Status:</label>
              <span class="status-badge" :class="'status-' + getStatusClass(selectedMachinery.status)">
                {{ selectedMachinery.status }}
              </span>
            </div>
            <div class="detail-item">
              <label>Price:</label>
              <span>₱{{ formatNumber(selectedMachinery.price_per_unit) }} {{ selectedMachinery.unit_type }}</span>
            </div>
            <div class="detail-item" v-if="selectedMachinery.max_capacity">
              <label>Max Capacity:</label>
              <span>{{ selectedMachinery.max_capacity }} {{ selectedMachinery.capacity_unit }} per day</span>
            </div>
            <div class="detail-item full-width" v-if="selectedMachinery.description">
              <label>Description:</label>
              <p>{{ selectedMachinery.description }}</p>
            </div>
          </div>

          <div class="operators-section" v-if="selectedMachinery.operators">
            <h3>👷 Assigned Operators ({{ selectedMachinery.operators.length }})</h3>
            <div v-if="selectedMachinery.operators.length === 0" class="empty-state">
              No operators assigned yet.
            </div>
            <div v-else class="operators-list">
              <div v-for="operator in selectedMachinery.operators" :key="operator.id" class="operator-card">
                <div class="operator-info">
                  <strong>{{ operator.operator_name }}</strong>
                  <small>{{ operator.reference_number }}</small>
                </div>
                <div class="operator-date">
                  Assigned: {{ formatDate(operator.assigned_date) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h2>⚠️ Confirm Delete</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ machineryToDelete?.machinery_name }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
          <div class="modal-actions">
            <button @click="closeModals" class="btn-secondary">Cancel</button>
            <button @click="deleteMachinery" class="btn-danger" :disabled="loading">
              {{ loading ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="error" class="alert alert-error">
      {{ error }}
      <button @click="clearError" class="alert-close">✕</button>
    </div>
    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
      <button @click="successMessage = ''" class="alert-close">✕</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useMachineryStore } from '../stores/machineryStore'
import { useAuthStore } from '../stores/authStore'

export default {
  name: 'MachineryInventoryPage',
  setup() {
    const machineryStore = useMachineryStore()
    const authStore = useAuthStore()

    // State
    const showAddMachineryModal = ref(false)
    const showEditMachineryModal = ref(false)
    const showViewMachineryModal = ref(false)
    const showDeleteModal = ref(false)
    const machineryToDelete = ref(null)
    const successMessage = ref('')
    const filters = ref({
      machinery_type: '',
      status: ''
    })

    const machineryForm = ref({
      machinery_name: '',
      machinery_type: '',
      description: '',
      price_per_unit: 0,
      unit_type: '',
      max_capacity: null,
      capacity_unit: '',
      status: 'Available',
      created_by: null
    })

    // Computed
    const inventory = computed(() => machineryStore.inventory)
    const loading = computed(() => machineryStore.loading)
    const error = computed(() => machineryStore.error)
    const stats = computed(() => machineryStore.stats)
    const selectedMachinery = computed(() => machineryStore.selectedMachinery)

    const totalMachinery = computed(() => {
      if (!stats.value?.machinery) return 0
      return stats.value.machinery.reduce((sum, m) => sum + parseInt(m.total), 0)
    })

    const availableMachinery = computed(() => {
      if (!stats.value?.machinery) return 0
      return stats.value.machinery.reduce((sum, m) => sum + parseInt(m.available), 0)
    })

    const maintenanceMachinery = computed(() => {
      if (!stats.value?.machinery) return 0
      return stats.value.machinery.reduce((sum, m) => sum + parseInt(m.maintenance), 0)
    })

    // Methods
    const loadData = async () => {
      try {
        await Promise.all([
          machineryStore.fetchInventory(filters.value),
          machineryStore.fetchStats()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    const applyFilters = () => {
      machineryStore.fetchInventory(filters.value)
    }

    const updatePriceDefaults = () => {
      const type = machineryForm.value.machinery_type
      switch (type) {
        case 'Harvester':
          machineryForm.value.price_per_unit = 5000
          machineryForm.value.unit_type = 'per hectare'
          machineryForm.value.max_capacity = 3
          machineryForm.value.capacity_unit = 'hectares'
          break
        case 'Dryer':
          machineryForm.value.price_per_unit = 7500
          machineryForm.value.unit_type = 'per load'
          machineryForm.value.max_capacity = 100
          machineryForm.value.capacity_unit = 'kabans'
          break
        case 'Hauling Track':
          machineryForm.value.price_per_unit = 25
          machineryForm.value.unit_type = 'per kaban'
          machineryForm.value.max_capacity = null
          machineryForm.value.capacity_unit = 'kabans'
          break
        case 'Tractor':
          machineryForm.value.price_per_unit = 2500
          machineryForm.value.unit_type = 'per hectare'
          machineryForm.value.max_capacity = null
          machineryForm.value.capacity_unit = 'hectares'
          break
      }
    }

    const addMachinery = async () => {
      try {
        machineryForm.value.created_by = authStore.user?.id
        await machineryStore.addMachinery(machineryForm.value)
        successMessage.value = 'Machinery added successfully!'
        closeModals()
        resetForm()
      } catch (error) {
        console.error('Error adding machinery:', error)
      }
    }

    const editMachinery = (machine) => {
      machineryForm.value = { ...machine }
      showEditMachineryModal.value = true
    }

    const updateMachinery = async () => {
      try {
        await machineryStore.updateMachinery(machineryForm.value.id, machineryForm.value)
        successMessage.value = 'Machinery updated successfully!'
        closeModals()
        resetForm()
      } catch (error) {
        console.error('Error updating machinery:', error)
      }
    }

    const viewMachinery = async (machine) => {
      try {
        await machineryStore.getMachineryDetails(machine.id)
        showViewMachineryModal.value = true
      } catch (error) {
        console.error('Error viewing machinery:', error)
      }
    }

    const deleteMachineryConfirm = (machine) => {
      machineryToDelete.value = machine
      showDeleteModal.value = true
    }

    const deleteMachinery = async () => {
      try {
        await machineryStore.deleteMachinery(machineryToDelete.value.id)
        successMessage.value = 'Machinery deleted successfully!'
        closeModals()
      } catch (error) {
        console.error('Error deleting machinery:', error)
      }
    }

    const closeModals = () => {
      showAddMachineryModal.value = false
      showEditMachineryModal.value = false
      showViewMachineryModal.value = false
      showDeleteModal.value = false
      machineryToDelete.value = null
      machineryStore.clearSelection()
    }

    const resetForm = () => {
      machineryForm.value = {
        machinery_name: '',
        machinery_type: '',
        description: '',
        price_per_unit: 0,
        unit_type: '',
        max_capacity: null,
        capacity_unit: '',
        status: 'Available',
        created_by: null
      }
    }

    const clearError = () => {
      machineryStore.clearError()
    }

    const getMachineryTypeClass = (type) => {
      const classes = {
        'Harvester': 'primary',
        'Dryer': 'warning',
        'Hauling Track': 'info',
        'Tractor': 'success'
      }
      return classes[type] || 'default'
    }

    const getStatusClass = (status) => {
      const classes = {
        'Available': 'success',
        'In Use': 'info',
        'Under Maintenance': 'warning',
        'Unavailable': 'danger'
      }
      return classes[status] || 'default'
    }

    const formatNumber = (num) => {
      return new Intl.NumberFormat('en-PH').format(num)
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    // Lifecycle
    onMounted(() => {
      loadData()
    })

    return {
      // State
      showAddMachineryModal,
      showEditMachineryModal,
      showViewMachineryModal,
      showDeleteModal,
      machineryToDelete,
      successMessage,
      filters,
      machineryForm,
      // Computed
      inventory,
      loading,
      error,
      stats,
      selectedMachinery,
      totalMachinery,
      availableMachinery,
      maintenanceMachinery,
      // Methods
      applyFilters,
      updatePriceDefaults,
      addMachinery,
      editMachinery,
      updateMachinery,
      viewMachinery,
      deleteMachineryConfirm,
      deleteMachinery,
      closeModals,
      clearError,
      getMachineryTypeClass,
      getStatusClass,
      formatNumber,
      formatDate
    }
  }
}
</script>

<style scoped>
.machinery-inventory-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #1a1a1a;
  margin: 0;
}

.page-subtitle {
  color: #666;
  margin: 4px 0 0 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 36px;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1a1a1a;
}

.stat-success { border-left: 4px solid #10b981; }
.stat-warning { border-left: 4px solid #f59e0b; }
.stat-info { border-left: 4px solid #3b82f6; }

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.filter-select, .form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.machinery-table {
  width: 100%;
  border-collapse: collapse;
}

.machinery-table thead {
  background: #f8f9fa;
}

.machinery-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e5e7eb;
}

.machinery-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.machinery-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.machinery-name small {
  color: #666;
  font-size: 12px;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-info small {
  color: #666;
  font-size: 11px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge-primary { background: #dbeafe; color: #1e40af; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-info { background: #e0e7ff; color: #3730a3; }
.badge-success { background: #d1fae5; color: #065f46; }

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-success { background: #d1fae5; color: #065f46; }
.status-info { background: #dbeafe; color: #1e40af; }
.status-warning { background: #fef3c7; color: #92400e; }
.status-danger { background: #fee2e2; color: #991b1b; }

.operators-count {
  font-weight: 600;
  color: #3b82f6;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon-small {
  padding: 6px 10px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-small:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.btn-icon-small.btn-danger:hover {
  background: #fee2e2;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
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
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-large {
  max-width: 800px;
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  color: #1a1a1a;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pricing-guide {
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
}

.pricing-guide h4 {
  margin: 0 0 12px 0;
  color: #1e40af;
  font-size: 16px;
}

.pricing-guide p {
  margin: 8px 0;
  color: #1e3a8a;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.operators-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.operators-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.operators-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operator-card {
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operator-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.operator-info small {
  color: #666;
  font-size: 12px;
}

.operator-date {
  color: #666;
  font-size: 13px;
}

.loading-cell, .empty-cell {
  text-align: center;
  padding: 40px !important;
  color: #666;
}

.loading-spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.alert {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 2000;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border-left: 4px solid #ef4444;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border-left: 4px solid #10b981;
}

.alert-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}

.alert-close:hover {
  opacity: 1;
}

.text-muted {
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #666;
}

.warning-text {
  color: #dc2626;
  font-size: 14px;
  margin-top: 8px;
}
</style>
