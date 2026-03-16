# Ivycoast Hub — Design Tokens

## Text Styles

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| Heading/1 | SF Pro Display | 32px | 600 | 40px | 0 | Page titles |
| Heading/2 | SF Pro Display | 24px | 600 | 30px | 0 | Vendor name (header), stat card values |
| Heading/3 | SF Pro Display | 16px | 600 | 20px | 0 | Card company name, contact names |
| Body/Regular | SF Pro Text | 14px | 400 | 20px | 0 | Note body, task text, product names, form inputs |
| Body/Regular (emph) | SF Pro Text | 14px | 600 | 20px | 0 | Note author, contact primary name, prices |
| Body/Small | SF Pro | 12px | 400 | 16px | 0 | Address, email, links, activity text, stock warnings |
| Body/Small (emph) | SF Pro | 12px | 600 | 16px | 0 | Activity bold labels, banner shop names |
| Subtitle/1 | SF Pro Display | 12px | 600 | normal | 0 | Section headers, stat card labels, "Monthly" dropdown |
| Subtitle/2 | SF Mono | 10px | 400 | normal | -0.3px | Dates, sub-labels, roles, action buttons, timestamps, pipeline labels |
| Tab | SF Pro Text | 13px | 500 | 20px | 0 | Secondary nav tab text |
| Badge | SF Mono | 10px | 400 | 1 (unitless) | -0.3px | Stage badges, type badges, split badges |

## Color Tokens

### Brand
| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#0e413b` | Primary brand green — buttons, links, icons, active states |
| `--color-primary-hover` | `#1a5c50` | Hover state for primary elements |
| `--color-primary-tint` | `#e8f0ee` | Light green tint — active toggle bg, brand hover |

### Text
| Token | Value | Usage |
|---|---|---|
| `--color-text` | `#181818` | Body text default |
| `--color-text-heading` | `#202124` | Heading text |
| `--color-text-secondary` | `#5f6368` | Labels, meta text, table headers |
| `--color-text-tertiary` | `#80868b` | Section titles, field labels, empty states |
| `--color-text-muted` | `#424242` | Vendor company text, address, contact rows |
| `--color-text-subtle` | `#606060` | Note timestamps, roles, descriptions |
| `--color-text-disabled` | `#9aa0a6` | Disabled/placeholder content |
| `--color-text-inverse` | `#fff` | White text on dark backgrounds |
| Section header label | `#062420` | Dark green-black for section titles |

### Surfaces
| Token | Value | Usage |
|---|---|---|
| `--color-surface` | `#fff` | Primary background |
| `--color-surface-secondary` | `#f8f9fa` | Card hover, secondary surfaces |
| `--color-surface-tertiary` | `#f1f3f4` | Hover backgrounds, tag backgrounds |
| `--color-surface-alt` | `#fafafa` | Modal action bars |

### Borders
| Token | Value | Usage |
|---|---|---|
| `--color-border` | `#dadce0` | Input borders, button borders |
| `--color-border-subtle` | `#e3e3e3` | Card borders, panel dividers |
| `--color-border-light` | `#ebebeb` | Header borders, light separators |
| `--color-border-separator` | `#f0f0f0` | Table row borders, thin dividers |

### Status
| Token | Value | Usage |
|---|---|---|
| `--color-success-bg` | `#e6f4ea` | Success badge background |
| `--color-success-text` | `#137333` | Success badge text |
| `--color-success-bright` | `#00a52c` | Green values, "We earn" |
| `--color-warning-bg` | `#fef7e0` | Warning badge background |
| `--color-warning-text` | `#b06000` | Warning badge text |
| `--color-error-bg` | `#fce8e6` | Error badge background |
| `--color-error-text` | `#c5221f` | Error/delete text |
| `--color-error-bright` | `#ff1818` | Notification dots |
| `--color-neutral-bg` | `#e8eaed` | Draft/neutral badge background |
| `--color-neutral-text` | `#5f6368` | Draft/neutral badge text |

### Links
| Token | Value | Usage |
|---|---|---|
| `--color-link` | `#0e413b` | Internal links |
| `--color-link-external` | `#157be1` | External links (website, social) |

### Pipeline Stages
| Token | Value | Usage |
|---|---|---|
| `--color-stage-prospect` | `#3cb1ff` | Prospect |
| `--color-stage-outreach` | `#fec553` | Outreach |
| `--color-stage-negotiation` | `#ff5e5e` | Negotiation |
| `--color-stage-active` | `#0e413b` | Active Partner |
| `--color-stage-inactive-bg` | `#f2f2f2` | Inactive background |
| `--color-stage-inactive-text` | `#353535` | Inactive text |

## Spacing Tokens

| Token | Value | Usage |
|---|---|---|
| `--space-0` | 0 | No spacing |
| `--space-0-5` | 2px | Tight gaps (name-subtitle) |
| `--space-1` | 4px | Badge gaps, inline element spacing |
| `--space-1-5` | 6px | Small gaps (badge to name, stat card gap) |
| `--space-2` | 8px | Standard gap — button groups, card content, section gaps |
| `--space-2-5` | 10px | Medium gaps |
| `--space-3` | 12px | Card content, section padding, icon gaps |
| `--space-4` | 16px | Section padding, card padding vertical |
| `--space-5` | 20px | Card padding horizontal |
| `--space-6` | 24px | Section divider padding, column gaps, overview padding |
| `--space-8` | 32px | Panel side padding |

## Radius Tokens

| Token | Value | Usage |
|---|---|---|
| Badge radius | 2px | Stage/type badges |
| `--radius-sm` | 4px | Chips, small inputs, tab count badges |
| `--radius-md` | 6px | Inputs, buttons, dropdowns |
| `--radius-lg` | 8px | Cards, modals, note cards |
| `--radius-xl` | 12px | Larger cards, notification dropdown |
| `--radius-2xl` | 16px | Vendor cards |
| `--radius-full` | 50% | Avatars, circles |

## Shadow Tokens

| Token | Value | Usage |
|---|---|---|
| `--shadow-card` | `0 4px 14px rgba(0,0,0,0.03)` | Card resting state |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | Info cards, light elevation |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.1)` | Dropdown menus |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,0.12)` | More menus, submenus |
| `--shadow-xl` | `0 8px 30px rgba(0,0,0,0.18)` | Modals |
| `--shadow-focus` | `0 0 0 2px rgba(14,65,59,0.2)` | Focus rings |

## Font Stacks

| Token | Value | Usage |
|---|---|---|
| `--font-display` | `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Headings, section headers, stat labels |
| `--font-text` | `'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Body 14px content |
| `--font-body` | `'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Body 12px, general small text |
| `--font-mono` | `'SF Mono', 'SFMono-Regular', 'Menlo', 'Consolas', monospace` | Dates, sub-labels, roles, badges |
| `--font-icon` | `'FA6 Pro'` | Icons (weights: 300 Light, 400 Regular, 900 Solid) |
| `--font-icon-brand` | `'FA6 Brands'` | Social media icons |

## Transition Tokens

| Token | Value | Usage |
|---|---|---|
| `--transition-fast` | `0.1s` | Fast hover responses |
| `--transition-normal` | `0.15s` | Standard interactions |
| `--transition-slow` | `0.3s` | Drawer/panel animations |
