import { Navigate, Outlet, useLocation } from "react-router"
import { useProfile } from "@/lib/queries"
import { TrainLoader } from "@/components/ui/train-loader"

export function OnboardingGuard() {
  const location = useLocation()
  const { data: profile, isLoading } = useProfile()

  const isOnboardingPage = location.pathname === "/onboarding"

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <TrainLoader size="lg" />
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
