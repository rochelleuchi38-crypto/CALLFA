<template>
  <div class="financial-container">
    <div class="page-header">
      <div class="header-content">
        <h1>💰 Machinery Financial Management</h1>
        <p class="page-subtitle">Record expenses, income, and manage profit distribution</p>
      </div>
    </div>

    <!-- Access Denied Message -->
    <div v-if="!hasAccess" class="access-denied">
      <div class="denied-content">
        <p class="denied-icon">🔒</p>
        <p class="denied-text">Access Denied</p>
        <p class="denied-reason">Only Admin, President, Treasurer, and Auditor can access this section.</p>
      </div>
    </div>

    <div v-else>
      <!-- Barangay Context Display -->
      <div v-if="!isAdmin" class="barangay-context">
        <span class="context-badge">📍 {{ userRole === 'treasurer' ? 'Managing' : 'Viewing' }} financial data for your assigned barangay</span>
      </div>
      <div v-else class="barangay-context admin-context">
        <span class="context-badge">🌐 Admin View</span>
        <div class="admin-filter">
          <label for="barangay-select">Filter by Barangay:</label>
          <select id="barangay-select" v-model="selectedBarangayId" class="barangay-select">
            <option value="">All Barangays (Consolidated)</option>
            <option v-for="b in barangays" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
      </div>
      
      <!-- Financial Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card income-card">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <span class="card-label">Total Income</span>
            <span class="card-amount">₱{{ formatNumber(profitSummary.total_income) }}</span>
          </div>
        </div>
        <div class="summary-card expense-card">
          <div class="card-icon">📉</div>
          <div class="card-content">
            <span class="card-label">Total Expenses</span>
            <span class="card-amount">₱{{ formatNumber(profitSummary.total_expenses) }}</span>
          </div>
        </div>
        <div class="summary-card profit-card" :class="{ negative: profitSummary.net_profit < 0 }">
          <div class="card-icon">💵</div>
          <div class="card-content">
            <span class="card-label">Net Profit</span>
            <span class="card-amount">₱{{ formatNumber(profitSummary.net_profit) }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- TAB 1: EXPENSES MANAGEMENT -->
      <div v-if="activeTab === 'expenses'" class="tab-content">
        <div class="section-header">
          <h2>📝 Expense Management</h2>
          <button v-if="canManage" @click="showExpenseForm = true" class="btn-primary">+ Record Expense</button>
          <span v-else class="view-only-badge">👁️ View Only</span>
        </div>

        <!-- Expense Filters -->
        <div class="filters-section">
          <div class="filter-group">
            <label class="filter-label">Machinery/Equipment:</label>
            <select v-model="filters.machinery_id" class="filter-input">
              <option value="">All Machinery/Equipment</option>
              <option v-for="m in machinery" :key="m.id" :value="m.id">
                {{ m.machinery_name }} ({{ m.machinery_type }})
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Start Date:</label>
            <input v-model="filters.start_date" type="date" class="filter-input" />
          </div>
          <div class="filter-group">
            <label class="filter-label">End Date:</label>
            <input v-model="filters.end_date" type="date" class="filter-input" />
          </div>
          <button @click="loadExpenses" class="btn-secondary">Filter</button>
          <button @click="clearFilters" class="btn-secondary-outline">Clear</button>
        </div>

        <!-- Expenses Table -->
        <div class="table-container">
          <table class="expenses-table">
            <thead>
              <tr>
                <th>Machinery/Equipment</th>
                <th>Date</th>
                <th>Particulars</th>
                <th>Ref. No.</th>
                <th>Fuel & Oil</th>
                <th>Labor</th>
                <th>Per Diem</th>
                <th>Repair & Maint.</th>
                <th>Office Supply</th>
                <th>Communication</th>
                <th>Utilities</th>
                <th>Sundries</th>
                <th>Total</th>
                <th v-if="canManage">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in filteredExpenses" :key="expense.id">
                <td><strong>{{ expense.machinery_name }}</strong></td>
                <td>{{ formatDate(expense.date_of_expense) }}</td>
                <td>{{ expense.particulars }}</td>
                <td>{{ expense.reference_number || '-' }}</td>
                <td>₱{{ formatNumber(expense.fuel_and_oil) }}</td>
                <td>₱{{ formatNumber(expense.labor_cost) }}</td>
                <td>₱{{ formatNumber(expense.per_diem) }}</td>
                <td>₱{{ formatNumber(expense.repair_and_maintenance) }}</td>
                <td>₱{{ formatNumber(expense.office_supply) }}</td>
                <td>₱{{ formatNumber(expense.communication_expense) }}</td>
                <td>₱{{ formatNumber(expense.utilities_expense) }}</td>
                <td>₱{{ formatNumber(expense.sundries) }}</td>
                <td class="amount-cell">₱{{ formatNumber(expense.total_amount) }}</td>
                <td v-if="canManage" class="actions-cell">
                  <button @click="editExpense(expense)" class="btn-edit" title="Edit">✏️</button>
                  <button @click="deleteExpense(expense.id)" class="btn-delete" title="Delete">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredExpenses.length === 0" class="empty-state">
            <p>{{ filters.machinery_id ? 'No expenses for selected machinery' : 'No expenses recorded yet' }}</p>
          </div>
        </div>
      </div>

      <!-- TAB 2: INCOME MANAGEMENT -->
      <div v-if="activeTab === 'income'" class="tab-content">
        <div class="section-header">
          <h2>💹 Income Management (Auto-Populated from Completed Bookings)</h2>
        </div>

        <!-- Income Filters -->
        <div class="filters-section">
          <div class="filter-group">
            <label class="filter-label">Machinery/Equipment:</label>
            <select v-model="filters.machinery_id" class="filter-input">
              <option value="">All Machinery/Equipment</option>
              <option v-for="m in machinery" :key="m.id" :value="m.id">
                {{ m.machinery_name }} ({{ m.machinery_type }})
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Start Date:</label>
            <input v-model="filters.start_date" type="date" class="filter-input" />
          </div>
          <div class="filter-group">
            <label class="filter-label">End Date:</label>
            <input v-model="filters.end_date" type="date" class="filter-input" />
          </div>
          <button @click="loadIncome" class="btn-secondary">Filter</button>
          <button @click="clearFilters" class="btn-secondary-outline">Clear</button>
        </div>

        <p class="info-text">💡 Income is automatically generated from completed machinery bookings with partial or full payments.</p>

        <!-- Income Table -->
        <div class="table-container">
          <table class="income-table">
            <thead>
              <tr>
                <th>Farmer Name</th>
                <th>Machinery/Equipment</th>
                <th>Booking Date</th>
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Payment Status</th>
                <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inc in income" :key="inc.booking_id">
                <td><strong>{{ inc.farmer_name }}</strong></td>
                <td>{{ inc.machinery_name }} ({{ inc.machinery_type }})</td>
                <td>{{ formatDate(inc.booking_date) }}</td>
                <td class="amount-cell">₱{{ formatNumber(inc.original_amount) }}</td>
                <td class="amount-cell">₱{{ formatNumber(inc.income_amount) }}</td>
                <td>
                  <span :class="['status-badge', inc.payment_status.toLowerCase().replace(' ', '-')]">
                    {{ inc.payment_status }}
                  </span>
                </td>
                <td>{{ formatDate(inc.date_of_income) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="income.length === 0" class="empty-state">
            <p>No income records yet</p>
          </div>
        </div>
      </div>

      <!-- TAB 3: ACCOUNTS RECEIVABLE & COLLECTIONS -->
      <div v-if="activeTab === 'ar'" class="tab-content">
        <div class="section-header">
          <h2>📋 Accounts Receivable & Collections</h2>
        </div>

        <!-- A/R Summary Cards -->
        <div class="summary-container">
          <div class="summary-card ar-card">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <span class="card-label">Total Receivables</span>
              <span class="card-amount">₱{{ formatNumber(collectionsSummary.total_receivables) }}</span>
            </div>
          </div>
          <div class="summary-card collected-card">
            <div class="card-icon">💰</div>
            <div class="card-content">
              <span class="card-label">Total Collected</span>
              <span class="card-amount">₱{{ formatNumber(collectionsSummary.total_collected) }}</span>
            </div>
          </div>
          <div class="summary-card balance-card">
            <div class="card-icon">⚠️</div>
            <div class="card-content">
              <span class="card-label">Outstanding Balance</span>
              <span class="card-amount">₱{{ formatNumber(collectionsSummary.total_balance) }}</span>
            </div>
          </div>
        </div>

        <!-- Collections Filter -->
        <div class="filters-section">
          <div class="filter-group">
            <label class="filter-label">Machinery/Equipment:</label>
            <select v-model="filters.machinery_id" class="filter-input">
              <option value="">All Machinery/Equipment</option>
              <option v-for="m in machinery" :key="m.id" :value="m.id">
                {{ m.machinery_name }} ({{ m.machinery_type }})
              </option>
            </select>
          </div>
          <button @click="loadARData" class="btn-secondary">Filter</button>
          <button @click="clearFilters" class="btn-secondary-outline">Clear</button>
        </div>

        <!-- A/R List -->
        <div class="ar-section">
          <div class="section-subheader">
            <h3>📑 List of Collectibles (Accounts Receivable)</h3>
            <span v-if="isViewOnly" class="view-only-badge">👁️ View Only</span>
          </div>
          <div class="table-container">
            <table class="ar-table">
              <thead>
                <tr>
                  <th>Farmer Name</th>
                  <th>Machinery</th>
                  <th>Booking Date</th>
                  <th>Accounts Receivable</th>
                  <th>Cash Collected</th>
                  <th>Remaining Balance</th>
                  <th v-if="canManage">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ar in arList" :key="ar.id" :data-booking-id="ar.id" :class="{ 'notification-highlight-row': highlightedBookingId == ar.id }">
                  <td>{{ ar.farmer_name }}</td>
                  <td>{{ ar.machinery_name }}</td>
                  <td>{{ formatDate(ar.booking_date) }}</td>
                  <td class="amount-cell">₱{{ formatNumber(ar.total_price) }}</td>
                  <td class="amount-cell">₱{{ formatNumber(ar.amount_collected || 0) }}</td>
                  <td class="amount-cell balance" :class="{ highlight: ar.remaining_balance > 0 }">
                    ₱{{ formatNumber(ar.total_price - (ar.amount_collected || 0)) }}
                  </td>
                  <td v-if="canManage" class="actions-cell">
                    <button @click="recordCollection(ar)" class="btn-primary-small" title="Record Payment">💳</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="arList.length === 0" class="empty-state">
              <p>No outstanding receivables</p>
            </div>
          </div>
        </div>

        <!-- Collections Transactions -->
        <div class="collections-section">
          <div class="section-subheader">
            <h3>💵 Collections Transactions</h3>
          </div>
          <div class="table-container">
            <table class="collections-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Farmer</th>
                  <th>Machinery</th>
                  <th>Collection Amount</th>
                  <th>Receipt Number</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="col in collections" :key="col.id">
                  <td>{{ formatDate(col.collection_date) }}</td>
                  <td>{{ col.farmer_name }}</td>
                  <td>{{ col.machinery_name }}</td>
                  <td class="amount-cell">₱{{ formatNumber(col.collection_amount) }}</td>
                  <td>{{ col.receipt_number || '-' }}</td>
                  <td>{{ col.remarks || '-' }}</td>
                  <!-- Delete button removed to prevent income data inconsistencies -->
                </tr>
              </tbody>
            </table>
            <div v-if="collections.length === 0" class="empty-state">
              <p>No collections recorded yet</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: PROFIT COMPUTATION -->
      <div v-if="activeTab === 'profit'" class="tab-content">
        <div class="section-header">
          <h2>📊 Profit Computation & Distribution</h2>
        </div>

        <div class="profit-breakdown">
          <div class="breakdown-card">
            <h3>Income Breakdown</h3>
            <p class="amount">₱{{ formatNumber(profitSummary.total_income) }}</p>
          </div>

          <div class="breakdown-card">
            <h3>Expense Breakdown</h3>
            <div class="expense-items">
              <div class="expense-item">
                <span>Fuel & Oil</span>
                <span>₱{{ formatNumber(expenseBreakdown.fuel_and_oil || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Labor Cost</span>
                <span>₱{{ formatNumber(expenseBreakdown.labor_cost || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Per Diem</span>
                <span>₱{{ formatNumber(expenseBreakdown.per_diem || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Repair & Maintenance</span>
                <span>₱{{ formatNumber(expenseBreakdown.repair_and_maintenance || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Office Supply</span>
                <span>₱{{ formatNumber(expenseBreakdown.office_supply || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Communication</span>
                <span>₱{{ formatNumber(expenseBreakdown.communication_expense || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Utilities</span>
                <span>₱{{ formatNumber(expenseBreakdown.utilities_expense || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Sundries</span>
                <span>₱{{ formatNumber(expenseBreakdown.sundries || 0) }}</span>
              </div>
              <div class="expense-item total">
                <span>Total Expenses</span>
                <span>₱{{ formatNumber(expenseBreakdown.total || 0) }}</span>
              </div>
            </div>
          </div>

          <div class="breakdown-card profit">
            <h3>Net Profit</h3>
            <p class="amount" :class="{ negative: profitSummary.net_profit < 0 }">
              ₱{{ formatNumber(profitSummary.net_profit) }}
            </p>
          </div>
        </div>

        <!-- Profit Distribution Breakdown -->
        <div v-if="profitSummary.net_profit > 0" class="profit-distribution-section">
          <h3>💰 Profit Distribution Allocation</h3>
          <p class="info-text">Net profit is distributed as follows:</p>
          
          <div class="distribution-grid">
            <div class="distribution-card org">
              <div class="distribution-icon">🏛️</div>
              <div class="distribution-content">
                <h4>Organization</h4>
                <p class="percentage">30%</p>
                <p class="amount">₱{{ formatNumber(profitDistribution.organization) }}</p>
              </div>
            </div>

            <div class="distribution-card training">
              <div class="distribution-icon">📚</div>
              <div class="distribution-content">
                <h4>Training & Development</h4>
                <p class="percentage">20%</p>
                <p class="amount">₱{{ formatNumber(profitDistribution.training) }}</p>
              </div>
            </div>

            <div class="distribution-card members">
              <div class="distribution-icon">👥</div>
              <div class="distribution-content">
                <h4>Members Distribution</h4>
                <p class="percentage">50%</p>
                <p class="amount">₱{{ formatNumber(profitDistribution.members) }}</p>
                <p v-if="totalMembers > 0" class="per-member">
                  Per Member: ₱{{ formatNumber(profitDistribution.per_member) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="profitSummary.net_profit === 0" class="empty-state">
          <p>No profit to distribute (Income = Expenses)</p>
        </div>

        <div v-else class="empty-state">
          <p>⚠️ Loss detected (Expenses > Income)</p>
        </div>
      </div>

      <!-- TAB 5: REPORTS -->
      <div v-if="activeTab === 'reports'" class="tab-content">
        <div class="section-header">
          <h2>📋 Financial Reports</h2>
        </div>
        
        <!-- Report Generation Panel -->
        <div class="report-generator-panel">
          <div class="report-options-grid">
            <!-- Report Type Selection -->
            <div class="report-option-card">
              <h4>📅 Report Period</h4>
              <div class="report-type-buttons">
                <button @click="generateReport('monthly')" class="report-type-btn" :class="{ active: reportData?.type === 'monthly' }" :disabled="reportLoading">
                  <span class="btn-icon">📅</span>
                  <span class="btn-text">Monthly</span>
                </button>
                <button @click="generateReport('quarterly')" class="report-type-btn" :class="{ active: reportData?.type === 'quarterly' }" :disabled="reportLoading">
                  <span class="btn-icon">📆</span>
                  <span class="btn-text">Quarterly</span>
                </button>
                <button @click="generateReport('annual')" class="report-type-btn" :class="{ active: reportData?.type === 'annual' }" :disabled="reportLoading">
                  <span class="btn-icon">📊</span>
                  <span class="btn-text">Annual</span>
                </button>
              </div>
              
              <!-- Custom Date Range -->
              <div class="custom-date-toggle">
                <label class="checkbox-inline">
                  <input type="checkbox" v-model="reportFilters.customDateRange" />
                  <span>Custom Date Range</span>
                </label>
              </div>
              <div v-if="reportFilters.customDateRange" class="custom-date-inputs">
                <div class="date-input-group">
                  <label>From:</label>
                  <input type="date" v-model="reportFilters.startDate" class="form-input-sm" />
                </div>
                <div class="date-input-group">
                  <label>To:</label>
                  <input type="date" v-model="reportFilters.endDate" class="form-input-sm" />
                </div>
                <button @click="generateReportCustom" class="btn-generate" :disabled="reportLoading || !reportFilters.startDate || !reportFilters.endDate">
                  {{ reportLoading ? '⏳ Generating...' : '🔍 Generate' }}
                </button>
              </div>
            </div>
            
            <!-- Report Sections Filter -->
            <div class="report-option-card">
              <h4>📑 Include in Report</h4>
              <div class="filter-checkboxes">
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showSummary" />
                  <span>📊 Summary Cards</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showDistribution" />
                  <span>💰 Profit Distribution</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showAllTransactions" />
                  <span>📝 All Transactions</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showExpenses" />
                  <span>📤 Expense Details</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showCollections" />
                  <span>💵 Collection Details</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showBookings" />
                  <span>📅 Bookings Summary</span>
                </label>
              </div>
            </div>
            
            <!-- Print/Export Actions -->
            <div class="report-option-card actions-card">
              <h4>🖨️ Export Options</h4>
              <div class="action-buttons">
                <button @click="printReport" class="btn-action print" :disabled="!reportData">
                  <span class="btn-icon">🖨️</span>
                  <span>Print Report</span>
                </button>
                <button class="btn-action select-all" @click="selectAllFilters">
                  <span class="btn-icon">✅</span>
                  <span>Select All</span>
                </button>
                <button class="btn-action clear" @click="clearAllFilters">
                  <span class="btn-icon">❌</span>
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="reportLoading" class="report-loading">
          <div class="loading-spinner"></div>
          <p>Generating report...</p>
        </div>
        
        <!-- Report Display -->
        <div v-if="reportData && !reportLoading" class="report-display" id="printable-report">
          <!-- Report Header -->
          <div class="report-header">
            <div class="report-logo">
              <span class="logo-icon">🌾</span>
              <div class="logo-text">
                <h3>CALFFA Cooperative</h3>
                <p>Machinery Financial Report</p>
              </div>
            </div>
            <div class="report-meta">
              <h3>{{ reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1) }} Transaction Report</h3>
              <p class="report-period">
                <strong>Period:</strong> {{ formatReportDate(reportData.period.start) }} - {{ formatReportDate(reportData.period.end) }}
              </p>
              <p class="report-generated">
                Generated: {{ formatReportDate(reportData.generated_at) }}
              </p>
            </div>
          </div>
          
          <!-- Summary Cards -->
          <div v-if="reportFilters.showSummary" class="report-summary-grid">
            <div class="summary-card expense-card">
              <div class="card-icon-wrapper expense">📤</div>
              <div class="card-details">
                <span class="summary-label">Total Expenses</span>
                <span class="summary-value">₱{{ reportData.summary.total_expenses.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span class="summary-count">{{ reportData.counts.expenses }} records</span>
              </div>
            </div>
            <div class="summary-card income-card">
              <div class="card-icon-wrapper income">📥</div>
              <div class="card-details">
                <span class="summary-label">Total Income</span>
                <span class="summary-value">₱{{ reportData.summary.total_income.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span class="summary-count">{{ reportData.counts.income }} records</span>
              </div>
            </div>
            <div class="summary-card collection-card">
              <div class="card-icon-wrapper collection">💵</div>
              <div class="card-details">
                <span class="summary-label">Total Collections</span>
                <span class="summary-value">₱{{ reportData.summary.total_collections.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span class="summary-count">{{ reportData.counts.collections }} payments</span>
              </div>
            </div>
            <div class="summary-card" :class="reportData.summary.net_profit >= 0 ? 'profit-card' : 'loss-card'">
              <div class="card-icon-wrapper" :class="reportData.summary.net_profit >= 0 ? 'profit' : 'loss'">
                {{ reportData.summary.net_profit >= 0 ? '📈' : '📉' }}
              </div>
              <div class="card-details">
                <span class="summary-label">Net Profit/Loss</span>
                <span class="summary-value">₱{{ reportData.summary.net_profit.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span class="summary-count">{{ reportData.summary.net_profit >= 0 ? '✓ Profit' : '✗ Loss' }}</span>
              </div>
            </div>
          </div>
          
          <!-- Distribution Summary (only if profit) -->
          <div v-if="reportFilters.showDistribution && reportData.summary.net_profit > 0" class="distribution-summary">
            <h4>💰 Profit Distribution Breakdown</h4>
            <div class="distribution-grid">
              <div class="dist-item org">
                <div class="dist-icon">🏢</div>
                <div class="dist-details">
                  <span class="dist-label">Organization (30%)</span>
                  <span class="dist-value">₱{{ reportData.summary.distribution.organization_share.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
              <div class="dist-item training">
                <div class="dist-icon">📚</div>
                <div class="dist-details">
                  <span class="dist-label">Training (20%)</span>
                  <span class="dist-value">₱{{ reportData.summary.distribution.training_share.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
              <div class="dist-item members">
                <div class="dist-icon">👥</div>
                <div class="dist-details">
                  <span class="dist-label">Members (50%)</span>
                  <span class="dist-value">₱{{ reportData.summary.distribution.members_share.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
              <div class="dist-item per-member highlight">
                <div class="dist-icon">👤</div>
                <div class="dist-details">
                  <span class="dist-label">Per Member ({{ reportData.summary.distribution.member_count }} members)</span>
                  <span class="dist-value">₱{{ reportData.summary.distribution.per_member_share.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- All Transactions Table -->
          <div v-if="reportFilters.showAllTransactions" class="report-transactions report-section-card">
            <div class="section-title">
              <span class="section-icon">📝</span>
              <h4>All Transactions</h4>
              <span class="section-count">{{ reportData.transactions.all.length }} records</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Machinery</th>
                    <th>Description</th>
                    <th>Farmer</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="txn in reportData.transactions.all" :key="txn.id + '-' + txn.transaction_type">
                    <td>{{ formatReportDate(txn.date) }}</td>
                    <td>
                      <span class="badge" :class="getTransactionTypeClass(txn.transaction_type)">
                        {{ txn.transaction_type }}
                      </span>
                    </td>
                    <td>{{ txn.machinery_name || '-' }}</td>
                    <td class="description-cell">{{ txn.description || '-' }}</td>
                    <td>{{ txn.farmer_name || '-' }}</td>
                    <td class="text-right" :class="txn.transaction_type === 'Expense' ? 'text-red' : 'text-green'">
                      {{ txn.transaction_type === 'Expense' ? '-' : '+' }}₱{{ parseFloat(txn.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                    </td>
                  </tr>
                  <tr v-if="reportData.transactions.all.length === 0">
                    <td colspan="6" class="empty-cell">No transactions found for this period</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Detailed Expenses Table -->
          <div v-if="reportFilters.showExpenses && reportData.transactions.expenses.length > 0" class="report-section report-section-card">
            <div class="section-title">
              <span class="section-icon">📤</span>
              <h4>Expense Details</h4>
              <span class="section-count">{{ reportData.transactions.expenses.length }} records</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Machinery</th>
                    <th>Particulars</th>
                    <th>Ref #</th>
                    <th class="text-right">Fuel & Oil</th>
                    <th class="text-right">Labor</th>
                    <th class="text-right">Per Diem</th>
                    <th class="text-right">R&M</th>
                    <th class="text-right">Others</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="exp in reportData.transactions.expenses" :key="'exp-' + exp.id">
                    <td>{{ formatReportDate(exp.date) }}</td>
                    <td>{{ exp.machinery_name || '-' }}</td>
                    <td class="description-cell">{{ exp.description || '-' }}</td>
                    <td>{{ exp.reference_number || '-' }}</td>
                    <td class="text-right">₱{{ parseFloat(exp.fuel_and_oil || 0).toLocaleString() }}</td>
                    <td class="text-right">₱{{ parseFloat(exp.labor_cost || 0).toLocaleString() }}</td>
                    <td class="text-right">₱{{ parseFloat(exp.per_diem || 0).toLocaleString() }}</td>
                    <td class="text-right">₱{{ parseFloat(exp.repair_and_maintenance || 0).toLocaleString() }}</td>
                    <td class="text-right">₱{{ (parseFloat(exp.office_supply || 0) + parseFloat(exp.communication_expense || 0) + parseFloat(exp.utilities_expense || 0) + parseFloat(exp.sundries || 0)).toLocaleString() }}</td>
                    <td class="text-right text-red">₱{{ parseFloat(exp.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="9"><strong>Total Expenses</strong></td>
                    <td class="text-right text-red"><strong>₱{{ reportData.summary.total_expenses.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Collections Table -->
          <div v-if="reportFilters.showCollections && reportData.transactions.collections.length > 0" class="report-section report-section-card">
            <div class="section-title">
              <span class="section-icon">💵</span>
              <h4>Collection Details</h4>
              <span class="section-count">{{ reportData.transactions.collections.length }} payments</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Booking #</th>
                    <th>Farmer</th>
                    <th>Type</th>
                    <th>Receipt No.</th>
                    <th class="text-right">Amount</th>
                    <th class="text-right">Interest</th>
                    <th>Season</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="col in reportData.transactions.collections" :key="'col-' + col.id">
                    <td>{{ formatReportDate(col.date) }}</td>
                    <td>#{{ col.booking_id }}</td>
                    <td>{{ col.farmer_name || '-' }}</td>
                    <td>
                      <span class="badge" :class="col.payment_type === 'full' ? 'badge-full' : 'badge-partial'">
                        {{ col.payment_type === 'full' ? 'Full' : 'Partial' }}
                      </span>
                    </td>
                    <td>{{ col.receipt_number || '-' }}</td>
                    <td class="text-right text-green">₱{{ parseFloat(col.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="text-right">{{ col.interest_applied ? '₱' + parseFloat(col.interest_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '-' }}</td>
                    <td>{{ col.interest_season ? 'Season ' + col.interest_season : '-' }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="5"><strong>Total Collections</strong></td>
                    <td class="text-right text-green"><strong>₱{{ reportData.summary.total_collections.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</strong></td>
                    <td class="text-right"><strong>₱{{ reportData.summary.total_interest_collected.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Bookings Summary -->
          <div v-if="reportFilters.showBookings && reportData.transactions.bookings.length > 0" class="report-section report-section-card">
            <div class="section-title">
              <span class="section-icon">📅</span>
              <h4>Bookings Summary</h4>
              <span class="section-count">{{ reportData.transactions.bookings.length }} bookings</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Booking #</th>
                    <th>Machinery</th>
                    <th>Farmer</th>
                    <th>Status</th>
                    <th class="text-right">Total Price</th>
                    <th class="text-right">Paid</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bk in reportData.transactions.bookings" :key="'bk-' + bk.id">
                    <td>{{ formatReportDate(bk.date) }}</td>
                    <td>#{{ bk.booking_id }}</td>
                    <td>{{ bk.machinery_name || '-' }}</td>
                    <td>{{ bk.farmer_name || '-' }}</td>
                    <td>
                      <span class="badge" :class="'badge-' + (bk.status || '').toLowerCase().replace(' ', '-')">
                        {{ bk.status }}
                      </span>
                    </td>
                    <td class="text-right">₱{{ parseFloat(bk.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="text-right">₱{{ parseFloat(bk.total_paid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td>
                      <span class="badge" :class="'badge-' + (bk.payment_status || '').toLowerCase()">
                        {{ bk.payment_status || 'Unpaid' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Report Footer -->
          <div class="report-footer">
            <p>This report was generated automatically by CALFFA Financial Management System</p>
            <p class="footer-date">Report Date: {{ new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- EXPENSE FORM MODAL -->
    <div v-if="showExpenseForm" class="modal-overlay" @click.self="showExpenseForm = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>{{ editingExpense ? 'Edit Expense' : 'Record New Expense' }}</h2>
          <button @click="showExpenseForm = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Machinery / Equipment *</label>
            <select v-model="expenseForm.machinery_id" class="form-input">
              <option value="">-- Select Machinery/Equipment --</option>
              <option v-for="m in machinery" :key="m.id" :value="m.id">
                {{ m.machinery_name }} ({{ m.machinery_type }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Date of Expense *</label>
            <input v-model="expenseForm.date_of_expense" type="date" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Particulars (Details) *</label>
              <input v-model="expenseForm.particulars" type="text" class="form-input" placeholder="e.g., Fuel for machinery maintenance" />
            </div>
            <div class="form-group">
              <label>Receipt/Reference Number *</label>
              <input v-model="expenseForm.reference_number" type="text" class="form-input" placeholder="Enter receipt/reference number" required />
            </div>
          </div>

          <div class="expense-items-grid">
            <div class="form-group">
              <label>Fuel & Oil</label>
              <input v-model.number="expenseForm.fuel_and_oil" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Labor Cost (Operator & Helper)</label>
              <input v-model.number="expenseForm.labor_cost" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Per Diem (Incentive/hectare or hour)</label>
              <input v-model.number="expenseForm.per_diem" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Repair & Maintenance</label>
              <input v-model.number="expenseForm.repair_and_maintenance" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Office Supply (Ballpen, etc.)</label>
              <input v-model.number="expenseForm.office_supply" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Communication (Load, Internet)</label>
              <input v-model.number="expenseForm.communication_expense" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Utilities (Water & Electricity)</label>
              <input v-model.number="expenseForm.utilities_expense" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Sundries (Other Expenses)</label>
              <input v-model.number="expenseForm.sundries" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
          </div>

          <div class="form-group">
            <label>Total Amount (Auto-Calculated) *</label>
            <input v-model.number="expenseForm.total_amount" type="number" step="0.01" class="form-input total-input" readonly />
            <small class="calculated">₱{{ formatNumber(expenseForm.total_amount) }}</small>
          </div>

          <div class="modal-actions">
            <button @click="showExpenseForm = false" class="btn-secondary">Cancel</button>
            <button @click="saveExpense" class="btn-success">{{ editingExpense ? 'Update' : 'Record' }} Expense</button>
          </div>
        </div>
      </div>
    </div>

    <!-- INCOME FORM MODAL -->
    <div v-if="showIncomeForm" class="modal-overlay" @click.self="showIncomeForm = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Record Income</h2>
          <button @click="showIncomeForm = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Date of Income *</label>
            <input v-model="incomeForm.date_of_income" type="date" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Machinery ID *</label>
              <input v-model.number="incomeForm.machinery_id" type="number" class="form-input" />
            </div>
            <div class="form-group">
              <label>Booking ID *</label>
              <input v-model.number="incomeForm.booking_id" type="number" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Income Amount *</label>
            <input v-model.number="incomeForm.income_amount" type="number" step="0.01" class="form-input" />
          </div>

          <div class="form-group">
            <label>Remarks</label>
            <textarea v-model="incomeForm.remarks" class="form-input" placeholder="Optional notes"></textarea>
          </div>

          <div class="modal-actions">
            <button @click="showIncomeForm = false" class="btn-secondary">Cancel</button>
            <button @click="saveIncome" class="btn-success">Record Income</button>
          </div>
        </div>
      </div>
    </div>

    <!-- COLLECTION FORM MODAL -->
    <div v-if="showCollectionForm" class="modal-overlay" @click.self="showCollectionForm = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>💳 Record Payment / Collection</h2>
          <button @click="showCollectionForm = false" class="btn-close">×</button>
        </div>
        <div class="modal-body" v-if="editingCollection">
          <!-- Receivable Details -->
          <div class="form-group highlight-box">
            <label>Account Receivable Details:</label>
            <div class="details-grid">
              <div><strong>Farmer:</strong> {{ editingCollection.farmer_name }}</div>
              <div><strong>Machinery:</strong> {{ editingCollection.machinery_name }}</div>
              <div><strong>Total Amount:</strong> ₱{{ formatNumber(editingCollection.total_price) }}</div>
              <div><strong>Already Collected:</strong> ₱{{ formatNumber(editingCollection.amount_collected || 0) }}</div>
              <div><strong>Current Balance:</strong> ₱{{ formatNumber(editingCollection.total_price - (editingCollection.amount_collected || 0)) }}</div>
            </div>
          </div>

          <!-- Payment Type Selection -->
          <fieldset class="form-group payment-type-group">
            <legend>Payment Type *</legend>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="collectionForm.paymentType" type="radio" value="full" @change="setFullPaymentAmount" />
                <span>Full Payment</span>
                <small>(Pay complete balance)</small>
              </label>
              <label class="radio-label">
                <input v-model="collectionForm.paymentType" type="radio" value="partial" />
                <span>Partial Payment</span>
                <small>(Pay partial amount)</small>
              </label>
            </div>
          </fieldset>

          <!-- Payment Amount -->
          <div class="form-row">
            <div class="form-group">
              <label>Payment Amount *</label>
              <input 
                v-model.number="collectionForm.paymentAmount" 
                type="number" 
                step="0.01" 
                class="form-input"
                :placeholder="collectionForm.paymentType === 'full' ? 'Full balance ' + formatNumber(remainingBalance) : 'Enter partial amount'"
                @input="validatePaymentAmount"
                :readonly="collectionForm.paymentType === 'full'"
              />
              <small v-if="collectionForm.paymentType === 'full'" class="info-text" style="color: #059669; font-weight: 600;">
                ✓ Auto-filled with full balance: ₱{{ formatNumber(remainingBalance) }}
              </small>
              <small v-if="showPartialWarning" class="warning-text">
                ⚠️ This amount equals the remaining balance. Consider using Full Payment instead.
              </small>
            </div>
            <div class="form-group">
              <label>Collection Date *</label>
              <input v-model="collectionForm.collectionDate" type="date" class="form-input" />
            </div>
          </div>

          <!-- Interest Option (for Partial Payments) -->
          <div v-if="collectionForm.paymentType === 'partial'" class="form-group payment-interest-box">
            <label class="checkbox-label">
              <input v-model="collectionForm.addInterest" type="checkbox" />
              <span><strong>Add Interest</strong></span>
            </label>
            <small>{{ interestSeason.label }} - Based on {{ monthsElapsed }} months elapsed since booking</small>
            
            <div v-if="collectionForm.addInterest" class="interest-details">
              <div class="detail-row">
                <span>Interest Calculation ({{ (interestSeason.rate * 100) }}%):</span>
                <span>₱{{ formatNumber(interestAmount) }}</span>
              </div>
              <div class="detail-row highlight">
                <span><strong>Total Collection (with interest):</strong></span>
                <span><strong>₱{{ formatNumber(collectionForm.paymentAmount + interestAmount) }}</strong></span>
              </div>
            </div>
          </div>

          <!-- Receipt Number -->
          <div class="form-group">
            <label>Receipt Number *</label>
            <input v-model="collectionForm.receiptNumber" type="text" class="form-input" placeholder="Enter receipt/reference number" required />
          </div>

          <!-- Remarks -->
          <div class="form-group">
            <label>Remarks</label>
            <textarea v-model="collectionForm.remarks" class="form-input" placeholder="Additional notes or details..."></textarea>
          </div>

          <!-- Summary -->
          <div class="modal-summary">
            <table class="summary-table">
              <tr>
                <td>Balance Due:</td>
                <td class="amount">₱{{ formatNumber(remainingBalance) }}</td>
              </tr>
              <tr>
                <td>Payment Amount:</td>
                <td class="amount">₱{{ formatNumber(collectionForm.paymentAmount || 0) }}</td>
              </tr>
              <tr v-if="collectionForm.addInterest && collectionForm.paymentType === 'partial'">
                <td>Interest ({{ interestSeason.label }}):</td>
                <td class="amount">₱{{ formatNumber(interestAmount) }}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total Collection:</strong></td>
                <td class="amount"><strong>₱{{ formatNumber(totalCollectionAmount) }}</strong></td>
              </tr>
              <tr v-if="collectionForm.paymentType === 'partial'" class="balance-row">
                <td><strong>Remaining Balance After:</strong></td>
                <td class="amount"><strong>₱{{ formatNumber(remainingBalanceAfter) }}</strong></td>
              </tr>
            </table>
          </div>

          <div class="modal-actions">
            <button @click="showCollectionForm = false" class="btn-secondary">Cancel</button>
            <button @click="saveCollection" class="btn-success">Record Collection</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="alert.show" :class="['alert', 'alert-' + alert.type]">
      <span>{{ alert.message }}</span>
      <button @click="alert.show = false" class="alert-close">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const highlightedBookingId = ref(null);

// Get current user role
const userRole = computed(() => authStore.currentUser?.role);
const userBarangayId = computed(() => authStore.currentUser?.barangay_id);

// Admin barangay filter
const barangays = ref([]);
const selectedBarangayId = ref('');

// Authorization check - now includes auditor for viewing
const hasAccess = computed(() => {
  const role = authStore.currentUser?.role;
  return ['admin', 'president', 'treasurer', 'auditor'].includes(role);
});

// Check if user is treasurer (can manage/edit data)
const isTreasurer = computed(() => userRole.value === 'treasurer');

// Check if user is admin (sees only profit and reports tabs)
const isAdmin = computed(() => userRole.value === 'admin');

// Check if user can manage (only treasurer)
const canManage = computed(() => isTreasurer.value);

// Check if view only (president, auditor - no edit buttons)
const isViewOnly = computed(() => ['president', 'auditor'].includes(userRole.value));

// Compute filtered expenses based on selected machinery
const filteredExpenses = computed(() => {
  if (!filters.value.machinery_id) {
    return expenses.value;
  }
  return expenses.value.filter(exp => exp.machinery_id === parseInt(filters.value.machinery_id));
});

// Collection Form Computed Properties
const remainingBalance = computed(() => {
  if (!editingCollection.value) return 0;
  return editingCollection.value.total_price - (editingCollection.value.amount_collected || 0);
});

const totalCollectionAmount = computed(() => {
  const base = collectionForm.value.paymentAmount || 0;
  const interest = (collectionForm.value.addInterest && collectionForm.value.paymentType === 'partial') ? interestAmount.value : 0;
  return base + interest;
});

const remainingBalanceAfter = computed(() => {
  if (collectionForm.value.paymentType === 'full') return 0;
  return remainingBalance.value - collectionForm.value.paymentAmount;
});

const showPartialWarning = computed(() => {
  if (collectionForm.value.paymentType !== 'partial') return false;
  return collectionForm.value.paymentAmount >= remainingBalance.value * 0.99; // 99% or more of balance
});

// Calculate months elapsed since booking for progressive interest
const monthsElapsed = computed(() => {
  if (!editingCollection.value || !editingCollection.value.booking_date) return 0;
  const bookingDate = new Date(editingCollection.value.booking_date);
  const today = new Date();
  const diffMs = today - bookingDate;
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
  return diffMonths;
});

// Determine which interest season applies
const interestSeason = computed(() => {
  const months = monthsElapsed.value;
  if (months <= 6) return { season: 1, rate: 0.02, label: `Season 1 (0-6mo): 2%` };
  return { season: 2, rate: 0.04, label: `Season 2 (6+mo): 4%` };
});

const interestAmount = computed(() => {
  if (!collectionForm.value.addInterest || collectionForm.value.paymentType !== 'partial') return 0;
  // Progressive interest: 2% for season 1 (0-6 months), 4% for season 2 (6+ months)
  const rate = interestSeason.value.rate;
  return collectionForm.value.paymentAmount * rate;
});

// Profit Distribution Calculation (30% Org, 20% Training, 50% Members)
const profitDistribution = computed(() => {
  const netProfit = profitSummary.value.net_profit || 0;
  const organization = netProfit * 0.30;      // 30% for organization
  const training = netProfit * 0.20;          // 20% for training
  const members = netProfit * 0.50;           // 50% for members distribution
  const perMember = totalMembers.value > 0 ? members / totalMembers.value : 0;
  
  return {
    organization: organization,
    training: training,
    members: members,
    per_member: perMember
  };
});

// Redirect if no access
if (!hasAccess.value) {
  onMounted(() => {
    if (!hasAccess.value) {
      router.push('/dashboard');
    }
  });
}

// Tabs - filtered based on role
// Admin: Only sees Profit Computation and Reports
// Others (Treasurer, President, Auditor): See all tabs
const activeTab = ref('expenses');
const allTabs = [
  { id: 'expenses', label: '📝 Expenses' },
  { id: 'income', label: '💹 Income' },
  { id: 'ar', label: '📋 A/R & Collections' },
  { id: 'profit', label: '📊 Profit Computation' },
  { id: 'reports', label: '📋 Reports' }
];

const tabs = computed(() => {
  if (isAdmin.value) {
    // Admin only sees profit and reports tabs
    return allTabs.filter(tab => ['profit', 'reports'].includes(tab.id));
  }
  return allTabs;
});

// Set default active tab based on role
watch(() => userRole.value, (role) => {
  if (role === 'admin') {
    activeTab.value = 'profit';
  }
}, { immediate: true });

// State
const expenses = ref([]);
const income = ref([]);
const machinery = ref([]);
const arList = ref([]);
const collections = ref([]);
const collectionsSummary = ref({
  total_receivables: 0,
  total_collected: 0,
  total_balance: 0
});
const profitSummary = ref({
  total_income: 0,
  total_expenses: 0,
  net_profit: 0
});
const expenseBreakdown = ref({});
const totalMembers = ref(0); // Total cooperative members for distribution calculation

// Report data
const reportData = ref(null);
const reportLoading = ref(false);
const reportFilters = ref({
  showSummary: true,
  showDistribution: true,
  showAllTransactions: true,
  showExpenses: true,
  showCollections: true,
  showBookings: true,
  customDateRange: false,
  startDate: '',
  endDate: ''
});

const showExpenseForm = ref(false);
const showIncomeForm = ref(false);
const showCollectionForm = ref(false);
const editingExpense = ref(null);
const editingCollection = ref(null);

const filters = ref({
  machinery_id: '',
  start_date: '',
  end_date: ''
});

const expenseForm = ref({
  machinery_id: '',
  date_of_expense: '',
  particulars: '',
  reference_number: '',
  fuel_and_oil: 0,
  labor_cost: 0,
  per_diem: 0,
  repair_and_maintenance: 0,
  office_supply: 0,
  communication_expense: 0,
  utilities_expense: 0,
  sundries: 0,
  total_amount: 0
});

const incomeForm = ref({
  date_of_income: '',
  machinery_id: '',
  booking_id: '',
  income_amount: '',
  remarks: ''
});

const collectionForm = ref({
  paymentType: 'full', // 'full' or 'partial'
  paymentAmount: 0,
  collectionDate: new Date().toISOString().split('T')[0],
  receiptNumber: '',
  remarks: '',
  addInterest: false,
  interestSeason: 1  // Track which season's interest applies (1 or 2)
});

const alert = ref({
  show: false,
  message: '',
  type: 'success'
});

// Methods
const API_BASE_URL = 'http://localhost:3000/api';

const formatNumber = (num) => {
  if (!num) return '0.00';
  return parseFloat(num).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-PH');
};

const calculateExpenseTotal = () => {
  const parseNum = (val) => {
    const num = parseFloat(val) || 0;
    return Math.max(0, num); // Ensure no negative values
  };
  
  const total = parseNum(expenseForm.value.fuel_and_oil) +
                parseNum(expenseForm.value.labor_cost) +
                parseNum(expenseForm.value.per_diem) +
                parseNum(expenseForm.value.repair_and_maintenance) +
                parseNum(expenseForm.value.office_supply) +
                parseNum(expenseForm.value.communication_expense) +
                parseNum(expenseForm.value.utilities_expense) +
                parseNum(expenseForm.value.sundries);
  
  // Round to 2 decimal places to avoid floating point errors
  return Math.round(total * 100) / 100;
};

const updateTotal = () => {
  expenseForm.value.total_amount = calculateExpenseTotal();
};

const normalizeNumericFields = (form) => {
  const numericFields = [
    'fuel_and_oil',
    'labor_cost',
    'per_diem',
    'repair_and_maintenance',
    'office_supply',
    'communication_expense',
    'utilities_expense',
    'sundries',
    'total_amount'
  ];
  
  numericFields.forEach(field => {
    const val = parseFloat(form[field]) || 0;
    form[field] = Math.max(0, val);
  });
  
  return form;
};

const loadExpenses = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.machinery_id && { machinery_id: filters.value.machinery_id }),
      ...(filters.value.start_date && { start_date: filters.value.start_date }),
      ...(filters.value.end_date && { end_date: filters.value.end_date })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/expenses?${params}`);
    const data = await response.json();
    
    if (data.success) {
      expenses.value = data.expenses;
    }
  } catch (error) {
    console.error('Error loading expenses:', error);
    showAlert('Failed to load expenses', 'error');
  }
};

const loadMachinery = async () => {
  try {
    // Load machinery filtered by barangay for non-admin users
    const token = authStore.token;
    const response = await fetch(`${API_BASE_URL}/machinery/inventory`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    
    if (data.success) {
      machinery.value = data.inventory || [];
    }
  } catch (error) {
    console.error('Error loading machinery:', error);
  }
};

const loadBarangays = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/barangays`);
    const data = await response.json();
    if (data.success) {
      barangays.value = data.barangays || [];
    }
  } catch (error) {
    console.error('Error loading barangays:', error);
  }
};

const loadTotalMembers = async () => {
  try {
    // Load members for the user's barangay (for non-admin)
    const token = authStore.token;
    const response = await fetch(`${API_BASE_URL}/farmers`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    
    if (data.success) {
      // For non-admin users, filter by barangay
      const farmers = data.farmers || [];
      if (userRole.value !== 'admin' && userBarangayId.value) {
        totalMembers.value = farmers.filter(f => f.barangay_id === userBarangayId.value && f.status === 'approved').length;
      } else {
        totalMembers.value = farmers.filter(f => f.status === 'approved').length;
      }
    }
  } catch (error) {
    console.error('Error loading total members:', error);
  }
};

const loadIncome = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.machinery_id && { machinery_id: filters.value.machinery_id }),
      ...(filters.value.start_date && { start_date: filters.value.start_date }),
      ...(filters.value.end_date && { end_date: filters.value.end_date })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/income?${params}`);
    const data = await response.json();
    
    if (data.success) {
      income.value = data.income;
    }
  } catch (error) {
    console.error('Error loading income:', error);
    showAlert('Failed to load income records', 'error');
  }
};

const loadProfitSummary = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.start_date && { start_date: filters.value.start_date }),
      ...(filters.value.end_date && { end_date: filters.value.end_date }),
      ...(isAdmin.value && selectedBarangayId.value && { barangay_id: selectedBarangayId.value })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/profit-summary?${params}`);
    const data = await response.json();
    
    if (data.success) {
      profitSummary.value = data.summary;
    }
  } catch (error) {
    console.error('Error loading profit summary:', error);
  }
};

const loadExpenseBreakdown = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.start_date && { start_date: filters.value.start_date }),
      ...(filters.value.end_date && { end_date: filters.value.end_date }),
      ...(isAdmin.value && selectedBarangayId.value && { barangay_id: selectedBarangayId.value })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/expenses-breakdown?${params}`);
    const data = await response.json();
    
    if (data.success) {
      expenseBreakdown.value = data.breakdown;
    }
  } catch (error) {
    console.error('Error loading expense breakdown:', error);
  }
};

const saveExpense = async () => {
  try {
    // Validate required fields
    if (!expenseForm.value.machinery_id) {
      showAlert('Please select a Machinery/Equipment', 'error');
      return;
    }
    
    if (!expenseForm.value.date_of_expense) {
      showAlert('Please select a Date of Expense', 'error');
      return;
    }
    
    if (!expenseForm.value.particulars || expenseForm.value.particulars.trim() === '') {
      showAlert('Please enter Particulars (Details of expense)', 'error');
      return;
    }

    if (!expenseForm.value.reference_number || expenseForm.value.reference_number.trim() === '') {
      showAlert('Receipt/Reference number is required', 'error');
      return;
    }
    
    if (!expenseForm.value.total_amount || expenseForm.value.total_amount <= 0) {
      showAlert('Total Amount must be greater than 0', 'error');
      return;
    }
    
    const method = editingExpense.value ? 'PUT' : 'POST';
    const url = editingExpense.value 
      ? `${API_BASE_URL}/machinery-financial/expenses/${editingExpense.value.id}`
      : `${API_BASE_URL}/machinery-financial/expenses`;
    
    const payloadData = normalizeNumericFields({ ...expenseForm.value });
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payloadData,
        user_id: authStore.currentUser.id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert(
        editingExpense.value ? 'Expense updated successfully' : 'Expense recorded successfully',
        'success'
      );
      showExpenseForm.value = false;
      editingExpense.value = null;
      resetExpenseForm();
      loadExpenses();
      loadProfitSummary();
      loadExpenseBreakdown();
    } else {
      showAlert(data.message || 'Failed to save expense', 'error');
    }
  } catch (error) {
    console.error('Error saving expense:', error);
    showAlert('Failed to save expense', 'error');
  }
};

const saveIncome = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/machinery-financial/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...incomeForm.value,
        user_id: authStore.currentUser.id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('Income recorded successfully', 'success');
      showIncomeForm.value = false;
      resetIncomeForm();
      loadIncome();
      loadProfitSummary();
    } else {
      showAlert(data.message || 'Failed to save income', 'error');
    }
  } catch (error) {
    console.error('Error saving income:', error);
    showAlert('Failed to save income', 'error');
  }
};

const editExpense = (expense) => {
  editingExpense.value = expense;
  const normalized = normalizeNumericFields({ ...expense });
  expenseForm.value = normalized;
  showExpenseForm.value = true;
};

const deleteExpense = async (id) => {
  if (!confirm('Are you sure you want to delete this expense?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/machinery-financial/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: authStore.currentUser.id })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('Expense deleted successfully', 'success');
      loadExpenses();
      loadProfitSummary();
      loadExpenseBreakdown();
    } else {
      showAlert(data.message || 'Failed to delete expense', 'error');
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    showAlert('Failed to delete expense', 'error');
  }
};

const deleteIncome = async (id) => {
  if (!confirm('Are you sure you want to delete this income record?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/machinery-financial/income/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: authStore.currentUser.id })
    });
    
    if (response.ok) {
      showAlert('Income deleted successfully', 'success');
      loadIncome();
      loadProfitSummary();
    }
  } catch (error) {
    console.error('Error deleting income:', error);
    showAlert('Failed to delete income', 'error');
  }
};

// ==================== ACCOUNTS RECEIVABLE & COLLECTIONS ====================

const loadARData = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.machinery_id && { machinery_id: filters.value.machinery_id })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/ar?${params}`);
    const data = await response.json();
    
    if (data.success) {
      arList.value = data.ar || [];
      collectionsSummary.value = data.summary || {
        total_receivables: 0,
        total_collected: 0,
        total_balance: 0
      };
    }
  } catch (error) {
    console.error('Error loading AR data:', error);
    showAlert('Failed to load A/R data', 'error');
  }
};

const loadCollections = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.machinery_id && { machinery_id: filters.value.machinery_id })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/collections?${params}`);
    const data = await response.json();
    
    if (data.success) {
      collections.value = data.collections || [];
    }
  } catch (error) {
    console.error('Error loading collections:', error);
    showAlert('Failed to load collections', 'error');
  }
};

const recordCollection = (ar) => {
  editingCollection.value = ar;
  showCollectionForm.value = true;
};

const deleteCollection = async (id) => {
  if (!confirm('Are you sure you want to delete this collection record?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/machinery-financial/collections/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: authStore.currentUser.id })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('Collection deleted successfully', 'success');
      loadCollections();
      loadARData();
      loadProfitSummary();
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    showAlert('Failed to delete collection', 'error');
  }
};

const setFullPaymentAmount = () => {
  // Auto-fill full payment with remaining balance
  collectionForm.value.paymentAmount = remainingBalance.value;
  collectionForm.value.addInterest = false; // Disable interest for full payments
};

const validatePaymentAmount = () => {
  if (collectionForm.value.paymentType === 'full') {
    // For full payment, always match remaining balance
    collectionForm.value.paymentAmount = remainingBalance.value;
  } else if (collectionForm.value.paymentType === 'partial') {
    // For partial payment, ensure it doesn't exceed remaining balance
    if (collectionForm.value.paymentAmount > remainingBalance.value) {
      collectionForm.value.paymentAmount = remainingBalance.value;
      showAlert('Payment amount cannot exceed remaining balance', 'error');
    }
  }
};

const saveCollection = async () => {
  try {
    // Validation
    if (!collectionForm.value.collectionDate) {
      showAlert('Please select collection date', 'error');
      return;
    }
    
    if (collectionForm.value.paymentAmount <= 0) {
      showAlert('Payment amount must be greater than 0', 'error');
      return;
    }

    if (!collectionForm.value.receiptNumber || collectionForm.value.receiptNumber.trim() === '') {
      showAlert('Receipt number is required', 'error');
      return;
    }
    
    if (collectionForm.value.paymentAmount > remainingBalance.value + 0.01) {
      showAlert('Payment amount cannot exceed remaining balance (₱' + formatNumber(remainingBalance.value) + ')', 'error');
      return;
    }
    
    // Update interest season based on months elapsed
    collectionForm.value.interestSeason = interestSeason.value.season;
    
    // Prepare collection data
    const collectionData = {
      booking_id: editingCollection.value.booking_id || editingCollection.value.id,
      machinery_id: editingCollection.value.machinery_id,
      collection_amount: collectionForm.value.paymentAmount,
      collection_date: collectionForm.value.collectionDate,
      payment_method: 'cash', // Always cash for face-to-face payment
      receipt_number: collectionForm.value.receiptNumber.trim(),
      remarks: collectionForm.value.remarks || null,
      user_id: authStore.currentUser.id,
      // New fields for tracking
      payment_type: collectionForm.value.paymentType, // 'full' or 'partial'
      include_interest: collectionForm.value.addInterest,
      interest_amount: interestAmount.value,
      interest_season: collectionForm.value.interestSeason, // Track which season applies
      total_collection: totalCollectionAmount.value
    };
    
    // Save collection to backend
    const response = await fetch(`${API_BASE_URL}/machinery-financial/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectionData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // If partial payment with interest, show interest amount in message
      const interestMsg = collectionForm.value.addInterest && collectionForm.value.paymentType === 'partial' 
        ? ` (including ₱${formatNumber(interestAmount.value)} interest)`
        : '';
      
      showAlert(
        `Collection recorded successfully: ₱${formatNumber(collectionForm.value.paymentAmount)}${interestMsg}. Payment moved to income section.`,
        'success'
      );
      
      showCollectionForm.value = false;
      resetCollectionForm();
      loadCollections();
      loadARData();
      loadIncome(); // Refresh income to show new collection
      loadProfitSummary();
    } else {
      showAlert(data.message || 'Failed to record collection', 'error');
    }
  } catch (error) {
    console.error('Error saving collection:', error);
    showAlert('Failed to record collection', 'error');
  }
};

const resetCollectionForm = () => {
  collectionForm.value = {
    paymentType: 'full',
    paymentAmount: 0,
    collectionDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    remarks: '',
    addInterest: false,
    interestSeason: 1
  };
  editingCollection.value = null;
};

const clearFilters = () => {
  filters.value.machinery_id = '';
  filters.value.start_date = '';
  filters.value.end_date = '';
  loadExpenses();
  loadIncome();
  loadProfitSummary();
  loadExpenseBreakdown();
};

const distributeProfit = () => {
  showAlert('Profit distribution feature coming soon', 'success');
};

const generateReport = async (type) => {
  if (!authStore.currentUser?.id) {
    showAlert('User not authenticated', 'error');
    return;
  }
  
  reportLoading.value = true;
  try {
    let url = `${API_BASE_URL}/machinery-financial/reports/transactions?user_id=${authStore.currentUser.id}&type=${type}`;
    if (isAdmin.value && selectedBarangayId.value) {
      url += `&barangay_id=${selectedBarangayId.value}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      reportData.value = data.report;
      showAlert(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully`, 'success');
    } else {
      showAlert(data.message || 'Failed to generate report', 'error');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    showAlert('Failed to generate report', 'error');
  } finally {
    reportLoading.value = false;
  }
};

const formatReportDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-PH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getTransactionTypeClass = (type) => {
  switch (type) {
    case 'Expense': return 'badge-expense';
    case 'Income': return 'badge-income';
    case 'Collection': return 'badge-collection';
    default: return '';
  }
};

// Report filter helper functions
const selectAllFilters = () => {
  reportFilters.value.showSummary = true;
  reportFilters.value.showDistribution = true;
  reportFilters.value.showAllTransactions = true;
  reportFilters.value.showExpenses = true;
  reportFilters.value.showCollections = true;
  reportFilters.value.showBookings = true;
};

const clearAllFilters = () => {
  reportFilters.value.showSummary = false;
  reportFilters.value.showDistribution = false;
  reportFilters.value.showAllTransactions = false;
  reportFilters.value.showExpenses = false;
  reportFilters.value.showCollections = false;
  reportFilters.value.showBookings = false;
};

// Generate report with custom date range
const generateReportCustom = async () => {
  if (!authStore.currentUser?.id) {
    showAlert('User not authenticated', 'error');
    return;
  }
  
  if (!reportFilters.value.startDate || !reportFilters.value.endDate) {
    showAlert('Please select both start and end dates', 'error');
    return;
  }
  
  reportLoading.value = true;
  try {
    let url = `${API_BASE_URL}/machinery-financial/reports/transactions?user_id=${authStore.currentUser.id}&type=custom&start_date=${reportFilters.value.startDate}&end_date=${reportFilters.value.endDate}`;
    if (isAdmin.value && selectedBarangayId.value) {
      url += `&barangay_id=${selectedBarangayId.value}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      reportData.value = data.report;
      showAlert('Custom date range report generated successfully', 'success');
    } else {
      showAlert(data.message || 'Failed to generate report', 'error');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    showAlert('Failed to generate report', 'error');
  } finally {
    reportLoading.value = false;
  }
};

// Print report function
const printReport = () => {
  if (!reportData.value) {
    showAlert('No report data to print', 'error');
    return;
  }
  
  const printContents = document.getElementById('printable-report');
  if (!printContents) {
    showAlert('Report content not found', 'error');
    return;
  }
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CALFFA Machinery Financial Report</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
        .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #16a34a; padding-bottom: 20px; }
        .report-logo { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px; }
        .logo-icon { font-size: 40px; }
        .logo-text h3 { font-size: 24px; color: #166534; }
        .logo-text p { font-size: 14px; color: #666; }
        .report-meta h3 { font-size: 18px; color: #166534; margin-bottom: 5px; }
        .report-period, .report-generated { font-size: 13px; color: #555; }
        .report-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
        .summary-card { padding: 15px; border-radius: 8px; border: 1px solid #ddd; background: #f9f9f9; }
        .summary-card .summary-label { display: block; font-size: 12px; color: #666; }
        .summary-card .summary-value { display: block; font-size: 20px; font-weight: bold; margin: 5px 0; }
        .summary-card .summary-count { display: block; font-size: 11px; color: #888; }
        .expense-card { border-left: 4px solid #ef4444; }
        .income-card { border-left: 4px solid #22c55e; }
        .collection-card { border-left: 4px solid #3b82f6; }
        .profit-card { border-left: 4px solid #16a34a; }
        .loss-card { border-left: 4px solid #dc2626; }
        .distribution-summary { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
        .distribution-summary h4 { margin-bottom: 15px; color: #166534; }
        .distribution-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .dist-item { padding: 10px; background: white; border-radius: 6px; }
        .dist-label { display: block; font-size: 12px; color: #666; }
        .dist-value { display: block; font-size: 16px; font-weight: bold; color: #166534; }
        .report-section-card { margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .section-title { background: #f3f4f6; padding: 12px 15px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #e5e7eb; }
        .section-title h4 { margin: 0; font-size: 14px; }
        .section-count { margin-left: auto; font-size: 12px; color: #666; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table th { background: #f9fafb; padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
        .data-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
        .data-table tbody tr:nth-child(even) { background: #fafafa; }
        .text-right { text-align: right; }
        .text-red { color: #dc2626; }
        .text-green { color: #16a34a; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; }
        .badge-expense { background: #fee2e2; color: #dc2626; }
        .badge-income { background: #dcfce7; color: #16a34a; }
        .badge-collection { background: #dbeafe; color: #2563eb; }
        .badge-full { background: #dcfce7; color: #16a34a; }
        .badge-partial { background: #fef3c7; color: #d97706; }
        .badge-completed { background: #dcfce7; color: #16a34a; }
        .badge-pending { background: #fef3c7; color: #d97706; }
        .badge-paid { background: #dcfce7; color: #16a34a; }
        .badge-unpaid { background: #fee2e2; color: #dc2626; }
        .total-row td { background: #f3f4f6; font-weight: 600; }
        .report-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
        @media print { 
          body { padding: 10px; }
          .report-summary-grid { grid-template-columns: repeat(4, 1fr); }
          .distribution-grid { grid-template-columns: repeat(4, 1fr); }
        }
      </style>
    </head>
    <body>
      ${printContents.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

const resetExpenseForm = () => {
  expenseForm.value = {
    machinery_id: '',
    date_of_expense: '',
    particulars: '',
    reference_number: '',
    fuel_and_oil: 0,
    labor_cost: 0,
    per_diem: 0,
    repair_and_maintenance: 0,
    office_supply: 0,
    communication_expense: 0,
    utilities_expense: 0,
    sundries: 0,
    total_amount: 0
  };
};

const resetIncomeForm = () => {
  incomeForm.value = {
    date_of_income: '',
    machinery_id: '',
    booking_id: '',
    income_amount: '',
    remarks: ''
  };
};

const showAlert = (message, type = 'success') => {
  alert.value = { show: true, message, type };
  setTimeout(() => {
    alert.value.show = false;
  }, 3000);
};

// Watch for admin barangay filter changes
watch(selectedBarangayId, () => {
  if (isAdmin.value) {
    loadProfitSummary();
    loadExpenseBreakdown();
    // Clear report data when filter changes
    reportData.value = null;
  }
});

// Load data on mount
onMounted(async () => {
  if (hasAccess.value) {
    loadExpenses();
    loadIncome();
    loadARData();
    loadCollections();
    loadProfitSummary();
    loadExpenseBreakdown();
    loadMachinery();
    loadTotalMembers();
    // Load barangays for admin filter
    if (isAdmin.value) {
      loadBarangays();
    }
  }

  // Handle notification highlight
  if (route.query.highlight && route.query.type === 'booking') {
    highlightedBookingId.value = route.query.highlight;
    // Switch to AR tab
    activeTab.value = 'ar';
    await nextTick();
    setTimeout(() => {
      const el = document.querySelector(`[data-booking-id="${route.query.highlight}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => { highlightedBookingId.value = null; }, 6000);
    }, 500);
  }
});
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

.financial-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 32px;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.access-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.denied-content {
  text-align: center;
}

.denied-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.denied-text {
  font-size: 24px;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.denied-reason {
  color: #666;
  font-size: 14px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.income-card {
  border-left: 4px solid #10b981;
}

.expense-card {
  border-left: 4px solid #ef4444;
}

.profit-card {
  border-left: 4px solid #3b82f6;
}

.profit-card.negative {
  border-left-color: #ef4444;
}

.card-icon {
  font-size: 32px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.card-amount {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.tabs-container {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s;
}

.tab:hover {
  color: #1a1a1a;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 22px;
  color: #1a1a1a;
}

.filters-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-input {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.expenses-table,
.income-table,
.ar-table,
.collections-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.expenses-table thead,
.income-table thead,
.ar-table thead,
.collections-table thead {
  background: #f9fafb;
}

.expenses-table th,
.income-table th,
.ar-table th,
.collections-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e5e7eb;
}

.expenses-table td,
.income-table td,
.ar-table td,
.collections-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.amount-cell {
  font-weight: 600;
  color: #059669;
}

.amount-cell.balance {
  color: #f97316;
}

.amount-cell.balance.highlight {
  background: #fee2e2;
  color: #dc2626;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 4px;
}

.ar-section,
.collections-section {
  margin-top: 24px;
}

.section-subheader {
  margin-bottom: 16px;
}

.section-subheader h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.ar-card {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
}

.collected-card {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #10b981;
}

.balance-card {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #ef4444;
}

.btn-primary-small {
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-primary-small:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.full-payment {
  background: #dcfce7;
  color: #166534;
}

.status-badge.partial-payment {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.unpaid {
  background: #fee2e2;
  color: #991b1b;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: opacity 0.2s;
}

.btn-edit:hover {
  opacity: 0.7;
}

.btn-delete:hover {
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.info-text {
  padding: 12px 16px;
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  color: #1e40af;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
}

.profit-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.breakdown-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
}

.breakdown-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #1a1a1a;
}

.amount {
  font-size: 28px;
  font-weight: 700;
  color: #059669;
  margin: 0;
}

.amount.negative {
  color: #ef4444;
}

.expense-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.expense-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.expense-item.total {
  font-weight: 600;
  border-bottom: 2px solid #1a1a1a;
}

.profit {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.profit-distribution-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px solid #e5e7eb;
}

.profit-distribution-section h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.distribution-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  background: #f9fafb;
  border-left: 4px solid #6b7280;
}

.distribution-card.org {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
}

.distribution-card.training {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.distribution-card.members {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.distribution-icon {
  font-size: 32px;
}

.distribution-content {
  flex: 1;
}

.distribution-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.distribution-content .percentage {
  margin: 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.distribution-content .amount {
  margin: 8px 0 0 0;
  font-size: 22px;
  font-weight: 700;
  color: #059669;
}

.distribution-content .per-member {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #6b7280;
}

.reports-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-success {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-secondary-outline {
  background: transparent;
  border: 1px solid #ddd;
  color: #666;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.btn-secondary-outline:hover {
  background: #f9fafb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
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
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 6px;
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

.expense-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.total-input {
  font-size: 16px;
  font-weight: 600;
  background: #f0f9ff;
  border: 2px solid #3b82f6;
  cursor: not-allowed;
  color: #1e40af;
}

.total-input:readonly {
  background: #e0e7ff;
  color: #1e40af;
}

.calculated {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.alert {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 16px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border-left: 4px solid #10b981;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border-left: 4px solid #ef4444;
}

.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.7;
}

.alert-close:hover {
  opacity: 1;
}

.info-text {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

/* Collection Form Styles */
.highlight-box {
  background: #f0f9ff;
  border: 2px solid #3b82f6;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 14px;
}

.details-grid div {
  padding: 6px 0;
  border-bottom: 1px solid #bfdbfe;
}

.details-grid div:nth-child(even) {
  border-right: 1px solid #bfdbfe;
  padding-right: 12px;
}

.details-grid div:nth-child(odd):not(:first-child) {
  padding-left: 12px;
}

.payment-type-group {
  border: none;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.payment-type-group legend {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.radio-label:hover {
  background: #e5e7eb;
}

.radio-label input[type="radio"] {
  margin-top: 4px;
  cursor: pointer;
}

.radio-label span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.radio-label small {
  font-size: 12px;
  color: #666;
  font-weight: normal;
}

.payment-interest-box {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  padding: 16px;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 8px;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.interest-details {
  margin-top: 12px;
  padding: 12px;
  background: #fff8dc;
  border-radius: 6px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.detail-row.highlight {
  background: #fef08a;
  padding: 8px;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 8px;
}

.modal-summary {
  margin-top: 20px;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.summary-table tr {
  border-bottom: 1px solid #d1d5db;
}

.summary-table td {
  padding: 8px 0;
}

.summary-table td:last-child {
  text-align: right;
  padding-right: 8px;
}

.summary-table .amount {
  font-weight: 600;
  color: #1f2937;
}

.summary-table .total-row {
  background: #d1fae5;
  font-weight: 600;
}

.summary-table .total-row td {
  padding: 8px;
  border-radius: 4px;
}

.summary-table .balance-row {
  background: #dbeafe;
  font-weight: 600;
}

.summary-table .balance-row td {
  padding: 8px;
  border-radius: 4px;
}

.modal-large {
  max-width: 700px;
}

.warning-text {
  color: #d97706;
  font-size: 13px;
  font-weight: 500;
  margin-top: 4px;
}

/* Report Styles */
.report-display {
  margin-top: 24px;
}

.report-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.report-header h3 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
}

.report-period, .report-generated {
  margin: 4px 0;
  opacity: 0.9;
}

.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 16px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card .summary-label {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.8;
}

.summary-card .summary-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.summary-card .summary-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

.expense-card {
  background: linear-gradient(135deg, #fecaca 0%, #fee2e2 100%);
  color: #991b1b;
}

.income-card {
  background: linear-gradient(135deg, #a7f3d0 0%, #d1fae5 100%);
  color: #065f46;
}

.collection-card {
  background: linear-gradient(135deg, #bfdbfe 0%, #dbeafe 100%);
  color: #1e40af;
}

.profit-card {
  background: linear-gradient(135deg, #86efac 0%, #bbf7d0 100%);
  color: #14532d;
}

.loss-card {
  background: linear-gradient(135deg, #fca5a5 0%, #fecaca 100%);
  color: #7f1d1d;
}

.distribution-summary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.distribution-summary h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.dist-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dist-item.highlight {
  background: #fef3c7;
  border-color: #f59e0b;
}

.dist-label {
  font-size: 0.85rem;
  color: #6b7280;
}

.dist-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.report-transactions, .report-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.report-transactions h4, .report-section h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.badge-expense {
  background: #fee2e2;
  color: #991b1b;
}

.badge-income {
  background: #d1fae5;
  color: #065f46;
}

.badge-collection {
  background: #dbeafe;
  color: #1e40af;
}

.badge-full {
  background: #d1fae5;
  color: #065f46;
}

.badge-partial {
  background: #fef3c7;
  color: #92400e;
}

.badge-completed {
  background: #d1fae5;
  color: #065f46;
}

.badge-in-use {
  background: #dbeafe;
  color: #1e40af;
}

.badge-pending {
  background: #fef3c7;
  color: #92400e;
}

.badge-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.badge-paid {
  background: #d1fae5;
  color: #065f46;
}

.badge-unpaid {
  background: #fee2e2;
  color: #991b1b;
}

.text-red {
  color: #dc2626;
}

.text-green {
  color: #16a34a;
}

.text-right {
  text-align: right;
}

.empty-cell {
  text-align: center;
  padding: 24px;
  color: #6b7280;
  font-style: italic;
}

.total-row {
  background: #f3f4f6;
  font-weight: 600;
}

.total-row td {
  padding: 12px 8px;
}

/* Enhanced Report Panel Styles */
.report-generator-panel {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.report-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.report-option-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.report-option-card h4 {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: #1f2937;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.report-type-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.report-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 18px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 80px;
}

.report-type-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.report-type-btn.active {
  border-color: #16a34a;
  background: #dcfce7;
  color: #166534;
}

.report-type-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-type-btn .btn-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.report-type-btn .btn-text {
  font-size: 12px;
  font-weight: 500;
}

.custom-date-toggle {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.checkbox-inline input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #16a34a;
}

.custom-date-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-input-group label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.form-input-sm {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  min-width: 140px;
}

.form-input-sm:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
}

.btn-generate {
  padding: 8px 16px;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  align-self: flex-end;
  transition: background 0.2s;
}

.btn-generate:hover {
  background: #15803d;
}

.btn-generate:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.filter-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.filter-checkbox:hover {
  background: #f3f4f6;
}

.filter-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #16a34a;
}

.actions-card .action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-action.print {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
}

.btn-action.print:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
}

.btn-action.print:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-action.select-all {
  background: #dbeafe;
  color: #1e40af;
}

.btn-action.select-all:hover {
  background: #bfdbfe;
}

.btn-action.clear {
  background: #fee2e2;
  color: #991b1b;
}

.btn-action.clear:hover {
  background: #fecaca;
}

/* Loading state */
.report-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Enhanced Report Display */
.report-display {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.report-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 48px;
}

.logo-text h3 {
  margin: 0;
  font-size: 22px;
}

.logo-text p {
  margin: 4px 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.report-meta {
  text-align: right;
}

.report-meta h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.report-period, .report-generated {
  margin: 4px 0;
  font-size: 13px;
  opacity: 0.9;
}

/* Enhanced Summary Cards */
.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-icon-wrapper {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 28px;
}

.card-icon-wrapper.expense { background: #fee2e2; }
.card-icon-wrapper.income { background: #dcfce7; }
.card-icon-wrapper.collection { background: #dbeafe; }
.card-icon-wrapper.profit { background: #bbf7d0; }
.card-icon-wrapper.loss { background: #fecaca; }

.card-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-details .summary-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.card-details .summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.card-details .summary-count {
  font-size: 12px;
  color: #9ca3af;
}

/* Enhanced Distribution */
.distribution-summary {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.distribution-summary h4 {
  margin: 0 0 20px;
  color: #166534;
  font-size: 16px;
  font-weight: 600;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.dist-item.highlight {
  background: #fef3c7;
  border-color: #fbbf24;
}

.dist-icon {
  font-size: 28px;
}

.dist-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dist-details .dist-label {
  font-size: 12px;
  color: #6b7280;
}

.dist-details .dist-value {
  font-size: 18px;
  font-weight: 600;
  color: #166534;
}

/* Report Section Cards */
.report-section-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.section-icon {
  font-size: 20px;
}

.section-title h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.section-count {
  margin-left: auto;
  font-size: 12px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 4px 10px;
  border-radius: 12px;
}

.report-section-card .table-container {
  padding: 0;
}

.report-section-card .data-table {
  margin: 0;
}

.description-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Report Footer */
.report-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
}

.footer-date {
  margin-top: 4px;
  color: #9ca3af;
}

/* Responsive for Report */
@media (max-width: 1200px) {
  .report-summary-grid,
  .distribution-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .report-meta {
    text-align: center;
  }
  
  .report-logo {
    flex-direction: column;
    text-align: center;
  }
  
  .report-summary-grid,
  .distribution-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-checkboxes {
    grid-template-columns: 1fr;
  }
}

/* View Only Badge */
.view-only-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-left: 12px;
}

/* Barangay Context Styles */
.barangay-context {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border: 1px solid #38bdf8;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 20px;
  text-align: center;
}

.barangay-context.admin-context {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #22c55e;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.context-badge {
  font-size: 0.95rem;
  font-weight: 500;
  color: #0369a1;
}

.admin-context .context-badge {
  color: #15803d;
}

.admin-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.admin-filter label {
  font-weight: 500;
  color: #374151;
}

.barangay-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #374151;
  background: white;
  min-width: 200px;
  cursor: pointer;
}

.barangay-select:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* Print Styles */
@media print {
  .report-generator-panel,
  .tabs-container,
  .main-header,
  .sidebar { display: none !important; }
  
  .report-display {
    box-shadow: none;
    border: none;
    padding: 0;
  }
  
  .barangay-context {
    display: none;
  }
}
</style>
