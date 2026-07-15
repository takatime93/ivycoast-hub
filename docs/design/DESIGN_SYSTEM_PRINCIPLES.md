# Loop Design System — Guiding Principles (Taka, 2026-07-13)

The production design system is NOT a photocopy of concept-b-loop.html. It is a SYNTHESIS:

1. CONCEPT = the LANGUAGE. Take the concept's spacing rhythm, type scale, color roles
   (incl. typed-event tints SETTLE/MONEY/TASK/CONTRACT/LAUNCH), motion, and layout DNA
   as the foundation.

2. CURRENT APP = KEEP WHAT'S GOOD. The production app has real strengths — preserve them:
   skeleton loaders, WCAG-AA-tuned focus rings, the drawer pattern, toast system, i18n
   engine. Do NOT discard proven components to chase the prototype.

3. ELEVATE where both are weak → PRODUCTION CRAFT. The concept's components are often
   placeholder-simple. Build the real versions:
   - Filters must FEEL like toggles: segmented control with a sliding/selected indicator
     and real pressed/selected states — NOT four flat identical pills (Taka's example).
   - Buttons: real hover/active/focus/disabled state feedback.
   - Every interactive component gets genuine state design, not just a color swap.

Rule of thumb: for each component, ask "what's the best this could be?" — pulling the
better pattern from concept OR current app OR designing a new one — not "what did the
concept sketch?"

Applied at INSTALLATION (design-system foundation slice). Extraction doc
(loop-design-system.md) captures the concept baseline; this file governs how we elevate it.
