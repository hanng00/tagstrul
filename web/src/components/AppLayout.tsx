import type { ReactNode } from "react"
import { NavLink, Outlet } from "react-router"
import { Home, Route, User } from "lucide-react"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { cn } from "@/lib/utils"

const tabs = [
  { to: "/app", icon: Home, label: "Hem", end: true },
  { to: "/app/routes", icon: Route, label: "Pendlingar", end: false },
  { to: "/app/profile", icon: User, label: "Profil", end: false },
] as const

interface PageHeaderProps {
  children: ReactNode
  className?: string
}

export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background/80 backdrop-blur-xl backdrop-saturate-150 app-padding pt-6 pb-4",
        className
      )}
    >
      {children}
    </header>
  )
}

export function AppLayout() {
  return (
    <AppChrome>
      <Outlet />
    </AppChrome>
  )
}

/**
 * The app frame: page content plus the bottom tab bar.
 * `activeTab` forces a tab to look selected, for previews outside /app.
 */
export function AppChrome({ children, activeTab }: { children: ReactNode; activeTab?: string }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-background pb-20">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-safe">
        <div className="mx-auto flex max-w-lg">
          {tabs.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive: routeActive }) => {
                const isActive = activeTab ? activeTab === to : routeActive
                return `relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors ${
                  isActive
                    ? "font-semibold text-primary"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`
              }}
            >
              {({ isActive: routeActive }) => {
                const isActive = activeTab ? activeTab === to : routeActive
                return (
                  <>
                    <Icon className="size-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
                    <span>{label}</span>
                  </>
                )
              }}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
