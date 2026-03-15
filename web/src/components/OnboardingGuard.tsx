import { Navigate, Outlet, useLocation } from "react-router"
import { useProfile } from "@/lib/queries"
import { Loader2 } from "lucide-react"

export function OnboardingGuard() {
  const location = useLocation()
  const { data: profile, isLoading } = useProfile()

  const isOnboardingPage = location.pathname === "/onboarding"

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasCompletedOnboarding = profile?.onboardingComplete === true

  if (!hasCompletedOnboarding && !isOnboardingPage) {
    return <Navigate to="/onboarding" replace />
  }

  if (hasCompletedOnboarding && isOnboardingPage) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
