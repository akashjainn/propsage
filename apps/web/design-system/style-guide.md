# Propsage Design System - Color Palette Guide

## Overview

This color palette is derived directly from your beautiful gradient "P" logo, creating a cohesive brand experience across your application. The colors flow from hot pink → coral orange → purple → cyan blue, matching your logo's gradient.

## Core Brand Colors

### Primary - Cyan Blue (`#22c7f5`)
- **Use for**: Primary actions, links, active states, main CTAs
- **Scales**: `primary-50` to `primary-950`
- **Best with**: Dark backgrounds, white text

### Secondary - Hot Pink (`#f63d83`)
- **Use for**: Highlights, notifications, secondary actions, accent elements
- **Scales**: `secondary-50` to `secondary-950`
- **Best with**: Dark backgrounds, white text

### Tertiary - Purple (`#7e3dff`)
- **Use for**: Special features, premium content, creative elements
- **Scales**: `tertiary-50` to `tertiary-950`
- **Best with**: Dark backgrounds, light text

### Accent - Coral Orange (`#f96316`)
- **Use for**: Warnings that need to stand out, energy, warmth
- **Scales**: `accent-50` to `accent-950`
- **Best with**: Dark backgrounds, white text

## Component Examples

### Buttons

```tsx
// Primary Button
<button className="bg-gradient-primary text-text-inverse px-6 py-3 rounded-lg font-semibold shadow-primary hover:shadow-lg hover:scale-105 transition-all duration-200">
  Get Started
</button>

// Secondary Button
<button className="border-2 border-secondary-400 text-secondary-400 px-6 py-3 rounded-lg font-semibold hover:bg-secondary-400 hover:text-text-inverse transition-all duration-200">
  Learn More
</button>

// Ghost Button
<button className="text-primary-400 px-6 py-3 rounded-lg font-semibold hover:bg-primary-400/10 hover:text-primary-300 transition-all duration-200">
  Cancel
</button>

// Gradient Border Button
<button className="border-gradient-brand text-text-primary px-6 py-3 rounded-lg font-semibold hover:shadow-brand-glow transition-all duration-200">
  Premium Feature
</button>
```

### Cards

```tsx
// Basic Card
<div className="bg-surface border border-border rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
  <h3 className="text-text-primary text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-text-secondary">Card content goes here...</p>
</div>

// Elevated Card with Glow
<div className="bg-surface-hover border border-border-strong rounded-xl p-6 shadow-lg shadow-brand-glow">
  <h3 className="text-gradient-brand text-xl font-bold mb-2">Premium Card</h3>
  <p className="text-text-primary">Premium content with brand gradient...</p>
</div>

// Feature Card
<div className="bg-gradient-surface border border-primary-500/20 rounded-xl p-6 backdrop-blur-sm">
  <div className="w-12 h-12 bg-gradient-primary rounded-lg mb-4 flex items-center justify-center">
    <Icon className="text-text-inverse" />
  </div>
  <h3 className="text-text-primary text-lg font-semibold mb-2">Feature Name</h3>
  <p className="text-text-secondary text-sm">Feature description...</p>
</div>
```

### Form Elements

```tsx
// Input Field
<div className="space-y-2">
  <label className="text-text-primary font-medium">Email Address</label>
  <input
    type="email"
    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
    placeholder="Enter your email"
  />
</div>

// Select Dropdown
<select className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200">
  <option>Choose an option</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>

// Checkbox
<label className="flex items-center space-x-3 cursor-pointer">
  <input type="checkbox" className="w-5 h-5 text-primary-500 bg-surface border-border rounded focus:ring-primary-400 focus:ring-2" />
  <span className="text-text-primary">I agree to the terms</span>
</label>
```

### Navigation

```tsx
// Navigation Bar
<nav className="bg-surface/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <img src="/logo.png" alt="Propsage" className="h-8 w-8" />
        <span className="text-gradient-brand text-xl font-bold ml-2">Propsage</span>
      </div>
      <div className="flex items-center space-x-8">
        <a href="#" className="text-text-primary hover:text-primary-400 transition-colors">Features</a>
        <a href="#" className="text-text-primary hover:text-primary-400 transition-colors">Pricing</a>
        <a href="#" className="text-text-primary hover:text-primary-400 transition-colors">About</a>
        <button className="bg-gradient-primary text-text-inverse px-4 py-2 rounded-lg font-semibold hover:shadow-primary transition-all">
          Sign Up
        </button>
      </div>
    </div>
  </div>
</nav>

// Sidebar Navigation
<div className="w-64 bg-surface border-r border-border h-full">
  <div className="p-6">
    <div className="text-gradient-brand text-lg font-bold">Menu</div>
  </div>
  <nav className="space-y-1 px-3">
    <a href="#" className="flex items-center px-3 py-2 text-primary-400 bg-primary-400/10 rounded-lg">
      <Icon className="mr-3 h-5 w-5" />
      Dashboard
    </a>
    <a href="#" className="flex items-center px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors">
      <Icon className="mr-3 h-5 w-5" />
      Analytics
    </a>
  </nav>
</div>
```

### Badges & Tags

```tsx
// Status Badges
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-500/20 text-success-300">
  Active
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-500/20 text-warning-300">
  Pending
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-500/20 text-error-300">
  Error
</span>

// Brand Badge
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-brand text-text-inverse">
  Premium
</span>

// Outlined Badge
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-primary-400 text-primary-400">
  New Feature
</span>
```

### Alerts & Notifications

```tsx
// Success Alert
<div className="bg-success-500/10 border border-success-500/20 rounded-lg p-4">
  <div className="flex">
    <CheckIcon className="h-5 w-5 text-success-400 mt-0.5" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-success-300">Success!</h3>
      <p className="text-sm text-success-200 mt-1">Your changes have been saved successfully.</p>
    </div>
  </div>
</div>

// Error Alert
<div className="bg-error-500/10 border border-error-500/20 rounded-lg p-4">
  <div className="flex">
    <XIcon className="h-5 w-5 text-error-400 mt-0.5" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-error-300">Error!</h3>
      <p className="text-sm text-error-200 mt-1">Something went wrong. Please try again.</p>
    </div>
  </div>
</div>

// Info Alert with Gradient
<div className="bg-gradient-surface border border-primary-500/20 rounded-lg p-4">
  <div className="flex">
    <InfoIcon className="h-5 w-5 text-primary-400 mt-0.5" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-primary-300">New Feature Available!</h3>
      <p className="text-sm text-text-secondary mt-1">Check out our latest updates in the dashboard.</p>
    </div>
  </div>
</div>
```

### Loading & Progress

```tsx
// Loading Spinner with Brand Colors
<div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-400 border-t-transparent"></div>
</div>

// Progress Bar
<div className="w-full bg-neutral-800 rounded-full h-2">
  <div className="bg-gradient-primary h-2 rounded-full transition-all duration-300" style="width: 65%"></div>
</div>

// Pulsing Skeleton
<div className="animate-pulse">
  <div className="h-4 bg-neutral-700 rounded mb-3"></div>
  <div className="h-4 bg-neutral-700 rounded mb-3 w-5/6"></div>
  <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
</div>
```

## Hero Sections & Marketing

```tsx
// Hero Section
<div className="relative min-h-screen bg-background overflow-hidden">
  {/* Background Gradient */}
  <div className="absolute inset-0 bg-gradient-surface"></div>
  
  {/* Content */}
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
    <div className="text-center">
      <h1 className="text-6xl md:text-8xl font-bold mb-6">
        <span className="text-gradient-brand">Transform</span>
        <span className="text-text-primary"> Your Ideas</span>
      </h1>
      <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-12">
        Build something amazing with our powerful platform designed for creators, developers, and innovators.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="bg-gradient-brand text-text-inverse px-8 py-4 rounded-xl font-semibold text-lg shadow-brand-glow hover:shadow-xl hover:scale-105 transition-all duration-300 animate-pulse-glow">
          Get Started Free
        </button>
        <button className="border-2 border-border-strong text-text-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-surface-hover hover:border-primary-400 transition-all duration-300">
          Watch Demo
        </button>
      </div>
    </div>
  </div>
</div>

// Feature Grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-primary rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
    <div className="relative bg-surface border border-border rounded-2xl p-8 group-hover:border-primary-500/30 transition-all duration-300">
      <div className="w-16 h-16 bg-gradient-primary rounded-xl mb-6 flex items-center justify-center animate-float">
        <Icon className="h-8 w-8 text-text-inverse" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-4">Fast Performance</h3>
      <p className="text-text-secondary">Lightning-fast load times and smooth interactions for the best user experience.</p>
    </div>
  </div>
</div>
```

## Typography Scale

```tsx
// Headings with Brand Gradients
<h1 className="text-6xl font-bold text-gradient-brand mb-4">Display Large</h1>
<h2 className="text-4xl font-bold text-text-primary mb-3">Heading 1</h2>
<h3 className="text-2xl font-semibold text-text-primary mb-3">Heading 2</h3>
<h4 className="text-xl font-semibold text-text-primary mb-2">Heading 3</h4>
<h5 className="text-lg font-medium text-text-primary mb-2">Heading 4</h5>

// Body Text
<p className="text-base text-text-primary mb-4">Primary body text</p>
<p className="text-base text-text-secondary mb-4">Secondary body text</p>
<p className="text-sm text-text-muted">Muted text for captions and metadata</p>
```

## Accessibility Guidelines

- **Contrast**: All text colors meet WCAG 2.1 AA standards
- **Focus States**: Always include visible focus indicators using brand colors
- **Color Blindness**: Don't rely solely on color to convey information
- **Dark Theme**: Optimized for dark-first design with proper contrast ratios

## Usage Tips

1. **Consistency**: Stick to the defined color scales rather than creating custom colors
2. **Hierarchy**: Use color intensity to create visual hierarchy (lighter = less important)
3. **Brand Recognition**: Use the main brand gradient sparingly for maximum impact
4. **Semantic Meaning**: Use semantic colors (success, warning, error) appropriately
5. **Performance**: CSS custom properties allow for easy theming and dynamic color changes

## CSS Import

```css
/* Import the base colors */
@import './design-system/colors.css';

/* Apply to your app root */
body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
}
```

## Tailwind Import

```javascript
// In your tailwind.config.js
module.exports = require('./tailwind.config.propsage.js');
```

This comprehensive color system will give your app a cohesive, modern look that perfectly reflects your brand identity!