# 🎨 Sidebar Component - Visual Reference Guide

## Visual Hierarchy

```
┌─────────────────────────────────────┐
│  DESKTOP LAYOUT (> 1024px)          │
├─────────────────────────────────────┤
│                                     │
│  ┌────────┐  ┌──────────────────┐  │
│  │ SIDEBAR│  │   MAIN CONTENT   │  │
│  │ 260px  │  │  (calc 100% -260px) │
│  │        │  │                  │  │
│  │ Fixed  │  │  Flexible Width  │  │
│  │        │  │                  │  │
│  └────────┘  └──────────────────┘  │
│                                     │
└─────────────────────────────────────┘
        ↓ (Collapse to 80px)
┌─────────────────────────────────────┐
│  DESKTOP COLLAPSED (> 1024px)       │
├─────────────────────────────────────┤
│                                     │
│  ┌──┐  ┌─────────────────────────┐ │
│  │  │  │   MAIN CONTENT          │ │
│  │  │  │  (calc 100% - 80px)     │ │
│  │  │  │                         │ │
│  └──┘  └─────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## Mobile Layout

```
┌─────────────────────────────────────┐
│  MOBILE LAYOUT (≤ 1024px)           │
├─────────────────────────────────────┤
│ ☰                                   │  (Hamburger Button)
├─────────────────────────────────────┤
│                                     │
│       MAIN CONTENT AREA             │
│                                     │
│       (Full Width)                  │
│                                     │
└─────────────────────────────────────┘

        ↓ (Hamburger Clicked)

┌─────────────────────────────────────┐
│ ☰                                   │
├─────────────────────────────────────┤
│▓▓▓ OVERLAY ▓▓▓                      │
│▓┌─────────────────┐▓MAIN CONTENT    │
│▓│ SIDEBAR DRAWER │▓                 │
│▓│ 75-90vw width  │▓                 │
│▓│                │▓                 │
│▓│ • Dashboard    │▓                 │
│▓│ • Inventory    │▓                 │
│▓│ • Received     │▓                 │
│▓│ • Loans        │▓                 │
│▓│ • News         │▓                 │
│▓└─────────────────┘▓                │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                │
└─────────────────────────────────────┘
```

---

## Button States & Styling

### Active Button
```
┌──────────────────────────────┐
│ ▓▓▓ ACTIVE STATE ▓▓▓          │
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │ 📊 Dashboard           │◄─ Golden Yellow Text
│  │                        │   (#fbbf24)
│  │ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  │◄─ Left Border Accent
│  └────────────────────────┘   (4px golden)
│      ▲                        
│      └─ Green gradient bg
│      └─ Glow shadow effect
│                              │
└──────────────────────────────┘
```

### Hover Button
```
┌──────────────────────────────┐
│ ▓▓▓ HOVER STATE ▓▓▓           │
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │ 🌱 Received Seeds      │◄─ White Text
│  │      ↗                 │   (Slight slide right)
│  └────────────────────────┘   
│      ▲                        
│      └─ Semi-transparent
│         green background
│      └─ Elevated shadow
│                              │
└──────────────────────────────┘
```

### Default Button
```
┌──────────────────────────────┐
│ ▓▓▓ DEFAULT STATE ▓▓▓        │
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │ 💰 Loans               │◄─ Light gray text
│  │                        │   (rgba opacity)
│  └────────────────────────┘   
│      ▲                        
│      └─ Transparent bg
│      └─ No shadow
│                              │
└──────────────────────────────┘
```

---

## Responsive Breakpoints Visual

```
0px          480px         768px       1024px        1920px+
├────────────┼─────────────┼────────────┼─────────────┤
│ SMALL      │   MOBILE    │  TABLET    │   DESKTOP   │
│ MOBILE     │   (81-90vw) │ (Drawer)   │  (260px)    │
│            │             │            │ Collapsible │
│            │             │            │ (80px)      │
│            │             │            │             │
│ Full View  │ Full View   │ Hamburger  │ Full View + │
│ Hamburger  │ Hamburger   │ Button     │ Collapse Btn│
│ Button     │ Button      │ (Auto      │             │
│ 44px min   │ 48px height │ closes)    │ Desktop     │
│ height     │ Touch       │            │ Animations  │
│            │ Optimized   │            │             │
└────────────┴─────────────┴────────────┴─────────────┘
```

---

## Color Palette

### Primary Green
```
#166534 - Sidebar Background
████████████████████████████████████████
```

### Secondary Green
```
#15803d - Gradient Mid
████████████████████████████████████████
```

### Tertiary Green
```
#16a34a - Gradient End
████████████████████████████████████████
```

### Accent Yellow
```
#fbbf24 - Active State & Border
████████████████████████████████████████
```

### Hover Green
```
#22c55e - Hover Effects
████████████████████████████████████████
```

### White Text
```
#ffffff - On Dark Background
████████████████████████████████████████
```

---

## Animation Timing

### Smooth Transitions
```
Default Transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1)

Timeline visualization:
0%      25%     50%     75%     100%
|───────|───────|───────|───────|
Start   Fast   Peak    Slow    Complete
```

### Logo Animation (Bounce)
```
3s ease-in-out infinite

Timeline:
0%: rotate(0deg) scale(1)
50%: rotate(2deg) scale(1)
100%: rotate(0deg) scale(1)

Visual:
Start ←→ Sway Right ←→ Back to Start ←→ ...
```

### Leaf Sway Animation
```
2s ease-in-out infinite

Timeline:
0%: rotate(-3deg) scale(1)
50%: rotate(3deg) scale(1.1)
100%: rotate(-3deg) scale(1)

Visual:
Sway left → Sway right → Sway left → ...
```

### Badge Pulse Animation
```
2s infinite

Timeline:
0%, 100%: opacity(1)
50%: opacity(0.7)

Visual:
Bright ← Dim → Bright → Dim → Bright → ...
```

---

## Touch Targets

### Desktop
```
Button Size: 48px min height × 44px min width
Spacing: 6px between buttons

┌──────────────────────────────┐
│ ┌────────────────────────┐   │
│ │ Icon (24px)            │ 48px
│ │ ┌──────────────────┐   │ height
│ │ │ 📊 Dashboard     │   │
│ │ └──────────────────┘   │
│ └────────────────────────┘   
│          (260px width)       
└──────────────────────────────┘
```

### Mobile
```
Button Size: 48px min height (touch-friendly)
Spacing: 6px between buttons
Icons: 28x28px or larger

┌─────────────────┐
│ ┌─────────────┐ │
│ │ Icon (28px) │ │
│ │   📊       │ │ 48px
│ │ Dashboard  │ │ height
│ │            │ │
│ └─────────────┘ │
│                 │
│   (80-90vw)     │
└─────────────────┘
```

---

## Section Organization

### Visual Hierarchy
```
┌─ CALFFA HEADER ─────────────────────────┐
│ 🌾 CALFFA                               │
│    Smart Farming Solutions              │
└─────────────────────────────────────────┘
                   ↓
┌─ NAVIGATION SECTIONS ───────────────────┐
│                                         │
│ 🌾 FARM MANAGEMENT                      │
│ ├─ 📊 Dashboard                         │
│ ├─ 📦 Inventory                         │
│                                         │
│ ⚙️  OPERATIONS                          │
│ ├─ 🌱 Received Seeds                    │
│                                         │
│ 👥 COMMUNITY                            │
│ ├─ 💰 Loans                             │
│                                         │
│ 📊 INSIGHTS                             │
│ ├─ 📰 News                              │
│ ├─ 📢 Announcements                     │
│ ├─ 🌟 Best Practices                    │
│ ├─ 🔗 Market Link                       │
│                                         │
│ 👨‍💼 ADMIN (if admin user)                │
│ ├─ 👨‍💼 Admin Dashboard                  │
│ ├─ 📱 Mobile Dashboard                  │
│ ├─ ... (more admin items)               │
│                                         │
└─────────────────────────────────────────┘
                   ↓
┌─ ADMIN MODE BADGE ──────────────────────┐
│ 👨‍💼                                       │
│ ADMIN MODE                              │
└─────────────────────────────────────────┘
```

---

## Z-Index Layering

```
Z-Index Stack (from bottom to top):

1. Main Content
   z-index: 3
   ├─ Page content
   └─ All regular elements

2. Sidebar (Desktop)
   z-index: 999
   ├─ Fixed position
   └─ Above main content

3. Overlay Backdrop (Mobile)
   z-index: 1090
   ├─ Semi-transparent
   └─ Clickable to close menu

4. Sidebar (Mobile)
   z-index: 1100
   ├─ Drawer opens above overlay
   └─ Drawer closes on navigation

5. Hamburger Button
   z-index: 1101
   ├─ Always on top
   └─ Always clickable
```

---

## Responsive Typography

### Desktop (> 1024px)
```
Logo: 20px font size
Section Title: 11px font size
Button Text: 14px font size
Badge: 11px font size
```

### Tablet (769-1024px)
```
Logo: 18px font size
Section Title: 10px font size
Button Text: 13px font size
Badge: 10px font size
```

### Mobile (≤ 768px)
```
Logo: 14-16px font size
Section Title: 9-10px font size
Button Text: 12-13px font size
Badge: 9-10px font size
```

---

## Spacing Grid

### Sidebar Padding
```
Horizontal: 16px (desktop), 12px (mobile)
Vertical: 20px (desktop), 12px (mobile)
```

### Button Spacing
```
Padding: 12px vertical, 14px horizontal
Gap between buttons: 6px
Margin bottom: 0 (gap handles spacing)
```

### Section Spacing
```
Between sections: 24px
Last section: 16px from bottom
```

---

## Accessibility Visual Indicators

### Focus State
```
┌────────────────────────┐
│ ┌──────────────────┐   │
│ │ Focus outline    │   │ ← 2px solid outline
│ │ (dashed or line) │   │ ← 2px offset
│ └──────────────────┘   │
│ Button with clear      │
│ visual feedback        │
└────────────────────────┘
```

### High Contrast Active State
```
┌────────────────────────┐
│ ┌──────────────────┐   │
│ │ Golden (#fbbf24) │   │ ← High contrast
│ │ Dark Green bg    │   │ ← Clear visibility
│ │ Left gold border │   │ ← Additional indicator
│ └──────────────────┘   │
│                        │
└────────────────────────┘
```

### Icon Size Accessibility
```
Icons scale with screen:
Desktop:  20-32px (clear visibility)
Tablet:   18-24px (easily tappable)
Mobile:   24-28px (touch-friendly)
```

---

## Shadow Effects

### Card Shadow (Subtle)
```
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

Appearance:
╔════════╗
║ Card   ║  ← Light shadow below
║content ║  ← 2px offset
╚════════╝
  ▓▓▓▓▓▓  ← Shadow
```

### Active Button Shadow (Elevated)
```
box-shadow: 0 4px 12px rgba(22, 101, 52, 0.2);

Appearance:
╔════════╗
║ Active ║  ← Green-tinted shadow
║ Button ║  ← 4px offset
╚════════╝
  ▓▓▓▓▓▓
  ▓▓▓▓▓▓  ← Larger shadow for elevation
```

### Glow Effect (Active)
```
box-shadow: 0 0 12px rgba(251, 191, 36, 0.3);

Appearance:
    ✨ ← Glow around button
╔════════╗
║ Golden ║  ← 360° glow effect
║ Active ║  ← Subtle and elegant
╚════════╝
    ✨
```

---

## Viewport Reference

### Common Device Sizes
```
iPhone SE:        375 × 667    (≤ 480px)
iPhone 12:        390 × 844    (≤ 480px)
iPhone 12 Pro:    390 × 844    (≤ 480px)
iPad Mini:        768 × 1024   (769-1024px)
iPad Air:         820 × 1180   (> 1024px)
iPad Pro 11":     834 × 1194   (> 1024px)
iPad Pro 12.9":   1024 × 1366  (> 1024px)
Desktop (13"):    1280 × 720   (> 1024px)
Desktop (15"):    1920 × 1080  (> 1024px)
Desktop (27"):    2560 × 1440  (> 1024px)
```

---

## Summary

This visual reference guide provides:
✅ Layout diagrams
✅ Button states visualization
✅ Color palette reference
✅ Animation timing charts
✅ Touch target sizes
✅ Responsive breakpoints
✅ Z-index layering
✅ Typography scales
✅ Spacing grid
✅ Accessibility indicators
✅ Shadow effects
✅ Device size reference

**Use this guide for:**
- Design validation
- Development reference
- Responsive testing
- Accessibility verification
- Visual consistency check

---

**Last Updated:** January 24, 2024
