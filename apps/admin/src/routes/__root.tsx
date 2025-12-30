import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Toaster, Button, Avatar, AvatarFallback, Separator } from '@repo/ui';
import { LayoutDashboard, Users, Settings, FileText, LogOut } from 'lucide-react';

export const Route = createRootRoute({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card">
          <div className="flex h-14 items-center border-b px-4">
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            <Link to="/">
              {({ isActive }) => (
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              )}
            </Link>
            <Link to="/users">
              {({ isActive }) => (
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Button>
              )}
            </Link>
            <Link to="/content">
              {({ isActive }) => (
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Content
                </Button>
              )}
            </Link>
            <Link to="/settings">
              {({ isActive }) => (
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              )}
            </Link>
          </nav>
          <Separator className="my-2" />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@example.com</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-6">
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
      <TanStackRouterDevtools />
    </>
  );
}
