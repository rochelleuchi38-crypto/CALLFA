<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">🌾 Talaan ng Kita ng mga Magsasaka</h1>
      <p class="page-subtitle">Mga naitatalang kita ng mga magsasaka sa iyong barangay</p>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error">
      <span>❌ {{ errorMessage }}</span>
      <button class="alert-close" @click="errorMessage = ''">&times;</button>
    </div>

    <!-- No barangay warning -->
    <div v-if="!currentUser?.barangay_id" class="alert alert-warning">
      ⚠️ Hindi ka naka-assign sa anumang barangay. Makipag-ugnayan sa admin.
    </div>

    <!-- Stats -->
    <div class="stats-grid" v-if="records.length > 0">
      <div class="stat-card">
        <div class="stat-icon">👨‍🌾</div>
        <div class="stat-content">
          <div class="stat-value">{{ uniqueFarmers }}</div>
          <div class="stat-label">Mga Magsasaka</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{{ records.length }}</div>
          <div class="stat-label">Mga Talaan</div>
        </div>
      </div>
      <div class="stat-card income-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">₱{{ totalGrossIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</div>
          <div class="stat-label">Kabuuang Benta</div>
        </div>
      </div>
      <div class="stat-card" :class="totalNetIncome >= 0 ? 'profit-card' : 'loss-card'">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">₱{{ totalNetIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</div>
          <div class="stat-label">Kabuuang Net</div>
        </div>
      </div>
    </div>

    <!-- Search / Filter -->
    <div class="filter-bar" v-if="records.length > 0">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Hanapin ayon sa pangalan ng magsasaka..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Kinukuha ang mga talaan...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="records.length === 0 && currentUser?.barangay_id" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>Wala pang naitatalang kita mula sa mga magsasaka sa iyong barangay.</p>
    </div>

    <!-- Records List -->
    <div v-else class="records-list">
      <div v-if="filteredRecords.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>Walang nahanap na talaan para sa "{{ searchQuery }}"</p>
      </div>
      <div
        v-for="record in filteredRecords"
        :key="record.id"
        class="record-card"
      >
        <div class="record-header">
          <div class="farmer-info">
            <span class="farmer-name">👨‍🌾 {{ record.farmer_name }}</span>
            <span class="record-date">📅 {{ formatDate(record.created_at) }}</span>
          </div>
          <button class="view-btn" @click="openRecordDetail(record)">👁️ Tingnan</button>
        </div>
        <div class="record-details">
          <div class="record-detail">
            <span class="detail-label">Lawak:</span>
            <span>{{ record.area_hectares }} ektarya</span>
          </div>
          <div class="record-detail">
            <span class="detail-label">Pagtatanim:</span>
            <span>{{ record.planting_method === 'sabog' ? 'Sabog' : 'Talok' }}</span>
          </div>
          <div class="record-detail">
            <span class="detail-label">Patubig:</span>
            <span>{{ formatIrrigation(record.irrigation_type) }}</span>
          </div>
          <div class="record-detail">
            <span class="detail-label">Ani:</span>
            <span>{{ record.sacks_harvested }} sako × {{ record.kg_per_sack }} kg @ ₱{{ record.price_per_kg }}/kg</span>
          </div>
        </div>
        <div class="record-financials">
          <div class="financial-item income">
            <span>Benta:</span>
            <span>₱{{ parseFloat(record.gross_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="financial-item expense">
            <span>Gastos:</span>
            <span>₱{{ parseFloat(record.total_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="financial-item" :class="parseFloat(record.net_income || 0) >= 0 ? 'profit' : 'loss'">
            <span>Net:</span>
            <span>₱{{ parseFloat(record.net_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW DETAIL MODAL -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>📋 Buong Detalye ng Talaan</h2>
            <button class="modal-close" @click="closeDetailModal">&times;</button>
          </div>
          <div class="modal-body" v-if="selectedRecord">

            <!-- Farmer Name Banner -->
            <div class="farmer-banner">
              <span class="banner-icon">👨‍🌾</span>
              <span class="banner-name">{{ selectedRecord.farmer_name }}</span>
            </div>

            <!-- Farm Info -->
            <div class="detail-section">
              <h3 class="detail-section-title">🌱 Detalye ng Taniman</h3>
              <div class="detail-grid">
                <div class="detail-cell">
                  <span class="cell-label">Petsa ng Talaan</span>
                  <span class="cell-value">{{ formatDate(selectedRecord.created_at) }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Lawak (Ektarya)</span>
                  <span class="cell-value">{{ selectedRecord.area_hectares }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Paraan ng Pagtatanim</span>
                  <span class="cell-value">{{ selectedRecord.planting_method === 'sabog' ? 'Sabog' : 'Talok' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Patubig</span>
                  <span class="cell-value">{{ formatIrrigation(selectedRecord.irrigation_type) }}</span>
                </div>
              </div>
            </div>

            <!-- Fertilizers -->
            <div class="detail-section" v-if="selectedRecord.fertilizers && selectedRecord.fertilizers.length > 0">
              <h3 class="detail-section-title">🧪 Mga Ginamit na Abono</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Klase</th>
                    <th>Sako</th>
                    <th>Presyo/Sako</th>
                    <th>Kabuuan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="f in selectedRecord.fertilizers" :key="f.id">
                    <td>{{ f.fertilizer_type }}</td>
                    <td>{{ f.sacks }}</td>
                    <td>₱{{ parseFloat(f.price_per_sack || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="amt">₱{{ parseFloat(f.line_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="foot-label">Kabuuang Abono:</td>
                    <td class="foot-value">₱{{ parseFloat(selectedRecord.total_fertilizer_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="detail-section" v-else>
              <h3 class="detail-section-title">🧪 Mga Ginamit na Abono</h3>
              <p class="no-data">Walang naitalang abono.</p>
            </div>

            <!-- Pesticides -->
            <div class="detail-section" v-if="selectedRecord.pesticides && selectedRecord.pesticides.length > 0">
              <h3 class="detail-section-title">🧴 Mga Ginamit na Lason</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Klase</th>
                    <th>Bilang</th>
                    <th>Presyo/Unit</th>
                    <th>Kabuuan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in selectedRecord.pesticides" :key="p.id">
                    <td>{{ p.pesticide_type }}</td>
                    <td>{{ p.quantity }}</td>
                    <td>₱{{ parseFloat(p.price_per_unit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="amt">₱{{ parseFloat(p.line_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="foot-label">Kabuuang Lason:</td>
                    <td class="foot-value">₱{{ parseFloat(selectedRecord.total_pesticide_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="detail-section" v-else>
              <h3 class="detail-section-title">🧴 Mga Ginamit na Lason</h3>
              <p class="no-data">Walang naitalang lason.</p>
            </div>

            <!-- Labor & Expenses -->
            <div class="detail-section">
              <h3 class="detail-section-title">👷 Gastos sa Labor at Iba Pa</h3>
              <div class="expense-grid">
                <div class="expense-row">
                  <span>Paghahanda ng Lupa</span>
                  <span>₱{{ parseFloat(selectedRecord.land_preparation_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bunot / Talok / Hasik</span>
                  <span>₱{{ parseFloat(selectedRecord.planting_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Pagspray / Pagsabog ng Abono</span>
                  <span>₱{{ parseFloat(selectedRecord.spraying_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bayad sa Harvester</span>
                  <span>₱{{ parseFloat(selectedRecord.harvester_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bayad sa Pagbibilad</span>
                  <span>₱{{ parseFloat(selectedRecord.drying_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bayad sa Paghakot</span>
                  <span>₱{{ parseFloat(selectedRecord.hauling_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Tarasko</span>
                  <span>₱{{ parseFloat(selectedRecord.tarasko_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Krudo</span>
                  <span>₱{{ parseFloat(selectedRecord.fuel_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Iba Pang Gastos</span>
                  <span>₱{{ parseFloat(selectedRecord.other_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row total-row">
                  <span>Kabuuang Labor:</span>
                  <span>₱{{ parseFloat(selectedRecord.total_labor_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>

            <!-- Harvest -->
            <div class="detail-section">
              <h3 class="detail-section-title">🌾 Ani</h3>
              <div class="detail-grid">
                <div class="detail-cell">
                  <span class="cell-label">Sako na Naani</span>
                  <span class="cell-value">{{ selectedRecord.sacks_harvested }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Kilo Kada Sako</span>
                  <span class="cell-value">{{ selectedRecord.kg_per_sack }} kg</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Presyo Kada Kilo</span>
                  <span class="cell-value">₱{{ parseFloat(selectedRecord.price_per_kg || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Kabuuang Ani</span>
                  <span class="cell-value">{{ (parseFloat(selectedRecord.sacks_harvested || 0) * parseFloat(selectedRecord.kg_per_sack || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} kg</span>
                </div>
              </div>
            </div>

            <!-- Grand Summary -->
            <div class="detail-section summary-detail-section">
              <h3 class="detail-section-title">📊 Buod</h3>
              <div class="grand-summary">
                <div class="grand-row income-row">
                  <span>Kabuuang Benta</span>
                  <span>₱{{ parseFloat(selectedRecord.gross_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="grand-row expense-summary-row">
                  <span>Kabuuang Gastos</span>
                  <span>₱{{ parseFloat(selectedRecord.total_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="grand-row" :class="parseFloat(selectedRecord.net_income || 0) >= 0 ? 'net-profit-row' : 'net-loss-row'">
                  <span>Netong Kita</span>
                  <span>₱{{ parseFloat(selectedRecord.net_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn-close-modal" @click="closeDetailModal">Isara</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)

const errorMessage = ref('')
const loading = ref(false)
const records = ref([])
const searchQuery = ref('')
const showDetailModal = ref(false)
const selectedRecord = ref(null)

// Stats
const uniqueFarmers = computed(() => {
  const ids = new Set(records.value.map(r => r.farmer_id))
  return ids.size
})
const totalGrossIncome = computed(() =>
  records.value.reduce((sum, r) => sum + parseFloat(r.gross_income || 0), 0)
)
const totalNetIncome = computed(() =>
  records.value.reduce((sum, r) => sum + parseFloat(r.net_income || 0), 0)
)

// Filter
const filteredRecords = computed(() => {
  if (!searchQuery.value.trim()) return records.value
  const q = searchQuery.value.toLowerCase()
  return records.value.filter(r =>
    (r.farmer_name || '').toLowerCase().includes(q)
  )
})

// Fetch records by barangay
const fetchRecords = async () => {
  if (!currentUser.value?.barangay_id) return
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch(`/api/farmer-income/by-barangay/${currentUser.value.barangay_id}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Hindi makuha ang mga talaan.')
    records.value = data
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}

// Modal
const openRecordDetail = (record) => {
  selectedRecord.value = record
  showDetailModal.value = true
}
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedRecord.value = null
}

// Helpers
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fil-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
const formatIrrigation = (type) => {
  const map = {
    'NIA': 'NIA',
    'bugsok_waterpump': 'Bugsok na Waterpump',
    'waterpump_irrigation': 'Waterpump na Nakalawit sa Irrigation',
    'waterpump_ilog': 'Waterpump na Nakalawit sa Ilog'
  }
  return map[type] || type
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.page-container {
  max-width: 1000px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 1.5rem;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #166534;
  margin: 0 0 0.25rem 0;
}
.page-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

/* Alerts */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}
.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
.alert-warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}
.alert-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.stat-icon {
  font-size: 1.75rem;
}
.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}
.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
}
.income-card { border-left: 4px solid #2563eb; }
.profit-card { border-left: 4px solid #16a34a; }
.loss-card { border-left: 4px solid #dc2626; }

/* Filter */
.filter-bar {
  margin-bottom: 1.25rem;
}
.search-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 0.75rem;
  max-width: 400px;
}
.search-icon {
  font-size: 1rem;
  margin-right: 0.5rem;
}
.search-input {
  flex: 1;
  border: none;
  padding: 0.55rem 0;
  font-size: 0.9rem;
  outline: none;
  background: transparent;
}

/* Loading / Empty */
.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

/* Records */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.record-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.farmer-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.farmer-name {
  font-weight: 700;
  color: #166534;
  font-size: 1rem;
}
.record-date {
  font-size: 0.8rem;
  color: #6b7280;
}
.view-btn {
  padding: 0.35rem 0.85rem;
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}
.view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(22, 101, 52, 0.35);
}
.record-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.record-detail {
  font-size: 0.85rem;
  color: #4b5563;
}
.detail-label {
  font-weight: 600;
  margin-right: 0.25rem;
}
.record-financials {
  display: flex;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}
.financial-item {
  display: flex;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
}
.financial-item.income { color: #2563eb; }
.financial-item.expense { color: #dc2626; }
.financial-item.profit { color: #166534; }
.financial-item.loss { color: #dc2626; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}
.modal-container {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}
.modal-close {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.modal-close:hover {
  background: rgba(255,255,255,0.35);
}
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}
.btn-close-modal {
  padding: 0.55rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-close-modal:hover {
  background: #e5e7eb;
}

/* Farmer Banner in Modal */
.farmer-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
}
.banner-icon {
  font-size: 1.5rem;
}
.banner-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #166534;
}

/* Detail Sections */
.detail-section {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}
.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
.detail-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #166534;
  margin: 0 0 0.75rem 0;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.detail-cell {
  background: #f9fafb;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
}
.cell-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.15rem;
}
.cell-value {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
}

/* Detail Tables */
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.detail-table th {
  background: #f0fdf4;
  color: #166534;
  font-weight: 600;
  padding: 0.5rem 0.6rem;
  text-align: left;
  border-bottom: 2px solid #bbf7d0;
}
.detail-table td {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid #f3f4f6;
}
.detail-table .amt {
  font-weight: 600;
  color: #166534;
}
.detail-table .foot-label {
  text-align: right;
  font-weight: 700;
  color: #374151;
  padding-top: 0.6rem;
}
.detail-table .foot-value {
  font-weight: 700;
  color: #166534;
  padding-top: 0.6rem;
}
.no-data {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.85rem;
  margin: 0;
}

/* Expense Grid */
.expense-grid {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.expense-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.85rem;
}
.expense-row.total-row {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  font-weight: 700;
  color: #166534;
  margin-top: 0.35rem;
}

/* Grand Summary */
.summary-detail-section {
  background: #f0fdf4;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #86efac;
}
.grand-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.grand-row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
}
.income-row {
  background: #eff6ff;
  color: #2563eb;
}
.expense-summary-row {
  background: #fef2f2;
  color: #dc2626;
}
.net-profit-row {
  background: #dcfce7;
  color: #166534;
  font-size: 1.05rem;
}
.net-loss-row {
  background: #fee2e2;
  color: #dc2626;
  font-size: 1.05rem;
}

/* Responsive */
@media (max-width: 768px) {
  .record-details {
    grid-template-columns: 1fr;
  }
  .record-financials {
    flex-direction: column;
    gap: 0.5rem;
  }
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
