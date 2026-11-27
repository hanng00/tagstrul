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
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-background pb-20">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-lg">
          {tabs.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-foreground" />
                  )}
                  <Icon
                    className="size-5"
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className="tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
