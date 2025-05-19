import { RouterProvider } from "@tanstack/react-router"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { router } from "@/routes/routes"

// Register router for HMR
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

function App() {
    return (
        <div>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <QueryProvider>
                    <RouterProvider router={router} />
                </QueryProvider>
            </ThemeProvider>
        </div>
    )
}

export default App

