---
name: Terminal Protocol
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c6c6ca'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#909094'
  outline-variant: '#45474a'
  surface-tint: '#c7c6c9'
  primary: '#c7c6c9'
  on-primary: '#303033'
  primary-container: '#0b0c0e'
  on-primary-container: '#7a7a7c'
  inverse-primary: '#5e5e61'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#c6c6cb'
  on-tertiary: '#2e3034'
  tertiary-container: '#0a0c10'
  on-tertiary-container: '#797a7f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e3e2e5'
  primary-fixed-dim: '#c7c6c9'
  on-primary-fixed: '#1b1c1e'
  on-primary-fixed-variant: '#464749'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#e2e2e7'
  tertiary-fixed-dim: '#c6c6cb'
  on-tertiary-fixed: '#1a1c1f'
  on-tertiary-fixed-variant: '#45474b'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1440px
---

## Brand & Style
The design system is engineered for the high-performance individual. It adopts a **Premium Command Center** aesthetic—a synthesis of **Minimalism** and **Glassmorphism** with a technical, cinematic edge. The UI is designed to feel like an intelligent, adaptive operating system rather than a standard application. 

The emotional response is one of calm focus and high stakes. The interface remains "quiet" during periods of deep work but utilizes sharp, energetic accents to signal progress or critical pressure. Every element is intentional, removing visual noise to prioritize the "Quest" at hand. The atmosphere is stoic, elite, and hyper-responsive, evocative of advanced aerospace or terminal-based hardware.

## Colors
The palette is rooted in a deep, layered dark mode. **Deep Obsidian** serves as the primary canvas, providing a "bottomless" cinematic depth. 

- **Primary (Obsidian):** Used for base surfaces and background layers. Not pure black, allowing for subtle shadow and depth.
- **Accent (Electric Cyan):** The "energy" color. Used for active progress, focus states, and primary calls to action.
- **Secondary (Graphite):** Neutralizes the UI, used for secondary borders, inactive states, and structural dividers.
- **Semantic Accents:** 
  - **Muted Crimson:** Indicates pressure, approaching deadlines, or failed states.
  - **Emerald Green:** Reserved for verified success and completion.
  - **Pale Gold:** A rare, high-contrast color for "Achievement" tier milestones.

## Typography
The typography strategy leverages two distinct weights of precision. **Geist** handles the core UI and narrative elements, offering a clean, modern, and balanced sans-serif experience that remains legible even at small scales.

**JetBrains Mono** is utilized for all data-driven points, numeric readouts, and status labels. This monospaced font reinforces the "Command Center" feel, ensuring that changing data values do not cause layout shifts and that technical information feels authoritative and structured. All labels should be set in uppercase with increased letter spacing to enhance the technical aesthetic.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model for desktop to maintain the "Dashboard" integrity, while transitioning to a fluid single-column layout for mobile. 

- **Desktop:** A 12-column grid with 16px gutters. Elements are often grouped into "Zones" (Modules) that snap to the grid.
- **Density:** High density is encouraged for data visualization, using a 4px base unit. 
- **Margins:** Generous outer margins (48px+) on desktop create a "floating" interface effect, making the OS feel like a focused overlay on the user's workflow.
- **Safe Areas:** Complex components like Quests should maintain internal padding of at least 24px (6 units) to ensure the glassmorphism effects have room to "breathe."

## Elevation & Depth
Depth is created through **Glassmorphism** and tonal layering rather than traditional heavy shadows. 

1.  **Base Layer:** The Deep Obsidian background.
2.  **Surface Layer:** Semi-transparent Graphite (#2D2F33 at 40% opacity) with a `backdrop-filter: blur(20px)`.
3.  **Stroke:** Hairline borders (0.5px to 1px) using a lightened version of the accent color at 20% opacity. This defines the edge of the glass without adding bulk.
4.  **Shadows:** When necessary, use extremely diffused "Ambient Shimmers"—low opacity glows of the secondary or primary accent color—to suggest the element is hovering and powered by an internal light source.

## Shapes
The shape language is "Soft-Technical." Elements use a subtle **0.25rem (4px)** corner radius to prevent the UI from feeling dated or overly aggressive (Brutalist), yet remain sharp enough to feel like high-precision hardware. 

Buttons and input fields follow this 4px standard, while "Status Chips" and "HUD elements" may occasionally utilize 0px (sharp) corners or 45-degree chamfered edges to emphasize a futuristic, military-grade aesthetic.

## Components

### Quest Cards
The central component of the design system. Cards must visually reflect their state:
- **Locked:** 20% opacity, blurred content, "Hairline" border.
- **Available:** Standard glassmorphism, white text, Electric Cyan subtle glow on hover.
- **In-Progress:** Electric Cyan pulse on the left border; active timer in JetBrains Mono.
- **Proof Required:** Muted Crimson subtle "Warning" glow; high-contrast action button.
- **Completed:** Emerald Green accents; "Verified" watermark in the background.
- **Failed:** Grayscale with a Muted Crimson strike-through on the title.

### Progress Bars
Ultra-thin (2px to 4px) lines. The filled portion should have a "Glow" effect (`box-shadow`) in Electric Cyan. For high-stakes goals, the bar may shimmer or "flicker" as the deadline approaches.

### Input Fields
Technical and serious. Use JetBrains Mono for input text. The field should be a simple bottom border that "lights up" into a full box-outline when focused.

### HUD Stats
Visualizations (Hexagonal radar charts or Circular rings) should be minimalist. Use thin strokes and avoid solid fills. These represent the user's "Operating Status" and should appear as a persistent sidebar or top-level dashboard element.

### Buttons
Primary buttons use a solid Electric Cyan fill with Deep Obsidian text. Secondary buttons are "Ghost" style with a hairline border and Cyan text.