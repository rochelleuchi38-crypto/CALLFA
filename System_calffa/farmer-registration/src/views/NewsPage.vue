<template>
  <div class="news-page">
    <section class="hero-panel">
      <div class="hero-copy">
        <span class="eyebrow">CALFFA Bulletin</span>
        <h1 class="page-title">News and field updates for every farming community</h1>
        <p class="page-subtitle">
          Track market movement, policy changes, and local agricultural activities from one place.
        </p>

        <div class="hero-metrics">
          <div
            v-for="metric in articleMetrics"
            :key="metric.label"
            class="metric-pill"
          >
            <span class="metric-value">{{ metric.value }}</span>
            <span class="metric-label">{{ metric.label }}</span>
          </div>
        </div>
      </div>

      <article class="featured-card" @click="viewArticle(featuredArticle.id)">
        <div
          class="featured-image"
          :style="{ backgroundImage: `url(${featuredArticle.image})` }"
        >
          <span class="featured-badge">{{ featuredArticle.category }}</span>
        </div>

        <div class="featured-body">
          <div class="featured-meta">
            <span>{{ formatDate(featuredArticle.date) }}</span>
            <span>{{ featuredArticle.author }}</span>
          </div>
          <h2 class="featured-title">{{ featuredArticle.title }}</h2>
          <p class="featured-excerpt">{{ featuredArticle.excerpt }}</p>
          <button class="featured-action" type="button">Open article</button>
        </div>
      </article>
    </section>

    <section class="section-header">
      <div>
        <h2>Latest coverage</h2>
        <p>Fresh stories on research, subsidies, workshops, and crop opportunities.</p>
      </div>
      <span class="section-count">{{ newsArticles.length }} stories</span>
    </section>

    <section class="news-grid">
      <article
        v-for="article in secondaryArticles"
        :key="article.id"
        class="news-card"
        @click="viewArticle(article.id)"
      >
        <div
          class="news-image"
          :style="{ backgroundImage: `url(${article.image})` }"
        >
          <span class="news-category">{{ article.category }}</span>
        </div>

        <div class="news-content">
          <div class="news-meta">
            <span>{{ formatDate(article.date) }}</span>
            <span>{{ article.author }}</span>
          </div>
          <h3 class="news-title">{{ article.title }}</h3>
          <p class="news-excerpt">{{ article.excerpt }}</p>
          <span class="read-more">Read full story</span>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const newsArticles = ref([
  {
    id: 1,
    title: 'New Rice Varieties Show 20% Higher Yield',
    excerpt: 'Agricultural researchers have developed new rice varieties that demonstrate significantly improved yields and disease resistance.',
    author: 'CALFFA Research Team',
    date: new Date('2024-12-10'),
    category: 'Research',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200'
  },
  {
    id: 2,
    title: 'Government Launches New Farming Subsidy Program',
    excerpt: 'The Department of Agriculture announces new subsidies for small-scale farmers to support sustainable farming practices.',
    author: 'Government News',
    date: new Date('2024-12-08'),
    category: 'Policy',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200'
  },
  {
    id: 3,
    title: 'Organic Farming Techniques Workshop',
    excerpt: 'Learn sustainable organic farming methods in our upcoming workshop. Registration is now open for all CALFFA members.',
    author: 'CALFFA Events',
    date: new Date('2024-12-07'),
    category: 'Events',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200'
  },
  {
    id: 4,
    title: 'Market Prices Reach New Highs',
    excerpt: 'Rice and corn prices have reached record highs this season, providing excellent opportunities for farmers.',
    author: 'Market Update',
    date: new Date('2024-12-05'),
    category: 'Market',
    image: 'https://images.unsplash.com/photo-1492496913980-501348b61469?w=1200'
  }
])

const featuredArticle = computed(() => newsArticles.value[0])
const secondaryArticles = computed(() => newsArticles.value.slice(1))
const articleMetrics = computed(() => [
  { label: 'Stories', value: newsArticles.value.length },
  { label: 'Categories', value: new Set(newsArticles.value.map((article) => article.category)).size },
  { label: 'Latest', value: formatDate(newsArticles.value[0]?.date) }
])

const formatDate = (date) => {
  if (!date) return ''

  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const viewArticle = (id) => {
  alert(`Viewing article #${id}`)
}
</script>

<style scoped>
.news-page {
  padding: 28px;
  max-width: 1440px;
  margin: 0 auto;
  color: #14281d;
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 24px;
  margin-bottom: 28px;
}

.hero-copy,
.featured-card,
.news-card {
  border: 1px solid rgba(21, 94, 54, 0.12);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}

.hero-copy {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 36px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.45), transparent 30%),
    linear-gradient(135deg, #1f6f43 0%, #2c8d57 42%, #d9f0c7 100%);
  color: #f7fff7;
}

.hero-copy::after {
  content: '';
  position: absolute;
  right: -50px;
  bottom: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 14px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-title {
  margin: 0 0 14px;
  font-size: clamp(2rem, 3vw, 3.35rem);
  line-height: 1.06;
}

.page-subtitle {
  max-width: 620px;
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(247, 255, 247, 0.9);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 28px;
}

.metric-pill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.14);
  backdrop-filter: blur(10px);
}

.metric-value {
  font-size: 1.15rem;
  font-weight: 800;
}

.metric-label {
  font-size: 0.78rem;
  color: rgba(247, 255, 247, 0.78);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.featured-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.featured-card:hover,
.news-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
}

.featured-image,
.news-image {
  position: relative;
  background-size: cover;
  background-position: center;
}

.featured-image {
  min-height: 260px;
}

.featured-image::after,
.news-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 20, 15, 0.08), rgba(10, 20, 15, 0.48));
}

.featured-badge,
.news-category {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1;
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(247, 255, 247, 0.92);
  color: #166534;
  font-size: 12px;
  font-weight: 800;
}

.featured-body,
.news-content {
  padding: 22px;
}

.featured-meta,
.news-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #5b6b63;
}

.featured-title,
.news-title {
  margin: 0 0 12px;
  line-height: 1.25;
  color: #10241a;
}

.featured-title {
  font-size: 1.45rem;
}

.featured-excerpt,
.news-excerpt {
  margin: 0;
  line-height: 1.7;
  color: #4b5d53;
}

.featured-action {
  margin-top: 18px;
  width: fit-content;
  padding: 10px 16px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #166534, #22c55e);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0 0 6px;
  font-size: 1.5rem;
  color: #10241a;
}

.section-header p {
  margin: 0;
  color: #5b6b63;
}

.section-count {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.12);
  color: #166534;
  font-size: 0.85rem;
  font-weight: 700;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.news-card {
  overflow: hidden;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.news-image {
  min-height: 210px;
}

.read-more {
  display: inline-flex;
  margin-top: 18px;
  color: #166534;
  font-size: 0.92rem;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .news-page {
    padding: 18px;
  }

  .hero-copy,
  .featured-body,
  .news-content {
    padding: 20px;
  }

  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .section-header,
  .featured-meta,
  .news-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
