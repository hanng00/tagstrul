import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router"],
          "vendor-ui": ["lucide-react", "class-variance-authority", "clsx", "tailwind-merge"],
          "vendor-aws": ["@aws-sdk/client-cognito-identity-provider"],
          "vendor-charts": ["recharts"],
          "vendor-stripe": ["@stripe/stripe-js", "@stripe/react-stripe-js"],
          "vendor-analytics": ["posthog-js"],
          "vendor-radix": ["radix-ui", "@base-ui/react"],
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
  },
})
