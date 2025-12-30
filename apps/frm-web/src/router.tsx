/**
 * React Router Configuration
 * Main routing setup for FRM app with protected routes
 */

import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Skeleton } from '@repo/ui';

// Redirect wrapper for legacy routes with params
const RouteRedirect = () => {
  const { routeId } = useParams();
  return <Navigate to={`/routes/visits/${routeId}`} replace />;
};

const StopRedirect = () => {
  const { routeId, stopIdx } = useParams();
  return <Navigate to={`/routes/visits/${routeId}/stop/${stopIdx}`} replace />;
};

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Settings = lazy(() => import('@/pages/Settings'));
const Customers = lazy(() => import('@/pages/Customers'));
const VisitFlowPage = lazy(() => import('@/pages/visit/VisitFlowPage'));
const ActivitiesPage = lazy(() => import('@/pages/visit/ActivitiesPage'));

const Home = lazy(() => import('@/pages/Home'));
const Reports = lazy(() => import('@/pages/Reports'));
const Entities = lazy(() => import('@/pages/Entities'));
const Scanner = lazy(() => import('@/pages/Scanner'));
const NotificationCenter = lazy(() => import('@/pages/NotificationCenter'));
const RoutePlanPage = lazy(() => import('@/pages/RoutePlanPage'));
const StockPage = lazy(() => import('@/pages/StockPage'));
const Visit = lazy(() => import('@/pages/Visit'));

// Routes Hub Page
const Routes = lazy(() => import('@/pages/Routes'));

// Route-First Architecture Pages (Visit Routes)
const RoutesList = lazy(() => import('@/pages/routes/RoutesList'));
const RoutesToday = lazy(() => import('@/pages/routes/RoutesToday'));
const RouteDetail = lazy(() => import('@/pages/routes/RouteDetail'));
const StopExecution = lazy(() => import('@/pages/routes/StopExecution'));

// Delivery Routes Pages
const DeliveriesToday = lazy(() => import('@/pages/routes/DeliveriesToday'));
const DeliveriesPending = lazy(() => import('@/pages/routes/DeliveriesPending'));
const DeliveryHistory = lazy(() => import('@/pages/routes/DeliveryHistory'));
const DeliverySchedules = lazy(() => import('@/pages/routes/DeliverySchedules'));

// Entity list pages (modal-based CRUD)
const Products = lazy(() => import('@/pages/Products'));
const Orders = lazy(() => import('@/pages/Orders'));
const Payments = lazy(() => import('@/pages/Payments'));
const DeliveryReturns = lazy(() => import('@/pages/DeliveryReturns'));
const ActivityTemplateList = lazy(() => import('@/pages/ActivityTemplateList'));

// Invoices pages
const Invoices = lazy(() => import('@/pages/Invoices'));
const InvoiceDetail = lazy(() => import('@/pages/InvoiceDetail'));

// Deliveries pages
const Deliveries = lazy(() => import('@/pages/Deliveries'));
const DriverDashboard = lazy(() => import('@/pages/DriverDashboard'));

// Stock Transfer pages (Hub Driver)
const StockTransfers = lazy(() => import('@/pages/StockTransfers'));
const StockTransferDetail = lazy(() => import('@/pages/StockTransferDetail'));

// Loading fallback component
const PageLoader = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-64 w-full" />
  </div>
);

// Route configuration
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <AppLayout />
          </Suspense>
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/home" replace />,
        },
        {
          path: 'home',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Home />
            </Suspense>
          ),
        },
        {
          path: 'dashboard',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          ),
        },
        {
          path: 'entities',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Entities />
            </Suspense>
          ),
        },
        {
          path: 'scanner',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Scanner />
            </Suspense>
          ),
        },
        {
          path: 'visit',
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={<PageLoader />}>
                  <Visit />
                </Suspense>
              ),
            },
            {
              path: 'start',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <VisitFlowPage />
                </Suspense>
              ),
            },
            {
              path: ':visitId/activities',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <ActivitiesPage />
                </Suspense>
              ),
            },
          ],
        },
        {
          path: 'customers',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Customers />
            </Suspense>
          ),
        },
        {
          path: 'products',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Products />
            </Suspense>
          ),
        },
        {
          path: 'orders',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Orders />
            </Suspense>
          ),
        },
        {
          path: 'invoices',
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={<PageLoader />}>
                  <Invoices />
                </Suspense>
              ),
            },
            {
              path: ':invoiceId',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <InvoiceDetail />
                </Suspense>
              ),
            },
          ],
        },
        {
          path: 'payments',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Payments />
            </Suspense>
          ),
        },
        {
          path: 'deliveries',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Deliveries />
            </Suspense>
          ),
        },
        {
          path: 'driver',
          element: (
            <Suspense fallback={<PageLoader />}>
              <DriverDashboard />
            </Suspense>
          ),
        },
        {
          path: 'transfers',
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={<PageLoader />}>
                  <StockTransfers />
                </Suspense>
              ),
            },
            {
              path: ':id',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <StockTransferDetail />
                </Suspense>
              ),
            },
          ],
        },
        {
          path: 'delivery-returns',
          element: (
            <Suspense fallback={<PageLoader />}>
              <DeliveryReturns />
            </Suspense>
          ),
        },
        {
          path: 'activity-templates',
          element: (
            <Suspense fallback={<PageLoader />}>
              <ActivityTemplateList />
            </Suspense>
          ),
        },
        {
          path: 'routes',
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={<PageLoader />}>
                  <Routes />
                </Suspense>
              ),
            },
            // Backwards compatibility redirects
            {
              path: 'today',
              element: <Navigate to="/routes/visits/today" replace />,
            },
            // Visit Routes
            {
              path: 'visits/today',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <RoutesToday />
                </Suspense>
              ),
            },
            {
              path: 'visits/history',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <RoutesList />
                </Suspense>
              ),
            },
            {
              path: 'visits/plan',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <RoutePlanPage />
                </Suspense>
              ),
            },
            {
              path: 'visits/:routeId',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <RouteDetail />
                </Suspense>
              ),
            },
            {
              path: 'visits/:routeId/stop/:stopIdx',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <StopExecution />
                </Suspense>
              ),
            },
            // Delivery Routes
            {
              path: 'deliveries/today',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <DeliveriesToday />
                </Suspense>
              ),
            },
            {
              path: 'deliveries/pending',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <DeliveriesPending />
                </Suspense>
              ),
            },
            {
              path: 'deliveries/history',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <DeliveryHistory />
                </Suspense>
              ),
            },
            {
              path: 'deliveries/schedules',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <DeliverySchedules />
                </Suspense>
              ),
            },
            // Stock Transfer Routes (Hub Driver)
            {
              path: 'transfers/today',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <StockTransfers />
                </Suspense>
              ),
            },
            {
              path: 'transfers/history',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <StockTransfers />
                </Suspense>
              ),
            },
            {
              path: 'transfers/:id',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <StockTransferDetail />
                </Suspense>
              ),
            },
            // Legacy route detail redirect (for bookmarked URLs)
            {
              path: ':routeId',
              element: <RouteRedirect />,
            },
            {
              path: ':routeId/stop/:stopIdx',
              element: <StopRedirect />,
            },
          ],
        },
        {
          path: 'stock',
          element: (
            <Suspense fallback={<PageLoader />}>
              <StockPage />
            </Suspense>
          ),
        },
        {
          path: 'reports',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          ),
        },
        {
          path: 'notifications',
          element: (
            <Suspense fallback={<PageLoader />}>
              <NotificationCenter />
            </Suspense>
          ),
        },
        {
          path: 'settings',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/home" replace />,
    },
  ],
  {
    basename: import.meta.env.VITE_APP_BASENAME || '/',
  }
);

export default router;
