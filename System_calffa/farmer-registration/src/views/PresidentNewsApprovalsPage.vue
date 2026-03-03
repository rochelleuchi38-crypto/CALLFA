<template>
  <div class="approval-page">
    <section class="header-card">
      <div>
        <p class="eyebrow">President Tools</p>
        <h1>Pending News Approvals</h1>
        <p class="subtitle">Review farmer submissions and decide publish/reject.</p>
      </div>
      <button class="btn header-btn" type="button" @click="goBack">Back to News</button>
    </section>

    <div v-if="toastMessage" class="toast" :class="toastType">{{ toastMessage }}</div>

    <section class="section">
      <div class="section-head">
        <h2>Pending News</h2>
        <span>{{ pendingNews.length }} item(s)</span>
      </div>

      <p v-if="loading" class="muted">Loading pending news...</p>
      <p v-else-if="pendingNews.length === 0" class="muted">No pending news for review.</p>

      <article v-for="item in pendingNews" :key="item.id" class="card">
        <div class="meta">
          <span>{{ formatDate(item.created_at) }}</span>
          <span>{{ item.author_name || item.author_role }}</span>
          <span class="status pending">{{ item.status }}</span>
        </div>

        <h3>{{ item.title }}</h3>
        <p>{{ item.content }}</p>
        <img v-if="item.image" :src="resolveImageUrl(item.image)" alt="News image" class="image" />

        <div class="review-box">
          <input
            v-model="reviewReasons[item.id]"
            type="text"
            placeholder="Rejection reason (required if rejecting)"
          />
          <button class="btn primary" type="button" @click="reviewNews(item.id, 'published')">Approve</button>
          <button class="btn danger" type="button" @click="reviewNews(item.id, 'rejected')">Reject</button>
          <button class="btn danger-soft" type="button" @click="deleteNews(item.id)">Delete</button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const API_ORIGIN = 'http://localhost:3000'

const authStore = useAuthStore()
const router = useRouter()

const token = computed(() => authStore.token)
const userRole = computed(() => (authStore.currentUser?.role || '').toLowerCase())

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer = null
const newsItems = ref([])
const reviewReasons = ref({})

const pendingNews = computed(() => newsItems.value.filter((item) => item.status === 'pending'))

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

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
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token.value}`
})

const handleUnauthorized = (message) => {
  authStore.logout()
  errorMessage.value = message || 'Session expired. Please log in again.'
  setTimeout(() => {
    router.push('/login')
  }, 250)
}

const fetchPendingNews = async () => {
  clearMessages()
  if (userRole.value !== 'president') {
    errorMessage.value = 'President access required.'
    return
  }

  loading.value = true
  try {
    const response = await fetch('/api/news', { headers: authHeaders() })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch pending news')
    }

    newsItems.value = data.data || []
  } catch (err) {
    errorMessage.value = err.message || 'Failed to fetch pending news'
  } finally {
    loading.value = false
  }
}

const reviewNews = async (id, action) => {
  clearMessages()
  if (userRole.value !== 'president') {
    errorMessage.value = 'Only President can review news.'
    return
  }

  const rejection_reason = (reviewReasons.value[id] || '').trim()
  if (action === 'rejected' && !rejection_reason) {
    errorMessage.value = 'Rejection reason is required when rejecting.'
    return
  }

  try {
    const response = await fetch(`/api/news/${id}/review`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ action, rejection_reason: rejection_reason || null })
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to review news')
    }

    successMessage.value = data.message || 'Review completed.'
    reviewReasons.value[id] = ''
    await fetchPendingNews()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to review news'
  }
}

const deleteNews = async (id) => {
  clearMessages()
  if (userRole.value !== 'president') {
    errorMessage.value = 'Only President can delete news here.'
    return
  }

  if (!window.confirm('Delete this news post?')) return

  try {
    const response = await fetch(`/api/news/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete news')
    }

    successMessage.value = data.message || 'News deleted successfully.'
    await fetchPendingNews()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to delete news'
  }
}

const goBack = () => {
  router.push('/news')
}

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  const normalized = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${API_ORIGIN}${normalized}`
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

onMounted(fetchPendingNews)
</script>

<style scoped>
.approval-page {
  max-width: 1220px;
  margin: 0 auto;
  padding: 24px 16px 30px;
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
  background:
    linear-gradient(130deg, #3f8f5f 0%, #56ab75 48%, #5ab889 100%);
  color: #f4fff7;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 24px 48px rgba(21, 128, 61, 0.22);
}
.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.9;
}
h1 {
  margin: 0;
  font-size: clamp(2rem, 2.2vw, 2.9rem);
}
.subtitle {
  margin: 14px 0 0;
  font-size: 1.05rem;
  opacity: 0.92;
}
.section { margin-top: 22px; }
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 10px;
}
.section-head h2 {
  margin: 0;
  font-size: clamp(2.1rem, 2.2vw, 3rem);
  color: #355843;
}
.section-head span {
  font-size: clamp(1.7rem, 1.7vw, 2.2rem);
  color: #355843;
}
.card {
  border: 1px solid #d7e6d3;
  border-radius: 16px;
  background: #fff;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 10px 24px rgba(22, 101, 52, 0.12);
}
.meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: #64748b; margin-bottom: 8px; }
.status { text-transform: uppercase; font-weight: 700; }
.status.pending { color: #92400e; }
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
.btn.danger { background: #b91c1c; color: #fff; }
.btn.danger-soft { background: #fee2e2; color: #991b1b; }
.header-btn {
  min-width: 170px;
  min-height: 56px;
  font-size: 1rem;
  line-height: 1.1;
}
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
.muted { color: #64748b; }
.image { margin-top: 8px; max-width: 240px; border-radius: 8px; }
.review-box { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
.review-box input { flex: 1; min-width: 220px; padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1; }

@media (max-width: 740px) {
  .header-btn {
    min-width: 150px;
    min-height: 50px;
    font-size: 0.95rem;
  }
  .header-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .section-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
