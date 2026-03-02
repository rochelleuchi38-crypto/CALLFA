// src/stores/authStore.js
import { defineStore } from 'pinia'

const API_BASE_URL = '/api/farmers'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),
  actions: {
    async login(referenceNumber, password) {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reference_number: referenceNumber,
            password: password
          })
        })

        if (!response.ok) {
          // Try to parse JSON error body, fall back to text
          const errorBody = await response.json().catch(() => null)
          const errorText = errorBody?.message || (await response.text().catch(() => null))
          throw new Error(errorText || 'Login failed')
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'Login failed')
        }

        // Store user data (without password)
        const user = { ...data.farmer }
        // Include barangay context if available
        if (data.barangay) {
          user.barangay_id = data.barangay.id
          user.barangay_name = data.barangay.name
          user.barangay_location = data.barangay.location
        }
        // Keep status and is_approved flags (if present) so UI can act accordingly
        delete user.password_hash
        this.currentUser = user
        this.token = data.token
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
        localStorage.setItem('token', data.token)

        this.loading = false
        // if account is pending, still return success: true but include warning message
        const warning = !this.currentUser.is_approved && this.currentUser.status === 'pending'
          ? 'Your account is pending approval. Some features may be limited.'
          : null

        return { success: true, user: this.currentUser, warning }
      } catch (error) {
        this.error = error.message
        this.loading = false
        // Handle network errors
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          return {
            success: false,
            error: 'Cannot connect to server. Please make sure the backend is running on http://localhost:5000'
          }
        }
        return { success: false, error: error.message }
      }
    },
    logout() {
      this.currentUser = null
      this.token = null
      localStorage.removeItem('currentUser')
      localStorage.removeItem('token')
    },
    isLoggedIn() {
      return this.currentUser !== null
    }
  }
})
