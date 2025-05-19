import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { RootLayout } from './root'
import { DatasetsPage } from './pages/datasets'
import { ExplorationPage } from './pages/exploration'
import { SamplingPage } from './pages/sampling'
import { OutputsPage } from './pages/outputs'
import { LoginPage } from './pages/login'
import { ProtectedRoute } from '../components/auth/protected-route'
import { AuthProvider } from '../components/providers/auth-provider' // Added import
import { Toaster } from '@/components/ui/toaster' // Added import

// Define the root route
export const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  ),
})

// Login route - not protected, accessible to everyone
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

// Protected layout - only accessible when authenticated
export const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: () => (
    <ProtectedRoute>
      <RootLayout />
    </ProtectedRoute>
  ),
})

// Define protected child routes
export const datasetsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/',
  component: DatasetsPage,
})

export const explorationRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/exploration',
  component: ExplorationPage,
})

export const samplingRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/sampling',
  component: SamplingPage,
})

export const outputsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/outputs',
  component: OutputsPage,
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedLayoutRoute.addChildren([
    datasetsRoute,
    explorationRoute,
    samplingRoute,
    outputsRoute,
  ])
])

// Create the router
export const router = createRouter({ routeTree })

// Type-safe route definitions
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

