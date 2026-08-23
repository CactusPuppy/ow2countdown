# Technology Stack

**Analysis Date:** 2026-08-23

## Languages

**Primary:**
- TypeScript ~5.8.3 - Full codebase type safety

**Runtime:**
- JavaScript (ES2020+) - Compiled from TypeScript

## Runtime

**Environment:**
- Node.js 18 (from `.nvmrc`)

**Package Manager:**
- Yarn - Lockfile: `yarn.lock` present

## Frameworks

**Core:**
- SvelteKit 2.60.1 - Full-stack web framework
- Svelte 5.55.7 - Component framework

**Styling:**
- TailwindCSS 4.1.11 - Utility-first CSS framework
- PostCSS 8.5.10 - CSS transformation
- Autoprefixer 10.4.5 - Browser vendor prefixes

**Build/Dev:**
- Vite 7.3.5 - Build tool and dev server
- svelte-preprocess 6.0.3 - Svelte component preprocessing
- @sveltejs/vite-plugin-svelte 6.1.0 - Vite plugin for Svelte

**Development Tools:**
- ESLint 9.31.0 - Linting
- @typescript-eslint/eslint-plugin 8.38.0 - TypeScript linting rules
- @typescript-eslint/parser 8.38.0 - TypeScript parser for ESLint
- eslint-plugin-svelte3 4.0.0 - Svelte linting
- svelte-check 4.3.0 - Svelte type checking

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.52.0 - Database and authentication client
- @supabase/ssr 0.6.1 - Server-side rendering support for Supabase auth
- @sveltejs/adapter-vercel 6.3.2 - Deployment adapter for Vercel

**Date/Time:**
- date-fns 4.1.0 - Date manipulation and formatting utilities
- date-fns-tz 3.2.0 - Timezone support for date-fns

**Markdown & Content:**
- svelte-markdown 0.4.1 - Markdown rendering in Svelte
- marked-gfm-heading-id 4.1.2 - GitHub Flavored Markdown heading IDs
- marked-mangle 1.1.11 - Mangle GitHub mentions in Markdown
- sanitize-html 2.17.0 - HTML sanitization for security
- jstoxml 7.0.1 - JavaScript to XML/RSS conversion

**UI & Icons:**
- @fortawesome/fontawesome-svg-core 7.0.0 - Font Awesome core
- @fortawesome/free-solid-svg-icons 7.0.0 - Font Awesome solid icons
- @fortawesome/free-brands-svg-icons 7.0.0 - Font Awesome brand icons
- fontawesome-svelte 3.0.0 - Svelte Font Awesome component wrapper
- svelte-confetti 2.3.2 - Confetti animation component

**Monitoring:**
- @vercel/analytics 2.0.1 - Vercel Web Analytics integration
- web-vitals 5.0.3 - Core Web Vitals metrics

**Type Definitions:**
- tslib 2.3.1 - TypeScript runtime library
- @types/jstoxml 5.0.0 - Types for jstoxml
- @types/sanitize-html 2.8.0 - Types for sanitize-html

## Configuration Files

**Build & Framework:**
- `svelte.config.js` - SvelteKit configuration using Vercel adapter
- `vite.config.js` - Vite build configuration with Svelte plugin
- `tsconfig.json` - TypeScript compilation settings
- `postcss.config.cjs` - PostCSS pipeline (TailwindCSS + Autoprefixer)
- `tailwind.config.cjs` - TailwindCSS theme customization with OW2-specific colors

**Development:**
- `.eslintrc.cjs` - ESLint rules for TypeScript and Svelte
- `.nvmrc` - Node.js version lock (v18)

## Environment Configuration

**Environment Variables:**
- Public (available in browser):
  - `PUBLIC_SUPABASE_URL` - Supabase project URL
  - `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous public key
  - `VERCEL_ANALYTICS_ID` - Vercel analytics tracking ID (defined in vite.config.js)

- Private (server-side only):
  - `SUPABASE_SERVICE_KEY` - Supabase service role key (admin access)
  - `SUPABASE_TABLE_NAME` - Supabase table name for events

**Configuration handled via:**
- Environment files (`.env.local` exists but not committed)
- Static environment variables via SvelteKit's `$env/static/public` and `$env/static/private`

## Platform Requirements

**Development:**
- Node.js 18+
- Yarn package manager
- TypeScript knowledge
- Basic understanding of Svelte and SvelteKit

**Production:**
- Deployment target: Vercel (via `@sveltejs/adapter-vercel`)
- Node.js 18+ runtime
- Environment variables for Supabase and Vercel Analytics

## Build Output

- **Command:** `yarn build` (runs `vite build`)
- **Artifacts:** Compiled files output to `.svelte-kit/` build directory
- **Sourcemaps:** Enabled (`build: { sourcemap: true }` in vite.config.js)
- **Deployment:** Vercel-optimized output ready for serverless functions

---

*Stack analysis: 2026-08-23*
