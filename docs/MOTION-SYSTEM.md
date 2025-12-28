# 🎬 ZeroHunger Motion System - Integration Guide

> **"Liquid Engineering"** - A premium motion system that feels organic, physical, and expensive.

This document provides integration examples for the ZeroHunger Motion System, built with Framer Motion v11+ and designed for Next.js 15+.

---

## 📦 Components Overview

| Component                | Purpose                           | Key Features                         |
| ------------------------ | --------------------------------- | ------------------------------------ |
| `MotionProvider`         | Centralized physics configuration | Consistent spring physics across app |
| `Fade`, `Slide`, `Scale` | Animation primitives              | Directional animations with physics  |
| `StaggerContainer`       | List orchestrator                 | Waterfall/cascade effects            |
| `AnimatedCard`           | Interactive cards                 | layoutId, hover lift, 3D tilt, glow  |
| `MagneticButton`         | Premium buttons                   | Magnetic pull, cursor glow           |
| `template.tsx`           | Page transitions                  | Context-aware route animations       |

---

## 🚀 Quick Start

### 1. Provider Setup (Already done in layout.tsx)

```tsx
// src/app/layout.tsx
import { MotionProvider } from "@/components/ui/motion-system";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
```

### 2. Page Transitions (Already done)

The `template.tsx` automatically wraps all pages with smooth transitions.

---

## 🌊 Donation Grid Waterfall Effect

The `DonationGrid` is already integrated! Cards cascade in with a beautiful waterfall effect:

```tsx
// Usage - already works out of the box
<DonationGrid donations={donations} isLoading={isLoading} />
```

### How it works:

```tsx
// src/components/donations/DonationGrid.tsx
import { StaggerContainer } from "@/components/ui/stagger-container";

return (
  <StaggerContainer
    effect="slide-up"
    staggerDelay={0.08}
    distance={24}
    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
  >
    {donations.map((donation) => (
      <DonationCard key={donation.id} donation={donation} />
    ))}
  </StaggerContainer>
);
```

---

## 🎯 Animation Primitives

### Fade

```tsx
import { Fade } from "@/components/ui/motion-system";

// Simple fade up
<Fade>Hello World</Fade>

// Fade from different directions
<Fade direction="left" distance={40} delay={0.2}>
  Slides in from right
</Fade>

// With layout animations for list reordering
<Fade layout layoutId={`item-${id}`}>
  This animates when position changes
</Fade>
```

### Slide

```tsx
import { Slide } from "@/components/ui/motion-system";

<Slide direction="up" distance={60}>
  Dramatic entrance
</Slide>;
```

### Scale

```tsx
import { Scale } from "@/components/ui/motion-system";

<Scale from={0.8} to={1}>
  Scales up from 80%
</Scale>;
```

---

## 📋 Stagger Container

### Basic Waterfall

```tsx
import { StaggerContainer } from "@/components/ui/stagger-container";

<StaggerContainer effect="slide-up" staggerDelay={0.1}>
  <div>First (appears immediately)</div>
  <div>Second (100ms delay)</div>
  <div>Third (200ms delay)</div>
</StaggerContainer>;
```

### Available Effects

| Effect        | Description                      |
| ------------- | -------------------------------- |
| `fade`        | Simple opacity                   |
| `slide-up`    | Fade + move from below (default) |
| `slide-down`  | Fade + move from above           |
| `slide-left`  | Fade + move from right           |
| `slide-right` | Fade + move from left            |
| `scale`       | Fade + scale up                  |
| `blur`        | Fade + blur effect               |

### Grid Layout

```tsx
import { GridStagger } from "@/components/ui/stagger-container";

<GridStagger columns={3} gap={4} effect="scale">
  {items.map((item) => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</GridStagger>;
```

---

## 🃏 Animated Card

### Basic Usage

```tsx
import { AnimatedCard } from "@/components/ui/animated-card";

<AnimatedCard hoverLift={8} hoverScale={1.02} enableGlow>
  <Card>Your content</Card>
</AnimatedCard>;
```

### With Shared Layout (Morphing)

```tsx
// List View
<AnimatedCard layoutId={`donation-${id}`}>
  <CardPreview />
</AnimatedCard>

// Detail View (on another page)
<AnimatedCard layoutId={`donation-${id}`}>
  <CardDetail />
</AnimatedCard>
```

### 3D Tilt Effect

```tsx
<AnimatedCard enableTilt tiltDegrees={10}>
  <Card>Tilts with mouse position</Card>
</AnimatedCard>
```

---

## 🧲 Magnetic Button

### Basic Usage

```tsx
import { MagneticButton } from "@/components/ui/magnetic-button";

<MagneticButton variant="default" size="lg">
  Get Started
</MagneticButton>;
```

### Variants

```tsx
// Premium glow effect
<MagneticButton variant="glow">Subscribe</MagneticButton>

// Outline style
<MagneticButton variant="outline" size="xl">
  Learn More
</MagneticButton>

// Disable magnetic (keep glow)
<MagneticButton disableMagnetic>Just Glow</MagneticButton>
```

---

## ♿ Accessibility

### Reduced Motion

All animations automatically respect `prefers-reduced-motion`:

```tsx
// In any component
import { useReducedMotion } from "@/hooks/useReducedMotion";

function MyComponent() {
  const { shouldReduceMotion } = useReducedMotion();

  // Animations auto-disabled when shouldReduceMotion is true
}
```

### Zero CLS

All animated components use:

- `will-change: opacity, transform` during animation
- `contain: layout style paint` where appropriate
- Initial states that match final dimensions

---

## ⚡ Performance Tips

1. **Large Lists**: Use `staggerDelay={0.05}` or lower for lists > 20 items
2. **Layout Animations**: Only use `layout` prop when items actually reorder
3. **Disable When Hidden**: Components outside viewport don't animate
4. **Memoize**: Variants are already memoized internally

---

## 🔧 Physics Constants

Access the physics configuration anywhere:

```tsx
import { PHYSICS, EASINGS, DURATIONS } from "@/components/ui/motion-system";

// Available physics profiles
PHYSICS.default; // stiffness: 100, damping: 20 (most UI)
PHYSICS.snappy; // stiffness: 300, damping: 30 (micro-interactions)
PHYSICS.gentle; // stiffness: 60, damping: 20 (large movements)
PHYSICS.bouncy; // stiffness: 200, damping: 15 (playful)
PHYSICS.silk; // stiffness: 50, damping: 25 (page transitions)
```

---

## 🎨 Examples: Complete Integration

### Dashboard with Staggered Stats

```tsx
import { StaggerContainer } from "@/components/ui/stagger-container";
import { Fade } from "@/components/ui/motion-system";
import { MagneticButton } from "@/components/ui/magnetic-button";

function Dashboard() {
  return (
    <div>
      {/* Hero fades in */}
      <Fade direction="up" distance={30}>
        <h1>Welcome back!</h1>
      </Fade>

      {/* Stats cascade */}
      <StaggerContainer
        effect="scale"
        staggerDelay={0.1}
        className="grid grid-cols-3 gap-4"
      >
        <StatCard title="Donations" value={42} />
        <StatCard title="Impact" value={156} />
        <StatCard title="Claims" value={8} />
      </StaggerContainer>

      {/* CTA with magnetic effect */}
      <MagneticButton variant="glow" size="lg">
        Create Donation
      </MagneticButton>
    </div>
  );
}
```

### Notification List

```tsx
<StaggerContainer effect="slide-left" staggerDelay={0.05}>
  {notifications.map((n) => (
    <NotificationItem key={n.id} notification={n} />
  ))}
</StaggerContainer>
```

---

## 🏆 Quality Benchmarks Met

✅ **Centralized Physics**: All animations use consistent spring values  
✅ **Reduced Motion**: Full accessibility support  
✅ **Zero CLS**: No layout shifts during animations  
✅ **Page Transitions**: Smooth route changes with scroll reset  
✅ **Magnetic Interactions**: Premium button feel  
✅ **Stagger Orchestration**: Beautiful list animations  
✅ **Shared Layouts**: layoutId support for morphing  
✅ **Performance**: Memoized variants, will-change hints

---

_Built with ❤️ for ZeroHunger - Stage 8 Polish_
