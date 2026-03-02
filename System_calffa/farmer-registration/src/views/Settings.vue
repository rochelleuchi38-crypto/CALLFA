<template>
  <div class="edit-profile-page">
    <div class="profile-card">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar-section">
          <div class="avatar-wrapper">
            <img 
              v-if="profilePictureUrl" 
              :src="profilePictureUrl" 
              alt="Profile" 
              class="avatar-img"
            />
            <span v-else class="avatar-placeholder">{{ userInitials }}</span>
            <label class="avatar-upload-btn" title="Change Photo">
              📷
              <input 
                type="file" 
                ref="profilePictureInput"
                @change="handleProfilePictureChange" 
                accept="image/jpeg,image/png,image/gif"
                class="hidden"
              />
            </label>
          </div>
          <p v-if="uploadMessage" class="upload-msg" :class="uploadMessageType">{{ uploadMessage }}</p>
        </div>
        <div class="profile-header-info">
          <h1 class="profile-name">{{ profile.full_name || 'Your Name' }}</h1>
          <p class="profile-ref">{{ profile.reference_number }}</p>
          <p class="profile-barangay">📍 {{ profile.address || 'No barangay assigned' }}</p>
        </div>
      </div>

      <!-- Edit Form -->
      <form @submit.prevent="saveProfile" class="profile-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Full Name</label>
            <input
              type="text"
              v-model="profile.full_name"
              required
              placeholder="Enter your full name"
            />
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              v-model="profile.phone_number"
              placeholder="Enter phone number"
            />
          </div>
          <div class="form-group">
            <label>Educational Status</label>
            <select v-model="profile.educational_status">
              <option value="" disabled>Select Educational Status</option>
              <option value="Elementary">Elementary</option>
              <option value="High School">High School</option>
              <option value="Senior High School">Senior High School</option>
              <option value="Vocational">Vocational</option>
              <option value="College">College</option>
              <option value="Post Graduate">Post Graduate</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>

        <div class="readonly-section">
          <div class="readonly-field">
            <label>Reference Number</label>
            <span>{{ profile.reference_number }}</span>
          </div>
          <div class="readonly-field">
            <label>Barangay</label>
            <span>{{ profile.address || '—' }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="save-btn" :disabled="saving">
            <span v-if="saving">Saving...</span>
            <span v-else>Save Changes</span>
          </button>
        </div>
        <p v-if="message" class="form-message" :class="messageType">{{ message }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const userInitials = computed(() => {
  const name = profile.value.full_name || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

// Profile state
const profile = ref({
  full_name: authStore.currentUser?.full_name || '',
  phone_number: authStore.currentUser?.phone_number || '',
  educational_status: authStore.currentUser?.educational_status || '',
  reference_number: authStore.currentUser?.reference_number || '',
  address: authStore.currentUser?.address || authStore.currentUser?.barangay_name || ''
})

const saving = ref(false)
const message = ref('')
const messageType = ref('')

// Profile picture state
const profilePictureInput = ref(null)
const profilePictureFile = ref(null)
const uploadMessage = ref('')
const uploadMessageType = ref('')
const uploading = ref(false)

// Computed property for profile picture URL
const profilePictureUrl = computed(() => {
  if (profilePictureFile.value) {
    return URL.createObjectURL(profilePictureFile.value)
  }
  if (authStore.currentUser?.profile_picture) {
    return `http://localhost:3000${authStore.currentUser.profile_picture}`
  }
  return null
})

const handleProfilePictureChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    uploadMessage.value = 'File size must be less than 5MB'
    uploadMessageType.value = 'text-red-600'
    return
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    uploadMessage.value = 'Only JPEG, PNG, and GIF images are allowed'
    uploadMessageType.value = 'text-red-600'
    return
  }

  profilePictureFile.value = file
  await uploadProfilePicture()
}

const uploadProfilePicture = async () => {
  if (!profilePictureFile.value) return

  uploading.value = true
  uploadMessage.value = 'Uploading...'
  uploadMessageType.value = 'text-blue-600'

  try {
    const userId = authStore.currentUser?.id
    if (!userId) {
      throw new Error('User ID not found')
    }

    const formData = new FormData()
    formData.append('profile_picture', profilePictureFile.value)

    const response = await fetch(`http://localhost:3000/api/farmers/${userId}/profile-picture`, {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to upload profile picture')
    }

    // Update authStore with new profile picture
    authStore.currentUser.profile_picture = data.profile_picture
    localStorage.setItem('currentUser', JSON.stringify(authStore.currentUser))

    uploadMessage.value = 'Profile picture updated successfully!'
    uploadMessageType.value = 'text-green-600'

    // Clear message after 3 seconds
    setTimeout(() => {
      uploadMessage.value = ''
    }, 3000)
  } catch (error) {
    uploadMessage.value = error.message || 'Failed to upload profile picture'
    uploadMessageType.value = 'text-red-600'
    profilePictureFile.value = null
  } finally {
    uploading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  message.value = ''
  try {
    const userId = authStore.currentUser?.id
    if (!userId) {
      throw new Error('User ID not found')
    }

    const response = await fetch(`http://localhost:3000/api/farmers/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: profile.value.full_name,
        phone_number: profile.value.phone_number,
        educational_status: profile.value.educational_status
      })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update profile')
    }

    // Update local authStore with the returned data
    authStore.currentUser = { ...authStore.currentUser, ...data.farmer }
    localStorage.setItem('currentUser', JSON.stringify(authStore.currentUser))
    
    message.value = 'Profile updated successfully!'
    messageType.value = 'text-green-600'
    
    // Clear message after 3 seconds
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error) {
    message.value = error.message || 'Failed to update profile.'
    messageType.value = 'text-red-600'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!authStore.currentUser) {
    router.push('/login')
  }
})
</script>

<style scoped>
.edit-profile-page {
  padding: 1.5rem;
  max-width: 640px;
  margin: 0 auto;
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* Header */
.profile-header {
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  padding: 2rem 2rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  color: #fff;
}

.avatar-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255,255,255,0.6);
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 3px solid rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
}

.avatar-upload-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  transition: transform 0.15s;
}

.avatar-upload-btn:hover {
  transform: scale(1.1);
}

.avatar-upload-btn input { display: none; }

.upload-msg {
  font-size: 0.75rem;
  margin-top: 0.35rem;
}

.profile-header-info {
  flex: 1;
  min-width: 0;
}

.profile-header-info .profile-name {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.profile-header-info .profile-ref {
  font-size: 0.8rem;
  opacity: 0.8;
  margin: 0.15rem 0 0;
}

.profile-header-info .profile-barangay {
  font-size: 0.8rem;
  opacity: 0.85;
  margin: 0.25rem 0 0;
}

/* Form */
.profile-form {
  padding: 1.5rem 2rem 2rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.3rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.55rem 0.85rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #111827;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

/* Read-only section */
.readonly-section {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 2rem;
}

.readonly-field {
  flex: 1;
}

.readonly-field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.2rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.readonly-field span {
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
}

/* Actions */
.form-actions {
  margin-top: 1.5rem;
}

.save-btn {
  width: 100%;
  padding: 0.65rem;
  background: #16a34a;
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.save-btn:hover:not(:disabled) {
  background: #15803d;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-message {
  text-align: center;
  font-size: 0.85rem;
  margin-top: 0.75rem;
}

.text-green-600 { color: #16a34a; }
.text-red-600 { color: #dc2626; }
.text-blue-600 { color: #2563eb; }

.hidden { display: none; }

@media (max-width: 640px) {
  .edit-profile-page {
    padding: 1rem;
  }
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem 1.5rem 1.25rem;
  }
  .profile-form {
    padding: 1.25rem 1.5rem 1.5rem;
  }
  .readonly-section {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
