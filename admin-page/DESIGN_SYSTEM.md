# Qaulium AI Admin Portal — Design System

## UX STRATEGY

### User Personas
1. **Enterprise Admin** — Control access, manage teams, monitor system health
2. **Department Manager** — Oversee staff, track projects, manage budgets
3. **Support Coordinator** — Intake management, lead nurturing, communication
4. **Data Analyst** — Analytics, reporting, insights generation

### Core User Journeys
1. **Login → Dashboard Overview** (0s-30s)
2. **Quick Action** – Search, filter, manage (30s-3 min)
3. **Deep Dive** – Analytics, reports, team viewing (3-15 min)
4. **Configuration** – Settings, integrations, security (5-30 min)

---

## INFORMATION ARCHITECTURE

```
Admin Portal
├── Dashboard (Operations Pulse)
├── People
│   ├── Users & Teams
│   ├── Departments
│   └── Roles & Permissions
├── Operations
│   ├── Tasks & Projects
│   ├── Notifications & Comms
│   └── Forms Management
├── Data & Analytics
│   ├── Dashboards
│   ├── Reports
│   └── Insights
├── Intake & CRM
│   ├── Registrations
│   ├── Contacts
│   └── Careers
├── Settings
│   ├── Organization
│   ├── Integrations
│   ├── API & Keys
│   └── Security
└── Monitoring
    ├── System Health
    ├── Incidents
    └── Audit Logs
```

---

## VISUAL DESIGN SYSTEM

### Color Palette
- **Dominant**: Deep Charcoal (`#0B0B0B`)
- **Secondary**: Soft Blue (`#2563EB`)
- **Support**: Emerald (`#059669`)
- **Alert**: Coral Red (`#DC2626`)
- **Surface**: Clean White (`#FFFFFF`)
- **Depth**: Subtle Grays (F9FAFB → E5E7EB)

### Typography
- **Headlines**: Inter (700, 600, 500) — Modern, Confident
- **Body**: IBM Plex Sans (400, 500) — Professional, Legible
- **Code**: IBM Plex Mono (400) — Technical, Clean

**Font Scaling:**
- H1: 48px (line-height: 1.2)
- H2: 32px (line-height: 1.3)
- H3: 20px (line-height: 1.4)
- Body: 14px (line-height: 1.6)
- Small: 12px (line-height: 1.5)

### Spacing System
- **Base**: 8px
- **2x**: 16px
- **3x**: 24px
- **4x**: 32px
- **5x**: 40px
- **6x**: 48px

### Component Styling
- **Border Radius**: 12px (cards), 8px (inputs), 6px (buttons)
- **Shadows**:
  - Soft: `0 1px 3px rgba(0,0,0,0.08)`
  - Medium: `0 4px 12px rgba(0,0,0,0.12)`
  - Strong: `0 8px 24px rgba(0,0,0,0.16)`
- **Borders**: 1px solid `#E5E7EB` (default)
- **Elevation**: Subtle z-depth with shadow + border combo

---

## DASHBOARD LAYOUT SYSTEM

### Grid Structure: 12-Column, Responsive
- **Desktop**: 1400px container, 12 columns
- **Tablet**: 768px container, 8 columns
- **Mobile**: Full-width, 4 columns

### Key Patterns
1. **Header + Sidebar** — Sticky navigation, collapsible on mobile
2. **Hero Stat Cards** — 4-6 key metrics with micro-trends
3. **Flexible Grid Layouts** — Cards resize intelligently
4. **Scrollable Tables** — Infinite scroll or pagination (10 per page)
5. **Modal Overlays** — Centered, semi-transparent backdrop

---

## COMPONENT DESIGN

### Buttons
- **Primary**: Dark background, white text, subtle shadow on hover
- **Secondary**: Border + transparent, hover adds light background
- **Danger**: Red border/text, hover adds red tint background
- **Iconographic**: 40x40px, rounded, ghost style

### Cards
- White background, 1px gray border, 12px radius
- Padding: 24px (large), 16px (medium), 12px (small)
- Hover: `box-shadow: 0 4px 12px rgba(0,0,0,0.12)`
- Transition: 0.2s ease

### Inputs
- Border: 1px solid gray
- Padding: 12px 14px
- Focus: Blue border + 3px blue ring (opacity 0.1)
- Radius: 8px
- Font: 14px, "IBM Plex Sans"

### Badge/Pills
- Inline-flex with padding 6px 12px
- Border-radius: 999px
- Font-weight: 600, font-size: 12px
- Color-coded: green (active), red (error), gray (default)

### Tables
- Min-width headers, striped rows (alternate light gray)
- Row hover: subtle blue tint
- Actions column: icon buttons (edit, delete, more)
- Pagination: centered, simple style

---

## ANIMATION PHILOSOPHY

### Principles
- **Micro-interactions**: 0.2s ease-out (hover, focus)
- **Transitions**: 0.3s ease (navigation, reveals)
- **Complex animations**: 0.6s ease-in-out (modals, page load)

### Key Effects
1. **Button Hover**: -1px translateY + shadow lift
2. **Card Hover**: +1px shadow grow + subtle background shift
3. **Modal Open**: Fade in + slight scale (0.95 → 1)
4. **List Item Hover**: Background color shift + left border highlight
5. **Loading**: Smooth spinner (2s infinite rotation)
6. **Empty State**: Fade-in text with 200ms stagger

### Anti-Patterns
- No robotic movement
- No abrupt state changes
- No distracting animations in data-heavy views
- No auto-playing content

---

## CONVERSION & INTERACTION STRATEGY

### Admin Dashboard
- **Goal**: Give admins their most-needed info in <2 seconds
- **Strategy**: Hero stat cards first, then deep-dive sections
- **Feedback**: Real-time updates (WebSocket), live counters

### Intake Management (Registrations/Contacts/Careers)
- **Goal**: Rapid intake triage and response
- **Strategy**: Clear status badges, quick-action buttons, bulk operations
- **Friction Reduction**: Inline editing, pre-populated templates

### Settings & Configuration
- **Goal**: Self-service without confusion
- **Strategy**: Grouped sections, contextual help, preview panels
- **Safety**: Confirmation modals for destructive actions

### Analytics & Reporting
- **Goal**: Unlock data-driven decisions
- **Strategy**: Visual charts, drill-down capability, export options
- **Time Savings**: Preset date ranges, save custom views

---

## QUALITY CHECKPOINTS

### UX Quality
- [ ] Navigation is always visible (sticky header + sidebar)
- [ ] Every action has clear feedback (click, load, success/error)
- [ ] 404s and errors are graceful with recovery paths
- [ ] Empty states are meaningful (not generic)
- [ ] Loading never feels frozen (spinners, skeleton screens)

### Visual Quality
- [ ] No jarring color shifts (smooth transitions)
- [ ] Consistent spacing (no random 13px gaps)
- [ ] Typography hierarchy is clear (h1/h2/h3/p spacing)
- [ ] Shadows create depth, not clutter
- [ ] Icons are consistent (single set, same stroke-width)

### Performance
- [ ] Dashboard loads in <2s
- [ ] Interactions feel snappy (<200ms response)
- [ ] Modals open smoothly without layout shift
- [ ] No janky animations (60 FPS)

### Accessibility
- [ ] All buttons have :focus states
- [ ] Links are distinguishable
- [ ] Form errors are clear
- [ ] Color isn't the only indicator
- [ ] Keyboard navigation works

---

## WHY THIS FEELS HUMAN-DESIGNED

1. **Intentional Spacing** — Not cramped, not excessive; breathing room
2. **Thoughtful Color** — 3-color palette (not rainbow)
3. **Premium Typography** — Font pairing with clear hierarchy
4. **Micro-Details** — Hover states, loading indicators, success feedback
5. **Real User Workflows** — Not generic "demo" data
6. **Consistent Patterns** — Button styles, card layouts repeat logically
7. **Smart Defaults** — Sensible date ranges, pre-filled searches
8. **Respectful Motion** — Smooth, not hacky; purposeful, not show-off
9. **Clear Hierarchy** — What matters most is obvious
10. **Trust Signals** — Transparent metrics, real data, not made-up stats

---

## DESIGN TOKENS (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary: #0B0B0B;
  --color-text: #0B0B0B;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  --color-accent: #2563EB;
  --color-success: #059669;
  --color-alert: #DC2626;
  --color-bg: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-border: #E5E7EB;
  --color-border-light: #F3F4F6;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Timing */
  --duration-fast: 0.2s;
  --duration-normal: 0.3s;
  --duration-slow: 0.6s;
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

[data-theme="dark"] {
  --color-bg: #0A0A0A;
  --color-surface: #111111;
  --color-border: #262626;
  /* ... rest of dark mode aliases */
}
```

---

## NEXT STEPS

1. Implement HTML structure (semantic, accessible)
2. Build CSS using design tokens (no hardcoded values)
3. Add JavaScript interactions (smooth, responsive)
4. Test on all devices and browsers
5. Gather feedback from real users
6. Iterate with data-driven refinements

---

*Design created with intent to build trust, reduce friction, and make data accessible.*
