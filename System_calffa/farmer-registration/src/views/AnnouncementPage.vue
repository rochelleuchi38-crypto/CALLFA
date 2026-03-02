<template>
  <div class="announcement-page">
    <section class="announcement-hero">
      <div class="hero-copy">
        <span class="eyebrow">CALFFA Notices</span>
        <h1 class="page-title">Announcements that need immediate attention</h1>
        <p class="page-subtitle">
          Review meetings, weather alerts, and program updates in a layout that makes urgency clear.
        </p>
      </div>

      <div class="hero-summary">
        <div class="summary-card urgent">
          <span class="summary-value">{{ urgentCount }}</span>
          <span class="summary-label">Urgent notices</span>
        </div>
        <div class="summary-card">
          <span class="summary-value">{{ announcements.length }}</span>
          <span class="summary-label">Total announcements</span>
        </div>
      </div>
    </section>

    <section class="announcement-layout">
      <article class="priority-panel">
        <div class="panel-heading">
          <h2>Priority board</h2>
          <p>High-visibility items are pinned here first.</p>
        </div>

        <div
          v-for="announcement in priorityAnnouncements"
          :key="announcement.id"
          class="priority-item"
          :class="announcement.priority"
        >
          <div class="priority-icon">{{ announcement.icon }}</div>
          <div class="priority-copy">
            <div class="priority-row">
              <span class="priority-tag">{{ priorityLabel(announcement.priority) }}</span>
              <span class="priority-date">{{ formatDate(announcement.date) }}</span>
            </div>
            <h3>{{ announcement.title }}</h3>
            <p>{{ announcement.content }}</p>
          </div>
        </div>
      </article>

      <section class="announcement-list">
        <article
          v-for="announcement in announcements"
          :key="announcement.id"
          class="announcement-card"
          :class="announcement.priority"
        >
          <div class="announcement-top">
            <div class="announcement-icon">{{ announcement.icon }}</div>
            <div class="announcement-meta">
              <div class="meta-row">
                <span class="priority-chip">{{ priorityLabel(announcement.priority) }}</span>
                <span class="announcement-date">{{ formatDate(announcement.date) }}</span>
              </div>
              <h3 class="announcement-title">{{ announcement.title }}</h3>
            </div>
          </div>

          <p class="announcement-content">{{ announcement.content }}</p>

          <div v-if="announcement.actions" class="announcement-actions">
            <button
              v-for="action in announcement.actions"
              :key="action.label"
              class="action-button"
              :class="action.type"
              @click="handleAction(announcement.id, action.action)"
            >
              {{ action.label }}
            </button>
          </div>
        </article>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const announcements = ref([
  {
    id: 1,
    title: 'Monthly Meeting Scheduled',
    content: 'The monthly CALFFA meeting will be held on December 15, 2024 at 2:00 PM. All members are encouraged to attend.',
    date: new Date('2024-12-10'),
    icon: '📅',
    priority: 'normal'
  },
  {
    id: 3,
    title: 'Weather Advisory',
    content: 'Heavy rainfall expected in the next 3 days. Please secure your crops and equipment.',
    date: new Date('2024-12-09'),
    icon: '🌧️',
    priority: 'urgent'
  },
  {
    id: 4,
    title: 'New Loan Program Available',
    content: 'CALFFA is now offering low-interest agricultural loans. Visit the office for more information.',
    date: new Date('2024-12-05'),
    icon: '💰',
    priority: 'important',
    actions: [
      { label: 'Learn More', action: 'learn-more', type: 'secondary' }
    ]
  }
])

const urgentCount = computed(() => announcements.value.filter((item) => item.priority === 'urgent').length)
const priorityAnnouncements = computed(() =>
  announcements.value.filter((item) => item.priority === 'urgent' || item.priority === 'important')
)

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const priorityLabel = (priority) => {
  if (priority === 'urgent') return 'Urgent'
  if (priority === 'important') return 'Important'
  return 'General'
}

const handleAction = (id, action) => {
  if (action === 'register') {
    alert('Redirecting to registration...')
  } else if (action === 'learn-more') {
    alert('Redirecting to loan information...')
  }
}
</script>

<style scoped>
.announcement-page {
  padding: 28px;
  max-width: 1440px;
  margin: 0 auto;
  color: #16241b;
}

.announcement-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
  padding: 28px 30px;
  border: 1px solid rgba(22, 101, 52, 0.14);
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(187, 247, 208, 0.55), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 244, 0.98));
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}

.hero-copy {
  max-width: 760px;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(22, 101, 52, 0.08);
  color: #166534;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-title {
  margin: 0 0 10px;
  font-size: clamp(2rem, 3vw, 3.1rem);
  line-height: 1.08;
}

.page-subtitle {
  margin: 0;
  color: #526257;
  line-height: 1.7;
}

.hero-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 14px;
  min-width: 320px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 18px 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
}

.summary-card.urgent {
  background: linear-gradient(135deg, #dcfce7, #f7fee7);
  border-color: rgba(22, 163, 74, 0.2);
}

.summary-value {
  font-size: 1.8rem;
  font-weight: 800;
}

.summary-label {
  color: #5b6b63;
  font-size: 0.88rem;
}

.announcement-layout {
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 22px;
}

.priority-panel,
.announcement-card {
  border: 1px solid rgba(22, 101, 52, 0.12);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
}

.priority-panel {
  padding: 22px;
  height: fit-content;
  position: sticky;
  top: 24px;
}

.panel-heading {
  margin-bottom: 18px;
}

.panel-heading h2 {
  margin: 0 0 6px;
  font-size: 1.35rem;
}

.panel-heading p {
  margin: 0;
  color: #5b6b63;
}

.priority-item {
  display: flex;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fffb, #f0fdf4);
}

.priority-item + .priority-item {
  margin-top: 12px;
}

.priority-item.urgent {
  background: linear-gradient(135deg, #dcfce7, #f0fdf4);
}

.priority-item.important {
  background: linear-gradient(135deg, #ecfdf5, #f7fee7);
}

.priority-icon,
.announcement-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: rgba(22, 101, 52, 0.08);
  font-size: 1.5rem;
}

.priority-copy h3,
.announcement-title {
  margin: 0;
  color: #10241a;
}

.priority-copy p,
.announcement-content {
  margin: 10px 0 0;
  color: #526257;
  line-height: 1.65;
}

.priority-row,
.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.priority-tag,
.priority-chip {
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(22, 101, 52, 0.1);
  color: #166534;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.priority-date,
.announcement-date {
  color: #68786f;
  font-size: 12px;
}

.announcement-list {
  display: grid;
  gap: 18px;
}

.announcement-card {
  padding: 22px;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.announcement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.1);
}

.announcement-card.urgent {
  border-color: rgba(22, 163, 74, 0.22);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 244, 0.92));
}

.announcement-card.important {
  border-color: rgba(34, 197, 94, 0.18);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 254, 231, 0.9));
}

.announcement-top {
  display: flex;
  gap: 16px;
}

.announcement-meta {
  flex: 1;
}

.announcement-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.action-button {
  padding: 10px 16px;
  border: none;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button.primary {
  background: linear-gradient(135deg, #166534, #22c55e);
  color: #fff;
}

.action-button.secondary {
  background: #ecfdf5;
  color: #166534;
}

@media (max-width: 1080px) {
  .announcement-hero,
  .announcement-layout {
    grid-template-columns: 1fr;
  }

  .announcement-hero {
    flex-direction: column;
  }

  .hero-summary {
    min-width: 0;
  }

  .priority-panel {
    position: static;
  }
}

@media (max-width: 720px) {
  .announcement-page {
    padding: 18px;
  }

  .announcement-hero,
  .priority-panel,
  .announcement-card {
    padding: 20px;
  }

  .hero-summary {
    grid-template-columns: 1fr;
  }

  .announcement-top,
  .priority-item,
  .priority-row,
  .meta-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
