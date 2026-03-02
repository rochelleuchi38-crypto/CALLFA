# Sidebar Component Documentation

## Overview
The Sidebar component is a mobile-first, responsive navigation component designed for the CALFFA agricultural application. It provides a touch-friendly interface with smooth transitions and clear section labels.

## Features

✅ **Mobile-First Design**
- Optimized for mobile devices (≤480px)
- Responsive breakpoints for tablet (481-768px) and desktop (769px+)
- Touch-friendly button sizes (minimum 48px for mobile)

✅ **Single Active State**
- Only one navigation button can be active at a time
- Active button has distinct visual style (highlighted background with golden accent)
- Smooth transitions between states

✅ **Event Emission**
- `menu-click`: Emitted when any menu item is clicked
- `active-menu`: Emitted when active menu changes
- `collapse-toggle`: Emitted when sidebar collapse/expand button is clicked
- `mobile-menu-toggle`: Emitted when mobile hamburger menu is toggled

✅ **Organized Navigation**
- Grouped sections with clear labels:
  - FARM MANAGEMENT
  - OPERATIONS
  - COMMUNITY
  - INSIGHTS
  - ADMIN (visible only for admin users)

✅ **Visual Feedback**
- Hover effects with shadow and transform
- Active state with golden highlight and glowing effect
- Smooth animations and transitions
- Leaf accent (🌿) for active items

✅ **Accessibility**
- ARIA labels for screen readers
- Semantic HTML structure
- Keyboard navigation support
- Touch-optimized interactions

## Component Props

The component uses route-based navigation and doesn't require manual props configuration. It automatically determines the active state based on the current route.

## Component Events

### 1. `menu-click`
Emitted when a navigation button is clicked.

```javascript
@menu-click="(event) => console.log('Menu clicked:', event)"
// event = { route: '/dashboard', item: { text: 'Dashboard', route: '/dashboard', icon: '📊' } }
```

### 2. `active-menu`
Emitted when the active menu changes.

```javascript
@active-menu="(event) => console.log('Active menu:', event)"
// event = { activeRoute: '/dashboard', item: { text: 'Dashboard', ... } }
```

### 3. `collapse-toggle`
Emitted when sidebar is toggled between expanded/collapsed states.

```javascript
@collapse-toggle="(event) => console.log('Sidebar collapsed:', event.isCollapsed)"
// event = { isCollapsed: true/false }
```

### 4. `mobile-menu-toggle`
Emitted when mobile hamburger menu is toggled.

```javascript
@mobile-menu-toggle="(event) => console.log('Mobile menu open:', event.isOpen)"
// event = { isOpen: true/false }
```

## Usage Example

### Basic Usage in AuthenticatedLayout

```vue
<template>
  <div class="layout">
    <!-- Sidebar with event handlers -->
    <Sidebar
      @menu-click="handleMenuClick"
      @active-menu="handleActiveMenuChange"
      @collapse-toggle="handleCollapseToggle"
      @mobile-menu-toggle="handleMobileMenuToggle"
    />
    
    <!-- Main content area -->
    <main class="main-content-wrapper">
      <router-view />
    </main>
  </div>
</template>

<script setup>
const handleMenuClick = (event) => {
  console.log('Menu item clicked:', event.route);
  // Display corresponding content for the selected menu
};

const handleActiveMenuChange = (event) => {
  console.log('Active menu changed to:', event.activeRoute);
  // Update active section indicator
};

const handleCollapseToggle = (event) => {
  console.log('Sidebar collapsed:', event.isCollapsed);
  // Adjust layout margins dynamically
};

const handleMobileMenuToggle = (event) => {
  console.log('Mobile menu is now:', event.isOpen ? 'open' : 'closed');
  // Handle overlay visibility or other mobile UI adjustments
};
</script>
```

## Navigation Items Structure

### Farm Management
- Dashboard (📊)
- Inventory (📦)

### Operations
- Received Seeds (🌱)

### Community
- Loans (💰) - with badge support

### Insights
- News (📰)
- Announcements (📢)
- Best Practices (🌟)
- Market Link (🔗)

### Admin (Admin only)
- Admin Dashboard (👨‍💼)
- Mobile Dashboard (📱)
- Members (👥)
- Farmers Management (🌾)
- Seed Distribution (🌱)
- System Activity (📋)
- Financial Overview (💰)
- Notifications (🔔)
- Audit Logs (📜)

## Styling & Visual States

### Active Button Style
- Background: Gradient with green tones
- Text: Golden yellow (#fbbf24)
- Icon: Highlighted with background
- Accent: Glowing shadow effect
- Left border: Golden accent bar

### Hover State
- Background: Semi-transparent green
- Transform: Slight scale and translateX effect
- Shadow: Elevated effect
- Smooth transition: 0.25s ease

### Collapsed State (Desktop)
- Sidebar width: 80px (from 260px)
- Only icons visible
- Text labels hidden
- Collapsed indicator: Rotated chevron icon

### Mobile Open State
- Sidebar slides in from left
- Full width drawer overlay
- Backdrop overlay with semi-transparent black
- Auto-closes on navigation

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| **Desktop** | > 1024px | Full sidebar visible, collapsible |
| **Tablet** | 769-1024px | Drawer-style, toggleable |
| **Mobile** | 481-768px | 80vw width, optimized spacing |
| **Small Mobile** | ≤ 480px | 90vw width, compact buttons |

## Touch Optimization

- Minimum button height: 48px on mobile
- Minimum button width: 44px
- Adequate spacing between buttons: 6px gap
- Touch-friendly icon size: 28x28px
- Large tap targets for accessibility

## CSS Classes Reference

```css
.sidebar-wrapper        /* Wrapper container */
.mobile-menu-btn        /* Hamburger menu button */
.hamburger              /* Hamburger icon animation */
.sidebar-overlay        /* Mobile overlay backdrop */
.sidebar                /* Main sidebar container */
.sidebar.collapsed      /* Collapsed state */
.sidebar.mobile-open    /* Mobile drawer open state */
.sidebar-header         /* Header with logo */
.nav-sections           /* Navigation sections container */
.nav-section            /* Individual section */
.section-header         /* Section title/label */
.nav-list               /* Navigation items list */
.nav-link               /* Navigation button */
.nav-link.active        /* Active button state */
.nav-link:hover         /* Hover state */
.nav-link:active        /* Pressed state */
.icon                   /* Icon element */
.text                   /* Button text */
.nav-badge              /* Notification badge */
.leaf-accent            /* Decorative leaf accent */
```

## Animation Classes

```css
.fade-enter-active      /* Fade in transition */
.fade-leave-active      /* Fade out transition */
.slideIn               /* Slide in animation */
.bounce               /* Bounce animation on logo */
.leafSway             /* Leaf sway animation */
.pulse                /* Badge pulse animation */
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Fully optimized
- IE 11: ⚠️ Limited support (no CSS animations)

## Performance Notes

- Uses CSS transitions for smooth animations
- Hardware-accelerated transforms
- Minimal DOM manipulation
- Efficient event handling
- Lazy-loaded route components

## Accessibility Features

- ARIA labels on all buttons
- Semantic HTML structure
- High contrast active states
- Keyboard navigation support
- Screen reader friendly
- Focus indicators on buttons

## Common Use Cases

### 1. Track Active Menu Item
```vue
const activeMenu = ref(null);
const handleActiveMenuChange = (event) => {
  activeMenu.value = event.activeRoute;
};
```

### 2. Display Different Content Based on Menu
```vue
const currentContent = computed(() => {
  return menuContentMap[activeMenu.value];
});
```

### 3. Auto-Close Mobile Menu After Navigation
```vue
// Already handled by component - menu auto-closes on route change
```

### 4. Update Title Based on Active Menu
```vue
const pageTitle = computed(() => {
  return titleMap[activeMenu.value] || 'CALFFA';
});
```

## Troubleshooting

### Menu not responding to clicks?
- Ensure Vue Router is properly configured
- Check that routes are valid in the router config

### Active state not highlighting correctly?
- Verify the current route matches the navigation item route
- Check that `isActiveRoute()` function is working

### Mobile menu not closing on navigation?
- Confirm that route watching is enabled (it is by default)
- Check browser console for route change events

### Sidebar not collapsing?
- Ensure `.main-content-wrapper` element exists
- Check CSS media queries for proper breakpoints

## Future Enhancements

- [ ] Collapsible sections with expand/collapse animation
- [ ] Search functionality within navigation
- [ ] User preferences persistence (remember collapsed state)
- [ ] Drag-to-reorder navigation items
- [ ] Nested menu support
- [ ] Animation preference support (prefers-reduced-motion)
- [ ] Dark mode toggle
- [ ] Custom color themes

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2024-01-24 | Initial release with mobile-first design and event emission |
