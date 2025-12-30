import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@repo/ui';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  const technologies = [
    { name: 'React 19', category: 'Framework' },
    { name: 'TypeScript 5', category: 'Language' },
    { name: 'Vite', category: 'Build Tool' },
    { name: 'Turborepo', category: 'Monorepo' },
    { name: 'pnpm', category: 'Package Manager' },
    { name: 'TanStack Router', category: 'Routing' },
    { name: 'Zustand', category: 'State' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'Shadcn/ui', category: 'Components' },
    { name: 'Vitest', category: 'Testing' },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">About This Project</h1>
        <p className="text-muted-foreground">
          A modern React monorepo built with best practices for 2025.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
          <CardDescription>Built with the latest and greatest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <Badge key={tech.name} variant="secondary">
                {tech.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shared Packages</CardTitle>
            <CardDescription>Reusable code across applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>@repo/ui</strong> - Component library with Shadcn/ui
            </p>
            <p>
              <strong>@repo/hooks</strong> - Custom React hooks
            </p>
            <p>
              <strong>@repo/utils</strong> - Utility functions
            </p>
            <p>
              <strong>@repo/types</strong> - Shared TypeScript types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
            <CardDescription>What makes this setup great</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Type-safe routing with TanStack Router</p>
            <p>Simple state management with Zustand</p>
            <p>Fast builds with Turborepo caching</p>
            <p>Shared configurations across packages</p>
            <p>Component documentation with Storybook</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
