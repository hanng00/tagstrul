import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { OnboardingGuard } from "@/components/OnboardingGuard"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { PWAInstallBanner } from "@/components/PWAInstallBanner"
import { CookieConsentBanner } from "@/components/CookieConsentBanner"
import { PostHogPageTracker } from "@/components/PostHogProvider"
import { Toaster } from "@/components/ui/sonner"
import { LandingPage } from "@/pages/LandingPage"
import { PosterPage } from "@/pages/PosterPage"
import { AboutPage } from "@/pages/AboutPage"
import { PrivacyPage } from "@/pages/PrivacyPage"
import { TermsPage } from "@/pages/TermsPage"
import { CookiePage } from "@/pages/CookiePage"
import { RouteIndexPage } from "@/pages/RouteIndexPage"
import { RoutePage } from "@/pages/RoutePage"
import { BlogIndexPage } from "@/pages/BlogIndexPage"
import { BlogPostPage } from "@/pages/BlogPostPage"

const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
)
const OnboardingPage = lazy(() =>
  import("@/pages/OnboardingPage").then((m) => ({ default: m.OnboardingPage }))
)
const AppLayout = lazy(() =>
  import("@/components/AppLayout").then((m) => ({ default: m.AppLayout }))
)
const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage }))
)
const ClaimPage = lazy(() =>
  import("@/pages/ClaimPage").then((m) => ({ default: m.ClaimPage }))
)
const RoutesPage = lazy(() =>
  import("@/pages/RoutesPage").then((m) => ({ default: m.RoutesPage }))
)
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
)
const DesignSystemPage = lazy(() =>
  import("@/pages/DesignSystemPage").then((m) => ({ default: m.DesignSystemPage }))
)
const ThankYouPage = lazy(() =>
  import("@/features/donations").then((m) => ({ default: m.ThankYouPage }))
)
const AdminPage = lazy(() =>
  import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage }))
)

function PageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <PostHogPageTracker />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/poster" element={<PosterPage />} />
            <Route path="/om" element={<AboutPage />} />
            <Route path="/integritet" element={<PrivacyPage />} />
            <Route path="/villkor" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiePage />} />
            <Route path="/stracka" element={<RouteIndexPage />} />
            <Route path="/stracka/:route" element={<RoutePage />} />
            <Route path="/blogg" element={<BlogIndexPage />} />
            <Route path="/blogg/:slug" element={<BlogPostPage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
            <Route path="/tack" element={<ThankYouPage />} />
            <Route path="/admin" element={<AdminPage />} />
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
        </Suspense>
        <PWAInstallBanner />
        <CookieConsentBanner />
        <Toaster position="bottom-center" />
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
