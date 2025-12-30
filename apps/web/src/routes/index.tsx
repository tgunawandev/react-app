import { createFileRoute } from '@tanstack/react-router';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { useCounterStore } from '@/stores/counter-store';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to React Monorepo</h1>
        <p className="text-muted-foreground">
          A production-ready monorepo setup with Turborepo, React 19, TanStack Router, and Zustand.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Zustand Counter</CardTitle>
            <CardDescription>Simple state management example</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-center">{count}</div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={decrement}>
                -
              </Button>
              <Button onClick={increment}>+</Button>
              <Button variant="ghost" onClick={reset}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shared UI Components</CardTitle>
            <CardDescription>Components from @repo/ui package</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This card and all buttons come from the shared UI library built with Shadcn/ui.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm">Default</Button>
              <Button size="sm" variant="secondary">
                Secondary
              </Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
              <Button size="sm" variant="ghost">
                Ghost
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TanStack Router</CardTitle>
            <CardDescription>Type-safe routing with devtools</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              File-based routing with full TypeScript support. Check the router devtools in the
              bottom right corner.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Monorepo Structure</h2>
        <pre className="text-sm text-muted-foreground overflow-x-auto">
          {`
├── apps/
│   ├── web/          # This app (port 3000)
│   ├── admin/        # Admin dashboard (port 3001)
│   └── docs/         # Storybook (port 6006)
├── packages/
│   ├── ui/           # Shared components
│   ├── hooks/        # Shared React hooks
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript types
└── configs/          # Shared configurations
          `.trim()}
        </pre>
      </div>
    </div>
  );
}
