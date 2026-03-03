<template>
  <div class="news-page">
    <section class="header-card">
      <div>
        <p class="eyebrow">CALFFA Bulletin</p>
        <h1>News Feed</h1>
        <p class="subtitle">Role-based posting and approval flow with live database data.</p>
      </div>

      <div class="header-actions">
        <span class="count-badge">{{ visiblePostCount }} post(s)</span>
        <button
          v-if="canCreateNews"
          class="btn primary header-btn"
          type="button"
          @click="openCreateModal = true"
        >
          Create News
        </button>
        <button
          v-if="isPresident"
          class="btn header-btn"
          type="button"
          @click="goToPendingApprovals"
        >
          Pending Approvals
        </button>
        <select v-model="quickFilter" class="control-select">
          <option value="all">All</option>
          <option v-if="isFarmer" value="my">My Posts</option>
          <option value="pending">Pending</option>
        </select>
        <select v-model="sortOrder" class="control-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </section>

    <div v-if="toastMessage" class="toast" :class="toastType">{{ toastMessage }}</div>

    <section v-if="showPublishedSection" class="section">
      <div class="section-head">
        <h2>{{ isFarmer ? 'Published News (Community Feed)' : 'Published News' }}</h2>
        <span>{{ publishedNews.length }} item(s)</span>
      </div>

      <p v-if="loading" class="muted">Loading news...</p>
      <p v-else-if="publishedNews.length === 0" class="muted">No published news available.</p>

      <div class="feed-scroll">
        <div class="feed-grid">
          <article v-for="item in publishedNews" :key="item.id" class="ig-card" :class="{ 'no-image-card': !item.image }">
            <div class="ig-top">
              <div class="avatar">{{ authorInitials(item.author_name) }}</div>
              <div class="ig-top-meta">
                <strong class="author-name">{{ item.author_name || item.author_role }}</strong>
                <span class="meta-line">{{ formatDate(item.created_at) }}</span>
              </div>
              <div class="top-right-tags">
                <span class="role-pill">{{ item.author_role }}</span>
                <span class="status-pill" :class="`status-${item.status}`">{{ formatStatus(item.status) }}</span>
              </div>
            </div>

            <div class="ig-caption">
              <h3 class="news-title">{{ item.title }}</h3>
              <p class="news-content">{{ item.content }}</p>
              <button
                v-if="isLongContent(item.content)"
                class="read-more-btn"
                type="button"
                @click="openContentModal(item)"
              >
                Read more
              </button>
            </div>

            <img
              v-if="item.image"
              :src="resolveImageUrl(item.image)"
              alt="News image"
              class="ig-image"
            />

            <div class="ig-actions">
              <span class="action-right">
                <span class="bookmark">&#128278;</span>
                <button
                  v-if="canEditNewsItem(item)"
                  class="icon-btn edit-btn"
                  type="button"
                  title="Edit news"
                  @click="openEditModal(item)"
                >
                  &#9998;
                </button>
                <button
                  v-if="canDeleteNewsItem(item)"
                  class="icon-btn delete-btn"
                  type="button"
                  title="Delete news"
                  @click="openDeleteModal(item.id)"
                >
                  &#128465;
                </button>
              </span>
            </div>

          </article>
        </div>
      </div>
    </section>

    <section v-if="showMyPostsSection" class="section">
      <div class="section-head">
        <h2>My Submissions</h2>
        <span>{{ mySubmissions.length }} item(s)</span>
      </div>

      <p v-if="loading" class="muted">Loading news...</p>
      <p v-else-if="mySubmissions.length === 0" class="muted">You have no submissions yet.</p>

      <div class="feed-scroll">
        <div class="feed-grid">
          <article v-for="item in mySubmissions" :key="`mine-${item.id}`" class="ig-card" :class="{ 'no-image-card': !item.image }">
            <div class="ig-top">
              <div class="avatar">{{ authorInitials(item.author_name) }}</div>
              <div class="ig-top-meta">
                <strong class="author-name">{{ item.author_name || item.author_role }}</strong>
                <span class="meta-line">{{ formatDate(item.created_at) }}</span>
              </div>
              <div class="top-right-tags">
                <span class="role-pill">{{ item.author_role }}</span>
                <span class="status-pill" :class="`status-${item.status}`">{{ formatStatus(item.status) }}</span>
              </div>
            </div>

            <div class="ig-caption">
              <h3 class="news-title">{{ item.title }}</h3>
              <p class="news-content">{{ item.content }}</p>
              <button
                v-if="isLongContent(item.content)"
                class="read-more-btn"
                type="button"
                @click="openContentModal(item)"
              >
                Read more
              </button>
            </div>

            <img
              v-if="item.image"
              :src="resolveImageUrl(item.image)"
              alt="News image"
              class="ig-image"
            />

            <div class="ig-actions">
              <span class="action-right">
                <span class="bookmark">&#128278;</span>
                <button
                  v-if="canEditNewsItem(item)"
                  class="icon-btn edit-btn"
                  type="button"
                  title="Edit news"
                  @click="openEditModal(item)"
                >
                  &#9998;
                </button>
                <button
                  v-if="canDeleteNewsItem(item)"
                  class="icon-btn delete-btn"
                  type="button"
                  title="Delete news"
                  @click="openDeleteModal(item.id)"
                >
                  &#128465;
                </button>
              </span>
            </div>

          </article>
        </div>
      </div>
    </section>

    <section v-if="showMyPostsSection && rejectedSubmissions.length" class="section">
      <div class="rejected-bottom">
        <h3>Rejected ({{ rejectedSubmissions.length }})</h3>
        <ul class="rejected-list">
          <li v-for="item in rejectedSubmissions" :key="`rejected-${item.id}`">
            <strong>{{ item.title }}</strong>
            <span class="meta-line"> - {{ formatDate(item.updated_at || item.created_at) }}</span>
            <span v-if="item.rejection_reason" class="rejection-reason-inline"> | {{ item.rejection_reason }}</span>
            <button class="mini-link" type="button" @click="openEditModal(item)">Edit</button>
            <button class="mini-link danger-link" type="button" @click="openDeleteModal(item.id)">Delete</button>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="showPendingSection" class="section">
      <div class="section-head">
        <h2>{{ isPresident ? 'Pending News (For Review)' : 'Pending News' }}</h2>
        <span>{{ pendingPosts.length }} item(s)</span>
      </div>

      <p v-if="loading" class="muted">Loading news...</p>
      <p v-else-if="pendingPosts.length === 0" class="muted">No pending posts.</p>

      <div class="feed-scroll">
        <div class="feed-grid">
          <article v-for="item in pendingPosts" :key="`pending-${item.id}`" class="ig-card" :class="{ 'no-image-card': !item.image }">
            <div class="ig-top">
              <div class="avatar">{{ authorInitials(item.author_name) }}</div>
              <div class="ig-top-meta">
                <strong class="author-name">{{ item.author_name || item.author_role }}</strong>
                <span class="meta-line">{{ formatDate(item.created_at) }}</span>
              </div>
              <div class="top-right-tags">
                <span class="role-pill">{{ item.author_role }}</span>
                <span class="status-pill" :class="`status-${item.status}`">{{ formatStatus(item.status) }}</span>
              </div>
            </div>

            <div class="ig-caption">
              <h3 class="news-title">{{ item.title }}</h3>
              <p class="news-content">{{ item.content }}</p>
              <button
                v-if="isLongContent(item.content)"
                class="read-more-btn"
                type="button"
                @click="openContentModal(item)"
              >
                Read more
              </button>
            </div>

            <img
              v-if="item.image"
              :src="resolveImageUrl(item.image)"
              alt="News image"
              class="ig-image"
            />

            <div class="ig-actions">
              <span class="action-right">
                <span class="bookmark">&#128278;</span>
                <button
                  v-if="canEditNewsItem(item)"
                  class="icon-btn edit-btn"
                  type="button"
                  title="Edit news"
                  @click="openEditModal(item)"
                >
                  &#9998;
                </button>
                <button
                  v-if="canDeleteNewsItem(item)"
                  class="icon-btn delete-btn"
                  type="button"
                  title="Delete news"
                  @click="openDeleteModal(item.id)"
                >
                  &#128465;
                </button>
              </span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div v-if="openCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal">
        <h3>Create News</h3>

        <label>Title</label>
        <input v-model="createForm.title" type="text" maxlength="255" />

        <label>Content</label>
        <textarea v-model="createForm.content" rows="6"></textarea>

        <label>Attach Image (optional)</label>
        <input type="file" accept="image/*" @change="onImageSelected" />
        <p v-if="createForm.imageFileName" class="file-name">Selected: {{ createForm.imageFileName }}</p>

        <div class="modal-actions">
          <button class="btn" type="button" @click="closeCreateModal">Cancel</button>
          <button class="btn primary" type="button" :disabled="submitting" @click="submitCreateNews">
            {{ submitting ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="openEditNewsModal" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal">
        <h3>Edit News</h3>

        <label>Title</label>
        <input v-model="editForm.title" type="text" maxlength="255" />

        <label>Content</label>
        <textarea v-model="editForm.content" rows="6"></textarea>

        <label>Image Preview</label>
        <img v-if="editForm.imagePreview" :src="editForm.imagePreview" alt="Current image" class="preview-image" />
        <div v-else class="preview-empty">No image</div>

        <label>Replace Image (optional)</label>
        <input type="file" accept="image/*" @change="onEditImageSelected" />
        <p v-if="editForm.imageFileName" class="file-name">Selected: {{ editForm.imageFileName }}</p>

        <div class="modal-actions">
          <button class="btn" type="button" @click="closeEditModal">Cancel</button>
          <button class="btn primary" type="button" :disabled="submitting" @click="submitEditNews">
            {{ submitting ? 'Saving...' : 'Save Changes' }}
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
          <button class="btn danger" type="button" @click="confirmDeleteNews">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="openContentPreviewModal" class="modal-backdrop" @click.self="closeContentModal">
      <div class="modal">
        <h3>{{ contentPreviewItem.title }}</h3>
        <p class="full-content">{{ contentPreviewItem.content }}</p>
        <div class="modal-actions">
          <button class="btn primary" type="button" @click="closeContentModal">Close</button>
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
const currentUserId = computed(() => Number(authStore.currentUser?.id || 0))
const token = computed(() => authStore.token)

const isFarmer = computed(() => userRole.value === 'farmer')
const isPresident = computed(() => userRole.value === 'president')
const canCreateNews = computed(() => ['farmer', 'president'].includes(userRole.value))

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer = null
const newsItems = ref([])

const openCreateModal = ref(false)
const openEditNewsModal = ref(false)
const openDeleteConfirmModal = ref(false)
const openContentPreviewModal = ref(false)
const pendingDeleteNewsId = ref(null)
const contentPreviewItem = ref({ title: '', content: '' })
const quickFilter = ref('all')
const sortOrder = ref('newest')
const createForm = ref({
  title: '',
  content: '',
  imageFile: null,
  imageFileName: ''
})
const editForm = ref({
  id: null,
  title: '',
  content: '',
  imageFile: null,
  imageFileName: '',
  imagePreview: ''
})

const sortItems = (items) => [...items].sort((a, b) => {
  const aTime = new Date(a.created_at).getTime()
  const bTime = new Date(b.created_at).getTime()
  return sortOrder.value === 'oldest' ? aTime - bTime : bTime - aTime
})

const publishedNews = computed(() => sortItems(newsItems.value.filter((item) => item.status === 'published')))
const myOwnedNews = computed(() =>
  sortItems(newsItems.value.filter((item) => item.author_id === currentUserId.value))
)
const mySubmissions = computed(() =>
  myOwnedNews.value.filter((item) => item.status !== 'rejected')
)
const rejectedSubmissions = computed(() =>
  myOwnedNews.value.filter((item) => item.status === 'rejected')
)
const pendingPosts = computed(() => {
  const source = isFarmer.value
    ? myOwnedNews.value
    : newsItems.value
  return sortItems(source.filter((item) => item.status === 'pending'))
})

const showPublishedSection = computed(() => quickFilter.value === 'all')
const showMyPostsSection = computed(() => isFarmer.value && (quickFilter.value === 'all' || quickFilter.value === 'my'))
const showPendingSection = computed(() => quickFilter.value === 'pending')
const visiblePostCount = computed(() => {
  if (quickFilter.value === 'my' && isFarmer.value) return myOwnedNews.value.length
  if (quickFilter.value === 'pending') return pendingPosts.value.length
  return publishedNews.value.length
})

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
  Authorization: `Bearer ${token.value}`
})

const handleUnauthorized = (message) => {
  authStore.logout()
  errorMessage.value = message || 'Session expired. Please log in again.'
  setTimeout(() => {
    router.push('/login')
  }, 250)
}

const fetchNews = async () => {
  clearMessages()
  if (!token.value) {
    errorMessage.value = 'Please log in first.'
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
      throw new Error(data.message || 'Failed to fetch news')
    }

    newsItems.value = data.data || []
  } catch (err) {
    errorMessage.value = err.message || 'Failed to fetch news'
  } finally {
    loading.value = false
  }
}

const onImageSelected = (event) => {
  const file = event.target.files?.[0] || null
  createForm.value.imageFile = file
  createForm.value.imageFileName = file ? file.name : ''
}

const submitCreateNews = async () => {
  clearMessages()
  if (!canCreateNews.value) {
    errorMessage.value = 'You are not allowed to create news.'
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
    const response = await fetch('/api/news', {
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
      throw new Error(data.message || 'Failed to create news')
    }

    successMessage.value = data.message || 'News submitted successfully.'
    closeCreateModal()
    await fetchNews()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to create news'
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

const canEditNewsItem = (item) => {
  if (isPresident.value) return true
  if (!isFarmer.value) return false
  return Number(item.author_id) === currentUserId.value
}

const openEditModal = (item) => {
  if (!canEditNewsItem(item)) return
  editForm.value = {
    id: item.id,
    title: item.title || '',
    content: item.content || '',
    imageFile: null,
    imageFileName: '',
    imagePreview: item.image ? resolveImageUrl(item.image) : ''
  }
  openEditNewsModal.value = true
}

const closeEditModal = () => {
  openEditNewsModal.value = false
  editForm.value = {
    id: null,
    title: '',
    content: '',
    imageFile: null,
    imageFileName: '',
    imagePreview: ''
  }
}

const onEditImageSelected = (event) => {
  const file = event.target.files?.[0] || null
  editForm.value.imageFile = file
  editForm.value.imageFileName = file ? file.name : ''
  if (file) {
    editForm.value.imagePreview = URL.createObjectURL(file)
  }
}

const submitEditNews = async () => {
  clearMessages()
  const title = editForm.value.title.trim()
  const content = editForm.value.content.trim()
  const id = Number(editForm.value.id)

  if (!id || !title || !content) {
    errorMessage.value = 'Title and content are required.'
    return
  }

  const formData = new FormData()
  formData.append('news_id', String(id))
  formData.append('title', title)
  formData.append('content', content)
  if (editForm.value.imageFile) {
    formData.append('image', editForm.value.imageFile)
  }

  submitting.value = true
  try {
    const response = await fetch('/api/news/update', {
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
      throw new Error(data.message || 'Failed to update news')
    }

    closeEditModal()
    showToast('Post updated successfully.')
    await fetchNews()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to update news'
  } finally {
    submitting.value = false
  }
}

const openDeleteModal = (id) => {
  pendingDeleteNewsId.value = id
  openDeleteConfirmModal.value = true
}

const closeDeleteModal = () => {
  openDeleteConfirmModal.value = false
  pendingDeleteNewsId.value = null
}

const isLongContent = (content) => String(content || '').trim().length > 130

const openContentModal = (item) => {
  contentPreviewItem.value = {
    title: item.title || '',
    content: item.content || ''
  }
  openContentPreviewModal.value = true
}

const closeContentModal = () => {
  openContentPreviewModal.value = false
  contentPreviewItem.value = { title: '', content: '' }
}

const confirmDeleteNews = async () => {
  if (!pendingDeleteNewsId.value) return
  await deleteNews(pendingDeleteNewsId.value)
  closeDeleteModal()
}

const canDeleteNewsItem = (item) => {
  if (isPresident.value) return true
  if (!isFarmer.value) return false
  return Number(item.author_id) === currentUserId.value
}

const deleteNews = async (id) => {
  clearMessages()

  try {
    const response = await fetch('/api/news/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ news_id: id })
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete news')
    }

    showToast('Post deleted successfully.')
    await fetchNews()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to delete news'
  }
}

const goToPendingApprovals = () => {
  router.push('/president-news-approvals')
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

const formatStatus = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'pending') return 'Pending'
  if (normalized === 'published') return 'Published'
  if (normalized === 'rejected') return 'Rejected'
  return 'Unknown'
}

onMounted(fetchNews)
</script>

<style scoped>
.news-page {
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
  padding: 18px 22px;
  border-radius: 20px;
  background:
    linear-gradient(130deg, #4aa96d 0%, #3fa764 48%, #2f8f53 100%);
  color: #f4fff7;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 24px 48px rgba(21, 128, 61, 0.22);
}
.eyebrow { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.9; }
h1 { margin: 0; font-size: clamp(2rem, 2.2vw, 2.9rem); }
.subtitle { margin: 10px 0 0; opacity: 0.92; font-size: 1rem; }
.header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: end; }
.count-badge {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #f4fff7;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.9rem;
  font-weight: 700;
}
.control-select {
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.18);
  color: #f4fff7;
  font-weight: 700;
  font-size: 0.92rem;
}
.control-select option {
  color: #1f2937;
}
.section { margin-top: 22px; }
.section-head { display: flex; justify-content: space-between; align-items: end; margin-bottom: 10px; }
.section-head h2 { margin: 0; font-size: clamp(2.1rem, 2.2vw, 3rem); color: #355843; }
.section-head span { font-size: clamp(1.7rem, 1.7vw, 2.2rem); color: #355843; }
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
  border: 2px solid #8fc5a0;
  border-radius: 16px;
  background: #ffffff;
  margin: 0;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  min-height: 380px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  justify-self: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  outline: 1px solid rgba(34, 139, 74, 0.16);
  outline-offset: -3px;
}
.ig-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}
.ig-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 10px;
}
.ig-top-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.author-name {
  font-size: 13px;
  line-height: 1.2;
}
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
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(22, 101, 52, 0.12);
  color: #166534;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.top-right-tags {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-pill {
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-published {
  background: #dcfce7;
  color: #166534;
}
.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}
.ig-image {
  width: min(92%, 300px);
  display: block;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  flex-shrink: 0;
  margin: 8px auto 0;
  border: 2px solid #8fc5a0;
  border-radius: 16px;
  background: #f6fbf6;
  padding: 4px;
  box-sizing: border-box;
}
.no-image-card .ig-actions {
  margin-top: auto;
}
.ig-actions {
  display: flex;
  gap: 10px;
  padding: 10px 12px 6px;
  font-size: 18px;
  color: #334155;
}
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
.edit-btn {
  color: #1d4ed8;
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
  overflow: visible;
  background: #ffffff;
  border-top: 1px solid #eef2ef;
}
.news-title {
  margin: 4px 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #10241a;
}
.news-content {
  margin: 0;
  color: #555;
  font-size: 14px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.read-more-btn {
  margin-top: 8px;
  border: none;
  background: transparent;
  color: #166534;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.full-content {
  color: #334155;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-height: 52vh;
  overflow-y: auto;
  padding-right: 4px;
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
.rejection-reason { color: #991b1b; font-size: 14px; margin-top: 8px; }
.rejected-bottom {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #f3d2d2;
  background: #fff7f7;
  border-radius: 10px;
}
.rejected-bottom h3 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #7f1d1d;
}
.rejected-list {
  margin: 0;
  padding-left: 18px;
}
.rejected-list li {
  margin-bottom: 6px;
  color: #334155;
  font-size: 13px;
}
.rejection-reason-inline {
  color: #991b1b;
}
.mini-link {
  margin-left: 8px;
  border: none;
  background: transparent;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
}
.danger-link {
  color: #b91c1c;
}
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
.preview-image {
  margin-top: 6px;
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
}
.preview-empty {
  margin-top: 6px;
  padding: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
}
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
  .ig-card { min-height: 340px; }
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


