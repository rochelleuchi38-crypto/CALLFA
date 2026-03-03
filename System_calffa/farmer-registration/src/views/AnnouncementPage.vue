<template>
  <div class="announcement-page">
    <section class="header-card">
      <div>
        <p class="eyebrow">CALFFA Notices</p>
        <h1>Announcements</h1>
        <p class="subtitle">Official updates for members in a social-style feed.</p>
      </div>

      <button
        v-if="canCreateAnnouncement"
        class="btn primary header-btn"
        type="button"
        @click="openCreateModal = true"
      >
        Create Announcement
      </button>
    </section>

    <div v-if="toastMessage" class="toast" :class="toastType">{{ toastMessage }}</div>

    <section class="section">
      <div class="section-head">
        <h2>All Announcements</h2>
        <span>{{ filteredAnnouncements.length }} {{ filteredAnnouncements.length === 1 ? 'item' : 'items' }}</span>
      </div>
      <div class="section-tools">
        <input
          v-model.trim="searchTitle"
          type="text"
          class="search-input"
          placeholder="Search by title..."
        />
        <select v-model="sortOrder" class="sort-select">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      <p v-if="loading" class="muted">Loading announcements...</p>
      <p v-else-if="filteredAnnouncements.length === 0" class="muted">No announcements found.</p>

      <div class="feed-scroll">
        <div class="feed-grid">
          <article v-for="item in filteredAnnouncements" :key="item.id" class="ig-card">
            <div class="ig-top">
              <div class="avatar">{{ authorInitials(item.author_name) }}</div>
              <div class="ig-top-meta">
                <strong class="author-name">{{ item.author_name || item.author_role }}</strong>
                <span class="meta-line">{{ formatDate(item.created_at) }}</span>
              </div>
              <span class="role-pill">{{ item.author_role }}</span>
            </div>

            <img
              v-if="item.image"
              :src="resolveImageUrl(item.image)"
              alt="Announcement image"
              class="ig-image"
            />
            <div v-else class="ig-image ig-image-fallback">
              <span class="placeholder-icon">&#128247;</span>
              <span class="placeholder-text">Image not available</span>
            </div>

            <div class="ig-actions">
              <span class="action-right">
                <span class="bookmark">🔖</span>
                <button
                  v-if="canDeleteAnnouncement"
                  class="icon-btn delete-btn"
                  type="button"
                  title="Delete announcement"
                  @click="openDeleteModal(item.id)"
                >
                  🗑
                </button>
              </span>
            </div>

            <div class="ig-caption">
              <h3>{{ item.title }}</h3>
              <p>{{ item.content }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div v-if="openCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal">
        <h3>Create Announcement</h3>
        <label>Title</label>
        <input v-model="createForm.title" type="text" maxlength="255" />

        <label>Content</label>
        <textarea v-model="createForm.content" rows="6"></textarea>

        <label>Attach Image (optional)</label>
        <input type="file" accept="image/*" @change="onImageSelected" />
        <p v-if="createForm.imageFileName" class="file-name">Selected: {{ createForm.imageFileName }}</p>

        <div class="modal-actions">
          <button class="btn" type="button" @click="closeCreateModal">Cancel</button>
          <button class="btn primary" type="button" :disabled="submitting" @click="submitCreateAnnouncement">
            {{ submitting ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="openDeleteConfirmModal" class="modal-backdrop" @click.self="closeDeleteModal">
      <div class="modal delete-modal">
        <h3>Confirm Deletion</h3>
        <p>This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn" type="button" @click="closeDeleteModal">Cancel</button>
          <button class="btn danger" type="button" @click="confirmDeleteAnnouncement">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const API_ORIGIN = 'http://localhost:3000'

const authStore = useAuthStore()
const router = useRouter()
const userRole = computed(() => (authStore.currentUser?.role || '').toLowerCase())
const token = computed(() => authStore.token)
const canCreateAnnouncement = computed(() => ['president', 'admin'].includes(userRole.value))
const canDeleteAnnouncement = computed(() => ['president', 'admin'].includes(userRole.value))

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer = null

const announcements = ref([])
const searchTitle = ref('')
const sortOrder = ref('newest')
const openCreateModal = ref(false)
const openDeleteConfirmModal = ref(false)
const pendingDeleteAnnouncementId = ref(null)
const createForm = ref({
  title: '',
  content: '',
  imageFile: null,
  imageFileName: ''
})

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const filteredAnnouncements = computed(() => {
  const query = searchTitle.value.toLowerCase()
  let rows = announcements.value
  if (query) {
    rows = rows.filter((item) => String(item.title || '').toLowerCase().includes(query))
  }
  rows = [...rows].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime()
    const bTime = new Date(b.created_at).getTime()
    return sortOrder.value === 'oldest' ? aTime - bTime : bTime - aTime
  })
  return rows
})

const showToast = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2400)
}
watch(errorMessage, (value) => {
  if (value) showToast(value, 'error')
})
watch(successMessage, (value) => {
  if (value) showToast(value, 'success')
})

const authHeaders = () => ({
  Authorization: `Bearer ${token.value}`
})

const handleUnauthorized = (message) => {
  authStore.logout()
  errorMessage.value = message || 'Session expired. Please log in again.'
  setTimeout(() => {
    router.push('/login')
  }, 250)
}

const fetchAnnouncements = async () => {
  clearMessages()
  if (!token.value) {
    errorMessage.value = 'Please log in first.'
    return
  }

  loading.value = true
  try {
    const response = await fetch('/api/announcements', { headers: authHeaders() })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch announcements')
    }

    announcements.value = data.data || []
  } catch (err) {
    errorMessage.value = err.message || 'Failed to fetch announcements'
  } finally {
    loading.value = false
  }
}

const onImageSelected = (event) => {
  const file = event.target.files?.[0] || null
  createForm.value.imageFile = file
  createForm.value.imageFileName = file ? file.name : ''
}

const submitCreateAnnouncement = async () => {
  clearMessages()
  if (!canCreateAnnouncement.value) {
    errorMessage.value = 'Only President or Admin can create announcements.'
    return
  }

  const title = createForm.value.title.trim()
  const content = createForm.value.content.trim()

  if (!title || !content) {
    errorMessage.value = 'Title and content are required.'
    return
  }

  const formData = new FormData()
  formData.append('title', title)
  formData.append('content', content)
  if (createForm.value.imageFile) {
    formData.append('image', createForm.value.imageFile)
  }

  submitting.value = true
  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create announcement')
    }

    successMessage.value = data.message || 'Announcement posted successfully.'
    closeCreateModal()
    await fetchAnnouncements()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to create announcement'
  } finally {
    submitting.value = false
  }
}

const closeCreateModal = () => {
  openCreateModal.value = false
  createForm.value = {
    title: '',
    content: '',
    imageFile: null,
    imageFileName: ''
  }
}

const openDeleteModal = (id) => {
  pendingDeleteAnnouncementId.value = id
  openDeleteConfirmModal.value = true
}

const closeDeleteModal = () => {
  openDeleteConfirmModal.value = false
  pendingDeleteAnnouncementId.value = null
}

const confirmDeleteAnnouncement = async () => {
  if (!pendingDeleteAnnouncementId.value) return
  await deleteAnnouncement(pendingDeleteAnnouncementId.value)
  closeDeleteModal()
}

const deleteAnnouncement = async (id) => {
  clearMessages()

  try {
    const response = await fetch('/api/announcements/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ announcement_id: id })
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete announcement')
    }

    showToast('Post deleted successfully.')
    await fetchAnnouncements()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to delete announcement'
  }
}

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  const normalized = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${API_ORIGIN}${normalized}`
}

const authorInitials = (name) => {
  const source = (name || 'User').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(fetchAnnouncements)
</script>

<style scoped>
.announcement-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  background:
    radial-gradient(circle at 18% 14%, rgba(187, 247, 208, 0.48), transparent 30%),
    radial-gradient(circle at 82% 15%, rgba(253, 224, 71, 0.18), transparent 26%),
    #eff4eb;
}
.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 24px;
  border-radius: 20px;
  background: linear-gradient(130deg, #3f8f5f 0%, #56ab75 48%, #5ab889 100%);
  color: #f4fff7;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 24px 48px rgba(21, 128, 61, 0.22);
}
.eyebrow { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.9; }
h1 { margin: 0; font-size: clamp(2rem, 2.2vw, 2.9rem); }
.subtitle { margin: 14px 0 0; opacity: 0.92; font-size: 1.05rem; }
.section { margin-top: 22px; }
.section-head { display: flex; justify-content: space-between; align-items: end; margin-bottom: 10px; }
.section-head h2 { margin: 0; font-size: clamp(2.1rem, 2.2vw, 3rem); color: #355843; }
.section-head span { font-size: clamp(1.7rem, 1.7vw, 2.2rem); color: #355843; }
.section-tools {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.search-input,
.sort-select {
  border: 1px solid #cfe1cd;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #1f2937;
  background: #f9fdf8;
}
.search-input {
  flex: 1;
  min-width: 180px;
}
.sort-select {
  min-width: 130px;
}
.feed-scroll {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 6px;
}
.feed-scroll::-webkit-scrollbar {
  width: 8px;
}
.feed-scroll::-webkit-scrollbar-thumb {
  background: #b8d4bf;
  border-radius: 999px;
}
.feed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 20px;
  justify-content: center;
}
.ig-card {
  border: 1px solid #d7e6d3;
  border-radius: 16px;
  background:
    linear-gradient(180deg, #f3fbf3 0%, #eaf6ea 100%);
  margin: 0;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(22, 101, 52, 0.12);
  height: 440px;
  display: flex;
  flex-direction: column;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  width: 100%;
  max-width: 560px;
  justify-self: center;
}
.ig-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 32px rgba(22, 101, 52, 0.18);
}
.ig-top { display: flex; align-items: center; gap: 10px; padding: 10px 10px 8px; }
.ig-top-meta { display: flex; flex-direction: column; min-width: 0; }
.author-name { font-size: 13px; line-height: 1.2; }
.meta-line { font-size: 12px; color: #64748b; }
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #166534, #22c55e);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
}
.role-pill {
  margin-left: auto;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(22, 101, 52, 0.12);
  color: #166534;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.ig-image {
  width: 100%;
  display: block;
  height: 210px;
  object-fit: cover;
  flex-shrink: 0;
}
.ig-image-fallback {
  height: 210px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  background: linear-gradient(145deg, #e8f5e9, #dff1de);
  font-weight: 600;
}
.placeholder-icon {
  font-size: 26px;
  opacity: 0.7;
}
.placeholder-text {
  font-size: 13px;
}
.ig-actions { display: flex; gap: 10px; padding: 8px 10px 4px; font-size: 18px; color: #334155; }
.action-right { margin-left: auto; display: inline-flex; gap: 8px; align-items: center; }
.icon-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}
.delete-btn {
  color: #b91c1c;
}
.btn.danger { background: #b91c1c; color: #fff; }
.toast {
  position: fixed;
  right: 22px;
  top: 22px;
  z-index: 1200;
  background: #14532d;
  color: #fff;
  padding: 10px 14px;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(21, 128, 61, 0.28);
  font-weight: 600;
}
.toast.error {
  background: #991b1b;
  box-shadow: 0 12px 28px rgba(153, 27, 27, 0.28);
}
.ig-caption {
  padding: 4px 12px 14px;
  overflow: hidden;
  background: rgba(242, 250, 242, 0.9);
  border-top: 1px solid #d3e4d0;
}
.ig-caption h3 { margin: 4px 0 6px; font-size: 15px; color: #10241a; }
.ig-caption p {
  margin: 0;
  color: #334155;
  font-size: 13px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.btn {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  cursor: pointer;
  background: #e5edf4;
  color: #21334b;
  font-weight: 700;
  font-size: 1rem;
}
.btn.primary { background: #2f8d54; color: #fff; }
.header-btn {
  min-width: 170px;
  min-height: 56px;
  font-size: 1rem;
  line-height: 1.1;
}
.error { margin-top: 12px; background: #fee2e2; color: #7f1d1d; padding: 10px 12px; border-radius: 8px; }
.success { margin-top: 12px; background: #dcfce7; color: #14532d; padding: 10px 12px; border-radius: 8px; }
.muted { color: #64748b; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: grid; place-items: center; padding: 16px; }
.modal {
  width: min(560px, 100%);
  background: linear-gradient(180deg, #fbfefb 0%, #f2f8f2 100%);
  border: 1px solid #dbe8d8;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 18px 38px rgba(22, 101, 52, 0.2);
}
.modal h3 { margin-top: 0; }
.modal label { display: block; margin-top: 8px; font-weight: 600; }
.modal input, .modal textarea { width: 100%; box-sizing: border-box; margin-top: 6px; padding: 9px; border-radius: 8px; border: 1px solid #cbd5e1; }
.file-name { margin-top: 6px; color: #475569; font-size: 13px; }
.modal-actions { display: flex; justify-content: end; gap: 8px; margin-top: 12px; }

@media (max-width: 1024px) {
  .feed-grid { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }
  .header-btn {
    min-width: 160px;
    font-size: 1rem;
  }
}

@media (max-width: 640px) {
  .feed-grid { grid-template-columns: 1fr; }
  .ig-card { height: 400px; }
  .section-tools {
    flex-direction: column;
  }
  .header-btn {
    min-width: 150px;
    min-height: 50px;
    font-size: 0.95rem;
  }
  .header-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
