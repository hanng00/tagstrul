import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { HelmetProvider } from "react-helmet-async"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { PostHogProvider } from "@/components/PostHogProvider.tsx"
import { queryClient } from "@/lib/query-client"

// Patch DOM methods to handle Google Translate and other extensions that modify the DOM.
// When these tools replace text nodes with <font> elements, React loses track of the
// original nodes and crashes when trying to remove/insert them.
// This patch gracefully handles these cases by logging instead of throwing.
// See: https://github.com/facebook/react/issues/11538#issuecomment-417504600
if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn(
          "Cannot remove a child from a different parent (likely Google Translate interference)",
          child,
          this
        )
      }
      return child
    }
    return originalRemoveChild.apply(this, [child]) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn(
          "Cannot insert before a reference node from a different parent (likely Google Translate interference)",
          referenceNode,
          this
        )
      }
      return newNode
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T
  }
}

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
