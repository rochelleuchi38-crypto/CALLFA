<template>
  <div id="app">
    <!-- Header only shown when not authenticated (on login/register pages) -->
    <header v-if="!isAuthenticated" class="app-header sticky top-0 z-50 shadow-md">
      <div class="header-content">
        <div class="logo-container">
          <div class="department-logo wheat-icon"></div>
          <div>
            <p class="header-subtitle">Farmer Registration Portal</p>
          </div>
        </div>
        <nav class="nav-links">
        </nav>
      </div>
    </header>

    <div class="app-container">
      <router-view />
    </div>

    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="footer-logo"></div>
          <div class="footer-brand-text">
            <div class="footer-brand-name"></div>
            <div class="footer-brand-tagline"></div>
          </div>
        </div>
        <div class="footer-info">
          <div class="footer-contact">
            <div class="contact-item">
              <span class="contact-icon"></span>
              <span>contact@calffa.gov.ph</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon"></span>
              <span>+63 (02) 1234-5678</span>
            </div>
          </div>
          <div class="footer-version">
            <span>Version 1.0.0</span>
            <span class="footer-divider">|</span>
            <span>© 2025 CALFFA. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'
import { useBackdropTheme } from './composables/useBackdropTheme'

const authStore = useAuthStore()
const { initTheme, watchSystemTheme } = useBackdropTheme()

const isAuthenticated = computed(() => !!authStore.currentUser)

onMounted(() => {
  initTheme()
  watchSystemTheme()
})
</script>

<style>
.app-container {
  width: 100%;
  min-height: calc(100vh - 128px); /* header + footer heights */
  position: relative;
}
</style>
