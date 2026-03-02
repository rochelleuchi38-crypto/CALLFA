<template>
  <div class="signup-page">
    <!-- Header is handled by App.vue -->
    
    <!-- Main Content -->
    <div class="signup-container">
      <!-- Title with Icon -->
      <div class="signup-header">
        <div class="title-icon">🌾</div>
        <h1 class="signup-title">Farmer Registration</h1>
      </div>

      <!-- Registration Form -->
      <form @submit.prevent="register" class="registration-form">
        <!-- Full Name -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input
              v-model="form.full_name"
              type="text"
              required
              class="form-input"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <!-- Date of Birth -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date of Birth</label>
            <div class="date-input-wrapper">
              <input
                v-model="form.date_of_birth"
                type="date"
                required
                class="form-input date-input"
              />
              <span class="date-icon">📅</span>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Barangay</label>
            <select
              v-model="form.address"
              required
              class="form-input"
            >
              <option value="" disabled>Select your barangay</option>
              <option v-for="barangay in barangays" :key="barangay.id" :value="barangay.name">
                {{ barangay.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Phone Number -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input
              v-model="form.phone_number"
              type="tel"
              required
              class="form-input"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <!-- Educational Status -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Educational Status</label>
            <select
              v-model="form.educational_status"
              required
              class="form-input"
            >
              <option value="">Select educational attainment</option>
              <option value="No Formal Education">No Formal Education</option>
              <option value="Elementary Level">Elementary Level</option>
              <option value="Elementary Graduate">Elementary Graduate</option>
              <option value="High School Level">High School Level</option>
              <option value="High School Graduate">High School Graduate</option>
              <option value="Vocational">Vocational</option>
              <option value="College Level">College Level</option>
              <option value="College Graduate">College Graduate</option>
              <option value="Post Graduate">Post Graduate</option>
            </select>
            <p class="form-hint">Select your highest educational attainment</p>
          </div>
        </div>

        <!-- Role Selection -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Account Type / Role</label>
            <select v-model="form.role" required class="form-input">
              <option value="farmer">👨‍🌾 Farmer</option>
              <option value="president">👔 President</option>
              <option value="treasurer">💰 Treasurer</option>
              <option value="auditor">📊 Auditor</option>
              <option value="operator">⚙️ Operator</option>
              <option value="operation_manager">🛠️ Operation Manager</option>
              <option value="business_manager">💼 Business Manager</option>
              <option value="agriculturist">🌱 Agriculturist</option>
            </select>
            <p class="form-hint">Select your role in the cooperative</p>
          </div>
        </div>

        <!-- Reference Number -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Reference Number</label>
            <input
              v-model="form.reference_number"
              type="text"
              required
              class="form-input"
              placeholder="Enter reference number"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Password</label>
            <input
              v-model="form.password"
              type="password"
              required
              class="form-input"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              required
              class="form-input"
              placeholder="Confirm your password"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button
            type="submit"
            :disabled="loading"
            class="submit-button"
          >
            {{ loading ? 'Registering...' : 'Create Account' }}
          </button>
        </div>
      </form>

      <!-- Login Link -->
      <div class="login-prompt">
        <p class="login-text">Already have an account?</p>
        <router-link to="/login" class="login-link">Login here</router-link>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Success Message -->
      <div v-if="success" class="success-message">
        Registration successful! Please login with your credentials.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  role: 'farmer',
  full_name: '',
  date_of_birth: '',
  address: '',
  phone_number: '',
  educational_status: '',
  reference_number: '',
  password: '',
  confirmPassword: ''
})

const barangays = ref([])
const loading = ref(false)
const error = ref('')
const success = ref(false)

// Fetch barangays on mount
onMounted(async () => {
  try {
    const response = await fetch('/api/barangays')
    if (response.ok) {
      const data = await response.json()
      barangays.value = data.barangays || []
    }
  } catch (err) {
    console.error('Failed to fetch barangays:', err)
  }
})

const register = async () => {
  // Validate passwords match
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    const response = await fetch('/api/farmers/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: form.value.full_name,
        date_of_birth: form.value.date_of_birth,
        address: form.value.address,
        phone_number: form.value.phone_number,
        educational_status: form.value.educational_status,
        reference_number: form.value.reference_number,
        password: form.value.password,
        role: form.value.role
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }))
      throw new Error(errorData.message || 'Registration failed')
    }

    const data = await response.json()

    success.value = true
    form.value = {
      role: 'farmer',
      full_name: '',
      date_of_birth: '',
      address: '',
      phone_number: '',
      educational_status: '',
      reference_number: '',
      password: '',
      confirmPassword: ''
    }

    // Show success message for 3 seconds before redirecting
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err) {
    error.value = err.message || 'An error occurred during registration'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.signup-page {
  min-height: calc(100vh - 128px);
  background: #f5f5dc;
  background-image: 
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px);
  padding: 40px 20px;
}

.signup-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.signup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.title-icon {
  font-size: 32px;
}

.signup-title {
  font-size: 28px;
  font-weight: 700;
  color: #166534;
  margin: 0;
}

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #166534;
  margin-bottom: 4px;
}

.required {
  color: #ef4444;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
  color: #111827;
}

.form-input:focus {
  outline: none;
  border-color: #166534;
  box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.1);
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-input {
  flex: 1;
  padding-right: 40px;
}

.date-icon {
  position: absolute;
  right: 12px;
  font-size: 18px;
  pointer-events: none;
  color: #6b7280;
}

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.submit-button {
  padding: 12px 32px;
  background: white;
  color: #166534;
  border: 2px solid #166534;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;
}

.submit-button:hover:not(:disabled) {
  background: #166534;
  color: white;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-prompt {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.login-text {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.login-link {
  color: #9333ea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.login-link:hover {
  color: #7c3aed;
  text-decoration: underline;
}

.error-message {
  margin-top: 20px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 14px;
}

.success-message {
  margin-top: 20px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  color: #166534;
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .signup-container {
    padding: 24px;
  }

  .form-row {
    flex-direction: column;
    gap: 20px;
  }

  .signup-title {
    font-size: 24px;
  }
}
</style>
