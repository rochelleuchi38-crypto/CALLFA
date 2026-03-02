/**
 * Backdrop Theme Composable
 * 
 * Manages the system-wide backdrop theme for the smart farming dashboard.
 * Supports light mode, dark mode, and standard mode switching.
 */

import { ref, computed } from 'vue'

const themeMode = ref('standard') // 'standard' | 'light' | 'dark'

/**
 * Get the current theme mode
 */
export function useBackdropTheme() {
  /**
   * Set the theme mode
   * @param {string} mode - 'standard' | 'light' | 'dark'
   */
  const setTheme = (mode) => {
    if (['standard', 'light', 'dark'].includes(mode)) {
      themeMode.value = mode
      applyTheme(mode)
      // Save to localStorage
      localStorage.setItem('backdrop-theme', mode)
    }
  }

  /**
   * Toggle between light and dark modes
   */
  const toggleTheme = () => {
    if (themeMode.value === 'light') {
      setTheme('dark')
    } else if (themeMode.value === 'dark') {
      setTheme('standard')
    } else {
      setTheme('light')
    }
  }

  /**
   * Apply theme to the document body
   */
  const applyTheme = (mode) => {
    // Remove all theme classes
    document.body.classList.remove(
      'backdrop-theme',
      'backdrop-theme-light',
      'backdrop-theme-dark'
    )

    // Add the appropriate theme class
    if (mode === 'light') {
      document.body.classList.add('backdrop-theme-light')
    } else if (mode === 'dark') {
      document.body.classList.add('backdrop-theme-dark')
    } else {
      document.body.classList.add('backdrop-theme')
    }

    // Update data attribute for CSS custom properties
    document.documentElement.setAttribute('data-theme', mode)
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  const initTheme = () => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('backdrop-theme')
    if (savedTheme && ['standard', 'light', 'dark'].includes(savedTheme)) {
      setTheme(savedTheme)
      return
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light')
    } else {
      setTheme('standard')
    }
  }

  /**
   * Watch for system theme changes
   */
  const watchSystemTheme = () => {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const lightModeQuery = window.matchMedia('(prefers-color-scheme: light)')

      const handleDarkChange = (e) => {
        if (e.matches && !localStorage.getItem('backdrop-theme')) {
          setTheme('dark')
        }
      }

      const handleLightChange = (e) => {
        if (e.matches && !localStorage.getItem('backdrop-theme')) {
          setTheme('light')
        }
      }

      // Use addEventListener if available, otherwise use addListener for older browsers
      if (darkModeQuery.addEventListener) {
        darkModeQuery.addEventListener('change', handleDarkChange)
        lightModeQuery.addEventListener('change', handleLightChange)
      } else if (darkModeQuery.addListener) {
        darkModeQuery.addListener(handleDarkChange)
        lightModeQuery.addListener(handleLightChange)
      }
    }
  }

  return {
    themeMode: computed(() => themeMode.value),
    setTheme,
    toggleTheme,
    applyTheme,
    initTheme,
    watchSystemTheme
  }
}

/**
 * Apply backdrop to a specific element
 * @param {HTMLElement} element - The element to apply backdrop to
 * @param {string} variant - 'dashboard' | 'login' | 'sidebar' | 'header' | 'banner'
 * @param {string} mode - 'standard' | 'light' | 'dark'
 */
export function applyBackdropToElement(element, variant = 'dashboard', mode = null) {
  if (!element) return

  const currentMode = mode || themeMode.value
  const variantClass = `backdrop-${variant}`
  const themeClass = currentMode === 'light' 
    ? 'backdrop-theme-light' 
    : currentMode === 'dark' 
    ? 'backdrop-theme-dark' 
    : 'backdrop-theme'

  // Remove existing backdrop classes
  element.classList.remove(
    'backdrop-theme',
    'backdrop-theme-light',
    'backdrop-theme-dark',
    'backdrop-dashboard',
    'backdrop-login',
    'backdrop-sidebar',
    'backdrop-header',
    'backdrop-banner'
  )

  // Add new classes
  element.classList.add(themeClass, variantClass)
}

/**
 * Create a backdrop element and append it to a container
 * @param {HTMLElement} container - Container element
 * @param {string} variant - 'dashboard' | 'login' | 'sidebar' | 'header' | 'banner'
 * @param {string} mode - 'standard' | 'light' | 'dark'
 * @returns {HTMLElement} The created backdrop element
 */
export function createBackdropElement(container, variant = 'dashboard', mode = null) {
  if (!container) return null

  const backdrop = document.createElement('div')
  const currentMode = mode || themeMode.value
  const variantClass = `backdrop-${variant}`
  const themeClass = currentMode === 'light' 
    ? 'backdrop-theme-light' 
    : currentMode === 'dark' 
    ? 'backdrop-theme-dark' 
    : 'backdrop-theme'

  backdrop.classList.add(themeClass, variantClass)
  container.appendChild(backdrop)

  return backdrop
}

