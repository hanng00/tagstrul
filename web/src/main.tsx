import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { HelmetProvider } from "react-helmet-async"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { PostHogProvider } from "@/components/PostHogProvider.tsx"
import { queryClient } from "@/lib/query-client"

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <PostHogProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            <App />
          </ThemeProvider>
        </QueryClientProvider>
      </PostHogProvider>
    </HelmetProvider>
  </StrictMode>,
)
