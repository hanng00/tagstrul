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
  /** Keep the band pinned while scrolling. Off for tall headers. */
  sticky?: boolean
}

/**
 * The blue sign band at the top of every app screen, ending in the
 * yellow platform edge. Content inside reads the board tokens.
 */
export function PageHeader({ children, className, sticky = true }: PageHeaderProps) {
  return (
    <header className={cn("board-scope z-40 mb-5 safe-top", sticky && "sticky top-0")}>
      <div className={cn("app-padding pt-6 pb-5", className)}>{children}</div>
      <div className="platform-edge" aria-hidden />
    </header>
  )
}

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-background pb-20">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-safe">
        <div className="mx-auto flex max-w-lg">
          {tabs.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1 pt-3 pb-2.5 text-[11px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 ${
                  isActive
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -top-px inset-x-4 h-1 bg-signal" />
                  )}
                  <Icon
                    className="size-5"
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
