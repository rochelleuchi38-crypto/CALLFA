<template>
  <div class="welcome-container">
    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1 class="welcome-title">
          Welcome back, <span class="user-name">{{ userName }}!</span>
        </h1>
        <p class="welcome-subtitle">
          Access your farming tools and resources to manage your agricultural activities efficiently.
        </p>
      </div>
    </div>

    <!-- Action Cards Grid -->
    <div class="action-cards-grid">
      <router-link
        v-for="card in actionCards"
        :key="card.route"
        :to="card.route"
        class="action-card"
        :class="card.gradient"
      >
        <div class="card-icon">{{ card.icon }}</div>
        <div class="card-content">
          <h3 class="card-title">{{ card.title }}</h3>
          <p class="card-description">{{ card.description }}</p>
        </div>
        <div class="card-arrow">→</div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Check authentication
onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
  }
})

const userName = computed(() => {
  return authStore.currentUser?.full_name || 'Farmer'
})

// Action cards configuration
const actionCards = [
  {
    title: 'Farmer Dashboard',
    description: 'View your farm overview, key metrics, and current crop status',
    icon: '📊',
    route: '/dashboard',
    gradient: 'gradient-green'
  },
  {
    title: 'Loans',
    description: 'Apply for agricultural loans and manage your loan applications',
    icon: '💰',
    route: '/loan',
    gradient: 'gradient-blue'
  },
  {
    title: 'News',
    description: 'Stay updated with the latest agricultural news and updates',
    icon: '📰',
    route: '/news',
    gradient: 'gradient-orange'
  },
  {
    title: 'Announcements',
    description: 'Important announcements and notifications from CALFFA',
    icon: '📢',
    route: '/announcement',
    gradient: 'gradient-red'

  }
]
</script>

<style scoped>
.welcome-container {
  min-height: calc(100vh - 70px);
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-banner {
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  border-radius: 16px;
  padding: 48px 40px;
  margin-bottom: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.welcome-content {
  max-width: 800px;
}

.welcome-title {
  font-size: 42px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  line-height: 1.2;
}

.user-name {
  color: #fef08a;
}

.welcome-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.action-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: height 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.action-card:hover::before {
  height: 100%;
  opacity: 0.05;
}

/* Gradient classes */
.gradient-green::before {
  background: linear-gradient(135deg, #10b981, #059669);
}

.gradient-blue::before {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.gradient-purple::before {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.gradient-orange::before {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.gradient-red::before {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.gradient-yellow::before {
  background: linear-gradient(135deg, #eab308, #ca8a04);
}

.gradient-indigo::before {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.gradient-teal::before {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
}

.gradient-pink::before {
  background: linear-gradient(135deg, #ec4899, #db2777);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
  transition: transform 0.3s ease;
}

.action-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
}

.card-content {
  flex: 1;
  margin-bottom: 16px;
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.3;
}

.card-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.card-arrow {
  font-size: 24px;
  color: #9ca3af;
  transition: all 0.3s ease;
  align-self: flex-end;
}

.action-card:hover .card-arrow {
  color: #166534;
  transform: translateX(4px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .action-cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .welcome-container {
    padding: 20px;
  }

  .welcome-banner {
    padding: 32px 24px;
    margin-bottom: 32px;
  }

  .welcome-title {
    font-size: 32px;
  }

  .welcome-subtitle {
    font-size: 16px;
  }

  .action-cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .action-card {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .welcome-title {
    font-size: 28px;
  }

  .card-title {
    font-size: 20px;
  }
}
</style>
