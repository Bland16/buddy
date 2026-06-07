import type { Config } from 'tailwindcss';

// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        tailwind.config.ts
// DOMAIN:      ui
// CONCEPT:     Design tokens — Buddy's mint/pine palette + rounded type (brand source of truth in CSS)
// RELATIONS:   mirrors CSS vars in client/src/index.css; consumed by every .tsx via className
// KEY EXPORTS: default Config
// PURPOSE:     Maps Buddy's brand colors and font to Tailwind utility classes.
// LLM EDIT GUIDE: Tune the palette here AND in client/src/index.css :root vars (keep them in sync).
//                 Per BUDDY_BRAND_AESTHETIC.md §6 the brand is ONE color (mint) — resist adding hues.
// DAY-OF CHANGES: tweak `mint` shade for a different primary; adjust `cozy` plaid opacity.
// ─────────────────────────────────────────────────────────────────────────

export default {
  content: ['./client/index.html', './client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // DAY-OF CHANGE: the single brand color. Mirror any change in index.css --mint.
        mint: {
          DEFAULT: '#5FBF86',
          soft: '#A9E0C0',
          deep: '#3E9B68',
        },
        pine: '#1F4A36', // primary text
        canvas: '#F4FAF6', // off-white app background
        ink: '#1F4A36',
      },
      fontFamily: {
        // Rounded geometric sans per brand guide. Loaded via Google Fonts in index.html.
        sans: ['Quicksand', 'Nunito', 'Baloo 2', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(31, 74, 54, 0.08)',
        lift: '0 12px 40px rgba(31, 74, 54, 0.12)',
      },
      backgroundImage: {
        // Soft mint gingham accent — used sparingly, never behind body text (brand §6).
        plaid:
          'repeating-linear-gradient(0deg, rgba(95,191,134,0.08) 0px, rgba(95,191,134,0.08) 2px, transparent 2px, transparent 14px), repeating-linear-gradient(90deg, rgba(95,191,134,0.08) 0px, rgba(95,191,134,0.08) 2px, transparent 2px, transparent 14px)',
      },
    },
  },
  plugins: [],
} satisfies Config;
