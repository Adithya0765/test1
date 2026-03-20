# Qaulium AI Admin Portal — Component & Style Guide

Complete reference for all UI components, patterns, and usage guidelines.

---

## TABLE OF CONTENTS
1. [Design Tokens](#design-tokens)
2. [Components](#components)
3. [Patterns](#patterns)
4. [Responsive Breakpoints](#responsive-breakpoints)
5. [Animations](#animations)
6. [Accessibility](#accessibility)
7. [Dark Mode](#dark-mode)

---

## DESIGN TOKENS

### Colors

#### Primary
- **Primary**: `#0B0B0B` (Main brand, dark)
- **Primary Light**: `#1F1F1F` (Hover state)
- **Primary Lighter**: `#2D2D2D` (Active state)

#### Text
- **Text**: `#0B0B0B` (Main text)
- **Text Secondary**: `#6B7280` (Subtext)
- **Text Tertiary**: `#9CA3AF` (Metadata)
- **Text Inverse**: `#FFFFFF` (On dark backgrounds)

#### Functional
- **Accent**: `#2563EB` (Interactive, highlights)
- **Success**: `#059669` (Positive states)
- **Alert**: `#DC2626` (Destructive actions)
- **Warning**: `#F59E0B` (Caution)

#### Surfaces
- **Background**: `#FFFFFF` (Main surface)
- **Surface**: `#FFFFFF` (Cards, containers)
- **Surface Hover**: `#F9FAFB` (Hover state)
- **BG Secondary**: `#F9FAFB` (Subtle background)
- **BG Tertiary**: `#F3F4F6` (Deeper background)

#### Borders
- **Border**: `#E5E7EB` (Standard border)
- **Border Light**: `#F3F4F6` (Subtle border)
- **Border Subtle**: `#EFEFEF` (Very subtle)

### Spacing Scale
All spacing uses 8px base:

```
--space-1: 4px    (1/2 unit)
--space-2: 8px    (1x radius, gaps)
--space-3: 12px   (Form inputs)
--space-4: 16px   (Standard padding)
--space-6: 24px   (Card padding)
--space-8: 32px   (Section gap)
--space-10: 40px  (Large gaps)
--space-12: 48px  (XL gaps)
```

### Shadows

Standard shadow scale (depth layering):

```
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12)
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15)
--shadow-xl: 0 12px 32px rgba(0, 0, 0, 0.20)
```

### Typography

#### Font Families
- **Display**: `'Inter'` (Headlines, bold, -0.02em letter-spacing)
- **Body**: `'IBM Plex Sans'` (Default, highly legible)
- **Mono**: `'IBM Plex Mono'` (Code, technical)

#### Font Weights
- 400: Regular (body text)
- 500: Medium (emphasis)
- 600: Semibold (small headings, labels)
- 700: Bold (H1, H2, key metrics)

#### Size Scale
```
H1: 28px  (Headlines, page titles)
H2: 24px  (Section headers)
H3: 16px  (Subsection headers)
H4: 14px  (Card headers)
Body: 14px (Default)
Small: 12px (Metadata, labels)
```

#### Line Heights
- **Headlines**: 1.2 (tight, confident)
- **Body**: 1.6 (breathing room)
- **Form labels**: 1.4
- **Code**: 1.5

### Motion Timing

```
--duration-fast: 0.15s    (Micro-interactions: hover, focus)
--duration-normal: 0.3s   (Navigation, state changes)
--duration-slow: 0.6s     (Complex animations, modals)
```

### Easing Functions

```
--ease: cubic-bezier(0.25, 0.46, 0.45, 0.94)
        (Primary easing, feels natural)

--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
               (Bouncy, playful - use sparingly)

--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
               (Smooth, elegant)
```

---

## COMPONENTS

### Buttons

#### Primary Button
```html
<button class="btn btn-primary">
  Action
</button>
```
**States:**
- Default: Dark background, white text
- Hover: Darker background, -1px translateY, shadow
- Active: No translateY (confirms click)
- Disabled: Opacity 0.5, cursor not-allowed

**Usage:** Primary CTAs, important actions

#### Secondary Button
```html
<button class="btn btn-secondary">
  Secondary Action
</button>
```
**States:**
- Default: Border, transparent background
- Hover: Light background, darker border
- Focus: Colored ring

**Usage:** Alternative actions, less important flows

#### Icon Button
```html
<button class="icon-btn">
  <svg>Icon</svg>
</button>
```
**Sizes:**
- Default: 40x40px (navbar, topbar)
- Small: 32x32px (table actions, inline)

#### Button with Icon
```html
<button class="btn btn-primary">
  <svg>Icon</svg>
  <span>Label</span>
</button>
```

### Cards

#### Basic Card
```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">
    Content goes here
  </div>
</div>
```

**Characteristics:**
- White background, 1px border
- 12px border-radius
- Hover: Shadow lift, border color accent
- Padding: 6px spacing inside

#### Stat Card (Dashboard)
```html
<div class="stat-card">
  <div class="stat-icon" style="background: linear-gradient(135deg, #2563EB, #1D4ED8);">
    <svg>Icon</svg>
  </div>
  <div class="stat-content">
    <p class="stat-label">Metric Name</p>
    <div class="stat-value-row">
      <span class="stat-value">1,234</span>
      <span class="stat-trend positive">↑ 12%</span>
    </div>
    <p class="stat-meta">from last month</p>
  </div>
</div>
```

**Trends:**
- `stat-trend positive`: Green (#059669)
- `stat-trend negative`: Red (#DC2626)
- `stat-trend neutral`: Gray (#9CA3AF)

### Form Elements

#### Text Input
```html
<label class="form-group">
  <span class="form-label">Email Address</span>
  <input type="email" placeholder="user@example.com">
  <span class="form-hint">Optional hint text</span>
</label>
```

**States:**
- Default: Gray border, white background
- Focus: Blue border, blue ring (3px, 10% opacity)
- Error: Red border, red ring

#### Select Dropdown
```html
<select class="filter-select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

#### Checkbox
```html
<label class="form-checkbox">
  <input type="checkbox">
  <span>I agree to terms</span>
</label>
```

### Tables

#### Basic Table
```html
<div class="card">
  <div class="table-toolbar">
    <input type="text" class="search-input" placeholder="Search...">
    <select class="filter-select">Option 1</select>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Column 1</th>
          <th>Column 2</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Data 1</td>
          <td>Data 2</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn small">✎</button>
              <button class="icon-btn small">🗑</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Row Behaviors:**
- Hover: Light blue background
- Striped: Alternate #F9FAFB
- Status badges: Color-coded (green, red, gray)

### Navigation Components

#### Sidebar Navigation
```html
<aside class="sidebar">
  <div class="sidebar-header">
    <div class="sidebar-logo"><img src="logo.png"></div>
    <h2>App Name</h2>
  </div>
  
  <nav class="sidebar-nav">
    <div class="nav-section">
      <div class="nav-section-label">Section</div>
      <button class="nav-item active" data-view="home">
        <svg>Icon</svg>
        <span>Label</span>
      </button>
    </div>
  </nav>
</aside>
```

**Active State:** Blue accent background, blue text

#### Top Bar
```html
<div class="topbar">
  <button class="topbar-toggle">☰</button>
  <div class="topbar-title">
    <h1>Page Title</h1>
    <p class="muted">Subtitle</p>
  </div>
  <div class="topbar-actions">
    <!-- User menu, search, etc -->
  </div>
</div>
```

### Status Badges

```html
<!-- Success -->
<span class="status-badge status-active">Active</span>

<!-- Alert -->
<span class="status-badge status-pending">Pending</span>

<!-- Neutral -->
<span class="status-badge status-invited">Invited</span>
```

**Color Mapping:**
- `status-active`: Green (#059669)
- `status-pending`: Orange (#F59E0B)
- `status-suspended`: Red (#DC2626)
- `status-invited`: Blue (#2563EB)

---

## PATTERNS

### Layout Patterns

#### Dashboard Hero Section
```html
<div class="hero-stats">
  <div class="stat-card"><!-- ... --></div>
  <div class="stat-card"><!-- ... --></div>
  <div class="stat-card"><!-- ... --></div>
  <div class="stat-card"><!-- ... --></div>
</div>
```

**Grid:** `repeat(auto-fit, minmax(280px, 1fr))`
- 4 columns on desktop
- 2 columns on tablet
- 1 column on mobile

#### Two-Column Grid (Cards)
```html
<div class="dashboard-grid">
  <div class="card"><!-- Content --></div>
  <div class="card"><!-- Content --></div>
</div>
```

**Grid:** `repeat(auto-fit, minmax(400px, 1fr))`

#### Page Header with Actions
```html
<div class="page-header">
  <h2>Page Title</h2>
  <div class="header-controls">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Empty States

```html
<div class="empty-state">
  <p>No data to display</p>
</div>
```

**Best Practices:**
- ✅ Add helpful text
- ✅ Include image/icon if context allows
- ✅ Provide action (link to create, import)
- ❌ Don't use generic "No data"
- ❌ Don't make it depressing

### Loading States

#### Loading Spinner
```html
<span class="loader"></span>
```

#### Skeleton Loading
```html
<div class="skeleton-card">
  <div class="skeleton-text"></div>
  <div class="skeleton-text"></div>
</div>
```

---

## RESPONSIVE BREAKPOINTS

```css
/* Mobile First */
@media (max-width: 640px) {
  /* Extra small devices */
}

@media (max-width: 768px) {
  /* Tablets & small devices */
  .app-view { grid-template-columns: 1fr; }
  .sidebar { transform: translateX(-100%); }
  .sidebar.active { transform: translateX(0); }
}

@media (min-width: 769px) and (max-width: 1199px) {
  /* Tablets & small desktops */
  .hero-stats { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1200px) {
  /* Desktop */
  .hero-stats { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1400px) {
  /* Large desktop */
  .page-content { max-width: 1400px; }
}
```

**Key Touch Points:**
- 768px: Sidebar collapses on mobile
- 1200px: Multi-column layouts stack
- 1400px: Content max-width applied

---

## ANIMATIONS

### Micro-interactions

#### Button Hover
```css
.btn {
  transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

**Why -1px?** Just enough to feel "lifted" without being obvious

#### Card Hover
```css
.card {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

#### Fade In (Page Load)
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.view.active {
  animation: fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

#### Slide In (Modals, Sidebars)
```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal.active {
  animation: slideInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

#### Focus Ring Animation
```css
input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}
```

---

## ACCESSIBILITY

### Color Contrast
All text must meet WCAG AA (4.5:1 ratio):

- Primary text on white: #0B0B0B ✅ (21:1)
- Secondary text on white: #6B7280 ✅ (10:1)
- Accent text on white: #2563EB ✅ (8.5:1)
- White text on accent: #FFFFFF ✅ (8.5:1)

### Focus Indicators
```css
input:focus,
button:focus,
select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}
```

**Minimum Focus Ring Size:** 3px (exceeds WCAG)

### Keyboard Navigation
- Tab: Navigate forward
- Shift+Tab: Navigate backward
- Enter: Activate button, submit form
- Space: Toggle checkbox, expand menu
- Escape: Close modal, collapse menu
- Arrow keys: Select from dropdown

### Semantic HTML
```html
<!-- Good -->
<button>Click me</button>
<nav>Links</nav>
<article>Content</article>

<!-- Avoid -->
<div onclick="doSomething()">Click me</div>
<div class="nav">Links</div>
```

### ARIA Attributes
```html
<button aria-label="Close menu">×</button>
<div role="status" aria-live="polite">Updated</div>
<div aria-hidden="true">Decorative icon</div>
```

---

## DARK MODE

Dark mode is built-in via CSS variables:

```css
:root {
  --color-bg: #FFFFFF;
  --color-text: #0B0B0B;
  --color-accent: #2563EB;
}

[data-theme="dark"] {
  --color-bg: #0A0A0A;
  --color-text: #F5F5F5;
  --color-accent: #3B82F6;
}
```

### Enabling Dark Mode
```javascript
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('admin_theme', theme);
}

// Detect system preference
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  setTheme('dark');
}

// Listen for changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  setTheme(e.matches ? 'dark' : 'light');
});
```

### Image Handling in Dark Mode
```css
/* Logo inverts in light mode */
.logo {
  filter: invert(1);
}

[data-theme="dark"] .logo {
  filter: invert(0);
}
```

---

## BEST PRACTICES

### Do's ✅
- ✅ Use CSS variables for all values
- ✅ Follow 8px spacing grid
- ✅ Test animations on all devices
- ✅ Ensure keyboard navigation
- ✅ Use semantic HTML
- ✅ Compress images & SVGs
- ✅ Test with screen readers
- ✅ Check color contrast ratios

### Don'ts ❌
- ❌ Hardcode colors (use variables)
- ❌ Use random spacing values
- ❌ Add decorative animations
- ❌ Ignore mobile responsiveness
- ❌ Over-engineer CSS (keep it simple)
- ❌ Add too many fonts (stick to 2)
- ❌ Use color alone for status
- ❌ Forget dark mode testing

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-20 | Initial release: Complete redesign with world-class SaaS patterns |

---

*Reference document for Qaulium AI Admin Portal design system.*
*Last Updated: March 20, 2026*
