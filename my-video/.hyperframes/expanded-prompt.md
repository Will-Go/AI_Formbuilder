# FormIA Cinematic Promo — Expanded Production Prompt

## Title & Style

**FormIA: AI-Powered Form Builder — 30s Cinematic SaaS Promo**

- Canvas: #0a0a12 (deep space black)
- Surfaces: #12121e, #1a1a2e (navy-tinted glass)
- Accents: Purple #7c3aed → Blue #3b82f6 → Cyan #06b6d4
- Text: #f0f0ff (cool white), #6b7280 (muted)
- Fonts: Space Grotesk 700 (headlines), DM Sans 350/400 (body), JetBrains Mono 400 (code)
- Mood: Apple product launch meets AI startup. Clean, confident, luminous.

## Rhythm Declaration

`fade-BUILD-slide-ZOOM-DRIVE-DRIVE-punch-resolve`

Energy arc: Calm (logo) → Medium (dashboard, DnD) → High (AI panel, conversation) → Peak (accept/reject) → Wind-down (goodbye) → Resolve (CTA)

## Global Rules

- **Transitions**: CSS blur crossfade (opening, closing) + zoom-through (mid scenes). Primary = zoom-through (0.5s, power2.inOut). Accent = blur crossfade (0.6s, sine.inOut).
- **Parallax**: Background radial glows drift slowly (0.02x speed). Foreground glass panels at normal speed. Creates depth.
- **Particles**: Floating cyan/purple dots drift across scenes 4-8. 12-20 particles, sine.inOut drift, 8-15s cycles.
- **Glassmorphism**: All UI panels use `backdrop-filter: blur(20px); background: rgba(26,26,46,0.6); border: 1px solid rgba(124,58,237,0.15)`
- **Cursor**: Simulated cursor (small white dot with glow) appears in scenes 2,3,5,6,7 to show interaction.

## Per-Scene Beats

### Scene 1: Logo Reveal [0-3s]

**Concept**: Emergence from nothing. A single luminous point expands into the FormIA brand. The viewer's first impression — this is premium, this is intelligent. Like a neural network activating.

**Mood direction**: Apple keynote opening. Dark cinema. The moment before the reveal.

**Depth layers**:
- BG: Deep #0a0a12 + radial purple glow (center, 40% opacity, breathing scale 1.0→1.05)
- MG: FormIA logo (Space Grotesk 700, 120px, #f0f0ff) + "Build forms with AI." subtitle (DM Sans 300, 36px, #6b7280)
- FG: Cinematic glow ring (200px diameter, purple gradient border, pulsing), subtle grain overlay

**Animation choreography**:
- Logo: FADES IN + scale 0.8→1.0, 0.8s, expo.out — weighty, deliberate
- Subtitle: types on character-by-character, 0.6s delay, 1.5s total — intelligent, conversational
- Glow ring: scale 0→2.5 + opacity 0.6→0, 1.5s, power3.out — energy burst
- Background glow: breathes scale 1.0→1.05, yoyo, repeat 2, 1.5s cycle — alive

**Transition out**: Blur crossfade, 0.5s, sine.inOut. Scene 2 fades in behind.

---

### Scene 2: Dashboard [3-6s]

**Concept**: The product comes alive. A sleek form builder dashboard materializes — sidebar, canvas, toolbar. The user's workspace, perfected. This is where creation happens.

**Mood direction**: Premium SaaS product demo. Clean, spacious, inviting. Think Linear or Notion's best moment.

**Depth layers**:
- BG: #0a0a12 + left radial blue glow (30% opacity) + subtle grid pattern (2px lines, 5% opacity)
- MG: Dashboard mockup — left sidebar (form components palette), center canvas (form preview), top toolbar
- FG: "Create smarter forms in seconds." text overlay (bottom third), accent line (purple, 2px, horizontal, scaleX 0→1)

**Animation choreography**:
- Dashboard container: SLIDES in from right (x: 200→0) + blur 20px→0, 0.7s, expo.out — confident entrance
- Sidebar: CASCADES in from left, staggered 0.1s per item (5 items), 0.4s each, power3.out
- Canvas content: FADES IN, 0.5s delay, 0.6s, power2.out
- Toolbar: SLIDES down from top (y: -40→0), 0.4s, power3.out
- Text overlay: SLIDES up from bottom (y: 40→0) + opacity, 0.5s delay, 0.5s, expo.out
- Accent line: scaleX 0→1, 0.6s, expo.out — draws the eye

**Transition out**: Zoom-through (scale 1→1.15, blur 0→15px, 0.4s, power3.in) → entry (scale 0.85→1, blur 15px→0, 0.5s, expo.out)

---

### Scene 3: Drag & Drop [6-9s]

**Concept**: The core interaction. A "Rating Question" component lifts from the palette and glides into position on the form canvas. Fluid, natural, satisfying. The form builds itself.

**Mood direction**: Micro-interaction showcase. The satisfying click of a well-designed tool. Think Figma's best drag animation.

**Depth layers**:
- BG: Same as Scene 2 (continuity) + accent glow follows the dragged element
- MG: Component palette (left, highlighted "Rating" item), form canvas (center, drop target indicator), cursor
- FG: Drag trail (fading purple streak), drop zone indicator (pulsing cyan border)

**Animation choreography**:
- Palette highlight: Rating item GLows (box-shadow 0→20px purple), 0.3s, power2.out
- Component: LIFTS from palette (scale 1.05, y: -5, shadow increase), 0.3s, back.out(1.5)
- Component flight: MOVES right (x: +600) + slight arc (y: -20→0), 0.8s, power2.inOut — smooth glide
- Drop zone: PULSES border (cyan, opacity 0.3→1→0.3), 0.4s, sine.inOut
- Component lands: SCALE 1.05→1.0 + shadow settles, 0.2s, power3.out — satisfying snap
- Camera: subtle zoom 1.0→1.03 toward interaction, 1.5s, sine.inOut

**Transition out**: Zoom-through (scale 1→1.2, blur 0→20px, 0.35s, power3.in) → entry (scale 0.8→1, blur 20px→0, 0.45s, expo.out)

---

### Scene 4: AI Panel [9-11s]

**Concept**: The AI awakens. The palette closes, the chatbot panel slides in from the right with a futuristic animation. A new dimension of the product reveals itself — conversational AI.

**Mood direction**: Sci-fi UI reveal. The moment the AI enters the room. Think Jarvis activating.

**Depth layers**:
- BG: #0a0a12 + right-side cyan glow (40% opacity, emerging) + floating particles (8 dots, drift)
- MG: AI chat panel (glassmorphism, right side), chat header "FormIA AI", input field with blinking cursor
- FG: "Powered by conversational AI." text (center-left), holographic scan line (horizontal, sweeping down)

**Animation choreography**:
- Palette: SLIDES out left (x: -300, opacity 0), 0.3s, power3.in — exits cleanly
- AI panel: SLIDES in from right (x: 400→0) + blur 30px→0, 0.6s, expo.out — dramatic entrance
- Panel glow: EMERGES (box-shadow 0→40px cyan), 0.8s, power2.out
- Scan line: SWEEPS down (y: -100→1200), 0.8s, linear — futuristic
- Text: FADES IN + scale 0.95→1.0, 0.4s delay, 0.5s, expo.out
- Particles: drift (y: random path, 8s cycle, yoyo, repeat 0) — ambient life
- Cursor: BLINKS (opacity 1→0→1, 0.8s cycle, repeat 2) — waiting

**Transition out**: Blur crossfade, 0.4s, power2.inOut

---

### Scene 5: AI Conversation [11-18s]

**Concept**: The conversation unfolds. The user types a complex request. The AI instantly analyzes and transforms the form — sections get titles, ratings get questions, multiple choice gets options. Real-time magic.

**Mood direction**: Product demo at its best. The "wow" moment. Think GitHub Copilot's suggestion appearing.

**Depth layers**:
- BG: #0a0a12 + dual radial glows (purple left, cyan right, 25% each) + particle field (15 dots)
- MG: Chat panel (right, conversation flowing), Form canvas (center, morphing in real-time), typing indicator
- FG: AI analysis visualization (pulsing neural network lines connecting chat to form), update highlights (green glow on changed elements)

**Animation choreography**:
- User message: TYPES ON character-by-character (0.8s per message, 3 messages total with 0.3s gaps)
- Typing indicator: PULSES (3 dots, staggered scale 1→1.3→1, 0.4s cycle)
- AI response: SLIDES up from bottom (y: 30→0), 0.3s, expo.out
- Form updates: MORPH in sequence — title fades in (0.3s), description slides down (0.3s), rating question updates (0.4s), MC options cascade (0.15s stagger)
- Update highlights: FLASH green (#10b981, opacity 0→0.4→0), 0.5s per element
- Neural lines: DRAW from chat to form (stroke-dashoffset animation), 0.6s, power2.out
- Particles: accelerate drift during analysis, settle after — energy pulse

**Transition out**: None (continuous into Scene 6)

---

### Scene 6: Accept Edits [18-20s]

**Concept**: The user confirms. "Accept First Edit" — a green checkmark animation. Then "Accept All" — a cascade of confirmations. Clean, satisfying, trust-building.

**Mood direction**: Confirmation micro-interactions. The satisfaction of a well-executed workflow.

**Depth layers**:
- BG: Same as Scene 5 + green accent glow emerging
- MG: Chat panel (accept buttons highlighted), Form (updates solidifying), checkmark animations
- FG: Green confirmation particles, success glow

**Animation choreography**:
- "Accept First Edit" button: HIGHLIGHTS (border green, scale 1.02), 0.2s, power2.out
- First checkmark: DRAWS (SVG path, 0.3s, power2.out) + scale bounce (1→1.2→1)
- "Accept All" button: PULSES (green glow 0→20px→0), 0.4s, sine.inOut
- Cascade checkmarks: STAGGER across form items (0.1s each), green flash per item
- Success particles: BURST (8 green dots, radial spread, 0.6s, expo.out)

**Transition out**: Zoom-through (scale 1→1.1, blur 0→12px, 0.3s, power3.in) → entry (scale 0.9→1, blur 12px→0, 0.4s, expo.out)

---

### Scene 7: Edit & Reject [20-25s]

**Concept**: The user tests the AI further. "Delete the last question and edit the rating description." The AI proposes. The user rejects the delete (red animation) but accepts the rating edit (green animation). Intelligence meets human control.

**Mood direction**: Trust and control. The AI suggests, the human decides. Think code review — approve/reject.

**Depth layers**:
- BG: #0a0a12 + split glow (red left, green right, 20% each) — tension
- MG: Chat panel (AI proposals), Form (red strike on deleted item, green highlight on accepted edit), accept/reject buttons
- FG: Red/green color coding, decision indicators

**Animation choreography**:
- User message: TYPES ON, 0.6s
- AI proposal: SLIDES up, 0.3s — two proposed changes
- Delete proposal: RED border pulse (#ef4444, 0→0.3→0), 0.4s
- Edit proposal: GREEN border pulse (#10b981, 0→0.3→0), 0.4s
- Reject button: FLASHES red + X icon draws (0.3s), item gets strikethrough animation (scaleX 0→1, 0.2s)
- Accept button: FLASHES green + checkmark draws (0.3s), item glows green
- Form: deleted item fades + slides left (0.3s), rating description morphs (0.4s)

**Transition out**: Blur crossfade, 0.5s, sine.inOut

---

### Scene 8: Goodbye + CTA [25-30s]

**Concept**: The conversation closes warmly. "Thanks FormIA, goodbye." / "Happy to help." Then — the hero shot. The complete, polished form in all its glory. Camera slowly pans. The tagline lands: "Your AI-powered form builder." Final CTA: "Build faster. Think less. Create better." Fade to luminous brand mark.

**Mood direction**: Product launch hero moment. The final frame of an Apple ad. Confidence, elegance, closure.

**Depth layers**:
- BG: #0a0a12 + expansive radial glow (purple-cyan gradient, 50% opacity) + subtle star field (tiny white dots)
- MG: Complete form (hero shot, centered, 70% frame width), FormIA logo + tagline, CTA text
- FG: Cinematic letterbox bars (top/bottom, 40px, black, opacity 0→0.6), grain overlay

**Animation choreography**:
- Chat goodbye: TYPES ON (user, 0.4s) → AI response slides up (0.3s) → panel SLIDES out right (x: 400, 0.4s, power3.in)
- Form: CENTERS + scale 0.95→1.0, 0.6s, expo.out — hero moment
- Camera pan: slow x drift (+30px over 3s), sine.inOut — cinematic movement
- Logo: FADES IN + scale 0.9→1.0, 0.5s, expo.out (at 27s)
- Tagline: SLIDES up (y: 30→0), 0.4s delay, 0.5s, expo.out
- CTA: FADES IN, 0.3s delay, 0.5s, power2.out
- Letterbox bars: slide in from top/bottom, 0.4s, power2.out
- Final glow: BREATHE (scale 1.0→1.08, opacity 0.5→0.3), 2s, sine.inOut, yoyo, repeat 1
- Everything: FADES TO BLACK (opacity 0), 0.8s, power2.in (at 29.2s)

## Recurring Motifs

- **Radial glow**: Every scene has a colored radial glow in the background — shifts from purple (scenes 1-3) to cyan (scenes 4-6) to purple-cyan gradient (scenes 7-8)
- **Glass panels**: All UI surfaces use glassmorphism — consistent depth language
- **Accent lines**: Thin purple/cyan horizontal lines appear as structural elements across scenes
- **Particle drift**: Small luminous dots drift across scenes 4-8 — the AI's ambient presence
- **Green/red feedback**: Accept/reject color language used in scenes 6-7

## Negative Prompt

- No pure #000 or #fff backgrounds/text
- No gradient text (background-clip: text)
- No banned fonts (Inter, Roboto, Poppins, etc.)
- No identical card grids
- No everything-centered layouts — use zone-based composition
- No static decorative elements — everything breathes
- No `repeat: -1` on any timeline
- No `Math.random()` or `Date.now()`
