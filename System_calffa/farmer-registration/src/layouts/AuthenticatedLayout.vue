<template>
  <div class="authenticated-layout">
    <div class="backdrop-dashboard backdrop-theme"></div>
    <TopHeader />
    <Sidebar />
    <main class="main-content-wrapper">
      <div class="main-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import TopHeader from '../components/TopHeader.vue'
import Sidebar from '../components/Sidebar.vue'
</script>

<style scoped>
.authenticated-layout {
  display: flex;
  min-height: 100vh;
  background-color: #ffffff; /* white background */
  position: relative;
  width: 100%;
  overflow-x: hidden; /* Prevent horizontal scroll */
  overflow-y: auto;
}

.authenticated-layout .backdrop-dashboard {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}

/* Main content wrapper - accounts for sidebar */
.main-content-wrapper {
  flex: 1;
  margin-left: 260px; /* Sidebar width */
  min-height: 100vh;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
  width: calc(100% - 260px);
  position: relative;
  z-index: 2;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Main content area - accounts for header (header is 70px) */
.main-content {
  flex: 1;
  padding: 1.5rem;
  padding-top: calc(70px + 1.5rem); /* Top header height (70px) + top padding */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  min-height: calc(100vh - 70px); /* Full height minus header */
  background: #ffffff;
  position: relative;
  z-index: 2;
}

/* Responsive: Tablet and below */
@media (max-width: 1024px) {
  .main-content-wrapper {
    margin-left: 0;
    width: 100%;
    z-index: 3;
  }
  
  .main-content {
    padding: 1rem;
    padding-top: calc(70px + 1rem);
    z-index: 3;
  }
}

/* Mobile devices */
@media (max-width: 768px) {
  .main-content-wrapper {
    z-index: 3;
  }
  
  .main-content {
    padding: 0.75rem;
    padding-top: calc(70px + 0.75rem);
    z-index: 3;
    min-height: 100vh;
  }
}

/* Small mobile */
@media (max-width: 480px) {
  .main-content {
    padding: 0.5rem;
    padding-top: calc(70px + 0.5rem);
  }
}

/* Large screens - center content with max-width */
@media (min-width: 1400px) {
  .main-content {
    padding: 2rem;
    padding-top: calc(70px + 2rem);
    max-width: 1400px;
    margin: 0 auto;
  }
}

/* Extra large screens */
@media (min-width: 1920px) {
  .main-content {
    max-width: 1600px;
  }
}
</style>
