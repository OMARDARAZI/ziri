# Zeere Front-End Premium UI Design System

This document outlines the design tokens, visual assets, CSS architecture, responsive layout rules, accessibility targets, and component specifications developed for the Zeere platform.

---

## 1. Brand Identity and Color Palettes

The Zeere visual identity is centered on premium coastal hospitality, coastal safety, and elegant exploration. It avoids cartoonish tropical styling, remaining optimized for serious administrative tasks and quick provider validations.

```css
:root {
  /* Coastal Core Palette */
  --zeere-navy: #0B1F33;         /* Base layout color, navigation background */
  --zeere-navy-light: #16344F;   /* Card header borders, section indicators */
  --zeere-teal: #0B7F83;         /* Brand CTA, primary buttons, primary icons */
  --zeere-turquoise: #1CB5B0;    /* Interactive hover state highlights */
  --zeere-aqua-soft: #DDF5F3;    /* Highlight card backgrounds, soft fills */
  --zeere-sand: #F5F0E8;         /* Secondary hover states, sand neutrals */

  /* Neutral Surface Palette */
  --zeere-background: #F5F7FA;   /* Dashboard content background */
  --zeere-surface: #FFFFFF;      /* Primary card/table surface container */
  --zeere-border: #E5EAF0;       /* Divider lines, input boundaries */
  --zeere-text: #17212B;         /* Contrast headers, typography body text */
  --zeere-muted: #6B7785;        /* Secondary captions, subtitles */

  /* Soft Functional Status Palette */
  --zeere-success: #198754;      /* Active / Confirmed / Validated text */
  --zeere-success-soft: #D1E7DD; /* Active badges background */
  --zeere-warning: #E5A100;      /* Pending / Not Yet Valid text */
  --zeere-warning-soft: #FFF3CD; /* Pending badges background */
  --zeere-danger: #D64545;       /* Cancelled / Expired / Invalid text */
  --zeere-danger-soft: #F8D7DA;  /* Cancelled badges background */
}
```

---

## 2. Typography

We utilize **Plus Jakarta Sans** as our primary typeface for modern page titles and dashboard statistics, paired with **Inter** for dense tabular list columns, labels, and paragraph layouts. Both fonts are imported directly from Google Fonts in `tokens.css`.

- **Page Titles**: `1.75rem`, Bold (`fontWeight: 800`), Letter-spacing: `-0.02em`
- **Section Headers**: `1.25rem`, Bold (`fontWeight: 700`)
- **Card Statistic Labels**: `0.8rem`, Semi-Bold (`fontWeight: 600`), Upper-case, Letter-spacing: `0.05em`
- **Body / Descriptions**: `0.95rem` or `0.9rem`, Regular (`fontWeight: 400`), Line-height: `1.6`
- **Table Columns / Numbers**: Monospace and Tabular Numbers (`font-variant-numeric: tabular-nums`) enabled for prices, booking totals, and date sequences.

---

## 3. Spacing, Borders, and Elevation

To maintain spaciousness and consistent visual rhythm across dashboards, we use a custom sizing scale:

### Radiuses
- **Small Controls (Tooltips, small badges)**: `8px` (`--zeere-radius-sm`)
- **Inputs & Button Elements**: `10px` (`--zeere-radius-md`)
- **Main Cards & Panels**: `14px` (`--zeere-radius-lg`)
- **Modals, Drawers & Lightboxes**: `18px` (`--zeere-radius-xl`)

### Shadows & Borders
We combine subtle borders with soft, low-contrast shadows to avoid heavy, default dashboard grids:
- **Border**: `1px solid var(--zeere-border)`
- **Card Shadow**: `0 2px 8px rgba(11, 31, 51, 0.04)` (`--zeere-shadow-sm`)
- **Floating Panel Shadow**: `0 4px 16px rgba(11, 31, 51, 0.08)` (`--zeere-shadow-md`)

---

## 4. Reusable Premium Components

### A. Primary and Secondary Action Buttons
Buttons feature transition hooks for clean states, matching iOS-compliant minimum touch sizes of `44px` height (where appropriate).
```html
<!-- Primary Button -->
<button class="btn btn-primary d-inline-flex align-items-center gap-1.5">
  <svg class="lucide-plus" ...></svg>
  <span>Create Offering</span>
</button>

<!-- Outline / Cancel Button -->
<button class="btn btn-outline-secondary">Cancel</button>
```

### B. Input Control States & Textareas
All text controls leverage soft gray background states on read-only columns, and highlight borders on focus.
```html
<label class="form-label" for="username">Phone number</label>
<div class="input-group">
  <span class="input-group-text"><svg class="lucide-phone" ...></svg></span>
  <input class="form-control" id="username" placeholder="e.g. 70123456" />
</div>
```

### C. Statistics Cards
Used across Admin and Provider landing dashboards, displaying metric tallies, matching icons, and metadata tooltips.
```html
<div class="stat-card">
  <div class="stat-icon-wrapper" style="color: var(--zeere-teal); background: rgba(11,127,131,0.15)">
    <svg class="lucide-users" ...></svg>
  </div>
  <div class="stat-info">
    <span class="stat-value">1,482</span>
    <span class="stat-label">Total Customers</span>
  </div>
</div>
```

### D. Digital QR Ticket Cards
Styled for mobile-first rendering on public ticket share links.
```html
<div class="ticket-card">
  <div class="ticket-header">
    <span class="ticket-brand">ZEERE</span>
  </div>
  <div class="ticket-body">
    <h2>Client Name</h2>
    <div class="ticket-divider"></div>
    <!-- QR Code image, details parameters -->
  </div>
</div>
```

---

## 5. Responsive and Accessibility Rules

### Breakpoints & Layout Adapters
- **Mobile (< 768px)**: Forms stack into a single column. All grid components switch to flex vertical wrappers.
- **Tablets (< 992px)**: The navigation sidebar collapses into a slide-out drawer triggered via the top header's menu.
- **Desktop (>= 992px)**: Sidebar stays locked to the left. Main content displays inside a max-width wrapper of `1400px` to prevent layout stretches.

### Accessibility Target Guidelines
- **Contrast ratio**: All text classes conform to WCAG 2.1 AA contrast constraints (color combinations are tested to maintain 4.5:1 ratio).
- **Keyboard accessibility**: Custom elements feature `aria-live` regions, and interactive icons include appropriate descriptive labels.
