<template>
  <div 
    class="status-card" 
    :class="cardClass"
    :style="cardStyle"
  >
    <div class="status-icon">
      <span>{{ icon }}</span>
    </div>
    <div class="status-content">
      <div class="status-label">{{ status }}</div>
      <div class="status-message">{{ message }}</div>
    </div>
    <div class="status-trend-icon">
      <span>{{ trendIcon }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['Profitable', 'Not Profitable'].includes(value)
  },
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '✔️'
  },
  color: {
    type: String,
    default: 'green',
    validator: (value) => ['green', 'red'].includes(value)
  }
})

const isProfitable = computed(() => props.status === 'Profitable')

const cardClass = computed(() => {
  return isProfitable.value ? 'status-profitable' : 'status-not-profitable'
})

const cardStyle = computed(() => {
  if (isProfitable.value) {
    return {
      '--card-bg-start': '#d1fae5',
      '--card-bg-end': '#a7f3d0',
      '--card-border': '#10b981',
      '--card-text': '#065f46'
    }
  } else {
    return {
      '--card-bg-start': '#fee2e2',
      '--card-bg-end': '#fecaca',
      '--card-border': '#ef4444',
      '--card-text': '#991b1b'
    }
  }
})

const trendIcon = computed(() => {
  return isProfitable.value ? '📈' : '📉'
})
</script>

<style scoped>
.status-card {
  background: linear-gradient(135deg, var(--card-bg-start) 0%, var(--card-bg-end) 100%);
  border: 2px solid var(--card-border);
  border-radius: 16px;
  padding: 24px 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  color: var(--card-text);
  animation: fadeInSlide 0.5s ease-out;
}

.status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--card-border);
  opacity: 0.3;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.status-icon {
  font-size: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-label {
  font-size: 20px;
  font-weight: 700;
  text-transform: none; /* keep sentence case for better readability */
  letter-spacing: 0px;
}

.status-message {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.45;
  opacity: 0.95;
}

.status-trend-icon {
  font-size: 40px;
  flex-shrink: 0;
  opacity: 0.8;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .status-card {
    padding: 20px;
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .status-icon {
    width: 56px;
    height: 56px;
    font-size: 40px;
  }

  .status-label {
    font-size: 18px;
  }

  .status-message {
    font-size: 14px;
  }

  .status-trend-icon {
    font-size: 32px;
  }
}

@media (max-width: 480px) {
  .status-card {
    padding: 16px;
  }

  .status-label {
    font-size: 16px;
  }

  .status-message {
    font-size: 13px;
  }
}
</style>

