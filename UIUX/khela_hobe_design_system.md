---
name: "Khela Hobe — Sporty Dark + Electric Lime"
description: "High-energy, community-first sports discovery and match organization design system for Bangladesh, anchored in deep turf greens and electric lime."
---

## Overview

Khela Hobe connects recreational athletes across Bangladesh to discover nearby matches, organize instant Quick Matches, and build trusted local sports communities. The visual language balances **athletic energy** with **approachable clarity**—combining deep night-turf dark surfaces (`#101A17` and `#1B2923`) with high-visibility electric lime (`#B9F34A`) for primary calls to action, inspired by floodlit pitches and modern sports wearables.

- **Primary Polarity:** Dark mode is the primary visual identity; light mode is supported as a clean daytime alternative.
- **Design Style:** Crisp, high-contrast athletic UI with tonal surface layering, subtle 1px structural borders, and generous breathing room—avoiding neon glow blobs, heavy drop shadows, or decorative clutter.

## Colors

The palette pairs deep forest-slate neutrals with electric lime (`#B9F34A`) for primary actions, pitch green (`#26865B`) for secondary actions, and warm orange (`#FF9F43`) for urgent match highlights and live indicators. Semantic status colors (`success`, `warning`, `error`) are reserved strictly for state feedback, capacity indicators, and validation.

```yaml
colors:
  primary: "#B9F34A"
  on-primary: "#131F00"
  secondary: "#26865B"
  on-secondary: "#FFFFFF"
  accent: "#FF9F43"
  on-accent: "#1F1100"
  success: "#32C77A"
  on-success: "#002110"
  warning: "#FFC857"
  on-warning: "#261900"
  error: "#FF5C5C"
  on-error: "#2B0000"
  dark:
    background: "#101A17"
    on-background: "#FFFFFF"
    surface: "#1B2923"
    on-surface: "#FFFFFF"
    surface-elevated: "#23342D"
    on-surface-elevated: "#FFFFFF"
    muted: "#9BAAA2"
    border: "#2C3B34"
  light:
    background: "#F4F8F5"
    on-background: "#101A17"
    surface: "#FFFFFF"
    on-surface: "#101A17"
    surface-elevated: "#E8F3EE"
    on-surface-elevated: "#101A17"
    muted: "#56615D"
    border: "#D0DDD6"
```

## Typography

Headings use **Manrope** for geometric athletic authority and crisp legibility at display and card-title scales. Body copy, form controls, and buttons use **Inter** for clean UI density and tabular numeric alignment (`tabular-nums`) on match times, slot counts, and scores. **Fragment Mono** is available for match codes and tabular IDs.

```yaml
typography:
  display-lg:
    fontFamily: "Manrope"
    fontSize: 48px
    fontWeight: 800
    lineHeight: 54px
    letterSpacing: -0.75px
  display-lg-mobile:
    fontFamily: "Manrope"
    fontSize: 32px
    fontWeight: 800
    lineHeight: 38px
    letterSpacing: -0.5px
  headline-lg:
    fontFamily: "Manrope"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 38px
    letterSpacing: -0.5px
  headline-md:
    fontFamily: "Manrope"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 30px
    letterSpacing: -0.25px
  title-lg:
    fontFamily: "Manrope"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 26px
    letterSpacing: -0.15px
  title-md:
    fontFamily: "Manrope"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 22px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Inter"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-md:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 21px
    letterSpacing: 0px
  body-sm:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0px
  label-md:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.2px
  label-sm:
    fontFamily: "Inter"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 14px
    letterSpacing: 0.3px
  mono-sm:
    fontFamily: "Fragment Mono"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0px
```

## Layout & Spacing

Desktop uses a persistent 256px left sidebar paired with a fluid main content area (max-width `1280px` inside the workspace) and a 12-column responsive grid. Tablet collapses the sidebar behind a drawer toggle; mobile uses a compact top bar and a 5-item bottom navigation bar with a prominent **Create Match** action.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 48px
  page-margin: 24px
```

## Elevation & Depth

Hierarchy is established primarily through **tonal surface steps** (`dark-background` `#101A17` → `dark-surface` `#1B2923` → `dark-surface-elevated` `#23342D`) paired with crisp 1px `dark-border` (`#2C3B34`) outlines. Avoid heavy drop shadows, glassmorphism blurs, or glowing neon halos.

## Shapes

Cards and containers use a friendly yet athletic **16px** (`lg`) corner radius; interactive buttons, inputs, and select controls use **12px** (`md`); compact status badges and sport pills use **8px** (`DEFAULT`) or **9999px** (`full`).

```yaml
rounded:
  sm: 6px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px
```

## Motion & Micro-interaction

Interactions feel immediate and athletic. Hover and focus transitions resolve in `120ms`; drawers and modals enter in `220ms` with a decelerating curve. Nothing loops or bounces purely for decoration.

```yaml
motion:
  state-change:
    duration: 120ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 220ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Voice & Content Strategy

- **Tone of voice:** Encouraging, direct, and community-driven. Speak like a reliable teammate—never bureaucratic or overly formal.
- **Capitalisation:** Sentence case for body copy and descriptions; Title Case for navigation items, match titles, and primary CTA buttons (`Find a Match`, `Create Match`, `Join Match`).
- **Terminology:** Use *Quick Match* (not "pickup game"), *Slots* (not "spots" or "seats"), *Equipment Pledge* (not "gear donation"), and *Organizer* (not "host").
- **Numbers, dates, and units:** Use `Asia/Dhaka` local time (`6:00 PM`, `Today, 6:00 PM`, `Sat, 22 Nov`). Always show slot counts as `X / Y players` or `X slots left` with `tabular-nums`.

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Badge** → `@components/badge.html`: `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html`: `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html`: `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Input Field** → `@components/input-field.html`: `input-field-text`, `input-field-icon`
