import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Toaster } from '@repo/ui';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <Link to="/" className="mr-6 flex items-center space-x-2">
                <span className="font-bold">React Monorepo</span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link
                  to="/"
                  className="transition-colors hover:text-foreground/80 [&.active]:text-foreground"
                  activeProps={{ className: 'text-foreground' }}
                  inactiveProps={{ className: 'text-foreground/60' }}
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className="transition-colors hover:text-foreground/80"
                  activeProps={{ className: 'text-foreground' }}
                  inactiveProps={{ className: 'text-foreground/60' }}
                >
                  About
                </Link>
                <Link
                  to="/dashboard"
                  className="transition-colors hover:text-foreground/80"
                  activeProps={{ className: 'text-foreground' }}
                  inactiveProps={{ className: 'text-foreground/60' }}
                >
                  Dashboard
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="container py-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <TanStackRouterDevtools />
    </>
  );
}
