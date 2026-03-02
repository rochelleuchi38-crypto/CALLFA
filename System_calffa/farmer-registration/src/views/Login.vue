<template>
  <div class="login-page">
    <!-- Animated Rice Field Background (Left Side) -->
    <div class="background-section">
      <div class="rice-field-background">
        <!-- Animated sun rising -->
        <div class="sun-animation"></div>
      
        <!-- Mountains silhouette -->
        <div class="mountains"></div>
        
        <!-- Overlay gradient for text readability -->
        <div class="background-overlay"></div>
      </div>
      
      <!-- Welcome Message on Background -->
      <div class="background-message">
        <h2 class="welcome-title">{{ isSignUp ? 'Simulan ang masaganang ani' : 'Welcome back, Farmer!' }}</h2>
        <p class="welcome-subtitle">Empowering your journey from seed to harvest</p>
        <div class="welcome-icon"></div>
      </div>
    </div>

    <!-- Form Section (Right Side) -->
    <div class="form-section">
      <div class="form-container">
        <!-- Language Toggle -->
        <div class="language-toggle">
          <button 
            @click="language = 'en'"
            :class="['lang-btn', { active: language === 'en' }]"
          >
            English
          </button>
          <button 
            @click="language = 'tl'"
            :class="['lang-btn', { active: language === 'tl' }]"
          >
            Tagalog
          </button>
        </div>

        <!-- Holiday Banner (Optional) -->
        <div v-if="showHolidayBanner" class="holiday-banner">
          <span>🎄</span>
          <span>{{ language === 'tl' ? 'Maligayang Pasko, Magsasaka!' : 'Merry Christmas, Farmer!' }}</span>
          <span>🎄</span>
        </div>

        <!-- Form Header -->
        <div class="form-header">
          <div class="form-icon">{{ isSignUp ? '🧺' : '🌱' }}</div>
          <h1 class="form-title">
            {{ isSignUp 
              ? (language === 'tl' ? 'Gumawa ng Account' : 'Create Account')
              : (language === 'tl' ? 'Mag-login' : 'Sign In')
            }}
          </h1>
          <p class="form-subtitle">
            {{ isSignUp
              ? (language === 'tl' ? 'Sumali sa aming komunidad ng mga magsasaka' : 'Join our community of farmers')
              : (language === 'tl' ? 'I-access ang iyong dashboard' : 'Access your dashboard')
            }}
          </p>
        </div>

        <!-- Error/Success Messages -->
        <div v-if="message" class="message success-message">
          {{ message }}
        </div>
        <div v-if="errorMessage" class="message error-message">
          {{ errorMessage }}
        </div>

        <!-- Login Form -->
        <form v-if="!isSignUp" @submit.prevent="submitLogin" class="auth-form">
          <!-- Reference Number / Email Field -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🆔</span>
              {{ language === 'tl' ? 'Reference Number' : 'Reference Number' }}
            </label>
            <input 
              v-model="loginForm.referenceNumber" 
              type="text" 
              required
              class="form-input"
              :placeholder="language === 'tl' ? 'Ilagay ang iyong reference number' : 'Enter your reference number'"
            />
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🔑</span>
              {{ language === 'tl' ? 'Password' : 'Password' }}
            </label>
            <div class="password-input-wrapper">
              <input 
                v-model="loginForm.password" 
                :type="showPassword ? 'text' : 'password'"
                required
                class="form-input"
                :placeholder="language === 'tl' ? 'Ilagay ang iyong password' : 'Enter your password'"
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>

          <!-- Forgot Password Link -->
          <div class="forgot-password">
            <button type="button" @click="handleForgotPassword" class="forgot-link">
              {{ language === 'tl' ? 'Nakalimutan ang password?' : 'Forgot Password?' }}
            </button>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit"
            :disabled="authStore.loading"
            class="submit-btn primary-btn"
          >
            <span v-if="authStore.loading" class="loading-spinner"></span>
            <span v-else>🌾</span>
            <span>{{ authStore.loading 
              ? (language === 'tl' ? 'Naglo-load...' : 'Loading...')
              : (language === 'tl' ? 'Mag-login' : 'Sign In')
            }}</span>
          </button>

          <!-- Switch to Sign Up -->
          <div class="form-footer">
            <p>
              {{ language === 'tl' ? 'Wala pang account?' : "Don't have an account?" }}
              <button type="button" @click="toggleForm" class="link-btn">
                {{ language === 'tl' ? 'Gumawa ng account' : 'Create Account' }}
              </button>
            </p>
          </div>
        </form>

        <!-- Sign Up Form -->
        <form v-else @submit.prevent="submitSignUp" class="auth-form">
          <!-- Full Name -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">👤</span>
              {{ language === 'tl' ? 'Buong Pangalan' : 'Full Name' }}
            </label>
            <input 
              v-model="signUpForm.full_name" 
              type="text" 
              required
              class="form-input"
              :placeholder="language === 'tl' ? 'Ilagay ang iyong buong pangalan' : 'Enter your full name'"
            />
          </div>

          <!-- Reference Number -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🆔</span>
              {{ language === 'tl' ? 'Reference Number' : 'Reference Number' }}
            </label>
            <input 
              v-model="signUpForm.reference_number" 
              type="text" 
              required
              class="form-input"
              :placeholder="language === 'tl' ? 'Ilagay ang reference number' : 'Enter reference number'"
            />
          </div>

          <!-- Date of Birth -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon"></span>
              {{ language === 'tl' ? 'Petsa ng Kapanganakan' : 'Date of Birth' }}
            </label>
            <input 
              v-model="signUpForm.date_of_birth" 
              type="date" 
              required
              class="form-input"
            />
          </div>

          <!-- Barangay -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">📍</span>
              {{ language === 'tl' ? 'Barangay' : 'Barangay' }}
            </label>
            <select 
              v-model="signUpForm.barangay_id" 
              @change="handleBarangayChange"
              required
              class="form-input"
            >
              <option value="" disabled>{{ language === 'tl' ? 'Pumili ng Barangay' : 'Select Barangay' }}</option>
              <option v-for="barangay in barangays" :key="barangay.id" :value="barangay.id">
                {{ barangay.name }}
              </option>
            </select>
          </div>

          <!-- Phone Number -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">📞</span>
              {{ language === 'tl' ? 'Numero ng Telepono' : 'Phone Number' }}
            </label>
            <input 
              v-model="signUpForm.phone_number" 
              type="tel" 
              required
              class="form-input"
              :placeholder="language === 'tl' ? 'Ilagay ang iyong numero ng telepono' : 'Enter your phone number'"
            />
          </div>

          <!-- Educational Status -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🎓</span>
              {{ language === 'tl' ? 'Antas ng Edukasyon' : 'Educational Status' }}
            </label>
            <select 
              v-model="signUpForm.educational_status" 
              required
              class="form-input"
            >
              <option value="">{{ language === 'tl' ? 'Piliin ang antas ng edukasyon' : 'Select educational attainment' }}</option>
              <option value="No Formal Education">{{ language === 'tl' ? 'Walang Pormal na Edukasyon' : 'No Formal Education' }}</option>
              <option value="Elementary Level">{{ language === 'tl' ? 'Elementarya (Hindi Tapos)' : 'Elementary Level' }}</option>
              <option value="Elementary Graduate">{{ language === 'tl' ? 'Elementarya (Tapos)' : 'Elementary Graduate' }}</option>
              <option value="High School Level">{{ language === 'tl' ? 'High School (Hindi Tapos)' : 'High School Level' }}</option>
              <option value="High School Graduate">{{ language === 'tl' ? 'High School (Tapos)' : 'High School Graduate' }}</option>
              <option value="Vocational">{{ language === 'tl' ? 'Bokasyonal' : 'Vocational' }}</option>
              <option value="College Level">{{ language === 'tl' ? 'Kolehiyo (Hindi Tapos)' : 'College Level' }}</option>
              <option value="College Graduate">{{ language === 'tl' ? 'Kolehiyo (Tapos)' : 'College Graduate' }}</option>
              <option value="Post Graduate">{{ language === 'tl' ? 'Post Graduate' : 'Post Graduate' }}</option>
            </select>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🔑</span>
              {{ language === 'tl' ? 'Password' : 'Password' }}
            </label>
            <div class="password-input-wrapper">
              <input 
                v-model="signUpForm.password" 
                :type="showPassword ? 'text' : 'password'"
                required
                class="form-input"
                :placeholder="language === 'tl' ? 'Gumawa ng password' : 'Create a password'"
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🔒</span>
              {{ language === 'tl' ? 'Kumpirmahin ang Password' : 'Confirm Password' }}
            </label>
            <input 
              v-model="signUpForm.confirmPassword" 
              type="password"
              required
              class="form-input"
              :placeholder="language === 'tl' ? 'Kumpirmahin ang password' : 'Confirm your password'"
            />
          </div>

          <!-- Submit Button -->
          <button 
            type="submit"
            :disabled="loading"
            class="submit-btn primary-btn"
          >
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else>🧺</span>
            <span>{{ loading 
              ? (language === 'tl' ? 'Nagre-rehistro...' : 'Registering...')
              : (language === 'tl' ? 'Gumawa ng Account' : 'Create Account')
            }}</span>
          </button>

          <!-- Switch to Login -->
          <div class="form-footer">
            <p>
              {{ language === 'tl' ? 'Mayroon nang account?' : 'Already have an account?' }}
              <button type="button" @click="toggleForm" class="link-btn">
                {{ language === 'tl' ? 'Mag-login' : 'Sign In' }}
              </button>
            </p>
          </div>
        </form>

        <!-- Daily Tip / Weather Forecast Card -->
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-icon">💡</span>
            <h3 class="info-title">{{ language === 'tl' ? 'Tip ng Araw' : 'Daily Tip' }}</h3>
          </div>
          <p class="info-content">{{ dailyTip }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Language toggle
const language = ref('en')

// Form state
const isSignUp = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const message = computed(() => route.query.message)
const errorMessage = ref('')

// Holiday banner (show during December)
const showHolidayBanner = computed(() => {
  const month = new Date().getMonth()
  return month === 11 // December
})

// Daily tips (rotating)
const dailyTips = {
  en: [
    "Water your crops early in the morning for better absorption.",
    "Check soil moisture regularly to prevent overwatering.",
    "Rotate your crops to maintain soil fertility.",
    "Use organic fertilizers to improve soil health.",
    "Monitor weather forecasts to plan your farming activities.",
    "Keep your tools clean and well-maintained for better results.",
    "Plant companion crops to naturally repel pests.",
    "Harvest during the cool hours of the day for better quality."
  ],
  tl: [
    "Diligan ang inyong mga pananim sa umaga para sa mas mabuting pagsipsip.",
    "Suriin ang kahalumigmigan ng lupa nang regular upang maiwasan ang labis na pagdidilig.",
    "I-rotate ang inyong mga pananim upang mapanatili ang pagkamayabong ng lupa.",
    "Gumamit ng organikong pataba upang mapabuti ang kalusugan ng lupa.",
    "Subaybayan ang mga weather forecast upang planuhin ang inyong mga gawaing pagsasaka.",
    "Panatilihing malinis at maayos ang inyong mga kagamitan para sa mas mabuting resulta.",
    "Magtanim ng companion crops upang natural na mapalayas ang mga peste.",
    "Anihin sa malamig na oras ng araw para sa mas mabuting kalidad."
  ]
}

const dailyTip = ref('')

// Login form
const loginForm = ref({
  referenceNumber: '',
  password: '',
  role: 'farmer'
})

// Sign up form
const signUpForm = ref({
  full_name: '',
  reference_number: '',
  password: '',
  confirmPassword: '',
  role: 'farmer',
  date_of_birth: '',
  barangay_id: '',
  address: '',
  phone_number: '',
  educational_status: ''
})

// Barangays data
const barangays = ref([])

// Set daily tip on mount
onMounted(() => {
  const tips = dailyTips[language.value]
  dailyTip.value = tips[Math.floor(Math.random() * tips.length)]
  
  // Fetch barangays
  fetchBarangays()
})

// Fetch barangays from API
const fetchBarangays = async () => {
  try {
    const response = await fetch('/api/barangays')
    if (response.ok) {
      const data = await response.json()
      barangays.value = data.barangays || []
    }
  } catch (err) {
    console.error('Failed to fetch barangays:', err)
  }
}

// Watch language changes to update daily tip
watch(language, () => {
  const tips = dailyTips[language.value]
  dailyTip.value = tips[Math.floor(Math.random() * tips.length)]
})

// Handle barangay selection - set address to barangay name
const handleBarangayChange = () => {
  const selectedBarangay = barangays.value.find(b => b.id === parseInt(signUpForm.value.barangay_id))
  if (selectedBarangay) {
    signUpForm.value.address = selectedBarangay.name
  }
}

// Toggle between login and sign up
const toggleForm = () => {
  isSignUp.value = !isSignUp.value
  errorMessage.value = ''
}

// Login handler
const submitLogin = async () => {
  errorMessage.value = ''
  
  if (!loginForm.value.referenceNumber || !loginForm.value.password) {
    errorMessage.value = language.value === 'tl' 
      ? 'Pakipunan ang lahat ng mga field'
      : 'Please fill in all fields'
    return
  }

  const result = await authStore.login(loginForm.value.referenceNumber, loginForm.value.password)
  
  if (result.success) {
    const userRole = authStore.currentUser?.role
    if (userRole === 'admin') {
      router.push('/admin')
    } else {
      router.push('/welcome')
    }
  } else {
    errorMessage.value = result.error || (language.value === 'tl' 
      ? 'Nabigo ang pag-login. Pakisubukan muli.'
      : 'Login failed. Please try again.')
  }
}

// Sign up handler
const submitSignUp = async () => {
  errorMessage.value = ''
  loading.value = true

  if (signUpForm.value.password !== signUpForm.value.confirmPassword) {
    errorMessage.value = language.value === 'tl'
      ? 'Hindi tumugma ang mga password'
      : 'Passwords do not match'
    loading.value = false
    return
  }

  if (!signUpForm.value.role) {
    errorMessage.value = language.value === 'tl'
      ? 'Pumili ng uri ng account'
      : 'Please select an account type'
    loading.value = false
    return
  }

  if (!signUpForm.value.barangay_id) {
    errorMessage.value = language.value === 'tl'
      ? 'Pumili ng Barangay'
      : 'Please select a Barangay'
    loading.value = false
    return
  }

  try {
    const response = await fetch('/api/farmers/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
        body: JSON.stringify({
        full_name: signUpForm.value.full_name,
        reference_number: signUpForm.value.reference_number,
        password: signUpForm.value.password,
        role: signUpForm.value.role,
        date_of_birth: signUpForm.value.date_of_birth,
        address: signUpForm.value.address,
        barangay_id: parseInt(signUpForm.value.barangay_id),
        phone_number: signUpForm.value.phone_number,
        educational_status: signUpForm.value.educational_status
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }))
      throw new Error(errorData.message || 'Registration failed')
    }

    const data = await response.json()
    
    // Show success message and redirect to login
    errorMessage.value = ''
    router.push({ 
      path: '/login', 
      query: { message: language.value === 'tl' 
        ? 'Matagumpay ang pagrehistro! Pakilagay ang inyong credentials.'
        : 'Registration successful! Please login with your credentials.'
      }
    })
  } catch (err) {
    errorMessage.value = err.message || (language.value === 'tl'
      ? 'May naganap na error sa pagrehistro'
      : 'An error occurred during registration')
  } finally {
    loading.value = false
  }
}

// Forgot password handler
const handleForgotPassword = () => {
  // Implement forgot password functionality
  alert(language.value === 'tl' 
    ? 'Ang forgot password feature ay malapit nang magagamit.'
    : 'Forgot password feature coming soon.')
}
</script>

<style scoped>
/* Main Layout */
.login-page {
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* Background Section (Left) */
.background-section {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
}

.rice-field-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    #ffd89b 0%,
    #ffecd2 20%,
    #a8e063 40%,
    #56ab2f 60%,
    #2d5016 100%
  );
  overflow: hidden;
}

/* Animated Sun */
.sun-animation {
  position: absolute;
  top: 10%;
  left: 20%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, #ffd700 0%, #ffa500 70%, transparent 100%);
  border-radius: 50%;
  box-shadow: 0 0 60px rgba(255, 215, 0, 0.6);
  animation: sunRise 20s ease-in-out infinite;
  z-index: 1;
}

@keyframes sunRise {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-30px) scale(1.1);
    opacity: 1;
  }
}

/* Mountains */
.mountains {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(
    to top,
    #1a472a 0%,
    #2d5016 30%,
    #3d6b1f 60%,
    transparent 100%
  );
  clip-path: polygon(
    0% 100%,
    10% 80%,
    20% 85%,
    30% 75%,
    40% 80%,
    50% 70%,
    60% 75%,
    70% 65%,
    80% 70%,
    90% 60%,
    100% 65%,
    100% 100%
  );
  z-index: 2;
}

/* Animated Rice Leaves */
.rice-leaves {
  position: absolute;
  bottom: 40%;
  left: 0;
  right: 0;
  height: 30%;
  z-index: 3;
}

.leaf {
  position: absolute;
  width: 4px;
  height: 80px;
  background: linear-gradient(to bottom, #2d5016 0%, #56ab2f 50%, #a8e063 100%);
  border-radius: 2px;
  transform-origin: bottom center;
}

.leaf-1 { left: 10%; bottom: 0; animation: sway 3s ease-in-out infinite; }
.leaf-2 { left: 20%; bottom: 0; animation: sway 3.5s ease-in-out infinite 0.5s; }
.leaf-3 { left: 35%; bottom: 0; animation: sway 4s ease-in-out infinite 1s; }
.leaf-4 { left: 50%; bottom: 0; animation: sway 3.2s ease-in-out infinite 0.3s; }
.leaf-5 { left: 70%; bottom: 0; animation: sway 3.8s ease-in-out infinite 0.7s; }
.leaf-6 { left: 85%; bottom: 0; animation: sway 4.2s ease-in-out infinite 1.2s; }

@keyframes sway {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

/* Background Overlay */
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    transparent 100%
  );
  z-index: 4;
}

/* Background Message */
.background-message {
  position: relative;
  z-index: 5;
  text-align: center;
  color: white;
  padding: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.welcome-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  animation: fadeInUp 1s ease-out;
}

.welcome-subtitle {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  opacity: 0.95;
  animation: fadeInUp 1s ease-out 0.2s both;
}

.welcome-icon {
  font-size: 4rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Form Section (Right) */
.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5dc 0%, #fef3c7 100%);
  padding: 0.75rem;
  min-height: 100vh;
  overflow-y: auto;
}

.form-container {
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  animation: slideInRight 0.6s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Language Toggle */
.language-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  justify-content: flex-end;
}

.lang-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s;
  color: #6b7280;
}

.lang-btn:hover {
  border-color: #16a34a;
  color: #16a34a;
}

.lang-btn.active {
  background: #16a34a;
  color: white;
  border-color: #16a34a;
}

/* Holiday Banner */
.holiday-banner {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* Form Header */
.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  animation: rotate 3s ease-in-out infinite;
}

@keyframes rotate {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(10deg); }
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #166534;
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

/* Messages */
.message {
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 500;
}

.success-message {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #166534;
  font-size: 0.9rem;
}

.label-icon {
  font-size: 1.1rem;
}

.form-input {
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  background: white;
  color: #111827;
}

.form-input:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  transition: transform 0.2s;
}

.password-toggle:hover {
  transform: translateY(-50%) scale(1.1);
}

/* Role Selector */
.role-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.role-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.role-btn:hover {
  border-color: #16a34a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
}

.role-btn.active {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  color: white;
  border-color: #16a34a;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3);
}

.role-icon {
  font-size: 1.5rem;
}

.role-name {
  font-size: 0.75rem;
}

/* Forgot Password */
.forgot-password {
  text-align: right;
  margin-top: -0.5rem;
}

.forgot-link {
  background: none;
  border: none;
  color: #16a34a;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: underline;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #15803d;
}

/* Submit Button */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 0.5rem;
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.submit-btn:hover::before {
  width: 300px;
  height: 300px;
}

.primary-btn {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Form Footer */
.form-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.9rem;
}

.link-btn {
  background: none;
  border: none;
  color: #16a34a;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  margin-left: 0.25rem;
  transition: color 0.2s;
}

.link-btn:hover {
  color: #15803d;
}

/* Info Card */
.info-card {
  margin-top: 2rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 16px;
  border: 2px solid #fbbf24;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.info-icon {
  font-size: 1.5rem;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
  margin: 0;
}

.info-content {
  color: #78350f;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
}

/* Mobile Responsive */
@media (max-width: 1024px) {
  .login-page {
    flex-direction: column;
  }

  .background-section {
    min-height: 40vh;
    flex: none;
  }

  .background-message {
    padding: 1.5rem;
  }

  .welcome-title {
    font-size: 2rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }

  .form-section {
    min-height: auto;
    padding: 1.5rem;
  }

  .form-container {
    padding: 2rem;
  }
}

@media (max-width: 640px) {
  .form-container {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .form-title {
    font-size: 1.5rem;
  }

  .role-selector {
    grid-template-columns: 1fr;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-icon {
    font-size: 2.5rem;
  }

  .rice-leaves {
    display: none; /* Hide on very small screens for performance */
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>