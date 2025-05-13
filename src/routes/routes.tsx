import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from './root'
import { DatasetsPage } from './pages/datasets'
import { ExplorationPage } from './pages/exploration'
import { SamplingPage } from './pages/sampling'
import { OutputsPage } from './pages/outputs'

// Define the root route
export const rootRoute = createRootRoute({
  component: RootLayout,
})

// Define child routes
export const datasetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DatasetsPage,
})

export const explorationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exploration',
  component: ExplorationPage,
})

export const samplingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sampling',
  component: SamplingPage,
})

export const outputsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/outputs',
  component: OutputsPage,
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  datasetsRoute,
  explorationRoute,
  samplingRoute,
  outputsRoute,
])

// Create the router
export const router = createRouter({ routeTree })

// Type-safe route definitions
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}