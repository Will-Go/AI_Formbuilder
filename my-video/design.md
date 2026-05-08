---
name: FormIA Cinematic
colors:
  primary: "#0a0a12"
  surface: "#12121e"
  surface-elevated: "#1a1a2e"
  on-primary: "#f0f0ff"
  accent-purple: "#7c3aed"
  accent-blue: "#3b82f6"
  accent-cyan: "#06b6d4"
  accent-green: "#10b981"
  accent-red: "#ef4444"
  muted: "#6b7280"
typography:
  headline:
    fontFamily: Space Grotesk
    fontWeight: 700
  body:
    fontFamily: DM Sans
    fontWeight: 400
  mono:
    fontFamily: JetBrains Mono
    fontWeight: 400
rounded:
  sm: 8px
  md: 12px
  lg: 20px
  xl: 24px
spacing:
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
motion:
  energy: moderate
  easing:
    entry: "expo.out"
    exit: "power3.in"
    ambient: "sine.inOut"
  duration:
    entrance: 0.6
    hold: 2.0
    transition: 0.5
  atmosphere:
    - radial-glow
    - particle-field
    - glassmorphism
  transition: cinematic-zoom
---

## Overview

FormIA is an AI-powered form builder platform. The visual identity conveys futuristic intelligence merged with premium SaaS aesthetics. Dark canvas with luminous purple-blue-cyan gradient accents. Glassmorphism UI elements with soft shadows and subtle neon glows. The mood is "Apple product launch meets AI startup" — clean, confident, sophisticated.

## Colors

- **Background**: Deep space black (#0a0a12) — never pure black
- **Surfaces**: Dark navy-tinted panels (#12121e, #1a1a2e)
- **Primary accent**: Purple (#7c3aed) — the AI/brand color
- **Secondary accent**: Blue (#3b82f6) — interactive elements
- **Tertiary accent**: Cyan (#06b6d4) — highlights, particles
- **Text**: Cool white (#f0f0ff) — never pure white
- **Muted**: Blue-gray (#6b7280) — secondary text

## Typography

- **Headlines**: Space Grotesk 700 — geometric, modern, techy
- **Body**: DM Sans 400 — clean humanist sans for readability
- **Code/Data**: JetBrains Mono 400 — monospace for technical elements
- Dark background compensation: use font-weight 350 for body, increase line-height by 0.05

## Elevation

- Glassmorphism: `backdrop-filter: blur(20px); background: rgba(26,26,46,0.6); border: 1px solid rgba(124,58,237,0.15)`
- Soft shadows: `box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(124,58,237,0.1)`
- Neon glow accents: `box-shadow: 0 0 20px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.1)`

## Do's and Don'ts

- DO use radial glows and ambient light effects
- DO animate all decorative elements (breathe, drift, pulse)
- DO use glassmorphism for UI panels
- DON'T use pure #000 or #fff
- DON'T use gradient text (background-clip)
- DON'T use banned fonts (Inter, Roboto, Poppins, etc.)
