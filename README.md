# React App Monorepo

A modern React monorepo built with Turborepo and pnpm workspaces, featuring multiple applications and shared packages.

## Tech Stack

- **Build System:** [Turborepo](https://turbo.build/) for fast, incremental builds
- **Package Manager:** [pnpm](https://pnpm.io/) with workspaces
- **Framework:** [React 19](https://react.dev/) with TypeScript
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) with Radix UI primitives
- **Testing:** [Vitest](https://vitest.dev/)
- **Documentation:** [Storybook](https://storybook.js.org/)

## Project Structure

```
react-app/
├── apps/
│   ├── web/              # Main web application
│   ├── admin/            # Admin dashboard
│   ├── frm-web/          # FRM (Field Resource Management) app
│   └── docs/             # Storybook documentation
├── packages/
│   ├── ui/               # Shared UI component library (shadcn/ui)
│   ├── hooks/            # Shared React hooks
│   ├── utils/            # Shared utility functions
│   ├── types/            # Shared TypeScript types
│   ├── config-typescript/# Shared TypeScript configurations
│   ├── config-eslint/    # Shared ESLint configurations
│   └── config-tailwind/  # Shared Tailwind CSS configurations
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── package.json          # Root package configuration
```

## Applications

### Web (`apps/web`)
Main web application template with React Router, authentication, and full shadcn/ui integration.

### Admin (`apps/admin`)
Admin dashboard application for internal management.

### FRM Web (`apps/frm-web`)
Field Resource Management (FRM) application - a comprehensive sales force automation (SFA) system with:
- Route management and optimization
- Customer management
- Sales order processing
- Delivery tracking
- Payment collection
- Stock management
- GPS tracking and mapping (Leaflet)
- Barcode/QR scanning
- Real-time sync with Frappe backend

### Docs (`apps/docs`)
Storybook documentation for the shared UI component library.

## Shared Packages

### UI (`@repo/ui`)
Shared component library built with shadcn/ui patterns:
- 30+ pre-built components (Button, Card, Dialog, Form, Table, etc.)
- Radix UI primitives for accessibility
- Tailwind CSS styling with CSS variables for theming
- Full TypeScript support

### Hooks (`@repo/hooks`)
Shared React hooks for common functionality.

### Utils (`@repo/utils`)
Shared utility functions including `cn()` for className merging.

### Types (`@repo/types`)
Shared TypeScript type definitions.

### Config Packages
- `@repo/config-typescript` - Shared TypeScript configurations
- `@repo/config-eslint` - Shared ESLint configurations
- `@repo/config-tailwind` - Shared Tailwind CSS configurations

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/tgunawandev/react-app.git
cd react-app

# Install dependencies
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run a specific app
pnpm dev --filter=@app/web
pnpm dev --filter=@app/admin
pnpm dev --filter=@app/frm-web
pnpm dev --filter=docs

# Run Storybook
pnpm dev --filter=docs
```

### Build

```bash
# Build all apps
pnpm build

# Build a specific app
pnpm build --filter=@app/web
pnpm build --filter=@app/frm-web
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm test --filter=@repo/ui
```

### Linting

```bash
# Lint all packages
pnpm lint

# Lint a specific package
pnpm lint --filter=@app/web
```

### Type Checking

```bash
# Type check all packages
pnpm typecheck
```

## FRM Web Configuration

The FRM Web app connects to a Frappe backend. Configure the environment:

```bash
# apps/frm-web/.env.development
VITE_FRAPPE_URL=https://frappe.kodeme.io

# apps/frm-web/.env.production
VITE_FRAPPE_URL=https://frappe.kodeme.io
```

### CORS Configuration

Ensure your Frappe server allows CORS from your frontend domain:

```json
// site_config.json
{
  "allow_cors": "https://your-frontend-domain.com",
  "allow_credentials": true
}
```

## Adding New Components

To add new shadcn/ui components to the shared UI package:

1. Navigate to packages/ui
2. Add the component file in `src/components/`
3. Export from `src/index.ts`
4. Update dependencies in `package.json` if needed

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type check all packages |
| `pnpm clean` | Clean all build outputs |

## License

MIT
