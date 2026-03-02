<!-- CALFFA Sidebar Component - Quick Reference Guide -->

# 🎯 Sidebar Component - Quick Start Guide

## What is the Sidebar Component?

The Sidebar is a **mobile-first, responsive navigation component** for the CALFFA agricultural application. It provides:
- ✅ Touch-friendly interface optimized for mobile devices
- ✅ Single active state management (only one button active at a time)
- ✅ Event emission for seamless integration with parent components
- ✅ Smooth animations and transitions
- ✅ Accessibility features (ARIA labels, semantic HTML)

---

## Installation & Setup

### 1. **Import the Component**
```vue
import Sidebar from '@/components/Sidebar.vue'
```

### 2. **Use in Your Template**
```vue
<template>
  <div class="app-layout">
    <!-- Add Sidebar with event listeners -->
    <Sidebar
      @menu-click="handleMenuClick"
      @active-menu="handleActiveMenuChange"
      @collapse-toggle="handleCollapseToggle"
      @mobile-menu-toggle="handleMobileMenuToggle"
    />
    
    <!-- Main content area -->
    <main class="main-content-wrapper">
      <!-- Your content here -->
    </main>
  </div>
</template>

<script setup>
// Define event handlers
const handleMenuClick = (event) => {
  console.log('Menu clicked:', event);
};

const handleActiveMenuChange = (event) => {
  console.log('Active menu changed:', event.activeRoute);
};

const handleCollapseToggle = (event) => {
  console.log('Sidebar collapsed:', event.isCollapsed);
};

const handleMobileMenuToggle = (event) => {
  console.log('Mobile menu open:', event.isOpen);
};
</script>
```

---

## Events Reference

### 📌 Event: `menu-click`
**Fires when:** A navigation button is clicked

**Payload:**
```javascript
{
  route: "/dashboard",           // Clicked route
  item: {                         // Item object
    text: "Dashboard",
    route: "/dashboard",
    icon: "📊",
    badge: null
  }
}
```

**Usage:**
```vue
@menu-click="(event) => {
  console.log('User clicked:', event.item.text);
}"
```

---

### 📌 Event: `active-menu`
**Fires when:** The active menu changes

**Payload:**
```javascript
{
  activeRoute: "/dashboard",      // New active route
  item: { /* ... */ }             // Item object
}
```

**Usage:**
```vue
@active-menu="(event) => {
  currentPage.value = event.activeRoute;
}"
```

---

### 📌 Event: `collapse-toggle`
**Fires when:** Desktop sidebar collapse/expand button is clicked

**Payload:**
```javascript
{
  isCollapsed: true  // true if collapsed, false if expanded
}
```

**Usage:**
```vue
@collapse-toggle="(event) => {
  sidebarWidth.value = event.isCollapsed ? '80px' : '260px';
}"
```

---

### 📌 Event: `mobile-menu-toggle`
**Fires when:** Mobile hamburger menu is opened/closed

**Payload:**
```javascript
{
  isOpen: true  // true if menu is open, false if closed
}
```

**Usage:**
```vue
@mobile-menu-toggle="(event) => {
  showOverlay.value = event.isOpen;
}"
```

---

## Navigation Sections

The sidebar contains **5 main sections**:

### 🌾 FARM MANAGEMENT
- 📊 Dashboard
- 📦 Inventory

### ⚙️ OPERATIONS
- 🌱 Received Seeds

### 👥 COMMUNITY
- 💰 Loans

### 📊 INSIGHTS
- 📰 News
- 📢 Announcements
- 🌟 Best Practices
- 🔗 Market Link

### 👨‍💼 ADMIN (Admin Users Only)
- 👨‍💼 Admin Dashboard
- 📱 Mobile Dashboard
- 👥 Members
- 🌾 Farmers Management
- 🌱 Seed Distribution
- 📋 System Activity
- 💰 Financial Overview
- 🔔 Notifications
- 📜 Audit Logs

---

## Visual States

### 🟢 Active Button
```css
/* Visual Appearance */
- Background: Green gradient with opacity
- Text Color: Golden yellow (#fbbf24)
- Left Border: 4px golden accent
- Shadow: Glowing effect
- Icon: Highlighted with background
```

### 🟡 Hover Button
```css
/* Visual Appearance */
- Background: Semi-transparent green
- Transform: Slight slide and scale effect
- Shadow: Elevated effect
- Smooth transition: 0.25s
```

### 📱 Responsive States

| Breakpoint | Behavior |
|---|---|
| **Desktop** (> 1024px) | Full sidebar visible, collapsible to 80px |
| **Tablet** (769-1024px) | Drawer-style sidebar, toggleable |
| **Mobile** (481-768px) | 80vw width, optimized spacing |
| **Small Mobile** (≤ 480px) | 90vw width, compact buttons |

---

## Code Examples

### Example 1: Track Active Page
```vue
<script setup>
const activePage = ref('/dashboard');

const handleActiveMenuChange = (event) => {
  activePage.value = event.activeRoute;
};
</script>

<template>
  <div>
    <Sidebar @active-menu="handleActiveMenuChange" />
    <main>
      <h1>Current Page: {{ activePage }}</h1>
    </main>
  </div>
</template>
```

### Example 2: Display Different Content
```vue
<script setup>
const activeMenu = ref('/dashboard');

const contentMap = {
  '/dashboard': 'Dashboard Content',
  '/inventory': 'Inventory Content',
  '/loan': 'Loan Content',
  // ... more mappings
};

const handleActiveMenuChange = (event) => {
  activeMenu.value = event.activeRoute;
};

const currentContent = computed(() => contentMap[activeMenu.value]);
</script>

<template>
  <Sidebar @active-menu="handleActiveMenuChange" />
  <main>
    <component :is="currentContent" />
  </main>
</template>
```

### Example 3: Update Page Title
```vue
<script setup>
const pageTitle = ref('Dashboard');

const titleMap = {
  '/dashboard': '📊 Dashboard Overview',
  '/inventory': '📦 Inventory Management',
  '/loan': '💰 Loan Management',
  // ... more mappings
};

const handleActiveMenuChange = (event) => {
  pageTitle.value = titleMap[event.activeRoute] || 'CALFFA';
};
</script>

<template>
  <header>
    <h1>{{ pageTitle }}</h1>
  </header>
  <Sidebar @active-menu="handleActiveMenuChange" />
</template>
```

### Example 4: Handle Mobile Menu
```vue
<script setup>
const isMobileMenuOpen = ref(false);
const showBackdrop = ref(false);

const handleMobileMenuToggle = (event) => {
  isMobileMenuOpen.value = event.isOpen;
  showBackdrop.value = event.isOpen;
};
</script>

<template>
  <div v-if="showBackdrop" class="overlay"></div>
  <Sidebar @mobile-menu-toggle="handleMobileMenuToggle" />
</template>
```

---

## Best Practices

### ✅ DO
- ✅ Use event handlers to update parent component state
- ✅ Let router-link handle navigation
- ✅ Keep event handlers lightweight and efficient
- ✅ Use computed properties for derived state
- ✅ Test with both desktop and mobile viewports
- ✅ Use the provided CSS classes for custom styling

### ❌ DON'T
- ❌ Don't manually manipulate the DOM
- ❌ Don't ignore the event emissions
- ❌ Don't override component events
- ❌ Don't add unnecessary styling conflicts
- ❌ Don't use inline event handlers with complex logic

---

## Styling & Customization

### Using CSS Variables
```css
:root {
  --sidebar-bg: linear-gradient(180deg, #166534 0%, #15803d 100%);
  --sidebar-width: 260px;
  --sidebar-width-collapsed: 80px;
  --accent-color: #fbbf24;
  --primary-color: #166534;
}
```

### Adding Custom Classes
```vue
<Sidebar class="my-custom-sidebar" />
```

### Overriding Styles
```css
.my-custom-sidebar {
  --sidebar-width: 300px;  /* Custom width */
}

.my-custom-sidebar .nav-link {
  font-size: 14px;  /* Custom font size */
}
```

---

## Troubleshooting

### ❓ Menu not responding?
- Ensure Vue Router is configured correctly
- Check that routes exist in the router configuration
- Verify the route paths match in navigation items

### ❓ Active state not showing?
- Confirm the current route matches the navigation item route
- Check browser console for any errors
- Verify `isActiveRoute()` function is working

### ❓ Mobile menu not closing?
- Ensure the route is changing (menu auto-closes on route change)
- Check that `isMobileMenuOpen` is properly initialized
- Verify the overlay backdrop is set up

### ❓ Sidebar not collapsing on desktop?
- Ensure `.main-content-wrapper` element exists in the DOM
- Verify CSS media queries are loading
- Check that the collapse button is visible (desktop only)

---

## Performance Tips

⚡ **Optimization Strategies:**
- Use computed properties for state derived from props
- Avoid heavy computations in event handlers
- Use lazy-loading for route components
- Leverage CSS animations instead of JavaScript animations
- Use `v-show` for frequently toggled elements
- Implement virtual scrolling for large lists

---

## Accessibility Features

♿ **Built-in Accessibility:**
- ARIA labels on all interactive elements
- Semantic HTML structure
- Keyboard navigation support
- Focus indicators on buttons
- High contrast active states
- Screen reader friendly

---

## File References

| File | Purpose |
|---|---|
| `Sidebar.vue` | Main component |
| `SidebarExample.vue` | Usage example with event handlers |
| `SIDEBAR_DOCUMENTATION.md` | Detailed documentation |
| `SIDEBAR_QUICKREF.md` | This quick reference guide |

---

## Support & Questions

For issues or questions:
1. Check the detailed documentation in `SIDEBAR_DOCUMENTATION.md`
2. Review the example component in `SidebarExample.vue`
3. Check browser console for error messages
4. Verify all routes are configured in the router

---

## Version Information

| Version | Release Date | Key Features |
|---|---|---|
| 1.0.0 | Jan 24, 2024 | Initial release with mobile-first design, event emission, and responsive layout |

---

**Last Updated:** January 24, 2024  
**Maintained by:** CALFFA Development Team  
**License:** MIT
