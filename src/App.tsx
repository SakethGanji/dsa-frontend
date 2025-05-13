import { RouterProvider } from "@tanstack/react-router"
import { ThemeProvider } from "@/components/theme-provider"
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
                <RouterProvider router={router} />
            </ThemeProvider>
        </div>
    )
}

export default App