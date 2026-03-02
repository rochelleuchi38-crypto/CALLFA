<template>
  <div class="machinery-booking-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">🚜 Machinery Booking Service</h1>
        <p class="page-subtitle">Book farm machinery and equipment for your agricultural needs</p>
      </div>
    </div>

    <!-- My Bookings Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-label">My Bookings</div>
          <div class="stat-value">{{ myBookingsCount }}</div>
        </div>
      </div>
      <div class="stat-card stat-pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-label">Pending</div>
          <div class="stat-value">{{ pendingBookingsCount }}</div>
        </div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-label">Approved</div>
          <div class="stat-value">{{ approvedBookingsCount }}</div>
        </div>
      </div>
      <div class="stat-card stat-info">
        <div class="stat-icon">🏁</div>
        <div class="stat-content">
          <div class="stat-label">Completed</div>
          <div class="stat-value">{{ completedBookingsCount }}</div>
        </div>
      </div>
    </div>

    <!-- Payment Status Stats -->
    <div class="stats-grid payment-stats">
      <div class="stat-card stat-danger">
        <div class="stat-icon">💳</div>
        <div class="stat-content">
          <div class="stat-label">Unpaid</div>
          <div class="stat-value">{{ unpaidBookingsCount }}</div>
        </div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-label">Partial</div>
          <div class="stat-value">{{ partialBookingsCount }}</div>
        </div>
      </div>
      <div class="stat-card stat-paid">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-label">Fully Paid</div>
          <div class="stat-value">{{ paidBookingsCount }}</div>
        </div>
      </div>
      <div class="stat-card" :class="outstandingBalance > 0 ? 'stat-danger' : 'stat-paid'">
        <div class="stat-icon">₱</div>
        <div class="stat-content">
          <div class="stat-label">Outstanding Balance</div>
          <div class="stat-value">₱{{ formatNumber(outstandingBalance) }}</div>
        </div>
      </div>
    </div>

    <!-- Outstanding Balance Warning -->
    <div v-if="outstandingBalance > 0" class="outstanding-warning">
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <h3>Outstanding Balance Alert</h3>
        <p>You have an outstanding balance of <strong>₱{{ formatNumber(outstandingBalance) }}</strong> from previous completed bookings.</p>
        <p>Please settle your balance before booking new machinery.</p>
        <div class="unpaid-bookings-list" v-if="unpaidBookingsList.length > 0">
          <h4>Unpaid Bookings:</h4>
          <ul>
            <li v-for="booking in unpaidBookingsList" :key="booking.id">
              <span class="booking-info">{{ booking.machinery_name }} - {{ formatDate(booking.booking_date) }}</span>
              <span class="booking-balance">₱{{ formatNumber(booking.remaining_balance) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Available Machinery -->
    <div class="section">
      <h2 class="section-title">🚜 Available Machinery</h2>
      
      <!-- Machinery Type Filter -->
      <div class="filters" style="margin-bottom: 20px;">
        <select v-model="machineryTypeFilter" @change="applyMachineryFilter" class="filter-select">
          <option value="">All Machinery Types</option>
          <option v-for="type in distinctMachineryTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>

      <div class="machinery-grid">
        <div v-if="loading && availableMachinery.length === 0" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading available machinery...</p>
        </div>
        <div v-else-if="availableMachinery.length === 0" class="empty-state">
          <div class="empty-icon">🚫</div>
          <p>No machinery available at the moment</p>
        </div>
        <div v-else v-for="machine in availableMachinery" :key="machine.id" class="machinery-card">
          <div class="machinery-header">
            <h3 class="machinery-title">{{ machine.machinery_name }}</h3>
            <span class="badge" :class="'badge-' + getMachineryTypeClass(machine.machinery_type)">
              {{ machine.machinery_type }}
            </span>
          </div>
          <p class="machinery-description">{{ machine.description || 'No description available' }}</p>
          <div class="machinery-details">
            <div class="detail-row">
              <span class="detail-label">💰 Price:</span>
              <span class="detail-value">₱{{ formatNumber(machine.price_per_unit) }} {{ machine.unit_type }}</span>
            </div>
            <div class="detail-row" v-if="machine.max_capacity">
              <span class="detail-label">📊 Max Capacity:</span>
              <span class="detail-value">{{ machine.max_capacity }} {{ machine.capacity_unit }}/day</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📌 Status:</span>
              <span class="status-badge status-success">{{ machine.status }}</span>
            </div>
          </div>
          <button 
            @click="bookMachinery(machine)" 
            class="btn-book" 
            :disabled="outstandingBalance > 0"
            :title="outstandingBalance > 0 ? 'Please settle your outstanding balance first' : 'Book this machinery'"
          >
            {{ outstandingBalance > 0 ? 'Settle Balance First' : 'Book Now' }}
          </button>
        </div>
      </div>
    </div>

    <!-- My Bookings -->
    <div class="section">
      <h2 class="section-title">📋 My Bookings</h2>
      
      <!-- Filters -->
      <div class="filters">
        <select v-model="bookingFilter" @change="applyFilter" class="filter-select">
          <option value="">All Bookings</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select v-model="paymentFilter" @change="applyFilter" class="filter-select">
          <option value="">All Payment Status</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partial">Partial</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      <div class="bookings-table-container">
        <table class="bookings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Machinery</th>
              <th>Booking Date</th>
              <th>Location</th>
              <th>Area/Quantity</th>
              <th>Total Price</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="loading-cell">
                <div class="loading-spinner"></div>
                <span>Loading bookings...</span>
              </td>
            </tr>
            <tr v-else-if="filteredBookings.length === 0">
              <td colspan="11" class="empty-cell">
                No bookings found. Book a machinery to get started!
              </td>
            </tr>
            <tr v-else v-for="booking in filteredBookings" :key="booking.id" :data-booking-id="booking.id" :class="{ 'notification-highlight-row': highlightedBookingId == booking.id }">
              <td>{{ booking.id }}</td>
              <td>
                <div class="booking-machinery">
                  <strong>{{ booking.machinery_name }}</strong>
                  <small>{{ booking.machinery_type }}</small>
                </div>
              </td>
              <td>{{ formatDate(booking.booking_date) }}</td>
              <td>{{ booking.service_location }}</td>
              <td>{{ booking.area_size }} {{ booking.area_unit }}</td>
              <td class="price-cell">₱{{ formatNumber(booking.total_price) }}</td>
              <td class="price-cell">₱{{ formatNumber(booking.total_paid || 0) }}</td>
              <td class="price-cell" :class="{ 'balance-unpaid': (booking.total_price - (booking.total_paid || 0)) > 0 }">
                ₱{{ formatNumber(booking.total_price - (booking.total_paid || 0)) }}
              </td>
              <td>
                <span class="status-badge" :class="'status-' + getBookingStatusClass(booking.status)">
                  {{ booking.status }}
                </span>
              </td>
              <td>
                <span class="payment-badge" :class="'payment-' + getPaymentStatusClass(booking.payment_status)">
                  {{ booking.payment_status || 'Unpaid' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="viewBookingDetails(booking)" class="btn-icon-small" title="View">
                    👁️
                  </button>
                  <button 
                    v-if="booking.status === 'Pending' && booking.farmer_id === authStore.currentUser?.id" 
                    @click="editBookingConfirm(booking)" 
                    class="btn-icon-small btn-edit" 
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    v-if="booking.status === 'Pending'" 
                    @click="cancelBookingConfirm(booking)" 
                    class="btn-icon-small btn-danger" 
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Booking Modal -->
    <div v-if="showBookingModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📅 Book Machinery</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitBooking">
            <div class="form-group">
              <label class="form-label">Select Machinery *</label>
              <select v-model="bookingForm.machinery_id" @change="onMachinerySelect" class="form-input" required>
                <option value="">Choose machinery...</option>
                <option v-for="machine in availableMachinery" :key="machine.id" :value="machine.id">
                  {{ machine.machinery_name }} ({{ machine.machinery_type }}) - ₱{{ formatNumber(machine.price_per_unit) }} {{ machine.unit_type }}
                </option>
              </select>
            </div>

            <div class="form-group" v-if="selectedMachineryForBooking">
              <div class="machinery-info-box">
                <h4>{{ selectedMachineryForBooking.machinery_type }} Details</h4>
                <p><strong>Price:</strong> ₱{{ formatNumber(selectedMachineryForBooking.price_per_unit) }} {{ selectedMachineryForBooking.unit_type }}</p>
                <p v-if="selectedMachineryForBooking.max_capacity">
                  <strong>Max Capacity:</strong> {{ selectedMachineryForBooking.max_capacity }} {{ selectedMachineryForBooking.capacity_unit }} per day
                </p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Booking Date *</label>
              <input
                v-model="bookingForm.booking_date"
                type="date"
                :min="minDate"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Service Location *</label>
              <input
                v-model="bookingForm.service_location"
                type="text"
                class="form-input"
                placeholder="Enter farm location or address"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ getAreaLabel() }} *</label>
                <input
                  v-model.number="bookingForm.area_size"
                  type="number"
                  step="0.01"
                  min="0.01"
                  :max="selectedMachineryForBooking?.max_capacity || undefined"
                  class="form-input"
                  :class="{ 'input-error': capacityError }"
                  @input="validateAndCalculate"
                  placeholder="0.00"
                  required
                />
                <small v-if="selectedMachineryForBooking?.max_capacity" class="form-hint">
                  Maximum: {{ selectedMachineryForBooking.max_capacity }} {{ selectedMachineryForBooking.capacity_unit }}
                </small>
                <small v-if="capacityError" class="error-message">⚠️ {{ capacityError }}</small>
              </div>
              <div class="form-group">
                <label class="form-label">Unit *</label>
                <input
                  v-model="bookingForm.area_unit"
                  type="text"
                  class="form-input input-readonly"
                  readonly
                  placeholder="Auto-filled"
                />
                <small v-if="bookingForm.area_unit" class="form-hint">Using: {{ bookingForm.area_unit }}</small>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Additional Notes</label>
              <textarea
                v-model="bookingForm.notes"
                class="form-input"
                rows="3"
                placeholder="Any special instructions or notes..."
              ></textarea>
            </div>

            <div class="price-summary" v-if="calculatedPrice > 0">
              <div class="summary-row">
                <span v-if="selectedMachineryForBooking?.unit_type === 'per load'">₱{{ formatNumber(selectedMachineryForBooking?.price_per_unit || 0) }} per load (up to {{ selectedMachineryForBooking?.max_capacity }} {{ selectedMachineryForBooking?.capacity_unit }})</span>
                <span v-else>{{ bookingForm.area_size }} {{ bookingForm.area_unit }} × ₱{{ formatNumber(selectedMachineryForBooking?.price_per_unit || 0) }}</span>
                <strong class="total-price">₱{{ formatNumber(calculatedPrice) }}</strong>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModals" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="loading || !bookingForm.machinery_id || !!capacityError">
                {{ loading ? 'Booking...' : 'Confirm Booking' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Booking Details Modal -->
    <div v-if="showViewBookingModal && selectedBooking" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>📋 Booking Details #{{ selectedBooking.id }}</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="booking-details">
            <div class="detail-section">
              <h3>Machinery Information</h3>
              <div class="details-grid">
                <div class="detail-item">
                  <label>Machinery:</label>
                  <span>{{ selectedBooking.machinery_name }}</span>
                </div>
                <div class="detail-item">
                  <label>Type:</label>
                  <span class="badge" :class="'badge-' + getMachineryTypeClass(selectedBooking.machinery_type)">
                    {{ selectedBooking.machinery_type }}
                  </span>
                </div>
                <div class="detail-item">
                  <label>Price Rate:</label>
                  <span>₱{{ formatNumber(selectedBooking.price_per_unit) }} {{ selectedBooking.unit_type }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Booking Information</h3>
              <div class="details-grid">
                <div class="detail-item">
                  <label>Booking Date:</label>
                  <span>{{ formatDate(selectedBooking.booking_date) }}</span>
                </div>
                <div class="detail-item">
                  <label>Service Location:</label>
                  <span>{{ selectedBooking.service_location }}</span>
                </div>
                <div class="detail-item">
                  <label>Area/Quantity:</label>
                  <span>{{ selectedBooking.area_size }} {{ selectedBooking.area_unit }}</span>
                </div>
                <div class="detail-item">
                  <label>Total Price:</label>
                  <strong class="price-highlight">₱{{ formatNumber(selectedBooking.total_price) }}</strong>
                </div>
                <div class="detail-item">
                  <label>Status:</label>
                  <span class="status-badge" :class="'status-' + getBookingStatusClass(selectedBooking.status)">
                    {{ selectedBooking.status }}
                  </span>
                </div>
                <div class="detail-item" v-if="selectedBooking.created_at">
                  <label>Created:</label>
                  <span>{{ formatDateTime(selectedBooking.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedBooking.approved_by_name">
              <h3>Approval Information</h3>
              <div class="details-grid">
                <div class="detail-item">
                  <label>Approved By:</label>
                  <span>{{ selectedBooking.approved_by_name }}</span>
                </div>
                <div class="detail-item" v-if="selectedBooking.approved_date">
                  <label>Approved Date:</label>
                  <span>{{ formatDateTime(selectedBooking.approved_date) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedBooking.rejection_reason">
              <h3>Rejection Information</h3>
              <div class="rejection-box">
                <strong>Reason:</strong>
                <p>{{ selectedBooking.rejection_reason }}</p>
              </div>
            </div>

            <div class="detail-section" v-if="selectedBooking.notes">
              <h3>Additional Notes</h3>
              <p class="notes-text">{{ selectedBooking.notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Booking Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>✏️ Edit Booking</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="editBooking">
            <div class="form-group">
              <label class="form-label">Select Machinery *</label>
              <select v-model="bookingToEdit.machinery_id" @change="onEditMachinerySelect" class="form-input" required>
                <option value="">Choose machinery...</option>
                <option v-for="machine in availableMachinery" :key="machine.id" :value="machine.id">
                  {{ machine.machinery_name }} ({{ machine.machinery_type }}) - ₱{{ formatNumber(machine.price_per_unit) }} {{ machine.unit_type }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Booking Date *</label>
              <input 
                v-model="bookingToEdit.booking_date" 
                type="date" 
                class="form-input" 
                :min="minDate"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Area/Quantity ({{ bookingToEdit.area_unit }}) *</label>
              <input 
                v-model.number="bookingToEdit.area_size" 
                type="number" 
                min="0" 
                step="0.01" 
                class="form-input" 
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Service Location</label>
              <input 
                v-model="bookingToEdit.service_location" 
                type="text" 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Notes/Instructions</label>
              <textarea 
                v-model="bookingToEdit.notes" 
                class="form-input" 
                rows="3"
              ></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModals" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="loading">
                {{ loading ? 'Updating...' : 'Update Booking' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Cancel Booking Confirmation Modal -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h2>⚠️ Cancel Booking</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to cancel this booking?</p>
          <div class="booking-summary">
            <p><strong>Machinery:</strong> {{ bookingToCancel?.machinery_name }}</p>
            <p><strong>Date:</strong> {{ formatDate(bookingToCancel?.booking_date) }}</p>
            <p><strong>Total:</strong> ₱{{ formatNumber(bookingToCancel?.total_price) }}</p>
          </div>
          <div class="modal-actions">
            <button @click="closeModals" class="btn-secondary">No, Keep It</button>
            <button @click="cancelBooking" class="btn-danger" :disabled="loading">
              {{ loading ? 'Cancelling...' : 'Yes, Cancel' }}
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useMachineryStore } from '../stores/machineryStore'
import { useAuthStore } from '../stores/authStore'

export default {
  name: 'MachineryBookingPage',
  setup() {
    const machineryStore = useMachineryStore()
    const authStore = useAuthStore()
    const route = useRoute()

    // State
    const highlightedBookingId = ref(null)
    const showBookingModal = ref(false)
    const showViewBookingModal = ref(false)
    const showCancelModal = ref(false)
    const showEditModal = ref(false)
    const bookingToCancel = ref(null)
    const bookingToEdit = ref(null)
    const successMessage = ref('')
    const bookingFilter = ref('')
    const paymentFilter = ref('')
    const machineryTypeFilter = ref('')
    const calculatedPrice = ref(0)
    const capacityError = ref('')
    const outstandingBalance = ref(0)
    const unpaidBookingsList = ref([])

    const bookingForm = ref({
      farmer_id: null,
      machinery_id: '',
      booking_date: '',
      service_location: '',
      area_size: 0,
      area_unit: '',
      notes: ''
    })

    // Computed
    const distinctMachineryTypes = computed(() => machineryStore.distinctMachineryTypes)
    
    const allAvailableMachinery = computed(() => machineryStore.availableMachinery)
    
    const availableMachinery = computed(() => {
      if (!machineryTypeFilter.value) return allAvailableMachinery.value
      return allAvailableMachinery.value.filter(m => m.machinery_type === machineryTypeFilter.value)
    })
    
    const bookings = computed(() => machineryStore.bookings)
    const loading = computed(() => machineryStore.loading)
    const error = computed(() => machineryStore.error)
    const selectedBooking = computed(() => machineryStore.selectedBooking)

    const minDate = computed(() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    })

    const myBookings = computed(() => {
      return bookings.value.filter(b => b.farmer_id === authStore.currentUser?.id)
    })

    const myBookingsCount = computed(() => myBookings.value.length)
    
    const pendingBookingsCount = computed(() => {
      return myBookings.value.filter(b => b.status === 'Pending').length
    })
    
    const approvedBookingsCount = computed(() => {
      return myBookings.value.filter(b => b.status === 'Approved').length
    })
    
    const completedBookingsCount = computed(() => {
      return myBookings.value.filter(b => b.status === 'Completed').length
    })

    // Payment tracking computed properties
    const unpaidBookingsCount = computed(() => {
      return myBookings.value.filter(b => 
        b.status === 'Completed' && 
        (b.payment_status === 'Unpaid' || !b.payment_status)
      ).length
    })

    const partialBookingsCount = computed(() => {
      return myBookings.value.filter(b => 
        b.status === 'Completed' && 
        b.payment_status === 'Partial'
      ).length
    })

    const paidBookingsCount = computed(() => {
      return myBookings.value.filter(b => 
        b.status === 'Completed' && 
        b.payment_status === 'Paid'
      ).length
    })

    const filteredBookings = computed(() => {
      let filtered = myBookings.value
      if (bookingFilter.value) {
        filtered = filtered.filter(b => b.status === bookingFilter.value)
      }
      if (paymentFilter.value) {
        filtered = filtered.filter(b => (b.payment_status || 'Unpaid') === paymentFilter.value)
      }
      return filtered
    })

    const selectedMachineryForBooking = computed(() => {
      if (!bookingForm.value.machinery_id) return null
      return availableMachinery.value.find(m => m.id == bookingForm.value.machinery_id)
    })

    // Methods
    const loadFarmerBalance = async () => {
      try {
        if (!authStore.currentUser?.id) return
        
        const response = await fetch(`http://localhost:3000/api/machinery/bookings/farmer-balance/${authStore.currentUser.id}`)
        const data = await response.json()
        
        if (data.success) {
          outstandingBalance.value = data.total_outstanding_balance || 0
          unpaidBookingsList.value = data.unpaid_bookings || []
        }
      } catch (error) {
        console.error('Error loading farmer balance:', error)
      }
    }

    const loadData = async () => {
      try {
        await Promise.all([
          machineryStore.fetchInventory({ status: 'Available' }),
          machineryStore.fetchBookings({ farmer_id: authStore.currentUser?.id }),
          loadFarmerBalance()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    const applyFilter = () => {
      // Filter is reactive, no action needed
    }

    const applyMachineryFilter = () => {
      // Filter is reactive, no action needed
    }

    const onMachinerySelect = () => {
      if (selectedMachineryForBooking.value) {
        capacityError.value = ''
        console.log('🔧 Selected machinery:', selectedMachineryForBooking.value)
        
        // Use the machinery's capacity_unit directly to ensure correct unit matching
        const unit = selectedMachineryForBooking.value.capacity_unit || 
                    selectedMachineryForBooking.value.unit_type || 
                    'units'
        bookingForm.value.area_unit = unit.replace(/^per /, '').trim()
        
        console.log('✅ Area unit set to:', bookingForm.value.area_unit)
        calculatePrice()
      }
    }

    const validateAndCalculate = () => {
      capacityError.value = ''
      
      if (selectedMachineryForBooking.value && bookingForm.value.area_size > 0) {
        // Check capacity limit
        if (selectedMachineryForBooking.value.max_capacity && 
            bookingForm.value.area_size > selectedMachineryForBooking.value.max_capacity) {
          capacityError.value = `Maximum capacity is ${selectedMachineryForBooking.value.max_capacity} ${selectedMachineryForBooking.value.capacity_unit} per day`
          calculatedPrice.value = 0
          return
        }
        
        // IMPROVED: Handle 'per load' pricing (flat rate) vs per unit pricing (multiply)
        if (selectedMachineryForBooking.value.unit_type === 'per load') {
          // Flat rate for entire load (e.g., Dryer: ₱7,500 for up to 100 kabans)
          calculatedPrice.value = selectedMachineryForBooking.value.price_per_unit
        } else {
          // Per unit pricing (e.g., Tractor: ₱500 per hectare = 60 × 500)
          calculatedPrice.value = selectedMachineryForBooking.value.price_per_unit * bookingForm.value.area_size
        }
      } else {
        calculatedPrice.value = 0
      }
    }

    const calculatePrice = () => {
      validateAndCalculate()
    }

    const getAreaLabel = () => {
      if (!bookingForm.value.machinery_id) return 'Area/Quantity'
      const machinery = selectedMachineryForBooking.value
      if (!machinery) return 'Area/Quantity'
      
      // Use the machinery's capacity_unit for the label to be clear
      const unit = machinery.capacity_unit || 'units'
      const type = machinery.machinery_type
      
      if (type === 'Harvester' || type === 'Tractor') return `Area (${unit})`
      if (type === 'Dryer') return `Quantity (${unit})`
      if (type === 'Hauling Track') return `Quantity (${unit})`
      return `Quantity (${unit})`
    }

    const bookMachinery = (machine) => {
      bookingForm.value.machinery_id = machine.id
      onMachinerySelect()
      showBookingModal.value = true
    }

    const submitBooking = async () => {
      try {
        console.log('📋 Current user:', authStore.currentUser)
        console.log('📋 Form values before validation:', JSON.stringify({
          machinery_id: bookingForm.value.machinery_id,
          booking_date: bookingForm.value.booking_date,
          service_location: bookingForm.value.service_location,
          area_size: bookingForm.value.area_size,
          area_unit: bookingForm.value.area_unit,
          notes: bookingForm.value.notes
        }, null, 2))
        
        // Check if user is authenticated
        if (!authStore.currentUser || !authStore.currentUser.id) {
          machineryStore.error = 'You must be logged in to book machinery'
          console.error('❌ User not authenticated:', authStore.currentUser)
          return
        }
        
        // Check capacity one more time before submitting
        if (capacityError.value) {
          return
        }

        // Validate all required fields
        if (!bookingForm.value.machinery_id) {
          machineryStore.error = 'Please select a machinery'
          return
        }
        if (!bookingForm.value.booking_date) {
          machineryStore.error = 'Please select a booking date'
          return
        }
        if (!bookingForm.value.service_location || bookingForm.value.service_location.trim() === '') {
          machineryStore.error = 'Please enter service location'
          return
        }
        if (!bookingForm.value.area_size || bookingForm.value.area_size <= 0) {
          machineryStore.error = 'Please enter a valid area/quantity'
          return
        }
        if (!bookingForm.value.area_unit || bookingForm.value.area_unit.trim() === '') {
          console.error('❌ Area unit is empty!', bookingForm.value.area_unit)
          machineryStore.error = 'Area unit is missing. Please reselect the machinery.'
          return
        }

        // Prepare booking data with proper values
        const bookingData = {
          farmer_id: authStore.currentUser.id,
          machinery_id: parseInt(bookingForm.value.machinery_id),
          booking_date: bookingForm.value.booking_date,
          service_location: bookingForm.value.service_location.trim(),
          area_size: parseFloat(bookingForm.value.area_size),
          area_unit: bookingForm.value.area_unit.trim(),
          notes: bookingForm.value.notes ? bookingForm.value.notes.trim() : ''
        }
        
        console.log('📤 Submitting booking:', JSON.stringify(bookingData, null, 2))
        
        // Validate bookingData one more time before sending
        const missingFields = []
        if (!bookingData.farmer_id) missingFields.push('farmer_id')
        if (!bookingData.machinery_id) missingFields.push('machinery_id')
        if (!bookingData.booking_date) missingFields.push('booking_date')
        if (!bookingData.service_location) missingFields.push('service_location')
        if (!bookingData.area_size) missingFields.push('area_size')
        if (!bookingData.area_unit) missingFields.push('area_unit')
        
        if (missingFields.length > 0) {
          console.error('❌ Missing fields in booking data:', missingFields)
          machineryStore.error = `Missing required fields: ${missingFields.join(', ')}`
          return
        }
        
        await machineryStore.createBooking(bookingData)
        successMessage.value = 'Booking created successfully! Waiting for operator approval.'
        closeModals()
        resetBookingForm()
        await loadData()
      } catch (error) {
        console.error('Error creating booking:', error)
      }
    }

    const viewBookingDetails = async (booking) => {
      try {
        await machineryStore.getBookingDetails(booking.id)
        showViewBookingModal.value = true
      } catch (error) {
        console.error('Error viewing booking:', error)
      }
    }

    const cancelBookingConfirm = (booking) => {
      bookingToCancel.value = booking
      showCancelModal.value = true
    }

    const cancelBooking = async () => {
      try {
        await machineryStore.cancelBooking(bookingToCancel.value.id, authStore.currentUser?.id)
        successMessage.value = 'Booking cancelled successfully'
        closeModals()
        await loadData()
      } catch (error) {
        console.error('Error cancelling booking:', error)
      }
    }

    const editBookingConfirm = (booking) => {
      bookingToEdit.value = {
        ...booking,
        originalMachineryId: booking.machinery_id,
        booking_date: formatDateForInput(booking.booking_date) // Ensure date is in YYYY-MM-DD format
      }
      showEditModal.value = true
    }

    const onEditMachinerySelect = () => {
      // Convert machinery_id to number and update area_unit when machinery is changed
      bookingToEdit.value.machinery_id = parseInt(bookingToEdit.value.machinery_id, 10)
      const selectedMachine = availableMachinery.value.find(m => m.id === bookingToEdit.value.machinery_id)
      if (selectedMachine) {
        bookingToEdit.value.area_unit = selectedMachine.capacity_unit || ''
      }
    }

    const editBooking = async () => {
      try {
        if (!bookingToEdit.value.machinery_id) {
          alert('Please select a machinery')
          return
        }
        if (!bookingToEdit.value.booking_date) {
          alert('Please select a booking date')
          return
        }
        if (bookingToEdit.value.area_size <= 0) {
          alert('Please enter valid area/quantity')
          return
        }

        // Prepare booking data with proper type conversions
        const bookingData = {
          machinery_id: parseInt(bookingToEdit.value.machinery_id, 10),
          booking_date: bookingToEdit.value.booking_date,
          service_location: bookingToEdit.value.service_location || '',
          area_size: parseFloat(bookingToEdit.value.area_size),
          area_unit: bookingToEdit.value.area_unit || '',
          notes: bookingToEdit.value.notes || ''
        }

        console.log('📤 Sending edit booking data:', bookingData)
        await machineryStore.editBooking(bookingToEdit.value.id, bookingData)
        successMessage.value = 'Booking updated successfully'
        closeModals()
        await loadData()
      } catch (error) {
        console.error('Error updating booking:', error)
        alert('Error updating booking: ' + (error.message || 'Unknown error'))
      }
    }

    const closeModals = () => {
      showBookingModal.value = false
      showViewBookingModal.value = false
      showCancelModal.value = false
      showEditModal.value = false
      bookingToCancel.value = null
      bookingToEdit.value = null
      machineryStore.clearSelection()
    }

    const resetBookingForm = () => {
      bookingForm.value = {
        farmer_id: null,
        machinery_id: '',
        booking_date: '',
        service_location: '',
        area_size: 0,
        area_unit: '',
        notes: ''
      }
      calculatedPrice.value = 0
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

    const getBookingStatusClass = (status) => {
      const classes = {
        'Pending': 'warning',
        'Approved': 'success',
        'Completed': 'info',
        'Rejected': 'danger',
        'Cancelled': 'default'
      }
      return classes[status] || 'default'
    }

    const getPaymentStatusClass = (paymentStatus) => {
      const classes = {
        'Unpaid': 'unpaid',
        'Partial': 'partial',
        'Paid': 'paid'
      }
      return classes[paymentStatus] || 'unpaid'
    }

    const formatNumber = (num) => {
      return new Intl.NumberFormat('en-PH').format(num)
    }

    // Format date for HTML date input (YYYY-MM-DD format)
    const formatDateForInput = (date) => {
      if (!date) return ''
      const d = new Date(date)
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const year = d.getFullYear()
      return `${year}-${month}-${day}`
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const formatDateTime = (datetime) => {
      return new Date(datetime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Lifecycle
    onMounted(async () => {
      await loadData()

      // Handle notification highlight
      if (route.query.highlight && route.query.type === 'booking') {
        highlightedBookingId.value = route.query.highlight
        await nextTick()
        setTimeout(() => {
          const el = document.querySelector(`[data-booking-id="${route.query.highlight}"]`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          setTimeout(() => { highlightedBookingId.value = null }, 6000)
        }, 300)
      }
    })

    return {
      // Stores
      authStore,
      // State
      highlightedBookingId,
      showBookingModal,
      showViewBookingModal,
      showCancelModal,
      showEditModal,
      bookingToCancel,
      bookingToEdit,
      successMessage,
      bookingFilter,
      machineryTypeFilter,
      bookingForm,
      calculatedPrice,
      capacityError,
      // Computed
      distinctMachineryTypes,
      availableMachinery,
      loading,
      error,
      minDate,
      myBookingsCount,
      pendingBookingsCount,
      approvedBookingsCount,
      completedBookingsCount,
      filteredBookings,
      selectedMachineryForBooking,
      selectedBooking,
      // Methods
      applyFilter,
      applyMachineryFilter,
      onMachinerySelect,
      calculatePrice,
      validateAndCalculate,
      getAreaLabel,
      bookMachinery,
      submitBooking,
      viewBookingDetails,
      editBookingConfirm,
      onEditMachinerySelect,
      editBooking,
      cancelBookingConfirm,
      cancelBooking,
      closeModals,
      clearError,
      getMachineryTypeClass,
      getBookingStatusClass,
      getPaymentStatusClass,
      formatNumber,
      formatDateForInput,
      formatDate,
      formatDateTime,
      // Payment tracking
      paymentFilter,
      outstandingBalance,
      unpaidBookingsList,
      unpaidBookingsCount,
      partialBookingsCount,
      paidBookingsCount
    }
  }
}
</script>

<style scoped>
/* Notification highlight for table rows */
.notification-highlight-row {
  animation: highlightRowPulse 2s ease-in-out 3;
  background: #fef2f2 !important;
  outline: 2px solid #ef4444;
  outline-offset: -2px;
}

.notification-highlight-row td {
  background: #fef2f2 !important;
  color: #991b1b;
  font-weight: 600;
}

@keyframes highlightRowPulse {
  0%, 100% { box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.2); }
  50% { box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.6); }
}

/* Reuse most styles from MachineryInventoryPage */
.machinery-booking-page {
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

.stat-pending { border-left: 4px solid #f59e0b; }
.stat-success { border-left: 4px solid #10b981; }
.stat-info { border-left: 4px solid #3b82f6; }
.stat-danger { border-left: 4px solid #ef4444; }
.stat-warning { border-left: 4px solid #f59e0b; }
.stat-paid { border-left: 4px solid #10b981; }

.payment-stats {
  margin-top: 20px;
}

/* Outstanding Balance Warning */
.outstanding-warning {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  border-left: 4px solid #ef4444;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.warning-icon {
  font-size: 32px;
}

.warning-content h3 {
  margin: 0 0 8px 0;
  color: #dc2626;
  font-size: 18px;
}

.warning-content p {
  margin: 0 0 8px 0;
  color: #7f1d1d;
}

.unpaid-bookings-list {
  margin-top: 12px;
  background: white;
  border-radius: 8px;
  padding: 12px;
}

.unpaid-bookings-list h4 {
  margin: 0 0 8px 0;
  color: #991b1b;
  font-size: 14px;
}

.unpaid-bookings-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.unpaid-bookings-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #fecaca;
}

.unpaid-bookings-list li:last-child {
  border-bottom: none;
}

.booking-info {
  color: #7f1d1d;
}

.booking-balance {
  font-weight: bold;
  color: #dc2626;
}

/* Payment Status Badges */
.payment-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.payment-unpaid {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.payment-partial {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.payment-paid {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.balance-unpaid {
  color: #dc2626;
  font-weight: 600;
}

/* Disabled book button */
.btn-book:disabled {
  background: #d1d5db;
  color: #6b7280;
  cursor: not-allowed;
  transform: none;
}

.btn-book:disabled:hover {
  background: #d1d5db;
  transform: none;
}

.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #1a1a1a;
}

.machinery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.machinery-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.machinery-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.machinery-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.machinery-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.machinery-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  min-height: 40px;
}

.machinery-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  color: #666;
  font-size: 14px;
}

.detail-value {
  font-weight: 600;
  color: #1a1a1a;
}

.btn-book {
  width: 100%;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-book:hover {
  background: #2563eb;
}

.filters {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
}

.bookings-table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.bookings-table {
  width: 100%;
  border-collapse: collapse;
}

.bookings-table thead {
  background: #f8f9fa;
}

.bookings-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e5e7eb;
}

.bookings-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.booking-machinery {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.booking-machinery small {
  color: #666;
  font-size: 12px;
}

.price-cell {
  font-weight: 600;
  color: #059669;
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
.status-warning { background: #fef3c7; color: #92400e; }
.status-info { background: #dbeafe; color: #1e40af; }
.status-danger { background: #fee2e2; color: #991b1b; }
.status-default { background: #f3f4f6; color: #6b7280; }

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
}

.btn-primary:hover {
  background: #2563eb;
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
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
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

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.form-input.input-error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.form-input.input-readonly {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.error-message {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #ef4444;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.machinery-info-box {
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 16px;
  border-radius: 8px;
}

.machinery-info-box h4 {
  margin: 0 0 12px 0;
  color: #1e40af;
}

.machinery-info-box p {
  margin: 8px 0;
  color: #1e3a8a;
}

.price-summary {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-price {
  font-size: 24px;
  color: #059669;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.booking-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section h3 {
  font-size: 18px;
  margin: 0 0 16px 0;
  color: #1a1a1a;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.price-highlight {
  color: #059669;
  font-size: 20px;
}

.rejection-box {
  background: #fee2e2;
  border-left: 4px solid #ef4444;
  padding: 16px;
  border-radius: 8px;
}

.rejection-box strong {
  color: #991b1b;
}

.rejection-box p {
  margin: 8px 0 0 0;
  color: #7f1d1d;
}

.notes-text {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  color: #333;
  line-height: 1.6;
}

.booking-summary {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.booking-summary p {
  margin: 8px 0;
}

.loading-container,
.empty-state,
.loading-cell,
.empty-cell {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
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
  opacity: 0.7;
}

.alert-close:hover {
  opacity: 1;
}
</style>
