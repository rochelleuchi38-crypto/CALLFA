<template>
  <div class="machinery-approval-page">
    <!-- Access Control Check -->
    <div v-if="!canApproveBookings && !canCompleteBookings" class="alert alert-warning" style="margin: 20px; padding: 20px;">
      <h2>❌ Access Denied</h2>
      <p>This page is only available for:</p>
      <ul>
        <li>Business Managers</li>
        <li>Operation Managers</li>
        <li>Operators</li>
      </ul>
      <p><strong>Your Role:</strong> {{ authStore.currentUser?.role || 'Not logged in' }}</p>
      <p><strong>Your User ID:</strong> {{ authStore.currentUser?.id || 'N/A' }}</p>
    </div>

    <!-- Page Header -->
    <div class="page-header" v-show="canApproveBookings || canCompleteBookings">
      <div class="header-content">
        <h1 class="page-title" v-if="canApproveBookings">✅ Machinery Booking Approvals</h1>
        <h1 class="page-title" v-else-if="canCompleteBookings">🏁 Machinery Booking Operations</h1>
        <p class="page-subtitle" v-if="canApproveBookings">Review and manage machinery booking requests</p>
        <p class="page-subtitle" v-else-if="canCompleteBookings">Track approved bookings and mark usage status</p>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-grid">
      <div v-if="canApproveBookings" class="stat-card stat-pending" @click="quickFilter('Pending')" style="cursor: pointer;">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-label">Pending</div>
          <div class="stat-value">{{ pendingCount }}</div>
        </div>
      </div>
      <div v-if="canCompleteBookings" class="stat-card stat-pending" @click="quickFilter('Approved')" style="cursor: pointer;">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-label">To Process</div>
          <div class="stat-value">{{ approvedCount }}</div>
        </div>
      </div>
      <div v-if="canCompleteBookings" class="stat-card stat-info" @click="quickFilter('Incomplete')" style="cursor: pointer;">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-label">Incomplete</div>
          <div class="stat-value">{{ incompleteCount }}</div>
        </div>
      </div>
      <div class="stat-card stat-danger" @click="quickFilter('Rejected')" style="cursor: pointer;">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-label">Rejected</div>
          <div class="stat-value">{{ rejectedCount }}</div>
        </div>
      </div>
    </div>

    <!-- Quick Filter Buttons -->
    <div class="quick-filters">
      <button 
        v-if="canApproveBookings"
        @click="quickFilter('Pending')" 
        class="filter-btn filter-btn-pending"
        :class="{ active: activeFilter === 'Pending' }"
      >
        <span class="btn-icon">⏳</span>
        <span class="btn-text">Pending</span>
        <span class="btn-count">{{ pendingCount }}</span>
      </button>
      <button 
        v-if="canApproveBookings"
        @click="quickFilter('Approved')" 
        class="filter-btn filter-btn-approved"
        :class="{ active: activeFilter === 'Approved' }"
      >
        <span class="btn-icon">✅</span>
        <span class="btn-text">Approved</span>
        <span class="btn-count">{{ approvedCount }}</span>
      </button>
      <button 
        v-if="canCompleteBookings"
        @click="quickFilter('Incomplete')" 
        class="filter-btn filter-btn-incomplete"
        :class="{ active: activeFilter === 'Incomplete' }"
      >
        <span class="btn-icon">⚠️</span>
        <span class="btn-text">Incomplete</span>
        <span class="btn-count">{{ incompleteCount }}</span>
      </button>
      <button 
        v-if="canCompleteBookings"
        @click="quickFilter('Completed')" 
        class="filter-btn filter-btn-completed"
        :class="{ active: activeFilter === 'Completed' }"
      >
        <span class="btn-icon">🏁</span>
        <span class="btn-text">Completed</span>
        <span class="btn-count">{{ completedCount }}</span>
      </button>
      <button 
        v-if="canApproveBookings"
        @click="quickFilter('Rejected')" 
        class="filter-btn filter-btn-rejected"
        :class="{ active: activeFilter === 'Rejected' }"
      >
        <span class="btn-icon">❌</span>
        <span class="btn-text">Rejected</span>
        <span class="btn-count">{{ rejectedCount }}</span>
      </button>
    </div>

    <!-- Info Banner for Approvers -->
    <div v-if="isApprover && filters.status === 'Pending'" class="info-banner">
      <span class="banner-icon">ℹ️</span>
      <span class="banner-text">Showing <strong>Pending</strong> bookings only. Use filter buttons to view approved, rejected, or other bookings.</span>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label class="filter-label">Start Date</label>
        <input v-model="filters.start_date" @change="applyFilters" type="date" class="filter-select" />
      </div>
      <div class="filter-group">
        <label class="filter-label">End Date</label>
        <input v-model="filters.end_date" @change="applyFilters" type="date" class="filter-select" />
      </div>
      <button @click="clearFilters" class="btn-secondary">Clear Filters</button>
    </div>

    <!-- Bookings Table -->
    <div class="table-container">
      <table class="bookings-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Farmer</th>
            <th>Machinery</th>
            <th>Booking Date</th>
            <th>Location</th>
            <th>Area/Qty</th>
            <th>Total</th>
            <th v-if="canApproveBookings">Payment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="10" class="loading-cell">
              <div class="loading-spinner"></div>
              <span>Loading bookings...</span>
            </td>
          </tr>
          <tr v-else-if="bookings.length === 0">
            <td colspan="10" class="empty-cell">
              No bookings found.
            </td>
          </tr>
          <tr v-else v-for="booking in bookings" :key="booking.id">
            <td>{{ booking.id }}</td>
            <td>
              <div class="farmer-info">
                <strong>{{ booking.farmer_name }}</strong>
                <small>{{ booking.reference_number }}</small>
                <small v-if="booking.farmer_phone">📞 {{ booking.farmer_phone }}</small>
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
            <td v-if="canApproveBookings">
              <span class="status-badge" :class="'status-' + getPaymentStatusClass(booking.payment_status || 'Unpaid')">
                {{ booking.payment_status || 'Unpaid' }}
              </span>
              <div v-if="booking.total_paid > 0" class="payment-info">
                <small>Paid: ₱{{ formatNumber(booking.total_paid) }}</small>
                <small v-if="booking.remaining_balance > 0">Balance: ₱{{ formatNumber(booking.remaining_balance) }}</small>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="'status-' + getBookingStatusClass(booking.status)">
                {{ booking.status }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="viewBooking(booking)" class="btn-icon-small" title="View Details">
                  👁️
                </button>
                <button 
                  v-if="booking.status === 'Pending' && canApproveBookings" 
                  @click="approveBookingConfirm(booking)" 
                  class="btn-icon-small btn-success" 
                  title="Approve"
                >
                  ✓
                </button>
                <button 
                  v-if="booking.status === 'Pending' && canApproveBookings" 
                  @click="rejectBookingConfirm(booking)" 
                  class="btn-icon-small btn-danger" 
                  title="Reject"
                >
                  ✕
                </button>
                <button 
                  v-if="booking.status === 'Approved' && canCompleteBookings" 
                  @click="completeBookingConfirm(booking)" 
                  class="btn-icon-small btn-info" 
                  title="Mark as Completed"
                >
                  ✅
                </button>
                <button 
                  v-if="booking.status === 'Approved' && canCompleteBookings" 
                  @click="incompleteBookingConfirm(booking)" 
                  class="btn-icon-small btn-warning" 
                  title="Mark as Incomplete"
                >
                  ⚠️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- View Booking Details Modal -->
    <div v-if="showViewModal && selectedBooking" class="modal-overlay" @click.self="closeModals">
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
                <div class="detail-item">
                  <label>Name:</label>
                  <span>{{ selectedBooking.farmer_name }}</span>
                </div>
                <div class="detail-item">
                  <label>Reference Number:</label>
                  <span>{{ selectedBooking.reference_number }}</span>
                </div>
                <div class="detail-item" v-if="selectedBooking.farmer_phone">
                  <label>Phone:</label>
                  <span>📞 {{ selectedBooking.farmer_phone }}</span>
                </div>
                <div class="detail-item full-width" v-if="selectedBooking.farmer_address">
                  <label>Address:</label>
                  <span>{{ selectedBooking.farmer_address }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Machinery & Service Details</h3>
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
                  <label>Service Date:</label>
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
                  <label>Price Rate:</label>
                  <span>₱{{ formatNumber(selectedBooking.price_per_unit) }} {{ selectedBooking.unit_type }}</span>
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
              <h3>Farmer's Notes</h3>
              <p class="notes-text">{{ selectedBooking.notes }}</p>
            </div>
          </div>

          <!-- Action Buttons in Modal -->
          <div class="modal-actions" v-if="selectedBooking.status === 'Pending' && canApproveBookings">
            <button @click="closeModals" class="btn-secondary">Close</button>
            <button @click="rejectBookingConfirm(selectedBooking)" class="btn-danger">
              Reject Booking
            </button>
            <button @click="approveBookingConfirm(selectedBooking)" class="btn-success">
              Approve Booking
            </button>
          </div>
          <div class="modal-actions" v-else-if="selectedBooking.status === 'Pending'">
            <button @click="closeModals" class="btn-secondary">Close</button>
            <p style="color: #f59e0b; margin: 10px 0;">⚠️ Only Business Managers and Operation Managers can approve bookings</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Approve Confirmation Modal -->
    <div v-if="showApproveModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>✅ Approve Booking</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="booking-summary">
            <p><strong>Farmer:</strong> {{ bookingToProcess?.farmer_name }}</p>
            <p><strong>Machinery:</strong> {{ bookingToProcess?.machinery_name }}</p>
            <p><strong>Date:</strong> {{ formatDate(bookingToProcess?.booking_date) }}</p>
            <p><strong>Total Amount:</strong> ₱{{ formatNumber(bookingToProcess?.total_price) }}</p>
          </div>

          <div class="modal-actions">
            <button @click="closeModals" class="btn-secondary">Cancel</button>
            <button @click="approveBooking" class="btn-success" :disabled="loading">
              {{ loading ? 'Approving...' : 'Approve Booking' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h2>❌ Reject Booking</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p>Provide a reason for rejecting this booking:</p>
          <div class="booking-summary">
            <p><strong>Farmer:</strong> {{ bookingToProcess?.farmer_name }}</p>
            <p><strong>Machinery:</strong> {{ bookingToProcess?.machinery_name }}</p>
            <p><strong>Date:</strong> {{ formatDate(bookingToProcess?.booking_date) }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Rejection Reason *</label>
            <textarea
              v-model="rejectionReason"
              class="form-input"
              rows="4"
              placeholder="Enter reason for rejection..."
              required
            ></textarea>
          </div>
          <div class="modal-actions">
            <button @click="closeModals" class="btn-secondary">Cancel</button>
            <button @click="rejectBooking" class="btn-danger" :disabled="loading || !rejectionReason">
              {{ loading ? 'Rejecting...' : 'Reject Booking' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Complete Confirmation Modal -->
    <div v-if="showCompleteModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content modal-medium">
        <div class="modal-header">
          <h2>✅ Mark Booking Completed</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">Mark this booking as completed?</p>
          <div class="booking-summary">
            <p><strong>Farmer:</strong> {{ bookingToProcess?.farmer_name }}</p>
            <p><strong>Machinery:</strong> {{ bookingToProcess?.machinery_name }}</p>
            <p><strong>Date:</strong> {{ formatDate(bookingToProcess?.booking_date) }}</p>
          </div>
          
          <div style="margin-top: 20px;">
            <button @click="closeModals" class="btn-secondary btn-block">Cancel</button>
            <button @click="completeBooking" class="btn-success btn-block" :disabled="loading" style="margin-top: 10px;">
              {{ loading ? 'Processing...' : 'Mark as Completed' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Incomplete Booking Modal -->
    <div v-if="showIncompleteModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h2>⚠️ Mark Booking Incomplete</h2>
          <button @click="closeModals" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p>Please describe the issues encountered:</p>
          <div class="booking-summary">
            <p><strong>Farmer:</strong> {{ bookingToProcess?.farmer_name }}</p>
            <p><strong>Machinery:</strong> {{ bookingToProcess?.machinery_name }}</p>
            <p><strong>Date:</strong> {{ formatDate(bookingToProcess?.booking_date) }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Notes on Issues *</label>
            <textarea
              v-model="completionNotes"
              class="form-input"
              rows="4"
              placeholder="Describe the issues or reasons for marking as incomplete..."
              required
            ></textarea>
          </div>
          <div class="modal-actions">
            <button @click="showIncompleteModal = false" class="btn-secondary">Cancel</button>
            <button @click="markIncompleteBooking" class="btn-warning" :disabled="loading || !completionNotes">
              {{ loading ? 'Processing...' : 'Mark as Incomplete' }}
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
  name: 'MachineryApprovalPage',
  setup() {
    const machineryStore = useMachineryStore()
    const authStore = useAuthStore()

    // State
    const showViewModal = ref(false)
    const showApproveModal = ref(false)
    const showRejectModal = ref(false)
    const showCompleteModal = ref(false)
    const showIncompleteModal = ref(false)
    const bookingToProcess = ref(null)
    const rejectionReason = ref('')
    const completionNotes = ref('')
    const successMessage = ref('')
    const filters = ref({
      status: '',
      payment_status: '',
      start_date: '',
      end_date: ''
    })

    const approvalForm = ref({
      approved_by: null
    })

    const activeFilter = ref('')
    const allBookings = ref([]) // Store all bookings for counts
    const isApprover = computed(() => {
      const role = authStore.currentUser?.role
      return ['business_manager', 'operation_manager'].includes(role)
    })

    const todayDate = computed(() => new Date().toISOString().split('T')[0])

    // Computed
    const bookings = computed(() => machineryStore.bookings)
    const loading = computed(() => machineryStore.loading)
    const error = computed(() => machineryStore.error)
    const selectedBooking = computed(() => machineryStore.selectedBooking)

    // Use allBookings for counts to show total counts regardless of filters
    const pendingCount = computed(() => {
      return allBookings.value.filter(b => b.status === 'Pending').length
    })

    const approvedCount = computed(() => {
      return allBookings.value.filter(b => b.status === 'Approved').length
    })

    const rejectedCount = computed(() => {
      return allBookings.value.filter(b => b.status === 'Rejected').length
    })

    const incompleteCount = computed(() => {
      return allBookings.value.filter(b => b.status === 'Incomplete').length
    })



    const completedCount = computed(() => {
      return allBookings.value.filter(b => b.status === 'Completed').length
    })

    const approvedTodayCount = computed(() => {
      const today = new Date().toISOString().split('T')[0]
      return allBookings.value.filter(b => 
        b.status === 'Approved' && 
        b.approved_date && 
        b.approved_date.startsWith(today)
      ).length
    })

    const rejectedTodayCount = computed(() => {
      const today = new Date().toISOString().split('T')[0]
      return allBookings.value.filter(b => 
        b.status === 'Rejected' && 
        b.approved_date && 
        b.approved_date.startsWith(today)
      ).length
    })

    const totalBookingsCount = computed(() => allBookings.value.length)

    // Check if current user can approve bookings (Business Manager or Operation Manager only)
    const canApproveBookings = computed(() => {
      const userRole = authStore.currentUser?.role
      return ['business_manager', 'operation_manager'].includes(userRole)
    })

    // Check if current user can complete bookings (Operator only)
    const canCompleteBookings = computed(() => {
      const userRole = authStore.currentUser?.role
      return userRole === 'operator'
    })

    // Methods
    const loadData = async () => {
      try {
        // For Business Managers and Operation Managers, auto-filter to Pending if no other filters
        // For Operators, auto-filter to Approved if no other filters
        const filterToApply = { ...filters.value }
        if (isApprover.value && !filters.value.status && !filters.value.payment_status && !filters.value.start_date && !filters.value.end_date) {
          filterToApply.status = 'Pending'
          filters.value.status = 'Pending'
          activeFilter.value = 'Pending'
        } else if (canCompleteBookings.value && !filters.value.status && !filters.value.payment_status && !filters.value.start_date && !filters.value.end_date) {
          // For operators, auto-filter to Approved bookings (work items)
          filterToApply.status = 'Approved'
          filters.value.status = 'Approved'
          activeFilter.value = 'Approved'
        }
        
        // First load all bookings for counts
        await machineryStore.fetchBookings({})
        allBookings.value = [...machineryStore.bookings]
        
        // Then apply filters
        if (filterToApply.status || filterToApply.payment_status || filterToApply.start_date || filterToApply.end_date) {
          await machineryStore.fetchBookings(filterToApply)
        } else if (isApprover.value) {
          // If still no filter but is approver, ensure Pending is shown
          await machineryStore.fetchBookings({ status: 'Pending' })
        } else if (canCompleteBookings.value) {
          // If still no filter but is operator, ensure Approved is shown
          await machineryStore.fetchBookings({ status: 'Approved' })
        }
      } catch (error) {
        console.error('Error loading bookings:', error)
      }
    }

    const applyFilters = () => {
      loadData()
    }

    const clearFilters = () => {
      filters.value = {
        status: '',
        payment_status: '',
        start_date: '',
        end_date: ''
      }
      activeFilter.value = ''
      // For approvers, clear filters will trigger auto-filter to Pending
      loadData()
    }

    const quickFilter = (status) => {
      activeFilter.value = status
      if (status === 'Completed') {
        // Show Completed bookings when operator clicks Completed button
        // For now, filter will show 'Completed' - backend needs to handle this
        filters.value.status = 'Completed'
      } else if (status === '') {
        filters.value.status = ''
      } else {
        filters.value.status = status
      }
      loadData()
    }

    const viewBooking = async (booking) => {
      try {
        await machineryStore.getBookingDetails(booking.id)
        showViewModal.value = true
      } catch (error) {
        console.error('Error viewing booking:', error)
      }
    }

    const approveBookingConfirm = (booking) => {
      // Check if user has permission to approve
      if (!['business_manager', 'operation_manager'].includes(authStore.currentUser?.role)) {
        alert('❌ Only Business Managers and Operation Managers can approve bookings')
        return
      }
      bookingToProcess.value = booking
      // Reset approval form
      approvalForm.value = {
        approved_by: authStore.currentUser?.id
      }
      showApproveModal.value = true
      showViewModal.value = false
    }

    const approveBooking = async () => {
      try {
        // Approval only - no payment involved
        // Payment is handled separately by Treasurer via Treasurer's dedicated page
        const approvalData = {
          approved_by: authStore.currentUser?.id
        }

        await machineryStore.approveBooking(bookingToProcess.value.id, approvalData)
        successMessage.value = 'Booking approved successfully!'
        closeModals()
        await loadData()
      } catch (error) {
        console.error('Error approving booking:', error)
      }
    }

    const rejectBookingConfirm = (booking) => {
      // Check if user has permission to reject
      if (!['business_manager', 'operation_manager'].includes(authStore.currentUser?.role)) {
        alert('❌ Only Business Managers and Operation Managers can reject bookings')
        return
      }
      bookingToProcess.value = booking
      rejectionReason.value = ''
      showRejectModal.value = true
      showViewModal.value = false
    }

    const rejectBooking = async () => {
      if (!rejectionReason.value) {
        return
      }
      try {
        await machineryStore.rejectBooking(
          bookingToProcess.value.id, 
          authStore.currentUser?.id, 
          rejectionReason.value
        )
        successMessage.value = 'Booking rejected'
        closeModals()
        await loadData()
      } catch (error) {
        console.error('Error rejecting booking:', error)
      }
    }

    const completeBookingConfirm = (booking) => {
      // Check if user has permission to complete
      if (authStore.currentUser?.role !== 'operator') {
        alert('❌ Only Operators can mark bookings')
        return
      }
      bookingToProcess.value = booking
      completionNotes.value = ''
      showCompleteModal.value = true
    }

    const completeBooking = async () => {
      try {
        await machineryStore.completeBooking(bookingToProcess.value.id, 'completed')
        successMessage.value = 'Booking marked as completed successfully.'
        closeModals()
        await loadData()
      } catch (error) {
        console.error('Error completing booking:', error)
      }
    }

    const incompleteBookingConfirm = (booking) => {
      // Check if user has permission
      if (authStore.currentUser?.role !== 'operator') {
        alert('❌ Only Operators can mark bookings')
        return
      }
      bookingToProcess.value = booking
      completionNotes.value = ''
      showCompleteModal.value = false
      showIncompleteModal.value = true
    }

    const markIncompleteBooking = async () => {
      if (!completionNotes.value) {
        alert('Please provide notes about the issues')
        return
      }
      try {
        await machineryStore.completeBooking(
          bookingToProcess.value.id, 
          'incomplete', 
          completionNotes.value
        )
        successMessage.value = 'Booking marked as incomplete. Issues noted.'
        closeModals()
        await loadData()
      } catch (error) {
        console.error('Error marking booking incomplete:', error)
      }
    }

    const closeModals = () => {
      showViewModal.value = false
      showApproveModal.value = false
      showRejectModal.value = false
      showCompleteModal.value = false
      showIncompleteModal.value = false
      bookingToProcess.value = null
      rejectionReason.value = ''
      completionNotes.value = ''
      machineryStore.clearSelection()
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

        'Completed': 'success',
        'Incomplete': 'warning',
        'Rejected': 'danger',
        'Cancelled': 'default'
      }
      return classes[status] || 'default'
    }

    const getPaymentStatusClass = (status) => {
      const classes = {
        'Unpaid': 'danger',
        'Partial': 'warning',
        'Paid': 'success'
      }
      return classes[status] || 'default'
    }

    const formatNumber = (num) => {
      return new Intl.NumberFormat('en-PH').format(num)
    }

    const formatDate = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const formatDateTime = (datetime) => {
      if (!datetime) return '-'
      return new Date(datetime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Lifecycle
    onMounted(() => {
      loadData()
    })

    return {
      // Stores
      authStore,
      // State
      showViewModal,
      showApproveModal,
      showRejectModal,
      showCompleteModal,
      showIncompleteModal,
      bookingToProcess,
      rejectionReason,
      completionNotes,
      successMessage,
      filters,
      approvalForm,
      todayDate,
      allBookings,
      // Computed
      bookings,
      loading,
      error,
      selectedBooking,
      pendingCount,
      approvedCount,
      rejectedCount,
      incompleteCount,
      completedCount,
      approvedTodayCount,
      rejectedTodayCount,
      totalBookingsCount,
      canApproveBookings,
      canCompleteBookings,
      isApprover,
      // Methods
      applyFilters,
      clearFilters,
      quickFilter,
      viewBooking,
      approveBookingConfirm,
      approveBooking,
      rejectBookingConfirm,
      rejectBooking,
      completeBookingConfirm,
      completeBooking,
      incompleteBookingConfirm,
      markIncompleteBooking,
      closeModals,
      clearError,
      getMachineryTypeClass,
      getBookingStatusClass,
      getPaymentStatusClass,
      formatNumber,
      formatDate,
      formatDateTime,
      activeFilter
    }
  }
}
</script>

<style scoped>
/* Reuse styles from previous components */
.machinery-approval-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
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
.stat-danger { border-left: 4px solid #ef4444; }
.stat-info { border-left: 4px solid #3b82f6; }
.stat-working { border-left: 4px solid #8b5cf6; }

.info-banner {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-left: 4px solid #3b82f6;
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #1e40af;
}

.banner-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
}

.banner-text strong {
  font-weight: 600;
}

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

.filter-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.quick-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.filter-btn {
  padding: 14px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.filter-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.filter-btn:hover::before {
  opacity: 1;
}

.filter-btn .btn-icon {
  font-size: 18px;
  transition: transform 0.3s;
}

.filter-btn:hover .btn-icon {
  transform: scale(1.2) rotate(5deg);
}

.filter-btn .btn-text {
  font-weight: 600;
  white-space: nowrap;
}

.filter-btn .btn-count {
  margin-left: 4px;
  padding: 2px 10px;
  background: #f3f4f6;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.3s;
}

.filter-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Specific button colors */
.filter-btn-pending:hover {
  border-color: #f59e0b;
  background: #fffbeb;
  color: #92400e;
}

.filter-btn-pending.active {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.filter-btn-approved:hover {
  border-color: #10b981;
  background: #ecfdf5;
  color: #065f46;
}

.filter-btn-approved.active {
  border-color: #10b981;
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
}

.filter-btn-in-use:hover {
  border-color: #8b5cf6;
  background: #faf5ff;
  color: #6d28d9;
}

.filter-btn-in-use.active {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
}

.filter-btn-completed:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1e40af;
}

.filter-btn-completed.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.filter-btn-rejected:hover {
  border-color: #ef4444;
  background: #fef2f2;
  color: #991b1b;
}

.filter-btn-rejected.active {
  border-color: #ef4444;
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
}

.filter-btn-incomplete:hover {
  border-color: #f59e0b;
  background: #fffbeb;
  color: #b45309;
}

.filter-btn-incomplete.active {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.filter-btn.active .btn-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.filter-btn:active {
  transform: translateY(-1px);
}

.table-container {
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

.farmer-info,
.machinery-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.farmer-info small,
.machinery-info small {
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
  margin-top: 4px;
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

.btn-icon-small.btn-success {
  background: #d1fae5;
  color: #065f46;
}

.btn-icon-small.btn-success:hover {
  background: #a7f3d0;
}

.btn-icon-small.btn-danger:hover {
  background: #fee2e2;
}

.btn-icon-small.btn-info {
  background: #dbeafe;
  color: #1e40af;
}

.btn-icon-small.btn-info:hover {
  background: #bfdbfe;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-success {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
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
  max-width: 450px;
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

.detail-item.full-width {
  grid-column: 1 / -1;
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
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.loading-cell,
.empty-cell {
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 350px;
  max-width: 500px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  z-index: 2000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
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

.alert-warning {
  background: #fef3c7;
  color: #92400e;
  border-left: 4px solid #f59e0b;
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

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.payment-info small {
  font-size: 11px;
  color: #666;
}

.form-section {
  margin: 20px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.form-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.payment-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-input {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.input-readonly {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.form-hint {
  font-size: 12px;
  color: #666;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-icon-small.btn-warning {
  background: #fef3c7;
  color: #92400e;
}

.btn-icon-small.btn-warning:hover {
  background: #fde68a;
}

.stat-card.stat-warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 4px solid #f59e0b;
}

.stat-card.stat-warning .stat-value {
  color: #92400e;
}

.stat-card.stat-working {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border-left: 4px solid #8b5cf6;
}

.stat-card.stat-working .stat-value {
  color: #6d28d9;
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.payment-info small {
  font-size: 11px;
  color: #666;
}

.payment-type-buttons {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.payment-type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #6b7280;
}

.payment-type-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.payment-type-btn.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  font-weight: 600;
}

.payment-type-btn .btn-icon {
  font-size: 24px;
}

.payment-type-btn .btn-text {
  font-size: 13px;
  text-align: center;
}

.input-error {
  border-color: #ef4444 !important;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

/* Button Styles */
.btn-payment {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border: none;
}

.btn-payment:hover {
  opacity: 0.9;
}

.btn-block {
  width: 100%;
  padding: 12px 16px;
}

/* Modal Styles */
.modal-subtitle {
  color: #6b7280;
  margin-bottom: 16px;
}

.modal-small {
  max-width: 400px;
}

.modal-medium {
  max-width: 600px;
}

.modal-large {
  max-width: 900px;
}
</style>
