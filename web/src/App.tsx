import { BrowserRouter, Routes, Route } from "react-router"
import { AuthProvider } from "@/components/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { OnboardingGuard } from "@/components/OnboardingGuard"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { PWAInstallBanner } from "@/components/PWAInstallBanner"
import { PostHogPageTracker } from "@/components/PostHogProvider"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { OnboardingPage } from "@/pages/OnboardingPage"
import { AppLayout } from "@/components/AppLayout"
import { HomePage } from "@/pages/HomePage"
import { ClaimPage } from "@/pages/ClaimPage"
import { RoutesPage } from "@/pages/RoutesPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { PosterPage } from "@/pages/PosterPage"
import { ThankYouPage } from "@/features/donations"

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <PostHogPageTracker />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/poster" element={<PosterPage />} />
            <Route path="/tack" element={<ThankYouPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<OnboardingGuard />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="claim/:delayId" element={<ClaimPage />} />
                  <Route path="routes" element={<RoutesPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
          <PWAInstallBanner />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
