<template>
  <div class="machinery-management-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">🚜 Machinery Management System</h1>
        <p class="page-subtitle" v-if="isAdminOnly">View machinery inventory across all barangays</p>
        <p class="page-subtitle" v-else-if="isPresidentRole">Manage machinery inventory and monitor bookings for your barangay</p>
        <p class="page-subtitle" v-else>Monitor machinery bookings</p>
      </div>
      <button v-if="isAdminRole" @click="showInventoryModal = true" class="btn-primary">
        <span class="btn-icon">📦</span>
        Machinery Inventory
      </button>
    </div>

    <!-- Stats Overview (Hidden for Admin-Only) -->
    <div v-if="!isAdminOnly" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🚜</div>
        <div class="stat-content">
          <div class="stat-label">Total Machinery</div>
          <div class="stat-value">{{ totalMachinery }}</div>
        </div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-label">Available</div>
          <div class="stat-value">{{ availableMachinery }}</div>
        </div>
      </div>
      <div class="stat-card stat-pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-label">Pending Bookings</div>
          <div class="stat-value">{{ pendingBookingsCount }}</div>
        </div>
      </div>
      <div class="stat-card stat-info">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">₱{{ formatNumber(totalRevenue) }}</div>
        </div>
      </div>
    </div>

    <!-- Admin Inventory View -->
    <div v-if="isAdminOnly" class="section">
      <h2 class="section-title">📦 Machinery Inventory by Barangay</h2>
      
      <!-- Admin Inventory Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select v-model="adminFilters.status" @change="applyAdminFilters" class="filter-select">
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Machinery Type</label>
          <select v-model="adminFilters.machinery_type" @change="applyAdminFilters" class="filter-select">
            <option value="">All Types</option>
            <option v-for="type in distinctMachineryTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Barangay</label>
          <select v-model="adminFilters.barangay_id" @change="applyAdminFilters" class="filter-select">
            <option value="">All Barangays</option>
            <option v-for="barangay in barangays" :key="barangay.id" :value="barangay.id">
              {{ barangay.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Admin Inventory Table -->
      <div class="inventory-table-container">
        <div class="inventory-actions">
          <button @click="showAddMachineryModal = true" class="btn-success">
            ➕ Add New Machinery
          </button>
        </div>
        <table class="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Barangay</th>
              <th>Price</th>
              <th>Max Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="loading-cell">
                <div class="loading-spinner"></div>
                <span>Loading machinery...</span>
              </td>
            </tr>
            <tr v-else-if="filteredInventory.length === 0">
              <td colspan="8" class="empty-cell">No machinery found matching the filters</td>
            </tr>
            <tr v-else v-for="machine in filteredInventory" :key="machine.id">
              <td>{{ machine.id }}</td>
              <td>{{ machine.machinery_name }}</td>
              <td>
                <span class="badge" :class="'badge-' + getMachineryTypeClass(machine.machinery_type)">
                  {{ machine.machinery_type }}
                </span>
              </td>
              <td>
                <span class="barangay-badge">📍 {{ getBarangayName(machine.barangay_id) }}</span>
              </td>
              <td>₱{{ formatNumber(machine.price_per_unit) }} {{ machine.unit_type }}</td>
              <td>
                <span v-if="machine.max_capacity">{{ machine.max_capacity }} {{ machine.capacity_unit }}</span>
                <span v-else>-</span>
              </td>
              <td>
                <span class="status-badge" :class="'status-' + getStatusClass(machine.status)">
                  {{ machine.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="editMachinery(machine)" class="btn-icon-small" title="Edit">✏️</button>
                  <button @click="deleteMachineryConfirm(machine)" class="btn-icon-small btn-danger" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- President's Machinery Inventory Section -->
    <div v-if="isPresidentRole" class="section">
      <h2 class="section-title">🚜 Machinery Inventory ({{ barangays.find(b => b.id === userBarangayId)?.name || 'Your Barangay' }})</h2>
      
      <div class="inventory-actions" style="margin-bottom: 20px;">
        <button @click="showAddMachineryModal = true" class="btn-success">
          ➕ Add Machinery
        </button>
      </div>

      <div v-if="inventory.length === 0" class="empty-state">
        <p>No machinery in your barangay yet</p>
      </div>

      <div v-else class="inventory-table-container">
        <table class="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Price/Unit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="machine in inventory" :key="machine.id">
              <td><strong>{{ machine.machinery_name }}</strong></td>
              <td>
                <span :class="['badge', `badge-${getMachineryTypeClass(machine.machinery_type)}`]">
                  {{ machine.machinery_type }}
                </span>
              </td>
              <td>₱{{ formatNumber(machine.price_per_unit) }}</td>
              <td>
                <span :class="['status-badge', `status-${getStatusClass(machine.status)}`]">
                  {{ machine.status }}
                </span>
              </td>
              <td class="actions-cell">
                <button @click="editMachinery(machine)" class="btn-sm btn-info" title="Edit">
                  ✏️
                </button>
                <button @click="deleteMachineryConfirm(machine)" class="btn-sm btn-danger" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- All Bookings Table -->
    <div v-if="!isAdminOnly" class="section">
      <h2 class="section-title">📋 Machinery Bookings</h2>
      
      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select v-model="filters.status" @change="applyFilters" class="filter-select">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Machinery Type</label>
          <select v-model="filters.machinery_type" @change="applyFilters" class="filter-select">
            <option value="">All Types</option>
            <option v-for="type in distinctMachineryTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
      </div>

      <!-- Bookings Table -->
      <div class="table-container">
        <table class="bookings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Farmer</th>
              <th>Machinery</th>
              <th>Date</th>
              <th>Location</th>
              <th>Area/Qty</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="loading-cell">
                <div class="loading-spinner"></div>
                <span>Loading bookings...</span>
              </td>
            </tr>
            <tr v-else-if="bookings.length === 0">
              <td colspan="9" class="empty-cell">
                No bookings found.
              </td>
            </tr>
            <tr v-else v-for="booking in bookings" :key="booking.id">
              <td>{{ booking.id }}</td>
              <td>
                <div class="farmer-info">
                  <strong>{{ booking.farmer_name }}</strong>
                  <small>{{ booking.reference_number }}</small>
                </div>
              </td>
              <td>
                <div class="machinery-info">
                  <strong>{{ booking.machinery_name }}</strong>
                  <span class="badge" :class="'badge-' + getMachineryTypeClass(booking.machinery_type)">
                    {{ booking.machinery_type }}
                  </span>
                </div>
              </td>
              <td>{{ formatDate(booking.booking_date) }}</td>
              <td>{{ booking.service_location }}</td>
              <td>{{ booking.area_size }} {{ booking.area_unit }}</td>
              <td class="price-cell">₱{{ formatNumber(booking.total_price) }}</td>
              <td>
                <span class="status-badge" :class="'status-' + getBookingStatusClass(booking.status)">
                  {{ booking.status }}
                </span>
              </td>
              <td>
                <button @click="viewBooking(booking)" class="btn-icon-small" title="View Details">
                  👁️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inventory Modal (Hidden for Admin) -->
    <div v-if="showInventoryModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content modal-xlarge">
        <div class="modal-header">
          <h2>📦 Machinery Inventory Management</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="inventory-actions">
            <button @click="showAddMachineryModal = true; showInventoryModal = false" class="btn-success">
              ➕ Add New Machinery
            </button>
          </div>

          <!-- Inventory Table -->
          <div class="inventory-table-container">
            <table class="inventory-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Max Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="inventory.length === 0">
                  <td colspan="7" class="empty-cell">No machinery in inventory</td>
                </tr>
                <tr v-else v-for="machine in inventory" :key="machine.id">
                  <td>{{ machine.id }}</td>
                  <td>{{ machine.machinery_name }}</td>
                  <td>
                    <span class="badge" :class="'badge-' + getMachineryTypeClass(machine.machinery_type)">
                      {{ machine.machinery_type }}
                    </span>
                  </td>
                  <td>₱{{ formatNumber(machine.price_per_unit) }} {{ machine.unit_type }}</td>
                  <td>
                    <span v-if="machine.max_capacity">{{ machine.max_capacity }} {{ machine.capacity_unit }}</span>
                    <span v-else>-</span>
                  </td>
                  <td>
                    <span class="status-badge" :class="'status-' + getStatusClass(machine.status)">
                      {{ machine.status }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button @click="editMachinery(machine)" class="btn-icon-small" title="Edit">✏️</button>
                      <button @click="deleteMachineryConfirm(machine)" class="btn-icon-small btn-danger" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
            <div class="form-group barangay-assignment-group">
              <div class="barangay-warning">
                <span class="warning-icon">⚠️</span>
                <span v-if="isPresidentRole">Machinery assigned to your barangay only</span>
                <span v-else>Barangay Assignment is Required</span>
              </div>
              
              <!-- For Admin: Show dropdown for selection -->
              <template v-if="!isPresidentRole">
                <label class="form-label barangay-label">📍 Assign to Barangay *</label>
                
                <div v-if="barangays.length === 0" class="barangay-loading">
                  <div class="spinner-small"></div>
                  Loading barangays...
                </div>
                
                <select 
                  v-else
                  v-model="machineryForm.barangay_id" 
                  class="form-input barangay-select-emphasized" 
                  required
                  @change="handleBarangayChange">
                  <option value="">-- SELECT A BARANGAY --</option>
                  <option v-for="barangay in barangays" :key="barangay.id" :value="barangay.id">
                    {{ barangay.name }}
                  </option>
                </select>
                
                <div v-if="machineryForm.barangay_id" class="barangay-selected">
                  ✅ Barangay assigned: {{ getBarangayName(machineryForm.barangay_id) }}
                </div>
                
                <small class="form-hint barangay-hint">This machinery will belong to and be managed by the selected barangay only</small>
              </template>

              <!-- For President: Show read-only barangay info -->
              <template v-else>
                <label class="form-label barangay-label">📍 Your Barangay</label>
                <div class="barangay-read-only">
                  <div class="barangay-info">
                    {{ getBarangayName(userBarangayId) }}
                  </div>
                  <small class="form-hint">All machinery will be assigned to your barangay only</small>
                </div>
              </template>
            </div>

            <div class="form-group">
              <label class="form-label">Machinery Name *</label>
              <input v-model="machineryForm.machinery_name" type="text" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">Machinery Type *</label>
              <input v-model="machineryForm.machinery_type" type="text" class="form-input" required placeholder="e.g., Harvester, Dryer, Tractor, etc." />
              <small class="form-hint">Enter any machinery type - not limited to predefined options</small>
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea v-model="machineryForm.description" class="form-input" rows="3"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Price per Unit *</label>
                <input v-model.number="machineryForm.price_per_unit" type="number" step="0.01" min="0.01" class="form-input" required placeholder="e.g., 5000" />
              </div>
              <div class="form-group">
                <label class="form-label">Unit Type *</label>
                <input v-model="machineryForm.unit_type" type="text" class="form-input" required placeholder="e.g., per hectare, per load" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Max Capacity</label>
                <input v-model.number="machineryForm.max_capacity" type="number" step="0.01" min="0" class="form-input" placeholder="Optional" />
              </div>
              <div class="form-group">
                <label class="form-label">Capacity Unit</label>
                <input v-model="machineryForm.capacity_unit" type="text" class="form-input" placeholder="e.g., hectares, loads" />
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

            <div class="modal-actions">
              <button type="button" @click="closeModals" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="loading">
                {{ loading ? 'Saving...' : (showEditMachineryModal ? 'Update' : 'Add') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Booking Modal -->
    <div v-if="showViewBookingModal && selectedBooking" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>📋 Booking Details #{{ selectedBooking.id }}</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="booking-details">
            <div class="detail-section">
              <h3>Farmer Information</h3>
              <div class="details-grid">
                <div class="detail-item"><label>Name:</label><span>{{ selectedBooking.farmer_name }}</span></div>
                <div class="detail-item"><label>Reference:</label><span>{{ selectedBooking.reference_number }}</span></div>
                <div class="detail-item" v-if="selectedBooking.farmer_phone"><label>Phone:</label><span>{{ selectedBooking.farmer_phone }}</span></div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Booking Information</h3>
              <div class="details-grid">
                <div class="detail-item"><label>Machinery:</label><span>{{ selectedBooking.machinery_name }}</span></div>
                <div class="detail-item"><label>Type:</label><span class="badge" :class="'badge-' + getMachineryTypeClass(selectedBooking.machinery_type)">{{ selectedBooking.machinery_type }}</span></div>
                <div class="detail-item"><label>Date:</label><span>{{ formatDate(selectedBooking.booking_date) }}</span></div>
                <div class="detail-item"><label>Location:</label><span>{{ selectedBooking.service_location }}</span></div>
                <div class="detail-item"><label>Area/Quantity:</label><span>{{ selectedBooking.area_size }} {{ selectedBooking.area_unit }}</span></div>
                <div class="detail-item"><label>Total Price:</label><strong class="price-highlight">₱{{ formatNumber(selectedBooking.total_price) }}</strong></div>
                <div class="detail-item"><label>Status:</label><span class="status-badge" :class="'status-' + getBookingStatusClass(selectedBooking.status)">{{ selectedBooking.status }}</span></div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedBooking.approved_by_name">
              <h3>Approval Information</h3>
              <div class="details-grid">
                <div class="detail-item"><label>Approved By:</label><span>{{ selectedBooking.approved_by_name }}</span></div>
                <div class="detail-item" v-if="selectedBooking.approved_date"><label>Date:</label><span>{{ formatDateTime(selectedBooking.approved_date) }}</span></div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedBooking.notes">
              <h3>Notes</h3>
              <p class="notes-text">{{ selectedBooking.notes }}</p>
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
          <p>Delete <strong>{{ machineryToDelete?.machinery_name }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
          <div class="modal-actions">
            <button @click="closeModals" class="btn-secondary">Cancel</button>
            <button @click="deleteMachinery" class="btn-danger" :disabled="loading">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="validationError" class="alert alert-warning">
      {{ validationError }}
      <button @click="validationError = ''" class="alert-close">✕</button>
    </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useMachineryStore } from '../stores/machineryStore'
import { useAuthStore } from '../stores/authStore'

export default {
  name: 'MachineryManagementPage',
  setup() {
    const machineryStore = useMachineryStore()
    const authStore = useAuthStore()

    const showInventoryModal = ref(false)
    const showAddMachineryModal = ref(false)
    const showEditMachineryModal = ref(false)
    const showViewBookingModal = ref(false)
    const showDeleteModal = ref(false)
    const machineryToDelete = ref(null)
    const successMessage = ref('')
    const validationError = ref('')
    const filters = ref({ status: '', machinery_type: '' })

    const machineryForm = ref({
      machinery_name: '', machinery_type: '', description: '',
      price_per_unit: '', unit_type: '', max_capacity: '',
      capacity_unit: '', status: 'Available', created_by: null, barangay_id: ''
    })

    const inventory = computed(() => machineryStore.inventory)
    const bookings = computed(() => machineryStore.bookings)
    const loading = computed(() => machineryStore.loading)
    const error = computed(() => machineryStore.error)
    const stats = computed(() => machineryStore.stats)
    const selectedBooking = computed(() => machineryStore.selectedBooking)
    const distinctMachineryTypes = computed(() => machineryStore.distinctMachineryTypes)
    const barangays = computed(() => machineryStore.barangays)
    const isAdminRole = computed(() => {
      const role = authStore.currentUser?.role
      return role === 'admin' || role === 'president'
    })
    const isAdminOnly = computed(() => authStore.currentUser?.role === 'admin')
    const isPresidentRole = computed(() => authStore.currentUser?.role === 'president')
    const userBarangayId = computed(() => authStore.currentUser?.barangay_id)

    const adminFilters = ref({ status: '', machinery_type: '', barangay_id: '' })

    const filteredInventory = computed(() => {
      if (!inventory.value) return []
      return inventory.value.filter(machine => {
        const statusMatch = !adminFilters.value.status || machine.status === adminFilters.value.status
        const typeMatch = !adminFilters.value.machinery_type || machine.machinery_type === adminFilters.value.machinery_type
        const barangayMatch = !adminFilters.value.barangay_id || machine.barangay_id === parseInt(adminFilters.value.barangay_id)
        return statusMatch && typeMatch && barangayMatch
      })
    })

    const applyAdminFilters = () => {
      // Filters are applied reactively through computed property
    }

    const handleBarangayChange = (event) => {
      // Ensure barangay_id is stored as a number, not a string
      const value = event.target.value
      machineryForm.value.barangay_id = value ? parseInt(value) : ''
      console.log('Barangay selected and converted:', machineryForm.value.barangay_id)
    }

    const totalMachinery = computed(() => {
      if (!inventory.value) return 0
      return inventory.value.length
    })

    const availableMachinery = computed(() => {
      if (!inventory.value) return 0
      return inventory.value.filter(m => m.status === 'Available').length
    })

    const pendingBookingsCount = computed(() => {
      return bookings.value.filter(b => b.status === 'Pending').length
    })

    const totalRevenue = computed(() => {
      if (!bookings.value || bookings.value.length === 0) return 0
      // Sum revenue from completed bookings only
      return bookings.value
        .filter(b => b.status === 'Completed')
        .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0)
    })

    const loadData = async () => {
      try {
        await Promise.all([
          machineryStore.fetchInventory(),
          machineryStore.fetchBookings(filters.value),
          machineryStore.fetchStats(),
          machineryStore.fetchBarangays()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    const applyFilters = () => {
      machineryStore.fetchBookings(filters.value)
    }

    const addMachinery = async () => {
      try {
        // For presidents, automatically use their barangay
        let barangayId = machineryForm.value.barangay_id
        if (isPresidentRole.value) {
          barangayId = userBarangayId.value
        } else {
          // For admins, validate barangay is selected
          if (!machineryForm.value.barangay_id || machineryForm.value.barangay_id === '') {
            validationError.value = '⚠️ Please select a Barangay for this machinery'
            setTimeout(() => validationError.value = '', 5000)
            return
          }
          barangayId = typeof machineryForm.value.barangay_id === 'string' 
            ? parseInt(machineryForm.value.barangay_id) 
            : machineryForm.value.barangay_id
        }
        
        const data = {
          machinery_name: machineryForm.value.machinery_name.trim(),
          machinery_type: machineryForm.value.machinery_type.trim(),
          description: machineryForm.value.description ? machineryForm.value.description.trim() : null,
          price_per_unit: parseFloat(machineryForm.value.price_per_unit) || 0,
          unit_type: machineryForm.value.unit_type.trim(),
          max_capacity: machineryForm.value.max_capacity && machineryForm.value.max_capacity !== '' 
            ? parseFloat(machineryForm.value.max_capacity) 
            : null,
          capacity_unit: machineryForm.value.capacity_unit && machineryForm.value.capacity_unit.trim() !== '' 
            ? machineryForm.value.capacity_unit.trim() 
            : null,
          status: machineryForm.value.status,
          created_by: authStore.currentUser?.id || null,
          barangay_id: barangayId  // Auto-set for president, admin-selected for admin
        }
        
        console.log('Submitting machinery data:', data)
        await machineryStore.addMachinery(data)
        successMessage.value = 'Machinery added successfully!'
        closeModals()
        resetForm()
        await loadData()
      } catch (error) {
        console.error('Error adding machinery:', error)
        // Error is already set in store, no need to catch it here
      }
    }

    const editMachinery = (machine) => {
      machineryForm.value = { ...machine }
      // Ensure barangay_id is properly initialized for the form
      if (!machineryForm.value.barangay_id) {
        machineryForm.value.barangay_id = ''
      }
      showEditMachineryModal.value = true
      showInventoryModal.value = false
    }

    const updateMachinery = async () => {
      try {
        // For presidents, automatically use their barangay
        let barangayId = machineryForm.value.barangay_id
        if (isPresidentRole.value) {
          barangayId = userBarangayId.value
        } else {
          // For admins, validate barangay is selected
          if (!machineryForm.value.barangay_id || machineryForm.value.barangay_id === '') {
            validationError.value = '⚠️ Please select a Barangay for this machinery'
            setTimeout(() => validationError.value = '', 5000)
            return
          }
          barangayId = typeof machineryForm.value.barangay_id === 'string' 
            ? parseInt(machineryForm.value.barangay_id) 
            : machineryForm.value.barangay_id
        }

        validationError.value = ''
        
        const data = {
          machinery_name: machineryForm.value.machinery_name.trim(),
          machinery_type: machineryForm.value.machinery_type.trim(),
          description: machineryForm.value.description ? machineryForm.value.description.trim() : null,
          price_per_unit: parseFloat(machineryForm.value.price_per_unit) || 0,
          unit_type: machineryForm.value.unit_type.trim(),
          max_capacity: machineryForm.value.max_capacity && machineryForm.value.max_capacity !== '' 
            ? parseFloat(machineryForm.value.max_capacity) 
            : null,
          capacity_unit: machineryForm.value.capacity_unit && machineryForm.value.capacity_unit.trim() !== '' 
            ? machineryForm.value.capacity_unit.trim() 
            : null,
          status: machineryForm.value.status,
          barangay_id: barangayId  // Auto-set for president, admin-selected for admin
        }
        
        console.log('Updating machinery data:', data)
        await machineryStore.updateMachinery(machineryForm.value.id, data)
        successMessage.value = 'Machinery updated successfully!'
        closeModals()
        resetForm()
        await loadData()
      } catch (error) {
        console.error('Error updating machinery:', error)
        // Error is already set in store
      }
    }

    const deleteMachineryConfirm = (machine) => {
      machineryToDelete.value = machine
      showDeleteModal.value = true
      showInventoryModal.value = false
    }

    const deleteMachinery = async () => {
      try {
        await machineryStore.deleteMachinery(machineryToDelete.value.id)
        successMessage.value = 'Machinery deleted successfully!'
        closeModals()
        await loadData()
      } catch (error) {
        console.error('Error deleting machinery:', error)
        // Error is already set in store
      }
    }

    const viewBooking = async (booking) => {
      try {
        await machineryStore.getBookingDetails(booking.id)
        showViewBookingModal.value = true
      } catch (error) {
        console.error('Error viewing booking:', error)
      }
    }

    const closeModals = () => {
      showInventoryModal.value = false
      showAddMachineryModal.value = false
      showEditMachineryModal.value = false
      showViewBookingModal.value = false
      showDeleteModal.value = false
      machineryToDelete.value = null
      validationError.value = ''
      machineryStore.clearSelection()
    }

    const resetForm = () => {
      machineryForm.value = {
        machinery_name: '', machinery_type: '', description: '',
        price_per_unit: '', unit_type: '', max_capacity: '',
        capacity_unit: '', status: 'Available', created_by: null, barangay_id: ''
      }
    }

    const clearError = () => machineryStore.clearError()

    const getMachineryTypeClass = (type) => ({
      'Harvester': 'primary', 'Dryer': 'warning',
      'Hauling Track': 'info', 'Tractor': 'success'
    }[type] || 'default')

    const getStatusClass = (status) => ({
      'Available': 'success', 'In Use': 'info',
      'Under Maintenance': 'warning', 'Unavailable': 'danger'
    }[status] || 'default')

    const getBookingStatusClass = (status) => ({
      'Pending': 'warning', 'Approved': 'success',
      'Completed': 'info', 'Rejected': 'danger', 'Cancelled': 'default'
    }[status] || 'default')

    const formatNumber = (num) => new Intl.NumberFormat('en-PH').format(num)
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    const formatDateTime = (dt) => new Date(dt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    
    const getBarangayName = (barangayId) => {
      if (!barangayId) return ''
      const barangay = barangays.value.find(b => b.id === parseInt(barangayId))
      return barangay ? barangay.name : ''
    }

    onMounted(() => loadData())

    // Auto-set barangay for president when opening add modal
    watch(showAddMachineryModal, (isOpen) => {
      if (isOpen && isPresidentRole.value) {
        machineryForm.value.barangay_id = userBarangayId.value
      }
    })

    return {
      showInventoryModal, showAddMachineryModal, showEditMachineryModal,
      showViewBookingModal, showDeleteModal, machineryToDelete,
      successMessage, validationError, filters, adminFilters, machineryForm, inventory, bookings,
      loading, error, selectedBooking, distinctMachineryTypes,
      totalMachinery, availableMachinery, barangays, isAdminRole, isAdminOnly,
      pendingBookingsCount, totalRevenue, applyFilters, applyAdminFilters,
      filteredInventory, handleBarangayChange, isPresidentRole, userBarangayId,
      addMachinery, editMachinery, updateMachinery, deleteMachineryConfirm,
      deleteMachinery, viewBooking, closeModals, clearError,
      getMachineryTypeClass, getStatusClass, getBookingStatusClass,
      getBarangayName, formatNumber, formatDate, formatDateTime
    }
  }
}
</script>

<style scoped>
.machinery-management-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 28px; font-weight: bold; color: #1a1a1a; margin: 0; }
.page-subtitle { color: #666; margin: 4px 0 0 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px; }
.stat-card { background: white; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.stat-icon { font-size: 36px; }
.stat-label { color: #666; font-size: 14px; margin-bottom: 4px; }
.stat-value { font-size: 28px; font-weight: bold; color: #1a1a1a; }
.stat-success { border-left: 4px solid #10b981; }
.stat-pending { border-left: 4px solid #f59e0b; }
.stat-info { border-left: 4px solid #3b82f6; }
.section { margin-bottom: 40px; }
.section-title { font-size: 22px; font-weight: bold; margin-bottom: 20px; }
.filters-section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
.filter-group { flex: 1; min-width: 200px; }
.filter-label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
.filter-select, .form-input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
.table-container, .inventory-table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.bookings-table, .inventory-table { width: 100%; border-collapse: collapse; }
.bookings-table thead, .inventory-table thead { background: #f8f9fa; }
.bookings-table th, .inventory-table th { padding: 16px; text-align: left; font-weight: 600; color: #333; border-bottom: 2px solid #e5e7eb; }
.bookings-table td, .inventory-table td { padding: 16px; border-bottom: 1px solid #e5e7eb; }
.farmer-info, .machinery-info { display: flex; flex-direction: column; gap: 4px; }
.farmer-info small, .machinery-info small { color: #666; font-size: 12px; }
.price-cell { font-weight: 600; color: #059669; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.badge-primary { background: #dbeafe; color: #1e40af; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-info { background: #e0e7ff; color: #3730a3; }
.badge-success { background: #d1fae5; color: #065f46; }
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-success { background: #d1fae5; color: #065f46; }
.status-info { background: #dbeafe; color: #1e40af; }
.status-warning { background: #fef3c7; color: #92400e; }
.status-danger { background: #fee2e2; color: #991b1b; }
.status-default { background: #f3f4f6; color: #6b7280; }
.action-buttons { display: flex; gap: 8px; }
.btn-icon-small { padding: 6px 10px; border: none; background: #f3f4f6; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.btn-icon-small:hover { background: #e5e7eb; }
.btn-icon-small.btn-danger:hover { background: #fee2e2; }
.btn-primary { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-success { background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-danger { background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; border-radius: 16px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.modal-large { max-width: 800px; }
.modal-xlarge { max-width: 1000px; }
.modal-small { max-width: 400px; }
.modal-header { padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { margin: 0; font-size: 22px; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
.modal-body { padding: 24px; }
.inventory-actions { margin-bottom: 20px; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
.form-hint { display: block; margin-top: 4px; font-size: 12px; color: #6b7280; font-style: italic; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pricing-guide { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-top: 20px; }
.pricing-guide h4 { margin: 0 0 8px 0; color: #1e40af; font-size: 16px; }
.pricing-guide p { margin: 4px 0; color: #1e3a8a; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.booking-details { display: flex; flex-direction: column; gap: 24px; }
.detail-section h3 { font-size: 18px; margin: 0 0 16px 0; }
.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item label { font-weight: 600; color: #666; font-size: 14px; }
.price-highlight { color: #059669; font-size: 20px; }
.notes-text { background: #f9fafb; padding: 16px; border-radius: 8px; color: #333; line-height: 1.6; }
.loading-cell, .empty-cell { text-align: center; padding: 40px !important; color: #666; }
.loading-spinner { border: 3px solid #f3f4f6; border-top: 3px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.alert { position: fixed; top: 20px; right: 20px; padding: 16px 20px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 2000; }
.alert-error { background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444; }
.alert-success { background: #d1fae5; color: #065f46; border-left: 4px solid #10b981; }
.alert-warning { background: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b; }
.alert-close { background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.7; }
.warning-text { color: #dc2626; font-size: 14px; margin-top: 8px; }
.barangay-assignment-group { 
  background: #fffacd;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  position: relative;
}
.barangay-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef08a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #92400e;
  border-left: 4px solid #f59e0b;
}
.warning-icon { font-size: 18px; }
.barangay-label {
  font-weight: 700;
  color: #92400e;
  font-size: 16px;
  margin-top: 0;
}
.barangay-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: #666;
}
.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f4f6;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.barangay-select-emphasized {
  font-weight: 500;
  border: 2px solid #f59e0b;
  background: white;
}
.barangay-select-emphasized:focus {
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
  outline: none;
}
.barangay-selected {
  margin-top: 12px;
  padding: 10px 14px;
  background: #d1fae5;
  border-left: 4px solid #10b981;
  border-radius: 6px;
  color: #065f46;
  font-weight: 600;
  font-size: 14px;
}
.barangay-hint {
  display: block;
  margin-top: 12px;
  font-size: 13px;
  color: #5b4d1a;
  font-style: italic;
}
.barangay-read-only {
  margin-top: 12px;
  padding: 12px 14px;
  background: #f0fdf4;
  border: 2px solid #10b981;
  border-radius: 6px;
  color: #065f46;
}
.barangay-read-only .barangay-info {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.barangay-read-only .barangay-info::before {
  content: '✓';
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 12px;
}
.barangay-badge {
  display: inline-block;
  padding: 6px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
}
.inventory-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
</style>
