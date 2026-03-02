// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import FarmerSignup from '../views/FarmerSignup.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import Login from '../views/Login.vue'
import FarmerTablePage from '../views/FarmerTablePage.vue'
import { useAuthStore } from '../stores/authStore'

import AuthenticatedLayout from '../layouts/AuthenticatedLayout.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/signup', component: FarmerSignup },
  { path: '/login', component: Login, meta: { requiresGuest: true } },

  { 
    path: '/', 
    component: AuthenticatedLayout,
    meta: { requiresAuth: true },
    children: [
      // Dashboard Route (unified for all users)
      { path: 'welcome', redirect: '/dashboard' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'admin', redirect: '/dashboard' },
      
      // Operations Routes
      
      // Community Routes
      { path: 'loan', component: () => import('../views/LoanPage.vue') },
      { path: 'admin-loans', component: () => import('../views/AdminLoansPage.vue'), meta: { requiresLoanManagement: true } },
      
      // Farmer Income Routes
      { path: 'farmer-income', component: () => import('../views/FarmerIncomePage.vue'), meta: { requiresFarmer: true } },
      { path: 'officer-farmer-income', component: () => import('../views/OfficerFarmerIncomePage.vue'), meta: { requiresOfficer: true } },
      
      // Machinery Routes
      { path: 'machinery-management', component: () => import('../views/MachineryManagementPage.vue'), meta: { requiresMachinery: true } },
      { path: 'machinery-booking', component: () => import('../views/MachineryBookingPage.vue'), meta: { requiresFarmer: true } },
      { path: 'machinery-approval', component: () => import('../views/MachineryApprovalPage.vue'), meta: { requiresOperator: true } },
      { path: 'machinery-financial', component: () => import('../views/MachineryFinancialPage.vue'), meta: { requiresFinancial: true } },
      
      // Insights Routes
      { path: 'news', component: () => import('../views/NewsPage.vue') },
      { path: 'announcement', component: () => import('../views/AnnouncementPage.vue') },
      
      // Members Route (accessible to all)
      { path: 'farmers-table', component: FarmerTablePage },
      
      // Barangays Route
      { path: 'barangays', component: () => import('../views/BarangaysPage.vue') },
      
      // Admin-Only Routes
      { path: 'system-activity', component: () => import('../views/SystemActivityPage.vue'), meta: { requiresAdmin: true } },
      { path: 'financial-overview', component: () => import('../views/FinancialOverviewPage.vue'), meta: { requiresFinancial: true } },
      { path: 'notification-center', component: () => import('../views/NotificationCenterPage.vue'), meta: { requiresAdmin: true } },
      { path: 'audit-logs', component: () => import('../views/AuditLogs.vue'), meta: { requiresAdmin: true } },
      { path: 'settings', component: () => import('../views/Settings.vue') }
    ]
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn()
  const userRole = authStore.currentUser?.role

  // Check if route requires authentication
  // Check both route meta and parent meta for nested routes
  const requiresAuth = to.meta.requiresAuth || (to.matched.some(record => record.meta.requiresAuth))
  if (requiresAuth && !isLoggedIn) {
    next('/login')
    return
  }

  // Check if route requires admin role
  // Check both route meta and parent meta for nested routes
  const requiresAdmin = to.meta.requiresAdmin || (to.matched.some(record => record.meta.requiresAdmin))
  if (requiresAdmin && userRole !== 'admin') {
    alert('Access denied. Admin privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires operator role (includes operation_manager and business_manager)
  const requiresOperator = to.meta.requiresOperator || (to.matched.some(record => record.meta.requiresOperator))
  if (requiresOperator && !['operator', 'operation_manager', 'business_manager', 'admin'].includes(userRole)) {
    alert('Access denied. Operator privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires financial access (admin, president, treasurer)
  const requiresFinancial = to.meta.requiresFinancial || (to.matched.some(record => record.meta.requiresFinancial))
  if (requiresFinancial && !['admin', 'president', 'treasurer'].includes(userRole)) {
    alert('Access denied. Only Admin, President, and Treasurer can access financial management.')
    next('/dashboard')
    return
  }

  // Check if route requires loan management access (admin, treasurer)
  const requiresLoanManagement = to.meta.requiresLoanManagement || (to.matched.some(record => record.meta.requiresLoanManagement))
  if (requiresLoanManagement && !['admin', 'treasurer'].includes(userRole)) {
    alert('Access denied. Only Admin and Treasurer can access loan management.')
    next('/dashboard')
    return
  }

  // Check if route requires machinery management access (admin, president)
  const requiresMachinery = to.meta.requiresMachinery || (to.matched.some(record => record.meta.requiresMachinery))
  if (requiresMachinery && !['admin', 'president'].includes(userRole)) {
    alert('Access denied. Admin or President privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires officer role (president, treasurer, auditor, agriculturist)
  const requiresOfficer = to.meta.requiresOfficer || (to.matched.some(record => record.meta.requiresOfficer))
  if (requiresOfficer && !['president', 'treasurer', 'auditor', 'agriculturist', 'admin'].includes(userRole)) {
    alert('Access denied. Officer privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires farmer role
  const requiresFarmer = to.meta.requiresFarmer || (to.matched.some(record => record.meta.requiresFarmer))
  if (requiresFarmer && userRole !== 'farmer' && userRole !== 'admin') {
    alert('Access denied. Farmer privileges required.')
    next('/dashboard')
    return
  }

  // Redirect guests away from authenticated routes
  if (to.meta.requiresGuest && isLoggedIn) {
    // Redirect all users to unified dashboard
    next('/dashboard')
    return
  }

  next()
})
