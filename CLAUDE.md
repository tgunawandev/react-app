# CLAUDE.md - Project Context for Claude Code

This file provides context for Claude Code when working with this repository.

## Project Overview

This is a React monorepo using Turborepo and pnpm workspaces. It contains multiple frontend applications and shared packages.

## Architecture

### Monorepo Structure
- **apps/** - Application projects
  - `web` - Main web app (React + Vite)
  - `admin` - Admin dashboard (React + Vite)
  - `frm-web` - FRM/SFA app with Frappe backend (React + Vite)
  - `docs` - Storybook for component documentation
- **packages/** - Shared libraries
  - `ui` - shadcn/ui component library
  - `hooks` - Shared React hooks
  - `utils` - Utility functions (cn, etc.)
  - `types` - Shared TypeScript types
  - `config-*` - Shared configurations

### Tech Stack
- React 19 + TypeScript
- Vite for bundling
- Tailwind CSS v4 (with @tailwindcss/vite plugin)
- shadcn/ui + Radix UI for components
- Vitest for testing
- pnpm workspaces
- Turborepo for build orchestration

## Key Conventions

### Package Naming
- Apps: `@app/<name>` (e.g., `@app/web`, `@app/frm-web`)
- Packages: `@repo/<name>` (e.g., `@repo/ui`, `@repo/hooks`)

### Import Patterns
```typescript
// Import from shared packages
import { Button, Card, Dialog } from '@repo/ui'
import { cn } from '@repo/utils'
import { useLocalStorage } from '@repo/hooks'

// Import within apps using @ alias
import { MyComponent } from '@/components/MyComponent'
```

### Component Structure
Components follow shadcn/ui patterns:
- Use `class-variance-authority` for variants
- Use `cn()` utility for className merging
- Export all parts from single file

### Styling
- Tailwind CSS v4 with CSS-first configuration
- CSS variables for theming (defined in index.css)
- Use `@import 'tailwindcss'` in CSS files
- No tailwind.config.js - use `@theme` in CSS

## FRM Web App Context

### Purpose
Field Resource Management (FRM) / Sales Force Automation (SFA) system.

### Features
- Route planning and execution
- Customer management
- Sales orders
- Deliveries and returns
- Payments and invoices
- Stock transfers
- GPS tracking with Leaflet maps
- Barcode/QR scanning
- Offline-capable PWA features

### Backend Integration
- Connects to Frappe/ERPNext backend via `frappe-react-sdk`
- API URL configured via `VITE_FRAPPE_URL` environment variable
- Cookie-based authentication with CORS
- Uses Frappe doctypes for data models

### Type Definitions
FRM types are in `apps/frm-web/src/types/frm/`:
- Customer, Item, SalesOrder, Invoice, Payment, etc.
- All types follow Frappe doctype structure

## Common Tasks

### Add a new app
```bash
mkdir apps/new-app
# Copy config from apps/web as template
# Update package.json name to @app/new-app
```

### Add component to @repo/ui
1. Create component in `packages/ui/src/components/`
2. Export from `packages/ui/src/index.ts`
3. Add any new Radix dependencies to package.json

### Run specific app
```bash
pnpm dev --filter=@app/web
pnpm build --filter=@app/frm-web
```

### Install dependency to specific package
```bash
pnpm add <package> --filter=@app/frm-web
pnpm add -D <package> --filter=@repo/ui
```

## Build Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all apps
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all packages
```

## Notes for Development

1. **Tailwind v4**: Uses CSS-first config, not JS config file
2. **React 19**: Uses new features, ensure compatibility
3. **TypeScript**: Strict mode in packages, relaxed in frm-web (migrated code)
4. **Frappe SDK**: frm-web uses `frappe-react-sdk` for API calls
5. **Workspace protocol**: Use `workspace:*` for internal dependencies
